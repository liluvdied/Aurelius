#!/bin/bash
# Runs tools/exit-archive.py every 10 minutes (the desk's 80-exit window is ~40 hours, so nothing can roll off before it is kept). One copy only.
cd "$(dirname "$0")/.." || exit 1
P=data/exit-archive.pid
if [ -f "$P" ] && kill -0 "$(cat "$P")" 2>/dev/null; then echo "The exit archive is already running (pid $(cat "$P"))."; exit 0; fi
echo $$ > "$P"
while true; do python3 tools/exit-archive.py >> data/exit-archive.log 2>&1; sleep 600; done
