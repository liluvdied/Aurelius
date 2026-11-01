// fix560 behaviour test (Love Oct 31 2026 1:11 AM PT: "when the longs are blocked on the pink downslope she is to SHORT there ONLY until price breaks pink by 10% of the channel width for gold and 10% for btc"):
// lifts slideHold403 / slideHoldBtc423 / climbHold464 out of engine.ts, gives them a channel (gold $20, BTC $200), and checks the hold stays inside 10% of it and frees past it. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
function grab(head) { const i = src.indexOf(head); if (i < 0) return null; let d = 0, j = src.indexOf("{", src.indexOf(")", src.indexOf("now: number", i))); for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1).replace(/^export /, ""); } } return null; }
const parts = [grab("export function slideHold403("), grab("export function slideHoldBtc423("), grab("export function climbHold464(")];
if (parts.some((p) => !p)) { console.log("SLIDE 10% TEST: FAIL - a slope hold is missing from engine.ts"); process.exit(1); }
const H = new Function(ts.transpileModule(parts.join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return { slideHold403, slideHoldBtc423, climbHold464 };")();
globalThis.__lawBands = { gold: { L: [{ name: "+1σ", price: 4030 }, { name: "session VWAP", price: 4010 }] }, btc: { L: [{ name: "+1σ", price: 80000 }, { name: "session VWAP", price: 79800 }] } };
const mk = (cands) => { const sm = []; let t = 1e12; for (const [touch, endP, pp] of cands) { sm.push({ t, p: touch ? pp : endP, pp }); sm.push({ t: t + 150000, p: endP, pp }); t += 300000; } return sm; };
const T4 = 1e12 + 4 * 300000, at = (sm, p, pp) => sm.concat([{ t: T4, p, pp }]);
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("SLIDE 10% TEST: FAIL - " + m); } };
const g = mk([[true, 4019.0, 4021.0], [true, 4018.5, 4020.6], [true, 4018.0, 4020.2], [false, 4017.5, 4020.0]]);
t(!!H.slideHold403(at(g, 4021.0, 4020.0), { on: true }, T4 + 1000), "gold $1 over pink (under 10% of the $20 channel) freed the long");
t(!H.slideHold403(at(g, 4022.1, 4020.0), { on: true }, T4 + 1000), "gold $2.10 over pink (past 10% of the $20 channel) did not free the long");
const b = mk([[true, 79880, 79950], [true, 79860, 79930], [true, 79840, 79910], [false, 79830, 79900]]);
t(!!H.slideHoldBtc423(at(b, 79910, 79900), { on: true }, T4 + 1000), "BTC $10 over pink (under 10% of the $200 channel) freed the long");
t(!H.slideHoldBtc423(at(b, 79921, 79900), { on: true }, T4 + 1000), "BTC $21 over pink (past 10% of the $200 channel) did not free the long");
const c = mk([[true, 4021.0, 4019.0], [true, 4021.5, 4019.4], [true, 4022.0, 4019.8], [false, 4022.5, 4020.0]]);
t(!!H.climbHold464(at(c, 4019.0, 4020.0), { on: true }, T4 + 1000, "gold"), "gold $1 under a climbing pink freed the short (mirror)");
t(!H.climbHold464(at(c, 4017.9, 4020.0), { on: true }, T4 + 1000, "gold"), "gold $2.10 under a climbing pink did not free the short (mirror)");
console.log(ok ? "SLIDE 10% TEST ✓ - a sliding pink holds the long (a climbing pink the short) until price breaks it by 10% of the channel, gold + BTC." : "SLIDE 10% TEST: FAIL");
process.exit(ok ? 0 : 1);
