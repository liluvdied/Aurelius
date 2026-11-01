// BEHAVIOUR UMPIRE (Love Oct 28 2026 6:22 PM PT: "please create an umpire that ACTUALLY checks if the conditions are met and not just the code is there"
// + 6:27 PM "LOCK. THEM. POUR CONCRETE OVER THEM."). Loads her real bandlock.ts, replays real situations, and checks she refuses / allows exactly as Love said.
// usage: node tools/behaviour-umpire.js [path/to/bandlock.ts]   exit 0 = every rule behaves, 1 = something broke (refuse the install)
const path = require("path"), fs = require("fs");
const ROOT = path.join(__dirname, ".."); const ts = require(path.join(ROOT, "node_modules/typescript"));
const file = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "src/lib/desk/bandlock.ts");
const FLAT25 = /export const __PINKFLAT25 = true/.test(fs.readFileSync(file, "utf8")); // fix573: when her weekend $25 overlay is on, the pink-tolerance scenes expect the $25 cushion, not the 15%/20% law
const out = fs.mkdtempSync("/tmp/beh-");
fs.writeFileSync(path.join(out, "bandlock.js"), ts.transpileModule(fs.readFileSync(file, "utf8").replace("const z594 = zoneSend594(asset, L, tick, side, false);", "const z594 = globalThis.__door594Test ? zoneSend594(asset, L, tick, side, false) : \"\";") /* fix594: older scenes judge their own wall; the fix594 scenes below turn her zone test on */, { compilerOptions: { module: 1, target: 99 } }).outputText);
fs.writeFileSync(path.join(out, "quotes.js"), "exports.quoteTick=()=>null;exports.feedHealth=()=>({ok:true});");
fs.writeFileSync(path.join(out, "recon.js"), "exports.RECON={};");
const G = globalThis; let NOW = Date.now(); Date.now = () => NOW;
const B = require(path.join(out, "bandlock.js"));
const res = []; const RETIRED = /^(REAL FLIP|33% \(copy\): no BTC|SESSION BAND AHEAD)/; // fix505: SESSION BAND AHEAD retired by Love Oct 30 2026 12:08 AM PT // fix424 (Love Oct 28 2026 7:30 PM PT: "a candle born red at a band and falling is still a short" -> fix416 real flip off; card "Put the removed protections back on main and rejection?" -> "All protections back": SESSION BAND AHEAD + BTC 33% back for main + rejection; the copy stays as it is)
const T = (name, ok, detail) => RETIRED.test(name) ? null : res.push({ name, ok: !!ok, detail: String(detail ?? "").slice(0, 160) });
const sec = (iso) => Date.parse(iso) / 1000;
const BOOKS = { main: [false, false, false, false, true, 0.4, true, false], rejection: [false, false, false, true, true, 0.4, true, false], copy: [false, false, true, false, false, 0, false, false] };
const geo = (asset, L, tick, side, bk) => { try { return B.impossibleGeo(asset, L, tick, side, ...BOOKS[bk]).why || ""; } catch (e) { return "ERROR " + e.message; } };

// 1. REAL FLIP (Love Oct 28 6:21 PM: "candle. flip. green -> red / red -> green") - 6:16:04 PM PT gold short: 2m/4m opened 6:16:00 and went straight down
NOW = Date.parse("2026-10-29T01:16:04Z");
G.__pivBars = { gold: { bars: [{ t: sec("2026-10-29T01:15:00Z"), o: 4053.0, h: 4054.55, l: 4052.9, c: 4054.0 }, { t: sec("2026-10-29T01:16:00Z"), o: 4054.0, h: 4054.0, l: 4053.81, c: 4053.81 }] } };
G.__qtrail_1 = { gold: [{ t: NOW - 3000, c: 4054.0 }, { t: NOW - 500, c: 4053.81 }] };
T("REAL FLIP: a born-red candle is not a flip (6:16:04 PM gold short)", typeof B.realFlipNow === "function" && !B.realFlipNow("gold", "down", 4053.81), "realFlipNow");
G.__pivBars.gold.bars[1] = { t: sec("2026-10-29T01:16:00Z"), o: 4054.0, h: 4054.3, l: 4053.81, c: 4053.81 };
T("REAL FLIP: a candle that went green then turned red counts", typeof B.realFlipNow === "function" && B.realFlipNow("gold", "down", 4053.81), "realFlipNow");

// 1b. HER FLIP for main + rejection (fix424, Love Oct 28 2026 7:30 PM PT: card "Tonight's flip, exactly" + "a candle born red at a band and falling is still a short"): 2/3/4/5m, 10c gold / $5 BTC past its open, born colour counts, no 1m
G.__pivBars = { gold: { bars: [{ t: sec("2026-10-29T01:15:00Z"), o: 4053.0, h: 4054.55, l: 4052.9, c: 4054.0 }, { t: sec("2026-10-29T01:16:00Z"), o: 4054.0, h: 4054.0, l: 4053.81, c: 4053.81 }] } };
G.__qtrail_1 = { gold: [{ t: NOW - 3000, c: 4054.0 }, { t: NOW - 500, c: 4053.81 }] };
T("HER FLIP: a candle born red and falling 19c is a short flip (6:16:04 PM gold)", typeof B.anyFlip406Now === "function" && B.anyFlip406Now("gold", "down", 4053.81, 0.1), "anyFlip406Now");
T("HER FLIP: only 5c past its open is not enough (10c gold)", typeof B.anyFlip406Now === "function" && !B.anyFlip406Now("gold", "down", 4053.95, 0.1), "anyFlip406Now");
NOW = Date.parse("2026-10-29T01:17:30Z");
G.__pivBars = { gold: { bars: [{ t: sec("2026-10-29T01:15:00Z"), o: 4053.0, h: 4053.3, l: 4052.9, c: 4053.2 }, { t: sec("2026-10-29T01:16:00Z"), o: 4053.2, h: 4054.5, l: 4053.1, c: 4054.5 }, { t: sec("2026-10-29T01:17:00Z"), o: 4054.5, h: 4054.6, l: 4054.3, c: 4054.3 }] } };
G.__qtrail_1 = { gold: [{ t: NOW - 3000, c: 4054.4 }, { t: NOW - 500, c: 4054.3 }] };
T("HER FLIP: a red 1m alone is not a flip (no 1m, every 2-5m green)", typeof B.anyFlip406Now === "function" && !B.anyFlip406Now("gold", "down", 4054.3, 0.1), "anyFlip406Now");
NOW = Date.parse("2026-10-29T01:16:04Z");

