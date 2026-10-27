# BOOK DUEL (Oct 21 ~8:11 PM PT, Love: "i'd like to start tracking the periods when the delayed entry book performs better than the main one does,
# and vis versa ... so we can calibrate how we implement the two ... gold has worse hours than bitcoin does, let's start keeping track of all of that
# on a mechanical level"). READ-ONLY on the desk: reads her ledgers, writes only data/duel/. Never touches live-switch, code or orders.
# Both books are scored on their paper rows (same $20 stake, every window, live hour or not) so the comparison is fair; live fills are tagged.
import json, os, sys, datetime, collections
from zoneinfo import ZoneInfo

os.chdir(os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius"))
PT = ZoneInfo("America/Los_Angeles")
OUT = "data/duel"; os.makedirs(OUT, exist_ok=True)
BOOKS = ("recon-tog", "recon-dly")
FULL = "--full" in sys.argv  # also scan the big archive (first run / rebuild)

def pt(iso):
    return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(PT)

def win_of(ticker):  # KXBTC15M-26OCT212315-15 -> window close time PT (ticker time is ET)
    s = ticker.split("-")[1]
    t = datetime.datetime.strptime(s, "%y%b%d%H%M").replace(tzinfo=ZoneInfo("America/New_York"))
    return t.astimezone(PT)

# 1) rows from her ledgers
rows = {}
def take(r):
    if r.get("lane") in BOOKS and r.get("ticker"): rows[r["id"]] = r
if FULL and os.path.exists("data/grok-og-archive.jsonl"):
    with open("data/grok-og-archive.jsonl") as f:
        for ln in f:
            if '"recon-tog"' in ln or '"recon-dly"' in ln:
                try: take(json.loads(ln))
                except Exception: pass
for r in json.load(open("data/grok-og.json")): take(r)

# 2) live fills seen (live-book-done prunes, so we remember every one we've seen)
liveP = f"{OUT}/live-seen.json"
live = json.load(open(liveP)) if os.path.exists(liveP) else {}
try:
    for k, v in json.load(open("data/live-book-done.json")).items():
        p = k.split(":")
        if len(p) >= 2 and p[1] in BOOKS:
            live[f"{p[0]}:{p[1]}"] = {"status": v.get("status"), "paid": v.get("paid"), "reason": (v.get("reason") or "")[:160]}
except Exception: pass
json.dump(live, open(liveP, "w"), indent=1)

# 3) model versions (recon.ts approvals) so a twin rule change never muddies the score
vers = []
try:
    for c in json.load(open("data/freeze-2026-10-12.json")).get("approvedChanges", []):
        if c.get("file") == "recon.ts" and c.get("sha"): vers.append((c["at"], c["sha"], (c.get("what") or "")[:80]))
except Exception: pass
vers.sort()
def ver_at(iso):
    v = ("", "pre-ledger", "")
    for x in vers:
        if x[0] <= iso: v = x
    return v[1]

# 4) one record per window per asset, both books side by side
wins = {}
for r in rows.values():
    if r.get("result") in (None, "", "open"): continue  # unsettled
    tk = r["ticker"]; close = win_of(tk); open_ = close - datetime.timedelta(minutes=15)
    w = wins.setdefault(tk, {"ticker": tk, "asset": r.get("asset") or ("btc" if "BTC" in tk else "gold"),
                             "day": open_.strftime("%Y-%m-%d"), "dow": open_.strftime("%a"), "hour": open_.hour, "min": open_.minute})
    b = "tog" if r["lane"] == "recon-tog" else "dly"
    lv = live.get(f"{tk}:{r['lane']}", {})
    w[b] = {"side": r.get("side"), "label": r.get("label"), "ask": r.get("ask"), "mult": r.get("multiple"), "pnl": round(float(r.get("pnl") or 0), 2),
            "win": float(r.get("pnl") or 0) > 0, "into": r.get("intoWindow"), "sd": r.get("sd"), "best": r.get("best"),
            "live": lv.get("status") == "filled", "paid": lv.get("paid"), "ver": ver_at(r.get("at", ""))}
    if b == "tog":  # regime clues at the main book's entry: candle range vs her sigma unit
        bar = r.get("bar") or {}
        if bar and r.get("sd"): w["rangeSd"] = round((bar.get("h", 0) - bar.get("l", 0)) / float(r["sd"]), 3)
for w in wins.values():
    t, d = w.get("tog"), w.get("dly")
    w["reversed"] = bool(t) and not t["win"]  # main book's first call lost = the market turned on her
    w["better"] = ("dly" if (d["pnl"] if d else 0) > (t["pnl"] if t else 0) else "tog" if (t["pnl"] if t else 0) > (d["pnl"] if d else 0) else "tie") if (t or d) else "none"

# keep every window scored before (grok-og.json rolls over; the archive is only read with --full)
if os.path.exists(f"{OUT}/windows.jsonl"):
    for ln in open(f"{OUT}/windows.jsonl"):
        try:
            o = json.loads(ln)
            if o["ticker"] not in wins: wins[o["ticker"]] = o
        except Exception: pass
W = sorted(wins.values(), key=lambda x: x["ticker"])

# 4b) THE SWAP TWIN (paper, Love Oct 21 ~8:28 PM PT: "let's create a paper twin that cycles them out when one outperforms the other, and we'll see if that book
# outperforms ours over the week"). Per asset, before each window opens, she looks only at windows already settled and follows the book that has been
# winning lately; ties stay with TOGETHER. A few lookbacks are scored side by side so we learn which signal reads the market best.
def wclose(w): return win_of(w["ticker"])
def wopen(w): return wclose(w) - datetime.timedelta(minutes=15)
def pnl(w, b): return (w.get(b) or {}).get("pnl", 0.0)
SWAPS = {"swap-4": 4, "swap-8": 8, "swap-hour": "hour"}  # last 4 / last 8 windows of that asset; same hour on earlier days
for a in ("btc", "gold"):
    seq = [w for w in W if w["asset"] == a]
    for i, w in enumerate(seq):
        done = [x for x in seq[:i] if wclose(x) <= wopen(w)]
        for name, look in SWAPS.items():
            past = [x for x in done if x["hour"] == w["hour"] and x["day"] != w["day"]] if look == "hour" else done[-look:]
            t = sum(pnl(x, "tog") for x in past); d = sum(pnl(x, "dly") for x in past)
            pick = "dly" if past and d > t else "tog"
            w.setdefault("swap", {})[name] = {"pick": pick, "pnl": round(pnl(w, pick), 2)}
with open(f"{OUT}/windows.jsonl", "w") as f:
    for w in W: f.write(json.dumps(w) + "\n")

# 5) scoreboards
def board(key):
    g = collections.defaultdict(lambda: {"n": 0, "tog": 0.0, "dly": 0.0, "togW": 0, "togN": 0, "dlyW": 0, "dlyN": 0, "rev": 0, "togBetter": 0, "dlyBetter": 0})
    for w in W:
        s = g[key(w)]; s["n"] += 1
        for b in ("tog", "dly"):
            if w.get(b): s[b] += w[b]["pnl"]; s[b + "N"] += 1; s[b + "W"] += w[b]["win"]
        s["rev"] += w["reversed"]; s["togBetter"] += w["better"] == "tog"; s["dlyBetter"] += w["better"] == "dly"
        for nm, sw in (w.get("swap") or {}).items(): s[nm] = s.get(nm, 0.0) + sw["pnl"]
    out = {}
    for k, s in sorted(g.items(), key=lambda kv: str(kv[0])):
        for nm in SWAPS: s[nm] = round(s.get(nm, 0.0), 2)
        s["tog"] = round(s["tog"], 2); s["dly"] = round(s["dly"], 2); s["edge"] = round(s["dly"] - s["tog"], 2)
        s["leader"] = "DELAYED" if s["edge"] > 0 else "TOGETHER" if s["edge"] < 0 else "even"
        out[str(k)] = s
    return out

WEEK0 = "2026-10-22"  # the swap twin's trial week starts Thu Oct 22 PT (Love, Oct 21 ~8:28 PM PT)
summary = {
    "at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "windows": len(W),
    "note": "paper P&L at $20 stake per trade, both books every window; edge = DELAYED minus TOGETHER; reversed = main book's call lost",
    "swapWeek": board(lambda w: w["asset"] + (" this week" if w["day"] >= WEEK0 else " before")),
    "swapByDay": board(lambda w: f"{w['asset']} {w['day']}"),
    "byAssetHour": board(lambda w: f"{w['asset']} {w['hour']:02d}"),
    "byHour": board(lambda w: f"{w['hour']:02d}"),
    "byAssetDay": board(lambda w: f"{w['asset']} {w['day']}"),
    "byDayHour": board(lambda w: f"{w['day']} {w['hour']:02d}"),
    "byDow": board(lambda w: f"{w['asset']} {w['dow']}"),
    "byTwinVersion": board(lambda w: (w.get("dly") or {}).get("ver") or "no twin entry"),
    "byRegime": board(lambda w: w["asset"] + " " + ("quiet" if w.get("rangeSd", 0) < 0.15 else "normal" if w.get("rangeSd", 0) < 0.4 else "wild") if "rangeSd" in w else w["asset"] + " ?"),
}
# day-by-day hour verdicts: which book won each hour each day; hours that went the twin's way more days than not
dh = collections.defaultdict(lambda: collections.Counter())
for k, s in summary["byDayHour"].items():
    day, h = k.split(" "); dh[h][s["leader"]] += 1
summary["hourVerdicts"] = {h: dict(c) for h, c in sorted(dh.items())}
json.dump(summary, open(f"{OUT}/summary.json", "w"), indent=1)

# 6) a plain report she can read
L = [f"# Book duel - TOGETHER vs DELAYED", f"Updated {pt(summary['at']).strftime('%b %d %I:%M %p PT')} - {len(W)} settled windows. Paper P&L at $20 a trade, both books every window.", "",
     "## By asset and hour (PT)", "| asset hour | windows | TOGETHER $ (win%) | DELAYED $ (win%) | main reversed | leader |", "|---|---|---|---|---|---|"]
pct = lambda a, b: f"{(100 * a / b):.0f}%" if b else "-"
for k, s in summary["byAssetHour"].items():
    a, h = k.split(" "); hh = int(h); lab = f"{a} {(hh % 12) or 12} {'AM' if hh < 12 else 'PM'}"
    L.append(f"| {lab} | {s['n']} | {s['tog']:+.2f} ({pct(s['togW'], s['togN'])}) | {s['dly']:+.2f} ({pct(s['dlyW'], s['dlyN'])}) | {pct(s['rev'], s['n'])} | {s['leader']} |")
L += ["", "## SWAP twin (paper) - follows whichever book is winning lately", "Her trial week starts Thu Oct 22. swap-4 / swap-8 = leader over the last 4 / 8 settled windows of that asset; swap-hour = leader of the same hour on earlier days.", "| asset period | windows | TOGETHER $ | DELAYED $ | swap-4 $ | swap-8 $ | swap-hour $ |", "|---|---|---|---|---|---|---|"]
for k, s in summary["swapWeek"].items(): L.append(f"| {k} | {s['n']} | {s['tog']:+.2f} | {s['dly']:+.2f} | {s['swap-4']:+.2f} | {s['swap-8']:+.2f} | {s['swap-hour']:+.2f} |")
L += ["", "| asset day | TOGETHER $ | DELAYED $ | swap-4 $ | swap-8 $ | swap-hour $ |", "|---|---|---|---|---|---|"]
for k, s in summary["swapByDay"].items(): L.append(f"| {k} | {s['tog']:+.2f} | {s['dly']:+.2f} | {s['swap-4']:+.2f} | {s['swap-8']:+.2f} | {s['swap-hour']:+.2f} |")
L += ["", "## Which book won each hour, counted by days", "| hour | TOGETHER days | DELAYED days | even |", "|---|---|---|---|"]
for h, c in summary["hourVerdicts"].items():
    hh = int(h); L.append(f"| {(hh % 12) or 12} {'AM' if hh < 12 else 'PM'} | {c.get('TOGETHER', 0)} | {c.get('DELAYED', 0)} | {c.get('even', 0)} |")
L += ["", "## By asset and day", "| asset day | windows | TOGETHER $ | DELAYED $ | leader |", "|---|---|---|---|---|"]
for k, s in summary["byAssetDay"].items(): L.append(f"| {k} | {s['n']} | {s['tog']:+.2f} | {s['dly']:+.2f} | {s['leader']} |")
L += ["", "## By market mood at the main book's entry (candle range vs her sigma)", "| asset mood | windows | TOGETHER $ | DELAYED $ | leader |", "|---|---|---|---|---|"]
for k, s in summary["byRegime"].items(): L.append(f"| {k} | {s['n']} | {s['tog']:+.2f} | {s['dly']:+.2f} | {s['leader']} |")
L += ["", "## DELAYED by twin rule version (recon sha)", "| version | windows | TOGETHER $ | DELAYED $ |", "|---|---|---|---|"]
for k, s in summary["byTwinVersion"].items(): L.append(f"| {k} | {s['n']} | {s['tog']:+.2f} | {s['dly']:+.2f} |")
open(f"{OUT}/REPORT.md", "w").write("\n".join(L) + "\n")
print("windows", len(W), "twin rows", sum(1 for w in W if w.get("dly")), "live seen", len(live))
