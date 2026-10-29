#!/usr/bin/env python3
"""NO-REMOVAL GATE (cornerstone 0h, R128 - Love Oct 28 2026 8:17 PM PT: "DO NOT LET ANYTHING. ANYYYYYYTHINGGGGGGGGG. EVER. EVER EVER EVER EVER EVERR GET
REMOVED WITHOUT ME TELLLLLLLLING YOU TO REMOVE IT PLEASE I AM FUCKING BEGGING YOU").

Compares an OLD copy of her against a NEW one and REFUSES (exit 1) if the new one takes anything of hers out:
  - code (src/lib/desk/*.ts): any line carrying a fix tag (fixNNN), a request id (RNNN), Love's name/quote or a cornerstone/rule marker, or any line
    that refuses/holds a trade (deny(, a refusal message, block/skip) that is gone,
    and any fix tag that no longer appears anywhere in the file;
  - data/live-switch.json: any setting that is gone or changed.
The ONLY way through is data/ALLOW-REMOVE.json: [{"what": "<text of the line, fix tag or setting path>", "R": "R123"}], where R names a request-book
entry holding Love's own words (data/LOVE-REQUESTS.jsonl). A restore, a card, a cleanup or a rebuild is not permission.

  python3 tools/no-removal-gate.py <old dir> <new dir>     compare two copies of her (each holding src/lib/desk/ and data/live-switch.json)
  python3 tools/no-removal-gate.py <old file> <new file>   compare one file (.ts or live-switch.json)
  python3 tools/no-removal-gate.py                         compare her as she is now against the latest save in data/SAVES (the umpire runs this)
"""
import os, sys, re, json, glob
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
MARK = re.compile(r"fix\d{2,4}|\bR\d{3}\b|Love|CORNERSTONE|cornerstone|LOVE", re.I)
GUARD = re.compile(r"deny\(|return `|return \"[A-Z]|need\(|\bblock|\brefuse|\bskip", re.I)  # lines that refuse or hold a trade
FIX = re.compile(r"\bfix\d{2,4}[a-z]?\b")

def typed(w):
    # cornerstone 0j (Love Oct 28 2026 8:32 PM PT: "they were removed without my consent ... please do not let this ever happen again"): only Love's TYPED words
    # count - a decision-card tap ('card "question" -> "answer"', 'Chose "..."') never does. Strip the card parts; a quoted phrase of hers must remain.
    if not w: return False
    t = re.sub(r'card\s+"[^"]*"\s*->\s*"[^"]*"(\s*\([^)]*\))?', "", str(w)); t = re.sub(r'[Cc]hose\s+"[^"]*"', "", t)
    return bool(re.search(r'"[^"]{2,}"', t))

def love_ids():
    ids = set()
    try:
        for x in open("data/LOVE-REQUESTS.jsonl", encoding="utf8"):
            e = json.loads(x)
            if typed(e.get("words")): ids.add(e.get("id") or e.get("of"))
    except Exception: pass
    return ids

def love_text():
    # cornerstone 0k (Love Oct 28 2026 8:40 PM PT: "nothing goes in, nothing goes out without me expressly claiming it in my own words"): everything an install ADDS must be
    # named (its fix tag or setting) in a request-book entry that holds Love's typed words
    out = []
    try:
        for x in open("data/LOVE-REQUESTS.jsonl", encoding="utf8"):
            e = json.loads(x)
            if typed(e.get("words")): out.append(str(e.get("what", "")) + " " + str(e.get("words", "")))
    except Exception: pass
    return "\n".join(out)

def code_adds(old, new, T):
    # each run of added lines is judged as one block: every fix tag in it must be named in Love's typed requests, and a block with rule lines needs at least one such tag
    OT = open(old, encoding="utf8").read(); O = set(l.strip() for l in OT.split("\n")); OF = set(FIX.findall(OT))
    out = []; blk = []
    def judge(b):
        rule = [x for x in b if MARK.search(x) or GUARD.search(x)]
        if not rule: return
        tags = set(t for x in b for t in FIX.findall(x)) - OF  # only tags NEW to the file need Love's words; an edited line keeps its old tags
        if not tags and not set(t for x in b for t in FIX.findall(x)): tags = set()
        elif not tags: return
        if not tags or not all(re.search(r"\b" + re.escape(t) + r"\b", T) for t in tags):
            for x in rule: out.append(("added without Love's words", x))
    for l in open(new, encoding="utf8").read().split("\n") + [None]:
        s = l.strip() if l is not None else None
        if s is not None and s and s not in O: blk.append(s); continue
        if s == "" and blk: continue
        if blk: judge(blk); blk = []
    return out

