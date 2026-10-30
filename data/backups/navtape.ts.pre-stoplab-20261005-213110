// NAV TAPE (Claude, read only). Once a minute, for BTC and gold: price, the last closed 1m and 5m
// candles, every nav line on 1m / 5m / 10m / 15m (purple + both Bollinger bands), and her session
// VWAP bands. Kept for 4 days in data/nav-tape.json so we can study how price behaves around every
// line on every timeframe, including what happened 5 / 10 / 15 minutes later. Never trades.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = () => join(process.cwd(), "data", "nav-tape.json");
const g = globalThis as unknown as { __navTapeMinute?: number };
const KEEP = 4 * 24 * 60 * 2;

type AssetLike = {
  spot: number;
  target: number | null;
  secondsLeft: number;
  market: { ticker: string; yesBid: number; noBid: number } | null;
  vwap1m: { vwap: number; stdev: number } | null;
  nav?: Record<string, unknown> | null;
};

const r = (n: unknown, d = 3) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);

export function navTapeTick(assets: Record<string, AssetLike> | null | undefined) {
  if (!assets) return;
  const minute = Math.floor(Date.now() / 60000);
  if (g.__navTapeMinute === minute) return;
  g.__navTapeMinute = minute;
  let rows: unknown[] = [];
  try {
    const prev = JSON.parse(readFileSync(FILE(), "utf8"));
    rows = Array.isArray(prev) ? prev : [];
  } catch {
    rows = [];
  }
  for (const id of ["btc", "gold"]) {
    const a = assets[id];
    if (!a || !(a.spot > 0)) continue;
    const n = (a.nav ?? {}) as Record<string, { c: number; up: number; dn: number } | number | null>;
    const line = (k: string) => {
      const f = n[k] as { c: number; up: number; dn: number } | null | undefined;
      return f && typeof f === "object" ? [r(f.c), r(f.up), r(f.dn)] : null;
    };
    rows.push({
      t: minute * 60,
      a: id,
      spot: r(a.spot),
      c1: r(n.close1m as number),
      c5: r(n.close5m as number),
      m1: line("m1"),
      m5: line("m5"),
      m10: line("m10"),
      m15: line("m15"),
      vw: r(a.vwap1m?.vwap),
      sd: r(a.vwap1m?.stdev),
      tk: a.market?.ticker ?? null,
      tgt: r(a.target),
      yb: a.market?.yesBid ?? null,
      left: Math.round(a.secondsLeft || 0),
    });
  }
  try {
    writeFileSync(FILE(), JSON.stringify(rows.slice(-KEEP)));
  } catch {
    // research only
  }
}
