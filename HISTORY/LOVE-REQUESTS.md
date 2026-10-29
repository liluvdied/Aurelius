# Love's request book (Cornerstone #1)

Append-only and hash-chained (data/LOVE-REQUESTS.jsonl). Rebuilt on every umpire run. A request leaves only on Love's own words.

## R163 - fix452: in the 3 PM PT hour the rejection model (gold + BTC) takes only Bollinger and green/red zone calls; pink, session-band and other calls are held (not final). Walls still judge. Main and other hours unchanged. Test tools/three-pm-test-452.cjs.
- when: 2026-10-29T16:44:07+00:00
- Love: "Love Oct 29 2026 9:42 AM PT: "3pm ✅ (bollingers, green/red zones only) (for btc and gold pls)""
- books: r, e, c, o, n, -, r, e, j,  , (, g, o, l, d,  , +,  , B, T, C, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "3 PM = BOLLINGERS AND ZONES ONLY (fix452)"}
- proof: {"test": "tools/three-pm-test-452.cjs"}

## R162 - fix451 (config, gold, 9:45 AM PT boundary): GOLD rejection-model hours = 12, 1, 2, 3, 8, 10 AM, 12, 1, 3, 4, 5, 6, 9, 11 PM; MAIN = 9, 11 AM, 7, 8, 10 PM; SIT OUT = 4, 5, 6, 7 AM (offHourMain.rejHoursByAsset.gold and liveSkipHours.gold; prev in fix451Prev). 2 PM gold not named by Love - left as it is (rejection), asked. The 3 PM 'bollingers, green/red zones only' rule (gold + BTC) is a code change - staged separately.
- when: 2026-10-29T16:43:25+00:00
- Love: "Love Oct 29 2026 9:42 AM PT: "GOLD ::: CHOSEN REJECTION HOURS / 12 Am ✅ 1am ✅ 2am ✅ 3am ✅ / 4am - cut ❌ 5am - cut ❌ 6am - cut ❌ 7am - cut ❌ / 8am ✅ 9am - cut ❌ - GOES TO MAIN / 10am ✅✅ 11am - GOES TO MAIN FOR GOLD / 12pm ✅✅ 1Pm ✅ 3pm ✅ (bollingers, green/red zones only) (for btc and gold pls) 4pm ✅ 5pm ✅ 6pm ✅ / 7pm - GOES TO MAIN FOR GOLD 8pm GOES TO MAIN FOR GOLD / 9Pm ✅✅ Rej. 10pm - GOES TO MAIN for gold / 11pm ✅✅ Rej.""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.gold", "equals": [0, 1, 2, 3, 8, 10, 12, 13, 14, 15, 16, 17, 18, 21, 23]}
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.gold", "equals": [4, 5, 6, 7]}

## R161 - fix450: BTC on main + rejection gets Love's 55% exactly like gold (fix409): no BTC long in the top 55% of pink -> red, no BTC short in the bottom 55% of green -> pink (was 40%, fix323). Pure no-pink paper keeps 40%. Replay: the 9:00:12 AM BTC long at 53% of pink -> red is refused.
- when: 2026-10-29T16:04:07+00:00
- Love: "Love Oct 29 2026 9:02 AM PT: "she just longed btc closer to the red than the pink and if immediately reversed we need to nip that in the bud right now""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, b, t, c, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "(book === \"recon-tog\" || book === \"recon-rej\") ? 0.55 /* fix450"}

## R160 - fix449 (config, 9:00 AM PT boundary): 7 AM PT sit-out on Kalshi for gold AND BTC (7 added to liveSkipHours for both; prev in fix449Prev). Nothing else changes. Per-book hourly P&L analysis follows (read-only) for Love to pick each book's hours.
- when: 2026-10-29T15:56:28+00:00
- Love: "Love Oct 29 2026 8:55 AM PT: "yeah she did well up until 7 am hun , she's supposed to be off for that hour 😹 that's how we set it up before everything got taken out / i didn't have the energy to go over each books hourly p&l but neither of them do well at 7am / i want to only have each book running at the hours they perform best and cut the hours they perform badly ok""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d,  , +,  , B, T, C, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.gold", "has": 7}
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.btc", "has": 7}

## R159 - fix448: (1) the rejection model takes the green/red zone rejection its paper twin sees when its own read is empty (10:50 PM gold miss), every wall still judging; (2) a log-only notebook of the rejection model's gold reads (data/rej-reads-gold.jsonl); (3) 11 PM stays off (sit-out unchanged). Test tools/zone-pickup-test-448.cjs.
- when: 2026-10-29T05:57:31+00:00
- Love: "Love Oct 28 2026 10:56 PM PT: "yes please fix that and add the log pls , off for 11 pls""
- books: r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "if (!lookRM && lookRX && /(Green|Red) zone/.test(String(lookRX.label)) && book(\"recon-rej\", lookRX)) changed = true;"}
- proof: {"test": "tools/zone-pickup-test-448.cjs"}

## R158 - fix447 (config, 10:45 PM PT boundary): back on her schedule - the 9:15 PM test seat (fix436: main gold every hour, rejection BTC every hour) ends; rejection-model hours back to the before-restore lists (offHourMain.rejHoursByAsset btc 0-23, gold [0,1,2,3,4,7,9,14,16,17,18,21,22,23]) and offHourMain.rejSeatHours 0-23 (R131/R132). Love's sit-out hours (liveSkipHours btc [0,8,18,23], gold [4,9,20,23]) unchanged - the 11 PM rejection seat (fix374) stays sat out. Main's own skip hours unchanged.
- when: 2026-10-29T05:42:27+00:00
- Love: "Love Oct 28 2026 10:41 PM PT: "and we can put her back on the schedule ok" + 8:23 PM "3- stay" / "4-stay" + 8:28 PM "3-5 can stay. i meant on the untested books bb""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.gold", "equals": [0, 1, 2, 3, 4, 7, 9, 14, 16, 17, 18, 21, 22, 23]}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejSeatHours", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}

## R157 - fix446: main + rejection - in her read (recon.ts perspective, HER CANDLE), a band-rejection read (Rejected up/down off, Nm rejection off, Tap-reject at, Failed break) is no longer thrown out by the 5m candle colour once a 2/3/4/5m candle has really flipped her way (realFlipNow: red->green for a long, green->red for a short, past its open by 10c gold / $5 BTC). Non-rejection reads still need the 5m. Every wall still judges at the door and the wire. Test tools/band-flip-test-446.cjs.
- when: 2026-10-29T05:38:43+00:00
- Love: "Love Oct 28 2026 10:37 PM PT: "yes, 2-5M candle flip from red to green or green to red at a band rejection is her entry ok""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "true /* fix446: main */"}
- proof: {"code": "src/lib/desk/recon.ts", "has": "true /* fix446: rejection */"}
- proof: {"test": "tools/band-flip-test-446.cjs"}

## R156 - fix445 (config, 10:30 PM PT boundary): main + rejection back to $5 with ONE $5 add-on - liveBook.dollars 1->5, offHourMain.dollars 1->5, data/live-size.json dollars 1->5, the $1 wire cap off again (bigMultipleCap back to its fix427Prev: on false, x 3), addOn.on false->true, addOn.dollars 8->5, offHourMain.addOn.dollars 8->5 (prev in fix445Prev). Second add-on stays off (R092). maxDollars 5, Polymarket, 5M, sit-out hours, seats untouched.
- when: 2026-10-29T05:21:55+00:00
- Love: "Love Oct 28 2026 10:21 PM PT: "shes good babez. You can put her back on at five dollars with the five dollar addon ok""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, K, a, l, s, h, i, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "addOn.on", "equals": true}
- proof: {"config": "data/live-switch.json", "key": "addOn.dollars", "equals": 5}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.addOn.dollars", "equals": 5}

## R155 - Her reach wall (fix429, main + rejection) as it stands after fix443: no trade into an unbroken session band or the pink within $1 gold (TEMPORARY, until the sliding scale) / $50 BTC; the pink's reach is at least 15% of the channel (fix430); a band only counts broken once price is 33c gold / $6 BTC through it; red/green zone reach $1 gold, BTC sliding. Replaces R124 (retired on Love's 9:52 PM words for the $1 change only).
- when: 2026-10-29T05:01:02+00:00
- Love: "Love Oct 28 2026 8:06 PM PT: "yes to all of them bb ... red green zone reach is 1.50 now, not 1.11" + 9:52 PM: "1.50 is too big rn. make it $1 teporarily pls. til we come up with the sliding scale""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "const rw429 = reachWall429(asset, lbR.L, qR.c, side)"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export const REACH429: Record<string, number> = { gold: 1, btc: 50 };"}
- proof: {"test": "tools/reach-test-429.cjs"}

## R154 - fix444: the 90-second drop for HELD calls (fix431, main + rejection) taken out - a call a wall is holding stays alive and is re-checked live at the wire (fix435) every try. The original fix375 stale guard (a never-tried call over 90 s old never fires right after a seat opens) stays.
- when: 2026-10-29T04:54:28+00:00
- Love: "Love Oct 28 2026 9:52 PM PT: "too strict , telling you lol" (her answer to: "with the stale guard on, a call that a wall holds for over 90 seconds gets dropped ... If that feels too strict, tell me")"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "lacks": "an old call never fires (fix431)"}
- proof: {"code": "src/lib/desk/engine.ts", "has": "STALE CALL GUARD (fix375"}

