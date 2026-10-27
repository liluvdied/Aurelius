// SNAPBACK · TVC LINES (Claude, Oct 9 ~11:45 AM PT, Love: "let's run another book, with snapback set on the new chart
// you find for us that respects lines best"). Silver feed lab (Sep 15 - Oct 9, 5m): TVC:SILVER's lines held 64% of
// touches vs 50-54% on Pepperstone / OANDA / FX / Vantage / IC Markets / Capital.com (gold: TVC is already her chart).
// Snapback look-back Sep 21 - Oct 9 on Kalshi prices: silver 185 trades 59% +$819; with the TVC lines filter below
// 67 trades 67% +$565. Gold 269 trades 57% +$990; with the filter 80 trades 62.5% +$500.
// FILTER (read on the last three CLOSED 5-minute TVC bars before entry): price tagged one of her lines (session VWAP from
// 5 PM ET, +/-0.5 sigma steps to +/-3 sigma, or the 5m purple nav center) in the decided candle's direction and closed
// back the other side of it (a rejection), AND price is not stretched 1 sigma or more past VWAP in that direction.
// Paper only. This module only reads charts; nightbook.ts books the trades.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
export type SnapLine = { at: number; barEnd: number; up: { tag: boolean; z: number }; down: { tag: boolean; z: number } };
const g = globalThis as unknown as { __snapLines?: Record<string, SnapLine>; __snapLinesBusy?: boolean; __snapLinesAt?: number };
const SYM: Record<string, string> = { gold: "TVC:GOLD", silver: "TVC:SILVER" };
function sessStart(t: number) {
  const et = new Date(new Date(t * 1000).toLocaleString("en-US", { timeZone: "America/New_York" }));
  const offset = new Date(t * 1000).getTime() - et.getTime();
  const s = new Date(et); s.setHours(17, 0, 0, 0);
  if (et < s) s.setDate(s.getDate() - 1);
  return Math.round((s.getTime() + offset) / 1000);
}
function build(bars: Bar[]) {
  const out: { t: number; h: number; l: number; c: number; vw: number; sd: number; nav: number; n: number }[] = [];
  let cur = -1, pv = 0, vv = 0, sq = 0;
  let hist: [number, number][] = [];
  for (const b of bars) {
    const s0 = sessStart(b.t);
    if (s0 !== cur) { cur = s0; pv = 0; vv = 0; sq = 0; hist = []; }
    const w = b.v > 0 ? b.v : 1;
    const tp = (b.h + b.l + b.c) / 3;
    pv += tp * w; vv += w; sq += w * tp * tp; hist.push([tp, w]);
    const vw = pv / vv;
    const sd = Math.sqrt(Math.max(sq / vv - vw * vw, 0));
    const last = hist.slice(-7);
    const nav = last.reduce((a, x) => a + x[0] * x[1], 0) / last.reduce((a, x) => a + x[1], 0);
    out.push({ t: b.t, h: b.h, l: b.l, c: b.c, vw, sd, nav, n: hist.length });
  }
  return out;
}
const lines = (vw: number, sd: number, nav: number) => [...(sd > 0 ? Array.from({ length: 13 }, (_, i) => vw + ((i - 6) / 2) * sd) : [vw]), nav];
export function snapLineRead(bars: Bar[], nowSec: number): SnapLine | null {
  const b = build(bars.filter((x) => x.t + 300 <= nowSec));
  const i = b.length - 1;
  if (i < 3 || b[i].n < 6 || !(b[i].sd > 0)) return null;
  const one = (d: 1 | -1) => {
    let tag = false;
    for (let j = i - 2; j <= i; j += 1) {
      const p = b[j - 1];
      for (const x of lines(p.vw, p.sd, p.nav)) {
        if (d === 1 && b[j].h >= x && x > b[j].c && p.c < x) tag = true;
        if (d === -1 && b[j].l <= x && x < b[j].c && p.c > x) tag = true;
      }
    }
    return { tag, z: Math.round(((b[i].c - b[i].vw) / b[i].sd) * d * 100) / 100 };
  };
  return { at: Date.now(), barEnd: b[i].t + 300, up: one(1), down: one(-1) };
}
export function snapLines(): Record<string, SnapLine> {
  return g.__snapLines || {};
}
// Refreshed from navtape every tick, at most every 20 s.
export async function snapLinesTick() {
  if (g.__snapLinesBusy || Date.now() - (g.__snapLinesAt || 0) < 20000) return;
  g.__snapLinesBusy = true;
  g.__snapLinesAt = Date.now();
  try {
    const next = { ...(g.__snapLines || {}) };
    for (const [asset, sym] of Object.entries(SYM)) {
      try {
        const bars = await chartRaw(sym, "5", 300);
        const r = snapLineRead(bars as Bar[], Math.floor(Date.now() / 1000));
        if (r) next[asset] = r;
      } catch {
      }
    }
    g.__snapLines = next;
    try { writeFileSync(join(process.cwd(), "data", "snap-lines.json"), JSON.stringify(next)); } catch {}
  } finally {
    g.__snapLinesBusy = false;
  }
}
