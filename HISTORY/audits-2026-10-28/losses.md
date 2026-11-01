# Aurelius live Kalshi losses, Oct 28 2026 (PT): an independent audit

Scope: every live Kalshi position the bot opened from 2026-10-28T07:00Z to 2026-10-29T01:20Z (12:00 AM to 6:20 PM PT). Read-only audit of the git snapshot at /tmp/claude-0/repo (HEAD f47cd6d). Nothing in the repo was changed.

## Headline

- **The bot opened 95 positions. 94 settled and 1 was still open** (18:16 gold short, recon-rej). The 94 settled positions netted **-$31.07**: 43 losers (-$474.60) and 51 winners (+$443.53). If you count only the opening order and ignore add-ons and exits, the same 94 netted -$64.05, and the 43 losers lost -$216.38 on their entries.
- The account's total P&L for the whole window, Love's own hand trades included, is **+$10.50**. Love's hand trades were about +$41.6 net. That figure is the account total minus the bot total. Her trades are identified from data/hand-trail.jsonl.
- Of the 43 losing positions, **9 broke a rule Love had already set, for a loss of -$130.20** (-$63.54 on the entries alone). 9 more passed a wall by a single tick (-$93.62). That was legal by the code as it stood, and it is what fix411 (6:15 PM) now blocks. 12 were delayed-twin trades that her twin freedoms allow (-$88.53). 13 broke no rule I could prove (-$162.25).
- The largest single cause: **a 30-cent dead zone around even $10 gold levels**. It cost 5 trades and -$67.39. Love's fix376 says "waits until price is at least $1.50 clear of the level". The code skips the check entirely when price is within 30c of the level, which is the least clear position there is.

## Method and conventions (verified, not taken from comments)

