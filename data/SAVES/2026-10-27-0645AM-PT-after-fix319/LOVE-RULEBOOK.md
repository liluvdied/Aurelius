# Aurelius rulebook — READ THIS FIRST, every new chat

Love built Aurelius. Every new Claude chat starts with no memory, so this file is how she never has to repeat herself.

**Before asking Love ANY question about a rule:** search `data/overnight-fixes.log` (her diary, every fix with her words). If the answer is there, do not ask. Re-asking things she already answered devastates her.

**When she sets or changes a rule:** write her FULL words verbatim in the diary, not a summary. (Oct 27: the doji rule was built backwards because the diary only kept "just a doji candle after a continued trend".)

## How we work
- Nothing changes in her code without Love's say-so (the firewall). Quote her words in the diary, thaw only the named file, edit, update approved-model.json + golden-baseline.json (+ spine-lock.json for recon.ts), refreeze, run tools/verify-golden.py.
- Turn live off before editing, back on after. Never turn her on live unless Love says.
- Changing liveBook? Also re-sign golden-baseline "sealLiveBook", or THE SEAL blocks every order.
- Paper books never meet the walls. "Main took it on paper" ≠ main would fill live.
- Do exactly what she asks, nothing else. 12-hour times, total dollars. Never delete, back up first. No edits right at :00/:15/:30/:45.

## Direction
- Trade price direction on the same side of the band. Red candle that broke a band = short; inverse.
- Falling candle after a pink break = short 100%; inverse.
- Breaks count when they happen (no 1m close wait). Two bands in one candle: last break applies.
- A band isn't unbroken until a candle closes outside it.
- Never long a candle falling through a band; long a falling candle only at a band that rejects. Mirror.
- 1/2/3/5m candle rejecting a band and pushing off = clear.
- DOJI (fixed Oct 27, fix315): after a doji that follows a continued trend, the candle AFTER the doji decides. Falling = short only, rising = long only. Love: "it is SHORT ONLY when a doji is followed by a candle falling, it is a continuation of the candle after the doji."

## Channel thirds
- No longs top 33% / no shorts bottom 33% when the band is unbroken (immutable).
- Rising from the bottom 33% = long, falling from the top 33% = short.
- Gold: no longs top 40% pink→red, no shorts bottom 40% pink→green. BTC: no shorts under session -2σ (bottom rung).

## Zones & cushions
- Green = longs, red = shorts. Gold zones are rejection only.
- Gold zone clearance $1.50 ($3 on break into a zone). BTC $25 at ≤$100 channel, $50 or 10% at $180+.
- Pink cushion: main gold max(10%, $2); BTC $50 or 10%. No-pink copy gold flat $1.50 (Love kept it Oct 27).
- No long in the red zone right over a band (half a zone height), mirror (fix242, her choice).
- Bollinger cushion: BTC $50 from price (fix173).

## Books
- Main (recon-tog): the model everything copies.
- No-pink copy (recon-togp): main 1:1, same code, same walls, minus pink trades. NOT "band rejections only" (tried and undone Oct 27 — it dropped her thirds longs).
- Delayed twin: first band touched after the initial move, no 30s wait, exempt from pink, $2.
- Rejection model (recon-rej): its best stretch was Oct 25 evening (+$633 paper) when it disagreed with main ~1 in 4 windows; since Oct 26 evening it matches main every window.

## Money
- One executed direction per window. Never two open on Kalshi. Never double her manual position.
- TP 10% or $2 whichever first. Polymarket min $5.

## Live state (Oct 27, 4:06 AM PT)
- Only the no-pink copy is live, gold + BTC, $1 everything. Main/rejection/twin on paper.
- Gold's 4 AM off hour lifted for tonight (old list in live-switch liveSkipHoursPrev315). Pre-tonight settings in live-switch fix313Prev.

## ONE BOOK AT A TIME (Oct 27 2026, 5:04-5:06 AM PT)
Love: "if i am working on ONE book with you, please do not assume i want every book changed." / "make sure my main book doesn't. move. an. ATOM." / "never change a book without asking me again please hun."
-> A fix goes only on the book she names. Before installing, tell her exactly which books it touches. fix316 (5:08 AM) restored the whole desk to pre-fix295; fixes 295-315 are kept in data/SNAPSHOT-TODAY-2026-10-27-0457am to add back on her word.

## fix319 — REJECTION MODEL ONLY (Oct 27 ~6:23 AM PT)
Love: "dude doji is inconsequential... i never said i want her to stop taking trades from the top/bottom 3rd hun. i want her to trade exactly that. not skip them... the $10 level can stay. last wrung channels can stay. steep slope can stay. pitched over 45 degrees. not a small tilt. make her only wait for pink to clear if it is in the top 10% or bottom 10% of the channel. enter in at a candle flip of 1, 2,3,4, 5M candles. that's it. that. is. it. NOTHING. else." + card "Rejection model only".
- Pink only blocks the rejection model when the pink sits in the top 10% or bottom 10% of the channel.
- The rejection model enters on a flip of any 1, 2, 3, 4 or 5m candle her way.
- STEEP SLOPE pending. Love 6:30 AM: "can you kind of just have her match what a 45 degree angle looks like and have her compare the two…. it's gonna be different sizes every session. making it a full sigma is going to make her miss every move that DOESNT move a full sigma, but still puts the bands on a slope." Plan: measure 45° the way her auto-scaled chart draws it (band move / on-screen price range vs time / on-screen time span), calibrated from her screenshot. Not a fixed sigma.
- Love 6:32 AM on slope (explaining what a slope is, NOT reporting a block): "the bands aren't sloped right now they're flat. luv, slope = downhill bands = downhill consider them sloped picture putting a skateboard on the slope if it would roll it's sloped". 6:36 AM: "i wasn't talking about any trade being on a slope right now hun, you asked me what about the slopes and i answered". STEEP SLOPE today = fix104 (VWAP > 1/2 sigma in 15 min -> needs tap of next band out) + fix194 (on a slope short only top third, long only bottom third; all books). Unchanged; Love's 45 degree / skateboard definition still to be turned into a measure if she asks.
