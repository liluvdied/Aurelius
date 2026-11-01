#!/bin/bash
# ONE click (no file of hers changes). The sub-auditor process has run since Oct 29 11:41 PM. He reloads her door when it changes, but his own program only loads when he starts,
# so he is still asking the session-band-ahead question Love retired at 12:18 AM (R251): at 6:31:40 AM Oct 30 he stamped a gold rejection call NO with "SESSION BAND AHEAD".
# This stops him once; her engine restarts him within seconds on tools/sub-auditor.cjs as it is on disk. While he is down no stamp = no order, about 3 seconds.
cd "$(dirname "$0")"
pause() { sudo -k 2>/dev/null; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
echo ""; echo "=== Restart the sub-auditor on his current program ==="; echo ""
echo "  What changes, in plain words:"
echo "   He stops once and her engine starts him again. He then stops asking the session-band-ahead question you retired."
echo "   No rule, setting or file changes. No order can leave in the few seconds he is down."
echo ""
read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; pause 1; }
echo ""; echo "Your Mac password (invisible while you type), then Enter:"
sudo -v || { echo "  ✗ Password didn't go through - nothing changed. Open me again."; pause 1; }
OLD=$(python3 -c "import json;print(json.load(open('data/sub-auditor-alive.json'))['pid'])")
ps -o command= -p "$OLD" | grep -q "sub-auditor.cjs" || { echo "  ✗ Process $OLD is not the sub-auditor - nothing changed. Tell Claude."; pause 1; }
kill "$OLD" && echo "  ✓ stopped him (pid $OLD). Waiting for her engine to start him again..."
NEW=""
for i in $(seq 1 30); do sleep 1; N=$(pgrep -f "tools/sub-auditor.cjs" | head -1); if [ -n "$N" ] && [ "$N" != "$OLD" ]; then NEW=$N; break; fi; done
[ -n "$NEW" ] || { echo "  ✗ He did not come back in 30 seconds. No orders can leave until he does. Tell Claude right away."; pause 1; }
sleep 6
A2=$(python3 -c "import json;a=json.load(open('data/sub-auditor-alive.json'));print(a.get('pid'),a.get('at'))")
echo ""; echo "=================================================="
echo "   SUB-AUDITOR:  running as pid $NEW (alive file: $A2)"
echo "   SELF-TEST:    $(AUR_ROOT="$PWD" node tools/sub-auditor.cjs --test 2>&1 | tail -1 | cut -c1-60)"
echo "=================================================="
pause 0
