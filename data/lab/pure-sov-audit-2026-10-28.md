# Pure + sovereign rule audit, Oct 28 2026 (12 AM - 3:45 PM PT, paper $20 rows)

Every trade each model called today, checked against Love's rules. One line per rule: trades, win rate, paper P&L.

## pure
```
SHORT ON A RISING GREEN CANDLE            13 trades  23%  -127.52
CLEAN (no rule broken)                    45 trades  51%   -43.35
SHORT INTO AN UNBROKEN BAND                6 trades  33%   -34.82
SHORT IN THE BOTTOM                        5 trades  40%   -14.29
LONG INTO AN UNBROKEN BAND                12 trades  58%    +3.89
BTC SHORT NEARER GREEN THAN PINK           3 trades  67%   +12.13
LONG ON A FALLING RED CANDLE              16 trades  44%  +113.29
LONG IN THE TOP                            7 trades  71%  +258.46
```

## sov
```
SHORT ON A RISING GREEN CANDLE            24 trades  42%  -114.38
SHORT INTO AN UNBROKEN BAND               19 trades  47%   -55.56
SHORT OVER THE BLUE VWAP                   2 trades  50%   -14.37
BTC LONG NEARER RED THAN PINK              4 trades  50%   -12.96
BTC SHORT NEARER GREEN THAN PINK           4 trades  75%    +4.18
SHORT IN THE BOTTOM                       16 trades  62%    +4.82
LONG IN THE TOP                           15 trades  53%   +21.02
LONG UNDER THE BLUE VWAP                   2 trades 100%   +36.93
LONG INTO AN UNBROKEN BAND                16 trades  62%   +74.71
CLEAN (no rule broken)                    48 trades  52%   +78.03
LONG ON A FALLING RED CANDLE              26 trades  54%   +82.69
```

## Every flagged trade

- 12:00 AM PT BTC long (recon-np, Rejected up off Green zone) sold 12.29
  - LONG ON A FALLING RED CANDLE (5m open 80750.67, price 80744.83)
- 12:15 AM PT BTC short (recon-np, Rejected down off fresh VWAP) loss -20.61
  - SHORT INTO AN UNBROKEN BAND (5m PP 80800.69 only 0.46 below)
  - SHORT IN THE BOTTOM 20% (5m PP 80800.69 to fresh VWAP 80814.37, at 3%)
- 1:21 AM PT BTC short (recon-np, Failed break above Red zone - rejected down) loss -21.18
  - SHORT ON A RISING GREEN CANDLE (5m open 81036.24, price 81040.78)
  - SHORT INTO AN UNBROKEN BAND (5m PP 81017.44 only 23.34 below)
- 1:30 AM PT GOLD short (recon-np, Rejected down off Red zone) loss -20.63
  - SHORT ON A RISING GREEN CANDLE (5m open 4049.99, price 4050.54)
- 1:50 AM PT GOLD short (recon-np, Rejected down off +1σ) sold 21.78
  - SHORT INTO AN UNBROKEN BAND (5m R1 4055.7 only 0.36 below)
  - SHORT IN THE BOTTOM 33% (5m R1 4055.7 to +1σ 4058.4, at 13%)
- 2:05 AM PT BTC short (recon-np, Rejected down off +3σ) loss -20.7
  - SHORT ON A RISING GREEN CANDLE (5m open 81347.01, price 81385.61)
  - SHORT INTO AN UNBROKEN BAND (5m PP 81373.73 only 11.88 below)
- 2:35 AM PT BTC long (recon-np, Failed break below Green zone - rejected up) sold 163.85
  - LONG ON A FALLING RED CANDLE (5m open 81321.32, price 81298.55)
- 3:20 AM PT BTC long (recon-np, Failed break below +2σ - rejected up) sold 19.41
  - LONG ON A FALLING RED CANDLE (5m open 81402.41, price 81390.17)
  - LONG INTO AN UNBROKEN BAND (5m PP 81399.12 only 8.95 above)
- 3:31 AM PT BTC long (recon-np, Rejected up off +2σ) sold 16.31
  - LONG INTO AN UNBROKEN BAND (5m PP 81408.42 only 1.01 above)
  - LONG IN THE TOP 33% (+2σ 81391.89 to 5m PP 81408.42, at 94%)
