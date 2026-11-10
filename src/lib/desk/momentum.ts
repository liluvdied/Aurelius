// fix704 MOMENTUM BOOK - PAPER (Love Nov 5 2026 3:31 AM PT: "all of em bb !!" - to the top edges of the "how dumb can we go" sweep, data/reports/dumb-inverse-sweep-nov6.md:
// gold WITH the first 2 minutes of the window (265 trades, 60% at 57c, +$397), BTC WITH a fresh 1m break up through pink (221, 52% at 49c, +$172), BTC SHORT under -2σ while
// still falling (41, 63% at 52c, +$142), and gold chasing a 1σ+ 2-minute run (thin - flagged)). PAPER ONLY: this file never places, sizes, cancels or reads a live order and
// never touches a live book, wall, umpire or switch. $20 paper at the REAL live ask of its side, once per setup per window, only with 2+ minutes left; scored held to the bell
// and under her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid), and marked whether it passes her 1.5x floor (ask <= 66.7c).
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "momentum-book-704.json";
export const SETUPS704 = [
  { key: "gold-first2", name: "GOLD · WITH THE FIRST 2 MINUTES", asset: "gold" },
  { key: "btc-pinkup", name: "BTC · WITH A FRESH BREAK UP THROUGH PINK", asset: "btc" },
  { key: "btc-under2", name: "BTC · SHORT UNDER -2σ WHILE FALLING", asset: "btc" },
  { key: "gold-chase", name: "GOLD · CHASE A 1σ+ 2-MINUTE RUN (thin)", asset: "gold" },
] as const;
type Bar1 = { t: number; o: number; c: number };
type Row704 = { id: string; setup: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; why: string; ask: number; floorOk: boolean; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };

