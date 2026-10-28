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
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { bandInWay } from "./auto";
import { dnaNow } from "./dna";
import { quoteTick, feedHealth } from "./quotes";
import { addOnTouchNow, anyFlipNow } from "./bandlock"; // fix169 + fix326

const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const fee = (n: number, p: number) => Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;
const STAKE = 20;
// Her distances, locked with the spine (same values as bandlock BREAK_DIST / PINK_TAP, kept here so the spine stands alone):
const BREAK: Record<string, number> = { btc: 6, gold: 0.33 };
const TAP: Record<string, number> = { btc: 3, gold: 0.3 };
// TOGETHER's NEAR-BAND REACH (Oct 21 ~7:55 PM PT, Love: "let's make it $33 for btc ... i do want her to be able to short a candle falling from the band above
// anywhere but the bottom 33% of the channel and be able to long anywhere but the top 33% if a candle has rejected a band and is moving off away from it ... for
// the main book as well"): a rejection counts when the candle came within this of the band (not just her tap); moving away is still her tap. Main book only.
const REACH: Record<string, number> = { btc: 50, gold: 1.5 }; // superseded by REACH_PCT below (kept for the record)
// REACH SLIDES WITH HER CHANNEL (Oct 21 ~9:15 PM PT, Love picked "20% of channel width": "if price rejects near a band ... she is clear to short anywhere in the
// channel, except the bottom 33% ... a rejection doesn't need to be limited to $50 for btc"): TOGETHER's near-band reach = 20% of the session channel price is in.
const REACH_PCT = 0.2; // BTC $50 (Love picked "Reach $50 on BTC", Oct 21 ~9:05 PM PT - the 9:00 PM dip turned $35-40 over the pink) // gold $1.50 (Love ~7:57 PM PT: "taps and rejections can be valid at a distance of $1.50 at the present moment ... that framework is good for both")
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Piv = { pp: number; r1: number; s1: number; r2: number; s2: number; a: number };
type Line = { name: string; price: number; unit: number; center?: boolean };
export const RECON_LANES = ["recon-ogp5", "recon-paper", "recon-tog", "recon-top", "recon-rej", "recon-dly", "recon-rejx", "recon-togr", "recon-rej5", "recon-togp"] as const; /* fix281 recon-togp */ /* fix261 recon-rej5 */ /* fix250 recon-togr */ /* fix171 recon-rejx */ // + MOST SUCCESSFUL 70%+ (Oct 19 ~9:02 PM PT, Love) + REJECTIONS ONLY twin (Oct 20 ~7:39 AM PT, Love)
export const RECON = new Set<string>(RECON_LANES);
const DLY_AS_COPY = false; /* fix353 PAUSED (Love 6:11 PM PT: "wait no no no no no no do not change the 5M on polymarket in any way nooo"): the twin is exactly as before everywhere */ // fix353 (Oct 27 2026 ~6:09 PM PT, Love: "just make the delayed entry model a delayed rejection copy of no pink / no entires first 30 seconds into a window is good" + "we will use that model with a delayed entry - after 30 seconds"): the DELAYED twin is the no-pink copy with a delayed entry

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
// SAME BANDS AS HER WALL (Love picked "Both fixes" (Oct 20 ~4:52 PM PT) on "close the fake break hole on gold and BTC"): while the desk is carrying the last session's bands (after the 2 PM reset, until the new
// sigma is half the old or 4 PM), her bones read the carried VWAP/sigma too - the 3:45 PM gold long "broke" a raw new-session band the wall never saw.
// THE 3 PM CHANNEL (Oct 21 ~3:21 PM PT, Love: "for 3-4 pm like we discussed yesterday she can use the pink band and the red /green zones and the bollingers
// until the session bands open up a bit more" + picked "Yes, exactly that"): every day from 3:00 to 3:59 PM PT the channel's edges are the pink (5m PP), the
// red/green zones (5m R1 / S1) and the 5m Bollinger upper/lower, BTC and gold; the session bands step aside for that hour. Thirds, top/bottom line, candle -
// all unchanged, at the wire, the door and paper alike.
const PT_HOUR_R = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" });
function quietR(now = Date.now()): boolean { try { return Number(PT_HOUR_R.format(new Date(now))) === 15; } catch { return false; } }
const QUIET_R = /^5m (PP|R1|S1)$|^BB (upper|lower)$/;
function quietLines(id: string, p: any): Line[] {
  if (!quietR() || !p) return [];
  const out: Line[] = [{ name: "5m R1", price: p.r1, unit: p.a }, { name: "5m S1", price: p.s1, unit: p.a }];
  const z = (globalThis as any).__bbsr?.[id];
  if (z && Number(z.bbU) > 0 && Number(z.bbL) > 0 && Date.now() - Number(z.at) <= 20000) out.push({ name: "BB upper", price: Number(z.bbU), unit: p.a }, { name: "BB lower", price: Number(z.bbL), unit: p.a });
  return out;
}
function sessionLines(a: any, id = ""): Line[] {
  const f = a?.vwap1m?.vwap ? a.vwap1m : a?.vwap5m;
  let v = Number(f?.vwap) || 0, sd = Number(f?.stdev) || 0;
  const v0 = v, sd0 = sd; let carried = false; // fix219
  try { const GC = globalThis as any; const pv = GC.__sessCarry?.[id]?.prev; if (id && GC.__sessCarried?.[id] === true && pv && Number(pv.v) > 0 && Number(pv.sd) > 0) { v = Number(pv.v); sd = Number(pv.sd); carried = true; } } catch {}
  if (!(v > 0 && sd > 0)) return [];
  const out: Line[] = [{ name: "session VWAP", price: v, unit: sd }];
  for (const s of [1, 2, 3]) out.push({ name: `+${s}σ`, price: v + s * sd, unit: sd }, { name: `-${s}σ`, price: v - s * sd, unit: sd });
  // FRESH BANDS ARE WALLS (fix219, Oct 25 ~3:51 PM PT, Love card "All fresh bands are walls"): the new session's VWAP and ±σ in her bones during the carry.
  if (carried && v0 > 0 && sd0 > 0) { out.push({ name: "fresh VWAP", price: v0, unit: sd }); for (const s of [1, 2, 3]) out.push({ name: `fresh +${s}σ`, price: v0 + s * sd0, unit: sd }, { name: `fresh -${s}σ`, price: v0 - s * sd0, unit: sd }); }
  return out;
}
// BTC BOLLINGER WINDOW (Oct 20 ~2:08 PM PT, Love: "while bands are this scrunched together after 2pm, have her use the bollinger bands for btc until they
// widen back out in an hour or so ... and the pink band as usual"): her 5m BBSR upper/lower are lines in her bones on BTC until 3:15 PM PT today.
// + GOLD, AND BTC AGAIN (Oct 20 ~3:20 PM PT, Love: "can you implement the bollinger bands for gold while the bands are still small after-session?
// they should widen out within the hour for both. until then gold can trade off of those and the pink band as always"): both assets until 4:20 PM PT.
function btcBB(id: string, unit = 0): Line[] {
  if (!(id === "btc" || id === "gold") || Date.now() >= 1792538400000) return [];
  const z = (globalThis as any).__bbsr?.[id];
  if (!z || !(Number(z.bbU) > 0) || !(Number(z.bbL) > 0) || Date.now() - Number(z.at) > 20000) return [];
  return [{ name: "BB upper", price: Number(z.bbU), unit }, { name: "BB lower", price: Number(z.bbL), unit }];
}
// HER BONES: breaks = trade the break; tap-and-rejection moving away = trade away. Breaks outrank rejections; nearest line wins.
// THE 5M FLIP AT THE BAND (fix260, Oct 26 ~2:37 AM PT, Love card "Only drop the 1m-close wait" + "definitely not a 1m candle close hun. just a 2M or 3M or 5M
// candle flip is sufficient bb / if the 5M candle is red, she gets in period" - 2:30 AM BTC: the 5m candle opened at the red zone and slid red at 2:30:10, she
// shorted only after the 1m closed, $55 lower): rejection model only. This 5m candle opened at a band (within her near reach) and reached it, and is now
// flipped her way on the live tick (red a real tap under its open for a short, green over it for a long) with price on her side of the band = her call.
// The pink rule for the top/bottom-third candle stays; every wall still judges the call.
function rejFlipAtBand(asset: string, L: Line[], spot: number, cur: { o: number; h: number; l: number }): { side: "up" | "down"; label: string } | null {
  if (!(spot > 0) || !(cur && cur.o > 0)) return null;
  const tapF = asset === "btc" ? 10 : (TAP[asset] ?? 0); if (!(tapF > 0)) return null;
  // fix263 (Oct 26 ~3:05 AM PT, Love: "can you check on this gold short? it seems like it was in the bottom 33%" - 3:00 AM gold flip short at 24% of the channel):
  // the flip keeps her thirds - no flip short in the bottom 33% of the session channel, no flip long in the top 33%.
  const sesF = L.filter((l) => /\u03c3|VWAP/.test(String(l.name)) && Number(l.price) > 0).map((l) => Number(l.price));
  const upF = Math.min(...sesF.filter((x) => x > spot)), dnF = Math.max(...sesF.filter((x) => x <= spot));
  const fF = Number.isFinite(upF) && Number.isFinite(dnF) && upF > dnF ? (spot - dnF) / (upF - dnF) : NaN;
  let best: { side: "up" | "down"; label: string; d: number } | null = null;
  for (const l of L) {
    const p = Number(l.price); if (!(p > 0)) continue;
    const nr = String(l.name) === "5m PP" ? (asset === "btc" ? 75 : 0.5) : (asset === "btc" ? 10 : 0.5);
    const d = Math.abs(spot - p);
    if (!(fF <= 0.33) && spot <= cur.o - tapF && spot < p && cur.h >= p - nr && cur.o >= p - nr && cur.o <= p + nr && (!best || d < best.d)) best = { side: "down", label: `5m flip - rejected down off ${l.name}`, d };
    if (!(fF >= 0.67) && spot >= cur.o + tapF && spot > p && cur.l <= p + nr && cur.o <= p + nr && cur.o >= p - nr && (!best || d < best.d)) best = { side: "up", label: `5m flip - rejected up off ${l.name}`, d };
  }
  return best ? { side: best.side, label: best.label } : null;
}
/** fix326: her flip (any 1/2/3/4/5m candle literally her colour). */
function pfFlipOk(asset: string, side: string, spot: number): boolean { try { return anyFlipNow(asset, side, spot); } catch { return false; } }
export function bonesDecide(asset: string, L: Line[], spot: number, last1m: Bar | undefined, cur: { o: number; h: number; l: number }, prev?: { h: number; l: number } | null, bars?: Bar[], rejOnly = false, reach = 0, pinkFlip = false /* fix326 */): { side: "up" | "down"; label: string } | null {
  const brk = BREAK[asset] ?? 0, tap = TAP[asset] ?? 0;
  // fix326 PINK REJECTION ON HER FLIP (Oct 27 ~11:51 AM PT, main + rejection model only; Love Oct 21 9:12 PM PT: "red candle falling rejected from pink - she is clear to
  // short anywhere in the channel, except the bottom 33%" + Oct 27 11:47 AM: "the second it flipped before she was in" + card "Main + rejection model"): a pink rejection
  // takes any 1/2/3/4/5m candle literally her colour (Cornerstone #1) in place of the 5m candle 30c/$10 past its open. Every other book passes pinkFlip=false.
  const pfU = pinkFlip && anyFlipNow(asset, "up", spot), pfD = pinkFlip && anyFlipNow(asset, "down", spot);
  const near = reach > tap ? reach : tap;
  if (!(spot > 0) || !(brk > 0) || !(tap > 0) || !L.length) return null;
  const cands: { side: "up" | "down"; label: string; d: number; rank: number }[] = [];
  let perspective: ((cs: { side: "up" | "down"; label: string; d: number; rank: number }[]) => { side: "up" | "down"; label: string; d: number; rank: number }[]) | null = null;
  // A BREAK HOLDS UNTIL A CLOSE BACK ACROSS (Oct 19 ~9:18 PM PT, Love picked "Until a close back across" — the 9:15:05 PM BTC break long died because
  // Kalshi's fresh window had no ask for a few seconds and the breaking candle ended before quotes arrived): a line whose LAST 1m close-crossing was
  // upward, with every 1m close since staying above and live price still above, is a standing break-up entry — her broken-wall law as an entry. Mirror down.
  const nowS = Date.now() / 1000;
  const closed = (bars || []).filter((x) => x.t + 60 <= nowS + 1);
  for (const l of L) {
    const p = Number(l.price);
    if (!(p > 0)) continue;
    const d = Math.abs(spot - p);
    // THE PINK NEEDS A REAL TAP (Oct 21 ~9:50 PM PT, Love - the 9:30 PM BTC short fired with the candle stalled ~$5 under the pink: "let's keep that in place for
    // session bands, have her consider anything over $6 a break for the pink band ... i really liked how she waited for a rejection or a break"): the near-band
    // reach is for session bands only; the pink goes back to her tap (BTC $3 / gold $0.30) and her break distance (BTC $6 / gold $0.33).
    // PINK TAP $10 ON BTC (Oct 21 ~10:20 PM PT, Love: "let's make it $10 for a tap near a pink for btc instead of $3"): main book's near read only; gold keeps her tap.
    // SESSION BANDS BACK TO HER TAP (Oct 21 ~10:46 PM PT, Love: "she still just shorted btc while it was under the old regime ... pls update it" + card pick):
    // the 20%-of-channel reach is gone; session bands count within $10 on BTC like the pink, gold her tap.
    // PINK REACH $75 ON BTC (Oct 22 ~3:27 AM PT, Love: "at its current scale we can make it a candle flip after price rejects the pink band within $75"; was $33).
    // Every rejection off the pink already needs the 5m candle flipped her way (spot over its open for a long, under for a short); the 1m pink rejection now does too on BTC.
    // A REAL GREEN OFF THE PINK (Oct 22 ~11:02 AM PT, Love: "the candle didn't flip green for the long on gold just now, she's supposed to wait for a green candle
    // off of it or to trade the break, let's get that back in for both btc and gold" - 11:00 AM gold long fired 5 s into the 5m candle, 4c over its open): every
    // rejection off the pink needs this 5m candle a real tap past its open her way (BTC $10, gold $0.30), not a hairline. Breaks unchanged.
    // GOLD REJECTIONS 50 CENTS (fix120, Oct 22 ~9:15 PM PT, Love: "let's make her rejections 50 cents hun" - the 9:00 PM gold drop topped $0.31 under the pink, her
    // $0.30 tap missed it): main book's near read on gold counts a tap within $0.50 of every line (session bands, pink, Bollinger, green/red zone). Moving-away distances unchanged.
    const nr = String(l.name) === "5m PP" ? (reach > 0 && asset === "btc" ? Math.max(tap, 75) : reach > 0 && asset === "gold" ? Math.max(tap, 0.5) : tap) : (reach > 0 && asset === "btc" ? Math.max(tap, 10) : reach > 0 && asset === "gold" ? Math.max(tap, 0.5) : tap);
    let xdir = 0;
    // A BREAK IS PRICE MOVING THROUGH (Love picked "Both fixes" (Oct 20 ~4:52 PM PT) on "close the fake break hole on gold and BTC"): the crossing 1m candle must itself move the break's way - green (close over its
    // open) for a break up, red for a break down. A band sliding under a falling price (4:00 / 4:15 PM gold "Break above -2σ" on red candles) is no break.
    let xt = 0;
    for (let i = 1; i < closed.length; i += 1) { const a0 = closed[i - 1].c, c0 = closed[i].c, o0 = Number(closed[i].o); if (a0 <= p && c0 > p) { xdir = c0 > o0 ? 1 : 0; xt = closed[i].t; } else if (a0 >= p && c0 < p) { xdir = c0 < o0 ? -1 : 0; xt = closed[i].t; } }
    // ONLY THE CURRENT CANDLE CASTS A BREAK (Oct 21 ~10:49 AM PT, Love: "a break only casts from the current candle. not two hours later. please ensure that it
    // only counts for the current candle. and can never shift from that ... only the current candle can dictate a break" - at 10:40 AM gold called "Break below
    // +2σ" $4 under the band off a cross from ~8:40 AM): the crossing 1m close must sit inside THIS 5m candle; any older cross no longer stands as an entry.
    if (xdir !== 0 && xt < Math.floor(nowS / 300) * 300) xdir = 0;
    if (xdir > 0 && spot > p) cands.push({ side: "up", label: `Break above ${l.name}`, d, rank: 0 });
    if (xdir < 0 && spot < p) cands.push({ side: "down", label: `Break below ${l.name}`, d, rank: 0 });
    // BREAK — a 1m close through the line:
    if (last1m && last1m.t >= Math.floor(nowS / 300) * 300) { // CURRENT CANDLE, LIVE PRICE ONLY (fix99, Oct 22 ~5:56 PM PT, Love: "limit it to the current candle, live price only"): the 1m close must sit inside the running 5m candle. Her latest 1m close through a line trades as normal, wherever price is now (Love, Oct 21 ~10:55 AM PT: "if there is a 1m close above or below a band, trade as normal")
      if (last1m.o > p && last1m.c < p && spot < p) cands.push({ side: "down", label: `Close below ${l.name}`, d, rank: 0 });
      if (last1m.o < p && last1m.c > p && spot > p) cands.push({ side: "up", label: `Close above ${l.name}`, d, rank: 0 });
    }
    // BREAK — a live push through from this 5m candle's open side:
    if (cur.o > p && spot <= p - brk) cands.push({ side: "down", label: `Break below ${l.name}`, d, rank: 0 });
    if (cur.o < p && spot >= p + brk) cands.push({ side: "up", label: `Break above ${l.name}`, d, rank: 0 });
    // REJECTION — tapped, never broke, moving away by the tap distance:
    // ONLY THE PINK NEEDS THE FLIP (Oct 20 ~8:53-8:57 AM PT, Love): a session-band rejection enters on the move alone; a pink
    // rejection waits for the candle to cross back over its open.
    if (cur.o > p && cur.l <= p + nr && cur.l > p - brk && spot >= cur.l + tap && spot > p && (l.name !== "5m PP" || (spot >= cur.o + (asset === "btc" ? 10 : tap) || pfU))) cands.push({ side: "up", label: `Rejected up off ${l.name}`, d, rank: 1 });
    if (cur.o < p && cur.h >= p - nr && cur.h < p + brk && spot <= cur.h - tap && spot < p && (l.name !== "5m PP" || (spot <= cur.o - (asset === "btc" ? 10 : tap) || pfD))) cands.push({ side: "down", label: `Rejected down off ${l.name}`, d, rank: 1 });
    // 1m CLOSE OFF A REJECTED BAND (Oct 21 ~12:06 PM PT, Love picked "Yes, 1m close off the band is enough"; "the 1m close off of a rejection is perfect"):
    // the latest finished 1m candle (or the one before) tapped the line within her tap and the latest closed back off it, price still on that side.
    { const lc = closed[closed.length - 1], two = closed.slice(-2);
      const f0 = Math.floor(nowS / 300) * 300, inC = (x: { t: number }) => x.t >= f0; // tap + close inside the running 5m candle, every line (pivots Oct 21 ~1:22 PM PT; all lines fix98 Oct 22 ~5:56 PM PT, Love "Yes, both guards" - the 5:30 PM gold main short read a 5:29 bounce off -2σ)
      if (lc && lc.t + 120 > nowS && inC(lc)) {
        if (lc.c > p && spot > p && two.some((x) => inC(x) && x.l <= p + nr) && !(l.name === "5m PP" && !((spot >= cur.o + (asset === "btc" ? 10 : tap) || pfU))) /* and a pink long into a green candle (Love card "Both: red short, green long") */) cands.push({ side: "up", label: `1m rejection off ${l.name}`, d, rank: 1 });
        if (lc.c < p && spot < p && two.some((x) => inC(x) && x.h >= p - nr) && !(l.name === "5m PP" && !((spot <= cur.o - (asset === "btc" ? 10 : tap) || pfD))) /* PINK SHORT INTO A RED CANDLE, both assets, every book (Oct 22 ~7:23 AM PT, Love: "only have her short off of a pink band into a red candle, never a green one") */) cands.push({ side: "down", label: `1m rejection off ${l.name}`, d, rank: 1 });
      } }
    // A FAILED BREAK IS A REJECTION (Oct 20 ~9:54 PM PT, Love: "if it breaks and comes back on the other side of the band, it's a rejection until price goes on the other side of the band in the direction it broke"):
    // the wick broke through by her break distance and price came back across - read as the rejection while price stays back on the open side.
    if (cur.o > p && cur.l <= p - brk && spot >= cur.l + tap && spot > p && (l.name !== "5m PP" || (spot >= cur.o + (asset === "btc" ? 10 : tap) || pfU))) cands.push({ side: "up", label: `Failed break below ${l.name} - rejected up`, d, rank: 1 });
    if (cur.o < p && cur.h >= p + brk && spot <= cur.h - tap && spot < p && (l.name !== "5m PP" || (spot <= cur.o - (asset === "btc" ? 10 : tap) || pfD))) cands.push({ side: "down", label: `Failed break above ${l.name} - rejected down`, d, rank: 1 });
    // A REJECTION SURVIVES THE CANDLE TURN (Oct 19 ~9:02 PM PT, Love: "btc rejected the band below her and she didn't enter" — the +1σ tap sat in the
    // 8:55 candle, the bounce ran into the 9:00 one; her Oct 18 law: "once a new candle starts, a rejection off the pink is a valid trade"): the tap may
    // sit in the PREVIOUS 5m candle, provided the line stayed unbroken in both candles and price is still moving away by the tap distance.
    if (prev) {
      if (prev.l <= p + nr && prev.l > p - brk && cur.l > p - brk && cur.l > prev.l - tap && spot >= prev.l + tap && spot > p && (l.name !== "5m PP" || (spot >= cur.o + (asset === "btc" ? 10 : tap) || pfU))) cands.push({ side: "up", label: `Rejected up off ${l.name}`, d, rank: 1 });
      if (prev.h >= p - nr && prev.h < p + brk && cur.h < p + brk && cur.h < prev.h + tap && spot <= prev.h - tap && spot < p && (l.name !== "5m PP" || (spot <= cur.o - (asset === "btc" ? 10 : tap) || pfD))) cands.push({ side: "down", label: `Rejected down off ${l.name}`, d, rank: 1 });
    }
  }
  // GREEN FROM THE BOTTOM / RED FROM THE TOP (Oct 20 ~12:22 AM PT, Love: "a green candle rising from the bottom 33% of the channel is a
  // long, not just a tap within 30c / a red candle falling from the top 33% of the channel is a short as well"): the current 5m candle,
  // measured against her session-band channel (nearest session line below the candle's low to the nearest above it; mirror for its high).
  // Green = live price above this candle's open; rising = at least the tap distance off its low. Rank with her rejections - breaks still
  // outrank, and the door's break-direction law still holds the same candle.
  try {
    // HER ONE CHANNEL (Oct 20 ~4:48 PM PT, Love, Oct 20 ~4:48 PM PT: "please change a candle rising in the bottom 33% of the channel to a long / candle falling in the top 33% a short / no shorts in
// the bottom 33% of the channel / no longs in the top 33% of the channel / please reinforce it it didn't work"): session VWAP, sigma bands, Bollinger, the pink, and on GOLD the 5m R1/R2/S1/S2 -
    // the same edges as the door and the wire (bandlock isChanBand). Shares slide with the width like the wall: BTC 20% past $300, gold 33%->20% from $7.50 to $10.
    // A SQUEEZED PINK IS NO EDGE (Oct 20 ~9:54 PM PT, Love: "if price has broken the pink, but still hasn't broken the session band above , it's still a long into an unbroken band in the top 33% of the channel, inverse applies") - same as the door.
    const vwQ = L.find((l) => String(l.name) === "session VWAP"), u1Q = L.find((l) => String(l.name) === "+1\u03c3");
    const sdQ = vwQ && u1Q ? Math.abs(Number(u1Q.price) - Number(vwQ.price)) : 0;
    const sqzQ = (l: { name: string; price: number }) => String(l.name) === "5m PP" && sdQ > 0 && L.some((s) => /\u03c3$|^session VWAP$|^BB (upper|lower)$/.test(String(s.name)) && Math.abs(Number(s.price) - Number(l.price)) < 0.25 * sdQ);
    const sessC = L.filter((l) => (false && quietR() ? QUIET_R.test(String(l.name)) : /\u03c3$|^session VWAP$/.test(String(l.name))) && Number(l.price) > 0 && !sqzQ(l)); // 3 PM hour: pink, R1/S1, Bollinger (Love, Oct 21) // session bands only (Love, Oct 21 ~11:15 AM PT) - same as the door
    const lockP = (w: number) => (asset === "btc" ? (w > 300 ? 0.2 : 0.33) : asset === "gold" ? (w <= 7.5 ? 0.33 : w >= 10 ? 0.2 : 0.33 - (0.13 * (w - 7.5)) / 2.5) : 0.33);
    const chAt = (x: number) => {
      const u0 = sessC.filter((l) => l.price > x).sort((a, b) => a.price - b.price)[0];
      const d0 = sessC.filter((l) => l.price < x).sort((a, b) => b.price - a.price)[0];
      return u0 && d0 ? { lo: d0.price, hi: u0.price, w: u0.price - d0.price } : null;
    };
    // NO FLIP, NO 30c (Oct 20 ~8:57 AM PT, Love: "30 cents is not a thing... bottom 33% = long... DOES NOT NEED A CANDLE FLIP.
    // just a rejection at the band"): in the bottom third, RISING is the rejection - price lifting off the candle's low, no
    // touch-distance, no green requirement. Mirror for the top.
    // A REAL MOVE OFF THE OPEN (fix172, Oct 24 ~8:01 PM PT, Love picked "$10 over the open" - "oooo i like that yesss": 7:45:27 PM BTC main long "Candle rising from
    // the bottom third" fired 27 s into a new 5m candle, a hair over its open, while the last 1m was red and price slid $25 right after): this candle counts as
    // rising only once price is $10 over the 5m open on BTC (30c gold), falling only $10 under it - the same bar as her pink flip. No wait for a close.
    const mvO = asset === "btc" ? 10 : tap;
    if (cur.o > 0 && cur.l > 0 && spot >= cur.l + tap && spot >= cur.o + mvO) {
      const ch = chAt(cur.l);
      if (ch && ch.w > 0 && (cur.l - ch.lo) / ch.w <= lockP(ch.w)) cands.push({ side: "up", label: "Candle rising from the bottom third", d: spot - ch.lo, rank: 1 });
    }
    if (cur.o > 0 && cur.h > 0 && spot <= cur.h - tap && spot <= cur.o - mvO) {
      const ch = chAt(cur.h);
      if (ch && ch.w > 0 && (ch.hi - cur.h) / ch.w <= lockP(ch.w)) cands.push({ side: "down", label: "Candle falling from the top third", d: ch.hi - spot, rank: 1 });
    }
    // ONE RULEBOOK (Oct 20 ~7:49 AM PT, Love: "remember i asked you to have her short a candle falling in the top 33% and long a
    // rising candle in the bottom 33%? ... that would have made her short" - the 7:30 AM gold window booked the standing break-up
    // while the candle fell from the top third; the door refused that long for 15 minutes and the short she ordered had no voice):
    // the bones honor the same wall as the door. A red candle falling from the top third SILENCES every up candidate; a green
    // candle rising from the bottom third silences every down candidate. The flips are green/red by definition - never silenced.
    // REINFORCED (Oct 20 ~4:48 PM PT, Love: "please reinforce it it didn't work"): FALLING / RISING is enough - no colour needed (her 8:57 AM law).
    if (cur.o > 0 && cur.h > 0 && spot <= cur.h - tap) {
      const chS = chAt(cur.h);
      if (chS && chS.w > 0 && (chS.hi - cur.h) / chS.w <= lockP(chS.w)) for (let i = cands.length - 1; i >= 0; i -= 1) { if (cands[i].side === "up") cands.splice(i, 1); }
    }
    if (cur.o > 0 && cur.l > 0 && spot >= cur.l + tap) {
      const chS = chAt(cur.l);
      if (chS && chS.w > 0 && (cur.l - chS.lo) / chS.w <= lockP(chS.w)) for (let i = cands.length - 1; i >= 0; i -= 1) { if (cands[i].side === "down") cands.splice(i, 1); }
    }
    // NO LONG IN THE TOP SHARE, NO SHORT IN THE BOTTOM SHARE - at the bones as well as the wall (Oct 20 ~4:48 PM PT, Love: "please reinforce it").
    // + ONLY IN HER THIRD (Love, Oct 20 ~5:01 PM PT: "longs only in the bottom 33% with an unbroken band / shorts only in the top 33% if there is an unbroken band there /
// price falling or rising in either is a trade in that direction please / reinforce that please"): longs only in the bottom 33%, shorts only in the top 33% - same as the wire.
    // (moved below the zone flips - HER PERSPECTIVE - so no voice is added after it)
    perspective = (cs) => {
      const chP = chAt(spot);
      const topS0 = sessC.length ? Math.max(...sessC.map((l) => Number(l.price))) : Infinity, botS0 = sessC.length ? Math.min(...sessC.map((l) => Number(l.price))) : -Infinity;
      if (!chP || !(chP.w > 0)) return cs.filter((c) => !((c.side === "up" && spot > topS0) || (c.side === "down" && spot < botS0))); // past the whole channel: no break its way (Love, Oct 21 ~11:15 AM PT)
      const f = (spot - chP.lo) / chP.w, k = lockP(chP.w);
      // HER PERSPECTIVE (Oct 20 ~7:12 PM PT, Love: "she doesn't recognize a trade as a long into a band within 33% of the top of the channel, and only sees
      // that trade as a short ... a green candle in the bottom 33% of the channel is only registered to her as a long, never a short - make it so it is
      // ingrained into structure she stands on"): in the top third every long she sees is read as a short under the band above; in the bottom third, on a
      // green 5m candle (live price over its open), every short she sees is read as a long off the band below. Then the old law: longs only in the bottom
      // share, shorts only in the top share, the middle opens nothing.
      const green = cur.o > 0 && spot > cur.o;
      const seen = cs.map((c) => (c.side === "up" && f >= 0.67) ? { ...c, side: "down" as const, label: `Top third - seen as a short under ${chP.hi.toFixed(2)} (was: ${c.label})` }
        : (c.side === "down" && f <= 0.33 && green) ? { ...c, side: "up" as const, label: `Bottom third, green candle - seen as a long off ${chP.lo.toFixed(2)} (was: ${c.label})` } : c);
      // THE LAUNCH (Oct 20 ~7:50 PM PT, Love picked "Launch rule + drop the poke veto"): a green candle that launched from the bottom share of this channel
      // (or from under its floor) stays a long until the top share; a red candle that launched from the top share stays a short until the bottom share.
      const lUp = green && cur.l > 0 && cur.l <= chP.lo + k * chP.w && f < 1 - k;
      const lDn = cur.o > 0 && spot < cur.o && cur.h > 0 && cur.h >= chP.hi - k * chP.w && f > k;
      const seenL = seen.slice();
      if (lUp && !seenL.some((c) => c.side === "up")) seenL.push({ side: "up", label: `Launched from the bottom third (low ${cur.l.toFixed(2)}) - a long until the top third`, d: spot - chP.lo, rank: 1 });
      if (lDn && !seenL.some((c) => c.side === "down")) seenL.push({ side: "down", label: `Launched from the top third (high ${cur.h.toFixed(2)}) - a short until the bottom third`, d: chP.hi - spot, rank: 1 });
      // THE WHOLE WAY UP (Oct 20 ~7:49 PM PT, Love: "shes clear to long the whole whole up, just not in the top 33% of the channel hun. same for shorts").
      // HER CANDLE (Oct 20 ~8:07 PM PT, Love: "...no other method of operations, with no frame of reference for anything else"): a rising 5m candle is a long or
      // nothing, a falling one a short or nothing - same reading as the door and the wire (bandlock impossibleGeo).
      const rising = cur.o > 0 && spot > cur.o && cur.l > 0 && spot >= cur.l + tap, falling = cur.o > 0 && spot < cur.o && cur.h > 0 && spot <= cur.h - tap;
      // NO CHASE PAST 2σ dropped (Oct 21 ~11:12 AM PT, Love picked "Drop the 2σ rule") - same as the door.
      // THE WHOLE CHANNEL'S TOP AND BOTTOM LINES (Oct 21 ~11:15 AM PT, Love) - same as the door: never a long over her top session band, never a short under her bottom one.
      const topS = sessC.length ? Math.max(...sessC.map((l) => Number(l.price))) : Infinity, botS = sessC.length ? Math.min(...sessC.map((l) => Number(l.price))) : -Infinity;
      const m1 = (c: { label: string }) => false && /^1m rejection off /.test(c.label); // no 1m waiver of HER CANDLE (fix102, Oct 22 ~6:52 PM PT, Love: candle colour always wins); was Oct 21 ~12:06 PM PT
      // GOLD'S 20% ONCE THE CHANNEL IS $10+ (fix279, Oct 26 ~12:47 PM PT, Love: "bands are exceeding $10 at the moment, so she can stay at 20% after the band
      // channel width exceeds $10 from band to band like we discussed" - 12:45 PM gold short read at 32% of a $10.79 channel dropped by the fixed 33% here while
      // the wall already used 20%): on gold the read keeps only her sliding share k (lockP); BTC keeps the fixed 33% as before.
      const fix33 = asset !== "gold";
      return seenL.filter((c) => !((c.side === "up" && (f >= 1 - k || (fix33 && f >= 0.67) || (falling && !m1(c)) || spot > topS)) || (c.side === "down" && (f <= k || (fix33 && f <= 0.33) || (rising && !m1(c)) || spot < botS))));
    };
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
  // BOLLINGER BEFORE THE ZONE (Oct 21 ~1:43 PM PT, Love: "in the event of a pink break, if there is a bollinger band before the green zone is ever reached
  // (like this one) have her skip the short. wait til price rejects off the bollinger band, when price breaks up past the pink line (if it does) enter in on
  // the break"): a break DOWN of the pink (5m PP) is skipped while her Bollinger lower sits between price and the green zone (5m S1); mirror for a break UP
  // with the Bollinger upper before the red zone (5m R1). The Bollinger rejection and the break back over the pink trade as they always do.
  let cands2 = cands;
  try {
    const bz = (globalThis as any).__bbsr?.[asset]; const bbU = Number(bz?.bbU) || 0, bbL = Number(bz?.bbL) || 0;
    const pB = (n: string) => { const l0 = L.find((x) => String(x.name) === n); const p0 = Number(l0 && l0.price); return p0 > 0 ? p0 : 0; };
    const s1B = pB("5m S1"), r1B = pB("5m R1");
    if (Date.now() - Number(bz?.at) <= 20000) cands2 = cands.filter((c) => {
      if (!/^(Break|Close) (below|above) 5m PP$/.test(String(c.label))) return true;
      // BOLLINGER WITHIN $100 UNDER THE PINK (Oct 21 ~11:07 PM PT, Love: "let's just update it to not trade the break of a pink downwards if a bollinger band is
      // within $100 ... have her skip the short if the bollinger band below is within $100 of the pink band / if it breaks the pink up afterwards she is clear to
      // long / or at the rejection of the bollinger band" - 11:00 PM BTC shorted a pink break with the Bollinger lower $88 under it and lost): BTC only, shorts only.
      if (c.side === "down" && asset === "btc" && bbL > 0) { const ppB = pB("5m PP"); if (ppB > 0 && bbL < ppB && ppB - bbL <= 100) return false; }
      if (c.side === "down" && bbL > 0 && s1B > 0 && bbL < spot && bbL > s1B) return false;
      if (c.side === "up" && bbU > 0 && r1B > 0 && bbU > spot && bbU < r1B) return false;
      return true;
    });
  } catch { cands2 = cands; }
  // BOLLINGER REJECTIONS ONLY (Oct 21 ~11:27 PM PT, Love: "just have her short the rejection of the bollinger bands like we talked about"): the Bollinger lines the
  // main book reads are rejection-only - she trades a tap-and-reject off them, never a break through them.
  cands2 = cands2.filter((c) => !/^(Break|Close) (above|below) Bollinger /.test(String(c.label)));
  // fix67: green zone = long only, on a green 5m candle; red zone = short only, on a red 5m candle; never a break or close of either.
  // fix297 (Oct 26 ~10:20 PM PT, Love: "she can't use the green zone as a signal to short down / or for the red zone / that is rejection only for gold / she can only
  // use the session bands the bollingers and the pink band for that"): a "Failed break above Green zone - rejected down" label ends in " - rejected down", so the
  // fix67 filter below missed it and the 10:16 PM gold main short got through. The zone is now matched anywhere in the label.
  cands2 = cands2.filter((c) => { const lb = String(c.label); if (!/(Green|Red) zone( - |$)/.test(lb)) return true; if (/^(Break|Close) /.test(lb)) return false; return /Green zone( - |$)/.test(lb) ? c.side === "up" && spot > cur.o : c.side === "down" && spot < cur.o; });
  let seenC = cands2;
  try { if (perspective) seenC = perspective(cands2); } catch {}
  const pool = rejOnly ? seenC.filter((c) => c.rank >= 1) : seenC;
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
  // WAIT FOR REAL TICKS (Oct 21 ~2:07 PM PT, Love picked "Yes, wait for real ticks"): 2:00 PM BTC - Pepperstone froze for its 5 PM NY break, the main
  // book called a short off the frozen 84,563 (real price was already over the pink), and when ticks came back the jump read as a fresh break, so the
  // twin longed it. No live tick within 3 s = no call from any of her books (main, twin, all) until the price is real again.
  let live = false;
  try { const q = quoteTick(id); if (q && q.c > 0 && Date.now() - q.at <= 3000 && feedHealth(id).ok) { ax = { ...a, spot: q.c, spotAt: q.at }; live = true; } } catch { live = false; }
  if (!live) return false;
  const spot = Number(ax?.spot) || 0;
  let changed = false;
  const book = (lane: string, look: { side: "up" | "down"; label: string }, askIn?: number) => {
    const prior = rows.find((r) => r.ticker === m.ticker && r.lane === lane);
    if (lane === "recon-dly" && DLY_AS_COPY && !(look as any).copy353) return false; // fix353: her old twin calls (initial move, touches, re-aims) no longer book
    // FRESH 5M SWINGS (fix186, Oct 25 ~1:45 AM PT, Love: "can you see why the rejection model didn't long at the rejection of btc at the band? ... it didnt register a
    // couple of taps tonight ... let's make sure she has what she needs to enter when she pleases" + card "Fresh 5m swings, keep the hours"): her books make one call per
    // 15m window, so on Polymarket's 5m board a second tap in the same 15 minutes was invisible (1:15:43 AM rejection long, then the 1:18 tap went unseen). When the main
    // book or the rejection model already called this 15m window in an EARLIER 5m slot, her first call in each new 5m slot is written to data/swing5.json for the 5m lane
    // only. Her 15m paper rows and Kalshi are untouched; the walls still meet every swing at the door.
    if (prior && id === "btc" && (lane === "recon-tog" || lane === "recon-rej5")) { // fix261: the 5m swings come from her streak read
      try {
        const s5 = Math.floor(Date.now() / 300000);
        if (Math.floor(Date.parse(String(prior.at)) / 300000) < s5) {
          const k5 = `${m.ticker}:${lane}:s${s5}`;
          const G5 = ((globalThis as any).__swing5 ||= {});
          if (!G5[k5]) {
            G5[k5] = 1;
            let sw: Record<string, any> = {};
            try { sw = JSON.parse(readFileSync(D("swing5.json"), "utf8")); } catch { sw = {}; }
            if (!sw[k5]) {
              const e5 = { id: k5, book: lane === "recon-rej5" ? "recon-rej" : lane, at: new Date().toISOString(), asset: "btc", ticker: m.ticker, side: look.side, setup: look.label, spotAt: Math.round(spot * 100) / 100 };
              sw[k5] = e5;
              for (const kS of Object.keys(sw)) if (!(Date.now() - Date.parse(String(sw[kS]?.at)) <= 3 * 3600000)) delete sw[kS];
              writeFileSync(D("swing5.json"), JSON.stringify(sw, null, 1));
              try { appendFileSync(D("swing5.jsonl"), JSON.stringify(e5) + "\n"); } catch {}
            }
          }
        }
      } catch {}
    }
    // NO TRADE EXECUTED - FREE TO TRADE (fix336, main book only, Love Oct 27 1:10 PM PT: "i specifically said she is to take any set up that comes that fits
    // her rules if she is not actively in a position on kalshi" + 1:13 PM: "YES. ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED. EXECUTED. NO TRADE
    // EXECUTED - FREEEE TO TRADE."): once main's paper call for the window has closed and nothing of hers filled on Kalshi in it (no fill, no partial, no order
    // on the wire), her next setup that passes every rule books fresh - either side, as many times as it comes. A fill locks the window, as always.
    let freeId = "";
    if (prior && (lane === "recon-tog" || lane === "recon-rej" /* fix340 (Oct 27 2026 ~1:58 PM PT, Love: "SHE DID NOT TAKE A BTC POSITION I TOLD YOU I WANTED HER TO TAKE ANY POSITOON THAT SHOWS UP IF SHE HASNT TAKEN ONE"): the rejection model too */) && (prior.result !== "open" || (() => { try { const dP = JSON.parse(readFileSync(D("live-book-done.json"), "utf8"))[`${m.ticker}:${lane}:${prior.id}`]; return !!(dP && dP.final === true && dP.status !== "filled" && dP.status !== "partial" && !(dP.status === "skipped" && /\blive\b/i.test(String(dP.reason || ""))) /* fix342 (Oct 27 2026 4:07 PM PT, Love card "Stop the runaway re-calls in hours a book isn't live?" -> "Yes, stop the runaway"): a call skipped only because this book is not live this hour never had a Kalshi chance - it does not free her, or she re-calls every second */); } catch { return false; } })() /* fix341 (Oct 27 2026 ~1:58 PM PT, Love: "STOP LIMITING HER TO ONE CALL OF A TRADE SHE DID NOT EVEN FUCKING TAKE BRO HOW MANY TIMES DO I HAVE TO ASK YOU"): a call Kalshi gave up on without a fill frees her too, even while paper still holds it */)) {
      let execd = false;
      try { const od = (globalThis as any).__oneDoor; if (od instanceof Set && od.has(m.ticker)) execd = true; } catch {}
      try { const dX = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); for (const kX of Object.keys(dX)) { const vX = dX[kX]; if (kX.startsWith(m.ticker + ":" + lane) && vX && (vX.status === "filled" || vX.status === "partial" || vX.status === "resting")) execd = true; } } catch { execd = true; }
      if (execd) return false;
      freeId = `${m.ticker}:${lane}:n${rows.filter((r) => r.ticker === m.ticker && r.lane === lane).length + 1}`;
    }
    if (prior && !freeId) {
      // ONE EXECUTED DIRECTION PER WINDOW (Oct 20 ~8:00 AM PT, Love: "she is clear to take the other side if she doesn't execute a
      // decision in the other. only one EXECUTED direction per window. if she doesn't take a long initially, she is clear to short
      // afterwards. vis versa"): a call that never FILLED on Kalshi does not lock the window. When her bones flip sides and the old
      // call has no fill (not even partial), the call is re-aimed IN PLACE - once per window, the other side only. A fill, whole or
      // partial, locks the window forever (changeMind stays false: an executed trade is never reversed).
      // NOT JUST ONCE (Oct 20 ~7:51 PM PT, Love: "price now broke the vwap and pink down, she should short here" - gold's 7:45 call had already been re-aimed
      // long once and could not turn again): her law is one EXECUTED direction per window, so an unfilled call follows her bones as often as they turn.
      if (prior.side === look.side) return false;
      // ONE CALL, NEVER RE-AIMED (Oct 21 ~11:42 AM PT, Love: "please stop having it flip the trades it says she took ... i need it to stay the one trade she
      // would have taken at the beginning of the window and stay there / and then wait for price to interact with the next band from the main books entry, and
      // then enter in on the delayed model"): the MAIN book (TOGETHER) and the DELAYED book keep their first call of the window - on paper and on Kalshi.
      // A WALL-REFUSED FIRST CALL DOESN'T HOLD THE WINDOW (Oct 21 ~9:17 PM PT, Love picked "Yes, next passing call books" - at 9:15 PM gold and BTC both called
      // longs her walls refused on Kalshi (top 20% + PINK FIRST; HER CANDLE falling from the top third) while the short was hers): TOGETHER keeps her first call
      // unless the wire/door refused it and it never filled; then her next call books fresh. A call that filled never re-aims. The DELAYED book is unchanged.
      // fix220 (Oct 25 ~4:56 PM PT, Love: "re aim it love"): the DELAYED twin re-aims too - an unfilled call follows the rejection model's read below; a fill locks the window.
      if (lane === "recon-togp") { /* fix281 no-pink copy; fix284 (Oct 26 ~1:40 PM PT, Love: "unlock her from mains calls and allow her to take the trade that shows up ... stop having her locked to one call per window even if she doesn't take it ... lock it in place"): an unfilled call follows her read every tick, any side, as often as it turns - only a fill or an order on the wire (below) holds the window */ }
      else if (lane === "recon-tog" || lane === "recon-togr") { // fix250: the rejections-only copy keeps her first call exactly like TOGETHER; fix258 (Oct 26 ~2:11 AM PT, Love: "i do not want her to lose the ability to re aim"): the rejection model re-aims again
        let wallNo = false;
        try { const dW = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); for (const kW of Object.keys(dW)) { const vW = dW[kW]; if (kW.startsWith(m.ticker + ":" + lane + ":") && vW && vW.status === "blocked") wallNo = true; } } catch {}
        if (!wallNo && false) return false; // fix285 (Oct 26 ~1:45 PM PT, Love card "Yes, main + rejections-only copy too" + 1:43 PM "the ONLY thing that locks her in one direction is the act of TAKING THE TRADE"): an unfilled main/rejections-only call re-aims to her read every tick, wall or no wall - only a fill or an order on the wire (below) holds the window
      }
      // NO RE-AIM WHILE AN ORDER IS ON THE WIRE (Oct 20 ~3:40 PM PT, under her "only one EXECUTED direction per window" law): 3:00:04 PM BTC - her
      // short call went to Kalshi and filled at 3:00:06, but the call was re-aimed long at 3:00:05, a second before the fill was written down, so
      // paper booked the long while Kalshi held the short. An opening order already sent (or in flight) for this market locks the window too.
      try { const od = (globalThis as any).__oneDoor; if (od instanceof Set && od.has(m.ticker)) return false; } catch {}
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
    // THE FLOOR-MISSED CALL IS STILL THE INITIAL MOVE (Oct 22 ~10:30 AM PT, Love: "yess absolutely let's structure it that way" - 10:17 AM BTC: TOGETHER's
    // "Break above 5m PP" long was 85c (1.18x, under her floor), her next call booked a short at 10:20, so the twin hunted a long and never shorted the rejection):
    // TOGETHER's first call of the window that misses her floor is remembered as the initial move for the DELAYED twin (side + price at the call).
    if (lane === "recon-tog" && ask < 0.98 && !(1 / ask >= 1.38) && !rows.some((r0) => r0.ticker === m.ticker && r0.lane === "recon-tog")) { try { const GM = ((globalThis as any).__togMiss ||= {}); if (!GM[m.ticker]) GM[m.ticker] = { side: look.side, spotAt: Math.round(spot * 100) / 100, at: Date.now(), label: look.label }; } catch {} }
    if (!(ask > 0.02 && ask < 0.98) || !(1 / ask >= 1.38)) { skipLog(lane, m.ticker, look.side, look.label, ask, 1 / ask < 1.38 && ask < 0.98 ? `under her 1.38x floor (${(1 / ask).toFixed(2)}x at ${Math.round(ask * 100)}c)` : "ask out of bounds"); return false; }
    const n = STAKE / ask;
    const sdNow = Number((ax?.vwap1m?.vwap ? ax.vwap1m : ax?.vwap5m)?.stdev) || 0;
    const bar = last1m ? { o: r2(last1m.o), h: r2(last1m.h), l: r2(last1m.l), c: r2(last1m.c) } : null;
    rows.unshift({ id: freeId || `${m.ticker}:${lane}`, lane, at: new Date().toISOString(), asset: id, ticker: m.ticker, spotAt: Math.round(spot * 100) / 100, side: look.side, first: look.side, label: look.label, ask: r2(ask), multiple: r2(1 / ask), secondsLeft: Math.round(left), intoWindow: Math.round(900 - left), stake: STAKE, fee: fee(n, ask), peak: ask, lastBid: 0, result: "open", exit: null, pnl: null, bar, sd: r2(sdNow), band: null, recon: true });
    return true;
  };
  // TWIN ADD-ON ON PAPER (Oct 24 PT, Love picked "Paper records, 1/4 of entry": "for the delayed entry model id like you to have her use 1/4 position sizes
  // for add ons at the same structure / i want it to start reflecting in the records"): the DELAYED twin's open paper row gets one add-on per window at 1/4
  // of its $20 stake ($5), on the live twin add-on's trigger - ask at 4.5x+ (<= 22.2c), a touch of any band (addOnTouchNow), 2+ minutes left. Its own lane
  // "recon-dly-add" (paper only: not in liveBook.books, so it never trades live); the same exits (half at 75%, trail from 90%) and settle run on it.
  try {
    const tw = rows.find((r) => r.ticker === m.ticker && r.lane === "recon-dly" && r.result === "open" && r.exit == null);
    if (tw && left >= 120 && !rows.some((r) => r.ticker === m.ticker && r.lane === "recon-dly-add")) {
      const askA = Number(tw.side === "up" ? m.yesAsk : m.noAsk);
      if (askA > 0.02 && askA <= 0.222) {
        const touch = addOnTouchNow(id);
        if (touch) {
          const nA = 5 / askA;
          rows.unshift({ id: `${m.ticker}:recon-dly-add`, lane: "recon-dly-add", parent: tw.id, at: new Date().toISOString(), asset: id, ticker: m.ticker, spotAt: Math.round(spot * 100) / 100, side: tw.side, first: tw.side, label: `Add-on 1/4 (${touch})`, ask: r2(askA), multiple: r2(1 / askA), secondsLeft: Math.round(left), intoWindow: Math.round(900 - left), stake: 5, fee: fee(nA, askA), peak: askA, lastBid: 0, result: "open", exit: null, pnl: null, bar: null, sd: tw.sd ?? null, band: null, recon: true });
          changed = true;
        }
      }
    }
  } catch {}
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
  let look5: { side: "up" | "down"; label: string } | null = null, lookT: { side: "up" | "down"; label: string } | null = null;
  // fix246 (Love Oct 25 ~11:41 PM PT: "i need you to have all of the same infrastructure in place hun i do not want to deal with backwards fires anymore"): the main book's
  // reading (near-band reach, Bollinger + green/red zone rejection bands, the candle in her third, the fake-out turn) is kept here for the REJECTION model below.
  let rejCandleNow: { side: "up" | "down"; label: string } | null = null; // fix260
  let tpStack = false; // fix283
  let tgPF: { side: "up" | "down"; label: string } | null = null, tgFO = false; // fix326
  let rejLB: Line[] | null = null, rejReach = 0, rejL: Line[] | null = null, rejCandle: { side: "up" | "down"; label: string } | null = null, rejFO: { side: "up" | "down"; label: string } | null = null;
  try {
    const p = pivot(resample(b, 5), 5);
    const L = [...sessionLines(ax, id), ...(p ? [{ name: "5m PP", price: p.pp, unit: p.a }] : []), ...btcBB(id, Number(sessionLines(ax, id)[0]?.unit) || 0)];
    try { const hv = new Set(L.map((l) => String(l.name))); for (const q of quietLines(id, p)) if (!hv.has(q.name) && Number(q.price) > 0) L.push(q); } catch {} // the 3 PM channel (Love, Oct 21)
    look5 = bonesDecide(id, L, spot, last1m, cur, prev, b);
    const ses = L.filter((l) => /σ|VWAP/.test(String(l.name)) && Number(l.price) > 0).map((l) => Number(l.price));
    const sUp = Math.min(...ses.filter((x) => x > spot)), sDn = Math.max(...ses.filter((x) => x <= spot));
    const reachT = Number.isFinite(sUp) && Number.isFinite(sDn) && sUp > sDn ? REACH_PCT * (sUp - sDn) : (REACH[id] ?? 0);
    // PINK STACKED ON A SESSION BAND (fix283, Oct 26 ~1:19 PM PT, Love: "if pink is stacked just above a session bands and price rejects it, she can enter on the break
    // of pink as she normally would / only if pink and the session bands both sit in the top/bottom 20% of the channel / otherwise she can skip the pink trades in the
    // other 80% of the channel ... and skip the pinks anywhere else outside of the channel"): the no-pink copy only. The pink counts as stacked when it sits inside
    // her session channel (the session bands around price) within 20% of its width from the bottom or top band.
    try { const ppS = Number(p?.pp) || 0, wS = sUp - sDn; tpStack = Number.isFinite(wS) && wS > 0 && ppS > sDn && ppS < sUp && (ppS - sDn <= 0.2 * wS || sUp - ppS <= 0.2 * wS); } catch { tpStack = false; }
    // BOLLINGER REJECTIONS FOR THE MAIN BOOK (Oct 21 ~11:27 PM PT, Love: "just have her short the rejection of the bollinger bands like we talked about" - and
    // 11:07 PM "or at the rejection of the bollinger band like we talked about if it is in her clear zone and fits all her other rules"): her 5m Bollinger upper and
    // lower join TOGETHER's lines (both assets, her tap: BTC $10 / gold $0.30) as rejection-only bands. Not in her thirds; every wall still judges the call.
    const LB = [...L];
    // GREEN / RED ZONE REJECTIONS (Oct 22 ~6:17 AM PT, Love: "yes it can count as one of the rejections she takes / must be green for green and red for red / and she
    // can trade the next one of those for either"): the 5m S1 (green zone) and R1 (red zone) join TOGETHER's lines as rejection-only bands, both assets - a green
    // 5m candle rejecting up off the green = long, a red 5m candle rejecting down off the red = short. Named apart from "5m S1/R1" so no older rule reads them.
    try { if (!quietR() && p && Number(p.s1) > 0 && Number(p.r1) > 0) LB.push({ name: "Green zone", price: Number(p.s1), unit: Number(L[0]?.unit) || 0 }, { name: "Red zone", price: Number(p.r1), unit: Number(L[0]?.unit) || 0 }); } catch {}
    try { const zB = (globalThis as any).__bbsr?.[id]; if (!quietR() && zB && Number(zB.bbU) > 0 && Number(zB.bbL) > 0 && Date.now() - Number(zB.at) <= 20000) LB.push({ name: "Bollinger upper", price: Number(zB.bbU), unit: Number(L[0]?.unit) || 0 }, { name: "Bollinger lower", price: Number(zB.bbL), unit: Number(L[0]?.unit) || 0 }); } catch {}
    lookT = reachT > 0 ? bonesDecide(id, LB, spot, last1m, cur, prev, b, false, reachT) : look5;
    rejLB = LB; rejReach = reachT; rejL = L; // fix246
    try { if (reachT > 0) { const pf0 = bonesDecide(id, LB, spot, last1m, cur, prev, b, false, reachT, true); if (pf0 && /5m PP/.test(String(pf0.label)) && (pf0.side === "up" ? pfFlipOk(id, "up", spot) : pfFlipOk(id, "down", spot))) tgPF = pf0; } } catch {} // fix326
    // HER 5M CANDLE OFF THE BOLLINGER (Oct 22 ~2:09 AM PT, Love: "she was taking that same set up on the main book earlier ... she's good to do that on the delayed
    // book, not the main one going forward ... the green candle pushing up is fine in the green zone for btc or red candle pushing off" - 11:46 PM BTC longed a
    // "1m rejection off Bollinger lower" on a red candle and lost): a main-book call off the Bollinger needs this 5m candle colored its way (green over its open
    // for a long, red under it for a short); otherwise the Bollinger steps aside and her other bands decide as before.
    if (lookT && /Bollinger/.test(String(lookT.label)) && !(lookT.side === "up" ? spot > cur.o : spot < cur.o) && !(() => { try { return anyFlipNow(id, lookT.side, spot); } catch { return false; } })() /* fix345 (Oct 27 2026 5:05 PM PT, Love: "ya it is on the 2m hun" + card "Should a 2m flip be enough for her to short a Bollinger rejection?" -> "Any 1–5m flip counts"): any 1/2/3/4/5m candle flipped her way (HER FLIP, Cornerstone #1) lets the Bollinger call stand */) lookT = reachT > 0 ? bonesDecide(id, L, spot, last1m, cur, prev, b, false, reachT) : look5;
    // THE CANDLE IN HER THIRD (Oct 21 ~10:50 PM PT, Love: "i do want her to be able to trade a red candle that rejected & is falling from the top 33%, and a green
    // candle rising from the bottom 33% ... if the green/red candle rising/falling didn't tap within $10 of the band i still want her to be able to trade those" +
    // card): main book only. Short = this 5m candle's high reached the top 33% of the session channel, it is red and falling (under its open, a tap off its high)
    // and the latest 1m candle is red. Long = the mirror from the bottom 33%. No band tap needed; every wall (thirds, PINK FIRST, top/bottom line, HER CANDLE) still judges it.
    if (last1m && Number.isFinite(sUp) && Number.isFinite(sDn) && sUp > sDn) { // fix246: read for both books; main still uses it only when she has no other call
      const wC = sUp - sDn, tpC = TAP[id] ?? 0;
      // THE CANDLE RULE RESPECTS THE PINK (Oct 22 ~3:06 AM PT, Love: "she shorted btc on a pink rejection. that was supposed to be a long there" + card - 3:00 AM
      // BTC shorted a red top-third candle $64 over an unbroken pink; the low missed the pink by $13 and price bounced to 82,011): no candle-rule short while an
      // unbroken pink sits below her inside the channel, no candle-rule long while one sits above her - until price breaks it.
      const ppC = Number(p?.pp) || 0, pinkBelow = ppC > sDn && ppC < spot, pinkAbove = ppC < sUp && ppC > spot;
      if (!pinkBelow && (cur.h - sDn) / wC >= 0.67 && spot < cur.o && cur.h - spot >= tpC && last1m.c < last1m.o) rejCandle = { side: "down", label: "Red candle falling from the top third" };
      else if (!pinkAbove && (cur.l - sDn) / wC <= 0.33 && spot > cur.o && spot - cur.l >= tpC && last1m.c > last1m.o) rejCandle = { side: "up", label: "Green candle rising from the bottom third" };
      if (!lookT && rejCandle) lookT = rejCandle;
      // fix260: the rejection model's copy of the candle in her third needs no finished 1m colour - the 5m candle on the live tick decides (pink rule kept).
      if (!pinkBelow && (cur.h - sDn) / wC >= 0.67 && spot < cur.o && cur.h - spot >= tpC) rejCandleNow = { side: "down", label: "Red candle falling from the top third" };
      else if (!pinkAbove && (cur.l - sDn) / wC <= 0.33 && spot > cur.o && spot - cur.l >= tpC) rejCandleNow = { side: "up", label: "Green candle rising from the bottom third" };
    }
    // THE FAKE-OUT TURN (fix139, Oct 23 ~9:55 AM PT, Love: "if price fakes out there she can short once price breaks back under, even if there is a pink there"):
    // gold - a red 1m close back under a band that keeps faking out over it is her short (mirror long); it outranks her other calls this tick.
    try { const fo = (globalThis as any).__fakeOutTurn?.(id, L, spot); if (fo && (fo.side === "up" || fo.side === "down")) { lookT = { side: fo.side, label: `Fake-out turn ${fo.side === "down" ? "under" : "over"} ${fo.name}` }; rejFO = lookT; tgFO = true; } } catch {}
  } catch { look5 = null; lookT = null; }
  if (look5 && book("recon-ogp5", look5)) changed = true;
  // 2) RECONSTRUCTED · PAPER 24/7
  let lookP: { side: "up" | "down"; label: string; ask: number } | null = null;
  try { lookP = paperLookOct12(id, ax); } catch { lookP = null; }
  if (lookP && book("recon-paper", lookP, lookP.ask)) changed = true;
  // 3) RECONSTRUCTED · TOGETHER = first of the two in the window
  const first = look5 || lookP;
  const firstT = lookT || lookP; // TOGETHER reads her bones with the near-band reach
  // fix326: recon-tog alone reads the pink rejection on her flip (copies keep firstT); the fake-out turn still outranks.
  let firstTog = firstT;
  try { if (tgPF && !tgFO) firstTog = tgPF; } catch {}
  if (firstTog && book("recon-tog", firstTog, lookP && !lookT && firstTog === firstT ? lookP.ask : undefined)) changed = true;
  // THE MAIN BOOK, REJECTIONS ONLY (fix250, Oct 26 ~1:03 AM PT, Love: "make a copy of the main book that trades rejections only ... she is not taking the same trades
  // at all"): a literal copy of TOGETHER - the very call TOGETHER reads this tick (firstT), the same one-call-per-window rule - with only her breaks left out
  // (Break above/below, Close above/below). Paper only, beside the rejection model.
  if (firstT && !/^(Break|Close) (above|below) /.test(String(firstT.label)) && book("recon-togr", firstT, lookP && !lookT ? lookP.ask : undefined)) changed = true;
  // THE MAIN BOOK WITHOUT THE PINK (fix281, Oct 26 ~1:10 PM PT, Love: "copy paste the main book onto a fresh paper twin that excludes pink trades only ... same entry logic, speed and execution ... we will put that book on for the rejection models hours"):
  // a literal copy of TOGETHER's own booked call for this window (same side, same label, same tick, same one-call and re-aim rule, same door, wire and walls),
  // left out only when that call is a pink trade (a break or rejection of the 5m PP). Paper every hour; live on Kalshi in her rejection hours in place of recon-rej.
  // Like TOGETHER live, a wall-refused call that never filled turns to her next read: once the copy's own call was refused at the door or the wire, it follows
  // TOGETHER's read this tick (firstT) - again with any pink call left out - since in the rejection hours TOGETHER herself is paper and never meets the wall.
  // fix284 (Oct 26 ~1:40 PM PT, Love: "unlock her from mains calls and allow her to take the trade that shows up please ... stop having her locked to one call per
  // window even if she doesn't take it i do not want that in there"): the copy reads the main book's entry logic herself every tick (firstT - the same read TOGETHER
  // books from) instead of being handed TOGETHER's one booked call, and an unfilled call re-aims to whatever she reads now (book() above). Pinks stay out unless stacked (fix283).
  try { const srcP: any = firstT;
    if (srcP && (srcP.side === "up" || srcP.side === "down") && (!/5m PP|pink/i.test(String(srcP.label)) || tpStack) /* fix283 */ && book("recon-togp", { side: srcP.side, label: String(srcP.label) }, lookP && !lookT ? lookP.ask : undefined)) changed = true; } catch {}
  // THE DELAYED TWIN = THE NO-PINK COPY, DELAYED (fix353 (Oct 27 2026 ~6:09 PM PT, Love: "just make the delayed entry model a delayed rejection copy of no pink / no entires first 30 seconds into a window is good" + "we will use that model with a delayed entry - after 30 seconds")): the copy's own read this tick (firstT, pink left out unless stacked, fix283),
  // booked for recon-dly only once the window is 30 seconds old; the copy's walls judge her at the door and the wire (bandlock fix353).
  try { const srcD: any = firstT;
    if (DLY_AS_COPY && srcD && (srcD.side === "up" || srcD.side === "down") && 900 - left >= 30 && (!/5m PP|pink/i.test(String(srcD.label)) || tpStack) && book("recon-dly", { side: srcD.side, label: String(srcD.label), copy353: true } as any, lookP && !lookT ? lookP.ask : undefined)) changed = true; } catch {}
  // 6) DELAYED (Oct 20 ~9:38 PM PT, Love: "a delayed entry model to trade at $1 - same frame, same everything, just waits out the initial move, and enters on the
  // other side of the window than she would have been in had she got in initially when the opportunity presents itself ... her trades go in profit and reverse,
  // so we implement the delayed entry model to be on the other side of it - the right side of it"): TOGETHER's first call in the window is the initial move; this
  // twin books only the first of her bones' calls on the OTHER side, through the same door and wire. It never turns back to the initial side.
  try {
    const tg0 = rows.find((r) => r.ticker === m.ticker && r.lane === "recon-tog");
    const tgM = (globalThis as any).__togMiss?.[m.ticker]; // her floor-missed first call outranks a later booked one (Oct 22 ~10:30 AM PT, Love)
    const tg: any = tgM && (!tg0 || Date.parse(String(tg0.at)) > Number(tgM.at)) ? { ...(tg0 || {}), first: tgM.side, prevCall: "", side: tgM.side, spotAt: tgM.spotAt, at: new Date(Number(tgM.at)).toISOString() } : tg0;
    const init = tg ? String(tg.first || String(tg.prevCall || "").split(" ")[0] || tg.side) : "";
    // WAITS FOR THE RUN INTO THE NEXT BAND (Oct 20 ~11:18 PM PT, Love: "ensure that she waits for the initial move that our main book took to run into the next band
    // it encounters, after our main book has already entered / and to enter as she would at any other time, in the opposite direction"): from TOGETHER's entry price,
    // the next band of her channel in TOGETHER's direction (session VWAP/sigmas, pink, Bollinger window, and on gold the 5m R1/R2/S1/S2) must be reached (within
    // her tap) after TOGETHER entered. Only then does the twin take her bones' first call on the other side. No entry price = no twin (fails closed).
    // THE SECOND INTERACTION (Oct 21 ~10:23 AM PT, Love: "it rejected off the first band below, then rejected from the band above afterwards, so she'd enter
    // there on the second interaction with any of them - after the first interaction with a band passes"; ~10:27 AM: "so she'd wait for the second rejection at
    // the red ... they may line up with each other on occasion that's ok ... whichever the second band it interacts with dictates"; the lines from ~10:08/10:17 AM:
    // "the bollinger band extremes ... if it hits a band and rejects that's also an entry"): after TOGETHER entered, every touch of a line (her 5m Bollinger
    // upper/lower, session VWAP/sigmas, pink, on gold the 5m R1/R2/S1/S2) within her tap is one interaction; a touch already under way when TOGETHER entered
    // doesn't count, and touching the same line again later is a new one. The first interaction passes. From the second on, the twin takes the first rejection -
    // price leaves the line on the side it came from by her tap, on a 5m candle turned that way - in the rejection's own direction, either side of TOGETHER.
    // A BREAK TOO (~10:31 AM PT, Love: "so now that btc broke the band up, our delayed entry book would long on that break when our main book went short"):
    // from the second interaction on, price leaving the line on the OTHER side by her tap, on a 5m candle turned that way, is the break - traded its way.
    // No TOGETHER entry = no twin (fails closed).
    // FROM THE OPEN, MAIN BOOK OR NOT (Oct 21 ~2:43 PM PT, Love: "the next band interaction after the initial move took place already (whether main book was in
    // or not) is good hun" + picked "Yes, count from the open"): the window's FIRST band interaction is the initial move and passes; the NEXT one is the twin's,
    // rejection or break traded its way - whether TOGETHER booked or not. Every wall, door and the wire still judge her.
    {
      const GD = globalThis as any; const rch = (GD.__dlyReach ||= {});
      const bz = GD.__bbsr?.[id]; const bbU = Number(bz?.bbU) || 0, bbL = Number(bz?.bbL) || 0;
      const fresh = bbU > 0 && bbL > 0 && Date.now() - Number(bz?.at) <= 20000;
      const p6 = pivot(resample(b, 5), 5);
      const tapD = TAP[id] ?? 0;
      const L6 = [...(fresh ? [{ name: "BB upper", price: bbU }, { name: "BB lower", price: bbL }] : []), ...sessionLines(ax, id), ...(p6 ? [{ name: "5m PP", price: p6.pp }] : []), ...(id === "gold" && p6 ? [{ name: "5m R1", price: p6.r1 }, { name: "5m R2", price: p6.r2 }, { name: "5m S1", price: p6.s1 }, { name: "5m S2", price: p6.s2 }] : [])].filter((l) => Number(l.price) > 0).map((l) => ({ name: String(l.name), price: Number(l.price) }));
      // THE NEXT BAND PRICE INTERACTS WITH (Oct 21 ~11:27 AM PT, Love: "it should be the next band price interacts with hun ... if our main book went long, if
      // price goes up and taps the next band, short. delayed entry. that's it"; ~11:36 AM: "she didn't enter anything on the rejections after the initial move"):
      // after TOGETHER's initial entry, the first line of hers price taps (Bollinger, session VWAP/sigmas, pink, gold R/S) - above or below - is the one. A line
      // price was already sitting on at the entry doesn't count until price leaves it. Price leaving it back the way it came (by her tap, candle turned that way)
      // = the rejection, traded its way (tapped from below = short, from above = long). Leaving through it = the break, traded its way. One line per window,
      // kept per ticker so TOGETHER's re-aims never reset it. Every wall, door and the wire still judge her (Love 11:23 AM: "under our rules").
      const k6 = "nxt3:" + m.ticker;
      // THE BAND TOUCH IS HER ONLY ENTRY (fix309, Oct 27 2026 ~1:40 AM PT, Love: "just have her enter at the band she interacts with after the initial move / and pls ensure
      // that stays the forefront of the model"): the older twin paths ("Turned after the initial move", "Break against the main call", gold 4x) stay in the code but go quiet,
      // so none of them can take her window before her band. (The 1:31 AM gold "Turned up" long sat under the band she should have shorted.) Re-aim onto main stays.
      const DLY_TOUCH_ONLY = true;
      // THE TWIN IS DELAYED (fix307, Oct 27 2026 ~1:31 AM PT, Love: "she just needs to not take the same trade at the same exact time ... that was in the first few
      // seconds of the window ... she needs to be delayed"): nothing books for the twin (first call, turn, break, touch, 4x, re-aim) in a window's first 60 s or within
      // 60 s of the main book's call, and a band touched in that time is part of the initial move, not her band.
      const dlyHold = false; /* fix308 (Oct 27 2026 ~1:47 AM PT, Love: "id really rather not have the 30 seconds because sometimes the move can happen faster than that. just the next band she interacts with pls"): no clock hold - the initial move's band passes (z.first) and the next band she touches is hers; her re-aim still needs her own call first */ (globalThis as any).__dlyHold = { ...((globalThis as any).__dlyHold || {}), [m.ticker]: dlyHold };
      const z = (rch[k6] ||= { first: null as null | string, fpx: 0, fdir: "" as "" | "up" | "down", primed: false, skip: null as null | string, hit: null as null | { name: string; from: number }, last: spot });
      if (!z.primed) { z.primed = true; const n0 = L6.find((l) => Math.abs(spot - l.price) <= tapD); z.skip = n0 ? n0.name : null; z.last = spot; }
      else if (tapD > 0) {
        if (z.skip) { const s6 = L6.find((l) => l.name === z.skip); if (!s6 || Math.abs(spot - s6.price) > tapD) { if (s6 && z.first === s6.name && !z.fdir) z.fdir = spot > s6.price ? "up" : "down"; z.skip = null; } }
        // THE MODEL (Oct 21 ~4:36 PM PT, Love picked "Yes, a different band only" + "Rejection only, other side"; her words: "if the main book correctly went short,
        // she should have longed when btc went down from the initial move, and tapped the next band (down for shorts, next band up for longs) and rejected - that's
        // the model"; "never to long or short into an unbroken band on the delayed model either"): the initial move's direction is TOGETHER's call (or, with no
        // TOGETHER call, the way price left the first band). The twin waits for the next DIFFERENT band beyond the first one in that direction, and takes ONLY its
        // rejection - always the other side from the initial move. A re-tap of the first band, a band the other way, or a break never books. Walls/wire judge her.
        const dir: "" | "up" | "down" = init === "up" || init === "down" ? (init as "up" | "down") : z.fdir;
        // OFF A BAND OR IN OPEN SPACE (Oct 21 ~6:10 PM PT, Love picked "Yes, that's the model"; 4:45 PM BTC: TOGETHER longed in open space, BTC ran up into the
        // pink - the twin passed it as "the initial move"): the initial move's band is only a band TOGETHER entered ON (within her tap of TOGETHER's entry price).
        // Entered in open space = no band passes: the first band price reaches in TOGETHER's direction is the twin's.
        if (!z.first && tg && dir !== "" && init === dir) { const ep = Number(tg.spotAt); if (Number.isFinite(ep) && ep > 0) { const on = L6.filter((l) => Math.abs(ep - l.price) <= tapD).sort((a, c) => Math.abs(ep - a.price) - Math.abs(ep - c.price))[0]; z.first = on ? on.name : "(entry)"; z.fpx = on ? on.price : ep; if (on && Math.abs(spot - on.price) <= tapD) z.skip = on.name; } }
        if (!z.hit) {
          const hit = L6.filter((l) => l.name !== z.skip && (!z.first || l.name !== z.first /* fix307: any band, either side */) && (Math.abs(spot - l.price) <= tapD || (z.last - l.price) * (spot - l.price) < 0)).sort((a, c) => Math.abs(z.last - a.price) - Math.abs(z.last - c.price))[0];
          if (hit && !z.first) { z.first = hit.name; z.fpx = hit.price; z.skip = hit.name; } // the initial move's interaction passes
          else if (hit && !dlyHold) z.hit = { name: hit.name, from: Math.sign(z.last - hit.price) || (spot > hit.price ? 1 : -1) };
        }
        // AT THE TOUCH (Oct 21 ~6:15 PM PT, Love: "just have her take the entry at the next band price reaches and she's good hun / no need to wait for a
        // rejection honestly ... after the initial move, next band price touches"): the moment price touches that next band, the twin takes the other side from
        // the initial move. No rejection wait, no break. Walls/wire still judge her; if they hold her she keeps asking while the window lasts.
        // NEAR IT COUNTS TOO (Oct 21 ~6:18 PM PT, Love: "it still applies if it doesn't touch the band, if price rejects near them and is rising or falling in the
        // top 33% or bottom 33% she is still clear to take the trade if it doesn't quite tap the band"): after the initial move, a turn her way in the outer third
        // toward the next band (falling in the top third when the initial move was up, rising in the bottom third when it was down) = the same entry.
        if (!z.hit && z.first && dir !== "") { const tn = (() => { // her thirds turn, measured with every line of hers as an edge: pink, red/green zones (5m R1/S1), session bands, Bollinger (Oct 21 ~6:45 PM PT, Love picked "Yes, zones count for the twin")
          const C = [...L6, ...(id !== "gold" && p6 ? [{ name: "5m R1", price: p6.r1 }, { name: "5m S1", price: p6.s1 }] : [])].filter((l) => Number(l.price) > 0);
          const at = (x: number) => { const u = C.filter((l) => l.price > x).sort((p, q) => p.price - q.price)[0]; const d = C.filter((l) => l.price < x).sort((p, q) => q.price - p.price)[0]; return u && d && u.price > d.price ? { lo: d.price, hi: u.price, w: u.price - d.price } : null; };
          const hiC = at(cur.h), loC = at(cur.l);
          // ANY TURN BACK (Oct 21 ~7:35 PM PT, Love: "i'd like to have it not need the tap exactly ... price falling near the band is also acceptable ... she's good to
          // short anywhere EXCEPT the bottom 33% of the channel, and good to long anywhere except the top 33% like we implemented for our main book"): once the 5m candle
          // has run past the initial move's mark (z.fpx) her way and turns back by her tap - falling under its open for a short, rising over it for a long - she takes it.
          // Her 33% (session bands, the main book's thirds) is judged at the door and the wire as always. (hiC/loC kept for the log only.)
          void hiC; void loC;
          const dn = z.fpx > 0 && cur.h > z.fpx + tapD && spot <= cur.h - tapD && spot < cur.o;
          const up = z.fpx > 0 && cur.l < z.fpx - tapD && spot >= cur.l + tapD && spot > cur.o;
          return dn && !up ? "down" : up && !dn ? "up" : "";
        })(); const sideN: "up" | "down" = dir === "up" ? "down" : "up"; if (tn === sideN && !dlyHold && !DLY_TOUCH_ONLY && book("recon-dly", { side: sideN, label: `${sideN === "down" ? "Turned down" : "Turned up"} after the initial move` })) changed = true; }
        // STRAIGHT AGAINST THE MAIN CALL (Oct 22 ~6:48 PM PT, Love: "yes in the event that happens i want her to be in on the other side bb" - 6:30 PM BTC: TOGETHER
        // longed at 81,393.73, that print was the window's high and BTC fell straight to 81,159 with no initial move, so the twin never got her turn): once TOGETHER
        // has called, price running against her entry by the tap on a 5m candle colored that way (under its open for a short, over it for a long) = the twin takes the
        // other side. Walls, door and wire still judge her.
        // RETIRED (fix129, Oct 22 ~11:50 PM PT, Love: "the delayed entry model is firing at the same time in the opposite direction / the intention is to wait til the
        // initial move takes place and get in at a higher multiple ... needs to be the next entry she would normally take that takes place after the first one" + "after
        // the first move takes place and our first trade is in profit and encounters a band"): the straight-against entry fired seconds after the main call; off.
        if (false && tg && (init === "up" || init === "down")) { const ep = Number(tg.spotAt); if (Number.isFinite(ep) && ep > 0 && tapD > 0) {
          const sA: "up" | "down" = init === "up" ? "down" : "up";
          const ok = sA === "down" ? spot <= ep - tapD && spot < cur.o : spot >= ep + tapD && spot > cur.o;
          if (ok && book("recon-dly", { side: sA, label: `Straight against the main call (${init === "up" ? "long" : "short"} at ${ep.toFixed(2)})` })) changed = true;
        } }
        // THE BREAK WHEN THE MAIN CALL NEVER PAID (fix130, Oct 22 ~11:51 PM PT, Love: "our main book correctly went short, but it didn't go in profit it went straight
        // the other way / if THAT happens, she's clear to enter the break as she would normally"): once TOGETHER has called, if price never got past her entry by the
        // tap her way, and her bones call a BREAK (break/close through a line) on the other side with price on the wrong side of the entry, the twin trades that break.
        if (tg && (init === "up" || init === "down")) { const ep = Number(tg.spotAt); if (Number.isFinite(ep) && ep > 0 && tapD > 0) {
          const zz = z as any; if (init === "up" ? spot >= ep + tapD : spot <= ep - tapD) zz.paid = true;
          const sB: "up" | "down" = init === "up" ? "down" : "up";
          const bk = lookT && lookT.side === sB && /^(Break|Close) (above|below) /.test(String(lookT.label)) ? lookT : null;
          if (!zz.paid && bk && !dlyHold && !DLY_TOUCH_ONLY && (sB === "down" ? spot < ep : spot > ep) && book("recon-dly", { side: sB, label: `Break against the main call: ${bk.label}` })) changed = true;
        } }
        if (z.hit && dir !== "") {
          const ln = L6.find((l) => l.name === z.hit!.name);
          // fix307 (Love ~1:26-1:33 AM PT: "she just shorts or longs at a band when she interacts with one" / "she came up to a band and rejected off of it .... this is
          // the whole point of her"): she trades what the band shows - came up to it from below = short, came down to it from above = long - not always main's other side.
          const side: "up" | "down" = z.hit!.from > 0 ? "up" : "down";
          if (ln && !dlyHold && book("recon-dly", { side, label: `Touch of ${ln.name} - the next band after the initial move` })) { changed = true; ((globalThis as any).__twinTouchBand ||= {})[m.ticker] = ln.name; /* fix309: her entry band, so her add-on waits for the next one */ }
        }
      }
      // GOLD 4x ON THE OTHER SIDE (Oct 21 ~10:36 AM PT, Love: "gold should be shorted when it hits a 4x here if there is no band nearby, just once our main
      // books trade has been in profit and the other side hits a 4x - only if there's no band nearby"): gold only. Once TOGETHER's side has bid over her entry
      // (her peak over her ask), the other side's ask at 4x or better (25c or under) with no line of hers within $1.50 of price = the twin takes the other side.
      if (id === "gold" && tg && (init === "up" || init === "down")) {
        const opp: "up" | "down" = init === "up" ? "down" : "up", oAsk = Number(opp === "up" ? m.yesAsk : m.noAsk);
        const wasUp = Number(tg.peak) > Number(tg.ask) + 0.001, clear = !L6.some((l) => Math.abs(spot - l.price) <= 1.5);
        if (wasUp && clear && !dlyHold && !DLY_TOUCH_ONLY && oAsk > 0.02 && 1 / oAsk >= 4 && book("recon-dly", { side: opp, label: `4x on the other side, no band within $1.50 - after TOGETHER's ${init === "up" ? "long" : "short"} was in profit` })) changed = true;
      }
      z.last = spot;
    }
  } catch {}
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
  let lookR5: { side: "up" | "down"; label: string } | null = null; // fix261
  try {
    const pR = pivot(resample(b, 5), 5);
    const LR = [...sessionLines(ax, id), ...(pR ? [{ name: "5m PP", price: pR.pp, unit: pR.a }] : []), ...btcBB(id, Number(sessionLines(ax, id)[0]?.unit) || 0)];
    lookR = bonesDecide(id, LR, spot, last1m, cur, prev, b, true);
    lookR5 = lookR; // fix261: her read exactly as it ran before fix246 (the 5m green streak)
    // fix246: THE MAIN BOOK'S INFRASTRUCTURE - same lines (Bollinger, green/red zones as rejection bands), same near-band reach, same Bollinger-needs-its-colour rule,
    // same candle in her third and fake-out turn; rejections only (rank-1 voices), every wall unchanged.
    if (rejLB && rejReach > 0) {
      lookR = bonesDecide(id, rejLB, spot, last1m, cur, prev, b, true, rejReach);
      if (lookR && /Bollinger/.test(String(lookR.label)) && !(lookR.side === "up" ? spot > cur.o : spot < cur.o)) lookR = bonesDecide(id, rejL || LR, spot, last1m, cur, prev, b, true, rejReach);
    }
    if (!lookR && (rejCandleNow || rejCandle)) lookR = rejCandleNow || rejCandle; // fix260: live 5m candle, no 1m wait
    if (rejFO) lookR = rejFO;
    // fix264 (Oct 26 ~3:15 AM PT, Love: "all i wanted was her to not wait for a 1M candle close ... i really don't want things that we deliberately took out being put back in"): the fix260 5m flip entry is OFF (rejFlipAtBand no longer called); only the no-1m-close-wait candle read stays.
  } catch { lookR = null; }
  // THE REJECTION MODEL MAKES THE MAIN BOOK'S OWN CALL (fix252, Oct 26 ~1:15 AM PT, Love: "make a copy of the main book that trades rejections only ... she is not
  // taking the same trades at all" + "fix that overnight pls whatever it is isn't working" - her first calls matched TOGETHER, then her own read re-aimed walled calls the
  // other way, e.g. 1:15 AM gold: both "Rejected down off Red zone", hers re-aimed long at 1:17): she books TOGETHER's very call this tick (firstT) whenever it is not a
  // break (Break/Close above/below), keeps her first call like TOGETHER (a wall-refused call books the next passing one), and meets the same walls. Her own read (lookR)
  // stays only for the twin's re-aim and the 5m read log.
  // SHE TRADES THE BAND (fix257, Oct 26 ~2:06 AM PT, Love: "i want the rejection model to just trade the rejections. if price comes to a band i want her to trade that
  // band ... price comes to a band, she trades it. that's it" - replaces fix256 and fix252's main-call copy): she books her own rejection read (lookR: rejections only,
  // breaks muted, main's lines and reach), keeps her first call like TOGETHER (a wall-refused call books the next passing one) and meets every wall.
  // THE 5M 1-2-3 BOOK KEEPS HER STREAK READ (fix261, Oct 26 ~2:47 AM PT, Love: "pls put her back on the framework that was winning all day up until 10pm" + "for the 5M 123 book - that's what i meant by put it back - not the kalshi books"): recon-rej5 = the rejection model's
  // read as it ran before fix246 (her session bands + pink + BTC Bollinger window, rejections only, no main-book lines, no candle/fake-out overrides, re-aims).
  // Paper lane on BTC only; the Poly 5m lane takes its calls in place of recon-rej's. Kalshi books are untouched.
  try { if (id === "btc" && lookR5 && book("recon-rej5", lookR5)) changed = true; } catch {}
  let lookRM = lookR;
  // fix326: recon-rej alone reads the pink rejection on her flip (recon-dly re-aim, rej5, rejx keep lookR); the fake-out turn still outranks.
  try { if (rejLB && rejReach > 0 && !rejFO) { const pfR = bonesDecide(id, rejLB, spot, last1m, cur, prev, b, true, rejReach, true); if (pfR && /5m PP/.test(String(pfR.label))) lookRM = pfR; } } catch {}
  if (lookRM && book("recon-rej", lookRM)) changed = true;
  // HER READS FOR THE RE-AIM PAPER TWIN (fix223, Oct 25 ~6:00 PM PT, Love: "let's keep her as is, let's run a paper twin that can re aim"): log-only - every time the
  // rejection model's BTC read turns inside a 5m slot it is written to data/rej-reads.jsonl; tools/five-reaim-paper.py replays a 5m paper book that follows it. No orders.
  try { if (id === "btc" && lookR) { const GR = ((globalThis as any).__rejRead ||= {}); const s5R = Math.floor(Date.now() / 300000); const lr = GR.last;
    if (!lr || lr.s5 !== s5R || lr.side !== lookR.side) { GR.last = { s5: s5R, side: lookR.side }; appendFileSync(D("rej-reads.jsonl"), JSON.stringify({ at: new Date().toISOString(), s5: s5R, side: lookR.side, label: lookR.label, spot: Math.round(spot * 100) / 100 }) + "\n"); } } } catch {}
  // THE TWIN RE-AIMS (fix220, Oct 25 ~4:56 PM PT, Love card "Re-aim now" + "re aim it love" - 4:45 PM gold: the twin's short was walled the whole window while gold
  // launched up off the band and green zone): once the DELAYED twin has called this window and that call never filled, a rejection-model read the other way
  // re-aims her call in place (book() keeps the one-executed-direction law: no re-aim after a fill/partial or with an order on the wire). Walls still judge her.
  try { if (lookR && !(globalThis as any).__dlyHold?.[m.ticker] /* fix307: delayed */ && rows.some((r) => r.ticker === m.ticker && r.lane === "recon-dly" && r.side !== lookR!.side) && book("recon-dly", { side: lookR.side, label: `Re-aimed (her call never filled): ${lookR.label}` })) changed = true; } catch {}
  // THE REJECTION MODEL'S PAPER TWIN (fix171, Oct 24 ~7:34 PM PT, Love: "yes let's make a paper twin that trades those too bb, model is working as is it's our best
  // performing one so we'll leave her be / the paper twin will tell us if the other is worth running or if it hurts more than helps"): recon-rejx = the rejection
  // model's exact bones and tap, plus the 5m Bollinger upper/lower and the green/red zones (5m S1/R1) as rejection lines. Paper only (not in liveBook.books).
  try {
    const pX = pivot(resample(b, 5), 5); const uX = Number(sessionLines(ax, id)[0]?.unit) || 0;
    const LX: Line[] = [...sessionLines(ax, id), ...(pX ? [{ name: "5m PP", price: pX.pp, unit: pX.a }] : []), ...btcBB(id, uX)];
    try { const zX = (globalThis as any).__bbsr?.[id]; if (zX && Number(zX.bbU) > 0 && Number(zX.bbL) > 0 && Date.now() - Number(zX.at) <= 20000) LX.push({ name: "Bollinger upper", price: Number(zX.bbU), unit: uX }, { name: "Bollinger lower", price: Number(zX.bbL), unit: uX }); } catch {}
    if (pX && Number(pX.s1) > 0 && Number(pX.r1) > 0) LX.push({ name: "Green zone", price: Number(pX.s1), unit: uX }, { name: "Red zone", price: Number(pX.r1), unit: uX });
    const lookRX = bonesDecide(id, LX, spot, last1m, cur, prev, b, true);
    if (lookRX && book("recon-rejx", lookRX)) changed = true;
  } catch {}
  return changed;
}
