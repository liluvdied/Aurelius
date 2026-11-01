# Audit: rejection model (lane `recon-rej`)

Scope: the clone at `/tmp/claude-0/repo` (HEAD f47cd6d, after fix414; the data snapshot ends 2026-10-29 01:17Z, which is 6:17 PM PT Oct 28), compared with the checkpoint at `data/SAVES/KNOWN-GOOD-2026-10-27-0756PM-PT-checkpoint-main-and-no-pink-copy-after-fix360/src`. Nothing in the repo was changed. All times are PT unless marked Z. Line numbers refer to the current `src/lib/desk/bandlock.ts` unless another file is named.

## 0. How a recon-rej order is judged (current code)
1. **The call.** `recon.ts:940-942` makes it: `lookRM` from `bonesDecide(..., rejOnly=true)`, plus fix326's pink-flip read. An unfilled call is re-aimed to her newest read on every tick (`recon.ts:484-527`; fix258/fix285, with Love's words).
2. **The door.** `bandLockCheck` RECON branch, `bandlock.ts:705-750`, runs in this order:
   - `impossibleGeo(rejNoAhead=true, noBBTarget=true, zoneGuard=0.4, flipRule=true)`
   - fix411 HELD 3s (714-722)
   - fix413 SESSION AHEAD (724-727)
   - thirdsMove, channelOnly, candleDirOnly, reconZoneGate, reconThirdAgainst, thirdWallAbsolute
3. **The wire.** `wireWall`, 2246-2300, runs:
   - THE SEAL
   - fix397 blue VWAP wall, then fix399 across-the-VWAP wall
   - `impossibleGeo` again, with recon-rej's flags only if `rejOrderAtWire()` finds a recon-rej record in live-book-done **with the same side**
   - thirdsMove and thirdWallAbsolute

   The wire does **not** run fix411 (HELD 3s), fix413 (session ahead), channelOnly or candleDirOnly. Those live only at the door.

## 1. Changes since the checkpoint (fix361-fix414) that touch recon-rej entries
The `diff` of checkpoint against current touches bandlock.ts, recon.ts, engine.ts, kalshi-live.server.ts, fns.ts, bandlock5m.ts (Poly 5M only, frozen per R069) and selfcheck.ts. Every changed line was read. All 18 lines removed from bandlock.ts were replaced; no wall was deleted outright.

