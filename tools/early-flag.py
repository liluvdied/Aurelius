#!/usr/bin/env python3
"""Read-only flag (Love Oct 26 9:56 PM PT: "set up a flag for losses like that, if they ever do occur under the new fix"):
lists every main / rejection / no-pink copy trade since fix295 that entered in a 5m candle's first 30 s and lost.
Writes only data/early-flag/REPORT.md. Changes nothing on the desk."""
import json, os, datetime
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
FIX = datetime.datetime(2026, 10, 27, 4, 53, 49, tzinfo=datetime.timezone.utc)
LANES = {"recon-tog": "main", "recon-rej": "rejection", "recon-togp": "no-pink copy"}
rows = []
g = json.load(open("data/grok-og.json")); rows += g if isinstance(g, list) else g.get("rows", [])
try:
    for l in open("data/grok-og-archive.jsonl"):
        try: rows.append(json.loads(l))
        except Exception: pass
except FileNotFoundError: pass
live = {}
try:
    for k, v in json.load(open("data/live-book-done.json")).items():
        if isinstance(v, dict) and v.get("status") == "filled": live[k.split(":")[0] + ":" + k.split(":")[1]] = True
except Exception: pass
seen, early, flags = set(), [0, 0], []
for r in rows:
    if r.get("lane") not in LANES or r.get("id") in seen: continue
    seen.add(r.get("id"))
    try: d = datetime.datetime.fromisoformat(str(r["at"]).replace("Z", "+00:00"))
    except Exception: continue
    if d < FIX or r.get("result") not in ("win", "loss", "sold"): continue
    sec = (d.minute % 5) * 60 + d.second
    if sec >= 30 or not live.get(str(r.get("id"))): continue  # live fills only: paper lanes skip the walls
    p = float(r.get("pnl") or 0); early[0] += 1; early[1] += p > 0
    if p <= 0:
        pt = d - datetime.timedelta(hours=7)
        flags.append(f"| {pt:%a %b %d %I:%M:%S %p} PT | {r.get('asset')} | {LANES[r['lane']]} | {r.get('side')} | {r.get('label')} | {sec} s | ${p:+.2f} | live |")
os.makedirs("data/early-flag", exist_ok=True)
out = ["# Early-entry loss flag", "", f"Trades since fix295 (Oct 26 9:53 PM PT) that filled LIVE in a 5m candle's first 30 s: {early[0]} ({early[1]} won).", ""]
if flags:
    out += ["⚠️ Losses to review on Friday:", "", "| When | Asset | Book | Side | Setup | Into candle | P&L | Live |", "|---|---|---|---|---|---|---|---|"] + flags
else:
    out += ["✓ No early-entry losses under fix295 so far."]
open("data/early-flag/REPORT.md", "w").write("\n".join(out) + "\n")
print("\n".join(out))
