// fix794 V.111 - 2 · LDC FADE · PAPER (Love Nov 6 2026 ~3:53 AM PT: "instead of no shorts when price is over vwap , can you look into shorting when LDC ribbon is green? and longing
// when it's red? ... cannnn you incorporate thattt into a strategy too bb ?? on its own book ... whichever configuration of those elements that tests best").
// PAPER ONLY: never places, sizes, cancels or reads a live order; own file data/v111-2-ldc-794.json, own fill-log venue "paper-v111-2-ldc".
// THE BOOK = the winner of data/reports/ldc-study-nov6.md (config B3): V.111 - 2's take of each window, kept only when the 1m LDC FADES it - a SHORT only while the 1m LDC is
// GREEN (buy state), a LONG only while it is RED (sell state); otherwise no trade that window. $5 at V.111 - 2's real ask that second; scored on the live exit (half at 75% of
// the way to $1, the rest at 95% of the way, else the bell), settled from Kalshi.
// LDC = a rebuild of TradingView's "Machine Learning: Lorentzian Classification" with its published defaults (features RSI14, WT 10/11, CCI20, ADX20, RSI9; k = 8 neighbours,
// up to 2000 bars, every 4th bar, label = close 4 bars on; volatility filter on) on the desk's own closed 1m bars (__pivBars) - her TradingView settings may differ.
// It also writes the LDC colour on every V.111 - 2 take (row.ldc794 - BESTIE's live rows are those same rows) and to data/ldc-colour-794.jsonl, so real history builds up.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const BOOK794 = "V.111 - 2 · LDC FADE", VENUE794 = "paper-v111-2-ldc";
const FILE = "v111-2-ldc-794.json", STAKE = 5;
type B794 = { t: number; o: number; h: number; l: number; c: number };
const emaA = (x: number[], n: number) => { const a = 2 / (n + 1), o = [x[0]]; for (let i = 1; i < x.length; i++) o.push(a * x[i] + (1 - a) * o[i - 1]); return o; };
const rmaA = (x: number[], n: number) => { const a = 1 / n, o = [x[0]]; for (let i = 1; i < x.length; i++) o.push(a * x[i] + (1 - a) * o[i - 1]); return o; };
const smaA = (x: number[], n: number) => x.map((_, i) => (i < n - 1 ? x[i] : x.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n));
const rsiA = (c: number[], n: number) => { const d = c.map((v, i) => (i ? v - c[i - 1] : 0)); const up = rmaA(d.map((v) => Math.max(v, 0)), n), dn = rmaA(d.map((v) => Math.max(-v, 0)), n); return up.map((u, i) => (dn[i] > 0 ? 100 - 100 / (1 + u / dn[i]) : 100)); };
const normA = (x: number[]) => { let lo = Infinity, hi = -Infinity; return x.map((v) => { lo = Math.min(lo, v); hi = Math.max(hi, v); return hi > lo ? (v - lo) / (hi - lo) : 0.5; }); };
/** the classifier's state on the last bar: 1 = buy (green), -1 = sell (red), 0 = none yet; plus its raw prediction. */
export function ldcState794(bars: B794[], k = 8, back = 2000): { sig: number; pred: number; n: number } {
  const b = bars.slice(-(back + 60)), n = b.length; if (n < 60) return { sig: 0, pred: 0, n };
  const c = b.map((x) => x.c), h = b.map((x) => x.h), l = b.map((x) => x.l), hlc3 = b.map((x) => (x.h + x.l + x.c) / 3);
  const f1 = rsiA(c, 14).map((v) => v / 100), f5 = rsiA(c, 9).map((v) => v / 100);
  const esa = emaA(hlc3, 10), dd = emaA(hlc3.map((v, i) => Math.abs(v - esa[i])), 10), ci = hlc3.map((v, i) => (v - esa[i]) / (0.015 * (dd[i] > 0 ? dd[i] : 1e-9))), wt1 = emaA(ci, 11), wt2 = smaA(wt1, 4), f2 = normA(wt1.map((v, i) => v - wt2[i]));
  const m = smaA(c, 20), md = c.map((_, i) => { const s = c.slice(Math.max(0, i - 19), i + 1); return s.reduce((a, v) => a + Math.abs(v - m[i]), 0) / s.length; }), f3 = normA(c.map((v, i) => (v - m[i]) / (0.015 * (md[i] > 0 ? md[i] : 1e-9))));
  const tr = b.map((x, i) => (i ? Math.max(x.h - x.l, Math.abs(x.h - c[i - 1]), Math.abs(x.l - c[i - 1])) : x.h - x.l));
  const pdm = b.map((x, i) => { if (!i) return 0; const u = x.h - h[i - 1], d = l[i - 1] - x.l; return u > d && u > 0 ? u : 0; }), ndm = b.map((x, i) => { if (!i) return 0; const u = x.h - h[i - 1], d = l[i - 1] - x.l; return d > u && d > 0 ? d : 0; });
  const atr = rmaA(tr, 20), pdi = rmaA(pdm, 20).map((v, i) => (100 * v) / (atr[i] || 1e-9)), ndi = rmaA(ndm, 20).map((v, i) => (100 * v) / (atr[i] || 1e-9));
  const f4 = rmaA(pdi.map((p, i) => (100 * Math.abs(p - ndi[i])) / (p + ndi[i] || 1e-9)), 20).map((v) => v / 100);
  const F = b.map((_, i) => [f1[i], f2[i], f3[i], f4[i], f5[i]]);
  const y = c.map((v, i) => (i + 4 < n ? Math.sign(c[i + 4] - v) : 0));
  const vol1 = emaA(tr, 1), vol10 = emaA(tr, 10);
  let sig = 0, pred = 0;
  for (let i = Math.max(0, n - 120); i < n; i++) { // the state of the last stretch (the signal holds until the next one)
    const kept: [number, number][] = []; let cut = -1;
    for (let j = Math.max(0, i - back); j < i - 4; j++) {
      if (j % 4) continue;
      let dist = 0; for (let f = 0; f < 5; f++) dist += Math.log1p(Math.abs(F[j][f] - F[i][f]));
      if (dist >= cut) { kept.push([dist, j]); if (kept.length > k) { kept.sort((a, z) => a[0] - z[0]); kept.splice(0, kept.length - k); cut = kept[Math.round((k * 3) / 4) - 1][0]; } }
    }
    pred = kept.reduce((s, [, j]) => s + y[j], 0);
    if (vol1[i] > vol10[i]) { if (pred > 0) sig = 1; else if (pred < 0) sig = -1; }
  }
  return { sig, pred, n };
}
function st(): { rows: any[]; skipped: number } {
  if (G.__v1112ldc794) return G.__v1112ldc794;
  let s = { rows: [] as any[], skipped: 0 }; try { if (existsSync(D(FILE))) s = { rows: [], skipped: 0, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {}
  G.__v1112ldc794 = s; return s;
}
function save() { try { const s = st(); s.rows = s.rows.slice(-4000); writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
function bars1m(asset: string): B794[] { const raw = G.__pivBars?.[asset]?.bars; if (!Array.isArray(raw)) return []; const m0 = Math.floor(Date.now() / 60000) * 60; return raw.filter((x: any) => Number(x.t) < m0).map((x: any) => ({ t: Number(x.t), o: +x.o, h: +x.h, l: +x.l, c: +x.c })); }
/** V.111 - 2 just took `her`: write the LDC colour on her row, and take the fade if it agrees. */
export function ldcTake794(her: any): any {
  try {
    if (!her || (her.side !== "up" && her.side !== "down") || !her.ticker) return null;
    const L = ldcState794(bars1m(String(her.asset)));
    her.ldc794 = { sig: L.sig, colour: L.sig > 0 ? "green" : L.sig < 0 ? "red" : "none", pred: L.pred, bars: L.n };
    try { appendFileSync(D("ldc-colour-794.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: her.ticker, asset: her.asset, side: her.side, setup: her.setup, ...her.ldc794 }) + "\n"); } catch {}
    const s = st(), id = `${her.ticker}:v1112ldc`; if (s.rows.some((r) => r.id === id)) return null;
    const fade = (her.side === "down" && L.sig > 0) || (her.side === "up" && L.sig < 0);
    const ask = Number(her.ask);
    if (!fade || !(ask > 0.01 && ask < 0.99)) { s.skipped = (Number(s.skipped) || 0) + 1; save(); return null; }
    const r = { id, book: BOOK794, setup: String(her.setup || ""), tf: her.tf, asset: her.asset, ticker: her.ticker, closeTime: her.closeTime, at: her.at, of: String(her.id || ""), side: her.side, ask, multiple: Math.round((1 / ask) * 100) / 100,
      contracts: STAKE / ask, stake: STAKE, ldc: her.ldc794.colour, bestBid: 0, half: false, halfBid: null, soldBid: null, result: "open", pnlHold: null, pnlTp: null };
    s.rows.push(r); save(); return r;
  } catch { return null; }
}
function logFill794(r: any) {
  try {
    let rows: any[] = []; try { const j = JSON.parse(readFileSync(D("fill-log.json"), "utf8")); if (Array.isArray(j)) rows = j; else return; } catch { return; }
    const id = `${r.id}:banked`; if (rows.some((e) => e && e.id === id)) return;
    rows.push({ id, at: new Date().toISOString(), kind: "banked", tradeId: r.id, asset: r.asset, ticker: r.ticker, side: r.side, venue: VENUE794, stake: r.stake, ask: r.ask, multiple: r.multiple, profit: r.pnlTp, pattern: `${BOOK794} · ${r.setup}`, opposite: false, target: null, spot: null, vwap: null, peak: r.bestBid || null, book: BOOK794, setup: r.setup, held: r.pnlHold });
    writeFileSync(D("fill-log.json"), JSON.stringify(rows.filter((e) => e && typeof e.id === "string").sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8000)));
  } catch {}
}
/** the live exit on paper: half at 75% of the way to $1, the rest at 95% of the way, else the bell; settled from Kalshi. */
export async function ldcSettle794(assets: Record<string, any> | null | undefined) {
  try {
    if (!assets) return; const s = st(); let dirty = false;
    for (const r of s.rows) {
      if (r.result !== "open") { if (!r.logged) { logFill794(r); r.logged = true; dirty = true; } continue; }
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) { const bid = Number(r.side === "up" ? m.yesBid : m.noBid); if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.95 * (1 - r.ask)) { r.soldBid = bid; dirty = true; } } }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__v1112ldcRes ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const fm = typeof G.__v1112FetchMarket === "function" ? G.__v1112FetchMarket : (await import("./kalshi")).fetchMarket;
      const mk = await fm(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : ""; if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - STAKE) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * r.halfBid : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - STAKE) * 100) / 100;
      logFill794(r); r.logged = true; dirty = true;
    }
    if (dirty) save();
  } catch {}
}
