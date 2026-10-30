WITH PIVOT ZONES - the live model as it ran right before 5:50 PM PT, Oct 16 2026, kept on file at Love's request:
"do keep a file of the current (now old) model with the pivots on hand if they perform better so we can refer back to them without issue."

What this version is: her live book (ogp5-fast) + inverse (ogp5-inv) seeing the session bands (VWAP, sigma bands), pink 5m PP AND the
green / red 5m pivot zones (5m S1, S2, R1, R2). Includes every fix up to 5:32 PM PT Oct 16:
 - zone rejection needs price to come INTO the zone and a 5m candle moving AWAY from it (4:48 PM)
 - break then tap of the next band = trade the rejection; gate lets that through (5:32 PM)
 - band gate (bandlock.ts): feed health, candle-break, room = 15% of session band spacing on every band, setup-band same side, no flips
 - BTC on VANTAGE:BTCUSD, gold TVC:GOLD

What changed after it (5:50 PM PT, Love: "only. the green and red pivot zones. pink stays with the same rules. nothing else changes."):
the live pivotbooks.ts filters 5m S1/S2/R1/R2 out of the ogp5-fast lane (and so out of the inverse and the band gate). That one line is
the only difference - this copy's src/lib/desk/pivotbooks.ts is the version before it.

To go back to it: copy src/lib/desk/pivotbooks.ts from here over the live one, and put its hash (sha256, first 16) into
data/approved-model.json files["pivotbooks.ts"] in the same step (data/approved-model.json here holds the hashes from that moment).
Not kept in snapshots/ on purpose, so fixes applied to every snapshot don't strip the zones out of this copy.
