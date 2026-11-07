#!/usr/bin/env python3
"""verify-golden v2: is she exactly where Love left her? Compares the live desk against data/golden-baseline.json,
which moves ONLY with changes Love asked for. Drift here = unsolicited. The frozen vault copy stays in snapshots/."""
import json, hashlib, os, sys, glob
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
b = json.load(open("data/golden-baseline.json"))
drift = []
# fix478 (Love Oct 29 2026 4:51 PM PT: "i don't want to have to do this every time i change the schedule pls"): her schedule pill approves its own hours in data/schedule-approved.json (written only by the pill)
try: PILL478 = json.load(open("data/schedule-approved.json"))
except Exception: PILL478 = {}
PILLCFG478 = {k: v for k, v in (PILL478.get("config") or {}).items() if k in ("bookSkipHours", "bookSkipHoursByAsset", "offHourMain", "live", "at", "note", "liveBook")}
# fix632 (Love Nov 1 2026 11:32 PM PT: "i already have a position sizing slider. you told me any change makes the umpire stop all orders. don't have that in place for position sizes."): her slider's two numbers, maxDollars and liveBook.dollars, never count as drift. Every other setting is still checked.
SIZE632 = [False]
def size_only632(k, ls, targets):
    if k == "maxDollars": SIZE632[0] = True; return True
    if k != "liveBook" or not isinstance(ls.get(k), dict): return False
    for d in [i for i in range(0, 1001)] + [i / 2 for i in range(1, 2001, 2)]:
        if hashlib.sha256(json.dumps({**ls[k], "dollars": d}, sort_keys=True).encode()).hexdigest()[:10] in targets: SIZE632[0] = True; return True
    return False
# fix676 (Love Nov 4 2026 10:29 PM PT: "OH yes let's do it :))" - her LIVE flip never needs a re-sign): her LIVE switch is hers, like her slider. The top-level live (true/false),
# at and note stamps it writes never count as drift, and neither does liveBook when only its since / at / note / dollars moved - its lineup must still hash to the
# approved seal (golden sealLiveBook, the same seal bandlock's THE SEAL checks). Every other setting, every code file and every rule is still checked exactly as before.
LIVE676 = [False]
def flip676(k, ls):
    v = ls.get(k)
    if k == "live" and isinstance(v, bool): LIVE676[0] = True; return True
    if k in ("at", "note") and isinstance(v, str) and len(v) <= 400: LIVE676[0] = True; return True
    if k == "liveBook" and isinstance(v, dict) and b.get("sealLiveBook"):
        lb = {x: y for x, y in v.items() if x not in ("dollars", "note", "at", "since")}
        if hashlib.sha256(json.dumps(lb, sort_keys=True).encode()).hexdigest()[:10] == b.get("sealLiveBook"): LIVE676[0] = True; return True
    return False
cur = {os.path.basename(f): hashlib.sha256(open(f, "rb").read()).hexdigest()[:16] for f in sorted(glob.glob("src/lib/desk/*.ts"))}
for f, h in b["code"].items():
    if cur.get(f) != h: drift.append("code " + f + ": " + str(cur.get(f, "MISSING")) + " (baseline " + h + ")")
for f in cur:
    if f not in b["code"]: drift.append("code " + f + ": NEW FILE not in baseline")
try:
    ls = json.load(open("data/live-switch.json"))
    if len(ls) < 50: drift.append("CONFIG LOOKS WIPED: live-switch.json has only " + str(len(ls)) + " keys")
    for k, h in b["config"].items():
        c = hashlib.sha256(json.dumps(ls.get(k), sort_keys=True).encode()).hexdigest()[:10] if k in ls else "MISSING"
        if c != h and PILLCFG478.get(k) == c: continue  # fix478: her schedule pill approved it
        if c != h and size_only632(k, ls, (h, PILLCFG478.get(k))): continue  # fix632
        if c != h and flip676(k, ls): continue  # fix676: her LIVE switch
        if c != h: drift.append("config " + k + " changed")
    for k in ls:
        if k not in b["config"]: drift.append("config " + k + ": NEW KEY")
except Exception as e: drift.append("live-switch unreadable: " + str(e))
for f, h in b.get("configFiles", {}).items():
    c = hashlib.sha256(open(f, "rb").read()).hexdigest()[:16] if os.path.exists(f) else "MISSING"
    if c != h and f == "data/live-switch.json" and PILL478.get("file") == c: continue  # fix478: the file as her schedule pill left it
    if c != h and f == "data/live-switch.json" and SIZE632[0]: continue  # fix632: every key was checked above, only her slider moved
    if c != h and f == "data/live-switch.json" and LIVE676[0]: continue  # fix676: every key was checked above, only her LIVE switch moved
    if c != h: drift.append(f + " changed")
if drift:
    print("UNSOLICITED DRIFT (baseline moves only with changes Love asked for):")
    for d in drift: print("  -", d)
    sys.exit(1)
print("GOLDEN \u2713 - she is exactly where Love left her.")
