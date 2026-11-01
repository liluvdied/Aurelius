# Audit: PURE NO-PINK (recon-np live seat, recon-npo own-eyes paper)

Read-only audit of the clone at `/tmp/claude-0/repo`, HEAD `f47cd6d` (fix409-414). I did not trust code comments. Every claim below comes from code paths I read or from log rows I found. All times are PT (UTC-7). Live = Kalshi.

## 0. Current state of the books
- `data/live-switch.json` has `npLive.on = true`, `hours = [21]` and `hoursByAsset = {btc: [], gold: []}`. engine.ts:4996 reads `hoursByAsset[asset]` whenever it is an array, empty included, so **recon-np has no live hour right now**. fix398 took her off live at 3:30 PM Oct 28 and fix400 did the same at 3:47 PM. Both followed Love's 3:19 PM words: "she longed btc on a falling red candle hun this model is not working". She still counts as a "live book" in kalshi-live (`npLiveOn()`, kalshi-live.server.ts:304/311/1208). If anyone fills an hour, she trades live again with the holes listed below.
- recon-np and recon-npo keep booking paper. Since fix401 (4:00 PM) the two paper books are row-for-row identical in `data/grok-og.json`: 16 rows from 4:05 to 6:15 PM.

## 1. Walls Love set for these books, and whether code enforces them

Paths that judge her:
- (a) **recon.ts gate** in `book()`, recon.ts:435-451 (fix401). It runs for np and npo.
- (b) **Kalshi door** `bandLockCheck`, bandlock.ts:705-739 (RECON branch). It runs for np only.
- (c) **paper sweep** `paperBandFilter`, bandlock.ts:1116. It runs for both.
- (d) **wire** `wireWall`, bandlock.ts:2246-2290.

