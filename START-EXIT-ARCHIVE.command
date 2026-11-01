#!/bin/bash
# Double-click after a Mac restart (it keeps running when you close this window). Saves every exit forever + sends them to GitHub. Changes nothing in her.
cd "$(dirname "$0")"
python3 tools/exit-archive.py
nohup /bin/bash tools/exit-archive-loop.sh >/dev/null 2>&1 &
sleep 1; echo ""; echo ">>> The exit archive is running: every 10 minutes, every new exit is kept forever and pushed. <<<"
echo ""; read -n 1 -s -r -p "Press any key to close."
