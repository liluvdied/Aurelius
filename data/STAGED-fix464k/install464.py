# Installs fix464 (R196-R203, Love Oct 29 2026 1:05-1:12 PM PT) AT the next quarter-hour with the umpire's verdict pre-stamped (tools/prestamp.py). Main + rejection only, both sides:
# never short into an unbroken pink (15% gold / 20% BTC), the upslope pink (no short while price climbs over an unbroken pink), and the pink + every band
# tolerance in the read. Copies bandlock.ts / engine.ts / recon.ts only if each is still exactly the copy fix464 was built on.
import json, hashlib, os, shutil, datetime, time, sys, subprocess
os.chdir(os.environ.get("AUR_ROOT") or "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
REAL = "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius/data/STAGED-fix464k"
B = REAL if os.path.isdir(REAL) else "data/STAGED-fix464k"; D = "src/lib/desk"; PRE = bool(os.environ.get("AUR_PRESTAMP")); F = ["bandlock.ts", "engine.ts", "recon.ts"]
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
for f in F:
    if h16(f"{D}/{f}") != h16(f"{B}/{f}.base"): sys.exit(f"{f} changed since fix464 was built - NOT installing (nothing changed). Tell Claude.")
    g = subprocess.run([sys.executable, "tools/no-removal-gate.py", f"{D}/{f}", f"{B}/{f}"], capture_output=True, text=True); print(g.stdout.strip().split("\n")[0], flush=True)
    if g.returncode != 0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
r = subprocess.run(["node", f"{B}/pink-both-sides-test-464.cjs", f"{B}/bandlock.ts", f"{B}/engine.ts", f"{B}/recon.ts"], capture_output=True, text=True, env={**os.environ, "AUR_ROOT": os.getcwd()})
if r.returncode != 0: print(r.stdout); sys.exit("the 1:02 PM replay did not pass - nothing installed")
if not PRE:
    print("Saving her first...", flush=True); print(subprocess.run([sys.executable, "tools/save-her.py", "before-fix464-1pm-short-fix-keep20"], capture_output=True, text=True).stdout.strip().split("\n")[-1], flush=True)
    print("The umpire is checking the NEW code on a private copy first (~1 min)...", flush=True)
    p = subprocess.run([sys.executable, "tools/prestamp.py", "run", os.path.abspath(__file__)], capture_output=True, text=True); print(p.stdout.strip()[-400:], flush=True)
    if p.returncode != 0: sys.exit("the umpire did not call the new code SAFE - nothing installed")
    T = (int(time.time()) // 900 + 1) * 900
    print(f'Waiting {int(T - time.time())} s - lands AT {datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")}...', flush=True)
    time.sleep(0 if os.environ.get("AUR5_DRY") else max(0, T - time.time()))
m = os.stat(D).st_mode; os.chmod(D, 0o755)
for f in F:
    p = f"{D}/{f}"; fm = os.stat(p).st_mode; os.chmod(p, 0o644); shutil.copyfile(f"{B}/{f}", p + ".tmp"); os.replace(p + ".tmp", p); os.chmod(p, fm & 0o777)
os.chmod(D, m & 0o777)
shutil.copyfile(f"{B}/pink-both-sides-test-464.cjs", "tools/pink-both-sides-test-464.cjs")
def wj(q, o): t = q + ".tmp"; open(t, "w").write(json.dumps(o, indent=2, ensure_ascii=False)); os.replace(t, q)
H = {f: h16(f"{D}/{f}") for f in F}
am = json.load(open("data/approved-model.json"))
def walk(o):
    if isinstance(o, dict):
        for k in o:
            if k in H and isinstance(o[k], str): o[k] = H[k]
            else: walk(o[k])
    elif isinstance(o, list):
        for x in o: walk(x)
walk(am); wj("data/approved-model.json", am)
sl = json.load(open("data/spine-lock.json"))
for f in F:
    if f in sl.get("files", {}): sl["files"][f] = H[f]
wj("data/spine-lock.json", sl)
gb = json.load(open("data/golden-baseline.json"))
for f, h in H.items(): gb["code"][f] = h
if "data/spine-lock.json" in gb.get("configFiles", {}): gb["configFiles"]["data/spine-lock.json"] = h16("data/spine-lock.json")
wj("data/golden-baseline.json", gb)
u = open("tools/umpire.py", encoding="utf8").read()
if "pink-both-sides-test-464" not in u:
    a = "if rB441.returncode != 0: ok = False\n"
    add = 'rP464 = subprocess.run(["node", "tools/pink-both-sides-test-464.cjs"], capture_output=True, text=True)  # fix464 (R197-R203, Love Oct 29 2026 1:06 PM PT: "i told you 100 times it\'s for both sides. do what i say.")\nprint(("SAFE   " if rP464.returncode == 0 else "OUT    ") + "tools/pink-both-sides-test-464.cjs  " + ((rP464.stdout.strip().split("\\n") or [""])[-1]))\nif rP464.returncode != 0: ok = False\n'
    if u.count(a) == 1:
        um = os.stat("tools/umpire.py").st_mode; os.chmod("tools/umpire.py", 0o644); open("tools/umpire.py", "w", encoding="utf8").write(u.replace(a, a + add)); os.chmod("tools/umpire.py", um & 0o777)
RB = open("LOVE-RULEBOOK.md", encoding="utf8").read()
if "0s. CORNERSTONE - EVERY RULE BOTH SIDES" not in RB:
    fmr = os.stat("LOVE-RULEBOOK.md").st_mode; os.chmod("LOVE-RULEBOOK.md", 0o644)
    open("LOVE-RULEBOOK.md", "a", encoding="utf8").write('\n0s. CORNERSTONE - EVERY RULE BOTH SIDES; HER TOLERANCES IN THE READ (Oct 29 2026 1:05-1:12 PM PT, R196-R203, fix464). Love: "there is zero instance where she is within 15% of an unbroken pink that she shorts" + "i told you 100 times it\'s for both sides. do what i say." + "dude she was in the bottom 33% of the channel that is not an excuse" + "PLACE THE FUCKING BAND TOLERANCES ON MAIN AND REJECTIONS". Main + rejection: never trade into an unbroken pink either side (15% gold / 20% BTC, band to band, 25c / $8 break); the downslope pink AND the upslope pink (no long under / no short over an unbroken pink after a $2 / $40 move, till it breaks by 25c / $8); every read she books meets her thirds, the pink and every band tolerance first. tools/pink-both-sides-test-464.cjs (in the umpire) replays the 1:02:06 PM gold short.\n')
    os.chmod("LOVE-RULEBOOK.md", fmr & 0o777)
if PRE: print("pre-stamp copy: installed"); sys.exit(0)
l = subprocess.run([sys.executable, "tools/prestamp.py", "land"], capture_output=True, text=True); print(l.stdout.strip(), flush=True)
os.makedirs("data/BACKUPS/fix464", exist_ok=True)
for f in F + ["pink-both-sides-test-464.cjs", "install464.py"]: shutil.copyfile(f"{B}/{f}", f"data/BACKUPS/fix464/{f}")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
open("data/overnight-fixes.log", "a").write(f"{now} fix464 INSTALLED by Love's double-click (R196-R203, Love Oct 29 2026 1:06 PM PT: \"i told you 100 times it's for both sides. do what i say.\" + 1:12 PM \"PLACE THE FUCKING BAND TOLERANCES ON MAIN AND REJECTIONS\"): main + rejection both sides - pink short wall 15/20, upslope pink hold, pink + every band tolerance in the read; 1:02:06 PM gold short replays REFUSED. {l.stdout.strip()[:60]} {H}\n")
print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
names = {"pinkShortWall464(asset, lbR.L": "NEVER SHORT INTO AN UNBROKEN PINK (15% gold / 20% BTC) at her door", "climbHold464((((": "THE UPSLOPE PINK - no short while price climbs over an unbroken pink", "bandLockCheck464(lane, id, look.side": "EVERY BAND TOLERANCE + HER THIRDS + THE PINK IN THE READ (every read main/rejection books)"}
for f in F:
    for n, x in enumerate(open(f"{D}/{f}", encoding="utf8"), 1):
        for k, v in names.items():
            if "fix464" in x and k in x: print(f"IN ✓  {v}: src/lib/desk/{f}:{n}")
print("\nReplay of 1:02:06 PM gold on her LIVE code:")
print(subprocess.run(["node", "tools/pink-both-sides-test-464.cjs"], capture_output=True, text=True).stdout.strip())
