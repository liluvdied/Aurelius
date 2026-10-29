#!/bin/bash
# Double-click to install fix457 (R170, Love Oct 29 2026 10:42 AM PT: "yes. if a band broke downwards it is only a short ... A WICK THRU WITH PRICE ON THE OTHER SIDE OF THE BAND IS NOT AN ENTRY
# ... count the 33% correctly"). Saves her first, no-removal gate, installs at the next quarter hour, checks her.
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix457 - main + rejection, gold + BTC (not the 5M) ==="
echo "  1. A band that broke DOWN this 5m candle = only a SHORT this candle (broke UP = only a LONG)."
echo "  2. A wick through with price back on the other side of the band = NOT an entry."
echo "  3. Her 33% counted right: a band broken against her this candle is still IN FRONT of her."
echo "  (A long with an unbroken session band just above / short with one just below stays refused by her \$1 reach wall, fix429.)"; echo ""
U0=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
python3 -I data/STAGED-fix457/install457.py data/STAGED-fix457; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120
python3 tools/umpire.py 2>&1 | grep -E "^SAFE .*test" | cut -c1-150
U1=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
if [ "$U1" -le "$U0" ]; then echo "UMPIRE: nothing new broken by fix457 ✓ ($U1 older open items from the Oct 28 restore list are still waiting on your restore decisions - same as before the click)"; else echo "UMPIRE: fix457 broke something ($U0 -> $U1 problems) - tell Claude"; fi
echo ""; echo ">>> DONE. fix457 is IN. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
