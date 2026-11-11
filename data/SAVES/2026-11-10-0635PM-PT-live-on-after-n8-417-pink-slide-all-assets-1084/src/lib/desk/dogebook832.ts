// fix832 DOGE · REJECTIONS ONLY · NO PINK - PAPER (Love Nov 6 2026 ~3:16 PM PT (her card pick "Paper books on the desk") to "can you test all of the other 15M markets on kalshi against our rules and see if they do better than gold does bb? 🏁"): a copy of her ETH paper book (fix682 below), same rules and walls scaled by price, on Coinbase DOGE-USD and Kalshi KXDOGE15M. PAPER ONLY.
// fix682 ETH · REJECTIONS ONLY · NO PINK - PAPER (Love Nov 4 2026 11:38 PM PT: "yess, let us do so please ❤️‍🔥 (eth book)" - to Claude's 11:36 PM offer: an ETH rejections-only PAPER
// book "so it gets real numbers with all of her walls during the freeze week"; the broker study: ETH rejection 64% won from the entry over 188 Kalshi-settled trades).
// PAPER ONLY. This file never places, sizes, cancels or reads a live order and never touches a live book, wall, umpire or switch. Her live pipeline carries only BTC and gold,
// so ETH gets its own feed and her rejections-only rules are re-drawn here with the same numbers, scaled from BTC by price where they are in $:
//   Feed: Coinbase DOGE-USD 1m candles (public), the forming minute included. Bands: her session VWAP ±1/2/3σ (volume-weighted, 5 PM ET reset), her 5m CM pivot (EMA-8 of the typical
//         price incl. the forming candle; red zone R1 / green zone S1 = ±the 7-candle average range), Bollinger 20/2 on 5m.
//   Read (rejections only, no pink, no breaks): this 5m candle came within 15% of the channel of a session band / the green or red zone / a Bollinger band from its near side and did
//         not break it by her break distance, and price is back off it by her push with the live 2m candle her colour (or 20% of the channel off it - her no-flip rejection).
//   Walls: thirds (no long in the top 33%, no short in the bottom 33% of the session channel), past the red / green zone, pink-to-red / pink-to-green 45%, her pink cushion (BTC tiers
//         scaled by price), her 1.5x floor (ask <= 66.7c), one trade per window.
//   Market: Kalshi KXDOGE15M (the running window), $20 paper at the live ask; her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid, else the bell).
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket, mapMarket } from "./kalshi";
import type { KalshiMarket } from "./types";
import { pinkSlideWall1084 } from "./pinkslide1084";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const BASE = "https://external-api.kalshi.com/trade-api/v2";
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
type Row832 = { id: string; asset?: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; label: string; spot: number; ask: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
function st(): { rows: Row832[] } { if (G.__doge832) return G.__doge832; let s = { rows: [] as Row832[] }; try { if (existsSync(D("doge-book-832.json"))) s = JSON.parse(readFileSync(D("doge-book-832.json"), "utf8")); } catch {} G.__doge832 = s; return s; }
function save() { if (G.__doge832SaveAt && Date.now() - G.__doge832SaveAt < 15000) return; G.__doge832SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-3000); writeFileSync(D("doge-book-832.json"), JSON.stringify(s)); } catch {} }
async function j(url: string): Promise<any> { const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "aurelius-paper/1.0" }, signal: AbortSignal.timeout(10000) }); return r.json(); }
async function bars(): Promise<Bar[]> {
  const B = (G.__doge832Bars ||= { at: 0, m: new Map<number, Bar>() });
  if (Date.now() - B.at < 10000 && B.m.size) return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
  const need = B.m.size < 600 ? 3 : 1; // first call: the last ~15 h (3 x 300 min); then the newest 300
  for (let k = need - 1; k >= 0; k--) {
    const end = Math.floor(Date.now() / 1000) - k * 300 * 60, start = end - 300 * 60;
    const d = await j(`https://api.exchange.coinbase.com/products/DOGE-USD/candles?granularity=60&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`);
    if (Array.isArray(d)) for (const x of d) B.m.set(x[0], { t: x[0], l: x[1], h: x[2], o: x[3], c: x[4], v: x[5] });
  }
  for (const k of [...B.m.keys()]) if (k < Date.now() / 1000 - 2 * 86400) B.m.delete(k);
  B.at = Date.now(); return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
}
const group = (bs: Bar[], n: number): Bar[] => { const out: Bar[] = []; for (const b of bs) { const k = Math.floor(b.t / (n * 60)) * n * 60, x = out[out.length - 1]; if (x && x.t === k) { x.h = Math.max(x.h, b.h); x.l = Math.min(x.l, b.l); x.c = b.c; x.v += b.v; } else out.push({ ...b, t: k }); } return out; };
/** her bands for ETH: session VWAP ±1/2/3σ (5 PM ET reset), 5m CM pivot (pink / R1 red zone / S1 green zone), Bollinger 20/2 on 5m */
export function dogeBands832(bs: Bar[]): { name: string; price: number }[] {
  const L: { name: string; price: number }[] = []; if (bs.length < 40) return L;
  const last = bs[bs.length - 1], day = (t: number) => Math.floor((t - 22 * 3600) / 86400); let sv = 0, sp = 0, sp2 = 0;
  for (const b of bs) { if (day(b.t) !== day(last.t)) continue; const tp = (b.h + b.l + b.c) / 3, w = Math.max(b.v, 1e-9); sv += w; sp += w * tp; sp2 += w * tp * tp; }
  if (sv > 0) { const vw = sp / sv, sd = Math.sqrt(Math.max(sp2 / sv - vw * vw, 0)); if (sd > 0) { L.push({ name: "session VWAP", price: vw }); for (const k of [1, 2, 3]) { L.push({ name: `+${k}σ`, price: vw + k * sd }); L.push({ name: `-${k}σ`, price: vw - k * sd }); } } }
  const b5 = group(bs, 5).slice(-60);
  if (b5.length >= 10) { let ema = 0; b5.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * 0.25 + ema * 0.75; }); const a = b5.slice(-7).reduce((s, x) => s + (x.h - x.l), 0) / 7; L.push({ name: "5m PP", price: ema }, { name: "Red zone", price: ema + a }, { name: "Green zone", price: ema - a }); }
  if (b5.length >= 20) { const cs = b5.slice(-20).map((x) => x.c), m = cs.reduce((s, x) => s + x, 0) / 20, sd = Math.sqrt(cs.reduce((s, x) => s + (x - m) ** 2, 0) / 20); L.push({ name: "BB upper", price: m + 2 * sd }, { name: "BB lower", price: m - 2 * sd }); }
  return L;
}
/** her rejections-only read + walls, ETH-scaled; returns a call or the reason none */
export function dogeRead832(bs: Bar[], L: { name: string; price: number }[], spot: number): { side: "up" | "down"; label: string } | { why: string } {
  const k = spot / 80000, brk = 2 * k, push = 6 * k; // her BTC $2 break / $6 push, by price
  const S = L.filter((l) => /σ$|^session VWAP$/.test(l.name)).map((l) => l.price).sort((a, b) => a - b);
  const up = S.find((x) => x > spot), dn = [...S].reverse().find((x) => x < spot); if (up === undefined || dn === undefined) return { why: "no session channel" };
  const W = up - dn, f = (spot - dn) / W, nr = 0.15 * W;
  const now = Math.floor(Date.now() / 1000), f5 = Math.floor(now / 300) * 300, f2 = Math.floor(now / 120) * 120;
  const in5 = bs.filter((b) => b.t >= f5), in2 = bs.filter((b) => b.t >= f2); if (!in5.length || !in2.length) return { why: "no live candle" };
  const o5 = in5[0].o, h5 = Math.max(...in5.map((b) => b.h), spot), l5 = Math.min(...in5.map((b) => b.l), spot), o2 = in2[0].o;
  const px = (n: string) => L.find((l) => l.name === n)?.price || 0, pk = px("5m PP"), r1 = px("Red zone"), s1 = px("Green zone");
  let call: { side: "up" | "down"; label: string } | null = null;
  for (const l of L) {
    if (!/σ$|^session VWAP$|^(Red|Green) zone$|^BB (upper|lower)$/.test(l.name)) continue; const P = l.price;
    if (!call && o5 >= P && l5 <= P + nr && l5 > P - brk && spot > P && ((spot >= l5 + push && spot > o2) || spot - l5 >= 0.2 * W)) call = { side: "up", label: `Rejected up off ${l.name}` };
    if (!call && o5 <= P && h5 >= P - nr && h5 < P + brk && spot < P && ((spot <= h5 - push && spot < o2) || h5 - spot >= 0.2 * W)) call = { side: "down", label: `Rejected down off ${l.name}` };
  }
  if (!call) return { why: "no rejection" };
  if (call.side === "up" && f >= 0.67) return { why: "THIRDS: long in the top 33%" };
  if (call.side === "down" && f <= 0.33) return { why: "THIRDS: short in the bottom 33%" };
  if (pk && r1 && s1) {
    if (call.side === "up" && spot >= r1) return { why: "PAST THE RED ZONE" }; if (call.side === "down" && spot <= s1) return { why: "PAST THE GREEN ZONE" };
    if (false /* fix1054 (Love Nov 9 2026 9:40 PM PT: "the pink to red being over 46% of the way over there, it is no longer a valid reason for a skip. The question is always why she didn't enter past the push distance of pink"): PINK TO RED / PINK TO GREEN no longer refuses - kept, not deleted */ && call.side === "up" && spot > pk && (spot - pk) / (r1 - pk) >= 0.45) return { why: "PINK TO RED 45%" };
    if (false /* fix1054 (Love Nov 9 2026 9:40 PM PT: "the pink to red being over 46% of the way over there, it is no longer a valid reason for a skip. The question is always why she didn't enter past the push distance of pink"): PINK TO RED / PINK TO GREEN no longer refuses - kept, not deleted */ && call.side === "down" && spot < pk && (pk - spot) / (pk - s1) >= 0.45) return { why: "PINK TO GREEN 45%" };
    const w = W / k, cush = (w < 100 ? W / 2 : w < 180 ? W / 3 : w <= 500 ? 0.2 * W : w > 1000 ? 0.1 * W : 0.15 * W); // her BTC pink cushion, by price
    if (call.side === "up" && pk > spot - brk && pk - spot <= cush && pk > spot) return { why: "PINK CUSHION" };
    if (call.side === "down" && pk < spot + brk && spot - pk <= cush && pk < spot) return { why: "PINK CUSHION" };
  }
  { const s1084 = pinkSlideWall1084(bs as any, spot, Date.now() / 1000, call.side, call.label); if (s1084) return { why: s1084 }; } // fix1084 HER PINK SLIDE RULE ON EVERY ASSET (Love Nov 10 2026 5:33 PM PT: "yes. pink slide rule goes to all assets.")
  return call;
}
async function market(): Promise<KalshiMarket | null> {
  const M = (G.__doge832Mk ||= { at: 0, m: null as KalshiMarket | null });
  if (Date.now() - M.at < 5000 && M.m && Date.parse(M.m.closeTime) > Date.now()) return M.m;
  const d = await j(`${BASE}/markets?series_ticker=KXDOGE15M&status=open&limit=20`); const ms = ((d?.markets ?? []) as any[]).map(mapMarket).filter((m) => Date.parse(m.closeTime) > Date.now()).sort((a, b) => Date.parse(a.closeTime) - Date.parse(b.closeTime));
  M.at = Date.now(); M.m = ms[0] || null; return M.m;
}
export async function dogeTick832() {
  if (G.__doge832Busy || (G.__doge832At && Date.now() - G.__doge832At < 5000)) return; G.__doge832Busy = true; G.__doge832At = Date.now();
  try {
    const s = st(); const bs = await bars(); if (!bs.length) return;
    const spot = bs[bs.length - 1].c, L = dogeBands832(bs), mk = await market();
    if (mk && Date.parse(mk.closeTime) - Date.now() > 120000 && !s.rows.some((r) => r.ticker === mk.ticker)) {
      const r = dogeRead832(bs, L, spot);
      if ("side" in r) { const ask = r.side === "up" ? Number(mk.yesAsk) : Number(mk.noAsk);
        if (ask > 0.01 && ask <= 0.667) s.rows.push({ id: `${mk.ticker}:doge-rjnp`, asset: "doge", ticker: mk.ticker, closeTime: mk.closeTime, at: new Date().toISOString(), side: r.side, label: r.label, spot, ask, contracts: Math.floor((20 / ask) * 100) / 100, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
        else try { const GL = (G.__doge832Log ||= {}); if (GL[mk.ticker] !== r.side) { GL[mk.ticker] = r.side; appendFileSync(D("doge-book-832-skips.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: mk.ticker, side: r.side, label: r.label, ask, why: "under her 1.5x floor / no ask" }) + "\n"); } } catch {} }
    }
    for (const r of s.rows.filter((x) => x.result === "open")) {
      let m: KalshiMarket | null = null; try { m = await fetchMarket(r.ticker); } catch { m = null; } if (!m) continue;
      const bid = r.side === "up" ? Number(m.yesBid) : Number(m.noBid), closed = Date.now() > Date.parse(r.closeTime);
      if (!closed && bid > 0 && r.soldBid == null) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) r.soldBid = bid; }
      const res = m.result === "yes" ? "up" : m.result === "no" ? "down" : "";
      if (closed && res) { const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0; r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid || 0) : 0) + (c - h) * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; }
    }
    save();
  } catch {} finally { G.__doge832Busy = false; }
}
export function dogeSummary832() { const rows = st().rows, done = rows.filter((r) => r.result !== "open"); return { at: new Date().toISOString(), n: rows.length, open: rows.length - done.length, w: done.filter((r) => r.result === "win").length, l: done.filter((r) => r.result === "loss").length, hold: Math.round(done.reduce((s, r) => s + (r.pnlHold || 0), 0) * 100) / 100, tp: Math.round(done.reduce((s, r) => s + (r.pnlTp || 0), 0) * 100) / 100, recent: rows.slice(-12).reverse().map((r) => ({ at: r.at, side: r.side, label: r.label, ask: r.ask, result: r.result, pnlTp: r.pnlTp })) }; }
