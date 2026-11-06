#!/bin/bash
# RUN ALL MY CHANGES (Love Nov 5 2026 6:14 PM PT: "i do them like 5 at a time and it makes me do them all again like this").
# Every fix is still its own CHANGE command, run one by one in number order, each checked and signed on its own,
# each one must get the umpire to SAFE. What changes: LIVE off ONCE, your password ONCE, LIVE on ONCE for the whole stack.
# How: each CHANGE's own apply script is cut at its "NOW TURN LIVE ON" line. Part 1 of every pending CHANGE runs with LIVE
# off; then you turn LIVE on once; then part 2 (LIVE stamps + checks + umpire) of each runs, in the same order.
# Nothing in a CHANGE's steps is skipped or rewritten except the per-command "turn LIVE on" wait and the password reset (sudo -k).
set -u
DESK="${RUNALL_DESK:-/Users/liluv/Desktop}"
cd "$DESK/aurelius fixxd <3/Aurelius" || exit 1
HERE="$(pwd)"
WORK="data/BATCH-RUNS/$(date '+%Y-%m-%d-%H%M%S')"; mkdir -p "$WORK"
say() { echo "$@" | tee -a "$WORK/log.txt"; }
live() { python3 -c "import json;print(bool(json.load(open('data/live-switch.json')).get('live')))"; }
stop() { say ""; say "STOP: $1"; say "Send Claude a picture of this window."; cleanup; exit 1; }

# hold the same take-turns lock every CHANGE uses, so nothing else runs while this does
L732="data/.change-running-732"
while ! mkdir "$L732" 2>/dev/null; do
  o=$(cat "$L732/pid" 2>/dev/null)
  if [ -n "$o" ] && ! kill -0 "$o" 2>/dev/null; then rm -rf "$L732"; continue; fi
  echo "WAITING: $(cat "$L732/name" 2>/dev/null || echo "a CHANGE") is still running - this starts by itself when it finishes."; sleep 3
done
echo $$ > "$L732/pid"; echo "RUN-ALL-MY-CHANGES" > "$L732/name"
KEEP=""
cleanup() { [ -n "$KEEP" ] && kill "$KEEP" 2>/dev/null; sudo -k 2>/dev/null; rm -rf "$HERE/$L732"; }
trap cleanup EXIT

# 1. which CHANGE commands are waiting on the Desktop (number order), and which are already in
PENDING=(); CMDS=()
while IFS= read -r cmd; do
  ap=$(grep -oE '"[^"]*/STAGED-CHANGE-[^"]*/apply[^"]*\.sh"' "$cmd" | head -1 | tr -d '"')
  [ -n "$ap" ] || { say "   (not a CHANGE I can run: $(basename "$cmd") - left alone)"; continue; }
  name=$(basename "$(dirname "$ap")")
  if [ -e "data/CHANGES-DONE/$name" ]; then say "   already in (moved to used-commands): $(basename "$cmd")"; d="$DESK/aurelius fixxd <3/used-commands/$(date '+%Y-%m-%d')"; mkdir -p "$d"; mv "$cmd" "$d/" 2>/dev/null; continue; fi
  [ -f "$ap" ] || stop "$(basename "$cmd") points at a missing script ($ap). Nothing changed."
  grep -q 'NOW TURN LIVE ON' "$ap" && grep -q '^while :; do read' "$ap" && grep -q '^\[ "$(live)" = "False" \]' "$ap" \
    || stop "$(basename "$cmd") is not in the usual shape, so I won't cut it. Run that one by itself. Nothing changed."
  PENDING+=("$ap"); CMDS+=("$cmd")
