import type { DeskSettings, GrokCall, Setup } from "./types";

function readDeskJson(name: string): unknown {
  if (typeof window !== "undefined") return null;
  const fs = require("node:fs") as { readFileSync: (path: string, encoding: "utf8") => string };
  const path = require("node:path") as { join: (...parts: string[]) => string };
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", name), "utf8"));
}

function sameScale(price: number, dollars: number): number {
  return price > 0 ? price * (dollars / 84000) : 0;
}

function gasName(asset: string): boolean {
  const name = String(asset || "").toLowerCase();
  return name.includes("wti") || name.includes("natgas") || name.includes("oil");
}

function scaledName(asset: string): boolean {
  const name = String(asset || "").toLowerCase();
  return name.includes("wti") || name.includes("natgas") || name.includes("oil") || name.includes("silver") || name.includes("gold");
}

function bandPad(asset: string, stdev: number, _price = 0): number {
  const name = String(asset || "").toLowerCase();
  let zone = Math.max((stdev || 0) * 0.225, 0);
  if (name.includes("wti") || name.includes("oil")) zone *= 1.5;
  else if (name.includes("eth")) zone *= 1.25;
  return zone;
}

function normLabel(label: string): string {
  return label.replace(/−/g, "-").replace(/\s+/g, " ").trim();
}

const PRIME_FROM = "2026-09-28T08:00:00.000Z";
let primeCache: { at: number; won: Set<string> } = { at: 0, won: new Set() };

function primePaid(label: string, side: string): boolean {
  if (typeof window !== "undefined") return false;
  const now = Date.now();
  if (now - primeCache.at > 8000) {
    const won = new Set<string>();
    try {
      const rows = readDeskJson("prime-book.json");
      const net = new Map<string, number>();
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (!row || row.result !== "closed" || !(row.at >= PRIME_FROM)) continue;
          const key = `${normLabel(String(row.pattern || ""))}|${row.side}`;
          net.set(key, (net.get(key) || 0) + (Number(row.profit) || 0));
        }
      }
      for (const [key, profit] of net) if (profit > 0) won.add(key);
    } catch {
      // A book that cannot be read does not unlock a setup.
    }
    primeCache = { at: now, won };
  }
  return primeCache.won.has(`${label}|${side}`);
}

export function winningSetup(label: string, side: string, _asset?: string): boolean {
  if (!label || !side) return false;
  const text = normLabel(label);
  const shape =
    /^tap-reject at /i.test(text) ||
    (side === "up" && /^close above /i.test(text)) ||
    (side === "down" && /^close below /i.test(text));
  if (!shape) return false;
  return true;
}

export function closedAbove(label?: string): boolean {
  return /^close above /i.test(normLabel(label || ""));
}

export function shortTap(label: string | undefined, side: string): boolean {
  const text = normLabel(label || "");
  return (side === "up" || side === "down") && (/^tap-reject at /i.test(text) || /^close above /i.test(text) || /^close below /i.test(text));
}

export function bandSteps(_asset = ""): number[] {
  return [0.5, 1, 1.5, 2, 2.5, 3];
}

export function bandReach(asset: string, stdev = 0): number {
  const name = String(asset || "");
  if (/btc/i.test(name)) {
    const width = Number(stdev);
    if (!(width > 0)) return 30;
    return Math.round(Math.max(40, width * 0.4));
  }
  if (/gold/i.test(name)) return 1;
  if (/silver/i.test(name)) return 0.13;
  if (/wti|oil/i.test(name)) return 0.15;
  if (/natgas|gas/i.test(name)) return 0.015;
  if (/copper/i.test(name)) return 0.02;
  if (/eth/i.test(name)) return 2;
  if (/sol/i.test(name)) return 0.15;
  return 0;
}

export function bandInWay(side: "up" | "down", spot: number, vwap: number, stdev: number, asset = ""): boolean {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return false;
  const reach = bandReach(asset, stdev);
  const levels: number[] = [];
  for (const step of bandSteps(asset)) levels.push(vwap + step * stdev, vwap - step * stdev);
  let above = Infinity;
  let below = Infinity;
  for (const level of levels) {
    if (level > spot) above = Math.min(above, level - spot);
    if (level < spot) below = Math.min(below, spot - level);
  }
  const ahead = side === "up" ? above : below;
  return ahead <= reach;
}

