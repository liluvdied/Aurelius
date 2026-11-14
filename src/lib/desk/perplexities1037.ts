// PERPLEXITIES - PAPER ONLY (fix1037, Love Nov 8 2026 2:46 PM PT (via the project, her ask): a PERPLEXITIES paper twin book running Perplexity's fix files, paper-only, alongside the others, so she can watch it). This is Perplexity's own XRP 5m twin (perplexity-backups/incoming/xrp5mtwin.ts, branch perplexity-xrp-twin f1a73bf5 -
// fix961 without RULE C), turned into a PAPER book: it NEVER sends an order. Its only Polymarket call is the public order-book read (bookTop) for the real ask; a "buy" is a paper
// ticket at that ask, $1, settled at the window's close from the same Coinbase 1m candles (close vs the window's open). Own files: data/perplexities-cfg.json (on unless {"on": false}),
// data/perplexities.jsonl, data/perplexities-book.json. Nothing else on the desk reads it.
// XRP 5M POLY TWIN (Perplexity, Love Nov 8 2026: "can you create a twin that only uses THIS code ... walled off from [main] even being a possibility").
// A copy of xrp5m961.ts at commit b14bae73 with ONE change: the unrequested RULE C (fix1004) is removed (Love: "i never asked for that in there i want it out").
// Walls: no imports from any other book or from main (bandlock / engine / ethbook); its own frozen band math below; its own files (data/perplexities-cfg.json, perplexities.jsonl,
// perplexities-book.json) and its own memory. OFF until data/perplexities-cfg.json says {"on": true}. The ONLY shared piece is the desk Polymarket order door
// (poly-live.server buySlug: her umpire, LIVE switch, cash, and one buy per window across the whole desk - so the twin and the original can never both buy one window).
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
// Money: $1 an entry (her Poly size = half her $2 live slider; data/perplexities-cfg.json), through the desk's Polymarket buy (buySlug): the umpire must be SAFE, the LIVE switch on, the $ cap,
// her 1.5x floor (ask 66c or less), Polymarket cash, one buy per window (the desk remembers every bought window). A stale feed (no XRP minute in 120 s) = no trade.
// Log: data/perplexities.jsonl. Paper rows (every call, for the card): data/perplexities-book.json.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// TWIN WALL: a frozen copy of ethBands682 + group from ethbook.ts at commit b14bae73 (Nov 8 2026). Changes to the ETH book can never reach this twin.
type TBar = { t: number; o: number; h: number; l: number; c: number; v: number };
const group = (bs: TBar[], n: number): TBar[] => { const out: TBar[] = []; for (const b of bs) { const k = Math.floor(b.t / (n * 60)) * n * 60, x = out[out.length - 1]; if (x && x.t === k) { x.h = Math.max(x.h, b.h); x.l = Math.min(x.l, b.l); x.c = b.c; x.v += b.v; } else out.push({ ...b, t: k }); } return out; };
function twinBands(bs: TBar[]): { name: string; price: number }[] {
  const L: { name: string; price: number }[] = []; if (bs.length < 40) return L;
  // fix907 HER CHART'S SESSION ON LIVE ETH (her fix862) (Love Nov 6 2026 ~8:03-8:05 PM PT: "why did she just long eth ???????? it broke the session down????" + "both breaks down" (her TradingView ETH on Coinbase: session VWAP 2,240.79, +1σ 2,243.69, -1σ 2,237.88)): her TradingView session VWAP on Coinbase ETH resets at 00:00 UTC (4 PM PT) and is built from
  // 5m candles - the book used 5 PM ET on 1m candles, $1.43 under her chart at 8:02 PM, so a break down on her chart read as a bounce here. Now the same as her chart (to the cent at 8:04 PM).
  const last = bs[bs.length - 1], day = (t: number) => Math.floor(t / 86400); let sv = 0, sp = 0, sp2 = 0;
  for (const b of group(bs, 5)) { if (day(b.t) !== day(last.t)) continue; const tp = (b.h + b.l + b.c) / 3, w = Math.max(b.v, 1e-9); sv += w; sp += w * tp; sp2 += w * tp * tp; }
  if (sv > 0) { const vw = sp / sv, sd = Math.sqrt(Math.max(sp2 / sv - vw * vw, 0)); if (sd > 0) { L.push({ name: "session VWAP", price: vw }); for (const k of [1, 2, 3]) { L.push({ name: `+${k}σ`, price: vw + k * sd }); L.push({ name: `-${k}σ`, price: vw - k * sd }); } } }
  const b5 = group(bs, 5).slice(-60);
  if (b5.length >= 10) { let ema = 0; b5.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * 0.25 + ema * 0.75; }); const a = b5.slice(-7).reduce((s, x) => s + (x.h - x.l), 0) / 7; L.push({ name: "5m PP", price: ema }, { name: "Red zone", price: ema + a }, { name: "Green zone", price: ema - a }); }
  if (b5.length >= 20) { const cs = b5.slice(-20).map((x) => x.c), m = cs.reduce((s, x) => s + x, 0) / 20, sd = Math.sqrt(cs.reduce((s, x) => s + (x - m) ** 2, 0) / 20); L.push({ name: "BB upper", price: m + 2 * sd }, { name: "BB lower", price: m - 2 * sd }); }
  return L;
}

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
export type CfgPerp = { on: boolean; dollars: number; maxAsk: number };
export function cfgPerp(): CfgPerp {
  let c: any = {}; try { c = JSON.parse(readFileSync(D("perplexities-cfg.json"), "utf8")) || {}; } catch {}
  return { on: c.on !== false /* PAPER - on unless she sets {"on": false} */, dollars: Math.min(5, Number(c.dollars) > 0 ? Number(c.dollars) : 1), maxAsk: Math.min(0.66, Number(c.maxAsk) > 0 ? Number(c.maxAsk) : 0.66) };
}
function log(x: any) { try { appendFileSync(D("perplexities.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
type Row = { id: string; slug: string; at: string; side: "up" | "down"; label: string; spot: number; ask: number | null; live: string; closesAt: string };
function book(): { rows: Row[]; seen: Record<string, number> } { if (G.__perp1037) return G.__perp1037; let s = { rows: [] as Row[], seen: {} as Record<string, number> }; try { if (existsSync(D("perplexities-book.json"))) s = { rows: [], seen: {}, ...JSON.parse(readFileSync(D("perplexities-book.json"), "utf8")) }; } catch {} G.__perp1037 = s; return s; }
function save() { try { const s = book(); s.rows = s.rows.slice(-2000); const cut = Date.now() - 2 * 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D("perplexities-book.json.tmp"), JSON.stringify(s)); renameSync(D("perplexities-book.json.tmp"), D("perplexities-book.json")); } catch {} }
async function j(url: string): Promise<any> { const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "aurelius-paper/1.0" }, signal: AbortSignal.timeout(8000) }); return r.json(); }
async function bars(): Promise<Bar[]> {
  const B = (G.__perp1037Bars ||= { at: 0, m: new Map<number, Bar>() });
  try { const b1098 = await (await import("./xrpfeed1098")).xrpLaneBars1098(B); if (b1098) return b1098; } catch {} // fix1098 XRP ON HER BINANCE CHART (Love Nov 13 2026 9:55 PM PT: "yes, we need to put her on the binance.us chart coinbase freezes very often" + 10:00 PM PT on the picture labelled "XRPUSDT • BINANCE": "sorry yes, the chart i sent you"): her XRP candles come off BINANCE:XRPUSDT, kept in this lane's own memory as before (her push test reads it); the Coinbase read below runs only while that chart is not usable
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
//   colour is not her colour; (b) price on her side of the line it trades off; (c) the flat push off the turn (5m low for a long / high for a short): bands $0.0005, pink $0.0010.
//   (e) RULE C REMOVED in this twin (Love Nov 8 2026: never asked for) - the 2m-or-5m colour in (a) is her colour rule.
//   The ONLY exception: a REAL wick rejection off a line (came within 15% of the channel, pulled back $0.0005 from the wick toward her side) - labelled "(wick)", it skips colour (a) only - "she entered on a red candle pushing".
export const PUSH_TWIN = { band: 0.0005, pink: 0.001, wick: 0.0005 };
/** fix1004 her cornerstones + her Bollinger wall, one line - "" = her entry, else every reason it is not (BTC / ETH 5m lanes: pass their own push $, wall $ and Bollinger; label = the read's label) */
export const cornerstonesTwin = (x: { side: "up" | "down"; spot: number; line: number; lineName: string; label: string; o2: number; o5: number; lo5: number; hi5: number; push: number; wall: number; bbUp: number; bbMid: number; bbLo: number; wick?: boolean }): string => { const s = x.side === "up" ? 1 : -1, d = (a: number, b: number) => s * (a - b), why: string[] = [], turn = s > 0 ? x.lo5 : x.hi5; if (!x.wick && !(d(x.spot, x.o2) >= x.push - 1e-9 || d(x.spot, x.o5) >= x.push - 1e-9)) why.push(`COLOUR (fix1004): her 2m / 5m candle is not ${s > 0 ? "green" : "red"} by her push $${x.push} over its open (2m ${d(x.spot, x.o2).toFixed(4)}, 5m ${d(x.spot, x.o5).toFixed(4)}) - a 1-tick colour is not her colour`); if (!(d(x.spot, x.line) > 0)) why.push(`SAME SIDE (fix1004): price is not on her side of ${x.lineName}`); if (d(x.spot, turn) < x.push - 1e-9) why.push(`PUSH (fix1004): only $${d(x.spot, turn).toFixed(4)} off the 5m ${s > 0 ? "low" : "high"}, her push is $${x.push}`); for (const [n, b] of [["upper", x.bbUp], ["middle", x.bbMid], ["lower", x.bbLo]] as [string, number][]) if (b > 0 && d(b, x.spot) >= 0 && d(b, x.spot) <= x.wall && !new RegExp("(Bollinger|BB) " + n, "i").test(x.label) && !(n === (s > 0 ? "lower" : "upper") || (s > 0 ? x.hi5 > b : x.lo5 < b))) why.push(`BOLLINGER WALL (fix1004 / fix962 / fix995): the unbroken Bollinger ${n} is $${d(b, x.spot).toFixed(5)} ${s > 0 ? "above the long" : "below the short"} (her $25 wall = $${x.wall.toFixed(5)})`); return why.join(" + "); };
/** pure: her XRP read on main's current configuration (now in seconds) - a call or the reason none; fix1004: every entry through her cornerstones */
export function perpRead1037(bs: Bar[], L: { name: string; price: number }[], spot: number, now = Date.now() / 1000): { side: "up" | "down"; label: string } | { why: string } {
  if (!bs.length || now - bs[bs.length - 1].t > 120) return { why: "STALE FEED: no XRP minute in 120 s - no trade" };
  const k = spot / 80000, brk = 2 * k;
  const S = L.filter((l) => /σ$|^session VWAP$/.test(l.name)).map((l) => l.price).sort((a, b) => a - b);
  const up = S.find((x) => x > spot), dn = [...S].reverse().find((x) => x < spot); if (up === undefined || dn === undefined) return { why: "no session channel" };
  const W = up - dn, f = (spot - dn) / W, nr = 0.15 * W;
  const f5 = Math.floor(now / 300) * 300, f2 = Math.floor(now / 120) * 120;
  const in5 = bs.filter((b) => b.t >= f5), in2 = bs.filter((b) => b.t >= f2); if (!in5.length || !in2.length) return { why: "no live candle" };
  const o5 = in5[0].o, h5 = Math.max(...in5.map((b) => b.h), spot), l5 = Math.min(...in5.map((b) => b.l), spot), o2 = in2[0].o;
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
    const base = { side: c.side, spot, line: c.line, lineName: c.lineName, label: c.label, o2, o5, lo5: l5, hi5: h5, push: c.pink ? PUSH_TWIN.pink : PUSH_TWIN.band, wall, bbUp: bu, bbMid: bm, bbLo: bl };
    const w = walls(c.side, c.pink && !c.rej); if (w) { if (!first) first = `${c.label} REFUSED - ${w}`; continue; }
    const no = cornerstonesTwin(base);
    if (!no) { call = { side: c.side, label: c.label }; break; }
    if (c.rej && !c.pink && !cornerstonesTwin({ ...base, push: PUSH_TWIN.wick, wick: true })) { call = { side: c.side, label: c.label + " (wick)" }; break; } // fix1004: a REAL wick rejection skips colour only
    if (!first) first = `${c.label} REFUSED - ${no}`;
  }
  return call || { why: first || "no setup" };
}
type PM = { bookTop: Function }; // PAPER: the public order-book read only - no buy function exists here
/** her XRP 5m window on Polymarket US (slug forms the desk's BTC 5m uses) */
async function windowSlug(pm: PM, startSec: number): Promise<string | null> {
  const C = (G.__perp1037Slug ||= {}) as Record<number, string | null>; if (startSec in C && C[startSec]) return C[startSec];
  const ds = new Date(startSec * 1000), day = ds.toISOString().slice(0, 10), hm = String(ds.getUTCHours()).padStart(2, "0") + String(ds.getUTCMinutes()).padStart(2, "0");
  for (const slug of [`xrp-updown-5m-${day}-${hm}z`, `cpc-xrp-updown-5m-${day}-${hm}z`, `xrp-updown-5m-${startSec}`]) { if (await pm.bookTop(slug).catch(() => null)) return (C[startSec] = slug); }
  return null;
}
export async function perpTick1037(nowMs = Date.now(), pmIn?: PM) {
  const c = cfgPerp(); if (!c.on || G.__perp1037Busy) return; if (nowMs - Number(G.__perp1037At || 0) < 3000) return; G.__perp1037At = nowMs; G.__perp1037Busy = true;
  try {
    const now = nowMs / 1000, start = Math.floor(now / 300) * 300, end = start + 300, left = end - now;
    if (left < 60) return; // 5-minute window: not in its last minute
    const s = book(); const id = `perplexities-${start}`; if (s.seen[id]) return;
    const bs = await bars(); if (!bs.length) return; const spot = bs[bs.length - 1].c;
    const r = perpRead1037(bs, twinBands(bs as any), spot, now);
    if (!("side" in r)) { const W = (G.__perp1037Why ||= {}); if (W[id] !== r.why) { W[id] = r.why; if (!/^no setup$/.test(r.why)) log({ id, action: "waiting", why: r.why }); } return; }
    const pm: PM = pmIn || { bookTop: async (slug: string) => (await import("./poly-live.server")).bookTop(slug) }; // PAPER: only bookTop is reachable
    const slug = await windowSlug(pm, start);
    if (!slug) { const M = (G.__perp1037Miss ||= {}); if (!M[id]) { M[id] = 1; log({ id, action: "skipped", side: r.side, label: r.label, why: "NO POLYMARKET XRP 5M WINDOW found for this window (xrp-updown-5m) - no order" }); } return; }
    const top = await pm.bookTop(slug).catch(() => null); const ask = top ? (r.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100) : null;
    s.seen[id] = nowMs;
    const row: Row = { id, slug, at: new Date(nowMs).toISOString(), side: r.side, label: r.label, spot, ask, live: "", closesAt: new Date(end * 1000).toISOString() };
    if (!(ask != null && ask > 0.02 && ask <= c.maxAsk)) { row.live = `skipped: ask ${ask ?? "?"} over her 66c (1.5x floor)`; s.rows.push(row); save(); log({ id, action: "skipped", side: r.side, label: r.label, slug, ask, why: row.live }); return; }
    try {
      const f = { filled: Math.floor((20 / ask) * 100) / 100, price: ask }; // PAPER ticket: $20 at the real ask (Love Nov 8 2026 5:28 PM PT: 'set all paper tickets to $20 always') - no order is ever sent
      row.live = `PAPER bought ${f.filled} @ ${f.price}`;
      log({ id, action: "paper bought", side: r.side, label: r.label, slug, ask, filled: f?.filled ?? 0, price: f?.price ?? null, why: f && f.filled > 0 ? "" : row.live });
    } catch (e: any) { row.live = "error: " + String(e?.message || e).slice(0, 120); log({ id, action: "error", why: row.live }); }
    s.rows.push(row); save();
  } catch {} finally { G.__perp1037Busy = false; }
}
export function perpSummary1037() { const rows = book().rows; return { at: new Date().toISOString(), n: rows.length, bought: rows.filter((r) => /^PAPER bought/.test(r.live)).length, last: rows.slice(-10) }; }

// PAPER settlement: a paper ticket wins when the window's last 1m close is past its open her way (Coinbase XRP-USD, the lane's own feed) - Polymarket's settled result is not read.
export async function perpSettle1037(nowMs = Date.now()) { try { const s = book() as any, bs = await bars(); let n = 0; for (const r of s.rows as any[]) { if (!/^PAPER bought/.test(r.live) || r.result || Date.parse(r.closesAt) > nowMs - 60000) continue; const end = Date.parse(r.closesAt) / 1000, w = bs.filter((b) => b.t >= end - 300 && b.t < end); if (w.length < 3) continue; const up = w[w.length - 1].c >= w[0].o; r.result = (r.side === "up") === up ? "win" : "loss"; r.perDollar = r.result === "win" ? Math.round((1 / Number(r.ask) - 1) * 1000) / 1000 : -1; n++; log({ id: r.id, action: "paper settled", result: r.result, perDollar: r.perDollar }); } if (n) save(); return n; } catch { return 0; } }
