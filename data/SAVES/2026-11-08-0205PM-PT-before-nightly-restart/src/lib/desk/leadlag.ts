// LEAD-LAG (Claude, 2026-10-02, Love: "when BTC falls, SOL and ETH fall with it — can we use BTC as the
// signal?"). Read only, never trades. Every 10 seconds it writes one line to data/leadlag/<date>.jsonl:
// BTC, ETH and SOL prices plus the live Kalshi 15-minute ETH and SOL markets (strike, bids, asks,
// seconds left). scripts/leadlag-study.py then measures: after BTC drops (or pops) fast, how often
// and how fast do ETH and SOL follow through their strikes, and what multiple was still on offer
// in that gap.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fetchSeriesMarket } from "./kalshi";
import { chartQuote } from "./tv";

const g = globalThis as unknown as { __leadAt?: number; __leadBusy?: boolean };
export async function leadLagTick(btcSpot: number, btcMarket: { ticker: string; target: number | null; yesBid: number; yesAsk: number; noBid: number; noAsk: number; closeTime: string } | null) {
  if (g.__leadBusy || (g.__leadAt && Date.now() - g.__leadAt < 10000)) return;
  g.__leadBusy = true;
  g.__leadAt = Date.now();
  try {
    const [eth, sol, ethM, solM] = await Promise.all([
      chartQuote("COINBASE:ETHUSD").catch(() => 0),
      chartQuote("COINBASE:SOLUSD").catch(() => 0),
      fetchSeriesMarket("KXETH15M").catch(() => null),
      fetchSeriesMarket("KXSOL15M").catch(() => null),
    ]);
    const m = (x: { ticker: string; target: number | null; yesBid: number; yesAsk: number; noBid: number; noAsk: number; closeTime: string } | null) =>
      x ? { tk: x.ticker, tgt: x.target, yb: x.yesBid, ya: x.yesAsk, nb: x.noBid, na: x.noAsk, left: Math.round((Date.parse(x.closeTime) - Date.now()) / 1000) } : null;
    const row = { t: Math.floor(Date.now() / 1000), btc: btcSpot || 0, eth, sol, kb: m(btcMarket), ke: m(ethM), ks: m(solM) };
    const dir = join(process.cwd(), "data", "leadlag");
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, `${new Date().toISOString().slice(0, 10)}.jsonl`), JSON.stringify(row) + "\n");
  } catch {
    // recorder only
  } finally {
    g.__leadBusy = false;
  }
}
