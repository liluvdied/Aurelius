// RESEARCH PULL (Claude, read only). Saves long OANDA history (5m + 15m) for BTC and gold so band
// questions can be tested offline. Runs once per server load. Never trades.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";

const g = globalThis as unknown as { __researchRun?: string };
const RUN = "r1";

export async function researchOnce() {
  if (g.__researchRun === RUN) return;
  g.__researchRun = RUN;
  const jobs = [
    ["btc", "OANDA:BTCUSD", "5"],
    ["btc", "OANDA:BTCUSD", "15"],
    ["gold", "OANDA:XAUUSD", "5"],
    ["gold", "OANDA:XAUUSD", "15"],
  ] as const;
  for (const [id, symbol, res] of jobs) {
    try {
      const bars = await chartRaw(symbol, res, 5000);
      writeFileSync(join(process.cwd(), "data", `research-${id}-${res}m.json`), JSON.stringify(bars.map((b) => [b.t, b.o, b.h, b.l, b.c, b.v])));
    } catch (err) {
      try {
        writeFileSync(join(process.cwd(), "data", `research-${id}-${res}m.json`), JSON.stringify({ error: String((err as Error)?.message || err) }));
      } catch {
        // research only
      }
    }
  }
  try {
    const live = await import("./kalshi-live.server");
    await live.kalshiHistory();
  } catch {
    // research only
  }
}
