// Every line she trades off, computed ONCE per pass from closed + live 1m bars. Bars: {t (ms, bar open), o, h, l, c, v}.

/** Group 1m bars into N-minute bars (UTC-aligned buckets, same as the chart). */
export function resample(bars, mins) {
  const span = mins * 60000, out = [];
  for (const b of bars) {
    const t = Math.floor(b.t / span) * span, last = out[out.length - 1];
    if (last && last.t === t) { last.h = Math.max(last.h, b.h); last.l = Math.min(last.l, b.l); last.c = b.c; last.v += b.v || 0; }
    else out.push({ t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v || 0 });
  }
  return out;
}

/** Only bars whose time is fully over. */
export const closedOnly = (bars, mins, now) => bars.filter((b) => b.t + mins * 60000 <= now);

/** Session VWAP (hlc3, volume weighted; equal weights if the feed has no volume) and its standard deviation. */
export function sessionVwap(bars1m, sessionStart, steps) {
  const rows = bars1m.filter((b) => b.t >= sessionStart);
  if (!rows.length) return null;
  const hasVol = rows.some((b) => b.v > 0);
  let pv = 0, w = 0;
  for (const b of rows) { const tp = (b.h + b.l + b.c) / 3, wt = hasVol ? b.v : 1; pv += tp * wt; w += wt; }
  if (!(w > 0)) return null;
  const vwap = pv / w;
  let acc = 0;
  for (const b of rows) { const tp = (b.h + b.l + b.c) / 3, wt = hasVol ? b.v : 1; acc += wt * (tp - vwap) ** 2; }
  const sd = Math.sqrt(acc / w);
  const bands = [{ name: "VWAP", price: vwap, step: 0 }];
  for (const s of steps) bands.push({ name: `+${s}σ`, price: vwap + s * sd, step: s }, { name: `-${s}σ`, price: vwap - s * sd, step: -s });
  bands.sort((a, b) => a.price - b.price);
  return { vwap, sd, bands, weighted: hasVol, bars: rows.length };
}

/** Rolling VWAP over the last N minutes (no session reset), with the same half-sigma bands. */
export function rollingVwap(bars1m, minutes, steps, now) {
  if (!(minutes > 0)) return null;
  const s = sessionVwap(bars1m, now - minutes * 60000, steps);
  return s && { ...s, bands: s.bands.map((b) => ({ ...b, name: `roll ${b.name}` })), minutes };
}

/** 5m pivot bands: pink = EMA(hlc3) over closed bars, red = pink + average high-low of the last N, green = pink - it. */
export function pivots(bars1m, { timeframeMin, emaLength, rangeBars }, now) {
  const closed = closedOnly(resample(bars1m, timeframeMin), timeframeMin, now);
  if (closed.length < Math.max(emaLength, rangeBars) + 1) return null;
  const k = 2 / (emaLength + 1);
  let ema = null;
  for (const b of closed) { const tp = (b.h + b.l + b.c) / 3; ema = ema == null ? tp : tp * k + ema * (1 - k); }
  const rng = closed.slice(-rangeBars).reduce((s, b) => s + (b.h - b.l), 0) / rangeBars;
  return { pink: ema, red: ema + rng, green: ema - rng, r2: ema + 2 * rng, s2: ema - 2 * rng, range: rng, asOf: closed[closed.length - 1].t };
}

/** Bollinger on N-minute closes (closed bars plus the live one, like the chart). */
export function bollinger(bars1m, { timeframeMin, length, mult }) {
  const bars = resample(bars1m, timeframeMin);
  if (bars.length < length) return null;
  const closes = bars.slice(-length).map((b) => b.c);
  const mid = closes.reduce((s, c) => s + c, 0) / length;
  const sd = Math.sqrt(closes.reduce((s, c) => s + (c - mid) ** 2, 0) / length);
  return { mid, upper: mid + mult * sd, lower: mid - mult * sd };
}

/** The channel price sits in: the line just below and just above, from ALL her lines. One channel, shared by every rule. */
export function channel(price, levels) {
  let below = null, above = null;
  for (const L of levels) {
    if (L.price <= price && (!below || L.price > below.price)) below = L;
    if (L.price > price && (!above || L.price < above.price)) above = L;
  }
  const width = below && above ? above.price - below.price : null;
  const pos = width ? (price - below.price) / width : null; // 0 = at the floor, 1 = at the ceiling
  return { below, above, width, pos };
}

/** Everything for one asset at one moment. */
export function drawLines(bars1m, tol, sessionStart, now) {
  const sess = sessionVwap(bars1m, sessionStart, tol.bands.steps);
  const piv = pivots(bars1m, tol.pivots, now);
  const bb = bollinger(bars1m, tol.bollinger);
  const roll = rollingVwap(bars1m, tol.rollingVwap?.minutes, tol.bands.steps, now);
  const levels = [...(sess?.bands ?? [])];
  if (piv) levels.push({ name: "pink", price: piv.pink, pivot: true }, { name: "red", price: piv.red, pivot: true }, { name: "green", price: piv.green, pivot: true });
  return { sess, roll, piv, bb, levels };
}
