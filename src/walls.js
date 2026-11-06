// The walls. Each returns null (clear) or the exact reason, with the numbers. A wall whose tolerance is null is OFF.
import { channel } from "./lines.js";

export function priceFresh({ priceAgeSec, tol }) {
  const max = tol.maxPriceAgeSec;
  return max != null && !(priceAgeSec <= max) ? `price is ${priceAgeSec?.toFixed(1)}s old (max ${max}s)` : null;
}

export function timeLeft({ secondsLeft, tol }) {
  const min = tol.minSecondsLeft;
  return min != null && secondsLeft < min ? `${secondsLeft}s left (needs ${min}s)` : null;
}

export function maxAsk({ askCents, tol }) {
  if (!(askCents > 0)) return "no ask on Kalshi";
  if (askCents > tol.maxAskCents) return `ask ${askCents}c is over the ${tol.maxAskCents}c floor`;
  if (tol.minAskCents != null && askCents < tol.minAskCents) return `ask ${askCents}c is under the ${tol.minAskCents}c minimum`;
  return null;
}

/** Into-band wall: a session band ahead of the trade, within $X of price. */
export function intoBand({ look, price, lines, asset, tol }) {
  const reach = tol.intoBandWall?.[asset];
  if (reach == null || !lines.sess) return null;
  for (const L of lines.sess.bands) {
    if (Math.abs(L.price - look.linePrice) < 1e-9) continue; // the band she is trading off is not in her way
    const ahead = look.side === "up" ? L.price - price : price - L.price;
    if (ahead > 0 && ahead <= reach) return `${L.name} is ${ahead.toFixed(2)} ahead (wall ${reach})`;
  }
  return null;
}

/** Her thirds share for a channel this wide (sliding scale). */
export function thirdsShare(asset, width, tol) {
  for (const [upTo, pct] of tol.thirds.scale[asset] ?? []) if (upTo == null || width <= upTo) return pct;
  return null;
}

/** The session-band channel price is in, as drawn, for this side. A band price crossed by less than `passed`
 *  still stands in front of the trade (it is not passed yet). */
export function herChannel(price, bands, passed, side) {
  const pivot = side === "up" ? price - passed : price + passed;
  let below = null, above = null;
  for (const L of bands) {
    const isBelow = side === "up" ? L.price <= pivot : L.price < pivot;
    if (isBelow && (!below || L.price > below.price)) below = L;
    if (!isBelow && (!above || L.price < above.price)) above = L;
  }
  if (!below || !above) return null;
  const width = above.price - below.price;
  return { below, above, width, pos: (price - below.price) / width };
}

/** Thirds wall: no long in the top share, no short in the bottom share, refused marginPct early, session band to session band. */
export function channelWall({ look, price, lines, asset, tol }) {
  if (!tol.thirds || !lines.sess) return null;
  const ch = herChannel(price, lines.sess.bands, tol.thirds.bandPassed?.[asset] ?? 0, look.side);
  if (!ch) return null;
  const share = thirdsShare(asset, ch.width, tol);
  if (share == null) return null;
  const m = tol.thirds.marginPct || 0, limit = (share + m) / 100, at = Math.round(ch.pos * 100);
  const where = `${ch.below.name}..${ch.above.name} ($${ch.width.toFixed(2)} wide)`;
  if (look.side === "up" && ch.pos >= 1 - limit) return `long at ${at}% of ${where}: top ${share}% (+${m}% margin) is walled`;
  if (look.side === "down" && ch.pos <= limit) return `short at ${at}% of ${where}: bottom ${share}% (+${m}% margin) is walled`;
  return null;
}

/** In order. The first wall that says no is the reason logged. */
export const WALLS = [priceFresh, timeLeft, maxAsk, intoBand, channelWall];
