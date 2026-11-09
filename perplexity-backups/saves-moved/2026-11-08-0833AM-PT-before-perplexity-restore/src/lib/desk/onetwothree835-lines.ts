// fix835 1-2-3 · SEALED · PAPER - HER LINES (session bands with the carry, CM pivots incl. the forming candle, the chart's 5m Bollinger) from PRE295 pivotbooks.ts. PAPER ONLY: no order path.
// Every block between "===== FROZEN" markers is copied byte for byte from data/vault-123-pre295 (PRE295-BUILD, the desk as it stood Oct 26 2026 ~9:30 PM PT) and checked by
// seal835() in onetwothree835.ts (vault sha256 + every block's text). Change a single byte inside a block and both 1-2-3 books stop and say why.
// Outside the markers is plumbing only: the imports below resolve to the sealed sandbox (onetwothree835-sandbox.ts), never to the live desk's modules or globals.
import { join } from "node:path";
import { SANDBOX, readFileSync, writeFileSync } from "./onetwothree835-sandbox";
import { sessCarryPick, sessStartMs } from "./onetwothree835-walls";
const globalThis = SANDBOX; // her frozen code's globalThis is the sealed sandbox, not the live desk

// ===== FROZEN 1-2-3 - data/vault-123-pre295/pivotbooks.ts lines 23-24 =====
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/pivotbooks.ts lines 53-53 =====
type Bar = { t: number; o: number; h: number; l: number; c: number };
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/pivotbooks.ts lines 59-59 =====
type Piv = { pp: number; r1: number; s1: number; r2: number; s2: number; a: number };
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/pivotbooks.ts lines 67-77 =====
export function resample(b: Bar[], mins: number): Bar[] {
  const out: Bar[] = [];
  const span = mins * 60;
  for (const x of b) {
    const k = Math.floor(x.t / span) * span;
    const last = out[out.length - 1];
    if (last && last.t === k) { last.h = Math.max(last.h, x.h); last.l = Math.min(last.l, x.l); last.c = x.c; }
    else out.push({ t: k, o: x.o, h: x.h, l: x.l, c: x.c });
  }
  return out;
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/pivotbooks.ts lines 140-183 =====
export function bbsrFrame(b: Bar[], nowSec: number): { bbU: number; bbL: number; k: number; d: number; sig: "bull" | "bear" | null; sigAgo: number } | null {
  const all = resample(b, 5);
  const closed = all.filter((x) => x.t + 300 <= nowSec + 1);
  if (closed.length < 60) return null;
  const live = all.length > closed.length ? all[all.length - 1] : null;
  const cs = closed.map((x) => x.c);
  const band = (arr: number[], i: number): [number, number] => { const w = arr.slice(i - 19, i + 1); const m = w.reduce((q, v) => q + v, 0) / 20; const sd = Math.sqrt(w.reduce((q, v) => q + (v - m) ** 2, 0) / 20); return [m + 2 * sd, m - 2 * sd]; };
  const cAll = live ? [...cs, live.c] : cs;
  const [U, Lw] = band(cAll, cAll.length - 1);
  const n = cs.length, rsi: (number | null)[] = new Array(n).fill(null);
  let ag = 0, al = 0;
  for (let i = 1; i < n; i++) {
    const ch = cs[i] - cs[i - 1], up = Math.max(ch, 0), dn = Math.max(-ch, 0);
    if (i <= 14) { ag += up; al += dn; if (i === 14) { ag /= 14; al /= 14; rsi[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al); } }
    else { ag = (ag * 13 + up) / 14; al = (al * 13 + dn) / 14; rsi[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al); }
  }
  const stv: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) { const w = rsi.slice(Math.max(0, i - 13), i + 1); if (w.length === 14 && w.every((x) => x != null)) { const lo = Math.min(...(w as number[])), hi = Math.max(...(w as number[])); stv[i] = hi === lo ? 0 : (100 * ((rsi[i] as number) - lo)) / (hi - lo); } }
  const K: (number | null)[] = new Array(n).fill(null), Dd: (number | null)[] = new Array(n).fill(null);
  for (let i = 0; i < n; i++) { const w = stv.slice(Math.max(0, i - 2), i + 1); if (w.length === 3 && w.every((x) => x != null)) K[i] = (w as number[]).reduce((q, v) => q + v, 0) / 3; const w2 = K.slice(Math.max(0, i - 2), i + 1); if (w2.length === 3 && w2.every((x) => x != null)) Dd[i] = (w2 as number[]).reduce((q, v) => q + v, 0) / 3; }
  let sig: "bull" | "bear" | null = null, sigAgo = -1;
  for (let i = n - 1; i >= Math.max(20, n - 3); i--) {
    const [u1, l1] = band(cs, i - 1), [u0, l0] = band(cs, i);
    const k1 = K[i - 1], d1 = Dd[i - 1];
    if (k1 == null || d1 == null) continue;
    if (cs[i - 1] > u1 && cs[i] < u0 && k1 > 90 && d1 > 90) { sig = "bear"; sigAgo = n - 1 - i; break; }
    if (cs[i - 1] < l1 && cs[i] > l0 && k1 < 10 && d1 < 10) { sig = "bull"; sigAgo = n - 1 - i; break; }
  }
  return { bbU: U, bbL: Lw, k: Number(K[n - 1] ?? NaN), d: Number(Dd[n - 1] ?? NaN), sig, sigAgo };
}
export function pivot(bars: Bar[], mins: number): Piv | null {
  // MATCH HER CHART (Oct 16 ~1:37 PM PT, Love picked "Match bands to chart"): TradingView draws CM Pivot Bands on the LIVE
  // candle too, so her pink/R1/S1 move with the forming bar. The desk used finished bars only and sat $0.10-0.25 off her chart
  // (1:30 PM gold: desk PP 4167.56 / R1 4170.19 vs her chart 4167.81 / 4170.27; with the forming candle: 4167.82 / 4170.28).
  // Now the forming bar counts, like her chart.
  const closed = bars;
  if (closed.length < 10) return null;
  const k = 2 / 8;
  let ema = 0;
  const rng: number[] = [];
  closed.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * k + ema * (1 - k); rng.push(x.h - x.l); });
  const a = rng.slice(-7).reduce((s, v) => s + v, 0) / 7;
  return { pp: ema, r1: ema + a, s1: ema - a, r2: ema + 2 * a, s2: ema - 2 * a, a };
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/pivotbooks.ts lines 250-254 =====
type Line = { name: string; price: number; unit: number; center?: boolean };
export function lines(p: Piv, tf: number): Line[] {
  const u = p.a;
  return [{ name: `${tf}m PP`, price: p.pp, unit: u, center: true }, { name: `${tf}m R1`, price: p.r1, unit: u }, { name: `${tf}m S1`, price: p.s1, unit: u }, { name: `${tf}m R2`, price: p.r2, unit: u }, { name: `${tf}m S2`, price: p.s2, unit: u }];
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/pivotbooks.ts lines 259-296 =====
export const BTC_BB_UNTIL = 1792538400000;
export function btcBBWindow(id: string, unit = 0): Line[] {
  if (!(id === "btc" || id === "gold") || Date.now() >= BTC_BB_UNTIL) return [];
  const z = (globalThis as any).__bbsr?.[id];
  if (!z || !(Number(z.bbU) > 0) || !(Number(z.bbL) > 0) || Date.now() - Number(z.at) > 20000) return [];
  return [{ name: "BB upper", price: Number(z.bbU), unit }, { name: "BB lower", price: Number(z.bbL), unit }];
}
export function sessionLines(a: any, id = ""): Line[] {
  const f = a?.vwap1m?.vwap ? a.vwap1m : a?.vwap5m;
  let v = Number(f?.vwap) || 0, sd = Number(f?.stdev) || 0;
  const v0 = v, sd0 = sd; // fix219 the new session's own VWAP/sigma, before the carry swaps them
  // CARRY-OVER SESSION BANDS (Oct 17 ~2:42 PM PT, Love) - see bandlock sessCarryPick. State persists in data/sess-carry.json.
  if (id) {
    try {
      const G = globalThis as any;
      const C = (G.__sessCarry ||= (() => { try { return JSON.parse(readFileSync(D("sess-carry.json"), "utf8")); } catch { return {}; } })());
      const pick = sessCarryPick((C[id] ||= {}), sessStartMs(Date.now(), id), v, sd, Date.now(), id); // fix167 asset for the $200 hand-back // 4 PM handover (Oct 19 ~5:36 PM PT, Love)
      v = pick.v; sd = pick.sd; (G.__sessCarried ||= {})[id] = pick.carried;
      if (Date.now() - (G.__sessCarryAt || 0) > 30000) { G.__sessCarryAt = Date.now(); writeFileSync(D("sess-carry.json"), JSON.stringify(C)); }
    } catch {}
  }
  if (!(v > 0 && sd > 0)) return [];
  // VWAP RULE OFF (Love, Oct 13 ~2:45 AM PT: "she could not comprehend not longing or shorting into a band... that does not mean
  // to never short into one if it's far enough away and clearly rejecting off of a band... turn it off"). The session VWAP is
  // no longer a "centre": a short above VWAP / a long below it is allowed. It still counts as a line for the wall rule
  // (no line between price and the strike), and the pivot PP centres are unchanged. Inherited from the old engine's "spine
  // rule" (Grok); she never chose it. Old file: _to_delete/bak-oct12-combofix/pivotbooks.ts.pre-novwap.
  const out: Line[] = [{ name: "session VWAP", price: v, unit: sd, center: false }];
  // HER CHART'S BANDS ONLY (Oct 17 ~3:10 PM PT, Love: "VWAP + 1σ, 2σ, 3σ" - her script draws multipliers 1/2/3; the desk's half-sigma bands
  // were phantom walls she couldn't see, e.g. the 3:00 PM long refused for a +0.5σ at 81,287 with +1σ $195 away on her chart).
  for (const s of [1, 2, 3]) out.push({ name: `+${s}σ`, price: v + s * sd, unit: sd }, { name: `-${s}σ`, price: v - s * sd, unit: sd });
  // FRESH BANDS ARE WALLS (fix219, Oct 25 ~3:51 PM PT, Love card "All fresh bands are walls"): during the carry the new session's VWAP (her blue line) and
  // ±1/2/3σ ride along as lines; bandlock lockPctFor gives channels this small the top/bottom 20%.
  if (id) { const GF = globalThis as any; const carried = GF.__sessCarried?.[id] === true && v0 > 0 && sd0 > 0;
    (GF.__freshSd ||= {})[id] = carried ? sd0 : 0;
    if (carried) { out.push({ name: "fresh VWAP", price: v0, unit: sd }); for (const s of [1, 2, 3]) out.push({ name: `fresh +${s}σ`, price: v0 + s * sd0, unit: sd }, { name: `fresh -${s}σ`, price: v0 - s * sd0, unit: sd }); } }
  return out;
}
// ===== END FROZEN =====
