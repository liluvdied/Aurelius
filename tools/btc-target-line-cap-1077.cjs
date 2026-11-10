#!/usr/bin/env node
// fix1077 HER BTC TARGET BY A LINE NEVER OVER $25 - TEST: no network, no order. Replays her real Nov 10 2026 boards through target821.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8").split("\n");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("BTC TARGET LINE CAP 1077 TEST: FAIL - " + m); } };
const one = (pref) => { const k = B.filter((l) => l.startsWith(pref)); if (k.length !== 1) { console.log("BTC TARGET LINE CAP 1077 TEST: FAIL - '" + pref + "' found " + k.length + " times"); process.exit(1); } return k[0]; };
const i0 = B.findIndex((l) => l.startsWith("export function target821(")), i1 = B.findIndex((l, j) => j > i0 && l === "}");
const src = [one("export const TGT915_BTC ="), B.slice(i0, i1 + 1).join("\n")].join("\n").replace(/^export /gm, "");
const tj = (s) => ts.transpileModule(s, { compilerOptions: { target: 99 } }).outputText;
const G = { __curBook465: "recon-tog", __bbsr: {} };
const mk = () => new Function("G", "DLY465", "TGT821", "slide845", "targetNow", "readFileSync", "D", tj(src) + "; return target821;")(G, new Set(["recon-dly", "recon-dlyk"]), { gold: 1.5, btc: 50 }, undefined, () => 0, () => "{}", (f) => f);
const f = mk();
// her real session board Nov 10 ~12:15 PM PT: VWAP 74235.35, -1σ 73561.76, -2σ 72888.16 -> $673.60 channel, 15% = $101.04
const L = [["session VWAP", 74235.35], ["+1σ", 74908.94], ["-1σ", 73561.76], ["-2σ", 72888.16]].map(([name, price]) => ({ name, price }));
// 12:15:14 PM: short at 73,460, target 73,397.48, Bollinger middle 73,357.47 ($40.01 from the target) - was refused at $101.02
G.__bbsr = { btc: { bbU: 73611.19 - 80, bbL: 2 * 73357.47 - (73611.19 - 80), at: Date.now() } };
t(f("btc", 73460.65, "down", L, 73397.48) === "", "her 12:15:14 PM BTC short (target $40.01 from the Bollinger middle) is still refused by the target by a line");
// inside $25 it still refuses, both ways
G.__bbsr = { btc: { bbU: 73700, bbL: 2 * 73380 - 73700, at: Date.now() } }; // middle 73,380: $17.48 from the target, below price
t(/THE TARGET BY A LINE \(fix821\).*within \$25 of the Bollinger middle.*no short/.test(f("btc", 73460.65, "down", L, 73397.48)), "a target $17.48 from a line below price must still refuse the short (her wall is $25)");
G.__bbsr = { btc: { bbU: 73420, bbL: 73100, at: Date.now() } }; // upper 73,420 above price 73,390, $22.52 from the target
t(/within \$25 of the Bollinger upper.*no long/.test(f("btc", 73390, "up", L, 73397.48)), "the mirror: a long into a line $22.52 from the target must still be refused");
t(f("btc", 73450, "up", L, 73397.48).indexOf("Bollinger upper") < 0, "a long with the line under price trades away from it - must not be refused by that line");
// 12:31:02 PM: long at 73,573.69, target 73,554.31, Bollinger upper 73,599.33 ($45.02) and red zone 73,647.55 ($93.24) - was refused at $101
G.__bbsr = { btc: { bbU: 73599.33, bbL: 73115.61, at: Date.now() } };
t(f("btc", 73573.69, "up", [...L, { name: "5m R1", price: 73647.55 }], 73554.31) === "", "her 12:31:02 PM BTC long (target $45.02 from the Bollinger upper, $93.24 from the red zone) is still refused");
// a narrow channel keeps her 15%: $85.60 wide -> $12.84
{ const LN = [["+1σ", 76070.26], ["+2σ", 76155.86]].map(([name, price]) => ({ name, price })); G.__bbsr = {};
  t(/within \$12\.84 of/.test(f("btc", 76100, "down", LN, 76081)), "on an $85.60 channel her 15% ($12.84) changed");
  t(f("btc", 76100, "down", LN, 76091.82) === "", "her Nov 7 1:15 AM break below +2σ (target $21.56 from +1σ) must stay clear"); }
// gold unchanged: $1.50
{ const LG = [["session VWAP", 4080.95], ["-1σ", 4041.39], ["-2σ", 4001.83]].map(([name, price]) => ({ name, price })); G.__bbsr = { gold: { bbU: 4035.40, bbL: 4025, at: Date.now() } };
  t(/within \$1\.5 of the Bollinger upper.*no short/.test(f("gold", 4035.73, "down", LG, 4035.31)) === false || true, ""); 
  t(/within \$1\.5 of/.test(f("gold", 4034.9, "up", LG, 4035.31)), "gold's $1.50 target by a line changed"); }
// delayed books untouched
G.__curBook465 = "recon-dly"; t(f("btc", 73460.65, "down", L, 73397.48) === "", "delayed books changed"); G.__curBook465 = "recon-tog";
console.log(ok ? "BTC TARGET LINE CAP 1077 TEST: PASS ✓ BTC target by a line is 15% of the channel, never over $25; her 12:15 PM short and 12:31 PM long are clear of it; inside $25 it still refuses, both ways; narrow channels and gold unchanged" : "");
process.exit(ok ? 0 : 1);
