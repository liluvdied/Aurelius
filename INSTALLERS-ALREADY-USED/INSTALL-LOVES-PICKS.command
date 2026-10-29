#!/bin/bash
# Double-click to install Love's approved picks (Love Oct 28 2026 9:02 PM PT: "can you give me the card bb?" - Love runs this herself).
# What it installs (main + rejection): pick 1 zone reads take her 2-5m flip, pick 2 slide-hold label, pick 7 flip 2-5m (no 1m), fix434 on her side of the break + her 33%,
# fix435 every order re-checks her walls at the wire and never goes out unchecked, fix439 the 55% wording. It saves her first, refuses if anything of hers would be
# taken out, waits for the next :00/:15/:30/:45, installs, then runs the umpire. Changes no settings.
cd "$(dirname "$0")"
echo ""; echo "=== Installing Love's picks ==="; echo ""
python3 -I data/STAGED-fix438/install438.py data/STAGED-fix438; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. (See the message above.) <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/cornerstones.py | tail -1
python3 tools/umpire.py 2>&1 | grep -E "^(SAFE|OUT)" | grep -E "test|gate|GOLDEN|SEAL|CORNER" | cut -c1-160
echo ""; echo ">>> DONE. Your picks are in her. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
