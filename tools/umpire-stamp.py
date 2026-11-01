#!/usr/bin/env python3
"""THE UMPIRE'S STAMP (fix461, R185/R186 - Love Oct 29 2026 11:46 AM PT: "can you make sure the umpire not only checks if the code is there, but THAT ITS ENFORCED.??? meaning, if the
umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out ?" + 11:50 AM: "just main and rejection for rn hun ... can we do this without making the orders lag").
Runs the umpire AHEAD of time (at desk start and whenever her code changes - never while an order waits) and writes data/UMPIRE-VERDICT.json: SAFE or NOT, why, and the
fingerprint (sha256, 16 hex) of every src/lib/desk/*.ts it judged. The desk's order path compares that stamp with her running code in memory (src/lib/desk/umpire-gate.ts).
SAFE = every check the umpire runs is SAFE (every behaviour test, cornerstones, golden, seal, the no-removal gate, the 5M wall), except the two report-only lists Love has not
gone through yet (option A, R186): tools/requests.py (the 46 Oct 28 restore-list items) and tools/rule-anchors.py. A crash, a timeout (180 s) or her code changing while it ran = NOT SAFE.
"""
import os, sys, json, glob, hashlib, subprocess, datetime, re, time
os.chdir(os.environ.get("AUR_ROOT") or os.path.join(os.path.dirname(__file__), ".."))
REPORT_ONLY = set()  # fix558 (Love Oct 31 2026 12:09 AM PT: "No \"report only.\" No SAFE while rules are gone. HAND-SELECTED RULES ONLY."): rule-anchors + requests now decide SAFE like every other check
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
def code(): return {os.path.basename(p): h16(p) for p in sorted(glob.glob("src/lib/desk/*.ts"))}
t0 = time.time(); before = code(); why = []; lines = []
try:
    r = subprocess.run([sys.executable, "tools/umpire.py"], capture_output=True, text=True, timeout=180)
    lines = [l for l in r.stdout.split("\n") if l.startswith("SAFE ") or l.startswith("OUT ") or l.startswith("INFO ")]
except subprocess.TimeoutExpired: why.append("the umpire did not finish in 180 s")
except Exception as e: why.append(f"the umpire could not run ({e})")
want = set(re.findall(r'"(tools/[a-z0-9-]+\.(?:cjs|py))"', open("tools/umpire.py", encoding="utf8").read())) - {"tools/umpire.py", "tools/vault.py"}
seen = {}
for l in lines:
    m = re.match(r"^(SAFE|OUT|INFO)\s+(tools/[a-z0-9-]+\.(?:cjs|py))", l)
    if m: seen[m.group(2)] = m.group(1)
for t in sorted(want):
    if t in REPORT_ONLY or seen.get(t) == "INFO": continue  # INFO lines are records only (Love's "track and log"), never a verdict
    if t not in seen: why.append(f"{t} did not report")
    elif seen[t] != "SAFE": why.append(f"{t} is OUT")
after = code()
if after != before: why.append("her code changed while the umpire ran")
ok = not why
v = {"ok": ok, "at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "why": "; ".join(why)[:600], "secs": round(time.time() - t0, 1),
     "reportOnly": sorted(t for t in REPORT_ONLY if seen.get(t) == "OUT"), "hashes": before}
tmp = "data/UMPIRE-VERDICT.json.tmp"; json.dump(v, open(tmp, "w"), indent=1); os.replace(tmp, "data/UMPIRE-VERDICT.json")
try: open("data/umpire-stamps.jsonl", "a").write(json.dumps({k: v[k] for k in ("at", "ok", "why", "secs")}) + "\n")
except Exception: pass
print(("UMPIRE STAMP ✓ SAFE" if ok else "UMPIRE STAMP ✗ NOT SAFE - " + v["why"]) + f" ({v['secs']} s, {len(before)} files)")
sys.exit(0 if ok else 1)
