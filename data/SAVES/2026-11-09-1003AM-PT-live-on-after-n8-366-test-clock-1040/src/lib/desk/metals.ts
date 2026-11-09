// METALS LAB (Claude, Oct 12 ~1 PM PT, Love: "platinum and palladium bounce at the bands up and down and then reverse... i want
// to start books on those too to potentially replace gold... if you see any other commodities that may perform better let's
// test those out on paper this week too"). PAPER ONLY, never sends an order, never feeds the live copier (these lanes are not
// in LANE_BOOK). Her lineup's exact entry rules (pivotbooks decide(): SESSION+PIVOT 5M, OG+PIVOT 15M, OG+PIVOT 5M) run on
// platinum, palladium and silver, plus gold through this same path as the fair control, and a BOUNCE lane for her Grok-era
// read (price stretched to +/-1.5 sigma or more whose last 1m candle closes back toward VWAP -> trade back toward VWAP).
// Real-time 1m bars from TradingView TVC (the same feed gold's pivots use), the live Kalshi 15M market for the price and
// strike, $20, 1.38x+ (ask 20-72c), one ticket per lane per window, held to the bell and settled on Kalshi's result.
// Stored in grok-og.json with asset tags mgold / msilver / platinum / palladium.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";
import { chartRaw } from "./tv";
import { computeVwap } from "./vwap";
import { archiveTrimmed, decide, lines, pivot, resample, sessionLines } from "./pivotbooks";

const D = (f: string) => join(process.cwd(), "data", f);
const FILE = () => D("grok-og.json");
const r2 = (n: number) => Math.round(n * 100) / 100;
const fee = (n: number, p: number) => Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;
const num = (v: unknown) => { const n = Number.parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : NaN; };
const METALS: { tag: string; series: string; sym: string }[] = [
  { tag: "platinum", series: "KXPLATINUM15M", sym: "TVC:PLATINUM" },
  { tag: "palladium", series: "KXPALLADIUM15M", sym: "TVC:PALLADIUM" },
  { tag: "msilver", series: "KXSILVER15M", sym: "TVC:SILVER" },
  { tag: "mgold", series: "KXGOLD15M", sym: "TVC:GOLD" },
];
const g = globalThis as unknown as { __mtAt?: number; __mtBusy?: boolean; __mtBars?: Record<string, { at: number; b: any[] }>; __mtMk?: Record<string, { at: number; m: any }> };

async function market(series: string) {
  const c = (g.__mtMk ||= {});
  if (c[series] && Date.now() - c[series].at < 20000 && c[series].m && Date.parse(c[series].m.close_time) > Date.now()) return c[series].m;
  const j = await kget(`/trade-api/v2/markets?series_ticker=${series}&status=open&limit=20`);
  const now = Date.now();
  const m = (j?.markets ?? []).filter((x: any) => Date.parse(x.close_time) > now && Date.parse(x.open_time) <= now).sort((a: any, b: any) => Date.parse(a.close_time) - Date.parse(b.close_time))[0] ?? null;
  c[series] = { at: now, m };
  return m;
}
async function bars(sym: string) {
  const c = (g.__mtBars ||= {});
  if (c[sym] && Date.now() - c[sym].at < 30000) return c[sym].b;
  const b: any[] = ((await chartRaw(sym, "1", 300)) as any[]).sort((x, y) => x.t - y.t);
  if (b.length) c[sym] = { at: Date.now(), b };
  return c[sym]?.b ?? [];
}

