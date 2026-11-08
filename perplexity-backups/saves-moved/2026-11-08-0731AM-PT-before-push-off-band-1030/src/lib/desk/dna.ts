// HER DNA (Claude, 2026-10-02, Love: "wire the logic into her dna, write it in yourself").
// One law, one place, every book. Nothing in the desk may open a trade that breaks it.
//
//   1. NOTHING IN FRONT. A long never has one of her lines just ABOVE it. A short never has one
//      just BELOW it. "Just" = BTC $100, gold $2.50 (her numbers).
//   2. CLEAR ROAD. No line sits between price and the strike the trade has to reach.
//
// Her lines, from her own chart (data/bands-now.json, refreshed every 10 seconds):
//   session VWAP and every ±0.5σ band out to ±3σ; the purple nav line on 5m / 10m / 15m;
//   and for BTC the nav upper / lower (Bollinger) on 5m / 10m / 15m.
//
// Why it is written fresh instead of patching Grok's guard: Grok's bandInWay only ever looked at
// the σ bands. It never saw the session VWAP itself and never saw a purple or Bollinger line, so a
// long sitting right under the 5m purple sailed through it. ORIGINAL's own notes flagged 33 entries
// with a line right in front of her since last night; 23 of them were purple lines Grok's guard
// could not see.
//
// Price (Claude, 12:10 PM + 1:35 PM, Love: "top of the candle is where she entered long on gold, band
// is $1.38 above" / "still a couple getting through"): one tick is never enough. The law is checked
// from every price of the minute she is entering (quote, band snapshot price, last 1m close, live 1m
// close and its high for a long / low for a short). If ANY of them has a line right in front, she
// passes. Replayed on today: catches all 9 entries her notes flagged, and only 2 others.
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const DNA_REACH: Record<string, number> = { btc: 100, gold: 2.5 }; // fallback only (no ATR yet)
// REACH BREATHES WITH ATR (Claude, Oct 2 ~11:30 PM PT, Love: "work it out to ATR... the band check needs to be
// there... ignore the setups that were flagged for entering into a band"). "Right in front" = k x ATR(14) on 5m.
// Fixed $100 on BTC blocked 100% of prices once σ tightened to ~$67 (lines every ~$34). k is set from today's
// book entries her notes flagged as "entered into a band" (all losers): BTC sat within 0.22 ATR -> 0.25 catches
// 7/7; gold within 0.54 ATR -> 0.6 catches 11/11 (scripts/dna-atr-lab.py). Floor/cap keep it sane.
// TWO DNAs SIDE BY SIDE (Love, Oct 2 ~midnight: "put ALL OF THEM back the way they were after you fixed them...
// and a toggle to see how the new dna x atr performs compared to the fix"). "fixed" = her fix exactly as it ran
// all day (BTC $100 / gold $2.50) and it is what every book, the live guard and every check uses by default.
// "atr" = the breathing reach, run as a twin of every book (rows tagged dnaMode "atr", own toggle on SHIFT).
// "free" (Love, Oct 3 ~12:20 AM PT: "unrestricted, exactly as she was... on all of the different books overnight"):
// the PAPER books trade every window with no DNA gate. Never used by the live guard (that stays "fixed").
// "chan" (Love, Oct 3 ~1:30 AM PT: "set it to 25% of the scale of the channel... she can't trade the 25% closest to
// the band, THAT will be perfect during all of her hours"): the channel = her line below price to her line above
// price (every line she draws). A long can't sit in the top 25% of it, a short can't sit in the bottom 25%.
// Lines sitting on top of each other (closer than 15% of her usual spacing) count as one line.
export type DnaMode = "fixed" | "atr" | "free" | "chan";
export const DNA_CHANNEL_EDGE = 0.25;
export function channelFront(side: "up" | "down", p: number, prices: number[]): { line: number; width: number } | null {
  const xs = [...prices].sort((a, b) => a - b);
  const gaps = xs.slice(1).map((x, i) => x - xs[i]).filter((g) => g > 0).sort((a, b) => a - b);
  const typical = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
  const merged: number[] = [];
  for (const x of xs) {
    if (merged.length && typical > 0 && x - merged[merged.length - 1] < typical * 0.15) continue;
    merged.push(x);
  }
  const above = merged.filter((x) => x > p);
  const below = merged.filter((x) => x <= p);
  const up = above.length ? above[0] : null;
  const dn = below.length ? below[below.length - 1] : null;
  const front = side === "up" ? up : dn;
  if (front == null) return null; // nothing in front at all: open road
  const back = side === "up" ? dn : up;
  const width = back != null ? Math.abs(front - back) : typical;
  return width > 0 ? { line: front, width } : null;
}
export const DNA_ATR_K: Record<string, number> = { btc: 0.25, gold: 0.6 };
const DNA_FLOOR: Record<string, number> = { btc: 15, gold: 1.5 };
const DNA_CAP: Record<string, number> = { btc: 100, gold: 5 };
export function dnaReach(asset: string, b: DnaBands | null | undefined, mode: DnaMode = "fixed"): number {
  if (mode === "fixed") return DNA_REACH[asset] ?? 0;
  const atr = Number(b?.nav?.atr5m) || 0;
  const k = DNA_ATR_K[asset];
  if (!k || !(atr > 0)) return DNA_REACH[asset] ?? 0;
  return Math.min(DNA_CAP[asset], Math.max(DNA_FLOOR[asset], k * atr));
}
type Nav = { c: number; up: number; dn: number } | null | undefined;
export type DnaBands = { vwap?: number | null; sd?: number | null; spot?: number | null; nav?: { m5?: Nav; m10?: Nav; m15?: Nav; close1m?: number | null; live1m?: { h: number; l: number; c: number } | null; atr5m?: number | null } | null };
export type DnaLine = { name: string; price: number };

