// The setups. Each looks at the lines + candles and returns {setup, side, line, why} or null. Every number comes from tolerances.
import { closedOnly, resample } from "./lines.js";

const last1m = (bars, now) => { const c = closedOnly(bars, 1, now); return c[c.length - 1] ?? null; };

/** Close through a session band on the last closed 1m candle: opened one side, closed the other. Trade the side it closed on. */
export function closeThrough({ bars, lines, now }) {
  const k = last1m(bars, now);
  if (!k || !lines.sess) return null;
  // the band nearest the close wins when one candle crosses several
  let best = null;
  for (const L of lines.sess.bands) {
    const up = k.o < L.price && k.c > L.price, down = k.o > L.price && k.c < L.price;
    if (!up && !down) continue;
    const gap = Math.abs(k.c - L.price);
    if (!best || gap < best.gap) best = { gap, L, side: up ? "up" : "down" };
  }
  return best && { setup: "closeThrough", side: best.side, line: best.L.name, linePrice: best.L.price, why: `1m closed ${best.side === "up" ? "above" : "below"} ${best.L.name}` };
}

/** Tap-reject: the last closed 1m candle's wick reached a band (within tapReach) and closed back away from it. */
export function tap({ bars, lines, now, asset, tol }) {
  const reach = tol.tapReach?.[asset];
  const k = last1m(bars, now);
  if (reach == null || !k || !lines.sess) return null;
  let best = null;
  for (const L of lines.sess.bands) {
    const fromAbove = k.l <= L.price + reach && k.c > L.price && k.c >= k.o; // wicked down to it, held above, green
    const fromBelow = k.h >= L.price - reach && k.c < L.price && k.c <= k.o; // wicked up to it, held below, red
    if (!fromAbove && !fromBelow) continue;
    const gap = Math.abs(k.c - L.price);
    if (!best || gap < best.gap) best = { gap, L, side: fromAbove ? "up" : "down" };
  }
  return best && { setup: "tap", side: best.side, line: best.L.name, linePrice: best.L.price, why: `tapped ${best.L.name} and rejected ${best.side}` };
}

/** 5m break: the last closed 5m candle closed on one side of a 5m line (pink/red/green) and live price is now
 *  at least breakPush past it on the other side. */
export function break5m({ bars, lines, now, asset, tol, price }) {
  const push = tol.breakPush?.[asset];
  if (push == null || !lines.piv) return null;
  const tf = tol.pivots.timeframeMin;
  const c5 = closedOnly(resample(bars, tf), tf, now);
  const k = c5[c5.length - 1];
  if (!k) return null;
  for (const name of ["pink", "red", "green"]) {
    const p = lines.piv[name];
    if (k.c <= p && price >= p + push) return { setup: "break5m", side: "up", line: name, linePrice: p, why: `broke above ${name} by ${(price - p).toFixed(2)} (push ${push})` };
    if (k.c >= p && price <= p - push) return { setup: "break5m", side: "down", line: name, linePrice: p, why: `broke below ${name} by ${(p - price).toFixed(2)} (push ${push})` };
  }
  return null;
}

export const SETUPS = { closeThrough, tap, break5m };