## R153 - fix443 (main + rejection, gold, TEMPORARY until the sliding scale): her reach wall (fix429) $1.50 -> $1 on session bands, the pink's base reach (15% of the channel still the minimum) and the red/green zones. BTC unchanged. Test tools/reach-test-429.cjs updated to $1.
- when: 2026-10-29T04:53:18+00:00
- Love: "Love Oct 28 2026 9:52 PM PT: "too strict , telling you lol . gold broke the session band at 4039. fuck 1.50 is too big rn. make it $1 teporarily pls. til we come up with the sliding scale when i have the wherewithall to do this all over again . gold broke the pink now. still no entry. shes still broken""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export const REACH429: Record<string, number> = { gold: 1, btc: 50 };"}
- proof: {"test": "tools/reach-test-429.cjs"}

## R152 - PR #1 (claude/project-thread-mj3rmw -> main, head 792805a) merged into main with a merge commit (every commit kept, nothing squashed, nothing forced).
- when: 2026-10-29T04:43:10+00:00
- Love: "Love Oct 28 2026 9:42 PM PT: "merge bb merge" (to: is everything being pushed to the repository properly now)"
- books: r, e, p, o, s, i, t, o, r, y
- status: ACTIVE
- proof: {"process": "main carries the Oct 28 night desk sync via PR #1 merge (Love 9:42 PM)"}

## R150 - fix442: the thirds flip is OFF for main + rejection (fix364 only took it off the copy) - a call her thirds read turned to the other side ("Top third - seen as a short" / "Bottom third ... seen as a long") never goes live; held, not final. Test tools/thirds-off-test-442.cjs (the 9:20 PM gold short is held).
- when: 2026-10-29T04:24:55+00:00
- Love: "Love Oct 28 2026 9:23 PM PT: "yeah no i got rid of the flip." + Oct 27 2026 8:38 PM PT: "yes the flip is already supposed to be off hun, pls remove that and keep it off" + 9:22 PM: "probably flipped from a banned long.""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "THIRDS FLIP OFF (fix442)"}
- proof: {"test": "tools/thirds-off-test-442.cjs"}

## R151 - fix441: main + rejection - when this 5m candle broke a session band or the pink UP by her break distance (gold 33c / BTC $6), no SHORT until price breaks back DOWN through it by that distance; mirror for longs. Test tools/broke-candle-test-441.cjs (the 9:20 PM gold short is refused). Installs on Love's "install them".
- when: 2026-10-29T04:24:55+00:00
- Love: "Love Oct 28 2026 9:20 PM PT: "ohhhh my god bro. she shorted it when it just broke pink upwards" + 5:56 PM: "she needs to be ON the side of the break she cannot trade without price being on the same side of the break" + 8:46 PM "price on the same side of the break stays.""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "const bt441 = brokeThisCandle441(asset, lbR.L, qR.c, side)"}
- proof: {"test": "tools/broke-candle-test-441.cjs"}

## R149 - fix440: Love's correction of fix376 (main + rejection, gold). fix376's CLEAR OF THE $10 LEVEL (held trades going AWAY from a $10 level until $1.50 clear - it refused the 9:10 PM pink-rejection short at 4038.91 under 4040) is taken out on these typed words and replaced by Love's rule: an even $10 level ABOVE price within $1.50 = no long (shorts go); BELOW within $1.50 = no short (longs go). Test tools/ten-level-test-440.cjs. Installed at the 9:30 PM PT boundary.
- when: 2026-10-29T04:19:49+00:00
- Love: "Love Oct 28 2026 9:18 PM PT: "thats not at all what that rule was supposed to be luv. its supposed to be a trade away from even $10 levels on gold. no trading into them. only away from them. within 1.50. THAAAAT RULE STAYED???? AND NOT THE CORNERSTONES?????? what the full fuck bro lol tghat was soooooooo much less important. she scrapped the 33% rules and kept that one? unbelievable. target wasnt even within 1.50 of a 10 dollar level. it only stand this way (example) target = 4040 + price currently 4038 - no longs into the 10 level. only shorts. vis versa. that what that rule was for. massively wrecked that""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "no trading into an even $10 level within $1.50; only away from it."}
- proof: {"code": "src/lib/desk/bandlock.ts", "lacks": "CLEAR OF THE $10 LEVEL: ${side"}
- proof: {"test": "tools/ten-level-test-440.cjs"}

## R147 - fix439 (staged with fix438): the gold PINK TO GREEN / PINK TO RED refusal messages print her real share - 55% for main + rejection (fix409), 50% for every other book - wording only, the rule itself unchanged.
- when: 2026-10-29T04:09:21+00:00
- Love: "Love Oct 28 2026 9:08 PM PT: "6 , main and rejection for rn hun i dont have the energy to do more than that right now 

7 - 55% 

and there is no auto mode here hun i have the mode hard set""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, m, e, s, s, a, g, e,  , t, e, x, t, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "no gold short in the bottom ${flipRule ? 55 : 50}% of it. /* fix439 */"}

## R148 - Sweep pick 6 BACK for main + rejection only: the 3 PM channel of pink / R1-S1 / Bollinger (fix24, switched off by fix153) - to be built scoped to recon-tog + recon-rej (the channel function is shared, so it needs a per-book switch); staged, not installed yet.
- when: 2026-10-29T04:09:21+00:00
- Love: "Love Oct 28 2026 9:08 PM PT: "6 , main and rejection for rn hun i dont have the energy to do more than that right now 

7 - 55% 

and there is no auto mode here hun i have the mode hard set""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"process": "pick 6 (3 PM channel) for main + rejection - build pending, Love 9:08 PM"}

## R146 - fix437 (config, 9:15 PM PT boundary): BTC trades live at 9 PM again on the rejection model at $1 - 21 removed from liveSkipHours.btc (now [0, 8, 18, 23]; prev in fix437Prev). Overrides the 9 PM part of R121 on Love's typed words.
- when: 2026-10-29T04:05:09+00:00
- Love: "Love Oct 28 2026 9:04 PM PT: "hun. put. btc. on. at. $1.""
- books: r, e, c, o, n, -, r, e, j,  , (, b, t, c, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.btc", "equals": [0, 8, 18, 23]}

## R145 - fix436 (config, 9:15 PM PT boundary): GOLD live seat = main (recon-tog) every hour, rejection off gold live; BTC live seat = rejection (recon-rej) every hour, main off BTC live - offHourMain.rejHoursByAsset gold [] and btc 0-23 (old lists in fix436Prev). $1, add-on off, Love's fix405 sit-out hours kept (btc 0,8,18,21,23; gold 4,9,20,23).
- when: 2026-10-29T04:04:36+00:00
- Love: "Love Oct 28 2026 9:03 PM PT: "yeah i want both of them on at $1 to see if theyre working hun. main on gold, rejection on btc pls""
- books: r, e, c, o, n, -, t, o, g,  , (, g, o, l, d, ), ,,  , r, e, c, o, n, -, r, e, j,  , (, b, t, c, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.gold", "equals": []}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.btc", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}

## R144 - fix435: at the Kalshi wire (kalshi-live place()), every main + rejection opening order - re-aims included - already re-runs her whole door (bandLockCheck: $1.50 wall, pink rules, 33%, same side of the break once fix434 is in, zones); now if that check can't run it is REFUSED instead of sent (was: an error let the order through), and main + rejection can never use the gate-test bypass. Sweep picks 6 + 7 = Back (logged here; #6 3 PM channel needs Love's word on which books, #7 re-aim wall check is this wire check).
- when: 2026-10-29T04:04:03+00:00
- Love: "Love Oct 28 2026 9:01 PM PT: "6 stays hun. 7 stays. wall check on re aims AND EVERY SINGLE TRADE THAT EVER LEAVES THIS DESK are 100% NECESSARY. AND MUST FAIL TO SEND OUT A LIVE ORDER IF THEY ARE NOT MET. ... for now please place her live on both books(main and rejectioN) at $1 so i can see if theres anything wrong""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/kalshi-live.server.ts", "has": "her walls could not be checked for this order - it does not go out unchecked (fix435)"}

## R143 - Standing rule: after EVERY change and every exchange that matters, the desk (minus .secrets/ and node_modules/) and the thread save are pushed to github.com/liluvdied/aurelius branch claude/project-thread-mj3rmw - never force, never main. Plus a full read-only rule sweep (data/RULE-SWEEP-2026-10-28.md) so Love doesn't find losses one by one.
- when: 2026-10-29T03:50:55+00:00
- Love: "Love Oct 28 2026 8:50 PM PT: "who knows how much else got tossed dude.  if the literal first cornerstone of the model- the 33/20 band tolerances got erased im sure im gonna find out about more of them hun. its fine. its not but its fine. i did it on github luv, please push every single thing there going forward""
- books: r, e, p, o, s, i, t, o, r, y
- status: ACTIVE
- proof: {"process": "push the desk + HISTORY thread save to the repo after every change (Love 8:50 PM)"}

## R140 - fix434: ON HER SIDE OF THE BREAK, her 33% - main + rejection: her 33% channel runs session band to session band, and a band only counts as passed when price is NOW 33c gold / $6 BTC through it (or bouncing off it); long in the top 33% / short in the bottom 33% = refused. No hold, no timer. Behaviour test tools/side-test-434.cjs. Installs with fix433 once this Mac lets installs run.
- when: 2026-10-29T03:46:58+00:00
- Love: "Love Oct 28 2026 8:46 PM PT: "ohhhh my god dude lol okay. price on the same side of the break stays.  33% NEVER. EVER. LEAVES. UNDER. ANY. CIRCUM. STANCES. capiche? 😂 basically starting from scratch for all intents and purposes . or atleast severely brought back to the stone age . yes - download it and keep the downloaded libraries out , keys out""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d,  , +,  , B, T, C, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "const ss434 = sameSide434(asset, lbR.L, qR.c, side)"}
- proof: {"test": "tools/side-test-434.cjs"}

