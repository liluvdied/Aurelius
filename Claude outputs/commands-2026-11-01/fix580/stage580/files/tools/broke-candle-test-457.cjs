// fix457 behaviour test (R170, Love Oct 29 2026 10:42 AM PT: "if a band broke downwards it is only a short ... band breaks = trade the direction of the break. WITH PRICE ON THE SAME SIDE OF THE
// BREAK. A WICK THRU WITH PRICE ON THE OTHER SIDE OF THE BAND IS NOT AN ENTRY ... a LONG WITH A SESSION BAND 5 MILLIMETERS ABOVE HER ====== BLOCKKKKKED ... count the 33% correctly"). Replays the
// 10:22:16 AM PT gold rejection long (4021.877; -1σ 4021.47 broke down this candle, low 4020.60, open 4022.221) - it MUST be refused. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(head) {
  const i = src.indexOf(head); if (i < 0) { console.log("BROKE 457 TEST: FAIL - missing from bandlock.ts: " + head); process.exit(1); }
  const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); const j = i + m.index + m[0].length - 1; let d = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } }
}
const one = (h) => src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h)));
const bd = src.indexOf("export const BREAK_DIST"), bde = src.indexOf(";", src.indexOf("}", bd)) + 1;
const parts = ["type Line = { name: string; price: number; unit?: number };", one("const isSessBand = "), src.slice(bd, bde), grab("export function brokeThisCandle457("),
  "function fiveOpenNow(a) { return 0; } function fiveHLNow(a) { return null; }"].map((x) => x.replace(/^export /, ""));
const js = ts.transpileModule(parts.join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const W = new Function(js + "; return brokeThisCandle457;")();
const L = [{ name: "-2σ", price: 4009.24 }, { name: "-1σ", price: 4021.47 }, { name: "-0.5σ", price: 4033.64 }, { name: "5m PP", price: 4019.97 }];
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("BROKE 457 TEST: FAIL - " + m); } };
const a = W("gold", L, 4021.70, "up", 4022.221, { h: 4022.56, l: 4020.60 }); t(a, "a gold long only 23c back over the -1σ that broke DOWN this candle (under her 33c) was NOT refused"); console.log("  23c back: " + a);
t(!W("gold", L, 4021.877, "up", 4022.221, { h: 4022.56, l: 4020.60 }), "fix483 (c21, Love Oct 29 6:40 PM: \"a break by HER DISTANCE\"): the long 41c back over the broken -1σ (past her 33c) was still refused");
t(!W("gold", L, 4022.40, "up", 4022.221, { h: 4022.56, l: 4020.60 }), "fix483: a long 93c back over the -1σ it broke down through (past her 33c) was still refused");
const w = W("gold", L, 4021.60, "down", 4022.221, { h: 4022.56, l: 4020.60 }); t(/WICK/.test(w), "a short with price back OVER the broken -1σ (a wick through) was NOT refused: " + w);
t(!W("gold", L, 4020.90, "down", 4022.221, { h: 4022.56, l: 4020.60 }), "a short under the -1σ it broke down through (price on the side of the break) was refused");
const L2 = [{ name: "-2σ", price: 4009.24 }, { name: "-1σ", price: 4021.47 }, { name: "-0.5σ", price: 4033.64 }];
const q = W("gold", L2, 4020.50, "up", 4019.00, { h: 4020.6, l: 4018.9 }); t(/33%/.test(q), "a long at 92% of -2σ -> unbroken -1σ (5 millimeters under it) was NOT refused by her 33%: " + q);
t(!W("gold", L2, 4012.50, "up", 4011.00, { h: 4012.6, l: 4010.9 }), "a long at 27% of the channel was refused");
t(!W("gold", L, 4022.30, "up", 4022.00, { h: 4022.40, l: 4021.90 }), "a clean long the next candle (opened over -1σ, never broke it) was refused");
const LB = [{ name: "-1σ", price: 80900 }, { name: "session VWAP", price: 81000 }, { name: "+1σ", price: 81300 }];
t(W("btc", LB, 80996, "down", 80990, { h: 81010, l: 80980 }), "BTC: a short only $4 back under the session VWAP that broke UP this candle (under her $5, fix580) was NOT refused");
t(!W("btc", LB, 80995, "down", 80990, { h: 81010, l: 80980 }), "fix580: BTC short $5 back under the VWAP it broke up through (her $5 break) was still refused");
t(!W("btc", LB, 80990, "down", 80990, { h: 81010, l: 80980 }), "fix483: BTC short $10 back under the VWAP it broke up through (past her $5) was still refused");
t(W("btc", LB, 80995, "up", 80990, { h: 81010, l: 80980 }), "BTC: a long with price back UNDER the VWAP it broke up through (a wick) was NOT refused");
t(!W("btc", LB, 81020, "up", 80990, { h: 81025, l: 80980 }), "BTC: a long over the VWAP it broke up through was refused");
console.log(ok ? "BROKE 457 TEST ✓ - a band broken this candle = only the break's direction with price on its side until price breaks back by her distance (fix483, c21); wicks refused; her 33% counts the band in front; clean trades pass." : "BROKE 457 TEST: FAIL");
process.exit(ok ? 0 : 1);
