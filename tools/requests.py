#!/usr/bin/env python3
# CORNERSTONE #1 - LOVE'S REQUEST BOOK (Oct 27 2026 2:03 PM PT, Love: "if i requested something to be done on the model, ensure that it CANNOT be removed without
# express permission from ME. Do it FIRST. save the request, and log it permanently. make it immutable to change until expressly changed by ME. RETAIN. THE
# INFORMATION. NO AMNESIA ON REQUESTS. LOGGED. TRACKED. AND ABLE TO BE REDRAWN ON REQUEST. ZERO EXCEPTIONS. NO REQUEST IS TO BE MADE MORE THAN ONCE AGAIN.
# REQUEST ASKED FOR = REQUEST COMPLETED. IN THAT ORDER. ... CORNERSTONE #1.")
#
# data/LOVE-REQUESTS.jsonl is APPEND-ONLY and HASH-CHAINED: every line carries the fingerprint of the line before it, so no request can be edited or removed
# without the check failing. Each request carries PROOF that it is still in her (a piece of code, a setting, or a test that must pass). The umpire runs
# `requests.py check` every time: a missing proof or a broken chain = OUT.
#   python3 tools/requests.py                      show every request (newest first) - "redrawn on request"
#   python3 tools/requests.py show <word>          show requests matching a word
#   python3 tools/requests.py add  <json>          record a NEW request FIRST, before any work ({"words","what","books","proof":[...]})
#   python3 tools/requests.py retire <id> "<Love's exact words>"   only when Love herself says to take it out - the request stays in the book, marked retired
#   python3 tools/requests.py check                every active request still in her + chain unbroken (the umpire runs this)
# Proof kinds: {"code": "path", "has": "text"} | {"code": "path", "lacks": "text"} | {"config": "path", "key": "a.b", "lacks": x | "has": x | "equals": x}
#              | {"test": "tools/x.py"} | {"exists": "path"} | {"process": "how it is kept"} (a working rule with no code - shown on every check, never dropped)
import os, sys, json, hashlib, datetime, subprocess, stat
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
P = "data/LOVE-REQUESTS.jsonl"; MD = "HISTORY/LOVE-REQUESTS.md"
def load():
    if not os.path.exists(P): return []
    return [json.loads(l) for l in open(P, encoding="utf8") if l.strip()]
def h(e): return hashlib.sha256(json.dumps({k: v for k, v in e.items() if k != "hash"}, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
def append(e):
    L = load(); e["prev"] = L[-1]["hash"] if L else "start"; e["hash"] = h(e)
    try: os.chmod(P, 0o644)
    except Exception: pass
    with open(P, "a", encoding="utf8") as f: f.write(json.dumps(e, ensure_ascii=False) + "\n")
    os.chmod(P, 0o444); write_md(); return e
def state():
    L = load(); req = {}; ret = {}
    for e in L:
        if e.get("kind") == "request": req[e["id"]] = e
        elif e.get("kind") == "retire": ret[e["of"]] = e
    return L, req, ret
def proof_ok(p):
    try:
        if "code" in p:
            t = open(p["code"], encoding="utf8").read()
            return (p["has"] in t) if "has" in p else (p["lacks"] not in t)
        if "config" in p:
            v = json.load(open(p["config"], encoding="utf8"))
            for k in p["key"].split("."): v = v[k]
            if "equals" in p: return v == p["equals"]
            if "has" in p: return p["has"] in v
            if "lacks" in p: return p["lacks"] not in v
        if "test" in p: return subprocess.run([sys.executable, p["test"]], capture_output=True).returncode == 0
        if "exists" in p: return os.path.exists(p["exists"])
        if "process" in p: return True
    except Exception: return False
    return False
def show(q=""):
    L, req, ret = state()
    for e in sorted(req.values(), key=lambda e: e["at"], reverse=True):
        if q and q.lower() not in json.dumps(e, ensure_ascii=False).lower(): continue
        r = ret.get(e["id"])
        print(f'{e["id"]}  {e["at"]}  {"RETIRED by Love: " + r["words"] if r else "ACTIVE"}\n  Love: "{e["words"]}"\n  what: {e["what"]}  books: {", ".join(e.get("books", []))}')
        for p in e.get("proof", []): print("  proof: " + ("✓ " if proof_ok(p) else "✗ ") + json.dumps(p, ensure_ascii=False))
        print()
def write_md():
    L, req, ret = state()
    out = ["# Love's request book (Cornerstone #1)", "", "Append-only and hash-chained (data/LOVE-REQUESTS.jsonl). Rebuilt on every umpire run. A request leaves only on Love's own words.", ""]
    for e in sorted(req.values(), key=lambda e: e["at"], reverse=True):
        r = ret.get(e["id"])
        out += [f'## {e["id"]} - {e["what"]}', f'- when: {e["at"]}', f'- Love: "{e["words"]}"', f'- books: {", ".join(e.get("books", []))}', f'- status: {"RETIRED - Love: " + chr(34) + r["words"] + chr(34) if r else "ACTIVE"}']
        out += ["- proof: " + json.dumps(p, ensure_ascii=False) for p in e.get("proof", [])] + [""]
    os.makedirs("HISTORY", exist_ok=True)
    try: os.chmod(MD, 0o644)
    except Exception: pass
    open(MD, "w", encoding="utf8").write("\n".join(out))
def check():
    L, req, ret = state(); bad = []; prev = "start"
    for i, e in enumerate(L):
        if e.get("prev") != prev or e.get("hash") != h(e): bad.append(f"line {i + 1} of the request book was changed or removed"); break
        prev = e["hash"]
    if not L: bad.append("the request book is empty")
    for e in req.values():
        if e["id"] in ret: continue
        for p in e.get("proof", []):
            if not proof_ok(p): bad.append(f'{e["id"]} ({e["what"]}): proof missing {json.dumps(p, ensure_ascii=False)}')
    write_md()
    for b in bad: print("  ✗ " + b)
    act = len([k for k in req if k not in ret])
    if bad: print(f"REQUESTS BROKEN - a request of Love's is not in her. Put it back or ask Love: {len(bad)} problem(s)"); sys.exit(1)
    print(f"REQUESTS ✓ - all {act} of Love's active requests are in her; the book is unbroken ({len(L)} lines).")
if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: show()
    elif a[0] == "show": show(" ".join(a[1:]))
    elif a[0] == "check": check()
    elif a[0] == "add":
        e = json.loads(a[1]); assert e.get("words") and e.get("what") and e.get("proof"), "words, what and proof are required"
        _, req, _ = state(); e = {"kind": "request", "id": "R%03d" % (len(req) + 1), "at": e.get("at") or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"), **{k: v for k, v in e.items() if k != "at"}}
        print("recorded", append(e)["id"])
    elif a[0] == "retire":
        assert len(a) >= 3 and a[2].strip(), "retiring needs Love's exact words"
        _, req, _ = state(); assert a[1] in req, "no such request"
        print("retired", append({"kind": "retire", "of": a[1], "words": a[2], "at": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")})["of"])