| # | Love's rule (fix / request) | recon-np live | recon-npo paper | Verdict |
|---|---|---|---|---|
| 1 | HER FLIP, Cornerstone #1: a 2/3/4/5m candle her colour, at least $5 BTC / 10c gold past its open (fix325, fix406, fix407; R096; fix401 R090 "the 2,3,4&5M candle flips pls") | Door: flipRule=true (bandlock.ts:712, last two args) leads to bandlock.ts:2783-2784. | Gate: anyFlip2Now plus impossibleGeo(flipRule=true), recon.ts:439-441. Sweep: flipRule=false for npo, but the gate already applied it. | ENFORCED, **with an exemption**: `!foTurn` at bandlock.ts:2783/2784 skips HER FLIP when `fakeOutTurnNow` fires. That function is driven by the last **finished 1m candle** (bandlock.ts:2353-2355). It is a 1m waiver of Cornerstone #1 after fix406 "cut the 1M's". |
| 2 | THIRDS / IMPOSSIBILITY 33% (Cornerstone #2, fix379, fix414 "just keep it at 33%") | `IMPOSSIBLE` bandlock.ts:2435: flipRule and BTC under $500 gives 0.33. Gold uses lockPctFor, which can drop to 0.20 on a one-sigma channel (fix219). | Same through the gate. | INTACT for BTC. Gold follows main's lockPctFor. The copy's gold 33% (fix351) was copy-only, so no loss there. |
| 3 | ONLY IN HER THIRD + thirdsMove + reconThirdAgainst + thirdWallAbsolute | Door bandlock.ts:728/735/737, wire :2280-2283. | thirdsMove is **not** in the gate and **not** in the sweep. | np INTACT. **npo is missing the thirdsMove candle wall.** |
| 4 | Same side of the break: band breaks up means trade up (Oct 19, candleDirOnly) | Door bandlock.ts:731 | Sweep only | Present, **but waived on a 1m close**: `candleDirOnly` returns "" when `oneMinReject` is true (bandlock.ts:313). This is the same "1m close off a rejected band" waiver that the Rulebook says took the flip off main on Oct 21. More waivers at :319/:323/:326. |
| 5 | HELD ON HER SIDE 3 s (fix411, Love 5:56 PM: "she needs to be ON the side of the break ... this is veryyyy old news" + 5:59 PM "pls reinforce everything") | **NOT APPLIED.** bandlock.ts:717 is limited to `recon-tog / recon-rej / recon-togp`. | Not in the gate. | **MISSING** for np and npo. |
| 6 | SESSION BAND AHEAD OF THE PINK = WAIT (fix413, Love 6:06 PM: "IT IS A STRICT BAND TOLERANCE. PRICE BREAKING PINK DOES NOT REMOVE THAT.") | **NOT APPLIED.** bandlock.ts:727 is limited to tog/rej/togp. The card option was "Rejection, main + copy". | Not applied | **MISSING** measured against fix390, where Love asked for main's walls ("same cushions and band tolerances and everything"). The card did not name pure. |
| 7 | Pink cushion | Main's PINK 10% applies (npPink=false; BTC $25 when the channel is $100 or less, otherwise the larger of $50 and 10%). | Same | INTACT, and stricter than her old fix367. |
| 8 | fix367 PINK CUSHION (pure only, R053), fix368/369 ANY BAND CUSHION (R054/R055), fix363 pink only when stacked (R048) | **Dead code.** These run only when `npPink` is true (bandlock.ts:2398, :2526, :2529), and every caller passes false: :712, :721, :1116 (default), :2277, recon.ts:441. | Dead | **MISSING-OR-SUPERSEDED.** fix390 turned them off. R053/R054/R055 are still active in the request book, and their proofs (`"ANY BAND CUSHION (pure no-pink)"`, `"PINK CUSHION (pure no-pink)"`) pass because the strings exist even though they can never run. Main has no "any unbroken band within $10/$25" wall. The complaint behind it was Love's "she keeps longing into unbroken bands". |
| 9 | BTC PINK TO GREEN / RED 50% (fix392, R080) | Door, sweep and recon gate use 0.5. The wire uses 0.5 only when no tog/rej order is on the wire. | 0.5 in the gate; the sweep gives npo 0. | INTACT (gate) |
| 10 | Gold pink-to-green/red 55% (fix409) and zone walls (BREAK INTO A ZONE, INSIDE RED/GREEN ZONE, reconZoneGate, fix376-378) | Through flipRule, bandlock.ts:2575/2582/2629-2638, and door :733 | Through the gate | INTACT. pure-walls.jsonl after 4 PM shows these firing for np/npo (125 PINK TO GREEN, 107 BREAK INTO A ZONE, 81 PINK TO RED, 19 INSIDE THE RED ZONE). |
| 11 | Blue VWAP wall (fix397) and ACROSS THE BLUE VWAP (fix399) | Wire for every book, bandlock.ts:2259-2271 | Half-width check in the gate (recon.ts:443-444). The across-target check is missing. | np INTACT. npo partial. |
| 12 | Gold slide under pink: no long until the pink breaks (fix371/fix403, R093) | **Not applied.** engine.ts:4969 lists only `recon-rej, recon-tog, recon-togp`. | n/a | UNSURE. Love named main/rej/copy before fix390, then gave fix390 "same ... everything". |
| 13 | Band-law self-test failing means "no orders until it passes" (Oct 16, "EVERY ... BOOK WE OWN ... no exemptions") | **Exempt.** The RECON branch returns at bandlock.ts:738 before the `__bandLawBroken` check at :741. wireWall never checks it either. Same in KNOWN-GOOD (line 721), so this dates from the Oct 19 RECON design. | Exempt | **EXEMPTION, and it was used live** (see §2). |
| 14 | Pure calls only band taps and rejections, never pink/pivot/nav/thirds/break (fix361, R046) | Main-wording path recon.ts:672 regex: OK. Own eyes recon.ts:692 excludes Break and "third" (fix391). Own taps recon.ts:704-719: OK. | Same | Code INTACT now. **R046 was retired at 1:12 PM on fix390's words**, which were about cushions, not calls. No active request now protects the main-wording filter at recon.ts:672. |

### Changes with no Love words, or with words that do not cover them
- **fix390 retired R046** (data/LOVE-REQUESTS.jsonl, retire entry dated 2026-10-28T20:12:17Z) with the words "no just make her have the same cushions and band tolerances...". Those words do not touch what calls she takes. Cornerstone #1 says a request leaves only on Love's words naming it.
- **fix390 silently disabled R048, R053, R054 and R055** by passing `npPink=false`. None of them was retired, and the umpire still passes them by string presence.
- **The `!foTurn` exemption on HER FLIP** (bandlock.ts:2783-2784) has no Love words that name an exception to Cornerstone #1. fix325 says "none = no entry".
- **The recon.ts gate fails open on a stale band list**: when `__lawBands` is older than 15 s it applies only `anyFlip2Now` (recon.ts:440). The paper sweep and the door catch it later ("can't verify"), so the practical risk is low.

## 2. Behaviour: live fills and refusals

recon-np filled 18 times live, according to `data/live-book-done.json` cross-checked by orderId against live-fires.json. Settlement comes from window-results.json. Entry legs only: **7 wins, 11 losses, -$30.57** (add-ons excluded).

| PT | side | setup | channel pos at wire (wire-pass.jsonl) | result |
|---|---|---|---|---|
| Oct 27 9:00 PM | short | Rejected down off fresh +2σ | 0.78 | W |
| 9:25 / 9:28 / 9:35 PM | long x3 | Rejected up off Green zone (BTC, gold, gold) | 0.17 / 0.46 / 0.40 | L L L (these triggered fix368) |
| 9:47 PM | short | Rejected down off fresh +1σ (ANY BAND CUSHION refused it 752 times first) | 0.46 | W |
| Oct 28 10:37 AM | short | Failed break above Red zone | 0.95 | L |
| 11:31 AM | short | Failed break above VWAP | 0.94 | L |
| 11:45 AM | short | Rejected down off +1σ | 0.90 | W |
| 12:30 PM | short | Rejected down off +1σ | 0.92 | L (-$9.40) |
| 1:07 PM | short | 1m rejection off Red zone | 0.94 | W |
| **1:15 PM** | **long** | **Candle rising from the bottom third** | 0.30 | **L (-$9.17 entry; diary: -$20.85 with add-on)** |
| 1:50 PM | short | Tap-reject at +0.5σ | 0.45 | L |
| 2:05 PM | short | Failed break above Red zone | 0.48 | L |
| 2:17 PM | short | 1m rejection off Red zone | 0.51 | W |
| 2:36 PM | short | Rejected down off +1σ | 0.84 | L |
| 2:45 PM | long | Tap-reject at fresh -1σ | 0.53 | W |
| 3:00 PM | short | Rejected down off fresh +1σ | **0.332 against lock 0.33** | W |
| **3:16 PM** | **long** | **Tap-reject at +1σ** | 0.19 | **L (-$8.33)** |

Live fills that broke a rule Love had already set, and the code path that let each one through:

1. **1:15 PM BTC long "Candle rising from the bottom third"**
   - Love's R046 (Oct 27, 8:06 PM) says pure never takes thirds calls. fix389b (1:05 PM, recon.ts:700) pointed live recon-np at the own-eyes read, and that read had no thirds filter. R046 was then retired at 1:12 PM on unrelated words. Three minutes later she took a thirds long.
   - The hole was patched only by fix391, installed 2:00 PM, after Love objected.

2. **3:16 PM BTC long "Tap-reject at +1σ"**, the one Love called "longed btc on a falling red candle".
   - **It went out while the band-law self-test was failing.** band-lock.jsonl shows "band law failed its self-test" for other books from 3:08 to 4:08 PM PT, and at 22:16:24Z, three seconds after this fill. The RECON door skips that check (bandlock.ts:738 vs :741).
   - The door had refused this long for 12 s: at 22:16:08 "falling from the top third ... that's a short" (thirdsMove); at 22:16:10-13 "this 5m candle broke DOWN through 5m PP (81208.20)" (candleDirOnly); then HER FLIP until 22:16:20.238 at tick 81168.55.
   - It passed on a **single tick**: at 22:16:20.651 the wire tick was 81176.13 (+$7.6 in 0.4 s) while live-fires shows spot 81168.31. At that moment price was still under the pink it had broken down through. So the break-direction wall must have been waived, by oneMinReject (1m close), thirdsMove, zoneFlip or nextBandReject (bandlock.ts:313-326).
   - fix411 now closes exactly this one-tick hole for main/rej/copy, **but not for recon-np** (bandlock.ts:717).

3. **2:17 PM short (a win): the wire gave two verdicts on the same tick.**
   - At 21:17:55.189 the WIRE refused it with "HER CANDLE: the 5m candle is rising". That message can only appear with flipRule=false, which means the wire did not recognise a recon-np order.
   - At 21:17:55.443 it passed at the same tick 81313.76.
   - The wire picks pure's flags by looking up `ticker:recon-np:` in live-book-done.json (bandlock.ts:2224-2229, 2277). A missing or stale record changes which walls apply. npo's paper sweep refused the same short with HER CANDLE, so paper npo and live np disagree.

4. **12:30 PM short (-$9.40)**: UNSURE. The door and the wire refused with PINK 10% at 81104.91 ($43 over pink, inside $50), and 150 ms later the wire passed at the same tick 81104.91. The pink line probably refreshed at the candle turn; I cannot prove it from the logs.

5. **The rest pass under the walls in force at the time.** 2:45 PM was a real pink break: ticks 81202-81217 held for 10 s. 3:00 PM sat exactly at the 33% line, a one-tick margin.

Paper (npo) evidence after fix411/413 went in: at 6:15:26 PM, np and npo booked an identical long "Failed break below session VWAP - rejected up". The sweep refused **npo** with "HER CANDLE: the 5m candle is falling" (01:15:27.103Z), because npo has flipRule=false in the sweep. **np** was not refused, because flipRule erases HER CANDLE (bandlock.ts:2783 sets `cdl=""`). Same call, different verdicts, so the npo paper record is not a faithful record of what np would do.

Evidence caveat: `band-lock.jsonl` rows without a `paper` key are written by both bandlock.ts and the Poly-5M bandlock5m.ts, with no field telling them apart. For fills I relied on wire-pass.jsonl, live-book-done.json and live-fires.json.

## 3. Verdict

### INTACT
- HER FLIP 2/3/4/5m with $5/10c for np: door bandlock.ts:712 to :2783-2784; npo through recon.ts:439-441. Exception: the foTurn waiver, listed below.
- BTC THE IMPOSSIBILITY / ONLY IN HER THIRD at 33% under $500 (bandlock.ts:2435, :2757-2758). fix414 has no 20% leftover for pure.
- Main's PINK 10% cushion, Bollinger cushion and BACK UNDER/OVER $10 (bandlock.ts:2531-2560, :2789-2793).
- PINK TO GREEN/RED 50% BTC (fix392) and gold 55% (fix409); zone walls; reconZoneGate (door :733).
- Blue VWAP wall and across-VWAP wall at the wire (bandlock.ts:2259-2271).
- Pure call filters: main wording recon.ts:672, own eyes with no thirds recon.ts:692, own taps near-half recon.ts:704-719.
- The door fails closed on exceptions (kalshi-live.server.ts:1255-1260).

### MISSING-OR-WEAKENED (with proposed restoring fixes)
1. **fix411 HELD 3 s is missing for recon-np and npo.** Fix: bandlock.ts:717 change the test to `book === "recon-tog" || book === "recon-rej" || book === "recon-togp" || book === "recon-np"`. In recon.ts after line 441, apply the same worst-of-last-3-s re-check (`trailNow`) to the np/npo/sov/b2/og gate.
2. **fix413 SESSION BAND AHEAD is missing for recon-np and npo.** Fix: bandlock.ts:727 add `|| book === "recon-np"`; recon.ts:441 add `|| sessionAheadWait(id, L401, spot, sd401)`. Needs Love's yes, because her card named rejection, main and copy.
3. **fix367/368/369/363 are dead, and R048/R053/R054/R055 are still "active" on string presence only.** Either Love retires them in her own words, or the any-band cushion is restored: bandlock.ts:2398 `if (npPink)` becomes a separate `anyBand` parameter passed true for recon-np at :712, :721, :1116, :2277 and recon.ts:441. tools/requests.py proofs should test that a call site passes the flag, not only that the string exists.
4. **R046 was retired on words that do not name it.** Re-add the "taps/rejections only, never pink/pivot/nav/thirds/break" request with proof `/^(Rejected (up|down) off|Failed break (above|below)|Tap-reject at) /i` at recon.ts:672 and `!/third/i.test(lb9)` at recon.ts:692.
5. **HER FLIP is waived by a 1m fake-out turn** (`!foTurn`, bandlock.ts:2783-2784). This contradicts fix406 and Cornerstone #1 "None = no entry". Fix: drop `!foTurn &&` from both lines, as fix366 already did for the copy. This needs Love's words, because it also changes main and rejection.
6. **The break-direction wall is waived by a 1m close**: `oneMinReject` at bandlock.ts:313, inside candleDirOnly, which the recon door uses at :731. This is the same mechanism the Rulebook names as how Cornerstone #1 slipped on Oct 21. Fix: remove line 313, or limit it to 2-5m closes, after Love confirms.
7. **The band-law self-test does not stop pure.** It traded at 3:16 PM during a failure. Fix: insert `if (G.__bandLawBroken) return deny("band law failed its self-test - no orders until it passes");` as the first line inside `if (RECON.has(book)) {` at bandlock.ts:705, and add the same check in wireWall after line 2251.
8. **npo paper is judged by different walls than np.** The sweep and the door call impossibleGeo with no flags for "recon-npo", and the npo gate lacks thirdsMove, fix411 and fix413. Fix: add `|| lane === "recon-npo"` wherever `recon-np` appears in the flag expressions at bandlock.ts:712, :721, :1116. Treat npo exactly like np in the sweep.
9. **The wire's pure flags depend on a live-book-done lookup**, `bookOrderAtWire(t, side, "recon-np")` at bandlock.ts:2277. Same-tick verdict flips were seen (2:17 PM). Fix: pass the owning book into wireWall from kalshi-live (the `bookCopy` is known there) instead of guessing from the done file.

### UNSURE
- Gold slide-under-pink hold (fix371/403) is not on recon-np (engine.ts:4969). Love named main/rej/copy, then said fix390 "same ... everything".
- The 12:30 PM PINK 10% refusal turned into a pass at the same tick: likely a pink refresh at the candle turn, not proven.
- thirdsMove probably resolved "up" at 3:16 PM because the 5m candle was both "falling from top" and "rising from bottom". I did not reproduce it.
- tools/cornerstones.py checks string presence only and has no recon-np check. It cannot catch any of the above.
