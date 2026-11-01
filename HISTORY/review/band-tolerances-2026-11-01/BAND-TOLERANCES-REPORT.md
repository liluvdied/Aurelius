# Aurelius band tolerances: what's live, and replay-tested sliding scales
*Nov 1 2026. A read-only report. Nothing was changed. Every suggestion below waits for Love's own words.*

> **Correction (Nov 1, later):** the pink and session-band rows below lean on the modelled price, which runs far too high when checked against her real fills. The price-free breakdown in `PINK-AND-SESSION-WAITS.md` replaces those rows. The Bollinger and zone direction still holds there, but check it with the same price-free method before acting on it.

**\*\*\*\*\*\*\*\*\*\* Read this first.** This replay gives a direction, not proof. Kalshi's settlement records and the asks behind skipped reads aren't on the desk. So the "win" is rebuilt from the desk's own price log (window close vs window open). The contract price is modelled from distance and time left. That model reads about 5¢ high for every trade alike: real fills broke even while the model scored them +4¢. So compare a blocked group with the average, not with zero. Each wall is tested alone, over the reads the model actually made. The data covers Oct 20 – Nov 1 for BTC and Oct 20 – Oct 30 for gold, since gold's log stops on Oct 30. **\*\*\*\*\*\*\*\*\*\***

## 1. Every band tolerance live right now (desk = fix580)
"Channel" (W) means the session band under price to the session band over it (σ bands + session VWAP).

| Wall | BTC | Gold | Where |
|---|---|---|---|
| **Pink tolerance** (no trade into an unbroken pink within it) | $25 if W < $100 · 20% of W at $100–$500 · 15% over $500 | 15% of W | bandlock `pinkSlide580` L721, recon `pinkSlide580R` L453; used by pinkRead464, cush514, pinkFar503, pinkBeyond459, the upslope wall and reachWall429 |
| Pink break (frees the pink) | $5 | 25¢ | recon pinkRead464 `brk`, bandlock `PINK_BREAK432` |
| Weekend $25 pink overlay | off (`__PINKFLAT25 = false`) | off | bandlock L718, recon L451 |
| **Session band ahead** (thirds) | the band ahead must be more than 33% of W away | same | bandlock L2073 |
| Read-side reach | 20% of W (`REACH_PCT`) | 20% | recon L43 / L657 |
| Old flat session reach | retired (`REACH_RETIRED = true`) | retired | bandlock L538 |
| Session/pink break | $5 (`BREAK`, `BREAK_DIST`) | 33¢ | recon L35, bandlock L1610 |
| Thirds release | $8 (`FROZEN_THIRD_DIST`, `RT_DIST`), or $5 once 3-THIRDS-FREE-AT-5 runs | 33¢ | bandlock L438 / L847 |
| **Bollinger cushion** | $50 (`BB_TOL559`) | $1.50 | bandlock L2738 |
| **Red/green zone**: inside it | never | never | bandlock L2747 / L2751 |
| Zone edge tolerance | $0 (`ZONE_TOL497`) | $1.50 | bandlock L2738 |
| Zone reach (reachWall429) | 24% slide (`ZONE_REACH_PCT`) | $1 | bandlock L529 / L569 |
| 55% wall (pink to green/red) | 55% | 55% | `zoneGuard` 0.55, bandlock L2764 |
| Pink to green | 50% (55% on a flip) | same | bandlock L2943 |
| Steep slope | long only in the bottom third | same | bandlock L3070 |
| Tap | $3 | 30¢ | recon L36 |
| Payout floor | 1.5x (fix520) | 1.5x | kalshi-live |

