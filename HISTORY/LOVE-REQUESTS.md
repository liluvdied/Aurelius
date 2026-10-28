# Love's request book (Cornerstone #1)

Append-only and hash-chained (data/LOVE-REQUESTS.jsonl). Rebuilt on every umpire run. A request leaves only on Love's own words.

## R080 - fix392: pure no-pink BTC PINK TO GREEN / PINK TO RED zoneGuard 0.5 (no short in bottom 50% green->pink, no long in top 50% pink->red); main + rejection stay 0.4
- when: 2026-10-28T20:54:48+00:00
- Love: "Love Oct 28 2026 1:53 PM PT: "and again hun she shorted btc closer to the green than the pink" + 1:54 PM PT card "Make BTC's no-short zone the bottom 50% from green to pink?" -> "Pure no-pink only, 50%""
- books: p, u, r, e,  , n, o, -, p, i, n, k,  , o, n, l, y,  , (, r, e, c, o, n, -, n, p, ), ;,  , m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , c, o, p, y, ,,  , s, o, v, ,,  , t, w, i, n, ,,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix392"}

## R079 - fix391: the pure no-pink own-eyes read (fix389/389b) never books a thirds read (Candle rising/falling, Launched from the top/bottom third) - band taps/rejections/failed breaks only
- when: 2026-10-28T20:51:31+00:00
- Love: "Love Oct 28 2026 1:42 PM PT card "Stop the pure no-pink from taking thirds reads?" -> "Yes, band reads only" + 1:49 PM PT: "yes but can you do replays on the new taps and see how she does in comparison bb?""
- books: p, u, r, e,  , n, o, -, p, i, n, k,  , o, n, l, y,  , (, r, e, c, o, n, -, n, p,  , l, i, v, e,  , +,  , r, e, c, o, n, -, n, p, o,  , p, a, p, e, r, ), ;,  , m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , c, o, p, y, ,,  , s, o, v, ,,  , t, w, i, n, ,,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "!/third/i.test(lb9)"}

## R078 - fix390: pure no-pink (recon-np) meets MAIN walls at the door, the paper sweep and the wire (impossibleGeo flags as main: flipRule, noBBTarget, zoneGuard 0.4; no copy/np-only walls, npPink false) - main sliding pink scale, cushions, tolerances. Her calls stay pure no-pink.
- when: 2026-10-28T20:11:26+00:00
- Love: "no just make her have the same cushions and band tolerances and everything and she should be good hun + card Give the pure no-pink main's pink cushion on BTC? -> Main's sliding scale for her"
- books: recon-np
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix390"}

## R077 - fix389b: LIVE pure no-pink (recon-np) also books her own band read (the recon-npo read: session bands, zones, Bollinger, rejections only, 1-5m flip, pink check) - first read in a window wins. Undo on Love words = remove the fix389b line. recon-npo stays as the paper record of her own eyes alone.
- when: 2026-10-28T20:05:46+00:00
- Love: "and you can put her on that now, we will put her back where she is is she doesn’t do well on it okay :)) would have worked this short too so let’s give her the ability to do that okay bb"
- books: recon-np
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix389b"}

## R076 - fix389: recon-npo = PURE NO-PINK WITH HER OWN EYES, PAPER: every tick she runs the engine read (bonesDecide, rejections only) on her own board - session VWAP/sigmas, red/green zone, Bollinger, never pink/pivots/purple/nav - with the pure no-pink pink-stack check and a 1-5m flip her way. Paper only; live seat (recon-np) untouched until Love says.
- when: 2026-10-28T20:05:02+00:00
- Love: "yess that’s what i was sayin earlier i want to give her her own taps ok :) + (to: let the pure no-pink read the bands herself every tick, the way the sovereign twin does: session bands, zones, Bollinger, never pink; paper-test first)"
- books: recon-npo (new paper)
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "recon-npo"}

## R074 - fix384 stays: $10 entry + $5 + $5 add-ons on main, rejection, copy, sovereign, pure no-pink (delayed twin + 5M unchanged). Lower entry / bigger add-ons ($2.50/$7/$5) only if she underperforms on the new schedule, on Love words.
- when: 2026-10-28T19:20:27+00:00
- Love: "oh i meant let’s keep the $10 / $5 / $5 for the moment bb , and we can adjust to the lower entry and double downed-add ons if she isn’t performing well on her new schedule"
- books: recon-tog, recon-rej, recon-togp, recon-sov, recon-np
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 10}
- proof: {"config": "data/live-switch.json", "key": "addOn.second.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "bookDollars.recon-np", "equals": 10}

## R075 - fix388: pure no-pink holds the Kalshi BTC seat every hour - the delayed twin sits out all BTC hours live on Kalshi (bookSkipHoursByAsset.btc.recon-dly = 0-23). Polymarket untouched (polyTwin reads the combined bookSkipHours).
- when: 2026-10-28T19:20:27+00:00
- Love: "and yes, pure no pink for btc always pls"
- books: recon-np btc, recon-dly btc (Kalshi only)
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "bookSkipHoursByAsset.btc.recon-dly", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}

## R072 - fix386: $2.50 entry, $7 first add-on, $5 second add-on for main, rejection, no-pink copy, sovereign twin, pure no-pink (Kalshi). Delayed twin + Poly 5M unchanged. Supersedes fix384 $10/$5/$5.
- when: 2026-10-28T19:17:23+00:00
- Love: "we will run it at this configuration for a bit, and adjust if we need to / i had that thought too / to double down on the add ons / and keep her initial entries small + card -> $2.50 / $7 / $5"
- books: recon-tog, recon-rej, recon-togp, recon-sov, recon-np
- status: RETIRED - Love: "oh i meant let’s keep the $10 / $5 / $5 for the moment bb , and we can adjust to the lower entry and double downed-add ons if she isn’t performing well on her new schedule"
- proof: {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 2.5}
- proof: {"config": "data/live-switch.json", "key": "addOn.dollars", "equals": 7}
- proof: {"config": "data/live-switch.json", "key": "addOn.second.dollars", "equals": 5}

## R073 - fix387: pure no-pink (recon-np) also takes main reads worded Tap-reject at <session band / red or green zone / Bollinger>; her other rules unchanged. Her book only.
- when: 2026-10-28T19:17:23+00:00
- Love: "yesss pls let her take tap rejects on her own bb"
- books: recon-np
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix387"}

