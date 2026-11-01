#!/usr/bin/env python3
"""STATE GUARD (R217, Love Oct 29 2026 2:08 PM PT: "nothing goes, or comes in without my express request and consent"): nothing recorded in exit-log.json or
win-pings.json may disappear, and heartbeat.json must be valid (a stale beat is reported, never a fail - the desk may be off).
exit-log.json: the desk itself keeps only the newest 80 exits (engine.ts: rows.slice(0, 80)), so ONLY that roll-off is allowed - an exit may leave only when the
log is full (80), it sat at the tail of the log last time, and no more left than new exits came in at the top. Anything else gone = OUT.
Opens the three state files read only. Its own memory lives in data/STATE-GUARD-SEEN.json (fingerprints of every entry it has seen)."""
import os, sys, json, hashlib, datetime, time
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
SEEN = "data/STATE-GUARD-SEEN.json"; STALE_MIN = int(os.environ.get("HEARTBEAT_STALE_MIN", "10")); EXIT_KEEP = 80
def load(p):  # the desk rewrites these files live; a read caught mid-write is retried, never called a loss
    for i in range(5):
        try: return json.load(open(p))
        except Exception:
            if i == 4: raise
            time.sleep(0.3)
fp = lambda x: hashlib.sha256(json.dumps(x, sort_keys=True).encode()).hexdigest()[:16]
seen = json.load(open(SEEN)) if os.path.exists(SEEN) else {}
if not isinstance(seen.get("exit-log"), list): seen["exit-log"] = []  # [fingerprint, at] in file order (newest first)
seen.setdefault("win-pings", []); bad = []
try:
    rows = load("data/exit-log.json"); cur = [[fp(e), str(e.get("at", ""))] for e in rows]; now = {h for h, _ in cur}
    prev = seen["exit-log"]; was = {h for h, _ in prev}
    gone = [(h, a) for h, a in prev if h not in now]; added = len(now - was)
    tail = {h for h, _ in prev[len(prev) - len(gone):]} if gone else set()
    ok_roll = len(rows) >= EXIT_KEEP and len(gone) <= added and all(h in tail for h, _ in gone)
    rolled = dict(gone) if ok_roll else {}; lost = {} if ok_roll else dict(gone)
    print(("  ✓ " if not lost else "  ✗ ") + f"exit-log.json: {len(rows)} exits" + (f", {len(rolled)} rolled off the desk's own 80-exit window" if rolled else "")
          + (f", {len(lost)} exits GONE that should still be there (at {', '.join(sorted(lost.values())[:5])})" if lost else ", nothing removed"))
    if lost: bad.append("exit-log")
    else: seen["exit-log"] = cur
except Exception as e: print(f"  ✗ exit-log.json unreadable: {e}"); bad.append("exit-log")
try:
    d = load("data/win-pings.json"); now = {fp(e) for e in (d if isinstance(d, list) else d.get("ids", []))}
    gone = [h for h in seen["win-pings"] if h not in now]
    print(("  ✓ " if not gone else "  ✗ ") + f"win-pings.json: {len(now)} entries" + (f", {len(gone)} that were recorded are GONE" if gone else ", nothing removed"))
    if gone: bad.append("win-pings")
    else: seen["win-pings"] = sorted(set(seen["win-pings"]) | now)
except Exception as e: print(f"  ✗ win-pings.json unreadable: {e}"); bad.append("win-pings")
try:
    hb = load("data/heartbeat.json"); at = datetime.datetime.fromisoformat(hb["at"].replace("Z", "+00:00"))
    age = (datetime.datetime.now(datetime.timezone.utc) - at).total_seconds() / 60
    print(("  ✓ " if age <= STALE_MIN else "  ! ") + f"heartbeat.json: gen {hb.get('gen')}, {age:.1f} min old" + ("" if age <= STALE_MIN else " (stale: is the desk running?)"))
except Exception as e: print(f"  ! heartbeat.json unreadable: {e} (reported, never a fail - the desk rewrites it every beat)")
if not bad:
    tmp = SEEN + ".tmp"; json.dump(seen, open(tmp, "w")); os.replace(tmp, SEEN)
print("STATE ✓ nothing recorded has been lost." if not bad else "STATE ✗ " + ", ".join(bad))
sys.exit(1 if bad else 0)
