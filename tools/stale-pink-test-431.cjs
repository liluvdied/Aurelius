// fix431 + fix432 behaviour test (Love Oct 28 2026 8:06 PM PT: "yes to all of them bb"; 7:43 PM: "NO SHES NOT SUPPOSED TO LONG INTO AN UNBROKEN PINK EVER"). Replays the
// 7:40:54 PM gold long (main): booked 7:30:14, 2,626 tries, nothing on Kalshi -> fix431 MUST skip it; a call holding a fill MUST keep its record. Pink 4047.32 above the 4044.03
// wire price -> fix432 MUST refuse the long; a long 30c over the pink and any short pass. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const E = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
const Bs = fs.readFileSync(process.argv[3] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true;
if (E.includes("an old call never fires (fix431)")) { ok = false; console.log("STALE/PINK TEST: FAIL - the 90 s drop for held calls (fix431) is back - Love took it out (fix444)"); }
const i = Bs.indexOf("export const PINK_BREAK432"), j0 = Bs.indexOf("export function pinkLongWall432(");
if (i < 0 || j0 < 0) { console.log("STALE/PINK TEST: FAIL - fix432 pink-long wall is missing from bandlock.ts"); process.exit(1); }
let dep = 0, j = Bs.indexOf("{", Bs.indexOf("): string", j0)); for (let k = j; k < Bs.length; k++) { if (Bs[k] === "{") dep++; else if (Bs[k] === "}") { dep--; if (dep === 0) { j = k + 1; break; } } }
// fix459 (R176, Love Oct 29 2026 11:12-11:18 AM PT: "she is only not allowed to long into pink at 15% of the channel width, band to band" + "15% just for gold rn hun. 20% for btc"): the wall now reads
// PINK_PCT429 / PINK_PCT459 / pinkBeyond459 - the test loads them with it (harness only; what it proves is unchanged)
const one459 = (h) => (Bs.includes(h) ? Bs.slice(Bs.indexOf(h), Bs.indexOf(";", Bs.indexOf(h)) + 1) : "");
let pb459 = ""; { const h = "export function pinkBeyond459("; const a = Bs.indexOf(h); if (a >= 0) { let d = 0, b = Bs.indexOf("{", Bs.indexOf("): boolean", a)); for (let k = b; k < Bs.length; k++) { if (Bs[k] === "{") d++; else if (Bs[k] === "}") { d--; if (d === 0) { pb459 = Bs.slice(a, k + 1); break; } } } } }
const js = ts.transpileModule("type Line = { name: string; price: number };\n" + [one459("export const PINK_PCT429"), one459("export const PINK_PCT459"), pb459].join("\n").replace(/export /g, "") + "\n" + Bs.slice(i, j).replace(/export /g, ""), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const P = new Function(js + "; return pinkLongWall432;")();
const L = [{ name: "-1σ", price: 4043.85 }, { name: "5m PP", price: 4047.32 }];
if (!P("gold", L, 4044.03, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - the 7:40 gold long under the unbroken pink was NOT refused"); }
if (!P("gold", L, 4047.50, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - a long only 18c over the pink (under her 25c break) was NOT refused"); }
if (P("gold", L, 4047.60, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - a long 28c over the pink (broken) was refused"); }
if (P("gold", L, 4044.03, "down")) { ok = false; console.log("STALE/PINK TEST: FAIL - a short was refused by the long-only pink wall"); }
if (!P("btc", [{ name: "5m PP", price: 80000 }], 80005, "up") || P("btc", [{ name: "5m PP", price: 80000 }], 80008, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - BTC $8 pink break"); }
console.log(ok ? "STALE/PINK TEST ✓ - the 7:40 PM gold long is refused under the unbroken pink; broken-pink longs and shorts pass; the 90 s drop for held calls stays out (fix444)." : "STALE/PINK TEST: FAIL");
process.exit(ok ? 0 : 1);
