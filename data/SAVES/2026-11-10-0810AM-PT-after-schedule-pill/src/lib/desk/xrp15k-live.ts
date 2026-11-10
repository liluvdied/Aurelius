import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { bars1045 } from "./p5m1045";
import { xrpRead961 } from "./xrp5m961";
import { ethBands682 } from "./ethbook";
import type { KalshiMarket } from "./types";

const G = globalThis as any;
const D = (file: string) => join(process.cwd(), "data", file);

// fix1057 The paper model and record stay separate from the Kalshi XRP live fills.
export function xrp15Enabled(): boolean {
  try { return JSON.parse(readFileSync(D("xrp15k-live.json"), "utf8"))?.on === true; }
  catch { return false; }
}
type Xrp15Side = "up" | "down";
type Xrp15Trade = {
  ticker: string; at: string; side: Xrp15Side; setup: string; result: "pending" | "open" | "closed" | "win" | "loss";
  ask?: number; stake?: number; filled?: number; remaining?: number; halfRemaining?: number; proceeds?: number;
  orderId?: string; exitPending?: boolean; pnl?: number;
};
function xrp15State(): { rows: Xrp15Trade[] } {
  const file = D("xrp15k-live-book.json");
  if (!existsSync(file)) return { rows: [] };
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(data.rows)) throw new Error("XRP 15m live ledger unreadable");
  return data;
}
function saveXrp15(state: { rows: Xrp15Trade[] }) {
  const file = D("xrp15k-live-book.json");
  writeFileSync(file + ".tmp", JSON.stringify(state));
  renameSync(file + ".tmp", file);
}
function xrp15Note(ticker: string, why: string) {
  if (G.__xrp15LastNote === ticker + why) return;
  G.__xrp15LastNote = ticker + why;
  try { appendFileSync(D("xrp15k-live.jsonl"), JSON.stringify({ ticker, why, at: new Date().toISOString() }) + "\n"); } catch {}
}
const XRP15_WINDOW_MS = 900000, XRP15_CLOSE_GUARD_MS = 120000;
function xrp15End(now: number) { return (Math.floor(now / XRP15_WINDOW_MS) + 1) * XRP15_WINDOW_MS; }
export function xrp15MarketOK(m: Pick<KalshiMarket, "ticker" | "status" | "closeTime" | "result">, ticker: string, now: number): boolean {
  const end = xrp15End(now);
  return m.ticker === ticker && !m.result && /^(active|open)$/i.test(m.status) &&
    Date.parse(m.closeTime) === end && end - now >= XRP15_CLOSE_GUARD_MS;
}
const XRP15_TICK_MAX_AGE_MS = 2000;
async function freshXrp15Tick(): Promise<{ spot: number; at: number } | null> {
  const signal = AbortSignal.timeout(2000);
  // A quiet XRP tape can leave the first ticker response just outside the freshness rule.
  // Recheck within the same two-second wire budget, using Coinbase's trade time.
  for (let attempt = 0; attempt < 4 && !signal.aborted; attempt++) {
    if (attempt > 0) await wait(450, undefined, { signal }).catch(() => {});
    if (signal.aborted) break;
    const tick = await fetch("https://api.exchange.coinbase.com/products/XRP-USD/ticker", { signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : null).catch(() => null);
    const spot = Number(tick?.price), at = Date.parse(String(tick?.time ?? ""));
    const age = Date.now() - at;
    if (!signal.aborted && Number.isFinite(spot) && spot > 0 && age >= 0 && age <= XRP15_TICK_MAX_AGE_MS) return { spot, at };
  }
  return null;
}
/** The last-line check uses the exact same setup on a newly read Coinbase XRP trade. */
export async function judgeXrp15(ticker: string, side: Xrp15Side, label: string, checked?: (quote: { spot: number; vwap?: number; stdev?: number }) => void): Promise<string> {
  if (!xrp15Enabled()) return "XRP 15m is paper only";
  const km = await import("./kalshi");
  const bs = await bars1045("xrp");
  if (!bs.length) return "XRP 15m has no candles at the wire";
  const tick = await freshXrp15Tick();
  const now = Date.now();
  if (ticker !== km.fifteenTicker("KXXRP15M", now + 1) || xrp15End(now) - now < XRP15_CLOSE_GUARD_MS) return "XRP 15m window is no longer eligible";
  if (!tick || tick.at > now || now - tick.at > XRP15_TICK_MAX_AGE_MS) return "XRP 15m has no trade tick within 2 seconds";
  const { spot } = tick;
  const lag = Number((globalThis as any).__lagLast654) || 0;
  if (lag > 0 && now - lag > 2000) return "XRP 15m is waiting after an engine delay";
  const lines = ethBands682(bs);
  const vwap = lines.find((line) => line.name === "session VWAP")?.price;
  const upper = lines.find((line) => line.name === "+1σ")?.price;
  checked?.({ spot, vwap, stdev: vwap && upper ? upper - vwap : undefined });
  const r = xrpRead961(bs, lines, spot, now / 1000); // 15m has no 5m-open filter
  if (!("side" in r)) return r.why;
  return r.side === side && r.label === label ? "" : "XRP 15m setup changed before the order";
}

type KM = Pick<typeof import("./kalshi"), "fetchMarket" | "fifteenTicker">;
type Xrp15Wire = Pick<typeof import("./kalshi-live.server"), "enterXrp15" | "exitXrp15">;
export async function xrp15Tick(nowMs = Date.now(), kmIn?: KM, wireIn?: Xrp15Wire) {
  if (G.__xrp15Busy || nowMs - Number(G.__xrp15At || 0) < 5000) return;
  const enabled = xrp15Enabled();
  const ledgerExists = existsSync(D("xrp15k-live-book.json"));
  if (!enabled && !ledgerExists) return;
  G.__xrp15At = nowMs;
  G.__xrp15Busy = true;
  try {
    const state = xrp15State();
    const km = kmIn || await import("./kalshi");
    const wire = wireIn || await import("./kalshi-live.server");
    const ticker = km.fifteenTicker("KXXRP15M", nowMs + 1);
    // An existing live position is managed independently of whether new entries are enabled.
    for (const row of state.rows.filter((r) => r.result === "open")) {
      const market = await km.fetchMarket(row.ticker).catch(() => null);
      if (!market || market.ticker !== row.ticker) continue;
      const remaining = Number(row.remaining), paid = Number(row.ask);
      if (market.result === "yes" || market.result === "no") {
        const won = (row.side === "up") === (market.result === "yes");
        row.pnl = Number(row.proceeds || 0) + (won ? remaining : 0) - Number(row.stake);
        row.result = row.pnl > 0 ? "win" : "loss";
        saveXrp15(state);
        continue;
      }
      if (row.exitPending || row.ticker !== ticker || !/^(active|open)$/i.test(market.status) || Date.parse(market.closeTime) <= Date.now()) continue;
      const bid = Number(row.side === "up" ? market.yesBid : market.noBid);
      const full = bid >= paid + 0.9 * (1 - paid) - 1e-9;
      const half = bid >= paid + 0.75 * (1 - paid) - 1e-9;
      const quantity = full ? remaining : half ? Number(row.halfRemaining) : 0;
      if (!(quantity >= 0.01)) continue;
      row.exitPending = true;
      saveXrp15(state);
      const fill = await wire.exitXrp15(row.ticker, row.side, remaining, quantity, bid);
      row.exitPending = false;
      if (fill) {
        row.remaining = Math.round((remaining - fill.filled) * 100) / 100;
        row.halfRemaining = Math.max(0, Math.round((Number(row.halfRemaining) - fill.filled) * 100) / 100);
        row.proceeds = Number(row.proceeds || 0) + fill.filled * fill.paid;
        if (row.remaining < 0.01) {
          row.pnl = row.proceeds - Number(row.stake);
          row.result = "closed";
        }
      }
      saveXrp15(state);
    }
    if (!enabled || !(wireIn || (await import("./live-guard")).liveOn()) ||
        xrp15End(nowMs) - nowMs < XRP15_CLOSE_GUARD_MS || state.rows.some((r) => r.ticker === ticker)) return;
    const [market, bs] = await Promise.all([km.fetchMarket(ticker), bars1045("xrp")]);
    if (!market || !xrp15MarketOK(market, ticker, Date.now()) || !bs.length) return;
    const r = xrpRead961(bs, ethBands682(bs), bs[bs.length - 1].c, Date.now() / 1000);
    if (!("side" in r)) { xrp15Note(ticker, r.why); return; }
    const ask = Number(r.side === "up" ? market.yesAsk : market.noAsk);
    if (!(ask > 0.02 && ask <= 0.66)) { xrp15Note(ticker, "no eligible ask at or below 66c"); return; }
    const row: Xrp15Trade = { ticker, at: new Date().toISOString(), side: r.side, setup: r.label, result: "pending" };
    state.rows.push(row);
    saveXrp15(state); // If the process dies or Kalshi gives an ambiguous response, never submit the same window twice.
    const fill = await wire.enterXrp15(ticker, r.side, r.label, Number(market.target));
    if (fill) {
      Object.assign(row, { result: "open", orderId: fill.orderId, ask: fill.paid, filled: fill.filled,
        remaining: fill.filled, halfRemaining: Math.floor(fill.filled * 50 + 1e-9) / 100, stake: fill.filled * fill.paid, proceeds: 0 });
    } else {
      state.rows.pop();
      xrp15Note(ticker, "guarded Kalshi order did not fill");
    }
    saveXrp15(state);
  } catch (error) {
    xrp15Note("XRP 15m", error instanceof Error ? error.message.slice(0, 150) : "live book error");
  } finally {
    G.__xrp15Busy = false;
  }
}
