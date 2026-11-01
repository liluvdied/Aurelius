// fix423 behaviour test (Love Oct 28 2026 7:17 PM PT: "you see price on a downslope ?????  you see prices rejecting off of pink a hundred times ?????"): replays the
// 7:15:08 PM PT BTC long (79,788, under the unbroken pink while BTC slid ~$630 in 30 min) through slideHoldBtc423 in engine.ts - it MUST be held. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
const i = src.indexOf("export function slideHoldBtc423(");
if (i < 0) { console.log("SLIDE TEST BTC: FAIL - slideHoldBtc423 is missing from engine.ts"); process.exit(1); }
let depth = 0, j = src.indexOf("{", src.indexOf(")", src.indexOf("now: number)", i)));
for (let k = j; k < src.length; k++) { if (src[k] === "{") depth++; else if (src[k] === "}") { depth--; if (depth === 0) { j = k + 1; break; } } }
const js = ts.transpileModule(src.slice(i, j).replace("export ", ""), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const H = new Function(js + "; return slideHoldBtc423;")();
// minute samples (data/band-log.jsonl btc tick + 5m PP), 01:44-02:15 UTC Oct 29
// fix494 cases (Love Oct 29 2026 10:03 PM PT, BTC sizes: $8 break):
const mk = (cands) => { const sm = []; let t = 1e12; for (const [touch, endP, pp] of cands) { sm.push({ t, p: touch ? pp : endP, pp }); sm.push({ t: t + 150000, p: endP, pp }); t += 300000; } return sm; };
let ok = true;
const t = (c, m) => { if (!c) { ok = false; console.log("SLIDE TEST BTC: FAIL - " + m); } };
const sm3 = mk([[true, 79880, 79950], [true, 79820, 79900], [true, 79760, 79845], [false, 79700, 79800]]);
if (!/SLIDE UNDER PINK/.test(H(sm3, { on: false }, 1e12 + 3 * 300000 + 160000))) { ok = false; console.log("SLIDE TEST BTC: FAIL - 3 rejections on a down slope did not hold the long"); }
const sm2 = mk([[true, 79880, 79950], [true, 79820, 79900], [false, 79760, 79845]]);
if (H(sm2, { on: false }, 1e12 + 2 * 300000 + 160000)) { ok = false; console.log("SLIDE TEST BTC: FAIL - 2 rejections held the long"); }
const S3 = { on: true };
if (H(sm3.concat([{ t: 1e12 + 4 * 300000, p: 79809, pp: 79800 }]), S3, 1e12 + 4 * 300000 + 1000) || S3.on) { ok = false; console.log("SLIDE TEST BTC: FAIL - an $8 break up through pink did not free the long"); }
console.log(ok ? "SLIDE TEST BTC \u2713 - three or more candles hitting the pink and rejecting on a down slope hold the long; an $8 pink break frees." : "SLIDE TEST BTC: FAIL");
process.exit(ok ? 0 : 1);
