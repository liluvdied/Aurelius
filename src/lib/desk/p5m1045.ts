// fix1045 5M PAPER BOOKS · NEW BRAIN (Love Nov 9 2026: "we're going to work on setting up the 5M's properly today ... we'll get the brain going on there" + "yess pls do" (paper first)
// + 11:23 AM PT: "for now can you just make cards for all of them and put them in a place i can see what they're taking"). PAPER ONLY - it can never send an order: its only Polymarket call
// is the public order-book read (bookTop). BTC / ETH / XRP Polymarket 5-minute up/down: her installed XRP-lane read (xrpRead961 = main's setups + walls + her cornerstones, every rule of tonight's
// bundle) scaled per coin with HER push ($5 BTC, 25c ETH, 0.00025 XRP); one entry per window with 60 s+ left; her 1.5x floor (ask 66c or under); $20 paper at the REAL ask;
// HER TP: half at 75% of the max, the rest at 90%, otherwise the 5m close (settled from the candles). Rows: data/p5m-1045-<coin>.json (cards via paperrows, LIVE WIRE).
// It also writes the window's real bid / ask every ~6 s to data/poly5-quotes-<coin>.jsonl (ETH / XRP had no recorded prices) so her TP can score them later. Off: data/p5m-1045-cfg.json {"on": false}.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { xrpRead961, win5Open1051 } from "./xrp5m961"; // fix1051
import { ethBands682 } from "./ethbook";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
export const COINS1045: Record<string, { prod: string; push: number }> = { btc: { prod: "BTC-USD", push: 5 }, eth: { prod: "ETH-USD", push: 0.25 }, xrp: { prod: "XRP-USD", push: 0.00025 } };
export const STAKE1045 = 20, FLOOR1045 = 0.66;
type PM = { bookTop: (slug: string) => Promise<{ bid: number; ask: number } | null> };
const cfgOn = () => { try { return JSON.parse(readFileSync(D("p5m-1045-cfg.json"), "utf8"))?.on !== false; } catch { return true; } };
const file = (c: string) => D(`p5m-1045-${c}.json`);
function book(c: string): { rows: any[] } { try { const j = JSON.parse(readFileSync(file(c), "utf8")); return Array.isArray(j?.rows) ? j : { rows: [] }; } catch { return { rows: [] }; } }
function save(c: string, b: { rows: any[] }) { const p = file(c), t = p + ".tmp"; b.rows = b.rows.slice(-3000); writeFileSync(t, JSON.stringify(b)); renameSync(t, p); }
async function j(url: string): Promise<any> { const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "aurelius-p5m/1.0" }, signal: AbortSignal.timeout(8000) }); return r.ok ? r.json() : null; }
export async function bars1045(c: string): Promise<Bar[]> {
  const B = ((G.__p5m1045Bars ||= {})[c] ||= { at: 0, m: new Map<number, Bar>() });
  if (Date.now() - B.at < 5000 && B.m.size) return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
  const need = B.m.size < 600 ? 3 : 1;
  for (let k = need - 1; k >= 0; k--) {
    const end = Math.floor(Date.now() / 1000) - k * 300 * 60, start = end - 300 * 60;
    const d = await j(`https://api.exchange.coinbase.com/products/${COINS1045[c].prod}/candles?granularity=60&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`).catch(() => null);
    if (Array.isArray(d)) for (const x of d) B.m.set(x[0], { t: x[0], l: x[1], h: x[2], o: x[3], c: x[4], v: x[5] });
  }
  for (const k of [...B.m.keys()]) if (k < Date.now() / 1000 - 2 * 86400) B.m.delete(k);
  B.at = Date.now(); return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
}
async function slugFor(pm: PM, c: string, startSec: number): Promise<string | null> {
  const C = ((G.__p5m1045Slug ||= {})[c] ||= {}) as Record<number, string>; if (C[startSec]) return C[startSec];
  const ds = new Date(startSec * 1000), day = ds.toISOString().slice(0, 10), hm = String(ds.getUTCHours()).padStart(2, "0") + String(ds.getUTCMinutes()).padStart(2, "0");
  for (const s of [`${c}-updown-5m-${day}-${hm}z`, `cpc-${c}-updown-5m-${day}-${hm}z`, `${c}-updown-5m-${startSec}`]) { if (await pm.bookTop(s).catch(() => null)) return (C[startSec] = s); }
  return null;
}
/** pure: her TP on one bid (half at 75% of the max, the rest at 90%) - returns the row updated */
export function tp1045(r: any, bid: number): any {
  if (r.result !== "open" || !(bid > 0) || !(r.ask > 0)) return r;
  const a = r.ask, l75 = a + 0.75 * (1 - a), l90 = a + 0.9 * (1 - a), sh = STAKE1045 / a;
  if (!r.half && bid >= l75 - 1e-9) { r.half = true; r.cash = (r.cash || 0) + bid * sh / 2; r.halfBid = bid; }
  if (bid >= l90 - 1e-9) { const left = r.half ? sh / 2 : sh; r.cash = (r.cash || 0) + bid * left; r.result = "sold"; r.pnl = Math.round((r.cash - STAKE1045) * 100) / 100; r.exit = `${r.half ? `half at 75% (${Math.round(r.halfBid * 100)}c) + ` : ""}rest at 90% (${Math.round(bid * 100)}c)`; }
  return r;
}
/** pure: settle at the 5m close from the candles (what is left after any half sale) */
export function settle1045(r: any, won: boolean): any {
  if (r.result !== "open") return r;
  const sh = STAKE1045 / r.ask, left = r.half ? sh / 2 : sh; r.cash = (r.cash || 0) + (won ? left : 0);
  r.result = won ? "win" : "loss"; r.pnl = Math.round((r.cash - STAKE1045) * 100) / 100; r.exit = `${r.half ? `half at 75% (${Math.round(r.halfBid * 100)}c), ` : ""}rest at the 5m close (${won ? "won" : "lost"})`; return r;
}
async function coinTick(c: string, nowMs: number, pm: PM) {
  const now = nowMs / 1000, f = Math.floor(now / 300) * 300, left = f + 300 - now, b = book(c); let dirty = false;
  const bs = await bars1045(c); if (!bs.length) return;
  // open rows: her TP on the live bid, then the close from the candles
  for (const r of b.rows.filter((x) => x.result === "open")) {
    const ws = Number(r.ws);
    if (now >= ws + 300 + 60) { const inW = bs.filter((x) => x.t >= ws && x.t < ws + 300); if (inW.length >= 4) { settle1045(r, (r.side === "up") === (inW[inW.length - 1].c > inW[0].o)); dirty = true; } continue; }
    if (now < ws + 300) { const top = await pm.bookTop(r.ticker).catch(() => null); if (top) { const bid = r.side === "up" ? Number(top.bid) : Math.round((1 - Number(top.ask)) * 100) / 100; if (bid > 0) { r.lastBid = bid; r.lastAt = new Date(nowMs).toISOString(); tp1045(r, bid); dirty = true; } } }
  }
  // the window's real prices for later scoring (~6 s)
  const Q = (G.__p5m1045Q ||= {}) as Record<string, number>;
  const slug = await slugFor(pm, c, f);
  if (slug && nowMs - (Q[c] || 0) >= 6000) { Q[c] = nowMs; const top = await pm.bookTop(slug).catch(() => null); if (top) { try { appendFileSync(D(`poly5-quotes-${c}.jsonl`), JSON.stringify({ t: Math.floor(now), slug, bid: top.bid, ask: top.ask }) + "\n"); } catch {} } }
  // a new entry: one a window, 60 s+ left, her read, her floor
  const id = `${c}5m-${f}`;
  if (left >= 60 && slug && !b.rows.some((x) => x.id === id)) {
    const spot = bs[bs.length - 1].c, r = xrpRead961(bs, ethBands682(bs as any), spot, now, { band: COINS1045[c].push, pink: COINS1045[c].push, wick: COINS1045[c].push * 2 }, win5Open1051(bs, now)); // fix1051 her 5m books check the window side while choosing a setup
    if ("side" in r) {
      const top = await pm.bookTop(slug).catch(() => null);
      const ask = top ? (r.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100) : 0;
      if (ask > 0.02 && ask <= FLOOR1045) { b.rows.push({ id, ws: f, at: new Date(nowMs).toISOString(), asset: c, ticker: slug, side: r.side, setup: r.label, ask, stake: STAKE1045, result: "open", pnl: null, spot }); dirty = true; }
    }
  }
  if (dirty) save(c, b);
}
// fix1045 XRP 15M ON KALSHI · NEW BRAIN · PAPER (Love Nov 9 2026 ~11:30 AM PT: "i rlly want to see the 5m book for XRP to go onto a 15m on kalshi hun i am nearly positive it will be way smoother than gold"):
// her XRP lane's own brain (xrpRead961, her XRP push), on Kalshi's 15-minute XRP markets (KXXRP15M) - one entry per window, never in the last 2 minutes (her 15m books), her 1.5x floor,
// $20 paper at the REAL Kalshi ask (public market read only, never an order), her TP on the real bid, settled on Kalshi's OWN result. Rows: data/p5m-1045-xrp15k.json.
type KM = { fetchMarket: (t: string) => Promise<any>; fifteenTicker: (s: string, now?: number) => string };
async function k15Tick(nowMs: number, km: KM) {
  const now = nowMs / 1000, f = Math.floor(now / 900) * 900, left = f + 900 - now, c = "xrp15k", b = book(c); let dirty = false;
  for (const r of b.rows.filter((x) => x.result === "open")) {
    const m = await km.fetchMarket(r.ticker).catch(() => null); if (!m) continue;
    if (m.result === "yes" || m.result === "no") { settle1045(r, (r.side === "up") === (m.result === "yes")); r.exit += " (Kalshi result)"; dirty = true; continue; }
    const bid = Number(r.side === "up" ? m.yesBid : m.noBid); if (bid > 0 && now < Number(r.ws) + 900) { r.lastBid = bid; r.lastAt = new Date(nowMs).toISOString(); tp1045(r, bid); dirty = true; }
  }
  const ticker = km.fifteenTicker("KXXRP15M", nowMs), id = `xrp15k-${f}`;
  if (left >= 120 && !b.rows.some((x) => x.id === id)) {
    const bs = await bars1045("xrp"); if (bs.length) {
      const spot = bs[bs.length - 1].c, r = xrpRead961(bs, ethBands682(bs as any), spot, now) as any; // her XRP lane's own push (PUSH1004)
      if (r && r.side) { const m = await km.fetchMarket(ticker).catch(() => null); const ask = m ? Number(r.side === "up" ? m.yesAsk : m.noAsk) : 0;
        if (ask > 0.02 && ask <= FLOOR1045) { b.rows.push({ id, ws: f, at: new Date(nowMs).toISOString(), asset: "xrp", ticker, side: r.side, setup: r.label, ask, stake: STAKE1045, result: "open", pnl: null, spot }); dirty = true; } }
    }
  }
  if (dirty) save(c, b);
}
export async function p5mTick1045(nowMs = Date.now(), pmIn?: PM, kmIn?: KM) {
  if (!cfgOn() || G.__p5m1045Busy || nowMs - Number(G.__p5m1045At || 0) < 3000) return; G.__p5m1045At = nowMs; G.__p5m1045Busy = true;
  try { const pm: PM = pmIn || ((await import("./poly-live.server")) as any); for (const c of Object.keys(COINS1045)) { try { await coinTick(c, nowMs, { bookTop: pm.bookTop }); } catch {} }
    try { const km: KM = kmIn || ((await import("./kalshi")) as any); await k15Tick(nowMs, km); } catch {} }
  finally { G.__p5m1045Busy = false; }
}
