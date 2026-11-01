// fix464 behaviour test (R196-R201, Love Oct 29 2026 1:05-1:09 PM PT: "she shorted gold above 33% and above pink" / "there is zero instance where she is within 15% of an unbroken pink that she
// shorts" / "i told you 100 times it's for both sides. do what i say." / "dude she was in the bottom 33% of the channel that is not an excuse"): runs her LIVE walls + read + copier hold,
// both sides, and replays the 1:02:06 PM gold rejection short (4022.77; pink 4019.85 below; -1σ 4018.08 -> VWAP 4031.35; 5m open 4022.788, low 4021.23, high 4024.58) - it MUST be refused.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const D = (f) => fs.readFileSync(process.argv[2] && f === "bandlock.ts" ? process.argv[2] : process.argv[3] && f === "engine.ts" ? process.argv[3] : process.argv[4] && f === "recon.ts" ? process.argv[4] : path.join(root, "src/lib/desk", f), "utf8");
const BL = D("bandlock.ts"), EN = D("engine.ts"), RC = D("recon.ts");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("PINK BOTH SIDES TEST: FAIL - " + m); } };
function grab(src, head) { const i = src.indexOf(head); if (i < 0) { console.log("PINK BOTH SIDES TEST: FAIL - missing " + head); process.exit(1); }
  let j; if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>|" {};:,\[\]]+?\s*\{\n/.exec(src.slice(i)); j = i + m.index + m[0].length - 2; } else j = src.indexOf("{", src.indexOf("=", i));
  let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } }
