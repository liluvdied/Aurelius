#!/usr/bin/env node
// fix1079 HER THIRDS, ONE MEASURE IN HER READ - TEST: no network, no order.
// 1) her read's flip ("Top third - seen as a short" / "Bottom third - seen as a long") and its thirds filter ask her read wall's own thirds (thirdsRead463) - no flat 67% / 33% left there.
// 2) thirdsRead463 on her real boards of Nov 10 2026: session band to session band, her sliding share, her 3% margin, both ways.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const RS = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8"), BS = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("THIRDS ONE MEASURE 1079 TEST: FAIL - " + m); } };
// 1) the sweep: inside bonesDecide's perspective no flat share decides a flip or a thirds refusal
const R = RS.split("\n"); const p0 = R.findIndex((l) => l.includes("perspective = (cs) => {")), p1 = R.findIndex((l, j) => j > p0 && /^    };\s*$/.test(l));
t(p0 > 0 && p1 > p0, "her perspective block was not found in recon.ts");
const P = R.slice(p0, p1 + 1).join("\n");
t(/const top1079 = thirdsRead463\(L, spot, "up", asset\), bot1079 = thirdsRead463\(L, spot, "down", asset\)/.test(P), "her read's flip does not ask thirdsRead463");
t(!/f >= 0\.67/.test(P) && !/f <= 0\.33/.test(P), "a flat 67% / 33% is still deciding inside her read's flip or thirds filter");
t(/c\.side === "up" && top1079/.test(P) && /c\.side === "down" && bot1079/.test(P), "the flip is not on her one measure both ways");
t(/\(c\.side === "up" && \(top1079/.test(P) && /\(c\.side === "down" && \(bot1079/.test(P), "the thirds filter is not on her one measure both ways");
// 2) her one measure on her real numbers
const grab = (src, start) => { const A = src.split("\n"); const i0 = A.findIndex((l) => l.startsWith(start)); if (i0 < 0) { console.log("THIRDS ONE MEASURE 1079 TEST: FAIL - '" + start + "' not found"); process.exit(1); } if (!/\{\s*$/.test(A[i0]) ) return A[i0]; const i1 = A.findIndex((l, j) => j > i0 && l === "}"); return A.slice(i0, i1 + 1).join("\n"); };
const src = ["const G = globalThis;", grab(BS, "export function carryExtra617("), grab(BS, "export function thirdsChannel1050("), grab(RS, "export const MARGIN648 ="), grab(RS, "export function thirdsRead463(")].join("\n").replace(/^export /gm, "");
const read = new Function(ts.transpileModule(src, { compilerOptions: { target: 99 } }).outputText + "; return thirdsRead463;")();
globalThis.__sessCarry = {};
const board = (v, sd) => [["session VWAP", v], ["+1σ", v + sd], ["-1σ", v - sd], ["+2σ", v + 2 * sd], ["-2σ", v - 2 * sd], ["+3σ", v + 3 * sd], ["-3σ", v - 3 * sd]].map(([name, price]) => ({ name, price }));
// gold 12:42 PM PT: VWAP 4080.14, sd 39.72 -> -1σ 4040.42, -2σ 4000.70 (a $39.72 channel: her 15% + 3%)
const g = board(4080.14, 39.72);
t(read(g, 4031.86, "up", "gold") === false, "gold 4031.86 (78% of -2σ..-1σ) is still called her top share - her scale is 15% over $25");
t(read(g, 4034.50, "up", "gold") === true, "gold 4034.50 (85% of the channel) should be her top share: no long");
t(read(g, 4009.00, "down", "gold") === false, "gold 4009.00 (21% of the channel) is still called her bottom share for a short");
t(read(g, 4006.00, "down", "gold") === true, "gold 4006.00 (13% of the channel) should be her bottom share: no short");
// BTC 12:15 PM PT: VWAP 74235.35, sd 673.59 -> -1σ 73561.76, -2σ 72888.16 (a $673.60 channel: her 20% + 3%)
const b = board(74235.35, 673.59);
t(read(b, 73369.72, "up", "btc") === false, "BTC 73369.72 (71% of -2σ..-1σ) is still called her top share - her scale is 20% over $500");
t(read(b, 73430.00, "up", "btc") === true, "BTC 73430.00 (80% of the channel) should be her top share: no long");
t(read(b, 73060.00, "down", "btc") === false, "BTC 73060.00 (26% of the channel) is still called her bottom share for a short");
t(read(b, 72990.00, "down", "btc") === true, "BTC 72990.00 (15% of the channel) should be her bottom share: no short");
if (ok) console.log("THIRDS ONE MEASURE 1079 TEST: PASS ✓ her read's flip and thirds filter ask her one measure (session band to session band, her sliding share, her 3% margin), both ways; gold 12:42 PM at 78% is not her top share; her top 15% gold / 20% BTC still holds longs, her bottom share still holds shorts");
process.exit(ok ? 0 : 1);
