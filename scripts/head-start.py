#!/usr/bin/env python3
"""HEAD START (Love, Oct 3: "pepperstone heads the charge... can you keep tabs on that"). From data/confirm-log.jsonl:
who breaks her lines first (Pepperstone vs Vantage), how often the other follows, and how often the window then settles
in the break's direction. Also the 16x comeback study on the real Kalshi bid paths. Writes data/head-start.json."""
import json, os, collections, re, datetime
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
L = [json.loads(l) for l in open(os.path.join(D, "confirm-log.jsonl")) if l.strip()]
rows = json.load(open(os.path.join(D, "night-book.json"))); paths = json.load(open(os.path.join(D, "bid-paths.json")))
bell = {r["ticker"]: r["bell"] for r in rows if r.get("bell") in ("yes", "no")}
for t, p in paths.items():
    if t not in bell and p:
        y = p[-1][1]
        if y >= 0.97: bell[t] = "yes"
        elif y <= 0.03: bell[t] = "no"
g = collections.defaultdict(lambda: [0, 0])
for x in L:
    k = x.get("kind"); b = bell.get(x.get("ticker"))
    if k == "confirmed": lab = f"{x['first'].upper()} first, other FOLLOWED"
    elif k == "unconfirmed": lab = f"{x['feed'].upper()} broke, other did NOT follow"
    elif k == "first": lab = f"{x['feed'].upper()} broke first"
    else: continue
    if not b or x.get("dir") not in ("up", "down"): continue
    g[lab][0] += 1; g[lab][1] += (b == "yes") == (x["dir"] == "up")
out = {"breaks": {k: {"n": n, "settled_that_way": round(w / n, 3)} for k, (n, w) in g.items()}}
print("HEAD START · who breaks first, and does the window follow?")
for k, v in sorted(out["breaks"].items()): print(f"  {k:36} n={v['n']:4}  settled that way {v['settled_that_way']*100:4.0f}%")
def close_ts(t):
    m = re.search(r"-(\d{2})([A-Z]{3})(\d{2})(\d{2})(\d{2})-", t)
    if not m: return None
    yy, mon, dd, hh, mi = m.groups()
    M = {"JAN": 1, "FEB": 2, "MAR": 3, "APR": 4, "MAY": 5, "JUN": 6, "JUL": 7, "AUG": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DEC": 12}[mon]
    return datetime.datetime(2000 + int(yy), M, int(dd), int(hh), int(mi), tzinfo=datetime.timezone(datetime.timedelta(hours=-4))).timestamp()
c = collections.defaultdict(lambda: [0, 0])
for t, p in paths.items():
    if "BTC" not in t or t not in bell: continue
    ct = close_ts(t)
    if not ct: continue
    for side, idx in (("yes", 2), ("no", 1)):
        for x in p:
            if not x[idx]: continue
            if 1 - x[idx] + 0.01 <= 0.0625 and (ct - x[0]) / 60 > 0.5:
                left = (ct - x[0]) / 60
                k = "3+ min left" if left >= 3 else "under 3 min"
                c[k][0] += 1; c[k][1] += bell[t] == side
                break
out["sixteen_x"] = {k: {"n": n, "came_back": w} for k, (n, w) in c.items()}
print("16x COMEBACKS · a side priced 6c or less, did it still win?")
for k, (n, w) in c.items(): print(f"  {k:12} n={n:4} won {w} ({w/max(1,n)*100:.1f}%) · break-even is 6.25%")
json.dump(out, open(os.path.join(D, "head-start.json"), "w"), indent=1)
