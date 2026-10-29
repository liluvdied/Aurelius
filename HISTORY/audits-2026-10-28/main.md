# AUDIT: MAIN = lane `recon-tog` (flipRule book). Read-only, against the clone at f47cd6d (after fix414)

Checkpoint ("perfect", Oct 27 7:56 PM PT) = git `c4b88fd`. Its bandlock.ts has the same md5 as `data/SAVES/KNOWN-GOOD-...-after-fix360/src/lib/desk/bandlock.ts`, and as commits 64b9fc7 through e088cf5.
All line numbers below are for the current `src/lib/desk/bandlock.ts` unless I name another file.
"Today" means Oct 28 2026 PT (07:00Z Oct 28 to 07:00Z Oct 29). The logs end around 01:17Z Oct 29 (6:17 PM PT).

## 0. How main reaches Kalshi (so the walls below are the ones that count)
- Door: `kalshi-live.server.ts:1256` calls `bandLockCheck(bookCopy, ...)` on every opening order. For RECON books this runs (bandlock.ts:706-734):
  `impossibleGeo` → fix411 HELD 3s → fix413 SESSION AHEAD → thirdsMove → channelOnly → candleDirOnly → reconZoneGate → reconThirdAgainst → thirdWallAbsolute.
- Wire: `kalshi-live.server.ts:94` calls `wireWall` (bandlock.ts:2246). This runs the seal, fix397 blue VWAP wall, fix399 across-VWAP, `impossibleGeo` (flipRule=true for a tog order), thirdsMove and thirdWallAbsolute.
- Seat (live-switch.json): BTC rejHoursByAsset = all 24 h, so main never trades BTC live now (since fix398/412). Gold: main holds the hours not in rejHoursByAsset.gold, minus liveSkipHours gold [4, 9, 20]. That leaves 5, 6, 8, 10, 11, 12, 13, 15 and 19 PT.
- Today main had 19 Kalshi fills (live-book-done.json). Four were BTC, 9:00-9:47 AM PT. Fifteen were gold, 10:01 AM-3:54 PM PT. Settlement against window-results.json: **7 won, 12 lost**.

## 1. Every entry-relevant change from the checkpoint (c4b88fd) to now, for recon-tog

