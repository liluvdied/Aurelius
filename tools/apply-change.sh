#!/bin/bash
# APPLY A CHANGE - ONLY ON LOVE'S CLICK (R218, Love Oct 29 2026 2:14 PM PT: "goingforward any changes will be through command prompts i click myself, and locked
# permanently thereafter unless i click a command that changes it"). Every CHANGE-<name>.command runs: tools/apply-change.sh data/STAGED-CHANGE-<name>
# The staged folder holds CHANGE.json {"title", "request": {words, what, books, proof}, "remove": [paths, only ever with Love's words]} and files/ (her paths, 1:1).
#   1. shows Love exactly what goes in, what changes, what goes out - nothing happens until she types YES
#   2. her full save (save-her.py) + her words into her request book FIRST (requests.py add) = the R### this change is filed under
#   3. her Mac password lifts the concrete on ONLY the files this change touches; the staged files go in
#   4. re-seals the guard manifest under that R###, puts every file back in concrete, runs the umpire's stamp, commits to her local git
# Never edits a desk file while LIVE is on (AGENTS.project.md rule 9). Any failure before the files go in = nothing changed.
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"; cd "$ROOT" || exit 1
. tools/concrete.sh
ST="${1:?usage: tools/apply-change.sh data/STAGED-CHANGE-<name>}"; ST="${ST%/}"; NAME="$(basename "$ST")"
DONE="data/CHANGES-DONE/$NAME"
[ -f "$ST/CHANGE.json" ] || { echo "No CHANGE.json in $ST - nothing changed."; exit 1; }
[ -e "$DONE" ] && { echo "This change was already applied ($(cat "$DONE")). Nothing changed."; exit 1; }
TITLE=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['title'])" "$ST/CHANGE.json")
ADD=(); NEW=(); while IFS= read -r f; do p="${f#"$ST/files/"}"; if [ -e "$p" ]; then ADD+=("$p"); else NEW+=("$p"); fi; done < <(find "$ST/files" -type f 2>/dev/null | sort)
RM=(); while IFS= read -r p; do [ -n "$p" ] && RM+=("$p"); done < <(python3 -c "import json,sys;[print(p) for p in json.load(open(sys.argv[1])).get('remove',[])]" "$ST/CHANGE.json")
echo ""; echo "=== $TITLE ==="; echo ""
echo "Your words this is filed under:"; python3 -c "import json,sys;print('  ' + json.load(open(sys.argv[1]))['request']['words'])" "$ST/CHANGE.json"; echo ""
[ ${#NEW[@]} -gt 0 ] && { echo "NEW files coming in:"; printf '  + %s\n' "${NEW[@]}"; }
[ ${#ADD[@]} -gt 0 ] && { echo "Files that CHANGE:"; for p in "${ADD[@]}"; do echo "  ~ $p  ($(diff "$p" "$ST/files/$p" | grep -c '^<') lines out, $(diff "$p" "$ST/files/$p" | grep -c '^>') lines in)"; done; }
[ ${#RM[@]} -gt 0 ] && { echo "Files that LEAVE (only because your words above say so):"; printf '  - %s\n' "${RM[@]}"; }
echo ""
DESK=$(printf '%s\n' "${ADD[@]:-}" "${NEW[@]:-}" "${RM[@]:-}" | grep -c '^src/lib/desk/')
LIVE=$(python3 -c "import json;print(bool(json.load(open('data/live-switch.json')).get('live')))")
if [ "$DESK" -gt 0 ] && [ "$LIVE" = "True" ]; then echo "STOP: this changes desk files and LIVE is on. Turn LIVE off first, then double-click this again. Nothing changed."; exit 1; fi
read -r -p "Type YES to put this in her (anything else = nothing changes): " A
[ "$A" = "YES" ] || { echo "Nothing changed."; exit 1; }
echo ""; echo "Your Mac password lifts the concrete for just these files:"; sudo -v || { echo "No password - nothing changed."; exit 1; }
python3 tools/save-her.py "before-$NAME" >/dev/null && echo "  saved her first (data/SAVES/...before-$NAME)"
concrete_unlock data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json "${ADD[@]+"${ADD[@]}"}" "${RM[@]+"${RM[@]}"}" 2>/dev/null
R=$(python3 tools/requests.py add "$(python3 -c "import json,sys;print(json.dumps(json.load(open(sys.argv[1]))['request']))" "$ST/CHANGE.json")" | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "Your words could not be recorded - putting the concrete back, nothing changed."; concrete_lock schg; exit 1; }
echo "  your words recorded as $R"
for p in "${ADD[@]+"${ADD[@]}"}" "${NEW[@]+"${NEW[@]}"}"; do mkdir -p "$(dirname "$p")"; cp "$ST/files/$p" "$p"; echo "  in: $p"; done
for p in "${RM[@]+"${RM[@]}"}"; do python3 tools/vault.py snap "before-remove-$NAME" >/dev/null 2>&1; rm -f "$p"; echo "  out (vaulted first): $p"; done
python3 tools/cornerstone-manifest.py check >/dev/null || python3 tools/cornerstone-manifest.py seal "$R"
concrete_lock schg && echo "  back in concrete: $(concrete_status)"
mkdir -p data/CHANGES-DONE && echo "$R $(date '+%Y-%m-%d %I:%M %p')" > "$DONE"
echo ""; python3 tools/umpire-stamp.py
git add -A >/dev/null 2>&1; git add -f tools >/dev/null 2>&1; git rm -q --cached tools/cloudflared tools/cloudflared.tgz >/dev/null 2>&1
git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "$TITLE ($R)" && echo "  committed to her git: $(git log --oneline -1)"
echo ""; echo ">>> DONE. $TITLE is in her under $R, and she is back in concrete. <<<"
