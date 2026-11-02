# Rule map

Written Nov 01 2026 11:09 PM by tools/rule-map.py, at commit 1108c484 fix628: her pill taps never trip the umpire (R324).

Read-only. No rule reads this file. 238 active requests, 104 cornerstones, 0 proof lines not found.

## Active requests

| Rule | Her rule | Lives at | Proof text | Last touched by |
| --- | --- | --- | --- | --- |
| R001 | ONE BOOK AT A TIME - never assume every book changes; main never moves an atom | tools/verify-golden.py | test |  |
|  |  | process | before any fix, name every book that reads the touched code … |  |
| R003 | Thirds only BLOCK: no short in the bottom share, no long in the top share, clear everywhere else (Cornerstone) | tools/cornerstones.py | test |  |
| R005 | Sliding thirds share: gold 33% under $10, 20% $10-25, 15% over $25; BTC 33% under $500, 20% over | src/lib/desk/bandlock.ts:188 | if (asset === "btc") return width > 500 ? 0.2 : 0.33; | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:189 | if (asset === "gold" && width >= 10) return width > 25 ? 0.1… | c91077b5 full desk snapshot for new project |
| R006 | Gold 1 PM live on | data/live-switch.json key liveSkipHours.gold | = null |  |
| R007 | Main takes any setup that fits her rules when she is not in a position on Kalshi | tools/free-to-trade-test.py | test |  |
| R008 | FREE TO TRADE on main: only an EXECUTED Kalshi trade locks the window | src/lib/desk/recon.ts:541 | let freeId = ""; | c91077b5 full desk snapshot for new project |
|  |  | tools/free-to-trade-test.py | test |  |
| R009 | Never cite the Oct 20 'take the other side' line as Love's rule | process | never quote it to Love as her rule |  |
| R010 | Every thread's conversation is saved to the GitHub repo | process | save-thread.py into HISTORY/ after each fix and before finis… |  |
| R012 | Nothing is left out of the GitHub repo without asking Love first | process | list any file not going in and ask Love; only node_modules a… |  |
| R013 | 5M book back on the walls she had at her best (6:29 AM, before fix319) - fix339 | src/lib/desk/bandlock5m.ts | file exists |  |
|  |  | src/lib/desk/engine.ts:3229 | const blm5 = await import("./bandlock5m") | c91077b5 full desk snapshot for new project |
| R014 | Ask before changing anything Love asked NOT to be changed | process | every fix lists the books it touches and waits for Love's wo… |  |
| R015 | A schedule tap puts the change on that book | process | read offHourMain.rejHoursByAsset[asset] and bookSkipHoursByA… |  |
| R016 | Rejection model free to trade too (fix340) | src/lib/desk/recon.ts:542 | lane === "recon-rej" /* fix340 | c91077b5 full desk snapshot for new project |
|  |  | tools/free-to-trade-test.py | test |  |
| R017 | A call she never took on Kalshi never holds her (fix341) | src/lib/desk/recon.ts:542 | fix341 | c91077b5 full desk snapshot for new project |
|  |  | tools/free-to-trade-test.py | test |  |
| R018 | Free to trade can never quietly come undone (cornerstone 5 + run test in the umpire) | tools/umpire.py:17 | tools/free-to-trade-test.py | c91077b5 full desk snapshot for new project |
|  |  | LOVE-RULEBOOK.md:22 | 5. FREE TO TRADE | c91077b5 full desk snapshot for new project |
| R019 | CORNERSTONE #1: every request is recorded FIRST, kept immutably, and can only leave on Love's words | tools/requests.py | file exists |  |
|  |  | tools/umpire.py:17 | tools/requests.py | c91077b5 full desk snapshot for new project |
|  |  | LOVE-RULEBOOK.md:11 | CORNERSTONE #1 - LOVE'S REQUEST BOOK | c91077b5 full desk snapshot for new project |
| R020 | CORNERSTONE #2: a 1:1 copy of every request, change and fix in the vault; what goes in stays in | tools/vault.py | file exists |  |
|  |  | tools/umpire.py:17 | tools/vault.py | c91077b5 full desk snapshot for new project |
|  |  | tools/save-her.py:21 | vault.py | c91077b5 full desk snapshot for new project |
|  |  | LOVE-RULEBOOK.md:13 | CORNERSTONE #2 - THE VAULT | c91077b5 full desk snapshot for new project |
| R021 | CORNERSTONE #3: every word Love says and every reply goes into the repository; every new thread starts with fu… | LOVE-RULEBOOK.md:15 | CORNERSTONE #3 - EVERY WORD | c91077b5 full desk snapshot for new project |
|  |  | process | every thread runs save-thread.py + save-project-chat.py into… |  |
| R022 | Track + log (record only) every 5M trade that comes from main's extra free-to-trade calls; leave the behaviour… | tools/extra-call-5m.py | file exists |  |
|  |  | tools/umpire.py:116 | tools/extra-call-5m.py | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:541 | let freeId = ""; | c91077b5 full desk snapshot for new project |
| R023 | fix342: a call skipped only because that book isn't live this hour no longer frees main/rejection every second… | src/lib/desk/recon.ts:542 | fix342 | c91077b5 full desk snapshot for new project |
|  |  | tools/free-to-trade-test.py | test |  |
| R024 | fix343: clear her record cache now + auto-clear every 4 hours (finished, unfilled records older than 3.5 h mov… | src/lib/desk/selfcheck.ts:136 | fix343 | c91077b5 full desk snapshot for new project |
| R025 | Gold 3-5 PM: red/green zones, pink and Bollingers stay tradeable (3 PM lines fix24 quietLines; 4-5 PM zones + … | src/lib/desk/recon.ts:78 | function quietLines(id: string, p: any): Line[] { | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:664 | for (const q of quietLines(id, p)) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:682 | LB.push({ name: "Green zone", price: Number(p.s1) | c91077b5 full desk snapshot for new project |
| R026 | fix344: gold 3:00-4:59 PM PT, session channel under $2: her thirds (THE IMPOSSIBILITY / ONLY IN HER THIRD) and… | src/lib/desk/bandlock.ts:1219 | fix344 | c91077b5 full desk snapshot for new project |
| R027 | fix344b: inside fix344's gold 3-5 PM tight-band slice, the session VWAP stays a wall - when VWAP is the band i… | src/lib/desk/bandlock.ts:2924 | fix344b | c91077b5 full desk snapshot for new project |
| R028 | fix345: a main-book (and no-pink copy) Bollinger rejection trades on any 1/2/3/4/5m flip her way (HER FLIP), n… | src/lib/desk/recon.ts:691 | fix345 | 9716cd3f fix618: the same entry logic, session band ahead of the pink (R316) |
| R033 | No-pink copy gets HER FLIP like main (fix325: entry needs a live 1-5m candle flipped her way, literal colour) … | src/lib/desk/bandlock.ts:3215 | fix349 | 44b42fd5 fix592+593+594: flip or born + session-band scale + zones at the door and last li… |
| R035 | No-pink copy, gold channels under $10: top/bottom 33% always (fix219 20% for channels within one fresh sigma n… | src/lib/desk/bandlock.ts:2916 | fix351 | c91077b5 full desk snapshot for new project |
| R037 | Delayed twin (recon-dly) = the no-pink copy with a delayed entry: books the copy read (firstT, pink out unless… | src/lib/desk/recon.ts:51 | fix353 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:1108 | fix353 | c91077b5 full desk snapshot for new project |
| R042 | Polymarket 5M sits out 3, 4, 5 AM, 1 PM, 9 PM PT (plus 11 PM already off): polyTwin.rej5m.skipHours [3,4,5,13,… | data/live-switch.json key polyTwin.rej5m.skipHours | = [3, 4, 5, 13, 21, 23] |  |
| R048 | Pure no-pink (recon-np): pink holds her only when pink is stacked with a session band in the outer 10% of the … | src/lib/desk/bandlock.ts:2863 | npPink = false /* fix363 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:759 | const stackN = | c91077b5 full desk snapshot for new project |
| R054 | fix368: pure no-pink (recon-np) only - no long with any unbroken band (pink, purple m5/m10/m15, session sigma/… | src/lib/desk/bandlock.ts:2881 | ANY BAND CUSHION (pure no-pink) | c91077b5 full desk snapshot for new project |
| R055 | fix369: pure no-pink any-band cushion BTC = $10 while session band width (+1 sigma - VWAP) < $180, 10% of the … | src/lib/desk/bandlock.ts:2877 | w369 >= 180 ? 0.10 * w369 : 10 | c91077b5 full desk snapshot for new project |
| R056 | fix370: selfcheck auto-clear every 1 hour (was 4); 3.5 h age line unchanged. | src/lib/desk/selfcheck.ts:142 | >= 1 * 3600000 /* fix370 | c91077b5 full desk snapshot for new project |
| R057 | fix371: main + rejection + no-pink copy, gold longs, Kalshi only: when gold is >$2 lower than 30 min ago, pink… | src/lib/desk/engine.ts:5813 | GOLD SLIDE UNDER PINK: gold | c91077b5 full desk snapshot for new project |
| R058 | fix372: recon-sov = SOVEREIGN paper twin: own bonesDecide read on the rejection board (session, pink, zones, B… | src/lib/desk/recon.ts:767 | book("recon-sov" | c91077b5 full desk snapshot for new project |
| R059 | fix373: BTC only - main/rej/copy unfilled long refused by a PINK wall re-aims to the short when the engine rea… | src/lib/desk/recon.ts:853 | re-aimed off the pink rejection (fix373) | c91077b5 full desk snapshot for new project |
| R061 | fix375: Kalshi copier - a call never tried on Kalshi and older than 90 s is skipped (stale), never sent. recon… | src/lib/desk/engine.ts:5427 | a seat that just opened never fires an old call (fix375) | c91077b5 full desk snapshot for new project |
| R062 | fix376: gold, main/rej/copy (and the paper delayed copy that shares copy walls): a trade pointing away from th… | src/lib/desk/bandlock.ts:3066 | CLEAR OF THE $10 LEVEL | c91077b5 full desk snapshot for new project |
| R063 | Strategy lab paper books (tools/lab-paper.py): Gold Snapback 15M, Gold Bollinger fade 15M+1H, BTC Bollinger fa… | tools/lab-paper.py:2 | STRATEGY LAB PAPER BOOKS | c91077b5 full desk snapshot for new project |
| R064 | fix377: gold, main/rej/copy (+ paper delayed copy): no long inside the 5m red zone (R1-R2), no short inside th… | src/lib/desk/bandlock.ts:2853 | INSIDE THE RED ZONE | c91077b5 full desk snapshot for new project |
| R065 | fix378: gold, main/rej/copy (+ paper delayed copy): no long within $1.50 under the 5m red zone (R1), no short … | src/lib/desk/bandlock.ts:3081 | $1.50 BEFORE THE RED ZONE | c91077b5 full desk snapshot for new project |
| R066 | fix379: BTC THE IMPOSSIBILITY top/bottom 33% (was fix219 20% for one-sigma channels) on main/rej/copy (+ paper… | src/lib/desk/bandlock.ts:2916 | fix379 | c91077b5 full desk snapshot for new project |
| R069 | fix382: Poly 5M walls (bandlock5m.ts) = bandlock.ts as of 4:57 AM PT Oct 27 (her 65% stretch, with fixes 295-3… | src/lib/desk/bandlock5m.ts:1 | THE 5M BOOK'S OWN WALLS - FROZEN (fix382 | c91077b5 full desk snapshot for new project |
| R073 | fix387: pure no-pink (recon-np) also takes main reads worded Tap-reject at <session band / red or green zone /… | src/lib/desk/recon.ts:756 | fix387 | c91077b5 full desk snapshot for new project |
| R076 | fix389: recon-npo = PURE NO-PINK WITH HER OWN EYES, PAPER: every tick she runs the engine read (bonesDecide, r… | src/lib/desk/recon.ts:50 | recon-npo | 1adc7b9c fix620: paper twin, the rejection book without pink entries (R318) |
| R077 | fix389b: LIVE pure no-pink (recon-np) also books her own band read (the recon-npo read: session bands, zones, … | src/lib/desk/recon.ts:780 | fix389b | c91077b5 full desk snapshot for new project |
| R078 | fix390: pure no-pink (recon-np) meets MAIN walls at the door, the paper sweep and the wire (impossibleGeo flag… | src/lib/desk/bandlock.ts:1108 | fix390 | c91077b5 full desk snapshot for new project |
| R079 | fix391: the pure no-pink own-eyes read (fix389/389b) never books a thirds read (Candle rising/falling, Launche… | src/lib/desk/recon.ts:774 | !/third/i.test(lb9) | c91077b5 full desk snapshot for new project |
| R080 | fix392: pure no-pink BTC PINK TO GREEN / PINK TO RED zoneGuard 0.5 (no short in bottom 50% green->pink, no lon… | src/lib/desk/bandlock.ts:1108 | fix392 | c91077b5 full desk snapshot for new project |
| R082 | fix394: bonesDecide zoneFlip param - green zone long / red zone short read passes on any 1-5m candle flipped h… | src/lib/desk/recon.ts:684 | fix394: main | c91077b5 full desk snapshot for new project |
| R083 | fix395: pure no-pink HER OWN TAPS - recon.ts block after fix389b: price taps one of her bands (σ/VWAP/Bollinge… | src/lib/desk/recon.ts:783 | HER OWN TAPS (fix395 | c91077b5 full desk snapshot for new project |
| R084 | fix396: pure no-pink own taps (fix395) fire only while price is within half the distance from the tapped band … | src/lib/desk/recon.ts:792 | const half96 | c91077b5 full desk snapshot for new project |
| R085 | fix397: wireWall (every Kalshi opening order, every book): when session VWAP to +1σ < $150 BTC / $3 gold, no l… | src/lib/desk/bandlock.ts:2727 | THE BLUE VWAP WALL (fix397 | c91077b5 full desk snapshot for new project |
| R087 | fix399: while blue VWAP to 1σ < $150 BTC / $3 gold - THE IMPOSSIBILITY top/bottom tolerance 20% (not 33%) in i… | src/lib/desk/bandlock.ts:2734 | ACROSS THE BLUE VWAP | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:171 | export function blueSmall399 | c91077b5 full desk snapshot for new project |
| R090 | fix401: pure no-pink (recon-np, recon-npo) + sovereign (recon-sov) book only with a 2/3/4/5m flip her way (any… | src/lib/desk/recon.ts:481 | fix401 (Oct 28 2026 3:52 PM PT | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:1600 | export function anyFlip2Now | c91077b5 full desk snapshot for new project |
| R092 | fix402: one $5 add-on only - addOn.second.on false (first add-on $5 at 2.8x stays) | data/live-switch.json key addOn.second.on | = false |  |
| R093 | fix403: fix371 hold needs no pink touch; sticky until a 25c break over pink | src/lib/desk/engine.ts:5746 | fix403: no touch needed | c91077b5 full desk snapshot for new project |
| R094 | fix404: recon-b2 PAPER lane - tight bands (blueSmall399), price blew through band A, rejected off the next ban… | src/lib/desk/recon.ts:802 | THE 2ND-BAND FLIP (fix404 | c91077b5 full desk snapshot for new project |
| R097 | fix407: main + rejection HER FLIP needs a 2/3/4/5m candle at least $5 (BTC) / 10c (gold) past its open her way… | src/lib/desk/bandlock.ts:1616 | fix407 | c91077b5 full desk snapshot for new project |
| R098 | fix408: recon-og = PAPER book rebuilt from grok v1 elements (desk-project/src/lib/desk/vwap.ts): rolling 60-mi… | src/lib/desk/recon.ts:485 | fix408 | c91077b5 full desk snapshot for new project |
| R099 | fix409: gold PINK TO GREEN no short in the bottom 55% (was 60%) and PINK TO RED no long in the top 55% (was 50… | src/lib/desk/bandlock.ts:1108 | fix409 | c91077b5 full desk snapshot for new project |
| R100 | fix410: Poly 5M stake back to $5 (polyTwin.rej5m.dollars 7.5 -> 5); refreeze the 5M on these words | data/live-switch.json key polyTwin.rej5m.dollars | = 5 |  |
| R102 | fix412: the rejection model (recon-rej) takes the live seat back from the no-pink copy in every rejection hour… | data/live-switch.json key offHourMain.rejSeatHours | = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 1… |  |
| R103 | fix413: SESSION BAND AHEAD OF THE PINK = WAIT back at the door for main/rej/copy - when pink is her closest li… | src/lib/desk/bandlock.ts:1111 | fix413 | c91077b5 full desk snapshot for new project |
| R104 | fix414: remove fix399 20% small-band tolerance from THE IMPOSSIBILITY - her 33% (and existing scale) stands fo… | src/lib/desk/bandlock.ts:2916 | fix414 | c91077b5 full desk snapshot for new project |
| R110 | tools/behaviour-umpire.js: loads her real bandlock.ts and replays real situations (born-red flip 6:16:04 PM, 5… | tools/behaviour-umpire.js:1 | BEHAVIOUR UMPIRE | c91077b5 full desk snapshot for new project |
| R113 | fix417: DOJI - green doji then red candle = shorts only; red doji then green candle = longs only; otherwise no… | src/lib/desk/bandlock.ts:3161 | only (fix417). | c91077b5 full desk snapshot for new project |
| R116 | fix421: no-pink copy off live (recon-togp out of liveBook.books); main + rejection model (its rejection hours)… | data/live-switch.json key liveBook.books | = ["recon-tog", "recon-rej", "recon-dly"] |  |
| R117 | fix422: bandlock.ts = exact Oct 27 7:56 PM checkpoint + fix417 doji only (green doji then red = short only, re… | src/lib/desk/bandlock.ts:3161 | only (fix417). | c91077b5 full desk snapshot for new project |
| R118 | fix423: slide-under-pink hold back (fix371/403 gold) + BTC (more than $40 lower than 30 min ago under unbroken… | src/lib/desk/engine.ts:5819 | export function slideHoldBtc423( | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:5800 | export function slideHold403( | c91077b5 full desk snapshot for new project |
| R120 | fix425: fix375 stale call guard back in the Kalshi copier (a call never tried on Kalshi and older than 90 s is… | src/lib/desk/engine.ts:5424 | STALE CALL GUARD (fix375 | c91077b5 full desk snapshot for new project |
| R125 | fix430: the pink's reach in her wall (reachWall429, main + rejection, gold + BTC) = the larger of $1.50 gold /… | src/lib/desk/bandlock.ts:548 | export const PINK_PCT429 = 0.15; | c91077b5 full desk snapshot for new project |
|  |  | tools/reach-test-429.cjs | test |  |
| R127 | fix432: main + rejection, longs only - no long while price is under the 5m pink or less than 25c gold / $8 BTC… | src/lib/desk/bandlock.ts:1116 | const pl432 = pinkLongWall432(asset, lbR.L, qR.c, side) | c91077b5 full desk snapshot for new project |
|  |  | tools/stale-pink-test-431.cjs | test |  |
| R128 | Cornerstone 0h: nothing is removed from her code or live-switch without Love's own words - not by a restore, a… | LOVE-RULEBOOK.md:32 | 0h. CORNERSTONE - NOTHING LEAVES WITHOUT LOVE SAYING SO | c91077b5 full desk snapshot for new project |
|  |  | tools/no-removal-gate.py | file exists |  |
|  |  | data/LOVE-RESTORE-OPTIONS-2026-10-28.md | file exists |  |
| R129 | fix433 item 1: fix394 back for MAIN only - bonesDecide zoneFlip: a green-zone long / red-zone short read passe… | src/lib/desk/recon.ts:684 | true /* fix394: main (fix433) */ | c91077b5 full desk snapshot for new project |
| R130 | fix433 item 2: already in her - slideHold403 is identical to before the 6:45 PM restore (back via fix423 at 7:… | src/lib/desk/engine.ts:5746 | fix403: no touch needed | c91077b5 full desk snapshot for new project |
|  |  | tools/slide-test.cjs | test |  |
| R131 | fix433 item 3: offHourMain.rejSeatHours 0-23 back in live-switch. The no-pink copy is off live (fix421), so th… | data/live-switch.json key offHourMain.rejSeatHours | = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 1… |  |
| R134 | fix433 item 7: anyFlipNow + anyFlipMinNow back to 2/3/4/5m (no 1m) as before the restore (main Bollinger/zone … | src/lib/desk/bandlock.ts:1588 | fix406 back as fix433 | c91077b5 full desk snapshot for new project |
| R135 | The fix411 3-second hold stays OUT (Love 7:36 PM "no 3 second hold" + 8:23 PM "8-keep it out"). | src/lib/desk/bandlock.ts | must not contain: fix411 | absent, as her rule asks |
| R136 | Every pick and fix from tonight is a cornerstone in LOVE-RULEBOOK.md (section 0i) and in tools/cornerstones.py… | LOVE-RULEBOOK.md:44 | 0i. CORNERSTONES - LOVE'S PICKS OF OCT 28 NIGHT | c91077b5 full desk snapshot for new project |
| R137 | Cornerstone 0j: only Love's TYPED words can remove/retire/change a rule; a decision-card tap never counts as c… | LOVE-RULEBOOK.md:34 | 0j. CORNERSTONE - CONSENT IS LOVE'S TYPED WORDS | c91077b5 full desk snapshot for new project |
|  |  | tools/no-removal-gate.py:23 | def typed(w): | c91077b5 full desk snapshot for new project |
| R138 | Cornerstone 0k: the no-removal gate works both ways - any rule line or setting taken out OR put in (or changed… | LOVE-RULEBOOK.md:42 | 0k. CORNERSTONE - NOTHING IN, NOTHING OUT | c91077b5 full desk snapshot for new project |
|  |  | tools/no-removal-gate.py:50 | def code_adds(old, new, T): | c91077b5 full desk snapshot for new project |
| R139 | Cornerstone 0l: every change and every statement between Love and Claude goes into the repository - desk threa… | LOVE-RULEBOOK.md:40 | 0l. CORNERSTONE - EVERYTHING IS IN THE REPOSITORY | c91077b5 full desk snapshot for new project |
|  |  | tools/save-desk-thread.py | file exists |  |
|  |  | HISTORY/thread-2026-10-28-desk-night-wall-and-gate.md | file exists |  |
| R140 | fix434: ON HER SIDE OF THE BREAK, her 33% - main + rejection: her 33% channel runs session band to session ban… | src/lib/desk/bandlock.ts:1118 | const ss434 = sameSide434(asset, lbR.L, qR.c, side) | c91077b5 full desk snapshot for new project |
|  |  | tools/side-test-434.cjs | test |  |
| R141 | CORNERSTONE: her 33% NEVER leaves under any circumstances - THE WALL 33% (channelPct / channelPctTop 0.33, ban… | data/live-switch.json key channelPct.gold | = 0.33 |  |
|  |  | data/live-switch.json key channelPct.btc | = 0.33 |  |
|  |  | data/live-switch.json key channelPctTop.gold | = 0.33 |  |
|  |  | data/live-switch.json key channelPctTop.btc | = 0.33 |  |
| R142 | Repo sync: download GitHub's official gh 2.103.3 macOS arm64 (14.1 MB) to ~/gh-cli (outside her folder), sign … | process | every desk sync excludes only node_modules/ and .secrets/ (L… |  |
| R143 | Standing rule: after EVERY change and every exchange that matters, the desk (minus .secrets/ and node_modules/… | process | push the desk + HISTORY thread save to the repo after every … |  |
| R144 | fix435: at the Kalshi wire (kalshi-live place()), every main + rejection opening order - re-aims included - al… | src/lib/desk/kalshi-live.server.ts:331 | her walls could not be checked for this order - it does not … | c91077b5 full desk snapshot for new project |
| R147 | fix439 (staged with fix438): the gold PINK TO GREEN / PINK TO RED refusal messages print her real share - 55% … | src/lib/desk/bandlock.ts:3049 | no gold short in the bottom ${flipRule ? 55 : 50}% of it. /*… | c91077b5 full desk snapshot for new project |
| R148 | Sweep pick 6 BACK for main + rejection only: the 3 PM channel of pink / R1-S1 / Bollinger (fix24, switched off… | process | pick 6 (3 PM channel) for main + rejection - build pending, … |  |
| R149 | fix440: Love's correction of fix376 (main + rejection, gold). fix376's CLEAR OF THE $10 LEVEL (held trades goi… | src/lib/desk/bandlock.ts:3071 | no trading into an even $10 level within $1.50; only away fr… | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts | must not contain: CLEAR OF THE $10 LEVEL: ${side | absent, as her rule asks |
|  |  | tools/ten-level-test-440.cjs | test |  |
| R150 | fix442: the thirds flip is OFF for main + rejection (fix364 only took it off the copy) - a call her thirds rea… | src/lib/desk/engine.ts:5432 | THIRDS FLIP OFF (fix442) | c91077b5 full desk snapshot for new project |
|  |  | tools/thirds-off-test-442.cjs | test |  |
| R151 | fix441: main + rejection - when this 5m candle broke a session band or the pink UP by her break distance (gold… | src/lib/desk/bandlock.ts:1120 | const bt441 = brokeThisCandle441(asset, lbR.L, qR.c, side) | c91077b5 full desk snapshot for new project |
|  |  | tools/broke-candle-test-441.cjs | test |  |
| R152 | PR #1 (claude/project-thread-mj3rmw -> main, head 792805a) merged into main with a merge commit (every commit … | process | main carries the Oct 28 night desk sync via PR #1 merge (Lov… |  |
| R153 | fix443 (main + rejection, gold, TEMPORARY until the sliding scale): her reach wall (fix429) $1.50 -> $1 on ses… | src/lib/desk/bandlock.ts:545 | export const REACH429: Record<string, number> = { gold: 1, b… | c91077b5 full desk snapshot for new project |
|  |  | tools/reach-test-429.cjs | test |  |
| R154 | fix444: the 90-second drop for HELD calls (fix431, main + rejection) taken out - a call a wall is holding stay… | src/lib/desk/engine.ts | must not contain: an old call never fires (fix431) | absent, as her rule asks |
|  |  | src/lib/desk/engine.ts:5424 | STALE CALL GUARD (fix375 | c91077b5 full desk snapshot for new project |
| R155 | Her reach wall (fix429, main + rejection) as it stands after fix443: no trade into an unbroken session band or… | src/lib/desk/bandlock.ts:1115 | const rw429 = reachWall429(asset, lbR.L, qR.c, side) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:545 | export const REACH429: Record<string, number> = { gold: 1, b… | c91077b5 full desk snapshot for new project |
|  |  | tools/reach-test-429.cjs | test |  |
| R157 | fix446: main + rejection - in her read (recon.ts perspective, HER CANDLE), a band-rejection read (Rejected up/… | src/lib/desk/recon.ts:684 | true /* fix446: main */ | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:1005 | true /* fix446: rejection */ | c91077b5 full desk snapshot for new project |
|  |  | tools/band-flip-test-446.cjs | test |  |
| R161 | fix450: BTC on main + rejection gets Love's 55% exactly like gold (fix409): no BTC long in the top 55% of pink… | src/lib/desk/bandlock.ts:1108 | (book === "recon-tog" \|\| book === "recon-rej") ? 0.55 /* f… | c91077b5 full desk snapshot for new project |
| R166 | Standing rule: every performance number for any book is counted ONLY by the structure in place (her live take-… | process | performance always counted by her live structure (Love Oct 2… |  |
| R169 | fix456 (in progress): the Polymarket 5M book becomes its own walled-off model, put back to how it ran on Oct 2… | process | 5M walled off as its own model (Love Oct 29 10:27 AM) - buil… |  |
| R170 | fix457: main + rejection (gold + BTC, never the 5M) - a session band or the pink that broke DOWN this 5m candl… | tools/broke-candle-test-457.cjs | test |  |
| R172 | R169 decision: the walled-off 5M model waits for the 1M flip only (fix188: a finished 1m candle closed her way… | process | 5M walled-off build (R169) - 1M flip only |  |
| R173 | R169 decision: the walled-off 5M model is built from her exact Oct 27 code (the copy that ran Oct 27 AM, 79%),… | process | 5M walled-off build from Oct 27 (R169/R172/R173) |  |
| R174 | R169 5M build spec: doors = a finished 1m, 2m, 3m, 4m or 5m candle that closed her way after her call (no 4+/3… | process | 5M walled-off build (R169/R172/R173/R174) |  |
| R175 | (1) the $10 rule applies ONLY when the window target is AT a $10 level (price 4018, target 4020: no long into … | process | recorded; (1)/(3) waiting on report + Love's book choice; (2… |  |
| R176 | fix459: a long is refused by the unbroken pink (fix432 never-long-under-pink and fix429/430 pink reach) only w… | tools/pink-15-20-test-459.cjs | test |  |
| R177 | (1) the 9 used installers moved into INSTALLERS-ALREADY-USED (nothing deleted); (2) STANDING NOTE (no code cha… | INSTALLERS-ALREADY-USED | file exists |  |
| R178 | No pink-break exemption to the 55% walls (nothing staged). Question to answer: why main did not short BTC 11:1… | process | answered in report; no code change |  |
| R179 | Entries are AT the break, not halfway after the move or later. Question: what stopped the BTC short at the pin… | process | answered in report |  |
| R180 | fix413 SESSION BAND AHEAD must not treat a far session band ($250 away on BTC) as an obstacle - it should only… | process | staging; tolerance from her recorded words |  |
| R181 | fix460: SESSION BAND AHEAD (fix413) refuses only when the unbroken session band ahead is within 33% of the ses… | tools/session-ahead-33-test-460.cjs | test |  |
| R182 | fix460 confirmed: the SESSION BAND AHEAD wait (fix413) refuses only a long in the top 33% / a short in the bot… | tools/session-ahead-33-test-460.cjs | test |  |
| R183 | fix460 delivered as INSTALL-THIRDS-ONLY.command; stays in: behaviour test tools/session-ahead-33-test-460.cjs … | tools/session-ahead-33-test-460.cjs | test |  |
| R184 | LATER (not now): sliding scale - the thirds are 20/33 when the bands are wider (Love to set with Claude). NOW:… | process | recorded for later; no change |  |
| R185 | Umpire enforcement gate (staging): every opening order needs a fresh umpire SAFE stamp whose file hashes match… | process | staging |  |
| R186 | Umpire enforcement gate: main + rejection only for now; zero order lag - the umpire verdict is computed ahead … | process | staging |  |
| R187 | Umpire gate option A (report-only for the 46 old items) - yes, if those items are other books'. | process | 46 items sorted for Love |  |
| R188 | NOTE: R101 (fix411 3-second hold) stays retired per Love's typed words R120/R135; 'same side of the break' is … | src/lib/desk/bandlock.ts:764 | export function sameSide434( | c91077b5 full desk snapshot for new project |
| R189 | fix461: THE UMPIRE AT THE WIRE - every opening order of main (recon-tog) + rejection (recon-rej) needs the ump… | tools/umpire-gate-test-461.cjs | test |  |
| R190 | Trace (read-only): the gold rejection long read 12:31 PM under a session band, and why the red-flip short was … | process | traced; no change |  |
| R191 | FREE TO TRADE, enforced for main + rejection: independent calls (every fresh read stands on its own and goes t… | process | building |  |
| R192 | fix463: main + rejection - a flipped read (' - seen as a short/long ') is never booked as her call; every fres… | tools/independent-calls-test-463.cjs | test |  |
| R193 | fix463 also: her READ (main + rejection) never calls a long in the top 33% with an unbroken session band above… | tools/independent-calls-test-463.cjs | test |  |
| R195 | Read-only: today's Polymarket 5M results, old lane before 11:30 vs the walled-off Oct 27 5M since 11:30. | process | reported |  |
| R196 | Trace (read-only first) the 1:02 PM gold rejection short above the pink and near the bottom third; fix through… | process | traced |  |
| R197 | Pink both ways: no SHORT within 15% gold / 20% BTC of the channel (band to band) of an unbroken pink below pri… | process | building |  |
| R198 | fix464: every pink rule both sides on main + rejection - the never-trade-into-an-unbroken-pink wall (fix432) g… | tools/pink-both-sides-test-464.cjs | test |  |
| R199 | CHECK-HER-RULES.command (read-only, any time): replays today's real misses on her LIVE code, plain words, ✓/✗;… | CHECK-HER-RULES.command | file exists |  |
| R200 | Both-sides audit twice (from the rulebook, from the code) + a behaviour test per rule per side on the live cod… | process | auditing |  |
| R201 | The 1:02:06 PM gold short was in her bottom 33% by her chart - find why the rejection door passed it and fix i… | process | tracing |  |
| R202 | fix464 ships now: every band tolerance both sides on main + rejection at the door and in the read; add-ons pas… | tools/pink-both-sides-test-464.cjs | test |  |
| R203 | fix464 (INSTALL-1PM-SHORT-FIX.command): main + rejection - pinkShortWall464 (never short into an unbroken pink… | tools/pink-both-sides-test-464.cjs | test |  |
| R204 | Scope locked: finish fix464 (band tolerances / pink both sides, main + rejection) + CHECK-HER-RULES both sides… | process | in progress |  |
| R205 | Trace the ~1:15 PM main/rejection trade; add it to the staged fix and CHECK-HER-RULES as a real-miss test. | process | in progress |  |
| R206 | A hard 33% for the thirds on EVERY Kalshi book (no long in the top 33%, no short in the bottom 33%, every shar… | process | building on top of fix464 |  |
| R207 | INSTALL-33-ALL-BOOKS excludes the delayed book (recon-dly, recon-dlyk, dlyThirds) entirely; every other Kalshi… | process | building after fix464 lands |  |
| R208 | The walled-off 5M also gets the hard 33% thirds (Love names the 5M) - only her thirds shares, in her own files… | process | building |  |
| R209 | Every book except the delayed book (recon-dly / recon-dlyk): hard 33% thirds both sides (door + read + launch)… | process | building |  |
| R210 | Same scope as R209; commands handed over only when CHECK-HER-RULES runs every 33% + pink rule long and short f… | process | checking |  |
| R211 | fix465 (INSTALL-33-PINK-ALL-BOOKS.command): lockPctFor a hard 33% for every book except the delayed book (reco… | tools/check-her-rules.cjs | test |  |
| R212 | fix466 (INSTALL-5M-33-PINK.command): the walled-off 5M in her own files - hard 33% thirds (walls + read), her … | tools/check-her-rules.cjs | test |  |
| R213 | Standing: every band tolerance works both ways. INSTALL-MIRRORS.command: mirror the BTC Bollinger-near-pink dr… | process | building |  |
| R214 | fix467 (INSTALL-MIRRORS.command): every book but delayed - NO LONGS IN THE TOP RUNG (mirror of fix296), BOLLIN… | tools/check-her-rules.cjs | test |  |
| R215 | fix468 (INSTALL-5M-MIRRORS.command): the walled-off 5M in her files - NO LONGS IN THE TOP RUNG + BOLLINGER WIT… | tools/check-her-rules.cjs | test |  |
| R217 | CORNERSTONE CONCRETE: guard the guards (tools/cornerstone-manifest.py, hashes sealed only under an R id of Lov… | tools/cornerstone-manifest.py | file exists |  |
|  |  | tools/state-guard.py | file exists |  |
|  |  | CHECK-CORNERSTONE-SEALS.command | file exists |  |
|  |  | tools/umpire.py:43 | tools/cornerstone-manifest.py | c91077b5 full desk snapshot for new project |
|  |  | tools/umpire.py:46 | tools/state-guard.py | c91077b5 full desk snapshot for new project |
| R219 | tools/exit-archive.py copies every exit from data/exit-log.json (the desk's own 80-exit window, untouched) int… | tools/exit-archive.py | file exists |  |
|  |  | tools/exit-archive-loop.sh | file exists |  |
|  |  | START-EXIT-ARCHIVE.command | file exists |  |
| R220 | fix470 - THE MARKET READ HOLDS: src/lib/desk/kalshi.ts fetchSeriesMarket reads each series once and shares it … | src/lib/desk/kalshi.ts:153 | fix470 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi.ts:166 | fetchSeriesMarketRead470 | c91077b5 full desk snapshot for new project |
| R221 | golden baseline follows her LIVE flip: live/at/note of data/live-switch.json re-pinned (plus liveBook dollars/… | process | verify-golden shows no drift on live/at/note |  |
| R222 | tools/save-her.py copies file bytes only (shutil.copyfile, no flag/stat copy) so every save is whole again und… | tools/save-her.py:12 | copy_function=shutil.copyfile | c91077b5 full desk snapshot for new project |
| R224 | used INSTALL-*/CHANGE-*/LOCK commands moved into INSTALLERS-ALREADY-USED (moved, not deleted; still locked) | INSTALLERS-ALREADY-USED/INSTALL-UMPIRE-GATE.command | file exists |  |
| R226 | fix472 - (1) bandlock.ts bandSelfTest judges on a neutral clock (noon) so her gold 3-5 PM tight-band slice (fi… | src/lib/desk/bandlock.ts:1218 | fix472 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:5437 | fix472: a rejection off a line inside her green | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
| R227 | fix476 - NO RULE SWITCHED OFF: tools/no-switch-off-gate.py in the umpire (OUT = NOT SAFE = main + rejection op… | tools/no-switch-off-gate.py | file exists |  |
|  |  | tools/umpire.py:49 | tools/no-switch-off-gate.py | c91077b5 full desk snapshot for new project |
| R228 | golden baseline follows her in-app schedule pill: bookSkipHours/bookSkipHoursByAsset/offHourMain (+ live/at/no… | process | verify-golden GOLDEN after; umpire stamp |  |
| R229 | fix477: the umpire re-checks her about 3 s after any setting in data/live-switch.json changes (LIVE, size slid… | process | rehearsed on a copy: pill tap -> GOLDEN, another setting cha… |  |
| R230 | fix479: every read main (recon-tog) or rejection (recon-rej) refuse inside the read itself - a flipped read (f… | process | type-checked: no new errors in recon.ts; no-removal gate on … |  |
| R231 | PUT-HER-RULES-BACK: (1) fix466 + fix468 on the walled-off 5M (never landed Oct 29) via their own installers; (… | process | rehearsed on a full private copy: both 5M installs land, no-… |  |
| R232 | fix481: cornerstones 28-33 (fix479 skip log, fix480 paper books, fix466/fix468 5M + check in the umpire, fix47… | tools/cornerstones.py | test |  |
|  |  | tools/libs-fingerprint.py | test |  |
| R233 | fix483: (1) brokeThisCandle457 frees the trade back once price broke back by her distance, and its 33% stops c… | tools/broke-candle-test-457.cjs | test |  |
|  |  | src/lib/desk/bandlock.ts:181 | if (asset === "btc" && width > 1000 && !DLY465.has(String(G.… | c91077b5 full desk snapshot for new project |
| R234 | fix484: her reach wall (reachWall429: $50 BTC / $1 gold to an unbroken session band or the pink, pink 15% gold… | src/lib/desk/bandlock.ts:1149 | const rw484 = reachWall429(asset, lb.L, q.c, side) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock5m27.ts:179 | function reachWall484( | c91077b5 full desk snapshot for new project |
| R235 | data/five5m/spine-lock.json recon5m.ts re-signed to the 5M as installed today (fix466/fix468 R231, fix483 R233… | process | data/five5m/spine-lock-status.json ok |  |
| R236 | fix485: gold sliding scale 33/20/15 every book but delayed (lockPctFor, thirdsRead463, sameSide434, brokeThisC… | src/lib/desk/bandlock.ts:1110 | MAIN'S RULES (fix486) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock5m.ts:313 | function brokeThisCandle486b( | c91077b5 full desk snapshot for new project |
| R237 | fix487: BTC 20% once the session-band channel is over $500 (33% at $500 and under) - lockPctFor (every book bu… | src/lib/desk/bandlock.ts:180 | if (asset === "btc" && width > 500 && !DLY465.has(String(G._… | c91077b5 full desk snapshot for new project |
| R243 | fix493: data/copy-timing.jsonl (her Oct 8 SPEED WATCH) adds liveAsk (the live Kalshi ask the copier ordered of… | src/lib/desk/engine.ts:5466 | liveAsk: ask493, liveAskAgeMs: age493 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi.ts:168 | (m as any).__readAt493 = Date.now() | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:84 | 34. THE ORDER LOG | c91077b5 full desk snapshot for new project |
| R244 | fix494: slideHold403 / slideHoldBtc423 / climbHold464 (engine.ts) and slideHold466 / climbHold466 (five5m.ts, … | src/lib/desk/engine.ts:5809 | candles hit the pink and rejected on a down slope | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/five5m.ts:39 | candles hit the pink and rejected on a down slope | c91077b5 full desk snapshot for new project |
|  |  | tools/slide-test.cjs | test |  |
|  |  | tools/slide-test-btc.cjs | test |  |
|  |  | tools/pink-both-sides-test-464.cjs | test |  |
| R245 | fix495: the hourly fix343/fix370 cache clear in selfcheck.ts also archives FILLED rows older than 24 h from da… | src/lib/desk/selfcheck.ts:150 | fix495 old filled orders | c91077b5 full desk snapshot for new project |
| R246 | fix496: cornerstone 35 in tools/cornerstones.py - the hourly cache clear (fix343/fix370 never-filled rows afte… | tools/cornerstones.py:89 | 35. HER HOURLY CACHE CLEAR | c91077b5 full desk snapshot for new project |
| R247 | fix500: THE ENFORCER in kalshi-live.server.ts enterLive - every live order blocked unless data/UMPIRE-VERDICT.… | src/lib/desk/bandlock.ts:2845 | export function zoneTolerance497( | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:5469 | THE FILL AUDITOR (fix499 | c91077b5 full desk snapshot for new project |
|  |  | tools/umpire.py:76 | tools/behaviour-umpire.cjs | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi-live.server.ts:1238 | THE ENFORCER (fix500): the umpire is not SAFE | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:93 | 36. THE ENFORCER | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
|  |  | tools/check-her-rules.cjs | test |  |
| R248 | fix501: tools/sub-auditor.cjs - his own process (engine.ts starts and restarts him); engine.ts copier hands ev… | src/lib/desk/engine.ts:5441 | HIS STAMP BEFORE HER ORDER (fix501) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:4784 | ROUTE IT FROM HER TO HIM (fix501 | c91077b5 full desk snapshot for new project |
|  |  | tools/umpire.py:79 | tools/sub-auditor.cjs | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:96 | 37. THE SUB-AUDITOR | c91077b5 full desk snapshot for new project |
|  |  | tools/sub-auditor.cjs | file exists |  |
| R255 | tools/exit-archive.py copies every exit from data/exit-log.json (the desk's own 80-exit window, untouched) int… | tools/exit-archive.py | file exists |  |
|  |  | tools/exit-archive-loop.sh | file exists |  |
|  |  | START-EXIT-ARCHIVE.command | file exists |  |
| R256 | fix509: bandlock.ts + bandlock5m.ts + bandlock5m27.ts - PINK 10% cushion loop (with BTC $50 / $25 floors, copy… | src/lib/desk/bandlock.ts:2991 | PINK 10% CUSHION (with its BTC $50 / $25 floors), THE COPY | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:2981 | Math.min(50, 0.10 * (above - below)) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:626 | const reach509 =  | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
|  |  | src/lib/desk/bandlock5m27.ts:2651 | TARGET PAST A BAND - OUT | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:1071 | THE TWIN HAND-OFF (fix448) - OUT | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:114 | 42. HER ANSWERS | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
|  |  | tools/pink-far-test-503.cjs | test |  |
|  |  | tools/reach-test-429.cjs | test |  |
| R257 | fix510 - live-switch liveSkipHours gold [] and btc [] (was gold [4,5,6,7], btc [1,14,21]); old values in liveS… | data/live-switch.json:3032 | liveSkipHoursPrev510 | 683decd0 Save point 20261101-1031: V.11 |
| R258 | fix511 (log only): recon.ts bonesDecide remembers the candidates it dropped when it returns empty (globalThis.… | src/lib/desk/recon.ts:727 | EMPTY READ (fix511) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:340 | __drop511 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:76 | an empty read too (fix479, R230; fix511) | c91077b5 full desk snapshot for new project |
|  |  | tools/independent-calls-test-463.cjs | test |  |
| R259 | fix514: bandlock.ts + bandlock5m.ts + bandlock5m27.ts - PINK CUSHION restored as one rule whose distance is he… | src/lib/desk/bandlock.ts:3000 | PINK CUSHION: long | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock5m27.ts:2593 | ONE PINK CUSHION (FIVE5M fix514 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:5485 | const absolute512 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:4971 | fix513 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/five5m.ts:280 | FIVE5M fix513 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:117 | 43. ONE THING | c91077b5 full desk snapshot for new project |
|  |  | tools/slide-test.cjs | test |  |
|  |  | tools/slide-test-btc.cjs | test |  |
|  |  | tools/pink-far-test-503.cjs | test |  |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R260 | fix515: engine.ts - slideRun515 (the 3-plus-rejections slope with NO break release) + at the three hold sites … | src/lib/desk/engine.ts:5758 | export function slideRun515( | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:4974 | SHORTS ONLY AT A SLID PINK (fix515) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:4971 | LONGS ONLY AT A CLIMBED PINK (fix515) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/five5m.ts:277 | FIVE5M fix515 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:120 | 44. ONE WAY AT A SLOPED PINK | c91077b5 full desk snapshot for new project |
|  |  | tools/pink-shorts-only-test-515.cjs | test |  |
|  |  | tools/slide-test.cjs | test |  |
|  |  | tools/slide-test-btc.cjs | test |  |
| R261 | fix515c: bandlock.ts - pinkSpent515c (broken up $2 / $200 and not re-broken 25c / $8 back) + the fix432 / fix4… | src/lib/desk/bandlock.ts:657 | export function pinkSpent515c( | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:757 | __zoneRej515c | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:438 | zoneFree515c | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/five5m.ts:278 | FIVE5M fix515c | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:123 | 45. ZONE REJECTIONS FREE OF A SPENT PINK | c91077b5 full desk snapshot for new project |
|  |  | tools/pink-shorts-only-test-515.cjs | test |  |
|  |  | tools/slide-test.cjs | test |  |
|  |  | tools/pink-far-test-503.cjs | test |  |
| R262 | fix516: engine.ts - the exits pass tracks her held set (__held516); a ticker that leaves it gets every resting… | src/lib/desk/engine.ts:1984 | NULL AND VOID AT THE CLOSE (fix516 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:1987 | __held516 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi-live.server.ts:1613 | export async function cancelRestingOn( | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi-live.server.ts:1612 | export function tpClosedMark( | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:127 | 46. NULL AND VOID AT THE CLOSE | c91077b5 full desk snapshot for new project |
| R263 | fix517: the pink reset = 10% gold / 5% BTC of the band-to-band channel ($2 / $200 only when unreadable) in sli… | src/lib/desk/engine.ts:5763 | her reset is 10% gold / 5% BTC of the channel width | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:2851 | the escape side is never flagged | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock5m27.ts:2475 | fix506 both-sides inside-zone block OUT (fix517 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:107 | the escape side is never flagged (her 8:38 AM, fix517) | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
|  |  | tools/pink-shorts-only-test-515.cjs | test |  |
|  |  | tools/slide-test.cjs | test |  |
|  |  | tools/pink-far-test-503.cjs | test |  |
| R264 | fix518: all 67 questionnaire answers sealed verbatim in data/HER-ANSWERS-2.json as CORNERSTONE 47 (the umpire … | src/lib/desk/bandlock.ts:3089 | rejection of the band above | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:2981 | REMOVED as dead weight (fix518 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:133 | 47. HER QUESTIONNAIRE | c91077b5 full desk snapshot for new project |
|  |  | data/HER-ANSWERS-2.json:474 | PINK TO RED, PINK TO GREEN | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
|  |  | tools/slide-test.cjs | test |  |
| R265 | fix519: offCapture519 measures chart-minus-target in each windows first ~25 seconds (carried when missed; logg… | src/lib/desk/engine.ts:1257 | SCORED BY KALSHI ALONE (fix519 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:1211 | offCapture519 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:357 | __ktOff519 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:136 | 48. THE DIFFERENCE DEDUCTED | c91077b5 full desk snapshot for new project |
|  |  | tools/strike-off-test-519.cjs | test |  |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R266 | fix520: her 1.5x floor (66c cap) on every live order and lane - kalshi-live wire checks (4 sites), recon live-… | src/lib/desk/kalshi-live.server.ts:280 | her 1.5x floor (fix520) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi-live.server.ts:1408 | const minMult = 1.5; | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:2417 | return 1.5; // fix520 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:141 | 49. ONLY HER CHOSEN RULES | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
|  |  | tools/strike-off-test-519.cjs | test |  |
| R267 | fix521 (amended 1:03 PM): send test = a 2-5m colour TURN by her minimum (realFlipNow, fails closed); the pink … | src/lib/desk/bandlock.ts:736 | UNDER THE PINK = NO LONGS (fix521 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:692 | export function herColour520( | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:5810 | lower than 2 minutes ago | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:145 | 50. UNDER THE PINK = NO LONGS | c91077b5 full desk snapshot for new project |
|  |  | tools/week-replay-521.cjs | test |  |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R268 | fix523+524 ALL DOORS CLOSED: AUDIT_FLAGS523 single table (bandlock) for auditor + wire + sub-auditor (sub pars… | src/lib/desk/bandlock.ts:709 | export const AUDIT_FLAGS523 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi-live.server.ts:883 | fix524: NOTHING between this test and the send | 1adc7b9c fix620: paper twin, the rejection book without pink entries (R318) |
|  |  | src/lib/desk/kalshi-live.server.ts:1718 | ADD-ON DISABLED (fix524 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/engine.ts:178 | REPORT-ONLY (fix524 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/fns.ts:37 | armGate524 | c91077b5 full desk snapshot for new project |
|  |  | scripts/hit-one.mjs:4 | It sends nothing | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:152 | 51. ALL DOORS CLOSED | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
|  |  | tools/week-replay-521.cjs | test |  |
| R269 | fix522: withForming522 in pivotbooks.ts - at each minute turn, until the chart delivers the new 1m candle, the… | src/lib/desk/pivotbooks.ts:536 | withForming522 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/pivotbooks.ts:535 | never stored, only read | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:156 | 52. HER PIVOTS ROLL ON TIME | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R270 | fix525 PINK AT 3/4 ON TIGHT BTC BANDS: while the BTC session-band channel is $80-$180 wide, the pink tolerance… | src/lib/desk/bandlock.ts:627 | fix525 | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R271 | fix526 HER PINK TOLERANCE IN DOLLARS: at every pink site (the reach cushion, pinkFar503, pinkBeyond459 and the… | src/lib/desk/bandlock.ts:627 | fix526 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:159 | 53. HER PINK TOLERANCE IN DOLLARS | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R272 | fix527 BANDS ARE WALLS AGAIN AT 100: the BTC session carry hands back to the fresh session bands at sigma USD1… | src/lib/desk/bandlock.ts:2326 | fix527 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:162 | 54. BANDS ARE WALLS AGAIN AT | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R273 | fix528 A FADED FLIP NEVER STANDS, SEALED: her 4:28 PM flip-fade law becomes cornerstone 55 - the wire tests he… | tools/behaviour-umpire.cjs | test |  |
| R274 | fix531 DELETE THE INDEX: the Oct 18 index-gap + $30 bias strike translation is DELETED from kalshi.ts; INDEX_B… | src/lib/desk/kalshi.ts:73 | fix530 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:169 | 56. NO INDEX | c91077b5 full desk snapshot for new project |
| R275 | fix532 THE CANDLE FLIP: turnFlip530 - a 2/3/4/5m candle that TURNS red-to-green / green-to-red (traded the oth… | src/lib/desk/bandlock.ts:744 | turnFlip530 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:165 | 55. HER FLIP, THE AUDITOR BEHIND IT | c91077b5 full desk snapshot for new project |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R276 | fix533 ONE FEED: the Oct 3 Vantage confirm study tick and the 5M SOLE-V Vantage-lines lane are retired in engi… | src/lib/desk/engine.ts:3748 | fix530 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:172 | 57. ONE FEED | c91077b5 full desk snapshot for new project |
| R277 | fix534 SPEED HER LOOP: pure speed, zero rule or behavior change. (1) pivotbooks parses the 3.4MB card file (gr… | src/lib/desk/pivotbooks.ts:27 | __ogRead534 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:177 | 58. HER LOOP RUNS LIGHT | c91077b5 full desk snapshot for new project |
| R278 | fix535 THE CARD FILES CLEAR HOURLY: her hourly clear (fix343/370/495) now covers grok-og.json and night-book.j… | src/lib/desk/selfcheck.ts:160 | fix535 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:181 | 59. THE CARD FILES CLEAR HOURLY | c91077b5 full desk snapshot for new project |
| R279 | fix536 LET HER RUN: the fill auditors entries-OFF shut-off is lifted - every fill her door refuses is recorded… | src/lib/desk/engine.ts:5486 | LET HER RUN (fix536 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:184 | 60. LET HER RUN | c91077b5 full desk snapshot for new project |
| R280 | fix538 PINK FLOOR EVERYWHERE: the fix514 pink cushion (the one site fix526 missed, read 53.60 tonight) now run… | src/lib/desk/bandlock.ts:2998 | fix538 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:159 | fix525/526/538 | c91077b5 full desk snapshot for new project |
| R281 | fix539 FAST AT THE BREAK: impossibleGeo (the door every lane and the wire judge with) reads the live Peppersto… | src/lib/desk/bandlock.ts:2864 | HER LIVE TICK AT THE DOOR (fix539 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:187 | 61. HER LIVE TICK AT THE DOOR | c91077b5 full desk snapshot for new project |
| R282 | fix541 HER BREAK IS 5 DOLLARS: the BTC pink break distance drops from 8 to 5 dollars at every site - the cushi… | src/lib/desk/bandlock.ts:660 | fix541 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:191 | 62. HER BREAK IS | c91077b5 full desk snapshot for new project |
| R283 | fix542 PINK 25 FOR NOW: every BTC pink tolerance site is capped at a flat 25 dollars - temporary by her word. … | src/lib/desk/bandlock.ts:627 | fix542 TEMPORARY | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:194 | 63. PINK | c91077b5 full desk snapshot for new project |
| R284 | fix544 BOTH ENTRIES: her flip law carries BOTH paths at every door site - ENTRY 1 the turn (the 2-5m candle tr… | src/lib/desk/bandlock.ts:1657 | ENTRY 2 - BORN HER COLOUR | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:197 | 64. BOTH ENTRIES LIVE | c91077b5 full desk snapshot for new project |
| R285 | fix545 LET HER BOOKS BREATHE: (1) re-sign the spine lock for the recon.ts her BREAK-AT-5 click installed - her… | tools/pink-15-20-test-459.cjs:25 | fix542/545 | c91077b5 full desk snapshot for new project |
| R287 | fix548 THE 3PM RULE IS GONE: the fix452/454 hour hold on rejections (lately width-released by fix547) is DELET… | src/lib/desk/engine.ts:5433 | THE 3 PM TIME RULE IS DELETED (fix548 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:72 | 27. NO TIME-OF-DAY RULE | c91077b5 full desk snapshot for new project |
| R288 | fix550 PINK CAP ON THE READ: the recon read-side pink wall (pinkRead464) now runs her exact tolerance law - mi… | src/lib/desk/recon.ts:459 | fix550 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:159 | fix525/526/538/550 | c91077b5 full desk snapshot for new project |
| R289 | fix552 BOLLINGER 25: the BTC Bollinger cushion is a flat 25 dollars - same as her pink - replacing the old 50-… | src/lib/desk/bandlock.ts:2980 | fix552 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:116 | fix552 | c91077b5 full desk snapshot for new project |
| R290 | fix557 ONE FEED, EVERYWHERE: quotes.ts subscribes PEPPERSTONE:BTCUSD + TVC:GOLD only (INDEX:BTCUSD / OANDA:XAU… | src/lib/desk/quotes.ts:25 | fix557 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:207 | 66. ONE FEED, EVERYWHERE | c91077b5 full desk snapshot for new project |
| R291 | fix558 HER RULES ONLY, ENFORCED: tools/umpire-stamp.py has no report-only (rule-anchors + requests decide SAFE… | tools/umpire-stamp.py:11 | REPORT_ONLY = set() | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:212 | 67. HER RULES ONLY, ENFORCED | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/umpire-gate.ts:25 | fix558 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py | test |  |
| R292 | fix559 BTC ZONES = HER 55% ONLY: the $50 BTC distance around the green/red zones (fix497 ZONE_TOL497 btc) is g… | src/lib/desk/bandlock.ts:2844 | btc: 0 }; const BB_TOL559 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock5m27.ts:2468 | btc: 0 }; const BB_TOL559 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:215 | 68. BTC ZONES = HER 55% ONLY | c91077b5 full desk snapshot for new project |
| R293 | fix560 SHORTS ONLY ON A PINK DOWNSLOPE TIL HER 10%: the slide hold (no long under a sliding pink) and its clim… | src/lib/desk/engine.ts:4971 | fix560: her 10% of the channel width | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:217 | 69. SHORTS ONLY ON A PINK DOWNSLOPE TIL HER 10% | c91077b5 full desk snapshot for new project |
|  |  | tools/slide-ten-test-560.cjs | test |  |
| R294 | fix561 HER $5 BREAK AT THE PINK WALLS TOO: PINK_BREAK432 btc 8 -> 5 in bandlock.ts, so the never-long-under / … | src/lib/desk/bandlock.ts:654 | btc: 5 }; // fix561 | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:219 | 70. HER $5 BREAK AT THE PINK WALLS TOO | c91077b5 full desk snapshot for new project |
|  |  | tools/stale-pink-test-431.cjs | test |  |
| R295 | fix-pro PRO SIGN IN: quotes.ts fetches her TradingView Pro token from www.tradingview.com/quote_token/ through… | src/lib/desk/quotes.ts:254 | const r = await curlGetPro(url, cookie); | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/quotes.ts:186 | quote_token | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:222 | 73. PRO SIGN IN | c91077b5 full desk snapshot for new project |
| R296 | fix565 ONE PINK (gaps closed): pivotbooks onePink565 = CM_Pivot Bands V1 5m from the one chart read + live tic… | src/lib/desk/pivotbooks.ts:526 | function pinkFresh565( | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon5m.ts:438 | onePink565R5(id, b) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/kalshi-live.server.ts:791 | no pink at the wire - no order (fix565) | c91077b5 full desk snapshot for new project |
|  |  | tools/cornerstones.py:228 | 74. ONE PINK | c91077b5 full desk snapshot for new project |
| R297 | fix571 WEEKEND-PINK-25 overlay: a flat $25 pink tolerance over BOTH BTC and gold at every pink-distance site, … | src/lib/desk/bandlock.ts:630 | __PINKFLAT25 | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
|  |  | src/lib/desk/recon.ts:447 | __PINKFLAT25 | c91077b5 full desk snapshot for new project |
|  |  | tools/pink-flag-25-test.cjs:10 | PINK FLAG25 | c91077b5 full desk snapshot for new project |
| R298 | fix573: tools/behaviour-umpire.cjs made __PINKFLAT25-aware. When the weekend $25 overlay is on, the two pink s… | tools/behaviour-umpire.cjs:7 | FLAT25 | c91077b5 full desk snapshot for new project |
| R299 | Re-sign the spine lock to the current recon.ts (092ef8b41624bbaf, from R297) so the reconstructed books resume… | words only |  |  |
| R300 | When the spine lock is in drift (recon.ts changed without a re-sign), recon's read returned false BEFORE the s… | words only |  |  |
| R301 | Re-sign the spine lock so the reconstructed books resume booking (carries the checkable proof R299 was meant t… | data/spine-lock-status.json key ok | = true |  |
|  |  | data/spine-lock.json:6 | recon.ts | not committed yet |
|  |  | tools/requests.py:102 | isinstance(pr, (dict, str)) | c91077b5 full desk snapshot for new project |
| R302 | On a spine drift, log the reason to recon-skips.jsonl before the books hold, so the freeze never hides its cau… | src/lib/desk/recon.ts:465 | SPINE DRIFT (fix575) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:465 | run UNFREEZE-HER-BOOKS | c91077b5 full desk snapshot for new project |
| R303 | Lift the 4-hour arm requirement from every fns writer/button: the armGate524 hook still logs each call but no … | src/lib/desk/fns.ts:38 | arm requirement lifted (fix578) | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/fns.ts:37 | function armGate524 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/fns.ts | must not contain: the desk is not armed | absent, as her rule asks |
| R304 | fix579: in reachWall429 the pink (5m PP) counts as broken behind her at HER pink break - BTC $5 / gold 25c (PI… | src/lib/desk/bandlock.ts:631 | fix579 | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:631 | const dBrk579 = pink ? | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:631 | PINK_BREAK432[asset] : d) : d | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:632 | tick >= P + dBrk579 : tick <= P - dBrk579 | c91077b5 full desk snapshot for new project |
|  |  | tools/five-break-enters-579.cjs | test |  |
|  |  | tools/reach-test-429.cjs | test |  |
|  |  | tools/pink-both-sides-test-464.cjs | test |  |
| R305 | fix580 GAP CLOSED: (1) recon.ts bonesDecide break candidate (the line still waiting past $5) used BREAK btc $6… | src/lib/desk/recon.ts:180 | const brkL580 = String(l.name) === "5m PP" ? (asset === "btc… | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:36 | const BREAK: Record<string, number> = { btc: 5, gold: 0.33 }… | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/recon.ts:447 | export const __PINKFLAT25 = false; | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:788 | export const __PINKFLAT25 = false; | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:792 | export function pinkSlide580( | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/bandlock.ts:1716 | export const BREAK_DIST: Record<string, number> = { btc: 5, … | c91077b5 full desk snapshot for new project |
|  |  | tools/pink-break-casts-580.cjs | test |  |
|  |  | tools/pink-flag-25-test.cjs | test |  |
|  |  | tools/broke-candle-test-457.cjs | test |  |
|  |  | tools/five-break-enters-579.cjs | test |  |
|  |  | tools/pink-15-20-test-459.cjs | test |  |
|  |  | tools/pink-far-test-503.cjs | test |  |
| R306 | fix583 THIRDS FREE AT $5: the falling-from-the-top-third / rising-from-the-bottom-third walls (bandlock awayVe… | src/lib/desk/bandlock.ts:439 | const rel583 = asset === "btc" ? 5 : dist; | c91077b5 full desk snapshot for new project |
|  |  | tools/thirds-five-583.cjs | test |  |
| R307 | fix584 PINK SLIDE HER WAY: engine slideHold403 / slideHoldBtc423 / climbHold464 hold only after 3 rejections (… | src/lib/desk/engine.ts:5775 | export function pinkThird584(asset: string, pp: number, dir:… | c91077b5 full desk snapshot for new project |
|  |  | src/lib/desk/bandlock.ts:729 | export const __PINKSLIDE_HERWAY584 = true; | c91077b5 full desk snapshot for new project |
|  |  | tools/slide-her-way-584.cjs | test |  |
| R308 | fix592+fix593+fix594 HER FLIP BAND ZONE AT THE SEND: fix594 zoneSend594 at the door (impossibleGeo) and the la… | src/lib/desk/kalshi-live.server.ts:801 | HER FLIP AT THE SEND (fix592) | 45769e2c fix596-599: BTC pink window, rejections only, lotto out, fake-out 3, waiver out (… |
|  |  | src/lib/desk/bandlock.ts:3213 | if (flipRule) { if (!why && !turnFlip530(asset, side, tick))… | 44b42fd5 fix592+593+594: flip or born + session-band scale + zones at the door and last li… |
|  |  | tools/behaviour-umpire.cjs:193 | fix592 BTC born path: red right after a green one, $11 under… | 44b42fd5 fix592+593+594: flip or born + session-band scale + zones at the door and last li… |
|  |  | src/lib/desk/bandlock.ts:550 | export function sessionScale593(asset: string, w: number): n… | 44b42fd5 fix592+593+594: flip or born + session-band scale + zones at the door and last li… |
|  |  | src/lib/desk/kalshi-live.server.ts:802 | SESSION BAND AT THE SEND (fix593) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/kalshi-live.server.ts:802 | B.zoneSend594(sym, L593, Number(q.c), side) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/bandlock.ts:574 | export function zoneSend594(asset: string, L: Line[], tick: … | 44b42fd5 fix592+593+594: flip or born + session-band scale + zones at the door and last li… |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R309 | fix595 SAME SIDE AT THE SEND: sameSideSend595 runs last in finalGate524, after color, session-band and zone. A… | src/lib/desk/kalshi-live.server.ts:802 | B.sameSideSend595(sym, L593, Number(q.c), side) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/bandlock.ts:588 | export function sameSideSend595(asset: string, L: Line[], ti… | adf6f84b fix595: same side of the break at the last line (R309) |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R310 | fix596 HER $25 PINK WINDOW: BTC pink tolerance $25 for the whole 2 PM PT hour, then while her session bands ar… | src/lib/desk/kalshi-live.server.ts:801 | B.labelHold597(book, sym | 45769e2c fix596-599: BTC pink window, rejections only, lotto out, fake-out 3, waiver out (… |
|  |  | src/lib/desk/engine.ts:5438 | labelHold597(String(row.book) | 45769e2c fix596-599: BTC pink window, rejections only, lotto out, fake-out 3, waiver out (… |
|  |  | src/lib/desk/bandlock.ts:2830 | if (upF >= 3 && hiF > B.p | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R311 | fix600: main and rejection enter at $5 (maxDollars, liveBook.dollars, offHourMain.dollars, live-size.json doll… | src/lib/desk/kalshi-live.server.ts:1695 | async function addOnBuy600( | 45769e2c fix596-599: BTC pink window, rejections only, lotto out, fake-out 3, waiver out (… |
|  |  | src/lib/desk/engine.ts:2313 | addOnAt28600(bid, aoMax) | 45769e2c fix596-599: BTC pink window, rejections only, lotto out, fake-out 3, waiver out (… |
|  |  | data/live-switch.json key liveBook.dollars | = 5 |  |
|  |  | data/live-switch.json key addOn.on | = true |  |
|  |  | data/live-switch.json key addOn.maxAsk | = 0.357 |  |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R312 | fix611 a rejection with its 2-5m flip passes the broke-this-candle walls. fix612 BTC while carried: the blue V… | src/lib/desk/kalshi-live.server.ts:783 | async function judgeOrder601( | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/kalshi-live.server.ts:883 | sent.__oneDoor?.delete(ticker); /* fix602 | 1adc7b9c fix620: paper twin, the rejection book without pink entries (R318) |
|  |  | src/lib/desk/bandlock.ts:595 | ...tr603 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/engine.ts:2521 | lockCfg.on !== false | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | data/live-switch.json key lockWin.on | = false |  |
|  |  | src/lib/desk/engine.ts:2143 | sliderLine607(pinPct, tableArm) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/bandlock.ts:609 | 1M REJECTIONS ARE OUT (fix606) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/bandlock.ts:593 | rejFlip611(asset, side, tick | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/pivotbooks.ts:997 | carryWalls612(id, pinkFresh565(id, L0565)) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/kalshi-live.server.ts:1570 | await topUpFlat609( | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/engine.ts:5835 | tick-log.jsonl | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | data/live-switch.json key polyHour.on | = false |  |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R313 | fix615 the pink cushion size, at any hour, no 2-3 PM number. BTC: half the channel under $100, half capped at … | src/lib/desk/bandlock.ts:792 | (W < 100 ? W / 2 : W < 180 ? Math.min(W / 2, 60) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | src/lib/desk/recon.ts:449 | (W < 100 ? W / 2 : W < 180 ? Math.min(W / 2, 60) | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R314 | fix616 live-paper-book.json comes off disk only when its time or size changes; paperSeat and writeBook's look … | src/lib/desk/book.ts:60 | file616.m !== st.mtimeMs | b39f26b2 fix616: live-paper-book.json read only when it changes (R314) |
|  |  | src/lib/desk/kalshi-live.server.ts:1141 | trades = readBookShared().trades; | b39f26b2 fix616: live-paper-book.json read only when it changes (R314) |
| R315 | fix617 BTC: the last session's VWAP and bands are extra lines, named carried mid and carried +1/2/3 and -1/2/3… | src/lib/desk/bandlock.ts:855 | export function carryExtra617( | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
|  |  | src/lib/desk/recon.ts:85 | ...carryExtra617(id)] | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R316 | fix618 pinkClose618: unbroken pink inside the session-band tolerance directly under a short or over a long ref… | src/lib/desk/bandlock.ts:862 | export function pinkAhead618( | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
|  |  | src/lib/desk/bandlock.ts:2923 | const tight344 = false /* fix618 */ | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R317 | fix619 off a band or zone, a 2-5m candle that turned or was born her colour past $5 BTC / 10c gold is her entr… | src/lib/desk/recon.ts:290 | return turnFlip530(asset, c.side, spot); | 9716cd3f fix618: the same entry logic, session band ahead of the pink (R316) |
|  |  | src/lib/desk/bandlock.ts:1126 | !rejFlip611(asset, side, qR.c) /* fix619 */ | 9716cd3f fix618: the same entry logic, session band ahead of the pink (R316) |
|  |  | tools/band-flip-test-446.cjs | test |  |
|  |  | tools/behaviour-umpire.cjs | test |  |
| R318 | fix620 recon-rnp, paper only: the rejection book's own call when it is not a pink call; otherwise her read wit… | src/lib/desk/recon.ts:1049 | book("recon-rnp", np620) | 44463a49 fix624: the paper twin is main without pink entries (R321) |
|  |  | src/lib/desk/recon.ts:1044 | \|\| rejCandleNP620; | 44463a49 fix624: the paper twin is main without pink entries (R321) |
|  |  | tools/cornerstones.py | test |  |
| R319 | fix621 two tick readers that only look at live-paper-book.json, watchAccount at engine.ts and the paper-copy r… | src/lib/desk/engine.ts:4035 | live.watchAccount(readBookShared().trades) | 3be94693 fix621: two tick readers of the paper book share the parsed copy (R319) |
|  |  | src/lib/desk/engine.ts:4524 | const trades = readBookShared().trades; | 3be94693 fix621: two tick readers of the paper book share the parsed copy (R319) |
| R320 | fix623 the fix618 distance check (pinkClose618) is removed, and the candle reads no longer stop for a pink els… | src/lib/desk/recon.ts:701 | pinkBelow = false && ppC > sDn | 44463a49 fix624: the paper twin is main without pink entries (R321) |
|  |  | src/lib/desk/bandlock.ts:862 | export function pinkAhead618( | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
| R321 | fix624 paper twin recon-rnp is main without pink entries: main's read, or main's read with the pink line out, … | src/lib/desk/recon.ts:1041 | let np620: any = firstT && !pink620(firstT) ? firstT : null; | 44463a49 fix624: the paper twin is main without pink entries (R321) |
|  |  | src/lib/desk/recon.ts:550 | if (prior && lane === "recon-rnp") { | 44463a49 fix624: the paper twin is main without pink entries (R321) |
| R322 | fix625 the main-without-pink twin gets its own card, recon-rnp-fresh, counting only rows from 10:04:45 PM PT N… | src/lib/desk/fns.ts:1292 | r.book === "recon-rnp" && r.at >= RNPF_START | 6ccd2b0c fix625: a card for the pure no-pink model, fresh record (R322) |
|  |  | src/components/desk/app.tsx:3319 | book: "recon-rnp-fresh", title: | 6ccd2b0c fix625: a card for the pure no-pink model, fresh record (R322) |
| R323 | fix626 the schedule pill's delayed button now seats the pure no-pink model. An hour tapped to it, recon-rnp ro… | src/lib/desk/engine.ts:71 | function pureRows626( | db39f39a fix626: the delayed button is the pure no-pink model (R323) |
|  |  | src/components/desk/schedule-pill.tsx:59 | PURE NO PINK | db39f39a fix626: the delayed button is the pure no-pink model (R323) |
| R324 | fix628 the no-removal and no-switch-off gates accept a schedule setting whose value is exactly what her pill a… | tools/no-removal-gate.py:107 | def pill_ok628(new): | 1108c484 fix628: her pill taps never trip the umpire (R324) |
|  |  | tools/no-switch-off-gate.py:33 | G["pill_ok628"](new) | 1108c484 fix628: her pill taps never trip the umpire (R324) |

## Cornerstones

| Cornerstone | Lives at | Last touched by |
| --- | --- | --- |
| 1. HER FLIP: the 2/3/4/5m candle reader exists (fix406, Love Oct 28 2026 5:07 PM PT: cut the 1m) | src/lib/desk/bandlock.ts:1588 | c91077b5 full desk snapshot for new project |
| 1. HER FLIP: a 2/3/4/5m candle that TURNS her way - red to green for a long, green to red for a short, no minimum - at her rejecti… | src/lib/desk/bandlock.ts:744 | c91077b5 full desk snapshot for new project |
| 1. HER FLIP reaches main + rejection at the {nm} | tools/cornerstones.py |  |
| 2. HER THIRDS: no long top third / no short bottom third | tools/cornerstones.py |  |
| 4. THIRDS ONLY BLOCK: short blocked only in the bottom share, long only in the top share (33%; gold 20% on $10-25 channels, 15% ov… | tools/cornerstones.py |  |
| 3. full save before every fix (tools/save-her.py) | tools/cornerstones.py |  |
| 1. REAL FLIP: a candle that turned green -> red / red -> green, never one born that colour - main, rejection, copy, pure, paper (n… | tools/cornerstones.py |  |
| 2. HER CHANNEL = SESSION BAND TO SESSION BAND (σ lines + VWAP), never a zone, pink or other band | tools/cornerstones.py |  |
| 2. BTC 33% top/bottom at channels up to $500 - immutable (no 20%) | tools/cornerstones.py |  |
| 3. SESSION BAND AHEAD: past pink, an unbroken session band in front = wait for its break or rejection (main + rejection, at the or… | src/lib/desk/bandlock.ts:1616 | c91077b5 full desk snapshot for new project |
| 4. DOJI: green doji then red candle = SHORT only, red doji then green candle = LONG only (Love Oct 28 6:54 PM) | tools/cornerstones.py |  |
| 6. GOLD ZONES: no long inside the red zone, no short inside the green (fix377, main + rejection) | src/lib/desk/bandlock.ts:3073 | c91077b5 full desk snapshot for new project |
| 7. GOLD $1.50 BEFORE THE ZONE: no long within $1.50 under R1, no short within $1.50 over S1 (fix378, main + rejection) | src/lib/desk/bandlock.ts:3078 | c91077b5 full desk snapshot for new project |
| 8. GOLD PINK TOLERANCE 55%: pink-to-green no short bottom 55%, pink-to-red no long top 55% (fix409, main + rejection) | src/lib/desk/bandlock.ts:1108 | c91077b5 full desk snapshot for new project |
| 9. BLUE VWAP WALLS when bands are small (fix397/399, main + rejection orders) | src/lib/desk/bandlock.ts:170 | c91077b5 full desk snapshot for new project |
| 10. BTC PINK RE-AIM: an unfilled long refused by pink re-aims to the short (fix373, main + rejection) | src/lib/desk/recon.ts:572 | c91077b5 full desk snapshot for new project |
| 11. DOWNSLOPE UNDER PINK: no long while price slides under an unbroken pink until it breaks (fix371/403/423, gold + BTC, main + re… | src/lib/desk/bandlock.ts:785 | c91077b5 full desk snapshot for new project |
| 12. STALE CALL GUARD: a call over 90 s old never fires when a seat opens (fix375/425) | src/lib/desk/engine.ts:5424 | c91077b5 full desk snapshot for new project |
| 14. HER REACH WALL: no trade into an unbroken session band or the pink within $1 gold (fix443, Love 9:52 PM: make it $1 teporarily… | src/lib/desk/bandlock.ts:545 | c91077b5 full desk snapshot for new project |
| 15. PINK TOLERANCE: the pink's reach is at least 15% of the session-band channel width (fix430, main + rejection) | src/lib/desk/bandlock.ts:546 | c91077b5 full desk snapshot for new project |
| 16. NEVER LONG INTO AN UNBROKEN PINK: no long under the pink until it breaks up 25c gold / $5 BTC (fix432, $5 since fix561, main +… | src/lib/desk/bandlock.ts:651 | c91077b5 full desk snapshot for new project |
| 18. HER FLIP 2/3/4/5m (no 1m) in anyFlipNow + anyFlipMinNow (fix433) | src/lib/desk/bandlock.ts:1588 | c91077b5 full desk snapshot for new project |
| 19. MAIN ZONE READS TAKE HER 2-5m FLIP (fix394 back as fix433) | src/lib/desk/recon.ts:134 | c91077b5 full desk snapshot for new project |
| 20. ON HER SIDE OF THE BREAK + HER 33%, session band to session band (fix434, main + rejection) | src/lib/desk/bandlock.ts:760 | c91077b5 full desk snapshot for new project |
| 21. EVERY ORDER PASSES HER WALLS OR DOES NOT GO - checked at the wire, fails closed (fix435, main + rejection) | src/lib/desk/engine.ts:5428 | c91077b5 full desk snapshot for new project |
| 22. HER $10 LEVEL: no trading INTO an even $10 level when the target is within $1.50, only away; fix376 (held trades going away) o… | src/lib/desk/bandlock.ts:3066 | c91077b5 full desk snapshot for new project |
| 23. BROKE IT THIS CANDLE = HER SIDE NOW: no trade back against a band/pink broken this candle until price breaks back by her dista… | src/lib/desk/bandlock.ts:780 | c91077b5 full desk snapshot for new project |
| 24. THE THIRDS FLIP IS OFF for main + rejection - a refused call is never turned to the other side (fix442) | src/lib/desk/engine.ts:5429 | c91077b5 full desk snapshot for new project |
| 25. HER ENTRY: a 2-5m flip AWAY from a band at a band rejection (red->green long, green->red short) - main + rejection (fix446) | src/lib/desk/bandlock.ts:3090 | c91077b5 full desk snapshot for new project |
| 27. NO TIME-OF-DAY RULE ON REJECTIONS: the 3 PM hold is deleted outright - pink and every wall are valid rejections at every hour;… | src/lib/desk/engine.ts:5433 | c91077b5 full desk snapshot for new project |
| 13. BEHAVIOUR TESTS stay: behaviour umpire + gold/BTC slide replays | tools/cornerstones.py |  |
| 28. HER SKIP LOG: every refused read in main + rejection is written down with its rule, an empty read too (fix479, R230; fix511) | src/lib/desk/recon.ts:475 | c91077b5 full desk snapshot for new project |
| 29. HER PAPER BOOKS: pure no-pink + her own eyes + her own taps, sovereign twin, 2nd-band flip, OG rolling VWAP (fix480, R231) | src/lib/desk/recon.ts:27 | c91077b5 full desk snapshot for new project |
| 30. THE 5M RULES: hard 33%, pink both sides, slide holds (fix466) + top-rung mirror, Bollinger over pink, 55% zones (fix468), chec… | tools/cornerstones.py |  |
| 31. NO RULE SWITCHED OFF without Love's words - in the umpire (fix476, R227) | tools/cornerstones.py |  |
| 32. THE UMPIRE RE-CHECKS EVERY SETTING CHANGE + HER SCHEDULE PILL APPROVES ITSELF (fix477/fix478, R229) | src/lib/desk/umpire-gate.ts:48 | c91077b5 full desk snapshot for new project |
| 33. HER LIBRARIES FINGERPRINTED: a changed library = no trading (fix481) | tools/cornerstones.py |  |
| 34. THE ORDER LOG: paper ask, live ask, its age and what she paid on every live order (fix493) | src/lib/desk/engine.ts:5447 | c91077b5 full desk snapshot for new project |
| 35. HER HOURLY CACHE CLEAR: never-filled rows after 3.5 h + filled orders after a day leave the cache, every hour (fix343/fix370/f… | src/lib/desk/selfcheck.ts:136 | c91077b5 full desk snapshot for new project |
| 36. THE ENFORCER: no order leaves unless the umpire is SAFE (cornerstones + behaviour umpire + rule check + seals); bids at most t… | src/lib/desk/kalshi-live.server.ts:1235 | c91077b5 full desk snapshot for new project |
| 37. THE SUB-AUDITOR: every setup routed to him with its board before she takes it; no stamp, no order; the engine keeps him runnin… | src/lib/desk/engine.ts:2 | c91077b5 full desk snapshot for new project |
| 38. PINK IS NOT AN OBSTACLE BEYOND HER TOLERANCE at the door: 15% gold / 20% BTC of the band distance, either side (fix503) - but … | src/lib/desk/bandlock.ts:793 | c91077b5 full desk snapshot for new project |
| 39. SUB-1S SPEED: her side of every order under one second (mid-pass pickup, his 250 ms cap, measured on her fills) - umpire OUT i… | src/lib/desk/recon.ts:178 | c91077b5 full desk snapshot for new project |
| 40. ONLY HER RULES: a broken Bollinger is never traded, only rejections off it; inside the red no LONGS, inside the green no SHORT… | src/lib/desk/bandlock.ts:660 | c91077b5 full desk snapshot for new project |
| 41. PINK ONLY INSIDE HER TOLERANCE: 15% gold / 20% BTC band to band - beyond it no pink cushion, floor or add-on hold; the 5M too,… | tools/cornerstones.py |  |
| 42. HER ANSWERS: every rule she marked Out is gone and every note is in - the umpire goes OUT if any of them comes back (fix509) | src/lib/desk/bandlock.ts:626 | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
| 43. ONE THING: BOTH cushions, each by her word: the pink distance is her 15% gold / 20% BTC tolerance alone (7:13 AM); Bollinger g… | src/lib/desk/bandlock.ts:2980 | c91077b5 full desk snapshot for new project |
| 44. ONE WAY AT A SLOPED PINK: slid = shorts only, climbed = longs only, until her reset through the pink - 10% of the channel gold… | src/lib/desk/bandlock.ts:655 | c91077b5 full desk snapshot for new project |
| 45. ZONE REJECTIONS FREE OF A SPENT PINK: after her reset break (10% gold / 5% BTC of the channel) the green (long) / red (short) … | src/lib/desk/bandlock.ts:655 | c91077b5 full desk snapshot for new project |
| 46. NULL AND VOID AT THE CLOSE: no leftover order survives a closed position - all resting cancelled the moment the ticker leaves … | src/lib/desk/engine.ts:1984 | c91077b5 full desk snapshot for new project |
| 47. HER QUESTIONNAIRE: all 67 answers sealed verbatim in data/HER-ANSWERS-2.json and enforced as written - not to be interpreted a… | src/lib/desk/bandlock.ts:2981 | c91077b5 full desk snapshot for new project |
| 48. THE DIFFERENCE DEDUCTED, SCORED BY KALSHI ALONE: the Kalshi/chart gap measured at each window open and deducted from every str… | src/lib/desk/bandlock.ts:2120 | c91077b5 full desk snapshot for new project |
| 49. ONLY HER CHOSEN RULES: the 1.5x floor stands at the wire and in every live lane, the 1.28x road is gone, and no flip wall name… | src/lib/desk/bandlock.ts:2417 | c91077b5 full desk snapshot for new project |
| 50. UNDER THE PINK = NO LONGS: falling under the pink blocks longs at any distance (bottom-25% rejections and her reset excepted, … | src/lib/desk/bandlock.ts:668 | c91077b5 full desk snapshot for new project |
| 51. ALL DOORS CLOSED: one flag table everywhere; the full-flag test is the absolute last line before the send; the add-on path and… | src/lib/desk/bandlock.ts:707 | c91077b5 full desk snapshot for new project |
| 52. HER PIVOTS ROLL ON TIME: the forming candle stands in at the minute turn and her lines roll the instant the candle closes (fix… | src/lib/desk/pivotbooks.ts:532 | c91077b5 full desk snapshot for new project |
| 53. HER PINK TOLERANCE IN DOLLARS: BTC = max($75 weekday floor at any distance, 3/4 of the band-to-band width at $75-$180, the 20%… | src/lib/desk/bandlock.ts:2980 | c91077b5 full desk snapshot for new project |
| 54. BANDS ARE WALLS AGAIN AT $100: the BTC session carry hands back to the fresh bands at sigma $100, not $180 (fix527) | src/lib/desk/bandlock.ts:2326 | c91077b5 full desk snapshot for new project |
| 55. HER FLIP, THE AUDITOR BEHIND IT: a 2/3/4/5m colour turn at her rejection is an immediate entry on the next tick - no re-test a… | src/lib/desk/bandlock.ts:744 | c91077b5 full desk snapshot for new project |
| 56. NO INDEX: the Oct 18 index-gap strike translation and the index sampler are gone - her fix519 window-open deduction (her chart… | src/lib/desk/bandlock.ts:2120 | c91077b5 full desk snapshot for new project |
| 57. ONE FEED: the Oct 3 Vantage confirm study and the SOLE-V Vantage lane are retired - kept on file, never called; Pepperstone al… | src/lib/desk/bandlock.ts:2865 | c91077b5 full desk snapshot for new project |
| 58. HER LOOP RUNS LIGHT: the card file parses only when it changed on disk and the night book writes compact - zero behavior chang… | src/lib/desk/nightbook.ts:173 | c91077b5 full desk snapshot for new project |
| 59. THE CARD FILES CLEAR HOURLY: settled card rows older than a day leave grok-og and the night book into their archives every hou… | src/lib/desk/selfcheck.ts:160 | c91077b5 full desk snapshot for new project |
| 60. LET HER RUN: the fill auditor records every refused fill in full and never switches entries off - her 1 dollar study mode unti… | src/lib/desk/engine.ts:5486 | c91077b5 full desk snapshot for new project |
| 61. HER LIVE TICK AT THE DOOR: every wall and break distance is measured on the live wire the second it prints - the chart scan is… | src/lib/desk/bandlock.ts:2864 | c91077b5 full desk snapshot for new project |
| 62. HER BREAK IS $5: BTC pink breaks at $5 past, every site; gold 25c untouched (fix541) - the slide / climb hold frees on her 10%… | src/lib/desk/bandlock.ts:660 | c91077b5 full desk snapshot for new project |
| 63. PINK $25 FOR NOW: the BTC pink tolerance is capped at a flat $25 at every site - temporary, hers to lift (fix542) | src/lib/desk/bandlock.ts:627 | c91077b5 full desk snapshot for new project |
| 64. BOTH ENTRIES LIVE: the turn (a 2-5m candle crosses its open her way after trading the other colour) AND born-her-colour (new 2… | src/lib/desk/bandlock.ts:1657 | c91077b5 full desk snapshot for new project |
| 65. NO 3 PM CUTOFF, NO INDEFINITE HOLD: the width-released hour rule is deleted outright by her word - the 100 dollar BTC / 5 doll… | src/lib/desk/engine.ts:5433 | c91077b5 full desk snapshot for new project |
| 66. ONE FEED, EVERYWHERE: her price stream subscribes Pepperstone + TVC only (no INDEX, no OANDA); no wall in any book, the 5M inc… | src/lib/desk/nav.ts:103 | c91077b5 full desk snapshot for new project |
| 67. HER RULES ONLY, ENFORCED: SAFE fails on ANY missing rule or request (no report-only); every book's opening order needs SAFE; a… | src/lib/desk/bandlock.ts:718 | c91077b5 full desk snapshot for new project |
| 68. BTC ZONES = HER 55% ONLY: no dollar tolerance around the BTC green/red zones (main, rejection, the 5M); never inside them stay… | src/lib/desk/bandlock.ts:2844 | c91077b5 full desk snapshot for new project |
| 69. SHORTS ONLY ON A PINK DOWNSLOPE TIL HER 10%: longs held under a sliding pink (shorts over a climbing one) until price breaks p… | src/lib/desk/engine.ts:4971 | c91077b5 full desk snapshot for new project |
| 70. HER $5 BREAK AT THE PINK WALLS TOO: no long under / no short over an unbroken pink only until BTC breaks it by $5 (was $8) - m… | src/lib/desk/bandlock.ts:654 | c91077b5 full desk snapshot for new project |
| 73. PRO SIGN IN: her TradingView Pro token is minted by quote_token, fetched through her Mac curl with her full cookie, matched by… | tools/cornerstones.py |  |
| 74. ONE PINK: her chart's CM Pivot Bands 5m pink, forming candle + live price included, is the ONLY pink - every read, wall, cushi… | src/lib/desk/bandlock.ts:2024 | c91077b5 full desk snapshot for new project |
| 75. SAME SIDE AT THE SEND (fix595, her Nov 1 10:37 AM words): a long must be above, a short below, any session band or pink broken… | src/lib/desk/bandlock.ts:587 | adf6f84b fix595: same side of the break at the last line (R309) |
| 76. HER PINK CUSHION (fix615, her Nov 1 4:27, 4:32 + 5:20 PM words, replacing fix596): BTC half the channel under $100, half cappe… | src/lib/desk/bandlock.ts:625 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 77. REJECTIONS ONLY (fix597, her Nov 1 11:20 + 11:31 AM words): rejection is a rejection-only book at all hours and keeps the cand… | src/lib/desk/bandlock.ts:605 | 45769e2c fix596-599: BTC pink window, rejections only, lotto out, fake-out 3, waiver out (… |
| 78. THE POLYMARKET LOTTO BOOK IS OUT (fix598, her Nov 1 11:20 AM words) | tools/cornerstones.py |  |
| 79. THE FAKE-OUT (fix598 + fix599, her Nov 1 9:03 + 11:20 AM words): a wick at most 25% into the channel, reversed at least 3 time… | tools/cornerstones.py |  |
| 80. HER $5 ADD-ON AT 2.8x (fix600, her Nov 1 12:27 PM words): as soon as price reaches 2.8x, no band touch; must pass the umpire S… | src/lib/desk/bandlock.ts:614 | 45769e2c fix596-599: BTC pink window, rejections only, lotto out, fake-out 3, waiver out (… |
| 81. THE EXACT ORDER (fix601, her words): every opening order is judged at the last line, nothing between the test and the POST: th… | src/lib/desk/kalshi-live.server.ts:777 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 82. A REFUSED ORDER NEVER CLOSES HER WINDOW (fix602, her words): the door reopens when the last line refuses; only an executed tra… | src/lib/desk/kalshi-live.server.ts:883 | 1adc7b9c fix620: paper twin, the rejection book without pink entries (R318) |
| 83. SAME SIDE SEES THE TICKS (fix603, her words): a break only the last few ticks saw counts at the last line | src/lib/desk/bandlock.ts:594 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 84. HER OFF SWITCHES WORK (fix604 + fix605): entries off writes its reason; the profit lock obeys its switch and cannot sell a pos… | src/lib/desk/kalshi-live.server.ts:811 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 85. 1M REJECTIONS ARE OUT (fix606, her Nov 1 1:24 PM words): the read is gone and main and rejection refuse the label at the copie… | src/lib/desk/bandlock.ts:609 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 86. HER SLIDER AND HER TAKE PROFITS, BOTH (fix607, her Nov 1 1:40 PM words): the structure stays on every trade once a slider is s… | src/lib/desk/bandlock.ts:615 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 87. A REJECTION WITH ITS FLIP GOES (fix611, her Nov 1 2:31 PM words): a band broken earlier in the 5m candle no longer stops a rej… | src/lib/desk/bandlock.ts:593 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 88. THE BLUE VWAP IS THE ONLY WALL UNTIL $100 (fix612, her Nov 1 2:31 PM words): BTC while carried, the other session lines step o… | src/lib/desk/bandlock.ts:563 | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
| 89. FLAT $5 (fix609, her Nov 1 1:56 + 2:17 PM words): main and rejection top up through the last line and the wire, never over $5;… | src/lib/desk/kalshi-live.server.ts:1570 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 90. THE OTHER 1M READS ARE OUT (fix610, her Nov 1 2:17 PM words): the candle read and the fake-out turn no longer wait for a finis… | src/lib/desk/bandlock.ts:2830 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 91. THE TICK LOG (fix613, her Nov 1 2:31 PM words): the ticks her feed took are written, read-only, every 5 s | src/lib/desk/engine.ts:5835 | dc42dcc8 fix601-613: exact order, refused orders reopen, 1m out, slider and take profits, … |
| 92. THE BOOK IS READ ONLY WHEN IT CHANGES (fix616, her Nov 1 4:27 PM words): live-paper-book.json comes off disk only when its tim… | src/lib/desk/book.ts:55 | b39f26b2 fix616: live-paper-book.json read only when it changes (R314) |
| 93. CARRY BANDS ALSO (fix617, her Nov 1 4:57 PM words): BTC, the last session's bands are extra lines to trade rejections and brea… | src/lib/desk/bandlock.ts:611 | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
| 94. SESSION BAND AHEAD OF THE PINK (fix618, her Nov 1 6:10 PM words): pink inside her session-band scale of an unbroken session ba… | src/lib/desk/bandlock.ts:563 | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
| 95. THE SAME ENTRY LOGIC (fix618, her Nov 1 6:10 PM words): gold and BTC take the same setups on the same flips; gold keeps her $1… | src/lib/desk/bandlock.ts:563 | 7b7f2ff8 fix617: carry bands also, until the new bands reach 180 dollars (R315) |
| 96. A TURN OR BORN HER COLOUR, ANY 2-5M CANDLE (fix619, her Nov 1 7:35 PM words): off a band or zone the read and the door take an… | src/lib/desk/bandlock.ts:1126 | 9716cd3f fix618: the same entry logic, session band ahead of the pink (R316) |
| 97. THE REJECTION BOOK WITHOUT THE PINK, PAPER ONLY (fix620, her Nov 1 7:50 PM words): the same logic on every other band and zone… | src/lib/desk/grokog.ts:360 | 1adc7b9c fix620: paper twin, the rejection book without pink entries (R318) |
| 98. HER TICK READS THE SHARED BOOK (fix621, her Nov 1 8:32 PM words): the two tick readers that only look at live-paper-book.json … | src/lib/desk/engine.ts:6 | 3be94693 fix621: two tick readers of the paper book share the parsed copy (R319) |
| 99. THE TWIN IS MAIN WITHOUT PINK ENTRIES (fix624, her Nov 1 9:37 PM words): main's read, door, free-to-trade and one-call-per-win… | src/lib/desk/recon.ts:418 | 44463a49 fix624: the paper twin is main without pink entries (R321) |
| 100. HER PURE NO-PINK CARD (fix625, her Nov 1 10:08 PM words): the main-without-pink twin on its own card with a fresh record from… | src/lib/desk/fns.ts:1287 | 6ccd2b0c fix625: a card for the pure no-pink model, fresh record (R322) |
| 101. THE DELAYED BUTTON IS THE PURE NO-PINK MODEL (fix626, her Nov 1 10:18 PM words): an hour she taps, the twin's rows reach the … | src/lib/desk/engine.ts:70 | db39f39a fix626: the delayed button is the pure no-pink model (R323) |
| 102. HER PILL TAPS NEVER TRIP THE UMPIRE (fix628, her Nov 1 10:44 PM words): hours her pill approved are hers; any other change is… | tools/cornerstones.py |  |
