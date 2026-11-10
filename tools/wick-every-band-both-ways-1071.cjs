#!/usr/bin/env node
// fix1071 HER WICK ON EVERY BAND AND EVERY ZONE + EVERY RULE BOTH WAYS (Love Nov 10 2026 11:24 AM PT: "MAKE A REJECTION WICK FOR EVERY BAND AND EVERY ZONE. STOP MAKING RULES ONE SIDED. EVERY RULE APPLIES BOTH WAYS UNLESS EXPLICITLY STATED OTHERWISE.") - TEST: no network, no order.
// (1) her wick rejection now reads the Bollinger MIDDLE, longs and shorts, by her same measure (within 10% of the band, 15% of the channel back off the wick extreme); every line it read before still answers the same.
// (2) a rejection long off her Green zone with price inside the zone (5m S2 to 5m S1) is on her side - the mirror of fix1069; her colour still judges it.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("WICK EVERY BAND BOTH WAYS 1071 TEST: FAIL - " + m); } };
const grab = (name) => { const i = B.indexOf("export function " + name + "("); if (i < 0) { console.log("WICK EVERY BAND BOTH WAYS 1071 TEST: FAIL - " + name + " is not in bandlock.ts"); process.exit(1); }
  const nl = B.indexOf("\n", i), first = B.slice(i, nl); const e = /\{\s*$/.test(first) ? B.indexOf("\n}", i) + 2 : nl; return B.slice(i, e).replace(/^export /, ""); };
const tj = (s) => ts.transpileModule(s, { compilerOptions: { target: 99 } }).outputText;
// ---- (1) the wick: rejBand668 with her real 11:15 AM board (session -2σ 72985.71 / -1σ 73639.77 = $654.06 channel; Bollinger middle 73236.76)
const iW = B.indexOf("export function rejBand668("), eM = "return best; } catch { return null; } }", srcW = B.slice(iW, B.indexOf(eM, iW) + eM.length).replace(/^export /, "");
const srcB = (() => { const i = B.indexOf("export function wickBack1072("); return B.slice(i, B.indexOf("\n", i)).replace(/^export /, ""); })();
const mk = (bbsr) => new Function("G", "DLY465", "fiveHLNow", "carryExtra617", tj(srcB + "\n" + srcW) + "; return rejBand668;")({ __bbsr: bbsr, __curBook465: "recon-tog" }, new Set(["recon-dly", "recon-dlyk"]), () => null, undefined);
const L = [["session VWAP", 74293.83], ["-1σ", 73639.77], ["-2σ", 72985.71], ["-3σ", 72331.65], ["+1σ", 74947.88]].map(([name, price]) => ({ name, price }));
const bb = { btc: { bbU: 73611.19, bbL: 72862.33, at: Date.now() }, gold: { bbU: 73611.19, bbL: 72862.33, at: Date.now() } }; const mid = (73611.19 + 72862.33) / 2; // 73236.76
const w = mk(bb), W = 654.06;
let r = w("btc", "up", 73236 + 0.15 * W + 1, L, { h: 73400, l: 73236 }); t(r && r.name === "Bollinger middle", "a long wick off the Bollinger middle ($98 back off the wick low) is still not her wick");
r = w("btc", "up", 73262, L, { h: 73400, l: 73236 }); t(r && r.name === "Bollinger middle", "her 11:15 AM BTC wick: $26 back off the wick low over the Bollinger middle is still not her wick (her $25 push)");
r = w("btc", "up", 73258, L, { h: 73400, l: 73236 }); t(r === null, "a BTC long only $22 off the wick low was called a wick (her push is $25)");
r = w("gold", "up", 73297, L, { h: 73400, l: 73236 }); t(r === null, "gold: a move under 10% of the channel ($61 of $65) was called a wick - her gold wick is 10%");
r = w("gold", "up", 73236 + 0.10 * W + 1, L, { h: 73400, l: 73236 }); t(r && r.name === "Bollinger middle", "gold: 10% of the channel back off the wick is still not her wick (her 10% gold wick)");
r = w("btc", "down", 73237 - 0.15 * W - 1 + 0, L, { h: 73237.5, l: 73100 }); t(r && r.name === "Bollinger middle", "a short wick off the Bollinger middle is not her wick (one sided)");
r = w("btc", "down", 73211, L, { h: 73237.5, l: 73100 }); t(r && r.name === "Bollinger middle", "a BTC short $26 off the wick high under the Bollinger middle is not her wick (one sided)");
r = w("btc", "down", 73216, L, { h: 73237.5, l: 73100 }); t(r === null, "a BTC short only $21 off the wick high was called a wick");
r = w("btc", "up", 73400, L, { h: 73450, l: 73236 + 0.11 * W }); t(r === null, "a wick that never came within 10% of the Bollinger middle was called a wick");
const wNo = mk({}); t(wNo("btc", "up", 73236 + 0.15 * W + 1, L, { h: 73400, l: 73236 }) === null, "with no Bollinger on record she still called a Bollinger middle wick");
const wOld = mk({ btc: { bbU: 73611.19, bbL: 72862.33, at: Date.now() - 30000 } }); t(wOld("btc", "up", 73236 + 0.15 * W + 1, L, { h: 73400, l: 73236 }) === null, "a Bollinger older than 20 s was used for her wick");
// lines she read before answer the same: a wick off -1σ from under it (short) and off the Bollinger upper handed in her list
r = w("btc", "down", 73639.77 - 0.15 * W - 1, L, { h: 73640.5, l: 73500 }); t(r && r.name === "-1σ", "her wick off -1σ changed");
const L2 = [...L, { name: "Bollinger upper", price: 73611.19 }, { name: "Bollinger lower", price: 72862.33 }];
r = mk({})("btc", "up", 72862 + 0.15 * W + 1, L2, { h: 73100, l: 72862 }); t(r && r.name === "Bollinger lower", "her wick off the Bollinger lower changed");
globalThis.__x = 0; t(B.includes('/* fix1036 HER WICK 15%'), "her fix1036 wick line is gone");
{ const f = new Function(tj(srcB) + "; return wickBack1072;")(); t(f("btc", 655) === 25 && f("btc", 100) === 15 && Math.abs(f("gold", 40) - 4) < 1e-9 && Math.abs(f("xrp", 40) - 6) < 1e-9, "her push: BTC $25 (15% when smaller), gold 10%, the rest 15%"); }
// ---- (2) the green zone mirror: herEntry951
const src = ["line951", "linePrice951", "inGreen1071", "inRed1069", "herEntry951"].map(grab).join("\n");
const make = (colour, wick) => new Function("rej668", "herColour949", "DLY465", "G", "carryExtra617", tj(src) + "; return herEntry951;")(() => wick, () => colour, new Set(["recon-dly", "recon-dlyk"]), { __curBook465: "recon-tog", __bbsr: {} }, undefined);
const Z = [["5m PP", 73333.7], ["5m R1", 73514.12], ["5m R2", 73634.4], ["5m S1", 73153.29], ["5m S2", 73033.0]].map(([name, price]) => ({ name, price }));
const green = make(true, false), notGreen = make(false, false), wk = make(false, true);
t(green("btc", "up", 73150, "Rejected up off Green zone", Z) === "", "a long inside the Green zone is still refused (one sided)");
t(/NOT HER COLOUR \(fix951\)/.test(notGreen("btc", "up", 73150, "Rejected up off Green zone", Z)), "a long inside the Green zone went in without her colour");
t(wk("btc", "up", 73150, "Rejected up off Green zone", Z) === "", "a wick rejection inside the Green zone was refused for colour");
t(/NOT ON HER SIDE/.test(green("btc", "up", 73000, "Rejected up off Green zone", Z)), "a long from UNDER the bottom of the Green zone was let in");
t(green("btc", "up", 73160, "Rejected up off Green zone", Z) === "", "a long over the Green zone (always hers) was refused");
t(/NOT ON HER SIDE/.test(green("btc", "up", 73150, "Break above Green zone", Z)), "a BREAK above the Green zone with price still inside it was let in");
t(green("btc", "down", 73518.82, "Rejected down off Red zone", Z) === "", "her short inside the Red zone (fix1069) changed");
t(/NOT ON HER SIDE/.test(green("btc", "up", 73330, "Rejected up off 5m PP", Z)), "a long off the pink from under it changed");
console.log(ok ? "WICK EVERY BAND BOTH WAYS 1071 TEST: PASS ✓ her wick reads the Bollinger middle both ways; her BTC wick push is $25; her gold wick is 10% of the channel; a long inside the Green zone is on her side (her colour still judges); everything else unchanged" : "");
process.exit(ok ? 0 : 1);
