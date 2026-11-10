import { fetchCandles } from "./candles";
import { goldBookClosed } from "./hours";
import { fetchSeriesMarket } from "./kalshi";
import { buildSetup } from "./setup";
import {
  ASSET_META,
  DEFAULT_SETTINGS,
  type AssetId,
  type AssetSnapshot,
  type DeskSettings,
  type DeskSnapshot,
  type Pattern,
} from "./types";
import { noteEvent } from "./memory";
import { bandInWay, closeByBand, brokeUnder, closedThrough } from "./auto";
import { readySpine } from "./spine-ready";
import { computeVwap, bandRun, detectPattern, resample5m, sortAsc } from "./vwap";

const EMPTY_PATTERN: Pattern = {
  kind: "none",
  side: null,
  band: null,
  quality: 0,
  label: "No band interaction",
  reasons: ["Waiting on tape."],
};

type Cache = { at: number; snap: DeskSnapshot };
let cache: Cache | null = null;
const KALSHI_BACK = Date.parse("2026-09-24T09:00:00Z");
const TTL = 5000;

async function scanAsset(asset: AssetId, settings: DeskSettings): Promise<AssetSnapshot> {
  const meta = ASSET_META[asset];
  const [marketRes, tapeRes] = await Promise.allSettled([
    fetchSeriesMarket(meta.series),
    fetchCandles(asset),
  ]);

  let market = marketRes.status === "fulfilled" ? marketRes.value : null;
  const tape = tapeRes.status === "fulfilled" ? tapeRes.value : null;
  const candles = tape ? sortAsc(tape.candles) : [];
  const last = candles[candles.length - 1];
  const spot = last?.c ?? 0;

  const c5 = candles.length ? resample5m(candles) : [];
  const recent = candles.slice(-60);
  const vwap1m = recent.length ? computeVwap(recent) : null;
  const vwap5m = c5.length ? computeVwap(c5.slice(-12)) : null;
  let pattern1m = candles.length ? detectPattern(candles, vwap1m) : EMPTY_PATTERN;
  const pattern5m = c5.length ? detectPattern(c5, vwap5m) : EMPTY_PATTERN;

  const kalshiLive =
    Boolean(market?.closeTime) &&
    (market!.status === "active" || market!.status === "open") &&
    Date.parse(market!.closeTime) > Date.now();
  if (asset === "btc" && !kalshiLive && Date.now() < KALSHI_BACK) {
    try {
      const poly = await import("./poly-live.server");
      const stand = await poly.btcStandIn();
      if (stand) market = stand;
    } catch {
      // Kalshi is dark and Polymarket had no window. Try again next pass.
    }
  }

  const closeMs = market?.closeTime ? Date.parse(market.closeTime) : NaN;
  const secondsLeft = Number.isFinite(closeMs)
    ? Math.max(0, Math.floor((closeMs - Date.now()) / 1000))
    : 0;
  if (vwap1m && spot > 0) {
    const broke = brokeUnder(candles, vwap1m.vwap, vwap1m.stdev, spot, asset);
    const crossed = closedThrough(candles, vwap1m.vwap, vwap1m.stdev, spot, asset);
    const opened = closeByBand(asset, spot, vwap1m.vwap, vwap1m.stdev);
    const strike = market?.target ?? 0;
    const spine = readySpine(asset, candles, vwap1m.vwap, vwap1m.stdev, spot, strike);
    const long = crossed?.side === "up" ? crossed : opened?.side === "up" ? opened : null;
    const longCross = Boolean(long) && spot < vwap1m.vwap && strike > vwap1m.vwap;
    if (asset === "btc" || asset === "gold" || asset === "silver") pattern1m = spine ?? EMPTY_PATTERN;
    else if (spine) pattern1m = spine;
    else if (long && !longCross) pattern1m = long;
    else if (broke?.side) pattern1m = broke;
    else if (crossed?.side) pattern1m = crossed;
    else if (opened?.side) pattern1m = opened;
    if (pattern1m.side && bandInWay(pattern1m.side, spot, vwap1m.vwap, vwap1m.stdev, asset)) pattern1m = EMPTY_PATTERN;
  }
  const target = market?.target ?? null;
  const delta = target != null && spot > 0 ? spot - target : null;
  const deltaBps = delta != null && target ? (delta / target) * 10000 : null;
  const live =
    Boolean(market) &&
    (market!.status === "active" || market!.status === "open") &&
    secondsLeft > 0;

  let setup = buildSetup({
    asset,
    market,
    pattern1m,
    pattern5m,
    secondsLeft,
    delta,
    settings,
  });

  if (setup && setup.pattern.kind !== "tap_reject" && (asset === "btc" || asset === "gold")) {
    const run = bandRun(candles, vwap1m);
    if (run.violent && run.bands < 2) {
      const name = asset === "btc" ? "Bitcoin" : "Gold";
      const way = run.direction === "down" ? "selling" : "buying";
      const reason = `${name} is ${way} through the bands. Letting it clear two before an entry.`;
      setup = {
        ...setup,
        watchOnly: true,
        reasons: [reason, ...setup.reasons],
      };
      if (market?.ticker) {
        noteEvent({
          id: "knife-wait",
          asset,
          ticker: market.ticker,
          note: `${reason} ${run.bands} bands so far.`,
        });
      }
    }
  }

  if (asset === "gold" && goldBookClosed() && setup) {
    setup = {
      ...setup,
      watchOnly: true,
      localConviction: 0,
      reasons: ["Gold book is closed 2:00–3:00 PM PT. No new fills until 3."],
    };
  }

  const sparkSrc = candles.slice(-32);
  const spark = sparkSrc.map((c) => c.c).filter((n) => n > 0);
  const sparkVwap = sparkSrc.map(() => vwap1m?.vwap ?? spot);
  const lastPrints = candles.slice(-8).map((c) => ({
    t: c.t,
    o: c.o,
    h: c.h,
    l: c.l,
    c: c.c,
  }));

  return {
    asset,
    product: tape?.product ?? "tape unavailable",
    spot,
    close: last?.c ?? spot,
    target,
    delta,
    deltaBps,
    market,
    vwap1m,
    vwap5m,
    pattern1m,
    pattern5m,
    setup,
    spark,
    sparkVwap,
    lastPrints,
    secondsLeft,
    settlement: secondsLeft > 0 && secondsLeft <= 60,
    live,
  };
}

