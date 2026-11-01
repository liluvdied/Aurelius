#!/bin/bash
# Double-click to put her back to any earlier version (R220-pending). Shows her versions, asks which, your words, YES and your Mac password. Nothing is erased.
cd "$(dirname "$0")"
R="${TMPDIR:-/tmp}/aurelius-revert-$$.sh"; cp tools/revert.sh "$R" && AUR_ROOT="$PWD" /bin/bash "$R"; rm -f "$R"
echo ""; read -n 1 -s -r -p "Press any key to close."
