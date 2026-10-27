#!/usr/bin/env python3
"""REASON LAB (Claude, Oct 7, Love: "lets lower the early exit rule to within $1 - not $1.50... how many would it have saved
or cost us at different price levels? lets find the sweet spot"). An early exit (take-profit gate / lock the win) only fires
when price is within $X of the strike (gold $1.50 / BTC $100 now). Lowering X means the exits taken with price further away
than X would not have happened then: she rides (the 90% take profit on Kalshi's later minute bids, else the bell). Price at
the exit = the live 1-minute close from the desk's own tape (nav-tape c1). Also: tight bands vs wide bands, BTC and gold."""
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
def tap(a, t):
    m = int(t // 60 * 60)
    for dt in (0, -60, 60): 
        if m + dt in tape[a]: return tape[a][m + dt]
BOOKS = {"brick", "brickc", "new", "cotc", "brickt", "brk1", "confirm"}
E = []
for r in rows.values():
    if r.get("book") not in BOOKS or r.get("dnaMode") or r.get("stale") or r.get("result") != "sold": continue
    ex = r.get("exit") or ""
    if not (ex.startswith("take-profit gate") or ex.startswith("locked the win")): continue
    tk = r.get("ticker") or r["id"].split(":")[0]; cs = cand.get(tk); bell = r.get("bell")
    if not cs or bell not in ("yes", "no") or not r.get("soldAt"): continue
    t1 = ts(r["soldAt"]); c = close_of(tk); ask = r["ask"]; n = r["stake"] / ask; tp_bid = ask + 0.9 * (1 - ask); reached = False
    for (end, bl, bh, bc, al, ah, ac) in cs:
        if end <= t1 + 60 or end > c - 30: continue
        bid = bc if r["side"] == "up" else (None if ac is None else 1 - ac)
        if bid is not None and bid >= tp_bid: reached = True; break
    won = (bell == "yes") == (r["side"] == "up")
    ride = n * tp_bid - r["stake"] if reached else (n - r["stake"] if won else -r["stake"])
    x = tap(r["asset"], t1)
    if not x or not x.get("tgt") or not x.get("c1"): continue
    cush = (x["c1"] - x["tgt"]) if r["side"] == "up" else (x["tgt"] - x["c1"])
    E.append(dict(asset=r["asset"], t=t1, now=r["pnl"], ride=ride, cush=cush, won=won))
print(f"{len(E)} early exits with the live price at the exit\n")
for a, levels in (("gold", (0.25, 0.5, 0.75, 1.0, 1.25, 1.5)), ("btc", (25, 50, 75, 100))):
    xs = sorted([e for e in E if e["asset"] == a], key=lambda e: e["t"]); h = len(xs) // 2
    print(f"{a.upper()} ({len(xs)} early exits): only exit early when price is within $X of the strike")
    for X in levels:
        rid = [e for e in xs if e["cush"] > X]
        d = sum(e["ride"] - e["now"] for e in rid)
        d1 = sum(e["ride"] - e["now"] for e in rid if e in xs[:h]); d2 = d - d1
        print(f"   ${X:<5}: {len(rid):3d} exits would ride instead  {d:+7.0f}  (halves {d1:+.0f} / {d2:+.0f})  of those, lost at the bell: {sum(not e['won'] for e in rid)}")
# TIGHT BANDS: one trade per window (first live-set book), by the session sigma at entry
print("\nTIGHT vs WIDE BANDS (sigma at entry from the desk tape; one trade per window, paper $50):")
own = {}
for r in sorted(rows.values(), key=lambda r: r["at"]):
    if r.get("book") in BOOKS and not r.get("dnaMode") and not r.get("stale"):
        own.setdefault(r.get("ticker") or r["id"].split(":")[0], r)
for a, cuts in (("btc", (0, 60, 100, 150, 250, 1e9)), ("gold", (0, 3, 5, 8, 12, 1e9))):
    g = collections.defaultdict(list)
    for tk, r in own.items():
        if r.get("asset") != a: continue
        x = tap(a, ts(r["at"]))
        if not x or not x.get("sd"): continue
        for lo, hi in zip(cuts, cuts[1:]):
            if lo <= x["sd"] < hi: g[(lo, hi)].append(r)
    for (lo, hi), xs in sorted(g.items()):
        w = sum(r["pnl"] > 0.05 for r in xs); p = sum(r["pnl"] for r in xs)
        print(f"   {a:4s} sigma ${lo:g}-{('' if hi == 1e9 else '$%g' % hi):>5s}: {len(xs):3d} trades {100*w/len(xs):3.0f}%  ${p:+7.0f}  (${p/len(xs):+.1f}/t)")
