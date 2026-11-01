#!/usr/bin/env python3
"""Do the bands get respected differently on different feeds? (Claude, Love's ask.) Same 1-minute bars as
feedmatch.json, rolled into 5-minute candles. Lines = session VWAP and ±0.5σ steps to ±3σ (session from
17:00 ET) + the 5m purple nav center. For every 5-minute candle that touches a line from one side:
  REJECT  = the candle closes back on the side it came from;
  HOLD    = after a reject, price moves away from the line by a clear amount (BTC $30 / gold $0.60) within
            the next 3 candles before closing back through it (the bounce actually paid)."""
import json, os, math, statistics
from datetime import datetime, timezone, timedelta
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
d = json.load(open(os.path.join(D, "feedmatch.json")))
def to5(bars):
    out = {}
    for t, o, h, l, c, v in bars:
        k = t // 300 * 300
        if k not in out: out[k] = [k, o, h, l, c, v]
        else:
            x = out[k]; x[2] = max(x[2], h); x[3] = min(x[3], l); x[4] = c; x[5] += v
    return [out[k] for k in sorted(out)]
def sess_start(t):
    dt = datetime.fromtimestamp(t, timezone.utc)
    s = dt.replace(hour=21, minute=0, second=0, microsecond=0)
    if dt < s: s -= timedelta(days=1)
    return s.timestamp()
res = {}
for f, bars in d["bars"].items():
    if not isinstance(bars, list) or len(bars) < 500: continue
    asset = "btc" if "BTC" in f else "gold"
    clear = 30 if asset == "btc" else 0.6
    b5 = [x for x in to5(bars) if not (x[5] == 0 and x[1] == x[4])]
    touches = rejects = holds = 0
    pv = vv = sq = 0.0; cur = None; hist = []
    for i, (t, o, h, l, c, v) in enumerate(b5):
        s0 = sess_start(t)
        if cur != s0: cur, pv, vv, sq, hist = s0, 0.0, 0.0, 0.0, []
        if vv > 0 and len(hist) >= 6:
            vw = pv / vv; sd = math.sqrt(max(sq / vv - vw * vw, 0))
            lines = [vw + k / 2 * sd for k in range(-6, 7)] if sd > 0 else [vw]
            nav = sum(x[0] * x[1] for x in hist[-7:]) / max(1e-9, sum(x[1] for x in hist[-7:]))
            lines.append(nav)
            prev_c = b5[i - 1][4]
            for L in lines:
                came_from = "above" if prev_c > L else "below"
                touched = (l <= L) if came_from == "above" else (h >= L)
                if not touched: continue
                touches += 1
                back = (c > L) if came_from == "above" else (c < L)
                if back:
                    rejects += 1
                    for j in range(i + 1, min(i + 4, len(b5))):
                        _, _, h2, l2, c2, _ = b5[j]
                        if (came_from == "above" and h2 - L >= clear) or (came_from == "below" and L - l2 >= clear): holds += 1; break
                        if (came_from == "above" and c2 < L) or (came_from == "below" and c2 > L): break
                break
        tp = (h + l + c) / 3
        pv += tp * v; vv += v; sq += v * tp * tp
        hist.append((tp, v if v > 0 else 1))
    if touches < 30: continue
    res[f] = {"asset": asset, "touches": touches, "rejectPct": round(100 * rejects / touches, 1), "bouncePaidPct": round(100 * holds / max(1, rejects), 1)}
for a in ("btc", "gold"):
    print(f"\n=== {a.upper()}: candles that touched one of her lines")
    for f, r in sorted([x for x in res.items() if x[1]["asset"] == a], key=lambda x: -x[1]["bouncePaidPct"]):
        print(f"  {f:22s} touches {r['touches']:5d}   closed back (rejected) {r['rejectPct']:5.1f}%   rejection that paid {r['bouncePaidPct']:5.1f}%")
json.dump(res, open(os.path.join(D, "band-respect-feeds.json"), "w"), indent=1)
