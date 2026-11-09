// fix835 1-2-3 · SEALED · PAPER - HER READ (the rejection model's streak read, recon-rej5) from PRE295 recon.ts. PAPER ONLY: no order path.
// Every block between "===== FROZEN" markers is copied byte for byte from data/vault-123-pre295 (PRE295-BUILD, the desk as it stood Oct 26 2026 ~9:30 PM PT) and checked by
// seal835() in onetwothree835.ts (vault sha256 + every block's text). Change a single byte inside a block and both 1-2-3 books stop and say why.
// Outside the markers is plumbing only: the imports below resolve to the sealed sandbox (onetwothree835-sandbox.ts), never to the live desk's modules or globals.
import { SANDBOX } from "./onetwothree835-sandbox";
const globalThis = SANDBOX; // her frozen code's globalThis is the sealed sandbox, not the live desk

// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 29-29 =====
const r2 = (n: number) => Math.round(n * 100) / 100;
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 33-34 =====
const BREAK: Record<string, number> = { btc: 6, gold: 0.33 };
const TAP: Record<string, number> = { btc: 3, gold: 0.3 };
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 42-46 =====
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Piv = { pp: number; r1: number; s1: number; r2: number; s2: number; a: number };
type Line = { name: string; price: number; unit: number; center?: boolean };
export const RECON_LANES = ["recon-ogp5", "recon-paper", "recon-tog", "recon-top", "recon-rej", "recon-dly", "recon-rejx", "recon-togr", "recon-rej5", "recon-togp"] as const; /* fix281 recon-togp */ /* fix261 recon-rej5 */ /* fix250 recon-togr */ /* fix171 recon-rejx */ // + MOST SUCCESSFUL 70%+ (Oct 19 ~9:02 PM PT, Love) + REJECTIONS ONLY twin (Oct 20 ~7:39 AM PT, Love)
export const RECON = new Set<string>(RECON_LANES);
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 48-58 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 60-70 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 78-80 =====
const PT_HOUR_R = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" });
function quietR(now = Date.now()): boolean { try { return Number(PT_HOUR_R.format(new Date(now))) === 15; } catch { return false; } }
const QUIET_R = /^5m (PP|R1|S1)$|^BB (upper|lower)$/;
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 88-99 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 104-109 =====
function btcBB(id: string, unit = 0): Line[] {
  if (!(id === "btc" || id === "gold") || Date.now() >= 1792538400000) return [];
  const z = (globalThis as any).__bbsr?.[id];
  if (!z || !(Number(z.bbU) > 0) || !(Number(z.bbL) > 0) || Date.now() - Number(z.at) > 20000) return [];
  return [{ name: "BB upper", price: Number(z.bbU), unit }, { name: "BB lower", price: Number(z.bbL), unit }];
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 134-341 =====
export function bonesDecide(asset: string, L: Line[], spot: number, last1m: Bar | undefined, cur: { o: number; h: number; l: number }, prev?: { h: number; l: number } | null, bars?: Bar[], rejOnly = false, reach = 0): { side: "up" | "down"; label: string } | null {
  const brk = BREAK[asset] ?? 0, tap = TAP[asset] ?? 0;
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
    if (cur.o > p && cur.l <= p + nr && cur.l > p - brk && spot >= cur.l + tap && spot > p && (l.name !== "5m PP" || spot >= cur.o + (asset === "btc" ? 10 : tap))) cands.push({ side: "up", label: `Rejected up off ${l.name}`, d, rank: 1 });
    if (cur.o < p && cur.h >= p - nr && cur.h < p + brk && spot <= cur.h - tap && spot < p && (l.name !== "5m PP" || spot <= cur.o - (asset === "btc" ? 10 : tap))) cands.push({ side: "down", label: `Rejected down off ${l.name}`, d, rank: 1 });
    // 1m CLOSE OFF A REJECTED BAND (Oct 21 ~12:06 PM PT, Love picked "Yes, 1m close off the band is enough"; "the 1m close off of a rejection is perfect"):
    // the latest finished 1m candle (or the one before) tapped the line within her tap and the latest closed back off it, price still on that side.
    { const lc = closed[closed.length - 1], two = closed.slice(-2);
      const f0 = Math.floor(nowS / 300) * 300, inC = (x: { t: number }) => x.t >= f0; // tap + close inside the running 5m candle, every line (pivots Oct 21 ~1:22 PM PT; all lines fix98 Oct 22 ~5:56 PM PT, Love "Yes, both guards" - the 5:30 PM gold main short read a 5:29 bounce off -2σ)
      if (lc && lc.t + 120 > nowS && inC(lc)) {
        if (lc.c > p && spot > p && two.some((x) => inC(x) && x.l <= p + nr) && !(l.name === "5m PP" && !(spot >= cur.o + (asset === "btc" ? 10 : tap))) /* and a pink long into a green candle (Love card "Both: red short, green long") */) cands.push({ side: "up", label: `1m rejection off ${l.name}`, d, rank: 1 });
        if (lc.c < p && spot < p && two.some((x) => inC(x) && x.h >= p - nr) && !(l.name === "5m PP" && !(spot <= cur.o - (asset === "btc" ? 10 : tap))) /* PINK SHORT INTO A RED CANDLE, both assets, every book (Oct 22 ~7:23 AM PT, Love: "only have her short off of a pink band into a red candle, never a green one") */) cands.push({ side: "down", label: `1m rejection off ${l.name}`, d, rank: 1 });
      } }
    // A FAILED BREAK IS A REJECTION (Oct 20 ~9:54 PM PT, Love: "if it breaks and comes back on the other side of the band, it's a rejection until price goes on the other side of the band in the direction it broke"):
    // the wick broke through by her break distance and price came back across - read as the rejection while price stays back on the open side.
    if (cur.o > p && cur.l <= p - brk && spot >= cur.l + tap && spot > p && (l.name !== "5m PP" || spot >= cur.o + (asset === "btc" ? 10 : tap))) cands.push({ side: "up", label: `Failed break below ${l.name} - rejected up`, d, rank: 1 });
    if (cur.o < p && cur.h >= p + brk && spot <= cur.h - tap && spot < p && (l.name !== "5m PP" || spot <= cur.o - (asset === "btc" ? 10 : tap))) cands.push({ side: "down", label: `Failed break above ${l.name} - rejected down`, d, rank: 1 });
    // A REJECTION SURVIVES THE CANDLE TURN (Oct 19 ~9:02 PM PT, Love: "btc rejected the band below her and she didn't enter" — the +1σ tap sat in the
    // 8:55 candle, the bounce ran into the 9:00 one; her Oct 18 law: "once a new candle starts, a rejection off the pink is a valid trade"): the tap may
    // sit in the PREVIOUS 5m candle, provided the line stayed unbroken in both candles and price is still moving away by the tap distance.
    if (prev) {
      if (prev.l <= p + nr && prev.l > p - brk && cur.l > p - brk && cur.l > prev.l - tap && spot >= prev.l + tap && spot > p && (l.name !== "5m PP" || spot >= cur.o + (asset === "btc" ? 10 : tap))) cands.push({ side: "up", label: `Rejected up off ${l.name}`, d, rank: 1 });
      if (prev.h >= p - nr && prev.h < p + brk && cur.h < p + brk && cur.h < prev.h + tap && spot <= prev.h - tap && spot < p && (l.name !== "5m PP" || spot <= cur.o - (asset === "btc" ? 10 : tap))) cands.push({ side: "down", label: `Rejected down off ${l.name}`, d, rank: 1 });
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
  cands2 = cands2.filter((c) => { const lb = String(c.label); if (!/(Green|Red) zone$/.test(lb)) return true; if (/^(Break|Close) /.test(lb)) return false; return /Green zone$/.test(lb) ? c.side === "up" && spot > cur.o : c.side === "down" && spot < cur.o; });
  let seenC = cands2;
  try { if (perspective) seenC = perspective(cands2); } catch {}
  const pool = rejOnly ? seenC.filter((c) => c.rank >= 1) : seenC;
  if (!pool.length) return null;
  pool.sort((a, b) => a.rank - b.rank || a.d - b.d);
  return { side: pool[0].side, label: pool[0].label };
}
// ===== END FROZEN =====
export { resample, pivot, sessionLines, btcBB }; // plumbing: names the 1-2-3 tick reads (not exported in the vault file)
