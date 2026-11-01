#!/usr/bin/env python3
"""DNA x ATR LAB (Claude, Oct 2 night, Love: "work it out to ATR, it shouldn't be one set price for all points of
the day... the band check needs to be there... put her back where she was hitting winning streaks, and ignore the
setups that were flagged for entering into a band"). Every paper-book entry (deduped per ticker+side) with the
lines she had at that moment (row.bands), replayed through her DNA with reach = k x ATR(14) on 5-minute bars."""
import json, os, sys, bisect, collections
from datetime import datetime, timezone
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
R = json.load(open(os.path.join(D, "night-book.json"))); R = R if isinstance(R, list) else R.get("rows")
bars = {"btc": json.load(open(os.path.join(D, "hist", "pep-btc-5.json"))), "gold": json.load(open(os.path.join(D, "hist", "gold-5.json")))}
for a in bars: bars[a].sort(key=lambda b: b["t"])
ts = {a: [b["t"] for b in bars[a]] for a in bars}
strike = {m["tk"]: m.get("strike") for a in ("btc", "gold") for m in json.load(open(os.path.join(D, "feedmatch.json")))["markets"].get(a, [])}
def atr(a, t, n=14):
    i = bisect.bisect_right(ts[a], t - 300)  # closed bars only
    xs = bars[a][max(0, i - n - 1):i]
    if len(xs) < n + 1: return None
    tr = [max(x["h"] - x["l"], abs(x["h"] - p["c"]), abs(x["l"] - p["c"])) for p, x in zip(xs, xs[1:])]
    return sum(tr[-n:]) / n
def lines(a, b):
    L = []; vw = b.get("vwap") or 0; sd = b.get("sd") or 0
    if vw > 0: L.append(("VWAP", vw))
    if vw > 0 and sd > 0:
        for k in (0.5, 1, 1.5, 2, 2.5, 3): L += [(f"+{k}σ", vw + k * sd), (f"-{k}σ", vw - k * sd)]
    for key in ("m5", "m10", "m15"):
        f = (b.get("nav") or {}).get(key)
        if not f: continue
        if f.get("c"): L.append((f"{key} purple", f["c"]))
        if a == "btc":
            if f.get("up"): L.append((f"{key} upper", f["up"]))
            if f.get("dn"): L.append((f"{key} lower", f["dn"]))
    return L
def prices(side, spot, b):
    lv = (b.get("nav") or {}).get("live1m") or {}
    xs = [spot, b.get("spot") or 0, (b.get("nav") or {}).get("close1m") or 0, lv.get("c") or 0, (lv.get("h") if side == "up" else lv.get("l")) or 0]
    return [x for x in xs if x and x > 0]
rows = {}
for r in sorted(R, key=lambda r: r["at"]):
    if r.get("stale") or r["result"] not in ("win", "loss") or not r.get("bands") or r["book"] in ("tap3x", "taphold", "rescue", "hourly"): continue
    key = (r["ticker"], r["side"])
    if key in rows: rows[key]["books"].append(r["book"]); continue
    t = datetime.fromisoformat(r["at"].replace("Z", "+00:00")).timestamp()
    a = r["asset"]; b = r["bands"]; L = lines(a, b); P = prices(r["side"], r.get("spot") or 0, b)
    if not L or not P: continue
    front = min([(l[1] - p) if r["side"] == "up" else (p - l[1]) for p in P for l in L if ((l[1] - p) if r["side"] == "up" else (p - l[1])) > 0] or [1e9])
    s = strike.get(r["ticker"]); at = r.get("spot") or P[0]
    road = None
    if s:
        s = float(s)
        if (r["side"] == "up" and s > at) or (r["side"] == "down" and s < at):
            lo, hi = min(at, s), max(at, s); road = any(lo < l[1] < hi for l in L)
        else: road = False
    flagged = any("right above her" in x or "right below her" in x or "in front" in x.lower() for x in (r.get("notes") or {}).get("better", []))
    rows[key] = {"t": t, "at": r["at"], "asset": a, "side": r["side"], "win": r["result"] == "win", "pnl": r["pnl"], "stake": r.get("stake") or 50, "front": front, "atr": atr(a, t), "sd": b.get("sd"), "road": road, "flagged": flagged, "books": [r["book"]], "hourPT": r.get("hourPT")}
X = [x for x in rows.values() if x["atr"]]
print(f"{len(X)} unique book entries with lines + ATR  ({sum(x['asset']=='btc' for x in X)} BTC, {sum(x['asset']=='gold' for x in X)} gold)")
for a in ("btc", "gold"):
    xs = [x for x in X if x["asset"] == a]
    if not xs: continue
    print(f"\n=== {a.upper()}  all: {len(xs)} trades, {100*sum(x['win'] for x in xs)/len(xs):.0f}% win, net {sum(x['pnl'] for x in xs):+.0f}   flagged-in-front losers: {sum(x['flagged'] and not x['win'] for x in xs)}")
    print(f"  ATR(5m) at entry: median {sorted(x['atr'] for x in xs)[len(xs)//2]:.2f}   in-front distance in ATRs, flagged losers: {sorted(round(x['front']/x['atr'],2) for x in xs if x['flagged'] and not x['win'])}")
    print(f"  {'rule':26s} {'pass':>5s} {'win%':>6s} {'net':>8s}  {'blocked W/L':>11s}  flagged losers caught")
    for k in ([0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0]):
        for road in (False, True):
            ok = [x for x in xs if x["front"] > k * x["atr"] and not (road and x["road"])]
            bl = [x for x in xs if x not in ok]
            fl = [x for x in xs if x["flagged"] and not x["win"]]
            print(f"  {k:4.2f} x ATR{' + clear road' if road else '':13s} {len(ok):5d} {100*sum(x['win'] for x in ok)/max(1,len(ok)):5.0f}% {sum(x['pnl'] for x in ok):+8.0f}  {sum(x['win'] for x in bl):4d}/{sum(not x['win'] for x in bl):<4d}    {sum(1 for x in fl if x not in ok)}/{len(fl)}")
    for d in ([100] if a == "btc" else [2.5]):
        ok = [x for x in xs if x["front"] > d and not x["road"]]
        print(f"  fixed ${d} + clear road (now) {len(ok):5d} {100*sum(x['win'] for x in ok)/max(1,len(ok)):5.0f}% {sum(x['pnl'] for x in ok):+8.0f}")
json.dump(X, open(os.path.join(D, "dna-atr-lab.json"), "w"), indent=1)
