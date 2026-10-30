import { bidOf } from "./format";
import type { AssetSnapshot, Setup, Side, Trade } from "./types";

export function profitPrice(trade: Trade, pct: number): number {
  const qty = trade.contracts > 0 ? trade.contracts : trade.ask > 0 ? trade.stake / trade.ask : 0;
  if (!(qty > 0) || !(trade.stake > 0)) return trade.ask * (1 + pct);
  return (trade.stake * (1 + pct)) / qty;
}

export function sized(amount: number, fromStake: number, toStake: number): number {
  if (!(fromStake > 0) || !(toStake > 0)) return amount;
  return (amount / fromStake) * toStake;
}

export function markTrade(
  trade: Trade,
  snap: AssetSnapshot | undefined,
): { value: number; profit: number; pct: number; bid: number } {
  if (trade.venue === "polymarket" && trade.result === "open") {
    const spot = snap?.spot ?? 0;
    const strike = trade.target ?? snap?.target ?? null;
    if (spot > 0 && strike != null && trade.contracts > 0) {
      const toward = trade.side === "up" ? spot - strike : strike - spot;
      const scale = trade.asset === "btc" ? 28 : 0.45;
      const bid = Math.min(0.97, Math.max(0.03, 1 / (1 + Math.exp(-toward / scale))));
      const value = trade.contracts * bid;
      const profit = value - trade.stake;
      const pct = trade.stake > 0 ? profit / trade.stake : 0;
      return { value, profit, pct, bid };
    }
  }
  if (trade.result === "open" && snap?.market && snap.market.ticker !== trade.ticker) {
    return { value: trade.stake, profit: 0, pct: 0, bid: trade.ask };
  }
  if (!snap?.market || trade.result !== "open") {
    const value = trade.payout ?? 0;
    const profit = trade.profit ?? value - trade.stake;
    const pct = trade.stake > 0 ? profit / trade.stake : 0;
    return { value, profit, pct, bid: 0 };
  }
  const bid = bidOf(trade.side, snap.market.yesBid, snap.market.noBid);
  const value = trade.contracts * bid;
  const profit = value - trade.stake;
  const pct = trade.stake > 0 ? profit / trade.stake : 0;
  return { value, profit, pct, bid };
}

export function clampTrail(n: number): number {
  if (!Number.isFinite(n)) return 45;
  return Math.min(65, Math.max(35, Math.round(n)));
}

export function exitForMultiple(_multiple: number, fallback = 45): number {
  return clampTrail(fallback);
}

const fourTicks = new Map<string, number>();

export function noteFour(trade: Trade, bid: number): void {
  if (!(bid <= 0.25) || !(bid + 0.05 < trade.ask)) return;
  fourTicks.set(trade.id, (fourTicks.get(trade.id) ?? 0) + 1);
}

export function fourAgainst(trade: Trade): boolean {
  return (fourTicks.get(trade.id) ?? 0) >= 3;
}

export function earlyProfitBlocked(trade: Trade, payout: number): boolean {
  if (!(trade.stake > 0) || !(payout > 0)) return false;
  const pct = (payout - trade.stake) / trade.stake;
  if (!(pct > 0 && pct < 0.45)) return false;
  if (fourAgainst(trade)) return false;
  const maxPct = trade.ask > 0 && trade.ask < 1 ? (1 - trade.ask) / trade.ask : 1;
  return maxPct >= 0.55;
}

export function bandNear(snap: AssetSnapshot | undefined): boolean {
  if (!snap || !(snap.spot > 0)) return false;
  const frames = [snap.vwap1m, snap.vwap5m].filter((frame) => frame && frame.stdev > 0);
  for (const frame of frames) {
    if (!frame) continue;
    const reach = Math.max(frame.stdev * 0.65, snap.asset === "btc" ? 80 : 1.2);
    if (frame.bands?.some((band) => Math.abs(band.price - snap.spot) <= reach)) return true;
  }
  return false;
}

export function bandInTheWay(asset: AssetSnapshot | undefined, side: Side): boolean {
  if (!asset || asset.target == null || !(asset.spot > 0)) return false;
  const spot = side === "down" && asset.close > 0 && asset.close < asset.spot ? asset.close : asset.spot;
  const strike = asset.target;
  const frames = [asset.vwap1m, asset.vwap5m].filter((frame) => frame && frame.vwap > 0);
  for (const frame of frames) {
    if (!frame) continue;
    const levels = [frame.vwap, ...(frame.bands ?? []).map((band) => band.price)];
    for (const level of levels) {
      if (!(level > 0)) continue;
      const pad = Math.max(frame.stdev, 0) * 0.06;
      if (Math.abs(level - strike) <= pad || Math.abs(level - spot) <= pad) continue;
      if (side === "down" && level === frame.vwap) continue;
      if (side === "down" && spot > level && strike < level) return true;
      if (side === "up" && spot < level && strike > level) return true;
    }
  }
  return false;
}

