#!/usr/bin/env python3
"""SUB-1S SPEED (fix504, Love Oct 29 2026 11:53 PM PT: "give her a sub 1s speed again, we had it before / Bring it back and make it a cornerstone").
Her side of an order - from the paper book's call to the order leaving for Kalshi (copier wait + her gates + the sub-auditor's stamp) - must stay under one second.
Reads data/copy-timing.jsonl (her Oct 8 SPEED WATCH + the fix493 order log). Over the last 24 hours of FILLED copies that were not held by a wall (waitMs <= 3 s): the median of waitMs + gatesMs must be under 1000 ms and 9 in 10 under
1500 ms. A call her walls held first (waitMs > 3 s) is her rule at work, not lag: counted, reported, never judged. Kalshi's own round
trip (orderMs) is reported, never judged - it is not hers. Fewer than 3 fills in 24 h = nothing to judge yet (SAFE, reported).
  python3 tools/speed-check.py        exit 0 = sub-1s holds, 1 = she has slowed - the umpire goes OUT"""
import json, os, sys, time, statistics
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
now = time.time(); rows = []
try:
    for l in open("data/copy-timing.jsonl", encoding="utf8"):
        try: x = json.loads(l)
        except Exception: continue
        if x.get("status") != "filled": continue
        try: t = time.mktime(time.strptime(x["at"][:19], "%Y-%m-%dT%H:%M:%S")) - time.timezone
        except Exception: continue
        if now - t <= 86400: rows.append(x)
except FileNotFoundError:
    print("SPEED ✓ - no order log yet (nothing to judge)"); sys.exit(0)
if len(rows) < 3: print(f"SPEED ✓ - only {len(rows)} fill(s) in 24 h, nothing to judge yet"); sys.exit(0)
# a call her walls HELD (it waited for a break or a rejection by her rules) is not lag: fills that waited over 3 s are counted apart, never judged
held = [x for x in rows if float(x.get("waitMs") or 0) > 3000]; free = [x for x in rows if float(x.get("waitMs") or 0) <= 3000]
if len(free) < 3: print(f"SPEED ✓ - only {len(free)} unheld fill(s) in 24 h ({len(held)} held by her walls), nothing to judge yet"); sys.exit(0)
hers = [float(x.get("waitMs") or 0) + float(x.get("gatesMs") or 0) for x in free]
med = statistics.median(hers); p90 = sorted(hers)[int(len(hers) * 0.9) - 1 if len(hers) >= 10 else -1]
kal = statistics.median([float(x.get("orderMs") or 0) for x in free])
ok = med < 1000 and p90 < 1500
print(("SPEED ✓ - " if ok else "SPEED ✗ - ") + f"her side of the order: median {med:.0f} ms, 9 in 10 under {p90:.0f} ms, over {len(free)} unheld fills (24 h; {len(held)} more were held by her walls first); Kalshi's round trip median {kal:.0f} ms (reported, not judged)" + ("" if ok else " - she has slowed past 1 s, tell Love"))
try:
    with open("data/speed-check.jsonl", "a", encoding="utf8") as f: f.write(json.dumps({"at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "fills": len(rows), "medianHersMs": round(med), "p90HersMs": round(p90), "held": len(held), "kalshiMedianMs": round(kal), "ok": ok}) + "\n")
except Exception: pass
sys.exit(0 if ok else 1)
