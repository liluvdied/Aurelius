#!/usr/bin/env python3
"""TAP LAB (Claude, 2026-10-02, Love's two ideas). READ ONLY. Replays real Kalshi bids + her lines.
 A) RESCUE: a legal entry reverses; price pushes hard into the next band; the same side is now cheap.
    Add $5 there. Does price bounce off that band back into profit?
 B) TAP: no position at all. Price touches one of her lines and the bounce side is 10x+ (ask <= 10c).
    Buy $2.50 on the bounce side, take profit at +200% (3x the ticket), else hold to the bell.
Uses data/lab archives (built by bank-lab.py) + the live tapes. Writes data/tap-lab.json."""
import json, os, bisect, collections
from datetime import datetime, timezone
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
J = lambda p, fb: json.load(open(p)) if os.path.exists(p) else fb
paths = J(os.path.join(D, "lab", "bid-paths-archive.json"), {})
for tk, rows in J(os.path.join(D, "bid-paths.json"), {}).items():
    have = {r[0] for r in paths.get(tk, [])}
    paths.setdefault(tk, []).extend(r for r in rows if r[0] not in have)
for tk in paths: paths[tk].sort(key=lambda r: r[0])
tape = J(os.path.join(D, "lab", "nav-tape-archive.json"), []) + J(os.path.join(D, "nav-tape.json"), [])
TB = collections.defaultdict(dict)
for x in tape: TB[x["a"]][x["t"]] = x
TT = {a: sorted(v) for a, v in TB.items()}
def tape_at(a, t):
    ts = TT.get(a, [])
    i = bisect.bisect_right(ts, t) - 1
    return TB[a][ts[i]] if i >= 0 and t - ts[i] < 180 else None
def lines(a, tp):
    if not tp: return []
    out, vw, sd = [], tp.get("vw") or 0, tp.get("sd") or 0
    if vw: out.append(vw)
    if vw and sd: out += [vw + k * sd for k in (0.5, 1, 1.5, 2, 2.5, 3)] + [vw - k * sd for k in (0.5, 1, 1.5, 2, 2.5, 3)]
    for f in (tp.get("m5"), tp.get("m10"), tp.get("m15")):
        if f and f[0] > 0:
            out.append(f[0])
            if a == "btc" and len(f) >= 3: out += [f[1], f[2]]
    return out
def asset_of(tk): return "btc" if "KXBTC15M" in tk else "gold" if "KXGOLD15M" in tk else None
def bell_of(p):  # last quote of the window decides
    yb = p[-1][1]; nb = p[-1][2]
    if yb >= 0.9: return "yes"
    if nb >= 0.9: return "no"
    return None

# B) TAP: every band touch, bounce side 10x+
taps = []
for tk, p in paths.items():
    a = asset_of(tk)
    if not a or len(p) < 10: continue
    bell = bell_of(p)
    if not bell: continue
    tol = 15 if a == "btc" else 0.3
    used = set()
    for i in range(1, len(p)):
        t, yb, nb, spot = p[i]
        prev_spot = p[i - 1][3]
        if not (spot > 0 and prev_spot > 0): continue
        left = None
        L = lines(a, tape_at(a, t))
        for lv in L:
            if lv in used: continue
            # came DOWN onto a line -> bounce = UP ; came UP onto a line -> bounce = DOWN
            if prev_spot > lv and spot <= lv + tol: side = "up"
            elif prev_spot < lv and spot >= lv - tol: side = "down"
            else: continue
            ask = (1 - nb) if side == "up" else (1 - yb)
            if not (0.01 < ask <= 0.10): continue
            used.add(lv)
            stake = 2.5
            tp_hit = None
            for t2, yb2, nb2, s2 in p[i + 1:]:
                bid2 = yb2 if side == "up" else nb2
                if bid2 >= ask * 3: tp_hit = bid2; break
            won = (bell == "yes") == (side == "up")
            pnl = stake / ask * tp_hit - stake if tp_hit else (stake / ask - stake if won else -stake)
            hold = stake / ask - stake if won else -stake
            taps.append({"tk": tk, "a": a, "t": t, "side": side, "ask": round(ask, 3), "mult": round(1 / ask, 1), "tp": tp_hit is not None, "won": won, "pnl": round(pnl, 2), "hold": round(hold, 2)})
            break

