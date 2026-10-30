import { fetchSeriesMarket } from "./kalshi";
import { chartCandles, chartQuote } from "./tv";
import { ASSET_META, type AssetId, type AssetSnapshot, type DeskSnapshot, type KalshiMarket } from "./types";

export type LiveSpots = {
  btc: number | null;
  gold: number | null;
  silver: number | null;
  eth: number | null;
  sol: number | null;
  books: { btc: KalshiMarket | null; gold: KalshiMarket | null; silver: KalshiMarket | null };
};

async function fetchJson<T>(url: string, init?: RequestInit, timeout = 5000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "AureliusDesk/1.0",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`tape ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function coinPrice(product: string): Promise<number> {
  const body = await fetchJson<{ price?: string }>(
    `https://api.exchange.coinbase.com/products/${product}/ticker`,
  );
  const n = Number(body.price);
  if (!Number.isFinite(n) || n <= 0) throw new Error(product);
  return n;
}

async function btcPrice(): Promise<number> {
  const tape = await chartCandles("btc");
  const last = tape.candles[tape.candles.length - 1]?.c ?? 0;
  if (!(last > 0)) throw new Error("btc");
  return last;
}

async function goldPrice(): Promise<number> {
  // GOLD SPOT FROM THE CHART (Oct 7, Love: "she longed into a band it hadn't broken thru yet"): TradingView's quote for
  // TVC:GOLD freezes after the 2-3 PM PT daily break (stuck at 4110.45 for 108 min today, 4164.54 for 165 min yesterday)
  // while the TVC chart itself keeps printing. With a frozen spot the band-at-target check thought price was already
  // through the 5m purple. Spot now = the live TVC 1-minute candle (the chart her lines come from); the quote is backup.
  try {
    const nav = await import("./nav");
    const lc = nav.liveClose("gold");
    if (lc) return lc;
  } catch {
  }
  try {
    return await chartQuote("TVC:GOLD");
  } catch {
    return chartQuote("OANDA:XAUUSD");
  }
}

async function silverPrice(): Promise<number> {
  try {
    return await chartQuote("OANDA:XAGUSD");
  } catch {
    const tape = await chartCandles("silver");
    const last = tape.candles[tape.candles.length - 1]?.c ?? 0;
    if (!(last > 0)) throw new Error("silver");
    return last;
  }
}

const QUOTE: Record<AssetId, () => Promise<number>> = {
  btc: btcPrice,
  gold: goldPrice,
  silver: silverPrice,
};

let cache: { at: number; spots: LiveSpots } | null = null;
let booksAt = 0;
let books: LiveSpots["books"] = { btc: null, gold: null, silver: null };

async function liveBooks(): Promise<LiveSpots["books"]> {
  if (Date.now() - booksAt < 1000) return books;
  const [btc, gold, silver] = await Promise.allSettled([
    fetchSeriesMarket(ASSET_META.btc.series),
    fetchSeriesMarket(ASSET_META.gold.series),
    fetchSeriesMarket(ASSET_META.silver.series),
  ]);
  books = {
    btc: btc.status === "fulfilled" ? btc.value : books.btc,
    gold: gold.status === "fulfilled" ? gold.value : books.gold,
    silver: silver.status === "fulfilled" ? silver.value : books.silver,
  };
  booksAt = Date.now();
  return books;
}

export async function fetchLiveSpots(): Promise<LiveSpots> {
  if (cache && Date.now() - cache.at < 350) return cache.spots;
  const [btc, gold, silver, eth, sol, nextBooks] = await Promise.all([
    Promise.allSettled([QUOTE.btc()]).then((r) => r[0]),
    Promise.allSettled([QUOTE.gold()]).then((r) => r[0]),
    Promise.allSettled([QUOTE.silver()]).then((r) => r[0]),
    Promise.allSettled([coinPrice("ETH-USD")]).then((r) => r[0]),
    Promise.allSettled([coinPrice("SOL-USD")]).then((r) => r[0]),
    liveBooks(),
  ]);
  const spots: LiveSpots = {
    btc: btc.status === "fulfilled" ? btc.value : (cache?.spots.btc ?? null),
    gold: gold.status === "fulfilled" ? gold.value : (cache?.spots.gold ?? null),
    silver: silver.status === "fulfilled" ? silver.value : (cache?.spots.silver ?? null),
    eth: eth.status === "fulfilled" ? eth.value : (cache?.spots.eth ?? null),
    sol: sol.status === "fulfilled" ? sol.value : (cache?.spots.sol ?? null),
    books: nextBooks,
  };
  cache = { at: Date.now(), spots };
  return spots;
}

export function applySpot(asset: AssetSnapshot, spot: number | null): AssetSnapshot {
  if (spot == null || !Number.isFinite(spot) || spot <= 0) return asset;
  const delta = asset.target != null ? spot - asset.target : null;
  const deltaBps = delta != null && asset.target ? (delta / asset.target) * 10000 : null;
  return { ...asset, spot, delta, deltaBps };
}

function applyBook(asset: AssetSnapshot, book: KalshiMarket | null): AssetSnapshot {
  if (!book || !asset.market || asset.market.ticker !== book.ticker) return asset;
  return {
    ...asset,
    market: {
      ...asset.market,
      yesBid: book.yesBid,
      yesAsk: book.yesAsk,
      noBid: book.noBid,
      noAsk: book.noAsk,
      last: book.last,
    },
  };
}

export function overlayDesk(
  snap: DeskSnapshot | undefined,
  spots: LiveSpots | undefined,
): DeskSnapshot | undefined {
  if (!snap) return snap;
  const assets = { ...snap.assets };
  if (spots && assets.btc) assets.btc = applyBook(applySpot(assets.btc, spots.btc), spots.books?.btc ?? null);
  if (spots && assets.gold) assets.gold = applyBook(applySpot(assets.gold, spots.gold), spots.books?.gold ?? null);
  if (spots && assets.silver) assets.silver = applyBook(applySpot(assets.silver, spots.silver), spots.books?.silver ?? null);
  return { ...snap, assets };
}