- 4:15 AM PT GOLD short (recon-np, Rejected down off session VWAP) loss -20.76
  - SHORT ON A RISING GREEN CANDLE (5m open 4045.59, price 4046.58)
  - SHORT INTO AN UNBROKEN BAND (5m PP 4045.6 only 0.98 below)
- 4:30 AM PT GOLD short (recon-np, Rejected down off session VWAP) loss -20.76
  - SHORT ON A RISING GREEN CANDLE (5m open 4047.18, price 4047.33)
- 5:00 AM PT BTC long (recon-np, Rejected up off +1σ) loss -20.73
  - LONG INTO AN UNBROKEN BAND (5m PP 81256.96 only 22.34 above)
- 5:20 AM PT BTC short (recon-np, Rejected down off Bollinger lower) sold 26.65
  - SHORT ON A RISING GREEN CANDLE (5m open 80894.81, price 80914.97)
  - SHORT INTO AN UNBROKEN BAND (5m S1 80900.31 only 14.66 below)
  - SHORT IN THE BOTTOM 33% (5m S1 80900.31 to session VWAP 80952.67, at 28%)
  - BTC SHORT NEARER GREEN THAN PINK (91% of the way pink 81060 to S1 80900.31)
- 5:51 AM PT BTC short (recon-np, Rejected down off -1σ) sold 6.27
  - BTC SHORT NEARER GREEN THAN PINK (62% of the way pink 80737.67 to S1 80595.83)
- 6:05 AM PT GOLD short (recon-np, Rejected down off +1σ) loss -20.87
  - SHORT IN THE BOTTOM 33% (5m PP 4053.43 to 5m R1 4057.66, at 30%)
- 6:05 AM PT BTC short (recon-np, Rejected down off -1σ) sold 21.71
  - SHORT ON A RISING GREEN CANDLE (5m open 80585.9, price 80646.57)
- 6:25 AM PT BTC long (recon-np, Rejected up off Green zone) loss -21.24
  - LONG ON A FALLING RED CANDLE (5m open 80555.18, price 80537.5)
- 6:45 AM PT GOLD long (recon-np, Failed break below session VWAP - rejected up) win 21.8
  - LONG INTO AN UNBROKEN BAND (5m PP 4050.48 only 0.17 above)
  - LONG IN THE TOP 33% (session VWAP 4048.43 to 5m PP 4050.48, at 92%)
- 7:02 AM PT BTC short (recon-np, Failed break above -1σ - rejected down) sold 14.95
  - SHORT ON A RISING GREEN CANDLE (5m open 80565.91, price 80618.45)
- 7:03 AM PT GOLD long (recon-np, Failed break below session VWAP - rejected up) loss -20.86
  - LONG INTO AN UNBROKEN BAND (5m PP 4049.64 only 0.09 above)
  - LONG IN THE TOP 33% (session VWAP 4048.46 to 5m PP 4049.64, at 92%)
- 7:30 AM PT GOLD long (recon-np, Failed break below Green zone - rejected up) loss -4.3
  - LONG ON A FALLING RED CANDLE (5m open 4043.22, price 4041.97)
- 7:34 AM PT BTC long (recon-np, Rejected up off Bollinger lower) sold 15.97
  - LONG INTO AN UNBROKEN BAND (5m PP 80487.38 only 24.03 above)
  - LONG IN THE TOP 33% (-2σ 80365.2 to 5m PP 80487.38, at 80%)
- 7:56 AM PT BTC long (recon-np, Rejected up off -2σ) sold 220.05
  - LONG IN THE TOP 33% (-2σ 80343.68 to 5m PP 80447.36, at 73%)
- 8:06 AM PT BTC short (recon-np, Rejected down off -1σ) loss -21.24
  - SHORT IN THE BOTTOM 33% (5m PP 80488.72 to -1σ 80613.63, at 33%)
- 8:35 AM PT BTC long (recon-np, Rejected up off Green zone) loss -21.24
  - LONG ON A FALLING RED CANDLE (5m open 80596.53, price 80569.5)
