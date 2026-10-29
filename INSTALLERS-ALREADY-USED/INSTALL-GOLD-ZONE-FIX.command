#!/bin/bash
# Double-click to install fix448 (Love Oct 28 2026 10:56 PM PT: "yes please fix that and add the log pls"): the rejection model takes the green/red zone rejection her
# twin sees when her own read is empty, every wall still judging; plus a log-only notebook of her gold reads. Saves her first, gate, waits for the next quarter hour.
cd "$(dirname "$0")"
echo ""; echo "=== Installing: the gold zone-rejection fix + gold read log (fix448) ==="; echo ""
python3 -I data/STAGED-fix448/install448.py data/STAGED-fix448; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/cornerstones.py | tail -1
python3 tools/umpire.py 2>&1 | grep -E "^(SAFE|OUT)" | grep -E "test|gate|GOLDEN|SEAL|CORNER" | cut -c1-160
echo ""; echo ">>> DONE. The gold fix and log are in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
