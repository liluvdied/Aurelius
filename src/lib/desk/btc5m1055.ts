// fix1055 BTC 5M LIVE ON POLYMARKET (Love Nov 9 2026 9:46 PM PT: "Put all of them at the configuration that brings them to those numbers, and let's get them live, please" - after her 5m table: ETH 77% / XRP 76% / BTC 62% +$0.48 per $1, the 5m configuration replayed 14 days):
// an exact twin of her live XRP 5m lane (xrp5m961.ts) on BTC's Polymarket 5-minute up/down windows: the SAME read (xrpRead961 - imported, one copy of her brain) with BTC's push ($5, the 5m books' fix1045 push),
// her 5m-open rule (fix1051), the same 1.5x floor (66c max), $1 a ticket (data/btc5m-1055-cfg.json; no file = on at $1 / 66c on her word; on:false turns it off), one buy a window, the same add-ons, the same wire guards
// (umpire SAFE, LIVE on, Polymarket cash, the desk's $ cap). Log: data/btc5m-1055.jsonl. Rows: data/btc5m-1055-book.json.
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
// Money: $1 an entry (her Poly size = half her $2 live slider; data/btc5m-1055-cfg.json), through the desk's Polymarket buy (buySlug): the umpire must be SAFE, the LIVE switch on, the $ cap,
// her 1.5x floor (ask 66c or less), Polymarket cash, one buy per window (the desk remembers every bought window). A stale feed (no XRP minute in 120 s) = no trade.
// Log: data/btc5m-1055.jsonl. Paper rows (every call, for the card): data/btc5m-1055-book.json.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ethBands682 } from "./ethbook";
import { xrpRead961, win5Open1051, rung1029, trigPx1043, boxes1029 } from "./xrp5m961"; // fix1055 her one brain
const PUSH1055 = { band: 5, pink: 5, wick: 10 }; // fix1055 BTC push - the 5m books' (fix1045) numbers behind her 5m table

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
export type Cfg1055 = { on: boolean; dollars: number; maxAsk: number };
export function cfg1055(): Cfg1055 {
  let c: any = {}; try { c = JSON.parse(readFileSync(D("btc5m-1055-cfg.json"), "utf8")) || {}; } catch {}
  return { on: c.on !== false /* fix1055: no file = on, on her 9:46 PM word */, dollars: Math.min(5, Number(c.dollars) > 0 ? Number(c.dollars) : 1), maxAsk: Math.min(0.66, Number(c.maxAsk) > 0 ? Number(c.maxAsk) : 0.66) };
}
function log(x: any) { try { appendFileSync(D("btc5m-1055.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
type Row = { id: string; slug: string; at: string; side: "up" | "down"; label: string; spot: number; ask: number | null; live: string; closesAt: string };
function book(): { rows: Row[]; seen: Record<string, number>; add1029?: Record<string, Record<string, number>> } { if (G.__btc1055) return G.__btc1055; let s = { rows: [] as Row[], seen: {} as Record<string, number> }; try { if (existsSync(D("btc5m-1055-book.json"))) s = { rows: [], seen: {}, ...JSON.parse(readFileSync(D("btc5m-1055-book.json"), "utf8")) }; } catch {} G.__btc1055 = s; return s; }
function save() { try { const s = book(); s.rows = s.rows.slice(-2000); const cut = Date.now() - 2 * 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D("btc5m-1055-book.json.tmp"), JSON.stringify(s)); renameSync(D("btc5m-1055-book.json.tmp"), D("btc5m-1055-book.json")); } catch {} }
async function j(url: string): Promise<any> { const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "aurelius-btc/1.0" }, signal: AbortSignal.timeout(8000) }); return r.ok ? r.json() : null; }
async function bars(): Promise<Bar[]> {
  const B = (G.__btc1055Bars ||= { at: 0, m: new Map<number, Bar>() });
  if (Date.now() - B.at < 5000 && B.m.size) return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
  const need = B.m.size < 600 ? 3 : 1;
  for (let k = need - 1; k >= 0; k--) {
    const end = Math.floor(Date.now() / 60000) * 60 - k * 300 * 60, start = end - 299 * 60;
    const d = await j(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=60&start=${new Date(start * 1000).toISOString()}&end=${new Date(end * 1000).toISOString()}`).catch(() => null); // fix1055x keep usable pages after a feed timeout
    if (Array.isArray(d)) for (const x of d) B.m.set(x[0], { t: x[0], l: x[1], h: x[2], o: x[3], c: x[4], v: x[5] });
  }
  for (const k of [...B.m.keys()]) if (k < Date.now() / 1000 - 2 * 86400) B.m.delete(k);
  B.at = Date.now(); return [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t);
}
type PM = { buySlug: Function; bookTop: Function };
/** her XRP 5m window on Polymarket US (slug forms the desk's BTC 5m uses) */
async function windowSlug(pm: PM, startSec: number): Promise<string | null> {
  const C = (G.__btc1055Slug ||= {}) as Record<number, string | null>; if (startSec in C && C[startSec]) return C[startSec];
  const ds = new Date(startSec * 1000), day = ds.toISOString().slice(0, 10), hm = String(ds.getUTCHours()).padStart(2, "0") + String(ds.getUTCMinutes()).padStart(2, "0");
  for (const slug of [`btc-updown-5m-${day}-${hm}z`, `cpc-btc-updown-5m-${day}-${hm}z`, `btc-updown-5m-${startSec}`]) { if (await pm.bookTop(slug).catch(() => null)) return (C[startSec] = slug); }
  return null;
}
// fix1017 XRP 5M LANE KEEPS WATCHING AFTER AN OVER-CAP LOOK (Love Nov 7 2026 9:16 PM PT: "SHE IS NOTTTTTTTTTTTTTTTTTT TAKKKKINNGGGGGGGGG ANYYYYYYYYTHINGGGGGG" + 9:16 PM: "do NOT come back til it WORKS. please. do not have me in this loop any longer luv just check your work before you send it. don't send it if it doesn't work. that's it" + 9:17 PM: "im talking about xrp / flipped / didn't enter" + 9:21 PM: "they apply to literally every single thing traded on my accounts luv this isn't a here not there situation for any of these whatsoever / delayed is the only one that doesn't" (05:16:25Z her XRP lane read a short "Rejected down off BB upper (wick)", the ask was 72c, it skipped and never looked again that window; ~05:17:27Z XRP flipped red off the upper Bollinger / red zone)):
//   the window is spent ONLY when an order fills. An ask over her 66c (1.5x floor), no ask, or a no fill / refusal at the wire keeps the lane watching that window - it looks again
//   at most every 5 s and logs each kind of skip once a window. One ticket per window stays: a filled window is never bought again (seen + its bought row + the desk's own window claim).
//   An error at the wire spends the window (the order may have reached Polymarket). Not in the last minute stays. Nothing else changes: same read, same 66c / 1.5x floor, same $ cap, same buySlug guard.
export const RETRY1017_MS = 5000;
export async function btcTick1055(nowMs = Date.now(), pmIn?: PM) {
  const c = cfg1055(); if (!c.on || G.__btc1055Busy) return; if (nowMs - Number(G.__btc1055At || 0) < 3000) return; G.__btc1055At = nowMs; G.__btc1055Busy = true;
  try {
    const now = nowMs / 1000, start = Math.floor(now / 300) * 300, end = start + 300, left = end - now;
    if (left < 60) return; // 5-minute window: not in its last minute
    const s = book(); const id = `btclive5m-${start}`; if (s.seen[id]) { await addOns1029(s, id, nowMs, pmIn); return; } // fix1029 a bought window takes her box add-ons
    if (s.rows.some((x) => x.id === id && /^bought/.test(x.live))) { s.seen[id] = nowMs; return; } // fix1017 one ticket per window: a window that filled is never bought again
    const RT = (G.__btc1055Retry ||= {}) as Record<string, number>, OK = (G.__btc1055Once ||= {}) as Record<string, number>; for (const k of Object.keys(RT)) if (nowMs - RT[k] > 900000) delete RT[k]; for (const k of Object.keys(OK)) if (nowMs - OK[k] > 900000) delete OK[k];
    if (nowMs - Number(RT[id] || 0) < RETRY1017_MS) return; // fix1017 after a skip the lane looks again at most every 5 s - the window is NOT spent
    const once1017 = (k: string) => { if (OK[id + "|" + k]) return false; OK[id + "|" + k] = nowMs; return true; }; // fix1017 each kind of skip is logged once a window
    const bs = await bars();
    const readAt = Date.now() / 1000;
    if (end - readAt < 60) return;
    const spot = bs.at(-1)?.c ?? 0;
    const r = xrpRead961(bs, ethBands682(bs), spot, readAt, PUSH1055, win5Open1051(bs, readAt)); // fix1055x test the window side while choosing the setup
    if (!("side" in r)) { const W = (G.__btc1055Why ||= {}); if (W[id] !== r.why) { W[id] = r.why; if (!/^no setup$/.test(r.why)) log({ id, action: "waiting", why: r.why }); } return; }
    const pm: PM = pmIn || ((await import("./poly-live.server")) as any);
    const slug = await windowSlug(pm, start);
    if (!slug) { const M = (G.__btc1055Miss ||= {}); if (!M[id]) { M[id] = 1; log({ id, action: "skipped", side: r.side, label: r.label, why: "NO POLYMARKET BTC 5M WINDOW found for this window (btc-updown-5m) - no order" }); } return; }
    const top = await pm.bookTop(slug).catch(() => null); const ask = top ? (r.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100) : null;
    // fix1017: the window is no longer spent here - only a fill spends it (below)
    const row: Row = { id, slug, at: new Date(nowMs).toISOString(), side: r.side, label: r.label, spot, ask, live: "", closesAt: new Date(end * 1000).toISOString() };
    if (!(ask != null && ask > 0.02 && ask <= c.maxAsk)) { RT[id] = nowMs; row.live = `skipped: ask ${ask ?? "?"} over her 66c (1.5x floor) - still watching this window (fix1017)`; if (once1017(ask == null ? "noask" : "ask")) { s.rows.push(row); save(); log({ id, action: "skipped", side: r.side, label: r.label, slug, ask, why: row.live }); } return; } // fix1017 an over-cap look does not spend the window
    try {
      let wireCode = "unknown", wireReason = "";
      const f = await pm.buySlug(r.side, slug, c.dollars, c.maxAsk, null, "", (code: string, reason: string) => { wireCode = code; wireReason = reason; }, (end - 60) * 1000);
      row.live = f && f.filled > 0 ? `bought ${f.filled} @ ${f.price}` : `no fill / refused at the wire${wireReason ? `: ${wireReason}` : ""} - still watching this window (fix1017)`;
      if (f && f.filled > 0) s.seen[id] = nowMs; else { RT[id] = nowMs; if (!once1017(`wire:${wireCode}`)) return; } // fix1017 ONLY a fill spends the window; a no fill / refusal keeps watching
      log({ id, action: f && f.filled > 0 ? "bought" : "skipped", side: r.side, label: r.label, slug, ask, filled: f?.filled ?? 0, price: f?.price ?? null, why: f && f.filled > 0 ? "" : row.live });
    } catch (e: any) { s.seen[id] = nowMs; row.live = "error: " + String(e?.message || e).slice(0, 120); log({ id, action: "error", why: row.live }); } // fix1017: an error at the wire spends the window (the order may have gone out - one ticket per window)
    s.rows.push(row); save();
  } catch {} finally { G.__btc1055Busy = false; }
}
async function addOns1029(s: any, id: string, nowMs: number, pmIn?: PM) {
  const e = (s.rows as Row[]).find((x) => x.id === id && /^bought/.test(x.live)); if (!e) return; const px = Number(/@ ([\d.]+)/.exec(e.live)?.[1]), at = Date.parse(e.at); if (!(px > 0 && px < 1) || !(at > 0)) return;
  const A = (s.add1029 ||= {}) as Record<string, Record<string, number>>, done = (A[id] ||= {}), RT = (G.__btc1055AoRetry ||= {}) as Record<string, number>, c = cfg1055();
  const bx = boxes1029().filter((b) => b.k === "add1" /* fix1043: only the 1 default add-on at its multiple */ && b.on && b.dollars > 0 && b.mult >= 1.5 && !done[b.k]); const b2t = boxes1029()[1]; if (!bx.length && !(b2t.on && b2t.dollars > 0)) return;
  const pm: PM = pmIn || ((await import("./poly-live.server")) as any); const top = await pm.bookTop(e.slug).catch(() => null); if (!top) return;
  const ask = e.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100;
  // fix1043 HER TRIGGER ADD-ON ON THE XRP LANE: her lane's own read (xrpRead961, same walls as her entry) calls the SAME side again = a genuine entry trigger; 2.5x+, strictly better than her entry (trigPx1043), $ = her Add-on 2 box, one per distinct trigger (setup + 1 minute), no count limit
  try { if (b2t.on && b2t.dollars > 0 && nowMs - Number(RT[id + "trig"] || 0) >= RETRY1017_MS) { const bsT = await bars(); const spT = bsT.length ? bsT[bsT.length - 1].c : 0; const rd = spT > 0 ? xrpRead961(bsT, ethBands682(bsT as any), spT, nowMs / 1000, PUSH1055) : ({ why: "no bars" } as any);
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
export function btcSummary1055() { const rows = book().rows; return { at: new Date().toISOString(), n: rows.length, bought: rows.filter((r) => /^bought/.test(r.live)).length, last: rows.slice(-10) }; }