const IDLE: AssetSnapshot = {
  asset: "btc",
  product: "",
  spot: 0,
  close: 0,
  target: null,
  delta: null,
  deltaBps: null,
  market: null,
  vwap1m: null,
  vwap5m: null,
  pattern1m: EMPTY_PATTERN,
  pattern5m: EMPTY_PATTERN,
  setup: null,
  spark: [],
  sparkVwap: [],
  lastPrints: [],
  secondsLeft: 0,
  settlement: false,
  live: false,
};

export async function scanDesk(settings: DeskSettings = DEFAULT_SETTINGS): Promise<DeskSnapshot> {
  if (cache && Date.now() - cache.at < TTL) return cache.snap;

  const [btc, gold] = await Promise.allSettled([
    scanAsset("btc", settings),
    scanAsset("gold", settings),
  ]);

  const errors: string[] = [];
  const assets = {
    btc: btc.status === "fulfilled" ? btc.value : { ...IDLE, asset: "btc" as const },
    gold: gold.status === "fulfilled" ? gold.value : { ...IDLE, asset: "gold" as const },
  };
  if (btc.status === "rejected") errors.push(`BTC: ${String(btc.reason)}`);
  if (gold.status === "rejected") errors.push(`GOLD: ${String(gold.reason)}`);

  const snap: DeskSnapshot = {
    at: new Date().toISOString(),
    assets,
    error: errors.length ? errors.join(" · ") : undefined,
  };
  cache = { at: Date.now(), snap };
  return snap;
}
