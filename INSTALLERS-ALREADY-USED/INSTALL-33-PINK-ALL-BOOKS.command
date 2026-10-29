#!/bin/bash
# Double-click to install fix465 (R206-R211, Love Oct 29 2026 1:22-1:26 PM PT: "both sides. not just longs. not just shorts. pink as well. both sides. all books. aside from delayed.").
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix465 - EVERY BOOK EXCEPT THE DELAYED BOOK (the 5M has its own command) ==="
echo "  1. A HARD 33% thirds share at every channel width - no long in the top 33%, no short in the bottom 33% - for every book but the delayed book."
echo "  2. Every other book (the copies) meets the same pink walls as main + rejection, BOTH SIDES: 15% gold / 20% BTC, never into an unbroken pink."
echo "  3. Every other book's READ meets your 33% and the pink too."
echo "  The delayed book keeps its own shares byte for byte. The umpire checks the new code first; it lands AT the next quarter-hour."; echo ""
python3 -I data/STAGED-fix465/install465.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120; python3 tools/five5m-wall.py | tail -1 | cut -c1-90
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓ - no pause' if v.get('ok') else 'NOT SAFE: ' + str(v.get('why'))[:200])"
node tools/check-her-rules.cjs --no5m
echo ""; echo ">>> DONE. Hard 33% + pink both sides on every book but the delayed book - IN. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
