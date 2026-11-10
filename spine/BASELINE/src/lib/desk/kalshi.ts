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

export function mapMarket(raw: RawMarket): KalshiMarket {
  return {
    ticker: raw.ticker ?? "",
    eventTicker: raw.event_ticker ?? "",
    title: raw.title ?? "",
    status: raw.status ?? "",
    target: parseTarget(raw),
    closeTime: raw.close_time ?? "",
    openTime: raw.open_time ?? "",
    yesBid: dollars(raw.yes_bid_dollars),
    yesAsk: dollars(raw.yes_ask_dollars),
    noBid: dollars(raw.no_bid_dollars),
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
