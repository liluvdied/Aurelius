# SNIPE TRACKER + TRADE GRADES (Oct 23 ~5:30 PM PT, Love: "going forward i want to start tracking the multiples on trades at every point throughout the window,
# and how often they come back / and how we can learn to identify them when they occur, so she can detect it and add-on at the perfect time ... let's set up
# a grading system, A ... B ... C ... D ... after each week we'll go over the grades"). READ-ONLY on the desk: reads her ledgers (bid-paths every ~10 s,
# band-log each minute, fill-log, live-book-done, addon-log, grok-og) and writes only data/snipes/. Never touches live-switch, code or orders.
#   windows.jsonl  one row per settled BTC/gold 15m window: each side's deepest multiple (>=90 s left), when, nearest band, the snap after, did it come back,
#                  and the first touch of 4x/8x/15x/25x/50x (band nearby, came back or not)
#   trades.jsonl   one row per live Kalshi position: grade A-D, heat, peak, the deepest multiple her side offered after entry, book, setup, hour
#   paths/         the raw bid path of every settled window (bid-paths.json only keeps ~5 days)
#   REPORT.md      the weekly read: grades, come-backs, band snaps, add-on maths, what to cut and what to double down on
import json, os, sys, bisect, collections, datetime
from zoneinfo import ZoneInfo
os.chdir(os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius"))
PT = ZoneInfo("America/Los_Angeles")
OUT = "data/snipes"; os.makedirs(OUT + "/paths", exist_ok=True)
LEVELS = (4, 8, 15, 25, 50)
NEAR = {"btc": 40.0, "gold": 1.0}      # "at a band" for a snipe = spot within this of the line
TAP = {"btc": 10.0, "gold": 0.30}      # her tap, for the band-snap study
BIG = {"btc": 75.0, "gold": 3.0}       # a "hard snap" in 60 s
def rd(p, d):
    try: return json.load(open(p))
    except Exception: return d
def ts(iso): return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp()
def pt(t): return datetime.datetime.fromtimestamp(t, PT)
def kind(n):
    if n.startswith("BB"): return "Bollinger"
    if n == "5m PP": return "pink"
    if n in ("5m R1", "5m S1"): return "red/green zone"
    if n in ("5m R2", "5m S2"): return "R2/S2"
    if n in ("+2σ", "-2σ", "+3σ", "-3σ"): return "outer σ (2-3σ)"
    return "inner session (VWAP/±1σ)"

paths = rd("data/bid-paths.json", {})
# archive every path (newest copy wins) so the weekly read keeps the whole week
for tk, p in paths.items():
    if p: json.dump(p, open(f"{OUT}/paths/{tk}.json", "w"))
allp = {}
for fn in os.listdir(OUT + "/paths"):
    try: allp[fn[:-5]] = json.load(open(f"{OUT}/paths/{fn}"))
    except Exception: pass

bands = collections.defaultdict(list)
with open("data/band-log.jsonl") as f:
    for ln in f:
        try: r = json.loads(ln)
        except Exception: continue
        L = dict((n, p) for n, p in r.get("L", []) if p)
        bb = r.get("bbsr") or {}
        if bb.get("u"): L["BB upper"] = bb["u"]
        if bb.get("l"): L["BB lower"] = bb["l"]
        bands[r.get("asset")].append((ts(r["at"]), L))
for a in bands: bands[a].sort(key=lambda x: x[0])
bt = {a: [x[0] for x in v] for a, v in bands.items()}
def bandsAt(a, t):
    if a not in bt: return {}
    i = bisect.bisect_right(bt[a], t) - 1
    return bands[a][i][1] if i >= 0 and t - bt[a][i] <= 120 else {}
def nearest(a, t, s):
    L = bandsAt(a, t)
    if not L: return None
    n, p = min(L.items(), key=lambda kv: abs(kv[1] - s))
    return {"band": n, "kind": kind(n), "dist": round(s - p, 2)}
def assetOf(tk): return "btc" if "BTC15M" in tk else "gold" if "GOLD15M" in tk else None
def settled(p):
    if not p: return None
    if p[-1][1] >= 0.9: return "up"
    if p[-1][2] >= 0.9: return "down"
    return None

# 1) windows
W = []
for tk, p in allp.items():
    a = assetOf(tk); win = settled(p)
    if not a or not win or len(p) < 20: continue
    end = p[-1][0]
    row = {"ticker": tk, "asset": a, "won": win, "close": pt(end).isoformat(timespec="minutes"), "sides": {}}
    for side, oi in (("up", 2), ("down", 1)):
        best = None; first = {}
        for j, r in enumerate(p):
            t, s = r[0], r[3]; left = end - t
            if left < 90: break
            ob = r[oi]; ask = 1 - ob
            if ob <= 0 or ask <= 0: continue
            m = 1 / ask
            if best is None or m > best[0]: best = (m, t, s, j)
            for X in LEVELS:
                if m >= X and X not in first:
                    nb = nearest(a, t, s)
                    first[X] = {"at": pt(t).strftime("%H:%M:%S"), "left": int(left), "mult": round(m, 1), "near": nb,
                                "atBand": bool(nb and abs(nb["dist"]) <= NEAR[a])}
        if not best: continue
        m, t, s, j = best
        def mv(dt):
            k = j
            while k < len(p) and p[k][0] < t + dt: k += 1
            if k >= len(p): return None
            d = p[k][3] - s
            return round(d if side == "up" else -d, 2)
        row["sides"][side] = {"maxMult": round(m, 1), "at": pt(t).strftime("%H:%M:%S"), "left": int(end - t), "near": nearest(a, t, s),
                              "snap30": mv(30), "snap60": mv(60), "cameBack": win == side, "first": first}
    W.append(row)
W.sort(key=lambda r: r["close"])
with open(OUT + "/windows.jsonl", "w") as f:
    for r in W: f.write(json.dumps(r, ensure_ascii=False) + "\n")

# 2) band snaps: every tap of a line, how far price rejected back in 30/60 s
snap = collections.defaultdict(list)
for tk, p in allp.items():
    a = assetOf(tk)
    if not a: continue
    last = {}
    for j in range(1, len(p)):
        t, s = p[j][0], p[j][3]
        for n, pr in bandsAt(a, t).items():
            if abs(s - pr) > TAP[a] or t - last.get(n, 0) < 120: continue
            last[n] = t
            came = 1 if p[j - 1][3] < pr else -1
            k = j
            while k < len(p) and p[k][0] < t + 60: k += 1
            if k >= len(p): continue
            snap[(a, kind(n))].append((pr - p[k][3]) * came)

# 3) her live Kalshi positions, graded
fl = rd("data/fill-log.json", [])
done = rd("data/live-book-done.json", {})
og = {}
try:  # her setup labels: the archive (all days) then the live ledger (last few hours)
    with open("data/grok-og-archive.jsonl") as f:
        for ln in f:
            if '"label"' not in ln or ('15M-26OCT' not in ln): continue
            try: r = json.loads(ln)
            except Exception: continue
            if r.get("at", "") >= "2026-10-18" and r.get("id"): og[r["id"]] = {"label": r.get("label")}
except FileNotFoundError: pass
og.update({r.get("id"): r for r in rd("data/grok-og.json", []) if isinstance(r, dict)})
bookOf, setupOf = {}, {}
for k, v in done.items():
    if isinstance(v, dict) and v.get("status") in ("filled", "partial") and v.get("ticker") and ":" in k:
        b = k.split(":")[1]; bookOf.setdefault(v["ticker"], b)
        lab = (og.get(f"{v['ticker']}:{b}") or {}).get("label")
        if lab: setupOf.setdefault(v["ticker"], lab)
pos = {}
for x in fl:
    if x.get("venue") == "kalshi" and x.get("ticker") and assetOf(x["ticker"]): pos.setdefault(x["ticker"], {})[x["kind"]] = x
T = []
for tk, d in pos.items():
    if "taken" not in d or "banked" not in d or tk not in allp: continue
    tak, bk = d["taken"], d["banked"]; side = tak["side"]; ask = float(tak.get("ask") or 0)
    if not (0 < ask < 1): continue
    t0 = ts(tak["at"]); p = allp[tk]; end = p[-1][0]
    bi = 1 if side == "up" else 2; oi = 3 - bi
    seq = [(r[0] - t0, r[bi], 1 - r[oi]) for r in p if r[0] >= t0 - 5]
    if len(seq) < 3: continue
    low = min(b for _, b, _ in seq); high = max(b for _, b, _ in seq)
    low60 = min([b for s, b, _ in seq if s <= 60] or [ask])
    heat, heat60 = 1 - low / ask, 1 - low60 / ask
    profit = float(bk.get("profit") or 0); won = profit > 0
    if won and heat60 <= 0.10 and heat <= 0.25: g = "A"
    elif won and heat >= 0.40: g = "C"
    elif won: g = "B"
    elif high >= ask * 1.3: g = "B"
    else: g = "D"
    deep = min((a2 for s, b, a2 in seq if a2 > 0 and end - (t0 + s) >= 90), default=None)
    firsts = {}
    for X in (2.8, 3.8, 4.5, 8, 15, 25):
        for r in p:
            if r[0] < t0 + 5 or end - r[0] < 90: continue
            a2 = 1 - r[oi]
            if a2 > 0 and 1 / a2 >= X: firsts[str(X)] = True; break
    h = pt(t0)
    why = {"A": "went our way at once", "B": ("won, but took 10-40% heat first - entry timing could be sharper" if won else "was up 30%+ and still lost - exit/hold to improve"),
           "C": "went 40%+ against us and came back", "D": "lost and was never really in our favour - location to re-examine"}[g]
    T.append({"ticker": tk, "asset": assetOf(tk), "side": side, "book": bookOf.get(tk, "hand/other"), "setup": setupOf.get(tk, tak.get("pattern")),
              "at": h.isoformat(timespec="minutes"), "day": h.strftime("%a"), "hour": h.hour, "ask": ask, "mult": round(1 / ask, 2),
              "stake": tak.get("stake"), "profit": round(profit, 2), "won": won, "grade": g, "why": why, "heatPct": round(100 * heat),
              "heat60Pct": round(100 * heat60), "peakBid": high, "deepMultAfter": round(1 / deep, 1) if deep else None, "reached": firsts,
              "sideWonAtBell": settled(p) == side})
T.sort(key=lambda r: r["at"])
with open(OUT + "/trades.jsonl", "w") as f:
    for r in T: f.write(json.dumps(r, ensure_ascii=False) + "\n")

# 4) her real add-ons (Love Oct 23 6:07 PM: "aim that towards using our add ons properly, and seeing which ones worked out for us and which ones didn't
# and try to find the pattern there"): every filled add-on, its trigger, line, multiple, minutes left, and whether it paid
import re
adds = collections.defaultdict(lambda: [0, 0, 0.0, 0.0])
AO = []
def aoTrig(w):
    w = str(w)
    for k, lab in (("armed", "armed earlier"), ("touch", "touch"), ("flip", "flip near band"), ("reject", "rejection"), ("SNAP", "snap"), ("tap", "tap")):
        if k.lower() in w.lower(): return lab
    return "other"
def aoLine(w):
    w = str(w)
    for k, lab in (("Bollinger", "Bollinger"), ("BB ", "Bollinger"), ("Green zone", "green zone"), ("Red zone", "red zone"), ("PP", "pink"), ("pink", "pink"), ("σ", "session band"), ("VWAP", "session band")):
        if k in w: return lab
    return "?"
try:
    for ln in open("data/addon-log.jsonl"):
        try: x = json.loads(ln)
        except Exception: continue
        if not x.get("ok") or not x.get("filled") or x.get("ticker") not in allp: continue
        pa = allp[x["ticker"]]; bi = 1 if x["side"] == "up" else 2; won = pa[-1][bi] >= 0.9
        px = float(x.get("px") or x.get("ask") or 0); n = float(x["filled"])
        t = ts(x["at"]); left = (pa[-1][0] - t) / 60
        AO.append({"at": pt(t).isoformat(timespec="seconds"), "ticker": x["ticker"], "asset": assetOf(x["ticker"]), "side": x["side"], "book": "twin" if "twin" in str(x.get("why", "")) else "main",
                   "trigger": aoTrig(x.get("why")), "line": aoLine(x.get("why")), "px": px, "mult": round(1 / px, 1) if px else None, "minLeft": round(left, 1),
                   "cost": round(n * px, 2), "won": won, "net": round((n if won else 0) - n * px, 2), "why": x.get("why")})
except FileNotFoundError: pass
with open(OUT + "/addons.jsonl", "w") as f:
    for r in AO: f.write(json.dumps(r, ensure_ascii=False) + "\n")
try:
    for ln in open("data/addon-log.jsonl"):
        try: x = json.loads(ln)
        except Exception: continue
        if not x.get("ok") or not x.get("filled") or x.get("ticker") not in allp: continue
        bi = 1 if x["side"] == "up" else 2; won = allp[x["ticker"]][-1][bi] >= 0.9
        n = float(x["filled"]); px = float(x.get("px") or x.get("ask") or 0)
        k = (assetOf(x["ticker"]), "twin" if "twin" in str(x.get("why", "")) else "main")
        adds[k][0] += 1; adds[k][1] += won; adds[k][2] += n * px; adds[k][3] += n if won else 0
except FileNotFoundError: pass

# 5) the report
now = datetime.datetime.now(PT)
wk = (now - datetime.timedelta(days=7)).isoformat()
Tw = [r for r in T if r["at"] >= wk]; Ww = [r for r in W if r["close"] >= wk]
def pct(a, b): return f"{100 * a / b:.0f}%" if b else "-"
def money(x): return f"{'+' if x >= 0 else '-'}${abs(x):,.2f}"
o = [f"# Snipes & grades - week ending {now.strftime('%a %b %-d, %-I:%M %p')} PT", "",
     f"{len(Tw)} live Kalshi positions graded, {len(Ww)} settled windows read (bid path every ~10 s, so a 1-second snap can be a touch deeper than shown).", "",
     "## Grades", "", "| grade | what it means | trades | share | P&L |", "|---|---|---|---|---|"]
gm = {"A": "rejected and went our way at once", "B": "won with 10-40% heat, or was up 30%+ and lost", "C": "went 40%+ against us, came back", "D": "lost, never really in our favour"}
for g in "ABCD":
    G = [r for r in Tw if r["grade"] == g]
    o.append(f"| {g} | {gm[g]} | {len(G)} | {pct(len(G), len(Tw))} | {money(sum(r['profit'] for r in G))} |")
for lab, key in (("asset", "asset"), ("book", "book"), ("hour (PT)", "hour"), ("day", "day"), ("setup", "setup")):
    o += ["", f"### By {lab}", "", f"| {lab} | n | A | B | C | D | A+C share | P&L |", "|---|---|---|---|---|---|---|---|"]
    grp = collections.defaultdict(list)
    for r in Tw: grp[r[key]].append(r)
    for k2, G in sorted(grp.items(), key=lambda kv: -sum(r["profit"] for r in kv[1])):
        if len(G) < (3 if key == "setup" else 1): continue
        c = collections.Counter(r["grade"] for r in G)
        o.append(f"| {k2} | {len(G)} | {c['A']} | {c['B']} | {c['C']} | {c['D']} | {pct(c['A'] + c['C'], len(G))} | {money(sum(r['profit'] for r in G))} |")
o += ["", "## How often the big multiples came back", "", "First time a side reached the multiple with 90 s+ left, and whether that side won. EV is per $1 bought right there.", "",
      "| asset | multiple | times reached | came back | rate | EV per $1 | at a band: reached / came back |", "|---|---|---|---|---|---|---|"]
for a in ("btc", "gold"):
    for X in LEVELS:
        hit = [(r, s) for r in Ww if r["asset"] == a for sd, s in r["sides"].items() if str(X) in {str(k) for k in s["first"]} or X in s["first"]]
        n = len(hit); w = sum(1 for r, s in hit if s["cameBack"])
        ev = sum((s["first"].get(X) or s["first"].get(str(X)))["mult"] if s["cameBack"] else 0 for r, s in hit) / n - 1 if n else 0
        nb = [(r, s) for r, s in hit if (s["first"].get(X) or s["first"].get(str(X)))["atBand"]]
        o.append(f"| {a.upper()} | {X}x+ | {n} | {w} | {pct(w, n)} | {ev:+.2f} | {len(nb)} / {sum(1 for r, s in nb if s['cameBack'])} |")
cb = [(r, sd, s) for r in Ww for sd, s in r["sides"].items() if s["cameBack"] and s["maxMult"] >= 15]
o += ["", f"### The come-backs at 15x+ ({len(cb)})", "", "| window | side | deepest | when | left | nearest line | snap in 60 s |", "|---|---|---|---|---|---|---|"]
for r, sd, s in sorted(cb, key=lambda z: -z[2]["maxMult"]):
    nb = s["near"] or {}
    o.append(f"| {r['asset'].upper()} {r['close'][5:16].replace('T', ' ')} | {sd} | {s['maxMult']}x | {s['at']} | {s['left']} s | {nb.get('band', '?')} ({nb.get('dist', '?')}) | {s['snap60']} |")
o += ["", "## Which lines snap hardest", "", f"Every tap of a line (BTC ${TAP['btc']:.0f}, gold ${TAP['gold']:.2f}), how far price rejected back in 60 s. Hard snap = BTC ${BIG['btc']:.0f}+ / gold ${BIG['gold']:.0f}+.", "",
      "| asset | line | taps | rejected back | median 60 s | hard snaps |", "|---|---|---|---|---|---|"]
for (a, kd), v in sorted(snap.items(), key=lambda kv: (kv[0][0], -sorted(kv[1])[len(kv[1]) // 2])):
    v = sorted(v)
    o.append(f"| {a.upper()} | {kd} | {len(v)} | {pct(sum(1 for x in v if x > 0), len(v))} | {v[len(v) // 2]:+.2f} | {pct(sum(1 for x in v if x >= BIG[a]), len(v))} |")
o += ["", "## Add-ons", "", "If she had added the first time her own position's side reached each multiple (90 s+ left):", "", "| asset | multiple | positions that got there | won | EV per $1 |", "|---|---|---|---|---|"]
for a in ("btc", "gold"):
    for X in ("2.8", "3.8", "4.5", "8", "15", "25"):
        G = [r for r in Tw if r["asset"] == a and r["reached"].get(X)]
        w = sum(1 for r in G if r["sideWonAtBell"])
        o.append(f"| {a.upper()} | {X}x | {len(G)} | {w} ({pct(w, len(G))}) | {(w * float(X) / len(G) - 1 if G else 0):+.2f} (floor) |")
o += ["", "Her real add-ons (addon-log, all time in the archive):", "", "| asset | book | adds | won | cost | paid | net |", "|---|---|---|---|---|---|---|"]
for (a, b), (c, w, cost, pay) in sorted(adds.items()):
    o.append(f"| {str(a).upper()} | {b} | {c} | {w} | ${cost:,.2f} | ${pay:,.2f} | {money(pay - cost)} |")
AOw = [r for r in AO if r["at"] >= wk]
def mb(m): return "<3x" if m < 3 else "3-4.5x" if m < 4.5 else "4.5-8x" if m < 8 else "8x+"
def lb(m): return "10+ min" if m >= 10 else "5-10 min" if m >= 5 else "<5 min"
for lab, fn in (("trigger", lambda r: r["trigger"]), ("line", lambda r: r["line"]), ("multiple", lambda r: mb(r["mult"] or 0)), ("time left", lambda r: lb(r["minLeft"])),
                ("asset + book", lambda r: f"{str(r['asset']).upper()} {r['book']}"), ("hour (PT)", lambda r: int(r["at"][11:13]))):
    grp = collections.defaultdict(list)
    for r in AOw: grp[fn(r)].append(r)
    o += ["", f"### Add-ons by {lab} (this week)", "", f"| {lab} | adds | won | win rate | net |", "|---|---|---|---|---|"]
    for k2, G in sorted(grp.items(), key=lambda kv: -sum(r["net"] for r in kv[1])):
        w = sum(r["won"] for r in G); o.append(f"| {k2} | {len(G)} | {w} | {pct(w, len(G))} | {money(sum(r['net'] for r in G))} |")
o += ["", "## Cut / double down (n >= 10)", ""]
cand = []
for key in ("setup", "hour", "book"):
    grp = collections.defaultdict(list)
    for r in Tw: grp[r[key]].append(r)
    for k2, G in grp.items():
        if len(G) < 10: continue
        c = collections.Counter(r["grade"] for r in G); pnl = sum(r["profit"] for r in G)
        cand.append((pnl, key, k2, len(G), c["D"] / len(G), (c["A"] + c["C"]) / len(G)))
cand.sort()
for pnl, key, k2, n, dsh, ac in cand[:5]: o.append(f"- **Weakest** {key} {k2}: {n} trades, {dsh:.0%} D, {money(pnl)}")
for pnl, key, k2, n, dsh, ac in cand[::-1][:5]: o.append(f"- **Strongest** {key} {k2}: {n} trades, {ac:.0%} A+C, {money(pnl)}")
open(OUT + "/REPORT.md", "w").write("\n".join(o) + "\n")
json.dump({"at": now.isoformat(), "trades": len(T), "windows": len(W), "week": {"trades": len(Tw), "grades": dict(collections.Counter(r["grade"] for r in Tw))}}, open(OUT + "/summary.json", "w"))
print("snipes ok", len(T), "trades", len(W), "windows")
