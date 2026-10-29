# Installs fix468 AT the next quarter-hour with the umpire's verdict pre-stamped (tools/prestamp.py). THE 5M MIRRORS, in her own files: NO LONGS IN THE TOP RUNG (over the BTC session +2σ); no long breaking the pink UP with the Bollinger upper within $100 above; the BTC green/red zones at 55% both sides (no short bottom 55% green->pink, no long top 55% pink->red). The fix373 re-aim is NOT put on her. 5M wall refrozen on R215.
# Copies bandlock5m27.ts, recon5m.ts only if each is still exactly the copy fix466 landed (fix468 was built on it); adds the 5M mirror rows to tools/check-her-rules.cjs.
import json, hashlib, os, shutil, datetime, time, sys, subprocess
os.chdir(os.environ.get("AUR_ROOT") or "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
REAL = "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius/data/STAGED-fix468"
B = REAL if os.path.isdir(REAL) else "data/STAGED-fix468"; D = "src/lib/desk"; PRE = bool(os.environ.get("AUR_PRESTAMP")); F = ["bandlock5m27.ts", "recon5m.ts"]
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
for o in ['install465.py', 'install466.py', 'install467.py']:
    if not PRE and subprocess.run(["pgrep", "-f", o], capture_output=True).returncode == 0: sys.exit(f"the other install ({o}) is still waiting to land - let it finish (DONE), then click this one. Nothing changed.")
for f in F:
    if h16(f"{D}/{f}") != h16(f"{B}/{f}.base"): sys.exit(f"{f} changed since fix468 was built - NOT installing (nothing changed). Tell Claude.")
    g = subprocess.run([sys.executable, "tools/no-removal-gate.py", f"{D}/{f}", f"{B}/{f}"], capture_output=True, text=True); print(g.stdout.strip().split("\n")[0], flush=True)
    if g.returncode != 0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
import tempfile
TD = tempfile.mkdtemp(prefix="chk-")
for p in os.listdir(D):
    if p.endswith(".ts"): shutil.copyfile(f"{D}/{p}", f"{TD}/{p}")
for f in F: shutil.copyfile(f"{B}/{f}", f"{TD}/{f}")
ROWS = open(f"{B}/rows468.cjs.txt", encoding="utf8").read(); CK = open("tools/check-her-rules.cjs", encoding="utf8").read()
if '5M MIRRORS (fix468' not in CK: CK = CK.replace("// print\n", ROWS + "// print\n", 1)
open(f"{TD}/chk.cjs", "w", encoding="utf8").write(CK)
r = subprocess.run(["node", f"{TD}/chk.cjs", TD, "--only5m"], capture_output=True, text=True, env={**os.environ, "AUR_ROOT": os.getcwd()})
shutil.rmtree(TD, ignore_errors=True)
if r.returncode != 0: print(r.stdout[-3000:]); sys.exit("CHECK-HER-RULES is not all ✓ on the new code - nothing installed")
if not PRE:
    print("Saving her first...", flush=True); print(subprocess.run([sys.executable, "tools/save-her.py", "before-fix468"], capture_output=True, text=True).stdout.strip().split("\n")[-1], flush=True)
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
w5 = subprocess.run([sys.executable, "tools/five5m-wall.py", "refreeze", "R215"], capture_output=True, text=True); print(w5.stdout.strip(), flush=True)
if w5.returncode != 0: print("5M WALL could not refreeze - tell Claude")
CK = open("tools/check-her-rules.cjs", encoding="utf8").read()
if '5M MIRRORS (fix468' not in CK and "// print\n" in CK:
    cm = os.stat("tools/check-her-rules.cjs").st_mode; os.chmod("tools/check-her-rules.cjs", 0o644); open("tools/check-her-rules.cjs", "w", encoding="utf8").write(CK.replace("// print\n", ROWS + "// print\n", 1)); os.chmod("tools/check-her-rules.cjs", cm & 0o777)
u = open("tools/umpire.py", encoding="utf8").read()
if "check-her-rules.cjs\", \"--only5m" not in u:
    a = "if rB441.returncode != 0: ok = False\n"
    add = 'rCH466 = subprocess.run(["node", "tools/check-her-rules.cjs", "--only5m"], capture_output=True, text=True)  # R204/R210 (Love Oct 29 2026 1:26 PM PT: "check every single line of code that it FUNCTIONS. BOTH. WAYS. FOR ALL. BOOKS. NO MORE LOOPHOLES.")\nprint(("SAFE   " if rCH466.returncode == 0 else "OUT    ") + "tools/check-her-rules.cjs --only5m  " + ((rCH466.stdout.strip().split("\\n") or [""])[-1]))\nif rCH466.returncode != 0: ok = False\n'
    if u.count(a) == 1 and not os.environ.get("NO_UMPIRE_CHECK"):
        um = os.stat("tools/umpire.py").st_mode; os.chmod("tools/umpire.py", 0o644); open("tools/umpire.py", "w", encoding="utf8").write(u.replace(a, a + add)); os.chmod("tools/umpire.py", um & 0o777)
RB = open("LOVE-RULEBOOK.md", encoding="utf8").read()
if '0u. CORNERSTONE - EVERY BAND TOLERANCE WORKS BOTH WAYS' not in RB:
    fmr = os.stat("LOVE-RULEBOOK.md").st_mode; os.chmod("LOVE-RULEBOOK.md", 0o644)
    open("LOVE-RULEBOOK.md", "a", encoding="utf8").write('\n0u. CORNERSTONE - EVERY BAND TOLERANCE WORKS BOTH WAYS (Oct 29 2026 1:40 PM PT, R213-R216, fix467/fix468). Love: "bollinger over pink NEEDS A LONG MIRROR. ASSUME EVERY FUCKING BAND TOLERANCEWORKS BOTH WAYS". Every band tolerance has its mirror on every book but the delayed book (the 5M in her own files): top rung / bottom rung, Bollinger within $100 of the pink, the 55% green/red zones. tools/check-her-rules.cjs checks each row long and short.\n')
    os.chmod("LOVE-RULEBOOK.md", fmr & 0o777)
if PRE: print("pre-stamp copy: installed"); sys.exit(0)
l = subprocess.run([sys.executable, "tools/prestamp.py", "land"], capture_output=True, text=True); print(l.stdout.strip(), flush=True)
os.makedirs("data/BACKUPS/fix468", exist_ok=True)
for f in F + ["install468.py"]: shutil.copyfile(f"{B}/{f}", f"data/BACKUPS/fix468/{f}")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
open("data/overnight-fixes.log", "a").write(f"{now} fix468 INSTALLED by Love's double-click (R213/R215/R216, Love Oct 29 2026 1:40 PM PT: \"ASSUME EVERY FUCKING BAND TOLERANCEWORKS BOTH WAYS\" + 11:23 AM: \"those are hard set tolerances for all models\" + 1:23 PM: \"including 5M\"): THE 5M MIRRORS, in her own files: NO LONGS IN THE TOP RUNG (over the BTC session +2σ); no long breaking the pink UP with the Bollinger upper within $100 above; the BTC green/red zones at 55% both sides (no short bottom 55% green->pink, no long top 55% pink->red). The fix373 re-aim is NOT put on her. 5M wall refrozen on R215. {l.stdout.strip()[:60]} {H}\n")
print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for f in F:
    for n, x in enumerate(open(f"{D}/{f}", encoding="utf8"), 1):
        for k, v in {'NO LONGS IN THE TOP RUNG (fix468)': '5M: NO LONGS OVER THE BTC +2σ', 'PINK TO RED (fix468)': '5M: BTC GREEN/RED ZONES 55% BOTH SIDES', 'bbU - ppB <= 100) return false; } // FIVE5M fix468': '5M: NO LONG BREAKING PINK UP WITH THE BOLLINGER $100 ABOVE'}.items():
            if k in x: print(f"IN ✓  {v}: src/lib/desk/{f}:{n}")
