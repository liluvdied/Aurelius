// fix707 HIGH MULTIPLE BOOK + TRACKER - PAPER (Love Nov 5 2026 ~4:10 AM PT: "anddd i want to start tracking when high multiple trades hit bb. im guessing its at the most volatile
// hours when price rips thru a band or two and stops at the next and reverses. when bands are tight she caught 4 20x + in a row in one afternoon. let's create a high multiple
// book too pls. only takes 2.8x +. takes the most distant band trade, not the closest. thaaat on volatile hours. i THINK but let's see. we can leave it running 24/7, over the
// week we will see the pattern"). PAPER ONLY: never places, sizes, cancels or reads a live order; never touches a live book, wall, umpire or switch. 24/7.
//   REVERSAL (her read): price ripped through 1+ session bands in the last 15 minutes, reached the next band out (within 5% of the channel - the most distant band of the move,
//     not the nearest) and has come back off that extreme by 10% of the channel -> the other way.
//   WITH THE RIP (the replay's lead, Oct 19 - Nov 5: BTC 2.8-5x with a 1+ band rip 51%, +$817): price ripped through 1+ bands in the last 15 min and is still past the last one -> with it.
// Either takes ONLY a real live ask of 35.7c or less (2.8x+), $20 paper, once per way per window, 2+ minutes left; held to the bell and under her take-profit (half at 75%,
// trail from 90%). Every trade logs its hour (PT), channel width, σ in bps, bands crossed, the 15-minute range in σ. The TRACKER lists every 2.8x+ winner from every book
// (her paper rows, grok-og.json) with the same hour / σ context, so the week shows when high multiples land.
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "high-multiple-707.json", MAXASK = 0.357;
type Px = { t: number; h: number; l: number; c: number };
type Row707 = { id: string; way: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; why: string; ask: number; hourPT: number; chan: number; sdBps: number; crossed: number; range15: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
const ptHour = (ms: number) => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hour12: false }).format(new Date(ms))) % 24;
/** the two signals, pure. bars = 1m bars (oldest first, last = now), vw/sd = session VWAP and sigma. */
export function hmSignals707(bars: Px[], vw: number, sd: number): { way: string; side: "up" | "down"; why: string; crossed: number; chan: number }[] {
  const out: { way: string; side: "up" | "down"; why: string; crossed: number; chan: number }[] = [];
  if (bars.length < 16 || !(vw > 0) || !(sd > 0)) return out;
  const L = [-3, -2, -1, 0, 1, 2, 3].map((k) => vw + k * sd), now = bars[bars.length - 1], start = bars[bars.length - 16].c, win = bars.slice(-15);
  const hi = Math.max(...win.map((b) => b.h)), lo = Math.min(...win.map((b) => b.l)), up = hi - start >= start - lo, ext = up ? hi : lo;
  const between = L.filter((x) => (up ? start < x && x < ext : ext < x && x < start)), crossed = between.length;
  if (crossed < 1) return out;
  const chan = sd, far = [...L].sort((x, y) => Math.abs(x - ext) - Math.abs(y - ext))[0]; // the band the move's extreme reached - the most distant one, not the nearest to price now
  const prior = L.filter((x) => (up ? start < x && x < far - 1e-9 : far + 1e-9 < x && x < start)).length;
  if (Math.abs(ext - far) <= 0.05 * chan && (up ? far > start : far < start) && prior >= 1 && (up ? ext - now.c : now.c - ext) >= 0.1 * chan) out.push({ way: "REVERSAL AT THE FARTHEST BAND", side: up ? "down" : "up", why: `ripped ${up ? "up" : "down"} through ${prior} band(s) in 15m, reached ${far.toFixed(2)} (extreme ${ext.toFixed(2)}), back ${Math.abs(ext - now.c).toFixed(2)}`, crossed: prior, chan });
  const last = up ? Math.max(...between) : Math.min(...between);
  if (up ? now.c > last : now.c < last) out.push({ way: "WITH THE RIP", side: up ? "up" : "down", why: `ripped ${up ? "up" : "down"} through ${crossed} band(s) in 15m and still past ${last.toFixed(2)}`, crossed, chan });
  return out;
}
function st(): { rows: Row707[]; seen: Record<string, number> } { if (G.__hm707) return G.__hm707; let s = { rows: [] as Row707[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__hm707 = s; return s; }
function save(force = false) { if (!force && G.__hm707SaveAt && Date.now() - G.__hm707SaveAt < 10000) return; G.__hm707SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
export async function highMultTick707(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__hm707Busy) return;
  G.__hm707Busy = true;
  try {
    const s = st(); let dirty = false; const now = Date.now(), m0 = Math.floor(now / 60000) * 60000;
    const M = (G.__hm707M ||= {}) as Record<string, Px[]>;
    for (const id of ["btc", "gold"]) {
      const a = assets[id], px = Number(a?.spot) || 0; if (!(px > 0)) continue;
      const B = (M[id] ||= []), lb = B[B.length - 1];
      if (!lb || lb.t !== m0) { if (lb && m0 - lb.t !== 60000) B.length = 0; B.push({ t: m0, h: px, l: px, c: px }); if (B.length > 30) B.shift(); } else { lb.h = Math.max(lb.h, px); lb.l = Math.min(lb.l, px); lb.c = px; }
      const m = a?.market, left = Number(a?.secondsLeft) || 0, vw = Number(a?.vwap1m?.vwap) || 0, sd = Number(a?.vwap1m?.stdev) || 0;
      if (!m?.ticker || !(left >= 120)) continue;
      for (const g of hmSignals707(B, vw, sd)) {
        const key = `${m.ticker}:${g.way}`; if (s.seen[key]) continue;
        const ask = Number(g.side === "up" ? m.yesAsk : m.noAsk); if (!(ask > 0.01 && ask <= MAXASK)) continue; // 2.8x+ only
        s.seen[key] = now;
        const win = B.slice(-15), rng = (Math.max(...win.map((b) => b.h)) - Math.min(...win.map((b) => b.l))) / sd;
        s.rows.push({ id: `${key}:hm`, way: g.way, asset: id, ticker: m.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), side: g.side, why: g.why, ask, hourPT: ptHour(now), chan: Math.round(g.chan * 100) / 100, sdBps: Math.round((sd / vw) * 1e5) / 10, crossed: g.crossed, range15: Math.round(rng * 100) / 100, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
        dirty = true;
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
      const kk = (G.__hm707Res ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__hm707Busy = false; }
}
/** THE TRACKER: every 2.8x+ winner in her paper rows (every book) over the last 7 days, with hour + σ context - read only, cached per file change. */
export function tracker707() {
  try {
    const p = D("grok-og.json"), f = statSync(p), key = `${f.mtimeMs}:${f.size}`;
    if (G.__hm707Tr?.key === key) return G.__hm707Tr.v;
    const all = G.__ogShared?.key === key && Array.isArray(G.__ogShared.rows) ? G.__ogShared.rows : JSON.parse(readFileSync(p, "utf8"));
    const cut = Date.now() - 7 * 86400000, hi = (all as any[]).filter((r) => Number(r?.ask) > 0.01 && Number(r?.ask) <= MAXASK && Date.parse(String(r?.at)) >= cut && ["win", "loss", "sold"].includes(String(r?.result)));
    const wins = hi.filter((r) => Number(r.pnl) > 0), byHour: Record<number, { n: number; w: number; pnl: number }> = {};
    for (const r of hi) { const h = ptHour(Date.parse(r.at)); const b = (byHour[h] ||= { n: 0, w: 0, pnl: 0 }); b.n++; if (Number(r.pnl) > 0) b.w++; b.pnl += Number(r.pnl) || 0; }
    const v = { n: hi.length, wins: wins.length, byHour: Object.entries(byHour).map(([h, b]) => ({ hour: Number(h), ...b, pnl: Math.round(b.pnl) })).sort((x, y) => x.hour - y.hour),
      recent: wins.slice(-30).reverse().map((r) => ({ at: r.at, lane: r.lane, asset: r.asset, side: r.side, label: String(r.label || "").slice(0, 60), ask: Number(r.ask), mult: Math.round(10 / Number(r.ask)) / 10, exit: String(r.exit || r.result).slice(0, 60), pnl: Number(r.pnl), hourPT: ptHour(Date.parse(r.at)), sdBps: Number(r.sd) > 0 && Number(r.spotAt) > 0 ? Math.round((Number(r.sd) / Number(r.spotAt)) * 1e5) / 10 : null })) };
    G.__hm707Tr = { key, v }; return v;
  } catch { return null; }
}
export function highMultSummary707() {
  const rows = st().rows, by: Record<string, { n: number; w: number; l: number; hold: number; tp: number }> = {}, tot = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) { const b = (by[`${r.asset.toUpperCase()} · ${r.way}`] ||= { n: 0, w: 0, l: 0, hold: 0, tp: 0 }); b.n++; if (r.result === "open") tot.open++; if (r.result === "win") { tot.w++; b.w++; } if (r.result === "loss") { tot.l++; b.l++; } tot.hold += r.pnlHold || 0; tot.tp += r.pnlTp || 0; b.hold += r.pnlHold || 0; b.tp += r.pnlTp || 0; }
  const rd = (x: number) => Math.round(x * 100) / 100;
  return { ...tot, hold: rd(tot.hold), tp: rd(tot.tp), by: Object.entries(by).map(([k, v]) => ({ setup: k, ...v, hold: rd(v.hold), tp: rd(v.tp) })),
    recent: rows.slice(-20).reverse().map((r) => ({ at: r.at, asset: r.asset, way: r.way, side: r.side, ask: r.ask, hourPT: r.hourPT, sdBps: r.sdBps, crossed: r.crossed, range15: r.range15, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })), tracker: tracker707() };
}