## 2. How the replay works (so another AI can check it)
- **Reads:** 5,363 tradable model reads (BTC 3,486, gold 1,877) from main, rejection and paper lanes. They come from `recon-skips.jsonl` plus 80 real fills from `fill-audit.jsonl`, one per ticker + side + minute. "Tradable" means the modelled price is 66¢ or less, which is her 1.5x floor.
- **Bands at each read:** taken from `band-log.jsonl`, the nearest snapshot within 90 s: pink, σ bands, VWAP, 5m R1/R2/S1/S2 zones and the Bollinger.
- **Win:** price at the window close vs the window open, both from the band log.
- **Edge:** win (1 or 0) minus the modelled fair price. A wall *earns its place* when the trades it blocks have edge **below** the average (BTC +6.8¢, gold +7.4¢).
- **Levels tested:** 0, 5, 10, 15, 20, 25, 33, 40 and 50% of the channel, in each channel-width bucket (BTC: under $100, $100–200, $200–350, $350–500, over $500; gold: under $5, $5–10, $10–20, over $20).
- **Stability check:** split at Oct 28 so each setting is tested on two separate weeks.
- **Scripts and outputs:** `replay/` (build.py → model.py → sweepT.py / uni.py / compare.py).

## 3. What the replay found, wall by wall

| Wall | Trades it blocks | Verdict |
|---|---|---|
| **Bollinger, BTC** | edge −1.6¢ now (avg +6.8¢), win 48% | **Earns its place.** Best at about 25% of the channel; a flat $50 is too wide on channels under $100 |
| **Zone, BTC** | edge −5¢ to −13¢ within 10–20% of the channel ($100–$350 channels) | **Earns its place, and it's under-used.** BTC has no zone edge tolerance today |
| **Bollinger, gold** | +3.9¢ at $1.50 | Neutral to slightly costly. **Keep $1.50.** A % scale tested worse |
| **Zone, gold** | +5.1¢ at $1.50 | Mild cost. Only channels under $5 gained, at about 5% |
| **Pink, BTC + gold** | +8.6¢ BTC / +9.4¢ gold, win 48–49% vs 47% average | **At no width did the blocked trades do worse than average.** Smaller was better at every width except BTC $350–$500 (only ~50 reads) |
| **Session band ahead** | +9.8¢ BTC / +11.8¢ gold | Same pattern as the pink. Only BTC $350–$500 and gold over $20 gained (small samples) |

**Plainly:** in these two weeks, the walls that kept her out of the Bollinger and the zones protected her. The pink and session-band waits mostly kept her out of trades that did as well as the average, or better. That matches what Love saw: she missed the rejection above and waited for the pink.

## 4. Suggested set-and-forget scales (each tested on both weeks)
Totals are kept edge in model points across all tradable reads (higher = better), shown as week 1 / week 2. Each line was tested on its own.

| Wall | Now | Suggested | Now → suggested |
|---|---|---|---|
| Bollinger, BTC | flat $50 | **25% of the channel, capped at $50** (e.g. $15 on a $60 channel; $50 from $200 up) | +243 → **+250** (117/126 → 115/135) |
| Zone, BTC | inside only, $0 edge | **inside + 15% of the channel, capped at $40** | +240 → **+251** (113/126 → 114/137) |
| Bollinger, gold | $1.50 | **keep $1.50** | the % scale was worse (+133 → +131) |
| Zone, gold | $1.50 | 5% of the channel (≈ 45¢ on a $9 channel). *Touches cornerstone "zone reach $1.50". Info only.* | +128 → +137 |
| Pink, BTC | $25 / 20% / 15% | 5% of the channel, $5 break unchanged. *Touches cornerstone "pink tolerances". Info only.* | +132 → **+205** (63/68 → 91/114) |
| Pink, gold | 15% | 5% of the channel, 25¢ break unchanged. *Cornerstone. Info only.* | +96 → **+127** |
| Session ahead, BTC | 33% thirds | 5% of the channel. *Cornerstone "session band wait (thirds)". Info only.* | +159 → +215 |
| Session ahead, gold | 33% thirds | 5% of the channel. *Cornerstone. Info only.* | +81 → +125 |

The Bollinger and zone lines are the cleanest wins: same direction on both weeks, nothing she holds sacred is touched, and one rule covers every width. The pink and session lines show the biggest difference, but they rewrite cornerstones she set by hand. They are here as information only.

## 5. What would make this replay exact
1. Log Kalshi's own settlement result per ticker (one line per window). The win would then be real, not rebuilt.
2. Log the ask on every skipped read (most skip lines show `ask: 0`). The edge would then be real money, not modelled.

With both, the same scripts give a replay to the cent. Both are read-only loggers that change no trade.
