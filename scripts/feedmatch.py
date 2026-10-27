#!/usr/bin/env python3
"""FEED MATCH (Claude, Love's ask). Which chart feed tracks Kalshi's own settlement price best?
For every settled 15-minute window: Kalshi's settle price (the index averaged over the last minute) vs
each feed's last 1-minute candle before the close (its OHLC average), and whether the feed would have
called the same YES/NO as Kalshi did against the strike. Reads data/feedmatch.json."""
import json, os, statistics, bisect
from datetime import datetime
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
d = json.load(open(os.path.join(D, "feedmatch.json")))
res = {}
for asset, ms in d["markets"].items():
    feeds = [k for k, v in d["bars"].items() if isinstance(v, list) and len(v) > 100 and (("BTC" in k) == (asset == "btc"))]
    print(f"\n=== {asset.upper()} · {len(ms)} settled windows from Kalshi")
    rows = []
    for f in feeds:
        bars = d["bars"][f]
        ts = [b[0] for b in bars]
        diffs, agree, n, close_only = [], 0, 0, []
        for m in ms:
            try:
                settle = float(m["settle"]); strike = float(m["strike"])
            except (TypeError, ValueError):
                continue
            ct = datetime.fromisoformat(m["close"].replace("Z", "+00:00")).timestamp()
            i = bisect.bisect_left(ts, ct - 60)
            if i >= len(ts) or ts[i] != ct - 60: continue
            b = bars[i]
            if b[5] == 0 and b[1] == b[4] == b[2] == b[3]: continue  # flat/closed bar
            avg = (b[1] + b[2] + b[3] + b[4]) / 4
            diffs.append(avg - settle)
            close_only.append(b[4] - settle)
            n += 1
            agree += ((avg >= strike) == (m["result"] == "yes"))
        if n < 20: continue
        ad = [abs(x) for x in diffs]
        rows.append((f, n, round(statistics.median(ad), 2), round(statistics.mean(diffs), 2), round(100 * agree / n, 1), round(statistics.median([abs(x) for x in close_only]), 2)))
    rows.sort(key=lambda r: r[2])
    print(f"  {'feed':22s} {'windows':>7s} {'median |gap|':>13s} {'avg bias':>9s} {'same call as Kalshi':>20s}")
    for r in rows: print(f"  {r[0]:22s} {r[1]:7d} {r[2]:13.2f} {r[3]:+9.2f} {r[4]:19.1f}%")
    res[asset] = rows
json.dump(res, open(os.path.join(D, "feedmatch-result.json"), "w"), indent=1)
