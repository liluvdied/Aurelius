// fix446 behaviour test (Love Oct 28 2026 10:37 PM PT: "yes, 2-5M candle flip from red to green or green to red at a band rejection is her entry ok"): replays her read's
// candle filter from recon.ts - a band-rejection long on a red 5m candle stands once a 2-5m candle really flipped green; a non-rejection long still waits for the 5m; no flip = held.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const R = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/recon.ts"), "utf8");
const a = R.indexOf("const rej446 ="), b = R.indexOf("\n", R.indexOf("return seenL.filter((c) => !((c.side === \"up\"", a));
if (a < 0) { console.log("BAND FLIP TEST: FAIL - fix446 missing from recon.ts"); process.exit(1); }
const js = ts.transpileModule("function F(asset, spot, seenL, f, k, fix33, falling, rising, topS, botS, bandFlip, turnFlip530, twoMinHer653, pushLabel653 = (a, s, p, L, lab) => false, L = [] /* fix655 */) { const m1 = (c) => false;\n" + R.slice(a, b) + "\n}", { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const F = new Function(js + "; return F;")();
const run = (label, side, falling, rising, flip, bandFlip = true, two = false) => F("gold", 4041, [{ side, label }], 0.4, 0.33, false, falling, rising, Infinity, -Infinity, bandFlip, () => flip, () => two).length === 1; // fix653: two = her live 2m colour
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("BAND FLIP TEST: FAIL - " + m); } };
t(run("Rejected up off -1σ", "up", true, false, true), "fix1034: a band-rejection long under the 5m open was dropped by the read (the open has no bearing - her colour + push is judged at the door)");
t(run("Rejected up off -1σ", "up", true, false, true, true, true), "Love Nov 4 5:25 PM (fix653): a band-rejection long with her flip AND her 2m green pushing off the band still waited for the 5m"); // fix653
t(run("Rejected up off -1σ", "up", true, false, false), "fix1034: a candle born her colour counts like a flip (Love 5:12 PM) - the read kept it only on a flip (Love 1:37 AM: \"if a flip occurs or not i don't care\")");
t(run("Break above 5m PP", "up", true, false, true), "fix1034: a break long under the 5m open was dropped by the read");
t(run("Rejected down off Red zone", "down", false, true, true), "mirror: a band-rejection short on a green 5m with a real 2-5m red flip was thrown out");
t(/true \/\* fix446: main \*\//.test(R) && (R.match(/true \/\* fix446: rejection \*\//g) || []).length === 3, "fix446 is not wired to main + rejection only");
console.log(ok ? "BAND FLIP TEST ✓ - fix1034: the read no longer drops a call on the 5m vs its open, a flip or a candle born her colour (her 5:12 PM words); her colour + push is judged at the door and the send." : "BAND FLIP TEST: FAIL");
process.exit(ok ? 0 : 1);
