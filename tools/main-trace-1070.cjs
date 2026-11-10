#!/usr/bin/env node
// fix1070 EVERY SKIP HAS A WRITTEN REASON - LOG ONLY (Love Nov 10 2026 11:14 AM PT: "fix the no reason for refusal please. make sure every trade has one." + "yes. please build it.") - TEST: no network, no order.
// Proves the tracer (1) only writes a log line - it assigns nothing her decisions read, (2) names each stop: no setup, refused in the read, booked, ask out of bounds, 1.5x floor, book() left without booking,
// (3) flags a 3 s+ gap between her looks, and (4) her decision lines around it are still there word for word.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8"), X = fs.readFileSync(path.join(root, "src/lib/desk/xrp15k-live.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("MAIN TRACE 1070 TEST: FAIL - " + m); } };
const line = R.split("\n").find((l) => l.includes("const G1070 = globalThis as any")); if (!line) { console.log("MAIN TRACE 1070 TEST: FAIL - the tracer is not in recon.ts"); process.exit(1); }
const code = line.slice(0, line.indexOf("// fix1070"));
t(/^\s*try \{/.test(code) && /\} catch \{\}\s*$/.test(code), "the tracer is not wrapped in try / catch");
t(!/\b(firstTog|lookT|lookP|firstT|changed|rows|m|spot)\s*=[^=]/.test(code.replace(/const [a-z]\w*1070[^;]*;/g, "")), "the tracer assigns to something her decisions read");
t(!/\bbook\("|skipLog\(|writeFileSync|bandLockCheck464\(/.test(code), "the tracer calls something that books, logs a skip or checks the door itself");
t(R.includes('  const pre1070 = firstTog; // fix1070 LOG ONLY'), "the capture line is missing");
t(R.includes('  if (firstTog && book("recon-tog", firstTog, lookP && !lookT && firstTog === firstT ? lookP.ask : undefined)) changed = true;'), "main's book line changed");
t(R.includes('  log479("recon-tog", firstTog); // fix479'), "her fix479 skip log line changed");
const js = ts.transpileModule("function run(G, id, rows, m, spot, pre1070, firstTog, why479, D, appendFileSync) { const globalThis = G;\n" + code + "\n}", { compilerOptions: { target: 99 } }).outputText;
const run = new Function(js + "; return run;")();
const G = {}; let out = []; const app = (f, s) => out.push([f, JSON.parse(s)]); const D = (n) => n; const m = { ticker: "KXGOLD15M-T", yesAsk: 0.45, noAsk: 0.6 };
const real = Date.now; let clock = 1000000; Date.now = () => clock;
const step = (ms, id, rows, mm, pre, ft, why) => { clock += ms; out = []; run(G, id, rows, mm, 4026.59, pre, ft, why || (() => ""), D, app); return out.length ? out[0][1] : null; };
const dn = { side: "down", label: "Break below 5m PP" };
let r = step(0, "gold", [], m, null, null); t(r && /^NO SETUP/.test(r.status) && r.call === null, "no setup was not written");
r = step(1100, "gold", [], m, dn, null, () => "THE PINK in the read: an unbroken pink"); t(r && /^READ REFUSED: THE PINK in the read/.test(r.status), "a read refusal did not carry its reason");
r = step(1100, "gold", [], m, dn, dn); t(r && /book\(\) left without booking \(no main row this window\)/.test(r.status) && r.ask === 0.6, "door ok + no booking was not written (her 11:00:37 AM gold case)");
r = step(1100, "gold", [{ ticker: "KXGOLD15M-T", lane: "recon-tog", side: "down", label: "Break below 5m PP", at: "x", result: "open" }], m, dn, dn); t(r && /^BOOKED: main holds this call/.test(r.status), "a booked call was not written");
r = step(1100, "gold", [], { ticker: "KXGOLD15M-T", yesAsk: 0.3, noAsk: 0.72 }, dn, dn); t(r && /under her 1\.5x floor \(1\.39x at 72c\)/.test(r.status), "the 1.5x floor was not named");
r = step(1100, "gold", [], { ticker: "KXGOLD15M-T", yesAsk: 0.99, noAsk: 0.01 }, dn, dn); t(r && /ask is out of bounds/.test(r.status), "an out of bounds ask was not named");
r = step(1100, "gold", [], { ticker: "KXGOLD15M-T", yesAsk: 0.99, noAsk: 0.01 }, dn, dn); t(r === null, "an unchanged status was written again inside 10 s");
r = step(200, "gold", [], { ticker: "KXGOLD15M-T", yesAsk: 0.99, noAsk: 0.01 }, dn, dn); t(r === null, "she wrote more than once a second");
r = step(3500, "gold", [], { ticker: "KXGOLD15M-T", yesAsk: 0.99, noAsk: 0.01 }, dn, dn); t(r && r.slow === true && r.msSinceLastLook === 3500, "a 3.5 s gap between her looks was not flagged");
r = step(0, "btc", [], m, null, null); t(r && r.asset === "btc", "BTC does not keep its own trace");
t(out.every(([f]) => f === "main-trace-1070.jsonl"), "the tracer wrote somewhere else");
let threw = false; try { run(G, "gold", null, null, 1, dn, dn, () => "", D, app); } catch { threw = true; } t(!threw, "a broken input made the tracer throw into her loop");
Date.now = real;
const xl = X.split("\n").find((l) => l.includes('xrp15-board-1070.jsonl')); t(!!xl && /^\s*try \{ appendFileSync\(/.test(xl) && /\} catch \{\} \/\/ fix1070 LOG ONLY/.test(xl), "the XRP board line is missing or not log-only");
t(X.includes('  return r.side === side && r.label === label ? "" : "XRP 15m setup changed before the order";'), "the XRP last line's decision changed");
console.log(ok ? "MAIN TRACE 1070 TEST: PASS ✓ log only - every stop is named (no setup, read refused, booked, ask, 1.5x floor, book() left), slow looks flagged, her decision lines unchanged" : "");
process.exit(ok ? 0 : 1);
