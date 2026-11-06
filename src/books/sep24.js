// SEP 24 - her winning day (Sep 24 2026, before 4:10 PM PT: 63 live trades, 73%, +$798), rebuilt fresh.
// Her own band math and reads, copied rule for rule from her band file (vwap.ts: computeVwap + detectPattern) and her
// window-open read (openLook). What made her 70%: the STATS cut (Love Nov 5 2026: "it had that hit rate because we took out
// the set ups that won less than 60% of the time ... we cut the ones that were losing more than they were winning").
// Bars are {t: ms, o, h, l, c, v}. Nothing here places an order; it returns a read.

import { frame } from "./original.js";

export { frame };
const norm = (s) => String(s || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
const asc = (rows) => [...rows].sort((a, b) => a.t - b.t);

/** Her detectPattern. `allow(label, side, band)` replaces her canTake (the stats cut decides). */
export function detect(candles, fr, allow = () => true) {
  const none = { kind: "none", side: null, band: null, label: "No band interaction" };
  if (!fr) return none;
  const rows = asc(candles);
  if (rows.length < 8) return none;
  const recent = rows.slice(-12), last = recent[recent.length - 1], look = recent.slice(-8);
  const { vwap, stdev } = fr;
  const touch = Math.max(stdev * 0.15, vwap * 0.00005), prox = touch;
  const levels = [1.5, 2, 2.5, 1, 3, 0.5];
  const can = (label, side, band) => allow(label, side, band) || (band ? allow(`Open ${band > 0 ? "+" : ""}${band}σ`, side, band) : false);

  for (const m of levels) {
    for (const level of [vwap + m * stdev, vwap - m * stdev]) {
      const name = `${level >= vwap ? "+" : "−"}${m}σ`;
      const band = level >= vwap ? m : -m;
      const earlier = look.slice(-4, -1);
      let approach = null;
      for (let i = earlier.length - 1; i >= 0; i -= 1) {
        if (earlier[i].c > level) { approach = "above"; break; }
        if (earlier[i].c < level) { approach = "below"; break; }
      }
      const tagged = look.slice(-3).some((c) => c.l <= level + touch && c.h >= level - touch) && Math.abs(last.c - level) <= Math.max(touch * 1.6, stdev * 0.22);
      if (!tagged || !approach) continue;
      const label = `Tap-reject at ${name}`;
      if (approach === "above" && last.c >= level - touch * 0.45) { if (can(label, "up", band)) return { kind: "tap_reject", side: "up", band, label, level }; continue; }
      if (approach === "below" && last.c < level) { if (can(label, "down", band)) return { kind: "tap_reject", side: "down", band, label, level }; continue; }
    }
  }
  for (const m of levels) {
    const upper = vwap + m * stdev, lower = vwap - m * stdev;
    const brokeUp = look.slice(0, -2).some((c) => c.c > upper + stdev * 0.2);
    const retestUp = look.slice(-4).some((c) => c.l <= upper + prox && c.l >= upper - stdev * 0.55 && c.c > upper - prox);
    const contUp = last.c >= upper && last.c <= upper + stdev * 0.1 && last.c >= last.o;
    const up = `Break-retest continuation through +${m}σ`;
    if (brokeUp && retestUp && contUp && can(up, "up", m)) return { kind: "break_retest", side: "up", band: m, label: up, level: upper };
    const brokeDown = look.slice(0, -2).some((c) => c.c < lower - stdev * 0.2);
    const retestDown = look.slice(-4).some((c) => c.h >= lower - prox && c.h <= lower + stdev * 0.55 && c.c < lower + prox);
    const contDown = last.c <= lower && last.c >= lower - stdev * 0.1 && last.c <= last.o;
    const dn = `Break-retest continuation through −${m}σ`;
    if (brokeDown && retestDown && contDown && can(dn, "down", -m)) return { kind: "break_retest", side: "down", band: -m, label: dn, level: lower };
  }
  return none; // her "Watching ±σ" (near_band) is a watch, never a take
}

/** Her window-open read: nearest line (VWAP or a band) within 0.35 sigma; long above it, short below it. */
export function openLook(spot, vwap, stdev) {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  let best = null;
  for (const step of [0, 0.5, 1, 1.5, 2, 2.5, 3]) for (const sign of step === 0 ? [0] : [1, -1]) {
    const gap = Math.abs(spot - (vwap + sign * step * stdev));
    if (gap > stdev * 0.35 || (best && gap >= best.gap)) continue;
    best = { gap, step, sign: sign < 0 ? "-" : "+" };
  }
  if (!best) return null;
  const level = vwap + (best.sign === "-" ? -1 : 1) * best.step * stdev;
  return { kind: "open", label: `Open ${best.step === 0 ? "VWAP" : best.sign + best.step + "σ"}`, side: spot >= level ? "up" : "down", level };
}

/** 1m bars -> 5m bars on 5-minute marks. */
export function to5m(bars) {
  const m = new Map();
  for (const c of asc(bars)) {
    const t = Math.floor(c.t / 300000) * 300000, p = m.get(t);
    m.set(t, p ? { t, o: p.o, h: Math.max(p.h, c.h), l: Math.min(p.l, c.l), c: c.c, v: p.v + c.v } : { ...c, t });
  }
  return [...m.values()].sort((a, b) => a.t - b.t);
}

/** THE STATS CUT. A setup (asset + side + label) is cut once it has `minTrades` settled and wins under `minHitPct`,
 *  or (cutIfLosing) has lost more than it won. `minTrades` null = Love hasn't set it: nothing is cut yet. */
export function statsAllow(stats, asset, side, label, cut) {
  if (!cut || cut.minTrades == null) return true;
  const s = stats?.[`${asset}|${side}|${norm(label)}`];
  if (!s || s.n < cut.minTrades) return true;
  if (cut.minHitPct != null && (100 * s.w) / s.n < cut.minHitPct) return false;
  if (cut.cutIfLosing && s.w < s.n - s.w) return false;
  return true;
}

export function statsAdd(stats, asset, side, label, won) {
  const k = `${asset}|${side}|${norm(label)}`;
  const s = stats[k] ?? { n: 0, w: 0 };
  s.n += 1; if (won) s.w += 1;
  stats[k] = s;
  return stats;
}

/** One read for one asset: her 1m read (bands from `band` bars), then her 5m read (last 12 5m bars), then the window-open read.
 *  `bands`: "all" = every bar given (her chart path) or a number = only the last N 1m bars (her 60-minute path). */
export function sep24Read({ asset, bars, secondsLeft, stats, cut, bands = "all" }) {
  const rows = asc(bars);
  if (rows.length < 8) return { take: null, why: "not enough bars" };
  const spot = rows[rows.length - 1].c;
  const f1 = frame(bands === "all" ? rows : rows.slice(-Number(bands)));
  const c5 = to5m(rows);
  const f5 = c5.length ? frame(c5.slice(-12)) : null;
  const allow = (label, side) => statsAllow(stats, asset, side, label, cut);
  const looks = [];
  const p1 = detect(rows, f1, allow); if (p1.side) looks.push({ ...p1, tf: "1m" });
  const p5 = detect(c5, f5, allow); if (p5.side) looks.push({ ...p5, tf: "5m" });
  const op = f1 ? openLook(spot, f1.vwap, f1.stdev) : null;
  if (op && secondsLeft >= 120 && allow(op.label, op.side)) looks.push({ ...op, tf: "1m" });
  return { take: looks[0] ?? null, looks, spot, vwap: f1?.vwap, stdev: f1?.stdev, why: looks.length ? "" : "no band read" };
}
