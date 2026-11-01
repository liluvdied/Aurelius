#!/bin/bash
# fix572 PINK-BACK-TO-SLIDING. Love Oct 31 2026: put her sliding pink scale back - "Do not keep the $75 floor. Do not keep
# the 3/4 layer. Those are not in the scale." Her pink DISTANCE tolerance returns to the sliding scale at every site:
#   BTC: $25 under $100 wide / 20% of the band-to-band width at $100-$500 / 15% over $500 ;  gold: 15% flat.
# OUT of the code by her word: the $50 reach509 floor on the pink, the $75 weekday floor, the 3/4 band layer, the fix542 $25 cap.
# UNTOUCHED: session-band reach509/REACH429 (her sigma/VWAP walls), the $1 gold reach, the zone reach, 5M.
# Cornerstones 14/15/38/43/53/63 reworded to the scale; rule-anchors fix525 + fix526 retired on her words. __PINKFLAT ships false.
cd "$(dirname "$0")"
. tools/concrete.sh
SD=data/STAGED-CHANGE-pink-back-sliding
ST=$SD/files
F=(src/lib/desk/bandlock.ts src/lib/desk/recon.ts tools/cornerstones.py tools/behaviour-umpire.cjs tools/reach-test-429.cjs tools/pink-15-20-test-459.cjs tools/pink-flag-test-572.cjs tools/umpire.py)
pause() { sudo -k; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
live() { python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')"; }
echo ""
echo "=== Put her sliding pink scale back (the weekend \$25 comes off) ==="
echo ""
echo "  What changes, in plain words - every piece, with your words:"
echo "   SCALE  her pink DISTANCE tolerance is her sliding scale again, every site:"
echo "            BTC  \$25 under \$100 wide / 20% of the width at \$100-\$500 / 15% over \$500"
echo "            gold 15% of the width, flat."
echo "   OUT    \"Do not keep the \$75 floor. Do not keep the 3/4 layer. Those are not in the scale.\""
echo "            - the \$75 weekday floor, the 3/4 band layer, the fix542 \$25 cap and the"
echo "            \$50 reach509 floor on the pink all leave the code."
echo "   SAME   her session-band reach (sigma / VWAP walls), the \$1 gold reach, the zone reach, 5M - untouched."
echo "   RULES  cornerstones 14, 15, 38, 43, 53, 63 are reworded to this scale (her reach wall, her"
echo "            pink tolerance, her dollars, the one-thing cushion, the \$25-for-now now lifted)."
echo "   ANCHORS your two words retire with this click (rule-anchors), kept on file, never silently:"
echo "            fix525 \"when bands are under over \$80 ... 3/4 of a band channel width ...\""
echo "            fix526 \"the 3/4 starts from band to session band, lets do \$75 ...\""
echo "   TOGGLE __PINKFLAT ships OFF (your sliding scale is live); a flat \$25 returns only if it is set."
echo ""
while read -r h f; do [ "$(shasum -a 256 "$ST/$f" | cut -c1-16)" = "$h" ] || { echo "STOP: $f staged copy changed since this was built - nothing changed. Tell Claude."; pause 1; }; done < $SD/base16.txt
while read -r h f; do [ "$(shasum -a 256 "$f" | cut -c1-16)" = "$h" ] || { echo "STOP: $f is not where this click expects it - nothing changed. Tell Claude."; pause 1; }; done < $SD/live-base16.txt
for f in "${F[@]}"; do [ -f "$f" ] || { echo "  + $f  (new)"; continue; }; echo "  ~ $f  ($(diff "$f" "$ST/$f" | grep -c '^<') lines out, $(diff "$f" "$ST/$f" | grep -c '^>') lines in)"; done
echo ""
if [ "$(live)" = "ON" ]; then
  echo "Step 1: turn LIVE OFF in the desk header (her rule: never change a desk file while live)."
  while [ "$(live)" = "ON" ]; do read -r -p "        Press Enter once LIVE is off... " _; done
  echo "  OK - LIVE is off"
fi
echo ""; read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; pause 1; }
echo ""; echo "Your Mac password (invisible while you type), then Enter:"
sudo -v || { echo "  X Password didn't go through - nothing changed. Open me again."; pause 1; }
echo "  OK Password accepted. Working..."
python3 tools/save-her.py "before-fix572" >/dev/null && echo "  OK saved her first"
sudo chflags noschg,nouchg "${F[@]}" data/LOVE-REQUESTS.jsonl data/golden-baseline.json data/CORNERSTONE-MANIFEST.json data/spine-lock.json data/RULE-ANCHORS.json 2>/dev/null
R=$(python3 tools/requests.py add "$(cat $SD/request.json)" | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "  X Your words could not be recorded - nothing changed. Tell Claude."; concrete_lock schg; pause 1; }
echo "  OK your words recorded as $R"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $R fix572 (Love, PINK-BACK-TO-SLIDING.command): her sliding pink scale back (BTC \$25<\$100/20% to \$500/15% over; gold 15%); the \$75 floor, 3/4 layer, \$25 cap and \$50 pink reach floor out; cornerstones 14/15/38/43/53/63 reworded; anchors fix525/fix526 retired" >> data/overnight-fixes.log
python3 - "$R" "$ST" <<'PYALLOW'
import json, os, sys
R, ST = sys.argv[1], sys.argv[2]; p = "data/ALLOW-REMOVE.json"; A = json.load(open(p)); n = 0
for f in ("src/lib/desk/bandlock.ts", "src/lib/desk/recon.ts", "tools/cornerstones.py", "tools/behaviour-umpire.cjs", "tools/reach-test-429.cjs", "tools/pink-15-20-test-459.cjs", "tools/pink-flag-test-572.cjs", "tools/umpire.py"):
    if not os.path.exists(f): continue
    new = set(l.strip() for l in open(ST + "/" + f, encoding="utf8"))
    for l in open(f, encoding="utf8"):
        s = l.strip()
        if s and s not in new: A.append({"what": s, "R": R, "why": "fix572 (her PINK-BACK-TO-SLIDING): her sliding scale returns; the $75 floor, 3/4 layer, $25 cap and $50 pink-reach floor leave by her word"}); n += 1
json.dump(A, open(p, "w"), indent=2, ensure_ascii=False)
print(f"  OK your words name the {n} lines that change (ALLOW-REMOVE)")
PYALLOW
for f in "${F[@]}"; do M=$(stat -f %Lp "$f" 2>/dev/null || echo 644); chmod u+w "$f" 2>/dev/null; cp "$ST/$f" "$f" && chmod "$M" "$f"; cmp -s "$ST/$f" "$f" && echo "  OK $f in, byte for byte" || { echo "  X $f did not go in. Tell Claude."; concrete_lock schg; pause 1; }; done
if [ -z "$FIXWAIT" ]; then pkill -f "$(pwd)/tools/sub-auditor.cjs" 2>/dev/null; sleep 1; (nohup node tools/sub-auditor.cjs >/dev/null 2>&1 &); fi; echo "  OK - the sub-auditor restarted"
python3 tools/rule-anchors.py --retire "the 3/4 starts from band to session band, lets do \$75 instea" "Do not keep the \$75 floor. Do not keep the 3/4 layer. Those are not in the scale. (Love Oct 31 2026)" | sed 's/^/  fix526 /'
python3 tools/rule-anchors.py --retire "when bands are under over \$80 - until they hit \$180 , she ne" "Do not keep the \$75 floor. Do not keep the 3/4 layer. Those are not in the scale. (Love Oct 31 2026)" | sed 's/^/  fix525 /'
python3 tools/rule-anchors.py --add >/dev/null 2>&1; echo "  OK your words anchored (fix525/fix526 retired on your words, kept on file)"
python3 - "$R" <<'PY'
import json, hashlib, os, datetime, sys
R = sys.argv[1]
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
F = ("bandlock.ts", "recon.ts")
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
python3 tools/save-her.py "after-fix572" >/dev/null && echo "  OK fresh whole save"
concrete_lock schg
python3 tools/umpire-stamp.py >/dev/null 2>&1
git add -A >/dev/null 2>&1; git add -f tools data/approved-model.json data/golden-baseline.json data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/ALLOW-REMOVE.json data/spine-lock.json data/RULE-ANCHORS.json >/dev/null 2>&1; git rm -q --cached tools/cloudflared tools/cloudflared.tgz >/dev/null 2>&1
git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "fix572: her sliding pink scale back; \$75 floor / 3-4 / \$25 cap out; anchors fix525/526 retired ($R)" >/dev/null 2>&1
U=$(python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('SAFE' if v.get('ok') else 'NOT SAFE - ' + str(v.get('why'))[:160])")
CS=$(python3 tools/cornerstones.py 2>&1 | tail -1 | cut -c1-40)
echo "  checking her breaker and spine..."; sleep ${FIXWAIT:-40}
B=$(python3 -c "import json;b=json.load(open('data/breaker.json'));print('ON' if not b.get('tripped') and not b.get('entriesOff') else 'TRIPPED: ' + str(b.get('tripped')))" 2>/dev/null || echo "?")
E=$(python3 -c "import json;print('ON' if json.load(open('data/halt.json')).get('off') is False else 'OFF')")
SP=$(python3 -c "import json;s=json.load(open('data/spine-lock-status.json'));print('OK' if s.get('ok') else 'DRIFT')" 2>/dev/null || echo "?")
echo ""; echo "=================================================="
echo "   GOLDEN:       $G"; echo "   UMPIRE:       $U"; echo "   ENTRIES:      $E   (ENTRIES-ON.command turns her back on if OFF)"; echo "   BREAKER:      $B"; echo "   SPINE:        $SP"; echo "   5M WALL:      $(python3 tools/five5m-wall.py | tail -1 | cut -c1-50)"; echo "   CORNERSTONES: $CS"
echo "   PINK SCALE:   gold 15%; BTC \$25<\$100 / 20% to \$500 / 15% over (\$50 floor, \$75 floor, 3/4, \$25 cap all out)"
echo "   PINK FLAG:    $(node tools/pink-flag-test-572.cjs 2>&1 | tail -1 | cut -c1-60)"
echo "   YOUR RULES:   $(python3 tools/rule-anchors.py 2>&1 | tail -1 | cut -c1-60)"
echo "   BEHAVIOUR:    $(node tools/behaviour-umpire.cjs 2>&1 | tail -1 | cut -c1-50)"
echo "=================================================="
pause 0
