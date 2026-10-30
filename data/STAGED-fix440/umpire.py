#!/usr/bin/env python3
# THE UMPIRE (Oct 27 2026 ~12:15 PM PT, Love: "do more to make sure this doesn't happen again. cover every single base and call the umpire to call it safe
# before you look away"). ONE command after EVERY fix, restore or rollback - nothing is "done" until it says SAFE:
#   1. verify-golden  - code + config match exactly what Love approved
#   2. cornerstones   - her cornerstones + every standing rule tag
#   3. rule-anchors   - every one of her rules (Love's own words in the code) still in her code
#   4. free-to-trade-test - RUNS her free-to-trade gate on main + rejection: a call she never took never holds her, a real fill always does
#   5. requests.py check  - CORNERSTONE #1: every request of Love's (data/LOVE-REQUESTS.jsonl, append-only, hash-chained) still in her
#   6. vault.py check - CORNERSTONE #2: a 1:1 copy of every request, change and fix; copies intact; nothing that went in has gone missing
#   7. a fresh full save exists from the last 15 minutes
import subprocess, sys, os, glob, time
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
ok = True
r0 = subprocess.run([sys.executable, "tools/ledger.py"], capture_output=True, text=True)  # every decision, rebuilt first (Love Oct 27 12:23 PM: "logging EVERY. THING.")
print(("SAFE   " if r0.returncode == 0 else "OUT    ") + "tools/ledger.py  " + (r0.stdout.strip().split("\n") or [""])[-1])
if r0.returncode != 0: ok = False
for tool in ("tools/verify-golden.py", "tools/cornerstones.py", "tools/rule-anchors.py", "tools/free-to-trade-test.py", "tools/requests.py", "tools/vault.py"):  # free-to-trade RUN test (Love Oct 27 1:59 PM PT: "please make sure that stops happening permanently.")
    r = subprocess.run([sys.executable, tool] + (["check"] if tool.endswith(("requests.py", "vault.py")) else []), capture_output=True, text=True)
    last = (r.stdout.strip().split("\n") or [""])[-1]
    print(("SAFE   " if r.returncode == 0 else "OUT    ") + tool + "  " + last)
    if r.returncode != 0: ok = False; print(r.stdout)
