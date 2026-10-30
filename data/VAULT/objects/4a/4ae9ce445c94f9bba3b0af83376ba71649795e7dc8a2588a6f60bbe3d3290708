#!/usr/bin/env python3
# Saves a desk Claude session's conversation (Love's messages, Claude's replies and reports to Love) into HISTORY/ - cornerstone #3 + Love Oct 28 2026 8:42 PM PT:
# "going forward, every change, every statement ever shared between you and i is IN. THE. REPOSITORY. NOTHING LEAVES WITHOUT MY CONSENT. EVER. AGAIN."
# Usage: python3 tools/save-desk-thread.py <transcript.jsonl> <HISTORY/out.md> "<title>"   (re-run any time; rewrites the file from the full transcript, nothing dropped)
import json, sys, re
src, out, title = sys.argv[1:4]
rows = []
for l in open(src, encoding="utf8"):
    try: m = json.loads(l)
    except Exception: continue
    ts = m.get("timestamp", ""); msg = m.get("message") or {}; role = msg.get("role"); c = msg.get("content")
    if role == "user":
        T = c if isinstance(c, str) else " ".join(b.get("text", "") for b in (c or []) if isinstance(b, dict) and b.get("type") == "text")
        for w in re.findall(r'<message[^>]*sent-at="([^"]+)"[^>]*>(.*?)</message>', T, re.S): rows.append((w[0], "Love", w[1].strip()))
        for w in re.findall(r'<note>(.*?)</note>', T, re.S): rows.append((ts, "Coordinator (relayed note)", w.strip()))
    elif role == "assistant":
        for b in c or []:
            if not isinstance(b, dict): continue
            if b.get("type") == "text" and b.get("text", "").strip(): rows.append((ts, "Claude", b["text"].strip()))
            if b.get("type") == "tool_use" and "send_message" in b.get("name", ""): rows.append((ts, "Claude -> Love (project chat)", str((b.get("input") or {}).get("message", "")).strip()))
seen = set(); md = [f"# {title}", "", f"Source transcript: {src}", ""]
for t, who, txt in rows:
    k = (who, txt)
    if k in seen: continue
    seen.add(k); md += [f"### {t} - {who}", "", txt, ""]
open(out, "w", encoding="utf8").write("\n".join(md)); print(out, len(seen), "messages")
