#!/usr/bin/env python3
"""BANK LAB (Claude, 2026-10-02, Love: "work out the kinks on the bank feature over the next few days,
see how price actually behaves with it"). READ ONLY on the desk: never trades, never edits a rule.

Every run:
  1. ARCHIVES the rolling tapes (data/bid-paths.json keeps ~100 h, data/nav-tape.json ~15 h) into
     data/lab/ so the study grows every day instead of forgetting.
  2. Takes every paper entry on the night ledger (one per ticker+side+price, so a trade twelve books
     share counts once; frozen-feed rows left out) and replays it on the real Kalshi bid path.
  3. Tests a grid of BANK settings against holding to the bell and against plain take profit:
       trailing gate: arm at +30/40/50/60%, sell when the bid gives back 5/10/15/20/25/30% of its peak
       band tap: off / 1-minute close back / two 1-minute closes back; only above +0% / +20% profit
  4. Studies how winners actually behave: how deep do trades that WIN at the bell dip from their peak
     on the way? (A gate tighter than that dip sells winners.)
Writes data/bank-lab.json and prints a short summary."""
import json, os, math, bisect, collections
from datetime import datetime, timezone
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
LAB = os.path.join(D, "lab")
os.makedirs(LAB, exist_ok=True)
J = lambda p, fb: json.load(open(p)) if os.path.exists(p) else fb

# 1. archive
paths = J(os.path.join(LAB, "bid-paths-archive.json"), {})
for tk, rows in J(os.path.join(D, "bid-paths.json"), {}).items():
    have = {r[0] for r in paths.get(tk, [])}
    paths.setdefault(tk, []).extend(r for r in rows if r[0] not in have)
    paths[tk].sort(key=lambda r: r[0])
json.dump(paths, open(os.path.join(LAB, "bid-paths-archive.json"), "w"))
tape = J(os.path.join(LAB, "nav-tape-archive.json"), [])
seen = {(x["t"], x["a"]) for x in tape}
tape += [x for x in J(os.path.join(D, "nav-tape.json"), []) if (x["t"], x["a"]) not in seen]
tape.sort(key=lambda x: (x["a"], x["t"]))
json.dump(tape, open(os.path.join(LAB, "nav-tape-archive.json"), "w"))
book = [r for r in J(os.path.join(D, "night-book.json"), []) if not r.get("dnaMode")]  # her fix only; ATR twin rows apart
arch = {r["id"]: r for r in J(os.path.join(LAB, "night-book-archive.json"), [])}
for r in book: arch[r["id"]] = r
json.dump(list(arch.values()), open(os.path.join(LAB, "night-book-archive.json"), "w"))

TB = collections.defaultdict(list)
for x in tape: TB[x["a"]].append(x)
TT = {a: [x["t"] for x in v] for a, v in TB.items()}
def tape_at(a, t):
    i = bisect.bisect_right(TT.get(a, []), t) - 1
    return TB[a][i] if i >= 0 and t - TB[a][i]["t"] < 180 else None
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
def new_tp(m):
    mx = (m - 1) * 100
    return (min(50, mx) if m < 1.65 else mx * 0.75) if mx > 0 else 0

# 2. the trades (one per ticker+side+price)
trades, keys = [], set()
for r in arch.values():
    if r.get("stale") or r.get("asset") not in ("btc", "gold"): continue
    ask = r.get("ask") or 0
    if not (0.02 < ask < 0.98): continue
    k = (r["ticker"], r["side"], round(ask, 2))
    if k in keys: continue
    t0 = datetime.fromisoformat(r["at"].replace("Z", "+00:00")).timestamp()
    p = [x for x in paths.get(r["ticker"], []) if x[0] >= t0 - 2]
    bell = r.get("bell") or ({"win": "yes" if r["side"] == "up" else "no", "loss": "no" if r["side"] == "up" else "yes"}.get(r.get("result")))
    if len(p) < 3 or bell not in ("yes", "no"): continue
    keys.add(k)
    trades.append({"r": r, "p": p, "ask": ask, "won": (bell == "yes") == (r["side"] == "up"), "t0": t0})

def sim(tr, arm=None, give=None, band=None, band_min=0.0, tp_on=True):
    r, p, ask = tr["r"], tr["p"], tr["ask"]
    up = r["side"] == "up"
    stake = 50.0
    money = lambda bid: stake / ask * bid - stake
    tp = new_tp(r["multiple"]) if tp_on else 0
    tol = 15 if r["asset"] == "btc" else 0.3
    peak_bid, peak_pct, tp_peak, touch, rej = 0, -100, None, None, 0
    minute = p[0][0] // 60 * 60
    m_hi, m_lo, m_close = -1e18, 1e18, 0
    prev = (tape_at(r["asset"], p[0][0]) or {}).get("c1") or p[0][3]
    for t, yb, nb, spot in p:
        bid = yb if up else nb
        m = t // 60 * 60
        if m != minute:
            if band and touch is not None and m_close > 0:
                broke = m_close > touch if up else m_close < touch
                if broke: touch, rej = None, 0
                else:
                    rej += 1
                    pct0 = (bid / ask - 1) * 100 if bid > 0 else -100
                    if rej >= band and pct0 > band_min: return money(bid), "band"
            if band and touch is None and m_close > 0:
                ls = lines(r["asset"], tape_at(r["asset"], minute))
                hit = [L for L in ls if (L > prev and m_hi >= L - tol)] if up else [L for L in ls if (L < prev and m_lo <= L + tol)]
                if hit: touch, rej = (min(hit) if up else max(hit)), 0
            if m_close > 0: prev = m_close
            minute, m_hi, m_lo = m, -1e18, 1e18
        if spot > 0: m_hi, m_lo, m_close = max(m_hi, spot), min(m_lo, spot), spot
        if not bid > 0: continue
        pct = (bid / ask - 1) * 100
        peak_bid, peak_pct = max(peak_bid, bid), max(peak_pct, pct)
        if tp > 0 and (pct >= tp or tp_peak is not None):
            tp_peak = max(tp_peak if tp_peak is not None else pct, pct)
            if bid >= 0.97 or pct < max(tp, math.floor(tp_peak) - 1): return money(bid), "tp"
        if arm is not None and peak_pct >= arm and pct > 0 and bid <= peak_bid * (1 - give / 100): return money(bid), "gate"
    return (stake / ask - stake) if tr["won"] else -stake, "bell"

