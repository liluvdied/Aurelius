import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bandReach, bandSteps } from "./auto";

type Candle = { o: number; h: number; l: number; c: number };
type Level = { price: number; name: string; band: number };

export type SpinePattern = {
  kind: "tap_reject";
  side: "up" | "down";
  band: number;
  quality: number;
  label: string;
  reasons: string[];
};

let modeCache: { at: number; on: boolean } = { at: 0, on: false };

function spineArmed(): boolean {
  const now = Date.now();
  if (now - modeCache.at > 5000) {
    let on = false;
    try {
      const row = JSON.parse(readFileSync(join(process.cwd(), "data", "model-mode.json"), "utf8"));
      on = row?.mode === "spine";
    } catch {
      on = false;
    }
    modeCache = { at: now, on };
  }
  return modeCache.on;
}

export function spineOwns(asset: string): boolean {
  return spineArmed() && listed(asset);
}

function listed(asset: string): boolean {
  const name = String(asset || "").toLowerCase();
  return name.includes("btc") || name.includes("gold") || name.includes("silver");
}

function levelsOf(vwap: number, stdev: number, asset = ""): Level[] {
  const levels: Level[] = [{ price: vwap, name: "VWAP", band: 0 }];
  for (const step of bandSteps(asset)) {
    levels.push({ price: vwap + step * stdev, name: `+${step}σ`, band: step });
    levels.push({ price: vwap - step * stdev, name: `-${step}σ`, band: -step });
  }
  return levels;
}

function pack(side: "up" | "down", level: Level, why: string): SpinePattern {
  return {
    kind: "tap_reject",
    side,
    band: level.band,
    quality: 0.86,
    label: side === "up" ? `Close above ${level.name}` : `Close below ${level.name}`,
    reasons: [why],
  };
}

export function readySpine(
  asset: string,
  candles: Candle[],
  vwap: number,
  stdev: number,
  spot: number,
  target = 0,
): SpinePattern | null {
  if (!spineArmed() || !listed(asset)) return null;
  if (!(vwap > 0) || !(stdev > 0) || !(spot > 0) || candles.length < 2) return null;
  const open = candles[candles.length - 1];
  const forming = (open?.t ?? 0) > 0 && Date.now() - open.t < 50_000;
  const book = forming ? candles.slice(0, -1) : candles;
  if (book.length < 2) return null;
  const last = book[book.length - 1];
  const prev = book[book.length - 2];
  if (!(last?.c > 0) || !(prev?.c > 0)) return null;
  const zone = Math.max(stdev * 0.4, String(asset).toLowerCase().includes("gold") ? 1.5 : 0);
  const underfoot = String(asset).toLowerCase().includes("gold") ? Math.max(stdev * 0.11, 1) : stdev * 0.11;
  const channel = stdev * 0.5;
  if (!(zone > 0)) return null;
  const levels = levelsOf(vwap, stdev, asset);
  const now = spot;
  const inTheWay = (side: "up" | "down", skip: number, reach: number) => levels.some((level) => {
    if (Math.abs(level.price - skip) < 1e-8) return false;
    if (side === "up") return level.price > now && level.price - now <= reach;
    return level.price < now && now - level.price <= reach;
  });

  let best: { gap: number; pattern: SpinePattern } | null = null;
  const far = /btc/i.test(String(asset)) && target > 0 && Math.abs(now - target) > 100;
  for (const level of levels) {
    const room = far ? Number.POSITIVE_INFINITY : stdev;
    const above = now > level.price && now - level.price <= room;
    const below = now < level.price && level.price - now <= room;
    const prior = book.slice(-5, -1);
    const brokeThenUp = prior.some((candle) => candle.o < level.price && candle.c > level.price);
    const brokeThenDown = prior.some((candle) => candle.o > level.price && candle.c < level.price);
    const rejectUp = last.l <= level.price + zone && last.c > level.price && last.c >= last.o && (last.o >= level.price - zone || brokeThenUp);
    const rejectDown = last.h >= level.price - zone && last.c < level.price && last.c <= last.o && (last.o <= level.price + zone || brokeThenDown);
    const liveUp = last.l <= level.price + zone && now > level.price && now + 1e-9 >= last.c;
    const liveDown = last.h >= level.price - zone && now < level.price && now <= last.c + 1e-9 && last.c <= last.o;
    const heldUp = prev.c > level.price && prev.c >= prev.o && prev.l <= level.price + zone && last.c > level.price;
    const heldDown = prev.c < level.price && prev.c <= prev.o && prev.h >= level.price - zone && last.c < level.price;
    const wall = bandReach(String(asset), stdev);
    if (above && (rejectUp || liveUp || heldUp) && !inTheWay("up", level.price, wall)) {
      const gap = now - level.price;
      if (!best || gap < best.gap) best = { gap, pattern: { ...pack("up", level, `Rejected ${level.name} and turned up. That is a long.`), label: `Tap-reject at ${level.name}` } };
    }
    if (below && (rejectDown || liveDown || heldDown) && !inTheWay("down", level.price, wall)) {
      const gap = level.price - now;
      if (!best || gap < best.gap) best = { gap, pattern: { ...pack("down", level, `Rejected ${level.name} and turned down. That is a short.`), label: `Tap-reject at ${level.name}` } };
    }
  }
  if (best?.pattern.side === "down") return best.pattern;
  for (const level of levels) {
    if (!(now < level.price) || (!far && level.price - now > stdev)) continue;
    const tagged = last.h >= level.price - zone && last.c < level.price && last.c <= last.o;
    if (tagged && last.c < level.price && !inTheWay("down", level.price, bandReach(String(asset), stdev))) {
      const gap = level.price - now;
      if (!best || best.pattern.side !== "down" || gap < best.gap) {
        best = { gap, pattern: { ...pack("down", level, `Rejected ${level.name} and kept falling. That is a short.`), label: `Tap-reject at ${level.name}` } };
      }
    }
  }
  return best?.pattern ?? null;
}
