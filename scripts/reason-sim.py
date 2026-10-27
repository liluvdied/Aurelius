#!/usr/bin/env python3
"""REASON SIM (Claude, Oct 7, Love: "lower the early exit rule to within $1... $75 might be better on btc too, do the
numbers"). Replays every paper trade of the live books minute by minute on Kalshi's real minute bids and the desk's own
1-minute price tape, with BRICK's exits exactly (90% take profit + 1% trail, the take-profit gates, lock the win), and
only the "near the strike" distance changed. Same simulator for every setting, so the settings compare fairly."""
import json, datetime, re, calendar, collections
D = "data"
rows = {}
for l in open(f"{D}/exit-ledger.jsonl"):
    try: r = json.loads(l); rows[r["id"]] = r
    except: pass
for r in json.load(open(f"{D}/night-book.json")):
    if r.get("result") != "open" and r.get("pnl") is not None: rows[r["id"]] = r
ts = lambda s: datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
def close_of(t):
    m = re.search(r"-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)", t)
    mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].index(m.group(2))
    return calendar.timegm((2000 + int(m.group(1)), mon + 1, int(m.group(3)), int(m.group(4)) + 4, int(m.group(5)), 0))
cand = json.load(open(f"{D}/stop-lab-candles.json"))["candles"]
tape = collections.defaultdict(dict)
for x in json.load(open(f"{D}/nav-tape.json")): tape[x["a"]][x["t"]] = x
BOOKS = {"brick", "brickc", "new", "cotc", "brickt", "brk1", "confirm"}
UNDERWATER_OK = {"brickc", "new", "brk1", "confirm"}  # books not in the desk's "never under breakeven" list
T = []
for r in rows.values():
    if r.get("book") not in BOOKS or r.get("dnaMode") or r.get("stale") or r.get("bell") not in ("yes", "no"): continue
    tk = r.get("ticker") or r["id"].split(":")[0]; cs = cand.get(tk)
    if not cs or "15M-" not in tk: continue
    t0 = ts(r["at"]); c = close_of(tk); path = []
    for (end, bl, bh, bc, al, ah, ac) in cs:
        if end - 60 < t0 or end > c - 5: continue
        bid = bc if r["side"] == "up" else (None if ac is None else 1 - ac)
        x = tape[r["asset"]].get(int((end - 60) // 60 * 60))
        if bid is None or not x or not x.get("tgt") or not x.get("c1"): continue
        cush = (x["c1"] - x["tgt"]) if r["side"] == "up" else (x["tgt"] - x["c1"])
        path.append((bid, cush))
    if len(path) < 3: continue
    won = (r["bell"] == "yes") == (r["side"] == "up")
    T.append(dict(r=r, path=path, won=won))
def sim(X):
    tot = 0.0
    for t in T:
        r = t["r"]; ask = r["ask"]; n = r["stake"] / ask; mult = 1 / ask; maxp = (mult - 1) * 100
        tp = max(1, maxp * 0.9); peak = -1e9; armed = False; out = None
        gates = ([40] if 40 < maxp else []) if mult < 1.65 else [maxp * 0.55, maxp * 0.6]
        for bid, cush in t["path"]:
            pct = (bid / ask - 1) * 100; peak = max(peak, pct)
            if pct >= tp: armed = True
            if armed:
                if bid >= 0.97 or pct < max(tp, int(peak) - 1): out = bid; break
                continue
            reason = cush <= X
            above = r["book"] in UNDERWATER_OK or pct > 0
            if reason and above:
                fl = [gp for gp in gates if peak >= gp]
                if fl and pct < fl[-1]: out = bid; break
                if peak >= 30 and pct <= 20: out = bid; break
        tot += (n * out - r["stake"]) if out is not None else ((n - r["stake"]) if t["won"] else -r["stake"])
    return tot
print(f"{len(T)} paper trades with minute prices")
for a, Xs, cur in (("gold", (0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 1e9), 1.5), ("btc", (25, 50, 75, 100, 150, 250, 1e9), 100)):
    sub = [t for t in T if t["r"]["asset"] == a]; full = T
    globals()["T"] = sub
    base = sim(cur); h = len(sub) // 2; sub.sort(key=lambda t: t["r"]["at"])
    print(f"\n{a.upper()} ({len(sub)} trades), early exits only within $X of the strike. Now: ${cur:g} = ${base:+.0f}")
    for X in Xs:
        v = sim(X)
        globals()["T"] = sub[:h]; v1 = sim(X) - sim(cur); globals()["T"] = sub[h:]; v2 = sim(X) - sim(cur); globals()["T"] = sub
        print(f"   {('any distance' if X == 1e9 else '$%g' % X):>13s}: ${v:+7.0f}  ({v-base:+6.0f} vs now; halves {v1:+.0f} / {v2:+.0f})")
    globals()["T"] = full
