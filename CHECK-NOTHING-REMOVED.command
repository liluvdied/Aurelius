#!/bin/bash
# Double-click me. Checks that NOTHING of Love's has been taken out of her (cornerstones 0h + 0j, R128/R137 - Love Oct 28 2026 8:17 PM PT:
# "DO NOT LET ANYTHING. ANYYYYYYTHINGGGGGGGGG. EVER ... GET REMOVED WITHOUT ME TELLLLLLLLING YOU TO REMOVE IT"). Read only - changes nothing.
cd "$(dirname "$0")"
echo ""
echo "=== Is anything of mine missing? ==="
echo ""
G=$(python3 tools/no-removal-gate.py 2>&1); g=$?
C=$(python3 tools/cornerstones.py 2>&1); c=$?
if [ $g -eq 0 ]; then echo "PASS  Nothing of yours has been removed since her last save."; else echo "REFUSED  Something of yours is MISSING since her last save:"; echo "$G" | grep "✗" | head -40; fi
echo ""
if [ $c -eq 0 ]; then echo "PASS  Every cornerstone is in her."; else echo "MISSING  These cornerstones are NOT in her:"; echo "$C" | grep "✗"; fi
echo ""
LAST=$(ls -t data/SAVES | head -1)
echo "Compared against her last save: $LAST"
echo ""
if [ $g -eq 0 ] && [ $c -eq 0 ]; then echo ">>> ALL GOOD. Nothing was taken out without your words. <<<"; else echo ">>> SOMETHING IS WRONG. Nothing may be changed until it's put back or you retire it in your own words. <<<"; fi
echo ""
read -n 1 -s -r -p "Press any key to close."
