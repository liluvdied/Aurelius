// fix777 V.111 - 2 INVERSE · PAPER BOOK (Love Nov 5 2026 ~9:48 PM PT: "and the V.111 version is running at 33% , but that's a good thing we can invert the trades on that 💞").
// PAPER ONLY: this file never places, sizes, cancels or reads a live order, never touches a live book, wall, umpire, switch or BESTIE. Its fill-log rows carry their own venue
// ("paper-v111-2-inv") so nothing that copies or mirrors paper to Kalshi (engine.ts reads venue === "paper" only) can pick them up, and their pattern
// ("V.111 - 2 INV · <set up>") is never a label BESTIE's BEST list matches her takes on (v1112best.ts matches her raw set up label).
// THE BOOK: every take of V.111 - 2 (v1112.ts), the same second, same asset, same 15m window - the OPPOSITE side, at that side's real live ask in the same Kalshi read
// (no ask for her long -> this book shorts; yes ask for her short -> this book longs). No opposite ask to price it (outside 1c-99c) = no inverse trade that window.
// $20 paper like V.111 - 2, held to the bell, scored under the same take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid) and
// held-to-the-bell beside it. Settled from Kalshi's own result. Its own file data/v111-2-inv-777.json, its own card (paperrows.ts), "(paper)" in OPEN NOW.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const BOOK777 = "V.111 - 2 INV";
export const VENUE777 = "paper-v111-2-inv";
const FILE = "v111-2-inv-777.json", STAKE = 20;
type Row777 = { id: string; book: string; setup: string; tf: string; kind: string; asset: string; ticker: string; closeTime: string; at: string; readAt: string; of: string; herSide: "up" | "down"; herAsk: number; side: "up" | "down"; ask: number; multiple: number; contracts: number; stake: number; spot: number; vwap: number; stdev: number; level: number | null; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null; logged?: boolean };
function st(): { rows: Row777[]; skipped: number } {
  if (G.__v1112inv) return G.__v1112inv;
  let s = { rows: [] as Row777[], skipped: 0 };
  try { if (existsSync(D(FILE))) s = { skipped: 0, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {}
  G.__v1112inv = s; return s;
}
function save() { try { const s = st(); ((globalThis as any).__purge1053 || ((x: any) => x))(s.rows, "v111-2-inv"); /* fix1053 */ s.rows = s.rows.slice(-4000); writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
function logFill777(r: Row777) {
  try {
    let rows: any[] = [];
    try { const j = JSON.parse(readFileSync(D("fill-log.json"), "utf8")); if (Array.isArray(j)) rows = j; else return; } catch { return; } // never write over a log it could not read
    const id = `${r.id}:banked`;
    if (rows.some((e) => e && e.id === id)) return;
    rows.push({ id, at: new Date().toISOString(), kind: "banked", tradeId: r.id, asset: r.asset, ticker: r.ticker, side: r.side, venue: VENUE777, stake: r.stake, ask: r.ask, multiple: r.multiple,
      profit: r.pnlTp, pattern: `${BOOK777} · ${r.setup}`, opposite: true, target: null, spot: r.spot, vwap: r.vwap, peak: r.bestBid || null, book: BOOK777, setup: r.setup, tf: r.tf, held: r.pnlHold });
    const trimmed = rows.filter((e) => e && typeof e.id === "string").sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8000);
    writeFileSync(D("fill-log.json"), JSON.stringify(trimmed));
  } catch {}
}
/** V.111 - 2 just took `her` off market read `m` (the same object, the same second): open the opposite side at its real ask. */
export function invTake777(her: any, m: any): Row777 | null {
  try {
    if (!her || !m || (her.side !== "up" && her.side !== "down") || !her.ticker || m.ticker !== her.ticker) return null;
    const s = st(), id = `${her.ticker}:v1112inv`;
    if (s.rows.some((r) => r.id === id)) return null; // one per window, like her
    const side: "up" | "down" = her.side === "up" ? "down" : "up";
    const ask = Number(side === "up" ? m.yesAsk : m.noAsk);
    if (!(ask > 0.01 && ask < 0.99)) { s.skipped = (Number(s.skipped) || 0) + 1; save(); return null; }
    const r: Row777 = { id, book: BOOK777, setup: String(her.setup || ""), tf: String(her.tf || ""), kind: String(her.kind || ""), asset: her.asset, ticker: her.ticker, closeTime: her.closeTime, at: her.at, readAt: her.readAt, of: String(her.id || ""),
      herSide: her.side, herAsk: Number(her.ask) || 0, side, ask, multiple: Math.round((1 / ask) * 100) / 100, contracts: STAKE / ask, stake: STAKE, spot: Number(her.spot) || 0, vwap: Number(her.vwap) || 0, stdev: Number(her.stdev) || 0,
      level: her.level ?? null, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null };
    s.rows.push(r); save(); return r;
  } catch { return null; }
}
/** bids, take-profit and settlement - the same steps as V.111 - 2's own rows (v1112.ts), on this book's rows only. */
export async function invSettle777(assets: Record<string, any> | null | undefined) {
  try {
    if (!assets) return;
    const s = st(); let dirty = false;
    for (const r of s.rows) {
      if (r.result !== "open") { if (!r.logged) { logFill777(r); r.logged = true; dirty = true; } continue; }
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) {
        const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
        if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; } }
      }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__v1112InvRes ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const fm = typeof G.__v1112FetchMarket === "function" ? G.__v1112FetchMarket : (await import("./kalshi")).fetchMarket; // read only: the market's settled result
      const mk = await fm(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - STAKE) * 100) / 100;
      r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - STAKE) * 100) / 100;
      logFill777(r); r.logged = true; dirty = true;
    }
    if (dirty) save();
  } catch {}
}
