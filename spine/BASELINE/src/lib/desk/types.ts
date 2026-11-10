export type AssetId = "btc" | "gold";
export type Side = "up" | "down";
export type PatternKind = "tap_reject" | "break_retest" | "near_band" | "none";

export type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export type BandLevel = {
  multiplier: number;
  price: number;
};

export type VwapFrame = {
  vwap: number;
  stdev: number;
  twap: number;
  source: "vwap" | "twap";
  bands: BandLevel[];
  sample: number;
};

export type Pattern = {
  kind: PatternKind;
  side: Side | null;
  band: number | null;
  quality: number;
  label: string;
  reasons: string[];
};

export type KalshiMarket = {
  ticker: string;
  eventTicker: string;
  title: string;
  status: string;
  target: number | null;
  closeTime: string;
  openTime: string;
  yesBid: number;
  yesAsk: number;
  noBid: number;
  noAsk: number;
  last: number;
  volume: number;
  result: "yes" | "no" | "";
};

export type Print = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
};

export type Setup = {
  id: string;
  asset: AssetId;
  ticker: string;
  side: Side;
  pattern: Pattern;
  ask: number;
  multiple: number;
  localConviction: number;
  exitPct: number;
  holdToExpiry: boolean;
  reasons: string[];
  watchOnly: boolean;
  premium: boolean;
  throughTarget: boolean;
  clip?: number;
};

export type AssetSnapshot = {
  asset: AssetId;
  product: string;
  spot: number;
  close: number;
  target: number | null;
  delta: number | null;
  deltaBps: number | null;
  market: KalshiMarket | null;
  vwap1m: VwapFrame | null;
  vwap5m: VwapFrame | null;
  pattern1m: Pattern;
  pattern5m: Pattern;
  setup: Setup | null;
  spark: number[];
  sparkVwap: number[];
  lastPrints: Print[];
  secondsLeft: number;
  settlement: boolean;
  live: boolean;
};

export type DeskSnapshot = {
  at: string;
  assets: Record<AssetId, AssetSnapshot>;
  error?: string;
  kalshi?: { armed: boolean; cash: number | null };
  polymarket?: { armed: boolean; cash: number | null };
  sideLocks?: Record<string, Side>;
};

export type GrokCall = {
  at: string;
  setupId: string;
  ticker: string;
  side: Side | "pass";
  conviction: number;
  holdToExpiry: boolean;
  exitProfitPct: number;
  thesis: string;
  risks: string;
  pattern: string;
};

export type TradeSource = "paper" | "live";
export type TradeResult = "open" | "win" | "loss" | "exited";

export type Trade = {
  id: string;
  openedAt: string;
  closedAt: string | null;
  asset: AssetId;
  ticker: string;
  side: Side;
  source: TradeSource;
  setupId: string;
  autoFilled: boolean;
  probe?: boolean;
  patternLabel: string;
  stake: number;
  ask: number;
  multiple: number;
  contracts: number;
  result: TradeResult;
  payout: number | null;
  profit: number | null;
  exitPct: number | null;
  exitCash?: number | null;
  lowBid?: number | null;
  highBid?: number | null;
  holdToExpiry: boolean;
  conviction: number;
  notes: string;
  grokThesis: string;
  target: number | null;
  lastSpot: number | null;
  entryVwap?: number | null;
  orderId?: string;
  venue?: "kalshi" | "polymarket";
  runner?: boolean;
};

export type DeskSettings = {
  minMultiple: number;
  maxMultiple: number;
  stake: number;
  liveStake: number;
  autoPaper: boolean;
  autoGrok: boolean;
  defaultExitPct: number;
  minConviction: number;
  sound: boolean;
};

export const DEFAULT_SETTINGS: DeskSettings = {
  minMultiple: 1.34,
  maxMultiple: 4.5,
  stake: 10,
  liveStake: 33,
  autoPaper: true,
  autoGrok: true,
  defaultExitPct: 45,
  minConviction: 60,
  sound: true,
};

export const ASSET_META: Record<
  AssetId,
  { label: string; series: string; through: number; decimals: number }
> = {
  btc: { label: "BTC", series: "KXBTC15M", through: 400, decimals: 2 },
  gold: { label: "GOLD", series: "KXGOLD15M", through: 12, decimals: 2 },
};
