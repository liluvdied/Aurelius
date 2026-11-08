# Her change history

Every install, oldest first: what she did BEFORE, what she does AFTER, Love's own words, the files and the exact code diff. Rebuilt 2026-11-07 18:50 from her desk branch and her requests book.

## 1. PINK BREAK = THE ENTRY, put in whole (fix641, R328)
- When: 2026-11-04 13:39:42 -0800
- Commit: [c3c2ef1b](https://github.com/liluvdied/Aurelius/commit/c3c2ef1b2c4873c9fad07961965af4e26a8b2917)
- Her words: Love Nov 4 2026 1:24 PM PT: "Yes. A pink break enters the moment the push is met. Price must still be on the same side of the band at the fill. If it flips before the fill, refuse it at the door. The flip is still required on rejections." + "anything over 1k channel width for btc goes to 10% for pink tolerance." + "for gold anything over $25 goes to $3 for pink tolerance okay" + 1:32 PM: "that's good bb thank you i input it"
- Before: R327: A pink break (Break/Close above/below 5m PP) enters the moment price is $5 BTC / 25c gold past the pink - no 2/5m flip needed; price back across the pink before the order = refused (her walls, the send, and resting orders). Rejections still need the flip. Red falling 5m candle still refuses longs. 55% stays. BTC pink tolerance 10% of the channel over $1,000 (15% $500-$1,000 unchanged). Gold over $ | R308: fix592+fix593+fix594 HER FLIP BAND ZONE AT THE SEND: fix594 zoneSend594 at the door (impossibleGeo) and the last line (finalGate524) refuses a long in the top 55% of pink to red or at/past the red boundary, and a short in the bottom 55% of pink to green or at/past the green boundary, both assets, on the live tick; unreadable zones = refused at the last line. fix593 her session-band scale in sessio
- After: fix641 (R327 put in whole - the send file had not gone in, and R327 had no checkable proof): a pink break (Break/Close above/below 5m PP) enters the moment price is $5 BTC / 25c gold past the pink - no 2/5m flip needed, at her walls, the send and on resting orders; price back across the pink before the order = refused (PINK BREAK GONE). Rejections still need the flip. Red falling 5m candle still refuses longs. 55% stays. BTC pink tolerance 10% of the channel over $1,000 (15% $500-$1,000 unchanged). Gold over $25 = $3 unchanged.
- Files: src/lib/desk/bandlock.ts (+15/-15), src/lib/desk/engine.ts (+1/-1), src/lib/desk/kalshi-live.server.ts (+1/-1), src/lib/desk/recon.ts (+1/-1), tools/behaviour-umpire.cjs (+14/-14), tools/cornerstones.py (+1/-1), tools/pink-flag-25-test.cjs (+2/-2)

## 2. PAST THE BAND, HER COLOUR (fix642, R329)
- When: 2026-11-04 14:02:13 -0800
- Commit: [1c32c8d8](https://github.com/liluvdied/Aurelius/commit/1c32c8d8259a83429351213a80eb7bd664f010b1)
- Her words: Love Nov 4 2026 1:53 PM PT: "Once the pink is broken and price is still above it, she longs. She does not wait for another cross. The same for shorts below. The 55% and the red-falling-5m rule stay." + 1:53 PM: "not just pink. a session band or green zone or red zone. a flip or a candle born it's color after the push requirement." + 1:55 PM (does the pink break wait for a green candle too?): "yes" + 1:56 PM: "she enters at price pushing off of any band or zone in her color at the push requirement please"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix642: past the pink ($5 BTC / 25c gold), a session band or the green / red zone (her $5 BTC / 33c gold break) and still past it, on a 2/5m candle that turned or was born her colour past its open, she enters - no new cross needed, both ways. The pink break now waits for that candle too (fix641's no-flip go is gone by her 'yes'). Zone breaks on her colour now count (fix67/fix297 still hold every other zone read). The 55%, the red-falling-5m rule and her thirds stay.
- Files: src/lib/desk/bandlock.ts (+1/-0), src/lib/desk/recon.ts (+5/-0), tools/behaviour-umpire.cjs (+17/-6)

## 3. REJECTIONS ONLY NO PINK, new paper book (fix643, R330)
- When: 2026-11-04 14:20:59 -0800
- Commit: [f3d20428](https://github.com/liluvdied/Aurelius/commit/f3d20428b9968e46fa2752f70367ee8db27bf90d)
- Her words: Love Nov 4 2026 2:10 PM PT: "let's keep that one the way it was , and create a new rejection only model with pink excluded as well. she only trades rejections of session bands, red/green zones and bollingers. nothing else. same rules we just went over. only takes rejections , no pinks and no breaks pls" + "keep that no pink as it is , we will have another one that does that"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix643: a NEW PAPER book recon-rjnp (card RECONSTRUCTED · REJECTIONS ONLY · NO PINK): rejections only off the session bands, the green / red zone and the Bollingers - no pink trades, no breaks - on a 2/5m candle turned or born her colour after the push, through main's thirds, pink wall and door (55%, red falling 5m, every wall). The no-pink book recon-rnp is untouched. In no live list.
- Files: src/components/desk/app.tsx (+1/-0), src/lib/desk/grokog.ts (+1/-0), src/lib/desk/recon.ts (+10/-0)

## 4. PUSH OFF THE NEAREST BAND, NO TOUCH (fix645, R332)
- When: 2026-11-04 14:37:54 -0800
- Commit: [70feccde](https://github.com/liluvdied/Aurelius/commit/70feccde12cd6a49a0ad114df32f0c1688354397)
- Her words: Love Nov 4 2026 2:29-2:30 PM PT: "i DO want her to trade if a candle is born our color & is under a band pushing off , and i DO want her to long if a candle is born our color & is over a band &&& is pushing off." + "i don't want that in. i never asked for it to need a touch." + "it just needs to push away from a band or zone with the push requirement"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix645: trade away from the closest band with no touch - the nearest line over price + a 2/5m candle turned or born red past its open (the pink also needs her $10 BTC / tap gold push off its candle open) = the short off it; nearest line under + green = the long. Every wall still judges it.
- Files: src/lib/desk/recon.ts (+5/-0)

## 5. PINK SLIDE AT 44% (fix646, R333)
- When: 2026-11-04 15:05:13 -0800
- Commit: [d591682c](https://github.com/liluvdied/Aurelius/commit/d591682ce0ba57e0ab9bc98e154c35915436b943)
- Her words: Love Nov 4 2026 2:54 PM PT: "44% for main & rejection for now pls we will test that"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix646: her pink slide / climb (3 rejections, longs or shorts only until a 10% break) turns on with the pink in the bottom / top 44% of the channel - was 33% (fix584). One threshold in pinkThird584, shared by every book that reads the slide.
- Files: src/lib/desk/engine.ts (+1/-1)

## 6. EVERY REFUSAL ON ITS OWN LINE + SKIP SCORECARD (fix647, R334)
- When: 2026-11-04 15:21:44 -0800
- Commit: [f0580432](https://github.com/liluvdied/Aurelius/commit/f058043278d046a172fa06e3473e388dc8369c84)
- Her words: Love Nov 4 2026 3:11 PM PT: "please give them all their own line so we can test and track them individually" + "add any other metrics that will help gather data to refine her entries and stop bleeds"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix647 LOG ONLY: every rule in her read's thirds / candle / flip filter (THIRDS, BTC 33%, RED FALLING 5M, GREEN RISING 5M, PAST THE WHOLE CHANNEL) writes its own line to data/skip-reasons.jsonl - the read decides exactly as before. tools/skip-scorecard.py (read only) settles every refused 15m window per rule from her price log (SAVED = would have lost, MISSED = would have won) and lists her taken trades by setup, worst first -> data/SKIP-SCORECARD.txt.
- Files: src/lib/desk/recon.ts (+2/-0)

## 7. CHANNEL 649 + WICK OUT 650 + BREAK 2 651 in; CHECKS UPDATED (fix652, R339)
- When: 2026-11-04 16:53:11 -0800
- Commit: [68625021](https://github.com/liluvdied/Aurelius/commit/686250211349624c334a86a945d18b2f73fc0d99)
- Her words: Love Nov 4 2026 4:02 PM PT: "make it $2 on the break." + 4:44 PM PT (on updating the checks that still held $5, no trading code): "yes"
- Before: R294: fix561 HER $5 BREAK AT THE PINK WALLS TOO: PINK_BREAK432 btc 8 -> 5 in bandlock.ts, so the never-long-under / never-short-over an unbroken pink walls (pinkLongWall432 / pinkShortWall464, door + read) free BTC on her $5 break like every other site (1:07 AM a long $7.74 through pink was refused under the $8); gold 25c unchanged; stale-pink test checks $5; not delayed, not the 5M; cornerstone 70. | R305: fix580 GAP CLOSED: (1) recon.ts bonesDecide break candidate (the line still waiting past $5) used BREAK btc $6 for every line - the pink now casts its break at her $5 BTC / 25c gold, and BREAK btc $6 -> $5 so a session band break casts at $5 too (bandlock BREAK_DIST + PINK_BREAK btc $6 -> $5, same value); gold 33c session untouched. (2) __PINKFLAT25 true -> false in bandlock + recon (weekend $25 o | R306: fix583 THIRDS FREE AT $5: the falling-from-the-top-third / rising-from-the-bottom-third walls (bandlock awayVerdict FROZEN_THIRD_DIST + reconThirdAgainst RT_DIST) free on her $5 BTC move off the high/low (was $8). Arming distance and gold 33c untouched. Pink tolerance untouched.
- After: fix652 CHECKS ONLY, no trading code: (1) tools/check-her-rules.cjs and tools/independent-calls-test-463.cjs carry her 3% margin (MARGIN648, fix648) when they lift thirdsRead463 out of recon.ts - they crashed on it after fix649; (2) tools/thirds-five-583.cjs holds her $2 break (fix651): $1 still waits, $2 frees; (3) the $5 code proofs of R294, R305 and R306 are superseded by their $2 text from fix651 (kept in the book, marked superseded, never deleted).
- Files: src/lib/desk/bandlock.ts (+16/-13), src/lib/desk/engine.ts (+1/-1), src/lib/desk/recon.ts (+5/-4), tools/behaviour-umpire.cjs (+4/-4), tools/broke-candle-test-457.cjs (+4/-4), tools/check-her-rules.cjs (+1/-1), tools/cornerstones.py (+2/-2), tools/five-break-enters-579.cjs (+2/-2), tools/independent-calls-test-463.cjs (+1/-1), tools/pink-break-casts-580.cjs (+2/-2), tools/stale-pink-test-431.cjs (+1/-1), tools/thirds-five-583.cjs (+6/-5)

## 8. PINK SLIDE HER WAY (fix658, R347)
- When: 2026-11-04 18:46:35 -0800
- Commit: [2e961d8e](https://github.com/liluvdied/Aurelius/commit/2e961d8e67fb937c4d128b649473e9e52854ecf8)
- Her words: Love Nov 4 2026 6:09 PM PT: "the pink slide rule dictates it is longs only while pink is on a slide up, she doesnt short at red, she waits til it gets to pink and rejects, enters on the flip/rejection like she normally would. inverse for shorts, shorts only on a slide down. she waits for it to come to pink and reject and shorts as she normally would. if it doesnt function like that already thats what i would like"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix658 THE PINK SLIDE, HER WAY: the slide / climb is ON with 2 pink rejections (fix657) while price steps her way (fix503c) AND the pink itself slopes that way (pink at the last rejection higher - climb - / lower - slide - than at the first). The 44% pink-share gate (fix584/646) no longer applies to the slide. While a climb is ON: no shorts from any band or zone, every book but delayed (climbHold464, unchanged release: price breaks down through pink by 10% of the channel, fix560), and longs ONLY off a pink rejection / flip (any other long read waits - engine.ts copier, logged in slide-pink.jsonl). Mirror on a down slide. Add-ons are left exactly as they are (Love 6:20 PM PT: "no , add ons are okay as is").
- Files: src/lib/desk/bandlock.ts (+19/-3), src/lib/desk/engine.ts (+9/-6), src/lib/desk/fns.ts (+1/-0), src/lib/desk/kalshi-live.server.ts (+3/-1), src/lib/desk/pivotbooks.ts (+1/-0), src/lib/desk/recon.ts (+13/-12), src/lib/desk/selfcheck.ts (+3/-0), tools/band-flip-test-446.cjs (+3/-2), tools/both-sides-replays-469.cjs (+1/-1), tools/pink-both-sides-test-464.cjs (+2/-1), tools/pink-break-casts-580.cjs (+1/-1), tools/slide-her-way-584.cjs (+4/-4)

## 9. NIGHTLY RESTART (fix660, R349)
- When: 2026-11-04 18:52:14 -0800
- Commit: [130dfaae](https://github.com/liluvdied/Aurelius/commit/130dfaae4864428e48e1d87edde42fc0d3857209)
- Her words: Love Nov 4 2026 6:20 PM PT: (a nightly restart of the desk) "yes"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix660 NIGHTLY RESTART: tools/nightly-restart-660.sh runs in the background (nohup; click 9-START-NIGHTLY-RESTART on the Desktop after a Mac restart). Every day at 2:05 PM PT (PLACEHOLDER - gold's daily break; Love to confirm) it saves her, waits until no order is in flight (no order in the last 90 s, nothing mid-try; at most 10 min), stops the desk and starts exactly one (her RESTART - ONE DESK steps), waits for live prices and logs whether the umpire is SAFE and entries are on (data/nightly-restart.jsonl). It never touches LIVE, rules, books, sizes or orders.
- Files: src/lib/desk/fns.ts (+4/-2)

## 10. ADD ON BOXES (fix664, R353)
- When: 2026-11-04 19:45:47 -0800
- Commit: [ba469f45](https://github.com/liluvdied/Aurelius/commit/ba469f454dd94ac86d5ef7aef05cf51997f0982a)
- Her words: Love Nov 4 2026 7:17 PM PT: "can you pls put in a box for our add on in here? with a toggle on/off. a box for Add on 1 & a box for add on 2 with an on/off toggle for them both so i don't need to bug you with them"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix664 HER ADD-ON BOXES: Desk settings gets two rows like Position size - Add-on 1 (her first add-on, at 2.8x) and Add-on 2 (the 3.8x add-on, which only comes after Add-on 1 has filled) - each a $1-$5 box and an on/off toggle. Saved to data/addon-settings.json (survives restarts; not part of her sealed settings, so a tap never trips the umpire or the seal, like her size slider). engine.ts applyAddon664 applies them every tick over live-switch addOn / addOn.at38; no file = today's settings. Her $5 add-on cap stays; triggers unchanged.
- Files: src/components/desk/settings-drawer.tsx (+37/-0), src/lib/desk/engine.ts (+4/-0), src/lib/desk/fns.ts (+5/-0)

## 11. REJECTION OFF BAND ABOVE (fix665, R354)
- When: 2026-11-04 19:49:24 -0800
- Commit: [e8e74752](https://github.com/liluvdied/Aurelius/commit/e8e74752442313ea95aacf761712854bd2b25907)
- Her words: Love Nov 4 2026 7:23 PM PT: "yes a rejection off a band above should be allowed after a break of the band below" + "any valid set up at an entry is to be taken if she hasn't executed a trade that window"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix665: her broke-this-candle walls (fix441 BROKE IT THIS CANDLE and fix457 BROKE UP/DOWN THIS CANDLE) hold only reads off the band that broke - a rejection SHORT off a band ABOVE a band that broke up, or a rejection LONG off a band BELOW a band that broke down, is no longer held by them (the read's label names its band). Every other wall still judges it. Every book but delayed (the 5M keeps its own copy and is off). Her second sentence is recorded as a guiding rule only.
- Files: src/lib/desk/bandlock.ts (+6/-0)

## 12. BREAK BACK SAME DISTANCE (fix666, R355)
- When: 2026-11-04 19:53:03 -0800
- Commit: [fdf9660a](https://github.com/liluvdied/Aurelius/commit/fdf9660a736e308d7330c138628a10511c9ba306)
- Her words: Love Nov 4 2026 7:26 PM PT: "it's not supposed to block that trade for the rest of the window if a band breaks, it only needs to break the other way by at least same the distance it broke down initially. so if price broke a band down for $10 for example, a long can be taken if it flips back up and pushes up by more than $10" + 7:29 PM: "past the band the other way" + "if price broke the band by $25, flips up, and then pushes up past $25 (the same distance that it broke down by) she is clear to long"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix666: her broke-this-candle walls (fix441, fix457/fix483 release) free the other side once price is back PAST THE BAND the other way by the same distance it broke (the furthest it went past the band this candle; her break distance at least) - e.g. band 100 broke to 75 -> a long is clear above 125, a band that broke up by $10 frees shorts $10 under it. The push and her 2m colour still apply as usual. Every book but delayed (the 5M is off).
- Files: src/lib/desk/bandlock.ts (+3/-3), tools/broke-candle-test-441.cjs (+4/-2), tools/broke-candle-test-457.cjs (+2/-2)

## 13. REJECTION WITHOUT FLIP (fix668, R357)
- When: 2026-11-04 21:07:58 -0800
- Commit: [4634e80b](https://github.com/liluvdied/Aurelius/commit/4634e80b0376398e2589daad6d4b4fa792fcaa82)
- Her words: Love Nov 4 2026 8:23 PM PT: "if price comes up to a band (within 15% of it) , and then price rejects near the band by 20% of the channel width or more , she can enter in , even if the candle hasn't flipped / so if price rejects on a green 5M candle , and the body of the candle pushes down by 20% of the channel width - she can enter short even if the candle hasn't flipped and it is still green okay / inverse for shorts"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix668: a new entry - this 5m candle came within 15% of the channel of a band (session band, VWAP, pink, red/green zone, Bollinger; opened on the near side of it) and price is now 20% of the channel or more back off the candle's extreme at that band (from its high for a short, its low for a long), still on the near side - she may enter even though no candle has flipped (the 5m can still be green for the short / red for the long). Channel = the session bands either side of that band. It waives only the candle colour / flip checks (door HER FLIP, HER CANDLE, price is rising/falling; HER FLIP AT THE SEND; the read's RED FALLING / GREEN RISING 5M and thirds splices) and casts the read; every other wall (thirds, 45%, past red/green, pink cushion, break walls, 1.5x floor, umpire) still judges. Every book but delayed (the 5M is off). Her 'inverse for shorts' read as the mirror for longs.
- Files: src/lib/desk/bandlock.ts (+26/-5), src/lib/desk/kalshi-live.server.ts (+1/-1), src/lib/desk/recon.ts (+9/-6), tools/behaviour-umpire.cjs (+5/-5), tools/cornerstones.py (+2/-2), tools/pink-flag-25-test.cjs (+1/-1)

## 14. BTC PUSH SIX (fix669, R358)
- When: 2026-11-04 21:15:29 -0800
- Commit: [2db94eee](https://github.com/liluvdied/Aurelius/commit/2db94eee80c59755177d7930a69cb7fd61535ccd)
- Her words: Love Nov 4 2026 8:54 PM PT: "as for the $10 push for btc we said we'd come back to, we can bring that to $6 , it will be better when volume is low" + ~8:56 PM PT: "yes, $6 push in both directions, in place of where she was waiting $10 now pls , and yes all books but delayed"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix669: her BTC push off the band is $6 (was $10) everywhere she waited $10 - the read's pink / failed-break / previous-candle / nearest-band pushes (recon.ts, 8 sites, longs and shorts) and the door + send push (pushLabel653, bandlock.ts). Her 2m colour still applies. Gold keeps its 10c push. Every book but delayed (the 5M is off). Built on her current files (independent of CHANGE-16/17).
- Files: src/lib/desk/bandlock.ts (+1/-1), src/lib/desk/recon.ts (+8/-8)

## 15. REJ 20 PASSES THIRDS WALLS (fix675, R364)
- When: 2026-11-04 22:38:17 -0800
- Commit: [d1c38b51](https://github.com/liluvdied/Aurelius/commit/d1c38b513765e833517e66892b1f96046761777f)
- Her words: Love Nov 4 2026 10:20 PM PT: "our new 20% wick rejection rule didn't fire just now on btc love it was definitely over 20% , can you look into why she didn't enter on that for me as well?" (her CHANGE-17 words, Nov 4 8:23 PM PT: "she can enter in , even if the candle hasn't flipped")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix675: completes fix668 (CHANGE-17). Her 20% rejection off a band (15% tap, 20% of the channel back off the extreme, this 5m candle) now also passes the four candle-DIRECTION walls that held it at 10:04:13 PM PT BTC: the door's 'the candle is falling from the top third - a short, never a long' (bandlock.ts thirdsMove ~1139), the send's 'THE THIRDS AT THE WIRE' (~2809) and the two 'price is falling/rising from the top/bottom third of her channel' walls (awayVerdict ~454/458, reconThirdAgainst ~982/987). Her thirds by POSITION (33%), 45%, past red/green, pink, break walls and the 1.5x floor still judge. Every book but delayed (rej668 returns false for the delayed book). Built on CHANGE-20 (bandlock.ts).
- Files: src/components/desk/app.tsx (+2/-0), src/components/desk/rsi-books.tsx (+62/-0), src/components/desk/schedule-live.tsx (+1/-1), src/lib/desk/bandlock.ts (+17/-14), src/lib/desk/engine.ts (+5/-2), src/lib/desk/fns.ts (+2/-0), src/lib/desk/recon.ts (+4/-1), src/lib/desk/rsibooks.ts (+168/-0), tools/cornerstones.py (+2/-2)

## 16. DELAYED HOURS TO REJ ONLY (fix674, R363)
- When: 2026-11-04 22:38:50 -0800
- Commit: [f26b55d6](https://github.com/liluvdied/Aurelius/commit/f26b55d67b41997b46c712cebe4cacd984e4b8f8)
- Her words: Love Nov 4 2026 10:12 PM PT: "for the main without pink book , i created one that is rejections only for session bands too, no breaks i want THAT one in place of the main without pink book so its rejections only"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix674: her DELAYED-button hours (fix626, today 10 PM PT BTC + gold - whatever her schedule pill gives the DELAYED button) now trade live through her rejections-only no-pink book (recon-rjnp, fix643/fix673) as main's rows - same copier, size, take-profit, add-ons, walls and send as main. Main without pink (recon-rnp) goes back to paper and keeps its record; the delayed twin stays paper. Every other hour unchanged. Cornerstone 101 updated with her words; the schedule panel's DELAYED label reads REJECTIONS ONLY · NO PINK. Built on CHANGE-21 (engine.ts).
- Files: -

## 17. LIVE FLIP NO RESIGN (fix676, R365)
- When: 2026-11-04 23:30:17 -0800
- Commit: [18c8d44d](https://github.com/liluvdied/Aurelius/commit/18c8d44d663f415049cf9633048b7f98215bc90c)
- Her words: Love Nov 4 2026 10:29 PM PT: "OH yes let's do it :))" - to: her LIVE flips in the desk header treated as trusted like her size slider, so the umpire no longer goes NOT SAFE on the live / at / note stamps after she turns LIVE on or off; rules and code stay sealed (Claude's offer since 7:50 PM PT: "the LIVE flip that never needs a re-sign")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix676: tools/verify-golden.py treats her LIVE switch as hers (like her size slider, fix632): the top-level live (true/false), at and note stamps never count as drift, and liveBook only counts as unchanged when its lineup minus since/at/note/dollars still hashes to her approved seal (sealLiveBook - the same seal THE SEAL checks at the door). Turning LIVE on or off from the desk no longer makes the umpire go NOT SAFE; no re-sign needed. Every code file, every rule, every other setting and the lineup are still checked exactly as before. LIVE off still stops new orders at once (the engine reads live on every pass - unchanged).
- Files: src/components/desk/app.tsx (+2/-0), src/components/desk/stats-rungs.tsx (+39/-0), src/lib/desk/engine.ts (+2/-2), src/lib/desk/fns.ts (+2/-0), src/lib/desk/kalshi-live.server.ts (+1/-1), src/lib/desk/recon.ts (+2/-0), tools/verify-golden.py (+14/-0)

## 18. SELF TEST CATCHES UP (fix684, R372)
- When: 2026-11-05 00:58:51 -0800
- Commit: [25c77bfb](https://github.com/liluvdied/Aurelius/commit/25c77bfb7c07f8e42ad1f21178ee4da47d33def4)
- Her words: Love Nov 5 2026 ~12:30 AM PT: "yes to both" - to turning BREAK BOOK · SESSION ONLY back on, paper only (the old paper books have refused every order since Nov 3 10:53 PM PT with "band law failed its self-test": the self-test still expected her old numbers - the $8/$6 BTC pink wait and $5 rejection (fix580, then Love Nov 4 2026 4:02 PM PT: "make it $2 on the break.") and gold 5m R1/S1 as walls (fix618 Love Nov 1 2026 6:10 PM PT: "This applies to both gold and BTC."))
- Before: (the code as it was in the previous entry - see the diff)
- After: fix684: the band law's self-test (bandlock.ts bandSelfTest, every 10 min) checks HER CURRENT numbers. 8 of its fixed checks still expected rules she has since changed on purpose: the BTC pink break / pink wait / at-the-session-band wait / pink rejection at $5-$8 (now $2, fix651; $5 fix580) and gold 5m R1 as a wall (not a wall since fix618, both assets). Because the test failed, __bandLawBroken was true and the old PAPER books refused every order since Nov 3 10:53 PM PT (BREAK BOOK · SESSION ONLY, ogp5-boll/-cb/-r30/-fast/-inv/-bbsr/-sess, ogp15-both, tap3x ...). The 8 checks now test her $2 / fix618 rules (both directions); every other check unchanged. No trading function, wall, size or live book is touched; her live recon books never read this flag. The old paper books come back on paper.
- Files: src/components/desk/app.tsx (+2/-0), src/components/desk/eth-book.tsx (+16/-0), src/lib/desk/bandlock.ts (+12/-8), src/lib/desk/engine.ts (+2/-0), src/lib/desk/ethbook.ts (+105/-0), src/lib/desk/fns.ts (+2/-0), src/lib/desk/recon.ts (+5/-4)

## 19. REGISTRAR EVERY 2 HOURS (fix685, R373)
- When: 2026-11-05 01:30:57 -0800
- Commit: [dcf5084a](https://github.com/liluvdied/Aurelius/commit/dcf5084afa1684fd8d41fb438a5023a490be51cb)
- Her words: Love Nov 5 2026 ~12:05 AM PT: "can you recover those? in a view only capacity that wont slow down the desk?" (the old books' trade records) - the registrar (~/Desktop/AURELIUS-REGISTRAR, view only) now rebuilds itself every 2 hours instead of by hand
- Before: (the code as it was in the previous entry - see the diff)
- After: fix685: her REGISTRAR page (every book's full trade record, view only, ~/Desktop/AURELIUS-REGISTRAR) rebuilds itself every 2 hours: the fix654 log archive, which the desk already starts every 2 hours as its own process, now also starts registrar.py at the lowest priority (nice 19, its own session, never waited on). It only reads her saved records (grok-og / night-book files) and writes its own folder. No book, rule, wall, size or live path is touched; nothing new runs inside her tick loop.
- Files: -

## 20. INVERSE BOOK PAPER (fix688, R376)
- When: 2026-11-05 03:46:23 -0800
- Commit: [545c45f0](https://github.com/liluvdied/Aurelius/commit/545c45f0dc63ec7e853ab238b690febc7479612b)
- Her words: Love Nov 5 2026 ~1:05 AM PT: "while you are making those paper books, can you create the inverse set ups book i asked you about earlier too? all of our least successful set ups... in a week we'll know for sure which set ups lose the most. then we create the inverse" (started with tonight's five from data/reports/confluence-and-inverse-nov6.md; never the BTC pink longs) + ~1:15 AM PT: "can you do the inverse of the biggest losers on here so far? 1 Band traveled the previous window" + ~1:54 AM PT: "i'm pretty sure the delayed book has like a steady 30% hit rate as is, creating an inverse of that would put it at 70% off the bat"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix688 INVERSE BOOK - PAPER ONLY (never sends an order): when her main or rejection book (recon-tog / recon-rej) opens one of the set ups listed in data/inverse-setups.json, this book takes the OTHER side of the same window at that moment - $20 paper at the other side's REAL live ask (logged on every row, with her own ask beside it, so the week gives true $), once per source trade; scored held-to-the-bell and under her take-profit, and marked whether it passes her 1.38x floor. Starts with tonight's five: gold pink shorts -> long, gold red candle falling from the top third -> long, BTC launched from the bottom third -> short, BTC rejected down off +1σ -> long, BTC failed break above -1σ -> long (never the BTC pink longs); plus the band-travel losers from her STATS table, counted its way (bands crossed since the previous window opened): BTC 1 band down + she follows -> long, gold 1 band down + follows -> long, gold 1 band up + follows -> short; and every DELAYED book call flipped (replay Oct 19 - Nov 4 at the other side's ask: 64% of 1,768, +$1,259 held, weeks -$455 / +$742 / +$972). The list is a plain data file: Nov 11's worst losers go in with no code change. New card on the Books page. Needs CHANGE-35 installed first (same engine/fns/app files). Her books, walls and settings untouched; it only reads her paper rows.
- Files: src/components/desk/app.tsx (+6/-0), src/components/desk/brk-out.tsx (+16/-0), src/components/desk/inverse-book.tsx (+17/-0), src/components/desk/og-1012.tsx (+16/-0), src/lib/desk/brkout.ts (+75/-0), src/lib/desk/engine.ts (+6/-0), src/lib/desk/fns.ts (+6/-0), src/lib/desk/inverse.ts (+99/-0), src/lib/desk/og1012.ts (+262/-0)

## 21. NO PINK WRITES WHY IT HELD (fix701, R387)
- When: 2026-11-05 03:51:29 -0800
- Commit: [46937bca](https://github.com/liluvdied/Aurelius/commit/46937bcac13d53c128a77a4b184b8dc3ed23bb97)
- Her words: Love Nov 5 2026 ~2:17 AM PT: "just have it log every skip and the reason for it so i can look without bugging you" + 3:09 AM PT (on REJ ONLY · NO PINK at the 3:00 gold red zone): "it should have taken the rejection on a flip off of red just like the other book hun" - it did read it; the pink held it as it held the other books, but the no-pink book never wrote that down
- Before: (the code as it was in the previous entry - see the diff)
- After: fix701 (log only): REJ ONLY · NO PINK re-checks main's walls after its read (Bollinger on her colour, her thirds, the pink, main's door) and used to drop a held read without writing why - 3:01-3:05 AM gold its short off the red zone was held by the pink exactly like main and rejection, but its log only showed the 3:05 floor line. Each of those four now writes its reason to data/recon-skips.jsonl (and her refusal ledger) like the other books, once per window per reason, so SITREP shows it. What it trades, when, and every wall are unchanged.
- Files: src/components/desk/app.tsx (+16/-3), src/components/desk/club.tsx (+17/-0), src/components/desk/mainvwap.tsx (+16/-0), src/components/desk/rejparked.tsx (+16/-0), src/components/desk/stats-rungs.tsx (+6/-5), src/lib/desk/bandlock.ts (+3/-3), src/lib/desk/club.ts (+83/-0), src/lib/desk/engine.ts (+22/-9), src/lib/desk/fns.ts (+6/-0), src/lib/desk/mainvwap.ts (+69/-0), src/lib/desk/recon.ts (+5/-4), src/lib/desk/rejparked.ts (+79/-0)

## 22. REJECTION THIRDS AS READ PAPER (fix703, R390)
- When: 2026-11-05 04:02:19 -0800
- Commit: [fccb0fc1](https://github.com/liluvdied/Aurelius/commit/fccb0fc1f0332ab37553bc3043b5826dd17aa907)
- Her words: Love Nov 5 2026 ~3:43 AM PT: "YES pls fix the two thirds that disagree !!!! that's been happening all week !!" (built first as a paper twin of REJECTION, to decide Nov 11; the live version waits for her pick)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix703 REJECTIONS · THIRDS AS READ - PAPER ONLY (never sends an order, in no live list): a new card that is the REJECTION book's exact read and walls with ONE thirds judgment - the one her read made. Tonight her read said 'Green candle rising from the bottom third' (the 5m candle's low, -2σ -> VWAP) and then HER THIRDS said 'no long in the top 33%' (price now, nearest session lines) - two thirds disagreeing. On this paper book a candle-in-her-third / launched-from read keeps its own third, any other read is judged once on the read's own session-band channel, and the door's ONLY IN HER THIRD / THE IMPOSSIBILITY percent lines stand down (a flag set only around this book's own door check). Pink in the read, pink cushion, 55%, flip, floor, $10 level, Bollinger, zones, top/bottom line all judge it as REJECTION. Every held read writes its reason to recon-skips. Her live books and walls behave byte-for-byte as before (the flag is never on for them). Replay so far: about coin-flip on the extra trades (BTC 53%, gold 50%) - the week on paper decides (Nov 11).
- Files: src/components/desk/app.tsx (+3/-0), src/components/desk/skips.tsx (+32/-0), src/lib/desk/bandlock.ts (+6/-6), src/lib/desk/fns.ts (+5/-0), src/lib/desk/grokog.ts (+1/-0), src/lib/desk/recon.ts (+17/-1), src/lib/desk/skips.ts (+71/-0), tools/save-her.py (+11/-2)

## 23. AT THE PINK TAP LOG (fix705, R391)
- When: 2026-11-05 04:07:54 -0800
- Commit: [250f7ac2](https://github.com/liluvdied/Aurelius/commit/250f7ac235f89e50bd6e89615734d33296f085cc)
- Her words: Love Nov 5 2026 ~3:54 AM PT: "and gold never longing a pink rejection, can you update her loggings to say why she didn't enter AT the rejection of pink? not that it was too high up? that is the reason we need logged."
- Before: (the code as it was in the previous entry - see the diff)
- After: fix705 AT THE PINK TAP - LOG ONLY: the moment price taps her pink (within 5% of its session channel) and turns back the way it came (7.5% off pink, not a break), it writes for main, rejection, no-pink (and the thirds-as-read twin once CHANGE-50 is in) why she did NOT enter at that second: her read not formed yet (no 2/5m candle flipped her way, wick back off pink under her 15%) or the first wall that held the read at that second (pink cushion, 55%, thirds, floor, $10 level...), with the ask at the tap - so the log shows the reason AT the rejection, not the later 'too high'. Lines go into her refusal ledger (where: pink-tap) so SITREP shows them, and into data/pink-tap-705.jsonl. Nothing about when or how she trades changes.
- Files: src/lib/desk/engine.ts (+2/-0), src/lib/desk/pinktap.ts (+63/-0)

## 24. HALF BAND KEEP BOOK (fix709, R395)
- When: 2026-11-05 05:19:47 -0800
- Commit: [8045a48f](https://github.com/liluvdied/Aurelius/commit/8045a48f1403c6f483a2304eb42e3ded10f0809a)
- Her words: Love Nov 5 2026 ~4:20 AM PT: "and the original model used half bands, i don't even have the option for them on my chart. can we create another book that still uses those and then from there refine the set ups on THAT that worked best? by next friday we will have her propped up on concrete"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix709 HALF-BAND KEEP BOOK - PAPER ONLY, 24/7 (never sends an order, in no live list): the original model (PAPER 24/7, auto.ts - session VWAP with the half bands ±0.5σ / ±1.5σ / ±2.5σ beside ±1/±2/±3σ) still runs on paper; this book takes the SAME side of its calls, $20 at the real live ask, but ONLY for set ups her SET UP SCORES panel (CHANGE-55) rates KEEP (7 days 15+ trades, 65%+, made money) or LADDER (24 h more than half, or 7 days 60%+) right now - so the list refines itself through the week and drops set ups that start losing. Right now that is 4 KEEP (gold short tap-reject at -1.5σ 20/23 +$194, BTC long at -0.5σ 17/20 +$137, silver short at +1.5σ 13/16 +$106, gold short at +0.5σ 11/15 +$51) and 15 LADDER. Its own trades are scored on the panel too. The card shows the half bands' live prices for each asset (her TradingView has no half bands). Held to the bell and under her take-profit. Needs CHANGE-55 installed first (same fns/app files) and CHANGE-54 (same engine file).
- Files: src/components/desk/app.tsx (+8/-0), src/components/desk/half-band.tsx (+20/-0), src/components/desk/high-multiple.tsx (+21/-0), src/components/desk/momentum-book.tsx (+17/-0), src/components/desk/setup-scores.tsx (+36/-0), src/lib/desk/engine.ts (+6/-0), src/lib/desk/fns.ts (+13/-0), src/lib/desk/halfband.ts (+79/-0), src/lib/desk/hmulti.ts (+96/-0), src/lib/desk/momentum.ts (+90/-0)

## 25. HIGH MULTIPLE BOOK AND TRACKER (fix707, R393)
- When: 2026-11-05 05:21:43 -0800
- Commit: [aa79d5d3](https://github.com/liluvdied/Aurelius/commit/aa79d5d35b2a0aa8bb34c1b931f742737fbf9d35)
- Her words: Love Nov 5 2026 ~4:10 AM PT: "anddd i want to start tracking when high multiple trades hit bb. im guessing its at the most volatile hours when price rips thru a band or two and stops at the next and reverses. when bands are tight she caught 4 20x + in a row in one afternoon. let's create a high multiple book too pls. only takes 2.8x +. takes the most distant band trade, not the closest. thaaat on volatile hours. i THINK but let's see. we can leave it running 24/7, over the week we will see the pattern"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix707 HIGH MULTIPLE BOOK + TRACKER - PAPER ONLY, 24/7 (never sends an order, in no live list): (1) REVERSAL AT THE FARTHEST BAND (her read): price ripped through 1+ session bands in the last 15 minutes, reached the next band out (within 5% of the channel - the most distant band of the move, not the nearest) and came back 10% of the channel -> the other way; (2) WITH THE RIP twin (replay Oct 19 - Nov 5: BTC 2.8-5x with a 1+ band rip 51%, +$817; betting against rips lost): still past the last band crossed -> with it. ONLY at a real live ask of 35.7c or less (2.8x+), $20 paper, once per way per window, 2+ min left, held to the bell and under her TP. Every trade logs its hour (PT), σ in bps, bands crossed and the 15-minute range in σ. (3) HIGH-MULTIPLE TRACKER on the same card: every 2.8x+ winner from every book in the last 7 days (her paper rows) with hour and σ context, plus a per-hour tally. Needs CHANGE-52 installed first (same engine/fns/app files).
- Files: -

## 26. NO FADING A BOLLINGER BREAK (fix711, R397)
- When: 2026-11-05 05:30:04 -0800
- Commit: [c3c39c9d](https://github.com/liluvdied/Aurelius/commit/c3c39c9d7b706bd20dd0d1c1aa75ef6c82bf26f1)
- Her words: Love Nov 5 2026 5:12 AM PT, her pick on the guard card: "Bollinger fade block only - No long off the BB lower past green after a break (mirror for shorts past red). Cheap entries stay allowed." (after 5:11 AM PT: "she's all losses ????? too many in a row love can you see what's up?")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix711 NO FADING A BOLLINGER BREAK PAST HER ZONE: inside her zone wall (zoneSend594 - the door and the last line, where PAST THE GREEN / RED ZONE already lives): once price has broken the 5m Bollinger lower (now or in the last 5 minutes) and sits at or past the green boundary, no long; mirror - after a break above the Bollinger upper, at or past red, no short. Every book but delayed. Cheap entries stay allowed (no ask floor). Replay Oct 19 - Nov 5: fading that break lost every week (BTC 190 trades 26%, -$1,042; gold 134, 31%, -$561); tonight's 4:17 / 4:30 AM BTC longs off the Bollinger lower both lost. Needs CHANGE-57 installed first (same bandlock.ts).
- Files: src/lib/desk/bandlock.ts (+21/-2)

## 27. BREAK BOOK SESSION + PINK LIVE TODAY (fix717, R398)
- When: 2026-11-05 06:44:19 -0800
- Commit: [9a7827e9](https://github.com/liluvdied/Aurelius/commit/9a7827e97c4044f3e2be16a94426bf2805c531f0)
- Her words: Love Nov 5 2026 6:03 AM PT: "dude just put brick on for the day wut r we doin here" + 6:36 AM PT: "but just as of looks compared to the other ones ye run this one" (BREAK BOOK · SESSION + PINK) - one book live for today with only its own gates, a second exception to her Oct 31 law (like the delayed book), today only
- Before: (the code as it was in the previous entry - see the diff)
- After: fix717 ONE BOOK LIVE TODAY - BREAK BOOK · SESSION + PINK (brk-sesspk): her ONLY live book for BTC and gold until midnight PT tonight (data/live-today.json until 2026-11-06 08:00 UTC). Main, rejection, no-pink and delayed keep running on paper. BREAK BOOK · SESSION + PINK is judged by its own gates only: her walls at the door and the last line stand down for this one book (a second exception to her Oct 31 law, today only, like the delayed book); the umpire, ENFORCER, freshness guard, LIVE switch, her slider size and her take-profit all still apply; no add-ons; and it stops itself for the rest of the day once its own live trades since midnight PT are down $100 (stopAt in data/live-today.json). Her lineup (liveBook) and seal untouched. Record (paper archive, real paper trades): since Oct 19 1,412 trades, 61%, +$1,433, green 10 of 16 days, worst day -$135 at $20; forward check Oct 13-26 +$137 then Oct 27-Nov 5 +$1,296 (green 6 of 8 days); about 110 calls a day, so expect a live trade most windows. The switch expires by itself at midnight; CHANGE-63 NORMAL LINEUP BACK turns it off in one run.
- Files: src/lib/desk/bandlock.ts (+6/-0), src/lib/desk/engine.ts (+9/-3), src/lib/desk/kalshi-live.server.ts (+1/-0)

## 28. FULL HISTORY ON CARDS (fix719, R403)
- When: 2026-11-05 07:15:09 -0800
- Commit: [87885991](https://github.com/liluvdied/Aurelius/commit/87885991802ac0aa32d3c3deff700ff96a59d9bd)
- Her words: Love Nov 5 2026 6:36 AM PT: "is there any way we can recover the records for these hun ??? :((( i didn't know it would be deleting everything i never would have done it ... no way we can fix that? it's hard to get a read on things with 15 trades"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix719 FULL HISTORY ON CARDS (display only): nothing was deleted - the lane books' older trades are all in data/grok-og-archive.jsonl, but that file passed 536 MB (the most one JavaScript string can hold), so the desk's first read of it after every start threw and every lane card (BREAK BOOK · SESSION + PINK, OG x PIVOT 5M, PAPER 24/7...) fell back to its recent rows only (e.g. 21 trades instead of 1,412). The reader now takes the file in 64 MB pieces and keeps its newest 480 MB (about the size it held fine before - since about Oct 15 today), so each card's ALL shows its record again. No book, wall, size, order or exit changes; the night books (DIAMOND, BRICK...) already read their full history from the exit ledger and are unchanged.
- Files: src/components/desk/app.tsx (+14/-0), src/components/desk/cup-book.tsx (+17/-0), src/components/desk/live-today.tsx (+18/-0), src/lib/desk/archcache.ts (+20/-9), src/lib/desk/cups.ts (+105/-0), src/lib/desk/engine.ts (+2/-0), src/lib/desk/fns.ts (+17/-0), src/lib/desk/kalshi-live.server.ts (+6/-2), src/lib/desk/paperrows.ts (+42/-0)

## 29. BTC WATERFALL SHORTS MAIN AND REJECTION (fix728, R404)
- When: 2026-11-05 08:41:32 -0800
- Commit: [f1667b23](https://github.com/liluvdied/Aurelius/commit/f1667b2398f3c7729a2b7df37be12293c3fa4b25)
- Her words: Love Nov 5 2026 5:34 AM PT: "we can turn the waterfall on btc but if it has a meaningful move up past pink or has a green rejection move up strongly don't take the short" + 5:43 AM PT: "ya go ahead and put it on love ... we will let her take the shorts down here, just not if there's a sharp spike up to the red band. back down into no mans land it will blow right up thru pink if it's actually reversing" + 7:48 AM PT: "did we put the shorts allowed rule under the bottom rung on for btc on the main book and rej? will run her on there til we have the new books live"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix728 THE WATERFALL ON BTC FOR MAIN + REJECTION: her bottom-rung wall (fix296, no BTC short under the session -2σ) lets a short through for main (recon-tog) and rejection (recon-rej) when the running 1m candle is red (price under its open) and no 1m candle closed over pink in the last 15 minutes (her rule: a real reversal blows up through pink). Pink history comes from the copier's own 1-second price + pink sampler; with under 15 minutes of it (right after a restart) the wall stays. Every other wall still judges the short; every other book, gold and the delayed book keep the old rung rule. Works under AKIMBO (main + rejection trade paper) and after CHANGE-63 (they trade live again). Replay Oct 19 - Nov 5, real asks, $20: 37 shorts, 65%, +$323. Replaces the resting CHANGE-59 ($50 green-candle guard). Run FIRST (before CHANGE-63 and the later CHANGE-71).
- Files: src/lib/desk/bandlock.ts (+20/-1)

## 30. NORMAL LINEUP BACK (fix718, R405)
- When: 2026-11-05 08:44:45 -0800
- Commit: [492f96ac](https://github.com/liluvdied/Aurelius/commit/492f96acfc87239f9f900feb7233523ee83b9dce)
- Her words: Love Nov 5 2026 6:03 AM PT: "dude just put brick on for the day wut r we doin here" + 6:36 AM PT: "but just as of looks compared to the other ones ye run this one" (BREAK BOOK · SESSION + PINK) - one book live for today with only its own gates, a second exception to her Oct 31 law (like the delayed book), today only - and the one-run way back
- Before: (the code as it was in the previous entry - see the diff)
- After: fix718 NORMAL LINEUP BACK: turns ONE BOOK LIVE TODAY off (data/live-today.json on: false) - her normal live lineup and schedule trade again, BREAK BOOK · SESSION + PINK goes back to paper, her walls judge every book but delayed again. No code changes (the switch also expires by itself at midnight PT). Run after CHANGE-62.
- Files: src/components/desk/app.tsx (+2/-0), src/components/desk/live-today.tsx (+1/-1), src/lib/desk/akimbocard.ts (+45/-0), src/lib/desk/bandlock.ts (+2/-1), src/lib/desk/engine.ts (+17/-4), src/lib/desk/fns.ts (+2/-1), src/lib/desk/kalshi-live.server.ts (+3/-1)

## 31. AKIMBO CARD (fix727, R408)
- When: 2026-11-05 08:45:30 -0800
- Commit: [50fe770a](https://github.com/liluvdied/Aurelius/commit/50fe770a1136783c9a9d9ab72be3c5e737312ec5)
- Her words: Love Nov 5 2026 7:42 AM PT: "pls create a new combined card Akimbo so she has a clean slate"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix727 AKIMBO CARD: a new card AKIMBO · SESSION + PINK × 15M PIVOTS ✨ (clean slate) - the akimbo pair's paper book exactly as CHANGE-71 trades it live (one ticket per window, the first of the two books to call it; when +15M PIVOTS calls the other side of a SESSION + PINK ticket, that ticket is sold at the bid and pivot's side is taken; a SESSION + PINK call against a pivot ticket is ignored), $10 a ticket, from zero at install (kept in data/akimbo-book-727.json). Same card as every book (W/L, hit %, $, 4H/12H/24H/ALL, tap for trades), under its own AKIMBO 🤹 chip first in the list, right under the LIVE TODAY row; the LIVE TODAY row now counts both books' live Kalshi trades today. Display only - the copier never reads it. Run after CHANGE-71 (and 65).
- Files: -

## 32. AKIMBO 1 TO 1 WITH PAPER (fix730, R410)
- When: 2026-11-05 09:41:32 -0800
- Commit: [2b0e9d8c](https://github.com/liluvdied/Aurelius/commit/2b0e9d8c766892caf30079fee0da2153298bc5b5)
- Her words: Love Nov 5 2026 9:30 AM PT: "do your thing bb, pls check against all other potentialities and we will cover them all in one if we need to okay" + 9:25 AM PT: "ohhh so that's whyyy she's not taking anything ? okay GOOD let's fix both / yes / akimbo exempt , 1:1 with their paper records individually- combined ledger pls / my words" (a deliberate exception to her Oct 20 immutable wall at the wire, for the akimbo books only, while live-today is on; + 7:37 AM: "she needs to take the same trades as both books")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix730 AKIMBO EXEMPT AT THE WIRE (Love's words, 9:25 AM): a deliberate exception to her Oct 20 immutable wall at the wire, for the akimbo books only (SESSION + PINK and +15M PIVOTS, while live-today is on - it ends with it). Their own opening orders (marked by the copier in enterLive, good 30 s) skip the wall's geometry (red/green zones, pink-to-red top 55%, thirds, the impossibility) so live takes what their paper books take; the seal and the fresh band list / fresh price checks still apply. Two more copier gates stand down for them too: the pink-slide hold (fix658, held the 9:01 and 9:16 BTC shorts) and the not-a-break-above re-check at the order. Since 8:46 these stopped 7 of 8 akimbo calls. KEPT for them: umpire, ENFORCER, LIVE switch, the seal, fresh band list + fresh price at the wire, the stale-call guard (90 s), the -$100 akimbo stop, the -$200 desk stop + give-back, one BTC / one gold position, one ticket per window, hand-trade windows, under 30 s left, the sub-auditor stamp. Supersedes the split 75/76. Umpire, ENFORCER, LIVE switch, daily stops unchanged; every other book and hand orders unchanged. Run after CHANGE-74.
- Files: src/lib/desk/bandlock.ts (+4/-0), src/lib/desk/engine.ts (+2/-2), src/lib/desk/kalshi-live.server.ts (+2/-1)

## 33. COMMANDS TAKE TURNS (fix732, R411)
- When: 2026-11-05 09:54:21 -0800
- Commit: [36e95bbd](https://github.com/liluvdied/Aurelius/commit/36e95bbd151bab1eefe962560a74ad16e2c8fd4d)
- Her words: Love Nov 5 2026 9:43 AM PT: "let's set up a safe path for these two books , so the umpire can't shut down the whole desk if she is doing what she's supposed to be doing" (part A: CHANGE commands take turns)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix732 COMMANDS TAKE TURNS: today's umpire pauses (12:57, 3:28, 3:44-3:50, 4:01, 5:18, 5:29, 7:13, 8:44, 9:40 AM PT) were all 'her code changed while the umpire ran' - two CHANGE commands running at the same time. Every CHANGE sources tools/concrete.sh first; it now holds a lock (data/.change-running-732) for the whole run, so a second CHANGE opened meanwhile shows WAITING and starts by itself the moment the first finishes. A lock from a closed window clears itself. No umpire check is changed. Run this one ALONE (it cannot protect its own install).
- Files: tools/concrete.sh (+13/-0)

## 34. UMPIRE QUICK RECHECK (fix733, R412)
- When: 2026-11-05 10:23:58 -0800
- Commit: [16ec1124](https://github.com/liluvdied/Aurelius/commit/16ec1124685ed45393df3d8ad671009d6736325e)
- Her words: Love Nov 5 2026 9:43 AM PT: "let's set up a safe path for these two books , so the umpire can't shut down the whole desk if she is doing what she's supposed to be doing" (part B: quick re-check after a mid-run code change)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix733 UMPIRE QUICK RECHECK: when the umpire's ONLY complaint is 'her code changed while the umpire ran' (a timing clash, not a broken rule), the desk re-checks her 3 seconds after her files settle instead of waiting the 5-minute retry - a pause like today's 9:40 AM clears in about a minute by itself. Any real failure (a rule OUT, the request book, the no-removal gate, golden, seal) is exactly as before: NOT SAFE blocks every opening order and retries every 5 minutes. Run after CHANGE-76.
- Files: src/lib/desk/umpire-gate.ts (+1/-1)

## 35. GATE IGNORES LIVE SWITCH (fix737, R416)
- When: 2026-11-05 11:03:28 -0800
- Commit: [5a8efdcb](https://github.com/liluvdied/Aurelius/commit/5a8efdcbe44389d1602d9c772f0ab256de2ebbe4)
- Her words: Love Nov 5 2026 ~10:57 AM PT: "please disable this hun for me to unlock and then relock when i want to" (the no-removal gate stopping her every time she flips LIVE)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix737 THE NO-REMOVAL GATE IGNORES HER LIVE SWITCH: every umpire stop today after a CHANGE was this gate reading her own LIVE flip (live / at / note / liveBook.since) as 'settings changed without her words'. Those keys and her size slider (maxDollars, liveBook.dollars) are hers - the umpire gate, verify-golden and the wire seal already treat them that way - so this gate now skips them. Every other setting, her lineup (liveBook.books), every code file and every rule are still guarded exactly as before. This command also finishes CHANGE-80 (its window closed early): re-locks its two files in concrete and marks it done under R415. Running it restores the umpire's SAFE.
- Files: src/components/desk/app.tsx (+6/-2), src/components/desk/live-today.tsx (+1/-0), src/lib/desk/akimbowatch.ts (+51/-0), src/lib/desk/engine.ts (+6/-0), src/lib/desk/fns.ts (+1/-1), src/lib/desk/pivotbooks.ts (+12/-1), tools/no-removal-gate.py (+6/-0)

## 36. GATE KEY (fix738, R417)
- When: 2026-11-05 11:13:41 -0800
- Commit: [d09ae978](https://github.com/liluvdied/Aurelius/commit/d09ae978675783715f09f7e897c4f65087995e9e)
- Her words: Love Nov 5 2026 ~10:59 AM PT: "it's killed a whole morning blocking her , and all of her rules are actually functioning bc of you i only needed the umpire to block her from firing backwards and you fixed her , so let me unlock her with a command myself and leave it stationary on the desktop i will unlock it after it gives me a warning like that and put it back on when im done okay" + ~11:01 AM: "yeah command 80 is saying i can't do it without unlocking it so yes we'll do the lock and keep it on the desktop and i'll put it back on when we're done implementing changes still have it give me the warning , and i'll come to you and ask what happened w it :)"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix738 GATE KEY: two commands that stay on your Desktop - UNLOCK-GATE and RELOCK-GATE. UNLOCK: the no-removal gate keeps printing its full warning (in that window, in ALERTS, in data/gate-unlock.jsonl) but no longer stops her, and the umpire re-checks right away; a red GATE UNLOCKED line shows on the LIVE TODAY row. RELOCK: takes a fresh save of her as she is, turns the gate back on, umpire re-checks. Only the no-removal gate - every other umpire check, the ENFORCER, LIVE, seal, freshness, the 90 s stale guard, the stops, one position per asset, one ticket per window, hand windows, under 30 s, the 1.5x floor all stay. Run after CHANGE-81.
- Files: src/components/desk/live-today.tsx (+1/-0), src/lib/desk/fns.ts (+1/-1), tools/no-removal-gate.py (+14/-0)

## 37. AKIMBO PRICE ON THE BREAK SIDE (fix739, R418)
- When: 2026-11-05 11:43:04 -0800
- Commit: [cb5166aa](https://github.com/liluvdied/Aurelius/commit/cb5166aad5f08b57edf24fe9052f2fb838914421)
- Her words: Love Nov 5 2026 11:35 AM PT: "no , it just needs price on the same side of the break when she enters hun she doesn't need a close"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix739 AKIMBO PRICE ON THE BREAK SIDE: for SESSION + PINK and +15M PIVOTS, a 'Break/Close above|below <line>' call only sends - the first order and every re-knock - while the live price is still on the break side of that line (long above it, short below it). If price has gone back across, she stops knocking ('BACK ACROSS <line> (fix739)', which the silent alarm shows). No 1m close needed. Lines: session bands, pink, 5m pivots (her board) and 15m pivots (kept from the pivot book each pass). A line it can't read = no change. Akimbo books only; no other gate is turned back on; all rails kept.
- Files: src/lib/desk/bandlock.ts (+16/-0), src/lib/desk/kalshi-live.server.ts (+1/-1), src/lib/desk/pivotbooks.ts (+1/-0)

## 38. SESSION PINK 15M BOLLINGER WALL (fix740, R419)
- When: 2026-11-05 12:04:38 -0800
- Commit: [9b608334](https://github.com/liluvdied/Aurelius/commit/9b608334b264d4d1d05e46a279a7b4ba6c16f461)
- Her words: Love Nov 5 2026 11:39 AM PT: "we should have her use those as a wall instead of the old rsi bollingers we were using that you said held up the least and needed to get kicked lol" + her card pick 11:42 AM: "Yes, SESSION + PINK only" (to "Add a 15m Bollinger wall to SESSION + PINK?")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix740 SESSION + PINK 15M BOLLINGER WALL: BREAK BOOK · SESSION + PINK skips a break whose direction runs INTO the opposite 15m Bollinger band (BB 20, 2σ, the same bands as TradingView, on 15m candles) within $50 BTC / $1 gold - a short with the lower band that close below, a long with the upper band that close above. It is a paper-book rule, so live (1:1 with paper) never sends those either; each skip is written to data/bb15-wall.jsonl. +15M PIVOTS unchanged. Replay since Oct 19 at $20: +$1,568 -> +$1,779, green days 10 -> 12 of 16, better in all three weeks. Run after CHANGE-83.
- Files: src/lib/desk/pivotbooks.ts (+15/-0)

## 39. AKIMBO ZONE WALL (fix741, R420)
- When: 2026-11-05 12:11:42 -0800
- Commit: [75cd47bd](https://github.com/liluvdied/Aurelius/commit/75cd47bd1fb6ec7f8f5c645919a3e79d7a858027)
- Her words: Love Nov 5 2026 11:53 AM PT: "so these books will not take any rejections at all ..? ... maybe we can have her have more strict settings on those? and not immediately on the flip? like red by $50 or something like ACTUALLY FALLING off" + 11:45 AM PT: "how was today's fill pivots ????? it was almost at the green that would be long wouldn't it ??" + 11:47 AM: "yes" (to the AKIMBO ZONE WALL: no short with the green zone just below, no long with the red just above - SESSION + PINK $2 gold / $100 BTC, +15M PIVOTS $1 / $50) + 11:59 AM PT: "yes bb ... can you see what the difference in multiple even is? it's nothing isn't it like .2 or something max for an infinitely more confident trade worth it bb ... yes"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix741 AKIMBO ZONE WALL: the akimbo books skip a break that runs into her green / red zone - a short with the green zone (5m S1 of the last closed 5m candle) just below price, a long with the red zone (5m R1) just above: SESSION + PINK within $2 gold / $100 BTC, +15M PIVOTS within $1 / $50. A paper-book rule, so live (1:1) never sends those; each skip written to data/zone-wall.jsonl. Today's 11:31 gold short (green $2.39 below) is the kind it is for. Replay since Oct 19 at $20: SESSION + PINK 61% -> 68%, +$1,570 -> +$1,860 (green 10 -> 14 of 16 days; with the 15m BB wall +$1,903); +15M PIVOTS 57% -> 60%, +$1,157 -> +$1,557 (green 12 -> 13). About half as many SESSION + PINK trades. EXCEPT a rejection that is really moving off (Love 11:53 AM: "not immediately on the flip ... like red by $50 or something like ACTUALLY FALLING off"): a break back across its line after price was on the other side in the last 3 min, already $50 BTC / $1 gold off that line, passes the wall (replay: those were 62-66% winners, +$442 together). Run after CHANGE-84.
- Files: src/lib/desk/pivotbooks.ts (+22/-0)

## 40. GOLD 2M MIDDLE BB AKIMBO SEAT (fix742, R421)
- When: 2026-11-05 12:40:52 -0800
- Commit: [3bebd708](https://github.com/liluvdied/Aurelius/commit/3bebd708d93d963d772a4e5f5940acc231ad798b)
- Her words: Love Nov 5 2026 12:05 PM PT: "can you test for the middle bollinger breaks ???? gold specifically i'm prettty sure those are gonna be noice" + her card pick 12:07 PM: "Third AKIMBO seat" (gold 2m middle-Bollinger break goes live inside AKIMBO, only taking gold windows neither book called; one ticket per window still)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix742 GOLD 2M MIDDLE BOLLINGER SEAT: a new paper book, gold only - when a closed 1m candle crosses the 2m Bollinger middle line (20-period average of 2m closes) it trades the break that way, once per window, 2+ minutes left, within her 1.5x floor, and not into her green / red zone ($2). Replay since Oct 19 ($20): 146 trades, 60%, +$886, green 14 of 15 days. It is AKIMBO's third seat live (data/live-today.json: brk-sesspk, brk15, gmid2): it only gets a gold window neither SESSION + PINK nor +15M PIVOTS took first; one ticket per window; pivot still gets the sticks; the same -$100 daily stop; the instant bell, price-on-the-break-side check (its line = the 2m middle), silent alarm and her live lists all cover it. Its own card (shows in RUNNING while AKIMBO is on). Run after CHANGE-85. Proof tests updated (intent kept): tools/akimbo-726.cjs now accepts live-today 'brk-sesspk,brk15' OR 'brk-sesspk,brk15,gmid2' (both books still required, every other check unchanged); tools/zone-wall-741.cjs counts the akimbo books' zone-wall call exactly once (zoneWall741(b, id, look!.side) - the seat has its own call), all its fire/skip checks unchanged.
- Files: src/components/desk/app.tsx (+1/-0), src/lib/desk/bandlock.ts (+1/-0), src/lib/desk/pivotbooks.ts (+27/-0)

## 41. BTC 5M MIDDLE BB PAPER BOOK (fix743, R422)
- When: 2026-11-05 13:10:59 -0800
- Commit: [fa18ddbf](https://github.com/liluvdied/Aurelius/commit/fa18ddbff0380461dc464de36c6273cf9286c4bc)
- Her words: Love Nov 5 2026 12:24 PM PT: "yes pls ... but for now yes we can add them into this book" (BTC 5m middle Bollinger break as an AKIMBO seat, after the 12:05 PM gold one: "can you test for the middle bollinger breaks")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix743 BTC 5M MIDDLE BOLLINGER SEAT: a new paper book, BTC only - when a closed 1m candle crosses the 5m Bollinger middle line (20-period average of 5m closes) it trades the break that way, once per window, 2+ minutes left, within her 1.5x floor, not into her green / red zone ($100). Replay with exactly these rules since Oct 19 ($20): 95 trades, 62%, +$319, green 13 of 17 days. (seat-only figures pending) PAPER ONLY (Love 12:30 PM: "yes we can just do gold , for rn bb ... we will test our card with one that has btc added and see how it does today"): it is NOT in AKIMBO and never sends an order - its own card, to watch next to AKIMBO. As an AKIMBO seat it would have added little (15 own windows +$30; 13 windows it calls first -$86), so it stays on paper. Plus a full AKIMBO twin card on paper (fix744: AKIMBO + BTC 5M MIDDLE · TWIN): AKIMBO's exact rules over SESSION + PINK, +15M PIVOTS, the gold 2m middle seat and this BTC book, $10, clean slate - to compare with the AKIMBO card today. Run after CHANGE-86.
- Files: src/components/desk/app.tsx (+2/-0), src/lib/desk/akimbocard.ts (+32/-0), src/lib/desk/bandlock.ts (+1/-0), src/lib/desk/fns.ts (+1/-0), src/lib/desk/pivotbooks.ts (+26/-0)

## 42. ALL BOLLINGER PAPER BOOK (fix745, R423)
- When: 2026-11-05 13:15:01 -0800
- Commit: [bfbdf9bb](https://github.com/liluvdied/Aurelius/commit/bfbdf9bb11430a9f78937749965b4d58365abe26)
- Her words: Love Nov 5 2026 12:43 PM PT: "pls do test those yes i want our win rate at 70% :)" (the ALL-BOLLINGER book, paper)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix745 ALL-BOLLINGER BOOK - PAPER ONLY: one ticket per asset-window, the first of these on a closed 1m candle: gold - crossing the 2m Bollinger middle, closing over the 2m upper band (long) / under the 2m lower band (short), or closing back under the 2m upper band after being over it (short); BTC - crossing the 5m middle, or closing over / under the 2m upper / lower band. Zone wall ($2 / $100), ask up to 66c, 2+ minutes left. Replay since Oct 19 ($20): 329 trades, 67%, +$2,228, green 15 of 18 days, worst day -$43 (bands rebuilt from 1m bars - close, not exact). Its own card; never sends an order. Run after CHANGE-87.
- Files: src/components/desk/app.tsx (+1/-0), src/lib/desk/pivotbooks.ts (+26/-0)

## 43. MAIN ZONE WALL MOVING OFF TWIN (fix746, R424)
- When: 2026-11-05 13:56:57 -0800
- Commit: [963558ad](https://github.com/liluvdied/Aurelius/commit/963558adc182079e22516da386ebd7272130c07e)
- Her words: Love Nov 5 2026 12:42 PM PT: "how much did it effect our main books positively ? and waiting for a push that distance didn't make our winrate go up for the other books bb ?" + 12:43 PM: "pls do test those yes i want our win rate at 70% :)" (a paper twin of the main book with the zone wall and rejections taken once moving off the line)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix746 MAIN · ZONE WALL + MOVING-OFF TWIN - PAPER ONLY: a paper twin of the main book. Every call main books, the twin takes too - except not into her green / red zone ($2 gold / $100 BTC), and a REJECTION or a BREAK / push only once price is already $50 BTC / $1 gold past the line it was called on (Love 12:48 PM: main exactly, just waits those distances on pushes). If price isn't there yet the twin waits and books later in the same window when it gets there, at that moment's price (under 66c, 2+ minutes left) - the real priced result, not a filter (the filter replay was 643 trades, 54%, +$696 vs main 51%, -$1,001). Main itself is unchanged; the twin never sends an order. Run after CHANGE-88.
- Files: src/components/desk/app.tsx (+1/-0), src/lib/desk/recon.ts (+26/-0)

## 44. AKIMBO STEPS ASIDE 2 3PM (fix755, R425)
- When: 2026-11-05 14:35:19 -0800
- Commit: [1a27140e](https://github.com/liluvdied/Aurelius/commit/1a27140e04dd39895ae53a9b1d957c189677edfb)
- Her words: Love Nov 5 2026 2:02 PM PT: "and during 2 -3 pm we run main" + "she trades the red /green zone flips and bollingers and pinks" + 2:05 PM PT: "main can go on for rn bb it's ok" (AKIMBO steps aside 2-3 PM PT; her lineup and pills trade that hour)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix755 AKIMBO STEPS ASIDE 2-3 PM PT (every day while AKIMBO is on): from 2:00 to 3:00 PM PT the AKIMBO books stand aside everywhere (copier, door, last line, send gates, bell, silent alarm, LIVE TODAY card) and your normal lineup + hour pills trade that hour, exactly as when AKIMBO is off (your pills at 2 PM: BTC = main, gold = rejection model; delayed both). Every rail stays. Other hours unchanged. It's one setting (data/live-today.json skipHoursPT: [14]) - more hours can be added later.
- Files: src/lib/desk/akimbowatch.ts (+1/-1), src/lib/desk/bandlock.ts (+1/-1), src/lib/desk/engine.ts (+1/-1), src/lib/desk/fns.ts (+1/-1), src/lib/desk/kalshi-live.server.ts (+3/-3), src/lib/desk/pivotbooks.ts (+1/-1)

## 45. NO FLIPS (fix759, R426)
- When: 2026-11-05 15:42:21 -0800
- Commit: [005aaa12](https://github.com/liluvdied/Aurelius/commit/005aaa127827f0a31832b86461f2738ab14d7dba)
- Her words: Love Nov 5 2026 3:10 PM PT: "yo why did she exit a trade early ????" + 3:12 PM PT: "no babe don't ever flip a position" (3:00 PM BTC: the AKIMBO flip sold her filled short when +15M PIVOTS called long, then pivot's long was blocked - she was left flat and Down won)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix759 NO FLIPS: the desk never sells a held live position to take the other side. AKIMBO: whichever book holds the window keeps it - when +15M PIVOTS calls the opposite of SESSION + PINK's filled ticket (or the other way round), the call is skipped and logged 'NO FLIPS - holds LONG/SHORT' (was: pivot sold your position and tried to flip, which at 3:02 PM BTC sold your Down for -$3.25 and then couldn't go long). The old change-her-mind flip (':m2' / ':m3' rows) is off too. A try that never filled no longer counts as holding the window, so the other book can still enter normally. Take-profit and exits are unchanged. Paper cards keep tracking as before (the AKIMBO card still shows 'pivot gets the sticks' on paper). Run after CHANGE-103.
- Files: src/lib/desk/engine.ts (+4/-3)

## 46. POLYMARKET OBEYS THE UMPIRE (fix748, R427)
- When: 2026-11-05 15:49:57 -0800
- Commit: [85b08c28](https://github.com/liluvdied/Aurelius/commit/85b08c28151a6a58f00b6dbf39cd3d58f97a9060)
- Her words: Love Nov 5 2026 1:03 PM PT: "the 5M bollinger breaks are 71% on btc , pls route those orders to polymarket at $5" - checking that route found Polymarket never asked the umpire; her standing rule (Oct 29 2026 11:46 AM PT): "if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix748 POLYMARKET OBEYS THE UMPIRE: Kalshi's ENFORCER refuses every opening order while the umpire is not SAFE, but the Polymarket route (the $2 rejection / delayed copies) never asked the umpire - so while Kalshi was frozen this morning, Polymarket could still open orders. Now an opening Polymarket BUY needs the same SAFE stamp; no verdict = no order. Sells and closes are never blocked. Nothing else changes. Run after CHANGE-90.
- Files: src/lib/desk/poly-live.server.ts (+4/-0)

## 47. PAPER NOT ON KALSHI FLAG (fix750, R428)
- When: 2026-11-05 15:52:19 -0800
- Commit: [18459ee5](https://github.com/liluvdied/Aurelius/commit/18459ee50e43ae2504829bd973607aad4eb9a0d0)
- Her words: Love Nov 5 2026 1:34 PM PT: "can you set up a flag for any orders that were sent out on paper and didn't make it to kalshi , when one does have it trigger an evaluation of why until we see what's halting them and fix that"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix750 PAPER-NOT-ON-KALSHI FLAG + EVALUATION (log / alert only - no rule changes, never sends): her silent alarm (CHANGE-78) now also flags an AKIMBO paper entry the copier never attempted at 20 s (was 2 min), and every flag gets an automatic evaluation of why - the copier's status and reasons, seconds from paper to first attempt, copy timing (wait / gates / order ms, live vs paper ask), the 66c floor, the umpire, LIVE, entries on/off, her hand window, and the wall lines for that book + window - written to data/paper-not-kalshi.jsonl and added to the ALERTS line and the Mac ping as 'WHY: ...'. Nothing else changes.
- Files: src/lib/desk/akimbowatch.ts (+32/-1)

## 48. DOLLAR DOLLAR DOLLAR BOOKS GROUP (fix760, R429)
- When: 2026-11-05 16:14:03 -0800
- Commit: [a3d61e07](https://github.com/liluvdied/Aurelius/commit/a3d61e074b626447c3b3d13dc27d4f2bbc757e7f)
- Her words: Love Nov 5 2026 4:02 PM PT: "can you make a new subgroup in the navigation section for all Of our new ones ?:) just $$$ is fine idk what else to name them lol"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix760 $$$ (display only - no order, rule or setting changes): a new family chip on the Books page, first in the list, named $$$ 💸, holding all our new books - AKIMBO card, SESSION + PINK, +15M PIVOTS, the gold 2m middle seat, BTC 5m middle, the AKIMBO + BTC twin card, ALL-BOLLINGER, main wait-distance twin, the inverse book, BRICK no pivot wall, and last night's paper books (momentum, high multiple both ways, 70% club, half-band, cup, VWAP side, rejection parked). They move into $$$ (the now-empty AKIMBO and TONIGHT'S PAPER chips are removed); RUNNING, the tiers and the find box are unchanged.
- Files: src/components/desk/app.tsx (+3/-2)

## 49. BACK PAST THE LINE AS FAR AS IT WENT (fix751, R430)
- When: 2026-11-05 16:19:54 -0800
- Commit: [c50f28b4](https://github.com/liluvdied/Aurelius/commit/c50f28b49bd78c533754e88a0a1c961bdefe0bee)
- Her words: Love Nov 5 2026 1:36 PM PT: "oh yea no we absolutely need to change that to the distance past where it came from thing bb" + 1:37 PM: "no i meant breaks past the other way as far as it went / so broke down by $2 / then flipped the other way and pushed off by $2 / same way we did it yesterday bb" + 1:41 PM: "yess and a few less missed trades i think it's worth it bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix751 BACK PAST THE LINE AS FAR AS IT WENT (every book but delayed): her same-candle check - 'this 5m candle broke UP through the pink / a band - a break up is never a short this candle' (and the mirror for longs) - now has the same release your R355 / fix666 gave her other broke-this-candle walls yesterday: once price is back past that line the other way by at least as far as it went past it this candle (e.g. broke up $2 -> needs $2 back under), and never less than your live push ($6 BTC / 10c gold), the trade is free. Every other gate still applies. Replay since Oct 19 (AKIMBO, the new trades only, real ask, 66c floor, 2+ min left, $20): 122 trades, 47% won, +$239. The delayed book keeps the old rule.
- Files: src/lib/desk/bandlock.ts (+10/-4)

## 50. ADD ONS ON FOR AKIMBO (fix752, R431)
- When: 2026-11-05 16:37:50 -0800
- Commit: [35646207](https://github.com/liluvdied/Aurelius/commit/356462070c6c456c27ccd7fcd6e50f6d80836a79)
- Her words: Love Nov 5 2026 1:46 PM PT: "the size level isn't working for the add ons hun , i set it to $5 and its sending out at $2" + 1:49 PM PT (her card): tapped A - "Turn add-ons ON for AKIMBO positions: your Add-on 1 / Add-on 2 boxes apply to them like your other books" + 1:50 PM PT: "yea i want the add ons on. they end up reversing anyways it's a waste of a good dip if not"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix752 ADD-ONS ON FOR AKIMBO: since this morning (fix717 'no add-ons', carried to every AKIMBO seat) any position owned by an AKIMBO book silently skipped Add-on 1 and Add-on 2 - the last desk add-on was 6:36 AM. Now AKIMBO positions take your Add-on 1 / Add-on 2 boxes like your other books, with the same gates: your desk's own position, no take-profit sell in progress, the price cap, once per position, minutes left, and every order still goes through the umpire / ENFORCER / LIVE / seal at the order. Nothing else changes.
- Files: src/lib/desk/engine.ts (+3/-1)

## 51. ADD ON BOX SIZES EVERY HOUR (fix753, R432)
- When: 2026-11-05 16:45:14 -0800
- Commit: [e1847e22](https://github.com/liluvdied/Aurelius/commit/e1847e22d5527e1be4c67715ddd63445ce7d14ec)
- Her words: Love Nov 5 2026 1:46 PM PT: "the size level isn't working for the add ons hun , i set it to $5 and its sending out at $2" (+ 1:39 PM: "the add on sizer in app isn't functioning properly bb , i made it $5 and it went with $2")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix753 YOUR ADD-ON 1 BOX SIZES EVERY HOUR: in your off / rejection hours (offHourMain - this afternoon included) the first add-on was sized by an old $2 setting (live-switch offHourMain.addOn.dollars), not your Add-on 1 box. Now, whenever your box is saved, its $ ($1-$5) sizes Add-on 1 in every hour. The off-hour price cap (2.8x) and every other gate are unchanged. Run after CHANGE-97.
- Files: src/lib/desk/engine.ts (+3/-1)

## 52. ADD ON 3 CUSTOM BOX (fix754, R433)
- When: 2026-11-05 16:49:02 -0800
- Commit: [fc715425](https://github.com/liluvdied/Aurelius/commit/fc715425ee87b533282ec91220335d590f59c1f0)
- Her words: Love Nov 5 2026 1:48 PM PT: "can you add in a third custom box there? that lets me type the multiple and then put in the dollar amount ?"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix754 ADD-ON 3, YOUR CUSTOM ONE: a third row under Add-on 1 / Add-on 2 in your desk settings - type the multiple (1.5x-10x), the $ ($1-$5), and an on/off toggle (starts OFF until you set it). When a position's price reaches your multiple, ONE buy of your $ on the same side, once per position, on its own (it doesn't wait for Add-on 1 or 2 - whichever multiple price reaches first goes first). Same gates as your add-ons: the desk's own position, no take-profit sell going, BTC / gold, not the delayed twin, minutes left, and the umpire / ENFORCER / LIVE / seal at the order. Run after CHANGE-98.
- Files: src/components/desk/settings-drawer.tsx (+27/-0), src/lib/desk/engine.ts (+19/-0), src/lib/desk/fns.ts (+2/-2)

## 53. CHART KALSHI GAP MEASURED RIGHT (fix763, R434)
- When: 2026-11-05 16:56:03 -0800
- Commit: [ee0ecfa2](https://github.com/liluvdied/Aurelius/commit/ee0ecfa28be7c33d02636998b0c5efa32433f3d9)
- Her words: Love Nov 5 2026 ~4:30 PM PT: "okay the price on tradingview needs to be deducted from the price and kalshi bb :)" (bug fix: the window-open chart-vs-Kalshi gap was measured against a target that already had the previous window's gap in it)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix763 THE GAP, MEASURED RIGHT (bug fix, no rule change): the desk deducts the TradingView-vs-Kalshi gap from Kalshi's strike to put the target on your chart. The gap was measured against a target that ALREADY had the last window's gap added, so each window's gap was 'true gap minus last window's gap' and flipped sign window to window (today BTC: +87, -75, -49, +35...; at 4:15 PM BTC the target sat ~$87 under your chart, so every short 'had to cross +1 sigma to reach the target' and was refused). Now: your chart price at the open minus Kalshi's own strike, re-measured whenever Kalshi's strike for that window changes, and any gap over $40 BTC / $3 gold is treated as a bad read (the last good gap carries). Logged every time. Run after CHANGE-99.
- Files: src/lib/desk/engine.ts (+21/-6), tools/strike-off-test-519.cjs (+2/-2)

## 54. AKIMBO BREAKS SOONER GOLD 10C BTC 5 (fix756, R435)
- When: 2026-11-05 17:00:55 -0800
- Commit: [e4de3690](https://github.com/liluvdied/Aurelius/commit/e4de369015eeae05c1b090d35a650b9d372a4150)
- Her words: Love Nov 5 2026 1:59 PM PT: "she still isn't entering in on breaks quick enough hun" + 2:01 PM: "yes pls" + 2:04 PM: "yes 10c gold , btc $5 pls" (AKIMBO break distance)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix756 AKIMBO BREAKS SOONER: SESSION + PINK and +15M PIVOTS now call a live break once price is 10c (gold) / $5 (BTC) past the line, instead of 33c / $6 - she gets in earlier. Every other break book keeps your liveBreakDist (33c / $6). Every wall and rail is unchanged. Replay since Oct 19 (simple first-break model): gold 246 -> 278 trades, 63% -> 63%, +$676 -> +$965; BTC 321 -> 328, 54% -> 54%, -$199 -> -$152. Run after CHANGE-100.
- Files: src/lib/desk/pivotbooks.ts (+5/-1)

## 55. AKIMBO BREAK TRACE LOG ONLY (fix757, R436)
- When: 2026-11-05 17:05:41 -0800
- Commit: [6e8c2755](https://github.com/liluvdied/Aurelius/commit/6e8c2755d0c62f64c60ff37aef3d0e8756e0e630)
- Her words: Love Nov 5 2026 1:59 PM PT: "she still isn't entering in on breaks quick enough hun" + 2:01 PM: "yes pls / and definitely cut that yes that's what the lag is" (a log-only trace to find the seconds between a break and her call)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix757 AKIMBO BREAK TRACE (log only - changes no decision, sends nothing): once a second for SESSION + PINK and +15M PIVOTS on each asset, it writes what she saw at her break read - the price and how old it was, the last 1-minute candle, the pink, the Kalshi target, her call (or none) and her status - to data/akimbo-break-trace.jsonl. On the next slow break we can see exactly which second she saw it and what held her (like the ~8 s at 1:47 PM BTC). Run after CHANGE-101.
- Files: src/lib/desk/pivotbooks.ts (+3/-0)

## 56. BTC AKIMBO ZONE OUTER 55 (fix758, R437)
- When: 2026-11-05 17:26:26 -0800
- Commit: [f9ac8d27](https://github.com/liluvdied/Aurelius/commit/f9ac8d27bbd1dc08fbc0ed1e79b571bbcc15b4b4)
- Her words: Love Nov 5 2026 2:27 PM PT: "oh no we need to update that to the same outer 55% as main and rej. bb / not $2" + 2:29 PM PT (her card): "BTC only, gold stays as is"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix758 BTC AKIMBO ZONE = YOUR OUTER 55%: on BTC, SESSION + PINK and +15M PIVOTS now use the same zone rule as main and rejection (fix594) - no long once price is 45%+ of the way from the pink up to the red zone (the top 55%), no short 45%+ of the way from the pink down to the green - on your board's lines, instead of the $100 / $50 wall. Gold stays exactly as it is. Replay since Oct 19 (BTC, one per window): $100 wall 276 trades 58% +$446 -> 55% rule 771 trades 57% +$696. Run after CHANGE-102.
- Files: src/lib/desk/pivotbooks.ts (+10/-0)

## 57. AKIMBO SKIP REASONS LOG ONLY (fix761, R438)
- When: 2026-11-05 17:52:05 -0800
- Commit: [16e8eb7a](https://github.com/liluvdied/Aurelius/commit/16e8eb7ac46deba0a637fd2a9e6ac2202bda7f8d)
- Her words: Love Nov 5 2026 4:17 PM PT: "she misses every entry like this hun we need to fix something ... can you look into why that keeps happening for me bb ?" + 4:19 PM: "broke pink down with a 3x and she didn't enter / something is up w her" (log-only: every silent AKIMBO skip gets a reason)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix761 AKIMBO SKIP REASONS (log only - no decision changes, sends nothing): SESSION + PINK and +15M PIVOTS used to drop some calls without writing why (the +15M PIVOTS 3-second push gate, the paper floor / ask bounds, 'same refused setup again'). Now each of those writes a reason (at most every 2 s per book + asset) to data/fast-skip.jsonl, like her other books already do - so the next 'she just didn't enter' has an answer. Run after CHANGE-103.
- Files: src/lib/desk/pivotbooks.ts (+3/-3)

## 58. ONE TAP LIVE NO POPUP (fix764, R439)
- When: 2026-11-05 18:13:49 -0800
- Commit: [48731283](https://github.com/liluvdied/Aurelius/commit/48731283fff60a7527786f46c75cecb60d419a0d)
- Her words: Love Nov 5 2026 4:43 PM PT (photo of the "Turn LIVE on? Real Kalshi and Polymarket orders will be sent, up to $10 each." pop-up): "please remove this"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix764 ONE TAP LIVE (display only): the 'Turn LIVE on? Real Kalshi and Polymarket orders will be sent' pop-up is gone - one tap on LIVE turns it on, and the toast 'LIVE is on. Real orders can go out.' confirms it took. The LIVE switch itself, the seal, the umpire and every rail are unchanged; turning LIVE off is unchanged.
- Files: src/components/desk/app.tsx (+1/-1)

## 59. CARDS NOT LISTS SORTER BY BOOKS (fix765, R440)
- When: 2026-11-05 18:17:17 -0800
- Commit: [cf54b2ed](https://github.com/liluvdied/Aurelius/commit/cf54b2ed021f585fe1d78b580b447e472b697e86)
- Her words: Love Nov 5 2026 4:53 PM PT: "pls put this sorter here by the actual books pls bb / and pls put these in cards , original format like the rest of the cards pls it takes a lil to scroll thru those 😹 and the cards look beautifulll i like the way you made the cards for me :)"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix765 CARDS, NOT LISTS + THE SORTER BY THE BOOKS (display only - no book, rule, order or setting changes): the $ HIGH / $ LOW / HIT % HIGH / HIT % LOW sorter moves down to sit with the book chips (ALL / $$$ / ...), right above the cards it sorts. OG ORIGINAL 10.12 and OUTWARD BREAK become regular cards (in $$$) like the rest, and the long full-width trade lists that already have cards (OG 10.12, OUTWARD BREAK, inverse, momentum, half-band, cup, 70% club, VWAP side, rejection parked) come off the page - tap a card for its trades. RSI BOOKS and ETH REJECTIONS get regular cards too (in $$$); tap RSI for its timeframe / level filters and table, tap ETH for its panel, tap either HIGH MULTIPLE card for its tracker - nothing stays a big scrolling tile. Her sealed OG 10.12 rows are read exactly as they are. Run after CHANGE-108.
- Files: src/components/desk/app.tsx (+20/-14), src/lib/desk/paperrows.ts (+6/-2)

## 60. STATS BY THE WEEK (fix767, R441)
- When: 2026-11-05 18:19:37 -0800
- Commit: [f7920223](https://github.com/liluvdied/Aurelius/commit/f7920223c5c9448a2f3e61de04461d90f26e4e6e)
- Her words: Love Nov 5 2026 5:52 PM PT: "omg the stats page was supposed to be scoring the whole day babez 😹it still hasn’t moved" / 5:54 PM PT: "no i want it to score for the week if possible bb , and keep the older ones in the view only archive so it doesn’t slow her down"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix767 STATS BY THE WEEK (display only): the STATS 'ALL TIME' box was really the last 4 days of this paper book's fills, rolling (720 trades, 360W/360L, -$796.61 matched to the cent), so a new day barely moved it. Adds THIS WEEK above it (Monday 12:00 AM Pacific, scored on her side, one row per setup sent to the page) and an ARCHIVE button: each finished week is kept in data/stats-weeks/<monday>.json and is read only when you open it. The old box is relabelled LAST 4 DAYS. No entries, exits, walls or books touched.
- Files: src/components/desk/journal.tsx (+70/-2), src/lib/desk/stats-week.ts (+105/-0)

## 61. ON KALSHI NOW CARD (fix766, R442)
- When: 2026-11-05 18:28:50 -0800
- Commit: [1ed4f54c](https://github.com/liluvdied/Aurelius/commit/1ed4f54c54edcc1c4a32bbc75e98c265d99ba1cc)
- Her words: Love Nov 5 2026 5:06 PM PT: "the new active ledger for what's on kalshi rn doesn't have its own card still bb , can you give her one so we can see the actual record ? 💓"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix766 ON KALSHI NOW 💸 · AKIMBO LIVE (display only): a regular card, first in your $$$ group, showing the REAL Kalshi record of whatever is live - AKIMBO (SESSION + PINK, +15M PIVOTS, the gold 2m seat) plus main / TOGETHER in the 2-3 PM hand-over (and any future live-today book) - from Kalshi's own fills and settlements, add-ons included, since AKIMBO went live (Nov 5 6:36 AM PT). $ / W-L / hit %, 4H / 12H / 24H / ALL, tap for each trade. No paper rows. Note: in a window where you also added by hand, Kalshi counts the whole window together. Run after CHANGE-109.
- Files: src/components/desk/app.tsx (+3/-1), src/lib/desk/fns.ts (+1/-1), src/lib/desk/paperrows.ts (+19/-0), src/lib/desk/pivotbooks.ts (+16/-3)

## 62. AKIMBO 50 PUSH PAPER TWIN (fix762, R443)
- When: 2026-11-05 18:30:31 -0800
- Commit: [4fab3e9a](https://github.com/liluvdied/Aurelius/commit/4fab3e9a6b503fb3b75969fe21c0d6854a2ad24d)
- Her words: Love Nov 5 2026 4:22 PM PT: "hun we need to change the candle close rule ... how it was more 71% successful after a push of $50" + her card pick ~4:25 PM: "Paper twin first" (BTC, $50 past the line, no candle close)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix762 AKIMBO $50 PUSH 🧪 - PAPER ONLY, BTC: a new paper book in your $$$ group. Same lines and walls as SESSION + PINK, but a break fires the first time BTC is $50 past a line it was on the other side of (this minute or last minute) - no 1m candle close needed. Never sends an order; it's here to prove the idea on live data before anything changes live. Replay since Oct 19 ($20, one per window): 223 trades, 53%, +$926, all 3 weeks green (vs SESSION + PINK / +15M PIVOTS BTC 57%, +$690). Run after CHANGE-105 (and 110).
- Files: -

## 63. ON KALSHI NOW PINNED NO RUN TRUE COUNT (fix768, R444)
- When: 2026-11-05 19:46:21 -0800
- Commit: [a66e3935](https://github.com/liluvdied/Aurelius/commit/a66e3935cdbf8ebe04dc98cb36e0756baf78a45e)
- Her words: Love Nov 5 2026 5:06 PM PT: "the new active ledger for what's on kalshi rn doesn't have its own card still bb , can you give her one so we can see the actual record ? 💓" (follow-up to fix766: the card pinned first, no RUN pill on it, and its record matching Kalshi's fills - a TOGETHER ":n2" ticket was read as a book called "n2")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix768 ON KALSHI NOW, FIXED (display only): the card is pinned first in your $$$ group and first in every sort; its RUN pill is gone (it's a record, not a book); and its count now matches Kalshi's fills - a TOGETHER ticket booked as a second try (':n2', the 5:45 PM BTC +$4.71) was read as a book called 'n2' and fell off the card. No book, rule, order or risk setting changes.
- Files: src/components/desk/app.tsx (+2/-1), src/lib/desk/bookwatch.ts (+1/-1), src/lib/desk/dayboard.ts (+1/-1), src/lib/desk/paperrows.ts (+3/-1), src/lib/desk/riskguard.ts (+1/-1)

## 64. RETRY ROWS COUNT UNDER THEIR BOOK (fix769, R445)
- When: 2026-11-05 19:48:09 -0800
- Commit: [8acc9f74](https://github.com/liluvdied/Aurelius/commit/8acc9f741099c44f6824a9f24ee30946ea86984c)
- Her words: Love Nov 5 2026 5:06 PM PT: "the new active ledger for what's on kalshi rn doesn't have its own card still bb , can you give her one so we can see the actual record ? 💓" (bug found building it: a live ticket on a retry row - key ending ":n2" - was counted under a book called "n2" in riskguard / bookwatch / dayboard; fix768 fixed the card, this fixes the shared read)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix769 RETRY ROWS COUNT UNDER THEIR OWN BOOK (bug fix - no rule, threshold or rail value changes): the risk guard, book watch (ALERTS) and day board read which book owns a live Kalshi ticket from the last part of its key, so a retry row (key ending ':n2', ':m2', ':m3') was filed under a book called 'n2' - e.g. TOGETHER's 5:45 PM BTC +$4.71 tonight. Now the retry tag is stripped first, so it counts under TOGETHER. Today this changes no decision: the per-book bench is off (your Oct 14 call) and the daily stop / give-back count the day's total, which already included it. Run after CHANGE-113.
- Files: -

## 65. V111-2 PAPER BOOK (fix770, R446)
- When: 2026-11-05 19:59:26 -0800
- Commit: [8ad3e2ef](https://github.com/liluvdied/Aurelius/commit/8ad3e2efa342ae69d6bd68368228d4521a1c94f8)
- Her words: Love Nov 5 2026 ~7:05 PM PT: "Give her her own card, V.111 - 2 ... for now lets get her on paper taking every set up under her rules 💞 we will boil it down rather quickly, shes using the same bands? half ? and the rolling 60M vwap ?"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix770 V.111 - 2 · PAPER BOOK - her own card in your $$$ group, PAPER ONLY (never sends an order, even with LIVE on; in no live list; its fill-log rows are on their own venue so no copier can pick them up). BTC + gold, Kalshi 15m. Her Sep 24 reads exactly (og-replay.mjs, ported line for line - same code once types are stripped, 0 differences on 6,000 random bar sets): yes, the same half bands (±0.5, 1, 1.5, 2, 2.5, 3σ) on the ROLLING 60-MINUTE VWAP (last 60 1m bars, volume weighted) - the 1m read, then the 5m read (last 12 5m bars), then the window-open read (2+ min left). First look wins, one trade per asset per window, read once a minute on closed 1m bars (minutes 1-14). EVERY set up on - data/v111-2-cut.json is the cut list (empty) so set ups can be switched off later without code. $20 at the real ask, held to the bell, scored under your take-profit; every trade lands in the fill log as 'V.111 - 2 · <set up>' with side and ask, so STATS (this week + all time) and SET UP SCORES score it by set up. Run after CHANGE-113 and CHANGE-114.
- Files: src/components/desk/app.tsx (+2/-1), src/lib/desk/engine.ts (+2/-0), src/lib/desk/paperrows.ts (+1/-0), src/lib/desk/v1112.ts (+267/-0)

## 66. V111 2 IN THE RUNNING TABLE (fix772, R447)
- When: 2026-11-05 21:08:58 -0800
- Commit: [55f4ce54](https://github.com/liluvdied/Aurelius/commit/55f4ce54a31eeaeba1592eed424068d5c8ca95ba)
- Her words: Love Nov 5 2026 ~8:23 PM PT: "pls put it in the running table so i dont need to go looking :)"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix772 V.111 - 2 IN THE RUNNING TABLE - display only. Her card (V.111 - 2 · HER SEP 24 READS · PAPER) now always rides in the green RUNNING box at the top of the SHIFT cards, right after FIVEY, with her W/L, $ and hit % and her trades under it when tapped (open trade, entry time, side, set up, ask / multiple, result). Her open paper trades also show in the OPEN NOW strip at the top of RUNNING, named 'V.111 - 2 (paper)'. She is still PAPER: not on RUN, in no live list, her own fill-log venue - no order, wall or size changes. Run before CHANGE-118.
- Files: src/components/desk/app.tsx (+8/-5), src/components/desk/setup-board.tsx (+65/-0), src/lib/desk/setupboard773.ts (+102/-0)

## 67. SETUP SCOREBOARD (fix773, R448)
- When: 2026-11-05 21:10:55 -0800
- Commit: [94e9ac36](https://github.com/liluvdied/Aurelius/commit/94e9ac36f0dad1242e21515cc45f4fd06349a4cc)
- Her words: Love Nov 5 2026 ~8:04 PM PT: "we'll let her get some scores overnight , lets score our own trades by these as well , and create a flip at red - break thru pink - etc scoring system for ours alongside it 💘 we can take things up a notch, we have the mechanics stable, now lets choose what she takes"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix773 SETUP SCOREBOARD - display only, a new box on the STATS tab. Every book's settled trades (MAIN, REJECTION, REJ ONLY · NO PINK, DELAYED, the 5M / OG pivot books, the paper twins, the paper books' own files - every book on the desk - and V.111 - 2), picked one book at a time, scored per asset | side | set up for THIS WEEK (Monday 12 AM PT, the same week math as STATS BY THE WEEK) and the LAST 24H: trades, wins, hit %, $ net (each book's own exits - take-profit where it has one), avg ask. Two ways to read it: OUR SETUP = the family of the label the book wrote (pink rejection, break through pink, close through pink, zone rejection, Bollinger rejection, band rejection at each sigma / VWAP, pivot rejection, at a band, window open, next band touch, thirds launch, gold clock ...; anything else shows its own label) and HER BAND READ = what V.111 - 2's own brain (v1112.ts, her 60-minute rolling VWAP, half bands, 1m then 5m then window open) calls the minute each trade went in, from the desk's own 1m bars (kept from tonight on - older trades show 'no bars'), so ours and hers line up on the same names. CUT (red) = 10+ trades and hit under 60% or $ under 0, KEEP (green) = 10+ trades, 60%+ and $ over 0, WATCH = under 10 - the 10 and 60 live in data/setup-verdict-rules.json (not locked) so you can change them. Sort by hit % or $. Past weeks from its own archive (data/setup-board-weeks/) only when opened. The scoring runs in its own low-priority background process at most once a minut
- Files: -

## 68. BESTIE V111 2 LIVE KALSHI 5 (fix775, R449)
- When: 2026-11-05 21:48:23 -0800
- Commit: [6c2477b8](https://github.com/liluvdied/Aurelius/commit/6c2477b8903d7d0f1138e2d3e30c80003b10e0d7)
- Her words: Love Nov 5 2026 ~9:25 PM PT: "actually you know what let's place V111 - 2 - best from the set ups only table on at $5 pls we will see if it's her i want to know" + her card picks: venue Kalshi; "Like AKIMBO" (joins the live lineup, her own read + the lineup rails, no main-book walls); "flat $5" (no multiple trims for her) + ~9:26 PM: "and let's create a new twin for her , Prime Book v.2" + "no not that sorry bestie" + "call it bestie" + ~9:34 PM: "you can drop the command for us to put her on Bestie whenever bb, let me do the add on in the toggle switch if i want to after we see how she's doing oki" + earlier picks kept: the BEST tables of STATS THIS WEEK, LAST 4 DAYS and PRIME BOOK ("she can take all of the ones in the best tables for the week and 4 days and most recent , all 3 of them :))"), 3 trades minimum, more than half
- Before: (the code as it was in the previous entry - see the diff)
- After: fix775 BESTIE 💞 - V.111 - 2's twin, LIVE ON KALSHI AT $5, her BEST set ups only. Her paper book is unchanged (every take still trades and scores on paper). ADDITIONALLY: the second she takes a set up, the desk checks the BEST tables of the STATS page (THIS WEEK, LAST 4 DAYS, PRIME BOOK - counted exactly as the page counts them; BEST = $ 0 or more). If her set up's label is in BEST in any of the three with 3+ trades and MORE than 50% there, that take goes to Kalshi as her own live book 'bestie' in the live lineup next to AKIMBO (data/live-today.json: brk-sesspk, brk15, gmid2 + bestie - AKIMBO unchanged). Like AKIMBO: her own read is her gate (the main-book walls do not judge her), plus every lineup rail - the umpire must be SAFE, the shared -$100 day stop for the whole lineup, the break-side check, halt and the LIVE switch, the sub-auditor stamp, one ticket per asset per window (first call wins), no flips, the desk's 1.38x price floor, 2-3 PM PT off like the lineup. Size: a flat $5 (live-switch bookDollars bestie = 5, no 3/4 or 1/4 multiple trims for her only - the delayed book's exception; every other book's size unchanged). Exits: the desk's live exit stack (she is not in mirrorPaperBooks). Her card 'BESTIE 💞 · V.111 - 2's BEST SET UPS · LIVE ON KALSHI $5' rides in RUNNING with the lineup; OPEN NOW shows her as 'BESTIE (LIVE $5)'. Add-ons: OFF for BESTIE until data/v111-2-live.json addOns is true - then your Add-on 1 / 2 / 3 boxes apply to her like every other book (no new a
- Files: src/components/desk/app.tsx (+4/-3), src/lib/desk/engine.ts (+5/-4), src/lib/desk/grokog.ts (+4/-2), src/lib/desk/kalshi-live.server.ts (+3/-3), src/lib/desk/v1112.ts (+2/-0), src/lib/desk/v1112best.ts (+93/-0)

## 69. SESSION PINK PLUS BESTIE PIVOTS OFF LIVE (fix776, R450)
- When: 2026-11-05 22:03:59 -0800
- Commit: [5f682d65](https://github.com/liluvdied/Aurelius/commit/5f682d65b8a32dcc19323c77b3573c09a7927514)
- Her words: Love Nov 5 2026 ~9:50 PM PT: "no i want her only on that book hun akimbo is off" + ~9:52 PM PT: "so if bestie beats her she will get in ? and if akimbo breaks she will get in? that's actually a good happy medium honestly but make it session pink only pls not the pivot book i cannot endorse it bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix776 SESSION + PINK + BESTIE LIVE - PIVOTS OFF LIVE. data/live-today.json lineup goes from 'brk-sesspk,brk15,gmid2,bestie' to 'brk-sesspk,bestie': SESSION + PINK (brk-sesspk) and BESTIE (bestie, V.111 - 2's BEST set ups, flat $5) send to Kalshi; whichever calls the window first gets it, no flips (the other one's opposite call is skipped and logged). +15M PIVOTS (brk15) and GOLD 2M MIDDLE BB (gmid2) are off live; their paper records keep running exactly as before. Every rail unchanged: the umpire, the -$100 day stop (counts both live books), break side, halt, the LIVE switch, one ticket per window, the 1.38x floor, 2-3 PM PT off (skipHoursPT [14] -> main), end date Sat Nov 7 midnight PT. No code changed. Proofs updated so this lineup passes (no other check weakened): akimbo-726 (lineup list also accepts 'brk-sesspk,bestie'), gold-mid-bb-742 (seat 3 must be in the lineup unless the lineup is 'brk-sesspk,bestie'), v111-2-live-775 (lineup = the 4 books or 'brk-sesspk,bestie'). Run after CHANGE-120.
- Files: -

## 70. V111 2 INVERSE PAPER (fix777, R451)
- When: 2026-11-06 01:20:34 -0800
- Commit: [c6df6e56](https://github.com/liluvdied/Aurelius/commit/c6df6e569b0e981856111fcc8a9e5df253280f17)
- Her words: Love Nov 5 2026 ~9:48 PM PT: "and the V.111 version is running at 33% , but that's a good thing we can invert the trades on that 💞"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix777 V.111 - 2 INV · HER TAKES FLIPPED · PAPER. Every take of V.111 - 2, the same second, same asset, same 15m window: the OPPOSITE side, priced at that side's real live Kalshi ask in the same read (her long -> short at the no ask; her short -> long at the yes ask; no ask between 1c and 99c = no inverse trade that window, counted as skipped). $20 paper like V.111 - 2, one per window, held to the bell and scored under the same take-profit (half at 75% of the way to $1, the rest trails from 90%, sold 5c off its best bid), settled from Kalshi's own result. Its own file data/v111-2-inv-777.json; settled trades in the fill log as 'V.111 - 2 INV · <set up>' (book 'V.111 - 2 INV', venue 'paper-v111-2-inv' - never 'paper', so nothing mirrors it to Kalshi). PAPER ONLY: no live path, in no live list, never mirrored; BESTIE never reads it (her live rows come from V.111 - 2's own rows, her BEST list matches the raw set up label, never 'V.111 - 2 INV · ...'). Its card 'V.111 - 2 INV · HER TAKES FLIPPED · PAPER' rides in RUNNING right after V.111 - 2; OPEN NOW shows it as 'V.111 - 2 INV (paper)'; the SET UP SCOREBOARD picks it up as its own book; STATS shows its set ups as 'V.111 - 2 INV · <set up>'. V.111 - 2's own trades, card and BESTIE are unchanged. Proof: tools/v111-2-inv-777.cjs; tools/v111-2-770.cjs now also proves her take opens the inverse (and counts her fill-log rows without the inverse's row). Starts from install - no back-fill. Run after CHANGE-121.
- Files: src/components/desk/app.tsx (+5/-4), src/lib/desk/paperrows.ts (+1/-0), src/lib/desk/v1112.ts (+3/-0), src/lib/desk/v1112inv.ts (+76/-0)

## 71. BESTIE ALL HOURS (fix778, R452)
- When: 2026-11-06 01:33:44 -0800
- Commit: [5f9b6d74](https://github.com/liluvdied/Aurelius/commit/5f9b6d7417e6f5789ffd29836f2080fef285f95c)
- Her words: Love Nov 6 2026 ~1:19 AM PT: "babe did you get that fix in ? the winning set ups only ?" -> told BESTIE had 0 live trades, every BEST take skipped by the BTC/GOLD hour map -> Love's card pick ~1:24 AM PT: variant A, BESTIE through ALL hours of the hour map, including 11 PM-12 AM
- Before: (the code as it was in the previous entry - see the diff)
- After: fix778 BESTIE ALL HOURS: BESTIE joins live-switch shifts.anyHour for BTC and gold, the same way SESSION + PINK (brk-sesspk) already does, so the BTC/GOLD hour map no longer skips her in any hour - including 11 PM and 12 AM (the hours the map gives to nobody). Every rail unchanged: the umpire, the -$100 day stop, halt, the LIVE switch, one ticket per window (first call wins), no flips, the 1.38x floor, 2-3 PM PT off (skipHoursPT [14]), end date Sat Nov 7. Every other book's hours exactly as before (proof checks 3552 hour/side answers). No code changed.
- Files: -

## 72. HALF AT 75 HALF AT 95 ALL FOUR (fix782, R453)
- When: 2026-11-06 02:08:03 -0800
- Commit: [3086fa63](https://github.com/liluvdied/Aurelius/commit/3086fa63ca57dd3e8096cb8af18668194648ef6a)
- Her words: Love Nov 6 2026 ~1:42 AM PT: "it needs to be our current one , half at 75 other half at 95" + ~1:53 AM PT: "the same take profit as our main and rej books hun :)" + her card pick ~1:59 AM PT: "75/95 on all four live books"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix782 (extends fix780) HALF AT 75% / HALF AT 95% OF THE WAY TO $1 ON ALL FOUR LIVE BOOKS: a live position main (TOGETHER, recon-tog), REJECTION (recon-rej), SESSION + PINK (brk-sesspk) or BESTIE (bestie) opened, with no slider of hers on it: the first time its bid reaches 75% of the way from its average price to $1, half sells at the bid; the first time its bid reaches 95% of the way, the rest sells (65c in: 91.25c / 98.25c; a bid that jumps past both sells it all); otherwise it rides to the bell. For these four books this replaces the quarter at 75% of the max (fix121) and the paper-follow exit (mirror), and no 90% take profit / trail, gate, lock the win or resting take profit sells them. Unchanged: her own hand trades' take profit, her slider (wins), HANDS OFF, add-ons, the DELAYED book (recon-dly) and every other book's exits, every paper book's scoring, every entry rule and money rail. live-switch "tp780": false turns it off (old exits back).
- Files: src/lib/desk/engine.ts (+43/-1)

## 73. SESSION PINK OFF BESTIE ONLY (fix785, R454)
- When: 2026-11-06 02:49:04 -0800
- Commit: [41e389a7](https://github.com/liluvdied/Aurelius/commit/41e389a7520b6be56e2ee63814c0911081962758)
- Her words: Love Nov 6 2026 ~2:38 AM PT: "hun , pls turn session pink off and only run bestie"
- Before: R450: fix776 SESSION + PINK + BESTIE LIVE - PIVOTS OFF LIVE. data/live-today.json lineup goes from 'brk-sesspk,brk15,gmid2,bestie' to 'brk-sesspk,bestie': SESSION + PINK (brk-sesspk) and BESTIE (bestie, V.111 - 2's BEST set ups, flat $5) send to Kalshi; whichever calls the window first gets it, no flips (the other one's opposite call is skipped and logged). +15M PIVOTS (brk15) and GOLD 2M MIDDLE BB (gmi
- After: fix785 SESSION + PINK OFF LIVE - BESTIE ONLY: data/live-today.json lineup goes from 'brk-sesspk,bestie' to 'bestie' (exactly the way fix776 changed it): SESSION + PINK (brk-sesspk) stops sending live orders; its paper keeps running exactly as before; any SESSION + PINK position already open keeps its exits (half at 75% / 95% of the way, fix782). BESTIE (V.111 - 2's BEST set ups, flat $5) is the only live book. Every rail unchanged: the umpire, the -$100 day stop, halt, the LIVE switch, one ticket per window, the 1.38x floor, 2-3 PM PT off (skipHoursPT [14] -> main), end date Sat Nov 7. No code changed. Proofs updated so this lineup passes (no other check weakened): akimbo-726, gold-mid-bb-742, v111-2-live-775 also accept 'bestie'.
- Files: -

## 74. BESTIE BAR OVER 10 TRADES OVER 65 (fix786, R455)
- When: 2026-11-06 02:58:00 -0800
- Commit: [7b6930a6](https://github.com/liluvdied/Aurelius/commit/7b6930a65e39431b912f3af52c15cac4c8b76062)
- Her words: Love Nov 6 2026 ~2:34 AM PT: "hun did you put her on the best table set ups i sent you pictures of ? they all had like 40 trades" + ~2:35 AM PT: "yes bb over 10 trades over 65%"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix786 BESTIE'S BAR - MORE THAN 10 TRADES, OVER 65%: BESTIE keeps re-reading the STATS BEST tables live (THIS WEEK, LAST 4 DAYS, PRIME BOOK - all three stay her sources), but a row now counts only with MORE than 10 trades (11+) and MORE than 65% won in that box, and $ 0 or more (BEST) as before. Replaces the 3+ trades / more than 50% bar. The bar lives in her switch file data/v111-2-live.json (minTrades 11, minHitPct 65 - not locked); missing = the old bar. Her list right now: Tap-reject at +2σ, -1.5σ, +0.5σ, +1.5σ, -0.5σ (THIS WEEK / LAST 4 DAYS) - and PRIME BOOK still lets in Tap-reject at +1σ (14/18, 78%) and +0.5σ / +1.5σ / -0.5σ / -1.5σ; Tap-reject at -2σ (3/4) is out. Every rail, size ($5), exit and other book unchanged.
- Files: src/lib/desk/v1112best.ts (+10/-2)

## 75. BESTIE WALLS PAPER TWIN (fix783, R456)
- When: 2026-11-06 03:07:41 -0800
- Commit: [10ec5ef4](https://github.com/liluvdied/Aurelius/commit/10ec5ef4ed5f4c3ce6495052146b757974315009)
- Her words: Love Nov 6 2026 ~2:12 AM PT: "can you include all of the same band / zone tolerances for this book too hun ? she traded into a red zone for btc and a pink and the bollinger for gold we need to fix that real quick and she'll be good 💓 keep an unadulterated version of this one.  , we will do one that has the pivot tolerances 💓" + her card pick: (b) live BESTIE stays pure, the walled version runs as a paper twin
- Before: (the code as it was in the previous entry - see the diff)
- After: fix783 BESTIE · WALLS · PAPER TWIN. Live BESTIE stays exactly as she is (pure - the unadulterated one). A paper twin takes exactly BESTIE's takes (V.111 - 2 takes decided on her BEST list, same side, her real ask, $5) but each is first judged by MAIN's door on the live board that second, the way the sub-auditor judges main (TOGETHER, recon-tog): bandlock.ts impossibleGeo with main's flags (channel 33%, unbroken band ahead, pink cushion, pink-to-red/green 55%, Bollinger, zones, her candle / flip), her zone tolerance and her reach wall. Refused = not taken here; kept on its own card 'BLOCKED - what they would have done' with main's reason, scored as if taken. Taken rows: held to the bell + her take-profit, settled from Kalshi, fill log venue paper-bestie-walls. Tonight's replay (21 BESTIE takes since 10 PM): main's door blocks 19 incl. all 11 winners. Pivot-tolerance version not built (next). Every live book, wall, size, exit and money rail unchanged.
- Files: src/components/desk/app.tsx (+6/-4), src/lib/desk/paperrows.ts (+3/-1), src/lib/desk/v1112.ts (+3/-1), src/lib/desk/v1112walls.ts (+99/-0)

## 76. BESTIE SKIP IF WORST ANYWHERE (fix787, R457)
- When: 2026-11-06 03:10:35 -0800
- Commit: [2fabc308](https://github.com/liluvdied/Aurelius/commit/2fabc308fd76f3d8eba24bc7d8363980ad11325d)
- Her words: Love Nov 6 2026 ~2:56 AM PT, her card pick (asked: Tap-reject at +1σ is still on BESTIE's list through PRIME BOOK 14/18 while THIS WEEK has it WORST): "Skip it if WORST anywhere"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix787 SKIP IT IF WORST ANYWHERE: a set up whose label is in ANY STATS box's WORST table (THIS WEEK, LAST 4 DAYS, PRIME BOOK - $ under 0 there, read live, the page's own split) is off BESTIE's list, even when another box has it BEST and over her bar (fix786: more than 10 trades, over 65%). Same label match the BEST rows use. Switch: her file data/v111-2-live.json skipIfWorstAnywhere true. Run after CHANGE-127. Her list right now: Tap-reject at +2σ, -1.5σ, +0.5σ, +1.5σ, -0.5σ; Tap-reject at +1σ (WORST this week / last 4 days) and -2σ are out. Every rail, size, exit and other book unchanged.
- Files: src/lib/desk/v1112best.ts (+12/-1)

## 77. BESTIE TEN DOLLAR LEVEL (fix784, R458)
- When: 2026-11-06 03:16:14 -0800
- Commit: [9ba929aa](https://github.com/liluvdied/Aurelius/commit/9ba929aa2cd92b16d2c782e16546af446d5a0fd2)
- Her words: Love Nov 6 2026 ~2:31 AM PT: "and let’s please incorporate the $10 level rule we have , only trade away from them / if they are at a $10 level within $1.50 and we are under that level , don’t trade up or down into it only away from it okay 💓"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix784 BESTIE'S $10 LEVEL (live BESTIE - an exception to keeping her pure, at her ask; paper BESTIE · WALLS already has it inside main's door): her rule as main + rejection have it (fix217 / fix232 / fix440, R149): gold only - when the window's target sits within $1.50 of an even $10 level, no long while price is under that level (up into it) and no short while price is over it (down into it); trading away from it is clear; price on the level (within 30c) is not judged. Done with the same lines: bandlock.ts's inline $10 block moved word for word into one function tenLevel440 (impossibleGeo calls it exactly as before - flipRule: $1.50 main + rejection, $1 other books), and the live-today send asks it with flipRule true ($1.50) for the books listed in live-switch tenLevelBooks784 = ["bestie"] (kalshi-live.server.ts, the lineup branch). BTC has no $10-level rule on the desk (none added). Replay of BESTIE's 21 takes since 10 PM: blocks 2 gold (11:01 PM short into 4050 - a win; 2:16 AM long into 4070 - a loss), about even at $5. Every other book, wall, size, exit and money rail unchanged.
- Files: src/lib/desk/bandlock.ts (+15/-8), src/lib/desk/kalshi-live.server.ts (+1/-1)

## 78. BESTIE FLOOR 1 6X (fix788, R459)
- When: 2026-11-06 03:57:09 -0800
- Commit: [98c0e2bf](https://github.com/liluvdied/Aurelius/commit/98c0e2bf10a976c9362e1aa69902ec2a7795c4f0)
- Her words: Love Nov 6 2026 ~2:38 AM PT: "i want to raise the floor to 1.6 , if she misses that i want her to trade the next band too pls" (this command = the 1.6x floor; the next-band part is its own command)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix788 BESTIE'S FLOOR 1.6x: live BESTIE's Kalshi orders must pay 1.6x or more on the limit price (62.5c or under); the send refuses anything over that (her copier keeps trying while the window is open, as every floor refusal does - if the ask comes back under 62.5c she still takes it). Every other book keeps its 1.5x. Done with live-switch bookFloor788 {"bestie": 1.6} read at the send's floor check (only ever raises a floor). Run after CHANGE-129. Tonight: none of her BEST takes asked over 62.5c at her decision (highest 62c), so the replay skips none; the 2:01 AM BTC retry that reached a 64c limit would have waited at 62.5c. The 'trade the next band' part is not in this command.
- Files: src/lib/desk/kalshi-live.server.ts (+3/-2)

## 79. BESTIE ADD ONS ON (fix790, R460)
- When: 2026-11-06 04:01:01 -0800
- Commit: [b198440a](https://github.com/liluvdied/Aurelius/commit/b198440a8fc5e13cba71b1fd4dc5b5b76ff7853a)
- Her words: Love Nov 6 2026 ~2:22 AM PT: "and she didn't do her add on bb" + ~3:26 AM PT: "and she is still not doing her add ons bb" + ~3:29 AM PT: "yes love just the add ons i have in the toggle whatever ones i have selected there okay :)"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix790 BESTIE'S ADD-ONS ON: her switch file data/v111-2-live.json addOns true (it shipped false with fix775 'off until you turn it on'). engine.ts's fix775 gate then stands down and your Add-on boxes apply to BESTIE's live positions exactly like every other book: exactly the add-on toggles you have selected in Settings, read live (right now: Add-on 1 $2 when her side's ask is 35.7c or under, 2+ min left; Add-on 2 (3.8x) $3 at 26.3c or under) - change a toggle and it applies to her too; no copy, nothing extra. The fix775 proof now expects her switch on. Add-on fills sit in the same Kalshi position, so they sell with it on the 75% / 95% exit (fix782) and count in the -$100 day stop like every live trade. No code changed. false turns them off again.
- Files: -

## 80. BESTIE NEXT VALID SETUP (fix789, R461)
- When: 2026-11-06 04:03:31 -0800
- Commit: [cb52ad1e](https://github.com/liluvdied/Aurelius/commit/cb52ad1edfa93efd8d6a31af60813da04a2bdf5d)
- Her words: Love Nov 6 2026 ~2:38 AM PT: "i want to raise the floor to 1.6 , if she misses that i want her to trade the next band too pls" + ~3:18 AM PT: "yes let's have her be able to make any valid one of her set ups" (the 1.6x floor is CHANGE-130)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix789 BESTIE TAKES THE NEXT VALID SET UP: for BESTIE only, a window stays open to her whenever V.111 - 2's take there did not become BESTIE's - (a) its ask was over her floor (live-switch bookFloor788.bestie, CHANGE-130 = 1.6x / 62.5c; without it 1.5x), (b) it was not on her list (e.g. the 'Open' reads), or (c) the live copier refused / skipped her row for any other gate (data/live-book-done.json). V.111 - 2's same brain keeps reading that window (minutes 1-14, once a minute) for BESTIE only; the first read on her list (the same live list check: bar, skip-if-WORST) with an ask at or under her floor is BESTIE's take, and it goes through every live gate like any of hers ($10 level, floor, umpire, stop...). If that take is itself refused at the wire, the window re-arms. Still one ticket a window (the copier's lock), no flips, either side. V.111 - 2's own paper book is unchanged (one take a window). Replay of tonight since 10 PM (her list now, asks from the bid paths, $5, her take-profit): it would have ADDED about 23 takes, 20 settled: 6 W / 14 L, about -$20.37. Every rail, size, exit and other book unchanged.
- Files: src/lib/desk/v1112.ts (+2/-0), src/lib/desk/v1112best.ts (+1/-1), src/lib/desk/v1112fb.ts (+79/-0)

## 81. BESTIE THIRDS 33 (fix791, R462)
- When: 2026-11-06 04:06:12 -0800
- Commit: [4ec39ca0](https://github.com/liluvdied/Aurelius/commit/4ec39ca0bba28768086b2e2f261437a1124dda0d)
- Her words: Love Nov 6 2026 ~3:26 AM PT, her card pick "Both guards" (after "hun she just shorted btc in the bottom of the channel"), guard 1 = her thirds - R141 (Oct 29 2026): "her 33% NEVER leaves under any circumstances" / R206: "a hard 33% for the thirds on EVERY Kalshi book"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix791 BESTIE'S THIRDS (her 33%): live BESTIE gets main's THE WALL at the send - bandlock.ts thirdWallAbsolute, the same function every book's wall runs: no long in the top 33% / no short in the bottom 33% of the session-band channel (band to band as drawn, her channelPct / channelPctTop from live-switch; a band broken her way by her break distance is not a barrier). Done with live-switch thirdsBooks791 = ["bestie"] read in the live-today send branch. Replay of her 25 settled takes since 10 PM: blocks 7 (5 W) - -$11.00 vs taking them. With CHANGE-131 a blocked take lets her look for the next valid set up that window. Every other book unchanged.
- Files: src/lib/desk/kalshi-live.server.ts (+1/-1)

## 82. BESTIE PINK ZONE 55 (fix792, R463)
- When: 2026-11-06 04:09:12 -0800
- Commit: [b96def0d](https://github.com/liluvdied/Aurelius/commit/b96def0da50d8089d73859607f6c968a82ef54ea)
- Her words: Love Nov 6 2026 ~3:26 AM PT, her card pick "Both guards" (after "hun she just shorted btc in the bottom of the channel"), guard 2 = pink-to-green / pink-to-red 55% (fix594)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix792 BESTIE'S PINK-TO-ZONE 55%: live BESTIE gets main's zone check at the send - bandlock.ts zoneSend594, the same function main and REJECTION's last line runs: no short in the bottom 55% from the pink down to the green zone, no long in the top 55% from the pink up to the red zone, no trade past the red / green boundary, and her Bollinger fade-past-the-zone block (fix711) that lives in the same check. Done with live-switch zoneBooks792 = ["bestie"] in the live-today send branch. Replay of her 25 settled takes since 10 PM: blocks 6 (4 W) - -$12.75 vs taking them (incl. the 3:16 AM BTC short). Every other book unchanged.
- Files: src/lib/desk/kalshi-live.server.ts (+1/-1)

## 83. BESTIE SESSION SLIDING SCALE (fix793, R464)
- When: 2026-11-06 04:51:02 -0800
- Commit: [dd98639a](https://github.com/liluvdied/Aurelius/commit/dd98639a4823e6b307b523e6b1b63d9acb2869fb)
- Her words: Love Nov 6 2026 ~3:26 AM PT: "the same sliding scale for the session bands bb :))" + "as main and rej"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix793 BESTIE'S SESSION-BAND SLIDING SCALE (as main and rej): live BESTIE gets main's SESSION BAND AT THE SEND - bandlock.ts sessionBandSend593 with her sliding scale sessionScale593 (fix593): no long into an unbroken session band above / short into one below within BTC $25 when the channel is under $100, 33% of the channel to $500, 20% over $500; gold 33% at a $10 channel sliding to 20% at $20 (20% over). Done with live-switch scaleBooks793 = ["bestie"] in the live-today send branch. Replay of her 25 settled takes since 10 PM: blocks 7 (5 W) - -$11.00 vs taking them. Every other book unchanged.
- Files: src/lib/desk/kalshi-live.server.ts (+1/-1)

## 84. MAIN AND REJ BACK LIVE (fix796, R465)
- When: 2026-11-06 05:33:58 -0800
- Commit: [05b0eabb](https://github.com/liluvdied/Aurelius/commit/05b0eabbe6625700a2b178e2fb55559168d75828)
- Her words: Love Nov 6 2026 ~5:20 AM PT: "dude our main and rejection on pls i can't do this anymore"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix796 MAIN + REJECTION BACK LIVE: data/live-today.json on -> false (nothing else in it changes), so the live lineup goes back to her main lineup in live-switch liveBook - MAIN / TOGETHER (recon-tog), REJECTION (recon-rej) and the DELAYED book (recon-dly) that rides with them - exactly the way they ran before the live-today lineup (fix717 onward). BESTIE leaves live; V.111 - 2 and all her paper twins keep scoring. Kept: every money rail (umpire, day stop, halt, LIVE, sizes, floor, one per window, no flips), the 75% / 95% exit for main + REJECTION (fix782), and every other installed fix. Turning live-today on again puts BESTIE back. No code changed; the fix775 proof also accepts live-today off.
- Files: -

## 85. BESTIE OWN BEST SETUPS (fix797, R466)
- When: 2026-11-06 05:46:18 -0800
- Commit: [183f3d27](https://github.com/liluvdied/Aurelius/commit/183f3d27a5edf2070be8399090829dc92f165463)
- Her words: Love Nov 6 2026 ~5:20 AM PT: "why are the winning set ups doing this badly ?????" + ~5:21 AM PT: "and yes obviously bb, bestie needs to take her own best set ups. that's what i asked for i didn't realize you didn't , can we try that now pls?"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix797 BESTIE TAKES HER OWN BEST SET UPS: BESTIE's list is built ONLY from V.111 - 2's OWN settled trades (her own rows, scored under her take-profit - the 'V.111 - 2 · ...' STATS rows), one box by set up label, with the same bar (more than 10 trades, over 65% won) and skip-if-WORST ($ under 0 = off). The STATS boxes she was matching (main's tap-rejects on session bands under the same names) are no longer read. Switch: her file data/v111-2-live.json ownRows797 true (false = back to the STATS boxes). Today NO set up of hers clears the bar yet (closest: Tap-reject at -1.5σ 6/10, 60% - 1 trade short and under 65%), so BESTIE takes nothing until one does. Run after CHANGE-137 (BESTIE is paper while main + REJECTION are live).
- Files: src/lib/desk/v1112best.ts (+11/-1)

## 86. V111 2 LDC FADE PAPER (fix794, R467)
- When: 2026-11-06 06:26:58 -0800
- Commit: [197a0ee1](https://github.com/liluvdied/Aurelius/commit/197a0ee114aa2604811e6cbb36dc9958bd3966d1)
- Her words: Love Nov 6 2026 ~3:53 AM PT: "instead of doing no shorts over vwap like the og model did , i didn't even know it did that it wasn't supposed to be hehe / but instead of no shorts when price is over vwap , can you look into shorting when LDC ribbon is green? / and longing when it's red? / it kind of uses the ldc at a band too ... cannnn you incorporate thattt into a strategy too bb ?? on its own book / whichever configuration of those elements that tests best"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix794 V.111 - 2 · LDC FADE · PAPER: the winner of data/reports/ldc-study-nov6.md (Nov 1-6 replay, 11 configurations: 204 trades, 50.5%, +$68 at $5; V.111 - 2 as is -$171). V.111 - 2's take of each window is kept only when the 1m LDC fades it - a SHORT only while the 1m LDC is GREEN (buy state), a LONG only while it is RED - else no trade that window; $5 at her real ask; the live exit on paper (half at 75% of the way to $1, rest at 95%, else the bell), settled from Kalshi; own file data/v111-2-ldc-794.json, fill-log venue paper-v111-2-ldc, its card in RUNNING. LDC = a rebuild of TradingView's Lorentzian Classification (published defaults) on the desk's own closed 1m bars - her TV settings may differ. Also writes the LDC colour on every V.111 - 2 take (row ldc794; BESTIE's live rows are those rows) and to data/ldc-colour-794.jsonl. PAPER ONLY - no live book, wall, size or exit changes; V.111 - 2's own trades unchanged. The fix770 proof counts this book's fill-log row apart like the inverse book's.
- Files: src/components/desk/app.tsx (+4/-3), src/lib/desk/paperrows.ts (+2/-1), src/lib/desk/v1112.ts (+3/-0), src/lib/desk/v1112ldc.ts (+99/-0)

## 87. BESTIE INVERSE PAPER (fix795, R468)
- When: 2026-11-06 06:29:28 -0800
- Commit: [09712cd5](https://github.com/liluvdied/Aurelius/commit/09712cd532d41ebc567fc03a47de159a5e29b808)
- Her words: Love Nov 6 2026 ~5:14 AM PT: "pls make an inverse of the book running if it's at 33% that is supposed to be the other way around bb" + ~5:34 AM PT: "pls have all of her inverse books scoring on set ups too and the twins and whatever pls so we can stack some up"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix795 BESTIE · INVERSE · PAPER: every window BESTIE actually filled on Kalshi (live-book-done her ':bestie:' ticket filled / partial) is taken here on the OTHER side, same window, at that side's real ask the moment the desk sees her fill; $5; one per window; the live exit on paper (half at 75% of the way, the rest at 95%, else the bell); settled from Kalshi; own file data/bestie-inv-795.json, fill-log venue paper-bestie-inv with her set up on every row ('BESTIE · INVERSE · <her set up>') so it scores by set up in STATS like V.111 - 2's own rows, card in RUNNING. Replay: her 7 live fills 2:01-5:15 AM -> 7 of 7 won, +$16.76 at $5 (BESTIE live 2 W / 5 L, -$35.89); every BEST take since 10 PM (one per window, 37): 23 W, -$1.37. PAPER ONLY - nothing live changes. Run after CHANGE-135.
- Files: src/components/desk/app.tsx (+4/-3), src/lib/desk/paperrows.ts (+2/-1), src/lib/desk/v1112.ts (+2/-0), src/lib/desk/v1112binv.ts (+63/-0)

## 88. HER ZONE WICK REJECTIONS PAPER (fix798, R469)
- When: 2026-11-06 07:22:48 -0800
- Commit: [93a71617](https://github.com/liluvdied/Aurelius/commit/93a7161715f6bf7c63c36b99e47ce7f7f6632220)
- Her words: Love Nov 6 2026 ~5:17 AM PT: "and pls have her register green zone rejections and red zone rejections to enter in when the rejections there pls / a rick rejections of $50 or more on btc $1 for gold"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix798 HER ZONE WICK REJECTIONS (paper set up in V.111 - 2's family): in a window, a closed 1m bar's low reached the GREEN zone (the desk's 5m S1) and price is now $50 (BTC) / $1 (gold) or more back up off that wick low = LONG; the mirror off the RED zone (5m R1) = SHORT. Minutes 1-14, once a minute, one per window, $20 paper at the real ask, scored like V.111 - 2 (her take-profit), settled from Kalshi, fill-log pattern 'V.111 - 2 · Green / Red zone wick rejection' (scores in STATS). These rows count in her own-rows list (fix797) and are decided on it the second they're taken, so the set up can earn its way onto BESTIE's list (more than 10 trades, over 65%, never WORST). Main / REJECTION's BTC 15% zone wick is unchanged. Replay Nov 1-6 ($5 scale, boards from the desk's own snapshots): BTC 63 trades 31 W +$32 (red-zone shorts +$75, green-zone longs -$43); gold 81 trades 36 W -$34. Paper only.
- Files: src/lib/desk/v1112.ts (+2/-0), src/lib/desk/v1112best.ts (+2/-2), src/lib/desk/v1112zone.ts (+74/-0)

## 89. BESTIE KALSHI TARGET GAP (fix799, R470)
- When: 2026-11-06 07:25:22 -0800
- Commit: [b396f361](https://github.com/liluvdied/Aurelius/commit/b396f3614ff371571cbfcf174a0c49f86f8220a3)
- Her words: Love Nov 6 2026 ~5:18 AM PT: "hun she is supposed to have the price difference on kalshi deducted from tradingview's price"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix799 KALSHI'S TARGET IN HER CHART'S TERMS FOR BESTIE: a take of hers that is on her list is still refused when it would have to cross an unbroken band to reach the window's target - main's own check, same code: bandlock.ts targetNow (Kalshi's strike moved onto her chart by the window-open offset, fix519 / fix530; gold = her chart's window open), wallLines / refreshBroken / wallFor and crossToTarget ('no band between price and the target'). Can't verify = refused, like main. Switch: her file data/v111-2-live.json targetGap799 true. Replay of her takes 10 PM - 5:18 AM (boards saved at each take): blocks 14 - 10 W / 4 L, +$26.87 at $5 of winners lost; kept 26 - 9 W, -$34.41. Paper (BESTIE is paper). Run after CHANGE-139.
- Files: src/lib/desk/v1112best.ts (+16/-1)

## 90. SHORTS DURING PINK SLIDE (fix800, R471)
- When: 2026-11-06 08:25:27 -0800
- Commit: [8d14a8d5](https://github.com/liluvdied/Aurelius/commit/8d14a8d554adfac61e3b781a59634c00d0877ced)
- Her words: Love Nov 6 2026 ~6:34 AM PT: "it flipped both ways on both assets she skipped everything" + her card pick ~6:35 AM PT: "Shorts allowed during pink slide"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix800 SHORTS DURING THE PINK SLIDE: while main / REJECTION's SLIDE UNDER PINK hold is on for an asset (no longs), a SHORT is no longer refused by the pink-to-green share (fix594's 55%, the BTC fix323 share, gold's PINK TO GREEN); mirror, because the hold exists both ways: while CLIMB OVER PINK is on (no shorts), a LONG is no longer refused by the pink-to-red share. Everything else still judges (past the green / red boundary, thirds, her flip, pink cushion, the money rails). Every book but the delayed one. Reads the engine's own hold states (and the sub-auditor now gets them with each board, so he judges the 55% the same way); live-switch slideFree800 false turns it off. Replay (refusal ledger Nov 5 6 AM -> now): 6 slide windows had a refused pink-to-green short, 4 priceable: 3 W / 1 L, +$5.21 at $5. It does NOT make her enter at the pink tap itself - her flip still waits there (the 'enter at pink, no flip' rule is its own command).
- Files: src/components/desk/app.tsx (+4/-3), src/components/desk/settings-drawer.tsx (+20/-4), src/lib/desk/bandlock.ts (+57/-13), src/lib/desk/engine.ts (+72/-48), src/lib/desk/fns.ts (+2/-2), src/lib/desk/grokog.ts (+3/-2), src/lib/desk/paperrows.ts (+2/-1), src/lib/desk/pinkslide801.ts (+104/-0), tools/sub-auditor.cjs (+1/-1)

## 91. PINK SLIDE TAP (fix801, R472)
- When: 2026-11-06 08:27:38 -0800
- Commit: [0ae9edaa](https://github.com/liluvdied/Aurelius/commit/0ae9edaa0051daf58e1c17cacf016d9660b29028)
- Her words: Love Nov 6 2026 ~6:40 AM PT: "and yes , on pink slides she waits for it to come to pink and reject. no flip necessary on pink slides just get in at the best multiple she can. those are our strongest set up by far"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix801 THE PINK SLIDE TAP: while main / REJECTION's SLIDE UNDER PINK hold is on for an asset, the moment price comes back up to the pink (within 5% of the channel) and turns back down (7.5% of the channel off it, never through) she SHORTS at that second's real ask - no flip candle. Mirror while CLIMB OVER PINK is on: down to the pink and back up = the LONG. Best multiple: the first ask at or over her 1.5x floor from the rejection on, only while price is still at the pink (within 25% of the channel) and at most 90 s after it. For that take her walls waive only what her 15% wick rejection already waives (flip, candle colour, thirds) plus the pink cushion; the 55% is already free in the slide (fix800). Money rails, floor, $10 level, past-the-zone, umpire, one ticket per window and the 75/95 exit unchanged. Main + rejection (every live book but delayed). live-switch pinkSlideTap801 false = off. Every take is also recorded at $5 in data/pink-slide-801.json (read by fix802's card).
- Files: -

## 92. PINK SLIDE ONLY PAPER (fix802, R473)
- When: 2026-11-06 08:29:45 -0800
- Commit: [2d3ce67c](https://github.com/liluvdied/Aurelius/commit/2d3ce67c89d1ba6d2721d38eb584201090077a4d)
- Her words: Love Nov 6 2026 ~6:42 AM PT: "we could literally take nothing but pink slides and it would prolly be our most successful book lol"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix802 PINK SLIDE ONLY (paper): her own card for nothing but her pink-slide take (fix801's record, data/pink-slide-801.json) - BTC + gold, one per window, $5 at the real ask, her live exit (half at 75% / rest at 95% of the way), settled from Kalshi; in RUNNING, scored by set up in STATS. Display only - the copier never reads the card. Needs CHANGE-142 (fix801) in first.
- Files: -

## 93. ADD ON 2 BOX (fix803, R474)
- When: 2026-11-06 08:31:54 -0800
- Commit: [8807deb2](https://github.com/liluvdied/Aurelius/commit/8807deb213e5e8739f04cb05ab97384e0f134edb)
- Her words: Love Nov 6 2026 ~7:09 AM PT: "as for the second add on toggle , pls change it to another type-box i can put in the multiple i want and the dollar amount for it instead of the hard 3.8x pls"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix803 HER ADD-ON 2 BOX: Add-on 2 (after Add-on 1 has filled) gets a multiple box (1.5x-10x) next to its $ box, in place of the fixed 3.8x. It starts at 3.8x / your current $, so nothing changes until you type. The engine reads both live (at38 cap = 1 / your multiple). Its on/off toggle, the $5 add-on cap, once per position and every other add-on gate are unchanged.
- Files: -

## 94. STALL TRACE LOG ONLY (fix804, R475)
- When: 2026-11-06 08:34:06 -0800
- Commit: [4f233570](https://github.com/liluvdied/Aurelius/commit/4f233570adf4e0adb67f75edcbccb9ea2270565b)
- Her words: Love Nov 6 2026 ~7:09 AM PT: "babe she's notttt doing her add ons btc was just at 11x and didn't enter anything past $5"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix804 THE STALL TRACE - LOG ONLY: her position loop (take-profits + add-ons) went silent 7:00:29 -> 7:06:28 AM PT while her tick sat busy, so the 2.8x add-on waited until 9c. Every await in her tick and position loop now names its step; every 5 s, if her tick has been busy 20 s or more, one line goes to data/tick-stall-804.jsonl with the step it is stuck on. Writes that file only - no order, wall, size, switch or timing changes. Once it catches the stuck step, the real fix is its own command.
- Files: -

## 95. SLIDE RELEASE EVERY SECOND (fix806, R476)
- When: 2026-11-06 08:36:23 -0800
- Commit: [f9cbf77f](https://github.com/liluvdied/Aurelius/commit/f9cbf77f6093b6662822905399131a97c5ad3c23)
- Her words: Love Nov 6 2026 ~7:26 AM PT, her card pick: "Yes, check it every second" (to: the slide is only released when a call comes in, on that moment's price - check every active slide each second and end it the moment price breaks back through pink by 10% of the channel)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix806 HER SLIDE ENDS THE SECOND IT BREAKS: every second, each active SLIDE UNDER PINK / CLIMB OVER PINK hold is checked with her same release rule (price through the pink by 10% of the channel; her old $8 / 25c slide and $2 / 25c climb break when the channel can't be read) and ends the moment it breaks - before, it was only checked when a main / REJ call came in, on that moment's price, so a break between calls never ended it (about 7% of 'still on' holds in the last 24 h). The on-rule is untouched; the holds only apply to main + REJ (never delayed). Each release is logged to data/slide-release-806.jsonl. live-switch slideRelease806 false = off.
- Files: -

## 96. BTC PUSH 50 OFF THE WICK (fix807, R477)
- When: 2026-11-06 08:38:43 -0800
- Commit: [912b662e](https://github.com/liluvdied/Aurelius/commit/912b662efee2a2284ab70f64029683e2493055fb)
- Her words: Love Nov 6 2026 ~7:33 AM PT: "wait hun i DONT want it past the candle open , i just want it to be a push off of the band that distance" + ~7:30 AM: "$50 for btc bb" + her cards ~7:35-7:36 AM PT: "Push + 2m candle in her colour" and "BTC $50 off the wick" + ~7:51 AM PT: "let's keep the push requirement 10c on pink trades bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix807 HER BTC PUSH $50 OFF THE WICK: on BTC her entry off a BAND or ZONE is a $50 push in the direction of the trade, measured from the wick (this 5m candle's high for a short / low for a long at the band she rejected), with her live 2m candle her colour - replacing the candle-past-its-open flip (10c / $2) for BTC. Every book but delayed (delayed keeps its flips and $6). Gold unchanged. Replay Nov 2-6, main + REJ, $10, 75/95: 86% of calls kept, 48% hit, +$486 (+$198 without the 3 best / 3 worst) vs today +$333 (+$54); average multiple 2.38x vs 2.46x. One week of data. Her pink-slide tap and 15% wick rejection keep their own entries. live-switch push807 false = off. PINK TRADES (off / through the 5m PP, including her pink-slide tap) keep her small push: BTC $6 push or her $2 flip, gold 10c (her 7:51 AM words).
- Files: -

## 97. SETTINGS SHEET FITS SCREEN (fix808, R478)
- When: 2026-11-06 08:41:00 -0800
- Commit: [650a2464](https://github.com/liluvdied/Aurelius/commit/650a2464a7bcfbf6d9484d9fe956ca0afa2b7aec)
- Her words: Love Nov 6 2026 ~7:45 AM PT: "every time i pull up the settings tab with the add on toggles the lil handle tab to pull the page down goes too far up and disappears out of frame so i can't exit the page"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix808 THE SETTINGS SHEET FITS HER SCREEN (display only): the settings sheet had no height limit, so with the add-on rows it grew taller than her phone and its pull-down handle went off the top. Now it is capped at her screen height (inside the safe area), the handle and a new close X stay pinned at the top, and the rows scroll inside. Tapping outside still closes it. No trading code.
- Files: -

## 98. PINK SLIDE TAP BTC ONLY (fix810, R479)
- When: 2026-11-06 09:19:42 -0800
- Commit: [9c70f104](https://github.com/liluvdied/Aurelius/commit/9c70f104df8db21119bca8822c8cee444684ee59)
- Her words: Love Nov 6 2026 ~8:21 AM PT, her pick: "no flip on btc , flip on gold pls :)"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix810 PINK SLIDE TAP, BTC ONLY: her pink-slide tap entry (fix801 - at the pink rejection, no flip) stays on for BTC and is OFF for gold - gold keeps her flip on slides. Gold's slide taps are still recorded on her PINK SLIDE ONLY paper card (never live).
- Files: src/components/desk/app.tsx (+21/-2), src/components/desk/journal.tsx (+1/-0), src/components/desk/setup-scores.tsx (+5/-1), src/components/desk/stats-rungs.tsx (+13/-4), src/lib/desk/bandlock.ts (+32/-10), src/lib/desk/engine.ts (+2/-0), src/lib/desk/fns.ts (+10/-0), src/lib/desk/liveauto815.ts (+53/-0), src/lib/desk/pinkslide801.ts (+2/-0), tools/behaviour-umpire.cjs (+24/-14)

## 99. TINY CHANNEL GOLD (fix811, R480)
- When: 2026-11-06 09:21:56 -0800
- Commit: [55bdf8f4](https://github.com/liluvdied/Aurelius/commit/55bdf8f4f7ab23751c73dedb6151bdd68bf3e24c)
- Her words: Love Nov 6 2026 ~8:16 AM PT: "yes on the tiny channel bb" + ~8:22 AM PT: "no if the asks are expensive and they're into a red with only a 65% hit rate don't do it  just gold bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix811 THE TINY CHANNEL, GOLD: her PINK TO RED / PINK TO GREEN 55% (fix594 and its gold twins) steps aside when the gap from the pink to the zone on that side is under $5 on GOLD; BTC keeps the full 55%. Every book but delayed; past the zone, cushion, thirds, flip and money rails still judge. Replay Nov 5 6 AM - Nov 6 8 AM: gold 27 extra trades, 78% hit, +$173 at $10 (+$116 trimmed). Today's 8:00:04 gold long ($4.23 gap) goes. The behaviour umpire's BTC 55% board is now $200 wide, plus gold tiny-channel and BTC-still-refused checks. live-switch tinyChannel809 false = off.
- Files: -

## 100. BTC PUSH BAND TRADES ONLY (fix812, R481)
- When: 2026-11-06 09:24:09 -0800
- Commit: [557bf8fc](https://github.com/liluvdied/Aurelius/commit/557bf8fca3787d255c2aafe0416c1e14e0941c3f)
- Her words: Love Nov 6 2026 ~8:30 AM PT: "babe btc wicked 15% she didn't enter short" (the 8:30:04 'Candle falling from the top third' short was held by the $50 push meant only for band trades)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix812 THE BTC $50 PUSH IS FOR BAND TRADES ONLY: fix807's $50 wick push now applies only to BTC band / zone REJECTIONS (her rejection labels off a session band, zone, Bollinger or R/S line). Every other setup (thirds candles, launches, breaks) goes back to her normal flip ($2 candle flip / $6 push). Pink trades keep her small push. At 8:30:04 the 'Candle falling from the top third' short was wrongly held by the $50 push.
- Files: -

## 101. PINK WALL SHORTS MIRROR (fix813, R482)
- When: 2026-11-06 09:26:23 -0800
- Commit: [51ae2f86](https://github.com/liluvdied/Aurelius/commit/51ae2f8683476095770f59f225abab82db6f06bb)
- Her words: Love Nov 6 2026 ~8:35 AM PT: "can you fix the pink wall outside of her tolerance babe? that slipped back in somehow solve for that permanently pls" + her card ~8:37 AM PT: A - mirror her Nov 3 7:20 PM rule ("The block stays only inside the pink tolerance. Outside that tolerance the long is free.") to shorts
- Before: (the code as it was in the previous entry - see the diff)
- After: fix813 THE PINK WALL MIRROR: SESSION BAND AHEAD OF THE PINK (fix618) now frees a SHORT outside her pink tolerance (20% of the channel on BTC, her per-asset pinkSlide580), exactly as it frees the long since Nov 3 - it had only ever been built for longs. BTC's stacked scale (33% at that width) is unchanged. Every book but delayed. Today's 8:31:01 BTC wick short ($81 over pink, past her $53) goes. PERMANENT: the behaviour umpire now fails NOT SAFE if longs and shorts ever diverge on this wall (mirrored boards) or if her BTC pink tolerance widens; the old short-side tests now sit inside her tolerance.
- Files: -

## 102. STATS MAIN AND REJ SETUPS (fix814, R483)
- When: 2026-11-06 09:28:34 -0800
- Commit: [f514d901](https://github.com/liluvdied/Aurelius/commit/f514d90113e1afc408d98544cdecb188d919d39a)
- Her words: Love Nov 6 2026 ~8:37 AM PT: "the stats changed to only V.111  i still want our main & rej set ups being tracked at each band and each zone" + ~8:42 AM PT: "i want the regular session bands and other zones to be formatted the way the other tallies are if we can pls it looks amazing the way you have the others" + "can you add a sorter here too bb ?? by hit rate and $$"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix814 STATS KEEPS MAIN + REJ (display only): her main + REJ set ups at every band and zone (HER BOOKS · SETUP x RUNG, still recorded underneath - 4,222 trades) now sit FIRST on STATS as tally cards (formatted like SET UP SCORES) with a TRADES / HIT RATE / $$ sorter, opening on MAIN with REJECTION one tap away; the V.111 family's paper rows (which share the fill log and had filled the BEST / WORST lists) stay out of those lists - they are scored in SET UP SCORES. BESTIE's own-setup picking is untouched. Its test is a permanent proof (fails if STATS ever drops main / REJ). SET UP SCORES gets the same HIT RATE / $$ sorter.
- Files: -

## 103. LIVE BACK ON BEFORE THE WINDOW (fix815, R484)
- When: 2026-11-06 09:31:41 -0800
- Commit: [96bde2e9](https://github.com/liluvdied/Aurelius/commit/96bde2e98e719a0dd8525be4e5763e4c17f9b714)
- Her words: Love Nov 6 2026 ~8:46 AM PT: "can you have it post a toast after 3 minutes if it's off ? and a flashing orange light  and have it set to turn itself back on before the window starts if i turned it off to do commands pls lol  if i'm not doing commands i never turned it off on purpose lol"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix815 LIVE COMES BACK BEFORE THE WINDOW: (1) LIVE off 3+ minutes = a flashing orange light by the LIVE switch and a toast every 3 minutes (with why it's still off). (2) 15 s before each 15-minute window, if LIVE is off it turns itself back on through her own LIVE-on path (writeSwitch + liveBook.since - no rail, seal or size touched) ONLY when no CHANGE / RUN-ALL install is running, the umpire is SAFE, entries aren't halted and OFF TODAY isn't set; otherwise it stays off and says why. Every try logged to data/live-auto-on-815.jsonl. (3) OFF TODAY button next to LIVE (shows while LIVE is off) = her deliberate stop until midnight PT; tap again to clear. live-switch autoLive815 false = off.
- Files: -

## 104. TWINS SCORE SET UPS FAMILIES (fix816, R485)
- When: 2026-11-06 09:33:54 -0800
- Commit: [f473b570](https://github.com/liluvdied/Aurelius/commit/f473b570773e61140ff6f681157630f9ef33a659)
- Her words: Love Nov 6 2026 ~8:55 AM PT: "and can you have all of our revised main rej and no pink books logging set ups too ? the dataset will build quicker and we'll know by midnight which ones we cut and which ones we keep"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix816 HER TWINS SCORE THEIR SET UPS (logging / display only): SET UP SCORES now also scores MAIN · W/O PINK (recon-rnp), MAIN · TOGETHER NO PINK (recon-togp), MAIN · ZONE WALL TWIN (recon-tzw), MAIN · VWAP SIDE (main-vwap-694), REJ · TOGETHER REJECTIONS ONLY (recon-togr) and REJECTION · PARKED SIDE (rej-parked-695), alongside REJ ONLY · NO PINK, REJECTION · THIRDS AS READ and PINK SLIDE ONLY - each its own pill - plus two pooled pills: MAIN FAMILY (main + its 4 twins) and REJ FAMILY (rejection + its 4 twins), the same set up label counted across the family so the counts grow faster. V.111 books are never in a family. Their history is read in once from the paper archive (last 8 days) so the families fill today. No trading code.
- Files: -

## 105. STATS PAY PER TRADE EDGE (fix818, R486)
- When: 2026-11-06 09:45:45 -0800
- Commit: [0f81bf2e](https://github.com/liluvdied/Aurelius/commit/0f81bf2e2d5a6461e0fbc2b72ca45fb1e44d6c4d)
- Her words: Love Nov 6 2026 ~9:33 AM PT: "maybe we should be sorting it by ones that are highest paying after all lol a 30% hit rate on one that pays 20x is worth it lol we need to be calculating in how we approach it"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix818 STATS PAYS PER TRADE (display / scoring only): STATS' band / zone cards and SET UP SCORES now show $ / trade and EDGE (hit % minus the average price paid) on every set up, with $ / TRADE and EDGE sort buttons next to TRADES / HIT RATE / $$. The CUT tag is now 30+ trades AND losing money per trade (was 5+ trades and lost more than it won), so a 30% set up that pays 10-20x is never tagged CUT. Each trade's ask is read in once from the paper history. Nothing is cut from trading.
- Files: src/components/desk/setup-scores.tsx (+5/-4), src/components/desk/stats-rungs.tsx (+3/-3)

## 106. WEEK REPLAY CLOCK (fix823, R487)
- When: 2026-11-06 12:02:41 -0800
- Commit: [9a346938](https://github.com/liluvdied/Aurelius/commit/9a34693819a61a189435c64b545b5c48551fa939)
- Her words: Love Nov 6 2026 ~11:00 AM PT: "yes to the replay" (her yes to the week-replay clock fix: the fix521 proof aged out of its 7-day window at 10:51 AM PT)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix823 WEEK REPLAY CLOCK (test only, no rule changes): the fix521 week-replay proof re-judges the last 7 days of fills and MUST find the Oct 30 18:51Z BTC violation long BLOCKED; at 18:51Z Nov 6 that trade aged out of the window, so the proof failed and the umpire would stamp NOT SAFE. Her Oct 30 violation trades are now pinned into the replay so it can never age out; the 7-day window and every rule are unchanged.
- Files: src/components/desk/app.tsx (+6/-0), src/components/desk/factor-scores.tsx (+40/-0), src/components/desk/setup-scores.tsx (+6/-1), src/lib/desk/away824.ts (+79/-0), src/lib/desk/bandlock.ts (+53/-0), src/lib/desk/engine.ts (+11/-3), src/lib/desk/flip819.ts (+82/-0), src/lib/desk/fns.ts (+7/-0), src/lib/desk/grokog.ts (+4/-2), src/lib/desk/invworst820.ts (+54/-0), src/lib/desk/kalshi-live.server.ts (+2/-0), src/lib/desk/paperrows.ts (+6/-2)

## 107. CUT AND FLIP UNDER 30 (fix819, R488)
- When: 2026-11-06 12:05:08 -0800
- Commit: [cf633c8e](https://github.com/liluvdied/Aurelius/commit/cf633c8e32796e9fb5be9ba23fdcd73058555d8a)
- Her words: Love Nov 6 2026 ~9:52 AM PT: "how many trades would it skip day to day bb ? if we cut anything under 30% ? as for any of the set ups we currently have her taking that have a hit rate under 30% and don't pay over 2.2x can get cut & flipped right now, but only do the flip if it's still above her 1.5 floor bb" + her 30-trade rule (~9:27 AM: "it needs to be at least 30")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix819 CUT + FLIP (idle until a set up qualifies): a main / REJECTION set up (SET UP SCORES' grouping) with 30+ trades of its own in 7 days, under 30% hit and paying 2.2x or less on average is CUT - her live order on it is refused at the last line (after the umpire). In its place she takes the OPPOSITE side that second, only while it still pays her 1.5x floor (66.7c or less); otherwise skipped. The flip is labelled 'FLIP of <set up>', recorded at $5 (data/flip-819.json, scored in SET UP SCORES as FLIPS) and handed to the copier for the same book; its order skips her band walls (her words: bypass band rules if necessary) but keeps the umpire, freshness, one ticket per window and the money rails. Every cut / flip / skip logged to data/cut-flip-819.jsonl; SET UP SCORES shows 'CUT + FLIP NOW' (none today). Delayed untouched. live-switch cutFlip819 false = off. A 30% set up that pays 10x is never cut.
- Files: -

## 108. INVERSE WORST BOOKS (fix820, R489)
- When: 2026-11-06 12:07:35 -0800
- Commit: [0d5562b2](https://github.com/liluvdied/Aurelius/commit/0d5562b20d68639705be39637d0c078e22d71c38)
- Her words: Love Nov 6 2026 ~10:43 AM PT: "and as for the WORST stats over all time , consistent under 40% , 20-30% even better and then create an inverse book on THOSE set ups only for v.111 , and for main rej and no pink pls all individual inverse books and let's create a new subgroup for all of our inverses oki"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix820 THE INVERSE-WORST BOOKS (paper only, never live): MAIN INVERSE-WORST, REJ INVERSE-WORST, NO-PINK INVERSE-WORST and V.111 INVERSE-WORST each watch their family's fresh calls (main = recon-tog; REJ = recon-rej; no pink = recon-rnp / recon-rjnp / recon-togp; V.111 = V.111 - 2) and, when the set up is on that family's WORST list, take the OPPOSITE side that second at the real ask inside her 1.5x floor - $5, her 75/95 exit, settled from Kalshi. WORST list = 30+ trades in 7 days, under 40% hit AND losing money (so a low-hit set up that pays is never inverted), rebuilt with SET UP SCORES every 10 min into data/inverse-worst-820.json. Each book has its own card and SET UP SCORES pill; all inverse books (these + INVERSE BOOK, V.111 INV, BESTIE INVERSE) sit in a new INVERSES pill group.
- Files: -

## 109. TARGET BY A LINE (fix821, R490)
- When: 2026-11-06 12:10:05 -0800
- Commit: [3c582ecb](https://github.com/liluvdied/Aurelius/commit/3c582ecb50905a6502a1da8b12d70a100967754d)
- Her words: Love Nov 6 2026 ~10:43 AM PT: "also , not sure if we still have this rule in place , it's an oldie but a goodie 💞 if target is within $1.50 of a session band , bollinger , or a red, or a green zone ; i want her to take the position that trades away from it"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix821 THE TARGET BY A LINE: when the window's target sits within $1.50 (gold) / $50 (BTC - our scaling; her old record only had gold's $10 levels) of a session band (VWAP or a σ line), a Bollinger (upper / middle / lower) or the red / green zone, an entry that trades INTO that line is refused; trading away from it goes. Judged last in her wall, after every other rule. Every book but delayed; her $10-level rule unchanged. Study (last ~7 days): gold trades INTO such a line hit 16% (-$135), BTC 38% (-$186). live-switch targetLine821 false = off.
- Files: -

## 110. ZONE JUST PAST THE BAND (fix822, R491)
- When: 2026-11-06 12:12:30 -0800
- Commit: [d8f0827e](https://github.com/liluvdied/Aurelius/commit/d8f0827e4c119d13958b3de578cdda1afbbad2ee)
- Her words: Love Nov 6 2026 ~10:43 AM PT: "she just enter btc on the break up the session band with a red zone directly on the other side of it too , can you do some tests on that and let me know if those lose more than they win? when she enters on a break & a green/red zone sits in the bottom/top 10-15% of the band channel she's breaking into on the other side" + her card ~10:52 AM PT: build it live, all books except delayed
- Before: (the code as it was in the previous entry - see the diff)
- After: fix822 THE ZONE JUST PAST THE BAND: no long when the red zone sits ahead of price inside the first 15% of the channel past the session band she is breaking into (band = VWAP or a σ line); mirror: no short with the green zone in the first 15% of the channel below the band she breaks down through. Every book but delayed. Study (Nov 1-6, main + REJ): entries with that zone went 59 trades, 29% hit, -$4.29/trade vs 47%, +$1.62/trade without. live-switch zonePast822 false = off.
- Files: -

## 111. AWAY FROM LINE (fix824, R492)
- When: 2026-11-06 12:14:54 -0800
- Commit: [e3c8454f](https://github.com/liluvdied/Aurelius/commit/e3c8454fe76f3303b389c935391fab70d41912fa)
- Her words: Love Nov 6 2026 ~10:59 AM PT: "yes to the replay. and nonetheless, if a target sits within $1.50 of those i do want her to take the trade the other direction if it is above the floor / beginning of the window oki. and include those in your replay to see how they did compared to ours, if she had entered the other direction at the beginning of the window when it was an option"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix824 AWAY FROM LINE: in the first 5 minutes of each window, when the target sits within $1.50 gold / $50 BTC of a session band (VWAP or a σ line), a Bollinger (upper/middle/lower) or the red/green zone, she takes the side trading AWAY from that line, the first second it applies, only while that side pays her 1.5x floor (ask 66.7c or less). One take per window per asset for main + REJ ($5 each), labelled 'AWAY FROM LINE · <line>' and scored apart in STATS. Her band walls are waived for it (like her flips, fix819); the umpire, freshness, the pink at the wire and every money rail still judge it. Delayed untouched. Replay Oct 30 - Nov 6 ($10, 75/95, before fees): gold 150 trades 60% +$0.87/trade, BTC 183 trades 57% +$0.58/trade; about breakeven on windows with Kalshi's exact strike. live-switch awayLine824 false = off.
- Files: -

## 112. STATS EVERY FACTOR (fix825, R493)
- When: 2026-11-06 12:17:18 -0800
- Commit: [7697e280](https://github.com/liluvdied/Aurelius/commit/7697e280bc15c1195c80f4c4a3d8a8565008b410)
- Her words: Love Nov 6 2026 ~10:43 AM PT: "can you take it a bit further and have her score red/green zone trades at the different band levels too? ... every independent factor ... we simply cut the ones that don't pay"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix825 STATS · EVERY FACTOR (display only): every settled main / REJ trade is matched to the board she saw at the call (setup-audit-in, read incrementally) and scored by each factor on its own - σ spot (which band channel price sat in), set up x σ spot, the line traded, the zone just past the band (fix822), the target by a line (into / away, fix821), her side of the pink, and the hour PT - 7 days / 24 hours, as STATS tally cards with her sorters (hit rate, $$, $/trade, edge) for MAIN, REJECTION and both families. Never touches trading.
- Files: -

## 113. GOLD WIDE CHANNEL 5PCT (fix826, R494)
- When: 2026-11-06 15:37:33 -0800
- Commit: [c4ea009c](https://github.com/liluvdied/Aurelius/commit/c4ea009c1b0547a4564432be3d1015a965500182)
- Her words: Love Nov 6 2026 ~11:55 AM PT: "yes lets keep it 10% bb, but over $30 band widths let's make it 5% , pls bc those do happen on occasion"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix826 GOLD WIDE-CHANNEL RELEASE: her gold slide / climb holds (fix560, and the every-second release fix806 + the copier's own release checks) still release when price breaks through the pink by 10% of the channel - but when gold's channel (the session bands either side of price, the same width the 10% reads) is over $30, 5%. BTC unchanged (10%; its channels are always over $30). Main + REJ, like the holds. Replay Nov 1-6: only 5 held windows had a channel over $30; no change in result (36 trades, 69%, +$37 either way).
- Files: src/lib/desk/bandlock.ts (+23/-3), src/lib/desk/engine.ts (+6/-6)

## 114. GOLD BAND PUSH 15 20 (fix827, R495)
- When: 2026-11-06 15:40:03 -0800
- Commit: [b58f763e](https://github.com/liluvdied/Aurelius/commit/b58f763e7ceb70a49273514d4e0435f5e7e1dd28)
- Her words: Love Nov 6 2026 ~11:55 AM PT: "let's make it 20c when bands are over $10 bb , and $15c under that / just a bittt more of a push than where it's at bc those are barely blips of a push 😹 like i said it's satisfying when she gets in cleanly but it's definitely costing fakies , when a few cents more doesn't change the multiple atttt all and will keep us out of the ones that flip for a millisecond and continue melting" + her card ~12:06 PM PT: band / zone trades only, gold pink trades keep 10c
- Before: (the code as it was in the previous entry - see the diff)
- After: fix827 GOLD BAND PUSH 15c / 20c: gold's push off a session band, Bollinger, zone or R/S line (her band-rejection entry, pushLabel653) is 20c when the band channel (session bands either side of price) is over $10, 15c when it's $10 or under or can't be read. Gold pink trades keep 10c; BTC unchanged; delayed unchanged. Replay Nov 1-6 (gold band / zone rejections, main + REJ): about -$420 at 10c vs -$274 at 15/20c. live-switch goldPush827 false = 10c.
- Files: -

## 115. BTC NO LONGS UNDER PINK (fix828, R496)
- When: 2026-11-06 15:42:34 -0800
- Commit: [12a84987](https://github.com/liluvdied/Aurelius/commit/12a84987e5a7f090165fa410e55976dd3dc9ce1c)
- Her words: Love Nov 6 2026 ~12:46 PM PT: "but yes if it blocks 28 trades that only had a 25% hit rate on them yes 🎯 🎯 🎯" + her card: option 1 (BTC longs only) + ~12:20 PM: "oh definitely don't let those thru bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix828 BTC NO LONGS UNDER THE PINK AGAIN: her fix521 wall comes back for BTC LONGS ONLY - no BTC long under the pink while a running 2-5m candle is red, at any distance - except the bottom 25% of the pink->green channel with her real $5 flip (a colour turn alone no longer counts), her wide-channel clearance, or her 5% reset through the pink. Gold and every short keep her Nov 1 pink-slide rule (fix584) as it is. Every book but delayed. Replay Nov 2-6 (main + REJ): blocks 28 BTC longs that went 25% hit, -$154. live-switch btcLong828 false = off.
- Files: -

## 116. FIND NEW BOOKS (fix829, R497)
- When: 2026-11-06 16:01:40 -0800
- Commit: [f7a3f260](https://github.com/liluvdied/Aurelius/commit/f7a3f26026b1627d50313477f78395d1dd513e78)
- Her words: Love Nov 6 2026 ~2:56 PM PT: "can you make a tab for all of the best performers out of the new ones we've made bb / i can't find any of them when i look for them pls make it easier to find these hun idk what happens when i look i cannot find them anywhere , / and all of our inverse books - can you make a subgroup for those here ? INVERSED"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix829 FIND THE NEW BOOKS (display only): RECORDS gets two pills that look across every family - NEW BEST 🏆 (every book made since Nov 1 - fix 600+ - plus the reconstructed rejection twins, that is green all time) and INVERSED 🔄 (every inverse / flipped book). REJ · TOGETHER REJECTIONS ONLY (recon-togr) and MAIN · W/O PINK (recon-rnp) get their own cards (they had none), and FIND A BOOK matches the names she sees in STATS (TOGETHER REJECTIONS ONLY, THIRDS AS READ, MOMENTUM BOOK, INVERSE BOOK, 70% CLUB ...). No trading change; a book still goes live only when she puts it on RUN.
- Files: src/components/desk/app.tsx (+14/-2), src/lib/desk/dogebook832.ts (+106/-0), src/lib/desk/engine.ts (+5/-0), src/lib/desk/grokog.ts (+1/-0), src/lib/desk/paperrows.ts (+2/-0), src/lib/desk/polymom830.ts (+70/-0), src/lib/desk/solbook832.ts (+106/-0)

## 117. MOMENTUM POLYMARKET BTC (fix830, R498)
- When: 2026-11-06 16:04:15 -0800
- Commit: [c6c4e3df](https://github.com/liluvdied/Aurelius/commit/c6c4e3df4d9a336e2218dd7e3e75aab56879211a)
- Her words: Love Nov 6 2026 ~2:56 PM PT: "and can you put the momentum book live on polymarket at $2.50 with a $$3 add on at 2.8x for me bb 💘💘" (BTC only - Polymarket mirror; her 1.5x floor kept)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix830 MOMENTUM ON POLYMARKET - BTC: the MOMENTUM BOOK's BTC paper trades (fix704) are mirrored LIVE onto Polymarket's BTC 15-minute market: $2.50 on the same side the second paper books it, only inside her 1.5x floor (ask 66.7c or less), once per window; one $3 add-on once that side pays 2.8x; paper's half (75%) and final trail sale mirrored, otherwise to the bell. Gold never. Every order goes through the guarded Polymarket route (umpire SAFE, LIVE switch, max-dollar cap) and needs Polymarket cash. Paper record (Nov 5-6, $10, take-profit): BTC inside her floor 87 trades, 59%, +$295. live-switch polyMom830.on false = off.
- Files: -

## 118. SOL DOGE PAPER BOOKS (fix832, R499)
- When: 2026-11-06 16:06:49 -0800
- Commit: [bebe630b](https://github.com/liluvdied/Aurelius/commit/bebe630b460b2becf8e68dc3c21c329b0b202bc6)
- Her words: Love Nov 6 2026 ~3:16 PM PT, her card pick "Paper books on the desk" to her ~1:58 PM ask: "can you test all of the other 15M markets on kalshi against our rules and see if they do better than gold does bb? 🏁"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix832 SOL + DOGE PAPER BOOKS: her ETH rejections-only / no-pink paper book (fix682) copied to SOL (Kalshi KXSOL15M, Coinbase SOL-USD) and DOGE (KXDOGE15M, DOGE-USD) - same rules and walls scaled by price, $20 paper at the live ask, her take-profit. PAPER ONLY (no order path). RECORDS cards (they show under NEW BEST once green) and STATS scoring. Natgas / WTI oil are not built: they need a 1-minute price feed the desk doesn't have (no public Coinbase-style source).
- Files: -

## 119. MOMENTUM COINS PAPER (fix833, R500)
- When: 2026-11-06 16:10:27 -0800
- Commit: [3e84def1](https://github.com/liluvdied/Aurelius/commit/3e84def1034a03be91342af7f93fda92759b7c8c)
- Her words: Love Nov 6 2026 ~3:18 PM PT, her card pick "Yes, all four on paper" (DOGE, BNB, SOL momentum paper books + a BTC first-2-minutes paper book) + ~3:04 PM: "do go ahead and feel free to see if eth does well on momentum's framework, or any of the other cryptos :)"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix833 MOMENTUM ON THE COINS - PAPER: the MOMENTUM BOOK's three setups (with the first 2 minutes, fresh break up through pink, short under -2σ while falling) on DOGE, BNB and SOL's Kalshi 15-minute markets, plus a BTC WITH THE FIRST 2 MINUTES book - Coinbase 1m feed, $20 paper at the real Kalshi ask, once per setup per window, 2+ minutes left, scored held to the bell and under her take-profit with Kalshi fees taken off. PAPER ONLY. Four RECORDS cards (NEW BEST once green) + STATS (MOMENTUM · COINS).
- Files: src/components/desk/app.tsx (+4/-0), src/lib/desk/engine.ts (+2/-0), src/lib/desk/momcoins833.ts (+106/-0), src/lib/desk/paperrows.ts (+4/-0)

## 120. ETH REJ LIVE KALSHI (fix831, R501)
- When: 2026-11-06 16:14:01 -0800
- Commit: [84e912c6](https://github.com/liluvdied/Aurelius/commit/84e912c6dff41557e8ccd1f39733c56c9176b9d9)
- Her words: Love Nov 6 2026 ~2:58 PM PT: "and pls put the rejection book on for eth" + ~3:04 PM: "yes , and i meant the eth rejection book on kalshi bb my bad :)) just the momentum book on poly" ($2.50 + $3 add-on at 2.8x - her yes to that size)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix831 ETH REJECTIONS LIVE ON KALSHI: her ETH · REJECTIONS ONLY · NO PINK paper book (fix682) goes live on Kalshi KXETH15M, all hours like its paper card: $2.50 on the same side the second the paper book takes a window (only inside her 1.5x floor), one $3 add-on once that side pays 2.8x, paper's half and last trail sale mirrored (reduce-only sells), else to the bell. Every buy goes through her add-on route (addOnBuy600): the umpire must be SAFE and its gate clear, LIVE on, entries on (halt / breaker), never over $5 an order, the window's side lock. Paper record: 116 trades, 59%, +$774 at $20. live-switch ethLive831.on false = off.
- Files: src/lib/desk/engine.ts (+2/-0), src/lib/desk/ethlive831.ts (+58/-0)

## 121. BREAKER SELF ALARM (fix834, R502)
- When: 2026-11-06 16:19:55 -0800
- Commit: [7577c363](https://github.com/liluvdied/Aurelius/commit/7577c3637c08c484843328c0645ce87418d990c2)
- Her words: Love Nov 6 2026 ~3:33 PM PT: "she still i've flipped it 3 times bb it's still not back" (her card: ship the fix)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix834 THE BREAKER NEVER RE-TRIPS ON ITS OWN PAUSE LINE: the breaker's backwards-fill rule counted every alarm line matching 'meant X but Kalshi holds Y' in the last 2 hours - including its own 'RED: BREAKER: ... meant DOWN ... holds UP' pause line - so the moment she turned entries back on it re-tripped and wrote a fresh line, again and again. Now it never counts its own pause line, and only counts backwards fills after she last turned entries back on. A new backwards fill still trips it; the 2-hour $ drop, losses in a row and the model check are unchanged. To clear today's pause: run this, then tap the OFF pill (her entries switch) to ON.
- Files: src/lib/desk/breaker.ts (+1/-1)

## 122. ONE SWITCH (fix838, R503)
- When: 2026-11-06 16:31:58 -0800
- Commit: [9a2c6637](https://github.com/liluvdied/Aurelius/commit/9a2c6637e989b6474ead38304a444235e1d2e5b6)
- Her words: Love Nov 6 2026 ~4:04 PM PT: "hun can you take this extra one off? it's gonna trick me every time i turn it on lol i'm gonna forget i have to do an extra one and she will miss atleast 300 windows this week if it's still there"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix838 ONE SWITCH: LIVE is the only switch. Turning LIVE on (her tap) also turns entries on - it clears a pause and restarts her pace, exactly what the old ENTRIES pill did; the separate ON / OFF entries pill is removed from the header. Her safety breaker still pauses entries when it trips - that now shows on the LIVE pill itself (orange, 'PAUSED · TAP LIVE OFF / ON') with a toast. Auto LIVE-on before the window (fix815) still never clears a breaker pause. Every other rail unchanged.
- Files: src/components/desk/app.tsx (+9/-17), src/lib/desk/engine.ts (+2/-0), src/lib/desk/fns.ts (+2/-0), src/lib/desk/onetwothree835-lines.ts (+125/-0), src/lib/desk/onetwothree835-recon.ts (+285/-0), src/lib/desk/onetwothree835-sandbox.ts (+32/-0), src/lib/desk/onetwothree835-walls.ts (+1653/-0), src/lib/desk/onetwothree835.ts (+543/-0), src/lib/desk/paperrows.ts (+2/-0)

## 123. ONE TWO THREE PAPER (fix835, R504)
- When: 2026-11-06 16:34:26 -0800
- Commit: [550702e0](https://github.com/liluvdied/Aurelius/commit/550702e0fe0dc31bc4545be31d2d04d98b8bca4d)
- Her words: Love Nov 6 2026 ~3:42 PM PT: "one thing we need to get up and running today bb , our 1-2-3 book on poly / she got turned inside out when i was doing some fixes on other books they bled into her and she was never the same / can you do the same thing you did on the og aurelius on there for me bb ?!" + ~3:45 PM: "honestly i think we can make it even better now together bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix835 / fix836 THE 1-2-3 BOOK, SEALED + NEW - PAPER ONLY: (835) 1-2-3 · SEALED: her Polymarket BTC 5-minute 1-2-3 book exactly as it stood Oct 26 ~9:30 PM PT (PRE295-BUILD, her ~74% stretch): 82 blocks of her read, walls, lines and doors copied byte for byte from a vault, sealed by sha256 + fingerprint (any change stops both books and says why), cut off from every shared wall (her own sandbox). (836) 1-2-3 · NEW: the same base plus her late door (~3 min left, pushing off a Bollinger / session band / zone), her 1.5x floor, the Bollinger cushion and no trading into a line within $50 of the target. $5 paper, priced at the desk's recorded Polymarket 5m quotes. Replay Nov 2-7: SEALED 209 trades 59% +$81; NEW 186 57% +$46 (her late door alone 21 trades 48% -$4.40). Never an order; live on Polymarket only on her go.
- Files: -

## 124. WEEKEND FRESH BANDS 50 (fix839, R505)
- When: 2026-11-06 16:52:34 -0800
- Commit: [b6ceecc1](https://github.com/liluvdied/Aurelius/commit/b6ceecc18ada25e1aaa2027213ec5e1064216b82)
- Her words: Love Nov 6 2026 ~4:36 PM PT: "fml yes that won't work on weekends bb / we need to start counting them at $50 on weekends for sure"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix839 FRESH BANDS ARE WALLS AT $50 ON WEEKENDS: her session carry (fix527) keeps yesterday's bands as the walls until the fresh BTC sigma reaches $100; from Friday 2:00 PM PT to Sunday 3:00 PM PT that hand-back happens at $50 instead, so the new session's bands count as walls again on quiet weekends (BTC's fresh sigma sits under $100 a third of the weekend vs 8% of weekdays). Weekdays ($100) and gold unchanged.
- Files: src/lib/desk/bandlock.ts (+11/-1)

## 125. BTC WEEKEND PUSH 5 (fix837, R506)
- When: 2026-11-06 17:42:51 -0800
- Commit: [1b347b4b](https://github.com/liluvdied/Aurelius/commit/1b347b4bf6ff23fb4a70c09e1ac361c569d33b6b)
- Her words: Love Nov 6 2026 ~3:49 PM PT: "OH one very important thing , btc wont move $50 on weekends for our push trigger / we need to put it back to $5 every friday at 2:00 until sunday at 3:00pm :)" + ~5:17 PM PT: "babe we cannnnot keep her at $50 for the weekend that is the distance from the bollinger rn no we keep her at $5 for the weekend pls 💓"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix837 BTC WEEKEND PUSH $5: from Friday 2:00 PM PT until Sunday 3:00 PM PT her BTC band / zone push off the wick (fix807) is $5 instead of $50; the rest of the week stays $50. Gold, pink trades ($6 / $2 flip) and every other rule unchanged. The fix807 proof now pins its $50 check to a weekday.
- Files: src/lib/desk/bandlock.ts (+10/-1), src/lib/desk/engine.ts (+3/-0)

## 126. BESTIE IN PROFIT (fix841, R507)
- When: 2026-11-06 17:45:21 -0800
- Commit: [5f6bd7a2](https://github.com/liluvdied/Aurelius/commit/5f6bd7a292f27f03d792d4fb8367d9e5eeb438be)
- Her words: Love Nov 6 2026 ~5:06-5:07 PM PT: "just put her on the trades that have been most successful for her bb 💓" + "it doesn't need to be 10+ bb just the ones she's been banking on most , paper first" + "all of them bb we need to get her set ups going" (BESTIE: every set up in profit with 5+ settled trades, never WORST - paper)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix841 BESTIE'S MOST SUCCESSFUL SET UPS: BESTIE's list (V.111 - 2's own settled set ups, fix797) now takes EVERY set up that is in profit ($ 0 or better) with 5+ settled trades, still never one on a WORST list - it updates itself as each record changes (was more than 10 trades and more than 65%). Paper (BESTIE is off the live lineup). BESTIE stays as she is live-wise (off the live lineup since 5:31 AM PT); her three switch-file proofs now read the new bar.
- Files: -

## 127. BESTIE PAPER (fix840, R508)
- When: 2026-11-06 17:48:14 -0800
- Commit: [c6dbab16](https://github.com/liluvdied/Aurelius/commit/c6dbab16715322f969cb6572ead47ed609746c29)
- Her words: Love Nov 6 2026 ~4:59 PM PT: "no we took her off for main and rej yesterday bb" (BESTIE off live - her own V.111 - 2 switch to paper so the card stops saying LIVE)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix840 BESTIE TO PAPER: her own V.111 - 2 live switch (data/v111-2-live.json enabled) goes false so her card stops saying LIVE - she has been off the live lineup since 5:31 AM PT (only main, REJ and delayed are live). Nothing new goes to Kalshi from BESTIE; she and V.111 - 2 keep scoring on paper; enabled true = live again on her yes. Her proofs now accept on or off.
- Files: -

## 128. SCORES SELF REBUILD (fix842, R509)
- When: 2026-11-06 17:50:53 -0800
- Commit: [f238f6df](https://github.com/liluvdied/Aurelius/commit/f238f6dfc2f1dda1ed4a4b183a1543924edc964a)
- Her words: Love Nov 6 2026 ~5:08 PM PT: "we have several of them showing as 0 too" (the inverse-worst books idle - SET UP SCORES only rebuilt while STATS was open)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix842 THE SCORES REBUILD THEMSELVES: SET UP SCORES (tools/setup-scores-708.py - the WORST lists the four inverse-worst books read, CUT + FLIP's list, the STATS tables) and EVERY FACTOR (tools/factor-scores-825.py) now rebuild every 10 minutes from the engine, whether or not the STATS page is open (before, they only rebuilt while STATS was open, so the inverse-worst list file was never written after 10:40 AM and those books sat idle). Niced, one run at a time; read-only.
- Files: -

## 129. INVERSE WORST 15 (fix843, R510)
- When: 2026-11-06 19:05:19 -0800
- Commit: [cd67aa2a](https://github.com/liluvdied/Aurelius/commit/cd67aa2a1442504b72cef9aca2468c1893240577)
- Her words: Love Nov 6 2026 ~5:18 PM PT, her card: the inverse-worst books' WORST bar 15+ trades in 7 days (still under 40% won and losing money), paper
- Before: (the code as it was in the previous entry - see the diff)
- After: fix843 INVERSE-WORST AT 15+ TRADES: the four inverse-worst paper books (fix820) flip their family's WORST set ups at 15+ trades in 7 days (was 30+), still under 40% won and losing money. Today: MAIN 1 (GOLD SHORT Rejected down off 5m PP), REJ 2, NO-PINK 7, V.111 0. Paper only.
- Files: src/lib/desk/bandlock.ts (+15/-5), src/lib/desk/bookwatch.ts (+2/-0), src/lib/desk/engine.ts (+8/-1), src/lib/desk/kalshi-live.server.ts (+23/-0), src/lib/desk/recon.ts (+1/-1), src/lib/desk/tpwatch847.ts (+85/-0), tools/behaviour-umpire.cjs (+3/-3), tools/umpire.py (+2/-0)

## 130. BTC SLIDE FROM 100 (fix845, R511)
- When: 2026-11-06 19:08:14 -0800
- Commit: [cc8a89d1](https://github.com/liluvdied/Aurelius/commit/cc8a89d1c905e9e8992e5ab75e3fdb608ac9e52e)
- Her words: Love Nov 6 2026 ~5:40 PM PT: "yess same sliding scale pls bb :) we'll do at $100 and up for the sliding scale to start instead of the normal $180 :)"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix845 HER SLIDING SCALE FROM $100: for BTC (every book but delayed) her sliding scale of the session-band channel now starts at $100 instead of $180 - half the channel under $100, 20% from $100 to $500 (the old $100-$180 third is gone), 15% to $1000, 10% over. Her pink cushion is that scale, and her other BTC cushions are capped by it (the smaller of her $ amount and the scale): session-band and Bollinger reach, the Bollinger cushion, and the target-by-a-line distance. Gold and delayed unchanged.
- Files: -

## 131. TP 75 95 FIRES (fix846, R512)
- When: 2026-11-06 19:11:08 -0800
- Commit: [a941c571](https://github.com/liluvdied/Aurelius/commit/a941c571e7d9f187b0e3208e59a278ba66bb182b)
- Her words: Love Nov 6 2026 ~5:45 PM PT: "babe her take profits are still not engaging, i just closed myself"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix846 HER 75 / 95 FIRES: the half-at-75% / rest-at-95% take profit (fix780 / fix782) on the four live books' positions read her HANDS OFF switch before the line that declares it, so every pass crashed (Cannot access 'handsOff' before initialization) and the try around the take-profit loop swallowed it - no 75/95 sale ever went out (data/tp780.json was never written). The block now reads HANDS OFF itself, and any error in the take-profit loop is written to data/cash-held-errors.jsonl instead of being swallowed. Her lines are unchanged.
- Files: -

## 132. TP WATCHDOG (fix847, R513)
- When: 2026-11-06 19:14:03 -0800
- Commit: [83f31abc](https://github.com/liluvdied/Aurelius/commit/83f31abcc4b917da0781e82a7322285325e57322)
- Her words: Love Nov 6 2026 ~5:50 PM PT: "pls do set something to notify us or the umpire of something like that next time if we can"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix847 TP WATCHDOG: every 5 s, on its own (outside the take-profit loop), for each live position her four live books opened (main, REJECTION, SESSION + PINK, BESTIE) with no slider of hers: if the bid has sat over its 75% (half) or 95% (rest) line for 20 s and that sale hasn't gone out, a 75 / 95 sale came back with no fill, or her exits / engine tick hit an error, it writes data/alarm-tp-watchdog.jsonl and raises a RED alert on her ALERTS tab and alarm bar. It only tells - it never sells, never turns LIVE off, never blocks an entry. And the umpire now refuses (NOT SAFE at install) any desk code with a variable used before it exists - the crash that silenced her 75 / 95.
- Files: -

## 133. HELD OTHER WAY (fix848, R514)
- When: 2026-11-06 19:16:57 -0800
- Commit: [9622cd53](https://github.com/liluvdied/Aurelius/commit/9622cd530686bf6bd551ed3bcbb979d654d03ffe)
- Her words: Love Nov 6 2026 ~5:58 PM PT: "she just flipped sides on eth, it was long and now it's short"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix848 NEVER TRADE AGAINST A HELD POSITION: Kalshi nets YES and NO on one ticker, so an opening short on a ticker where a YES is held sells it (5:47 / 5:56 PM: her ETH book's short + add-on sold her own 10.93 YES long and left her 3.03 short). Before every opening order - every book's entry, the ETH / add-on route, the add-ons, the top-up - the live position on that ticker is read; anything held on the other side = no order (logged to data/held-other-way-848.jsonl). Exits and take profits untouched.
- Files: -

## 134. 5M BOLLINGER PAPER (fix851, R515)
- When: 2026-11-06 19:40:56 -0800
- Commit: [cc6e064a](https://github.com/liluvdied/Aurelius/commit/cc6e064afd544b6b479fd13f15424c2349cb6c24)
- Her words: Love Nov 6 2026 ~6:08-6:10 PM PT: "yeah it'll basically be our main book with Bollingers added bb 💓, she enters on a (good) push off of a session or a bollinger, not a flip-blip ... if it's $200 away with 2 minutes left, $1 max lol" + "waiting for a 1M close will have her missing a lottt of genuine moves so we can test a 2-5m flip and push off of a bollinger , they hold as walls a lot harder than sessions i'm realizing"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix851 5M BOLLINGER · PAPER: two paper books on Polymarket's BTC 5-minute up/down. 5M BOLLINGER: a closed 1m candle touched the 5m Bollinger (20/2) and closed back off it - with the turn. 5M BOLLINGER · 2M PUSH: a new 2m candle opened within $10 of the 5m Bollinger and pushed $10 away - with the push. 2+ minutes left in the 5m window, her 1.5x floor, once per book per window; stake by distance to the 5m target ($10 already her side, $5 under $25 away, $1 at $25+); her take profit, else the bell. Two regular cards. Paper only - never an order.
- Files: src/components/desk/app.tsx (+2/-0), src/lib/desk/bandlock.ts (+21/-1), src/lib/desk/bb5m851.ts (+90/-0), src/lib/desk/bookwatch.ts (+1/-1), src/lib/desk/engine.ts (+1/-0), src/lib/desk/kalshi-live.server.ts (+1/-0), src/lib/desk/liveauto815.ts (+8/-4), src/lib/desk/paperrows.ts (+2/-0), src/lib/desk/poly-live.server.ts (+6/-1), src/lib/desk/polymom830.ts (+1/-1)

## 135. ETH FIVE (fix849, R516)
- When: 2026-11-06 19:43:27 -0800
- Commit: [0f5bdf59](https://github.com/liluvdied/Aurelius/commit/0f5bdf59eb3506f7b761a89b1f383592d0d9c333)
- Her words: Love Nov 6 2026 ~6:25 PM PT: "pls have the eth book run at $5 with a $5 add on pls babez"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix849 ETH AT $5: her ETH rejection book live on Kalshi (fix831) now enters for $5 (was $2.50) and its add-on at 2.8x is $5 (was $3). Same floor, same $5-an-order cap, same add-on trigger; it never trades against a held side (fix848).
- Files: -

## 136. POLY WHY HELD (fix850, R517)
- When: 2026-11-06 19:46:21 -0800
- Commit: [19693d60](https://github.com/liluvdied/Aurelius/commit/19693d60a2e66dec170c1de2aa61642629be8b8c)
- Her words: Love Nov 6 2026 ~6:19 PM PT: "haven't seen any bb" (momentum live on Polymarket - its skip reasons were thrown away)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix850 POLYMARKET TELLS WHY + NO BUY AGAINST A HELD SIDE: her momentum book on Polymarket (fix830) logged every skip as 'no fill / outside her 1.5x floor' because it read the wrong place for Polymarket's reason; it now logs the real one (window, quote outside her floor, cash, nothing filled - with Polymarket's ask) plus the Kalshi ask it copied. And no Polymarket buy goes out on the side opposite to what is already held on that market (it would net the position away, the fix848 lesson); her insurance hedges keep their own rule. Logging + safety only.
- Files: -

## 137. LIVE 60 FINISH (fix852, R518)
- When: 2026-11-06 19:49:09 -0800
- Commit: [131c0e49](https://github.com/liluvdied/Aurelius/commit/131c0e4918af83f2e2d21892e57b6cd2c62ac092)
- Her words: Love Nov 6 2026 ~6:48 PM PT: "every time i leave it off bro lmao can you still have it turn itself on 60 seconds before a window starts if i forget bb?" + ~6:39 PM: "it says it's already in bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix852 LIVE BACK 60 s BEFORE THE WINDOW + RUN-ALL FINISHES A HALF-DONE RUN: her auto LIVE-on (fix815) now turns LIVE back on in the last 60 s before each window (was 15 s, one try) and keeps trying every second of that minute - still only when the umpire is SAFE, entries aren't halted, OFF TODAY isn't set and no install of HER desk is running (a rehearsal copy elsewhere no longer counts) - and posts a LIVE AUTO-ON alert.
- Files: -

## 138. WEEKEND 50 TO MONDAY (fix853, R519)
- When: 2026-11-06 19:51:56 -0800
- Commit: [e15f7138](https://github.com/liluvdied/Aurelius/commit/e15f7138757ff536d9bd63e38cb1e91bd238f8b5)
- Her words: Love Nov 6 2026 ~7:11-7:14 PM PT: "the bands as walls at and traded again after $ 50" + "yesss pls bb" (to: run the weekend $50 until Monday 6 AM PT instead of Sunday 3 PM)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix853 WEEKEND $50 TO MONDAY: her weekend rule (fix839) - BTC's new session bands count as walls AND are traded off once their sigma reaches $50 - now runs from Friday 2:00 PM PT to Monday 6:00 AM PT (was to Sunday 3:00 PM), so a quiet Sunday evening keeps today's bands; the weekday $100 comes back Monday 6 AM. The weekend $5 push (fix837) keeps its own hours. Gold unchanged.
- Files: -

## 139. HER COLOUR 5M (fix854, R520)
- When: 2026-11-06 19:54:46 -0800
- Commit: [3d7363df](https://github.com/liluvdied/Aurelius/commit/3d7363df184bbca598e4c2af32e085451c3909b7)
- Her words: Love Nov 6 2026 ~7:16-7:17 PM PT: "hun she just longed gold on a red candle" + "looked like exactly that hehe, she still needs to wait for the candle to be her color bb" + "that was a for sure short"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix854 HER COLOUR ON THE 5M: at the send, no long while the 5m candle is red (price under its open) and no short while it is green (price over its open), on the live tick - every book but delayed. The 7:16 PM REJ long at 75,973.95 under the 5m open 75,977.31 would have been refused. Replay Nov 2-6 (main / REJ / no-pink, BTC): blocked 324 entries that went 39% (-$1.44 a $10 trade); kept 421 at 56% (+$0.54).
- Files: -

## 140. SELLS NEVER CAPPED (fix869, R521)
- When: 2026-11-06 20:53:53 -0800
- Commit: [bfbd83fe](https://github.com/liluvdied/Aurelius/commit/bfbd83fe148d33d032cd9e07f07b00b278ad6f0c)
- Her words: Love Nov 6 2026 ~8:41 PM PT (relayed): sells / closes must NEVER be capped by maxDollars - "SELLS NEVER CAPPED" (her 8:37 PM BTC DOWN take-profit was cut to $1 = 11 of her contracts)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix869 SELLS NEVER CAPPED: her resting take-profits (and any close marked as a close on what she holds) pass the Kalshi per-order cap untouched - at 8:37 PM her BTC DOWN take-profit was cut from $3.26 to the $1 cap, so it only covered 11 of her contracts. Reduce-only exits already passed; every new opening order is still capped.
- Files: src/lib/desk/kalshi-live.server.ts (+1/-1)

## 141. WEEKEND PINK REGULAR (fix905, R522)
- When: 2026-11-06 22:39:52 -0800
- Commit: [cd417c65](https://github.com/liluvdied/Aurelius/commit/cd417c6567b730e7c46c80a50b7f3e20dab21be9)
- Her words: Love Nov 6 2026 ~10:24 PM PT: "yeah literally all of the ones she skipped are valid / i had you make the pink tolerance half the channel width under $100 / but change it to the regular pink tolerance during weekends. / drop me that command now by itself pls so she can trade"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix905 HER REGULAR PINK TOLERANCE ON WEEKENDS: Friday 2 PM to Sunday 3 PM PT her BTC pink cushion (main, REJ, no-pink - every book but delayed) is the regular 20% of the session channel (15% / 10% on huge channels) instead of half the channel under $100 - tonight's $72 channel made it $36, holding 920 calls since 8:30 PM (622 of them $15+ from the pink); now $14.40. Weekdays keep half under $100 and her scale from $100. Four proofs that read her weekday scale are pinned to a weekday.
- Files: src/lib/desk/bandlock.ts (+1/-1), tools/behaviour-umpire.cjs (+1/-0), tools/check-her-rules.cjs (+1/-0)

## 142. ETH LINE IN THE WAY (fix906, R523)
- When: 2026-11-06 23:15:16 -0800
- Commit: [614b008a](https://github.com/liluvdied/Aurelius/commit/614b008abacab80425c0c5d29348caf4cb741b7e)
- Her words: Love Nov 6 2026 ~10:53 PM PT: "hun WHY did the eth book just long directly under a band like this ?????? unacceptable we need to fix that before she can be live" (10:51 PM: long at 2,244.07 with the red zone $0.66 above)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix906 NO ENTRY INTO A LINE (her ETH book, live): main's reach wall, scaled by price (BTC $25 -> ETH ~70c) - no long with an unbroken line (session VWAP / σ, red or green zone, Bollinger, her pink) within reach above, no short with one within reach below. 10:51 PM's long $0.66 under the red zone is refused. Calibrated replay (ETH since Oct 31): 331 trades, $4.07/trade vs $3.79 now - about the same money, fewer bad entries. ETH.2 and BTC.2 inherit it when rebuilt.
- Files: src/lib/desk/ethbook.ts (+10/-3), src/lib/desk/nav.ts (+1/-1), src/lib/desk/pivotbooks.ts (+1/-1), src/lib/desk/quotes.ts (+1/-1)

## 143. LIVE ETH UTC (fix907, R524)
- When: 2026-11-06 23:17:59 -0800
- Commit: [b186bc9b](https://github.com/liluvdied/Aurelius/commit/b186bc9be6a91433f2a4f2c367e5bb22c3ac771d)
- Her words: Love Nov 6 2026 ~10:54 PM PT: "it wasn't the red hun the green band is the session band. she was under it" + her card pick ~10:56 PM: "Yes, use my chart's reset" (live ETH on her chart's 00:00 UTC session, 5m - like ETH.2)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix907 LIVE ETH ON HER CHART'S SESSION (her fix862, as ETH.2): her live ETH book's session VWAP and σ bands reset at 00:00 UTC on 5m candles, exactly like her TradingView ETH chart - at 10:51 PM the book drew +1σ at 2,243.40 (5 PM ET on 1m) while her chart's was 2,244.08, so it longed into her band. Now its lines are hers (VWAP 2,241.17, +1σ 2,244.08 at 10:51 PM). Corrected-model replay: +$262 vs the 5 PM session.
- Files: -

## 144. FEED VANTAGE (fix908, R525)
- When: 2026-11-06 23:20:43 -0800
- Commit: [3e7270e3](https://github.com/liluvdied/Aurelius/commit/3e7270e38d719f55b9acb343a6b4f30dc7ea6307)
- Her words: Love Nov 6 2026 ~10:58 PM PT: "yeah coinbases chart is frozen too put her on vantage please." (Pepperstone BTC froze at 10:25 PM - the desk sat at 75,931 while Vantage ran 76,026-76,052)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix908 FEED -> VANTAGE: her BTC live price (the quote stream), her band bars (pivotbooks) and nav read VANTAGE:BTCUSD instead of PEPPERSTONE:BTCUSD - Pepperstone froze at 10:25 PM (the desk sat at 75,931 for 30+ min, so main / REJ / no-pink could not read) while Vantage kept updating with her chart. Gold stays on TVC:GOLD; the Coinbase backup feed and every stale-feed guard unchanged. Her bands rebuild from Vantage on the switch.
- Files: -

## 145. BANDS VANTAGE (fix911, R526)
- When: 2026-11-07 00:19:47 -0800
- Commit: [8b1a080d](https://github.com/liluvdied/Aurelius/commit/8b1a080d0475ac3bf3327c17fb49aac8ff393aed)
- Her words: Love Nov 6 2026 ~11:52 PM PT: "it's not trading fine right now hun she is skipping literally every entry" + "hun this is NOT the top rung" (after the Vantage switch her session bands still came from the frozen Pepperstone chart - every band ~$100 under her chart)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix911 BANDS -> VANTAGE: fix908 moved her BTC price to Vantage, but the chart her session VWAP / sigma bands are drawn from (tv.ts CHARTS.btc) was still PEPPERSTONE:BTCUSD - frozen since 10:25 PM - so every band sat ~$100 under her chart (desk VWAP 75,867 vs hers 75,967; +2σ 76,011 vs 76,111) and every long read 'over +2σ / top rung'. Now her bands come from VANTAGE:BTCUSD 5m, 5 PM ET session - the same feed as her price and her chart.
- Files: src/lib/desk/tv.ts (+1/-1)

## 146. ETH LONG 150 (fix913, R527)
- When: 2026-11-07 01:38:36 -0800
- Commit: [620bca1f](https://github.com/liluvdied/Aurelius/commit/620bca1f8efdde81eda2c26a60551dda33b8aea1)
- Her words: Love Nov 7 2026 12:49 AM PT, card "How far above an ETH long should a line block her?" - her pick: "Flat $1.50" (after "hun WHY did the eth book just long directly under a band like this ?????? unacceptable" and "she longed into a band again" - the 12:32 AM ETH long at 2,244.55 went in 95c under her BB upper 2,245.50 and 97c under her red zone 2,245.52; the wall only reached 70c)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix913 FLAT $1.50 ABOVE AN ETH LONG: her ETH book takes no long when an unbroken session band, red / green zone, Bollinger or pink sits within $1.50 above the entry (was fix906's 70c, BTC's $25 scaled by price - tonight's 12:32 AM long went in 95c under her BB upper). Shorts keep fix906's reach; BTC unchanged. ETH.2 gets the same $1.50 in its own wall when it installs (fix910).
- Files: src/lib/desk/bandlock.ts (+4/-1), src/lib/desk/ethbook.ts (+2/-2), src/lib/desk/recon.ts (+2/-1)

## 147. WEEKEND PINK READ (fix914, R528)
- When: 2026-11-07 01:41:28 -0800
- Commit: [eec4ccc8](https://github.com/liluvdied/Aurelius/commit/eec4ccc8fd58f1475d4e8144483b19231869af04)
- Her words: Love Nov 6 2026 ~10:24 PM PT (R522, fix905 - this completes the site 243 missed: main's READ copy of the pink cushion in recon.ts): "i had you make the pink tolerance half the channel width under $100 / but change it to the regular pink tolerance during weekends." + Love Nov 7 2026 ~1:03 AM PT: "she has a 20% pink tolerance. that was a full channel away." + "PINK was NOT the reason" (1:01:19 AM BTC main short "Failed break above Bollinger upper - rejected down" at 76,185.73 held by THE PINK in the read: pink 76,154.80 $30.93 away, channel $81.53, the read still used half = $40.77) + Love Nov 7 2026 12:55 AM PT, card "Keep 198 'momentum only live' in tonight's batch?" - her pick: "Pull 198 out" (supersedes her Nov 6 7:33 PM card "Momentum only live"; CHANGE-198 / fix856 taken out of the batch, kept in used-commands/resting)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix914 FINISH 243: WEEKEND PINK IN MAIN'S READ - CHANGE-243 (fix905) gave her BTC pink cushion the regular 20% of the channel on weekends (15% / 10% on huge channels) at the door only; main's read (recon.ts pinkRead464, 'THE PINK in the read') kept half the channel under $100 and held tonight's 1:01:19 AM short ($30.93 over the pink, read cushion $40.77). Now one function (bandlock weekendPink914) serves the door and the read, so they cannot drift. Weekdays, delayed and gold unchanged.
- Files: -

## 148. TARGET LINE BTC 15PCT (fix915, R529)
- When: 2026-11-07 02:55:13 -0800
- Commit: [4e4d6e76](https://github.com/liluvdied/Aurelius/commit/4e4d6e76923a62f09d39056d204a2d00685df383)
- Her words: Love Nov 6 2026 ~10:43 AM PT (R490, fix821): "also , not sure if we still have this rule in place , it's an oldie but a goodie 💞 if target is within $1.50 of a session band , bollinger , or a red, or a green zone ; i want her to take the position that trades away from it" + Love Nov 7 2026 ~1:18 AM PT: "it is $1.50 for gold bb 💘" + ~1:27 AM PT: "oh we can make it 10 of the band bb 💘" (BTC $10 - superseded) + ~1:30 AM PT: "15% of the channel width hun , $10 isnt the number" (BTC = 15% of the channel) + ~1:29 AM PT: "as long as a trade it outside of her band tolerance she is clear to enter bb 💘" (the wall is her band tolerance only: target more than $10 BTC / $1.50 gold from every band, Bollinger and zone = clear) + ~1:16 AM PT: "she's gone dude. 3 breaks in a row this ain't my model bb" - tonight's 1:15:39 AM "Break below +2σ" was refused because the target 76,091.82 sat $21.56 from the +1σ (76,070.26) under our BTC $50 scaling capped to half the channel ($42.50).
- Before: (the code as it was in the previous entry - see the diff)
- After: fix915 TARGET BY A LINE: HER 15% OF THE CHANNEL FOR BTC - fix821's BTC tolerance (the window's target within it of a session band, Bollinger or red / green zone = no entry into that line) is 15% of the session-band channel price sits in ($12.84 tonight; was our $50 scaling capped by her sliding scale - $42.50 tonight). One value (TGT915_BTC) for every caller; outside the tolerance she is clear to enter. Gold stays $1.50; books and scope unchanged (every book but delayed). Tonight's 1:15:39 AM break below +2σ (target $21.56 from +1σ) is no longer refused.
- Files: src/lib/desk/bandlock.ts (+42/-12), src/lib/desk/kalshi-live.server.ts (+3/-2), src/lib/desk/recon.ts (+6/-2), tools/behaviour-umpire.cjs (+7/-7)

## 149. ZONE PAST THE BAND HER WORDS (fix916, R530)
- When: 2026-11-07 02:58:05 -0800
- Commit: [0cdd4243](https://github.com/liluvdied/Aurelius/commit/0cdd4243f023619d14b558c35f994f3f05a95e10)
- Her words: Love Nov 6 2026 ~10:43 AM PT (R491, fix822): "she just enter btc on the break up the session band with a red zone directly on the other side of it too , can you do some tests on that and let me know if those lose more than they win? when she enters on a break & a green/red zone sits in the bottom/top 10-15% of the band channel she's breaking into on the other side" + Love Nov 7 2026 ~1:31 AM PT: "my model takes these" + "it broke the band up" (1:30:16 AM "Break above +1σ" at 76,083.20 refused because the red zone 76,166.96 sat 15% past +2σ - the far end of the +1σ->+2σ channel she was breaking into, $85 away; her rejections were refused by it too)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix916 ZONE PAST THE BAND: HER WORDS - fix822 now matches R491: it judges only her BREAK reads (not rejections); the channel is the session band price is breaking (the σ / VWAP line just behind price) to the next band beyond it; only a red zone (long) / green zone (short) ahead of price inside the first 15% of THAT channel refuses. Was: every read, measured from the σ line under the zone (tonight it refused a +1σ break and +1σ / green-zone rejections over a red zone past +2σ, $85 away). One helper (zoneBreak916). Every book but delayed; switch zonePast822 false = off.
- Files: -

## 150. EVERY READ GETS ITS CHANCE MAIN (fix917, R531)
- When: 2026-11-07 03:00:52 -0800
- Commit: [c5c2d86a](https://github.com/liluvdied/Aurelius/commit/c5c2d86aafdba8004e870021a84fe3712253599b)
- Her words: Love Nov 6 2026 ~8:40-8:43 PM PT (CHANGE-213 words): "no one read per window pls. for any book ever" + "no hun i don't want her to do multiple i want her to be ABLE to take valid set ups when they appear bb thats it" + Love Nov 4 2026 8:23 PM PT (R357, her wick rejection): "...she can enter in , even if the candle hasn't flipped" + Love Nov 7 2026 ~1:02 AM PT: "she has a wick rejection that takes it the second a candle wicks by 15% of the channel distance." (1:00:55 AM: main's top read was a thirds-flipped break, never her call; her valid "Rejected down off +3σ" wick rejection sat second in line and was never tried)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix917 EVERY READ GETS ITS CHANCE (MAIN): main's read used to hand on only her top-ranked idea; when that one was a flipped read or her walls refused it, her other valid reads that same second were never tried. Now, when the top read is refused (flip, thirds, pink in the read, her door - main's own why479 check), she tries her next reads in her same order and takes the first one nothing refuses. Ranking unchanged, every wall still judges, still one FILLED trade per window. Main (recon-tog) only.
- Files: -

## 151. HER PUSH ON HER SIDE OF THE BAND (fix918, R532)
- When: 2026-11-07 03:03:41 -0800
- Commit: [4d4852b2](https://github.com/liluvdied/Aurelius/commit/4d4852b210e00c0191018dcd1638efd14e2501b8)
- Her words: Love Nov 7 2026 ~1:46 AM PT: "once it is on the same side of the band hun" + "doesn't need a close" (her BTC band / zone push - fix807, weekend $5 fix837 - enters the moment the push off the wick is met with price on the trading side of the band; no 2m candle colour, no candle turn, no close) + ~1:40 AM PT: "again not her bb mine enters immediately on the flip after $5" + ~2:03 AM PT: "one of the candles does need to be green" + "and they both are" (the push + her side of the band + at least ONE of her 2m / 5m candles her colour; no close) (SUPERSEDES for this push: R344 Nov 4 5:40 PM PT "She enters the second the push is met and a 2m is her color." and the R477 card "Push + 2m candle in her colour" - told to Love as a contradiction; this command is her choice)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix918 HER PUSH ON HER SIDE OF THE BAND: her BTC band / zone push (fix807: weekday $50, weekend $5 off the wick) now enters the moment the push is met with price on the trading side of the band (over it for a long, under it for a short) and at least ONE of her 2m / 5m candles her colour - the 2m alone no longer has to be her colour; no close. One shared check (pushLabel653) serves the door, and main's read filter (recon.ts fix653 line) now takes her push without the 2m colour too (longs, and the mirror for shorts). Every book but delayed; gold and pink trades unchanged. SUPERSEDES the '2m her colour' part of R344 / R477 for this push.
- Files: -

## 152. OUTSIDE ORDERS NEVER TAKE A WINDOW (fix920, R533)
- When: 2026-11-07 03:06:34 -0800
- Commit: [d1d3a374](https://github.com/liluvdied/Aurelius/commit/d1d3a3749cef3734351320140f9c112635955215)
- Her words: Love Nov 7 2026 ~1:24 AM PT: "yes they were mine and they're just webhooks for something you and i did. a while ago they're nothing important bb" + ~1:55 AM PT: "the webhooks are not even for aurelius hun" + "yeah pls do" (to: Kalshi orders with no desk client id must never lock main or any book out of a window) - SUPERSEDES for those orders the Oct 15 2026 ~6:50 PM PT "HER WINDOW, PERIOD" lock ("i do not want her to be able to get a second order out again") and its fix750 (R428) keep; tonight it held main's 1:37:12 AM long (1:30 window) and the 10:15 PM window. Kept: never trading against a held position (fix848) and never closing a position she started by hand (change-her-mind).
- Before: (the code as it was in the previous entry - see the diff)
- After: fix920 OUTSIDE ORDERS NEVER TAKE A WINDOW: a Kalshi order with no desk client id (her hand / webhook orders, data/outside-orders.json) no longer locks that window for her books ('your hand traded this window - it stays yours' retired for them; logged to data/outside-window-920.jsonl). Kept: never trading against a held position (fix848) and never closing a position she started by hand. Every book.
- Files: -

## 153. BTC 55 FROM HER ENTRY LINE (fix923, R534)
- When: 2026-11-07 03:09:25 -0800
- Commit: [aaded9af](https://github.com/liluvdied/Aurelius/commit/aaded9afc939c57e71e4143ca242e27a72fbf271)
- Her words: Love Nov 7 2026 ~2:00 AM PT: "the 55% of pink to red is not a permitted reason for a skip when she enters at 0-5% of that distance 100% of the time" + her card ~2:13 AM PT "How should the 55% wall work for BTC?" - + ~2:15 AM PT: "thankkkkkk you i was saying that on repeat like that is not a reason 😹💘 a wall is not a wall til you run into it" + her pick: "Measure from her entry line — only refuse when price is already 55%+ of the way from the line she trades off to the next line. Entries at 0-5% always go." (BTC only; gold keeps R316 "the 55% from pink to green and pink to red")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix923 BTC 55% FROM HER ENTRY LINE: on BTC, fix594's PINK TO RED / GREEN 55% and PAST THE ZONE checks are replaced by her card's rule: refuse only when price is already 55%+ of the way from the line her read trades off (band, zone, pink, Bollinger) to the nearest of her lines ahead; entries at her line always go; a read that names no line is not judged by it. Same door + last-line sites (zoneSend594). fix711 (BB fade) unchanged. Gold keeps fix594 (R316).
- Files: -

## 154. UNDO 263 BTC 55 (fix926, R535) - UNDOES entry 153 (BTC 55 FROM HER ENTRY LINE, CHANGE-263)
- When: 2026-11-07 03:42:17 -0800
- Commit: [260ef596](https://github.com/liluvdied/Aurelius/commit/260ef59650fe2b09a91e538e90d7ce17923418a4)
- Her words: Love Nov 7 2026 ~3:21 AM PT, on the description of CHANGE-263 / fix923 (refuse only when price is 55%+ of the way from her entry line to the next line): "zeeeeero percent correct" + ~3:24 AM PT: "the 55% rule applies to distance from pink to red , and pink to the green zone - not from band to band whatsoever" (SUPERSEDES her ~2:13 AM card pick "Measure from her entry line") + R292 (Oct 31): "a solid 55% of the distance from pink to green, and pink to red / it's universal" - fix923 is taken back out: BTC's fix594 is exactly as it was before (pink -> red / green -> pink 55% and past the zone), until her own 55% words. late923 stays in the file unwired (R534 kept on record, marked undone).
- Before: (the code as it was in the previous entry - see the diff)
- After: fix926 UNDO 263: takes fix923 back out - BTC's fix594 (pink -> red / green -> pink 55% and past the red / green zone) is exactly as it was before CHANGE-263; late923 stays in the file but nothing calls it; her behaviour proofs for BTC fix594 are back as they were.
- Files: src/lib/desk/bandlock.ts (+1/-1), tools/behaviour-umpire.cjs (+7/-7)

## 155. ONE PINK RULE (fix927, R536)
- When: 2026-11-07 05:53:26 -0800
- Commit: [760cfeb5](https://github.com/liluvdied/Aurelius/commit/760cfeb5e05073ad0149d17ab502b84db5106d5a)
- Her words: Love Nov 7 2026 ~4:02 AM PT: "session band to session band / distance from where price currently is / if a band channel is $100 wide from 0 - 1o / pink tolerance is 20% / she needs $20 of clearance from where price currently is. / it applies in every conceivable capacity" + "yes 20% of the channel width" + "$500 channel = $100 / 20% tolerance from where price currently stands" + Love Nov 7 2026 ~4:02 AM PT: "yes 20% of the channel width"
- Before: R125: fix430: the pink's reach in her wall (reachWall429, main + rejection, gold + BTC) = the larger of $1.50 gold / $50 BTC and 15% of the session-band channel width price sits in. Session-band reach stays $1.50 / $50. Test: pink 14% of the channel above = refused, 16% = passes. Installed with fix429 at the 8:30 PM PT boundary. | R176: fix459: a long is refused by the unbroken pink (fix432 never-long-under-pink and fix429/430 pink reach) only when the pink is within 15% (gold) / 20% (BTC) of the session-band channel, band to band; main (recon-tog) + rejection (recon-rej), gold + BTC. The downslope pink rule (fix371/403 gold, fix423 BTC: no entries til pink breaks by 25c) stays exactly as is. Sliding scale later. | R271: fix526 HER PINK TOLERANCE IN DOLLARS: at every pink site (the reach cushion, pinkFar503, pinkBeyond459 and the fix464 escape) BTC = the larger of her $75 weekday floor (any distance, PT weekdays), 3/4 of the band-to-band width while the width is $75-$180, and her 20% scale otherwise; at $180+ the scale returns; weekends carry no floor until her coming weekend scale; gold untouched; cornerstone 53  | R356: fix667: her pink cushion (pinkSlide580 at the door + pinkSlide580R in the read) - BTC half the channel under $100 (kept), a third of the channel from $100 to $180 (was half capped at $60), her sliding scale from $180 unchanged; gold (her ~8:29 PM words): half under $3, a third from $3 to $5, then 15% ($3 max past $25) unchanged. And when the pink and the ses
- After: fix927 HER ONE PINK RULE: the pink tolerance is 20% of the session-band channel price is in (the session band under price to the session band over it), measured from where price is now - a $100 channel needs $20 of clearance, $500 needs $100, $1,200 needs $240, gold $10 needs $2. Every width, BTC and gold, longs and shorts, weekdays and weekends, at the door, main's read, the wire and the last line, every book but delayed (delayed keeps its own) and her walled-off 5M (R169 - it keeps its own). It replaces every other pink cushion: half the channel under $100, a third from $100-$180, the 20 / 15 / 10% scale on pink, the weekend switch (fix905 / fix914), the $25 flat pinks and gold's 15%. NOT touched: her session-band tolerances and sliding scales (proved byte-for-byte), the $2 pink break, the 55% pink -> red / green, thirds, the Bollinger cushion and the zone reach.
- Files: src/components/desk/app.tsx (+3/-1), src/lib/desk/backup928.ts (+31/-0), src/lib/desk/bandlock.ts (+11/-9), src/lib/desk/bandlock5m.ts (+5/-5), src/lib/desk/btc2c.ts (+151/-0), src/lib/desk/engine.ts (+3/-0), src/lib/desk/ethbook2.ts (+142/-0), src/lib/desk/ethlive2.ts (+75/-0), src/lib/desk/paperrows.ts (+2/-0), src/lib/desk/recon.ts (+3/-1), tools/behaviour-umpire.cjs (+2/-2), tools/pink-flag-25-test.cjs (+2/-2)

## 156. HOURLY GITHUB BACKUP ALWAYS ON (fix928, R537)
- When: 2026-11-07 05:56:21 -0800
- Commit: [421d91d0](https://github.com/liluvdied/Aurelius/commit/421d91d0dbd5e828b2c4bd03a1db7dadd05a6ed9)
- Her words: Love Nov 7 2026 ~4:16 AM PT: "yeup i am gonna be on git religiously from now on you can believe that" + "super glad that hourly push you definitely set in place for me totally worked 💘💘💘" (the hourly GitHub backup loop died at the Nov 3 restart)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix928 THE DESK BACKS HERSELF UP EVERY HOUR: your hourly GitHub backup was a loop started from a Terminal window and it died at the Nov 3 ~1 PM restart (last push Nov 3 12:51 PM). Now the desk itself runs your same backup tool (tools/github-backup.sh --once - it scans for secrets first and pushes NOTHING if a key, .env, .pem or any .secrets value would go up; it only pushes the desk-backup branch) once when the desk starts and then every hour, as long as the desk is running. It runs on the side (detached, lowest priority), never waits, never touches trading, an order, a book or a setting; results and any failure go to data/github-backup.log. .secrets/ stays ignored by git.
- Files: -

## 157. BOLLINGER ONLY IN FRONT (fix930, R538)
- When: 2026-11-07 05:59:16 -0800
- Commit: [c53e39e8](https://github.com/liluvdied/Aurelius/commit/c53e39e869866c96b0b7e9bf19c950bdd41a204f)
- Her words: Love Nov 7 2026 ~4:54 AM PT (BTC 4:45 window, price under the 5m Bollinger lower and past the green zone, main refused every long "BOLLINGER FADE PAST GREEN (fix711)"): "hun that is exactly the trade she should be taking she is still not her" + "a bollinger is only a barrier if it's in front of where price currently is. not if it already broke thru the bollinger." + "once it's broken thru the second it reverses she's in on it 🎯" + Love Nov 7 2026 ~4:13 AM PT: "price needs to be on the same side of the break when she enters a position. and not enter short directly above an unbroken bollinger."
- Before: R397: fix711 NO FADING A BOLLINGER BREAK PAST HER ZONE: inside her zone wall (zoneSend594 - the door and the last line, where PAST THE GREEN / RED ZONE already lives): once price has broken the 5m Bollinger lower (now or in the last 5 minutes) and sits at or past the green boundary, no long; mirror - after a break above the Bollinger upper, at or past red, no short. Every book but delayed. Cheap entries
- After: fix930 A BOLLINGER IS ONLY A BARRIER IN FRONT OF PRICE: the Bollinger fade block (fix711, Nov 5 - 'no long past green after a break of the Bollinger lower', mirror for shorts past red) comes out of the door and the last line for every book. Once price has broken through a Bollinger, it's behind her: the second it reverses, her reversal is her trade (all her other rules still judge it - her 5m colour, her push, her pink, thirds, 1.5x floor). A Bollinger still in front of price keeps its cushion exactly as now. Tonight 4:44-4:46 AM BTC: main called the long off -2σ / -3σ under the Bollinger lower and was refused every second by this block.
- Files: -

## 158. ETH2 EVERY REVISION (fix872, R539)
- When: 2026-11-07 06:02:08 -0800
- Commit: [b9774f30](https://github.com/liluvdied/Aurelius/commit/b9774f305833969171fe25633bb99ff158c20f37)
- Her words: Love Nov 6 2026 ~8:54-9:03 PM PT: "keep the original eth book as it is and put all these revisions into ETH.2" + "no it can go live with it hun i meant to tap that my bad bb hehe 💘" + Love Nov 7 2026 ~4:25 AM PT: "plsss still do have ETH.2 ready for eth and btc if you can bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix872 ETH.2: your ETH book copied into its own book - ETH.2, its own rows (data/eth2-book.json) and its own card in $$$ - with every ETH revision: her -2σ short and VWAP break, only a FILLED trade uses the window, keep knocking, add-ons at a better multiple near the next band, no entry into a line (flat $1.50 above a long), and your ONE pink rule (20% of the channel, from CHANGE-267). Its own live copy is built here and stays OFF (it trades only when live-switch ethLive872.on is true, which CHANGE-271 sets). Your original ETH book and its live copy stay exactly as they are.
- Files: -

## 159. BTC2 PINK THIRDS (fix899, R540)
- When: 2026-11-07 06:05:01 -0800
- Commit: [c1c60466](https://github.com/liluvdied/Aurelius/commit/c1c60466ce8128e79a346d73bbec52b592412832)
- Her words: Love Nov 6 2026 ~9:56 PM PT: "put her on pls / let's make 3 analogues - each of those / we will see how they do over the week on real trades / give me ETH.2 pink + thirds live on btc pls 💞" + Love Nov 7 2026 ~4:25 AM PT: "plsss still do have ETH.2 ready for eth and btc if you can bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix899 BTC.2 · PINK + THIRDS: ETH.2's rules on BTC (Coinbase BTC-USD, Kalshi BTC 15m) - her rejections off every line incl. her pink, main's failed break, any 5m open, a 7.5% break, a 25% touch, the VWAP break and -2σ short, 45% pink-to-zone, her 1.5x floor, one filled trade a window - with her pink cushion (your ONE pink rule, 20% of the channel) and her thirds kept. Its own rows (data/btc2c-book.json) and card in $$$. Paper here; CHANGE-273 takes it live.
- Files: -

## 160. ETH2 LIVE (fix910, R541)
- When: 2026-11-07 06:28:27 -0800
- Commit: [c8f73bc3](https://github.com/liluvdied/Aurelius/commit/c8f73bc3435c01d373918ea83e0056e88331789d)
- Her words: Love Nov 6 2026 ~11:05 PM PT, her card pick: "Live right away" (ETH.2 trades live on Kalshi ETH, beside the live ETH book) + Love Nov 7 2026 ~4:25 AM PT: "plsss still do have ETH.2 ready for eth and btc if you can bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix910 ETH.2 LIVE: ETH.2 trades live on Kalshi ETH beside your ETH book, $1.50 an entry (its add-on defaults to $3 at 2.8x, never over $5 an order, never worse than 66.7c), through your add-on route: umpire SAFE, LIVE on, entries on, one filled trade a window, never the opposite side of what's held. live-switch ethLive872.on false = paper again.
- Files: src/lib/desk/bandlock.ts (+9/-5), src/lib/desk/btclive899.ts (+79/-0), src/lib/desk/engine.ts (+1/-0), src/lib/desk/kalshi-live.server.ts (+26/-0)

## 161. BTC2 LIVE (fix899b, R542)
- When: 2026-11-07 06:30:53 -0800
- Commit: [745a9f43](https://github.com/liluvdied/Aurelius/commit/745a9f43bff458304a1d31cf14dcbf29131e98ed)
- Her words: Love Nov 6 2026 ~9:56 PM PT: "put her on pls / let's make 3 analogues - each of those / we will see how they do over the week on real trades / give me ETH.2 pink + thirds live on btc pls 💞" + Love Nov 7 2026 ~4:25 AM PT: "plsss still do have ETH.2 ready for eth and btc if you can bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix899b BTC.2 LIVE: BTC.2 · PINK + THIRDS trades live on Kalshi BTC 15m, $1.50 an entry (its add-on defaults to $3 at 2.8x, never over $5 an order, never worse than 66.7c), through your add-on route: umpire SAFE, LIVE on, entries on, one filled trade a window, never the opposite side of what's held. Its own switch (live-switch btcLive899); on:false = paper again.
- Files: -

## 162. PINK WALLS HER ONE RULE (fix931, R543)
- When: 2026-11-07 06:33:28 -0800
- Commit: [473064b4](https://github.com/liluvdied/Aurelius/commit/473064b435f0426373a2c520e7817201cb18e307)
- Her words: Love Nov 7 2026 ~4:02-4:07 AM PT: "session band to session band / distance from where price currently is / if a band channel is $100 wide from 0 - 1o / pink tolerance is 20% / she needs $20 of clearance from where price currently is. / it applies in every conceivable capacity" + ~5:18 AM PT: "ohhhhhh my gawd bb missed again" (5:17:18 AM BTC: the rejection long off -2σ was refused by UNDER THE PINK = NO LONGS with price $39.39 under the pink - her 20% of the channel was $16.50)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix931 HER ONE PINK RULE ON THE PINK WALLS: UNDER THE PINK = NO LONGS (and its mirror OVER THE PINK = NO SHORTS) now refuse only when price is inside your 20% of the session-band channel from the pink - it applies in every conceivable capacity. Outside it, the pink is not in her way. 5:17:18 AM BTC: your rejection long off -2σ was refused $39.39 under the pink when your 20% was $16.50 - now it goes. Inside 20%, the walls hold exactly as before.
- Files: -

## 163. FLAT NEUTRAL BOTH FEEDS (fix932, R544)
- When: 2026-11-07 06:36:14 -0800
- Commit: [66142f6d](https://github.com/liluvdied/Aurelius/commit/66142f6d5babbecbab740d5fb5ba8ecafdad4975)
- Her words: Love Nov 7 2026 3:20 AM PT (11:20:17Z), her card pick on "How should she judge a candle that's basically flat at its open?" - option 1 "Flat = neutral + both feeds": "Within $3 BTC / 10c gold of the open counts as neutral, and she only refuses when BOTH feeds show the wrong colour." + ~5:18 AM PT: "ohhhhhh my gawd bb missed again" (5:17:57 AM BTC: the rejection long off the green zone was refused HER COLOUR with the wire GREEN at 75,850 over its 75,836 open while the chart feed sat stale at 75,831)
- Before: R520: fix854 HER COLOUR ON THE 5M: at the send, no long while the 5m candle is red (price under its open) and no short while it is green (price over its open), on the live tick - every book but delayed. The 7:16 PM REJ long at 75,973.95 under the 5m open 75,977.31 would have been refused. Replay Nov 2-6 (main / REJ / no-pink, BTC): blocked 324 entries that went 39% (-$1.44 a $10 trade); kept 421 at 56% 
- After: fix932 FLAT = NEUTRAL + BOTH FEEDS (your card pick, 3:20 AM): her 5m colour at the send refuses only when BOTH feeds (the order wire and your chart) show the wrong colour - and a candle within $3 BTC / 10c gold of its open counts as neutral on that feed. If one feed can't be read, the other decides. 5:17:57 AM BTC: the live price was green over the 5m open (75,850 vs 75,836) but the chart feed sat stale at 75,831 and she refused - now that goes.
- Files: -

## 164. SIDE OF LINE AT SEND (fix933, R545)
- When: 2026-11-07 06:38:58 -0800
- Commit: [ce60ae01](https://github.com/liluvdied/Aurelius/commit/ce60ae01bdce51ef6be236a5364bd3388ceb4566)
- Her words: Love Nov 7 2026 ~4:13 AM PT: "price needs to be on the same side of the break when she enters a position. and not enter short directly above an unbroken bollinger." + Love Nov 6 2026 ~8:14-8:17 PM PT: "she is notttt on the same side of the break on these trades still i need you to fix that. btc. taken 30 seconds apart. it still isn't over the band. pls see what's causing that and fix that" (ETH.2 / BTC.2 live: her side of the line at the send)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix933 HER SIDE OF THE LINE AT THE SEND for ETH.2 and BTC.2 (ports fix864's lineOf864 / priceOf864 / sideOfLine864 - her Nov 6 8:17 PM words - onto today's door): before every live entry, the line a setup names (session band, pink, red / green zone, Bollinger) is read and a long only goes while price is ABOVE it on both her chart and the live tick, a short only while BELOW it - otherwise the setup waits. ETH.2's live copy already asked for this check (fix900) but the check itself was never installed, so it was silently skipped; BTC.2's live copy had no check at all. Main / REJECTION keep their own same-side check at the last line (sameSideSend595), unchanged.
- Files: -

## 165. NO COLOUR WALL (fix935, R546)
- When: 2026-11-07 06:47:00 -0800
- Commit: [b3cd92a6](https://github.com/liluvdied/Aurelius/commit/b3cd92a66326ff355f720e652848b6fe83ea8019)
- Her words: Love Nov 7 2026 ~6:27 AM PT: "let's take that off pls hun , color 2 feeds issue let's get rid of that wall pls"
- Before: R544: fix932 FLAT = NEUTRAL + BOTH FEEDS (your card pick, 3:20 AM): her 5m colour at the send refuses only when BOTH feeds (the order wire and your chart) show the wrong colour - and a candle within $3 BTC / 10c gold of its open counts as neutral on that feed. If one feed can't be read, the other decides. 5:17:57 AM BTC: the live price was green over the 5m open (75,850 vs 75,836) but the chart feed sat
- After: fix935 NO COLOUR WALL: the 5m candle colour refusal at the send (fix854 'HER COLOUR' - no long on a red 5m candle / no short on a green one, either feed; fix932 made it both feeds) comes out for every book (delayed never had it). This morning it refused 78 of her orders at the last line. The function stays in the file, unwired. Her push rule (fix918 / fix807: the push off the wick on her side of the band with one 2m or 5m candle her colour) and every other rail are unchanged.
- Files: src/lib/desk/kalshi-live.server.ts (+1/-1)

## 166. BLUE VWAP WALL BAND TOLERANCE (fix936, R547)
- When: 2026-11-07 14:01:02 -0800
- Commit: [25a8c29d](https://github.com/liluvdied/Aurelius/commit/25a8c29d2ab16166f696acf1418aac54443cb934)
- Her words: Love Nov 7 2026 ~6:52 AM PT (asked whether the blue VWAP wall, fix397, should keep "no long / short within half the VWAP to 1σ distance" or use her band tolerance): "no not half luv just her normal session band tolerances"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix936 THE BLUE VWAP WALL USES HER NORMAL SESSION BAND TOLERANCE: fix397 (no long under / no short over the unbroken blue VWAP when bands are small) kept her within HALF the VWAP-to-1σ width; it now uses what a session band gets at the door (bandTol934 = her session-band scale fix593 capped by her sliding scale fix845; BTC $25 under a $100 width). Today 6:45 AM BTC: VWAP to 1σ $81.74 - half held her long $33.61 under the VWAP; her $25 lets it through. Main and rejection orders (the only ones this wall judges); delayed never comes through here. Carries her band-tolerance helper (bandTol934) itself.
- Files: src/lib/desk/bandlock.ts (+5/-3)

## 167. BNB MOMENTUM LIVE KALSHI (fix940, R548)
- When: 2026-11-07 14:46:05 -0800
- Commit: [c65ddfb5](https://github.com/liluvdied/Aurelius/commit/c65ddfb5ada136739e983f8b3b0cd9e1809a7e4d)
- Her words: Love Nov 7 2026 ~2:02 PM PT: "omg pls turn on bnb momentum on kalshi bb"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix940 BNB MOMENTUM LIVE ON KALSHI: her BNB momentum paper book (fix833: with the first 2 minutes, a fresh break up through pink, short under -2σ while falling - on Kalshi KXBNB15M) gets its own live copy: the second the paper book takes a BNB window, buy the same side for $1.50 inside her 1.5x floor (66.7c or less); one filled trade a window; keep knocking while the set up is valid; exits mirror the paper (half at 75%, trail, bell). Every order through her add-on route: umpire SAFE, LIVE on, entries on (her stops / halt), $5 cap, side lock, opposite-side guard. Its own switch: live-switch bnbLive940 (on, $1.50). Paper record at her floor since Nov 6 night: 46 settled, 27 W / 19 L, +$67.52 at $20 paper (TP exits).
- Files: src/lib/desk/bnblive940.ts (+60/-0), src/lib/desk/engine.ts (+1/-0)

## 168. 2PM RULE HER WORDS (fix942, R549)
- When: 2026-11-07 15:02:34 -0800
- Commit: [daf5c19a](https://github.com/liluvdied/Aurelius/commit/daf5c19a48c8456a1d03eb80d71b5e21111e576a)
- Her words: Love Nov 7 2026 ~2:17 PM PT: "dude i never said main takes rejections only for pink" + 2:17:52 PM: "she needs to trade pink breaks too" + 2:18 PM: "and remove the blue vwap as a wall thing from 2-3 pls" (her yes to putting the 2 PM rule back to her words) - her words: Love Nov 1 2026 11:20 AM PT (R310): "During the hours of 2 PM until band channel width reaches $100 again, the green and red zones, Bollingers, and pink bands can be traded for rejections only. Pink can be traded for breaks on main. Rejection is a rejection-only book." + 11:31 AM: "apply to BTC only."
- Before: (the code as it was in the previous entry - see the diff)
- After: fix942 THE 2 PM RULE IN HER WORDS: from 2 PM until her band channel reaches $100 (carried session), on BTC only, main takes only REJECTIONS at the green / red zones, the Bollingers and the pink - plus pink breaks - and every other read (session-band breaks, the candle reads, away-from-line off a session band, carried-band breaks) trades normally under all her other walls. Before: main refused everything that was not a rejection or a pink break, on gold too. The rejection book stays rejection-only at all hours; delayed unchanged.
- Files: src/lib/desk/bandlock.ts (+19/-12), src/lib/desk/engine.ts (+13/-6), tools/behaviour-umpire.cjs (+5/-5), tools/cornerstones.py (+1/-1), tools/slide-her-way-584.cjs (+4/-4)

## 169. NO VWAP WALL 2 TO 3PM (fix943, R550)
- When: 2026-11-07 15:05:16 -0800
- Commit: [35ce07d6](https://github.com/liluvdied/Aurelius/commit/35ce07d650fc77decfe6fd5ab4846eff44cd1ce0)
- Her words: Love Nov 7 2026 ~2:18 PM PT: "and remove the blue vwap as a wall thing from 2-3 pls"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix943 NO BLUE VWAP WALL 2-3 PM: the blue VWAP wall (fix397, no long under / no short over the unbroken VWAP when bands are small, her band tolerance since fix936) stands down from 2:00 to 2:59 PM PT - BTC and gold, main and rejection (the only books it judges; delayed never comes through here). Every other hour unchanged.
- Files: -

## 170. PINK SLIDE 44 CHECK BACK (fix944, R551)
- When: 2026-11-07 15:07:50 -0800
- Commit: [5b9cfb5c](https://github.com/liluvdied/Aurelius/commit/5b9cfb5c6c24e07a4e2b0d4d6ed501796aadd339)
- Her words: Love Nov 7 2026 ~2:23 PM PT: "turn it off then. but it needs to constitute what a pink slide is correctly hun a move up is not what a pink slide is" + 2:24 PM: "yes" (put her 44% check back) - her rule: Love Nov 1 2026 (R307): "The pink slide rule only applies in this case: Price has rejected the pink three times on the way down. And pink is in the bottom/top 33% of the channel. Only then are longs/shorts blocked ... In every other case the slide rule does nothing." + Nov 4 2:54 PM PT (fix646): "44% for main & rejection for now pls we will test that" + 6:04 PM: "lets lower the pink slide rule to 2 of them instead of 3 while pink is sloped up or down as well pls"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix944 HER PINK SLIDE 44% CHECK BACK: her slide / climb rule (R307, 2 rejections since Nov 4, 44% since fix646) applies only while the pink sits in the bottom 44% (slide - no longs) / top 44% (climb - no shorts) of its session channel. The check (pinkThird584) was dropped from all three holds by fix658 (Nov 4 6:46 PM) - it is wired back in, exactly as it was, nothing else changed. Every book but delayed. Today 2:08 PM: the 'climb' was two bounces at the bottom of a pink down-slide (pink low in its channel) - no climb, no hold.
- Files: -

## 171. PINK SLIDE NEAR COUNTS (fix945, R552)
- When: 2026-11-07 15:10:28 -0800
- Commit: [0ce000ac](https://github.com/liluvdied/Aurelius/commit/0ce000acbf9b73807d02aea62a2cb917a489cf89)
- Her words: Love Nov 7 2026 ~2:24 PM PT: "yes and it doesn't need to physically tap pink either, just come down to it and reverse back up more than once to be considered a pink slide" + 2:25 PM: "yes" (near = 10% of the channel) + 2:23 PM: "a move up is not what a pink slide is"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix945 NEAR THE PINK COUNTS: a pink slide / climb touch no longer needs a physical tap - price coming within 10% of its session channel of the pink and closing back away counts. It must happen more than once as separate returns: a touch counts again only after a candle closed outside that near zone in between (the same approach spread over two candles is one). Her 2 rejections on the slope and her 44% (288) are unchanged. Every book but delayed. Channel unreadable = a physical tap, as before.
- Files: -

## 172. WICK REJECTION 10 PERCENT PINK STAYS (fix937, R553)
- When: 2026-11-07 15:13:06 -0800
- Commit: [f6ee1bff](https://github.com/liluvdied/Aurelius/commit/f6ee1bff59fc98ddea87d57f62d3957f873af19a)
- Her words: Love Nov 7 2026 ~6:55 AM PT: "yes wick rejection gets in at a wick rejection of 10% of the channel width on instant" (her answer to: a wick rejection off a Bollinger / band still goes even if the pink is inside her 20%, or the pink wins) + 6:56 AM (to the read-back: 10% of the channel, on the instant, the pink 20% does not block a wick rejection, BTC and gold, every book but delayed): "your assumption is on point bb" + 6:54 AM: "ohhh my god she waited to short and then shorted attt the bollinger / instead of at the white wick rejection she went with yellow / no / we need to fix that not acceptable"
- Before: R381: fix693: her wick rejection without a flip (fix668) now needs price back off the band by 15% of the channel width (was 20%), BTC and gold, every book but delayed (the delayed book already keeps its flips). The tap distance (the 5m candle within 15% of the channel of the band) and every other wall are unchanged. Raw replay Oct 19 - Nov 5 on her session bands, pink and zones (before her other walls,  | R396: fix710 GOLD WICK IN DOLLARS: her wick rejection without a flip (fix668, 15% since fix693) is a fixed $1 on gold - the 5m candle's high came within $1 of the level and price is $1 back off it - instead of 15% of the channel (gold's σ swung $8-$50; 15% was ~$1.40 this week, $7 on a $50 day). BTC keeps 15% of the channel (its best setting). Every book but delayed (the delayed book still gets no waive
- After: fix937 HER WICK REJECTION AT 10%: a wick rejection (price wicks to / through a line and comes back) counts once price is 10% of the channel back off the wick's extreme (was 15%; gold too - 10% of its channel replaces her $1 / $1), the instant it is there (no candle flip / colour wait, as before). Her pink cushion (20%) and pink walls still judge it. Every book but delayed.
- Files: -

## 173. PINK POCKET 50 (fix938, R554)
- When: 2026-11-07 15:15:46 -0800
- Commit: [99925a52](https://github.com/liluvdied/Aurelius/commit/99925a5248e34d29d46972777fe4ecb5cea1f102)
- Her words: Love Nov 7 2026 ~7:00 AM PT: "ohhhh okay no we don't need to give her the 20% pink tolerance IF price is innnnside of the channel from pink to red bb / that's just so she doesn't drive into a brick wall , / if price is hovering inside here and it's tight like this she only needs 50% of the distance from red to pink okay" + 7:04 AM (to: does the mirror pink to green apply for longs, and any time price is in there or only when tight): "yes to 1 & 2 bb / anytime price is in there / and ehh yess you're right we should keep it the outer 55% / & pink always counts but -" + 7:05 AM: "you gave me 2 options there bb / the / pink always counts but - option" (her pick: the pink always counts, but inside the pocket she only needs 50% of the pink-to-red room, wick or not)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix938 HER PINK POCKET: while price is inside the pocket between the pink and the red zone (or the pink and the green zone, for longs), her pink clearance is 50% of that pocket instead of 20% of the session-band channel - on every pink wall (the pink cushion, her reach wall's pink, under / over the pink). Outside the pocket her one pink rule (20%) is unchanged. The pink always counts, wick rejections included. Her outer 55% to the zone (fix594) is separate and unchanged. Every book but delayed. Today 6:52:37 AM BTC: pocket $20.05 -> $10.03; her short $15.29 over the pink at 75,965.5 would have gone (she went at 75,945.8 at 6:53:05).
- Files: -

## 174. WICK USES CARRIED BANDS (fix946, R555)
- When: 2026-11-07 15:18:28 -0800
- Commit: [9eacd6cd](https://github.com/liluvdied/Aurelius/commit/9eacd6cda2639c54abd0fe0069dee2a289dab92f)
- Her words: Love Nov 7 2026 ~2:33 PM PT: "hun she is NOT entering on the wick rejections pls fix her she is still stilllll broken i am telling you" + 2:34 PM: "yes 10%" (her wick rejection at 10% of the channel) - after the 2 PM reset the fresh session bands are not on her list (her carried bands are), so the wick had no channel to measure
- Before: (the code as it was in the previous entry - see the diff)
- After: fix946 HER WICK USES HER CARRIED BANDS (and her 2:39 PM words, pinned by its proof: "make it just a wick at a bollinger or red/green zone pls 2-3" - a wick rejection there needs no flip or push): her wick rejection (290, 10% of the channel) measures its channel on the session bands; after the 2 PM reset the fresh session bands are not on her list (her carried bands are, fix612 / 617), so the wick had nothing to measure and never fired. With no fresh session bands, her carried bands (carried mid / +-1-3) are the wick's channel and count as wick lines. No rule changes. Every book but delayed. Today 2:30 PM BTC: the wick to ~75,713 off green, back to 75,778 - no read; now it reads the long.
- Files: -

## 175. CHANGE HISTORY BRANCH (fix948, R556)
- When: 2026-11-07 16:14:07 -0800
- Commit: [a8a93225](https://github.com/liluvdied/Aurelius/commit/a8a9322538c7454272b74f36ae2c4226479b26a2)
- Her words: Love Nov 7 2026 ~2:46 PM PT: "i want to set it up to have a branch of the git be a fulll code change history / where it was before and what we did / a clear chain from one to one"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix948 HER CHANGE HISTORY BRANCH: a new tool (tools/change-history.py) builds CHANGE-HISTORY.md - every install oldest to newest: the change, time, her own words (R), BEFORE (what it replaced), AFTER, the code files and a GitHub link to the exact diff; an UNDO links the change it undoes - and publishes it on its own branch 'change-history' on her GitHub (one commit per rebuild; her desk branch and working folder untouched; nothing from .secrets). RUN-ALL runs it in the background after every install - a failed push never blocks an install and never touches LIVE. No trading code changes.
- Files: src/lib/desk/bandlock.ts (+37/-1), src/lib/desk/bnblive940.ts (+4/-4), src/lib/desk/btclive899.ts (+4/-4), src/lib/desk/engine.ts (+4/-4), src/lib/desk/ethlive2.ts (+4/-4), src/lib/desk/ethlive831.ts (+6/-6), src/lib/desk/kalshi-live.server.ts (+10/-4)

## 176. CARRIED WICK NEEDS HER COLOUR (fix949, R557)
- When: 2026-11-07 16:17:09 -0800
- Commit: [381ae02a](https://github.com/liluvdied/Aurelius/commit/381ae02a1ee8bdda8df956fb42950b9bc932bfdb)
- Her words: Love Nov 7 2026 ~3:00 PM PT, her card pick "Keep, but need her colour" ("Carried bands stay tradeable, but a wick rejection off one needs the candle in her colour.") - to "How should she treat carried bands from yesterday?" after 2:56 PM: "whyyyyy did she short btc ?!?! it broke pink UP on a green candle !!!! there's no zone she's at dude she is so broken"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix949 A WICK OFF A CARRIED BAND NEEDS HER COLOUR: her carried bands (yesterday's session lines, fix617) stay tradeable, but a wick rejection off one no longer skips the candle check - the 2m or 5m candle must be her colour (green for a long, red for a short; the live candle, no close). Her real session bands, zones, Bollingers and the pink keep the wick-without-a-flip entry (fix668 / 290 / 292). Every book but delayed. Today 2:45:13 PM BTC: the short off carried -1 at 75,793 on green 2m and 5m candles would have waited.
- Files: -

## 177. PINK BREAK STILL HER WAY (fix950, R558)
- When: 2026-11-07 16:20:12 -0800
- Commit: [d01bb98f](https://github.com/liluvdied/Aurelius/commit/d01bb98f9589c1bd4a0b4f6dee505ea44bc88525)
- Her words: Love Nov 7 2026 ~3:17 PM PT: "she entered in 30 seconds after it broke up / it broke DOWN when she entered" + her card pick ~3:18 PM: "Candle in her colour too" (her colour lives in CHANGE-297)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix950 HER PINK BREAK STILL GOING HER WAY: at the last line before the order, a pink break (Break / Close above / below 5m PP) goes only while price has not already turned back by her break ($2 BTC / 25c gold) from its high (long) / low (short) of the last 5 seconds; if it has, she waits and goes again if it re-breaks. Every book but delayed. Today 3:15:21 PM BTC: the long went $2.95 under its 3:15:18 top and was back through the pink 7 seconds later - this waits. Her candle colour at entry is CHANGE-297.
- Files: -

## 178. HER COLOUR AND SIDE AT ENTRY (fix951, R559)
- When: 2026-11-07 16:23:16 -0800
- Commit: [f867c7a5](https://github.com/liluvdied/Aurelius/commit/f867c7a5cb67b1c0b34867a64dc5a32743e83d68)
- Her words: Love Nov 7 2026 ~3:24 PM PT: "DO NOT HAVE THEM SKIP EVERY WALL WHAT THE FUCK" + ~3:19 PM: "the candle ALWAYS NEEDS TO BE THE SAME COLOR. EVERY TIME. NO EXCEPTIONS. PRICE ON THE SAME SIDE OF THE BAND AT ENTRY. NO EXCEPTIONS. wick rejection is the ONLY instance she may enter without the candle our color." + 3:20 PM: "OH MY GOD. YES. ITS SUPPOSED TO BE REJECTED AT THE DOOR IF IT ISNT ON THE SAME SIDE."
- Before: (the code as it was in the previous entry - see the diff)
- After: fix951 HER COLOUR AND HER SIDE AT ENTRY: every entry - every label (rejections, breaks, taps, thirds, away-from-line, flips) and every book but delayed - is refused AT THE DOOR and again AT THE SEND unless (1) price is on the trade's side of the line it enters off (a long above it, a short below it; wick rejections too) and (2) the 2m or 5m candle is her colour at that second (flat is not her colour). The only colour exemption is a true wick rejection (fix668; off a carried band a wick still needs her colour, fix949). The send check comes before the akimbo / flip / away-from-line paths, and flips (fix819) and away-from-line takes (fix824) no longer skip her walls anywhere - the send, the copier's wall stamp and her slide / climb holds (her 3:24 PM words), and every add-on and every BTC / gold copy (BTC.2) is checked for her colour too. The ETH / BNB copies have no candle feed here yet (her BTC / gold feed only) - they are listed as open in the report.
- Files: -

## 179. ADD ONS AT THEIR OWN SIZE (fix953, R560)
- When: 2026-11-07 16:26:20 -0800
- Commit: [b103e38b](https://github.com/liluvdied/Aurelius/commit/b103e38b31fd04eaa475922ef4c8cf13758fb980)
- Her words: Love Nov 7 2026 ~3:26 PM PT: "fix the add on thing now pls let the add ons work as i set them" + 3:23 PM: "she is NOT. doing her add ons"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix953 HER ADD-ONS AT THEIR OWN SIZE: every add-on (main, rejection, the akimbo books, BTC.2, ETH.1 / ETH.2, BNB) goes in at the $ she set in her add-on boxes instead of being cut down to her entry size slider ($2 today cut her $3 / $5 add-ons to $2). Her $5 per-order cap, 1.5x floor, umpire, LIVE switch, entries on, the window side lock and the opposite-side guard all still hold. Entries (including the ETH / BTC.2 / BNB copies' entries) stay on her slider.
- Files: -

## 180. ADD ON NOT BURNED ON FAIL (fix954, R561)
- When: 2026-11-07 16:29:23 -0800
- Commit: [16215d56](https://github.com/liluvdied/Aurelius/commit/16215d56e7142d610290d5921ba353078003ee1f)
- Her words: Love Nov 7 2026 ~3:26 PM PT: "fix the add on thing now pls let the add ons work as i set them" + 3:23 PM: "she is NOT. doing her add ons"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix954 HER ADD-ON IS SPENT ONLY WHEN IT FILLS: ETH.1, ETH.2, BTC.2 and BNB marked their one add-on as used BEFORE sending it, so one refusal (ask moved, no cash, LIVE off) threw it away for that position. Now it is marked only when the add-on fills; a refused try waits 10 seconds and tries again while the position is open.
- Files: -

## 181. ETH1 ADD ON BETTER PRICE (fix955, R562)
- When: 2026-11-07 16:32:21 -0800
- Commit: [c241675d](https://github.com/liluvdied/Aurelius/commit/c241675d31e7e7464c4cbeb62c8efbc6dd242a5b)
- Her words: Love Nov 7 2026 ~3:26 PM PT: "fix the add on thing now pls let the add ons work as i set them" + 3:23 PM: "she is NOT. doing her add ons"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix955 ETH.1's ADD-ON AT A BETTER PRICE: ETH.1's add-on fired in the same second as her entry at the same price (4 times today). Like ETH.2 and BTC.2 (fix891), it now waits until the add-on side is at least 2c cheaper than her entry (a better multiple).
- Files: -

## 182. COPIES 66C CAP (fix956, R563)
- When: 2026-11-07 17:11:03 -0800
- Commit: [ab2badc8](https://github.com/liluvdied/Aurelius/commit/ab2badc8756830c28c6110cbbe3a11c7855ea220)
- Her words: Love Oct 30 2026 (R266, her kept card c37): "THE 1.5x FLOOR: no order under 1.5x (66c cap)" + Nov 7 3:24 PM PT: "DO NOT HAVE THEM SKIP EVERY WALL"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix956 HER 66c CAP ON THE COPIES AND ADD-ONS: ETH.1, ETH.2, BTC.2 and BNB entries and every add-on went out at up to 66.7c (1.499x) - just under her 1.5x floor. They now pay 66c at most, the same as main. Nothing else changes.
- Files: src/lib/desk/bandlock.ts (+3/-2), src/lib/desk/kalshi-live.server.ts (+1/-0)

## 183. AKIMBO FACES THE DOOR (fix959, R564)
- When: 2026-11-07 17:14:03 -0800
- Commit: [b80dba70](https://github.com/liluvdied/Aurelius/commit/b80dba706a998faae28a3fbe0ee6ba43b2f82b43)
- Her words: Love Nov 7 2026 ~3:24 PM PT: "DO NOT HAVE THEM SKIP EVERY WALL WHAT THE FUCK" + ~3:21 PM: "ITS SUPPOSED TO BE REJECTED AT THE DOOR IF IT ISNT ON THE SAME SIDE"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix959 AKIMBO FACES THE DOOR: the live-today / akimbo books (BESTIE etc., off today) used to skip her door entirely - no colour, no same side, no pink, no bands. If you turn them on, they now meet the same door as main. Nothing else changes; delayed is untouched.
- Files: -

## 184. NOTHING WAITING SAYS LIVE OFF (fix957, R565)
- When: 2026-11-07 17:17:14 -0800
- Commit: [c7f1b566](https://github.com/liluvdied/Aurelius/commit/c7f1b5666f73d3222938683a9ff158eaae253f34)
- Her words: Love Nov 7 2026 ~3:29 PM PT: "not ready" (her RUN-ALL said "Nothing waiting" and LIVE was left off from 3:29 PM - her ETH wick at 3:32 PM was refused "the live switch is off") + 3:31 PM: "i need to keep them on"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix957 RUN-ALL TELLS YOU LIVE IS OFF: when RUN-ALL finds nothing waiting and LIVE is off (you turned it off for the install), it now says so in big letters: turn LIVE back on. It still never touches LIVE itself. Nothing else changes.
- Files: -

## 185. XRP 5M POLY NOV3 MAIN (fix961, R566)
- When: 2026-11-07 17:45:54 -0800
- Commit: [3e0cc61e](https://github.com/liluvdied/Aurelius/commit/3e0cc61edbf2fbb3c6c5adf44469cbef32226d67)
- Her words: Love Nov 7 2026 ~5:13 PM PT: "for now let's get the xrp 5M book set up / just put it on the nov 3 save point and we'll see how she does on the first couple windows" + "main" + "it's on poly" + "no , live pls"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix961 XRP 5M ON POLYMARKET (LIVE, $1): her own XRP lane on Polymarket's 5-minute XRP up/down markets, using MAIN'S NOV 3 MODEL: rejections off her session bands / zones / Bollinger with her 2m or 5m candle her colour, her pink break and failed pink break, with the Nov 3 walls (thirds, past the zone, pink-to-zone 45%, pink cushion). Her lines come from Coinbase XRP-USD 1m; dollar numbers scaled to XRP's price. 5-minute windows: once per window, never in its last minute. $1 a trade (half her $2 slider), through the desk's Polymarket buy: umpire SAFE, LIVE on, the $ cap, 66c (1.5x), cash. No add-ons in this first version. Turn off: data/xrp5m-961-cfg.json on:false.
- Files: src/lib/desk/bandlock.ts (+14/-0), src/lib/desk/bnblive940.ts (+2/-2), src/lib/desk/engine.ts (+2/-0), src/lib/desk/kalshi-live.server.ts (+1/-1), src/lib/desk/recon.ts (+2/-1), src/lib/desk/xrp5m961.ts (+112/-0)

## 186. BTC BOLLINGER 25 WALL (fix962, R567)
- When: 2026-11-07 17:49:08 -0800
- Commit: [c6828516](https://github.com/liluvdied/Aurelius/commit/c6828516894848323cf66522ba0e1db27bad4ca2)
- Her words: Love Nov 7 2026 ~5:17 PM PT: "she entered properly on btc just now hun. but she entered in right above a bollinger. we need to make it a $25 wall in front of those" + 5:19 PM: "melted immediately. and yes the middle counts as a wall and as an entry. if it starts losing we will take it off but so far ignoring the middle has been very bad"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix962 / fix963 HER BOLLINGER MIDDLE + $25 BOLLINGER WALL (BTC): the Bollinger MIDDLE is now one of main's entry lines (rejections off it, same triggers as her other lines), and no short when a Bollinger line (upper, middle or lower) is $25 or less below price, no long when one is $25 or less above - unless she is entering OFF that Bollinger (her rejection there is her setup) or price already broke it by her break. One switch takes the middle back out. Every book but delayed; gold unchanged.
- Files: -

## 187. BNB ADD ONS ON (fix964, R568)
- When: 2026-11-07 17:52:10 -0800
- Commit: [47244ffe](https://github.com/liluvdied/Aurelius/commit/47244ffed70f7eb58037bd8e66cf8e8987e985b1)
- Her words: Love Nov 7 2026 ~5:20 PM PT: "she IS NOT doing her add ons. please fix that" (BNB 15m UP open at 11.76x with no add-on) + 3:26 PM: "fix the add on thing now pls let the add ons work as i set them"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix964 HER BNB ADD-ON: BNB's live copy was built with no add-on. Now, like ETH.2 and BTC.2, it adds $3 once its side pays 2.8x (once per position, spent only when it fills), through her add-on route: $5 cap, umpire SAFE, LIVE on, the window side lock and the opposite-side guard all still hold.
- Files: -

## 188. ADD ONS FIRE AS SET (fix967, R569)
- When: 2026-11-07 17:55:13 -0800
- Commit: [83dc78d2](https://github.com/liluvdied/Aurelius/commit/83dc78d278b3d877769a476ae1867d58b65c89d0)
- Her words: Love Nov 7 2026 ~5:20 PM PT: "hun she IS NOT doing her add ons. please fix that" + 3:26 PM: "fix the add on thing now pls let the add ons work as i set them" + 3:17 PM: "wick rejection is the ONLY instance she may enter without the candle our color" (her colour is an ENTRY rule)
- Before: (the code as it was in the previous entry - see the diff)
- After: fix967 HER ADD-ONS FIRE AS SHE SET THEM: since 4:11 PM her colour check (297) also ran on add-ons, so an add-on at her 2.8x (price moved against her, candle not her colour) was refused - 14 times at 5:07 PM on BTC. Her colour rule is for ENTRIES; it stays on every entry, including the BTC / gold copies. Add-ons go at her multiple again with every other rail ($5 cap, umpire, LIVE, side lock, opposite guard).
- Files: -

## 189. MOMENTUM HER COLOUR AND ZONE (fix965, R570)
- When: 2026-11-07 18:00:11 -0800
- Commit: [14a31696](https://github.com/liluvdied/Aurelius/commit/14a316962a4d88e0d0a12f74f65adf34c0c61586)
- Her words: Love Nov 7 2026 ~5:38 PM PT, her card pick "Price just back over it" + ~5:34 PM PT: "not the middle hun. just back over the bollinger" + ~5:22 PM PT: "okay no fix the color issue on momentum. 2M or 5M must be her color unless it is a wick rejection. even if a 1m closed above pink. and she was in the red zone over pink when she longed." + 5:32 PM: "dude momentum is very broken it's backwards in its logic / bnb broke the bollinger DOWN and she entered long"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix965 MOMENTUM NEEDS HER COLOUR + NO LONG IN THE RED ZONE: every momentum entry (the coin books - BNB, SOL, DOGE, BTC first-2 - and BTC / gold momentum; the BNB live copy and the Polymarket momentum copy follow those rows) now needs her 2m OR 5m candle her colour (price past that candle's open her way); a 1m close over or under pink alone is no longer enough. And no long at or past the red zone above pink, no short at or past the green zone below pink (main's inside-the-zone wall). And after a 5m closes under the Bollinger lower (last 15 min), no long until price is back over the Bollinger lower; after a close over the upper, no short until back under the upper (the coin books, from their own Coinbase 5m Bollinger 20/2). Refusals log to data/momentum-colour-965.jsonl.
- Files: src/lib/desk/bnblive940.ts (+11/-2), src/lib/desk/btclive899.ts (+10/-1), src/lib/desk/ethlive2.ts (+10/-1), src/lib/desk/ethlive831.ts (+10/-1), src/lib/desk/momcoins833.ts (+19/-1), src/lib/desk/momentum.ts (+10/-0)

## 190. ADD ONS FROM HER SETTINGS (fix969, R571)
- When: 2026-11-07 18:03:34 -0800
- Commit: [18028d9c](https://github.com/liluvdied/Aurelius/commit/18028d9cbda8706c5aeacdb9324278453859b172)
- Her words: Love Nov 7 2026 ~5:42 PM PT: "hun pls let it run my add ons i have set in the settings. make it unilateral" + 5:40 PM: "ADD ONS DO NOT COUNT FOR CANDLE COLOR." + 3:26 PM: "let the add ons work as i set them"
- Before: (the code as it was in the previous entry - see the diff)
- After: fix969 HER ADD-ON BOXES ON EVERY COPY: ETH.1, ETH.2, BTC.2 and BNB now take their add-ons ONLY from her add-on settings (add-on 1 / 2 / 3: on, $, multiple - today $3 at 2.8x, $5 at 4.4x, $2 at 8.8x). Each box once per position at its multiple, a better price than her entry, spent only when it fills, $5 an order, through her add-on route; no colour check on add-ons. Main and rejection already read her boxes. Their own per-book add-on numbers (ETH.1 $5, ETH.2 / BTC.2 / BNB $3) are no longer used.
- Files: -

## 191. ADD ONS WHOLE CENTS (fix987, R572)
- When: 2026-11-07 18:50:57 -0800
- Commit: [2875d588](https://github.com/liluvdied/Aurelius/commit/2875d588194211a4e9f2065d54fc2e8c80d0e109)
- Her words: Love Nov 7 2026 ~6:37 PM PT: "hun again she is not doing her add ons pls make sure everything i asked you for is FUNCTIONAL before shipping anything and saying it's done" (6:08:47 PM: her BTC add-on 2 at 4.4x went to Kalshi at "0.2273" and Kalshi refused it "invalid price")
- Before: (the code as it was in the previous entry - see the diff)
- After: fix987 HER ADD-ONS IN WHOLE CENTS: her add-on 2 (4.4x) and add-on 3 (8.8x) caps are 22.727c and 11.36c; when the ask sat just under the cap the desk sent the raw cap ("0.2273") and Kalshi refused it as an invalid price (6:08:47 and 6:08:53 PM tonight, BTC). Every add-on price is now rounded down to a whole cent under her cap (22c / 11c), so it goes. Nothing else changes.
- Files: src/lib/desk/kalshi-live.server.ts (+5/-4)