- Fills come from data/kalshi-audit.json, plus data/kalshi-history.json for the early part of the day, de-duplicated. Settlement comes from data/window-results.json, cross-checked against the audit `settlements` counts.
- **Fill convention, checked against `liveTradesOrNull()` in src/lib/desk/riskguard.ts and against the orders list.** A long is `buy|yes` at the yes price. A short is `sell|no`: its order is "sell yes" and it pays 1-y per contract. Live-fires `paid` equals the `no` field of these fills, for example 01:16:04 paid 0.59 when yes was 0.41. `buy|no` is a NO bought at 1-y. Exits show as the opposite side; settlement shows both yesCount and noCount (for example 8.21/8.21 = flat). Under riskguard's formula, buy|yes is the same economically as sell|yes, and buy|no is the same as sell|no, so the P&L does not depend on which reading of `action` is used.
- Who sent each fill: the entry is matched to data/live-fires.json by order id, add-ons to data/addon-log.jsonl by order id, and Love's hand trades to data/hand-trail.jsonl by timestamp. The remaining fills are exits, take-profits and partial re-sends, and they are counted with the bot's position. Lane comes from data/live-book-done.json (plus the archive). Every live-fire row has book "other", so it cannot be used for the lane.
- Rule geometry: wall refusals come from data/band-lock.jsonl (the code's own reading, to the millisecond). Wire refusals and the call chain come from data/order-trail.jsonl. The channel the wire saw at each fill comes from data/wire-pass.jsonl. Band, pivot and Bollinger lines come from data/band-log.jsonl (one snapshot a minute). Candle colour uses the chart snapshot stored in each live-fire (`nav.live1m.c` against `nav.close5m`, the open of the current 5m candle).
- Rules are taken from LOVE-RULEBOOK.md, data/LOVE-REQUESTS.jsonl and data/overnight-fixes.log, and only rules dated before each trade count. Times are PT (UTC-7).
- Verdicts: **R** = broke a rule that existed at the time, with proof. **F** = a wall was refusing it within about 1 s and a single tick moved it across the line. That was legal by the letter, and Love's rulebook says "breaks count when they happen". fix411 at 6:15 PM now requires every wall to hold for 3 s. **T** = delayed-twin freedom granted in Love's words. **N** = no broken rule I could prove.
- Caveat on candles: the desk's quote feed and the chart feed differ by $10-40 on BTC. A candle colour counts as proof only where every 1-5m candle shared one open (fills in the first minute after a :00 boundary) and the chart and the code agree.

## 1. Every live position opened Oct 28 PT

`recon-togp*` = the 10:25 AM BTC short. live-book-done marks it "blocked/already", but it filled through the normal enterLive path at 17:25:31Z.

| # | Time PT | Asset | Side | Lane | Entry (her side) | Entry $ | Settled | Position P&L (entry+add-ons+exits) | Entry alone, held | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 00:02 | btc | long | recon-togp | 0.61 | 4.84 | yes | +2.48 | +3.07 | win |
| 2 | 00:03 | gold | long | recon-togp | 0.57 | 5.08 | yes | +3.05 | +3.68 | win |
| 3 | 00:15 | gold | short | recon-togp | 0.5 | 5.66 | yes | -14.02 | -5.86 | N |
| 4 | 00:30 | gold | long | recon-togp | 0.58 | 4.9 | yes | +15.75 | +3.40 | win |
| 5 | 01:01 | btc | long | recon-togp | 0.69 | 5 | yes | +1.93 | +2.14 | win |
| 6 | 01:01 | gold | short | recon-togp | 0.5 | 4.68 | yes | -13.55 | -4.85 | N |
| 7 | 01:21 | btc | short | recon-togp | 0.28 | 5.18 | yes | -14.60 | -5.44 | F |
| 8 | 01:30 | gold | short | recon-togp | 0.55 | 4.71 | yes | -12.53 | -4.86 | R |
| 9 | 01:45 | gold | short | recon-togp | 0.54 | 4.91 | no | +21.06 | +4.02 | win |
| 10 | 02:00 | gold | short | recon-togp | 0.55 | 4.71 | no | +11.52 | +3.71 | win |
| 11 | 02:01 | btc | short | recon-togp | 0.57 | 4.88 | yes | -15.67 | -5.17 | F |
| 12 | 02:16 | btc | short | recon-togp | 0.6 | 5 | no | +2.82 | +3.19 | win |
| 13 | 02:30 | btc | long | recon-togp | 0.53 | 4.89 | yes | +34.83 | +4.28 | win |
| 14 | 02:31 | gold | long | recon-togp | 0.62 | 5 | yes | +2.53 | +2.93 | win |
| 15 | 02:45 | btc | long | recon-togp | 0.56 | 5 | yes | +29.50 | +3.77 | win |
| 16 | 02:48 | gold | short | recon-togp | 0.71 | 5 | yes | -3.48 | -5.10 | N |
| 17 | 03:00 | btc | long | recon-togp | 0.54 | 5.4 | no | -15.95 | -5.57 | R |
| 18 | 03:15 | btc | long | recon-togp | 0.66 | 5.79 | yes | +2.62 | +2.84 | win |
| 19 | 03:30 | btc | long | recon-togp | 0.53 | 5.09 | yes | +20.27 | +4.35 | win |
| 20 | 03:41 | gold | short | recon-togp | 0.37 | 5.55 | yes | -15.98 | -5.79 | N |
| 21 | 03:45 | btc | long | recon-togp | 0.65 | 5 | no | -12.52 | -5.12 | N |
| 22 | 03:45 | gold | short | recon-togp | 0.56 | 5.17 | no | +3.45 | +3.90 | win |
| 23 | 04:02 | gold | long | recon-dly | 0.24 | 2.4 | yes | +18.81 | +7.07 | win |
| 24 | 04:05 | btc | long | recon-dly | 0.18 | 2.04 | no | -7.80 | -2.64 | T |
| 25 | 04:17 | gold | long | recon-dly | 0.28 | 2.5 | yes | +17.02 | +6.30 | win |
| 26 | 04:22 | btc | short | recon-dly | 0.24 | 2.61 | yes | -7.66 | -2.75 | T |
| 27 | 04:31 | gold | short | recon-dly | 0.48 | 2.5 | yes | -7.80 | -2.59 | T |
| 28 | 04:33 | btc | short | recon-dly | 0.28 | 2.59 | no | +6.15 | +6.53 | win |
| 29 | 04:48 | gold | long | recon-dly | 0.39 | 1.95 | no | -7.87 | -2.49 | T |
| 30 | 04:48 | btc | short | recon-dly | 0.5 | 2.5 | no | +2.19 | +2.41 | win |
| 31 | 05:00 | btc | long | recon-dly | 0.41 | 2.56 | no | -7.95 | -2.67 | T |
| 32 | 05:03 | gold | short | recon-dly | 0.45 | 2.56 | yes | -7.92 | -2.65 | T |
| 33 | 05:15 | btc | short | recon-dly | 0.4561 | 2.33 | no | +2.78 | +2.89 | win |
| 34 | 05:18 | gold | short | recon-dly | 0.21 | 2.02 | yes | -7.91 | -2.54 | T |
| 35 | 05:32 | btc | long | recon-dly | 0.26 | 2.5 | no | -7.85 | -2.63 | T |
| 36 | 05:41 | gold | long | recon-dly | 0.067 | 2.5 | no | -2.66 | -2.66 | T |
| 37 | 06:01 | gold | short | recon-dly | 0.23 | 2.39 | yes | -7.89 | -2.52 | T |
| 38 | 06:04 | btc | short | recon-dly | 0.39 | 2.22 | no | +3.48 | +3.73 | win |
| 39 | 06:15 | btc | short | recon-dly | 0.41 | 2.5 | no | +3.21 | +3.49 | win |
| 40 | 06:30 | btc | short | recon-dly | 0.28 | 1.94 | yes | -7.86 | -2.61 | T |
| 41 | 06:31 | gold | long | recon-dly | 0.26 | 2.1 | no | -7.36 | -2.20 | T |
| 42 | 07:00 | btc | short | recon-togp | 0.61 | 5.15 | no | +19.23 | +3.15 | win |
| 43 | 07:03 | gold | long | recon-togp | 0.51 | 5.27 | no | -15.78 | -5.45 | R |
| 44 | 07:15 | gold | short | recon-togp | 0.53 | 5.48 | no | +4.15 | +4.68 | win |
| 45 | 07:15 | btc | short | recon-togp | 0.64 | 5.61 | no | +2.53 | +3.02 | win |
| 46 | 07:30 | gold | long | recon-togp | 0.54 | 5.4 | no | -3.98 | -5.57 | F |
| 47 | 07:30 | btc | long | recon-togp | 0.7 | 5.07 | yes | +17.94 | +2.07 | win |
| 48 | 07:45 | btc | long | recon-togp | 0.57 | 5.08 | yes | +16.08 | +3.68 | win |
| 49 | 07:48 | gold | long | recon-togp | 0.72 | 5.14 | yes | +1.74 | +1.90 | win |
| 50 | 08:00 | gold | long | recon-togp | 0.69 | 4.66 | yes | +1.72 | +1.99 | win |
| 51 | 08:34 | gold | long | recon-togp | 0.5 | 5.43 | yes | +3.80 | +5.24 | win |
| 52 | 08:46 | gold | short | recon-togp | 0.71 | 5.3 | no | +1.67 | +2.06 | win |
| 53 | 09:00 | btc | short | recon-tog | 0.5 | 4.17 | yes | -5.16 | -4.31 | N |
| 54 | 09:15 | btc | short | recon-tog | 0.62 | 4.69 | no | +2.41 | +2.75 | win |
| 55 | 09:30 | btc | long | recon-tog | 0.57 | 4.07 | no | -11.68 | -5.12 | N |
| 56 | 09:47 | btc | long | recon-tog | 0.58 | 4.08 | yes | +3.31 | +3.47 | win |
| 57 | 10:00 | btc | short | recon-togp | 0.68 | 4.79 | no | +1.97 | +2.23 | win |
| 58 | 10:01 | gold | long | recon-tog | 0.5 | 4.63 | no | -4.79 | -4.79 | F |
| 59 | 10:16 | gold | long | recon-tog | 0.56 | 4.24 | no | -15.59 | -5.17 | N |
| 60 | 10:25 | btc | short | recon-togp* | 0.017 | 2.04 | yes | -2.18 | -2.18 | F |
| 61 | 10:31 | gold | long | recon-tog | 0.71 | 4.73 | no | -4.82 | -4.82 | R |
| 62 | 10:37 | btc | short | recon-np | 0.11 | 2.2 | yes | -7.68 | -2.34 | N |
| 63 | 10:48 | gold | long | recon-tog | 0.64 | 4.44 | yes | +2.42 | +2.69 | win |
| 64 | 11:01 | gold | long | recon-tog | 0.56 | 4.31 | no | -15.68 | -4.44 | F |
| 65 | 11:20 | gold | short | recon-tog | 0.58 | 4.03 | yes | -11.97 | -4.14 | F |
| 66 | 11:30 | gold | long | recon-tog | 0.61 | 4.76 | yes | +20.78 | +2.92 | win |
| 67 | 11:31 | btc | short | recon-np | 0.46 | 2.34 | yes | -8.38 | -3.13 | N |
| 68 | 11:45 | btc | short | recon-np | 0.66 | 2.75 | no | +1.21 | +1.35 | win |
| 69 | 11:45 | btc | short | recon-tog | 0.66 | 2.75 | no | +3.27 | +3.13 | win |
| 70 | 12:00 | gold | long | recon-tog | 0.47 | 10 | yes | +9.27 | +10.90 | win |
| 71 | 12:15 | gold | long | recon-tog | 0.52 | 8.52 | yes | +19.73 | +8.94 | win |
| 72 | 12:30 | btc | short | recon-np | 0.47 | 9.4 | yes | -18.58 | -9.75 | N |
| 73 | 12:30 | gold | short | recon-tog | 0.5 | 8.47 | yes | +24.44 | -8.77 | win |
| 74 | 12:47 | gold | short | recon-tog | 0.51 | 8.64 | yes | -19.41 | -8.94 | R |
| 75 | 13:07 | btc | short | recon-np | 0.63 | 8.74 | no | +0.97 | +4.91 | win |
| 76 | 13:15 | gold | long | recon-tog | 0.52 | 9.28 | no | -14.85 | -9.59 | R |
| 77 | 13:15 | btc | long | recon-np | 0.44 | 9.17 | no | -14.74 | -9.52 | N |
| 78 | 13:50 | btc | short | recon-np | 0.57 | 8.5 | yes | -14.34 | -8.76 | F |
| 79 | 14:05 | btc | short | recon-np | 0.36 | 8.37 | yes | +19.60 | -8.74 | win |
| 80 | 14:17 | btc | short | recon-np | 0.49 | 9.07 | no | +8.24 | +9.12 | win |
| 81 | 14:36 | btc | short | recon-np | 0.42 | 8.57 | yes | +14.59 | -8.92 | win |
| 82 | 14:45 | btc | long | recon-np | 0.67 | 9.3 | yes | +2.32 | +4.37 | win |
| 83 | 15:00 | btc | short | recon-np | 0.5757 | 7.99 | no | +5.18 | +5.65 | win |
| 84 | 15:16 | btc | long | recon-np | 0.35 | 8.33 | no | -20.80 | -8.71 | R |
| 85 | 15:31 | btc | long | recon-togp | 0.66 | 11 | yes | +3.46 | +5.40 | win |
| 86 | 15:40 | gold | long | recon-tog | 0.6 | 9.67 | no | +3.96 | -9.94 | win |
| 87 | 15:45 | btc | long | recon-togp | 0.55 | 10.15 | no | -20.89 | -10.47 | N |
| 88 | 15:54 | gold | long | recon-tog | 0.37 | 8.6 | no | -15.70 | -10.46 | R |
| 89 | 16:45 | gold | long | recon-togp | 0.61 | 5.86 | yes | +3.07 | +3.59 | win |
| 90 | 16:45 | btc | long | recon-togp | 0.48 | 4.61 | yes | +13.85 | +5.22 | win |
| 91 | 17:00 | gold | short | recon-togp | 0.6 | 5.66 | no | +3.03 | +3.61 | win |
| 92 | 17:01 | btc | long | recon-togp | 0.6 | 5 | no | -10.36 | -5.14 | R |
| 93 | 17:31 | btc | short | recon-togp | 0.64 | 5.52 | no | +2.14 | +2.96 | win |
| 94 | 17:50 | btc | long | recon-togp | 0.47 | 4.7 | no | -10.41 | -4.87 | F |
| 95 | 18:16 | gold | short | recon-rej | 0.59 | 5 | open |  |  | open |
## 2. Every losing position checked against Love's rules

| Time PT | Asset/side | Lane | P&L | Verdict | Evidence | Code path / fix |
|---|---|---|---|---|---|---|
| 00:15 | gold short | recon-togp | -14.02 | **N** |  |  |
| 01:01 | gold short | recon-togp | -13.55 | **N** |  |  |
| 01:21 | btc short | recon-togp | -14.60 | **F** | THE IMPOSSIBILITY refused 0.57 s before; filled at 35.6% vs 33% line |  |
| 01:30 | gold short | recon-togp | -12.53 | **R** | $10 LEVEL into-wall: short 19c over 4050, target 4050.69 within $1 of 4050 (fix217/232); also PINK 10% cleared by 15c | 30c dead zone in THE $10 LEVEL (since fix217) |
| 02:01 | btc short | recon-togp | -15.67 | **F** | wire refused HER CANDLE 1.24 s before; feeds disagree on the 5m colour |  |
| 02:48 | gold short | recon-togp | -3.48 | **N** |  |  |
| 03:00 | btc long | recon-togp | -15.95 | **R** | HER FLIP (Cornerstone #1, copy since fix349/R033, $5 min fix359/R044): fill 32 s after 3:00 AM, every 1-5m candle opened at 81463.36; chart showed all red by $15.92; quote tick only +$4.98 | wireWall never checks the copy flip (flipRule only for recon-tog/rej/np); door anyFlipMinNow passed |
| 03:41 | gold short | recon-togp | -15.98 | **N** | flip came from the 1m (allowed until fix406) |  |
| 03:45 | btc long | recon-togp | -12.52 | **N** |  |  |
| 04:05 | btc long | recon-dly | -7.80 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 04:22 | btc short | recon-dly | -7.66 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 04:31 | gold short | recon-dly | -7.80 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 04:48 | gold long | recon-dly | -7.87 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 05:00 | btc long | recon-dly | -7.95 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 05:03 | gold short | recon-dly | -7.92 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 05:18 | gold short | recon-dly | -7.91 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 05:32 | btc long | recon-dly | -7.85 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 05:41 | gold long | recon-dly | -2.66 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 06:01 | gold short | recon-dly | -7.89 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 06:30 | btc short | recon-dly | -7.86 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 06:31 | gold long | recon-dly | -7.36 | **T** | delayed twin: wall refusals waived by her twin freedoms (pink fix272, candle Oct 21, target/zones fix307); thirds passed |  |
| 07:03 | gold long | recon-togp | -15.78 | **R** | CLEAR OF THE $10 LEVEL (fix376/R062, "at least $1.50 clear"): long 24c over 4050 | 30c floor in fix376 (abs(d)>=0.3) |
| 07:30 | gold long | recon-togp | -3.98 | **F** | HER FLIP refused 0.58 s before; BB-in-target wall cleared by 20c |  |
| 09:00 | btc short | recon-tog | -5.16 | **N** |  |  |
| 09:30 | btc long | recon-tog | -11.68 | **N** |  |  |
| 10:01 | gold long | recon-tog | -4.79 | **F** | wire refused HER CANDLE 0.19 s before; quote tick 10c over the 5m open |  |
| 10:16 | gold long | recon-tog | -15.59 | **N** | pink broken 34c, main counts 25c (fix338/R011) |  |
| 10:25 | btc short | recon-togp* | -2.18 | **F** | PINK 10% cleared by 34c ($50.34 vs $50); HER FLIP refused 1 s before |  |
| 10:31 | gold long | recon-tog | -4.82 | **R** | CLEAR OF THE $10 LEVEL (fix376/R062): long 7c over 4040 | 30c floor in fix376 |
| 10:37 | btc short | recon-np | -7.68 | **N** |  |  |
| 11:01 | gold long | recon-tog | -15.68 | **F** | four walls refused up to 1 s before; filled on a 2-second pop to 4042.01 |  |
| 11:20 | gold short | recon-tog | -11.97 | **F** | new 5m candle at 18:20:00 moved pivots and Bollinger; PINK TO GREEN cleared by ~1 pt |  |
| 11:31 | btc short | recon-np | -8.38 | **N** |  |  |
| 12:30 | btc short | recon-np | -18.58 | **N** | np pink rules at 12:30 (fix363/367: $25) allowed $43 over pink; the wire refusal was the generic wall |  |
| 12:47 | gold short | recon-tog | -19.41 | **R** | CLEAR OF THE $10 LEVEL (fix376/R062): short 28c under 4060; refused 0.45 s before at 38c | 30c floor in fix376 |
| 13:15 | gold long | recon-tog | -14.85 | **R** | CLEAR OF THE $10 LEVEL (fix376/R062): long 21c over 4070 (refused at 36c 0.3 s before) | 30c floor in fix376 |
| 13:15 | btc long | recon-np | -14.74 | **N** | thirds read; Love banned these for pure afterwards (fix391, 1:42 PM) |  |
| 13:50 | btc short | recon-np | -14.34 | **F** | PINK TO GREEN 40% cleared at ~42% in the first second of a new 5m candle; Love tightened to 50% after (fix392) |  |
| 15:16 | btc long | recon-np | -20.80 | **R** | red 5m candle that broke DOWN through pink 81208 (=short only) and was red by $51.66; longed on a 20-second-old 1m/2m/4m candle; Love flagged it 3:19 PM | pure no-pink own taps (fix395) on a 1-5m flip incl. 1m (removed for pure by fix401 4:00 PM) |
| 15:45 | btc long | recon-togp | -20.89 | **N** |  |  |
| 15:54 | gold long | recon-tog | -15.70 | **R** | gold slide under unbroken pink = no long until 25c break (fix371/R057; Love 4:04 PM: "that was already how we structured that downslope rule"); also cleared PINK 10% by 3c and the -1σ edge by 2c | fix371 built narrower than Love asked (30c touch + 30-min memory, released 3:34 PM) - diary 23:05Z/23:15Z; fixed by fix403 |
| 17:01 | btc long | recon-togp | -10.36 | **R** | long on a failed break: price $11.64 BACK UNDER the unbroken fresh +1σ (not on the same side of the break), at 80% of the channel (Love's 33% line) | fix399 20% share (Love said "HARD no on 20%" at 6:10 PM, fix414) + break label retried 8 times after the break failed |
| 17:50 | btc long | recon-togp | -10.41 | **F** | PINK $33 refused 0.99 s before; filled $6 over pink (break=$3); fix411 (6:15 PM) would block |  |
### The 9 rule-breaking losses, with proof

1. **3:00 AM BTC long, no-pink copy, -$15.95. Rule: HER FLIP** (Cornerstone #1; on the copy since fix349/R033, with the $5 minimum from fix359/R044). Filled at 10:00:32.99Z. 10:00 UTC is a multiple of 1, 2, 3, 4 and 5 minutes, so every 1-5m candle opened at the same price: 81463.36 on the chart. The chart price stored with the fill was 81447.44, so every candle was red by $15.92. The desk's quote tick was 81468.34, only +$4.98, which is still under the $5 minimum. The wire refused the identical order 0.19 s earlier with "HER CANDLE: the 5m candle is falling", and the resend passed (order-trail 10:00:32.790 refused, 10:00:32.991 accepted, same sendOrder < place < enterLive < copyLiveBook chain). How it got through: `wireWall` only passes `flipRule` for recon-tog, recon-rej and recon-np (bandlock.ts, the `impossibleGeo(...)` call in wireWall), so the copy's flip is never checked at the wire. Its door check (anyFlipMinNow) passed even though the chart showed no candle flipped. The known-good save from Oct 27 at 7:56 PM has the same wire list.
2. **1:30 AM gold short, copy, -$12.53. Rule: THE $10 LEVEL** (fix217/fix232: when the target is within $1 of an even $10, no short while price is over it). The target was 4050.69 and the fill was at 4050.19, 19c over 4050. The wall's code skips any price within 30c of the level ("price on the level (within 30c) is not judged", `Math.abs(tick - L10) >= 0.3`), so it never fired. The code had refused this exact trade with THE $10 LEVEL at 08:30:09-18Z. It also passed PINK 10% by 15c: refused 0.53 s earlier at "$2.00 over the unbroken pink", filled at $2.15. *The 30c carve-out is in the code from fix217, but Love's card text is not in the diary, so this one is "probable".*
3. **7:03 AM gold long, copy, -$15.78. Rule: CLEAR OF THE $10 LEVEL** (fix376/R062, Love 12:23 AM: "waits until price is at least $1.50 clear of the level first"). Refused 0.41 s earlier at "only $0.34 over 4050". Filled at 4050.24, 24c over the level. The code only checks 30c-$1.50 (`Math.abs(d376) >= 0.3 && < 1.5`), so 0-30c, the least clear position, passes.
4. **10:31 AM gold long, main, -$4.82. Same rule.** Refused 4 s earlier at "$0.34 over 4040". Filled at 4040.07, 7c over.
5. **12:47 PM gold short, main, -$19.41. Same rule.** Refused 0.45 s earlier at "only $0.38 under 4060". Filled at 4059.72, 28c under.
6. **1:15 PM gold long, main, -$14.85. Same rule.** THE $10 LEVEL (target 4069.03) and CLEAR OF THE $10 LEVEL ("$0.36 over 4070") refused it until 0.28 s before. Filled at 4070.21, 21c over 4070.
7. **3:16 PM BTC long, pure no-pink, -$20.80. Rule: the direction rules** ("Red candle that broke a band = short"; "Never long a candle falling through a band") plus her flip. The 5m candle opened at 81221.75 and broke DOWN through pink at 81208.20. The code itself refused: "this 5m candle broke DOWN through 5m PP ... band breaks down = trade down" (22:16:10-13Z), "price is falling from the top third ... that's a short, not a long", and "HER FLIP: no 1/2/3/4/5m candle is green" until 0.5 s before the fill. Filled at 81176 with the 5m red by $51.66. The only "flip" possible was a 1m, 2m or 4m candle born at 22:16:00, 20 s earlier. Love at 3:19 PM: "she longed btc on a falling red candle hun". How it got through: pure's own taps (fix395) accepted any 1-5m flip, 1m included. fix401 (4:00 PM) cut her to 2-5m, and fix398 took her off live.
8. **3:54 PM gold long, main, -$15.70. Rule: the gold slide-under-pink hold** (fix371/R057, Oct 27 10:15 PM, Love: "maybe in the event of this we should wait for a break"). Gold was sliding under the unbroken pink at 4055.40. The diary (23:05Z) shows the hold had "released 3:34 PM" because the code needed a 30c touch within 30 min. Love, 4:04 PM: "that was already how we structured that downslope rule hun / can you make sure everything stays when we make a rule?" The diary at 23:15Z admits "the 30c touch + 30 min memory built it narrower than that". fix403 fixed it at 4:15 PM. The fill also beat two walls by pennies at the same moment. PINK 10% had refused 748 times ("$1.81 under", last 1 s before), and the fill came at $2.03 under. THE IMPOSSIBILITY had refused ("long at 95% ... top 20%"), and the fill came 2c over the fresh -1σ (4053.37 vs 4053.35), which made the "Break above 5m S1" channel reset to pos 0.003.
9. **5:01 PM BTC long, no-pink copy, -$10.36. Rule: price on the same side of the break / no long into an unbroken band, and Love's 33%.** The label was "Break above fresh +1σ", but at the fill price (81274.12) was $11.64 BACK UNDER the unbroken fresh +1σ (81285.76). The wire logged the trade at 80% of the 81227.51 -> 81285.80 channel with lock 0.20. Under the 33% share (R005/R066, restored by fix414) the line is 67%, and 80% is refused. How it got through: fix399 (4:00 PM) cut THE IMPOSSIBILITY to 20% while bands were small, so 80% passed. Love asked for 20% at 3:24 PM, then at 6:10 PM said "if that let that long through that's a HARD no on 20% at this band width" (fix414). The break call was also retried 8 times after the break had failed (BOLLINGER CUSHION refused it 0.81 s before the fill).

### The 9 one-tick passes (F): legal by the letter, but what fix411 now stops

In each one a wall the lane respects had refused the same side within about 1 s, and the fill came on the first tick across: 1:21 AM (THE IMPOSSIBILITY at 35.6% vs 33%), 2:01 AM (wire HER CANDLE 1.24 s earlier), 7:30 AM, 10:01 AM (wire HER CANDLE 0.19 s earlier), 10:25 AM (PINK 10% at $50.34 vs $50), 11:01 AM (four walls, then a 2 s pop to 4042.01), 11:20 AM (a new 5m candle moved the pivots and Bollinger at 18:20:00), 1:50 PM (PINK TO GREEN cleared at about 42% vs 40%), and 5:50 PM (PINK $33 refused 0.99 s earlier, then filled $6 over the pink, where a break is $3). Total -$93.62. The rulebook says "Breaks count when they happen (no 1m close wait)", so I do not count these as broken rules. Love's 5:56 PM words ("she needs to be ON the side of the break ... this is veryyyy old news") show she reads them as breaks. fix411 (6:15 PM, HELD ON HER SIDE: every wall must pass at the least-favourable price of the last 3 s) would have blocked every one of them.

### A mechanism behind many of these: refused at the wire, then accepted 0.2-1.2 s later

In 13 losing trades the wire refused an order and accepted the identical body (same price and count) less than 1.3 s later (order-trail.jsonl). `wireWall` chooses which walls apply by looking up the lane's live-book-done row (`tpOrderAtWire`, `bookOrderAtWire`, `dlyOrderAtWire`). On the first try it judges with the generic walls. On the resend it applies the lane's own flags: the twin's freedoms (`dlyFree` -> `dlyThirds` only), main's 25c gold pink break (fix338), or the copy without the wire flip check. It also re-reads a moved tick. `dlyFree` keys off any non-final recon-dly row for the same ticker and side. That row exists while the twin waits out its 30 s or for its second band touch (fix355/fix356). So I flag this as a risk: another book's order in that wait could be judged with the twin's freedoms. I could not prove that it happened on a losing trade today.

### Delayed twin (T): 12 losses, -$88.53, no rule broken

Between 4:05 and 6:31 AM, recon-dly trades were each refused once at the wire (pink, HER CANDLE, TARGET PAST A BAND) and passed on the resend under her twin rules. Love's words exempt the twin from pink (fix272, "the twin is supposed to be exempt from pink"), from the candle rule (Oct 21, "skip only the candle rule"), and from zones and Bollinger (fix307, "no holds other than the 20/33 band tolerances"). Every twin fill passed her thirds (wire-pass) and the 30 s and second-band rules (fix355/356). The twin lost 12 of 15 trades. That is a model problem, not a rule breach.

## 3. Summary

**Loss on rule-breaking trades: -$130.20 across 9 positions** (-$63.54 on the entries alone; the rest came from add-ons).

By rule broken:

| Rule (as Love set it, before the trade) | Trades | $ lost |
|---|---|---|
| $10 gold level: CLEAR OF (fix376) x4, INTO (fix217/232) x1 | 5 | -67.39 |
| Direction: long on a red candle that broke down through pink | 1 | -20.80 |
| HER FLIP (Cornerstone #1, copy) | 1 | -15.95 |
| Gold slide under pink = no long (fix371/R057) | 1 | -15.70 |
| Same side of the break / 33% thirds | 1 | -10.36 |
| **Total** | **9** | **-130.20** |

By fix or code path responsible:

| Responsible | Trades | $ lost |
|---|---|---|
| 30c dead zone: `abs(d376) >= 0.3` in fix376 (Oct 28 12:23 AM) and `abs(tick-L10) >= 0.3` from fix217 (Oct 25) | 5 | -67.39 |
| fix395 pure own taps on a 1m flip (fixed by fix401/fix398, 3:30-4:00 PM) | 1 | -20.80 |
| wireWall never checks the copy's HER FLIP (flipRule list excludes recon-togp; also in the Oct 27 known-good) | 1 | -15.95 |
| fix371 built narrower than Love's words (fixed by fix403, 4:15 PM) | 1 | -15.70 |
| fix399 20% small-band share (4:00 PM; reversed by fix414, 6:15 PM) + the break label retried after the break failed | 1 | -10.36 |

Plainly: 13 losses (-$162.25) broke no rule, 12 twin losses (-$88.53) are allowed by her twin rules, and 9 one-tick passes (-$93.62) were legal at the time but are what fix411 now blocks. Still open: fix376 and THE $10 LEVEL keep the 30c dead zone in HEAD f47cd6d, and the wire still does not check the copy's flip (the copy is paper since fix412).

Supporting files in this folder: positions9.json (every position with geometry, candle, refusals and verdict), trades.txt (every fill), bl.txt (wall refusals before each loss).
