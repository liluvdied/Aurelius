// LAB PULL (Claude, Oct 9 ~10:40 PM PT, Love: "see if trading on the vantage chart after the session break on btc is of any
// benefit... vantage is holding them now... backtest this theory through the past couple weeks"). READ ONLY: one pull of
// ~17 days of 5m BTC bars from PEPPERSTONE and VANTAGE (TradingView, read only) into data/lab-*.json for the lab.
// Runs once per desk start, only when the files are missing or older than 6 h.
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";
const g = globalThis as unknown as { __labPullAt?: number };
export async function labPullTick() {
  if (g.__labPullAt && Date.now() - g.__labPullAt < 30 * 60000) return;
  g.__labPullAt = Date.now();
  for (const sym of ["PEPPERSTONE:BTCUSD", "VANTAGE:BTCUSD"]) {
    const f = join(process.cwd(), "data", `lab-${sym.split(":")[0].toLowerCase()}-btc5.json`);
    try {
      if (existsSync(f) && Date.now() - statSync(f).mtimeMs < 6 * 3600 * 1000) continue;
      const c = await chartRaw(sym, "5", 5000);
      if (c.length) writeFileSync(f, JSON.stringify({ at: new Date().toISOString(), symbol: sym, bars: c }));
    } catch {
    }
  }
}
