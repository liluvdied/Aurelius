# START HERE - Aurelius history (for every new chat / thread)

Love built Aurelius. Love said on Oct 27 2026: "please add a zip file of our entire conversation and everything we discussed and every rule we came to, and how we came to it. conversationally and through the cards you give me to choose my options from ... have the next thread be able to see how , when and why we chose a specific option over another so i don't need to explain why again ... i can't fuckin handle the amnesia."

Read in this order BEFORE asking Love anything:
1. LOVE-RULEBOOK.md - CORNERSTONES at the top win over every later fix. Then every standing rule in her words.
2. EVERY-DECISION-AND-WHY.md - every decision since Oct 2, with Love's words and the card option she tapped, in time order.
3. thread-*.md - full conversations: every message Love wrote, every reply, every option card and what she picked.
4. full-fix-log.txt - the complete diary (data/overnight-fixes.log), including technical detail.

If the answer is in here, do not ask Love again. Add each new thread's conversation here when it ends (same format), update the rulebook in the same turn as any new rule, and rebuild the zip:
  python3 -c "import shutil;shutil.make_archive('AURELIUS-HISTORY','zip','.','HISTORY')"   (run in the Aurelius folder)
Every code fix: python3 tools/save-her.py before-fixN first; python3 tools/verify-golden.py and python3 tools/cornerstones.py after.
