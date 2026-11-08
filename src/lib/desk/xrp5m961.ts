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
/** pure: main's Nov 3 read for XRP (now in seconds) - a call or the reason none */
export function xrpRead961(bs: Bar[], L: { name: string; price: number }[], spot: number, now = Date.now() / 1000): { side: "up" | "down"; label: string } | { why: string } {
  if (!bs.length || now - bs[bs.length - 1].t > 120) return { why: "STALE FEED: no XRP minute in 120 s - no trade" };
  const k = spot / 80000, brk = 2 * k;
  const S = L.filter((l) => /σ$|^session VWAP$/.test(l.name)).map((l) => l.price).sort((a, b) => a - b);
  const up = S.find((x) => x > spot), dn = [...S].reverse().find((x) => x < spot); if (up === undefined || dn === undefined) return { why: "no session channel" };
  const W = up - dn, f = (spot - dn) / W, nr = 0.15 * W;
  const f5 = Math.floor(now / 300) * 300, f2 = Math.floor(now / 120) * 120;
  const in5 = bs.filter((b) => b.t >= f5), in2 = bs.filter((b) => b.t >= f2); if (!in5.length || !in2.length) return { why: "no live candle" };
  const o5 = in5[0].o, h5 = Math.max(...in5.map((b) => b.h), spot), l5 = Math.min(...in5.map((b) => b.l), spot), o2 = in2[0].o;
  const colour = (side: string) => (side === "up" ? spot > o2 || spot > o5 : spot < o2 || spot < o5); // Nov 3: her 2m OR 5m candle her colour
  const px = (n: string) => L.find((l) => l.name === n)?.price || 0, pk = px("5m PP"), r1 = px("Red zone"), s1 = px("Green zone");
  let call: { side: "up" | "down"; label: string } | null = null, pinkSetup = false;
  if (pk > 0) {
    if (o5 <= pk && spot >= pk + brk && spot > o2) { call = { side: "up", label: "Break above 5m PP" }; pinkSetup = true; }
    else if (o5 >= pk && spot <= pk - brk && spot < o2) { call = { side: "down", label: "Break below 5m PP" }; pinkSetup = true; }
    else if (l5 <= pk - brk && spot > pk && spot > o2) { call = { side: "up", label: "Failed break below 5m PP - rejected up" }; pinkSetup = true; }
    else if (h5 >= pk + brk && spot < pk && spot < o2) { call = { side: "down", label: "Failed break above 5m PP - rejected down" }; pinkSetup = true; }
  }
  if (!call) for (const l of L) {
    if (!/σ$|^session VWAP$|^(Red|Green) zone$|^BB (upper|lower)$/.test(l.name)) continue; const P = l.price;
    if (!call && o5 >= P && l5 <= P + nr && l5 > P - brk && spot > P && colour("up")) call = { side: "up", label: `Rejected up off ${l.name}` };
    if (!call && o5 <= P && h5 >= P - nr && h5 < P + brk && spot < P && colour("down")) call = { side: "down", label: `Rejected down off ${l.name}` };
  }
  if (!call) return { why: "no setup" };
  if (call.side === "up" && f >= 0.67) return { why: "THIRDS: long in the top 33%" };
  if (call.side === "down" && f <= 0.33) return { why: "THIRDS: short in the bottom 33%" };
  if (pk && r1 && s1) {
    if (call.side === "up" && spot >= r1) return { why: "PAST THE RED ZONE" }; if (call.side === "down" && spot <= s1) return { why: "PAST THE GREEN ZONE" };
    if (call.side === "up" && spot > pk && (spot - pk) / (r1 - pk) >= 0.45) return { why: "PINK TO RED 45%" };
    if (call.side === "down" && spot < pk && (pk - spot) / (pk - s1) >= 0.45) return { why: "PINK TO GREEN 45%" };
    if (!pinkSetup) { const w = W / k, cush = w < 100 ? W / 2 : w < 180 ? W / 3 : w <= 500 ? 0.2 * W : w > 1000 ? 0.1 * W : 0.15 * W;
      if (call.side === "up" && pk > spot && pk - spot <= cush) return { why: "PINK CUSHION: pink just above the long" };
      if (call.side === "down" && pk < spot && spot - pk <= cush) return { why: "PINK CUSHION: pink just below the short" }; }
  }
  return call;
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
