#!/usr/bin/env python3
"""WRONG-SIDE AUDIT (Claude, 2026-10-02). Read only. Every Kalshi BTC/gold 15m trade since day one,
checked against the bands on Love's chart at the moment of entry:
  session VWAP + ±0.5σ steps (OANDA, 5m bars, hlc3, volume-weighted, session from 17:00 ET),
  purple nav center on 5m / 10m / 15m (vwma(hlc3,7)), and for BTC the nav upper/lower (±4σ).
WRONG SIDE = a long with a line just ABOVE price (gold ≤ $2.50, BTC ≤ $100), or a short with a line
just BELOW price. PATH = a line sitting between price and the strike the trade has to reach.
Everything else is a GENUINE entry: if it reversed, that loss has amnesty."""
import json, os, bisect, collections, math, re
from datetime import datetime, timezone, timedelta
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
J = lambda n: json.load(open(os.path.join(D, n)))
THR = {"btc": 100.0, "gold": 2.5}
bars = {k: J(f"hist/{k}.json") for k in ["btc-1", "btc-5", "btc-15", "gold-1", "gold-5", "gold-15"]}
idx = {k: [b["t"] for b in v] for k, v in bars.items()}
hlc3 = lambda b: (b["h"] + b["l"] + b["c"]) / 3

def closed(k, t, step):  # bars fully closed before t
    i = bisect.bisect_right(idx[k], t - step)
    return bars[k][:i]

def spot_at(a, t):
    for k, step in ((f"{a}-1", 60), (f"{a}-5", 300)):
        i = bisect.bisect_right(idx[k], t) - 1
        if i >= 0 and t - idx[k][i] < step * 2:
            b = bars[k][i]
            return b["o"] if t - b["t"] < step / 2 else b["c"]
    return None

def session_start(t):
    d = datetime.fromtimestamp(t, timezone.utc)
    # 17:00 ET = 21:00Z (EDT, the whole audit period)
    s = d.replace(hour=21, minute=0, second=0, microsecond=0)
    if d < s: s -= timedelta(days=1)
    return s.timestamp()

def session(a, t):
    xs = [b for b in closed(f"{a}-5", t, 300) if b["t"] >= session_start(t)]
    v = sum(b["v"] for b in xs)
    if len(xs) < 3 or v <= 0: return None
    vw = sum(hlc3(b) * b["v"] for b in xs) / v
    sd = math.sqrt(max(sum(b["v"] * hlc3(b) ** 2 for b in xs) / v - vw * vw, 0))
    return vw, sd

def nav(seq):
    if len(seq) < 13: return None
    def vwma(xs):
        v = sum(b["v"] for b in xs) or 1e-9
        return sum(hlc3(b) * b["v"] for b in xs) / v
    ser = [vwma(seq[i - 7:i]) for i in range(len(seq) - 6, len(seq) + 1)]
    c = ser[-1]
    m = sum(ser[-7:]) / 7
    sd = math.sqrt(sum((x - m) ** 2 for x in ser[-7:]) / 7)
    return c, c + 4 * sd, c - 4 * sd

def to10(xs):
    out = []
    for b in xs:
        if b["t"] % 600 == 0: out.append(dict(b))
        elif out and b["t"] - out[-1]["t"] == 300:
            o = out[-1]; o["h"] = max(o["h"], b["h"]); o["l"] = min(o["l"], b["l"]); o["c"] = b["c"]; o["v"] += b["v"]
    return out

def lines_at(a, t):
    L = []
    s = session(a, t)
    if s:
        vw, sd = s
        for k in range(-6, 7):
            L.append(("session", "VWAP" if k == 0 else f"{k/2:+g}σ", vw + k / 2 * sd))
    c5 = closed(f"{a}-5", t, 300)[-40:]
    for name, seq in (("5m", c5), ("10m", to10(c5)[:-1] if c5 else []), ("15m", closed(f"{a}-15", t, 900)[-40:])):
        n = nav(seq)
        if not n: continue
        L.append(("purple", f"{name} purple", n[0]))
        if a == "btc":
            L.append(("bollinger", f"{name} upper", n[1])); L.append(("bollinger", f"{name} lower", n[2]))
    return L

def ticker_close(tk):  # KXBTC15M-26OCT021030-30 -> close time (ET)
    m = re.search(r"-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)-", tk)
    if not m: return None
    mon = {"SEP": 9, "OCT": 10}[m.group(2)]
    et = datetime(2000 + int(m.group(1)), mon, int(m.group(3)), int(m.group(4)), int(m.group(5)), tzinfo=timezone.utc)
    return (et + timedelta(hours=4)).timestamp()

