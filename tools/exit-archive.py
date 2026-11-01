#!/usr/bin/env python3
"""EXIT ARCHIVE (Love Oct 29 2026 2:23 PM PT: "Is there anyway you can have it save more than the last 80 hun? or at least push them to git hub?").
The desk keeps only her newest 80 exits in data/exit-log.json (engine.ts: rows.slice(0, 80), ~40 hours). This copies every exit it has not seen yet into
data/exit-log-archive.jsonl - append-only, never trimmed, oldest first, one exit per line - and commits that one file to her git (which pushes it to GitHub).
Reads exit-log.json only; never writes it. The desk is not touched. Safe to run any time, any number of times: an exit is only ever added once."""
import os, sys, json, hashlib, time, subprocess
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
A = "data/exit-log-archive.jsonl"
fp = lambda x: hashlib.sha256(json.dumps(x, sort_keys=True).encode()).hexdigest()[:16]
for i in range(5):  # the desk rewrites exit-log.json live; a read caught mid-write is retried
    try: rows = json.load(open("data/exit-log.json")); break
    except Exception:
        if i == 4: print("EXIT ARCHIVE: exit-log.json unreadable right now - nothing changed, next run catches up"); sys.exit(0)
        time.sleep(0.3)
have = set()
if os.path.exists(A):
    for l in open(A, encoding="utf8"):
        if l.strip():
            try: have.add(fp(json.loads(l)))
            except Exception: pass
new = [r for r in reversed(rows) if fp(r) not in have]  # exit-log is newest first; the archive is oldest first
if new:
    with open(A, "a", encoding="utf8") as f:
        for r in new: f.write(json.dumps(r, sort_keys=True) + "\n")
total = len(have) + len(new)
print(f"EXIT ARCHIVE: +{len(new)} new exits, {total} kept forever in {A}")
if new and os.path.isdir(".git") and not os.path.exists(".git/index.lock"):
    subprocess.run(["git", "add", "-f", A], capture_output=True)
    r = subprocess.run(["git", "-c", "user.name=Love", "-c", "user.email=liluvdied@users.noreply.github.com", "commit", "-q", "-m",
                        f"Exit archive: +{len(new)} exits ({total} kept)", "--", A], capture_output=True, text=True)
    print("  " + (r.stdout.strip() or ("committed" if r.returncode == 0 else "not committed this time: " + (r.stderr.strip() or r.stdout.strip())[-160:])))
