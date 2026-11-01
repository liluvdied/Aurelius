// fix459 behaviour test (R176, Love Oct 29 2026 11:12-11:18 AM PT: "she is only not allowed to long into pink at 15% of the channel width, band to band. / not all distances, period."
// + "15% just for gold rn hun. 20% for btc" + "both books pls"): main + rejection - the unbroken pink holds a long only within 15% (gold) / 20% (BTC) of the session-band channel,
// through "never long under an unbroken pink" (fix432) and the pink reach (fix429/430, over its $1/$50 floor). Today's 11:05/11:06 AM PT gold replayed. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(head) { const i = src.indexOf(head); if (i < 0) { console.log("PINK 15/20 TEST: FAIL - missing " + head); process.exit(1); }
  let j; if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i));
  let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } }
const one = (h) => src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h)));
const js = ts.transpileModule(["type Line = { name: string; price: number; unit?: number };", "type Zones = { pp: number; r1: number; r2: number; s1: number; s2: number };",
  one("const isSessBand = "), grab("export const BREAK_DIST"), grab("export const ZONE_REACH_PCT"), grab("export const REACH429"), grab("export function sessionScale593"), one("export const PINK_PCT429"), grab("export const PINK_PCT459"), one("export const PINK_BREAK432"),
  grab("export function zoneReachSlide("), grab("export function reachWall429("), grab("export function pinkBeyond459("), grab("export function pinkLongWall432("),
  "function fiveOpenNow(a) { return 0; } function zonesNow(a) { return null; }"].map((x) => x.replace(/^export /, "")).join("\n"), { compilerOptions: { target: 99 } }).outputText;
const W = new Function(js + "; return { reachWall429, pinkLongWall432 };")();
const far = { pp: 1, r1: 999999, r2: 9999999, s1: 0.5, s2: 0.1 };
const both = (a, L, t) => W.pinkLongWall432(a, L, t, "up") || W.reachWall429(a, L, t, "up", far, t - 0.01);
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("PINK 15/20 TEST: FAIL - " + m); } };
const G = (pk) => [{ name: "-2σ", price: 4007.89 }, { name: "-1σ", price: 4020.41 }, { name: "5m PP", price: pk }];
const r1 = both("gold", G(4011.66), 4009.11); console.log("  gold 11:05 (pink $2.55 above, 15% = $1.88): " + (r1 || "free of the pink walls (the downslope pink rule, unchanged, still held her)"));
t(!r1, "gold: pink $2.55 above (outside 15% of $12.52) still refused by the pink walls");
const r2 = both("gold", G(4011.08), 4009.47); console.log("  gold 11:06 (pink $1.61 above, inside 15%): " + (r2 || "free")); t(r2, "gold: pink $1.61 above (inside 15%) was NOT refused");
const B = (pk) => [{ name: "-1σ", price: 80000 }, { name: "session VWAP", price: 80500 }, { name: "5m PP", price: pk }];
const b19 = both("btc", B(80300), 80280); console.log("  BTC pink $20 above (inside her temporary $25 cap, fix542/545): " + (b19 || "free")); t(b19, "BTC: pink $20 above (inside her $25 cap) was NOT refused");
const b22 = both("btc", B(80300), 80190); console.log("  BTC pink $110 above = 22% of $500: " + (b22 || "free")); t(!b22, "BTC: pink at 22% of the channel was refused");
t(both("gold", G(4011.0), 4011.1), "gold: 10c over the pink (under her 25c break) was NOT refused");
t(W.pinkLongWall432("gold", [{ name: "5m PP", price: 4015 }], 4009, "up"), "no session bands readable: the hold must stay (never blind)");
t(both("gold", [{ name: "-2σ", price: 4007.89 }, { name: "-1σ", price: 4011.9 }, { name: "5m PP", price: 4009.9 }], 4009.0), "gold narrow channel ($4.01): pink 90c above inside the $1 floor was NOT refused");
console.log(ok ? "PINK 15/20 TEST ✓ - the unbroken pink holds a long only within 15% gold / 20% BTC of the session-band channel (11:06 gold refused, 11:05 free of it; BTC 19% refused, 22% free); 25c/$8 break, $1/$50 floor and no-bands-no-trade kept." : "PINK 15/20 TEST: FAIL");
process.exit(ok ? 0 : 1);
