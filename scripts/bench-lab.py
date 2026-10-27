#!/usr/bin/env python3
"""BENCH LAB (Claude, Oct 6 ~12 PM PT, Love: "instead of cycling in the best book, remove one if it's doing poorly
compared to the others"). Replays her live set on paper, one Kalshi trade per window (first book to fire owns it),
and tests bench rules checked every 15 min on each book's own trailing paper record. Paper P&L at the paper stake."""
import json, datetime, itertools
D = "data"
rows = {}
for l in open(f"{D}/exit-ledger.jsonl"):
    try: r = json.loads(l); rows[r["id"]] = r
    except: pass
for r in json.load(open(f"{D}/night-book.json")):
    if r.get("result") != "open" and r.get("pnl") is not None: rows[r["id"]] = r
ts = lambda s: datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
BOOKS = ["brick", "brickc", "cotc", "new"]
R = sorted([dict(r, T=ts(r["at"]), ticker=r.get("ticker") or r["id"].split(":")[0]) for r in rows.values()
            if r.get("book") in BOOKS and not r.get("dnaMode") and not r.get("stale") and "15M-" in (r.get("ticker") or r["id"])], key=lambda r: r["T"])
t0 = max(min(r["T"] for r in R if r["book"] == b) for b in BOOKS) + 12 * 3600  # every book has 12h of history
def run(rule):
    owned = set(); tot = 0.0; n = w = 0; benchlog = []
    for r in R:
        if r["T"] < t0 or r["ticker"] in owned: continue
        if rule and rule(r["book"], r["T"]): continue
        owned.add(r["ticker"]); tot += r["pnl"]; n += 1; w += r["pnl"] > 0.05
    return n, w, tot
def trailing(book, T, hours):
    xs = [r["pnl"] for r in R if r["book"] == book and T - hours * 3600 <= r["T"] < T - 900]  # settled-ish: booked 15m+ ago
    return xs
def mk(hours, minN, mode):
    def rule(book, T):
        me = trailing(book, T, hours)
        if len(me) < minN: return False
        if mode == "red": return sum(me) < 0
        others = [sum(trailing(b, T, hours)) / max(1, len(trailing(b, T, hours))) for b in BOOKS if b != book]
        avg = sum(others) / len(others)
        mine = sum(me) / len(me)
        if mode == "worst+red": return sum(me) < 0 and mine < avg
        if mode == "lag": return mine < avg - 5  # $5/trade behind the others' average
    return rule
base = run(None)
print(f"replay from {datetime.datetime.utcfromtimestamp(t0):%b %d %H:%M}Z, books {BOOKS}")
print(f"  all on:                {base[0]:3d} trades {base[1]:3d}W ({100*base[1]/base[0]:.0f}%)  ${base[2]:+8.2f}")
for hours, minN, mode in itertools.product((4, 8, 12, 24), (6, 10), ("red", "worst+red", "lag")):
    n, w, tot = run(mk(hours, minN, mode))
    print(f"  bench if {mode:9s} over {hours:2d}h (n>={minN:2d}): {n:3d} trades {w:3d}W ({100*w/max(1,n):.0f}%)  ${tot:+8.2f}  ({tot-base[2]:+.0f})")
def streak(k, cool):
    def rule(book, T):
        xs = [r for r in R if r["book"] == book and r["T"] < T - 900][-k:]
        return len(xs) == k and all(x["pnl"] < 0 for x in xs) and T - xs[-1]["T"] < cool * 3600
    return rule
for k, cool in itertools.product((2, 3, 4), (1, 2, 4)):
    n, w, tot = run(streak(k, cool))
    print(f"  bench {cool}h after {k} straight losses: {n:3d} trades {w:3d}W ({100*w/max(1,n):.0f}%)  ${tot:+8.2f}  ({tot-base[2]:+.0f})")
