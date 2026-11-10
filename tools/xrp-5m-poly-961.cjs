// fix961 proof: her XRP 5m Polymarket lane - main's Nov 3 entries, her walls, $1 live through the desk's Polymarket buy.
const fs = require("fs"), path = require("path"), os = require("os");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("XRP 5M POLY 961 TEST: FAIL - " + m); } };
const X = fs.readFileSync(path.join(root, "src/lib/desk/xrp5m961.ts"), "utf8"), E = fs.readFileSync(path.join(root, "src/lib/desk/engine.ts"), "utf8");
t(E.includes('import("./xrp5m961").then((m) => m.xrpTick961())'), "the engine does not run her XRP lane");
t(/pm\.buySlug\(r\.side, slug, c\.dollars, c\.maxAsk, null, ""/.test(X) && !/kalshi\(|\/v1\/orders/.test(X), "the XRP lane must buy only through the desk's Polymarket buy (guard: umpire, LIVE, cap)");
t(!/bandlock5m27|five5m|recon5m|auto5m27|dna5m27/.test(X), "the XRP lane must not touch her walled 5M files");
const cfg = JSON.parse(fs.readFileSync(path.join(root, "data/xrp5m-961-cfg.json"), "utf8")); t(cfg.dollars <= 5 && cfg.maxAsk <= 0.66, "size / floor out of her rails");
const ts = require(path.join(root, "node_modules/typescript")), out = fs.mkdtempSync(path.join(os.tmpdir(), "x961-"));
fs.writeFileSync(path.join(out, "x.js"), ts.transpileModule(X, { compilerOptions: { module: 1, target: 99 } }).outputText.replace('require("./ethbook")', "({ ethBands682: () => (globalThis.__t1017L || []) })"));
const M = require(path.join(out, "x.js"));
const now = 1794100200 + 150, bar = (t, o, h, l, c) => ({ t, o, h, l, c, v: 1 });
const L = [{ name: "session VWAP", price: 2.300 }, { name: "+1σ", price: 2.320 }, { name: "-1σ", price: 2.280 }, { name: "+2σ", price: 2.340 }, { name: "-2σ", price: 2.260 }, { name: "5m PP", price: 2.310 }, { name: "Red zone", price: 2.330 }, { name: "Green zone", price: 2.290 }];
// a rejection up off -1σ: the 5m opened above it, wicked to it, the 2m is green -> long
let bs = [bar(now - 150, 2.284, 2.285, 2.2801, 2.282), bar(now - 90, 2.282, 2.283, 2.2802, 2.281), bar(now - 30, 2.281, 2.2835, 2.281, 2.2834)];
let r = M.xrpRead961(bs, L, 2.2834, now); t(r.side === "up" && /Rejected up off -1σ/.test(r.label), "a rejection off -1σ with her 2m green must be a long: " + JSON.stringify(r));
// same but both candles red -> no long (Nov 3 needs a flip her colour)
bs = [bar(now - 150, 2.2845, 2.285, 2.2801, 2.282), bar(now - 90, 2.284, 2.284, 2.2802, 2.281), bar(now - 30, 2.2835, 2.2835, 2.281, 2.2834)];
r = M.xrpRead961(bs, L, 2.2834, now); t("side" in r && r.side === "up", "fix1004 + fix1032: $0.0033 back up off the wick - by her high / low colour (not the open) the candles ARE her colour now, so the long enters (it no longer needs the wick exemption): " + JSON.stringify(r));
// fix1004 her cornerstones: a 1-tick green 2m with no push and no wick is not her colour -> no long
bs = [bar(now - 150, 2.2845, 2.285, 2.2801, 2.2803), bar(now - 30, 2.2803, 2.2804, 2.2802, 2.2804)];
r = M.xrpRead961(bs, L, 2.28033, now); t(!("side" in r) && /PUSH \(fix1004\)/.test(r.why), "fix1004 + fix1031: a hair of colour with her push NOT met ($0.00023 off the low, her push is now $0.00025) must be refused: " + JSON.stringify(r));
// fix1004 THE 04:46:23 LONG (Nov 8 UTC, Coinbase XRP-USD): 5m opened 1.1592 (red), 2m opened 1.1588, spot 1.1589, low 1.1584, under the Bollinger middle 1.15946 -> REFUSED (rule C, colour)
{ const n2 = 1794113183, L2 = [{ name: "session VWAP", price: 1.15826 }, { name: "+1σ", price: 1.161 }, { name: "-1σ", price: 1.1555 }, { name: "BB upper", price: 1.163 }, { name: "BB lower", price: 1.15592 }];
  const b2 = [bar(1794113100, 1.1592, 1.1593, 1.1586, 1.1588), bar(1794113160, 1.1588, 1.1589, 1.1584, 1.1589)];
  r = M.xrpRead961(b2, L2, 1.1589, n2); t(!/RULE C/.test(String(r.why || "")), "fix1042: rule C is out (Perplexity's fix, Love 5:52 PM) - nothing may refuse a read as RULE C: " + JSON.stringify(r)); }
t(typeof M.cornerstones1004 === "function" && M.cornerstones1004({ side: "up", spot: 1.0010, line: 1.0, lineName: "x", label: "Rejected up off x", o2: 1.0004, o5: 1.0004, lo5: 1.0001, hi5: 1.0011, push: 0.0005, wall: 0.0003, bbUp: 0, bbMid: 0, bbLo: 0 }) === "", "fix1004: her one-line cornerstone checker must pass a real green push");
t(/BOLLINGER WALL/.test(M.cornerstones1004({ side: "up", spot: 1.0010, line: 1.0, lineName: "x", label: "Rejected up off x", o2: 1.0004, o5: 1.0004, lo5: 1.0001, hi5: 1.0011, push: 0.0005, wall: 0.0003, bbUp: 1.003, bbMid: 1.0012, bbLo: 0.999 })), "fix1004: a long under an unbroken Bollinger within her scaled $25 wall must be refused");
t(/BOLLINGER WALL/.test(M.cornerstones1004({ side: "up", spot: 1.0010, line: 1.0, lineName: "x", label: "Rejected up off x", o2: 1.0004, o5: 1.0004, lo5: 1.0001, hi5: 1.0014, push: 0.0005, wall: 0.0003, bbUp: 1.003, bbMid: 1.0012, bbLo: 0.999 })), "fix1041: the MIDDLE Bollinger the 5m broke past and came back under is still her wall (her 3:35 PM words)"); t(!/BOLLINGER WALL/.test(M.cornerstones1004({ side: "up", spot: 1.0010, line: 1.0, lineName: "x", label: "Rejected up off x", o2: 1.0004, o5: 1.0004, lo5: 1.0001, hi5: 1.0014, push: 0.0005, wall: 0.0003, bbUp: 1.0012, bbMid: 0, bbLo: 0.999 })), "fix995: a broken OUTER Bollinger is no wall on the way back");
// stale feed -> no trade
r = M.xrpRead961([bar(now - 400, 2.28, 2.29, 2.27, 2.28)], L, 2.28, now); t(/STALE/.test(r.why || ""), "a stale feed must not trade");
// thirds: a long in the top third of the channel is refused
r = M.xrpRead961([bar(now - 150, 2.3165, 2.318, 2.3151, 2.317), bar(now - 30, 2.316, 2.3175, 2.316, 2.3172)], [{ name: "session VWAP", price: 2.30 }, { name: "+1σ", price: 2.32 }, { name: "-1σ", price: 2.28 }, { name: "BB upper", price: 2.315 }], 2.3172, now); t(!("side" in r && r.side === "up"), "a long in the top 33% must be refused (thirds)"); /* fix1004: main current read may short the +1σ wick here - only the long is the thirds case */
// A lagging 2m bucket must not veto a valid 5m reading, and a late first bar cannot stand in for the settlement open.
const start = Math.floor(now / 600) * 600;
const fiveOnly = [bar(start, 2.2825, 2.285, 2.2801, 2.282), bar(start + 60, 2.282, 2.284, 2.2802, 2.2834)];
t(M.xrpRead961(fiveOnly, L, 2.2834, start + 130).side === "up", "a valid 5m read must survive an empty forming 2m bucket");
t(Number.isNaN(M.win5Open1051(fiveOnly.slice(1), start + 130)), "the second minute must never stand in for the true 5m settlement open");

// fix1017 her lane keeps watching after an over-cap look; only a fill spends the window; never a second buy in a window
(async () => {
  t(/export const RETRY1017_MS = 5000/.test(X) && !/\n    s\.seen\[id\] = nowMs;\n    const row/.test(X), "fix1017: the window must not be spent before the ask / fill");
  const G = globalThis, tmp = fs.mkdtempSync(path.join(os.tmpdir(), "x1017-")), here = process.cwd(); fs.mkdirSync(path.join(tmp, "data")); fs.writeFileSync(path.join(tmp, "data/xrp5m-961-cfg.json"), JSON.stringify({ on: true, dollars: 1, maxAsk: 0.66 })); process.chdir(tmp);
  const realNow1049 = Date.now; // fix1049
  try {
    G.__t1017L = L; const n0 = 1794100200 + 150; // the -1σ long read above, 150 s into its window
    const B = [bar(n0 - 150, 2.2825, 2.285, 2.2801, 2.282), bar(n0 - 90, 2.282, 2.283, 2.2802, 2.281), bar(n0 - 30, 2.281, 2.2835, 2.281, 2.2834)]; // fix1051: this window opens at 2.2825, so the 2.2834 long is on her side of the 5m open (was 2.284 - a long under the open, which her 5m lane now waits out)
    const feed = (bs) => { G.__xrp961Bars = { at: Date.now(), m: new Map(bs.map((b) => [b.t, b])) }; };
    let ask = 0.72, fill = null, looks = 0, buys = 0, boom = false;
    const pm = { bookTop: async () => { looks++; return { ask, bid: 1 - ask - 0.01 }; }, buySlug: async (side, slug, d, max, _target, _claim, onRefused) => { buys++; if (!fill) onRefused?.("guard", "Live switch is OFF. No new Polymarket order was sent."); if (boom) throw new Error("wire"); t(d <= 5 && max <= 0.66, "fix1017: buy inside her $ cap and 66c"); return fill; } };
    const tick = async (sec) => { Date.now = () => sec * 1000; /* fix1049 the lane's clock is the test's clock - fixed fake bars never age past the lane's 2-day cache */ G.__xrp961At = 0; feed(B.map((b) => ({ ...b, t: b.t + (sec - n0 - ((sec - n0) % 300)) }))); await M.xrpTick961(sec * 1000, pm); };
    const lines = () => { try { return fs.readFileSync(path.join(tmp, "data/xrp5m-961.jsonl"), "utf8").trim().split("\n").filter(Boolean).map((x) => JSON.parse(x)); } catch { return []; } };
    G.__xrp961 = { rows: [], seen: {} };
    const id0 = "xrp5m-" + (n0 - 150);
    { const B0 = B.slice(); B[0] = bar(n0 - 150, 2.284, 2.285, 2.2801, 2.282); ask = 0.40; await tick(n0 - 20); t(buys === 0 && lines().some((x) => /NOT ON HER SIDE OF THE 5M OPEN \(fix1051\)/.test(String(x.why))), "fix1051: a long with price under this 5m window's open (2.2834 < 2.284) must wait, not buy: " + JSON.stringify(lines())); B.splice(0, B.length, ...B0); ask = 0.72; G.__xrp961 = { rows: [], seen: {} }; try { fs.unlinkSync(path.join(tmp, "data/xrp5m-961.jsonl")); } catch {} for (const k of ["__xrp961Retry", "__xrp961Once", "__xrp961Why", "__xrp961Miss"]) delete G[k]; }
    await tick(n0); t(!G.__xrp961.seen[id0] && buys === 0, "fix1017: an over-cap look (72c) must NOT spend the window");
    t(lines().filter((x) => x.action === "skipped").length === 1, "fix1017: the over-cap look is logged once");
    const l1 = looks; await tick(n0 + 3); t(looks === l1, "fix1017: no re-check sooner than 5 s");
    await tick(n0 + 6); t(looks > l1 && lines().filter((x) => x.action === "skipped").length === 1, "fix1017: it looks again after 5 s and does not spam the log");
    ask = 0.6; fill = { filled: 1.61, price: 0.62 }; await tick(n0 + 12);
    t(buys === 1 && G.__xrp961.seen[id0] && lines().some((x) => x.action === "bought" && x.id === id0), "fix1017: the ask came back under 66c - it must enter the same window and the fill spends it");
    ask = 0.5; await tick(n0 + 18); await tick(n0 + 30); t(buys === 1, "fix1017: never a second buy in a window that filled");
    G.__xrp961.seen = {}; await tick(n0 + 40); t(buys === 1, "fix1017: a bought row alone keeps the window spent (one ticket per window)");
    // no fill / refusal at the wire keeps watching; a later fill enters once
    const n1 = n0 + 300, id1 = "xrp5m-" + (n1 - 150); fill = null; ask = 0.55;
    await tick(n1); t(buys === 2 && !G.__xrp961.seen[id1], "fix1017: a no fill / refusal must NOT spend the window");
    t(lines().some((x) => x.id === id1 && /Live switch is OFF/.test(x.why)), "the XRP ledger must preserve the precise wire refusal");
    await tick(n1 + 6); t(buys === 3 && lines().filter((x) => x.id === id1 && x.action === "skipped").length === 1, "fix1017: it tries again after 5 s, logged once");
    fill = { filled: 1.8, price: 0.56 }; await tick(n1 + 12); await tick(n1 + 18); t(buys === 4 && G.__xrp961.seen[id1], "fix1017: one fill, then never again that window");
    // an error at the wire spends the window
    const n2 = n0 + 600, id2 = "xrp5m-" + (n2 - 150); boom = true; await tick(n2); boom = false; fill = { filled: 1, price: 0.5 }; await tick(n2 + 6);
    t(buys === 5 && G.__xrp961.seen[id2], "fix1017: an error at the wire spends the window (one ticket per window)");
    // not in the last minute: unchanged
    const b5 = buys, lk = looks; G.__xrp961Retry = {}; await tick(n0 + 1300); t(buys === b5 && looks === lk, "fix1017: never in the last minute of a window");
    // over-cap ask stays refused on every look
    const n4 = n0 + 1500; ask = 0.67; for (const d of [0, 6, 12, 18, 24]) await tick(n4 + d); t(buys === b5, "fix1017: an ask over 66c is never bought, however often it looks");
  } catch (e) { t(false, "fix1017 lane test threw: " + e.stack); } finally { process.chdir(here); delete G.__t1017L; Date.now = realNow1049; /* fix1049 */ }
console.log(ok ? "XRP 5M POLY 961 TEST ✓ - XRP 5m on Polymarket with main's current setups and walls through her cornerstones (fix1004: real colour by her push, same side, push off the turn, Bollinger wall, rule C; only a real wick skips colour) and her walls, $1 through the Polymarket guard, stale feed = no trade; fix1017: an over-cap look / no fill keeps watching (every 5 s, logged once), only a fill spends the window, never a second buy." : "XRP 5M POLY 961 TEST: FAIL");
process.exit(ok ? 0 : 1);
})();
