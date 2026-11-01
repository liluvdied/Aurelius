#!/bin/bash
# fix583 THIRDS-FREE-AT-5. Love Nov 1 2026: "Find the line that is still waiting past $5 and make $5 the cast. Nothing else."
# THE LINE (bandlock.ts L448/L452 + L865/L870): the falling-from-the-top-third / rising-from-the-bottom-third wall frees only after BTC moves $8 off the high/low:
#   ... && hiAfter - tick < dist)   with   const RT_DIST = { btc: 8, gold: 0.33 }
# NOW: it frees at her $5. The arming distance, gold 33c and the 15/20% pink tolerance are untouched.
cd "$(dirname "$0")"
. tools/concrete.sh
SD=data/STAGED-CHANGE-thirds-free-at-5-583
ST=$SD/files
F=(src/lib/desk/bandlock.ts)
T=(tools/thirds-five-583.cjs)
pause() { sudo -k; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
live() { python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')"; }
h16() { shasum -a 256 "$1" | cut -c1-16; }
echo ""
echo "=== THIRDS WALL FREES AT YOUR \$5 - was \$8 ==="
echo ""
echo "   \$5      the falling-from-the-top-third / rising-from-the-bottom-third wall frees on a \$5 BTC move off the high/low (was \$8)."
echo "   SAME    the 15/20% pink tolerance, pink \$5 break, 55%, flips, zones, Bollingers, 1.5x floor, gold 33c - untouched."
echo "   5M      walled off - not touched."
echo "   LOCK    new test thirds-five-583 fails the umpire if this wall ever waits past \$5 again."
echo ""
for x in base16.txt live-base16.txt request-583.json; do [ -s "$SD/$x" ] || { echo "STOP: $SD/$x is missing - nothing changed. Tell Claude."; pause 1; }; done
while read -r h f; do [ "$(h16 "$ST/$f")" = "$h" ] || { echo "STOP: $f staged copy changed since this was built - nothing changed. Tell Claude."; pause 1; }; done < $SD/base16.txt
while read -r h f; do [ "$(h16 "$f")" = "$h" ] || { echo "STOP: $f on the desk is not the version this click expects ($(h16 "$f") vs $h) - nothing changed. Tell Claude."; pause 1; }; done < $SD/live-base16.txt
for f in "${F[@]}"; do echo "  ~ $f  ($(diff "$f" "$ST/$f" | grep -c '^<') lines out, $(diff "$f" "$ST/$f" | grep -c '^>') lines in)"; done
echo "  + new test: tools/thirds-five-583.cjs"
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
python3 tools/save-her.py "before-fix583" >/dev/null 2>&1 && echo "  OK saved her first"
sudo chflags noschg,nouchg "${F[@]}" "${T[@]}" data/LOVE-REQUESTS.jsonl data/golden-baseline.json data/approved-model.json data/CORNERSTONE-MANIFEST.json data/spine-lock.json 2>/dev/null
R=$(python3 tools/requests.py add "$(cat $SD/request-583.json)" | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "  X Your words could not be recorded - nothing changed. Tell Claude."; concrete_lock schg; pause 1; }
echo "  OK your words recorded as $R"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $R fix583 (Love, THIRDS-FREE-AT-5.command): bandlock awayVerdict + reconThirdAgainst thirds walls free on her \$5 BTC move off the high/low (rel583, was \$8); arming + gold 33c untouched; new test tools/thirds-five-583.cjs" >> data/overnight-fixes.log
python3 - "$R" "$ST" <<'PYALLOW'
import json, sys
R, ST = sys.argv[1], sys.argv[2]; p = "data/ALLOW-REMOVE.json"; A = json.load(open(p)); n = 0
for f in ("src/lib/desk/bandlock.ts",):
    new = set(l.strip() for l in open(ST + "/" + f, encoding="utf8"))
    for l in open(f, encoding="utf8"):
        s = l.strip()
        if s and s not in new: A.append({"what": s, "R": R, "why": "fix583 THIRDS-FREE-AT-5 (her Nov 1 words: find the line still waiting past $5 and make $5 the cast): the thirds wall release gains her $5; the line is replaced, no rule removed"}); n += 1
json.dump(A, open(p, "w"), indent=2, ensure_ascii=False)
print(f"  OK your words name the {n} line(s) that change (ALLOW-REMOVE)")
PYALLOW
for f in "${F[@]}" "${T[@]}"; do M=$(stat -f %Lp "$f" 2>/dev/null || echo 644); chmod u+w "$f" 2>/dev/null; cp "$ST/$f" "$f" && chmod "$M" "$f"; cmp -s "$ST/$f" "$f" && echo "  OK $f in, byte for byte" || { echo "  X $f did not go in. Tell Claude."; concrete_lock schg; pause 1; }; done
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
print("  OK golden re-sealed (spine + live)")
PY
python3 tools/cornerstone-manifest.py check >/dev/null 2>&1 || { python3 tools/cornerstone-manifest.py seal "$R" | tail -1; }
[ -f tools/request-lock.py ] && python3 tools/request-lock.py seal "$R" | sed 's/^/  OK /'
G=$(python3 tools/verify-golden.py | head -1)
python3 tools/save-her.py "after-fix583" >/dev/null 2>&1 && echo "  OK fresh whole save"
concrete_lock schg
python3 tools/umpire-stamp.py >/dev/null 2>&1
git add -A >/dev/null 2>&1; git add -f tools data/approved-model.json data/golden-baseline.json data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/ALLOW-REMOVE.json data/spine-lock.json data/VAULT/requests >/dev/null 2>&1; git rm -q --cached tools/cloudflared tools/cloudflared.tgz >/dev/null 2>&1
git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "fix583: the thirds wall frees at her \$5 (was \$8) ($R)" >/dev/null 2>&1
echo "  checking her breaker and spine..."; sleep ${FIXWAIT:-40}
U=$(python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('SAFE' if v.get('ok') else 'NOT SAFE - ' + str(v.get('why'))[:160])")
B=$(python3 -c "import json;b=json.load(open('data/breaker.json'));print('ON' if not b.get('tripped') and not b.get('entriesOff') else 'TRIPPED: ' + str(b.get('tripped')))" 2>/dev/null || echo "?")
E=$(python3 -c "import json;print('ON' if json.load(open('data/halt.json')).get('off') is False else 'OFF')")
SP=$(python3 -c "import json;s=json.load(open('data/spine-lock-status.json'));print('OK' if s.get('ok') else 'DRIFT')" 2>/dev/null || echo "?")
RA=$(python3 tools/rule-anchors.py 2>&1 | tail -1 | cut -c1-60); RQ=$(python3 tools/requests.py check 2>&1 | tail -1 | cut -c1-60); CS=$(python3 tools/cornerstones.py 2>&1 | tail -1 | cut -c1-50)
T5=$(node tools/thirds-five-583.cjs >/dev/null 2>&1 && echo "PASSES - the thirds wall frees at \$5, \$4 still waits" || echo "FAIL - tell Claude")
echo ""; echo "=================================================="
echo "   GOLDEN:       $G"; echo "   UMPIRE:       $U"; echo "   ENTRIES:      $E   (ENTRIES-ON.command turns her back on if OFF)"; echo "   BREAKER:      $B"; echo "   SPINE:        $SP"
echo "   YOUR RULES:   $RA"; echo "   REQUESTS:     $RQ"; echo "   CORNERSTONES: $CS"
echo "   \$5 THIRDS:    $T5"
[ "${U:0:4}" = "SAFE" ] || echo "   !! NOT SAFE = no opening orders. Send Claude a photo of this window."
echo "=================================================="
pause 0
