
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
