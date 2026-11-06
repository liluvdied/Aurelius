# Aurelius core: cloned clean

Brand new wiring. It reads nothing outside this folder, has no model switch, and carries no old files, paths or saved state.
It runs in **paper** unless `data/live.json` says `{"live": true}`, and even then the money rails in `rails.json` must all be filled.

## One pass, every second, per asset
1. `tradingview.js` keeps live 1m bars (Pepperstone BTC, TVC gold) and the price's age.
2. `kalshi.js` finds the open 15m window: ticker, strike, close time, asks and bids.
3. `main.js` measures the gap: chart price at the window's open minus Kalshi's strike.
4. `lines.js` draws everything once: session VWAP + bands (5 PM New York, DST-correct), 5m pink/red/green, 5m Bollinger.
5. `setups.js` looks for: close through a band, tap-reject at a band, 5m break with your push.
6. `walls.js` checks in order: price age, time left, 66c, into-band, 33% channel. The first no is logged with its numbers.
7. `tickets.js` checks the money rails (one ticket per window per book, no flips, ticket size, daily stop), buys, runs your exits, and scores only on Kalshi's settlement.
8. `log.js` writes `data/decisions-*.jsonl`, `exits-*`, `settle-*`, `gap-*`, `errors-*`. Never silent.

## Your files
- `tolerances.json`: every number. `null` = that rule is off until you type a number.
- `rails.json`: money rails. Live is impossible while any is `null`.

## Run
- `CORE-SMOKE-TEST.command`: tests + 15 seconds of live feeds. No key, no orders.
- `npm start`: the core itself (paper).
