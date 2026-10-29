# Installs fix463 (R191/R192, Love Oct 29 2026 12:38 PM PT: "no flip. independent calls. she does not get one call per window. only once she has executed a trade." + Oct 27 "ONE EXECUTED TRADE
# PER WINDOW ... NO TRADE EXECUTED - FREEEE TO TRADE.") into recon.ts AT the next quarter-hour with the umpire's verdict pre-stamped (tools/prestamp.py). Main + rejection only.
import json, hashlib, os, shutil, datetime, time, sys, subprocess
os.chdir(os.environ.get("AUR_ROOT") or "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
REAL = "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius/data/STAGED-fix463"
B = REAL if os.path.isdir(REAL) else "data/STAGED-fix463"; D = "src/lib/desk"; PRE = bool(os.environ.get("AUR_PRESTAMP"))
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
if h16(f"{D}/recon.ts") != h16(f"{B}/recon.ts.base"): sys.exit("recon.ts changed since fix463 was built - NOT installing (nothing changed). Tell Claude.")
g = subprocess.run([sys.executable, "tools/no-removal-gate.py", f"{D}/recon.ts", f"{B}/recon.ts"], capture_output=True, text=True)
print(g.stdout.strip().split("\n")[0], flush=True)
if g.returncode != 0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
r = subprocess.run(["node", f"{B}/independent-calls-test-463.cjs", f"{B}/recon.ts"], capture_output=True, text=True, env={**os.environ, "AUR_ROOT": os.getcwd()})
if r.returncode != 0: print(r.stdout); sys.exit("the 12:31 PM gold replay did not pass - nothing installed")
if not PRE:
    print("Saving her first...", flush=True); print(subprocess.run([sys.executable, "tools/save-her.py", "before-fix463-independent-calls"], capture_output=True, text=True).stdout.strip().split("\n")[-1], flush=True)
    print("The umpire is checking the NEW code on a private copy first (~1 min)...", flush=True)
    p = subprocess.run([sys.executable, "tools/prestamp.py", "run", os.path.abspath(__file__)], capture_output=True, text=True); print(p.stdout.strip()[-400:], flush=True)
    if p.returncode != 0: sys.exit("the umpire did not call the new code SAFE - nothing installed")
    T = (int(time.time()) // 900 + 1) * 900
    print(f'Waiting {int(T - time.time())} s - lands AT {datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")}...', flush=True)
    time.sleep(0 if os.environ.get("AUR5_DRY") else max(0, T - time.time()))
m = os.stat(D).st_mode; os.chmod(D, 0o755); p = f"{D}/recon.ts"; fm = os.stat(p).st_mode; os.chmod(p, 0o644)
shutil.copyfile(f"{B}/recon.ts", p + ".tmp"); os.replace(p + ".tmp", p); os.chmod(p, fm & 0o777); os.chmod(D, m & 0o777)
shutil.copyfile(f"{B}/independent-calls-test-463.cjs", "tools/independent-calls-test-463.cjs")
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
if "independent-calls-test-463" not in u:
    a = "if rB441.returncode != 0: ok = False\n"
    add = 'rI463 = subprocess.run(["node", "tools/independent-calls-test-463.cjs"], capture_output=True, text=True)  # fix463 (R191, Love Oct 29 2026 12:38 PM PT: "no flip. independent calls ... only once she has executed a trade")\nprint(("SAFE   " if rI463.returncode == 0 else "OUT    ") + "tools/independent-calls-test-463.cjs  " + ((rI463.stdout.strip().split("\\n") or [""])[-1]))\nif rI463.returncode != 0: ok = False\n'
    if u.count(a) == 1:
        um = os.stat("tools/umpire.py").st_mode; os.chmod("tools/umpire.py", 0o644); open("tools/umpire.py", "w", encoding="utf8").write(u.replace(a, a + add)); os.chmod("tools/umpire.py", um & 0o777)
RB = open("LOVE-RULEBOOK.md", encoding="utf8").read()
if "0r. CORNERSTONE - INDEPENDENT CALLS" not in RB:
    fmr = os.stat("LOVE-RULEBOOK.md").st_mode; os.chmod("LOVE-RULEBOOK.md", 0o644)
    open("LOVE-RULEBOOK.md", "a", encoding="utf8").write('\n0r. CORNERSTONE - INDEPENDENT CALLS; NO FLIPS; THE WINDOW CLOSES ONLY ON AN EXECUTED TRADE (Oct 29 2026 12:38 PM PT, R191/R192, fix463; Oct 27 R008/R016/R018). Love: "oh my god bro. i told you. no flip. independent calls. she does not get one call per window. only once she has executed a trade." + Oct 27: "YES. ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED. EXECUTED. NO TRADE EXECUTED - FREEEE TO TRADE." Main + rejection: her read never calls a long in the top 33% / a short in the bottom 33% of the session-band channel (R193, 12:41 PM: \"in the read itself. / not just the walls that go out please\"); a flipped read is never her call; every fresh read stands on its own and replaces an unfilled call (same side included); only a fill or an order on the wire closes the window. tools/independent-calls-test-463.cjs (in the umpire) runs her real call logic and fails if any of it comes undone.\n')
    os.chmod("LOVE-RULEBOOK.md", fmr & 0o777)
if PRE: print("pre-stamp copy: installed"); sys.exit(0)
l = subprocess.run([sys.executable, "tools/prestamp.py", "land"], capture_output=True, text=True); print(l.stdout.strip(), flush=True)
os.makedirs("data/BACKUPS/fix463", exist_ok=True)
for f in ["recon.ts", "independent-calls-test-463.cjs", "install463.py"]: shutil.copyfile(f"{B}/{f}", f"data/BACKUPS/fix463/{f}")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
open("data/overnight-fixes.log", "a").write(f"{now} fix463 INSTALLED by Love's double-click (R191/R192, Love Oct 29 2026 12:38 PM PT: \"no flip. independent calls. she does not get one call per window. only once she has executed a trade.\"): main + rejection - no flipped read is ever her call; every fresh read replaces an unfilled call; only an executed trade closes the window; pre-stamped SAFE ({l.stdout.strip()[:60]}). {H}\n")
print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for n, x in enumerate(open(p, encoding="utf8"), 1):
    if "fix463" in x and "thirdsRead463(sessionLines(ax, id), spot, firstTog.side)" in x: print(f"IN ✓  1. her thirds IN THE READ - main: src/lib/desk/recon.ts:{n}")
    if "fix463" in x and "thirdsRead463(sessionLines(ax, id), spot, lookRM.side)" in x: print(f"IN ✓  1. her thirds IN THE READ - rejection: src/lib/desk/recon.ts:{n}")
    if "fix463" in x and "isFlip463(look.label)) return false" in x: print(f"IN ✓  2. NO FLIPS - a flipped read is never her call: src/lib/desk/recon.ts:{n}")
    if "fix463" in x and "freshSameSide463(lane, String" in x: print(f"IN ✓  3. INDEPENDENT CALLS - every fresh read replaces an unfilled call; only an executed trade closes the window: src/lib/desk/recon.ts:{n}")
print("\nReplay of 12:31 PM gold on her LIVE code:")
print(subprocess.run(["node", "tools/independent-calls-test-463.cjs"], capture_output=True, text=True).stdout.strip())