H, A = J("kalshi-history.json"), J("kalshi-audit.json")
fills = {}
for f in H["fills"] + A["fills"]: fills[(f["t"], f["ticker"], f["action"], str(f["count"]), str(f["yes"]))] = f
S = {s["ticker"]: s for s in H["settlements"] + A["settlements"]}
log = J("fill-log.json")
desk = {r["ticker"] for r in log if r.get("venue") == "kalshi" and r.get("kind") == "taken"}
by = collections.defaultdict(list)
for f in sorted(fills.values(), key=lambda f: f["t"]): by[f["ticker"]].append(f)
rows = []
for tk, Lf in by.items():
    a = "btc" if "KXBTC15M" in tk else "gold" if "KXGOLD15M" in tk else None
    if not a: continue
    cash = pos = fee = 0.0
    for f in Lf:
        c, p = float(f["count"]), float(f["yes"]); fee += float(f.get("fee") or 0)
        if f["action"] == "buy": cash -= c * p; pos += c
        else: cash += c * p; pos -= c
    if abs(pos) > 1e-6:
        s = S.get(tk)
        if not s or s.get("result") not in ("yes", "no"): continue
        cash += pos * (1 if s["result"] == "yes" else 0)
    pnl = cash - fee
    side = "up" if Lf[0]["action"] == "buy" else "down"
    t = datetime.fromisoformat(Lf[0]["t"].replace("Z", "+00:00")[:26] + ("" if "+" in Lf[0]["t"] else "+00:00") if False else Lf[0]["t"][:19] + "+00:00").timestamp()
    spot = spot_at(a, t)
    if spot is None: continue
    ct = ticker_close(tk)
    target = spot_at(a, ct - 900) if ct else None
    lines = lines_at(a, t)
    thr = THR[a]
    above = [l for l in lines if 0 < l[2] - spot <= thr]
    below = [l for l in lines if 0 < spot - l[2] <= thr]
    wrong = above if side == "up" else below
    path = []
    if target:
        if side == "up" and target > spot: path = [l for l in lines if spot < l[2] < target]
        if side == "down" and target < spot: path = [l for l in lines if target < l[2] < spot]
    kinds = sorted({l[0] for l in wrong})
    ss = session(a, t)
    behind = [abs(spot - l[2]) for l in lines if (l[2] < spot if side == "up" else l[2] > spot)]
    p0 = float(Lf[0]["yes"])
    extra = {"sd": round(ss[1], 2) if ss else None, "z": round((spot - ss[0]) / ss[1], 2) if ss and ss[1] > 0 else None,
             "behind": round(min(behind), 2) if behind else None, "mult": round(1 / p0, 2) if side == "up" and p0 > 0 else round(1 / (1 - p0), 2) if p0 < 1 else None,
             "hourPT": (datetime.fromtimestamp(t, timezone.utc) - timedelta(hours=7)).hour}
    cls = "WRONG SIDE" if wrong else "PATH BLOCKED" if path else "GENUINE"
    rows.append({"ticker": tk, "t": t, "at": Lf[0]["t"][:19] + "Z", "asset": a, "side": side, "pnl": round(pnl, 2), "desk": tk in desk, "spot": round(spot, 2), "target": round(target, 2) if target else None,
                 "cls": cls, "wrongLines": [f"{l[1]} {l[2]:.2f}" for l in wrong], "wrongKinds": kinds, "pathLines": [l[1] for l in path], "nLines": len(lines), **extra})
rows.sort(key=lambda r: r["t"])
json.dump(rows, open(os.path.join(D, "wrong-side-audit.json"), "w"), indent=1)

def rep(name, L):
    w = [r for r in L if r["pnl"] > 0]; l = [r for r in L if r["pnl"] <= 0]
    return f"{name:34s} n={len(L):4d}  {len(w)}W-{len(l)}L  net {sum(r['pnl'] for r in L):+9.2f}  losses {sum(r['pnl'] for r in l):+9.2f}"
week0 = datetime(2026, 9, 25, 7, tzinfo=timezone.utc).timestamp()
for label, base in (("ALL TIME", rows), ("THIS WEEK (Sep 25-Oct 2)", [r for r in rows if r["t"] >= week0])):
    print("=====", label, "first", base[0]["at"] if base else "-")
    print(rep("ALL TRADES", base))
    for cls in ("WRONG SIDE", "PATH BLOCKED", "GENUINE"): print(rep(cls, [r for r in base if r["cls"] == cls]))
    print(rep("  desk-tagged", [r for r in base if r["desk"]]))
    for cls in ("WRONG SIDE", "PATH BLOCKED", "GENUINE"): print(rep("  desk " + cls, [r for r in base if r["desk"] and r["cls"] == cls]))
    for a in ("btc", "gold"):
        for s in ("up", "down"):
            print(rep(f"  WRONG {a} {'long under' if s=='up' else 'short over'}", [r for r in base if r["cls"] == "WRONG SIDE" and r["asset"] == a and r["side"] == s]))
    for k in ("session", "purple", "bollinger"):
        print(rep(f"  wrong via {k}", [r for r in base if r["cls"] == "WRONG SIDE" and k in r["wrongKinds"]]))
    print(rep("  wrong via session only", [r for r in base if r["cls"] == "WRONG SIDE" and r["wrongKinds"] == ["session"]]))
