#!/usr/bin/env python3
"""rule-guard (Oct 26 2026 ~11:28 AM PT, Love: "place a safeguard on all of the adjustments we've made so one can't get tossed without
specifically intending for something to get tossed"). Every rule Love made is signed in the code by its fix number (fixNNN) or her
quoted words. This keeps a register of those signatures per file and refuses any new version that drops one, unless the drop is
named on the command line (--drop fixNNN) because Love asked for it.
  python3 tools/rule-guard.py check                 -> compare live desk to the register (hourly watch)
  python3 tools/rule-guard.py vet NEWDIR [--drop X] -> before an install: would NEWDIR/*.ts lose any signature? exit 1 if so
  python3 tools/rule-guard.py seal [--drop X]       -> after a Love-approved install: register the live desk as the new truth"""
import re, os, sys, json, glob
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
REG = "data/rule-guard.json"
PAT = re.compile(r"\bfix\d{1,3}[a-z]?\b|Love[^\"]{0,40}\"[^\"]{12,60}")
def sigs(path):
    try: return sorted(set(m.group(0) for m in PAT.finditer(open(path, encoding="utf-8", errors="ignore").read())))
    except FileNotFoundError: return []
def live(): return {os.path.basename(f): sigs(f) for f in sorted(glob.glob("src/lib/desk/*.ts"))}
def drops(): return set(a for i, a in enumerate(sys.argv) if i and sys.argv[i - 1] == "--drop")
def lost(reg, cur, allow):
    out = []
    for f, ss in reg.items():
        have = set(cur.get(f, []))
        for s in ss:
            if s not in have and not any(s == d or s.startswith(d + " ") or d in s for d in allow): out.append(f + ": " + s)
    return out
cmd = sys.argv[1] if len(sys.argv) > 1 else "check"
if cmd == "seal":
    reg = json.load(open(REG))["files"] if os.path.exists(REG) else {}
    cur = live(); bad = lost(reg, cur, drops())
    if bad: print("REFUSED - these rules would leave the register without being named:"); [print("  -", b) for b in bad]; sys.exit(1)
    json.dump({"note": "signatures of every rule Love made (fixNNN + her words) per desk file; moves only with her say-so", "files": cur}, open(REG, "w"), indent=1)
    print("rule-guard sealed:", sum(len(v) for v in cur.values()), "signatures in", len(cur), "files"); sys.exit(0)
reg = json.load(open(REG))["files"]
if cmd == "vet":
    nd = sys.argv[2]; cur = live()
    for f in glob.glob(os.path.join(nd, "*.ts")): cur[os.path.basename(f)] = sigs(f)
    bad = lost(reg, cur, drops())
    if bad: print("RULE-GUARD STOP - the new files drop rules Love never asked to remove:"); [print("  -", b) for b in bad]; sys.exit(1)
    print("rule-guard ✓ - every rule still in place"); sys.exit(0)
bad = lost(reg, live(), set())
if bad: print("RULE-GUARD: rules missing from the live desk:"); [print("  -", b) for b in bad]; sys.exit(1)
print("rule-guard ✓ - every rule still in place")
