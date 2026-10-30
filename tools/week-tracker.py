#!/usr/bin/env python3
# WEEK TRACKER (Love, Oct 24 ~6:39 PM PT: "grab all da info we can to help us sharpen the blade ... find out what's causing any bleeding").
# READ ONLY on her desk. Writes only data/week/. Since Sat Oct 24 PT, joins every recon book's paper result (recon-tog / recon-rej / recon-dly)
# with what the live desk did on that window, so the Friday read can show:
#   1. paper vs live: what paper took that live missed or filled worse, and why (wall, price cap, not its hour)
#   2. walls on trial: every wall that held a paper trade back, scored saved-a-loser vs cost-a-winner
#   3. her hand trades: entry, add-ons, sale, and what holding to settlement would have paid (when the window's outcome is known)
#   4. hours x books, and whether she was on carried or fresh session bands
import json, os, re, datetime, collections, glob
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
OUT = "data/week"; os.makedirs(OUT, exist_ok=True)
from zoneinfo import ZoneInfo
LA = ZoneInfo("America/Los_Angeles")
# ROLLING WEEK (Love's weekly rhythm, Oct 24 PT): a week runs Saturday 12:00 AM PT to Friday; on rollover last week's REPORT is kept as REPORT-<sat>.md
_nowLA = datetime.datetime.now(LA)
_sat = (_nowLA - datetime.timedelta(days=(_nowLA.weekday() - 5) % 7)).replace(hour=0, minute=0, second=0, microsecond=0)
START = _sat.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
WEEK = _sat.strftime("%a %b %-d")
BOOKS = ("recon-tog", "recon-rej", "recon-rejx", "recon-dly", "recon-dly-add")  # recon-dly-add = fix169 twin paper add-on, $5 (1/4 of $20), paper only
NAME = {"recon-tog": "main book", "recon-rej": "rejection model", "recon-rejx": "rejection twin +BB/zones (paper)", "recon-dly": "delayed twin", "recon-dly-add": "twin add-on (paper $5)"}
PT = datetime.timedelta(hours=-7)
def pt(iso):
    return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(LA).replace(tzinfo=None)
def jload(p, d):
    try: return json.load(open(p))
    except Exception: return d

# ---- paper rows (archive read incrementally) ----
st = jload(f"{OUT}/state.json", {})
rows = jload(f"{OUT}/paper-rows.json", {})
if st.get("week") and st["week"] != START:
    try: os.replace(f"{OUT}/REPORT.md", f"{OUT}/REPORT-{st['week'][:10]}.md")
    except Exception: pass
    rows = {k: v for k, v in rows.items() if str(v.get("at", "")) >= START}
st["week"] = START
arch = "data/grok-og-archive.jsonl"
if os.path.exists(arch):
    off = st.get("archOff", 0)
    if off > os.path.getsize(arch): off = 0
    with open(arch, "rb") as f:
        f.seek(off)
        for line in f:
            if b'"recon-' not in line: continue
            try: r = json.loads(line)
            except Exception: continue
            if r.get("lane") in BOOKS and str(r.get("at", "")) >= START: rows[r["id"]] = r
        st["archOff"] = f.tell()
for r in jload("data/grok-og.json", []):
    if r.get("lane") in BOOKS and str(r.get("at", "")) >= START: rows[r["id"]] = r
json.dump(rows, open(f"{OUT}/paper-rows.json", "w"))

# ---- band state snapshots (carried vs fresh), one per run ----
sc = jload("data/sess-carry.json", {})
ABS = {"btc": 180, "gold": 5}
snap = {"at": datetime.datetime.utcnow().isoformat() + "Z"}
for a in ("btc", "gold"):
    c = (sc.get(a) or {}).get("cur") or {}
    snap[a] = {"sd": round(float(c.get("sd") or 0), 2), "carried": float(c.get("sd") or 0) < ABS[a]}
open(f"{OUT}/bands.jsonl", "a").write(json.dumps(snap) + "\n")
bands = []
for l in open(f"{OUT}/bands.jsonl"):
    try: bands.append(json.loads(l))
    except Exception: pass
def band_at(iso, a):
    best = None
    for b in bands:
        if b["at"] <= iso: best = b
    return (best or {}).get(a, {}).get("carried")

