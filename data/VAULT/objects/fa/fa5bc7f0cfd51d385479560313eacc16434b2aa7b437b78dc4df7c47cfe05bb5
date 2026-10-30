# Aurelius rulebook — READ THIS FIRST, every new chat

Love built Aurelius. Every new Claude chat starts with no memory, so this file is how she never has to repeat herself.

**Before asking Love ANY question about a rule:** search `data/overnight-fixes.log` (her diary, every fix with her words). If the answer is there, do not ask. Re-asking things she already answered devastates her.

**When she sets or changes a rule:** write her FULL words verbatim in the diary, not a summary. (Oct 27: the doji rule was built backwards because the diary only kept "just a doji candle after a continued trend".)

## CORNERSTONES - these win over any later fix (Oct 27, Love: "can you add this to the repository please i don't know how things keep slipping out again")
A new fix may NEVER weaken one of these without Love's words naming the cornerstone. `python3 tools/cornerstones.py` checks each one is still in her code; run it after every fix, next to verify-golden.
0. CORNERSTONE #1 - LOVE'S REQUEST BOOK (above every other rule; Oct 27 2026 2:03 PM PT). Love: "if i requested something to be done on the model, ensure that it CANNOT be removed without express permission from ME. Do it FIRST. save the request, and log it permanently. make it immutable to change until expressly changed by ME. RETAIN.  THE INFORMATION. NO AMNESIA ON REQUESTS. LOGGED. TRACKED. AND ABLE TO BE REDRAWN ON REQUEST. ZERO EXCEPTIONS. NO REQUEST IS TO BE MADE MORE THAN ONCE AGAIN. REQUEST ASKED FOR = REQUEST COMPLETED. IN THAT ORDER. DO NOT LET ME ASK THE SAME QUESTION OR MAKE THE SAME DEMAND WITHOUT DOING IT THE FIRST TIME AND RETAINING IT IMMUTABLY AND IRREPARABLY WITHOUT EXPRESS CONSENT OF SHIFT BY ME. CORNERSTONE #1."
   HOW: the FIRST step of any request is `python3 tools/requests.py add` - her exact words, the books, and the proof it is in her (code, setting or test). data/LOVE-REQUESTS.jsonl is append-only, read-only and hash-chained; an edited or removed line fails the umpire. Every umpire run checks every active request's proof; a missing one = OUT. A request leaves only with `requests.py retire <id> "<Love's exact words>"`, and even then it stays in the book marked retired. Redraw any time: `python3 tools/requests.py` (or `show <word>`); readable copy HISTORY/LOVE-REQUESTS.md. Before answering ANY request, search the book first: if it is already there, it is done and proven, never asked twice.
