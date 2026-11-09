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
function book(): { rows: Row[]; seen: Record<string, number> } { if (G.__xrp961) return G.__xrp961; let s = { rows: [] as Row[], seen: {} as Record<string, number> }; try { if (existsSync(D("xrp5m-961-book.json"))) s = { rows: [], seen: {}, ...JSON.parse(readFileSync(D("xrp5m-961-book.json"), "utf8")) }; } catch {} G.__xrp961 = s; return s; }
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
//   The ONLY exception: a REAL wick rejection off a line (came within 15% of the channel, pulled back $0.0005 from the wick toward her side) - labelled "(wick)", it skips colour (a) only - "she entered on a red candle pushing".
export const PUSH1004 = { band: 0.00025, /* fix1031 XRP push 0.00025 (Love Nov 8 2026: "0.00025 for xrp") */ pink: 0.001, wick: 0.0005 };
/** fix1004 her cornerstones + her Bollinger wall, one line - "" = her entry, else every reason it is not (BTC / ETH 5m lanes: pass their own push $, wall $ and Bollinger; label = the read's label) */
export const cornerstones1004 = (x: { side: "up" | "down"; spot: number; line: number; lineName: string; label: string; o2: number; o5: number; lo2: number; hi2: number; lo5: number; hi5: number; push: number; wall: number; bbUp: number; bbMid: number; bbLo: number; wick?: boolean }): string => { const s = x.side === "up" ? 1 : -1, d = (a: number, b: number) => s * (a - b), why: string[] = [], turn = s > 0 ? x.lo5 : x.hi5; if (!x.wick && !(d(x.spot, s > 0 ? x.lo2 : x.hi2) >= x.push - 1e-9 || d(x.spot, s > 0 ? x.lo5 : x.hi5) >= x.push - 1e-9)) why.push(`COLOUR (fix1032): her 2m / 5m candle is not ${s > 0 ? "green" : "red"} by her push $${x.push} from the ${s > 0 ? "low" : "high"} (2m ${d(x.spot, s > 0 ? x.lo2 : x.hi2).toFixed(4)}, 5m ${d(x.spot, s > 0 ? x.lo5 : x.hi5).toFixed(4)})`); /* fix1027 PLAIN COLOUR (Love Nov 8 2026 12:19-12:22 AM PT: "okay whatever opening color candle lock you instituted that is now blocking trades please remove it" + "color of the candle still needs to be the same as our trade, aside from the wick rejection exemption ... candle flips green - push distance met ==== get in"): her colour is the 2m or 5m candle's current colour, any amount past its open - the $0.0005 / $0.0010 cushion over the open is gone; her push off the turn stays its own check, wicks stay exempt, same side stays */ if (!(d(x.spot, x.line) > 0)) why.push(`SAME SIDE (fix1004): price is not on her side of ${x.lineName}`); if (d(x.spot, turn) < x.push - 1e-9) why.push(`PUSH (fix1004): only $${d(x.spot, turn).toFixed(4)} off the 5m ${s > 0 ? "low" : "high"}, her push is $${x.push}`); for (const [n, b] of [["upper", x.bbUp], ["middle", x.bbMid], ["lower", x.bbLo]] as [string, number][]) if (b > 0 && d(b, x.spot) >= 0 && d(b, x.spot) <= x.wall && !new RegExp("(Bollinger|BB) " + n, "i").test(x.label) && !(n === (s > 0 ? "lower" : "upper") || (s > 0 ? x.hi5 > b : x.lo5 < b))) why.push(`BOLLINGER WALL (fix1004 / fix962 / fix995): the unbroken Bollinger ${n} is $${d(b, x.spot).toFixed(5)} ${s > 0 ? "above the long" : "below the short"} (her $25 wall = $${x.wall.toFixed(5)})`); if (x.bbMid > 0 && d(x.spot, x.o5) < 0 && d(x.spot, x.bbMid) < 0) why.push(`RULE C (fix1004): no ${s > 0 ? "long while the 5m is red and under" : "short while the 5m is green and over"} the Bollinger middle - "the candle was red and under a bollinger"`); return why.join(" + "); };
/** pure: her XRP read on main's current configuration (now in seconds) - a call or the reason none; fix1004: every entry through her cornerstones */
export function xrpRead961(bs: Bar[], L: { name: string; price: number }[], spot: number, now = Date.now() / 1000): { side: "up" | "down"; label: string } | { why: string } {
  if (!bs.length || now - bs[bs.length - 1].t > 120) return { why: "STALE FEED: no XRP minute in 120 s - no trade" };
  const k = spot / 80000, brk = 2 * k;
  const S = L.filter((l) => /σ$|^session VWAP$/.test(l.name)).map((l) => l.price).sort((a, b) => a - b);
  const up = S.find((x) => x > spot), dn = [...S].reverse().find((x) => x < spot); if (up === undefined || dn === undefined) return { why: "no session channel" };
  const W = up - dn, f = (spot - dn) / W, nr = 0.15 * W;
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
      if (u && spot > pk && (spot - pk) / (r1 - pk) >= 0.45) return "PINK TO RED (fix594): in the top 55%"; if (!u && spot < pk && (pk - spot) / (pk - s1) >= 0.45) return "PINK TO GREEN (fix594): in the bottom 55%";
      if (!pinkSetup && u && pk > spot && pk - spot <= 0.2 * W) return "PINK CUSHION (fix459): an unbroken pink within 20% of the channel above the long";
      if (!pinkSetup && !u && pk < spot && spot - pk <= 0.2 * W) return "PINK CUSHION (fix459): an unbroken pink within 20% of the channel below the short";
    }
    for (const b of [...brkLines, ...(r1 ? [{ name: "Red zone", price: r1 }] : []), ...(s1 ? [{ name: "Green zone", price: s1 }] : [])]) { const P = b.price;
      if (u ? spot >= P + brk : spot <= P - brk) continue; if ((u ? spot > P && o5 > P : spot < P && o5 < P)) continue; const dist = u ? P - spot : spot - P;
      if (dist <= reach) return `HER WALL (fix429): ${b.name} unbroken $${dist.toFixed(5)} ${u ? "above - no long" : "below - no short"} into it (her reach $${reach.toFixed(5)})`; }
    return ""; };
  let call: { side: "up" | "down"; label: string } | null = null, first = "";
  for (const c of cand) {
    const base = { side: c.side, spot, line: c.line, lineName: c.lineName, label: c.label, o2, o5, lo2: l2, hi2: h2, lo5: l5, hi5: h5, push: c.pink ? PUSH1004.pink : PUSH1004.band, wall, bbUp: bu, bbMid: bm, bbLo: bl };
    const w = walls(c.side, c.pink && !c.rej); if (w) { if (!first) first = `${c.label} REFUSED - ${w}`; continue; }
    const no = cornerstones1004(base);
    if (!no) { call = { side: c.side, label: c.label }; break; }
    if (c.rej && !c.pink && !cornerstones1004({ ...base, push: PUSH1004.wick, wick: true })) { call = { side: c.side, label: c.label + " (wick)" }; break; } // fix1004: a REAL wick rejection skips colour only
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
export async function xrpTick961(nowMs = Date.now(), pmIn?: PM) {
  const c = cfg961(); if (!c.on || G.__xrp961Busy) return; if (nowMs - Number(G.__xrp961At || 0) < 3000) return; G.__xrp961At = nowMs; G.__xrp961Busy = true;
  try {
    const now = nowMs / 1000, start = Math.floor(now / 300) * 300, end = start + 300, left = end - now;
    if (left < 60) return; // 5-minute window: not in its last minute
    const s = book(); const id = `xrp5m-${start}`; if (s.seen[id]) return;
    const bs = await bars(); if (!bs.length) return; const spot = bs[bs.length - 1].c;
    const r = xrpRead961(bs, ethBands682(bs as any), spot, now);
    if (!("side" in r)) { const W = (G.__xrp961Why ||= {}); if (W[id] !== r.why) { W[id] = r.why; if (!/^no setup$/.test(r.why)) log({ id, action: "waiting", why: r.why }); } return; }
    const pm: PM = pmIn || ((await import("./poly-live.server")) as any);
    const slug = await windowSlug(pm, start);
    if (!slug) { const M = (G.__xrp961Miss ||= {}); if (!M[id]) { M[id] = 1; log({ id, action: "skipped", side: r.side, label: r.label, why: "NO POLYMARKET XRP 5M WINDOW found for this window (xrp-updown-5m) - no order" }); } return; }
    const top = await pm.bookTop(slug).catch(() => null); const ask = top ? (r.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100) : null;
    s.seen[id] = nowMs;
    const row: Row = { id, slug, at: new Date(nowMs).toISOString(), side: r.side, label: r.label, spot, ask, live: "", closesAt: new Date(end * 1000).toISOString() };
    if (!(ask != null && ask > 0.02 && ask <= c.maxAsk)) { row.live = `skipped: ask ${ask ?? "?"} over her 66c (1.5x floor)`; s.rows.push(row); save(); log({ id, action: "skipped", side: r.side, label: r.label, slug, ask, why: row.live }); return; }
    try {
      const f = await pm.buySlug(r.side, slug, c.dollars, c.maxAsk, null);
      row.live = f && f.filled > 0 ? `bought ${f.filled} @ ${f.price}` : "no fill / refused at the wire (umpire, LIVE, cash or the ask moved)";
      log({ id, action: f && f.filled > 0 ? "bought" : "skipped", side: r.side, label: r.label, slug, ask, filled: f?.filled ?? 0, price: f?.price ?? null, why: f && f.filled > 0 ? "" : row.live });
    } catch (e: any) { row.live = "error: " + String(e?.message || e).slice(0, 120); log({ id, action: "error", why: row.live }); }
    s.rows.push(row); save();
  } catch {} finally { G.__xrp961Busy = false; }
}
export function xrpSummary961() { const rows = book().rows; return { at: new Date().toISOString(), n: rows.length, bought: rows.filter((r) => /^bought/.test(r.live)).length, last: rows.slice(-10) }; }
