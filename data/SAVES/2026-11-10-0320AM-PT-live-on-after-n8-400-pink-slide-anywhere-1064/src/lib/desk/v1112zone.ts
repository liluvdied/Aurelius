// fix798 HER ZONE WICK REJECTIONS (Love Nov 6 2026 ~5:17 AM PT: "and pls have her register green zone rejections and red zone rejections to enter in when the rejections there pls
// a rick rejections of $50 or more on btc $1 for gold"). A new set up in V.111 - 2's family (PAPER - BESTIE is paper since CHANGE-137):
//   GREEN ZONE WICK REJECTION = in this window, a closed 1m bar's low reached the green zone (5m S1, the desk's own pivot zone) and price is now $50 (BTC) / $1 (gold) or more back up
//   off that wick low -> LONG. RED ZONE WICK REJECTION = the mirror off the red zone (5m R1) -> SHORT. Minutes 1-14 of the window, once a minute, one per window.
// $20 paper (her scale) at the real ask, scored like V.111 - 2 (half at 75% of the way, trail from 90%, 5c off best; held $ beside it), settled from Kalshi; own file
// data/v111-2-zone-798.json, fill-log venue "paper-v111-2-zone", pattern "V.111 - 2 · Green / Red zone wick rejection" - so it scores in STATS and, through her own-rows list
// (fix797, which counts these rows too), can earn its way onto BESTIE's list; each take is decided on that list the second it is taken (best775), like hers.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const VENUE798 = "paper-v111-2-zone";
const FILE = "v111-2-zone-798.json", STAKE = 20;
export const WICK798: Record<string, number> = { btc: 50, gold: 1 };
function st(): { rows: any[]; read: Record<string, number> } {
  if (G.__v1112zone798) return G.__v1112zone798;
  let s = { rows: [] as any[], read: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { rows: [], read: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {}
  G.__v1112zone798 = s; return s;
}
function save() { try { const s = st(), old = Date.now() - 6 * 3600000; ((globalThis as any).__purge1053 || ((x: any) => x))(s.rows, "v111-2-zone"); /* fix1053 */ s.rows = s.rows.slice(-4000); for (const k of Object.keys(s.read)) if (s.read[k] < old) delete s.read[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
/** the read: bars = this window's closed 1m bars, price = now, L = the desk's lines. */
export function zoneRead798(asset: string, bars: { l: number; h: number }[], price: number, L: { name: string; price: number }[]): { side: "up" | "down"; label: string; level: number; wick: number } | null {
  const px = (n: string) => Number((L || []).find((l) => String(l.name) === n)?.price) || 0;
  const s1 = px("5m S1"), r1 = px("5m R1"), d = WICK798[asset] ?? 0;
  if (!(price > 0) || !(d > 0) || !bars.length) return null;
  const lo = Math.min(...bars.map((b) => b.l)), hi = Math.max(...bars.map((b) => b.h));
  if (s1 > 0 && lo <= s1 && price >= lo + d) return { side: "up", label: "Green zone wick rejection", level: s1, wick: lo };
  if (r1 > 0 && hi >= r1 && price <= hi - d) return { side: "down", label: "Red zone wick rejection", level: r1, wick: hi };
  return null;
}
function logFill798(r: any) {
  try {
    let rows: any[] = []; try { const j = JSON.parse(readFileSync(D("fill-log.json"), "utf8")); if (Array.isArray(j)) rows = j; else return; } catch { return; }
    const id = `${r.id}:banked`; if (rows.some((e) => e && e.id === id)) return;
    rows.push({ id, at: new Date().toISOString(), kind: "banked", tradeId: r.id, asset: r.asset, ticker: r.ticker, side: r.side, venue: VENUE798, stake: r.stake, ask: r.ask, multiple: r.multiple, profit: r.pnlTp, pattern: `V.111 - 2 · ${r.setup}`, opposite: false, target: null, spot: r.spot, vwap: null, peak: r.bestBid || null, book: "V.111 - 2", setup: r.setup, held: r.pnlHold });
    writeFileSync(D("fill-log.json"), JSON.stringify(rows.filter((e) => e && typeof e.id === "string").sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8000)));
  } catch {}
}
export async function zoneTick798(assets: Record<string, any> | null | undefined, decide: (row: any) => Promise<any>) {
  try {
    if (!assets) return; const s = st(); let dirty = false; const now = Date.now(), m0 = Math.floor(now / 60000) * 60000;
    for (const id of ["btc", "gold"]) {
      const a = assets[id], m = a?.market, left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || !(left > 0) || s.rows.some((r) => r.ticker === m.ticker)) continue;
      const close = Math.round((now + left * 1000) / 60000) * 60000, open = close - 900000;
      if (m0 < open + 60000 || m0 > close - 60000 || now - m0 > 50000) continue;
      const rk = `${m.ticker}:${m0}`; if (s.read[rk]) continue;
      const raw = (G.__pivBars?.[id]?.bars || []) as any[]; if (!raw.length || Number(raw[raw.length - 1].t) * 1000 < m0) continue;
      s.read[rk] = now; dirty = true;
      const bars = raw.filter((b) => Number(b.t) * 1000 >= open && Number(b.t) * 1000 < m0).map((b) => ({ l: Number(b.l), h: Number(b.h) }));
      const price = Number(raw[raw.length - 1].c) || Number(a?.spot) || 0;
      const rd = zoneRead798(id, bars, price, (G.__lawBands?.[id]?.L || []) as any[]); if (!rd) continue;
      const ask = Number(rd.side === "up" ? m.yesAsk : m.noAsk); if (!(ask > 0.01 && ask < 0.99)) { delete s.read[rk]; continue; }
      const row: any = { id: `${m.ticker}:v1112zone`, book: "V.111 - 2", setup: rd.label, tf: "1m", kind: "zone_wick", asset: id, ticker: m.ticker, closeTime: new Date(close).toISOString(), at: new Date().toISOString(), readAt: new Date(m0).toISOString(),
        side: rd.side, ask, multiple: Math.round((1 / ask) * 100) / 100, contracts: STAKE / ask, stake: STAKE, spot: price, level: rd.level, wick: rd.wick, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null };
      s.rows.push(row); dirty = true;
      void decide(row).then((d) => { row.best775 = d; save(); }).catch(() => {});
    }
    for (const r of s.rows) {
      if (r.result !== "open") { if (!r.logged) { logFill798(r); r.logged = true; dirty = true; } continue; }
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) { const bid = Number(r.side === "up" ? m.yesBid : m.noBid); if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; r.soldAt = new Date().toISOString(); dirty = true; } } }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__v1112zoneRes ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const fm = typeof G.__v1112FetchMarket === "function" ? G.__v1112FetchMarket : (await import("./kalshi")).fetchMarket;
      const mk = await fm(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : ""; if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - STAKE) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * r.halfBid : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - STAKE) * 100) / 100;
      logFill798(r); r.logged = true; dirty = true;
    }
    if (dirty) save();
  } catch {}
}
