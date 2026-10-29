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
  grab(BL, "export function pinkBeyond459("), grab(BL, "export function pinkLongWall432("), grab(BL, "export function pinkShortWall464("), grab(BL, "export function thirdsMove464(")], "{ pinkLongWall432, pinkShortWall464, thirdsMove464 }");
const H = tp([grab(EN, "export function slideHold403("), grab(EN, "export function climbHold464(")], "{ slideHold403, climbHold464 }");
const P = tp([grab(RC, "export function pinkRead464(")], "pinkRead464");
const G = [{ name: "-1σ", price: 4018.08 }, { name: "session VWAP", price: 4031.35 }];
const Gp = (pk) => [...G, { name: "5m PP", price: pk }];
// 1:02:06 PM gold short
const tm = W.thirdsMove464("gold", Gp(4019.85), 4022.77, 4022.788, { h: 4024.58, l: 4021.23 });
console.log("  1:02:06 PM gold SHORT at 4022.77 - her 33% launch: " + (tm === "up" ? "REFUSED (the candle launched from the bottom 33% - a long, never a short)" : "free"));
t(tm === "up", "1:02:06 PM gold short: the launch from the bottom 33% did not refuse it");
const ps = W.pinkShortWall464("gold", Gp(4019.85), 4022.77, "down"); console.log("  1:02:06 pink $2.92 below = 22% of the $13.27 channel (her 15% = $1.99): " + (ps || "outside 15% - this wall lets it go (true to her 15%)"));
// upslope pink, rebuilt from the real 1m closes 12:32-1:02 PM and her pink values
const pts = [[0, 4016.28, 4013.9], [180, 4017.6, 4014.6], [360, 4019.93, 4015.3], [540, 4018.19, 4015.9], [780, 4019.27, 4016.37], [960, 4019.83, 4017.0], [1140, 4019.54, 4017.53], [1320, 4021.61, 4018.51], [1500, 4022.43, 4019.3], [1740, 4022.77, 4019.85]];
const sm = []; for (let i = 0; i < pts.length - 1; i++) for (let s = pts[i][0]; s < pts[i + 1][0]; s += 15) { const f = (s - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); sm.push({ t: s * 1000, p: pts[i][1] + f * (pts[i + 1][1] - pts[i][1]), pp: pts[i][2] + f * (pts[i + 1][2] - pts[i][2]) }); }
sm.push({ t: 1740000, p: 4022.77, pp: 4019.85 });
const ch = H.climbHold464(sm, { on: false }, 1740000 + 1000, "gold"); console.log("  1:02:06 upslope pink: " + (ch || "free"));
t(/CLIMB OVER PINK/.test(ch), "1:02:06 PM gold short: the upslope pink (price $6.49 higher than 30 min ago over the unbroken pink) did not hold it");
t(!H.climbHold464([...sm, { t: 1745000, p: 4019.5, pp: 4019.85 }], { on: true }, 1746000, "gold"), "a 35c break DOWN through the pink did not free the short");
t(!!H.climbHold464(sm.map((x) => ({ ...x, p: x.p * 0 + 81000 + (x.t / 1740000) * 120, pp: 80900 })), { on: false }, 1741000, "btc"), "BTC: price $120 higher over an unbroken pink did not hold the short");
t(H.climbHold464(sm, { on: false }, 1741000, "gold") && !H.slideHold403(sm, { on: false }, 1741000), "the long side (downslope pink) must not hold a climb");
// mirror of the downslope: price sliding under pink holds the long, not the short
const sl = sm.map((x) => ({ t: x.t, p: 8040 - x.p + 0, pp: 8040 - x.pp }));
t(!!H.slideHold403(sl, { on: false }, 1741000) && !H.climbHold464(sl, { on: false }, 1741000, "gold"), "downslope: the long hold or the short freedom changed");
// never trade into an unbroken pink, both sides, gold 15% / BTC 20%
t(!!W.pinkShortWall464("gold", Gp(4021.6), 4022.77, "down"), "gold short with the pink $1.17 below (inside 15%) was NOT refused");
t(!W.pinkShortWall464("gold", Gp(4019.85), 4022.77, "down"), "gold short with the pink 22% below was refused (her rule is 15%)");
t(!W.pinkShortWall464("gold", Gp(4023.1), 4022.77, "down"), "gold short 33c under the pink (broken down by her 25c) was refused");
t(!!W.pinkShortWall464("gold", Gp(4022.9), 4022.77, "down"), "gold short only 13c under the pink (under her 25c break) was NOT refused");
t(!!W.pinkLongWall432("gold", Gp(4023.9), 4022.77, "up"), "gold LONG with the pink $1.13 above (inside 15%) was NOT refused (long side)");
const B = [{ name: "-1σ", price: 80000 }, { name: "session VWAP", price: 80500 }];
t(!!W.pinkShortWall464("btc", [...B, { name: "5m PP", price: 80205 }], 80300, "down") && !W.pinkShortWall464("btc", [...B, { name: "5m PP", price: 80190 }], 80300, "down"), "BTC short: pink 19% below must refuse, 22% must go");
t(!W.pinkShortWall464("gold", Gp(4021.6), 4022.77, "up") && !W.pinkLongWall432("gold", Gp(4023.9), 4022.77, "down"), "a wall judged the wrong side");
// her 33% launch, both sides
t(W.thirdsMove464("gold", Gp(4019.85), 4022.77, 4022.788, { h: 4024.58, l: 4021.23 }) !== "down", "launch from the bottom 33% read as a short");
t(W.thirdsMove464("gold", Gp(4019.85), 4027.0, 4027.2, { h: 4030.6, l: 4026.6 }) === "down", "mirror: a candle falling from the top 33% must be a short, never a long");
// the pink in the read, both sides
t(P("gold", G, 4022.77, "down", 4021.6) && !P("gold", G, 4022.77, "down", 4019.85), "the read: gold short with pink inside 15% must not be her call; at 22% it may");
t(P("gold", G, 4022.77, "up", 4023.9) && !P("gold", G, 4022.77, "up", 4026.0), "the read: gold long with pink inside 15% above must not be her call; at 24% it may");
// 1:15:15 PM gold rejection SHORT at 4027.14 ("Rejected down off Red zone"), pink ~4024.5 below, gold up ~$7.9 since 12:45 - the upslope pink must hold it
const p2 = [[0, 4019.27, 4016.37], [360, 4019.54, 4017.53], [720, 4022.43, 4018.51], [960, 4023.64, 4019.67], [1140, 4025.45, 4021.2], [1320, 4026.74, 4022.4], [1500, 4029.84, 4023.5], [1680, 4028.01, 4024.2], [1800, 4027.14, 4024.5]];
const sm2 = []; for (let i = 0; i < p2.length - 1; i++) for (let s = p2[i][0]; s < p2[i + 1][0]; s += 15) { const f = (s - p2[i][0]) / (p2[i + 1][0] - p2[i][0]); sm2.push({ t: s * 1000, p: p2[i][1] + f * (p2[i + 1][1] - p2[i][1]), pp: p2[i][2] + f * (p2[i + 1][2] - p2[i][2]) }); }
sm2.push({ t: 1800000, p: 4027.14, pp: 4024.5 });
const ch2 = H.climbHold464(sm2, { on: false }, 1801000, "gold"); console.log("  1:15:15 PM gold SHORT at 4027.14: " + (ch2 || "free"));
t(/CLIMB OVER PINK/.test(ch2), "1:15:15 PM gold short: the upslope pink did not hold it");
console.log(ok ? "PINK BOTH SIDES TEST ✓ - 1:02:06 + 1:15:15 PM gold shorts refused (her 33% launch + the upslope pink); never trade into an unbroken pink both sides (gold 15% / BTC 20%, 25c / $8 break); pink in the read both sides; long side unchanged." : "PINK BOTH SIDES TEST: FAIL");
process.exit(ok ? 0 : 1);