export function dnaLines(asset: string, b: DnaBands | null | undefined): DnaLine[] {
  const out: DnaLine[] = [];
  const vw = Number(b?.vwap) || 0;
  const sd = Number(b?.sd) || 0;
  if (vw > 0) out.push({ name: "session VWAP", price: vw });
  if (vw > 0 && sd > 0) {
    for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) {
      out.push({ name: `+${k}σ`, price: vw + k * sd });
      out.push({ name: `-${k}σ`, price: vw - k * sd });
    }
  }
  for (const [key, label] of [["m5", "5m"], ["m10", "10m"], ["m15", "15m"]] as const) {
    const f = b?.nav?.[key];
    if (!f) continue;
    if (f.c > 0) out.push({ name: `${label} purple`, price: f.c });
    if (asset === "btc") {
      if (f.up > 0) out.push({ name: `${label} upper`, price: f.up });
      if (f.dn > 0) out.push({ name: `${label} lower`, price: f.dn });
    }
  }
  return out;
}

/** Every price the desk can see for the minute she is entering: latest quote, the band snapshot's
 *  price, the last CLOSED 1-minute candle, and the live 1-minute candle (close, plus its high for a
 *  long / its low for a short: "top of the candle is where she entered"). */
export function dnaPrices(side: "up" | "down", spot: number, b: DnaBands | null | undefined): number[] {
  const lv = b?.nav?.live1m;
  const xs = [spot, Number(b?.spot) || 0, Number(b?.nav?.close1m) || 0, Number(lv?.c) || 0, side === "up" ? Number(lv?.h) || 0 : Number(lv?.l) || 0];
  return xs.filter((x) => x > 0);
}

