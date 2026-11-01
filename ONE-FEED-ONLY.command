#!/bin/bash
# fix533. Love Oct 30 2026 4:56 PM PT: "no second feed, no two feeds agree, no leftover paper-lane logic that can affect live."
# Run DELETE-THE-INDEX.command then THE-CANDLE-FLIP.command first - this click checks for them.
cd "$(dirname "$0")"
. tools/concrete.sh
SD=data/STAGED-CHANGE-one-feed-533
ST=$SD/files
F=(src/lib/desk/engine.ts tools/cornerstones.py)
pause() { sudo -k; echo ""; read -n 1 -s -r -p "Press any key to close."; exit "${1:-0}"; }
live() { python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')"; }
echo ""
echo "=== One feed only ==="
echo ""
echo "  What changes, in plain words:"
echo "   OUT   the Oct 3 Vantage paper lanes (the confirm study + the SOLE-V Vantage-lines lane): never"
echo "         called again. Their files stay on disk. Pepperstone alone feeds every book she runs."
echo "   SAME  every rule, every wall, the flip, your deduction. 5M untouched."
echo "   IN    CORNERSTONE 57 ONE FEED - the umpire goes OUT if a second feed ever feeds a book again."
echo ""
while read -r h f; do [ "$(shasum -a 256 "$ST/$f" | cut -c1-16)" = "$h" ] || { echo "STOP: $f staged copy changed since this was built - nothing changed. Tell Claude."; pause 1; }; done < $SD/base16.txt
while read -r h f; do [ "$(shasum -a 256 "$f" | cut -c1-16)" = "$h" ] || { echo "STOP: $f is not where this click expects it - nothing changed. Tell Claude."; pause 1; }; done < $SD/live-base16.txt
for f in "${F[@]}"; do echo "  ~ $f  ($(diff "$f" "$ST/$f" | grep -c '^<') lines out, $(diff "$f" "$ST/$f" | grep -c '^>') lines in)"; done
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
python3 tools/save-her.py "before-fix533" >/dev/null && echo "  OK saved her first"
sudo chflags noschg,nouchg "${F[@]}" data/LOVE-REQUESTS.jsonl data/golden-baseline.json data/CORNERSTONE-MANIFEST.json data/spine-lock.json 2>/dev/null
R=$(python3 tools/requests.py add '{"words": "Love Oct 30 2026 4:56 PM PT: \"no second feed, no two feeds agree, no leftover paper-lane logic that can affect live.\" + 4:39 PM: \"drop me a command to get her on one feed please\" + 5:14 PM: \"i would like individual commands for individual elements\"", "what": "fix533 ONE FEED: the Oct 3 Vantage confirm study tick and the 5M SOLE-V Vantage-lines lane are retired in engine.ts - kept on file in confirm.ts and twin.ts, never called; Pepperstone alone feeds every book she runs; cornerstone 57. Run DELETE-THE-INDEX and THE-CANDLE-FLIP first.", "books": ["all live books"], "proof": [{"code": "src/lib/desk/engine.ts", "has": "fix530"}, {"code": "tools/cornerstones.py", "has": "57. ONE FEED"}]}' | grep -oE 'R[0-9]{3,4}' | tail -1)
[ -n "$R" ] || { echo "  X Your words could not be recorded - nothing changed. Tell Claude."; concrete_lock schg; pause 1; }
echo "  OK your words recorded as $R"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $R fix533 (Love, ONE-FEED-ONLY.command): the Oct 3 Vantage paper lanes retired, kept on file - Pepperstone alone feeds every book; cornerstone 57" >> data/overnight-fixes.log
python3 - "$R" "$ST" <<'PYALLOW'
import json, sys
R, ST = sys.argv[1], sys.argv[2]; p = "data/ALLOW-REMOVE.json"; A = json.load(open(p)); n = 0
for f in ("src/lib/desk/engine.ts", "tools/cornerstones.py"):
    new = set(l.strip() for l in open(ST + "/" + f, encoding="utf8"))
    for l in open(f, encoding="utf8"):
        s = l.strip()
        if s and s not in new: A.append({"what": s, "R": R, "why": "fix533 (her word, one feed): the Vantage study tick and SOLE-V lane leave the engine - both files stay on disk, never called"}); n += 1
json.dump(A, open(p, "w"), indent=2, ensure_ascii=False)
print(f"  OK your words name the {n} lines that change (ALLOW-REMOVE)")
PYALLOW
for f in "${F[@]}"; do M=$(stat -f %Lp "$f"); chmod u+w "$f" 2>/dev/null; cp "$ST/$f" "$f" && chmod "$M" "$f"; cmp -s "$ST/$f" "$f" && echo "  OK $f in, byte for byte" || { echo "  X $f did not go in. Tell Claude."; concrete_lock schg; pause 1; }; done
echo "  OK - no door-file change for the sub-auditor"
python3 - "$R" <<'PY'
import json, hashlib, os, datetime, sys
R = sys.argv[1]
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
F = ("engine.ts",)
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
python3 tools/save-her.py "after-fix533" >/dev/null && echo "  OK fresh whole save"
concrete_lock schg
python3 tools/umpire-stamp.py >/dev/null 2>&1
git add -A >/dev/null 2>&1; git add -f tools data/approved-model.json data/golden-baseline.json data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/ALLOW-REMOVE.json data/spine-lock.json >/dev/null 2>&1; git rm -q --cached tools/cloudflared tools/cloudflared.tgz >/dev/null 2>&1
git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "fix533: one feed only ($R)" >/dev/null 2>&1
U=$(python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('SAFE' if v.get('ok') else 'NOT SAFE - ' + str(v.get('why'))[:160])")
CS=$(python3 tools/cornerstones.py 2>&1 | tail -1 | cut -c1-40)
echo "  checking her breaker and spine..."; sleep ${FIXWAIT:-40}
B=$(python3 -c "import json;b=json.load(open('data/breaker.json'));print('ON' if not b.get('tripped') and not b.get('entriesOff') else 'TRIPPED: ' + str(b.get('tripped')))" 2>/dev/null || echo "?")
E=$(python3 -c "import json;print('ON' if json.load(open('data/halt.json')).get('off') is False else 'OFF')")
SP=$(python3 -c "import json;s=json.load(open('data/spine-lock-status.json'));print('OK' if s.get('ok') else 'DRIFT')" 2>/dev/null || echo "?")
echo ""; echo "=================================================="
echo "   GOLDEN:       $G"; echo "   UMPIRE:       $U"; echo "   ENTRIES:      $E   (ENTRIES-ON.command turns her back on if OFF)"; echo "   BREAKER:      $B"; echo "   SPINE:        $SP"; echo "   5M WALL:      $(python3 tools/five5m-wall.py | tail -1 | cut -c1-50)"; echo "   CORNERSTONES: $CS"
echo "   BEHAVIOUR:    $(node tools/behaviour-umpire.cjs 2>&1 | tail -1 | cut -c1-50)"
echo "=================================================="
pause 0
