// BAND CHECK (Claude, diagnostic only). Pulls OANDA BTC and gold from TradingView and computes
// the session VWAP + 1σ exactly like Love's "og vwap" Pine script (hlc3, volume-weighted,
// stdev = sqrt(Σv·src²/Σv − vwap²)) under different session anchors and bar sizes, at given
// moments, so we can see which one matches her chart to the cent. Writes data/band-compare.json.
// Never trades, never changes a band the desk uses.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
const g = globalThis as unknown as { __bandCheck?: string };
const RUN = "v1";

function vwapAt(bars: Bar[], start: number, until: number) {
  let pv = 0, v = 0, pv2 = 0, n = 0;
  for (const b of bars) {
    if (b.t < start || b.t > until) continue;
    const src = (b.h + b.l + b.c) / 3;
    const w = b.v > 0 ? b.v : 0;
    pv += src * w; pv2 += src * src * w; v += w; n += 1;
  }
  if (!(v > 0)) return null;
  const vw = pv / v;
  const sd = Math.sqrt(Math.max(0, pv2 / v - vw * vw));
  return { vwap: Math.round(vw * 1000) / 1000, sd: Math.round(sd * 1000) / 1000, up1: Math.round((vw + sd) * 1000) / 1000, bars: n };
}

// Session starts (unix seconds) for the session containing `at`, by UTC hour of the daily reset.
function startFor(at: number, resetHourUtc: number) {
  const d = new Date(at * 1000);
  let s = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), resetHourUtc) / 1000;
  if (s > at) s -= 86400;
  return s;
}

export async function bandCheckOnce() {
  if (g.__bandCheck === RUN) return;
  g.__bandCheck = RUN;
  // Love's screenshot moments (UTC seconds): 9:42 PM PT and 9:59:35 PM PT.
  const moments = [Date.parse("2026-10-02T04:42:00Z") / 1000, Date.parse("2026-10-02T04:59:35Z") / 1000];
  const out: Record<string, unknown> = { at: new Date().toISOString() };
  const jobs = [
    { key: "btc 5m", symbol: "OANDA:BTCUSD", res: "5", count: 600 },
    { key: "btc 1m", symbol: "OANDA:BTCUSD", res: "1", count: 1500 },
    { key: "gold 5m", symbol: "OANDA:XAUUSD", res: "5", count: 400 },
    { key: "gold 15m", symbol: "OANDA:XAUUSD", res: "15", count: 200 },
  ];
  for (const job of jobs) {
    try {
      const bars = (await chartRaw(job.symbol, job.res, job.count)) as Bar[];
      const rows: Record<string, unknown> = { bars: bars.length, first: bars[0] ? new Date(bars[0].t * 1000).toISOString() : null };
      for (const m of moments) {
        // A bar is included once it has opened (TradingView's live bar counts too).
        for (const [name, hour] of [["00:00 UTC", 0], ["17:00 ET (21 UTC)", 21], ["18:00 ET (22 UTC)", 22]] as const) {
          rows[`${new Date(m * 1000).toISOString().slice(11, 19)} · ${name}`] = vwapAt(bars, startFor(m, hour), m);
        }
      }
      out[job.key] = rows;
    } catch (err) {
      out[job.key] = { error: String((err as Error)?.message || err) };
    }
  }
  try {
    writeFileSync(join(process.cwd(), "data", "band-compare.json"), JSON.stringify(out, null, 1));
  } catch {
    // diagnostic only
  }
}

