// fix701 proof: REJ ONLY · NO PINK writes why it held a read (Bollinger colour, thirds, the pink, main's door) and still drops it exactly as before - log only.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("NO-PINK WRITES WHY 701 TEST: FAIL - " + m); } };
const R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8");
const i = R.indexOf("const skip701 ="), blk = R.slice(i, R.indexOf('if (rj643 && book("recon-rjnp", rj643))', i));
t(i > 0, "the no-pink book has no reason writer");
t((blk.match(/skip701\(/g) || []).length === 4 + 0 && (blk.match(/rj643 = null;/g) || []).length === 4, "not all four held reads write a reason before they are dropped (or a drop was removed)");
t(/thirdsRead463\(sessionLines\(ax, id\), spot, rj643\.side, id\)\) \{ skip701\(/.test(blk) && /pinkRead464\(id, sessionLines\(ax, id\), spot, rj643\.side, Number\(pv643\.pp\)\)\) \{ skip701\(/.test(blk) && /if \(!bl701\.ok\) \{ skip701\(/.test(blk), "a wall's condition changed (this change must only add the reason)");
t(/skipLog\("recon-rjnp", String\(m\.ticker\)/.test(blk), "the reason does not go to her skip log under the no-pink book's name");
t(R.includes('if (rj643 && book("recon-rjnp", rj643)) changed = true;'), "the no-pink book no longer books its calls");
console.log(ok ? "NO-PINK WRITES WHY 701 TEST ✓ - the no-pink book writes the reason for each held read (Bollinger colour, thirds, the pink, her door) and drops it exactly as before; log only." : "NO-PINK WRITES WHY 701 TEST: FAIL");
process.exit(ok ? 0 : 1);
