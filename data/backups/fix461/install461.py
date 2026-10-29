# Installs fix461 - THE UMPIRE AT THE WIRE (R185/R186/R187/R189, Love Oct 29 2026 11:46-11:51 AM PT) one minute before the next quarter-hour, so the umpire's first stamp of the new
# code (~20 s) finishes before the next window opens. Patches (never replaces) kalshi-live.server.ts; adds src/lib/desk/umpire-gate.ts, tools/umpire-stamp.py, its test.
import json, hashlib, os, shutil, datetime, time, sys, subprocess
os.chdir(os.environ.get("AUR_ROOT") or "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
B = "data/STAGED-fix461"; D = "src/lib/desk"
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
M = json.load(open(f"{B}/MANIFEST.json"))
for f, h in M["staged"].items():
    if h16(f"{B}/{f}") != h: sys.exit(f"{f} is not the copy that was built and replayed - NOT installing (nothing changed). Tell Claude.")
K = f"{D}/kalshi-live.server.ts"; ks = open(K, encoding="utf8").read()
A1 = 'import { bandLevels, liveOn, loveSkip, maxDollars, noteBlock, recordFire } from "./live-guard";\n'
A2 = '    if ((line?.bookCopy === "recon-tog" || line?.bookCopy === "recon-rej") && line?.gateTest) { sent.__aureliusBlock = "Blocked: main and rejection never skip her walls (fix435)"; return null; } // fix435: no gate-test bypass for main + rejection\n'
if ks.count(A1) != 1 or ks.count(A2) != 1: sys.exit("kalshi-live.server.ts: the spot to hook the umpire in is not there exactly once - NOT installing (nothing changed). Tell Claude.")
if "fix461" in ks or os.path.exists(f"{D}/umpire-gate.ts"): sys.exit("the umpire gate is already in - NOT installing again (nothing changed).")
r = subprocess.run(["node", f"{B}/umpire-gate-test-461.cjs", f"{B}/src/lib/desk/umpire-gate.ts"], capture_output=True, text=True, env={**os.environ, "AUR_ROOT": os.getcwd()})
if r.returncode != 0: print(r.stdout); sys.exit("the gate's replay did not pass - nothing installed")
print("Saving her first...", flush=True); print(subprocess.run([sys.executable, "tools/save-her.py", "before-fix461-umpire-gate"], capture_output=True, text=True).stdout.strip().split("\n")[-1], flush=True)
now = time.time(); T = (int(now) // 900 + 1) * 900 - 60
if T - now < 70: T += 900
print(f'Waiting {int(T - now)} s - lands at {datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")} (1 minute before the quarter-hour, so the umpire\'s first check is done before the next window)...', flush=True)
time.sleep(0 if os.environ.get("AUR5_DRY") else max(0, T - time.time()))
ADD1 = 'void import("./umpire-gate").catch(() => {}); // fix461 (R185/R186, Love Oct 29 2026 11:46 AM PT: "if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out"): the umpire gate starts with the wire\n'
ADD2 = ('    if (line?.bookCopy === "recon-tog" || line?.bookCopy === "recon-rej") { const ug461 = (globalThis as any).__umpGate461; const u461 = typeof ug461 === "function" ? ug461(String(line.bookCopy)) : "THE UMPIRE GATE is not running - no opening order for main or rejection (fix461)"; '
        'if (u461) { sent.__aureliusBlock = `Blocked: ${u461}`; return null; } } // fix461 (R185/R186, Love Oct 29 2026 11:46 AM PT: "if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out" + 11:50 AM "without making the orders lag"): main + rejection opening orders need the umpire\'s SAFE stamp on the code running now - an in-memory check; exits never come here\n')
m = os.stat(D).st_mode; os.chmod(D, 0o755)
shutil.copyfile(f"{B}/src/lib/desk/umpire-gate.ts", f"{D}/umpire-gate.ts"); os.chmod(f"{D}/umpire-gate.ts", 0o444)
ks = ks.replace(A1, A1 + ADD1, 1).replace(A2, A2 + ADD2, 1)
fm = os.stat(K).st_mode; os.chmod(K, 0o644); open(K + ".tmp", "w", encoding="utf8").write(ks); os.replace(K + ".tmp", K); os.chmod(K, fm & 0o777)
os.chmod(D, m & 0o777)
for f in ["umpire-stamp.py", "umpire-gate-test-461.cjs"]: shutil.copyfile(f"{B}/{f}", f"tools/{f}")
def wj(p, o): t = p + ".tmp"; open(t, "w").write(json.dumps(o, indent=2, ensure_ascii=False)); os.replace(t, p)
H = {f: h16(f"{D}/{f}") for f in ["kalshi-live.server.ts", "umpire-gate.ts"]}
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
for f in H:
    if f in sl.get("files", {}): sl["files"][f] = H[f]
wj("data/spine-lock.json", sl)
gb = json.load(open("data/golden-baseline.json"))
for f, h in H.items(): gb["code"][f] = h
if "data/spine-lock.json" in gb.get("configFiles", {}): gb["configFiles"]["data/spine-lock.json"] = h16("data/spine-lock.json")
wj("data/golden-baseline.json", gb)
u = open("tools/umpire.py", encoding="utf8").read()
if "umpire-gate-test-461" not in u:
    a = "if rB441.returncode != 0: ok = False\n"
    add = 'rU461 = subprocess.run(["node", "tools/umpire-gate-test-461.cjs"], capture_output=True, text=True)  # fix461 (R185, Love Oct 29 2026 11:46 AM PT: "if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out")\nprint(("SAFE   " if rU461.returncode == 0 else "OUT    ") + "tools/umpire-gate-test-461.cjs  " + ((rU461.stdout.strip().split("\\n") or [""])[-1]))\nif rU461.returncode != 0: ok = False\n'
    if u.count(a) == 1:
        um = os.stat("tools/umpire.py").st_mode; os.chmod("tools/umpire.py", 0o644); open("tools/umpire.py", "w", encoding="utf8").write(u.replace(a, a + add)); os.chmod("tools/umpire.py", um & 0o777)
RB = open("LOVE-RULEBOOK.md", encoding="utf8").read()
if "0q. CORNERSTONE - THE UMPIRE AT THE WIRE" not in RB:
    fm = os.stat("LOVE-RULEBOOK.md").st_mode; os.chmod("LOVE-RULEBOOK.md", 0o644)
    open("LOVE-RULEBOOK.md", "a", encoding="utf8").write('\n0q. CORNERSTONE - THE UMPIRE AT THE WIRE (Oct 29 2026 11:46-11:51 AM PT, R185/R186/R187/R189, fix461). Love: "can you make sure the umpire not only checks if the code is there, but THAT ITS ENFORCED.??? meaning, if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out ?" + "just main and rejection for rn hun" + "without making the orders lag". Every opening order of main and rejection needs the umpire\'s SAFE stamp on the exact code running (src/lib/desk/umpire-gate.ts at the wire, kalshi-live.server.ts place()); the umpire runs in the background, never in the order path; exits/take-profits never blocked. The 46 old restore-list items stay a report until Love goes through them (option A).\n')
    os.chmod("LOVE-RULEBOOK.md", fm & 0o777)
os.makedirs("data/BACKUPS/fix461", exist_ok=True)
for f in ["src/lib/desk/umpire-gate.ts", "umpire-stamp.py", "umpire-gate-test-461.cjs", "install461.py", "MANIFEST.json"]: shutil.copyfile(f"{B}/{f}", f"data/BACKUPS/fix461/{os.path.basename(f)}")
print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT. The umpire is checking her new code now (~20 s)...', flush=True)
st = subprocess.run([sys.executable, "tools/umpire-stamp.py"], capture_output=True, text=True); print(st.stdout.strip())
now2 = datetime.datetime.now(datetime.timezone.utc).isoformat()
open("data/overnight-fixes.log", "a").write(f"{now2} fix461 INSTALLED by Love's double-click (R185/R186/R187/R189, Love Oct 29 2026 11:46 AM PT: \"can you make sure the umpire not only checks if the code is there, but THAT ITS ENFORCED.??? meaning, if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out ?\" + 11:50 AM \"just main and rejection for rn hun\" + \"without making the orders lag\"): main + rejection opening orders need the umpire's SAFE stamp on the running code (in memory, ~7 µs); exits never blocked; old restore-list items report-only. First stamp: {st.stdout.strip()[:120]}. {H}\n")
for n, l in enumerate(open(K, encoding="utf8"), 1):
    if "fix461" in l and "ug461(" in l: print(f"IN ✓  every main + rejection opening order checks the umpire: src/lib/desk/kalshi-live.server.ts:{n}")
    if "fix461" in l and 'import("./umpire-gate")' in l: print(f"IN ✓  the umpire gate starts with the wire: src/lib/desk/kalshi-live.server.ts:{n}")
print("IN ✓  the gate: src/lib/desk/umpire-gate.ts; the stamp: tools/umpire-stamp.py -> data/UMPIRE-VERDICT.json")
r = subprocess.run(["node", "tools/umpire-gate-test-461.cjs"], capture_output=True, text=True); print("\nReplay on her LIVE code:"); print(r.stdout.strip())