// 2. SESSION BAND AHEAD (Love Oct 28 6:32 PM: "EVEN if price ticked 1 millimeter over it it was STILL underneath a band") - 5:50:57 PM BTC long
const sa = B.sessionAheadWait("btc", [{ name: "5m PP", price: 81105.2 }, { name: "-1σ", price: 81141.31 }, { name: "-2σ", price: 81072.74 }], 81110, "up");
T("SESSION BAND AHEAD: the 5:50:57 PM BTC long waits under -1σ", !!sa, sa);

// 3. 33% SESSION BAND TO SESSION BAND, every book (Love Oct 28 6:30 PM: "the 33% needs to be 1000000% immutable" / "the 20/33% tolerance stands on EVERY single book aside from the delayed entry model")
NOW = Date.parse("2026-10-29T01:36:10Z");
const gL = [{ name: "session VWAP", price: 4050.71 }, { name: "+1σ", price: 4059.04 }, { name: "+2σ", price: 4067.37 }, { name: "-1σ", price: 4042.38 }, { name: "5m PP", price: 4057.42 }];
const bars = []; for (let t = sec("2026-10-29T00:50:00Z"); t < sec("2026-10-29T01:37:00Z"); t += 60) bars.push({ t, o: 4063, h: 4063.2, l: 4062.8, c: 4063 });
G.__pivBars = { gold: { bars } }; G.__qtrail_1 = { gold: [{ t: NOW - 3000, c: 4063 }, { t: NOW - 500, c: 4063 }] };
for (const bk of Object.keys(BOOKS)) {
  const a = geo("gold", gL, 4066.0, "up", bk), b = geo("gold", gL, 4060.0, "down", bk);
  T(`33% (${bk}): no gold long in the top 33% (84% of +1σ -> +2σ)`, /IMPOSSIBILITY|THIRD|top/i.test(a), a);
  T(`33% (${bk}): no gold short in the bottom 33% (12% of +1σ -> +2σ)`, /IMPOSSIBILITY|THIRD|bottom/i.test(b), b);
}
const bL = [{ name: "session VWAP", price: 81300 }, { name: "-1σ", price: 81141.31 }, { name: "-2σ", price: 81072.74 }];
G.__pivBars = { btc: { bars: [] } }; G.__qtrail_1 = { btc: [{ t: NOW - 3000, c: 81120 }, { t: NOW - 500, c: 81120 }] };
for (const bk of Object.keys(BOOKS)) { const a = geo("btc", bL, 81120, "up", bk); T(`33% (${bk}): no BTC long at 69% of a $68 channel (33%, never 20%)`, /IMPOSSIBILITY|THIRD|top/i.test(a), a); }

// 4. DOJI (Love Oct 28 2026 6:54 PM PT: "a GREEN doji candle - followed by a RED CANDLE = SHORT. NOT A LONG. / a RED doji candle , followed by a GREEN CANDLE = LONG. NOT SHORT.")
const PLAIN = [false, false, false, false, false, 0, false, false];
const dojiCase = (dojiGreen, afterRed) => {
  NOW = Date.parse("2026-10-29T01:37:30Z"); const up = dojiGreen; // green doji after an up trend, red doji after a down trend
  const db = []; let p = up ? 4024 : 4066; for (let t = sec("2026-10-29T00:55:00Z"); t < sec("2026-10-29T01:30:00Z"); t += 60) { const o = p; p += up ? 0.6 : -0.6; db.push({ t, o, h: Math.max(o, p) + 0.1, l: Math.min(o, p) - 0.1, c: p }); }
  const d0 = p, cc = dojiGreen ? 0.04 : -0.04;
  for (let i = 0; i < 5; i++) db.push({ t: sec("2026-10-29T01:30:00Z") + 60 * i, o: i ? d0 + cc * i / 5 : d0, h: d0 + 0.4, l: d0 - 0.4, c: d0 + cc * (i + 1) / 5 });
  const mv = afterRed ? -1 : 1; db.push({ t: sec("2026-10-29T01:35:00Z"), o: d0 + cc, h: d0 + cc + (mv > 0 ? 1.2 : 0.05), l: d0 + cc - (mv < 0 ? 1.2 : 0.05), c: d0 + cc + mv * 1.1 }, { t: sec("2026-10-29T01:36:00Z"), o: d0 + cc + mv * 1.1, h: d0 + cc + mv * 1.1 + 0.1, l: d0 + cc + mv * 1.1 - 0.1, c: d0 + cc + mv * 1.3 }, { t: sec("2026-10-29T01:37:00Z"), o: d0 + cc + mv * 1.3, h: d0 + cc + mv * 1.3 + 0.1, l: d0 + cc + mv * 1.3 - 0.1, c: d0 + cc + mv * 1.4 });
  const px = d0 + cc + mv * 1.4; G.__pivBars = { gold: { bars: db } }; G.__qtrail_1 = { gold: [{ t: NOW - 3000, c: px }, { t: NOW - 500, c: px }] };
  const L = [{ name: "session VWAP", price: px - 15 }, { name: "+1σ", price: px - 4.5 }, { name: "+2σ", price: px + 4.5 }, { name: "-1σ", price: px - 25 }, { name: "5m PP", price: px - 10 }];
  return { long: geo2("gold", L, px, "up"), short: geo2("gold", L, px, "down") };
};
const geo2 = (asset, L, tick, side) => { try { return B.impossibleGeo(asset, L, tick, side, ...PLAIN).why || ""; } catch (e) { return "ERROR " + e.message; } };
const gr = dojiCase(true, true), rg = dojiCase(false, false);
T("DOJI: GREEN doji then RED candle - the long is refused by the doji", /DOJI AFTER THE TREND[^\n]*SHORT only/.test(gr.long), gr.long);
T("DOJI: GREEN doji then RED candle - the doji never blocks the SHORT", !/DOJI/.test(gr.short), gr.short || "(clear)");
T(FLAT25 ? "DOJI: RED doji then GREEN candle - the short is still refused under the weekend $25 (its pink cushion catches it first)" : "DOJI: RED doji then GREEN candle - the short is refused (doji LONG only, or her rising candle first)", /DOJI AFTER THE TREND[^\n]*LONG only|HER CANDLE: the 5m candle is rising/.test(rg.short) || (FLAT25 && /PINK CUSHION/.test(rg.short)), rg.short);
T("DOJI: RED doji then GREEN candle - the doji never blocks the LONG", !/DOJI/.test(rg.long), rg.long || "(clear)");