/** The whole law. Returns the reason she must pass, or null when the trade is clean. */
export function dnaCheck(asset: string, side: "up" | "down", spotIn: number, target: number | null | undefined, b: DnaBands | null | undefined, mode: DnaMode = "fixed"): string | null {
  if (!DNA_REACH[asset] || mode === "free") return null; // only BTC and gold carry the law; "free" = paper, unrestricted
  const reach = dnaReach(asset, b, mode);
  const prices = dnaPrices(side, spotIn, b);
  const spot = spotIn > 0 ? spotIn : prices[0] ?? 0;
  if (!prices.length) return "DNA: no price";
  const lines = dnaLines(asset, b);
  if (!lines.length) return "DNA: her lines could not be read";
  // 1c. CHANNEL (Love's 25%): from every price of the minute, never in the 25% of the channel closest to the line
  //     in front. Since Oct 3 ~9:30 PM PT the road check runs here too (Love: unanimous on all books).
  if (mode === "chan") {
    for (const p of prices) {
      const f = channelFront(side, p, lines.map((l) => l.price));
      if (!f) continue;
      const ahead = side === "up" ? f.line - p : p - f.line;
      if (ahead <= f.width * DNA_CHANNEL_EDGE) {
        const nm = lines.find((l) => Math.abs(l.price - f.line) < 1e-6)?.name ?? "line";
        return `DNA: in the ${Math.round(DNA_CHANNEL_EDGE * 100)}% of the channel closest to the ${nm} (${f.line.toFixed(2)}), ${ahead.toFixed(2)} of ${f.width.toFixed(2)}`;
      }
    }
    // NO BAND IN THE WAY, EVERY BOOK (Love, Oct 3 ~9:30 PM PT: "no trade should be taken if target is on the other side of
    // a band and she has to cross it - IF it breaks thru and closes above she can... unanimous on all books"). Measured from
    // the last CLOSED 1-minute candle as well as the live price: a wick through the band doesn't count, a close does.
    const tRoad = Number(target) || 0;
    if (tRoad > 0) {
      const live = spotIn > 0 ? spotIn : spot;
      const closed = Number(b?.nav?.close1m) || live;
      const at = side === "up" ? Math.min(live, closed) : Math.max(live, closed);
      const mustCross = side === "up" ? tRoad > at : tRoad < at;
      if (mustCross) {
        const lo = Math.min(at, tRoad);
        const hi = Math.max(at, tRoad);
        const wall = lines.find((l) => l.price > lo && l.price < hi);
        if (wall) return `DNA: the ${wall.name} (${wall.price.toFixed(2)}) sits between price and the strike ${tRoad.toFixed(2)}: she has to close through it first`;
      }
    }
    return null;
  }
  // 1. Nothing in front, from EVERY price of the minute: if any one of them has a line right above
  //    the long (right below the short), she passes. One stale tick can no longer sneak her in.
  for (const p of prices) {
    for (const l of lines) {
      const ahead = side === "up" ? l.price - p : p - l.price;
      if (ahead > 0 && ahead <= reach) return `DNA: the ${l.name} (${l.price.toFixed(2)}) is right ${side === "up" ? "above the long" : "below the short"} (reach ${reach.toFixed(2)})`;
    }
  }
  // 2. Clear road to the strike.
  // (the road is measured from the price she is actually at, not the candle's extreme)
  const t = Number(target) || 0;
  const at = spotIn > 0 ? spotIn : spot;
  if (t > 0) {
    const mustCross = side === "up" ? t > at : t < at;
    if (mustCross) {
      const lo = Math.min(at, t);
      const hi = Math.max(at, t);
      const wall = lines.find((l) => l.price > lo && l.price < hi);
      if (wall) return `DNA: the ${wall.name} (${wall.price.toFixed(2)}) sits between price and the strike ${t.toFixed(2)}`;
    }
  }
  return null;
}

/** The same law against her live lines (data/bands-now.json). */
export function dnaNow(asset: string, side: "up" | "down", spot: number, target: number | null | undefined, mode: DnaMode = "fixed"): string | null {
  if (!DNA_REACH[asset]) return null;
  let b: DnaBands | null = null;
  try {
    const now = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"));
    if (now?.at && Date.now() - Date.parse(now.at) > 90000) return "DNA: her lines are stale";
    b = now?.[asset] ?? null;
  } catch {
    return "DNA: her lines could not be read";
  }
  // NO BLIND ENTRIES (Love, Oct 4 ~11:10 AM PT: "why she longed here... definitely within the 25% rule"): if any of her live
  // 5m/10m/15m nav lines is missing, the 25% rule cannot see the line in front, so she does not trade.
  if (mode === "chan" && (!b?.nav?.m5 || !b?.nav?.m10 || !b?.nav?.m15)) return "DNA: her 5m/10m/15m nav lines are missing (feed gap)";
  return dnaCheck(asset, side, spot, target, b, mode);
}

let lastLog = "";
/** Every DNA block, one line each, so you can see exactly what she refused and why. */
export function dnaLog(asset: string, side: string, label: string, ticker: string, why: string, where: string) {
  const key = `${ticker}|${side}|${why}`;
  if (key === lastLog) return;
  lastLog = key;
  try {
    appendFileSync(join(process.cwd(), "data", "dna-blocks.jsonl"), JSON.stringify({ at: new Date().toISOString(), where, asset, side, label, ticker, why }) + "\n");
  } catch {
    // log only
  }
}