- 8:50 AM PT BTC long (recon-np, Rejected up off Bollinger lower) loss -21.24
  - LONG ON A FALLING RED CANDLE (5m open 80406.7, price 80385.15)
  - LONG INTO AN UNBROKEN BAND (5m S1 80386.86 only 1.71 above)
  - LONG IN THE TOP 33% (-2σ 80318.13 to 5m S1 80386.86, at 98%)
- 9:15 AM PT GOLD long (recon-np, Rejected up off Bollinger lower) sold 11.82
  - LONG ON A FALLING RED CANDLE (5m open 4038.91, price 4038.77)
  - LONG INTO AN UNBROKEN BAND (5m PP 4039.37 only 0.60 above)
- 9:25 AM PT BTC long (recon-np, Rejected up off Green zone) loss -21.32
  - LONG ON A FALLING RED CANDLE (5m open 80379.07, price 80360.47)
- 9:30 AM PT GOLD long (recon-np, Rejected up off -1σ) win 20.1
  - LONG ON A FALLING RED CANDLE (5m open 4040.3, price 4040.03)
- 10:21 AM PT GOLD long (recon-np, Rejected up off -1σ) loss -20.99
  - LONG ON A FALLING RED CANDLE (5m open 4040.19, price 4040.0)
  - LONG INTO AN UNBROKEN BAND (5m PP 4040.93 only 0.93 above)
- 10:25 AM PT BTC short (recon-np, Rejected down off -1σ) loss -21.37
  - SHORT ON A RISING GREEN CANDLE (5m open 80491.48, price 80500.59)
- 10:30 AM PT GOLD long (recon-np, Rejected up off -1σ) loss -3.25
  - LONG ON A FALLING RED CANDLE (5m open 4039.03, price 4038.54)
- 10:46 AM PT GOLD long (recon-np, Rejected up off Green zone) sold 15.29
  - LONG ON A FALLING RED CANDLE (5m open 4037.9, price 4037.46)
  - LONG INTO AN UNBROKEN BAND (-1σ 4038.29 only 0.83 above)
- 11:17 AM PT GOLD long (recon-np, Failed break below Bollinger lower - rejected up) sold 26.43
  - LONG IN THE TOP 33% (5m S1 4029.92 to 5m PP 4035.62, at 67%)
- 12:00 PM PT GOLD long (recon-np, Rejected up off -2σ) sold 26.43
  - LONG ON A FALLING RED CANDLE (5m open 4039.89, price 4033.85)
- 12:30 PM PT BTC short (recon-np, Rejected down off +1σ) loss -20.82
  - SHORT ON A RISING GREEN CANDLE (5m open 81100.63, price 81104.91)
- 12:30 PM PT GOLD short (recon-np, Failed break above +1σ - rejected down) loss -2.92
  - SHORT ON A RISING GREEN CANDLE (5m open 4053.12, price 4054.65)
- 2:05 PM PT BTC short (recon-np+recon-npo, Failed break above Red zone - rejected down) loss -20.9
  - SHORT ON A RISING GREEN CANDLE (5m open 81292.02, price 81304.96)
- 2:35 PM PT BTC short (recon-np+recon-npo, Rejected down off +1σ) loss -20.79
  - SHORT ON A RISING GREEN CANDLE (5m open 81082.49, price 81125.8)
  - BTC SHORT NEARER GREEN THAN PINK (54% of the way pink 81211.66 to S1 81053.21)
- 2:45 PM PT BTC long (recon-np+recon-npo, Tap-reject at fresh -1σ) sold 8.46
  - LONG INTO AN UNBROKEN BAND (5m PP 81180.52 only 16.39 above)
- 3:16 PM PT BTC long (recon-np+recon-npo, Tap-reject at +1σ) loss -20.97
  - LONG ON A FALLING RED CANDLE (5m open 81221.79, price 81172.95)
- 3:21 PM PT GOLD long (recon-np+recon-npo, Tap-reject at +1σ) loss -21.35
  - LONG ON A FALLING RED CANDLE (5m open 4060.28, price 4059.16)
  - LONG INTO AN UNBROKEN BAND (5m S1 4059.98 only 0.82 above)
- 3:31 PM PT BTC short (recon-np+recon-npo, Tap-reject at fresh VWAP) open None
  - SHORT ON A RISING GREEN CANDLE (5m open 81188.05, price 81215.58)
