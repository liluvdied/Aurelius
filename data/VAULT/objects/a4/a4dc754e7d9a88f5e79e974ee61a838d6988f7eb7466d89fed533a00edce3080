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
