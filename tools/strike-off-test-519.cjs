#!/usr/bin/env node
// fix519 test: the open-second difference is measured, carried, and deducted; the settle side maps to Kalshi's result alone.
// Love Oct 30 2026 11:14 AM PT: "do not score them by any other metric than the kalshi settlement going forward."
const fs = require("fs"), path = require("path"), ts = require("typescript");
const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "src/lib/desk/engine.ts"), "utf8");
const grab = (n) => {
  const i = src.indexOf("function " + n + "(");
  if (i < 0) { console.log("FAIL - " + n + " missing"); process.exit(1); }
  let d = 0, j = src.indexOf("{", src.indexOf(")", i));
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) { j = k + 1; break; } } }
  return src.slice(i, j);
};
// appendFileSync/join are used inside offCapture519 - give it harmless stand-ins
const H = new Function("appendFileSync", "join", "process",
  ts.transpileModule(grab("offCapture519") + grab("chartStrike519"), { compilerOptions: { target: 99 } }).outputText + "; return { offCapture519, chartStrike519 };")(
  () => {}, (...a) => a.join("/"), { cwd: () => "." });
let ok = true;
const T = (cond, msg) => { if (!cond) { ok = false; console.log("  FAIL - " + msg); } };
delete globalThis.__ktOff519;
// 1. open second measured: chart 77144.49 vs target 77116.70 -> off +27.79
H.offCapture519({ market: { ticker: "KXBTC15M-TESTA" }, target: 77116.70, secondsLeft: 890, spot: 77144.49 });
T(Math.abs(globalThis.__ktOff519.btc.off - 27.79) < 0.001, "the open-second difference was not measured (+27.79 expected)");
// 2. the strike read in chart terms
const adj = H.chartStrike519({ market: { ticker: "KXBTC15M-TESTA" } }, 77116.70);
T(Math.abs(adj - 77144.49) < 0.001, "the strike was not read in chart terms (strike + off)");
// 3. a late first sight (mid-window) does not fake a measurement - it carries the last one
H.offCapture519({ market: { ticker: "KXBTC15M-TESTB" }, target: 77200.00, secondsLeft: 400, spot: 77300.00 });
T(Math.abs(globalThis.__ktOff519.btc.off - 27.79) < 0.001, "a mid-window first sight should carry the last measured difference, not invent one");
T(globalThis.__ktOff519.btc.measured === false, "a carried difference must say measured:false");
// 4. gold independent of btc
H.offCapture519({ market: { ticker: "KXGOLD15M-TESTC" }, target: 3889.32, secondsLeft: 893, spot: 3889.39 });
T(Math.abs(globalThis.__ktOff519.gold.off - 0.07) < 0.001, "gold's difference is its own");
// 5. no registry entry for the ticker -> the raw strike stands
const raw = H.chartStrike519({ market: { ticker: "KXBTC15M-OTHER" } }, 500);
T(raw === 500, "an unmeasured window must keep the raw strike");
// 6. the settle mapping is Kalshi's result alone (read straight from the engine source)
T(src.includes('const win = trade.side === "up" ? res519 === "yes" : res519 === "no";'), "the settle side is not mapped to Kalshi's yes/no");
T(!src.includes("settleSide(trade.side, spot, target)"), "the chart-based settle is still in settleOne");
console.log(ok ? "STRIKE-OFF 519 ✓ - the difference is deducted and Kalshi alone scores her." : "STRIKE-OFF 519 FAILED");
process.exit(ok ? 0 : 1);
