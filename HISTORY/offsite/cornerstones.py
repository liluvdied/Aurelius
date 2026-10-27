#!/usr/bin/env python3
# CORNERSTONES CHECK (Oct 27 2026 ~11:37 AM PT, Love: "can you add this to the repository please i don't know how things keep slipping out again :( can you
# diagnose that and help get it so things stay put hun?"). READ-ONLY: checks her cornerstone rules are still wired in her code. Run after every fix.
import os, re, sys
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
B = open("src/lib/desk/bandlock.ts", encoding="utf8").read()
bad = []
def need(ok, what):
    print(("  ✓ " if ok else "  ✗ ") + what)
    if not ok: bad.append(what)
print("HER CORNERSTONES")
need("function anyFlipNow(" in B and "for (const n of [1, 2, 3, 4, 5])" in B, "1. HER FLIP: the 1/2/3/4/5m candle reader exists")
need("if (flipRule) { if (!why && !foTurn && !anyFlipNow(asset, side, tick))" in B, "1. HER FLIP: no candle her way = no entry")
door = re.search(r'const imR = impossibleGeo\([^\n]*', B); wire = re.search(r'const geo = impossibleGeo\([^\n]*', B); cop = re.search(r'else whyR = impossibleGeo\([^\n]*', B)
for nm, m in (("door", door), ("copier", cop), ("wire", wire)):
    t = m.group(0) if m else ""
    need("recon-tog" in t and "recon-rej" in t and ("? true : false" in t), f"1. HER FLIP reaches main + rejection at the {nm}")
need("ONLY IN HER THIRD: long at" in B and "ONLY IN HER THIRD: short at" in B, "2. HER THIRDS: no long top third / no short bottom third")
# CORNERSTONE 4 (Oct 27 2026 ~11:59 AM PT, Love: "save the top/bottom 33% (clear anywhere else) in as one of the cornerstones." + "it's only BLOCKED for a short by the
# BOTTOM 33% / she can short anywhere else in the channel. same for longs."): her read may only drop a short in the bottom share and a long in the top share.
R = open("src/lib/desk/recon.ts", encoding="utf8").read()
need('(c.side === "down" && (f <= k || (fix33 && f <= 0.33) ||' in R and '(c.side === "up" && (f >= 1 - k || (fix33 && f >= 0.67) ||' in R and not re.search(r'c\.side === "down" && \(?f < 0\.6', R),
     "4. THIRDS ONLY BLOCK: short blocked only in the bottom 33%, long only in the top 33% - clear anywhere else")
need(os.path.exists("tools/save-her.py"), "3. full save before every fix (tools/save-her.py)")
# HER STANDING RULES (Oct 27 2026 ~12:01 PM PT, Love: "PLS DO EVERYTHING YOU CAN TO PREVENT THIS FROM HAPPENING AGAIN"): the 4:51 AM rollback silently took out rules
# the rulebook still listed. Every standing rule's fix tag must stay in her code; a rollback or edit that drops one fails here. Add a line for every new rule Love gives.
E = open("src/lib/desk/engine.ts", encoding="utf8").read(); ALL = B + R + E
print("HER STANDING RULES")
for tag, what in [("fix296", "BTC no shorts under session -2σ (bottom rung)"), ("fix297", "gold green/red zones rejection only"),
                  ("fix298", "BTC pink cushion $50 or 10%, $25 only at $100 and under"), ("fix302", "copy BTC Bollinger cushion $25 only at $100 and under"),
                  ("fix310", "gold break into a zone needs $3 clearance"), ("fix306", "twin freedoms in her own hours"), ("fix307", "twin at the band, thirds only"),
                  ("fix308", "twin no 30 s hold"), ("fix309", "twin band touch only entry + add-on at the next band"), ("fix325", "HER FLIP 1-5m literal colour"),
                  ("fix326", "pink rejection on her flip (main + rejection)"), ("fix319", "rejection model: pink holds only when stacked with a session band in the top/bottom 10%"), ("fix332", "no-pink copy: pink holds only when stacked with a session band in the top/bottom 10%"), ("fix323", "BTC 40% pink-to-green/red trial (main)"), ("fix324", "BTC 40% trial (rejection)")]:
    need(tag in ALL, f"{tag}: {what}")
if bad: print("CORNERSTONE MISSING - tell Love before anything else:", "; ".join(bad)); sys.exit(1)
print("CORNERSTONES ✓ - all in her.")