export function vwapSitsBetween(asset: AssetSnapshot | undefined, side: Side): boolean {
  if (!asset || asset.target == null || !(asset.spot > 0)) return false;
  const frames = [asset.vwap1m, asset.vwap5m].filter((frame) => frame && frame.vwap > 0);
  return frames.some((frame) =>
    side === "up" ? asset.spot < frame.vwap && asset.target > frame.vwap : asset.spot > frame.vwap && asset.target < frame.vwap,
  );
}

export function bandSide(
  frame: { vwap: number; bands?: { price: number }[] } | null | undefined,
  spot: number,
): Side | null {
  if (!frame || !(frame.vwap > 0) || !(spot > 0)) return null;
  return spot < frame.vwap ? "down" : "up";
}

export function againstVwap(asset: AssetSnapshot | undefined, side: Side): boolean {
  const line = asset?.vwap1m?.vwap || asset?.vwap5m?.vwap || 0;
  if (!asset || !(line > 0) || !(asset.spot > 0)) return false;
  return side === "up" ? asset.spot < line : asset.spot > line;
}

export function tenVwapWall(asset: AssetSnapshot | undefined, side: Side): boolean {
  if (!asset || asset.asset !== "gold" || asset.target == null || !(asset.spot > 0)) return false;
  const frames = [asset.vwap1m, asset.vwap5m].filter((frame) => frame && frame.vwap > 0);
  for (const frame of frames) {
    if (!frame) continue;
    const vwap = frame.vwap;
    const spot = asset.spot;
    const target = asset.target;
    const lo = Math.min(spot, target);
    const hi = Math.max(spot, target);
    if (vwap > lo && vwap < hi) return true;
    const base = Math.round(spot / 10) * 10;
    for (const level of [base - 10, base, base + 10]) {
      if (Math.abs(spot - level) > 1.5) continue;
      const a = Math.min(level, target);
      const b = Math.max(level, target);
      if (vwap > a && vwap < b) return true;
      if (side === "up" && spot < vwap) return true;
      if (side === "down" && spot > vwap) return true;
    }
  }
  return false;
}

export function underBand(frame: { vwap: number; bands?: { price: number }[] } | null | undefined, spot: number, side: Side): boolean {
  const only = bandSide(frame, spot);
  return Boolean(only && side !== only);
}

function nearestLevel(spot: number, vwap: number, stdev: number): { price: number; dist: number } | null {
  const width = Math.max(stdev, 0);
  if (!(width > 0) || !(spot > 0) || !(vwap > 0)) return null;
  let price = vwap;
  let dist = Math.abs(spot - vwap);
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    for (const level of [vwap + step * width, vwap - step * width]) {
      const gap = Math.abs(spot - level);
      if (gap < dist) {
        price = level;
        dist = gap;
      }
    }
  }
  return { price, dist };
}

export function towardBand(spot: number, vwap: number, stdev: number): number {
  const near = nearestLevel(spot, vwap, stdev);
  const width = Math.max(stdev, 0);
  if (!near || !(width > 0)) return 0;
  const gap = width * 0.5;
  return Math.max(0, Math.min(1, 1 - near.dist / gap));
}

export function onBand(spot: number, vwap: number, stdev: number): boolean {
  const near = nearestLevel(spot, vwap, stdev);
  const width = Math.max(stdev, 0);
  if (!near || !(width > 0)) return false;
  return near.dist <= width * 0.06;
}

export function closeEnough(spot: number, vwap: number, stdev: number): boolean {
  const near = nearestLevel(spot, vwap, stdev);
  const width = Math.max(stdev, 0);
  if (!near || !(width > 0)) return false;
  return near.dist <= width * 0.11;
}

export function bandTouched(spot: number, vwap: number, stdev: number, side: "up" | "down"): boolean {
  const width = Math.max(stdev, 0);
  if (!(spot > 0) || !(vwap > 0) || !(width > 0)) return false;
  const pad = width * 0.06;
  const levels: number[] = [];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * width, vwap - step * width);
  const ahead = side === "down"
    ? levels.filter((level) => level >= spot - pad).sort((a, b) => a - b)[0]
    : levels.filter((level) => level <= spot + pad).sort((a, b) => b - a)[0];
  return ahead != null && Math.abs(ahead - spot) <= pad;
}

function kissPad(asset: string, stdev: number): number {
  const width = Math.max(stdev || 0, 0);
  if (asset === "btc") return Math.max(25, width * 0.12);
  if (asset === "gold") return Math.max(0.6, width * 0.2);
  if (asset === "eth") return Math.max(1.2, width * 0.2);
  return Math.max(0.08, width * 0.2);
}

