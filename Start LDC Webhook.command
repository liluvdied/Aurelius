#!/bin/bash
# LDC WEBHOOK — double-click to let your TradingView LDC alerts reach the desk. Close this window to stop it.
# Runs a tiny listener (only POST /ldc with your secret, nothing else on the desk) and a Cloudflare tunnel to it.
cd "$(dirname "$0")" || exit 1
clear
echo "LDC WEBHOOK"
echo "-----------"
CF="cloudflared"
if ! command -v cloudflared >/dev/null 2>&1; then
  CF="$PWD/tools/cloudflared"
  if [ ! -x "$CF" ]; then
    ARCH=$(uname -m); [ "$ARCH" = "arm64" ] || ARCH="amd64"
    echo "Getting cloudflared (Cloudflare's tunnel app, from its official GitHub release) into Aurelius/tools ... one time."
    mkdir -p tools && curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-$ARCH.tgz" -o tools/cloudflared.tgz \
      && tar -xzf tools/cloudflared.tgz -C tools && chmod +x tools/cloudflared \
      || { echo "Could not download cloudflared."; read -r -p "Press Enter to close."; exit 1; }
  fi
fi
node scripts/ldc-hook.mjs &
HOOK=$!
trap 'kill $HOOK 2>/dev/null' EXIT
LOG=$(mktemp)
"$CF" tunnel --no-autoupdate --url http://127.0.0.1:8090 >"$LOG" 2>&1 &
TUN=$!
trap 'kill $HOOK $TUN 2>/dev/null' EXIT
URL=""
for i in $(seq 1 30); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1)
  [ -n "$URL" ] && break
  sleep 1
done
if [ -z "$URL" ]; then echo "Tunnel did not start:"; cat "$LOG"; read -r -p "Press Enter to close."; exit 1; fi
echo "$URL/ldc" > data/ldc-url.txt
echo
echo "Webhook URL (paste into each TradingView alert's Webhook URL box):"
echo
echo "    $URL/ldc"
echo
S=$(cat .secrets/ldc-hook.secret)
echo "LDC BUY / Open Long message (copy the whole line):"
echo
echo "    {\"secret\":\"$S\",\"sym\":\"{{ticker}}\",\"tf\":\"{{interval}}\",\"signal\":\"buy\",\"price\":{{close}},\"t\":\"{{timenow}}\"}"
echo
echo "LDC SELL / Open Short message:"
echo
echo "    {\"secret\":\"$S\",\"sym\":\"{{ticker}}\",\"tf\":\"{{interval}}\",\"signal\":\"sell\",\"price\":{{close}},\"t\":\"{{timenow}}\"}"
echo
echo "VWAP SIGNAL alerts (your Nav Band script's VWAP Long / VWAP Short) use these instead:"
echo
echo "  VWAP LONG:"
echo "    {\"secret\":\"$S\",\"src\":\"vwap\",\"sym\":\"{{ticker}}\",\"tf\":\"{{interval}}\",\"signal\":\"buy\",\"price\":{{close}},\"t\":\"{{timenow}}\"}"
echo
echo "  VWAP SHORT:"
echo "    {\"secret\":\"$S\",\"src\":\"vwap\",\"sym\":\"{{ticker}}\",\"tf\":\"{{interval}}\",\"signal\":\"sell\",\"price\":{{close}},\"t\":\"{{timenow}}\"}"
echo
echo "(Also saved in .secrets/ldc-alerts.txt.) This URL changes each time you start this window,"
echo "so if you restart it, update the Webhook URL on your alerts."
echo
echo "Signals will show below as they arrive:"
wait $HOOK
