#!/usr/bin/env node
// fix1044 LIVE WIRE + WTF BOOK test (read-only on her desk; temp folder, no network, no order).
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("LIVE WIRE 1044 TEST: FAIL - " + m); } };
const A = fs.readFileSync(path.join(root, "src/components/desk/app.tsx"), "utf8"), E = fs.readFileSync(path.join(root, "src/lib/desk/engine.ts"), "utf8");
const LWs = fs.readFileSync(path.join(root, "src/lib/desk/livewire1044.ts"), "utf8"), C = fs.readFileSync(path.join(root, "src/components/desk/live-wire.tsx"), "utf8");
// 1. the tab, its render, its 1 s price refresh
t(/label="⚡ LIVE WIRE"/.test(A) && /bookTab === "wire" \? <LiveWire1044 snap=\{snap\} \/>/.test(A) && /bookTab === "wire" \? 1000/.test(A), "the LIVE WIRE tab / its render / its 1 s refresh is missing");
t(/getLiveWire1044\(\), refetchInterval: 2000/.test(C) && /addWtf1044\(\{ data: \{ id, note \} \}\)/.test(C), "the tab does not read every book's trades / has no WTF tap");
// 2. log only: the module never reaches an order route
t(!/addOnBuy|placeOrder|buySlug|takeSide|sellSide|kalshi-live|live-switch\.json/.test(LWs), "LIVE WIRE / WTF BOOK touches an order route or her switch");
t(/import\("\.\/livewire1044"\)\.then\(\(m\) => m\.wtfTick1044\(\)\)/.test(E), "the engine does not run the WTF auto-log");
// 3. behaviour: every book's rows, newest first; auto WTF only on HER books and only for a real rule; her tap logs with a note
const ts = require(path.join(root, "node_modules/typescript")), out = fs.mkdtempSync(path.join(os.tmpdir(), "lw1044-"));
const src = LWs.replace('import { createServerFn } from "@tanstack/react-start";', 'const createServerFn = (_o: any) => ({ handler: (f: any) => f, validator: (_v: any) => ({ handler: (f: any) => f }) });');
fs.writeFileSync(path.join(out, "livewire1044.js"), ts.transpileModule(src, { compilerOptions: { module: 1, target: 99 } }).outputText);
fs.writeFileSync(path.join(out, "paperrows.js"), "exports.paperBookRows721=()=>[{id:'p1',book:'mom704',at:new Date(Date.now()-60000).toISOString(),asset:'btc',ticker:'KXBTC15M-X',side:'up',setup:'momentum',ask:0.5,stake:20,result:'open'}];");
fs.writeFileSync(path.join(out, "bandlock.js"), "exports.bandLockCheck=(b,a,s)=>s==='down'?{ok:false,reason:'HER WALL (fix429): test wall'}:{ok:true};exports.herEntry951=()=>'';");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lw1044d-")); fs.mkdirSync(path.join(dir, "data")); process.chdir(dir);
const now = Date.now(), iso = (ms) => new Date(now - ms).toISOString();
fs.writeFileSync("data/night-book.json", JSON.stringify([{ id: "n1", book: "brick", at: iso(120000), asset: "btc", ticker: "KXBTC15M-X", side: "up", setup: "BRICK", ask: 0.6, stake: 30, result: "win", pnl: 12 }]));
fs.writeFileSync("data/xrp5m-961-book.json", JSON.stringify({ rows: [{ id: "xrp5m-1", slug: "xrp-updown-5m-x", at: iso(30000), side: "up", label: "Rejected up off -1σ", ask: 0.5, live: "bought 2 @ 0.5", closesAt: new Date(now + 120000).toISOString() }, { id: "xrp5m-2", slug: "xrp-updown-5m-y", at: iso(20000), side: "up", label: "x", ask: 0.9, live: "skipped: ask 0.9 over her 66c" }] }));
fs.writeFileSync("data/grok-og.json", JSON.stringify([{ id: "g1", lane: "recon-tog", at: iso(5000), asset: "btc", ticker: "KXBTC15M-X", side: "down", label: "Rejected down off +1σ", ask: 0.45, stake: 20, result: "open" }, { id: "g2", lane: "ogp5-inv", at: iso(4000), asset: "btc", ticker: "KXBTC15M-X", side: "down", label: "inverse", ask: 0.4, stake: 20, result: "open" }, { id: "g3", lane: "recon-rej", at: iso(3000), asset: "btc", ticker: "KXBTC15M-X", side: "up", label: "Rejected up off -1σ", ask: 0.5, stake: 20, result: "open" }]));
fs.writeFileSync("data/eth2-live-872.jsonl", [
  { id: "KXETH15M-X:copy", at: iso(21000), action: "bought", side: "down", px: 0.5, filled: 4 },
  { id: "KXETH15M-X:copy", at: iso(19000), action: "add-on", px: 0.25, filled: 4 },
  { id: "KXETH15M-X:copy", at: iso(18000), action: "sold half", out: { filled: 4, payout: 2.8 } },
].map(JSON.stringify).join("\n"));
fs.writeFileSync("data/perplexities-book.json", JSON.stringify({ rows: [{
  id: "px1", slug: "xrp-updown-5m-x", at: iso(31000), side: "down", ask: 0.5,
  live: "PAPER bought 40 @ 0.5", closesAt: new Date(now + 120000).toISOString(),
}] }));
const M = require(path.join(out, "livewire1044.js"));
(async () => {
  const rows = await M.wireRows1044(24);
  t(rows.length === 8 && rows[0].id === "g3" && rows.some((r) => r.book === "xrp5m961" && r.result === "open" && r.stake === 1) && !rows.some((r) => r.id === "xrp5m961:xrp5m-2") && rows.map((r) => r.book).includes("mom704") && rows.map((r) => r.book).includes("brick"), "LIVE WIRE does not show every book newest first: " + JSON.stringify(rows.map((r) => r.id)));
  t(rows.find((r) => r.id === "g1").setup === "Rejected down off +1σ" && rows.find((r) => r.id === "n1").pnl === 12, "a row lost its setup / result");
  const copy = rows.find((r) => r.book === "eth2872");
  t(copy.real && copy.contracts === 4 && copy.stake === 3 && copy.proceeds === 2.8, "copy fill, add-on and sale did not reconcile");
  let quoteReads = 0;
  await M.markWire1044(rows, async () => { quoteReads++; return { up: 0.61, down: 0.36 }; });
  t(rows.find((r) => r.book === "xrp5m961").lastBid === 0.61 && rows.find((r) => r.book === "PERPLEXITIES").lastBid === 0.36, "both XRP books need a mark on their own side");
  t(quoteReads === 2, "shared XRP market should reuse its quote");
  const n = await M.wtfTick1044();
  const w1 = fs.readFileSync("data/wtf-book.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l));
  t(n === 1 && w1.length === 1 && w1[0].id === "g1" && w1[0].kind === "auto" && /HER WALL/.test(w1[0].rule), "auto WTF must log only her book's trade that her rule refuses (recon-tog short), not the inverse book or the allowed long: " + JSON.stringify(w1));
  t((await M.wtfTick1044()) === 0, "the same trade was auto-logged twice");
  const r = await M.addWtf1044({ data: { id: "g3", note: "why did she long here" } });
  const all = await M.getWtf1044();
  t(r.ok && all.length === 2 && all[0].kind === "tap" && all[0].note === "why did she long here" && all[0].result === "open", "her WTF tap with a note was not logged / shown: " + JSON.stringify(all));
  const allR = await M.wireRows1044(24, 1000000); t(allR.length === 8 && (await M.wireRows1044(24, 2)).length === 2, "the row cap does not work");
  console.log(ok ? "LIVE WIRE 1044 TEST ✓ - every book's trades newest first, P/L from the live bid every second, her WTF tap (with note) on any trade, auto WTF only on her books and only for a real rule, logged once; never touches an order" : "LIVE WIRE 1044 TEST: FAIL");
  process.exit(ok ? 0 : 1);
})();
