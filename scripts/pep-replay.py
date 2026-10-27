"""PEPPERSTONE REPLAY (Claude, Oct 2 night, Love: yes). The wrong-side audit re-run with Pepperstone BTC bars
(price AND lines from Pepperstone), compared to the original audit on OANDA. Read only."""

import json, os, bisect, collections, math, re
from datetime import datetime, timezone, timedelta
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
J = lambda n: json.load(open(os.path.join(D, n)))
THR = {"btc": 100.0, "gold": 2.5}
bars = {k: J(f"hist/pep-{k}.json") for k in ["btc-1", "btc-5", "btc-15"]}
bars.update({k: J(f"hist/{k}.json") for k in ["gold-1", "gold-5", "gold-15"]})
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
json.dump(rows, open(os.path.join(D, "pep-replay-rows.json"), "w"), indent=1)

old = {r["ticker"]: r for r in J("wrong-side-audit.json")}
week0 = datetime(2026, 9, 25, 7, tzinfo=timezone.utc).timestamp()
B = [r for r in rows if r["asset"] == "btc" and r["t"] >= week0 and r["ticker"] in old]
def blocked(r): return r["cls"] != "GENUINE"
caught_l = [r for r in B if r["pnl"] <= 0 and blocked(r) and not blocked(old[r["ticker"]])]
caught_w = [r for r in B if r["pnl"] > 0 and blocked(r) and not blocked(old[r["ticker"]])]
freed_l = [r for r in B if r["pnl"] <= 0 and not blocked(r) and blocked(old[r["ticker"]])]
freed_w = [r for r in B if r["pnl"] > 0 and not blocked(r) and blocked(old[r["ticker"]])]
L = [r for r in B if r["pnl"] <= 0]; W = [r for r in B if r["pnl"] > 0]
S = lambda xs: round(sum(r["pnl"] for r in xs), 2)
out = {"btcTradesThisWeek": len(B), "losers": len(L), "losersDollars": S(L), "winners": len(W),
       "losersBlockedOnOanda": sum(blocked(old[r["ticker"]]) for r in L), "losersBlockedOnPep": sum(blocked(r) for r in L),
       "pepCaughtLosersOandaMissed": {"n": len(caught_l), "dollars": S(caught_l)},
       "pepWouldAlsoBlockWinners": {"n": len(caught_w), "dollars": S(caught_w)},
       "oandaBlockedButPepClearLosers": {"n": len(freed_l), "dollars": S(freed_l)},
       "oandaBlockedButPepClearWinners": {"n": len(freed_w), "dollars": S(freed_w)},
       "caught": [{"at": r["at"], "side": r["side"], "pnl": r["pnl"], "cls": r["cls"], "lines": r["wrongLines"] or r["pathLines"]} for r in caught_l]}
json.dump(out, open(os.path.join(D, "pep-replay.json"), "w"), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != "caught"}, indent=1))
for c in out["caught"][:15]: print(c)
