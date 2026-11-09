// LAST-MINUTE LOCK LAB (Claude, Oct 11 ~7:30 AM PT, Love: "the last trade just went to zero in the last 10 seconds... do you
// think we should make an exception for last minute reversals like that? how should we structure that so it doesn't happen
// again and not take away from winners... we'll run it on paper til we can confirm"). PAPER SCORING ONLY, nothing sells.
// Rule being tested: with L seconds left, if the side we hold is GREEN (bid over what we paid) but the market still hasn't
// called it (bid under 90c), take the green at the bid instead of riding a coin flip into the bell. 90c+ = decided, she rides.
// Scored on every BTC + gold 15M trade (PAPER's own and live) still held at that point, from the bid-paths the desk records
// every ~15 s, settled on Kalshi's result. Three clocks run side by side: 2:00, 1:30, 1:00 left. Lab on 39 BTC trades
// (Oct 9-11): 2:00 + 90c = 9 fires, +$241 kept, $4 given up.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";

const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const CLOCKS = [120, 90, 60];
const DECIDED = 0.9;
type Row = { key: string; ticker: string; asset: string; side: string; source: string; ask: number; contracts: number; settle: number | null; early: boolean; v: Record<string, { bid: number; delta: number } | null>; at: string };
const g = globalThis as unknown as { __lmAt?: number; __lmBusy?: boolean };
const read = (): Row[] => { try { return existsSync(D("last-minute.json")) ? JSON.parse(readFileSync(D("last-minute.json"), "utf8")) : []; } catch { return []; } };
const write = (rows: Row[]) => { writeFileSync(D("last-minute.json.tmp"), JSON.stringify(rows.slice(0, 5000))); renameSync(D("last-minute.json.tmp"), D("last-minute.json")); };
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function endOf(tk: string): number {
  const m = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(tk);
  if (!m) return 0;
  // Kalshi tickers are New York time; EDT until Nov 1.
  return Date.UTC(2000 + Number(m[1]), MON.indexOf(m[2]), Number(m[3]), Number(m[4]) + 4, Number(m[5])) / 1000;
}

export async function lastMinuteTick() {
  if (g.__lmBusy || (g.__lmAt && Date.now() - g.__lmAt < 60000)) return;
  g.__lmAt = Date.now();
  g.__lmBusy = true;
  try {
    const rows = read();
    const have = new Set(rows.map((r) => r.key));
    const paths = JSON.parse(readFileSync(D("bid-paths.json"), "utf8"));
    const trades = JSON.parse(readFileSync(D("live-paper-book.json"), "utf8"))?.trades ?? [];
    const now = Date.now() / 1000;
    let n = 0;
    for (const t of trades) {
      if (!/^(btc|gold)$/.test(t?.asset) || !/15M-/.test(String(t?.ticker))) continue;
      const source = t.source === "paper" ? "paper" : "live";
      const key = `${t.ticker}:${t.side}:${source}`;
      if (have.has(key)) continue;
      const end = endOf(t.ticker);
      const path: number[][] = paths[t.ticker];
      if (!end || now < end + 30 || !Array.isArray(path) || !path.length) continue;
      if (now > end + 6 * 3600) continue;
      let settle: number | null = null;
      try {
        const m = (await kget(`/trade-api/v2/markets/${t.ticker}`))?.market;
        if (m?.result === "yes" || m?.result === "no") settle = (m.result === "yes") === (t.side === "up") ? 1 : 0;
      } catch {
      }
      if (settle == null) continue;
      const ci = t.side === "down" ? 2 : 1;
      const ask = Number(t.ask) || 0;
      if (!(ask > 0)) continue;
      const contracts = source === "paper" ? 25 / ask : Number(t.contracts) || (Number(t.stake) || 25) / ask;
      const closed = t.closedAt ? Date.parse(t.closedAt) / 1000 : end;
      const early = closed < end - CLOCKS[0] - 5;
      const v: Row["v"] = {};
      for (const L of CLOCKS) {
        const s = early ? undefined : path.find((p) => end - p[0] <= L && end - p[0] > 8);
        const bid = s ? Number(s[ci]) : NaN;
        v[String(L)] = Number.isFinite(bid) && bid > ask && bid < DECIDED ? { bid, delta: r2((bid - settle) * contracts) } : null;
      }
      rows.unshift({ key, ticker: t.ticker, asset: t.asset, side: t.side, source, ask, contracts: r2(contracts), settle, early, v, at: new Date(end * 1000).toISOString() });
      have.add(key);
      if (++n >= 25) break;
    }
    if (n) write(rows);
  } catch {
  } finally {
    g.__lmBusy = false;
  }
}

export function lastMinute() {
  const rows = read();
  const out: Record<string, any> = {};
  for (const asset of ["btc", "gold"]) {
    for (const L of CLOCKS) {
      const fired = rows.filter((r) => r.asset === asset && r.v?.[String(L)]);
      const saved = fired.filter((r) => r.v[String(L)]!.delta > 0);
      const gave = fired.filter((r) => r.v[String(L)]!.delta <= 0);
      out[`${asset}:${L}`] = { fires: fired.length, saved: saved.length, savedUsd: r2(saved.reduce((s, r) => s + r.v[String(L)]!.delta, 0)), gaveUp: gave.length, gaveUsd: r2(gave.reduce((s, r) => s + r.v[String(L)]!.delta, 0)), net: r2(fired.reduce((s, r) => s + r.v[String(L)]!.delta, 0)) };
    }
    out[`${asset}:held`] = rows.filter((r) => r.asset === asset && !r.early).length;
  }
  return { summary: out, recent: rows.filter((r) => r.v?.["120"] || r.v?.["90"] || r.v?.["60"]).slice(0, 12) };
}