def score(name, fn):
    res = [(fn(tr), tr) for tr in trades]
    pnl = sum(x[0][0] for x in res)
    cut = [x for x in res if x[0][1] in ("gate", "band") and x[1]["won"]]
    saved = [x for x in res if x[0][1] in ("gate", "band") and not x[1]["won"]]
    return {"name": name, "n": len(res), "pnl": round(pnl, 2), "wins": sum(x[0][0] > 0 for x in res),
            "cutWinners": len(cut), "cutCost": round(sum((50 / x[1]["ask"] - 50) - x[0][0] for x in cut), 2),
            "savedLosers": len(saved), "savedAmt": round(sum(x[0][0] + 50 for x in saved), 2)}

out = {"at": datetime.now(timezone.utc).isoformat(), "trades": len(trades),
       "span": [datetime.fromtimestamp(min(t["t0"] for t in trades), timezone.utc).isoformat(), datetime.fromtimestamp(max(t["t0"] for t in trades), timezone.utc).isoformat()] if trades else None}
grid = [score("HOLD TO THE BELL", lambda tr: sim(tr, tp_on=False)), score("TAKE PROFIT ONLY", lambda tr: sim(tr)),
        score("BANK today (arm 30, give 5%, band 1m)", lambda tr: sim(tr, 30, 5, 1, 0))]
for arm in (30, 40, 50, 60):
    for give in (5, 10, 15, 20, 25, 30):
        grid.append(score(f"gate arm {arm} give {give}%", lambda tr, a=arm, g=give: sim(tr, a, g)))
for band in (1, 2):
    for bmin in (0, 20):
        grid.append(score(f"band {band}x1m close back, min +{bmin}%", lambda tr, b=band, m=bmin: sim(tr, band=b, band_min=m)))
out["grid"] = grid
best = max(grid[3:], key=lambda g: g["pnl"])
out["bestGate"] = best
# 4. how winners behave: deepest giveback from the running peak on the way to a bell win
dips = []
for tr in trades:
    if not tr["won"]: continue
    up = tr["r"]["side"] == "up"
    pk, worst = 0, 0
    for t, yb, nb, s in tr["p"]:
        b = yb if up else nb
        if not b > 0: continue
        pk = max(pk, b)
        if (pk / tr["ask"] - 1) * 100 >= 30: worst = max(worst, (pk - b) / pk * 100)
    dips.append(round(worst, 1))
dips.sort()
q = lambda f: dips[min(len(dips) - 1, int(f * len(dips)))] if dips else None
out["winnerDips"] = {"n": len(dips), "median": q(0.5), "p75": q(0.75), "p90": q(0.9), "note": "how far a bell WINNER's bid fell from its running peak after first being up 30%+ (percent of the peak bid)"}
json.dump(out, open(os.path.join(D, "bank-lab.json"), "w"), indent=1)
print(f"trades {out['trades']} span {out['span']}")
for g in grid[:3] + sorted(grid[3:], key=lambda g: -g["pnl"])[:6]:
    print(f"  {g['name']:42s} {g['pnl']:+9.2f}  {g['wins']}W/{g['n']}  cut winners {g['cutWinners']} (-{g['cutCost']})  saved losers {g['savedLosers']} (+{g['savedAmt']})")
print("winners' dips after +30%:", out["winnerDips"])

# Also refresh the TAP / RESCUE replay (Love's band-touch lotto + rescue adds).
try:
    import runpy
    runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "tap-lab.py"))
except Exception as e:
    print("tap-lab:", e)
# Overnight feed shootout (Love, Oct 2 night): which BTC feed's bands held overnight, and which matched Kalshi.
try:
    print("\n")
    runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "feed-overnight.py"), run_name="__main__")
except Exception as e:
    print("feed-overnight:", e)
# Feed twin + Pepperstone lead (Love, Oct 2 night): side-by-side DNA ledgers and "does a Pepperstone break lead?"
for _s in ("feed-twin.py", "pep-lead.py", "feed-replay.py", "head-start.py"):
    try:
        print("\n"); runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), _s), run_name="__main__")
    except Exception as e:
        print(_s, e)