// ── VWAP BANDS (Love's 2nd indicator: "VWAP Bands 7 4 20 0.2 1.2 20 65"), calibration only ──
// Inputs from her settings: VWAP Period 7, Bollinger Band Multiplier 4, ATR Period 20,
// ATR Multiplier 0.2, Resolution Chart, Volume confirmation 1.2 × SMA(volume, 20).
// The source is locked, so this computes every reasonable reading of those inputs on the same
// OANDA 5-minute bars her chart uses; whichever lands on her lines is the one we keep.
const gv = globalThis as unknown as { __vbandsAt?: number; __vbandsBusy?: boolean };
function stdev(xs: number[], sample: boolean) {
  const m = xs.reduce((t, x) => t + x, 0) / xs.length;
  const v = xs.reduce((t, x) => t + (x - m) ** 2, 0) / (xs.length - (sample ? 1 : 0));
  return Math.sqrt(v);
}
function atr(bars: Bar[], len: number, rma: boolean) {
  const tr = bars.map((b, i) => (i === 0 ? b.h - b.l : Math.max(b.h - b.l, Math.abs(b.h - bars[i - 1].c), Math.abs(b.l - bars[i - 1].c))));
  if (!rma) return tr.slice(-len).reduce((t, x) => t + x, 0) / len;
  let a = tr.slice(0, len).reduce((t, x) => t + x, 0) / len;
  for (let i = len; i < tr.length; i += 1) a = (a * (len - 1) + tr[i]) / len;
  return a;
}
const r3 = (n: number) => Math.round(n * 1000) / 1000;
function candidates(bars: Bar[]) {
  const L = 7;
  const last = bars.slice(-L);
  const out: Record<string, unknown> = { spot: bars[bars.length - 1]?.c, barOpen: new Date((bars[bars.length - 1]?.t ?? 0) * 1000).toISOString() };
  for (const [name, f] of [["hlc3", (b: Bar) => (b.h + b.l + b.c) / 3], ["close", (b: Bar) => b.c]] as const) {
    const xs = last.map(f);
    const vw = last.reduce((t, b) => t + f(b) * (b.v || 0), 0) / Math.max(1e-9, last.reduce((t, b) => t + (b.v || 0), 0));
    const sma = xs.reduce((t, x) => t + x, 0) / L;
    out[name] = {
      vwma7: r3(vw),
      sma7: r3(sma),
      dev4_pop: r3(4 * stdev(xs, false)),
      dev4_sample: r3(4 * stdev(xs, true)),
    };
  }
  // raw ingredients (no multipliers) to solve for her band width
  const h3 = (b: Bar) => (b.h + b.l + b.c) / 3;
  const vwmaAt = (k: number) => {
    const w = bars.slice(k - L + 1, k + 1);
    return w.reduce((t, b) => t + h3(b) * (b.v || 0), 0) / Math.max(1e-9, w.reduce((t, b) => t + (b.v || 0), 0));
  };
  const n = bars.length - 1;
  const vwSeries = Array.from({ length: 20 }, (_, i) => vwmaAt(n - 19 + i));
  const vw7 = vwmaAt(n);
  const wv = last.reduce((t, b) => t + (b.v || 0), 0);
  out.guess = { center: r3(vw7), up: r3(vw7 + 4 * stdev(vwSeries.slice(-7), false)), dn: r3(vw7 - 4 * stdev(vwSeries.slice(-7), false)), upS: r3(vw7 + 4 * stdev(vwSeries.slice(-7), true)), dnS: r3(vw7 - 4 * stdev(vwSeries.slice(-7), true)) };
  out.raw = {
    sd7_h3_pop: r3(stdev(last.map(h3), false)),
    sd7_c_pop: r3(stdev(last.map((b) => b.c), false)),
    sd20_h3_pop: r3(stdev(bars.slice(-20).map(h3), false)),
    sd20_c_pop: r3(stdev(bars.slice(-20).map((b) => b.c), false)),
    vwsd7: r3(Math.sqrt(last.reduce((t, b) => t + (b.v || 0) * (h3(b) - vw7) ** 2, 0) / Math.max(1e-9, wv))),
    sd_of_vwma7_7: r3(stdev(vwSeries.slice(-7), false)),
    sd_of_vwma7_20: r3(stdev(vwSeries, false)),
    atr20_rma: r3(atr(bars, 20, true)),
    atr20_sma: r3(atr(bars, 20, false)),
    atr7_rma: r3(atr(bars, 7, true)),
    atr7_sma: r3(atr(bars, 7, false)),
  };
  out.atr20_rma_x02 = r3(0.2 * atr(bars, 20, true));
  out.atr20_sma_x02 = r3(0.2 * atr(bars, 20, false));
  const vols = bars.slice(-21, -1).map((b) => b.v || 0);
  out.volume = { last: bars[bars.length - 1]?.v, sma20x1_2: r3(1.2 * (vols.reduce((t, x) => t + x, 0) / Math.max(1, vols.length))) };
  return out;
}
export async function vbandsTick() {
  if (gv.__vbandsBusy || (gv.__vbandsAt && Date.now() - gv.__vbandsAt < 60000)) return;
  gv.__vbandsBusy = true;
  gv.__vbandsAt = Date.now();
  try {
    const out: Record<string, unknown> = { at: new Date().toISOString() };
    for (const [id, symbol] of [["btc", "OANDA:BTCUSD"], ["gold", "OANDA:XAUUSD"]] as const) {
      try {
        out[id] = candidates((await chartRaw(symbol, "5", 120)) as Bar[]);
      } catch (err) {
        out[id] = { error: String((err as Error)?.message || err) };
      }
    }
    writeFileSync(join(process.cwd(), "data", "vbands-now.json"), JSON.stringify(out, null, 1));
  } catch {
    // diagnostic only
  } finally {
    gv.__vbandsBusy = false;
  }
}
