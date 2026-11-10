// SILVER FEED LAB (Claude, Oct 9 ~11:35 AM PT, Love: "can we find the same we found for gold and btc with TVC and
// Pepperstone, for Silver? let's see which chart she respects best"). One-shot, read only, paper research. Pulls 5-minute
// and 1-minute bars from every candidate silver chart feed plus Kalshi's settled KXSILVER15M windows, saved to
// data/silver-feeds.json for the lab (~/lab/silverlab.py). Re-pulls at most every 6 hours. Never trades.
import { writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";
const BASE = "https://external-api.kalshi.com/trade-api/v2";
export const SILVER_FEEDS = ["TVC:SILVER", "PEPPERSTONE:XAGUSD", "OANDA:XAGUSD", "FX:XAGUSD", "FOREXCOM:XAGUSD", "VANTAGE:XAGUSD", "ICMARKETS:XAGUSD", "CAPITALCOM:SILVER", "SAXO:XAGUSD", "FXOPEN:XAGUSD", "FOREXCOM:XAGUSD"];
const g = globalThis as unknown as { __silverFeedBusy?: boolean; __silverFeedAt?: number };
const SIX_H = 6 * 3600 * 1000;
const FILE = () => join(process.cwd(), "data", "silver-feeds.json");
// Gold twin pull (same lab, Oct 9): TVC:GOLD + OANDA:XAUUSD + PEPPERSTONE:XAUUSD 5m bars for the gold snapback/lines test.
const g2 = globalThis as unknown as { __goldFeedDone2?: boolean };
async function goldOnce() {
  if (g2.__goldFeedDone2) return;
  g2.__goldFeedDone2 = true;
  const FILE2 = join(process.cwd(), "data", "gold-feeds5.json");
  const out: Record<string, unknown> = { at: new Date().toISOString(), bars5: {} };
  for (const sym of ["TVC:GOLD", "OANDA:XAUUSD", "PEPPERSTONE:XAUUSD", "VANTAGE:XAUUSD"]) {
    try {
      let bars = await chartRaw(sym, "5", 5000);
      for (const n of [4000, 3000, 2000, 1000]) if (!bars.length) bars = await chartRaw(sym, "5", n);
      (out.bars5 as Record<string, unknown>)[sym] = bars.map((b) => [b.t, b.o, b.h, b.l, b.c, b.v]);
    } catch (e) {
      (out.bars5 as Record<string, unknown>)[sym] = { error: String(e) };
    }
  }
  writeFileSync(FILE2, JSON.stringify(out));
}
// TVC:GOLD 1-minute bars for the gold nav-front sweet-spot replay (Oct 9 ~2 PM PT). One pull per desk start.
const g3 = globalThis as unknown as { __gold1Done?: boolean };
async function gold1Once() {
  if (g3.__gold1Done) return;
  g3.__gold1Done = true;
  const out: Record<string, unknown> = { at: new Date().toISOString(), bars1: {} };
  for (const sym of ["TVC:GOLD"]) {
    try {
      let bars = await chartRaw(sym, "1", 5000);
      for (const n of [4000, 3000]) if (!bars.length) bars = await chartRaw(sym, "1", n);
      (out.bars1 as Record<string, unknown>)[sym] = bars.map((b) => [b.t, b.o, b.h, b.l, b.c, b.v]);
    } catch (e) {
      (out.bars1 as Record<string, unknown>)[sym] = { error: String(e) };
    }
  }
  writeFileSync(join(process.cwd(), "data", "gold-feeds1.json"), JSON.stringify(out));
}
export async function silverFeedOnce() {
  void gold1Once().catch(() => {});
  void goldOnce().catch(() => {});
  if (g.__silverFeedBusy) return;
  if (g.__silverFeedAt && Date.now() - g.__silverFeedAt < SIX_H) return;
  let age = Infinity;
  try { age = Date.now() - statSync(FILE()).mtimeMs; } catch {}
  if (age < SIX_H) { g.__silverFeedAt = Date.now() - (SIX_H - age); return; }
  g.__silverFeedBusy = true;
  g.__silverFeedAt = Date.now();
  try { await pullAll(); } catch {} finally { g.__silverFeedBusy = false; }
}
async function pullAll() {
  const out: Record<string, unknown> = { at: new Date().toISOString(), markets: [], bars5: {}, bars1: {} };
  const ms: unknown[] = [];
  let cursor = "";
  for (let page = 0; page < 12; page += 1) {
    try {
      const res = await fetch(`${BASE}/markets?series_ticker=KXSILVER15M&status=settled&limit=200${cursor ? `&cursor=${cursor}` : ""}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
      const body = (await res.json()) as { markets?: Record<string, unknown>[]; cursor?: string };
      for (const m of body.markets ?? []) ms.push({ tk: m.ticker, open: m.open_time, close: m.close_time, strike: m.floor_strike, settle: m.expiration_value, result: m.result });
      cursor = body.cursor ?? "";
      if (!cursor) break;
      await new Promise((r) => setTimeout(r, 400));
    } catch {
      break;
    }
  }
  out.markets = ms;
  for (const sym of [...new Set(SILVER_FEEDS)]) {
    for (const [res, key] of [["5", "bars5"], ["1", "bars1"]] as const) {
      try {
        const bars = await chartRaw(sym, res, 5000);
        (out[key] as Record<string, unknown>)[sym] = bars.map((b) => [b.t, b.o, b.h, b.l, b.c, b.v]);
      } catch (e) {
        (out[key] as Record<string, unknown>)[sym] = { error: String(e) };
      }
    }
  }
  writeFileSync(FILE(), JSON.stringify(out));
}
