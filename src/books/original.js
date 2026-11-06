// THE ORIGINAL (desk-project, LOCKED SPINE Sep 27, as it ran Oct 1) - entry brain, rewritten fresh, behaviour-identical.
// Every number below is the original's own. Proven against the original code by test/original-equivalence (same bars in,
// same call out). Bars here are {t: ms, o, h, l, c, v}; ask prices are dollars (0.55 = 55c) like the original.

export const STEPS = [0.5, 1, 1.5, 2, 2.5, 3];
export const SETTINGS = { minMultiple: 1.38, maxMultiple: 4.5, defaultExitPct: 45 };
export const THROUGH = { btc: 400, gold: 12 };

const norm = (s) => String(s || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();

/** The original's VWAP frame: volume-weighted hlc3 (equal weights when the feed has no volume), sigma floored at 0.015% of VWAP. */
export function frame(candles) {
  const rows = [...candles].sort((a, b) => a.t - b.t).filter((c) => Number.isFinite(c.c));
  if (rows.length < 8) return null;
  let pv = 0, vol = 0, tw = 0;
  for (const c of rows) { const tp = (c.h + c.l + c.c) / 3; pv += tp * c.v; vol += c.v; tw += tp; }
  const twap = tw / rows.length, useV = vol > 0 && pv > 0, vwap = useV ? pv / vol : twap;
  let acc = 0, w = 0;
  for (const c of rows) { const tp = (c.h + c.l + c.c) / 3, wt = useV ? c.v : 1; acc += wt * (tp - vwap) ** 2; w += wt; }
  const sd = w > 0 ? Math.sqrt(acc / w) : 0;
  const stdev = Math.max(sd, vwap * 0.00015);
  const bands = [];
  for (const m of STEPS) bands.push({ multiplier: -m, price: vwap - m * stdev }, { multiplier: m, price: vwap + m * stdev });
  bands.sort((a, b) => a.price - b.price);
  return { vwap, stdev, bands };
}

/** The original's only three setups. */
export function winningSetup(label, side) {
  const t = norm(label);
  return /^tap-reject at /i.test(t) || (side === "up" && /^close above /i.test(t)) || (side === "down" && /^close below /i.test(t));
}
const shortTap = (label, side) => (side === "up" || side === "down") && /^(tap-reject at |close above |close below )/i.test(norm(label));

export function bandReach(asset, stdev = 0) {
  if (asset === "btc") return stdev > 0 ? Math.round(Math.max(40, stdev * 0.4)) : 30;
  if (asset === "gold") return 2;
  return 0;
}

/** A band ahead of the trade within her reach (the band she trades off, `skip`, does not count). */
export function bandInWay(side, spot, vwap, stdev, asset, skip = 0) {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return false;
  const reach = bandReach(asset, stdev);
  let above = Infinity, below = Infinity;
  for (const step of STEPS) for (const level of [vwap + step * stdev, vwap - step * stdev]) {
    if (skip > 0 && Math.abs(level - skip) <= Math.max(0.05, stdev * 0.02)) continue;
    if (level > spot) above = Math.min(above, level - spot);
    if (level < spot) below = Math.min(below, spot - level);
  }
  return (side === "up" ? above : below) <= reach;
}

function levelsOf(vwap, stdev) {
  const out = [{ price: vwap, name: "VWAP", band: 0 }];
  for (const s of STEPS) out.push({ price: vwap + s * stdev, name: `+${s}σ`, band: s }, { price: vwap - s * stdev, name: `-${s}σ`, band: -s });
  return out;
}
const pack = (side, L, why, label) => ({ kind: "tap_reject", side, band: L.band, quality: 0.86, label, reasons: [why] });

/** The spine read (spine-ready.ts). `formingIsLast`: the original compared a ms clock to a seconds bar time, so it never
 *  set the forming bar aside - the live bar was read as the last candle. True = exactly as it ran. */
export function readySpine(asset, candles, vwap, stdev, spot, target = 0, now = Date.now(), formingIsLast = true) {
  if (asset !== "btc" && asset !== "gold") return null;
  if (!(vwap > 0) || !(stdev > 0) || !(spot > 0) || candles.length < 2) return null;
  const open = candles[candles.length - 1];
  const forming = !formingIsLast && open.t > 0 && now - open.t < 50000;
  const book = forming ? candles.slice(0, -1) : candles;
  if (book.length < 2) return null;
  const last = book[book.length - 1], prev = book[book.length - 2];
  if (!(last?.c > 0) || !(prev?.c > 0)) return null;
  const gold = asset === "gold";
  const zone = Math.max(stdev * 0.4, gold ? 1.5 : 0);
  const levels = levelsOf(vwap, stdev), now$ = spot;
  const inTheWay = (side, skip, reach) => levels.some((L) => {
    if (Math.abs(L.price - skip) < 1e-8) return false;
    return side === "up" ? L.price > now$ && L.price - now$ <= reach : L.price < now$ && now$ - L.price <= reach;
  });
  let best = null;
  const far = asset === "btc" && target > 0 && Math.abs(now$ - target) > 100;
  const wall = bandReach(asset, stdev);
  for (const L of levels) {
    const room = far ? Infinity : stdev;
    const above = now$ > L.price && now$ - L.price <= room, below = now$ < L.price && L.price - now$ <= room;
    const prior = book.slice(-5, -1);
    const brokeThenUp = prior.some((c) => c.o < L.price && c.c > L.price);
    const brokeThenDown = prior.some((c) => c.o > L.price && c.c < L.price);
    const rejectUp = last.l <= L.price + zone && last.c > L.price && last.c >= last.o && (last.o >= L.price - zone || brokeThenUp);
    const rejectDown = last.h >= L.price - zone && last.c < L.price && last.c <= last.o && (last.o <= L.price + zone || brokeThenDown);
    const liveUp = last.l <= L.price + zone && now$ > L.price && now$ + 1e-9 >= last.c;
    const liveDown = last.h >= L.price - zone && now$ < L.price && now$ <= last.c + 1e-9 && last.c <= last.o;
    const heldUp = prev.c > L.price && prev.c >= prev.o && prev.l <= L.price + zone && last.c > L.price;
    const heldDown = prev.c < L.price && prev.c <= prev.o && prev.h >= L.price - zone && last.c < L.price;
    if (above && (rejectUp || liveUp || heldUp) && !inTheWay("up", L.price, wall)) {
      const gap = now$ - L.price;
      if (!best || gap < best.gap) best = { gap, p: pack("up", L, `Rejected ${L.name} and turned up. That is a long.`, `Tap-reject at ${L.name}`) };
    }
    if (below && (rejectDown || liveDown || heldDown) && !inTheWay("down", L.price, wall)) {
      const gap = L.price - now$;
      if (!best || gap < best.gap) best = { gap, p: pack("down", L, `Rejected ${L.name} and turned down. That is a short.`, `Tap-reject at ${L.name}`) };
    }
  }
  if (best?.p.side === "down") return best.p;
  for (const L of levels) {
    if (!(now$ < L.price) || (!far && L.price - now$ > stdev)) continue;
    const tagged = last.h >= L.price - zone && last.c < L.price && last.c <= last.o;
    if (tagged && !inTheWay("down", L.price, wall)) {
      const gap = L.price - now$;
      if (!best || best.p.side !== "down" || gap < best.gap) best = { gap, p: pack("down", L, `Rejected ${L.name} and kept falling. That is a short.`, `Tap-reject at ${L.name}`) };
    }
  }
  return best?.p ?? null;
}

const EMPTY = { kind: "none", side: null, band: null, quality: 0, label: "No band interaction", reasons: [] };
const qualityFromBand = (m, extra) => Math.max(0.35, Math.min(0.95, 0.45 + Math.min(1, Math.abs(m) / 2.5) * 0.35 + extra));
const canTake = (label, side, band) => winningSetup(label, side) || (band ? winningSetup(`Open ${band > 0 ? "+" : ""}${band}σ`, side) : false);

/** The original's frame pattern reader (vwap.ts detectPattern), used on the 5m frame. */
export function detectPattern(candles, f) {
  if (!f) return EMPTY;
  const rows = [...candles].sort((a, b) => a.t - b.t);
  if (rows.length < 8) return EMPTY;
  const recent = rows.slice(-12), last = recent[recent.length - 1], look = recent.slice(-8);
  const { vwap, stdev } = f;
  const touch = Math.max(stdev * 0.15, vwap * 0.00005), prox = touch;
  const levels = [1.5, 2, 2.5, 1, 3, 0.5];
  for (const m of levels) {
    for (const level of [vwap + m * stdev, vwap - m * stdev]) {
      const name = `${level >= vwap ? "+" : "−"}${m}σ`;
      const earlier = look.slice(-4, -1);
      let approach = null;
      for (let i = earlier.length - 1; i >= 0; i -= 1) {
        if (earlier[i].c > level) { approach = "above"; break; }
        if (earlier[i].c < level) { approach = "below"; break; }
      }
      const tagged = look.slice(-3).some((c) => c.l <= level + touch && c.h >= level - touch) && Math.abs(last.c - level) <= Math.max(touch * 1.6, stdev * 0.22);
      if (!tagged || !approach) continue;
      const band = level >= vwap ? m : -m;
      if (approach === "above" && last.c >= level - touch * 0.45) {
        const p = { kind: "tap_reject", side: "up", band, quality: qualityFromBand(Math.max(m, 0.5), 0.04), label: `Tap-reject at ${name}`, reasons: [] };
        if (canTake(p.label, p.side, band)) return p;
        continue;
      }
      if (approach === "below" && last.c < level) {
        const p = { kind: "tap_reject", side: "down", band, quality: qualityFromBand(Math.max(m, 0.5), 0.04), label: `Tap-reject at ${name}`, reasons: [] };
        if (canTake(p.label, p.side, band)) return p;
        continue;
      }
    }
  }
  // break-retest labels are never on her list (canTake fails), so that branch can never return; it is left out.
  let near = null, dist = Infinity;
  for (const b of f.bands) { const d = Math.abs(last.c - b.price); if (d < dist) { near = b; dist = d; } }
  if (near && Math.abs(last.c - near.price) <= prox * 1.6) {
    const side = last.c >= vwap ? (last.c > last.o ? "up" : "down") : last.c < last.o ? "down" : "up";
    return { kind: "near_band", side, band: near.multiplier, quality: 0.38, label: `Watching ${near.multiplier > 0 ? "+" : ""}${near.multiplier}σ`, reasons: [] };
  }
  return EMPTY;
}

export function bandRun(candles, f) {
  if (!f || !(f.stdev > 0)) return { violent: false, bands: 0, direction: null };
  const rows = [...candles].sort((a, b) => a.t - b.t).slice(-12);
  if (rows.length < 6) return { violent: false, bands: 0, direction: null };
  const high = Math.max(...rows.map((c) => c.h)), low = Math.min(...rows.map((c) => c.l)), last = rows[rows.length - 1].c;
  const down = (high - last) / f.stdev, up = (last - low) / f.stdev, last4 = rows.slice(-4);
  const dn = last4.filter((c) => c.c < c.o).length, upc = last4.filter((c) => c.c > c.o).length;
  if (down >= up && dn >= 3 && down >= 1.5) return { violent: true, bands: Math.round(down * 10) / 10, direction: "down" };
  if (up > down && upc >= 3 && up >= 1.5) return { violent: true, bands: Math.round(up * 10) / 10, direction: "up" };
  return { violent: false, bands: 0, direction: null };
}

export function resample5m(c) {
  const out = new Map();
  for (const x of [...c].sort((a, b) => a.t - b.t)) {
    const t = Math.floor(x.t / 300000) * 300000, p = out.get(t);
    out.set(t, p ? { t, o: p.o, h: Math.max(p.h, x.h), l: Math.min(p.l, x.l), c: x.c, v: p.v + x.v } : { ...x, t });
  }
  return [...out.values()].sort((a, b) => a.t - b.t);
}

export const clockFloor = (s) => (s > 600 ? 1.6 : s > 420 ? 1.52 : s > 300 ? 1.38 : 1.28);
const actionable = (p) => p.kind === "tap_reject" || p.kind === "break_retest";

/** setup.ts buildSetup: the price/clock rules on top of the read. market asks in dollars. */
export function buildSetup({ asset, market, pattern1m, pattern5m, secondsLeft, delta, settings = SETTINGS }) {
  if (!market?.ticker || secondsLeft < 30) return null;
  const primary = actionable(pattern1m) ? pattern1m : actionable(pattern5m) ? pattern5m : pattern1m.kind === "near_band" ? pattern1m : EMPTY;
  if (!primary.side || primary.kind === "none") return null;
  const side = primary.side, chosen = primary; // "Open ±mσ" relabels are never on her list, so the chosen read stays as is
  if (!winningSetup(chosen.label, side)) return null;
  const ask = side === "up" ? market.yesAsk : market.noAsk;
  const throughNow = delta != null && ((side === "up" && delta > 0) || (side === "down" && delta < 0));
  const tap = shortTap(chosen.label, side);
  const lateClear = throughNow && tap;
  const maxAsk = tap ? 1 / 1.28 : lateClear ? 1 / 1.2 : 0.74, minAsk = tap ? 0.02 : 0.08;
  if (!(ask >= minAsk && ask <= maxAsk + 1e-9)) return null;
  const multiple = 1 / ask;
  if (tap && multiple > 1.75) return null;
  const floor = clockFloor(secondsLeft);
  const openBand = secondsLeft >= 120 && multiple >= 1.8 && chosen.kind !== "near_band";
  const early = !lateClear && !openBand && secondsLeft >= 120 && multiple + 1e-9 < floor;
  if (multiple < settings.minMultiple && chosen.kind === "near_band") return null;
  const tapReady = tap && multiple + 1e-9 >= 1.38, tapLate = tap && multiple + 1e-9 >= 1.28 && secondsLeft <= 300;
  const watchOnly = (tap && !tapReady && !tapLate) ||
    (!tap && !lateClear && !/^close above /i.test(norm(chosen.label)) && !/^close below /i.test(chosen.label) && (chosen.kind === "near_band" || multiple < settings.minMultiple || early));
  return { id: `${market.ticker}:${side}:${chosen.kind}:${chosen.band ?? 0}`, asset, ticker: market.ticker, side, pattern: chosen, ask, multiple, watchOnly, early, floor };
}

/** Gold's book is closed 2:00-2:59 PM Pacific. */
export function goldBookClosed(at) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date(at))) === 14;
}