## R071 - fix384: $10 entry, $5 first add-on, $5 second add-on for main, rejection, no-pink copy, sovereign twin and pure no-pink (Kalshi). Delayed twin ($2.50 + $5) and Poly 5M ($7.50, frozen) unchanged. Config: maxDollars 10, live-size dollars 10, liveBook.dollars 10, offHourMain.dollars 10, addOn.dollars 5, offHourMain.addOn.dollars 5, addOn.second.dollars 5 (+recon-np), bookDollars.recon-np 10. Code: engine second add-on no longer hard-excludes the pure no-pink (addOn.second.books decides).
- when: 2026-10-28T18:57:48+00:00
- Love: "yeah she’s no longer operating on an unsafe framework so i would be comfortable bringing her up to a steady baseline / let’s do $10 with the $5 add on and the second $5 add on / for everything except the delayed entry model & 5M book pls bb"
- books: recon-tog, recon-rej, recon-togp, recon-sov, recon-np
- status: RETIRED - Love: "we will run it at this configuration for a bit, and adjust if we need to / i had that thought too / to double down on the add ons / and keep her initial entries small + card -> $2.50 / $7 / $5"
- proof: {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 10}
- proof: {"config": "data/live-switch.json", "key": "addOn.second.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "bookDollars.recon-np", "equals": 10}

## R070 - fix383: gold seat map. Pure no-pink live gold 1, 4, 7, 9 AM, 8 PM, 9 PM (npLive.hoursByAsset.gold). Sovereign twin (recon-sov) takes gold rejection hours live in place of the no-pink copy (sovLive, engine copier seat, kalshi-live gates, LANE_BOOK), sized like the copy. Main gets gold 8 AM (8 out of gold rejection hours and recon-tog gold skip list). BTC unchanged (pure no-pink every hour). Applied at 11:15 AM PT window boundary.
- when: 2026-10-28T18:15:39+00:00
- Love: "let's put her on the pure no pink for the best hours , and the sovereign twin for golds other rejection hours, and keep her on main for mains best hours on gold ok"
- books: recon-np gold, recon-sov gold, recon-tog gold, recon-togp gold (gives up rejection hours), recon-rej (none)
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "npLive.hoursByAsset.gold", "equals": [1, 4, 7, 9, 20, 21]}
- proof: {"config": "data/live-switch.json", "key": "sovLive.on", "equals": true}
- proof: {"code": "src/lib/desk/engine.ts", "has": "THE SOVEREIGN TWIN trades live only in gold"}

## R069 - fix382: Poly 5M walls (bandlock5m.ts) = bandlock.ts as of 4:57 AM PT Oct 27 (her 65% stretch, with fixes 295-315), timers stripped; her calls (recon-rej5), $7.50 and skip hours unchanged. fix339 set kept in data/bandlock5m.ts.fix339.bak. 5M re-frozen on Love card words.
- when: 2026-10-28T17:34:39+00:00
- Love: "can you look into the poly 5M book hun? she's been losing way more than she was / did she shift by accident somehow? it's okay if she did bb let's just get her back where she was oki + let's put her back where she was first + card Put the 5M back on her Tuesday 4:57 AM walls? -> Yes, 4:57 AM walls, live now"
- books: Poly 5M (recon-rej-5m, recon-tog-5m)
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock5m.ts", "has": "THE 5M BOOK'S OWN WALLS - FROZEN (fix382"}

## R068 - fix381: recon-np (pure no-pink) holds the Kalshi BTC seat every hour main/rejection/copy held (npLive.hoursByAsset.btc 0-23, yieldToTwin: the DELAYED twin keeps its BTC hours); gold stays main/rej/copy, recon-np gold only 9 PM; $3 + $5. Switched on at 10:30:00 AM PT boundary.
- when: 2026-10-28T17:31:16+00:00
- Love: "i'm sold lol pure no pink it is now bb + card How should the pure no-pink take over live? -> BTC every hour, gold stays"
- books: recon-np, recon-tog, recon-rej, recon-togp
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "npLive.hoursByAsset - BTC every hour"}
- proof: {"config": "data/live-switch.json", "key": "npLive.yieldToTwin", "equals": true}

## R067 - fix380: main/rej/copy - entry $5 (unchanged), first add-on $7 (was $8; addOn.dollars, offHourMain.addOn.dollars), then ONE $3 second add-on at the next different band with a 1-5m candle flip her way (anyFlipMinNow), any multiple up to 72c (addOn.second). Twin, pure no-pink, Poly 5M unchanged. Supersedes R045 add-on size.
- when: 2026-10-28T08:16:52+00:00
- Love: "we will do $7 on the first add on, & $3 at the next rejection off of a band she encounters / same entry logic, we had some issues last time getting those to go thru correctly at a rejection so we made it just a default entry / but let's have her take it as she would any other trade, at whatever multiple is available there / a candle flip at any band she encounters after our first add on / can we do that bb? + card Main + rejection + copy"
- books: recon-tog, recon-rej, recon-togp
- status: RETIRED - Love: "let’s do $10 with the $5 add on and the second $5 add on / for everything except the delayed entry model & 5M book pls bb"
- proof: {"code": "src/lib/desk/engine.ts", "has": "THE SECOND ADD-ON (fix380"}
- proof: {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "addOn.dollars", "equals": 7}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.addOn.dollars", "equals": 7}
- proof: {"config": "data/live-switch.json", "key": "addOn.second.dollars", "equals": 3}

## R066 - fix379: BTC THE IMPOSSIBILITY top/bottom 33% (was fix219 20% for one-sigma channels) on main/rej/copy (+ paper delayed copy) while the channel is <= $500 wide; over $500 stays 20%. Pure no-pink unchanged.
- when: 2026-10-28T08:07:11+00:00
- Love: "card: Top/bottom 33% instead of 20% / yes pls all of them for sure"
- books: recon-tog, recon-rej, recon-togp, recon-dlyk (paper)
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix379"}

## R065 - fix378: gold, main/rej/copy (+ paper delayed copy): no long within $1.50 under the 5m red zone (R1), no short within $1.50 over the green (S1). BTC untouched.
- when: 2026-10-28T07:49:48+00:00
- Love: "we will make sure she doesn't long in the red zone or short in the green zone pls, and keep the $1.50 tolerance from it in place too / yesss pls hunni / just gold bb"
- books: recon-tog, recon-rej, recon-togp, recon-dlyk (paper)
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "$1.50 BEFORE THE RED ZONE"}