export function targetKiss(asset: AssetSnapshot | undefined): { band: number; gap: number; vwap: number } | null {
  if (!asset || asset.target == null || !(asset.spot > 0)) return null;
  const frame = asset.vwap1m ?? asset.vwap5m;
  if (!frame || !(frame.vwap > 0) || !onBand(asset.spot, frame.vwap, frame.stdev)) return null;
  const levels = [frame.vwap, ...(frame.bands ?? []).map((band) => band.price)].filter((level) => level > 0);
  let band = frame.vwap;
  let gap = Math.abs(frame.vwap - asset.target);
  for (const level of levels) {
    const next = Math.abs(level - asset.target);
    if (next < gap) {
      band = level;
      gap = next;
    }
  }
  if (gap > kissPad(asset.asset, frame.stdev)) return null;
  return { band, gap, vwap: frame.vwap };
}

export function bandBreak(spot: number, vwap: number, stdev: number): Side | null {
  const near = nearestLevel(spot, vwap, stdev);
  if (!near) return null;
  if (near.price > spot) return "down";
  if (near.price < spot) return "up";
  return spot >= vwap ? "up" : "down";
}

export function legalSide(spot: number, vwap: number, _target: number | null, _stdev = 0): Side | null {
  if (!(spot > 0) || !(vwap > 0)) return null;
  if (spot < vwap) return "down";
  if (spot > vwap) return "up";
  return null;
}

export function aimWithVwap(setup: Setup, asset: AssetSnapshot): Setup | null {
  if ((setup.asset !== "gold" && setup.asset !== "btc") || !(asset.spot > 0)) return setup;
  const vwap = asset.vwap1m?.vwap || asset.vwap5m?.vwap || 0;
  const stdev = asset.vwap1m?.stdev || asset.vwap5m?.stdev || 0;
  const only = legalSide(asset.spot, vwap, asset.target ?? null, stdev);
  if (!only || setup.side !== only) return null;
  return setup;
}

export function goldTenBand(snap: AssetSnapshot | undefined, side?: Side): boolean {
  if (!snap || snap.asset !== "gold" || !(snap.spot > 0) || snap.target == null || !side) return false;
  const strike = snap.target;
  const spot = snap.spot;
  const frames = [snap.vwap1m, snap.vwap5m].filter((frame) => frame && frame.vwap > 0);
  for (const frame of frames) {
    if (!frame) continue;
    const vwap = frame.vwap;
    if (side === "up" && spot < vwap) return true;
    if (side === "down" && spot > vwap) return true;
    const cross = side === "up" ? spot < vwap && strike > vwap : spot > vwap && strike < vwap;
    if (cross) return true;
    const lo = Math.min(vwap, strike);
    const hi = Math.max(vwap, strike);
    const between = Math.ceil((lo + 0.001) / 10) * 10;
    if (between < hi) return true;
    const lower = Math.floor(strike / 10) * 10;
    for (const level of [lower, lower + 10]) {
      const gap = Math.abs(strike - level);
      if (!(gap > 0.05 && gap <= 2)) continue;
      const a = Math.min(level, strike);
      const b = Math.max(level, strike);
      if (vwap > a && vwap < b) return true;
    }
  }
  return false;
}

function bandBetween(snap: AssetSnapshot, a: number, b: number): boolean {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const frames = [snap.vwap1m, snap.vwap5m].filter((frame) => frame && frame.stdev > 0);
  for (const frame of frames) {
    if (!frame) continue;
    if (frame.bands?.some((band) => band.price > lo && band.price < hi)) return true;
  }
  return false;
}

export function bankAtBand(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (trade.result !== "open" || trade.venue === "polymarket" || trade.source !== "live") return false;
  const spot = snap?.spot ?? 0;
  const strike = trade.target ?? snap?.target ?? null;
  if (spot > 0 && strike != null && trade.asset === "btc") {
    const room = trade.side === "up" ? spot - strike : strike - spot;
    if (room >= 300) return false;
  }
  const mtm = markTrade(trade, snap);
  if (!(mtm.profit > 0)) return false;
  if (trade.asset === "gold") return bandNear(snap) && mtm.pct >= 0.5;
  if (!(mtm.pct >= 0.75)) return false;
  return bandNear(snap);
}

export function bandBank(trade: Trade, snap: AssetSnapshot | undefined, floorPct = 45): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.profit > 0) || !(mtm.bid > trade.ask)) return false;
  if (!bandNear(snap)) return false;
  const left = snap.secondsLeft ?? 999;
  if (mtm.pct + 1e-9 >= clampTrail(floorPct) / 100) return true;
  if (left > 120) return false;
  const spot = snap.spot;
  const strike = trade.target ?? snap.target ?? null;
  if (!(spot > 0) || strike == null) return false;
  const room = trade.side === "up" ? spot - strike : strike - spot;
  if (room < 0) return false;
  return trade.asset === "btc" ? room <= 40 : room <= 1.5;
}

