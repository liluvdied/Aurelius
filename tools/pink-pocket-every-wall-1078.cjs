#!/usr/bin/env node
// fix1078 HER PINK POCKET AT EVERY PINK WALL - TEST: no network, no order. Replays her real 12:31:33 PM Nov 10 2026 gold board.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8").split("\n");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("PINK POCKET EVERY WALL 1078 TEST: FAIL - " + m); } };
const one = (pref) => { const k = B.filter((l) => l.startsWith(pref)); if (k.length !== 1) { console.log("PINK POCKET EVERY WALL 1078 TEST: FAIL - '" + pref + "' found " + k.length + " times"); process.exit(1); } return k[0]; };
const fn = (name) => { const i0 = B.findIndex((l) => l.startsWith("export function " + name + "(")); if (i0 < 0) { console.log("PINK POCKET EVERY WALL 1078 TEST: FAIL - " + name + " not found"); process.exit(1); } if (/\}\s*(\/\/.*)?$/.test(B[i0]) && !/\{\s*$/.test(B[i0])) return B[i0]; const i1 = B.findIndex((l, j) => j > i0 && l === "}"); return B.slice(i0, i1 + 1).join("\n"); };
const src = [one("export const __PINKFLAT25 ="), one("export const PINK_BREAK432"), one("export const __PINKSLIDE_HERWAY584 ="), fn("pocket938"), fn("pinkOne927"), fn("pinkFar503"), fn("pinkBeyond459"), fn("pinkShortWall464")].join("\n").replace(/^export /gm, "");
const tj = (s) => ts.transpileModule(s, { compilerOptions: { target: 99 } }).outputText;
globalThis.__curBook465 = "recon-tog";
const M = new Function("DLY465", "pinkSlide580", "carryOn612", "carryTol615", "anyGreen521", "turnFlip530", "pinkSpent515c", tj(src) + "; return { pinkFar503, pinkBeyond459, pinkShortWall464, pocket938 };")(new Set(["recon-dly", "recon-dlyk"]), (a, W) => 0.2 * W, () => false, () => 25, () => false, () => false, () => false);
// gold 12:31:33 PM PT: session VWAP 4080.95, -1σ 4041.39, -2σ 4001.83 (channel $39.56, 20% = $7.91); pink 4032.47; 5m R1 4036.19 -> pocket 50% = $1.86
const pg = 4032.47, LG = [["session VWAP", 4080.95], ["-1σ", 4041.39], ["-2σ", 4001.83], ["5m PP", pg], ["5m R1", pg + 3.72], ["5m S1", pg - 3.72]].map(([name, price]) => ({ name, price }));
t(Math.abs(M.pocket938("gold", LG, 4035.51, 39.56) - 1.86) < 1e-9, "her pocket on this board is not $1.86");
t(M.pinkShortWall464("gold", LG, 4035.51, "down") === "", "her 12:31:33 PM gold short, $3.04 over the pink with a $1.86 pocket, is still refused by 'no short over an unbroken pink'");
t(/NO SHORT OVER AN UNBROKEN PINK/.test(M.pinkShortWall464("gold", LG, pg + 1.5, "down")), "$1.50 over the pink is inside her $1.86 pocket clearance - the pink always counts, the short must still be refused");
t(M.pinkBeyond459("gold", LG, pg - 3.04, pg) === true, "the mirror: a gold long $3.04 under the pink (pocket $1.86) must be clear of 'no long under an unbroken pink'");
t(M.pinkBeyond459("gold", LG, pg - 1.5, pg) === false, "the mirror: a long $1.50 under the pink must still be held");
t(M.pinkFar503("gold", LG, 4035.51, pg) === true && M.pinkFar503("gold", LG, pg + 1.5, pg) === false && M.pinkFar503("gold", LG, pg - 3.04, pg) === true, "'is the pink far' does not measure her pocket both ways");
// outside the pocket (pink to R1 only $1 wide; price beyond it): her 20% rule, unchanged ($7.91)
{ const LO = LG.map((l) => l.name === "5m R1" ? { name: l.name, price: pg + 1 } : l.name === "5m S1" ? { name: l.name, price: pg - 1 } : l);
  t(/NO SHORT OVER/.test(M.pinkShortWall464("gold", LO, pg + 5, "down")) && M.pinkShortWall464("gold", LO, pg + 8.5, "down") === "", "outside the pocket her 20% pink rule changed (short)");
  t(M.pinkBeyond459("gold", LO, pg - 5, pg) === false && M.pinkBeyond459("gold", LO, pg - 8.5, pg) === true, "outside the pocket her 20% pink rule changed (long)"); }
// BTC, both ways: channel $673.60 (20% = $134.72), pink 73,376.12, R1 +152.16 -> pocket $76.08
{ const pb = 73376.12, LB = [["session VWAP", 74235.35], ["-1σ", 73561.76], ["-2σ", 72888.16], ["5m PP", pb], ["5m R1", pb + 152.16], ["5m S1", pb - 152.16]].map(([name, price]) => ({ name, price }));
  t(M.pinkShortWall464("btc", LB, pb + 84.57, "down") === "" && /NO SHORT OVER/.test(M.pinkShortWall464("btc", LB, pb + 64.53, "down")), "BTC short: her pocket ($76.08) is not what the wall measures");
  t(M.pinkBeyond459("btc", LB, pb - 84.57, pb) === true && M.pinkBeyond459("btc", LB, pb - 64.53, pb) === false, "BTC long: her pocket ($76.08) is not what the wall measures"); }
// delayed books keep their own scale
globalThis.__curBook465 = "recon-dly"; t(/NO SHORT OVER/.test(M.pinkShortWall464("gold", LG, 4035.51, "down")), "the delayed book changed"); globalThis.__curBook465 = "recon-tog";
// THE SWEEP: no pink measure on her main desk may bypass her pocket. Every use of her one pink rule in bandlock.ts must sit on a line that goes through pocket938; in recon.ts it must go through pocket1076R.
{ const uses = B.map((l, i) => [i + 1, l]).filter(([, l]) => /pinkOne927\(asset,/.test(l) && !l.startsWith("export function pocket938(") && !l.startsWith("export function pinkOne927("));
  const bare = uses.filter(([, l]) => !/pocket938\(/.test(l)).map(([n]) => n);
  t(uses.length === 7, "expected her 7 pink measures in bandlock.ts (reach, under-the-pink longs, is-the-pink-far, no long under pink, over-the-pink shorts, no short over pink, pink cushion) - found " + uses.length);
  t(bare.length === 0, "a pink measure in bandlock.ts bypasses her pocket at line(s) " + bare.join(", "));
  const Rc = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8").split("\n");
  const ru = Rc.map((l, i) => [i + 1, l]).filter(([, l]) => /pinkOne927R\(asset,/.test(l) && !l.startsWith("function pinkOne927R("));
  t(ru.length === 1 && /pocket1076R\(asset, spot, pink, pinkOne927R\(/.test(ru[0][1]), "her read's pink wall in recon.ts does not go through her pocket (fix1076)"); }
console.log(ok ? "PINK POCKET EVERY WALL 1078 TEST: PASS ✓ her 12:31:33 PM gold short ($3.04 over the pink, $1.86 pocket) clears 'no short over an unbroken pink'; inside the pocket clearance it still holds; longs mirror it; BTC the same; outside the pocket and delayed books unchanged; all 8 pink measures on her main desk (7 in her walls, 1 in her read) go through her pocket" : "");
process.exit(ok ? 0 : 1);