- 3:38 PM PT GOLD short (recon-np+recon-npo, Tap-reject at fresh -1σ) open None
  - SHORT ON A RISING GREEN CANDLE (5m open 4053.9, price 4054.46)

89 trades, 44 flagged, flagged P&L +218.53, clean P&L -43.35
### sovereign
- 12:00 AM PT BTC long (recon-sov, Rejected up off Green zone) sold 12.29
  - LONG ON A FALLING RED CANDLE (5m open 80750.67, price 80744.83)
- 12:21 AM PT BTC long (recon-sov, Failed break below 5m PP - rejected up) sold 26.43
  - LONG ON A FALLING RED CANDLE (5m open 80811.71, price 80801.15)
  - LONG INTO AN UNBROKEN BAND (fresh VWAP 80814.27 only 13.12 above)
  - LONG UNDER THE BLUE VWAP 80814.27 (bands small, 13.12 under)
- 12:42 AM PT BTC short (recon-sov, 1m rejection off fresh VWAP) sold 6.66
  - SHORT ON A RISING GREEN CANDLE (5m open 80828.35, price 80837.14)
  - SHORT INTO AN UNBROKEN BAND (5m PP 80818.76 only 18.38 below)
  - SHORT OVER THE BLUE VWAP 80814.48 (bands small, 22.66 over)
- 12:45 AM PT BTC short (recon-sov, Rejected down off Bollinger upper) loss -21.03
  - SHORT ON A RISING GREEN CANDLE (5m open 80818.61, price 80858.81)
  - SHORT INTO AN UNBROKEN BAND (5m PP 80843.79 only 15.02 below)
  - SHORT OVER THE BLUE VWAP 80814.79 (bands small, 44.02 over)
- 12:57 AM PT GOLD short (recon-sov, Rejected down off Red zone) loss -21.13
  - SHORT ON A RISING GREEN CANDLE (5m open 4037.97, price 4038.1)
  - SHORT INTO AN UNBROKEN BAND (5m PP 4038.05 only 0.05 below)
  - SHORT IN THE BOTTOM 33% (5m PP 4038.05 to 5m R1 4041.97, at 1%)
- 1:00 AM PT GOLD short (recon-sov, Failed break above Bollinger upper - rejected down) loss -20.8
  - SHORT ON A RISING GREEN CANDLE (5m open 4043.45, price 4044.44)
  - SHORT INTO AN UNBROKEN BAND (5m R1 4044.26 only 0.18 below)
  - SHORT IN THE BOTTOM 33% (5m R1 4044.26 to session VWAP 4047.02, at 7%)
- 1:15 AM PT GOLD long (recon-sov, Launched from the bottom third (low 4046.97) - a long until the top third) sold 14.26
  - LONG INTO AN UNBROKEN BAND (5m R1 4048.03 only 0.73 above)
- 1:21 AM PT BTC short (recon-sov, Failed break above Red zone - rejected down) loss -21.18
  - SHORT ON A RISING GREEN CANDLE (5m open 81036.24, price 81040.78)
  - SHORT INTO AN UNBROKEN BAND (5m PP 81017.44 only 23.34 below)
- 1:30 AM PT GOLD short (recon-sov, Rejected down off Red zone) loss -20.63
  - SHORT ON A RISING GREEN CANDLE (5m open 4049.99, price 4050.54)
- 1:45 AM PT BTC short (recon-sov, Rejected down off Bollinger upper) sold 16.17
  - SHORT INTO AN UNBROKEN BAND (5m R1 81546.91 only 11.01 below)
  - SHORT IN THE BOTTOM 33% (5m R1 81546.91 to 5m R2 81704.66, at 7%)
- 1:45 AM PT GOLD short (recon-sov, Candle falling from the top third) sold 14.95
  - SHORT ON A RISING GREEN CANDLE (5m open 4053.65, price 4055.6)
  - SHORT INTO AN UNBROKEN BAND (5m R1 4054.95 only 0.65 below)
  - SHORT IN THE BOTTOM 33% (5m R1 4054.95 to +1σ 4058.34, at 19%)
