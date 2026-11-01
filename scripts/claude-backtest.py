#!/usr/bin/env python3
"""CLAUDE BACKTEST (Claude, 2026-10-02). Read only. Rebuilds which setups the CLAUDE ledger would
have taken and how each one would have paid, then writes data/claude-backtest.json for the SHIFT tab.
  1) NIGHT REPLAY: every setup the desk saw since the night book began (ORIGINAL = every setup before
     any rule, plus NEW's nav-close entries), each traded with CLAUDE's exits on the real Kalshi bid
     path (data/bid-paths.json): take profit +50% under 1.65x / 75% of the max, rides with a 1% trail,
     otherwise held to the bell (Kalshi's own result). Gates / LOCK THE WIN are left out (CLAUDE's
     only ever bank a profit, so this is the conservative read). The nav guard is rebuilt from the
     bands saved on each row; the path guard needs the strike, which rows don't keep, so it is off.
  2) WEEK: the 1,000+ recorded desk trades Sep 24 - Oct 2 (data/fill-log.json), split by what CLAUDE
     would take vs skip. In-sample: the list was chosen from this same data."""
import json, re, os, collections
from datetime import datetime, timedelta
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
J = lambda n, d=None: json.load(open(os.path.join(D, n))) if os.path.exists(os.path.join(D, n)) else d
SKIP = {"btc": [9, 12, 16, 19, 21], "gold": [6, 12, 16, 23]}

def pick(a, s, l, m, h, nav, guard):
    l = l.replace("−", "-")
    if guard: return guard
    if h in SKIP.get(a, []): return f"{h}:00 PT is a worst hour for {a}"
    if a == "gold":
        if s != "up": return "gold short (not on the list)"
        if m < 1.38 or m > 2.5: return "outside 1.38-2.5x"
        if nav or re.match(r"(Tap-reject|Break-retest|Gold clock)", l): return None
        return f"gold {l} not on the list"
    if a == "btc":
        if nav: return "BTC purple-line close (0-2)"
        if m < 1.38 or m > 1.8: return "BTC outside 1.38-1.8x"
        if s == "down" and l.startswith("Tap-reject"): return None
        if s == "up" and l.startswith("Close above"): return None
        return f"BTC {'long' if s=='up' else 'short'} {l} not on the list"
    return "other"

def nav_guard(r):
    b = r.get("bands") or {}
    spot = r.get("spot") or b.get("spot")
    if not spot or not b: return None
    thr = 100 if r["asset"] == "btc" else 2.5
    lines = []
    v, sd = b.get("vwap"), b.get("sd")
    if v and sd:
        for k in range(-6, 7): lines.append((("VWAP" if k == 0 else f"{k/2:+g}σ"), v + k / 2 * sd))
    nav = b.get("nav") or {}
    for fr in ["m1", "m5", "m10", "m15"]:
        x = nav.get(fr)
        if not x: continue
        lines.append((f"{fr[1:]}m purple", x["c"]))
        if r["asset"] == "btc" and fr != "m1":
            lines += [(f"{fr[1:]}m upper", x["up"]), (f"{fr[1:]}m lower", x["dn"])]
    up = r["side"] == "up"
    bad = [n for n, L in lines if (0 < L - spot <= thr if up else 0 < spot - L <= thr)]
    return f"{bad[0]} right {'above the long' if up else 'below the short'}" if bad else None

def new_tp(m):
    mx = (m - 1) * 100
    return min(50, mx) if m < 1.65 else mx * 0.75

def sim(r, paths):
    """CLAUDE exits on the real bid path; falls back to peak + bell when no path."""
    m, ask, stake = r["multiple"], r["ask"], 50.0
    tp = new_tp(m)
    t0 = datetime.fromisoformat(r["at"].replace("Z", "+00:00")).timestamp()
    p = [x for x in paths.get(r["ticker"], []) if x[0] >= t0 - 2]
    peak = None
    for t, yb, nb, _spot in p:
        bid = yb if r["side"] == "up" else nb
        if not bid or bid <= 0: continue
        pct = (bid / ask - 1) * 100
        if peak is not None or pct >= tp:
            peak = max(peak or pct, pct)
            trail = max(tp, int(peak) - 1)
            if bid >= 0.97 or pct < trail:
                return round(stake / ask * bid - stake, 2), f"take profit (peaked +{round(peak)}%)", bool(p)
    won = r.get("bell") == ("yes" if r["side"] == "up" else "no") if r.get("bell") else None
    if won is None: return None, "open", bool(p)
    if not p and (r.get("peakPct") or 0) >= tp: return round(stake * tp / 100, 2), "take profit (peak)", False
    return (round(stake / ask - stake, 2) if won else -stake), "held to the bell", bool(p)

