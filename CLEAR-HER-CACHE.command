#!/bin/bash
# STANDING (Love Oct 30 2026 4:59 PM PT: "her cache needs to be cleared again... drop me a command here for that that i can
# continue to use at any time so i can do it myself if need be pls"). Runs her own cache rule (fix343/370/495) RIGHT NOW:
# finished never-filled rows older than 3.5 h and filled rows older than a day move into the archive. Nothing is ever deleted.
cd "$(dirname "$0")"
pause() { echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
live() { python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')"; }
echo ""
echo "=== Clear her cache (your standing click - run any time) ==="
echo ""
python3 - <<'PY'
import json, datetime
d = json.load(open("data/live-book-done.json"))
now = datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000
a = b = keep = 0
for k, v in d.items():
    try: t = datetime.datetime.fromisoformat(str(v.get("at")).replace("Z", "+00:00")).timestamp() * 1000
    except: keep += 1; continue
    if v.get("final") is True and v.get("status") not in ("filled", "partial") and t < now - 3.5 * 3600000: a += 1
    elif v.get("status") == "filled" and t < now - 24 * 3600000: b += 1
    else: keep += 1
print(f"  In her cache now: {len(d)} rows. Ready to file away: {a} old never-filled + {b} filled older than a day. {keep} stay (she still reads them).")
PY
if [ "$(live)" = "ON" ]; then
  echo ""
  echo "Step 1: turn LIVE OFF in the desk header (so the sweep and her book never write at the same moment)."
  while [ "$(live)" = "ON" ]; do read -r -p "        Press Enter once LIVE is off... " _; done
  echo "  OK - LIVE is off"
fi
echo ""; read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; pause 1; }
python3 - <<'PY'
import json, datetime, os
p = "data/live-book-done.json"
d = json.load(open(p))
now = datetime.datetime.now(datetime.timezone.utc)
cut35 = now.timestamp() * 1000 - 3.5 * 3600000
cut24 = now.timestamp() * 1000 - 24 * 3600000
keep, lines, moved = {}, "", 0
for k, v in d.items():
    try: t = datetime.datetime.fromisoformat(str(v.get("at")).replace("Z", "+00:00")).timestamp() * 1000
    except: keep[k] = v; continue
    row = None
    if v.get("final") is True and v.get("status") not in ("filled", "partial") and t < cut35: row = v
    elif v.get("status") == "filled" and t < cut24: row = v
    if row is not None:
        lines += json.dumps({"key": k, **v, "archivedAt": now.isoformat(), "archivedBy": "CLEAR-HER-CACHE.command (Love, by hand)"}) + "\n"; moved += 1
    else: keep[k] = v
if lines:
    with open("data/live-book-done-archive.jsonl", "a") as f: f.write(lines)
tmp = p + ".tmp"
json.dump(keep, open(tmp, "w"), indent=1); os.replace(tmp, p)
print(f"  OK {moved} rows filed into the archive (kept forever). {len(keep)} rows stay in her cache.")
with open("data/overnight-fixes.log", "a") as f:
    f.write(f"{now.strftime('%Y-%m-%dT%H:%M:%SZ')} CACHE CLEARED BY HAND (Love, CLEAR-HER-CACHE.command): {moved} rows to the archive, {len(keep)} stay\n")
PY
# fix1105 (Love Nov 13 2026 11:35 PM PT: "what we did to fix that, i want to load that sequence into the standing command" + 11:47 PM PT: "yes , i mean the full sequence
# we just ran to make the execution that fast again"): after her cache, this click asks her to run her WHOLE hourly clear herself, right now: her cache, her card files
# (settled rows older than a day), her paper book (closed trades older than 4 days). All archived, nothing deleted. She does it herself, the same lines her hourly clear runs.
echo ""
echo "Step 2: asking her to run her full hourly clear now (her cache, her card files, her paper book)..."
python3 - <<'PY'
import json, time, datetime, os
start = datetime.datetime.now(datetime.timezone.utc)
open("data/clear-now-1105.flag", "w").write(start.isoformat())
done = False; rows = []
for _ in range(100):
    time.sleep(1)
    rows = []
    try:
        for l in open("data/auto-clear.jsonl").read().splitlines()[-40:]:
            try: r = json.loads(l)
            except Exception: continue
            try: t = datetime.datetime.fromisoformat(str(r.get("at")).replace("Z", "+00:00"))
            except Exception: continue
            if t >= start - datetime.timedelta(seconds=1): rows.append(r)
    except Exception: pass
    if any(str(r.get("by", "")).startswith("fix1105") for r in rows): done = True; break
if done:
    moved = [r for r in rows if "moved" in r]
    for r in moved: print(f"  OK {r.get('file', 'her cache (live-book-done.json)')}: {r.get('moved')} rows to the archive, {r.get('kept')} stay")
    if not moved: print("  OK she ran it: nothing was old enough to file away this time.")
    print("  OK her full hourly clear ran just now (written in data/auto-clear.jsonl).")
else:
    took = not os.path.exists("data/clear-now-1105.flag")
    print("  She took the ask but has not written her proof line yet. Look at data/auto-clear.jsonl in a minute." if took else "  She did not answer in 100 seconds (is her desk running?). The ask stays waiting and she runs it the moment she is up. Her hourly clear runs the same thing every hour.")
PY
echo ""
echo "=================================================================="
echo "  Done. Turn LIVE back ON in the desk header whenever you're ready."
echo "=================================================================="
pause 0
