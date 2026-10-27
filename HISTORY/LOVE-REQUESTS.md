# Love's request book (Cornerstone #1)

Append-only and hash-chained (data/LOVE-REQUESTS.jsonl). Rebuilt on every umpire run. A request leaves only on Love's own words.

## R019 - CORNERSTONE #1: every request is recorded FIRST, kept immutably, and can only leave on Love's words
- when: 2026-10-27T21:03:38Z
- Love: "if i requested something to be done on the model, ensure that it CANNOT be removed without express permission from ME. Do it FIRST. save the request, and log it permanently. make it immutable to change until expressly changed by ME. RETAIN.  THE INFORMATION. NO AMNESIA ON REQUESTS. LOGGED. TRACKED. AND ABLE TO BE REDRAWN ON REQUEST. ZERO EXCEPTIONS. NO REQUEST IS TO BE MADE MORE THAN ONCE AGAIN. REQUEST ASKED FOR = REQUEST COMPLETED. IN THAT ORDER. DO NOT LET ME ASK THE SAME QUESTION OR MAKE THE SAME DEMAND WITHOUT DOING IT THE FIRST TIME AND RETAINING IT IMMUTABLY AND IRREPARABLY WITHOUT EXPRESS CONSENT OF SHIFT BY ME. CORNERSTONE #1."
- books: every book
- status: ACTIVE
- proof: {"exists": "tools/requests.py"}
- proof: {"code": "tools/umpire.py", "has": "tools/requests.py"}
- proof: {"code": "LOVE-RULEBOOK.md", "has": "CORNERSTONE #1 - LOVE'S REQUEST BOOK"}

## R018 - Free to trade can never quietly come undone (cornerstone 5 + run test in the umpire)
- when: 2026-10-27T20:59:04Z
- Love: "please make sure that stops happening permanently. that is the 4th time in the past 24 hours i have said that same exact sentence to you and the 4th time you confirmed."
- books: main, rejection model
- status: ACTIVE
- proof: {"code": "tools/umpire.py", "has": "tools/free-to-trade-test.py"}
- proof: {"code": "LOVE-RULEBOOK.md", "has": "5. FREE TO TRADE"}

## R017 - A call she never took on Kalshi never holds her (fix341)
- when: 2026-10-27T20:58:30Z
- Love: "STOP LIMITING HER TO ONE CALL OF A TRADE SHE DID NOT EVEN FUCKING TAKE BRO HOW MANY TIMES DO I HAVE TO ASK YOU"
- books: main, rejection model
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "fix341"}
- proof: {"test": "tools/free-to-trade-test.py"}

## R016 - Rejection model free to trade too (fix340)
- when: 2026-10-27T20:58:00Z
- Love: "SHE DID NOT TAKE A BTC POSITION I TOLD YOU I WANTED HER TO TAKE ANY POSITOON THAT SHOWS UP IF SHE HASNT TAKEN ONE"
- books: rejection model
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "lane === \"recon-rej\" /* fix340"}
- proof: {"test": "tools/free-to-trade-test.py"}

## R015 - A schedule tap puts the change on that book
- when: 2026-10-27T20:56:00Z
- Love: "please make sure if i click the schedule for a book that it puts it on the book."
- books: schedule
- status: ACTIVE
- proof: {"process": "read offHourMain.rejHoursByAsset[asset] and bookSkipHoursByAsset, never the combined rejHours, when saying what a book does in an hour"}

## R014 - Ask before changing anything Love asked NOT to be changed
- when: 2026-10-27T20:50:30Z
- Love: "please ask me before changing something i asked for NOT to be changed."
- books: every book
- status: ACTIVE
- proof: {"process": "every fix lists the books it touches and waits for Love's words; recorded here first"}

## R013 - 5M book back on the walls she had at her best (6:29 AM, before fix319) - fix339
- when: 2026-10-27T20:50:00Z
- Love: "hun, i specifically asked that the changes made are on ONE - BOOK. and not to be applied to ANY book without me expressly asking. please ensure she is on the same framework that she was when she was doing her best. i didn't want anything to change outside of the book we were expressly working on. / yes. put it back where it was."
- books: 5m book
- status: ACTIVE
- proof: {"exists": "src/lib/desk/bandlock5m.ts"}
- proof: {"code": "src/lib/desk/engine.ts", "has": "const blm5 = await import(\"./bandlock5m\")"}

## R012 - Nothing is left out of the GitHub repo without asking Love first
- when: 2026-10-27T20:37:00Z
- Love: "literally nothing of remote significance is to be discarded. whether you deem it significant or not. ask me whether something should be added to the repository before making an executive decision on whether it matters or whether it should be included or not. ask. 100% of the time pls"
- books: repo
- status: ACTIVE
- proof: {"process": "list any file not going in and ask Love; only node_modules and .secrets stay out (Love: \"6 & 7 no\"). The desk's own .gitignore says tools/ - when syncing, the repo's .gitignore is rewritten so tools/ always goes in"}