export async function metalsTick() {
  if (g.__mtBusy || (g.__mtAt && Date.now() - g.__mtAt < 20000)) return;
  g.__mtAt = Date.now();
  g.__mtBusy = true;
  const status: Record<string, unknown> = { at: new Date().toISOString() };
  try {
    let rows: any[] = [];
    try { rows = existsSync(FILE()) ? JSON.parse(readFileSync(FILE(), "utf8")) : []; } catch { return; }
    let changed = false;
    for (const M of METALS) {
      try {
        const m = await market(M.series);
        if (!m?.ticker) { status[M.tag] = "no open market"; continue; }
        const left = (Date.parse(m.close_time) - Date.now()) / 1000;
        let target = num(m.floor_strike);
        const yesAsk = num(m.yes_ask_dollars), noAsk = num(m.no_ask_dollars);
        if (!(left >= 120) || !(target > 0)) { status[M.tag] = { left: Math.round(left) }; continue; }
        const b = await bars(M.sym);
        if (b.length < 70) { status[M.tag] = "no bars"; continue; }
        const now = Date.now() / 1000;
        const closed = b.filter((x) => x.t + 60 <= now + 1);
        const last1m = closed[closed.length - 1];
        const spot = Number(b[b.length - 1].c);
        // Kalshi's strike is its own index; TVC can sit a little off it (palladium ~0.6 on Oct 12), which flips "above/below
        // the strike" on quiet windows. So the strike is taken on the TVC chart itself: its price when the window opened.
        const openT = Date.parse(m.open_time) / 1000;
        const ob = b.find((x) => x.t >= openT - 1) ?? null;
        const kStrike = target;
        target = ob ? Number(ob.o) : target;
        const f = computeVwap(closed.slice(-60).map((x) => ({ ...x, v: Number(x.v) || 0 })) as any);
        const a = { spot, target, vwap1m: f ? { vwap: f.vwap, stdev: f.stdev } : null };
        const sess = sessionLines(a);
        const st: any = { ticker: m.ticker, spot, target, kStrike, yesAsk, noAsk, left: Math.round(left), vwap: f?.vwap, sd: f?.stdev };
        const book = (lane: string, side: "up" | "down", label: string) => {
          if (rows.some((r) => r.ticker === m.ticker && r.lane === lane)) return;
          const ask = side === "up" ? yesAsk : noAsk;
          if (!(ask >= 0.2 && ask < 0.98) || !(1 / ask >= 1.38)) return;
          const n = 20 / ask;
          rows.unshift({ id: `${m.ticker}:${lane}`, lane, at: new Date().toISOString(), asset: M.tag, ticker: m.ticker, side, label, ask: r2(ask), multiple: r2(1 / ask), secondsLeft: Math.round(left), intoWindow: Math.round(900 - left), stake: 20, fee: fee(n, ask), peak: ask, lastBid: 0, result: "open", exit: null, pnl: null });
          changed = true;
        };
        for (const tf of [5, 15]) {
          const p = pivot(resample(closed, tf), tf);
          if (!p) continue;
          const sets: [string, any[]][] = tf === 5 ? [[`${M.tag}-sp5`, [...lines(p, 5), ...sess]], [`${M.tag}-ogp5`, [...sess, ...lines(p, 5)]]] : [[`${M.tag}-ogp15`, [...sess, ...lines(p, 15)]]];
          for (const [lane, L] of sets) {
            const look = decide(L as any, a, last1m);
            if (look) book(lane, look.side, look.label);
          }
        }
        // BOUNCE: stretched to +/-1.5 sigma or more, last 1m candle closed back toward VWAP -> trade back toward VWAP.
        if (f && f.stdev > 0 && last1m) {
          const z = (spot - f.vwap) / f.stdev;
          st.z = r2(z);
          if (z >= 1.5 && last1m.c < last1m.o) book(`${M.tag}-bounce`, "down", `Bounce down off +${(Math.floor(z * 2) / 2).toFixed(1)}σ`);
          if (z <= -1.5 && last1m.c > last1m.o) book(`${M.tag}-bounce`, "up", `Bounce up off -${(Math.floor(-z * 2) / 2).toFixed(1)}σ`);
        }
        status[M.tag] = st;
      } catch (e) {
        status[M.tag] = String(e).slice(0, 120);
      }
    }
    if (changed) {
      // re-read right before writing so rows the other lanes added meanwhile are kept
      let cur: any[] = [];
      try { cur = JSON.parse(readFileSync(FILE(), "utf8")); } catch { cur = []; }
      const have = new Set(cur.map((r) => r.id));
      const mine = rows.filter((r) => /^(platinum|palladium|msilver|mgold)$/.test(String(r.asset)) && !have.has(r.id));
      if (mine.length) { const all = [...mine, ...cur]; archiveTrimmed(all); writeFileSync(FILE() + ".mt", JSON.stringify(all.slice(0, 8000))); renameSync(FILE() + ".mt", FILE()); }
    }
  } finally {
    try { writeFileSync(D("metals-status.json"), JSON.stringify(status, null, 1)); } catch {}
    g.__mtBusy = false;
  }
}
