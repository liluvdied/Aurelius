#!/bin/bash
# Hourly GitHub backup (Love, Oct 30 2026). Every hour: a snapshot of her whole git scope goes to the
# desk-backup branch of her private repo github.com/liluvdied/aurelius. Never touches her main, her
# staging area, her working files, her hooks or her GitHub main: the snapshot is built in a side index.
# Fail-closed: if any secret (keys, webhook secret, .env, .pem) is in the snapshot, nothing is pushed.
#   bash tools/github-backup.sh --check   = show what would go up, push nothing, write nothing
#   bash tools/github-backup.sh --once    = one snapshot + push now
#   bash tools/github-backup.sh           = every hour forever (one copy only)
cd "$(dirname "$0")/.." || exit 1
URL=git@github.com:liluvdied/aurelius.git
REF=refs/backup/desk-hourly
BRANCH=desk-backup
LOG=data/github-backup.log
PID=data/github-backup.pid
export GIT_AUTHOR_NAME="Aurelius hourly backup" GIT_AUTHOR_EMAIL="backup@aurelius.local"
export GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME" GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"
export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=20"

say() { echo "$(date '+%Y-%m-%d %I:%M %p') $*"; }

# Builds the snapshot tree in a side index (HEAD + every change in her scope). Prints the tree id.
build_tree() {
  local t; t=$(mktemp -t aurelius-backup) || return 1
  GIT_INDEX_FILE="$t" git read-tree HEAD || { rm -f "$t"; return 1; }
  GIT_INDEX_FILE="$t" git add -A . 2>/dev/null || { rm -f "$t"; return 1; }
  GIT_INDEX_FILE="$t" git write-tree; local rc=$?
  rm -f "$t"; return $rc
}

# Prints a reason for every secret or oversized file found in tree $1 (and HEAD's history); prints nothing when clean.
secret_scan() {
  local tree=$1 f v
  git ls-tree -r --name-only "$tree" | grep -i -E '(^|/)\.secrets/|(^|/)\.env($|\.)|\.pem$|\.p12$|(^|/)id_(rsa|ed25519)|kalshi\.id$|polymarket\.(id|secret)$|ldc-hook\.secret$|ldc-alerts\.txt$|tv-session$' | sed 's/^/secret-looking file: /'
  git grep -l -I -E 'BEGIN [A-Z ]*PRIVATE KEY' "$tree" 2>/dev/null | sed 's/^/private key inside: /'
  for f in kalshi.id ldc-hook.secret polymarket.id polymarket.secret tv-session; do
    [ -s ".secrets/$f" ] || continue
    v=$(head -c 200 ".secrets/$f" | tr -d '\r\n')
    [ ${#v} -ge 8 ] || continue
    git grep -q -F -e "$v" "$tree" 2>/dev/null && echo "the value of .secrets/$f is inside a file"
  done
  if [ -s .secrets/kalshi.pem ]; then
    v=$(sed -n 2p .secrets/kalshi.pem | tr -d '\r\n')
    [ ${#v} -ge 8 ] && git grep -q -F -e "$v" "$tree" 2>/dev/null && echo "the Kalshi private key is inside a file"
  fi
  git ls-tree -r -l "$tree" | awk '$4 > 95000000 { print "too big for GitHub (" int($4/1000000) " MB): " $5 }'
}

once() {
  local check=$1 tree problems prev parents commit w
  tree=$(build_tree) || { say "FAILED: could not read her files"; return 1; }
  problems=$(secret_scan "$tree")
  if [ -n "$problems" ]; then
    say "HELD - nothing pushed, a secret would have gone up:"; echo "$problems" | sed 's/^/    /'
    return 2
  fi
  if [ "$check" = check ]; then
    say "CHECK OK - no secrets. $(git ls-tree -r --name-only "$tree" | wc -l | tr -d ' ') files would go up (her main: $(git log --oneline -1 HEAD))."
    return 0
  fi
  prev=$(git rev-parse -q --verify "$REF^{commit}")
  if [ -n "$prev" ] && [ "$(git rev-parse "$prev^{tree}")" = "$tree" ]; then
    say "no change since the last backup"
  else
    parents=""; [ -n "$prev" ] && parents="-p $prev"
    if [ -z "$prev" ] || ! git merge-base --is-ancestor HEAD "$prev"; then parents="$parents -p HEAD"; fi
    commit=$(echo "Hourly backup $(date '+%b %d %Y %I:%M %p %Z')" | git commit-tree "$tree" $parents) || { say "FAILED: could not make the snapshot"; return 1; }
    git update-ref "$REF" "$commit"
  fi
  for w in 0 2 4 8 16; do
    sleep $w
    if git push -q "$URL" "$REF:refs/heads/$BRANCH" 2>/tmp/aurelius-backup.err; then
      say "pushed to GitHub ($BRANCH): $(git log --format='%h %s' -1 "$REF")"; return 0
    fi
  done
  say "!! push failed (snapshot kept here, it goes up next hour): $(tail -1 /tmp/aurelius-backup.err)"
  return 1
}

case "$1" in
  --check)
    # a throwaway object store, so a check leaves her .git exactly as it was
    T=$(mktemp -d -t aurelius-check) || exit 1
    export GIT_ALTERNATE_OBJECT_DIRECTORIES="$(git rev-parse --absolute-git-dir)/objects" GIT_OBJECT_DIRECTORY="$T"
    once check; rc=$?; rm -rf "$T"; exit $rc ;;
  --once)  once ;;
  *)
    if [ -f "$PID" ] && kill -0 "$(cat "$PID")" 2>/dev/null; then echo "The hourly backup is already running (pid $(cat "$PID"))."; exit 0; fi
    echo $$ > "$PID"
    while true; do once >> "$LOG" 2>&1; sleep 3600; done ;;
esac
