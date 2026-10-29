#!/bin/bash
# Double-click to install fix444 (Love Oct 28 2026 9:52 PM PT: "too strict , telling you lol"): the 90-second drop for HELD calls (fix431) comes out for main + rejection.
# A call a wall is holding stays alive and is re-checked live at the wire every try. The original stale guard (fix375) stays. Saves her first, refuses if anything else
# of Love's would come out, waits for the next :00/:15/:30/:45, installs, then checks her. Changes no settings.
cd "$(dirname "$0")"
echo ""; echo "=== Installing: held calls stay alive (fix444) ==="; echo ""
python3 -I data/STAGED-fix444/install444.py data/STAGED-fix444; r=$?
echo ""
if [ $r -ne 0 ]; then echo ">>> NOT INSTALLED. Nothing was changed. <<<"; read -n 1 -s -r -p "Press any key to close."; exit 1; fi
echo "=== Checking her ==="
python3 tools/verify-golden.py | head -1; python3 tools/seal-check.py | head -1; python3 tools/cornerstones.py | tail -1
python3 tools/umpire.py 2>&1 | grep -E "^(SAFE|OUT)" | grep -E "test|gate|GOLDEN|SEAL|CORNER" | cut -c1-160
echo ""; echo ">>> DONE. Held calls stay alive now. <<<"; echo ""
read -n 1 -s -r -p "Press any key to close."
