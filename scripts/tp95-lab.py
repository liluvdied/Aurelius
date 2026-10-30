#!/usr/bin/env python3
"""TP95 LAB (Claude, Oct 7, Love: "does raising the other half to 95% raise the dollars?"). Same minute simulator as
reason-sim.py / half-lab.py. Take profit arms at A% of the max (now 90%), then the 1% trail; the 97c instant sale moves
with it. With and without the half-sale at 75%."""
import json, sys
sys.argv = [sys.argv[0]]
exec(open("scripts/reason-sim.py").read().split("def sim(X):")[0])
def sim3(X, A, cap, P, subset):
    tot = 0.0; n_tp = 0
    for t in subset:
        r = t["r"]; ask = r["ask"]; n = r["stake"] / ask; mult = 1 / ask; maxp = (mult - 1) * 100
        tp = max(1, maxp * A); peak = -1e9; armed = False; out = None; half = None
        gates = ([40] if 40 < maxp else []) if mult < 1.65 else [maxp * 0.55, maxp * 0.6]
        lvl = ask + P / 100 * (1 - ask) if P else None
        for bid, cush in t["path"]:
            pct = (bid / ask - 1) * 100; peak = max(peak, pct)
            if lvl is not None and half is None and bid >= lvl: half = bid
            if pct >= tp: armed = True
            if armed:
                if bid >= cap or pct < max(tp, int(peak) - 1): out = bid; n_tp += 1; break
                continue
            if cush <= X and (r["book"] in UNDERWATER_OK or pct > 0):
                fl = [gp for gp in gates if peak >= gp]
                if fl and pct < fl[-1]: out = bid; break
                if peak >= 30 and pct <= 20: out = bid; break
        rest = out if out is not None else (1.0 if t["won"] else 0.0)
        tot += ((n / 2 * half + n / 2 * rest) if half is not None else n * rest) - r["stake"]
    return tot
for a, X in (("gold", 0.5), ("btc", 100)):
    sub = sorted([t for t in T if t["r"]["asset"] == a], key=lambda t: t["r"]["at"]); h = len(sub) // 2
    print(f"\n{a.upper()} ({len(sub)} trades)")
    for P in (None, 75):
        base = sim3(X, 0.90, 0.97, P, sub); b1 = sim3(X, 0.90, 0.97, P, sub[:h]); b2 = base - b1
        print(f"  {'no half-sale' if P is None else 'half at 75%'}: take profit at 90% / 97c now ${base:+.0f}")
        for A, cap in ((0.93, 0.97), (0.95, 0.97), (0.95, 0.98), (0.95, 0.99), (0.97, 0.99)):
            v = sim3(X, A, cap, P, sub); v1 = sim3(X, A, cap, P, sub[:h]); v2 = v - v1
            print(f"     arm at {int(A*100)}% of the max, instant sale at {int(cap*100)}c: ${v:+7.0f} ({v-base:+5.0f}; halves {v1-b1:+.0f} / {v2-b2:+.0f})")
