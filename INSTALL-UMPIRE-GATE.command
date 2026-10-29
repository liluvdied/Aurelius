#!/bin/bash
# Double-click to install fix461 - THE UMPIRE AT THE WIRE (R185/R186/R187/R189, Love Oct 29 2026 11:46 AM PT: "can you make sure the umpire not only checks if the code is there, but
# THAT ITS ENFORCED.??? meaning, if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out ?" + "just main and rejection for rn hun" + "without making the orders lag").
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix461 - THE UMPIRE AT THE WIRE - main + rejection only ==="
echo "  1. Every OPENING order of main and rejection needs the umpire's SAFE stamp on the exact code running right now - or it does not go out."
echo "     It says why, in plain words: \"THE UMPIRE says NOT SAFE (...)\" or \"CODE CHANGED SINCE THE UMPIRE SAID SAFE (...)\"."
echo "  2. ZERO LAG: the umpire runs in the background (desk start + ~3 s after any code change, ~20 s a run); an order only reads the stamp in memory (~7 microseconds)."
echo "  3. EXITS, TAKE-PROFITS AND CLOSES ARE NEVER BLOCKED by this."
echo "  4. SAFE = every behaviour test, cornerstones, golden, the seal, the no-removal gate, the 5M wall. The 46 old restore-list items stay a report (option A)."
echo "  Lands 1 minute before the next quarter-hour so the first check finishes before the next window. Delayed book, copies, 5M: untouched."; echo ""
python3 -I data/STAGED-fix461/install461.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120; python3 tools/five5m-wall.py | tail -1 | cut -c1-90
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓ - main + rejection can trade' if v.get('ok') else 'NOT SAFE - main + rejection opening orders are held: ' + str(v.get('why'))[:200])"
echo ""; echo ">>> DONE. The umpire now has the final say on every main + rejection trade. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
