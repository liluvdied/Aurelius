#!/bin/bash
# ARM THE DESK (fix524, Love Oct 30 2026 1:35 PM PT: "The ARM token is created only by my password click. Token life is 4 hours").
# Run me any time: your password arms the desk's buttons and writers for the next 4 hours. Your automatic exits never need me.
cd "$(dirname "$0")"
pause() { sudo -k; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
echo ""
echo "=== Arm the desk (4 hours) ==="
echo ""
echo "  Your password creates a fresh 4-hour token. Until it exists, every desk button and writer refuses."
echo "  Automatic exits (take-profit, trail, bell, close engine) work with or without it."
echo ""
python3 - <<'PYSTATE'
import json, datetime
try:
    t = json.load(open("data/arm-token.json"))
    left = 4*3600 - (datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(t["armedAt"])).total_seconds()
    print(f"  Currently: {'ARMED, ' + str(int(left//60)) + ' minutes left' if left > 0 else 'EXPIRED'}")
except Exception:
    print("  Currently: NOT ARMED")
PYSTATE
echo ""; read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; pause 1; }
echo ""; echo "Your Mac password (invisible while you type), then Enter:"
sudo -v || { echo "  Password didn't go through - nothing changed."; pause 1; }
sudo chflags noschg,nouchg data/arm-token.json 2>/dev/null
python3 - <<'PYARM'
import json, secrets, datetime
json.dump({"token": secrets.token_hex(32), "armedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "hours": 4, "by": "ARM-THE-DESK.command (her password)"}, open("data/arm-token.json", "w"), indent=1)
print("  OK - ARMED for the next 4 hours.")
PYARM
sudo chflags uchg data/arm-token.json 2>/dev/null
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ARM-THE-DESK: armed 4 hours by her password" >> data/overnight-fixes.log
pause 0