# ---- live outcome per paper row ----
done = jload("data/live-book-done.json", {})
HOUR_RX = re.compile(r"takes this hour|sits out|only in Love's rejection hours|rejection hours", re.I)
def wall_of(txt):
    t = str(txt or "")
    if not t: return ""
    if "paper closed it" in t: return ""
    if "out of bounds" in t or "waiting for" in t and "x+" in t: return "PRICE FLOOR / MULTIPLE"
    if t == "unfilled": return "UNFILLED (price ran past her cap)"
    m = re.match(r"\s*([A-Z0-9][A-Z0-9 %/&'\-\.]+?)(?::| - |\()", t)
    if m and len(m.group(1)) >= 4: return m.group(1).strip()
    return t[:60]
out = []
for rid, r in rows.items():
    tk, lane = r.get("ticker"), r.get("lane")
    lv = done.get(f"{tk}:{lane}:{tk}:{lane}") or {}
    s, why, first = lv.get("status"), str(lv.get("reason") or ""), str(lv.get("firstReason") or "")
    if s in ("filled", "partial"): cat, wall = "live filled", ""
    elif HOUR_RX.search(why): cat, wall = "not its hour", ""
    elif not lv: cat, wall = "no live record", ""
    else:
        wall = wall_of(first) or wall_of(why) or ("UNFILLED (price ran past her cap)" if "paper closed it" in why else s or "")
        cat = "held by a wall" if wall and not wall.startswith("UNFILLED") and wall != "PRICE FLOOR / MULTIPLE" else ("price cap / unfilled" if wall.startswith("UNFILLED") else ("price floor" if wall == "PRICE FLOOR / MULTIPLE" else s or "other"))
    pnl = r.get("pnl")
    out.append({"id": rid, "book": lane, "asset": r.get("asset"), "ticker": tk, "side": r.get("side"), "label": r.get("label"),
                "atPT": pt(r["at"]).strftime("%a %m-%d %I:%M %p"), "hourPT": pt(r["at"]).hour, "day": pt(r["at"]).strftime("%a"),
                "paperAsk": r.get("ask"), "paperPnl": pnl, "result": r.get("result"), "live": cat, "wall": wall,
                "livePaid": lv.get("paid"), "slip": (round(lv["paid"] - r["ask"], 3) if lv.get("paid") and r.get("ask") else None),
                "carried": band_at(r["at"], r.get("asset"))})
out.sort(key=lambda x: x["id"])
with open(f"{OUT}/windows.jsonl", "w") as f:
    for o in out: f.write(json.dumps(o) + "\n")

# ---- outcomes per ticker (for hand-trade 'held to settle') ----
outcome = {}
for r in rows.values():
    if r.get("result") == "loss" and r.get("side") in ("up", "down"): outcome[r["ticker"]] = "down" if r["side"] == "up" else "up"
for l in glob.glob("data/close-twin.jsonl") + glob.glob("data/chart-twins.jsonl"):
    pass

# ---- hand trades ----
fl = jload("data/fill-log.json", [])
hand = {}
for e in fl:
    tid = str(e.get("tradeId", ""))
    if not tid.startswith("held-") or e.get("venue") != "kalshi" or str(e.get("at", "")) < START: continue
    h = hand.setdefault(tid, {"ticker": e.get("ticker"), "asset": e.get("asset"), "side": e.get("side")})
    if e.get("kind") == "taken": h.update(atPT=pt(e["at"]).strftime("%a %m-%d %I:%M %p"), stake=e.get("stake"), ask=e.get("ask"))
    if e.get("kind") == "banked": h.update(profit=e.get("profit"), peak=e.get("peak"))
trail = collections.defaultdict(list)
for l in open("data/hand-trail.jsonl"):
    try: t = json.loads(l)
    except Exception: continue
    if t.get("status") == "executed" and str(t.get("at", "")) >= START: trail[t.get("ticker")].append(t)
for h in hand.values():
    buys = [t for t in trail.get(h["ticker"], []) if t.get("action") == "buy"]
    h["buys"] = len(buys); h["contracts"] = round(sum(float(t.get("qty") or 0) for t in buys), 2)
    o = outcome.get(h["ticker"])
    if o and h.get("contracts"):
        h["heldToSettle"] = "won" if o == h["side"] else "lost"