- 2:30 AM PT BTC long (recon-sov, Launched from the bottom third (low 81339.88) - a long until the top third) sold 21.27
  - LONG ON A FALLING RED CANDLE (5m open 81379.66, price 81364.91)
  - LONG INTO AN UNBROKEN BAND (5m PP 81380.19 only 15.28 above)
  - LONG IN THE TOP 33% (5m S1 81290.02 to 5m PP 81380.19, at 83%)
- 2:45 AM PT BTC long (recon-sov, Rejected up off 5m PP) sold 13.2
  - BTC LONG NEARER RED THAN PINK (59% of the way pink 81359.38 to R1 81482.83)
- 3:00 AM PT BTC long (recon-sov, Launched from the bottom third (low 81401.88) - a long until the top third) loss -20.7
  - LONG IN THE TOP 33% (5m PP 81387.35 to 5m R1 81506.42, at 68%)
  - BTC LONG NEARER RED THAN PINK (68% of the way pink 81387.35 to R1 81506.42)
- 3:45 AM PT GOLD short (recon-sov, Top third - seen as a short under 4047.94 (was: Rejected up off Bollinger lower)) sold 15.23
  - SHORT ON A RISING GREEN CANDLE (5m open 4046.67, price 4047.29)
- 3:46 AM PT BTC long (recon-sov, Rejected up off 5m PP) loss -20.43
  - BTC LONG NEARER RED THAN PINK (64% of the way pink 81442.05 to R1 81526.02)
- 4:05 AM PT BTC short (recon-sov, Rejected down off 5m PP) sold 6.49
  - SHORT INTO AN UNBROKEN BAND (5m S1 81314.18 only 12.44 below)
  - SHORT IN THE BOTTOM 33% (5m S1 81314.18 to 5m PP 81404.91, at 14%)
  - BTC SHORT NEARER GREEN THAN PINK (86% of the way pink 81404.91 to S1 81314.18)
- 4:15 AM PT BTC long (recon-sov, Launched from the bottom third (low 81205.85) - a long until the top third) sold 25.58
  - LONG ON A FALLING RED CANDLE (5m open 81257.83, price 81237.7)
  - LONG INTO AN UNBROKEN BAND (5m S1 81240.39 only 2.69 above)
  - LONG IN THE TOP 33% (+1σ 81195.36 to 5m S1 81240.39, at 94%)
- 4:15 AM PT GOLD short (recon-sov, Rejected down off session VWAP) loss -20.76
  - SHORT ON A RISING GREEN CANDLE (5m open 4045.59, price 4046.58)
  - SHORT INTO AN UNBROKEN BAND (5m PP 4045.6 only 0.98 below)
- 4:30 AM PT BTC long (recon-sov, Candle rising from the bottom third) loss -2.92
  - LONG ON A FALLING RED CANDLE (5m open 81283.99, price 81274.51)
  - LONG INTO AN UNBROKEN BAND (5m PP 81294.37 only 19.86 above)
  - LONG IN THE TOP 33% (5m S1 81220.33 to 5m PP 81294.37, at 73%)
- 4:30 AM PT GOLD short (recon-sov, Rejected down off session VWAP) loss -20.76
  - SHORT ON A RISING GREEN CANDLE (5m open 4047.18, price 4047.2)
  - SHORT INTO AN UNBROKEN BAND (5m PP 4046.2 only 1.00 below)
- 4:45 AM PT BTC long (recon-sov, Launched from the bottom third (low 81263.78) - a long until the top third) loss -20.75
  - LONG ON A FALLING RED CANDLE (5m open 81300.33, price 81269.09)
- 4:47 AM PT GOLD short (recon-sov, Launched from the top third (high 4049.25) - a short until the bottom third) sold 14.53
  - SHORT ON A RISING GREEN CANDLE (5m open 4048.03, price 4048.62)
  - SHORT INTO AN UNBROKEN BAND (session VWAP 4047.8 only 0.82 below)
- 5:00 AM PT BTC short (recon-sov, Top third - seen as a short under 81208.32 (was: Rejected up off Bollinger lower)) sold 14.13
  - SHORT ON A RISING GREEN CANDLE (5m open 81225.39, price 81234.62)
- 5:15 AM PT BTC short (recon-sov, Rejected down off 5m PP) sold 7.09
  - SHORT IN THE BOTTOM 33% (5m S2 80779.17 to 5m S1 80912.55, at 21%)
