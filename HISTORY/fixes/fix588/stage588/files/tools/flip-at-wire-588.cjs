// fix588 HER FLIP AT THE WIRE, EVERY BOOK (Love Nov 1 2026 12:24-12:25 UTC: "The last line before every order leaves must judge the trade itself. It must refuse the order if there is
// no 2-5m flip ... Main, rejection, no-pink, delayed, 5M - all of them. The 4:00 AM short must fail."): runs the REAL wire checks from kalshi-live + poly-live with the REAL herTurn587
// from bandlock on the logged candles of the 4:00 AM and 4:15 AM PT shorts.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const D = (f) => fs.readFileSync(path.join(root, "src/lib/desk", f), "utf8");
const K = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : D("kalshi-live.server.ts");
const P = process.argv[3] ? fs.readFileSync(process.argv[3], "utf8") : D("poly-live.server.ts");
const BL = process.argv[4] ? fs.readFileSync(process.argv[4], "utf8") : D("bandlock.ts");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("FLIP AT WIRE 588 TEST: FAIL - " + m); } };
function fnText(S, name) { const i = S.indexOf("function " + name + "("); if (i < 0) return null; const eol = S.indexOf("\n", i); const j = S.lastIndexOf("{", eol); let d = 0, k = j; for (; k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (!d) break; } } let a = i; if (S.slice(Math.max(0, i - 6), i) === "async ") a = i - 6; return S.slice(a, k + 1); }
const kf = fnText(K, "herFlipAtWire588"), pf = fnText(P, "polyFlip588"), bt = ["trailNow", "herTurn587"].map((n) => fnText(BL, n));
if (!kf || !pf || bt.some((x) => !x)) { console.log("FLIP AT WIRE 588 TEST: FAIL - the wire flip is missing (" + [!kf && "kalshi-live herFlipAtWire588", !pf && "poly-live polyFlip588", bt.some((x) => !x) && "bandlock herTurn587"].filter(Boolean).join(", ") + ")"); process.exit(1); }
const tr = (s) => ts.transpileModule(s, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const mk = (G, tick, at) => { const Bmod = new Function("G", tr(bt.join("\n")) + ";return {trailNow, herTurn587};")(G); const Q = { quoteTick: () => ({ c: tick, at }) };
  const sub = (s) => s.replace(/await import\("\.\/quotes"\)/g, "__Q").replace(/await import\("\.\/bandlock"\)/g, "__B");
  return new Function("__Q", "__B", tr(sub(kf)) + "\n" + tr(sub(pf)) + ";return {herFlipAtWire588, polyFlip588};")(Q, Bmod); };
(async () => {
  const realNow = Date.now;
  // 1. the 4:00 AM PT short (12:00:13 UTC, recon-rej, "Candle falling from the top third") - Kalshi wire must refuse, at the wire price and at 0 under the 5m open
  let at = Date.parse("2026-11-01T12:00:13.830Z"); Date.now = () => at;
  for (const tk of [77855.87, 77846]) { const W = mk({ __pivBars: { btc: { bars: [{"t": 1793533980, "o": 77821.17, "h": 77847.2, "l": 77817.41, "c": 77826.66, "v": 236}, {"t": 1793534040, "o": 77826.98, "h": 77849.18, "l": 77821.4, "c": 77822.7, "v": 192}, {"t": 1793534100, "o": 77822.17, "h": 77845.22, "l": 77802.53, "c": 77845.22, "v": 209}, {"t": 1793534160, "o": 77842.98, "h": 77845.71, "l": 77817.77, "c": 77817.77, "v": 185}, {"t": 1793534220, "o": 77816.37, "h": 77846.2, "l": 77815.04, "c": 77827.86, "v": 253}, {"t": 1793534280, "o": 77827.87, "h": 77841.46, "l": 77822.45, "c": 77834.1, "v": 202}, {"t": 1793534340, "o": 77833.99, "h": 77857.93, "l": 77821.01, "c": 77856.67, "v": 138}, {"t": 1793534400, "o": 77856.28, "h": 77856.28, "l": 77856.28, "c": 77856.28, "v": 2}] } } }, tk, at); const w = await W.herFlipAtWire588("KXBTC15M-26NOV010715-15", "down"); t(/HER FLIP \(fix588\)/.test(w), "the 4:00 AM short at " + tk + " left the Kalshi wire: " + JSON.stringify(w)); const p = await W.polyFlip588("cpc-btc-updown-5m-2026-11-01-1200z", "down"); t(/HER FLIP \(fix588\)/.test(p), "a 5M (Polymarket) short on the same candles left the wire"); }
  // 2. the 4:15 AM PT short (12:15:14 UTC, recon-rej, "Rejected down off 5m PP")
  at = Date.parse("2026-11-01T12:15:14.433Z");
  { const W = mk({ __pivBars: { btc: { bars: [{"t": 1793534880, "o": 77903.09, "h": 77908.73, "l": 77850.94, "c": 77868.64, "v": 296}, {"t": 1793534940, "o": 77868.36, "h": 77870.26, "l": 77837.66, "c": 77851.48, "v": 300}, {"t": 1793535000, "o": 77850.47, "h": 77885.7, "l": 77841.41, "c": 77849.66, "v": 282}, {"t": 1793535060, "o": 77864.66, "h": 77864.66, "l": 77816.22, "c": 77830.44, "v": 352}, {"t": 1793535120, "o": 77830.49, "h": 77844.9, "l": 77827.72, "c": 77837.76, "v": 272}, {"t": 1793535180, "o": 77845.26, "h": 77848.23, "l": 77830.07, "c": 77830.07, "v": 286}, {"t": 1793535240, "o": 77829.38, "h": 77843.11, "l": 77819.86, "c": 77840.61, "v": 376}, {"t": 1793535300, "o": 77839.93, "h": 77839.93, "l": 77821.92, "c": 77824.62, "v": 10}] } } }, 77833.37, at); t(/HER FLIP \(fix588\)/.test(await W.herFlipAtWire588("KXBTC15M-26NOV010730-30", "down")), "the 4:15 AM short left the Kalshi wire"); }
  // 3. a real turn goes, on both venues, both sides
  at = Date.parse("2026-11-01T12:01:30Z"); const o = 1793534400;
  { const W = mk({ __pivBars: { btc: { bars: [ { t: o, o: 77856, h: 77870, l: 77850, c: 77852 }, { t: o + 60, o: 77852, h: 77853, l: 77840, c: 77842 } ] } } }, 77842, at);
    t((await W.herFlipAtWire588("KXBTC15M-26NOV010715-15", "down")) === "", "a real green->red 2-5m turn was refused on Kalshi");
    t((await W.polyFlip588("cpc-btc-updown-5m-2026-11-01-1200z", "down")) === "", "a real green->red turn was refused on the 5M");
    t(/HER FLIP/.test(await W.herFlipAtWire588("KXBTC15M-26NOV010715-15", "up")), "a long on a candle that turned red left the wire"); }
  { const W = mk({ __pivBars: { gold: { bars: [ { t: o, o: 4000, h: 4000.2, l: 3999.5, c: 4000.4 } ] } } }, 4000.4, at); t((await W.herFlipAtWire588("KXGOLD15M-26NOV010715-15", "up")) === "", "mirror: a real red->green gold turn was refused"); }
  // 4. fails closed
  { const W = mk({ __pivBars: { btc: { bars: [] } } }, 77842, at - 10000); t(/HER FLIP/.test(await W.herFlipAtWire588("KXBTC15M-26NOV010715-15", "down")), "a stale tick did not refuse"); t(/HER FLIP/.test(await W.herFlipAtWire588("KXSILVER15M-X", "down")), "a market with no candles did not refuse"); }
  Date.now = realNow;
  // 5. wiring: every opening Kalshi order meets it inside kalshi() (only reduce_only + her take-profit closes pass - delayed, add-ons, retries do not), every Poly buy inside poly()
  const kb = fnText(K, "kalshi") || "";
  t(/reduce_only !== true && !\(body && closeOnlyBodies\.has\(body\)\)\) \{\s*const flipWhy588 = await herFlipAtWire588\(/.test(kb) && kb.indexOf("herFlipAtWire588(") < kb.indexOf("body = guarded.body;"), "kalshi() does not judge her flip on every opening order before it is signed");
  t(!/twinAddBodies[^\n]*herFlipAtWire588|herFlipAtWire588[^\n]*twinAddBodies/.test(kb), "the delayed add-on is excused from her flip");
  const pb = fnText(P, "poly") || "";
  t(/const why588 = await polyFlip588\(/.test(pb) && pb.indexOf("polyFlip588(") < pb.indexOf("const timestamp"), "poly() does not judge her flip on every buy before it is signed");
  t(!/fetch\([^)]*portfolio\/(events\/)?orders/.test(K) && (K.match(/kalshi\("POST", "\/trade-api\/v2\/portfolio\/events\/orders"/g) || []).length >= 1, "a Kalshi order leaves without kalshi()");
  t(!/fetch\([^)]*\/v1\/orders/.test(P), "a Polymarket order leaves without poly()");
  console.log(ok ? "FLIP AT WIRE 588 TEST ✓ - every opening order (Kalshi: main, rejection, no-pink, delayed, add-ons, retries; Polymarket: the 5M and every buy) is refused without a 2-5m candle that traded the other colour then crossed its open her way. The 4:00 AM and 4:15 AM shorts fail." : "FLIP AT WIRE 588 TEST: FAIL");
  process.exit(ok ? 0 : 1);
})();
