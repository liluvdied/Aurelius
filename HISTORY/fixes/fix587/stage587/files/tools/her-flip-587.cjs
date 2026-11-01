// fix587 HER FLIP, NO EXCEPTIONS (Love Nov 1 2026 12:04 UTC: "she does not enter until a 2-5m candle has flipped her color and is pushing away from the band. No exceptions."):
// replays the REAL 4:00 AM PT (12:00:13 UTC) BTC short (recon-rej, "Candle falling from the top third") on its logged 1m bars, and checks the last line before the POST.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("HER FLIP 587 TEST: FAIL - " + m); } };
function fnText(name) { const i = B.indexOf("function " + name + "("); if (i < 0) return null; const eol = B.indexOf("\n", i); const j = B.lastIndexOf("{", eol); let d = 0, k = j; for (; k < B.length; k++) { if (B[k] === "{") d++; else if (B[k] === "}") { d--; if (!d) break; } } return B.slice(i, k + 1); }
const names = ["trailNow", "turnFlip530", "herTurn587"];
if (names.some((n) => !fnText(n))) { console.log("HER FLIP 587 TEST: FAIL - herTurn587 is missing from bandlock.ts (a 2-5m candle born her colour still counts as a flip)"); process.exit(1); }
const js = ts.transpileModule(names.map(fnText).join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const make = (G) => new Function("G", js + ";return {" + names.join(",") + "};")(G);
const realNow = Date.now;
// 1. THE REAL 12:00:13 UTC SHORT: 11:53-11:59 green run, 12:00 candles 13 s old, opened 77856.28 - no 2-5m candle ever traded green then turned red.
const bars1200 = [{"t": 1793533980, "o": 77821.17, "h": 77847.2, "l": 77817.41, "c": 77826.66, "v": 236}, {"t": 1793534040, "o": 77826.98, "h": 77849.18, "l": 77821.4, "c": 77822.7, "v": 192}, {"t": 1793534100, "o": 77822.17, "h": 77845.22, "l": 77802.53, "c": 77845.22, "v": 209}, {"t": 1793534160, "o": 77842.98, "h": 77845.71, "l": 77817.77, "c": 77817.77, "v": 185}, {"t": 1793534220, "o": 77816.37, "h": 77846.2, "l": 77815.04, "c": 77827.86, "v": 253}, {"t": 1793534280, "o": 77827.87, "h": 77841.46, "l": 77822.45, "c": 77834.1, "v": 202}, {"t": 1793534340, "o": 77833.99, "h": 77857.93, "l": 77821.01, "c": 77856.67, "v": 138}, {"t": 1793534400, "o": 77856.28, "h": 77856.28, "l": 77856.28, "c": 77856.28, "v": 2}];
Date.now = () => Date.parse("2026-11-01T12:00:13.830Z");
let F = make({ __pivBars: { btc: { bars: bars1200 } } });
t(F.turnFlip530("btc", "down", 77846) === true, "replay setup: the old door (fix530 + born-her-colour) should pass this short at 77846 - that is the leak");
t(F.herTurn587("btc", "down", 77846) === false, "the 4:00 AM short (born-red 13 s candle, no turn) still passes her flip");
t(F.herTurn587("btc", "down", 77855.87) === false, "the 4:00 AM short at its wire price still passes her flip");
// 1b. THE REAL 12:15:14 UTC (4:15 AM PT) SHORT, recon-rej "Rejected down off 5m PP": the 3m candle born red at 12:15 after a green 12:12-12:15 3m - no 2-5m candle turned.
Date.now = () => Date.parse("2026-11-01T12:15:14.433Z");
F = make({ __pivBars: { btc: { bars: [{"t": 1793534880, "o": 77903.09, "h": 77908.73, "l": 77850.94, "c": 77868.64, "v": 296}, {"t": 1793534940, "o": 77868.36, "h": 77870.26, "l": 77837.66, "c": 77851.48, "v": 300}, {"t": 1793535000, "o": 77850.47, "h": 77885.7, "l": 77841.41, "c": 77849.66, "v": 282}, {"t": 1793535060, "o": 77864.66, "h": 77864.66, "l": 77816.22, "c": 77830.44, "v": 352}, {"t": 1793535120, "o": 77830.49, "h": 77844.9, "l": 77827.72, "c": 77837.76, "v": 272}, {"t": 1793535180, "o": 77845.26, "h": 77848.23, "l": 77830.07, "c": 77830.07, "v": 286}, {"t": 1793535240, "o": 77829.38, "h": 77843.11, "l": 77819.86, "c": 77840.61, "v": 376}, {"t": 1793535300, "o": 77839.93, "h": 77839.93, "l": 77821.92, "c": 77824.62, "v": 10}] } } });
t(F.turnFlip530("btc", "down", 77833.37) === true, "replay setup: the old door (born-her-colour) should pass the 4:15 short at 77833.37 - that is the leak");
t(F.herTurn587("btc", "down", 77833.37) === false, "the 4:15 AM short (3m born red, no turn) still passes her flip");
// 2. A REAL TURN: a 2m candle that traded green (over its open) and then fell back under its open = her short flip.
Date.now = () => Date.parse("2026-11-01T12:01:30Z");
const o = 1793534400; // 12:00
F = make({ __pivBars: { btc: { bars: [ { t: o, o: 77856, h: 77870, l: 77850, c: 77852 }, { t: o + 60, o: 77852, h: 77853, l: 77840, c: 77842 } ] } } });
t(F.herTurn587("btc", "down", 77842) === true, "a 2-5m candle that went green then turned red was refused (her real flip must go)");
t(F.herTurn587("btc", "up", 77842) === false, "a long on a candle that turned red went through");
// 3. MIRROR: red then green = her long flip.
F = make({ __pivBars: { btc: { bars: [ { t: o, o: 77856, h: 77858, l: 77830, c: 77860 } ] } } });
t(F.herTurn587("btc", "up", 77860) === true, "mirror: red-then-green candle refused for a long");
// 4. BORN GREEN, NEVER RED = no long.
F = make({ __pivBars: { btc: { bars: [ { t: o, o: 77856, h: 77880, l: 77856, c: 77878 } ] } } });
t(F.herTurn587("btc", "up", 77878) === false, "a candle born green (never traded red) counted as a flip for a long");
Date.now = realNow;
// 5. THE LAST LINE: auditGrade523 asks for her turn AFTER every wall, for every flip book (main, rejection, no-pink copy).
const g = fnText("auditGrade523") || "";
t(/impossibleGeo[\s\S]*if \(!why && \(fl\[2\] \|\| fl\[6\]\) && !herTurn587\(asset, side, tick\)\) why = [\s\S]*return why;/.test(g), "the last line before the POST (auditGrade523) does not demand her turn after every wall");
t(/"recon-tog": \[[^\]]*true, false\]/.test(B) && /"recon-rej": \[[^\]]*true, false\]/.test(B), "main / rejection lost their flip flag");
console.log(ok ? "HER FLIP 587 TEST ✓ - no long or short leaves without a 2-5m candle that traded the other colour and flipped her way; the 4:00 AM and 4:15 AM born-red shorts are refused." : "HER FLIP 587 TEST: FAIL");
process.exit(ok ? 0 : 1);
