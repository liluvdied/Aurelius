import type { AssetId, Candle, VwapFrame } from "./types";
import { chartCandles } from "./tv";
import { sortAsc } from "./vwap";

const COINBASE: Record<AssetId, { product: string; label: string }> = {
  btc: { product: "BTC-USD", label: "Coinbase BTC-USD" },
  gold: { product: "PAXG-USD", label: "Spot gold" },
  silver: { product: "XAG-USDT-SWAP", label: "Spot silver" },
};

const KRAKEN_BTC = "https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1";

async function fetchJson<T>(url: string, timeout = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) throw new Error(`tape ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function mapCoinbase(rows: number[][]): Candle[] {
  const out: Candle[] = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const [t, low, high, open, close, vol] = row;
    if (!Number.isFinite(close)) continue;
    out.push({
      t: Number(t),
      o: Number(open),
      h: Number(high),
      l: Number(low),
      c: Number(close),
      v: Number(vol) || 0,
    });
  }
  return sortAsc(out);
}

export async function coinbaseCandles(product: string): Promise<Candle[]> {
  const url = `https://api.exchange.coinbase.com/products/${product}/candles?granularity=60`;
  const rows = await fetchJson<number[][]>(url);
  if (!Array.isArray(rows)) throw new Error("coinbase shape");
  const mapped = mapCoinbase(rows);
  if (mapped.length < 20) throw new Error("coinbase short");
  return mapped;
}

async function krakenBtc(): Promise<Candle[]> {
  const body = await fetchJson<{
    error?: string[];
    result?: Record<string, (string | number)[][]>;
  }>(KRAKEN_BTC);
  const result = body.result ?? {};
  const key = Object.keys(result).find((k) => k !== "last");
  if (!key) throw new Error("kraken empty");
  const rows = result[key] ?? [];
  const out: Candle[] = [];
  for (const row of rows) {
    const t = Number(row[0]);
    const o = Number(row[1]);
    const h = Number(row[2]);
    const l = Number(row[3]);
    const c = Number(row[4]);
    const v = Number(row[6]);
    if (!Number.isFinite(c)) continue;
    out.push({ t, o, h, l, c, v: Number.isFinite(v) ? v : 0 });
  }
  return sortAsc(out);
}

export type AltBoard = {
  name: "ETH" | "SOL";
  product: string;
  spot: number;
  target: number | null;
  spark: number[];
  secondsLeft: number;
  pattern: string;
  side: "up" | "down" | null;
  note: string;
  vwap: number | null;
  frame: VwapFrame | null;
};

export async function altBoards(): Promise<AltBoard[]> {
  const { fetchSeriesMarket } = await import("./kalshi");
  const { computeVwap, detectPattern, sortAsc } = await import("./vwap");
  const pairs = [
    ["ETH", "ETH-USD", "KXETH15M"],
    ["SOL", "SOL-USD", "KXSOL15M"],
  ] as const;
  const out: AltBoard[] = [];
  for (const [name, product, series] of pairs) {
    const [tape, market] = await Promise.all([
      coinbaseCandles(product).catch(() => [] as Candle[]),
      fetchSeriesMarket(series).catch(() => null),
    ]);
    const candles = sortAsc(tape);
    const spot = candles[candles.length - 1]?.c ?? 0;
    const vwap = candles.length ? computeVwap(candles.slice(-60)) : null;
    const closeMs = market?.closeTime ? Date.parse(market.closeTime) : NaN;
    const secondsLeft = Number.isFinite(closeMs) ? Math.max(0, Math.floor((closeMs - Date.now()) / 1000)) : 0;
    const { closeByBand, shortBandOnTarget } = await import("./auto");
    const opened = secondsLeft >= 660 && vwap && spot > 0 ? closeByBand(name, spot, vwap.vwap, vwap.stdev) : null;
    const tapped = !opened?.side && candles.length ? detectPattern(candles, vwap) : null;
    const pattern = opened?.side ? opened : tapped;
    const side = pattern?.side === "up" || pattern?.side === "down" ? pattern.side : null;
    const target = market?.target ?? null;
    const held =
      side && vwap && target
        ? shortBandOnTarget(name, side, target, vwap.vwap, vwap.stdev, spot)
        : "";
    out.push({
      name,
      product,
      spot,
      target,
      spark: candles.slice(-80).map((c) => c.c),
      secondsLeft,
      pattern: pattern?.label || "No band interaction",
      side,
      note: held,
      vwap: vwap?.vwap ?? null,
      frame: vwap,
    });
  }
  return out;
}

export async function fetchCandles(asset: AssetId): Promise<{
  candles: Candle[];
  product: string;
}> {
  if (asset === "gold" || asset === "silver" || asset === "btc") {
    return chartCandles(asset);
  }
  const meta = COINBASE[asset];
  try {
    const candles = await coinbaseCandles(meta.product);
    return { candles, product: meta.label };
  } catch (err) {
    if (asset === "btc") {
      const candles = await krakenBtc();
      return { candles, product: "Kraken XBTUSD" };
    }
    throw err;
  }
}
