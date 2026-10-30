// fix403 behaviour test (Love Oct 28 2026 4:04 PM PT: "can you make sure everything stays when we make a rule?"): replays the 3:54:47 PM PT gold long
// (main, 37c, $2.04 under the unbroken pink 4055.44 while gold slid from 4058.73) through slideHold403 in engine.ts - it MUST be held. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
const i = src.indexOf("export function slideHold403(");
if (i < 0) { console.log("SLIDE TEST: FAIL - slideHold403 is missing from engine.ts"); process.exit(1); }
let depth = 0, j = src.indexOf("{", src.indexOf(")", src.indexOf("now: number)", i)));
for (let k = j; k < src.length; k++) { if (src[k] === "{") depth++; else if (src[k] === "}") { depth--; if (depth === 0) { j = k + 1; break; } } }
const js = ts.transpileModule(src.slice(i, j).replace("export ", ""), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const slideHold403 = new Function(js + "; return slideHold403;")();
// today's minute samples (data/band-log.jsonl gold tick + 5m PP), 22:24-22:54 UTC
const P = [[4058.73,4063.19],[4056.94,4063.19],[4056.46,4061.44],[4053.9,4061.35],[4054.54,4060.92],[4055.86,4060.97],[4054.62,4059.37],[4054.33,4059.37],[4055.53,4059.39],[4055.47,4059.44],[4054.23,4059.55],[4054.08,4059.44],[4054.14,4058.09],[4053.82,4058.12],[4054.71,4058.08],[4054.44,4058.17],[4054.49,4058.15],[4055.15,4057.24],[4055.8,4057.34],[4056.09,4057.48],[4053.81,4057.55],[4053.49,4056.41],[4052.17,4056.41],[4053.69,4056.15],[4053.18,4056.27],[4052.11,4056.26],[4052.33,4056.14],[4052.75,4055.21],[4053.55,4055.29],[4053.74,4055.43],[4053.4,4055.44]];
const t0 = 1e12, sm = P.map(([p, pp], k) => ({ t: t0 + k * 60000, p, pp })), now = sm[sm.length - 1].t + 5000;
let ok = true;
const h1 = slideHold403(sm, { on: false }, now);
if (!h1) { ok = false; console.log("SLIDE TEST: FAIL - the 3:54 PM gold long under the unbroken pink was NOT held"); }
const h2 = slideHold403(sm.map((x) => ({ ...x, p: x.p - 0 })).slice(-12).map((x) => ({ ...x })), { on: true }, now); // after the 30 min slide is gone, the sticky hold stays
if (!h2) { ok = false; console.log("SLIDE TEST: FAIL - the hold timed out before pink broke"); }
const brk = sm.concat([{ t: now + 1000, p: 4055.80, pp: 4055.44 }]);
const S3 = { on: true }, h3 = slideHold403(brk, S3, now + 2000);
if (h3 || S3.on) { ok = false; console.log("SLIDE TEST: FAIL - a 25c break up through pink did not free the long"); }
console.log(ok ? "SLIDE TEST ✓ - today's 3:54 PM gold long is held under the unbroken pink; the hold stays until a 25c pink break, then frees." : "SLIDE TEST: FAIL");
process.exit(ok ? 0 : 1);
