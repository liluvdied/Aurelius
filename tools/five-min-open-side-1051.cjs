#!/usr/bin/env node
// fix1051 HER 5M BOOKS ENTER ONLY ON HER SIDE OF THE 5M OPEN (Love Nov 9 2026 8:52 PM PT: "Yes, if those are testing there that makes sense but not for the 15 only the five") - read-only, no network, no order.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("FIVE MIN OPEN SIDE 1051 TEST: FAIL - " + m); } };
const X = fs.readFileSync(path.join(root, "src/lib/desk/xrp5m961.ts"), "utf8"), P = fs.readFileSync(path.join(root, "src/lib/desk/p5m1045.ts"), "utf8");
const ts = require(path.join(root, "node_modules/typescript"));
const grab = (src, name) => { const i = src.indexOf("export function " + name + "("); if (i < 0) return ""; const e = src.indexOf("\n", i); return src.slice(i, e); };
const js = ts.transpileModule((grab(X, "win5Open1051") + "\n" + grab(X, "openSide1051") + "\nmodule.exports = { win5Open1051, openSide1051 };").replace(/export /g, ""), { compilerOptions: { module: 1, target: 99 } }).outputText;
const m = { exports: {} }; new Function("module", "exports", js)(m, m.exports); const { win5Open1051, openSide1051 } = m.exports;
t(typeof win5Open1051 === "function" && typeof openSide1051 === "function", "her helpers are missing");
if (ok) {
  const w = 1794283200, bs = [{ t: w - 60, o: 90 }, { t: w, o: 100 }, { t: w + 60, o: 101 }, { t: w + 120, o: 99 }];
  t(win5Open1051(bs, w + 150) === 100, "the 5m window's open must be its FIRST minute's open (100)");
  t(Number.isNaN(win5Open1051([{ t: w - 60, o: 90 }], w + 30)), "no minute in this window = no open = no entry");
  t(openSide1051("up", 100.5, 100) === true && openSide1051("down", 99.5, 100) === true, "a long over the open / a short under it must pass");
  t(openSide1051("up", 99.5, 100) === false && openSide1051("down", 100.5, 100) === false, "a long under the open / a short over it must wait");
  t(openSide1051("up", 100, 100) === false && openSide1051("down", 100, 100) === false, "exactly at the open is not past it");
  t(openSide1051("up", 100.5, NaN) === false && openSide1051("down", 99.5, NaN) === false, "no open = no entry");
}
// the 5m books use it; the XRP 15m on Kalshi (and every 15m book) do not
t(/import \{ xrpRead961, openSide1051, win5Open1051 \} from "\.\/xrp5m961";/.test(P) && /if \(r && r\.side && openSide1051\(r\.side, spot, win5Open1051\(bs, now\)\)/.test(P), "the BTC / ETH / XRP 5m paper books do not check her side of the 5m open");
t((P.match(/openSide1051\(/g) || []).length === 1 && /r = xrpRead961\(bs, ethBands682\(bs as any\), spot, now\) as any; \/\/ her XRP lane's own push/.test(P), "the XRP 15m on Kalshi must stay untouched (her 'not for the 15')");
t(/const r0 = xrpRead961\(bs, ethBands682\(bs as any\), spot, now\);\n    const o51 = win5Open1051\(bs, now\); const r: ReturnType<typeof xrpRead961> = [^\n]*?"side" in r0 && !openSide1051\(r0\.side, spot, o51\)/.test(X), "her XRP 5m lane does not check her side of the 5m open");
for (const f of ["recon.ts", "bandlock.ts", "engine.ts"]) t(!fs.readFileSync(path.join(root, "src/lib/desk", f), "utf8").includes("openSide1051"), f + " (her 15m books) must not use the 5m open rule");
console.log(ok ? "FIVE MIN OPEN SIDE 1051 TEST ✓ - her 5m books (BTC / ETH / XRP 5m paper + her XRP 5m lane) enter only with price past the 5m window's open her way, else keep watching; the XRP 15m on Kalshi and every 15m book are untouched" : "FIVE MIN OPEN SIDE 1051 TEST: FAIL");
process.exit(ok ? 0 : 1);
