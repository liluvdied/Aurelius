#!/usr/bin/env python3
"""HER LIBRARIES FINGERPRINTED (fix481, Love Oct 29 2026 6:08 PM PT: "can you ensure all of these stay in this time too? i can't do this again it's fucking soul
snatching"). Her desk runs on the libraries in node_modules/, which are not in concrete (locking them would stop the desk from starting - Vite writes its cache
there). So the umpire fingerprints them instead: every installed package's name + version, its package.json bytes, and package-lock.json. A changed, added or
removed library = OUT = no main/rejection opening orders until Love re-seals it with her own command. Vite's own cache (node_modules/.vite, .cache) is ignored.
  python3 tools/libs-fingerprint.py            check against tools/libs-fingerprint.json (the umpire runs this)
  python3 tools/libs-fingerprint.py seal R123  write a new fingerprint (only from a command Love clicks; tools/ is in concrete)
"""
import os, sys, json, glob, hashlib
os.chdir(os.environ.get("AUR_ROOT") or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
def now():
    out = {}
    pk = sorted(glob.glob("node_modules/*/package.json") + glob.glob("node_modules/@*/*/package.json"))
    for p in pk:
        try: raw = open(p, "rb").read(); j = json.loads(raw); out[os.path.dirname(p)[len("node_modules/"):]] = f'{j.get("version", "?")}:{hashlib.sha256(raw).hexdigest()[:12]}'
        except Exception: out[os.path.dirname(p)[len("node_modules/"):]] = "unreadable"
    try: out["(package-lock.json)"] = hashlib.sha256(open("package-lock.json", "rb").read()).hexdigest()[:16]
    except Exception: out["(package-lock.json)"] = "missing"
    return out
F = "tools/libs-fingerprint.json"
if len(sys.argv) >= 3 and sys.argv[1] == "seal":
    json.dump({"R": sys.argv[2], "libs": now()}, open(F, "w"), indent=0, sort_keys=True); print(f"LIBRARIES SEALED under {sys.argv[2]} ({len(now())} entries)"); sys.exit(0)
try: base = json.load(open(F))["libs"]
except Exception: print("LIBRARIES: no fingerprint to check against - OUT"); sys.exit(1)
cur = now(); diff = [k for k in sorted(set(base) | set(cur)) if base.get(k) != cur.get(k)]
if diff:
    print(f"LIBRARIES CHANGED: {len(diff)} of her libraries differ from what Love sealed - OUT: " + ", ".join(f"{k} ({base.get(k, 'NEW')} -> {cur.get(k, 'GONE')})" for k in diff[:8])); sys.exit(1)
print(f"LIBRARIES ✓ - all {len(cur)} of her libraries are exactly as sealed.")