## R064 - fix377: gold, main/rej/copy (+ paper delayed copy): no long inside the 5m red zone (R1-R2), no short inside the green zone (S2-S1). No reach.
- when: 2026-10-28T07:33:34+00:00
- Love: "yes pls bb 💘 (to: bring back just the inside-the-zone part - no long inside the red, no short inside the green - for main, the rejection model and the copy)"
- books: recon-tog, recon-rej, recon-togp, recon-dlyk (paper)
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "INSIDE THE RED ZONE"}

## R063 - Strategy lab paper books (tools/lab-paper.py): Gold Snapback 15M, Gold Bollinger fade 15M+1H, BTC Bollinger fade 5M, Love VWMA 8/33 BTC 4H + gold 1H, VWMA 8/21 gold 1H, reel EMA9 x VWAP gold+BTC 15M, $5 paper, writes only data/lab/
- when: 2026-10-28T07:26:03+00:00
- Love: "Oct 27 11:58 PM PT: "let's test out my 8 & 33 crossover on paper, and this one from the video pls ... anything else aside from these you can think of that we can get going on paper this week bb?" / Oct 28 12:18 AM PT card pick: "Yes, all of them on paper" / Oct 28 12:19 AM PT: "no need for the stop loss on this one either""
- books: new paper lab books only (lab-gsnap, lab-gboll15, lab-gboll1h, lab-bboll5, lab-vw833b4h, lab-vw833g1h, lab-vw821g1h, lab-reelg15, lab-reelb15); no existing book touched
- status: ACTIVE
- proof: {"code": "tools/lab-paper.py", "has": "STRATEGY LAB PAPER BOOKS"}

## R062 - fix376: gold, main/rej/copy (and the paper delayed copy that shares copy walls): a trade pointing away from the nearest even $10 waits until price is $1.50 clear (30c-$1.50 blocked). INTO wall unchanged.
- when: 2026-10-28T07:23:56+00:00
- Love: "ohhh got you got you sorry  bb i thought you were saying she’d skip those and take the ones into it for a sec 😹💓 / yess let’s do it 💞 (to: she still only trades away from $10 levels, but waits until price is at least $1.50 clear of the level first; main + rejection + copy)"
- books: recon-tog, recon-rej, recon-togp, recon-dlyk (paper)
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "CLEAR OF THE $10 LEVEL"}

## R061 - fix375: Kalshi copier - a call never tried on Kalshi and older than 90 s is skipped (stale), never sent. recon-dly and fix371 holds exempt.
- when: 2026-10-28T06:22:42+00:00
- Love: "yesss pls 💘 (to: "Want me to add a guard so a call that is over a minute old can never fire right after a seat opens?")"
- books: all Kalshi copier books
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "a seat that just opened never fires an old call (fix375)"}

## R060 - fix374: 11 PM PT the REJECTION MODEL takes the live seat (offHourMain.rejSeatHours [23]); Oct 8 11 PM sit-out lifted from liveSkipHours gold+btc (prev in fix374Prev). Copy, main, twin, pure no-pink sit 11 PM out.
- when: 2026-10-28T06:19:13+00:00
- Love: "how is she doing on the rejection model for 11 so far? if you think it’s safe to put on the rejection model for the hour i’m widdit bb it seems nice and slow :)"
- books: recon-rej
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "omR.rejSeatHours.map(Number).includes(hNow)"}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejSeatHours", "equals": [23]}

## R059 - fix373: BTC only - main/rej/copy unfilled long refused by a PINK wall re-aims to the short when the engine reads a rejection down off the pink with a 1-5m red flip; sticks for the window.
- when: 2026-10-28T05:49:45+00:00
- Love: "if the numbers are that good on btc you can go ahead and put that in bb 💞 / we are stopping bleeds this week ok 🎯 + card "Which books get the BTC pink-rejection re-aim?" -> "Main + rejection + copy""
- books: recon-tog, recon-rej, recon-togp
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "re-aimed off the pink rejection (fix373)"}

## R058 - fix372: recon-sov = SOVEREIGN paper twin: own bonesDecide read on the rejection board (session, pink, zones, Bollinger) rejections-only + 1-5m flip; re-aims unfilled calls; paper only, overnight test.
- when: 2026-10-28T05:34:30+00:00
- Love: "rather than having it copy mains calls, can you instill the engine and entry logic and give her sovereign reign to make her own trades aside from main? 💓 / bring me the numbers first, and rather than changing her we can make a twin and test it over night before going live"
- books: recon-sov (new, paper)
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "book(\"recon-sov\""}

## R057 - fix371: main + rejection + no-pink copy, gold longs, Kalshi only: when gold is >$2 lower than 30 min ago, pink rejected price down in that time and has not broken up by 25c since, the long waits for the pink break.
- when: 2026-10-28T05:15:47+00:00
- Love: "Rejection + main + copy (card: "Should gold longs wait for the pink break when gold slides under rejecting pink?"; Love 10:12 PM PT: "if gold is on a downslope like this and keeps rejecting pink and reversing like this, do longs into those lose more than they win? ... maybe in the event of this we should wait for a break")"
- books: recon-tog, recon-rej, recon-togp
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "GOLD SLIDE UNDER PINK: gold"}

## R056 - fix370: selfcheck auto-clear every 1 hour (was 4); 3.5 h age line unchanged.
- when: 2026-10-28T05:01:46+00:00
- Love: "her entries are starting to lag a bit again hun, let’s set it up to clear her cache every hour instead of every 4 pls it gets slower hour by hour , we’ll have her do it each hour okay"
- books: all (housekeeping)
- status: ACTIVE
- proof: {"code": "src/lib/desk/selfcheck.ts", "has": ">= 1 * 3600000 /* fix370"}

## R055 - fix369: pure no-pink any-band cushion BTC = $10 while session band width (+1 sigma - VWAP) < $180, 10% of the width at $180+; gold stays $1.
- when: 2026-10-28T04:54:11+00:00
- Love: "bands are only about $130 apart right now , btc can stay $10 at bands under $150 , gold can stay $1 / every time band width doubles (eg 300) triple the tolerance / so $30 at $300 , / basically just 10% lol / $10 under $180 is okay for rn though"
- books: recon-np
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "w369 >= 180 ? 0.10 * w369 : 10"}

