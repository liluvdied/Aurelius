#!/bin/bash
# Double-click to install fix450 (Love Oct 29 2026 9:02 AM PT: "she just longed btc closer to the red than the pink ... we need to nip that in the bud right now"): BTC on main + rejection
# gets the 55% pink->red / green->pink rule like gold. Saves her first, no-removal gate, waits for the next quarter hour, installs, checks her.
cd "$(dirname "$0")"
echo ""; echo "=== Installing: BTC gets your 55% like gold (fix450) ==="; echo ""
python3 -I data/STAGED-fix450/install450.py data/STAGED-fix450; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/cornerstones.py | tail -1
python3 tools/umpire.py 2>&1 | grep -E "^(SAFE|OUT)" | grep -E "test|gate|GOLDEN|SEAL|CORNER" | cut -c1-160
echo ""; echo ">>> DONE. BTC 55% is in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
