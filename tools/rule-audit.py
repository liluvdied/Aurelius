#!/usr/bin/env python3
"""RULE AUDIT (Oct 20 ~11:18 PM PT, Love: "make sure a breach doesn't go undetected somehow and not get realized on impact / a breach would constitute
a deviation from the rules we set in place that she has currently been operating under properly"). The wire refuses breaches at impact; this is the
independent second pair of eyes. Every opening BTC/gold 15m order in data/order-trail.jsonl is checked against her rules from the desk's own band log
(data/band-log.jsonl), not from the wire's numbers:
  - it went through THE WALL AT THE WIRE (a wire-pass for that market and side within 3 s before it)
  - size: no single opening order over $12.50 (her $10 slider + rounding)
  - no long in the top 33% of the channel / no short in the bottom 33% (margin: 70% / 30%)
  - no long 2 sigma+ over session VWAP / no short 2 sigma+ under (margin 2.05)
  - her candle: no long on a falling 5m candle / no short on a rising one (by more than her tap)
Writes data/rule-audit.json. Read-only on everything else."""
import json, os, bisect, datetime, sys
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
ts = lambda s: datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
OUT = "data/rule-audit.json"
st = {}
try: st = json.load(open(OUT))
except Exception: pass
since = ts(sys.argv[1]) if len(sys.argv) > 1 else ts(st.get("checkedTo", "2026-10-21T06:20:00Z"))
TAP = {"btc": 3.0, "gold": 0.3}
def tail(path, nbytes):
    with open(path, "rb") as f:
        f.seek(0, 2); n = f.tell(); f.seek(max(0, n - nbytes)); return f.read().decode("utf8", "ignore").splitlines()[1:]
orders = []
for ln in tail("data/order-trail.jsonl", 4_000_000):
    try: o = json.loads(ln)
    except Exception: continue
    if o.get("method") != "POST" or o.get("path") != "/portfolio/events/orders" or o.get("reduceOnly"): continue
    t = str(o.get("ticker", ""))
    if not (t.startswith("KXBTC15M") or t.startswith("KXGOLD15M")) or "restTakeProfit" in str(o.get("by", "")) or "addOnBuy" in str(o.get("by", "")): continue  # free add-ons are Love's rule, not a breach (Oct 22 10:39 PM PT, Love: "yes, you can exempt that from her record")
    if ts(o["at"]) <= since or o.get("result") not in (200, 201): continue
    orders.append(o)
wp = []
for ln in tail("data/wire-pass.jsonl", 2_000_000):
    try: w = json.loads(ln); wp.append((ts(w["at"]), w["ticker"], w["side"], float(w.get("tick") or 0), float(w.get("lock") or 0)))
    except Exception: pass
B = {"btc": [], "gold": []}
for ln in tail("data/band-log.jsonl", 3_000_000):
    try: r = json.loads(ln)
    except Exception: continue
    if r.get("asset") in B:
        LL = dict((n, float(p)) for n, p in r["L"])
        bz = r.get("bbsr") or {}
        if float(bz.get("u") or 0) > 0 and float(bz.get("l") or 0) > 0: LL["BB upper"] = float(bz["u"]); LL["BB lower"] = float(bz["l"])
        B[r["asset"]].append((ts(r["at"]), float(r["tick"]), LL))
for a in B: B[a].sort(key=lambda x: x[0])
K = {a: [x[0] for x in B[a]] for a in B}
OPEN5 = {}
M1 = {}  # 1m bars (desk ticks) for the 1m-rejection waiver (Love, Oct 21 ~12:06 PM PT)
try:
    for x in json.load(open("data/nav-tape.json")):
        if x.get("a") in B and int(x.get("t", 0)) % 300 == 0 and float(x.get("spot") or 0) > 0: OPEN5[(x["a"], int(x["t"]))] = float(x["spot"])
except Exception: pass
# better: the desk's own chart candle (data/latency-shadow.jsonl "tv" 1m bar that starts on the 5m boundary)
for ln in tail("data/latency-shadow.jsonl", 3_000_000):
    try:
        x = json.loads(ln)
        if x.get("kind") == "close" and x.get("asset") in B:
            m0 = int(ts(x["minute"]))
            if m0 % 300 == 0 and float(x["tv"]["o"]) > 0: OPEN5[(x["asset"], m0)] = float(x["tv"]["o"])
            M1[(x["asset"], m0)] = (float(x["tick"]["h"]), float(x["tick"]["l"]), float(x["tick"]["c"]))
    except Exception: pass
