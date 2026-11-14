import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bars1045 } from "./p5m1045";
import { xrpWireTick1098 } from "./xrpfeed1098"; // fix1098
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
/** The last-line check uses the exact same setup on a newly read Coinbase XRP trade. */
export async function judgeXrp15(ticker: string, side: Xrp15Side, label: string, checked?: (quote: { spot: number; vwap?: number; stdev?: number }) => void): Promise<string> {
  if (!xrp15Enabled()) return "XRP 15m is paper only";
  const km = await import("./kalshi");
  const bs = await bars1045("xrp");
  if (!bs.length) return "XRP 15m has no candles at the wire";
  const tick = await xrpWireTick1098(2000); // fix1098 XRP ON HER BINANCE CHART (Love Nov 13 2026 9:55 PM PT: "yes, we need to put her on the binance.us chart coinbase freezes very often" + 10:00 PM PT on the picture labelled "XRPUSDT • BINANCE": "sorry yes, the chart i sent you"): her last line reads the newest trade on the chart her candles came from (BINANCE:XRPUSDT; Coinbase as before only while that chart is not usable). The same 2 second rule.
  const now = Date.now(), spot = Number(tick?.price), age = now - Date.parse(String(tick?.time ?? ""));
  if (ticker !== km.fifteenTicker("KXXRP15M", now + 1) || xrp15End(now) - now < XRP15_CLOSE_GUARD_MS) return "XRP 15m window is no longer eligible";
  if (!(spot > 0) || !(age >= 0 && age <= 2000)) return "XRP 15m has no trade tick within 2 seconds";
  const lag = Number((globalThis as any).__lagLast654) || 0;
  if (lag > 0 && now - lag > 2000) return "XRP 15m is waiting after an engine delay";
  const lines = ethBands682(bs);
  const vwap = lines.find((line) => line.name === "session VWAP")?.price;
  const upper = lines.find((line) => line.name === "+1σ")?.price;
  checked?.({ spot, vwap, stdev: vwap && upper ? upper - vwap : undefined });
  const r = xrpRead961(bs, lines, spot, now / 1000); // 15m has no 5m-open filter
  try { appendFileSync(D("xrp15-board-1070.jsonl"), JSON.stringify({ at: new Date(now).toISOString(), ticker, side, label, spot, read: "side" in r ? { side: r.side, label: r.label } : { why: r.why }, lines }) + "\n"); } catch {} // fix1070 LOG ONLY (Love Nov 10 2026 11:14 AM PT: "she just longed xrp while it was under a band" + "make sure every trade has one"): her XRP 15m last line writes the board it judged (price + every line she read) to data/xrp15-board-1070.jsonl, so each XRP entry can be checked against her bands. Never changes a decision.
  if (!("side" in r)) return r.why;
  return r.side === side && r.label === label ? "" : "XRP 15m setup changed before the order";
}

// fix1098 XRP LOOKS EVERY SECOND OFF THE LIVE PRICE (Love Nov 13 2026 9:45 PM PT: "can you fix the bug that is causing her to miss the push by half of a ten thousandth, and then stop looking for the rest of the window? because xrp definitely met the push requirement afterwards").
// Her XRP 15m lane looked once per pass of her main loop and never more than once in 5 s: 26 looks in the 7 minutes from 9:30 PM Nov 13, 5 to 35 s apart, each on the last candle close.
// A push that was met between two looks was never seen. Now: her own 1 s clock, the live trade price off her chart (xrpfeed1098.ts: BINANCE:XRPUSDT), and one line per look in data/xrp-tick-1098.jsonl (she kept no XRP ticks).
// Not changed: her read (xrpRead961), her push size, her walls, her last-line check (judgeXrp15), her one position a window, her 66c ask limit, her $1, her exits and their pace.
export async function xrpSpot1098(read?: string): Promise<{ spot: number | null; src: string }> {
  const tick = await xrpWireTick1098(900), now = Date.now();
  const spot = Number(tick?.price), age = now - Date.parse(String(tick?.time ?? ""));
  const ok = spot > 0 && age >= -1000 && age <= 2000;
  try { appendFileSync(D("xrp-tick-1098.jsonl"), JSON.stringify({ t: now, a: "xrp", c: spot > 0 ? spot : null, src: tick?.src ?? null, ageMs: Number.isFinite(age) ? Math.round(age) : null, used: ok, ...(read ? { read } : {}) }) + "\n"); } catch {}
  return { spot: ok ? spot : null, src: String(tick?.src ?? "") };
}
export function ensureXrp15Clock1098(): void {
  G.__xrp15Fn1098 = xrp15Tick; // a reloaded file hands the running clock its new self
  if (G.__xrp15Clock1098) return;
  G.__xrp15Clock1098 = setInterval(() => { const fn = G.__xrp15Fn1098; if (typeof fn === "function") void fn().catch(() => {}); }, 1000);
  try { G.__xrp15Clock1098.unref?.(); } catch {}
}
type KM = Pick<typeof import("./kalshi"), "fetchMarket" | "fifteenTicker">;
type Xrp15Wire = Pick<typeof import("./kalshi-live.server"), "enterXrp15" | "exitXrp15">;
export async function xrp15Tick(nowMs = Date.now(), kmIn?: KM, wireIn?: Xrp15Wire) {
  ensureXrp15Clock1098(); // fix1098: her own 1 s clock, so she does not wait on the main loop to look
  if (G.__xrp15Busy || nowMs - Number(G.__xrp15At || 0) < 1000 /* fix1098: was 5000 - she looks every second now */) return;
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
    const exitDue1098 = nowMs - Number(G.__xrp15ExitAt1098 || 0) >= 5000; if (exitDue1098) G.__xrp15ExitAt1098 = nowMs; // fix1098: her exits keep the pace they had (every 5 s at most), so Kalshi is not asked more often for them
    for (const row of (exitDue1098 ? state.rows.filter((r) => r.result === "open") : [])) {
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
    const bs = await bars1045("xrp");
    if (!bs.length) return;
    const live1098 = await xrpSpot1098(), spot1098 = live1098.spot ?? bs[bs.length - 1].c; // fix1098: the live trade price off her chart (the same one her last-line check reads); no trade within 2 s = the last candle close, as before
    const r = xrpRead961(bs, ethBands682(bs), spot1098, Date.now() / 1000);
    if (!("side" in r)) { xrp15Note(ticker, r.why); return; }
    if (nowMs - Number(G.__xrp15TryAt1098 || 0) < 5000) return; G.__xrp15TryAt1098 = nowMs; // fix1098: she LOOKS every second; an order try that Kalshi did not take is tried again no sooner than 5 s later (the pace her tries had at best), so Kalshi is not asked 4 times a second all window
    const market = await km.fetchMarket(ticker); // fix1098: Kalshi is asked for the market only once her read has a set up, so looking every second does not ask Kalshi every second
    if (!market || !xrp15MarketOK(market, ticker, Date.now())) return;
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
