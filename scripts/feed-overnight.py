#!/usr/bin/env python3
"""OVERNIGHT FEED SHOOTOUT (Claude, Love Oct 2 ~9 PM PT: "she blew thru the bands on kraken, rejecting
the ones on vantage... can we see how the best ones perform overnight?").
Scores the top BTC feeds ONLY on candles since FROM (default 8:30 PM PT Oct 2), on both session anchors:
  ny  = VWAP session from 5 PM ET (21:00Z)   utc = from 00:00 UTC (her Kraken chart)
Per feed: touches of her lines (VWAP, +/-0.5..3 sigma, 5m purple nav), RESPECTED = rejected and the bounce
paid BTC $30 within 3 candles, BLEW THRU = closed through and ran $30 beyond the line within 3 candles.
Plus Kalshi: same YES/NO call as the settle and median gap, for windows that closed in the window.
Reads data/feedmatch.json (the desk re-pulls it every 6h). Usage: feed-overnight.py [FROM_ISO]"""
import json, os, sys, math, statistics, bisect
from datetime import datetime, timezone, timedelta
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
FROM = datetime.fromisoformat((sys.argv[1] if len(sys.argv) > 1 else "2026-10-03T03:30:00+00:00").replace("Z", "+00:00")).timestamp()
d = json.load(open(os.path.join(D, "feedmatch.json")))
# Love, Oct 2 ~10:15 PM PT: "bitfinex broke thru, vantage rejected" -> score every BTC feed the desk pulls.
ASSET = os.environ.get("ASSET", "btc")  # ASSET=gold scores the gold feeds (Love: "does she do this for gold?")
CLEAR = 30 if ASSET == "btc" else 0.6
FEEDS = [k for k, v in d["bars"].items() if (("BTC" in k) == (ASSET == "btc")) and isinstance(v, list)]
def to5(bars):
    out = {}
    for t, o, h, l, c, v in bars:
        k = t // 300 * 300
        if k not in out: out[k] = [k, o, h, l, c, v]
        else:
            x = out[k]; x[2] = max(x[2], h); x[3] = min(x[3], l); x[4] = c; x[5] += v
    return [out[k] for k in sorted(out)]
def sess(t, hour):
    dt = datetime.fromtimestamp(t, timezone.utc)
    s = dt.replace(hour=hour, minute=0, second=0, microsecond=0)
    if dt < s: s -= timedelta(days=1)
    return s.timestamp()
def score(bars, hour):
    b5 = [x for x in to5(bars) if not (x[5] == 0 and x[1] == x[4])]
    T = R = B = 0; pv = vv = sq = 0.0; cur = None; hist = []
    for i, (t, o, h, l, c, v) in enumerate(b5):
        s0 = sess(t, hour)
        if cur != s0: cur, pv, vv, sq, hist = s0, 0.0, 0.0, 0.0, []
        if t >= FROM and vv > 0 and len(hist) >= 6:
            vw = pv / vv; sd = math.sqrt(max(sq / vv - vw * vw, 0))
            lines = [vw + k / 2 * sd for k in range(-6, 7)] if sd > 0 else [vw]
            lines.append(sum(x[0] * x[1] for x in hist[-7:]) / max(1e-9, sum(x[1] for x in hist[-7:])))
            pc = b5[i - 1][4]
            for L in lines:
                up = pc < L  # coming from below
                if not ((h >= L) if up else (l <= L)): continue
                T += 1
                back = (c < L) if up else (c > L)
                for j in range(i, min(i + 4, len(b5))):
                    _, _, h2, l2, c2, _ = b5[j]
                    if back and j > i and ((L - l2 >= CLEAR) if up else (h2 - L >= CLEAR)): R += 1; break
                    if not back and ((h2 - L >= CLEAR) if up else (L - l2 >= CLEAR)): B += 1; break
                break
        tp = (h + l + c) / 3
        pv += tp * v; vv += v; sq += v * tp * tp; hist.append((tp, v if v > 0 else 1))
    return T, R, B
