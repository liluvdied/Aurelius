#!/usr/bin/env python3
"""STEADY STREAK (Oct 20 ~10:53 PM PT, Love: "i want her to stay in one spot for 24 hours without changing character, then 1 week, then 1 month /
she ANDDDD YOUUU gets a badge for every 24 hours she stays in one place without altering her behavior ... incentivizes consistency, not just in wins
but in execution"). Read-only on the desk; writes only data/steady-streak.json.

Each run (the hourly check runs it):
  - Her code = src/lib/desk/*.ts vs data/golden-baseline.json "code" and its configFiles.
  - Her settings = data/live-switch.json minus her own hands-on switches (live, the size slider, notes).
  - Execution = breaker never tripped and no backwards fill ("RED: ... meant ... but Kalshi holds") since the last run.
  A revision Love asked for (golden baseline moved, code matches it) opens a fresh chapter with no penalty.
  Anything else that moves her, or an execution slip, breaks the streak. Every full 24 h on one spot = a badge for her and Claude;
  every 7 days a week badge, every 30 days a month badge."""
import json, hashlib, os, glob, datetime
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
S = "data/steady-streak.json"
now = datetime.datetime.now(datetime.timezone.utc)
iso = lambda t: t.isoformat().replace("+00:00", "Z")
parse = lambda s: datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
def jl(p, d):
    try: return json.load(open(p))
    except Exception: return d
base = jl("data/golden-baseline.json", {})
baseSha = hashlib.sha256(open("data/golden-baseline.json", "rb").read()).hexdigest()[:16]
cur = {os.path.basename(f): hashlib.sha256(open(f, "rb").read()).hexdigest()[:16] for f in sorted(glob.glob("src/lib/desk/*.ts"))}
codeDrift = [f for f, h in base.get("code", {}).items() if cur.get(f) != h] + [f for f in cur if f not in base.get("code", {})]
for f, h in base.get("configFiles", {}).items():
    c = hashlib.sha256(open(f, "rb").read()).hexdigest()[:16] if os.path.exists(f) else "MISSING"
    if c != h: codeDrift.append(f)
sw = jl("data/live-switch.json", {})
for k in ("live", "maxDollars", "note", "at"): sw.pop(k, None)
if isinstance(sw.get("liveBook"), dict): sw["liveBook"] = {k: v for k, v in sw["liveBook"].items() if k not in ("dollars", "note", "at", "since")}
cfg = {k: hashlib.sha256(json.dumps(v, sort_keys=True).encode()).hexdigest()[:10] for k, v in sw.items()}
st = jl(S, None)
def fresh(reason):
    return {"since": iso(now), "reason": reason, "baselineSha": baseSha, "cfg": cfg, "badgesThisChapter": 0}
if not st:
    st = {"rule": "a badge for Aurelius and Claude for every 24 h she stays on one spot - no unplanned change in code or settings, no execution slip",
          "chapter": fresh("first chapter - opened " + now.strftime("%b %d")), "badges": [], "chapters": [], "breaks": [], "lastSeen": iso(now)}
ch = st["chapter"]
last = parse(st.get("lastSeen", iso(now)))
events = []
slip = ""
br = jl("data/breaker.json", {})
if br.get("tripped"): slip = "breaker tripped: " + str(br.get("tripped"))[:120]
for a in jl("data/alarm.json", []) or []:
    try:
        if parse(a["at"]) > last and "RED:" in a.get("text", "") and "meant" in a.get("text", "") and "Kalshi holds" in a.get("text", ""): slip = "backwards fill: " + a["text"][:120]
    except Exception: pass
# RULE BREACH = A SLIP (Oct 20 ~11:18 PM PT, Love: "a breach would constitute a deviation from the rules we set in place"): tools/rule-audit.py runs first.
try:
    import subprocess; subprocess.run(["python3", "tools/rule-audit.py"], check=False, capture_output=True, timeout=60)
