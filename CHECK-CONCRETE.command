#!/bin/bash
# Double-click any time. Read only (R218): how much of her is in concrete, are her guards sealed, has anything recorded been lost.
cd "$(dirname "$0")"
. tools/concrete.sh
echo ""; echo "=== Is she in concrete? ==="; echo ""
echo "  $(concrete_status)"
OPEN=$(concrete_scope | while IFS= read -r f; do ls -lO "$f" | awk '{print $5}' | grep -qE 'schg|uchg' || echo "$f"; done)
[ -n "$OPEN" ] && { echo "  Not locked yet:"; echo "$OPEN" | head -20 | sed 's/^/    /'; }
echo ""; python3 tools/cornerstone-manifest.py check | tail -1; python3 tools/state-guard.py | tail -1
echo ""; read -n 1 -s -r -p "Press any key to close."
