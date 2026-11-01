# Audit: the no-pink copy (lane `recon-togp`, `togpLoose` in impossibleGeo)

Auditor: independent, read-only. Repo: /tmp/claude-0/repo @ f47cd6d (after fix414). Checkpoint: data/SAVES/KNOWN-GOOD-2026-10-27-0756PM-PT-checkpoint-main-and-no-pink-copy-after-fix360/src (CP). Pre-rollback snapshot: data/SNAPSHOT-TODAY-2026-10-27-0457am/src.
All line numbers are current `src/lib/desk/bandlock.ts` unless noted. Times are PT (PDT, UTC-7).

## 0. How the copy is judged (where the walls live)

| Path | Code | What it runs for recon-togp |
|---|---|---|
| Paper call | recon.ts:663-664 `book("recon-togp", firstT ...)` | Main's read (firstT). It skips pink labels unless `tpStack` (fix283) and skips " - seen as" thirds flips (fix364). **No walls at booking.** |
| Paper filter | bandlock.ts:1110-1120 `paperBandFilter` RECON branch | impossibleGeo + channelOnly + candleDirOnly + reconZoneGate + reconThirdAgainst + thirdWallAbsolute. **No fix411 HELD 3s, no fix413 SESSION AHEAD, no thirdsMove, no wire walls (fix397/399), no gold-slide hold (fix371/403).** |
| Kalshi door | bandlock.ts:705-740 `bandLockCheck` RECON branch | impossibleGeo (712) + fix411 (717-723) + fix413 (727) + thirdsMove (728) + the same five walls. **The RECON branch returns before the band-law self-test check at 741.** |
| Kalshi wire | bandlock.ts:2246-2297 `wireWall` | Blue VWAP wall fix397 (2259-2265), ACROSS THE BLUE VWAP fix399 (2266-2271), then impossibleGeo with `togpLoose = tpOrderAtWire` (2277). |
| Engine | engine.ts ~4969 | Gold slide under pink, fix371/fix403 (main/rej/copy gold longs, Kalshi only). |

The copy passes `flipRule=false, rejNoAhead=false, noBBTarget=false, zoneGuard=0, togpLoose=true, npPink=false` at the door, paper filter and wire (712, 721, 1116, 2277). Main passes `flipRule=true, noBBTarget=true, zoneGuard=0.4`. Every `togpLoose`-only branch below follows from that.

## 1. Changes since the checkpoint that touch the copy's entries (CP vs current)

Files that changed: bandlock.ts, recon.ts, engine.ts, kalshi-live.server.ts, fns.ts (fns only adds a read-only card). live-guard.ts, pivotbooks.ts and paper.ts are byte-identical.

