# Paper-book audit: recon-sov, recon-b2, recon-og

Snapshot: /tmp/claude-0/repo @ f47cd6d (after fix414). I only read files. The analysis script and its extracts are in this scratchpad (chk.py, bl.jsonl).
Install times come from data/overnight-fixes.log:
- fix401 gate: 23:00Z (4:00 PM PT)
- fix404 (b2): 23:30Z
- fix406/407/408 (no 1m, $5/10c flip, og): 00:30Z
- fix414 (33% back): 01:15Z on Oct 29

## 0. How these books are guarded (code path)

A call books through `book()` in recon.ts. Two layers of checks apply:

1. **The fix401 gate** at recon.ts:435-451. It covers all three lanes.
   - `anyFlip2Now` (recon.ts:439). This checks a 2/3/4/5m candle past its open. It has no minimum (bandlock.ts:1188).
   - Then, **only if `__lawBands` is fresh (≤15 s)** (recon.ts:440), `impossibleGeo(..., noBBTarget=true, zoneGuard = sov 0.4 / b2,og 0.5, flipRule=true, npPink=false)` (recon.ts:441). This is the same argument set main (recon-tog) gets at the door and in the paper filter.
   - With flipRule on, impossibleGeo applies:
     - THE IMPOSSIBILITY at 33% on BTC up to $500 wide (bandlock.ts:2435; fix414 removed the 20%);
     - gold lockPctFor;
     - pink-to-green/red;
     - gold zone $1.50;
     - PINK 10%;
     - Bollinger cushions;
     - HER FLIP 2-5m;
     - the fix407 $5/10c minimum (bandlock.ts:2783-2784).
   - Then the blue-VWAP half-width check while bands are small (recon.ts:442-444).
   - Refusals go to data/pure-walls.jsonl.
2. **paperBandFilter "RECON" branch** (bandlock.ts:1110-1121), applied when pivotbooks writes grok-og.json. It runs:
   - impossibleGeo with default args (no flipRule, so HER CANDLE 5m and 33c pink-break apply);
   - channelOnly, candleDirOnly, reconZoneGate, reconThirdAgainst, thirdWallAbsolute.

These books do **not** go through `bandLockCheck` (the live door, bandlock.ts:694-750) or the Kalshi wire wall. Those only see live orders. sovLive.on=false in data/live-switch.json, so recon-sov is paper only right now.

## 1. Love's entry rules vs code