// ---- fix499 (Love Oct 29 2026 10:44 PM PT: "ensure at every single rule in there is enforced and cannot get out if it does not meet every single one of those" + 10:45 PM:
// "diagnose why none of the safeguards worked ... As well as a solution." + 10:53 PM: "keep it all in one package"): her live-book rules replayed through the REAL door
// (impossibleGeo, the same flags the wire uses), both sides. Flags from bandlock.ts bandLockCheck: main / rejection / no-pink copy.
const LIVE = { main: [false, false, false, false, true, 0.55, true, false], rejection: [false, false, false, true, true, 0.55, true, false], copy: [false, false, true, false, false, 0, false, false] };
const geoL = (asset, L, tick, side, bk) => { try { G.__curBook465 = bk === "main" ? "recon-tog" : bk === "rejection" ? "recon-rej" : "recon-togp"; return B.impossibleGeo(asset, L, tick, side, ...LIVE[bk]).why || ""; } catch (e) { return "ERROR " + e.message; } };
const C0 = 4000, mirP = (x) => 2 * C0 - x, mirN = (n) => n.replace(/^-(\d)/, "M$1").replace(/^\+(\d)/, "-$1").replace(/^M(\d)/, "+$1").replace(/^5m R1$/, "5m S1x").replace(/^5m S1$/, "5m R1").replace("5m S1x", "5m S1").replace(/^5m R2$/, "5m S2x").replace(/^5m S2$/, "5m R2").replace("5m S2x", "5m S2");
const mirL = (L) => L.map((l) => ({ ...l, name: mirN(l.name), price: mirP(l.price) }));
// a quiet board at NOW (10 min into the 15m window, so the window's open bar and the live 5m candle are different bars): the 5m candle opened `open`, price trails to `tick`; the 15m window opened at `target` (gold's window target = the 15m open)
const board = (asset, tick, open, target, bb) => {
  const f0 = Math.floor(NOW / 300000) * 300, ws = Math.floor(NOW / 900000) * 900, k = asset === "btc" ? 1 : 1;
  const bars = [];
  for (let t = ws - 3600; t < ws; t += 60) bars.push({ t, o: target, h: target + 0.2 * k, l: target - 0.2 * k, c: target });
  bars.push({ t: ws, o: target, h: Math.max(target, tick), l: Math.min(target, tick), c: tick });
  for (let t = ws + 60; t < f0; t += 60) bars.push({ t, o: open, h: Math.max(open, tick), l: Math.min(open, tick), c: open });
  bars.push({ t: f0, o: open, h: Math.max(open, tick), l: Math.min(open, tick), c: tick });
  G.__sdGood = {}; G.__pivBars = { [asset]: { bars, at: NOW } };
  G.__qtrail_1 = { [asset]: [{ t: NOW - 4000, c: open }, { t: NOW - 2000, c: (open + tick) / 2 }, { t: NOW - 500, c: tick }] };
  G.__bbsr = { [asset]: { bbU: bb[0], bbL: bb[1], at: NOW } };
};
const bothWays = (name, asset, L, tick, open, target, bb, side, want, books = ["main", "rejection"]) => {
  for (const bk of books) {
    NOW = Date.parse("2026-10-30T05:40:25Z"); board(asset, tick, open, target, bb);
    const a = geoL(asset, L, tick, side, bk);
    const m = (x) => (asset === "btc" ? 2 * 80000 - x : mirP(x));
    board(asset, m(tick), m(open), m(target), [m(bb[1]), m(bb[0])]);
    const Lm = asset === "btc" ? L.map((l) => ({ ...l, name: mirN(l.name), price: m(l.price) })) : mirL(L);
    const b = geoL(asset, Lm, m(tick), side === "up" ? "down" : "up", bk);
    const okA = want ? want.test(a) : !/ZONE|BOLLINGER|PINK TO|\$10 LEVEL|IMPOSSIBILITY|THIRD/.test(a);
    const okB = want ? want.test(b) : !/ZONE|BOLLINGER|PINK TO|\$10 LEVEL|IMPOSSIBILITY|THIRD/.test(b);
    T(`${name} [${bk}, ${side === "up" ? "long" : "short"}]`, okA, a || "(clear)");
    T(`${name} [${bk}, mirror ${side === "up" ? "short" : "long"}]`, okB, b || "(clear)");
  }
};
// the 10:30 PM Oct 29 gold board (her long at 4009.10 went in 13c over the red zone's top)
const GZ = [{ name: "-1σ", price: 3995.8 }, { name: "session VWAP", price: 4004.54 }, { name: "+1σ", price: 4013.25 }, { name: "5m PP", price: 4001.4 }, { name: "5m R1", price: 4005.2 }, { name: "5m R2", price: 4008.97 }, { name: "5m S1", price: 3997.6 }, { name: "5m S2", price: 3993.8 }];
bothWays("fix497: the 10:30 PM gold long 13c over the red zone is refused ($1.50 either side of the zone)", "gold", GZ, 4009.10, 4008.6, 4004.0, [4016, 3990], "up", /(RED|GREEN) ZONE/, ["main", "rejection", "copy"]);
bothWays("fix377/fix242: no long inside the red zone", "gold", GZ, 4007.0, 4006.4, 4004.0, [4016, 3990], "up", /(RED|GREEN) ZONE/);
// a clean board: zone well below, Bollinger far, inside her share
const GC = [{ name: "-1σ", price: 3986.0 }, { name: "session VWAP", price: 4000.0 }, { name: "+1σ", price: 4014.0 }, { name: "5m PP", price: 4001.0 }, { name: "5m R1", price: 4004.0 }, { name: "5m R2", price: 4006.5 }, { name: "5m S1", price: 3998.0 }, { name: "5m S2", price: 3995.5 }];
const GF = [{ name: "-1σ", price: 3986.0 }, { name: "session VWAP", price: 4000.0 }, { name: "+1σ", price: 4014.0 }, { name: "5m PP", price: 3996.0 }, { name: "5m R1", price: 3998.5 }, { name: "5m R2", price: 4001.0 }, { name: "5m S1", price: 3993.0 }, { name: "5m S2", price: 3990.0 }]; // zones well under price, nothing within $1.50
bothWays("fix378/fix497: no long within $1.50 under the red zone", "gold", GC, 4002.7, 4002.3, 4002.7, [4016, 3990], "up", /(RED|GREEN) ZONE|PINK TO (RED|GREEN)/);
bothWays("fix497: $1.60 past the zone with the Bollinger far = her trade (nothing zone/Bollinger-shaped refuses it)", "gold", GC, 4008.1, 4007.6, 4008.1, [4013.0, 3988.0], "up", null);
bothWays("BOLLINGER CUSHION + fix497: no long $1.20 under the Bollinger upper", "gold", GC, 4008.1, 4007.6, 4008.1, [4009.3, 3988.0], "up", /BOLLINGER/);
bothWays("fix409/fix490: gold PINK TO RED - no long in the top 55% of pink -> red", "gold", GC, 4003.0, 4002.6, 4003.0, [4016, 3985], "up", /PINK TO (RED|GREEN)|FROM THE (RED|GREEN) ZONE|INSIDE THE (RED|GREEN) ZONE/);
bothWays("fix440: no gold long INTO an even $10 level (target 4009.6, within $1.50 of 4010)", "gold", GC, 4007.3, 4006.9, 4009.6, [4016, 3985], "up", /\$10 LEVEL/);
bothWays("fix485: gold 20% share on a $14 channel - no long at 86%", "gold", GC, 4012.0, 4011.6, 4012.0, [4020, 3985], "up", /IMPOSSIBILITY|THIRD|top/i);
bothWays("fix485: gold 20% share - a long at 50% of the channel is hers", "gold", GF, 4007.0, 4006.6, 4007.0, [4016, 3985], "up", null);
// BTC: zones 55% (fix450/fix467), 33% up to $500 (fix379/fix414), $50 from the zones (fix497)
const BZ = [{ name: "-1σ", price: 79500 }, { name: "session VWAP", price: 79900 }, { name: "+1σ", price: 80300 }, { name: "5m PP", price: 80000 }, { name: "5m S1", price: 79800 }, { name: "5m R1", price: 80200 }, { name: "5m R2", price: 80260 }, { name: "5m S2", price: 79740 }];
bothWays("fix467: BTC no long in the top 55% of pink -> red", "btc", BZ, 80130, 80110, 80130, [80700, 79300], "up", /PINK TO (RED|GREEN)|FROM THE (RED|GREEN) ZONE|INSIDE THE (RED|GREEN) ZONE/);
bothWays("fix497: BTC no long within $50 over the red zone", "btc", BZ, 80295, 80275, 80295, [80700, 79300], "up", /FROM THE (RED|GREEN) ZONE|IMPOSSIBILITY|THIRD/);
bothWays("fix379/fix414: BTC 33% on a $400 channel - no long at 80%", "btc", BZ.filter((l) => !/5m [RS]/.test(l.name)), 80220, 80200, 80220, [80700, 79300], "up", /IMPOSSIBILITY|THIRD|top/i);
bothWays("fix379: BTC a long at 45% of a $400 channel, zones far, is hers", "btc", BZ.filter((l) => !/5m [RS]/.test(l.name)).concat([{ name: "5m PP", price: 79850 }, { name: "5m R1", price: 79700 }, { name: "5m R2", price: 79650 }, { name: "5m S1", price: 79600 }, { name: "5m S2", price: 79550 }]), 80080, 80060, 80080, [80700, 79300], "up", null);
// HER FLIP (fix406/fix407) at the door for main + rejection: the 2-5m candle must be her colour by 10c gold
NOW = Date.parse("2026-10-30T05:40:25Z"); board("gold", 4007.0, 4007.4, 4007.0, [4016, 3985]);
{ const a = geoL("gold", GF, 4007.0, "up", "main"); T("fix406/fix407 [main, long]: a long with every 2-5m candle red (price 40c under their open) is refused by HER FLIP / HER CANDLE", /HER FLIP|HER CANDLE|falling/i.test(a), a); }
board("gold", 4007.0, 4006.6, 4007.0, [4016, 3985]);
G.__qtrail_1.gold.unshift({ t: NOW - 5000, c: 4006.4 }); // fix530: the candle traded RED first (under its 4006.6 open), then crossed it - a real red-to-green TURN
{ const a = geoL("gold", GF, 4007.0, "up", "main"); T("fix530 [main, long]: a 2-5m candle that TURNED red to green (no minimum) IS her flip (nothing flip-shaped refuses)", !/HER FLIP|HER CANDLE/.test(a), a || "(clear)"); }
// fix102 / HER CANDLE for the copy: candle colour always wins
board("gold", 4007.0, 4007.4, 4007.0, [4016, 3985]);
{ const a = geoL("gold", GF, 4007.0, "up", "copy"); T("fix102 [copy, long]: a falling 5m candle refuses the long (candle colour always wins)", /HER CANDLE|HER FLIP|falling/i.test(a), a); }
// fix242 / BREAK INTO A ZONE: this candle broke the session VWAP up and landed inside the red zone
NOW = Date.parse("2026-10-30T05:40:25Z"); board("gold", 4006.0, 4003.9, 4006.0, [4016, 3985]);
{ const a = geoL("gold", GZ, 4006.0, "up", "main"); T("fix242 / BREAK INTO A ZONE [main, long]: broke the VWAP up into the red zone - refused", /BREAK INTO A ZONE|RED ZONE OVER A BAND|INSIDE THE RED ZONE|FROM THE RED ZONE/.test(a), a); }

