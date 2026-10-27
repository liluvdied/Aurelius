#!/usr/bin/env python3
"""REPLAY LAB (Claude, Oct 5 ~8 PM PT, Love: "backtest their exact methodology on historical price... how would they have
done on their own exact entry and exit logic... is it a pattern... start with brick and claude"). READ ONLY.

BRICK: brick.ts re-run on history. Her lines rebuilt from the same feeds (Pepperstone BTC / OANDA gold, data/hist2):
  session VWAP + 0.5 sigma steps (session from 17:00 ET, built from 5m bars here, the desk uses 1m), nav purple/upper/lower
  on 5m / 10m / 15m (computeNav: VWMA len 7, 4 sd). Signals off each CLOSED 5m candle (rejection or close-through),
  purple chop rule, >2 min left, gate 1 (no line between price and the strike), her 25% channel DNA + road rule, 1.38x-1.8x
  BTC / 1.38x-2.5x gold on Kalshi's real ask (data/stop-lab-candles.json, 1-minute), one trade per window. It looks at the
  first 5 minutes after each 5m close, minute by minute, like the desk (which checks every few seconds).
CLAUDE: every setup the desk recorded (data/fill-log.json paper takes, Sep 24 - Oct 3) through claudePick() and the same
  25% channel DNA (lines rebuilt as above), at the ask the desk saw.
EXITS (both): her paper exits on Kalshi's real minute bids: take profit at 90% of the max then a 1% trail (97c sells),
  take-profit gates (under 1.65x keep +40%, else 55%/60% of the max) and LOCK THE WIN (+30% -> +20%), gates/lock only
  with a reason (BTC within $100 / gold $1.50 of the strike) and never under breakeven; else the bell (Kalshi's result).
$50 a trade like the paper books. Known gaps: minute (not tick) prices, VWAP from 5m bars, strike/result from Kalshi."""
import json, os, re, math, calendar, collections
from datetime import datetime, timezone, timedelta
D = os.path.join(os.getcwd(), "data")
L = lambda n: json.load(open(os.path.join(D, n)))
cand = L("stop-lab-candles.json")["candles"]
fm = L("feedmatch.json")["markets"]
MK = {}
for a, xs in fm.items():
    for m in xs:
        MK[m["tk"]] = {"asset": a, "open": calendar.timegm(datetime.strptime(m["open"], "%Y-%m-%dT%H:%M:%SZ").timetuple()), "close": calendar.timegm(datetime.strptime(m["close"], "%Y-%m-%dT%H:%M:%SZ").timetuple()), "strike": float(m["strike"]) if m.get("strike") else None, "result": m.get("result")}
WIN = {a: sorted([(v["open"], v["close"], k) for k, v in MK.items() if v["asset"] == a]) for a in ("btc", "gold")}
def window_at(a, t):
    for o, c, k in WIN[a]:
        if o <= t < c: return k
    return None
BARS = {a: sorted(L(f"hist2/{a}-5.json"), key=lambda b: b["t"]) for a in ("btc", "gold")}
B1 = {}
try: B1["btc"] = {b["t"]: b for b in L("hist2/btc-1.json")}
except Exception: B1["btc"] = {}
B1["gold"] = {}
IDX = {a: {b["t"]: i for i, b in enumerate(BARS[a])} for a in BARS}

def nav(bars, ln=7, mult=4):
    if len(bars) < ln * 2 - 1: return None
    h3 = lambda b: (b["h"] + b["l"] + b["c"]) / 3
    def vwma(end):
        a = w = 0.0
        for j in range(end - ln + 1, end + 1):
            a += h3(bars[j]) * (bars[j]["v"] or 0); w += bars[j]["v"] or 0
        return a / w if w > 0 else h3(bars[end])
    n = len(bars) - 1
    xs = [vwma(n - ln + 1 + i) for i in range(ln)]
    m = sum(xs) / ln; sd = math.sqrt(sum((x - m) ** 2 for x in xs) / ln); c = xs[-1]
    return (c, c + mult * sd, c - mult * sd)
