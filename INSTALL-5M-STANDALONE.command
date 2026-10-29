#!/bin/bash
# Double-click to install fix456 - the walled-off 5M (R169/R172/R173/R174/R175, Love Oct 29 2026: "please create a SEPARATE BOOK FOR THAT MODEL ... WALLED OFF. PLEASE.").
cd "$(dirname "$0")"
echo ""; echo "=== Installing the walled-off 5M (fix456) - Polymarket BTC 5m only ==="
echo "  1. Her own book, from her exact Oct 27 4:57 AM PT copy (the 79% one): her read, her walls, her 5m lane, her exits - in her OWN files."
echo "  2. Door 1: a finished 1m, 2m, 3m, 4m or 5m candle closed her way since her call - no 4-minute rule; she keeps trying until 3:00 is left."
echo "     Door 2 (2m/3m flips) and door 3 (late door, 3:00 to 2:30 left, 60-70c) stay exactly as Oct 27."
echo "  3. \$5, BTC 5m, off 3, 4, 5 AM, 1 PM, 9 PM and 11 PM PT (your answer B). The old 5M lane switches off while she is on - one 5M book, hers."
echo "  4. THE WALL: no other book's code can reach her; any change to her files is refused unless you name the 5M in your own words."
echo "  Kalshi books, the delayed book, the copies: untouched."; echo ""
U0=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
python3 -I data/STAGED-five5m/install5m.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/five5m-wall.py
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120
python3 tools/umpire.py 2>&1 | grep -E "^SAFE .*(test|wall)" | cut -c1-150
U1=$(python3 tools/umpire.py 2>&1 | grep -c "✗\|^OUT")
if [ "$U1" -le "$U0" ]; then echo "UMPIRE: nothing new broken by the 5M ✓ ($U1 older open items from the Oct 28 restore list still waiting on your restore decisions - same as before the click)"; else echo "UMPIRE: something new is OUT ($U0 -> $U1) - tell Claude"; fi
echo ""; echo ">>> DONE. Her walled-off 5M is IN. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
