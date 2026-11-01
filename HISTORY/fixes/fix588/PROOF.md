# fix588 HER FLIP AT THE WIRE, EVERY BOOK: proof packet
Nov 1 2026. Staged at data/STAGED-CHANGE-her-flip-every-book-588 and Desktop/7-HER-FLIP-EVERY-BOOK.command. **Not applied.** Click order: 5 (fix586), then 6 (fix587), then 7 (fix588). 7 stops cleanly if 5 and 6 aren't in.

## Where every order leaves
- **Kalshi:** every order to /portfolio/events/orders is signed inside one function, `kalshi()` in kalshi-live.server.ts. That covers sendOrder (L875), take-profit (L1649), add-on (L1699/1721), and flatten/prime (L2128/2474). The test checks that no order uses a raw fetch.
- **Polymarket (5M and every Poly buy):** every /v1/orders call is signed inside `poly()` in poly-live.server.ts (L395 sell, L498/L634 buys).

## The lock
- Before an opening order is signed, `kalshi()` runs `herFlipAtWire588` and `poly()` runs `polyFlip588`. Both call bandlock `herTurn587` on the live tick. It passes only when a 2/3/4/5m candle traded the other colour first and then crossed its open her way. That means green now for a long (tick over that candle's open) and red now for a short.
- Covered: main, rejection, no-pink, delayed (including the twin add-on, which used to skip the wall), add-ons, every retry knock, and the 5M.
- Only exits pass: reduce_only orders, her take-profit closes (closeOnlyBodies) and Poly sells.
- Fails closed if the tick is older than 2.5 s, the market has no 2-5m candles (anything that isn't KXBTC/KXGOLD or a btc/gold Poly slug), or herTurn587 is missing.
- No read, wall, tolerance, zone, thirds or pink was changed. Every read still has to reach this wire, and here it is refused without her flip.

## Proof
- tools/flip-at-wire-588.cjs runs the real wire functions with the real herTurn587 on logged candles:
  - 4:00 AM short (12:00:13 UTC): refused on Kalshi at 77,855.87 and at 77,846, and refused on the 5M.
  - 4:15 AM short (12:15:14 UTC): refused at 77,833.37.
  - A real green-to-red turn goes, on Kalshi and on the 5M. A long on a red-turned candle is refused. A gold red-to-green turn goes.
  - A stale tick is refused. A market with no candles is refused.
  - Wiring is checked inside kalshi() and poly().
- On live code: **FAIL** (the wire flip is missing). With 586 + 587 but not 588: **FAIL**. Staged: **PASS**.
- Every tools/*.cjs, live vs 586+587+588: identical except the three new tests, all ✓. Pre-existing failures are unchanged (retired 581/582, zone-pickup-448).
- Not run here: the desk's own umpire.py, which needs her live data. The command runs it and prints UMPIRE + HER FLIP.
