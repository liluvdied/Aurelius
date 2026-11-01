# SPINE — the only model. Locked 2026-09-27 4:14 PM PDT

This is the only model. It does not get swapped for an older archive. Every hour, on the hour Pacific, the desk copies this baseline back over the live code and reloads it.

Locked while she was firing clean on every market. This baseline, and the backup of this baseline, are the only reload. Older archives stay on disk and are not copied back.

Do not change the entry rules, the pads, the directional band gate, or the survival rules unless Ryan gives an express instruction in that conversation. A suggestion, a cleanup, a refactor, or "while I'm here" is not permission.

## What is frozen

Two identical copies. Same archive checksum `a4e77d24bef6007b5bae3cd14ecfb857cc73523a328545d10581a580955c6851`.

- `/workspace/spine/BASELINE/` and `BASELINE-2026-09-28T04-14Z-fail.tar.gz `/workspace/spine/BACKUP-OF-BACKUP/` and `BACKUP-OF-BACKUP-2026-09-28T04-14Z-fail.tar.gz freezes stay on disk and are not the restore point. Do not copy them back. The hourly reload uses BASELINE only.

Both trees are read-only. Fingerprints in `BASELINE.sha256` and `BACKUP-OF-BACKUP.sha256` (they match).

The live desk is reloaded from this copy at the top of every Pacific hour. If the live files drift, the reload puts this model back. Size changes from a green midnight stay in `data/live-size.json` and are not part of the model swap.

## The gate

A band within the pad of the target blocks only the side that still has to cross that band to reach the strike. A band sitting past the strike is beyond the finish. It does not block.

- Pads: Bitcoin $35, Ethereum $2, Solana 35 cents, Gold is $1.50. A band within $1.50 of the gold target blocks both sides.
- A band sitting between price and the target is still a separate block. Close-above longs are the exception already in the code. Do not merge these two rules.
- Bitcoin, 2:45 AM PDT: close $84,757 was above +1σ. Target $84,774. The +1.5σ band at $84,787 was $13 past the target. That long is legal. Do not skip it.

The desk operates on the most recent price and on the close. A close that crosses a band from underneath is a long for the whole window, not only the first four minutes. If price then breaks back under that band and taps it, that short still wins.

- Bitcoin, 3:00 AM PDT: the most recent price closed above the band. That long was the confirmation, and it hit. Do not hold the entry back for a finished candle.
- Ethereum, 3:15 AM PDT: $2,718.37 was 65 cents above +2σ and 59 cents under +2.5σ. That is the middle. No trade.

If price is still above the target and both are above the VWAP, the short is not allowed. If price is still below the target and both are below the VWAP, the long is not allowed. When a band sits between them, only the side that still has to cross it is blocked. Price under the band and the target above it: the long has to cross, the short does not.

- Bitcoin, 3:15 AM PDT: price $85,008 closed under the +1σ band at $85,008.70. The target was $85,022, above that band. The short was legal. It was blocked only because both were still above the VWAP. That block no longer applies once price is already under the target.

- Solana, 2:48 AM PDT: close $124.17 was a nickel under +1σ at $124.22, and +0.5σ sat on the $124.15 target at $124.10. Price and the target were both above the VWAP at $123.98. That short is not allowed.

Winners stay: tap-reject either side, close above only long, close below only short. A clear band rejection that is already through the target can pay as little as 1.2×, and only with 8 minutes or less left. Anything earlier stays on the old price. A trade under 1.34× trails the highest quote and sells if it comes back to 28%. It does not go under 28%. Fifteen-minute orders go to the book that lists those markets. The other cash balance cannot see them.

A restart must not flatten a position it only adopted. Fills marked Live, or a trade id starting with `held-`, are not a breach.

Engine generation at this freeze: 382.