export function againstBand(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  if (!bandNear(snap)) return false;
  const spot = snap.spot ?? 0;
  const strike = trade.target ?? snap.target ?? null;
  if (!(spot > 0) || strike == null) return false;
  const room = trade.side === "up" ? spot - strike : strike - spot;
  if (!(room < 0)) return false;
  const mtm = markTrade(trade, snap);
  if (mtm.profit > 0 && mtm.bid > trade.ask) return true;
  const need = trade.asset === "btc" ? 5 : 0.6;
  if (!(room <= -need)) return false;
  return mtm.bid >= 0.08;
}

export function cutTheLoss(_trade: Trade, _snap: AssetSnapshot | undefined): boolean {
  return false;
}

export function sureMiss(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.venue === "polymarket" || trade.result !== "open") return false;
  const left = snap.secondsLeft;
  if (!(left > 5 && left <= 45)) return false;
  const spot = snap.spot;
  const strike = trade.target ?? snap.target;
  if (!(spot > 0) || strike == null) return false;
  const wrong = trade.side === "up" ? strike - spot : spot - strike;
  const need = trade.asset === "btc" ? 100 : 2;
  return wrong >= need;
}

function earlySave(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.venue === "polymarket" || trade.result !== "open") return false;
  const left = snap.secondsLeft;
  if (!(left > 20 && left <= 180)) return false;
  const spot = snap.spot;
  const strike = trade.target ?? snap.target;
  if (!(spot > 0) || strike == null) return false;
  const wrong = trade.side === "up" ? strike - spot : spot - strike;
  const need = trade.asset === "btc" ? 80 : 2;
  return wrong >= need;
}

export function salvageNow(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.venue === "polymarket" || trade.result !== "open") return false;
  const mtm = markTrade(trade, snap);
  if (deadBounce(trade, snap)) return (snap.secondsLeft ?? 999) <= 150 && mtm.bid >= 0.08;
  if (!sureMiss(trade, snap) && !earlySave(trade, snap)) return false;
  return mtm.bid >= 0.08;
}

export function deadBounce(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.venue === "polymarket" || trade.result !== "open") return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.profit < -0.5) || !(mtm.bid >= 0.08) || !(mtm.bid < trade.ask)) return false;
  const spot = snap.spot ?? 0;
  const strike = trade.target ?? snap.target ?? null;
  if (!(spot > 0) || strike == null) return false;
  const wrong = trade.side === "up" ? strike - spot : spot - strike;
  const minutes = Math.max(0, (snap.secondsLeft ?? 0) / 60);
  const need = trade.asset === "btc" ? Math.max(80, 15 * minutes) : Math.max(2.5, 0.8 * minutes);
  if (wrong < need) return false;
  const low = trade.lowBid ?? mtm.bid;
  return mtm.bid >= low + 0.03;
}

export function bankUnder(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  if (!(snap.secondsLeft > 0 && snap.secondsLeft <= 60)) return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.profit > 0) || !(mtm.bid > trade.ask)) return false;
  if (mtm.pct + 1e-9 >= exitTargetPct(trade, snap, 75) / 100) return false;
  const spot = snap.spot;
  const strike = trade.target ?? snap.target ?? null;
  if (!(spot > 0) || strike == null) return false;
  const room = trade.side === "up" ? spot - strike : strike - spot;
  const safe = trade.asset === "btc" ? room >= 80 : room >= 2.5;
  if (safe) return false;
  const thin = trade.asset === "btc" ? room < 25 : room < 1;
  return room < 0 || thin;
}

export function allTheWay(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  const entry = trade.contracts > 0 && trade.stake > 0 ? trade.stake / trade.contracts : trade.ask;
  if (!(entry > 0 && entry < 1)) return false;
  const maxPct = (1 - entry) / entry;
  if (!(maxPct < 0.4)) return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.profit > 0) || !(mtm.bid > trade.ask)) return false;
  const strike = trade.target ?? snap.target ?? null;
  const chopping = bouncing(snap) || (strike != null && finishChop(snap, strike));
  if (mtm.bid >= 0.88) return true;
  return chopping && mtm.bid >= 0.8;
}

export function fewLeft(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.profit > 0) || !(mtm.bid > trade.ask) || !(mtm.bid > 0) || !(mtm.bid < 1)) return false;
  const qty = trade.contracts > 0 ? trade.contracts : trade.stake / Math.max(trade.ask, 0.01);
  return (1 - mtm.bid) * qty <= 5;
}

export function dollarLeft(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  if (!(trade.ask > 0 && trade.ask < 1)) return false;
  if ((1 - trade.ask) / trade.ask + 1e-9 >= 0.65) return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.bid > trade.ask) || !(mtm.profit > 0)) return false;
  const qty = trade.contracts > 0 ? trade.contracts : trade.stake / trade.ask;
  return (1 - mtm.bid) * qty <= 1.25;
}

