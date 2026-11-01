#!/bin/bash
# CONCRETE (R218, Love Oct 29 2026 2:14 PM PT: "goingforward any changes will be through command prompts i click myself, and locked permanently thereafter unless i
# click a command that changes it"). Which files are locked, and how. Sourced by LOCK-HER-IN-CONCRETE.command and tools/apply-change.sh.
#   scope     every file that is HER (code, tools, scripts, guards, root files, her sealed books) - one path per line
#   lock      system-immutable (schg): needs Love's Mac password to set AND to lift, so nothing - no script, no Claude - can change her without her click
#   unlock    lifts the lock on the files named (Love's password), only ever called from a CHANGE-*.command she double-clicked
# NEVER locked (the live desk writes these while she trades): data/ (except the sealed books below), .secrets/, node_modules/, .git/, every __pycache__.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
concrete_scope() {
  cd "$ROOT" || return 1
  find src tools scripts server pine migrations public -type f -not -path "*/__pycache__/*" -not -name ".DS_Store" -not -name "cloudflared*" 2>/dev/null
  find . -maxdepth 1 -type f \( -name "*.command" -o -name "*.md" -o -name "*.json" -o -name "*.ts" -o -name "*.mjs" -o -name "*.sh" -o -name ".gitignore" -o -name ".prettierrc" \) | sed 's|^\./||'
  for f in data/CORNERSTONE-MANIFEST.json data/golden-baseline.json data/LOVE-REQUESTS.jsonl; do [ -e "$f" ] && echo "$f"; done
}
concrete_lock() {   # $1 = schg (Love's password) or uchg; rest = files (default: whole scope)
  local how="$1"; shift; cd "$ROOT" || return 1
  { if [ $# -eq 0 ]; then concrete_scope | tr '\n' '\0'; else printf '%s\0' "$@"; fi; } |
    if [ "$how" = "schg" ]; then sudo xargs -0 chflags schg; else xargs -0 chflags uchg; fi
}
concrete_unlock() { # files to free for one change (both flags lifted; Love's password)
  cd "$ROOT" || return 1
  printf '%s\0' "$@" | sudo xargs -0 chflags noschg,nouchg
}
concrete_status() {
  cd "$ROOT" || return 1
  local n=0 s=0 u=0
  while IFS= read -r f; do n=$((n+1)); fl=$(ls -lO "$f" | awk '{print $5}'); case "$fl" in *schg*) s=$((s+1));; *uchg*) u=$((u+1));; esac; done < <(concrete_scope)
  echo "$n of her files: $s in concrete (only your password lifts it), $u locked, $((n-s-u)) open"
}
