import { winningSetup } from "./auto";
import type { BandLevel, Candle, Pattern, Side, VwapFrame } from "./types";

const BAND_MULTS = [0.5, 1, 1.5, 2, 2.5, 3] as const;

export function sortAsc(candles: Candle[]): Candle[] {
  return [...candles].sort((a, b) => a.t - b.t);
}

export function typical(c: Candle): number {
  return (c.h + c.l + c.c) / 3;
}

export function computeVwap(candles: Candle[]): VwapFrame | null {
  const rows = sortAsc(candles).filter((c) => Number.isFinite(c.c));
  if (rows.length < 8) return null;

  let pv = 0;
  let vol = 0;
  let tw = 0;
  for (const c of rows) {
    const tp = typical(c);
    pv += tp * c.v;
    vol += c.v;
    tw += tp;
  }
  const twap = tw / rows.length;
  const useVwap = vol > 0 && pv > 0;
  const vwap = useVwap ? pv / vol : twap;

  let acc = 0;
  let w = 0;
  for (const c of rows) {
    const tp = typical(c);
    const weight = useVwap ? c.v : 1;
    acc += weight * (tp - vwap) ** 2;
    w += weight;
  }
  const stdev = w > 0 ? Math.sqrt(acc / w) : 0;
  const floor = Math.max(stdev, vwap * 0.00015);

  const bands: BandLevel[] = [];
  for (const m of BAND_MULTS) {
    bands.push({ multiplier: -m, price: vwap - m * floor });
    bands.push({ multiplier: m, price: vwap + m * floor });
  }
  bands.sort((a, b) => a.price - b.price);

  return {
    vwap,
    stdev: floor,
    twap,
    source: useVwap ? "vwap" : "twap",
    bands,
    sample: rows.length,
  };
}

export function nearestBand(price: number, frame: VwapFrame): BandLevel | null {
  if (!frame.bands.length) return null;
  let best = frame.bands[0];
  let dist = Math.abs(price - best.price);
  for (const b of frame.bands) {
    const d = Math.abs(price - b.price);
    if (d < dist) {
      best = b;
      dist = d;
    }
  }
  return best;
}

function wickRejectDown(c: Candle): boolean {
  const range = c.h - c.l;
  if (range <= 0) return false;
  const upperWick = c.h - Math.max(c.o, c.c);
  return upperWick / range >= 0.45 && c.c <= c.o;
}

function wickRejectUp(c: Candle): boolean {
  const range = c.h - c.l;
  if (range <= 0) return false;
  const lowerWick = Math.min(c.o, c.c) - c.l;
  return lowerWick / range >= 0.45 && c.c >= c.o;
}

function qualityFromBand(mult: number, extra: number): number {
  const bandScore = Math.min(1, Math.abs(mult) / 2.5);
  return Math.max(0.35, Math.min(0.95, 0.45 + bandScore * 0.35 + extra));
}

function canTake(label: string, side: "up" | "down", band: number): boolean {
  if (winningSetup(label, side)) return true;
  if (!band) return false;
  const sign = band > 0 ? "+" : "";
  return winningSetup(`Open ${sign}${band}σ`, side);
}

