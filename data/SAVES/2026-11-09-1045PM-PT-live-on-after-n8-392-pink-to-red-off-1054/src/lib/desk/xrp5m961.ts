// fix961 XRP 5M ON POLYMARKET - MAIN'S NOV 3 MODEL (Love Nov 7 2026 ~5:13 PM PT: "for now let's get the xrp 5M book set up / just put it on the nov 3 save point and we'll see how she does
// on the first couple windows" + "main" + "it's on poly" + "no , live pls").
// Her own XRP lane. It never touches the BTC / gold read, her walled Polymarket 5M model files (R169) or any other book.
//   Feed: Coinbase XRP-USD 1m candles (public), the forming minute included. Lines (her ETH port, ethBands682): session VWAP ±1/2/3σ, 5m CM pivot (pink / red zone R1 / green zone S1), Bollinger 20/2 on 5m.
//   Numbers: her BTC dollars scaled to XRP by price (k = XRP price / 80,000): $2 break -> 2k, reach of a band 15% of the channel, thirds 33%, pink-to-zone 45%, pink cushion tiers by channel.
//   MAIN'S NOV 3 ENTRIES (safe point 0d56a584): (1) a rejection off a session band / red or green zone / Bollinger: this 5m candle came to it (within 15% of the channel) from its near side,
//   did not break it by her break, and price is back on her side with her 2m OR 5m candle her colour (Nov 3: any 2-5m flip, no $ push); (2) her pink break: the 5m opened on the
//   other side of pink and price is past pink by her break with the 2m her colour; (3) her failed break of pink: it broke pink by her break this candle and came back through it,
//   2m her colour. Nov 3 walls: thirds, past the red / green zone, pink-to-red / pink-to-green 45%, her pink cushion. (No pink-slide 44% / 2 PM rule - those came after Nov 3.)
//   5-MINUTE WINDOWS: Polymarket's XRP up/down 5m window IS the 5m candle; she enters only with 60 s or more left (her 15m books stop at 2 min) and once per window.
// Money: $1 an entry (her Poly size = half her $2 live slider; data/xrp5m-961-cfg.json), through the desk's Polymarket buy (buySlug): the umpire must be SAFE, the LIVE switch on, the $ cap,
// her 1.5x floor (ask 66c or less), Polymarket cash, one buy per window (the desk remembers every bought window). A stale feed (no XRP minute in 120 s) = no trade.
// Log: data/xrp5m-961.jsonl. Paper rows (every call, for the card): data/xrp5m-961-book.json.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ethBands682 } from "./ethbook";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
export type Cfg961 = { on: boolean; dollars: number; maxAsk: number };
export function cfg961(): Cfg961 {
  let c: any = {}; try { c = JSON.parse(readFileSync(D("xrp5m-961-cfg.json"), "utf8")) || {}; } catch {}
  return { on: c.on === true, dollars: Math.min(5, Number(c.dollars) > 0 ? Number(c.dollars) : 1), maxAsk: Math.min(0.66, Number(c.maxAsk) > 0 ? Number(c.maxAsk) : 0.66) };
}
function log(x: any) { try { appendFileSync(D("xrp5m-961.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
type Row = { id: string; slug: string; at: string; side: "up" | "down"; label: string; spot: number; ask: number | null; live: string; closesAt: string };
function book(): { rows: Row[]; seen: Record<string, number>; add1029?: Record<string, Record<string, number>> } { if (G.__xrp961) return G.__xrp961; let s = { rows: [] as Row[], seen: {} as Record<string, number> }; try { if (existsSync(D("xrp5m-961-book.json"))) s = { rows: [], seen: {}, ...JSON.parse(readFileSync(D("xrp5m-961-book.json"), "utf8")) }; } catch {} G.__xrp961 = s; return s; }
function save() { try { const s = book(); s.rows = s.rows.slice(-2000); const cut = Date.now() - 2 * 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D("xrp5m-961-book.json.tmp"), JSON.stringify(s)); renameSync(D("xrp5m-961-book.json.tmp"), D("xrp5m-961-book.json")); } catch {} }
async function j(url: string): Promise<any> { const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "aurelius-xrp/1.0" }, signal: AbortSignal.timeout(8000) }); return r.json(); }
async function bars(): Promise<Bar[]> {
  const B = (G.__xrp961Bars ||= { at: 0, m: new Map<number, Bar>() });
  if (Date.now() - B.at < 5000 && B.m.size) return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
  const need = B.m.size < 600 ? 3 : 1;
  for (let k = need - 1; k >= 0; k--) {
    const end = Math.floor(Date.now() / 1000) - k * 300 * 60, start = end - 300 * 60;
    const d = await j(`https://api.exchange.coinbase.com/products/XRP-USD/candles?granularity=60&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`);
    if (Array.isArray(d)) for (const x of d) B.m.set(x[0], { t: x[0], l: x[1], h: x[2], o: x[3], c: x[4], v: x[5] });
  }
  for (const k of [...B.m.keys()]) if (k < Date.now() / 1000 - 2 * 86400) B.m.delete(k);
  B.at = Date.now(); return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
}
// fix1004 XRP-POLY-CORNERSTONES ON MAIN'S CURRENT CONFIGURATION (Love Nov 7 2026 8:49 PM PT: "hun she longed xrp on poly when the candle was red and under a bollinger. candles need to be her color. the wick
// rejections didn't trigger so she entered on a red candle pushing" + 8:53 PM: "ok you can put her on the new configuration bb ... new one pls" + 7:31 PM: "it needs to be ON THE SAME SIDE OF THE BAND. 100% OF THE
// TIME ... FLIP (or born candle) AND PUSH. NOTHING ELSE" + 7:40 PM XRP push: bands 0.05c, pink 0.10c, wick $0.0005). Her XRP lane now reads main's CURRENT setups and walls (bandlock.ts), scaled to XRP (k = price / 80,000):
//   setups: rejections off the session bands, red / green zones, Bollinger upper / MIDDLE / lower (fix963); breaks of pink and the session bands by her break (2k); failed breaks of pink and the session bands.
//   walls: thirds 33%; past the red / green zone and pink-to-zone (fix594: refused in the top 55% = 45%+ of pink to the zone, bandlock zoneSend594); her pink 20% cushion (fix459: no long under an unbroken pink
//   within 20% of the channel, mirror for shorts); her line-in-the-way reach (fix429: no long into an unbroken session band / pink / zone within 25k at channels under 100k, 50k over); her $25 Bollinger wall (fix962,
//   scaled 25k: upper, middle, lower) unless the trade is off that Bollinger or price broke past it (fix995: a broken Bollinger is not a wall on the way back).
//   her cornerstones (every entry): (a) her colour that is REAL - the 2m or 5m candle her colour by at least her push over its open (a flip back through its open or born her colour, past it by her push) - a 1-tick
//   colour is not her colour; (b) price on her side of the line it trades off; (c) the flat push off the turn (5m low for a long / high for a short): bands $0.0005, pink $0.0010; (e) her rule C mirrored: no long while
//   the forming 5m is red and price is under the Bollinger middle ("the candle was red and under a bollinger"), no short while it is green and over it.
//   The ONLY exception: a REAL wick rejection off a line (came within 10% of the channel, pulled back $0.0005 from the wick toward her side) - labelled "(wick)", it skips colour (a) only - "she entered on a red candle pushing". // fix1033 wick threshold 15%->10% (Love Nov 8 2026: "please get her to enter on the wick rejections of 10% of the channel width")
export const PUSH1004 = { band: 0.00025, /* fix1031 XRP push 0.00025 (Love Nov 8 2026: "0.00025 for xrp") */ pink: 0.001, wick: 0.0005 };
/** fix1004 her cornerstones + her Bollinger wall, one line - "" = her entry, else every reason it is not (BTC / ETH 5m lanes: pass their own push $, wall $ and Bollinger; label = the read's label) */
export const cornerstones1004 = (x: { side: "up" | "down"; spot: number; line: number; lineName: string; label: string; o2: number; o5: number; lo2: number; hi2: number; lo5: number; hi5: number; push: number; wall: number; bbUp: number; bbMid: number; bbLo: number; wick?: boolean }): string => { const s = x.side === "up" ? 1 : -1, d = (a: number, b: number) => s * (a - b), why: string[] = [], turn = s > 0 ? x.lo5 : x.hi5; if (!x.wick && !(d(x.spot, s > 0 ? x.lo2 : x.hi2) >= x.push - 1e-9 || d(x.spot, s > 0 ? x.lo5 : x.hi5) >= x.push - 1e-9)) why.push(`COLOUR (fix1032): her 2m / 5m candle is not ${s > 0 ? "green" : "red"} by her push $${x.push} from the ${s > 0 ? "low" : "high"} (2m ${d(x.spot, s > 0 ? x.lo2 : x.hi2).toFixed(4)}, 5m ${d(x.spot, s > 0 ? x.lo5 : x.hi5).toFixed(4)})`); /* fix1027 PLAIN COLOUR (Love Nov 8 2026 12:19-12:22 AM PT: "okay whatever opening color candle lock you instituted that is now blocking trades please remove it" + "color of the candle still needs to be the same as our trade, aside from the wick rejection exemption ... candle flips green - push distance met ==== get in"): her colour is the 2m or 5m candle's current colour, any amount past its open - the $0.0005 / $0.0010 cushion over the open is gone; her push off the turn stays its own check, wicks stay exempt, same side stays */ if (!(d(x.spot, x.line) > 0)) why.push(`SAME SIDE (fix1004): price is not on her side of ${x.lineName}`); const from1038 = s > 0 ? Math.max(turn, x.line) : Math.min(turn, x.line); /* fix1038 (Love Nov 8 2026 2:54 PM PT: "she said it's still operating on the candle open. so if the candle opening price is $100 away , it could be green that whole time and not enter until after it crosses the open by $50. it's a huge flaw hun that needs to be addressed / set it to distance from the band like we discussed" + "the high and low of that candle not the open"): her push is measured from the BAND (or the candle's own low / high when it stopped short of the band - her fix656 rule), never the candle open */ if (d(x.spot, from1038) < x.push - 1e-9) why.push(`PUSH (fix1004): only $${d(x.spot, from1038).toFixed(4)} past ${s > 0 ? "the band / 5m low" : "the band / 5m high"} (fix1038 from the band), her push is $${x.push}`); for (const [n, b] of [["upper", x.bbUp], ["middle", x.bbMid], ["lower", x.bbLo]] as [string, number][]) if (b > 0 && d(b, x.spot) >= 0 && d(b, x.spot) <= x.wall && !new RegExp("(Bollinger|BB) " + n, "i").test(x.label) && !(n === (s > 0 ? "lower" : "upper") || (n !== "middle" /* fix1041 the middle Bollinger stays her wall after a break and retest - only the outers stop */ && (s > 0 ? x.hi5 > b : x.lo5 < b)))) why.push(`BOLLINGER WALL (fix1004 / fix962 / fix995): the unbroken Bollinger ${n} is $${d(b, x.spot).toFixed(5)} ${s > 0 ? "above the long" : "below the short"} (her $25 wall = $${x.wall.toFixed(5)})`); /* fix1042 RULE C OUT (Love Nov 8 2026 5:52 PM PT: "ok can you just put the perplexity fix on in the meantime then hun?" - Perplexity's fix is rule C out; she never asked for rule C, and it read the 5m candle OPEN - her 5:28 PM "no book does candle open period"): no long while the 5m was under its open and under the Bollinger middle - gone */ return why.join(" + "); };
// fix1051 HER 5M BOOKS ENTER ONLY ON HER SIDE OF THE 5M OPEN (Love Nov 9 2026 8:52 PM PT, to "want the 5m books to only enter when price is on her side of the 5m open?": "Yes, if those are testing there that makes sense but not for the 15 only the five"): Polymarket's 5-minute window pays on the window's OPEN, so a 5m entry
// needs price already past that open her way (a long over it, a short under it) - else it keeps watching the window. 5-minute books only (the 5m paper books and her XRP 5m lane); every 15m book and the XRP 15m on Kalshi are untouched.
export function win5Open1051(bs: { t: number; o: number }[], now: number): number { const f = Math.floor(now / 300) * 300; const b = bs.find((x) => x.t >= f && x.t < f + 300); return b ? Number(b.o) : NaN; }
export function openSide1051(side: "up" | "down", spot: number, open5: number): boolean { return open5 > 0 && (side === "up" ? spot > open5 : spot < open5); }
/** pure: her XRP read on main's current configuration (now in seconds) - a call or the reason none; fix1004: every entry through her cornerstones */
export function xrpRead961(bs: Bar[], L: { name: string; price: number }[], spot: number, now = Date.now() / 1000, pushIn?: { band: number; pink: number; wick: number } /* fix1045: the 5m paper books pass their coin's push; her XRP lane keeps PUSH1004 */): { side: "up" | "down"; label: string } | { why: string } {
  if (!bs.length || now - bs[bs.length - 1].t > 120) return { why: "STALE FEED: no XRP minute in 120 s - no trade" };
  const k = spot / 80000, brk = 2 * k;
  const S = L.filter((l) => /σ$|^session VWAP$/.test(l.name)).map((l) => l.price).sort((a, b) => a - b);
  const up = S.find((x) => x > spot), dn = [...S].reverse().find((x) => x < spot); if (up === undefined || dn === undefined) return { why: "no session channel" };
  const W = up - dn, f = (spot - dn) / W, nr = 0.10 * W; // fix1033 wick threshold 10% (Love Nov 8 2026: "within 10% of the band")
  const f5 = Math.floor(now / 300) * 300, f2 = Math.floor(now / 120) * 120;
  const in5 = bs.filter((b) => b.t >= f5), in2 = bs.filter((b) => b.t >= f2); if (!in5.length || !in2.length) return { why: "no live candle" };
  const o5 = in5[0].o, h5 = Math.max(...in5.map((b) => b.h), spot), l5 = Math.min(...in5.map((b) => b.l), spot), o2 = in2[0].o, h2 = Math.max(...in2.map((b) => b.h), spot), l2 = Math.min(...in2.map((b) => b.l), spot);
  const px = (n: string) => L.find((l) => l.name === n)?.price || 0, pk = px("5m PP"), r1 = px("Red zone"), s1 = px("Green zone");
  const bu = px("BB upper"), bl = px("BB lower"), bm = bu > 0 && bl > 0 ? (bu + bl) / 2 : 0, wall = 25 * k; // fix1004: Bollinger middle = (upper + lower) / 2 (fix963); her $25 wall scaled to XRP
  // fix1004 main's setups (no colour in the shape) - each must pass her cornerstones; the first that does is the entry
  const cand: { side: "up" | "down"; label: string; line: number; lineName: string; pink: boolean; rej: boolean }[] = [];
  const brkLines = [...(pk > 0 ? [{ name: "5m PP", price: pk }] : []), ...L.filter((l) => /σ$|^session VWAP$/.test(l.name))];
  for (const b of brkLines) { const P = b.price, pink = b.name === "5m PP";
    if (o5 <= P && spot >= P + brk) cand.push({ side: "up", label: `Break above ${b.name}`, line: P, lineName: b.name, pink, rej: false });
    else if (o5 >= P && spot <= P - brk) cand.push({ side: "down", label: `Break below ${b.name}`, line: P, lineName: b.name, pink, rej: false });
    else if (o5 >= P && l5 <= P - brk && spot > P) cand.push({ side: "up", label: `Failed break below ${b.name} - rejected up`, line: P, lineName: b.name, pink, rej: true });
    else if (o5 <= P && h5 >= P + brk && spot < P) cand.push({ side: "down", label: `Failed break above ${b.name} - rejected down`, line: P, lineName: b.name, pink, rej: true });
  }
  for (const l of [...L, ...(bm > 0 ? [{ name: "BB middle", price: bm }] : [])]) {
    if (!/σ$|^session VWAP$|^(Red|Green) zone$|^BB (upper|middle|lower)$/.test(l.name)) continue; const P = l.price;
    if (o5 >= P && l5 <= P + nr && l5 > P - brk && spot > P) cand.push({ side: "up", label: `Rejected up off ${l.name}`, line: P, lineName: l.name, pink: false, rej: true });
    if (o5 <= P && h5 >= P - nr && h5 < P + brk && spot < P) cand.push({ side: "down", label: `Rejected down off ${l.name}`, line: P, lineName: l.name, pink: false, rej: true });
  }
  // fix1004 main's walls (bandlock.ts), scaled to XRP - "" = clear
  const reach = (W / k < 100 ? 25 : 50) * k;
  const walls = (side: "up" | "down", pinkSetup: boolean): string => { const u = side === "up";
    if (u && f >= 0.67) return "THIRDS: long in the top 33%"; if (!u && f <= 0.33) return "THIRDS: short in the bottom 33%";
    if (pk && r1 && s1) {
      if (u && spot >= r1) return "PAST THE RED ZONE (fix594)"; if (!u && spot <= s1) return "PAST THE GREEN ZONE (fix594)";
      if (false /* fix1054 (Love Nov 9 2026 9:40 PM PT: "the pink to red being over 46% of the way over there, it is no longer a valid reason for a skip. The question is always why she didn't enter past the push distance of pink"): PINK TO RED / PINK TO GREEN no longer refuses - kept, not deleted */ && u && spot > pk && (spot - pk) / (r1 - pk) >= 0.45) return "PINK TO RED (fix594): in the top 55%"; if (false /* fix1054 (Love Nov 9 2026 9:40 PM PT: "the pink to red being over 46% of the way over there, it is no longer a valid reason for a skip. The question is always why she didn't enter past the push distance of pink"): PINK TO RED / PINK TO GREEN no longer refuses - kept, not deleted */ && !u && spot < pk && (pk - spot) / (pk - s1) >= 0.45) return "PINK TO GREEN (fix594): in the bottom 55%";
      if (!pinkSetup && u && pk > spot && pk - spot <= 0.2 * W) return "PINK CUSHION (fix459): an unbroken pink within 20% of the channel above the long";
      if (!pinkSetup && !u && pk < spot && spot - pk <= 0.2 * W) return "PINK CUSHION (fix459): an unbroken pink within 20% of the channel below the short";
    }
    for (const b of [...brkLines, ...(r1 ? [{ name: "Red zone", price: r1 }] : []), ...(s1 ? [{ name: "Green zone", price: s1 }] : [])]) { const P = b.price;
      if (u ? spot >= P + brk : spot <= P - brk) continue; if ((u ? spot > P && o5 > P : spot < P && o5 < P)) continue; const dist = u ? P - spot : spot - P;
      if (dist <= reach) return `HER WALL (fix429): ${b.name} unbroken $${dist.toFixed(5)} ${u ? "above - no long" : "below - no short"} into it (her reach $${reach.toFixed(5)})`; }
    return ""; };
  let call: { side: "up" | "down"; label: string } | null = null, first = "";
  for (const c of cand) {
    const base = { side: c.side, spot, line: c.line, lineName: c.lineName, label: c.label, o2, o5, lo2: l2, hi2: h2, lo5: l5, hi5: h5, push: c.pink ? (pushIn || PUSH1004).pink : (pushIn || PUSH1004).band, wall, bbUp: bu, bbMid: bm, bbLo: bl };
    const w = walls(c.side, c.pink && !c.rej); if (w) { if (!first) first = `${c.label} REFUSED - ${w}`; continue; }
    const no = cornerstones1004(base);
    if (!no) { call = { side: c.side, label: c.label }; break; }
    if (c.rej && !c.pink && !cornerstones1004({ ...base, push: 0.15 * W, wick: true })) { call = { side: c.side, label: c.label + " (wick)" }; break; } // fix1004: a REAL wick rejection skips colour only + fix1036 (Love Nov 8 2026 2:52 PM PT: "please ensure that the wick rejection of 15 % stands , and is functional .... and enters the second a wick rejects by 15% within 10% of a band , and that the move is not calculated on the candles OPEN. it is PAST THE BAND"): it fires the second the pull-back off the wick extreme (the 5m low / high past the band) is 15% of her channel - was a flat $0.0005; it arms within 10% of the band (nr, fix1033)
    if (!first) first = `${c.label} REFUSED - ${no}`;
  }
  return call || { why: first || "no setup" };
}
type PM = { buySlug: Function; bookTop: Function };
/** her XRP 5m window on Polymarket US (slug forms the desk's BTC 5m uses) */
async function windowSlug(pm: PM, startSec: number): Promise<string | null> {
  const C = (G.__xrp961Slug ||= {}) as Record<number, string | null>; if (startSec in C && C[startSec]) return C[startSec];
  const ds = new Date(startSec * 1000), day = ds.toISOString().slice(0, 10), hm = String(ds.getUTCHours()).padStart(2, "0") + String(ds.getUTCMinutes()).padStart(2, "0");
  for (const slug of [`xrp-updown-5m-${day}-${hm}z`, `cpc-xrp-updown-5m-${day}-${hm}z`, `xrp-updown-5m-${startSec}`]) { if (await pm.bookTop(slug).catch(() => null)) return (C[startSec] = slug); }
  return null;
}
// fix1017 XRP 5M LANE KEEPS WATCHING AFTER AN OVER-CAP LOOK (Love Nov 7 2026 9:16 PM PT: "SHE IS NOTTTTTTTTTTTTTTTTTT TAKKKKINNGGGGGGGGG ANYYYYYYYYTHINGGGGGG" + 9:16 PM: "do NOT come back til it WORKS. please. do not have me in this loop any longer luv just check your work before you send it. don't send it if it doesn't work. that's it" + 9:17 PM: "im talking about xrp / flipped / didn't enter" + 9:21 PM: "they apply to literally every single thing traded on my accounts luv this isn't a here not there situation for any of these whatsoever / delayed is the only one that doesn't" (05:16:25Z her XRP lane read a short "Rejected down off BB upper (wick)", the ask was 72c, it skipped and never looked again that window; ~05:17:27Z XRP flipped red off the upper Bollinger / red zone)):
//   the window is spent ONLY when an order fills. An ask over her 66c (1.5x floor), no ask, or a no fill / refusal at the wire keeps the lane watching that window - it looks again
//   at most every 5 s and logs each kind of skip once a window. One ticket per window stays: a filled window is never bought again (seen + its bought row + the desk's own window claim).
//   An error at the wire spends the window (the order may have reached Polymarket). Not in the last minute stays. Nothing else changes: same read, same 66c / 1.5x floor, same $ cap, same buySlug guard.
export const RETRY1017_MS = 5000;
export async function xrpTick961(nowMs = Date.now(), pmIn?: PM) {
  const c = cfg961(); if (!c.on || G.__xrp961Busy) return; if (nowMs - Number(G.__xrp961At || 0) < 3000) return; G.__xrp961At = nowMs; G.__xrp961Busy = true;
  try {
    const now = nowMs / 1000, start = Math.floor(now / 300) * 300, end = start + 300, left = end - now;
    if (left < 60) return; // 5-minute window: not in its last minute
    const s = book(); const id = `xrp5m-${start}`; if (s.seen[id]) { await addOns1029(s, id, nowMs, pmIn); return; } // fix1029 a bought window takes her box add-ons
    if (s.rows.some((x) => x.id === id && /^bought/.test(x.live))) { s.seen[id] = nowMs; return; } // fix1017 one ticket per window: a window that filled is never bought again
    const RT = (G.__xrp961Retry ||= {}) as Record<string, number>, OK = (G.__xrp961Once ||= {}) as Record<string, number>; for (const k of Object.keys(RT)) if (nowMs - RT[k] > 900000) delete RT[k]; for (const k of Object.keys(OK)) if (nowMs - OK[k] > 900000) delete OK[k];
    if (nowMs - Number(RT[id] || 0) < RETRY1017_MS) return; // fix1017 after a skip the lane looks again at most every 5 s - the window is NOT spent
    const once1017 = (k: string) => { if (OK[id + "|" + k]) return false; OK[id + "|" + k] = nowMs; return true; }; // fix1017 each kind of skip is logged once a window
    const bs = await bars(); if (!bs.length) return; const spot = bs[bs.length - 1].c;
    const r0 = xrpRead961(bs, ethBands682(bs as any), spot, now);
    const o51 = win5Open1051(bs, now); const r: ReturnType<typeof xrpRead961> = "side" in r0 && !openSide1051(r0.side, spot, o51) ? { why: `NOT ON HER SIDE OF THE 5M OPEN (fix1051): ${r0.label} is a ${r0.side === "up" ? "long" : "short"} but price ${spot} is not ${r0.side === "up" ? "over" : "under"} this 5m window's open ${o51} - still watching` } : r0; // fix1051 her 5m books: only on her side of the 5m open
    if (!("side" in r)) { const W = (G.__xrp961Why ||= {}); if (W[id] !== r.why) { W[id] = r.why; if (!/^no setup$/.test(r.why)) log({ id, action: "waiting", why: r.why }); } return; }
    const pm: PM = pmIn || ((await import("./poly-live.server")) as any);
    const slug = await windowSlug(pm, start);
    if (!slug) { const M = (G.__xrp961Miss ||= {}); if (!M[id]) { M[id] = 1; log({ id, action: "skipped", side: r.side, label: r.label, why: "NO POLYMARKET XRP 5M WINDOW found for this window (xrp-updown-5m) - no order" }); } return; }
    const top = await pm.bookTop(slug).catch(() => null); const ask = top ? (r.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100) : null;
    // fix1017: the window is no longer spent here - only a fill spends it (below)
    const row: Row = { id, slug, at: new Date(nowMs).toISOString(), side: r.side, label: r.label, spot, ask, live: "", closesAt: new Date(end * 1000).toISOString() };
    if (!(ask != null && ask > 0.02 && ask <= c.maxAsk)) { RT[id] = nowMs; row.live = `skipped: ask ${ask ?? "?"} over her 66c (1.5x floor) - still watching this window (fix1017)`; if (once1017(ask == null ? "noask" : "ask")) { s.rows.push(row); save(); log({ id, action: "skipped", side: r.side, label: r.label, slug, ask, why: row.live }); } return; } // fix1017 an over-cap look does not spend the window
    try {
      const f = await pm.buySlug(r.side, slug, c.dollars, c.maxAsk, null);
      row.live = f && f.filled > 0 ? `bought ${f.filled} @ ${f.price}` : "no fill / refused at the wire (umpire, LIVE, cash or the ask moved) - still watching this window (fix1017)";
      if (f && f.filled > 0) s.seen[id] = nowMs; else { RT[id] = nowMs; if (!once1017("wire")) return; } // fix1017 ONLY a fill spends the window; a no fill / refusal keeps watching
      log({ id, action: f && f.filled > 0 ? "bought" : "skipped", side: r.side, label: r.label, slug, ask, filled: f?.filled ?? 0, price: f?.price ?? null, why: f && f.filled > 0 ? "" : row.live });
    } catch (e: any) { s.seen[id] = nowMs; row.live = "error: " + String(e?.message || e).slice(0, 120); log({ id, action: "error", why: row.live }); } // fix1017: an error at the wire spends the window (the order may have gone out - one ticket per window)
    s.rows.push(row); save();
  } catch {} finally { G.__xrp961Busy = false; }
}
// fix1029 HER ADD-ON RUNG (Love Sat Nov 7 2026 9:10 PM PT: "hun THE ADD ON BUG NEEDS TO BE FIXED. IT IS NOT GOING ON AT THE MULTIPLE I SAID." + 9:10 PM: "it CANNNOTTT ENTER AT THE SAME PRICE AS THE INITIAL ENTRY" + earlier: "pls get her to ONLY do the add ons AT the specified multiples , NOT before" + Nov 8 2026 12:49 AM PT, her card pick: "Automatic from my boxes"):
// a box counts only if its multiple is HIGHER than her entry's own multiple (1 / entry price) - a rung her entry already sat at or past is skipped for good; it fires only when the ASK reaches the rung's price (ask <= 1 / multiple),
// never in the first 5 s after the entry, and its price is capped in whole cents STRICTLY better than her entry (and at or under the rung) - never at or worse than the entry. Used by main / rej (engine.ts) and the XRP 5m lane.
export function rung1029(entryPx: number, mult: number, ask: number, enteredAt: number, now: number): { go: boolean; passed: boolean; cap: number; why: string } {
  const e = Number(entryPx), m = Number(mult), a = Number(ask);
  if (!(e > 0 && e < 1)) return { go: false, passed: false, cap: 0, why: "no entry price on record - no add-on (fix1029)" };
  if (!(m > 1) || !(m > 1 / e + 1e-9)) return { go: false, passed: true, cap: 0, why: `her entry at ${Math.round(e * 100)}c (${(1 / e).toFixed(2)}x) already sat at or past the ${m}x rung - skipped for good (fix1029)` };
  if (!(now - Number(enteredAt) >= 5000)) return { go: false, passed: false, cap: 0, why: "under 5 s since her entry (fix1029)" };
  const capC = Math.min(Math.floor(100 / m + 1e-9), Math.ceil(e * 100 - 1e-9) - 1); const cap = capC / 100;
  if (!(capC >= 1 && a > 0.02 && a <= 1 / m + 1e-9 && a <= cap + 1e-9)) return { go: false, passed: false, cap, why: `ask ${Math.round(a * 100)}c is not at her ${m}x yet (${capC}c) (fix1029)` };
  return { go: true, passed: false, cap, why: "" };
}
// fix1029 HER ADD-ON BOXES ON THE XRP 5M LANE (Love Sat Nov 7 2026 9:10 PM PT: "hun THE ADD ON BUG NEEDS TO BE FIXED. IT IS NOT GOING ON AT THE MULTIPLE I SAID." + 9:10 PM: "it CANNNOTTT ENTER AT THE SAME PRICE AS THE INITIAL ENTRY" + earlier: "pls get her to ONLY do the add ons AT the specified multiples , NOT before" + Nov 8 2026 12:49 AM PT, her card pick: "Automatic from my boxes" + Nov 7 2026 ~5:42 PM PT: "hun pls let it run my add ons i have set in the settings. make it unilateral"):
//   once her lane has FILLED a window, each of her add-on boxes (data/addon-settings.json, read fresh every look: on, $, multiple; box 1 has no multiple box - its 2.8x is live-switch addOn.maxAsk) buys ONCE on the SAME side as her entry
//   when the ask reaches the box multiple - only a multiple HIGHER than her entry's, never in the first 5 s after the entry, priced in whole cents STRICTLY better than her entry (rung1029, the same rule as main), never over $5 an order,
//   never over her 66c, box 2 only after box 1 filled or was passed (as on main). Through the desk's Polymarket buy with its own claim key: the umpire SAFE, LIVE on and the $ cap at the wire, as for her entry. Not in the last minute (the lane stops then).
//   A miss or refusal looks again after 5 s (fix1017); only a fill spends a box. Log: data/xrp5m-961.jsonl ("add-on" / "add-on missed").
export function trigPx1043(entryPx: number, ask: number, enteredAt: number, now: number): { go: boolean; cap: number; why: string } { const e = Number(entryPx), a = Number(ask); if (!(e > 0 && e < 1)) return { go: false, cap: 0, why: "no entry price on record (fix1043)" }; if (!(now - Number(enteredAt) >= 5000)) return { go: false, cap: 0, why: "under 5 s since her entry (fix1043)" }; const capC = Math.min(40, Math.ceil(e * 100 - 1e-9) - 1); const cap = capC / 100; if (!(capC >= 1 && a > 0.02 && a <= cap + 1e-9)) return { go: false, cap, why: `ask ${Math.round(a * 100)}c is not 2.5x+ and strictly better than her ${Math.round(e * 100)}c entry (${capC}c) (fix1043)` }; return { go: true, cap, why: "" }; } // fix1043 her trigger add-on price: 2.5x or more (40c or under - her .2 allowance under 2.8x) AND in whole cents STRICTLY better than her entry ("never worse than our initial one"), 5 s after the entry
export function boxes1029(): { k: string; on: boolean; dollars: number; mult: number }[] {
  let j: any = {}, ao: any = {}; try { j = JSON.parse(readFileSync(D("addon-settings.json"), "utf8")) || {}; } catch {} try { ao = JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.addOn || {}; } catch {}
  return [1, 2, 3].map((n) => { const b = j["addOn" + n] || {}; const m = Number(b.mult) > 0 ? Number(b.mult) : n === 1 && Number(ao.maxAsk) > 0 ? 1 / Number(ao.maxAsk) : 0; return { k: "add" + n, on: b.on === true, dollars: Math.min(5, Number(b.dollars) > 0 ? Number(b.dollars) : 0), mult: m }; });
}
async function addOns1029(s: any, id: string, nowMs: number, pmIn?: PM) {
  const e = (s.rows as Row[]).find((x) => x.id === id && /^bought/.test(x.live)); if (!e) return; const px = Number(/@ ([\d.]+)/.exec(e.live)?.[1]), at = Date.parse(e.at); if (!(px > 0 && px < 1) || !(at > 0)) return;
  const A = (s.add1029 ||= {}) as Record<string, Record<string, number>>, done = (A[id] ||= {}), RT = (G.__xrp1029Retry ||= {}) as Record<string, number>, c = cfg961();
  const bx = boxes1029().filter((b) => b.k === "add1" /* fix1043: only the 1 default add-on at its multiple */ && b.on && b.dollars > 0 && b.mult >= 1.5 && !done[b.k]); const b2t = boxes1029()[1]; if (!bx.length && !(b2t.on && b2t.dollars > 0)) return;
  const pm: PM = pmIn || ((await import("./poly-live.server")) as any); const top = await pm.bookTop(e.slug).catch(() => null); if (!top) return;
  const ask = e.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100;
  // fix1043 HER TRIGGER ADD-ON ON THE XRP LANE: her lane's own read (xrpRead961, same walls as her entry) calls the SAME side again = a genuine entry trigger; 2.5x+, strictly better than her entry (trigPx1043), $ = her Add-on 2 box, one per distinct trigger (setup + 1 minute), no count limit
  try { if (b2t.on && b2t.dollars > 0 && nowMs - Number(RT[id + "trig"] || 0) >= RETRY1017_MS) { const bsT = await bars(); const spT = bsT.length ? bsT[bsT.length - 1].c : 0; const rd = spT > 0 ? xrpRead961(bsT, ethBands682(bsT as any), spT, nowMs / 1000) : ({ why: "no bars" } as any);
    const kT = "side" in rd ? "trig|" + String(rd.label) + "|" + Math.floor(nowMs / 60000) : ""; const gT = trigPx1043(px, ask, at, nowMs);
    if ("side" in rd && rd.side === e.side && !done[kT] && gT.go) { RT[id + "trig"] = nowMs; const capT = Math.min(gT.cap, c.maxAsk);
      try { const f = await pm.buySlug(e.side, e.slug, b2t.dollars, capT, null, ":add1043" + Math.floor(nowMs / 60000)); if (f && f.filled > 0) { done[kT] = nowMs; save(); } log({ id, action: f && f.filled > 0 ? "trigger add-on" : "trigger add-on missed", trigger: rd.label, side: e.side, slug: e.slug, ask, cap: capT, entry: px, filled: f?.filled ?? 0, price: f?.price ?? null }); }
      catch (er: any) { done[kT] = nowMs; save(); log({ id, action: "trigger add-on error", why: String(er?.message || er).slice(0, 120) }); } } } } catch {}
  for (const b of bx) {
    if (nowMs - Number(RT[id + b.k] || 0) < RETRY1017_MS) continue;
    if (b.k === "add2") { const b1 = boxes1029()[0]; if (!b1.on || !(done.add1 || rung1029(px, b1.mult, ask, at, nowMs).passed)) continue; } // as on main: box 2 after box 1 filled (or her entry passed box 1)
    const g = rung1029(px, b.mult, ask, at, nowMs); if (g.passed) { done[b.k] = -1; save(); log({ id, action: "add-on skipped", box: b.k, why: g.why }); continue; } if (!g.go) continue;
    const cap = Math.min(g.cap, c.maxAsk); RT[id + b.k] = nowMs;
    try { const f = await pm.buySlug(e.side, e.slug, b.dollars, cap, null, ":add1029" + b.k); if (f && f.filled > 0) { done[b.k] = nowMs; save(); } log({ id, action: f && f.filled > 0 ? "add-on" : "add-on missed", box: b.k, mult: b.mult, side: e.side, slug: e.slug, ask, cap, entry: px, filled: f?.filled ?? 0, price: f?.price ?? null }); }
    catch (er: any) { done[b.k] = nowMs; save(); log({ id, action: "add-on error", box: b.k, why: String(er?.message || er).slice(0, 120) }); } // an error spends that box (the order may have gone out)
  }
}
export function xrpSummary961() { const rows = book().rows; return { at: new Date().toISOString(), n: rows.length, bought: rows.filter((r) => /^bought/.test(r.live)).length, last: rows.slice(-10) }; }
