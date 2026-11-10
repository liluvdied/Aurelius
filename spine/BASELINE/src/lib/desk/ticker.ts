import { fetchSeriesMarket } from "./kalshi";
import { ASSET_META, type AssetId, type AssetSnapshot, type DeskSnapshot, type KalshiMarket } from "./types";

export type LiveSpots = {
  btc: number | null;
  gold: number | null;
  eth: number | null;
  sol: number | null;
  books: { btc: KalshiMarket | null; gold: KalshiMarket | null };
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
  return coinPrice("BTC-USD");
}

async function goldPrice(): Promise<number> {
  const body = await fetchJson<{
    data?: { last?: string; bidPx?: string; askPx?: string }[];
  }>("https://www.okx.com/api/v5/market/ticker?instId=XAU-USDT-SWAP");
  const row = body.data?.[0];
  const bid = Number(row?.bidPx);
  const ask = Number(row?.askPx);
  const last = Number(row?.last);
  const mid = Number.isFinite(bid) && Number.isFinite(ask) && bid > 0 && ask > 0 ? (bid + ask) / 2 : last;
  if (!Number.isFinite(mid) || mid < 1000) throw new Error("gold");
  return mid;
}

const QUOTE: Record<AssetId, () => Promise<number>> = {
  btc: btcPrice,
  gold: goldPrice,
};

let cache: { at: number; spots: LiveSpots } | null = null;
let booksAt = 0;
let books: LiveSpots["books"] = { btc: null, gold: null };

async function liveBooks(): Promise<LiveSpots["books"]> {
  if (Date.now() - booksAt < 1000) return books;
  const [btc, gold] = await Promise.allSettled([
    fetchSeriesMarket(ASSET_META.btc.series),
    fetchSeriesMarket(ASSET_META.gold.series),
  ]);
  books = {
    btc: btc.status === "fulfilled" ? btc.value : books.btc,
    gold: gold.status === "fulfilled" ? gold.value : books.gold,
  };
  booksAt = Date.now();
  return books;
}

export async function fetchLiveSpots(): Promise<LiveSpots> {
  if (cache && Date.now() - cache.at < 350) return cache.spots;
  const [btc, gold, eth, sol, nextBooks] = await Promise.all([
    Promise.allSettled([QUOTE.btc()]).then((r) => r[0]),
    Promise.allSettled([QUOTE.gold()]).then((r) => r[0]),
    Promise.allSettled([coinPrice("ETH-USD")]).then((r) => r[0]),
    Promise.allSettled([coinPrice("SOL-USD")]).then((r) => r[0]),
    liveBooks(),
  ]);
  const spots: LiveSpots = {
    btc: btc.status === "fulfilled" ? btc.value : (cache?.spots.btc ?? null),
    gold: gold.status === "fulfilled" ? gold.value : (cache?.spots.gold ?? null),
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
  if (!snap || !spots) return snap;
  return {
    ...snap,
    assets: {
      btc: applyBook(applySpot(snap.assets.btc, spots.btc), spots.books?.btc ?? null),
      gold: applyBook(applySpot(snap.assets.gold, spots.gold), spots.books?.gold ?? null),
    },
  };
}
