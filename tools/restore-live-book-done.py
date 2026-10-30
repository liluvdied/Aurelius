#!/usr/bin/env python3
"""Pull the archived live-book-done records back in (Love Oct 26 10:45 PM PT: "make it the same kind of archive, one that i can pull up and have load if i want").
data/live-book-done-archive.jsonl holds every record trimmed from data/live-book-done.json, one per line ({"key": ..., ...record}), like grok-og-archive.jsonl.
Run: python3 tools/restore-live-book-done.py         -> merges every archived record back into data/live-book-done.json (records already there win).
     python3 tools/restore-live-book-done.py --peek  -> just counts them, changes nothing.
The full pre-trim file is also kept as data/live-book-done.full-2026-10-27.json."""
import json, os, sys
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
A = "data/live-book-done-archive.jsonl"; P = "data/live-book-done.json"
arc = {}
for l in open(A):
    try: r = json.loads(l); k = r.pop("key"); arc[k] = r
    except Exception: pass
print(len(arc), "archived records")
if "--peek" in sys.argv: sys.exit(0)
cur = json.load(open(P)); n = 0
for k, v in arc.items():
    if k not in cur: cur[k] = v; n += 1
open(P + ".restore.tmp", "w").write(json.dumps(cur, indent=1)); os.replace(P + ".restore.tmp", P)
print("restored", n, "records into", P)