- 5:16 AM PT GOLD long (recon-sov, 1m rejection off Bollinger upper) sold 15.51
  - LONG INTO AN UNBROKEN BAND (5m R1 4052.75 only 0.13 above)
  - LONG IN THE TOP 33% (5m PP 4048.91 to 5m R1 4052.75, at 97%)
- 5:30 AM PT BTC short (recon-sov, Candle falling from the top third) sold 10.62
  - SHORT IN THE BOTTOM 33% (5m S1 80791.05 to 5m PP 80950.54, at 25%)
  - BTC SHORT NEARER GREEN THAN PINK (75% of the way pink 80950.54 to S1 80791.05)
- 5:52 AM PT GOLD long (recon-sov, 1m rejection off 5m PP) loss -20.94
  - LONG ON A FALLING RED CANDLE (5m open 4054.1, price 4052.95)
  - LONG INTO AN UNBROKEN BAND (5m PP 4053.3 only 0.35 above)
  - LONG IN THE TOP 33% (5m S1 4049.24 to 5m PP 4053.3, at 91%)
- 6:04 AM PT BTC long (recon-sov, 1m rejection off Green zone) loss -20.61
  - LONG ON A FALLING RED CANDLE (5m open 80627.31, price 80606.49)
- 6:15 AM PT BTC short (recon-sov, Rejected down off -1σ) sold 15.01
  - SHORT ON A RISING GREEN CANDLE (5m open 80572.48, price 80602.13)
- 6:30 AM PT BTC long (recon-sov, Failed break below Green zone - rejected up) sold 25.36
  - LONG ON A FALLING RED CANDLE (5m open 80545.66, price 80412.69)
  - LONG INTO AN UNBROKEN BAND (-2σ 80415.01 only 2.32 above)
  - LONG IN THE TOP 33% (5m S2 80380.88 to -2σ 80415.01, at 93%)
- 6:51 AM PT BTC long (recon-sov, 1m rejection off Bollinger lower) sold 14.97
  - LONG ON A FALLING RED CANDLE (5m open 80672.14, price 80619.4)
  - LONG IN THE TOP 33% (5m PP 80504.64 to -1σ 80660.44, at 74%)
  - BTC LONG NEARER RED THAN PINK (61% of the way pink 80504.64 to R1 80693.51)
- 7:00 AM PT BTC short (recon-sov, Candle falling from the top third) sold 10.9
  - SHORT INTO AN UNBROKEN BAND (5m PP 80566.53 only 19.60 below)
  - SHORT IN THE BOTTOM 33% (5m PP 80566.53 to -1σ 80654.24, at 22%)
- 7:03 AM PT GOLD long (recon-sov, Failed break below session VWAP - rejected up) loss -20.86
  - LONG ON A FALLING RED CANDLE (5m open 4049.62, price 4048.05)
  - LONG INTO AN UNBROKEN BAND (session VWAP 4048.46 only 0.41 above)
  - LONG IN THE TOP 33% (5m S1 4044.77 to session VWAP 4048.46, at 89%)
- 7:30 AM PT BTC long (recon-sov, Launched from the bottom third (low 80456.74) - a long until the top third) sold 18.91
  - LONG ON A FALLING RED CANDLE (5m open 80467.84, price 80459.9)
  - LONG IN THE TOP 33% (-2σ 80369.29 to 5m PP 80489.13, at 76%)
- 7:30 AM PT GOLD long (recon-sov, Failed break below Green zone - rejected up) loss -4.3
  - LONG ON A FALLING RED CANDLE (5m open 4043.22, price 4041.97)
- 7:45 AM PT BTC long (recon-sov, Candle rising from the bottom third) sold 15.76
  - LONG ON A FALLING RED CANDLE (5m open 80488.54, price 80476.34)
- 7:45 AM PT GOLD long (recon-sov, Candle rising from the bottom third) sold 15.36
  - LONG ON A FALLING RED CANDLE (5m open 4042.46, price 4040.87)
- 8:05 AM PT BTC short (recon-sov, Launched from the top third (high 80529.79) - a short until the bottom third) loss -21.01
  - SHORT ON A RISING GREEN CANDLE (5m open 80481.96, price 80510.5)
  - SHORT IN THE BOTTOM 33% (5m PP 80478.57 to -1σ 80614.12, at 24%)