def agg(bars, secs):
    out = collections.OrderedDict()
    for b in bars:
        k = b["t"] // secs * secs
        if k not in out: out[k] = dict(b, t=k)
        else:
            x = out[k]; x["h"] = max(x["h"], b["h"]); x["l"] = min(x["l"], b["l"]); x["c"] = b["c"]; x["v"] = (x["v"] or 0) + (b["v"] or 0)
    return list(out.values())
def sess_start(t):
    dt = datetime.fromtimestamp(t, timezone.utc)
    s = dt.replace(hour=21, minute=0, second=0, microsecond=0)  # 17:00 ET (EDT)
    if dt < s: s -= timedelta(days=1)
    return s.timestamp()
VW = {}
def vwap_at(a, i):
    key = (a, i)
    if key in VW: return VW[key]
    bars = BARS[a]; s0 = sess_start(bars[i]["t"]); pv = vv = sq = 0.0; j = i
    while j >= 0 and bars[j]["t"] >= s0:
        b = bars[j]; tp = (b["h"] + b["l"] + b["c"]) / 3; v = b["v"] or 0
        pv += tp * v; vv += v; sq += v * tp * tp; j -= 1
    r = None
    if vv > 0:
        vw = pv / vv; r = (vw, math.sqrt(max(sq / vv - vw * vw, 0)))
    VW[key] = r
    return r
def lines_at(a, i):
    """Her lines just after 5m bar i closed (bars 0..i closed + a fresh forming bar)."""
    bars = BARS[a][max(0, i - 200): i + 1]
    form = dict(bars[-1], t=bars[-1]["t"] + 300, o=bars[-1]["c"], h=bars[-1]["c"], l=bars[-1]["c"], v=1)
    b5 = bars + [form]
    out = []
    vs = vwap_at(a, i)
    if vs and vs[1] > 0:
        vw, sd = vs
        for k in range(-6, 7): out.append(("session VWAP" if k == 0 else f"{'+' if k > 0 else ''}{k/2}σ", "session", vw + k / 2 * sd, 3 if k == 0 else 1))
    for lab, secs, rank in (("5m", 300, 4), ("10m", 600, 5), ("15m", 900, 6)):
        bb = b5 if secs == 300 else agg(b5, secs)
        f = nav(bb[-40:])
        if not f: return None, vs
        out.append((f"{lab} purple", "purple", f[0], rank))
        if a == "btc":
            out.append((f"{lab} upper", "bollinger", f[1], rank - 1)); out.append((f"{lab} lower", "bollinger", f[2], rank - 1))
    return out, vs
