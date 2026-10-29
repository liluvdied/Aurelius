# Installs the walled-off 5M (fix456; R169/R172/R173/R174/R175 - Love Oct 29 2026) at the next quarter-hour. Adds her own files; patches (never replaces) the two desk files that
# run her: pivotbooks.ts (hands her the BTC market) and engine.ts (runs her lane + exits, keeps the old 5M lane off while she is on). Refuses if anything is not as built.
import json, hashlib, os, shutil, datetime, time, sys, subprocess
os.chdir(os.environ.get("AUR5_ROOT") or "/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")  # AUR5_ROOT: dry run in a copy
B = "data/STAGED-five5m"; D = "src/lib/desk"
NEW = ["five5m-mem.ts", "recon5m.ts", "bandlock5m27.ts", "auto5m27.ts", "dna5m27.ts", "five5m-rows.ts", "five5m.ts"]
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
M = json.load(open(f"{B}/MANIFEST.json"))
for f, h in M["staged"].items():
    if h16(f"{B}/{f}") != h: sys.exit(f"{f} is not the copy that was built and replayed - NOT installing (nothing changed). Tell Claude.")
for f in NEW:
    if os.path.exists(f"{D}/{f}"): sys.exit(f"{D}/{f} already exists - the 5M is already in, or something else is there. NOT installing (nothing changed).")
PATCH = [
  ("pivotbooks.ts", "      try { if (reconTick(id, a, m, left, b, last1m, rows)) changed = true; } catch {}\n",
   "      try { const G456 = globalThis as any; if (G456.__five5mRowsMod) G456.__five5mRowsMod.fiveReadTick(id, a, m, left, b, last1m); else if (!G456.__five5mRowsLoading) { G456.__five5mRowsLoading = true; import(\"./five5m-rows\").then((x) => { G456.__five5mRowsMod = x; }).catch(() => { G456.__five5mRowsLoading = false; }); } } catch {} // fix456 (R169, Love Oct 29 2026 10:27 AM PT: \"WALLED OFF. PLEASE.\"): the walled-off 5M reads her own Oct 27 copy (recon5m.ts) into her own rows - BTC only, read-only on the desk; loaded apart so nothing of hers can stop the desk\n"),
  ("engine.ts", "  void polyTwin(); // fix112 - the twin on Polymarket 24/7\n",
   "  void (async () => { try { const r456 = await import(\"./five5m-rows\"), l456 = await import(\"./five5m\"); if (r456.fiveOn()) void l456.fiveTick5m(); void l456.fiveBank5m(); } catch {} })(); // fix456 (R169): the walled-off 5M - her own lane (only while five5m.on) and her own exits (always, for anything she holds); loaded apart\n"),
  ("engine.ts", "      if (r5 && r5.on === true && (r.book === (main5 ? \"recon-tog\" : \"recon-rej\") || ((r as any).lateOnly && FLIP5_BOOKS.includes(String(r.book)))) && (Array.isArray(r5.assets)",
   "      if (r5 && r5.on === true && (r.book === (main5 ? \"recon-tog\" : \"recon-rej\") || ((r as any).lateOnly && FLIP5_BOOKS.includes(String(r.book)))) && (await import(\"./five5m-rows\").then((x) => x.fiveOn()).catch(() => false))) continue; // fix456 (R169): while the walled-off 5M is on, this old 5M lane stays off - one 5M book, hers\n"),
]
for f, anchor, add in PATCH:
    s = open(f"{D}/{f}", encoding="utf8").read()
    if s.count(anchor) != 1: sys.exit(f"{f}: the spot to hook her in is not there exactly once - NOT installing (nothing changed). Tell Claude.")
    if "fix456" in s and "five5m" in s: sys.exit(f"{f} is already hooked to the walled-off 5M - NOT installing again (nothing changed).")
