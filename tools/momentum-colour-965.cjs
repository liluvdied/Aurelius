// fix965 proof: momentum needs her 2m or 5m candle her colour; no long at / past the red zone, no short at / past the green zone. Nov 7 5:09 PM BNB long refused.
const fs = require("fs"), path = require("path"), os = require("os");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("MOMENTUM COLOUR 965 TEST: FAIL - " + m); } };
const M = fs.readFileSync(path.join(root, "src/lib/desk/momcoins833.ts"), "utf8"), N = fs.readFileSync(path.join(root, "src/lib/desk/momentum.ts"), "utf8");
t(M.includes("const w965 = gate965(bs, spot, nowS, g.side, ln965.pink, c.id)"), "the coin momentum books do not ask her colour / zones");
t(N.includes("if (gate965m([...k.bars, ...(k.cur ? [k.cur] : [])], px, now, g.side, z965.r1, z965.s1, id)) continue;"), "BTC / gold momentum does not ask her colour / zones");
const ts = require(path.join(root, "node_modules/typescript")), out = fs.mkdtempSync(path.join(os.tmpdir(), "m965-"));
const src = N.slice(N.indexOf("export function momentumColour("), N.indexOf("function zones965(")) + M.slice(M.indexOf("export function gate965("), M.indexOf("/** pure signals. closed = closed 1m bars"));
fs.writeFileSync(path.join(out, "g.js"), ts.transpileModule(src, { compilerOptions: { module: 1, target: 99 } }).outputText);
const { gate965, gate965m } = require(path.join(out, "g.js"));
const now = 1794100191, f5 = Math.floor(now / 300) * 300, f2 = Math.floor(now / 120) * 120;
const flat = []; for (let x = f5 - 3000; x < f5; x += 60) flat.push({ t: x, o: 600, h: 601, l: 599, c: 600 });
// Below the open, but rebounded by the full push from the low.
let bs = [...flat, { t: f5, o: 603, h: 603, l: 601, c: 601.5 }];
t(gate965(bs, 602, now, "up", 0) === "", "a qualifying rebound must pass below the open");
t(/HER COLOUR/.test(gate965(bs, 601.05, now, "up", 0)), "a rebound below the push must fail");
const btc = [{ t: f5 * 1000, h: 80030, l: 80000 }];
t(gate965m(btc, 80005, now * 1000, "up", 0, 0, "btc") === "", "BTC must pass at exactly $5 off the low");
t(/HER COLOUR/.test(gate965m(btc, 80004.99, now * 1000, "up", 0, 0, "btc")), "BTC must fail one cent before the push");
t(gate965m(btc, 80025, now * 1000, "down", 0, 0, "btc") === "", "short must measure off the high");
// 2m green -> allowed if not in the red zone
bs = [...flat, { t: f5, o: 600.2, h: 600.5, l: 600, c: 600.3 }, { t: f5 + 60, o: 600.3, h: 600.6, l: 600.2, c: 600.5 }, { t: f5 + 120, o: 600.4, h: 600.8, l: 600.4, c: 600.7 }, { t: f5 + 180, o: 600.7, h: 600.9, l: 600.6, c: 600.8 }];
t(gate965(bs, 600.8, now, "up", 600.1) === "", "her 2m / 5m green under the red zone goes");
t(/RED ZONE/.test(gate965(bs, 603.5, now, "up", 600.1)), "a long at / past the red zone (pink + 5m avg range) must be refused");
// 5:32 PM BNB (Coinbase 5m): closes under the Bollinger lower at 5:20 / 5:25, the 5:30 window bounced to 694.69 under the middle -> no long
{ const cl = [695.17,695.12,695.35,695.24,695.33,695.28,694.89,694.8,694.52]; const base = []; const f0 = f5 - 300 * 30; for (let i = 0; i < 21; i++) base.push(695.0 + (i % 3) * 0.1); const all = [...base, ...cl];
  const b1 = []; all.forEach((c, i) => { const t0 = f0 + i * 300; for (let k = 0; k < 5; k++) b1.push({ t: t0 + k * 60, o: c, h: c + 0.05, l: c - 0.05, c }); });
  const T = f0 + all.length * 300; b1.push({ t: T, o: 694.34, h: 694.7, l: 694.34, c: 694.6 }, { t: T + 60, o: 694.6, h: 694.7, l: 694.5, c: 694.69 });
  t(/BOLLINGER BROKE DOWN/.test(gate965(b1, 694.69, T + 125, "up", 694.8)), "5:32 PM BNB: the long after the Bollinger break down (under the middle) must be refused: " + gate965(b1, 694.69, T + 125, "up", 694.8)); }
console.log(ok ? "MOMENTUM COLOUR 965 TEST ✓ - momentum (BNB / SOL / DOGE / BTC first-2 coins, BTC / gold momentum and the copies that follow them) needs her 2m or 5m candle her colour; no long in / past the red zone, no short in / past the green zone; no long after a Bollinger break down until price is back over the Bollinger lower (and the mirror)." : "MOMENTUM COLOUR 965 TEST: FAIL");
process.exit(ok ? 0 : 1);
