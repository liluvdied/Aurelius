#!/bin/bash
# Double-click on your Mac. Copies Aurelius (code + her data, NOT node_modules) to your server's /opt/aurelius.
cd "$(dirname "$0")/.." || exit 1
read -r -p "Server address (IP from DigitalOcean, or its Tailscale name): " HOST
[ -n "$HOST" ] || exit 1
read -r -p "Is this the FIRST time (send her data too)? [y/N] " FIRST
KEEP="--exclude data"
if [ "$FIRST" = "y" ] || [ "$FIRST" = "Y" ]; then KEEP=""; echo "Copying code AND her data ..."; else echo "Copying code only (her live data on the server is never touched) ..."; fi
rsync -az --delete --exclude node_modules --exclude .secrets --exclude "Claude outputs" --exclude archive $KEEP ./ "root@$HOST:/opt/aurelius/" || { read -r -p "Copy failed. Press Enter."; exit 1; }
ssh "root@$HOST" "id aurelius >/dev/null 2>&1 && chown -R aurelius:aurelius /opt/aurelius || true"
echo
read -r -p "Also copy your API keys (.secrets) to the server now? [y/N] " K
if [ "$K" = "y" ] || [ "$K" = "Y" ]; then
  rsync -az .secrets/ "root@$HOST:/opt/aurelius/.secrets/" && ssh "root@$HOST" "chmod 700 /opt/aurelius/.secrets; chmod 600 /opt/aurelius/.secrets/*; id aurelius >/dev/null 2>&1 && chown -R aurelius:aurelius /opt/aurelius/.secrets || true"
fi
echo
echo "Done. First time only: ssh root@$HOST  then  bash /opt/aurelius/deploy/setup-server.sh"
echo "After that, to send her new code: double-click this again, then  ssh root@$HOST systemctl restart aurelius"
read -r -p "Press Enter to close."
