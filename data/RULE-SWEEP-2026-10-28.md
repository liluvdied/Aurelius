# Rule sweep - main + rejection (Oct 28 2026, ~8:55 PM PT) - FIRST PASS, read only, nothing changed

The standard (Love 8:52 PM PT: "it got taken out ======= not there"): a rule is IN FORCE only when a behaviour replay proves she obeys it. Code that is there but doesn't stop the trade = OFF or PARTLY. So this file only says IN FORCE where a replay exists. Everything else is marked UNVERIFIED until it gets its own replay.

## A. IN FORCE - proven by a replay (umpire runs these every time)
- Your $1.50 wall + pink 15% of the channel + $1.50 zones (fix429/430): tools/reach-test-429.cjs - the 7:40 PM gold long refused.
- Stale calls never fire, even while retrying (fix431) + never long under an unbroken pink (fix432): tools/stale-pink-test-431.cjs.
- Downslope under pink - gold and BTC (fix371/403/423): tools/slide-test.cjs, slide-test-btc.cjs.
- A call she never took never holds her; a real fill does (fix336/340/341): tools/free-to-trade-test.py.
- STAGED, not installed yet (Mac blocks installs): her flip 2-5m + main zone flip (fix433) tools/flip-test-433.cjs; on her side of the break / her 33% (fix434) tools/side-test-434.cjs.

## B. OFF - the code is there but switched off (file:line, how, when)
1. Your $1.50 / $50 reach wall + zone reach for every OTHER book - bandlock.ts:531 REACH_RETIRED - card "Retire both reach walls", Oct 20 9:33 PM. (Main + rejection have it back via fix429.)
2. Trend through the bands wall - bandlock.ts:2797 - card "Drop it", Oct 22 7:34 PM (fix106).
3. Bollinger bounce in her candle ($75, BTC) - bandlock.ts:2719 - card "Drop it", Oct 24 10:20 PM (fix178).
4. 2-hour cutoff on the carried session bands - bandlock.ts:1938 - card "Keep the carry until they widen", Oct 24 (fix164).
5. PINK FIRST - bandlock.ts:2563 - replaced by PINK 10% on your typed words Oct 22 3:48 AM (fix62).
6. 3 PM channel of pink / R1-S1 / Bollinger - bandlock.ts:77 - replaced by session bands only, card Oct 23 3:21 PM (fix153/fix24).
7. Main's re-aim wall check - recon.ts:490 - card + your 1:43 PM words Oct 26 (fix285).
(Twin / 5M / lab switches - recon.ts:744 fix129, recon.ts:701 fix308, engine.ts:3285 fix211, stoplab.ts:34 fix304, fns.ts:2062 fix93 - not main/rejection.)

