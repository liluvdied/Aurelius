// fix433 behaviour test (Love Oct 28 2026 8:23 PM PT: "7- back to 2m-5m"; 8:18 PM: "1 - stay"): her flip is 2/3/4/5m - a candle green ONLY on the 1m must NOT count,
// a green 2-5m candle must; and main's zone read takes that flip (fix394). Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
const R = fs.readFileSync(process.argv[3] || path.join(root, "src/lib/desk/recon.ts"), "utf8");
let ok = true;
function grab(head) { const i = B.indexOf(head); if (i < 0) return null; let d = 0, j = B.indexOf("{", B.indexOf("): boolean", i)); for (let k = j; k < B.length; k++) { if (B[k] === "{") d++; else if (B[k] === "}") { d--; if (d === 0) return B.slice(i, k + 1); } } }
const T0 = Date.UTC(2026, 9, 29, 4, 1, 30); // 12:01:30 frames: 1m opens 12:01, 2/3/4/5m open 12:00
for (const name of ["anyFlipNow", "anyFlipMinNow"]) {
  const src = grab(`export function ${name}(`);
  if (!src) { ok = false; console.log(`FLIP TEST: FAIL - ${name} missing`); continue; }
  const js = ts.transpileModule(src.replace("export ", ""), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  const mk = (bars) => new Function("G", "trailNow", "Date", js + `; return ${name};`)({ __pivBars: { gold: { bars } } }, () => [], { now: () => T0 });
  const t = T0 / 1000, m0 = Math.floor(t / 300) * 300, m1 = Math.floor(t / 60) * 60;
  const only1 = mk([{ t: m0, o: 4050.5, h: 4050.6, l: 4049.4, c: 4049.6 }, { t: m1, o: 4049.6, h: 4050.2, l: 4049.5, c: 4050 }]);
  if (only1("gold", "up", 4050.0)) { ok = false; console.log(`FLIP TEST: FAIL - ${name}: a candle green only on the 1m counted as her flip (must be 2-5m)`); }
  const g2 = mk([{ t: m0, o: 4049.0, h: 4050.6, l: 4048.9, c: 4049.6 }, { t: m1, o: 4049.6, h: 4050.2, l: 4049.5, c: 4050 }]);
  if (!g2("gold", "up", 4050.0)) { ok = false; console.log(`FLIP TEST: FAIL - ${name}: a green 2-5m candle did not count`); }
}
if (!R.includes("zoneFlip = false /* fix394") || !R.includes("(zoneFlip && (() => { try { return anyFlipNow(asset, \"up\", spot)") || !R.includes("true /* fix394: main (fix433) */")) { ok = false; console.log("FLIP TEST: FAIL - main's zone read does not take the 2-5m flip (fix394)"); }
console.log(ok ? "FLIP TEST ✓ - her flip is 2/3/4/5m: a 1m-only flip never counts, a green 2-5m does; main's green/red zone reads take it (fix394)." : "FLIP TEST: FAIL");
process.exit(ok ? 0 : 1);
