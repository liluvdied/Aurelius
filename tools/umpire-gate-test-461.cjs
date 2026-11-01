// fix461 behaviour test (R185/R186, Love Oct 29 2026 11:46 AM PT: "if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out"): replays the gate's
// in-memory verdict - SAFE + same code -> goes; NOT SAFE -> refused; code changed after SAFE -> refused; no stamp -> refused; other books untouched; and measures the time per order.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/umpire-gate.ts"), "utf8");
const i = src.indexOf("export function umpireVerdict461("); if (i < 0) { console.log("UMPIRE GATE TEST: FAIL - umpireVerdict461 missing"); process.exit(1); }
let d = 0, j = src.indexOf("{", src.indexOf("): string", i)); for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) { j = k + 1; break; } } }
const V = new Function(ts.transpileModule(src.slice(i, j).replace(/^export /, ""), { compilerOptions: { target: 99 } }).outputText + "; return umpireVerdict461;")();
const cur = { "bandlock.ts": "aaaa", "engine.ts": "bbbb" }, safe = { ok: true, hashes: { ...cur } };
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("UMPIRE GATE TEST: FAIL - " + m); } };
t(V(safe, cur) === "", "SAFE stamp + same code: the order was refused");
t(/NOT SAFE/.test(V({ ok: false, why: "tools/side-test-434.cjs is OUT", hashes: cur }, cur)), "umpire NOT SAFE: the order was NOT refused");
t(/CODE CHANGED/.test(V(safe, { ...cur, "bandlock.ts": "cccc" })), "a file changed after SAFE: the order was NOT refused");
t(/CODE CHANGED/.test(V(safe, { ...cur, "new.ts": "dddd" })), "a NEW file after SAFE: the order was NOT refused");
t(/not checked/.test(V(null, cur)), "no stamp at all: the order was NOT refused");
const g = src.includes('export const UMP_BOOKS461 = ["recon-tog", "recon-rej"]'); t(g, "the gate is not main + rejection only");
const n = 200000, big = {}; for (let q = 0; q < 130; q++) big["f" + q + ".ts"] = "h" + q; const sb = { ok: true, hashes: { ...big } };
const t0 = process.hrtime.bigint(); for (let q = 0; q < n; q++) V(sb, big); const us = Number(process.hrtime.bigint() - t0) / n / 1000;
console.log(`  time per order check (130 files, in memory): ${us.toFixed(2)} µs`);
t(us < 200, "the check is slower than 200 µs per order");
console.log(ok ? `UMPIRE GATE TEST ✓ - SAFE + same code goes; NOT SAFE, changed code, a new file or no stamp are refused; main + rejection only; ${us.toFixed(1)} µs per order.` : "UMPIRE GATE TEST: FAIL");
process.exit(ok ? 0 : 1);
