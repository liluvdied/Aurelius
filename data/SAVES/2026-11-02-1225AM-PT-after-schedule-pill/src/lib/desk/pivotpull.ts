// PIVOT LAB PULL (Claude, Oct 11 ~2:30 AM PT, Love's CM Pivot Bands): one read-only pull of 1m + 5m bars for BTC and gold
// from the charts the desk trades on, for the pivot-band backtest. Never trades. data/pivot-*.json
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";
const g = globalThis as unknown as { __pivPullAt?: number };
export async function pivotPullTick() {
  if (g.__pivPullAt && Date.now() - g.__pivPullAt < 30 * 60000) return;
  g.__pivPullAt = Date.now();
  const want: [string, string, string][] = [["PEPPERSTONE:BTCUSD", "1", "btc1"], ["PEPPERSTONE:BTCUSD", "5", "btc5"], ["TVC:GOLD", "1", "gold1"], ["TVC:GOLD", "5", "gold5"]];
  for (const [sym, res, name] of want) {
    const f = join(process.cwd(), "data", `pivot-${name}.json`);
    try {
      if (existsSync(f) && Date.now() - statSync(f).mtimeMs < 6 * 3600 * 1000) continue;
      const c = await chartRaw(sym, res, 5000);
      writeFileSync(f, JSON.stringify({ at: new Date().toISOString(), symbol: sym, res, bars: c }));
    } catch (e) {
      try { writeFileSync(f + ".err", String(e).slice(0, 300)); } catch {}
    }
  }
}