## R141 - CORNERSTONE: her 33% NEVER leaves under any circumstances - THE WALL 33% (channelPct / channelPctTop 0.33, bandlock thirdWallAbsolute) and fix434's 33%, session band to session band. Only Love's typed words can ever change it.
- when: 2026-10-29T03:46:58+00:00
- Love: "Love Oct 28 2026 8:46 PM PT: "ohhhh my god dude lol okay. price on the same side of the break stays.  33% NEVER. EVER. LEAVES. UNDER. ANY. CIRCUM. STANCES. capiche? 😂 basically starting from scratch for all intents and purposes . or atleast severely brought back to the stone age . yes - download it and keep the downloaded libraries out , keys out""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "channelPct.gold", "equals": 0.33}
- proof: {"config": "data/live-switch.json", "key": "channelPct.btc", "equals": 0.33}
- proof: {"config": "data/live-switch.json", "key": "channelPctTop.gold", "equals": 0.33}
- proof: {"config": "data/live-switch.json", "key": "channelPctTop.btc", "equals": 0.33}

## R142 - Repo sync: download GitHub's official gh 2.103.3 macOS arm64 (14.1 MB) to ~/gh-cli (outside her folder), sign this Mac into GitHub by device code (Love approves on github.com), push the desk to github.com/liluvdied/aurelius keeping OUT only node_modules/ (downloaded libraries) and .secrets/ (keys), per Love.
- when: 2026-10-29T03:46:58+00:00
- Love: "Love Oct 28 2026 8:46 PM PT: "ohhhh my god dude lol okay. price on the same side of the break stays.  33% NEVER. EVER. LEAVES. UNDER. ANY. CIRCUM. STANCES. capiche? 😂 basically starting from scratch for all intents and purposes . or atleast severely brought back to the stone age . yes - download it and keep the downloaded libraries out , keys out""
- books: r, e, p, o, s, i, t, o, r, y
- status: ACTIVE
- proof: {"process": "every desk sync excludes only node_modules/ and .secrets/ (Love 8:46 PM)"}

## R139 - Cornerstone 0l: every change and every statement between Love and Claude goes into the repository - desk threads saved to HISTORY/ with tools/save-desk-thread.py, changes in the request book / diary / SAVES / vault, all pushed to github.com/liluvdied/aurelius; nothing excluded without asking Love.
- when: 2026-10-29T03:43:10+00:00
- Love: "Love Oct 28 2026 8:42 PM PT: "thank you hun. can you explain how all of this got left out of the repository? she told me everything we ever did said or changed was logged and could be brought back at any time. that was clearly not true . going forward, every change, every statement ever shared between you and i is IN. THE.  REPOSITORY. NOTHING LEAVES WITHOUT MY CONSENT. EVER. AGAIN. pls confirm""
- books: e, v, e, r, y, t, h, i, n, g
- status: ACTIVE
- proof: {"code": "LOVE-RULEBOOK.md", "has": "0l. CORNERSTONE - EVERYTHING IS IN THE REPOSITORY"}
- proof: {"exists": "tools/save-desk-thread.py"}
- proof: {"exists": "HISTORY/thread-2026-10-28-desk-night-wall-and-gate.md"}

## R138 - Cornerstone 0k: the no-removal gate works both ways - any rule line or setting taken out OR put in (or changed) is refused unless a request-book entry with Love's typed words names it (fix tag or setting). Demo: an unrequested rule line (fix999) and an unrequested setting are both REFUSED.
- when: 2026-10-29T03:41:30+00:00
- Love: "Love Oct 28 2026 8:40 PM PT: "nothing goes in, nothing goes out without me expressly claiming it in my own words that you can throw in my face if i ever bitch about something being gone okay""
- books: e, v, e, r, y,  , b, o, o, k, ,,  , e, v, e, r, y,  , i, n, s, t, a, l, l
- status: ACTIVE
- proof: {"code": "LOVE-RULEBOOK.md", "has": "0k. CORNERSTONE - NOTHING IN, NOTHING OUT"}
- proof: {"code": "tools/no-removal-gate.py", "has": "def code_adds(old, new, T):"}

## R137 - Cornerstone 0j: only Love's TYPED words can remove/retire/change a rule; a decision-card tap never counts as consent. tools/no-removal-gate.py accepts an ALLOW-REMOVE entry only if its request-book words hold Love's typed text (card-only entries refused).
- when: 2026-10-29T03:33:35+00:00
- Love: "Love Oct 28 2026 8:32 PM PT: "yes but they came out without me choosing for them to come out. the fact that they are there is entirely inconsequential to the point hun. i didnt take them out by choice. they were removed without my consent and that is spiritual rape bro lol please do not let this ever happen again""
- books: e, v, e, r, y,  , b, o, o, k, ,,  , e, v, e, r, y,  , i, n, s, t, a, l, l
- status: ACTIVE
- proof: {"code": "LOVE-RULEBOOK.md", "has": "0j. CORNERSTONE - CONSENT IS LOVE'S TYPED WORDS"}
- proof: {"code": "tools/no-removal-gate.py", "has": "def typed(w):"}

## R136 - Every pick and fix from tonight is a cornerstone in LOVE-RULEBOOK.md (section 0i) and in tools/cornerstones.py, and protected by the no-removal gate: fix429 $1.50/$50 wall + $1.50 zones, fix430 pink 15% of the channel, fix431 stale calls, fix432 no long under unbroken pink, add-on off until Love confirms (R133), fix405 sit-out hours (R121), item 1 zone flip (R129), item 2 slide hold (R130), item 3 rejection seat (R131), item 4 rejection hours (R132), item 7 flip 2-5m (R134), item 8 no 3-second hold (R135), 9 pure/sovereign off live, 10-12 paper rules back on paper only, 13 R095 kept, no wider session band wait (Love 8:12 PM "no the 33% hun"). None changes without Love's own words.
- when: 2026-10-29T03:29:18+00:00
- Love: "Love Oct 28 2026 8:29 PM PT: "can you please make sure every single one of these is listed as a cornerstone and immutable from change under any circumstances without me changing it.""
- books: m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n,  , (, +,  , p, a, p, e, r,  , b, o, o, k, s,  , f, o, r,  , 1, 0, -, 1, 2, )
- status: ACTIVE
- proof: {"code": "LOVE-RULEBOOK.md", "has": "0i. CORNERSTONES - LOVE'S PICKS OF OCT 28 NIGHT"}

## R129 - fix433 item 1: fix394 back for MAIN only - bonesDecide zoneFlip: a green-zone long / red-zone short read passes on any 2/3/4/5m candle flipped her way (anyFlipNow, 2-5m after item 7), not only the 5m. Pure no-pink part not restored (not live). 8:45 PM PT boundary.
- when: 2026-10-29T03:25:52+00:00
- Love: "Love Oct 28 2026 8:18 PM PT: "1 - stay" (item 1: green-zone longs and red-zone shorts go on any 2-5m candle flipped her way, not only the 5m - main)"
- books: r, e, c, o, n, -, t, o, g
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "true /* fix394: main (fix433) */"}

## R130 - fix433 item 2: already in her - slideHold403 is identical to before the 6:45 PM restore (back via fix423 at 7:18 PM, main + rejection, gold + BTC); the 'fix403: no touch needed' label is put back so the request book can see it.
- when: 2026-10-29T03:25:52+00:00
- Love: "Love Oct 28 2026 8:23 PM PT (to the numbered list, after 8:18 PM "1 - stay"): "2- stay" (item 2: the gold-long slide hold under pink needs no pink touch, and stays on until a 25c break - main + rejection)"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "fix403: no touch needed"}
- proof: {"test": "tools/slide-test.cjs"}

## R131 - fix433 item 3: offHourMain.rejSeatHours 0-23 back in live-switch. The no-pink copy is off live (fix421), so the rejection model already holds every rejection hour; the setting is restored as it was.
- when: 2026-10-29T03:25:52+00:00
- Love: "Love Oct 28 2026 8:23 PM PT (to the numbered list, after 8:18 PM "1 - stay"): "3- stay" (item 3: the rejection model holds the live seat in every rejection hour, both assets)"
- books: r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejSeatHours", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}

