// fix1002 proof: every book / ledger gets a row in the RUNNING table and the i . O . i table, tagged LIVE / PAPER / OFF and KALSHI / POLY, today's numbers from its own file; books whose file is not there stay hidden. Display only.
const fs = require("fs"), path = require("path"), os = require("os");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("ALL BOOKS 1002 TEST: FAIL - " + m); } };
const L = fs.readFileSync(path.join(root, "src/lib/desk/allbooks1002.ts"), "utf8"), A = fs.readFileSync(path.join(root, "src/components/desk/app.tsx"), "utf8"), F = fs.readFileSync(path.join(root, "src/lib/desk/fns.ts"), "utf8");
t(/<BookGrid1046 heart=\{Heart1047\} \/> \{\/\* fix1046b/.test(A) && /\{false && <AllBooks1002 title="EVERY BOOK \+ LEDGER · TODAY"/.test(A) && /\{false && \( \/\* fix1046b the purple i \. O \. i table is gone/.test(A) && A.includes("● RUNNING ON KALSHI + POLY"), "her cards must replace the purple / yellow tables (fix1046b, Love Nov 9 2026 12:37 PM PT)");
t(/export const getAllBooks1002 = createServerFn\(\{ method: "GET" \}\)/.test(F), "the read must be a GET");
t(!/writeFileSync|appendFileSync|renameSync|placeOrder|cancelOrder|createOrder|buySlug|addOnBuy|kalshi\(|"POST"|live-switch\.json", "w"/.test(L), "display only: the book reader must never write a file or touch an order");
const ts = require(path.join(root, "node_modules/typescript")), out = fs.mkdtempSync(path.join(os.tmpdir(), "ab1002-"));
fs.writeFileSync(path.join(out, "ab.js"), ts.transpileModule(L, { compilerOptions: { module: 1, target: 99 } }).outputText.replace('require("./riskguard")', '({ liveTrades: () => [{ book: "recon-tog", ticker: "KXBTC15M-X", first: new Date().toISOString(), end: 0, pnl: 2.5 }] })'));
const here = process.cwd(), dir = fs.mkdtempSync(path.join(os.tmpdir(), "ab1002d-")); fs.mkdirSync(path.join(dir, "data")); process.chdir(dir);
const now = Date.now(), iso = new Date(now - 60000).toISOString(), W = (f, s) => fs.writeFileSync(path.join("data", f), typeof s === "string" ? s : JSON.stringify(s));
W("live-switch.json", { live: true, liveBook: { books: ["recon-tog"] }, ethLive872: { on: true }, ethLive831: { on: false }, polyMom830: { on: true } });
W("grok-og.json", [{ lane: "recon-tog", at: iso, result: "win", pnl: 10 }, { lane: "recon-tog", at: iso, result: "loss", pnl: -20 }, { lane: "recon-rej", at: iso, result: "win", pnl: 5 }]);
W("eth2-live-872.jsonl", [{ at: iso, id: "KXETH15M-T1:eth2", action: "bought", side: "down", filled: 10, px: 0.4 }, { at: iso, id: "KXETH15M-T1:eth2", action: "bell" }].map((x) => JSON.stringify(x)).join("\n") + "\n");
W("eth-live-831.jsonl", JSON.stringify({ at: iso, id: "KXETH15M-T2:eth-rjnp", action: "bought", side: "up", filled: 5, px: 0.5 }) + "\n" + JSON.stringify({ at: iso, id: "KXETH15M-T2:eth-rjnp", action: "sold the rest", out: { filled: 5, payout: 4 } }) + "\n");
W("window-results.json", { "KXETH15M-T1": "no" });
W("poly-mom-830.jsonl", JSON.stringify({ at: iso, id: "KXBTC15M-T3:btc-pinkup:mom", action: "bought", side: "up", contracts: 4, price: 0.5 }) + "\n");
const M = require(path.join(out, "ab.js"));
M.allBooksRows1002(now).then((o) => {
  const by = Object.fromEntries(o.rows.map((r) => [r.key, r]));
  t(by["recon-tog"] && by["recon-tog"].status === "LIVE" && by["recon-tog"].venue === "KALSHI" && by["recon-tog"].n === 2 && by["recon-tog"].w === 1 && by["recon-tog"].l === 1 && by["recon-tog"].pnl === -10, "main's row must read LIVE · KALSHI · 2 today 1W 1L -$10");
  t(by["recon-tog"] && by["recon-tog"].real && by["recon-tog"].real.pnl === 2.5, "main's real Kalshi line missing");
  t(by["recon-rej"] && by["recon-rej"].status === "PAPER" && by["recon-rej"].pnl === 5, "rej's row must read PAPER (not on the live line) +$5");
  t(by["eth2872"] && by["eth2872"].status === "LIVE" && by["eth2872"].w === 1 && by["eth2872"].pnl === 6, "ETH.2 must read LIVE, 1W, +$6 (10 down at 40c, Kalshi bell no)");
  t(by["eth831"] && by["eth831"].status === "OFF" && by["eth831"].pnl === 1.5, "ETH.1 must read OFF, +$1.50 from its own sale");
  t(by["polymom830"] && by["polymom830"].venue === "POLY" && by["polymom830"].open === 1, "Poly momentum must read POLY with 1 waiting on its bell");
  for (const k of ["xrpk972", "xrprej976", "btc5m974", "eth5m975", "push983", "btc2c899", "bnb940", "xrp5m961", "old5m", "mombnb833"]) t(!by[k], `${k} has no file here - its row must stay hidden`);
  W("xrpk-972.jsonl", JSON.stringify({ at: iso, id: "KXXRP15M-T4:xrpk", action: "bought", side: "up", filled: 2, px: 0.5 }) + "\n"); W("xrpk-972-cfg.json", { on: true, live: false });
  globalThis.__ab1002 = null;
  return M.allBooksRows1002(now).then((o2) => {
    const x = o2.rows.find((r) => r.key === "xrpk972"); t(x && x.status === "PAPER" && x.venue === "KALSHI" && x.n === 1, "XRP Kalshi's row must appear by itself once its ledger exists (paper while live:false)");
    process.chdir(here);
    console.log(ok ? "ALL BOOKS 1002 TEST ✓ - every book / ledger has a row in RUNNING and i . O . i, tagged LIVE / PAPER / OFF and KALSHI / POLY, today's trades / W / L / $ from its own file; books not installed stay hidden until their file exists. Display only." : "ALL BOOKS 1002 TEST: FAIL");
    process.exit(ok ? 0 : 1);
  });
}).catch((e) => { console.log("ALL BOOKS 1002 TEST: FAIL - " + e); process.exit(1); });
