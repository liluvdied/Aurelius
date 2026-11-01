# Handoff: from the "$5 break" thread (Nov 1 2026, 09:58 UTC)

The work moves to the new thread **"Make the $5 break her entry"**. Everything below is saved in `/mnt/project-files/aurelius/commands/`.

## Installed and live, verified on her desk

| Fix | Command | What it does | Verified |
|---|---|---|---|
| fix579 | MAKE-THE-5-BREAK-HER-ENTRY | reachWall429 counts the pink as broken at her pink break of $5 BTC / 25c gold | R304, 07:48 UTC |
| fix580 | GAP-CLOSED | (a) The bonesDecide break candidate in recon.ts used to cast every break at $6. Now the pink casts at $5 / 25c, and BREAK, BREAK_DIST and PINK_BREAK for BTC go from $6 to $5. (b) `__PINKFLAT25` is false, so the pink tolerance follows her scale through `pinkSlide580`: gold 15%; BTC $25 under $100, 20% from $100 to $500, 15% over $500. | R305, 09:23 UTC: recon 0d95dd70f6402b4b, bandlock fc203ecf332a12ce, umpire SAFE 09:24, LIVE on, entries on, spine OK |

## Built and proven but NOT delivered to Love (the new thread owns both)

### fix581 PINK-SLIDE-OFF (Love 09:44 UTC: "Temporarily disable the pink slide rule until I rewrite it")
- **Files:** `commands/fix581/` (PINK-SLIDE-OFF.command, stage581/, diffs).
- **The change:** a single switch, `export const __PINKSLIDE_OFF581 = true`, added to engine.ts and bandlock.ts.
  - When it is on, `slideHold403`, `slideHoldBtc423` and `climbHold464` return "" and clear their latch.
  - The fix521 conditions UNDER THE PINK = NO LONGS (bandlock ~L670) and OVER THE PINK = NO SHORTS (~L752) are skipped.
  - The old slide code is kept on file.
  - five5m.ts (the walled-off 5M) is not touched.
- **Proof:**
  - The new test `tools/slide-off-581.cjs` fails on live and passes once the edit is in.
  - The full umpire run is identical between live and edited, apart from the golden hash drift the command re-seals.
  - A rehearsal on a private copy re-hashed golden and approved for engine.ts (401ed8ccc6054ae8) and bandlock.ts (2588531e7a398996).
- **Not yet done:** independent AI verification, and committing the stage to the desk (`data/STAGED-CHANGE-pink-slide-off-581/`, plus the launcher).
- **Guard:** live-base16 expects engine d853030b896fd2d3 and bandlock fc203ecf332a12ce, which is the post-fix580 desk.

### fix582 SESSION BAND $5 = HER ENTRY (Love 09:52 UTC: "she just waited until she was halfway down the channel to short ... Show me the line. Then remove the delay")
**Diagnosis (from her skip log):**
- **The fill.** The BTC short filled at 09:49:51 UTC at 77,947.7 ("Failed break above 5m PP - rejected down", 5.26x). Pink was 77,952, +1σ 77,851, +2σ 78,036, so the fill sat at the channel midpoint.
- **The setup she wanted.** At 09:48:02 her read had "Rejected down off +2σ" at around 77,973. It was dropped, then refused at 09:48:08 by `THE PINK in the read: an unbroken pink within 15% gold / 20% BTC`. At that point price was $21 over the pink and the tolerance was $37 (20% of $185).
- **The lines that held it.** These waited until the pink itself broke by $5:
  - recon.ts `pinkRead464` calls (around L716 main, L1022 rejection, L509/510 every book, L480 logger)
  - bandlock `cush514` PINK CUSHION
  - `reachWall429`, pink branch
  - `pinkShortWall464`, the unbroken-pink tolerance (mirrored by `pinkLongWall432` via `pinkBeyond459`)
- **Earlier in the window.** From 09:48 to 09:50 the "Rejected down off +2σ" candidates were also dropped by HER CANDLE, because the 5m candle was still rising (fix446 filter, recon ~L290) and `realFlipNow` showed no 2–5m flip.

**Built (in `commands/fix582-WIP/`: the edited files, diffs and test; no command yet):**
- **The waiver.** `sessFree582R` in recon.ts fires when a read off a SESSION band (σ / session VWAP / fresh VWAP: Rejected off, Nm rejection off, Failed break, or Break) has price already $5 BTC / 33c gold past that band in her direction. It arms `__sessFree582[asset:side]` for 10 seconds.
- **The read sites.** All five sites skip `pinkRead464` for such reads. The 5M lane `recon-rej5` is excluded at L525.
- **The walls.** bandlock `sessFree582()` makes the pink reach (reachWall429, pink only), the pink tolerance (`pinkShortWall464` / `pinkLongWall432`) and `cush514` stand down.
- **Built on top of fix581.** Base hashes: recon 0d95dd70f6402b4b, bandlock 2588531e7a398996. Edited hashes: recon e4fcf85a9fd2e2e7, bandlock 34b92f4ee1b24543.
- **Proof:**
  - The new test `tools/sess-five-582.cjs` fails on base and passes once the edit is in. It replays the 1:48 AM board. The $4-past case and pink reads do not arm the waiver, and without the waiver the pink still holds.
  - The full umpire run is identical apart from golden drift.

**Still to do:**
- Write the .command. It needs a spine re-sign, because recon.ts changes.
- Rehearse it, have another AI verify it, and stage it on the desk.
- **Caveat Love must see first.** This lets a session-band $5 entry short INTO an unbroken pink that sits within her 15/20% tolerance. That overrides her Oct 29 rule: "zero instance where she is within 15% of an unbroken pink that she shorts".
- The other delay, HER CANDLE (the 5m candle colour, waived only by `realFlipNow`), is untouched.

## Other notes
- **Skips are often her own rules.** Many of her reported "skips" were her 1.5x payout floor (fix520): contracts at 92–96¢ near the strike. That is her rule.
- **WEEKEND-PINK-25 must be rebuilt** before tomorrow 2–3 PM PT. Its guards expect pre-fix580 hashes, so it will STOP.
- **Rehearsal environment:** device_bash is wedged. Use device_stage_files / device_commit_files. The sync strips +x, so Love re-runs `find ~/Desktop -name "*.command" -exec chmod +x {} +`.
