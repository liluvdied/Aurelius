// fix672 RSI PAPER BOOKS (Love Nov 4 2026 9:56 PM PT: "i want to paper test those 1H kalshi markets, once gold has hit an RSI of 70+ 80+ and 90+ ... 3 different paper books
// testing each level. i want to place reversal trades when those rsi values are hit, when they hit them then i want to track how many hours AFTER the move up/down has taken
// place, until the trade worked out in our favor ... we will test them on 5M, 15M, 30M, and 1H, and 4H timeframe RSI's ... and for our regular 15M windows, i want to test
// those out as well ... we can make a new subsection here for the RSI books ... andd i would like them tested on both btc and on Gold").
// PAPER ONLY. This file never places, sizes, cancels or reads a live order, never touches a live book, wall, umpire or switch - it only reads her price, the
// public Kalshi market list and its own files (data/rsi-books.json, data/rsi-closes.json).
//   RSI: 14, Wilder, on 5m / 15m / 30m / 1h / 4h candles built from her one-minute closes, the forming candle included (fires the moment the level is crossed).
//   Books: 20 = 5 timeframes x 4 levels. Short when RSI first crosses 70 / 80 / 85 / 90, long (the mirror) when it first crosses 30 / 20 / 15 / 10. Re-arms once RSI is
//          2 points back inside the level.
//   Each signal opens two paper trades, BTC and gold alike: the regular 15M window (KXBTC15M / KXGOLD15M) and the 1H market at the strike nearest price
//          (KXBTCD / KXGOLDH, the hour closing next with 5+ minutes left). $20 at the live ask, no fees.
//   Kept per trade: time from the signal until price first moved her way by 0.25% and by 0.5% (tracked for 24 h, past the settle), the worst move against her
//          before the 0.25%, the settle, P&L held to the bell and P&L under her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c
//          off its best bid, else held to the bell).
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type { AssetSnapshot, KalshiMarket } from "./types";
import { fetchMarket, mapMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const BASE = "https://external-api.kalshi.com/trade-api/v2";
export const RSI_TFS672 = [5, 15, 30, 60, 240];
export const RSI_LEVELS672 = [70, 80, 85, 90]; // + 85 (Love Nov 4 2026 ~10:05 PM PT: "as for the 15M windows rsi books, the 80-85 will be our best chance there, 90+ will be very successful as well")
const KEEP_MIN = 12 * 1440;
const HYST = 2;
type Row672 = {
  id: string; book: string; asset: string; tf: number; level: number; side: "up" | "down"; market: "15M" | "1H"; ticker: string; strike: number | null; closeTime: string;
  at: string; spot: number; rsi: number; ask: number | null; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; soldAt: string | null;
  result: "open" | "win" | "loss" | "void"; pnlHold: number | null; pnlTp: number | null; t025: number | null; t05: number | null; maeBefore: number; trackUntil: number; doneTracking: boolean;
};
type State672 = { rows: Row672[]; armed: Record<string, boolean> };

function st(): State672 {
  if (G.__rsi672) return G.__rsi672;
  let s: State672 = { rows: [], armed: {} };
  try { if (existsSync(D("rsi-books.json"))) { const j = JSON.parse(readFileSync(D("rsi-books.json"), "utf8")); if (Array.isArray(j?.rows)) s = { rows: j.rows, armed: j.armed || {} }; } } catch {}
  G.__rsi672 = s; return s;
}
function save(force = false) { if (!force && G.__rsi672SaveAt && Date.now() - G.__rsi672SaveAt < 15000) return; G.__rsi672SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-6000); writeFileSync(D("rsi-books.json"), JSON.stringify(s)); } catch {} }

