// fix462 behaviour test (R190, Love Oct 29 2026 12:36 PM PT: "the candle did flip red, on the5M hun. she didn't short the rejection / please trace the long signal because that is entirely
// false. there is a session band directly above her."): main + rejection - no read in her wrong third, and a real same-side read replaces a thirds-flip label. Replays 12:31 PM gold.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/recon.ts"), "utf8");
function grab(head) { const i = src.indexOf(head); if (i < 0) { console.log("THIRDS READ TEST: FAIL - missing " + head); process.exit(1); }
  const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); const j = i + m.index + m[0].length - 1; let d = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } } }
const W = new Function(ts.transpileModule(["type Line = { name: string; price: number };", grab("export function thirdsRead462("), grab("export function flipReplace462(")].map((x) => x.replace(/^export /, "")).join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return { thirdsRead462, flipReplace462 };")();
const L = [{ name: "-2σ", price: 4004.95 }, { name: "-1σ", price: 4018.29 }, { name: "session VWAP", price: 4031.6 }];
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("THIRDS READ TEST: FAIL - " + m); } };
t(W.thirdsRead462(L, 4016.65, "up"), "12:31:31 gold LONG read at 88% up, -1σ $1.64 above - must NOT book");
t(!W.thirdsRead462(L, 4016.22, "down"), "12:31:40 gold SHORT read at 85% up - must be free to book");
t(W.thirdsRead462(L, 4006.5, "down"), "a short in the bottom 33% (12% up) must not book");
t(!W.thirdsRead462(L, 4006.5, "up"), "a long in the bottom 33% must be free");
t(!W.thirdsRead462([{ name: "-1σ", price: 4018.29 }], 4016.65, "up"), "no band below = can't measure = the read stands (the door's walls still judge)");
const flip = "Top third - seen as a short under 4018.29 (was: 1m rejection off Bollinger upper)";
t(W.flipReplace462(flip, { side: "down", label: "Rejected down off -1σ" }, "down"), "12:31:37 'Rejected down off -1σ' did NOT replace the thirds-flip label");
t(!W.flipReplace462(flip, { side: "down", label: "Top third - seen as a short under 4018.27 (was: x)" }, "down"), "a flip replaced a flip");
t(!W.flipReplace462(flip, { side: "up", label: "Rejected up off -2σ" }, "down"), "the other side replaced it (that is a re-aim, not this rule)");
t(!W.flipReplace462("Rejected down off -1σ", { side: "down", label: "1m rejection off Red zone" }, "down"), "a real call was replaced by another real same-side read (main keeps her first call)");
console.log(ok ? "THIRDS READ TEST ✓ - no long read in the top 33% / short in the bottom 33% (12:31:31 gold long never books); a real same-side read replaces a thirds-flip label (12:31:37 short goes to the walls); genuine flips stay refused." : "THIRDS READ TEST: FAIL");
process.exit(ok ? 0 : 1);