json.dump(list(hand.values()), open(f"{OUT}/hand.json", "w"), indent=1)

# ---- report ----
def money(x): return f"{'+' if x >= 0 else '-'}${abs(x):,.2f}"
L = [f"# Week tracker - week of {WEEK} (updated {datetime.datetime.now(LA).strftime('%a %I:%M %p')} PT)", "",
     "Paper = $20 a trade per book. Live = what the desk actually did that window.", ""]
L += ["## 1. Paper vs live (per book)", "", "| Book | Paper trades | Paper P&L | Live filled | Not its hour | Held by a wall | Price cap / unfilled | Price floor |", "|---|---|---|---|---|---|---|---|"]
for b in BOOKS:
    xs = [o for o in out if o["book"] == b and o["paperPnl"] is not None]
    cc = collections.Counter(o["live"] for o in xs)
    L.append(f"| {NAME[b]} | {len(xs)} | {money(sum(o['paperPnl'] for o in xs))} | {cc['live filled']} | {cc['not its hour']} | {cc['held by a wall']} | {cc['price cap / unfilled']} | {cc['price floor']} |")
sl = [o["slip"] for o in out if o["slip"] is not None]
if sl: L += ["", f"Live fills vs paper price: average {sum(sl)/len(sl)*100:+.1f}c over {len(sl)} fills (positive = live paid more)."]
L += ["", "## 2. Walls on trial (live hours only)", "", "| Wall | Times it held a trade | Saved a loser | Cost a winner | Net for her |", "|---|---|---|---|---|"]
wg = collections.defaultdict(list)
for o in out:
    if o["live"] in ("held by a wall", "price cap / unfilled", "price floor") and o["paperPnl"] is not None: wg[o["wall"]].append(o["paperPnl"])
for w, ps in sorted(wg.items(), key=lambda kv: sum(kv[1])):
    saved = [p for p in ps if p < 0]; cost = [p for p in ps if p > 0]
    L.append(f"| {w} | {len(ps)} | {len(saved)} ({money(-sum(saved))}) | {len(cost)} ({money(sum(cost))}) | {money(-sum(ps))} |")
L += ["", "Net for her: positive = the wall saved more than it cost on paper; negative = it cost more than it saved."]
L += ["", "## 3. Your hand trades", "", "| When | Asset | Side | Buys | Contracts | First stake | Sold for | Held to settle |", "|---|---|---|---|---|---|---|---|"]
for h in sorted(hand.values(), key=lambda h: h.get("atPT", "")):
    L.append(f"| {h.get('atPT','?')} | {h.get('asset')} | {h.get('side')} | {h.get('buys')} | {h.get('contracts')} | ${h.get('stake') or 0:.2f} | {money(h['profit']) if h.get('profit') is not None else 'open'} | {h.get('heldToSettle','unknown')} |")
L += ["", "## 4. Hours x books (paper P&L, PT)", "", "| Hour | main book | rejection model | delayed twin |", "|---|---|---|---|"]
for hr in range(24):
    cells = []
    for b in BOOKS:
        xs = [o["paperPnl"] for o in out if o["book"] == b and o["hourPT"] == hr and o["paperPnl"] is not None]
        cells.append(f"{sum(1 for p in xs if p > 0)}-{sum(1 for p in xs if p <= 0)} {money(sum(xs))}" if xs else "-")
    L.append(f"| {datetime.time(hr).strftime('%I %p').lstrip('0')} | " + " | ".join(cells) + " |")
L += ["", "## 5. Carried vs fresh session bands (paper P&L)", ""]
for b in BOOKS:
    for flag, nm in ((True, "carried"), (False, "fresh")):
        xs = [o["paperPnl"] for o in out if o["book"] == b and o["carried"] is flag and o["paperPnl"] is not None]
        if xs: L.append(f"- {NAME[b]}, {nm} bands: {sum(1 for p in xs if p > 0)}-{sum(1 for p in xs if p <= 0)}, {money(sum(xs))}")
open(f"{OUT}/REPORT.md", "w").write("\n".join(L) + "\n")
json.dump(st, open(f"{OUT}/state.json", "w"))
print(f"week-tracker: {len(out)} paper rows, {len(hand)} hand trades")
