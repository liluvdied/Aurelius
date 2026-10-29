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
# retired by Love Oct 28 2026 7:08 PM PT ("not the fucking checkpoint version" - back to the exact checkpoint, 1-5m flip): need("function anyFlipNow(" in B and ("for (const n of [2, 3, 4, 5] /* fix406" in B or "export function realFlipNow(" in B), "1. HER FLIP: the 2/3/4/5m candle reader exists (fix406, Love Oct 28 2026 5:07 PM PT: cut the 1m)")
need("if (flipRule) { if (!why && !foTurn && !anyFlip406Now(asset, side, tick, 0))" in B and 'if (flipRule && !why && !foTurn && !anyFlip406Now(asset, side, tick, asset === "gold" ? 0.1 : 5))' in B, "1. HER FLIP: no 2-5m candle her way (10c gold / $5 BTC past its open) = no entry, main + rejection (fix424)")
door = re.search(r'const imR = impossibleGeo\([^\n]*', B); wire = re.search(r'const geo = impossibleGeo\([^\n]*', B); cop = re.search(r'else whyR = impossibleGeo\([^\n]*', B)
for nm, m in (("door", door), ("copier", cop), ("wire", wire)):
    t = m.group(0) if m else ""
    need("recon-tog" in t and "recon-rej" in t and ("? true : false" in t), f"1. HER FLIP reaches main + rejection at the {nm}")
need("ONLY IN HER THIRD: long at" in B and "ONLY IN HER THIRD: short at" in B, "2. HER THIRDS: no long top third / no short bottom third")
# CORNERSTONE 4 (Oct 27 2026 ~11:59 AM PT, Love: "save the top/bottom 33% (clear anywhere else) in as one of the cornerstones." + "it's only BLOCKED for a short by the
# BOTTOM 33% / she can short anywhere else in the channel. same for longs."): her read may only drop a short in the bottom share and a long in the top share.
R = open("src/lib/desk/recon.ts", encoding="utf8").read()
need('(c.side === "down" && (f <= k || (fix33 && f <= 0.33) ||' in R and '(c.side === "up" && (f >= 1 - k || (fix33 && f >= 0.67) ||' in R and not re.search(r'c\.side === "down" && \(?f < 0\.6', R),
     "4. THIRDS ONLY BLOCK: short blocked only in the bottom share, long only in the top share (33%; gold 20% on $10-25 channels, 15% over $25; BTC 20% over $500) - clear anywhere else")
