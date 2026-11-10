#!/usr/bin/env node
// fix1068 BOLLINGER BLOCK (Love Nov 10 2026 10:17 AM PT: "just put the $1.50 bollinger , or 10%. whichever is smaller. block in for gold please. 10% of the channel for the rest of the assets please.") - TEST: no network, no order.
// Replays her real boards from Nov 10: (1) the 10:09 AM gold long $1.43 under the Bollinger middle is REFUSED, (2) the 10:07 AM BTC short from over the Bollinger upper (her wick rejection) is ALLOWED,
// (3) both 10:15 AM entries are ALLOWED, plus the limits: gold = the smaller of $1.50 and 10% of the channel, BTC = 10% of the channel; no Bollinger = the rule says nothing; and the last line calls it for every book but delayed.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8"), K = fs.readFileSync(path.join(root, "src/lib/desk/kalshi-live.server.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("BOLLINGER BLOCK 1068 TEST: FAIL - " + m); } };
const i = B.indexOf("export function bollBlock1068("); if (i < 0) { console.log("BOLLINGER BLOCK 1068 TEST: FAIL - bollBlock1068 is not in bandlock.ts"); process.exit(1); }
let j = B.indexOf("): string {", i) + 10, d = 0, e = -1; for (let k = j; k < B.length; k++) { if (B[k] === "{") d++; else if (B[k] === "}") { d--; if (d === 0) { e = k; break; } } }
const f = new Function(ts.transpileModule(B.slice(i, e + 1).replace(/^export /, ""), { compilerOptions: { target: 99 } }).outputText + "; return bollBlock1068;")();
const gL = [["session VWAP", 4088.47], ["+1σ", 4124.47], ["-1σ", 4052.47], ["-2σ", 4016.47], ["-3σ", 3980.47]].map(([name, price]) => ({ name, price }));
const bL = [["session VWAP", 73600], ["-1σ", 72980], ["-2σ", 72360], ["+1σ", 74220]].map(([name, price]) => ({ name, price }));
const gBB = { bbU: 4024.368, bbL: 4015.933 }; // her gold Bollinger at 10:09:26 AM PT (middle 4020.15)
// (1) her 10:09 AM gold long
t(/BOLLINGER BLOCK \(fix1068\).*Bollinger middle/.test(f("gold", 4018.721, "up", gL, gBB)), "the 10:09 AM gold long $1.43 under the Bollinger middle was NOT refused");
t(/BOLLINGER BLOCK/.test(f("gold", 4019.07, "up", gL, gBB)), "a gold long $1.08 under the Bollinger middle was NOT refused");
t(f("gold", 4018.0, "up", gL, gBB) === "", "a gold long $2.15 under the Bollinger middle (past her $1.50) was refused");
t(f("gold", 4020.5, "up", gL, gBB) === "", "a gold long OVER the Bollinger middle, $3.87 under the upper, was refused");
t(/Bollinger upper/.test(f("gold", 4023.5, "up", gL, gBB)), "a gold long $0.87 under the Bollinger upper was NOT refused");
// (2) her 10:07 AM BTC short from over the Bollinger upper - her wick rejection stays hers
t(f("btc", 73297.75, "down", bL, { bbU: 73276.22, bbL: 72900 }) === "", "the 10:07 AM BTC short from over the Bollinger upper (her wick rejection) was refused");
t(f("gold", 4015.0, "up", gL, gBB) === "", "a gold long from under the Bollinger lower (her rejection back in) was refused");
// shorts mirror: over the middle / over the lower = refused inside the limit
t(/Bollinger middle/.test(f("gold", 4021.0, "down", gL, gBB)), "a gold short $0.85 over the Bollinger middle was NOT refused");
t(/Bollinger lower/.test(f("gold", 4016.9, "down", gL, gBB)), "a gold short $0.97 over the Bollinger lower was NOT refused");
// limits: gold = the smaller of $1.50 and 10% of the channel; a $10 channel = $1.00
const tight = [["session VWAP", 4015], ["+1σ", 4025]].map(([name, price]) => ({ name, price }));
t(f("gold", 4018.9, "up", tight, gBB) === "", "gold in a $10 channel: $1.25 under the middle was refused (her limit there is 10% = $1.00)");
t(/BOLLINGER BLOCK/.test(f("gold", 4019.3, "up", tight, gBB)), "gold in a $10 channel: $0.85 under the middle was NOT refused");
// BTC = 10% of the channel ($620 channel = $62)
t(/BOLLINGER BLOCK/.test(f("btc", 73076.3, "up", bL, { bbU: 73400, bbL: 72845.48 })), "a BTC long $46 under the Bollinger middle in a $620 channel was NOT refused");
t(f("btc", 73050, "up", bL, { bbU: 73400, bbL: 72845.48 }) === "", "a BTC long $72.74 under the Bollinger middle (past 10% = $62) was refused");
// nothing to read = the rule says nothing (her other walls still judge)
globalThis.__bbsr = {}; t(f("gold", 4019.07, "up", gL) === "", "no Bollinger on record still refused");
t(f("btc", 73076.3, "up", [], { bbU: 73400, bbL: 72845.48 }) === "", "BTC with no session bands to read still refused");
globalThis.__bbsr = { gold: Object.assign({ at: Date.now() }, gBB) }; t(/BOLLINGER BLOCK/.test(f("gold", 4019.07, "up", gL)), "her chart's Bollinger (__bbsr, fresh) was not read");
globalThis.__bbsr = { gold: Object.assign({ at: Date.now() - 30000 }, gBB) }; t(f("gold", 4019.07, "up", gL) === "", "a Bollinger older than 20 s was used");
// the last line calls it, every book but delayed, and her fix821 target rule is still there
t(/if \(book !== "recon-dly" && book !== "recon-dlyk"\) \{ const bb1068 = .*bollBlock1068\(sym, Number\(q\.c\), side,.*if \(bb1068\) return bb1068; \}/.test(K), "the last line (judgeOrder601) does not call bollBlock1068 for every book but delayed");
t(/if \(!why\) why = target821\(asset, tick, side, L\);/.test(B), "her fix821 target-by-a-line rule is gone");
console.log(ok ? "BOLLINGER BLOCK 1068 TEST: PASS ✓ (gold long under the middle refused; BTC wick rejection kept; limits and the last line proven)" : "BOLLINGER BLOCK 1068 TEST: FAILED");
process.exit(ok ? 0 : 1);