rK = subprocess.run([sys.executable, "tools/seal-check.py"], capture_output=True, text=True)  # Oct 28 2026 4:37 PM PT: a note inside liveBook broke THE SEAL for 37 min unseen
print(("SAFE   " if rK.returncode == 0 else "OUT    ") + "tools/seal-check.py  " + ((rK.stdout.strip().split("\n") or [""])[-1]))
if rK.returncode != 0: ok = False
rS = subprocess.run(["node", "tools/slide-test.cjs"], capture_output=True, text=True)  # fix403 behaviour test (Love Oct 28 2026 4:04 PM PT: "can you make sure everything stays when we make a rule?"): today's 3:54 PM gold long under the unbroken pink must be held
print(("SAFE   " if rS.returncode == 0 else "OUT    ") + "tools/slide-test.cjs  " + ((rS.stdout.strip().split("\n") or [""])[-1]))
if rS.returncode != 0: ok = False
rSB = subprocess.run(["node", "tools/slide-test-btc.cjs"], capture_output=True, text=True)  # fix423 behaviour test (Love Oct 28 2026 7:17 PM PT: "you see price on a downslope ?????"): the 7:15 PM BTC long under the unbroken pink must be held
print(("SAFE   " if rSB.returncode == 0 else "OUT    ") + "tools/slide-test-btc.cjs  " + ((rSB.stdout.strip().split("\n") or [""])[-1]))
if rSB.returncode != 0: ok = False
rR = subprocess.run(["node", "tools/reach-test-429.cjs"], capture_output=True, text=True)  # fix429 behaviour test (Love Oct 28 2026 8:06 PM PT: "yes to all of them bb"): the 7:40 PM gold long into the unbroken -1σ must be refused
print(("SAFE   " if rR.returncode == 0 else "OUT    ") + "tools/reach-test-429.cjs  " + ((rR.stdout.strip().split("\n") or [""])[-1]))
if rR.returncode != 0: ok = False
rT = subprocess.run(["node", "tools/stale-pink-test-431.cjs"], capture_output=True, text=True)  # fix431/432 behaviour test (Love Oct 28 2026 8:06 PM PT: "yes to all of them bb"): the 7:40 PM gold long must be skipped as stale and refused under the unbroken pink
print(("SAFE   " if rT.returncode == 0 else "OUT    ") + "tools/stale-pink-test-431.cjs  " + ((rT.stdout.strip().split("\n") or [""])[-1]))
if rT.returncode != 0: ok = False
rG = subprocess.run([sys.executable, "tools/no-removal-gate.py"], capture_output=True, text=True)  # cornerstone 0h (Love Oct 28 2026 8:17 PM PT: "DO NOT LET ANYTHING. ANYYYYYYTHINGGGGGGGGG. EVER ... GET REMOVED WITHOUT ME TELLLLLLLLING YOU TO REMOVE IT"): nothing of hers gone since the last save
print(("SAFE   " if rG.returncode == 0 else "OUT    ") + "tools/no-removal-gate.py  " + ((rG.stdout.strip().split("\n") or [""])[0]))
if rG.returncode != 0: ok = False; print(rG.stdout)
rF = subprocess.run(["node", "tools/flip-test-433.cjs"], capture_output=True, text=True)  # fix433 behaviour test (Love Oct 28 2026 8:23 PM PT: "7- back to 2m-5m"): a 1m-only flip never counts
print(("SAFE   " if rF.returncode == 0 else "OUT    ") + "tools/flip-test-433.cjs  " + ((rF.stdout.strip().split("\n") or [""])[-1]))
if rF.returncode != 0: ok = False
rSS = subprocess.run(["node", "tools/side-test-434.cjs"], capture_output=True, text=True)  # fix434 behaviour test (Love Oct 28 2026 8:46 PM PT: "price on the same side of the break stays. 33% NEVER. EVER. LEAVES."): pokes and fall-backs refused
print(("SAFE   " if rSS.returncode == 0 else "OUT    ") + "tools/side-test-434.cjs  " + ((rSS.stdout.strip().split("\n") or [""])[-1]))
if rSS.returncode != 0: ok = False
rTL = subprocess.run(["node", "tools/ten-level-test-440.cjs"], capture_output=True, text=True)  # fix440 behaviour test (Love Oct 28 2026 9:18 PM PT: "no trading into them. only away from them. within 1.50")
print(("SAFE   " if rTL.returncode == 0 else "OUT    ") + "tools/ten-level-test-440.cjs  " + ((rTL.stdout.strip().split("\n") or [""])[-1]))
if rTL.returncode != 0: ok = False
r9 = subprocess.run([sys.executable, "tools/extra-call-5m.py"], capture_output=True, text=True)  # record only (Love Oct 27 2:25 PM PT: "track and log those")
print("INFO   tools/extra-call-5m.py  " + ((r9.stdout.strip().split("\n") or [""])[0]))
r10 = subprocess.run([sys.executable, "tools/pink-flag.py"], capture_output=True, text=True)  # record only (Love Oct 27 5:23 PM PT: "if one of the other books takes a trade like that and loses flag it for me")
for ln10 in (r10.stdout.strip().split("\n") or [""]): print("INFO   tools/pink-flag.py  " + ln10)
saves = sorted(glob.glob("data/SAVES/*"), key=os.path.getmtime)
fresh = saves and time.time() - os.path.getmtime(saves[-1]) < 900
print(("SAFE   " if fresh else "CHECK  ") + "latest save: " + (saves[-1] if saves else "none"))
print("\nUMPIRE: SAFE - every one of Love's rules is in her." if ok else "\nUMPIRE: OUT - a rule of Love's is missing. Put it back or ask Love before anything else.")
sys.exit(0 if ok else 1)
