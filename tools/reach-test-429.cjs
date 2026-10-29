// fix429 behaviour test (Love Oct 28 2026 8:06 PM PT: "yes to all of them bb , why did alllll of this get removed without my permission?"): replays the 7:40:54 PM PT
// gold long (main, 18c over an unbroken -1σ 4043.85 that price came up through this candle, pink 4047.32 above) through reachWall429 in bandlock.ts - it MUST be refused.
// A clean long (well past -1σ, nothing inside $1.50 in front) and a bounce long off a band from above must still pass. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(head) {
  const i = src.indexOf(head);
  if (i < 0) { console.log("REACH TEST: FAIL - missing from bandlock.ts: " + head); process.exit(1); }
  let j;
  if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i));
  let depth = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === "{") depth++; else if (src[k] === "}") { depth--; if (depth === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } }
}
const parts = [
  "type Line = { name: string; price: number; unit?: number };",
  "type Zones = { pp: number; r1: number; r2: number; s1: number; s2: number };",
  src.slice(src.indexOf("const isSessBand = "), src.indexOf("\n", src.indexOf("const isSessBand = "))),
  grab("export const BREAK_DIST"), grab("export const ZONE_REACH_PCT"), grab("export const REACH429"),
  src.slice(src.indexOf("export const PINK_PCT429"), src.indexOf("\n", src.indexOf("export const PINK_PCT429"))),
  grab("export function zoneReachSlide("), grab("export function reachWall429("),
  "function fiveOpenNow(a) { return 0; } function zonesNow(a) { return null; }",
].map((x) => x.replace(/^export /, ""));
const js = ts.transpileModule(parts.join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const W = new Function(js + "; return reachWall429;")();
// 7:40:54 PM PT gold board (live-fires sessionNow + bands), 5m candle open 4042.27, zones far away (no zone in play)
const L = [{ name: "-1.5σ", price: 4039.80 }, { name: "-1σ", price: 4043.85 }, { name: "-0.5σ", price: 4047.90 }, { name: "session VWAP", price: 4051.96 }, { name: "5m PP", price: 4047.32 }];
const Zfar = { pp: 4060, r1: 4070, r2: 4080, s1: 4020, s2: 4010 };
let ok = true;
const a = W("gold", L, 4044.03, "up", Zfar, 4042.27);
if (!a) { ok = false; console.log("REACH TEST: FAIL - the 7:40:54 PM gold long at the wire (4044.03, 18c over the unbroken -1σ) was NOT refused"); }
const b = W("gold", L, 4043.63, "up", Zfar, 4042.27);
if (!b) { ok = false; console.log("REACH TEST: FAIL - the 7:40 gold long at 4043.63 (-1σ 21c above) was NOT refused"); }
const c = W("gold", L, 4045.40, "up", Zfar, 4042.27);
if (c) { ok = false; console.log("REACH TEST: FAIL - a clean long $1.55 past -1σ with pink $1.92 ahead was refused: " + c); }
const d = W("gold", L, 4044.03, "up", Zfar, 4045.00);
if (d) { ok = false; console.log("REACH TEST: FAIL - a bounce long off -1σ from above (candle opened over it) was refused: " + d); }
const e = W("gold", L, 4046.00, "up", Zfar, 4045.00);
if (!e) { ok = false; console.log("REACH TEST: FAIL - a long with the pink $1.32 above (inside $1.50) was NOT refused"); }
const f = W("gold", L, 4044.80, "up", { pp: 4040, r1: 4046.0, r2: 4049, s1: 4036, s2: 4033 }, 4045.00);
if (!f) { ok = false; console.log("REACH TEST: FAIL - a long with the red zone $1.20 above (inside her $1.50 zone reach) was NOT refused"); }
const g = W("gold", L, 4044.80, "up", null, 4045.00);
if (!g) { ok = false; console.log("REACH TEST: FAIL - unreadable zones did not refuse (never blind)"); }
// fix430 (Love 8:07 PM PT: "make the pink tolerance a minimum of 15% of the channel width please"): channel -1σ 4040 -> -0.5σ 4060 ($20, 15% = $3.00), pink 4050
const L2 = [{ name: "-1σ", price: 4040 }, { name: "-0.5σ", price: 4060 }, { name: "5m PP", price: 4050 }];
const p14 = W("gold", L2, 4047.20, "up", Zfar, 4046.00); // pink $2.80 above = 14% of the channel, past the fixed $1.50
if (!p14) { ok = false; console.log("REACH TEST: FAIL - a long with the unbroken pink 14% of the channel above ($2.80) was NOT refused (15% minimum)"); }
const p16 = W("gold", L2, 4046.80, "up", Zfar, 4046.00); // pink $3.20 above = 16%
if (p16) { ok = false; console.log("REACH TEST: FAIL - a long with the pink 16% of the channel above ($3.20) was refused: " + p16); }
console.log(ok ? "REACH TEST ✓ - the 7:40 PM gold long into the unbroken -1σ is refused (a 18c poke is not a break); clean and bounce longs pass; pink (15% of the channel minimum), session and $1.50 zone walls hold." : "REACH TEST: FAIL");
process.exit(ok ? 0 : 1);
