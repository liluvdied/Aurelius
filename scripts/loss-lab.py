#!/usr/bin/env python3
"""LOSS LAB (Claude, Oct 7, Love: "something we've learned within the majority of our losses, something we could be doing
better, something we are doing well that we should double down on"). Settled paper trades of the books that matter."""
import json, datetime, re, collections, calendar
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
    if not m: return None
    mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].index(m.group(2))
    return calendar.timegm((2000 + int(m.group(1)), mon + 1, int(m.group(3)), int(m.group(4)) + 4, int(m.group(5)), 0))
BOOKS = {"brick", "brickc", "new", "cotc", "brk1", "confirm", "brickt"}
X = []
for r in rows.values():
    if r.get("book") not in BOOKS or r.get("dnaMode") or r.get("stale"): continue
    tk = r.get("ticker") or r["id"].split(":")[0]
    if "15M-" not in tk: continue
    c = close_of(tk); left = (c - ts(r["at"])) / 60 if c else None
    X.append(dict(r, tk=tk, left=left, win=r["pnl"] > 0.05))
def st(xs):
    n = len(xs); w = sum(x["win"] for x in xs); p = sum(x["pnl"] for x in xs)
    return f"{n:4d}t {100*w/max(1,n):3.0f}% ${p:+8.0f} (${p/max(1,n):+5.1f}/t)"
print("ALL", st(X), "| since", min(x["at"] for x in X)[:16])
L = [x for x in X if not x["win"]]
print("\nLOSSES:", len(L), "total $", round(sum(x["pnl"] for x in L)))
full = [x for x in L if x["pnl"] <= -45]
print(f"  full losses (held to the bell, -$45..-50): {len(full)} = ${sum(x['pnl'] for x in full):.0f}  | partial cuts: {len(L)-len(full)} = ${sum(x['pnl'] for x in L if x['pnl']>-45):.0f}")
for th in (10, 20, 30, 50):
    g = [x for x in full if (x.get("peakPct") or 0) >= th]
    print(f"  full losses that were up +{th}% or more first: {len(g)} ({100*len(g)/max(1,len(full)):.0f}%)")
ex = collections.Counter((x.get("exit") or x.get("result") or "").split(" (")[0].split(":")[0][:28] for x in L)
print("  how losses ended:", dict(ex.most_common(6)))
def by(name, key, xs=X):
    print(f"\nBY {name}:")
    g = collections.defaultdict(list)
    for x in xs: g[key(x)].append(x)
    for k in sorted(g, key=lambda k: str(k)): print(f"  {str(k):34s} {st(g[k])}")
by("asset", lambda x: x.get("asset"))
by("multiple", lambda x: "1.38-1.5x" if x["ask"] > 0.667 else "1.5-1.75x" if x["ask"] > 0.571 else "1.75-2x" if x["ask"] > 0.5 else "2-2.5x" if x["ask"] >= 0.4 else "2.5x+")
by("minutes left at entry", lambda x: "?" if x["left"] is None else "12-15" if x["left"] > 12 else "9-12" if x["left"] > 9 else "6-9" if x["left"] > 6 else "3-6" if x["left"] > 3 else "0-3")
def fam(x):
    s = x.get("setup") or ""
    kind = "rejection/tap" if re.search(r"reject|Tap-reject|PUSH|bounce", s, re.I) else "close through/break" if re.search(r"close (above|below)|break|CONFIRM", s, re.I) else "other"
    line = "purple" if "purple" in s else "nav upper/lower" if re.search(r"upper|lower", s) else "session band" if re.search(r"σ|VWAP|sigma", s) else "?"
    return f"{kind} · {line}"
by("setup", fam)
by("hour PT (4h)", lambda x: f"{(x.get('hourPT') if x.get('hourPT') is not None else -1)//4*4:02d}-{(x.get('hourPT') or 0)//4*4+4:02d}")
by("side vs asset", lambda x: f"{x.get('asset')} {x.get('side')}")
# streak after a loss in the same window-hour? same-direction re-entry after loss
by("exit (all trades)", lambda x: (x.get("exit") or x.get("result") or "").split(" (")[0].split(":")[0][:30])

print("\nROBUSTNESS (first half / second half of the period):")
Xs = sorted(X, key=lambda x: x["at"]); h = len(Xs) // 2
for name, f in (("gold up", lambda x: x.get("asset") == "gold" and x.get("side") == "up"), ("gold down", lambda x: x.get("asset") == "gold" and x.get("side") == "down"),
                ("12-16 PT", lambda x: x.get("hourPT") is not None and 12 <= x["hourPT"] < 16), ("2-2.5x", lambda x: 0.4 <= x["ask"] <= 0.5),
                ("break · session band", lambda x: fam(x) == "close through/break · session band"), ("rejection · nav upper/lower", lambda x: fam(x) == "rejection/tap · nav upper/lower"),
                ("9-12 min left", lambda x: x["left"] is not None and 9 < x["left"] <= 12)):
    a = [x for x in Xs[:h] if f(x)]; b = [x for x in Xs[h:] if f(x)]
    print(f"  {name:28s} {st(a)}  |  {st(b)}")

print("\nLOCK LAB: a trade that got to +A% and fell back to +B% sells there (minute close bid, 1c under)")
cand = json.load(open(f"{D}/stop-lab-candles.json"))["candles"]
T = []
for x in X:
    cs = cand.get(x["tk"]); c = close_of(x["tk"])
    if not cs or not c: continue
    t0 = ts(x["at"]); tx = ts(x["soldAt"]) if x.get("result") == "sold" and x.get("soldAt") else c
    path = []
    for (end, bl, bh, bc, al, ah, ac) in cs:
        if end - 60 < t0 or end > min(tx, c): continue
        bid = bc if x["side"] == "up" else (None if ac is None else round(1 - ac, 4))
        if bid is not None: path.append(bid)
    T.append((x, path))
base = sum(x["pnl"] for x, _ in T)
print(f"  {len(T)} trades with minute prices, now ${base:+.0f}")
for A in (15, 20, 25):
    for B in (0, 5, 10):
        tot = 0; cut = saved = gave = 0
        for x, path in T:
            new = x["pnl"]; peak = -1e9
            for bid in path:
                pct = (bid / x["ask"] - 1) * 100; peak = max(peak, pct)
                if peak >= A and pct <= B:
                    new = round(x["stake"] / x["ask"] * max(bid - 0.01, 0) - x["stake"], 2); cut += 1
                    if new > x["pnl"]: saved += 1
                    else: gave += 1
                    break
            tot += new
        print(f"  +{A}% then back to +{B}%: {tot-base:+7.0f}  (sold {cut}: saved {saved}, gave up a win {gave})")
