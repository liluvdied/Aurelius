#!/bin/bash
# Double-click to install fix459 (R176, Love Oct 29 2026 11:12-11:18 AM PT: "she is only not allowed to long into pink at 15% of the channel width, band to band. / not all distances,
# period." + "15% just for gold rn hun. 20% for btc" + "both books pls"). Saves her first, no-removal gate, installs at the next quarter hour (:00/:15/:30/:45), checks her.
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix459 - main + rejection, gold + BTC (not the delayed book, the copies or the 5M) ==="
echo "  1. The unbroken pink holds a LONG only when it is within 15% (gold) / 20% (BTC) of the session-band channel, band to band."
echo "     (\"never long under an unbroken pink\" fix432, and the pink reach fix429/430 - which keeps its \$1 gold / \$50 BTC floor)"
echo "  2. Farther than that, the pink lets her go - every other wall still judges her."
echo "  3. UNCHANGED: the downslope pink rule (no entries til pink breaks by 25c gold / \$8 BTC), the 25c / \$8 pink break, the 5M."; echo ""
U0=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
python3 -I data/STAGED-fix459/install459.py data/STAGED-fix459; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120
python3 tools/umpire.py 2>&1 | grep -E "^SAFE .*test" | cut -c1-150
U1=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
if [ "$U1" -le "$U0" ]; then echo "UMPIRE: nothing new broken by fix459 ✓ ($U1 older open items from the Oct 28 restore list are still waiting on your restore decisions - same as before the click)"; else echo "UMPIRE: fix459 broke something ($U0 -> $U1 problems) - tell Claude"; fi
echo ""; echo ">>> DONE. fix459 (pink 15% gold / 20% BTC) is IN. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
