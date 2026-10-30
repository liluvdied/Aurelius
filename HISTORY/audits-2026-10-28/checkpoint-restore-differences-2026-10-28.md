# What changes if she goes back to the Oct 27 7:56 PM checkpoint

Love asked for this on Oct 28, 6:40 PM PT: "pls tell me EVRRYTHING that is different on that checkpoint".

Everything below comes from her request book (R046 to R109) and the diary, compared against the checkpoint save `data/SAVES/KNOWN-GOOD-2026-10-27-0756PM-PT-checkpoint-main-and-no-pink-copy-after-fix360`.

Tonight's full state is saved separately as `data/SAVES/2026-10-28-0639PM-PT-tonight-revisions-fix361-416-before-checkpoint-restore`. Nothing is lost.

## Stays exactly as it is now
- **Poly 5M:** the same frozen walls file (the 4:57 AM set from fix382), $5 a trade, the same hours.
- **Delayed twin:** the same code paths, $2.50 + $5, the same hours. BTC stays off Kalshi for the twin, as now.

## Decisions that matter before she goes back
1. **The copy goes back on the live seat.** At the checkpoint, the no-pink copy held the rejection hours live. The code that gives that seat to the rejection model (fix374 / fix412) didn't exist yet. You said "do not run this model". So either the copy runs live again in those hours, or those hours sit out live.
2. **The new books can't run on the checkpoint engine as they are.** Their code is newer than the checkpoint: pure no-pink, own-eyes, sovereign, 2nd-band, the OG rolling VWAP, and the strategy lab. They are saved in full. To keep them training, I'd rebuild them as a separate paper twin after she's back.

## Entry rules that come OUT (main, rejection, copy)
Candle flip:
- **fix406 / 407 / 416:** her flip goes back to "any 1/2/3/4/5m candle past its open", 1m included.
  - Main and rejection need no $5 / 10c minimum. The copy keeps its $5 / 10c.
  - A candle born red or born green counts as a flip again.
  - The new "real flip" cornerstone check would go red.

Walls added since the checkpoint:
- **fix411 (held 3 seconds):** a one-tick spike can count as the break again.
- **fix413 (session band ahead of the pink = wait):** off again.
- **fix379 / 414 (BTC 33%):** BTC channels that are one fresh sigma wide go back to 20% (fix219). The 33% cornerstone would go red.
- **fix409 (gold pink-to-green 55%):** back to 50% for the copy and the rejection model, 60% for main (fix364/365 came after the checkpoint, so it's 50% on every book). Pink-to-red goes back to 50%.
- **fix376:** gold "$1.50 clear of the $10 level" for trades pointing away from it.
- **fix377:** gold, no long inside the red zone, no short inside the green.
- **fix378:** gold, no long within $1.50 under R1, no short within $1.50 over S1.
- **fix371 / 403:** gold longs on a downslope under a rejecting pink wait for the pink break.
- **fix373:** a BTC long refused by pink re-aims to the short.
- **fix364:** the copy never takes thirds flips.
- **fix366:** the copy's fake-out turn no longer skips her flip, and the copy's BTC Bollinger wall is $75.
- **fix394:** a green/red zone read passes on any 1-5m flip.
- **fix397:** the blue VWAP wall (no long under VWAP / no short over it within half the width when bands are small).
- **fix399:** no trade that has to cross the blue VWAP to reach the target.

Safety:
- **fix375 stale call guard:** a call over 90 seconds old can fire when a seat switches on.

The doji is wrong in both versions. The checkpoint also reads a green doji as "long only". Your rule, "green doji, candle after it = red / RED = SHORT", isn't in either one yet.

## Sizes, seats and hours that change
- **Size:** back to $5 entry + **$8** add-on (now $5 + $5). maxDollars stays 5, so the 5M's $5 still fits.
- **Add-on price:** the first add-on ceiling goes back from 0.357 to 0.263.
- **Seats:** the rejection model loses the live seat in rejection hours (see decision 1).
- **Hours:** fix405's cuts are undone (BTC 12 AM, 9 PM, 11 PM and gold 8 PM back on live), and so are any schedule taps since Oct 27 8 PM.
- **11 PM:** goes back to the old sit-out.

## Not affected either way
- The request book, the vault, the repo history, the rulebook and the cornerstones file stay as they are.
- Restoring changes only her trading code and config. The audit reports stay in place.
