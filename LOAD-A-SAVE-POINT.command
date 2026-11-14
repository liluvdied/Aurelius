#!/bin/bash
# LOAD A SAVE POINT (Love Nov 10 2026: "i need to diagnose why my models are not loading from savepoints").
# Puts her back to a save point TAG - code and every setting that save holds - then PROVES it, file by file, and tells you out loud if anything refused.
# Kept as they are now: LIVE on/off, your request book, exit log, win pings, positions, fills, histories, logs. Nothing is deleted (moved aside instead).
# Her whole self is saved first, so you can always load your way back.
set -u
DESK="$(cd "$(dirname "$0")" && pwd)"
TOOL="$DESK/tools/whole-save-point.py"
cd "$DESK" || { echo "STOP: can't find your desk folder. Nothing changed."; read -r -p "Press return to close." _; exit 1; }
export AUR_ROOT="$DESK"
bye() { echo ""; read -r -p "Press return to close." _; exit "${1:-0}"; }
echo "================ LOAD A SAVE POINT · $(date '+%b %-d %-I:%M %p') ================"; echo ""
git fetch -q origin 'refs/tags/*:refs/tags/*' 2>/dev/null
python3 "$TOOL" list | head -25
echo ""; read -r -p "Type (or paste) the save point name to load (Enter = cancel): " TAG
[ -n "$TAG" ] || { echo "Nothing changed."; bye 1; }
echo ""; python3 "$TOOL" plan "$TAG" || { echo "Nothing changed."; bye 1; }
LIVE=$(python3 -c "import json;print(bool(json.load(open('data/live-switch.json')).get('live')))")
[ "$LIVE" = "True" ] && { echo ""; echo "STOP: LIVE is on. Turn LIVE off in the desk header, then double-click me again. Nothing changed."; bye 1; }
echo ""; read -r -p "Why, in your words (goes in your request book): " WHY
read -r -p "Type YES (capitals) to load $TAG: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; bye 1; }
echo ""; echo "Your Mac password, once:"; sudo -v || { echo "No password - nothing changed."; bye 1; }
( while true; do sudo -n true; sleep 30; kill -0 "$$" 2>/dev/null || exit; done ) 2>/dev/null & KEEP=$!; trap 'kill $KEEP 2>/dev/null' EXIT
echo ""; echo "1. Saving her whole self first..."
python3 "$TOOL" save "before-load-$TAG" || { echo "  !! The safety save did not finish - nothing changed."; bye 1; }
echo ""; echo "2. Stopping the desk so nothing writes old settings back over the load..."
pkill -f "Start Aurelius.command" 2>/dev/null; pkill -f "vite dev --host 127.0.0.1 --port 8080" 2>/dev/null; sleep 4
pkill -9 -f "vite dev --host 127.0.0.1 --port 8080" 2>/dev/null; sleep 1; echo "  desk stopped"
echo ""; echo "3. Lifting the lock..."
. tools/concrete.sh
concrete_scope | tr '\n' '\0' | sudo xargs -0 chflags noschg,nouchg 2>/dev/null
sudo chflags -R noschg,nouchg src tools scripts server pine migrations public 2>/dev/null; echo "  lock lifted"
REQ=$(python3 -c "import json,sys;print(json.dumps({'words': 'Love: \"' + sys.argv[1] + '\" (clicked LOAD-A-SAVE-POINT.command)', 'what': 'LOAD save point ' + sys.argv[2] + ': code + the settings it holds put back and proven file by file; LIVE on/off, request book, exit log, records kept', 'books': ['all'], 'proof': [{'process': 'data/LOADED-SAVE-POINT.json names ' + sys.argv[2]}]}))" "$WHY" "$TAG")
R=$(python3 tools/requests.py add "$REQ" | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "  !! Your words could not be recorded - locking again, nothing changed."; concrete_lock schg; bye 1; }
echo "  your words recorded as $R"
echo ""; echo "4. Loading $TAG..."
python3 "$TOOL" load "$TAG" "$R"; OK=$?
python3 tools/cornerstone-manifest.py check >/dev/null 2>&1 || python3 tools/cornerstone-manifest.py seal "$R" >/dev/null 2>&1
echo ""; echo "5. Writing it into her version list..."
git add -A -- src tools scripts server pine migrations public >/dev/null 2>&1; git add -u -- . ':!data' >/dev/null 2>&1
if OUT=$(git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "LOADED save point $TAG ($R)" 2>&1); then
  echo "  in her version list ✓ ($(git log -1 --format=%h))"
else
  echo "$OUT" | grep -q "nothing to commit" && echo "  her version list already matched" || { echo "  !! HER VERSION LIST REFUSED IT. This is what it said:"; echo "$OUT" | sed 's/^/     /'; echo "  (She IS loaded on disk - send this window to Claude.)"; OK=1; }
fi
concrete_lock schg >/dev/null 2>&1 && echo "  locked again"
echo ""; echo "6. Starting the desk..."; open -a Terminal "$DESK/Start Aurelius.command"
echo ""
[ "$OK" = "0" ] && echo ">>> DONE. She is $TAG, proven file by file. LIVE is off - turn it on in the desk when you're ready. <<<" \
               || echo ">>> NOT CLEAN - read the !! lines above and send Claude a photo of this window. Your before-load save is in the list. <<<"
bye "$OK"
