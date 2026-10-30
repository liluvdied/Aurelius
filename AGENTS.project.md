# READ FIRST — Claude fixes, 2026-10-01 (these override anything below)

1. **Live switch.** `data/live-switch.json` is the only on/off for real money. `live: false` means no new Kalshi or Polymarket order can leave, from any book, copier, or script. It is enforced inside `kalshi()` and `poly()` in `src/lib/desk/live-guard.ts`, so nothing routes around it. Exits always work. The LIVE ON / LIVE OFF button in the desk header flips it. Never set `live: true` unless Ryan turns it on himself.
2. **Size ceiling.** `maxDollars` in the same file. No opening order can cost more, whatever `live-size.json`, a copier, or a slider says. Orders over it are cut down, never sent at full size.
3. **Loss cooldown.** `cooldownAfterLoss: true`. After a live Kalshi loss on a symbol, that symbol sits out its next window.
4. **Fire snapshot.** Every filled live order writes spot, target, VWAP, stdev, every band, cost, multiple and seconds left to `data/live-fires.json`. Blocks are logged in `data/live-blocks.json`. Use these to explain any trade. Do not reconstruct from charts.
5. **No restores.** `scripts/put-it-back.mjs` is disabled. Do not copy any `spine/` folder over `src/`. The hourly or restart "reload" described in `spine/SPINE.md` is retired. Restoring an old spine removes every fix above.
6. **Book orders use the book's bands.** If a book order arrives without its VWAP and bands, it is blocked. It is never re-checked against a different VWAP feed.
7. **Route is pinned.** `route` in `data/live-switch.json` decides which book can send. It is `"paper"`, the paper book model that traded clean. `book-mode.json` no longer moves it. Do not change it unless Ryan asks.
8. **Watchdogs restart, never restore.** `scripts/live-loop.sh` and `scripts/reignite.mjs` judge health by the engine heartbeat only, need two stale checks in a row, and never copy code in. `spine/reload.sh` and `spine/switch-profile.mjs` are disabled.
9. **Never edit desk files while the desk is live.** A half-saved file crashes the engine (see `data/tick-error.json`, 23:59Z Oct 1). Turn LIVE OFF first, edit, check it loads, then turn it back on.
10. **Do not** add `return` lines to stop trading. Turn the switch off.
11. **Do not** put zips, exports, or anything from `.secrets/` in `public/`. Everything in `public/` is downloadable by anyone.

# Aurelius desk preferences

Keep these unless Ryan explicitly changes them. Do not rearrange a live-order card when he asks for one thing.

## LOCKED SPINE — do not deviate

Frozen 2026-09-27 02:55 PDT. Ryan had the new rules written into both backups so a restore cannot repeat them.

This entry model is the baseline. It does not change without an express instruction from Ryan in the current conversation. Do not tighten it, loosen it, refactor it, or "clean it up."

Restore only from the frozen copies if the live rules drift:

- `/workspace/spine/BASELINE/`
- `/workspace/spine/BACKUP-OF-BACKUP/`

Same archive checksum: `ecc135c936eeee89646fc74456a58f1ecc3d0d357f6bda547c91dcdd08332455`. Read `/workspace/spine/SPINE.md` before touching `src/lib/desk/auto.ts` or the send path in `engine.ts`. Earlier archives stay on disk. Do not restore them.

The directional rule, locked: a band blocks only the side that still has to cross it. The desk uses the most recent price and the close. A close above the band is the long. If price then breaks under that band and taps it from underneath, that is a short. Halfway between two bands is not a close. Price under a band with the target above that band is a short. A short above the VWAP is blocked only when price is still above the target. A clear band rejection already through the target may pay down to 1.2×, and only with 8 minutes or less left. Pads stay Bitcoin $35, Ethereum $2, Solana 25 cents.

## Live order card, top to bottom

1. First row, tight under LIVE ORDERS. Left: symbol, bullet, side, bullet, countdown. Right: MAX and the multiple. Both stay on this row. Do not push the symbol below the cash line.
2. Under that, right aligned: the sign sits against the percent. A wide gap, then the bullet, then a wide gap, then the dollar sign sitting against the cash amount. Do not pad the sign away from its number.
3. Spot price under the symbol, large, rolling.
4. Target on its own line under the price, smaller.
5. Slider above the buttons. Visual only.
6. HALF, CLOSE, SIZE on the left. Bullet in the middle. 39, 45, 55, 65 on the right. Rounded rectangles, a little room between them. Percent buttons are longer and shorter than the action buttons.

One wine-red border on the live-orders box. No second inner border. No stencil numbers.

The Kalshi ledger uses the same explanation as the situation report. A loss never says the trailing take profit caught the high.

## Sizes

ETH, SOL, and Bitcoin entries are $25. Do not leave them at $5 or $20.
\n## THE LIVING BASELINE (Oct 20, 2026 ~1:30 AM PT)\nEvery install that Love asked for updates data/golden-baseline.json IN THE SAME BREATH as the file + its approved-model fingerprint (code shas, per-key live-switch hashes, spine-lock/FROZEN shas), with her quote in overnight-fixes.log. Her scheduled checks compare the desk against that baseline: drift from it = unsolicited = alert her; matching it = quiet. NEVER report a change to her that she solicited - solicited changes move the baseline so the checks stay quiet. tools/verify-golden.py is the same comparison on demand.\n
## THE FIREWALL (Oct 20, 2026 ~2:00 AM PT - INDEFINITE)
Love: "install a firewall that can't change anything about how she executes without express consent from my side of the desk. indefinite immutable freeze until i thaw it myself. nothing moves in the code without a say-so from my side of the desk. no shifts in the code terminal-wide without express permission & intention from my side of the desk"
Every code file (src/**), the sentinel maps, the spine lock, the living baseline, the vault, this file and package.json carry the OS write-permission freeze (chmod 444 files / 555 dirs). NOTHING may be changed without her express ask. To change anything she asked for: (1) quote her words in overnight-fixes.log, (2) chmod 644 ONLY the named files, (3) make the change, (4) update approved-model.json + golden-baseline.json in the same breath, (5) chmod 444/555 everything back, (6) verify with tools/verify-golden.py. Never thaw without her words. Never leave anything thawed.
