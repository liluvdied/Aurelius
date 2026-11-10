// fix770 V.111 - 2 · PAPER BOOK (Love Nov 5 2026 ~7:05 PM PT: "Give her her own card, V.111 - 2 ... for now lets get her on paper taking every set up under her rules 💞
// we will boil it down rather quickly, shes using the same bands? half ? and the rolling 60M vwap ?").
// PAPER ONLY: this file never places, sizes, cancels or reads a live order, never touches a live book, wall, umpire or switch, and its fill-log rows carry their own
// venue ("paper-v111-2") so nothing that copies or mirrors paper to Kalshi (engine.ts reads venue === "paper" only) can ever pick them up. BTC + gold, Kalshi 15m.
// THE BRAIN = her Sep 24 reads, ported 1:1 from ~/Desktop/aurelius-core/tools/og-replay.mjs (frame / detect / openLook / to5m / sep24Read, logic unchanged - proven by
// tools/v111-2-equiv-770.mjs on 5,000+ random bar sets, 0 differences):
//   1m read: detect() on the desk's closed 1m bars (her chart: PEPPERSTONE:BTCUSD, TVC:GOLD), bands from the ROLLING 60-MINUTE VWAP (frame of the last 60 1m bars,
//            typical price, volume weighted, sigma floor vwap x 0.00015) with her half-sigma bands ±0.5, 1, 1.5, 2, 2.5, 3σ;
//   then 5m read: detect() on 5m bars, frame of the last 12 5m bars; then the window-open read (openLook), only with 120 s or more left.
//   The first look that fires is the take. One trade per asset per 15m window. Read once a minute on closed 1m bars, like the replay (minutes 1-14 of the window).
// EVERY set up is allowed. data/v111-2-cut.json {"cut": [...]} switches set ups off without a code change (a label, or "asset|side|label"); empty = all on.
// $20 paper at the real live ask of its side (yes ask for a long, no ask for a short), held to the bell; her take-profit (half at 75% of the way to $1, the rest
// trails from 90%: sold 5c off its best bid) is scored beside it, like the other paper books. Each settled trade goes into data/fill-log.json (banked, its set up label,
// side, book "V.111 - 2") so the STATS box and the SET UP SCORES panel score it by set up.
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bestTake775 } from "./v1112best.ts"; // fix775: her BEST-table takes also go live on Kalshi at $5 (v1112best.ts decides, the live copier sends)
import { wallsTake783, wallsSettle783 } from "./v1112walls.ts"; // fix783: BESTIE · WALLS (paper) - BESTIE's takes judged by main's door first
import { fbTick789 } from "./v1112fb.ts"; // fix789: BESTIE takes the next band when she misses hers over her floor
import { zoneTick798 } from "./v1112zone.ts"; // fix798: her zone wick rejections (paper set up)
import { binvTick795 } from "./v1112binv.ts"; // fix795: BESTIE · INVERSE (paper) - her live fills, the other side
import { ldcTake794, ldcSettle794 } from "./v1112ldc.ts"; // fix794: V.111 - 2 · LDC FADE (paper) + the LDC colour on every take
import { invTake777, invSettle777 } from "./v1112inv.ts"; // fix777: V.111 - 2 INVERSE (paper) - every take of hers, the opposite side at its real ask