print("Saving her first...", flush=True); print(subprocess.run([sys.executable, "tools/save-her.py", "before-fix456-walled-off-5m"], capture_output=True, text=True).stdout.strip().split("\n")[-1], flush=True)
T = (int(time.time()) // 900 + 1) * 900; w = T - time.time()
print(f'Waiting {int(w) + 20} s - she lands 20 s after the next quarter-hour ({datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")})...', flush=True)
time.sleep(0 if os.environ.get("AUR5_DRY") else max(0, w) + 20)  # 20 s after the quarter-hour, so she never writes golden-baseline.json in the same second as another installer
FIVE0 = {f: h16(f"{D}/{f}") for f in ["bandlock5m.ts", "recon.ts", "bandlock.ts", "kalshi-live.server.ts"]}
os.makedirs("data/five5m", exist_ok=True)
shutil.copyfile(f"{B}/live-switch.json", "data/five5m/live-switch.json")
m = os.stat(D).st_mode; os.chmod(D, 0o755)
for f in NEW: shutil.copyfile(f"{B}/src/lib/desk/{f}", f"{D}/{f}"); os.chmod(f"{D}/{f}", 0o444)
for f in ["pivotbooks.ts", "engine.ts"]:
    p = f"{D}/{f}"; s = open(p, encoding="utf8").read(); fm = os.stat(p).st_mode
    for f2, anchor, add in PATCH:
        if f2 != f: continue
        s = s.replace(anchor, (add + anchor) if anchor.startswith("      if (r5") else (anchor + add), 1)
    os.chmod(p, 0o644); open(p + ".tmp", "w", encoding="utf8").write(s); os.replace(p + ".tmp", p); os.chmod(p, fm & 0o777)
os.chmod(D, m & 0o777)
json.dump({"files": {"recon5m.ts": h16(f"{D}/recon5m.ts")}}, open("data/five5m/spine-lock.json", "w"), indent=1)
shutil.copyfile(f"{B}/five5m-wall.py", "tools/five5m-wall.py")
L = open("tools/five-ledger.py", encoding="utf8").read()
a = "for h in json.load(open(D('hedges.json'))):"
if a in L and "five5m" not in L:
    L = L.replace(a, "for h in json.load(open(D('hedges.json'))) + (json.load(open(D('five5m', 'hedges.json'))) if os.path.exists(D('five5m', 'hedges.json')) else []):  # fix456: her walled-off 5M's own positions too")
    fm = os.stat("tools/five-ledger.py").st_mode; os.chmod("tools/five-ledger.py", 0o644); open("tools/five-ledger.py", "w", encoding="utf8").write(L); os.chmod("tools/five-ledger.py", fm & 0o777)
fz = {**{f: h16(f"{D}/{f}") for f in NEW}, "data/five5m/live-switch.json": h16("data/five5m/live-switch.json")}
json.dump({"at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "R": "R169/R172/R173/R174/R175", "files": fz}, open("data/five5m/FROZEN.json", "w"), indent=1)
def wj(p, o): t = p + ".tmp"; open(t, "w").write(json.dumps(o, indent=2, ensure_ascii=False)); os.replace(t, p)
H = {f: h16(f"{D}/{f}") for f in NEW + ["pivotbooks.ts", "engine.ts"]}
gb = json.load(open("data/golden-baseline.json"))
for f, h in H.items(): gb["code"][f] = h
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
if "data/spine-lock.json" in gb.get("configFiles", {}): gb["configFiles"]["data/spine-lock.json"] = h16("data/spine-lock.json")
wj("data/golden-baseline.json", gb)
RB = open("LOVE-RULEBOOK.md", encoding="utf8").read()
if "0o. CORNERSTONE - THE 5M STANDS ALONE" not in RB:
    line = ('\n0o. CORNERSTONE - THE 5M STANDS ALONE (Oct 29 2026, R169/R172/R173/R174/R175, fix456). Love: "please create a SEPARATE BOOK FOR THAT MODEL. ITS SUPPOSED TO STAND ALONE FROM THE OTHERS. '
            'I CANNOT HAVE IT KEEP CHANGING EVRRYTIME WE REFINE THE OTHERS ... ONE ALTERATION TO ONE - DOES NOTTTTTTTTTTTTTTTT. DOES. NOT. TOUCH. THE 5M BOOK. WALLED OFF. PLEASE." + "october 27th please. she was at 79%" '
            '+ "1M flip only hun" + "1M 2m, 3M , 4m or 5M candle flip in our favor / keeps trying until 3:00 minutes left / 2. stays / 3. stays" + hours "B". Her read, walls, lane and exits are her own frozen '
            'Oct 27 4:57 AM PT files (src/lib/desk/five5m*.ts, recon5m.ts, bandlock5m27.ts, auto5m27.ts, dna5m27.ts) with her own settings (data/five5m/live-switch.json). tools/five5m-wall.py '
            '(run by the umpire) refuses any change to them unless Love names the 5M in her own words, and proves no other book\'s code reaches her.\n')
    fm = os.stat("LOVE-RULEBOOK.md").st_mode; os.chmod("LOVE-RULEBOOK.md", 0o644); open("LOVE-RULEBOOK.md", "a", encoding="utf8").write(line); os.chmod("LOVE-RULEBOOK.md", fm & 0o777)
u = open("tools/umpire.py", encoding="utf8").read()
if "five5m-wall.py" not in u:
    a = "if rB441.returncode != 0: ok = False\n"
    add = 'r5W = subprocess.run([sys.executable, "tools/five5m-wall.py"], capture_output=True, text=True)  # fix456 (R169, Love Oct 29 2026 10:27 AM PT: "WALLED OFF. PLEASE."): her walled-off 5M untouched\nprint(("SAFE   " if r5W.returncode == 0 else "OUT    ") + "tools/five5m-wall.py  " + ((r5W.stdout.strip().split("\\n") or [""])[-1]))\nif r5W.returncode != 0: ok = False\n'
    if u.count(a) == 1 and "sys." in u:
        um = os.stat("tools/umpire.py").st_mode; os.chmod("tools/umpire.py", 0o644); open("tools/umpire.py", "w", encoding="utf8").write(u.replace(a, a + add)); os.chmod("tools/umpire.py", um & 0o777)
os.makedirs("data/BACKUPS/fix456", exist_ok=True)
for f in NEW: shutil.copyfile(f"{D}/{f}", f"data/BACKUPS/fix456/{f}")
for f in ["install5m.py", "five5m-wall.py", "live-switch.json", "MANIFEST.json"]: shutil.copyfile(f"{B}/{f}", f"data/BACKUPS/fix456/{f}")
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
open("data/overnight-fixes.log", "a").write(f"{now} fix456 INSTALLED by Love's double-click (R169 Love Oct 29 2026 10:27 AM PT: \"please create a SEPARATE BOOK FOR THAT MODEL ... WALLED OFF. PLEASE.\"; R172 \"1M flip only hun\"; R173 \"october 27th please. she was at 79%\"; R174 \"1M 2m, 3M , 4m or 5M candle flip in our favor / keeps trying until 3:00 minutes left / 2. stays / 3. stays\"; R175 hours \"B\"): the Polymarket 5M is her own book - her Oct 27 4:57 AM PT read/walls/lane/exits in her own files, $5, BTC 5m, off 3, 4, 5 AM, 1 PM, 9 PM, 11 PM. Old 5M lane off while five5m.on. Kalshi files untouched: {FIVE0 == {f: h16(f'{D}/{f}') for f in FIVE0}}. {H}\n")
print("", flush=True); print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for f in NEW: print(f"IN ✓  her file: src/lib/desk/{f}")
for f in ["pivotbooks.ts", "engine.ts"]:
    for n, l in enumerate(open(f"{D}/{f}", encoding="utf8"), 1):
        if "fix456" in l and ("fiveReadTick(id" in l or "fiveTick5m()" in l or "this old 5M lane stays off" in l): print(f"IN ✓  hook: src/lib/desk/{f}:{n}")
print("Kalshi books untouched ✓ (recon.ts, bandlock.ts, bandlock5m.ts, kalshi-live.server.ts byte-identical)" if FIVE0 == {f: h16(f"{D}/{f}") for f in FIVE0} else "KALSHI CHECK: something changed - tell Claude")
