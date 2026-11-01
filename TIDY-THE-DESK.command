#!/bin/bash
# TIDY (Love Oct 30 2026 4:57 PM PT: "can you give me a tidy command for all the used ones here too hun? getting thick in here")
# Moves every SPENT one-shot click into data/USED-CLICKS/ - nothing is deleted, every file stays on disk, sealed.
cd "$(dirname "$0")"
pause() { sudo -k; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
KEEP="CLEAR-HER-CACHE.command ONE-FEED-ONLY.command ENTRIES-ON.command ARM-THE-DESK.command REVERT-HER.command RESTART-THE-SUB-AUDITOR.command PUSH-HER-NOW.command BACKUP-HER-HOURLY.command TIDY-THE-DESK.command Start Aurelius.command Start LDC Webhook.command CHECK-CONCRETE.command CHECK-HER-RULES.command CHECK-CORNERSTONE-SEALS.command CHECK-MY-ANSWERS.command CHECK-NOTHING-REMOVED.command"
echo ""
echo "=== Tidy the desk ==="
echo ""
echo "  Every SPENT click moves to data/USED-CLICKS/ (kept forever, still sealed). These STAY:"
for k in $KEEP; do [ -f "$k" ] && echo "   KEEP  $k"; done
echo ""
echo "  And these move:"
MOVE=()
for f in *.command "Start "*.command; do
  [ -f "$f" ] || continue
  case " $KEEP " in *" $f "*) continue;; esac
  case " ${MOVE[*]} " in *" $f "*) continue;; esac
  MOVE+=("$f"); echo "   MOVE  $f"
done
[ ${#MOVE[@]} -gt 0 ] || { echo "   (nothing to move - already tidy)"; pause 0; }
echo ""; read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing moved."; pause 1; }
echo ""; echo "Your Mac password (invisible while you type), then Enter:"
sudo -v || { echo "  X Password didn't go through - nothing moved. Open me again."; pause 1; }
mkdir -p data/USED-CLICKS
N=0
for f in "${MOVE[@]}"; do
  sudo chflags noschg,nouchg "$f" 2>/dev/null
  if mv "$f" "data/USED-CLICKS/$f"; then sudo chflags uchg "data/USED-CLICKS/$f" 2>/dev/null; echo "  OK $f -> data/USED-CLICKS/"; N=$((N+1)); else echo "  X $f would not move - left in place"; fi
done
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) TIDY (Love, TIDY-THE-DESK.command): $N spent clicks filed into data/USED-CLICKS/ - nothing deleted, all sealed (uchg)" >> data/overnight-fixes.log
git add -A >/dev/null 2>&1
git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "tidy: $N spent clicks filed into data/USED-CLICKS" >/dev/null 2>&1
echo ""
echo "  Done - $N spent clicks filed. The desk keeps only what you still use."
pause 0
