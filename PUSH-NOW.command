#!/bin/bash
cd "$(dirname "$0")"
git add -A
git commit -m "manual lock $(date +%Y-%m-%d-%H%M)" || echo "Nothing new to commit"
git push origin clean-lock
echo ""
echo "Done. Refresh GitHub and check the top commit on clean-lock."
read -n 1 -s -r -p "Press any key to close."
