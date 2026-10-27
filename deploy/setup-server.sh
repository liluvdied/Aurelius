#!/bin/bash
# AURELIUS SERVER SETUP. Run ONCE on a fresh Ubuntu 24.04 server, as root, after push-from-mac.command copied her there:
#   bash /opt/aurelius/deploy/setup-server.sh
# It installs Node 22 + Tailscale, locks the firewall (the desk page is reachable ONLY over your private Tailscale network),
# and runs her as a service that restarts on any crash or reboot, with a heartbeat watchdog.
set -euo pipefail
APP=/opt/aurelius
[ -d "$APP/src" ] || { echo "Copy the project to $APP first (double-click deploy/push-from-mac.command on your Mac)."; exit 1; }
cd "$APP"
timedatectl set-timezone America/Los_Angeles || true
apt-get update -y
apt-get install -y curl ca-certificates ufw python3 rsync sudo
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
id aurelius >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin aurelius
chown -R aurelius:aurelius "$APP"
[ -d "$APP/.secrets" ] && chmod 700 "$APP/.secrets" && chmod 600 "$APP"/.secrets/* || echo "NOTE: no .secrets yet - she will run without account access until you copy your keys."
sudo -u aurelius npm ci --no-audit --no-fund || sudo -u aurelius npm install --no-audit --no-fund
command -v tailscale >/dev/null 2>&1 || curl -fsSL https://tailscale.com/install.sh | sh
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow in on tailscale0 to any port 8080 proto tcp
ufw --force enable
install -m 644 deploy/aurelius.service /etc/systemd/system/aurelius.service
install -m 755 deploy/aurelius-watchdog.sh /usr/local/bin/aurelius-watchdog
install -m 644 deploy/aurelius-watchdog.service /etc/systemd/system/aurelius-watchdog.service
install -m 644 deploy/aurelius-watchdog.timer /etc/systemd/system/aurelius-watchdog.timer
systemctl daemon-reload
systemctl enable --now aurelius.service aurelius-watchdog.timer
echo
echo "Aurelius is running as a service. Signing this server into your private Tailscale network now:"
tailscale up || true
echo
echo "Open this on your phone or Mac (Tailscale on):   http://$(tailscale ip -4 2>/dev/null | head -1):8080"
echo "Logs:  journalctl -u aurelius -f      Restart:  systemctl restart aurelius"