done < <(ls "$DESK"/CHANGE-*.command 2>/dev/null | sort -t- -k2,2n)
[ ${#PENDING[@]} -gt 0 ] || { say "Nothing waiting - every CHANGE on the Desktop is already in."; exit 0; }
say ""; say "Will run, in this order:"; for c in "${CMDS[@]}"; do say "   $(basename "$c")"; done; say ""

# 2. LIVE off once, password once
[ "$(live)" = "False" ] || stop "LIVE is on. Turn LIVE off first, then run this again. Nothing changed."
echo "Your Mac password, once for all of them:"; sudo -v || stop "no password. Nothing changed."
( while kill -0 $$ 2>/dev/null; do sudo -n true 2>/dev/null; sleep 30; done ) 2>/dev/null & KEEP=$!; disown $KEEP 2>/dev/null

# 3. cut each CHANGE into its two halves
i=0
for ap in "${PENDING[@]}"; do
  i=$((i+1)); n=$(printf '%02d' $i)
  python3 - "$ap" "$WORK/$n-part1.sh" "$WORK/$n-part2.sh" <<'PY' || stop "could not read $(basename "$ap"). Nothing changed."
import sys,re
src,p1,p2=sys.argv[1:4]; L=open(src).read().split("\n")
chk=next(i for i,l in enumerate(L) if l.startswith('[ "$(live)" = "False" ]'))
liveon=next(i for i,l in enumerate(L) if "NOW TURN LIVE ON" in l)
cut=liveon-1                      # the 'echo ""; echo "====' line before it
while cut>0 and not L[cut].startswith('echo ""; echo "='): cut-=1
loop=next(i for i,l in enumerate(L) if l.startswith('while :; do read') and i>liveon)
head=L[:chk]
st=next(l for l in L if l.startswith("ST="))
part1=L[:cut]+['echo "$R" > "$ST/.batch-R"']
part2=head+['R=$(cat "$ST/.batch-R")']+[l.replace("sudo -k; ","") for l in L[loop+1:]]
open(p1,"w").write("\n".join(part1)+"\n"); open(p2,"w").write("\n".join(part2)+"\n")
PY
done

# 4. part 1 of each, LIVE off. One that stops before changing anything (stale / out of order) is skipped and the rest go on.
DONE_IDX=(); SKIPPED=(); FAILED=""
i=0
for ap in "${PENDING[@]}"; do
  i=$((i+1)); n=$(printf '%02d' $i); nm="$(basename "${CMDS[$((i-1))]}")"
  say ""; say "=================== $nm  (part 1, LIVE off) ==================="
  bash "$WORK/$n-part1.sh" > "$WORK/$n-part1.out" 2>&1; rc=$?
  cat "$WORK/$n-part1.out" | tee -a "$WORK/log.txt"
  if [ $rc -eq 0 ]; then DONE_IDX+=($i)
  elif grep -q "Nothing changed" "$WORK/$n-part1.out"; then SKIPPED+=("$nm"); say "   -> skipped, nothing of hers changed. Carrying on with the rest."
  else FAILED="$nm"; break; fi
done
[ ${#DONE_IDX[@]} -gt 0 ] || stop "none of them could go in (see above). Nothing changed."
DONE1=${#DONE_IDX[@]}

# 5. LIVE on once
say ""; say "=========================================================="
[ -n "$FAILED" ] && say "NOTE: $FAILED stopped partway (picture it for Claude). The $DONE1 before it are in and still need their LIVE half."
[ ${#SKIPPED[@]} -gt 0 ] && say "Skipped (stale, nothing changed): ${SKIPPED[*]}"
say ">>> NOW TURN LIVE ON on the desk, then come back here and press return. (Just once.) <<<"
say "=========================================================="
while :; do read -r -p "" _ || sleep 2; [ "$(live)" = "True" ] && break; echo "LIVE still reads off - turn LIVE on, then press return."; done

# 6. part 2 of each, in the same order; each must reach umpire SAFE
for i in "${DONE_IDX[@]}"; do
  n=$(printf '%02d' $i)
  say ""; say "=================== $(basename "${CMDS[$((i-1))]}")  (part 2, LIVE on) ==================="
  bash "$WORK/$n-part2.sh" 2>&1 | tee -a "$WORK/log.txt"; [ "${PIPESTATUS[0]}" -eq 0 ] || stop "$(basename "${CMDS[$((i-1))]}") did not reach SAFE. The ones after it are installed but not yet signed."
  dest="$DESK/aurelius fixxd <3/used-commands/$(date '+%Y-%m-%d')"; mkdir -p "$dest"; mv "${CMDS[$((i-1))]}" "$dest/" 2>/dev/null
done
say ""
if [ -n "$FAILED" ]; then say ">>> $DONE1 in and SAFE. $FAILED stopped - send Claude a picture. <<<"
else say ">>> DONE. $DONE1 in, each one SAFE, LIVE is on. Don't toggle LIVE now. <<<"; fi
[ ${#SKIPPED[@]} -gt 0 ] && say ">>> Left on the Desktop for Claude to rebuild: ${SKIPPED[*]} <<<"
say "(Full log: $HERE/$WORK/log.txt - finished commands moved to used-commands.)"
