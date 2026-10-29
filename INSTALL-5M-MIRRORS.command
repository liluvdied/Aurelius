#!/bin/bash
# Double-click to install fix468 (R213/R215/R216, Love Oct 29 2026 1:40 PM PT: "ASSUME EVERY FUCKING BAND TOLERANCEWORKS BOTH WAYS" + 11:23 AM "hard set tolerances for all models" + 1:23 PM "including 5M").
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix468 - THE 5M MIRRORS (her own files only - she stays walled off) ==="
echo "  1. NO LONGS IN THE TOP RUNG: no BTC long over the session +2σ (she already has no shorts under the -2σ)."
echo "  2. BOLLINGER OVER PINK, LONG SIDE: no long breaking the pink UP with the Bollinger upper within \$100 above (she already skips the short side)."
echo "  3. BTC GREEN/RED ZONES at 55% BOTH SIDES, same as main: no short in the bottom 55% of green -> pink, no long in the top 55% of pink -> red."
echo "  NOT included: the pink re-aim (fix373) - that is a re-aim lock, not a tolerance, so it stays off the 5M."
echo "  Her 5M wall is refrozen on your words (R215). Click this AFTER INSTALL-5M-33-PINK says DONE (it refuses until that one has landed)."; echo ""
python3 -I data/STAGED-fix468/install468.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/five5m-wall.py | tail -1 | cut -c1-120; python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓' if v.get('ok') else 'NOT SAFE: ' + str(v.get('why'))[:200])"
node tools/check-her-rules.cjs
echo ""; echo ">>> DONE. The 5M: every band tolerance both ways - IN, still walled off. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