need(os.path.exists("tools/save-her.py"), "3. full save before every fix (tools/save-her.py)")
# HER STANDING RULES (Oct 27 2026 ~12:01 PM PT, Love: "PLS DO EVERYTHING YOU CAN TO PREVENT THIS FROM HAPPENING AGAIN"): the 4:51 AM rollback silently took out rules
# the rulebook still listed. Every standing rule's fix tag must stay in her code; a rollback or edit that drops one fails here. Add a line for every new rule Love gives.
E = open("src/lib/desk/engine.ts", encoding="utf8").read(); ALL = B + R + E
# CORNERSTONE (Oct 28 2026 6:21-6:31 PM PT, Love: "yes. we literallly did this 20 fuckin times bro yes. candle. flip. green -> red / red -> green" + "every single book dude yes / don't touch 5M and twin"
# + "the 33% needs to be 1000000%  immutable." + "it is from session band to session band. not the distance from one zone/band to another. again, cornerstone"):
# retired by Love Oct 28 2026 7:08 PM PT: "this shit you just put on after i asked you to put them back on the checkpoint version is not the fucking checkpoint version": need("export function realFlipNow(" in B and "!realFlipNow(asset, side, tick)) why = `HER FLIP: no 2/3/4/5m candle has turned" in B and "is not a flip (copy)." in B, "1. REAL FLIP: a candle that turned green -> red / red -> green, never one born that colour - main, rejection, copy, pure, paper (not 5M, not twin)")
# back (Love Oct 28 2026 7:29-7:30 PM PT: card "All protections back" + "Tonight's flip, exactly" + "a candle born red at a band and falling is still a short" + "do NOT EVERRRRRRR ... REMOVE THOSE AGAIN"):
need("export const isChanBand = (asset: string, l: Line) => (false && quietHour() ? QUIET_EDGE.test(String(l.name)) : /σ$|^session VWAP$|^fresh VWAP$/.test(String(l.name)));" in B and "const edges = chanL(asset, L).filter((l: Line) => isChanBand(asset, l)" in B, "2. HER CHANNEL = SESSION BAND TO SESSION BAND (σ lines + VWAP), never a zone, pink or other band")
# back (Love Oct 28 2026 7:29-7:30 PM PT: card "All protections back" + "Tonight's flip, exactly" + "a candle born red at a band and falling is still a short" + "do NOT EVERRRRRRR ... REMOVE THOSE AGAIN"):
need('asset === "btc" && above - below <= 500 ? 0.33' in B and not re.search(r"IMPOSSIBLE = [^\n]*blueSmall399[^\n]*0\.2", B), "2. BTC 33% top/bottom at channels up to $500 - immutable (no 20%)")
# CORNERSTONE (Oct 28 2026 6:32 PM PT, Love: "ok EVEN if price ticked 1 millimeter over it it was STILL underneath a band hun. there is 0 instance where that is okay" / "it ticked over PINK. not the session band."):
# back (Love Oct 28 2026 7:29-7:30 PM PT: card "All protections back" + "Tonight's flip, exactly" + "a candle born red at a band and falling is still a short" + "do NOT EVERRRRRRR ... REMOVE THOSE AGAIN"):
need(("if (sa413) return deny(`SESSION BAND AHEAD (fix413)" in B or "if (sa418) return deny(`SESSION BAND AHEAD (fix418)" in B) and 'if (book === "recon-tog" || book === "recon-rej") { const sa413' in B, "3. SESSION BAND AHEAD: past pink, an unbroken session band in front = wait for its break or rejection (main + rejection, at the order door; fix424)")
need("only (fix417)." in B and 'dc417 === "green" && ac417 === "red" ? "down" : dc417 === "red" && ac417 === "green" ? "up"' in B, "4. DOJI: green doji then red candle = SHORT only, red doji then green candle = LONG only (Love Oct 28 6:54 PM)")
# CORNERSTONES (Love Oct 28 2026 7:39 PM PT: "please place EVERY. SINGLE ONE of these as cornerstones luv i can't go thru this again" + 7:30 PM "do NOT EVERRRRRRR ... REMOVE THOSE AGAIN"): main + rejection protections restored by fix423-426. Never retire without Love naming the rule.
# 5. (fix376 "waits until $1.50 clear before trading AWAY from a $10 level") RETIRED on Love's typed words Oct 28 2026 9:18 PM PT: "thats not at all what that rule was supposed to be luv. its supposed to be a trade away from even $10 levels on gold. no trading into them. only away from them. within 1.50" (R149) - her real $10 rule is cornerstone 22 (fix440).
need(B.count('if (!why && asset === "gold" && flipRule) { const zf') == 1, "6. GOLD ZONES: no long inside the red zone, no short inside the green (fix377, main + rejection)")
need(B.count('if (!why && asset === "gold" && flipRule) { const zg') == 1, "7. GOLD $1.50 BEFORE THE ZONE: no long within $1.50 under R1, no short within $1.50 over S1 (fix378, main + rejection)")
need("(flipRule ? 0.55" in B and "(flipRule ? 0.45 : 0.50)" in B, "8. GOLD PINK TOLERANCE 55%: pink-to-green no short bottom 55%, pink-to-red no long top 55% (fix409, main + rejection)")
need(B.count("if (togOrderAtWire(t, side) || rejOrderAtWire(t, side)) { /* fix424") == 2 and "THE BLUE VWAP WALL: long" in B and "ACROSS THE BLUE VWAP: long" in B, "9. BLUE VWAP WALLS when bands are small (fix397/399, main + rejection orders)")
need("BTC PINK-REJECTION RE-AIM (fix373" in R and '["recon-tog", "recon-rej"] /* fix424' in R, "10. BTC PINK RE-AIM: an unfilled long refused by pink re-aims to the short (fix373, main + rejection)")
need("export function slideHold403(" in E and "export function slideHoldBtc423(" in E and 'hold423 = row.asset === "gold" ? slideHold403' in E, "11. DOWNSLOPE UNDER PINK: no long while price slides under an unbroken pink until it breaks (fix371/403/423, gold + BTC, main + rejection)")
need("STALE CALL GUARD (fix375" in E, "12. STALE CALL GUARD: a call over 90 s old never fires when a seat opens (fix375/425)")
# CORNERSTONE (Oct 28 2026 8:06 PM PT, Love: "yes to all of them bb , why did alllll of this get removed without my permission? i nevvvvvver ever said to take these out hun. i never would have. red green zone reach is 1.50 now, not 1.11"):
need("export function reachWall429(" in B and "const rw429 = reachWall429(asset, lbR.L, qR.c, side)" in B and "export const REACH429: Record<string, number> = { gold: 1.5, btc: 50 };" in B and 'const ZR = asset === "gold" ? 1.5 : zoneReachSlide(asset, z);' in B and os.path.exists("tools/reach-test-429.cjs"), "14. HER REACH WALL: no trade into an unbroken session band or the pink within $1.50 gold / $50 BTC, red/green zone $1.50 gold; a poke under the break distance is not a break (fix429, main + rejection)")
# CORNERSTONE (Oct 28 2026 8:07 PM PT, Love: "make the pink tolerance a minimum of 15% of the channel width please"):
need("export const PINK_PCT429 = 0.15;" in B and "const pinkReach = Math.max(reach," in B, "15. PINK TOLERANCE: the pink's reach is at least 15% of the session-band channel width (fix430, main + rejection)")
# CORNERSTONES (Oct 28 2026 7:43 PM PT, Love: "NO SHES NOT SUPPOSED TO LONG INTO AN UNBROKEN PINK EVER" + 8:06 PM "yes to all of them bb"):
need("export function pinkLongWall432(" in B and "const pl432 = pinkLongWall432(asset, lbR.L, qR.c, side)" in B and os.path.exists("tools/stale-pink-test-431.cjs"), "16. NEVER LONG INTO AN UNBROKEN PINK: no long under the pink until it breaks up 25c gold / $8 BTC (fix432, main + rejection)")
need("an old call never fires (fix431)" in E, "17. STALE EVEN WHILE RETRYING: a main/rejection call over 90 s old with nothing on Kalshi never fires (fix431)")
# CORNERSTONES (Love Oct 28 2026 8:18-8:23 PM PT: "1 - stay" / "7- back to 2m-5m"):
need("fix406 back as fix433" in B and os.path.exists("tools/flip-test-433.cjs"), "18. HER FLIP 2/3/4/5m (no 1m) in anyFlipNow + anyFlipMinNow (fix433)")
need("true /* fix394: main (fix433) */" in R, "19. MAIN ZONE READS TAKE HER 2-5m FLIP (fix394 back as fix433)")
# CORNERSTONES (Love Oct 28 2026 8:46 PM PT: "price on the same side of the break stays.  33% NEVER. EVER. LEAVES. UNDER. ANY. CIRCUM. STANCES." + 9:01 PM "EVERY SINGLE TRADE THAT EVER LEAVES THIS DESK ... MUST FAIL TO SEND OUT A LIVE ORDER IF THEY ARE NOT MET."):
need("export function sameSide434(" in B and "const ss434 = sameSide434(asset, lbR.L, qR.c, side)" in B and os.path.exists("tools/side-test-434.cjs"), "20. ON HER SIDE OF THE BREAK + HER 33%, session band to session band (fix434, main + rejection)")
need("does not go out unchecked (fix435)" in open("src/lib/desk/kalshi-live.server.ts", encoding="utf8").read() and "main and rejection never skip her walls (fix435)" in open("src/lib/desk/kalshi-live.server.ts", encoding="utf8").read(), "21. EVERY ORDER PASSES HER WALLS OR DOES NOT GO - checked at the wire, fails closed (fix435, main + rejection)")
# CORNERSTONE (Love Oct 28 2026 9:18 PM PT: "its supposed to be a trade away from even $10 levels on gold. no trading into them. only away from them. within 1.50"):
need("(flipRule ? 1.5 : 1) /* fix440" in B and "CLEAR OF THE $10 LEVEL: ${side" not in B and os.path.exists("tools/ten-level-test-440.cjs"), "22. HER $10 LEVEL: no trading INTO an even $10 level when the target is within $1.50, only away; fix376 (held trades going away) out (fix440, main + rejection)")
# CORNERSTONES (Love Oct 28 2026 9:20-9:23 PM PT: "she shorted it when it just broke pink upwards" / "yeah no i got rid of the flip."):
need("const bt441 = brokeThisCandle441(asset, lbR.L, qR.c, side)" in B and os.path.exists("tools/broke-candle-test-441.cjs"), "23. BROKE IT THIS CANDLE = HER SIDE NOW: no trade back against a band/pink broken this candle until price breaks back by her distance (fix441, main + rejection)")
need("THIRDS FLIP OFF (fix442)" in E and os.path.exists("tools/thirds-off-test-442.cjs"), "24. THE THIRDS FLIP IS OFF for main + rejection - a refused call is never turned to the other side (fix442)")
need(os.path.exists("tools/slide-test.cjs") and os.path.exists("tools/slide-test-btc.cjs") and os.path.exists("tools/behaviour-umpire.cjs"), "13. BEHAVIOUR TESTS stay: behaviour umpire + gold/BTC slide replays")
print("HER STANDING RULES")
for tag, what in [("fix296", "BTC no shorts under session -2σ (bottom rung)"), ("fix297", "gold green/red zones rejection only"),
                  ("fix298", "BTC pink cushion $50 or 10%, $25 only at $100 and under"), ("fix302", "copy BTC Bollinger cushion $25 only at $100 and under"),
                  ("fix310", "gold break into a zone needs $3 clearance"), ("fix306", "twin freedoms in her own hours"), ("fix307", "twin at the band, thirds only"),
                  ("fix308", "twin no 30 s hold"), ("fix309", "twin band touch only entry + add-on at the next band"), ("fix325", "HER FLIP 1-5m literal colour"),
                  ("fix326", "pink rejection on her flip (main + rejection)"), ("fix336", "main: no trade executed = free to trade (one EXECUTED trade per window)"), ("fix338", "main gold pink break 25c"), ("fix340", "rejection model: no trade executed = free to trade"), ("fix341", "a call Kalshi gave up on unfilled never holds main or rejection"), ("fix319", "rejection model: pink holds only when stacked with a session band in the top/bottom 10%"), ("fix332", "no-pink copy: pink holds only when stacked with a session band in the top/bottom 10%"), ("fix323", "BTC 40% pink-to-green/red trial (main)"), ("fix324", "BTC 40% trial (rejection)")]:
    need(tag in ALL, f"{tag}: {what}")
if bad: print("CORNERSTONE MISSING - tell Love before anything else:", "; ".join(bad)); sys.exit(1)
print("CORNERSTONES ✓ - all in her.")

