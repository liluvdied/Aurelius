#!/bin/bash
# Double-click to install fix454 (Love Oct 29 2026 9:57 AM PT: "3pm - GOES TO Main (w pink, bollingers, red green zones only , same for gold"): the 3 PM rule takes pink too,
# for whichever book holds 3 PM (BTC main, gold rejection). Saves her first, no-removal gate, installs at 10:30 AM (or the next quarter hour after), checks her.
cd "$(dirname "$0")"
echo ""; echo "=== Installing: 3 PM adds pink + main holds BTC 3 PM (fix454) ==="; echo ""
python3 -I data/STAGED-fix454/install454.py data/STAGED-fix454; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/cornerstones.py | tail -1
python3 tools/umpire.py 2>&1 | grep -E "^(SAFE|OUT)" | grep -E "test|gate|GOLDEN|SEAL|CORNER" | cut -c1-160
echo ""; echo ">>> DONE. The 3 PM update is in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
