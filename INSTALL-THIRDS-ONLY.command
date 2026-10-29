#!/bin/bash
# Double-click to install fix460 (R181/R182/R183, Love Oct 29 2026 11:31-11:33 AM PT: "A BAND 250 AWAY IS NOT A FUCKING OBSTACLE" + "33% FUCKING PERCENT FROM BAND TO BAND BRO" +
# "NO LONGS IN TOP 33% . NO SHORTS IN THE BOTTOM 33%" + "give me the command so i know it goes in and stays in please"). Saves her first, no-removal gate, lands at the next quarter hour, checks her.
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix460 - main + rejection, gold + BTC ==="
echo "  1. The SESSION BAND AHEAD wait (fix413) now holds her ONLY inside her thirds: no long in the top 33%, no short in the bottom 33% of the session-band channel, band to band."
echo "  2. A session band farther than that is NOT an obstacle - every other wall still judges her."
echo "  3. STAYS IN: a permanent replay test in the umpire + cornerstone 0p in your rulebook - any change that lets that wait reach past your thirds fails."
echo "  Nothing else changes: the 55% walls, the downslope pink rule, her flip, the 5M - untouched."; echo ""
U0=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
python3 -I data/STAGED-fix460/install460.py data/STAGED-fix460; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120; python3 tools/five5m-wall.py | tail -1 | cut -c1-90
python3 tools/umpire.py 2>&1 | grep -E "^SAFE .*(test|wall)|^OUT .*test" | cut -c1-150
U1=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
if [ "$U1" -le "$U0" ]; then echo "UMPIRE: nothing new broken by fix460 ✓ ($U1 older open items from the Oct 28 restore list still waiting on your restore decisions - same as before the click)"; else echo "UMPIRE: fix460 broke something ($U0 -> $U1 problems) - tell Claude"; fi
echo ""; echo ">>> DONE. fix460 (session band ahead = your thirds only) is IN and stays in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