function bouncing(snap: AssetSnapshot | undefined): boolean {
  if (!snap || !(snap.spot > 0)) return false;
  const frame = snap.vwap1m ?? snap.vwap5m;
  if (!frame || !(frame.stdev > 0) || !(frame.vwap > 0)) return false;
  const prints = (snap.lastPrints ?? []).slice(-6);
  if (prints.length < 3) return false;
  const hi = Math.max(...prints.map((p) => p.h));
  const lo = Math.min(...prints.map((p) => p.l));
  const span = hi - lo;
  if (!(span > 0)) return false;
  const crossed = prints.some((p) => p.h >= frame.vwap) && prints.some((p) => p.l <= frame.vwap);
  if (crossed && span <= frame.stdev * 1.4) return true;
  if (!bandNear(snap)) return false;
  return span >= frame.stdev * 0.12 && span <= frame.stdev * 0.9;
}

function finishChop(snap: AssetSnapshot | undefined, strike: number): boolean {
  if (!snap || !(snap.secondsLeft > 0 && snap.secondsLeft <= 120)) return false;
  const prints = (snap.lastPrints ?? []).slice(-3);
  if (prints.length >= 2) {
    const above = prints.some((p) => p.h >= strike || p.c >= strike);
    const below = prints.some((p) => p.l <= strike || p.c <= strike);
    if (above && below) return true;
  }
  const tail = (snap.spark ?? []).slice(-3);
  return tail.some((p) => p > strike) && tail.some((p) => p < strike);
}

export function underGreen(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  if (!(snap.secondsLeft > 0 && snap.secondsLeft <= 90)) return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.profit > 0) || !(mtm.bid > trade.ask)) return false;
  const spot = snap.spot;
  const strike = trade.target ?? snap.target ?? null;
  if (!(spot > 0) || strike == null) return false;
  const room = trade.side === "up" ? spot - strike : strike - spot;
  return room < 0;
}

export function onTheLine(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  if (trade.asset !== "gold") return false;
  const strike = trade.target ?? snap.target ?? null;
  const spot = snap.spot;
  if (!(spot > 0) || strike == null) return false;
  if (!(Math.abs(spot - strike) < 1)) return false;
  if (!bandNear(snap)) return false;
  if (!(snap.secondsLeft > 0 && snap.secondsLeft <= 180)) return false;
  const mtm = markTrade(trade, snap);
  return mtm.pct + 1e-9 >= 0.5 && mtm.bid > trade.ask;
}

export function roundTrip(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  if (!bandNear(snap)) return false;
  const paid = trade.ask;
  if (!(paid > 0.05 && paid < 0.95)) return false;
  const low = trade.lowBid;
  if (!(low != null && low <= paid * 0.5)) return false;
  const mtm = markTrade(trade, snap);
  return mtm.bid >= paid * 0.85 && mtm.bid + 0.01 < paid && mtm.bid > low + 0.02;
}

export function bleedOut(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  const paid = trade.ask;
  if (!(paid > 0.05 && paid < 0.95)) return false;
  if (!(snap.secondsLeft > 0 && snap.secondsLeft <= 180)) return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.bid >= 0.05)) return false;
  const low = Math.min(trade.lowBid ?? mtm.bid, mtm.bid);
  if (!(low <= paid * 0.5)) return false;
  if (!bandNear(snap)) return true;
  const prints = (snap.lastPrints ?? []).slice(-3);
  if (prints.length < 2) return false;
  const last = prints[prints.length - 1]?.c ?? 0;
  const prev = prints[prints.length - 2]?.c ?? 0;
  return trade.side === "down" ? last < prev : last > prev;
}

export function iffyFifty(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket") return false;
  if (!(snap.secondsLeft > 0 && snap.secondsLeft <= 180)) return false;
  const mtm = markTrade(trade, snap);
  if (!(mtm.pct + 1e-9 >= 0.5) || !(mtm.bid > trade.ask)) return false;
  const strike = trade.target ?? snap.target ?? null;
  const spot = snap.spot;
  if (!(spot > 0) || strike == null) return false;
  const room = trade.side === "up" ? spot - strike : strike - spot;
  const thin = trade.asset === "btc" ? room < 40 : room < 1.5;
  if (room < 0 || thin) return true;
  if (trade.asset === "gold" && bandNear(snap)) return true;
  return bouncing(snap) || finishChop(snap, strike);
}

export function mustLeave(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.result !== "open" || trade.venue === "polymarket" || trade.source !== "live") return false;
  const left = snap.secondsLeft;
  if (!(left > 5 && left <= 120)) return false;
  const mtm = markTrade(trade, snap);
  return mtm.bid >= 0.03;
}

export function roomTarget(trade: Trade): number | null {
  const entry = trade.contracts > 0 && trade.stake > 0 ? trade.stake / trade.contracts : trade.ask;
  if (!(entry > 0 && entry < 1)) return null;
  const maxPct = (1 - entry) / entry;
  if (maxPct < 0.4) return null;
  if (maxPct + 1e-9 >= 0.65) return null;
  const shaved = Math.floor(maxPct * 100 - 5);
  if (!(shaved >= 10)) return 10;
  return shaved % 5 === 0 ? shaved : Math.floor(shaved / 10) * 10;
}

