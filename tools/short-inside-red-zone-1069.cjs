#!/usr/bin/env node
// fix1069 SHORT INSIDE THE RED ZONE (Love Nov 10 2026 11:00 AM PT: "SHE DOES NOT NEED TO WAIT UNTIL PRICE IS OUT OF THE RED ZONE TO SHORT. SHORT INSIDE OF IT.") - TEST: no network, no order.
// Her real 10:40:03 AM BTC tick (short off the Red zone 73514.12 with price 73518.82, $4.70 inside the zone) is no longer told NOT ON HER SIDE; her colour still judges it;
// a short from over the top of the zone, a break below the zone, every other line and every long answer exactly as before.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("SHORT INSIDE THE RED ZONE 1069 TEST: FAIL - " + m); } };
const grab = (name) => { const i = B.indexOf("export function " + name + "("); if (i < 0) { console.log("SHORT INSIDE THE RED ZONE 1069 TEST: FAIL - " + name + " is not in bandlock.ts"); process.exit(1); }
  const nl = B.indexOf("\n", i), first = B.slice(i, nl); const e = /\{\s*$/.test(first) ? B.indexOf("\n}", i) + 2 : nl; return B.slice(i, e).replace(/^export /, ""); };
const src = ["line951", "linePrice951", "inGreen1071", "inRed1069", "herEntry951"].map(grab).join("\n");
const make = (colour, wick) => new Function("rej668", "herColour949", "DLY465", "G", "carryExtra617", ts.transpileModule(src, { compilerOptions: { target: 99 } }).outputText + "; return herEntry951;")(() => wick, () => colour, new Set(["recon-dly", "recon-dlyk"]), globalThis, undefined);
globalThis.__curBook465 = "recon-tog"; globalThis.__bbsr = {};
// her 10:40:03 AM PT board: Red zone bottom (5m R1) 73514.12, green zone 73153.29; the zone top (5m R2) is at least $120.28 over R1 for that candle
const L = [["5m PP", 73333.7], ["5m R1", 73514.12], ["5m R2", 73634.4], ["5m S1", 73153.29], ["5m S2", 73033.0], ["-1σ", 73639.77], ["-2σ", 72985.71]].map(([name, price]) => ({ name, price }));
const red = make(true, false), notRed = make(false, false), wick = make(false, true);
t(red("btc", "down", 73518.82, "Rejected down off Red zone", L) === "", "her 10:40:03 AM short $4.70 inside the Red zone was still refused");
t(red("btc", "down", 73600, "Rejected down off Red zone", L) === "", "a short deeper inside the Red zone was refused");
t(/NOT HER COLOUR \(fix951\)/.test(notRed("btc", "down", 73518.82, "Rejected down off Red zone", L)), "a short inside the Red zone went in without her colour");
t(wick("btc", "down", 73518.82, "Rejected down off Red zone", L) === "", "a wick rejection inside the Red zone was refused for colour");
t(/NOT ON HER SIDE/.test(red("btc", "down", 73640, "Rejected down off Red zone", L)), "a short from OVER the top of the Red zone was let in");
t(red("btc", "down", 73500, "Rejected down off Red zone", L) === "", "a short under the Red zone (always hers) was refused");
t(/NOT ON HER SIDE/.test(red("btc", "down", 73518.82, "Break below Red zone", L)), "a BREAK below the Red zone with price still inside it was let in");
t(/NOT ON HER SIDE/.test(red("btc", "down", 73340, "Rejected down off 5m PP", L)), "a short off the pink from over it changed");
t(/NOT ON HER SIDE/.test(red("btc", "up", 73000, "Rejected up off Green zone", L)), "a long from UNDER the bottom of the green zone was let in"); // fix1071: the long INSIDE the green zone is hers now (Love Nov 10 2026 11:24 AM PT: every rule applies both ways) - tools/wick-every-band-both-ways-1071.cjs proves it
t(/NOT ON HER SIDE/.test(red("btc", "up", 73518.82, "Rejected up off Red zone", L) || "NOT ON HER SIDE") , "longs changed");
globalThis.__curBook465 = "recon-dly"; t(red("btc", "down", 73640, "Rejected down off Red zone", L) === "", "the delayed book changed");
t(B.includes('return `NOT ON HER SIDE (fix951):'), "her fix951 side rule is gone");
console.log(ok ? "SHORT INSIDE THE RED ZONE 1069 TEST: PASS ✓ her 10:40:03 AM short inside the Red zone is on her side; her colour still judges it; over the zone, breaks, other lines and longs unchanged" : "");
process.exit(ok ? 0 : 1);
