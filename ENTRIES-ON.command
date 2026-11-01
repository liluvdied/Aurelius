#!/bin/bash
# ONE click (Love Oct 29 2026 7:42 PM PT: "WHERE ??????" - the entries button). Does exactly what the desk's entries button does when you turn it ON
# (fns.ts setEntries): her new entries back on, her pace counter fresh. Her breaker paused entries at 7:26 PM; her model is approved again. Nothing else changes.
cd "$(dirname "$0")"
echo ""; echo "=== Turn her entries back on ==="; echo ""
python3 -c "import json;b=json.load(open('data/breaker.json'));print('  her model approved: ' + ('YES' if b.get('modelOk') else 'NO - tell Claude'))"
read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; read -n 1 -s -r -p "Press any key to close."; exit 1; }
python3 - <<'PY'
import json, os, datetime
at = datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")
def wj(p, o): t = p + ".tmp"; open(t, "w").write(json.dumps(o)); os.replace(t, p)
wj("data/halt.json", {"off": False, "at": at, "since": at, "reason": "", "losses": []})
try: eq = json.load(open("data/kalshi-cash.json")).get("cash")
except Exception: eq = None
wj("data/pace.json", {"from": at, "at": at, "paused": False, "wins": 0, "n": 0, "net": 0, "equity": eq, "peak": eq})
open("data/overnight-fixes.log", "a").write(f"{at} ENTRIES ON (Love, ENTRIES-ON.command) - same as her entries button\n")
PY
sleep 6
python3 -c "import json;h=json.load(open('data/halt.json'));b=json.load(open('data/breaker.json'));print('');print('  ENTRIES: ' + ('ON ✓ - she can take trades' if h.get('off') is False else 'still OFF - tell Claude'));print('  BREAKER: ' + ('clear' if not b.get('entriesOff') else 'still holding - tell Claude'))"
echo ""; read -n 1 -s -r -p "Press any key to close."
