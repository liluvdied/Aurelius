import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPrivateKey, sign, type KeyObject } from "node:crypto";
import type { KalshiMarket, Side } from "./types";

const ROOT = "https://api.polymarket.us";
const HEDGE_DOLLARS = 10;
const PRIMARY_DOLLARS = 25;
export const HEDGE_MULTIPLE = 8;

type BookLevel = { px?: { value?: string } };
type PolyMarket = {
  slug?: string;
  assetPriceTerms?: {
    horizon?: string;
    windowEnd?: string;
    priceToBeat?: { value?: string };
    asset?: { symbol?: string };
  };
};

let cachedKey: KeyObject | null = null;

function keyId(): string {
  return readFileSync("/workspace/.secrets/polymarket.id", "utf8").trim();
}

function privateKey(): KeyObject {
  if (cachedKey) return cachedKey;
  const seed = Buffer.from(readFileSync("/workspace/.secrets/polymarket.secret", "utf8").trim(), "base64").subarray(0, 32);
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
  cachedKey = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  return cachedKey;
}

export function polymarketArmed(): boolean {
  try {
    return keyId().length > 0 && Boolean(privateKey());
  } catch {
    return false;
  }
}

async function poly(method: string, path: string, query = "", body?: unknown): Promise<Response> {
  const timestamp = Date.now().toString();
  const signature = sign(null, Buffer.from(`${timestamp}${method}${path}`), privateKey()).toString("base64");
  return fetch(ROOT + path + query, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-PM-Access-Key": keyId(),
      "X-PM-Timestamp": timestamp,
      "X-PM-Signature": signature,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function polymarketCash(): Promise<number | null> {
  const res = await poly("GET", "/v1/account/balances");
  if (!res.ok) return null;
  const data = (await res.json()) as { balances?: { buyingPower?: number }[] };
  const n = data.balances?.[0]?.buyingPower;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export type PolyHolding = {
  slug: string;
  net: number;
  cost: number;
  avg: number;
};

export async function polymarketHoldings(): Promise<PolyHolding[]> {
  const res = await poly("GET", "/v1/portfolio/positions");
  if (!res.ok) return [];
  const data = (await res.json()) as {
    positions?: Record<
      string,
      {
        netPositionDecimal?: string;
        cost?: { value?: string };
        avgPx?: { value?: string };
        marketMetadata?: { slug?: string };
      }
    >;
  };
  return Object.entries(data.positions ?? {}).map(([slug, row]) => ({
    slug: row.marketMetadata?.slug || slug,
    net: Number.parseFloat(row.netPositionDecimal ?? "0") || 0,
    cost: Number.parseFloat(row.cost?.value ?? "") || 0,
    avg: Number.parseFloat(row.avgPx?.value ?? "") || 0,
  }));
}

export async function polymarketWindow(slug: string): Promise<{
  closed: boolean;
  downWon: boolean | null;
  beat: number | null;
  settlement: number | null;
} | null> {
  const res = await poly("GET", "/v1/markets", `?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    markets?: {
      closed?: boolean;
      outcomePrices?: string;
      assetPriceTerms?: { priceToBeat?: { value?: string }; settlementPrice?: { value?: string } };
    }[];
  };
  const market = data.markets?.[0];
  if (!market) return null;
  const beat = Number.parseFloat(market.assetPriceTerms?.priceToBeat?.value ?? "");
  const settlement = Number.parseFloat(market.assetPriceTerms?.settlementPrice?.value ?? "");
  let downWon: boolean | null = null;
  if (market.outcomePrices?.includes("[\"0\",\"1\"]") || market.outcomePrices?.includes('["0", "1"]') || market.outcomePrices === "[\"0\",\"1\"]") {
    downWon = true;
  } else if (market.outcomePrices?.includes("[\"1\",\"0\"]") || market.outcomePrices?.includes('["1", "0"]')) {
    downWon = false;
  } else if (market.closed && Number.isFinite(beat) && Number.isFinite(settlement)) {
    downWon = settlement < beat;
  }
  return {
    closed: Boolean(market.closed),
    downWon,
    beat: Number.isFinite(beat) ? beat : null,
    settlement: Number.isFinite(settlement) ? settlement : null,
  };
}

async function liveWindow(closesAt: string): Promise<{ slug: string; target: number | null } | null> {
  const end = Date.parse(closesAt);
  if (Number.isFinite(end)) {
    const startMs = end - 15 * 60 * 1000;
    const start = Math.floor(startMs / 1000);
    const d = new Date(startMs);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const day = d.toISOString().slice(0, 10);
    for (const slug of [`btc-updown-15m-${start}`, `cpc-btc-updown-15m-${day}-${hh}${mm}z`]) {
      const top = await bookTop(slug);
      if (top) return { slug, target: null };
    }
  }
  const res = await poly("GET", "/v1/markets", "?categories=crypto&search=updown&closed=false&limit=200");
  if (!res.ok) return null;
  const data = (await res.json()) as { markets?: PolyMarket[] };
  const close = Date.parse(closesAt);
  const now = Date.now();
  const hit = (data.markets ?? []).find((m) => {
    const terms = m.assetPriceTerms;
    if (terms?.horizon !== "15m" || terms.asset?.symbol !== "btc" || !m.slug) return false;
    const windowEnd = Date.parse(terms.windowEnd ?? "");
    const start = windowEnd - 15 * 60 * 1000;
    if (!(start <= now && now < windowEnd)) return false;
    return Number.isFinite(close) && Math.abs(windowEnd - close) < 3 * 60 * 1000;
  });
  if (!hit?.slug) return null;
  const beat = Number.parseFloat(hit.assetPriceTerms?.priceToBeat?.value ?? "");
  return { slug: hit.slug, target: Number.isFinite(beat) ? beat : null };
}

export async function btcStandIn(): Promise<KalshiMarket | null> {
  const startMs = Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000;
  const end = new Date(startMs + 15 * 60 * 1000).toISOString();
  const window = await liveWindow(end);
  if (!window) return null;
  const top = await bookTop(window.slug);
  if (!top) return null;
  const yesAsk = top.ask;
  const yesBid = top.bid;
  return {
    ticker: window.slug,
    eventTicker: window.slug,
    title: "BTC Up or Down 15m",
    status: "open",
    target: window.target,
    closeTime: end,
    openTime: new Date(startMs).toISOString(),
    yesBid,
    yesAsk,
    noBid: Math.round((1 - yesAsk) * 100) / 100,
    noAsk: Math.round((1 - yesBid) * 100) / 100,
    last: yesAsk,
    volume: 0,
    result: "",
  };
}

function pxOf(level: unknown): number {
  if (typeof level === "number") return level;
  if (!level || typeof level !== "object") return NaN;
  const row = level as { value?: string; px?: { value?: string } };
  return Number.parseFloat(row.px?.value ?? row.value ?? "");
}

export async function bookTop(slug: string): Promise<{ bid: number; ask: number } | null> {
  const res = await poly("GET", `/v1/markets/${slug}/bbo`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    marketData?: { state?: string; currentPx?: { value?: string }; bestBid?: unknown; bestAsk?: unknown };
  };
  const md = data.marketData;
  if (!md || md.state === "MARKET_STATE_EXPIRED" || md.state === "MARKET_STATE_CLOSED") return null;
  let bid = pxOf(md.bestBid);
  let ask = pxOf(md.bestAsk);
  const mid = Number.parseFloat(md.currentPx?.value ?? "");
  if (!(bid > 0 && bid < 1) && mid > 0 && mid < 1) bid = mid;
  if (!(ask > 0 && ask < 1) && mid > 0 && mid < 1) ask = mid;
  if (!(bid > 0 && bid < 1) || !(ask > 0 && ask < 1)) return null;
  return { bid, ask };
}

export async function markSide(
  slug: string,
  side: Side,
  contracts: number,
  stake: number,
): Promise<{ bid: number; profit: number; pct: number } | null> {
  const top = await bookTop(slug);
  if (!top || !(contracts > 0) || !(stake > 0)) return null;
  const bid = side === "up" ? top.bid : Math.round((1 - top.ask) * 100) / 100;
  if (!(bid > 0 && bid < 1)) return null;
  const profit = contracts * bid - stake;
  return { bid, profit, pct: profit / stake };
}

export async function sellSide(
  side: Side,
  slug: string,
  quantity: number,
): Promise<{ filled: number; price: number } | null> {
  const top = await bookTop(slug);
  if (!top) return null;
  const bid = side === "up" ? top.bid : Math.round((1 - top.ask) * 100) / 100;
  if (!(bid >= 0.02) || !(quantity >= 0.01)) return null;
  const price = Math.max(0.01, Math.round((bid - 0.01) * 100) / 100);
  const qty = Math.floor(quantity * 100) / 100;
  const res = await poly("POST", "/v1/orders", "", {
    marketSlug: slug,
    intent: side === "up" ? "ORDER_INTENT_SELL_LONG" : "ORDER_INTENT_SELL_SHORT",
    type: "ORDER_TYPE_LIMIT",
    price: { value: price.toFixed(2), currency: "USD" },
    quantity: qty,
    tif: "TIME_IN_FORCE_IMMEDIATE_OR_CANCEL",
    synchronousExecution: true,
    manualOrderIndicator: "MANUAL_ORDER_INDICATOR_AUTOMATED",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    order?: { cumQuantity?: number };
    executions?: { order?: { cumQuantity?: number } }[];
  };
  const orders = (data.executions ?? []).map((entry) => entry.order).filter((order) => order != null);
  const order = orders.reduce<(typeof orders)[number] | undefined>((best, next) => {
    return Number(next?.cumQuantity ?? 0) >= Number(best?.cumQuantity ?? 0) ? next : best;
  }, data.order);
  const filled = Number(order?.cumQuantity ?? 0);
  if (!(filled > 0)) return null;
  return { filled, price };
}

async function askFor(slug: string, side: Side): Promise<number | null> {
  const top = await bookTop(slug);
  if (!top) return null;
  if (side === "up") return top.ask > 0 && top.ask < 1 ? top.ask : null;
  const down = Math.round((1 - top.bid) * 100) / 100;
  return down > 0 && down < 1 ? down : null;
}

export type HedgeFill = {
  orderId: string;
  filled: number;
  price: number;
  slug: string;
  target: number | null;
};

export async function hedgeOpposite(side: Side, closesAt: string): Promise<HedgeFill | null> {
  return takeSide(side, closesAt, HEDGE_DOLLARS, 1 / HEDGE_MULTIPLE);
}

const polyWindows = globalThis as { __aureliusPolyWindows?: Set<string> };

function claimWindow(slug: string): boolean {
  polyWindows.__aureliusPolyWindows ??= new Set();
  if (polyWindows.__aureliusPolyWindows.has(slug)) return false;
  polyWindows.__aureliusPolyWindows.add(slug);
  return true;
}

function releaseWindow(slug: string) {
  polyWindows.__aureliusPolyWindows?.delete(slug);
}

export async function takeSide(
  side: Side,
  closesAt: string,
  dollars = PRIMARY_DOLLARS,
  maxAsk = 0.74,
): Promise<HedgeFill | null> {
  const cash = await polymarketCash();
  if (cash == null || cash < dollars) return null;
  const window = await liveWindow(closesAt);
  if (!window) return null;
  if (!claimWindow(window.slug)) return null;
  try {
    const quoted = await askFor(window.slug, side);
    if (quoted == null || quoted < 0.08 || quoted > maxAsk) {
      releaseWindow(window.slug);
      return null;
    }
    const price = Math.min(0.9, Math.round((quoted + 0.03) * 100) / 100);
    const quantity = Math.floor((dollars / price) * 100) / 100;
    if (!(quantity >= 0.01) || quantity * price > dollars + 0.001) {
      releaseWindow(window.slug);
      return null;
    }
    const res = await poly("POST", "/v1/orders", "", {
      marketSlug: window.slug,
      intent: side === "up" ? "ORDER_INTENT_BUY_LONG" : "ORDER_INTENT_BUY_SHORT",
      type: "ORDER_TYPE_LIMIT",
      price: { value: price.toFixed(2), currency: "USD" },
      quantity,
      tif: "TIME_IN_FORCE_IMMEDIATE_OR_CANCEL",
      synchronousExecution: true,
      manualOrderIndicator: "MANUAL_ORDER_INDICATOR_AUTOMATED",
    });
    if (!res.ok) {
      releaseWindow(window.slug);
      const text = await res.text();
      throw new Error(text.slice(0, 180));
    }
    const data = (await res.json()) as {
      id?: string;
      order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } };
      executions?: { order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } } }[];
    };
    const orders = (data.executions ?? []).map((entry) => entry.order).filter((order) => order != null);
    const order = orders.reduce<(typeof orders)[number] | undefined>((best, next) => {
      return Number(next?.cumQuantity ?? 0) >= Number(best?.cumQuantity ?? 0) ? next : best;
    }, data.order);
    const filled = Number(order?.cumQuantity ?? 0);
    const orderId = order?.id ?? data.id;
    const avg = Number.parseFloat(order?.avgPx?.value ?? "");
    const paid = avg > 0 && avg < 1 ? avg : price;
    if (!orderId || !(filled > 0)) {
      releaseWindow(window.slug);
      return null;
    }
    return { orderId, filled, price: paid, slug: window.slug, target: window.target };
  } catch (err) {
    releaseWindow(window.slug);
    throw err;
  }
}

const HOUR_PATH = join(process.cwd(), "data", "poly-hour.json");

function hourSlugs(): string[] {
  try {
    const row = JSON.parse(readFileSync(HOUR_PATH, "utf8")) as { slugs?: string[] };
    return Array.isArray(row.slugs) ? row.slugs : [];
  } catch {
    return [];
  }
}

function rememberHour(slug: string) {
  const slugs = [...new Set([slug, ...hourSlugs()])].slice(0, 48);
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(HOUR_PATH, JSON.stringify({ slugs }));
}

export async function upcomingHour(): Promise<{ slug: string; target: number | null; closesAt: string } | null> {
  const res = await poly("GET", "/v1/markets", "?categories=crypto&search=updown&closed=false&limit=200");
  if (!res.ok) return null;
  const data = (await res.json()) as { markets?: PolyMarket[] };
  const now = Date.now();
  const taken = new Set(hourSlugs());
  const fresh = (data.markets ?? [])
    .map((market) => {
      const terms = market.assetPriceTerms;
      const end = Date.parse(terms?.windowEnd ?? "");
      const symbol = (terms?.asset?.symbol ?? "").toLowerCase();
      if (terms?.horizon !== "1h" || symbol !== "btc" || !market.slug || !Number.isFinite(end)) return null;
      if (taken.has(market.slug)) return null;
      const start = end - 60 * 60 * 1000;
      const left = end - now;
      const until = start - now;
      if (left < 50 * 60 * 1000) return null;
      if (until > 12 * 60 * 1000) return null;
      const beat = Number.parseFloat(terms?.priceToBeat?.value ?? "");
      return {
        slug: market.slug,
        target: Number.isFinite(beat) && beat > 0 ? beat : null,
        closesAt: new Date(end).toISOString(),
        start,
      };
    })
    .filter((row): row is { slug: string; target: number | null; closesAt: string; start: number } => row != null)
    .sort((a, b) => a.start - b.start);
  const hour = fresh[0];
  if (!hour) return null;
  return { slug: hour.slug, target: hour.target, closesAt: hour.closesAt };
}

export async function buySlug(
  side: Side,
  slug: string,
  dollars: number,
  maxAsk: number,
  target: number | null,
): Promise<HedgeFill | null> {
  if (hourSlugs().includes(slug)) return null;
  const cash = await polymarketCash();
  if (cash == null || cash < dollars) return null;
  if (!claimWindow(slug)) return null;
  try {
    const quoted = await askFor(slug, side);
    if (quoted == null || quoted < 0.08 || quoted > maxAsk) {
      releaseWindow(slug);
      return null;
    }
    const price = Math.min(0.9, Math.round((quoted + 0.02) * 100) / 100);
    const quantity = Math.floor((dollars / price) * 100) / 100;
    if (!(quantity >= 0.01) || quantity * price > dollars + 0.001) {
      releaseWindow(slug);
      return null;
    }
    const res = await poly("POST", "/v1/orders", "", {
      marketSlug: slug,
      intent: side === "up" ? "ORDER_INTENT_BUY_LONG" : "ORDER_INTENT_BUY_SHORT",
      type: "ORDER_TYPE_LIMIT",
      price: { value: price.toFixed(2), currency: "USD" },
      quantity,
      tif: "TIME_IN_FORCE_IMMEDIATE_OR_CANCEL",
      synchronousExecution: true,
      manualOrderIndicator: "MANUAL_ORDER_INDICATOR_AUTOMATED",
    });
    if (!res.ok) {
      releaseWindow(slug);
      return null;
    }
    const data = (await res.json()) as {
      id?: string;
      order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } };
      executions?: { order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } } }[];
    };
    const orders = (data.executions ?? []).map((entry) => entry.order).filter((order) => order != null);
    const order = orders.reduce<(typeof orders)[number] | undefined>((best, next) => {
      return Number(next?.cumQuantity ?? 0) >= Number(best?.cumQuantity ?? 0) ? next : best;
    }, data.order);
    const filled = Number(order?.cumQuantity ?? 0);
    const orderId = order?.id ?? data.id;
    const avg = Number.parseFloat(order?.avgPx?.value ?? "");
    const paid = avg > 0 && avg < 1 ? avg : price;
    if (!orderId || !(filled > 0)) {
      releaseWindow(slug);
      return null;
    }
    rememberHour(slug);
    return { orderId, filled, price: paid, slug, target };
  } catch (err) {
    releaseWindow(slug);
    throw err;
  }
}
