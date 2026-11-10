#!/usr/bin/env node
// fix1050 HER THIRDS, SESSION BAND TO SESSION BAND AS HER CHART DRAWS THEM - proof, read-only, no network, no order.
// Love Nov 9 2026 8:16 PM PT: "session band to session band. is how she calculates thirds. NO OTHER BANDS ARE IN THAT CALCULATION. EXAMPLE = SITTING AT A BAND / PRICE BREAKS THRU / FALLS = TOP THIRD"
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("THIRDS SESSION BAND 1050 TEST: FAIL - " + m); } };
const R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8"), B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
const ts = require(path.join(root, "node_modules/typescript"));
function grab(src, name) {
  const file = ts.createSourceFile("desk.ts", src, ts.ScriptTarget.Latest, true);
  return file.statements.find((st) => ts.isFunctionDeclaration(st) && st.name?.text === name).getText(file);
}
const m648 = (/export const MARGIN648 = [\d.]+;/.exec(R) || [""])[0];
const code = [m648, grab(B, "carryExtra617"), grab(B, "thirdsChannel1050"), grab(R, "thirdsRead463")].join("\n");
const js = ts.transpileModule(code, { compilerOptions: { module: 1, target: 99 } }).outputText;
const m = { exports: {} };
new Function("exports", "G", js)(m.exports, globalThis);
const { thirdsRead463 } = m.exports; const G = globalThis;
// tonight, 7:22:35 PM PT (her desk's own numbers): fresh session VWAP 74,999.30, σ 157.61 (-2σ 74,684.08, -1σ 74,841.69); her carried session (last session, still on her chart): VWAP 74,727.13, σ 376.70; pink 74,740.28 sat on the carried VWAP
const v = 74999.30, sd = 157.61, L = [{ name: "session VWAP", price: v }]; for (const s of [1, 2, 3]) L.push({ name: `+${s}σ`, price: v + s * sd }, { name: `-${s}σ`, price: v - s * sd });
G.__sessCarry = { btc: { cur: { v, sd }, prev: { v: 74727.13, sd: 376.70 } } };
t(thirdsRead463(L, 74734.56, "down") === false, "tonight's 7:22 PM BTC short (74,734.56, sitting at her carried session band 74,727.13) is the TOP third - it must pass");
G.__sessCarry = {}; t(thirdsRead463(L, 74734.56, "down") === true, "without her carried bands the old answer (bottom of -2σ -> -1σ) would come back - the carried bands must be what frees it");
G.__sessCarry = { btc: { cur: { v, sd }, prev: { v: 74727.13, sd: 376.70 } } };
G.__sessCarry = {}; t(thirdsRead463(L, 74705, "down") === true, "with no carried bands, a short at 74,705 ($21 over -2σ, past her 10% = not at the band; 13% of -2σ -> -1σ) is still the bottom third - refused"); G.__sessCarry = { btc: { cur: { v, sd }, prev: { v: 74727.13, sd: 376.70 } } };
t(thirdsRead463(L, 74690, "down") === false, "a short sitting at -2σ (74,690, $6 over it - within her 10%) is the top of -3σ -> -2σ - passes");
t(thirdsRead463(L, 74835, "up") === false, "a long sitting at -1σ from under it ($6.69) is the bottom of -1σ -> next band up - passes");
t(thirdsRead463(L, 74815, "up") === true, "a long at 74,815 ($27 under -1σ, past her 10%; 77% of carried VWAP 74,727 -> -1σ 74,842) is the top third - refused");
G.__sessCarry = { btc: { cur: { v, sd: 200 }, prev: { v: 74727.13, sd: 376.70 } } };
t(thirdsRead463(L, 74734.56, "down") === true, "her carried bands leave at her $180 (fix617) - with the new session at σ 200 they are gone");
const { thirdsChannel1050 } = m.exports;
const near = [...L, { name: "5m PP", price: 74735 }, { name: "BB upper", price: 74736 }, { name: "Red zone", price: 74737 }];
G.__sessCarry = { btc: { cur: { v, sd }, prev: { v: 74727.13, sd: 376.70 } } };
const ch = thirdsChannel1050("btc", near, 74734.56, "down");
t(ch.above === 74727.13 && ch.below === v - 2 * sd, "the carried edge and next drawn band must bound the short");
t(thirdsChannel1050("btc", near, 74727.13, "down").above === 74727.13, "exact touch belongs to the channel below for a short");
t(thirdsChannel1050("btc", near, 74727.13, "up").below === 74727.13, "exact touch belongs to the channel above for a long");
t(JSON.stringify(ch) === JSON.stringify(thirdsChannel1050("btc", L, 74734.56, "down")), "pink, Bollinger and zones must not change the channel");
t(/thirdsChannel1050\(asset, L, tick, side\)/.test(grab(B, "impossibleGeo")), "the order door must use the shared calculation");
t(/export const MARGIN648 = 0\.03;/.test(R) && /NO SHORTS IN THE BOTTOM RUNG: btc short at/.test(B), "3% margin and bottom rung must stay in place");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "thirds1050-"));
fs.writeFileSync(path.join(out, "bandlock.js"), ts.transpileModule(B, { compilerOptions: { module: 1, target: 99 } }).outputText);
fs.writeFileSync(path.join(out, "quotes.js"), "exports.quoteTick=()=>null;exports.feedHealth=()=>({ok:true});exports.quoteTrail=()=>[];");
fs.writeFileSync(path.join(out, "recon.js"), "exports.RECON={};");
const door = require(path.join(out, "bandlock.js"));
const live = door.impossibleGeo("btc", L, 74734.56, "down");
t(live.above === 74727.13 && live.pos === 1 && !/THE IMPOSSIBILITY|ONLY IN HER THIRD/.test(live.why), "the full order door misclassified the carried short: " + JSON.stringify(live));
G.__sessCarry = {};
const refused = door.impossibleGeo("btc", L, 74705, "down");
t(/THE IMPOSSIBILITY|ONLY IN HER THIRD/.test(refused.why), "the full order door must still refuse a short in the true bottom third");
console.log(ok ? "THIRDS SESSION BAND 1050 TEST ✓ - her thirds run session band to session band as her chart draws them (her carried session bands included until $180 / $5, nothing else): sitting at a band and leaving it = that band is the edge - tonight's 7:22 PM BTC short is the TOP third and passes; the true bottom / top thirds still refuse; read + door agree; her 3% margin and bottom rung unchanged" : "THIRDS SESSION BAND 1050 TEST: FAIL");
process.exit(ok ? 0 : 1);