// ---------------------------------------------------------------- the brain: og-replay.mjs lines 3-112, logic unchanged ----------------------------------------------------------------
export type Bar770 = { t: number; o: number; h: number; l: number; c: number; v: number };
export type Frame770 = { vwap: number; stdev: number; bands: { multiplier: number; price: number }[] };
export type Look770 = { kind: string; side: "up" | "down" | null; band?: number | null; label: string; level?: number; tf?: string };
type Allow770 = (label: string, side: "up" | "down", band?: number) => boolean;
export const STEPS = [0.5, 1, 1.5, 2, 2.5, 3];
const norm = (s: unknown) => String(s || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
export function frame(candles: Bar770[]): Frame770 | null {
  const rows = [...candles].sort((a, b) => a.t - b.t).filter((c) => Number.isFinite(c.c));
  if (rows.length < 8) return null;
  let pv = 0, vol = 0, tw = 0;
  for (const c of rows) { const tp = (c.h + c.l + c.c) / 3; pv += tp * c.v; vol += c.v; tw += tp; }
  const twap = tw / rows.length, useV = vol > 0 && pv > 0, vwap = useV ? pv / vol : twap;
  let acc = 0, w = 0;
  for (const c of rows) { const tp = (c.h + c.l + c.c) / 3, wt = useV ? c.v : 1; acc += wt * (tp - vwap) ** 2; w += wt; }
  const sd = w > 0 ? Math.sqrt(acc / w) : 0;
  const stdev = Math.max(sd, vwap * 0.00015);
  const bands: { multiplier: number; price: number }[] = [];
  for (const m of STEPS) bands.push({ multiplier: -m, price: vwap - m * stdev }, { multiplier: m, price: vwap + m * stdev });
  bands.sort((a, b) => a.price - b.price);
  return { vwap, stdev, bands };
}
const asc = (rows: Bar770[]) => [...rows].sort((a, b) => a.t - b.t);
export function detect(candles: Bar770[], fr: Frame770 | null, allow: Allow770 = () => true): Look770 {
  const none: Look770 = { kind: "none", side: null, band: null, label: "No band interaction" };
  if (!fr) return none;
  const rows = asc(candles);
  if (rows.length < 8) return none;
  const recent = rows.slice(-12), last = recent[recent.length - 1], look = recent.slice(-8);
  const { vwap, stdev } = fr;
  const touch = Math.max(stdev * 0.15, vwap * 0.00005), prox = touch;
  const levels = [1.5, 2, 2.5, 1, 3, 0.5];
  const can = (label: string, side: "up" | "down", band: number) => allow(label, side, band) || (band ? allow(`Open ${band > 0 ? "+" : ""}${band}σ`, side, band) : false);
  for (const m of levels) {
    for (const level of [vwap + m * stdev, vwap - m * stdev]) {
      const name = `${level >= vwap ? "+" : "−"}${m}σ`;
      const band = level >= vwap ? m : -m;
      const earlier = look.slice(-4, -1);
      let approach: "above" | "below" | null = null;
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
  return none;
}
export function openLook(spot: number, vwap: number, stdev: number): Look770 | null {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  let best: { gap: number; step: number; sign: string } | null = null;
  for (const step of [0, 0.5, 1, 1.5, 2, 2.5, 3]) for (const sign of step === 0 ? [0] : [1, -1]) {
    const gap = Math.abs(spot - (vwap + sign * step * stdev));
    if (gap > stdev * 0.35 || (best && gap >= best.gap)) continue;
    best = { gap, step, sign: sign < 0 ? "-" : "+" };
  }
  if (!best) return null;
  const level = vwap + (best.sign === "-" ? -1 : 1) * best.step * stdev;
  return { kind: "open", label: `Open ${best.step === 0 ? "VWAP" : best.sign + best.step + "σ"}`, side: spot >= level ? "up" : "down", level };
}
export function to5m(bars: Bar770[]): Bar770[] {
  const m = new Map<number, Bar770>();
  for (const c of asc(bars)) {
    const t = Math.floor(c.t / 300000) * 300000, p = m.get(t);
    m.set(t, p ? { t, o: p.o, h: Math.max(p.h, c.h), l: Math.min(p.l, c.l), c: c.c, v: p.v + c.v } : { ...c, t });
  }
  return [...m.values()].sort((a, b) => a.t - b.t);
}
type Stats770 = Record<string, { n: number; w: number }>;
type Cut770 = { minTrades: number | null; minHitPct?: number | null; cutIfLosing?: boolean } | null | undefined;
export function statsAllow(stats: Stats770 | null | undefined, asset: string, side: string, label: string, cut: Cut770): boolean {
  if (!cut || cut.minTrades == null) return true;
  const s = stats?.[`${asset}|${side}|${norm(label)}`];
  if (!s || s.n < cut.minTrades) return true;
  if (cut.minHitPct != null && (100 * s.w) / s.n < cut.minHitPct) return false;
  if (cut.cutIfLosing && s.w < s.n - s.w) return false;
  return true;
}
export function statsAdd(stats: Stats770, asset: string, side: string, label: string, won: boolean): Stats770 {
  const k = `${asset}|${side}|${norm(label)}`;
  const s = stats[k] ?? { n: 0, w: 0 };
  s.n += 1; if (won) s.w += 1;
  stats[k] = s;
  return stats;
}
type Read770 = { take: (Look770 & { tf: string }) | null; why: string; looks?: (Look770 & { tf: string })[]; spot?: number; vwap?: number; stdev?: number };
export function sep24Read({ asset, bars, secondsLeft, stats, cut, bands = "all" }: { asset: string; bars: Bar770[]; secondsLeft: number; stats?: Stats770 | null; cut?: Cut770; bands?: "all" | number }): Read770 {
  const rows = asc(bars);
  if (rows.length < 8) return { take: null, why: "not enough bars" };
  const spot = rows[rows.length - 1].c;
  const f1 = frame(bands === "all" ? rows : rows.slice(-Number(bands)));
  const c5 = to5m(rows);
  const f5 = c5.length ? frame(c5.slice(-12)) : null;
  const allow = (label: string, side: "up" | "down") => statsAllow(stats, asset, side, label, cut);
  const looks: (Look770 & { tf: string })[] = [];
  const p1 = detect(rows, f1, allow); if (p1.side) looks.push({ ...p1, tf: "1m" });
  const p5 = detect(c5, f5, allow); if (p5.side) looks.push({ ...p5, tf: "5m" });
  const op = f1 ? openLook(spot, f1.vwap, f1.stdev) : null;
  if (op && secondsLeft >= 120 && allow(op.label, op.side as "up" | "down")) looks.push({ ...op, tf: "1m" });
  return { take: looks[0] ?? null, looks, spot, vwap: f1?.vwap, stdev: f1?.stdev, why: looks.length ? "" : "no band read" };
}
/** V.111 - 2's read = sep24Read above (bands = the last 60 1m bars, no stats cut) with her cut list (data/v111-2-cut.json) as the allow. Nothing cut = sep24Read exactly
 * (tools/v111-2-equiv-770.mjs). A cut set up is really off: detect()'s "Open ±Nσ" stand-in (its second chance when a label is refused) is refused too, so a cut
 * tap-reject / break-retest at a band cannot slip back in under the open label - detect then moves on to her next band, exactly as the replay's own cut does. */
export function read770(asset: string, bars: Bar770[], secondsLeft: number, cut: string[]): Read770 {
  const rows = asc(bars);
  if (rows.length < 8) return { take: null, why: "not enough bars" };
  const spot = rows[rows.length - 1].c;
  const f1 = frame(rows.slice(-60));
  const c5 = to5m(rows);
  const f5 = c5.length ? frame(c5.slice(-12)) : null;
  const inDetect = (label: string, side: "up" | "down", band?: number) => (band !== undefined && /^Open /.test(label) ? false : !isCut770(cut, asset, side, label));
  const looks: (Look770 & { tf: string })[] = [];
  const p1 = detect(rows, f1, cut.length ? inDetect : undefined); if (p1.side) looks.push({ ...p1, tf: "1m" });
  const p5 = detect(c5, f5, cut.length ? inDetect : undefined); if (p5.side) looks.push({ ...p5, tf: "5m" });
  const op = f1 ? openLook(spot, f1.vwap, f1.stdev) : null;
  if (op && secondsLeft >= 120 && !isCut770(cut, asset, op.side as "up" | "down", op.label)) looks.push({ ...op, tf: "1m" });
  return { take: looks[0] ?? null, looks, spot, vwap: f1?.vwap, stdev: f1?.stdev, why: looks.length ? "" : "no band read" };
}
/** the replay's own bar prep (og-replay.mjs bars()): sorted, and every missing minute filled with a flat bar at the last close, volume 0. */
export function fillGaps770(raw: Bar770[]): Bar770[] {
  const out = [...raw].sort((a, b) => a.t - b.t);
  const f: Bar770[] = [];
  for (const b of out) {
    const p = f[f.length - 1];
    if (p) for (let t = p.t + 60000; t < b.t; t += 60000) f.push({ t, o: p.c, h: p.c, l: p.c, c: p.c, v: 0 });
    if (!p || b.t > p.t) f.push(b);
  }
  return f;
}

// ---------------------------------------------------------------- the paper book ----------------------------------------------------------------
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const BOOK770 = "V.111 - 2";
export const VENUE770 = "paper-v111-2"; // never "paper" / "kalshi" / "polymarket": no copier, mirror, guard or live record reads it
const FILE = "v111-2-770.json", CUT = "v111-2-cut.json", STAKE = 20;
type Row770 = { id: string; book: string; setup: string; tf: string; kind: string; asset: string; ticker: string; closeTime: string; at: string; readAt: string; side: "up" | "down"; ask: number; multiple: number; floorOk: boolean; contracts: number; stake: number; spot: number; vwap: number; stdev: number; level: number | null; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null; logged?: boolean };
function st(): { rows: Row770[]; taken: Record<string, number>; read: Record<string, number> } {
  if (G.__v1112) return G.__v1112;
  let s = { rows: [] as Row770[], taken: {} as Record<string, number>, read: {} as Record<string, number> };
  try { if (existsSync(D(FILE))) s = { taken: {}, read: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {}
  G.__v1112 = s; return s;
}
function save(force = false) {
  if (!force && G.__v1112SaveAt && Date.now() - G.__v1112SaveAt < 10000) return;
  G.__v1112SaveAt = Date.now();
  try {
    const s = st(); ((globalThis as any).__purge1053 || ((x: any) => x))(s.rows, "v111-2"); /* fix1053 */ s.rows = s.rows.slice(-4000); const old = Date.now() - 6 * 3600000;
    for (const k of Object.keys(s.taken)) if (s.taken[k] < old) delete s.taken[k];
    for (const k of Object.keys(s.read)) if (s.read[k] < old) delete s.read[k];
    writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE));
  } catch {}
}
/** the cut list (re-read when the file changes). Empty = every set up on. */
export function cutList770(): string[] {
  const c = (G.__v1112Cut ||= { key: "", list: [] as string[] });
  try {
    const p = D(CUT); if (!existsSync(p)) { c.key = ""; c.list = []; return c.list; }
    const f = statSync(p), key = `${f.mtimeMs}:${f.size}`;
    if (c.key !== key) { const j = JSON.parse(readFileSync(p, "utf8")); c.list = (Array.isArray(j?.cut) ? j.cut : []).map((x: unknown) => norm(x)).filter(Boolean); c.key = key; }
  } catch {}
  return c.list;
}
export function isCut770(list: string[], asset: string, side: string, label: string): boolean {
  if (!list.length) return false;
  const l = norm(label);
  return list.some((x) => { const k = norm(x); return k === l || k === `${asset}|${side}|${l}`; });
}
/** a settled trade -> data/fill-log.json (banked, its own venue). Same sort and 8,000-row trim the fill log keeps (fill-log.ts save()). */
function logFill770(r: Row770) {
  try {
    let rows: any[] = [];
    try { const j = JSON.parse(readFileSync(D("fill-log.json"), "utf8")); if (Array.isArray(j)) rows = j; else return; } catch { return; } // never write over a log it could not read
    const id = `${r.id}:banked`;
    if (rows.some((e) => e && e.id === id)) return;
    rows.push({ id, at: new Date().toISOString(), kind: "banked", tradeId: r.id, asset: r.asset, ticker: r.ticker, side: r.side, venue: VENUE770, stake: r.stake, ask: r.ask, multiple: r.multiple,
      profit: r.pnlTp, pattern: `${BOOK770} · ${r.setup}`, opposite: false, target: null, spot: r.spot, vwap: r.vwap, peak: r.bestBid || null, book: BOOK770, setup: r.setup, tf: r.tf, held: r.pnlHold });
    const trimmed = rows.filter((e) => e && typeof e.id === "string").sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8000);
    writeFileSync(D("fill-log.json"), JSON.stringify(trimmed));
  } catch {}
}
/** her closed 1m bars as the desk holds them (pivotbooks' TradingView 1m read, __pivBars), t in ms. */
function bars770(id: string): Bar770[] {
  const raw = G.__pivBars?.[id]?.bars;
  if (!Array.isArray(raw)) return [];
  return raw.map((b: any) => ({ t: Number(b.t) * 1000, o: Number(b.o), h: Number(b.h), l: Number(b.l), c: Number(b.c), v: Number(b.v) || 0 })).filter((b: Bar770) => Number.isFinite(b.t) && Number.isFinite(b.c));
}
export async function v1112Tick770(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__v1112Busy) return;
  G.__v1112Busy = true;
  try {
    const s = st(); let dirty = false; const now = Date.now(), m0 = Math.floor(now / 60000) * 60000;
    for (const id of ["btc", "gold"]) {
      const a = assets[id], m = a?.market, left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || !(left > 0)) continue;
      const close = Math.round((now + left * 1000) / 60000) * 60000, open = close - 900000;
      if (s.taken[m.ticker] || m0 < open + 60000 || m0 > close - 60000 || now - m0 > 50000) continue; // the replay's reads: minutes 1-14 of the window, once each
      const rk = `${m.ticker}:${m0}`; if (s.read[rk]) continue;
      const all = bars770(id);
      if (!all.length || all[all.length - 1].t < m0) continue; // wait until her chart shows the new minute, so the bar that just closed is final
      const rows = fillGaps770(all.filter((b) => b.t < m0)).filter((b) => b.t >= m0 - 6 * 3600000); // closed bars before this minute, 6 hours, like the replay
      s.read[rk] = now; dirty = true;
      const cut = cutList770();
      const r = read770(id, rows, (close - m0) / 1000, cut);
      const tk = r.take; if (!tk || (tk.side !== "up" && tk.side !== "down")) continue;
      const ask = Number(tk.side === "up" ? m.yesAsk : m.noAsk);
      if (!(ask > 0.01 && ask < 0.99)) { delete s.read[rk]; continue; } // no live ask to price it at this second - read this minute again
      s.taken[m.ticker] = now;
      s.rows.push({ id: `${m.ticker}:v1112`, book: BOOK770, setup: tk.label, tf: tk.tf, kind: tk.kind, asset: id, ticker: m.ticker, closeTime: new Date(close).toISOString(), at: new Date().toISOString(), readAt: new Date(m0).toISOString(),
        side: tk.side, ask, multiple: Math.round((1 / ask) * 100) / 100, floorOk: ask <= 0.667, contracts: STAKE / ask, stake: STAKE, spot: Number(r.spot) || 0, vwap: Number(r.vwap) || 0, stdev: Number(r.stdev) || 0,
        level: Number.isFinite(Number(tk.level)) ? Number(tk.level) : null, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
      { const r775 = s.rows[s.rows.length - 1] as any; void bestTake775(r775).then((d) => { r775.best775 = d; save(true); }).then(() => { void wallsTake783(r775, r775.best775).catch(() => {}); /* fix783: BESTIE · WALLS paper twin, the same decided answer BESTIE gets */ }).catch(() => {}); } // fix775: on the BEST list or not, decided this second (her paper trade above is unchanged)
      try { ldcTake794(s.rows[s.rows.length - 1]); } catch {} // fix794: her take's LDC colour + the LDC FADE paper book (her row's take is unchanged)
      try { invTake777(s.rows[s.rows.length - 1], m); } catch {} // fix777: the inverse paper book takes the other side, same read, same second (her row above is unchanged)
    }
    for (const r of s.rows) {
      if (r.result !== "open") { if (!r.logged) { logFill770(r); r.logged = true; dirty = true; } continue; }
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) {
        const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
        if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; } }
      }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__v1112Res ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const fm = typeof G.__v1112FetchMarket === "function" ? G.__v1112FetchMarket : (await import("./kalshi")).fetchMarket; // read only: the market's settled result
      const mk = await fm(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - STAKE) * 100) / 100;
      r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - STAKE) * 100) / 100;
      logFill770(r); r.logged = true; dirty = true;
    }
    if (dirty) save(true); else save();
    try { await wallsSettle783(assets); } catch {} // fix783: BESTIE · WALLS's bids, take-profit and settlement (taken + skipped rows, their own files)
    try { await fbTick789(assets, s.rows, { read770, fillGaps770, bars770, cutList770, decide: (row: any) => bestTake775(row) }); } catch {} // fix789: BESTIE's next-band reads (her own file; V.111 - 2's book unchanged)
    try { await zoneTick798(assets, (row: any) => bestTake775(row)); } catch {} // fix798: green / red zone wick rejections ($50 BTC / $1 gold), her own paper rows
    try { await binvTick795(assets); } catch {} // fix795: BESTIE · INVERSE's mirror + 75/95 exit + settlement (its own file)
    try { await ldcSettle794(assets); } catch {} // fix794: LDC FADE's bids, 75/95 exit and settlement (its own file)
    try { await invSettle777(assets); } catch {} // fix777: the inverse paper book's bids, take-profit and settlement (its own file)
  } catch {} finally { G.__v1112Busy = false; }
}