export function btcRun(trade: Trade, snap: AssetSnapshot | undefined): boolean {
  if (!snap || trade.asset !== "btc" || trade.venue === "polymarket") return false;
  const strike = trade.target ?? snap.target ?? null;
  const spot = snap.spot ?? 0;
  if (!(spot > 0) || strike == null) return false;
  const room = trade.side === "up" ? spot - strike : strike - spot;
  return room >= 300;
}

const trailPeak = new Map<string, number>();

export function trailExit(trade: Trade, snap: AssetSnapshot | undefined, floorPct = 45): boolean {
  const mtm = markTrade(trade, snap);
  const paid = trade.contracts > 0 && trade.stake > 0 ? trade.stake / trade.contracts : 0;
  const entry = Math.max(trade.ask || 0, paid || 0);
  const cheap = floorPct > 0 && floorPct < 35;
  const need = (cheap ? floorPct : clampTrail(floorPct)) / 100;
  const mult = 1 + need;
  if (!(entry > 0.02) || !(mtm.bid > 0.02)) return false;
  const floor = entry * mult;
  const remembered = Math.max(trailPeak.get(trade.id) ?? 0, trade.highBid ?? 0);
  if (mtm.bid > remembered && mtm.pct > 0) {
    trailPeak.set(trade.id, mtm.bid);
  }
  const peak = Math.max(trailPeak.get(trade.id) ?? 0, trade.highBid ?? 0, remembered);
  const peakPct = entry > 0 ? (peak / entry - 1) * 100 : 0;
  const livePct = mtm.pct * 100;
  const falling = (snap?.spot ?? 0) > 0 && (snap?.close ?? 0) > 0 && (snap?.spot ?? 0) < (snap?.close ?? 0);
  const width = snap?.vwap1m?.stdev ?? 0;
  const mean = snap?.vwap1m?.vwap ?? 0;
  const intoBand = falling && width > 0 && mean > 0 && [0.5, 1, 1.5, 2, 2.5, 3].some((step) => {
    const level = mean - step * width;
    return level < (snap?.spot ?? 0) && (snap?.spot ?? 0) - level <= width * 0.5;
  });
  if (keepGreen(livePct, {
    asset: trade.asset,
    side: trade.side,
    spot: snap?.spot,
    target: trade.target ?? snap?.target ?? undefined,
    vwap: mean,
    stdev: width,
  })) return false;
  if (gateSell(peakPct, livePct, mtm.profit > 0.005)) return true;
  return false;
}
export function exitTargetPct(
  trade: Trade,
  snap: AssetSnapshot | undefined,
  fallback = 45,
): number {
  if (fourAgainst(trade)) return 25;
  return exitForMultiple(trade.multiple, fallback);
}

export function shouldExit(
  trade: Trade,
  snap: AssetSnapshot | undefined,
  _defaultExitPct = 45,
): boolean {
  if (trade.result !== "open" || trade.venue === "polymarket") return false;
  return trailExit(trade, snap, _defaultExitPct);
}

export function heldSide(
  trades: Trade[],
  ticker: string,
  locks?: Record<string, Side> | null,
): Side | null {
  const live = trades.filter(
    (t) => t.ticker === ticker && t.result === "open" && t.source === "live" && t.venue !== "polymarket",
  );
  if (live.length) return live.reduce((a, b) => (a.openedAt < b.openedAt ? a : b)).side;
  return locks?.[ticker] ?? null;
}

export function flipped(
  trades: Trade[],
  ticker: string,
  side: Side,
  asset?: Trade["asset"],
  locks?: Record<string, Side> | null,
): boolean {
  const held = heldSide(trades, ticker, locks);
  if (held && held !== side) return true;
  return trades.some(
    (t) =>
      !t.probe &&
      t.source === "live" &&
      t.venue !== "polymarket" &&
      t.result === "open" &&
      t.side !== side &&
      asset != null &&
      t.asset === asset &&
      t.ticker !== ticker,
  );
}

export function settleSide(side: Side, spot: number, target: number): boolean {
  return side === "up" ? spot >= target : spot < target;
}

export function midBand(asset: AssetSnapshot | undefined): boolean {
  const frame = asset?.vwap1m ?? asset?.vwap5m;
  const spot = asset?.spot ?? 0;
  if (!frame || !(frame.stdev > 0) || !(spot > 0)) return false;
  return !onBand(spot, frame.vwap, frame.stdev);
}

export function fightsBand(setup: { side: Side }, asset: AssetSnapshot | undefined): boolean {
  if (!asset) return true;
  const frames = [asset.vwap1m, asset.vwap5m].filter((frame) => frame && frame.vwap > 0 && frame.stdev > 0);
  if (!frames.length) return true;
  return frames.some((frame) => {
    const only = legalSide(asset.spot, frame.vwap, asset.target ?? null, frame.stdev);
    return !only || setup.side !== only;
  });
}

const MONTH: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

