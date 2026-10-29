#!/bin/bash
# Double-click to install fix452 (Love Oct 29 2026 9:42 AM PT: "3pm ✅ (bollingers, green/red zones only) (for btc and gold pls)"): at 3 PM PT the rejection model takes only
# Bollinger and green/red zone calls, gold + BTC. Saves her first, no-removal gate, installs at 10:00 AM (or the next quarter hour after), checks her.
cd "$(dirname "$0")"
echo ""; echo "=== Installing: 3 PM = bollingers and green/red zones only (fix452) ==="; echo ""
python3 -I data/STAGED-fix452/install452.py data/STAGED-fix452; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/cornerstones.py | tail -1
python3 tools/umpire.py 2>&1 | grep -E "^(SAFE|OUT)" | grep -E "test|gate|GOLDEN|SEAL|CORNER" | cut -c1-160
echo ""; echo ">>> DONE. The 3 PM rule is in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
