#!/bin/bash
# Aurelius — double-click to start. Close this window to stop her.
cd "$(dirname "$0")" || exit 1
clear
echo "AURELIUS"
echo "--------"

# Node.js 20 or newer is required.
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "Node.js 20+ is not installed. Opening the download page."
  echo "Install the LTS version, then double-click this file again."
  open "https://nodejs.org/en/download"
  read -r -p "Press Enter to close."
  exit 1
fi

# Keys live in .secrets (never in public/).
for f in kalshi.id kalshi.pem; do
  if [ ! -s ".secrets/$f" ]; then
    echo "Missing .secrets/$f — see .secrets/README.txt. She will run with no Kalshi account access."
  fi
done

if [ ! -d node_modules ]; then
  echo "First run: installing (about a minute)..."
  npm install --no-audit --no-fund || { read -r -p "Install failed. Press Enter to close."; exit 1; }
fi

LIVE=$(node -p 'try{JSON.parse(require("fs").readFileSync("data/live-switch.json","utf8")).live===true?"ON":"OFF"}catch(e){"OFF"}')
echo "LIVE is $LIVE. Route: paper book. Flip LIVE from the desk header."
echo "Your Mac will stay awake while this window is open."
echo

# Keep the Mac awake while she runs.
caffeinate -dimsu -w $$ &

# Open the desk once it is up.
( for i in $(seq 1 60); do
    if curl -s -o /dev/null --max-time 2 http://127.0.0.1:8080/; then open "http://127.0.0.1:8080/"; exit 0; fi
    sleep 2
  done ) &

# Run, and restart her if she ever stops. Same code every time — nothing is restored.
export PATH="$PWD/node_modules/.bin:$PATH"
while true; do
  node scripts/with-app-env.mjs vite dev --host 127.0.0.1 --port 8080
  echo "Desk stopped at $(date). Restarting in 5 seconds. Close this window to stop for good."
  sleep 5
done
