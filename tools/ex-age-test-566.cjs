// fix566 test: her 2,500 ms exchange-time cap (Love Oct 31 2026 2:30 AM PT). Usage: node tools/ex-age-test-566.cjs [quotes.ts path]
const fs = require("fs"); const ts = require(process.cwd() + "/node_modules/typescript");
const src = fs.readFileSync(process.argv[2] || "src/lib/desk/quotes.ts", "utf8");
const fn = src.match(/export function exGate566[\s\S]*?\n}\n/)[0].replace("export ", "");
const js = ts.transpileModule("const EX_CAP_MS566 = 2500; const QS_VER = 99; const g = globalThis;" + fn, { compilerOptions: { target: 99 } }).outputText;
const exGate566 = new Function(js + "; return exGate566;")();
const now = Date.now(); const set = (signed, tick) => { globalThis.__tvAuth = { signed }; globalThis.__qtk_99 = { btc: tick }; };
const cases = [[true, { c: 1, at: now, ex: now - 1100 }, true], [true, { c: 1, at: now, ex: now - 2400 }, true], [true, { c: 1, at: now, ex: now - 2600 }, false], [true, { c: 1, at: now }, false], [false, { c: 1, at: now, ex: now - 9000 }, true]];
let ok = 0; for (const [s, t, want] of cases) { set(s, t); if ((exGate566("btc") === "") === want) ok++; }
console.log(ok === cases.length ? "EXCHANGE AGE CAP ✓ - 1.1 s + 2.4 s go, 2.6 s / no exchange time refused once signed in" : `EXCHANGE AGE CAP ✗ ${ok}/${cases.length}`);
