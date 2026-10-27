#!/usr/bin/env python3
"""STOP LAB (Claude, Oct 5, Love's ask): would a stop-loss have helped her paper books?
Replays every settled paper trade minute by minute on Kalshi's real 1-minute candles (data/stop-lab-candles.json) and
tests: "if the trade is down L% or more on a minute's closing bid, with M minutes or less left, sell it there".
Uses the minute CLOSE (not the low: empty-book wicks to 0c would fake stops) and sells 1c under that bid.
A stop only counts if it fires before the paper book's own exit (take profit / gate / lock).
For every rule: how many trades it cut, how many of those it SAVED (they lost anyway, it lost less), how many REVERSED
(the trade came back and won, the cut gave the win away), and the net dollars vs what the book really did.
usage: python3 scripts/stop-lab.py [--since 2026-10-05T22:00Z] [book ...]   (default: brick)
--since keeps only trades entered after that moment (the out-of-sample paper test)."""
import json, os, sys
from datetime import datetime

D = os.path.join(os.getcwd(), "data")
args = sys.argv[1:]
since = None
if "--since" in args:
    i = args.index("--since"); since = args[i + 1]; del args[i:i + 2]
books = args or ["brick"]
cand = json.load(open(os.path.join(D, "stop-lab-candles.json")))["candles"]

rows = {}
for line in open(os.path.join(D, "exit-ledger.jsonl")):
    try:
        r = json.loads(line)
    except Exception:
        continue
    rows[r["id"]] = r
for r in json.load(open(os.path.join(D, "night-book.json"))):
    if r.get("result") != "open" and r.get("pnl") is not None and r.get("bell") in ("yes", "no"):
        rows[r["id"]] = r

def ts(s):
    return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp() if s else None

def close_of(t):
    import re, calendar
    m = re.search(r"-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)", t)
    mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].index(m.group(2))
    off = 4 if 2 <= mon <= 9 else 5
    return calendar.timegm((2000 + int(m.group(1)), mon + 1, int(m.group(3)), int(m.group(4)) + off, int(m.group(5)), 0))

trades = []
for r in rows.values():
    if since and r["at"] < since.replace("Z", ""):
        continue
    if r.get("book") not in books or r.get("stale") or r.get("dnaMode") or r.get("bell") not in ("yes", "no"):
        continue
    tk = r.get("ticker") or r["id"].split(":")[0]
    cs = cand.get(tk)
    if not cs:
        continue
    t0, close = ts(r["at"]), close_of(tk)
    t_exit = ts(r.get("soldAt")) if r.get("result") == "sold" else close
    path = []
    for (end, bl, bh, bc, al, ah, ac) in cs:
        if end - 60 < t0 or end > close:  # only whole minutes after the entry
            continue
        bid = bc if r["side"] == "up" else (None if ac is None else round(1 - ac, 4))
        if bid is None:
            continue
        path.append((end, (close - end) / 60, bid))
    won = (r["bell"] == "yes") == (r["side"] == "up")
    trades.append({"id": r["id"], "asset": r.get("asset"), "ask": r["ask"], "stake": r["stake"], "pnl": r["pnl"], "won": won,
                   "t_exit": t_exit, "path": path, "exit": r.get("exit") or ""})

if not trades:
    print("no trades with candles yet"); sys.exit()
base = sum(t["pnl"] for t in trades)
print(f"{', '.join(b.upper() for b in books)}: {len(trades)} paper trades with real 1-minute prices · what she really made: ${base:,.2f} (paper stakes)")
print(f"  won at the bell: {sum(t['won'] for t in trades)} · lost at the bell: {sum(not t['won'] for t in trades)}\n")

def run(L, M):
    cut = saved = reversed_ = 0
    d_saved = d_given = 0.0
    total = 0.0
    for t in trades:
        new = t["pnl"]
        for (end, left, bid) in t["path"]:
            if end > t["t_exit"]:
                break
            pct = (bid / t["ask"] - 1) * 100
            if pct <= -L and left <= M:
                sell = max(bid - 0.01, 0.0)
                new = round(t["stake"] / t["ask"] * sell - t["stake"], 2)
                cut += 1
                if new > t["pnl"]:
                    saved += 1; d_saved += new - t["pnl"]
                else:
                    if t["pnl"] > 0: reversed_ += 1
                    d_given += t["pnl"] - new
                break
        total += new
    return {"L": L, "M": M, "cut": cut, "saved": saved, "rev": reversed_, "dS": d_saved, "dG": d_given, "total": total, "delta": total - base}

res = [run(L, M) for L in (20, 30, 40, 50, 60, 70, 80) for M in (15, 10, 7, 5, 3)]
print("  stop        when               cut  saved  came back+won   $ saved   $ given up   net vs now")
for x in res:
    when = "any time" if x["M"] == 15 else f"≤{x['M']} min left"
    print(f"  down {x['L']:>2}%  {when:16s} {x['cut']:5d} {x['saved']:6d} {x['rev']:13d}   {x['dS']:8.2f}   {x['dG']:10.2f}   {x['delta']:+9.2f}")
best = sorted(res, key=lambda x: -x["delta"])[:5]
print("\n  best five: " + " | ".join(f"down {x['L']}% {'any time' if x['M']==15 else '≤'+str(x['M'])+'m'} {x['delta']:+.0f}" for x in best))
json.dump({"books": books, "n": len(trades), "base": base, "grid": res}, open(os.path.join(D, f"stop-lab-{'-'.join(books)}.json"), "w"), indent=1)