/** Price and the target are both on the wrong side of the center VWAP. A long belongs above it. A short belongs below it. */
export function centerWrong(side: "up" | "down", spot: number, target: number, vwap: number): boolean {
  if (!(spot > 0) || !(target > 0) || !(vwap > 0)) return false;
  if (side === "up") return vwap > spot && vwap > target;
  return vwap < spot && vwap < target;
}
export function bandOnPath(side: "up" | "down", spot: number, target: number, vwap: number, stdev: number): boolean {
  if (!(spot > 0) || !(target > 0) || !(vwap > 0) || !(stdev > 0)) return false;
  const touch = stdev * 0.2;
  const lo = Math.min(spot, target);
  const hi = Math.max(spot, target);
  const levels = [vwap];
  for (const step of bandSteps()) levels.push(vwap + step * stdev, vwap - step * stdev);
  for (const level of levels) {
    if (Math.abs(spot - level) <= touch) continue;
    if (level > lo && level < hi) return true;
  }
  void side;
  return false;
}

export function closeByBand(asset: string, spot: number, vwap: number, stdev: number) {
  const pad = bandPad(asset, stdev, vwap);
  if (!(pad > 0) || !(spot > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  const levels: { price: number; name: string; band: number }[] = [{ price: vwap, name: "VWAP", band: 0 }];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    levels.push({ price: vwap + step * stdev, name: `+${step}σ`, band: step });
    levels.push({ price: vwap - step * stdev, name: `-${step}σ`, band: -step });
  }
  let best: { gap: number; side: "up" | "down"; name: string; band: number } | null = null;
  for (const level of levels) {
    const gap = Math.abs(spot - level.price);
    if (gap > pad) continue;
    if (best && gap >= best.gap) continue;
    best = { gap, side: spot >= level.price ? "up" : "down", name: level.name, band: level.band };
  }
  if (!best) return null;
  if (bandInWay(best.side, spot, vwap, stdev)) return null;
  const channel = stdev * 0.5;
  if (channel > 0 && best.gap >= channel * 0.45) return null;
  const label = best.side === "up" ? `Close above ${best.name}` : `Close below ${best.name}`;
  return {
    kind: "tap_reject" as const,
    side: best.side,
    band: best.band,
    quality: 0.82,
    label,
    reasons: [
      best.side === "up"
        ? `Closed ${best.gap.toFixed(2)} above ${best.name}. That is a long.`
        : `Closed ${best.gap.toFixed(2)} below ${best.name}. That is a short unless a band is on the target.`,
    ],
  };
}

export function underBand(asset: string, spot: number, vwap: number, stdev: number) {
  const pad = bandPad(asset, stdev, vwap);
  if (!(pad > 0) || !(spot > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  const levels: { price: number; name: string; band: number }[] = [{ price: vwap, name: "VWAP", band: 0 }];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    levels.push({ price: vwap + step * stdev, name: `+${step}σ`, band: step });
    levels.push({ price: vwap - step * stdev, name: `-${step}σ`, band: -step });
  }
  let best: { gap: number; name: string; band: number } | null = null;
  for (const level of levels) {
    const gap = level.price - spot;
    if (gap <= 0 || gap > pad) continue;
    if (best && gap >= best.gap) continue;
    best = { gap, name: level.name, band: level.band };
  }
  if (!best) return null;
  return {
    kind: "tap_reject" as const,
    side: "down" as const,
    band: best.band,
    quality: 0.84,
    label: `Close below ${best.name}`,
    reasons: [`Price is under ${best.name}. A long would have to cross it. That is a short.`],
  };
}

export function closedThrough(
  candles: { o: number; h: number; l: number; c: number }[],
  vwap: number,
  stdev: number,
  spot: number,
  asset: string,
) {
  const pad = bandPad(asset, stdev, vwap);
  if (!(pad > 0) || !(vwap > 0) || !(stdev > 0) || candles.length < 2) return null;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  if (!(last?.c > 0) || !(prev?.c > 0)) return null;
  const now = spot > 0 ? spot : last.c;
  const levels: { price: number; name: string; band: number }[] = [{ price: vwap, name: "VWAP", band: 0 }];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    levels.push({ price: vwap + step * stdev, name: `+${step}σ`, band: step });
    levels.push({ price: vwap - step * stdev, name: `-${step}σ`, band: -step });
  }
  let best: { price: number; name: string; band: number; gap: number } | null = null;
  for (const level of levels) {
    if (!(prev.c < level.price) || !(last.c >= level.price) || !(now >= level.price)) continue;
    const gap = now - level.price;
    if (gap > pad) continue;
    if (best && level.price <= best.price) continue;
    best = { price: level.price, name: level.name, band: level.band, gap };
  }
  if (!best) return null;
  if (bandInWay("up", now, vwap, stdev)) return null;
  return {
    kind: "tap_reject" as const,
    side: "up" as const,
    band: best.band,
    quality: 0.84,
    label: `Close above ${best.name}`,
    reasons: [`Closed through ${best.name} from underneath. That is a long.`],
  };
}

export function brokeUnder(
  candles: { o: number; h: number; l: number; c: number }[],
  vwap: number,
  stdev: number,
  spot: number,
  asset: string,
) {
  if (!(vwap > 0) || !(stdev > 0) || candles.length < 3) return null;
  const last = candles[candles.length - 1];
  const prev = candles.slice(-8, -1);
  if (!(last?.c > 0)) return null;
  const levels: { price: number; name: string; band: number }[] = [{ price: vwap, name: "VWAP", band: 0 }];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    levels.push({ price: vwap + step * stdev, name: `+${step}σ`, band: step });
    levels.push({ price: vwap - step * stdev, name: `-${step}σ`, band: -step });
  }
  let best: { gap: number; name: string; band: number } | null = null;
  for (const level of levels) {
    const room = Math.max(stdev * 0.225, vwap * 0.00008);
    const wasAbove = prev.some((c) => c.c > level.price) || last.o > level.price;
    const pierced = last.l < level.price;
    if (!wasAbove || !pierced) continue;
    const px = Math.min(last.c, spot > 0 ? spot : last.c);
    if (!(px <= level.price + room)) continue;
    if (!(last.h >= level.price - room)) continue;
    const gap = level.price - px;
    if (gap < -room || (best && Math.abs(gap) >= Math.abs(best.gap))) continue;
    best = { gap, name: level.name, band: level.band };
  }
  if (!best) return null;
  if (bandInWay("down", spot > 0 ? spot : last.c, vwap, stdev)) return null;
  return {
    kind: "tap_reject" as const,
    side: "down" as const,
    band: best.band,
    quality: 0.84,
    label: `Tap-reject at ${best.name}`,
    reasons: [
      `Closed above ${best.name}, then broke under it and tapped from underneath. That is a short.`,
    ],
  };
}

