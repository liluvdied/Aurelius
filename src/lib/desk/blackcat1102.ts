// fix1102 BLACKCAT BOOKS - PAPER (Love Nov 13 2026 10:21 PM PT: "im giving you one more thing i want to set paper books for, when they cross over on a 2, 3, 4m or 5m chart = enter in the direction it crosses over
// nice and simple, this should be pretty successful on paper, we'll see if we incorporate it in as an entry okay" + her TradingView script "[blackcat] L1 Beauty Shoulder": ta.sma(close, 5) and ta.sma(close, 10)
// + 10:25 PM PT: "BlackCat books 📕 pls" + 10:49 PM PT: "as for the blackcat books 📕 yes").
// PAPER ONLY: it never places, sizes, cancels or reads a live order, never touches a book, wall, umpire or switch. Its only network reads are Kalshi's PUBLIC market data (GET).
//   FOUR BOOKS: 2m, 3m, 4m, 5m. ASSETS: BTC, gold, XRP, ETH, BNB, each in its Kalshi 15m window.
//   CROSS: on a FINISHED candle of that chart, the 5-candle average of closes (SMA 5) is over the 10-candle average (SMA 10) and on the candle before it was not = long; under and was not = short.
//   ENTRY: at the first look after that candle finishes (within 60 s of it), $20 paper at the live Kalshi ask for that side. One entry a window, per book, per asset. Held to the bell.
//   SCORE: Kalshi's public result. Win = $20 x (1 / ask - 1), loss = -$20. None of her walls are asked.
//   Candles: the same 1m candles each asset's lanes already keep (her BTC / gold chart, VANTAGE:ETHUSD, VANTAGE:BNBUSD, BINANCE:XRPUSDT), grouped to 2 / 3 / 4 / 5 minutes on the clock.
// Files: data/blackcat-1102.json (rows of the last 4 days, atomic), data/blackcat-1102.jsonl (one line per settled row), data/blackcat-1102-archive.jsonl (closed rows older than 4 days, whole).
import { readFileSync, writeFileSync, existsSync, appendFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket, mapMarket } from "./kalshi";
import type { KalshiMarket } from "./types";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const BASE = "https://external-api.kalshi.com/trade-api/v2";
type Bar = { t: number; o: number; h: number; l: number; c: number };
export type Asset1102 = "btc" | "gold" | "xrp" | "eth" | "bnb";
export const ASSETS1102: Asset1102[] = ["btc", "gold", "xrp", "eth", "bnb"];
export const TFS1102 = [2, 3, 4, 5];
export const SERIES1102: Record<Asset1102, string> = { btc: "KXBTC15M", gold: "KXGOLD15M", xrp: "KXXRP15M", eth: "KXETH15M", bnb: "KXBNB15M" };
export const STAKE1102 = 20, FRESH_MS1102 = 60000, KEEP_MS1102 = 4 * 86400000;
export const book1102 = (tf: number) => `blackcat${tf}m`;
export type Row1102 = { id: string; book: string; asset: Asset1102; ticker: string; closeTime: string; at: string; side: "up" | "down"; setup: string; tf: number; candleEnd: string; sma5: number; sma10: number; spot: number; ask: number; stake: number; contracts: number; result: "open" | "win" | "loss"; pnl: number | null };
type State1102 = { rows: Row1102[] };

