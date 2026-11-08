// fix910 ETH.2 LIVE (Love Nov 6 2026 ~11:05 PM PT, her card pick: "Live right away" (ETH.2 trades live on Kalshi ETH from install, at her ETH coin sizes, beside the live ETH book)): ETH.2's live copy rebuilt from the newest ETH live route - her ETH coin sizes, the 1.5x floor, one filled trade a window, keep knocking (fix890), add-ons at a better multiple near the next band (fix891), her side of the line at the send (fix900), the opposite-side guard (fix848). live-switch ethLive872.on.
// fix831 ETH REJECTIONS LIVE ON KALSHI (Love Nov 6 2026 ~3:04 PM PT: "yes , and i meant the eth rejection book on kalshi bb my bad :))" - to "pls put the rejection book on for eth" at
// $2.50 + a $3 add-on at 2.8x): her ETH · REJECTIONS ONLY · NO PINK paper book (fix682) goes LIVE on Kalshi KXETH15M, all hours (like its paper card):
//   ENTRY: the second the paper book takes a window, buy the same side for $2.50 - only inside her 1.5x floor (66.7c or less); one per window (the paper book takes one per window).
//   ADD-ON: once that side pays 2.8x (35.7c or less) while it is open, $3 more - once per window.
//   EXIT: mirror the paper: its half at 75% = sell half here; its trail sale = sell the rest here; otherwise to the bell.
// Every order goes through her own add-on route (addOnBuy600): the umpire must be SAFE and its gate clear, LIVE on, entries on (halt / breaker), never over $5 an order, the window's
// side lock. Sells are reduce-only (partLive). live-switch ethLive831 { on, dollars, addOn, addOnMult } - on:false = off. Log: data/eth2-live-872.jsonl, state: data/eth2-live-872.json.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export type Cfg831 = { on: boolean; dollars: number; addOn: number; addOnMult: number; maxAsk: number };
function cfgBase969(): Cfg831 {
  let c: any = {}; try { c = JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.ethLive872 || {}; } catch {}
  const k863 = coin863("eth"); if (k863) return { on: c.on === true, dollars: k863.entry, addOn: k863.addOn1.on ? k863.addOn1.dollars : 0, addOnMult: k863.addOn1.mult, maxAsk: 0.667 }; // fix863 her ETH coin
  return { on: c.on === true, dollars: Math.min(5, Number(c.dollars) > 0 ? Number(c.dollars) : 2.5), addOn: Math.min(5, Number(c.addOn) > 0 ? Number(c.addOn) : 3), addOnMult: Number(c.addOnMult) > 1 ? Number(c.addOnMult) : 2.8, maxAsk: 0.667 };
}
type Pos = { id: string; ticker: string; side: "up" | "down"; closeTime: string; at: string; status: "open" | "sold" | "bell"; addOn: boolean; halfSold: boolean; filled: number; px?: number /* fix891 */ };
function st(): { pos: Record<string, Pos>; seen: Record<string, number> } { if (G.__el872) return G.__el872; let s = { pos: {} as Record<string, Pos>, seen: {} as Record<string, number> }; try { if (existsSync(D("eth2-live-872.json"))) s = { pos: {}, seen: {}, ...JSON.parse(readFileSync(D("eth2-live-872.json"), "utf8")) }; } catch {} G.__el872 = s; return s; }
function save() { try { const s = st(), cut = Date.now() - 2 * 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; for (const k of Object.keys(s.pos)) if (Date.parse(s.pos[k].at) < cut) delete s.pos[k]; writeFileSync(D("eth2-live-872.json.tmp"), JSON.stringify(s)); renameSync(D("eth2-live-872.json.tmp"), D("eth2-live-872.json")); } catch {} }
function log(x: any) { try { appendFileSync(D("eth2-live-872.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
/** pure: the paper rows to copy now (ETH, open, just taken, 1+ minute left, inside her floor) */
export function fresh831(rows: any[], seen: Record<string, number>, now: number, maxAsk = 0.667): any[] {
  return (rows || []).filter((r) => r?.id && /^KXETH15M-/.test(String(r.ticker)) && r.result === "open" && !seen[r.id] && now - Date.parse(String(r.at)) <= 180000 /* fix890: her set up stays valid 3 min while its paper row is open */ && Date.parse(String(r.closeTime)) - now >= 60000 && (r.side === "up" || r.side === "down") && Number(r.ask) > 0 && Number(r.ask) <= maxAsk + 1e-9);
}
// fix891 HER ADD-ON NEAR THE NEXT BAND (Love Nov 6 2026 ~9:20 PM PT: "have her keep knocking til the order fills as long as it's not under the floor and the set up is valid / 2 yes the add on is supposed to add on at a better multiple(s) not all at once / doesn't need to be 60 seconds, just near the next band it approaches is fine" (her live ETH book)): the ETH add-on waits for a better multiple than her entry (2c+ cheaper) and price near the next line it is heading to (within 15% of her channel) - never all at once.
export async function nextBand891(side: string): Promise<boolean> { try { if (G.__nb872Test === true) return true; /* her proof's stand-in for the bands */ const EB: any = await import("./ethbook2"); const B = G.__eth2xBars; const bs: any[] = B && B.m ? [...B.m.values()].sort((a: any, b: any) => a.t - b.t) : []; if (bs.length < 30) return false; const L = EB.ethBands682(bs), spot = Number(bs[bs.length - 1].c); const Sx = L.filter((l: any) => /σ$|^session VWAP$/.test(l.name)).map((l: any) => Number(l.price)).sort((a: number, b: number) => a - b); const up = Sx.find((x: number) => x > spot), dn = [...Sx].reverse().find((x: number) => x < spot); if (up === undefined || dn === undefined) return false; const Wc = up - dn, lines = L.filter((l: any) => /σ$|^session VWAP$|^(Red|Green) zone$|^BB (upper|lower)$|^5m PP$/.test(l.name)).map((l: any) => Number(l.price)); const nxt = side === "up" ? Math.min(...lines.filter((x: number) => x > spot)) : Math.max(...lines.filter((x: number) => x < spot)); return Number.isFinite(nxt) && Math.abs(nxt - spot) <= 0.15 * Wc; } catch { return false; } }
// fix900 ON HER SIDE OF THE LINE AT THE SEND (Love Nov 6 2026 ~8:14 PM PT: "and hun she is notttt on the same side of the break on these trades still i need you to fix that" + ~9:56 PM: "give me ETH.2 pink + thirds live on btc pls" (her side-of-line check at the send, on the ETH live route too)): the same check as main's (fix864) before every entry this route sends - a long off a line only while price is above it, a short only while below (her book's own lines and price).
export async function side900(label: string, side: string): Promise<string> {
  try { const K: any = await import("./kalshi-live.server"); const EB: any = await import("./ethbook2"); const B = G.__eth2xBars; const bs: any[] = B && B.m ? [...B.m.values()].sort((a: any, b: any) => a.t - b.t) : []; if (bs.length < 30 || typeof K.sideOfLine864 !== "function") return "";
    const L0 = EB.ethBands682(bs), spot = Number(bs[bs.length - 1].c), px = (n: string) => Number((L0.find((l: any) => l.name === n) || {}).price) || 0;
    const L = [...L0, { name: "5m R1", price: px("Red zone") }, { name: "5m S1", price: px("Green zone") }], bb = { bbU: px("BB upper"), bbL: px("BB lower") };
    return String(K.sideOfLine864(String(label || ""), L, bb, spot, spot) || "");
  } catch { return ""; }
}
export function addOnNow831(ask: number, mult: number): boolean { return ask > 0.02 && ask < 1 && 1 / ask >= mult - 1e-9; }
type Live = { addOnBuy600: Function; partLive: Function };
type Mk = { fetchMarket: Function };
export async function ethLiveTick872(now = Date.now(), liveIn?: Live, mkIn?: Mk) {
  const c = cfg831(); if (!c.on || G.__el872Busy) return; if (now - Number(G.__el872At || 0) < 2000) return; G.__el872At = now; G.__el872Busy = true;
  try {
    const live: Live = liveIn || ((await import("./kalshi-live.server")) as any), mk: Mk = mkIn || ((await import("./kalshi")) as any);
    let rows: any[] = []; try { rows = JSON.parse(readFileSync(D("eth2-book.json"), "utf8"))?.rows || []; } catch {}
    const s = st(); let dirty = false;
    for (const r of fresh831(rows, s.seen, now, c.maxAsk)) {
      if (Object.values(s.pos).some((p) => p.ticker === r.ticker && Number(p.filled) > 0)) { s.seen[r.id] = now; dirty = true; log({ id: r.id, action: "skipped", side: r.side, label: r.label, why: "ONE FILLED TRADE A WINDOW (fix871): this window already filled" }); continue; } // fix871: only a fill uses the window
      { const w900 = await side900(String(r.label || ""), String(r.side)); if (w900) { const S900 = (G.__s872 ||= {}); if (!S900[r.id]) { S900[r.id] = 1; log({ id: r.id, action: "waiting", side: r.side, label: r.label, why: w900 }); } continue; } } // fix900: on her side of the line, or wait while the set up is valid
      s.seen[r.id] = now; dirty = true;
      try {
        const o = await live.addOnBuy600(r.ticker, r.side, c.dollars, c.maxAsk, "entry") /* fix953: an entry stays on her slider */;
        if (o?.ok && o.filled > 0) { s.pos[r.id] = { id: r.id, ticker: r.ticker, side: r.side, closeTime: r.closeTime, at: new Date(now).toISOString(), status: "open", addOn: false, halfSold: false, filled: o.filled, px: Number(o.px) || 0 /* fix891 */ }; log({ id: r.id, action: "bought", side: r.side, label: r.label, filled: o.filled, px: o.px }); }
        else { const K890 = (G.__el872k ||= {}); K890[r.id] = (K890[r.id] || 0) + 1; if (Date.parse(String(r.closeTime)) - now >= 60000 && now - Date.parse(String(r.at)) <= 180000) delete s.seen[r.id]; /* fix890 KEEP KNOCKING: not filled / ask over her floor / not SAFE yet - she tries again in 2 s while the set up is valid */ if (K890[r.id] === 1 || K890[r.id] % 15 === 0) log({ id: r.id, action: "skipped", side: r.side, label: r.label, why: `${String(o?.reason || "no fill")} - knocking again (try ${K890[r.id]})` }); }
      } catch (e: any) { log({ id: r.id, action: "error", why: String(e?.message || e).slice(0, 160) }); }
    }
    for (const p of Object.values(s.pos)) {
      if (p.status !== "open") continue;
      if (now >= Date.parse(p.closeTime)) { p.status = "bell"; dirty = true; log({ id: p.id, action: "bell" }); continue; }
      const paper = rows.find((x) => x?.id === p.id);
      for (const [i969, b969] of boxes969().entries()) { if (i969 === 0 || !b969.on || !(b969.dollars > 0)) continue; const k969 = "ao" + (i969 + 1); if ((p as any)[k969]) continue; const T969 = ((G as any).__aoTry969 ||= {}); if (Date.now() - Number(T969[p.id + k969] || 0) < 10000) continue; // fix969 her add-on 2 / 3
        const m969 = await mk.fetchMarket(p.ticker).catch(() => null); const a969 = m969 ? Number(p.side === "up" ? m969.yesAsk : m969.noAsk) : 0;
        if (addOnNow831(a969, b969.mult) && (!(Number((p as any).px) > 0) || a969 <= Number((p as any).px) - 0.02)) { T969[p.id + k969] = Date.now(); try { const o = await live.addOnBuy600(p.ticker, p.side, b969.dollars, 1 / b969.mult); log({ id: p.id, action: o?.ok ? "add-on " + (i969 + 1) : "add-on " + (i969 + 1) + " missed", filled: o?.filled ?? 0, px: o?.px ?? null, why: o?.ok ? "" : String(o?.reason || "") }); if (o?.ok) { p.filled += Number(o.filled) || 0; (p as any)[k969] = true; dirty = true; } } catch (e: any) { log({ id: p.id, action: "add-on " + (i969 + 1) + " error", why: String(e?.message || e).slice(0, 160) }); } }
      }
      if (!p.addOn && c.addOn > 0 && Date.now() - Number(((G as any).__aoTry954 || {})[p.id] || 0) >= 10000 /* fix954 */) {
        const m = await mk.fetchMarket(p.ticker).catch(() => null); const ask = m ? Number(p.side === "up" ? m.yesAsk : m.noAsk) : 0;
        if (addOnNow831(ask, c.addOnMult) && (!(Number(p.px) > 0) || ask <= Number(p.px) - 0.02) /* fix891: a better multiple than her entry */ && await nextBand891(p.side)) {
          dirty = true; ((G as any).__aoTry954 ||= {})[p.id] = Date.now(); // fix954: her add-on is spent only when it FILLS - a refused try waits 10 s (below) and tries again
          try { const o = await live.addOnBuy600(p.ticker, p.side, c.addOn, 1 / c.addOnMult); log({ id: p.id, action: o?.ok ? "add-on" : "add-on missed", filled: o?.filled ?? 0, px: o?.px ?? null, why: o?.ok ? "" : String(o?.reason || "") }); if (o?.ok) { p.filled += Number(o.filled) || 0; p.addOn = true; /* fix954 */ } } catch (e: any) { log({ id: p.id, action: "add-on error", why: String(e?.message || e).slice(0, 160) }); }
        }
      }
      if (paper && paper.half && !p.halfSold) { p.halfSold = true; dirty = true; try { const x = await live.partLive(p.ticker, 50); log({ id: p.id, action: "sold half", out: x ? { filled: x.filled, payout: x.payout } : null }); } catch (e: any) { log({ id: p.id, action: "sell error", why: String(e?.message || e).slice(0, 160) }); } }
      if (paper && paper.soldBid != null) { p.status = "sold"; dirty = true; try { const x = await live.partLive(p.ticker, 100); log({ id: p.id, action: "sold the rest", out: x ? { filled: x.filled, payout: x.payout } : null }); } catch (e: any) { log({ id: p.id, action: "sell error", why: String(e?.message || e).slice(0, 160) }); } }
    }
    if (dirty) save();
  } catch {} finally { G.__el872Busy = false; }
}

// fix863 her coin's numbers (data/asset-sizing-863.json) - read here directly (no import, so this file's own tests stay standalone)
function coin863(asset: string): any { try { const G8 = globalThis as any, p8 = join(process.cwd(), "data", "asset-sizing-863.json"); if (!G8.__as863x || Date.now() - G8.__as863x.at > 3000) { let v8: any = null; try { v8 = existsSync(p8) ? JSON.parse(readFileSync(p8, "utf8")) : null; } catch { v8 = null; } G8.__as863x = { at: Date.now(), v: v8 }; } const c = G8.__as863x.v?.[asset]; if (!c) return null; const d = (v: any, x: number) => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : x; }, m = (v: any, x: number) => { const n = Math.round(Number(v) * 10) / 10; return n >= 1.5 && n <= 10 ? n : x; }; const b = (o: any, mm: number, dd: number) => ({ on: o?.on === true, mult: m(o?.mult, mm), dollars: d(o?.dollars, dd) }); return { entry: d(c.entry, 1), momentum: d(c.momentum, 1), addOn1: b(c.addOn1, 2.8, 3), addOn2: b(c.addOn2, 4.4, 5), addOn3: b(c.addOn3, 8.8, 2) }; } catch { return null; } }

// fix969 HER ADD-ON BOXES, EVERY BOOK (Love Nov 7 2026 ~5:42 PM PT: "hun pls let it run my add ons i have set in the settings. make it unilateral" + 5:40 PM: "ADD ONS DO NOT COUNT FOR CANDLE COLOR." + 3:26 PM: "let the add ons work as i set them"): this copy reads its add-ons ONLY from her add-on settings (data/addon-settings.json: add-on 1 / 2 / 3 - on, $, multiple;
// add-on 1 with no multiple = 2.8x) - each box once per position, at its multiple, a better price than her entry, spent only when it fills, $5 an order, through her add-on route (no colour - her 5:40 PM words).
export function boxes969(): { on: boolean; dollars: number; mult: number }[] { try { const j = JSON.parse(readFileSync(join(process.cwd(), "data", "addon-settings.json"), "utf8")) || {}; return [1, 2, 3].map((n) => { const b = j["addOn" + n] || {}; return { on: b.on === true, dollars: Math.min(5, Number(b.dollars) > 0 ? Number(b.dollars) : 0), mult: Number(b.mult) > 1 ? Number(b.mult) : 2.8 }; }); } catch { return []; } }
export function cfg831(): Cfg831 { const c = cfgBase969(); const b = boxes969()[0]; if (b) { c.addOn = b.on ? b.dollars : 0; c.addOnMult = b.mult; } return c; } // fix969 add-on 1 = her box 1
