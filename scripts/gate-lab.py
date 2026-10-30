#!/usr/bin/env python3
"""GATE LAB (Claude, Oct 7, Love: "she is still defaulting her exits at around 45% whenever i don't set the slider...
most of them end up winning... if we raised her exits a bit and let them hit"). For every settled paper trade of the
live-relevant books that left EARLY (take-profit gate or lock the win), what if she had kept riding: the 90%-of-max take
profit (read off Kalshi's minute bids after the real exit) or, if it never got there, the bell?"""
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
BOOKS = {"brick", "brickc", "new", "cotc", "brickt", "brk1", "confirm"}
res = collections.defaultdict(lambda: [0, 0.0, 0.0, 0, 0, 0])  # n, now, ride, reachedTP, bellWin, bellLoss
miss = 0
for r in rows.values():
    if r.get("book") not in BOOKS or r.get("dnaMode") or r.get("stale") or r.get("result") != "sold": continue
    ex = r.get("exit") or ""
    kind = "take-profit gate" if ex.startswith("take-profit gate") else "lock the win" if ex.startswith("locked the win") else None
    if not kind: continue
    tk = r.get("ticker") or r["id"].split(":")[0]
    cs = cand.get(tk); bell = r.get("bell")
    if not cs or bell not in ("yes", "no") or not r.get("soldAt"): miss += 1; continue
    ask = r["ask"]; stake = r["stake"]; n = stake / ask
    tp_bid = ask * (1 + 0.9 * (1 / ask - 1))  # 90% of the max
    t1 = ts(r["soldAt"]); c = close_of(tk)
    reached = False
    for (end, bl, bh, bc, al, ah, ac) in cs:
        if end <= t1 + 60 or end > c - 30: continue
        bid = bc if r["side"] == "up" else (None if ac is None else 1 - ac)
        if bid is not None and bid >= tp_bid - 1e-9: reached = True; break
    won = (bell == "yes") == (r["side"] == "up")
    ride = n * (min(tp_bid, 0.99) - 0.0) - stake if reached else (n * 1 - stake if won else -stake)
    for key in (kind, "BOTH"):
        x = res[key]; x[0] += 1; x[1] += r["pnl"]; x[2] += ride; x[3] += reached; x[4] += (not reached and won); x[5] += (not reached and not won)
print(f"(no minute prices / bell for {miss} early exits)")
for k in ("take-profit gate", "lock the win", "BOTH"):
    n, now, ride, rt, bw, bl = res[k]
    print(f"{k:17s} {n:4d} early exits | took ${now:+8.0f} | riding instead ${ride:+8.0f} ({ride-now:+.0f}) | after the exit: hit the 90% TP {rt}, won at the bell {bw}, LOST at the bell {bl}")
