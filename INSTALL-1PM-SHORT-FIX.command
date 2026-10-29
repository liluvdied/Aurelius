#!/bin/bash
# Double-click to install fix464 (R196-R205, Love Oct 29 2026 1:05-1:15 PM PT: "i told you 100 times it's for both sides. do what i say." + "PLACE THE FUCKING BAND TOLERANCES ON MAIN AND
# REJECTIONS" + "double check that every rule and cornerstone works on both sides, for main and rejection. DO NOT TOUCH 5M. DO NOT TOUCH ANYTHING ELSE."). Main + rejection only.
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix464 - main + rejection, BOTH SIDES (5M, add-ons, sizes, hours: untouched) ==="
echo "  1. Never SHORT into an unbroken pink within 15% gold / 20% BTC (the mirror of the long rule) - until it breaks down by 25c / \$8."
echo "  2. The UPSLOPE pink: price climbing over an unbroken pink = no short until it breaks down by 25c / \$8 (mirror of your downslope rule). Stops 1:02 + 1:15 PM."
echo "  3. Your 33% for the candle's launch (rising from the bottom 33% = a long, never a short; mirror for longs). Stops 1:02 PM."
echo "  4. In the READ: every read main/rejection books meets your thirds, the pink both sides and every band tolerance first."
echo "  The umpire checks the new code first, then it lands AT the next quarter-hour - no pause. Then CHECK-HER-RULES runs on her live code."; echo ""
python3 -I data/STAGED-fix464/install464.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120; python3 tools/five5m-wall.py | tail -1 | cut -c1-90
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓ - main + rejection trade on, no pause' if v.get('ok') else 'NOT SAFE: ' + str(v.get('why'))[:200])"
node tools/check-her-rules.cjs
echo ""; echo ">>> DONE. Both sides, main + rejection - IN and staying in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
