# Every way the desk can touch her Kalshi account (inventory, Oct 16 2026 ~7:20 PM PT)

Love: "so you never - not have an answer for me when i ask what just happened."
All of these go through ONE function, `kalshi()` in src/lib/desk/kalshi-live.server.ts. Since 7:16 PM PT every POST/DELETE it sends
is written to data/order-trail.jsonl with the call chain that asked for it and Kalshi's answer. Hand orders: data/hand-trail.jsonl.
Desk closes: data/flatten-calls.jsonl. Prime-book alignment decisions: data/align-prime.jsonl.
Answer for any window: `python3 tools/what-happened.py KXBTC15M-26OCT162200-00` (or `last`, `btc`, `gold`).

## Opens a position
| Path | What it does |
|---|---|
| enterLive -> place -> sendOrder | a live book's entry (ogp5-fast, ogp5-inv) copied from its paper row; band gate (bandlock) runs first |
| engine aim -> enterLive | the engine's own aimed entry (same gate) |
| addOnBuy | adds to an open position (top-up after a partial fill) - band gate runs first |
| gate test (place with gateTest) | $1 silver test order, only when she runs a gate test |
| combos / RFQ (comboBuy etc.) | parlay legs via RFQ - comboLive is OFF since Oct 14 |

## Sells / closes a position
| Path | When |
|---|---|
| restTakeProfit | keeps a resting sell at her take-profit price for the whole position |
| engine exits (tpSell / gateSell / lockSell / paperSell) | take-profit hit, gate exit, lock exit, follow-paper exit - not when hands-off is on |
| engine 5% / 10% buttons, slider pin | sells near $1 / at her slider price, only in profit |
| closeNow -> closelane -> flattenTicker(manual) | HER close button |
| halfLive / partLive | her HALF / % buttons |
| positions page close | her close on the positions page |
| change-mind flip (kalshi-live) | a book flips sides in its own window - never on a window she traded by hand |
| sweep flip guard | 2.5 s / 8 s after a sale, closes a straggler that flipped the position |
| backwards guard (engine) | sells the bot's own fill if Kalshi shows it on the wrong side |
| engine aim cleanup | sells a just-filled aim that came back on the wrong side / failed to book |
| alignPrime | closes a held 15m position the prime paper book disagrees with - since 7:02 PM never a live-book window or a hand window. This is the 6:51 PM suspect. |

## Cancels
| Path | When |
|---|---|
| cancelRestingOn / cancelTpRest | leftover resting orders after a close, or a take-profit whose position is gone |
| RFQ deletes | unanswered combo / sell quotes |
