// fix446 behaviour test (Love Oct 28 2026 10:37 PM PT: "yes, 2-5M candle flip from red to green or green to red at a band rejection is her entry ok"): replays her read's
// candle filter from recon.ts - a band-rejection long on a red 5m candle stands once a 2-5m candle really flipped green; a non-rejection long still waits for the 5m; no flip = held.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const R = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/recon.ts"), "utf8");
const a = R.indexOf("const rej446 ="), b = R.indexOf("\n", R.indexOf("return seenL.filter((c) => !((c.side === \"up\"", a));
if (a < 0) { console.log("BAND FLIP TEST: FAIL - fix446 missing from recon.ts"); process.exit(1); }
const js = ts.transpileModule("function F(asset, spot, seenL, f, k, fix33, falling, rising, topS, botS, bandFlip, realFlipNow) { const m1 = (c) => false;\n" + R.slice(a, b) + "\n}", { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const F = new Function(js + "; return F;")();
const run = (label, side, falling, rising, flip, bandFlip = true) => F("gold", 4041, [{ side, label }], 0.4, 0.33, false, falling, rising, Infinity, -Infinity, bandFlip, () => flip).length === 1;
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("BAND FLIP TEST: FAIL - " + m); } };
t(run("Rejected up off -1σ", "up", true, false, true), "10:33 PM: a band-rejection long on a red 5m with a real 2-5m green flip was thrown out");
t(!run("Rejected up off -1σ", "up", true, false, false), "a band-rejection long on a red 5m with NO 2-5m flip went through");
t(!run("Break above 5m PP", "up", true, false, true), "a non-rejection long went through on a red 5m (a 2m flip elsewhere must not bypass HER CANDLE)");
t(run("Rejected down off Red zone", "down", false, true, true), "mirror: a band-rejection short on a green 5m with a real 2-5m red flip was thrown out");
t(!run("Rejected up off -1σ", "up", true, false, true, false), "other books (no bandFlip) changed");
t(/true \/\* fix446: main \*\//.test(R) && (R.match(/true \/\* fix446: rejection \*\//g) || []).length === 3, "fix446 is not wired to main + rejection only");
console.log(ok ? "BAND FLIP TEST ✓ - a 2-5m flip red->green / green->red at a band rejection is her entry (main + rejection); other reads still follow the 5m; no flip = held." : "BAND FLIP TEST: FAIL");
process.exit(ok ? 0 : 1);