def channel_front(side, p, prices):
    xs = sorted(prices)
    gaps = sorted(g for g in (xs[i + 1] - xs[i] for i in range(len(xs) - 1)) if g > 0)
    typ = gaps[len(gaps) // 2] if gaps else 0
    merged = []
    for x in xs:
        if merged and typ > 0 and x - merged[-1] < typ * 0.15: continue
        merged.append(x)
    above = [x for x in merged if x > p]; below = [x for x in merged if x <= p]
    up = above[0] if above else None; dn = below[-1] if below else None
    front = up if side == "up" else dn
    if front is None: return None
    back = dn if side == "up" else up
    width = abs(front - back) if back is not None else typ
    return (front, width) if width > 0 else None
def dna_chan(a, side, spot, target, lines):
    prices = [l[2] for l in lines]
    f = channel_front(side, spot, prices)
    if f:
        ahead = f[0] - spot if side == "up" else spot - f[0]
        if ahead <= f[1] * 0.25: return "25% rule"
    if target:
        must = target > spot if side == "up" else target < spot
        if must:
            lo, hi = min(spot, target), max(spot, target)
            if any(lo < p < hi for p in prices): return "band in the way"
    return None
def kal(tk, t):
    """Kalshi minute candle covering time t: (yesBid, yesAsk) closes."""
    for (end, bl, bh, bc, al, ah, ac) in cand.get(tk, []):
        if end >= t: return bc, ac
    return None, None
def ask_for(tk, side, t):
    yb, ya = kal(tk, t)
    if side == "up": return ya
    return None if yb is None else round(1 - yb, 4)
def spot_at(a, t):
    m = B1.get(a, {}).get(int(t // 60 * 60) - 60)
    if m: return m["c"]
    i = IDX[a].get(int(t // 300 * 300) - 300)
    return BARS[a][i]["c"] if i is not None else None

def exits(tk, side, ask, t0, a, strike, result):
    """Her paper exits on the minute bids. Returns (pnl, why)."""
    mult = 1 / ask; maxp = (mult - 1) * 100; tp = max(1, maxp * 0.9)
    peak = -999; armed = False; tpk = None; lockpk = -100
    clear = 100 if a == "btc" else 1.5
    gates = ([40] if 40 < maxp else []) if mult < 1.65 else [round(maxp * 0.55, 2), round(maxp * 0.6, 2)]
    for (end, bl, bh, bc, al, ah, ac) in cand.get(tk, []):
        if end <= t0 + 30: continue
        bid = bc if side == "up" else (None if ac is None else 1 - ac)
        if bid is None or bid <= 0: continue
        pct = (bid / ask - 1) * 100
        peak = max(peak, pct)
        why = None
        if pct >= tp or armed:
            armed = True; tpk = max(tpk if tpk is not None else pct, pct)
            trail = max(tp, math.floor(tpk) - 1)
            if bid >= 0.97 or pct < trail: why = f"take profit (peaked +{round(tpk)}%)"
        sp = spot_at(a, end)
        cushion = (sp - strike if side == "up" else strike - sp) if (sp and strike) else None
        reason = cushion is None or cushion <= clear
        if not why and reason and pct > 0:
            fl = [g for g in gates if peak >= g]
            if fl and pct < fl[-1]: why = f"gate +{fl[-1]}%"
        lockpk = max(lockpk, pct)
        if not why and reason and pct > 0 and lockpk >= 30 and pct <= 20: why = "lock the win"
        if why: return round(50 / ask * bid - 50, 2), why
    if result not in ("yes", "no"): return None, "no result"
    won = (result == "yes") == (side == "up")
    return (round(50 / ask - 50, 2) if won else -50.0), "bell"

def brick():
    out = []
    for a in ("btc", "gold"):
        bars = BARS[a]; taken = set()
        for i in range(60, len(bars) - 1):
            b = bars[i]; prev = bars[i - 1]["c"]; tclose = b["t"] + 300
            lines, vs = lines_at(a, i)
            if not lines: continue
            sig = []
            for (nm, kind, L_, rank) in lines:
                if b["l"] < L_ and b["c"] > L_ and b["o"] >= L_: sig.append(("up", f"rejection up off the {nm}", kind, rank))
                elif b["h"] > L_ and b["c"] < L_ and b["o"] <= L_: sig.append(("down", f"rejection down off the {nm}", kind, rank))
                elif prev < L_ and b["c"] > L_: sig.append(("up", f"5m close above the {nm}", kind, rank))
                elif prev > L_ and b["c"] < L_: sig.append(("down", f"5m close below the {nm}", kind, rank))
            if not sig: continue
            sig.sort(key=lambda s: -s[3])
            if len({s[0] for s in sig}) > 1:
                rest = [s for s in sig if s[2] != "purple"]
                brk = [s for s in rest if "close" in s[1]]
                if len({s[0] for s in rest}) == 1 and brk: s = brk[0]
                else: continue
            else: s = sig[0]
            side, label = s[0], s[1]
            for k in range(5):  # minute by minute after the close, like the desk's ticks
                t = tclose + 30 + 60 * k
                tk = window_at(a, t)
                if not tk or tk in taken or tk not in cand: continue
                mk = MK[tk]
                if mk["close"] - t <= 120 or not mk["strike"]: continue
                spot = spot_at(a, t) or b["c"]
                target = mk["strike"]
                must = target > spot if side == "up" else target < spot
                if must and any(min(spot, target) < l[2] < max(spot, target) for l in lines): continue
                if dna_chan(a, side, spot, target, lines): continue
                ask = ask_for(tk, side, t)
                if not ask or not (0.02 < ask < 0.98): continue
                mult = 1 / ask
                if mult < 1.38 or mult > (1.8 if a == "btc" else 2.5): continue
                pnl, why = exits(tk, side, ask, t, a, target, mk["result"])
                if pnl is None: break
                taken.add(tk)
                ahead = [l[2] - spot for l in lines if l[2] > spot] if side == "up" else [spot - l[2] for l in lines if l[2] < spot]
                nm_ahead = None
                if ahead:
                    dmin = min(ahead)
                    nm_ahead = [l[0] for l in lines if abs((l[2] - spot if side == "up" else spot - l[2]) - dmin) < 1e-9][0]
                boll = []
                bars_ = BARS[a][max(0, i - 200): i + 1]
                form_ = dict(bars_[-1], t=bars_[-1]["t"] + 300, o=bars_[-1]["c"], h=bars_[-1]["c"], l=bars_[-1]["c"], v=1)
                b5_ = bars_ + [form_]
                for lab_, secs_ in (("5m", 300), ("10m", 600), ("15m", 900)):
                    bb_ = b5_ if secs_ == 300 else agg(b5_, secs_)
                    f_ = nav(bb_[-40:])
                    if f_: boll += [(f"{lab_} upper", f_[1]), (f"{lab_} lower", f_[2])]
                bahead = [(L - spot if side == "up" else spot - L, nm) for nm, L in boll if (L > spot if side == "up" else L < spot)]
                bmin = min(bahead) if bahead else (None, None)
                wallB = any(min(spot, target) < L < max(spot, target) for _, L in boll) if (target > spot if side == "up" else target < spot) else False
                out.append({"book": "brick", "t": t, "asset": a, "tk": tk, "side": side, "setup": label, "ask": ask, "pnl": pnl, "exit": why, "room": min(ahead) if ahead else None, "roomLine": nm_ahead, "spot": spot, "strike": target, "bollRoom": bmin[0], "bollName": bmin[1], "bollWall": wallB})
                break
    return out

def claude():
    SKIP = {"btc": [9, 12, 16, 19, 21], "gold": [6, 12, 16, 23]}
    def pick(a, s, l, m, h):
        l = l.replace("−", "-")
        if h in SKIP.get(a, []): return "hour"
        if a == "gold":
            if s != "up": return "gold short"
            if m < 1.38 or m > 2.5: return "mult"
            return None if re.match(r"(Tap-reject|Break-retest|Gold clock)", l) else "label"
        if m < 1.38 or m > 1.8: return "mult"
        if s == "down" and l.startswith("Tap-reject"): return None
        if s == "up" and l.startswith("Close above"): return None
        return "label"
    out = []; taken = set()
    for r in sorted(L("fill-log.json"), key=lambda x: x["at"]):
        if r.get("kind") != "taken" or r.get("venue") != "paper" or (r.get("pattern") or "") == "Live": continue
        a = r.get("asset"); tk = r.get("ticker")
        if a not in ("btc", "gold") or tk in taken or tk not in MK or tk not in cand: continue
        if r["at"] >= "2026-10-04": continue
        t = datetime.fromisoformat(r["at"].replace("Z", "+00:00")).timestamp()
        h = (datetime.fromtimestamp(t, timezone.utc) - timedelta(hours=7)).hour
        ask = r.get("ask"); m = r.get("multiple") or (1 / ask if ask else 0)
        if not ask or pick(a, r["side"], r.get("pattern") or "", m, h): continue
        i = IDX[a].get(int(t // 300 * 300) - 300)
        if i is None: continue
        lines, vs = lines_at(a, i)
        if not lines: continue
        mk = MK[tk]; spot = spot_at(a, t) or BARS[a][i]["c"]
        if dna_chan(a, r["side"], spot, mk["strike"], lines): continue
        pnl, why = exits(tk, r["side"], ask, t, a, mk["strike"], mk["result"])
        if pnl is None: continue
        taken.add(tk)
        out.append({"book": "claude", "t": t, "asset": a, "tk": tk, "side": r["side"], "setup": r.get("pattern"), "ask": ask, "pnl": pnl, "exit": why})
    return out

def report(rows, name):
    if not rows: print(name, "no trades"); return
    pt = lambda t: datetime.fromtimestamp(t, timezone.utc) - timedelta(hours=7)
    n = len(rows); w = sum(r["pnl"] > 0.05 for r in rows); tot = sum(r["pnl"] for r in rows)
    print(f"\n=== {name}: {n} trades, {w} wins ({100*w/n:.0f}%), ${tot:+.2f} at $50 · {pt(min(r['t'] for r in rows)):%a %b %d} -> {pt(max(r['t'] for r in rows)):%a %b %d}")
    day = collections.defaultdict(lambda: [0, 0, 0.0])
    blk = collections.defaultdict(lambda: [0, 0, 0.0])
    for r in rows:
        d = pt(r["t"]); x = day[d.strftime("%a %m-%d")]; x[0] += 1; x[1] += r["pnl"] > 0.05; x[2] += r["pnl"]
        y = blk[d.hour // 4]; y[0] += 1; y[1] += r["pnl"] > 0.05; y[2] += r["pnl"]
    print("  by day:"); [print(f"    {k}: {v[0]:3d} trades {v[1]:3d}W  ${v[2]:+8.2f}") for k, v in sorted(day.items(), key=lambda kv: datetime.strptime(kv[0][4:], "%m-%d"))]
    print("  by 4-hour block (PT):"); [print(f"    {4*k:2d}:00-{4*k+4:2d}:00  {v[0]:3d} trades  {100*v[1]/v[0]:3.0f}% wins  ${v[2]:+8.2f}") for k, v in sorted(blk.items())]
    # streaks of 4-hour blocks in time order
    seq = collections.OrderedDict()
    for r in sorted(rows, key=lambda r: r["t"]):
        d = pt(r["t"]); k = (d.strftime("%m-%d"), d.hour // 4); seq.setdefault(k, 0.0); seq[k] += r["pnl"]
    signs = ["+" if v > 0 else "-" for v in seq.values()]
    runs = []; cur = None; ln = 0
    for s in signs:
        if s == cur: ln += 1
        else:
            if cur: runs.append((cur, ln))
            cur, ln = s, 1
    if cur: runs.append((cur, ln))
    print(f"  4-hour blocks in order: {''.join(signs)}  (green {signs.count('+')}, red {signs.count('-')}; longest red run {max([l for s,l in runs if s=='-'] or [0])} blocks, longest green run {max([l for s,l in runs if s=='+'] or [0])})")
    ex = collections.Counter(r["exit"].split(" (")[0].split(" +")[0] for r in rows); print("  exits:", dict(ex))
    for a in ("btc", "gold"):
        xs = [r for r in rows if r["asset"] == a]
        if xs: print(f"  {a}: {len(xs)} trades {sum(r['pnl']>0.05 for r in xs)}W ${sum(r['pnl'] for r in xs):+.2f}")

if __name__ == "__main__":
    print("candles", len(cand), "| windows with strike/result", len(MK), "| 5m bars btc", len(BARS["btc"]), "gold", len(BARS["gold"]))
    b = brick()
    json.dump(b, open(os.path.join(D, "boll-lab.json"), "w"))
    print("done", len(b))
