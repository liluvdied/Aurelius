// fix824 AWAY FROM LINE (Love Nov 6 2026 ~10:59 AM PT: "yes to the replay. and nonetheless, if a target sits within $1.50 of those i do want her to take the trade the other direction if it is above the floor / beginning of the window oki. and include those in your replay to see how they did compared to ours, if she had entered the other direction at the beginning of the window when it was an option").
// In the first 5 minutes of each 15-minute window, when the window's target sits within $1.50 (gold) / $50 (BTC) of a session band (VWAP or a σ line), a Bollinger (upper / middle / lower) or the
// red / green zone, she takes the side trading AWAY from that line (line above price = short, line below = long) - the first second it applies, only while that side pays her 1.5x floor (ask 66.7c
// or less). One take per window per asset, for main and REJECTION (every book but delayed). Labelled "AWAY FROM LINE · <line>", $5, recorded in data/away-824.json and scored in SET UP SCORES
// as its own book; handed to the copier like her flips (fix819): her band walls are waived (her words: take it the other direction), the umpire, freshness, the pink at the wire and every money
// rail still judge it. Replay (Oct 30 - Nov 6, real Kalshi prices, $10, 75/95): every window, first 5 min, ask <= 66c - gold 150 trades 60% +$0.87/trade, BTC 183 trades 57% +$0.58/trade,
// before fees; ~breakeven on windows with Kalshi's exact strike. Every decision is logged to data/away-824.jsonl. live-switch awayLine824 false = off.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const TOL824: Record<string, number> = { gold: 1.5, btc: 50 };
export const AT824: Record<string, number> = { gold: 0.3, btc: 10 }; // a line sitting right on price is neither above nor below - no call
export const FLOOR824 = 1.5, STAKE824 = 5, FIRST_SECS824 = 300, LABEL824 = "AWAY FROM LINE";
export const BOOKS824 = ["recon-tog", "recon-rej"];
export function on824(): boolean { try { return JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.awayLine824 !== false; } catch { return true; } }
/** her lines from the board + the Bollinger frame */
export function lines824(L: { name: string; price: number }[], bb?: { bbU?: number; bbL?: number } | null): { name: string; price: number }[] {
  const out: { name: string; price: number }[] = [];
  for (const l of (L || [])) { const n = String(l?.name || ""), p = Number(l?.price); if (!(p > 0)) continue; if (/σ$|^session VWAP$/.test(n)) out.push({ name: n, price: p }); else if (n === "5m R1" || n === "Red zone") out.push({ name: "red zone", price: p }); else if (n === "5m S1" || n === "Green zone") out.push({ name: "green zone", price: p }); }
  const U = Number(bb?.bbU), Lo = Number(bb?.bbL); if (U > 0 && Lo > 0) out.push({ name: "Bollinger upper", price: U }, { name: "Bollinger middle", price: (U + Lo) / 2 }, { name: "Bollinger lower", price: Lo });
  return out;
}
/** pure: the side away from the line(s) by the target, or null (no line by the target, a line right on price, or lines on both sides) */
export function awaySide824(asset: string, price: number, target: number, lines: { name: string; price: number }[]): { side: "up" | "down"; line: string } | null {
  const tol = TOL824[asset] || 0, at = AT824[asset] || 0; if (!(price > 0) || !(target > 0) || !(tol > 0)) return null;
  const near = lines.filter((x) => Math.abs(x.price - target) <= tol).sort((a, b) => Math.abs(a.price - target) - Math.abs(b.price - target));
  if (!near.length) return null;
  const sides = new Set<string>(); for (const x of near) { if (Math.abs(x.price - price) < at) continue; sides.add(x.price > price ? "down" : "up"); }
  if (sides.size !== 1) return null;
  return { side: [...sides][0] as "up" | "down", line: near[0].name };
}
function st(): { rows: any[]; seen: Record<string, number> } { if (G.__a824) return G.__a824; let s = { rows: [] as any[], seen: {} as Record<string, number> }; try { if (existsSync(D("away-824.json"))) s = { seen: {}, ...JSON.parse(readFileSync(D("away-824.json"), "utf8")) }; } catch {} G.__a824 = s; return s; }
function save() { try { const s = st(); s.rows = s.rows.slice(-3000); const cut = Date.now() - 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D("away-824.json.tmp"), JSON.stringify(s)); renameSync(D("away-824.json.tmp"), D("away-824.json")); } catch {} }
function log(x: any) { try { appendFileSync(D("away-824.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
/** every second with the desk */
export async function awayTick824(assets: Record<string, any> | null | undefined, now = Date.now()) {
  if (!assets || G.__a824Busy || !on824()) return; G.__a824Busy = true;
  try {
    const s = st(); let dirty = false;
    for (const a of ["gold", "btc"]) {
      const m = assets[a]?.market, left = Number(assets[a]?.secondsLeft) || 0; if (!m?.ticker || !/15M-/.test(String(m.ticker))) continue;
      const into = 900 - left; if (!(into >= 0 && into <= FIRST_SECS824) || s.seen[m.ticker]) continue;
      let price = 0, target = 0, L: any[] = [];
      try { const B = await import("./bandlock"), q = (await import("./quotes")).quoteTick(a); price = q && now - Number(q.at) <= 2500 ? Number(q.c) : 0; target = Number(B.targetNow(a, now)) || 0; } catch {}
      const lb = G.__lawBands?.[a]; if (lb && Array.isArray(lb.L) && now - Number(lb.at) <= 15000) L = lb.L;
      const z = G.__bbsr?.[a], bb = z && now - Number(z.at || 0) <= 20000 ? z : null;
      if (!(price > 0) || !(target > 0) || !L.length) continue; // can't see the board yet - try next second
      const d = awaySide824(a, price, target, lines824(L, bb)); if (!d) continue;
      const ask = Number(d.side === "up" ? m.yesAsk : m.noAsk) || 0;
      if (!(ask >= 0.05 && 1 / ask >= FLOOR824 - 1e-9)) { if (!s.seen[m.ticker + ":x"]) { s.seen[m.ticker + ":x"] = now; log({ ticker: m.ticker, asset: a, side: d.side, line: d.line, ask, action: "waiting", why: `that side costs ${Math.round(ask * 100)}c - over her 1.5x floor; keeps looking until ${FIRST_SECS824 / 60} min in` }); dirty = true; } continue; }
      s.seen[m.ticker] = now;
      for (const book of BOOKS824) s.rows.push({ id: `${m.ticker}:${book}:away824`, book, asset: a, ticker: m.ticker, side: d.side, setup: `${LABEL824} · ${d.line}`, line: d.line, target, price, at: new Date(now).toISOString(), closeTime: new Date(now + left * 1000).toISOString(), ask, contracts: STAKE824 / ask, half: false, halfBid: null, restBid: null, result: "open", pnlTp: null });
      log({ ticker: m.ticker, asset: a, side: d.side, line: d.line, target, price, ask, secsIn: Math.round(into), action: "taken", books: BOOKS824 }); dirty = true;
    }
    if (dirty) save();
    await settle(assets, now);
  } catch {} finally { G.__a824Busy = false; }
}
async function settle(assets: Record<string, any>, now: number) {
  const s = st(); let dirty = false;
  for (const r of s.rows) {
    if (r.result !== "open") continue;
    const m = assets[r.asset]?.market;
    if (m?.ticker === r.ticker && r.restBid == null) { const bid = Number(r.side === "up" ? m.yesBid : m.noBid) || 0; if (bid > 0) { if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (r.half && bid >= r.ask + 0.95 * (1 - r.ask)) { r.restBid = bid; dirty = true; } } }
    if (now < Date.parse(r.closeTime) + 20000) continue;
    const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : ""; if (!res) continue;
    const won = res === r.side, c = r.contracts, h = r.half ? c / 2 : 0; r.result = won ? "win" : "loss"; r.pnlTp = Math.round(((r.half ? h * r.halfBid : 0) + (c - h) * (r.restBid != null ? r.restBid : won ? 1 : 0) - STAKE824) * 100) / 100; dirty = true;
  }
  if (dirty) save();
}
/** an order's label: true = one of her AWAY FROM LINE takes (her band walls are waived at the last line) */
export function isAway824(book: string, label: string): boolean { if (!BOOKS824.includes(book) || !String(label).startsWith(LABEL824) || !on824()) return false; return st().rows.some((r) => r.book === book && r.setup === String(label).split(" (")[0] && r.result === "open"); }
/** her takes as main / REJ rows for the copier */
export function liveRows824(): any[] {
  if (!on824()) return [];
  return st().rows.filter((r) => r?.ticker && /15M-/.test(String(r.ticker))).map((r) => ({ id: r.id, book: r.book, at: r.at, asset: r.asset, ticker: r.ticker, side: r.side, setup: r.setup, label: r.setup, ask: r.ask, multiple: r.ask > 0 ? 1 / r.ask : 0, stake: STAKE824, tpPct: 0, peakPct: 0, exit: r.result === "open" ? undefined : r.restBid != null ? "sold" : "held to the bell", soldAt: undefined, sellBid: null, result: r.result, pnl: r.pnlTp, closeTime: r.closeTime }));
}
