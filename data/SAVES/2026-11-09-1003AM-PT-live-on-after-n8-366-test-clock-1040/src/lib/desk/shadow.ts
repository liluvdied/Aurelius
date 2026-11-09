// SHADOW BOOK: rejection model (Love, 2026-10-01). Paper only, never sends an order.
//
// Rule: fire only after a band REJECTION on a closed 1-minute candle.
//   Long:  the minute OPENED above a band, its low touched or wicked into it, and it CLOSED back
//          above it, still within half a band of it. No band directly overhead.
//   Short: the minute OPENED below a band, its high touched or wicked into it, and it CLOSED back below it,
//          within half a band of it. No band directly underneath.
// One shadow trade per symbol per window, priced at the live Kalshi ask the moment the minute
// closes. Scored two ways: held to the bell (Kalshi's real result) and with her take-profit table.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bandInWay } from "./auto";
import { trailScale } from "./paper";

type Bar = { minute: number; o: number; h: number; l: number; c: number };
export type ShadowTrade = {
  id: string;
  at: string;
  asset: string;
  ticker: string;
  side: "up" | "down";
  band: string;
  level: number;
  close: number;
  low: number;
  high: number;
  vwap: number;
  stdev: number;
  target: number | null;
  ask: number;
  multiple: number;
  tpPct: number;
  peakBid: number;
  tpHit: boolean;
  result: "open" | "win" | "loss";
  bellProfit: number | null;
  tpProfit: number | null;
};

const STAKE = 10;
const FILE = () => join(process.cwd(), "data", "shadow-reject.json");
const g = globalThis as unknown as { __shadowBars?: Record<string, Bar>; __shadowSettling?: boolean; __pathAt?: number };

// Price paths: every BTC and gold window, both sides, every 10 seconds. This is what lets us test
// take-profit + stop-loss combinations on real history instead of guessing.
const PATHS = () => join(process.cwd(), "data", "bid-paths.json");
type PathRow = [number, number, number, number]; // [unix seconds, yesBid, noBid, spot]
function recordPaths(assets: Record<string, AssetLike>) {
  if (g.__pathAt && Date.now() - g.__pathAt < 10000) return;
  g.__pathAt = Date.now();
  let paths: Record<string, PathRow[]> = {};
  try {
    paths = JSON.parse(readFileSync(PATHS(), "utf8"));
  } catch {
    paths = {};
  }
  const t = Math.floor(Date.now() / 1000);
  for (const id of ["btc", "gold"]) {
    const m = assets[id]?.market;
    if (!m?.ticker || !(m.yesBid >= 0) || !(m.noBid >= 0)) continue;
    (paths[m.ticker] ||= []).push([t, m.yesBid, m.noBid, assets[id].spot]);
  }
  // The bands the desk is using right now, so they can be checked against Love's chart.
  try {
    const now: Record<string, unknown> = { at: new Date().toISOString(), tpAt2x: trailScale(0.5).arm, tpAt1_5x: trailScale(1 / 1.5).arm };
    for (const id of ["btc", "gold"]) {
      const f = assets[id]?.vwap1m;
      if (f && f.vwap > 0) now[id] = { nav: (assets[id] as { nav?: unknown }).nav ?? null, spot: assets[id].spot, vwap: Math.round(f.vwap * 100) / 100, sd: Math.round(f.stdev * 100) / 100, up1: Math.round((f.vwap + f.stdev) * 100) / 100, up2: Math.round((f.vwap + 2 * f.stdev) * 100) / 100, up3: Math.round((f.vwap + 3 * f.stdev) * 100) / 100, dn1: Math.round((f.vwap - f.stdev) * 100) / 100, dn2: Math.round((f.vwap - 2 * f.stdev) * 100) / 100 };
    }
    // ATOMIC (Oct 7, Love: "she shorted btc into a band before it broke through... how is it that one got thru?"): the live
    // gates (band at the target, BTC headroom) read this file, and 5.8% of reads landed mid-write, failed, and let the trade
    // through. Write to a temp file, then swap it in, so a reader always sees a whole file.
    const bnFile = join(process.cwd(), "data", "bands-now.json");
    writeFileSync(`${bnFile}.tmp`, JSON.stringify(now, null, 1));
    renameSync(`${bnFile}.tmp`, bnFile);
  } catch {
    // diagnostic only
  }
  const keys = Object.keys(paths);
  // OLDEST FIRST, NOT ALPHABETICAL (Claude, Oct 10 ~8:30 PM PT, found during Love's SQUEEZE lock-in backtest): the trim
  // used to sort tickers A-Z, and "KXBTC..." always sorts before "KXGOLD...", so every BTC path was the first thrown out
  // and the file has held gold only since ~Oct 4. Now the windows that ended longest ago go first, and it keeps 900.
  const last = (k: string) => paths[k]?.[paths[k].length - 1]?.[0] ?? 0;
  if (keys.length > 900) for (const k of keys.sort((a, b) => last(a) - last(b)).slice(0, keys.length - 900)) delete paths[k];
  try {
    writeFileSync(PATHS(), JSON.stringify(paths));
  } catch {
    // never stop the desk
  }
}

