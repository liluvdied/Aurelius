#!/bin/bash
# Double-click to send her to GitHub right now (R220-pending) - only needed if a push failed because the internet was down. Changes nothing in her.
cd "$(dirname "$0")"
bash .git/hooks/post-commit
echo ""; read -n 1 -s -r -p "Press any key to close."
