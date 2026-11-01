const ts = require((process.argv[2] || process.cwd()) + "/node_modules/typescript"); const fs = require("fs");
const src = fs.readFileSync(process.argv[3] || "src/lib/desk/pivotbooks.ts", "utf8");
const grab = (re) => src.match(re)[0];
const code = [grab(/export function resample[\s\S]*?\n}\n/), grab(/export function pivot\(bars[\s\S]*?\n}\n/), grab(/function liveBars565[\s\S]*?\n}\n/), grab(/export function onePink565[\s\S]*?\n}\n/), grab(/function pinkFresh565[\s\S]*?\n}\n/)].join("\n").replace(/export /g, "");
const js = ts.transpileModule(code, { compilerOptions: { target: 99 } }).outputText;
const { onePink565, pinkFresh565 } = new Function(js + "; return { onePink565, pinkFresh565 };")();
// synthetic market
const now = Date.now(); const nowS = Math.floor(now / 1000); const m0 = Math.floor(nowS / 60) * 60;
let px = 77000, truth = []; for (let i = 300; i >= 0; i--) { const t = m0 - i * 60; const o = px; let h = o, l = o; for (let k = 0; k < 6; k++) { px += (Math.sin(i * 7 + k) * 9); h = Math.max(h, px); l = Math.min(l, px); } truth.push({ t, o, h, l, c: px }); }
// chart snapshot: fetched 20 s ago -> last (current) bar stale, real move since
const chart = truth.map(x => ({ ...x })); const cur = chart[chart.length - 1]; cur.h = Math.max(cur.o, cur.c - 40); cur.l = Math.min(cur.o, cur.l); cur.c = cur.c - 40;
const startCur5 = Math.floor(nowS / 300) * 300;
const ticks = []; for (const b of truth.filter(x => x.t >= startCur5)) { ticks.push({ t: b.t * 1000 + 1000, c: b.o }, { t: b.t * 1000 + 2000, c: b.h }, { t: b.t * 1000 + 3000, c: b.l }, { t: Math.min(now, b.t * 1000 + 50000), c: b.c }); }
ticks.sort((a, b) => a.t - b.t);
globalThis.__pivBars = { btc: { at: now - 20000, bars: chart } }; globalThis.__qtrail_32 = { btc: ticks };
const p = onePink565("btc");
// independent Pine reference on the TRUE bars
const f5 = new Map(); for (const x of truth) { const k = Math.floor(x.t / 300) * 300; const y = f5.get(k); if (!y) f5.set(k, { ...x }); else { y.h = Math.max(y.h, x.h); y.l = Math.min(y.l, x.l); y.c = x.c; } }
let ema = null; const rng = []; for (const x of f5.values()) { const pp = (x.h + x.l + x.c) / 3; ema = ema === null ? pp : 0.25 * pp + 0.75 * ema; rng.push(x.h - x.l); }
const a = rng.slice(-7).reduce((s, v) => s + v, 0) / 7;
console.log("onePink pp", p.pp.toFixed(2), "r1", p.r1.toFixed(2), "s1", p.s1.toFixed(2));
console.log("chart    pp", ema.toFixed(2), "r1", (ema + a).toFixed(2), "s1", (ema - a).toFixed(2));
delete globalThis.__qtrail_32; globalThis.__onePinkMemo565 = {};
const q = onePink565("btc"); console.log("without live ticks pp", q.pp.toFixed(2), "(stale snapshot, off by", (q.pp - ema).toFixed(2) + ")");
globalThis.__qtrail_32 = { btc: ticks }; globalThis.__onePinkMemo565 = {};
const L0 = [{ name: "5m PP", price: 1, unit: 1 }, { name: "+1σ", price: 9, unit: 1 }];
const w1 = pinkFresh565("btc", L0)[0].price; ticks.push({ t: now, c: px + 300 }); const w2 = pinkFresh565("btc", L0)[0].price;
const fresh = Math.abs(w1 - ema) < 0.01 && w2 > w1 && pinkFresh565("btc", L0)[1].price === 9;
console.log("wall pink at the wire:", w1.toFixed(2), "-> after a new tick", w2.toFixed(2), fresh ? "(fresh ✓)" : "(STALE)");
console.log(fresh && Math.abs(p.pp - ema) < 0.01 && Math.abs(p.a - a) < 0.01 ? "ONE PINK MATCHES CHART ✓" : "MISMATCH");
