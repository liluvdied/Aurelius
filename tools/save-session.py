#!/usr/bin/env python3
# CORNERSTONE #3 (Love Oct 27 2026 2:09 PM PT: "everything i ever say, and everything you ever say in response; included in the repository."):
# rebuilds an earlier Claude session's conversation from list_events results captured in transcripts (de-duplicated, merged, nothing dropped).
# Usage: python3 save-session.py <session_id> <out.md> "<title>" [transcript files...]
import json, sys, os, re, glob
sid, out, title = sys.argv[1:4]
T = sys.argv[4:] or glob.glob("/root/.claude/projects/**/*.jsonl", recursive=True) + glob.glob("/tmp/claude-0/**/tasks/*.output", recursive=True) + glob.glob("/root/.claude/projects/**/subagents/**/*.jsonl", recursive=True) + glob.glob("/root/.claude/projects/**/tool-results/*list_events*", recursive=True)
J = out[:-3] + ".jsonl"; have = {}
if os.path.exists(J):
    for l in open(J, encoding="utf8"):
        if l.strip(): m = json.loads(l); have[m["uuid"]] = m
def texts(c):
    if isinstance(c, str): return [c]
    o = []
    for b in c or []:
        if isinstance(b, dict) and b.get("type") == "text" and b.get("text"): o.append(b["text"])
    return o
def scan(x):
    if isinstance(x, dict):
        if isinstance(x.get("ccr"), dict) and isinstance(x["ccr"].get("data"), list): yield from x["ccr"]["data"]
        for v in x.values(): yield from scan(v)
    elif isinstance(x, list):
        for v in x: yield from scan(v)
    elif isinstance(x, str) and '"ccr"' in x and sid in x:
        i = x.find("{"); j = x.rfind("}")
        while i >= 0 and j > i:
            try: yield from scan(json.loads(x[i:j + 1])); break
            except Exception: i = x.find("{", i + 1)
for t in T:
    try: fh = open(t, encoding="utf8", errors="replace")
    except Exception: continue
    if "tool-results" in t:  # a big result the harness saved to its own file: plain text holding the {"ccr":...} JSON
        x = fh.read(); i = x.find('{"ccr"'); j = x.rfind("}")
        if sid in x and i >= 0:
            try: lines = [json.dumps(json.loads(x[i:j + 1]))]
            except Exception: lines = []
        else: lines = []
    else: lines = fh
    for l in lines:
        if sid not in l or 'ccr' not in l: continue
        try: e = json.loads(l)
        except Exception: continue
        for ev in scan(e):
            if not isinstance(ev, dict): continue
            for role in ("user", "assistant"):
                r = ev.get(role)
                if not isinstance(r, dict): continue
                ic = r.get("internal_anthropic_catchall", {}); msg = ic.get("message", {})
                tx = texts(msg.get("content"))
                if role == "user" and ic.get("parent_tool_use_id"): continue
                if not tx: continue
                files = [f.get("file_name") for f in ic.get("file_attachments", []) or []]
                have[r["uuid"]] = {"uuid": r["uuid"], "at": ev.get("created_at"), "role": role, "text": "\n\n".join(tx), "files": files}
ms = sorted(have.values(), key=lambda m: m["at"] or "")
open(J, "w", encoding="utf8").write("".join(json.dumps(m, ensure_ascii=False) + "\n" for m in ms))
o = [f"# {title}", "", f"Session {sid}. Every message Love wrote and every reply, oldest first (UTC; PT = UTC-7). Merged on every save; nothing already here is dropped.", ""]
for m in ms:
    o += [f"## {m['at']} - {'LOVE' if m['role'] == 'user' else 'CLAUDE'}" + (f" (attached: {', '.join(m['files'])})" if m["files"] else ""), "", m["text"], ""]
open(out, "w", encoding="utf8").write("\n".join(o))
print(len(ms), "messages", (ms[0]["at"] if ms else ""), "->", (ms[-1]["at"] if ms else ""))
