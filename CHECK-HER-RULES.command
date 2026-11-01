#!/bin/bash
# READ-ONLY. Double-click any time: replays today's real misses and every one of her rules LONG and SHORT, for main + rejection, on the code she is running RIGHT NOW. Changes nothing.
cd "$(dirname "$0")"
node tools/check-her-rules.cjs
echo ""; read -n 1 -s -r -p "Press any key to close."