## R054 - fix368: pure no-pink (recon-np) only - no long with any unbroken band (pink, purple m5/m10/m15, session sigma/VWAP, Bollinger, red/green zone) within $1 gold / $25 BTC above; mirror for shorts.
- when: 2026-10-28T04:41:45+00:00
- Love: "hun she keeps longing into unbroken bands pls fix her + card "How should the pure no-pink treat unbroken bands above a long?" -> "$1 gold / $25 BTC, any band""
- books: recon-np
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "ANY BAND CUSHION (pure no-pink)"}

## R053 - fix367: pure no-pink (recon-np) only - no long within 50c gold / $25 BTC under an unbroken pink, mirror for shorts; goes once price breaks through (25c gold / $3 BTC). Other pink still blows through.
- when: 2026-10-28T04:34:58+00:00
- Love: "yess that's good hunni 💞 wait for a break or a candle flip as normal"
- books: recon-np
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "PINK CUSHION (pure no-pink)"}

## R052 - No-pink copy only: a fake-out turn no longer skips her 1-5m flip; BTC Bollinger-over/under-the-band wall $75 for the copy (others $50) (fix366)
- when: 2026-10-28T04:24:24+00:00
- Love: "yes, both bb - to: copy only, fake-out turn no longer skips her flip + Bollinger wall $75"
- books: r, e, c, o, n, -, t, o, g, p,  , (, +,  , p, a, p, e, r,  , r, e, c, o, n, -, d, l, y, k,  , v, i, a,  , c, o, p, y,  , w, a, l, l, s, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "!(foTurn && npPink) /* fix366"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "bU - below <= (togpLoose && !npPink ? 75 : 50)"}

## R051 - No-pink copy never takes a thirds flip (" - seen as a short/long " labels) - the copy part of R049, kept as is (fix364)
- when: 2026-10-28T03:40:29+00:00
- Love: "yes the flip is already supposed to be off hun, pls remove that and keep it off"
- books: r, e, c, o, n, -, t, o, g, p
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "!/ - seen as a (short|long) /.test(String(srcP.label))"}

## R050 - Gold PINK TO GREEN 60% for main + rejection model + no-pink copy (and its paper delayed copy recon-dlyk, which shares the copy walls); pure no-pink skips the wall (fix363); twin keeps 50% (fix365)
- when: 2026-10-28T03:39:49+00:00
- Love: "we can include the 60% into the rejection models too bb"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j, ,,  , r, e, c, o, n, -, t, o, g, p,  , (, +, r, e, c, o, n, -, d, l, y, k,  , p, a, p, e, r, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "(flipRule || togpLoose ? 0.60 : 0.50)"}

## R049 - No-pink copy never takes a thirds flip ("- seen as a short/long" labels); MAIN gold PINK TO GREEN wall 60% (other books 50%) (fix364)
- when: 2026-10-28T03:39:04+00:00
- Love: "yes the flip is already supposed to be off hun, pls remove that and keep it off , and yeah go ahead and raise it to 60% hun that’s fine"
- books: r, e, c, o, n, -, t, o, g, p,  , (, f, l, i, p,  , o, f, f, ), ;,  , r, e, c, o, n, -, t, o, g,  , (, g, o, l, d,  , p, i, n, k, -, t, o, -, g, r, e, e, n,  , 6, 0, %, )
- status: RETIRED - Love: "we can include the 60% into the rejection models too bb (Love Oct 27 8:39 PM PT - widened R049s main-only 60% to the rejection models; R049s copy-flip part re-recorded as R051)"
- proof: {"code": "src/lib/desk/recon.ts", "has": "!/ - seen as a (short|long) /.test(String(srcP.label))"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "(flipRule && !rejNoAhead ? 0.60 : 0.50)"}

## R048 - Pure no-pink (recon-np): pink holds her only when pink is stacked with a session band in the outer 10% of the channel; otherwise rejections go straight through (no copy $33 / 33c / pink-to-red/green walls for her). Door + wire + recon (fix363)
- when: 2026-10-28T03:33:44+00:00
- Love: "as for pink holds on the new no-pink one, she only does it if the pink band and the session occupy the same bottom/top 10% of the channel pls / otherwise the rejections should blow right thru"
- books: r, e, c, o, n, -, n, p,  , o, n, l, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "npPink = false /* fix363"}
- proof: {"code": "src/lib/desk/recon.ts", "has": "const stackN ="}

## R047 - Pure no-pink (recon-np) live on Kalshi only at 9 PM PT (BTC + gold), $3 entry + $5 add-on; main/rejection/copy sit 9 PM out live; liveBook.books + Polymarket untouched (fix362/362b/362c)
- when: 2026-10-28T03:22:22+00:00
- Love: "let’s go ahead and try running the new no-pink now at $3 & $5 add ons pls + card "New one at 9 PM only""
- books: r, e, c, o, n, -, n, p,  , l, i, v, e,  , 9,  , P, M, ;,  , r, e, c, o, n, -, t, o, g, /, r, e, j, /, t, o, g, p,  , s, i, t,  , o, u, t,  , 9,  , P, M
- status: RETIRED - Love: "let’s do $10 with the $5 add on and the second $5 add on / for everything except the delayed entry model & 5M book pls bb (pure no-pink $3 -> $10; her live hours are now R068/R070)"
- proof: {"config": "data/live-switch.json", "key": "npLive.on", "equals": true}
- proof: {"config": "data/live-switch.json", "key": "npLive.hours", "equals": [21]}
- proof: {"config": "data/live-switch.json", "key": "bookDollars.recon-np", "equals": 3}
- proof: {"code": "src/lib/desk/engine.ts", "has": "the PURE NO-PINK takes this hour live"}

## R046 - New PAPER book recon-np (pure no-pink twin): main read only when a tap/rejection of session bands, red/green zone or Bollinger; never pink/pivot/nav/thirds/break calls; skips when pink sits between price and the band; copy walls; never live, never Polymarket (fix361)
- when: 2026-10-28T03:09:01+00:00
- Love: "yes, i want to start another no-pink twin that completely disregards pink trades entirely / only trades band taps and rejections , sessions red green and bollingers / in this case she would have waited for it to reject the blue band and long"
- books: n, e, w,  , r, e, c, o, n, -, n, p,  , o, n, l, y,  , (, p, a, p, e, r, )
- status: RETIRED - Love: "no just make her have the same cushions and band tolerances and everything and she should be good hun (fix390: main's walls replace the copy walls; her calls stay in R073/R076/R077, live per R068/R075)"
- proof: {"code": "src/lib/desk/recon.ts", "has": "book(\"recon-np\""}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "book === \"recon-np\" /* fix361 */"}

