#!/bin/bash
# fix571 WEEKEND-PINK-25. Love Oct 31 2026: "WEEKEND-PINK-25 Flat $25 for both BTC and gold. Overrides the whole pink
# wall. Does not touch the sliding scale code underneath." A flat $25 pink OVERLAY on BOTH assets at every pink
# tolerance site, gated by __PINKFLAT25. Her whole pink law stays byte-identical in the else-branch under the flag;
# PINK-BACK-TO-SLIDING lifts it to restore her exactly. Overlay only - the sliding-scale code underneath is untouched.
cd "$(dirname "$0")"
. tools/concrete.sh
SD=data/STAGED-CHANGE-weekend-pink-25
ST=$SD/files
F=(src/lib/desk/bandlock.ts src/lib/desk/recon.ts tools/pink-flag-25-test.cjs tools/umpire.py)
pause() { sudo -k; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
live() { python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')"; }
echo ""
echo "=== Weekend pink 25 - a flat \$25 over both books (temporary, yours to lift) ==="
echo ""
echo "  What changes, in plain words:"
echo "   IN    the pink tolerance is a flat \$25 at every site for BOTH BTC and gold this weekend."
echo "         Your whole pink law - the \$75 weekday floor, the 3/4 scale, the sliding % - is not"
echo "         deleted: it sits under the overlay untouched, byte for byte."
echo "   BACK  PINK-BACK-TO-SLIDING.command lifts the overlay and your full sliding law returns"
echo "         exactly as it is tonight. 5M untouched. Session-band reach untouched."
echo "   NEW   her umpire now runs pink-flag-25-test.cjs, which proves the flag on = \$25 both"
echo "         books and the flag off = your live law byte-identical - every time she checks herself."
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
python3 tools/save-her.py "before-fix571" >/dev/null && echo "  OK saved her first"
sudo chflags noschg,nouchg "${F[@]}" data/LOVE-REQUESTS.jsonl data/golden-baseline.json data/CORNERSTONE-MANIFEST.json data/spine-lock.json 2>/dev/null
R=$(python3 tools/requests.py add "$(cat $SD/request.json)" | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "  X Your words could not be recorded - nothing changed. Tell Claude."; concrete_lock schg; pause 1; }
echo "  OK your words recorded as $R"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $R fix571 (Love, WEEKEND-PINK-25.command): a flat \$25 pink overlay on both books (__PINKFLAT25), her full law byte-identical under the flag, reversible with PINK-BACK-TO-SLIDING" >> data/overnight-fixes.log
python3 - "$R" "$ST" <<'PYALLOW'
import json, os, sys
R, ST = sys.argv[1], sys.argv[2]; p = "data/ALLOW-REMOVE.json"; A = json.load(open(p)); n = 0
for f in ("src/lib/desk/bandlock.ts", "src/lib/desk/recon.ts", "tools/pink-flag-25-test.cjs", "tools/umpire.py"):
    if not os.path.exists(f): continue
    new = set(l.strip() for l in open(ST + "/" + f, encoding="utf8"))
    for l in open(f, encoding="utf8"):
        s = l.strip()
        if s and s not in new: A.append({"what": s, "R": R, "why": "fix571 (her WEEKEND-PINK-25): nothing deleted - the flat $25 overlay goes over her pink law, lifted by PINK-BACK-TO-SLIDING"}); n += 1
json.dump(A, open(p, "w"), indent=2, ensure_ascii=False)
print(f"  OK your words name the {n} lines that change (ALLOW-REMOVE)")
PYALLOW
for f in "${F[@]}"; do M=$(stat -f %Lp "$f" 2>/dev/null || echo 644); chmod u+w "$f" 2>/dev/null; cp "$ST/$f" "$f" && chmod "$M" "$f"; cmp -s "$ST/$f" "$f" && echo "  OK $f in, byte for byte" || { echo "  X $f did not go in. Tell Claude."; concrete_lock schg; pause 1; }; done
if [ -z "$FIXWAIT" ]; then pkill -f "$(pwd)/tools/sub-auditor.cjs" 2>/dev/null; sleep 1; (nohup node tools/sub-auditor.cjs >/dev/null 2>&1 &); fi; echo "  OK - the sub-auditor restarted"
python3 tools/rule-anchors.py --add >/dev/null 2>&1; echo "  OK your words anchored"
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
python3 tools/save-her.py "after-fix571" >/dev/null && echo "  OK fresh whole save"
concrete_lock schg
python3 tools/umpire-stamp.py >/dev/null 2>&1
git add -A >/dev/null 2>&1; git add -f tools data/approved-model.json data/golden-baseline.json data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/ALLOW-REMOVE.json data/spine-lock.json >/dev/null 2>&1; git rm -q --cached tools/cloudflared tools/cloudflared.tgz >/dev/null 2>&1
git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "fix571: weekend pink 25, a flat \$25 overlay on both books, temporary ($R)" >/dev/null 2>&1
U=$(python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('SAFE' if v.get('ok') else 'NOT SAFE - ' + str(v.get('why'))[:160])")
CS=$(python3 tools/cornerstones.py 2>&1 | tail -1 | cut -c1-40)
echo "  checking her breaker and spine..."; sleep ${FIXWAIT:-40}
B=$(python3 -c "import json;b=json.load(open('data/breaker.json'));print('ON' if not b.get('tripped') and not b.get('entriesOff') else 'TRIPPED: ' + str(b.get('tripped')))" 2>/dev/null || echo "?")
E=$(python3 -c "import json;print('ON' if json.load(open('data/halt.json')).get('off') is False else 'OFF')")
SP=$(python3 -c "import json;s=json.load(open('data/spine-lock-status.json'));print('OK' if s.get('ok') else 'DRIFT')" 2>/dev/null || echo "?")
echo ""; echo "=================================================="
echo "   GOLDEN:       $G"; echo "   UMPIRE:       $U"; echo "   ENTRIES:      $E   (ENTRIES-ON.command turns her back on if OFF)"; echo "   BREAKER:      $B"; echo "   SPINE:        $SP"; echo "   5M WALL:      $(python3 tools/five5m-wall.py | tail -1 | cut -c1-50)"; echo "   CORNERSTONES: $CS"
echo "   PINK FLAG25:  $(node tools/pink-flag-25-test.cjs 2>&1 | tail -1 | cut -c1-60)"
echo "   BEHAVIOUR:    $(node tools/behaviour-umpire.cjs 2>&1 | tail -1 | cut -c1-50)"
echo "=================================================="
pause 0
