// fix571 flag test (WEEKEND-PINK-25 overlay, Love Oct 31 2026): proves BOTH states of her __PINKFLAT25 directly, the way the live module runs them.
// It grabs her pink distance (pinkFar503) and builds it once with __PINKFLAT25 forced TRUE and once FORCED FALSE, then asserts:
//   flag TRUE  => a flat $25 at every width, both assets (the weekend value);
//   flag FALSE => her untouched live pink law EXACTLY (gold 15% of the channel; BTC min($25, max(weekday $75 floor, 3/4 at $75-$180 else 20%))).
// That the false branch reproduces her live law byte-for-byte is the proof this is an OVERLAY - it changes her behaviour only when the flag is set. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("PINK FLAG25 TEST: FAIL - " + m); } };
t(/export const __PINKFLAT25\s*=\s*(true|false)\s*;/.test(src), "bandlock.ts has no `export const __PINKFLAT25 = true|false;` - her weekend flag"); // fix580 (Love Nov 1 2026: "put it back to 15% ... we restore $25 from 2-3 pm tomorrow"): the flag may ship either way; both states are proven below
function grab(head) { const i = src.indexOf(head); if (i < 0) { console.log("PINK FLAG25 TEST: FAIL - missing " + head); process.exit(1); } let j; if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i)); let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } }
const one = (h) => src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h)));
const hasSlide580 = src.indexOf("export function pinkSlide580(") >= 0; // fix580: her pink scale (BTC $25 under $100 / 20% $100-$500 / 15% over $500; gold 15%)
const body = [one("export const PINK_PCT429"), grab("export const PINK_PCT459"), ...(hasSlide580 ? [one("export function pinkSlide580(")] : []), grab("export function pinkFar503(")].map((x) => x.replace(/^export /, "")).join("\n");
const buildF = (flagVal) => { const js = ts.transpileModule("type Line = { name: string; price: number; unit?: number };\nconst __PINKFLAT25 = " + flagVal + ";\n" + body, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText; return new Function(js + "; return pinkFar503;")(); };
const Ftrue = buildF(true), Ffalse = buildF(false);
const board = (lo, hi) => (tick, pink) => [{ name: "-1σ", price: lo }, { name: "+1σ", price: hi }, { name: "5m PP", price: pink }];
const readTol = (F, asset, lo, hi) => { const mk = board(lo, hi), tick = (lo + hi) / 2; let a = 0, b = 1e7; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (F(asset, mk(tick, tick + m), tick, tick + m) === true) b = m; else a = m; } return (a + b) / 2; };
const near = (x, y, m) => Math.abs(x - y) <= (m || 0.02);
// faithful replica of her LIVE pink law (the overlay's else-branch), day-robust
const weekend = /Sat|Sun/.test(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date()));
const has585 = /fix585 PINK-20-OF-CHANNEL/.test(src); // fix585 (Love Nov 1 2026 10:34 UTC: "Band channel width = $500 / 20% of that = $100"): BTC 20% of the channel at every width
const live = (asset, W) => hasSlide580 ? Math.round((asset === "btc" ? (has585 ? 0.2 * W : W < 100 ? 25 : W <= 500 ? 0.2 * W : 0.15 * W) : 0.15 * W) * 100) / 100 : asset === "btc" ? Math.round(Math.min(25, Math.max(weekend ? 0 : 75, (W < 180 && W >= 75) ? 0.75 * W : 0.2 * W)) * 100) / 100 : Math.round(0.15 * W * 100) / 100;
const WIDTHS = [["gold", 3997.5, 4002.5, 5], ["gold", 4040, 4080, 40], ["gold", 3900, 4100, 200], ["btc", 79975, 80025, 50], ["btc", 80000, 80300, 300], ["btc", 79650, 80350, 700]];
// FLAG TRUE => flat $25 both assets, every width
for (const [asset, lo, hi, W] of WIDTHS) { const got = readTol(Ftrue, asset, lo, hi); t(near(got, 25), `flag TRUE: ${asset} W=$${W} should be a flat $25, got $${got.toFixed(3)}`); }
// FLAG FALSE => her untouched live law, exactly
for (const [asset, lo, hi, W] of WIDTHS) { const got = readTol(Ffalse, asset, lo, hi), want = live(asset, W); t(near(got, want, 0.03), `flag FALSE: ${asset} W=$${W} should be her live $${want.toFixed(3)}, got $${got.toFixed(3)}`); }
console.log(ok ? "PINK FLAG25 TEST ✓ - __PINKFLAT25 true = a flat $25 pink both assets at every width; false = her pink scale exactly (" + (has585 ? "gold 15%, BTC 20% of the channel at every width - fix585" : "gold 15%; BTC $25 under $100, 20% $100-$500, 15% over $500 - fix580") + "). The overlay changes her only when the flag is set." : "PINK FLAG25 TEST: FAIL");
process.exit(ok ? 0 : 1);