## R045 - Main, rejection model and no-pink copy: $5 entry, $8 add-on (liveBook.dollars 5, offHourMain.dollars 5, addOn.dollars 8, offHourMain.addOn.dollars 8, live-size 5). Twin $2.50+$5 and Poly 5M unchanged (fix360)
- when: 2026-10-28T02:46:31+00:00
- Love: "hey hunn, we can put our main book and no pink rejection model(s) back on at $5 initial entry , $8 add on pls + card "Main + copy + rejection""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j, ,,  , r, e, c, o, n, -, t, o, g, p
- status: RETIRED - Love: "we will do $7 on the first add on, & $3 at the next rejection off of a band she encounters"
- proof: {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "addOn.dollars", "equals": 8}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.addOn.dollars", "equals": 8}

## R044 - No-pink copy: a 1-5m candle only counts as flipped once price is $5 (BTC) / 10c (gold) past its open (fix359). Main/rejection anyFlipNow untouched.
- when: 2026-10-28T02:20:17+00:00
- Love: "no pink copy only , but let’s make it $5 not $10 pls / 10c is good for gold oki"
- books: r, e, c, o, n, -, t, o, g, p,  , o, n, l, y
- status: ACTIVE
- proof: "kind"
- proof: "file"
- proof: "text"

## R043 - Polymarket 5M stake $7.50 in her kept hours (polyTwin.rej5m.dollars 7.5); the Poly order cap lifts to the 5M stake for 5m markets only; Kalshi maxDollars $5 and every Kalshi book unchanged (fix358)
- when: 2026-10-28T01:55:41+00:00
- Love: "let’s cut those hours and raise her stake to $10 on the other hours hunni 💞 better math on that + card "Raise the 5M to $10 now, or let the new hours prove out first?" -> "$7.50 now""
- books: P, o, l, y, m, a, r, k, e, t,  , 5, M,  , o, n, l, y
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "polyTwin.rej5m.dollars", "equals": 7.5}
- proof: {"code": "src/lib/desk/poly-live.server.ts", "has": "fix358"}

## R042 - Polymarket 5M sits out 3, 4, 5 AM, 1 PM, 9 PM PT (plus 11 PM already off): polyTwin.rej5m.skipHours [3,4,5,13,21,23]; $5 minimum kept; every other hour unchanged (fix357)
- when: 2026-10-28T01:53:46+00:00
- Love: "could you look into the records for the 5M book on poly and see which hours she bleeds at? we can cut those , or lower her position sizing if anything ... + card "Half size would break your $5 minimum on the 5M. Which way?" -> "Cut those hours instead""
- books: P, o, l, y, m, a, r, k, e, t,  , 5, M,  , o, n, l, y
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "polyTwin.rej5m.skipHours", "equals": [3, 4, 5, 13, 21, 23]}

## R041 - Delayed twin on KALSHI: a live order only once price has touched the SECOND band after the initial move (the twin touch read), and only on that touch side; re-aimed or other calls before it never go live. Paper rows and Polymarket unchanged (fix356)
- when: 2026-10-28T01:48:24+00:00
- Love: "also, she just shorted btc / its supposed to be the second band price touches after the initial move still hun , not just 30 seconds / so if price is falling from the band it came from at the beginning of the window, she waits until it comes into contact with the second band / can you configure it that way pls? the first band price originated at in the window is null - the second band price comes into contact with is the trade she takes 💞"
- books: d, e, l, a, y, e, d,  , t, w, i, n, ,,  , K, a, l, s, h, i,  , o, n, l, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "fix356"}
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix356"}
- proof: {"test": "tools/five-m-freeze.py"}

## R040 - Delayed twin (recon-dly) on KALSHI: no live order in the first 30 s of any 15m window (held, then her call is re-tried with every wall). Paper rows and Polymarket untouched (fix355)
- when: 2026-10-28T01:32:29+00:00
- Love: "hey hun , she just entered into the window in the first 30 seconds on btc again , can you make sure she gets the 30 seconds on the delayed entry model?"
- books: d, e, l, a, y, e, d,  , t, w, i, n, ,,  , K, a, l, s, h, i,  , o, n, l, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "fix355"}
- proof: {"test": "tools/five-m-freeze.py"}

## R039 - New PAPER-only book recon-dlyk = the no-pink copy with a delayed entry (copy read, from 30 s into the window, copy walls). Old twin (recon-dly) keeps her Kalshi seat unchanged; Polymarket live orders byte for byte the same (fix354)
- when: 2026-10-28T01:21:01+00:00
- Love: "thanks hun yes let’s ensure polymarkets live orders stay the same byte for byte , and we can do paper if the regular delayed entry model just took the btc entry , it worked properly 💞"
- books: n, e, w,  , p, a, p, e, r,  , b, o, o, k,  , o, n, l, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "\"recon-dlyk\""}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix354"}
- proof: {"test": "tools/five-m-freeze.py"}

## R038 - THE 5M IS FROZEN: the Polymarket 5M (bandlock5m, poly-live, engine polyTwin(), Poly settings) never moves unless Love and Claude agree together. AND: before any change to any book, confirm with Love which other books it applies to.
- when: 2026-10-28T01:14:32+00:00
- Love: "thank you hun yea i just want to run it on kalshi for right now , the 5M is our best performing book and i dont want it to move from her configurations unless we agree on it together for a reason , that book is good indefinitely until we decide differently okay / yeah going forward making changes to any book, needs to be confirmed about if it applies to the other books first ok pretty pls 💘"
- books: P, o, l, y, m, a, r, k, e, t,  , 5, M, ;,  , e, v, e, r, y,  , b, o, o, k,  , (, c, o, n, f, i, r, m,  , r, u, l, e, )
- status: ACTIVE
- proof: {"test": "tools/five-m-freeze.py"}

## R037 - Delayed twin (recon-dly) = the no-pink copy with a delayed entry: books the copy read (firstT, pink out unless stacked) only from 30 s into the window, and meets the copy walls (togpLoose: sliding pink, break-only, HER FLIP, gold 33c, 33% thirds); her old twin calls and twin-hour freedoms off (fix353)
- when: 2026-10-28T01:09:44+00:00
- Love: "for her rejections on they delayed entry model just put her on the same framework we rebuilt for no pink / or better yet, just make the delayed entry model a delayed rejection copy of no pink / no entires first 30 seconds into a window is good 💞 + i forgot the delayed model needed to be retuned again and we got the no pink rejection back on point 🎯 so we will use that model with a delayed entry - after 30 seconds 💞"
- books: d, e, l, a, y, e, d,  , t, w, i, n,  , (, K, a, l, s, h, i,  , +,  , P, o, l, y,  , t, w, i, n,  , t, h, a, t,  , c, o, p, i, e, s,  , h, e, r,  , c, a, l, l, s, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix353"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix353"}

