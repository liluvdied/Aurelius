#!/usr/bin/env python3
# HER RULE ANCHORS (Oct 27 2026 ~12:15 PM PT, Love: "do more to make sure this doesn't happen again. cover every single base and call the umpire to call it safe
# before you look away"). Every rule in her code carries Love's own words in its comment. This file records every one of those quotes (her anchors) and
# FAILS if any anchor disappears from her code - a rollback, restore or edit can no longer remove one of her rules silently.
#   python3 tools/rule-anchors.py           check (run after every fix, next to verify-golden + cornerstones)
#   python3 tools/rule-anchors.py --add     record anchors for a new rule (only ADDS; never removes)
#   python3 tools/rule-anchors.py --retire "<anchor>" "<Love's words>"   only when Love herself says a rule goes; her words are written beside it
import json, os, re, sys, glob, datetime
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
DB = "data/RULE-ANCHORS.json"
FILES = sorted(glob.glob("src/lib/desk/*.ts")) + sorted(glob.glob("src/lib/*.ts"))
def norm(s): return re.sub(r"\s+", " ", s).strip()
def scan():
    out = {}
    for f in FILES:
        t = open(f, encoding="utf8", errors="replace").read()
        for m in re.finditer(r'Love[^"\n]{0,80}?: "([^"\n]{24,})', t):
            a = norm(m.group(1))[:60]
            out.setdefault(a, os.path.basename(f))
    return out
now = scan()
db = json.load(open(DB)) if os.path.exists(DB) else {"anchors": {}, "retired": []}
if len(sys.argv) > 1 and sys.argv[1] == "--add" or not db["anchors"]:
    added = [a for a in now if a not in db["anchors"]]
    for a in added: db["anchors"][a] = {"file": now[a], "at": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    json.dump(db, open(DB, "w"), indent=1, ensure_ascii=False); print(f"recorded {len(added)} new anchors ({len(db['anchors'])} total)")
elif len(sys.argv) > 3 and sys.argv[1] == "--retire":
    a = sys.argv[2]; assert a in db["anchors"], "no such anchor"
    db["retired"].append({"anchor": a, **db["anchors"].pop(a), "love": sys.argv[3], "retiredAt": datetime.datetime.now(datetime.timezone.utc).isoformat()})
    json.dump(db, open(DB, "w"), indent=1, ensure_ascii=False); print("retired on Love's words")
gone = [a for a in db["anchors"] if a not in now]
print(f"HER RULE ANCHORS: {len(db['anchors']) - len(gone)} of {len(db['anchors'])} of her rules in her code")
if gone:
    print("RULES MISSING - put back or ask Love before anything else:")
    for a in gone: print(f'  ✗ [{db["anchors"][a]["file"]}] "{a}..."')
    sys.exit(1)
print("ANCHORS ✓ - none of her rules has gone missing.")
