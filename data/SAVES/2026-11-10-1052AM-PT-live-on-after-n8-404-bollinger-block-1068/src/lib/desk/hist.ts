// HISTORY DUMP (Claude, 2026-10-02, read only): pulls a week+ of Love's chart bars once so every past
// entry can be audited against the bands she actually sees. Writes data/hist/*.json. Never trades.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";

const g = globalThis as unknown as { __histDump?: boolean };
export async function histDumpOnce() {
  if (g.__histDump) return;
  g.__histDump = true;
  const dir = join(process.cwd(), "data", "hist");
  mkdirSync(dir, { recursive: true });
  const jobs: [string, string, string, number][] = [
    ["btc-5", "OANDA:BTCUSD", "5", 5000],
    ["btc-15", "OANDA:BTCUSD", "15", 2000],
    ["btc-1", "OANDA:BTCUSD", "1", 5000],
    ["gold-5", "OANDA:XAUUSD", "5", 5000],
    ["gold-15", "OANDA:XAUUSD", "15", 2000],
    ["gold-1", "OANDA:XAUUSD", "1", 5000],
  ];
  const done: Record<string, unknown> = { at: new Date().toISOString() };
  for (const [name, symbol, res, count] of jobs) {
    try {
      const bars = await chartRaw(symbol, res, count);
      writeFileSync(join(dir, `${name}.json`), JSON.stringify(bars));
      done[name] = { bars: bars.length, first: bars[0]?.t ?? null, last: bars[bars.length - 1]?.t ?? null };
    } catch (e) {
      done[name] = { error: String(e) };
    }
  }
  writeFileSync(join(dir, "index.json"), JSON.stringify(done, null, 1));
}

// PEPPERSTONE REPLAY (Claude, Oct 2 ~10:45 PM PT, Love: "yes" to re-checking this week's losing BTC trades
// against Pepperstone's lines). One-shot, read only: pulls Pepperstone BTC bars into data/hist/pep-btc-*.json.
const gp = globalThis as unknown as { __pepHist?: boolean };
export async function pepHistOnce() {
  if (gp.__pepHist) return;
  gp.__pepHist = true;
  const dir = join(process.cwd(), "data", "hist");
  mkdirSync(dir, { recursive: true });
  const done: Record<string, unknown> = { at: new Date().toISOString() };
  for (const [name, res, count] of [["pep-btc-5", "5", 5000], ["pep-btc-15", "15", 2000], ["pep-btc-1", "1", 5000]] as const) {
    try {
      const bars = await chartRaw("PEPPERSTONE:BTCUSD", res, count);
      writeFileSync(join(dir, `${name}.json`), JSON.stringify(bars));
      done[name] = { bars: bars.length, first: bars[0]?.t ?? null, last: bars[bars.length - 1]?.t ?? null };
    } catch (e) {
      done[name] = { error: String(e) };
    }
  }
  writeFileSync(join(dir, "pep-index.json"), JSON.stringify(done, null, 1));
}
