#!/bin/bash
# REVERT HER (R220-pending, Love Oct 29 2026 2:19 PM PT: "able to be reverted back to previous settings at a moments notice"). Run by REVERT-HER.command, ONLY on Love's click.
# Puts her code, tools, guards and settings back exactly as they were at a version she picks, as a NEW version (nothing in her history is erased; she can revert the revert).
# Kept as they are now (never rolled back): her request book (append-only, hash-chained), her exit log, win pings, the state guard's memory, and whether LIVE is on or off.
# Files added after that version stay in her (nothing leaves without her words). Desk files never change while LIVE is on (AGENTS.project.md rule 9).
set -u
ROOT="${AUR_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"; cd "$ROOT" || exit 1  # REVERT-HER.command runs a copy of me, so putting back tools/revert.sh never rewrites the script that is running
. tools/concrete.sh
KEEP=(data/LOVE-REQUESTS.jsonl data/exit-log.json data/win-pings.json data/STATE-GUARD-SEEN.json data/CORNERSTONE-MANIFEST.json data/CORNERSTONE-MANIFEST-log.jsonl)
echo ""; echo "=== Her versions (newest first) ==="; echo ""
C=(); while IFS= read -r h; do C+=("$h"); done < <(git log --format='%h' -n 20)  # macOS bash 3.2: no mapfile
git log --format='%h|%ad|%s' --date=format:'%b %d %I:%M %p' -n 20 | while IFS='|' read -r h d s; do i=$((i+1)); printf '  %2d) %s  %s\n' "$i" "$d" "$s"; done
echo ""; read -r -p "Number of the version to put her back to (Enter = cancel): " N
[[ "$N" =~ ^[0-9]+$ ]] && [ "$N" -ge 2 ] && [ "$N" -le ${#C[@]} ] || { echo "Nothing changed (1 is her as she is now)."; exit 1; }
T=${C[$((N-1))]}; TS=$(git log -1 --format='%s' "$T")
echo ""; echo "Back to: $TS ($T). What changes:"; git diff --stat HEAD "$T" -- . "${KEEP[@]/#/:!}" | tail -15
DESK=$(git diff --name-only HEAD "$T" -- src/lib/desk | wc -l | tr -d ' ')
LIVE=$(python3 -c "import json;print(bool(json.load(open('data/live-switch.json')).get('live')))")
if [ "$DESK" -gt 0 ] && [ "$LIVE" = "True" ]; then echo ""; echo "STOP: this puts back desk files and LIVE is on. Turn LIVE off first, then double-click again. Nothing changed."; exit 1; fi
echo ""; read -r -p "Why, in your words (goes in your request book): " WHY
read -r -p "Type YES to put her back to that version: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; exit 1; }
echo ""; echo "Your Mac password lifts the lock for the revert:"; sudo -v || { echo "No password - nothing changed."; exit 1; }
python3 tools/save-her.py "before-revert-to-$T" >/dev/null && echo "  saved her first"
concrete_scope | tr '\n' '\0' | sudo xargs -0 chflags noschg,nouchg
REQ=$(python3 -c "import json,sys;print(json.dumps({'words': 'Love: \"' + sys.argv[1] + '\" (clicked REVERT-HER.command)', 'what': 'REVERT: her code, tools, guards and settings put back to ' + sys.argv[2] + ' (' + sys.argv[3] + '); LIVE on/off, request book and exit log kept as they were', 'books': ['all'], 'proof': [{'process': 'git commit Revert to ' + sys.argv[2]}]}))" "$WHY" "$T" "$TS")
R=$(python3 tools/requests.py add "$REQ" | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "Your words could not be recorded - locking her again, nothing changed."; concrete_lock schg; exit 1; }
LIVENOW=$(python3 -c "import json;print(json.dumps(json.load(open('data/live-switch.json')).get('live')))")
HOLD=$(mktemp -d); for k in "${KEEP[@]}"; do [ -e "$k" ] && cp -p "$k" "$HOLD/$(basename "$k")"; done  # kept exactly as they are this second (your words were just added)
git checkout "$T" -- . && for k in "${KEEP[@]}"; do [ -e "$HOLD/$(basename "$k")" ] && cp -p "$HOLD/$(basename "$k")" "$k"; done; rm -rf "$HOLD"
python3 - "$LIVENOW" <<'PY'
import json, sys, os
p = "data/live-switch.json"; s = json.load(open(p)); s["live"] = json.loads(sys.argv[1]); t = p + ".tmp"; json.dump(s, open(t, "w"), indent=2); os.replace(t, p)
PY
python3 tools/cornerstone-manifest.py check >/dev/null || python3 tools/cornerstone-manifest.py seal "$R"
concrete_lock schg && echo "  locked again: $(concrete_status)"
echo ""; python3 tools/umpire-stamp.py || echo "  !! The umpire is NOT SAFE on this version: main + rejection opening orders are held until it is (exits are never held). Tell Claude."
git add -A >/dev/null 2>&1; git add -f tools >/dev/null 2>&1; git rm -q --cached tools/cloudflared tools/cloudflared.tgz >/dev/null 2>&1
if ! git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "Revert to $T: $TS ($R)"; then echo ""; echo ">>> She is back to that version and locked, but her version list did not save it - tell Claude. <<<"; exit 1; fi
echo ""; echo ">>> DONE. She is back to \"$TS\" under $R. Her version list keeps everything, so you can go forward again the same way. <<<"