| # | Wall / condition | Change | Fix | Love's words (diary/request) | Verdict |
|---|---|---|---|---|---|
| 1 | HER FLIP (Cornerstone #1), bandlock.ts:1176 + 1207 | 1m dropped: anyFlipNow and anyFlipMinNow now loop over [2,3,4,5] | fix406 / R096 | 5:07 PM "let's go ahead and cut the 1M's" + card "Main + rejection + copy" | Authorized |
| 2 | HER FLIP minimum, :2784 | NEW: the 2-5m candle must be $5 (BTC) / 10c (gold) past its open | fix407 / R097 | 5:12 PM "yess pls bb" | Authorized (stricter) |
| 3 | THE IMPOSSIBILITY, BTC, :2435 | 33% for any channel ≤$500 (was fix219 20% for one-sigma channels). fix399's 20% came in at 3:00 PM and fix414 took it out at 6:15 PM | fix379 / R066, fix399 / R087, fix414 / R104 | 1:06 AM "yes pls all of them for sure"; 6:10 PM "HARD no on 20% at this band width" | Authorized. **But R087 (20%) was never retired, so the request book contradicts R104 and the umpire still passes R087's proof** |
| 4 | THE IMPOSSIBILITY, GOLD, :2435 → lockPctFor :176-184 | **Not changed.** Main gold still gets fix219's 20% when the channel is no wider than one fresh sigma (:180). The copy was moved to 33% under $10 (fix351); main was not | fix219 (Oct 25) | Conflicts with fix414 "HARD no on 20%" and with R005 "gold 33% under $10" | **WEAKENED vs Love's latest words: see §3 evidence** |
| 5 | Gold PINK TO RED, :2575 | Top 55% blocked (was top 50%) | fix409 / R099 | 5:39 PM "55% for shorts and longs pls" | Authorized (stricter) |
| 6 | Gold PINK TO GREEN, :2582 | Bottom 55% (checkpoint 50% → fix364 60% → fix409 55%) | fix364 / 365 / 409 | 8:38 PM "raise it to 60%"; 5:37 PM "55%" | Authorized. Bug: the denial text still prints "60%" (`flipRule \|\| togpLoose ? 60 : 50` at :2582) |
| 7 | CLEAR OF THE $10 LEVEL, :2626-2630 | NEW for gold | fix376 / R062 | 12:23 AM to "waits until price is at least $1.50 clear of the level" | **Built with a 0-30c hole** (`Math.abs(d376) >= 0.3`). Love never said "30c"; only Claude's "what" text did. Live fills went through it (§3) |
| 8 | INSIDE RED/GREEN ZONE, :2632-2634 | NEW, gold | fix377 / R064 | "yes pls bb" | Authorized, fires (34 denials today) |
| 9 | $1.50 BEFORE THE ZONE, :2637-2639 | NEW, gold | fix378 / R065 | "keep the $1.50 tolerance" | Authorized |
| 10 | HELD 3s, door :714-722 | NEW. impossibleGeo re-run at the worst price of the last 3 s. Door only. Re-checks only impossibleGeo, not channelOnly / candleDirOnly / thirds walls / wire walls | fix411 / R101 | 5:56 PM "she needs to be ON the side of the break" + 5:59 "pls reinforce everything" | Authorized but **partial**: "reinforce everything" is not met |
| 11 | SESSION BAND AHEAD OF THE PINK, door :727 → sessionAheadWait :1720 | NEW (back from Oct 17) | fix413 / R103 | 6:06 PM "STRICT BAND TOLERANCE. PRICE BREAKING PINK DOES NOT REMOVE THAT" | Authorized but **narrow**: it fires only when the single nearest line is exactly `5m PP`, and its band regex (:1724) leaves out `fresh VWAP` |
| 12 | Blue VWAP wall + across-VWAP, wire :2259-2271 | NEW, all Kalshi books | fix397 / 397b / 399 | 2:46 PM "keep the blue vwap a wall on all books when bands are small"; 3:24 PM | Authorized |
| 13 | recon.ts:610 (main lookT zone reads) | Zone rejections pass on any 2-5m flip, not only the 5m candle | fix394 / R082 | card "Pure no-pink + main" | Authorized |
| 14 | recon.ts:500 | A BTC pink-rejection re-aim sticks | fix373 / R059 | card "Main + rejection + copy" | Authorized |
| 15 | engine.ts:4965-4970 + slideHold403 :5713 | NEW: gold slide under pink holds longs | fix371 / 403 | "maybe ... we should wait for a break"; card "No longs till pink breaks" | Authorized |
| 16 | engine.ts:5429 | NEW stale-call guard | fix375 | "yesss pls" | Authorized |
| 17 | impossibleGeo signature | `npPink` added; false for main | fix363 | n/a | No effect on main |
| 18 | live-switch.json (config) | No wall or exemption list changed for recon-tog. Only hours, sizes, seats, and np/sov appended to exempt lists | fix380-412 | | No weakening found |

**Unauthorized removals found in the diff for main: none.** I found no change between the checkpoint and now that removes or loosens a main wall without Love's words. What is wrong is (a) holes in how new walls were built (rows 7, 10, 11), (b) old exemptions that still bypass newer cornerstones (§2), and (c) old rules never put back (§4).

## 2. Exemption flags that skip a wall for main (all already in the checkpoint, so they are older than it)
- **foTurn (fake-out turn, fix139, Oct 23).** `foTurn` (:2432) is true when the last *closed 1m candle* is in her colour back across a faked-out band (fakeOutTurnNow :2345-2367). For main it skips:
  - **HER FLIP and the fix407 $5/10c minimum** (:2783, :2784, `!foTurn`), plus HER CANDLE (:2779)
  - **PINK 10% on gold** (:2524, `!(foTurn && asset !== "btc")`)
  - pink in TARGET PAST A BAND (:2609)
  - BTC BACK OVER/UNDER BY $10 (:2790)

  The pink waiver is in Love's fix139 words ("she can short once price breaks back under, even if there is a pink there"). The **HER FLIP waiver is not**. fix139 waived the old 5m "her candle". The waiver was carried onto Cornerstone #1 (fix325), which says "None = no entry". Since fix406 ("cut the 1M's") it is now a back door: one 1m candle lets main skip the 2-5m flip. The copy lost this waiver in fix366 ("copy only"). Main still has it. No denial or fill today was labelled a fake-out turn, so I have no live proof that it fired today.
- **pinkRoom (fix89, :2505-2518)**, gold. Skips PINK 10% when price bounced off a band, pink is >$3.50 away and entry is >$2 from pink. Love authorized it (fix89).
- **tight344 (gold 3:00-4:59 PM, channel <$2)**. Thirds and PINK 10% step aside. Authorized: Love named Cornerstone 2 for that slice.
- **noBBTarget (fix318)**. Bollinger is left out of gold TARGET PAST A BAND. Authorized: 5:41 AM Oct 27 card "Rejection model and main".
- togpLoose / rejNoAhead / npPink / twinFade / twinPinkAll are all **false** for recon-tog at door, sweep and wire. Checked at :712 and :2277.

## 3. Behaviour: do the walls fire, and which main fills broke a rule Love had set
Walls firing for recon-tog today (band-lock.jsonl, 10,789 denials):
- GREEN ZONE UNDER A BAND 1861
- PINK TO GREEN 1301
- THE $10 LEVEL 1277
- PINK 10% 1693
- TARGET PAST A BAND 1059
- THE IMPOSSIBILITY 1533
- PINK TO RED 459
- HER FLIP 151
- CLEAR OF $10 135
- INSIDE RED ZONE 34
- BTC PINK TO GREEN/RED 57
- NO SHORTS BOTTOM RUNG 16
- STEEP SLOPE 1

The main walls are alive. HELD 3s fired 6 times on recon-rej after 6:15 PM. Main had no attempts after the install, so fix411 and fix413 are **unproven for main**.

Main fills today (wire-pass.jsonl gives the channel the wire saw; window-results.json gives the settlement):
1. **12:47:12 PM gold SHORT, KXGOLD15M-26OCT281600, "Candle falling from the top third" — LOST.**
   - The door refused it at 4059.62 at 12:47:10, 12:47:11.618 and 12:47:11.639: "CLEAR OF THE $10 LEVEL: short only $0.38 under 4060".
   - 0.3 s later the wire passed it at 4059.72, 28c under 4060. Inside 30c the fix376 wall does not judge at all (:2630), and the INTO wall (:2624) does not cover it.
   - Love's rule "waits until price is at least $1.50 clear of the level" was broken. **Path: the fix376 `>= 0.3` carve-out.**
2. **1:15:16 PM gold LONG, KXGOLD15M-26OCT281630, "Rejected up off 5m PP" — LOST.**
   - 1:15:13 THE $10 LEVEL refused "long up into 4070".
   - 1:15:14-15 CLEAR OF THE $10 LEVEL refused at 4070.36 ($0.36 over).
   - 1:15:16.395 the wire passed it at 4070.21, 21c over 4070, so neither wall applied.
   - Same rule broken, same path.
3. **12:15:41 PM gold LONG, KXGOLD15M-26OCT281530, "Green candle rising from the bottom third" — WON.**
   - 12:15:38 refused: "THE IMPOSSIBILITY: long at 67% of 4046.48→4055.16 ... top 33%".
   - 3 s later it filled at 4051.66 (59.7%). It was legal on one tick. fix411 (HELD 3s) would now refuse it: the worst price in the last 3 s was at 67%.
   - Before the 6:15 PM fix it showed the gap Love described ("on her side for one tick").
4. **3:40:28 PM and 3:54:47 PM gold LONGS, "Break above 5m S1" — both LOST.**
   - 3:40: $2.15 under the unbroken pink 4057.24. 3:54: $2.04 under the unbroken pink 4055.44 (diary 23:05Z).
   - Both passed PINK 10% only because main's gold cushion is max(10%, $2): they cleared by 15c and 4c.
   - The wire saw lock **0.20** both times: wire-pass.jsonl 22:40:28 and 22:54:47, channel 4054.98→4058.01 ($3.03). This is fix219's 20% on gold main. At 3:51:50 PM main was also refused with "long at 99% ... the top 20%" on a $4.78 gold channel.
   - So gold main ran 20%, not 33%, on sub-$10 channels today, and nothing in the code since then changes that.
   - The 3:54 long is the one Love flagged. fix403 now holds gold longs on a slide under pink.
5. The other 14 fills match the code by every wall the logs show (pos and lock checked against wire-pass).
   - **UNSURE:** 11:01:15 AM gold long at 4042.01 ("Failed break below 5m PP - rejected up"). 1 s earlier the door was refusing at 4041.14 (CLEAR OF $10). The new R1 after the pivot change is not logged, so I cannot prove whether PINK TO RED (top 50% at that time) should have caught it.
   - The 10:01 AM "1m rejection off 5m PP" fill was legal: the 1m flip was still allowed then (fix406 came at 5:30 PM).

## 4. Rules Love set before (or apart from) the checkpoint that are not in the code for main

### fix295-315 (the fix316 rollback, Oct 27 5:08 AM PT)
- fix296 (bottom rung): back as fix327, at :2417.
- fix297 (zones rejection only): back as fix328.
- fix298 / fix302: back as fix329, at :2501.
- fix310 ($3 zone clearance): back as fix330, at :2464 / :2470.
- fix306-309: twin only.
- fix311-314: copy only. fix312 was undone at Love's word (fix332).
- fix295 / 299 / 300 (EARN THE COLOUR): left out on Love's words, fix300 "i like how she did it before fix295".
- **fix315 DOJI AFTER THE TREND: MISSING, and the backwards version is live on main.**
  - Love (Oct 27 3:57 AM): "it is SHORT ONLY when a doji is followed by a candle falling, it is a continuation of the candle after the doji. the literal opposite of what you jjust said".
  - Current code :2729 still uses the **doji's own colour**: `const dS = c > o ? "up" : "down"`. That is exactly the read she called the opposite.
  - The fix315 read survives only in `bandlock5m.ts:2581-2587` (Poly 5M) and in `data/SNAPSHOT-TODAY-2026-10-27-0457am/src/lib/desk/bandlock.ts:2581-2582`.
  - There is **no request-book entry for the doji at all** (0 hits in LOVE-REQUESTS.jsonl).
  - It fires on live books: recon-togp BTC 4:39 PM, "a green doji ... trades long only".
  - Later Love said "doji is inconsequential" (6:23 AM, card "Rejection model only"). That does not remove it from main.

### Rules in Love's words with no request entry, or not enforced as she said them
- Doji (above): no request entry, and the wrong version is in the code.
- "$1.50 clear of the $10 level" (R062): the request exists, but the code is weaker than her words (0-30c not judged).
- "Never trade into an unbroken band / strict band tolerance, pink breaking doesn't remove it" (Oct 17, re-said 6:06 PM): only the pink-nearest case is coded (fix413).
- Steep slope 45°/skateboard (rulebook, Oct 27 6:30 AM): still "pending". Only fix104/fix194 exist.

### Copy vs main
Love: "the copy was supposed to be a COPY. NOT DIFFERENT BAND RULES." The copy is stricter than main on:
- **gold thirds 33% under $10** (main 20% via fix219)
- gold PINK 33c both ways (:2533-2534)
- BTC PINK $33 break-only (:2527)
- fake-out turn no longer skips the flip (:2785)
- Bollinger-over-band $75 (main $50)

The copy is looser than main on:
- the fake-out floor, which the copy skips (:2702)
- the BTC pink/Bollinger cushion, capped at $25 at ≤$100

If the copy is meant to mirror main's band rules, one of the two is wrong on each item. Love must say which way. For the thirds, her own words (R005, fix414, "20/33 on every book except the twin") point to **33% on gold main under $10**.

## 5. Bottom line

### INTACT (in the code, and fired on main today)
- THE IMPOSSIBILITY / thirds (:2435, :2447-2448); BTC 33% ≤$500
- NO SHORTS BOTTOM RUNG (:2417)
- TOP / BOTTOM LINE (:2423-2425)
- PINK 10% sliding scale (:2496-2501, :2535-2536); main gold pink break 25c (:2530)
- Gold PINK TO RED top 55% / PINK TO GREEN bottom 55% (:2575, :2582)
- BTC PINK TO GREEN/RED 40% (:2393-2395)
- BREAK INTO A ZONE / RED ZONE OVER A BAND / GREEN ZONE UNDER A BAND (:2456-2480)
- INSIDE ZONE (fix377) and $1.50 BEFORE ZONE (fix378) (:2632-2639)
- THE $10 LEVEL into-wall (:2624)
- BOLLINGER CUSHION / NOT BROKEN
- TARGET PAST A BAND
- FAKE-OUT FLOOR / CEILING
- HER FLIP 2-5m + $5/10c (:2783-2784), except under foTurn
- Door walls channelOnly / candleDirOnly / reconZoneGate / thirdWallAbsolute (unchanged)
- Blue VWAP wall + across-VWAP at the wire
- Gold slide hold (engine.ts:4965)

### MISSING-OR-WEAKENED (each with a proposed restoring fix; every one needs Love's words first)
1. **$10 level 0-30c hole.** bandlock.ts:2630: change `Math.abs(d376) >= 0.3 && Math.abs(d376) < 1.5` to `Math.abs(d376) < 1.5` (with the side test kept, plus `d376 !== 0`). Two losing live fills today went through it (12:47 PM, 1:15 PM).
2. **DOJI read backwards (fix315 lost in fix316, no request entry).** bandlock.ts:2729-2730: replace with the fix315 lines from `data/SNAPSHOT-TODAY-2026-10-27-0457am/src/lib/desk/bandlock.ts:2581-2582` (`dS` = the current 5m candle vs `fiveOpenNow`). Or remove the wall on main if "inconsequential" is meant for her too. Add an R-entry either way.
3. **HER FLIP waived by foTurn on main.** bandlock.ts:2783-2784: drop `!foTurn` (mirror fix366 :2785), so a 1m fake-out close can't stand in for the 2-5m flip she asked for in fix406.
4. **Gold main thirds 20% on sub-$10 channels (fix219).** bandlock.ts:2435: extend the fix351 branch to main, `(togpLoose || flipRule) && asset === "gold" && above - below < 10 ? 0.33`. Seen live: lock 0.2 at 3:40 PM and 3:54 PM; "top 20%" denial at 3:51 PM.
5. **R087 still active (20% small-band) after fix414.** In data/LOVE-REQUESTS.jsonl, `requests.py retire R087` with Love's 6:10 PM words. The umpire currently "proves" a rule that is off.
6. **fix413 too narrow.** bandlock.ts:1724: add `^fresh VWAP$`. In :1722, judge the nearest *band* (pink or session) rather than any line, so zone/purple lines don't switch it off.
7. **fix411 re-checks only impossibleGeo.** bandlock.ts:721: also run channelOnly / candleDirOnly / thirdWallAbsolute / sessionAheadWait at `w411` ("reinforce everything").
8. Cosmetic: bandlock.ts:2582 denial text says "60%" while the rule is 55%.

### UNSURE
- 11:01 AM gold long at 4042.01: the R1 after the pivot change isn't logged, so I can't prove whether PINK TO RED should have refused it.
- One recon-tog DOJI denial at 2:40 PM (21:40Z) carries fix315 wording that only bandlock5m.ts produces. Something labelled recon-tog is being judged by the Poly 5M file somewhere; not traced.
- fix411 / fix413 have had no main attempts since 6:15 PM, so their behaviour on main is unproven.