- 8:21 AM PT GOLD short (recon-sov, Rejected down off Red zone) win 34.66
  - SHORT ON A RISING GREEN CANDLE (5m open 4043.52, price 4044.28)
  - SHORT INTO AN UNBROKEN BAND (5m PP 4043.29 only 0.99 below)
- 8:24 AM PT BTC short (recon-sov, Failed break above -1σ - rejected down) loss -21
  - SHORT INTO AN UNBROKEN BAND (5m PP 80544.51 only 4.83 below)
  - SHORT IN THE BOTTOM 33% (5m PP 80544.51 to -1σ 80607.69, at 8%)
- 8:34 AM PT GOLD long (recon-sov, Rejected up off Green zone) sold 17.83
  - LONG ON A FALLING RED CANDLE (5m open 4045.28, price 4042.81)
  - LONG INTO AN UNBROKEN BAND (5m PP 4043.09 only 0.28 above)
  - LONG IN THE TOP 33% (5m S1 4039.76 to 5m PP 4043.09, at 92%)
- 8:35 AM PT BTC long (recon-sov, Rejected up off Green zone) loss -21.24
  - LONG ON A FALLING RED CANDLE (5m open 80596.53, price 80569.5)
- 8:50 AM PT BTC long (recon-sov, Rejected up off Bollinger lower) loss -21.24
  - LONG ON A FALLING RED CANDLE (5m open 80499.52, price 80499.19)
  - LONG INTO AN UNBROKEN BAND (5m PP 80507.32 only 8.13 above)
  - LONG IN THE TOP 33% (5m S1 80386.86 to 5m PP 80507.32, at 93%)
- 9:08 AM PT GOLD long (recon-sov, 1m rejection off Green zone) loss -5.95
  - LONG ON A FALLING RED CANDLE (5m open 4041.67, price 4041.46)
- 9:23 AM PT GOLD short (recon-sov, Failed break above 5m PP - rejected down) loss -5.41
  - SHORT INTO AN UNBROKEN BAND (5m S1 4036.29 only 0.99 below)
- 9:30 AM PT GOLD long (recon-sov, Rejected up off -1σ) win 20.1
  - LONG ON A FALLING RED CANDLE (5m open 4040.3, price 4040.03)
- 9:55 AM PT GOLD short (recon-sov, Rejected down off Bollinger upper) sold 17.65
  - SHORT ON A RISING GREEN CANDLE (5m open 4039.95, price 4040.42)
  - SHORT INTO AN UNBROKEN BAND (5m PP 4039.87 only 0.55 below)
  - SHORT IN THE BOTTOM 33% (5m PP 4039.87 to 5m R1 4042.48, at 21%)
- 10:19 AM PT BTC short (recon-sov, Failed break above 5m PP - rejected down) loss -20.92
  - SHORT ON A RISING GREEN CANDLE (5m open 80372.77, price 80384.73)
- 10:30 AM PT GOLD long (recon-sov, Failed break below -1σ - rejected up) loss -2.77
  - LONG ON A FALLING RED CANDLE (5m open 4039.03, price 4038.46)
- 10:47 AM PT GOLD long (recon-sov, Rejected up off Green zone) sold 17.42
  - LONG ON A FALLING RED CANDLE (5m open 4037.9, price 4037.46)
  - LONG INTO AN UNBROKEN BAND (-1σ 4038.29 only 0.83 above)
- 10:55 AM PT BTC short (recon-sov, Candle falling from the top third) sold 17.15
  - SHORT ON A RISING GREEN CANDLE (5m open 80630.27, price 80640.73)
  - SHORT IN THE BOTTOM 33% (5m PP 80605.13 to 5m R1 80735.33, at 27%)
- 11:01 AM PT GOLD long (recon-sov, Failed break below 5m PP - rejected up) loss -20.85
  - LONG INTO AN UNBROKEN BAND (5m R1 4042.46 only 0.89 above)
- 11:10 AM PT BTC long (recon-sov, Launched from the bottom third (low 80626.64) - a long until the top third) loss -21.15
  - LONG ON A FALLING RED CANDLE (5m open 80772.61, price 80659.98)
  - LONG IN THE TOP 33% (-1σ 80544.84 to 5m PP 80706.32, at 71%)