export function primeLabel(label: string): boolean {
  const text = normLabel(label || "");
  if (!text) return false;
  if (/^watching /i.test(text) || /^no band/i.test(text)) return false;
  return true;
}

export function bandBetween(
  spot: number,
  vwap: number,
  stdev: number,
  target: number,
  padMult = 1,
  side?: string,
): boolean {
  if (!(spot > 0) || !(vwap > 0) || !(target > 0)) return false;
  const width = Math.max(stdev || 0, vwap * 0.00015);
  const pad = width * 0.06 * padMult;
  const levels = [vwap];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * width, vwap - step * width);
  return levels.some((level) => {
    if (Math.abs(level - target) <= pad || Math.abs(level - spot) <= pad) return false;
    const longCross = spot < level && target > level;
    const shortCross = spot > level && target < level;
    if (side === "up") return longCross;
    if (side === "down") return level !== vwap && shortCross;
    return longCross || shortCross;
  });
}

export function shortBandOnTarget(
  asset: string,
  side: string,
  target: number,
  vwap: number,
  stdev: number,
  spot = 0,
): string {
  if (side !== "up" && side !== "down") return "";
  if (!(target > 0) || !(vwap > 0)) return "";
  const name = String(asset || "").toLowerCase();
  const listed = name.includes("sol") || name.includes("btc") || name.includes("eth") || name.includes("wti") || name.includes("natgas") || name.includes("silver") || name.includes("gold");
  if (!listed && side !== "down") return "";
  const pad = name.includes("sol")
    ? 0.35
    : name.includes("btc")
      ? 35
      : name.includes("eth")
        ? 2.5
        : name.includes("wti") || name.includes("oil")
          ? sameScale(spot > 0 ? spot : vwap, 35) * 1.5
          : scaledName(asset)
          ? sameScale(spot > 0 ? spot : vwap, 35)
          : 1;
  const levels = [vwap];
  const width = Math.max(stdev || 0, 0);
  if (width > 0) {
    for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * width, vwap - step * width);
  }
  if (name.includes("gold")) {
    const nearTarget = levels.filter((level) => Math.abs(level - target) <= 1.5);
    if (side === "up" && nearTarget.some((level) => level <= target && spot <= level)) {
      return "Blocked. A band is on the target. A long is not accepted.";
    }
    if (side === "down" && nearTarget.some((level) => level >= target && spot >= level)) {
      return "Blocked. A band is on the target. A short is not accepted.";
    }
    return "";
  }
  if (name.includes("silver")) {
    const reach = Math.max(width * 0.11, 0.02);
    if (levels.some((level) => Math.abs(level - target) <= reach)) {
      return side === "up"
        ? "Blocked. A band is on the target. A long is not accepted."
        : "Blocked. A band is on the target. A short is not accepted.";
    }
    return "";
  }
  if ((name.includes("wti") || name.includes("oil")) && side === "up") {
    const reach = bandPad(asset, width, spot);
    if (levels.some((level) => level > spot && level - spot <= reach)) {
      return "Blocked. A band is above the price. A long is not accepted.";
    }
  }
  if (name.includes("eth") && side === "down" && levels.some((level) => level < spot && level <= target && spot - level <= 2.5 && Math.abs(level - target) <= 2.5)) {
    return "Blocked. Price is above a band. A short is not accepted.";
  }
  const near = levels.filter((level) => Math.abs(level - target) <= pad);
  if (!near.length || !(spot > 0)) return "";
  // A band under the target blocks a long only while price is still on it.
  // Once price has broken up through that band, the long is clear. The inverse for a short.
  if (side === "up" && near.some((level) => level <= target && spot <= level)) {
    return "Blocked. A band is on the target. A long is not accepted.";
  }
  if (side === "down" && near.some((level) => level >= target && spot >= level)) {
    if (!(gasName(asset) && underBand(asset, spot, vwap, stdev))) {
      return "Blocked. A band is on the target. A short is not accepted.";
    }
  }
  return "";
}

