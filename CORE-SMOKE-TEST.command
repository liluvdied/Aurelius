#!/bin/bash
# Aurelius core smoke test. Paper only: no key, no orders, touches nothing outside this folder.
cd "$(dirname "$0")" || exit 1
echo ""; echo "=== AURELIUS CORE: SMOKE TEST (paper, no orders) ==="; echo ""
command -v node >/dev/null || { echo "STOP: node is not installed."; read -n 1 -s -r -p "Press any key."; exit 1; }
npm install --silent --no-audit --no-fund || { echo "STOP: npm install failed."; read -n 1 -s -r -p "Press any key."; exit 1; }
echo "1) Offline tests:"; node --test test/*.test.js 2>&1 | grep -E "^(not )?ok|# (pass|fail)"
echo ""; echo "2) Live feeds (15 seconds):"; node test/smoke.mjs
echo ""; echo "DONE. Send a screenshot of this window to Claude."; read -n 1 -s -r -p "Press any key to close."
