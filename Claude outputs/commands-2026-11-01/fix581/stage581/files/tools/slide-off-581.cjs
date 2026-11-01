// fix581 PINK SLIDE OFF (Love Nov 1 2026: "Temporarily disable the pink slide rule until I rewrite it. Do not leave the current version in force. Do not change any other rule."):
// proves the switch is SET (true in engine.ts + bandlock.ts) and ENFORCED: with it on, the 3-rejection slide / climb holds (slideHold403, slideHoldBtc423, climbHold464) and the
// fix521 walls (UNDER THE PINK = NO LONGS / OVER THE PINK = NO SHORTS) never hold; with the switch forced false the same boards DO hold (so the switch is the only thing that changed).
// The unbroken-pink tolerance wall and her $5 break are still enforced. Run by requests.py check (R proof).
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const E = fs.readFileSync(path.join(root, "src/lib/desk/engine.ts"), "utf8"), B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("SLIDE OFF 581 TEST: FAIL - " + m); } };
t(/export const __PINKSLIDE_OFF581 = true;/.test(E), "engine.ts does not have `export const __PINKSLIDE_OFF581 = true;`");
t(/export const __PINKSLIDE_OFF581 = true;/.test(B), "bandlock.ts does not have `export const __PINKSLIDE_OFF581 = true;`");
const flagE = /export const __PINKSLIDE_OFF581 = true;/.test(E), flagB = /export const __PINKSLIDE_OFF581 = true;/.test(B);
function grab(src, head) { const i = src.indexOf(head); if (i < 0) return null; const m = /\)\s*:\s*string\s*\{/.exec(src.slice(i)); let j = i + m.index + m[0].length - 1, d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1).replace(/^export /, ""); } } return null; }
const eparts = ["export function slideHold403(", "export function slideHoldBtc423(", "export function climbHold464("].map((h) => grab(E, h));
if (eparts.some((p) => !p)) { console.log("SLIDE OFF 581 TEST: FAIL - a slide function is missing from engine.ts"); process.exit(1); }
const buildE = (f) => new Function(ts.transpileModule("const __PINKSLIDE_OFF581 = " + f + ";\n" + eparts.join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return { slideHold403, slideHoldBtc423, climbHold464 };")();
globalThis.__lawBands = { gold: { L: [{ name: "+1σ", price: 4030 }, { name: "session VWAP", price: 4010 }] }, btc: { L: [{ name: "+1σ", price: 80000 }, { name: "session VWAP", price: 79800 }] } };
const mk = (cands) => { const sm = []; let tt = 1e12; for (const [touch, endP, pp] of cands) { sm.push({ t: tt, p: touch ? pp : endP, pp }); sm.push({ t: tt + 150000, p: endP, pp }); tt += 300000; } return sm; };
const now = 1e12 + 3 * 300000 + 160000;
const g = mk([[true, 4019.0, 4021.0], [true, 4018.5, 4020.6], [true, 4018.0, 4020.2], [false, 4017.5, 4020.0]]);
const b = mk([[true, 79880, 79950], [true, 79820, 79900], [true, 79760, 79845], [false, 79700, 79800]]);
const c = mk([[true, 4021.0, 4019.0], [true, 4021.5, 4019.4], [true, 4022.0, 4019.8], [false, 4022.5, 4020.0]]);
const OFF = buildE(flagE), ON = buildE(false);
t(!!ON.slideHold403(g, { on: false }, now) && !!ON.slideHoldBtc423(b, { on: false }, now) && !!ON.climbHold464(c, { on: false }, now, "gold"), "control: with the switch forced false the old slide no longer holds these boards (test board broken)");
const S1 = { on: true }, S2 = { on: true }, S3 = { on: true };
t(OFF.slideHold403(g, S1, now) === "" && !S1.on, "gold slide (3 rejections under a falling pink) still holds a long");
t(OFF.slideHoldBtc423(b, S2, now) === "" && !S2.on, "BTC slide (3 rejections under a falling pink) still holds a long");
t(OFF.climbHold464(c, S3, now, "gold") === "" && !S3.on, "the climb mirror (3 rejections over a rising pink) still holds a short");
// bandlock fix521 walls
const bparts = [grab(B, "export function pinkLongWall432("), grab(B, "export function pinkShortWall464(")];
if (bparts.some((p) => !p)) { console.log("SLIDE OFF 581 TEST: FAIL - a pink wall is missing from bandlock.ts"); process.exit(1); }
const stubs = "type Line = { name: string; price: number; unit?: number };\nconst PINK_BREAK432 = { btc: 5, gold: 0.25 }; const __PINKFLAT25 = false; function pinkSlide580(a, W) { return 1e9; } function anyRed521() { return true; } function anyGreen521() { return true; } function turnFlip530() { return false; } function pinkSpent515c() { return false; } function pinkBeyond459() { return true; }\n";
const buildB = (f) => new Function(ts.transpileModule(stubs + "const __PINKSLIDE_OFF581 = " + f + ";\n" + bparts.join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return { pinkLongWall432, pinkShortWall464 };")();
const BOFF = buildB(flagB), BON = buildB(false);
const L = [{ name: "5m PP", price: 78000 }, { name: "5m S1", price: 77000 }, { name: "5m R1", price: 79000 }, { name: "+1σ", price: 78500 }, { name: "-1σ", price: 77500 }];
t(/UNDER THE PINK = NO LONGS/.test(BON.pinkLongWall432("btc", L, 77900, "up")), "control: switch false did not show UNDER THE PINK (test board broken)");
t(/OVER THE PINK = NO SHORTS/.test(BON.pinkShortWall464("btc", L, 78100, "down")), "control: switch false did not show OVER THE PINK (test board broken)");
const l1 = BOFF.pinkLongWall432("btc", L, 77900, "up"), s1 = BOFF.pinkShortWall464("btc", L, 78100, "down");
t(!/UNDER THE PINK = NO LONGS/.test(l1), "UNDER THE PINK = NO LONGS (fix521) still holds a long: " + l1);
t(!/OVER THE PINK = NO SHORTS/.test(s1), "OVER THE PINK = NO SHORTS (fix521) still holds a short: " + s1);
t(BOFF.pinkLongWall432("btc", L, 78005, "up") === "", "her $5 break above the pink no longer frees the long");
t(/NO SHORT OVER AN UNBROKEN PINK/.test(s1), "the unbroken-pink wall (fix464, not the slide) stopped working: " + s1);
console.log(ok ? "SLIDE OFF 581 TEST ✓ - the pink slide is OFF (gold + BTC, long slide + short climb, engine holds + fix521 walls) until Love rewrites it; switch false brings it back; the unbroken-pink wall and her $5 break still hold." : "SLIDE OFF 581 TEST: FAIL");
process.exit(ok ? 0 : 1);