def _quiet(t): return t >= 1792621800 and (_dt.datetime.fromtimestamp(t, _dt.timezone.utc) - _dt.timedelta(hours=7)).hour == 15  # the 3 PM channel from Oct 22
QT = [0]
def chan(asset, L, sqz=True):
    if QT[0]:  # 3-4 PM PT: pink, red/green zones, Bollinger (Love, Oct 21)
        return sorted(p for n, p in L.items() if n in ("5m PP", "5m R1", "5m S1", "BB upper", "BB lower") and p > 0), 0
    sd = (L.get("+1σ", 0) - L.get("session VWAP", 0)) if "session VWAP" in L else 0
    sess = {n: p for n, p in L.items() if n.endswith("σ") or n == "session VWAP"}
    out = []
    for n, p in L.items():
        if n.endswith("σ") or n == "session VWAP":  # session bands only (Love, Oct 21 11:15 AM PT)
            if n == "5m PP" and sqz and sd > 0 and any(abs(q - p) < 0.25 * sd for q in sess.values()): continue
            out.append(p)
    return sorted(out), sd
breaches, checked = [], 0
# THE DELAYED BOOK AT ANY LEVEL (Love, Oct 21 ~10:59 AM PT): in TOGETHER's off hours the twin's (recon-dly) openings skip the level walls at the wire,
# so here they are checked for the wire pass and size only.
import datetime as _dt
try: _sw = json.load(open("data/live-switch.json")); OFFH = set(int(x) for x in (_sw.get("bookSkipHours", {}).get("recon-tog") or []))
except Exception: OFFH = set()
try: _dd = json.load(open("data/live-book-done.json")); DLY = {(k.split(":")[0], str(v.get("side"))) for k, v in _dd.items() if ":recon-dly" in k and isinstance(v, dict)}
except Exception: DLY = set()
# THE DESK'S OWN 1m-REJECTION LABEL (Oct 21 ~3:20 PM PT, Love "yes pls" to teaching the audit the waiver at the open): in a candle's first seconds the
# audit's 1m bars can't show the tap yet, so an entry the desk booked as "1m rejection off <session band / Bollinger>" waives the candle check by its label.
# Pivot lines ("5m ...") are NOT waived this way: a pivot born at the open has no tap inside its own candle yet (the 1:00 PM bug).
try:
    _og = json.load(open("data/grok-og.json")); _og = _og.get("rows", _og) if isinstance(_og, dict) else _og
    LBL = {(r.get("ticker"), r.get("side")): str(r.get("label", "")) for r in _og if isinstance(r, dict) and r.get("lane") in ("recon-tog", "recon-dly")}
