# fix587 HER FLIP, NO EXCEPTIONS: proof packet (for Love's other AI)
Nov 1 2026. Staged at data/STAGED-CHANGE-her-flip-587 and Desktop/6-HER-FLIP-NO-EXCEPTIONS.command. **Not applied.**

## The 4:00 AM PT short (fill-audit.jsonl, 2026-11-01T12:00:13.830Z)
- recon-rej, KXBTC15M-26NOV010715-15, down, paid 25c. Label "Candle falling from the top third" (recon.ts L237-240, a thirds read whose own comment says it needs no flip).
- Logged 1m bars: 11:55-11:59 all green (11:59 o 77,833.99 c 77,856.67). The 12:00 candle was 13 s old, o 77,856.28. No 2/3/4/5m candle ever traded green and then turned red.
- **The line that let it leave:** bandlock.ts turnFlip530, the fix544 "BORN HER COLOUR" path (`born544`). It counts a new 2-5m candle as a flip when the previous one closed the other colour and price is $5 past the new open. No turn inside the candle is needed. auditGrade523 → impossibleGeo L3110 `if (flipRule) { if (!why && !foTurn && !turnFlip530(...)) ...}` accepted it.
- Replay on the logged bars: turnFlip530("btc","down",77851.28) = **true** (any tick $5 under the 12:00 open). The read's label requires spot ≤ 5m open − $10, so at the read and the door price was ≤ ~77,846, and the old door passed.

## Every other way past the flip at the last line
1. born544 (above).
2. `!foTurn`: a fake-out turn (1m close back across a band) skips the flip.
3. impossibleGeo L2810 `if (!(above > below)) return { why: "" }`: returns clear before the flip test is ever reached.

## The fix
- New `herTurn587` (bandlock): a 2/3/4/5m candle that traded the other colour, then crossed its open her way. Same frames and feed as fix530, no minimum. Born-her-colour does not count.
- `auditGrade523`, which is the last line before every POST (kalshi-live finalGate524 L791) and every retry knock (L1520): after impossibleGeo, `if (!why && (fl[2] || fl[6]) && !herTurn587(...)) why = "HER FLIP (fix587)..."`. This covers recon-tog, recon-rej and recon-togp, after every wall, so none of the three paths above can skip it.
- Untouched: delayed (recon-dly/dlyk return before the flags) and 5M. The engine fill auditor uses impossibleGeo directly, so this adds no new halts. No tolerance, wall or minimum changed.

## Tests
- tools/her-flip-587.cjs on the LIVE bandlock (71c22adee18932eb): **FAIL**. On the staged one (d73c070ce1e6aa8e): **PASS**. See her-flip-587-live-vs-fix.txt.
- Every tools/*.cjs run before and after: identical except the new test (tests-before-live.txt / tests-after-587.txt). The pre-existing failures are unchanged: sess-five-582, slide-off-581 (retired) and zone-pickup-448.
- Not run here: the desk's own umpire.py (it needs her live data). The command runs it and prints UMPIRE.
