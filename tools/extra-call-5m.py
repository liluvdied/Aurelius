#!/usr/bin/env python3
# RECORD ONLY - 5M TRADES FROM MAIN'S EXTRA CALLS (Oct 27 2026 2:25 PM PT, Love: "yesss pls that's perfect , track and log those and we'll see if it's a problem
# or a proud one :)"). Since fix336 (free to trade), main can make a 2nd/3rd call in a window; the 5M lane that copies main's BTC calls can pick those up
# (rows ending :n2, :n3 ...) and its 5m swings can follow them. This changes NOTHING in her - it only reads her logs and writes:
#   HISTORY/EXTRA-CALL-5M.md   every such 5M attempt, what happened, and the running score (wins, losses, $ net) vs the rest of that lane
# Usage: python3 tools/extra-call-5m.py
import json, re, os, collections
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
SINCE = "2026-10-27T20:13"  # fix336 went in
def jl(p):
    try:
        for l in open(p, encoding="utf8", errors="replace"):
            try: yield json.loads(l)
            except Exception: pass
    except FileNotFoundError: return
extra_at = {}  # ticker -> first time main booked an extra call there
try:
    d = json.load(open("data/live-book-done.json", encoding="utf8"))
    for k, v in d.items():
        m = re.match(r"^(KXBTC[^:]+):recon-tog:.*:n(\d+)$", k)
        if m and v.get("at", "") >= SINCE: extra_at[m.group(1)] = min(extra_at.get(m.group(1), "9"), v.get("at", "9"))
except Exception: pass
for e in jl("data/poly-twin-log.jsonl"):
    m = re.match(r"^(KXBTC[^:]+):recon-tog:.*:n\d+:5m$", str(e.get("id", "")))
    if m and e.get("at", "") >= SINCE: extra_at[m.group(1)] = min(extra_at.get(m.group(1), "9"), e["at"])
swing_at = {s["id"]: s["at"] for s in jl("data/swing5.jsonl") if s.get("book") == "recon-tog"}
last = collections.OrderedDict()
for e in jl("data/poly-twin-log.jsonl"):
    i = str(e.get("id", ""))
    if e.get("at", "") < SINCE or ":recon-tog:" not in i or not i.endswith(":5m"): continue
    last[i] = e
rows, tot = [], {"extra": [0, 0, 0.0], "rest": [0, 0, 0.0]}
for i, e in last.items():
    tk = i.split(":")[0]; kind = None
    if re.search(r":n\d+:5m$", i): kind = "main's extra call itself"
    else:
        sid = i[:-3]
        if sid in swing_at and tk in extra_at and swing_at[sid] >= extra_at[tk]: kind = "5m swing after main's extra call"
    pnl = e.get("pnl") if e.get("status") == "settled" else None
    b = "extra" if kind else "rest"
    if pnl is not None: tot[b][0] += pnl > 0; tot[b][1] += pnl < 0; tot[b][2] += pnl
    if kind: rows.append((e.get("at"), tk, kind, e.get("status"), pnl, e.get("reason") or e.get("how") or ""))
o = ["# 5M trades from main's extra calls (record only)", "", "Love Oct 27 2:25 PM PT: \"track and log those and we'll see if it's a problem or a proud one :)\"", "",
     f"From main's extra calls: {tot['extra'][0]}W {tot['extra'][1]}L, ${tot['extra'][2]:+.2f}  |  rest of that 5M lane: {tot['rest'][0]}W {tot['rest'][1]}L, ${tot['rest'][2]:+.2f}  (since fix336, Oct 27 1:13 PM PT)", "",
     "| when (UTC) | window | kind | what happened | $ | why |", "|---|---|---|---|---|---|"]
for r in sorted(rows): o.append(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {'' if r[4] is None else f'{r[4]:+.2f}'} | {str(r[5])[:90]} |")
os.makedirs("HISTORY", exist_ok=True); open("HISTORY/EXTRA-CALL-5M.md", "w", encoding="utf8").write("\n".join(o) + "\n")
print(o[4]); print(len(rows), "attempts logged -> HISTORY/EXTRA-CALL-5M.md")
