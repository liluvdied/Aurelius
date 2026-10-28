// BAND LOCK (Oct 16 ~1:05 PM PT, Love: "i need you to make sure this sticks and doesn't fire again backwards in an hour. or the
// next window... please make sure that it is a physical impossibility to ever occur again").
// The last gate before a twin order reaches Kalshi, separate from goldlaw.ts / pivotbooks.ts / engine.ts so a change in any of
// them can't open the hole again. Every book, every asset (was: law books only): the order must be on
// the side of the CLOSEST band price is on right now (over it = long, under it = short). If that can't be verified (no fresh
// price, no fresh band list) or the law fails its self-test, the order is refused. The inverse (ogp5-inv) is not covered:
// trading against the twin is its job.
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { quoteTick, feedHealth } from "./quotes";
import { RECON } from "./recon";

type Line = { name: string; price: number; unit?: number };
const LAW_BOOKS = /^ogp5-(fast|gw|boll|lock)$/;
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);

// Its own closest-band math (not imported), so a regression elsewhere can't fool it.
function nearSide(L: Line[], tick: number): { side: "up" | "down" | null; band: Line } | null {
  const ls = L.filter((l) => Number(l.price) > 0);
  if (!(tick > 0) || !ls.length) return null;
  let near = ls[0];
  for (const l of ls) if (Math.abs(tick - l.price) < Math.abs(tick - near.price)) near = l;
  return { side: tick < near.price ? "down" : tick > near.price ? "up" : null, band: near };
}
// BLOCK RANGE (Oct 18 ~1:00 PM PT, Love: "a band $86 away is not a reason to stop a long" / "the pink band was wayyyyyy too far away for her to
// BLOCK that. it was not an obstacle" - her picks: "Within $25 (BTC)", gold "Within $2.22", longs and shorts mirrored, every live book). An unbroken
// band only blocks a trade INTO it (closest-band rule, rejection memory) while price is within this range of it; further away it is not an obstacle.
// live-switch bandReach { btc, gold } overrides. 12:47 PM BTC: long off the tap below, pink $87 overhead -> both checks held her until 1.32x.
export function bandReach(asset: string): number {
  const def: Record<string, number> = { btc: 25, gold: 2.22 };
  if (!G.__stDefaultReach) { try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.bandReach?.[asset]); if (v > 0) return v; } catch {} }
  return def[asset] ?? Infinity;
}
const inReach = (asset: string, price: number, tick: number) => Math.abs(tick - Number(price)) <= bandReach(asset);
// RED / GREEN PIVOTS OWN RANGE (Oct 18 ~8:58 PM PT, Love: "make the red/green pivots $1.11 pls" - 8:54 PM gold: a break-up long was stopped by the 5m R1
// $1.46 above inside the $1.50 range): live-switch zoneReach[asset] is the range for the red/green pivot lines (R1/R2/S1/S2 on any timeframe) as walls in
// front; the pink and everything else keep bandReach. Unset = same as bandReach. The self-test always runs on the defaults.
export function zoneReach(asset: string): number {
  if (!G.__stDefaultReach) { try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.zoneReach?.[asset]); if (v > 0) return v; } catch {} }
  return bandReach(asset);
}
const isZoneLine = (l: Line) => /(^|\s)(R|S)\d$/.test(String(l.name));
const inReachL = (asset: string, l: Line, tick: number) => Math.abs(tick - Number(l.price)) <= (isZoneLine(l) ? zoneReach(asset) : bandReach(asset));
// NO REJECTION HOLD FOR TOGETHER (Oct 18 ~1:38 PM PT, Love: "yesss please, we can drop it for live orders / pls keep a twin that keeps it so we can
// compare the results"): both halves of TOGETHER (5M pivot = ogp5, PAPER 24/7 = pap247 / paper-247) skip "rejected off X and hasn't come back to it",
// like the session + pink book. Their paper twins ogp5-hold / paper-247-hold keep it (paper only).
export const NO_REJ_HOLD = new Set<string>(["ogp5", "pap247", "paper-247", "ogp5-pk2", "ogp5-pk3", "paper-247-pk2", "paper-247-pk3"]);
// HER RULE (Oct 18 ~1:46 PM PT, Love, in her words: "TRADE AWAY FROM THE CLOSEST BAND. NOT INTO IT. BAND BREAKS = TRADE THE DIRECTION OF THE BREAK.
// THAT IS IT." / "IF THERE IS A SESSION BAND ABOVE HER, TRADE AWAY FROM THEM"). 1:33 PM BTC: she longed with -1σ $135 above and -2σ $250 below
// because the old check counted the pink $30 below - a pink that had already BROKEN up - as "the closest band".
//  1) a break in THIS 5m candle in the trade's direction = the trade (break = trade the direction of the break);
//  2) otherwise the closest SESSION band decides (see awayVerdict) - trade AWAY from it: closest above = short only, closest below = long only.
//     A band price broke through still counts as a band behind her (trading away from it = the break's direction); a broken band never blocks
//     the break's direction (wallFor). Session bands count at any distance; the pink and
//     the other pivot lines count only within her block range ($25 BTC / $2.22 gold - "a band $86 away is not a reason to stop a long").
// BTC BOLLINGER WINDOW (Oct 20 ~2:08 PM PT, Love: "while bands are this scrunched together after 2pm, have her use the bollinger bands for btc until
// they widen back out in an hour or so. we also have session carry bands that we use ... and the pink band as usual"): "BB upper"/"BB lower" (her 5m
// BBSR Bollinger) ride on BTC's band list until 3:15 PM PT today (pivotbooks lawBands + recon bones) and count as session bands in every rule here.
// HER CHANNEL, ONE DEFINITION (Oct 20 ~4:48 PM PT, Love, Oct 20 ~4:48 PM PT: "please change a candle rising in the bottom 33% of the channel to a long / candle falling in the top 33% a short / no shorts in
// the bottom 33% of the channel / no longs in the top 33% of the channel / please reinforce it it didn't work"): 4:45 PM gold rose off the green 5m S1 (4114.06) toward the pink, but every rule measured the channel
// from -2σ (4112.02) and called it the top. Her chart draws the red/green zone lines on gold as bands, so on GOLD the channel's edges are: session VWAP,
// the sigma bands, Bollinger (in its window), the pink 5m PP AND the 5m R1/R2/S1/S2. BTC keeps its walls (session + pink + Bollinger), Oct 17.
// GOLD'S THIRDS LIKE BTC'S (Oct 21 ~11:12 AM PT, Love picked "Session bands + pink only" - 11:00 AM gold's long was refused at 68% of a $2.35 pink->R1 sliver
// in an uptrend): the channel edges are session VWAP, the sigmas, Bollinger and the pink for both assets. Gold's R1/R2/S1/S2 stay bands for her breaks and rejections.
// SESSION BANDS ONLY (Oct 21 ~11:15 AM PT, Love: "the distance of 33% from the top or bottom of the channel was only ever supposed to apply to the session bands"):
// her channel edges for the thirds are session VWAP and the sigma bands. The pink, Bollinger and gold's pivots stay bands for her breaks and rejections.
// THE 3 PM CHANNEL (Oct 21 ~3:21 PM PT, Love: "for 3-4 pm like we discussed yesterday she can use the pink band and the red /green zones and the bollingers
// until the session bands open up a bit more" + picked "Yes, exactly that"): every day from 3:00 to 3:59 PM PT the channel's edges are the pink (5m PP), the
// red/green zones (5m R1 / S1) and the 5m Bollinger upper/lower, BTC and gold; the session bands step aside for that hour. Thirds, top/bottom line, candle -
// all unchanged, at the wire, the door and paper alike.
const PT_HOUR_Q = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" });
export function quietHour(now = Date.now()): boolean { try { return Number(PT_HOUR_Q.format(new Date(now))) === 15; } catch { return false; } }
const QUIET_EDGE = /^5m (PP|R1|S1)$|^5m BBSR (upper|lower)$|^BB (upper|lower)$/;
// ONE CHANNEL AT 3 PM TOO (fix153, Oct 23 ~3:21 PM PT, Love picked "Session bands only for thirds" - the 3:16 PM BTC long at 81,276 passed at 10% of a pink -> -1σ
// 3 PM channel while it sat at 77% of -2σ -> -1σ): her thirds measure session bands only in every hour; the 3 PM channel (fix24: pink, R1/S1, Bollinger as edges) is retired.
export const isChanBand = (asset: string, l: Line) => (false && quietHour() ? QUIET_EDGE.test(String(l.name)) : /σ$|^session VWAP$|^fresh VWAP$/.test(String(l.name))); // fix219 fresh VWAP joins her channel (fresh ±σ already end in σ)
/** Her channel's lines: in the 3 PM hour the Bollinger joins the list (it isn't in the law bands otherwise). */
export function chanL(asset: string, L: Line[]): Line[] {
  if (!quietHour()) return L || [];
  const have = new Set((L || []).map((l) => String(l.name)));
  return [...(L || []), ...bbLines(asset).filter((l) => !have.has(String(l.name)))];
}
const isSessBand = (l: Line) => /σ$|^session VWAP$|^fresh VWAP$|^BB (upper|lower)$/.test(String(l.name));
export function freshBreakWith(asset: string, side: string, Bk: Map<string, "up" | "down">, nowS = Date.now() / 1000, st?: Record<string, { side: string; at: number }>): string {
  const S = st ?? (((G.__brokenWalls ||= {})[asset]) || {});
  const f0 = Math.floor(nowS / 300) * 300;
  for (const [nm, d] of Bk) { const b = S[nm]; if (d === side && b && b.side === side && Number(b.at) >= f0) return nm; }
  return "";
}
// BOLLINGER BOOK'S OWN BANDS (Oct 18 ~2:10 PM PT, Love: "price rejected off of the top bollinger band. it is a short. not a long. price rejects off
// lower bollinger = LONG."): for the Bollinger book its 5m BBSR upper/lower are bands in her rule like the session bands. 2:01:43 PM: it longed $31
// under its top Bollinger ($81,026) - the gate never saw those bands.
export const BB_BOOKS = new Set<string>(["ogp5-bbsr", "ogp5-dly"]); // + DELAYED (Love, Oct 18 ~6:05 PM PT: "you can have her use the bollinger bands too for the delayed entry book" + "Both")
// DELAYED NEEDS NO TAP (Oct 18 ~4:13 PM PT, Love: "for delayed entry, she doesn't need to wait for a tap"): the "at the band / at the pink - waiting for a
// break or a rejection" holds don't apply to the delayed book's fade at the next band. Every other check does.
export const NO_AT_WAIT = new Set<string>(["ogp5-dly"]);
// PINK THEORY (PAPER ONLY, Oct 18 ~3:53 PM PT, Love: "at the tap and rejection of the session band, she is clear to long. since price just broke the pink
// band, it is essentially already broken... provided it is within 2 candles (able to enter on the 2nd candle)" -> "test that on paper first... a 2 candle
// and 3 candle test"): on these paper twins of TOGETHER, a pink that broke within the last K five-minute candles is not a wall (no pink wall / pink wait /
// at-the-pink wait / pink in the road to the target) for a trade off the session band behind her. The candle that broke it still never trades against
// the break (candleBreakAgainst stays). Live books never use this.
export const PINK_RECENT: Record<string, number> = { "ogp5-pk2": 2, "paper-247-pk2": 2, "ogp5-pk3": 3, "paper-247-pk3": 3 };
export function pinkRecentFree(asset: string, L: Line[], tick: number, side: string, Bk: Map<string, "up" | "down">, K: number, o: { nowS?: number; st?: Record<string, { side: string; at: number }> } = {}): boolean {
  if (!(K > 0) || !(tick > 0) || !Bk.has("5m PP")) return false;
  const S = o.st ?? (((G.__brokenWalls ||= {})[asset]) || {});
  const b = S["5m PP"]; if (!b || !(Number(b.at) > 0)) return false;
  const f0 = Math.floor((o.nowS ?? Date.now() / 1000) / 300) * 300;
  if (Number(b.at) < f0 - (K - 1) * 300) return false; // broke within the last K 5m candles (this one counts as 1)
  const sess = L.filter((l) => isSessBand(l) && Number(l.price) > 0);
  const behind = side === "up" ? sess.filter((l) => l.price < tick).sort((a, c) => c.price - a.price)[0] : sess.filter((l) => l.price > tick).sort((a, c) => a.price - c.price)[0];
  return !!behind && inReach(asset, behind.price, tick); // she is trading off the session band right behind her
}
const noPink = (L: Line[]) => L.filter((l) => l.name !== "5m PP");
export function bbLines(asset: string): Line[] {
  const b = G.__bbsr?.[asset];
  if (!b || !(Number(b.bbU) > 0) || !(Number(b.bbL) > 0) || Date.now() - Number(b.at) > 20000) return [];
  return [{ name: "5m BBSR upper", price: Number(b.bbU) }, { name: "5m BBSR lower", price: Number(b.bbL) }];
}
// SESSION-BAND REJECTION (Oct 18 ~5:48 PM PT, Love: "yes bb" to: a pivot line price already broke through doesn't block a session-band
// rejection, gold and BTC - 5:01 PM gold: rejected down off +2σ, refused for "short INTO 5m R1 ($0.22 below)" that price had just climbed through).
export function isSessRej(x: any): boolean {
  if (!x) return false;
  const bn = String(typeof x.band === "string" ? x.band : x.band?.name ?? "");
  if (!/σ$|^session VWAP$|^BB (upper|lower)$/.test(bn)) return false;
  return x.from === "rejection" || /reject|bounce|tap/i.test(`${x.kind ?? ""} ${x.label ?? ""}`);
}
// A REAL REJECTION OUTRANKS THE 33% WALL (Oct 19 ~9:00 PM PT, Love picked "Rejection overrides the 33% wall" - the 8:46:04 PM gold pink-rejection long
// was called on time and her top-33% rule held the door 69 s under the unbroken +2σ): for the RECONSTRUCTED books, a qualified rejection in this 5m
// candle (tapped a line within $3 / 30c, never broke it ($6 / 33c), price moving away by the tap distance on the trade's side) waives channelOnly,
// the same way rejections already override the break direction. Wick read = 1m high/low + her live tick trail.
export function reconRejectNow(asset: string, L: Line[], tick: number, side: string): boolean {
  const tap = PINK_TAP[asset] ?? 0, brk = BREAK_DIST[asset] ?? 0;
  const o = fiveOpenNow(asset);
  const hl = fiveHLNow(asset);
  if (!(o > 0) || !(tick > 0) || !(tap > 0) || !(brk > 0)) return false;
  let h = hl ? hl.h : tick, l = hl ? hl.l : tick;
  try {
    const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
    const f0 = Math.floor(Date.now() / 300000) * 300000;
    for (const x of ((tk && G[tk]?.[asset]) || []) as any[]) { if (x && x.c > 0 && x.t >= f0) { if (x.c > h) h = x.c; if (x.c < l) l = x.c; } }
  } catch {}
  h = Math.max(h, tick); l = Math.min(l, tick);
  // + THE PREVIOUS CANDLE'S TAP (Oct 19 ~9:15 PM PT: v4 let the books call rejections whose tap sat in the previous 5m candle, but this override only
  // knew the current one, so the 33% wall re-blocked exactly those - 369 refusals on the 9:06 PM BTC long. Same lookback as recon.ts bonesDecide.)
  let ph = 0, pl = 0;
  try {
    const bars = ((G.__pivBars?.[asset]?.bars ?? []) as any[]);
    const f0s = Math.floor(Date.now() / 1000 / 300) * 300;
    const inP = bars.filter((x) => x.t >= f0s - 300 && x.t < f0s);
    if (inP.length) { ph = Math.max(...inP.map((x) => x.h)); pl = Math.min(...inP.map((x) => x.l)); }
  } catch { ph = 0; pl = 0; }
  for (const ln of L) {
    const p = Number(ln.price); if (!(p > 0)) continue;
    if (side === "up" && o > p && l <= p + tap && l > p - brk && tick >= l + tap && tick > p) return true;
    if (side === "down" && o < p && h >= p - tap && h < p + brk && tick <= h - tap && tick < p) return true;
    if (pl > 0 && side === "up" && pl <= p + tap && pl > p - brk && l > p - brk && l > pl - tap && tick >= pl + tap && tick > p) return true;
    if (ph > 0 && side === "down" && ph >= p - tap && ph < p + brk && h < p + brk && h < ph + tap && tick <= ph - tap && tick < p) return true;
  }
  return false;
}
// THE 33% CHANNEL RULE, ALONE (Oct 19 ~6:33 PM PT, Love, after RECON TOGETHER's 6:30 PM BTC short "On 5m PP": "she shorted into a band directly in front of
// her on btc again... no shorts into an unbroken band in the lower 33% of the channel. longs only. no longs into an unbroken band in the top 33% of the
// channel. shorts only"): the channel part of awayVerdict (same code, same channelPct, same broken-band memory) with nothing else attached, for the
// RECONSTRUCTED books - her one addition to the Oct 12 model. Channel = nearest unbroken session band below to nearest unbroken session band above.
// SLIDING CHANNEL LOCK (Oct 20 ~1:27 PM PT, Love: "bands under $300 wide on btc, the standard 33% - top and bottom. when bands exceed $300 apart,
// 20% - top and bottom ... for gold, bands under $7.50 remain the 33%, at bands $10 apart it becomes 20%"): the forbidden top/bottom share of a
// channel by its width. Gold between $7.50 and $10 slides evenly from 33% to 20%. Every channel wall and the wire's impossibility read this.
export function lockPctFor(asset: string, width: number): number {
  if (!(width > 0)) return 0.33;
  // FRESH BANDS ARE WALLS (fix219, Oct 25 ~3:51 PM PT, Love card "All fresh bands are walls" + "we can make it the top/bottom 20% for bands this small bb"):
  // while the carried bands run the channel, the new session's VWAP and ±σ are lines too; a channel no wider than one fresh sigma locks only its top/bottom 20%.
  { const fz = Number(G.__freshSd?.[asset]) || 0; if (!G.__stDefaultReach && fz > 0 && width <= fz * 1.05) return 0.2; }
  if (asset === "btc") return width > 500 ? 0.2 : 0.33; // fix160 (Oct 23 ~9:19 PM PT, Love: "we can have it shift back to the 33% when the bands are smaller than $500"): 33% under $500, 20% over | fix159 (Oct 23 ~8:38 PM PT, Love: "we can have it at the 20% setting right now hun, bands over $500 apart are good to be set for 20% going forward"): 20% under $500 too for now (was 0.4) | Oct 22 ~3:20 AM PT, Love: "20% after bands exceed $500 apart / 33% under that"; fix97 (Oct 22 ~5:50 PM PT, Love: "let's make it the 40%, not $50 it will block almost everything right now"): top/bottom 40% under $500 (was 33%), replaces fix96's $50 room
  if (asset === "gold" && width >= 10) return width > 25 ? 0.15 : 0.2; /* fix111 (Oct 22 ~8:06 PM PT, Love: "keep it at $2 til they widen out to $10 and then we still keep the same values we had"): her 20%/15% once the channel is $10+ */
  if (asset === "gold") return 0.33; /* fix237 (Oct 25 ~9:18 PM PT, Love: "fml 33% is good bb"): gold channels under $10 lock their top/bottom 33% */ /* fix235 (Oct 25 ~8:48 PM PT, Love: "ehh let's make that top 40 and bottom 40 bb / that's better"): gold channels under $10 lock their top/bottom 40% (the $2 always sits inside 40% once the channel is $5+) */ /* fix234 (Oct 25 ~8:46 PM PT, Love: "let's make it 33% under $10 or $2 , whichever comes first" - the 8:30 PM gold short sat at 31% but $2.11 off +2σ): under $10 the zone is the bottom/top 33% OR $2 from the band, whichever reaches further ($2 still capped at 40%) */ /* fix108 (Oct 22 ~7:40 PM PT, Love: "just a temporary $2 band tolerance on gold pls" + card): flat $2 from the band (capped at 40% of a tiny channel); was: */ if (asset === "gold") return width > 25 ? 0.15 : 0.2; /* fix95 (Oct 22 ~5:24 PM PT, Love: "let's lower it to 20% setting for the time being for gold hun my rules will block every trade atm"): 20% under $10 too (was 33%) */ /* fix90 (Oct 22 ~1:48 PM PT, Love card "Yes, 15% over $25": 15% when session bands exceed $25 apart) */ // Oct 22 ~6:10 AM PT, Love: "top 20% and bottom 20% when bands exceed $10 apart" (was a 33%->20% slide from $7.50)
  return 0.33;
}
export function channelOnly(asset: string, L: Line[], tick: number, side: string, Bk: Map<string, "up" | "down">): string {
  if (!(tick > 0) || !(side === "up" || side === "down")) return "";
  let brokeNow = new Set<string>();
  try {
    const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
    const f0 = Math.floor(Date.now() / 300000) * 300000;
    const trB = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0);
    const opB = fiveOpenNow(asset);
    const dB = BREAK_DIST[asset] ?? 0;
    if (opB > 0 && dB > 0 && trB.length) {
      for (const b of L.filter((l) => isSessBand(l) && Number(l.price) > 0)) {
        const st0: string | null = opB > b.price ? "above" : opB < b.price ? "below" : null;
        for (const x of [...trB, { t: Number.MAX_SAFE_INTEGER, c: tick }]) {
          if (side === "up" && st0 === "below" && x.c >= b.price + dB) { brokeNow.add(b.name); break; }
          if (side === "down" && st0 === "above" && x.c <= b.price - dB) { brokeNow.add(b.name); break; }
        }
      }
    }
  } catch { brokeNow = new Set(); }
  const S = wallFor(wallLines(asset, chanL(asset, L)).filter((l) => Number(l.price) > 0 && isChanBand(asset, l) && !brokeNow.has(l.name)), Bk, tick, side); // her one channel (Oct 20 ~4:48 PM PT)
  // PRESSED PAST AN UNBROKEN BAND IS STILL AT THE BAND (Oct 19 ~11:08 PM PT, Love: "she shorted gold on the lower 33% of the
  // channel while it was rejecting off of a band, she fired properly on btc and longed - can you look into it?"): 11:00:04 PM, gold
  // 4119.24 with -2σ at 4119.47 - a 23c poke under the band is NOT a break (her 33c law), but it slid the channel math down to
  // -3σ..-2σ and called the very bottom of her channel "the top". While this 5m candle opened on the far side and price sits
  // within break distance past an unbroken band, that band is still her floor (or ceiling) - only trades AWAY from it may fire.
  try {
    const dPk = BREAK_DIST[asset] ?? 0;
    const oPk = fiveOpenNow(asset);
    // NO POKE VETO ON HER LAUNCH (Oct 20 ~7:50 PM PT, Love): a green candle in the bottom third is only a long - 7:45:12 PM gold was refused at 17% of
    // PP -> VWAP as "a poke over the PP, shorts only here". When the candle's launch reads this side, the poke rule stands down.
    let lnPk: "up" | "down" | "" = "";
    try { lnPk = launchSide(asset, L, tick, oPk, fiveHLNow(asset)); } catch { lnPk = ""; }
    // THE SQUEEZED PINK (Oct 20 ~9:49 PM PT, Love: "if that happens id like her to wait for her to break thru the pink band, once the pink band breaks shes clear
    // to enter" + 9:45 PM BTC: TOGETHER read a $2 poke over a pink sitting $20 under -1sigma as "bottom third, green - a long" while the band above was rejecting
    // her): a pink within a quarter of a sigma of a session band is squeezed - a poke past it is never a break, launch or not, until it clears her break distance.
    const sdPk = (() => { const vw = L.find((l) => String(l.name) === "session VWAP"), u1 = L.find((l) => String(l.name) === "+1σ"); return vw && u1 ? Math.abs(Number(u1.price) - Number(vw.price)) : 0; })();
    const sqz = (b: Line) => String(b.name) === "5m PP" && sdPk > 0 && L.some((l) => isSessBand(l) && Math.abs(Number(l.price) - Number(b.price)) < 0.25 * sdPk);
    if (dPk > 0 && oPk > 0) {
      if (side === "down") {
        const pr = S.filter((l) => l.price > tick && l.price - tick < dPk && oPk > l.price && Bk.get(l.name) !== "down").sort((a, b) => b.price - a.price)[0];
        if (pr && (lnPk !== side || sqz(pr))) return `would short pressed $${(pr.price - tick).toFixed(2)} under unbroken ${pr.name} (${pr.price.toFixed(2)}) - a poke short of her break distance is not a break, that band is still her floor - longs only here`;
      }
      if (side === "up") {
        const pr = S.filter((l) => l.price < tick && tick - l.price < dPk && oPk < l.price && Bk.get(l.name) !== "up").sort((a, b) => a.price - b.price)[0];
        if (pr && (lnPk !== side || sqz(pr))) return `would long pressed $${(tick - pr.price).toFixed(2)} over unbroken ${pr.name} (${pr.price.toFixed(2)}) - a poke short of her break distance is not a break, that band is still her ceiling - shorts only here`;
      }
    }
  } catch {}
  // CHANNEL EDGES ARE UNBROKEN ONLY (Oct 20 ~8:02 AM PT, Love): a standing-broken band is not a barrier and not a channel edge -
  // the 8:00:51 AM gold short read 37% against a BROKEN +2sigma top where her chart read 20% against the true unbroken edges.
  const chU = S; // BAND TO BAND (Oct 20 ~8:20 AM PT, Love): the channel is the gap between the adjacent bands exactly as drawn
  const up = chU.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0], dn = chU.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0];
  if (!up || !dn) return "";
  const frac = (tick - dn.price) / (up.price - dn.price);
  const cp = lockPctFor(asset, up.price - dn.price); // sliding by width (Oct 20 ~1:27 PM PT, Love)
  if (side === "up" && frac >= 1 - cp) return `price is in the top ${Math.round(cp * 100)}% of her channel (${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - no long INTO ${up.name} ($${(up.price - tick).toFixed(2)} above, unbroken) - shorts only here`;
  if (side === "down" && frac <= cp) return `price is in the bottom ${Math.round(cp * 100)}% of her channel (${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - no short INTO ${dn.name} ($${(tick - dn.price).toFixed(2)} below, unbroken) - longs only here`;
  return "";
}
// BAND BREAKS UP = TRADE UP, DOWN = TRADE DOWN (Oct 19 ~6:34 PM PT, Love, after RECON's 6:30:24 PM gold short "On -1.5σ" while gold broke a band up: "if a band
// breaks up, = trade up / band breaks down, = trade down"): this 5m candle's last band break sets the only side that may trade - her candleBreaks rule, direction
// only (no waiting when the candle hasn't broken anything - the Oct 12 entries stay instant). For the RECONSTRUCTED books.

// ZONE FLIP (Oct 20 ~2:32 AM PT, Love): the red/green zone rejection with a MUST-FLIP candle, as a direction - the recovery for an
// entry missed on her 1.38x floor or blocked under a zone. Same geometry as the bones signal in recon.ts.
export function zoneFlipNow(asset: string, L: Line[], tick: number, o: number, hl: { h: number; l: number } | null): "up" | "down" | null {
  const tapZ = PINK_TAP[asset] ?? 0, brkZ = BREAK_DIST[asset] ?? 0;
  if (!(o > 0) || !(tick > 0) || !hl || !(tapZ > 0) || !(brkZ > 0)) return null;
  const pZ = (n: string) => { const l0 = L.find((x) => String(x.name) === n); const p0 = Number(l0?.price); return p0 > 0 ? p0 : 0; };
  const r1 = pZ("5m R1"), r2 = pZ("5m R2"), s1 = pZ("5m S1"), s2 = pZ("5m S2");
  if (r1 > 0 && o < r1 && hl.h >= r1 - tapZ && hl.h < (r2 > 0 ? r2 : r1) + brkZ && tick < o && tick <= hl.h - tapZ) return "down";
  if (s1 > 0 && o > s1 && hl.l <= s1 + tapZ && hl.l > (s2 > 0 ? s2 : s1) - brkZ && tick > o && tick >= hl.l + tapZ) return "up";
  return null;
}

// BTC: A 1m CLOSE BACK OVER THE BAND CLEARS THE BREAK - LAST WINS (Oct 20 ~1:05 PM PT, Love: "yes exactly, last wins ... make a break on btc
// constitute as a bit more than btc just broke down on the session band. if a 1m candle closes above the session band after the rejection, shes
// clear to long. inverse applies for shorts"): inside this 5m candle, price reached or pierced a session band, a FINISHED 1m candle at or after
// that touch closed back over it (under it for shorts), and price is still on that side now - the rejection is the latest thing, so it wins over
// the earlier break. BTC only. The wire's 33% impossibility still stands over it.
function oneMinCloseClears(asset: string, L: Line[], tick: number, side: string): boolean {
  if (asset !== "btc" || !(tick > 0)) return false;
  const f0 = Math.floor(Date.now() / 300000) * 300, nowS = Date.now() / 1000;
  const done = ((G.__pivBars?.[asset]?.bars ?? []) as any[]).map((x) => ({ t: Number(x.t), h: Number(x.h), l: Number(x.l), c: Number(x.c) }))
    .filter((x) => x.t >= f0 && x.t + 60 <= nowS && x.c > 0).sort((a, b) => a.t - b.t);
  if (!done.length) return false;
  for (const b of L.filter((l) => isSessBand(l) && Number(l.price) > 0)) {
    const bp = Number(b.price);
    if (side === "up" && tick > bp) {
      const i = done.findIndex((x) => x.l <= bp);
      if (i >= 0 && done.slice(i).some((x) => x.c > bp)) return true;
    }
    if (side === "down" && tick < bp) {
      const i = done.findIndex((x) => x.h >= bp);
      if (i >= 0 && done.slice(i).some((x) => x.c < bp)) return true;
    }
  }
  return false;
}
// 1m CLOSE OFF A REJECTED BAND (Oct 21 ~12:06 PM PT, Love picked "Yes, 1m close off the band is enough" after "hun it just needs to be a 1m close off of
// a rejected band"; 12:07 PM: "the 1m close off of a rejection is perfect"): the latest finished 1m candle (or the one before it) tapped a line of hers within
// her tap, the latest one closed back off it on the side it came from, and price is still on that side - the rejection trades even while the 5m candle is
// the other colour. Her thirds and the top/bottom lines still stand over it. Returns the line's name, or "".
export function oneMinReject(asset: string, L: Line[], tick: number, side: string): string {
  const tp = PINK_TAP[asset] ?? 0, nowS = Date.now() / 1000;
  if (!(tick > 0) || !(tp > 0)) return "";
  const done = ((G.__pivBars?.[asset]?.bars ?? []) as any[]).map((x) => ({ t: Number(x.t), h: Number(x.h), l: Number(x.l), c: Number(x.c) }))
    .filter((x) => x.t + 60 <= nowS && x.t + 180 > nowS && x.c > 0).sort((p, q) => p.t - q.t);
  if (!done.length) return "";
  const last = done[done.length - 1], two = done.slice(-2);
  if (!(last.t + 120 > nowS)) return "";
  for (const l of L) {
    const bp = Number(l.price);
    if (!(bp > 0)) continue;
    // A 5m PIVOT LINE IS ONLY REJECTED INSIDE ITS OWN CANDLE (Oct 21 ~1:22 PM PT - the 1:00:05 PM BTC short read a 12:59 tap of a PP that only appeared
    // at 1:00): for the 5m PP/R/S lines the tap and the close must both sit in the current 5m candle, after the line exists.
    // EVERY LINE, THIS CANDLE ONLY (Oct 22 ~5:20 PM PT, Love: "why did she long btc it was a red candle falling from the top of the channel" - the 5:14 1m bounce off
    // -3σ waived HER CANDLE at 5:15:33 while the new 5m candle was red and falling back to it): session bands, Bollinger and zones now also need the tap and
    // the close inside the running 5m candle.
    const f0 = Math.floor(nowS / 300) * 300, inC = (x: { t: number }) => x.t >= f0;
    if (!inC(last)) continue;
    if (side === "up" && last.c > bp && tick > bp && two.some((x) => inC(x) && x.l <= bp + tp)) return String(l.name);
    if (side === "down" && last.c < bp && tick < bp && two.some((x) => inC(x) && x.h >= bp - tp)) return String(l.name);
  }
  return "";
}
export function candleDirOnly(asset: string, L: Line[], tick: number, side: string): string {
  try { if (oneMinReject(asset, L, tick, side)) return ""; } catch {} // 1m close off a rejected band trades (Oct 21 ~12:06 PM PT, Love)
  const o = fiveOpenNow(asset);
  if (!(o > 0) || !(tick > 0)) return "";
  // SCENARIO* (Oct 19 ~7:10 PM PT, Love: "if the band is broken UP from below, taps the pink band, and then rejects - ... she can short then - provided
  // the candle that broke the band is still connected to the other side of the band, via the wick through the band"): her Oct 18 break-one-tap-the-next
  // rejection (nextBandReject, same 5m candle, wick still spans the broken band) overrides the break direction - mirror for longs.
  try { const nr = nextBandReject(asset, L, tick, o, fiveHLNow(asset)); if (nr && nr.side === side) return ""; } catch {}
  // THE THIRDS OUTRANK THE BREAK (Oct 20 ~4:48 PM PT, Love, Oct 20 ~4:48 PM PT: "please change a candle rising in the bottom 33% of the channel to a long / candle falling in the top 33% a short / no shorts in
// the bottom 33% of the channel / no longs in the top 33% of the channel / please reinforce it it didn't work"): 4:45 PM gold broke the pink down at the open, fell to the green S1 and rose
  // in the bottom third - a long by her law; this candle's break no longer holds it. Mirror: falling in the top third = the short.
  try { if (thirdsMove(asset, L, tick, o, fiveHLNow(asset)) === side) return ""; } catch {}
  // ZONE FLIP OVERRIDE (Oct 20 ~2:32 AM PT, Love): price rejected from the red/green zone and the candle FLIPPED - the rejection
  // trades even though this candle's break points the other way (the break she skipped is what brought price to the zone).
  try { const zf = zoneFlipNow(asset, L, tick, o, fiveHLNow(asset)); if (zf && zf === side) return ""; } catch {}
  const cb = candleBreaks(asset, wallLines(asset, L), o, tick, undefined, fiveHLNow(asset));
  // CANDLE FLIP AT THE SESSION BAND (Oct 20 ~12:37 AM PT, Love: "if pink is broken, and price rejects at the session band below and a red
  // candle FLIPS GREEN - MUST FLIP GREEN - in that scenario, yes. inverse applies as well. must be a candle flip at the session band to
  // enter though"): when THIS candle's break the other way was the PINK alone (no session band broke that way), and price tapped a session
  // band past it without breaking it, and the candle has FLIPPED back across its open - the rejection off the session band may trade
  // against the pink break's direction. A session-band break keeps its crown: no override over one, ever.
  try {
    const hlF = fiveHLNow(asset);
    const tapF = PINK_TAP[asset] ?? 0, brkF = BREAK_DIST[asset] ?? 0;
    const sessF = L.filter((l) => isSessBand(l) && Number(l.price) > 0);
    if (hlF && tapF > 0 && brkF > 0 && sessF.length) {
      const cbS = candleBreaks(asset, sessF, o, tick, undefined, hlF);
      if (side === "up" && cb.down && String(cb.down.band?.name) === "5m PP" && !cbS.down && tick > o && hlF.l < o &&
          sessF.some((b) => hlF.l <= b.price + tapF && hlF.l > b.price - brkF && tick > b.price)) return "";
      if (side === "down" && cb.up && String(cb.up.band?.name) === "5m PP" && !cbS.up && tick < o && hlF.h > o &&
          sessF.some((b) => hlF.h >= b.price - tapF && hlF.h < b.price + brkF && tick < b.price)) return "";
    }
  } catch {}
  // BACK ACROSS = A REJECTION (Oct 20 ~9:54 PM PT, Love: "she can trade the break if price is on the same side of the break at the time of her entry ok / if it breaks and comes back on the other side of the band,
  // it's a rejection until price goes on the other side of the band in the direction it broke"): the break holds a side only while price is still past the band it broke.
  if (side === "up" && cb.down && tick > Number(cb.down.band?.price)) return "";
  if (side === "down" && cb.up && tick < Number(cb.up.band?.price)) return "";
  if ((side === "up" && cb.down) || (side === "down" && cb.up)) { try { if (oneMinCloseClears(asset, L, tick, side)) return ""; } catch {} }
  if (side === "up" && cb.down) return `this 5m candle broke DOWN through ${cb.down.band.name} (${Number(cb.down.band.price).toFixed(2)}) - band breaks down = trade down`;
  if (side === "down" && cb.up) return `this 5m candle broke UP through ${cb.up.band.name} (${Number(cb.up.band.price).toFixed(2)}) - band breaks up = trade up`;
  return "";
}
export function awayVerdict(asset: string, L: Line[], tick: number, side: string, Bk: Map<string, "up" | "down">, o: { nowS?: number; st?: Record<string, { side: string; at: number }>; pinkFree?: boolean; sessRej?: boolean; trail?: { t: number; c: number }[]; open?: number } = {}, extra: Line[] = []): string {
  if (!(tick > 0) || !(side === "up" || side === "down")) return "";
  void o; // NO BREAK EXEMPTION (Oct 18 ~2:02 PM PT, Love: "just make her stop longing into a band above her. make her stop shorting into a band below
  // her. closest session band = trade. away. from. it."). 2:01:43 PM: the Bollinger book longed with -1σ $46 above because a 5m R1 (red line) broke
  // up that candle and the exemption let it through. A session band price broke through sits behind her, so a real break already points her right.
  // SESSION BANDS DECIDE THE SIDE (Oct 18 ~1:59 PM PT, Love: "session band above = closer to her than the session band below her == SHORT. NOT.
  // LONG. session band below her closer [than] the session band above = LONG. NOT. SHORT."). Any distance.
  // CHANNEL = HER SESSION BANDS (Oct 18 ~7:45 PM PT, Love: "if price is inside of the top of the channel, closer to the top band than she is the lower
  // band, i do not want her to long into it. i want her to short... closer to the band below than above = long"): only the session bands pick the side;
  // the Bollinger bands (extra) are walls in front within range, like the pivot lines, and never move the middle of her channel.
  // a session band THIS candle broke in the trade's direction stays broken (not a wall, not a channel edge) until a candle closes back past it
  let brokeNow = new Set<string>();
  try {
    if (side === "up" || side === "down") {
      let trB = o.trail;
      if (!trB && !G.__stDefaultReach) { const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0]; const f0 = Math.floor(Date.now() / 300000) * 300000; trB = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0); }
      const opB = o.open ?? (G.__stDefaultReach ? 0 : fiveOpenNow(asset));
      const dB = BREAK_DIST[asset] ?? 0;
      if (opB > 0 && dB > 0 && trB && trB.length) {
        for (const b of L.filter((l) => isSessBand(l) && Number(l.price) > 0)) {
          let st0: string | null = opB > b.price ? "above" : opB < b.price ? "below" : null;
          for (const x of [...trB, { t: Number.MAX_SAFE_INTEGER, c: tick }]) {
            if (side === "up" && st0 === "below" && x.c >= b.price + dB) { brokeNow.add(b.name); break; }
            if (side === "down" && st0 === "above" && x.c <= b.price - dB) { brokeNow.add(b.name); break; }
          }
        }
      }
    }
  } catch { brokeNow = new Set(); }
  const S = wallFor(wallLines(asset, L).filter((l) => Number(l.price) > 0 && isSessBand(l) && !brokeNow.has(l.name)), Bk, tick, side);
  // CHANNEL EDGES ARE UNBROKEN ONLY (Oct 20 ~8:02 AM PT, Love): a standing-broken band is not a barrier and not a channel edge -
  // the 8:00:51 AM gold short read 37% against a BROKEN +2sigma top where her chart read 20% against the true unbroken edges.
  const chU = S; // BAND TO BAND (Oct 20 ~8:20 AM PT, Love): the channel is the gap between the adjacent bands exactly as drawn
  const up = chU.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0], dn = chU.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0];
  // PRESSED PAST AN UNBROKEN BAND IS STILL AT THE BAND - ALL BOOKS (Oct 19 ~11:23 PM PT, Love: "and yes, fix the blind spot"
  // after the 11:00:04 PM gold short 23c under unbroken -2σ): same guard as channelOnly. While this 5m candle opened on the far
  // side and price sits within break distance past an unbroken band, that band is still her floor (or ceiling) - only trades away
  // from it may fire. A real break (her break distance, or a 1m close through) is excluded above and trades the break untouched.
  try {
    const dPk = BREAK_DIST[asset] ?? 0;
    const oPk = o.open ?? (G.__stDefaultReach ? 0 : fiveOpenNow(asset));
    if (dPk > 0 && oPk > 0) {
      if (side === "down") {
        const pr = S.filter((l) => l.price > tick && l.price - tick < dPk && oPk > l.price && Bk.get(l.name) !== "down").sort((a, b) => b.price - a.price)[0];
        if (pr) return `would short pressed $${(pr.price - tick).toFixed(2)} under unbroken ${pr.name} (${pr.price.toFixed(2)}) - a poke short of her break distance is not a break, that band is still her floor - longs only here`;
      }
      if (side === "up") {
        const pr = S.filter((l) => l.price < tick && tick - l.price < dPk && oPk < l.price && Bk.get(l.name) !== "up").sort((a, b) => a.price - b.price)[0];
        if (pr) return `would long pressed $${(tick - pr.price).toFixed(2)} over unbroken ${pr.name} (${pr.price.toFixed(2)}) - a poke short of her break distance is not a break, that band is still her ceiling - shorts only here`;
      }
    }
  } catch {}
  // TOP / BOTTOM 20% OF THE CHANNEL (Oct 18 ~8:04 PM PT, Love: "a band that is $143 away is not an obstacle... can you just make it the top 20% of the
  // channel? no longs into it if a band is unbroken / no shorts into the bottom 20% of the channel if the band is unbroken / if the band breaks, trade
  // the direction of the break"): channel = the nearest unbroken session band below to the nearest unbroken session band above. Long refused only in its
  // top 20%, short refused only in its bottom 20%; anywhere else the channel doesn't block. Replaces the closest-band rule, the 10% neutral zone and
  // the $25 cap on session bands. A break is judged by the latest-break rule (candleBreakAgainst).
  const frac = up && dn ? (tick - dn.price) / (up.price - dn.price) : -1;
  // GOLD 30% (Oct 18 ~10:16 PM PT, Love: "we can make the channel on gold from 20% to 30% right now"): live-switch channelPct[asset], default 20%.
  let cp = 0.2; if (!G.__stDefaultReach) { try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.channelPct?.[asset]); if (v > 0 && v < 0.5) cp = v; } catch {} }
  if (side === "up" && up && dn && frac >= 1 - cp) return `price is in the top ${Math.round(cp * 100)}% of her channel (${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - no long INTO ${up.name} ($${(up.price - tick).toFixed(2)} above, unbroken)`;
  // GOLD: NO BAND WITHIN $1.50 IN FRONT, SESSION BANDS TOO (Oct 18 ~10:03 PM PT, Love: "i just told you. not into a band within $1.50 for gold" - 10:00 PM
  // long with +2σ $1.30 above, allowed by the 20% rule): on gold an unbroken session band within her gold range (live-switch bandReach, $1.50) in front
  // of the trade blocks it, on top of the 20% channel rule.
  // + BTC (Oct 18 ~11:48 PM PT, Love: "i want her to do the same thing for btc. exactly." - after the 11:45 PM gold short off the pink): the same session-band
  // range on BTC, at BTC's range ($25).
  if (asset === "gold" || asset === "btc") {
    const fr = side === "up" ? S.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0] : S.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0]; // walls stay wallFor-based; only the CHANNEL is unbroken-only
    if (fr && inReach(asset, fr.price, tick)) return `would ${side === "up" ? "long" : "short"} INTO ${fr.name} ($${Math.abs(fr.price - tick).toFixed(2)} ${side === "up" ? "above" : "below"}, unbroken) - inside her $${bandReach(asset)} ${asset} range`;
  }
  // FALLING FROM THE TOP THIRD (Oct 18 ~11:07 PM PT, Love: "if price is actively falling from the top 33% of the channel, no long / if price is actively
  // rising from the bottom 33% of the channel, no short"): this 5m candle's high (its open included) sat in the top 33% of her channel and price is still
  // falling from it - at least half her break distance under that high and not yet bounced her break distance (BTC $8 / gold 33c) off the low since -
  // = no long. Mirror for shorts from the bottom 33%.
  if (up && dn) {
    // FROZEN (Oct 19 ~12:19 AM PT, Love: "freeze it til it's frozen - until i say to thaw it" - data/FROZEN.json): this rule keeps its own distances,
    // BTC $8 / gold 33c, whatever the break distance elsewhere becomes.
    const FROZEN_THIRD_DIST: Record<string, number> = { btc: 8, gold: 0.33 };
    const dist = FROZEN_THIRD_DIST[asset] ?? 0, w = up.price - dn.price;
    let tr = o.trail;
    if (!tr && G.__stDefaultReach) tr = []; // the self-test never reads her live prices
    if (!tr) { const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0]; const f0 = Math.floor(Date.now() / 300000) * 300000; tr = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0); }
    const op = o.open ?? (G.__stDefaultReach ? 0 : fiveOpenNow(asset));
    const pts = [...(op > 0 ? [{ t: 0, c: op }] : []), ...(tr || []), { t: Number.MAX_SAFE_INTEGER, c: tick }];
    if (dist > 0 && w > 0 && pts.length > 1) {
      if (side === "up") {
        let hi = pts[0], i0 = 0; pts.forEach((p, i) => { if (p.c >= hi.c) { hi = p; i0 = i; } });
        const loAfter = Math.min(...pts.slice(i0).map((p) => p.c));
        if ((hi.c - dn.price) / w >= 0.67 && hi.c - tick >= dist / 2 && tick - loAfter < dist) return `price is falling from the top third of her channel (high ${hi.c.toFixed(2)}, now ${tick.toFixed(2)}, ${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - no long while it falls`;
      } else {
        let lo = pts[0], i0 = 0; pts.forEach((p, i) => { if (p.c <= lo.c) { lo = p; i0 = i; } });
        const hiAfter = Math.max(...pts.slice(i0).map((p) => p.c));
        if ((lo.c - dn.price) / w <= 0.33 && tick - lo.c >= dist / 2 && hiAfter - tick < dist) return `price is rising from the bottom third of her channel (low ${lo.c.toFixed(2)}, now ${tick.toFixed(2)}, ${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - no short while it rises`;
      }
    }
  }
  if (side === "down" && up && dn && frac <= cp) return `price is in the bottom ${Math.round(cp * 100)}% of her channel (${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - no short INTO ${dn.name} ($${(tick - dn.price).toFixed(2)} below, unbroken)`;
  // PINK BY A SESSION BAND = WAIT FOR ITS BREAK (Oct 18 ~2:31 PM PT, Love: "if the pink band is directly above/below one of the session bands, wait until
  // it breaks the pink band before entering. do not long at a session band if the pink band has not been broken through if it is in the immediate area.
  // within $25. same goes for shorts" - gold $2.22): an unbroken pink in front of the trade within range of the band she's trading off = wait.
  const behind = side === "up" ? dn : up;
  const pk = o.pinkFree ? undefined : wallLines(asset, L).find((l) => l.name === "5m PP" && Number(l.price) > 0);
  if (behind && pk && Bk.get(pk.name) !== side && (side === "up" ? pk.price > tick : pk.price < tick) && Math.abs(pk.price - behind.price) <= bandReach(asset)) return `waiting for the pink to break: 5m PP (${pk.price.toFixed(2)}, unbroken) sits $${Math.abs(pk.price - behind.price).toFixed(2)} from ${behind.name} - no ${side === "up" ? "long" : "short"} until it breaks`;
  // the pink / pivot lines never pick the side; an unbroken one right in front (within her $25 / $2.22) is still a wall
  // a pivot line price already broke through (either way) is no wall for a session-band rejection; the pink keeps its own rules above
  const P = wallFor([...wallLines(asset, o.pinkFree ? noPink(L) : L), ...extra].filter((l) => Number(l.price) > 0 && !isSessBand(l) && inReachL(asset, l, tick) && !(o.sessRej && l.name !== "5m PP" && Bk.has(l.name))), Bk, tick, side);
  const wl = P.find((l) => (side === "up" ? l.price > tick : l.price < tick));
  if (wl) return `would ${side === "up" ? "long" : "short"} INTO ${wl.name} ($${Math.abs(wl.price - tick).toFixed(2)} ${wl.price > tick ? "above" : "below"}, unbroken, within range)`;
  return "";
}

// HER SIDE-OF-THE-BAND RULE (Oct 16 ~2:22 PM PT, Love: "PRICE = REJECTING UP AWAY FROM BAND ===== LONG / PRICE = FALLING DOWN
// AWAY FROM A BAND = SHORT"): the band that matters is the band her setup is about (the one price broke or rejected), not
// whichever band happens to be a few dollars closer. Long only while price is ABOVE that band, short only while BELOW it.
// A row with no setup band (the inverse) falls back to the closest band.
function setupBand(ticker: string, book: string, side = ""): { name: string; price: number } | null {
  if (!ticker || !book) return null;
  try {
    const c = (G.__setupRows ||= { at: 0, rows: [] as any[] });
    if (Date.now() - c.at > 2000) { const rs = JSON.parse(readFileSync(D("grok-og.json"), "utf8")); c.rows = Array.isArray(rs) ? rs.slice(0, 400) : []; c.at = Date.now(); }
    // same side only (Oct 16 ~11:15 PM PT): an "other side" row carries no setup band, and must not be judged by the refused side's band
    const r = c.rows.find((x: any) => x && x.ticker === ticker && x.lane === book && (!side || x.side === side) && x.band && Number(x.band.price) > 0);
    if (!r) return null;
    // ZONES (Oct 16 ~2:24 PM PT, Love: "why would a short off of the red zone be refused ???"): the red zone is R1 up to R2 and
    // the green zone S1 down to S2 - a rejection anywhere in the zone is the trade. So a red-zone short is judged against the
    // TOP of the zone (short while price is under R2) and a green-zone long against its BOTTOM (long while price is over S2).
    const gl = r.goldLaw || {};
    if (r.side === "down" && Number(gl.ceil) > 0) return { name: `${r.band.name} zone top`, price: Number(gl.ceil) };
    if (r.side === "up" && Number(gl.floor) > 0) return { name: `${r.band.name} zone bottom`, price: Number(gl.floor) };
    return { name: String(r.band.name), price: Number(r.band.price) };
  } catch { return null; }
}
export function sideOfBandOk(bandPx: number, tick: number, side: string): boolean {
  return side === "up" ? tick > bandPx : side === "down" ? tick < bandPx : false;
}
// GREEN IS FOR LONGS, RED IS FOR SHORTS (Oct 19 ~1:10 AM PT, Love: "THE GREEN LINE IS NOT A REASON FOR REJECTION FOR A LONG. GREEN IS MEANT TO LONG. DO NOT
// BLOCK A LONG IN THE GREEN ZONE. DO NOT BLOCK A SHORT IN THE RED ZONE." - 1:00:39 AM gold long on the break up through -1σ refused for 5m S1 76c above):
// the green lines (5m S1/S2) are never a wall, a rejection or a line to cross for a long; the red lines (5m R1/R2) never for a short. The break rule
// (a break down is never a long) and the red/green zone rule (no long into the red, no short into the green) are unchanged.
const rgOffFor = (side: string) => (X: Line[]) => X.filter((l) => !(side === "up" ? /^5m S[12]$/ : /^5m R[12]$/).test(String(l.name)));
export const PASS_THRU = new Set<string>(["brk-sesspk"]);
// CURRENT CANDLE = THE DIRECTION (Oct 19 ~4:54 PM PT, Love: "current candle band breaks down = trade down / current candle breaks band up = trade up /
// good for one candle. not hours"): her candle-break rule (candleBreaks - every band this 5m candle broke, her break distance, the last way it broke)
// applies to the session + pink book again, at paper and at the Kalshi door. Only for this 5m candle; the next candle starts fresh.
export function candleDirAgainst(asset: string, L: Line[], tick: number, side: string): string {
  const o = fiveOpenNow(asset);
  if (!(o > 0) || !(tick > 0)) return "";
  const cb = candleBreaks(asset, L, o, tick, undefined, fiveHLNow(asset));
  if ((side === "up" && cb.down) || (side === "down" && cb.up)) { try { if (oneMinCloseClears(asset, L, tick, side)) return ""; } catch {} }
  if (side === "up" && cb.down) return `this 5m candle broke DOWN through ${cb.down.band.name} (${Number(cb.down.band.price).toFixed(2)}) - trade down only this candle`;
  if (side === "down" && cb.up) return `this 5m candle broke UP through ${cb.up.band.name} (${Number(cb.up.band.price).toFixed(2)}) - trade up only this candle`;
  // THE BREAK IS IN THIS CANDLE (Oct 19 ~5:00 PM PT - 5:00:20 PM gold short off the 4:59 candle's close under the pink while the 5:00 candle hadn't broken
  // anything; it broke UP 10 s later): she trades a break only once THIS 5m candle has broken a band that way.
  if (!cb.last) return `waiting: this 5m candle hasn't broken a band ${side === "up" ? "up" : "down"} yet`;
  return "";
}
// BREAKS GO THROUGH A LINE IN THE WAY (Oct 19 ~3:18 PM PT, Love: "pls let her trade the breaks" + "Yes, session + pink only" - 3:16 PM gold broke
// down through the pink and her short was refused "would short INTO 5m S1 ($1.11 below)"): for these books a line between price and the strike
// (or the closest band ahead) never refuses a break. Every other rule stays. brk-sess keeps its wall.
export const WALL_FREE = new Set<string>(["brk-sesspk"]);

// RED/GREEN ZONES AT THE RECON DOOR (Oct 20 ~12:22 AM PT, Love: "yes i do" + "the ideal red/green zones would be $1.50" - the 12:15:12 AM
// gold short filled $1.37 above the green S1 and died): no short toward the green zone, no long toward the red zone, when price is inside
// it or its near edge is within $1.50 on gold / her $50 clearance on BTC (Oct 19 ~9:31 PM PT). Price through the FAR edge = the zone is
// broken behind her - not a barrier. Can't read the zones = can't verify = no order (never blind).
// SLIDING ZONE REACH (Oct 20 ~1:00 PM PT, Love: "we need to update the ranges as price moves day to day ... a sliding scale" -> "YES"):
// the red/green zone reach is a share of the 5m zone's own width (R1 - PP), so it breathes with the market every candle. Calibrated on
// Oct 20 ~12:57 PM PT to her numbers: BTC $25 of a $105 width (24%), gold $1.50 of a $2.95 width (51%).
export const ZONE_REACH_PCT: Record<string, number> = { btc: 0.24, gold: 0.51 };
export function zoneReachSlide(asset: string, Z: Zones): number {
  const w = Z.r1 - Z.pp;
  const pct = ZONE_REACH_PCT[asset] ?? 0;
  if (!(w > 0) || !(pct > 0)) return asset === "gold" ? 1.5 : 25;
  return Math.round(w * pct * 100) / 100;
}
// REACH RETIRED (Oct 20 ~9:20 PM PT, Love picked "Retire both reach walls" - "no other method of operations"): her only limits are the top/bottom 33% of the
// channel (gold's R1/R2/S1/S2 are channel edges) and her candle. The fixed $50 / $1.50 band + pink reach and the red/green zone reach stand down.
const REACH_RETIRED = true;
export function reconZoneGate(asset: string, tick: number, side: string): string {
  if (REACH_RETIRED) return "";
  if (!(tick > 0) || !(side === "up" || side === "down")) return "";
  const Z = zonesNow(asset);
  if (!Z) return "can't verify the red/green zones right now";
  const reach = zoneReachSlide(asset, Z); // sliding (Oct 20 ~1:00 PM PT, Love); was fixed BTC $25 / gold $1.50
  if (side === "down" && tick > Z.s2) {
    if (tick <= Z.s1) return `would short inside the green zone (${Z.s2.toFixed(2)}-${Z.s1.toFixed(2)}) - longs only off a rejection there`;
    if (tick - Z.s1 <= reach) return `would short into the green zone $${(tick - Z.s1).toFixed(2)} above its edge (her $${reach} zone rule)`;
  }
  if (side === "up" && tick < Z.r2) {
    if (tick >= Z.r1) return `would long inside the red zone (${Z.r1.toFixed(2)}-${Z.r2.toFixed(2)}) - shorts only off a rejection there`;
    if (Z.r1 - tick <= reach) return `would long into the red zone $${(Z.r1 - tick).toFixed(2)} under its edge (her $${reach} zone rule)`;
  }
  return "";
}


// NO TRADE AGAINST THE CANDLE AT THE CHANNEL'S EDGE - RECON (Oct 20 ~1:32 AM PT, Love: "she longed btc in the top 33% of the channel
// after price broke the pink band while the candle was falling from the top 33% - that's a short ... she shorted on a rising candle
// from the bottom 33% on the last window and that lost as well. tighten that up"): the same falling-from-the-top-third /
// rising-from-the-bottom-third wall her classic books carry (awayVerdict's FROZEN rule, BTC $8 / gold 33c), now at the RECON door.
// Falling from the top third refuses longs; rising from the bottom third refuses shorts. Breaks don't excuse it - her words above
// were about a candle that HAD broken the pink.
export function reconThirdAgainst(asset: string, L: Line[], tick: number, side: string, Bk: Map<string, "up" | "down">): string {
  if (!(tick > 0) || !(side === "up" || side === "down")) return "";
  const RT_DIST: Record<string, number> = { btc: 8, gold: 0.33 };
  const dist = RT_DIST[asset] ?? 0;
  const o = fiveOpenNow(asset);
  const S = wallFor(wallLines(asset, L).filter((l) => Number(l.price) > 0 && isSessBand(l)), Bk, tick, side);
  // CHANNEL EDGES ARE UNBROKEN ONLY (Oct 20 ~8:02 AM PT, Love): a standing-broken band is not a barrier and not a channel edge -
  // the 8:00:51 AM gold short read 37% against a BROKEN +2sigma top where her chart read 20% against the true unbroken edges.
  const chU = S; // BAND TO BAND (Oct 20 ~8:20 AM PT, Love): the channel is the gap between the adjacent bands exactly as drawn
  const up = chU.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0], dn = chU.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0];
  if (!up || !dn || !(o > 0) || !(dist > 0)) return "";
  const w = up.price - dn.price;
  const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
  const f0 = Math.floor(Date.now() / 300000) * 300000;
  const tr = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0);
  const pts = [{ t: 0, c: o }, ...tr, { t: Number.MAX_SAFE_INTEGER, c: tick }];
  if (!(w > 0) || pts.length < 2) return "";
  if (side === "up") {
    let hi = pts[0], i0 = 0; pts.forEach((p, i) => { if (p.c >= hi.c) { hi = p; i0 = i; } });
    const loAfter = Math.min(...pts.slice(i0).map((p) => p.c));
    if ((hi.c - dn.price) / w >= 0.67 && hi.c - tick >= dist / 2 && tick - loAfter < dist) return `price is falling from the top third of her channel (high ${hi.c.toFixed(2)}, now ${tick.toFixed(2)}, ${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - that's a short, not a long`;
  }
  if (side === "down") {
    let lo = pts[0], i0 = 0; pts.forEach((p, i) => { if (p.c <= lo.c) { lo = p; i0 = i; } });
    const hiAfter = Math.max(...pts.slice(i0).map((p) => p.c));
    if ((lo.c - dn.price) / w <= 0.33 && tick - lo.c >= dist / 2 && hiAfter - tick < dist) return `price is rising from the bottom third of her channel (low ${lo.c.toFixed(2)}, now ${tick.toFixed(2)}, ${dn.name} ${dn.price.toFixed(2)} to ${up.name} ${up.price.toFixed(2)}) - that's a long, not a short`;
  }
  return "";
}


// THE ABSOLUTE THIRD WALL - BAND TO BAND (Oct 20 ~8:20 AM PT, Love: "a band - then a band - distance between them. no longs into
// one when it is in the top 33% of the top channel. no shorts into one when it is in the bottom 33% of the channel BETWEEN EACH
// BAND."): the channel is the gap between the session band directly below price and the one directly above it, exactly as her
// chart draws them - no broken-band re-drawing of the edges. In the top 33% of that gap: no long into the band above. In the
// bottom 33%: no short into the band below. Her one exception is her own break law: a band broken in the trade's direction
// (standing, or this candle by her break distance) is not a barrier - everything else is law. Every book, nothing strips it.
export function thirdWallAbsolute(asset: string, L: Line[], tick: number, side: string, Bk: Map<string, "up" | "down">): string {
  if (!(tick > 0) || !(side === "up" || side === "down")) return "";
  const U = chanL(asset, L).filter((l) => isChanBand(asset, l) && Number(l.price) > 0); // her one channel (Oct 20 ~4:48 PM PT, Love: "please reinforce it")
  // the move's tape: this 5m candle and the one before it (her Oct 18 candle-turn law), read once
  let twoT: number[] = [];
  try {
    const tk0 = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((x, y) => Number(y.slice(9)) - Number(x.slice(9)))[0];
    const f0m = Math.floor(Date.now() / 300000) * 300000;
    twoT = ((tk0 && G[tk0]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0m - 300000).map((x: any) => Number(x.c));
  } catch { twoT = []; }
  const twoHi = Math.max(...twoT, tick), twoLo = Math.min(...twoT, tick);
  let up = U.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0], dn = U.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0];
  const leanFloor = false; // (a floor-shift idea of Claude's was installed 10:48-10:56 AM and removed at Love's order: "you added something i didnt ask for")
  let cp = 0.33; try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.channelPct?.[asset]); if (v > 0 && v < 0.5) cp = v; } catch {}
  // TOP AND BOTTOM ZONES SET SEPARATELY (Oct 20 ~10:29 AM PT, Love: "no longs in the top 38% of the channel. no shorts in the bottom 33%"):
  // the bottom zone reads channelPct, the top zone reads channelPctTop.
  let cpTop = cp; try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.channelPctTop?.[asset]); if (v > 0 && v < 0.5) cpTop = v; } catch {}
  const brokeDir = (b: Line, dir: "up" | "down"): boolean => {
    if (Bk.get(b.name) === dir) return true;
    try {
      const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((x, y) => Number(y.slice(9)) - Number(x.slice(9)))[0];
      const f0 = Math.floor(Date.now() / 300000) * 300000;
      const trB = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0);
      const opB = fiveOpenNow(asset);
      const dB = BREAK_DIST[asset] ?? 0;
      if (!(opB > 0) || !(dB > 0)) return false;
      for (const x of [...trB, { t: Number.MAX_SAFE_INTEGER, c: tick }]) {
        if (dir === "up" && opB < b.price && x.c >= b.price + dB) return true;
        if (dir === "down" && opB > b.price && x.c <= b.price - dB) return true;
      }
    } catch {}
    return false;
  };
  // NO TRADES INTO UNBROKEN BANDS WITHIN REACH (Oct 20 ~10:13 AM PT, Love: "no trades into the pink band within $1.50 on gold.
  // $2.22 of the session bands. unbroken bands = no trades into them."): any session band or the pink sitting in front of the
  // trade, unbroken in the trade's direction, within her reach, refuses it - every book, before anything else.
  if (!REACH_RETIRED) {
    // HER NUMBERS (Oct 20 ~10:29 AM PT, Love: "$50 for btc and the pink band. $1.50 for gold and the pink band.")
    const SESS_REACH: Record<string, number> = { gold: 1.5, btc: 50 };
    const PINK_REACH: Record<string, number> = { gold: 1.5, btc: 50 };
    const front = L.filter((l) => Number(l.price) > 0 && (isSessBand(l) || String(l.name) === "5m PP") && (side === "up" ? l.price > tick : l.price < tick));
    for (const b of front) {
      const reach = String(b.name) === "5m PP" ? (PINK_REACH[asset] ?? 0) : (SESS_REACH[asset] ?? 0);
      const dist = Math.abs(b.price - tick);
      if (reach > 0 && dist <= reach && !brokeDir(b, side === "up" ? "up" : "down")) return `THE WALL: ${b.name} (${b.price.toFixed(2)}) is unbroken $${dist.toFixed(2)} ${side === "up" ? "above" : "below"} - no ${side === "up" ? "long" : "short"} into it (her $${reach} reach). no excuses`;
    }
  }
  // THE 5M PIVOT ZONES ARE WALLS BOTH WAYS (Oct 20 ~10:36 AM PT, Love: "i am using the 5M pivot zones. no longs or shorts into
  // them within the same $1.50"): the red zone (R1..R2) and the green zone (S1..S2). A trade toward either zone's near edge within
  // her reach is refused; a trade from inside a zone toward its far edge is refused; price through a zone's far side has broken it.
  if (!REACH_RETIRED) try {
    const Z = zonesNow(asset);
    if (Z && Z.r1 > 0 && Z.s1 > 0) {
      const ZR = zoneReachSlide(asset, Z); // sliding (Oct 20 ~1:00 PM PT, Love); was fixed BTC $25 / gold $1.50
      if (side === "up") {
        if (tick >= Z.r1 && tick < Z.r2) return `THE WALL: inside the red zone (${Z.r1.toFixed(2)}-${Z.r2.toFixed(2)}) - no long. no excuses`;
        const cand = [Z.r1 > tick ? Z.r1 : Infinity, Z.s2 > tick ? Z.s2 : Infinity];
        const nxt = Math.min(cand[0], cand[1]);
        if (nxt < Infinity && nxt - tick <= ZR) return `THE WALL: ${nxt === Z.r1 ? "red" : "green"} zone $${(nxt - tick).toFixed(2)} above - no long into it (her $${ZR} zone reach). no excuses`;
      } else {
        if (tick <= Z.s1 && tick > Z.s2) return `THE WALL: inside the green zone (${Z.s2.toFixed(2)}-${Z.s1.toFixed(2)}) - no short. no excuses`;
        const cand = [Z.s1 < tick ? Z.s1 : -Infinity, Z.r2 < tick ? Z.r2 : -Infinity];
        const nxt = Math.max(cand[0], cand[1]);
        if (nxt > -Infinity && tick - nxt <= ZR) return `THE WALL: ${nxt === Z.s1 ? "green" : "red"} zone $${(tick - nxt).toFixed(2)} below - no short into it (her $${ZR} zone reach). no excuses`;
      }
    }
  } catch {}
  if (!up || !dn) return "";
  const w = up.price - dn.price;
  if (!(w > 0)) return "";
  const frac = (tick - dn.price) / w;
  cp = lockPctFor(asset, w); cpTop = cp; // sliding by width (Oct 20 ~1:27 PM PT, Love: BTC >$300 = 20%, gold $7.50-$10 = 33%->20%)
  // (Option A withdrawn minutes after it went in - Oct 20 ~8:26 AM PT, Love, caps hers: "NO LONGS IN THE TOP 33% INTO AN
  // UNBROKEN BAND. NO SHORTS IN THE BOTTOM 33% INTO AN UNBROKEN BAND. I DID NOT ASK YOU TO MAKE HER REJECTIONS ONLY I SAID TO
  // TRADE THE BREAKS TOO." The wall below is her law in full: the forbidden zone is the third nearest the unbroken band, the
  // launch carries across the candle turn, and a band broken in the trade's direction trades free.)
  if (side === "up" && frac >= 1 - cpTop && !brokeDir(up, "up")) return `THE WALL: top ${Math.round(cpTop * 100)}% of the ${dn.name} -> ${up.name} channel (${dn.price.toFixed(2)} to ${up.price.toFixed(2)}) - no long into ${up.name}, it is unbroken. no excuses`;
  if (side === "down" && frac <= cp && (leanFloor || !brokeDir(dn, "down"))) return `THE WALL: bottom ${Math.round(cp * 100)}% of the ${dn.name} -> ${up.name} channel (${dn.price.toFixed(2)} to ${up.price.toFixed(2)}) - no short into ${dn.name}, it is unbroken. no excuses`;
  // THE LAUNCH COUNTS ACROSS THE CANDLE TURN (Oct 20 ~8:23 AM PT, Love, caps hers: "price = top 33% of the channel, RED CANDLE
  // FALLING FROM THE BAND = NO LONGS. price = bottom 33% of the channel, GREEN CANDLE RISING FROM THE BAND = NO SHORTS."): the
  // 8:15:11 AM gold short fired 11 seconds into a fresh candle, blind to the green rise launched off the band in the candle
  // before. The move's launch (previous 5m candle included) now carries: a rise launched in the bottom third of the gap, still
  // holding tap-distance above its launch, forbids shorts while the band below is unbroken; a fall launched in the top third
  // forbids longs while the band above is unbroken.
  try {
    const tapT = PINK_TAP[asset] ?? 0;
    const tkL = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((x, y) => Number(y.slice(9)) - Number(x.slice(9)))[0];
    const allT = ((tkL && G[tkL]?.[asset]) || []).filter((x: any) => x && x.c > 0);
    const f0ms = Math.floor(Date.now() / 300000) * 300000;
    const two = allT.filter((x: any) => x.t >= f0ms - 300000).map((x: any) => Number(x.c));
    if (tapT > 0 && two.length) {
      const launchLo = twoLo, launchHi = twoHi;
      // A rejection at the opposite band ends the move (Oct 20 ~9:19 AM PT, Love: "price rejected the bottom band on gold.
      // long. now"): once price has turned tap-distance off the move's own extreme, the fall (or rise) is over and the other
      // side opens.
      if (side === "down" && (launchLo - dn.price) / w <= cp && tick >= launchLo + tapT && launchHi - tick < tapT && !brokeDir(dn, "down")) return `THE WALL: green candle rising from the band (launched ${launchLo.toFixed(2)}, bottom third of ${dn.name} -> ${up.name}) - no shorts. no excuses`;
      if (side === "up" && (launchHi - dn.price) / w >= 1 - cpTop && tick <= launchHi - tapT && tick - launchLo < tapT && !brokeDir(up, "up")) return `THE WALL: red candle falling from the band (launched ${launchHi.toFixed(2)}, top third of ${dn.name} -> ${up.name}) - no longs. no excuses`;
    }
  } catch {}
  return "";
}
export function bandLockCheck(book: string, asset: string, side: string, ticker = ""): { ok: true } | { ok: false; reason: string } {
  // EVERY BOOK (Oct 16 ~1:10 PM PT, Love: "EVERY FUCKING BOOK WE OWN. EVERYTHING THAT EVER RUNS."): no exemptions - the
  // inverse included, any asset. An asset with no band feed can't be verified, so it can't open.
  void LAW_BOOKS;
  const deny = (reason: string, extra: Record<string, unknown> = {}) => {
    try { appendFileSync(D("band-lock.jsonl"), JSON.stringify({ at: new Date().toISOString(), book, asset, side, reason, ...extra }) + "\n"); } catch {}
    return { ok: false as const, reason };
  };
  if (!(asset === "gold" || asset === "btc")) return deny(`no band feed for ${asset} to verify against - it can't open`);
  // RECONSTRUCTED (Oct 19 ~6:16 PM PT, Love: "that exact configuration that traded that way that day"): the Oct 12 book had no band lock at the door -
  // its two refusals live in recon.ts at the decision. Here: a fresh price and a healthy feed, nothing else.
  if (RECON.has(book)) {
    const qR = quoteTick(asset); if (!qR || !(qR.c > 0) || Date.now() - qR.at > 3000) return deny("can't verify the price right now (no fresh price)");
    const fhR = feedHealth(asset); if (!fhR.ok) return deny(`price feed not healthy (${fhR.why})`);
    // + HER 33% CHANNEL RULE (Oct 19 ~6:33 PM PT, Love) - the one addition to the Oct 12 door.
    const lbR = G.__lawBands?.[asset];
    if (!lbR || !Array.isArray(lbR.L) || !lbR.L.length || Date.now() - Number(lbR.at) > 15000) return deny("can't verify the channel right now (band list not fresh)");
    if (book === "recon-dly" && dlyFreeNow(asset)) { const gwR = dlyThirds(asset, lbR.L, qR.c, side); /* fix307 */ return gwR ? deny(gwR, { tick: qR.c }) : { ok: true }; } // THE DELAYED BOOK in her off hours (Love, Oct 21 ~10:59 AM PT) - free but for her 33% + top/bottom line (11:21 AM)
    const imR = impossibleGeo(asset, lbR.L, qR.c, side, false, book === "recon-dly" && !DLY_AS_COPY, book === "recon-togp" || (DLY_AS_COPY && book === "recon-dly") /* fix353 */ || book === "recon-dlyk" || book === "recon-np" /* fix361 */ /* fix354: the delayed no-pink copy meets the copy walls */, book === "recon-rej", book === "recon-rej" || book === "recon-tog", (book === "recon-tog" || book === "recon-rej" /* fix324 */) ? 0.4 : 0, (book === "recon-tog" || book === "recon-rej") ? true : false, book === "recon-np" /* fix363 */).why; // fix272: twin pink-free every hour // THE IMPOSSIBILITY at her door too (Oct 20 ~2:37 PM PT, Love) - same function as the wire
    if (imR) return deny(imR, { tick: qR.c });
    { const tmR = thirdsMove(asset, lbR.L, qR.c, fiveOpenNow(asset), fiveHLNow(asset)); if (tmR && tmR !== side) return deny(`the candle is ${tmR === "up" ? "rising from the bottom third - a long, never a short" : "falling from the top third - a short, never a long"} (Oct 20 ~5:07 PM PT, Love)`, { tick: qR.c }); }
    const chR = channelOnly(asset, lbR.L, qR.c, side, refreshBroken(asset, lbR.L, qR.c)); // REJECTION OVERRIDE REMOVED (Oct 19 ~9:18 PM PT, Love: "let's remove the pink band rejection override... she shorted here and it would have been rejected for being in the bottom 33% on gold" - the wall rules over rejections again)
    if (chR) return deny(chR, { tick: qR.c });
    const cdR = candleDirOnly(asset, lbR.L, qR.c, side); // band breaks up = trade up (Oct 19 ~6:34 PM PT, Love)
    if (cdR) return deny(cdR, { tick: qR.c });
    const zR = reconZoneGate(asset, qR.c, side); // her red/green zones at the recon door (Oct 20 ~12:22 AM PT, Love: "yes i do")
    if (zR) return deny(zR, { tick: qR.c });
    const tR = reconThirdAgainst(asset, lbR.L, qR.c, side, refreshBroken(asset, lbR.L, qR.c)); // falling-from-top / rising-from-bottom wall (Oct 20 ~1:32 AM PT, Love: "tighten that up")
    if (tR) return deny(tR, { tick: qR.c });
    const wAbs = thirdWallAbsolute(asset, lbR.L, qR.c, side, refreshBroken(asset, lbR.L, qR.c)); // THE WALL (Oct 20 ~8:05 AM PT, Love: "make it impossible. no excuses")
    if (wAbs) return deny(wAbs, { tick: qR.c });
    return { ok: true };
  }
  if (G.__bandLawBroken) return deny("band law failed its self-test - no orders until it passes");
  const lb = G.__lawBands?.[asset];
  if (!lb || !Array.isArray(lb.L) || !lb.L.length || Date.now() - Number(lb.at) > 15000) return deny("can't verify the closest band right now (band list not fresh)");
  // NEVER BLIND (Oct 17 ~2:42 PM PT, Love: "yes, both please"): no session bands on her list = can't verify = no order.
  if (!lb.L.some((l: Line) => /σ$|^session VWAP$|^BB (upper|lower)$/.test(String(l.name)))) return deny("can't verify the session bands right now (none on her list)");
  const q = quoteTick(asset);
  if (!q || !(q.c > 0) || Date.now() - q.at > 3000) return deny("can't verify the closest band right now (no fresh price)");
  const fh = feedHealth(asset);
  if (!fh.ok) return deny(`price feed not healthy (${fh.why})`);
  { const wAbs = thirdWallAbsolute(asset, lb.L, q.c, side, refreshBroken(asset, lb.L, q.c)); if (wAbs) return deny(wAbs, { tick: q.c }); } // THE WALL - every book (Oct 20 ~8:05 AM PT, Love: "make it impossible. no excuses")
  // PAPER = KALSHI (Oct 19 ~3:06 PM PT, Love: "just let her trades go thru when she takes them" + "let her trades thru for now ok we'll see if we
  // need to revise"): the session + pink break book's paper call goes straight to Kalshi - the door doesn't re-judge her band rules
  // (the 3:00 PM BTC long was booked on paper and refused here 700+ times). Feed health, fresh price and the 1.36x floor still apply.
  // ONE RULEBOOK FOR SESSION + PINK (Oct 19 ~5:25 PM PT, Love: "yes pls"): since 3:10 PM PASS_THRU let this book skip every band rule at the door
  // (8-4, +$6.06 before; 6-8, -$84.79 after - 4:45 PM gold it longed "Close above -2σ" while SESSION ONLY shorted the same band and won). It now runs
  // the same band law as SESSION ONLY (brk-sess). Kept from her 3:19 PM asks: no line-to-strike wall on a break (WALL_FREE), red/green zones off
  // (ZONES_OFF). Kept from 5:06 PM: the break must be in THIS 5m candle (candleDirAgainst). The 75c ceiling (floorFor) is unchanged.
  if (PASS_THRU.has(book)) { const cdA = candleDirAgainst(asset, wallLines(asset, lb.L), q.c, side); if (cdA) return deny(cdA, { tick: q.c }); }
  // NO TRADE AGAINST A BREAK IN THIS CANDLE (Oct 16 ~2:52 PM PT, Love: "SHE SHOULD NOT SHORT A RISING CANDLE THAT BROKE UP
  // THRU A BAND"): if the live 5m candle is rising and price has crossed up through a band since it opened, no short; if it is
  // falling and has crossed down through a band, no long. Checked on every order, whatever the setup was.
  // INVERSE TEST (Oct 16 ~4:05 PM PT, Love: "run the inverse book on the next windows @ $5 up through to 5pm... if she correctly
  // fires on the inverse book, that is a backwards fire on our main ones"). The inverse trades AGAINST the twin's call, so the
  // band rules below would refuse every order it makes; for her test it skips them (feed health still applies). Off at 5 PM.
  if (book === "ogp5-inv") { try { if (JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.invTest4pm) return { ok: true }; } catch {} }
  const W = wallLines(asset, lb.L);
  const rgOff = rgOffFor(side);
  const LZ: Line[] = rgOff(ZONES_OFF.has(book) ? noZ(lb.L) : lb.L);
  const rtD0 = pinkRetest(asset, lb.L, q.c); const rtD = !!(rtD0 && rtD0.side === side); // broke, tapped the pink, rejected = her entry (Oct 19 ~12:56 / 1:05 AM PT)
  const brk = rtD ? "" : candleBreakAgainst(asset, W, q.c, side) || sessionBreakPinkHold(asset, lb.L, q.c, side) || pinkRejectAgainst(asset, LZ, q.c, side) || (ZONES_OFF.has(book) || NO_REJ_HOLD.has(book) ? "" : rejCarryAgainst(asset, LZ, q.c, side)); // NO REJECTION HOLD on the session + pink book (Oct 17 ~6:33 PM PT, Love: "Remove the hold" - a push off a band goes straight in)
  if (brk) return deny(brk, { tick: q.c });
  const Bk = refreshBroken(asset, lb.L, q.c);
  const Wall = wallFor(rgOff(W), Bk, q.c, side); // broken walls don't block the break direction (Oct 17 ~1:19 / 1:38 AM PT)
  const tg = WALL_FREE.has(book) ? "" : crossToTarget(asset, Wall, q.c, side, targetNow(asset)); // no band between price and the target (Oct 17 ~2:02 AM PT); not for WALL_FREE books (Oct 19 ~3:18 PM PT), door = paper
  if (tg) return deny(tg, { tick: q.c, target: targetNow(asset) });
  const ab = NO_AT_WAIT.has(book) || rtD ? "" : atSessionBand(asset, Wall, q.c); // at the session band = wait (Oct 17 ~10:41 AM PT)
  if (ab) return deny(ab, { tick: q.c });
  // SESSION-AHEAD WAIT RETIRED (Oct 17 ~4:20 PM PT, Love: "pink band was plainly in the middle of the channel. price breaks pink band = get in. don't wait until
  // it's at the top of the channel to get in") - the 25% rule decides how high she can be. The $6 pink break still applies.
  const sa = NO_AT_WAIT.has(book) || rtD ? "" : atPink(asset, Wall, q.c);
  if (sa) return deny(sa, { tick: q.c });
  const pr = ROOM_TWIN[book] ? pinkInFront(asset, Wall, q.c, side, fiveOpenNow(asset), ROOM_TWIN[book]) : ""; // room rule only on its paper twins now (Oct 17 ~3:19 PM PT)
  if (pr) return deny(pr, { tick: q.c });
  const zg = ZONES_OFF.has(book) ? "" : zoneGate(asset, lb.L, q.c, side);
  if (zg) return deny(zg, { tick: q.c });
  const sb = setupBand(ticker, book, side);
  if (sb) {
    if (!sideOfBandOk(sb.price, q.c, side)) return deny(`would ${side === "up" ? "long" : "short"} on the wrong side of ${sb.name} (her setup band) - price ${q.c} vs band ${sb.price}`, { tick: q.c, band: sb });
  }
  // CLOSEST BAND DECIDES, EVERY ORDER (Oct 16 ~10:30 PM PT, Love: "when an unbroken band is closer in front of her than it is the
  // band behind it, she is to trade THAT band"): a setup band no longer skips this check. Closest band above price = short only,
  // closest band below = long only. Replay of Oct 14-16 live fills: 68 main-book fills went against the closest band, 44% right.
  const ns = nearSide(Wall, q.c);
  if (!ns) return deny("can't verify the closest band right now");
  // CLOSEST BAND IS BACK (Oct 17 ~4:54 PM PT, Love: "put it back under the closest band rule again hun") - replaces the 25% rule.
  let sRej = false; try { const c = G.__setupRows; const r = c && Array.isArray(c.rows) ? c.rows.find((x: any) => x && x.ticker === ticker && x.lane === book && x.side === side && x.band) : null; sRej = isSessRej(r); } catch {}
  { const aw = awayVerdict(asset, rgOff(lb.L), q.c, side, Bk, { sessRej: sRej }, BB_BOOKS.has(book) ? bbLines(asset) : []); if (aw) return deny(aw, { tick: q.c, band: ns.band }); } // HER RULE: away from the closest band, break = trade the break
  // PASS LOG (Oct 17 ~10:50 AM PT, after the 10:31 AM long under -2 sigma): what the gate saw on every order it let through. Read-out only.
  try { const near = Wall.slice().sort((a, b) => Math.abs(a.price - q.c) - Math.abs(b.price - q.c)).slice(0, 4).map((l) => ({ n: l.name, p: Math.round(l.price * 100) / 100 })); appendFileSync(D("band-pass.jsonl"), JSON.stringify({ at: new Date().toISOString(), book, asset, side, ticker, tick: q.c, near, dropped: W.filter((l) => !Wall.includes(l)).map((l) => l.name), broken: Object.fromEntries(Bk), target: targetNow(asset) }) + "\n"); } catch {}
  return { ok: true };
}

/** The gate's own rule: may an order on `side` go out with price `tick` and these bands? */
export function gateAllows(L: Line[], tick: number, side: string): boolean {
  const ns = nearSide(L, tick);
  return !!ns && (!ns.side || ns.side === side);
}
/** Self-test (no-flip version, Oct 16 ~2:20 PM PT): her setups may now disagree with the closest band - the GATE must refuse
 * every such order and pass every agreeing one. Random scenarios through the live goldLaw + the gate. Sets __bandLawBroken. */
// SELF-TEST ON THE DEFAULT RANGES (Oct 18 ~6:10 PM PT): the test cases are written for $25 BTC / $2.22 gold; a live-switch bandReach
// override (gold $1.11, Love ~5:53 PM PT) made 2 cases fail and the failed test blocked every order from 6:01 PM. The test now always
// runs on the defaults; live trading still uses her live-switch range.
export function bandSelfTest(goldLaw: (...a: any[]) => any, n = 2000): number {
  G.__stDefaultReach = true;
  try { return bandSelfTest0(goldLaw, n); } finally { G.__stDefaultReach = false; }
}
function bandSelfTest0(goldLaw: (...a: any[]) => any, n = 2000): number {
  let seed = (Date.now() % 100000) + 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const bars = (open: number, k: number, vol: number) => { const out: any[] = []; let p = open; for (let i = 0; i < k; i++) { const o = p, c = o + (rnd() - 0.5) * vol; out.push({ o, c, h: Math.max(o, c) + rnd() * vol * 0.6, l: Math.min(o, c) - rnd() * vol * 0.6, t: i * 60 }); p = c; } return out; };
  const extra = ["+1σ", "-1σ", "+1.5σ", "-1.5σ", "+2σ", "-2σ", "session VWAP", "2m PP", "10m PP", "15m R1", "15m S1"];
  let bad = 0, calls = 0;
  for (let i = 0; i < n; i++) {
    const base = 4000 + rnd() * 80000, sp = base * (0.0002 + rnd() * 0.003), pp = base + (rnd() - 0.5) * sp * 2, st = sp * (0.5 + rnd());
    const L: Line[] = [{ name: "5m PP", price: pp }, { name: "5m R1", price: pp + st }, { name: "5m R2", price: pp + 2 * st }, { name: "5m S1", price: pp - st }, { name: "5m S2", price: pp - 2 * st }];
    for (const nm of extra) if (rnd() < 0.5) L.push({ name: nm, price: base + (rnd() - 0.5) * sp * 6 });
    const vol = sp * (0.2 + rnd() * 1.5), po = base + (rnd() - 0.5) * sp * 3, pb = bars(po, 5, vol), co = pb[4].c, nc = Math.floor(rnd() * 5), cb = bars(co, nc, vol);
    const tick = (nc ? cb[nc - 1].c : co) + (rnd() - 0.5) * vol * 2;
    const broken = L.filter(() => rnd() < 0.15).map((l) => ({ name: l.name, side: rnd() < 0.5 ? "up" : "down" }));
    let call: any = null;
    try { call = goldLaw(L, tick, { open: co, bars: cb }, { open: po, bars: pb }, nc ? cb[nc - 1] : pb[4], broken, null, false); } catch { bad++; continue; }
    if (!call) continue;
    calls++;
    const ns = nearSide(L, tick);
    const into = !!(ns && ns.side && ns.side !== call.side);
    if (gateAllows(L, tick, call.side) === into) bad++; // fallback gate must refuse exactly the into-band orders
    const bp = Number(call.band?.price);
    if (bp > 0 && sideOfBandOk(bp, tick, call.side) !== (call.side === "up" ? tick > bp : tick < bp)) bad++; // setup-band gate
  }
  { const T: Line[] = [{ name: "5m PP", price: 100 }];
    if (!candleBreakAgainst("x", T, 101, "down", 99)) bad++;   // rising candle broke up through PP -> short refused
    if (!candleBreakAgainst("x", T, 99, "up", 101)) bad++;     // falling candle broke down through PP -> long refused
    if (candleBreakAgainst("x", T, 101, "up", 99)) bad++;      // with the break -> allowed
    if (candleBreakAgainst("x", T, 99, "down", 101)) bad++; }
  { const Q: Line[] = [{ name: "session VWAP", price: 200, unit: 100 }, { name: "+1σ", price: 300, unit: 100 }, { name: "5m R1", price: 212 }];
    if (!pinkInFront("btc", Q, 200.5, "up")) bad++;    // $100 bands -> $15 room; R1 $11.50 above -> long refused
    if (pinkInFront("btc", Q, 170, "up")) bad++;       // VWAP $30 above -> ok
    if (!pinkInFront("btc", Q, 205, "down")) bad++;    // VWAP $5 below -> short refused
    if (pinkInFront("btc", Q, 250, "down")) bad++; }   // nearest band below $38 -> ok
  { const P: Line[] = [{ name: "5m PP", price: 100 }, { name: "5m R1", price: 123 }]; // no session unit -> flat fallback $25 / $1.50
    if (!pinkInFront("btc", P, 101, "up")) bad++;      // R1 $22 above (3:30 PM case) -> long refused
    if (!pinkInFront("btc", P, 90, "up")) bad++;      // pink $10 above -> long refused
    if (pinkInFront("btc", P, 70, "up")) bad++;       // pink $30 above -> long ok
    if (!pinkInFront("btc", P, 110, "down")) bad++;   // pink $10 below -> short refused
    if (pinkInFront("btc", P, 150, "up")) bad++;      // bands below a long -> ok
    if (!pinkInFront("gold", P, 99.5, "up")) bad++;   // gold $0.50 under pink -> long refused
    if (!pinkInFront("gold", P, 98.61, "up")) bad++;  // gold $1.39 under (the 12:45 PM case) -> refused
    if (pinkInFront("gold", P, 98.3, "up")) bad++; }  // gold $1.70 under -> ok
  { const Z = { pp: 100, r1: 110, r2: 120, s1: 90, s2: 80 }, V1 = { cur: 1, avg: 1, frac: 1 }, V3 = { cur: 3, avg: 1, frac: 1 };
    const S: Line[] = [{ name: "session VWAP", price: 115 }], F: Line[] = [{ name: "session VWAP", price: 50 }], G2: Line[] = [{ name: "session VWAP", price: 85 }];
    if (!zoneGate("x", S, 112, "up", { zones: Z, open: 108, vol: V1 })) bad++;   // long IN the red, band unbroken, weak volume -> refused
    if (zoneGate("x", S, 112, "up", { zones: Z, open: 108, vol: V3 })) bad++;    // same with strong volume -> long ok
    if (zoneGate("x", S, 116, "up", { zones: Z, open: 112, vol: V1 })) bad++;    // long IN the red after VWAP inside it broke up -> ok
    if (zoneGate("x", S, 112, "down", { zones: Z, open: 113, vol: V1 })) bad++;  // short IN the red (rejection, away from it) -> ok
    if (!zoneGate("x", F, 103, "up", { zones: Z, open: 101, vol: V1 })) bad++;   // R1 closest line above, weak volume -> long refused
    if (zoneGate("x", F, 103, "up", { zones: Z, open: 101, vol: V3 })) bad++;    // same with strong volume -> long ok
    if (zoneGate("x", F, 103, "down", { zones: Z, open: 104, vol: V1 })) bad++;  // short under the red -> ok
    if (zoneGate("x", F, 95, "up", { zones: Z, open: 94, vol: V1 })) bad++;      // long with S1 behind -> ok
    if (!zoneGate("x", F, 93, "down", { zones: Z, open: 95, vol: V1 })) bad++;   // S1 closest line below, weak volume -> short refused
    if (!zoneGate("x", G2, 87, "down", { zones: Z, open: 88, vol: V1 })) bad++;  // short IN the green, unbroken -> refused
    if (zoneGate("x", G2, 84, "down", { zones: Z, open: 88, vol: V1 })) bad++;   // short IN the green after VWAP inside it broke down -> ok
    if (zoneGate("x", F, 85, "up", { zones: Z, open: 84, vol: V1 })) bad++; }    // long IN the green (rejection, away) -> ok
  { const f0 = Math.floor(Date.now() / 300000) * 300, now = f0 + 120, P: Line[] = [{ name: "session VWAP", price: 100, unit: 110 }, { name: "5m PP", price: 115 }];
    const prevUp = [{ t: f0 - 300, o: 95, h: 104, l: 94, c: 103 }], prevFlat = [{ t: f0 - 300, o: 96, h: 99, l: 95, c: 98 }];
    if (!sessionBreakPinkHold("btc", P, 108, "down", { open: 95, bars: prevFlat, now })) bad++; // VWAP broke up THIS candle, pink $15 over -> no short
    if (!sessionBreakPinkHold("btc", P, 108, "up", { open: 95, bars: prevFlat, now })) bad++;   // ...and no long until the pink breaks
    if (sessionBreakPinkHold("btc", P, 108, "down", { open: 104, bars: prevUp, now })) bad++;   // new candle (broke last candle) -> pink rejection allowed
    if (sessionBreakPinkHold("btc", [{ name: "session VWAP", price: 100, unit: 110 }, { name: "5m PP", price: 140 }], 108, "down", { open: 95, bars: prevFlat, now })) bad++; // pink $40 away -> no hold
    if (!sessionBreakPinkHold("btc", [{ name: "session VWAP", price: 100, unit: 110 }, { name: "5m PP", price: 85 }], 92, "up", { open: 105, bars: prevFlat, now })) bad++; // mirror: no long off the pink this candle
    if (!candleBreakAgainst("x", [{ name: "+1σ", price: 100 }, { name: "5m PP", price: 90 }], 95, "up", 105, { h: 106, l: 89 })) bad++; } // falling candle broke +1σ, tapped pink -> still no long
  { const PP: Line[] = [{ name: "5m PP", price: 90 }];
    if (!candleBreakAgainst("btc", PP, 92, "up", 95, { h: 96, l: 81 })) bad++;   // punched $9 under the pink, snapped back -> a break: no long
    if (candleBreakAgainst("btc", PP, 92, "up", 95, { h: 96, l: 85 })) bad++;    // only $5 under -> a rejection: long ok
    if (!candleBreakAgainst("gold", PP, 90.5, "up", 91, { h: 91.2, l: 88.9 })) bad++; // gold $1.10 under -> break
    if (!candleBreakAgainst("btc", PP, 88, "down", 85, { h: 99, l: 84 })) bad++; } // mirror: punched $9 over, back under -> no short
  { const f0 = Math.floor(Date.now() / 300000) * 300, P: Line[] = [{ name: "5m PP", price: 90 }, { name: "session VWAP", price: 120, unit: 50 }];
    const st: any = {};
    if (!refreshBroken("btc", P, 92, { now: f0 + 100, open: 95, hl: { h: 96, l: 81 }, bars: [], state: st }).has("5m PP")) bad++;   // punched $9 through -> broken wall
    if (!refreshBroken("btc", P, 93, { now: f0 + 310, open: 93, hl: { h: 94, l: 91 }, bars: [{ t: f0, o: 95, h: 96, l: 81, c: 89 }], state: st }).has("5m PP")) bad++; // 5m closed 89, still under -> still broken
    if (refreshBroken("btc", P, 93, { now: f0 + 610, open: 93, hl: { h: 94, l: 91 }, bars: [{ t: f0 + 300, o: 93, h: 94, l: 91, c: 93 }], state: st }).has("5m PP")) bad++; // 5m closed 93 back over -> wall again
    const s2: any = {};
    refreshBroken("btc", P, 108, { now: f0 + 100, open: 125, hl: { h: 126, l: 105 }, bars: [], state: s2 });
    if (refreshBroken("btc", P, 122, { now: f0 + 130, open: 125, hl: { h: 126, l: 105 }, bars: [{ t: f0 + 60, o: 110, h: 122, l: 108, c: 121 }], state: s2 }).has("session VWAP")) bad++; } // 1m close back over VWAP -> wall again
  { const W: Line[] = [{ name: "+0.5σ", price: 81662, unit: 90 }, { name: "+1σ", price: 81707, unit: 90 }], Bk = new Map<string, "up" | "down">([["+1σ", "down"]]);
    if (!gateAllows(wallFor(W, Bk, 81696, "down"), 81696, "down")) bad++;  // +1 sigma broke down, still above: short allowed (the 1:36 AM case)
    if (gateAllows(wallFor(W, Bk, 81696, "up"), 81696, "up")) bad++;       // ...and the long under it refused
    const P2: Line[] = [{ name: "5m PP", price: 81675 }, { name: "+1σ", price: 81700, unit: 90 }], B2 = new Map<string, "up" | "down">([["5m PP", "down"]]);
    if (!gateAllows(wallFor(P2, B2, 81684, "down"), 81684, "down")) bad++; } // pink broke down, snapped back over: it can't block the short (12:46 case)
  { const T: Line[] = [{ name: "5m PP", price: 81689 }], U: Line[] = [{ name: "5m PP", price: 81660 }];
    if (!crossToTarget("btc", T, 81700, "down", 81669)) bad++;     // short at 81,700, pink 81,689 between it and the 81,669 target -> refused
    if (!crossToTarget("btc", U, 81650, "up", 81669)) bad++;       // long at 81,650, pink 81,660 between -> refused
    if (crossToTarget("btc", T, 81669.5, "up", 81669)) bad++;      // the 1:45 AM long: already at/past the target -> ok
    if (crossToTarget("btc", T, 81640, "up", 81669)) bad++;        // pink above the target, nothing between -> ok
    if (crossToTarget("btc", U, 81650, "down", 81669)) bad++;      // short already under the target -> ok
    if (!crossToTarget("btc", T, 81650, "up", 0)) bad++;           // no window-open price -> can't verify
    if (crossToTarget("btc", wallFor(U, new Map<string, "up" | "down">([["5m PP", "up"]]), 81655, "up"), 81655, "up", 81669)) bad++; } // pink broken up, no close back: not a wall -> ok
  if (Math.abs(chartTarget(81580, 81700 - 81640, 30) - 81670) > 0.001) bad++; // strike 81,580, index 81,640, Vantage 81,700 -> 81,670 on her chart
  { const T: Line[] = [{ name: "5m PP", price: 81690 }], U: Line[] = [{ name: "5m PP", price: 81665 }];
    if (crossToTarget("btc", T, 81700, "up", chartTarget(81580, 60, 30))) bad++;   // pink 81,690, long at 81,700: past 81,670 -> ok
    if (!crossToTarget("btc", U, 81660, "up", chartTarget(81580, 60, 30))) bad++; } // pink 81,665 between a long at 81,660 and the 81,670 target -> refused
  { const W2: Line[] = [{ name: "-2σ", price: 81292, unit: 128 }, { name: "5m PP", price: 81270 }];
    if (!atSessionBand("btc", W2, 81293)) bad++;   // the 10:31 AM long: $1 over -2 sigma -> wait
    if (!atSessionBand("btc", W2, 81288)) bad++;   // $4 under it -> wait
    if (atSessionBand("btc", W2, 81301)) bad++;    // $9 through -> the break, free
    if (atSessionBand("btc", W2, 81283)) bad++;    // pulled $9 back -> the rejection, free (closest band now decides the side)
    if (atSessionBand("btc", [{ name: "5m PP", price: 81270 }, { name: "-2σ", price: 81320, unit: 128 }], 81272)) bad++; // pink closest, not a session band -> this rule stays out
    if (!atSessionBand("gold", [{ name: "+1σ", price: 4165 }], 4165.3)) bad++;  // gold $0.30 off +1 sigma -> wait (50c break)
    if (atSessionBand("gold", [{ name: "+1σ", price: 4165 }], 4165.6)) bad++;   // gold $0.60 through -> free (50c break)
    if (atSessionBand("gold", [{ name: "+1σ", price: 4165 }], 4166.2)) bad++; } // gold $1.20 through -> free
  { const W3: Line[] = [{ name: "5m PP", price: 81526.19 }, { name: "session VWAP", price: 81558.05, unit: 130 }, { name: "-0.5σ", price: 81492.89, unit: 130 }];
    if (!sessionAheadWait("btc", W3, 81528.73, "up")) bad++;  // the 12:03 PM long: VWAP $29 ahead < -0.5 sigma $36 behind -> wait
    if (!sessionAheadWait("btc", W3, 81524, "down")) bad++;   // mirror: under the pink, -0.5 sigma $31 ahead < VWAP $34 behind -> wait
    if (sessionAheadWait("btc", W3, 81512, "up")) bad++;      // bounce off the pink with -0.5 sigma $19 behind, VWAP $46 ahead -> free
    if (sessionAheadWait("btc", W3, 81552, "down")) bad++; }  // closest wall is VWAP, not the pink -> this rule stays out
  { const PK: Line[] = [{ name: "5m PP", price: 81592.37 }];
    if (!pinkRejectAgainst("btc", PK, 81612.34, "down", { h: 81612.34, l: 81594.4 })) bad++; // the 1:01 PM short: tapped the pink, $20 up -> refused
    if (pinkRejectAgainst("btc", PK, 81612.34, "up", { h: 81612.34, l: 81594.4 })) bad++;    // the long with the rejection -> this rule stays out
    if (pinkRejectAgainst("btc", PK, 81597, "down", { h: 81598, l: 81593 })) bad++;          // only $4.63 up -> not a rejection yet
    if (pinkRejectAgainst("btc", PK, 81612, "down", { h: 81612, l: 81605 })) bad++;          // never came within $2 of the pink -> no tap
    if (pinkRejectAgainst("btc", PK, 81612, "down", { h: 81612, l: 81580 })) bad++;          // punched $12 under = a break, not a rejection
    if (!pinkRejectAgainst("btc", PK, 81570, "up", { h: 81591, l: 81570 })) bad++;           // mirror: tapped from below, $22 down -> no long
    if (!pinkRejectAgainst("gold", [{ name: "5m PP", price: 4165 }], 4166.3, "down", { h: 4166.3, l: 4165.1 })) bad++;
    if (!pinkRejectAgainst("btc", [{ name: "+0.5σ", price: 81622 }], 81605, "up", { h: 81621, l: 81605 })) bad++; } // session band: tapped +0.5 sigma from below, $17 down -> no long // gold tap $0.10, $1.30 up -> no short
  { const PW: Line[] = [{ name: "5m PP", price: 81606.6 }, { name: "+0.5σ", price: 81622.34, unit: 128 }, { name: "session VWAP", price: 81558.52, unit: 128 }];
    if (!atPink("btc", PW, 81602.76)) bad++;   // $3.84 under the pink -> wait ($8 pink wait, Oct 18 3:31 PM)
    if (!atPink("btc", [{ name: "5m PP", price: 81517.24 }, { name: "-0.5σ", price: 81492.61, unit: 128 }], 81522.5)) bad++; // $5.26 over -> wait
    if (!atPink("btc", PW, 81601.1)) bad++; /* $5.50 under -> still waiting ($6 break, Oct 19) */    // $6.70 under -> still waiting
    if (atPink("btc", PW, 81598)) bad++;       // $8.60 under -> broke: free
    if (atPink("btc", PW, 81618)) bad++;       // closest wall is +0.5 sigma, not the pink -> this rule stays out
    if (!atPink("gold", [{ name: "5m PP", price: 4165 }], 4165.3)) bad++;  // gold $0.30 -> wait (50c pink break)
    if (atPink("gold", [{ name: "5m PP", price: 4165 }], 4165.6)) bad++; } // gold $0.60 -> free
  { const Z2 = { pp: 81616.09, r1: 81644.15, r2: 81672.22, s1: 81588.03, s2: 81559.96 }, S2: Line[] = [{ name: "+0.5σ", price: 81622.65 }];
    if (!zoneGate("btc", S2, 81636.7, "up", { zones: Z2, open: 81628.81, vol: { cur: 0.88, avg: 1, frac: 1 } })) bad++; // the 1:34 PM long: R1 $7.45 above, 0.9x -> refused on BTC now
    if (zoneGate("btc", S2, 81636.7, "up", { zones: Z2, open: 81628.81, vol: { cur: 2.5, avg: 1, frac: 1 } })) bad++;  // same with a 2.5x push -> allowed
    if (!pinkRejectAgainst("btc", [{ name: "5m R1", price: 81644.15 }], 81626, "up", { h: 81643.79, l: 81626 })) bad++; } // tapped the red, $18 back down -> no long
  { const ss0 = 1000000000000, ss1 = ss0 + 86400000, c: any = {};
    sessCarryPick(c, ss0, 81564, 130);                                   // yesterday's session ends at VWAP 81,564 / sigma 130
    let r = sessCarryPick(c, ss1, 0, 0); if (!r.carried || r.v !== 81564) bad++;      // reset, no new bands yet -> carried
    r = sessCarryPick(c, ss1, 81300, 40); if (!r.carried || r.sd !== 130) bad++;       // new sigma 40 < 65 (50%) -> still carried
    r = sessCarryPick(c, ss1, 81320, 70); if (r.carried || r.sd !== 70) bad++;         // new sigma 70 >= 65 -> the new session's bands
    r = sessCarryPick({}, ss1, 0, 0); if (r.carried || r.v !== 0) bad++; }             // nothing to carry and no bands -> empty (gate refuses)
  { const Q4: Line[] = [{ name: "-1σ", price: 81000 }, { name: "+1σ", price: 81100 }];
    if (!quarterAllows(Q4, 81060, "up").ok) bad++;   // 60% up the gap -> long allowed (closest-band used to refuse this)
    if (quarterAllows(Q4, 81080, "up").ok) bad++;    // top 25% (80%) -> long refused
    if (!quarterAllows(Q4, 81040, "down").ok) bad++; // 40% -> short allowed
    if (quarterAllows(Q4, 81020, "down").ok) bad++;  // bottom 25% -> short refused
    if (!quarterAllows([{ name: "+1σ", price: 81100 }], 81090, "up").ok) bad++; // nothing below to measure -> no refusal from this rule
    if (!pinkInFront("btc", [{ name: "session VWAP", price: 200, unit: 100 }, { name: "+1σ", price: 225, unit: 100 }], 200.5, "up", 0, 0.30)) bad++; } // 30% twin: +1σ $24.50 above, room $30 -> refused
  { const Z3 = { pp: 81280, r1: 81352, r2: 81424, s1: 81208, s2: 81136 }, S3: Line[] = [{ name: "+1σ", price: 81389 }];
    if (zoneGate("btc", S3, 81380, "up", { zones: Z3, open: 81304, vol: { cur: 0, avg: 1, frac: 0.1 } })) bad++;  // the 3:40 PM rip: $76 up from the open (>= $72 range), volume 0 -> push, allowed
    if (!zoneGate("btc", S3, 81340, "up", { zones: Z3, open: 81304, vol: { cur: 0.3, avg: 1, frac: 1 } })) bad++; } // only $36 up, weak volume -> still refused
  { const PK2: Line[] = [{ name: "5m PP", price: 81326 }], mem: any = {};
    rejUpdate("btc", PK2, 81345, { h: 81345, l: 81327 }, mem, 1000);          // 4:40 PM: tapped the pink ($1 over), $19 up -> remembered
    if (!rejCarryAgainst("btc", PK2, 81345, "down", mem)) bad++;              // 4:45 PM new candle, short $19 over the pink -> still refused
    if (rejCarryAgainst("btc", PK2, 81352, "down", mem)) bad++;               // BLOCK RANGE: $26 over the pink -> too far to block (Oct 18 ~1:00 PM PT)
    if (rejCarryAgainst("btc", PK2, 81352, "up", mem)) bad++;                 // the long with it -> fine
    rejUpdate("btc", PK2, 81327.5, null, mem, 2000);                          // price comes back to the pink -> cleared
    if (rejCarryAgainst("btc", PK2, 81340, "down", mem)) bad++; }             // short allowed again
  { const PK3: Line[] = [{ name: "5m PP", price: 80956.88 }], m3: any = { "5m PP": { dir: "down", at: Date.now(), price: 80956.88 } };
    if (rejCarryAgainst("btc", PK3, 80870, "up", m3)) bad++;                   // Oct 18 12:47 PM: pink $87 overhead -> long not blocked
    if (!rejCarryAgainst("btc", PK3, 80940, "up", m3)) bad++;                  // pink $17 overhead -> still no long into it
    const G3: Line[] = [{ name: "-2σ", price: 80755.47 }, { name: "5m PP", price: 80956.88 }];
    const n3 = nearSide(G3, 80870); if (!n3 || n3.side !== "down" || inReach("btc", n3.band.price, 80870)) bad++; // closest is the pink, $87 away -> out of reach
    if (!inReach("btc", 80956.88, 80940) || !inReach("gold", 4000, 4002.2) || inReach("gold", 4000, 4002.3)) bad++; }
  { // HER RULE, today's trades (Oct 18): bands as the desk saw them
    const T: Line[] = [{ name: "session VWAP", price: 81445.69 }, { name: "-1σ", price: 81060.83 }, { name: "-2σ", price: 80675.96 }, { name: "-3σ", price: 80300 }, { name: "5m PP", price: 80895.97 }, { name: "5m R1", price: 80990 }, { name: "5m S1", price: 80800 }];
    const nowS = 1792356785, none = new Map<string, "up" | "down">();
    const pinkUp = new Map<string, "up" | "down">([["5m PP", "up"]]), oldBreak = { "5m PP": { side: "up", at: nowS - 1800 } }, newBreak = { "5m PP": { side: "up", at: nowS - 20 } };
    if (awayVerdict("btc", T, 80925.51, "up", pinkUp, { nowS, st: oldBreak })) bad++;       // 1:33 PM: 65% up the channel, -1σ $135 above = not an obstacle -> long ok (top-20% rule, Oct 18 ~8:04 PM PT)
    if (!awayVerdict("btc", T, 81040, "up", pinkUp, { nowS, st: oldBreak })) bad++;         // -1σ $21 above, closer than -2σ -> no long
    if (awayVerdict("btc", T, 80925.51, "down", pinkUp, { nowS, st: oldBreak })) bad++;     // ...the short is fine (away from -1σ)
    if (!awayVerdict("btc", T, 81045, "up", pinkUp, { nowS, st: newBreak })) bad++;         // -1σ $16 above -> no long
    if (!awayVerdict("btc", T, 80995.68, "up", new Map([["5m R1", "up"]]), { nowS, st: { "5m R1": { side: "up", at: nowS - 20 } } })) bad++; // -1σ $65 above, closer than -2σ -> no long (any distance)
    const BB: Line[] = [{ name: "5m BBSR upper", price: 81026.63 }, { name: "5m BBSR lower", price: 80781.53 }];
    if (!awayVerdict("btc", T, 81010, "up", none, { nowS, st: {} }, BB)) bad++;             // Bollinger book: top Bollinger $17 above -> no long
    if (awayVerdict("btc", T, 81010, "down", none, { nowS, st: {} }, BB)) bad++;            // ...short ok (away from it)
    if (awayVerdict("btc", T, 80790, "up", none, { nowS, st: {} }, BB)) bad++;              // near the bottom Bollinger -> long ok
    if (!awayVerdict("btc", T, 80790, "down", none, { nowS, st: {} }, BB)) bad++;           // ...no short into it
    const N: Line[] = [{ name: "-1σ", price: 81040 }, { name: "-2σ", price: 81000 }];
    // (Oct 18 ~11:48 PM PT) BTC now has the session-band range too ($25): in a $40 channel every spot is inside it -> both refused; zone % tested on a $400 channel
    if (!awayVerdict("btc", N, 81020.5, "down", none, { nowS, st: {} }) || !awayVerdict("btc", N, 81020.5, "up", none, { nowS, st: {} })) bad++;
    { const NW: Line[] = [{ name: "-1σ", price: 81600 }, { name: "-2σ", price: 81000 }]; // $600 wide (past $500 = 20%, fix59)
      if (awayVerdict("btc", NW, 81300, "up", none, { nowS, st: {} }) || awayVerdict("btc", NW, 81300, "down", none, { nowS, st: {} })) bad++;   // middle: both ok
      if (awayVerdict("btc", NW, 81450, "up", none, { nowS, st: {} }) || !awayVerdict("btc", NW, 81510, "up", none, { nowS, st: {} })) bad++;   // 75% ok; 85% = top 20% (default) -> no long
      if (awayVerdict("btc", NW, 81150, "down", none, { nowS, st: {} }) || !awayVerdict("btc", NW, 81090, "down", none, { nowS, st: {} })) bad++; // 25% ok; 15% -> no short
      if (!awayVerdict("btc", NW, 81580, "up", none, { nowS, st: {} })) bad++; } // -1σ $20 above, inside $25 -> no long
    const PK: Line[] = [{ name: "-1σ", price: 81100 }, { name: "-2σ", price: 80755 }, { name: "5m PP", price: 80770 }];
    if (!awayVerdict("btc", PK, 80760, "up", none, { nowS, st: {} })) bad++;               // pink $15 over -2σ, unbroken -> wait, no long
    if (awayVerdict("btc", PK, 80780, "up", new Map([["5m PP", "up"]]), { nowS, st: {} })) bad++; // pink broken up -> long ok
    if (!awayVerdict("gold", [{ name: "-1σ", price: 4120 }, { name: "-2σ", price: 4100 }, { name: "5m PP", price: 4102 }], 4100.5, "up", none, { nowS, st: {} })) bad++;   // gold: pink $2 over -2σ -> wait
    // PINK THEORY (paper twins): pink broke DOWN 1 candle ago, price rejected up off -2σ $5 below -> free for K=2; broke 3 candles ago -> not free for K=2, free for K=3
    const PT2: Line[] = [{ name: "-1σ", price: 81100 }, { name: "-2σ", price: 80755 }, { name: "5m PP", price: 80770 }], Bdn = new Map<string, "up" | "down">([["5m PP", "down"]]);
    const f0 = Math.floor(nowS / 300) * 300;
    if (!pinkRecentFree("btc", PT2, 80760, "up", Bdn, 2, { nowS, st: { "5m PP": { side: "down", at: f0 - 200 } } })) bad++;
    if (pinkRecentFree("btc", PT2, 80760, "up", Bdn, 2, { nowS, st: { "5m PP": { side: "down", at: f0 - 500 } } })) bad++;   // broke in the 3rd candle back -> not within 2
    if (!pinkRecentFree("btc", PT2, 80760, "up", Bdn, 3, { nowS, st: { "5m PP": { side: "down", at: f0 - 500 } } })) bad++;  // ...but within 3
    if (pinkRecentFree("btc", PT2, 80760, "up", Bdn, 3, { nowS, st: { "5m PP": { side: "down", at: f0 - 700 } } })) bad++;   // 4th candle back -> not within 3
    if (awayVerdict("btc", PT2, 80760, "up", Bdn, { nowS, st: {}, pinkFree: true })) bad++;  // free: the broken pink doesn't wall her long
    if (!awayVerdict("btc", PT2, 80760, "up", Bdn, { nowS, st: {} })) bad++;                // live books: still waits
    const T2: Line[] = [{ name: "-1σ", price: 81121.22 }, { name: "-2σ", price: 80755.47 }, { name: "5m PP", price: 80956.88 }];
    if (awayVerdict("btc", T2, 80870, "up", none, { nowS, st: {} })) bad++;                 // 12:47 PM: pink $87 away, bands far -> long ok
    if (!awayVerdict("btc", T2, 80940, "up", none, { nowS, st: {} })) bad++;                // pink unbroken $17 above -> no long into it
    if (!awayVerdict("btc", T2, 80770, "down", none, { nowS, st: {} })) bad++;              // -2σ $15 below -> no short into it
    const T3: Line[] = [{ name: "-1σ", price: 81084.73 }, { name: "-2σ", price: 80707.7 }, { name: "5m PP", price: 80890.83 }];
    if (awayVerdict("btc", T3, 80834.53, "up", new Map([["-2σ", "up"]]), { nowS, st: { "-2σ": { side: "up", at: nowS - 3000 } } })) bad++;
    // 5:01 PM gold: rejected down off +2σ with a 5m R1 price had climbed through $0.22 below
    const GR: Line[] = [{ name: "+2σ", price: 4187.3 }, { name: "+1σ", price: 4183 }, { name: "5m R1", price: 4186.8 }], r1Up = new Map<string, "up" | "down">([["5m R1", "up"]]);
    if (awayVerdict("gold", GR, 4187.02, "down", r1Up, { nowS, st: {}, sessRej: true })) bad++;   // session-band rejection: the broken R1 doesn't block
    if (!awayVerdict("gold", GR, 4187.02, "down", r1Up, { nowS, st: {} })) bad++;                 // not a session-band rejection: R1 still walls it
    if (!awayVerdict("gold", GR, 4187.02, "down", none, { nowS, st: {}, sessRej: true })) bad++;  // unbroken R1 still walls it
    // 7:30 PM BTC: +1σ $56 above, VWAP $425 below -> top of the channel: no long, short ok; the bottom Bollinger $58 below doesn't move the middle
    const B730: Line[] = [{ name: "+1σ", price: 82354.44 }, { name: "session VWAP", price: 81873.19 }, { name: "5m PP", price: 82346.02 }], BBL: Line[] = [{ name: "5m BBSR upper", price: 82497.75 }, { name: "5m BBSR lower", price: 82240.55 }];
    if (!awayVerdict("btc", B730, 82298, "up", none, { nowS, st: {} }, BBL) || !awayVerdict("btc", B730, 82298, "up", none, { nowS, st: {} })) bad++;
    if (awayVerdict("btc", [{ name: "+1σ", price: 82354.44 }, { name: "session VWAP", price: 81873.19 }], 82298, "down", none, { nowS, st: {} })) bad++;
    // 7:30 PM gold: opened under the pink, spiked over it, fell back $2 under it -> latest break is DOWN: no long; back up through it -> long ok
    const G730: Line[] = [{ name: "5m PP", price: 4174.43 }, { name: "-1σ", price: 4170.86 }];
    const tr730 = [{ t: 1, c: 4171.5 }, { t: 2, c: 4174.0 }, { t: 3, c: 4174.95 }, { t: 4, c: 4173.8 }, { t: 5, c: 4172.36 }];
    if (!candleBreakAgainst("gold", G730, 4172.4, "up", 4170.65, null, tr730) || !candleBreakAgainst("gold", G730, 4172.4, "down", 4170.65, null, tr730)) bad++; // (Oct 19 ~12:38 PM PT, pink stays broken like the session bands) broke the pink UP, fell back under it: no long until it turns back up, never a short this candle
    if (candleBreakAgainst("gold", G730, 4175.0, "up", 4170.65, null, [...tr730, { t: 6, c: 4175.0 }]) || !candleBreakAgainst("gold", G730, 4175.0, "down", 4170.65, null, [...tr730, { t: 6, c: 4175.0 }])) bad++; // then 57c back over it = last break UP: long open, no short
    // 10:50 PM gold: up through +2σ, then back down 40c through it -> last break DOWN: short open, no long; a 20c hover back over it doesn't flip it
    { const P250: Line[] = [{ name: "+2σ", price: 4185.38 }], T250 = [{ t: 1, c: 4184.1 }, { t: 2, c: 4185.75 }, { t: 3, c: 4184.98 }];
      // (Oct 18 ~11:21 PM PT) a SESSION band broken up stays broken inside the candle that broke it: back under it 40c is not a break down -> still no short, long ok
      if (!candleBreakAgainst("gold", P250, 4184.98, "down", 4184.1, null, T250) || !candleBreakAgainst("gold", P250, 4184.98, "up", 4184.1, null, T250)) bad++; // no short (it broke up); no long yet (still at its low under the band)
      if (candleBreakAgainst("gold", P250, 4185.58, "up", 4184.1, null, [...T250, { t: 4, c: 4185.58 }])) bad++; }
    { const D1 = [{ t: 1, c: 100.8 }, { t: 2, c: 99.6 }, { t: 3, c: 100.2 }]; if (!candleBreakAgainst("gold", [{ name: "5m PP", price: 100 }], 100.2, "up", 101, null, D1) || !candleBreakAgainst("gold", [{ name: "5m PP", price: 100 }], 100.2, "down", 101, null, D1)) bad++; } // broke the pink down, hovering back above it: no long; short once it turns back down (pink stays broken, Oct 19)
    // BREAK ENTRY: gold broke down $0.71 through the pink, now 20c under it (closer to the pink above than -1σ below) -> short; snapped back over it -> nothing
    const BE: Line[] = [{ name: "5m PP", price: 4178.41 }, { name: "+1σ", price: 4180.05 }, { name: "session VWAP", price: 4175.7 }];
    const be1 = breakEntry("gold", BE, 4178.21, 4179.2, null, [{ t: 1, c: 4178.9 }, { t: 2, c: 4177.7 }, { t: 3, c: 4178.21 }]);
    if (!be1 || be1.side !== "down" || be1.band.name !== "5m PP") bad++;
    { const bk = breakEntry("gold", BE, 4178.82, 4179.2, null, [{ t: 1, c: 4178.9 }, { t: 2, c: 4177.7 }, { t: 3, c: 4178.82 }]); if (bk && bk.side === "up") bad++; }  // down through the pink, then 41c back over it: the pink stays broken DOWN for the candle (Oct 19 ~12:38 PM PT) -> never a long entry
    // broke the pink down, flipped up and broke the band ABOVE (+1σ) -> the last break applies: long open, short refused, long entry
    { const P2: Line[] = [{ name: "5m PP", price: 100 }, { name: "+1σ", price: 101 }], T2 = [{ t: 1, c: 99.6 }, { t: 2, c: 100.4 }, { t: 3, c: 101.4 }];
      if (candleBreakAgainst("gold", P2, 101.4, "up", 100.5, null, T2) || !candleBreakAgainst("gold", P2, 101.4, "down", 100.5, null, T2)) bad++;
      const e2 = breakEntry("gold", [...P2, { name: "+2σ", price: 104 }], 101.4, 100.5, null, T2); if (!e2 || e2.side !== "up" || e2.band.name !== "+1σ") bad++; }
    if (breakEntry("gold", BE, 4178.6, 4179.2, null, [{ t: 1, c: 4178.9 }, { t: 2, c: 4177.7 }, { t: 3, c: 4178.6 }])) bad++;  // back over the pink by only 19c: no new break, and closer to the pink below -> no short
    if (breakEntry("gold", BE, 4176.4, 4179.2, null, [{ t: 1, c: 4177.7 }, { t: 2, c: 4176.4 }])) bad++;                        // closer to the VWAP below than the pink above -> no short
    const be2 = breakEntry("gold", BE, 4180.7, 4179.5, null, [{ t: 1, c: 4180.2 }, { t: 2, c: 4180.6 }, { t: 3, c: 4180.7 }]);
    if (!be2 || be2.side !== "up" || be2.band.name !== "+1σ") bad++;
    // BTC: broke down $12 through the VWAP, still closer to it than the band below -> short; broke up $10 through +1σ -> long
    const BB2: Line[] = [{ name: "session VWAP", price: 82000 }, { name: "-1σ", price: 81600 }, { name: "+1σ", price: 82400 }];
    const b3 = breakEntry("btc", BB2, 81990, 82020, null, [{ t: 1, c: 82005 }, { t: 2, c: 81988 }, { t: 3, c: 81990 }]), b4 = breakEntry("btc", BB2, 82410, 82380, null, [{ t: 1, c: 82395 }, { t: 2, c: 82410 }]);
    if (!b3 || b3.side !== "down" || !b4 || b4.side !== "up") bad++;
    // 9:33 PM gold: broke up through the VWAP and the pink, tapped +1σ (26c over, no 33c break) and fell back 46c -> short off +1σ allowed; still under it by
    // only 10c -> no rejection yet; broke +1σ by 40c -> that's a break, no short
    { const N933: Line[] = [{ name: "session VWAP", price: 4176.03 }, { name: "5m PP", price: 4177.03 }, { name: "+1σ", price: 4180.25 }, { name: "+2σ", price: 4184.5 }];
      const t933 = [{ t: 1, c: 4175.2 }, { t: 2, c: 4176.5 }, { t: 3, c: 4177.5 }, { t: 4, c: 4179.6 }, { t: 5, c: 4180.51 }, { t: 6, c: 4179.79 }];
      const nr1 = nextBandReject("gold", N933, 4179.79, 4174.8, null, t933);
      if (!nr1 || nr1.side !== "down" || nr1.band.name !== "+1σ" || candleBreakAgainst("gold", N933, 4179.79, "down", 4174.8, null, t933)) bad++;
      if (nextBandReject("gold", N933, 4180.15, 4174.8, null, [...t933.slice(0, 5), { t: 6, c: 4180.15 }])) bad++;
      if (nextBandReject("gold", N933, 4179.79, 4174.8, null, [...t933.slice(0, 4), { t: 5, c: 4180.65 }, { t: 6, c: 4179.79 }])) bad++; }
    // NEAR TAP (add-ons): gold came within $1.20 of +1σ (no break), pushed down 40c off the high and 33c+ under the band -> short add-on; only 10c off the high -> not yet
    { const NT: Line[] = [{ name: "+1σ", price: 4180 }, { name: "session VWAP", price: 4174 }];
      if (!nearReject("gold", NT, 4178.4, "down", { h: 4178.8, l: 4177 }) || nearReject("gold", NT, 4178.7, "down", { h: 4178.8, l: 4177 }) || nearReject("gold", NT, 4178.4, "up", { h: 4178.8, l: 4177 })) bad++; }
    // 10:00 PM gold: +2σ $1.30 above (70% of the channel) -> no long (gold range covers session bands); $2.50 above -> long ok
    { const G10: Line[] = [{ name: "+1σ", price: 4180.65 }, { name: "+2σ", price: 4184.95 }];
      if (!awayVerdict("gold", G10, 4183.65, "up", none, { nowS, st: {} }) || awayVerdict("gold", G10, 4182.45, "up", none, { nowS, st: {} })) bad++; }
    // 11:00 PM gold: candle open 4184.56, falling to 4183.12 at its low -> no long; bounced 40c off a 4182.70 low -> long ok; mirror for shorts
    { const P11: Line[] = [{ name: "5m PP", price: 4182.64 }];
      if (!candleBreakAgainst("gold", P11, 4183.12, "up", 4184.56, null, [{ t: 1, c: 4184.3 }, { t: 2, c: 4183.6 }, { t: 3, c: 4183.12 }])) bad++;
      if (candleBreakAgainst("gold", P11, 4183.1, "up", 4184.56, null, [{ t: 1, c: 4184.3 }, { t: 2, c: 4182.7 }, { t: 3, c: 4183.1 }])) bad++;
      if (!candleBreakAgainst("gold", [{ name: "5m PP", price: 4190 }], 4185.9, "down", 4184.5, null, [{ t: 1, c: 4185.0 }, { t: 2, c: 4185.9 }])) bad++;
      if (candleBreakAgainst("gold", P11, 4184.4, "up", 4184.56, null, [{ t: 1, c: 4184.4 }])) bad++; } // 16c under the open = not falling yet
    // falling from the top third: channel 4181.27-4185.66, open 4184.56 (75%), falling to 4183.12 -> no long; bounced 40c off 4182.80 -> long ok; rising off the bottom third -> no short
    { const C11: Line[] = [{ name: "+1σ", price: 4181.27 }, { name: "+2σ", price: 4185.66 }];
      if (!awayVerdict("gold", C11, 4183.12, "up", none, { nowS, st: {}, open: 4184.56, trail: [{ t: 1, c: 4184.2 }, { t: 2, c: 4183.12 }] })) bad++;
      if (awayVerdict("gold", C11, 4183.2, "up", none, { nowS, st: {}, open: 4184.56, trail: [{ t: 1, c: 4182.8 }, { t: 2, c: 4183.2 }] })) bad++;
      if (!awayVerdict("gold", C11, 4183.0, "down", none, { nowS, st: {}, open: 4181.6, trail: [{ t: 1, c: 4181.5 }, { t: 2, c: 4183.0 }] })) bad++;
      if (awayVerdict("gold", C11, 4183.12, "up", none, { nowS, st: {}, open: 4183.4, trail: [{ t: 1, c: 4183.12 }] })) bad++; } // high only 49% up the channel -> not from the top third
    // session band broken this candle stays broken: opened 4180.90 under +1σ, broke it to 4181.80, dipped back to 4180.80, rising at 4181.10 -> long ok
    // (no break DOWN counted, +1σ not a wall); the pink keeps flipping on a re-cross
    { const SB: Line[] = [{ name: "session VWAP", price: 4176.9 }, { name: "+1σ", price: 4181.27 }, { name: "+2σ", price: 4185.66 }];
      const tSB = [{ t: 1, c: 4181.0 }, { t: 2, c: 4181.8 }, { t: 3, c: 4180.8 }, { t: 4, c: 4181.15 }];
      if (candleBreakAgainst("gold", SB, 4181.15, "up", 4180.9, null, tSB) || awayVerdict("gold", SB, 4181.15, "up", none, { nowS, st: {}, open: 4180.9, trail: tSB })) bad++; // turned up 35c off its low
      if (!awayVerdict("gold", SB, 4185.2, "up", none, { nowS, st: {}, open: 4184.9, trail: [{ t: 1, c: 4185.0 }, { t: 2, c: 4185.2 }] })) bad++; // never broke +2σ: top of the channel, no long
      if (!candleBreakAgainst("gold", SB, 4180.85, "up", 4180.9, null, [{ t: 1, c: 4181.0 }, { t: 2, c: 4181.8 }, { t: 3, c: 4180.8 }, { t: 4, c: 4180.85 }])) bad++; // back under +1σ, still at its low: wait
      const PK: Line[] = [{ name: "5m PP", price: 100 }], tPK = [{ t: 1, c: 100.5 }, { t: 2, c: 99.5 }];
      if (!candleBreakAgainst("gold", PK, 99.5, "up", 99.8, null, tPK)) bad++; } // the pink: up then back down 50c -> last break down, no long
    if (!isZoneLine({ name: "5m R1", price: 1 }) || !isZoneLine({ name: "15m S2", price: 1 }) || isZoneLine({ name: "5m PP", price: 1 }) || isZoneLine({ name: "+1σ", price: 1 })) bad++;
    if (!candleBreakAgainst("btc", BB2, 81990, "up", 82020, null, [{ t: 1, c: 82005 }, { t: 2, c: 81988 }]) || candleBreakAgainst("btc", BB2, 81990, "down", 82020, null, [{ t: 1, c: 82005 }, { t: 2, c: 81988 }])) bad++; // broke down: short open, long refused
    if (!isSessRej({ band: { name: "+2σ" }, kind: "red-reject", from: "rejection" }) || isSessRej({ band: { name: "5m R1" }, from: "rejection" }) || isSessRej({ band: { name: "+2σ" }, label: "Broke up through +2σ" })) bad++; } // 1:15 PM: broke up thru -2σ, now $127 below = closest -> long ok
  G.__bandLawBroken = bad > 0;
  try { writeFileSync(D("band-lock-selftest.json"), JSON.stringify({ at: new Date().toISOString(), scenarios: n, calls, intoUnbrokenBand: bad, ok: bad === 0, zoneGate: "into-vs-away v2 (12 cases), gold only; BTC walls = session + pink; 1.28x road; break-in-charge this candle $25, no tap exception (6 cases); break depth $8 btc / $1 gold (4 cases); broken wall until a close back (5m pivots / 1m session), only in front of the break (7 cases); no band between price and the target (7 cases); target = Kalshi strike + live Vantage-INDEX gap + $30 (3 cases); at the session band within $8 btc / $1 gold = wait (7 cases); session band ahead of the pink closer than behind = wait (4 cases); no trade against a pink/session-band rejection this candle (8 cases); a pink break needs $6 btc / $0.75 gold (6 cases); red/green zone rule on BTC too + red/green rejections (3 cases); carry-over session bands to 50% sigma + never blind (4 cases); 25% rule replaces closest band, room only on the 15%/30% twins (6 cases); a big fast candle is a push (off with the zones); session-ahead wait retired; closest band back; rejection holds until price returns (3 cases); red/green zones back on, off only for the session-only book; no rejection hold on the session-only book; no $6 pink wait on BTC; add-on = $3 tap rejection" }, null, 1)); } catch {}
  return bad;
}

/** PAPER DNA (Oct 16 ~1:12 PM PT, Love: "0 OF OUR BOOKS ARE TO NOT HAVE THAT INCLUDED IN THEIR DNA. NEVER AGAIN. STAPLE THAT
 * SHUT AND BURY IT."): every paper book's NEW trade (open, booked in the last 2 min, not yet checked on this side) on gold
 * (incl. micro gold) or BTC must be on the closest band's side right now, or it is not recorded - the book books again on a
 * later pass if it still wants to. Can't verify (no fresh price / band list) = not recorded. Drops -> data/band-lock.jsonl. */
export function paperBandFilter<T>(rows: T[], tag: string): T[] {
  const seen: Map<string, string> = (G.__bandSeen ||= new Map());
  const now = Date.now();
  const out: T[] = [];
  for (const r0 of rows as any[]) {
    const r = r0 as any;
    if (!r || typeof r !== "object") { out.push(r0); continue; }
    const id = String(r.id ?? ""), side = String(r.side ?? ""), at = Date.parse(String(r.at ?? ""));
    const open = r.result === undefined || r.result === null || r.result === "open";
    if (!id || !(side === "up" || side === "down") || !open || !(now - at < 120000) || seen.get(id) === side) { out.push(r0); continue; }
    if (RECON.has(String(r.lane ?? r.book ?? ""))) { // RECONSTRUCTED: the Oct 12 rules (recon.ts) + her 33% channel rule (Oct 19 ~6:33 PM PT), nothing else
      const a1 = String(r.asset ?? "").toLowerCase(); const lbR = G.__lawBands?.[a1]; const qR = quoteTick(a1);
      let whyR = "";
      if (!lbR || !Array.isArray(lbR.L) || !lbR.L.length || now - Number(lbR.at) > 15000) whyR = "can't verify the channel (band list not fresh)";
      else if (!qR || !(qR.c > 0) || now - qR.at > 3000) whyR = "can't verify (no fresh price)";
      else if (String(r.lane ?? r.book ?? "") === "recon-dly" && dlyFreeNow(a1)) whyR = dlyThirds(a1, lbR.L, qR.c, side); /* fix307 */ // THE DELAYED BOOK in her off hours (Love, Oct 21 ~10:59 AM PT) - free but for her 33% + top/bottom line (11:21 AM)
      else whyR = impossibleGeo(a1, lbR.L, qR.c, side, false, String(r.lane ?? r.book ?? "") === "recon-dly" && !DLY_AS_COPY, String(r.lane ?? r.book ?? "") === "recon-togp" || (DLY_AS_COPY && String(r.lane ?? r.book ?? "") === "recon-dly") /* fix353 */ || String(r.lane ?? r.book ?? "") === "recon-dlyk" /* fix354 */ || String(r.lane ?? r.book ?? "") === "recon-np" /* fix361 */, String(r.lane ?? r.book ?? "") === "recon-rej", String(r.lane ?? r.book ?? "") === "recon-rej" || String(r.lane ?? r.book ?? "") === "recon-tog", (String(r.lane ?? r.book ?? "") === "recon-tog" || String(r.lane ?? r.book ?? "") === "recon-rej" /* fix324 */) ? 0.4 : 0, (String(r.lane ?? r.book ?? "") === "recon-tog" || String(r.lane ?? r.book ?? "") === "recon-rej") ? true : false).why || channelOnly(a1, lbR.L, qR.c, side, refreshBroken(a1, lbR.L, qR.c)) || candleDirOnly(a1, lbR.L, qR.c, side) || reconZoneGate(a1, qR.c, side) || reconThirdAgainst(a1, lbR.L, qR.c, side, refreshBroken(a1, lbR.L, qR.c)) || thirdWallAbsolute(a1, lbR.L, qR.c, side, refreshBroken(a1, lbR.L, qR.c)); // zones 12:22 AM; third wall 1:32 AM; THE WALL 8:05 AM ("make it impossible. no excuses")
      if (!whyR) { seen.set(id, side); out.push(r0); continue; }
      seen.set(id, side);
      try { appendFileSync(D("band-lock.jsonl"), JSON.stringify({ at: new Date().toISOString(), paper: "recon", id, book: String(r.lane ?? r.book ?? ""), asset: a1, side, reason: whyR, tick: qR?.c ?? null }) + "\n"); } catch {}
      continue;
    }
    const a0 = String(r.asset ?? "").toLowerCase();
    const asset = a0 === "mgold" ? "gold" : a0;
    // INVERSE TEST (Oct 16 ~4:19 PM PT): while live-switch.invTest4pm is set the inverse's paper row is kept too (it is the
    // twin's call mirrored, so the band rules always drop it) - otherwise the copier has nothing to send for her test.
    if (String(r.lane ?? r.book ?? "") === "ogp5-inv") { try { if (JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.invTest4pm) { seen.set(id, side); out.push(r0); continue; } } catch {} }
    if (!(asset === "gold" || asset === "btc")) { out.push(r0); continue; }
    const lb = G.__lawBands?.[asset];
    const q = quoteTick(asset);
    let why = "";
    if (G.__bandLawBroken) why = "band law failed its self-test";
    else if (!lb || !Array.isArray(lb.L) || !lb.L.length || now - Number(lb.at) > 15000) why = "can't verify (band list not fresh)";
    else if (!q || !(q.c > 0) || now - q.at > 3000) why = "can't verify (no fresh price)";
    else if (!lb.L.some((l: Line) => /σ$|^session VWAP$|^BB (upper|lower)$/.test(String(l.name)))) why = "can't verify (no session bands on her list)";
    else if (r.band && Number(r.band.price) > 0) { const zc = Number(r.goldLaw?.ceil), zf = Number(r.goldLaw?.floor); const bp = side === "down" && zc > 0 ? zc : side === "up" && zf > 0 ? zf : Number(r.band.price); if (!sideOfBandOk(bp, q.c, side)) why = `${side === "up" ? "long" : "short"} on the wrong side of ${r.band.name} (its setup band)`; }
    // ALL HER BREAKS GO THROUGH (Oct 19 ~3:19 PM PT, Love: "all the breaks are good bb all of them let em thru" + "the green zone was far away"):
    // the session + pink book's paper calls skip every band rule here - only a can't-verify (stale bands / no fresh price / self-test) holds one.
    // ONE RULEBOOK (Oct 19 ~5:25 PM PT, Love: "yes pls"): the break must be in this 5m candle, THEN every band rule below, same as SESSION ONLY.
    if (PASS_THRU.has(String(r.lane ?? r.book ?? "")) && !why) { const cdA = lb && Array.isArray(lb.L) && q && q.c > 0 ? candleDirAgainst(asset, wallLines(asset, lb.L), q.c, side) : ""; if (cdA) why = cdA; }
    // PINK THEORY twins (paper only): a pink broken within K candles is not a wall for a trade off the session band behind her
    const pkK = PINK_RECENT[String(r.lane ?? r.book ?? "")] || 0;
    const pkFree = !!(pkK && lb && Array.isArray(lb.L) && q && q.c > 0 && pinkRecentFree(asset, lb.L, q.c, side, refreshBroken(asset, lb.L, q.c), pkK));
    const WL = (L0: Line[]) => (pkFree ? noPink(L0) : L0);
    // CLOSEST BAND DECIDES on paper too (Oct 16 ~10:30 PM PT, Love) - the setup band no longer skips it.
    if (!why && lb && Array.isArray(lb.L) && lb.L.length && q && q.c > 0) { const BkP = refreshBroken(asset, lb.L, q.c); const ns = nearSide(wallFor(wallLines(asset, lb.L), BkP, q.c, side), q.c); if (!ns) why = "can't verify"; else why = awayVerdict(asset, lb.L, q.c, side, BkP, { pinkFree: pkFree, sessRej: isSessRej(r) }, BB_BOOKS.has(String(r.lane ?? r.book ?? "")) ? bbLines(asset) : []); } if (WALL_FREE.has(String(r.lane ?? r.book ?? "")) && /^would (long|short) INTO /.test(why)) why = "";
    if (!why && lb && Array.isArray(lb.L) && lb.L.length && q && q.c > 0) why = thirdWallAbsolute(asset, lb.L, q.c, side, refreshBroken(asset, lb.L, q.c)); // THE WALL - nothing strips it (Oct 20 ~8:05 AM PT, Love)
    if (!why && lb && Array.isArray(lb.L) && q && q.c > 0) why = candleBreakAgainst(asset, wallLines(asset, lb.L), q.c, side) || sessionBreakPinkHold(asset, lb.L, q.c, side) || (ROOM_TWIN[String(r.lane ?? r.book ?? "")] ? pinkInFront(asset, wallFor(wallLines(asset, lb.L), refreshBroken(asset, lb.L, q.c), q.c, side), q.c, side, fiveOpenNow(asset), ROOM_TWIN[String(r.lane ?? r.book ?? "")]) : "") || (ZONES_OFF.has(String(r.lane ?? r.book ?? "")) ? "" : zoneGate(asset, lb.L, q.c, side));
    if (!why && lb && Array.isArray(lb.L) && lb.L.length && q && q.c > 0) why = WALL_FREE.has(String(r.lane ?? r.book ?? "")) ? "" : crossToTarget(asset, wallFor(WL(wallLines(asset, lb.L)), refreshBroken(asset, lb.L, q.c), q.c, side), q.c, side, targetNow(asset)); // no band between price and the target (Oct 17 ~2:02 AM PT)
    if (!why && lb && Array.isArray(lb.L) && lb.L.length && q && q.c > 0) why = NO_AT_WAIT.has(String(r.lane ?? r.book ?? "")) ? "" : atSessionBand(asset, wallFor(wallLines(asset, lb.L), refreshBroken(asset, lb.L, q.c), q.c, side), q.c); // at the session band = wait (Oct 17 ~10:41 AM PT)
    if (!why && lb && Array.isArray(lb.L) && lb.L.length && q && q.c > 0) why = pinkRejectAgainst(asset, ZONES_OFF.has(String(r.lane ?? r.book ?? "")) ? noZ(lb.L) : lb.L, q.c, side); // no trade against a pink rejection this candle (Oct 17 ~1:03 PM PT)
    if (!why && lb && Array.isArray(lb.L) && lb.L.length && q && q.c > 0) why = ZONES_OFF.has(String(r.lane ?? r.book ?? "")) || NO_REJ_HOLD.has(String(r.lane ?? r.book ?? "")) ? "" : rejCarryAgainst(asset, lb.L, q.c, side); // a rejection holds until price comes back (Oct 17 ~4:54 PM PT)
    if (!why && lb && Array.isArray(lb.L) && lb.L.length && q && q.c > 0) why = pkFree || NO_AT_WAIT.has(String(r.lane ?? r.book ?? "")) ? "" : atPink(asset, wallFor(wallLines(asset, lb.L), refreshBroken(asset, lb.L, q.c), q.c, side), q.c); // a pink break needs $6 (Oct 17 ~1:30 PM PT)
    if (why) { const LA: Map<string, number> = (G.__bandLogAt ||= new Map()); const k = `${id}:${side}`; if (!LA.has(k) || now - (LA.get(k) as number) > 30000) { LA.set(k, now); if (LA.size > 5000) LA.clear(); } else continue; try { appendFileSync(D("band-lock.jsonl"), JSON.stringify({ at: new Date().toISOString(), paper: tag, id, book: r.lane ?? r.book ?? "", asset: a0, side, reason: why, tick: q?.c ?? null }) + "\n"); } catch {} continue; }
    seen.set(id, side);
    out.push(r0);
  }
  if (seen.size > 20000) { let i = 0; for (const k of seen.keys()) { if (i++ > 5000) break; seen.delete(k); } }
  return out;
}

/** The live book that holds this window (from live-book-done.json), for top-ups. */
export function ownerBook(ticker: string): string {
  try {
    const c = (G.__ownerDone ||= { at: 0, d: {} as Record<string, any> });
    if (Date.now() - c.at > 2000) { c.d = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); c.at = Date.now(); }
    for (const [k, v] of Object.entries(c.d)) if (k.startsWith(ticker + ":") && (v as any)?.status === "filled") return k.split(":").pop() || "";
  } catch {}
  return "";
}

// fix319 (Oct 27 2026 ~6:23 AM PT, Love: "enter in at a candle flip of 1, 2,3,4, 5M candles. that's it." + card "Rejection model only"): true when any of the
// live 1m/2m/3m/4m/5m candles has price past its open in `side`'s direction. Read only for the rejection model (rejNoAhead).
export function anyFlipNow(asset: string, side: string, tick: number): boolean {
  try {
    const bars: any[] = G.__pivBars?.[asset]?.bars ?? [], tr = trailNow(asset), ms = Date.now();
    for (const n of [1, 2, 3, 4, 5]) {
      const f0 = Math.floor(ms / (n * 60000)) * n * 60;
      const inF = bars.filter((x) => Number(x.t) >= f0).sort((x, y) => x.t - y.t);
      let o = inF.length ? Number(inF[0].o) : 0;
      if (!(o > 0)) { const pre = tr.filter((x) => x.t < f0 * 1000 && x.t >= f0 * 1000 - 10000); const inn = tr.filter((x) => x.t >= f0 * 1000); o = pre.length ? Number(pre[pre.length - 1].c) : inn.length ? Number(inn[0].c) : 0; }
      if (o > 0 && (side === "up" ? tick > o : tick < o)) return true;
    }
  } catch {}
  return false;
}
/** fix359 (Oct 27 2026 7:19 PM PT, Love: "no pink copy only , but let’s make it $5 not $10 pls / 10c is good for gold oki"): the NO-PINK COPY's flip -
 *  a 1/2/3/4/5m candle only counts as flipped her way once price is at least $5 (BTC) / 10c (gold) past its open. anyFlipNow (main, rejection) is untouched. */
export function anyFlipMinNow(asset: string, side: string, tick: number): boolean {
  const min = asset === "gold" ? 0.1 : 5;
  try {
    const bars: any[] = G.__pivBars?.[asset]?.bars ?? [], tr = trailNow(asset), ms = Date.now();
    for (const n of [1, 2, 3, 4, 5]) {
      const f0 = Math.floor(ms / (n * 60000)) * n * 60;
      const inF = bars.filter((x) => Number(x.t) >= f0).sort((x, y) => x.t - y.t);
      let o = inF.length ? Number(inF[0].o) : 0;
      if (!(o > 0)) { const pre = tr.filter((x) => x.t < f0 * 1000 && x.t >= f0 * 1000 - 10000); const inn = tr.filter((x) => x.t >= f0 * 1000); o = pre.length ? Number(pre[pre.length - 1].c) : inn.length ? Number(inn[0].c) : 0; }
      if (o > 0 && (side === "up" ? tick >= o + min : tick <= o - min)) return true;
    }
  } catch {}
  return false;
}
/** The live 5m candle's open from the desk's own 1m bars (pivotbooks __pivBars). */
function fiveOpenNow(asset: string): number {
  try {
    const bars: any[] = G.__pivBars?.[asset]?.bars ?? [];
    const f0 = Math.floor(Date.now() / 300000) * 300;
    const inF = bars.filter((x) => Number(x.t) >= f0).sort((x, y) => x.t - y.t);
    if (inF.length) return Number(inF[0].o);
    // FIRST SECONDS OF THE CANDLE (Oct 19 ~12:57 AM PT, Love: "obviously fix both things"): until the chart has the new 5m candle, its open is her last
    // live tick before the candle started (within 10 s), else the first tick in it - the break rules are no longer blind for the first ~15 s.
    return trailOpen(asset);
  } catch { return 0; }
}
function trailNow(asset: string): { t: number; c: number }[] {
  if (G.__stDefaultReach) return [];
  const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
  return ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0);
}
function trailOpen(asset: string): number {
  const f0 = Math.floor(Date.now() / 300000) * 300000;
  const tr = trailNow(asset);
  const pre = tr.filter((x) => x.t < f0 && x.t >= f0 - 10000);
  if (pre.length) return Number(pre[pre.length - 1].c);
  const inn = tr.filter((x) => x.t >= f0);
  return inn.length ? Number(inn[0].c) : 0;
}
function fiveHLNow(asset: string): { h: number; l: number } | null {
  try {
    const bars: any[] = G.__pivBars?.[asset]?.bars ?? [];
    const f0 = Math.floor(Date.now() / 300000) * 300;
    const inF = bars.filter((x) => Number(x.t) >= f0);
    if (!inF.length) { const o = trailOpen(asset), tr = trailNow(asset).filter((x) => x.t >= f0 * 1000).map((x) => x.c); const all = [...(o > 0 ? [o] : []), ...tr]; return all.length ? { h: Math.max(...all), l: Math.min(...all) } : null; }
    return { h: Math.max(...inF.map((x) => Number(x.h))), l: Math.min(...inF.map((x) => Number(x.l))) };
  } catch { return null; }
}
/** A reason string if `side` trades against a band break made in the live 5m candle, else "". */
export const BREAK_DIST: Record<string, number> = { btc: 6, gold: 0.33 }; // BTC $8 -> $6 Oct 19 ~12:26 AM PT (Love: "let's lower btc's break to $6 from its original $8 tpls") // // gold 50c -> 33c Oct 18 ~9:04 PM PT (Love: "could you make the push thru a band 33 cents instead of 50 for now bb") // // Love, Oct 17 ~1:15 AM PT; gold $1 -> 50c Oct 18 ~3:51 PM PT ("$1 is waaay too wide rn bb... let's bring that down to 50 cents pls")
// LATEST BREAK DECIDES (Oct 18 ~7:45 PM PT, Love: "yes. the direction of the break... break = direction of the break / rejection = trade the direction
// of the rejection" - 7:30 PM gold: the candle opened under the pink, spiked $0.40 over it, then fell back $2 under it; the open-based check still read a
// rising candle and let a long through). Her live ticks in this 5m candle, in order: every time price goes BREAK_DIST through a band from the side it
// was on, that's a break; the LAST one decides - no long after a break down, no short after a break up.
// ANY BREAK IN THE CANDLE HOLDS FOR THE CANDLE (Oct 18 ~9:09 PM PT, Love: "i don't want her to long if it breaks a band down and then hovers above the pink.
// if it breaks the band down - she cannot long. band break = trade the direction of the break" + earlier "it ONLY applies to CURRENT CANDLE"): every break
// this 5m candle made, from her live ticks plus the candle's own high/low against its open. A break down anywhere in the candle = no long until the next
// candle; a break up = no short. A candle that broke both ways = neither.
// LAST BAND BROKEN APPLIES (Oct 18 ~9:12 PM PT, Love: "in the event price breaks a pink band, and then flips up, and breaks the band ABOVE, she can trade the
// break of THAT. band breaks = trade that direction. if she breaks two bands in one candle, the last break applies"): a break holds for the candle until a
// DIFFERENT band breaks the other way after it. Price coming back through the SAME band doesn't undo its break (9:09 PM: "if it breaks a band down and then
// hovers above the pink... she cannot long"). Active break down = no long; active break up = no short; both active = neither.
export function candleBreaks(asset: string, L: Line[], o: number, tick: number, trail?: { t: number; c: number }[], hl?: { h: number; l: number } | null): { down: { band: Line; t: number } | null; up: { band: Line; t: number } | null; last: { dir: "up" | "down"; band: Line; t: number } | null } {
  const out: { down: { band: Line; t: number } | null; up: { band: Line; t: number } | null; last: { dir: "up" | "down"; band: Line; t: number } | null } = { down: null, up: null, last: null };
  const dist = BREAK_DIST[asset] ?? 0;
  if (!(dist > 0) || !(o > 0)) return out;
  let tr = trail;
  if (!tr) {
    const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
    const f0 = Math.floor(Date.now() / 300000) * 300000;
    tr = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0);
    if (tick > 0) tr = [...(tr as any[]), { t: Date.now(), c: tick }];
  }
  const ev: { dir: "up" | "down"; band: Line; t: number }[] = [];
  for (const b of L) {
    const bp = Number(b.price); if (!(bp > 0)) continue;
    let st: "above" | "below" | null = o > bp ? "above" : o < bp ? "below" : null;
    let sawDn = false, sawUp = false;
    // SESSION BAND STAYS BROKEN FOR THE CANDLE (Love, Oct 18 ~11:21 PM PT: "for the session bands - current candle that broke the band can long if it reverses and flips and starts rising in the top ...): once this candle broke a session band, price coming back through it inside the same
    // candle doesn't break it the other way - it is only unbroken when a candle CLOSES back on the other side (the next candle starts fresh).
    // + THE PINK STAYS BROKEN TOO (Oct 19 ~12:38 PM PT, Love: "yes, that's the same fix we implemented on our other book" - 12:30:22 PM BTC long after the
    // pink broke down at 12:30:16 and a 2 s spike went back over it): once this candle broke the pink, price coming back through it in the same candle
    // doesn't break it the other way - like the session bands, it's unbroken only when a candle closes back on the other side.
    const sessB = isSessBand(b) || b.name === "5m PP";
    for (const x of tr || []) {
      if (st !== "below" && x.c <= bp - dist) { if (st === "above" && !(sessB && sawUp)) { ev.push({ dir: "down", band: b, t: x.t }); sawDn = true; } st = "below"; }
      else if (st !== "above" && x.c >= bp + dist) { if (st === "below" && !(sessB && sawDn)) { ev.push({ dir: "up", band: b, t: x.t }); sawUp = true; } st = "above"; }
    }
    if (hl) { // the candle's own wick, for a poke her ticks missed (earliest - any later tick break outranks it)
      const lo = Math.min(hl.l, tick || hl.l), hi = Math.max(hl.h, tick || hl.h);
      if (!sawDn && o > bp && lo <= bp - dist) ev.push({ dir: "down", band: b, t: 0 });
      if (!sawUp && o < bp && hi >= bp + dist) ev.push({ dir: "up", band: b, t: 0 });
    }
  }
  ev.sort((a, b) => a.t - b.t);
  // THE LAST WAY IT BREAKS (Oct 18 ~10:56 PM PT, Love: "i don't want her to trade neither if it breaks two ways. the last way that it breaks. that's it"):
  // the latest break in the candle - any band, the same band again included - is the only one that counts. A hover back under her break distance
  // isn't a break, so it never flips it.
  out.last = ev.length ? ev[ev.length - 1] : null;
  if (out.last) { if (out.last.dir === "down") out.down = { band: out.last.band, t: out.last.t }; else out.up = { band: out.last.band, t: out.last.t }; }
  return out;
}
// BREAK ONE, TAP THE NEXT = TRADE THE REJECTION (Love, Oct 18 ~9:34 PM PT: "she didn't short at the band though, after it broke one and tapped the next / can you make sure she still does those?" - 9:33 PM gold broke up through the VWAP and the pink, tapped +1σ (high 26c over, no 33c break) and fell back): after the candle's last break (session band or the pink), price reaches the NEXT band beyond it
// (within her tap distance, BTC $3 / gold 30c), doesn't break it, and comes back off it by the tap distance = a rejection off that band - short off a band
// above after a break up, long off a band below after a break down. That rejection is the newest thing price did, so the break rule lets it through.
export function nextBandReject(asset: string, L: Line[], tick: number, o0 = 0, hl0?: { h: number; l: number } | null, trail?: { t: number; c: number }[]): { side: "up" | "down"; band: Line; broke: Line } | null {
  const tap = PINK_TAP[asset] ?? 0, dist = BREAK_DIST[asset] ?? 0;
  const o = o0 > 0 ? o0 : fiveOpenNow(asset);
  if (!(o > 0) || !(tick > 0) || !(tap > 0) || !(dist > 0)) return null;
  const B = L.filter((l) => Number(l.price) > 0 && (isSessBand(l) || l.name === "5m PP"));
  let tr = trail;
  if (!tr) {
    const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
    const f0 = Math.floor(Date.now() / 300000) * 300000;
    tr = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0);
    tr = [...(tr as any[]), { t: Date.now(), c: tick }];
  }
  const hl = hl0 !== undefined ? hl0 : (trail ? null : fiveHLNow(asset));
  const cb = candleBreaks(asset, B, o, tick, tr, hl);
  const e = cb.last; if (!e) return null;
  const after = (tr || []).filter((x) => x.t >= e.t).map((x) => x.c);
  if (e.dir === "up") {
    const nb = B.filter((l) => l.price > Number(e.band.price) && l.name !== e.band.name).sort((a, b) => a.price - b.price)[0]; if (!nb) return null;
    const hi = Math.max(...after, e.t === 0 && hl ? hl.h : -Infinity);
    if (hi >= nb.price - tap && hi < nb.price + dist && tick <= nb.price - tap) return { side: "down", band: nb, broke: e.band };
  } else {
    const nb = B.filter((l) => l.price < Number(e.band.price) && l.name !== e.band.name).sort((a, b) => b.price - a.price)[0]; if (!nb) return null;
    const lo = Math.min(...after, e.t === 0 && hl ? hl.l : Infinity);
    if (lo <= nb.price + tap && lo > nb.price - dist && tick >= nb.price + tap) return { side: "up", band: nb, broke: e.band };
  }
  return null;
}
// BROKE DOWN, TAPPED THE PINK, REJECTED = SHORT (Oct 19 ~12:56 AM PT, Love: "gold came up and tapped the pink band and she didn't short... if the band in the
// current candle broke the one below she can short. next time gold does that and taps the pink and rejects, have her enter" / "current candle + broken
// band = no barrier / short"): this 5m candle's last break was DOWN through the pink or a band under it, since then price came up to the pink (within her
// tap distance), didn't break it, and is back the tap distance under it = the short. The band it broke is behind her - no barrier.
// + THE MIRROR AND BTC (Oct 19 ~1:05 AM PT, Love: "yes."): last break UP through the pink or a band over it, price dipped to the pink, didn't break it,
// and is back the tap distance over it = the long. Gold 30c tap / 33c break, BTC $3 tap / $6 break.
export function pinkRetest(asset: string, L: Line[], tick: number, o0 = 0, hl0?: { h: number; l: number } | null, trail?: { t: number; c: number }[]): { side: "up" | "down"; band: Line; broke: Line } | null {
  if (asset !== "gold" && asset !== "btc") return null;
  const tap = PINK_TAP[asset] ?? 0, dist = BREAK_DIST[asset] ?? 0;
  const o = o0 > 0 ? o0 : fiveOpenNow(asset);
  if (!(o > 0) || !(tick > 0) || !(tap > 0) || !(dist > 0)) return null;
  const B = L.filter((l) => Number(l.price) > 0 && (isSessBand(l) || l.name === "5m PP"));
  const pk = B.find((l) => l.name === "5m PP"); if (!pk) return null;
  let tr = trail;
  if (!tr) { const f0 = Math.floor(Date.now() / 300000) * 300000; tr = [...trailNow(asset).filter((x) => x.t >= f0), { t: Date.now(), c: tick }]; }
  const hl = hl0 !== undefined ? hl0 : (trail ? null : fiveHLNow(asset));
  const cb = candleBreaks(asset, B, o, tick, tr, hl);
  const e = cb.last; if (!e || !(e.t > 0)) return null;
  const after = (tr || []).filter((x) => x.t >= e.t).map((x) => x.c);
  if (!after.length) return null;
  if (e.dir === "down" && Number(e.band.price) <= Number(pk.price)) {
    const hi = Math.max(...after);
    if (hi >= pk.price - tap && hi < pk.price + dist && tick <= pk.price - tap) return { side: "down", band: pk, broke: e.band };
  }
  if (e.dir === "up" && Number(e.band.price) >= Number(pk.price)) {
    const lo = Math.min(...after);
    if (lo <= pk.price + tap && lo > pk.price - dist && tick >= pk.price + tap) return { side: "up", band: pk, broke: e.band };
  }
  return null;
}
// PINK REJECTION ENTRY (Oct 19 ~1:31 PM PT, Love: "let's make another twin that trades rejections that way. we will see how it compares" - the break
// book trades breaks only): this 5m candle opened under the pink, price came up to it (within her tap distance, BTC $3 / gold 30c), didn't break it
// (BTC $6 / gold 33c through) and is back the tap distance under it = short; mirror from above = long. Paper twin only (brk-sessrj).
export function pinkRejectEntry(asset: string, L: Line[], tick: number, o0 = 0, trail?: { t: number; c: number }[]): { side: "up" | "down"; label: string } | null {
  const tap = PINK_TAP[asset] ?? 0, dist = BREAK_DIST[asset] ?? 0;
  const pk = L.find((l) => l.name === "5m PP" && Number(l.price) > 0);
  if (!pk || !(tap > 0) || !(dist > 0) || !(tick > 0)) return null;
  const o = o0 > 0 ? o0 : fiveOpenNow(asset);
  if (!(o > 0)) return null;
  let tr = trail;
  if (!tr) { const f0 = Math.floor(Date.now() / 300000) * 300000; tr = [...trailNow(asset).filter((x) => x.t >= f0), { t: Date.now(), c: tick }]; }
  const xs = [o, ...tr.map((x) => x.c)];
  const hi = Math.max(...xs), lo = Math.min(...xs), P = Number(pk.price);
  if (o < P && hi >= P - tap && hi < P + dist && tick <= P - tap) return { side: "down", label: "Rejected down off 5m PP" };
  if (o > P && lo <= P + tap && lo > P - dist && tick >= P + tap) return { side: "up", label: "Bounced up off 5m PP" };
  return null;
}
export function pinkRetestShort(asset: string, L: Line[], tick: number, o0 = 0, hl0?: { h: number; l: number } | null, trail?: { t: number; c: number }[]) {
  const r = pinkRetest(asset, L, tick, o0, hl0, trail); return r && r.side === "down" ? r : null;
}
export function latestBreak(asset: string, L: Line[], o: number, tick: number, trail?: { t: number; c: number }[]): { dir: "up" | "down"; band: Line; t: number } | null {
  const dist = BREAK_DIST[asset] ?? 0;
  if (!(dist > 0) || !(o > 0)) return null;
  let tr = trail;
  if (!tr) {
    const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
    const f0 = Math.floor(Date.now() / 300000) * 300000;
    tr = ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0);
    if (tick > 0) tr = [...(tr as any[]), { t: Date.now(), c: tick }];
  }
  if (!tr || !tr.length) return null;
  let last: { dir: "up" | "down"; band: Line; t: number } | null = null;
  for (const b of L) {
    const bp = Number(b.price); if (!(bp > 0)) continue;
    let st: "above" | "below" | null = o > bp ? "above" : o < bp ? "below" : null;
    for (const x of tr) {
      if (st !== "below" && x.c <= bp - dist) { if (st === "above") { if (!last || x.t >= last.t) last = { dir: "down", band: b, t: x.t }; } st = "below"; }
      else if (st !== "above" && x.c >= bp + dist) { if (st === "below") { if (!last || x.t >= last.t) last = { dir: "up", band: b, t: x.t }; } st = "above"; }
    }
  }
  return last;
}
// BREAK ENTRY (Oct 18 ~8:39 PM PT, Love: "if price breaks thru the band by over 50 cents on gold have her get in as long as she is closer to the band
// above her than below her and is not in the (top/bottom 20%)" + "it ONLY applies to CURRENT CANDLE"): in the live 5m candle, a break of one of her bands
// (session bands + the pink) by BREAK_DIST is an entry in the break's direction - short after a break down while price is closer to the band above than
// the band below, long after a break up while closer to the band below. The 20% channel rule and every other gate still judge it after this.
export function breakEntry(asset: string, L: Line[], tick: number, o0 = 0, hl0?: { h: number; l: number } | null, trail?: { t: number; c: number }[]): { side: "up" | "down"; band: Line; by: number } | null {
  const dist = BREAK_DIST[asset] ?? 0;
  const o = o0 > 0 ? o0 : fiveOpenNow(asset);
  if (!(dist > 0) || !(o > 0) || !(tick > 0)) return null;
  const B = L.filter((l) => Number(l.price) > 0 && (isSessBand(l) || l.name === "5m PP"));
  if (!B.length) return null;
  let br: { side: "up" | "down"; band: Line; by: number } | null = null;
  const cbE = candleBreaks(asset, B, o, tick, trail, hl0 !== undefined ? hl0 : (trail ? null : fiveHLNow(asset)));
  // the last band broken decides the entry - only if no active break the other way still blocks that side
  const lk = cbE.last && !(cbE.last.dir === "down" ? cbE.up : cbE.down) ? { dir: cbE.last.dir, band: cbE.last.band } : null;
  if (cbE.last && !lk) return null;
  if (lk) br = { side: lk.dir, band: lk.band, by: Math.abs(tick - Number(lk.band.price)) };
  else {
    const hl = hl0 !== undefined ? hl0 : fiveHLNow(asset);
    if (!hl) return null;
    const lo = Math.min(hl.l, tick), hi = Math.max(hl.h, tick);
    const dn = B.filter((l) => o > l.price && lo <= l.price - dist), up = B.filter((l) => o < l.price && hi >= l.price + dist);
    if (dn.length && !up.length) { const b = dn.sort((x, y) => y.price - x.price)[dn.length - 1]; br = { side: "down", band: b, by: b.price - lo }; }
    else if (up.length && !dn.length) { const b = up.sort((x, y) => x.price - y.price)[up.length - 1]; br = { side: "up", band: b, by: hi - b.price }; }
  }
  if (!br) return null;
  const above = B.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0], below = B.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0];
  const dA = above ? above.price - tick : Infinity, dB = below ? tick - below.price : Infinity;
  if (br.side === "down" && !(dA < dB)) return null;
  if (br.side === "up" && !(dB < dA)) return null;
  return br;
}
export function candleBreakAgainst(asset: string, L: Line[], tick: number, side: string, openOverride = 0, hlOverride?: { h: number; l: number } | null, trail?: { t: number; c: number }[]): string {
  const o = openOverride > 0 ? openOverride : fiveOpenNow(asset);
  if (!(o > 0) || !(tick > 0)) return "";
  { const rt0 = pinkRetest(asset, L, tick, o, hlOverride, trail); if (rt0 && rt0.side === side) return ""; } // broke, tapped the pink, rejected = trade the rejection
  // NO LONG WHILE IT'S FALLING (Oct 18 ~11:01 PM PT, Love: "she just longed on gold while it was falling down again hun / can you fix that? once and for
  // all pls" - 11:00 PM gold long "On 5m PP" at 4,183.12, the candle down $1.44 from its open and printing new lows): a 5m candle down at least half her
  // break distance from its open that hasn't bounced her break distance (BTC $8 / gold 33c) off its low = still falling -> no long. Mirror: no short
  // while it's rising. A real bounce (rejection) clears it.
  {
    const dist = BREAK_DIST[asset] ?? 0;
    if (dist > 0) {
      let lo = tick, hi = tick;
      const tr0 = trail ?? (G.__stDefaultReach ? [] : (() => { const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0]; const f0 = Math.floor(Date.now() / 300000) * 300000; return ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0); })());
      for (const x of tr0 || []) { if (x.c < lo) lo = x.c; if (x.c > hi) hi = x.c; }
      const hlF = hlOverride !== undefined ? hlOverride : (openOverride > 0 || G.__stDefaultReach ? null : fiveHLNow(asset));
      if (hlF) { lo = Math.min(lo, Number(hlF.l)); hi = Math.max(hi, Number(hlF.h)); }
      if (side === "up" && o - tick >= dist / 2 && tick - lo < dist) return `price is falling: this 5m candle is $${(o - tick).toFixed(2)} under its open and only $${(tick - lo).toFixed(2)} off its low - no long while it's falling`;
      if (side === "down" && tick - o >= dist / 2 && hi - tick < dist) return `price is rising: this 5m candle is $${(tick - o).toFixed(2)} over its open and only $${(hi - tick).toFixed(2)} off its high - no short while it's rising`;
    }
  }
  if (!(openOverride > 0) || trail) {
    const cb = candleBreaks(asset, L, o, tick, trail, hlOverride !== undefined ? hlOverride : (openOverride > 0 ? null : fiveHLNow(asset)));
    const nr = (side === "up" && cb.down) || (side === "down" && cb.up) ? nextBandReject(asset, L, tick, o, hlOverride !== undefined ? hlOverride : (openOverride > 0 ? null : fiveHLNow(asset)), trail) : null;
    if (side === "up" && cb.down && !(nr && nr.side === "up")) return `this 5m candle broke DOWN through ${cb.down.band.name} (${Number(cb.down.band.price).toFixed(2)}) - a break down is never a long this candle`;
    if (side === "down" && cb.up && !(nr && nr.side === "down")) return `this 5m candle broke UP through ${cb.up.band.name} (${Number(cb.up.band.price).toFixed(2)}) - a break up is never a short this candle`;
    if (nr && nr.side === side) return "";
    // back under a session band this candle broke UP: long only once price "reverses and flips and starts rising" - her break distance off the low since
    // the high. Mirror for shorts back over a session band this candle broke DOWN.
    {
      const dR = BREAK_DIST[asset] ?? 0;
      const trR = trail ?? (G.__stDefaultReach ? [] : (() => { const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0]; const f0 = Math.floor(Date.now() / 300000) * 300000; return ((tk && G[tk]?.[asset]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0); })());
      const ptsR = [...(trR || []), { t: Number.MAX_SAFE_INTEGER, c: tick }];
      if (dR > 0 && ptsR.length > 1) {
        for (const b of L.filter((l) => (isSessBand(l) || l.name === "5m PP") && Number(l.price) > 0)) {
          const bp = Number(b.price);
          if (side === "up" && o < bp && tick < bp) {
            let iH = -1, hi = -Infinity; ptsR.forEach((p, i) => { if (p.c > hi) { hi = p.c; iH = i; } });
            if (hi >= bp + dR) { const lo = Math.min(...ptsR.slice(iH).map((p) => p.c)); if (tick - lo < dR) return `price fell back under ${b.name} (${bp.toFixed(2)}) after breaking it up this candle - no long until it turns back up ($${dR} off its low)`; }
          }
          if (side === "down" && o > bp && tick > bp) {
            let iL = -1, lo = Infinity; ptsR.forEach((p, i) => { if (p.c < lo) { lo = p.c; iL = i; } });
            if (lo <= bp - dR) { const hi = Math.max(...ptsR.slice(iL).map((p) => p.c)); if (hi - tick < dR) return `price came back over ${b.name} (${bp.toFixed(2)}) after breaking it down this candle - no short until it turns back down ($${dR} off its high)`; }
          }
        }
      }
    }
    if (cb.last) return ""; // the last break decides - the older open-of-candle checks below only run when no break was seen this candle
  }
  // TAP AFTER A BREAK (Oct 16 ~4:55 PM PT, Love: "trade the rejection off of a band if it does reject, and ... the break if it
  // does break"): the candle broke a band, then reached the NEXT band beyond it and price is back under/over that band - that
  // rejection is the trade, so it isn't refused as "against the break".
  const hl = hlOverride ?? (openOverride > 0 ? null : fiveHLNow(asset));
  const tapped = (dn: boolean) => !!hl && L.some((l) => (dn ? l.price > tick && hl.h >= l.price : l.price < tick && hl.l <= l.price));
  // BAND BREAK = TRADE THE BREAK, NO TAP EXCEPTION (Oct 17 ~12:49-12:51 AM PT, Love: "a falling candle that just broke a band is not a long" /
  // "band breaks = trade the direction of the break" / "JUST the candle that broke the band"): the Oct 16 4:55 PM tap-the-next-band exception is
  // off - inside the candle that broke a band, nothing trades against the break.
  void tapped;
  if (side === "down" && tick > o) { const b = L.find((l) => o < l.price && tick > l.price); if (b) return `would short a rising 5m candle that broke up through ${b.name} (${b.price})`; }
  if (side === "up" && tick < o) { const b = L.find((l) => o > l.price && tick < l.price); if (b) return `would long a falling 5m candle that broke down through ${b.name} (${b.price})`; }
  // A BREAK IS A BREAK (Oct 17 ~1:14-1:15 AM PT, Love: "it didn't reject off of the pink love, it broke thru it... a clear break through and a bounce
  // off is not the same as a rejection. a break, is a break. a rejection, doesn't puncture the band violently and have a clear wick coming out the
  // bottom of it" + "$8 for btc" / "$1 for gold"): if this 5m candle pushed BREAK_DIST or more through a band it opened on the other side of, that
  // candle only trades the break - price snapping back doesn't make it a rejection. A touch that doesn't get BREAK_DIST through is a rejection.
  const dist = BREAK_DIST[asset] ?? 0;
  const ex = hlOverride ?? (openOverride > 0 ? null : fiveHLNow(asset));
  if (dist > 0 && ex) {
    const lo = Math.min(ex.l, tick), hi = Math.max(ex.h, tick);
    if (side === "up") { const b = L.find((l) => o > l.price && lo <= l.price - dist); if (b) return `this 5m candle broke DOWN through ${b.name} (${b.price}) by $${(b.price - lo).toFixed(2)} - a break is a break: no long this candle`; }
    if (side === "down") { const b = L.find((l) => o < l.price && hi >= l.price + dist); if (b) return `this 5m candle broke UP through ${b.name} (${b.price}) by $${(hi - b.price).toFixed(2)} - a break is a break: no short this candle`; }
  }
  return "";
}

// PINK ROOM (Oct 16 ~2:55 PM PT, Love: "$25 for btc on the pink pivot band. $1 for gold. no long into it. no short into it.
// price breaks = get in. price rejects = GET IN."): no long while the unbroken pink (5m PP) sits above price within $25 BTC /
// $1 gold, no short while it sits below price within that. Broke it or rejected off it = it's behind her, she gets in.
export const PINK_ROOM: Record<string, number> = { btc: 25, gold: 1.5 }; // fallback only, when the session bands are missing
// ROOM = 15% OF THE SESSION BAND SPACING (Oct 16 ~3:36 PM PT, Love: "keep it 15% of the bands distance. the distance between
// each band right now = band tolerance ===== 15%. if it's $100 between SESSION bands, $15 block on any LONG WITH A BAND IN
// FRONT OF IT IN THAT $$$ DISTANCE / same for a SHORT"). Session bands sit one sigma apart, so room = 0.15 x sigma.
export function roomFor(asset: string, L: Line[], x = 0.15): number {
  const u = L.find((l) => l.unit && l.unit > 0)?.unit || 0;
  return u > 0 ? x * u : (PINK_ROOM[asset] || 0) * (x / 0.15);
}
// EVERY BAND, NOT JUST PINK (Oct 16 ~3:33 PM PT, Love: "price was stilllllll under the band when she fired that... what is making
// it impossible for you to not have her long into an unbroken band?" - the 3:30 PM BTC long had R1 $23 overhead). No long with
// ANY unbroken band (pivot or session) above price within the room; no short with any band that close below.
export function pinkInFront(asset: string, L: Line[], tick: number, side: string, open = 0, x = 0.15): string {
  const room = roomFor(asset, L, x);
  if (!(room > 0) || !(tick > 0)) return "";
  let hit: Line | null = null;
  for (const l of L) {
    if (!(l.price > 0)) continue;
    // A band this 5m candle just BROKE isn't an unbroken band in front (Love: "never long or short INTO an unbroken band") - after
    // a tap of the next band, the short back toward the band it broke up through is allowed (mirror for longs). open = live 5m open.
    if (open > 0 && (side === "down" ? open < l.price && tick > l.price : open > l.price && tick < l.price)) continue;
    if (side === "up" && l.price > tick && l.price - tick <= room && (!hit || l.price < hit.price)) hit = l;
    if (side === "down" && l.price < tick && tick - l.price <= room && (!hit || l.price > hit.price)) hit = l;
  }
  if (!hit) return "";
  return side === "up" ? `would long into ${hit.name} ${(hit.price - tick).toFixed(2)} above (needs more than ${room.toFixed(2)})` : `would short into ${hit.name} ${(tick - hit.price).toFixed(2)} below (needs more than ${room.toFixed(2)})`;
}

// RED / GREEN ZONES (Oct 16 ~10:55 PM PT, Love: "if price is currently in the red, or currently in the green, she is not to long or
// to short under any circumstances. UNLESS. A session band lies within them, and that band has been broken" + "she cannnn trade
// into a red or green, if price breaks the band within it, or on trades with very strong volume. weak volume trades into red or
// green without a band break are not allowed" + "when the line is closest to price. absolutely not while it is IN the red, or IN
// the green" + yes to: very strong volume = the live 5m candle's volume at least 2x the average of the last 20 five-minute candles).
// Zones = CM Pivot Bands on 5m bars, forming candle included like her chart: red R1..R2, green S2..S1. Own math (no import).
type Zones = { pp: number; r1: number; r2: number; s1: number; s2: number };
function fiveBars(asset: string): { t: number; o: number; h: number; l: number; c: number; v: number }[] {
  const bars: any[] = G.__pivBars?.[asset]?.bars ?? [];
  const m = new Map<number, { t: number; o: number; h: number; l: number; c: number; v: number }>();
  for (const x of [...bars].sort((a, b) => Number(a.t) - Number(b.t))) {
    const k = Math.floor(Number(x.t) / 300) * 300;
    const y = m.get(k);
    if (!y) m.set(k, { t: k, o: Number(x.o), h: Number(x.h), l: Number(x.l), c: Number(x.c), v: Number(x.v) || 0 });
    else { y.h = Math.max(y.h, Number(x.h)); y.l = Math.min(y.l, Number(x.l)); y.c = Number(x.c); y.v += Number(x.v) || 0; }
  }
  return [...m.values()];
}
export function zonesNow(asset: string): Zones | null {
  const b = fiveBars(asset);
  if (b.length < 10) return null;
  const k = 2 / 8;
  let ema = 0;
  const rng: number[] = [];
  b.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * k + ema * (1 - k); rng.push(x.h - x.l); });
  const a = rng.slice(-7).reduce((q, v) => q + v, 0) / 7;
  return { pp: ema, r1: ema + a, s1: ema - a, r2: ema + 2 * a, s2: ema - 2 * a };
}
export function volNow(asset: string): { cur: number; avg: number; frac: number } | null {
  const b = fiveBars(asset);
  if (b.length < 21) return null;
  const cur = b[b.length - 1];
  const now = Date.now() / 1000;
  if (cur.t !== Math.floor(now / 300) * 300) return null; // the live 5m candle must be this one
  const prev = b.slice(-21, -1);
  return { cur: cur.v, avg: prev.reduce((q, x) => q + x.v, 0) / prev.length, frac: Math.min(1, (now - cur.t) / 300) };
}
// STRONG VOLUME (Love ~10:58 PM PT: "ill let you be the judge... it just needs to be enough to push through"): the live 5m candle on
// pace for 2x the last 20 candles' average (pace = volume so far / share of the candle gone, judged after its first minute).
// Study (Claude outputs/zone_volume_study.py, Pepperstone Oct 11-14 + Oct 16): no volume level told a push-through from a reversal
// (into-zone entries 44-45% at every level, 1.5-2x worse), and Pepperstone's 5m volume almost never reaches 2x - so in practice
// a band break is what lets her trade into a zone. Her call to change it.
export const ZONE_VOL_X = 2;
function strongVol(v: { cur: number; avg: number; frac?: number } | null | undefined): boolean {
  if (!v || !(v.avg > 0)) return false;
  const f = v.frac ?? 1;
  if (f < 0.2) return false;
  return v.cur / f >= ZONE_VOL_X * v.avg;
}
// INTO vs AWAY (Love ~10:58 PM PT: "not NO TRADE at all? she jhust cant short into green without the other criteria, and cant long
// into red without the other requirements either. if price rejects off of the red zone, the trade is SHORT. if price rejects off of
// the green, the trade is LONG... away from them is more than allowed it is requested"). Into the red = a long while price is IN the
// red or R1 is the closest line above; into the green = a short while price is IN the green or S1 is the closest line below.
// Allowed into a zone only if a session band inside it broke this 5m candle in the trade's direction, or strong volume.
export function zoneGate(asset: string, L: Line[], tick: number, side: string, o: { zones?: Zones; open?: number; vol?: { cur: number; avg: number; frac?: number } | null } = {}): string {
  // GOLD ONLY (Oct 17 ~12:16 AM PT, Love: "the long / short into red /green it doesn't count for btc the same way it does for gold... she's clear to
  // long/short into them on btc... just not gold without the exceptions i stated pls - gold only for those")
  // BTC TOO, WITH THE PUSH (Oct 17 ~1:44 PM PT, Love: "the volume still needs to stand on btc hun... it's not a wall IF there is a push, candle was
  // not pushing through. it tapped and rejected, = short" - the 1:34 PM long $7.45 under R1 at 0.9x volume melted). Same rule as gold now.
  if (!(tick > 0) || !(side === "up" || side === "down")) return "";
  const Z = o.zones ?? zonesNow(asset);
  if (!Z) return "can't verify the red/green zones right now";
  const inRed = tick >= Z.r1 && tick <= Z.r2;
  const inGreen = tick <= Z.s1 && tick >= Z.s2;
  const lines = [...L.map((l) => Number(l.price)), Z.r1, Z.r2, Z.s1, Z.s2].filter((p) => p > 0);
  let nearest = lines[0];
  for (const p of lines) if (Math.abs(p - tick) < Math.abs(nearest - tick)) nearest = p;
  // $50 OF CLEARANCE = CLEAR (Oct 19 ~9:31 PM PT, Love, after the 9:19 PM BTC long was refused with the red $100+ away: "the red zone was $100 away
  // from the band at the time. if she has over $50 of clearance to the red / green zones she is good"): on BTC the into-zone rule only bites when the
  // zone's near edge is within $50 of price (IN the zone = no clearance, rule applies). Gold unchanged - say the number and it gets one too.
  const zReach = asset === "btc" ? 50 : Infinity;
  const intoRed = side === "up" && (inRed || (tick < Z.r1 && nearest === Z.r1 && Z.r1 - tick <= zReach));
  const intoGreen = side === "down" && (inGreen || (tick > Z.s1 && nearest === Z.s1 && tick - Z.s1 <= zReach));
  if (!intoRed && !intoGreen) return ""; // away from a zone: always allowed
  const open = o.open ?? fiveOpenNow(asset);
  const sess = L.filter((l) => /σ|VWAP/i.test(l.name) && Number(l.price) > 0);
  const lo = intoRed ? Z.r1 : Z.s2, hi = intoRed ? Z.r2 : Z.s1;
  const broke = open > 0 && sess.some((l) => l.price >= lo && l.price <= hi && (side === "up" ? open < l.price && tick > l.price : open > l.price && tick < l.price));
  if (broke) return "";
  const v = o.vol !== undefined ? o.vol : volNow(asset);
  if (strongVol(v)) return "";
  // A BIG FAST CANDLE IS A PUSH TOO (Oct 17 ~3:50 PM PT, Love: "A & B" - the 3:40 PM breakout ran $124 in 90 s while volume read 0.0x early in the
  // candle): the live 5m candle has already moved a normal candle's size (the 7-bar average range, the red/green zone spacing) in her direction.
  const avgR = Z.r1 - Z.pp;
  if (avgR > 0 && open > 0 && (side === "up" ? tick - open : open - tick) >= avgR) return "";
  const x = v && v.avg > 0 ? `${(v.cur / Math.max(v.frac ?? 1, 0.2) / v.avg).toFixed(1)}x` : "unknown";
  const where = intoRed ? (inRed ? "IN the red zone" : `R1 ${Z.r1.toFixed(2)} the closest line above`) : (inGreen ? "IN the green zone" : `S1 ${Z.s1.toFixed(2)} the closest line below`);
  return `would ${side === "up" ? "long into the red" : "short into the green"} (${where}) - no session band broke inside it and volume ${x} (needs ${ZONE_VOL_X}x)`;
}

// THE OTHER SIDE (Oct 16 ~11:12 PM PT, Love: "if a trade is rejected for being against the rules, i dont want her to ignore it. i want
// her to take the short if a long is rejected. long if a short is rejected" + "yes, if the other side fits the criteria. just not to
// completely ignore the other direction entirely"). Her band rules only - closest band, into a band (15% room), into the red/green,
// against a 5m candle break - on the live tick and band list. cantVerify (no fresh price / bands / zones, feed not healthy, self-test
// failed) = wait, never flip.
// NO BAND BETWEEN PRICE AND THE TARGET (Oct 17 ~2:02 AM PT, Love: "if it's not there definitely add it in... that's literally the first thing i
// asked her to do when i came to her to fix groks mess" + "yesssss maam, precisely" to: she never takes a trade that has to cross an unbroken band
// to reach the target). Target = her chart's price at the window's open (Vantage for BTC - the same scale as her bands; Kalshi's strike is the
// index at that moment). Bands = her walls (BTC: session bands + the pink; gold: every line); a band broken in the trade's direction is not a wall
// (wallFor). Already past the target = nothing left to cross. No window-open price yet = can't verify = she waits a tick.
// KALSHI'S LINE ON HER CHART (Oct 17 ~2:19 AM PT, Love: "the price on vantage is about $100 higher than the price on kalshi. can you have her
// deduct the price difference into her decision to skip?" + "yessss that's perfect" to: Kalshi's real strike for the window, moved onto her chart by
// the LIVE gap). 197 windows since Oct 13: Vantage ran +$92 over the strike on average but -$9 to +$161 window to window, so "Vantage at the open"
// could sit $20-30 off Kalshi's line. INDEX:BTCUSD (btc_v) runs a steady ~$30 over Kalshi's strike (sd ~$10 vs Vantage's ~$15-23). So:
// Kalshi now ~= INDEX - $30; target on her chart = strike + (Vantage - INDEX) + $30. The Vantage-INDEX gap is sampled only when both feeds ticked
// within 1 s of each other (INDEX ticks slower), paired via her quote trail (Vantage tick nearest the INDEX tick, within 2 s), smoothed. No strike for this window / no gap sample in 2 min = can't verify.
// Gold: unchanged (her chart's price at the window open) - this was asked for BTC.
export const INDEX_BIAS: Record<string, number> = { btc: 30 };
G.__indexBias = INDEX_BIAS; // kalshi.ts chartStrike reads the same bias
export function chartTarget(strike: number, gap: number, bias: number): number { return strike + gap + bias; }
function sampleGap(): void {
  try {
    // BTC ON INDEX (Oct 18 ~4:36 PM PT, Love: "INDEX PLS"): her chart is the index itself, so chart-minus-index = 0 -> target = strike + $30.
    if (G.__symBtc === "INDEX:BTCUSD") { const K0 = (G.__kGap ||= { at: 0, gap: 0, vAt: 0 }); const q0 = quoteTick("btc"); if (q0 && q0.c > 0 && Date.now() - q0.at < 120000) { K0.gap = 0; K0.at = Date.now(); K0.vAt = q0.at; } return; }
    const v = quoteTick("btc_v"), K = (G.__kGap ||= { at: 0, gap: 0, vAt: 0 });
    if (!v || !(v.c > 0) || v.at === K.vAt || Date.now() - v.at > 5000) return;
    // Pair the index tick with the Vantage tick nearest the same moment (her quote trail), so BTC's move in between doesn't leak in.
    const tk = Object.keys(G).filter((k) => /^__qtrail_\d+$/.test(k)).sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))[0];
    const tr: { t: number; c: number }[] = (tk && G[tk]?.btc) || [];
    let best: { t: number; c: number } | null = null;
    for (const x of tr) if (x && x.c > 0 && (!best || Math.abs(x.t - v.at) < Math.abs(best.t - v.at))) best = x;
    if (!best || Math.abs(best.t - v.at) > 2000) { const q = quoteTick("btc"); best = q && q.c > 0 && Math.abs(q.at - v.at) <= 2000 ? { t: q.at, c: q.c } : null; }
    if (!best) return;
    const gp = best.c - v.c;
    K.gap = K.at && Date.now() - K.at < 120000 ? K.gap * 0.8 + gp * 0.2 : gp; K.at = Date.now(); K.vAt = v.at;
  } catch {}
}
if (G.__kGapTimer) clearInterval(G.__kGapTimer);
G.__kGapTimer = setInterval(() => {
  sampleGap();
  try { for (const a of ["btc", "gold"]) { const lb = G.__lawBands?.[a], q = quoteTick(a); if (lb && Array.isArray(lb.L) && q && q.c > 0 && Date.now() - q.at < 3000) rejUpdate(a, lb.L, q.c, fiveHLNow(a), ((G.__rejMem ||= {})[a] ||= {})); } } catch {}
  try { // read-out only (data/kalshi-target.json): what the last gate sees as Kalshi's line on her chart
    const n = Date.now(); if (n - (G.__kGapOut || 0) < 3000) return; G.__kGapOut = n;
    const v = quoteTick("btc_v"), q = quoteTick("btc");
    writeFileSync(D("kalshi-target.json"), JSON.stringify({ at: new Date(n).toISOString(), strike: G.__kStrike?.btc ?? null, gap: G.__kGap ?? null, gapAgeS: G.__kGap?.at ? Math.round((n - G.__kGap.at) / 1000) : null, index: v ? { c: v.c, ageMs: n - v.at } : null, vantage: q ? { c: q.c, ageMs: n - q.at } : null, target: targetNow("btc", n) }));
  } catch {}
}, 250);
export function targetNow(asset: string, now = Date.now()): number {
  try {
    if (asset === "btc") {
      sampleGap();
      const s = G.__kStrike?.btc, K = G.__kGap;
      if (!s || !(s.strike > 0) || s.ws !== Math.floor(now / 900000) || now - s.at > 15000) return 0;
      if (!K || !K.at || now - K.at > 120000) return 0;
      return chartTarget(Number(s.strike), Number(K.gap), INDEX_BIAS.btc);
    }
    const ws = Math.floor(now / 900000) * 900;
    const ob = (G.__pivBars?.[asset]?.bars || []).find((x: any) => Number(x.t) === ws);
    return ob && Number(ob.o) > 0 ? Number(ob.o) : 0;
  } catch { return 0; }
}
export function crossToTarget(asset: string, W: Line[], tick: number, side: string, target: number): string {
  void asset;
  if (!(side === "up" || side === "down")) return "";
  if (!(target > 0) || !(tick > 0)) return "can't verify the target right now (no Kalshi strike / live gap yet)";
  if (side === "up" ? tick >= target : tick <= target) return "";
  const lo = Math.min(tick, target), hi = Math.max(tick, target);
  const hit = W.filter((l) => Number(l.price) > lo && Number(l.price) < hi).sort((a, b) => Math.abs(a.price - tick) - Math.abs(b.price - tick))[0];
  if (!hit) return "";
  return `would have to cross ${hit.name} (${Number(hit.price).toFixed(2)}, unbroken) to reach the target ${target.toFixed(2)} - no ${side === "up" ? "long" : "short"}`;
}
// AT THE SESSION BAND = WAIT (Oct 17 ~10:41 AM PT, Love: "if there is a band above / below her (closer than the other) ... have her wait, and see
// if it pushes past the session band above/below or rejects there" + "yessss that's exactly right" to: the closest band is a session band and price
// is within $8 of it on either side (gold $1 - her break depth) = at the band, both sides wait. A push $8+ through it = the break (trade it); a pull
// $8+ back away from it = the rejection (trade away). The 10:31 AM long: pink broke up, price sat a dollar or two around -2 sigma -> she'd have waited.
export function atSessionBand(asset: string, W: Line[], tick: number): string {
  const d = BREAK_DIST[asset] ?? 0;
  if (!(d > 0) || !(tick > 0) || !W.length) return "";
  const near = W.slice().sort((a, b) => Math.abs(a.price - tick) - Math.abs(b.price - tick))[0];
  if (!near || !/σ$|^session VWAP$|^BB (upper|lower)$/.test(String(near.name))) return "";
  const gap = Math.abs(near.price - tick);
  if (gap >= d) return "";
  return `at ${near.name} (${Number(near.price).toFixed(2)}, ${gap.toFixed(2)} ${tick >= near.price ? "over" : "under"} it): waiting for a break or a rejection ($${d} either way)`;
}
// SESSION BAND AHEAD OF THE PINK = WAIT (Oct 17 ~12:10 PM PT, Love: "in the event price passes a pink band and there is an unbroken session band
// above her, still need her to either wait for a break or a rejection there / going into an unbroken band is a losing recipe" + "yesss, same wait"
// for pink rejections). When the closest wall is the pink (just broke it, or bouncing off it), she looks at the session bands: if the unbroken one in
// front is closer than the one behind, she waits for it - a break ($8 through) or a rejection ($8 back). The 12:03 PM long: pink 81,526 $2.50 under,
// VWAP 81,558 $29 ahead vs -0.5 sigma $36 behind -> wait.
export function sessionAheadWait(asset: string, W: Line[], tick: number, side: string): string {
  if (!(side === "up" || side === "down") || !(tick > 0) || !W.length) return "";
  const near = W.slice().sort((a, b) => Math.abs(a.price - tick) - Math.abs(b.price - tick))[0];
  if (!near || String(near.name) !== "5m PP") return "";
  const S = W.filter((l) => /σ$|^session VWAP$|^BB (upper|lower)$/.test(String(l.name)));
  const above = S.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0];
  const below = S.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0];
  const ahead = side === "up" ? above : below, behind = side === "up" ? below : above;
  if (!ahead) return "";
  const da = Math.abs(ahead.price - tick), db = behind ? Math.abs(behind.price - tick) : Infinity;
  if (!(da < db)) return "";
  return `${ahead.name} (${Number(ahead.price).toFixed(2)}) unbroken ${da.toFixed(2)} ${side === "up" ? "above" : "below"}, closer than ${behind ? `${behind.name} ${db.toFixed(2)} behind` : "anything behind"}: waiting for a break or a rejection there`;
}
// NO TRADE AGAINST A REJECTION THIS CANDLE (Oct 17 ~1:03 PM PT, Love: "price didn't break through the pink band and it rejected off of it. not
// sure how that's a short" + "yeah that's fine" + ~1:04 PM "not just for pink love for session bands too"): in the live 5m candle, price tapped the
// pink or a session band (within $3 btc / $0.30 gold - the 1:00 PM candle's low sat $2.03 over the pink) without breaking it ($8 / $1) and has
// since moved $8 / $1+ away = a rejection -> no trade against it for the rest of the candle. The 1:01 PM short: low 81,594.40 on the pink 81,592.37,
// price bounced to 81,612 -> rejection up, no short.
export const PINK_TAP: Record<string, number> = { btc: 3, gold: 0.3 };
// ADD-ON TRIGGER = HER $3 TAP REJECTION (Oct 17 ~10:57 PM PT, Love: "yesss let's make it a $3 tap rejection bb"): the $2 band add-on now fires on
// the same rejection her gate uses - price tapped the pink or a session band (within $3 btc / $0.30 gold) without breaking it ($8 / $1) and moved
// $8 / $1+ away in this 5m candle - in HER direction, on her session + pink bands (no red/green). Was the old 15%-of-sigma "snap" (tap.ts), which
// needed a ~$20+ move and so almost never met the 2.8x price. Fresh price only (3 s).
// NEAR TAP FOR ADD-ONS (Love, Oct 18 ~9:43 PM PT: "it doesn't need to get that close to be considered a tap hun / if it gets near it and pushes away she can add on" + "$2 gold, $30 btc" "for the add on positions i requested. and for the delayed entry model"): price came within $30 (BTC) / $2 (gold) of the pink or a session band without breaking it, then pushed away from
// it - by her break distance from the band and her tap distance ($3 / 30c) off the candle's extreme - in HER direction = add on. Gate rules unchanged.
export const NEAR_TAP: Record<string, number> = { btc: 30, gold: 2 };
export function nearReject(asset: string, L: Line[], tick: number, mySide: "up" | "down", hl: { h: number; l: number } | null): string {
  const d = BREAK_DIST[asset] ?? 0, push = PINK_TAP[asset] ?? 0, near = NEAR_TAP[asset] ?? 0;
  if (!(d > 0) || !(near > 0) || !(tick > 0) || !hl) return "";
  const lo = Math.min(Number(hl.l), tick), hi = Math.max(Number(hl.h), tick);
  for (const l of L.filter((x) => (isSessBand(x) || x.name === "5m PP") && Number(x.price) > 0)) {
    const P = Number(l.price);
    if (mySide === "up" && lo <= P + near && lo > P - d && tick >= P + d && tick >= lo + push) return `came within $${near} of ${l.name} (${P.toFixed(2)}, low ${lo.toFixed(2)}) and pushed up away from it`;
    if (mySide === "down" && hi >= P - near && hi < P + d && tick <= P - d && tick <= hi - push) return `came within $${near} of ${l.name} (${P.toFixed(2)}, high ${hi.toFixed(2)}) and pushed down away from it`;
  }
  return "";
}
// TWIN ADD-ON AT THE NEXT BAND INTERACTION (Oct 22 ~10:51 AM PT, Love: "just at the next band interaction hun"): price within her near tap (BTC $30 / gold $2) of any of her
// lines - session VWAP/sigmas, pink, 5m Bollinger upper/lower, green (5m S1) / red (5m R1) zone. No direction, no walls.
// POLY TWIN AT THE FIRST BAND (fix113, Oct 22 ~8:47 PM PT, Love: "first band after the initial move takes place, the delayed entry model" + card "Fade the
// band, once per window"): every line price is near right now (same lines and near tap as the twin add-on), and the twin's own wall for a side
// (THE IMPOSSIBILITY, her thirds, top/bottom line... - her candle waived, like the twin's free hours).
export function bandsNearNow(asset: string): { names: string[]; tick: number } | null {
  const lb = G.__lawBands?.[asset]; const q = quoteTick(asset); const near = NEAR_TAP[asset] ?? 0;
  if (!lb || !Array.isArray(lb.L) || !q || !(q.c > 0) || Date.now() - q.at > 3000 || Date.now() - Number(lb.at) > 15000 || !(near > 0)) return null;
  const ex: { name: string; price: number }[] = [];
  for (const l of lb.L) { const P = Number(l.price); if (!(P > 0)) continue; if (isSessBand(l as Line) || l.name === "5m PP") ex.push({ name: l.name === "5m PP" ? "the pink" : String(l.name), price: P }); if (l.name === "5m S1") ex.push({ name: "Green zone", price: P }); if (l.name === "5m R1") ex.push({ name: "Red zone", price: P }); }
  try { const zB = G.__bbsr?.[asset]; if (zB && Date.now() - Number(zB.at) <= 20000) { if (Number(zB.bbU) > 0) ex.push({ name: "Bollinger upper", price: Number(zB.bbU) }); if (Number(zB.bbL) > 0) ex.push({ name: "Bollinger lower", price: Number(zB.bbL) }); } } catch {}
  return { names: ex.filter((l) => Math.abs(q.c - l.price) <= near).map((l) => l.name), tick: q.c };
}
export function polyTwinWall(asset: string, side: string): string {
  const lb = G.__lawBands?.[asset]; const q = quoteTick(asset);
  if (!lb || !Array.isArray(lb.L) || !lb.L.length || Date.now() - Number(lb.at) > 15000) return "can't verify the channel right now (band list not fresh)";
  if (!q || !(q.c > 0) || Date.now() - q.at > 3000) return "can't verify the price right now (no fresh price)";
  const fh = feedHealth(asset); if (!fh.ok) return `price feed not healthy (${fh.why})`;
  return dlyKeeps(impossibleGeo(asset, lb.L, q.c, side, true).why, asset);
}
export function addOnTouchNow(asset: string): string {
  const lb = G.__lawBands?.[asset]; const q = quoteTick(asset); const near = NEAR_TAP[asset] ?? 0;
  if (!lb || !Array.isArray(lb.L) || !q || !(q.c > 0) || Date.now() - q.at > 3000 || !(near > 0)) return "";
  const ex: { name: string; price: number }[] = [];
  for (const l of lb.L) { const P = Number(l.price); if (!(P > 0)) continue; if (isSessBand(l as Line) || l.name === "5m PP") ex.push({ name: l.name === "5m PP" ? "the pink" : String(l.name), price: P }); if (l.name === "5m S1") ex.push({ name: "Green zone", price: P }); if (l.name === "5m R1") ex.push({ name: "Red zone", price: P }); }
  try { const zB = G.__bbsr?.[asset]; if (zB && Date.now() - Number(zB.at) <= 20000) { if (Number(zB.bbU) > 0) ex.push({ name: "Bollinger upper", price: Number(zB.bbU) }); if (Number(zB.bbL) > 0) ex.push({ name: "Bollinger lower", price: Number(zB.bbL) }); } } catch {}
  const hit = ex.filter((l) => Math.abs(q.c - l.price) <= near).sort((x, y) => Math.abs(q.c - x.price) - Math.abs(q.c - y.price))[0];
  return hit ? `touched ${hit.name} (${hit.price.toFixed(2)}, price ${q.c.toFixed(2)}) - twin add-on, free` : "";
}
export function addOnTapNow(asset: string, mySide: "up" | "down"): string {
  const lb = G.__lawBands?.[asset];
  const q = quoteTick(asset);
  if (!lb || !Array.isArray(lb.L) || !lb.L.length || !q || !(q.c > 0) || Date.now() - q.at > 3000) return "";
  const hl = fiveHLNow(asset);
  const base = nearReject(asset, lb.L, q.c, mySide, hl);
  if (base || !hl) return base;
  // ADD-ON OFF BOLLINGER + ZONES (Oct 22 ~7:13 AM PT, Love: "her add ons still didn't go thru on the rejections this time" + card "Add them + 3 min cutoff"):
  // the same tap-and-push rejection her way also counts off the 5m Bollinger upper/lower and the green (5m S1) / red (5m R1) zone. Walls still judge it.
  const ex: { name: string; price: number }[] = [];
  try { const zB = G.__bbsr?.[asset]; if (zB && Date.now() - Number(zB.at) <= 20000) { if (Number(zB.bbU) > 0) ex.push({ name: "Bollinger upper", price: Number(zB.bbU) }); if (Number(zB.bbL) > 0) ex.push({ name: "Bollinger lower", price: Number(zB.bbL) }); } } catch {}
  for (const l of lb.L) { if (l.name === "5m S1" && Number(l.price) > 0) ex.push({ name: "Green zone", price: Number(l.price) }); if (l.name === "5m R1" && Number(l.price) > 0) ex.push({ name: "Red zone", price: Number(l.price) }); }
  const d = BREAK_DIST[asset] ?? 0, push = PINK_TAP[asset] ?? 0, near = NEAR_TAP[asset] ?? 0, tick = q.c;
  if (!(d > 0) || !(near > 0)) return "";
  const lo = Math.min(Number(hl.l), tick), hi = Math.max(Number(hl.h), tick);
  for (const l of ex) {
    const P = l.price;
    if (mySide === "up" && lo <= P + near && lo > P - d && tick >= P + d && tick >= lo + push) return `came within $${near} of ${l.name} (${P.toFixed(2)}, low ${lo.toFixed(2)}) and pushed up away from it`;
    if (mySide === "down" && hi >= P - near && hi < P + d && tick <= P - d && tick <= hi - push) return `came within $${near} of ${l.name} (${P.toFixed(2)}, high ${hi.toFixed(2)}) and pushed down away from it`;
  }
  return "";
}
export function pinkRejectAgainst(asset: string, L: Line[], tick: number, side: string, hlOverride?: { h: number; l: number } | null): string {
  const d = BREAK_DIST[asset] ?? 0, tap = PINK_TAP[asset] ?? 0;
  if (!(d > 0) || !(tap > 0) || !(tick > 0) || !(side === "up" || side === "down")) return "";
  const lines = L.filter((l) => /^5m (PP|R1|R2|S1|S2)$|σ$|^session VWAP$|^BB (upper|lower)$/.test(String(l.name)) && Number(l.price) > 0); // + red/green lines (Oct 17 ~1:44 PM PT)
  if (!lines.length) return "";
  const hl = hlOverride !== undefined ? hlOverride : fiveHLNow(asset);
  if (!hl) return "";
  const lo = Math.min(Number(hl.l), tick), hi = Math.max(Number(hl.h), tick);
  for (const l of lines) {
    const P = Number(l.price), nm = l.name === "5m PP" ? "the pink" : /^5m (R1|R2)$/.test(String(l.name)) ? `the red (${l.name})` : /^5m (S1|S2)$/.test(String(l.name)) ? `the green (${l.name})` : String(l.name);
    if (side === "down" && lo <= P + tap && lo > P - d && tick >= P + d) return `price rejected UP off ${nm} (${P.toFixed(2)}, low ${lo.toFixed(2)}) this 5m candle and is ${(tick - P).toFixed(2)} above it - no short against the rejection`;
    if (side === "up" && hi >= P - tap && hi < P + d && tick <= P - d) return `price rejected DOWN off ${nm} (${P.toFixed(2)}, high ${hi.toFixed(2)}) this 5m candle and is ${(P - tick).toFixed(2)} below it - no long against the rejection`;
  }
  return "";
}
// A PINK BREAK NEEDS $6 (Oct 17 ~1:30 PM PT, Love: "yeah let's make it $6 hun. that's a perfect medium between the two" - after the 12:15 PM long
// ($7.70 over the pink) and the 1:15 PM short ($3.84 under it) snapped back). When the closest wall is the pink and price is within $6 of it (gold
// $0.75) on either side, she waits: $6+ through = the break, she trades it.
// $6 PINK WAIT GONE ON BTC (Oct 17 ~8:15 PM PT, Love: "lose the $6 band wait if it's blocking winners... LOSE IT" - this week it blocked 14 trades
// that went 11-3, +$79). The same-candle break/rejection rules still stop a wick through that snaps back. Gold's $0.75 stays.
// PINK WAIT BACK ON BTC (Oct 18 ~3:31 PM PT, Love: "Yes, wait at the pink" - 3:30:23 PM she longed "On 5m PP" $5 above a falling pink that broke down 2 s
// later): within $8 of the pink (the closest wall) she waits - $8 through it = the break, $8 off it = the rejection. Gold unchanged ($0.75).
export const PINK_BREAK: Record<string, number> = { btc: 6, gold: 0.33 }; // BTC $8 -> $6 Oct 19 ~12:26 AM PT (Love: "let's lower btc's break to $6 from its original $8 tpls") // // gold 50c -> 33c Oct 18 ~9:04 PM PT (Love: "could you make the push thru a band 33 cents instead of 50 for now bb") // // gold 75c -> 50c Oct 18 ~4:00 PM PT (Love: "Yes, 50c for the pink too")
export function atPink(asset: string, W: Line[], tick: number): string {
  const d = PINK_BREAK[asset] ?? 0;
  if (!(d > 0) || !(tick > 0) || !W.length) return "";
  const near = W.slice().sort((a, b) => Math.abs(a.price - tick) - Math.abs(b.price - tick))[0];
  if (!near || String(near.name) !== "5m PP") return "";
  const gap = Math.abs(near.price - tick);
  if (gap >= d) return "";
  return `at the pink (${Number(near.price).toFixed(2)}, ${gap.toFixed(2)} ${tick >= near.price ? "over" : "under"} it): waiting for a break or a rejection ($${d} through)`;
}
// CARRY-OVER SESSION BANDS (Oct 17 ~2:42 PM PT, Love: "i'd like her to trade off of the continuation bands that match the last ones and carry off where
// they ended before the session started until the bands widen out enough for her to trade them" + "New sigma reaches 50% of old"). The session resets
// at 5 PM ET (2 PM PT) and the desk can't draw its bands until 8 five-minute candles exist - 2:15-2:35 PM today her gate had NO session bands and
// traded half-blind. Now: the last session's final VWAP/sigma carry over until the new session's sigma is at least half of it.
export function sessStartMs(now = Date.now(), asset = ""): number {
  // INDEX SESSION (Oct 18 ~4:50 PM PT): her INDEX:BTCUSD chart's VWAP session starts 00:00 UTC (5 PM PT), not 5 PM ET, so on INDEX
  // the BTC carry-over (keep the old session's bands until the new ones widen) turns over at 00:00 UTC with her chart.
  if (asset === "btc" && /^(INDEX|COINBASE):BTCUSD$/.test(String((globalThis as any).__symBtc))) return Math.floor(now / 86400000) * 86400000; // Coinbase too (00:00 UTC session)
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now))) p[x.type] = x.value;
  const secs = ((Number(p.hour) - 17 + 24) % 24) * 3600 + Number(p.minute) * 60 + Number(p.second);
  return Math.floor((now - secs * 1000) / 60000) * 60000;
}
// 4 PM HANDOVER (Oct 19 ~5:36 PM PT, Love: "bands widened out on btc now she can go ahead and use the current session bands again pls / gold will widen
// out now too she can trade those as well"; her rule: keep the carried bands "until the new ones widen out enough, roughly 3:00-4:00 PM"): the carried
// bands hand over to the live session's bands 2 hours after the session start (2 PM -> 4 PM PT) at the latest, or sooner once the new sigma reaches 50%
// of the old. 5:30:20 PM gold: the desk still carried yesterday's VWAP 4164.83 / sigma 14.94 (new sigma 2.73 never reached 50%), saw -1σ $14.50 above
// and longed; her chart's live session VWAP sat 50c over her head. `now` is passed by the live caller only; the self-test cases run without it.
export function sessCarryPick(c: any, ss: number, v: number, sd: number, now = 0, asset = ""): { v: number; sd: number; carried: boolean } {
  if (c.cur && c.cur.sess !== ss) { c.prev = c.cur; c.cur = null; }
  const fresh = v > 0 && sd > 0;
  if (fresh) c.cur = { sess: ss, v, sd, at: Date.now() };
  const prev = c.prev && Number(c.prev.sess) < ss && Number(c.prev.sd) > 0 ? c.prev : null;
  const late = false && now > 0 && now - ss >= 7200000 && fresh; // fix164 (Oct 24 ~3:40 PM PT, Love card 'Keep the carry until they widen'): no 2-hour cutoff - the carry holds until the fresh sigma reaches half of the last session's
  // fix167 (Oct 24 ~5:35 PM PT, Love card): BTC hands back to the fresh bands once they are $200+ apart (sd >= 200) - yesterday's width varies too much ; gold once $5+ apart
  const ABS_SD: Record<string, number> = { btc: 180 /* fix168 (Oct 24 ~5:32 PM PT, Love: "yes for the moment") was 200 */, gold: 5 };
  const wideNow = ABS_SD[asset] > 0 ? sd >= ABS_SD[asset] : sd >= 0.5 * Number(prev?.sd || 0);
  if (prev && !late && (!fresh || !wideNow)) return { v: Number(prev.v), sd: Number(prev.sd), carried: true };
  return { v: fresh ? v : 0, sd: fresh ? sd : 0, carried: false };
}
// THE 25% RULE (Oct 17 ~3:19 PM PT, Love: "she CANNT enter a trade long if she's 25% closer to the band above her than below her pls. vis versa
// applies" + "Replace closest-band with 25%"): between the band below and the band above, no long in the top 25% of the gap (no short in the bottom
// 25%). Replaces "closest band decides" (which refused everything past the middle) and the 15%-of-sigma room rule (Vantage's bands are wide).
export function quarterAllows(W: Line[], tick: number, side: string): { ok: boolean; why: string } {
  if (!(tick > 0) || !(side === "up" || side === "down")) return { ok: true, why: "" };
  const above = W.filter((l) => l.price > tick).sort((a, b) => a.price - b.price)[0];
  const below = W.filter((l) => l.price < tick).sort((a, b) => b.price - a.price)[0];
  if (!above || !below) return { ok: true, why: "" };
  const gap = above.price - below.price;
  if (!(gap > 0)) return { ok: true, why: "" };
  if (side === "up" && above.price - tick < 0.25 * gap) return { ok: false, why: `long in the top 25% between ${below.name} (${below.price.toFixed(2)}) and ${above.name} (${above.price.toFixed(2)}) - ${(above.price - tick).toFixed(2)} under ${above.name}` };
  if (side === "down" && tick - below.price < 0.25 * gap) return { ok: false, why: `short in the bottom 25% between ${below.name} (${below.price.toFixed(2)}) and ${above.name} (${above.price.toFixed(2)}) - ${(tick - below.price).toFixed(2)} over ${below.name}` };
  return { ok: true, why: "" };
}
// SESSION + PINK ONLY BOOKS (Oct 17 ~6:01 PM PT, Love: "run her on live without them, just on a new ledger - session only with all of our other
// rules. don't throw away this one"): these books never see the red/green pivot zones (no zone rule, no rejections off R1/R2/S1/S2).
export const ZONES_OFF = new Set<string>(["ogp5-sess", "ogp5-c1", "ogp5-c5", "ogp5-hrs", "ogp5-bbsr", "ogp5-dly", "brk-sesspk"]); // + the close twins (Oct 17 ~10:50 PM PT, paper)
const noZ = (L: Line[]) => L.filter((l) => !/^5m (R1|R2|S1|S2)$/.test(String(l.name)));
export const ROOM_TWIN: Record<string, number> = { "ogp5-r15": 0.15, "ogp5-r30": 0.30 }; // paper twins that keep the sigma room rule
// CLOSEST-BAND TWIN (Oct 17 ~4:29 PM PT, Love: "yes pls"): her book exactly + the old "closest band decides" rule, to compare with the 25% rule.
export const CB_TWIN = new Set<string>(["ogp5-cb"]);
// A REJECTION HOLDS UNTIL PRICE COMES BACK (Oct 17 ~4:54 PM PT, Love: yes to "(a) a rejection carries over until price comes back to that band" after
// the 4:45 PM short: price rose off the pink in the 4:40 candle and the new candle forgot it). Watched every 250 ms: a tap ($3) and pull-away ($8,
// no break) off the pink / a session band / red-green line is remembered; no trade back INTO that band until price touches it again (or 60 min).
type RejMem = Record<string, { dir: "up" | "down"; at: number; price: number }>;
export function rejUpdate(asset: string, L: Line[], tick: number, hl: { h: number; l: number } | null, mem: RejMem, now = Date.now()): void {
  const d = BREAK_DIST[asset] ?? 0, tap = PINK_TAP[asset] ?? 0;
  if (!(d > 0) || !(tick > 0)) return;
  for (const l of L) {
    if (!/^5m (PP|R1|R2|S1|S2)$|σ$|^session VWAP$|^BB (upper|lower)$/.test(String(l.name)) || !(Number(l.price) > 0)) continue;
    const P = Number(l.price), m = mem[l.name];
    if (m && (Math.abs(tick - P) <= tap || now - m.at > 3600000)) { delete mem[l.name]; continue; }
    if (!hl) continue;
    const lo = Math.min(hl.l, tick), hi = Math.max(hl.h, tick);
    if (lo <= P + tap && lo > P - d && tick >= P + d) mem[l.name] = { dir: "up", at: now, price: P };
    else if (hi >= P - tap && hi < P + d && tick <= P - d) mem[l.name] = { dir: "down", at: now, price: P };
  }
}
export function rejCarryAgainst(asset: string, L: Line[], tick: number, side: string, mem?: RejMem): string {
  const M: RejMem = mem ?? (((G.__rejMem ||= {})[asset]) || {});
  for (const l of L) {
    const m = M[l.name]; if (!m) continue;
    const P = Number(l.price), nm = l.name === "5m PP" ? "the pink" : String(l.name);
    if (!inReachL(asset, l, tick)) continue; // too far away to be an obstacle (BLOCK RANGE; red/green pivots use zoneReach)
    if (side === "down" && m.dir === "up" && tick > P) return `price rejected UP off ${nm} (${P.toFixed(2)}) and hasn't come back to it - no short into it`;
    if (side === "up" && m.dir === "down" && tick < P) return `price rejected DOWN off ${nm} (${P.toFixed(2)}) and hasn't come back to it - no long into it`;
  }
  return "";
}
export function bandRulesVerdict(asset: string, side: string, roomX = 0, cb = false, zonesOff = false, noHold = false, bb = false, pinkK = 0, noAtWait = false, sessRej = false): { rule: string; cantVerify: boolean } {
  if (!(asset === "gold" || asset === "btc") || !(side === "up" || side === "down")) return { rule: "", cantVerify: true };
  const lb = G.__lawBands?.[asset];
  const q = quoteTick(asset);
  if (G.__bandLawBroken || !lb || !Array.isArray(lb.L) || !lb.L.length || Date.now() - Number(lb.at) > 15000 || !q || !(q.c > 0) || Date.now() - q.at > 3000) return { rule: "", cantVerify: true };
  if (!feedHealth(asset).ok) return { rule: "", cantVerify: true };
  if (!lb.L.some((l: Line) => /σ$|^session VWAP$|^BB (upper|lower)$/.test(String(l.name)))) return { rule: "", cantVerify: true };
  const W = wallLines(asset, lb.L);
  const BkV = refreshBroken(asset, lb.L, q.c);
  const pkFreeV = pinkK > 0 && pinkRecentFree(asset, lb.L, q.c, side, BkV, pinkK); // paper pink-theory twins only
  const rgOff = rgOffFor(side);
  const WallV = wallFor(rgOff(pkFreeV ? noPink(W) : W), BkV, q.c, side);
  const LZv: Line[] = rgOff(zonesOff ? noZ(lb.L) : lb.L);
  const rtV0 = pinkRetest(asset, lb.L, q.c); const rtV = rtV0 && rtV0.side === side ? rtV0 : null; // "current candle + broken band = no barrier / short"
  const r = rtV ? "" : candleBreakAgainst(asset, W, q.c, side) || sessionBreakPinkHold(asset, lb.L, q.c, side) || pinkRejectAgainst(asset, LZv, q.c, side) || (zonesOff || noHold ? "" : rejCarryAgainst(asset, LZv, q.c, side)) || (roomX > 0 ? pinkInFront(asset, WallV, q.c, side, fiveOpenNow(asset), roomX) : "") || (zonesOff ? "" : zoneGate(asset, lb.L, q.c, side)) || crossToTarget(asset, WallV, q.c, side, targetNow(asset)) || (noAtWait ? "" : atSessionBand(asset, WallV, q.c)) || (noAtWait ? "" : atPink(asset, WallV, q.c));
  if (r) return { rule: r, cantVerify: /can't verify/.test(r) };
  const ns = nearSide(WallV, q.c);
  if (!ns) return { rule: "", cantVerify: true };
  void cb;
  { const aw = awayVerdict(asset, rgOff(lb.L), q.c, side, BkV, { pinkFree: pkFreeV, sessRej }, bb ? bbLines(asset) : []); if (aw) return { rule: aw, cantVerify: false }; } // HER RULE: away from the closest band, break = trade the break
  return { rule: "", cantVerify: false };
}

// WALLS (Oct 17 ~12:16 AM PT, Love: "treat the closest line like a band for red, and for green" + "a rejection off of red or green is still an entry for
// btc / but it's not the same wall as it is for gold"): gold's walls are every line incl. 5m R1/R2/S1/S2; BTC's walls are the session bands + the
// pink only - the red/green lines are entries on BTC, never a block.
export function wallLines(asset: string, L: Line[]): Line[] {
  if (asset === "btc" && quietHour()) return L.filter((l) => !/^5m (R2|S2)$/.test(String(l.name))); // 3 PM hour: BTC's red/green zones are edges
  return asset === "btc" ? L.filter((l) => !/^5m (R1|R2|S1|S2)$/.test(String(l.name))) : L;
}
// 1.28x ROAD (Oct 17 ~12:19 AM PT, Love: "no i want her floor at 1.38 hun its not worth the risk otherwise / she can take a 1.28x if btc is over $125
// from the target and there is a clear road with no band in sight for a rejection"). Target on her chart's scale = her chart's price at the window's
// open (Kalshi's strike is the index at that moment; Vantage runs ~$87 over it). Clear road = no line (session, pink, red/green) within 1 sigma in
// front of the trade. Anything else, or anything unverifiable = 1.38x.
// 75c CEILING FOR HER BREAKS (Oct 19 ~4:23 PM PT, Love: "75 is fine" - the 4:01 PM gold short met 78c on Kalshi a second after the break, over her
// 72c ceiling): the session + pink book may pay up to 75c (1.33x); everything else unchanged (the BTC 1.28x road still applies where it's lower).
export function floorFor(asset: string, side: string, book = ""): number {
  const f = floorBase(asset, side);
  return PASS_THRU.has(book) ? Math.min(f, 1.33) : f;
}
function floorBase(asset: string, side: string): number {
  if (asset !== "btc" || !(side === "up" || side === "down")) return 1.38;
  try {
    const lb = G.__lawBands?.[asset];
    const q = quoteTick(asset);
    if (!lb || !Array.isArray(lb.L) || !q || !(q.c > 0) || Date.now() - q.at > 3000) return 1.38;
    const ws = Math.floor(Date.now() / 900000) * 900;
    const ob = (G.__pivBars?.[asset]?.bars || []).find((x: any) => Number(x.t) === ws);
    const unit = (lb.L as Line[]).find((l) => l.unit && l.unit > 0)?.unit || 0;
    if (!ob || !(Number(ob.o) > 0) || !(unit > 0)) return 1.38;
    const dist = side === "up" ? q.c - Number(ob.o) : Number(ob.o) - q.c;
    const ahead = (lb.L as Line[]).some((l) => (side === "up" ? l.price > q.c && l.price - q.c <= unit : l.price < q.c && q.c - l.price <= unit));
    return dist >= 125 && !ahead ? 1.28 : 1.38;
  } catch { return 1.38; }
}

// SESSION BREAK BEATS THE PINK (Oct 17 ~12:23-12:26 AM PT, Love: "if price breaks a session band right under/over the pink, the session band takes
// precedence over the pink band. in the event price breaks up like that and stalls under a pink, wait for a break, or for a rejection. don't short
// without confirmation if price breaks through a session band underneath / over like that" + yes to: rejection = price taps the pink and a 1m candle
// closes back under it; break = the pink breaks; "just under/over" = the pink within $25 of the session band that broke on BTC). While that holds,
// both sides wait - except the confirmed rejection side. Gold: no number yet (Love to set before Sunday's open).
export const PINK_HOLD_GAP: Record<string, number> = { btc: 25 };
// THE BREAK STAYS IN CHARGE (Oct 17 ~12:47 AM PT, Love: "yessss do both of those" to: after a session band breaks down, no long off a pink
// rejection below it - she only shorts once the pink breaks - until price closes back above the session band (mirror for up); replaces the 1m
// rejection exception that let the 12:46 AM long through). While price sits between the broken session band and the pink within $25 beyond it,
// both sides wait: the pink breaking (or a 5m close back through the session band) ends it.
function fiveClosed(asset: string, now: number, bars0?: any[]): { o: number; h: number; l: number; c: number; t: number } | null {
  const f0 = Math.floor(now / 300) * 300;
  const bs = ((bars0 ?? G.__pivBars?.[asset]?.bars ?? []) as any[]).filter((x) => Number(x.t) >= f0 - 300 && Number(x.t) < f0).sort((a, b) => Number(a.t) - Number(b.t));
  if (!bs.length) return null;
  return { t: f0 - 300, o: Number(bs[0].o), h: Math.max(...bs.map((x) => Number(x.h))), l: Math.min(...bs.map((x) => Number(x.l))), c: Number(bs[bs.length - 1].c) };
}
export function sessionBreakPinkHold(asset: string, L: Line[], tick: number, side: string, o: { open?: number; bars?: any[]; now?: number } = {}): string {
  const gap = PINK_HOLD_GAP[asset];
  if (!(gap > 0) || !(tick > 0) || !(side === "up" || side === "down")) return "";
  const P = Number(L.find((l) => l.name === "5m PP")?.price) || 0;
  if (!(P > 0)) return "";
  const now = o.now ?? Date.now() / 1000;
  const open = o.open ?? fiveOpenNow(asset);
  const k = fiveClosed(asset, now, o.bars);
  const sess = L.filter((l) => /σ|VWAP/i.test(String(l.name)) && Number(l.price) > 0);
  // UP: price over a session band it broke (this candle, or the last 5m closed over it), unbroken pink within $25 above
  // ONLY THE CANDLE THAT BROKE THE BAND (Oct 17 ~12:51 AM PT, Love: "no, JUST the candle that broke the band hun. if a new candle starts, and
  // rejects off of pink, she can take that trade")
  void k;
  const sUp = P > tick ? sess.find((s) => s.price < tick && P - s.price <= gap && open > 0 && open < s.price) : undefined;
  const sDn = !sUp && P < tick ? sess.find((s) => s.price > tick && s.price - P <= gap && open > 0 && open > s.price) : undefined;
  if (sUp) return `${sUp.name} broke UP right under the pink (${P.toFixed(2)}) - the break is in charge this candle: no short off the pink; long once the pink breaks`;
  if (sDn) return `${sDn.name} broke DOWN right over the pink (${P.toFixed(2)}) - the break is in charge this candle: no long off the pink; short once the pink breaks`;
  return "";
}
// PINK REJECTION NEEDS A 5m CLOSE (Oct 17 ~12:47 AM PT, Love: "yessss do both of those"): a trade booked as a rejection off the pink (5m PP)
// only counts if the last closed 5m candle tapped the pink and closed back on the rejection side (long: low at/under it, close over it).
export function pinkRejectNeeds5m(asset: string, L: Line[], side: string, o: { bars?: any[]; now?: number } = {}): string {
  const P = Number(L.find((l) => l.name === "5m PP")?.price) || 0;
  if (!(P > 0) || !(side === "up" || side === "down")) return "";
  const k = fiveClosed(asset, o.now ?? Date.now() / 1000, o.bars);
  if (k && (side === "up" ? k.l <= P && k.c > P : k.h >= P && k.c < P)) return "";
  return `pink rejection needs a 5m candle that tapped the pink (${P.toFixed(2)}) and closed back ${side === "up" ? "over" : "under"} it`;
}
function isPinkReject(r: any): boolean {
  return !!r && /^5m PP/.test(String(r.band?.name || "")) && /reject/i.test(String(r.goldLaw?.kind || "") + " " + String(r.label || ""));
}
function setupRow(ticker: string, book: string, side: string): any {
  try {
    const c = (G.__setupRows ||= { at: 0, rows: [] as any[] });
    if (Date.now() - c.at > 2000) { const rs = JSON.parse(readFileSync(D("grok-og.json"), "utf8")); c.rows = Array.isArray(rs) ? rs.slice(0, 400) : []; c.at = Date.now(); }
    return c.rows.find((x: any) => x && x.ticker === ticker && x.lane === book && x.side === side) || null;
  } catch { return null; }
}

// A BROKEN BAND IS A BROKEN WALL (Oct 17 ~1:19 AM PT, Love: "yes. a broken band is not a wall. it is a broken wall / if price pushes and breaks a
// band, it pushes back up, it's not a wall until price closes above it, a 5M close for the pivot band, because the 1m bands are not the same").
// A line a 5m candle pushed BREAK_DIST+ through (from the side it opened on) stops counting as a wall for the closest-band and room checks until a
// candle CLOSES back across it: a 5m close for pivot lines (pink, R/S), a 1m close for session bands (VWAP, sigma). The candle-break rule still sees it.
type Broke = Record<string, { side: "up" | "down"; at: number }>;
export function refreshBroken(asset: string, L: Line[], tick: number, o: { bars?: any[]; now?: number; open?: number; hl?: { h: number; l: number } | null; state?: Broke } = {}): Map<string, "up" | "down"> {
  const out = new Map<string, "up" | "down">();
  try {
    const dist = BREAK_DIST[asset] ?? 0;
    if (!(dist > 0) || !(tick > 0)) return out;
    const st: Broke = o.state ?? (((G.__brokenWalls ||= {})[asset] ||= {}) as Broke);
    const now = o.now ?? Date.now() / 1000;
    const open = o.open ?? fiveOpenNow(asset);
    const ex = o.hl !== undefined ? o.hl : fiveHLNow(asset);
    const bars = ((o.bars ?? G.__pivBars?.[asset]?.bars ?? []) as any[]).slice().sort((a, b) => Number(a.t) - Number(b.t));
    const f0 = Math.floor(now / 300) * 300, m0 = Math.floor(now / 60) * 60;
    const in5 = bars.filter((x) => Number(x.t) >= f0 - 300 && Number(x.t) < f0);
    const k5 = in5.length ? { t: f0 - 300, c: Number(in5[in5.length - 1].c) } : null;
    const b1 = bars.find((x) => Number(x.t) === m0 - 60);
    const k1 = b1 ? { t: m0 - 60, c: Number(b1.c) } : null;
    for (const l of L) {
      if (!(Number(l.price) > 0)) continue;
      if (open > 0 && ex) {
        const lo = Math.min(Number(ex.l), tick), hi = Math.max(Number(ex.h), tick);
        if (open > l.price && lo <= l.price - dist) st[l.name] = { side: "down", at: st[l.name]?.side === "down" ? st[l.name].at : now };
        else if (open < l.price && hi >= l.price + dist) st[l.name] = { side: "up", at: st[l.name]?.side === "up" ? st[l.name].at : now };
      }
      const b = st[l.name];
      if (!b) continue;
      const sess = /σ|VWAP/i.test(String(l.name));
      const kc = sess ? k1 : k5;
      const fromT = sess ? Math.floor(b.at / 60) * 60 : Math.floor(b.at / 300) * 300;
      if (kc && kc.t >= fromT && (b.side === "down" ? kc.c > l.price : kc.c < l.price)) { delete st[l.name]; continue; }
      out.set(l.name, b.side);
    }
  } catch {}
  return out;
}
// DIRECTIONAL (Oct 17 ~1:38 AM PT - the 1:36:32 AM backwards long): a broken wall is only ignored IN FRONT of the break direction - a band broken
// DOWN that price snapped back above can't block a SHORT; a band broken UP that price fell back under can't block a LONG. Everywhere else it stays a
// line: a band broken down and still above price is a wall over a long and the band that points the short (it was dropped entirely before, so the
// short read the +0.5 sigma $34 below as closest, got refused, and flipped long under the +1 sigma).
export function wallFor(W: Line[], Bk: Map<string, "up" | "down">, tick: number, side: string): Line[] {
  return W.filter((l) => {
    const b = Bk.get(l.name);
    if (!b) return true;
    if (side === "down" && b === "down" && l.price < tick) return false;
    if (side === "up" && b === "up" && l.price > tick) return false;
    return true;
  });
}

// THE WALL AT THE WIRE (Oct 20 ~12:40 PM PT, Love: "make it so she has no other logic to operate under ... a long into an unbroken
// band above or below her in the top or bottom 33% of the channel is certain death ... that is something she would NEVER do"):
// kalshi() asks this for EVERY opening BTC/gold 15m order, whatever path built it - books, copiers, add-ons, flips, anything added
// later. THE WALL on the live price and her bands, and the golden seal. Anything it can't verify is refused. Exits never come here.
let wireSeal = { at: 0, why: "" };
function sealDrift(): string {
  if (Date.now() - wireSeal.at < 15000) return wireSeal.why;
  let why = "";
  try {
    const b = JSON.parse(readFileSync(D("golden-baseline.json"), "utf8"));
    const dir = join(process.cwd(), "src", "lib", "desk");
    const have = new Set<string>();
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".ts")) continue;
      have.add(f);
      const h = createHash("sha256").update(readFileSync(join(dir, f))).digest("hex").slice(0, 16);
      if (b?.code?.[f] !== h) { why = `THE SEAL: ${f} is not the code Love approved (golden-baseline) - no opening order until she approves it`; break; }
    }
    if (!why) for (const f of Object.keys(b?.code || {})) if (!have.has(f)) { why = `THE SEAL: ${f} is missing - no opening order`; break; }
    if (!why) {
      const sw = JSON.parse(readFileSync(D("live-switch.json"), "utf8"));
      for (const k of ["channelPct", "channelPctTop"]) {
        const h = createHash("sha256").update(pyDumps(sw?.[k] ?? null)).digest("hex").slice(0, 10);
        if (b?.config?.[k] !== h) { why = `THE SEAL: ${k} is not the number Love approved - no opening order`; break; }
      }
      // HER SETTINGS SEALED TOO (Oct 20 ~11:07 PM PT, Love picked "Seal settings at the wire" on "Block her from trading if her settings change without you?";
      // her words at 10:53 PM: "make sure there's nothing that can alter her from her current parameters - by a millimeter. by any event other than a specifically
      // intended revision from my side of the desk"): every setting in live-switch.json must match golden-baseline, except her own hands - LIVE, the size slider
      // (maxDollars, liveBook.dollars) and the notes/stamps those buttons write. A new, missing or changed setting = no opening order until she approves it.
      if (!why) {
        const FREE = new Set(["live", "maxDollars", "note", "at"]);
        const keys = new Set<string>([...Object.keys(b?.config || {}), ...Object.keys(sw || {})]);
        for (const k of keys) {
          if (FREE.has(k)) continue;
          if (k === "liveBook") {
            const lb: any = sw?.liveBook && typeof sw.liveBook === "object" ? { ...sw.liveBook } : sw?.liveBook ?? null;
            if (lb && typeof lb === "object") for (const x of ["dollars", "note", "at", "since"]) delete lb[x];
            const h = createHash("sha256").update(pyDumps(lb)).digest("hex").slice(0, 10);
            if (b?.sealLiveBook !== h) { why = `THE SEAL: her live book lineup (liveBook) is not what Love approved - no opening order until she approves it`; break; }
            continue;
          }
          if (!(k in (sw || {}))) { why = `THE SEAL: her setting ${k} is missing - no opening order until she approves it`; break; }
          if (!(k in (b?.config || {}))) { why = `THE SEAL: new setting ${k} Love never approved - no opening order until she approves it`; break; }
          const h = createHash("sha256").update(pyDumps(sw[k])).digest("hex").slice(0, 10);
          if (b.config[k] !== h) { why = `THE SEAL: her setting ${k} changed without her - no opening order until she approves it`; break; }
        }
      }
    }
  } catch (e) { why = `THE SEAL could not be checked (${String(e).slice(0, 80)}) - no opening order`; }
  wireSeal = { at: Date.now(), why };
  return why;
}
// SEAL KEPT WARM (Oct 20 ~2:52 PM PT, Love: "remove any shackles make sure she's free to sprint"): the seal re-hashes every desk file on a 7 s
// clock, so an order at the wire always finds a check under 15 s old and never waits on the hashing. The seal itself is unchanged and still fails closed.
{ const GW = G as any; if (GW.__sealWarm) clearInterval(GW.__sealWarm); GW.__sealWarm = setInterval(() => { try { wireSeal.at = 0; sealDrift(); } catch {} }, 7000); }
// Same text as Python's json.dumps(v, sort_keys=True), which is how golden-baseline.json hashes her config.
function pyDumps(v: any): string {
  if (Array.isArray(v)) return "[" + v.map(pyDumps).join(", ") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => pyStr(k) + ": " + pyDumps(v[k])).join(", ") + "}";
  if (v === undefined) return "null";
  // Python's json.dumps escapes every non-ASCII character (ensure_ascii) - match it so notes with σ or emoji hash the same.
  if (typeof v === "string") return pyStr(v);
  return JSON.stringify(v);
}
function pyStr(s: string): string { return JSON.stringify(s).replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0")); }
// THE DELAYED BOOK TRADES AT ANY LEVEL (Oct 21 ~10:59 AM PT, Love: "she's clear to trade at any level on the delayed entry book / at the next band interaction
// from the main book's initial entry. anywhere / just $2 ok / make them go thru when she's on her off hours"): in TOGETHER's off hours (live-switch
// bookSkipHours["recon-tog"]), an opening order of the DELAYED book (recon-dly) skips the level walls - no chase past 2σ, the thirds, THE IMPOSSIBILITY,
// the third wall, the zone and channel checks. The seal, fresh bands and price, her hand-trade window and her $2 size still hold.
// HER 33% + THE TOP/BOTTOM LINE STILL BIND THE DELAYED BOOK (Oct 21 ~11:21 AM PT, Love picked "Yes, keep 33% + top/bottom line" after the 11:18 AM
// gold twin long at 88% of the +1σ -> +2σ channel): in her off hours the twin keeps every other freedom, but THE IMPOSSIBILITY, ONLY IN HER THIRD and
// THE TOP/BOTTOM LINE of impossibleGeo still refuse her. Only HER CANDLE is waived.
// THE TWIN GETS CLOSER TO THE BAND ON BTC (Oct 22 ~2:15 PM PT, Love: "for the delayed entry model we can allow her to enter those, you can free her up to a
// tolerance that would let those thru" - 1:47 PM BTC twin long at 89% and 2:03 PM at 92% of the -2σ -> -1σ channel were refused by the top 20%; the 2:03 one ran to 98c):
// on BTC, in her twin hours, THE IMPOSSIBILITY and ONLY IN HER THIRD refuse the DELAYED book only in the last 5% before the band (long at 95%+, short at 5% or under).
// Gold, THE TOP/BOTTOM LINE and every other wall unchanged.
const DLY_BTC_EDGE = 0.05;
export const dlyKeeps = (why: string, asset = ""): string => {
  if (!why || why.startsWith("HER CANDLE")) return "";
  if (asset === "btc") { const m = /^(THE IMPOSSIBILITY|ONLY IN HER THIRD): (long|short) at (\d+)% of /.exec(why); if (m) { const p = Number(m[3]) / 100; if (m[2] === "long" ? p < 1 - DLY_BTC_EDGE : p > DLY_BTC_EDGE) return ""; } }
  return why;
};
// THE TWIN AT THE BAND (fix307, Oct 27 2026 ~1:26 AM PT, Love: "she doesn't need to be blocked by a green zone or a bollinger on the delayed book hun ... she just
// shorts or longs at a band when she interacts with one luv, no holds other than the 20/33 band tolerances"): in her hours the DELAYED twin is judged only by her
// thirds (lockPctFor: the 20%/33% share next to the unbroken band, same numbers as THE IMPOSSIBILITY; BTC keeps her 5% edge, Love 1:36 AM "yes 5% band tolerances") and the whole channel's TOP/BOTTOM LINE
// (Oct 21 ~11:22 AM PT, Love "keep 33% + top/bottom line"). Bands that can't be read / just jumped still refuse (safety, not a wall). Every other wall is hers to pass.
export function dlyThirds(asset: string, L: Line[], tick: number, side: string): string {
  const g = impossibleGeo(asset, L, tick, side, true, true);
  if (/^THE IMPOSSIBILITY: her (bands can't be read|session bands just jumped)/.test(g.why)) return g.why;
  const sqzE = squeezedPinkOf(L);
  const edges = chanL(asset, L).filter((l: Line) => isChanBand(asset, l) && !sqzE(l)).map((l: Line) => Number(l.price)).filter((x: number) => x > 0).sort((x: number, y: number) => x - y);
  if (!(tick > 0) || edges.length < 2) return "THE IMPOSSIBILITY: her bands can't be read - no opening order";
  const topL = edges[edges.length - 1], botL = edges[0];
  if (side === "up" && tick > topL) return `THE TOP LINE: long at ${tick.toFixed(2)} over the top of her whole channel (${topL.toFixed(2)}) - never trade its break; a rejection back under it is a short.`;
  if (side === "down" && tick < botL) return `THE BOTTOM LINE: short at ${tick.toFixed(2)} under the bottom of her whole channel (${botL.toFixed(2)}) - never trade its break; a rejection back over it is a long.`;
  const below = edges.filter((x: number) => x <= tick).pop(), above = edges.find((x: number) => x > tick);
  if (below === undefined || above === undefined || !(above > below)) return "";
  const pos = (tick - below) / (above - below), TH = asset === "btc" ? DLY_BTC_EDGE /* fix307: Love 1:36 AM "yes 5% band tolerances" - BTC keeps her 5% edge */ : lockPctFor(asset, above - below), thTxt = Math.round(TH * 100);
  if (side === "up" && pos >= 1 - TH) return `THE IMPOSSIBILITY: long at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - the top ${thTxt}%, into the unbroken band above. never.`;
  if (side === "down" && pos <= TH) return `THE IMPOSSIBILITY: short at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - the bottom ${thTxt}%, into the unbroken band below. never.`;
  return "";
}
// UNDER ALL HER RULES (Oct 21 ~11:23 AM PT, Love: "when i said anywhere i meant she could trade under our rules. anywhere. not abandon them entirely"):
// the off-hours freedom above is withdrawn - the DELAYED book passes every wall, door and the wire exactly like the main book. DLY_FREE stays false.
// AT THE TOUCH (Oct 21 ~6:20 PM PT, Love picked "Yes, skip only the candle rule"): the twin enters on the touch of the next band, while price is still
// moving into it, so her off hours waive HER CANDLE again - THE IMPOSSIBILITY, ONLY IN HER THIRD and THE TOP/BOTTOM LINE still refuse her (dlyKeeps).
const DLY_FREE = true;
const DLY_AS_COPY = false; /* fix353 PAUSED (Love 6:11 PM PT: "wait no no no no no no do not change the 5M on polymarket in any way nooo"): the twin is exactly as before everywhere */ // fix353 (Oct 27 2026 ~6:09 PM PT, Love: "just make the delayed entry model a delayed rejection copy of no pink / no entires first 30 seconds into a window is good" + "we will use that model with a delayed entry - after 30 seconds"): recon-dly meets the no-pink copy's walls (togpLoose), not the twin's
export function dlyFreeNow(asset = ""): boolean { // fix278: asset picks its own hours (bookSkipHoursByAsset)
  if (!DLY_FREE || DLY_AS_COPY /* fix353: no twin-hour freedoms - she is the copy now */) return false;
  try {
    const sw = JSON.parse(readFileSync(D("live-switch.json"), "utf8"));
    // HOURS BY KALSHI'S LABEL (Oct 22 ~4:30 PM PT, Love picked "Follow Kalshi labels"): an hour owns the windows Kalshi labels :00, :15, :30 and :45 by their
    // close time, so the hour is read off the running window's CLOSE (the 3:45-4:00 PM window, labelled 4:00, belongs to the 4 PM book). Four full windows each.
    const mA = asset ? sw?.bookSkipHoursByAsset?.[String(asset).toLowerCase()]?.["recon-tog"] : null; const hrs = Array.isArray(mA) ? mA : sw?.bookSkipHours?.["recon-tog"]; const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24;
    if (Array.isArray(hrs) && hrs.map(Number).includes(h)) return true;
    // fix306 (Oct 27 2026, Love card "All her twin-hour freedoms" + "she doesn't need to wait for a candle close"): her freedoms also follow her OWN
    // live hours (an hour not in recon-dly's skip list), so 1 AM and 5 AM - twin hours main doesn't sit out - get them too.
    const dA = asset ? sw?.bookSkipHoursByAsset?.[String(asset).toLowerCase()]?.["recon-dly"] : null; const dh = Array.isArray(dA) ? dA : sw?.bookSkipHours?.["recon-dly"];
    return Array.isArray(dh) && !dh.map(Number).includes(h);
  } catch { return false; }
}
function dlyOrderAtWire(t: string, side: string): boolean {
  try {
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); // the copier's cached parse when it has one (2 MB file)
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":recon-dly") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  } catch {}
  return false;
}
// fix318 (Oct 27 2026 ~5:41 AM PT, Love: "she shouldn't be waiting for price to cross a bollinger back down before entering. she was mad late on that short ... toss that too please"
// + card "Rejection model and main"): for the REJECTION model and the MAIN book (recon-tog) the Bollinger no longer counts in TARGET PAST A BAND; session bands and pink there unchanged.
function togOrderAtWire(t: string, side: string): boolean {
  try {
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":recon-tog:") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  } catch {}
  return false;
}
// fix317 (Oct 27 2026 ~5:16 AM PT, Love: "i need you to stop letting shit i did not ask for get thru" - she never made fix238's gold "zone ahead before the next band" rule;
// her rule is fix242, the zone right behind/over the band): an opening order of the REJECTION model (recon-rej) at the wire skips the zone-ahead branch. Main and every other book unchanged.
// fix323 (Oct 27 2026 ~11:07 AM PT, Love: "let's set a $40 btc green / red guard" + 11:11 AM 40% of pink-to-green + card "Main only"):
// true when this window's opening order at the wire belongs to `book`.
function bookOrderAtWire(t: string, side: string, book: string): boolean {
  try {
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":" + book + ":") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  } catch {}
  return false;
}
function rejOrderAtWire(t: string, side: string): boolean {
  try {
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":recon-rej:") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  } catch {}
  return false;
}
// fix286: an opening order of the no-pink copy (recon-togp) at the wire - same lookup as the twin's
function tpOrderAtWire(t: string, side: string): boolean {
  try {
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":recon-togp") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  } catch {}
  return false;
}
export function wireWall(ticker: string, side: "up" | "down"): string {
  const t = String(ticker || "").toUpperCase();
  const asset = t.startsWith("KXBTC15M") ? "btc" : t.startsWith("KXGOLD15M") ? "gold" : "";
  if (!asset) return "";
  const deny = (reason: string, extra: Record<string, unknown> = {}) => {
    try { appendFileSync(D("band-lock.jsonl"), JSON.stringify({ at: new Date().toISOString(), book: "WIRE", asset, side, ticker: t, reason, ...extra }) + "\n"); } catch {}
    return reason;
  };
  const seal = sealDrift(); if (seal) return deny(seal);
  const lb = G.__lawBands?.[asset];
  if (!lb || !Array.isArray(lb.L) || !lb.L.length || Date.now() - Number(lb.at) > 15000) return deny("THE WALL AT THE WIRE: her band list is not fresh - can't verify, no opening order");
  const q = quoteTick(asset);
  if (!q || !(q.c > 0) || Date.now() - q.at > 3000) return deny("THE WALL AT THE WIRE: no fresh price - can't verify, no opening order");
  // THE IMPOSSIBILITY (Oct 20 ~12:53 PM PT, Love: "make sure that no orders can get out if its a long in the top 33% and no shorts into an
  // unbroken band in the bottom 33% ... just a straight up impossibility please. immutably - no way for her to change."): plain geometry,
  // fixed numbers, no config, no exemptions, no broken-band memory. The channel is the gap between the band just under price and the band
  // just over it (session VWAP, the sigma bands, the pink 5m PP). Price is between them, so both are unbroken right now.
  const dlyFree = dlyFreeNow(asset) && dlyOrderAtWire(t, side);
  const geo = impossibleGeo(asset, lb.L, q.c, side, dlyFree, false, !dlyFree && (tpOrderAtWire(t, side) || (DLY_AS_COPY && dlyOrderAtWire(t, side)) /* fix353 */ || bookOrderAtWire(t, side, "recon-np") /* fix363 */), !dlyFree && rejOrderAtWire(t, side), !dlyFree && (rejOrderAtWire(t, side) || togOrderAtWire(t, side)), !dlyFree && (bookOrderAtWire(t, side, "recon-tog") || bookOrderAtWire(t, side, "recon-rej") /* fix324 */) ? 0.4 : 0, !dlyFree && (bookOrderAtWire(t, side, "recon-tog") || bookOrderAtWire(t, side, "recon-rej")) ? true : false, !dlyFree && bookOrderAtWire(t, side, "recon-np") /* fix363 */); // fix286 // fix317 // fix318 // fix323
  { const gw = dlyFree ? dlyThirds(asset, lb.L, q.c, side) /* fix307 */ : geo.why; if (gw) return deny(gw, { tick: q.c }); } // the twin keeps her 33% + top/bottom line (Oct 21 ~11:21 AM PT, Love)
  // NEVER AGAINST THE THIRDS AT THE WIRE (Love, Oct 20 ~5:07 PM PT: "again she did it / she shorted a candle rising in the bottom 33% of the channel on gold / can you fix it hun?"): 5:01:44 PM her 5:00:10 "break below the pink" short was still
  // being retried while the candle had already turned and was rising off its low - it went out against the rise. Whatever called it and whenever:
  // a candle rising from the bottom third is a long, so no short leaves; falling from the top third is a short, so no long leaves.
  if (!dlyFree) { const tm = thirdsMove(asset, lb.L, q.c, fiveOpenNow(asset), fiveHLNow(asset)); if (tm && tm !== side) return deny(`THE THIRDS AT THE WIRE: the candle is ${tm === "up" ? "rising from the bottom third - a long, never a short" : "falling from the top third - a short, never a long"}`, { tick: q.c }); }
  const w = dlyFree ? "" : thirdWallAbsolute(asset, lb.L, q.c, side, refreshBroken(asset, lb.L, q.c));
  if (w) return deny(`${w} (at the wire)`, { tick: q.c });
  // EVERY PASS ON THE RECORD (Oct 20 ~2:37 PM PT, Love: "please make sure nothing else can slip past her new code"): each opening order the wire
  // lets through is written with the exact channel it saw, so any fill can be checked against her 33%/20% law afterwards. data/wire-pass.jsonl.
  try { appendFileSync(D("wire-pass.jsonl"), JSON.stringify({ at: new Date().toISOString(), asset, side, ticker: t, tick: q.c, below: geo.below, above: geo.above, pos: geo.pos, lock: geo.lock }) + "\n"); } catch {}
  return "";
}
// THE IMPOSSIBILITY, ONE COPY (Oct 20 ~2:37 PM PT, Love: "make sure no longs or shorts ever gets through inside of her 33% & 20% zones into an unbroken
// band, and that it is not possible for her logic to shift"): plain geometry, no config, no exemptions, no broken-band memory. The channel is the gap
// between the band just under price and the band just over it (session VWAP, the sigma bands, the pink 5m PP, and BTC's Bollinger in its window).
// Long in the top share / short in the bottom share (lockPctFor: BTC 33% to $300 wide, 20% past; gold 33% to $7.50, 20% from $10) = refused.
// The wire, the RECONSTRUCTED door and the RECONSTRUCTED paper rows all run this same function, so paper can never book what Kalshi would refuse.
// RISING IN THE BOTTOM THIRD / FALLING IN THE TOP THIRD (Oct 20 ~4:48 PM PT, Love, Oct 20 ~4:48 PM PT: "please change a candle rising in the bottom 33% of the channel to a long / candle falling in the top 33% a short / no shorts in
// the bottom 33% of the channel / no longs in the top 33% of the channel / please reinforce it it didn't work"): this 5m candle's low sits in the bottom share of her
// channel (sliding 33%/20%) and price has risen off it by the tap distance = "up"; its high in the top share and price fallen off it = "down".
// A SQUEEZED PINK IS NO EDGE (Oct 20 ~9:54 PM PT, Love: "if price has broken the pink, but still hasn't broken the session band above , it's still a long into an unbroken band in the top 33% of the channel, inverse applies"):
// a 5m PP within a quarter sigma of a session band is not a channel edge; the session band past it is the wall her thirds measure to.
export function squeezedPinkOf(L: Line[]): (l: Line) => boolean {
  // fix153: the 3 PM hour reads the squeezed pink like every other hour
  const vw = (L || []).find((l) => String(l.name) === "session VWAP"), u1 = (L || []).find((l) => String(l.name) === "+1σ");
  const sd = vw && u1 ? Math.abs(Number(u1.price) - Number(vw.price)) : 0;
  return (l: Line) => String(l.name) === "5m PP" && sd > 0 && (L || []).some((s) => isSessBand(s) && Math.abs(Number(s.price) - Number(l.price)) < 0.25 * sd);
}
// THE LAUNCH (Oct 20 ~7:50 PM PT, Love picked "Launch rule + drop the poke veto"): a green 5m candle whose low launched from the bottom share of the channel
// price is in now (or from below its floor) stays a long until price reaches the top share; a red candle whose high launched from the top share stays a
// short until price reaches the bottom share. Her calls, the door and the wire all read it the same way.
export function launchSide(asset: string, L: Line[], tick: number, o: number, hl: { h: number; l: number } | null | undefined): "up" | "down" | "" {
  if (!(tick > 0) || !(o > 0) || !hl || !(hl.l > 0) || !(hl.h > 0)) return "";
  const sqzP = squeezedPinkOf(L);
  const C = chanL(asset, L).filter((l) => isChanBand(asset, l) && Number(l.price) > 0 && !sqzP(l));
  const u = C.filter((l) => l.price > tick).sort((a, c) => a.price - c.price)[0], d = C.filter((l) => l.price <= tick).sort((a, c) => c.price - a.price)[0];
  if (!u || !d || !(u.price > d.price)) return "";
  const w = u.price - d.price, k = lockPctFor(asset, w), f = (tick - d.price) / w;
  if (tick > o && hl.l <= d.price + k * w && f < 1 - k) return "up";
  if (tick < o && hl.h >= u.price - k * w && f > k) return "down";
  return "";
}
// THE TURN, FOR THE HEDGE (Oct 21 ~2:27 PM PT, Love: "if our main trade is already in profit, and price gets near a bollinger, a session band, or red zone and
// rejects without actually tapping the band, same rules apply, a candle falling from the band in the top 33% is a short / a candle rising in the bottom 33% is a
// long / so it doesn't need an actual band tap / same way we structured the main book"): her thirds move on the live 5m candle, for engine.ts.
export function turnNow(asset: string, L: Line[], tick: number): "up" | "down" | "" {
  try { return thirdsMove(asset, L, tick, fiveOpenNow(asset), fiveHLNow(asset)); } catch { return ""; }
}
(globalThis as any).__turnNow = turnNow; // the DELAYED twin reads her thirds turn from recon (Oct 21 ~6:18 PM PT, Love: near the band counts too)
export function thirdsMove(asset: string, L: Line[], tick: number, o: number, hl: { h: number; l: number } | null | undefined): "up" | "down" | "" {
  const tap = PINK_TAP[asset] ?? 0;
  if (!(tick > 0) || !hl || !(hl.l > 0) || !(hl.h > 0) || !(tap > 0)) return "";
  const sqzP = squeezedPinkOf(L);
  const C = chanL(asset, L).filter((l) => isChanBand(asset, l) && Number(l.price) > 0 && !sqzP(l));
  const at = (x: number) => { const u = C.filter((l) => l.price > x).sort((a, c) => a.price - c.price)[0]; const d = C.filter((l) => l.price < x).sort((a, c) => c.price - a.price)[0]; return u && d ? { lo: d.price, hi: u.price, w: u.price - d.price } : null; };
  const lo = at(hl.l), hi = at(hl.h);
  const upOk = !!lo && lo.w > 0 && (hl.l - lo.lo) / lo.w <= lockPctFor(asset, lo.w) && tick >= hl.l + tap && (tick - lo.lo) / lo.w < 1 - lockPctFor(asset, lo.w);
  const dnOk = !!hi && hi.w > 0 && (hi.hi - hl.h) / hi.w <= lockPctFor(asset, hi.w) && tick <= hl.h - tap && (hi.hi - tick) / hi.w < 1 - lockPctFor(asset, hi.w);
  if (upOk && !dnOk) return "up";
  if (dnOk && !upOk) return "down";
  return "";
}
// THE FAKE-OUT TURN (fix139, Oct 23 ~9:55 AM PT, Love: "let's make it shorts there anyways ... if price fakes out there she can short once price breaks back under,
// even if there is a pink there so she can get in at the top without waiting for it to break pink - then she's good to sit for a week"): gold only. A session band
// or the pink that 2+ of the last 10 closed 5m candles poked over and closed back under is a ceiling. When price pokes over it again (this 5m candle, or the last
// 1m) and a red 1m candle closes back under it, that is her short - the pink below doesn't hold her, and her 5m candle colour doesn't either (the red 1m close is
// the proof). Mirror for a floor (long). Recon books it; impossibleGeo waives PINK 10%, the pink in TARGET PAST A BAND and HER CANDLE for it.
export function fakeOutTurnNow(asset: string, L: Line[], tick: number): { side: "up" | "down"; name: string; p: number } | null {
  if ((asset !== "gold" && asset !== "btc") || !(tick > 0)) return null; // fix141 (Oct 23 ~1:04 PM PT, Love: "she's clear to enter the other way when that happens for btc too")
  try {
    const fz5 = Math.floor(Date.now() / 300000) * 300, m0 = Math.floor(Date.now() / 60000) * 60;
    const bars: any[] = ((G.__pivBars?.[asset]?.bars ?? []) as any[]).slice().sort((x: any, y: any) => Number(x.t) - Number(y.t));
    const c5: { o: number; h: number; l: number; c: number }[] = [];
    for (let s = fz5 - 3000; s < fz5; s += 300) { const xs = bars.filter((x: any) => Number(x.t) >= s && Number(x.t) < s + 300); if (xs.length >= 3) c5.push({ o: Number(xs[0].o), h: Math.max(...xs.map((x: any) => Number(x.h))), l: Math.min(...xs.map((x: any) => Number(x.l))), c: Number(xs[xs.length - 1].c) }); }
    const inF = bars.filter((x: any) => Number(x.t) >= fz5);
    const done1 = bars.filter((x: any) => Number(x.t) < m0), k1 = done1[done1.length - 1];
    if (!k1 || Number(k1.t) < m0 - 120) return null;
    const hiF = Math.max(tick, Number(k1.h), ...inF.map((x: any) => Number(x.h))), loF = Math.min(tick, Number(k1.l), ...inF.map((x: any) => Number(x.l)));
    const FB = (L || []).filter((l: Line) => /σ$|^session VWAP$|^5m [RS]1$|^(Green|Red) zone$/.test(String(l.name)) && Number(l.price) > 0 /* fix140: session bands only; fix181 (Oct 24 ~11:16 PM PT, Love: "adding them in for red and green zones is actually a really good idea too, let's do it"): + green (5m S1) / red (5m R1) zone */).map((l: Line) => ({ n: String(l.name) === "5m S1" || String(l.name) === "Green zone" ? "the green zone" : String(l.name) === "5m R1" || String(l.name) === "Red zone" ? "the red zone" : String(l.name), p: Number(l.price) }));
    const sbT = (L || []).filter((l: Line) => /σ$|^session VWAP$/.test(String(l.name)) && Number(l.price) > 0).map((l: Line) => Number(l.price));
    const abT = Math.min(...sbT.filter((x) => x > tick), Infinity), beT = Math.max(...sbT.filter((x) => x < tick), -Infinity);
    const fD25 = Number(G.__pinkCap5) > 0 ? Infinity /* fix266: the Poly 5m board counts pokes as it did Sun Oct 25 3:45-10:32 PM PT (Love Oct 26 9:09 AM PT: "please go back over our last messages yesterday and rebuild a twin EXACTLY. from that configuration, nothing different whatsoever") */ : Number.isFinite(abT) && Number.isFinite(beT) && abT > beT ? 0.25 * (abT - beT) : Infinity; // fix252: 25% of her channel (Love Oct 22 / Oct 26)
    for (const B of FB) {
      const fT = asset === "btc" ? 10 : 0.3; /* fix180 (Oct 24 ~11:14 PM PT, Love: "it did break a session band and fakeout thru them" - the 10:45/10:50 PM BTC candles opened and closed within $3-7 of -1σ and wicked $60-90 under, so the strict open-over/close-over count missed them): a poke counts when the candle opens and closes no further than her tap past the band ($10 BTC / 30c gold) and its wick runs past that tap */ const upF = c5.filter((k) => k.o < B.p + fT && k.h > B.p + fT && k.c < B.p + fT && k.h - Math.max(k.o, k.c) >= fT && k.h - B.p <= fD25).length, dnF = c5.filter((k) => k.o > B.p - fT && k.l < B.p - fT && k.c > B.p - fT && Math.min(k.o, k.c) - k.l >= fT && B.p - k.l <= fD25).length;
      if (upF >= 2 && hiF > B.p && tick < B.p && Number(k1.c) < B.p && Number(k1.c) < Number(k1.o)) return { side: "down", name: B.n, p: B.p };
      if (dnF >= 2 && loF < B.p && tick > B.p && Number(k1.c) > B.p && Number(k1.c) > Number(k1.o)) return { side: "up", name: B.n, p: B.p };
    }
  } catch {}
  return null;
}
(globalThis as any).__fakeOutTurn = fakeOutTurnNow;
// ADD-ONS OBEY THE PINK (fix182, Oct 24 ~11:22 PM PT, Love: "she just shorted into the pink band again? it hasn't broken through" - the 11:20 PM free add-on shorted
// $19 over the unbroken pink): a free add-on still skips the other walls, but not the pink cushion - no short add-on over an unbroken pink within the cushion
// (BTC $50 minimum, else 15% of the session channel under $1k, 10% from $1k; gold 10%), no long add-on under one. Same numbers as the PINK 10% wall.
export function pinkAddOnWall(asset: string, side: string): string {
  try {
    const lb = G.__lawBands?.[asset], q = quoteTick(asset);
    if (!lb || !Array.isArray(lb.L) || !q || !(q.c > 0)) return "";
    const tick = q.c, L: Line[] = lb.L;
    const sb = L.filter((l: Line) => /σ$|^session VWAP$/.test(String(l.name)) && Number(l.price) > 0).map((l: Line) => Number(l.price));
    const below = Math.max(...sb.filter((p) => p < tick), -Infinity), above = Math.min(...sb.filter((p) => p > tick), Infinity);
    if (!Number.isFinite(below) || !Number.isFinite(above)) return "";
    const wc = above - below, cush = asset === "btc" ? (wc <= 100 ? 25 /* fix293 (Oct 26 3:30 PM PT, Love: "set the standard if no trades into pink within $25 if band channel width is under $100 so we don't need to keep adjusting day to day"): BTC channel under $100 -> $25 pink cushion, every book */ : Math.max(50, 0.10 * wc) /* fix298 (Oct 26 ~10:22 PM PT, Love: "btc is $50 at band widths of $180 + hun / $50 or 10% / whichever comes first / pls reinforce that / $25 only stands at $100 and under bb"): BTC $25 at $100 and under, else max($50, 10%) */) : 0.1 * wc, pbd = asset === "btc" ? 3 : (BREAK_DIST[asset] ?? 0);
    for (const pl of L.filter((l: Line) => String(l.name) === "5m PP" && Number(l.price) > 0)) {
      const pp = Number(pl.price);
      if (side === "up" && pp > tick - pbd && pp - tick <= cush) return `PINK HOLDS THE ADD-ON: long $${(pp - tick).toFixed(2)} under the unbroken pink (${pp.toFixed(2)}), cushion $${cush.toFixed(2)}`;
      if (side === "down" && pp < tick + pbd && tick - pp <= cush) return `PINK HOLDS THE ADD-ON: short $${(tick - pp).toFixed(2)} over the unbroken pink (${pp.toFixed(2)}), cushion $${cush.toFixed(2)}`;
    }
  } catch {}
  return "";
}
export function impossibleGeo(asset: string, L: Line[], tick: number, side: string, twinFade = false, twinPinkAll = false, togpLoose = false /* fix286: the no-pink copy */, rejNoAhead = false /* fix317: the rejection model */, noBBTarget = false /* fix318: rejection model + main */, zoneGuard = 0 /* fix323 */, flipRule = false /* fix325 */, npPink = false /* fix363: the pure no-pink - pink holds only stacked in the outer 10% */): { why: string; below: number | null; above: number | null; pos: number | null; lock: number | null } {
  // BTC PINK TO GREEN / PINK TO RED (fix323, Oct 27 ~11:11 AM PT, Love: "how far through the channel was she from the distance from pink to green? we can set it up to be
  // the bottom 40% and the top 40% of that distance pls" + card "Main only" - 11:00 AM main BTC short "Failed break above Green zone"): gold's PINK TO GREEN / RED on BTC at 40%:
  // no short in the bottom 40% of the green (5m S1) -> pink (5m PP) space, no long in the top 40% of the pink -> red (5m R1) space.
  if (zoneGuard > 0 && asset === "btc") { const zP = Number((L || []).find((l: Line) => String(l.name) === "5m PP")?.price) || 0, zS1 = Number((L || []).find((l: Line) => String(l.name) === "5m S1")?.price) || 0, zR1 = Number((L || []).find((l: Line) => String(l.name) === "5m R1")?.price) || 0;
    if (side === "down" && zP > 0 && zS1 > 0 && zS1 < zP && tick > zS1 && tick < zP && (tick - zS1) / (zP - zS1) <= zoneGuard) return { why: `PINK TO GREEN (BTC): short at ${Math.round((tick - zS1) / (zP - zS1) * 100)}% of the green ${zS1.toFixed(2)} -> pink ${zP.toFixed(2)} space - no short in the bottom ${Math.round(zoneGuard * 100)}%.`, below: null, above: null, pos: null, lock: null };
    if (side === "up" && zP > 0 && zR1 > zP && tick > zP && tick < zR1 && (tick - zP) / (zR1 - zP) >= 1 - zoneGuard) return { why: `PINK TO RED (BTC): long at ${Math.round((tick - zP) / (zR1 - zP) * 100)}% of the pink ${zP.toFixed(2)} -> red ${zR1.toFixed(2)} space - no long in the top ${Math.round(zoneGuard * 100)}%.`, below: null, above: null, pos: null, lock: null }; }
  // ANY BAND CUSHION (fix368, Oct 27 2026 ~9:40 PM PT, Love: "hun she keeps longing into unbroken bands pls fix her" + card "How should the pure no-pink treat unbroken bands above a long?" -> "$1 gold / $25 BTC, any band"): PURE NO-PINK only (npPink) -
  // no long with ANY unbroken band (pink, purple, session sigma/VWAP, Bollinger, red/green zone) within $1 gold / $25 BTC above her; mirror for shorts. She waits for the break, then the next band's rejection. 9:35 PM gold long at 4041.2 sat 50-70c under purple/blue/pink.
  if (npPink) { const w369 = (() => { const vw = Number((L || []).find((l: Line) => String(l.name) === "session VWAP")?.price) || 0, u1 = Number((L || []).find((l: Line) => String(l.name) === "+1σ")?.price) || 0; return vw > 0 && u1 > 0 ? Math.abs(u1 - vw) : 0; })(); const cu368 = asset === "gold" ? 1 : (w369 >= 180 ? 0.10 * w369 : 10) /* fix369 (Oct 27 2026 9:53 PM PT, Love: "bands are only about $130 apart right now , btc can stay $10 at bands under $150 , gold can stay $1 / every time band width doubles (eg 300) triple the tolerance / so $30 at $300 , / basically just 10% lol / $10 under $180 is okay for rn though"): BTC $10 while her session bands sit under $180 apart, 10% of the width at $180+; gold $1 */; const bx368: [string, number][] = (L || []).filter((l: Line) => /σ$|VWAP$|^5m (PP|R1|S1|R2|S2)$|^BB (upper|lower)$|^Bollinger (upper|lower)$/.test(String(l.name))).map((l: Line) => [String(l.name), Number(l.price)] as [string, number]);
    try { const zB = G.__bbsr?.[asset]; if (zB && Date.now() - Number(zB.at) <= 20000) { if (Number(zB.bbU) > 0) bx368.push(["Bollinger upper", Number(zB.bbU)]); if (Number(zB.bbL) > 0) bx368.push(["Bollinger lower", Number(zB.bbL)]); } } catch {}
    try { const bn = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.[asset]; for (const k of ["m5", "m10", "m15"]) if (Number(bn?.nav?.[k]?.c) > 0) bx368.push([`${k.slice(1)}m purple`, Number(bn.nav[k].c)]); } catch {}
    for (const [nm, p] of bx368) { if (!(p > 0)) continue;
      if (side === "up" && p > tick && p - tick <= cu368) return { why: `ANY BAND CUSHION (pure no-pink): long ${(p - tick).toFixed(2)} under the unbroken ${nm} (${p.toFixed(2)}) - inside ${asset === "gold" ? "$1" : "$" + cu368.toFixed(0)} she waits for it to break, then the next band (fix368/369).`, below: null, above: p, pos: null, lock: null };
      if (side === "down" && p < tick && tick - p <= cu368) return { why: `ANY BAND CUSHION (pure no-pink): short ${(tick - p).toFixed(2)} over the unbroken ${nm} (${p.toFixed(2)}) - inside ${asset === "gold" ? "$1" : "$" + cu368.toFixed(0)} she waits for it to break, then the next band (fix368/369).`, below: p, above: null, pos: null, lock: null }; } }
  const sqzE = squeezedPinkOf(L);
  const edges = chanL(asset, L).filter((l: Line) => isChanBand(asset, l) && !sqzE(l)).map((l: Line) => Number(l.price)).filter((x: number) => x > 0).sort((x: number, y: number) => x - y);
  if (!(tick > 0) || edges.length < 2) return { why: "THE IMPOSSIBILITY: her bands can't be read - no opening order", below: null, above: null, pos: null, lock: null };
  // BANDS JUMPED (fix104, Oct 22 ~7:30 PM PT - the 7:00 PM gold short at 3990.72 read a session sigma of $2,509 for a few seconds at the top of the hour,
  // so price 'sat in the top third' of a nonsense channel): when sigma jumps past 3x the last good read (within 10 min), her bands can't be read - no opening order.
  if (!G.__stDefaultReach) { try { const vwJ = Number((L || []).find((l: Line) => String(l.name) === "session VWAP")?.price) || 0, u1J = Number((L || []).find((l: Line) => String(l.name) === "+1σ")?.price) || 0, sdJ = Math.abs(u1J - vwJ);
    if (vwJ > 0 && sdJ > 0) { const GJ = ((G.__sdGood ||= {}) as Record<string, { sd: number; t: number }>), gj = GJ[asset];
      if (gj && Date.now() - gj.t < 600000 && sdJ > 3 * gj.sd) return { why: `THE IMPOSSIBILITY: her session bands just jumped (sigma ${sdJ.toFixed(2)} vs ${gj.sd.toFixed(2)} a moment ago) - can't be read, no opening order`, below: null, above: null, pos: null, lock: null };
      GJ[asset] = { sd: sdJ, t: Date.now() }; } } catch {} }
  // NO SHORTS IN THE BOTTOM RUNG (fix296, Oct 26 ~10:07 PM PT, Love: "yes let's cut shorts in the bottom wrung pls bb / just those for rn oki / she can continue to
  // trade the longs up afterwards" - BTC main/rejection/copy shorts under session -2σ since Oct 20: 23 trades 30% win -$133, live 1 of 7): on BTC no short opens
  // while price sits under the session -2σ (the -2σ -> -3σ rung and past it). Longs there stay hers.
  if (asset === "btc" && side === "down") { const d2 = Number((L || []).find((l: Line) => String(l.name) === "-2σ")?.price) || 0;
    if (d2 > 0 && tick < d2) return { why: `NO SHORTS IN THE BOTTOM RUNG: btc short at ${tick.toFixed(2)} is under the session -2σ (${d2.toFixed(2)}) - longs only down here.`, below: null, above: null, pos: null, lock: null }; }
  // NO CHASE PAST 2σ - DROPPED (Oct 21 ~11:12 AM PT, Love picked "Drop the 2σ rule": on this morning's trend BTC rode 2-2.1σ for hours and every call
  // became a short). Longs past 2σ (shorts past -2σ) open again under her thirds and HER CANDLE.
  // THE WHOLE CHANNEL'S TOP AND BOTTOM LINES (Oct 21 ~11:15 AM PT, Love: "the TOP line, of the whole channel, and the BOTTOM line. of the whole channel. she can't
  // trade the breaks in the direction of those. she can trade the rejections of the bottom line or top line of the whole channel, not the breaks of them"):
  // no long above her top session band, no short below her bottom one. A short back off the top line (a long off the bottom) is still hers.
  { const topL = edges[edges.length - 1], botL = edges[0];
    if (side === "up" && tick > topL) return { why: `THE TOP LINE: long at ${tick.toFixed(2)} over the top of her whole channel (${topL.toFixed(2)}) - never trade its break; a rejection back under it is a short.`, below: topL, above: null, pos: null, lock: null };
    if (side === "down" && tick < botL) return { why: `THE BOTTOM LINE: short at ${tick.toFixed(2)} under the bottom of her whole channel (${botL.toFixed(2)}) - never trade its break; a rejection back over it is a long.`, below: null, above: botL, pos: null, lock: null }; }
  const below0 = edges.filter((x: number) => x <= tick).pop(), above0 = edges.find((x: number) => x > tick);
  // BEYOND EVERY BAND (Oct 21 ~9:57 AM PT, Love picked "Close it" - at 2:34 AM PT the DELAYED twin shorted BTC on a rising 5m candle $33 over every band,
  // because this used to return here before her thirds and HER CANDLE): out past the last band, the outermost channel is her channel (price sits past
  // its far edge), so ONLY IN HER THIRD (with the launch waiver) and HER CANDLE still hold. No unbroken band lies past price, so THE IMPOSSIBILITY doesn't apply.
  const beyond = below0 === undefined || above0 === undefined;
  const below = beyond ? (above0 === undefined ? edges[edges.length - 2] : edges[0]) : below0!, above = beyond ? (above0 === undefined ? edges[edges.length - 1] : edges[1]) : above0!;
  const foTurn = ((): boolean => { try { const f = fakeOutTurnNow(asset, L, tick); return !!f && f.side === side; } catch { return false; } })(); // fix139
  if (!(above > below)) return { why: "", below: below0 ?? null, above: above0 ?? null, pos: null, lock: null };
  const pos = (tick - below) / (above - below);
  const IMPOSSIBLE = (flipRule || (togpLoose && !npPink)) && asset === "btc" && above - below <= 500 ? 0.33 /* fix379 (Oct 28 2026 1:06 AM PT, Love card "How much room should BTC longs need under an unbroken session band?" -> "Top/bottom 33% instead of 20%" + "yes pls all of them for sure" - 1:01 AM the copy longed BTC at 81008.24, 77% of the 80925 -> 81033 channel, $3 under the 20% line): MAIN, REJECTION MODEL, NO-PINK COPY, btc - top/bottom 33% under $500 wide (fix160), even when fix219 would lock only 20%; over $500 stays 20% */ : togpLoose && asset === "gold" && above - below < 10 ? 0.33 /* fix351 (Oct 27 2026 5:50 PM PT, Love: "why did she long in the top 33% of the channel ….?" + card "Should tiny gold channels lock 33% instead of 20%, and on which books?" -> "33% on the copy only"): the no-pink copy's gold thirds are 33% under $10, fix219's 20% for one-sigma channels stands down for her only */ : lockPctFor(asset, above - below);
  const pctTxt = Math.round(IMPOSSIBLE * 100);
  // GOLD 3-5 PM, TIGHT BANDS (fix344, Oct 27 2026 4:31 PM PT, Love: "but just have her not skip because one is in the way until they reach a width of $2 or more /
  // have her trade the pinks green red and bollingers and she'll be good bb" + card "Which walls step aside on gold 3-5 PM while session bands are under $2 apart?" ->
  // "Thirds + pink 10% step aside" - Love named Cornerstone 2 for this slice only): on gold from 3:00 to 4:59 PM PT, while the session channel around price is under
  // $2 wide, THE IMPOSSIBILITY / ONLY IN HER THIRD and PINK 10% do not refuse main, the rejection model or the no-pink copy. Her candle flip, the zone walls and the
  // Bollinger cushion still judge. At $2+ apart everything is as before.
  const tight344 = asset === "gold" && (flipRule || togpLoose) && (above - below) < 2 && (() => { try { const h = Number(PT_HOUR_Q.format(new Date())); return h === 15 || h === 16; } catch { return false; } })();
  // THE BLUE VWAP STAYS A WALL (fix344b, Oct 27 2026 4:32 PM PT, Love: "thanks love 💘💘 but do consider the main blue vwap a wall for her to wait for a flip or
  // rejection off of pls"): inside that slice, when the unbroken band in her way is the session VWAP (above a long, below a short), her thirds still hold - she waits
  // for price to flip through the VWAP or reject off it.
  const vw344 = Number((L || []).find((l: Line) => String(l.name) === "session VWAP")?.price) || 0;
  const tightUp = tight344 && !(vw344 > 0 && Math.abs(above - vw344) < 0.005), tightDn = tight344 && !(vw344 > 0 && Math.abs(below - vw344) < 0.005);
  let why = "";
  if (!tightUp && !beyond && side === "up" && pos >= 1 - IMPOSSIBLE) why = `THE IMPOSSIBILITY: long at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - the top ${pctTxt}%, into the unbroken band above. never.`;
  if (!tightDn && !beyond && side === "down" && pos <= IMPOSSIBLE) why = `THE IMPOSSIBILITY: short at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - the bottom ${pctTxt}%, into the unbroken band below. never.`;
  // BREAK INTO A ZONE (fix238, Oct 25 ~9:25 PM PT, Love: "do her trades that break a session band and go right into a red zone or green zone typically do well ..?
  // or do they reverse almost immediately afterwards ... is this another one of the bleeds" -> "yeeeup we stopping bleeds bb"; ~/brkzone.py, 3,260 recon calls Oct 20-26:
  // a break landing inside a zone 28 trades 50% -$113, gold break with a zone ahead before the next band 107 trades 46% -$296, BTC with a zone ahead 123 trades +$170):
  // when this 5m candle broke a session band (VWAP / σ) her way, no trade that lands inside the red zone (long, 5m R1-R2) or green zone (short, S2-S1), either asset;
  // on gold also no trade with that zone ahead of price before the next session band.
  if (!why && (side === "up" || side === "down")) { try {
    const o5Z = fiveOpenNow(asset), pxZ = (n: string) => Number((L || []).find((l: Line) => String(l.name) === n)?.price) || 0;
    const sessZ = (L || []).filter((l: Line) => /σ$|VWAP$/.test(String(l.name))).map((l: Line) => Number(l.price)).filter((x: number) => x > 0);
    const r1Z = pxZ("5m R1"), r2Z = pxZ("5m R2"), s1Z = pxZ("5m S1"), s2Z = pxZ("5m S2");
    if (o5Z > 0 && r1Z > 0 && r2Z > 0 && s1Z > 0 && s2Z > 0) {
      if (side === "up") { const brZ = sessZ.filter((b: number) => o5Z < b && b < tick).sort((x: number, y: number) => y - x)[0], nxZ = Math.min(...sessZ.filter((b: number) => b > tick), Infinity);
        if (brZ && tick >= r1Z && tick < r2Z) why = `BREAK INTO A ZONE: long broke ${brZ.toFixed(2)} and landed inside the red zone (${r1Z.toFixed(2)}-${r2Z.toFixed(2)}) - those reverse; no long here.`;
        else if (brZ && asset === "gold" && tick < r1Z && r1Z < nxZ && r1Z - tick < 3 /* fix310: Love Oct 27 2:15 AM "we can make that $3 hun" - $3 clearance */ && !rejNoAhead /* fix317 */) why = `BREAK INTO A ZONE: gold long broke ${brZ.toFixed(2)} with the red zone (${r1Z.toFixed(2)}) ahead before the next band - those reverse; no long here.`;
        // RED ZONE OVER A BAND (fix242, Oct 25 10:11 PM PT, card "Any red zone over a band" + 10:13 PM "half one zone height is good hun"): gold's 10 PM long sat in the red zone right over +2σ it had broken a candle earlier.
        if (!why && tick >= r1Z && tick < r2Z) { const bZ = sessZ.filter((b: number) => b < tick && b >= r1Z - (r2Z - r1Z) / 2).sort((x: number, y: number) => y - x)[0];
          if (bZ) why = `RED ZONE OVER A BAND: long inside the red zone (${r1Z.toFixed(2)}-${r2Z.toFixed(2)}) sitting right over the band ${bZ.toFixed(2)} - those reverse; no long here.`; } }
      else { const brZ = sessZ.filter((b: number) => tick < b && b < o5Z).sort((x: number, y: number) => x - y)[0], nxZ = Math.max(...sessZ.filter((b: number) => b < tick), -Infinity);
        if (brZ && tick <= s1Z && tick > s2Z) why = `BREAK INTO A ZONE: short broke ${brZ.toFixed(2)} and landed inside the green zone (${s2Z.toFixed(2)}-${s1Z.toFixed(2)}) - those reverse; no short here.`;
        else if (brZ && asset === "gold" && tick > s1Z && s1Z > nxZ && tick - s1Z < 3 /* fix310: $3 clearance */ && !rejNoAhead /* fix317 */) why = `BREAK INTO A ZONE: gold short broke ${brZ.toFixed(2)} with the green zone (${s1Z.toFixed(2)}) ahead before the next band - those reverse; no short here.`;
        if (!why && tick <= s1Z && tick > s2Z) { const bZ = sessZ.filter((b: number) => b > tick && b <= s1Z + (s1Z - s2Z) / 2).sort((x: number, y: number) => x - y)[0];
          if (bZ) why = `GREEN ZONE UNDER A BAND: short inside the green zone (${s2Z.toFixed(2)}-${s1Z.toFixed(2)}) sitting right under the band ${bZ.toFixed(2)} - those reverse; no short here.`; } }
    }
  } catch {} }
  // ONE RUNG OUT (fix109, Oct 22 ~7:48 PM PT, Love: "she just shorted btc into an unbroken band off the bollinger rejection" - 7:45 PM BTC short at 81753.72,
  // $17 over +3σ 81736, the top of her whole channel): out past the last band, THE IMPOSSIBILITY still guards it - no short over the top band within the
  // card "Any short above it" + Love 7:47 PM "just on the break down is fine bb": no short at all over the top band (no long under the bottom band) - she
  // shorts once price breaks back down through it.
  if (!why && beyond) {
    if (side === "down" && above0 === undefined && tick > above) why = `THE IMPOSSIBILITY: short $${(tick - above).toFixed(2)} over the top band (${above.toFixed(2)}) - no short up here until price breaks back down through it.`;
    if (side === "up" && below0 === undefined && tick < below) why = `THE IMPOSSIBILITY: long $${(below - tick).toFixed(2)} under the bottom band (${below.toFixed(2)}) - no long down here until price breaks back up through it.`; }
  // PINK FIRST (Oct 21 ~8:28 PM PT, Love - the 8:15 PM BTC long off -2σ with the pink $50 above in the bottom 20% reversed at the pink: "she didn't wait for price
  // to break the pink before entering, let's keep that in place for future trades if they're both in the bottom/top 20% of the channel, or the 33% of the channel
  // when they open and contract / if pink doesn't break she can skip"): when the unbroken pink sits in the outer share of her channel (sliding 20%/33%) between
  // price and the far side, no long under it (no short over it in the top share) until price breaks through the pink. Rejections off the pink stay hers.
  // Oct 21 ~8:32 PM PT, Love on the 8:30 PM BTC long (pink at 22% of the channel): "if the pink band is this close to the band below or above let's have her wait
  // for pink to break before entering" - so the pink's zone is the outer third (or the sliding share, whichever reaches further).
  // Oct 22 ~3:35 AM PT, Love picked "Yes, 10% replaces it on BTC": on BTC the PINK 10% cushion above is the pink rule; PINK FIRST stays for gold.
  if (!why && !beyond && false) { // fix62 (Oct 22 ~3:50 AM PT, Love: gold on the same 10% as BTC) - PINK FIRST retired, PINK 10% is the pink rule for both
    const wch = above - below, PF = Math.max(IMPOSSIBLE, 0.33), pfTxt = Math.round(PF * 100);
    for (const pl of (L || []).filter((l: Line) => String(l.name) === "5m PP" && Number(l.price) > 0)) {
      const pp = Number(pl.price), f = (pp - below) / wch;
      if (!why && side === "up" && pp > tick && f >= 0 && f <= PF) why = `PINK FIRST: long under the unbroken pink (${pp.toFixed(2)}) in the bottom ${pfTxt}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - wait for pink to break up, or skip.`;
      if (!why && side === "down" && pp < tick && f <= 1 && f >= 1 - PF) why = `PINK FIRST: short over the unbroken pink (${pp.toFixed(2)}) in the top ${pfTxt}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - wait for pink to break down, or skip.`;
    }
  }
  // PINK 10% (Oct 22 ~3:20 AM PT, Love: "pink can remain a solid 10% of the channels distance, meaning no longs or short into it within $50 at a band channel
  // width of $500"): on BTC, no long with the unbroken pink above price within 10% of the channel width, no short with it below within 10%. Once it breaks, she's clear.
  if (!why && !beyond) {
    const w10b = (asset === "gold" ? 0.1 : 0.10 /* fix157 (Oct 23 ~7:05 PM PT, Love: "we can make it 10% temporarily hun"): BTC back to 10% */ /* fix136 (Oct 23 ~1:40 AM PT, Love card): BTC pink cushion 15% */ /* gold 10% (Oct 22 ~11:18 AM PT, Love: "for right now let's do 10%, she can long with $2.50+ of room on the next ones", to move with the scale later) */ /* gold back to 15% (Oct 22 ~9:22 AM PT, Love: "if we are waiting for a rejection or a break through we should bring it as close as possible / let's bring back to 15%") */) * (above - below); const w10f = asset === "btc" ? Math.max(50, (above - below) >= 1000 ? 0.05 * (above - below) : (above - below) >= 500 ? 0.10 * (above - below) : 0) : w10b; /* fix179 (Oct 24 ~10:53 PM PT, Love: "let's just make it the $500 @ 10% & 1k at 5%, for the bollinger cushion, not to short or long into, and a minimum of $50 under that"): BTC Bollinger cushion = 10% of channel from $500, 5% from $1k, never under $50 */ /* fix161 (Oct 24 ~7:59 AM PT, Love card "Pink cushion floor $50 on BTC"): BTC never within $50 of an unbroken pink */ // fix70 (Oct 22 ~7:05 AM PT, Love: "she was right under the pink band ... may need to tighten that up a bit" + card: gold 20%%) // fix65 (Oct 22 ~6:10 AM PT, Love: "the 15% rule for the pink band was for gold , we can keep btc at the 10%")
    const w10 = asset === "btc" ? ((above - below) <= 100 ? 25 /* fix293 (Oct 26 3:30 PM PT, Love: "set the standard if no trades into pink within $25 if band channel width is under $100 so we don't need to keep adjusting day to day"): BTC channel under $100 -> $25 pink cushion, every book */ : Math.max(50, 0.10 * (above - below)) /* fix298 (Oct 26 ~10:22 PM PT, Love: "btc is $50 at band widths of $180 + hun / $50 or 10% / whichever comes first / pls reinforce that / $25 only stands at $100 and under bb") */) /* fix182 (Oct 24 ~11:23 PM PT, Love: "let's make that $50 minimum and the rest of the scale up from there") */ : w10b; // fix179 (Oct 24 ~10:53 PM PT, Love: "for pink we will have it at a solid 15% at bands $200 and under/over and 15% at $500, 10% at 1k"): BTC pink cushion 15% of channel under $1k, 10% from $1k; gold unchanged. Was fix174 (Oct 24 ~9:41 PM PT, Love: "let's go ahead and bring that back to 10% of the channel width for the moment hun i didn't realize the whole channel was still $200 rn"): the pink cushion is plain 10% again on BTC (no $50 floor); the Bollinger cushion keeps its $50 baseline (w10f)
    // GOLD: MEASURE FROM THE BAND SHE REJECTED (Oct 22 ~1:20 PM PT, Love: "the rejection started at 4021 hun, the distance should be measured as the distance
    // between the green zone and the pink line / if that distance is over $3 she is clear to engage at the rejection at her current scale"): on gold, when the
    // last two 5m candles' low came within $0.50 of the nearest band under price (zone, session band, Bollinger) and that band sits more than $3 under the pink,
    // the long off that rejection clears the pink cushion. Mirror for shorts off a band over price, more than $3 over the pink.
    let pinkRoom = false;
    try {
      if (asset === "gold") {
        const ppG = Number((L || []).find((l: Line) => String(l.name) === "5m PP")?.price) || 0;
        const zG = G.__bbsr?.gold;
        const bandsG = [...(L || []).filter((l: Line) => String(l.name) !== "5m PP").map((l: Line) => Number(l.price)), ...(zG && Date.now() - Number(zG.at) <= 20000 ? [Number(zG.bbU) || 0, Number(zG.bbL) || 0] : [])].filter((p) => p > 0);
        const f0G = (Math.floor(Date.now() / 300000) - 1) * 300;
        const barsG: any[] = (G.__pivBars?.gold?.bars ?? []).filter((x: any) => Number(x.t) >= f0G);
        if (ppG > 0 && barsG.length) {
          const loG = Math.min(...barsG.map((x: any) => Number(x.l))), hiG = Math.max(...barsG.map((x: any) => Number(x.h)));
          if (side === "up" && ppG > tick) { const bb = Math.max(...bandsG.filter((p) => p < tick), 0); if (bb > 0 && Math.abs(loG - bb) <= 0.5 && ppG - bb > 3.5 && ppG - tick > 2) pinkRoom = true; /* fix89 (Oct 22 ~1:35 PM PT, Love: "let's make that $3.50 ... as long as she doesn't actually enter into the position within $2 of the pink band") */ }
          if (side === "down" && ppG < tick) { const ba = Math.min(...bandsG.filter((p) => p > tick), Infinity); if (Number.isFinite(ba) && Math.abs(hiG - ba) <= 0.5 && ba - ppG > 3.5 && tick - ppG > 2) pinkRoom = true; }
        }
      }
    } catch { pinkRoom = false; }
    // THE TWIN IS FREE OF THE PINK (fix187, Oct 25 ~1:47 AM PT, Love: "the twin is supposed to be absolved of the pink remember?" - her Oct 22 11:22 PM words "pink ok to
    // short into ... just not the session bands", "only for the delayed book once the main book is in a trade the other side"; fix124 only freed the pink in TARGET PAST A
    // BAND, so the PINK 10% cushion still refused her - 1:17 AM BTC twin long $30 under the pink): in her twin hours (twinFade) the DELAYED book skips the PINK 10%
    // cushion. Session bands, the Bollinger cushion, her 33% and every other wall still judge her.
    for (const pl of (L || []).filter((l: Line) => String(l.name) === "5m PP" && Number(l.price) > 0 && !pinkRoom && !(foTurn && asset !== "btc") && !twinFade && !twinPinkAll)) { // fix272 (Oct 26 11:12 AM PT, Love card "Yes, pink-free every hour" - "the twin is supposed to be exempt from pink. never said it was only on the hours she trades"): the DELAYED twin skips PINK 10% in every hour // fix139: the fake-out turn goes in over the pink // fix163 (Oct 24 ~10:35 AM PT, Love card): on BTC the pink wall holds the fake-out turn too (gold keeps the waiver)
      const pp = Number(pl.price);
      if (!why && npPink) { const cu367 = asset === "gold" ? 0.5 : 25, bk367 = asset === "gold" ? 0.25 : 3; if (side === "up" && pp > tick - bk367 && pp - tick <= cu367) why = `PINK CUSHION (pure no-pink): long ${asset === "gold" ? "" : "$"}${(pp - tick).toFixed(2)} under the unbroken pink (${pp.toFixed(2)}) - inside ${asset === "gold" ? "50c" : "$25"} she waits for price to break up through the pink first (fix367).`; if (side === "down" && pp < tick + bk367 && tick - pp <= cu367) why = `PINK CUSHION (pure no-pink): short ${asset === "gold" ? "" : "$"}${(tick - pp).toFixed(2)} over the unbroken pink (${pp.toFixed(2)}) - inside ${asset === "gold" ? "50c" : "$25"} she waits for price to break down through the pink first (fix367).`; } // fix367 (Oct 27 2026 ~9:40 PM PT, Love: "yess that's good hunni 💞 wait for a break or a candle flip as normal"): PURE NO-PINK only - no long within 50c gold / $25 BTC under an unbroken pink (mirror for shorts); near a band the flip is price across it, so she goes on the break (25c gold / $3 BTC through). Every other pink still blows through (fix363).
      if (!why && togpLoose && !npPink /* fix363 */ && asset === "btc") { const flp346 = (() => { try { return anyFlipNow(asset, side, tick); } catch { return false; } })(); if (side === "up" && pp > tick - 3 && pp - tick <= 33 /* fix346b (Love 5:19 PM PT: "no let's keep that$33 bb not $10") */ /* fix350: break only, no colour waiver */) why = `PINK $33 (copy): long $${(pp - tick).toFixed(2)} under the unbroken pink (${pp.toFixed(2)}) - inside $33 she waits for price to break up through the pink first (fix350).`; if (side === "down" && pp < tick + 3 && tick - pp <= 33 /* fix350 */) why = `PINK $33 (copy): short $${(tick - pp).toFixed(2)} over the unbroken pink (${pp.toFixed(2)}) - inside $33 she waits for price to break down through the pink first (fix350).`; } // fix346 (Oct 27 2026 ~5:16 PM PT, Love: "we need to keep the pink wall a minimum of 25c at this scale ok bb" / "oh that's btc sorry lol let's make that $10" / "a trade near a pink that hasn't broken thru always needs a break or a candle flip hun, never without confirmation into it"): NO-PINK COPY, BTC only - within $10 of an unbroken pink (broken = $3 through) she needs a 1-5m flip her way, stacked or not
      const flp347 = togpLoose && (() => { try { return anyFlipNow(asset, side, tick); } catch { return false; } })(); // fix347 (Oct 27 2026 5:35 PM PT, Love card "Should the no-pink copy use main's sliding pink scale?" -> "Copy gets main's sliding scale"; 5:32 PM: "we need to come up with a sliding scale again hun ... so we can let her stay put ok"): the copy reads pink on main's sliding scale (BTC $25 at <=$100, $50 or 10% above; gold 10% or $2), a 1-5m flip her way or the break lets her go
      if ((rejNoAhead || npPink /* fix363 (Love Oct 27 2026 8:32 PM PT: "as for pink holds on the new no-pink one, she only does it if the pink band and the session occupy the same bottom/top 10% of the channel pls / otherwise the rejections should blow right thru"): the pure no-pink keeps the pink only when it sits in the outer 10% */ /* fix347: the copy no longer skips here (was "|| togpLoose", fix332) - rejection model keeps stacked-only */) && above > below && (pp - below) / (above - below) > 0.10 && (pp - below) / (above - below) < 0.90) continue; // fix319 (Oct 27 ~6:23 AM PT, Love: "make her only wait for pink to clear if it is in the top 10% or bottom 10% of the channel" + card "Rejection model only")
      const pbd = asset === "gold" && flipRule && !rejNoAhead ? 0.25 /* fix338 (Oct 27 2026 ~1:26 PM PT, Love: "yes let's bring it down to 25c for the time being"): MAIN only - gold pink counts as broken 25c through (was 33c); every other book keeps BREAK_DIST */ : asset === "btc" ? 3 /* fix166 (Oct 24 ~5:09 PM PT, Love: "we can lower it from $5 to $3") */ : (BREAK_DIST[asset] ?? 0); // fix162 (Oct 24 ~10:17 AM PT, Love: "make it a break of $5 bb"; gold keeps its 33c): the pink counts as broken only once price is past it by her break distance - a tick through is still unbroken
      // THE 5M PINK CUSHION (fix199, Oct 25 ~3:50 AM PT, Love: "let's loosen it to $25 on there bb"): on Polymarket's 5m board the BTC pink cushion is $25 at most.
      let w10e = asset === "btc" && Number(G.__pinkCap5) > 0 ? Math.min(w10, Number(G.__pinkCap5)) : asset === "gold" ? Math.max(w10, 2) : w10; // fix262 (Oct 26 ~2:50 AM PT, Love: "its 10% or $2. whichever comes first" - 2:46 AM gold short $1.18 over the unbroken pink passed the $1.05 10%): gold pink cushion = 10% of the channel, never under $2 (her fix89 "$2 of the pink")
      if (togpLoose && asset === "btc" && (above - below) <= 100 /* fix298: the copy caps at $25 only at $100 and under */) w10e = Math.min(w10e, 25); // fix292 (Oct 26 ~3:24 PM PT, Love card "Pink cushion $25 for the copy"): the no-pink copy's BTC PINK 10% cushion is $25 at most (3:16 PM: $50 cushion in a $68 channel held her long); main and gold unchanged
      if (!why && !tight344 && togpLoose && !npPink /* fix363 */ && asset === "gold" && above - below < 10 && side === "up" && pp > tick - pbd && pp - tick < 0.33) why = `PINK 33c (copy): long $${(pp - tick).toFixed(2)} under the unbroken pink (${pp.toFixed(2)}) - gold keeps 33c between her and pink at this scale, flip or not. wait for pink to break up.`; if (!why && !tight344 && togpLoose && !npPink /* fix363 */ && asset === "gold" && above - below < 10 && side === "down" && pp < tick + pbd && tick - pp < 0.33) why = `PINK 33c (copy): short $${(tick - pp).toFixed(2)} over the unbroken pink (${pp.toFixed(2)}) - gold keeps 33c between her and pink at this scale, flip or not. wait for pink to break down.`; /* fix349 mirror (Love 5:40 PM PT: "we can make it unilaterally pink rules in both direction") */ // fix348 (Oct 27 2026 5:37 PM PT, Love: "and gold needs a minimum 33c  barrier between pink and longing into it at this scale / and needs a candle flip / we can open it up to normal when the bands are bigger but for rn yes"): NO-PINK COPY, gold longs, channel under $10 - a hard 33c barrier under an unbroken pink; past it fix347 still wants her flip
      if (!why && !tight344 /* fix350: flip no longer waives pink for the copy (was !flp347) */ && side === "up" && pp > tick - pbd && pp - tick <= w10e) why = `PINK 10%: long $${(pp - tick).toFixed(2)} under the unbroken pink (${pp.toFixed(2)}) - inside ${asset === "gold" ? 10 : 10}% ($${w10e.toFixed(2)}) of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel. wait for pink to break up.`;
      if (!why && !tight344 /* fix350 */ && side === "down" && pp < tick + pbd && tick - pp <= w10e) why = `PINK 10%: short $${(tick - pp).toFixed(2)} over the unbroken pink (${pp.toFixed(2)}) - inside ${asset === "gold" ? 10 : 10}% ($${w10e.toFixed(2)}) of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel. wait for pink to break down.`;
    }
    // BOLLINGER CUSHION (fix173, Oct 24 ~8:34 PM PT, Love: "yess lets make it $50 from where price is, minimum as a baseline hun" + card "Same cushion as pink" - 8:15 PM
    // BTC main long "Rejected up off 5m PP" at 80,891 fired $14 under the Bollinger upper): the same cushion as the pink, measured from price - no long with the 5m
    // Bollinger upper above price within w10 (BTC 10% of the channel, $50 minimum; gold the pink's share), no short with the Bollinger lower below within it.
    // Once price is through the Bollinger, she's clear.
    try {
      const zC = G.__bbsr?.[asset], bUC = Number(zC?.bbU) || 0, bLC = Number(zC?.bbL) || 0;
      if (zC && Date.now() - Number(zC.at) <= 20000) {
        const w10g = asset === "gold" ? Math.min(1, Math.max(0.5, w10f)) /* fix226 (Oct 25 ~6:36 PM PT, Love: "i want to keep the bollinger cushion at 50c - $1"): gold Bollinger cushion held between 50c and $1 */ : asset === "btc" && Number(G.__pinkCap5) > 0 ? Math.min(w10f, Number(G.__pinkCap5)) : w10f; // fix201 (Love 4:36 AM, yes to "cap the Bollinger cushion at $25 on the 5m board"): $25 on Polymarket's 5m board
        // fix286 (Oct 26 ~2:27 PM PT, Love card "Drop BB cushion + fake-out floor" + "we will drop it to $25 hun not completely"): the no-pink copy's BTC Bollinger cushion is $25.
        const w10g286 = togpLoose && asset === "btc" && (above - below) <= 100 /* fix302 (Love card "Match pink ($25 only <=$100)") */ ? Math.min(w10g, 25) : w10g;
        if (!why && side === "up" && bUC > tick && bUC - tick <= w10g286) why = `BOLLINGER CUSHION: long $${(bUC - tick).toFixed(2)} under the Bollinger upper (${bUC.toFixed(2)}) - inside the $${w10g286.toFixed(2)} cushion. Wait for the break or the rejection.`;
        if (!why && side === "down" && bLC > 0 && bLC < tick && tick - bLC <= w10g286) why = `BOLLINGER CUSHION: short $${(tick - bLC).toFixed(2)} over the Bollinger lower (${bLC.toFixed(2)}) - inside the $${w10g286.toFixed(2)} cushion. Wait for the break or the rejection.`;
        // BOLLINGER BROKEN ONLY ON A 1M CLOSE (fix225, Oct 25 ~6:18 PM PT, Love card "1m close past it" + "gold just longed directly into an unbroken bollinger and
        // immediately reversed we need to fix that hun" - 6:15 PM gold long went the moment a tick poked 2c over the upper, 3999.35 vs 3999.33): a tick past the
        // Bollinger frees her only once the last finished 1m candle closed past it too.
        if (!why && (side === "up" ? bUC > 0 && tick >= bUC : bLC > 0 && tick <= bLC)) { try {
          const mB = Math.floor(Date.now() / 60000) * 60, dB = ((G.__pivBars?.[asset]?.bars ?? []) as any[]).filter((x: any) => Number(x.t) < mB).sort((x: any, y: any) => Number(x.t) - Number(y.t)), kB = dB[dB.length - 1];
          const cB = kB && Number(kB.t) >= mB - 120 ? Number(kB.c) : NaN;
          if (side === "up" && !(cB > bUC)) why = `BOLLINGER NOT BROKEN: long at ${tick.toFixed(2)} past the Bollinger upper (${bUC.toFixed(2)}) but the last 1m candle closed ${Number.isFinite(cB) ? cB.toFixed(2) : "(none)"} - wait for a 1m close over it.`;
          if (side === "down" && !(cB < bLC)) why = `BOLLINGER NOT BROKEN: short at ${tick.toFixed(2)} past the Bollinger lower (${bLC.toFixed(2)}) but the last 1m candle closed ${Number.isFinite(cB) ? cB.toFixed(2) : "(none)"} - wait for a 1m close under it.`;
        } catch {} }
      } else if (asset === "gold") {
        // ZONES STAND IN FOR A FROZEN BOLLINGER (fix275, Oct 26 ~11:37 AM PT, Love: "she can use tradingview's bollinger and the $1.50 green/red zone tolerance
        // instead of the bollinger feed fails, i don't want her to skip the order if the bollinger fails. the green/red zones are often sitting in the same place
        // so one can support the other if one is frozen" + card "Gold only, $1.50"): gold only, while the chart's Bollinger is missing or 20 s+ stale - no long
        // with the red zone (5m R1) above price within $1.50, no short with the green zone (5m S1) below within $1.50. Nothing is skipped for the frozen feed itself.
        const r1Z = Number((L || []).find((l: Line) => String(l.name) === "5m R1")?.price) || 0, s1Z = Number((L || []).find((l: Line) => String(l.name) === "5m S1")?.price) || 0;
        if (!why && side === "up" && r1Z > tick && r1Z - tick <= 1.5) why = `ZONE FOR A FROZEN BOLLINGER: long $${(r1Z - tick).toFixed(2)} under the red zone (${r1Z.toFixed(2)}) - inside $1.50 while the chart Bollinger is frozen.`;
        if (!why && side === "down" && s1Z > 0 && s1Z < tick && tick - s1Z <= 1.5) why = `ZONE FOR A FROZEN BOLLINGER: short $${(tick - s1Z).toFixed(2)} over the green zone (${s1Z.toFixed(2)}) - inside $1.50 while the chart Bollinger is frozen.`;
      }
    } catch {}
  }
  // PINK TO RED (Oct 22 ~5:29 AM PT, Love: "going forward let's make it so that she doesn't long into the top 25% of the channel between the pink band and the red ...
  // she can wait for it to reject and fall off of there for a short or for it to come down to the pink band and reject for a long ... btc can remain as is"; share per her card pick):
  // gold only - between the pink (5m PP) and the red (5m R1) above it, no long in the top 40% of that space.
  if (!why && !npPink /* fix363 */ && asset === "gold" && side === "up") {
    const ppG = Number((L || []).find((l: Line) => String(l.name) === "5m PP")?.price) || 0, r1G = Number((L || []).find((l: Line) => String(l.name) === "5m R1")?.price) || 0;
    if (ppG > 0 && r1G > ppG && tick > ppG && tick < r1G && (((): boolean => { const vwP = Number((L || []).find((l: Line) => String(l.name) === "session VWAP")?.price) || 0, u1P = Number((L || []).find((l: Line) => String(l.name) === "+1σ")?.price) || 0, sdP = Math.abs(u1P - vwP); return (tick - ppG) / (r1G - ppG) >= 0.50 /* fix276 (Oct 26 ~11:43 AM PT, Love: "no longs into the top 40% of the channel from pink to red" + "let's make it an even 50% for gold hun"): top 50% at every band width, was top 40% only once session bands are $10+ apart */ || (!(sdP > 0 && sdP >= 10) && r1G - tick <= 1.5); })()) /* fix134 (Oct 23 12:32 AM PT, Love: "bring that down to $1.50 ... indefinitely"): $1.50 under the red, was $2 */ /* fix111: top 40% again once session bands are $10+ apart */ && true /* fix108 (Oct 22 ~7:41 PM PT, Love card "Both"): $2 under the red, was top 40% (>= 0.60) */) why = `PINK TO RED: long $${(r1G - tick).toFixed(2)} under the red, at ${Math.round((tick - ppG) / (r1G - ppG) * 100)}% of the pink ${ppG.toFixed(2)} -> red ${r1G.toFixed(2)} space - no gold long in the top 50% of it (or within $1.50 of the red). wait for the red to reject (short) or the pink to reject (long).`;
  }
  // PINK TO GREEN (fix276, Oct 26 ~11:43 AM PT, Love: "no longs into the top 40% of the channel from pink to red and shorts in the bottom 40% of the channel from
  // pink to green - gold only pls" + "let's make it an even 50% for gold hun"): the mirror of PINK TO RED - gold only, between the green (5m S1) and the pink
  // (5m PP) above it, no short in the bottom 50% of that space.
  if (!why && !npPink /* fix363 */ && asset === "gold" && side === "down") {
    const ppH = Number((L || []).find((l: Line) => String(l.name) === "5m PP")?.price) || 0, s1H = Number((L || []).find((l: Line) => String(l.name) === "5m S1")?.price) || 0;
    if (ppH > 0 && s1H > 0 && s1H < ppH && tick < ppH && tick > s1H && (tick - s1H) / (ppH - s1H) <= (flipRule || togpLoose ? 0.60 : 0.50) /* fix365 (Love Oct 27 2026 8:39 PM PT: "we can include the 60% into the rejection models too bb"): main + rejection model + no-pink copy 60% (the pure no-pink skips this wall, fix363) */ /* fix364 (Love Oct 27 2026 8:38 PM PT: "yes the flip is already supposed to be off hun, pls remove that and keep it off , and yeah go ahead and raise it to 60% hun that’s fine"): MAIN only 60%, every other book keeps 50% */) why = `PINK TO GREEN: short $${(tick - s1H).toFixed(2)} over the green, at ${Math.round((tick - s1H) / (ppH - s1H) * 100)}% of the green ${s1H.toFixed(2)} -> pink ${ppH.toFixed(2)} space - no gold short in the bottom ${flipRule || togpLoose ? 60 : 50}% of it. wait for the green to reject (long) or the pink to reject (short).`;
  }
  // BOLLINGER $100 OVER THE BAND (Oct 22 ~7:07 AM PT, Love: "for btc's long just now, on the break up, the bollinger was within $100 of the band it broke / let's include
  // that for longs and for the shorts not just the shorts" + card "Any entry near the band"): BTC only - no long while the Bollinger upper sits above price within $100
  // of the session band she is over; no short while the Bollinger lower sits below price within $100 of the band she is under. Her pink-break skip (recon) stays.
  if (!why && !beyond && asset === "btc") {
    const zB = G.__bbsr?.btc, bU = Number(zB?.bbU) || 0, bL = Number(zB?.bbL) || 0;
    if (zB && Date.now() - Number(zB.at) <= 20000) {
      if (side === "up" && bU > tick && bU - below <= (togpLoose && !npPink ? 75 : 50) /* fix366: the no-pink copy $75 */ /* fix158 (Oct 23 ~8:27 PM PT, Love: "lower it to $50 temporarily"): was $100 */) why = `BOLLINGER OVER THE BAND: long $${(tick - below).toFixed(2)} over ${below.toFixed(2)} with the Bollinger upper (${bU.toFixed(2)}) only $${(bU - below).toFixed(2)} above that band - skip.`;
      if (side === "down" && bL > 0 && bL < tick && above - bL <= (togpLoose && !npPink ? 75 : 50) /* fix366 */ /* fix158 */) why = `BOLLINGER UNDER THE BAND: short $${(above - tick).toFixed(2)} under ${above.toFixed(2)} with the Bollinger lower (${bL.toFixed(2)}) only $${(above - bL).toFixed(2)} below that band - skip.`;
    }
  }
  // TARGET PAST A BAND - GOLD (Oct 22 ~7:19 AM PT, Love: "she doesn't take a trade with a band within $1.50 of the target on gold / same for pink / she can trade
  // away from them / never a long into a trade with a target on the other side of a band, or within $1.50 of gold / she can short away, and vis versa"): gold only -
  // no long while a session band or the pink sits ahead of price (above it) and at or under the window's target + $1.50; no short while one sits below price and
  // at or over the target - $1.50. Bands behind the trade (trading away) never block. No target yet = can't verify = no opening order.
  // THE TWIN FADES PAST IT (fix123, Oct 22 ~11:21 PM PT, Love: "the delayed entry book is clear to take the opposite side" + picked "Skip target-past-a-band"):
  // the DELAYED twin (twinFade) skips this one wall only - every other wall still judges her.
  // THE PINK ONLY (fix124, Oct 22 ~11:22 PM PT, Love: "the pink band is okay to short into once the multiple is there, like this scenario here / just not the
  // session bands"): the twin still keeps this wall for the session bands (and the Bollinger); only the pink no longer blocks her.
  if (!why && asset === "gold" && (side === "up" || side === "down")) {
    const tgt = targetNow("gold");
    if (!(tgt > 0)) why = "TARGET PAST A BAND: can't read gold's target for this window yet - no opening order";
    else {
      // + THE BOLLINGER (Oct 22 ~1:52 PM PT, Love: "on gold this window the target was within $1 of a bollinger, let's put the $1.50 til in place for those as well,
      // only away from them just as before"): gold's 5m Bollinger upper/lower count here too.
      const TB = [...(L || []).filter((l: Line) => (isSessBand(l) || String(l.name) === "5m PP") && Number(l.price) > 0), ...bbLines("gold").filter((l) => !(L || []).some((x: Line) => String(x.name) === String(l.name)))];
      const hit = TB.filter((l: Line) => !((twinFade || twinPinkAll || foTurn) && String(l.name) === "5m PP")).filter((l: Line) => !(noBBTarget && /^BB |BBSR|Bollinger/i.test(String(l.name)))) /* fix318 */.filter((l: Line) => !((rejNoAhead || togpLoose /* fix332 */) && String(l.name) === "5m PP" && above > below && (Number(l.price) - below) / (above - below) > 0.10 && (Number(l.price) - below) / (above - below) < 0.90)) /* fix319 */.filter((l: Line) => { const P = Number(l.price); return side === "up" ? P > tick && P <= tgt + 1.5 : P < tick && P >= tgt - 1.5; }).sort((x: Line, y: Line) => Math.abs(Number(x.price) - tick) - Math.abs(Number(y.price) - tick))[0];
      if (hit) { const P = Number(hit.price), nm = String(hit.name) === "5m PP" ? "the pink" : /BBSR upper/.test(String(hit.name)) ? "the Bollinger upper" : /BBSR lower/.test(String(hit.name)) ? "the Bollinger lower" : String(hit.name);
        why = `TARGET PAST A BAND: ${side === "up" ? "long" : "short"} at ${tick.toFixed(2)} with ${nm} (${P.toFixed(2)}) ${side === "up" ? "above" : "below"} her, ${Math.abs(P - tgt) <= 1.5 ? `within $1.50 of the target ${tgt.toFixed(2)}` : `between her and the target ${tgt.toFixed(2)}`} - only trade away from it.`; }
    }
  }
  // THE $10 LEVEL (fix217, Oct 25 ~3:40 PM PT, Love: "gold often reverses at even $10 and $100 levels ... if trading away from them as opposed to against (up into, or
  // down into) would help our gold win rate" + card "Make it a live wall now"; study Oct 20-23, 1,492 gold trades, target within $2 of a $10 level: trading INTO the level
  // 94 trades 25.5% -$786, AWAY 170 trades 66.5% +$352): gold only, every book - when the window's target sits within $2 of an even $10 level, no long while price is
  // under that level (up into it) and no short while price is over it (down into it). Trading away from it is clear; price on the level (within 30c) is not judged.
  if (!why && asset === "gold" && (side === "up" || side === "down")) {
    const tgt10 = targetNow("gold");
    if (tgt10 > 0) { const L10 = Math.round(tgt10 / 10) * 10;
      // fix232 (Love Oct 25 ~8:28 PM PT, card "Tighten to $1": "yes $1 - $1.50 to $2 like you said i'm good w those"; 1,598 gold trades: into a
      // target 0-50c off the level 64 trades 34% -$486, 50c-$1 off 59 trades -$19, $1-$2 off 145 trades +$55): only targets within $1 of the even $10.
      if (Math.abs(tgt10 - L10) <= 1 && Math.abs(tick - L10) >= 0.3 && (side === "up") !== (tick > L10))
        why = `THE $10 LEVEL: ${side === "up" ? "long up into" : "short down into"} ${L10.toFixed(0)} - the target ${tgt10.toFixed(2)} sits within $1 of that even $10 level and gold reverses there; only trade away from it.`; }
  }
  // CLEAR OF THE $10 LEVEL (fix376, Oct 28 2026 12:23 AM PT, Love: "yess let's do it" to "she still only trades away from $10 levels, but she waits until price is at least $1.50 clear of the level first" - gold since Oct 11,
  // main/rejection/copy trades pointing AWAY from the nearest even $10 but only 30c-$1.50 off it: 130 trades 45% -$267 (the level pulls price back); $1.50+ off is green): MAIN, REJECTION MODEL, NO-PINK COPY, gold -
  // a trade heading away from the nearest $10 level waits until price is $1.50 clear of it. Under 30c (on the level) is not judged. Her INTO-the-level wall above stays.
  if (!why && asset === "gold" && (flipRule || (togpLoose && !npPink)) && (side === "up" || side === "down")) { const L376 = Math.round(tick / 10) * 10, d376 = tick - L376;
    if (Math.abs(d376) >= 0.3 && Math.abs(d376) < 1.5 && ((side === "up" && d376 > 0) || (side === "down" && d376 < 0))) why = `CLEAR OF THE $10 LEVEL: ${side === "up" ? "long" : "short"} only $${Math.abs(d376).toFixed(2)} ${d376 > 0 ? "over" : "under"} ${L376} - the level pulls price back; she waits until price is $1.50 clear (fix376).`; }
  // THE ZONES BELONG TO THEIR SIDE (fix377, Oct 28 2026 12:33 AM PT, Love: "yes pls bb" to bringing back "no long inside the red, no short inside the green" (the inside-the-zone part of the Oct 20 zone wall, without the reach) - 12:30 AM the copy longed gold at 4038.79, 60c inside the red zone (R1 4038.18), on "Green candle rising from the bottom third"):
  // MAIN, REJECTION MODEL, NO-PINK COPY, gold - no long while price sits inside the 5m red zone (R1-R2), no short while it sits inside the green zone (S2-S1). Through the far edge the zone is behind her and does not judge.
  if (!why && asset === "gold" && (flipRule || (togpLoose && !npPink))) { const zf = (n: string) => Number((L || []).find((l: Line) => String(l.name) === n)?.price) || 0; const r1 = zf("5m R1"), r2 = zf("5m R2"), s1 = zf("5m S1"), s2 = zf("5m S2");
    if (side === "up" && r1 > 0 && r2 > r1 && tick >= r1 && tick < r2) why = `INSIDE THE RED ZONE: long at ${tick.toFixed(2)} inside the red zone (${r1.toFixed(2)}-${r2.toFixed(2)}) - the red belongs to shorts (fix377).`;
    if (side === "down" && s1 > 0 && s2 > 0 && s1 > s2 && tick <= s1 && tick > s2) why = `INSIDE THE GREEN ZONE: short at ${tick.toFixed(2)} inside the green zone (${s2.toFixed(2)}-${s1.toFixed(2)}) - the green belongs to longs (fix377).`; }
  // $1.50 BEFORE THE ZONE (fix378, Oct 28 2026 12:48 AM PT, Love: "we will make sure she doesn't long in the red zone or short in the green zone pls, and keep the $1.50 tolerance from it in place too" + "yesss pls hunni" + "just gold bb"):
  // MAIN, REJECTION MODEL, NO-PINK COPY, gold - no long within $1.50 under the 5m red zone (R1), no short within $1.50 over the green zone (S1). The reach half of the Oct 20 zone wall, back beside fix377.
  if (!why && asset === "gold" && (flipRule || (togpLoose && !npPink))) { const zg = (n: string) => Number((L || []).find((l: Line) => String(l.name) === n)?.price) || 0; const r1 = zg("5m R1"), s1 = zg("5m S1");
    if (side === "up" && r1 > 0 && tick < r1 && r1 - tick <= 1.5) why = `$1.50 BEFORE THE RED ZONE: long $${(r1 - tick).toFixed(2)} under the red zone (${r1.toFixed(2)}) - inside her $1.50 (fix378).`;
    if (side === "down" && s1 > 0 && tick > s1 && tick - s1 <= 1.5) why = `$1.50 BEFORE THE GREEN ZONE: short $${(tick - s1).toFixed(2)} over the green zone (${s1.toFixed(2)}) - inside her $1.50 (fix378).`; }
  // BOLLINGER BOUNCE IN HER CANDLE (Oct 22 ~7:23 AM PT, Love: "btc rejected at the bollinger of the candle she entered in / if the candle she entered in rejected at a
  // bollinger she shouldn't short" + card "Within $75"): BTC only - no short while this 5m candle's low came within $75 of the Bollinger lower and price has bounced
  // back up off it; no long while its high came within $75 of the Bollinger upper and price has dropped back off it.
  // fix178 (Oct 24 ~10:20 PM PT, Love card "Drop it" on "Keep the Bollinger bounce rule blocking shorts and longs like this?"): RETIRED - the 10:15 PM BTC short off the pink
  // stayed blocked by a bounce $49 over the Bollinger lower. The Bollinger cushion (fix173) and the other walls still judge.
  if (false && !why && asset === "btc") {
    const zB = G.__bbsr?.btc, bU = Number(zB?.bbU) || 0, bL = Number(zB?.bbL) || 0, hlB = fiveHLNow("btc"), tpB = PINK_TAP.btc ?? 3;
    if (zB && hlB && Date.now() - Number(zB.at) <= 20000) {
      if (side === "down" && bL > 0 && Number(hlB.l) <= bL + 75 && tick > bL && tick >= Number(hlB.l) + tpB) why = `BOLLINGER BOUNCE IN HER CANDLE: this 5m candle's low (${Number(hlB.l).toFixed(2)}) came within $75 of the Bollinger lower (${bL.toFixed(2)}) and bounced - no short.`;
      if (side === "up" && bU > 0 && Number(hlB.h) >= bU - 75 && tick < bU && tick <= Number(hlB.h) - tpB) why = `BOLLINGER BOUNCE IN HER CANDLE: this 5m candle's high (${Number(hlB.h).toFixed(2)}) came within $75 of the Bollinger upper (${bU.toFixed(2)}) and dropped - no long.`;
    }
  }
  // FOUR NEW WALLS (fix104, Oct 22 ~7:25 PM PT, Love card "Yes, all four" + 7:22 PM "just a doji candle after a continued trend"):
  // 1 THE LAST RUNG (GOLD ONLY - fix105, Oct 22 ~7:31 PM PT, Love: "let's make that only for gold pls") - no short under her lowest session band, no long over her highest (out past the channel); rejections back in stay hers.
  // 2 DOJI AFTER THE TREND - after a continued trend, a doji (body <= DOJI_BODY of its range) on the last closed 5m candle = the next candle trades its colour only.
  // 3 TREND THROUGH THE BANDS - price closed (1m) through 2+ session bands the same way in the last 30 min = no short in the bottom third of the session channel (mirror longs).
  // 4 STEEP SLOPE - session VWAP moved more than 1/2 sigma in 15 min = an entry needs a tap of the next session band out first (this or the last 5m candle).
  if (!why && !G.__stDefaultReach && (side === "up" || side === "down")) {
    try {
      const SB = (L || []).filter((l: Line) => /σ$|^session VWAP$/.test(String(l.name)) && Number(l.price) > 0).map((l: Line) => ({ n: String(l.name), p: Number(l.price) })).sort((x, y) => x.p - y.p);
      if (SB.length >= 2) {
        const sLo = SB[0], sHi = SB[SB.length - 1];
        if (asset === "gold" && side === "down" && tick < sLo.p) why = `THE LAST RUNG: short at ${tick.toFixed(2)} under her lowest session band (${sLo.n} ${sLo.p.toFixed(2)}) - never short out past the bottom of the channel; a rejection back up is a long.`;
        if (asset === "gold" && side === "up" && tick > sHi.p) why = `THE LAST RUNG: long at ${tick.toFixed(2)} over her highest session band (${sHi.n} ${sHi.p.toFixed(2)}) - never long out past the top of the channel; a rejection back down is a short.`;
        // FAKE-OUT BAND (fix119, Oct 22 ~9:09 PM PT, Love: "if price keeps barely breaking thru the top / bottom 25% of the channel and reversing, 2-3 out of the
        // previous 10 candles have her skip the break on it / if it rejects she can trade that"): gold only - for each session band and the pink, count the last 10
        // closed 5m candles that opened under it, poked over it and closed back under (mirror below). 2+ of them = no long on a break up through it (this 5m
        // candle opened, or the last one closed, under it and price is now over it); mirror short. A rejection off it is still hers.
        // THE TWIN SKIPS THE FAKE-OUTS (fix221, Oct 25 ~5:04 PM PT, Love card "Pink + fake-out walls" + "the twin is supposed to be immune to the walls remember?"): in her
        // twin hours (twinFade) the DELAYED book skips FAKE-OUT BAND / FLOOR / CEILING, OVER THE FLOOR and UNDER THE CEILING; her 33%, top/bottom line and session walls stay.
        if (!why && !twinFade && (asset === "gold" || asset === "btc")) { try { // fix141: BTC too
          const fz5 = Math.floor(Date.now() / 300000) * 300;
          const b1: any[] = ((G.__pivBars?.[asset]?.bars ?? []) as any[]).filter((x: any) => Number(x.t) >= fz5 - 3000 && Number(x.t) < fz5).sort((x: any, y: any) => Number(x.t) - Number(y.t));
          const c5: { o: number; h: number; l: number; c: number }[] = [];
          for (let s = fz5 - 3000; s < fz5; s += 300) { const xs = b1.filter((x: any) => Number(x.t) >= s && Number(x.t) < s + 300); if (xs.length >= 3) c5.push({ o: Number(xs[0].o), h: Math.max(...xs.map((x: any) => Number(x.h))), l: Math.min(...xs.map((x: any) => Number(x.l))), c: Number(xs[xs.length - 1].c) }); }
          const o5f = fiveOpenNow(asset), pcf = c5.length ? c5[c5.length - 1].c : 0;
          // ONLY IN ITS OUTER THIRD (fix144, Oct 23 ~1:37 PM PT, Love card "Only in its outer third" - the 1:34 PM BTC "Break below -1σ" short at 81,298 was refused by
          // OVER THE FLOOR with the faking -2σ $167 below, near the top of a $192 channel): UNDER THE CEILING / OVER THE FLOOR block only inside her sliding share
          // (lockPctFor, same as her thirds) of the channel next to the faking band.
          const foW = above - below, foOuter = (d: number) => !(foW > 0) || d <= lockPctFor(asset, foW) * foW;
          // BARELY THROUGH, 25% (fix252, Oct 26 ~1:13 AM PT, Love: "i asked to have the fakeout be configured to 25% of the band channel width" - her Oct 22 9:09 PM words
          // for fix119: "if price keeps barely breaking thru the top / bottom 25% of the channel and reversing"): a poke counts as a fake-out only when its wick ran no
          // more than 25% of the channel's width past the band. Deeper than that is a genuine break, and coming back from it is a genuine rejection.
          const fD25 = Number(G.__pinkCap5) > 0 ? Infinity /* fix266: Poly 5m board = Sunday's count */ : foW > 0 ? 0.25 * foW : Infinity;
          const FB = [...SB.filter((x) => !(asset === "gold" && /^fresh /.test(x.n))) /* fix221/fix222 gold fresh bands (under $5 apart) stay out of the fake-outs (Love: "disable fakeouts for bands under $5" + "gold only pls") */, ...(L || []).filter((l: Line) => /^5m [RS]1$|^(Green|Red) zone$/.test(String(l.name)) && Number(l.price) > 0).map((l: Line) => ({ n: String(l.name) === "5m S1" || String(l.name) === "Green zone" ? "the green zone" : String(l.name) === "5m R1" || String(l.name) === "Red zone" ? "the red zone" : String(l.name), p: Number(l.price) }))]; // fix181: + green/red zone (Love Oct 24 ~11:16 PM PT). fix140 (Oct 23 ~10:04 AM PT, Love: "let's only have the fake out rule in place for the session bands"): the pink no longer counts
          for (const B of FB) {
            if (why) break;
            const fT = asset === "btc" ? 10 : 0.3; /* fix180 (Oct 24 ~11:14 PM PT, Love: "it did break a session band and fakeout thru them" - the 10:45/10:50 PM BTC candles opened and closed within $3-7 of -1σ and wicked $60-90 under, so the strict open-over/close-over count missed them): a poke counts when the candle opens and closes no further than her tap past the band ($10 BTC / 30c gold) and its wick runs past that tap */ const upF = c5.filter((k) => k.o < B.p + fT && k.h > B.p + fT && k.c < B.p + fT && k.h - Math.max(k.o, k.c) >= fT && k.h - B.p <= fD25).length, dnF = c5.filter((k) => k.o > B.p - fT && k.l < B.p - fT && k.c > B.p - fT && Math.min(k.o, k.c) - k.l >= fT && B.p - k.l <= fD25).length;
            if (side === "up" && upF >= 2 && tick > B.p && ((o5f > 0 && o5f < B.p) || (pcf > 0 && pcf < B.p))) why = `FAKE-OUT BAND: ${upF} of the last 10 ${asset} 5m candles poked over ${B.n} (${B.p.toFixed(2)}) and closed back under - no long on its break; a rejection off it is still hers.`;
            if (side === "down" && dnF >= 2 && tick < B.p && ((o5f > 0 && o5f > B.p) || (pcf > 0 && pcf > B.p))) why = `FAKE-OUT BAND: ${dnF} of the last 10 ${asset} 5m candles poked under ${B.n} (${B.p.toFixed(2)}) and closed back over - no short on its break; a rejection off it is still hers.`;
            // FAKE-OUT CEILING (fix137, Oct 23 ~1:40 AM PT, Love card "Yes, ceiling: no longs off it" - 1:35 AM gold longed "Rejected up off session VWAP" right after
            // VWAP faked out twice, and fell through it): while a band is faking out, no long bouncing off it either (price over it, within $1.50); mirror short.
            if (!why && side === "up" && upF >= 2 && tick > B.p && tick - B.p <= (asset === "btc" ? 33 : 1.5)) why = `FAKE-OUT CEILING: ${upF} of the last 10 ${asset} 5m candles poked over ${B.n} (${B.p.toFixed(2)}) and closed back under - it is a ceiling, no long off it ($${(tick - B.p).toFixed(2)} over).`;
            // UNDER THE CEILING (fix138, Oct 23 ~9:50 AM PT, Love: "it rejected again, when the fake outs happen she's supposed to short / she just longed into it"):
            // the 9:48 AM long went in $2.56 under a -1σ that had faked out 4 of the last 10 candles. While the band just above price fakes out, no long under it
            // in that channel; mirror: no short over a faking-out band just below. Her rejection off it is the trade.
            // Unless price is already past the window target (Love 9:51 AM: "if price is already above the target ... and the candle is green she can do it ... if it's not
            // above the target already shorts only") - her candle still judges. Mirror for shorts over a faking-out floor.
            // fix139 (Love 9:55 AM "actually no let's make it shorts there anyways"): the target exemption is gone - under a faking-out ceiling it is shorts only.
            if (!why && side === "up" && upF >= 2 && tick <= B.p && Math.abs(B.p - above) < (asset === "btc" ? 5 : 0.25) && foOuter(B.p - tick)) why = `UNDER THE CEILING: ${upF} of the last 10 ${asset} 5m candles poked over ${B.n} (${B.p.toFixed(2)}) and closed back under - no long into it; its rejection is the short.`;
            if (!why && side === "down" && dnF >= 2 && tick >= B.p && Math.abs(B.p - below) < (asset === "btc" ? 5 : 0.25) && foOuter(tick - B.p)) why = `OVER THE FLOOR: ${dnF} of the last 10 ${asset} 5m candles poked under ${B.n} (${B.p.toFixed(2)}) and closed back over - no short into it; its rejection is the long.`;
            if (!why && !togpLoose /* fix286: the no-pink copy skips the fake-out floor (Love card Oct 26 ~2:27 PM PT) */ && side === "down" && dnF >= 2 && tick < B.p && B.p - tick <= (asset === "btc" ? 33 : 1.5)) why = `FAKE-OUT FLOOR: ${dnF} of the last 10 ${asset} 5m candles poked under ${B.n} (${B.p.toFixed(2)}) and closed back over - it is a floor, no short off it ($${(B.p - tick).toFixed(2)} under).`;
          }
        } catch {} }
        // THE LAST CHANNEL (fix107, Oct 22 ~7:36 PM PT, Love card "Also breaks into the last channel": "no longs at the last band of the top of the channel / no shorts
        // into the bottom / only rejections, no trading breaks into those"): gold only - no long in the top channel (2nd-highest -> highest session band) when this
        // 5m candle opened, or the last one closed, under its floor (she broke up into it); mirror short. A rejection off that floor from inside stays hers.
        if (!why && asset === "gold" && SB.length >= 3) { try {
          const fT = SB[SB.length - 2], fB = SB[1], o5 = fiveOpenNow(asset), fz = Math.floor(Date.now() / 300000) * 300;
          const pv: any[] = ((G.__pivBars?.[asset]?.bars ?? []) as any[]).filter((x: any) => Number(x.t) >= fz - 300 && Number(x.t) < fz).sort((x: any, y: any) => Number(x.t) - Number(y.t));
          const pc = pv.length ? Number(pv[pv.length - 1].c) : 0;
          if (side === "up" && tick > fT.p && tick <= sHi.p && ((o5 > 0 && o5 < fT.p) || (pc > 0 && pc < fT.p))) why = `THE LAST CHANNEL: gold long at ${tick.toFixed(2)} broke up through ${fT.n} (${fT.p.toFixed(2)}) into the last channel under ${sHi.n} - no break trades into the last rung; only a rejection.`;
          if (side === "down" && tick < fB.p && tick >= sLo.p && ((o5 > 0 && o5 > fB.p) || (pc > 0 && pc > fB.p))) why = `THE LAST CHANNEL: gold short at ${tick.toFixed(2)} broke down through ${fB.n} (${fB.p.toFixed(2)}) into the last channel over ${sLo.n} - no break trades into the last rung; only a rejection.`;
        } catch {} }
        const nowS = Date.now() / 1000, f0 = Math.floor(nowS / 300) * 300;
        const B1: any[] = ((G.__pivBars?.[asset]?.bars ?? []) as any[]).filter((x: any) => Number(x.t) + 60 <= nowS && Number(x.t) >= nowS - 2400).sort((x: any, y: any) => Number(x.t) - Number(y.t));
        const trendOf = (bs: any[]): "up" | "down" | "" => { const dn = new Set<string>(), up = new Set<string>();
          for (let i = 1; i < bs.length; i++) { const a = Number(bs[i - 1].c), b = Number(bs[i].c); for (const s of SB) { if (a > s.p && b < s.p) dn.add(s.n); if (a < s.p && b > s.p) up.add(s.n); } }
          return dn.size >= 2 && dn.size > up.size ? "down" : up.size >= 2 && up.size > dn.size ? "up" : ""; };
        const trNow = trendOf(B1.filter((x: any) => Number(x.t) >= nowS - 1860));
        const bA = SB.find((s) => s.p > tick), bB = [...SB].reverse().find((s) => s.p <= tick);
        if (false && !why && trNow && bA && bB && bA.p > bB.p) { // TREND THROUGH THE BANDS DROPPED (fix106, Oct 22 ~7:34 PM PT, Love card "Drop it" - it blocked the 7:31 PM gold long); the doji still reads the trend const sp = (tick - bB.p) / (bA.p - bB.p);
          if (trNow === "down" && side === "down" && sp <= 1 / 3) why = `TREND THROUGH THE BANDS: price fell through 2+ session bands in the last 30 min - no short at ${Math.round(sp * 100)}% of the ${bB.p.toFixed(2)} -> ${bA.p.toFixed(2)} channel (bottom third). short the top, long the turn.`;
          if (trNow === "up" && side === "up" && sp >= 2 / 3) why = `TREND THROUGH THE BANDS: price rose through 2+ session bands in the last 30 min - no long at ${Math.round(sp * 100)}% of the ${bB.p.toFixed(2)} -> ${bA.p.toFixed(2)} channel (top third). long the bottom, short the turn.`; }
        const DOJI_BODY = 0.10;
        const D5 = B1.filter((x: any) => Number(x.t) >= f0 - 300 && Number(x.t) < f0);
        if (!why && D5.length >= 4) { const o = Number(D5[0].o), c = Number(D5[D5.length - 1].c), hh = Math.max(...D5.map((x: any) => Number(x.h))), ll = Math.min(...D5.map((x: any) => Number(x.l)));
          const trD = trendOf(B1.filter((x: any) => Number(x.t) >= f0 - 300 - 1860 && Number(x.t) < f0));
          if (trD && hh > ll && Math.abs(c - o) <= DOJI_BODY * (hh - ll) && c !== o) { const dS = c > o ? "up" : "down";
            if (side !== dS) why = `DOJI AFTER THE TREND: a ${dS === "up" ? "green" : "red"} doji closed at ${new Date(f0 * 1000).toISOString().slice(11, 16)}Z after a ${trD} trend through the bands - this candle trades ${dS === "up" ? "long" : "short"} only.`; } }
        const vw = Number((L || []).find((l: Line) => String(l.name) === "session VWAP")?.price) || 0, u1 = Number((L || []).find((l: Line) => String(l.name) === "+1σ")?.price) || 0, sd1 = Math.abs(u1 - vw);
        if (vw > 0 && sd1 > 0) { const VH = ((G.__vwH ||= {})[asset] ||= []) as { t: number; v: number; sd: number }[]; const lst = VH[VH.length - 1];
          if (lst && Math.abs(vw - lst.v) > 0.3 * sd1 && nowS - lst.t < 120) VH.length = 0; // session reset jump - start the slope fresh
          if (!VH.length || nowS - VH[VH.length - 1].t >= 20) VH.push({ t: nowS, v: vw, sd: sd1 }); while (VH.length && VH[0].t < nowS - 1800) VH.shift();
          const old = [...VH].reverse().find((x) => x.t <= nowS - 900);
          if (!why && old && nowS - old.t <= 1200 && Math.abs(vw - old.v) > 0.5 * sd1) {
            const TP = asset === "gold" ? 0.3 : 10, H5 = B1.filter((x: any) => Number(x.t) >= f0 - 300), hl = fiveHLNow(asset);
            const hh = Math.max(...H5.map((x: any) => Number(x.h)), hl ? Number(hl.h) : -Infinity), ll = Math.min(...H5.map((x: any) => Number(x.l)), hl ? Number(hl.l) : Infinity), pitch = vw > old.v ? "up" : "down";
            if (side === "down" && bA && !(hh >= bA.p - TP)) why = `STEEP SLOPE: bands pitched ${pitch} (VWAP $${Math.abs(vw - old.v).toFixed(2)} in 15 min, > 1/2 sigma) - a short needs a tap of ${bA.n} (${bA.p.toFixed(2)}) first.`;
            if (side === "up" && bB && !(ll <= bB.p + TP)) why = `STEEP SLOPE: bands pitched ${pitch} (VWAP $${Math.abs(vw - old.v).toFixed(2)} in 15 min, > 1/2 sigma) - a long needs a tap of ${bB.n} (${bB.p.toFixed(2)}) first.`;
            // fix194 (Love, Oct 25 ~2:35 AM PT: "if its slope incline is this tilted i want her to wait to short from the band above her, and long from the band below her" + card "Top/bottom third on a slope"):
            // on a steep slope a short opens only in the top third of the session channel, a long only in the bottom third - all books, both assets.
            if (!why && bA && bB && bA.p > bB.p) { const sp3 = (tick - bB.p) / (bA.p - bB.p);
              if (side === "down" && sp3 < 2 / 3) why = `STEEP SLOPE: bands pitched ${pitch} - a short only in the top third, under ${bA.n} (now ${Math.round(sp3 * 100)}% of the ${bB.p.toFixed(2)} -> ${bA.p.toFixed(2)} channel).`;
              if (side === "up" && sp3 > 1 / 3) why = `STEEP SLOPE: bands pitched ${pitch} - a long only in the bottom third, over ${bB.n} (now ${Math.round(sp3 * 100)}% of the ${bB.p.toFixed(2)} -> ${bA.p.toFixed(2)} channel).`; } } }
      }
    } catch {}
  }
  // ONLY IN HER THIRD (Love, Oct 20 ~5:01 PM PT: "longs only in the bottom 33% with an unbroken band / shorts only in the top 33% if there is an unbroken band there /
// price falling or rising in either is a trade in that direction please / reinforce that please"): a long may only open in the bottom 33% of the channel, right over the unbroken band below
  // it; a short only in the top 33%, right under the unbroken band above. The middle third opens nothing. A break lands price in the right third of the
  // next channel by itself (just over the band it broke = the bottom of the channel above).
  // ABSOLUTE (Oct 21 ~11:27 AM PT, Love: "no longs in the top 33% get out under any circumstances / no shorts in the bottom 33% into an unbroken band, ever ever ever"): no launch waiver on her thirds.
  let launch: "up" | "down" | "" = "";
  try { launch = launchSide(asset, L, tick, fiveOpenNow(asset), fiveHLNow(asset)); } catch { launch = ""; }
  // THE WHOLE WAY UP (Oct 20 ~7:49 PM PT, Love: "shes clear to long the whole whole up, just not in the top 33% of the channel hun. same for shorts"): the middle
  // opens again - a long is refused only in the top 33%, a short only in the bottom 33% (and the sliding share above, whichever reaches further).
  // Oct 22 ~3:20 AM PT, Love: "the session bands hun, same way we have her set up at 33% both ways / we will do 20% after bands exceed $500 apart / 33% under that" -
  // on BTC her thirds slide with THE IMPOSSIBILITY (33% to $500 wide, 20% past). Gold keeps the fixed third.
  const TH = IMPOSSIBLE, thTxt = Math.round(TH * 100);
  if (!why && !tightUp && side === "up" && pos >= 1 - TH) why = `ONLY IN HER THIRD: long at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - no long in the top ${thTxt}%, under the unbroken band above.`;
  if (!why && !tightDn && side === "down" && pos <= TH) why = `ONLY IN HER THIRD: short at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - no short in the bottom ${thTxt}%, over the unbroken band below.`;
  // HER CANDLE (Oct 20 ~8:07 PM PT, Love: "she is clear to long a rising candle that either came up from the bottom, or broke pink upwards, she can long
  // anywhere but the top 33% of the channel, same for shorts on a falling candle that fell from the band, or broke the pink downwards ... hardwired into her
  // architecture, no other method of operations"): a rising 5m candle (over its open, lifted the tap off its low) is a long or nothing; a falling one (under
  // its open, dropped the tap off its high) is a short or nothing. Her calls, her door and the wire all read it here.
  let cdl = "";
  try { const o5 = fiveOpenNow(asset), hl5 = fiveHLNow(asset), tp5 = PINK_TAP[asset] ?? 0; if (o5 > 0 && hl5 && tp5 > 0) cdl = tick > o5 && tick >= hl5.l + tp5 ? "up" : tick < o5 && tick <= hl5.h - tp5 ? "down" : "";
    // GOLD 30c PAST THE OPEN (fix271, Oct 26 ~11:02 AM PT, Love: "add the 30 cents fix to gold back in now" + "a 4 cent rise cannot count as rising even when the
    // candle is red" - 10:45 AM gold long passed HER CANDLE 4c over the 5m open after the candle had been 46c under it): on gold a red candle (30c+ under its open)
    // stays red until price is 30c+ over the open, and a green one (30c+ over) stays green until price is 30c+ under it - fix172's 30c, now in HER CANDLE too.
    if (asset === "gold" && o5 > 0 && hl5) { if (cdl === "up" && tick < o5 + 0.3 && Number(hl5.l) <= o5 - 0.3) cdl = "down"; else if (cdl === "down" && tick > o5 - 0.3 && Number(hl5.h) >= o5 + 0.3) cdl = "up"; }
    // BTC $10 PAST THE OPEN (fix274, Oct 26 ~11:28 AM PT, Love: "let's do that and add the $10 btc rejection policy ... it was supposed to be there already"): fix172's
    // $10 in HER CANDLE on BTC, the mirror of gold's 30c (fix271) - a red candle ($10+ under its open) stays red until price is $10+ over the open, and back.
    if (asset === "btc" && o5 > 0 && hl5) { if (cdl === "up" && tick < o5 + 10 && Number(hl5.l) <= o5 - 10) cdl = "down"; else if (cdl === "down" && tick > o5 - 10 && Number(hl5.h) >= o5 + 10) cdl = "up"; } } catch { cdl = ""; }
  let m1R = ""; try { m1R = oneMinReject(asset, L, tick, side); } catch { m1R = ""; } // 1m close off a rejected band waives HER CANDLE (Oct 21 ~12:06 PM PT, Love)
  void m1R; // CANDLE COLOUR ALWAYS WINS (fix102, Oct 22 ~6:52 PM PT, Love: "yes let's make it the way it was before" + card "No, candle colour always wins"): a 1m close off a band no longer waives HER CANDLE.
  // was: if (m1R && !(m1R === "5m PP" && true)) cdl = ""; // a 1m pink close never waives HER CANDLE for a pink trade (Oct 22 ~7:23 AM PT, Love: "let's wait for the candle to flip red")
  if (foTurn) cdl = ""; // fix139: the red/green 1m close back across the fake-out band is her proof
  // HER FLIP, LITERAL COLOUR (fix325, Oct 27 ~11:34 AM PT, Love: "hun. i'd like it to be the literal color of the candle." + "i asked for a 1 minute , 2m, 3m, or 5M candle to flip in our
  // favor. one of the cornerstones of the model." + card "Main + rejection model" - 11:30:28 AM main gold short with every 1-5m candle green): for these books an entry needs at least one live
  // 1/2/3/4/5m candle past its open her way (literal colour); none = no entry. The 5m-only read with the 30c gold / $10 BTC stickiness stands down for them.
  if (flipRule) { if (!why && !foTurn && !anyFlipNow(asset, side, tick)) why = `HER FLIP: no 1/2/3/4/5m candle is ${side === "up" ? "green" : "red"} - a ${side === "up" ? "long" : "short"} needs one flipped her way.`; cdl = ""; }
  if (togpLoose && !flipRule) { if (!why && !(foTurn && npPink) /* fix366 (Love Oct 27 2026 9:23 PM PT: "yes, both bb" (to: copy only - a fake-out turn no longer skips her flip; her Bollinger-over-the-band wall $50 -> $75)): a fake-out turn no longer skips the copy's flip (was !foTurn) */ && !anyFlipMinNow(asset, side, tick) /* fix359 */) why = `HER FLIP: no 1/2/3/4/5m candle is ${side === "up" ? "green" : "red"} by ${asset === "gold" ? "10c" : "$5"} - a ${side === "up" ? "long" : "short"} needs one flipped her way for real (fix359).`; cdl = ""; } // fix349 (Oct 27 2026 5:40 PM PT, Love: "yes pls pls" to "Do you want me to give the copy the same 1-5m flip rule as main?"): the no-pink copy needs her flip too, the same line as main's
  if (rejNoAhead && cdl && cdl !== side && anyFlipNow(asset, side, tick)) cdl = ""; // fix319 (Oct 27 ~6:23 AM PT, Love: "enter in at a candle flip of 1, 2,3,4, 5M candles" + card "Rejection model only"): the rejection model may go with any 1-5m candle moving her way
  // BACK OVER BY $10 (fix154, Oct 23 ~3:51 PM PT, Love: "make it over $10 over the band so it can't go a few cents over again and it's a real valid trade if she does" -
  // the 3:45 PM BTC long passed on a one-tick blip to 81,036.56, $4.60 back over -2σ after the 5m candle had dipped under it): on BTC, once this 5m candle has been
  // under the session band below price, a long needs price $10+ back over it; once it has been over the band above, a short needs price $10+ back under it.
  if (!why && asset === "btc" && !beyond && !foTurn) { try { const hlB = fiveHLNow(asset);
    if (hlB && side === "up" && Number(hlB.l) < below && tick - below < 10) why = `BACK OVER BY $10: this 5m candle dipped under ${below.toFixed(2)} and price is only $${(tick - below).toFixed(2)} back over it - a long needs $10+ over the band.`;
    if (hlB && side === "down" && Number(hlB.h) > above && above - tick < 10) why = `BACK UNDER BY $10: this 5m candle poked over ${above.toFixed(2)} and price is only $${(above - tick).toFixed(2)} back under it - a short needs $10+ under the band.`;
  } catch {} }
  if (!why && side === "up" && cdl === "down") why = `HER CANDLE: the 5m candle is falling - a short or nothing, never a long.`;
  if (!why && side === "down" && cdl === "up") why = `HER CANDLE: the 5m candle is rising - a long or nothing, never a short.`;
  if (beyond) return { why, below: below0 ?? null, above: above0 ?? null, pos: Math.round(pos * 1000) / 1000, lock: null };
  return { why, below, above, pos: Math.round(pos * 1000) / 1000, lock: IMPOSSIBLE };
}
