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