function readRows(): ShadowTrade[] {
  try {
    const rows = JSON.parse(readFileSync(FILE(), "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
function writeRows(rows: ShadowTrade[]) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(FILE(), JSON.stringify(rows.slice(0, 500), null, 1));
  } catch {
    // the shadow book must never stop the desk
  }
}
export function listShadow(): ShadowTrade[] {
  return readRows();
}

function levels(vwap: number, stdev: number): { name: string; price: number }[] {
  const out = [{ name: "VWAP", price: vwap }];
  for (const s of [0.5, 1, 1.5, 2, 2.5, 3]) {
    out.push({ name: `+${s}σ`, price: vwap + s * stdev }, { name: `-${s}σ`, price: vwap - s * stdev });
  }
  return out;
}

/** Look at a closed 1-minute bar and return a rejection, if there is one. */
export function rejection(bar: Bar, vwap: number, stdev: number, asset: string): { side: "up" | "down"; band: string; level: number } | null {
  if (!(vwap > 0) || !(stdev > 0)) return null;
  const touch = stdev * 0.08;
  const near = stdev * 0.5;
  let best: { side: "up" | "down"; band: string; level: number; dist: number } | null = null;
  for (const lv of levels(vwap, stdev)) {
    // Long: dipped to the band, closed back above it, close still near it.
    if (bar.o > lv.price && bar.l <= lv.price + touch && bar.c > lv.price && bar.c - lv.price <= near) {
      const dist = bar.c - lv.price;
      if (!best || dist < best.dist) best = { side: "up", band: lv.name, level: lv.price, dist };
    }
    // Short: pushed up to the band, closed back below it, close still near it.
    if (bar.o < lv.price && bar.h >= lv.price - touch && bar.c < lv.price && lv.price - bar.c <= near) {
      const dist = lv.price - bar.c;
      if (!best || dist < best.dist) best = { side: "down", band: lv.name, level: lv.price, dist };
    }
  }
  if (!best) return null;
  if (bandInWay(best.side, bar.c, vwap, stdev, asset)) return null;
  return { side: best.side, band: best.band, level: best.level };
}

type AssetLike = {
  spot: number;
  target: number | null;
  secondsLeft: number;
  market: { ticker: string; yesAsk: number; noAsk: number; yesBid: number; noBid: number } | null;
  vwap1m: { vwap: number; stdev: number } | null;
  vwap5m: { vwap: number; stdev: number } | null;
};

/** Called every engine tick. Builds 1-minute bars from the live price and opens shadow trades. */
export function shadowTick(assets: Record<string, AssetLike> | null | undefined) {
  if (!assets) return;
  try {
    recordPaths(assets);
  } catch {
    // paths are optional
  }
  const bars = g.__shadowBars || (g.__shadowBars = {});
  const now = Date.now();
  const minute = Math.floor(now / 60000);
  let rows: ShadowTrade[] | null = null;
  let changed = false;
  for (const id of ["btc", "gold"]) {
    const a = assets[id];
    if (!a || !(a.spot > 0)) continue;
    const bar = bars[id];
    if (!bar || bar.minute !== minute) {
      // The previous minute just closed: check it for a rejection.
      if (bar && bar.minute === minute - 1) {
        const frame = a.vwap1m?.vwap ? a.vwap1m : a.vwap5m;
        const hit = frame ? rejection(bar, frame.vwap, frame.stdev, id) : null;
        const m = a.market;
        if (hit && m?.ticker && a.secondsLeft > 60) {
          rows = rows || readRows();
          if (!rows.some((r) => r.ticker === m.ticker && r.asset === id)) {
            const ask = hit.side === "up" ? m.yesAsk : m.noAsk;
            // Her normal odds range only: 1.2x to 3x. No lottery tickets.
            if (ask > 0.02 && ask < 0.98 && 1 / ask >= 1.2 && 1 / ask <= 3) {
              rows.unshift({
                id: `${m.ticker}:${hit.side}`,
                at: new Date().toISOString(),
                asset: id,
                ticker: m.ticker,
                side: hit.side,
                band: hit.band,
                level: Math.round(hit.level * 100) / 100,
                close: bar.c,
                low: bar.l,
                high: bar.h,
                vwap: Math.round((frame?.vwap ?? 0) * 100) / 100,
                stdev: Math.round((frame?.stdev ?? 0) * 100) / 100,
                target: a.target,
                ask,
                multiple: Math.round((1 / ask) * 100) / 100,
                tpPct: trailScale(ask).arm,
                peakBid: hit.side === "up" ? m.yesBid : m.noBid,
                tpHit: false,
                result: "open",
                bellProfit: null,
                tpProfit: null,
              });
              changed = true;
            }
          }
        }
      }
      bars[id] = { minute, o: a.spot, h: a.spot, l: a.spot, c: a.spot };
    } else {
      bar.h = Math.max(bar.h, a.spot);
      bar.l = Math.min(bar.l, a.spot);
      bar.c = a.spot;
    }
    // Track the best bid on open shadow trades, so we can score the take-profit.
    const m = a.market;
    if (m?.ticker) {
      rows = rows || readRows();
      for (const r of rows) {
        if (r.result !== "open" || r.ticker !== m.ticker || r.tpHit) continue;
        const bid = r.side === "up" ? m.yesBid : m.noBid;
        if (bid > r.peakBid) {
          r.peakBid = bid;
          changed = true;
        }
        if (r.tpPct > 0 && bid > 0 && (bid / r.ask - 1) * 100 >= r.tpPct) {
          r.tpHit = true;
          r.tpProfit = Math.round(STAKE * (bid / r.ask - 1) * 100) / 100;
          changed = true;
        }
      }
    }
  }
  if (changed && rows) writeRows(rows);
}

/** Settle closed windows with Kalshi's real result. Call every so often. */
export async function shadowSettle(result: (ticker: string) => Promise<"yes" | "no" | null>) {
  if (g.__shadowSettling) return;
  g.__shadowSettling = true;
  try {
    const rows = readRows();
    let changed = false;
    for (const r of rows) {
      if (r.result !== "open") continue;
      const res = await result(r.ticker).catch(() => null);
      if (!res) continue;
      const won = (r.side === "up" && res === "yes") || (r.side === "down" && res === "no");
      r.result = won ? "win" : "loss";
      r.bellProfit = won ? Math.round(STAKE * (1 / r.ask - 1) * 100) / 100 : -STAKE;
      if (!r.tpHit) r.tpProfit = r.bellProfit;
      changed = true;
    }
    if (changed) writeRows(rows);
  } finally {
    g.__shadowSettling = false;
  }
}