| Rule (Love's words / request) | sov | b2 | og |
|---|---|---|---|
| 2/3/4/5m flip her way, no 1m (R090 fix401 "the 2,3,4&5M candle flips"; R096 fix406) | INTACT at the gate (recon.ts:439). sov's candidate also needs anyFlipNow (recon.ts:685) | INTACT (gate only) | INTACT (gate only) |
| Flip ≥$5 BTC / 10c gold (rulebook #1, fix407 "every flipRule book ... paper pure/sov/own-eyes/2nd-band") | WEAKENED: enforced only inside impossibleGeo, so it is skipped when lawBands are stale (recon.ts:440) | same | same. R098 says "same guard", and og came after fix407 but rides the same gate |
| 33/20% thirds = THE IMPOSSIBILITY (cornerstone #2/#4; fix379; fix414 "HARD no on 20%") | INTACT in current code (flipRule gives 0.33 on BTC up to $500). Gold uses lockPctFor, where fix219 can still return 20% (bandlock.ts:178). Main has the same exposure, so UNSURE | same | same |
| "Same band tolerances as our other models" (R090) / "definitely give them the same guard" (R098) | PARTIAL: matches main's impossibleGeo args exactly. It is missing main's later door walls (next two rows) | PARTIAL | PARTIAL |
| Same side of the break, HELD 3s (R101 fix411 "she cannot trade without price being on the same side of the break ... pls reinforce everything") | MISSING. The fix411 re-check runs only for recon-tog/rej/togp at the live door (bandlock.ts:717-722). The gate judges one tick | MISSING | MISSING |
| Session band ahead of pink = wait (R103 fix413 "IT IS A STRICT BAND TOLERANCE") | MISSING (bandlock.ts:727 covers main/rej/copy only) | MISSING | MISSING |
| Candle rising from the bottom third = long, falling from the top third = short (rulebook l.49; door `thirdsMove` bandlock.ts:2327) | Only the paper filter's reconThirdAgainst checks this, and it is defeated by the bypass in section 2 | same (proven case: 00:35Z) | same |
| No trading into an unbroken band / blue VWAP while small (fix397) | INTACT at the gate (recon.ts:442-444) for σ/VWAP. The cross-blue-VWAP-to-target wall (fix399 wire) is not applied. It was scoped to Kalshi books, so I don't treat it as a violation | same | same |

## 2. The biggest finding: the paper filter's refusals never stick (MISSING)

- **Where it breaks:**
  - bandlock.ts:1118: when a RECON row is refused, the code does `seen.set(id, side)` and drops the row.
  - bandlock.ts:1109: any row whose `seen.get(id) === side` is passed through **without any check**.
  - pivotBooksTick writes the same in-memory `rows` array twice in one tick: pivotbooks.ts:1768, then pivotbooks.ts:1829 (`changed` stays true).
  - So the first write refuses and drops the row, and the second write puts it back unchecked.
  - The same pattern was already in the KNOWN-GOOD save (bandlock.ts:1098 there). It is old, not new tonight.
- **Proof:**
  - Since 18:30Z (the oldest row still in grok-og.json; the archive is not in the snapshot), every one of the band-lock.jsonl `"paper":"recon"` refusals for these three lanes has its row still in grok-og.json. None of them were removed.
  - That covers **32 of the 59 rows** these books hold.
  - In each case the row's `at` is 40-150 ms before the refusal. It is the same row, not a re-book.
- **Rows booked after fix401 that the filter refused but kept:**

| Time | Book | Call | Refusal | Result |
|---|---|---|---|---|
| 23:12:04Z | sov | BTC long (re-aim) | HER CANDLE 5m falling | sold +9.61 |
| 23:16:59Z | sov | gold short | PINK 10% (within 33c of pink) | sold +11.05 |
| 23:46:56Z | sov | BTC short | HER CANDLE rising | -4.58 |
| 23:51:03Z | b2 | BTC long | HER CANDLE falling | sold +45.31 |
| 00:18:03Z | b2 | long | HER CANDLE falling | -20.92 |
| 00:20:01Z | sov | long | HER CANDLE falling | -21.07 |
| **00:35:12Z** | **b2** | **long** | **"price is falling from the top third of her channel"** (Love's thirds-move rule) | **-21.07** |
| 00:47:20Z | sov | long | HER CANDLE falling | -20.75 |
| 00:49:21Z | og | long | HER CANDLE falling | -20.76 |
| 00:56:17Z | b2 | long | HER CANDLE falling | -21.29 |
| 01:00:35Z | sov | gold long | PINK 10% | sold +12.15 |
| 01:03:04Z | og | long | HER CANDLE falling | -21.01 |
| 01:06:01Z | b2 | long | HER CANDLE falling | -21.17 |
| 01:15:26Z | sov | long | HER CANDLE falling | open |
| 01:16:02Z | sov | gold short | HER CANDLE rising | open |
| 01:16:02Z | og | gold short | HER CANDLE rising | open |

- **Caveat, stated honestly:** HER CANDLE (5m colour) is not part of main's current rule, because fix325 replaced it with the 1-5m flip for flipRule books. Many of these refusals are stricter than Love's rulebook. The 00:35Z thirds-move refusal and the PINK refusals are real rules being bypassed.
- **Fix:** bandlock.ts:1118. Do not mark a refused row as seen, or record refusals in a separate set (for example `G.__bandRefused.set(id, side)`) and drop on a match at line 1109.

## 3. Sampled behaviour against the gate rules (band-log.jsonl snapshots + 1m tick candles from latency-shadow.jsonl)

- **01:06:01Z b2 BTC long at 80915.30. Probable flip breach (UNSURE).**
  - Reconstructed opens: 2m/3m candles +$0.01, 4m -$26, 5m -$11. No candle is $5 green.
  - Two seconds later the gate itself logged "HER FLIP: no 2/3/4/5m candle is at least $5 past its open".
  - It passed in the first second of a new 2m/3m candle. In that second anyFlip* takes as the open the last trail tick from the previous 10 s (bandlock.ts:1179/1194). So a $5 bounce off a tick from seconds earlier counts as a "flip".
  - That is not the real candle flip (red to green) Love describes.
- **00:21:31Z sov gold long at 4042.32. Borderline.**
  - Price was about 4-15c above -2σ (4042.36 at 00:21:00, 4042.18 at 00:22:00), so it was a long on a cents-deep poke over the band.
  - fix411's 3-second hold, missing for these books, is exactly the wall for this case.
- **00:56:17Z b2 BTC long at 69% of fresh -3σ→-2σ ($71.7 wide), $22.56 under the unbroken -2σ.**
  - fix399's 20% allowed it at the time. Current code (fix414, 33%) would block it. No longer a code issue.
- The gate demonstrably refuses (pure-walls.jsonl). For these lanes it logged:
  - 379 IMPOSSIBILITY refusals;
  - 15 "no 2/3/4/5m flip" refusals and 15 "$5/10c" refusals;
  - pink-to-green, zone and Bollinger refusals.
- No "can't verify" refusals were seen for these lanes, so the stale-band hole at recon.ts:440 was not hit in this sample.

## 4. Bottom line

- **MISSING: the paper wall layer is defeated.**
  - Where: bandlock.ts:1109 + 1118 with pivotbooks.ts:1768/1829.
  - Effect: 100% of filter refusals on sov/b2/og were kept (32/59 rows).
  - Fix: at bandlock.ts:1118, do not `seen.set` on a refusal. Keep a separate refused map and keep dropping.
- **MISSING: fix411 HELD 3s / same side of the break for sov/b2/og.**
  - Fix: in recon.ts after line 441, re-run the same impossibleGeo at the least-favourable trail price of the last 3 s. Copy bandlock.ts:717-722.
- **MISSING: fix413 SESSION BAND AHEAD for sov/b2/og.**
  - Fix: in recon.ts after line 444, `if (!why401) why401 = sessionAheadWait(id, L401, spot, sd401)` (export from bandlock.ts:1720).
- **WEAKENED: fail-open gate.**
  - With stale `__lawBands` (recon.ts:440), or any exception (the try/catch at recon.ts:437-445 leaves `why401=""`), the book goes ahead with only a bare, minimum-free `anyFlip2Now`. The filter's "can't verify" refusal is then bypassed by the bug above.
  - Fix: set `why401 = "can't verify (band list not fresh)"` in an else branch at recon.ts:440, and in the catch.
- **WEAKENED / UNSURE: the flip at candle open.**
  - anyFlip2Now/anyFlipMinNow (bandlock.ts:1173-1199) take the open of a just-started candle from the previous ~10 s of trail. Example: 01:06:01Z b2.
  - Also, "flip" is "price past the open" (literal colour, per rulebook #1). A candle that was never the other colour counts. That matches the rulebook, not Love's "green→red" wording. **Ask Love** which she means.
- **INTACT:**
  - 2-5m flip present at the gate;
  - THE IMPOSSIBILITY at 33% for BTC up to $500 (bandlock.ts:2435) with main's exact arguments;
  - pink-to-green/red, gold zone, PINK 10%, Bollinger;
  - blue VWAP half-width.
- **UNSURE:**
  - gold fix219 20% (bandlock.ts:178) still possible for these books and for main;
  - sov's "1m rejection off X" setups (a 1m trigger, but the flip itself is 2-5m).
