#!/bin/bash
# Double-click to install fix463 (R191/R192/R193/R194, Love Oct 29 2026 12:38-12:41 PM PT: "no flip. independent calls. she does not get one call per window. only once she has executed a
# trade." + "in the read itself. / not just the walls that go out please" + "please incorporate this into a command that way i know it sticks"). Main + rejection only.
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix463 - main + rejection, gold + BTC (the 5M, delayed book and copies untouched) ==="
echo "  1. HER THIRDS IN THE READ: her read never calls a long in the top 33% / a short in the bottom 33% of the session-band channel (the walls still check too)."
echo "  2. NO FLIPS: a flipped read ('seen as a short/long', a refused call turned over) is never her call."
echo "  3. INDEPENDENT CALLS: every fresh read stands on its own and goes to the walls - only an EXECUTED trade closes the window."
echo "  STAYS IN: a permanent replay test in the umpire + cornerstone 0r. The umpire checks the new code first, then it lands AT the next quarter-hour - no pause."; echo ""
python3 -I data/STAGED-fix463/install463.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120; python3 tools/five5m-wall.py | tail -1 | cut -c1-90; python3 tools/free-to-trade-test.py | tail -1 | cut -c1-120
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓ - main + rejection trade on, no pause' if v.get('ok') else 'NOT SAFE: ' + str(v.get('why'))[:200])"
python3 tools/umpire.py 2>&1 | grep -E "independent-calls-test-463" | cut -c1-150
echo ""; echo ">>> DONE. Independent calls, no flips, her thirds in the read - IN and staying in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
