// STOP LAB (Claude, Oct 5 ~2:30 PM PT, Love: "see how many times cutting ended up reversing and going in our favor...
// backtest all of that... at different levels... what would have worked, what wouldn't have"). Read only, never trades.
// For every settled 15-minute window her paper books traded, pulls Kalshi's public 1-minute candles (yes bid / yes ask)
// so scripts/stop-lab.py can replay each trade minute by minute and test stop-losses at any level and time.
// Keeps going forward too, so the paper test of the winners has its own price paths. Output: data/stop-lab-candles.json.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://external-api.kalshi.com/trade-api/v2";
const FILE = () => join(process.cwd(), "data", "stop-lab-candles.json");
const g = globalThis as unknown as { __stopLabAt?: number; __stopLabBusy?: boolean; __stopLabMiss?: Record<string, number> };

type Candle = [number, number | null, number | null, number | null, number | null, number | null, number | null];
// [endTs, yesBidLow, yesBidHigh, yesBidClose, yesAskLow, yesAskHigh, yesAskClose] in dollars

function num(o: any, k: string): number | null {
  if (!o) return null;
  const d = Number.parseFloat(o[`${k}_dollars`] ?? "");
  if (Number.isFinite(d)) return d;
  const c = Number(o[k]);
  return Number.isFinite(c) ? c / 100 : null;
}

function closeOf(ticker: string): number | null {
  const m = ticker.match(/-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/);
  if (!m) return null;
  const mon = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"].indexOf(m[2]);
  if (mon < 0) return null;
  const off = mon >= 2 && mon <= 9 ? 4 : 5;
  return Date.UTC(2000 + Number(m[1]), mon, Number(m[3]), Number(m[4]) + off, Number(m[5]));
}

export async function stopLabTick() {
  if (g.__stopLabBusy || (g.__stopLabAt && Date.now() - g.__stopLabAt < 3000)) return;
  void replayHistOnce();
  g.__stopLabBusy = true;
  g.__stopLabAt = Date.now();
  try {
    let store: { at?: string; candles: Record<string, Candle[]> } = { candles: {} };
    try {
      store = JSON.parse(readFileSync(FILE(), "utf8"));
      if (!store.candles) store.candles = {};
    } catch {
      store = { candles: {} };
    }
    // Every 15-minute ticker her paper books traded (ledger + the live night book), closed at least 2 minutes ago.
    const tickers = new Set<string>();
    try {
      for (const line of readFileSync(join(process.cwd(), "data", "exit-ledger.jsonl"), "utf8").split("\n")) {
        const i = line.indexOf('"ticker"');
        if (i < 0) {
          const id = line.match(/"id":"([A-Z0-9]+15M-[^:"]+)/);
          if (id) tickers.add(id[1]);
          continue;
        }
      }
    } catch {
    }
    try {
      for (const r of JSON.parse(readFileSync(join(process.cwd(), "data", "night-book.json"), "utf8"))) if (r?.ticker) tickers.add(String(r.ticker));
    } catch {
    }
    // BACKFILL for the BRICK / CLAUDE replay (Love, Oct 5 ~8 PM PT): older windows listed in data/stop-lab-wanted.json.
    try {
      for (const t of JSON.parse(readFileSync(join(process.cwd(), "data", "stop-lab-wanted.json"), "utf8"))) tickers.add(String(t));
    } catch {
    }
    const miss = (g.__stopLabMiss ||= {});
    const todo = [...tickers]
      .filter((t) => /15M-/.test(t) && !store.candles[t] && (miss[t] ?? 0) < 3)
      .filter((t) => {
        const c = closeOf(t);
        return c != null && Date.now() - c > 120000 && Date.now() - c < 30 * 24 * 3600 * 1000;
      })
      .slice(0, 12);
    if (!todo.length) return;
    await Promise.all(todo.map(async (t) => {
      const close = closeOf(t)!;
      const series = t.split("-")[0];
      const start = Math.floor((close - 16 * 60000) / 1000);
      const end = Math.floor((close + 60000) / 1000);
      try {
        const res = await fetch(`${BASE}/series/${series}/markets/${t}/candlesticks?start_ts=${start}&end_ts=${end}&period_interval=1`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
        if (!res.ok) {
          miss[t] = (miss[t] ?? 0) + 1;
          return;
        }
        const body = (await res.json()) as { candlesticks?: any[] };
        store.candles[t] = (body.candlesticks ?? []).map((c) => [Number(c.end_period_ts), num(c.yes_bid, "low"), num(c.yes_bid, "high"), num(c.yes_bid, "close"), num(c.yes_ask, "low"), num(c.yes_ask, "high"), num(c.yes_ask, "close")] as Candle);
      } catch {
        miss[t] = (miss[t] ?? 0) + 1;
      }
    }));
    store.at = new Date().toISOString();
    writeFileSync(FILE(), JSON.stringify(store));
  } catch {
  } finally {
    g.__stopLabBusy = false;
  }
}

// REPLAY BARS (Claude, Oct 5 ~8 PM PT, read only): one fresh pull of the exact feeds her nav lines use (Pepperstone BTC,
// OANDA gold), 5-minute bars (~17 days) and 1-minute bars (~3.5 days), for scripts/replay-lab.py. data/hist2/*.json.
const gh = globalThis as unknown as { __replayHist?: boolean };
async function replayHistOnce() {
  if (gh.__replayHist) return;
  gh.__replayHist = true;
  try {
    const { mkdirSync, existsSync } = await import("node:fs");
    const dir = join(process.cwd(), "data", "hist2");
    if (existsSync(join(dir, "index.json"))) return;
    mkdirSync(dir, { recursive: true });
    const { chartRaw } = await import("./tv");
    const done: Record<string, unknown> = { at: new Date().toISOString() };
    for (const [name, sym, res, count] of [["btc-5", "PEPPERSTONE:BTCUSD", "5", 5000], ["btc-1", "PEPPERSTONE:BTCUSD", "1", 5000], ["gold-5", "OANDA:XAUUSD", "5", 5000], ["gold-1", "OANDA:XAUUSD", "1", 5000]] as const) {
      try {
        const bars = await chartRaw(sym, res, count);
        writeFileSync(join(dir, `${name}.json`), JSON.stringify(bars));
        done[name] = { bars: bars.length, first: bars[0]?.t ?? null, last: bars[bars.length - 1]?.t ?? null };
      } catch (e) {
        done[name] = { error: String(e) };
      }
    }
    writeFileSync(join(dir, "index.json"), JSON.stringify(done, null, 1));
  } catch {
  }
}