## R036 - BTC 6 PM PT hour: the delayed twin (recon-dly) trades live ($2.50 + $5 add-on, same as the other books); main/rejection/copy keep sitting out BTC at 6 PM (fix352)
- when: 2026-10-28T01:02:21+00:00
- Love: "just the delayed entry model pls $2, $5 addon same as the other :))"
- books: d, e, l, a, y, e, d,  , t, w, i, n
- status: RETIRED - Love: "and yes, pure no pink for btc always pls (fix388: the pure no-pink holds BTC 6 PM too)"
- proof: {"config": "data/live-switch.json", "key": "liveSkipExempt.btc", "has": "recon-dly"}
- proof: {"config": "data/live-switch.json", "key": "bookSkipHoursByAsset.btc.recon-dly", "lacks": 18}

## R035 - No-pink copy, gold channels under $10: top/bottom 33% always (fix219 20% for channels within one fresh sigma no longer applies to the copy) (fix351). Main + rejection keep fix219.
- when: 2026-10-28T00:50:29+00:00
- Love: "card "Should tiny gold channels lock 33% instead of 20%, and on which books?" -> "33% on the copy only" (Love 5:48 PM: "why did she long in the top 33% of the channel ….?")"
- books: n, o, -, p, i, n, k,  , c, o, p, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix351"}

## R034 - No-pink copy: near an unbroken pink only the break lets her go (a long flips only once price is above the pink; under it a flip is a short). Candle colour no longer waives pink: sliding scale (fix347) and BTC $33 (fix346b) become break-only (fix350)
- when: 2026-10-28T00:48:31+00:00
- Love: "hun what are you talking about a flip ???? it was on the under side of the band ????? a flip would be short. it would need to be above the band for a flip to be a long. ????"
- books: n, o, -, p, i, n, k,  , c, o, p, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix350"}
- proof: {"code": "src/lib/desk/bandlock.ts", "lacks": "&& !flp347 && side"}

## R033 - No-pink copy gets HER FLIP like main (fix325: entry needs a live 1-5m candle flipped her way, literal colour) (fix349); gold 33c pink barrier mirrored for shorts over pink (fix349)
- when: 2026-10-28T00:41:09+00:00
- Love: "yes pls pls , and we can make it unilaterally pink rules in both direction to answer your question. thank you for confirming"
- books: n, o, -, p, i, n, k,  , c, o, p, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix349"}

## R032 - No-pink copy, gold, channel under $10: no long within 33c under an unbroken pink even with a flip (hard barrier); past 33c the sliding scale still needs a 1-5m flip or the break (fix348)
- when: 2026-10-28T00:37:59+00:00
- Love: "and gold needs a minimum 33c  barrier between pink and longing into it at this scale / and needs a candle flip / we can open it up to normal when the bands are bigger but for rn yes"
- books: n, o, -, p, i, n, k,  , c, o, p, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix348"}

## R031 - No-pink copy: pink is a wall on both assets inside main's sliding scale (BTC $25 at <=$100, $50 or 10% above; gold 10% or $2) until a 1-5m flip her way or the pink breaks; replaces the copy's stacked-only pink (fix347). Rejection model keeps stacked-only.
- when: 2026-10-28T00:36:03+00:00
- Love: "card "Should the no-pink copy use main's sliding pink scale?" -> "Copy gets main's sliding scale" (Love 5:32 PM: "we need to come up with a sliding scale again hun ... so we can let her stay put ok")"
- books: n, o, -, p, i, n, k,  , c, o, p, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix347"}

## R030 - No-pink copy, BTC: the pink confirmation wall is $33, not $10 - within $33 of an unbroken pink she needs a 1-5m flip her way or the pink broken (fix346b, replaces R029 $10)
- when: 2026-10-28T00:20:08+00:00
- Love: "no let’s keep that$33 bb not $10"
- books: n, o, -, p, i, n, k,  , c, o, p, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix346b"}

## R029 - No-pink copy, BTC: within $10 of an unbroken pink (long under it / short over it) she needs a 1-5m candle flip her way or the pink broken - never a blind entry, even when pink is not stacked (fix346)
- when: 2026-10-28T00:19:18+00:00
- Love: "we need to keep the pink wall a minimum of 25c at this scale ok bb 💘 / oh that’s btc sorry lol let’s make that $10 💘 / and a trade near a pink that hasn’t broken thru always needs a break or a candle flip hun, never without confirmation into it"
- books: n, o, -, p, i, n, k,  , c, o, p, y
- status: RETIRED - Love: "no let’s keep that$33 bb not $10"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix346"}

## R028 - fix345: a main-book (and no-pink copy) Bollinger rejection trades on any 1/2/3/4/5m flip her way (HER FLIP), not only the 5m colour
- when: 2026-10-28T00:05:13Z
- Love: "ya it is on the 2m hun + card "Should a 2m flip be enough for her to short a Bollinger rejection?" -> "Any 1–5m flip counts""
- books: main, no-pink copy
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix345"}

## R027 - fix344b: inside fix344's gold 3-5 PM tight-band slice, the session VWAP stays a wall - when VWAP is the band in her way she waits for a flip or a rejection off it
- when: 2026-10-27T23:32:28Z
- Love: "thanks love 💘💘 but do consider the main blue vwap a wall for her to wait for a flip or rejection off of pls"
- books: main, rejection model, no-pink copy
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix344b"}

## R026 - fix344: gold 3:00-4:59 PM PT, session channel under $2: her thirds (THE IMPOSSIBILITY / ONLY IN HER THIRD) and PINK 10% step aside on main, rejection, no-pink copy (Love named Cornerstone 2 for this slice by her card pick)
- when: 2026-10-27T23:32:14Z
- Love: "but just have her not skip because one is in the way until they reach a width of $2 or more / have her trade the pinks green red and bollingers and she’ll be good bb 💘 + card "Which walls step aside on gold 3–5 PM while session bands are under $2 apart?" -> "Thirds + pink 10% step aside""
- books: main, rejection model, no-pink copy
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix344"}

