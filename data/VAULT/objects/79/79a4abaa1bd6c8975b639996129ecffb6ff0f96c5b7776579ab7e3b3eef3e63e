#!/usr/bin/env python3
"""Pull the archived paper-book trades back in (fix305, Oct 27 2026; Love: "archived as long as they can load from the file if i want to click one and see them").
data/live-paper-book-archive.jsonl holds every trade trimmed from data/live-paper-book.json, one per line.
Run: python3 tools/restore-live-book.py         -> moves them back into data/live-paper-book.json (trades already there win) and renames the
                                                  archive to .restored so the desk stops filtering them out.
     python3 tools/restore-live-book.py --peek  -> just counts them, changes nothing.
The full pre-trim file is also kept as data/live-paper-book.full-2026-10-27.json."""
import json, os, sys
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
A = "data/live-paper-book-archive.jsonl"; P = "data/live-paper-book.json"
arc = {}
for l in open(A):
    try: t = json.loads(l); arc[t["id"]] = t
    except Exception: pass
print(len(arc), "archived trades")
if "--peek" in sys.argv: sys.exit(0)
cur = json.load(open(P)); have = {t.get("id") for t in cur["trades"]}
add = [t for i, t in arc.items() if i not in have]
cur["trades"] = sorted(cur["trades"] + add, key=lambda t: t.get("openedAt") or "", reverse=True)
os.replace(A, A + ".restored")
open(P + ".restore.tmp", "w").write(json.dumps(cur)); os.replace(P + ".restore.tmp", P)
print("restored", len(add), "trades into", P)