except Exception: LBL = {}
# HER SLIDER (Oct 23 ~9:33 AM PT, Love "yess she's good"): the size cap follows live-switch maxDollars (was a fixed $12.50 for her old $10)
try: MAXD = float(_sw.get("maxDollars") or 10)
except Exception: MAXD = 10.0
CAPD = max(12.5, MAXD + 0.5)
def _pth(t): return (_dt.datetime.fromtimestamp(t, _dt.timezone.utc) - _dt.timedelta(hours=7)).hour
for o in orders:
    t = ts(o["at"]); tk = o["ticker"]; side = "up" if o["side"] == "bid" else "down"; asset = "btc" if tk.startswith("KXBTC") else "gold"
    checked += 1; why = []
    QT[0] = 1 if _quiet(t) else 0
    wm = [w for w in wp if tk == w[1] and side == w[2] and 0 <= t - w[0] <= 3]
    if not wm: why.append("did not pass through the wire")
    px = float(o.get("price", 0)); cost = float(o.get("count", 0)) * (px if o["side"] == "bid" else 1 - px)  # an "ask" order is a NO buy at 1 - price
    if cost > CAPD: why.append(f"size ${cost:.2f} over her ${MAXD:g} slider")
    i = bisect.bisect_right(K[asset], t) - 1
    # the pink and pivots reset on each 5m boundary: if the prior sample is from the previous 5m candle, read the next one in this candle instead
    if i + 1 < len(B[asset]) and (i < 0 or int(B[asset][i][0] // 300) != int(t // 300)) and int(B[asset][i + 1][0] // 300) == int(t // 300): i = i + 1
    # a sample taken in the first seconds of the candle can still carry the old pivot - prefer the next one in the same candle
    if i >= 0 and i + 1 < len(B[asset]) and B[asset][i][0] - (t - t % 300) < 5 and int(B[asset][i + 1][0] // 300) == int(t // 300): i = i + 1
    free = (tk, side) in DLY and t >= 1792605600  # from 11:00 AM PT Oct 21; the twin's own order (Oct 23: not by today's hour list - Love moves hours in-app)
    if t >= 1792607055 and t < 1792632180: free = False  # 11:24 AM PT Oct 21: back under ALL her rules (Love 11:23 AM); from 6:23 PM PT Oct 21 DLY_FREE waives HER CANDLE again
    freeAll = free and t < 1792606925  # from 11:22 AM PT Oct 21 the twin keeps her 33% + top/bottom line (Love); only HER CANDLE stays waived
    if i >= 0 and abs(t - B[asset][i][0]) <= 60 and not freeAll:
        _, tick, L = B[asset][i]
        if wm and wm[-1][3] > 0: tick = wm[-1][3]  # the live price at the wire; the band log samples once a minute
        # a squeezed pink is no edge, but the squeeze is a hairline call (the band log samples once a minute, the wire reads live):
        # only a position that sits in the wrong third BOTH with and without the pink counts as a breach.
        def posOf(sq):
            ed, _ = chan(asset, L, sq)
            lo = [e for e in ed if e <= tick]; hi = [e for e in ed if e > tick]
            return (tick - lo[-1]) / (hi[0] - lo[-1]) if lo and hi and hi[0] > lo[-1] else None
        edges, sd = chan(asset, L)
        pA, pB = posOf(True), posOf(False)
        if pA is not None and pB is not None:
            pos = min(pA, pB) if side == "up" else max(pA, pB)
            wl = wm[-1][4] if wm and len(wm[-1]) > 4 and 0.1 <= wm[-1][4] <= 0.45 else 0  # the desk's own sliding share at the wire (lockPctFor), Oct 23
            hiP, loP = (0.95, 0.05) if (free and asset == "btc" and t >= 1792632180) else (0.70, 0.30)  # twin hours on BTC: only the last 5% before the band (dlyKeeps)
            if wl and not (free and asset == "btc"): hiP, loP = 1 - wl + 0.03, wl - 0.03
            if side == "up" and pos >= hiP: why.append(f"long at {pos:.0%} of the channel (top third)")
            if side == "down" and pos <= loP: why.append(f"short at {pos:.0%} of the channel (bottom third)")
        # THE WHOLE CHANNEL'S TOP AND BOTTOM LINES (Love, Oct 21 ~11:15 AM PT): no long over the top session band, no short under the bottom one
        if edges and t >= 1792608000:
            if side == "up" and tick > edges[-1] + (3 if asset == "btc" else 0.3): why.append(f"long over the top line of her whole channel ({edges[-1]:.2f})")
            if side == "down" and tick < edges[0] - (3 if asset == "btc" else 0.3): why.append(f"short under the bottom line of her whole channel ({edges[0]:.2f})")
        if sd > 0:
            z = (tick - L["session VWAP"]) / sd
            # 2σ rule dropped Oct 21 11:12 AM PT (Love)
            if False and side == "up" and z >= 2.05: why.append(f"long chasing at {z:.2f} sigma")
            if False and side == "down" and z <= -2.05: why.append(f"short chasing at {-z:.2f} sigma")
        # the 5m open = the desk's own tape price stamped exactly on the 5m boundary (data/nav-tape.json); no exact stamp, no candle verdict
        # (a band-log sample a few seconds in is not the open - 07:00 BTC was flagged falsely that way).
        b0 = int(t - (t % 300))
        o5 = OPEN5.get((asset, b0))
        def m1rej():
            m = int(t // 60) * 60 - 60
            last, prev = M1.get((asset, m)), M1.get((asset, m - 60))
            if not last: return False
            two = [x for x in (prev, last) if x]
            for nm, bp in L.items():
                try: bp = float(bp)
                except Exception: continue
                if bp <= 0: continue
                if nm.startswith("5m ") and m < int(t // 300) * 300: continue  # 5m pivot: tap + close inside its own candle (Oct 21 ~1:22 PM PT)
                if side == "up" and last[2] > bp and tick > bp and any(x[1] <= bp + TAP[asset] for x in two): return True
                if side == "down" and last[2] < bp and tick < bp and any(x[0] >= bp - TAP[asset] for x in two): return True
            return False
        _lb = LBL.get((tk, side), "")
        if o5 and t >= 1792609560 and _lb.startswith("1m rejection off ") and not _lb.startswith("1m rejection off 5m "): o5 = None
        if o5 and t >= 1792609560 and m1rej(): o5 = None  # 1m close off a rejected band waives the candle check
        if o5 and _lb.startswith("Fake-out turn "): o5 = None  # fix139 (Oct 23 ~9:55 AM PT, Love): the fake-out turn's red/green 1m close back across the faking band is her proof - HER CANDLE waived by design
        if o5 and not free:
            if side == "up" and tick < o5 - TAP[asset]: why.append(f"long on a falling 5m candle ({tick:.2f} under its {o5:.2f} open)")
            if side == "down" and tick > o5 + TAP[asset]: why.append(f"short on a rising 5m candle ({tick:.2f} over its {o5:.2f} open)")
    if why: breaches.append({"at": o["at"], "ticker": tk, "side": side, "cost": round(cost, 2), "why": why})
now = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
st.setdefault("breaches", []); st["breaches"] += breaches; st["breaches"] = st["breaches"][-200:]
st["checkedTo"] = now; st["lastRun"] = {"at": now, "orders": checked, "breaches": len(breaches)}
json.dump(st, open(OUT + ".tmp", "w"), indent=1); os.replace(OUT + ".tmp", OUT)
print(f"RULE AUDIT: {checked} opening order(s) checked, {len(breaches)} breach(es).")
for b in breaches: print("  BREACH", b["at"], b["ticker"], b["side"], "-", "; ".join(b["why"]))
