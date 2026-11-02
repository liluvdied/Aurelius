#!/usr/bin/env python3
# THE RULE MAP (Love Nov 1 2026 2:45 PM PT: "build a map that shows where every active rule lives: file, line, and which command or branch last touched it. Update the map with each new command.").
# Read-only over the desk: every active request and cornerstone, the file and line that proves it, and the last commit to touch that line. Writes data/RULE-MAP.md. No rule reads the map.
import json, os, re, subprocess, sys, datetime
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
OUT = sys.argv[1] if len(sys.argv) > 1 else "data/RULE-MAP.md"
L = [json.loads(x) for x in open("data/LOVE-REQUESTS.jsonl", encoding="utf8") if x.strip().startswith("{")]
req = {e["id"]: e for e in L if e.get("kind") == "request"}
ret = {e["of"] for e in L if e.get("kind") == "retire"}
drop = {}
for e in L:
    if e.get("kind") == "supersede": drop.setdefault(e["of"], []).extend(json.dumps(p, sort_keys=True) for p in e.get("drop", []))
blame, subj, text = {}, {}, {}
def git(*a):
    r = subprocess.run(["git", *a], capture_output=True, text=True, errors="replace")
    return r.stdout if r.returncode == 0 else ""
def lines(f):
    if f not in text:
        try: text[f] = open(f, encoding="utf8", errors="replace").read().split("\n")
        except OSError: text[f] = None
    return text[f]
def blamed(f):
    if f not in blame:
        out, m, n = git("blame", "--porcelain", "--", f), {}, 0
        for l in out.split("\n"):
            h = re.match(r"^([0-9a-f]{40}) \d+ (\d+)", l)
            if h: m[int(h.group(2))] = h.group(1)
        blame[f] = m
    return blame[f]
def last(f, n):
    s = blamed(f).get(n)
    if not s: return "no history"
    if set(s) == {"0"}: return "not committed yet"
    if s not in subj: subj[s] = git("log", "-1", "--format=%h %s", s).strip()
    return subj[s]
def cell(s, w=0):
    s = re.sub(r"\s+", " ", str(s)).replace("|", "\\|")
    return s[:w] + "…" if w and len(s) > w else s
def where(p):
    if isinstance(p, str): return ("words only", "", "")
    if "code" in p or p.get("kind") == "code has":
        f, has = (p.get("code"), p.get("has")) if "code" in p else (p.get("file"), p.get("text"))
        ls = lines(f)
        if ls is None: return (f"{f} MISSING", "", "")
        if has is None and "lacks" in p: return (f, "must not contain: " + cell(p["lacks"], 50), "absent, as her rule asks" if str(p["lacks"]) not in "\n".join(ls) else "PRESENT")
        for i, x in enumerate(ls, 1):
            if str(has) in x: return (f"{f}:{i}", cell(has, 60), last(f, i))
        whole = "\n".join(ls); k = whole.find(str(has))
        if k >= 0: i = whole.count("\n", 0, k) + 1; return (f"{f}:{i}", cell(has, 60), last(f, i))
        return (f"{f} TEXT NOT FOUND", cell(has, 60), "")
    if "config" in p: return (f'{p["config"]} key {p.get("key") or p.get("path")}', f'= {cell(json.dumps(p.get("equals", p.get("eq")), ensure_ascii=False), 40)}', "")
    if "test" in p: return (p["test"], "test", "")
    if "exists" in p: return (p["exists"], "file exists", "")
    if "process" in p: return ("process", cell(p["process"], 60), "")
    return (cell(json.dumps(p, ensure_ascii=False), 70), "", "")
out = ["# Rule map", "", "Written " + datetime.datetime.now().strftime("%b %d %Y %I:%M %p") + " by tools/rule-map.py, at commit " + (git("log", "-1", "--format=%h %s").strip() or "no history") + ".", "", "Read-only. No rule reads this file.", "", "## Active requests", "", "| Rule | Her rule | Lives at | Proof text | Last touched by |", "| --- | --- | --- | --- | --- |"]
n = bad = 0
for rid, e in req.items():
    if rid in ret: continue
    pr = e.get("proof", []); pr = [pr] if isinstance(pr, (dict, str)) else pr
    pr = [p for p in pr if json.dumps(p, sort_keys=True) not in drop.get(rid, [])]
    n += 1; first = True
    for p in pr or ["no proof listed"]:
        w, t, b = where(p)
        if "NOT FOUND" in w or "MISSING" in w: bad += 1
        out.append(f'| {rid if first else ""} | {cell(e.get("what") or e.get("words") or "", 110) if first else ""} | {w} | {t} | {cell(b, 90)} |'); first = False
out += ["", "## Cornerstones", "", "| Cornerstone | Lives at | Last touched by |", "| --- | --- | --- |"]
cs = open("tools/cornerstones.py", encoding="utf8").read(); DESK = sorted(os.path.join("src/lib/desk", f) for f in os.listdir("src/lib/desk") if f.endswith(".ts") and "5m" not in f)
c = 0
for m in re.finditer(r'"(\d+[a-z]?\. [^"\n]{5,}|0[a-z]\. [^"\n]{5,})"', cs):
    msg = m.group(1); t = re.search(r"fix\d+", msg); w, b = "tools/cornerstones.py", ""
    if t:
        for f in DESK:
            ls = lines(f); hit = next((i for i, x in enumerate(ls or [], 1) if t.group(0) in x), 0)
            if hit: w, b = f"{f}:{hit}", last(f, hit); break
    c += 1; out.append(f"| {cell(msg, 130)} | {w} | {cell(b, 90)} |")
out[4] = f"Read-only. No rule reads this file. {n} active requests, {c} cornerstones, {bad} proof lines not found."
open(OUT, "w", encoding="utf8").write("\n".join(out) + "\n")
print(f"  OK rule map: {n} active requests, {c} cornerstones, {bad} proof lines not found -> {OUT}")
