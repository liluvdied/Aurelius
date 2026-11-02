// BTC HOURLY (Claude, 2026-10-02, Love: "we need to trade the hourly predictions on BTC and gold too —
// the hourly nav band holds up WAY more than the session bands. If price taps and rejects or breaks
// through the nav band, you know what to do"). Paper only, never trades.
//   Market: Kalshi KXBTCD, the hourly "Bitcoin above $X at the top of the hour" ladder. She takes the
//           strike nearest to price (the closest thing to a coin flip, ~2x).
//   Lines:  her 1-hour nav band (purple center, upper, lower: vwma(hlc3,7) ± 4σ on 1h bars).
//   Entry:  a CLOSED 5-minute candle that rejects one of those lines (wicks through, closes back) or
//           breaks one (closes through it after the candle before closed on the other side, 1m close
//           confirming). Same law as everything else: her DNA (nothing right in front, clear road to the
//           strike), and no 1-hour line within $100 in front either. 1.38x-3x, more than 10 minutes left.
//   Exit:   hard take profit (+50% under 1.65x, 75% of the max), otherwise Kalshi's result at the hour.
// Gold: Kalshi has no hourly gold market (only daily KXGOLDD / weekly KXGOLDW), so gold is not traded here.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AssetSnapshot, KalshiMarket } from "./types";
import { fetchMarket, mapMarket } from "./kalshi";
import { channelFront, dnaLog, dnaNow } from "./dna";
import { hourConsider, hourOpen, hourSell } from "./nightbook";

const BASE = "https://external-api.kalshi.com/trade-api/v2";
const g = globalThis as unknown as { __hourAt?: number; __hourBusy?: boolean; __hourMk?: { at: number; ms: KalshiMarket[] } };
export type HourLook = { at: string; spot: number; market: string | null; strike: number | null; signal: string | null; verdict: string };
let look: HourLook | null = null;
export function hourLook() {
  return look;
}

async function ladder(): Promise<KalshiMarket[]> {
  if (g.__hourMk && Date.now() - g.__hourMk.at < 30000) return g.__hourMk.ms;
  const res = await fetch(`${BASE}/markets?series_ticker=KXBTCD&status=open&limit=500`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  const body = (await res.json()) as { markets?: Parameters<typeof mapMarket>[0][] };
  const ms = (body.markets ?? []).map(mapMarket);
  g.__hourMk = { at: Date.now(), ms };
  return ms;
}

export async function hourTick(assets: Record<string, AssetSnapshot> | null | undefined) {
  if (!assets || g.__hourBusy || (g.__hourAt && Date.now() - g.__hourAt < 15000)) return;
  g.__hourBusy = true;
  g.__hourAt = Date.now();
  try {
    // 1. Manage what's open: hard take profit on the real hourly bid.
    for (const r of hourOpen()) {
      const m = await fetchMarket(r.ticker);
      if (!m) continue;
      const bid = r.side === "up" ? m.yesBid : m.noBid;
      if (!(bid > 0)) continue;
      const pct = (bid / r.ask - 1) * 100;
      hourSell(r.id, bid, pct);
    }
    // 2. Look for a new entry.
    const a = assets.btc;
    const spot = Number(a?.spot) || 0;
    const nav = a?.nav;
    look = { at: new Date().toISOString(), spot, market: null, strike: null, signal: null, verdict: "waiting" };
    const h = nav?.m60;
    const bar = nav?.bar5m;
    const prev = nav?.prev5m;
    const c1 = nav?.close1m;
    if (!(spot > 0) || !h || !bar) {
      look.verdict = "no 1-hour nav band yet";
      return;
    }
    const all = (await ladder()).filter((m) => m.target && m.closeTime);
    const now = Date.now();
    const soon = all.filter((m) => Date.parse(m.closeTime) - now > 10 * 60 * 1000 && Date.parse(m.closeTime) - now <= 65 * 60 * 1000);
    if (!soon.length) {
      look.verdict = "no hourly market with 10+ minutes left";
      return;
    }
    const close = Math.min(...soon.map((m) => Date.parse(m.closeTime)));
    const hour = soon.filter((m) => Date.parse(m.closeTime) === close);
    const mk = hour.sort((x, y) => Math.abs((x.target ?? 0) - spot) - Math.abs((y.target ?? 0) - spot))[0];
    look.market = mk.ticker;
    look.strike = mk.target;
    const lines = [
      { name: "1h purple", price: h.c },
      { name: "1h upper", price: h.up },
      { name: "1h lower", price: h.dn },
    ].filter((l) => l.price > 0);
    let sig: { side: "up" | "down"; label: string } | null = null;
    for (const l of lines) {
      const L = l.price;
      if (bar.l < L && bar.c > L && bar.o >= L) sig = { side: "up", label: `HOURLY rejection up off the ${l.name}` };
      else if (bar.h > L && bar.c < L && bar.o <= L) sig = { side: "down", label: `HOURLY rejection down off the ${l.name}` };
      else if (prev != null && prev < L && bar.c > L && (c1 == null || c1 > L)) sig = { side: "up", label: `HOURLY 5m close above the ${l.name}` };
      else if (prev != null && prev > L && bar.c < L && (c1 == null || c1 < L)) sig = { side: "down", label: `HOURLY 5m close below the ${l.name}` };
      if (sig) break;
    }
    if (!sig) {
      look.verdict = "no 5m rejection or break at a 1-hour line";
      return;
    }
    look.signal = sig.label;
    // Oct 3 ~1 AM PT (Love: wake HOURLY): not in the 25% of the channel closest to the line in front (was a flat $100).
    const ch = channelFront(sig.side, spot, lines.map((l) => l.price));
    const ahead = ch ? (sig.side === "up" ? ch.line - spot : spot - ch.line) : Infinity;
    const front = ch && ahead <= ch.width * 0.25 ? lines.find((l) => Math.abs(l.price - ch.line) < 1e-6) : undefined;
    if (front) {
      look.verdict = `the ${front.name} (${front.price.toFixed(2)}) is in the 25% of the channel in front`;
      return;
    }
    const why = dnaNow("btc", sig.side, spot, mk.target, "chan");
    if (why) {
      look.verdict = why;
      dnaLog("btc", sig.side, sig.label, mk.ticker, why, "hourly");
      return;
    }
    const ask = sig.side === "up" ? mk.yesAsk : mk.noAsk;
    if (!(ask > 0.02 && ask < 0.98)) {
      look.verdict = "no ask";
      return;
    }
    const mult = 1 / ask;
    if (mult < 1.38 || mult > 3) {
      look.verdict = `${mult.toFixed(2)}x is outside 1.38-3x`;
      return;
    }
    look.verdict = "TAKEN";
    let bands: Record<string, unknown> | null = null;
    try {
      bands = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.btc ?? null;
    } catch {
      bands = null;
    }
    hourConsider({ ticker: mk.ticker, event: mk.eventTicker, side: sig.side, ask, label: `${sig.label} · strike ${mk.target}` }, bands, spot);
  } catch {
    // paper only
  } finally {
    g.__hourBusy = false;
    try {
      if (look) writeFileSync(join(process.cwd(), "data", "hour-now.json"), JSON.stringify(look, null, 1));
    } catch {
      // diagnostic only
    }
  }
}
