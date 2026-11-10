// fix713 CUP BOOK - PAPER (Love Nov 5 2026 ~5:38 AM PT: "the 'cup' thing that price does when it makes a 😊 and the move starts rotating upwards? and when it ☹️ and starts going downwards?
// is there a way we can have her gauge candle formations? ... cup and handles hold infinitely more than bear flags or double bottoms" + ~4:23 AM PT: "let's give them all the attention they
// deserve and track all of them throughout the week"). PAPER ONLY: never places, sizes, cancels or reads a live order; never touches a live book, wall, umpire or switch. 24/7.
// On 1m (15 and 20 candles) and 2m (15 candles) her shapes, the same rules as the Nov 5 replay (scratchpad rp/cup2.py):
//   😊 CUP: a parabola through the closes opens up (R² >= 0.45, bottom in the middle 25-75%, depth >= 2 average candles) -> long when a candle closes over the left rim
//   ☹️ INVERTED CUP: the mirror -> short when a candle closes under the left rim
//   CUP & HANDLE (+ inverted): the right side back within 10% of the rim, a pullback of at most 1/3 of the depth, then the close past the rim
//   DOUBLE BOTTOM / TOP: two lows (highs) within 15% of the depth, 5+ candles apart -> the close past the neckline between them
// $20 paper at the real live ask of its side, once per shape per length per window, 2+ minutes left; held to the bell and under her take-profit. Scored on SET UP SCORES.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "cup-book-713.json";
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Row713 = { id: string; setup: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; ask: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
/** least-squares parabola through ys: returns a (curvature), R², vertex position as a share of the length */
export function fit713(ys: number[]): { a: number; r2: number; vx: number } {
  const n = ys.length; let s0 = n, s1 = 0, s2 = 0, s3 = 0, s4 = 0, t0 = 0, t1 = 0, t2 = 0;
  for (let i = 0; i < n; i++) { const x = i, y = ys[i]; s1 += x; s2 += x * x; s3 += x * x * x; s4 += x * x * x * x; t0 += y; t1 += x * y; t2 += x * x * y; }
  const M = [[s4, s3, s2, t2], [s3, s2, s1, t1], [s2, s1, s0, t0]];
  for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; if (Math.abs(M[c][c]) < 1e-12) return { a: 0, r2: 0, vx: -1 }; for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k]; } }
  const a = M[0][3] / M[0][0], b = M[1][3] / M[1][1], cc = M[2][3] / M[2][2], mean = t0 / n;
  let ssr = 0, sst = 0; for (let i = 0; i < n; i++) { const y = a * i * i + b * i + cc; ssr += (ys[i] - y) ** 2; sst += (ys[i] - mean) ** 2; }
  return { a, r2: sst > 0 ? 1 - ssr / sst : 0, vx: a !== 0 ? -b / (2 * a) / n : -1 };
}
/** her shapes on the candles before `now` (seg = the last N closed candles, prev = the candle before now, c = now's close) */
export function shapes713(seg: Bar[], prevC: number, c: number): { name: string; side: "up" | "down" }[] {
  const out: { name: string; side: "up" | "down" }[] = [], N = seg.length; if (N < 10) return out;
  const cl = seg.map((x) => x.c), hi = seg.map((x) => x.h), lo = seg.map((x) => x.l), ar = Math.max(1e-9, seg.reduce((s, x) => s + (x.h - x.l), 0) / N), q = Math.max(1, Math.floor(N / 4));
  const { a, r2, vx } = fit713(cl);
  if (r2 >= 0.45 && vx >= 0.25 && vx <= 0.75) {
    const rr = cl.slice(-8);
    if (a > 0) { const rim = Math.max(...cl.slice(0, q)), bot = Math.min(...lo.slice(q, N - q)), d = rim - bot;
      if (d >= 2 * ar && prevC <= rim && c > rim) out.push({ name: "CUP 😊 -> long over the rim", side: "up" });
      const pk = Math.max(...rr), after = rr.slice(rr.indexOf(pk)), pb = pk - Math.min(...after);
      if (d >= 2 * ar && pk >= rim - 0.1 * d && pb <= d / 3 && pb > 0.05 * d && prevC <= Math.max(rim, pk) && c > Math.max(rim, pk)) out.push({ name: "CUP & HANDLE -> long over the rim", side: "up" }); }
    else if (a < 0) { const rim = Math.min(...cl.slice(0, q)), top = Math.max(...hi.slice(q, N - q)), d = top - rim;
      if (d >= 2 * ar && prevC >= rim && c < rim) out.push({ name: "INVERTED CUP ☹️ -> short under the rim", side: "down" });
      const tr = Math.min(...rr), after = rr.slice(rr.indexOf(tr)), pb = Math.max(...after) - tr;
      if (d >= 2 * ar && tr <= rim + 0.1 * d && pb <= d / 3 && pb > 0.05 * d && prevC >= Math.min(rim, tr) && c < Math.min(rim, tr)) out.push({ name: "INVERTED CUP & HANDLE -> short under the rim", side: "down" }); }
  }
  const h2 = Math.floor(N / 2), D2 = Math.max(...hi) - Math.min(...lo);
  const j1 = lo.slice(0, h2).indexOf(Math.min(...lo.slice(0, h2))), j2 = h2 + lo.slice(h2).indexOf(Math.min(...lo.slice(h2)));
  if (j2 - j1 >= 5 && D2 >= 2 * ar && Math.abs(lo[j1] - lo[j2]) <= 0.15 * D2) { const neck = Math.max(...hi.slice(j1, j2 + 1)); if (prevC <= neck && c > neck) out.push({ name: "DOUBLE BOTTOM -> long over the neckline", side: "up" }); }
  const k1 = hi.slice(0, h2).indexOf(Math.max(...hi.slice(0, h2))), k2 = h2 + hi.slice(h2).indexOf(Math.max(...hi.slice(h2)));
  if (k2 - k1 >= 5 && D2 >= 2 * ar && Math.abs(hi[k1] - hi[k2]) <= 0.15 * D2) { const neck = Math.min(...lo.slice(k1, k2 + 1)); if (prevC >= neck && c < neck) out.push({ name: "DOUBLE TOP -> short under the neckline", side: "down" }); }
  return out;
}
function st(): { rows: Row713[]; seen: Record<string, number> } { if (G.__cup713) return G.__cup713; let s = { rows: [] as Row713[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__cup713 = s; return s; }
function save(force = false) { if (!force && G.__cup713SaveAt && Date.now() - G.__cup713SaveAt < 10000) return; G.__cup713SaveAt = Date.now(); try { const s = st(); ((globalThis as any).__purge1053 || ((x: any) => x))(s.rows, "cup713"); /* fix1053 */ s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
const TF713: [string, number, number][] = [["1m", 60, 15], ["1m", 60, 20], ["2m", 120, 15]];
export async function cupTick713(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__cup713Busy) return;
  G.__cup713Busy = true;
  try {
    const s = st(); let dirty = false; const now = Date.now();
    const M = (G.__cup713M ||= {}) as Record<string, Record<number, Bar[]>>;
    for (const id of ["btc", "gold"]) {
      const a = assets[id], px = Number(a?.spot) || 0; if (!(px > 0)) continue;
      const per = (M[id] ||= {});
      for (const sec of [60, 120]) {
        const B = (per[sec] ||= []), b0 = Math.floor(now / (sec * 1000)) * sec * 1000, lb = B[B.length - 1];
        if (!lb || lb.t !== b0) {
          if (lb && b0 - lb.t !== sec * 1000) B.length = 0;
          // a candle just closed: read her shapes on the closed candles
          if (lb && B.length >= 22) for (const [tf, s2, N] of TF713) { if (s2 !== sec) continue;
            const seg = B.slice(-1 - N, -1), prevC = B[B.length - 2].c, c = lb.c, m = a?.market, left = Number(a?.secondsLeft) || 0;
            if (!m?.ticker || !(left >= 120)) continue;
            for (const g of shapes713(seg, prevC, c)) {
              const key = `${m.ticker}:${tf}:${N}:${g.name}`; if (s.seen[key]) continue;
              const ask = Number(g.side === "up" ? m.yesAsk : m.noAsk); if (!(ask > 0.01 && ask < 0.99)) continue;
              s.seen[key] = now;
              s.rows.push({ id: `${key}:cup`, setup: `${tf} ${N} · ${g.name}`, asset: id, ticker: m.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), side: g.side, ask, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
              dirty = true;
            } }
          B.push({ t: b0, o: px, h: px, l: px, c: px }); if (B.length > 40) B.shift();
        } else { lb.h = Math.max(lb.h, px); lb.l = Math.min(lb.l, px); lb.c = px; }
      }
    }
    for (const r of s.rows) {
      if (r.result !== "open") continue;
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) {
        const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
        if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; } }
      }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__cup713Res ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__cup713Busy = false; }
}
export function cupSummary713() {
  const rows = st().rows, by: Record<string, { n: number; w: number; l: number; hold: number; tp: number }> = {}, tot = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) { const b = (by[`${r.asset.toUpperCase()} ${r.setup}`] ||= { n: 0, w: 0, l: 0, hold: 0, tp: 0 }); b.n++; if (r.result === "open") tot.open++; if (r.result === "win") { tot.w++; b.w++; } if (r.result === "loss") { tot.l++; b.l++; } tot.hold += r.pnlHold || 0; tot.tp += r.pnlTp || 0; b.hold += r.pnlHold || 0; b.tp += r.pnlTp || 0; }
  const rd = (x: number) => Math.round(x * 100) / 100;
  return { ...tot, hold: rd(tot.hold), tp: rd(tot.tp), by: Object.entries(by).map(([k, v]) => ({ setup: k, ...v, hold: rd(v.hold), tp: rd(v.tp) })), recent: rows.slice(-20).reverse().map((r) => ({ at: r.at, asset: r.asset, setup: r.setup, side: r.side, ask: r.ask, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })) };
}
