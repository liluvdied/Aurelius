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
const P = [[80425.49, 80631.82], [80411.52, 80631.82], [80438.49, 80621.5], [80368.69, 80624.69], [80065.11, 80617.33], [79988.84, 80568.48], [80154.47, 80407.32], [80130.56, 80433.08], [80049.4, 80432.66], [80034.6, 80425.41], [80138.63, 80425.84], [80094.71, 80363.3], [80058.35, 80359.41], [80027.01, 80346.8], [80018.64, 80345.57], [79865.2, 80215.76], [79880.07, 80215.76], [80003.13, 80202.41], [80068.66, 80222.81], [80044.23, 80233.02], [80018.08, 80231.64], [79896.16, 80173.85], [79910.65, 80150.39], [79945.62, 80154.03], [79934.15, 80153.91], [79939.74, 80155.02], [79849.69, 80099.42], [79901.77, 80084.9], [79862.12, 80088.35], [79885.69, 80087.27], [79795.11, 80009.28]];
const t0 = 1e12, sm = P.map(([p, pp], k) => ({ t: t0 + k * 60000, p, pp })), now = sm[sm.length - 1].t + 5000;
let ok = true;
if (!H(sm, { on: false }, now)) { ok = false; console.log("SLIDE TEST BTC: FAIL - the 7:15 PM BTC long under the unbroken pink was NOT held"); }
if (!H(sm.slice(-12), { on: true }, now)) { ok = false; console.log("SLIDE TEST BTC: FAIL - the hold timed out before pink broke"); }
const S3 = { on: true }; if (H(sm.concat([{ t: now + 1000, p: 80020, pp: 80009.28 }]), S3, now + 2000) || S3.on) { ok = false; console.log("SLIDE TEST BTC: FAIL - an $8 break up through pink did not free the long"); }
const flat = sm.map((x) => ({ ...x, p: 79800 })); if (H(flat, { on: false }, now)) { ok = false; console.log("SLIDE TEST BTC: FAIL - held with no slide"); }
console.log(ok ? "SLIDE TEST BTC ✓ - the 7:15 PM BTC long is held under the unbroken pink; the hold stays until an $8 pink break, then frees." : "SLIDE TEST BTC: FAIL");
process.exit(ok ? 0 : 1);