| # | Wall / condition | Change for the copy | Where | Fix + Love's words | Verdict |
|---|---|---|---|---|---|
| 1 | HER FLIP | 1m dropped, so the flip is now 2/3/4/5m and ≥$5 BTC / 10c gold past the open (anyFlipMinNow). | 1207, 2785 | fix406. Love 5:07 PM Oct 28: "let's go ahead and cut the 1M's" + card "Main + rejection + copy" | Tightened, has Love's words |
| 2 | HER FLIP vs fake-out turn | A fake-out turn no longer skips the copy's flip. Was `!foTurn`, now `!(foTurn && npPink)`. | 2785 | fix366. Love 9:23 PM Oct 27: "yes, both bb" | Tightened, has Love's words |
| 3 | THIRDS BTC | Copy and main BTC channels ≤$500 lock 33%, overriding fix219's 20%. | 2435 | fix379. Love 1:06 AM Oct 28: "yes pls all of them for sure" | Tightened, has Love's words |
| 4 | THIRDS small bands | fix399 (3:24 PM) set 20% while bands are small on every Kalshi book. **It was live 4:00-6:15 PM.** fix414 removed it. | 2435 comment | fix399, then fix414. Love 6:10 PM: "that's a HARD no on 20% at this band width" | Restored now. Logs show the copy refused "bottom 20%" at 5:50:39 PM, so the 5:31 PM short (at 29%) passed only because of it. |
| 5 | Gold PINK→GREEN / PINK→RED | No short in the bottom 55% / no long in the top 55% (CP: 50%/50% for the copy). | 2575, 2582 | fix365 then fix409. Love 5:39 PM: "55% for shorts and longs pls / main rejection and copy bb" | Tightened. Refusal text still says "top 50%" (2575) and "60%" (2582). Cosmetic. |
| 6 | BTC Bollinger over the band | Copy $75 (main $50). | 2590-2591 | fix366, "yes, both bb" | Stricter than main |
| 7 | Gold $10 level clearance $1.50 | New for main/rej/copy. | 2629-2630 | fix376. Love 12:23 AM Oct 28: "yess let's do it" | New wall, has Love's words |
| 8 | Gold inside the red/green zone | New. | 2633-2635 | fix377, "yes pls bb" | New wall, has Love's words |
| 9 | Gold $1.50 before the zone | New. | 2638-2640 | fix378. Love: "keep the $1.50 tolerance from it in place too ... just gold bb" | New wall, has Love's words |
| 10 | Blue VWAP wall (small bands) | New at the wire, every Kalshi book. | 2259-2265 | fix397/397b. Love 2:46 PM Oct 28: "we need to keep the blue vwap a wall on all books when bands are small" | New, wire only (live only) |
| 11 | Across the blue VWAP to target | New at the wire. | 2266-2271 | fix399 (second half, still on) | New, wire only |
| 12 | HELD ON HER SIDE 3 s | New. Every impossibleGeo wall is re-judged at the worst price of the last 3 s. | 717-723 | fix411. Love 5:56 PM: "she needs to be ON the side of the break" | **Door only. Not in paperBandFilter (1116).** |
| 13 | SESSION BAND AHEAD OF THE PINK | Brought back. | 727, 1720-1732 | fix413. Love 6:06 PM: "IT IS A STRICT BAND TOLERANCE. PRICE BREAKING PINK DOES NOT REMOVE THAT" | **Door only. The regex at 1724 ignores "fresh VWAP" (see 3.4).** |
| 14 | No thirds flip reads | The copy never books main's " - seen as a short/long". | recon.ts:664 | fix364. Love 8:38 PM Oct 27: "yes the flip is already supposed to be off hun" | Has Love's words |
| 15 | BTC pink re-aim | An unfilled copy long refused by a PINK wall re-aims to the pink-rejection short. Uses `anyFlipNow` (no $5 minimum), but the door still applies the copy's $5 flip. | recon.ts:~760-770 | fix373. Love card "Main + rejection + copy" | Has Love's words |
| 16 | Gold slide under pink | No gold long until pink breaks by 25c. | engine.ts ~4969, slideHold403 | fix371/fix403. Love 4:04 PM: "can you make sure everything stays when we make a rule?" | Kalshi only |
| 17 | npPink arguments | Added `&& !npPink` guards. The copy always passes npPink=false, so nothing changes for her. | 2527, 2534, 2573, 2580, 2590, 2629... | fix363/367/368 (pure no-pink only) | No effect on the copy |