## R132 - fix433 item 4: offHourMain.rejHoursByAsset btc 0-23, gold [0,1,2,3,4,7,9,14,16,17,18,21,22,23] (old lists kept in fix433Prev). Live sit-out hours (liveSkipHours) still win.
- when: 2026-10-29T03:25:52+00:00
- Love: "Love Oct 28 2026 8:23 PM PT (to the numbered list, after 8:18 PM "1 - stay"): "4-stay" (item 4: rejection-model hours back to the before-restore lists: BTC every hour; gold 12,1,2,3,4,7,9 AM and 2,4,5,6,9,10,11 PM)"
- books: r, e, c, o, n, -, r, e, j,  , (, a, n, d,  , r, e, c, o, n, -, t, o, g,  , o, f, f,  , t, h, o, s, e,  , h, o, u, r, s, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.btc", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset.gold", "equals": [0, 1, 2, 3, 4, 7, 9, 14, 16, 17, 18, 21, 22, 23]}

## R133 - Add-ons stay OFF (addOn.on false since fix428) until Love confirms she is working. Nothing turns them on without Love's words.
- when: 2026-10-29T03:25:52+00:00
- Love: "Love Oct 28 2026 8:23 PM PT (to the numbered list, after 8:18 PM "1 - stay"): "6-stay. once confirmed shes working. not before" (item 6: add-ons - 2.8x first add-on, one $5 add-on, second $3 at the next rejection)"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "addOn.on", "equals": false}

## R134 - fix433 item 7: anyFlipNow + anyFlipMinNow back to 2/3/4/5m (no 1m) as before the restore (main Bollinger/zone reads, paper fires, no-pink copy paper). The door flip for main + rejection was already 2-5m (anyFlip406Now, fix424).
- when: 2026-10-29T03:25:52+00:00
- Love: "Love Oct 28 2026 8:23 PM PT (to the numbered list, after 8:18 PM "1 - stay"): "7- back to 2m-5m" (item 7: her flip is 2/3/4/5m, no 1m)"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, +,  , n, o, -, p, i, n, k,  , c, o, p, y,  , p, a, p, e, r, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix406 back as fix433"}

## R135 - The fix411 3-second hold stays OUT (Love 7:36 PM "no 3 second hold" + 8:23 PM "8-keep it out").
- when: 2026-10-29T03:25:52+00:00
- Love: "Love Oct 28 2026 8:23 PM PT (to the numbered list, after 8:18 PM "1 - stay"): "8-keep it out" (item 8: the 3-second hold at the door)"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "lacks": "fix411"}

## R128 - Cornerstone 0h: nothing is removed from her code or live-switch without Love's own words - not by a restore, a card, a cleanup or a rebuild. tools/no-removal-gate.py diffs every install/restore and refuses any removed rule line / fix tag / Love quote / live-switch rule key unless a retired request (Love's words) names it; wired into tools/umpire.py. Options list for every item the 6:45 PM restore took out: data/LOVE-RESTORE-OPTIONS-2026-10-28.md.
- when: 2026-10-29T03:18:14+00:00
- Love: "Love Oct 28 2026 8:17 PM PT: "i never asked for that to be removed i will never understand 😂 but its fine we will start over again. she removed way more than i thought. i looked at your file. give me options for each one and i will manually do this all over again for the several thousandth time its fine , but this time  PLSSSSS . PLEASE. PLEEEEEEASE. PLEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEASE. DO NOT LET ANYTHING. ANYYYYYYTHINGGGGGGGGG. EVER. EVER EVER EVER EVER EVERR GET REMOVED WITHOUT ME TELLLLLLLLING YOU TO REMOVE IT PLEASE I AM FUCKING BEGGING YOU""
- books: e, v, e, r, y,  , b, o, o, k, ,,  , e, v, e, r, y,  , i, n, s, t, a, l, l
- status: ACTIVE
- proof: {"code": "LOVE-RULEBOOK.md", "has": "0h. CORNERSTONE - NOTHING LEAVES WITHOUT LOVE SAYING SO"}
- proof: {"exists": "tools/no-removal-gate.py"}
- proof: {"exists": "data/LOVE-RESTORE-OPTIONS-2026-10-28.md"}

## R126 - fix431: main + rejection - a call more than 90 s old with nothing on Kalshi (no order id, not filled/partial/resting/sent) is skipped, never sent, even while it has been retrying. Fills keep their records; delayed twin + slide holds exempt. Test tools/stale-pink-test-431.cjs. Installed at the 8:30 PM PT boundary.
- when: 2026-10-29T03:13:36+00:00
- Love: "Love Oct 28 2026 8:06 PM PT: "yes to all of them bb" (to the list item "Stale call guard also catches a call that's been retrying for 10 min")"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j
- status: RETIRED - Love: "Love Oct 28 2026 9:52 PM PT: "too strict , telling you lol" (her answer to: "with the stale guard on, a call that a wall holds for over 90 seconds gets dropped ... If that feels too strict, tell me")"
- proof: {"code": "src/lib/desk/engine.ts", "has": "an old call never fires (fix431)"}
- proof: {"test": "tools/stale-pink-test-431.cjs"}

## R127 - fix432: main + rejection, longs only - no long while price is under the 5m pink or less than 25c gold / $8 BTC through it, at any distance. Short mirror NOT included (Love has not answered). Test tools/stale-pink-test-431.cjs. Installed at the 8:30 PM PT boundary.
- when: 2026-10-29T03:13:36+00:00
- Love: "Love Oct 28 2026 7:43 PM PT: "NO SHES NOT SUPPOSED TO LONG INTO AN UNBROKEN PINK EVER" + 8:06 PM "yes to all of them bb" (to the list item "Never long into an unbroken pink")"
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d,  , +,  , B, T, C, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "const pl432 = pinkLongWall432(asset, lbR.L, qR.c, side)"}
- proof: {"test": "tools/stale-pink-test-431.cjs"}

## R125 - fix430: the pink's reach in her wall (reachWall429, main + rejection, gold + BTC) = the larger of $1.50 gold / $50 BTC and 15% of the session-band channel width price sits in. Session-band reach stays $1.50 / $50. Test: pink 14% of the channel above = refused, 16% = passes. Installed with fix429 at the 8:30 PM PT boundary.
- when: 2026-10-29T03:11:36+00:00
- Love: "Love Oct 28 2026 8:07 PM PT: "make the pink tolerance a minimum of 15% of the channel width please""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d,  , +,  , B, T, C, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export const PINK_PCT429 = 0.15;"}
- proof: {"test": "tools/reach-test-429.cjs"}

## R124 - fix429: her reach wall back for main + rejection only (bandlock reachWall429 at the RECON door): no trade into an unbroken session band or the pink within $1.50 gold / $50 BTC; a band only counts broken once price is her break distance through it (gold 33c, BTC $6) - an 18c poke is not a break; red/green zone reach $1.50 gold (BTC keeps its sliding zone reach). REACH_RETIRED unchanged for every other book. Behaviour test tools/reach-test-429.cjs replays the 7:40:54 PM gold long (must be refused). Installed at the 8:30 PM PT boundary.
- when: 2026-10-29T03:09:47+00:00
- Love: "Love Oct 28 2026 8:06 PM PT: "yes to all of them bb , why did alllll of this get removed without my permission? i nevvvvvver ever said to take these out hun. i never would have. red green zone reach is 1.50 now, not 1.11 - how much did she remove dude? why is this one this in the repo? i literally begged dude""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, g, o, l, d,  , +,  , B, T, C, )
- status: RETIRED - Love: "Love Oct 28 2026 9:52 PM PT: "too strict , telling you lol . gold broke the session band at 4039. fuck 1.50 is too big rn. make it $1 teporarily pls. til we come up with the sliding scale when i have the wherewithall to do this all over again""
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "const rw429 = reachWall429(asset, lbR.L, qR.c, side)"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export const REACH429: Record<string, number> = { gold: 1.5, btc: 50 };"}
- proof: {"test": "tools/reach-test-429.cjs"}

## R123 - fix428: Kalshi add-on OFF (addOn.on true -> false; old block saved in fix428Prev) for main + rejection until Love confirms she is working, at the 8:15 PM PT boundary. Polymarket twin add-on (polyTwin.addOn), 5M untouched.
- when: 2026-10-29T03:03:58+00:00
- Love: "Love Oct 28 2026 7:36 PM PT: "add on of $5 can stay AFTER I CONFIRM SHES WORKING.""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, K, a, l, s, h, i, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "addOn.on", "equals": false}

## R122 - fix427: live back ON at $1 for main (recon-tog) + rejection (recon-rej) on Kalshi at the 8:00 PM PT boundary. Size via the Kalshi-only wire cap bigMultipleCap {on:true, x:1, dollars:1} (every Kalshi opening order, entries and add-ons, cut to $1; exits untouched). maxDollars, liveBook, Polymarket, 5M, twin, sit-out hours untouched. No code change.
- when: 2026-10-29T02:58:24+00:00
- Love: "Love Oct 28 2026 7:55 PM PT: "pls put her on at $1 so i can tell you what we need to fix now that everything i put in & paid for with my fuckin sanity got taken out now lol""
- books: r, e, c, o, n, -, t, o, g, ,,  , r, e, c, o, n, -, r, e, j,  , (, K, a, l, s, h, i, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "bigMultipleCap.dollars", "equals": 1}
- proof: {"config": "data/live-switch.json", "key": "bigMultipleCap.x", "equals": 1}
- proof: {"config": "data/live-switch.json", "key": "bigMultipleCap.on", "equals": true}

