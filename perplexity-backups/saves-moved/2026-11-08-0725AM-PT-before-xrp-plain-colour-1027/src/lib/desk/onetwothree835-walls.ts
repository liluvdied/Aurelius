// fix835 1-2-3 · SEALED · PAPER - HER WALLS (bandLockCheck, the recon door) from PRE295 bandlock.ts. PAPER ONLY: no order path.
// Every block between "===== FROZEN" markers is copied byte for byte from data/vault-123-pre295 (PRE295-BUILD, the desk as it stood Oct 26 2026 ~9:30 PM PT) and checked by
// seal835() in onetwothree835.ts (vault sha256 + every block's text). Change a single byte inside a block and both 1-2-3 books stop and say why.
// Outside the markers is plumbing only: the imports below resolve to the sealed sandbox (onetwothree835-sandbox.ts), never to the live desk's modules or globals.
import { join } from "node:path";
import { SANDBOX, appendFileSync, feedHealth, quoteTick, readFileSync } from "./onetwothree835-sandbox";
import { RECON } from "./onetwothree835-recon";
const globalThis = SANDBOX; // her frozen code's globalThis is the sealed sandbox, not the live desk

// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 14-17 =====
type Line = { name: string; price: number; unit?: number };
const LAW_BOOKS = /^ogp5-(fast|gw|boll|lock)$/;
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 20-26 =====
function nearSide(L: Line[], tick: number): { side: "up" | "down" | null; band: Line } | null {
  const ls = L.filter((l) => Number(l.price) > 0);
  if (!(tick > 0) || !ls.length) return null;
  let near = ls[0];
  for (const l of ls) if (Math.abs(tick - l.price) < Math.abs(tick - near.price)) near = l;
  return { side: tick < near.price ? "down" : tick > near.price ? "up" : null, band: near };
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 31-36 =====
export function bandReach(asset: string): number {
  const def: Record<string, number> = { btc: 25, gold: 2.22 };
  if (!G.__stDefaultReach) { try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.bandReach?.[asset]); if (v > 0) return v; } catch {} }
  return def[asset] ?? Infinity;
}
const inReach = (asset: string, price: number, tick: number) => Math.abs(tick - Number(price)) <= bandReach(asset);
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 40-45 =====
export function zoneReach(asset: string): number {
  if (!G.__stDefaultReach) { try { const v = Number(JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.zoneReach?.[asset]); if (v > 0) return v; } catch {} }
  return bandReach(asset);
}
const isZoneLine = (l: Line) => /(^|\s)(R|S)\d$/.test(String(l.name));
const inReachL = (asset: string, l: Line, tick: number) => Math.abs(tick - Number(l.price)) <= (isZoneLine(l) ? zoneReach(asset) : bandReach(asset));
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 49-49 =====
export const NO_REJ_HOLD = new Set<string>(["ogp5", "pap247", "paper-247", "ogp5-pk2", "ogp5-pk3", "paper-247-pk2", "paper-247-pk3"]);
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 73-75 =====
const PT_HOUR_Q = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" });
export function quietHour(now = Date.now()): boolean { try { return Number(PT_HOUR_Q.format(new Date(now))) === 15; } catch { return false; } }
const QUIET_EDGE = /^5m (PP|R1|S1)$|^5m BBSR (upper|lower)$|^BB (upper|lower)$/;
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 78-78 =====
export const isChanBand = (asset: string, l: Line) => (false && quietHour() ? QUIET_EDGE.test(String(l.name)) : /σ$|^session VWAP$|^fresh VWAP$/.test(String(l.name))); // fix219 fresh VWAP joins her channel (fresh ±σ already end in σ)
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 80-85 =====
export function chanL(asset: string, L: Line[]): Line[] {
  if (!quietHour()) return L || [];
  const have = new Set((L || []).map((l) => String(l.name)));
  return [...(L || []), ...bbLines(asset).filter((l) => !have.has(String(l.name)))];
}
const isSessBand = (l: Line) => /σ$|^session VWAP$|^fresh VWAP$|^BB (upper|lower)$/.test(String(l.name));
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 95-95 =====
export const BB_BOOKS = new Set<string>(["ogp5-bbsr", "ogp5-dly"]); // + DELAYED (Love, Oct 18 ~6:05 PM PT: "you can have her use the bollinger bands too for the delayed entry book" + "Both")
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 98-98 =====
export const NO_AT_WAIT = new Set<string>(["ogp5-dly"]);
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 115-120 =====
const noPink = (L: Line[]) => L.filter((l) => l.name !== "5m PP");
export function bbLines(asset: string): Line[] {
  const b = G.__bbsr?.[asset];
  if (!b || !(Number(b.bbU) > 0) || !(Number(b.bbL) > 0) || Date.now() - Number(b.at) > 20000) return [];
  return [{ name: "5m BBSR upper", price: Number(b.bbU) }, { name: "5m BBSR lower", price: Number(b.bbL) }];
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 123-128 =====
export function isSessRej(x: any): boolean {
  if (!x) return false;
  const bn = String(typeof x.band === "string" ? x.band : x.band?.name ?? "");
  if (!/σ$|^session VWAP$|^BB (upper|lower)$/.test(bn)) return false;
  return x.from === "rejection" || /reject|bounce|tap/i.test(`${x.kind ?? ""} ${x.label ?? ""}`);
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 170-238 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 245-253 =====
export function zoneFlipNow(asset: string, L: Line[], tick: number, o: number, hl: { h: number; l: number } | null): "up" | "down" | null {
  const tapZ = PINK_TAP[asset] ?? 0, brkZ = BREAK_DIST[asset] ?? 0;
  if (!(o > 0) || !(tick > 0) || !hl || !(tapZ > 0) || !(brkZ > 0)) return null;
  const pZ = (n: string) => { const l0 = L.find((x) => String(x.name) === n); const p0 = Number(l0?.price); return p0 > 0 ? p0 : 0; };
  const r1 = pZ("5m R1"), r2 = pZ("5m R2"), s1 = pZ("5m S1"), s2 = pZ("5m S2");
  if (r1 > 0 && o < r1 && hl.h >= r1 - tapZ && hl.h < (r2 > 0 ? r2 : r1) + brkZ && tick < o && tick <= hl.h - tapZ) return "down";
  if (s1 > 0 && o > s1 && hl.l <= s1 + tapZ && hl.l > (s2 > 0 ? s2 : s1) - brkZ && tick > o && tick >= hl.l + tapZ) return "up";
  return null;
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 260-278 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 283-457 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 463-482 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 487-488 =====
const rgOffFor = (side: string) => (X: Line[]) => X.filter((l) => !(side === "up" ? /^5m S[12]$/ : /^5m R[12]$/).test(String(l.name)));
export const PASS_THRU = new Set<string>(["brk-sesspk"]);
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 492-503 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 507-507 =====
export const WALL_FREE = new Set<string>(["brk-sesspk"]);
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 516-522 =====
export const ZONE_REACH_PCT: Record<string, number> = { btc: 0.24, gold: 0.51 };
export function zoneReachSlide(asset: string, Z: Zones): number {
  const w = Z.r1 - Z.pp;
  const pct = ZONE_REACH_PCT[asset] ?? 0;
  if (!(w > 0) || !(pct > 0)) return asset === "gold" ? 1.5 : 25;
  return Math.round(w * pct * 100) / 100;
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 525-541 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 550-578 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 587-781 =====
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
    if (book === "recon-dly" && dlyFreeNow(asset)) { const gwR = dlyKeeps(impossibleGeo(asset, lbR.L, qR.c, side, true).why, asset); return gwR ? deny(gwR, { tick: qR.c }) : { ok: true }; } // THE DELAYED BOOK in her off hours (Love, Oct 21 ~10:59 AM PT) - free but for her 33% + top/bottom line (11:21 AM)
    const imR = impossibleGeo(asset, lbR.L, qR.c, side, false, book === "recon-dly", book === "recon-togp").why; // fix272: twin pink-free every hour // THE IMPOSSIBILITY at her door too (Oct 20 ~2:37 PM PT, Love) - same function as the wire
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1152-1184 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1186-1186 =====
export const BREAK_DIST: Record<string, number> = { btc: 6, gold: 0.33 }; // BTC $8 -> $6 Oct 19 ~12:26 AM PT (Love: "let's lower btc's break to $6 from its original $8 tpls") // // gold 50c -> 33c Oct 18 ~9:04 PM PT (Love: "could you make the push thru a band 33 cents instead of 50 for now bb") // // Love, Oct 17 ~1:15 AM PT; gold $1 -> 50c Oct 18 ~3:51 PM PT ("$1 is waaay too wide rn bb... let's bring that down to 50 cents pls")
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1199-1238 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1242-1268 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1275-1298 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1372-1443 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1448-1448 =====
export const PINK_ROOM: Record<string, number> = { btc: 25, gold: 1.5 }; // fallback only, when the session bands are missing
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1452-1455 =====
export function roomFor(asset: string, L: Line[], x = 0.15): number {
  const u = L.find((l) => l.unit && l.unit > 0)?.unit || 0;
  return u > 0 ? x * u : (PINK_ROOM[asset] || 0) * (x / 0.15);
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1459-1473 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1481-1511 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1517-1523 =====
export const ZONE_VOL_X = 2;
function strongVol(v: { cur: number; avg: number; frac?: number } | null | undefined): boolean {
  if (!v || !(v.avg > 0)) return false;
  const f = v.frac ?? 1;
  if (f < 0.2) return false;
  return v.cur / f >= ZONE_VOL_X * v.avg;
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1529-1563 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1582-1582 =====
export const INDEX_BIAS: Record<string, number> = { btc: 30 };
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1584-1601 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1612-1635 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1640-1648 =====
export function atSessionBand(asset: string, W: Line[], tick: number): string {
  const d = BREAK_DIST[asset] ?? 0;
  if (!(d > 0) || !(tick > 0) || !W.length) return "";
  const near = W.slice().sort((a, b) => Math.abs(a.price - tick) - Math.abs(b.price - tick))[0];
  if (!near || !/σ$|^session VWAP$|^BB (upper|lower)$/.test(String(near.name))) return "";
  const gap = Math.abs(near.price - tick);
  if (gap >= d) return "";
  return `at ${near.name} (${Number(near.price).toFixed(2)}, ${gap.toFixed(2)} ${tick >= near.price ? "over" : "under"} it): waiting for a break or a rejection ($${d} either way)`;
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1672-1672 =====
export const PINK_TAP: Record<string, number> = { btc: 3, gold: 0.3 };
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1742-1756 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1764-1773 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1778-1786 =====
export function sessStartMs(now = Date.now(), asset = ""): number {
  // INDEX SESSION (Oct 18 ~4:50 PM PT): her INDEX:BTCUSD chart's VWAP session starts 00:00 UTC (5 PM PT), not 5 PM ET, so on INDEX
  // the BTC carry-over (keep the old session's bands until the new ones widen) turns over at 00:00 UTC with her chart.
  if (asset === "btc" && /^(INDEX|COINBASE):BTCUSD$/.test(String((globalThis as any).__symBtc))) return Math.floor(now / 86400000) * 86400000; // Coinbase too (00:00 UTC session)
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now))) p[x.type] = x.value;
  const secs = ((Number(p.hour) - 17 + 24) % 24) * 3600 + Number(p.minute) * 60 + Number(p.second);
  return Math.floor((now - secs * 1000) / 60000) * 60000;
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1792-1803 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1820-1822 =====
export const ZONES_OFF = new Set<string>(["ogp5-sess", "ogp5-c1", "ogp5-c5", "ogp5-hrs", "ogp5-bbsr", "ogp5-dly", "brk-sesspk"]); // + the close twins (Oct 17 ~10:50 PM PT, paper)
const noZ = (L: Line[]) => L.filter((l) => !/^5m (R1|R2|S1|S2)$/.test(String(l.name)));
export const ROOM_TWIN: Record<string, number> = { "ogp5-r15": 0.15, "ogp5-r30": 0.30 }; // paper twins that keep the sigma room rule
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1828-1828 =====
type RejMem = Record<string, { dir: "up" | "down"; at: number; price: number }>;
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1842-1852 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1879-1882 =====
export function wallLines(asset: string, L: Line[]): Line[] {
  if (asset === "btc" && quietHour()) return L.filter((l) => !/^5m (R2|S2)$/.test(String(l.name))); // 3 PM hour: BTC's red/green zones are edges
  return asset === "btc" ? L.filter((l) => !/^5m (R1|R2|S1|S2)$/.test(String(l.name))) : L;
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1889-1907 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1914-1914 =====
export const PINK_HOLD_GAP: Record<string, number> = { btc: 25 };
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1919-1943 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 1968-2001 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2006-2014 =====
export function wallFor(W: Line[], Bk: Map<string, "up" | "down">, tick: number, side: string): Line[] {
  return W.filter((l) => {
    const b = Bk.get(l.name);
    if (!b) return true;
    if (side === "down" && b === "down" && l.price < tick) return false;
    if (side === "up" && b === "up" && l.price > tick) return false;
    return true;
  });
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2092-2097 =====
const DLY_BTC_EDGE = 0.05;
export const dlyKeeps = (why: string, asset = ""): string => {
  if (!why || why.startsWith("HER CANDLE")) return "";
  if (asset === "btc") { const m = /^(THE IMPOSSIBILITY|ONLY IN HER THIRD): (long|short) at (\d+)% of /.exec(why); if (m) { const p = Number(m[3]) / 100; if (m[2] === "long" ? p < 1 - DLY_BTC_EDGE : p > DLY_BTC_EDGE) return ""; } }
  return why;
};
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2102-2112 =====
const DLY_FREE = true;
export function dlyFreeNow(asset = ""): boolean { // fix278: asset picks its own hours (bookSkipHoursByAsset)
  if (!DLY_FREE) return false;
  try {
    const sw = JSON.parse(readFileSync(D("live-switch.json"), "utf8"));
    // HOURS BY KALSHI'S LABEL (Oct 22 ~4:30 PM PT, Love picked "Follow Kalshi labels"): an hour owns the windows Kalshi labels :00, :15, :30 and :45 by their
    // close time, so the hour is read off the running window's CLOSE (the 3:45-4:00 PM window, labelled 4:00, belongs to the 4 PM book). Four full windows each.
    const mA = asset ? sw?.bookSkipHoursByAsset?.[String(asset).toLowerCase()]?.["recon-tog"] : null; const hrs = Array.isArray(mA) ? mA : sw?.bookSkipHours?.["recon-tog"]; const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24;
    return Array.isArray(hrs) && hrs.map(Number).includes(h);
  } catch { return false; }
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2169-2174 =====
export function squeezedPinkOf(L: Line[]): (l: Line) => boolean {
  // fix153: the 3 PM hour reads the squeezed pink like every other hour
  const vw = (L || []).find((l) => String(l.name) === "session VWAP"), u1 = (L || []).find((l) => String(l.name) === "+1σ");
  const sd = vw && u1 ? Math.abs(Number(u1.price) - Number(vw.price)) : 0;
  return (l: Line) => String(l.name) === "5m PP" && sd > 0 && (L || []).some((s) => isSessBand(s) && Math.abs(Number(s.price) - Number(l.price)) < 0.25 * sd);
}
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2178-2188 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2196-2208 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2214-2236 =====
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
// ===== END FROZEN =====
// ===== FROZEN 1-2-3 - data/vault-123-pre295/bandlock.ts lines 2258-2610 =====
export function impossibleGeo(asset: string, L: Line[], tick: number, side: string, twinFade = false, twinPinkAll = false, togpLoose = false /* fix286: the no-pink copy */): { why: string; below: number | null; above: number | null; pos: number | null; lock: number | null } {
  const sqzE = squeezedPinkOf(L);
  const edges = chanL(asset, L).filter((l: Line) => isChanBand(asset, l) && !sqzE(l)).map((l: Line) => Number(l.price)).filter((x: number) => x > 0).sort((x: number, y: number) => x - y);
  if (!(tick > 0) || edges.length < 2) return { why: "THE IMPOSSIBILITY: her bands can't be read - no opening order", below: null, above: null, pos: null, lock: null };
  // BANDS JUMPED (fix104, Oct 22 ~7:30 PM PT - the 7:00 PM gold short at 3990.72 read a session sigma of $2,509 for a few seconds at the top of the hour,
  // so price 'sat in the top third' of a nonsense channel): when sigma jumps past 3x the last good read (within 10 min), her bands can't be read - no opening order.
  if (!G.__stDefaultReach) { try { const vwJ = Number((L || []).find((l: Line) => String(l.name) === "session VWAP")?.price) || 0, u1J = Number((L || []).find((l: Line) => String(l.name) === "+1σ")?.price) || 0, sdJ = Math.abs(u1J - vwJ);
    if (vwJ > 0 && sdJ > 0) { const GJ = ((G.__sdGood ||= {}) as Record<string, { sd: number; t: number }>), gj = GJ[asset];
      if (gj && Date.now() - gj.t < 600000 && sdJ > 3 * gj.sd) return { why: `THE IMPOSSIBILITY: her session bands just jumped (sigma ${sdJ.toFixed(2)} vs ${gj.sd.toFixed(2)} a moment ago) - can't be read, no opening order`, below: null, above: null, pos: null, lock: null };
      GJ[asset] = { sd: sdJ, t: Date.now() }; } } catch {} }
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
  const IMPOSSIBLE = lockPctFor(asset, above - below);
  const pctTxt = Math.round(IMPOSSIBLE * 100);
  let why = "";
  if (!beyond && side === "up" && pos >= 1 - IMPOSSIBLE) why = `THE IMPOSSIBILITY: long at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - the top ${pctTxt}%, into the unbroken band above. never.`;
  if (!beyond && side === "down" && pos <= IMPOSSIBLE) why = `THE IMPOSSIBILITY: short at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - the bottom ${pctTxt}%, into the unbroken band below. never.`;
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
        else if (brZ && asset === "gold" && tick < r1Z && r1Z < nxZ) why = `BREAK INTO A ZONE: gold long broke ${brZ.toFixed(2)} with the red zone (${r1Z.toFixed(2)}) ahead before the next band - those reverse; no long here.`;
        // RED ZONE OVER A BAND (fix242, Oct 25 10:11 PM PT, card "Any red zone over a band" + 10:13 PM "half one zone height is good hun"): gold's 10 PM long sat in the red zone right over +2σ it had broken a candle earlier.
        if (!why && tick >= r1Z && tick < r2Z) { const bZ = sessZ.filter((b: number) => b < tick && b >= r1Z - (r2Z - r1Z) / 2).sort((x: number, y: number) => y - x)[0];
          if (bZ) why = `RED ZONE OVER A BAND: long inside the red zone (${r1Z.toFixed(2)}-${r2Z.toFixed(2)}) sitting right over the band ${bZ.toFixed(2)} - those reverse; no long here.`; } }
      else { const brZ = sessZ.filter((b: number) => tick < b && b < o5Z).sort((x: number, y: number) => x - y)[0], nxZ = Math.max(...sessZ.filter((b: number) => b < tick), -Infinity);
        if (brZ && tick <= s1Z && tick > s2Z) why = `BREAK INTO A ZONE: short broke ${brZ.toFixed(2)} and landed inside the green zone (${s2Z.toFixed(2)}-${s1Z.toFixed(2)}) - those reverse; no short here.`;
        else if (brZ && asset === "gold" && tick > s1Z && s1Z > nxZ) why = `BREAK INTO A ZONE: gold short broke ${brZ.toFixed(2)} with the green zone (${s1Z.toFixed(2)}) ahead before the next band - those reverse; no short here.`;
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
    const w10 = asset === "btc" ? ((above - below) < 100 ? 25 /* fix293 (Oct 26 3:30 PM PT, Love: "set the standard if no trades into pink within $25 if band channel width is under $100 so we don't need to keep adjusting day to day"): BTC channel under $100 -> $25 pink cushion, every book */ : Math.max(50, ((above - below) >= 1000 ? 0.10 : 0.15) * (above - below))) /* fix182 (Oct 24 ~11:23 PM PT, Love: "let's make that $50 minimum and the rest of the scale up from there") */ : w10b; // fix179 (Oct 24 ~10:53 PM PT, Love: "for pink we will have it at a solid 15% at bands $200 and under/over and 15% at $500, 10% at 1k"): BTC pink cushion 15% of channel under $1k, 10% from $1k; gold unchanged. Was fix174 (Oct 24 ~9:41 PM PT, Love: "let's go ahead and bring that back to 10% of the channel width for the moment hun i didn't realize the whole channel was still $200 rn"): the pink cushion is plain 10% again on BTC (no $50 floor); the Bollinger cushion keeps its $50 baseline (w10f)
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
      const pbd = asset === "btc" ? 3 /* fix166 (Oct 24 ~5:09 PM PT, Love: "we can lower it from $5 to $3") */ : (BREAK_DIST[asset] ?? 0); // fix162 (Oct 24 ~10:17 AM PT, Love: "make it a break of $5 bb"; gold keeps its 33c): the pink counts as broken only once price is past it by her break distance - a tick through is still unbroken
      // THE 5M PINK CUSHION (fix199, Oct 25 ~3:50 AM PT, Love: "let's loosen it to $25 on there bb"): on Polymarket's 5m board the BTC pink cushion is $25 at most.
      let w10e = asset === "btc" && Number(G.__pinkCap5) > 0 ? Math.min(w10, Number(G.__pinkCap5)) : asset === "gold" ? Math.max(w10, 2) : w10; // fix262 (Oct 26 ~2:50 AM PT, Love: "its 10% or $2. whichever comes first" - 2:46 AM gold short $1.18 over the unbroken pink passed the $1.05 10%): gold pink cushion = 10% of the channel, never under $2 (her fix89 "$2 of the pink")
      if (togpLoose && asset === "btc") w10e = Math.min(w10e, 25); // fix292 (Oct 26 ~3:24 PM PT, Love card "Pink cushion $25 for the copy"): the no-pink copy's BTC PINK 10% cushion is $25 at most (3:16 PM: $50 cushion in a $68 channel held her long); main and gold unchanged
      if (!why && side === "up" && pp > tick - pbd && pp - tick <= w10e) why = `PINK 10%: long $${(pp - tick).toFixed(2)} under the unbroken pink (${pp.toFixed(2)}) - inside ${asset === "gold" ? 10 : 10}% ($${w10e.toFixed(2)}) of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel. wait for pink to break up.`;
      if (!why && side === "down" && pp < tick + pbd && tick - pp <= w10e) why = `PINK 10%: short $${(tick - pp).toFixed(2)} over the unbroken pink (${pp.toFixed(2)}) - inside ${asset === "gold" ? 10 : 10}% ($${w10e.toFixed(2)}) of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel. wait for pink to break down.`;
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
        const w10g286 = togpLoose && asset === "btc" ? Math.min(w10g, 25) : w10g;
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
  if (!why && asset === "gold" && side === "up") {
    const ppG = Number((L || []).find((l: Line) => String(l.name) === "5m PP")?.price) || 0, r1G = Number((L || []).find((l: Line) => String(l.name) === "5m R1")?.price) || 0;
    if (ppG > 0 && r1G > ppG && tick > ppG && tick < r1G && (((): boolean => { const vwP = Number((L || []).find((l: Line) => String(l.name) === "session VWAP")?.price) || 0, u1P = Number((L || []).find((l: Line) => String(l.name) === "+1σ")?.price) || 0, sdP = Math.abs(u1P - vwP); return (tick - ppG) / (r1G - ppG) >= 0.50 /* fix276 (Oct 26 ~11:43 AM PT, Love: "no longs into the top 40% of the channel from pink to red" + "let's make it an even 50% for gold hun"): top 50% at every band width, was top 40% only once session bands are $10+ apart */ || (!(sdP > 0 && sdP >= 10) && r1G - tick <= 1.5); })()) /* fix134 (Oct 23 12:32 AM PT, Love: "bring that down to $1.50 ... indefinitely"): $1.50 under the red, was $2 */ /* fix111: top 40% again once session bands are $10+ apart */ && true /* fix108 (Oct 22 ~7:41 PM PT, Love card "Both"): $2 under the red, was top 40% (>= 0.60) */) why = `PINK TO RED: long $${(r1G - tick).toFixed(2)} under the red, at ${Math.round((tick - ppG) / (r1G - ppG) * 100)}% of the pink ${ppG.toFixed(2)} -> red ${r1G.toFixed(2)} space - no gold long in the top 50% of it (or within $1.50 of the red). wait for the red to reject (short) or the pink to reject (long).`;
  }
  // PINK TO GREEN (fix276, Oct 26 ~11:43 AM PT, Love: "no longs into the top 40% of the channel from pink to red and shorts in the bottom 40% of the channel from
  // pink to green - gold only pls" + "let's make it an even 50% for gold hun"): the mirror of PINK TO RED - gold only, between the green (5m S1) and the pink
  // (5m PP) above it, no short in the bottom 50% of that space.
  if (!why && asset === "gold" && side === "down") {
    const ppH = Number((L || []).find((l: Line) => String(l.name) === "5m PP")?.price) || 0, s1H = Number((L || []).find((l: Line) => String(l.name) === "5m S1")?.price) || 0;
    if (ppH > 0 && s1H > 0 && s1H < ppH && tick < ppH && tick > s1H && (tick - s1H) / (ppH - s1H) <= 0.50) why = `PINK TO GREEN: short $${(tick - s1H).toFixed(2)} over the green, at ${Math.round((tick - s1H) / (ppH - s1H) * 100)}% of the green ${s1H.toFixed(2)} -> pink ${ppH.toFixed(2)} space - no gold short in the bottom 50% of it. wait for the green to reject (long) or the pink to reject (short).`;
  }
  // BOLLINGER $100 OVER THE BAND (Oct 22 ~7:07 AM PT, Love: "for btc's long just now, on the break up, the bollinger was within $100 of the band it broke / let's include
  // that for longs and for the shorts not just the shorts" + card "Any entry near the band"): BTC only - no long while the Bollinger upper sits above price within $100
  // of the session band she is over; no short while the Bollinger lower sits below price within $100 of the band she is under. Her pink-break skip (recon) stays.
  if (!why && !beyond && asset === "btc") {
    const zB = G.__bbsr?.btc, bU = Number(zB?.bbU) || 0, bL = Number(zB?.bbL) || 0;
    if (zB && Date.now() - Number(zB.at) <= 20000) {
      if (side === "up" && bU > tick && bU - below <= 50 /* fix158 (Oct 23 ~8:27 PM PT, Love: "lower it to $50 temporarily"): was $100 */) why = `BOLLINGER OVER THE BAND: long $${(tick - below).toFixed(2)} over ${below.toFixed(2)} with the Bollinger upper (${bU.toFixed(2)}) only $${(bU - below).toFixed(2)} above that band - skip.`;
      if (side === "down" && bL > 0 && bL < tick && above - bL <= 50 /* fix158 */) why = `BOLLINGER UNDER THE BAND: short $${(above - tick).toFixed(2)} under ${above.toFixed(2)} with the Bollinger lower (${bL.toFixed(2)}) only $${(above - bL).toFixed(2)} below that band - skip.`;
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
      const hit = TB.filter((l: Line) => !((twinFade || twinPinkAll || foTurn) && String(l.name) === "5m PP")).filter((l: Line) => { const P = Number(l.price); return side === "up" ? P > tick && P <= tgt + 1.5 : P < tick && P >= tgt - 1.5; }).sort((x: Line, y: Line) => Math.abs(Number(x.price) - tick) - Math.abs(Number(y.price) - tick))[0];
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
  if (!why && side === "up" && pos >= 1 - TH) why = `ONLY IN HER THIRD: long at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - no long in the top ${thTxt}%, under the unbroken band above.`;
  if (!why && side === "down" && pos <= TH) why = `ONLY IN HER THIRD: short at ${Math.round(pos * 100)}% of the ${below.toFixed(2)} -> ${above.toFixed(2)} channel - no short in the bottom ${thTxt}%, over the unbroken band below.`;
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
// ===== END FROZEN =====
