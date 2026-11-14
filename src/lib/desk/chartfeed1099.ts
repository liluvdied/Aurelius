// fix1099 ETH AND BNB ON VANTAGE (Love Nov 13 2026 10:06 PM PT: "is eth on vantage? bnb as well?" + 10:08 PM PT: "omg , yes pls eth and bnb should be on vantage that was a fix we did last week i wasn't aware
// they weren't on, please do"). ONE place hands out her ETH and BNB 1m candles, from the TradingView charts VANTAGE:ETHUSD and VANTAGE:BNBUSD, through her own chart reader (chartRaw in tv.ts): refreshed
// every 5 s at most per chart, 2 days kept, the forming minute included. Each lane's own candle memory keeps filling (other parts of her read it there). If a chart gives her no usable candles (fewer than 600, or the newest older than 150 s) that lane reads Coinbase exactly as it
// did before, and every change of chart is written to data/chart-feed-1099.jsonl. Not changed: any read, push, wall, size, switch or order.
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";

export const CHARTS_1099: Record<string, { chart: string; was: string }> = { eth: { chart: "VANTAGE:ETHUSD", was: "COINBASE:ETHUSD" }, bnb: { chart: "VANTAGE:BNBUSD", was: "COINBASE:BNBUSD" } };
export const MIN_BARS_1099 = 600, BAR_MAX_AGE_S_1099 = 150;
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
const G = globalThis as any;
function feedNote(row: Record<string, unknown>) { try { appendFileSync(join(process.cwd(), "data", "chart-feed-1099.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...row }) + "\n"); } catch {} }
/** pure: is this bar a whole, sane 1m candle */
export function barOk1099(b: any): b is Bar {
  return !!b && Number.isInteger(b.t) && b.t % 60 === 0 && [b.o, b.h, b.l, b.c, b.v].every(Number.isFinite) && b.l > 0 && b.v >= 0 && b.l <= Math.min(b.o, b.c) && b.h >= Math.max(b.o, b.c);
}
/** pure: are these candles usable as her chart right now */
export function barsUsable1099(bars: Bar[], nowMs: number): boolean {
  const last = bars[bars.length - 1];
  return bars.length >= MIN_BARS_1099 && !!last && nowMs / 1000 - last.t <= BAR_MAX_AGE_S_1099;
}
/** Her candles for "eth" / "bnb" off her Vantage chart, or null when that chart is not usable right now (the lane then reads Coinbase as before). */
export async function chartBars1099(coin: string, read: (symbol: string, resolution: string, count: number) => Promise<any[]> = chartRaw as any): Promise<Bar[] | null> {
  const C = CHARTS_1099[coin]; if (!C) return null;
  const B = ((G.__chartBars1099 ||= {})[coin] ||= { at: 0, m: new Map<number, Bar>(), ok: false, fly: null as Promise<Bar[] | null> | null, src: "" });
  const sorted = () => [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t) as Bar[];
  if (Date.now() - B.at < (B.ok ? 5000 : B.wait || 5000)) return B.ok ? sorted() : null; // a chart that answered nothing is asked again after 60 s, a stale one after 15 s (an unanswered read holds one of her 4 chart connections for 8 s)
  if (B.fly) return B.fly;
  B.fly = (async () => {
    try {
      let newest = 0; for (const t of B.m.keys()) if (t > newest) newest = t;
      const whole = B.m.size < MIN_BARS_1099 || Date.now() / 1000 - newest > 240; // first read, or a gap: read the whole chart again so no minute is missing
      const got = await read(C.chart, "1", whole ? 1500 : 5).catch(() => [] as any[]);
      B.wait = Array.isArray(got) && got.length ? 15000 : 60000;
      for (const b of Array.isArray(got) ? got : []) if (barOk1099(b)) B.m.set(b.t, { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v });
      const now = Date.now();
      for (const t of [...B.m.keys()]) if (t < now / 1000 - 2 * 86400) B.m.delete(t);
      const s = sorted();
      B.ok = barsUsable1099(s, now); B.at = now;
      const src = B.ok ? C.chart : C.was;
      if (src !== B.src) { feedNote({ coin, chart: src, was: B.src || null, bars: s.length, newestAgeS: s.length ? Math.round(now / 1000 - s[s.length - 1].t) : null, by: "fix1099" }); B.src = src; }
      return B.ok ? s : null;
    } catch { B.ok = false; B.wait = 60000; B.at = Date.now(); return null; }
    finally { B.fly = null; }
  })();
  return B.fly;
}
/** One lane's candles: off her Vantage chart, written into that lane's own memory (B.m / B.at - other parts of her read it there: her ETH.2 live route, her push test) exactly where its Coinbase candles sat.
 * Null when the chart is not usable: the lane's memory is then emptied ONCE, so its Coinbase read starts whole and the two charts' candles are never mixed. */
export async function laneBars1099(coin: string, B: any, read?: (symbol: string, resolution: string, count: number) => Promise<any[]>): Promise<Bar[] | null> {
  const b = await (read ? chartBars1099(coin, read) : chartBars1099(coin));
  if (b) {
    const at = Number(G.__chartBars1099?.[coin]?.at) || Date.now();
    if (B.chart1099 !== at) { B.m = new Map(b.map((x) => [x.t, { ...x }])); B.chart1099 = at; }
    B.at = Date.now();
    return b;
  }
  if (B.chart1099) { B.m = new Map(); B.at = 0; B.chart1099 = 0; }
  return null;
}