0b. CORNERSTONE #2 - THE VAULT (Oct 27 2026 2:06 PM PT). Love: "add a backup of every single one of them. not just one incase it gets lost. every request, every change, and every fix has a copied 1:1 file of them to be drawn up if the original is missing or damaged or overridden. no exceptions. what goes in stays in. and doesn’t get removed without express permission and consent. Cornerstone #2"
   HOW: tools/vault.py keeps a 1:1 copy of every version of every file of her (all src/, her tools, the .md files, every .bak backup, her settings, diary, rulebook, request book) in data/VAULT/objects, stored by fingerprint, read-only, never deleted, with a hash-chained history of which version was current when. Every request also has its own 1:1 file (data/VAULT/requests/R###.json). save-her copies into the vault before every fix, the umpire copies again after and checks every copy is intact and nothing that went in has gone missing. Draw back: `tools/vault.py list <file>` / `tools/vault.py restore <file> [version]`, `tools/requests.py restore` - only on Love's words. Copies also live on GitHub and in the project folder.
0c. CORNERSTONE #3 - EVERY WORD, NO AMNESIA (Oct 27 2026 2:09 PM PT). Love: "please make sure everything i just said is included in the repository. everything i ever say, and everything you ever say in response; included in the repository. no more amnesia. ever again. every new thread has full context on prior events. cornerstone #3."
   HOW: every thread saves its whole conversation (HISTORY/thread-<date>-<slug>.md via save-thread.py) and the whole project chat (HISTORY/PROJECT-CHAT.md via save-project-chat.py, merged, nothing ever dropped) to the GitHub repo after each fix and before it finishes. Love's first session (Oct 20, "Aurelius model trading logic") is in HISTORY/ too. Every new thread reads HISTORY/README-START-HERE.md first - it is in the project's standing instructions and in project memory.
1. HER FLIP (fix325, main + rejection): an entry needs at least one live 1/2/3/4/5m candle in her colour, by the literal colour (price past that candle's open). None = no entry. Love: "hun, i asked for a 1 minute , 2m, 3m, or 5M candle to flip in our favor. one of the cornerstones of the model." + "i'd like it to be the literal color of the candle."
   How it slipped before (so it never does again): main had it first (Oct 21 12:05 PM, "1m close off a rejected band" waived the 5m candle). Oct 22 6:52 PM a card asked "Should a 1m rejection still override a rising or falling 5m candle?" and the answer "No, candle colour always wins" (fix102) took it off main; Oct 26 the 30c gold rule (fix271) stacked on top. Before any card question, check it against these cornerstones and say plainly if an answer would remove one.
2. HER THIRDS: no long in the top 33% / no short in the bottom 33% of the channel under an unbroken band (ONLY IN HER THIRD / THE IMPOSSIBILITY). These only BLOCK: she can short anywhere except the bottom 33%, long anywhere except the top 33% (Love Oct 27 11:51 AM: "it's only BLOCKED for a short by the BOTTOM 33% / she can short anywhere else in the channel. same for longs.").
3. Every change: one book at a time, named by Love; full save first (tools/save-her.py); her full words in the diary.
4. THIRDS ONLY BLOCK - CLEAR ANYWHERE ELSE (Oct 27 11:59 AM, Love: "save the top/bottom 33% (clear anywhere else) in as one of the cornerstones." + 11:51: "it's not limited to the top 33% for shorts. it's only BLOCKED for a short by the BOTTOM 33% / she can short anywhere else in the channel. same for longs."). No short in the bottom 33%, no long in the top 33%; everywhere else she is clear. Never describe it as "shorts only in the top third". Checked by tools/cornerstones.py #4.
5. FREE TO TRADE (fix336/340/341, main + rejection model). Love Oct 27 1:13 PM: "YES. ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED. EXECUTED. NO TRADE EXECUTED - FREEEE TO TRADE." + 1:10 PM: "she is to take any set up that comes that fits her rules if she is not actively in a position on kalshi" + ~1:58 PM: "STOP LIMITING HER TO ONE CALL OF A TRADE SHE DID NOT EVEN FUCKING TAKE". A paper call is NOT a position. Only a Kalshi fill, partial or resting order locks the window. Made a cornerstone after Love said it a 4th time (1:59 PM: "please make sure that stops happening permanently. that is the 4th time in the past 24 hours i have said that same exact sentence to you and the 4th time you confirmed."). `tools/free-to-trade-test.py` RUNS her real gate on made-up windows every umpire call; it fails on the old code (pre-fix336/340/341) and on any copy with the rule removed.

## THE UMPIRE - nothing is done until it says SAFE (Oct 27 12:15 PM, Love: "cover every single base and call the umpire to call it safe before you look away")
- After EVERY fix, restore or rollback run `python3 tools/umpire.py`. It runs verify-golden + cornerstones + rule-anchors + the free-to-trade RUN test and checks a fresh save. OUT = put the rule back or ask Love, before anything else.
- data/RULE-ANCHORS.json holds 876 of Love's own quotes from her code. If any disappears, the umpire fails. A new rule: `python3 tools/rule-anchors.py --add`. A rule only leaves with `--retire "<anchor>" "<Love's words>"` when Love herself says so.
- NO ROLLBACK OR RESTORE without first listing every rule it would remove and Love naming each one (the Oct 27 4:51 AM rollback silently removed fix296/297/298/302/306-310).
- BEFORE ANY CARD: search the diary. If Love already answered it, do not send the card - apply her recorded answer and quote it.
- Off-machine copy after every good state: project folder aurelius/offsite (save zip, anchors, diary, rulebook).

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
- DOJI (NOTE Oct 27: fix315 was REVERTED with the pre-fix295 restore, so her code is back on the old doji read; Love later said "doji is inconsequential". Rule as she stated it, fix315): after a doji that follows a continued trend, the candle AFTER the doji decides. Falling = short only, rising = long only. Love: "it is SHORT ONLY when a doji is followed by a candle falling, it is a continuation of the candle after the doji."

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

## SAVE HER (Oct 27 ~6:45 AM PT, Love card "Yes, save her every time")
Love 6:44 AM: "just make sure i don't get set back to the stone age again please. i dont know if i got another one of those in me".
- Before EVERY fix: `python3 tools/save-her.py before-fixN` saves her whole brain into data/SAVES/.
- When Love says she's perfect: `python3 tools/save-her.py <label> --good` (folder starts KNOWN-GOOD-).
- Bring any save back exactly: live off, copy its src/ and data/*.json back, run verify-golden.

## Oct 27 late morning (fix320-323)
- fix320 (10:49 AM): schedule back to each book's best hours exactly as at 3 AM (Love: "i want the same schedule we had in place for each books best hours before").
- fix321/322 (10:54/11:03 AM): every 15m book opens at $2.50, add-on $5 (Love: "let's put her on at $2.50 initial entry and a $5 add on for a bit pls"; "the entry in btc went in at $5 , can you update it to $2.50 and a $5 add on pls?"). 5m Polymarket book: flat $5, no add-on (Love: "let's not do the add on for the 5m books hun just the same initial $5"). NOTE: maxDollars caps Polymarket too.
- fix324 (11:31 AM): fix323 trial extended to the REJECTION model (Love: "let's apply it to the rejection model too pls for rn" + "i don't want her to take those anymore lol they rarely work out"). Twin + copy unchanged.
- fix323 (11:16 AM, TRIAL, MAIN, BTC ONLY): no short in the bottom 40% of green(5m S1)->pink, no long in the top 40% of pink->red(5m R1). Love: "how far through the channel was she from the distance from pink to green? we can set it up to be the bottom 40% and the top 40% of that distance pls" + card "Main only" + "well do that temporarily on a trial basis for btc / if it starts blocking trades i'd want her to take we'll remove it okay". Replay CAUTION: first replay on Vantage (~$100 above Pepperstone) said 17 blocked / 35% won - WRONG feed. Rough shift to Pepperstone: ~22 blocked, ~59% won (same as allowed). TradingView history not reachable from Claude; judge the trial on its live blocks. Love Oct 27 11:18 AM: "please make sure everything is on pepperstone for btc. and tvc gold for gold. our lines need to be identical" (live lines verified: pivotbooks/nav/quotes use PEPPERSTONE:BTCUSD + TVC:GOLD).
- fix325 (11:35 AM, MAIN + REJECTION): HER FLIP - an entry needs at least one live 1/2/3/4/5m candle literally her colour (price past that candle's open); none = no entry. Replaces the 5m-only HER CANDLE with 30c gold / $10 BTC stickiness for those two books. Love: "hun. i'd like it to be the literal color of the candle." + "hun, i asked for a 1 minute , 2m, 3m, or 5M candle to flip in our favor. one of the cornerstones of the model." + card "Main + rejection model". (11:30:28 main gold short had every 1-5m candle green.)
- fix326 (11:54 AM Oct 27, MAIN + REJECTION only): a rejection of the pink takes any 1/2/3/4/5m candle literally her colour (her flip), not the 5m candle 30c/$10 past its open. Love Oct 21 9:12 PM: "red candle falling rejected from pink - she is clear to short anywhere in the channel, except the bottom 33%". Oct 27 11:51 AM: "it's not limited to the top 33% for shorts. it's only BLOCKED for a short by the BOTTOM 33% / she can short anywhere else in the channel. same for longs." NEVER describe her thirds as "shorts only in the top third" - the thirds only BLOCK (no short bottom 33%, no long top 33%); everywhere else is open.

- Oct 27 1:06-1:26 PM PT: gold 1 PM live on ("yes. turn her on."). fix336 MAIN: one EXECUTED trade per window - no trade executed = free to trade ("i specifically said she is to take any set up that comes that fits her rules if she is not actively in a position on kalshi" / "YES. ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED. EXECUTED. NO TRADE EXECUTED - FREEEE TO TRADE."). fix338 MAIN gold pink break 25c, other books 33c ("yes let's bring it down to 25c for the time being"). Gold thirds slide: 33% under $10, 20% $10-25, 15% over $25 ("it's supposed to be 20% over band widths of $10").

- ONE BOOK ONLY + ASK FIRST (Love Oct 27 1:49-1:50 PM PT): "i specifically asked that the changes made are on ONE - BOOK. and not to be applied to ANY book without me expressly asking." / "please ask me before changing something i asked for NOT to be changed." Before ANY fix, list every book/lane that reads the changed code (incl. Poly 5m, which is wall-checked as recon-rej) and ask Love if any other than the named book would move.
- FREE TO TRADE, MAIN + REJECTION MODEL (fix336/340/341, Oct 27 1:13-1:58 PM PT): "ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED. EXECUTED. NO TRADE EXECUTED - FREEEE TO TRADE." / "SHE DID NOT TAKE A BTC POSITION I TOLD YOU I WANTED HER TO TAKE ANY POSITOON THAT SHOWS UP IF SHE HASNT TAKEN ONE" / "STOP LIMITING HER TO ONE CALL OF A TRADE SHE DID NOT EVEN FUCKING TAKE". A paper call is NOT a position. Only a Kalshi fill (or partial/resting order) locks the window.

## Oct 27 afternoon (fix342-343)
- fix342 STOP THE RUNAWAY (Love card 4:07 PM PT "Stop the runaway re-calls in hours a book isn't live?" -> "Yes, stop the runaway"): a call skipped only because that book is not live this hour does not free main/rejection; paper closing or a Kalshi miss still does; only a real fill locks the window.
- fix343 AUTO-CLEAR EVERY 4 HOURS (Love 4:08 PM PT: "aww poor ting let's clear up her cache so she can continue to execute properly hunn / i want to set up an auto-clear every 4 hours so she doesn't get stopped up by the lag that comes from that pls"): finished unfilled records older than 3.5 h move to live-book-done-archive.jsonl every 4 h (kept forever); fills stay.
- 5M extra calls tracked record-only (Love 2:25 PM PT: "track and log those and we'll see if it's a problem or a proud one :)"): tools/extra-call-5m.py -> HISTORY/EXTRA-CALL-5M.md.
- GOLD 3-5 PM (Love 4:18 PM PT: "on gold during the hours of 3-5 we generally just have her trade the red and green zones , the pinks and the bollingers / since it's a rejection model hour she can do red and green zones and bollingers ok 💓 pls keep that included in the framework"): in her already (3 PM lines fix24, 4-5 PM zones + Bollingers, rejection reads them fix246) and locked as R025. Card 4:29 PM "Should session-band setups sit out on gold from 3 to 5 PM?" -> "Keep it as it is" (session-band setups still trade too).
- fix344/344b GOLD 3-5 PM TIGHT BANDS (Love 4:31-4:32 PM PT: "just have her not skip because one is in the way until they reach a width of $2 or more / have her trade the pinks green red and bollingers" + card "Thirds + pink 10% step aside" + "do consider the main blue vwap a wall for her to wait for a flip or rejection off of pls" + "other bands can be waived thru until they are $2 wide or more"): gold 3:00-4:59 PM PT, session channel under $2, main/rejection/no-pink copy: thirds + PINK 10% step aside, except the session VWAP stays a wall (wait for a flip through it or a rejection off it). Cornerstone 2 set aside for this slice only, by Love's card pick.
- TARGET PAST A BAND stays in gold 3-5 PM tight bands too (Love 4:41 PM PT: "ahhhh , no it's ok hun we can keep that 💘").
- fix345 BOLLINGER ON ANY 1-5M FLIP (Love 5:03 PM PT: "ya it is on the 2m hun" + card "Should a 2m flip be enough for her to short a Bollinger rejection?" -> "Any 1–5m flip counts"): main + no-pink copy Bollinger rejections stand on any 1/2/3/4/5m candle flipped her way (was: the 5m colour only, Oct 22).

## fix346 — BTC pink $10 for the no-pink copy (Oct 27 ~5:16 PM PT, R029)
Love: "we need to keep the pink wall a minimum of 25c at this scale ok bb 💘" / "oh that’s btc sorry lol let’s make that $10 💘" / "and a trade near a pink that hasn’t broken thru always needs a break or a candle flip hun, never without confirmation into it"
- No-pink copy, BTC only: within $10 of an unbroken pink (long under it, short over it; broken = $3 through) she needs a 1-5m candle flipped her way or the pink broken. Applies even when pink is not stacked in the top/bottom 10%.
- Main, rejection model, twin and 5m untouched. The rejection model's pink wall was never removed (it refused the 5:15 PM long: "PINK 10%: long $24.65 under the unbroken pink").
- Love 5:19 PM: "it immediately tapped pink and reversed , that should have been short - for next time ok 💘"
- fix346b (5:19 PM, R030): Love: "no let’s keep that$33 bb not $10" -> the wall is $33. Today's $24.65 long would now wait for a flip or the pink break.
- PINK FLAG watch (5:23 PM): Love: "no other changes necessary at the moment to any other books , if one of the other books takes a trade like that and loses flag it for me and let me know and we’ll incorporate it into the main book too oki" -> tools/pink-flag.py (record-only, in the umpire). Flag + ask; never install on main without Love.

## fix347 — the copy gets main's sliding pink scale (Oct 27 5:35 PM PT, R031)
Love 5:32 PM: "thanks love ya did the main book lose her pink tolerance somehow? ... we need to come up with a sliding scale again hun ... i want to do that so we can let her stay put ok 💓" / "and she longed into gold into an unbroken pink this time too hun" / card "Should the no-pink copy use main's sliding pink scale?" -> "Copy gets main's sliding scale".
- No-pink copy, both assets: pink is a wall inside BTC $25 (channel <= $100), $50 or 10% above; gold 10% or $2. A 1-5m candle flipped her way, or the pink broken, lets her go.
- The stacked-only pink (fix332, 12:17 PM rule) now applies to the rejection model only. BTC $33 flip-or-break (fix346b) stays.
- Main had NOT lost her pink tolerance: both flags on main were the watcher reading minute data; main held PINK 10% and shorted after the pink broke.

## fix348 — gold 33c pink barrier for the copy (Oct 27 5:37 PM PT, R032)
Love: "and gold needs a minimum 33c  barrier between pink and longing into it at this scale / and needs a candle flip / we can open it up to normal when the bands are bigger but for rn yes"
- No-pink copy, gold longs, channel under $10: never within 33c under an unbroken pink, flip or not. Beyond 33c (inside 10% or $2) she still needs a 1-5m flip or the break (fix347).
- "Bigger bands" taken as $10+ for now; Love can name the width. Shorts over pink not changed (offered).

## fix349 — the copy gets HER FLIP; gold 33c both ways (Oct 27 5:40 PM PT, R033)
Love: "yes pls pls , and we can make it unilaterally pink rules in both direction to answer your question. thank you for confirming"
- No-pink copy: every entry needs a live 1/2/3/4/5m candle flipped her way (literal colour), same as main (fix325).
- Gold 33c pink barrier is both directions for the copy: no long within 33c under, no short within 33c over, an unbroken pink (channels under $10).

## fix350 — near pink, a flip means across the pink (Oct 27 5:48 PM PT, R034)
Love: "hun what are you talking about a flip ???? it was on the under side of the band ????? a flip would be short. it would need to be above the band for a flip to be a long. ????"
- Near an unbroken pink, a LONG flips only once price is ABOVE the pink; under it the only flip is a SHORT (mirror for shorts). Candle colour never waives pink.
- No-pink copy: sliding scale (fix347) and BTC $33 (fix346b) are break-only. Gold 33c barrier (fix348/349) stays.
- NEVER again read "flip" near a band as candle colour alone.

## fix351 — copy gold thirds 33% under $10 (Oct 27 5:50 PM PT, R035)
Love: "why did she long in the top 33% of the channel ….?" + card "Should tiny gold channels lock 33% instead of 20%, and on which books?" -> "33% on the copy only"
- 5:46 PM copy long sat at 79% of a $2.42 channel; fix219 (channel within one fresh sigma -> 20%) let it through. Copy now reads 33% on every gold channel under $10. Main + rejection keep fix219 until Love says.

## fix352 — BTC 6 PM: the delayed twin trades (Oct 27 ~6:02 PM PT, R036)
Love: "just the delayed entry model pls $2, $5 addon same as the other :))"
- BTC 6 PM PT hour: only the delayed twin (recon-dly) trades live, $2.50 + $5 add-on. Main, rejection, copy keep sitting it out (Oct 8 call). Gold unchanged.

## fix353 — the delayed twin is the no-pink copy, 30 s late (Oct 27 ~6:10 PM PT, R037)
Love: "for her rejections on they delayed entry model just put her on the same framework we rebuilt for no pink / or better yet, just make the delayed entry model a delayed rejection copy of no pink / no entires first 30 seconds into a window is good 💞" + 6:09 PM "i forgot the delayed model needed to be retuned again and we got the no pink rejection back on point 🎯 so we will use that model with a delayed entry - after 30 seconds 💞"
- recon-dly books exactly the copy's read, never before 30 s into the window, and meets every copy wall (pink scale break-only, HER FLIP, gold 33c, gold 33% thirds).
- Her old twin entries (initial move, next-band touch, re-aims) and twin-hour freedoms are switched off (DLY_AS_COPY in recon.ts + bandlock.ts; flip to false to restore, only on Love's words).
- Kept: her hours, $2.50 + $5 add-on, 50c price cap. The Polymarket twin copies her calls, so it follows the new model.
- fix353 PAUSED 6:12 PM (Love: "do not change the 5M on polymarket in any way"). The twin is exactly as before everywhere. NEVER touch anything Polymarket reads without Love naming it.

## CORNERSTONE — THE 5M IS FROZEN; CONFIRM BOOKS FIRST (Oct 27 6:13 PM PT, R038)
Love: "thank you hun yea i just want to run it on kalshi for right now , the 5M is our best performing book and i dont want it to move from her configurations unless we agree on it together for a reason , that book is good indefinitely until we decide differently okay / thankkkk you for telling me first this time. genuinely / yeah going forward making changes to any book, needs to be confirmed about if it applies to the other books first ok pretty pls 💘"
- The Polymarket 5M never moves unless Love and Claude agree together, for a reason. tools/five-m-freeze.py checks it in every umpire.
- Before ANY change to ANY book: ask Love which other books it applies to, and wait for her answer. Anything Polymarket reads (recon-dly rows, recon-rej, polyTwin config) counts as touching the 5M.

## fix354 — the delayed no-pink copy, on PAPER (Oct 27 6:20 PM PT, R039)
Love: "thanks hun yes let’s ensure polymarkets live orders stay the same byte for byte , and we can do paper if the regular delayed entry model just took the btc entry , it worked properly 💞"
- recon-dlyk: the copy's read, from 30 s into the window, copy walls. Paper only. The old twin keeps Kalshi; Polymarket reads nothing new (byte-identical code, 5M freeze ✓). Going live needs Love's words.

## fix355 — the twin waits 30 s on Kalshi (Oct 27 6:31 PM PT, R040)
Love: "hey hun , she just entered into the window in the first 30 seconds on btc again , can you make sure she gets the 30 seconds on the delayed entry model?"
- Delayed twin: no live Kalshi order in the first 30 seconds of any window. Paper and Polymarket unchanged.

## fix356 — the twin trades the SECOND band touch on Kalshi (Oct 27 6:47 PM PT, R041)
Love: "also, she just shorted btc / its supposed to be the second band price touches after the initial move still hun , not just 30 seconds / so if price is falling from the band it came from at the beginning of the window, she waits until it comes into contact with the second band / can you configure it that way pls? the first band price originated at in the window is null - the second band price comes into contact with is the trade she takes 💞"
- Kalshi twin: no live order until price touches the second band after the initial move; she takes that touch's side only. Re-aimed calls before it never go live. Paper + Polymarket unchanged.

## fix357 — the 5M sits out her bleeding hours (Oct 27 6:53 PM PT, R042)
Love: "could you look into the records for the 5M book on poly and see which hours she bleeds at? we can cut those" + card "Cut those hours instead" (keeps the $5 minimum).
- Poly 5M off at 3, 4, 5 AM, 1 PM, 9 PM and 11 PM PT. Every other hour, $5, unchanged. Re-frozen.

## fix358 — the 5M at $7.50 (Oct 27 6:55 PM PT, R043)
Love: "let's cut those hours and raise her stake to $10 on the other hours hunni 💞 better math on that" + card "$7.50 now".
- Poly 5M $7.50 in her kept hours. Poly cap lifts to that for 5m markets only; Kalshi $5 cap untouched. Revisit $10 with more data.

- **No-pink copy flip needs a real move (fix359, R044).** Love Oct 27 2026 7:19 PM PT: "no pink copy only , but let’s make it $5 not $10 pls / 10c is good for gold oki" (after the 7:15 PM BTC copy short at 80,922.02 passed HER FLIP because the 2m candle, opened 7:14 at 80,923.17, was $1.15 red while the 1m/3m/5m (open 80,919.31) were green). The copy's 1-5m flip only counts once price is $5 (BTC) / 10c (gold) past that candle's open. Copy only - main and rejection keep their flip as is.

- **Sizing (fix360, R045, Oct 27 7:47 PM PT).** Love: "hey hunn, we can put our main book and no pink rejection model(s) back on at $5 initial entry , $8 add on pls" + card "Main + copy + rejection". Main, rejection model, no-pink copy: $5 entry, $8 add-on. Delayed twin stays $2.50 + $5. Poly 5M $7.50 (frozen). Kalshi order cap maxDollars stays $5 (add-ons are not capped by it).

- **Pure no-pink twin (recon-np, fix361/362, R046/R047).** Love Oct 27 8:06 PM PT: "yes, i want to start another no-pink twin that completely disregards pink trades entirely / only trades band taps and rejections , sessions red green and bollingers / in this case she would have waited for it to reject the blue band and long". 8:17 PM: "let’s go ahead and try running the new no-pink now at $3 & $5 add ons pls" + card "New one at 9 PM only". She takes only taps/rejections of session bands, red/green zones, Bollingers; never pink/pivot/nav/thirds/breaks; skips if pink sits between price and her band. Live only at 9 PM PT (both assets) at $3 + $5; main/rejection/copy sit 9 PM out; paper every other hour.

- **Copy: no thirds flips; main gold pink-to-green 60% (fix364, R049).** Love Oct 27 8:38 PM PT: "yes the flip is already supposed to be off hun, pls remove that and keep it off , and yeah go ahead and raise it to 60% hun that’s fine". The no-pink copy never turns main's read into the opposite trade ("Top third - seen as a short", "Bottom third - seen as a long"). Main only: no gold short in the bottom 60% of the green -> pink space (other books 50%).
- **Pure no-pink pink rule (fix363, R048).** Love Oct 27 8:32 PM PT: "as for pink holds on the new no-pink one, she only does it if the pink band and the session occupy the same bottom/top 10% of the channel pls / otherwise the rejections should blow right thru".

- fix367 (Oct 27 ~9:35 PM PT, Love: "yess that's good hunni 💞 wait for a break or a candle flip as normal"): PURE NO-PINK only - no long within 50c gold / $25 BTC under an unbroken pink (mirror for shorts); she goes on the break through it. Other pink blows through (fix363).

- fix368 (Oct 27 ~9:45 PM PT, Love: "hun she keeps longing into unbroken bands pls fix her" + card "How should the pure no-pink treat unbroken bands above a long?" -> "$1 gold / $25 BTC, any band"): PURE NO-PINK only - no long within $1 gold / $25 BTC under ANY unbroken band (pink, purple, session sigma/VWAP, Bollinger, red/green zone); mirror for shorts. She waits for the break, then the next band.

- fix369 (Oct 27 9:53 PM PT, Love: "bands are only about $130 apart right now , btc can stay $10 at bands under $150 , gold can stay $1 / every time band width doubles (eg 300) triple the tolerance / so $30 at $300 , / basically just 10% lol / $10 under $180 is okay for rn though"): PURE NO-PINK any-band cushion BTC $10 while bands < $180 apart, 10% of width at $180+; gold $1. Sliding scale for all conditions planned this week.

- fix370 (Oct 27 10:01 PM PT, Love: "her entries are starting to lag a bit again hun, let’s set it up to clear her cache every hour instead of every 4 pls it gets slower hour by hour , we’ll have her do it each hour okay"): auto-clear every hour (was 4 h).

- fix371 (Oct 27 ~10:15 PM PT, Rejection + main + copy (card: "Should gold longs wait for the pink break when gold slides under rejecting pink?"; Love 10:12 PM PT: "if gold is on a downslope like this and keeps rejecting pink and reversing like this, do longs into those lose more than they win? ... maybe in the event of this we should wait for a break")): MAIN + REJECTION + COPY, gold longs, Kalshi: in a gold slide (>$2 down over 30 min) under a pink that rejected price, no long until pink breaks up (25c).

- fix372 (Oct 27 ~10:35 PM PT, Love: "rather than having it copy mains calls, can you instill the engine and entry logic and give her sovereign reign to make her own trades aside from main? 💓 / bring me the numbers first, and rather than changing her we can make a twin and test it over night before going live"): recon-sov sovereign PAPER twin (own engine read, rejections only, 1-5m flip, re-aims). Live only on Love words.

- fix373 (Oct 27 ~10:50 PM PT, Love: "if the numbers are that good on btc you can go ahead and put that in bb 💞 / we are stopping bleeds this week ok 🎯 + card "Which books get the BTC pink-rejection re-aim?" -> "Main + rejection + copy""): BTC only - main/rejection/copy unfilled long refused under pink re-aims to the pink-rejection short (1-5m red flip); sticks for the window.

- fix374 (Oct 27 11:20 PM PT, Love: "how is she doing on the rejection model for 11 so far? if you think it’s safe to put on the rejection model for the hour i’m widdit bb it seems nice and slow :)"): 11 PM PT = the rejection model trades live (rejSeatHours [23]); the Oct 8 11 PM sit-out is lifted.

- fix375 (Oct 27 11:25 PM PT, Love: "yesss pls 💘 (to: "Want me to add a guard so a call that is over a minute old can never fire right after a seat opens?")"): stale call guard - a never-tried call over 90 s old never goes to Kalshi.

- fix376 (Oct 28 12:23 AM PT, Love: "ohhh got you got you sorry  bb i thought you were saying she’d skip those and take the ones into it for a sec 😹💓 / yess let’s do it 💞 (to: she still only trades away from $10 levels, but waits until price is at least $1.50 clear of the level first; main + rejection + copy)"): gold main/rej/copy - trading away from a $10 level needs price $1.50 clear of it.

- fix377 (Oct 28 12:33 AM PT, Love: "yes pls bb 💘 (to: bring back just the inside-the-zone part - no long inside the red, no short inside the green - for main, the rejection model and the copy)"): gold main/rej/copy - no long inside the red zone, no short inside the green zone.

- fix378 (Oct 28 2026 12:49 AM PT, Love: "we will make sure she doesn't long in the red zone or short in the green zone pls, and keep the $1.50 tolerance from it in place too / yesss pls hunni / just gold bb"): gold only, main + rejection + no-pink copy - no long within $1.50 under the red zone, no short within $1.50 over the green. BTC no zone wall ("no btc wall").

- fix379 (Oct 28 2026 1:06 AM PT, card "Top/bottom 33% instead of 20%" + Love: "yes pls all of them for sure"): BTC, main + rejection + no-pink copy - no long in the top 33%, no short in the bottom 33% of a channel up to $500 wide (over $500 stays 20%).

- fix380 (Oct 28 2026 1:16 AM PT, Love: "we will do $7 on the first add on, & $3 at the next rejection off of a band she encounters / same entry logic, we had some issues last time getting those to go thru correctly at a rejection so we made it just a default entry / but let's have her take it as she would any other trade, at whatever multiple is available there / a candle flip at any band she encounters after our first add on / can we do that bb? + card Main + rejection + copy"): main + rejection + no-pink copy - $5 entry, $7 first add-on (first band touched, 3.8x+), then ONE $3 add-on at the next different band when a 1-5m candle flips her way there, any multiple up to 72c.

- fix381 (Oct 28 2026 10:30 AM PT, Love: "i'm sold lol pure no pink it is now bb + card How should the pure no-pink take over live? -> BTC every hour, gold stays"): the PURE NO-PINK holds the Kalshi BTC seat every hour (the delayed twin keeps its own BTC hours); gold stays main/rejection/copy, pure no-pink gold only 9 PM; $3 entry + $5 add-on.

- fix382 (Oct 28 2026 10:34 AM PT, Love card "Yes, 4:57 AM walls, live now"): the Polymarket 5M judges with her own walls exactly as they stood at 4:57 AM Oct 27 (her best stretch). Her calls, $7.50 and skip hours unchanged.

- fix383 (Oct 28 2026 11:15 AM PT, Love: "let's put her on the pure no pink for the best hours , and the sovereign twin for golds other rejection hours, and keep her on main for mains best hours on gold ok"): gold seat map - pure no-pink live gold 1, 4, 7, 9 AM, 8 PM, 9 PM; the sovereign twin takes gold's other rejection hours live (in place of the no-pink copy, same $5 + $7 + $3 sizing); main gets gold 8 AM. BTC stays pure no-pink every hour.

- fix384 (Oct 28 2026 12:00 PM PT, Love: "let’s do $10 with the $5 add on and the second $5 add on / for everything except the delayed entry model & 5M book pls bb" + "you’re good bb run it"): $10 entry, $5 first add-on, $5 second add-on on main, rejection, no-pink copy, sovereign twin and pure no-pink. The delayed twin ($2.50 + $5) and the Poly 5M ($7.50, frozen) stay as they are.

- fix387 (Oct 28 2026 12:17 PM PT, Love: "yesss pls let her take tap rejects on her own bb"): the pure no-pink also takes tap-rejects at session bands, the red/green zones and Bollinger. Her book only.

- fix388 (Oct 28 2026 12:30 PM PT, Love: "and yes, pure no pink for btc always pls"): BTC on Kalshi is the pure no-pink every hour; the delayed twin no longer trades BTC live on Kalshi. Polymarket unchanged.
- Sizes (Oct 28 2026 12:19 PM PT, Love: "oh i meant let’s keep the $10 / $5 / $5 for the moment bb , and we can adjust to the lower entry and double downed-add ons if she isn’t performing well on her new schedule"): $10 / $5 / $5 stays; $2.50 / $7 / $5 only if she underperforms on the new schedule.

- fix389/389b (Oct 28 2026 1:05 PM PT, Love: "yess that’s what i was sayin earlier i want to give her her own taps ok :)" / "and you can put her on that now, we will put her back where she is is she doesn’t do well on it okay :)) would have worked this short too so let’s give her the ability to do that okay bb"): the pure no-pink reads the bands with her own eyes (session bands, red/green zone, Bollinger; rejections only, 1-5m flip, never pink) as well as main's reads, live. Her own-eyes read alone is kept on paper as recon-npo.

- fix390 (Oct 28 2026 1:11 PM PT, Love: "no just make her have the same cushions and band tolerances and everything and she should be good hun" + card "Main's sliding scale for her"): the pure no-pink meets main's exact walls, cushions and band tolerances. She still never calls a pink trade herself.

- fix391 (Oct 28 2026 2:00 PM PT; Love 1:42 PM PT card "Stop the pure no-pink from taking thirds reads?" -> "Yes, band reads only" + 1:58 PM PT: "yes for pure bc she shouldn’t be shorting anywhere near green anyways , she should only be longing there now that we changed her thirds regime right?"): the PURE NO-PINK's own-eyes read never books a thirds read (Candle rising/falling, Launched from the top/bottom third). She enters only at a band: tap/rejection/failed break off σ/VWAP/Bollinger/red-green zone. Pure no-pink only (recon-np live + recon-npo paper). Replay (BTC since Oct 25 6 PM PT, $10 flat to the bell): band reads only +$73 / 128; with thirds -$148 / 174; thirds alone -$227 / 156 (data/lab/eyes391.py).

- fix392 (Oct 28 2026 2:15 PM PT; Love 1:53 PM PT: "and again hun she shorted btc closer to the green than the pink" + card "Pure no-pink only, 50%" + after the replay card "Yes, 50% for her anyway" + 1:58 PM PT: "yes for pure bc she shouldn’t be shorting anywhere near green anyways"): PURE NO-PINK only - BTC no short in the bottom 50% of the green (5m S1) -> pink (5m PP) space, no long in the top 50% of pink -> red (5m R1). Main + rejection stay 40%. Replay (data/lab/zone392.py): 40-50% zone main 8 trades 75% +$37, all books 17 / 59% / +$27 - Love chose 50% for the pure no-pink anyway; main unchanged.

- fix393 (Oct 28 2026 2:30 PM PT; Love 2:26 PM PT: "well she is supposed to do her default 2.8x hun, and thennn catch the other at a band rejection" + card "Lower the first add-on to 2.8x+ for which books?" -> "All $10 books" + 2:29 PM: "yess a default of 2.8x / and then the second add on at the next band price encounters and rejects with the flip from there , whatever multiple that is"): first add-on = first band touch at 2.8x+ (35.7c) on main, rejection, copy, sovereign, pure no-pink. Second add-on unchanged (fix380: next different band + 1-5m flip, up to 72c). Delayed twin + Polymarket untouched.

- fix394 (Oct 28 2026 2:45 PM PT; Love 2:34 PM PT: "and the candle flipped from green bb" + card "Let green/red zone rejections fire on any 1-5m candle flip?" -> "Pure no-pink + main"): green zone long / red zone short reads pass on any 1/2/3/4/5m candle flipped her way, not only the 5m candle - main (lookT) + pure no-pink own eyes. Copy follows main's calls. Rejection + sovereign reads unchanged (fix67 5m rule).
- fix395 (Oct 28 2026 2:45 PM PT; Love 2:36 PM PT: "hun i’ve asked several times now, i want her to be able to take her own calls." + 2:37 PM PT: "hun i’ve asked for this several times now, i want pure to be able to take her own taps"): PURE NO-PINK HER OWN TAPS - price taps one of her bands (σ/VWAP, Bollinger, green zone longs, red zone shorts) within BTC $10 / gold 50c this 5m candle, never broken through, pushes off her tap, any 1-5m flip her way -> her own "Tap-reject at <band>" call (recon-np live + recon-npo paper). Main's walls still judge her.

- fix396 (Oct 28 2026 3:00 PM PT; Love 2:45 PM PT: "dude she just longed btc into a band" + card "Make pure's own taps fire only near the band she tapped?" -> "Yes, nearer half only"): pure no-pink own taps fire only while price is within half the distance from the tapped band to the next line her way (any line, pink included).
- fix397 THE BLUE VWAP WALL (Oct 28 2026 3:00 PM PT; Love 2:46 PM PT: "we need to keep the blue vwap a wall on all books when bands are small" + card "All Kalshi books, 5M frozen"): at the Kalshi wire, every book - when session VWAP to +1σ is under $150 BTC / $3 gold, no long under the unbroken VWAP within half that width, no short over it within half. Price across the VWAP frees her. Polymarket 5M + Poly twin untouched.
  - fix397b (Oct 28 2026 3:15 PM PT): the wall reads the "fresh VWAP" / "fresh +1σ" lines first (after the 2 PM PT reset her blue VWAP is the fresh line; the carried "session VWAP" was 80,868). Trigger: 3:00:25 PM short $27 over the fresh VWAP 81,245; Love 3:01 PM: "hun she did it again pleaseeeee stop having her trade into unbroken bands / price needs to be on the same side of the break". Simulated 9 trades: all correct (data/lab/t397.js).

- fix398 (Oct 28 2026 3:30 PM PT; Love 3:19 PM PT: "she longed btc on a falling red candle hun this model is not working like the rejection one we had running pls put that one back on til we iron this out this is too many bad trades" + 3:21 PM: "yes put her back on the rejection model we tuned pls this is movin backwards / we will iron it out on paper oki"): BTC Kalshi seat = rejection model (recon-rej) every hour; pure no-pink off BTC live (paper keeps running). Gold untouched. Undo = fix398Prev.

- fix400 (Oct 28 2026 3:47 PM PT; Love 3:35 PM PT: "yes the rejection model we had running earlier goes back for btc and gold not just btc that model needs work bb" + card "No-pink copy, like BTC"): pure no-pink off gold live (npLive.hoursByAsset.gold = []) and the sovereign twin off gold live (sovLive.on false); both keep trading on paper. The no-pink copy holds gold's rejection hours again; gold 8 PM is main's. Put back only on Love's words (fix400Prev).
- RULE AUDIT (Oct 28 2026; Love 3:34 PM PT: "can you track every trade that pure takes and flag it against any rules being broken and come tell me what it was and we will come to a decision on the fix?" + 3:38 PM: "we can train the sovereign model too if it needs work, set up the flags for both of them"): tools/pure-audit.py, read-only, flags each pure/sovereign trade (candle against her, into an unbroken band, top/bottom 33/20%, blue VWAP when small, BTC short nearer green / long nearer red). Fixes only together with Love.
- fix399 (Oct 28 2026 4:00 PM PT; R087): while the blue VWAP to 1σ is under $150 BTC / $3 gold, THE IMPOSSIBILITY tolerance is 20% (not 33%) on every Kalshi book (not the Poly twin), and no Kalshi long/short that has to cross the unbroken blue VWAP to reach the window target. 5M frozen.
- fix401 (Oct 28 2026 4:00 PM PT; Love 3:50 PM: "fix all of those hun pls including longs i dont care if they won" + 3:52 PM: "same band tolerances as our other models pls and the 2,3,4&5M candle flips pls"): pure no-pink (recon-np/npo) and the sovereign twin (recon-sov) call only on a 2/3/4/5m flip her way (no 1m), through main's walls and tolerances, and not just under/over the blue VWAP while bands are small. Refusals logged in data/pure-walls.jsonl. Main/rejection/copy already read 1-5m flips (4m included).
- fix402 (Oct 28 2026 4:00 PM PT; Love 3:57 PM: "dude please put her back on at $5 til we figure this out she has lost like 10 trades on blocked trades" + "no 1 $5 add on pls"): main, rejection and copy $5 entry + ONE $5 add-on (second add-on off). fix402Prev holds the $10 setup.
- fix403 (Oct 28 2026 4:15 PM PT; Love card "No longs till pink breaks" + 4:04 PM: "that was already how we structured that downslope rule hun / can you make sure everything stays when we make a rule?"): gold sliding (more than $2 lower than 30 min ago) under an unbroken pink = no gold long on main, rejection or copy until price breaks up through pink by 25c. No touch needed, no time-out. Guarded by tools/slide-test.cjs in the umpire (today's 3:54 PM long must be held).
- fix404 (Oct 28 2026 4:30 PM PT; Love 4:18 PM: "can we set it up for her to trade a candle flip at the 2nd bands for now ? / if price blows thru one and rejects and flips at the 2nd when bands are tight?" + 4:20 PM: "yess we'll keep it paper for the next couple days :)"): paper lane recon-b2 - tight bands, price blows through one band, rejects off the next with a 2/3/4/5m flip, through main's walls. Paper only; live only on Love's words.