// ---- fix506 (Love Oct 30 2026 12:13 AM PT: "do not trade broken bollinger bands ever. any trade inside the red or green is expressly prohibited. no exceptions" + 12:14 AM: "only rejections of bollinger bands. ever. no exceptions"): a broken Bollinger is never traded; nothing inside the red or green, either side
{ NOW = Date.parse("2026-10-30T05:40:25Z"); const Lb = [{ name: "-1σ", price: 3986.0 }, { name: "session VWAP", price: 4000.0 }, { name: "+1σ", price: 4014.0 }, { name: "5m PP", price: 3996.0 }, { name: "5m R1", price: 3998.5 }, { name: "5m R2", price: 4001.0 }, { name: "5m S1", price: 3993.0 }, { name: "5m S2", price: 3990.0 }];
  board("gold", 4008.0, 4007.6, 4004.0, [4007.0, 3985.0]); // price $1 PAST the Bollinger upper
  const b1 = geoL("gold", Lb, 4008.0, "up", "main"); T("fix506: a long past the Bollinger upper is never taken (broken Bollinger)", /BOLLINGER BROKEN/.test(b1), b1 || "(clear)");
  board("gold", 4006.0, 4006.4, 4004.0, [4007.0, 3985.0]); // a short rejecting DOWN off the upper, price under it
  const b2 = geoL("gold", Lb, 4006.0, "down", "main"); T("fix506: a short rejecting off the Bollinger upper is still hers (nothing Bollinger-shaped refuses)", !/BOLLINGER/.test(b2), b2 || "(clear)");
  const z1 = typeof B.zoneTolerance497 === "function" ? B.zoneTolerance497("gold", Lb, 3999.8, "down") : ""; T("fix517: a SHORT from inside the red zone is NOT flagged (her 8:38 AM)", !/INSIDE THE RED ZONE/.test(z1), z1 || "(clear)");
  const z2 = typeof B.zoneTolerance497 === "function" ? B.zoneTolerance497("gold", Lb, 3991.5, "up") : ""; T("fix517: a LONG from inside the green zone is NOT flagged (her 8:38 AM)", !/INSIDE THE GREEN ZONE/.test(z2), z2 || "(clear)");
  const z3 = typeof B.zoneTolerance497 === "function" ? B.zoneTolerance497("gold", Lb, 3999.8, "up") : ""; T("fix497: a LONG inside the red zone is still prohibited", /INSIDE THE RED ZONE/.test(z3), z3 || "(clear)");
  const z4 = typeof B.zoneTolerance497 === "function" ? B.zoneTolerance497("gold", Lb, 3991.5, "down") : ""; T("fix497: a SHORT inside the green zone is still prohibited", /INSIDE THE GREEN ZONE/.test(z4), z4 || "(clear)");
}

