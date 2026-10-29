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
rB441 = subprocess.run(["node", "tools/broke-candle-test-441.cjs"], capture_output=True, text=True)  # fix441 (Love Oct 28 2026 9:20 PM PT: "she shorted it when it just broke pink upwards")
print(("SAFE   " if rB441.returncode == 0 else "OUT    ") + "tools/broke-candle-test-441.cjs  " + ((rB441.stdout.strip().split("\n") or [""])[-1]))
if rB441.returncode != 0: ok = False
rCH465 = subprocess.run(["node", "tools/check-her-rules.cjs", "--no5m"], capture_output=True, text=True)  # R204/R210 (Love Oct 29 2026 1:26 PM PT: "check every single line of code that it FUNCTIONS. BOTH. WAYS. FOR ALL. BOOKS. NO MORE LOOPHOLES.")
print(("SAFE   " if rCH465.returncode == 0 else "OUT    ") + "tools/check-her-rules.cjs --no5m  " + ((rCH465.stdout.strip().split("\n") or [""])[-1]))
if rCH465.returncode != 0: ok = False
rP464 = subprocess.run(["node", "tools/pink-both-sides-test-464.cjs"], capture_output=True, text=True)  # fix464 (R197-R203, Love Oct 29 2026 1:06 PM PT: "i told you 100 times it's for both sides. do what i say.")
print(("SAFE   " if rP464.returncode == 0 else "OUT    ") + "tools/pink-both-sides-test-464.cjs  " + ((rP464.stdout.strip().split("\n") or [""])[-1]))
if rP464.returncode != 0: ok = False
rI463 = subprocess.run(["node", "tools/independent-calls-test-463.cjs"], capture_output=True, text=True)  # fix463 (R191, Love Oct 29 2026 12:38 PM PT: "no flip. independent calls ... only once she has executed a trade")
print(("SAFE   " if rI463.returncode == 0 else "OUT    ") + "tools/independent-calls-test-463.cjs  " + ((rI463.stdout.strip().split("\n") or [""])[-1]))
if rI463.returncode != 0: ok = False
rU461 = subprocess.run(["node", "tools/umpire-gate-test-461.cjs"], capture_output=True, text=True)  # fix461 (R185, Love Oct 29 2026 11:46 AM PT: "if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out")
print(("SAFE   " if rU461.returncode == 0 else "OUT    ") + "tools/umpire-gate-test-461.cjs  " + ((rU461.stdout.strip().split("\n") or [""])[-1]))
if rU461.returncode != 0: ok = False
rS460 = subprocess.run(["node", "tools/session-ahead-33-test-460.cjs"], capture_output=True, text=True)  # fix460 (R181/R182, Love Oct 29 2026 11:32-11:33 AM PT: "33% FUCKING PERCENT FROM BAND TO BAND BRO" + "NO LONGS IN TOP 33% . NO SHORTS IN THE BOTTOM 33%"): the session-band-ahead wait holds only inside her thirds
print(("SAFE   " if rS460.returncode == 0 else "OUT    ") + "tools/session-ahead-33-test-460.cjs  " + ((rS460.stdout.strip().split("\n") or [""])[-1]))
if rS460.returncode != 0: ok = False
r5W = subprocess.run([sys.executable, "tools/five5m-wall.py"], capture_output=True, text=True)  # fix456 (R169, Love Oct 29 2026 10:27 AM PT: "WALLED OFF. PLEASE."): her walled-off 5M untouched
print(("SAFE   " if r5W.returncode == 0 else "OUT    ") + "tools/five5m-wall.py  " + ((r5W.stdout.strip().split("\n") or [""])[-1]))
if r5W.returncode != 0: ok = False
rP459 = subprocess.run(["node", "tools/pink-15-20-test-459.cjs"], capture_output=True, text=True)  # fix459 (R176, Love Oct 29 2026 11:12 AM PT: "she is only not allowed to long into pink at 15% of the channel width, band to band" + "15% just for gold rn hun. 20% for btc"): pink holds a long only inside 15%/20%
print(("SAFE   " if rP459.returncode == 0 else "OUT    ") + "tools/pink-15-20-test-459.cjs  " + ((rP459.stdout.strip().split("\n") or [""])[-1]))
if rP459.returncode != 0: ok = False
rB457 = subprocess.run(["node", "tools/broke-candle-test-457.cjs"], capture_output=True, text=True)  # fix457 (R170, Love Oct 29 2026 10:42 AM PT: "band breaks = trade the direction of the break. WITH PRICE ON THE SAME SIDE OF THE BREAK ... count the 33% correctly"): the 10:22 AM gold long must be refused
print(("SAFE   " if rB457.returncode == 0 else "OUT    ") + "tools/broke-candle-test-457.cjs  " + ((rB457.stdout.strip().split("\n") or [""])[-1]))
if rB457.returncode != 0: ok = False
rT442 = subprocess.run(["node", "tools/thirds-off-test-442.cjs"], capture_output=True, text=True)  # fix442 (Love Oct 28 2026 9:23 PM PT: "yeah no i got rid of the flip.")
print(("SAFE   " if rT442.returncode == 0 else "OUT    ") + "tools/thirds-off-test-442.cjs  " + ((rT442.stdout.strip().split("\n") or [""])[-1]))
if rT442.returncode != 0: ok = False
rBF = subprocess.run(["node", "tools/band-flip-test-446.cjs"], capture_output=True, text=True)  # fix446 (Love Oct 28 2026 10:41 PM PT: "i want the flip AWAY from a band , that's the whole entry")
print(("SAFE   " if rBF.returncode == 0 else "OUT    ") + "tools/band-flip-test-446.cjs  " + ((rBF.stdout.strip().split("\n") or [""])[-1]))
if rBF.returncode != 0: ok = False
rZP = subprocess.run(["node", "tools/zone-pickup-test-448.cjs"], capture_output=True, text=True)  # fix448 (Love Oct 28 2026 10:56 PM PT: "yes please fix that and add the log pls")
print(("SAFE   " if rZP.returncode == 0 else "OUT    ") + "tools/zone-pickup-test-448.cjs  " + ((rZP.stdout.strip().split("\n") or [""])[-1]))
if rZP.returncode != 0: ok = False
r3P = subprocess.run(["node", "tools/three-pm-test-452.cjs"], capture_output=True, text=True)  # fix452 (Love Oct 29 2026 9:42 AM PT: "3pm ✅ (bollingers, green/red zones only)")
print(("SAFE   " if r3P.returncode == 0 else "OUT    ") + "tools/three-pm-test-452.cjs  " + ((r3P.stdout.strip().split("\n") or [""])[-1]))
if r3P.returncode != 0: ok = False
r9 = subprocess.run([sys.executable, "tools/extra-call-5m.py"], capture_output=True, text=True)  # record only (Love Oct 27 2:25 PM PT: "track and log those")
print("INFO   tools/extra-call-5m.py  " + ((r9.stdout.strip().split("\n") or [""])[0]))
r10 = subprocess.run([sys.executable, "tools/pink-flag.py"], capture_output=True, text=True)  # record only (Love Oct 27 5:23 PM PT: "if one of the other books takes a trade like that and loses flag it for me")
for ln10 in (r10.stdout.strip().split("\n") or [""]): print("INFO   tools/pink-flag.py  " + ln10)
saves = sorted(glob.glob("data/SAVES/*"), key=os.path.getmtime)
fresh = saves and time.time() - os.path.getmtime(saves[-1]) < 900
print(("SAFE   " if fresh else "CHECK  ") + "latest save: " + (saves[-1] if saves else "none"))
print("\nUMPIRE: SAFE - every one of Love's rules is in her." if ok else "\nUMPIRE: OUT - a rule of Love's is missing. Put it back or ask Love before anything else.")
sys.exit(0 if ok else 1)
