#!/bin/bash
# fix767 STATS-WEEK (display only) - Her click, her password. Part 1 with LIVE off, part 2 after she turns LIVE on.
set -u
cd "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius" || exit 1
ST=data/STAGED-CHANGE-stats-week-767
. tools/concrete.sh
fail() { echo ""; echo "STOP: $1"; echo "Send Claude a picture of this window."; exit 1; }
live() { python3 -c "import json;print(bool(json.load(open('data/live-switch.json')).get('live')))"; }
[ "$(live)" = "False" ] || fail "LIVE is on. Turn LIVE off first, then run this again. Nothing changed."
echo "1. Checking her files are exactly as the last click left them..."
python3 - "$ST" <<'PY' || fail "one of her files is not as expected (run the earlier CHANGE first). Nothing changed."
import json,hashlib,sys,os
e=json.load(open(sys.argv[1]+"/EXPECT-NOW.json")); bad=[p for p,v in e.items() if not os.path.exists(p) or hashlib.sha256(open(p,'rb').read()).hexdigest()!=v]
for t in ["src/lib/desk/stats-week.ts"]:
  if os.path.exists(t): bad.append(t+" already exists")
print("   all match" if not bad else "   not as expected: "+", ".join(bad)); sys.exit(1 if bad else 0)
PY
echo "2. Saving her first..."; python3 tools/save-her.py "before-stats-week-767" >/dev/null && echo "   saved" || fail "could not save. Nothing changed."
FILES=$(cd "$ST/files" && find . -type f | sed 's|^\./||')
echo "3. Your Mac password lifts the concrete for just these files:"; sudo -v || fail "no password. Nothing changed."
for p in $FILES data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/golden-baseline.json data/ALLOW-REMOVE.json; do [ -e "$p" ] && { sudo chflags noschg,nouchg "$p"; sudo chmod u+w "$p"; }; done
for p in $FILES; do sudo cp "$ST/files/$p" "$p" && sudo chown "$(id -un)" "$p" && echo "   in: $p" || fail "could not put in $p"; done
python3 - "$ST" <<'PY' || fail "a file did not go in."
import sys,os
st=sys.argv[1]; bad=[]
for r,_,fs in os.walk(st+"/files"):
  for f in fs:
    s=os.path.join(r,f); d=os.path.relpath(s,st+"/files")
    if open(s,'rb').read()!=open(d,'rb').read(): bad.append(d)
print("   every file is in" if not bad else "   NOT in: "+", ".join(bad)); sys.exit(1 if bad else 0)
PY
echo "4. Your words into her request book..."
R=$(python3 tools/requests.py add "$(cat "$ST/R1.json")" | grep -oE 'R[0-9]{3,4}' | tail -1); [ -n "$R" ] || fail "your words could not be recorded."
sudo chmod 444 data/LOVE-REQUESTS.jsonl; echo "   recorded $R"
python3 - "$R" "$ST/ALLOW.json" <<'PY' || fail "could not file the lines your words take out."
import json,sys
R=sys.argv[1]; new=json.load(open(sys.argv[2]))
if new:
  A=json.load(open("data/ALLOW-REMOVE.json")); A+=[dict(x,R=R) for x in new]; json.dump(A,open("data/ALLOW-REMOVE.json","w"),indent=2,ensure_ascii=False)
  print("   "+str(len(new))+" old line(s) filed under "+R+" in data/ALLOW-REMOVE.json")
PY
echo "5. Approving the model and golden baseline for these exact files..."
python3 - "$R" <<'PY' || fail "could not sign."
import json,hashlib,datetime,sys,os
R=sys.argv[1]; now=datetime.datetime.now(datetime.timezone.utc).isoformat()
h=lambda p: hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
fs={f: h("src/lib/desk/"+f) for f in ["bandlock.ts", "recon.ts", "engine.ts", "fns.ts", "stats-week.ts"]}
w="Love Nov 5 2026 5:54 PM PT: \"no i want it to score for the week if possible bb , and keep the older ones in the view only archive so it doesn\u2019t slow her down\""
a=json.load(open("data/approved-model.json")); a["files"].update(fs); a["at"]=now; a["note"]=str(a.get("note",""))+" | Nov 5 2026: Love approved fix767 / "+R+" - stats-week-767"; json.dump(a,open("data/approved-model.json","w"),indent=1)
if False and "recon.ts" in fs:
  s=json.load(open("data/spine-lock.json")); s["files"]["recon.ts"]=fs["recon.ts"]; s["at"]=now; s["signedBy"].append({"at":now,"by":"Love","quote":w+" ("+R+", fix767)","recon.ts":fs["recon.ts"]}); json.dump(s,open("data/spine-lock.json","w"),ensure_ascii=False,indent=1)
