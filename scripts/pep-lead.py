#!/usr/bin/env python3
"""PEPPERSTONE LEAD (Claude, Love Oct 2 ~11 PM PT: "she's rejecting on vantage and broke thru on pepperstone,
does a break on pepperstone first show the direction before the rest know?").
Same 5-minute candle, same line (VWAP / +-0.5..3 sigma by index, 5 PM ET anchor, each feed on its own bands):
  SPLIT A = Pepperstone CLOSES THROUGH the line, the other feed touched it and closed back (rejected)
  SPLIT B = the reverse (other feed broke, Pepperstone rejected)
Then where did price go (Kraken, Kalshi's twin) 5 / 10 / 15 minutes later, in the direction of the break?
Baseline = every Pepperstone break. Usage: pep-lead.py [FROM_ISO] [OTHER_FEED]"""
import json, os, sys, math, statistics
from datetime import datetime, timezone, timedelta
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
FROM = datetime.fromisoformat((sys.argv[1] if len(sys.argv) > 1 else "2026-10-01T00:00:00+00:00").replace("Z", "+00:00")).timestamp()
OTHERS = [sys.argv[2]] if len(sys.argv) > 2 else ["VANTAGE:BTCUSD", "KRAKEN:BTCUSD", "COINBASE:BTCUSD", "OANDA:BTCUSD"]
d = json.load(open(os.path.join(D, "feedmatch.json")))
def to5(bars):
    out = {}
    for t, o, h, l, c, v in bars:
        k = t // 300 * 300
        if k not in out: out[k] = [k, o, h, l, c, v]
        else:
            x = out[k]; x[2] = max(x[2], h); x[3] = min(x[3], l); x[4] = c; x[5] += v
    return [out[k] for k in sorted(out)]
def sess(t):
    dt = datetime.fromtimestamp(t, timezone.utc); s = dt.replace(hour=21, minute=0, second=0, microsecond=0)
    if dt < s: s -= timedelta(days=1)
    return s.timestamp()
def events(sym):
    """{(t, k): ('break'|'reject', dir)} for every 5m candle that touched line k coming from one side."""
    b5 = [x for x in to5(d["bars"][sym]) if not (x[5] == 0 and x[1] == x[4])]
    ev = {}; pv = vv = sq = 0.0; cur = None; n = 0; prev = None
    for t, o, h, l, c, v in b5:
        s0 = sess(t)
        if cur != s0: cur, pv, vv, sq, n, prev = s0, 0.0, 0.0, 0.0, 0, None
        if vv > 0 and n >= 6 and prev is not None and t >= FROM:
            vw = pv / vv; sd = math.sqrt(max(sq / vv - vw * vw, 0))
            for k in range(-6, 7):
                L = vw + k / 2 * sd
                if prev < L and h >= L: ev[(t, k)] = ("break" if c > L else "reject", 1)
                elif prev > L and l <= L: ev[(t, k)] = ("break" if c < L else "reject", -1)
        tp = (h + l + c) / 3; pv += tp * v; vv += v; sq += v * tp * tp; n += 1; prev = c
    return ev
kr = {x[0]: x for x in to5(d["bars"]["KRAKEN:BTCUSD"])}
def follow(t, dr):
    x0 = kr.get(t)
    if not x0: return None
    r = []
    for j in (1, 2, 3):
        x = kr.get(t + j * 300)
        if not x: return None
        r.append((x[4] - x0[4]) * dr)
    return r
def summ(name, rows):
    rows = [r for r in rows if r]
    if not rows: print(f"  {name:52s} n=0"); return None
    out = {"n": len(rows)}
    s = f"  {name:52s} n={len(rows):4d}"
    for j, lab in enumerate(("5m", "10m", "15m")):
        xs = [r[j] for r in rows]
        right = 100 * sum(x > 0 for x in xs) / len(xs)
        out[lab] = {"rightWay": round(right, 1), "median": round(statistics.median(xs), 1)}
        s += f"   {lab}: {right:4.0f}% right way, median {statistics.median(xs):+6.1f}"
    print(s); return out
pep = events("PEPPERSTONE:BTCUSD")
res = {"from": datetime.fromtimestamp(FROM, timezone.utc).isoformat(), "pepAllBreaks": None, "vs": {}}
print(f"PEPPERSTONE LEAD · since {res['from'][:16]}Z · price followed on Kraken, in the break's direction")
res["pepAllBreaks"] = summ("baseline: every Pepperstone break", [follow(t, dr) for (t, k), (kind, dr) in pep.items() if kind == "break"])
for o in OTHERS:
    oe = events(o)
    A = [follow(t, dr) for (t, k), (kind, dr) in pep.items() if kind == "break" and oe.get((t, k)) == ("reject", dr)]
    B = [follow(t, dr) for (t, k), (kind, dr) in oe.items() if kind == "break" and pep.get((t, k)) == ("reject", dr)]
    BOTH = [follow(t, dr) for (t, k), (kind, dr) in pep.items() if kind == "break" and oe.get((t, k)) == ("break", dr)]
    print(f"\n vs {o}")
    res["vs"][o] = {"pepBreaks_otherRejects": summ(f"PEP broke, {o.split(':')[0]} rejected", A),
                    "otherBreaks_pepRejects": summ(f"{o.split(':')[0]} broke, PEP rejected", B),
                    "bothBroke": summ("both broke", BOTH)}
json.dump(res, open(os.path.join(D, "pep-lead.json"), "w"), indent=1)
