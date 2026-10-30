// HOURLY LONGSHOTS (Claude, Oct 9 ~8:30 AM PT, Love: "i tried trading the hourly markets for btc on kalshi... went for the
// high multiples... set the auto sell at half its capacity... made $100 on two different ones... entering into one of
// the extreme multiples can get over 500%... we can try exiting at different levels and see what works"). PAPER ONLY.
// Market: Kalshi KXBTCD, "Bitcoin above $X at the top of the hour". Entry ticket: the strike in the trade's direction
// whose side costs 3-8c (12x-33x), with 20+ minutes left, $5 a ticket. Two entry rules, so we learn if a reason helps:
//   SIGNAL  = her 1-hour nav band: a closed 5m candle rejects or breaks the 1h purple / upper / lower (BTC HOURLY's read).
//   CONTROL = no reason at all: at :05 past each hour, one ticket up and one down (the plain lottery, for comparison).
// Every ticket is tracked with four exits side by side: sell at 3x, sell at 5x, sell at 50c ("half its capacity"), or
// hold to the hour. data/hour-lotto.json. Settled from Kalshi's own result.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket, mapMarket } from "./kalshi";
import type { KalshiMarket } from "./types";

const BASE = "https://external-api.kalshi.com/trade-api/v2";
const FILE = () => join(process.cwd(), "data", "hour-lotto.json");
const STAKE = 5;
export type Lotto = { id: string; rule: "signal" | "control"; at: string; ticker: string; strike: number; side: "up" | "down"; ask: number; why: string; close: string; peakBid: number; exits: Record<"x3" | "x5" | "c50" | "hold", { pnl: number | null; at?: string }>; done: boolean; result?: string };
const g = globalThis as unknown as { __lotAt?: number; __lotBusy?: boolean; __lotMk?: { at: number; ms: KalshiMarket[] }; __lotLastBar?: string };
const r2 = (n: number) => Math.round(n * 100) / 100;
const fee = (p: number, n: number) => r2(0.07 * p * (1 - p) * n);