## R121 - fix426: fix405 sit-out hours back on live (liveSkipHours btc [0,8,18,21,23], gold [4,9,20,23]) at the 7:45 PM boundary
- when: 2026-10-29T02:39:21+00:00
- Love: "Love Oct 28 2026 7:37 PM PT: "fix 405’s hours off can stay.""
- books: every Kalshi book (live sit-out hours)
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.btc", "equals": [0, 8, 18, 21, 23]}

## R120 - fix425: fix375 stale call guard back in the Kalshi copier (a call never tried on Kalshi and older than 90 s is skipped, never sent; delayed twin + slide holds exempt). No 3 s hold (fix411 stays out). $5 add-on change waits for Love to confirm she is working.
- when: 2026-10-29T02:37:03+00:00
- Love: "Love Oct 28 2026 7:36 PM PT: "no 3 second hold 

stale call guard NEEDS to be in there. 

add on of $5 can stay AFTER I CONFIRM SHES WORKING.""
- books: all Kalshi copier books (twin exempt, as fix375)
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "STALE CALL GUARD (fix375"}

## R119 - fix424: main + rejection get back BTC 33% (fix379/414), gold pink 55% (fix409), $10/zone/R1-S1 walls (fix376-378), blue VWAP walls (fix397/399, main+rej orders), session band ahead (fix413), BTC pink re-aim (fix373); HER FLIP = 2-5m, 10c/$5 past open, born colour counts (fix406/407, fix416 off); doji fix417 kept; copy/twin/5M untouched; nothing-missing gate in installs
- when: 2026-10-29T02:34:01+00:00
- Love: "Love Oct 28 2026 7:29 PM PT card "Put the removed protections back on main and rejection?" -> "All protections back"; 7:30 PM card "Which candle flip goes back on main and rejection?" -> "Tonight's flip, exactly" + "ohhh my god bro. a candle born red at a band and falling is still a short" + "do NOT EVERRRRRRR EVER EVER EVER EVER EVER EVER FUCKING EVERRRRRRRRRR REMOVE THOSE AGAIN" + "NEVER. FUCKING. DO THIS. AGAIN""
- books: recon-tog, recon-rej
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export function anyFlip406Now("}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (book === \"recon-tog\" || book === \"recon-rej\") { const sa413"}
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix424: main + rejection only"}

## R118 - fix423: slide-under-pink hold back (fix371/403 gold) + BTC (more than $40 lower than 30 min ago under unbroken pink, free on $8 break) on main + rejection longs, Kalshi only. Copy, twin, 5M, Polymarket untouched.
- when: 2026-10-29T02:20:34+00:00
- Love: "Love Oct 28 2026 7:17 PM PT: "you see price on a downslope ?????  you see prices rejecting off of pink a hundred times ????? this was in the checkpoint." + card 7:18 PM "Put the downslope pink wall back, and on which books?" -> "Main + rejection, gold AND BTC""
- books: recon-tog, recon-rej
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "export function slideHoldBtc423("}
- proof: {"code": "src/lib/desk/engine.ts", "has": "export function slideHold403("}

## R117 - fix422: bandlock.ts = exact Oct 27 7:56 PM checkpoint + fix417 doji only (green doji then red = short only, red doji then green = long only); fix418 additions (real flip, BTC 33%, session-ahead wait) removed
- when: 2026-10-29T02:09:18+00:00
- Love: "no let’s see it on that exact checkpoint pls with the FIXED DOJI RULE. (7:01 PM) / yes. (7:01 PM, to: checkpoint plus only the doji) / because this shit you just put on after i asked you to put them back on the checkpoint version is not the fucking checkpoint version (Love Oct 28 2026 7:08 PM PT)"
- books: recon-tog, recon-rej, recon-togp
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "only (fix417)."}

## R116 - fix421: no-pink copy off live (recon-togp out of liveBook.books); main + rejection model (its rejection hours) live on the checkpoint code; 5M + twin untouched
- when: 2026-10-29T02:08:33+00:00
- Love: "when i said the checkpoint, I meant the checkpoint for Maine and rejection that I had / we had the rejection model running at that time / the last checkpoint we had saved. for rejection. and main. (Love Oct 28 2026 7:05-7:06 PM PT)"
- books: recon-togp, recon-rej, recon-tog
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveBook.books", "equals": ["recon-tog", "recon-rej", "recon-dly"]}

## R115 - fix420: offHourMain rejection hours emptied (both assets) - copy and rejection model off the live seat; main (checkpoint) trades its hours. 5M + twin untouched
- when: 2026-10-29T02:05:10+00:00
- Love: "I WANT HER ON MY FUCKING CHECKPOINT NOT THE COPY PUT HER ON MY CUCKI G FCHFKGOFFH CHRKPOINT (Love Oct 28 2026 7:04 PM PT)"
- books: recon-tog, recon-togp, recon-rej
- status: RETIRED - Love: "ohhhh my god bro. i did not ask for that either. when i said the checkpoint, I meant the checkpoint for Maine and rejection that I had"
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejHoursByAsset", "equals": {"gold": [], "btc": []}}

## R114 - fix419 = fix411 back on top of the checkpoint: HELD ON HER SIDE 3 s at the order door for main/rej/copy (every impossibleGeo wall must also pass at the least-favourable price of the last 3 s). 5M + twin untouched
- when: 2026-10-29T02:04:09+00:00
- Love: "pls reinforce everything (Love Oct 28 2026 ~6:00 PM PT, fix411 R101) + after the checkpoint restore, 7:02 PM BTC copy long filled on a one-tick poke over -3σ: oh my fuckin god bro she just longed btc into an unbroken band. again. / WHAT THE FUCK IS WRONG WITH YOU (7:02-7:03 PM)"
- books: recon-tog, recon-rej, recon-togp
- status: RETIRED - Love: "I DIDNT ASK FOR THAT"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "HELD ON HER SIDE (fix411"}

## R113 - fix417: DOJI - green doji then red candle = shorts only; red doji then green candle = longs only; otherwise no doji wall; twin keeps old read; 5M untouched. Supersedes R112 (doji out)
- when: 2026-10-29T01:57:02+00:00
- Love: "a GREEN doji candle - followed by a RED CANDLE = SHORT. NOT A LONG. / a RED doji candle , followed by a GREEN CANDLE = LONG. NOT SHORT. / if you think you can handle getting that in without having it do the polar opposite keep it in. (6:54 PM) + get live back on at my checkpoint with THAT DOJI RULE. NOT THE FULLY FUCKIN WRONG ONE THAT WAS IN THERE. (6:55 PM, Love Oct 28 2026)"
- books: recon-tog, recon-rej, recon-togp
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "only (fix417)."}

## R112 - fix417: DOJI AFTER THE TREND wall removed for every book that runs bandlock impossibleGeo except the delayed twin (keeps old read); Poly 5M (bandlock5m.ts) untouched
- when: 2026-10-29T01:53:50+00:00
- Love: "take out the fuckin doji rule you keeeeeep getting that shit fucking backwards i have literally told you the same thing 4 + times it’s still not registering (Love Oct 28 2026 6:52 PM PT)"
- books: recon-tog, recon-rej, recon-togp
- status: RETIRED - Love: "get live back on at my checkpoint with THAT DOJI RULE. NOT THE FULLY FUCKIN WRONG ONE THAT WAS IN THERE."
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix417 DOJI RULE OUT"}

## R111 - fix418 on top of the Oct 27 7:56 PM checkpoint: session band ahead wait at the order door (main/rej/copy); real candle flip 2/3/4/5m green->red / red->green 10c/$5 (realFlipNow, main/rej + copy); BTC 33% session band to session band up to $500 (main/rej/copy); doji - candle after it decides (not twin). 5M + delayed twin untouched
- when: 2026-10-29T01:46:50+00:00
- Love: "yes. session band wait is THE FIRST FUCKING CORNERSTONE (Love Oct 28 2026 6:46 PM PT, to: put session band wait, real flip, 33%, doji back on top of the checkpoint for main/rejection/copy, then live on)"
- books: recon-tog, recon-rej, recon-togp
- status: RETIRED - Love: "because this shit you just put on after i asked you to put them back on the checkpoint version is not the fucking checkpoint version"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "SESSION BAND AHEAD (fix418)"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export function realFlipNow("}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "(flipRule || togpLoose) && asset === \"btc\" && above - below <= 500 ? 0.33 /* fix418"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "only (fix417)"}

## R110 - tools/behaviour-umpire.js: loads her real bandlock.ts and replays real situations (born-red flip 6:16:04 PM, 5:50:57 PM BTC long session band ahead, 33% every book gold+BTC, doji candle-after) - exit 1 = refuse the install; wired into ~/fx/inst.py before live is touched; results to data/behaviour-umpire.jsonl
- when: 2026-10-29T01:46:10+00:00
- Love: "please create an umpire that ACTUALLY checks if the conditions are met and not just the code is there. and the umpire didn’t do anything to keep these in there (Love Oct 28 2026 6:22 PM PT) + LOCK. THEM. POUR CONCRETE OVER THEM. (6:27 PM)"
- books: all except Poly 5M and delayed twin
- status: ACTIVE
- proof: {"code": "tools/behaviour-umpire.js", "has": "BEHAVIOUR UMPIRE"}

