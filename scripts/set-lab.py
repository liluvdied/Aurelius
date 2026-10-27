#!/usr/bin/env python3
"""SET LAB (Claude, Oct 6, Love: "should we run all the green books, or all of them?"). Paper replay of a live set:
one Kalshi trade per window, the first book in the set to fire owns it. Tests adding / removing each book."""
import json, datetime
D = "data"
rows = {}
for l in open(f"{D}/exit-ledger.jsonl"):
    try: r = json.loads(l); rows[r["id"]] = r
    except: pass
for r in json.load(open(f"{D}/night-book.json")):
    if r.get("result") != "open" and r.get("pnl") is not None: rows[r["id"]] = r
ts = lambda s: datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
R = sorted([dict(r, T=ts(r["at"]), ticker=r.get("ticker") or r["id"].split(":")[0]) for r in rows.values()
            if not r.get("dnaMode") and not r.get("stale") and "15M-" in (r.get("ticker") or r["id"])], key=lambda r: r["T"])
T0 = ts("2026-10-04T18:00:00Z")
R = [r for r in R if r["T"] >= T0]
def run(S):
    own = {}; 
    for r in R:
        if r["book"] in S and r["ticker"] not in own: own[r["ticker"]] = r
    xs = list(own.values()); return len(xs), sum(x["pnl"] > 0.05 for x in xs), sum(x["pnl"] for x in xs)
books = sorted({r["book"] for r in R})
solo = {b: run({b}) for b in books}
LIVE = {"brickc", "cotc", "new"}
base = run(LIVE)
print(f"since Oct 4 18:00Z. live set {sorted(LIVE)}: {base[0]} trades {base[1]}W ${base[2]:+.0f}")
print("remove one:")
for b in sorted(LIVE):
    x = run(LIVE - {b}); print(f"  - {b:8s} {x[0]:4d}t ${x[2]:+8.0f} ({x[2]-base[2]:+.0f})")
print("add one (books with 40+ trades, by effect):")
adds = []
for b in books:
    if b in LIVE or solo[b][0] < 40: continue
    x = run(LIVE | {b}); adds.append((x[2] - base[2], b, x, solo[b]))
for d, b, x, s in sorted(adds, reverse=True)[:14]:
    print(f"  + {b:9s} {d:+7.0f}   (alone: {s[0]}t {100*s[1]/s[0]:.0f}% ${s[2]:+.0f})")
greens = {b for b in books if solo[b][0] >= 40 and solo[b][2] > 0}
g = run(greens); a = run({b for b in books if solo[b][0] >= 40})
print(f"all green books ({len(greens)}): {g[0]}t {100*g[1]/g[0]:.0f}% ${g[2]:+.0f}  |  literally all ({len([b for b in books if solo[b][0]>=40])}): {a[0]}t {100*a[1]/a[0]:.0f}% ${a[2]:+.0f}")
print("\nrobustness (two halves of the period):")
mid = R[len(R)//2]["T"]
H = [[r for r in R if r["T"] < mid], [r for r in R if r["T"] >= mid]]
def runh(S, part):
    own = {}
    for r in part:
        if r["book"] in S and r["ticker"] not in own: own[r["ticker"]] = r
    return sum(x["pnl"] for x in own.values()), len(own)
for extra in ({"brk1"}, {"confirm"}, {"brk1", "confirm"}, {"brick"}, {"brickt"}, {"brk1", "confirm", "brickt"}):
    out = []
    for part in H:
        b0 = runh(LIVE, part)[0]; x = runh(LIVE | extra, part); out.append(f"{x[0]-b0:+6.0f}")
    print(f"  + {'+'.join(sorted(extra)):22s} halves: {' / '.join(out)}   total {run(LIVE|extra)[2]-base[2]:+.0f}, trades {run(LIVE|extra)[0]}")