| # | Change | Effect on recon-rej | Fix / Love's words | Request |
|---|---|---|---|---|
| 1 | HER FLIP loops `[1..5]` → `[2,3,4,5]` (anyFlipNow 1172, anyFlipMinNow 1203) | Tighter: no 1m flip. **But** the fake-out turn exemption (`foTurn`, 2779/2783/2784) is built on a closed **1m** candle (fakeOutTurnNow 2345-2368), so a 1m close still waives HER FLIP for this book | fix406, 5:07 PM: "let's go ahead and cut the 1M's" | R096 |
| 2 | HER FLIP needs the candle 10c gold / $5 BTC past its open (2784) | Tighter | fix407, 5:12 PM: "yess pls bb" | R097 |
| 3 | PINK TO GREEN, gold short: 60% → **55%** (2582) | **Weaker for shorts** (5 points less wall) | fix409, 5:37 PM: "yeah let's make it 55% hun that's good" | R099 |
| 4 | PINK TO RED, gold long: 50% → 55% (pos ≥ 0.45) | Tighter. The denial text still says "top 50%", and the PINK TO GREEN text still says 60% (cosmetic, misleading in logs) | fix409, 5:39 PM: "55% for shorts and longs pls" | R099 |
| 5 | HELD 3s: impossibleGeo also judged at the worst price of the last 3 s (714-722) | Tighter, **door only**. Only impossibleGeo is re-judged, not channelOnly/candleDirOnly/thirdsMove. Not at the wire | fix411, 5:56 PM: "she needs to be ON the side of the break ..." | R101 |
| 6 | SESSION BAND AHEAD OF THE PINK = WAIT (724-727, `sessionAheadWait` 1720) | Tighter, **door only**, and narrow: fires only when the 5m PP is the single nearest line **and** the session band ahead is closer than the one behind. Love's words were "IT IS A STRICT BAND TOLERANCE. PRICE BREAKING PINK DOES NOT REMOVE THAT" | fix413, 6:06-6:07 PM | R103 |
| 7 | IMPOSSIBLE share: BTC fixed at 33% up to $500 wide for flipRule books (2435). fix399's 20% while bands are small is gone | Tighter on BTC. **Gold recon-rej still reads `lockPctFor`, which keeps fix219's 20% when the channel is no wider than one fresh sigma (line 180)** | fix379 1:06 AM ("yes pls all of them for sure"); fix414, 6:10 PM: "just keep it at 33% dude ... HARD no on 20% at this band width" | R066 / R104 |
| 8 | Blue VWAP wall and across-the-VWAP wall at the wire (2259-2271) | Tighter, every Kalshi book | fix397 / fix399 | R085 / R087 |
| 9 | Gold: $1.50 clear of the $10 level; no long inside the red zone or short inside the green; $1.50 before the zone (2626-2640) | Tighter | fix376 / fix377 / fix378 | R062 / R064 / R065 |
| 10 | Gold slide under pink: no gold long (engine.ts ~4962, `slideHold403`) | Tighter, longs only | fix371 / fix403 | R057 / R093 |
| 11 | **New entry path:** BTC unfilled long re-aims to a pink-rejection short (recon.ts 763-771) | New way in, gated by the walls | fix373: "if the numbers are that good on btc you can go ahead and put that in" | R059 |
| 12 | Stale-call guard, 90 s (engine.ts ~5429) | Tighter. Does not apply once a record exists (as on 6:16 PM's call) | fix375 | R061 |
| 13 | Second add-on at the next band with a 1-5m flip (engine.ts 2264-2300) | **Add-ons skip the entry walls** ("FREE ADD-ON", engine.ts 2255). Love's fix380 words were "same entry logic ... take it as she would any other trade". Currently off (fix402 `addOn.second.on false`) | fix380 / fix402 | R067 / R092 |
| 14 | Seats: rejection seat every hour (fix412), skip hours (fix405) | Config | R102 / R095 | |

No change was found without Love's words or a card. The real weaknesses are pre-checkpoint design gaps and narrow implementations of today's fixes (sections 3-4).

## 2. Exemptions that skip walls for recon-rej (all pre-checkpoint, still live)
- **`rejNoAhead` skips pink.** Pink holds only when it sits in the outer 10% of the channel (2529). Love's fix319 / R004, legitimate.
- **`rejNoAhead` skips BREAK INTO A ZONE (zone ahead before the next band, 2463/2469).** fix317, Love 5:15 AM Oct 27: "SHE CANNOT TRADE IF THE GREEN ZONE IS BEHIIIIIND THE BAND. NOT IN FRONT OF IT". Legitimate. fix377/378 (inside the zone, $1.50 before it) now cover part of the same ground.
- **`flipRule` zeroes HER CANDLE (`cdl = ""`, 2783).** The 5m candle with fix271's 30c gold / $10 BTC stickiness no longer judges recon-rej at all. Only the literal-colour "any 2/3/4/5m candle" flip remains (fix325, Love "literal color"). This is the gap that let 6:16 PM through (section 3).
- **`foTurn` (fix139 fake-out turn) skips three walls for this book:** HER FLIP and its 10c minimum (2783-2784), BACK OVER BY $10 (BTC), and gold PINK 10% (2524). The copy lost the foTurn flip waiver (fix366); main and recon-rej kept it. Cornerstone #1 says "None = no entry". The cornerstone text names no exemption, yet a closed 1m candle still waives it here.
- **`rejNoAhead` re-allows a 5m candle against her** when any 1-5m candle moves her way (2786; fix319 card "Rejection model only").

## 3. Behaviour: tonight's live fill (the only recon-rej live fill on Oct 28 PT)
**KXGOLD15M-26OCT282130-30, short, filled 01:16:04.924Z (6:16:04 PM).** Order 01a1853a-7820-..., $5, 59c. Setup: "Launched from the top third (high 4054.55) - a short until the bottom third".

Timeline, from `data/band-lock.jsonl`, `data/live-book-done.json`, `data/wire-pass.jsonl` and `data/live-fires.json`:
- **01:15:00Z.** The window opens. Previous 5m candle: o 4046.50 → c 4053.77, high 4055.86, a strong green candle through VWAP and the red zone R1.
- **01:15:09Z.** fix411/413/414 go live and fix412 puts recon-rej in the seat. Diary: "LIVE back on after fix414 01:15:09".
- **01:15:09-01:16:02Z.** recon-rej's call is a **LONG**, refused about 200 times by "RED ZONE OVER A BAND".
- **01:16:02Z.** The call re-aims to a **SHORT**. Same tick, 4053.618:
  - Paper twins without flipRule refused it: `recon-rejx` and `recon-togr` logged **"HER CANDLE: the 5m candle is rising - a long or nothing, never a short."**
  - recon-rej itself was held only by fix411: "HELD 3s ... at 4053.81 in the last 3 s: HER FLIP: no 2/3/4/5m candle is red".
  - It was refused 6 times up to 01:16:04.293Z.
- **01:16:04.661Z, wire-pass.** Tick 4053.497, channel VWAP 4049.29 → +1σ 4056.90, pos 0.553, lock 0.33. The 4053.81 tick had aged out of the 3 s window, so the worst price left was 4053.618.
- **01:16:04.738Z, fill.** live-fires `spot` 4053.81; sessionNow spot 4053.97.

**Why it passed.** HER FLIP is literal colour on any one of 2/3/4/5m, 10c past that candle's open.
- At 4053.81 the door log says no 2-5m candle was red. So every open was ≤ 4053.81.
- At 4053.618 the door passed, so some candle's open was ≥ 4053.718.
- The 3m and 5m candles opened at 01:15:00 at about 4053.63 (ogp5-trace last1m for the 01:15 bar: o 4053.63, c 4053.75). That is only about 1c above the tick, not 10c, so they were not "red".
- The **2m and 4m candles opened at 01:16:00 at about 4053.75, 4 seconds before the order.** 4053.618 is 13c under that open, which is the only way the 10c test passes.

So the "flip" was a 2m/4m candle **4 seconds old**, 13c under its open, while the 3m and 5m were green. By the fill the price was back over every open (spot 4053.81), so no candle was red at all. The exact pivBar opens are not in the snapshot; this is inferred from the two door messages and the ogp5 trace, and it is the only reading consistent with both.

**Which rule did it break?** It did not break any wall as coded. It broke the intent of Love's earlier rules:
- fix271 (Oct 26 11:02 AM): "a 4 cent rise cannot count as rising even when the candle is red". 30c stickiness; flipRule zeroes it for this book.
- fix300 (Oct 26 10:36 PM): "if it was cents causing her decisions on fresh candles like that let's just make it the bare minimum for her to not do that". EARN THE COLOUR, which fix316 rolled back.
- 5:56 PM tonight: "she needs to be ON the side of the break". HELD 3s accepted 3 s of a 13-20c dip.

**Code path:** `bandLockCheck` → `impossibleGeo(flipRule=true)` → 2783 sets `cdl = ""` (HER CANDLE off) → 2784 `anyFlipMinNow` is true via the 4-second-old 2m/4m candle → HELD 3s passes once the 4053.81 tick leaves the window → wire passes.

**Wire fragility (UNSURE).** `rejOrderAtWire` (2231) finds the book only if the live-book-done record's `side` equals the order side. This call's record was a long until 01:16:02. If the record had not yet flipped to "down" when the order reached the wire, the wire judged it with **no book flags** (no flipRule, no zoneGuard). Snapshot data can't settle this.

**Other walls in today's logs:**
- RED ZONE OVER A BAND fired about 200 times on the long (works).
- HELD 3s fired 6 times (works, but too short).
- DOJI AFTER THE TREND blocked recon-rej BTC 10 times today: 21:55-21:56Z (5 shorts), 22:56Z, 23:03-23:04Z (longs).
- Settlement for 21:30 is not in window-results.json yet; the window was still open at snapshot time.

## 4. Rules from fixes 295-315 (rolled back by fix316) and other diary rules not in current code, for recon-rej
fix316's diary line (Love 4:51 AM Oct 27): "you're gonna put this model back where she was before fix295 precisely nothing else" + "keep all of these on file ... add back in at a moments notice".

| Fix | Love's words (diary) | In current code? |
|---|---|---|
| fix295/299/300 EARN THE COLOUR (first 30 s of a 5m candle needs gold 10c / BTC $2 past the open) | "if it was cents causing her decisions on fresh candles like that let's just make it the bare minimum" | **NO.** Removed by Love's rollback words. The same gap now applies to 2m/4m candles of any age (tonight's trade) |
| fix296 BTC no shorts under -2σ | "let's cut shorts in the bottom wrung" | YES (2413) |
| fix297 zones rejection only | "green zone ... rejection only for gold" | YES (recon.ts 341) |
| fix298 BTC pink $25 at ≤$100, else max($50, 10%) | "btc is $50 at band widths of $180+ ..." | YES (2380, 2500) |
| fix310 gold zone clearance $3 | "we can make that $3 hun" | In code, but **skipped for recon-rej** (`!rejNoAhead`, 2463/2469) by fix317, with Love's words |
| **fix315 DOJI: the candle AFTER the doji decides** | 3:57 AM Oct 27: "it is SHORT ONLY when a doji is followed by a candle falling ... the literal opposite of what you just said" | **NO.** Current 2725-2730 still trades **the doji's own colour** (fix104), which Love called "the literal opposite". The pre-rollback version is in `data/SNAPSHOT-TODAY-2026-10-27-0457am/src/lib/desk/bandlock.ts:2581-2582`. **For recon-rej specifically, Love said at fix319 (6:23 AM Oct 27): "dude doji is inconsequential ... NOTHING. else."** Yet the doji wall still judges recon-rej, with no book guard (denials today at 21:55Z, 22:56Z, 23:04Z). The coordinator's figure of 700+ blocks after 01:30Z is past the end of this snapshot (01:17Z) and could not be checked |
| fix302 / 306-309 / 311 / 312 / 314 | copy / twin only | not recon-rej |

