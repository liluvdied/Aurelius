// fix801 THE PINK SLIDE TAP (Love Nov 6 2026 ~6:40 AM PT: "and yes , on pink slides she waits for it to come to pink and reject. no flip necessary on pink slides just get in at the
// best multiple she can. those are our strongest set up by far"). While her SLIDE UNDER PINK hold is on for an asset (the engine's own hold: no longs), the moment price comes back up
// to the pink (within 5% of the channel) and turns back down (7.5% of the channel off it, never through) - her pink-tap rejection (fix705's own tap reader) - she SHORTS at that second's
// real ask, no flip candle. Mirror: while CLIMB OVER PINK is on (no shorts), a tap down to pink that turns back up = the LONG. Best multiple: the first ask at or over her 1.5x floor
// from the rejection on, only while price is still at the pink (within 25% of the channel of it) and at most 90 s after the rejection - the nearer pink, the better the multiple.
// One ticket per window (the copier's own fired-window rule). Her walls at the send waive ONLY the flip / candle / thirds (through her rejection hook rej668) and the pink cushion for
// this label while the hold is on and price is at the pink (bandlock tapFree801); the 55% is already free in the slide (fix800). Money rails, floor, $10 level, past-the-zone, the umpire
// and the 75/95 exit are unchanged. Main + rejection get the take (every live book but delayed); live-switch pinkSlideTap801 false = off. Every take is also written to
// data/pink-slide-801.json at $5 (her paper record, scored half at 75% / rest at 95% of the way) - fix802's PINK SLIDE ONLY card reads that file.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";
import { tapStep705, type Tap705 } from "./pinktap";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "pink-slide-801.json";
export const TAP_LABEL801 = "PINK SLIDE TAP (fix801)", AT_PINK801 = 0.25; // the same two as bandlock.ts (its waiver) - tools/pink-slide-tap-801.cjs proves they match
export const FLOOR801 = 1.5, STAKE801 = 20 /* fix1048 */, WAIT801 = 90000, MINLEFT801 = 30;
export const LIVE_ASSETS801: Record<string, boolean> = { btc: true, gold: false }; // fix810
export const BOOKS801 = ["recon-tog", "recon-rej"]; // every live book but delayed (her standing default) - the books her slide / climb hold lives on
export type Row801 = { id: string; asset: string; ticker: string; closeTime: string; at: string; tapAt: string; side: "up" | "down"; setup: string; pink: number; W: number; spot: number; ask: number; stake?: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; restBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null; hold: string };
/** her channel around the pink: the session band right above it minus the one right below (same lines her rejection hook reads) */
export function chan801(L: { name: string; price: number }[], pink: number): number {
  const S = (L || []).filter((l) => Number(l.price) > 0 && /σ$|^session VWAP$/.test(String(l.name))).map((l) => Number(l.price)).sort((a, b) => a - b);
  const top = S.find((x) => x > pink), bot = [...S].reverse().find((x) => x < pink);
  return top !== undefined && bot !== undefined && top > bot ? top - bot : 0;
}
/** the hold that frees this side: a short needs her SLIDE (longs held), a long needs her CLIMB (shorts held). block = the engine's slideBlock658. */
export function holdOn801(asset: string, side: string, block: (a: string, s: string) => string): string {
  try { const h = String(block(asset, side === "down" ? "up" : "down") || ""); return side === "down" ? (/^no long: /.test(h) ? h.slice(9) : "") : side === "up" ? (/^no short: /.test(h) ? h.slice(10) : "") : ""; } catch { return ""; }
}
/** her floor: a real ask that pays 1.5x or better */
export function floorOk801(ask: number): boolean { return ask > 0.01 && ask < 1 && 1 / ask >= FLOOR801 - 1e-9; }
/** still at the pink: on the rejection side (or a hair through) and within 25% of the channel */
export function atPink801(side: string, spot: number, pink: number, W: number): boolean { const d = side === "down" ? pink - spot : spot - pink; return W > 0 && d >= -0.05 * W && d <= AT_PINK801 * W; }
/** her exit on one row: half at 75% of the way to $1, the rest at 95%; else the bell */
export function exitStep801(r: Row801, bid: number): boolean {
  if (!(bid > 0) || r.restBid != null) return false; let ch = false;
  r.bestBid = Math.max(r.bestBid, bid);
  if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; ch = true; }
  if (r.half && bid >= r.ask + 0.95 * (1 - r.ask)) { r.restBid = bid; ch = true; }
  return ch;
}
export function settle801(r: Row801, won: boolean) {
  const pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
  r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - (r.contracts * r.ask)) * 100) / 100;
  r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.restBid != null ? r.restBid : pay) - (r.contracts * r.ask)) * 100) / 100;
}
function st(): { rows: Row801[]; seen: Record<string, number> } { if (G.__ps801) return G.__ps801; let s = { rows: [] as Row801[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__ps801 = s; return s; }
function save(force = false) { if (!force && G.__ps801SaveAt && Date.now() - G.__ps801SaveAt < 10000) return; G.__ps801SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
function liveOn801(): boolean { try { return JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.pinkSlideTap801 !== false; } catch { return true; } }
export async function pinkSlideTick801(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__ps801Busy) return;
  G.__ps801Busy = true;
  try {
    const s = st(), now = Date.now(); let dirty = false;
    const T = (G.__ps801T ||= {}) as Record<string, Tap705>, P = (G.__ps801P ||= {}) as Record<string, any>;
    let block: (a: string, s: string) => string = () => ""; try { block = (await import("./engine")).slideBlock658; } catch {}
    for (const id of ["btc", "gold"]) {
      const a = assets[id], spot = Number(a?.spot) || 0, m = a?.market, left = Number(a?.secondsLeft) || 0;
      const L = (G.__lawBands?.[id]?.L || []) as { name: string; price: number }[];
      let pink = 0; try { pink = Number(G.__onePink565?.(id)?.pp) || 0; } catch {} if (!(pink > 0)) pink = Number(L.find((l) => String(l.name) === "5m PP")?.price) || 0;
      const W = chan801(L, pink);
      if (!(spot > 0) || !(pink > 0) || !(W > 0) || !m?.ticker) continue;
      const ev = tapStep705((T[id] ||= { zone: false, from: 0, last: spot, touchAt: 0 }), spot, pink, W, now);
      if (ev && !s.seen[m.ticker]) {
        const hold = holdOn801(id, ev, block);
        try { appendFileSync(D("pink-slide-801-taps.jsonl"), JSON.stringify({ at: new Date(now).toISOString(), asset: id, ticker: m.ticker, side: ev, pink, spot, W: Math.round(W * 100) / 100, hold: hold.slice(0, 160), ask: Number(ev === "up" ? m.yesAsk : m.noAsk) || 0 }) + "\n"); } catch {}
        if (hold) P[id] = { ticker: m.ticker, side: ev, tapAt: now, hold };
      }
      const p = P[id];
      if (!p) continue;
      if (now - p.tapAt > WAIT801 || m.ticker !== p.ticker || s.seen[p.ticker] || !atPink801(p.side, spot, pink, W)) { delete P[id]; continue; }
      const ask = Number(p.side === "up" ? m.yesAsk : m.noAsk) || 0;
      if (!floorOk801(ask) || !(left >= MINLEFT801)) continue;
      s.seen[p.ticker] = now; delete P[id];
      const setup = `${p.side === "down" ? "Rejected down off 5m PP" : "Rejected up off 5m PP"} · ${TAP_LABEL801}`;
      s.rows.push({ id: `${p.ticker}:ps801`, asset: id, ticker: p.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date(now).toISOString(), tapAt: new Date(p.tapAt).toISOString(), side: p.side, setup, pink: Math.round(pink * 100) / 100, W: Math.round(W * 100) / 100, spot, ask, stake: STAKE801 /* fix1048 */, contracts: STAKE801 / ask, bestBid: 0, half: false, halfBid: null, restBid: null, result: "open", pnlHold: null, pnlTp: null, hold: String(p.hold).slice(0, 200) });
      dirty = true;
    }
    for (const r of s.rows) {
      if (r.result !== "open") continue;
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker) { if (exitStep801(r, Number(r.side === "up" ? m.yesBid : m.noBid) || 0)) dirty = true; }
      if (now < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__ps801Res ||= {}) as Record<string, number>; if (now - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = now;
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      settle801(r, res === r.side); dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__ps801Busy = false; }
}
/** her pink-slide takes as main + rejection rows for the copier (this process). Off (live-switch pinkSlideTap801 false) = nothing handed over. */
export function liveRows801(): any[] {
  if (!liveOn801()) return [];
  const out: any[] = [];
  for (const r of st().rows) {
    if (!r?.ticker || !/15M-/.test(String(r.ticker))) continue;
    if (LIVE_ASSETS801[r.asset] !== true) continue; // fix810 (her pick "no flip on btc , flip on gold pls :)"): only BTC's pink-slide takes go live; gold stays on her PINK SLIDE ONLY paper card
    for (const book of BOOKS801) out.push({ id: `${r.ticker}:${book}:ps801`, book, at: r.at, asset: r.asset, ticker: r.ticker, side: r.side, setup: r.setup, ask: r.ask, multiple: r.ask > 0 ? 1 / r.ask : 0, stake: STAKE801, tpPct: 0, peakPct: 0,
      exit: r.result === "open" ? undefined : r.restBid != null ? "sold" : "held to the bell", soldAt: undefined, sellBid: null, result: r.result, pnl: r.pnlTp, bands: null, spot: null, event: null, hourPT: Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date(r.at))) % 24 });
  }
  return out;
}
