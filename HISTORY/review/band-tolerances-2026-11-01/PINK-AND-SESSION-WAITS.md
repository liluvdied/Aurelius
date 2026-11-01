# The pink and session-band waits: what they blocked, and what would have done better
*Nov 1 2026. Report only. Nothing was changed.*

**\*\*\*\*\*\*\*\*\*\* A correction to my last report, first.** I said these waits kept her out of trades that did "as well as average or better". That was based on modelled contract prices, and checking against her real fills shows that model runs far too high. So this report uses only two things that need no price model: **win rate** (window close vs open, from her own price log) and **how far price ran her way after the read**, in dollars. On those, the waits held back trades that **won as often** as the ones she took but **ran less far**. So the waits are not simply wrong. The useful finding is *which part* of each wait helps and which part only blocks good trades. Samples are small (tens of windows per row). Treat these as directions, not certainties. **\*\*\*\*\*\*\*\*\*\***

## What she took (the yardstick)
| | Windows | Win rate | Price ran her way after entry |
|---|---|---|---|
| BTC, real fills | 68 | 47% | +$25.11 |
| Gold, real fills | 19 | 42% | −$0.01 |

## What the waits blocked
These come from her skip log, Oct 20 – Nov 1, main + rejection + paper lanes. "Windows" counts one per 15-minute window and side, at the first blocked read. Only contracts that would have paid 1.5x or more are counted.
- **Pink waits:** "THE PINK in the read", PINK CUSHION, PINK n%, NO LONG UNDER / NO SHORT OVER AN UNBROKEN PINK, OVER/UNDER THE PINK, HER WALL on 5m PP, BROKE IT THIS CANDLE.
- **Session-band waits:** HER THIRDS, falling from the top third / rising from the bottom third, NO LONGS IN THE TOP RUNG, HER WALL on a σ band, TARGET PAST A BAND.

| Wait | Reads blocked | Windows | At 1.5x+ | Win rate | Ran her way |
|---|---|---|---|---|---|
| Pink, BTC | 688 | 275 | 228 | 47% | +$11.81 |
| Pink, gold | 199 | 89 | 70 | 51% | +$0.59 |
| Session, BTC | 321 | 180 | 126 | 50% | +$4.39 |
| Session, gold | 182 | 92 | 58 | 52% | +$0.81 |

**By channel width** (1.5x+ windows):
- **Pink, BTC:**
  - under $100: 29 windows, 48%, +$11.32
  - $100–200: 69 windows, 46%, +$3.00
  - $200–350: 63 windows, 44%, +$14.78
  - over $500: 67 windows, 49%, +$18.31
- **Pink, gold:**
  - $5–10: 22 windows, 64%, +$2.70
  - $10–20: 24 windows, 42%, −$1.05
  - over $20: 24 windows, 50%, +$0.30
- **Session, BTC:**
  - under $100: 35 windows, 51%, +$7.94
  - $100–200: 38 windows, 55%, +$10.66
  - $200–350: 31 windows, 48%, −$1.02
  - over $500: 22 windows, 41%, −$4.47
- **Session, gold:**
  - $5–10: 21 windows, 48%, +$1.25
  - $10–20: 27 windows, 52%, +$0.31
  - over $20: 10 windows, 60%, +$1.23

## Every option tested, with its numbers
"Released" = the windows the option would have let through. "Still held" = the windows it keeps blocking. A good option releases the better windows and keeps holding the worse ones.

### Pink, BTC (228 blocked windows: 47%, +$11.81)
| Option | Released | Still held |
|---|---|---|
| **Hold only within 5% of the channel from the pink** | 179: **49%, +$20.67** | 49: **39%, −$20.53** |
| Hold only within 10% of the channel | 140: 49%, +$17.41 | 88: 44%, +$2.91 |
| Release on channels over $500 | 67: 49%, +$18.31 | 161: 46%, +$9.11 |
| Release when the pink is in the far third (her slide rule, fix584) | 75: 48%, +$19.84 | 153: 46%, +$7.88 |
| Release rejection reads | 156: 47%, +$15.88 | 72: 47%, +$3.00 |
| Release with 8+ min left | 196: 48%, +$11.74 | 32: 41%, +$12.24 |
| Release when the pink is mid-channel | 87: 43%, −$2.24 | 141: 50%, +$20.48 *(worse: keep holding these)* |

### Pink, gold (70 blocked windows: 51%, +$0.59)
| Option | Released | Still held |
|---|---|---|
| **Pink in the far third (her slide rule, fix584)** | 24: **58%, +$1.92** | 46: 48%, −$0.09 |
| Hold only within 5% of the channel | 49: 55%, +$0.98 | 21: 43%, −$0.31 |
| Release rejection reads | 51: 53%, +$0.36 | 19: 47%, +$1.22 |
| Hold only within 10% | 35: 51%, +$0.46 | 35: 51%, +$0.73 |

### Session band, BTC (126 blocked windows: 50%, +$4.39)
| Option | Released | Still held |
|---|---|---|
| **Hold only when the band ahead is within 20% of the channel** (thirds = 33% today) | 99: **56%, +$10.61** | 27: **30%, −$18.43** |
| Release on channels under $200 | 73: 53%, +$9.36 | 53: 45%, −$2.46 |
| Hold only within 10% | 109: 50%, +$4.62 | 17: 47%, +$2.88 |
| Release rejection reads | 73: 45%, −$4.79 | 53: 57%, +$17.03 *(worse)* |

### Session band, gold (58 blocked windows: 52%, +$0.81)
No option helped. Every version released the weaker windows (46–50%) and kept holding the stronger ones (54–80%, small samples). **The gold session wait is doing its job. Keep it as it is.**

## In one line each
- **BTC pink:** the wait is right when price sits within ~5% of the channel from the pink (39% win, −$20). Beyond that it mostly blocks good trades.
- **Gold pink:** her own slide-rule idea (fix584, waiting to run) is the best fit in the data.
- **BTC session band:** the band ahead matters within ~20% of the channel (30% win, −$18). The 33% thirds hold back windows that won 56%.
- **Gold session band:** keep.
- Every option above changes a cornerstone. None of it moves without Love's words.

Scripts and raw output: `replay/waits.py`, `waitstats.py`, `options.py` and `*-output.txt`.
