#!/bin/bash
# Double-click to install fix455 (Love Oct 29 2026 10:17 AM PT: "we can double up on 8pm hun , $10 initial entry and $5 initial add on - $5 secondary add on at the next band"):
# BTC 8 PM rejection model on Kalshi: $10 entry, $5 add-on, second $5 add-on on a flip at another band. Polymarket untouched. Saves her first, gate, installs at 10:45 AM or later.
cd "$(dirname "$0")"
echo ""; echo "=== Installing: BTC 8 PM double-up (fix455) ==="; echo ""
python3 -I data/STAGED-fix455/install455.py data/STAGED-fix455; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/cornerstones.py | tail -1
python3 tools/umpire.py 2>&1 | grep -E "^(SAFE|OUT)" | grep -E "test|gate|GOLDEN|SEAL|CORNER" | cut -c1-160
echo ""; echo ">>> DONE. 8 PM BTC double-up is in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
