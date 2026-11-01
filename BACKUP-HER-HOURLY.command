#!/bin/bash
# Double-click (Love, Oct 30 2026): every hour, a copy of her goes to your private GitHub (liluvdied/aurelius, branch desk-backup).
# Changes nothing in her rules, engine, main, hooks or GitHub main. Double-click again after a Mac restart.
cd "$(dirname "$0")"
echo ""
echo "=== Hourly GitHub backup for Aurelius ==="
echo ""
echo "What this does, in plain words:"
echo "  1. Every hour it takes a picture of her code, guards, rulebook and history"
echo "     (the same files her saves already track) and sends it to your PRIVATE"
echo "     GitHub repo liluvdied/aurelius, on its own shelf called desk-backup."
echo "  2. Before every send it checks for secrets. Your Kalshi keys, the webhook"
echo "     secret, Polymarket keys, TradingView session, .env and .pem files are"
echo "     never included. If one ever slips in, it sends NOTHING and writes why"
echo "     in data/github-backup.log."
echo "  3. It never changes her rules, her engine, her main line, or what is"
echo "     already on GitHub's main. It only adds the desk-backup shelf."
echo "  4. Your password locks the backup script so no one can change it."
echo "     After a Mac restart, double-click this again to wake it up."
echo ""
read -r -p "Type YES to start the hourly backup: " A
[ "$A" = "YES" ] || { echo "Nothing changed."; read -n 1 -s -r -p "Press any key to close."; exit 0; }
echo ""; echo "Your Mac password (to lock the backup script):"
sudo -v || { echo "No password, nothing changed."; read -n 1 -s -r -p "Press any key to close."; exit 0; }
chmod 755 tools/github-backup.sh
sudo chflags schg tools/github-backup.sh BACKUP-HER-HOURLY.command
sudo -k
echo ""; echo "Checking for secrets first..."
if ! bash tools/github-backup.sh --check; then
  echo ""; echo ">>> HELD. Something secret would have gone up, so nothing was sent. Show Claude the lines above. <<<"
  read -n 1 -s -r -p "Press any key to close."; exit 1
fi
echo ""; echo "Sending her first backup now (the first one carries her whole history, give it a minute)..."
bash tools/github-backup.sh --once | tee -a data/github-backup.log
nohup /bin/bash tools/github-backup.sh >/dev/null 2>&1 &
sleep 1
echo ""; echo ">>> She's backed up. Every hour from now a fresh copy goes to github.com/liluvdied/aurelius (desk-backup). <<<"
echo "    The log lives in data/github-backup.log. You can close this window."
echo ""; read -n 1 -s -r -p "Press any key to close."