function read(): Lotto[] {
  try {
    return existsSync(FILE()) ? (JSON.parse(readFileSync(FILE(), "utf8")) as Lotto[]) : [];
  } catch {
    return [];
  }
}
function write(rows: Lotto[]) {
  try {
    writeFileSync(FILE(), JSON.stringify(rows.slice(0, 2000)));
  } catch {
  }
}
async function ladder(): Promise<KalshiMarket[]> {
  if (g.__lotMk && Date.now() - g.__lotMk.at < 20000) return g.__lotMk.ms;
  const res = await fetch(`${BASE}/markets?series_ticker=KXBTCD&status=open&limit=500`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  const body = (await res.json()) as { markets?: Parameters<typeof mapMarket>[0][] };
  const ms = (body.markets ?? []).map(mapMarket);
  g.__lotMk = { at: Date.now(), ms };
  return ms;
}
/** The ticket: in the hour closing next (20+ min left), the strike on the trade's side whose side costs 3-8c, nearest 5c. */
function pick(ms: KalshiMarket[], side: "up" | "down", spot: number): KalshiMarket | null {
  const now = Date.now();
  const soon = ms.filter((m) => m.target && Date.parse(m.closeTime) - now > 20 * 60000 && Date.parse(m.closeTime) - now <= 65 * 60000);
  if (!soon.length) return null;
  const close = Math.min(...soon.map((m) => Date.parse(m.closeTime)));
  const hour = soon.filter((m) => Date.parse(m.closeTime) === close && (side === "up" ? (m.target ?? 0) > spot : (m.target ?? 0) < spot));
  const ok = hour.filter((m) => {
    const a = side === "up" ? m.yesAsk : m.noAsk;
    return a >= 0.03 && a <= 0.08;
  });
  if (!ok.length) return null;
  return ok.sort((x, y) => Math.abs((side === "up" ? x.yesAsk : x.noAsk) - 0.05) - Math.abs((side === "up" ? y.yesAsk : y.noAsk) - 0.05))[0];
}
function open(rows: Lotto[], rule: Lotto["rule"], m: KalshiMarket, side: "up" | "down", why: string): boolean {
  const id = `${m.ticker}:${side}:${rule}`;
  if (rows.some((r) => r.id === id)) return false;
  const ask = side === "up" ? m.yesAsk : m.noAsk;
  rows.unshift({ id, rule, at: new Date().toISOString(), ticker: m.ticker, strike: m.target ?? 0, side, ask, why, close: m.closeTime, peakBid: 0, exits: { x3: { pnl: null }, x5: { pnl: null }, c50: { pnl: null }, hold: { pnl: null } }, done: false });
  return true;
}

export async function hourLottoTick(assets: Record<string, any> | null | undefined) {
  if (!assets || g.__lotBusy || (g.__lotAt && Date.now() - g.__lotAt < 15000)) return;
  g.__lotBusy = true;
  g.__lotAt = Date.now();
  try {
    const rows = read();
    let changed = false;
    // 1. manage open tickets: each exit sells into the real bid when its level is reached; the rest settle at the hour.
    for (const r of rows.filter((x) => !x.done).slice(0, 20)) {
      const m = await fetchMarket(r.ticker);
      if (!m) continue;
      const n = STAKE / r.ask;
      const bid = r.side === "up" ? m.yesBid : m.noBid;
      if (bid > r.peakBid) {
        r.peakBid = bid;
        changed = true;
      }
      const sell = (k: "x3" | "x5" | "c50", hit: boolean) => {
        if (r.exits[k].pnl == null && hit && Date.now() < Date.parse(r.close)) {
          r.exits[k] = { pnl: r2(n * bid - STAKE - fee(r.ask, n) - fee(bid, n)), at: new Date().toISOString() };
          changed = true;
        }
      };
      sell("x3", bid >= 3 * r.ask);
      sell("x5", bid >= 5 * r.ask);
      sell("c50", bid >= 0.5);
      if (m.result === "yes" || m.result === "no") {
        const won = (m.result === "yes") === (r.side === "up");
        for (const k of ["x3", "x5", "c50", "hold"] as const) if (r.exits[k].pnl == null) r.exits[k] = { pnl: r2(won ? n - STAKE - fee(r.ask, n) : -STAKE - fee(r.ask, n)) };
        r.done = true;
        r.result = m.result;
        changed = true;
      }
    }
    // 2. new tickets
    const a = assets.btc;
    const spot = Number(a?.spot) || 0;
    if (spot > 0) {
      const ms = await ladder();
      // CONTROL: one up + one down at :05-:09 past each hour
      const min = new Date().getUTCMinutes();
      if (min >= 5 && min < 10) {
        for (const side of ["up", "down"] as const) {
          const m = pick(ms, side, spot);
          if (m && open(rows, "control", m, side, `control: :05 ticket ${side}, no signal`)) changed = true;
        }
      }
      // SIGNAL: her 1h nav band, a closed 5m candle rejecting or breaking it (once per 5m bar)
      const nav = a?.nav;
      const h = nav?.m60;
      const bar = nav?.bar5m;
      const prev = nav?.prev5m;
      const c1 = nav?.close1m;
      const barKey = bar ? `${nav?.close5mAt ?? ""}|${bar.c}` : "";
      if (h && bar && barKey !== g.__lotLastBar) {
        g.__lotLastBar = barKey;
        const lines = [
          { name: "1h purple", price: h.c },
          { name: "1h upper", price: h.up },
          { name: "1h lower", price: h.dn },
        ].filter((l) => l.price > 0);
        let sig: { side: "up" | "down"; label: string } | null = null;
        for (const l of lines) {
          const L = l.price;
          if (bar.l < L && bar.c > L && bar.o >= L) sig = { side: "up", label: `5m rejection up off the ${l.name}` };
          else if (bar.h > L && bar.c < L && bar.o <= L) sig = { side: "down", label: `5m rejection down off the ${l.name}` };
          else if (prev != null && prev < L && bar.c > L && (c1 == null || c1 > L)) sig = { side: "up", label: `5m close above the ${l.name}` };
          else if (prev != null && prev > L && bar.c < L && (c1 == null || c1 < L)) sig = { side: "down", label: `5m close below the ${l.name}` };
          if (sig) break;
        }
        if (sig) {
          const m = pick(ms, sig.side, spot);
          if (m && open(rows, "signal", m, sig.side, sig.label)) changed = true;
        }
      }
    }
    if (changed) write(rows);
  } catch {
    // paper only
  } finally {
    g.__lotBusy = false;
  }
}

export function hourLotto() {
  const rows = read();
  const done = rows.filter((r) => r.done);
  const sum = (rule: Lotto["rule"]) => {
    const xs = done.filter((r) => r.rule === rule);
    const out: Record<string, { n: number; w: number; p: number }> = {};
    for (const k of ["x3", "x5", "c50", "hold"] as const) {
      const ps = xs.map((r) => r.exits[k].pnl ?? 0);
      out[k] = { n: ps.length, w: ps.filter((p) => p > 0).length, p: r2(ps.reduce((s, p) => s + p, 0)) };
    }
    return out;
  };
  return { open: rows.filter((r) => !r.done).length, signal: sum("signal"), control: sum("control"), recent: rows.slice(0, 20) };
}