ms = [m for m in d["markets"].get(ASSET, []) if m.get("close") and datetime.fromisoformat(m["close"].replace("Z", "+00:00")).timestamp() > FROM]
print(f"OVERNIGHT FEED SHOOTOUT · from {datetime.fromtimestamp(FROM, timezone.utc):%Y-%m-%d %H:%MZ} · data pulled {d.get('at')}")
print(f"{'feed':20s} {'anchor':6s} {'touches':>7s} {'respected':>10s} {'blew thru':>10s}   {'Kalshi same call':>16s} {'gap':>6s}")
out = {}
for f in FEEDS:
    bars = d["bars"].get(f)
    if not isinstance(bars, list) or len(bars) < 200: print(f"{f:20s} no data"); continue
    ts = [b[0] for b in bars]; n = ag = 0; gaps = []
    for m in ms:
        try: settle = float(m["settle"]); strike = float(m["strike"])
        except (TypeError, ValueError): continue
        ct = datetime.fromisoformat(m["close"].replace("Z", "+00:00")).timestamp()
        i = bisect.bisect_left(ts, ct - 60)
        if i >= len(ts) or ts[i] != ct - 60: continue
        b = bars[i]; avg = (b[1] + b[2] + b[3] + b[4]) / 4
        n += 1; ag += ((avg >= strike) == (m["result"] == "yes")); gaps.append(abs(avg - settle))
    k = f"{100*ag/n:.1f}% of {n}" if n else "-"
    g = f"${statistics.median(gaps):.2f}" if gaps else "-"
    for name, hour in (("ny", 21), ("utc", 0)):
        T, R, B = score(bars, hour)
        out[f"{f}|{name}"] = {"touches": T, "respected": R, "blewThru": B, "kalshiSame": k, "gap": g}
        rp = f"{100*R/T:.0f}%" if T else "-"; bp = f"{100*B/T:.0f}%" if T else "-"
        print(f"{f:20s} {name:6s} {T:7d} {rp:>10s} {bp:>10s}   {k:>16s} {g:>6s}")
json.dump(out, open(os.path.join(D, "feed-overnight.json" if ASSET == "btc" else "feed-overnight-gold.json"), "w"), indent=1)

# ---- FIRST TO BREAK (Love, Oct 2 ~10:30 PM PT: "pepperstone broke thru first, it will tell us when to sell
# before the others"). For each feed: 5-minute closes through one of her lines (same line on every feed:
# VWAP / +-0.5..3 sigma by index, 5 PM ET anchor) that NO other feed had closed through yet. Then:
#   followed = at least 2 other feeds closed through that same line within the next 3 candles
#   ran      = price kept going $30 past the break close within 3 candles (measured on Kraken, Kalshi's twin)
def breaks(bars):
    b5 = [x for x in to5(bars) if not (x[5] == 0 and x[1] == x[4])]
    ev = {}; pv = vv = sq = 0.0; cur = None; n = 0; prev = None
    for t, o, h, l, c, v in b5:
        s0 = sess(t, 21)
        if cur != s0: cur, pv, vv, sq, n, prev = s0, 0.0, 0.0, 0.0, 0, None
        if vv > 0 and n >= 6:
            vw = pv / vv; sd = math.sqrt(max(sq / vv - vw * vw, 0))
            lines = [vw + k / 2 * sd for k in range(-6, 7)]
            if prev is not None and t >= FROM:
                for k, L in enumerate(lines):
                    if prev < L <= c: ev[(t, k, 1)] = c
                    elif prev > L >= c: ev[(t, k, -1)] = c
        tp = (h + l + c) / 3; pv += tp * v; vv += v; sq += v * tp * tp; n += 1; prev = c
    return ev, {x[0]: x for x in b5}
ALL = {f: breaks(d["bars"][f]) for f in FEEDS if isinstance(d["bars"].get(f), list) and len(d["bars"][f]) > 200}
kr = ALL.get("KRAKEN:BTCUSD" if ASSET == "btc" else "OANDA:XAUUSD", (None, {}))[1]
print(f"\nFIRST TO BREAK · closes through her line before any other feed")
print(f"{'feed':20s} {'first':>6s} {'others followed':>16s} {'ran $30 on':>11s} {'faked':>6s}")
first_out = {}
for f, (ev, _) in ALL.items():
    others = [g for g in ALL if g != f]
    fst = fol = ran = 0
    for (t, k, dr), c in ev.items():
        if any((t - j * 300, k, dr) in ALL[g][0] for g in others for j in range(0, 4)): continue
        fst += 1
        if sum(any((t + j * 300, k, dr) in ALL[g][0] for j in range(1, 4)) for g in others) >= 2: fol += 1
        for j in range(1, 4):
            x = kr.get(t + j * 300)
            if x and ((dr == 1 and x[2] - c >= CLEAR) or (dr == -1 and c - x[3] >= CLEAR)): ran += 1; break
    first_out[f] = {"first": fst, "followed": fol, "ran": ran}
    if fst: print(f"{f:20s} {fst:6d} {100*fol/fst:15.0f}% {100*ran/fst:10.0f}% {100*(fst-fol)/fst:5.0f}%")
json.dump({"bands": out, "firstToBreak": first_out}, open(os.path.join(D, "feed-overnight.json" if ASSET == "btc" else "feed-overnight-gold.json"), "w"), indent=1)
