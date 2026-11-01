#!/bin/bash
# Double-click me. Read only: are the guards themselves untouched, and has nothing recorded in exit-log / win-pings been lost?
cd "$(dirname "$0")"
echo ""; echo "=== Are her guards and her memory intact? ==="; echo ""
python3 tools/cornerstone-manifest.py check; m=$?
echo ""; python3 tools/state-guard.py; s=$?
echo ""
if [ $m -eq 0 ] && [ $s -eq 0 ]; then echo ">>> ALL GOOD. Guards sealed, nothing lost. <<<"; else echo ">>> SOMETHING CHANGED. Nothing should change until you've looked. <<<"; fi
echo ""; read -n 1 -s -r -p "Press any key to close."
