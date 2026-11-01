#!/bin/bash
# fix579 MAKE-THE-5-BREAK-HER-ENTRY. Love Nov 1 2026: "The $5 BTC break is the entry. The weekend $25 is a pink distance tolerance.
# It is not allowed to block a $5 break. She enters the moment price passes $5 past the pink on a valid flip. Not at $25. Not after half
# the move. Find the line that is still treating the $25 as a wall that stops the $5 break and remove that block. The $25 tolerance stays
# for other uses. The entry is the $5 break."
# ONE line in reachWall429 was still asking the pink to clear by the $6 BAND break before it counted as broken - so a clean $5 break
# read as "not broken yet" and the $25 reach held her. This makes the pink count as broken at HER pink break (BTC $5 / gold 25c), so a
# $5 break clears the reach and she enters. The $25/$1 reach STILL holds a pink that is not yet broken (price only partway through).
# No reach value is changed, no session band, no zone, no other rule or wall - one file (bandlock.ts) plus one new test that locks it in.
cd "$(dirname "$0")"
. tools/concrete.sh
SD=data/STAGED-CHANGE-make-5-break-entry-579
ST=$SD/files
F=(src/lib/desk/bandlock.ts)
TEST=tools/five-break-enters-579.cjs
pause() { sudo -k; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
live() { python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')"; }
echo ""
echo "=== Make the \$5 break her entry - the \$25 pink tolerance no longer blocks it ==="
echo ""
echo "  What changes, in plain words:"
echo "   ENTRY   a clean \$5 break past the pink (BTC) / 25c (gold) on a valid flip is now the entry - she steps through, not at \$25."
echo "   SAME    the \$25 / \$1 pink reach STILL holds a pink that is NOT yet broken (price only partway through) - never into an unbroken pink."
echo "   SAME    every session band, every zone, every reach VALUE - byte for byte untouched (only the pink's break threshold moves)."
echo "   BOTH    long and short - the break frees her the same each way."
echo "   LOCK    a new test (five-break-enters) fails the umpire if the \$5 break is ever blocked again."
echo ""
while read -r h f; do [ "$(shasum -a 256 "$ST/$f" | cut -c1-16)" = "$h" ] || { echo "STOP: $f staged copy changed since this was built - nothing changed. Tell Claude."; pause 1; }; done < $SD/base16.txt
while read -r h f; do [ "$(shasum -a 256 "$f" | cut -c1-16)" = "$h" ] || { echo "STOP: $f on the desk is not the version this click expects - nothing changed. Tell Claude."; pause 1; }; done < $SD/live-base16.txt
for f in "${F[@]}"; do echo "  ~ $f  ($(diff "$f" "$ST/$f" | grep -c '^<') lines out, $(diff "$f" "$ST/$f" | grep -c '^>') lines in)"; done
echo "  + new test: $TEST (proves the \$5 break enters both sides; gold 25c mirror)"
echo ""
if [ "$(live)" = "ON" ]; then
  echo "Step 1: turn LIVE OFF in the desk header (your rule: never change a desk file while live)."
  while [ "$(live)" = "ON" ]; do read -r -p "        Press Enter once LIVE is off... " _; done
  echo "  OK - LIVE is off"
fi
echo ""; read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; pause 1; }
echo ""; echo "Your Mac password (invisible while you type), then Enter:"
sudo -v || { echo "  X Password didn't go through - nothing changed. Open me again."; pause 1; }
echo "  OK Password accepted. Working..."
python3 tools/save-her.py "before-fix579" >/dev/null && echo "  OK saved her first"
sudo chflags noschg,nouchg "${F[@]}" "$TEST" data/LOVE-REQUESTS.jsonl data/golden-baseline.json data/approved-model.json data/CORNERSTONE-MANIFEST.json data/spine-lock.json 2>/dev/null
R=$(python3 tools/requests.py add "$(cat $SD/request-579.json)" | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "  X Your words could not be recorded - nothing changed. Tell Claude."; concrete_lock schg; pause 1; }
echo "  OK your words recorded as $R"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $R fix579 (Love, MAKE-THE-5-BREAK-HER-ENTRY.command): reachWall429 pink (5m PP) counts as broken behind her at HER pink break (PINK_BREAK432 - BTC \$5 / gold 25c) not the \$6/33c band break, so a clean \$5 break clears the \$25 reach and she enters; the \$25/\$1 reach still holds an unbroken pink; main + rejection + every book but delayed; both sides; no reach value / session band / zone / other rule changed; new test tools/five-break-enters-579.cjs locks it" >> data/overnight-fixes.log
python3 - "$R" "$ST" <<'PYALLOW'
import json, sys
R, ST = sys.argv[1], sys.argv[2]; p = "data/ALLOW-REMOVE.json"; A = json.load(open(p)); n = 0
for f in ("src/lib/desk/bandlock.ts",):
    new = set(l.strip() for l in open(ST + "/" + f, encoding="utf8"))
    for l in open(f, encoding="utf8"):
        s = l.strip()
        if s and s not in new: A.append({"what": s, "R": R, "why": "fix579 (her MAKE-THE-5-BREAK-HER-ENTRY): the pink's break threshold moves from the $6/33c band break to her $5/25c pink break on her Nov 1 words; no rule removed, the line is replaced"}); n += 1
json.dump(A, open(p, "w"), indent=2, ensure_ascii=False)
print(f"  OK your words name the {n} line(s) that change (ALLOW-REMOVE)")
PYALLOW
for f in "${F[@]}"; do M=$(stat -f %Lp "$f" 2>/dev/null || echo 644); chmod u+w "$f" 2>/dev/null; cp "$ST/$f" "$f" && chmod "$M" "$f"; cmp -s "$ST/$f" "$f" && echo "  OK $f in, byte for byte" || { echo "  X $f did not go in. Tell Claude."; concrete_lock schg; pause 1; }; done
cp "$ST/$TEST" "$TEST" && cmp -s "$ST/$TEST" "$TEST" && echo "  OK her new \$5-break test is in" || { echo "  X the test did not go in. Tell Claude."; concrete_lock schg; pause 1; }
if [ -z "$FIXWAIT" ]; then pkill -f "$(pwd)/tools/sub-auditor.cjs" 2>/dev/null; sleep 1; (nohup node tools/sub-auditor.cjs >/dev/null 2>&1 &); fi; echo "  OK - the sub-auditor restarted"
python3 tools/rule-anchors.py --add >/dev/null 2>&1; echo "  OK your words anchored"
python3 - "$R" <<'PY'
import json, hashlib, os, datetime, sys
R = sys.argv[1]
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
F = ("bandlock.ts",)
q = "data/approved-model.json"; a = json.load(open(q))
for f0 in F:
    if f0 in a["files"]: a["files"][f0] = h16("src/lib/desk/" + f0)
a["at"] = datetime.datetime.now(datetime.timezone.utc).isoformat(); tmp = q + ".tmp"; json.dump(a, open(tmp, "w"), indent=1); os.replace(tmp, q)
p = "data/golden-baseline.json"; t = open(p, encoding="utf8").read(); b = json.loads(t)
for f0 in F:
    if f0 in b["code"]: t = t.replace(f'"{f0}": "{b["code"][f0]}"', f'"{f0}": "{h16("src/lib/desk/" + f0)}"', 1)
tmp = p + ".tmp"; open(tmp, "w", encoding="utf8").write(t); os.replace(tmp, p)
print("  OK her model approved the same second (no breaker trip)")
PY
echo ""; echo "=================================================================="
echo "  Now turn LIVE back ON in the desk header, then come back here."
echo "=================================================================="
read -r -p "Press Enter when LIVE is back on... " _
sudo -v || { echo "  X Password timed out - type it once more."; sudo -v || pause 1; }
python3 tools/seal-check.py >/dev/null || { echo "STOP: THE SEAL is broken - her live lineup changed. Tell Claude."; pause 1; }
python3 - <<'PY'
import json, hashlib, os
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
p = "data/golden-baseline.json"; t = open(p, encoding="utf8").read(); b = json.loads(t); ls = json.load(open("data/live-switch.json"))
for k in ("live", "at", "note", "liveBook"):
    if k in ls and k in b["config"]: t = t.replace(f'"{k}": "{b["config"][k]}"', f'"{k}": "' + hashlib.sha256(json.dumps(ls.get(k), sort_keys=True).encode()).hexdigest()[:10] + '"', 1)
for f in ("data/live-switch.json", "data/spine-lock.json"):
    o = b.get("configFiles", {}).get(f)
    if o: t = t.replace(f'"{f}": "{o}"', f'"{f}": "{h16(f)}"', 1)
tmp = p + ".tmp"; open(tmp, "w", encoding="utf8").write(t); os.replace(tmp, p)
PY
python3 tools/cornerstone-manifest.py check >/dev/null 2>&1 || { python3 tools/cornerstone-manifest.py seal "$R" | tail -1; }
[ -f tools/request-lock.py ] && python3 tools/request-lock.py seal "$R" | sed 's/^/  OK /'
G=$(python3 tools/verify-golden.py | head -1)
python3 tools/save-her.py "after-fix579" >/dev/null && echo "  OK fresh whole save"
concrete_lock schg
python3 tools/umpire-stamp.py >/dev/null 2>&1
git add -A >/dev/null 2>&1; git add -f tools data/approved-model.json data/golden-baseline.json data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/ALLOW-REMOVE.json data/spine-lock.json data/VAULT/requests >/dev/null 2>&1; git rm -q --cached tools/cloudflared tools/cloudflared.tgz >/dev/null 2>&1
git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "fix579: the \$5 break is her entry - the pink counts as broken at her \$5/25c break, the \$25 reach no longer blocks it, every other rule untouched ($R)" >/dev/null 2>&1
U=$(python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('SAFE' if v.get('ok') else 'NOT SAFE - ' + str(v.get('why'))[:160])")
echo "  checking her breaker and spine..."; sleep ${FIXWAIT:-40}
B=$(python3 -c "import json;b=json.load(open('data/breaker.json'));print('ON' if not b.get('tripped') and not b.get('entriesOff') else 'TRIPPED: ' + str(b.get('tripped')))" 2>/dev/null || echo "?")
E=$(python3 -c "import json;print('ON' if json.load(open('data/halt.json')).get('off') is False else 'OFF')")
SP=$(python3 -c "import json;s=json.load(open('data/spine-lock-status.json'));print('OK' if s.get('ok') else 'DRIFT')" 2>/dev/null || echo "?")
RA=$(python3 tools/rule-anchors.py 2>&1 | tail -1 | cut -c1-60); RQ=$(python3 tools/requests.py check 2>&1 | tail -1 | cut -c1-60); CS=$(python3 tools/cornerstones.py 2>&1 | tail -1 | cut -c1-50)
T5=$(node tools/five-break-enters-579.cjs >/dev/null 2>&1 && echo "PASSES - a \$5 break enters, \$4 still held, both sides" || echo "FAIL - tell Claude")
echo ""; echo "=================================================="
echo "   GOLDEN:       $G"; echo "   UMPIRE:       $U"; echo "   ENTRIES:      $E   (ENTRIES-ON.command turns her back on if OFF)"; echo "   BREAKER:      $B"; echo "   SPINE:        $SP"
echo "   YOUR RULES:   $RA"; echo "   REQUESTS:     $RQ"; echo "   CORNERSTONES: $CS"
echo "   \$5 BREAK:     $T5"
[ "${U:0:4}" = "SAFE" ] || echo "   !! NOT SAFE = no opening orders. Send Claude a photo of this window."
echo "=================================================="
echo "   The \$5 break is her entry now. The \$25 tolerance still guards an unbroken pink. Every other rule is untouched."
pause 0