export function survivalBlock(
  spot: number,
  vwap: number,
  stdev: number,
  side: string,
  label?: string,
  target = 0,
  asset = "",
): string {
  if (!winningSetup(label || "", side, asset)) return "Staying alive. That is not a band tap.";
  const name = String(asset || "").toLowerCase();
  const spine = /btc|gold|silver/.test(name);
  if (!spine && bandBetween(spot, vwap, stdev, target, 1, side)) return "Staying alive. A band sits between price and the target.";
  let book: { n?: number; events?: { pattern?: string; side?: string }[] } = {};
  try {
    book = (readDeskJson("strikes.json") as { n?: number; events?: { pattern?: string; side?: string }[] }) || {};
  } catch {
    return "";
  }
  const n = book.n || 0;
  if (n >= 3) return "The model is dead. Three strikes.";
  if (n < 1 || !(spot > 0) || !(vwap > 0)) return "";
  const text = normLabel(label || "");
  const wounded = (book.events || []).some((row) => normLabel(row.pattern || "") === text && row.side === side);
  if (wounded) return "Staying alive. That tap already earned a strike.";
  if (!spine && bandBetween(spot, vwap, stdev, target, n >= 2 ? 3 : 1.8, side)) {
    return "Staying alive. A band is too close to the path to risk another strike.";
  }
  if (n >= 2 && !shortTap(label, side)) {
    try {
      const hour = readDeskJson("hour-mo.json") as { net?: number };
      if (!(hour.net > 0)) return "Staying alive. Two strikes. Only a green hour gets another order.";
    } catch {
      return "Staying alive. Two strikes. Sitting this one out.";
    }
  }
  return "";
}

export function offList(label: string, side: string, asset?: string): boolean {
  return !winningSetup(label, side, asset);
}

export type AutoDecision = { action: "fill" } | { action: "skip"; reason: string };

export function autoDecision(setup: Setup, settings: DeskSettings, _grok?: GrokCall | null): AutoDecision {
  if (!settings.autoPaper) return { action: "skip", reason: "Paper fills are off." };
  if (setup.watchOnly) return { action: "skip", reason: "Watching." };
  if (!winningSetup(setup.pattern.label, setup.side, setup.asset)) return { action: "skip", reason: "Not a band tap." };
  if (setup.multiple < settings.minMultiple) return { action: "skip", reason: "Multiple is too low." };
  return { action: "fill" };
}