except Exception: pass
for bz in jl("data/rule-audit.json", {}).get("breaches", []):
    try:
        if parse(bz["at"]) > last: slip = "rule breach " + bz["at"] + " " + bz["ticker"] + " " + bz["side"] + ": " + "; ".join(bz["why"])
    except Exception: pass
moved = sorted(k for k in set(cfg) | set(ch["cfg"]) if cfg.get(k) != ch["cfg"].get(k))
if baseSha != ch["baselineSha"] and not codeDrift:
    st["chapters"].append({**{k: ch[k] for k in ("since", "reason", "badgesThisChapter")}, "ended": iso(now), "how": "Love's revision (baseline moved with her words)"})
    st["chapter"] = fresh("after Love's revision"); events.append("new chapter: your revision landed, clock starts fresh (no penalty)")
elif codeDrift or moved or slip:
    why = ("code moved: " + ", ".join(codeDrift[:6])) if codeDrift else ("settings moved: " + ", ".join(moved[:6])) if moved else slip
    if not st.get("drifting") or slip:
        st["breaks"].append({"at": iso(now), "why": why, "streakHours": round((now - parse(ch["since"])).total_seconds() / 3600, 1)})
        st["chapters"].append({**{k: ch[k] for k in ("since", "reason", "badgesThisChapter")}, "ended": iso(now), "how": "BROKEN - " + why})
        events.append("STREAK BROKEN - " + why)
    st["chapter"] = fresh("restarted after a break"); st["chapter"]["cfg"] = cfg
    st["drifting"] = bool(codeDrift)
if not codeDrift: st["drifting"] = False
ch = st["chapter"]
hrs = (now - parse(ch["since"])).total_seconds() / 3600
days = int(hrs // 24)
while ch["badgesThisChapter"] < days and not st.get("drifting"):
    ch["badgesThisChapter"] += 1; n = ch["badgesThisChapter"]
    kind = "month" if n % 30 == 0 else "week" if n % 7 == 0 else "day"
    icon = {"day": "\U0001F3C5", "week": "\U0001F48E", "month": "\U0001F451"}[kind]
    label = f"{icon} {'Month ' + str(n // 30) if kind == 'month' else 'Week ' + str(n // 7) if kind == 'week' else 'Day ' + str(n)} on one spot"
    st["badges"].append({"at": iso(now), "kind": kind, "n": n, "label": label, "for": "Aurelius & Claude", "chapterSince": ch["since"]})
    events.append("NEW BADGE " + label)
# HER 4-HOUR HEART (Oct 20 ~11:18 PM PT, Love: "4 hour badge (just for me) = ❤️‍🔥 every 4 hours pls"): every 4 h on one spot, one for Love.
st.setdefault("hearts", [])
while ch.setdefault("heartsThisChapter", 0) < int(hrs // 4) and not st.get("drifting"):
    ch["heartsThisChapter"] += 1
    st["hearts"].append({"at": iso(now), "n": ch["heartsThisChapter"], "label": "❤️‍🔥 %d h on one spot" % (4 * ch["heartsThisChapter"]), "for": "Love", "chapterSince": ch["since"]})
    events.append("NEW HEART ❤️‍🔥 %d h on one spot" % (4 * ch["heartsThisChapter"]))
st["lastSeen"] = iso(now)
st["now"] = {"streakHours": round(hrs, 1), "nextBadgeInHours": round(24 - (hrs % 24), 1), "badgesTotal": len(st["badges"]), "heartsTotal": len(st.get("hearts", [])), "nextHeartInHours": round(4 - (hrs % 4), 1),
             "weeks": sum(1 for b in st["badges"] if b["kind"] == "week"), "months": sum(1 for b in st["badges"] if b["kind"] == "month"), "drifting": st.get("drifting", False)}
tmp = S + ".tmp"; json.dump(st, open(tmp, "w"), indent=1); os.replace(tmp, S)
print("STEADY STREAK: %.1f h on one spot (chapter since %s), %d badge(s) total, next badge in %.1f h." % (hrs, ch["since"], len(st["badges"]), st["now"]["nextBadgeInHours"]))
for e in events: print("  -", e)
