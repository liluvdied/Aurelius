// fix648 proof (Love Nov 4 2026 3:42 PM PT: "make it a 3% margin of error both sides pls"): her thirds refuse 3% of the channel early, both sides - the 3:15 PM BTC short at 34% of a 33% line is refused now.
const fs = require("fs"), path = require("path"), root = path.join(__dirname, ".."), ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8");
const grab = (head) => { const i = src.indexOf(head); if (i < 0) throw new Error("missing " + head); let d = 0; for (let j = src.indexOf("{", src.indexOf(")", i)); j < src.length; j++) { if (src[j] === "{") d++; else if (src[j] === "}" && !--d) return src.slice(i, j + 1); } };
const m = /export const MARGIN648 = [^;]+;/.exec(src); if (!m) { console.log("MARGIN 648 ✗ - MARGIN648 missing"); process.exit(1); }
const support = require("./thirds-fixture.cjs")(ts, fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8"));
const js = ts.transpileModule(support + "\n" + m[0].replace("export ", "") + "\n" + grab("export function thirdsRead463(").replace("export ", "") + "\nmodule.exports = thirdsRead463;", { compilerOptions: { target: 99, module: 1 } }).outputText;
const mod = { exports: {} }; new Function("module", "exports", js)(mod, mod.exports); const th = mod.exports;
let ok = true; const T = (n, c) => { if (!c) ok = false; console.log((c ? "  ✓ " : "  ✗ ") + n); };
const L = [{ name: "-1σ", price: 80391 }, { name: "session VWAP", price: 80560 }, { name: "+1σ", price: 80729 }]; // the 3:15 PM channel ($169)
T("3:15 PM: BTC short at 34% of the -1σ -> VWAP channel is refused (33% + 3%)", th(L, 80391 + 0.34 * 169, "down") === true);
T("a short at 37% is free", th(L, 80391 + 0.37 * 169, "down") === false);
T("mirror: a long at 66% is refused", th(L, 80391 + 0.66 * 169, "up") === true);
T("a long at 63% is free", th(L, 80391 + 0.63 * 169, "up") === false);
console.log(ok ? "MARGIN 648 ✓ - her thirds refuse 3% early, both sides." : "MARGIN 648 ✗"); process.exit(ok ? 0 : 1);