# A) RESCUE: our paper entries that went against us
book = {r["id"]: r for r in J(os.path.join(D, "lab", "night-book-archive.json"), [])}
for r in J(os.path.join(D, "night-book.json"), []):
    if not r.get("dnaMode"): book[r["id"]] = r
resc, seen = [], set()
for r in book.values():
    if r.get("stale") or r.get("asset") not in ("btc", "gold"): continue
    k = (r["ticker"], r["side"])
    if k in seen: continue
    p = paths.get(r["ticker"], [])
    t0 = datetime.fromisoformat(r["at"].replace("Z", "+00:00")).timestamp()
    p = [x for x in p if x[0] >= t0 - 2]
    bell = bell_of(p) if len(p) > 5 else None
    if not bell: continue
    seen.add(k)
    a, up = r["asset"], r["side"] == "up"
    tol = 15 if a == "btc" else 0.3
    for i in range(1, len(p)):
        t, yb, nb, spot = p[i]
        bid = yb if up else nb
        ask = (1 - nb) if up else (1 - yb)  # buying more of OUR side
        if not (0.01 < ask <= 0.25): continue  # our side got cheap: 4x+
        prev = p[i - 1][3]
        hit = None
        for lv in lines(a, tape_at(a, t)):
            # adverse push into a line: long -> price falling onto a line; short -> rising onto one
            if up and prev > lv and spot <= lv + tol: hit = lv
            if not up and prev < lv and spot >= lv - tol: hit = lv
            if hit: break
        if hit is None: continue
        won = (bell == "yes") == up
        back = next((b for _, yb2, nb2, _ in p[i + 1:] for b in [yb2 if up else nb2] if b >= ask * 3), None)
        stake = 5.0
        resc.append({"tk": r["ticker"], "book": r["book"], "side": r["side"], "ask": round(ask, 3), "mult": round(1 / ask, 1),
                     "won": won, "bell": stake / ask - stake if won else -stake, "tp200": (stake / ask * back - stake) if back else (stake / ask - stake if won else -stake),
                     "mainResult": r.get("result"), "mainPnl": r.get("pnl")})
        break

def summ(L, k):
    w = sum(1 for x in L if x[k] > 0)
    return {"n": len(L), "winners": w, "pnl": round(sum(x[k] for x in L), 2)}
out = {"at": datetime.now(timezone.utc).isoformat(),
       "tap": {"tp200": summ(taps, "pnl"), "holdToBell": summ(taps, "hold"), "tpHitRate": round(100 * sum(x["tp"] for x in taps) / max(1, len(taps))), "byAsset": {a: summ([x for x in taps if x["a"] == a], "pnl") for a in ("btc", "gold")}, "rows": taps[-60:]},
       "rescue": {"tp200": summ(resc, "tp200"), "holdToBell": summ(resc, "bell"), "rows": resc}}
json.dump(out, open(os.path.join(D, "tap-lab.json"), "w"), indent=1)
print("TAP (no position; band touch, bounce side 10x+, $2.50):", out["tap"]["tp200"], "| hold:", out["tap"]["holdToBell"], "| TP hit", out["tap"]["tpHitRate"], "% | by asset", out["tap"]["byAsset"])
print("RESCUE ($5 add when our side is 4x+ and price pushed into a band):", out["rescue"]["tp200"], "| hold:", out["rescue"]["holdToBell"])
mults = collections.Counter(min(50, int(x["mult"] // 5 * 5)) for x in taps)
print("tap multiples (bucket of 5x):", dict(sorted(mults.items())))
