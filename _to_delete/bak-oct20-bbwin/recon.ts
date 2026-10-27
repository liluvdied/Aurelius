// RECONSTRUCTION v2 — HER BONES (Love, Oct 19 2026 ~6:47 PM PT: "if a candle rejected the bottom band, and is rising from the bottom 33% of the
// channel i want her to long / if it rejected the top band and is falling from the top 33% of the channel, i want her to short / if it breaks the
// top band, i want her to long / if it breaks a lower band, i want her to short / same rules apply to pink / tap and rejection + candle
// falling/rising away from the pink band = trade away from the band in the direction of the rejection / a break of the pink band = trade in the
// direction of the break / those are the bones of it / that's a stable structure / can you build it?").
//
// Lines: her session bands (VWAP, +/-1,2,3 sigma, desk VWAP) + the pink 5m PP. No red/green (5m R/S) — not in her bones; say the word to add them.
// Entries (recon-ogp5):
//   BREAK     = the last closed 1m candle closed through a line, or live price has pushed through it from the candle's open side by her break
//               distance (BTC $6 / gold 33c) -> trade the direction of the break.
//   REJECTION = this 5m candle tapped a line (within BTC $3 / gold 30c) WITHOUT breaking it, and price is moving away from the tap by at least
//               the tap distance -> trade away from the band, in the rejection's direction.
// No wall-to-strike rule, no centre rule (the Oct 12 extras are out — her bones replace them). The door adds her 33% channel rule (no trade INTO
// an unbroken band in its third) and band-breaks-up-=-trade-up (bandlock channelOnly + candleDirOnly), feed health and a fresh price. Nothing else.
// recon-paper stays the Oct 12 PAPER 24/7 read (its tap-rejects are the same shape). TOGETHER = whichever speaks first in the window (live book).
//
// v1 (the byte-faithful Oct 12 decide) retired by Love after its 6:30 PM shorts into unbroken bands both lost: "her shorts into an unbroken band
// win maybe 1/5 times... that's a stable structure, can you build it?" — this build IS her re-signing of the spine lock.
// THIS FILE IS THE SPINE. data/spine-lock.json holds its sha256[:16]. Drift without Love re-signing = the three books stop booking.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { bandInWay } from "./auto";
import { dnaNow } from "./dna";
import { quoteTick, feedHealth } from "./quotes";

const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const fee = (n: number, p: number) => Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;
const STAKE = 20;
// Her distances, locked with the spine (same values as bandlock BREAK_DIST / PINK_TAP, kept here so the spine stands alone):
const BREAK: Record<string, number> = { btc: 6, gold: 0.33 };
const TAP: Record<string, number> = { btc: 3, gold: 0.3 };
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Piv = { pp: number; r1: number; s1: number; r2: number; s2: number; a: number };
type Line = { name: string; price: number; unit: number; center?: boolean };
export const RECON_LANES = ["recon-ogp5", "recon-paper", "recon-tog", "recon-top", "recon-rej"] as const; // + MOST SUCCESSFUL 70%+ (Oct 19 ~9:02 PM PT, Love) + REJECTIONS ONLY twin (Oct 20 ~7:39 AM PT, Love)
export const RECON = new Set<string>(RECON_LANES);

