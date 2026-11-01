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
echo ""
echo "=================================================================="
echo "  Done. Turn LIVE back ON in the desk header whenever you're ready."
echo "=================================================================="
pause 0
