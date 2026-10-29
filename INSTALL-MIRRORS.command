#!/bin/bash
# Double-click to install fix467 (R213/R214, Love Oct 29 2026 1:40 PM PT: "bollinger over pink NEEDS A LONG MIRROR. ASSUME EVERY FUCKING BAND TOLERANCEWORKS BOTH WAYS").
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix467 - THE MIRRORS, EVERY BOOK EXCEPT THE DELAYED BOOK (the 5M has its own command) ==="
echo "  1. NO LONGS IN THE TOP RUNG: no BTC long over the session +2σ (the mirror of no shorts under the -2σ)."
echo "  2. BOLLINGER OVER PINK, LONG SIDE: no long breaking the pink UP when the Bollinger upper sits within \$100 above it (the mirror of the short rule)."
echo "  3. BTC GREEN/RED ZONES at 55% BOTH SIDES on every book but delayed: no short in the bottom 55% of green -> pink, no long in the top 55% of pink -> red (door, copier, wire)."
echo "  4. The BTC pink-rejection re-aim sticks BOTH WAYS on main + rejection (re-aim to a short AND its mirror, re-aim to a long)."
echo "  5. The delayed book's paper rows and thirds keep its own shares (closes a leak from the last install)."
echo "  The umpire checks the new code first; it lands AT the next quarter-hour."; echo ""
python3 -I data/STAGED-fix467/install467.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120; python3 tools/five5m-wall.py | tail -1 | cut -c1-90
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓ - no pause' if v.get('ok') else 'NOT SAFE: ' + str(v.get('why'))[:200])"
node tools/check-her-rules.cjs --no5m
echo ""; echo ">>> DONE. Every band tolerance both ways on every book but the delayed book - IN. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