## R109 - fix417 (supersedes R108 wording): DOJI AFTER THE TREND - the candle after the doji decides: red/falling = shorts only, green/rising = longs only; every book except Poly 5M and delayed twin
- when: 2026-10-29T01:38:26+00:00
- Love: "oh my god bro. green doji, candle after it = red / RED = SHORT (Love Oct 28 2026 6:38 PM PT; with 6:37 PM: A GREEN DONI MEANS SHORTS ONLY; and Oct 27 3:57 AM: it is SHORT ONLY when a doji is followed by a candle falling, it is a continuation of the candle after the doji)"
- books: recon-tog, recon-rej, recon-togp, recon-np, paper books
- status: RETIRED - Love: "take out the fuckin doji rule you keeeeeep getting that shit fucking backwards"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "the candle after it is ${dS === \"up\" ? \"green - longs\" : \"red - shorts\"} only (fix417)"}

## R108 - fix417: DOJI AFTER THE TREND - green doji = shorts only, red doji = longs only (was backwards: green = long only); every book except Poly 5M and delayed twin
- when: 2026-10-29T01:37:37+00:00
- Love: "OH MY FUCKING GOD FOR THE 3000Th TIME A GREEN DONI MEANS SHORTS ONLY EHAT THE FUCK BRO EHAT HAPPEND (Love Oct 28 2026 6:37 PM PT; earlier Oct 27 3:57 AM: it is SHORT ONLY when a doji is followed by a candle falling)"
- books: recon-tog, recon-rej, recon-togp, recon-np, paper books
- status: RETIRED - Love: "take out the fuckin doji rule"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "(c > o ? \"down\" : \"up\"); /* fix417"}

## R107 - Cornerstone: 33% thirds immutable, measured session band to session band (σ lines + session/fresh VWAP), never zone/pink; real candle flip green->red / red->green every book except 5M + twin
- when: 2026-10-29T01:31:46+00:00
- Love: "alright , pls do ☹️ the 33% needs to be 1000000%  immutable. / it is from session band to session band. not the distance from one zone/band to another. again, cornerstone (Love Oct 28 2026 6:30-6:31 PM PT) + pls make these cornerstones of her (6:28 PM)"
- books: all except Poly 5M and delayed twin
- status: RETIRED - Love: "because this shit you just put on after i asked you to put them back on the checkpoint version is not the fucking checkpoint version"
- proof: {"code": "tools/cornerstones.py", "has": "SESSION BAND TO SESSION BAND"}
- proof: {"code": "tools/cornerstones.py", "has": "REAL FLIP"}

## R106 - fix416b: real candle flip (green->red / red->green, never born) for the copy and paper books too; 5M and delayed twin untouched
- when: 2026-10-29T01:25:21+00:00
- Love: "every single book dude yes / don’t touch 5M and twin / everyyyyyy other book needs a candle flip (Love Oct 28 2026 6:23 PM PT)"
- books: recon-togp, recon-np, recon-npo, recon-sov, recon-b2, recon-og
- status: RETIRED - Love: "because this shit you just put on after i asked you to put them back on the checkpoint version is not the fucking checkpoint version"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "is not a flip (copy)."}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix416b"}

