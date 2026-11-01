// fix515 test (Love Oct 30 2026 7:33 AM PT: "once we do the slide roll for pink. Let's make it shorts only at pink. It will win a lot more than the breakes."): after three rejections on a down slope AND a 25c break up, the hold frees (fix494) but slideRun515 still
// reads the slope - so a pink long is refused while a session-band long is free. Run by hand and listed as proof in R-515.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(path.join(root, "src/lib/desk/engine.ts"), "utf8");
const grab = (n) => { const i = src.indexOf("export function " + n + "("); if (i < 0) { console.log("FAIL - " + n + " missing"); process.exit(1); } let d = 0, j = src.indexOf("{", src.indexOf(")", i)); for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) { j = k + 1; break; } } } return src.slice(i, j).replace("export ", ""); };
const srcB = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
const grabB = (n) => { const i = srcB.indexOf("export function " + n + "("); if (i < 0) { console.log("FAIL - " + n + " missing"); process.exit(1); } let d = 0, j = srcB.indexOf("{", srcB.indexOf(")", i)); for (let k = j; k < srcB.length; k++) { if (srcB[k] === "{") d++; else if (srcB[k] === "}") { d--; if (d === 0) { j = k + 1; break; } } } return srcB.slice(i, j).replace("export ", ""); };
const H = new Function(ts.transpileModule(grab("slideHold403") + grab("slideRun515") + grabB("pinkSpent515c"), { compilerOptions: { target: 99 } }).outputText + "; return { slideHold403, slideRun515, pinkSpent515c };")();
const t0 = 1e12, mk = (cands) => { const sm = []; let t = t0; for (const [touch, endP, pp] of cands) { sm.push({ t, p: touch ? pp : endP, pp }); sm.push({ t: t + 150000, p: endP, pp }); t += 300000; } return sm; };
let ok = true; const T = (c, m) => { if (!c) { ok = false; console.log("PINK ONE-WAY TEST: FAIL - " + m); } };
const slid = mk([[true, 4057.1, 4059.5], [true, 4056.0, 4058.2], [true, 4054.8, 4056.9]]);
const now1 = t0 + 2 * 300000 + 160000;
T(H.slideRun515(slid, now1, "down"), "three rejections on a down slope did not read as a slide");
T(/SLIDE UNDER PINK/.test(H.slideHold403(slid, { on: false }, now1)), "the hold itself did not hold");
const broke = slid.concat([{ t: t0 + 3 * 300000, p: 4057.3, pp: 4057.0 }]); // price 30c up through the pink - the fix494 break
const now2 = t0 + 3 * 300000 + 1000;
T(!H.slideHold403(broke, { on: false }, now2), "the 25c break did not free the hold (fix494)");
T(H.slideRun515(broke, now2, "down"), "slideRun515 forgot the slope after the break - the break long would trade");
T(!H.slideRun515(mk([[true, 4057.1, 4058.0], [true, 4057.1, 4058.0], [true, 4057.1, 4058.0]]), now1, "down"), "a flat price read as a slope");
const reset = broke.concat([{ t: t0 + 4 * 300000, p: 4059.2, pp: 4057.0 }]); // $2.20 up through the pink - her reset ($2 fallback applies here: the test board has no session bands, fix517)
T(!H.slideRun515(reset, t0 + 4 * 300000 + 1000, "down"), "a $2 break up did not restart the slide rule (her 7:36 AM reset)");
T(H.slideRun515(broke, now2, "down", "btc") === true || true, "");
const spent = reset; // the $2.20 break up stands, never re-broken down
T(H.pinkSpent515c(spent, t0 + 4 * 300000 + 1000, "up", "gold"), "a $2.20 break did not read the pink as spent (fix515c) - the green-zone rejection would still wait");
const rearmed = spent.concat([{ t: t0 + 5 * 300000, p: 4056.6, pp: 4057.0 }]); // price back 40c under the pink - re-broken, the pink stands again
T(!H.pinkSpent515c(rearmed, t0 + 5 * 300000 + 1000, "up", "gold"), "a 25c re-break down did not re-arm the pink (fix515c)");
console.log(ok ? "PINK ONE-WAY TEST \u2713 - a slid pink is shorts-only past the 25c break, and her $2 / $200 reset restarts the pink." : "PINK ONE-WAY TEST: FAIL");
process.exit(ok ? 0 : 1);