// ---- fix507 (Love Oct 30 2026 12:22 AM PT: "enforce that as a strict tolerance not to be ignored. pink is only blocked at 15% of the session bands distance between each individual band for gold. 20% for btc. i already made this rule. it not being enforced"): beyond 15% gold / 20% BTC of the band-to-band distance, nothing pink-shaped refuses her
{ NOW = Date.parse("2026-10-30T05:40:25Z");
  const Lb = (pp) => [{ name: "-1σ", price: 78000.0 }, { name: "session VWAP", price: 78200.0 }, { name: "+1σ", price: 78400.0 }, { name: "5m PP", price: pp }, { name: "5m R1", price: 78900.0 }, { name: "5m R2", price: 78950.0 }, { name: "5m S1", price: 77500.0 }, { name: "5m S2", price: 77450.0 }];
  board("btc", 78080.0, 78070.0, 78065.0, [78380.0, 77600.0]); // $200 channel: her 20% = $40; the 5m candle is $10 green (her $5 flip)
  const f1 = geoL("btc", Lb(78190.0), 78080.0, "up", "main"); T("fix507/538: BTC long with the unbroken pink $110 over price (beyond her $75 weekday floor and her 20%) - the old $50 floor no longer waits for a pink break", !/PINK/.test(f1), f1 || "(clear)");
  const f2 = B.pinkLongWall432("btc", Lb(78098.0), 78080.0, "up"); T("fix507/fix509: BTC long with the pink $18 over (inside her temporary $25 cap, fix542) still waits for the pink at the door (fix432)", /UNBROKEN PINK/.test(f2), f2 || "(clear)");
  const Lg = (pp) => [{ name: "-1σ", price: 3990.0 }, { name: "session VWAP", price: 4000.0 }, { name: "+1σ", price: 4010.0 }, { name: "5m PP", price: pp }, { name: "5m R1", price: 4030.0 }, { name: "5m R2", price: 4032.0 }, { name: "5m S1", price: 3970.0 }, { name: "5m S2", price: 3968.0 }];
  board("gold", 3994.0, 3993.8, 3993.5, [4009.0, 3975.0]); // $10 channel: her 15% = $1.50
  const f3 = geoL("gold", Lg(3995.6), 3994.0, "up", "main"); T(FLAT25 ? "fix571 weekend $25: gold long with the pink $1.60 over (16%) is HELD by the flat $25 overlay (__PINKFLAT25 on)" : "fix507: gold long with the unbroken pink $1.60 over price (16% of a $10 channel) is not held by the pink", FLAT25 ? /PINK/.test(f3) : !/PINK/.test(f3), f3 || "(clear)");
  const f4 = B.pinkLongWall432("gold", Lg(3994.9), 3994.0, "up"); T("fix507/fix509: gold long with the pink 90c over (9%, inside her 15%) still waits for the pink at the door (fix432)", /UNBROKEN PINK/.test(f4), f4 || "(clear)");
}