/** One asset, one moment: the original's whole read (scan.ts) -> setup, or why not. */
export function originalRead({ asset, candles, market, target, secondsLeft, now = Date.now(), formingIsLast = true }) {
  const sorted = [...candles].sort((a, b) => a.t - b.t);
  const last = sorted[sorted.length - 1];
  const spot = last?.c ?? 0;
  const f1 = sorted.length ? frame(sorted) : null;
  const c5 = sorted.length ? resample5m(sorted) : [];
  const f5 = c5.length ? frame(c5.slice(-12)) : null;
  let pattern1m = EMPTY;
  const pattern5m = c5.length ? detectPattern(c5, f5) : EMPTY;
  if (f1 && spot > 0) {
    pattern1m = readySpine(asset, sorted, f1.vwap, f1.stdev, spot, target ?? 0, now, formingIsLast) ?? EMPTY;
    if (pattern1m.side && bandInWay(pattern1m.side, spot, f1.vwap, f1.stdev, asset)) pattern1m = EMPTY;
  }
  const delta = target != null && spot > 0 ? spot - target : null;
  let setup = buildSetup({ asset, market, pattern1m, pattern5m, secondsLeft, delta });
  if (setup && setup.pattern.kind !== "tap_reject") {
    const run = bandRun(sorted, f1);
    if (run.violent && run.bands < 2) setup = { ...setup, watchOnly: true, why: `knife: ${run.bands} bands ${run.direction}` };
  }
  if (asset === "gold" && goldBookClosed(now) && setup) setup = { ...setup, watchOnly: true, why: "gold book closed 2-3 PM PT" };
  return { spot, f1, f5, pattern1m, pattern5m, setup };
}

/** engine.ts paper entry: skip the last 2 minutes, watch-only, the other side already held, then bandInWay at the fill. */
export function originalTake(read, { asset, secondsLeft, heldSide }) {
  const s = read.setup;
  if (secondsLeft > 0 && secondsLeft < 120) return { take: null, why: "last 2 minutes" };
  if (!s) return { take: null, why: "no setup" };
  if (s.watchOnly) return { take: null, why: s.why || (s.early ? `waiting for ${s.floor}x` : "watching") };
  if (heldSide && heldSide !== s.side) return { take: null, why: "other side already held this window" };
  if (!(s.pattern.kind === "tap_reject" || s.pattern.kind === "break_retest")) return { take: null, why: "not a study setup" };
  if (bandInWay(s.side, read.spot, read.f1?.vwap || read.f5?.vwap || 0, read.f1?.stdev || read.f5?.stdev || 0, asset)) return { take: null, why: "band in the way" };
  return { take: s };
}