const mapBars = (B: any): Bar[] => (B?.m instanceof Map ? ([...B.m.values()] as Bar[]).sort((a, b) => a.t - b.t) : []);
/** the 1m candles her lanes already keep for this asset (nothing new is fetched) */
export function bars1102(asset: Asset1102): Bar[] {
  try {
    if (asset === "btc" || asset === "gold") return ((G.__pivBars?.[asset]?.bars || []) as Bar[]).slice().sort((a, b) => a.t - b.t);
    if (asset === "eth") return mapBars(G.__eth682Bars);
    if (asset === "bnb") return mapBars(G.__mc833Bars?.["BNB-USD"]);
    if (asset === "xrp") return mapBars(G.__xrp961Bars);
  } catch {}
  return [];
}
/** FINISHED tf-minute candles from 1m candles, grouped on the clock. A candle is finished when its time is over AND a 1m candle of the next one has arrived (so its last close is final). */
export function candles1102(bs: Bar[], tf: number, nowMs: number): { t: number; c: number }[] {
  const span = tf * 60, by = new Map<number, number>(); let newest = 0;
  for (const b of bs) { const t = Number(b.t), c = Number(b.c); if (!(t > 0) || !(c > 0)) continue; if (t > newest) newest = t; by.set(Math.floor(t / span) * span, c); } // bs is time-sorted: the last 1m close of each group stays
  return [...by.entries()].filter(([t]) => (t + span) * 1000 <= nowMs && newest >= t + span).sort((a, b) => a[0] - b[0]).map(([t, c]) => ({ t, c }));
}
const avg = (xs: number[]) => xs.reduce((a, x) => a + x, 0) / xs.length;
/** the cross on the newest finished candle, or null. Needs 11 finished candles in a row with none missing. */
export function cross1102(bs: Bar[], tf: number, nowMs: number): { side: "up" | "down"; end: number; sma5: number; sma10: number } | null {
  const C = candles1102(bs, tf, nowMs); if (C.length < 11) return null;
  const L = C.slice(-11), span = tf * 60; for (let i = 1; i < L.length; i++) if (L[i].t - L[i - 1].t !== span) return null;
  const c = L.map((x) => x.c), s5 = avg(c.slice(6)), s10 = avg(c.slice(1)), p5 = avg(c.slice(5, 10)), p10 = avg(c.slice(0, 10));
  const end = L[10].t + span;
  if (s5 > s10 && !(p5 > p10)) return { side: "up", end, sma5: s5, sma10: s10 };
  if (s5 < s10 && !(p5 < p10)) return { side: "down", end, sma5: s5, sma10: s10 };
  return null;
}
function st(): State1102 { if (G.__bc1102) return G.__bc1102; let s: State1102 = { rows: [] }; try { if (existsSync(D("blackcat-1102.json"))) { const j = JSON.parse(readFileSync(D("blackcat-1102.json"), "utf8")); if (Array.isArray(j?.rows)) s = { rows: j.rows }; } } catch {} G.__bc1102 = s; return s; }
function save() {
  const s = st(), now = Number(G.__now1102) || Date.now();
  const old = s.rows.filter((r) => r.result !== "open" && now - Date.parse(r.at) > KEEP_MS1102);
  if (old.length) { try { appendFileSync(D("blackcat-1102-archive.jsonl"), old.map((r) => JSON.stringify(r)).join("\n") + "\n"); s.rows = s.rows.filter((r) => !old.includes(r)); } catch {} } // moved whole, only once written
  try { const tmp = D("blackcat-1102.json.tmp"); writeFileSync(tmp, JSON.stringify({ note: "BLACKCAT BOOKS - PAPER (fix1102). SMA 5 crossing SMA 10 on a finished 2 / 3 / 4 / 5 minute candle. Never an order.", rows: s.rows })); renameSync(tmp, D("blackcat-1102.json")); } catch {}
}
/** one pass for one asset at one moment: opens at most one paper row per book for the running window. Returns the rows it opened. */
export function step1102(asset: Asset1102, bs: Bar[], mk: KalshiMarket | null, nowMs: number): Row1102[] {
  const s = st(), opened: Row1102[] = [];
  if (!mk || !mk.ticker || !(Date.parse(mk.closeTime) > nowMs) || bs.length < 22) return opened;
  const spot = Number(bs[bs.length - 1].c) || 0;
  for (const tf of TFS1102) {
    const x = cross1102(bs, tf, nowMs); if (!x) continue;
    if (nowMs - x.end * 1000 > FRESH_MS1102) continue; // the cross is acted on when its candle finishes, never minutes later
    const id = `${mk.ticker}:${asset}:bc${tf}`; if (s.rows.some((r) => r.id === id)) continue; // one entry a window, per book, per asset
    const ask = x.side === "up" ? Number(mk.yesAsk) : Number(mk.noAsk); if (!(ask > 0) || !(ask < 1)) continue;
    const row: Row1102 = { id, book: book1102(tf), asset, ticker: mk.ticker, closeTime: mk.closeTime, at: new Date(nowMs).toISOString(), side: x.side, setup: `BLACKCAT ${tf}m · SMA 5 crossed ${x.side === "up" ? "over" : "under"} SMA 10`, tf, candleEnd: new Date(x.end * 1000).toISOString(), sma5: x.sma5, sma10: x.sma10, spot, ask, stake: STAKE1102, contracts: Math.round((STAKE1102 / ask) * 100) / 100, result: "open", pnl: null };
    s.rows.push(row); opened.push(row);
  }
  return opened;
}
/** Kalshi's result for a window scores every open row of it */
export function settle1102(ticker: string, result: string, nowMs = Date.now()): number {
  const s = st(), res = result === "yes" ? "up" : result === "no" ? "down" : ""; if (!res) return 0; let n = 0;
  for (const r of s.rows) {
    if (r.ticker !== ticker || r.result !== "open" || nowMs < Date.parse(r.closeTime)) continue;
    const won = r.side === res; r.result = won ? "win" : "loss"; r.pnl = Math.round((won ? r.stake * (1 / r.ask - 1) : -r.stake) * 100) / 100; n++;
    try { appendFileSync(D("blackcat-1102.jsonl"), JSON.stringify(r) + "\n"); } catch {}
  }
  return n;
}
async function market1102(series: string): Promise<KalshiMarket | null> {
  const P = G.__ps983Mk?.[series]; if (P && Date.now() - Number(P.at) < 6000 && P.m && Date.parse(P.m.closeTime) > Date.now()) return P.m as KalshiMarket; // the push shadow test just read this same public market
  const C = ((G.__bc1102Mk ||= {})[series] ||= { at: 0, m: null as KalshiMarket | null });
  if (Date.now() - C.at >= 5000) { C.at = Date.now(); try { const r = await fetch(`${BASE}/markets?series_ticker=${series}&status=open&limit=20`, { headers: { Accept: "application/json", "User-Agent": "aurelius-paper/1.0" }, signal: AbortSignal.timeout(8000) }); const d: any = await r.json(); const ms = ((d?.markets ?? []) as any[]).map(mapMarket).filter((m) => Date.parse(m.closeTime) > Date.now()).sort((a, b) => Date.parse(a.closeTime) - Date.parse(b.closeTime)); C.m = ms[0] || null; } catch {} }
  return C.m && Date.parse(C.m.closeTime) > Date.now() ? C.m : null;
}
export async function blackCatTick1102() {
  if (G.__bc1102Busy || (G.__bc1102At && Date.now() - G.__bc1102At < 2000)) return; G.__bc1102Busy = true; G.__bc1102At = Date.now();
  try {
    try { if (JSON.parse(readFileSync(D("blackcat-1102-cfg.json"), "utf8"))?.on === false) return; } catch {}
    let changed = 0;
    for (const a of ASSETS1102) { try { const bs = bars1102(a); if (bs.length < 22) continue; const mk = await market1102(SERIES1102[a]); changed += step1102(a, bs, mk, Date.now()).length; } catch {} }
    const s = st(), due = [...new Set(s.rows.filter((r) => r.result === "open" && Date.now() > Date.parse(r.closeTime) + 5000).map((r) => r.ticker))].slice(0, 6), SA = (G.__bc1102SetAt ||= {});
    for (const t of due) { if (SA[t] && Date.now() - SA[t] < 20000) continue; SA[t] = Date.now(); try { const m = await fetchMarket(t); if (m?.result) changed += settle1102(t, m.result); } catch {} }
    if (changed) save();
  } catch {} finally { G.__bc1102Busy = false; }
}