// SOLE FRAMES (Love, Oct 3 ~4:40 PM PT: "a book that judges solely off the 5m nav bands and the session bands... one
// solely off the 15m... throw a 10 in"). Her 25% channel rule with ONLY the session VWAP/σ bands + ONE nav frame
// (purple, upper, lower), so lines from the other frames can't contradict the read.
export function dnaNowFrame(asset: string, side: "up" | "down", spot: number, target: number | null | undefined, frame: "m5" | "m10" | "m15"): string | null {
  if (!DNA_REACH[asset]) return null;
  let b: DnaBands | null = null;
  try {
    const now = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"));
    if (now?.at && Date.now() - Date.parse(now.at) > 90000) return "DNA: her lines are stale";
    b = now?.[asset] ?? null;
  } catch {
    return "DNA: her lines could not be read";
  }
  return dnaFrameCheck(asset, side, spot, target, b, frame);
}
/** SOLE frame law on any set of lines (the desk's Pepperstone lines, or the Vantage twin's). */
export function dnaFrameCheck(asset: string, side: "up" | "down", spot: number, target: number | null | undefined, b: DnaBands | null, frame: "m5" | "m10" | "m15"): string | null {
  if (!b) return "DNA: her lines could not be read";
  const nav = b.nav ?? {};
  if (!nav[frame]) return `DNA: her ${frame.slice(1)}m nav lines are missing (feed gap)`;
  const only: DnaBands = { ...b, nav: { ...nav, m5: frame === "m5" ? nav.m5 : null, m10: frame === "m10" ? nav.m10 : null, m15: frame === "m15" ? nav.m15 : null } };
  const why = dnaCheck(asset, side, spot, target, only, "chan");
  if (why) return why;
  // NO BAND IN THE WAY (Love, Oct 3 ~6:40 PM PT: "yes no band in the way 100%"): when the strike is on the far side of
  // price, none of this book's lines (session bands + its one nav frame) may sit between price and the strike. A trade
  // already on the winning side of the strike is never affected.
  const t = Number(target) || 0;
  const at = spot > 0 ? spot : Number(only.spot) || 0;
  if (t > 0 && at > 0 && (side === "up" ? t > at : t < at)) {
    const lo = Math.min(at, t);
    const hi = Math.max(at, t);
    const wall = dnaLines(asset, only).find((l) => l.price > lo && l.price < hi);
    if (wall) return `DNA: the ${wall.name} (${wall.price.toFixed(2)}) sits between price and the strike ${t.toFixed(2)}`;
  }
  return null;
}

// SOLE ZONE (Love, Oct 3 ~7 PM PT: "if the nav bar and the session bands line up, have her not short there UNLESS it
// breaks thru the purple band too"). A session line and one of this frame's nav lines within 0.2 sd of each other form
// one zone. She won't trade while price sits inside the zone, or when the zone is the line in front and price is in the
// 50% of the channel closest to it. Once price has broken through the whole zone, it is behind her and she is free.
export function dnaZone(asset: string, side: "up" | "down", spot: number, frame: "m5" | "m10" | "m15"): string | null {
  let b: DnaBands | null = null;
  try {
    b = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.[asset] ?? null;
  } catch {
    return null;
  }
  const vw = Number(b?.vwap) || 0;
  const sd = Number(b?.sd) || 0;
  const f = b?.nav?.[frame];
  if (!(vw > 0 && sd > 0 && f && spot > 0)) return null;
  const sess: DnaLine[] = [{ name: "session VWAP", price: vw }];
  for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) sess.push({ name: `+${k}σ`, price: vw + k * sd }, { name: `-${k}σ`, price: vw - k * sd });
  const label = frame.replace("m", "") + "m";
  const nav: DnaLine[] = [{ name: `${label} purple`, price: f.c }, { name: `${label} upper`, price: f.up }, { name: `${label} lower`, price: f.dn }].filter((l) => l.price > 0);
  const all = [...sess, ...nav].map((l) => l.price).sort((x, y) => x - y);
  for (const s of sess) {
    for (const n of nav) {
      if (Math.abs(s.price - n.price) > 0.08 * sd) continue; // "the same place": 0.08 sd (~$4 BTC); 0.2 sd was too loose
      const lo = Math.min(s.price, n.price);
      const hi = Math.max(s.price, n.price);
      const nm = `${s.name} + ${n.name}`;
      if (spot >= lo && spot <= hi) return `ZONE: sitting inside the ${nm} (${lo.toFixed(2)}-${hi.toFixed(2)}), not broken through`;
      const edge = side === "up" ? lo : hi;
      const inFront = side === "up" ? lo > spot : hi < spot;
      if (!inFront) continue;
      const nearer = all.filter((p) => (side === "up" ? p > spot && p < lo : p < spot && p > hi));
      if (nearer.length) continue; // another line comes first
      const behind = all.filter((p) => (side === "up" ? p <= spot : p >= spot));
      const back = behind.length ? (side === "up" ? Math.max(...behind) : Math.min(...behind)) : null;
      const ahead = Math.abs(edge - spot);
      const width = back != null ? Math.abs(edge - back) : ahead * 2;
      if (ahead <= width * 0.5) return `ZONE: the ${nm} lines up right ${side === "up" ? "above the long" : "below the short"} (${ahead.toFixed(2)} of ${width.toFixed(2)})`;
    }
  }
  return null;
}
