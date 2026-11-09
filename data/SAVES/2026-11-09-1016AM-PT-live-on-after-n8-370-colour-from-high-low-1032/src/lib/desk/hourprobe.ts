// One-shot probe (Claude, 2026-10-02, Love: "we need to trade the hourly predictions on BTC and gold").
// Read only: asks Kalshi which hourly BTC / gold series are open and what their markets look like.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
const BASE = "https://external-api.kalshi.com/trade-api/v2";
const g = globalThis as unknown as { __hourProbe?: boolean };
export async function hourProbe() {
  if (g.__hourProbe) return;
  g.__hourProbe = true;
  const out: Record<string, unknown> = { at: new Date().toISOString() };
  for (const s of ["KXBTCD", "KXBTC", "KXBTCH", "KXGOLDD", "KXGOLDH", "KXGOLD", "KXGOLDW", "KXETHD", "KXSOLD"]) {
    try {
      const res = await fetch(`${BASE}/markets?series_ticker=${s}&status=open&limit=200`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
      const body = (await res.json()) as { markets?: Record<string, unknown>[] };
      const ms = body.markets ?? [];
      const closes = [...new Set(ms.map((m) => String(m.close_time)))].sort();
      out[s] = {
        status: res.status,
        open: ms.length,
        closes: closes.slice(0, 6),
        sample: ms.slice(0, 4).map((m) => ({ ticker: m.ticker, title: m.title, sub: m.yes_sub_title, strike_type: m.strike_type, floor: m.floor_strike, cap: m.cap_strike, close: m.close_time, yes_ask: m.yes_ask, no_ask: m.no_ask, vol: m.volume })),
      };
    } catch (e) {
      out[s] = { error: String(e) };
    }
  }
  writeFileSync(join(process.cwd(), "data", "hour-probe.json"), JSON.stringify(out, null, 1));
}
