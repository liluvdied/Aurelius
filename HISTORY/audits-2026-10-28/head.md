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

