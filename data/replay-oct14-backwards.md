# Oct 14 replay: every live bot trade vs the fresh-price fix

Kalshi-true P&L, OGP5 + PAPER 24/7 only (hand trades, combos, silver, open positions excluded).
**83 trades · 39W / 44L · net $-442.03**

Flags: OPEN-TICK = her decision price equalled the window's opening tick (= the Kalshi strike). STALE = her price was off the live price (BTC: 1m TradingView bars; gold: 5m bars, approximate). BAND ALREADY LOST = live price was already back on the other side of the band she traded. ENTRY CANDLE AGAINST HER = the candle she fired in moved against her side.
Fix = opening floor 30 s + fresh-price rule (read < 8 s old, taken >= 5 s after the open) + closed-candle fix.

## Losses (44)

| PT | book | asset | side | setup | into | ask | P&L | her price | open tick | live ~ | flags | fix |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 12:00:11 AM | ogp5 | btc | down | Rejected off 5m PP | 11s | 0.58 | -32.54 | 83334.86 | 83342.09 | 83333.41 | - | floor blocks it |
| 12:00:21 AM | ogp5 | gold | down | On -2σ | 21s | 0.58 | -29.48 | 4147.49 | 4147.486 | 4147.57 | OPEN-TICK (her price = the :00 tick); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it; re-decided at 30 s: UP instead |
| 12:30:20 AM | pap247 | gold | down | Tap-reject at −1.5σ | 20s | 0.61 | -31.58 | 4147.99 | 4146.02 | 4146.07 | STALE (her 4147.99 vs live ~4146.07); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 12:45:10 AM | ogp5 | btc | down | On 5m PP | 11s | 0.47 | -25.72 | 83347.15 | 83324.96 | 83331.56 | STALE (her 83347.15 vs live ~83331.56); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 12:45:14 AM | ogp5 | gold | down | Rejected off -1.5σ | 15s | 0.58 | -29.89 | 4148.08 | 4148.096 | 4148.11 | OPEN-TICK (her price = the :00 tick); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 1:00:12 AM | ogp5 | gold | down | On -1σ | 12s | 0.5 | -26.87 | 4149.48 | 4149.388 | 4149.46 | OPEN-TICK (her price = the :00 tick); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it; re-decided at 30 s: UP instead |
| 1:00:24 AM | ogp5 | btc | down | Close below +0.5σ | 24s | 0.58 | -27.86 | 83480.89 | 83483.61 | 83506.38 | STALE (her 83480.89 vs live ~83506.38); BAND ALREADY LOST (live price back on the other side of her band); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 1:15:12 AM | ogp5 | btc | up | On 5m R1 | 12s | 0.6 | -27.33 | None | 83846.52 | 83848.97 | - | floor blocks it |
| 1:30:06 AM | ogp5 | btc | up | On 5m PP | 6s | 0.56 | -26.73 | None | 83747.59 | 83745.43 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 2:37:28 AM | pap247 | btc | up | Tap-reject at −1.5σ | 448s | 0.6 | -25.02 | 83186.66 | 83169.84 | 83226.78 | STALE (her 83186.66 vs live ~83226.78) | fresh-price rule blocks it |
| 3:16:23 AM | pap247 | gold | up | Tap-reject at -1.5σ | 84s | 0.59 | -27.94 | 4140.73 | 4143.516 | 4143.54 | STALE (her 4140.73 vs live ~4143.54) | fresh-price rule blocks it |
| 3:45:21 AM | pap247 | gold | up | Tap-reject at -1.5σ | 22s | 0.64 | -28.12 | 4140.94 | 4143.655 | 4143.72 | STALE (her 4140.94 vs live ~4143.72) | floor blocks it; fresh-price rule blocks it |
| 5:00:14 AM | ogp5 | btc | down | Rejected off session VWAP | 14s | 0.63 | -32.90 | 83385.32 | 83384.07 | 83393.72 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 5:45:25 AM | ogp5 | gold | down | On 5m S2 | 26s | 0.46 | -25.84 | None | 4093.33 | 4094.34 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 6:22:16 AM | pap247 | btc | down | Tap-reject at −1σ | 437s | 0.62 | -8.29 | 82590.62 | 82319.52 | 82329.28 | STALE (her 82590.62 vs live ~82329.28); ENTRY CANDLE AGAINST HER | fresh-price rule blocks it |
| 6:26:21 AM | pap247 | gold | down | Tap-reject at -2.5σ | 682s | 0.69 | -29.99 | 4089.295 | 4089.11 | 4087.9 | STALE (her 4089.30 vs live ~4087.90); ENTRY CANDLE AGAINST HER | fresh-price rule blocks it |
| 8:15:13 AM | ogp5 | btc | down | On 5m PP | 14s | 0.5 | -26.35 | None | 81741.07 | 81769.03 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 8:15:39 AM | ogp5 | gold | down | On 5m PP | 40s | 0.38 | -23.65 | None | 4087.377 | 4087.41 | - | NOT COVERED |
| 8:30:16 AM | ogp5 | gold | up | Bounce off 5m PP | 17s | 0.41 | -23.60 | 4092.55 | 4092.567 | 4092.4 | OPEN-TICK (her price = the :00 tick); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 8:45:10 AM | ogp5 | btc | up | Bounce off 5m S1 | 11s | 0.6 | -27.82 | 81573.43 | 81573.43 | 81592.05 | OPEN-TICK (her price = the :00 tick); STALE (her 81573.43 vs live ~81592.05) | floor blocks it; fresh-price rule blocks it |
| 8:45:14 AM | ogp5 | gold | up | On -2σ | 15s | 0.58 | -29.08 | 4085.02 | 4085.806 | 4085.64 | STALE (her 4085.02 vs live ~4085.64); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 9:15:10 AM | ogp5 | btc | down | On -2.5σ | 11s | 0.43 | -18.38 | 81515.12 | 81519.36 | 81535.39 | STALE (her 81515.12 vs live ~81535.39); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 9:45:38 AM | ogp5 | gold | down | On -1.5σ | 39s | 0.5 | -26.81 | 4082.96 | 4082.7 | 4082.5 | - | NOT COVERED |
| 10:01:12 AM | pap247 | btc | up | Tap-reject at +2σ | 72s | 0.62 | -32.31 | 81878.68 | 81939.43 | 81957.75 | STALE (her 81878.68 vs live ~81957.75); ENTRY CANDLE AGAINST HER | fresh-price rule blocks it |
| 10:15:55 AM | pap247 | gold | down | Close below 10m nav purple | 56s | 0.44 | -20.34 | 4086.321 | 4079.04 | 4079.46 | STALE (her 4086.32 vs live ~4079.46); ENTRY CANDLE AGAINST HER | fresh-price rule blocks it |
| 10:16:19 AM | pap247 | btc | up | Tap-reject at +0.5σ | 79s | 0.58 | -31.29 | 81764.22 | 81874.37 | 81874.55 | STALE (her 81764.22 vs live ~81874.55) | fresh-price rule blocks it |
| 10:30:38 AM | pap247 | gold | up | Live | 38s | 0.69 | -32.31 | None | 4086.351 | 4086.57 | - | NOT COVERED |
| 12:00:23 PM | ogp5 | gold | down | Rejected off 5m R1 | 24s | 0.49 | -8.11 | 4096.98 | 4096.59 | 4096.45 | STALE (her 4096.98 vs live ~4096.45) | floor blocks it; fresh-price rule blocks it |
| 12:15:09 PM | ogp5 | btc | down | On 5m R1 | 9s | 0.47 | -23.36 | 81696.13 | 81685.86 | 81688.78 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 12:45:11 PM | ogp5 | btc | down | Close below 5m PP | 12s | 0.59 | -27.75 | 81641.01 | 81641.01 | 81641.04 | OPEN-TICK (her price = the :00 tick) | floor blocks it; fresh-price rule blocks it |
| 12:45:14 PM | ogp5 | gold | down | Close below 5m PP | 14s | 0.52 | -29.66 | 4100.35 | 4100.353 | 4100.39 | OPEN-TICK (her price = the :00 tick); BAND ALREADY LOST (live price back on the other side of her band); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 1:01:09 PM | pap247 | gold | up | Live | 69s | 0.66 | -30.97 | None | 4101.637 | 4101.64 | - | NOT COVERED |
| 1:15:20 PM | ogp5 | gold | down | Rejected off 5m PP | 20s | 0.5 | -28.46 | 4100.1 | 4099.706 | 4099.71 | - | floor blocks it |
| 1:30:59 PM | ogp5 | btc | up | Close above 5m PP | 59s | 0.45 | -23.13 | 81804.35 | 81771.22 | 81815.84 | CLOSED-CANDLE BUG (fired at :59, forming candle counted as closed) | closed-candle fix blocks it |
| 1:31:04 PM | ogp5 | gold | up | Close above 5m PP | 64s | 0.55 | -24.63 | 4100.84 | 4100.322 | 4100.31 | STALE (her 4100.84 vs live ~4100.31); BAND ALREADY LOST (live price back on the other side of her band); ENTRY CANDLE AGAINST HER | fresh-price rule blocks it |
| 2:45:04 PM | ogp5 | btc | up | Bounce off session VWAP | 4s | 0.51 | -31.76 | 81735.14 | 81730.16 | 81736.85 | - | floor blocks it |
| 3:30:11 PM | ogp5 | btc | up | Close above -1.5σ | 12s | 0.54 | -28.29 | 81516.59 | 81516.59 | 81519.21 | OPEN-TICK (her price = the :00 tick) | floor blocks it; fresh-price rule blocks it |
| 3:45:17 PM | ogp5 | gold | up | On +2σ | 18s | 0.55 | -28.86 | None | 4110.017 | 4109.93 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 4:00:15 PM | ogp5 | gold | up | On -0.5σ | 16s | 0.49 | -34.46 | 4106.19 | 4106.48 | 4106.32 | ENTRY CANDLE AGAINST HER | floor blocks it; re-decided at 30 s: DOWN instead |
| 4:15:11 PM | ogp5 | btc | up | Close above -0.5σ | 12s | 0.51 | -30.94 | 81588.64 | 81586.53 | 81584.0 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 4:15:16 PM | ogp5 | gold | up | Close above -1σ | 17s | 0.43 | -21.76 | 4104.18 | 4104.71 | 4104.65 | ENTRY CANDLE AGAINST HER | floor blocks it |
| 5:00:14 PM | ogp5 | btc | down | Close below session VWAP | 15s | 0.45 | -23.49 | 81560.15 | 81560.15 | 81570.77 | OPEN-TICK (her price = the :00 tick); ENTRY CANDLE AGAINST HER | floor blocks it; fresh-price rule blocks it |
| 5:16:13 PM | ogp5 | btc | up | Bounce off +1σ | 73s | 0.46 | -18.19 | 81710.32 | 81699.03 | 81701.5 | ENTRY CANDLE AGAINST HER | NOT COVERED |
| 5:31:55 PM | pap247 | btc | up | Tap-reject at +1σ | 116s | 0.65 | -0.26 | 81438.58 | 81679.98 | 81678.65 | STALE (her 81438.58 vs live ~81678.65); ENTRY CANDLE AGAINST HER | fresh-price rule blocks it |

