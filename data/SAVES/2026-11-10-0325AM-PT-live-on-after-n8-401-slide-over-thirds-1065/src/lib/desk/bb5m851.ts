// fix851 5M BOLLINGER · PAPER (Love Nov 6 2026 ~6:08-6:10 PM PT: "yeah it'll basically be our main book with Bollingers added bb 💓, she enters on a (good) push off of a session or a bollinger, not a flip-blip ... if it's $200 away with 2 minutes left, $1 max lol" + "waiting for a 1M close will have her missing a lottt of genuine moves so we can test a 2-5m flip and push off of a bollinger , they hold as walls a lot harder than sessions i'm realizing").
// Replay Nov 2-6 (BTC): the 5m Bollinger held as a wall 74% of touches (session bands 64-67%); a 1m candle that touched the 5m Bollinger (20/2) and closed back off it, 2+ min left in the
// Polymarket 5-minute window, went 62 trades 56% (+$0.21 / $10) - 80% when price was already on her side of the 5m open. Two PAPER books on Polymarket's BTC 5m up/down:
//   5M BOLLINGER (bb5m851): a closed 1m candle touched the 5m Bollinger upper (lower) and closed red (green) back under (over) it - short (long).
//   5M BOLLINGER · 2M PUSH (bb5m851p): a new 2m candle opened within $10 of the 5m Bollinger and has pushed $10 away from it - with the push.
// 2+ minutes left in the 5m window, her 1.5x floor (ask 66.7c or less, 2c or more), once per book per window. Stake by distance to the 5m target: already her side $10, needs under $25 $5,
// needs $25+ $1. Her take profit (half at 75% of the way to $1, the rest trails from 90c: sold 5c off its best bid), otherwise the bell. PAPER ONLY - this file never places, sizes or cancels
// an order and never touches a live book, wall, umpire or switch. It reads Coinbase BTC 1m candles and Polymarket's 5m quotes. Rows: data/bb5m-851.json, skips: data/bb5m-851-skips.jsonl.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "bb5m-851.json";
export type Bar851 = { t: number; o: number; h: number; l: number; c: number };
export const BOOK851 = "bb5m851", BOOK851P = "bb5m851p";
export function bb851(cs: number[]): { u: number; m: number; l: number } | null {
  if (cs.length < 20) return null; const x = cs.slice(-20), m = x.reduce((s, v) => s + v, 0) / 20, sd = Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / 20); return { u: m + 2 * sd, m, l: m - 2 * sd };
}
/** pure: the 5m Bollinger (20/2, closed 5m bars + the forming one) at the close of the last 1m bar in bars (closed 1m bars, oldest first) and the two signals. */
export function signals851(bars: Bar851[]): { book: string; side: "up" | "down"; why: string }[] {
  const out: { book: string; side: "up" | "down"; why: string }[] = []; const n = bars.length; if (n < 110) return out;
  const L = bars[n - 1], c5: number[] = []; let k = -1;
  for (const b of bars) { const kk = Math.floor(b.t / 300); if (kk !== k) { c5.push(b.c); k = kk; } else c5[c5.length - 1] = b.c; }
  const B = bb851(c5); if (!B) return out;
  if (L.h >= B.u - 1 && L.c < L.o && L.c < B.u) out.push({ book: BOOK851, side: "down", why: `1m touched the 5m Bollinger upper ${B.u.toFixed(2)} (high ${L.h.toFixed(2)}) and closed red back under it at ${L.c.toFixed(2)}` });
  else if (L.l <= B.l + 1 && L.c > L.o && L.c > B.l) out.push({ book: BOOK851, side: "up", why: `1m touched the 5m Bollinger lower ${B.l.toFixed(2)} (low ${L.l.toFixed(2)}) and closed green back over it at ${L.c.toFixed(2)}` });
  const k2 = Math.floor(L.t / 120) * 120, f2 = bars.find((b) => b.t === k2); const o2 = f2 ? f2.o : 0;
  if (o2 > 0 && Math.abs(o2 - B.u) <= 10 && L.c <= o2 - 10) out.push({ book: BOOK851P, side: "down", why: `new 2m candle opened ${o2.toFixed(2)} at the 5m Bollinger upper ${B.u.toFixed(2)} and pushed $${(o2 - L.c).toFixed(2)} down` });
  else if (o2 > 0 && Math.abs(o2 - B.l) <= 10 && L.c >= o2 + 10) out.push({ book: BOOK851P, side: "up", why: `new 2m candle opened ${o2.toFixed(2)} at the 5m Bollinger lower ${B.l.toFixed(2)} and pushed $${(L.c - o2).toFixed(2)} up` });
  return out;
}
/** pure: her stake by distance to the 5m target - already her side $10, needs under $25 $5, needs $25+ $1 */
export function stake851(side: "up" | "down", spot: number, target: number): number { const need = side === "up" ? target - spot : spot - target; void need; return 20; } // fix1048 her flat $20 paper ticket (was $10 / $5 / $1 by distance to the target)
type Row = { id: string; book: string; asset: "btc"; ticker: string; slug: string; at: string; closeTime: string; side: "up" | "down"; setup: string; why: string; ask: number; stake: number; contracts: number; target: number; spot: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
function st(): { rows: Row[]; seen: Record<string, number>; lastBar: number } { if (G.__bb851) return G.__bb851; let s = { rows: [] as Row[], seen: {} as Record<string, number>, lastBar: 0 }; try { if (existsSync(D(FILE))) s = { rows: [], seen: {}, lastBar: 0, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__bb851 = s; return s; }
function save() { try { const s = st(); s.rows = s.rows.slice(-3000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
function skip(x: any) { try { appendFileSync(D("bb5m-851-skips.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
async function candles(): Promise<Bar851[]> {
  const c = (G.__bb851C ||= { at: 0, bars: [] as Bar851[] }); if (Date.now() - c.at < 10000 && c.bars.length) return c.bars;
  const end = Math.floor(Date.now() / 1000), start = end - 299 * 60;
  const r = await fetch(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`, { headers: { Accept: "application/json", "User-Agent": "aurelius-paper/1.0" }, signal: AbortSignal.timeout(8000) });
  const d: any[] = await r.json(); if (!Array.isArray(d)) return c.bars;
  c.bars = d.map((x) => ({ t: Number(x[0]), l: Number(x[1]), h: Number(x[2]), o: Number(x[3]), c: Number(x[4]) })).sort((a, b) => a.t - b.t); c.at = Date.now(); return c.bars;
}
const sideBid = (side: "up" | "down", top: { bid: number; ask: number }) => (side === "up" ? top.bid : Math.round((1 - top.ask) * 100) / 100);
const sideAsk = (side: "up" | "down", top: { bid: number; ask: number }) => (side === "up" ? top.ask : Math.round((1 - top.bid) * 100) / 100);
export async function bb5mTick851() {
  if (G.__bb851Busy || (G.__bb851At && Date.now() - G.__bb851At < 5000)) return; G.__bb851Busy = true; G.__bb851At = Date.now();
  try {
    const pm: any = await import("./poly-live.server"); const s = st(); let dirty = false;
    const all = await candles(); const nowS = Math.floor(Date.now() / 1000), closed = all.filter((b) => b.t + 60 <= nowS);
    const last = closed[closed.length - 1];
    if (last && last.t > s.lastBar && nowS - (last.t + 60) < 45) {
      s.lastBar = last.t; dirty = true;
      const closeS = Math.ceil((last.t + 60 + 1) / 300) * 300, left = closeS - nowS, closesAt = new Date(closeS * 1000).toISOString();
      for (const sg of signals851(closed)) {
        const key = sg.book + ":" + closesAt; if (s.seen[key]) continue;
        if (left < 120) { skip({ book: sg.book, side: sg.side, why: `only ${left}s left in the 5m window (needs 2+ min)` }); continue; }
        const w = await pm.polyWindow5("btc", closesAt).catch(() => null); if (!w?.slug) { skip({ book: sg.book, side: sg.side, why: "no Polymarket 5m window yet" }); continue; }
        const top = await pm.bookTop(w.slug).catch(() => null); if (!top) { skip({ book: sg.book, side: sg.side, why: "no Polymarket quote" }); continue; }
        const ask = sideAsk(sg.side, top); if (!(ask >= 0.02 && ask <= 0.667)) { skip({ book: sg.book, side: sg.side, ask, why: `ask ${ask} outside 2c-66.7c (her 1.5x floor)` }); s.seen[key] = Date.now(); continue; }
        const startS = closeS - 300, open5 = (closed.find((b) => b.t === startS) || all.find((b) => b.t === startS))?.o || 0;
        const target = Number(w.target) > 0 ? Number(w.target) : open5; if (!(target > 0)) { skip({ book: sg.book, side: sg.side, why: "no 5m target" }); continue; }
        const stake = stake851(sg.side, last.c, target);
        s.seen[key] = Date.now();
        s.rows.push({ id: `${w.slug}:${sg.book}`, book: sg.book, asset: "btc", ticker: w.slug, slug: w.slug, at: new Date().toISOString(), closeTime: closesAt, side: sg.side, setup: sg.book === BOOK851 ? "5M BOLLINGER · 1m touch-and-close-back" : "5M BOLLINGER · 2m push", why: sg.why, ask, stake, contracts: Math.round((stake / ask) * 100) / 100, target, spot: last.c, bestBid: sideBid(sg.side, top), half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
      }
    }
    for (const r of s.rows) {
      if (r.result !== "open") continue;
      const closeMs = Date.parse(r.closeTime);
      if (Date.now() < closeMs) {
        if (r.soldBid != null) continue;
        const top = await pm.bookTop(r.slug).catch(() => null); if (!top) continue; const bid = sideBid(r.side, top);
        if (bid > r.bestBid) { r.bestBid = bid; dirty = true; }
        if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; }
        if (bid >= 0.9) r.trail = true;
        if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; }
        continue;
      }
      if (Date.now() < closeMs + 70000) continue; // the closing 1m candle must be in
      const bar = all.find((b) => b.t === closeMs / 1000 - 60); if (!bar) continue;
      const won = r.side === "up" ? bar.c > r.target : bar.c < r.target, settle = won ? 1 : 0;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((r.contracts * settle - r.stake) * 100) / 100;
      const restPx = r.soldBid != null ? r.soldBid : settle;
      r.pnlTp = Math.round(((r.half ? 0.5 * r.contracts * (r.halfBid as number) + 0.5 * r.contracts * restPx : r.contracts * restPx) - r.stake) * 100) / 100; dirty = true;
    }
    if (dirty) save();
  } catch {} finally { G.__bb851Busy = false; }
}