**No change since the checkpoint weakened a copy wall without Love's words.** Every diff has a diary line with Love's words. The weakening that did happen (fix399's 20%) had her words and was taken back by fix414.

## 2. Exemptions and the "copy is not a copy" list

Coordinator ask, Love: "the copy was supposed to be a COPY. NOT DIFFERENT BAND RULES." Every place `togpLoose` (copy) differs from `flipRule` (main) today:

| # | Line | Main | Copy | Origin (Love's words) | Direction |
|---|---|---|---|---|---|
| C1 | 2393-2395 (args at 712/721/1116/2277: zoneGuard) | BTC PINK→GREEN / PINK→RED 40% (fix323/324) | **None.** zoneGuard=0. | fix323 card "Main only" | Copy looser |
| C2 | 2609 (noBBTarget) | Gold TARGET PAST A BAND ignores the Bollinger | Copy keeps the Bollinger | fix318 (main + rej) | Copy stricter |
| C3 | 2609 `(rejNoAhead \|\| togpLoose /* fix332 */)` | Every pink counts in gold TARGET PAST A BAND | **Copy skips a pink in the middle 10-90% of the channel.** | fix332. fix347 (5:35 PM Oct 27) said "Copy no longer skips unstacked pink (fix332 now rejection model only)" but only changed PINK 10% (2529), not this filter. | **Copy looser. Leftover of a retired rule.** |
| C4 | 2435 | Gold <$10: lockPctFor (20% when the channel is ≤ one fresh sigma, fix219) | Gold <$10: always 33% | fix351, card "33% on the copy only" | Copy stricter |
| C5 | 2527 | — | BTC PINK $33, break-only (broken = $3 through on one tick) | fix346/346b/350 | Copy-only wall |
| C6 | 2530 (pbd) | Gold pink counts as broken at 25c | Gold pink broken at BREAK_DIST (33c) | fix338, "MAIN only" | Different |
| C7 | 2533 | BTC pink cushion w10 ($25 at ≤$100, else max($50, 10%)) | Same value (the cap at ≤$100 duplicates w10) | fix292/298 | Effectively identical |
| C8 | 2534 | — | Gold PINK 33c barrier both ways, channel <$10 | fix348/349 | Copy-only wall |
| C9 | 2547 | BTC Bollinger cushion w10f (min $50) | **$25 cap when the channel is ≤$100** | fix286/302, card "Match pink ($25 only <=$100)" | Copy looser |
| C10 | 2590-2591 | Bollinger over the band $50 | $75 | fix366 | Copy stricter |
| C11 | 2702 | FAKE-OUT FLOOR (no short off a faking floor) | **Skipped for the copy** | fix286, card "Drop BB cushion + fake-out floor" | Copy looser |
| C12 | 2783-2785 | Flip waived on a fake-out turn (`!foTurn`) | Not waived (fix366) | fix366 | Copy stricter |
| C13 | 2786 | — | — (rejection model only) | — | n/a |
| C14 | recon.ts:664 | Main takes every read | Copy takes pink reads only when `tpStack` (pink + session band in the outer 20%, fix283), never " - seen as" thirds flips (fix364) | fix283 / fix364 | Copy takes some pink trades: 2:01 AM "1m rejection off 5m PP" short (lost), 3:31 PM "Rejected up off 5m PP" long (won) |
| C15 | 2442 tight344 | Same for both | Same | — | Identical |

History: on Oct 27 at 2:54-2:56 AM Love asked for this exact thing (diary line 2141, fix312 second version): "please make an exact copy of the main book again, and exclude pink trades, no trades within $1.50 of pink. that's it. same everything. nothing else different please". fix312 turned C9, C11, the fix311 loose turn and C14 (fix283 stacked pinks) back to main. **The 5:08 AM rollback fix316 removed fix312. fix327-331 brought back only 296/297/298+302/310/306-309. fix312's "copy = main" was never restored.** The audit at 11:56 AM listed 311-314 as "left out per her later words". C9, C11 and C14 are the rules fix312 had removed.

**Foot-guns that skip copy walls (some predate the checkpoint):**
- 2524: on gold, `foTurn` skips the entire pink loop (PINK 33c, PINK 10%) for every book (fix139/163).
- 2609: `foTurn` drops the pink from TARGET PAST A BAND.
- 2790: `foTurn` skips BACK OVER BY $10.
- 2442/2447: tight344 (gold 3-5 PM, channel <$2) skips thirds and pink. Love's words, fix344.
- **705 vs 741: the RECON branch never checks `G.__bandLawBroken`.** band-lock.jsonl has 8,738 "band law failed its self-test" refusals from 3:08 to 4:08 PM PT Oct 28 on non-recon books. In the same hour the copy filled BTC at 3:31 PM and 3:45 PM. No diary line says recon books are exempt from the self-test kill switch.

## 3. Rules set before the checkpoint that are not (fully) in the code

3.1 **fix312 "copy = main 1:1 minus pink"** (Oct 27 2:54 AM). Removed by the fix316 rollback and never restored. See section 2.

3.2 **fix315 DOJI reads the candle after the doji** (Love 3:57 AM Oct 27: "it is SHORT ONLY when a doji is followed by a candle falling, it is a continuation of the candle after the doji"). Not in the code. 2729-2730 still uses the doji's own colour (`dS = c > o ? "up" : "down"; if (side !== dS) why = DOJI AFTER THE TREND`), which is the reading Love called "the literal opposite". The diary left 315 out because of her 6:23 AM line "doji is inconsequential" (said about the rejection model). So the wall is still live on every book with the reading she rejected. **Needs Love: fix the reading or retire the doji wall.**

3.3 **fix295/299/300 EARN THE COLOUR** (first 30 s of a 5m candle, BTC $2 / gold 10c). Gone since fix316, and Love said "i like how she did it before fix295". Correctly absent. fix311 (copy fake-out turn without a 1m close) and fix314 (copy band rejections only) are also absent; Love undid 314 herself ("tried and undone Oct 27"). fix296, 297, 298, 302 and 310 are present (2416, recon.ts zone filter, 2500, 2547, 2463/2469).

3.4 **Session band ahead (fix413) does not see the fresh VWAP.** 1724 filters `/σ$|^session VWAP$|^BB (upper|lower)$/`. After the 2 PM reset, Love's blue VWAP is the line named "fresh VWAP" (fix397b), so a fresh VWAP ahead of the pink is ignored. It also only fires when the pink is the single nearest line (1722). A zone or Bollinger line slightly nearer than the pink silences it.

3.5 **fix347 incomplete:** C3 above.

3.6 **The rulebook says "No-pink copy gold flat $1.50 (Love kept it Oct 27)".** The code uses the sliding scale (gold 10% or $2, plus 33c) from fix347, which came later. The rulebook line is stale; it is not a regression.

3.7 **The rulebook says "A band isn't unbroken until a candle closes outside it"**, next to "Breaks count when they happen (no 1m close wait)". The two contradict each other. The copy's BTC pink break is one tick $3 through (2527/2530), with no close and no hold. fix411 now adds a 3 s hold, at the live door only.

## 4. Behaviour: the copy's live fills on Oct 28 PT (from live-book-done + live-fires + band-lock + window-results)

45 recon-togp Kalshi fills from 12:02 AM to 5:50 PM. Notable ones:

| Time | Trade | Result | What let it through |
|---|---|---|---|
| **5:50:57 PM BTC long** (KXBTC15M-26OCT282100, "Failed break below fresh -2σ - rejected up", paid 47c) | Refused by PINK $33 every tick up to 5:50:56.783 (tick 81090.20, $15 under pink 81105.20). At 00:50:57.633Z other books logged tick **81111.32** ($6.12 over pink). Fill 5:50:57.776. At 5:50:58.634 the tick was 81064.47 ($41 under pink). | Lost (settled NO) | `pp > tick - 3` at 2527 treated one tick $6 over as "broken". HER FLIP passed on the same tick (2-5m candle ≥$5 over its open, 2785). Thirds passed: the code measured 57% of fresh -2σ 81072.19 → fresh -1σ 81140.91 (edges = σ/VWAP/fresh VWAP, isChanBand line 79). BACK OVER BY $10 passed ($39 over -2σ). SESSION BAND AHEAD did not exist yet (fix413 went in at 6:15 PM). With fix411 + fix413 in place now, the live door would refuse it (worst 3 s price 81090 is inside PINK $33; fresh -1σ $29.6 ahead vs fresh -2σ $39 behind). |
| 3:31:15 PM BTC long "Rejected up off 5m PP" | A pink trade on the no-pink copy (fix283 tpStack). Refused "THE IMPOSSIBILITY ... 68% ... top 33%" at 3:31:14 (81199.76), filled about 1 s later, recorded spot 81199.75 (68%). Other books had 81207 (82%) at 3:31:16. **Also filled while the band-law self-test was failing.** | Won | Very likely a one-tick dip under the 67% line plus the RECON self-test bypass (705) |
| 3:45:20 PM BTC long "Rejected up off fresh VWAP" | Recorded spot only $3.34 over pink 81228.47, barely past the $3 break. Self-test failing. | Lost | 2527 one-tick break + 705 bypass |
| 2:01:04 AM BTC short "1m rejection off 5m PP" | A pink trade, at 87% of the channel | Lost | fix283 tpStack (recon.ts:664) |
| 1:21:24 AM BTC short | Refused "THE IMPOSSIBILITY short at 25% ... bottom 33%" the same second, filled at recorded 81087.15 (25.9%) | Lost | Unknown passing tick; likely another one-tick pass (no 3 s hold then) |
| 1:01:03 AM BTC long at 77% | Was 20% territory then. This trade triggered fix379 (33%). | Won | Pre-fix379 |
| 5:31:20 PM BTC short at 29% | Passed only because fix399's 20% was live | Won | fix399, now removed by fix414 |

Note: the `spot` in live-fires.json is not the tick the gate judged. The 5:50:57 fire records 81081.16, but the passing tick was 81111.32. Any audit that reads live-fires spot will miss one-tick passes.

**Love's view of the 5:50:57 channel.** Love: "it was 100% in the top of the channel. pink itself was like $20 under the session band itself."
- In the 5:45-5:50 candle the pink was 81119.73, **$22 under fresh -1σ 81141.98**, which matches her "$20". That pink sat at about 67% of the fresh -2σ→-1σ channel, so any long over that pink was in the top third.
- At 5:50:00 the new 5m pivot moved the pink to 81105.20 (48%). The spike tick 81111.32 then sat at 57%, outside the top third, so thirds passed.
- If the channel is the carried session bands (session VWAP 80868.38 → +1σ 81162.63, still on her list in band-log.jsonl), 81111 is at **83%, top 33%**. The code splits that channel with the fresh lines (fix219, card "All fresh bands are walls").
- So her reading holds against session-to-session bands and against the pink she was looking at. It does not hold against the channel the code computes.

## 5. Summary list

### INTACT (in code, for the copy)
- HER FLIP: 2/3/4/5m, ≥$5 / 10c (2785, 1203-1216; fix359/406)
- THIRDS: BTC 33% ≤$500 (2435, fix379); gold 33% <$10 (2435, fix351); gold ≥$10 lockPctFor 20/15%; fix399's 20% removed (fix414)
- BTC no shorts under -2σ (2416, fix296/327)
- Top / bottom line (2423-2425), beyond-band (2478-2480)
- BTC pink $33 break-only (2527), PINK 10% sliding scale (2535-2536), gold pink 33c both ways (2534)
- Gold PINK→RED / PINK→GREEN 55% (2575, 2582)
- Gold zones: break into zone $3 (2463), inside zone (2633), $1.50 before zone (2638); $10 level (2618-2624) and its $1.50 clearance (2629)
- Bollinger cushion (2548), Bollinger 1m close (2553-2557), Bollinger over the band $75 (2590)
- BACK OVER BY $10 (2790)
- fix411 HELD 3 s and fix413 SESSION AHEAD at the **live door** (717-727)
- Blue VWAP walls at the wire (2259-2271); gold slide hold (engine)

### MISSING OR WEAKENED, with proposed restoring fix (each needs Love's words per Cornerstone #1)
1. **One-tick break / same side of the break on paper.** fix411 and fix413 are only in `bandLockCheck` (717-727), not in `paperBandFilter` (1116). The copy is now paper, so her "training" record is judged without them. Fix: after the impossibleGeo `whyR` at bandlock.ts:1116, add the same HELD-3s block (copy of 717-723) and the `sessionAheadWait` call (727) for `recon-tog|recon-rej|recon-togp`.
2. **RECON books bypass the band-law self-test.** bandlock.ts:705 returns before 741. Fix: at the top of the RECON branch (after 705) add `if (G.__bandLawBroken) return deny("band law failed its self-test - no orders until it passes");`, and the same at 1110. Evidence: 3:31 PM and 3:45 PM copy fills during the 3:08-4:08 PM self-test failure.
3. **fix413 blind to the fresh VWAP.** bandlock.ts:1724: change the regex to `/σ$|^session VWAP$|^fresh VWAP$|^BB (upper|lower)$/`. Also consider dropping the "pink must be the nearest line" condition at 1722.
4. **fix332 leftover in TARGET PAST A BAND (gold).** bandlock.ts:2609: remove `|| togpLoose /* fix332 */` from the 10-90% pink filter. This finishes fix347 ("Copy no longer skips unstacked pink").
5. **Copy is not main 1:1 (fix312 never restored after the fix316 rollback).** To make the copy main minus pink:
   - pass main's arguments for recon-togp at bandlock.ts:712, 721, 1116 and 2277 (zoneGuard 0.4, noBBTarget true, flipRule true), so C1 comes back;
   - remove the copy-only loosenings at 2547 (C9) and 2702 (C11);
   - drop `|| tpStack` at recon.ts:664 (C14), so the copy never takes a pink trade.

   Love has to name each rule retired: fix283, fix286, fix292/302 (copy part), fix346-350, fix351, fix366.
6. **fix315 doji reading not in the code.** 2729-2730 still reads the doji's own colour. Either change the read to the candle after the doji, or retire the wall on "doji is inconsequential". Ask Love.
7. **Refusal texts are stale**: 2575 says "top 50%" and 2582 says "60%"; the code uses 55%. Cosmetic, but they mislead audits.

### UNSURE
- Whether Love's "session band to session band" channel means the carried session VWAP/σ lines (5:50:57 long = 83%, top third) or the fresh lines the code uses (57%). The code follows fix219 "All fresh bands are walls". This needs her call.
- The exact passing ticks of the 1:21 AM and 3:31 PM fills. live-fires `spot` is not the gate tick. Both look like one-tick passes, but I can't prove it.
- paperBandFilter `seen` map (1109/1118): after one refusal the id+side is marked seen, and a later write could pass the row unjudged. The logs show repeated refusals of the same id+side, so it seems to re-judge in practice. Not proven either way.
- The foTurn exemptions (2524 gold pink loop, 2609, 2790) still let a fake-out turn skip pink and BACK OVER BY $10 for the copy. They predate the checkpoint and have Love's old words (fix139/163), but they conflict with "price needs to be on the same side of the break".
