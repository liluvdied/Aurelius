#!/bin/bash
# CHANGE: RULE C OUT of the XRP 5M Poly book (xrp5m961.ts) - Perplexity, Love Nov 8 2026.
# Removes ONE statement (RULE C, fix1004). Nothing else in any file changes. Every step checks itself; any failure puts the file back.
set -u
ROOT="${AUR_ROOT:-$HOME/Desktop/aurelius fixxd <3/Aurelius}"; cd "$ROOT" || { echo "X no desk folder"; exit 1; }
. tools/concrete.sh; cd "$ROOT"
F=src/lib/desk/xrp5m961.ts
h16() { shasum -a 256 "$1" 2>/dev/null | cut -c1-16 || sha256sum "$1" | cut -c1-16; }
echo ""; echo "=== RULE C OUT of the XRP 5M Poly book ==="
echo "   OUT   RULE C (fix1004): 'no long while the 5m is red and under the Bollinger middle / no short while green and over it'"
echo "   SAME  every other rule: colour + push, same side, push off the turn, Bollinger wall, thirds, zones, pink cushion, her wall, the wick exception, \$1, 66c"
echo "   ONLY  src/lib/desk/xrp5m961.ts. No other book reads this code."; echo ""
[ "$(h16 $F)" = "8d966aac56566f7d" ] || [ "$(h16 $F | cut -c1-12)" = "8d966aac5656" ] || { echo "STOP: $F is not the version this change expects ($(h16 $F)) - nothing changed."; exit 1; }
grep -q 'RULE C (fix1004): no' $F || { echo "STOP: RULE C is not in $F - nothing changed."; exit 1; }
LIVE=$(python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')")
if [ "$LIVE" = "ON" ]; then echo "Step 1: turn LIVE OFF in the desk header (her rule: never change a desk file while live)."; while [ "$(python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')")" = "ON" ]; do read -r -p "        Press Enter once LIVE is off... " _; done; echo "  OK - LIVE is off"; fi
read -r -p "Type YES (capitals) and press Enter: " A; [ "$A" = "YES" ] || { echo "Nothing changed."; exit 1; }
[ -n "${AUR_TEST:-}" ] || { echo "Your Mac password (invisible while you type):"; sudo -v || { echo "X no password - nothing changed."; exit 1; }; }
python3 tools/save-her.py "before-rulec-out-perplexity" >/dev/null && echo "  OK saved her first"
mkdir -p perplexity-backups/rulec && cp $F data/golden-baseline.json data/approved-model.json data/ALLOW-REMOVE.json data/LOVE-REQUESTS.jsonl perplexity-backups/rulec/ 2>/dev/null
[ -n "${AUR_TEST:-}" ] || { concrete_unlock data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/golden-baseline.json data/approved-model.json data/ALLOW-REMOVE.json $F 2>/dev/null; sudo chflags noschg,nouchg data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/golden-baseline.json data/approved-model.json data/ALLOW-REMOVE.json $F 2>/dev/null; sudo chmod u+w src/lib/desk $F data/LOVE-REQUESTS.jsonl data/golden-baseline.json data/approved-model.json data/ALLOW-REMOVE.json 2>/dev/null; }
cd "$ROOT"
R=$(python3 tools/requests.py add '{"words": "Love Nov 8 2026 ~6:05 AM PT: \"YES. that\u2019s exactly the bug i was trying to resolve hun i never asked for that in there i want it out\" + 9:43 AM PT: \"she is still skipping valid set ups ... a wick rejection of 10% of the channel width from session band to session band triggers an immediate entry\"", "what": "RULE C OUT of the XRP 5M Poly book (xrp5m961.ts, Perplexity): the fix1004 rule C statement (no long while the 5m is red and under the Bollinger middle / no short while green and over it) is removed - Love never asked for it; it refused the 9:26:51 AM failed break below -2 sigma rejected up on its own and overrode her wick exception. Every other fix1004 cornerstone, wall and the wick exception stay.", "books": ["xrp5m961"], "proof": [{"code": "src/lib/desk/xrp5m961.ts", "lacks": "RULE C (fix1004): no"}, {"code": "src/lib/desk/xrp5m961.ts", "has": "fix1004 XRP-POLY-CORNERSTONES"}]}' | grep -oE 'R[0-9]{3,4}' | tail -1)
undo() { echo "  X $1 - putting everything back."; cp perplexity-backups/rulec/xrp5m961.ts $F; for x in golden-baseline.json approved-model.json ALLOW-REMOVE.json; do cp perplexity-backups/rulec/$x data/$x; done; chmod 644 data/LOVE-REQUESTS.jsonl 2>/dev/null; cp perplexity-backups/rulec/LOVE-REQUESTS.jsonl data/LOVE-REQUESTS.jsonl; [ -n "${R:-}" ] && grep -l "\"id\": \"$R\"" data/VAULT/requests/*.json 2>/dev/null | while read -r q; do chmod 644 "$q"; rm -f "$q"; done; python3 tools/requests.py show >/dev/null 2>&1; [ -n "${AUR_TEST:-}" ] || { cd "$ROOT"; concrete_lock schg; cd "$ROOT"; }; exit 1; }
[ -n "$R" ] || undo "your words could not be recorded"
echo "  OK your words recorded as $R"
python3 - "$R" <<'PY' || undo "the edit did not apply cleanly"
import json, sys, hashlib, datetime, os
R = sys.argv[1]; p = "src/lib/desk/xrp5m961.ts"; s = open(p, encoding="utf8").read()
a = ' if (x.bbMid > 0 && d(x.spot, x.o5) < 0 && d(x.spot, x.bbMid) < 0) why.push(`RULE C (fix1004): no ${s > 0 ? "long while the 5m is red and under" : "short while the 5m is green and over"} the Bollinger middle - "the candle was red and under a bollinger"`);'
assert s.count(a) == 1, "RULE C statement not found exactly once"
old_lines = set(l.strip() for l in s.split("\n")); n = s.replace(a, ""); new_lines = set(l.strip() for l in n.split("\n"))
open(p, "w", encoding="utf8").write(n)
A = json.load(open("data/ALLOW-REMOVE.json", encoding="utf8"))
A.append({"what": "if (x.bbMid > 0 && d(x.spot, x.o5) < 0 && d(x.spot, x.bbMid) < 0) why.push(`RULE C (fix1004)", "R": R, "why": "RULE C out of xrp5m961 (her words): the one statement leaves; the rest of that line stays"})
json.dump(A, open("data/ALLOW-REMOVE.json", "w", encoding="utf8"), indent=2, ensure_ascii=False)
h = hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
q = "data/approved-model.json"; m = json.load(open(q))
if "xrp5m961.ts" in m.get("files", {}): m["files"]["xrp5m961.ts"] = h; m["at"] = datetime.datetime.now(datetime.timezone.utc).isoformat(); json.dump(m, open(q + ".tmp", "w"), indent=1); os.replace(q + ".tmp", q)
g = "data/golden-baseline.json"; t = open(g, encoding="utf8").read(); b = json.loads(t); old = b["code"].get("xrp5m961.ts")
if old: t = t.replace(f'"xrp5m961.ts": "{old}"', f'"xrp5m961.ts": "{h}"', 1); open(g + ".tmp", "w", encoding="utf8").write(t); os.replace(g + ".tmp", g)
print("  OK RULE C out, byte for byte; her golden and model approval signed for it:", h)
PY
grep -q 'RULE C (fix1004): no' $F && undo "RULE C is still in the file"
python3 tools/verify-golden.py | head -3
python3 tools/no-removal-gate.py | head -3
python3 tools/no-removal-gate.py >/dev/null 2>&1 || undo "the no-removal gate refused"
if [ -z "${AUR_TEST:-}" ]; then echo ""; echo "=================================================================="; echo "  Now turn LIVE back ON in the desk header (her checks need LIVE on)."; echo "=================================================================="; while [ "$(python3 -c "import json;print('ON' if json.load(open('data/live-switch.json')).get('live') else 'OFF')")" = "OFF" ]; do read -r -p "        Press Enter once LIVE is back on... " _; done; echo "  OK - LIVE is on"; fi
python3 tools/requests.py check 2>&1 | tail -2
python3 tools/requests.py check >/dev/null 2>&1 || undo "the request book check failed"
[ -f tools/xrp-5m-poly-961.cjs ] && { node tools/xrp-5m-poly-961.cjs >/dev/null 2>&1 && echo "  OK her XRP 5M test passes" || undo "her XRP 5M test failed"; }
python3 tools/cornerstone-manifest.py check >/dev/null 2>&1 || python3 tools/cornerstone-manifest.py seal "$R" | tail -1
[ -f tools/request-lock.py ] && python3 tools/request-lock.py seal "$R" | sed 's/^/  OK /'
[ -n "${AUR_TEST:-}" ] && { echo "TEST MODE: stopping before lock and umpire"; exit 0; }
python3 tools/save-her.py "after-rulec-out-perplexity" >/dev/null && echo "  OK fresh save"
cd "$ROOT"; concrete_lock schg; cd "$ROOT"; echo "  OK locked"
echo "  running the umpire (about 2 minutes)..."; python3 tools/umpire-stamp.py >/dev/null 2>&1
git add $F data/golden-baseline.json data/approved-model.json data/ALLOW-REMOVE.json data/LOVE-REQUESTS.jsonl >/dev/null 2>&1; git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "RULE C out of the XRP 5M Poly book ($R, Perplexity)" >/dev/null 2>&1
python3 -c "import json;v=json.load(open('data/UMPIRE-VERDICT.json'));print('UMPIRE:', 'SAFE' if v.get('ok') else 'NOT SAFE - '+str(v.get('why')))"
echo ""; echo ">>> DONE. LIVE stays on; she trades once the umpire says SAFE. <<<"