export function detectPattern(candles: Candle[], frame: VwapFrame | null): Pattern {
  const empty: Pattern = {
    kind: "none",
    side: null,
    band: null,
    quality: 0,
    label: "No band interaction",
    reasons: ["Price is not interacting with a VWAP band on this frame."],
  };
  if (!frame) return empty;
  const rows = sortAsc(candles);
  if (rows.length < 8) return empty;

  const recent = rows.slice(-12);
  const last = recent[recent.length - 1];
  const look = recent.slice(-8);
  const { vwap, stdev } = frame;
  const touch = Math.max(stdev * 0.15, vwap * 0.00005);
  const prox = touch;

  const levels = [1.5, 2, 2.5, 1, 3, 0.5];

  for (const m of levels) {
    const bands = m === 0 ? [vwap] : [vwap + m * stdev, vwap - m * stdev];
    for (const level of bands) {
      const sign = m === 0 ? "" : level >= vwap ? "+" : "−";
      const name = m === 0 ? "VWAP" : `${sign}${m}σ`;
      const earlier = look.slice(-4, -1);
      let approach = null;
      for (let i = earlier.length - 1; i >= 0; i -= 1) {
        if (earlier[i].c > level) {
          approach = "above";
          break;
        }
        if (earlier[i].c < level) {
          approach = "below";
          break;
        }
      }
      const tagged = look.slice(-3).some((c) => c.l <= level + touch && c.h >= level - touch) && Math.abs(last.c - level) <= Math.max(touch * 1.6, stdev * 0.22);
      if (!tagged || !approach) continue;
      if (approach === "above" && last.c >= level - touch * 0.45) {
        const found: Pattern = {
          kind: "tap_reject",
          side: "up",
          band: m === 0 ? 0 : level >= vwap ? m : -m,
          quality: qualityFromBand(Math.max(m, 0.5), 0.04),
          label: `Tap-reject at ${name}`,
          reasons: [
            `Price came from above ${name} near ${level.toFixed(2)} and rejected back up.`,
            "That is a buy. A tap from underneath is not.",
          ],
        };
        if (canTake(found.label, found.side, found.band ?? 0)) return found;
        continue;
      }
      if (approach === "below" && last.c < level) {
        const found: Pattern = {
          kind: "tap_reject",
          side: "down",
          band: m === 0 ? 0 : level >= vwap ? m : -m,
          quality: qualityFromBand(Math.max(m, 0.5), 0.04),
          label: `Tap-reject at ${name}`,
          reasons: [
            `Price came from below ${name} near ${level.toFixed(2)} and rejected back down.`,
            "That is a short. A tap from above is not.",
          ],
        };
        if (canTake(found.label, found.side, found.band ?? 0)) return found;
        continue;
      }
    }
  }

  for (const m of levels) {
    const upper = vwap + m * stdev;
    const lower = vwap - m * stdev;
    const brokeUp = look.slice(0, -2).some((c) => c.c > upper + stdev * 0.2);
    const retestUp = look.slice(-4).some(
      (c) => c.l <= upper + prox && c.l >= upper - stdev * 0.55 && c.c > upper - prox,
    );
    const continuesUp = last.c >= upper && last.c <= upper + stdev * 0.1 && last.c >= last.o;
    if (brokeUp && retestUp && continuesUp && canTake(`Break-retest continuation through +${m}σ`, "up", m)) {
      return {
        kind: "break_retest",
        side: "up",
        band: m,
        quality: qualityFromBand(m, 0.12),
        label: `Break-retest continuation through +${m}σ`,
        reasons: [
          `Price blew through +${m}σ, retested the band, and continued higher.`,
          "Trade with the continuation, not against it.",
        ],
      };
    }

    const brokeDown = look.slice(0, -2).some((c) => c.c < lower - stdev * 0.2);
    const retestDown = look.slice(-4).some(
      (c) => c.h >= lower - prox && c.h <= lower + stdev * 0.55 && c.c < lower + prox,
    );
    const continuesDown = last.c <= lower && last.c >= lower - stdev * 0.1 && last.c <= last.o;
    if (brokeDown && retestDown && continuesDown && canTake(`Break-retest continuation through −${m}σ`, "down", -m)) {
      return {
        kind: "break_retest",
        side: "down",
        band: m,
        quality: qualityFromBand(m, 0.12),
        label: `Break-retest continuation through −${m}σ`,
        reasons: [
          `Price blew through −${m}σ, retested the band, and continued lower.`,
          "Trade with the continuation, not against it.",
        ],
      };
    }
  }

  const near = nearestBand(last.c, frame);
  if (near && Math.abs(last.c - near.price) <= prox * 1.6) {
    const side: Side | null =
      last.c >= vwap ? (last.c > last.o ? "up" : "down") : last.c < last.o ? "down" : "up";
    return {
      kind: "near_band",
      side,
      band: near.multiplier,
      quality: 0.38,
      label: `Watching ${near.multiplier > 0 ? "+" : ""}${near.multiplier}σ`,
      reasons: [
        `Price is hugging the ${near.multiplier > 0 ? "+" : ""}${near.multiplier}σ band at ${near.price.toFixed(2)}.`,
        "Need a tap-reject or a clean retest-continuation before firing.",
      ],
    };
  }

  return empty;
}

export function bandRun(
  candles: Candle[],
  frame: VwapFrame | null,
): { violent: boolean; bands: number; direction: "down" | "up" | null } {
  if (!frame || !(frame.stdev > 0)) return { violent: false, bands: 0, direction: null };
  const rows = sortAsc(candles).slice(-12);
  if (rows.length < 6) return { violent: false, bands: 0, direction: null };
  const high = Math.max(...rows.map((c) => c.h));
  const low = Math.min(...rows.map((c) => c.l));
  const last = rows[rows.length - 1].c;
  const down = (high - last) / frame.stdev;
  const up = (last - low) / frame.stdev;
  const last4 = rows.slice(-4);
  const downCloses = last4.filter((c) => c.c < c.o).length;
  const upCloses = last4.filter((c) => c.c > c.o).length;
  if (down >= up && downCloses >= 3 && down >= 1.5) {
    return { violent: true, bands: Math.round(down * 10) / 10, direction: "down" };
  }
  if (up > down && upCloses >= 3 && up >= 1.5) {
    return { violent: true, bands: Math.round(up * 10) / 10, direction: "up" };
  }
  return { violent: false, bands: 0, direction: null };
}

export function resample5m(c1m: Candle[]): Candle[] {
  const rows = sortAsc(c1m);
  const buckets = new Map<number, Candle>();
  for (const c of rows) {
    const t = Math.floor(c.t / 300) * 300;
    const prev = buckets.get(t);
    if (!prev) {
      buckets.set(t, { ...c, t });
    } else {
      buckets.set(t, {
        t,
        o: prev.o,
        h: Math.max(prev.h, c.h),
        l: Math.min(prev.l, c.l),
        c: c.c,
        v: prev.v + c.v,
      });
    }
  }
  return [...buckets.values()].sort((a, b) => a.t - b.t);
}
