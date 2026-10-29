#!/usr/bin/env python3
"""THE 5M WALL (fix456, R169 - Love Oct 29 2026 10:27 AM PT: "please create a SEPARATE BOOK FOR THAT MODEL. ITS SUPPOSED TO STAND ALONE FROM THE OTHERS. I CANNOT HAVE IT KEEP
CHANGING EVRRYTIME WE REFINE THE OTHERS ... ONE ALTERATION TO ONE - DOES NOTTTTTTTTTTTTTTTT. DOES. NOT. TOUCH. THE 5M BOOK. WALLED OFF. PLEASE.").
Refuses (exit 1) when:
  1. any of her 5M files differs from data/five5m/FROZEN.json - she changes only when Love names the 5M in her own words (then: tools/five5m-wall.py refreeze R###);
  2. any of her 5M files imports a file outside her wall - her read, walls, lane and exits may use only each other, the price feed (quotes.ts) and Polymarket's
     client (poly-live.server.ts). So an edit to recon.ts / bandlock.ts / engine.ts / any Kalshi book can never reach her calls.
  3. the desk's hooks that run her are missing (pivotbooks.ts hands her the BTC market; engine.ts runs her lane + exits and keeps the old 5M lane off while she is on).
  python3 tools/five5m-wall.py              check (the umpire runs this)
  python3 tools/five5m-wall.py refreeze R### re-freeze after a change Love asked for by name (R### must hold Love's typed words naming the 5M)
"""
import os, sys, re, json, hashlib
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
D = "src/lib/desk"
FILES = ["five5m-mem.ts", "recon5m.ts", "bandlock5m27.ts", "auto5m27.ts", "dna5m27.ts", "five5m-rows.ts", "five5m.ts"]
CONF = ["data/five5m/live-switch.json"]
ALLOWED = set(FILES) | {"quotes.ts", "poly-live.server.ts", "types.ts"}  # types.ts: a type-only import (erased when built) in her frozen helper auto5m27.ts
h16 = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
def now_hashes(): return {**{f: h16(f"{D}/{f}") for f in FILES}, **{c: h16(c) for c in CONF}}
if len(sys.argv) >= 3 and sys.argv[1] == "refreeze":
    R = sys.argv[2]; ok = False
    for x in open("data/LOVE-REQUESTS.jsonl", encoding="utf8"):
        e = json.loads(x)
        if (e.get("id") or e.get("of")) == R and re.search(r"\b5M\b|\b5m\b|five", str(e.get("words", ""))) and re.search(r'"[^"]{2,}"', str(e.get("words", ""))): ok = True
    if not ok: print(f"5M WALL: {R} does not hold Love's typed words naming the 5M - NOT refrozen"); sys.exit(1)
    json.dump({"at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(), "R": R, "files": now_hashes()}, open("data/five5m/FROZEN.json", "w"), indent=1)
    print(f"5M WALL: refrozen on {R}"); sys.exit(0)
bad = []
try: F = json.load(open("data/five5m/FROZEN.json"))["files"]
except Exception as e: F = None; bad.append(f"no data/five5m/FROZEN.json ({e})")
if F is not None:
    for k, h in now_hashes().items():
        if F.get(k) != h: bad.append(f"{k} changed since Love's freeze ({F.get(k)} -> {h})")
for f in FILES:
    for imp in re.findall(r'(?:from\s+|import\()\s*"\./([^"]+)"', open(f"{D}/{f}", encoding="utf8").read()):
        if imp + ".ts" not in ALLOWED and imp not in ALLOWED: bad.append(f"{f} imports ./{imp} - outside her wall")
P = open(f"{D}/pivotbooks.ts", encoding="utf8").read(); E = open(f"{D}/engine.ts", encoding="utf8").read()
if "fiveReadTick(id, a, m, left, b, last1m)" not in P: bad.append("pivotbooks.ts no longer hands her the BTC market (fiveReadTick hook missing)")
if "l456.fiveTick5m()" not in E or "l456.fiveBank5m()" not in E: bad.append("engine.ts no longer runs her lane / exits")
if "this old 5M lane stays off" not in E: bad.append("engine.ts's old 5M lane is no longer kept off while she is on")
if bad:
    print("5M WALL: REFUSED - her walled-off 5M was touched:"); [print("  ✗ " + b) for b in bad]; sys.exit(1)
print(f"5M WALL ✓ - her {len(FILES)} files + her settings are exactly as Love froze them; she imports only her own files, the price feed and Polymarket's client.")
