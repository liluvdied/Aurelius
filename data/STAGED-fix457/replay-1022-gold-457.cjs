// fix457 replay (Love Oct 29 2026 10:29 AM PT: "she just longed gold with a session band righttttt above her again. why did that get thru?????? it was ABSOLUTELY in the top 33% of the channel. this can't keep happening dude"):
// the 10:22:16 AM PT gold rejection long, at the board the door saw (data/band-lock.jsonl, gold-law.jsonl, rej-reads-gold.jsonl, live-book-done.json).
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "../..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(head) {
  const i = src.indexOf(head); if (i < 0) { console.log("REPLAY: missing " + head); process.exit(1); }
  let j; if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i));
  let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } }
}
const one = (h) => src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h)));
const parts = ["type Line = { name: string; price: number; unit?: number };", "type Zones = { pp: number; r1: number; r2: number; s1: number; s2: number };",
  one("const isSessBand = "), grab("export const BREAK_DIST"), grab("export const ZONE_REACH_PCT"), grab("export const REACH429"), one("export const PINK_PCT429"), grab("export const PINK_BREAK432"),
  grab("export function zoneReachSlide("), grab("export function reachWall429("), grab("export function pinkLongWall432("), grab("export function sameSide434("), grab("export function brokeThisCandle441("),
  src.includes("export function brokeThisCandle457(") ? grab("export function brokeThisCandle457(") : "function brokeThisCandle457() { return ''; }",
  "function fiveOpenNow(a) { return 0; } function zonesNow(a) { return null; } function fiveHLNow(a) { return null; }"].map((x) => x.replace(/^export /, ""));
const js = ts.transpileModule(parts.join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const W = new Function(js + "; return { reachWall429, pinkLongWall432, sameSide434, brokeThisCandle441, brokeThisCandle457 };")();
// 10:22:16 board: -2σ 4009.24, -1σ 4021.47, -0.5σ 4033.64, pink 5m PP 4019.97, red zone 4024.22; 5m candle open 4022.221 high 4022.56 low 4020.60; long at 4021.877
const L = [{ name: "-2σ", price: 4009.24 }, { name: "-1σ", price: 4021.47 }, { name: "-0.5σ", price: 4033.64 }, { name: "5m PP", price: 4019.97 }];
const Z = { pp: 4015, r1: 4024.22, r2: 4027.5, s1: 4012, s2: 4008 }, o5 = 4022.221, hl = { h: 4022.56, l: 4020.60 }, tick = 4021.877;
const v = { reach429: W.reachWall429("gold", L, tick, "up", Z, o5), pink432: W.pinkLongWall432("gold", L, tick, "up"), side434: W.sameSide434("gold", L, tick, "up", o5),
  broke441: W.brokeThisCandle441("gold", L, tick, "up", o5, hl), broke457: W.brokeThisCandle457("gold", L, tick, "up", o5, hl) };
for (const [k, r] of Object.entries(v)) console.log(`  ${k}: ${r || "passed it"}`);
const refused = Object.values(v).some(Boolean);
// must still pass: a clean long the NEXT candle (opened over -1σ, never broke it), and a long after the candle went green back over its open
const ok2 = !W.brokeThisCandle457("gold", L, 4022.40, "up", 4021.95, { h: 4022.5, l: 4021.90 });
const ok3 = !W.brokeThisCandle457("gold", L, 4022.30, "up", 4022.221, { h: 4022.56, l: 4020.60 });
console.log(refused && ok2 && ok3 ? "REPLAY 10:22 ✓ - the 10:22:16 gold long is refused; a clean next-candle long and a green-candle reclaim still pass" : `REPLAY 10:22: FAIL (refused=${refused} clean=${ok2} reclaim=${ok3})`);
process.exit(refused && ok2 && ok3 ? 0 : 1);
