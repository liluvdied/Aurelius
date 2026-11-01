#!/usr/bin/env python3
"""NO RULE SWITCHED OFF (fix476, Love Oct 29 2026 4:20 PM PT: "don't let my rules EVER GET TURNED OFF AGAIN. EVER. PUT THAT IN A COMMAND. NEEVRR EVER EVRR EVER TURN ONE OFF
AGAIN." + 4:19 PM: "IF ITS NOT FUCKING FUNCTIONAL ITS NOT FUCKING THERE"). The no-removal gate catches a rule line that is deleted; this catches a rule that stays written
but stops working. Compares her desk code (src/lib/desk/*.ts) and her settings (data/live-switch.json) against her latest save and REFUSES (exit 1) on:
  - a line that changed only by a switch flipping: true <-> false (e.g. fix309's `const DLY_TOUCH_ONLY = true` that silenced her other-side rule on Oct 27)
  - a kill added to a line: `false &&`, `&& false`, `if (false`, `0 &&`, `|| true` short-circuits
  - a line that was running and is now commented out (`//` added in front)
  - a setting that turns something off: a key named on / enabled / live / active going true -> false, or a list of skip/off hours growing
The ONLY way through is data/ALLOW-REMOVE.json [{"what": "<text of the old line or the setting path>", "R": "R123"}] naming an entry of Love's typed words.
  python3 tools/no-switch-off-gate.py                 her as she is now against the latest save in data/SAVES (the umpire runs this)
  python3 tools/no-switch-off-gate.py <old dir> <new dir>
"""
import os, sys, re, json, glob, difflib
os.chdir(os.environ.get("AUR_ROOT") or os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
src = open("tools/no-removal-gate.py", encoding="utf8").read().split('if __name__ == "__main__":')[0]
G = {"__file__": "tools/no-removal-gate.py"}; exec(compile(src, "no-removal-gate", "exec"), G)  # her own typed-words + ALLOW-REMOVE rules, unchanged
KILL = re.compile(r"\bfalse\s*&&|&&\s*false\b|\bif\s*\(\s*false\b|(?<![\w.)\]<>=!+\-*/%])(?<![\w.)\]<>=!+\-*/%]\s)\b0\s*&&|\|\|\s*true\b")  # fix481: "> 0 &&" is a comparison, not a kill switch (it was a false alarm)
def norm_bool(s): return re.sub(r"\b(true|false)\b", "B", s)
def code_offs(old, new):
    O = open(old, encoding="utf8").read().split("\n"); N = open(new, encoding="utf8").read().split("\n")
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, O, N, autojunk=False).get_opcodes():
        if tag != "replace": continue
        for o, n in zip(O[i1:i2], N[j1:j2]):
            os_, ns = o.strip(), n.strip()
            if os_ == ns: continue
            if norm_bool(os_) == norm_bool(ns) and re.findall(r"\b(?:true|false)\b", os_) != re.findall(r"\b(?:true|false)\b", ns): out.append(("switch flipped", os_ + "  ->  " + ns))
            elif len(KILL.findall(n)) > len(KILL.findall(o)): out.append(("kill switch added", os_ + "  ->  " + ns))
            elif not os_.startswith("//") and ns.startswith("//") and ns.lstrip("/ ").strip() == os_: out.append(("commented out", os_))
    return out
def cfg_offs(old, new):
    O = G["flat"](json.load(open(old, encoding="utf8"))); N = G["flat"](json.load(open(new, encoding="utf8")))
    out = []
    for k, v in O.items():
        if k not in N: continue
        leaf = k.split(".")[-1].lower()
        if leaf in ("on", "enabled", "active") and v is True and N[k] is False: out.append(("setting turned off", k))
        if ("skip" in k.lower() or "off" in leaf) and isinstance(v, list) and isinstance(N[k], list) and set(N[k]) > set(v): out.append(("more hours switched off", f"{k}: +{sorted(set(N[k]) - set(v))}"))
    return out
def gate(old, new):
    A = G["allowed"](); bad = []
    for f in sorted(glob.glob(os.path.join(old, "src/lib/desk/*.ts"))):
        n = os.path.join(new, "src/lib/desk", os.path.basename(f))
        if os.path.exists(n): bad += [(os.path.basename(f), k, i) for k, i in code_offs(f, n)]
    o, n = os.path.join(old, "data/live-switch.json"), os.path.join(new, "data/live-switch.json")
    if os.path.exists(o) and os.path.exists(n): bad += [("live-switch.json", k, i) for k, i in cfg_offs(o, n)]
    # exact AND fresh: her permission must name this very line or setting AND be a request she made after the copy we compare against - an old permission
    # for the same setting (e.g. liveSkipHours.btc, R146) never waves a new switch-off through
    import datetime
    try: since = json.load(open(os.path.join(old, "SAVE.json"))).get("savedAtUTC") or ""
    except Exception: since = datetime.datetime.fromtimestamp(os.path.getmtime(old), datetime.timezone.utc).isoformat()
    at = {}
    for x in open("data/LOVE-REQUESTS.jsonl", encoding="utf8"):
        try: e = json.loads(x); at[e.get("id")] = str(e.get("at", ""))
        except Exception: pass
    fresh = lambda r: at.get(r, "")[:19] >= str(since)[:19]
    ok = lambda x: any(str(a["what"]).strip() == x.strip() and fresh(a.get("R")) for a in A)
    return [b for b in bad if not ok(b[2].split("  ->  ")[0]) and not ok(b[2].split(":")[0])]
if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) >= 2: old, new = a[0], a[1]
    else:
        saves = sorted(glob.glob("data/SAVES/*/"), key=os.path.getmtime)
        if not saves: print("NO RULE SWITCHED OFF: no save to compare against"); sys.exit(1)
        old, new = saves[-1], "."
    bad = gate(old, new)
    if bad:
        print(f"NO RULE SWITCHED OFF: REFUSED - {len(bad)} of Love's rules switched off without her words (against {old}):")
        for f, k, i in bad[:40]: print(f"  ✗ {f} [{k}] {i[:220]}")
        print("Turn it back on, or have Love retire it in her own words and name it in data/ALLOW-REMOVE.json with that R#."); sys.exit(1)
    print(f"NO RULE SWITCHED OFF ✓ - every one of Love's rules is still switched on (against {old}).")
