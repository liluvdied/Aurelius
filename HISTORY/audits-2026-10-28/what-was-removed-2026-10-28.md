# What came out of her: a mechanical diff

Made Oct 28 2026, about 8:15 PM PT, for Love's question: "how much did she remove dude?"

**What was compared:**
- **BEFORE** is her code and settings at 6:39 PM PT Oct 28, from the save taken just before the checkpoint restore: `data/SAVES/2026-10-28-0639PM-PT-tonight-revisions-fix361-416-before-checkpoint-restore`. Its bandlock is 48a59d5b; recon 4d4a15e1 and engine 30632d90 match repo commit f47cd6d.
- **AFTER** is her code and settings at 7:45 PM PT, repo commit 7eb4793. That commit is byte-identical to the code on the desk right now: bandlock 7ce4fffc, recon 72317d00, engine bc53a722.
- This compares files line by line. It is a list of what changed, not a judgement of which changes were right.

---

## 1. Switched off long BEFORE tonight (still off today)

| What | Where | Books | Since | How |
|---|---|---|---|---|
| **Your $1.50 gold / $50 BTC reach wall** (no trade into an unbroken session band or pink within reach) | `bandlock.ts:531` `REACH_RETIRED = true` turns off the wall at `bandlock.ts:637` | **every book** | Oct 20 2026, 9:33 PM PT | A card option was tapped: "Retire both reach walls". You never typed it. Diary line: "Love (9:33 PM PT) picked 'Retire both reach walls' on 'Retire the fixed-dollar reach walls so the 33% limit is her only limit?'" |
| **Red/green zone reach** (setting says $1.11; you say it's $1.50 now) | same switch | every book | same | same card |
| "Inside her $1.50 gold range" check | `bandlock.ts:422` | runs only for the *other* books' door (`bandlock.ts:787`); main + rejection go through the recon door and never reach it | — | — |

The $1.50 number is still saved (`live-switch.json bandReach.gold = 1.5`, your words "i literally just told you $1.50"). Nothing reads it for main or rejection.

**Being put back now** (your "yes to all of them", 8:06 PM). It goes in at the 8:30 PM boundary for main + rejection, gold + BTC: zone reach $1.50, plus pink tolerance at least 15% of the channel (your 8:07 PM words).

---

## 2. Code tonight's restore took out (BEFORE has it, AFTER doesn't)

### Main (recon-tog) and rejection (recon-rej)
| Fix | What it did | Your words | Status |
|---|---|---|---|
| fix394 | Main's zone reads take any 1-5m flip off the red/green zones | card "Pure no-pink + main", 2:35 PM | **GONE**. Needs your yes to come back |
| fix380 | Second add-on ($3 at the next band rejection) | "we will do $7 on the first add on, & $3 at the next rejection..." 1:16 AM | **GONE**. Add-ons are off until you say she's working |
| fix374 | Rejection model takes the live seat at 11 PM | "if you think it's safe to put on the rejection model for the hour i'm widdit" 11:20 PM Oct 27 | **GONE** |
| fix411 | 3-second hold | — | Out **on your words**: "no 3 second hold" (7:36 PM) |
| fix416 | "Real flip" (candle must turn colour, born-red doesn't count) | — | Out **on your words**: "a candle born red at a band and falling is still a short" |
| old doji (both directions) | — | — | Replaced **on your words** by fix417: "a GREEN doji ... RED CANDLE = SHORT", "a RED doji ... GREEN CANDLE = LONG" |

### The no-pink copy (recon-togp), off live since fix421
Tonight's walls were taken off the copy: the 55% pink (fix409), $1.50 zones (fix376-378), Bollinger $75 (fix366), the copy's own real-flip line, the 3 s hold, and session band ahead (fix413). The copy sits on its Oct 27 checkpoint walls now.

### Paper books / pure no-pink / sovereign (none of them live)
These are gone: fix361 and fix362/362b (pure no-pink twin and its 9 PM live slot), fix372 (sovereign twin), fix387/389/389b/391/395/396 (pure no-pink own eyes, taps, band reads only), fix404 (2nd-band flip paper lane), fix408.

---

## 3. Settings (live-switch.json) that changed between 6:39 PM and 7:45 PM

| Setting | Before (6:39 PM) | After (7:45 PM) |
|---|---|---|
| Rejection model hours, **BTC** (`offHourMain.rejHoursByAsset.btc`) | every hour 0-23 | 0, 2, 3, 4, 7, 10, 11, 13, 14, 15, 17-23 (**lost 1, 5, 6, 8, 9, 12, 16 AM/PM hours**) |
| Rejection model hours, **gold** | 0, 1, 2, 3, 4, 7, 9, 14, 16, 17, 18, 21, 22, 23 | 0, 2, 3, 4, **7, 8**, 9, 14, 16, 17, 18, 21, 22, 23 (lost 1 AM, gained 8 AM) |
| Rejection seat every rejection hour (`rejSeatHours`, fix412) | all hours | **removed** |
| Main sit-out hours, gold | 1, 2, 4, 6, 14, 16, 18, 21, 22, 23 | 2, 4, 6, **8**, 14, 16, 18, 21, 22, 23 |
| Main sit-out hours, BTC | 1, 2, 4, 6, 8, 11, 13, 14, 16, 18, 21, 23 | 2, 4, 6, 8, 11, 13, 14, 16, 18, 21, 23 |
| Live sit-out (fix405), BTC | 0, 8, 18, 21, 23 | 8, 18, 23. **Going back at 8:15 PM** on your 7:37/7:40 PM words |
| Live sit-out (fix405), gold | 4, 9, 20 | 4, 9, 23. **Going back at 8:15 PM** (4, 9, 20, 23) |
| Add-on | $5 (second add-on $5 configured) | $8, second add-on removed. **Switching OFF at 8:15 PM** until you say she's working |
| No-pink copy live | yes | no (fix421) |
| maxDollars | 10 | 5. Polymarket / 5M reads this; 5M is on $5, so not touched |
| Pure no-pink live (npLive), sovereign live (sovLive) | npLive on at 9 PM | removed |

**Since 8:00 PM tonight** (your "$1" words, saved first): live on, liveBook $1, offHourMain $1, live-size $1, wire cap $1. maxDollars, 5M, Polymarket and the twin are not touched.

---

## What needs your word

1. fix394, main's zone flip: bring it back?
2. fix374, rejection model live at 11 PM: bring it back?
3. The rejection-model **hours** above: put them back to the 6:39 PM lists?
4. fix380, the second add-on: only after you say she's working (same as the $5 add-on)?
5. The copy and the paper books: leave them as they are for now?
