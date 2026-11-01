// fix579 behaviour test (Love Nov 1 2026: "The $5 BTC break is the entry. The weekend $25 is a pink distance tolerance. It is not
// allowed to block a $5 break. She enters the moment price passes $5 past the pink on a valid flip. Not at $25. Not after half the
// move. ... The $25 tolerance stays for other uses. The entry is the $5 break."). Lifts reachWall429 out of the code she is running and
// proves that an UNBROKEN pink stops a trade only until price clears it by HER pink break (BTC $5 / gold 25c, from PINK_BREAK432) -
// NOT the $6 band break - while the $25 tolerance still holds a pink that is NOT yet broken (price only $4 through). Both sides. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(head) {
  const i = src.indexOf(head);
  if (i < 0) { console.log("5-BREAK TEST: FAIL - missing from bandlock.ts: " + head); process.exit(1); }
  let j;
  if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i));
  let depth = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === "{") depth++; else if (src[k] === "}") { depth--; if (depth === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } }
}
const parts = [
  "type Line = { name: string; price: number; unit?: number };",
  "type Zones = { pp: number; r1: number; r2: number; s1: number; s2: number };",
  src.slice(src.indexOf("const isSessBand = "), src.indexOf("\n", src.indexOf("const isSessBand = "))),
  grab("export const BREAK_DIST"), grab("export const ZONE_REACH_PCT"), grab("export const REACH429"), grab("export function sessionScale593"), grab("export const PINK_BREAK432"),
  src.slice(src.indexOf("export const PINK_PCT429"), src.indexOf("\n", src.indexOf("export const PINK_PCT429"))),
  ...(src.includes("export const PINK_PCT459") ? [src.slice(src.indexOf("export const PINK_PCT459"), src.indexOf(";", src.indexOf("export const PINK_PCT459")) + 1)] : []),
  "const __PINKFLAT25 = true;", // her weekend $25 pink overlay on (fix571): the tolerance that must NOT block the $5 break
  grab("export function zoneReachSlide("), grab("export function reachWall429("),
  "function fiveOpenNow(a) { return 0; } function zonesNow(a) { return null; }",
].map((x) => x.replace(/^export /, ""));
const js = ts.transpileModule(parts.join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const W = new Function(js + "; return reachWall429;")();

let ok = true;
const fail = (m) => { ok = false; console.log("5-BREAK TEST: FAIL - " + m); };

// --- BTC LONG up through the pink (her $5 break). Bands $1000 away so ONLY the pink is in reach. ---
const Lb = [{ name: "-1σ", price: 99000 }, { name: "+1σ", price: 101000 }, { name: "5m PP", price: 100000 }];
const Zb = { pp: 100000, r1: 103000, r2: 104000, s1: 97000, s2: 96000};
const bo = 99994; // this 5m candle opened BELOW the pink = came up through it (a real break, not a bounce off it)
if (!W("btc", Lb, 100004, "up", Zb, bo)) fail("BTC long only $4 past the pink was let through - her $25 tolerance must still hold an unbroken pink");
if ( W("btc", Lb, 100005, "up", Zb, bo)) fail("BTC long $5 past the pink (HER BREAK) was BLOCKED - the $25 tolerance is still stopping her $5 entry");
if ( W("btc", Lb, 100006, "up", Zb, bo)) fail("BTC long $6 past the pink was blocked");

// --- BTC SHORT down through the pink (mirror - every tolerance is two-sided) ---
const bod = 100006; // opened ABOVE the pink = came down through it
if (!W("btc", Lb, 99996, "down", Zb, bod)) fail("BTC short only $4 under the pink was let through - the unbroken-pink tolerance must hold the short side too");
if ( W("btc", Lb, 99995, "down", Zb, bod)) fail("BTC short $5 under the pink (HER BREAK) was BLOCKED on the short side");
if ( W("btc", Lb, 99994, "down", Zb, bod)) fail("BTC short $6 under the pink was blocked");

// --- GOLD mirror: her pink break is 25c (PINK_BREAK432.gold), not the 33c band break ---
const Lg = [{ name: "-1σ", price: 3990 }, { name: "+1σ", price: 4010 }, { name: "5m PP", price: 4000 }];
const Zg = { pp: 4000, r1: 4030, r2: 4040, s1: 3970, s2: 3960 };
if (!W("gold", Lg, 4000.20, "up", Zg, 3999.70)) fail("gold long only 20c past the pink was let through - under her 25c pink break the $1 tolerance must still hold");
if ( W("gold", Lg, 4000.25, "up", Zg, 3999.70)) fail("gold long 25c past the pink (HER BREAK) was BLOCKED");

console.log(ok
  ? "5-BREAK TEST ✓ - an unbroken pink holds a trade only until price clears it by HER pink break (BTC $5 / gold 25c), not the $6/33c band break; the $25/$1 tolerance still holds a pink that is only partway broken (BTC $4 / gold 20c); both sides (fix579)."
  : "5-BREAK TEST: FAIL");
process.exit(ok ? 0 : 1);