// her one-minute closes: seeded once from her own band log (current + archived, ~1 reading a minute), then kept from the live price
function closes(asset: string): Map<number, number> {
  const C = (G.__rsiCloses672 ||= {}) as Record<string, Map<number, number>>;
  if (C[asset]) return C[asset];
  const m = new Map<number, number>();
  try { const j = JSON.parse(readFileSync(D("rsi-closes.json"), "utf8")); for (const [k, v] of Object.entries(j?.[asset] || {})) m.set(Number(k), Number(v)); } catch {}
  if (m.size < 1440) {
    const files: string[] = [];
    try { for (const d of readdirSync(D("archive/logs"))) { const f = D(`archive/logs/${d}/band-log.jsonl.gz`); if (existsSync(f)) files.push(f); } } catch {}
    files.push(D("band-log.jsonl"));
    for (const f of files) {
      try {
        const txt = f.endsWith(".gz") ? gunzipSync(readFileSync(f)).toString("utf8") : readFileSync(f, "utf8");
        for (const l of txt.split("\n")) { if (!l.includes(`"asset":"${asset}"`)) continue; try { const j = JSON.parse(l); const t = Date.parse(j.at); if (j.tick > 0 && t > 0) m.set(Math.floor(t / 60000), Number(j.tick)); } catch {} }
      } catch {}
    }
  }
  C[asset] = m; return m;
}
function saveCloses() {
  if (G.__rsiClosesAt && Date.now() - G.__rsiClosesAt < 60000) return; G.__rsiClosesAt = Date.now();
  try { const out: Record<string, Record<string, number>> = {}; const cut = Math.floor(Date.now() / 60000) - KEEP_MIN;
    for (const a of ["btc", "gold"]) { const m = closes(a); for (const k of [...m.keys()]) if (k < cut) m.delete(k); out[a] = Object.fromEntries(m); }
    writeFileSync(D("rsi-closes.json"), JSON.stringify(out)); } catch {}
}
/** RSI(14, Wilder) of N-minute candles from one-minute closes, the forming candle's latest close included. */
export function rsiNow672(byMin: Map<number, number>, N: number, n = 14): number | null {
  const ks = [...byMin.keys()].sort((x, y) => x - y); if (!ks.length) return null;
  const bars: number[] = []; let curK: number | null = null;
  for (const k of ks) { const b = Math.floor(k / N); if (b !== curK) { bars.push(byMin.get(k)!); curK = b; } else bars[bars.length - 1] = byMin.get(k)!; }
  if (bars.length < n + 2) return null;
  let g = 0, l = 0;
  for (let i = 1; i < bars.length; i++) { const d = bars[i] - bars[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0); if (i <= n) { g += up / n; l += dn / n; } else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; } }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