const one = (src, h) => src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h)));
const tp = (parts, ret) => new Function(ts.transpileModule(parts.map((x) => x.replace(/^export /, "")).join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return " + ret + ";")();
const W = tp(["type Line = { name: string; price: number; unit?: number };", one(BL, "export const PINK_PCT429"), grab(BL, "export const PINK_PCT459"), one(BL, "export const PINK_BREAK432"), grab(BL, "export const PINK_TAP"),
  "const isChanBand = (a, l) => /σ$|^session VWAP$|^fresh VWAP$/.test(String(l.name)); function chanL(a, L) { return L; } function squeezedPinkOf(L) { return () => false; }",
  grab(BL, "export function pinkBeyond459("), grab(BL, "export function pinkLongWall432("), grab(BL, "export function pinkShortWall464(")], "{ pinkLongWall432, pinkShortWall464 }");
const H = tp([grab(EN, "export function slideHold403("), grab(EN, "export function climbHold464(")], "{ slideHold403, climbHold464 }");
const P = tp([grab(RC, "export function pinkRead464(")], "pinkRead464");
const G = [{ name: "-1σ", price: 4018.08 }, { name: "session VWAP", price: 4031.35 }];
const Gp = (pk) => [...G, { name: "5m PP", price: pk }];
// 1:02:06 PM gold short (KEEP20: no 33% launch change - the upslope pink must stop it alone)
const ps = W.pinkShortWall464("gold", Gp(4019.85), 4022.77, "down"); console.log("  1:02:06 pink $2.92 below = 22% of the $13.27 channel (her 15% = $1.99): " + (ps || "outside 15% - this wall lets it go (true to her 15%)"));
// fix494 (Love Oct 29 2026 10:03 PM PT: "It's sliding when three candles or more have hit it and rejected on a down slope." - mirrored for a climb):
const mk494 = (cands) => { const sm = []; let t0 = 1e12; for (const [touch, endP, pp] of cands) { sm.push({ t: t0, p: touch ? pp : endP, pp }); sm.push({ t: t0 + 150000, p: endP, pp }); t0 += 300000; } return sm; };
// three candles hit a rising pink from above and rejected = no short
const cl3 = mk494([[true, 4022.4, 4019.0], [true, 4023.1, 4019.8], [true, 4023.8, 4020.5], [false, 4024.2, 4021.0]]);
const ch = H.climbHold464(cl3, { on: false }, 1e12 + 3 * 300000 + 160000, "gold"); console.log("  3 rejections up a climbing pink: " + (ch || "free"));
t(/CLIMB OVER PINK/.test(ch), "3 candles hit the climbing pink from above and rejected - the short was NOT held");
t(!H.climbHold464(mk494([[true, 4022.4, 4019.0], [true, 4023.1, 4019.8], [false, 4023.8, 4020.5]]), { on: false }, 1e12 + 2 * 300000 + 160000, "gold"), "2 rejections held the short - her rule is three or more");
t(!H.climbHold464(cl3.concat([{ t: 1e12 + 4 * 300000, p: 4020.7, pp: 4021.0 }]), { on: true }, 1e12 + 4 * 300000 + 1000, "gold"), "a break DOWN through the pink did not free the short");
// price merely above/below a moving pink with NO rejections = free, both sides (her words: candles must hit it)
const noTouch = mk494([[false, 4024.0, 4019.0], [false, 4025.0, 4019.8], [false, 4026.0, 4020.5], [false, 4026.5, 4021.0]]);
t(!H.climbHold464(noTouch, { on: false }, 1e12 + 3 * 300000 + 160000, "gold"), "price over a climbing pink with NO rejections was held - the invented drift trigger is back");
t(!H.slideHold403(noTouch, { on: false }, 1e12 + 3 * 300000 + 160000), "the long side held a climb");
// BTC mirror, her sizes
t(!!H.climbHold464(mk494([[true, 80310, 80200], [true, 80390, 80280], [true, 80470, 80360], [false, 80520, 80430]]), { on: false }, 1e12 + 3 * 300000 + 160000, "btc"), "BTC: 3 rejections up a climbing pink did not hold the short");
// the long side: 3 rejections down a sliding pink = no long; and the climb side stays free there
const sl3 = mk494([[true, 4016.2, 4019.0], [true, 4015.4, 4018.2], [true, 4014.6, 4017.3], [false, 4014.0, 4016.8]]);
t(!!H.slideHold403(sl3, { on: false }, 1e12 + 3 * 300000 + 160000) && !H.climbHold464(sl3, { on: false }, 1e12 + 3 * 300000 + 160000, "gold"), "downslope: the long hold or the short freedom changed");
// never trade into an unbroken pink, both sides, gold 15% / BTC 20%
t(!!W.pinkShortWall464("gold", Gp(4021.6), 4022.77, "down"), "gold short with the pink $1.17 below (inside 15%) was NOT refused");
t(!W.pinkShortWall464("gold", Gp(4019.85), 4022.77, "down"), "gold short with the pink 22% below was refused (her rule is 15%)");
t(!W.pinkShortWall464("gold", Gp(4023.1), 4022.77, "down"), "gold short 33c under the pink (broken down by her 25c) was refused");
t(!!W.pinkShortWall464("gold", Gp(4022.9), 4022.77, "down"), "gold short only 13c under the pink (under her 25c break) was NOT refused");
t(!!W.pinkLongWall432("gold", Gp(4023.9), 4022.77, "up"), "gold LONG with the pink $1.13 above (inside 15%) was NOT refused (long side)");
const B = [{ name: "-1σ", price: 80000 }, { name: "session VWAP", price: 80500 }];
t(!!W.pinkShortWall464("btc", [...B, { name: "5m PP", price: 80280 }], 80300, "down") && !W.pinkShortWall464("btc", [...B, { name: "5m PP", price: 80190 }], 80300, "down"), "BTC short: pink $20 (inside her temporary $25 cap, fix542/545) below must refuse, 22% must go");
t(!W.pinkShortWall464("gold", Gp(4021.6), 4022.77, "up") && !W.pinkLongWall432("gold", Gp(4023.9), 4022.77, "down"), "a wall judged the wrong side");
// the pink in the read, both sides
t(P("gold", G, 4022.77, "down", 4021.6) && !P("gold", G, 4022.77, "down", 4019.85), "the read: gold short with pink inside 15% must not be her call; at 22% it may");
t(P("gold", G, 4022.77, "up", 4023.9) && !P("gold", G, 4022.77, "up", 4026.0), "the read: gold long with pink inside 15% above must not be her call; at 24% it may");
console.log(ok ? "PINK BOTH SIDES TEST ✓ - three or more pink rejections on a slope hold the other side (her 10:03 PM rule, both ways, 25c / $8 break frees); never trade into an unbroken pink both sides (gold 15% / BTC 20%); pink in the read both sides." : "PINK BOTH SIDES TEST: FAIL");
process.exit(ok ? 0 : 1);
