# Installs fix465 (R206/R207/R209/R210/R211) AT the next quarter-hour with the umpire's verdict pre-stamped (tools/prestamp.py). Every book except the delayed book (recon-dly / recon-dlyk): a hard 33% thirds share, and every non-delayed recon book meets the pink (15/20, never into an unbroken pink both sides) and 33% walls at the door and in the read.
# Copies bandlock.ts, recon.ts only if each is still exactly the copy fix465 was built on.
import json, hashlib, os, shutil, datetime, time, sys, subprocess
os.chdir(os.environ.get("AUR_ROOT") or "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
REAL = "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius/data/STAGED-fix465"
B = REAL if os.path.isdir(REAL) else "data/STAGED-fix465"; D = "src/lib/desk"; PRE = bool(os.environ.get("AUR_PRESTAMP")); F = ['bandlock.ts', 'recon.ts']
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
if not PRE and subprocess.run(["pgrep", "-f", "install466.py"], capture_output=True).returncode == 0: sys.exit("the other install (install466.py) is still waiting to land - let it finish (DONE), then click this one. Nothing changed.")
for f in F:
    if h16(f"{D}/{f}") != h16(f"{B}/{f}.base"): sys.exit(f"{f} changed since fix465 was built - NOT installing (nothing changed). Tell Claude.")
    g = subprocess.run([sys.executable, "tools/no-removal-gate.py", f"{D}/{f}", f"{B}/{f}"], capture_output=True, text=True); print(g.stdout.strip().split("\n")[0], flush=True)
    if g.returncode != 0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
import tempfile
TD = tempfile.mkdtemp(prefix="chk-")
for p in os.listdir(D):
    if p.endswith(".ts"): shutil.copyfile(f"{D}/{p}", f"{TD}/{p}")
for f in F: shutil.copyfile(f"{B}/{f}", f"{TD}/{f}")
r = subprocess.run(["node", "tools/check-her-rules.cjs", TD, "--no5m"], capture_output=True, text=True, env={**os.environ, "AUR_ROOT": os.getcwd()})
shutil.rmtree(TD, ignore_errors=True)
if r.returncode != 0: print(r.stdout[-3000:]); sys.exit("CHECK-HER-RULES is not all ✓ on the new code - nothing installed")
if not PRE:
    print("Saving her first...", flush=True); print(subprocess.run([sys.executable, "tools/save-her.py", "before-fix465"], capture_output=True, text=True).stdout.strip().split("\n")[-1], flush=True)
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

u = open("tools/umpire.py", encoding="utf8").read()
if "check-her-rules.cjs\", \"--no5m" not in u:
    a = "if rB441.returncode != 0: ok = False\n"
    add = 'rCH465 = subprocess.run(["node", "tools/check-her-rules.cjs", "--no5m"], capture_output=True, text=True)  # R204/R210 (Love Oct 29 2026 1:26 PM PT: "check every single line of code that it FUNCTIONS. BOTH. WAYS. FOR ALL. BOOKS. NO MORE LOOPHOLES.")\nprint(("SAFE   " if rCH465.returncode == 0 else "OUT    ") + "tools/check-her-rules.cjs --no5m  " + ((rCH465.stdout.strip().split("\\n") or [""])[-1]))\nif rCH465.returncode != 0: ok = False\n'
    if u.count(a) == 1 and not os.environ.get("NO_UMPIRE_CHECK"):
        um = os.stat("tools/umpire.py").st_mode; os.chmod("tools/umpire.py", 0o644); open("tools/umpire.py", "w", encoding="utf8").write(u.replace(a, a + add)); os.chmod("tools/umpire.py", um & 0o777)
RB = open("LOVE-RULEBOOK.md", encoding="utf8").read()
if "0t. CORNERSTONE - EVERY RULE BOTH SIDES, EVERY BOOK BUT THE DELAYED BOOK" not in RB:
    fmr = os.stat("LOVE-RULEBOOK.md").st_mode; os.chmod("LOVE-RULEBOOK.md", 0o644)
    open("LOVE-RULEBOOK.md", "a", encoding="utf8").write('\n0t. CORNERSTONE - EVERY RULE BOTH SIDES, EVERY BOOK BUT THE DELAYED BOOK (Oct 29 2026 1:22-1:26 PM PT, R206-R212, fix465/fix466). Love: "both sides. not just longs. not just shorts. pink as well. both sides. all books. aside from delayed. do not ever use that as a loophole again." + "implement the 33% and pink tolerances BOTH SIDES. ON ALL BOOKS. ASIDE FROM DELAYED." + "including 5M". A hard 33% thirds (door, read, launch) and every pink rule both sides (15% gold / 20% BTC, never into an unbroken pink, the downslope and upslope holds, the pink in the read) on main, rejection, every copy and the walled-off 5M; the delayed book keeps its own shares. tools/check-her-rules.cjs (in the umpire; CHECK-HER-RULES.command) checks every row long and short.\n')
    os.chmod("LOVE-RULEBOOK.md", fmr & 0o777)
if PRE: print("pre-stamp copy: installed"); sys.exit(0)
l = subprocess.run([sys.executable, "tools/prestamp.py", "land"], capture_output=True, text=True); print(l.stdout.strip(), flush=True)
os.makedirs("data/BACKUPS/fix465", exist_ok=True)
for f in F + ["install465.py"]: shutil.copyfile(f"{B}/{f}", f"data/BACKUPS/fix465/{f}")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
open("data/overnight-fixes.log", "a").write(f"{now} fix465 INSTALLED by Love's double-click (R206/R207/R209/R210/R211, Love Oct 29 2026 1:24 PM PT: \"both sides. not just longs. not just shorts. pink as well. both sides. all books. aside from delayed.\"): Every book except the delayed book (recon-dly / recon-dlyk): a hard 33% thirds share, and every non-delayed recon book meets the pink (15/20, never into an unbroken pink both sides) and 33% walls at the door and in the read. {l.stdout.strip()[:60]} {H}\n")
print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for f in F:
    for n, x in enumerate(open(f"{D}/{f}", encoding="utf8"), 1):
        for k, v in {'if (!DLY465.has(String(G.__curBook465': 'HARD 33% FOR EVERY BOOK BUT THE DELAYED BOOK (lockPctFor)', 'if (book !== "recon-tog" && book !== "recon-rej" && !DLY465.has(book))': 'EVERY OTHER BOOK: pink both sides + her 33% at the door', 'lane !== "recon-dly" && lane !== "recon-dlyk") { try { if (thirdsRead463(': 'EVERY OTHER BOOK: her 33% + the pink in the READ', 'G.__curBook465 = ownerBook(': "THE WIRE judges with the owning book's share"}.items():
            if k in x: print(f"IN ✓  {v}: src/lib/desk/{f}:{n}")
