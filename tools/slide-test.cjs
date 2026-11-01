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
// fix494 cases (Love Oct 29 2026 10:03 PM PT: "It's sliding when three candles or more have hit it and rejected on a down slope."):
// candles are 5m buckets of the samples; hit = price touched pink; rejected = the candle ended back under it; down slope = each rejection at a lower pink.
const mk = (cands) => { const sm = []; let t = 1e12; for (const [touch, endP, pp] of cands) { sm.push({ t, p: touch ? pp : endP, pp }); sm.push({ t: t + 150000, p: endP, pp }); t += 300000; } return sm; };
let ok = true;
const t = (c, m) => { if (!c) { ok = false; console.log("SLIDE TEST: FAIL - " + m); } };
// three rejections on a down slope = held
const sm3 = mk([[true, 4057.1, 4059.5], [true, 4056.0, 4058.2], [true, 4054.8, 4056.9], [false, 4054.2, 4056.4]]);
const h1 = slideHold403(sm3, { on: false }, 1e12 + 3 * 300000 + 160000);
t(/SLIDE UNDER PINK/.test(h1), "3 candles hit the pink and rejected on a down slope - the long was NOT held");
// only two rejections = free
const sm2 = mk([[true, 4057.1, 4059.5], [true, 4056.0, 4058.2], [false, 4054.8, 4056.9]]);
t(!slideHold403(sm2, { on: false }, 1e12 + 2 * 300000 + 160000), "2 rejections held the long - her rule is three or more");
// three rejections with price FLAT (each candle closing where the last did) = free - no down slope (fix503c, Love Oct 29 2026 11:46 PM PT: "that was not a rejection upward / it was the wrong direction in her head hun" + "had the logic backwards" + "price was sloping down / only hold are longs / not shorts / vis versa" + 10:03 PM: "It's sliding when three candles or more have hit it and rejected on a down slope.")
const smF = mk([[true, 4057.1, 4058.0], [true, 4057.1, 4058.0], [true, 4057.1, 4058.0], [false, 4057.1, 4058.0]]);
t(!slideHold403(smF, { on: false }, 1e12 + 3 * 300000 + 160000), "3 rejections with price flat held the long - her down slope is price falling rejection to rejection");
// three rejections under a FLAT pink with price falling = her down slope = held (fix503c: the slope is price, not the pink)
const smD = mk([[true, 4057.1, 4058.0], [true, 4056.0, 4058.0], [true, 4055.0, 4058.0], [false, 4054.2, 4058.0]]);
t(/SLIDE UNDER PINK/.test(slideHold403(smD, { on: false }, 1e12 + 3 * 300000 + 160000) || ""), "price falling rejection to rejection under a flat pink was NOT held - that is her down slope (fix503c)");
// price sliding under a sliding pink WITHOUT touching it = free (her words: candles must hit it)
const smN = mk([[false, 4051.0, 4059.5], [false, 4050.0, 4058.2], [false, 4049.0, 4056.9], [false, 4048.5, 4056.4]]);
t(!slideHold403(smN, { on: false }, 1e12 + 3 * 300000 + 160000), "price under a sliding pink with NO pink rejections was held - her rule needs hits");
// the hold stays on while price sits under pink, then a 25c break up through pink frees it
const S2 = { on: true }; const hs = slideHold403(sm3, S2, 1e12 + 3 * 300000 + 160000);
t(!!hs && S2.on, "the hold did not stay on");
const brk = sm3.concat([{ t: 1e12 + 4 * 300000, p: 4056.75, pp: 4056.4 }]);
const S3 = { on: true }; const h3 = slideHold403(brk, S3, 1e12 + 4 * 300000 + 1000);
t(!h3 && !S3.on, "a 25c break up through pink did not free the long");
console.log(ok ? "SLIDE TEST \u2713 - three or more candles hitting the pink and rejecting on a down slope hold the long; two, a flat price, or no hits stay free; a 25c pink break frees." : "SLIDE TEST: FAIL");
process.exit(ok ? 0 : 1);