## Wins the same fix would also have removed

| PT | book | asset | side | setup | into | P&L | fix |
|---|---|---|---|---|---|---|---|
| 12:15:12 AM | ogp5 | gold | down | Rejected off 5m PP | 13s | 15.00 | floor blocks it |
| 12:30:11 AM | ogp5 | btc | down | On 5m PP | 11s | 17.59 | floor blocks it; fresh-price rule blocks it; re-decided at 30 s: UP instead |
| 1:15:19 AM | ogp5 | gold | down | Rejected off 5m R1 | 19s | 19.21 | floor blocks it; fresh-price rule blocks it |
| 1:30:21 AM | ogp5 | gold | down | Close below -1σ | 22s | 17.39 | floor blocks it |
| 1:45:11 AM | ogp5 | btc | up | Close above -0.5σ | 12s | 6.96 | floor blocks it; fresh-price rule blocks it |
| 1:47:39 AM | ogp5 | gold | down | On -2σ | 160s | 14.80 | kept |
| 2:46:00 AM | pap247 | btc | down | Tap-reject at -1.5σ | 61s | 19.42 | kept |
| 3:00:51 AM | ogp5 | btc | down | On -1.5σ | 51s | 11.68 | kept |
| 3:15:06 AM | ogp5 | btc | up | Bounce off -1σ | 7s | 19.13 | floor blocks it |
| 3:30:15 AM | ogp5 | btc | up | On 5m PP | 16s | 12.30 | floor blocks it |
| 3:45:10 AM | ogp5 | btc | up | Close above -0.5σ | 11s | 16.16 | floor blocks it; fresh-price rule blocks it |
| 4:31:51 AM | pap247 | btc | up | Tap-reject at -0.5σ | 112s | 8.55 | kept |
| 4:46:15 AM | pap247 | btc | up | Tap-reject at VWAP | 75s | 11.43 | kept |
| 4:46:55 AM | pap247 | gold | down | Tap-reject at −1σ | 116s | 10.83 | fresh-price rule blocks it |
| 5:15:28 AM | ogp5 | btc | up | On 5m R2 | 29s | 91.06 | floor blocks it |
| 5:15:33 AM | ogp5 | gold | up | Close above -0.5σ | 34s | 3.45 | fresh-price rule blocks it |
| 5:45:10 AM | ogp5 | btc | down | On 5m S1 | 11s | 17.36 | floor blocks it |
| 6:00:28 AM | pap247 | btc | down | Close below 15m nav lower band | 28s | 17.05 | floor blocks it |
| 6:08:22 AM | pap247 | gold | down | Live | 502s | 9.41 | kept |
| 8:00:29 AM | ogp5 | gold | down | On 5m PP | 30s | 13.81 | floor blocks it |
| 8:00:38 AM | ogp5 | btc | down | On -3σ | 38s | 19.96 | kept |
| 8:30:04 AM | ogp5 | btc | down | Rejected off -2.5σ | 5s | 14.05 | floor blocks it; fresh-price rule blocks it |
| 9:00:07 AM | ogp5 | btc | up | On 5m S1 | 8s | 17.14 | floor blocks it; fresh-price rule blocks it |
| 9:15:20 AM | ogp5 | gold | up | On -2σ | 20s | 12.69 | floor blocks it; fresh-price rule blocks it |
| 9:30:09 AM | ogp5 | btc | up | Bounce off 5m PP | 9s | 22.31 | floor blocks it |
| 9:30:32 AM | ogp5 | gold | up | Bounce off 5m PP | 33s | 30.38 | kept |
| 9:46:02 AM | ogp5 | btc | up | Bounce off 5m R1 | 63s | 15.72 | fresh-price rule blocks it |
| 12:00:10 PM | ogp5 | btc | down | On -1.5σ | 10s | 20.72 | floor blocks it; fresh-price rule blocks it |
| 12:30:12 PM | ogp5 | btc | down | On -1.5σ | 12s | 13.39 | floor blocks it |
| 12:30:53 PM | ogp5 | gold | down | On -0.5σ | 53s | 4.56 | kept |
| 1:45:08 PM | ogp5 | btc | up | Bounce off -1.5σ | 9s | 21.21 | floor blocks it; fresh-price rule blocks it |
| 1:45:34 PM | ogp5 | gold | up | Bounce off 5m S1 | 35s | 15.24 | kept |
| 2:30:25 PM | ogp5 | btc | up | On -1.5σ | 26s | 11.12 | floor blocks it; fresh-price rule blocks it |
| 3:00:28 PM | ogp5 | btc | down | Rejected off -0.5σ | 29s | 21.75 | floor blocks it |
| 3:15:11 PM | ogp5 | btc | down | Close below -1σ | 12s | 16.22 | floor blocks it; fresh-price rule blocks it |
| 3:31:07 PM | ogp5 | gold | up | Close above 5m R1 | 68s | 25.80 | fresh-price rule blocks it |
| 3:45:11 PM | ogp5 | btc | up | Bounce off -2σ | 12s | 24.96 | floor blocks it; fresh-price rule blocks it |
| 4:00:07 PM | ogp5 | btc | down | Rejected off -0.5σ | 7s | 23.98 | floor blocks it; fresh-price rule blocks it |
| 4:46:37 PM | pap247 | btc | up | Tap-reject at -0.5σ | 97s | 16.30 | kept |

**Removed by the fix: 67 trades (28W/39L, net $-471.83). Kept: 16 (11W/5L, net $29.80).**