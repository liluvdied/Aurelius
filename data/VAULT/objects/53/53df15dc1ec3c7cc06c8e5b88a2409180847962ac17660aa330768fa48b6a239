#!/usr/bin/env python3
"""FAKE-OUT DEPTH paper ledger (Oct 26 2026 ~11:28 AM PT, Love: "the pokes into the band channel above were shorter than the fakeout
wicks into the band channel below ... i'd like her to stick with the side that the wicks fell further into ... test that on a separate
fakeout only ledger over the week and reconvene friday with the data"). READ-ONLY: never trades, never touches the desk.
Each 15m window, at its open: the last 10 finished 5m candles (ticks from latency-shadow), the nearest session band / zone above and
below price (band-log). A poke = a wick past the band by >= tol ($10 BTC / 30c gold) whose open and close stayed on the channel side
(fix180 tolerance). When BOTH bands were poked and at least one is a fake-out (2+ pokes), she takes the side the wicks went DEEPER
into (deeper below -> short, deeper above -> long). Graded at the window close vs the window open (Kalshi's target); $20 at 50c paper.
Writes data/fakeout-depth/rows.jsonl + REPORT.md. Rows from 2026-10-26T19:00Z on are the forward week (Friday Oct 30 read)."""
import json, os, datetime, bisect, collections
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data"))
def ts(s): return datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
TOL = {"btc": 10.0, "gold": 0.30}; FWD = ts("2026-10-26T19:00:00Z")
ticks = collections.defaultdict(list)
for l in open("latency-shadow.jsonl"):
    try: r = json.loads(l)
    except Exception: continue
    if isinstance(r.get("tick"), (int, float)) and r.get("asset"): ticks[r["asset"]].append((ts(r["at"]), float(r["tick"])))
bands = collections.defaultdict(list)
for l in open("band-log.jsonl"):
    try: r = json.loads(l)
    except Exception: continue
    L = dict(r.get("L") or [])
    bl = [v for k, v in L.items() if k in ("session VWAP", "+1σ", "-1σ", "+2σ", "-2σ", "+3σ", "-3σ", "5m R1", "5m S1")]
    if bl: bands[r["asset"]].append((ts(r["at"]), sorted(bl)))
os.makedirs("fakeout-depth", exist_ok=True)
rows = []
for a in ("btc", "gold"):
    tk = sorted(ticks[a]); T = [x[0] for x in tk]; bd = sorted(bands[a]); TB = [x[0] for x in bd]
    if not tk: continue
    bars = {}
    for t, p in tk:
        k = int(t // 300) * 300; b = bars.get(k)
        if b is None: bars[k] = [p, p, p, p]
        else: b[1] = max(b[1], p); b[2] = min(b[2], p); b[3] = p
    t0 = int(tk[0][0] // 900 + 1) * 900; tEnd = tk[-1][0]
    for w in range(t0 + 3000, int(tEnd) - 900, 900):
        i = bisect.bisect_left(T, w)
        if i >= len(T) or T[i] - w > 15: continue
        px = tk[i][1]; j = bisect.bisect_right(TB, w) - 1
        if j < 0 or w - TB[j] > 120: continue
        L = bd[j][1]; up = [x for x in L if x > px]; dn = [x for x in L if x < px]
        if not up or not dn: continue
        A, B = min(up), max(dn); tol = TOL[a]
        last = [bars[k] for k in range(w - 3000, w, 300) if k in bars]
        if len(last) < 8: continue
        pa = [b[1] - A for b in last if b[1] - A >= tol and b[0] <= A + tol and b[3] <= A + tol]
        pb = [B - b[2] for b in last if B - b[2] >= tol and b[0] >= B - tol and b[3] >= B - tol]
        if not pa or not pb or max(len(pa), len(pb)) < 2: continue
        dA, dB = max(pa), max(pb)
        if abs(dA - dB) < tol / 2: continue
        side = "up" if dA > dB else "down"
        k2 = bisect.bisect_left(T, w + 900) - 1
        if k2 < 0 or w + 900 - T[k2] > 30: continue
        close = tk[k2][1]; won = (close > px) if side == "up" else (close < px)
        rows.append({"window": datetime.datetime.utcfromtimestamp(w).strftime("%Y-%m-%dT%H:%MZ"), "asset": a, "side": side, "open": px, "close": close,
                     "above": A, "below": B, "pokesAbove": len(pa), "deepAbove": round(dA, 2), "pokesBelow": len(pb), "deepBelow": round(dB, 2),
                     "won": won, "pnl": 19.4 if won else -20.0, "forward": w >= FWD})
with open("fakeout-depth/rows.jsonl", "w") as f:
    for r in rows: f.write(json.dumps(r) + "\n")
def line(rs, name):
    n = len(rs); w = sum(r["won"] for r in rs)
    return f"| {name} | {n} | {100 * w / n:.0f}% | {sum(r['pnl'] for r in rs):+.2f} |" if n else f"| {name} | 0 | - | - |"
out = ["# Fake-out depth ledger (paper, read-only)", "", "Side = the band whose fake-out wicks went deeper. $20 at 50c, graded at the 15m bell vs the window open.", "",
       "| slice | trades | win | P&L |", "|---|---|---|---|"]
for nm, f in (("replay before Oct 26 noon", lambda r: not r["forward"]), ("forward week (from Oct 26 noon PT)", lambda r: r["forward"])):
    for a in ("btc", "gold"): out.append(line([r for r in rows if f(r) and r["asset"] == a], f"{nm} · {a}"))
open("fakeout-depth/REPORT.md", "w").write("\n".join(out) + "\n")
print("\n".join(out))
