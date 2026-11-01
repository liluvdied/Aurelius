#!/usr/bin/env python3
"""CORNERSTONE MANIFEST: guards the guards. Hashes every guard file and refuses (exit 1) if any changed or went missing.
  python3 tools/cornerstone-manifest.py check            read only, the default
  python3 tools/cornerstone-manifest.py seal R###        re-records the hashes; needs a request id of Love's typed words in data/LOVE-REQUESTS.jsonl"""
import os, sys, json, hashlib, datetime
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
M = "data/CORNERSTONE-MANIFEST.json"
FILES = ["tools/umpire.py", "tools/umpire-stamp.py", "tools/cornerstones.py", "tools/no-removal-gate.py", "tools/verify-golden.py",
         "tools/seal-check.py", "tools/vault.py", "tools/save-her.py", "tools/state-guard.py", "tools/cornerstone-manifest.py",
         "src/lib/desk/umpire-gate.ts", "CHECK-NOTHING-REMOVED.command", "CHECK-HER-RULES.command", "AGENTS.project.md", ".gitignore"]
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
def check():
    m = json.load(open(M)); bad = []
    for f, h in m["files"].items():
        c = sha(f) if os.path.exists(f) else "MISSING"
        print(("  ✓ " if c == h else "  ✗ ") + f + ("" if c == h else "  CHANGED" if c != "MISSING" else "  MISSING"))
        if c != h: bad.append(f)
    print("MANIFEST ✓ every guard is exactly as sealed." if not bad else f"MANIFEST ✗ {len(bad)} guard file(s) changed without a seal.")
    return 0 if not bad else 1
def seal(rid):
    ids = {json.loads(l).get("id") for l in open("data/LOVE-REQUESTS.jsonl", encoding="utf8") if l.strip()}
    if rid not in ids: print(f"REFUSED: {rid} is not in Love's request book."); return 1
    m = {"sealedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "R": rid, "files": {f: sha(f) for f in FILES if os.path.exists(f)}}
    tmp = M + ".tmp"; json.dump(m, open(tmp, "w"), indent=1); os.replace(tmp, M)
    open("data/CORNERSTONE-MANIFEST-log.jsonl", "a").write(json.dumps({"at": m["sealedAt"], "R": rid}) + "\n"); print("SEALED under", rid); return 0
sys.exit(seal(sys.argv[2]) if sys.argv[1:2] == ["seal"] and len(sys.argv) > 2 else check())
