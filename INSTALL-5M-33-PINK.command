#!/bin/bash
# Double-click to install fix466 (R208-R212, Love Oct 29 2026 1:23 PM PT: "including 5M. i'm assuming that's why she's losing so much now." + 1:24 PM "both sides ... pink as well ... all books").
cd "$(dirname "$0")"
echo ""; echo "=== Installing fix466 - THE 5M (her own files only - she stays walled off) ==="
echo "  1. A HARD 33% thirds share at every width - her walls AND her read (her old 20% / 15% shares retired)."
echo "  2. The pink BOTH SIDES at her door: 15% gold / 20% BTC, never into an unbroken pink (long under / short over), 25c / \$8 break."
echo "  3. Your 33% for the candle's launch at her door."
echo "  4. The downslope AND upslope pink holds on her buys - no long while BTC slides under an unbroken pink, no short while it climbs over one, until it breaks by \$8."
echo "  Her 5M wall is refrozen on your words (R208). Click this AFTER INSTALL-33-PINK-ALL-BOOKS says DONE (it refuses while that one is waiting)."; echo ""
python3 -I data/STAGED-fix466/install466.py; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo ""; echo "=== Checking her ==="
python3 tools/five5m-wall.py | tail -1 | cut -c1-120; python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/no-removal-gate.py | tail -1 | cut -c1-120
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE STAMP:', 'SAFE ✓' if v.get('ok') else 'NOT SAFE: ' + str(v.get('why'))[:200])"
node tools/check-her-rules.cjs
echo ""; echo ">>> DONE. The 5M: hard 33% + pink both sides - IN, still walled off. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