- 11:31 AM PT BTC short (recon-sov, Failed break above session VWAP - rejected down) loss -20.72
  - SHORT ON A RISING GREEN CANDLE (5m open 80812.92, price 80900.1)
- 12:00 PM PT GOLD long (recon-sov, Rejected up off -2σ) sold 26.43
  - LONG ON A FALLING RED CANDLE (5m open 4039.89, price 4033.85)
- 12:22 PM PT BTC short (recon-sov, 1m rejection off +1σ) loss -21.11
  - SHORT ON A RISING GREEN CANDLE (5m open 81001.31, price 81039.17)
  - SHORT INTO AN UNBROKEN BAND (5m PP 81017.32 only 21.85 below)
  - SHORT IN THE BOTTOM 33% (5m PP 81017.32 to +1σ 81126.12, at 20%)
- 12:30 PM PT BTC short (recon-sov, Rejected down off +1σ) loss -20.82
  - SHORT ON A RISING GREEN CANDLE (5m open 81100.63, price 81104.91)
- 12:30 PM PT GOLD short (recon-sov, Failed break above +1σ - rejected down) loss -2.92
  - SHORT ON A RISING GREEN CANDLE (5m open 4053.12, price 4054.65)
- 12:55 PM PT BTC short (recon-sov, Rejected down off Red zone) sold 16.51
  - SHORT INTO AN UNBROKEN BAND (5m PP 81235.31 only 19.89 below)
  - SHORT IN THE BOTTOM 33% (5m PP 81235.31 to 5m R1 81407.87, at 12%)
- 1:06 PM PT BTC short (recon-sov, 1m rejection off Bollinger upper) sold 10.34
  - SHORT ON A RISING GREEN CANDLE (5m open 81443.5, price 81541.98)
- 1:08 PM PT GOLD long (recon-sov, Launched from the bottom third (low 4068.20) - a long until the top third) loss -21.1
  - LONG INTO AN UNBROKEN BAND (+3σ 4075.3 only 0.06 above)
  - LONG IN THE TOP 33% (5m R1 4074.81 to +3σ 4075.3, at 88%)
- 1:15 PM PT GOLD long (recon-sov, Rejected up off +2σ) loss -20.75
  - LONG ON A FALLING RED CANDLE (5m open 4070.84, price 4069.31)
- 2:05 PM PT BTC short (recon-sov, Failed break above Red zone - rejected down) loss -20.9
  - SHORT ON A RISING GREEN CANDLE (5m open 81214.19, price 81315.64)
  - SHORT INTO AN UNBROKEN BAND (5m R1 81306.22 only 9.42 below)
  - SHORT IN THE BOTTOM 33% (5m R1 81306.22 to +2σ 81456.88, at 6%)
- 2:35 PM PT BTC short (recon-sov, Rejected down off +1σ) loss -20.79
  - BTC SHORT NEARER GREEN THAN PINK (56% of the way pink 81211.66 to S1 81053.21)
- 2:45 PM PT BTC long (recon-sov, Failed break below 5m PP - rejected up) sold 8.46
  - LONG ON A FALLING RED CANDLE (5m open 81158.5, price 81157.96)
  - LONG INTO AN UNBROKEN BAND (+1σ 81162.63 only 4.67 above)
- 3:15 PM PT GOLD short (recon-sov, Rejected down off 5m PP) sold 13.24
  - SHORT IN THE BOTTOM 33% (5m S1 4061.34 to 5m PP 4065, at 31%)
- 3:16 PM PT BTC short (recon-sov, 1m rejection off 5m PP) sold 7.86
  - BTC SHORT NEARER GREEN THAN PINK (60% of the way pink 81216.33 to S1 81112.59)
- 3:30 PM PT BTC long (recon-sov, Rejected up off 5m PP) sold 10.5
  - LONG INTO AN UNBROKEN BAND (fresh VWAP 81217.63 only 8.38 above)
  - LONG IN THE TOP 20% (5m PP 81174.64 to fresh VWAP 81217.63, at 81%)
  - LONG UNDER THE BLUE VWAP 81217.63 (bands small, 8.38 under)

118 trades, 69 flagged, flagged P&L -19.62, clean P&L +78.03
