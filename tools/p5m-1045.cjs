#!/usr/bin/env node
// fix1045 5M PAPER BOOKS · NEW BRAIN test (temp folder, no network, no order).
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("P5M 1045 TEST: FAIL - " + m); } };
const S = fs.readFileSync(path.join(root, "src/lib/desk/p5m1045.ts"), "utf8"), X = fs.readFileSync(path.join(root, "src/lib/desk/xrp5m961.ts"), "utf8");
t(!/buySlug|addOnBuy|placeOrder|kalshi-live/.test(S) && /pm\.bookTop/.test(S), "the 5m paper books must only READ Polymarket's order book - never an order route");
t(/btc: \{ prod: "BTC-USD", push: 5 \}, eth: \{ prod: "ETH-USD", push: 0\.25 \}, xrp: \{ prod: "XRP-USD", push: 0\.00025 \}/.test(S) && /STAKE1045 = 20, FLOOR1045 = 0\.66/.test(S), "her push / $20 / 1.5x floor numbers");
t(/pushIn\?: \{ band: number; pink: number; wick: number \}/.test(X) && /\(pushIn \|\| PUSH1004\)\.pink : \(pushIn \|\| PUSH1004\)\.band/.test(X), "the read does not take the coin's push (her XRP lane must keep its own when none is given)");
const PR = fs.readFileSync(path.join(root, "src/lib/desk/paperrows.ts"), "utf8"), AB = fs.readFileSync(path.join(root, "src/lib/desk/allbooks1002.ts"), "utf8"), E = fs.readFileSync(path.join(root, "src/lib/desk/engine.ts"), "utf8");
for (const c of ["btc", "eth", "xrp", "xrp15k"]) { t(PR.includes(`file: "p5m-1045-${c}.json"`), c + ": no card"); t(AB.includes(`file: "p5m-1045-${c}.json"`), c + ": not in her book tables"); }
const APP = fs.readFileSync(path.join(root, "src/components/desk/app.tsx"), "utf8"), GR = fs.readFileSync(path.join(root, "src/components/desk/book-grid.tsx"), "utf8"), FN = fs.readFileSync(path.join(root, "src/lib/desk/fns.ts"), "utf8");
{ const SLc = fs.readFileSync(path.join(root, "src/components/desk/schedule-live.tsx"), "utf8"), BGc = fs.readFileSync(path.join(root, "src/components/desk/book-grid.tsx"), "utf8");
  t(/getBookGrid1046\(\{ data: \{ books: GRID_BOOKS1046\.map/.test(SLc) && /all1046\.map\(\(x\) => x\.kind === "paper"/.test(SLc) && /\{nm1046\(x\.t\.gk\)\}/.test(SLc) && /NEW SCHEDULE 🗓️ · LIVE ONLY · KALSHI/.test(SLc), "fix1046c: NEW SCHEDULE must list every book's trades (paper too) labelled by book, same box");
  t(/onClick=\{\(\) => openBook1046\(x\.t\.gk\)\}/.test(SLc) && /addEventListener\("open-book-1046"/.test(BGc) && /data-grid1046/.test(BGc), "fix1046c: a tap on a trade must open that book's record in her cards"); }
t(/<ScheduleLiveCard \/>[^\n]*\n\s*<BookGrid1046 heart=\{Heart1047\} \/>/.test(APP), "her book grid is not right under NEW SCHEDULE");
for (const k of ["recon-tog", "recon-rej", "eth2872", "xrp5m961", "p5m-btc", "p5m-xrp", "p5m-xrp15k"]) t(GR.includes(`key: "${k}"`), "the grid is missing " + k);
t(/minmax\(118px, 1fr\)/.test(GR) && /setOpen\(open === b\.key/.test(GR), "the grid is not a little table / a card does not open its trades");
t(/void BOOKS385; \/\/ fix1046/.test(FN), "NEW SCHEDULE still shows only the six main-family books");
t(/import\("\.\/p5m1045"\)\.then\(\(m\) => m\.p5mTick1045\(\)\)/.test(E), "the engine does not run the 5m paper books");
// behaviour: entry at the real ask under her floor, her TP, the close
const ts = require(path.join(root, "node_modules/typescript")), out = fs.mkdtempSync(path.join(os.tmpdir(), "p5m-"));
fs.writeFileSync(path.join(out, "p5m1045.js"), ts.transpileModule(S, { compilerOptions: { module: 1, target: 99 } }).outputText);
{ const hx = (n) => { const i = X.indexOf("export function " + n + "("); return i < 0 ? "" : X.slice(i, X.indexOf("\n", i)).replace(/^export /, ""); }; // fix1051: her real 5m-open helpers, not a stand-in
  fs.writeFileSync(path.join(out, "xrp5m961.js"), "exports.xrpRead961=(bs,L,spot,now,p,open)=>{globalThis.__push=p;return open===undefined || (open>0 && spot>open) ? {side:'up',label:'Rejected up off -1σ'} : {why:'wrong side'};};\n" + ts.transpileModule(hx("win5Open1051") + "\n" + hx("openSide1051") + "\nexports.win5Open1051 = win5Open1051; exports.openSide1051 = openSide1051;", { compilerOptions: { module: 1, target: 99 } }).outputText); }
fs.writeFileSync(path.join(out, "ethbook.js"), "exports.ethBands682=()=>[];");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "p5md-")); fs.mkdirSync(path.join(dir, "data")); process.chdir(dir);
const M = require(path.join(out, "p5m1045.js")), G = globalThis;
const now = Math.floor(Date.now() / 300000) * 300000 + 30000, f = now / 1000 - 30;
const bars = []; for (let x = f - 3000; x <= f; x += 60) bars.push({ t: x, o: 100, h: 101, l: 99, c: 100, v: 1 });
bars[bars.length - 1] = { ...bars[bars.length - 1], c: 100.5 }; // fix1051: this 5m window opened at 100 and price is 100.5 - her side for the long
G.__p5m1045Bars = { btc: { at: Date.now(), m: new Map(bars.map((b) => [b.t, b])) }, eth: { at: Date.now(), m: new Map() }, xrp: { at: Date.now(), m: new Map() } };
let top = { bid: 0.6, ask: 0.7 };
const pm = { bookTop: async (s) => (s.startsWith("btc-updown-5m-") ? top : null) };
const rd = () => { try { return JSON.parse(fs.readFileSync("data/p5m-1045-btc.json", "utf8")); } catch { return { rows: [] }; } };
(async () => {
  await M.p5mTick1045(now, pm); let b = rd();
  t(b.rows.length === 0, "an ask of 70c (under her 1.5x) was booked");
  t(G.__push && G.__push.band === 5, "BTC read did not get her $5 push");
  { const fb = bars[bars.length - 1]; G.__p5m1045Bars.btc.m.set(fb.t, { ...fb, c: 99.5 }); top = { bid: 0.39, ask: 0.4 }; G.__p5m1045At = 0; await M.p5mTick1045(now + 1500, pm); b = rd();
    t(b.rows.length === 0, "fix1051: a long with price UNDER this 5m window's open (99.5 < 100) was booked - her 5m books enter only on her side of the 5m open"); G.__p5m1045Bars.btc.m.set(fb.t, fb); }
  top = { bid: 0.39, ask: 0.4 }; G.__p5m1045At = 0; await M.p5mTick1045(now + 3000, pm); b = rd();
  t(b.rows.length === 1 && b.rows[0].ask === 0.4 && b.rows[0].stake === 20 && b.rows[0].result === "open" && b.rows[0].side === "up", "no $20 paper entry at the real 40c ask: " + JSON.stringify(b.rows));
  G.__p5m1045At = 0; await M.p5mTick1045(now + 6000, pm); b = rd(); t(b.rows.length === 1, "a second entry in the same window");
  // XRP 15m on Kalshi: entry at the real Kalshi ask, settled on Kalshi's own result
  G.__p5m1045Bars.xrp = { at: Date.now(), m: new Map(bars.map((b) => [b.t, { ...b, o: 1, h: 1.01, l: 0.99, c: 1 }])) };
  let km1 = { yesAsk: 0.45, noAsk: 0.57, yesBid: 0.43, noBid: 0.55, result: "" };
  const km = { fifteenTicker: () => "KXXRP15M-TEST", fetchMarket: async () => km1 };
  const n15 = Math.floor(Date.now() / 900000) * 900000 + 60000; G.__p5m1045At = 0; await M.p5mTick1045(n15, pm, km);
  let k = (() => { try { return JSON.parse(fs.readFileSync("data/p5m-1045-xrp15k.json", "utf8")); } catch { return { rows: [] }; } })();
  t(k.rows.length === 1 && k.rows[0].ticker === "KXXRP15M-TEST" && k.rows[0].ask === 0.45 && k.rows[0].side === "up", "XRP 15m Kalshi paper entry at the real 45c ask: " + JSON.stringify(k.rows));
  km1 = { ...km1, result: "yes" }; G.__p5m1045At = 0; await M.p5mTick1045(n15 + 3000, pm, km); k = JSON.parse(fs.readFileSync("data/p5m-1045-xrp15k.json", "utf8"));
  t(k.rows[0].result === "win" && /Kalshi result/.test(k.rows[0].exit), "XRP 15m not settled on Kalshi's own result: " + JSON.stringify(k.rows[0]));
  const r = { ask: 0.4, result: "open" }; M.tp1045(r, 0.86); t(r.half && r.result === "open", "half at 75% of the max (85c) did not sell half"); M.tp1045(r, 0.94); t(r.result === "sold" && Math.abs(r.pnl - (0.86 * 25 + 0.94 * 25 - 20)) < 0.01, "rest at 90% (94c): " + JSON.stringify(r));
  const r2 = M.settle1045({ ask: 0.5, result: "open" }, false); t(r2.result === "loss" && r2.pnl === -20, "a held loss at the close");
  const r3 = M.settle1045(M.tp1045({ ask: 0.5, result: "open" }, 0.875), true); t(r3.result === "win" && Math.abs(r3.pnl - (0.875 * 20 + 20 - 20)) < 0.01, "half at 75% then the rest wins at the close: " + JSON.stringify(r3));
  console.log(ok ? "P5M 1045 TEST ✓ - BTC / ETH / XRP 5m PAPER books + XRP 15m on Kalshi (her XRP brain, real Kalshi ask, Kalshi's own result) on the new brain with her push ($5 / 25c / 0.00025), $20 at the real ask under her 1.5x floor, one a window, her TP (half 75% / rest 90% / close), cards + tables + engine; never an order" : "P5M 1045 TEST: FAIL");
  process.exit(ok ? 0 : 1);
})();
