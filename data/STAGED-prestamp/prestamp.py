#!/usr/bin/env python3
"""PRE-STAMP FOR FUTURE INSTALLS (fix461 follow-up - Love Oct 29 2026 11:50 AM PT: "can we do this without making the orders lag with the umpire check? ... so they can go out seamlessly?").
Before an installer waits for its quarter-hour, this runs the WHOLE install on a private copy of her desk (her code, tools, rulebook, settings, request book and latest save -
not the big logs), then runs the umpire there and keeps its stamp for exactly the new code. At the quarter, the installer swaps the files and calls
`tools/prestamp.py land`: if her running code now has exactly the pre-stamped fingerprints, that SAFE stamp becomes data/UMPIRE-VERDICT.json at once - no pause at window open.
If the pre-check is NOT SAFE, the installer must refuse and change nothing. The umpire gate's own background re-check still runs after landing as a second look.
  python3 tools/prestamp.py run <installer.py> [installer args]   -> exit 0 SAFE (writes data/UMPIRE-PRESTAMP.json), 1 NOT SAFE (prints why)
  python3 tools/prestamp.py land                                  -> exit 0 stamp landed, 2 code differs from the pre-stamp (the gate re-checks on its own)
The installer must honour AUR_ROOT (where to install) and AUR5_DRY=1 (no waiting) - install5m.py and install461.py do.
"""
import os, sys, json, glob, hashlib, subprocess, shutil, tempfile
ROOT = os.environ.get("AUR_ROOT") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(ROOT)
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
def code(base): return {os.path.basename(p): h16(p) for p in sorted(glob.glob(os.path.join(base, "src/lib/desk/*.ts")))}
def atomic(p, o): t = p + ".tmp"; json.dump(o, open(t, "w"), indent=1); os.replace(t, p)
if len(sys.argv) >= 3 and sys.argv[1] == "run":
    T = tempfile.mkdtemp(prefix="aur-prestamp-")
    try:
        ex = ["--exclude", "SAVES/", "--exclude", "big-logs/", "--exclude", "archive/", "--exclude", "VAULT/", "--exclude", "BACKUPS/", "--exclude", "SNAPSHOT-*", "--exclude", "PRE*",
              "--exclude", "*.jsonl", "--exclude", "*.bak", "--max-size=20m"]
        subprocess.run(["rsync", "-a", *ex, "data/", f"{T}/data/"], check=True)
        shutil.copyfile("data/LOVE-REQUESTS.jsonl", f"{T}/data/LOVE-REQUESTS.jsonl")
        saves = sorted(glob.glob("data/SAVES/*/"), key=os.path.getmtime)
        if saves: os.makedirs(f"{T}/data/SAVES", exist_ok=True); subprocess.run(["rsync", "-a", saves[-1], f"{T}/data/SAVES/{os.path.basename(saves[-1].rstrip('/'))}/"], check=True)
        subprocess.run(["rsync", "-a", "src", "tools", "LOVE-RULEBOOK.md", f"{T}/"], check=True)
        os.symlink(os.path.abspath("node_modules"), f"{T}/node_modules")
        for f in glob.glob(f"{T}/src/lib/desk/*") + glob.glob(f"{T}/tools/*") + [f"{T}/LOVE-RULEBOOK.md"]:
            try: os.chmod(f, 0o644)
            except Exception: pass
        os.chmod(f"{T}/src/lib/desk", 0o755)
        # the copy's save-her is a no-op: her real save is made by the real install
        open(f"{T}/tools/save-her.py", "w").write('print("data/SAVES/(pre-stamp copy)")\n')
        env = {**os.environ, "AUR_ROOT": T, "AUR5_DRY": "1", "AUR_PRESTAMP": "1"}
        r = subprocess.run([sys.executable, *sys.argv[2:]], env=env, capture_output=True, text=True, timeout=600)
        if r.returncode != 0: print("PRE-STAMP: the install itself refused in the copy:\n" + (r.stdout + r.stderr)[-800:]); sys.exit(1)
        s = subprocess.run([sys.executable, "tools/umpire-stamp.py"], env={**os.environ, "AUR_ROOT": T}, capture_output=True, text=True, timeout=400)
        v = json.load(open(f"{T}/data/UMPIRE-VERDICT.json"))
        if v.get("hashes") != code(T): v["ok"] = False; v["why"] = "pre-stamp hashes do not match the copy's code"
        v["prestamp"] = True
        atomic("data/UMPIRE-PRESTAMP.json", v)
        print(("PRE-STAMP ✓ SAFE" if v.get("ok") else "PRE-STAMP ✗ NOT SAFE - " + str(v.get("why"))) + f" ({v.get('secs')} s on the new code, {len(v.get('hashes', {}))} files)")
        sys.exit(0 if v.get("ok") else 1)
    finally:
        shutil.rmtree(T, ignore_errors=True)
elif len(sys.argv) >= 2 and sys.argv[1] == "land":
    try: v = json.load(open("data/UMPIRE-PRESTAMP.json"))
    except Exception: print("PRE-STAMP: none to land - the gate re-checks on its own"); sys.exit(2)
    if v.get("ok") is True and v.get("hashes") == code("."):
        atomic("data/UMPIRE-VERDICT.json", v); os.remove("data/UMPIRE-PRESTAMP.json")
        print("PRE-STAMP LANDED ✓ - her new code is the code the umpire already called SAFE; no pause"); sys.exit(0)
    print("PRE-STAMP: her running code differs from the pre-stamp - the gate holds main/rejection openings until its own re-check says SAFE"); sys.exit(2)
else:
    print(__doc__); sys.exit(1)