def config_adds(old, new, T):
    O = json.load(open(old, encoding="utf8")); N = json.load(open(new, encoding="utf8"))
    out = []
    for k in N:
        if k in O: continue
        m = re.match(r"(fix\d+[a-z]?)Prev\d*$", k)
        if (m and re.search(r"\b" + m.group(1) + r"\b", T)) or re.search(r"\b" + re.escape(k) + r"\b", T): continue
        out.append(("setting added without Love's words", k))
    return out

def allowed():
    try: A = json.load(open("data/ALLOW-REMOVE.json", encoding="utf8"))
    except Exception: return []
    ok = love_ids()
    return [a for a in A if isinstance(a, dict) and a.get("what") and a.get("R") in ok]

def is_allowed(item, A):
    return any(a["what"] in item or item in a["what"] for a in A)

def code_losses(old, new):
    O = open(old, encoding="utf8").read(); N = open(new, encoding="utf8").read()
    nl = set(l.strip() for l in N.split("\n"))
    out = []
    for l in O.split("\n"):
        s = l.strip()
        if s and (MARK.search(s) or GUARD.search(s)) and s not in nl: out.append(("line", s))
    nf = set(FIX.findall(N))
    for t in sorted(set(FIX.findall(O)) - nf): out.append(("fix tag", t))
    return out

def flat(o, p=""):
    if isinstance(o, dict):
        r = {}
        for k, v in o.items(): r.update(flat(v, f"{p}.{k}" if p else k))
        return r if r or not p else {p: o}
    return {p: o}

def config_losses(old, new):
    O = flat(json.load(open(old, encoding="utf8"))); N = flat(json.load(open(new, encoding="utf8")))
    out = []
    for k, v in O.items():
        if k not in N: out.append(("setting gone", k))
        elif N[k] != v: out.append(("setting changed", f"{k}: {json.dumps(v, ensure_ascii=False)[:80]} -> {json.dumps(N[k], ensure_ascii=False)[:80]}"))
    return out

def pairs(old, new):
    if os.path.isfile(old): return [(old, new)]
    P = []
    for f in sorted(glob.glob(os.path.join(old, "src/lib/desk/*.ts"))):
        P.append((f, os.path.join(new, "src/lib/desk", os.path.basename(f))))
    if os.path.exists(os.path.join(old, "LOVE-RULEBOOK.md")): P.append((os.path.join(old, "LOVE-RULEBOOK.md"), os.path.join(new, "LOVE-RULEBOOK.md")))  # her cornerstones (R136)
    for c in ["data/live-switch.json"]:
        if os.path.exists(os.path.join(old, c)): P.append((os.path.join(old, c), os.path.join(new, c)))
    return P

def gate(old, new):
    A = allowed(); bad = []; T = love_text()
    for o, n in pairs(old, new):
        name = os.path.relpath(n) if not n.startswith("/") else n
        if not os.path.exists(n): bad.append((name, "FILE GONE", os.path.basename(n))); continue
        L = config_losses(o, n) if o.endswith(".json") else code_losses(o, n)
        if not n.endswith(".md"): L += config_adds(o, n, T) if o.endswith(".json") else code_adds(o, n, T)
        for kind, item in L:
            if not is_allowed(item, A): bad.append((os.path.basename(n), kind, item))
    return bad

if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) >= 2: old, new = a[0], a[1]
    else:
        saves = sorted(glob.glob("data/SAVES/*/"), key=os.path.getmtime)
        if not saves: print("NO-REMOVAL GATE: no save to compare against"); sys.exit(1)
        old, new = saves[-1], "."
    bad = gate(old, new)
    if bad:
        print(f"NO-REMOVAL GATE: REFUSED - {len(bad)} change(s) to Love's rules/settings without her words - taken out, or put in unasked (old: {old}):")
        for f, k, i in bad[:60]: print(f"  ✗ {f} [{k}] {i[:200]}")
        if len(bad) > 60: print(f"  ... and {len(bad) - 60} more")
        print("Put them back, or have Love retire each one in her own words and name it in data/ALLOW-REMOVE.json with that R#.")
        sys.exit(1)
    print(f"NO-REMOVAL GATE ✓ - nothing of Love's taken out and nothing put in without her words (against {old}).")