// ---- fix509 (Love Oct 30 2026 5:35-5:55 AM PT questionnaire): her answers - Outs gone, notes in
{ NOW = Date.parse("2026-10-30T05:40:25Z");
  const Lb = [{ name: "-1σ", price: 78000.0 }, { name: "session VWAP", price: 78300.0 }, { name: "+1σ", price: 78600.0 }, { name: "5m PP", price: 77900.0 }, { name: "5m R1", price: 79200.0 }, { name: "5m R2", price: 79250.0 }, { name: "5m S1", price: 77300.0 }, { name: "5m S2", price: 77250.0 }];
  board("btc", 78080.0, 78070.0, 78065.0, [78135.0, 77600.0]); // $300 channel: 10% = $30, her $50 either side (c5); the Bollinger upper $55 over price
  const b1 = geoL("btc", Lb, 78080.0, "up", "main"); T("fix509 w9/w7: BTC Bollinger cushion is $50 or 10% whichever is SMALLER - upper $55 over price on a $300 channel is clear", !/BOLLINGER/.test(b1), b1 || "(clear)");
  board("btc", 78080.0, 78070.0, 78065.0, [78105.0, 77600.0]); // upper $25 over price, inside 10%
  const b2 = geoL("btc", Lb, 78080.0, "up", "main"); T("fix509 w7/c5: BTC Bollinger upper $25 over price (inside 10% of $300 and her $50) still refuses", /BOLLINGER/.test(b2), b2 || "(clear)");
  const Lg = [{ name: "-1σ", price: 3990.0 }, { name: "session VWAP", price: 4000.0 }, { name: "+1σ", price: 4010.0 }, { name: "5m PP", price: 3985.0 }, { name: "5m R1", price: 4030.0 }, { name: "5m R2", price: 4032.0 }, { name: "5m S1", price: 3970.0 }, { name: "5m S2", price: 3968.0 }];
  board("gold", 3992.0, 3991.8, 3991.5, [4009.0, 3975.0]);
  const g1 = geoL("gold", Lg, 3992.0, "up", "main"); T("fix509 w10: no TARGET PAST A BAND refusal exists any more", !/TARGET PAST A BAND/.test(g1), g1 || "(clear)");
  T("fix509 w3/w5/w4/w17: the retired labels are out of her door", !/PINK 10%:|PINK \$33|PINK HOLDS THE ADD-ON:|BOLLINGER OVER THE BAND|BOLLINGER BOUNCE IN HER CANDLE:|TREND THROUGH THE BANDS:|HER CANDLE \$10 \(BTC\):|BACK OVER BY \$10:/.test(require("fs").readFileSync(require("path").join(__dirname, "..", "src/lib/desk/bandlock.ts"), "utf8")), "labels");
}