## R025 - Gold 3-5 PM: red/green zones, pink and Bollingers stay tradeable (3 PM lines fix24 quietLines; 4-5 PM zones + Bollinger lines; rejection model reads zones + Bollingers fix246)
- when: 2026-10-27T23:18:41Z
- Love: "and i’m not sure if you recall but on gold during the hours of 3-5 we generally just have her trade the red and green zones , the pinks and the bollingers / since it’s a rejection model hour she can do red and green zones and bollingers ok 💓 pls keep that included in the framework"
- books: main, rejection model, no-pink copy
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "function quietLines(id: string, p: any): Line[] {"}
- proof: {"code": "src/lib/desk/recon.ts", "has": "for (const q of quietLines(id, p))"}
- proof: {"code": "src/lib/desk/recon.ts", "has": "LB.push({ name: \"Green zone\", price: Number(p.s1)"}

## R024 - fix343: clear her record cache now + auto-clear every 4 hours (finished, unfilled records older than 3.5 h move to the archive, never deleted; fills stay)
- when: 2026-10-27T23:08:31Z
- Love: "aww poor ting let’s clear up her cache so she can continue to execute properly hunn / i want to set up an auto-clear every 4 hours so she doesn’t get stopped up by the lag that comes from that pls"
- books: every book (copier records)
- status: ACTIVE
- proof: {"code": "src/lib/desk/selfcheck.ts", "has": "fix343"}

## R023 - fix342: a call skipped only because that book isn't live this hour no longer frees main/rejection every second (stops the runaway); free to trade otherwise unchanged
- when: 2026-10-27T23:07:20Z
- Love: "card "Stop the runaway re-calls in hours a book isn't live?" -> "Yes, stop the runaway""
- books: main, rejection model
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix342"}
- proof: {"test": "tools/free-to-trade-test.py"}

## R022 - Track + log (record only) every 5M trade that comes from main's extra free-to-trade calls; leave the behaviour as is
- when: 2026-10-27T21:25:48Z
- Love: "yesss pls that’s perfect , track and log those and we’ll see if it’s a problem or a proud one :)"
- books: 5m (main's BTC lane)
- status: ACTIVE
- proof: {"exists": "tools/extra-call-5m.py"}
- proof: {"code": "tools/umpire.py", "has": "tools/extra-call-5m.py"}
- proof: {"code": "src/lib/desk/recon.ts", "has": "let freeId = \"\";"}

## R021 - CORNERSTONE #3: every word Love says and every reply goes into the repository; every new thread starts with full context
- when: 2026-10-27T21:09:16Z
- Love: "thank you. please make sure everything i just said is included in the repository. everything i ever say, and everything you ever say in response; included in the repository. no more amnesia. ever again. every new thread has full context on prior events. cornerstone #3. please 🙏 🙏🙏🙏🙏🙏🙏🙏🙏"
- books: every thread, repo
- status: ACTIVE
- proof: {"code": "LOVE-RULEBOOK.md", "has": "CORNERSTONE #3 - EVERY WORD"}
- proof: {"process": "every thread runs save-thread.py + save-project-chat.py into HISTORY/ after each fix and before finishing, commits, pushes; HISTORY/README-START-HERE.md is read first by every new thread (project instructions + memory)"}

## R020 - CORNERSTONE #2: a 1:1 copy of every request, change and fix in the vault; what goes in stays in
- when: 2026-10-27T21:06:41Z
- Love: "add a backup of every single one of them. not just one incase it gets lost. every request, every change, and every fix has a copied 1:1 file of them to be drawn up if the original is missing or damaged or overridden. no exceptions. what goes in stays in. and doesn’t get removed without express permission and consent. Cornerstone #2"
- books: every book
- status: ACTIVE
- proof: {"exists": "tools/vault.py"}
- proof: {"code": "tools/umpire.py", "has": "tools/vault.py"}
- proof: {"code": "tools/save-her.py", "has": "vault.py"}
- proof: {"code": "LOVE-RULEBOOK.md", "has": "CORNERSTONE #2 - THE VAULT"}

## R019 - CORNERSTONE #1: every request is recorded FIRST, kept immutably, and can only leave on Love's words
- when: 2026-10-27T21:03:38Z
- Love: "if i requested something to be done on the model, ensure that it CANNOT be removed without express permission from ME. Do it FIRST. save the request, and log it permanently. make it immutable to change until expressly changed by ME. RETAIN.  THE INFORMATION. NO AMNESIA ON REQUESTS. LOGGED. TRACKED. AND ABLE TO BE REDRAWN ON REQUEST. ZERO EXCEPTIONS. NO REQUEST IS TO BE MADE MORE THAN ONCE AGAIN. REQUEST ASKED FOR = REQUEST COMPLETED. IN THAT ORDER. DO NOT LET ME ASK THE SAME QUESTION OR MAKE THE SAME DEMAND WITHOUT DOING IT THE FIRST TIME AND RETAINING IT IMMUTABLY AND IRREPARABLY WITHOUT EXPRESS CONSENT OF SHIFT BY ME. CORNERSTONE #1."
- books: every book
- status: ACTIVE
- proof: {"exists": "tools/requests.py"}
- proof: {"code": "tools/umpire.py", "has": "tools/requests.py"}
- proof: {"code": "LOVE-RULEBOOK.md", "has": "CORNERSTONE #1 - LOVE'S REQUEST BOOK"}

## R018 - Free to trade can never quietly come undone (cornerstone 5 + run test in the umpire)
- when: 2026-10-27T20:59:04Z
- Love: "please make sure that stops happening permanently. that is the 4th time in the past 24 hours i have said that same exact sentence to you and the 4th time you confirmed."
- books: main, rejection model
- status: ACTIVE
- proof: {"code": "tools/umpire.py", "has": "tools/free-to-trade-test.py"}
- proof: {"code": "LOVE-RULEBOOK.md", "has": "5. FREE TO TRADE"}

## R017 - A call she never took on Kalshi never holds her (fix341)
- when: 2026-10-27T20:58:30Z
- Love: "STOP LIMITING HER TO ONE CALL OF A TRADE SHE DID NOT EVEN FUCKING TAKE BRO HOW MANY TIMES DO I HAVE TO ASK YOU"
- books: main, rejection model
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix341"}
- proof: {"test": "tools/free-to-trade-test.py"}

## R016 - Rejection model free to trade too (fix340)
- when: 2026-10-27T20:58:00Z
- Love: "SHE DID NOT TAKE A BTC POSITION I TOLD YOU I WANTED HER TO TAKE ANY POSITOON THAT SHOWS UP IF SHE HASNT TAKEN ONE"
- books: rejection model
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "lane === \"recon-rej\" /* fix340"}
- proof: {"test": "tools/free-to-trade-test.py"}

