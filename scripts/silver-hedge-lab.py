#!/usr/bin/env python3
"""SILVER HEDGE LAB (Claude, Oct 5 ~9 PM PT, Love: "maybe we can hedge gold with silver? if a trade is going out of our favor
on gold we can enter on silver... see if that may have any validity"). READ ONLY.
For every gold paper trade (BRICK replay Sep 20-Oct 5 + every real paper book Oct 4-6): walk the gold bid minute by minute
(Kalshi 1m candles); the first minute the gold trade is down X% or more with M+ minutes left, buy the OTHER side of silver's
15-minute market for the same window (gold long -> silver Down) at silver's ask that minute, $10, held to the bell.
Questions: how often does that silver ticket win, vs the price paid (break-even)? does it pay for the gold losses?"""
import json, os, re, calendar
D = os.path.join(os.getcwd(), "data")
cand = json.load(open(os.path.join(D, "stop-lab-candles.json")))["candles"]
def close_of(t):
    m = re.search(r"-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)", t)
    mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].index(m.group(2))
    return calendar.timegm((2000 + int(m.group(1)), mon + 1, int(m.group(3)), int(m.group(4)) + (4 if 2 <= mon <= 9 else 5), int(m.group(5)), 0))
def result(tk):
    cs = cand.get(tk)
    if not cs: return None
    for c in reversed([c for c in cs if c[0] <= close_of(tk) + 60]):
        bc, ac = c[3], c[6]
        if bc is not None and ac is not None and bc <= 0.001 and ac >= 0.999: continue  # empty book after the close
        if bc is not None and bc >= 0.9: return "yes"
        if ac is not None and ac <= 0.1: return "no"
        return None
    return None
def side_bid(c, side): return c[3] if side == "up" else (None if c[6] is None else 1 - c[6])
def side_ask(c, side): return c[6] if side == "up" else (None if c[3] is None else 1 - c[3])
trades = []
try:
    for r in json.load(open(os.path.join(D, "replay-lab.json")))["brick"]:
        if r["asset"] == "gold": trades.append(("BRICK replay", r["tk"], r["side"], r["ask"], r["t"]))
except Exception:
    pass
from datetime import datetime
seen = set()
rows = {}
for line in open(os.path.join(D, "exit-ledger.jsonl")):
    try: e = json.loads(line); rows[e["id"]] = e
    except Exception: pass
for e in rows.values():
    if e.get("asset") != "gold" or e.get("stale") or e.get("dnaMode") or e.get("book") in ("tap3x","taphold","rescue","snap50","snap100","snap200","snap300","snaphold","x16_50","x16_100","x16_200","x16_300","x16hold"): continue
    tk = e["id"].split(":")[0]
    k = (tk, e["side"])
    if k in seen: continue  # one per window+side (many books share a window)
    seen.add(k)
    trades.append(("paper books", tk, e["side"], e["ask"], datetime.fromisoformat(e["at"].replace("Z", "+00:00")).timestamp()))
def run(X, M, maxAsk=0.9):
    out = []
    for src, tk, side, ask, t0 in trades:
        stk = tk.replace("KXGOLD15M-", "KXSILVER15M-")
        if tk not in cand or stk not in cand: continue
        gres, sres = result(tk), result(stk)
        if not gres or not sres: continue
        close = close_of(tk)
        scs = {c[0]: c for c in cand[stk]}
        for c in cand[tk]:
            if c[0] <= t0 + 30 or c[0] > close: continue
            if (close - c[0]) / 60 < M: break
            b = side_bid(c, side)
            if b is None or not (b <= ask * (1 - X / 100)): continue
            sc = scs.get(c[0])
            if not sc: break
            hside = "down" if side == "up" else "up"
            ha = side_ask(sc, hside)
            if ha is None or not (0.02 < ha <= maxAsk): break
            gwon = (gres == "yes") == (side == "up")
            hwon = (sres == "yes") == (hside == "up")
            out.append({"src": src, "tk": tk, "gold_won": gwon, "hedge_ask": ha, "hedge_won": hwon, "hedge_pnl": round(10 / ha - 10 if hwon else -10, 2), "gold_pnl50": round(50 / ask - 50 if gwon else -50, 2)})
            break
    return out
# how often gold and silver settle the same way, every window we have both
both = [(result(t), result(t.replace("KXGOLD15M-", "KXSILVER15M-"))) for t in cand if t.startswith("KXGOLD15M-")]
both = [x for x in both if x[0] and x[1]]
print(f"gold & silver windows with results: {len(both)}; same direction {sum(a==b for a,b in both)} ({100*sum(a==b for a,b in both)/max(1,len(both)):.0f}%)")
print(f"gold trades to test: {len(trades)}")
for X in (20, 30, 40, 50):
    for M in (3, 5, 8):
        o = run(X, M)
        if not o: continue
        n = len(o); w = sum(r["hedge_won"] for r in o); avg = sum(r["hedge_ask"] for r in o) / n; pnl = sum(r["hedge_pnl"] for r in o)
        gl = sum(not r["gold_won"] for r in o)
        cover = sum(r["hedge_won"] for r in o if not r["gold_won"])
        print(f"  gold down {X}%+, {M}+ min left: {n:4d} hedges · silver won {w} ({100*w/n:.0f}% vs {100*avg:.0f}% price) · ${pnl:+8.2f} on $10 each · gold went on to lose {gl}/{n}, hedge paid on {cover} of those")
json.dump({"pairs": len(both)}, open(os.path.join(D, "silver-hedge-lab.json"), "w"))