## R011 - Main gold pink break 25c (fix338)
- when: 2026-10-27T20:32:00Z
- Love: "yes let's bring it down to 25c for the time being"
- books: main
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "const pbd = asset === \"gold\" && flipRule && !rejNoAhead ? 0.25"}

## R010 - Every thread's conversation is saved to the GitHub repo
- when: 2026-10-27T20:31:00Z
- Love: "can you have it be included for every thread i start on this project please hun?"
- books: repo
- status: ACTIVE
- proof: {"process": "save-thread.py into HISTORY/ after each fix and before finishing; commit with Love's words"}

## R009 - Never cite the Oct 20 'take the other side' line as Love's rule
- when: 2026-10-27T20:18:00Z
- Love: "i never said the thing about the other side i have no fuckin clue where you got that from"
- books: every book
- status: ACTIVE
- proof: {"process": "never quote it to Love as her rule"}

## R008 - FREE TO TRADE on main: only an EXECUTED Kalshi trade locks the window
- when: 2026-10-27T20:13:00Z
- Love: "YES. ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED. EXECUTED. NO TRADE EXECUTED - FREEEE TO TRADE."
- books: main
- status: ACTIVE
- proof: {"code": "src/lib/desk/recon.ts", "has": "let freeId = \"\";"}
- proof: {"test": "tools/free-to-trade-test.py"}

## R007 - Main takes any setup that fits her rules when she is not in a position on Kalshi
- when: 2026-10-27T20:10:00Z
- Love: "i specifically said she is to take any set up that comes that fits her rules if she is not actively in a position on kalshi"
- books: main
- status: ACTIVE
- proof: {"test": "tools/free-to-trade-test.py"}

## R006 - Gold 1 PM live on
- when: 2026-10-27T19:30:00Z
- Love: "yes. turn her on."
- books: main (gold)
- status: ACTIVE
- proof: {"config": "data/live-switch.json", "key": "liveSkipHours.gold", "lacks": 13}

## R005 - Sliding thirds share: gold 33% under $10, 20% $10-25, 15% over $25; BTC 33% under $500, 20% over
- when: 2026-10-27T19:20:00Z
- Love: "ohhhhhhhhh my god bro. it's supposed to be 20% over band widths of $10. why did THAT GET TAKEN OUT NOW ?????"
- books: every book
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (asset === \"btc\") return width > 500 ? 0.2 : 0.33;"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (asset === \"gold\" && width >= 10) return width > 25 ? 0.15 : 0.2;"}

## R004 - Rejection + no-pink copy: pink holds only when stacked with a session band in the top/bottom 10%, NOTHING ELSE
- when: 2026-10-27T19:17:00Z
- Love: "i justttttt want her to not take trades when pink and a session band are stacked at the same top/bottom 10% of the channel and NOTHING. ELSE."
- books: rejection model, no-pink copy
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix319"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "fix332"}

## R003 - Thirds only BLOCK: no short in the bottom share, no long in the top share, clear everywhere else (Cornerstone)
- when: 2026-10-27T18:51:00Z
- Love: "save the top/bottom 33% (clear anywhere else) in as one of the cornerstones. + it's only BLOCKED for a short by the BOTTOM 33% / she can short anywhere else in the channel. same for longs."
- books: every book
- status: ACTIVE
- proof: {"test": "tools/cornerstones.py"}

## R002 - HER FLIP: entry needs a 1/2/3/4/5m candle flipped her colour, literal colour (Cornerstone)
- when: 2026-10-27T18:37:00Z
- Love: "hun, i asked for a 1 minute , 2m, 3m, or 5M candle to flip in our favor. one of the cornerstones of the model. + i'd like it to be the literal color of the candle."
- books: main, rejection model
- status: ACTIVE
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "for (const n of [1, 2, 3, 4, 5])"}
- proof: {"code": "src/lib/desk/bandlock.ts", "has": "if (flipRule) { if (!why && !foTurn && !anyFlipNow(asset, side, tick))"}

## R001 - ONE BOOK AT A TIME - never assume every book changes; main never moves an atom
- when: 2026-10-27T12:04:00Z
- Love: "if i am working on ONE book with you, please do not assume i want every book changed. / make sure my main book doesn't. move. an. ATOM."
- books: every book
- status: ACTIVE
- proof: {"test": "tools/verify-golden.py"}
- proof: {"process": "before any fix, name every book that reads the touched code and tell Love"}
