// fix585 PINK-20-OF-CHANNEL test (Love Nov 1 2026 10:34 UTC: "Band channel width = $500 / 20% of that = $100 / The cushion is the distance from the current price to the pink.
// If the current price is inside that $100, the tolerance holds. If the current price is outside that $100, the tolerance does not hold." + 10:38: "calculate it that way for all of them").
// Proves, on the real source text: (1) bandlock pinkSlide580 and recon pinkSlide580R give BTC exactly 20% and gold exactly 15% of the channel at EVERY width ($50 ... $1,000);
// (2) her pink distance wall pinkFar503 holds at 20% - $0.50 and releases at 20% + $0.50 (her "inside that $100 / outside that $100");
// (3) the reach wall's pink (reachWall429) uses that same scale for gold too (no $1 floor). Fails on the pre-585 files, passes after.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8"), R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("PINK 20 TEST: FAIL - " + m); } };
const one = (src, h) => { const i = src.indexOf(h); if (i < 0) { console.log("PINK 20 TEST: FAIL - missing " + h); process.exit(1); } return src.slice(i, src.indexOf("\n", i)); };
function grab(src, head) { const i = src.indexOf(head); if (i < 0) { console.log("PINK 20 TEST: FAIL - missing " + head); process.exit(1); } let j; if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i)); let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } }
const run = (code, ret) => new Function(ts.transpileModule("type Line = { name: string; price: number; unit?: number };\nconst __PINKFLAT25 = false;\n" + code, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText + "; return " + ret + ";")();
const base = [one(B, "export const PINK_PCT429"), grab(B, "export const PINK_PCT459"), one(B, "export function pinkSlide580(")].map((x) => x.replace(/^export /, "")).join("\n");
const S = run(base, "pinkSlide580"), SR = run(one(R, "function pinkSlide580R("), "pinkSlide580R");
const F = run(base + "\n" + grab(B, "export function pinkFar503(").replace(/^export /, ""), "pinkFar503");
const near = (x, y) => Math.abs(x - y) <= 0.01;
for (const W of [50, 80, 99, 100, 185, 300, 500, 501, 700, 1000]) {
  t(near(S("btc", W), 0.2 * W), `bandlock pinkSlide580 btc W=$${W} should be 20% = $${(0.2 * W).toFixed(2)}, got $${S("btc", W)}`);
  t(near(SR("btc", W, 0.2), 0.2 * W), `recon pinkSlide580R btc W=$${W} should be 20% = $${(0.2 * W).toFixed(2)}, got $${SR("btc", W, 0.2)}`);
}
for (const W of [2, 5, 20, 40, 200]) { t(near(S("gold", W), 0.15 * W), `bandlock gold W=$${W} should be 15%`); t(near(SR("gold", W, 0.15), 0.15 * W), `recon gold W=$${W} should be 15%`); }
// her example: channel $500 -> $100. Inside $100 holds, outside does not (pinkFar503 true = pink is FAR = does not hold).
for (const [W, lo] of [[500, 80000], [60, 80000], [700, 80000]]) {
  const hi = lo + W, tick = lo + W / 2, tol = 0.2 * W, L = (pink) => [{ name: "-1σ", price: lo }, { name: "+1σ", price: hi }, { name: "5m PP", price: pink }];
  t(F("btc", L(tick + tol - 0.5), tick, tick + tol - 0.5) === false, `btc channel $${W}: price $${(tol - 0.5).toFixed(2)} from pink is INSIDE 20% ($${tol}) - the tolerance must hold`);
  t(F("btc", L(tick + tol + 0.5), tick, tick + tol + 0.5) === true, `btc channel $${W}: price $${(tol + 0.5).toFixed(2)} from pink is OUTSIDE 20% ($${tol}) - the tolerance must NOT hold`);
}
t(/typeof pinkSlide580 === "function" && sA && sB\) \? pinkSlide580\(asset, sA\.price - sB\.price\)/.test(B), "reachWall429 pink must use her scale for BOTH assets (gold still on the $1-floored pinkReach)");
console.log(ok ? "PINK 20 TEST ✓ - fix585: BTC pink tolerance = 20% of the session-band channel at every width, gold 15%, in bandlock + recon; channel $500 holds inside $100, not outside; reach wall pink on the same scale for gold." : "PINK 20 TEST: FAIL");
process.exit(ok ? 0 : 1);
