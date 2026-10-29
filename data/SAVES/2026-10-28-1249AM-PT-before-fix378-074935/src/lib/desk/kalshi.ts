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
  const G = globalThis as any, K = G.__kGap, bias = Number(G.__indexBias?.btc ?? 30);
  if (!K || !K.at || Date.now() - Number(K.at) > 30 * 60000 || !Number.isFinite(Number(K.gap))) return raw;
  return Math.round((raw + Number(K.gap) + bias) * 100) / 100;
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

export async function fetchSeriesMarket(series: string): Promise<KalshiMarket | null> {
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
