// fix441 behaviour test (Love Oct 28 2026 9:20 PM PT: "she shorted it when it just broke pink upwards"): replays the 9:20:02 PM gold short - pink 4038.56 broke UP this candle
// (open 4036.67, high 4038.949), main shorted at 4038.30 - it MUST be refused; a short after price broke back DOWN 33c under the pink, and a short in a candle that never broke it, go.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(h) { const i = src.indexOf(h); if (i < 0) { console.log("BROKE TEST: FAIL - missing " + h); process.exit(1); } let j; if (/function/.test(h)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i)); let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(h) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } }
const parts = ["type Line = { name: string; price: number };", src.slice(src.indexOf("const isSessBand = "), src.indexOf("\n", src.indexOf("const isSessBand = "))), grab("export const BREAK_DIST"), grab("export function brokeThisCandle441("), "function fiveOpenNow(a){return 0} function fiveHLNow(a){return null}"].map((x) => x.replace(/^export /, ""));
const F = new Function(ts.transpileModule(parts.join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText + "; return brokeThisCandle441;")();
const L = [{ name: "-2σ", price: 4032.24 }, { name: "-1σ", price: 4040.77 }, { name: "5m PP", price: 4038.56 }];
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("BROKE TEST: FAIL - " + m); } };
t(F("gold", L, 4038.30, "down", 4036.67, { h: 4038.949, l: 4035.1 }), "9:20:02 PM gold short after the pink broke UP this candle must be refused");
t(!F("gold", L, 4038.20, "down", 4036.67, { h: 4038.949, l: 4035.1 }), "a short once price broke back down 33c+ under the pink goes");
t(!F("gold", L, 4038.30, "down", 4036.67, { h: 4038.70, l: 4035.1 }), "a short in a candle that only poked 14c over the pink (not a break) goes");
t(F("gold", L, 4038.80, "up", 4039.50, { h: 4039.6, l: 4038.10 }), "mirror: pink broke DOWN this candle, a long back at 4038.80 must be refused");
t(!F("gold", L, 4038.95, "up", 4039.50, { h: 4039.6, l: 4038.10 }), "mirror: a long once price is back 33c+ over the pink goes");
console.log(ok ? "BROKE TEST ✓ - after a band or the pink breaks this candle, no trade the other way until price breaks back by her distance: the 9:20 PM gold short is refused; mirror holds." : "BROKE TEST: FAIL");
process.exit(ok ? 0 : 1);
