#!/usr/bin/env python3
# CORNERSTONE #3 (Oct 27 2026 2:09 PM PT, Love: "please make sure everything i just said is included in the repository. everything i ever say, and everything
# you ever say in response; included in the repository. no more amnesia. ever again. every new thread has full context on prior events. cornerstone #3.")
# Collects every project-chat message any read_project_chat / read_thread call ever returned in this session's transcripts, de-duplicated by message id,
# and MERGES them into HISTORY/project-chat.jsonl (append-only: a message already there is never dropped) + HISTORY/PROJECT-CHAT.md.
# Usage: python3 save-project-chat.py <repo-dir> [transcript.jsonl ...]   (default: every transcript under /root/.claude/projects)
import json, sys, os, re, glob
repo = sys.argv[1]; T = sys.argv[2:] or glob.glob("/root/.claude/projects/**/*.jsonl", recursive=True)
J = os.path.join(repo, "HISTORY/project-chat.jsonl"); MD = os.path.join(repo, "HISTORY/PROJECT-CHAT.md")
have = {}
if os.path.exists(J):
    for l in open(J, encoding="utf8"):
        if l.strip(): m = json.loads(l); have[m["id"]] = m
def walk(x):
    if isinstance(x, dict):
        if isinstance(x.get("messages"), list):
            for m in x["messages"]:
                if isinstance(m, dict) and str(m.get("id", "")).startswith("cmsg_") and "body" in m: yield m
        for v in x.values(): yield from walk(v)
    elif isinstance(x, list):
        for v in x: yield from walk(v)
    elif isinstance(x, str) and '"messages"' in x:
        for mt in re.finditer(r'\{"messages":\[.*?\],"(?:cursor|has_more)', x, re.S):
            s = mt.group(0); s = s[: s.rfind("],") + 1] + "}"
            try: yield from walk(json.loads(s))
            except Exception: pass
new = 0
for t in T:
    for l in open(t, encoding="utf8", errors="replace"):
        if "cmsg_" not in l or '"messages"' not in l: continue
        try: e = json.loads(l)
        except Exception: continue
        for m in walk(e):
            k = m["id"]
            if k not in have or len(str(m.get("body", ""))) > len(str(have[k].get("body", ""))):  # keep the fullest copy
                new += k not in have; have[k] = {x: m.get(x) for x in ("id", "thread_id", "created_at", "author", "author_name", "body")}
ms = sorted(have.values(), key=lambda m: m.get("created_at") or "")
os.makedirs(os.path.dirname(J), exist_ok=True)
open(J, "w", encoding="utf8").write("".join(json.dumps(m, ensure_ascii=False) + "\n" for m in ms))
out = ["# Project chat - every message (Cornerstone #3)", "", "Love's words and every reply, oldest first. Rebuilt and merged on every save; nothing already here is ever dropped.", ""]
for m in ms:
    who = m.get("author_name") or ("Claude" if m.get("author") == "agent" else m.get("author"))
    b = m.get("body") or ""
    try:
        bj = json.loads(b); b = bj.get("text") or b
    except Exception: pass
    out += [f"**{who}** - {m.get('created_at')} (`{m['id']}`)", "", str(b), "", "---", ""]
open(MD, "w", encoding="utf8").write("\n".join(out))
print(len(ms), "messages,", new, "new")
