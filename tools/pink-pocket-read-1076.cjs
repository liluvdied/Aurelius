#!/usr/bin/env node
// fix1076 HER PINK POCKET REACHES HER READ - TEST: no network, no order. Replays her real 12:15 PM Nov 10 2026 BTC board through main's read wall (pinkRead464).
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8").split("\n");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("PINK POCKET IN HER READ 1076 TEST: FAIL - " + m); } };
const line = (pref) => { const k = R.filter((l) => l.startsWith(pref)); if (k.length !== 1) { console.log("PINK POCKET IN HER READ 1076 TEST: FAIL - '" + pref + "' found " + k.length + " times in recon.ts"); process.exit(1); } return k[0]; };
const i0 = R.findIndex((l) => l.startsWith("export function pinkRead464(")), i1 = R.findIndex((l, j) => j > i0 && l === "}");
const src = [line("export const __PINKFLAT25 ="), line("function pinkSlide580R("), line("function pinkOne927R("), line("function pocket1076R("), R.slice(i0, i1 + 1).join("\n")].join("\n").replace(/^export /gm, "");
const tj = (s) => ts.transpileModule(s, { compilerOptions: { target: 99 } }).outputText;
const G = globalThis; G.__curBook465 = "recon-tog"; G.__sessCarried = {};
const read = new Function("weekendPink914", "carryWalls612", "carryTol615", tj(src) + "; return pinkRead464;")(undefined, undefined, undefined);
// her real board at 12:15 PM PT: session VWAP 74235.35, sd 673.59 -> -1σ 73561.76, -2σ 72888.16 (channel $673.60, 20% = $134.72)
const L = [["session VWAP", 74235.35], ["+1σ", 74908.94], ["-1σ", 73561.76], ["-2σ", 72888.16]].map(([name, price]) => ({ name, price }));
const pink = 73376.12, r1 = pink + 152.16, s1 = pink - 152.16; // her door's own number at 12:15:22: "$76.08 cushion" = half of pink-to-5m R1
// before: with no pocket known, the read holds her 12:15:09 short ($84.57 over the pink, inside 20% of the channel = $134.72)
G.__pv1076 = {}; t(read("btc", L, 73460.69, "down", pink) === true, "without the pocket the read should still hold by her one pink rule (20% of the channel)");
// after: her pocket (50% of pink-to-red = $76.08) - her 12:15:09 short is clear of the pink in the read
G.__pv1076 = { btc: { pp: pink, r1, s1 } };
t(read("btc", L, 73460.69, "down", pink) === false, "her 12:15:09 PM BTC short, $84.57 over the pink with a $76.08 pocket, is still refused by the pink in her read");
t(read("btc", L, 73472.64, "down", pink) === false, "her 12:15:05 PM first look ($96.52 over the pink) is still refused by the pink in her read");
t(read("btc", L, 73440.65, "down", pink) === true, "$64.53 over the pink is inside her $76.08 pocket clearance - the pink always counts, the read must still hold (same as her door at 12:15:22)");
// the mirror: a long under the pink inside the pink-to-green pocket (pink .. 5m S1)
t(read("btc", L, pink - 84.57, "up", pink) === false, "the mirror long, $84.57 under the pink inside the pink-to-green pocket, is refused (the rule must work both ways)");
t(read("btc", L, pink - 64.53, "up", pink) === true, "the mirror long $64.53 under the pink must still hold (inside her pocket clearance)");
// outside the pocket: her one pink rule, unchanged (20% of the channel = $134.72)
G.__pv1076 = { btc: { pp: pink, r1: pink + 40, s1: pink - 40 } };
t(read("btc", L, pink + 100, "down", pink) === true && read("btc", L, pink + 140, "down", pink) === false, "outside the pocket her 20% pink rule changed");
// a remembered pivot that is not this pink is never used
G.__pv1076 = { btc: { pp: pink + 30, r1: r1 + 30, s1: s1 + 30 } }; t(read("btc", L, 73460.69, "down", pink) === true, "a pocket from a different pink was used");
// delayed books keep their own scale (no pocket)
G.__pv1076 = { btc: { pp: pink, r1, s1 } }; G.__curBook465 = "recon-dly"; const dly = read("btc", L, 73460.69, "down", pink); G.__pv1076 = {}; t(read("btc", L, 73460.69, "down", pink) === dly, "the delayed book changed"); G.__curBook465 = "recon-tog";
// gold, both ways: pocket $4 wide -> $2 clearance
{ const LG = [["session VWAP", 4080.95], ["-1σ", 4041.39], ["-2σ", 4001.83]].map(([name, price]) => ({ name, price })); const pg = 4029.57; G.__pv1076 = { gold: { pp: pg, r1: pg + 4, s1: pg - 4 } };
  t(read("gold", LG, pg + 2.5, "down", pg) === false && read("gold", LG, pg + 1.5, "down", pg) === true, "gold short: her pocket (50% of pink-to-red) is not what the read measures");
  t(read("gold", LG, pg - 2.5, "up", pg) === false && read("gold", LG, pg - 1.5, "up", pg) === true, "gold long: her pocket (50% of pink-to-green) is not what the read measures"); }
// the one pink is remembered and returned unchanged
{ const w = line("const onePink565R = "); const f = new Function(tj(w) + "; return onePink565R;")(); const pv = { pp: 1, r1: 2, s1: 0.5 }; G.__onePink565 = () => pv; G.__pv1076 = {}; t(f("btc", []) === pv && G.__pv1076.btc === pv, "the one pink is not returned exactly as before / not remembered"); G.__onePink565 = undefined; t(f("btc", []) === null, "with no pink source the read's pink must be null as before"); }
console.log(ok ? "PINK POCKET IN HER READ 1076 TEST: PASS ✓ her 12:15:09 PM BTC short ($84.57 over the pink, $76.08 pocket) clears the pink in her read; inside the pocket clearance it still holds; longs mirror it; outside the pocket, delayed books and gold's one pink rule unchanged" : "");
process.exit(ok ? 0 : 1);
