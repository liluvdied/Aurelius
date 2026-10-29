# What came out of her before the 6:45 PM restore

Made Oct 28 2026, about 8:40 PM PT. These are the rules switched off or lost **before** you asked for the checkpoint. They're the reason you asked for it. Sources: switches in her code today, and the diary (`data/overnight-fixes.log`).

## Switched off by a card tap, never your typed words
| When | What came out | Books | Switch in her code | Status now |
|---|---|---|---|---|
| Oct 20, 9:33 PM | **Your $1.50 gold / $50 BTC reach wall** (no trade into an unbroken session band or pink within reach), plus the red/green zone reach | every book | `bandlock.ts:531` REACH_RETIRED | **Back on main + rejection since 8:30 PM** (fix429) |
| Oct 22, 7:34 PM | The trend-through-the-bands wall (card "Drop it", fix106) | — | `bandlock.ts:2743` | still off. Want it back? |
| Oct 22, 6:52 PM | Her 1m candle waiver, so candle colour always wins (card, fix102) | main | `recon.ts:294` | your flip is now 2-5m |
| Oct 23 | 2-hour sigma carry cutoff (card "Keep the carry until they widen", fix164) | — | `bandlock.ts:1884` | still off |
| Oct 24, 10:20 PM | BTC Bollinger bounce wall (card "Drop it", fix178) | BTC | `bandlock.ts:2667` | still off. Want it back? |
| — | 5M candle door (card "Drop the 5m door", fix211) | 5M | `engine.ts:3285` | 5M is frozen, untouched |

## Lost in rollbacks / whole-file restores
| When | What came out | How |
|---|---|---|
| Oct 27, 5:08 AM | the doji rule (fix315) and fixes 295-315 | the "pre-295" rollback |
| Oct 27 | the copy's flat $1.50 gold pink cushion (fix312) | fix316 rollback |
| Oct 27 | gold's 20% over $10 band widths (the sliding share) | a later fix; you caught it ("got taken out without my permission") |

## Turned off by later fixes, with your words in the comment
- `bandlock.ts:768`: the old session-ahead wait at the door ("price breaks pink band = get in", Oct 17 4:20 PM). Later rebuilt as fix413.
- `bandlock.ts:2509`: PINK FIRST, replaced by PINK 10% (fix62).
- `recon.ts:490`: the wall on re-aims (fix285).
- `bandlock.ts:78` + `recon.ts:227`: the 3 PM quiet-hour channel.

---
**From tonight on:** only your typed words can remove a rule (cornerstone 0j). Any install or restore that would take one out is refused. To check it yourself, double-click `CHECK-NOTHING-REMOVED.command` in your Aurelius folder.