## C. REQUEST BOOK - proof missing today (from tools/requests.py check)
- retire-R108.json: the book and its 1:1 copy differ - restore with: tools/requests.py restore
- R048 (Pure no-pink (recon-np): pink holds her only when pink is stacked with a session band in the outer 10% of the channel; otherwise rejections go straight through (no copy $33 / 33c / pink-to-red/green walls for her). Door + wire + recon (fix363)): proof missing {"code": "src/lib/desk/recon.ts", "has": "const stackN ="}
- R051 (No-pink copy never takes a thirds flip (" - seen as a short/long " labels) - the copy part of R049, kept as is (fix364)): proof missing {"code": "src/lib/desk/recon.ts", "has": "!/ - seen as a (short|long) /.test(String(srcP.label))"}
- R052 (No-pink copy only: a fake-out turn no longer skips her 1-5m flip; BTC Bollinger-over/under-the-band wall $75 for the copy (others $50) (fix366)): proof missing {"code": "src/lib/desk/bandlock.ts", "has": "!(foTurn && npPink) /* fix366"}
- R052 (No-pink copy only: a fake-out turn no longer skips her 1-5m flip; BTC Bollinger-over/under-the-band wall $75 for the copy (others $50) (fix366)): proof missing {"code": "src/lib/desk/bandlock.ts", "has": "bU - below <= (togpLoose && !npPink ? 75 : 50)"}
- R058 (fix372: recon-sov = SOVEREIGN paper twin: own bonesDecide read on the rejection board (session, pink, zones, Bollinger) rejections-only + 1-5m flip; re-aims unfilled calls; paper only, overnight test.): proof missing {"code": "src/lib/desk/recon.ts", "has": "book(\"recon-sov\""}
- R068 (fix381: recon-np (pure no-pink) holds the Kalshi BTC seat every hour main/rejection/copy held (npLive.hoursByAsset.btc 0-23, yieldToTwin: the DELAYED twin keeps its BTC hours); gold stays main/rej/copy, recon-np gold only 9 PM; $3 + $5. Switched on at 10:30:00 AM PT boundary.): proof missing {"code": "src/lib/desk/engine
- R068 (fix381: recon-np (pure no-pink) holds the Kalshi BTC seat every hour main/rejection/copy held (npLive.hoursByAsset.btc 0-23, yieldToTwin: the DELAYED twin keeps its BTC hours); gold stays main/rej/copy, recon-np gold only 9 PM; $3 + $5. Switched on at 10:30:00 AM PT boundary.): proof missing {"config": "data/live-switch.
- R073 (fix387: pure no-pink (recon-np) also takes main reads worded Tap-reject at <session band / red or green zone / Bollinger>; her other rules unchanged. Her book only.): proof missing {"code": "src/lib/desk/recon.ts", "has": "fix387"}
- R076 (fix389: recon-npo = PURE NO-PINK WITH HER OWN EYES, PAPER: every tick she runs the engine read (bonesDecide, rejections only) on her own board - session VWAP/sigmas, red/green zone, Bollinger, never pink/pivots/purple/nav - with the pure no-pink pink-stack check and a 1-5m flip her way. Paper only; live seat (recon-np) u
- R077 (fix389b: LIVE pure no-pink (recon-np) also books her own band read (the recon-npo read: session bands, zones, Bollinger, rejections only, 1-5m flip, pink check) - first read in a window wins. Undo on Love words = remove the fix389b line. recon-npo stays as the paper record of her own eyes alone.): proof missing {"code": 
- R079 (fix391: the pure no-pink own-eyes read (fix389/389b) never books a thirds read (Candle rising/falling, Launched from the top/bottom third) - band taps/rejections/failed breaks only): proof missing {"code": "src/lib/desk/recon.ts", "has": "!/third/i.test(lb9)"}
- R081 (fix393: live-switch addOn.maxAsk 0.263 -> 0.357 (first add-on at first band touch at 2.8x+) for main, rejection, copy, sovereign, pure no-pink; delayed twin (addOn.twin) and Polymarket/5M untouched): proof missing {"config": "data/live-switch.json", "path": "addOn.maxAsk", "eq": 0.357}
- R082 (fix394: bonesDecide zoneFlip param - green zone long / red zone short read passes on any 1-5m candle flipped her way (anyFlipNow), not only the 5m candle; on for main lookT (recon.ts 588) and the pure no-pink own-eyes read (669). Copy/twin follow main calls; rejection + sov own reads unchanged): proof missing {"code": "s
- R083 (fix395: pure no-pink HER OWN TAPS - recon.ts block after fix389b: price taps one of her bands (σ/VWAP/Bollinger/green zone longs/red zone shorts) within BTC $10 / gold 50c this 5m candle, not broken through, pushes off her tap, any 1-5m flip her way -> her own Tap-reject call (recon-np live + recon-npo paper); 5m open i
- R084 (fix396: pure no-pink own taps (fix395) fire only while price is within half the distance from the tapped band to the next line her way): proof missing {"code": "src/lib/desk/recon.ts", "has": "const half96"}
- R086 (fix398: pure no-pink off BTC Kalshi (npLive.hoursByAsset.btc = []), rejection model (recon-rej) holds BTC every hour (offHourMain.rejHoursByAsset.btc 0-23). fix398Prev saved. Gold untouched. Pure keeps paper): proof missing {"config": "data/live-switch.json", "key": "npLive.hoursByAsset.btc", "equals": []}
- R088 (fix400: pure no-pink (recon-np) off the gold Kalshi live seat too (npLive.hoursByAsset.gold = []), paper keeps running): proof missing {"config": "data/live-switch.json", "key": "npLive.hoursByAsset.gold", "equals": []}
- R089 (fix400: sovLive.on false - the no-pink copy holds gold rejection hours again): proof missing {"config": "data/live-switch.json", "key": "sovLive.on", "equals": false}
- R090 (fix401: pure no-pink (recon-np, recon-npo) + sovereign (recon-sov) book only with a 2/3/4/5m flip her way (anyFlip2Now, no 1m), main walls via impossibleGeo (pure zone 0.5, sov 0.4), blue VWAP half-width check while bands small; refusals -> data/pure-walls.jsonl): proof missing {"code": "src/lib/desk/recon.ts", "has": "f
- R091 (fix402: $5 entry (liveBook.dollars, offHourMain.dollars, live-size) for main/rej/copy; add-ons unchanged): proof missing {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 5}
- R092 (fix402: one $5 add-on only - addOn.second.on false (first add-on $5 at 2.8x stays)): proof missing {"config": "data/live-switch.json", "key": "addOn.second.on", "equals": false}
- R093 (fix403: fix371 hold needs no pink touch; sticky until a 25c break over pink): proof missing {"code": "src/lib/desk/engine.ts", "has": "fix403: no touch needed"}
- R094 (fix404: recon-b2 PAPER lane - tight bands (blueSmall399), price blew through band A, rejected off the next band B, 2/3/4/5m flip + main walls (fix401 gate)): proof missing {"code": "src/lib/desk/recon.ts", "has": "THE 2ND-BAND FLIP (fix404"}
- R095 (fix405: liveSkipHours btc + [0,21,23], gold + [20] - every Kalshi book sits those hours out live (paper keeps measuring); Poly untouched): proof missing {"config": "data/live-switch.json", "key": "liveSkipHours.gold", "equals": [4, 9, 20]}
- R096 (fix406: CORNERSTONE #1 HER FLIP = 2/3/4/5m (no 1m) - anyFlipNow + anyFlipMinNow loops [2,3,4,5]; HER FLIP message text): proof missing {"code": "src/lib/desk/bandlock.ts", "has": "if (flipRule) { if (!why && !foTurn && !anyFlipNow(asset, side, tick))"}
- R098 (fix408: recon-og = PAPER book rebuilt from grok v1 elements (desk-project/src/lib/desk/vwap.ts): rolling 60-min VWAP + half-sigma bands 0.5-3 on 1/2/3/4/5m frames, tap-reject only (came from that side, tagged, not broken, pushed off), through the same guard as pure (fix401 gate: main walls + 2-5m flip + blue check)): pro
- R101 (fix411: HELD ON HER SIDE at the door - main/rej/copy: every wall (impossibleGeo) must also pass at the least-favourable price of the last 3 s (one-tick spike through pink can no longer count as the break). Breaks still instant otherwise.): proof missing {"code": "src/lib/desk/bandlock.ts", "has": "fix411"}
- R102 (fix412: the rejection model (recon-rej) takes the live seat back from the no-pink copy in every rejection hour, both assets (offHourMain.rejSeatHours 0-23; fix412Prev keeps the old list). The copy stays paper.): proof missing {"config": "data/live-switch.json", "key": "offHourMain.rejSeatHours", "equals": [0, 1, 2, 3, 4,
- R129 (fix433 item 1: fix394 back for MAIN only - bonesDecide zoneFlip: a green-zone long / red-zone short read passes on any 2/3/4/5m candle flipped her way (anyFlipNow, 2-5m after item 7), not only the 5m. Pure no-pink part not restored (not live). 8:45 PM PT boundary.): proof missing {"code": "src/lib/desk/recon.ts", "has": 
- R130 (fix433 item 2: already in her - slideHold403 is identical to before the 6:45 PM restore (back via fix423 at 7:18 PM, main + rejection, gold + BTC); the 'fix403: no touch needed' label is put back so the request book can see it.): proof missing {"code": "src/lib/desk/engine.ts", "has": "fix403: no touch needed"}
- R131 (fix433 item 3: offHourMain.rejSeatHours 0-23 back in live-switch. The no-pink copy is off live (fix421), so the rejection model already holds every rejection hour; the setting is restored as it was.): proof missing {"config": "data/live-switch.json", "key": "offHourMain.rejSeatHours", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8
- R132 (fix433 item 4: offHourMain.rejHoursByAsset btc 0-23, gold [0,1,2,3,4,7,9,14,16,17,18,21,22,23] (old lists kept in fix433Prev). Live sit-out hours (liveSkipHours) still win.): proof missing {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.btc", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
- R132 (fix433 item 4: offHourMain.rejHoursByAsset btc 0-23, gold [0,1,2,3,4,7,9,14,16,17,18,21,22,23] (old lists kept in fix433Prev). Live sit-out hours (liveSkipHours) still win.): proof missing {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.gold", "equals": [0, 1, 2, 3, 4, 7, 9, 14, 16, 17, 18, 21, 22
- R134 (fix433 item 7: anyFlipNow + anyFlipMinNow back to 2/3/4/5m (no 1m) as before the restore (main Bollinger/zone reads, paper fires, no-pink copy paper). The door flip for main + rejection was already 2-5m (anyFlip406Now, fix424).): proof missing {"code": "src/lib/desk/bandlock.ts", "has": "fix406 back as fix433"}
- R140 (fix434: ON HER SIDE OF THE BREAK, her 33% - main + rejection: her 33% channel runs session band to session band, and a band only counts as passed when price is NOW 33c gold / $6 BTC through it (or bouncing off it); long in the top 33% / short in the bottom 33% = refused. No hold, no timer. Behaviour test tools/side-test-
- R140 (fix434: ON HER SIDE OF THE BREAK, her 33% - main + rejection: her 33% channel runs session band to session band, and a band only counts as passed when price is NOW 33c gold / $6 BTC through it (or bouncing off it); long in the top 33% / short in the bottom 33% = refused. No hold, no timer. Behaviour test tools/side-test-
(Your picks tonight already cover most of these: 1-5 back for main/rejection, 9 off live, 10-12 back on paper, 13 kept, the 3-second hold out.)

## D. YOUR WORDS IN THE DIARY WHOSE RULE I CAN'T FIND IN HER CODE TODAY - main/rejection, UNVERIFIED (each needs a replay; some may have been replaced by a later rule of yours)
8. fix64 (Oct 22 5:29 AM, "she doesn't long into the top 25% of the channel between the pink band and the red" + card top 40%): gold - no long in the top 40% of pink -> red.
9. fix75 (Oct 22 7:23 AM, "let's also only have her short off of a pink band into a red..."): pink rejection needs the 5m candle red for a short / green for a long.
10. fix83 (Oct 22 11:02 AM, "she's supposed to wait for a green candle off of it or to trade the break"): pink rejections need a real candle flip (BTC $10 / gold 30c past the 5m open).
11. fix88 (Oct 22 1:20 PM, "the distance should be measured as the distance between the green zone and the pink line / if that distance is over $3 she is clear"): gold pink cushion measured band-to-pink.
12. fix94 (Oct 22 5:18 PM, "Yes, both guards"): the 1m rejection waiver only counts inside the current 5m candle.
13. fix74 (Oct 22 7:19 AM, "she doesn't take a trade with a band within $1.50 of the target on gold / same for pink"): no trade into a band/pink between price and the target or within $1.50 of it.
14. fix91 (Oct 22 1:52 PM, "the target was within $1 of a bollinger, let's put the $1.50 til in place for those as well"): the $1.50 target rule counts the Bollinger.
15. fix72 (Oct 22 7:07 AM, "the bollinger was within $100 of the band it broke / let's include that for longs and for the shorts"): BTC Bollinger $100 over/under the band, longs + shorts.
16. fix328 / fix297 (Oct 26 10:20 PM): ZONES REJECTION ONLY - "Failed break above Green zone - rejected down" / "Failed break below Red zone - rejected up" can't trade.
17. fix330 / fix310 (Oct 27 2:11 AM): gold ZONE CLEARANCE $3 - break into a zone only refused when the zone is under $3 away.
18. fix61 (Oct 22 3:34 AM): BTC PINK 10% replaces PINK FIRST.
Each of 8-18: Back / Leave. I'll replay each one before telling you it's in or out.

## E. Everything else
253 of your diary fixes have their tag in her code and 32 are settings - but by your standard they are UNVERIFIED until each has a replay. Next pass: replays, starting with whatever you mark Back.