export function windowCloseMs(ticker: string): number | null {
  const m = ticker.match(/-(\d{2})([A-Z]{3})(\d{2})(\d{2})(\d{2})-/);
  if (!m) return null;
  const month = MONTH[m[2]];
  if (month == null) return null;
  const asUtc = Date.UTC(2000 + Number(m[1]), month, Number(m[3]), Number(m[4]), Number(m[5]));
  const edt = month > 2 && month < 10;
  return asUtc + (edt ? 4 : 5) * 3600 * 1000;
}

export function windowStillOpen(ticker: string, now = Date.now()): boolean {
  const closeAt = windowCloseMs(ticker);
  return closeAt != null && now + 20000 < closeAt;
}

export function smallTicket(trade: { stake?: number | null; probe?: boolean }): boolean {
  if (trade.probe) return true;
  const stake = trade.stake ?? 0;
  return stake > 0 && stake < 10;
}

export function saleCall(
  pin: { ask: number; pct: number } | null,
  mtm: { value: number; profit: number; pct: number },
  floorPct = 45,
  peaked = false,
): "pin" | "ease" | "wait" {
  if (!pin || !(mtm.profit > 0.005)) return "wait";
  const live = mtm.pct * 100;
  if (pin.pct >= 5 && live + 1 >= pin.pct) return "pin";
  return "wait";
}

export function pinRelease(cost: number, raw: number, live: number): number | null {
  if (!(cost > 0) || !Number.isFinite(raw)) return null;
  if (!(raw > cost)) return null;
  if (Math.abs(raw - Math.max(live, 0)) < 0.12) return null;
  return Math.round(raw * 100) / 100;
}

export function cleanPin(
  pin: { ask: number; pct: number } | null,
  cost: number,
  maxValue: number,
): { ask: number; pct: number } | null {
  if (!pin || !(cost > 0) || !(maxValue > cost + 0.05)) return null;
  const maxPct = ((maxValue - cost) / cost) * 100;
  const pct = Number(pin.pct);
  const ask = Number(pin.ask);
  const pctOk = Number.isFinite(pct) && pct >= 5 && pct <= maxPct + 1;
  const askOk = Number.isFinite(ask) && ask > cost + 0.05 && ask <= maxValue + 0.05;
  if (!pctOk && !askOk) return null;
  const usedPct = pctOk ? Math.min(pct, maxPct) : ((Math.min(ask, maxValue) - cost) / cost) * 100;
  const usedAsk = Math.min(maxValue, askOk ? ask : cost * (1 + usedPct / 100));
  return { ask: Math.round(usedAsk * 100) / 100, pct: Math.round(usedPct * 10) / 10 };
}

export function pinFromSlider(cost: number, pct: number, maxValue: number): { ask: number; pct: number } | null {
  if (!(cost > 0) || !Number.isFinite(pct)) return null;
  const maxPct = maxValue > cost ? ((maxValue - cost) / cost) * 100 : 0;
  const used = Math.round(Math.min(Math.max(0, pct), maxPct));
  if (used < 5) return null;
  const ask = Math.round(Math.min(maxValue, cost * (1 + used / 100)) * 100) / 100;
  if (!(ask > cost)) return null;
  return { ask, pct: used };
}

export function crossBids(bid: number): number[] {
  if (!(bid > 0.02)) return [];
  const start = Math.round(Math.min(0.99, bid) * 100) / 100;
  const out: number[] = [];
  for (const delta of [0, 0.01]) {
    const px = Math.round((start - delta) * 100) / 100;
    if (px >= 0.01 && !out.includes(px)) out.push(px);
  }
  return out;
}

export function shortClosePrices(noBid: number): number[] {
  return crossBids(noBid)
    .map((cash) => Math.round((1 - cash) * 100) / 100)
    .filter((px, index, all) => px > 0.01 && px < 0.99 && all.indexOf(px) === index);
}

export function halfCuts(
  pos: number,
  yesBid: number,
  noBid: number,
  yesAsk = 0,
): { count: string; bookSide: "ask" | "bid"; prices: number[] } | null {
  const abs = Math.abs(pos);
  const half = Math.floor((abs / 2) * 100) / 100;
  if (!(half >= 0.01) || abs - half < 0.01) return null;
  if (pos > 0) {
    const bid = yesBid > 0.02 ? yesBid : yesAsk > 0.02 ? Math.max(0.01, yesAsk - 0.01) : 0;
    if (!(bid > 0.01)) return null;
    const prices = crossBids(bid);
    return { count: half.toFixed(2), bookSide: "ask", prices };
  }
  const no = noBid > 0.02 ? noBid : yesAsk > 0.02 ? Math.max(0.01, Math.round((1 - yesAsk) * 100) / 100) : 0;
  if (!(no > 0.01)) return null;
  const prices = shortClosePrices(no);
  return { count: half.toFixed(2), bookSide: "bid", prices };
}

