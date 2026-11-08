// fix687 OUTWARD BREAK · SESSION BANDS - PAPER (Love Nov 5 2026 ~1:00 AM PT: "and yes, a session break book for both - we have one and it was doing well last i saw but
// that was a while ago, a new one too if you have a different idea in mind for it"). PAPER ONLY: this file never places, sizes, cancels or reads a live order and never
// touches a live book, wall, umpire or switch.
// The idea (Claude's replay Oct 12 - Nov 5 on her session bands, scored from the entry on Kalshi's result): a 1-minute candle that CLOSES through a session band by her push
// ($6 BTC, 33c gold) in the direction AWAY from the session VWAP - up through a band at or above the VWAP, down through one at or below it - is traded that way at once.
// It was the only break idea green every week (+$395 / +$304 / +$414 / +$276, 56% of 1,577); retests (-$1,241) and breaks back toward the VWAP (-$848) lost.
// Bands: her live session VWAP and ±0.5..3σ (the desk's own snapshot). Candles: her chart's 1m candles (the pivot books' read - no extra TradingView read).
// Market: the running Kalshi 15M window, 4+ minutes left, her 1.38x floor (ask 72c or less), one per window per asset, $20 paper at the live ask.
// Scored both ways: held to the bell, and her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid).
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "brk-out-687.json";
const PUSH: Record<string, number> = { btc: 6, gold: 0.33 };
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Row687 = { id: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; label: string; band: string; bandPx: number; spot: number; ask: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
function st(): { rows: Row687[] } { if (G.__bo687) return G.__bo687; let s = { rows: [] as Row687[] }; try { if (existsSync(D(FILE))) s = JSON.parse(readFileSync(D(FILE), "utf8")); } catch {} G.__bo687 = s; return s; }
function save(force = false) { if (!force && G.__bo687SaveAt && Date.now() - G.__bo687SaveAt < 10000) return; G.__bo687SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
/** the read: a closed 1m candle through a session band by her push, away from the VWAP. The furthest band it crossed names it. */
export function outwardRead687(bar: Bar, vwap: number, sd: number, asset: string): { side: "up" | "down"; label: string; band: string; bandPx: number } | null {
  const p = PUSH[asset] ?? 0; if (!(p > 0) || !(vwap > 0) || !(sd > 0) || !bar) return null;
  let best: { side: "up" | "down"; label: string; band: string; bandPx: number; k: number } | null = null;
  for (const k of [0, 0.5, 1, 1.5, 2, 2.5, 3, -0.5, -1, -1.5, -2, -2.5, -3]) {
    const b = vwap + k * sd, name = k === 0 ? "session VWAP" : `${k > 0 ? "+" : ""}${k}σ`;
    if (k >= 0 && bar.o < b && bar.c > b + p && (!best || Math.abs(k) > best.k)) best = { side: "up", label: `Closed up through ${name} by $${(bar.c - b).toFixed(2)} (outward)`, band: name, bandPx: b, k: Math.abs(k) };
    if (k <= 0 && bar.o > b && bar.c < b - p && (!best || Math.abs(k) > best.k)) best = { side: "down", label: `Closed down through ${name} by $${(b - bar.c).toFixed(2)} (outward)`, band: name, bandPx: b, k: Math.abs(k) };
  }
  if (!best) return null; const { k: _k, ...out } = best; return out;
}
export async function brkOutTick687(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__bo687Busy) return;
  G.__bo687Busy = true;
  try {
    const s = st(); let dirty = false; const now = Date.now() / 1000;
    const seen = (G.__bo687Seen ||= {}) as Record<string, number>;
    for (const id of ["btc", "gold"]) {
      const a = assets[id], m = a?.market, left = Number(a?.secondsLeft) || 0;
      const vw = Number(a?.vwap1m?.vwap) || 0, sd = Number(a?.vwap1m?.stdev) || 0;
      const bs: Bar[] = (G.__pivBars?.[id]?.bars || []).filter((x: Bar) => Number(x.t) + 60 <= now + 1);
      const last = bs[bs.length - 1];
      if (!last || seen[id] === last.t) continue;
      seen[id] = last.t;
      if (now - (last.t + 60) > 20 || !m?.ticker || !(left >= 240) || s.rows.some((r) => r.ticker === m.ticker && r.asset === id)) continue;
      const r = outwardRead687(last, vw, sd, id); if (!r) continue;
      const ask = Number(r.side === "up" ? m.yesAsk : m.noAsk);
      if (!(ask > 0.02 && ask <= 0.72)) continue; // her 1.38x floor
      s.rows.push({ id: `${m.ticker}:brk-out`, asset: id, ticker: String(m.ticker), closeTime: new Date((now + left) * 1000).toISOString(), at: new Date().toISOString(), side: r.side, label: r.label, band: r.band, bandPx: Math.round(r.bandPx * 100) / 100, spot: Number(a?.spot) || last.c, ask, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
      dirty = true;
    }
    // her take-profit on the live bids (the running window), and Kalshi's result once the window is over (one public read per ticker every 15 s)
    for (const r of s.rows) {
      if (r.result !== "open") continue;
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) {
        const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
        if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; } }
      }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const k = (G.__bo687Res ||= {}) as Record<string, number>; if (Date.now() - (k[r.ticker] || 0) < 15000) continue; k[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__bo687Busy = false; }
}
export function brkOutSummary687() {
  const rows = st().rows, c = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) { if (r.result === "open") c.open++; if (r.result === "win") c.w++; if (r.result === "loss") c.l++; c.hold += r.pnlHold || 0; c.tp += r.pnlTp || 0; }
  return { ...c, hold: Math.round(c.hold * 100) / 100, tp: Math.round(c.tp * 100) / 100, recent: rows.slice(-25).reverse().map((r) => ({ at: r.at, asset: r.asset, side: r.side, label: r.label, ask: r.ask, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })) };
}
