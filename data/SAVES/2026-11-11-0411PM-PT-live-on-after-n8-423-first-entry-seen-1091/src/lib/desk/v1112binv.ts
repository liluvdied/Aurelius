// fix795 BESTIE · INVERSE · PAPER (Love Nov 6 2026 ~5:14 AM PT: "pls make an inverse of the book running if it's at 33% that is supposed to be the other way around bb").
// PAPER ONLY: never places, sizes, cancels or reads a live order; own file data/bestie-inv-795.json, fill-log venue "paper-bestie-inv".
// THE BOOK: every window BESTIE actually filled on Kalshi (data/live-book-done.json, her ':bestie:' ticket filled / partial) is taken here on the OTHER side, in the same
// window, at that side's real ask the moment the desk sees her fill; $5; one per window. Scored on the live exit (half at 75% of the way to $1, the rest at 95%, else the bell),
// settled from Kalshi. Replay (her live fills 2:01 - 5:15 AM PT Nov 6): 7 of 7 won, +$16.76 at $5 (BESTIE live: 2 W / 5 L, -$35.89).
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const BOOK795 = "BESTIE · INVERSE", VENUE795 = "paper-bestie-inv";
const FILE = "bestie-inv-795.json", STAKE = 20; /* fix1048 her flat $20 paper ticket (Love Nov 9 2026: "make all books $20 on paper") */
function st(): { rows: any[] } {
  if (G.__bestieInv795) return G.__bestieInv795;
  let s = { rows: [] as any[] }; try { if (existsSync(D(FILE))) s = { rows: [], ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {}
  G.__bestieInv795 = s; return s;
}
function save() { try { const s = st(); s.rows = s.rows.slice(-4000); writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
/** her filled BESTIE tickets: ticker -> { side, at } (first fill of the window). */
export function bestieFills795(doc: Record<string, any>): Record<string, { side: "up" | "down"; at: string }> {
  const out: Record<string, { side: "up" | "down"; at: string }> = {};
  for (const [k, v] of Object.entries(doc || {})) { if (k.split(":")[1] !== "bestie" || !v || (v.status !== "filled" && v.status !== "partial") || (v.side !== "up" && v.side !== "down")) continue; const tk = String(v.ticker || k.split(":")[0]); if (!out[tk] || String(v.at) < out[tk].at) out[tk] = { side: v.side, at: String(v.at) }; }
  return out;
}
function logFill795(r: any) {
  try {
    let rows: any[] = []; try { const j = JSON.parse(readFileSync(D("fill-log.json"), "utf8")); if (Array.isArray(j)) rows = j; else return; } catch { return; }
    const id = `${r.id}:banked`; if (rows.some((e) => e && e.id === id)) return;
    rows.push({ id, at: new Date().toISOString(), kind: "banked", tradeId: r.id, asset: r.asset, ticker: r.ticker, side: r.side, venue: VENUE795, stake: r.stake, ask: r.ask, multiple: r.multiple, profit: r.pnlTp, pattern: `${BOOK795} · ${r.setup}`, setup: r.setup, opposite: true, target: null, spot: null, vwap: null, peak: r.bestBid || null, book: BOOK795, held: r.pnlHold });
    writeFileSync(D("fill-log.json"), JSON.stringify(rows.filter((e) => e && typeof e.id === "string").sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8000)));
  } catch {}
}
/** one tick: mirror her new fills, then bids / 75-95 exit / settlement. */
export async function binvTick795(assets: Record<string, any> | null | undefined) {
  try {
    if (!assets) return; const s = st(); let dirty = false;
    let doc: Record<string, any> = {}; try { doc = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")) || {}; } catch {}
    const fills = bestieFills795(doc);
    for (const id of ["btc", "gold"]) {
      const m = assets[id]?.market, left = Number(assets[id]?.secondsLeft) || 0; if (!m?.ticker || !(left > 30)) continue;
      const f = fills[m.ticker]; if (!f || s.rows.some((r) => r.ticker === m.ticker)) continue;
      const side: "up" | "down" = f.side === "up" ? "down" : "up", ask = Number(side === "up" ? m.yesAsk : m.noAsk);
      if (!(ask > 0.01 && ask < 0.99)) continue; // no price to take it at this second - try again next tick
      const hr = [...((G.__v1112fb789?.rows as any[]) || []), ...((G.__v1112?.rows as any[]) || [])].find((x) => x && x.ticker === m.ticker && x.side === f.side); // her set up, so this book scores by set up (Love ~5:34 AM: "pls have all of her inverse books scoring on set ups too")
      s.rows.push({ id: `${m.ticker}:bestieinv`, book: BOOK795, setup: hr ? String(hr.setup) : `her ${f.side === "up" ? "long" : "short"}`, asset: id, ticker: m.ticker, closeTime: new Date(Date.now() + left * 1000).toISOString(), at: new Date().toISOString(), herAt: f.at,
        herSide: f.side, side, ask, multiple: Math.round((1 / ask) * 100) / 100, contracts: STAKE / ask, stake: STAKE, bestBid: 0, half: false, halfBid: null, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
      dirty = true;
    }
    for (const r of s.rows) {
      if (r.result !== "open") { if (!r.logged) { logFill795(r); r.logged = true; dirty = true; } continue; }
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) { const bid = Number(r.side === "up" ? m.yesBid : m.noBid); if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.95 * (1 - r.ask)) { r.soldBid = bid; dirty = true; } } }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__bestieInvRes ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const fm = typeof G.__v1112FetchMarket === "function" ? G.__v1112FetchMarket : (await import("./kalshi")).fetchMarket;
      const mk = await fm(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : ""; if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - (r.contracts * r.ask)) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * r.halfBid : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - (r.contracts * r.ask)) * 100) / 100;
      logFill795(r); r.logged = true; dirty = true;
    }
    if (dirty) save();
  } catch {}
}