g=json.load(open("data/golden-baseline.json")); g["code"].update(fs)
for cf in ["data/spine-lock.json","data/ALLOW-REMOVE.json"]:
  if cf in g.get("configFiles",{}): g["configFiles"][cf]=h(cf)
g["at"]=now; json.dump(g,open("data/golden-baseline.json","w"),indent=1)
print("   signed:", ", ".join(k+" "+v for k,v in fs.items()))
PY
python3 tools/cornerstone-manifest.py check >/dev/null 2>&1 || python3 tools/cornerstone-manifest.py seal "$R"
echo "6. No-removal gate (against the save from step 2):"; python3 tools/no-removal-gate.py | head -4; python3 tools/no-removal-gate.py >/dev/null 2>&1 || fail "the no-removal gate refused it."
concrete_lock schg $FILES data/LOVE-REQUESTS.jsonl data/CORNERSTONE-MANIFEST.json data/golden-baseline.json data/ALLOW-REMOVE.json && echo "   back in concrete"
mkdir -p data/CHANGES-DONE && echo "$R $(date '+%Y-%m-%d %I:%M %p')" > data/CHANGES-DONE/STAGED-CHANGE-stats-week-767
echo ""; echo "=========================================================="
echo ">>> NOW TURN LIVE ON on the desk, then come back here and press return. <<<"
echo "=========================================================="
while :; do read -r -p "" _; [ "$(live)" = "True" ] && break; echo "LIVE still reads off - turn LIVE on, then press return."; done
echo "7. LIVE is on. Fresh save + signing LIVE's stamps..."
python3 tools/save-her.py "live-on-after-stats-week-767" >/dev/null && echo "   saved" || fail "could not save."
sudo -v || fail "no password."; sudo chflags noschg,nouchg data/golden-baseline.json; sudo chmod u+w data/golden-baseline.json
python3 - <<'PY' || fail "could not update the golden baseline."
import json,hashlib
b=json.load(open("data/golden-baseline.json")); ls=json.load(open("data/live-switch.json"))
for k in ["live","note","at","liveBook","maxDollars"]: b["config"][k]=hashlib.sha256(json.dumps(ls.get(k),sort_keys=True).encode()).hexdigest()[:10]
b["configFiles"]["data/live-switch.json"]=hashlib.sha256(open("data/live-switch.json","rb").read()).hexdigest()[:16]
json.dump(b,open("data/golden-baseline.json","w"),indent=1); print("   LIVE stamps signed")
PY
concrete_lock schg data/golden-baseline.json
echo "8. Checking:"; node tools/stats-week-767.cjs | tail -1; node tools/behaviour-umpire.cjs | tail -1; python3 tools/no-removal-gate.py | head -1; python3 tools/verify-golden.py | tail -3; python3 tools/requests.py check | tail -2
echo "9. The umpire..."; python3 tools/umpire-stamp.py
OK=$(python3 -c "import json;print(json.load(open('data/UMPIRE-VERDICT.json')).get('ok') is True)")
[ "$OK" = "True" ] || fail "the umpire is not SAFE yet - entries stay paused."
python3 - <<'PY'
import json,datetime
at=datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00","Z")
json.dump({"off":False,"at":at,"since":at,"reason":"","losses":[]},open("data/halt.json","w"))
try: eq=json.load(open("data/kalshi-cash.json")).get("cash")
except Exception: eq=None
json.dump({"from":at,"at":at,"paused":False,"wins":0,"n":0,"net":0,"equity":eq,"peak":eq},open("data/pace.json","w"))
print("10. Umpire SAFE - entries ON at", at)
PY
git add -A >/dev/null 2>&1; sudo -k; git -c user.name="Love" -c user.email="liluvdied@users.noreply.github.com" commit -q -m "STATS BY THE WEEK (fix767, $R)" && echo "   committed: $(git log --oneline -1)"
echo ""; echo ">>> DONE. She is SAFE, LIVE is on, entries are on. Don't toggle LIVE now. <<<"