**Diary rules with no request-book entry that are weakened in code for recon-rej:**
- fix271 30c HER CANDLE stickiness ("a 4 cent rise cannot count as rising"). Zeroed by flipRule (2783), with no R entry recording its retirement for this book.
- fix319 "steep slope can stay. pitched over 45 degrees. not a small tilt". The code trips at a VWAP move of more than 1/2 sigma in 15 min (~2735-2745). Whether that equals "45 degrees" is UNSURE.
- Oct 17 SESSION BAND AHEAD (fix413 brought it back, R103) is narrower than her words (section 1, row 6).

## 5. Verdict list

**INTACT** (in code, with today's evidence where available)
- THE IMPOSSIBILITY / ONLY IN HER THIRD at 33% (BTC ≤$500, fix379/414 at 2435); gold 33% under $10 (lockPctFor 183). Tonight's wire-pass shows lock 0.33.
- RED ZONE OVER A BAND (fix242): about 200 denials on the 6:16 PM window's long.
- fix377/378 zone walls, fix376 $10 clearance, gold PINK TO RED / GREEN 55% (2582), BTC zoneGuard 40%.
- Blue VWAP walls at the wire (2259-2271), THE SEAL, BTC bottom rung (2413), thirdsMove at door and wire.
- fix411 HELD 3s exists and fired (6 denials at 01:16:02-04Z), but see below.

**MISSING-OR-WEAKENED** (with a proposed restoring fix; each needs Love's word, one book at a time)
1. **HER FLIP accepts a candle seconds old with the bigger candles against her** (6:16 PM short).
   - Fix at `bandlock.ts:1203-1216` (`anyFlipMinNow`), and at 1172 for the anyFlipNow callers:
     - skip any frame whose candle is under 30 s old (restores fix300 "fresh candles");
     - **or** refuse when the live 5m candle is green by 10c+ for a short (red for a long), which brings back HER CANDLE's sense for flipRule books.
   - Simplest: at `bandlock.ts:2783`, stop zeroing `cdl` for `flipRule` when `rejNoAhead`, or keep fix271's 30c check.
2. **DOJI wall still judges recon-rej, and uses the doji's own colour** (Love: "inconsequential" for this book; fix315 direction).
   - Fix at `bandlock.ts:2729-2730`: add `!rejNoAhead` to the guard. For the other books, restore fix315's `dS` from `fiveOpenNow` (snapshot line 2581).
3. **fix411 HELD 3s covers only impossibleGeo, only at the door, and only 3 s.**
   - Fix at `bandlock.ts:719`: also run `channelOnly` / `candleDirOnly` / `thirdsMove` at `w411`.
   - Fix in `wireWall` at 2277+: add the same 3-s worst-price `impossibleGeo` and `sessionAheadWait` for recon-rej / tog / togp.
4. **fix413 SESSION AHEAD is narrow** (pink must be the single nearest line). Love: "STRICT BAND TOLERANCE".
   - Fix at `bandlock.ts:1723`: drop the `near.name === "5m PP"` precondition, or require only that a pink was broken this or last candle. Also call it in `wireWall`.
5. **`foTurn` waives Cornerstone #1 for recon-rej**, and brings back a 1m-close entry after fix406.
   - Fix at `bandlock.ts:2783-2784`: drop `!foTurn` (as fix366 did for the copy). Also `!(foTurn && asset !== "btc")` at 2524.
6. **Wire book detection depends on the record's side** (`rejOrderAtWire` 2231-2237, `bookOrderAtWire` 2224). A re-aimed call can reach the wire with generic flags.
   - Fix: match on `t + ":recon-rej:"` regardless of side, or pass the book explicitly from `kalshi-live.server.ts:90-94`.
7. **fix409 wall text is stale** (2568 says "top 50%", 2582 says 60%). Logs mislead audits. Fix the messages to 55%.
8. **Second add-on skips entry walls** despite "same entry logic" (engine.ts 2264-2300; currently off).
   - Before re-enabling, gate it with `bandLockCheck(own2, ...)`.

**UNSURE**
- Gold recon-rej still allows 20% via fix219 when the channel is within one fresh sigma (`bandlock.ts:180`). This conflicts with fix414's "HARD no on 20% at this band width" and R005 (gold 33% under $10), but matches R035 ("Main + rejection keep fix219"). Love must say which wins.
- Whether the 6:16 PM wire check ran with recon-rej flags (record side at that instant).
- Whether 3m/5m were literally under their open by more than 10c at 01:16:04.661Z. The evidence says no (3m/5m open about 4053.63 against tick 4053.618/4053.497), but pivBars opens are not in the snapshot.
- Steep slope "45 degrees" against the 1/2-sigma-in-15-min threshold.
- The 700+ doji blocks after 01:30Z (outside the snapshot).
