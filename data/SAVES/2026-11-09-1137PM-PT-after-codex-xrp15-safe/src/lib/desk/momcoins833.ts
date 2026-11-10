import { momentumColour } from "./momentum";
// fix833 MOMENTUM ON THE COINS - PAPER (Love Nov 6 2026 ~3:18 PM PT, her card "Yes, all four on paper" to the momentum-on-other-cryptos study: DOGE / BNB / SOL momentum books + a BTC
// FIRST-2-MINUTES book). PAPER ONLY: this file never places, sizes, cancels or reads a live order and never touches a live book, wall, umpire or switch.
// The MOMENTUM BOOK's rules (fix704) on each coin's own Kalshi 15-minute market, priced at the real Kalshi ask, $20 paper, once per setup per window, 2+ minutes left:
//   FIRST 2 MINUTES - at minute 2, go with the window (price vs the window's first price);  PINK UP - a 1m candle closes green back over the pink (her 5m CM pivot: EMA of the 5m typical price,
//   forming candle included);  UNDER -2σ - a 1m candle closes red under -2σ of the session (5 PM ET reset, 5m typical prices, the desk's equal-weight VWAP).
// BTC gets FIRST 2 MINUTES only (its other two setups already run in MOMENTUM). Feed: Coinbase <COIN>-USD 1m candles (public). Scored held to the bell and under her take-profit
// (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid), with Kalshi's fee (7% x price x (1 - price) per contract, rounded up per order) taken off.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket, mapMarket } from "./kalshi";
import type { KalshiMarket } from "./types";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "mom-coins-833.json";
const BASE = "https://external-api.kalshi.com/trade-api/v2";
export const COINS833: { id: string; pair: string; series: string; setups: string[] }[] = [
  { id: "doge", pair: "DOGE-USD", series: "KXDOGE15M", setups: ["first2", "pinkup", "under2"] },
  { id: "bnb", pair: "BNB-USD", series: "KXBNB15M", setups: ["first2", "pinkup", "under2"] },
  { id: "sol", pair: "SOL-USD", series: "KXSOL15M", setups: ["first2", "pinkup", "under2"] },
  { id: "btc", pair: "BTC-USD", series: "KXBTC15M", setups: ["first2"] },
];
const NAME: Record<string, string> = { first2: "WITH THE FIRST 2 MINUTES", pinkup: "WITH A FRESH BREAK UP THROUGH PINK", under2: "SHORT UNDER -2σ WHILE FALLING" };
export const STAKE833 = 20;
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Row = { id: string; book: string; setup: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; why: string; ask: number; floorOk: boolean; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null; fee: number };
export function fee833(contracts: number, price: number): number { return Math.ceil(0.07 * contracts * price * (1 - price) * 100) / 100; }
/** her lines from 1m bars (oldest first, forming minute last): pink (5m EMA of typical, forming included) and the session VWAP / σ (5m typical since 5 PM ET, equal weight) */
export function lines833(bars: Bar[], nowSec: number): { pink: number; vwap: number; sd: number } {
  const b5: Bar[] = [];
  for (const b of bars) { const k = Math.floor(b.t / 300) * 300; const x = b5[b5.length - 1]; if (x && x.t === k) { x.h = Math.max(x.h, b.h); x.l = Math.min(x.l, b.l); x.c = b.c; } else b5.push({ t: k, o: b.o, h: b.h, l: b.l, c: b.c }); }
  let ema = 0; b5.slice(-60).forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * 0.25 + ema * 0.75; });
  const et = new Date(new Date(nowSec * 1000).toLocaleString("en-US", { timeZone: "America/New_York" })); const offs = nowSec * 1000 - et.getTime();
  const s0 = new Date(et); s0.setHours(17, 0, 0, 0); if (s0.getTime() > et.getTime()) s0.setDate(s0.getDate() - 1); const start = (s0.getTime() + offs) / 1000;
  const xs = b5.filter((x) => x.t >= start).map((x) => (x.h + x.l + x.c) / 3);
  if (xs.length < 3) return { pink: ema, vwap: 0, sd: 0 };
  const vw = xs.reduce((s, v) => s + v, 0) / xs.length, sd = Math.sqrt(xs.reduce((s, v) => s + (v - vw) ** 2, 0) / xs.length);
  return { pink: ema, vwap: vw, sd };
}
// fix965 MOMENTUM NEEDS HER COLOUR + NO LONG IN THE RED ZONE (Love Nov 7 2026 ~5:38 PM PT, her card pick "Price just back over it" + ~5:34 PM PT: "not the middle hun. just back over the bollinger" + ~5:22 PM PT: "okay no fix the color issue on momentum. 2M or 5M must be her color unless it is a wick rejection. even if a 1m closed above pink. and she was in the red zone over pink when she longed." + 5:32 PM: "dude momentum is very broken it's backwards in its logic / bnb broke the bollinger DOWN and she entered long"): every momentum entry needs her 2m OR 5m candle her colour (price past that candle's open her way) - a 1m close over / under pink
// alone is not enough - and no long at or past the red zone (pink + the 7-candle 5m average range, as her ETH / coin books draw it), no short at or past the green zone (main's "inside the red / green zone" wall, fix429).
export function gate965(bs: Bar[], spot: number, nowS: number, side: string, pink: number, asset = "bnb"): string {
  if (!momentumColour(bs, spot, nowS, 60, side, asset)) return "HER COLOUR (fix1038): neither the 2m nor the 5m moved far enough off its extreme";
  if (pink > 0) { const g5: { h: number; l: number }[] = []; for (const b of bs) { const k = Math.floor(b.t / 300) * 300, x: any = g5[g5.length - 1]; if (x && x.t === k) { x.h = Math.max(x.h, b.h); x.l = Math.min(x.l, b.l); } else g5.push({ t: k, h: b.h, l: b.l } as any); }
    const last7 = g5.slice(-7); const a = last7.length ? last7.reduce((s, x) => s + (x.h - x.l), 0) / last7.length : 0;
    if (a > 0 && side === "up" && spot >= pink + a) return `RED ZONE (fix965): ${spot} is at or past the red zone (${(pink + a).toPrecision(6)}) over pink - no long`;
    if (a > 0 && side === "down" && spot <= pink - a) return `GREEN ZONE (fix965): ${spot} is at or past the green zone (${(pink - a).toPrecision(6)}) under pink - no short`; }
  { const c5: { t: number; c: number }[] = []; for (const b of bs) { const k = Math.floor(b.t / 300) * 300, x = c5[c5.length - 1]; if (x && x.t === k) x.c = b.c; else c5.push({ t: k, c: b.c }); }
    const done = c5.filter((x) => x.t + 300 <= nowS); if (done.length >= 22) { const bb = (i: number) => { const cs = done.slice(i - 19, i + 1).map((x) => x.c), m = cs.reduce((s, v) => s + v, 0) / 20, sd = Math.sqrt(cs.reduce((s, v) => s + (v - m) ** 2, 0) / 20); return { m, u: m + 2 * sd, l: m - 2 * sd }; };
      const n = done.length - 1, now5 = bb(n); let brokeDn = false, brokeUp = false; for (let i = Math.max(19, n - 2); i <= n; i++) { const z = bb(i); if (done[i].c < z.l) brokeDn = true; if (done[i].c > z.u) brokeUp = true; }
      if (side === "up" && brokeDn && spot < now5.l) return `BOLLINGER BROKE DOWN (fix965): a 5m closed under the Bollinger lower in the last 15 min and price ${spot} is not back over it (${now5.l.toPrecision(6)}) - no long`;
      if (side === "down" && brokeUp && spot > now5.u) return `BOLLINGER BROKE UP (fix965): a 5m closed over the Bollinger upper in the last 15 min and price ${spot} is not back under it (${now5.u.toPrecision(6)}) - no short`; } }
  return "";
}
/** pure signals. closed = closed 1m bars (oldest first); open0 = the window's first price; spot = now; el = seconds into the window */
export function signals833(setups: string[], closed: Bar[], open0: number, spot: number, el: number, ln: { pink: number; vwap: number; sd: number }): { key: string; side: "up" | "down"; why: string }[] {
  const out: { key: string; side: "up" | "down"; why: string }[] = [], n = closed.length, b1 = closed[n - 1], b0 = closed[n - 2];
  if (setups.includes("first2") && open0 > 0 && el >= 120 && el < 180 && spot !== open0) out.push({ key: "first2", side: spot > open0 ? "up" : "down", why: `minute 2: ${spot} vs the window's open ${open0} - with it` });
  if (setups.includes("pinkup") && b1 && b0 && ln.pink > 0 && b0.c < ln.pink && b1.c >= ln.pink && b1.c > b1.o) out.push({ key: "pinkup", side: "up", why: `1m closed green over pink ${ln.pink.toPrecision(6)} - with the break` });
  if (setups.includes("under2") && b1 && ln.vwap > 0 && ln.sd > 0 && b1.c < ln.vwap - 2 * ln.sd && b1.c < b1.o) out.push({ key: "under2", side: "down", why: `1m closed red under -2σ ${(ln.vwap - 2 * ln.sd).toPrecision(6)} - with the fall` });
  return out;
}
function st(): { rows: Row[]; seen: Record<string, number> } { if (G.__mc833) return G.__mc833; let s = { rows: [] as Row[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__mc833 = s; return s; }
function save() { try { const s = st(); ((globalThis as any).__purge1053 || ((x: any) => x))(s.rows, "mom-coins-833"); /* fix1053 */ s.rows = s.rows.slice(-6000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
async function j(url: string): Promise<any> { const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "aurelius-paper/1.0" }, signal: AbortSignal.timeout(10000) }); return r.json(); }
async function bars(pair: string): Promise<Bar[]> {
  const B = ((G.__mc833Bars ||= {})[pair] ||= { at: 0, m: new Map<number, Bar>() });
  if (Date.now() - B.at < 8000 && B.m.size) return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
  const need = B.m.size < 600 ? 4 : 1;
  for (let k = need - 1; k >= 0; k--) {
    const end = Math.floor(Date.now() / 1000) - k * 300 * 60, start = end - 300 * 60;
    const d = await j(`https://api.exchange.coinbase.com/products/${pair}/candles?granularity=60&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`);
    if (Array.isArray(d)) for (const x of d) B.m.set(x[0], { t: x[0], l: x[1], h: x[2], o: x[3], c: x[4] });
  }
  for (const k of [...B.m.keys()]) if (k < Date.now() / 1000 - 30 * 3600) B.m.delete(k);
  B.at = Date.now(); return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
}
async function market(series: string): Promise<KalshiMarket | null> {
  const M = ((G.__mc833Mk ||= {})[series] ||= { at: 0, m: null as KalshiMarket | null });
  if (Date.now() - M.at < 4000 && M.m && Date.parse(M.m.closeTime) > Date.now()) return M.m;
  const d = await j(`${BASE}/markets?series_ticker=${series}&status=open&limit=20`); const ms = ((d?.markets ?? []) as any[]).map(mapMarket).filter((m) => Date.parse(m.closeTime) > Date.now()).sort((a, b) => Date.parse(a.closeTime) - Date.parse(b.closeTime));
  M.at = Date.now(); M.m = ms[0] || null; return M.m;
}
export function book833(id: string): string { return id === "btc" ? "btcfirst2-833" : `mom${id}833`; }
export async function momCoinsTick833() {
  if (G.__mc833Busy || (G.__mc833At && Date.now() - G.__mc833At < 4000)) return; G.__mc833Busy = true; G.__mc833At = Date.now();
  try {
    const s = st(), now = Date.now(), nowS = Math.floor(now / 1000), w0 = Math.floor(nowS / 900) * 900; let dirty = false;
    for (const c of COINS833) {
      let bs: Bar[] = []; try { bs = await bars(c.pair); } catch { continue; } if (bs.length < 60) continue;
      const mk = await market(c.series).catch(() => null); if (!mk) continue;
      const left = (Date.parse(mk.closeTime) - now) / 1000, el = nowS - w0;
      const closed = bs.filter((b) => b.t + 60 <= nowS), last = closed[closed.length - 1];
      const fresh = last && last.t === Math.floor(nowS / 60) * 60 - 60 && nowS % 60 < 20;
      const first = bs.find((b) => b.t === w0); const open0 = first ? first.o : 0, spot = bs[bs.length - 1].c;
      if (left >= 120) {
        const ln965 = lines833(bs, nowS); const sig = signals833(c.setups, fresh ? closed : [], open0, spot, el, ln965).filter((g) => { const w965 = gate965(bs, spot, nowS, g.side, ln965.pink, c.id); if (w965) { try { const K = (G.__mc965 ||= {}); const kk = `${mk.ticker}:${g.key}`; if (!K[kk]) { K[kk] = 1; appendFileSync(D("momentum-colour-965.jsonl"), JSON.stringify({ at: new Date().toISOString(), coin: c.id, ticker: mk.ticker, setup: g.key, side: g.side, spot, why: w965 }) + "\n"); } } catch {} } return !w965; }); // fix965 her colour + zones
        for (const g of sig) {
          const key = `${mk.ticker}:${g.key}`; if (s.seen[key]) continue;
          const ask = Number(g.side === "up" ? mk.yesAsk : mk.noAsk); if (!(ask > 0.01 && ask < 0.99)) continue;
          s.seen[key] = now; const contracts = Math.floor((STAKE833 / ask) * 100) / 100;
          s.rows.push({ id: `${key}:mc833`, book: book833(c.id), setup: `${c.id.toUpperCase()} · ${NAME[g.key]}`, asset: c.id, ticker: mk.ticker, closeTime: mk.closeTime, at: new Date(now).toISOString(), side: g.side, why: g.why, ask, floorOk: ask <= 0.667, contracts, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null, fee: fee833(contracts, ask) });
          dirty = true;
        }
      }
      for (const r of s.rows) {
        if (r.result !== "open" || r.asset !== c.id) continue;
        if (r.ticker === mk.ticker && r.soldBid == null) {
          const bid = Number(r.side === "up" ? mk.yesBid : mk.noBid);
          if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; r.fee += fee833(r.contracts / 2, bid); dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; r.fee += fee833(r.half ? r.contracts / 2 : r.contracts, bid); dirty = true; } }
        }
        if (now < Date.parse(r.closeTime) + 20000) continue;
        const mm = await fetchMarket(r.ticker).catch(() => null); const res = mm?.result === "yes" ? "up" : mm?.result === "no" ? "down" : ""; if (!res) continue;
        const won = res === r.side, pay = won ? 1 : 0, q = r.contracts, h = r.half ? q / 2 : 0, rest = q - h;
        r.result = won ? "win" : "loss";
        r.pnlHold = Math.round((q * pay - STAKE833 - fee833(q, r.ask)) * 100) / 100;
        r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - STAKE833 - r.fee) * 100) / 100; dirty = true;
      }
    }
    if (dirty) save();
  } catch {} finally { G.__mc833Busy = false; }
}
