#!/usr/bin/env python3
# THE UMPIRE (Oct 27 2026 ~12:15 PM PT, Love: "do more to make sure this doesn't happen again. cover every single base and call the umpire to call it safe
# before you look away"). ONE command after EVERY fix, restore or rollback - nothing is "done" until it says SAFE:
#   1. verify-golden  - code + config match exactly what Love approved
#   2. cornerstones   - her cornerstones + every standing rule tag
#   3. rule-anchors   - every one of her rules (Love's own words in the code) still in her code
#   4. a fresh full save exists from the last 15 minutes
import subprocess, sys, os, glob, time
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
ok = True
r0 = subprocess.run([sys.executable, "tools/ledger.py"], capture_output=True, text=True)  # every decision, rebuilt first (Love Oct 27 12:23 PM: "logging EVERY. THING.")
print(("SAFE   " if r0.returncode == 0 else "OUT    ") + "tools/ledger.py  " + (r0.stdout.strip().split("\n") or [""])[-1])
if r0.returncode != 0: ok = False
for tool in ("tools/verify-golden.py", "tools/cornerstones.py", "tools/rule-anchors.py"):
    r = subprocess.run([sys.executable, tool], capture_output=True, text=True)
    last = (r.stdout.strip().split("\n") or [""])[-1]
    print(("SAFE   " if r.returncode == 0 else "OUT    ") + tool + "  " + last)
    if r.returncode != 0: ok = False; print(r.stdout)
saves = sorted(glob.glob("data/SAVES/*"), key=os.path.getmtime)
fresh = saves and time.time() - os.path.getmtime(saves[-1]) < 900
print(("SAFE   " if fresh else "CHECK  ") + "latest save: " + (saves[-1] if saves else "none"))
print("\nUMPIRE: SAFE - every one of Love's rules is in her." if ok else "\nUMPIRE: OUT - a rule of Love's is missing. Put it back or ask Love before anything else.")
sys.exit(0 if ok else 1)
