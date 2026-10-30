LOCKED SNAPSHOT - GOLD "PERFECT" (Love, Oct 18 2026 ~11:48 PM PT)
"yesssssssss. i watched her not long into it and wait for a rejection, the second it flipped she was in. yes. lock dat shit innnn boo
 plssss / keep an unadulterated file on that for gold so we can come back to it if we get too far off track again. thaaaat shit was perfect."

THE TRADE: 11:45:34 PM PT gold SHORT, "Rejected off 5m PP" (the pink), ~2.2x, TOGETHER (5M half). She did not long into the pink,
waited for the rejection, and was in the second it flipped.

FILES (as running at that moment, read-only copies - sha256 first 16):
  bandlock.ts: dfd5cc259f3fc01a
  charttwins.ts: 6d57a11865aa4240
  engine.ts: fac398f948130107
  golden.ts: 9ffef369c617d291
  goldlaw.ts: dcc1fd1002ef2c2d
  kalshi-live.server.ts: 498ef32cf0189e86
  kalshi.ts: a9f8d49b27a30ce7
  nav.ts: ab2f6ccd1c3a193d
  pivotbooks.ts: c36fc7b0164dd2c8
  quotes.ts: ff2f58a38f2bd5c8
  tv.ts: 3662dce61c44644b
  live-switch.json, approved-model.json, sess-carry.json

SETTINGS THAT MADE IT:
  BTC chart: PEPPERSTONE:BTCUSD (session 5 PM ET); INDEX:BTCUSD = second feed / Kalshi gap reference; gold chart TVC:GOLD
  Position size: ${'btc': 1, 'gold': 1} (add-on $1)
  Gold range (session bands + pink in front): $1.5   red/green pivots: $1.11   BTC range: $25 (default)
  Channel no-long/no-short zone: gold 30%, BTC 20%
  Break distance: gold 33c, BTC $8 (BREAK_DIST / PINK_BREAK / DELAYED); taps: gold 30c / BTC $3 (TOGETHER next-band rejection);
  near tap $2 gold / $30 BTC (add-ons + DELAYED)

RULES IN FORCE (bandlock.ts / pivotbooks.ts):
  - Top/bottom channel zone: no long in the top X% with the band above unbroken; no short in the bottom X%.
  - Gold: no trade into an unbroken session band / the pink within $1.50 in front; red/green pivots within $1.11.
  - Break = trade the direction of the break; the LAST way it breaks in the current 5m candle decides; a hover under the break
    distance never flips it; a SESSION band the candle broke stays broken until a candle closes back past it (back under it,
    long only once price turns back up by the break distance; mirror for shorts).
  - Break entry (TOGETHER 5M, BTC + gold): a break of a session band / the pink in the current candle = entry that way while
    closer to the band above (short) / below (long) and outside the zone.
  - Break one band, tap the next, reject = trade the rejection.
  - No long while the 5m candle is falling (down half the break distance from its open, not bounced the break distance off its
    low); no short while rising.
  - Falling from the top third of the channel = no long -> FLIP to short (if the short passes every rule); rising from the
    bottom third = no short -> flip to long.
  - Pink-break memory and all breaks: current 5m candle only.
  - Sit-outs: TOGETHER normal hours; DELAYED trades 7, 10, 11 AM, 2, 4, 6, 7 PM; gold sits out 6 PM.

TO RESTORE: copy the .ts files back to src/lib/desk/, live-switch.json back to data/, and put the fingerprints above into
data/approved-model.json (or copy approved-model.json back). Ask Claude to do it and re-run the self-test.