/** the four signals, pure (tested in tools/momentum-book-704.cjs). bars = closed 1m bars, oldest first; open0 = the window's first price; el = seconds into the window. */
export function signals704(asset: string, bars: Bar1[], open0: number, spot: number, el: number, vwap: number, sd: number, pink: number): { key: string; side: "up" | "down"; why: string }[] {
  const out: { key: string; side: "up" | "down"; why: string }[] = [];
  const n = bars.length, b1 = bars[n - 1], b0 = bars[n - 2], b2 = bars[n - 3];
  if (asset === "gold" && open0 > 0 && el >= 120 && el < 180 && spot !== open0) out.push({ key: "gold-first2", side: spot > open0 ? "up" : "down", why: `minute 2: ${spot.toFixed(2)} vs the window's open ${open0.toFixed(2)} - with it` });
  if (asset === "btc" && b1 && b0 && pink > 0 && b0.c < pink && b1.c >= pink && b1.c > b1.o) out.push({ key: "btc-pinkup", side: "up", why: `1m closed green over pink ${pink.toFixed(2)} (${b0.c.toFixed(2)} -> ${b1.c.toFixed(2)}) - with the break` });
  if (asset === "btc" && b1 && vwap > 0 && sd > 0 && b1.c < vwap - 2 * sd && b1.c < b1.o) out.push({ key: "btc-under2", side: "down", why: `1m closed red at ${b1.c.toFixed(2)}, under -2σ ${(vwap - 2 * sd).toFixed(2)} - with the fall` });
  if (asset === "gold" && b1 && b2 && sd > 0 && Math.abs(b1.c - b2.c) >= sd) out.push({ key: "gold-chase", side: b1.c > b2.c ? "up" : "down", why: `2-minute run ${(b1.c - b2.c).toFixed(2)} >= 1σ ${sd.toFixed(2)} - with the run` });
  return out;
}
function st(): { rows: Row704[]; seen: Record<string, number> } { if (G.__mom704) return G.__mom704; let s = { rows: [] as Row704[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__mom704 = s; return s; }
function save(force = false) { if (!force && G.__mom704SaveAt && Date.now() - G.__mom704SaveAt < 10000) return; G.__mom704SaveAt = Date.now(); try { const s = st(); ((globalThis as any).__purge1053 || ((x: any) => x))(s.rows, "momentum-704"); /* fix1053 */ s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
// fix965 (Love Nov 7 2026 ~5:38 PM PT, her card pick "Price just back over it" + ~5:34 PM PT: "not the middle hun. just back over the bollinger" + ~5:22 PM PT: "okay no fix the color issue on momentum. 2M or 5M must be her color unless it is a wick rejection. even if a 1m closed above pink. and she was in the red zone over pink when she longed." + 5:32 PM: "dude momentum is very broken it's backwards in its logic / bnb broke the bollinger DOWN and she entered long"): momentum needs her 2m OR 5m candle her colour and no long at / past the red zone (5m R1), no short at / past the green zone (5m S1) - main's zone wall (fix429).
export function gate965m(bars: { t: number; o: number }[], spot: number, nowMs: number, side: string, r1: number, s1: number): string {
  const f2 = Math.floor(nowMs / 120000) * 120000, f5 = Math.floor(nowMs / 300000) * 300000; const b2 = bars.find((b) => b.t >= f2), b5 = bars.find((b) => b.t >= f5); const o2 = b2 ? b2.o : 0, o5 = b5 ? b5.o : 0;
  if (!(o2 > 0) && !(o5 > 0)) return "HER COLOUR (fix965): no 2m / 5m candle to read";
  const her = side === "up" ? (o2 > 0 && spot > o2) || (o5 > 0 && spot > o5) : (o2 > 0 && spot < o2) || (o5 > 0 && spot < o5); if (!her) return `HER COLOUR (fix965): neither the 2m nor the 5m is ${side === "up" ? "green" : "red"}`;
  if (side === "up" && r1 > 0 && spot >= r1) return `RED ZONE (fix965): at or past the red zone ${r1.toFixed(2)} - no long`; if (side === "down" && s1 > 0 && spot <= s1) return `GREEN ZONE (fix965): at or past the green zone ${s1.toFixed(2)} - no short`;
  return "";
}
function zones965(asset: string): { r1: number; s1: number } { try { const j = G.__mom704Pv?.j; return { r1: Number(j?.[asset]?.["5m"]?.r1) || 0, s1: Number(j?.[asset]?.["5m"]?.s1) || 0 }; } catch { return { r1: 0, s1: 0 }; } }
function pink704(asset: string): number { // her 5m pink as the desk publishes it (data/pivot-now.json), read at most every 5 s
  const c = (G.__mom704Pv ||= { at: 0, j: null as any });
  try { if (Date.now() - c.at > 5000) { c.at = Date.now(); const p = D("pivot-now.json"); if (existsSync(p) && Date.now() - statSync(p).mtimeMs < 60000) c.j = JSON.parse(readFileSync(p, "utf8")); else c.j = null; } } catch { c.j = null; }
  return Number(c.j?.[asset]?.["5m"]?.pp) || 0;
}
export async function momentumTick704(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__mom704Busy) return;
  G.__mom704Busy = true;
  try {
    const s = st(); let dirty = false; const now = Date.now(), w0 = Math.floor(now / 900000) * 900000, m0 = Math.floor(now / 60000) * 60000;
    const M = (G.__mom704M ||= {}) as Record<string, { bars: Bar1[]; cur: Bar1 | null; open: Record<number, number> }>;
    for (const id of ["btc", "gold"]) {
      const a = assets[id], px = Number(a?.spot) || 0; if (!(px > 0)) continue;
      const k = (M[id] ||= { bars: [], cur: null, open: {} });
      if (!k.cur || k.cur.t !== m0) { if (k.cur && m0 - k.cur.t === 60000) { k.bars.push(k.cur); k.bars = k.bars.slice(-10); } else if (k.cur) k.bars = []; k.cur = { t: m0, o: px, c: px }; } else k.cur.c = px;
      if (k.open[w0] == null && now - w0 < 5000) { k.open[w0] = px; for (const x of Object.keys(k.open)) if (Number(x) < w0) delete k.open[Number(x)]; } // only a window seen from its first seconds has an open
      const m = a?.market, left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || !(left >= 120)) continue;
      const fresh = k.bars.length && k.bars[k.bars.length - 1].t === m0 - 60000 && now - m0 < 15000; // closed-bar signals only in the first 15 s after the close
      const sig = signals704(id, fresh ? k.bars : [], Number(k.open[w0]) || 0, px, (now - w0) / 1000, Number(a?.vwap1m?.vwap) || 0, Number(a?.vwap1m?.stdev) || 0, pink704(id));
      for (const g of sig) {
        const key = `${m.ticker}:${g.key}`; if (s.seen[key]) continue;
        { const z965 = zones965(id); if (gate965m([...k.bars, ...(k.cur ? [k.cur] : [])], px, now, g.side, z965.r1, z965.s1)) continue; } // fix965 her colour + zones
        const ask = Number(g.side === "up" ? m.yesAsk : m.noAsk); if (!(ask > 0.01 && ask < 0.99)) continue;
        s.seen[key] = now;
        s.rows.push({ id: `${key}:mom`, setup: SETUPS704.find((x) => x.key === g.key)!.name, asset: id, ticker: m.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), side: g.side, why: g.why, ask, floorOk: ask <= 0.667, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
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
      const kk = (G.__mom704Res ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__mom704Busy = false; }
}
export function momentumSummary704() {
  const rows = st().rows, by: Record<string, { n: number; w: number; l: number; hold: number; tp: number; floorN: number; floorHold: number }> = {};
  const tot = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) {
    const b = (by[r.setup] ||= { n: 0, w: 0, l: 0, hold: 0, tp: 0, floorN: 0, floorHold: 0 }); b.n++;
    if (r.result === "open") tot.open++; if (r.result === "win") { tot.w++; b.w++; } if (r.result === "loss") { tot.l++; b.l++; }
    tot.hold += r.pnlHold || 0; tot.tp += r.pnlTp || 0; b.hold += r.pnlHold || 0; b.tp += r.pnlTp || 0; if (r.floorOk) { b.floorN++; b.floorHold += r.pnlHold || 0; }
  }
  const rd = (x: number) => Math.round(x * 100) / 100;
  return { ...tot, hold: rd(tot.hold), tp: rd(tot.tp), by: Object.entries(by).map(([k, v]) => ({ setup: k, ...v, hold: rd(v.hold), tp: rd(v.tp), floorHold: rd(v.floorHold) })),
    recent: rows.slice(-25).reverse().map((r) => ({ at: r.at, asset: r.asset, setup: r.setup, side: r.side, ask: r.ask, why: r.why, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })) };
}
