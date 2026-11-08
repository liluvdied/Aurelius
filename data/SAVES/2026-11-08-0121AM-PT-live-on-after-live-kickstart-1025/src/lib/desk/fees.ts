export function takerFee(price: number, contracts: number): number {
  if (!(price > 0 && price < 1) || !(contracts > 0)) return 0;
  const raw = 0.07 * contracts * price * (1 - price);
  return Math.ceil(raw * 100 - 1e-8) / 100;
}

export type ScaleMode = "cash" | "win" | "loss";

export type ScaleRow = {
  stake: number;
  contracts: number;
  price: number;
  exit: number;
  feeIn: number;
  feeOut: number;
  gross: number;
  net: number;
  capped: boolean;
};

export const SCALE_STAKES = [7.5, 10, 25, 50, 100, 250, 500, 1000];

export function scaleTrade(stake: number, multiple: number, exitPct: number, mode: ScaleMode): ScaleRow {
  const price = 1 / multiple;
  const contracts = stake / price;
  const feeIn = takerFee(price, contracts);
  if (mode === "loss") {
    return {
      stake,
      contracts,
      price,
      exit: 0,
      feeIn,
      feeOut: 0,
      gross: -stake,
      net: -(stake + feeIn),
      capped: false,
    };
  }
  if (mode === "win") {
    const gross = contracts - stake;
    return {
      stake,
      contracts,
      price,
      exit: 1,
      feeIn,
      feeOut: 0,
      gross,
      net: gross - feeIn,
      capped: false,
    };
  }
  const rawExit = price * (1 + exitPct);
  const capped = rawExit > 0.99;
  const exit = capped ? 0.99 : rawExit;
  const feeOut = takerFee(exit, contracts);
  const gross = contracts * exit - stake;
  return {
    stake,
    contracts,
    price,
    exit,
    feeIn,
    feeOut,
    gross,
    net: gross - feeIn - feeOut,
    capped,
  };
}
