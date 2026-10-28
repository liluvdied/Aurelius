#!/usr/bin/env python3
# RECORD-ONLY. Love Oct 27 2026 5:23 PM PT: "if one of the other books takes a trade like that and loses flag it for me
# and let me know and we'll incorporate it into the main book too oki". "Like that" = the 5:15 PM BTC copy long:
# a BTC long within $33 under an unbroken pink (or a short within $33 over one) - fix346b now holds the copy there.
# Reads live-book-done.json + band-log.jsonl + window-results.json; writes data/pink-flags.jsonl. Changes no book.
import json, os, sys, bisect
from datetime import datetime
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
SINCE = "2026-10-28T00:23:00Z"  # from Love's ask on
WALL, BRK = 33.0, 3.0
def ts(s): return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
done = json.load(open(os.path.join(D, "live-book-done.json")))
res = json.load(open(os.path.join(D, "window-results.json")))
fills = [(k, v) for k, v in done.items() if v.get("status") in ("filled", "partial") and "KXBTC15M" in str(v.get("ticker", ""))
         and str(v.get("at", "")) >= SINCE[:19] and ":recon-togp" not in k]
rows = []
if fills:
    t0 = min(ts(v["at"]) for _, v in fills) - 300
    with open(os.path.join(D, "band-log.jsonl")) as f:
        for ln in f:
            if '"btc"' not in ln: continue
            try: r = json.loads(ln)
            except Exception: continue
            if ts(r["at"]) >= t0: rows.append(r)
times = [ts(r["at"]) for r in rows]
wp = {}  # the tick the wire saw the moment it passed her order (band-log is once a minute - too coarse for a break)
if fills:
    with open(os.path.join(D, "wire-pass.jsonl")) as f:
        for ln in f:
            if '"btc"' not in ln: continue
            try: r = json.loads(ln)
            except Exception: continue
            if ts(r["at"]) >= t0: wp.setdefault((r.get("ticker"), r.get("side")), []).append((ts(r["at"]), float(r["tick"])))
fp = os.path.join(D, "pink-flags.jsonl")
seen = set()
if os.path.exists(fp):
    for ln in open(fp):
        try: seen.add(json.loads(ln)["key"])
        except Exception: pass
new, watch = [], 0
for k, v in fills:
    t = ts(v["at"]); i = bisect.bisect_right(times, t) - 1  # the fill moment, not her first try
    if i < 0: continue
    r = rows[i]; tick = float(r["tick"]); near_wp = [x for x in wp.get((v["ticker"], v.get("side")), []) if t - 5 <= x[0] <= t]
    if near_wp: tick = near_wp[-1][1]
    pp = next((float(p) for n, p in r["L"] if n == "5m PP"), 0)
    side = v.get("side"); d = (pp - tick) if side == "up" else (tick - pp)
    near = pp > 0 and ((side == "up" and pp > tick - BRK and pp - tick <= WALL) or (side == "down" and pp < tick + BRK and tick - pp <= WALL))
    if not near: continue
    watch += 1
    out = res.get(v["ticker"]); lost = out in ("yes", "no") and ((side == "up") != (out == "yes"))
    if lost and k not in seen:
        e = {"key": k, "book": k.split(":")[-1], "ticker": v["ticker"], "side": side, "tick": tick, "pink": pp, "dist": round(d, 2), "paid": v.get("paid"), "result": out, "flaggedAt": datetime.utcnow().isoformat() + "Z"}
        open(fp, "a").write(json.dumps(e) + "\n"); new.append(e)
for e in new: print(f"FLAG: {e['book']} {('long' if e['side']=='up' else 'short')} {e['ticker']} ${e['dist']} {'under' if e['side']=='up' else 'over'} unbroken pink {e['pink']:.2f} - LOST")
print(f"PINK FLAG: {len(new)} new losing BTC trade(s) within $33 of an unbroken pink (other books, since Love's 5:23 PM ask); {watch} such trade(s) seen in all")
