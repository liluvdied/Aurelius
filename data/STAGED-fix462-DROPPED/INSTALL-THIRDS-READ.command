#!/bin/bash
# Double-click to install fix462 (R190, Love Oct 29 2026 12:36 PM PT: "the candle did flip red, on the5M hun. she didn't short the rejection / please trace the long signal because that is
# entirely false. there is a session band directly above her."). Saves her first, gate, the umpire checks the new code on a copy, lands AT the next quarter-hour with no pause.
cd "$(dirname "$0")/../.."
echo ""; echo "=== Installing fix462 - main + rejection ==="
echo "  1. Her read never calls a LONG in the top 33% (or a SHORT in the bottom 33%) of the session-band channel - no more long under a session band above her."
echo "  2. When a REAL read of the same side comes (like the 12:31 PM 'Rejected down off -1σ' short), it replaces a flipped label - so the real trade goes, every wall still judging it."
echo "  3. Flipped calls themselves stay refused (fix442). The 5M, the delayed book and the copies: untouched."; echo ""
python3 -I data/STAGED-fix462/install462.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120; python3 tools/five5m-wall.py | tail -1 | cut -c1-90
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓ - no pause, main + rejection trade on' if v.get('ok') else 'NOT SAFE: ' + str(v.get('why'))[:200])"
echo ""; echo ">>> DONE. fix462 is IN and stays in. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
