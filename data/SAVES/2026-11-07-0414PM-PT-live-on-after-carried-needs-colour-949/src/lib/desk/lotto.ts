// LOTTO LAB (Love, 2026-10-01). Paper only, never sends an order, never touches her model.
//
// Idea: when price is stretched OUT OF BAND (2σ or more from VWAP), buy the cheap snap-back
// side for $5 and sell into a violent move, instead of waiting for the target.
//   Above +2σ -> short (buy NO).  Below -2σ -> long (buy YES).
//   Only contracts paying 3x to 20x. One ticket per window per side. Not in the last 2 minutes.
// Each ticket is scored five ways at once, using the REAL Kalshi bid (what you could actually sell for):
//   sell at +50%, +100%, +200%, +300%, or hold to the bell.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const LOTTO_STAKE = 5;
export const LOTTO_EXITS = [50, 100, 200, 300] as const;
const MIN_X = 3;
const MAX_X = 20;
const MIN_SIGMA = 2;

export type LottoTicket = {
  id: string;
  at: string;
  asset: string;
  ticker: string;
  side: "up" | "down";
  sigma: number; // how far out of band, in σ (signed)
  spot: number;
  vwap: number;
  stdev: number;
  target: number | null;
  secondsLeft: number;
  ask: number;
  multiple: number;
  peakBid: number;
  peakPct: number;
  exits: Record<string, number | null>; // "+100" -> bid it sold at, null = never reached
  result: "open" | "win" | "loss";
  profits: Record<string, number> | null; // "+100" | "hold" -> $ on a $5 ticket
};

type AssetLike = {
  spot: number;
  target: number | null;
  secondsLeft: number;
  market: { ticker: string; yesAsk: number; noAsk: number; yesBid: number; noBid: number } | null;
  vwap1m: { vwap: number; stdev: number } | null;
  vwap5m: { vwap: number; stdev: number } | null;
};

const FILE = () => join(process.cwd(), "data", "lotto-lab.json");
const g = globalThis as unknown as { __lottoSettling?: boolean };

function readRows(): LottoTicket[] {
  try {
    const rows = JSON.parse(readFileSync(FILE(), "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
function writeRows(rows: LottoTicket[]) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(FILE(), JSON.stringify(rows.slice(0, 800), null, 1));
  } catch {
    // the lab must never stop the desk
  }
}
export function listLotto(): LottoTicket[] {
  return readRows();
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Called every engine tick. Opens tickets when price is out of band, tracks the best bid on open ones. */
export function lottoTick(assets: Record<string, AssetLike> | null | undefined) {
  if (!assets) return;
  let rows: LottoTicket[] | null = null;
  let changed = false;
  for (const id of ["btc", "gold"]) {
    const a = assets[id];
    const m = a?.market;
    if (!a || !(a.spot > 0) || !m?.ticker) continue;
    rows = rows || readRows();
    // 1. Track open tickets on this window.
    for (const r of rows) {
      if (r.result !== "open" || r.ticker !== m.ticker) continue;
      const bid = r.side === "up" ? m.yesBid : m.noBid;
      if (!(bid > 0)) continue;
      if (bid > r.peakBid) {
        r.peakBid = bid;
        r.peakPct = Math.round((bid / r.ask - 1) * 100);
        changed = true;
      }
      for (const pct of LOTTO_EXITS) {
        const k = `+${pct}`;
        if (r.exits[k] == null && bid >= r.ask * (1 + pct / 100)) {
          r.exits[k] = bid;
          changed = true;
        }
      }
    }
    // 2. Open a new ticket if price is out of band.
    const frame = a.vwap1m?.vwap ? a.vwap1m : a.vwap5m;
    if (!frame || !(frame.vwap > 0) || !(frame.stdev > 0) || !(a.secondsLeft > 120)) continue;
    const sigma = (a.spot - frame.vwap) / frame.stdev;
    if (Math.abs(sigma) < MIN_SIGMA) continue;
    const side: "up" | "down" = sigma > 0 ? "down" : "up";
    const ask = side === "up" ? m.yesAsk : m.noAsk;
    if (!(ask > 0) || 1 / ask < MIN_X || 1 / ask > MAX_X) continue;
    const tid = `${m.ticker}:${side}`;
    if (rows.some((r) => r.id === tid)) continue;
    const bid = side === "up" ? m.yesBid : m.noBid;
    rows.unshift({
      id: tid,
      at: new Date().toISOString(),
      asset: id,
      ticker: m.ticker,
      side,
      sigma: r2(sigma),
      spot: a.spot,
      vwap: r2(frame.vwap),
      stdev: r2(frame.stdev),
      target: a.target,
      secondsLeft: Math.round(a.secondsLeft),
      ask,
      multiple: r2(1 / ask),
      peakBid: bid > 0 ? bid : 0,
      peakPct: bid > 0 ? Math.round((bid / ask - 1) * 100) : -100,
      exits: Object.fromEntries(LOTTO_EXITS.map((p) => [`+${p}`, null])),
      result: "open",
      profits: null,
    });
    changed = true;
  }
  if (changed && rows) writeRows(rows);
}

/** Settle closed windows with Kalshi's real result and score every exit rule. */
export async function lottoSettle(result: (ticker: string) => Promise<"yes" | "no" | null>) {
  if (g.__lottoSettling) return;
  g.__lottoSettling = true;
  try {
    const rows = readRows();
    let changed = false;
    for (const r of rows) {
      if (r.result !== "open") continue;
      const res = await result(r.ticker).catch(() => null);
      if (!res) continue;
      const won = (r.side === "up" && res === "yes") || (r.side === "down" && res === "no");
      const count = LOTTO_STAKE / r.ask;
      const hold = r2(won ? count - LOTTO_STAKE : -LOTTO_STAKE);
      const profits: Record<string, number> = { hold };
      for (const pct of LOTTO_EXITS) {
        const k = `+${pct}`;
        const sold = r.exits[k];
        profits[k] = sold != null ? r2(count * sold - LOTTO_STAKE) : hold;
      }
      r.result = won ? "win" : "loss";
      r.profits = profits;
      changed = true;
    }
    if (changed) writeRows(rows);
  } finally {
    g.__lottoSettling = false;
  }
}
