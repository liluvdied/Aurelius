// fix584 PINK SLIDE HER WAY (Love Nov 1 2026: "The pink slide rule only applies in this case: Price has rejected the pink three times on the way down. And pink is in the
// bottom/top 33% of the channel. Only then are longs/shorts blocked ... In every other case the slide rule does nothing." + "i did not ask for pink slide off. i asked for it to be revised."):
// proves (1) 3 rejections + pink in the bottom 33% HOLDS longs (gold + BTC), (2) 3 rejections with the pink mid-channel does NOT, (3) the blanket "under a falling pink, no touches" does NOT,
// (4) the climb mirror: 3 rejections up + pink in the top 33% HOLDS shorts, mid-channel does not, (5) the fix521 blanket walls UNDER/OVER THE PINK stand down. Switch false = the old slide (control).
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const E = fs.readFileSync(path.join(root, "src/lib/desk/engine.ts"), "utf8"), B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("SLIDE HER WAY 584 TEST: FAIL - " + m); } };
t(/export const __PINKSLIDE_HERWAY584 = true;/.test(E) && /export const __PINKSLIDE_HERWAY584 = true;/.test(B), "the fix584 switch is not set in engine.ts + bandlock.ts");
function grab(src, head, ret) { const i = src.indexOf(head); if (i < 0) return null; const m = (ret || /\)\s*:\s*string\s*\{/).exec(src.slice(i)); let j = i + m.index + m[0].length - 1, d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1).replace(/^export /, ""); } } return null; }
const helper = grab(E, "export function pinkThird584(", /\)\s*:\s*boolean\s*\{/);
const eparts = ["export function slideHold403(", "export function slideHoldBtc423(", "export function climbHold464("].map((h) => grab(E, h));
if (!helper || eparts.some((p) => !p)) { console.log("SLIDE HER WAY 584 TEST: FAIL - pinkThird584 or a slide function is missing from engine.ts"); process.exit(1); }
const buildE = (f) => new Function(ts.transpileModule("const __PINKSLIDE_HERWAY584 = " + f + ";\n" + helper + "\n" + eparts.join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return { slideHold403, slideHoldBtc423, climbHold464 };")();
const NEW = buildE("true"), OLD = buildE("false");
const mk = (cands) => { const sm = []; let tt = 1e12; for (const [touch, endP, pp] of cands) { sm.push({ t: tt, p: touch ? pp : endP, pp }); sm.push({ t: tt + 150000, p: endP, pp }); tt += 300000; } return sm; };
const now = 1e12 + 3 * 300000 + 160000;
const g = mk([[true, 4019.0, 4021.0], [true, 4018.5, 4020.6], [true, 4018.0, 4020.2], [false, 4017.5, 4020.0]]);
const b = mk([[true, 79880, 79950], [true, 79820, 79900], [true, 79760, 79845], [false, 79700, 79800]]);
const c = mk([[true, 4021.0, 4019.0], [true, 4021.5, 4019.4], [true, 4022.0, 4019.8], [false, 4022.5, 4020.0]]);
const blanket = [{ t: now - 200000, p: 4019.0, pp: 4020.5 }, { t: now - 10000, p: 4017.0, pp: 4020.0 }];
const set = (gold, btc) => { globalThis.__lawBands = { gold: { L: gold }, btc: { L: btc } }; };
const S = () => ({ on: false });
// pink in the BOTTOM 33% (gold pink 4020 in 4015-4045; btc pink 79800 in 79750-80250)
set([{ name: "+1σ", price: 4045 }, { name: "session VWAP", price: 4015 }], [{ name: "+1σ", price: 80250 }, { name: "session VWAP", price: 79750 }]);
t(!!NEW.slideHold403(g, S(), now), "gold: 3 rejections + pink in the bottom 33% did NOT hold the long");
t(!!NEW.slideHoldBtc423(b, S(), now), "BTC: 3 rejections + pink in the bottom 33% did NOT hold the long");
const sb = S(); t(NEW.slideHold403(blanket, sb, now) === "" && !sb.on, "gold: the blanket (under a falling pink, no rejections) still holds a long");
t(!!OLD.slideHold403(blanket, S(), now), "control: switch false - the old blanket no longer holds (test board broken)");
// pink MID-channel (gold pink 4020 in 4005-4035; btc 79800 in 79500-80100)
set([{ name: "+1σ", price: 4035 }, { name: "session VWAP", price: 4005 }], [{ name: "+1σ", price: 80100 }, { name: "session VWAP", price: 79500 }]);
const s1 = { on: true }, s2 = { on: true };
t(NEW.slideHold403(g, s1, now) === "" && !s1.on, "gold: 3 rejections with the pink mid-channel still held (needs the bottom 33%)");
t(NEW.slideHoldBtc423(b, s2, now) === "" && !s2.on, "BTC: 3 rejections with the pink mid-channel still held (needs the bottom 33%)");
t(!!OLD.slideHold403(g, S(), now), "control: switch false - the old slide no longer holds mid-channel (test board broken)");
// climb mirror: pink in the TOP 33% (gold pink 4020 in 3995-4022) holds shorts; mid-channel does not
set([{ name: "+1σ", price: 4026 }, { name: "session VWAP", price: 3995 }], [{ name: "+1σ", price: 80250 }, { name: "session VWAP", price: 79750 }]);
t(!!NEW.climbHold464(c, S(), now, "gold"), "gold climb: 3 rejections up + pink in the top 33% did NOT hold the short");
set([{ name: "+1σ", price: 4035 }, { name: "session VWAP", price: 4005 }], [{ name: "+1σ", price: 80250 }, { name: "session VWAP", price: 79750 }]);
const s3 = { on: true }; t(NEW.climbHold464(c, s3, now, "gold") === "" && !s3.on, "gold climb: pink mid-channel still held the short (needs the top 33%)");
// no channel readable = the slide does nothing
set([], []); t(NEW.slideHold403(g, S(), now) === "", "no readable channel still held (her rule: every other case the slide does nothing)");
// bandlock fix521 blanket walls stand down
const bparts = [grab(B, "export function pinkLongWall432("), grab(B, "export function pinkShortWall464(")];
if (bparts.some((p) => !p)) { console.log("SLIDE HER WAY 584 TEST: FAIL - a pink wall is missing from bandlock.ts"); process.exit(1); }
const stubs = "type Line = { name: string; price: number; unit?: number };\nconst PINK_BREAK432 = { btc: 5, gold: 0.25 }; const __PINKFLAT25 = false; function pinkSlide580(a, W) { return 1e9; } function anyRed521() { return true; } function anyGreen521() { return true; } function turnFlip530() { return false; } function pinkSpent515c() { return false; } function pinkBeyond459() { return true; }\n";
const buildB = (f) => new Function(ts.transpileModule(stubs + "const __PINKSLIDE_HERWAY584 = " + f + ";\n" + bparts.join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return { pinkLongWall432, pinkShortWall464 };")();
const BN = buildB("true"), BO = buildB("false");
const L = [{ name: "5m PP", price: 78000 }, { name: "5m S1", price: 77000 }, { name: "5m R1", price: 79000 }, { name: "+1σ", price: 78500 }, { name: "-1σ", price: 77500 }];
t(/UNDER THE PINK = NO LONGS/.test(BO.pinkLongWall432("btc", L, 77900, "up")), "control: switch false did not show UNDER THE PINK (board broken)");
t(!/UNDER THE PINK = NO LONGS/.test(BN.pinkLongWall432("btc", L, 77900, "up")), "the blanket UNDER THE PINK = NO LONGS still holds");
t(!/OVER THE PINK = NO SHORTS/.test(BN.pinkShortWall464("btc", L, 78100, "down")), "the blanket OVER THE PINK = NO SHORTS still holds");
console.log(ok ? "SLIDE HER WAY 584 TEST ✓ - the pink slide holds only after 3 rejections with the pink in the bottom 33% (longs) / top 33% (shorts); every other case it does nothing; the blanket walls are gone." : "SLIDE HER WAY 584 TEST: FAIL");
process.exit(ok ? 0 : 1);
