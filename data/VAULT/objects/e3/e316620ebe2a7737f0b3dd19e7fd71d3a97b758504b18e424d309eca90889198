// fix431 + fix432 behaviour test (Love Oct 28 2026 8:06 PM PT: "yes to all of them bb"; 7:43 PM: "NO SHES NOT SUPPOSED TO LONG INTO AN UNBROKEN PINK EVER"). Replays the
// 7:40:54 PM gold long (main): booked 7:30:14, 2,626 tries, nothing on Kalshi -> fix431 MUST skip it; a call holding a fill MUST keep its record. Pink 4047.32 above the 4044.03
// wire price -> fix432 MUST refuse the long; a long 30c over the pink and any short pass. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const E = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
const Bs = fs.readFileSync(process.argv[3] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true;
const li = E.split("\n").find((x) => x.includes("an old call never fires (fix431)"));
if (!li) { console.log("STALE/PINK TEST: FAIL - fix431 stale guard is missing from engine.ts"); process.exit(1); }
const run = new Function("done", "row", "globalThis", "let out = 'kept'; for (const _ of [0]) { " + ts.transpileModule(li, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText + " } return out;");
const now = Date.now(), at = new Date(now - 640000).toISOString();
const d1 = { "g": { status: "blocked", tries: 2626, reason: "BREAK INTO A ZONE" } };
run(d1, { id: "g", book: "recon-tog", at }, {});
if (d1.g.status !== "skipped" || !d1.g.final) { ok = false; console.log("STALE/PINK TEST: FAIL - the 7:40 gold long (booked 10.7 min earlier, 2,626 tries, nothing on Kalshi) was NOT skipped"); }
const d2 = { "g": { status: "partial", orderId: "x", tries: 3 } };
run(d2, { id: "g", book: "recon-rej", at }, {});
if (d2.g.status !== "partial") { ok = false; console.log("STALE/PINK TEST: FAIL - a call holding a partial fill lost its record"); }
const d3 = { "g": { status: "blocked", tries: 5 } };
run(d3, { id: "g", book: "recon-tog", at: new Date(now - 30000).toISOString() }, {});
if (d3.g.status !== "blocked") { ok = false; console.log("STALE/PINK TEST: FAIL - a 30 s old call was skipped"); }
const d4 = { "g": { status: "blocked", tries: 5 } };
run(d4, { id: "g", book: "recon-dly", at }, {});
if (d4.g.status !== "blocked") { ok = false; console.log("STALE/PINK TEST: FAIL - the delayed twin is not exempt"); }
const i = Bs.indexOf("export const PINK_BREAK432"), j0 = Bs.indexOf("export function pinkLongWall432(");
if (i < 0 || j0 < 0) { console.log("STALE/PINK TEST: FAIL - fix432 pink-long wall is missing from bandlock.ts"); process.exit(1); }
let dep = 0, j = Bs.indexOf("{", Bs.indexOf("): string", j0)); for (let k = j; k < Bs.length; k++) { if (Bs[k] === "{") dep++; else if (Bs[k] === "}") { dep--; if (dep === 0) { j = k + 1; break; } } }
const js = ts.transpileModule("type Line = { name: string; price: number };\n" + Bs.slice(i, j).replace(/export /g, ""), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const P = new Function(js + "; return pinkLongWall432;")();
const L = [{ name: "-1σ", price: 4043.85 }, { name: "5m PP", price: 4047.32 }];
if (!P("gold", L, 4044.03, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - the 7:40 gold long under the unbroken pink was NOT refused"); }
if (!P("gold", L, 4047.50, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - a long only 18c over the pink (under her 25c break) was NOT refused"); }
if (P("gold", L, 4047.60, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - a long 28c over the pink (broken) was refused"); }
if (P("gold", L, 4044.03, "down")) { ok = false; console.log("STALE/PINK TEST: FAIL - a short was refused by the long-only pink wall"); }
if (!P("btc", [{ name: "5m PP", price: 80000 }], 80005, "up") || P("btc", [{ name: "5m PP", price: 80000 }], 80008, "up")) { ok = false; console.log("STALE/PINK TEST: FAIL - BTC $8 pink break"); }
console.log(ok ? "STALE/PINK TEST ✓ - the 7:40 PM gold long is skipped as stale (10 min, 2,626 tries) and refused under the unbroken pink; fills keep their records; broken-pink longs and shorts pass." : "STALE/PINK TEST: FAIL");
process.exit(ok ? 0 : 1);