// ---- fix514 (Love Oct 30 2026 7:13 AM PT: "The pink tolerance is still 15% of the bandwidth for gold and 20% for bitcoin." + 7:03 AM: "Do not retire the pink cushion ... keep it one thing. Make it all one thing"): one cushion for the pink, her w9 numbers
{ NOW = Date.parse("2026-10-30T05:40:25Z");
  const Lb = (pp) => [{ name: "-1σ", price: 78000.0 }, { name: "session VWAP", price: 78300.0 }, { name: "+1σ", price: 78600.0 }, { name: "5m PP", price: pp }, { name: "5m R1", price: 79200.0 }, { name: "5m S1", price: 77300.0 }];
  board("btc", 78080.0, 78070.0, 78065.0, [78600.0, 77600.0]); // $300 channel: cushion = min($50, 10%) = $30; tolerance 20% = $60
  const c1 = geoL("btc", Lb(78095.0), 78080.0, "up", "main"); T("fix514: BTC long with the unbroken pink $15 over (inside her 20% of a $300 channel) is refused", /PINK CUSHION/.test(c1), c1 || "(clear)");
  const c2 = geoL("btc", Lb(78102.0), 78080.0, "up", "main"); T("fix514: BTC long with the pink $22 over (inside her temporary $25 cap, fix542) is refused too", /PINK CUSHION/.test(c2), c2 || "(clear)");
  const c3 = geoL("btc", Lb(78190.0), 78080.0, "up", "main"); T("fix538: BTC long with the pink $110 over (beyond her $75 weekday floor and her 20%) is free of the pink", !/PINK CUSHION/.test(c3), c3 || "(clear)");
}
// fix592 (Love Nov 1 2026 9:03 AM PT: "Both paths. She can enter on either one." + "She cannot short a green rising candle. She cannot long a red falling candle."): flip path, born path, $5 BTC / 10c gold, any one 2-5m candle
{ NOW = Date.parse("2026-11-01T12:00:30Z"); for (const k of Object.keys(G)) if (/^__qtrail/.test(k)) G[k] = {};
  const t0 = sec("2026-11-01T12:00:00Z"), t1 = sec("2026-11-01T11:59:00Z");
  const set592 = (asset, po, pc, o, h, l) => { G.__pivBars = { [asset]: { bars: [{ t: t1, o: po, h: Math.max(po, pc), l: Math.min(po, pc), c: pc }, { t: t0, o, h, l, c: l }] } }; };
  set592("btc", 77870, 77856, 77856, 77860, 77845); T("fix592 BTC flip path: green then red, $6 under its open, goes", B.turnFlip530("btc", "down", 77850));
  set592("btc", 77870, 77856, 77856, 77860, 77845); T("fix592 BTC flip path: green then red, only $3 under, is refused", !B.turnFlip530("btc", "down", 77853));
  set592("btc", 77840, 77856, 77856, 77856, 77840); T("fix592 BTC born path: red right after a green one, $11 under, goes", B.turnFlip530("btc", "down", 77845));
  set592("btc", 77840, 77856, 77856, 77856, 77850); T("fix592 BTC born path: red right after a green one, only $3 under, is refused", !B.turnFlip530("btc", "down", 77853));
  set592("btc", 77870, 77856, 77856, 77856, 77840); T("fix592 BTC: red right after a red one with no flip is refused", !B.turnFlip530("btc", "down", 77845));
  set592("btc", 77856, 77840, 77840, 77850, 77835); T("fix592 BTC flip path: red then green, $6 over, goes", B.turnFlip530("btc", "up", 77846));
  set592("btc", 77856, 77840, 77840, 77856, 77840); T("fix592 BTC born path: green right after a red one, $10 over, goes", B.turnFlip530("btc", "up", 77850));
  set592("btc", 77840, 77856, 77856, 77870, 77856); T("fix592 hard block: she cannot short a green rising candle", !B.turnFlip530("btc", "down", 77865));
  set592("btc", 77856, 77840, 77840, 77840, 77825); T("fix592 hard block: she cannot long a red falling candle", !B.turnFlip530("btc", "up", 77830));
  set592("gold", 3870, 3871, 3871, 3871, 3870.5); T("fix592 gold born path: red right after a green one, 40c under, goes", B.turnFlip530("gold", "down", 3870.6));
  set592("gold", 3872, 3871, 3871, 3871.2, 3870.5); T("fix592 gold flip path: green then red, 20c under, goes", B.turnFlip530("gold", "down", 3870.8));
  set592("gold", 3872, 3871, 3871, 3871.2, 3870.5); T("fix592 gold flip path: green then red, 5c under, is refused", !B.turnFlip530("gold", "down", 3870.95));
}
// fix593 (Love Nov 1 2026 9:19 AM PT): her session-band scale, door and last line the same; past the last band = refused; pink not part of it
{ const near = (a, b) => Math.abs(a - b) < 0.0001, Sb = (below, above, extra) => [{ name: "-1σ", price: below }, { name: "+1σ", price: above }, ...(extra || [])];
  T("fix593 scale BTC: $80 channel = $25", near(B.sessionScale593("btc", 80), 25));
  T("fix593 scale BTC: $300 channel = 33% = $99", near(B.sessionScale593("btc", 300), 99));
  T("fix593 scale BTC: $600 channel = 20% = $120", near(B.sessionScale593("btc", 600), 120));
  T("fix593 scale gold: $10 channel = 33%", near(B.sessionScale593("gold", 10), 3.3));
  T("fix593 scale gold: $12 channel = 30.4%", near(B.sessionScale593("gold", 12), 3.648));
  T("fix593 scale gold: $15 channel = 26.5%", near(B.sessionScale593("gold", 15), 3.975));
  T("fix593 scale gold: $18 channel = 22.6%", near(B.sessionScale593("gold", 18), 4.068));
  T("fix593 scale gold: $20 channel = 20%", near(B.sessionScale593("gold", 20), 4));
  G.__pivBars = { btc: { bars: [] }, gold: { bars: [] } };
  T("fix593 send: BTC long $90 under the band on a $300 channel is refused", !!B.sessionBandSend593("btc", Sb(77700, 78000), 77910, "up"));
  T("fix593 send: BTC long $120 under the band on a $300 channel goes", !B.sessionBandSend593("btc", Sb(77700, 78000), 77880, "up"));
  T("fix593 send: BTC short mirror, $90 over the band, is refused", !!B.sessionBandSend593("btc", Sb(77700, 78000), 77790, "down"));
  T("fix593 send: price past the last session band is refused", /no channel/.test(B.sessionBandSend593("btc", Sb(77700, 78000), 78100, "up")));
  T("fix593 send: gold long $3 under on a $15 channel is refused", !!B.sessionBandSend593("gold", Sb(3870, 3885), 3882, "up"));
  T("fix593 send: gold long $5 under on a $15 channel goes", !B.sessionBandSend593("gold", Sb(3870, 3885), 3880, "up"));
  T("fix593 send: a Bollinger line is not part of this check", !B.sessionBandSend593("btc", Sb(77700, 78000, [{ name: "BB upper", price: 77885 }]), 77880, "up"));
  T("fix593 send: pink is not part of this check", !B.sessionBandSend593("btc", Sb(77700, 78000, [{ name: "5m PP", price: 77885 }]), 77880, "up"));
  const Z593 = { r1: 90000, r2: 91000, s1: 1000, s2: 900 };
  T("fix593 door: BTC long $90 under the band on a $300 channel is refused", !!B.reachWall429("btc", Sb(77700, 78000), 77910, "up", Z593, 77905));
  T("fix593 door: BTC long $120 under the band on a $300 channel goes", !B.reachWall429("btc", Sb(77700, 78000), 77880, "up", Z593, 77875));
  T("fix593 door: gold long $3 under on a $15 channel is refused", !!B.reachWall429("gold", Sb(3870, 3885), 3882, "up", Z593, 3881));
  T("fix593 door: gold long $5 under on a $15 channel goes", !B.reachWall429("gold", Sb(3870, 3885), 3880, "up", Z593, 3879));
  T("fix593 door: price past the last session band is refused", /no channel/.test(B.reachWall429("btc", Sb(77700, 78000), 78100, "up", Z593, 78090)));
}
// fix594 (Love Nov 1 2026 9:45 AM PT): top 55% of pink to red refuses longs, bottom 55% of pink to green refuses shorts, nothing past either boundary, both assets; door and last line the same test
{ const Zb = (p, s1, s2, r1, r2) => [{ name: "5m PP", price: p }, { name: "5m S1", price: s1 }, { name: "5m S2", price: s2 }, { name: "5m R1", price: r1 }, { name: "5m R2", price: r2 }], ZB = Zb(78000, 77900, 77800, 78100, 78200), ZG = Zb(3880, 3870, 3860, 3890, 3900);
  T("fix594 BTC short at 30% from pink goes", !B.zoneSend594("btc", ZB, 77970, "down"));
  T("fix594 BTC short at 50% from pink, in the bottom 55%, is refused", /bottom 55%/.test(B.zoneSend594("btc", ZB, 77950, "down")));
  T("fix594 BTC short inside the green zone is refused", /past the green/.test(B.zoneSend594("btc", ZB, 77850, "down")));
  T("fix594 BTC short under the whole green zone is refused, not free and clear", /past the green/.test(B.zoneSend594("btc", ZB, 77700, "down")));
  T("fix594 BTC long at 30% from pink goes", !B.zoneSend594("btc", ZB, 78030, "up"));
  T("fix594 BTC long at 50% from pink, in the top 55%, is refused", /top 55%/.test(B.zoneSend594("btc", ZB, 78050, "up")));
  T("fix594 BTC long over the whole red zone is refused, not free and clear", /past the red/.test(B.zoneSend594("btc", ZB, 78300, "up")));
  T("fix594 a long rejecting off the green zone is not flagged", !B.zoneSend594("btc", ZB, 77850, "up"));
  T("fix594 a short rejecting off the red zone is not flagged", !B.zoneSend594("btc", ZB, 78150, "down"));
  T("fix594 gold short at 60% from pink is refused", /bottom 55%/.test(B.zoneSend594("gold", ZG, 3874, "down")));
  T("fix594 gold long at 30% from pink goes", !B.zoneSend594("gold", ZG, 3883, "up"));
  T("fix594 gold long past the red boundary is refused", /past the red/.test(B.zoneSend594("gold", ZG, 3905, "up")));
  T("fix594 last line: zones that can't be read are refused", /can't be read/.test(B.zoneSend594("btc", [], 78000, "up")));
  G.__door594Test = true; T("fix594 door: the same test refuses at the door", /bottom 55%/.test(geo("btc", ZB, 77950, "down", "main"))); T("fix594 door: nothing past the red boundary at the door", /PAST THE RED/.test(geo("btc", ZB, 78300, "up", "main"))); G.__door594Test = false;
}
const ok = res.every((r) => r.ok);
for (const r of res) console.log((r.ok ? "  ✓ " : "  ✗ ") + r.name + (r.ok ? "" : "  <- " + r.detail));
console.log(ok ? "BEHAVIOUR ✓ - she acts on every one of these rules." : "BEHAVIOUR ✗ - a rule is in her code but she does not act on it. Refuse the install, tell Love.");
try { fs.appendFileSync(path.join(ROOT, "data/behaviour-umpire.jsonl"), JSON.stringify({ at: new Date().toISOString(), file, ok, res }) + "\n"); } catch {}
process.exit(ok ? 0 : 1);
