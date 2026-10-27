#!/usr/bin/env python3
"""TP LAB (Claude, Oct 7, Love: "can we try taking 75% of whats available?"). Settled paper trades of the live-relevant
books on Kalshi's real minute bids: add a hard take profit at P% of the max (sell the first minute the bid gets there,
1c under) ahead of everything she does now. A trade that never gets there does exactly what it really did."""
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
T = []
for r in rows.values():
    if r.get("book") not in BOOKS or r.get("dnaMode") or r.get("stale"): continue
    tk = r.get("ticker") or r["id"].split(":")[0]
    cs = cand.get(tk)
    if not cs or "15M-" not in tk: continue
    t0 = ts(r["at"]); c = close_of(tk); tx = ts(r["soldAt"]) if r.get("result") == "sold" and r.get("soldAt") else c
    path = []
    for (end, bl, bh, bc, al, ah, ac) in cs:
        if end - 60 < t0 or end > min(tx, c): continue
        # the best bid inside the minute (high), so a level touched mid-minute counts; sold 1c under it
        bid = bh if r["side"] == "up" else (None if al is None else 1 - al)
        if bid is not None: path.append(bid)
    T.append((r, path))
base = sum(r["pnl"] for r, _ in T)
ex = collections.Counter(("gate" if (r.get("exit") or "").startswith("take-profit gate") else "lock" if (r.get("exit") or "").startswith("locked") else "TP" if (r.get("exit") or "").startswith("take profit") else "bell") for r, _ in T)
print(f"{len(T)} trades, now ${base:+.0f}  ({dict(ex)})")
for P in (50, 60, 65, 70, 75, 80, 85):
    tot = 0; hit = 0; up = dn = 0; saved_loss = 0; cut_tp = 0
    for r, path in T:
        lvl = r["ask"] + P / 100 * (1 - r["ask"])
        new = r["pnl"]
        for b in path:
            if b >= lvl + 0.01:
                new = round(r["stake"] / r["ask"] * lvl - r["stake"], 2); hit += 1
                if r["pnl"] < 0: saved_loss += 1
                if new > r["pnl"]: up += 1
                else: dn += 1
                break
        tot += new
    print(f"  take profit at {P}% of the max: ${tot:+8.0f} ({tot-base:+6.0f})  reached by {hit}: better {up} (incl. {saved_loss} that LOST at the bell), worse {dn}")
