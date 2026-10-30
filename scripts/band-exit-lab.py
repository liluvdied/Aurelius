#!/usr/bin/env python3
"""BAND EXIT LAB (Claude, Oct 5 ~3:30 PM PT, Love: "she gets out IF there is a 5M close on the other side of the band").
For every settled paper trade whose entry names a line (5m/10m/15m purple or upper/lower, a session sigma band, VWAP):
walk the trade's own 5-minute closes (data/nav-tape.json, the desk's own feed) and the line's value at that moment.
Long: the first 5m close BELOW the line = out. Short: the first 5m close ABOVE the line = out.
Sold at the Kalshi bid of that minute (data/stop-lab-candles.json minute close, 1c under). Only counts if it lands before
the book's own exit. Reports, per book: how many it took out, how many it saved (lost less than the real result), how many
it cut that came back and won, and net dollars vs what the book really did.
usage: python3 scripts/band-exit-lab.py [--since ISO] [book ...]"""
import json, os, re, sys, calendar
from datetime import datetime

D = os.path.join(os.getcwd(), "data")
args = sys.argv[1:]
since = None
if "--since" in args:
    i = args.index("--since"); since = args[i + 1]; del args[i:i + 2]
books = args or ["brick", "brickc", "cotc", "claude", "trend", "sole5p", "bank5p"]

tape = {}
for r in json.load(open(os.path.join(D, "nav-tape.json"))):
    tape.setdefault(r["a"], {})[r["t"]] = r
cand = json.load(open(os.path.join(D, "stop-lab-candles.json")))["candles"]
rows = {}
for line in open(os.path.join(D, "exit-ledger.jsonl")):
    try:
        r = json.loads(line); rows[r["id"]] = r
    except Exception:
        pass
for r in json.load(open(os.path.join(D, "night-book.json"))):
    if r.get("result") != "open" and r.get("pnl") is not None and r.get("bell") in ("yes", "no"):
        rows[r["id"]] = r

def ts(s): return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
def close_of(t):
    m = re.search(r"-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)", t)
    mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].index(m.group(2))
    return calendar.timegm((2000 + int(m.group(1)), mon + 1, int(m.group(3)), int(m.group(4)) + (4 if 2 <= mon <= 9 else 5), int(m.group(5)), 0))

def line_fn(setup):
    s = setup or ""
    m = re.search(r"(1|5|10|15)m (?:nav )?(purple|upper|lower)", s)
    if m:
        k = "m" + m.group(1); j = {"purple": 0, "upper": 1, "lower": 2}[m.group(2)]
        return f"{m.group(1)}m {m.group(2)}", (lambda row, k=k, j=j: (row.get(k) or [None, None, None])[j])
    m = re.search(r"([+\-−]?\d+(?:\.\d+)?)σ", s)
    if m:
        x = float(m.group(1).replace("−", "-"))
        return f"{m.group(1)}σ", (lambda row, x=x: row["vw"] + x * row["sd"] if row.get("vw") and row.get("sd") else None)
    if re.search(r"VWAP", s, re.I):
        return "VWAP", (lambda row: row.get("vw"))
    return None, None

def bid_at(tk, side, t):
    for (end, bl, bh, bc, al, ah, ac) in cand.get(tk, []):
        if end >= t:
            if side == "up": return bc
            return None if ac is None else round(1 - ac, 4)
    return None

out = {}
for b in books:
    tot = n = noline = nodata = 0
    base = 0.0; new_total = 0.0
    took = saved = cameback = 0; d_saved = d_given = 0.0
    for r in rows.values():
        if r.get("book") != b or r.get("stale") or r.get("dnaMode") or r.get("bell") not in ("yes", "no"): continue
        if since and r["at"] < since.replace("Z", ""): continue
        tk = r.get("ticker") or r["id"].split(":")[0]
        name, fn = line_fn(r.get("setup"))
        tot += 1
        if not fn:
            noline += 1; continue
        a = r.get("asset"); tp = tape.get(a, {})
        t0 = ts(r["at"]); close = close_of(tk)
        t_exit = ts(r["soldAt"]) if r.get("result") == "sold" and r.get("soldAt") else close
        if tk not in cand or not tp:
            nodata += 1; continue
        n += 1; base += r["pnl"]; new = r["pnl"]
        start = int(t0 // 300 * 300 + 300 + 60)  # the first 5m close after the entry, read one minute later
        for t in range(start, int(min(t_exit, close)), 300):
            row = tp.get(t)
            if not row: continue
            L = fn(row); c5 = row.get("c5")
            if L is None or c5 is None: continue
            wrong = c5 < L if r["side"] == "up" else c5 > L
            if wrong:
                bid = bid_at(tk, r["side"], t)
                if bid is None: break
                new = round(r["stake"] / r["ask"] * max(bid - 0.01, 0) - r["stake"], 2)
                took += 1
                if new > r["pnl"]: saved += 1; d_saved += new - r["pnl"]
                else:
                    if r["pnl"] > 0: cameback += 1
                    d_given += r["pnl"] - new
                break
        new_total += new
    out[b] = dict(trades=tot, tested=n, noline=noline, nodata=nodata, base=round(base, 2), new=round(new_total, 2), took=took, saved=saved, cameback=cameback, dS=round(d_saved, 2), dG=round(d_given, 2))
    x = out[b]
    print(f"{b.upper():8s} tested {n:3d} (of {tot}; {noline} name no line)  now ${base:9.2f} -> with 5m-close exit ${new_total:9.2f}  ({new_total-base:+.2f})  "
          f"took out {took}: saved {saved} (+${d_saved:.0f}), cut then came back+won {cameback} (-${d_given:.0f})")
json.dump(out, open(os.path.join(D, "band-exit-lab.json"), "w"), indent=1)
