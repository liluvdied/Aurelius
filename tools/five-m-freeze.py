#!/usr/bin/env python3
# THE 5M IS FROZEN (Love Oct 27 2026 6:13 PM PT: "the 5M is our best performing book and i dont want it to move from her configurations unless we agree on it
# together for a reason , that book is good indefinitely until we decide differently okay"). Fingerprints what the Polymarket 5M reads: bandlock5m.ts,
# poly-live.server.ts, engine.ts polyTwin(), and the Poly settings in live-switch. Any change = OUT. Re-freeze ONLY on Love's words: --freeze "<her words>".
import json, hashlib, os, sys, re, datetime
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
F = "data/FIVE-M-FREEZE.json"
def h(b): return hashlib.sha256(b).hexdigest()[:16]
def now():
    out = {}
    for f in ("src/lib/desk/bandlock5m.ts", "src/lib/desk/poly-live.server.ts"): out[f] = h(open(f, "rb").read())
    e = open("src/lib/desk/engine.ts", encoding="utf8").read(); i = e.index("async function polyTwin()"); m = re.search(r"\n(async )?function \w+\(", e[i + 30:])
    out["engine.ts polyTwin()"] = h(e[i:i + 30 + (m.start() if m else len(e))].encode())
    sw = json.load(open("data/live-switch.json"))
    for k in ("polyTwin", "polyLive", "polyHour", "polyMirror"): out["live-switch " + k] = h(json.dumps(sw.get(k), sort_keys=True).encode())
    return out
if len(sys.argv) > 2 and sys.argv[1] == "--freeze":
    prev = json.load(open(F)) if os.path.exists(F) else {}
    hist = prev.get("history", []) + [{"at": datetime.datetime.utcnow().isoformat() + "Z", "words": sys.argv[2]}]
    if os.path.exists(F): os.chmod(F, 0o644)
    json.dump({"fp": now(), "history": hist}, open(F, "w"), indent=1); os.chmod(F, 0o444); print("5M FROZEN"); sys.exit(0)
fz = json.load(open(F))["fp"]; cur = now(); bad = [k for k in fz if fz[k] != cur.get(k)]
if bad: print("5M MOVED - tell Love: " + ", ".join(bad)); sys.exit(1)
print("5M FROZEN ✓ - the Polymarket 5M is exactly as Love left her.")