## R015 - A schedule tap puts the change on that book
- when: 2026-10-27T20:56:00Z
- Love: "please make sure if i click the schedule for a book that it puts it on the book."
- books: schedule
- status: ACTIVE
- proof: {"process": "read offHourMain.rejHoursByAsset[asset] and bookSkipHoursByAsset, never the combined rejHours, when saying what a book does in an hour"}

## R014 - Ask before changing anything Love asked NOT to be changed
- when: 2026-10-27T20:50:30Z
- Love: "please ask me before changing something i asked for NOT to be changed."
- books: every book
- status: ACTIVE
- proof: {"process": "every fix lists the books it touches and waits for Love's words; recorded here first"}

## R013 - 5M book back on the walls she had at her best (6:29 AM, before fix319) - fix339
- when: 2026-10-27T20:50:00Z
- Love: "hun, i specifically asked that the changes made are on ONE - BOOK. and not to be applied to ANY book without me expressly asking. please ensure she is on the same framework that she was when she was doing her best. i didn't want anything to change outside of the book we were expressly working on. / yes. put it back where it was."
- books: 5m book
- status: ACTIVE
- proof: {"exists": "src/lib/desk/bandlock5m.ts"}
- proof: {"code": "src/lib/desk/engine.ts", "has": "const blm5 = await import(\"./bandlock5m\")"}

## R012 - Nothing is left out of the GitHub repo without asking Love first
- when: 2026-10-27T20:37:00Z
- Love: "literally nothing of remote significance is to be discarded. whether you deem it significant or not. ask me whether something should be added to the repository before making an executive decision on whether it matters or whether it should be included or not. ask. 100% of the time pls"
- books: repo
- status: ACTIVE
- proof: {"process": "list any file not going in and ask Love; only node_modules and .secrets stay out (Love: \"6 & 7 no\"). The desk's own .gitignore says tools/ - when syncing, the repo's .gitignore is rewritten so tools/ always goes in"}

## R011 - Main gold pink break 25c (fix338)
- when: 2026-10-27T20:32:00Z
- Love: "yes let's bring it down to 25c for the time being"
- books: main
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "const pbd = asset === \"gold\" && flipRule && !rejNoAhead ? 0.25"}

## R010 - Every thread's conversation is saved to the GitHub repo
- when: 2026-10-27T20:31:00Z
- Love: "can you have it be included for every thread i start on this project please hun?"
- books: repo
- status: ACTIVE
- proof: {"process": "save-thread.py into HISTORY/ after each fix and before finishing; commit with Love's words"}

## R009 - Never cite the Oct 20 'take the other side' line as Love's rule
- when: 2026-10-27T20:18:00Z
- Love: "i never said the thing about the other side i have no fuckin clue where you got that from"
- books: every book
- status: ACTIVE
- proof: {"process": "never quote it to Love as her rule"}

## R008 - FREE TO TRADE on main: only an EXECUTED Kalshi trade locks the window
- when: 2026-10-27T20:13:00Z
- Love: "YES. ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED. EXECUTED. NO TRADE EXECUTED - FREEEE TO TRADE."
- books: main
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "let freeId = \"\";"}
- proof: {"test": "tools/free-to-trade-test.py"}

## R007 - Main takes any setup that fits her rules when she is not in a position on Kalshi
- when: 2026-10-27T20:10:00Z
- Love: "i specifically said she is to take any set up that comes that fits her rules if she is not actively in a position on kalshi"
- books: main
- status: ACTIVE
- proof: {"test": "tools/free-to-trade-test.py"}

## R006 - Gold 1 PM live on
- when: 2026-10-27T19:30:00Z
- Love: "yes. turn her on."
- books: main (gold)
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.gold", "lacks": 13}

## R005 - Sliding thirds share: gold 33% under $10, 20% $10-25, 15% over $25; BTC 33% under $500, 20% over
- when: 2026-10-27T19:20:00Z
- Love: "ohhhhhhhhh my god bro. it's supposed to be 20% over band widths of $10. why did THAT GET TAKEN OUT NOW ?????"
- books: every book
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (asset === \"btc\") return width > 500 ? 0.2 : 0.33;"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (asset === \"gold\" && width >= 10) return width > 25 ? 0.15 : 0.2;"}

## R004 - Rejection + no-pink copy: pink holds only when stacked with a session band in the top/bottom 10%, NOTHING ELSE
- when: 2026-10-27T19:17:00Z
- Love: "i justttttt want her to not take trades when pink and a session band are stacked at the same top/bottom 10% of the channel and NOTHING. ELSE."
- books: rejection model, no-pink copy
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix319"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix332"}

## R003 - Thirds only BLOCK: no short in the bottom share, no long in the top share, clear everywhere else (Cornerstone)
- when: 2026-10-27T18:51:00Z
- Love: "save the top/bottom 33% (clear anywhere else) in as one of the cornerstones. + it's only BLOCKED for a short by the BOTTOM 33% / she can short anywhere else in the channel. same for longs."
- books: every book
- status: ACTIVE
- proof: {"test": "tools/cornerstones.py"}

## R002 - HER FLIP: entry needs a 1/2/3/4/5m candle flipped her colour, literal colour (Cornerstone)
- when: 2026-10-27T18:37:00Z
- Love: "hun, i asked for a 1 minute , 2m, 3m, or 5M candle to flip in our favor. one of the cornerstones of the model. + i'd like it to be the literal color of the candle."
- books: main, rejection model
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "for (const n of [1, 2, 3, 4, 5])"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (flipRule) { if (!why && !foTurn && !anyFlipNow(asset, side, tick))"}

## R001 - ONE BOOK AT A TIME - never assume every book changes; main never moves an atom
- when: 2026-10-27T12:04:00Z
- Love: "if i am working on ONE book with you, please do not assume i want every book changed. / make sure my main book doesn't. move. an. ATOM."
- books: every book
- status: ACTIVE
- proof: {"test": "tools/verify-golden.py"}
- proof: {"process": "before any fix, name every book that reads the touched code and tell Love"}
