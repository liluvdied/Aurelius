#!/usr/bin/env python3
"""THE SEAL check (Oct 28 2026 4:37 PM PT): fix402 put a note inside liveBook, the seal hash changed, and THE SEAL refused every opening
order 4:00-4:37 PM PT while verify-golden said all was well. This recomputes the seal exactly as bandlock does (liveBook minus
dollars/note/at/since) and fails the umpire if it no longer matches golden-baseline sealLiveBook."""
import json, hashlib, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
s = json.load(open("data/live-switch.json")); g = json.load(open("data/golden-baseline.json"))
lb = {k: v for k, v in (s.get("liveBook") or {}).items() if k not in ("dollars", "note", "at", "since")}
h = hashlib.sha256(json.dumps(lb, sort_keys=True).encode()).hexdigest()[:10]
if h == g.get("sealLiveBook"): print(f"SEAL ✓ - her live lineup matches what Love approved ({h})."); sys.exit(0)
print(f"SEAL BROKEN - liveBook hashes to {h}, Love approved {g.get('sealLiveBook')}: every opening order is refused. Find the key added inside liveBook."); sys.exit(1)
