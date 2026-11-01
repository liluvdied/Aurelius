import type { KalshiMarket } from "./types";

const BASE = "https://external-api.kalshi.com/trade-api/v2";

type RawMarket = {
  ticker?: string;
  event_ticker?: string;
  title?: string;
  status?: string;
  floor_strike?: number | string | null;
  close_time?: string;
  open_time?: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  no_bid_dollars?: string;
  no_ask_dollars?: string;
  last_price_dollars?: string;
  volume_fp?: string;
  result?: string;
  yes_sub_title?: string;
};

type MarketsResponse = { markets?: RawMarket[] };

async function fetchJson<T>(url: string, timeout = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "AureliusDesk/1.0",
      },
    });
    if (!res.ok) throw new Error(`Kalshi ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function dollars(v: string | number | undefined | null): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (!v) return 0;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function parseTarget(raw: RawMarket): number | null {
  const strike = raw.floor_strike;
  if (typeof strike === "number" && Number.isFinite(strike) && strike > 0) return strike;
  if (typeof strike === "string") {
    const n = Number.parseFloat(strike.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  const sub = raw.yes_sub_title ?? "";
  const m = sub.match(/\$?\s*([\d,]+(?:\.\d+)?)/);
  if (m) {
    const n = Number.parseFloat(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// KALSHI'S STRIKE ON HER CHART (Oct 18 ~1:46 PM PT, Love: "price differential is supposed to be deducted from kalshi and the live chart... the live
// price on the chart is NOT the price on kalshi for any btc chart on tradingview" + "Keep it, but deduct the gap"). Every BTC 15-minute target the desk
// compares to her chart (PAPER's entries and grading, the 5M half, exits) now sits where the last gate puts it: Kalshi's strike + the live
// Vantage-index gap + the index bias (bandlock.ts). Was: the raw strike, ~$90 under her chart - PAPER graded 8 of 8 held "wins" since Thu that lost
// on Kalshi, and took 89 longs to 6 shorts. kalshiStrike keeps Kalshi's own number (the last gate converts that one itself).
function chartStrike(ticker: string, raw: number | null): number | null {
  if (raw == null || !/^KXBTC15M-/.test(ticker)) return raw;
  // NO INDEX (fix530, Love Oct 30 2026 4:47 PM PT: "Remove the index. The Kalshi-target deduction that uses an index is not what I want. Delete it. Live price = one feed only. No index. No translation layer. No secondary source." + 5:14 PM: "i would like individual commands for individual elements"): the Oct 18 index-gap + bias translation is DELETED. The only translation left is her own
  // deduction (fix519, her words): her chart minus Kalshi's own number, measured at the window open, one feed.
  const o = (globalThis as any).__ktOff519?.btc;
  if (!o || !o.measured || Date.now() - Number(o.at) > 30 * 60000 || !Number.isFinite(Number(o.off))) return raw;
  return Math.round((raw + Number(o.off)) * 100) / 100;
}
export function mapMarket(raw: RawMarket): KalshiMarket {
  return {
    kalshiStrike: parseTarget(raw),
    ticker: raw.ticker ?? "",
    eventTicker: raw.event_ticker ?? "",
    title: raw.title ?? "",
    status: raw.status ?? "",
    target: chartStrike(raw.ticker ?? "", parseTarget(raw)),
    closeTime: raw.close_time ?? "",
    openTime: raw.open_time ?? "",
    // AN EMPTY BOOK IS NOT A 100C BID (fix291, Oct 26 ~3:10 PM PT, Love: "see what made that happen and fix it pls" - 3:00:13 PM the new BTC window's YES-ask side
    // was still empty, Kalshi reads that as yes_ask 0 / no_bid 1.00, and the paper card "sold" the fresh short at a fake 100c, which the live mirror followed):
    // a side's bid counts only while the other side has a real ask; otherwise it reads 0 (no bid), the same as any empty bid.
    yesBid: dollars(raw.no_ask_dollars) > 0 ? dollars(raw.yes_bid_dollars) : 0,
    yesAsk: dollars(raw.yes_ask_dollars),
    noBid: dollars(raw.yes_ask_dollars) > 0 ? dollars(raw.no_bid_dollars) : 0,
    noAsk: dollars(raw.no_ask_dollars),
    last: dollars(raw.last_price_dollars),
    volume: dollars(raw.volume_fp),
    result: raw.result === "yes" || raw.result === "no" ? raw.result : "",
  };
}

function pickLive(markets: RawMarket[]): RawMarket | null {
  const now = Date.now();
  const live = markets.filter((m) => {
    const open = Date.parse(m.open_time ?? "");
    const close = Date.parse(m.close_time ?? "");
    const status = (m.status ?? "").toLowerCase();
    if (status === "active" || status === "open") return true;
    if (Number.isFinite(open) && Number.isFinite(close) && open <= now && now < close) {
      return true;
    }
    return false;
  });
  const ranked = (live.length ? live : markets).slice().sort((a, b) => {
    const ay = Number.parseFloat(a.yes_ask_dollars ?? "");
    const by = Number.parseFloat(b.yes_ask_dollars ?? "");
    const ad = ay > 0 && ay < 1 ? Math.abs(ay - 0.5) : 1;
    const bd = by > 0 && by < 1 ? Math.abs(by - 0.5) : 1;
    if (ad !== bd) return ad - bd;
    const ac = Date.parse(a.close_time ?? "") || Number.MAX_SAFE_INTEGER;
    const bc = Date.parse(b.close_time ?? "") || Number.MAX_SAFE_INTEGER;
    return ac - bc;
  });
  return ranked[0] ?? null;
}

export function fifteenTicker(series: string, now = Date.now()): string {
  const step = 15 * 60 * 1000;
  const end = Math.ceil(now / step) * step;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "2-digit",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(end));
  const bit = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const stamp = `${bit("year")}${bit("month").toUpperCase()}${bit("day")}${bit("hour")}${bit("minute")}`;
  return `${series}-${stamp}-${bit("minute")}`;
}

export async function fetchMarket(ticker: string): Promise<KalshiMarket | null> {
  try {
    const data = await fetchJson<{ market?: RawMarket }>(`${BASE}/markets/${encodeURIComponent(ticker)}`);
    return data.market?.ticker ? mapMarket(data.market) : null;
  } catch {
    return null;
  }
}

// THE MARKET READ HOLDS (fix470, Love Oct 29 2026 2:40 PM PT: "yes, you can fix the kalshi"). At 1:47-1:57 PM and 2:07 PM PT main and rejection called BTC, but
// Kalshi was answering this Mac "429 too many requests" on about half its market reads; every read inside fetchSeriesMarket failed at once, the desk's market for BTC
// came back blank, and the copier waited out the window with no order tried (data/copy-waits.jsonl: market null). Market reading only - no rule, gate, price or size changes:
//   1. the same series asked for by several parts of the desk at once (ticker, scan, candles, mirror, leadlag) is read ONCE and shared, and reused for 1 s
//   2. a read that fails (429 or otherwise) is tried once more after 0.4 s
//   3. if it still fails, the last good read of THIS SAME window (same ticker, still open, under 30 s old) is used instead of a blank, so the copier keeps her window
const MK470: any = ((globalThis as any).__mk470 ||= { inflight: {}, fresh: {}, good: {} });
export async function fetchSeriesMarket(series: string): Promise<KalshiMarket | null> {
  const f = MK470.fresh[series];
  if (f && Date.now() - f.at < 1000) return f.m;
  if (MK470.inflight[series]) return MK470.inflight[series];
  const run = (async () => {
    let m: KalshiMarket | null = null;
    try { m = await fetchSeriesMarketRead470(series); } catch { m = null; }
    if (!m) { await new Promise((r) => setTimeout(r, 400)); try { m = await fetchSeriesMarketRead470(series); } catch { m = null; } }
    if (m) { try { (m as any).__readAt493 = Date.now(); } catch {} } // fix493 (Love Oct 29 2026 9:57 PM PT: "yes make the log and make it a cornerstone. its already supposed to exist"): stamp when this market read came back, so the order log shows a reused read's age
    if (m) { MK470.good[series] = { at: Date.now(), m }; MK470.fresh[series] = { at: Date.now(), m }; return m; }
    const g = MK470.good[series];
    if (g && Date.now() - g.at < 30000 && g.m?.ticker === fifteenTicker(series) && Date.parse(g.m.closeTime) > Date.now() + 30000) return g.m;
    return null;
  })();
  MK470.inflight[series] = run;
  try { return await run; } finally { if (MK470.inflight[series] === run) delete MK470.inflight[series]; }
}

async function fetchSeriesMarketRead470(series: string): Promise<KalshiMarket | null> {
  // THE WINDOW THAT IS ACTUALLY LIVE (Oct 16 ~12:35 AM PT, Love: "orders didn't go thru either, desk completely crashed").
  // Kalshi lists later gold windows as open too (KXGOLD15M-26OCT161515-15 tonight), and the picker below ranks by "ask
  // closest to 50c" - so whenever the live window's ask drifted off 50c the desk switched to an 11:15 AM ET market, and
  // the copier sat waiting for a ticker match that never came (her 12:30 gold short). Ask Kalshi for THIS window's own
  // ticker first; only if that read fails does the old list path run. Market selection only - no rule changes.
  try {
    const own = await fetchMarket(fifteenTicker(series));
    if (own && ["active", "open"].includes(String(own.status).toLowerCase()) && Date.parse(own.closeTime) > Date.now()) return own;
  } catch {
  }
  const openUrl = `${BASE}/markets?series_ticker=${encodeURIComponent(series)}&status=open&limit=10`;
  try {
    const open = await fetchJson<MarketsResponse>(openUrl);
    const picked = pickLive(open.markets ?? []);
    if (picked) return mapMarket(picked);
  } catch {
    // fall through to unfiltered
  }

  const anyUrl = `${BASE}/markets?series_ticker=${encodeURIComponent(series)}&limit=8`;
  const any = await fetchJson<MarketsResponse>(anyUrl);
  const picked = pickLive(any.markets ?? []);
  return picked ? mapMarket(picked) : null;
}