async function hourMarkets(asset: string): Promise<KalshiMarket[]> {
  const H = (G.__rsiHour672 ||= {}) as Record<string, { at: number; ms: KalshiMarket[] }>;
  if (H[asset] && Date.now() - H[asset].at < 30000) return H[asset].ms;
  const series = asset === "btc" ? "KXBTCD" : "KXGOLDH";
  const res = await fetch(`${BASE}/markets?series_ticker=${series}&status=open&limit=500`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  const body = (await res.json()) as { markets?: any[] };
  const ms = (body.markets ?? []).map(mapMarket); H[asset] = { at: Date.now(), ms }; return ms;
}
async function quote(ticker: string): Promise<KalshiMarket | null> {
  const Q = (G.__rsiQ672 ||= {}) as Record<string, { at: number; m: KalshiMarket | null }>;
  if (Q[ticker] && Date.now() - Q[ticker].at < 10000) return Q[ticker].m;
  let m: KalshiMarket | null = null; try { m = await fetchMarket(ticker); } catch { m = null; }
  Q[ticker] = { at: Date.now(), m }; return m;
}
function open(asset: string, tf: number, level: number, side: "up" | "down", rsi: number, spot: number, market: "15M" | "1H", mk: KalshiMarket) {
  const s = st(); const ask = side === "up" ? Number(mk.yesAsk) : Number(mk.noAsk); const ok = ask > 0.01 && ask < 0.99;
  const book = `rsi-${tf}m-${side === "down" ? level : 100 - level}`;
  s.rows.push({ id: `${mk.ticker}:${book}:${side}:${Date.now()}`, book, asset, tf, level, side, market, ticker: mk.ticker, strike: mk.kalshiStrike ?? mk.target ?? null, closeTime: mk.closeTime,
    at: new Date().toISOString(), spot, rsi: Math.round(rsi * 10) / 10, ask: ok ? ask : null, contracts: ok ? Math.floor((20 / ask) * 100) / 100 : 0, bestBid: 0, half: false, halfBid: null, trail: false,
    soldBid: null, soldAt: null, result: ok ? "open" : "void", pnlHold: null, pnlTp: null, t025: null, t05: null, maeBefore: 0, trackUntil: Date.now() + 24 * 3600000, doneTracking: false });
}
export async function rsiTick672(assets: Record<string, AssetSnapshot> | null | undefined) {
  if (!assets || G.__rsiBusy672 || (G.__rsiAt672 && Date.now() - G.__rsiAt672 < 5000)) return;
  G.__rsiBusy672 = true; G.__rsiAt672 = Date.now();
  try {
    const s = st(); const nowMin = Math.floor(Date.now() / 60000);
    for (const asset of ["btc", "gold"]) {
      const a = assets[asset]; const spot = Number(a?.spot) || 0; if (!(spot > 0)) continue;
      const byMin = closes(asset); byMin.set(nowMin, spot);
      // 1. her favourable-move clock on every trade (24 h)
      for (const r of s.rows) {
        if (r.asset !== asset || r.doneTracking) continue;
        const fav = r.side === "down" ? r.spot - spot : spot - r.spot, adv = -fav, hrs = (Date.now() - Date.parse(r.at)) / 3600000;
        if (r.t025 == null) { if (fav >= 0.0025 * r.spot) r.t025 = Math.round(hrs * 100) / 100; else r.maeBefore = Math.max(r.maeBefore, Math.round((adv / r.spot) * 100000) / 1000); }
        if (r.t05 == null && fav >= 0.005 * r.spot) r.t05 = Math.round(hrs * 100) / 100;
        if ((r.t025 != null && r.t05 != null) || Date.now() > r.trackUntil) r.doneTracking = true;
      }
      // 2. the levels
      for (const tf of RSI_TFS672) {
        const r = rsiNow672(byMin, tf); if (r == null) continue;
        for (const lv of RSI_LEVELS672) {
          for (const side of ["down", "up"] as const) {
            const key = `${asset}|${tf}|${lv}|${side}`, hit = side === "down" ? r >= lv : r <= 100 - lv, back = side === "down" ? r < lv - HYST : r > 100 - lv + HYST;
            if (!(key in s.armed)) { s.armed[key] = !hit; continue; } // first look after a start never fires on an extreme already in place
            if (hit && s.armed[key]) {
              s.armed[key] = false;
              const m15 = a?.market; if (m15?.ticker && Date.parse(m15.closeTime) - Date.now() > 60000) open(asset, tf, lv, side, r, spot, "15M", m15);
              try { const all = (await hourMarkets(asset)).filter((m) => (m.kalshiStrike ?? m.target) && m.closeTime); const soon = all.filter((m) => Date.parse(m.closeTime) - Date.now() > 5 * 60000 && Date.parse(m.closeTime) - Date.now() <= 65 * 60000);
                if (soon.length) { const c = Math.min(...soon.map((m) => Date.parse(m.closeTime))); const mk = soon.filter((m) => Date.parse(m.closeTime) === c).sort((x, y) => Math.abs(Number(x.kalshiStrike ?? x.target) - spot) - Math.abs(Number(y.kalshiStrike ?? y.target) - spot))[0]; if (mk) open(asset, tf, lv, side, r, spot, "1H", mk); } } catch {}
            } else if (back) s.armed[key] = true;
          }
        }
      }
    }
    // 3. her take-profit and the settle, on the real bids (one read per ticker every 10 s)
    for (const t of [...new Set(s.rows.filter((r) => r.result === "open").map((r) => r.ticker))]) {
      const mk = await quote(t); if (!mk) continue;
      for (const r of s.rows) {
        if (r.ticker !== t || r.result !== "open" || !(r.ask! > 0)) continue;
        const ask = r.ask!, bid = r.side === "up" ? Number(mk.yesBid) : Number(mk.noBid), closed = Date.now() > Date.parse(r.closeTime);
        if (!closed && bid > 0 && r.soldBid == null) {
          r.bestBid = Math.max(r.bestBid, bid);
          if (!r.half && bid >= ask + 0.75 * (1 - ask)) { r.half = true; r.halfBid = bid; }
          if (bid >= ask + 0.9 * (1 - ask)) r.trail = true;
          if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; r.soldAt = new Date().toISOString(); }
        }
        const res = mk.result === "yes" ? "up" : mk.result === "no" ? "down" : "";
        if (closed && res) {
          const won = res === r.side; r.result = won ? "win" : "loss"; const pay = won ? 1 : 0, c = r.contracts;
          r.pnlHold = Math.round((c * pay - 20) * 100) / 100;
          const h = r.half ? c / 2 : 0, rest = c - h;
          r.pnlTp = Math.round(((r.half ? h * r.halfBid! : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100;
        }
      }
    }
    save(); saveCloses();
  } catch {} finally { G.__rsiBusy672 = false; }
}
/** the desk's RSI section: every book cell (asset x market x RSI timeframe x level x side) + the latest trades - summarised here so the page stays light */
export function rsiSummary672() {
  const rows = st().rows; const cells: Record<string, any> = {};
  for (const r of rows) {
    if (r.result === "void") continue;
    const k = `${r.asset}|${r.market}|${r.tf}|${r.side === "down" ? r.level : 100 - r.level}|${r.side}`;
    const c = (cells[k] ||= { asset: r.asset, market: r.market, tf: r.tf, level: r.side === "down" ? r.level : 100 - r.level, side: r.side, n: 0, open: 0, w: 0, l: 0, hold: 0, tp: 0, t025: [] as number[] });
    c.n++; if (r.result === "open") c.open++; if (r.result === "win") c.w++; if (r.result === "loss") c.l++; c.hold += r.pnlHold || 0; c.tp += r.pnlTp || 0; if (r.t025 != null) c.t025.push(r.t025);
  }
  const med = (v: number[]) => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  return { at: new Date().toISOString(), cells: Object.values(cells).map((c: any) => ({ ...c, hold: Math.round(c.hold * 100) / 100, tp: Math.round(c.tp * 100) / 100, medHrs: med(c.t025), t025: undefined })),
    recent: rows.slice(-25).reverse().map((r) => ({ at: r.at, asset: r.asset, book: r.book, market: r.market, side: r.side, rsi: r.rsi, ask: r.ask, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp, t025: r.t025 })) };
}