export function quoteSale(
  cost: number,
  bid: number,
  contracts: number,
  floorPct: number,
  peak: number,
  pin: { ask: number; pct: number } | null,
  place?: { asset?: string; side?: string; spot?: number; target?: number; vwap?: number; stdev?: number } | null,
): { action: "sell" | "hold"; peak: number; why: string } {
  const qty = Math.abs(contracts);
  const profit = Math.round((qty * bid - cost) * 100) / 100;
  const live = cost > 0 ? (profit / cost) * 100 : 0;
  const pinPct = pin && Number(pin.pct) >= 5 && Number(pin.pct) < 500 ? Number(pin.pct) : 0;
  const reaching = pinPct > 5;
  if (!(cost > 0) || !(bid > 0.02)) return { action: "hold", peak, why: "under" };
  const seenBid = Math.max(peak, bid);
  const seenPct = cost > 0 ? (qty * seenBid - cost) / cost * 100 : live;
  if (keepGreen(live, place)) return { action: "hold", peak: seenBid, why: "ride" };
  if (gateSell(seenPct, live, profit > 0.005)) return { action: "sell", peak: seenBid, why: "floor" };
  if (reaching && live + 1 >= pinPct && profit > 0.005) return { action: "sell", peak: seenBid, why: "pin" };
  const left = qty * Math.max(0, 1 - bid);
  if (profit > 0.005 && bid >= 0.95 && left <= 5) return { action: "sell", peak: seenBid, why: "ceiling" };
  return { action: "hold", peak: seenBid, why: "ride" };
}

export function bandSitsBetween(spot: number, target: number, vwap: number, stdev: number): boolean {
  if (!(spot > 0) || !(target > 0) || !(vwap > 0) || !(stdev > 0)) return false;
  const lo = Math.min(spot, target);
  const hi = Math.max(spot, target);
  const levels = [vwap];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * stdev, vwap - step * stdev);
  return levels.some((level) => level > lo && level < hi);
}

export function keepGreen(
  live: number,
  place?: { asset?: string; side?: string; spot?: number; target?: number; vwap?: number; stdev?: number; falling?: boolean; intoBand?: boolean } | null,
): boolean {
  if (!place) return false;
  const name = String(place.asset || "");
  if (!/btc|gold|silver/i.test(name)) return false;
  const spot = Number(place.spot);
  const target = Number(place.target);
  if (!(spot > 0) || !(target > 0)) return true;
  if (!(live > 0)) return true;
  const room = /btc/i.test(name) ? 66 : /gold/i.test(name) ? 1 : 0.25;
  if (Math.abs(spot - target) > room) return true;
  if (bandSitsBetween(spot, target, Number(place.vwap), Number(place.stdev))) return true;
  return false;
}

export function gateSell(seenPct: number, live: number, green: boolean): boolean {
  if (!green || !(live > 0)) return false;
  const gate = Math.floor(seenPct / 5) * 5;
  if (gate < 5 || !(live + 0.5 < seenPct)) return false;
  const floor = gate - 5;
  if (green && live + 1e-9 >= floor) return true;
  if (live + 1e-9 < floor && live + 5 >= floor) return true;
  const here = Math.floor(Math.max(0, live) / 5) * 5;
  if (live + 1e-9 < floor - 5 && live <= here + 5) return true;
  return false;
}

export function smallExit(profit?: number | null, stake?: number): boolean {
  const p = profit ?? 0;
  const s = stake ?? 0;
  if (p < 0) return !(s > 0) || p > -s * 0.9;
  if (!(s > 0)) return p < 5;
  return p < s * 0.45;
}

export function bugExit(trade: { result?: string; profit?: number | null; stake?: number }): boolean {
  if (trade.result === "win" || trade.result === "loss" || trade.result === "open") return false;
  if ((trade.profit ?? 0) < 0) return true;
  return smallExit(trade.profit, trade.stake);
}

export function firedBackwards(trade: Trade): boolean {
  const label = trade.patternLabel || "";
  const above = /\+[0-9]/.test(label);
  if (trade.side === "up" && (label.startsWith("Open -") || label.startsWith("Open −") || label.includes("through −") || label.includes("through -"))) return true;
  if (trade.side === "down" && (above || label === "At VWAP")) return true;
  return false;
}

export function outcomeProfit(trade: Trade): number | null {
  if (trade.result === "open" || trade.venue === "polymarket") return null;
  const stake = trade.stake;
  const full =
    trade.contracts > 0
      ? Math.round((trade.contracts - stake) * 100) / 100
      : trade.ask > 0
        ? Math.round(stake * (1 / trade.ask - 1) * 100) / 100
        : 0;
  if (trade.result === "win") return full;
  if (trade.result === "loss") return -Math.round(stake * 100) / 100;
  if (trade.lastSpot != null && trade.lastSpot > 0 && trade.target != null && trade.target > 0) {
    return settleSide(trade.side, trade.lastSpot, trade.target) ? full : -Math.round(stake * 100) / 100;
  }
  return null;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
