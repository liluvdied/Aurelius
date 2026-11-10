#!/usr/bin/env node
// fix1029 ADD-ONS FROM HER BOXES AT HER RUNG - test (read-only on her desk: runs in a temp folder, no network, no order).
// Love Sat Nov 7 2026 9:10 PM PT: "IT IS NOT GOING ON AT THE MULTIPLE I SAID." + "it CANNNOTTT ENTER AT THE SAME PRICE AS THE INITIAL ENTRY" + Nov 8 12:49 AM card: "Automatic from my boxes".
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), Module = require("module");
const ROOT = path.resolve(process.env.AUR_ROOT || path.join(__dirname, "..")), DK = path.join(ROOT, "src/lib/desk");
const ts = require(path.join(ROOT, "node_modules/typescript"));
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("✗ " + m); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "t1029-")); fs.mkdirSync(path.join(tmp, "data"));
function load(name, src, deps) { const js = ts.transpileModule(src, { compilerOptions: { module: 1, target: 99 } }).outputText, p = path.join(tmp, name + ".js"); fs.writeFileSync(p, js); const m = new Module(p); m.filename = p; m.paths = Module._nodeModulePaths(tmp); const rq = m.require.bind(m); m.require = (x) => (deps[x] !== undefined ? deps[x] : rq(x)); m._compile(js, p); return m.exports; }
const X = load("xrp", fs.readFileSync(path.join(DK, "xrp5m961.ts"), "utf8"), { "./ethbook": { ethBands682: () => [] } });
const R = X.rung1029, T0 = 1_800_000_000_000;
// 1. her rung, pure
let g = R(0.27, 2.8, 0.30, T0, T0 + 60000); t(!g.go && g.passed, "entry 27c (3.7x): the 2.8x box is skipped for good (tonight 9:05:25 PM: add-on 1 went at 30c 0.6 s after a 27c entry) " + JSON.stringify(g));
g = R(0.32, 2.8, 0.33, T0, T0 + 2000); t(!g.go && g.passed, "entry 32c (3.1x): no 2.8x add-on (tonight 8:46:02 PM: add-on 1 went at 33c 2 s after a 32c entry)");
g = R(0.27, 4.2, 0.23, T0, T0 + 4999); t(!g.go && !g.passed && /5 s/.test(g.why), "never in the first 5 s after the entry");
g = R(0.27, 4.2, 0.23, T0, T0 + 5000); t(g.go && g.cap === 0.23, "4.2x box above a 27c entry: ask 23c at 5 s goes, capped 23c " + JSON.stringify(g));
g = R(0.27, 4.2, 0.24, T0, T0 + 9000); t(!g.go, "ask 24c is not 4.2x yet");
g = R(0.24, 4.2, 0.23, T0, T0 + 9000); t(g.go && g.cap === 0.23 && g.cap < 0.24, "cap strictly better than the entry");
g = R(0.238, 4.2, 0.23, T0, T0 + 9000); t(!g.go && g.passed, "entry 23.8c is already 4.20x: the 4.2x box is passed");
g = R(0.245, 4.2, 0.23, T0, T0 + 9000); t(g.go && g.cap === 0.23, "entry 24.5c (4.08x), 4.2x: cap 23c, never 24c");
g = R(0.24, 4.17, 0.24, T0, T0 + 9000); t(!g.go, "a box under / at the entry multiple never buys at the entry price");
for (const e of [0.05, 0.1, 0.2, 0.27, 0.33, 0.4, 0.5, 0.62, 0.66]) for (const m of [1.5, 2.8, 3.8, 4.2, 8.8, 10]) for (let a = 0.03; a < 0.7; a += 0.01) { const q = R(e, m, Math.round(a * 100) / 100, T0, T0 + 6000); if (q.go) { t(q.cap < e - 1e-9 && q.cap <= 1 / m + 1e-9 && m > 1 / e, `sweep: e ${e} m ${m} a ${a.toFixed(2)} -> cap ${q.cap}`); } }
// 2. the XRP 5m lane takes her boxes (fake Polymarket, temp desk folder)
process.chdir(tmp);
fs.writeFileSync("data/addon-settings.json", JSON.stringify({ addOn1: { on: true, dollars: 2 }, addOn2: { on: true, dollars: 3, mult: 4.2 }, addOn3: { on: true, dollars: 1, mult: 10 } }));
fs.writeFileSync("data/live-switch.json", JSON.stringify({ addOn: { maxAsk: 0.357 } }));
fs.writeFileSync("data/xrp5m-961-cfg.json", JSON.stringify({ on: true, dollars: 1, maxAsk: 0.66 }));
const bx = X.boxes1029(); t(bx[0].mult > 2.79 && bx[0].mult < 2.81 && bx[1].mult === 4.2 && bx[2].mult === 10 && bx[1].dollars === 3, "boxes read from her files: " + JSON.stringify(bx));
fs.writeFileSync("data/addon-settings.json", JSON.stringify({ addOn1: { on: true, dollars: 9 }, addOn2: { on: true, dollars: 3, mult: 6 }, addOn3: { on: false, dollars: 1, mult: 10 } }));
const bx2 = X.boxes1029(); t(bx2[0].dollars === 5 && bx2[1].mult === 6 && bx2[2].on === false, "she changes a box -> read fresh; $5 an order cap stays: " + JSON.stringify(bx2));
fs.writeFileSync("data/addon-settings.json", JSON.stringify({ addOn1: { on: true, dollars: 2 }, addOn2: { on: true, dollars: 3, mult: 4.2 }, addOn3: { on: true, dollars: 1, mult: 10 } }));
globalThis.__xrp961Bars = { at: 9e15, m: new Map([[1, { t: 1, o: 1, h: 1, l: 1, c: 1, v: 1 }]]) }; /* fix1043: the trigger add-on reads the lane's bars - one flat bar = no setup, offline */ const start = Math.floor(T0 / 300000) * 300 + 300, id = `xrp5m-${start}`, slug = "xrp-updown-5m-test";
fs.writeFileSync("data/xrp5m-961-book.json", JSON.stringify({ rows: [{ id, slug, at: new Date(start * 1000 + 20000).toISOString(), side: "up", label: "t", spot: 1, ask: 0.4, live: "bought 2.5 @ 0.4", closesAt: "" }], seen: { [id]: start * 1000 + 20000 } }));
let ask = 0.36; const buys = [];
const pm = { bookTop: async () => ({ ask, bid: Math.round((1 - ask) * 100) / 100 }), buySlug: async (side, sl, dollars, cap, tg, tag) => { buys.push({ side, sl, dollars, cap, tag, ask }); return ask <= cap + 1e-9 ? { filled: dollars / ask, price: ask } : null; } };
(async () => {
  const at = (s) => start * 1000 + 20000 + s * 1000;
  await X.xrpTick961(at(10), pm); t(buys.length === 0, "36c is not her 2.8x (35c) - no add-on");
  ask = 0.35; await X.xrpTick961(at(2.9) + 100000, pm);
  globalThis.__xrp961At = 0; await X.xrpTick961(at(14), pm); t(buys.length === 1 && buys[0].tag === ":add1029add1" && buys[0].side === "up" && buys[0].cap === 0.35 && buys[0].dollars === 2, "box 1: $2 at 35c, same side, own claim: " + JSON.stringify(buys));
  ask = 0.23; globalThis.__xrp961At = 0; await X.xrpTick961(at(30), pm); t(buys.length === 1, "fix1043: box 2 no longer buys at its 4.2x multiple - only on a genuine entry trigger (Love Nov 9 9:30 AM)");
  ask = 0.1; globalThis.__xrp961At = 0; await X.xrpTick961(at(50), pm); t(buys.length === 1, "fix1043: box 3 no longer buys at its 10x multiple");
  ask = 0.05; globalThis.__xrp961At = 0; await X.xrpTick961(at(70), pm); t(buys.length === 1, "fix1043: only the 1 default add-on at its multiple - box 1 fills once a window");
  t(buys.every((b) => b.side === "up" && b.cap < 0.4), "zero opposite-side, zero at or worse than the 40c entry");
  // under 5 s and entry past the rung
  const id2 = `xrp5m-${start + 300}`; buys.length = 0; X.xrpSummary961(); globalThis.__xrp961 = undefined;
  fs.writeFileSync("data/xrp5m-961-book.json", JSON.stringify({ rows: [{ id: id2, slug, at: new Date((start + 300) * 1000 + 20000).toISOString(), side: "down", label: "t", spot: 1, ask: 0.3, live: "bought 3 @ 0.3", closesAt: "" }], seen: { [id2]: 1 } }));
  ask = 0.29; globalThis.__xrp961At = 0; await X.xrpTick961((start + 300) * 1000 + 22000, pm); t(buys.length === 0, "never in the first 5 s");
  ask = 0.29; globalThis.__xrp961At = 0; await X.xrpTick961((start + 300) * 1000 + 40000, pm); t(buys.length === 0, "entry 30c (3.3x): box 1 at 2.8x skipped for good - never at or worse than the entry");
  ask = 0.23; globalThis.__xrp961At = 0; await X.xrpTick961((start + 300) * 1000 + 60000, pm); t(buys.length === 0, "fix1043: box 2 never fires at a multiple, even once box 1 was passed: " + JSON.stringify(buys));
  ask = 0.23; globalThis.__xrp961At = 0; await X.xrpTick961((start + 300) * 1000 + 250000, pm); t(buys.length === 1 || buys.every((b) => b.tag !== ":add1029add2" || b === buys[0]), "not in the last minute");
  // 3. the wire and main
  const src = (f) => fs.readFileSync(path.join(DK, f), "utf8");
  const pl = src("poly-live.server.ts"); t(/const claimKey = slug \+ claimTag/.test(pl) && /claimWindow\(claimKey\)/.test(pl) && /hourSlugs\(claimTag\)\.includes\(claimKey\)/.test(pl) && /claimTag \? Math\.min\(Math\.floor\(maxAsk \* 100 \+ 1e-9\) \/ 100/.test(pl) && /fix1039/.test(pl), "Polymarket: an add-on claims its own key and never pays over its cap; the entry is capped too (fix1039)");
  const kl = src("kalshi-live.server.ts"); t(/async function addOnBuy600\(ticker, side, dollars, maxAsk, kind953 = "addon", entry1029 = 0\)/.test(kl) && /maxAsk = Math\.min\(Number\(maxAsk\) \|\| 0, \(Math\.ceil\(e1029 \* 100 - 1e-9\) - 1\) \/ 100\)/.test(kl), "Kalshi wire: an add-on with her entry price is capped a whole cent better than it");
  const en = src("engine.ts"); t((en.match(/r1g1029\.go|r38g1029\.go|r3g1029\.go/g) || []).length === 3 && (en.match(/, true, (aoTwin \? 0 : )?e1029\.px/g) || []).length === 4 /* fix1043: + her trigger add-on */ && (en.match(/if \(false \/\* fix1043/g) || []).length === 2, "main / rej: add-on 1 / 2 / 3 each need her rung and carry her entry price to the wire");
  t(/aoTwin \|\| r1g1029\.go/.test(en) && /aoTwin \? aoCap :/.test(en), "the delayed twin's add-on is untouched");
  t(!/\b(4\.4|8\.8)\b\s*\/\*|0\.2273|0\.1136(?!\s*-)/.test(en.split("fix1029").slice(1).join("")), "no 4.4x / 8.8x cap in the new lines");
  console.log(ok ? "ADD-ONS FROM HER BOXES 1029 TEST ✓ - every add-on from her boxes only at a multiple higher than her entry, never at or worse than her entry, never in its first 5 s, same side; the XRP 5m lane takes her boxes" : "ADD-ONS FROM HER BOXES 1029 TEST ✗");
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.log("ADD-ONS FROM HER BOXES 1029 TEST ✗ " + e.stack); process.exit(1); });