## R105 - fix416: main + rejection (flipRule books) need a REAL flip - a 2-5m candle that traded the other colour first then turned her colour 10c gold / $5 BTC; born-red/born-green candles never count; no time wait
- when: 2026-10-29T01:21:59+00:00
- Love: "yes. we literallly did this 20 fuckin times bro yes. candle. flip. green -> red / red -> green (Love Oct 28 2026 6:21 PM PT, after: JUST. A. CANDLE. FLIP. IT WAS GREEN AND RISING.)"
- books: recon-tog, recon-rej, flipRule paper books
- status: RETIRED - Love: "because this shit you just put on after i asked you to put them back on the checkpoint version is not the fucking checkpoint version"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export function realFlipNow("}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "!realFlipNow(asset, side, tick)) why = `HER FLIP: no 2/3/4/5m candle has turned"}

## R104 - fix414: remove fix399 20% small-band tolerance from THE IMPOSSIBILITY - her 33% (and existing scale) stands for every book that had it; fix399 blue VWAP cross wall stays
- when: 2026-10-29T01:11:36+00:00
- Love: "Love Oct 28 2026 6:10 PM PT: "just keep it at 33% dude if that let that long through that’s a HARD no on 20% at this band width""
- books: e, v, e, r, y,  , K, a, l, s, h, i,  , b, o, o, k,  , f, i, x, 3, 9, 9,  , r, e, a, c, h, e, d,  , (, m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , c, o, p, y, ,,  , p, u, r, e, ,,  , e, t, c, ., ;,  , 5, M,  , f, r, o, z, e, n,  , f, i, l, e,  , u, n, t, o, u, c, h, e, d, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix414"}

## R103 - fix413: SESSION BAND AHEAD OF THE PINK = WAIT back at the door for main/rej/copy - when pink is her closest line and the session band in front is closer than the one behind, no trade into it until it breaks or rejects
- when: 2026-10-29T01:08:51+00:00
- Love: "Love Oct 28 2026 6:06 PM PT: "DUDE. IT IS A STRICT BAND TOLERANCE. PRICE BREAKING PINK DOES NOT REMOVE THAT." + 6:07 PM: "and yesssss it did bro i’ve seen her wait on that exact trade a trillllllion times." (to: bring back SESSION BAND AHEAD OF THE PINK = WAIT, card option Rejection, main + copy)"
- books: m, a, i, n,  , (, r, e, c, o, n, -, t, o, g, ), ,,  , r, e, j, e, c, t, i, o, n,  , (, r, e, c, o, n, -, r, e, j, ), ,,  , c, o, p, y,  , (, r, e, c, o, n, -, t, o, g, p, ,,  , p, a, p, e, r,  , n, o, w, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix413"}

## R102 - fix412: the rejection model (recon-rej) takes the live seat back from the no-pink copy in every rejection hour, both assets (offHourMain.rejSeatHours 0-23; fix412Prev keeps the old list). The copy stays paper.
- when: 2026-10-29T01:04:28+00:00
- Love: "Love Oct 28 2026 6:03 PM PT: "do not run this model bro i’m not retraining a model again" + 6:03 PM: "put her on the rejection model""
- books: r, e, j, e, c, t, i, o, n,  , (, r, e, c, o, n, -, r, e, j, ),  , l, i, v, e,  , s, e, a, t, ;,  , c, o, p, y,  , (, r, e, c, o, n, -, t, o, g, p, ),  , o, f, f,  , l, i, v, e
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "offHourMain.rejSeatHours", "equals": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}

## R101 - fix411: HELD ON HER SIDE at the door - main/rej/copy: every wall (impossibleGeo) must also pass at the least-favourable price of the last 3 s (one-tick spike through pink can no longer count as the break). Breaks still instant otherwise.
- when: 2026-10-29T01:01:01+00:00
- Love: "Love Oct 28 2026 5:56 PM PT: "and please reinforce that barrier if you can ... she needs to be ON the side of the break she cannot trade without price being on the same side of the break this is veryyyy old news" + 5:59 PM: "pls reinforce everything""
- books: m, a, i, n,  , (, r, e, c, o, n, -, t, o, g, ), ,,  , r, e, j, e, c, t, i, o, n,  , (, r, e, c, o, n, -, r, e, j, ), ,,  , c, o, p, y,  , (, r, e, c, o, n, -, t, o, g, p, ), ;,  , 5, M,  , f, r, o, z, e, n,  , u, n, t, o, u, c, h, e, d, ;,  , t, w, i, n,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix411"}

## R100 - fix410: Poly 5M stake back to $5 (polyTwin.rej5m.dollars 7.5 -> 5); refreeze the 5M on these words
- when: 2026-10-29T00:45:16+00:00
- Love: "Love Oct 28 2026 5:41 PM PT: "let’s bring the 5M back to $5 for a bit too hun , let’s let her get stable again 💘""
- books: P, o, l, y,  , 5, M,  , o, n, l, y,  , (, r, e, c, o, n, -, r, e, j, -, 5, m, )
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "polyTwin.rej5m.dollars", "equals": 5}

## R099 - fix409: gold PINK TO GREEN no short in the bottom 55% (was 60%) and PINK TO RED no long in the top 55% (was 50%) for main + rejection + copy (flipRule || togpLoose; paper books on main walls follow). Twin + others keep 50%.
- when: 2026-10-29T00:40:05+00:00
- Love: "Love Oct 28 2026 5:37 PM PT: "yeah let’s make it 55% hun that’s good" + 5:39 PM: "55% for shorts and longs pls 💞 main rejection and copy bb""
- books: m, a, i, n,  , (, r, e, c, o, n, -, t, o, g, ), ,,  , r, e, j, e, c, t, i, o, n,  , (, r, e, c, o, n, -, r, e, j, ), ,,  , n, o, -, p, i, n, k,  , c, o, p, y,  , (, r, e, c, o, n, -, t, o, g, p, ), ;,  , g, o, l, d,  , o, n, l, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix409"}

## R098 - fix408: recon-og = PAPER book rebuilt from grok v1 elements (desk-project/src/lib/desk/vwap.ts): rolling 60-min VWAP + half-sigma bands 0.5-3 on 1/2/3/4/5m frames, tap-reject only (came from that side, tagged, not broken, pushed off), through the same guard as pure (fix401 gate: main walls + 2-5m flip + blue check)
- when: 2026-10-29T00:17:44+00:00
- Love: "Love Oct 28 2026 5:07 PM PT: "do you think we can try running another paper book with the half sigmas and see how that does? the og rolling vwap? on the 1, 2,3,4&5M timeframes? i have the source code of the OG model (grok v1) ... let's see how those do, and definitely give them the same guard ok" + 5:14 PM: "its in there by the name of desk project bb" + 5:15 PM: "we may need to just take the elements of that strategy/model, and rewrite it from the ground up. there's toooo many bugs , it would be easier to just redo it ourselves""
- books: n, e, w,  , p, a, p, e, r,  , l, a, n, e,  , r, e, c, o, n, -, o, g,  , o, n, l, y, ;,  , n, o,  , l, i, v, e,  , l, i, s, t, ;,  , n, o,  , o, t, h, e, r,  , b, o, o, k,  , c, h, a, n, g, e, s
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix408"}

## R097 - fix407: main + rejection HER FLIP needs a 2/3/4/5m candle at least $5 (BTC) / 10c (gold) past its open her way (anyFlipMinNow), like the copy
- when: 2026-10-29T00:16:12+00:00
- Love: "Love Oct 28 2026 5:12 PM PT: "yess pls bb 💘" (to: should main and rejection also get the $5 / 10c minimum flip - the copy already has it)"
- books: m, a, i, n,  , (, r, e, c, o, n, -, t, o, g, ),  , +,  , r, e, j, e, c, t, i, o, n,  , (, r, e, c, o, n, -, r, e, j, ), ;,  , s, c, o, p, e,  , o, f,  , p, a, p, e, r,  , b, o, o, k, s,  , t, h, a, t,  , s, h, a, r, e,  , t, h, e,  , f, l, i, p, R, u, l, e,  , l, i, n, e,  , p, e, n, d, i, n, g,  , L, o, v, e
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix407"}

## R096 - fix406: CORNERSTONE #1 HER FLIP = 2/3/4/5m (no 1m) - anyFlipNow + anyFlipMinNow loops [2,3,4,5]; HER FLIP message text
- when: 2026-10-29T00:09:45+00:00
- Love: "Love Oct 28 2026 5:07 PM PT: "and let’s go ahead and cut the 1M’s even though it’s not much of a save, it’s something :)" + card "Which books lose the 1m flip (2-5m only)?" -> "Main + rejection + copy" (All three Kalshi books need a 2, 3, 4 or 5m flip; Cornerstone #1 becomes 2-5m for them. Twin and 5M untouched.)"
- books: m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , n, o, -, p, i, n, k,  , c, o, p, y,  , (, +,  , p, u, r, e, /, s, o, v,  , p, a, t, h, s,  , t, h, a, t,  , c, a, l, l,  , a, n, y, F, l, i, p, N, o, w, ), ;,  , t, w, i, n,  , +,  , P, o, l, y,  , 5, M,  , (, b, a, n, d, l, o, c, k, 5, m, ),  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "for (const n of [2, 3, 4, 5] /* fix406"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (flipRule) { if (!why && !foTurn && !anyFlipNow(asset, side, tick))"}

## R095 - fix405: liveSkipHours btc + [0,21,23], gold + [20] - every Kalshi book sits those hours out live (paper keeps measuring); Poly untouched
- when: 2026-10-29T00:00:30+00:00
- Love: "Love Oct 28 2026 4:59 PM PT: "yes let’s cut those hours bb" (BTC 11 PM, 9 PM, midnight; gold 8 PM - from my 4:52 PM message)"
- books: a, l, l,  , K, a, l, s, h, i,  , l, i, v, e,  , b, o, o, k, s,  , f, o, r,  , t, h, o, s, e,  , a, s, s, e, t, -, h, o, u, r, s,  , (, i, n, c, l, .,  , r, e, c, o, n, -, r, e, j,  , 1, 1,  , P, M,  , s, e, a, t, ), ;,  , t, w, i, n,  , e, x, e, m, p, t,  , l, i, s, t,  , u, n, c, h, a, n, g, e, d, ;,  , P, o, l, y,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.btc", "equals": [0, 8, 18, 21, 23]}
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.gold", "equals": [4, 9, 20]}

## R094 - fix404: recon-b2 PAPER lane - tight bands (blueSmall399), price blew through band A, rejected off the next band B, 2/3/4/5m flip + main walls (fix401 gate)
- when: 2026-10-28T23:21:02+00:00
- Love: "Love Oct 28 2026 4:18 PM PT: "yes let’s do that hun / can we set it up for her to trade a candle flip at the 2nd bands for now ? / if price blows thru one and rejects and flips at the 2nd when bands are tight?" + 4:20 PM: "yess we’ll keep it paper for the next couple days :)" + card "Paper first""
- books: n, e, w,  , p, a, p, e, r,  , l, a, n, e,  , r, e, c, o, n, -, b, 2,  , o, n, l, y, ;,  , n, o, t, h, i, n, g,  , l, i, v, e,  , c, h, a, n, g, e, s
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "THE 2ND-BAND FLIP (fix404"}

## R093 - fix403: fix371 hold needs no pink touch; sticky until a 25c break over pink
- when: 2026-10-28T23:03:34+00:00
- Love: "Love Oct 28 2026 4:02 PM PT card "How should the gold downslope-under-pink hold work now?" -> "No longs till pink breaks" (While gold is sliding under an unbroken pink, no gold long at all until price breaks up through pink by 25c. No touch needed, no time-out.)"
- books: m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , n, o, -, p, i, n, k,  , c, o, p, y,  , g, o, l, d,  , l, o, n, g, s,  , o, n,  , K, a, l, s, h, i,  , o, n, l, y, ;,  , B, T, C, ,,  , t, w, i, n, ,,  , p, u, r, e, ,,  , s, o, v, e, r, e, i, g, n, ,,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/engine.ts", "has": "fix403: no touch needed"}

## R092 - fix402: one $5 add-on only - addOn.second.on false (first add-on $5 at 2.8x stays)
- when: 2026-10-28T22:57:36+00:00
- Love: "Love Oct 28 2026 3:57 PM PT: "no 1 $5 add on pls""
- books: m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , n, o, -, p, i, n, k,  , c, o, p, y,  , (, K, a, l, s, h, i, ), ;,  , t, w, i, n,  , +,  , P, o, l, y,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "addOn.second.on", "equals": false}

## R091 - fix402: $5 entry (liveBook.dollars, offHourMain.dollars, live-size) for main/rej/copy; add-ons unchanged
- when: 2026-10-28T22:57:28+00:00
- Love: "Love Oct 28 2026 3:57 PM PT: "dude please put her back on at $5 til we figure this out she has lost like 10 trades on blocked trades""
- books: m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , n, o, -, p, i, n, k,  , c, o, p, y,  , (, K, a, l, s, h, i, ), ;,  , t, w, i, n,  , +,  , P, o, l, y,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveBook.dollars", "equals": 5}

## R090 - fix401: pure no-pink (recon-np, recon-npo) + sovereign (recon-sov) book only with a 2/3/4/5m flip her way (anyFlip2Now, no 1m), main walls via impossibleGeo (pure zone 0.5, sov 0.4), blue VWAP half-width check while bands small; refusals -> data/pure-walls.jsonl
- when: 2026-10-28T22:54:05+00:00
- Love: "Love Oct 28 2026 3:50 PM PT: "fix all of those hun pls including longs i dont care if they won" + 3:52 PM: "same band tolerances as our other models pls and the 2,3,4&5M candle flips pls""
- books: r, e, c, o, n, -, n, p, ,,  , r, e, c, o, n, -, n, p, o, ,,  , r, e, c, o, n, -, s, o, v,  , o, n, l, y,  , (, b, o, t, h,  , p, a, p, e, r, -, o, n, l, y,  , l, i, v, e,  , n, o, w, ), ;,  , m, a, i, n, /, r, e, j, /, c, o, p, y, /, t, w, i, n, /, 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix401 (Oct 28 2026 3:52 PM PT"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export function anyFlip2Now"}

## R089 - fix400: sovLive.on false - the no-pink copy holds gold rejection hours again
- when: 2026-10-28T22:37:34+00:00
- Love: "card: No-pink copy, like BTC (Sovereign comes off gold live (stays paper); the no-pink copy holds every gold rejection hour, like this morning)"
- books: r, e, c, o, n, -, s, o, v,  , l, i, v, e,  , s, e, a, t,  , o, n, l, y,  , (, p, a, p, e, r,  , k, e, e, p, s,  , r, u, n, n, i, n, g, ), ;,  , c, o, p, y,  , t, a, k, e, s,  , g, o, l, d,  , r, e, j, e, c, t, i, o, n,  , h, o, u, r, s, ;,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "sovLive.on", "equals": false}

## R088 - fix400: pure no-pink (recon-np) off the gold Kalshi live seat too (npLive.hoursByAsset.gold = []), paper keeps running
- when: 2026-10-28T22:36:15+00:00
- Love: "yes the rejection model we had running earlier goes back for btc and gold not just btc that model needs work bb"
- books: r, e, c, o, n, -, n, p,  , l, i, v, e,  , s, e, a, t,  , o, n, l, y,  , (, g, o, l, d,  , h, o, u, r, s,  , f, a, l, l,  , t, o,  , t, h, e,  , r, e, j, e, c, t, i, o, n,  , s, e, a, t,  , /,  , m, a, i, n, ), ;,  , P, o, l, y,  , 5, M,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "npLive.hoursByAsset.gold", "equals": []}

## R087 - fix399: while blue VWAP to 1σ < $150 BTC / $3 gold - THE IMPOSSIBILITY top/bottom tolerance 20% (not 33%) in impossibleGeo (not the Poly twin), and at the Kalshi wire no long/short that must cross the unbroken blue VWAP to reach the window target
- when: 2026-10-28T22:31:44+00:00
- Love: "Love Oct 28 2026 3:24 PM PT: "hun she’s supposed to be on 20% when bands are this small , and can you put a no trades that have to cross the blue vwap to get to the target when bands are this small? the btc long would have been blocked" + 3:27 PM: "omg my bad bb i thought you mentioned the 33% band tolerance. and gold or btc is allowed to long / short ANYWHERE BUT - the 33/20 tolerances hun" + 3:28 PM: "i was talking about the bands, not the green/pink ratio hun" / "that can stay as is at 50%" + card "All Kalshi books, 5M frozen""
- books: a, l, l,  , K, a, l, s, h, i,  , b, o, o, k, s, ;,  , P, o, l, y,  , 5, M,  , +,  , P, o, l, y,  , t, w, i, n,  , u, n, t, o, u, c, h, e, d, ;,  , g, r, e, e, n, /, p, i, n, k,  , r, a, t, i, o,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "ACROSS THE BLUE VWAP"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "export function blueSmall399"}

## R086 - fix398: pure no-pink off BTC Kalshi (npLive.hoursByAsset.btc = []), rejection model (recon-rej) holds BTC every hour (offHourMain.rejHoursByAsset.btc 0-23). fix398Prev saved. Gold untouched. Pure keeps paper
- when: 2026-10-28T22:20:10+00:00
- Love: "Love Oct 28 2026 3:19 PM PT: "she longed btc on a falling red candle hun this model is not working like the rejection one we had running pls put that one back on til we iron this out this is too many bad trades""
- books: B, T, C,  , K, a, l, s, h, i,  , s, e, a, t, :,  , p, u, r, e,  , n, o, -, p, i, n, k,  , o, f, f, ,,  , r, e, j, e, c, t, i, o, n,  , m, o, d, e, l,  , o, n
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "npLive.hoursByAsset.btc", "equals": []}

## R085 - fix397: wireWall (every Kalshi opening order, every book): when session VWAP to +1σ < $150 BTC / $3 gold, no long under unbroken VWAP within half that width, no short over it within half
- when: 2026-10-28T21:49:32+00:00
- Love: "Love Oct 28 2026 2:46 PM PT: "we need to keep the blue vwap a wall on all books when bands are small" + card "Make the blue VWAP a wall on which books when bands are small?" -> "All Kalshi books, 5M frozen""
- books: a, l, l,  , K, a, l, s, h, i,  , b, o, o, k, s,  , (, m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , c, o, p, y, ,,  , s, o, v, e, r, e, i, g, n, ,,  , p, u, r, e,  , n, o, -, p, i, n, k, ,,  , d, e, l, a, y, e, d,  , t, w, i, n, ), ;,  , P, o, l, y,  , 5, M,  , +,  , P, o, l, y,  , t, w, i, n,  , u, n, t, o, u, c, h, e, d
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "THE BLUE VWAP WALL (fix397"}

## R084 - fix396: pure no-pink own taps (fix395) fire only while price is within half the distance from the tapped band to the next line her way
- when: 2026-10-28T21:47:31+00:00
- Love: "Love Oct 28 2026 2:45 PM PT: "dude she just longed btc into a band" + 2:46 PM card "Make pure's own taps fire only near the band she tapped?" -> "Yes, nearer half only""
- books: p, u, r, e,  , n, o, -, p, i, n, k,  , o, n, l, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "const half96"}

## R083 - fix395: pure no-pink HER OWN TAPS - recon.ts block after fix389b: price taps one of her bands (σ/VWAP/Bollinger/green zone longs/red zone shorts) within BTC $10 / gold 50c this 5m candle, not broken through, pushes off her tap, any 1-5m flip her way -> her own Tap-reject call (recon-np live + recon-npo paper); 5m open irrelevant; pink stacked check; main walls still apply
- when: 2026-10-28T21:37:47+00:00
- Love: "Love Oct 28 2026 2:36 PM PT: "hun i’ve asked several times now, i want her to be able to take her own calls." + 2:37 PM PT: "hun i’ve asked for this several times now, i want pure to be able to take her own taps""
- books: p, u, r, e,  , n, o, -, p, i, n, k,  , o, n, l, y
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "HER OWN TAPS (fix395"}

## R082 - fix394: bonesDecide zoneFlip param - green zone long / red zone short read passes on any 1-5m candle flipped her way (anyFlipNow), not only the 5m candle; on for main lookT (recon.ts 588) and the pure no-pink own-eyes read (669). Copy/twin follow main calls; rejection + sov own reads unchanged
- when: 2026-10-28T21:35:48+00:00
- Love: "Love Oct 28 2026 2:34 PM PT: "and the candle flipped from green bb" + 2:34 PM "why didn’t she get in hun?" + 2:35 PM card "Let green/red zone rejections fire on any 1-5m candle flip?" -> "Pure no-pink + main""
- books: m, a, i, n,  , +,  , p, u, r, e,  , n, o, -, p, i, n, k,  , (, c, o, p, y,  , r, e, a, d, s,  , m, a, i, n,  , c, a, l, l, s, )
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix394: main"}

## R081 - fix393: live-switch addOn.maxAsk 0.263 -> 0.357 (first add-on at first band touch at 2.8x+) for main, rejection, copy, sovereign, pure no-pink; delayed twin (addOn.twin) and Polymarket/5M untouched
- when: 2026-10-28T21:29:02+00:00
- Love: "Love Oct 28 2026 2:26 PM PT: "well she is supposed to do her default 2.8x hun, and thennn catch the other at a band rejection ... if not we can bring that back , btc ended up coming our way and she didn’t add on" + 2:28 PM card "Lower the first add-on to 2.8x+ for which books?" -> "All $10 books""
- books: m, a, i, n, ,,  , r, e, j, e, c, t, i, o, n, ,,  , n, o, -, p, i, n, k,  , c, o, p, y, ,,  , s, o, v, e, r, e, i, g, n, ,,  , p, u, r, e,  , n, o, -, p, i, n, k
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "path": "addOn.maxAsk", "eq": 0.357}

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
- status: RETIRED - Love: "Love Oct 28 2026 3:57 PM PT: "dude please put her back on at $5 til we figure this out she has lost like 10 trades on blocked trades" + "no 1 $5 add on pls" - superseded by R091/R092 (fix402)"
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
- status: RETIRED - Love: "Love Oct 28 2026 3:35 PM PT: "yes the rejection model we had running earlier goes back for btc and gold not just btc that model needs work bb" + card "No-pink copy, like BTC" (Sovereign comes off gold live (stays paper); the no-pink copy holds every gold rejection hour, like this morning) - superseded by R088/R089 (fix400)"
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
- status: RETIRED - Love: "Love Oct 28 2026 6:03 PM PT: "put her on the rejection model" (R102, fix412: rejection seat every hour)"
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
- status: RETIRED - Love: "Love Oct 28 2026 5:37-5:39 PM PT: "yeah let’s make it 55% hun" + "55% for shorts and longs pls 💞 main rejection and copy bb" (R099, fix409)"
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
- status: RETIRED - Love: "Love Oct 28 2026 5:41 PM PT: "let’s bring the 5M back to $5 for a bit too hun" (R100, fix410)"
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
- status: RETIRED - Love: "Love Oct 28 2026 5:07 PM PT: "and let's go ahead and cut the 1M's even though it's not much of a save, it's something :)" + card "Main + rejection + copy" - Cornerstone #1 is now 2/3/4/5m (R096)"
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "for (const n of [1, 2, 3, 4, 5])"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (flipRule) { if (!why && !foTurn && !anyFlipNow(asset, side, tick))"}

## R001 - ONE BOOK AT A TIME - never assume every book changes; main never moves an atom
- when: 2026-10-27T12:04:00Z
- Love: "if i am working on ONE book with you, please do not assume i want every book changed. / make sure my main book doesn't. move. an. ATOM."
- books: every book
- status: ACTIVE
- proof: {"test": "tools/verify-golden.py"}
- proof: {"process": "before any fix, name every book that reads the touched code and tell Love"}
