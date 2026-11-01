#!/usr/bin/env python3
"""HALF LAB (Claude, Oct 7, Love: "instead of taking the whole thing at 75%, what about taking half at that price, and then
the gate only catching it if it falls under its trigger"). Same minute-by-minute simulator as reason-sim.py (BRICK's exits:
90% take profit + trail, gates, lock the win, near-the-strike distance gold $0.50 / BTC $100), plus: the first minute the
bid reaches P% of the max, sell HALF there; the other half keeps every rule. Compared with no half-sale."""
import json, sys
sys.argv = [sys.argv[0]]
src = open("scripts/reason-sim.py").read().split("def sim(X):")[0]
exec(src)
def sim2(X, P, subset=None):
    tot = 0.0; gated_delta = 0.0
    for t in (subset or T):
        r = t["r"]; ask = r["ask"]; n = r["stake"] / ask; mult = 1 / ask; maxp = (mult - 1) * 100
        tp = max(1, maxp * 0.9); peak = -1e9; armed = False; out = None; half = None; how = "bell"
        gates = ([40] if 40 < maxp else []) if mult < 1.65 else [maxp * 0.55, maxp * 0.6]
        lvl = ask + P / 100 * (1 - ask) if P else None
        for bid, cush in t["path"]:
            pct = (bid / ask - 1) * 100; peak = max(peak, pct)
            if lvl is not None and half is None and bid >= lvl: half = bid
            if pct >= tp: armed = True
            if armed:
                if bid >= 0.97 or pct < max(tp, int(peak) - 1): out = bid; how = "tp"; break
                continue
            reason = cush <= X; above = r["book"] in UNDERWATER_OK or pct > 0
            if reason and above:
                fl = [gp for gp in gates if peak >= gp]
                if fl and pct < fl[-1]: out = bid; how = "gate"; break
                if peak >= 30 and pct <= 20: out = bid; how = "lock"; break
        rest = out if out is not None else (1.0 if t["won"] else 0.0)
        val = (n / 2 * half + n / 2 * rest) if half is not None else n * rest
        tot += val - r["stake"]
        t["how"] = how
    return tot
for a, X in (("gold", 0.5), ("btc", 100)):
    sub = sorted([t for t in T if t["r"]["asset"] == a], key=lambda t: t["r"]["at"]); h = len(sub) // 2
    base = sim2(X, None, sub)
    early = [t for t in sub if t["how"] in ("gate", "lock")]
    print(f"\n{a.upper()} ({len(sub)} trades; {len(early)} ended on a gate / lock). No half-sale: ${base:+.0f}")
    for P in (40, 50, 60, 70, 75, 80, 85):
        v = sim2(X, P, sub); d1 = sim2(X, P, sub[:h]) - sim2(X, None, sub[:h]); d2 = sim2(X, P, sub[h:]) - sim2(X, None, sub[h:])
        ge = sim2(X, P, early) - sim2(X, None, early)
        print(f"   half at {P}% of the max: ${v:+7.0f} ({v-base:+5.0f}; halves {d1:+.0f} / {d2:+.0f})   on the gate/lock trades alone: {ge:+.0f}")