function resample(b: Bar[], mins: number): Bar[] {
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
// CM pink PP from the last CLOSED 5m bars (Oct 12 math, unchanged).
function pivot(bars: Bar[], mins: number): Piv | null {
  const now = Date.now() / 1000;
  const closed = bars.filter((x) => x.t + mins * 60 <= now + 1);
  if (closed.length < 10) return null;
  const k = 2 / 8;
  let ema = 0;
  const rng: number[] = [];
  closed.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * k + ema * (1 - k); rng.push(x.h - x.l); });
  const a = rng.slice(-7).reduce((s, v) => s + v, 0) / 7;
  return { pp: ema, r1: ema + a, s1: ema - a, r2: ema + 2 * a, s2: ema - 2 * a, a };
}
// Session bands: desk VWAP (vwap1m, else vwap5m), her chart's whole sigmas.
function sessionLines(a: any): Line[] {
  const f = a?.vwap1m?.vwap ? a.vwap1m : a?.vwap5m;
  const v = Number(f?.vwap) || 0, sd = Number(f?.stdev) || 0;
  if (!(v > 0 && sd > 0)) return [];
  const out: Line[] = [{ name: "session VWAP", price: v, unit: sd }];
  for (const s of [1, 2, 3]) out.push({ name: `+${s}σ`, price: v + s * sd, unit: sd }, { name: `-${s}σ`, price: v - s * sd, unit: sd });
  return out;
}
// HER BONES: breaks = trade the break; tap-and-rejection moving away = trade away. Breaks outrank rejections; nearest line wins.
export function bonesDecide(asset: string, L: Line[], spot: number, last1m: Bar | undefined, cur: { o: number; h: number; l: number }, prev?: { h: number; l: number } | null, bars?: Bar[], rejOnly = false): { side: "up" | "down"; label: string } | null {
  const brk = BREAK[asset] ?? 0, tap = TAP[asset] ?? 0;
  if (!(spot > 0) || !(brk > 0) || !(tap > 0) || !L.length) return null;
  const cands: { side: "up" | "down"; label: string; d: number; rank: number }[] = [];
  // A BREAK HOLDS UNTIL A CLOSE BACK ACROSS (Oct 19 ~9:18 PM PT, Love picked "Until a close back across" — the 9:15:05 PM BTC break long died because
  // Kalshi's fresh window had no ask for a few seconds and the breaking candle ended before quotes arrived): a line whose LAST 1m close-crossing was
  // upward, with every 1m close since staying above and live price still above, is a standing break-up entry — her broken-wall law as an entry. Mirror down.
  const nowS = Date.now() / 1000;
  const closed = (bars || []).filter((x) => x.t + 60 <= nowS + 1);
  for (const l of L) {
    const p = Number(l.price);
    if (!(p > 0)) continue;
    const d = Math.abs(spot - p);
    let xdir = 0;
    for (let i = 1; i < closed.length; i += 1) { const a0 = closed[i - 1].c, c0 = closed[i].c; if (a0 <= p && c0 > p) xdir = 1; else if (a0 >= p && c0 < p) xdir = -1; }
    if (xdir > 0 && spot > p) cands.push({ side: "up", label: `Break above ${l.name}`, d, rank: 0 });
    if (xdir < 0 && spot < p) cands.push({ side: "down", label: `Break below ${l.name}`, d, rank: 0 });
    // BREAK — a 1m close through the line:
    if (last1m) {
      if (last1m.o > p && last1m.c < p && spot < p) cands.push({ side: "down", label: `Close below ${l.name}`, d, rank: 0 });
      if (last1m.o < p && last1m.c > p && spot > p) cands.push({ side: "up", label: `Close above ${l.name}`, d, rank: 0 });
    }
    // BREAK — a live push through from this 5m candle's open side:
    if (cur.o > p && spot <= p - brk) cands.push({ side: "down", label: `Break below ${l.name}`, d, rank: 0 });
    if (cur.o < p && spot >= p + brk) cands.push({ side: "up", label: `Break above ${l.name}`, d, rank: 0 });
    // REJECTION — tapped, never broke, moving away by the tap distance:
    // ONLY THE PINK NEEDS THE FLIP (Oct 20 ~8:53-8:57 AM PT, Love): a session-band rejection enters on the move alone; a pink
    // rejection waits for the candle to cross back over its open.
    if (cur.o > p && cur.l <= p + tap && cur.l > p - brk && spot >= cur.l + tap && spot > p && (l.name !== "5m PP" || spot > cur.o)) cands.push({ side: "up", label: `Rejected up off ${l.name}`, d, rank: 1 });
    if (cur.o < p && cur.h >= p - tap && cur.h < p + brk && spot <= cur.h - tap && spot < p && (l.name !== "5m PP" || spot < cur.o)) cands.push({ side: "down", label: `Rejected down off ${l.name}`, d, rank: 1 });
    // A REJECTION SURVIVES THE CANDLE TURN (Oct 19 ~9:02 PM PT, Love: "btc rejected the band below her and she didn't enter" — the +1σ tap sat in the
    // 8:55 candle, the bounce ran into the 9:00 one; her Oct 18 law: "once a new candle starts, a rejection off the pink is a valid trade"): the tap may
    // sit in the PREVIOUS 5m candle, provided the line stayed unbroken in both candles and price is still moving away by the tap distance.
    if (prev) {
      if (prev.l <= p + tap && prev.l > p - brk && cur.l > p - brk && cur.l > prev.l - tap && spot >= prev.l + tap && spot > p && (l.name !== "5m PP" || spot > cur.o)) cands.push({ side: "up", label: `Rejected up off ${l.name}`, d, rank: 1 });
      if (prev.h >= p - tap && prev.h < p + brk && cur.h < p + brk && cur.h < prev.h + tap && spot <= prev.h - tap && spot < p && (l.name !== "5m PP" || spot < cur.o)) cands.push({ side: "down", label: `Rejected down off ${l.name}`, d, rank: 1 });
    }
  }
  // GREEN FROM THE BOTTOM / RED FROM THE TOP (Oct 20 ~12:22 AM PT, Love: "a green candle rising from the bottom 33% of the channel is a
  // long, not just a tap within 30c / a red candle falling from the top 33% of the channel is a short as well"): the current 5m candle,
  // measured against her session-band channel (nearest session line below the candle's low to the nearest above it; mirror for its high).
  // Green = live price above this candle's open; rising = at least the tap distance off its low. Rank with her rejections - breaks still
  // outrank, and the door's break-direction law still holds the same candle.
  try {
    const sessC = L.filter((l) => /\u03c3$|^session VWAP$/.test(String(l.name)) && Number(l.price) > 0);
    const chAt = (x: number) => {
      const u0 = sessC.filter((l) => l.price > x).sort((a, b) => a.price - b.price)[0];
      const d0 = sessC.filter((l) => l.price < x).sort((a, b) => b.price - a.price)[0];
      return u0 && d0 ? { lo: d0.price, hi: u0.price, w: u0.price - d0.price } : null;
    };
    // NO FLIP, NO 30c (Oct 20 ~8:57 AM PT, Love: "30 cents is not a thing... bottom 33% = long... DOES NOT NEED A CANDLE FLIP.
    // just a rejection at the band"): in the bottom third, RISING is the rejection - price lifting off the candle's low, no
    // touch-distance, no green requirement. Mirror for the top.
    if (cur.o > 0 && cur.l > 0 && spot >= cur.l + tap) {
      const ch = chAt(cur.l);
      if (ch && ch.w > 0 && (cur.l - ch.lo) / ch.w <= 0.33) cands.push({ side: "up", label: "Green candle rising from the bottom third", d: spot - ch.lo, rank: 1 });
    }
    if (cur.o > 0 && cur.h > 0 && spot <= cur.h - tap) {
      const ch = chAt(cur.h);
      if (ch && ch.w > 0 && (ch.hi - cur.h) / ch.w <= 0.33) cands.push({ side: "down", label: "Red candle falling from the top third", d: ch.hi - spot, rank: 1 });
    }
    // ONE RULEBOOK (Oct 20 ~7:49 AM PT, Love: "remember i asked you to have her short a candle falling in the top 33% and long a
    // rising candle in the bottom 33%? ... that would have made her short" - the 7:30 AM gold window booked the standing break-up
    // while the candle fell from the top third; the door refused that long for 15 minutes and the short she ordered had no voice):
    // the bones honor the same wall as the door. A red candle falling from the top third SILENCES every up candidate; a green
    // candle rising from the bottom third silences every down candidate. The flips are green/red by definition - never silenced.
    if (cur.o > 0 && cur.h > 0 && spot < cur.o && spot <= cur.h - tap) {
      const chS = chAt(cur.h);
      if (chS && chS.w > 0 && (chS.hi - cur.h) / chS.w <= 0.33) for (let i = cands.length - 1; i >= 0; i -= 1) { if (cands[i].side === "up") cands.splice(i, 1); }
    }
    if (cur.o > 0 && cur.l > 0 && spot > cur.o && spot >= cur.l + tap) {
      const chS = chAt(cur.l);
      if (chS && chS.w > 0 && (cur.l - chS.lo) / chS.w <= 0.33) for (let i = cands.length - 1; i >= 0; i -= 1) { if (cands[i].side === "down") cands.splice(i, 1); }
    }
  } catch {}
  // ZONE FLIP (Oct 20 ~2:32 AM PT, Love: "in the event she either misses the entry because the multiple was too low, or because
  // there is a red zone above her that her code rejects the long/short under, if price rejects from that zone and the candle flips,
  // have her enter a trade in the direction of the rejection and she's solid"): the candle reached the red (or green) zone, never
  // passed through its far edge, and has FLIPPED across its open moving away by the tap distance - trade the rejection.
  try {
    const pZ = (n: string) => { const l0 = L.find((x) => String(x.name) === n); const p0 = Number(l0 && l0.price); return p0 > 0 ? p0 : 0; };
    const zr1 = pZ("5m R1"), zr2 = pZ("5m R2"), zs1 = pZ("5m S1"), zs2 = pZ("5m S2");
    if (zr1 > 0 && cur.o > 0 && cur.o < zr1 && cur.h >= zr1 - tap && cur.h < (zr2 > 0 ? zr2 : zr1) + brk && spot < cur.o && spot <= cur.h - tap)
      cands.push({ side: "down", label: "Rejected down off the red zone (candle flipped)", d: Math.abs(spot - zr1), rank: 1 });
    if (zs1 > 0 && cur.o > 0 && cur.o > zs1 && cur.l <= zs1 + tap && cur.l > (zs2 > 0 ? zs2 : zs1) - brk && spot > cur.o && spot >= cur.l + tap)
      cands.push({ side: "up", label: "Rejected up off the green zone (candle flipped)", d: Math.abs(spot - zs1), rank: 1 });
  } catch {}
  // REJECTIONS ONLY twin (Oct 20 ~7:39 AM PT, Love: "make a twin that only does rejections - shorts top band, longs bottom band -
  // that's what the first model did and it was the most successful bc every trade ends up coming back most of the time"): rejOnly
  // mutes the breaks - the rank-1 voices (band rejections, candle flips at the thirds, zone flips) are the only ones that speak.
  const pool = rejOnly ? cands.filter((c) => c.rank >= 1) : cands;
  if (!pool.length) return null;
  pool.sort((a, b) => a.rank - b.rank || a.d - b.d);
  return { side: pool[0].side, label: pool[0].label };
}
// PAPER 24/7 as the Oct 12 engine took it (researchFill, verbatim in effect): her studied setups, DNA, VWAP-band-in-the-way. Unchanged from v1.
function studySetup(setup: any): boolean {
  const label = setup?.pattern?.label || "";
  if (!setup?.side || setup?.pattern?.kind === "none") return false;
  if (label.startsWith("Watching") || label.startsWith("No band")) return false;
  return setup.pattern.kind === "tap_reject" || setup.pattern.kind === "break_retest" || label.startsWith("Open ") || label.startsWith("Gold clock");
}
export function paperLookOct12(id: string, a: any): { side: "up" | "down"; label: string; ask: number } | null {
  const setup = a?.setup;
  if (!setup || setup.watchOnly || !studySetup(setup)) return null;
  const side = setup.side as "up" | "down";
  const spot = Number(a?.spot) || 0, target = Number(a?.target) || 0;
  if (dnaNow(id, side, spot, target, "fixed")) return null;
  const vwap = a?.vwap1m?.vwap || a?.vwap5m?.vwap || 0;
  const stdev = a?.vwap1m?.stdev || a?.vwap5m?.stdev || 0;
  if (bandInWay(side, spot, vwap, stdev, id)) return null;
  return { side, label: String(setup.pattern.label), ask: Number(setup.ask) > 0 ? Number(setup.ask) : 0 };
}
// ---- the spine lock (unchanged) ----
let lockCache = { at: 0, ok: true, have: "", want: "" };
export function reconLocked(): { ok: boolean; have: string; want: string } {
  if (Date.now() - lockCache.at > 30000) {
    let ok = false, have = "", want = "";
    try {
      have = createHash("sha256").update(readFileSync(join(process.cwd(), "src", "lib", "desk", "recon.ts"))).digest("hex").slice(0, 16);
      const lk = existsSync(D("spine-lock.json")) ? JSON.parse(readFileSync(D("spine-lock.json"), "utf8")) : {};
      want = String(lk?.files?.["recon.ts"] || "");
      ok = !!want && want === have;
    } catch { ok = false; }
    lockCache = { at: Date.now(), ok, have, want };
    try { writeFileSync(D("spine-lock-status.json"), JSON.stringify({ at: new Date().toISOString(), ok, have, want, note: ok ? "RECONSTRUCTED books are on the locked spine" : "SPINE DRIFT: recon.ts does not match data/spine-lock.json - the RECONSTRUCTED books are not booking until Love re-signs the lock" }, null, 1)); } catch {}
  }
  return lockCache;
}
// ---- the three books ----
// MOST SUCCESSFUL 70%+ (Oct 19 ~9:02 PM PT, Love: "on our BOOKS tab, under MOST SUCCESSFUL, i want to create a book that only trades the set ups on
// that list with a success rate of 70% or more"): the whole desk's recent record (the shared book file these rows come from), keyed asset|side|setup.
// A setup qualifies at 70%+ over its settled record, ANY number of trades (Oct 19 ~9:12 PM PT, Love: "doesn't need to be over 15+ trades. just any
// set up on the list with a success rate of 70% or more. as she takes more of them, we will take them off if they start dipping below 70%" — the
// list recomputes every 5 minutes, so a setup that dips under 70% drops off on its own).
function topStats(rows: any[]): Record<string, { n: number; w: number }> {
  const G0 = globalThis as any;
  if (G0.__reconTop && Date.now() - G0.__reconTop.at < 300000) return G0.__reconTop.st;
  const st: Record<string, { n: number; w: number }> = {};
  try {
    for (const r of rows) {
      if (!r || r.result === "open" || r.result == null || r.pnl == null) continue;
      const k = `${r.asset}|${r.side}|${String(r.label || "").trim()}`;
      (st[k] ||= { n: 0, w: 0 }); st[k].n += 1; if (Number(r.pnl) > 0) st[k].w += 1;
    }
  } catch {}
  G0.__reconTop = { at: Date.now(), st };
  return st;
}
// WHY SHE PASSED (her Oct 16 mandate: "so you never not have an answer for me when i ask what just happened"): a candidate that exists but is not
// booked (floor, ask bounds, the 70% gate) is written to data/recon-skips.jsonl — once per window per lane.
function skipLog(lane: string, ticker: string, side: string, label: string, ask: number, why: string) {
  try {
    const G0 = globalThis as any; const k = `${ticker}:${lane}:${String(why).slice(0, 40)}`; // every distinct reason, once (Oct 20 ~9:27 AM PT)
    const seen: Set<string> = (G0.__reconSkip ||= new Set());
    if (seen.has(k)) return; seen.add(k);
    writeFileSync(D("recon-skips.jsonl"), (existsSync(D("recon-skips.jsonl")) ? readFileSync(D("recon-skips.jsonl"), "utf8") : "") + JSON.stringify({ at: new Date().toISOString(), lane, ticker, side, label, ask, why }) + "\n");
  } catch {}
}
export function reconTick(id: string, a: any, m: any, left: number, b: Bar[], last1m: Bar | undefined, rows: any[]): boolean {
  if (!m?.ticker || !(left >= 120) || !(id === "btc" || id === "gold")) return false;
  if (!reconLocked().ok) return false;
  let ax = a;
  try { const q = quoteTick(id); if (q && q.c > 0 && Date.now() - q.at <= 3000 && feedHealth(id).ok) ax = { ...a, spot: q.c, spotAt: q.at }; } catch {}
  const spot = Number(ax?.spot) || 0;
  let changed = false;
  const book = (lane: string, look: { side: "up" | "down"; label: string }, askIn?: number) => {
    const prior = rows.find((r) => r.ticker === m.ticker && r.lane === lane);
    if (prior) {
      // ONE EXECUTED DIRECTION PER WINDOW (Oct 20 ~8:00 AM PT, Love: "she is clear to take the other side if she doesn't execute a
      // decision in the other. only one EXECUTED direction per window. if she doesn't take a long initially, she is clear to short
      // afterwards. vis versa"): a call that never FILLED on Kalshi does not lock the window. When her bones flip sides and the old
      // call has no fill (not even partial), the call is re-aimed IN PLACE - once per window, the other side only. A fill, whole or
      // partial, locks the window forever (changeMind stays false: an executed trade is never reversed).
      if (prior.side === look.side || prior.flipped) return false;
      try {
        const doneF = JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
        for (const kD of Object.keys(doneF)) {
          const vD = doneF[kD];
          if (kD.startsWith(m.ticker + ":" + lane) && vD && (vD.status === "filled" || vD.status === "partial")) return false;
        }
      } catch {}
      const askF = askIn && askIn > 0 ? askIn : Number(look.side === "up" ? m.yesAsk : m.noAsk);
      if (!(askF > 0.02 && askF < 0.98) || !(1 / askF >= 1.38)) { skipLog(lane, m.ticker, look.side, look.label, askF, "wanted to flip the unfilled call, " + (1 / askF < 1.38 && askF < 0.98 ? "but it is under her 1.38x floor (" + (1 / askF).toFixed(2) + "x)" : "but the ask is out of bounds")); return false; }
      prior.prevCall = prior.side + " - " + prior.label + " (never filled, re-aimed)";
      prior.side = look.side; prior.label = look.label; prior.ask = r2(askF); prior.multiple = r2(1 / askF);
      prior.at = new Date().toISOString(); prior.flipped = true; prior.peak = askF; prior.fee = fee(STAKE / askF, askF);
      return true;
    }
    const ask = askIn && askIn > 0 ? askIn : Number(look.side === "up" ? m.yesAsk : m.noAsk);
    if (!(ask > 0.02 && ask < 0.98) || !(1 / ask >= 1.38)) { skipLog(lane, m.ticker, look.side, look.label, ask, 1 / ask < 1.38 && ask < 0.98 ? `under her 1.38x floor (${(1 / ask).toFixed(2)}x at ${Math.round(ask * 100)}c)` : "ask out of bounds"); return false; }
    const n = STAKE / ask;
    const sdNow = Number((ax?.vwap1m?.vwap ? ax.vwap1m : ax?.vwap5m)?.stdev) || 0;
    const bar = last1m ? { o: r2(last1m.o), h: r2(last1m.h), l: r2(last1m.l), c: r2(last1m.c) } : null;
    rows.unshift({ id: `${m.ticker}:${lane}`, lane, at: new Date().toISOString(), asset: id, ticker: m.ticker, side: look.side, label: look.label, ask: r2(ask), multiple: r2(1 / ask), secondsLeft: Math.round(left), intoWindow: Math.round(900 - left), stake: STAKE, fee: fee(n, ask), peak: ask, lastBid: 0, result: "open", exit: null, pnl: null, bar, sd: r2(sdNow), band: null, recon: true });
    return true;
  };
  // the current 5m candle: its 1m bars + HER LIVE TICKS (Oct 19 ~8:45 PM PT, Love: "can you see why she didn't long gold?" - the 8:30:07 PM gold
  // rejection: the tap at 4,141.41 lived and died inside the first minute; the 1m bar carrying that wick only reaches the desk after the minute
  // closes, so these books saw the rejection a minute late, when the ask had already fallen past her 1.38x floor, and passed in silence. The tick
  // trail (the same __qtrail every other book's candle rules read - her "one engine") now fills in the wick the bars haven't written yet.)
  const f0 = Math.floor(Date.now() / 1000 / 300) * 300;
  const inF = b.filter((x) => x.t >= f0);
  const inP = b.filter((x) => x.t >= f0 - 300 && x.t < f0);
  const prev = inP.length ? { h: Math.max(...inP.map((x) => x.h)), l: Math.min(...inP.map((x) => x.l)) } : null;
  let tr: number[] = [];
  try {
    const GT = globalThis as any;
    const tk = Object.keys(GT).filter((k) => /^__qtrail_\d+$/.test(k)).sort((x, y) => Number(y.slice(9)) - Number(x.slice(9)))[0];
    tr = ((tk && GT[tk]?.[id]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0 * 1000).map((x: any) => Number(x.c));
  } catch { tr = []; }
  const prevC = b.length ? Number(b[b.length - 1].c) : spot;
  const cur = { o: inF.length ? Number(inF[0].o) : tr.length ? tr[0] : prevC, h: Math.max(spot, ...inF.map((x) => x.h), ...tr, -Infinity), l: Math.min(spot, ...inF.map((x) => x.l), ...tr, Infinity) };
  // 1) RECONSTRUCTED · HER BONES (session bands + pink)
  let look5: { side: "up" | "down"; label: string } | null = null;
  try {
    const p = pivot(resample(b, 5), 5);
    const L = [...sessionLines(ax), ...(p ? [{ name: "5m PP", price: p.pp, unit: p.a }] : [])];
    look5 = bonesDecide(id, L, spot, last1m, cur, prev, b);
  } catch { look5 = null; }
  if (look5 && book("recon-ogp5", look5)) changed = true;
  // 2) RECONSTRUCTED · PAPER 24/7
  let lookP: { side: "up" | "down"; label: string; ask: number } | null = null;
  try { lookP = paperLookOct12(id, ax); } catch { lookP = null; }
  if (lookP && book("recon-paper", lookP, lookP.ask)) changed = true;
  // 3) RECONSTRUCTED · TOGETHER = first of the two in the window
  const first = look5 || lookP;
  if (first && book("recon-tog", first, lookP && !look5 ? lookP.ask : undefined)) changed = true;
  // 4) MOST SUCCESSFUL 70%+ — the same candidate, only when its setup's whole-desk record is 70%+ over 15+ settled trades (paper).
  if (first) {
    const st = topStats(rows);
    const k = `${id}|${first.side}|${String(first.label).trim()}`;
    const x = st[k];
    if (x && x.n >= 1 && x.w / x.n >= 0.7) { if (book("recon-top", first, lookP && !look5 ? lookP.ask : undefined)) changed = true; }
    else skipLog("recon-top", m.ticker, first.side, first.label, 0, x ? `setup is ${Math.round((x.w / x.n) * 100)}% over ${x.n} settled (needs 70%+)` : "setup has no settled record yet");
  }
  // 5) REJECTIONS ONLY - her twin (Oct 20 ~7:39 AM PT, Love): the same bones, every break muted. Shorts come only off the band
  // above, longs only off the band below (taps, candle flips at the thirds, zone flips) - "every trade ends up coming back most
  // of the time". Paper, through the same RECON door as her siblings.
  let lookR: { side: "up" | "down"; label: string } | null = null;
  try {
    const pR = pivot(resample(b, 5), 5);
    const LR = [...sessionLines(ax), ...(pR ? [{ name: "5m PP", price: pR.pp, unit: pR.a }] : [])];
    lookR = bonesDecide(id, LR, spot, last1m, cur, prev, b, true);
  } catch { lookR = null; }
  if (lookR && book("recon-rej", lookR)) changed = true;
  return changed;
}
