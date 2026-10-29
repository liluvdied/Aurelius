# Installs fix462 (R190 + Love's yes) into recon.ts AT the next quarter-hour with the umpire's verdict pre-stamped (tools/prestamp.py): main + rejection - no read in her wrong
# third (long top 33% / short bottom 33% of the session-band channel), and a real same-side read replaces a thirds-flip label. 5M, delayed book, copies untouched.
import json, hashlib, os, shutil, datetime, time, sys, subprocess
os.chdir(os.environ.get("AUR_ROOT") or "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
REAL = "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius/data/STAGED-fix462"
B = REAL if os.path.isdir(REAL) else "data/STAGED-fix462"; D = "src/lib/desk"; PRE = bool(os.environ.get("AUR_PRESTAMP"))
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
if h16(f"{D}/recon.ts") != h16(f"{B}/recon.ts.base"): sys.exit("recon.ts changed since fix462 was built - NOT installing (nothing changed). Tell Claude.")
g = subprocess.run([sys.executable, "tools/no-removal-gate.py", f"{D}/recon.ts", f"{B}/recon.ts"], capture_output=True, text=True)
print(g.stdout.strip().split("\n")[0], flush=True)
if g.returncode != 0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
r = subprocess.run(["node", f"{B}/thirds-read-test-462.cjs", f"{B}/recon.ts"], capture_output=True, text=True, env={**os.environ, "AUR_ROOT": os.getcwd()})
if r.returncode != 0: print(r.stdout); sys.exit("the 12:31 gold replay did not pass - nothing installed")
if not PRE:
    print("Saving her first...", flush=True); print(subprocess.run([sys.executable, "tools/save-her.py", "before-fix462-thirds-read"], capture_output=True, text=True).stdout.strip().split("\n")[-1], flush=True)
    print("The umpire is checking the NEW code on a private copy first (~1 min)...", flush=True)
    p = subprocess.run([sys.executable, "tools/prestamp.py", "run", os.path.abspath(__file__)], capture_output=True, text=True); print(p.stdout.strip()[-400:], flush=True)
    if p.returncode != 0: sys.exit("the umpire did not call the new code SAFE - nothing installed")
    T = (int(time.time()) // 900 + 1) * 900
    print(f'Waiting {int(T - time.time())} s - lands AT {datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")}...', flush=True)
    time.sleep(0 if os.environ.get("AUR5_DRY") else max(0, T - time.time()))
m = os.stat(D).st_mode; os.chmod(D, 0o755); p = f"{D}/recon.ts"; fm = os.stat(p).st_mode; os.chmod(p, 0o644)
shutil.copyfile(f"{B}/recon.ts", p + ".tmp"); os.replace(p + ".tmp", p); os.chmod(p, fm & 0o777); os.chmod(D, m & 0o777)
shutil.copyfile(f"{B}/thirds-read-test-462.cjs", "tools/thirds-read-test-462.cjs")
def wj(q, o): t = q + ".tmp"; open(t, "w").write(json.dumps(o, indent=2, ensure_ascii=False)); os.replace(t, q)
H = {"recon.ts": h16(p)}
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
if "recon.ts" in sl.get("files", {}): sl["files"]["recon.ts"] = H["recon.ts"]
wj("data/spine-lock.json", sl)
gb = json.load(open("data/golden-baseline.json")); gb["code"]["recon.ts"] = H["recon.ts"]
if "data/spine-lock.json" in gb.get("configFiles", {}): gb["configFiles"]["data/spine-lock.json"] = h16("data/spine-lock.json")
wj("data/golden-baseline.json", gb)
u = open("tools/umpire.py", encoding="utf8").read()
if "thirds-read-test-462" not in u:
    a = "if rB441.returncode != 0: ok = False\n"
    add = 'rT462 = subprocess.run(["node", "tools/thirds-read-test-462.cjs"], capture_output=True, text=True)  # fix462 (R190, Love Oct 29 2026 12:36 PM PT: "there is a session band directly above her")\nprint(("SAFE   " if rT462.returncode == 0 else "OUT    ") + "tools/thirds-read-test-462.cjs  " + ((rT462.stdout.strip().split("\\n") or [""])[-1]))\nif rT462.returncode != 0: ok = False\n'
    if u.count(a) == 1:
        um = os.stat("tools/umpire.py").st_mode; os.chmod("tools/umpire.py", 0o644); open("tools/umpire.py", "w", encoding="utf8").write(u.replace(a, a + add)); os.chmod("tools/umpire.py", um & 0o777)
if PRE: print("pre-stamp copy: installed"); sys.exit(0)
l = subprocess.run([sys.executable, "tools/prestamp.py", "land"], capture_output=True, text=True); print(l.stdout.strip(), flush=True)
os.makedirs("data/BACKUPS/fix462", exist_ok=True)
for f in ["recon.ts", "thirds-read-test-462.cjs", "install462.py"]: shutil.copyfile(f"{B}/{f}", f"data/BACKUPS/fix462/{f}")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
open("data/overnight-fixes.log", "a").write(f"{now} fix462 INSTALLED by Love's double-click (R190 + her yes): main + rejection - no read in her wrong third; a real same-side read replaces a thirds-flip label; pre-stamped SAFE ({l.stdout.strip()[:60]}). {H}\n")
print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for n, x in enumerate(open(p, encoding="utf8"), 1):
    if "fix462" in x and ("thirdsRead462(sessionLines" in x or "flipReplace462(String" in x): print(f"IN ✓  src/lib/desk/recon.ts:{n}")
print(subprocess.run(["node", "tools/thirds-read-test-462.cjs"], capture_output=True, text=True).stdout.strip())
