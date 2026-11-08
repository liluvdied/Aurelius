// fix789 BESTIE TAKES THE NEXT VALID SET UP (Love Nov 6 2026 ~2:38 AM PT: "i want to raise the floor to 1.6 , if she misses that i want her to trade the next band too pls" +
// ~3:18 AM PT: "yes let's have her be able to make any valid one of her set ups").
// WIDENED: she is armed for a window whenever V.111 - 2's take there did not become BESTIE's - (a) its ask is over her floor, (b) it is not on her list, or (c) the live copier
// refused / skipped BESTIE's row for any other gate (data/live-book-done.json status skipped / blocked). A next-band take that is itself refused at the wire re-arms the window.
// When V.111 - 2's take of a window is on BESTIE's list but its ask is over BESTIE's floor (live-switch bookFloor788.bestie, fix788 = 1.6x -> over 62.5c; no entry = her send's 1.5x),
// BESTIE "misses" it - so for that window she stays armed: V.111 - 2's same brain (read770, the same bars, the same minutes 1-14, once a minute) keeps reading for BESTIE only, and the
// first read that is on her list (the same decide775 answer BESTIE gets) with an ask at or under her floor becomes BESTIE's take for that window. Either side; still ONE ticket a window
// (the copier's one-per-window lock) and no flips (nothing was held). V.111 - 2's own paper book is unchanged (still one take a window) - these rows live in their own file
// (data/v111-2-fb-789.json) and are handed to the copier with BESTIE's (v1112best.ts liveRows775). Scored like hers ($20 paper scale, her take-profit) for BESTIE's card only; never in the fill log.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "v111-2-fb-789.json", STAKE = 20;
export function st789(): { rows: any[]; armed: Record<string, number>; read: Record<string, number> } {
  if (G.__v1112fb789) return G.__v1112fb789;
  let s = { rows: [] as any[], armed: {} as Record<string, number>, read: {} as Record<string, number> };
  try { if (existsSync(D(FILE))) s = { rows: [], armed: {}, read: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {}
  G.__v1112fb789 = s; return s;
}
function save789() { try { const s = st789(), old = Date.now() - 6 * 3600000; s.rows = s.rows.slice(-2000); for (const o of [s.armed, s.read]) for (const k of Object.keys(o)) if (o[k] < old) delete o[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
/** BESTIE's highest ask: 1 / her floor (live-switch bookFloor788.bestie when over 1.5, else her send's 1.5x). */
export function maxAsk789(): number {
  let f = 1.5; try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.bookFloor788?.bestie); if (Number.isFinite(v) && v > 1.5) f = v; } catch {}
  return 1 / f;
}
function doneDoc789(): Record<string, any> {
  const c = G.__done789; if (c && Date.now() - c.at < 3000) return c.v;
  let v: Record<string, any> = {}; try { v = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")) || {}; } catch {}
  G.__done789 = { at: Date.now(), v }; return v;
}
type Deps789 = { read770: (a: string, bars: any[], left: number, cut: string[]) => any; fillGaps770: (b: any[]) => any[]; bars770: (id: string) => any[]; cutList770: () => string[]; decide: (row: any) => Promise<any> };
/** one tick: arm on a missed BESTIE take, read for the armed windows, settle her fallback rows. `her` = V.111 - 2's rows. */
export async function fbTick789(assets: Record<string, any> | null | undefined, her: any[], dep: Deps789) {
  try {
    if (!assets) return;
    const s = st789(), now = Date.now(), m0 = Math.floor(now / 60000) * 60000, cap = maxAsk789(); let dirty = false;
    const done = doneDoc789();
    for (const r of her) { // she missed it: armed for that window
      if (!r?.best775 || s.armed[r.ticker] || !(Date.parse(r.closeTime) > now)) continue;
      const v = done[`${r.ticker}:bestie:${r.ticker}:v1112`];
      const miss = r.best775.ok !== true ? "not on her list" : Number(r.ask) > cap + 1e-9 ? "over her floor" : v && (v.status === "skipped" || v.status === "blocked") ? "refused: " + String(v.reason || v.status).slice(0, 80) : "";
      if (miss) { s.armed[r.ticker] = now; (s as any).why = { ...((s as any).why || {}), [r.ticker]: miss }; dirty = true; }
    }
    for (const id of ["btc", "gold"]) {
      const a = assets[id], m = a?.market, left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || !(left > 0) || !s.armed[m.ticker]) continue;
      const mine = s.rows.filter((x) => x.ticker === m.ticker); // a next-band take refused at the wire re-arms the window
      if (mine.some((x) => { const v = done[`${x.ticker}:bestie:${x.id}`]; return !(v && (v.status === "skipped" || v.status === "blocked")); })) continue;
      const close = Math.round((now + left * 1000) / 60000) * 60000, open = close - 900000;
      if (m0 < open + 60000 || m0 > close - 60000 || now - m0 > 50000) continue; // her reads: minutes 1-14, once each
      const rk = `${m.ticker}:${m0}`; if (s.read[rk]) continue;
      const all = dep.bars770(id); if (!all.length || all[all.length - 1].t < m0) continue;
      const bars = dep.fillGaps770(all.filter((b: any) => b.t < m0)).filter((b: any) => b.t >= m0 - 6 * 3600000);
      s.read[rk] = now; dirty = true;
      const rd = dep.read770(id, bars, (close - m0) / 1000, dep.cutList770()), tk = rd?.take; if (!tk || (tk.side !== "up" && tk.side !== "down")) continue;
      const ask = Number(tk.side === "up" ? m.yesAsk : m.noAsk); if (!(ask > 0.01 && ask <= cap + 1e-9)) continue; // still over her floor - keep reading
      const row: any = { id: `${m.ticker}:v1112fb${mine.length ? mine.length + 1 : ""}`, book: "V.111 - 2", setup: tk.label, tf: tk.tf, kind: tk.kind, asset: id, ticker: m.ticker, closeTime: new Date(close).toISOString(), at: new Date().toISOString(), readAt: new Date(m0).toISOString(),
        side: tk.side, ask, multiple: Math.round((1 / ask) * 100) / 100, contracts: STAKE / ask, stake: STAKE, spot: Number(rd.spot) || 0, vwap: Number(rd.vwap) || 0, stdev: Number(rd.stdev) || 0, level: Number.isFinite(Number(tk.level)) ? Number(tk.level) : null,
        bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null, fb789: true };
      const d = await dep.decide(row).catch(() => null);
      if (!d || d.ok !== true || s.rows.filter((x) => x.ticker === m.ticker).length !== mine.length) continue; // not on her list - keep reading
      row.best775 = d; s.rows.push(row); dirty = true;
    }
    for (const r of s.rows) { // her take-profit + settlement, for BESTIE's card (no fill log)
      if (r.result !== "open") continue;
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) { const bid = Number(r.side === "up" ? m.yesBid : m.noBid); if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; r.soldAt = new Date().toISOString(); dirty = true; } } }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__v1112fbRes ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const fm = typeof G.__v1112FetchMarket === "function" ? G.__v1112FetchMarket : (await import("./kalshi")).fetchMarket;
      const mk = await fm(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : ""; if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - STAKE) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * r.halfBid : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - STAKE) * 100) / 100; dirty = true;
    }
    if (dirty) save789();
  } catch {}
}
