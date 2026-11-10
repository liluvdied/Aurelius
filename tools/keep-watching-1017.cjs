// fix1017 proof: KEEP WATCHING AFTER AN OVER-CAP LOOK on every lane with a one-ticket-per-window lock (Love Nov 7 2026 9:21 PM PT: "they apply to literally every single thing traded on my accounts luv
// this isn't a here not there situation for any of these whatsoever / delayed is the only one that doesn't"). Only a FILL spends a window; an ask over her cap / no fill looks again; never a second buy.
// MOMENTUM on Polymarket (polymom830), BNB live (bnblive940), ETH.1 live (ethlive831), the Polymarket mirror (polymirror). The XRP 5m lane is proven in tools/xrp-5m-poly-961.cjs.
const fs = require("fs"), path = require("path"), os = require("os");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("KEEP WATCHING 1017 TEST: FAIL - " + m); } };
const ts = require(path.join(root, "node_modules/typescript")), src = (f) => fs.readFileSync(path.join(root, "src/lib/desk", f), "utf8");
const load = (f, fix = (x) => x) => { const o = fs.mkdtempSync(path.join(os.tmpdir(), "k1017-")); fs.writeFileSync(path.join(o, "m.js"), fix(ts.transpileModule(src(f), { compilerOptions: { module: 1, target: 99 } }).outputText)); return require(path.join(o, "m.js")); };
for (const f of ["polymom830.ts", "bnblive940.ts", "ethlive831.ts", "polymirror.ts", "xrp5m961.ts"]) t(/fix1017/.test(src(f)), f + " has no fix1017 keep-watching rule");
for (const f of ["bandlock5m27.ts", "auto5m27.ts", "dna5m27.ts", "recon5m.ts"]) t(!/fix1017/.test(src(f)), "her walled 5M file " + f + " must not be touched");
const G = globalThis, here = process.cwd(), dir = fs.mkdtempSync(path.join(os.tmpdir(), "k1017d-")); fs.mkdirSync(path.join(dir, "data")); process.chdir(dir);
const W = (f, x) => fs.writeFileSync(path.join(dir, "data", f), JSON.stringify(x)), lines = (f) => { try { return fs.readFileSync(path.join(dir, "data", f), "utf8").trim().split("\n").filter(Boolean).map((x) => JSON.parse(x)); } catch { return []; } };
(async () => {
  // ---- MOMENTUM on Polymarket (polymom830): over-floor look keeps watching (every 5 s, logged once), a fill spends the window, never a second buy
  { const X = load("polymom830.ts"); W("live-switch.json", { polyMom830: { on: true, dollars: 2.5, addOn: 3, addOnMult: 2.8, maxAsk: 0.6667 } }); G.__pm830 = null;
    const window = Math.floor(Date.now() / 900000) * 900000;
    const now = window + 70000, close = new Date(window + 900000).toISOString();
    const iso = (seconds) => new Date(window + seconds * 1000).toISOString(); let calls = 0, fill = null;
    W("momentum-book-704.json", { rows: [{ id: "m1", asset: "btc", side: "up", result: "open", at: iso(60), closeTime: close }, { id: "m2", asset: "btc", side: "up", result: "open", at: iso(65), closeTime: close }] });
    const pm = { takeSide: async (s, c, d, max) => { calls++; t(max <= 0.6667 && d <= 5, "polymom830 buy outside her floor / cap"); return fill; }, takeSideWhy: () => "Polymarket up at 0.72 is outside 0.08-0.6667", bookTop: async () => ({ bid: 0.5, ask: 0.52 }), sellSide: async () => null };
    await X.polyMomTick830(now, pm); const c1 = calls; t(c1 === 2, "polymom830: both fresh rows looked (got " + c1 + ")");
    await X.polyMomTick830(now + 2500, pm); t(calls === c1, "polymom830: no new look sooner than 5 s");
    await X.polyMomTick830(now + 5100, pm); t(calls > c1, "polymom830: an over-floor look must NOT spend the window - it looks again");
    t(lines("poly-mom-830.jsonl").filter((x) => x.action === "skipped").length === 2, "polymom830: each skipped row is logged once");
    fill = { filled: 4.8, price: 0.52, slug: "cpc-btc-x" }; await X.polyMomTick830(now + 10200, pm); const c2 = calls;
    t(Object.values(G.__pm830.pos).filter((p) => p.contracts > 0).length === 1, "polymom830: the ask came back inside her floor - it must enter, once");
    await X.polyMomTick830(now + 15300, pm); await X.polyMomTick830(now + 20400, pm); t(calls === c2, "polymom830: never a second buy in a window that filled");
    G.__pm830 = null; G.__pm830Try = {}; W("momentum-book-704.json", { rows: [{ id: "m3", asset: "btc", side: "up", result: "open", at: iso(60), closeTime: close }] }); fill = null;
    await X.polyMomTick830(window + 119000, pm); const c3 = calls; await X.polyMomTick830(window + 125000, pm); t(calls === c3, "polymom830: her set up stays fresh 60 s - no look after it"); }
  // ---- BNB live (bnblive940): a paper row booked over 66c is now copied - the live ask is judged at the wire; fix890 knocks again; one filled trade a window
  { const X = load("bnblive940.ts"); W("live-switch.json", { bnbLive940: { on: true, dollars: 1.5 } }); G.__bnb940 = null; G.__nb899Test = true;
    const now = Date.now(), iso = (d) => new Date(now + d).toISOString(); let calls = [], res = { ok: false, reason: "ask 0.7 over 0.66" };
    W("mom-coins-833.json", { rows: [{ id: "b1", asset: "bnb", ticker: "KXBNB15M-X", result: "open", at: iso(-5000), closeTime: iso(600000), side: "up", ask: 0.7, floorOk: false }] });
    const live = { addOnBuy600: async (tk, side, d, max) => { calls.push(max); return res; }, partLive: async () => null }, mk = { fetchMarket: async () => ({ yesAsk: 0.9, noAsk: 0.1 }) };
    await X.bnbLiveTick940(now, live, mk); t(calls.length === 1 && calls[0] <= 0.667, "bnblive940: a paper row booked at 70c must still be tried live, inside her floor (got " + calls.length + ")");
    await X.bnbLiveTick940(now + 2100, live, mk); t(calls.length === 2, "bnblive940: an over-66c live ask keeps knocking");
    res = { ok: true, filled: 2.3, px: 0.65 }; await X.bnbLiveTick940(now + 4200, live, mk); await X.bnbLiveTick940(now + 6300, live, mk); await X.bnbLiveTick940(now + 8400, live, mk);
    t(calls.length === 3, "bnblive940: one fill, then never a second buy that window (got " + calls.length + ")"); delete G.__nb899Test; }
  // ---- ETH.1 live (ethlive831): an over-66c / no-fill look keeps knocking while the set up is fresh; one filled trade a window
  { const X = load("ethlive831.ts"); W("live-switch.json", { ethLive831: { on: true, dollars: 2.5, addOn: 3, addOnMult: 2.8 } }); G.__el831 = null;
    const window = Math.floor(Date.now() / 900000) * 900000;
    const now = window + 310000, close = new Date(window + 900000).toISOString();
    const iso = (seconds) => new Date(window + seconds * 1000).toISOString(); let calls = 0, res = { ok: false, reason: "ask 0.69 over 0.66" };
    W("eth-book.json", { rows: [{ id: "e1", ticker: "KXETH15M-26NOV080030-30", side: "down", result: "open", at: iso(300), closeTime: close, ask: 0.6, label: "Rejected down off +1σ" }, { id: "e2", ticker: "KXETH15M-26NOV080030-30", side: "down", result: "open", at: iso(305), closeTime: close, ask: 0.6 }] });
    const live = { addOnBuy600: async () => { calls++; return res; }, partLive: async () => null }, mk = { fetchMarket: async () => ({ yesAsk: 0.9, noAsk: 0.9 }) };
    await X.ethLiveTick831(now, live, mk); const a = calls; await X.ethLiveTick831(now + 2100, live, mk); t(calls > a, "ethlive831: an over-66c look must NOT spend the window");
    res = { ok: true, filled: 4, px: 0.62 }; await X.ethLiveTick831(now + 4200, live, mk); const b = calls; await X.ethLiveTick831(now + 6300, live, mk); await X.ethLiveTick831(now + 8400, live, mk);
    t(calls === b && Object.keys(G.__el831.pos).length === 1, "ethlive831: one filled trade a window - never a second buy (calls " + b + " -> " + calls + ")");
    t(lines("eth-live-831.jsonl").filter((x) => x.action === "skipped").length <= 2, "ethlive831: a skip is not logged on every knock"); }
  // ---- Polymarket mirror (polymirror): a miss does not block the window; retried at most every 5 s, logged once; a fill or an error at the wire spends it
  { let fill = null, boom = false, calls = 0; const rows = [{ id: "r1", book: "cotc", asset: "btc", result: "open", ticker: "KXBTC15M-Z", side: "up", at: "2026-11-08T05:20:00Z" }];
    G.__pmStub = { takeSide: async () => { calls++; if (boom) throw new Error("wire"); return fill; }, takeSideWhy: () => "Polymarket up at 0.8 is outside 0.05-0.75", polyWindowFor: async () => ({ slug: "cpc-btc-z" }), polymarketHoldings: async () => [], sellSide: async () => null };
    const X = load("polymirror.ts", (s) => s.replace(/require\("\.\/poly-live\.server"\)/g, "globalThis.__pmStub").replace(/require\("\.\/nightbook"\)/, "({ listNight: () => globalThis.__pmRows })")); G.__pmRows = rows;
    W("live-switch.json", { polyMirror: { on: true, books: ["cotc"], dollars: 1, maxAsk: 0.66 } }); const A = { btc: { market: { ticker: "KXBTC15M-Z", closeTime: "2026-11-08T05:30:00Z" }, secondsLeft: 500 } };
    await X.polyMirrorTick(A); t(calls === 1, "polymirror: first look"); await X.polyMirrorTick(A); t(calls === 1, "polymirror: no new look sooner than 5 s");
    G.__pmir1017 = {}; await X.polyMirrorTick(A); t(calls === 2, "polymirror: a miss must NOT spend the window"); t(lines("poly-mirror-log.jsonl").filter((x) => x.status === "missed").length === 1, "polymirror: a miss is logged once");
    fill = { filled: 1.5, price: 0.6, slug: "cpc-btc-z" }; G.__pmir1017 = {}; await X.polyMirrorTick(A); G.__pmir1017 = {}; await X.polyMirrorTick(A); t(calls === 3, "polymirror: one fill, never a second buy");
    const B2 = { btc: { market: { ticker: "KXBTC15M-Y", closeTime: "2026-11-08T05:45:00Z" }, secondsLeft: 500 } }; G.__pmRows = [{ ...rows[0], id: "r2", ticker: "KXBTC15M-Y" }]; boom = true; G.__pmir1017 = {};
    await X.polyMirrorTick(B2); boom = false; fill = { filled: 1, price: 0.5, slug: "cpc-btc-y" }; G.__pmir1017 = {}; await X.polyMirrorTick(B2); t(calls === 4, "polymirror: an error at the wire spends the window (one ticket per window)"); }
  process.chdir(here);
  console.log(ok ? "KEEP WATCHING 1017 TEST ✓ - every lane with a one-ticket lock keeps watching after an over-cap / no-fill look (MOMENTUM Poly, BNB, ETH.1, the Poly mirror; XRP 5m in its own test): only a fill spends the window, never a second buy, caps unchanged." : "KEEP WATCHING 1017 TEST: FAIL");
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.log("KEEP WATCHING 1017 TEST: FAIL - " + (e && e.stack)); process.exit(1); });