def night():
    rows = [r for r in J("night-book.json", []) if not r.get("dnaMode")]  # her fix only
    paths = J("bid-paths.json", {})
    by = collections.defaultdict(dict)
    for r in rows: by[r["ticker"]][r["book"]] = r
    out = []
    for tk, bk in by.items():
        base = bk.get("original")
        nav = False
        if not base:
            base = bk.get("new")
            if not base or not re.search(r"nav|Bollinger", base["setup"] or "", re.I): continue
            nav = True
        if base.get("asset") not in ("btc", "gold"): continue
        h = base.get("hourPT")
        if h is None: h = (datetime.fromisoformat(base["at"].replace("Z", "+00:00")) - timedelta(hours=7)).hour
        why = pick(base["asset"], base["side"], base["setup"] or "", base["multiple"], h, nav, nav_guard(base))
        pnl, exit_, onpath = sim(base, paths) if why is None else (None, None, None)
        n, o = bk.get("new"), bk.get("original")
        cat = ("both" if n else "claude-only") if why is None else ("others-only" if (n or o) else "none")
        out.append({"ticker": tk, "at": base["at"], "asset": base["asset"], "side": base["side"], "setup": base["setup"], "multiple": base["multiple"], "hourPT": h,
                    "claude": why is None, "why": why, "claudePnl": pnl, "claudeExit": exit_, "onPath": onpath,
                    "newPnl": n.get("pnl") if n else None, "newExit": n.get("exit") if n else None,
                    "origPnl": o.get("pnl") if o else None, "bell": base.get("bell"), "cat": cat})
    out.sort(key=lambda x: x["at"], reverse=True)
    return out

def week():
    log = J("fill-log.json", [])
    tr = {}
    for r in log: tr.setdefault(r["tradeId"], {})[r["kind"]] = r
    seen, rows = set(), []
    for d in tr.values():
        t, b = d.get("taken"), d.get("banked")
        if not t or not b or b.get("profit") is None or t["venue"] not in ("paper", "kalshi") or t["asset"] not in ("btc", "gold"): continue
        if (t.get("pattern") or "") == "Live": continue
        k = (t["venue"], t["ticker"], t["side"])
        if k in seen: continue
        seen.add(k)
        at = datetime.strptime(t["at"][:19], "%Y-%m-%dT%H:%M:%S") - timedelta(hours=7)
        why = pick(t["asset"], t["side"], t.get("pattern") or "", t.get("multiple") or 0, at.hour, False, None)
        rows.append({"half": "Sep 24-27" if at.strftime("%m-%d") < "09-28" else "Sep 28-Oct 2", "claude": why is None, "stake": t.get("stake") or 10, "pnl": b["profit"]})
    res = []
    for half in ["Sep 24-27", "Sep 28-Oct 2"]:
        for grp, f in [("ALL", lambda r: True), ("CLAUDE TAKES", lambda r: r["claude"]), ("CLAUDE SKIPS", lambda r: not r["claude"])]:
            L = [r for r in rows if r["half"] == half and f(r)]
            st = sum(r["stake"] for r in L) or 1
            res.append({"half": half, "group": grp, "n": len(L), "winPct": round(100 * sum(r["pnl"] > 0 for r in L) / max(1, len(L))), "roiPct": round(100 * sum(r["pnl"] for r in L) / st, 1), "pnl10": round(sum(r["pnl"] / r["stake"] * 50 for r in L), 2)})
    return res

if __name__ == "__main__":
    n = night()
    out = {"at": datetime.utcnow().isoformat() + "Z", "night": n, "week": week()}
    json.dump(out, open(os.path.join(D, "claude-backtest.json"), "w"), indent=1)
    c = [r for r in n if r["claude"] and r["claudePnl"] is not None]
    print("night setups", len(n), "claude takes", len(c), "pnl", round(sum(r["claudePnl"] for r in c), 2))
    for cat in ["claude-only", "both", "others-only"]:
        L = [r for r in n if r["cat"] == cat]
        print(cat, len(L), "claude", round(sum(r["claudePnl"] or 0 for r in L), 2), "new", round(sum(r["newPnl"] or 0 for r in L), 2), "orig", round(sum(r["origPnl"] or 0 for r in L), 2))
    for w in out["week"]: print(w)
