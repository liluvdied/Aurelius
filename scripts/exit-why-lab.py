#!/usr/bin/env python3
"""EXIT-WHY LAB (Claude, Oct 7, Love: "only exit early if it's actually reversing... a multiple gate: if the multiple is
under 1.4x at the time of her exit, she doesn't do it?"). Every early exit (take-profit gate / lock the win) of the
live-relevant paper books: the multiple at that moment (1 / the bid she sold at), how far price was past the strike
(nav-tape, the desk's own minute tape), and what riding would have paid (the 90% take profit on Kalshi's later minute
bids, else the bell). Then: which "only exit if..." rules would have kept more."""
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
E = []
for r in rows.values():
    if r.get("book") not in BOOKS or r.get("dnaMode") or r.get("stale") or r.get("result") != "sold": continue
    ex = r.get("exit") or ""
    if not (ex.startswith("take-profit gate") or ex.startswith("locked the win")): continue
    tk = r.get("ticker") or r["id"].split(":")[0]; cs = cand.get(tk); bell = r.get("bell")
    if not cs or bell not in ("yes", "no") or not r.get("soldAt") or not r.get("sellBid"): continue
    t1 = ts(r["soldAt"]); c = close_of(tk); ask = r["ask"]; n = r["stake"] / ask
    tp_bid = ask + 0.9 * (1 - ask); reached = False
    for (end, bl, bh, bc, al, ah, ac) in cs:
        if end <= t1 + 60 or end > c - 30: continue
        bid = bc if r["side"] == "up" else (None if ac is None else 1 - ac)
        if bid is not None and bid >= tp_bid: reached = True; break
    won = (bell == "yes") == (r["side"] == "up")
    ride = n * tp_bid - r["stake"] if reached else (n - r["stake"] if won else -r["stake"])
    m = int(t1 // 60 * 60); tp = None
    for dt in (0, -60, 60, -120):
        tp = tape[r.get("asset")].get(m + dt)
        if tp: break
    cush = None
    if tp and tp.get("tgt") and tp.get("spot"):
        cush = (tp["spot"] - tp["tgt"]) if r["side"] == "up" else (tp["tgt"] - tp["spot"])
    E.append(dict(kind="gate" if ex.startswith("take") else "lock", asset=r.get("asset"), bid=r["sellBid"], now=r["pnl"], ride=ride, cush=cush, left=(c - t1) / 60, won=won))
print(f"{len(E)} early exits (gate {sum(e['kind']=='gate' for e in E)}, lock {sum(e['kind']=='lock' for e in E)}), took ${sum(e['now'] for e in E):+.0f}; riding all of them ${sum(e['ride'] for e in E):+.0f}")
print("\nBY THE MULTIPLE LEFT AT THE EXIT (1 / sell bid):")
for lo, hi, lab in ((0, .6, "1.67x+ (bid under 60c)"), (.6, .7143, "1.4-1.67x (60-71c)"), (.7143, .8, "1.25-1.4x (71-80c)"), (.8, 1.01, "under 1.25x (80c+)")):
    xs = [e for e in E if lo <= e["bid"] < hi]
    if xs: print(f"  {lab:24s} {len(xs):4d} exits  took ${sum(e['now'] for e in xs):+7.0f}  ride ${sum(e['ride'] for e in xs):+7.0f}  ({sum(e['ride']-e['now'] for e in xs):+.0f} if she rode)  lost at the bell {sum(not e['won'] for e in xs)}")
print("\nBY HOW FAR PRICE WAS PAST THE STRIKE AT THE EXIT:")
for a, cuts in (("gold", (-99, 0, 0.5, 1.0, 1.5, 99)), ("btc", (-9999, 0, 25, 50, 100, 9999))):
    for lo, hi in zip(cuts, cuts[1:]):
        xs = [e for e in E if e["asset"] == a and e["cush"] is not None and lo <= e["cush"] < hi]
        if xs: print(f"  {a:4s} {('$%g' % lo):>6s} to {('$%g' % hi):>6s}: {len(xs):4d} exits  took ${sum(e['now'] for e in xs):+7.0f}  ride ${sum(e['ride'] for e in xs):+7.0f}  ({sum(e['ride']-e['now'] for e in xs):+.0f})  lost at the bell {sum(not e['won'] for e in xs)}")
print("\nRULES: 'only exit early if ...' (otherwise ride):")
def rule(name, keep):
    d = sum((e["ride"] - e["now"]) for e in E if not keep(e))
    print(f"  {name:58s} {d:+7.0f}  (rides {sum(not keep(e) for e in E)})")
rule("the multiple left is 1.4x+ (bid under 71c)", lambda e: e["bid"] < 0.7143)
rule("the multiple left is 1.25x+ (bid under 80c)", lambda e: e["bid"] < 0.8)
for g, b in ((0.5, 25), (0.75, 50), (1.0, 75)):
    rule(f"price is within gold ${g} / BTC ${b} of the strike", lambda e, g=g, b=b: e["cush"] is None or e["cush"] <= (g if e["asset"] == "gold" else b))
rule("more than 5 minutes left", lambda e: e["left"] > 5)
rule("gold within $0.75 / BTC $50, OR bid under 80c", lambda e: e["bid"] < 0.8 or e["cush"] is None or e["cush"] <= (0.75 if e["asset"] == "gold" else 50))
