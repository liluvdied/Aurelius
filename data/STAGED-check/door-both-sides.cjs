// HER DOOR, BOTH SIDES (R204/R206, Love Oct 29 2026 1:15 PM PT: "double check that every rule and cornerstone works on both sides, for main and rejection"). READ-ONLY. Loads her REAL
// bandlock.ts (the whole file, her real bandLockCheck door) with stubbed price/band feeds in a throw-away folder, and plays each wall LONG and its mirror SHORT for main + rejection.
// A row passes only if the wall's OWN refusal text appears for the bad side. Usage: node door-both-sides.cjs [path/to/bandlock.ts]
const fs = require("fs"), path = require("path"), os = require("os");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const file = process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "door-")); fs.mkdirSync(path.join(tmp, "data")); process.chdir(tmp); // anything the walls write goes nowhere real
const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { target: 99, module: 1 } }).outputText;
const Q = { gold: null, btc: null };
const M5stub = { M5: globalThis, D5: (f) => path.join(tmp, "data", f), SHARED: globalThis, FIVE_DIR: path.join(tmp, "data"), OWN_NAMES: [] };
const stubs = { "./five5m-mem": M5stub, "./recon5m": { RECON: new Set(["recon-tog", "recon-rej", "recon-dly", "recon-rej5"]) }, "./quotes": { quoteTick: (a) => Q[a], feedHealth: () => ({ ok: true }) }, "./recon": { RECON: new Set(["recon-tog", "recon-rej", "recon-dly", "recon-togp", "recon-rejx", "recon-togr", "recon-rej5", "recon-top", "recon-paper", "recon-ogp5"]) } };
const mod = { exports: {} }; new Function("require", "module", "exports", code)((m) => stubs[m] || require(m), mod, mod.exports); const BL = mod.exports;
const G = globalThis;
const now = Date.now(), f0 = Math.floor(now / 300000) * 300;
function scene(asset, L, tick, o5, hl, bb) {
  G.__sdGood = {}; G.__brokenWalls = {}; G.__rejMem = {}; // fresh memory per scene (a test, not her trading)
  Q[asset] = { c: tick, at: Date.now() };
  G.__lawBands = { ...(G.__lawBands || {}), [asset]: { L, at: Date.now() } };
  // 12 closed 5m candles (flat, for zones) + this candle's 1m bars: open o5, then her low/high, now at tick
  const bars = []; for (let k = 12; k >= 1; k--) { const t = f0 - k * 300; bars.push({ t, o: o5, h: o5 + (asset === "btc" ? 40 : 1), l: o5 - (asset === "btc" ? 40 : 1), c: o5, v: 100 }); }
  bars.push({ t: f0, o: o5, h: hl.h, l: hl.l, c: tick, v: 100 });
  G.__pivBars = { ...(G.__pivBars || {}), [asset]: { bars, at: Date.now() } };
  G.__bbsr = { ...(G.__bbsr || {}), [asset]: { ...(bb || {}), at: Date.now() } };
}
const C = 4000, mir = (x) => 2 * C - x, swap = (n) => String(n).replace(/^-(\d)/, "+$1#").replace(/^\+(\d)(?!#)/, "-$1").replace("#", "").replace(/^5m R1$/, "5m S1#").replace(/^5m S1$/, "5m R1").replace("5m S1#", "5m S1").replace("BB upper", "BB lower#").replace("BB lower", "BB upper").replace("BB lower#", "BB lower");
const rows = [];
const BOOKS = (process.env.BOOKS || "recon-tog,recon-rej").split(",");
function both(rule, asset, L, tick, side, o5, hl, bb, rx, books = BOOKS) {
  const sc = asset === "btc" ? 50 : 1, M = (x) => (asset === "btc" ? 2 * 80000 - x : mir(x));
  let longOk = true, shortOk = true, why = [];
  for (const book of books) {
    scene(asset, L, tick, o5, hl, bb); const a = BL.bandLockCheck(book, asset, side, "KX" + asset.toUpperCase() + "15M-TEST");
    const ra = !a.ok && rx.test(a.reason);
    scene(asset, L.map((l) => ({ ...l, name: swap(l.name), price: M(l.price) })), M(tick), M(o5), { h: M(hl.l), l: M(hl.h) }, bb && { bbU: bb.bbL && M(bb.bbL), bbL: bb.bbU && M(bb.bbU) });
    const b = BL.bandLockCheck(book, asset, side === "up" ? "down" : "up", "KX" + asset.toUpperCase() + "15M-TEST");
    const rb = !b.ok && rx.test(b.reason);
    if (side === "up") { longOk = longOk && ra; shortOk = shortOk && rb; } else { shortOk = shortOk && ra; longOk = longOk && rb; }
    if (!ra) why.push(`${book} ${side}: ${a.ok ? "allowed" : a.reason.slice(0, 90)}`); if (!rb) why.push(`${book} ${side === "up" ? "down" : "up"}: ${b.ok ? "allowed" : b.reason.slice(0, 90)}`);
  }
  rows.push({ rule, longOk, shortOk, why });
}
// gold 55% pink -> red (long) / green -> pink (short): pink 4000, red (5m R1) 4004, green (5m S1) 3996; long at 81% of pink->red
const Lg = [{ name: "-1σ", price: 3990 }, { name: "session VWAP", price: 4010 }, { name: "5m PP", price: 4000 }, { name: "5m R1", price: 4004 }, { name: "5m S1", price: 3996 }];
both("Gold 55%: no long in the top 55% pink->red / no short in the bottom 55% green->pink (fix409/439)", "gold", Lg, 4003.25, "up", 4002.0, { h: 4003.4, l: 4001.9 }, null, /PINK TO (RED|GREEN)/);
// BTC 55% (fix450): pink 80000, R1 80200, S1 79800 - long at 80%
const Lb = [{ name: "-1σ", price: 79500 }, { name: "session VWAP", price: 80500 }, { name: "5m PP", price: 80000 }, { name: "5m R1", price: 80200 }, { name: "5m S1", price: 79800 }];
both("BTC 55%: same, BTC (fix450)", "btc", Lb, 80160, "up", 80100, { h: 80170, l: 80095 }, null, /PINK TO (RED|GREEN)/);
// Bollinger cushion: long $0.50 under the Bollinger upper
both("Bollinger cushion: no long just under the upper / no short just over the lower", "gold", [{ name: "-1σ", price: 3990 }, { name: "session VWAP", price: 4010 }, { name: "5m PP", price: 3995 }], 4001.5, "up", 4000.8, { h: 4001.6, l: 4000.7 }, { bbU: 4002.0, bbL: 3994.0 }, /BOLLINGER/);
// zones: long inside the red zone (fix377)
both("Zone walls: no long inside the red zone / no short inside the green zone (fix377)", "gold", [{ name: "-1σ", price: 3990 }, { name: "session VWAP", price: 4010 }, { name: "5m PP", price: 3996 }, { name: "5m R1", price: 4002 }, { name: "5m S1", price: 3990.5 }], 4003.0, "up", 4002.6, { h: 4003.1, l: 4002.5 }, null, /RED ZONE|GREEN ZONE|ZONE/);
// her flip: long with every 2-5m candle red (price under the open)
both("Her flip: a long needs a 2-5m candle green / a short needs one red (fix406/433)", "gold", [{ name: "-1σ", price: 3990 }, { name: "session VWAP", price: 4010 }, { name: "5m PP", price: 3995 }], 4000.4, "up", 4001.2, { h: 4001.3, l: 4000.3 }, null, /HER FLIP|HER CANDLE/);

// HER 33% (session band to session band): a long at 85% up, a short at 15% (mirror)
both("Her hard 33%: no long in the top 33% / no short in the bottom 33%", "gold", [{ name: "-1σ", price: 3990 }, { name: "session VWAP", price: 4010 }, { name: "5m PP", price: 3985 }], 4007.0, "up", 4006.5, { h: 4007.1, l: 4006.4 }, null, /33%|THIRD|IMPOSSIB|ON HER SIDE|top \d+%|bottom \d+%/);
// a 25% gold channel ($20): the old share was 20% - 76% up must still be refused at 33%
both("Hard 33% on a wide gold channel ($20 - was 20%)", "gold", [{ name: "-1σ", price: 3990 }, { name: "session VWAP", price: 4010 }, { name: "5m PP", price: 3985 }], 4005.3, "up", 4005.0, { h: 4005.4, l: 4004.9 }, null, /33%|THIRD|IMPOSSIB|ON HER SIDE|top \d+%|bottom \d+%/);
// pink inside 15%: long $1.20 under the pink in a $20 channel
both("Never into an unbroken pink inside 15% gold", "gold", [{ name: "-1σ", price: 3990 }, { name: "session VWAP", price: 4010 }, { name: "5m PP", price: 4001.2 }], 4000.0, "up", 3999.6, { h: 4000.1, l: 3999.5 }, null, /PINK/);
const bad = rows.filter((r) => !r.longOk || !r.shortOk);
for (const r of rows) console.log(`ROW|${r.rule}|${r.longOk ? 1 : 0}|${r.shortOk ? 1 : 0}|${r.why.join(" ; ").slice(0, 400)}`);
console.log(bad.length ? `DOOR BOTH SIDES: ${bad.length} FAIL` : "DOOR BOTH SIDES ✓ - every wall played refuses its bad side, long and short, main + rejection.");
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
process.exit(bad.length ? 1 : 0);
