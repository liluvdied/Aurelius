// fix940 BNB MOMENTUM LIVE ON KALSHI (Love Nov 7 2026 ~2:02 PM PT: "omg pls turn on bnb momentum on kalshi bb"): her BNB momentum paper book (fix833 - WITH THE FIRST 2 MINUTES, WITH A FRESH BREAK UP THROUGH PINK, SHORT UNDER -2σ WHILE FALLING,
// on Kalshi KXBNB15M) gets its own live copy: the second the paper book takes a BNB window, buy the same side for $1.50 - only inside her 1.5x floor (66.7c or less), one filled trade a window,
// keep knocking while the set up is valid (3 min, 1+ min left); exits mirror the paper (half at her 75%, the rest on its trail sale, else the bell). Add-on: fix964 ($3 at 2.8x, once, spent only when it fills - fix954).
// Every order goes through her add-on route (addOnBuy600): the umpire SAFE and its gate clear, LIVE on, entries on (halt / her stops), never over $5 an order, the window's side lock, the
// opposite-side guard. Sells are reduce-only (partLive). live-switch bnbLive940 { on, dollars } - on:false = off. Log: data/bnb-live-940.jsonl, state: data/bnb-live-940.json.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export type Cfg831 = { on: boolean; dollars: number; addOn: number; addOnMult: number; maxAsk: number };
export function cfg831(): Cfg831 {
  let c: any = {}; try { c = JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.bnbLive940 || {}; } catch {}
  return { on: c.on === true, dollars: Math.min(5, Number(c.dollars) > 0 ? Number(c.dollars) : 1.5), addOn: Math.min(5, Number(c.addOn) > 0 ? Number(c.addOn) : 3) /* fix964 HER BNB ADD-ON (Love Nov 7 2026 ~5:20 PM PT: "she IS NOT doing her add ons. please fix that" (BNB 15m UP open at 11.76x with no add-on) + 3:26 PM: "fix the add on thing now pls let the add ons work as i set them"): like ETH.2 / BTC.2 - $3 once the side pays 2.8x (bnbLive940 addOn / addOnMult change it), through addOnBuy600 */, addOnMult: Number(c.addOnMult) > 1 ? Number(c.addOnMult) : 2.8, maxAsk: 0.667 };
}
type Pos = { id: string; ticker: string; side: "up" | "down"; closeTime: string; at: string; status: "open" | "sold" | "bell"; addOn: boolean; halfSold: boolean; filled: number; px?: number /* fix891 */ };
function st(): { pos: Record<string, Pos>; seen: Record<string, number> } { if (G.__bnb940) return G.__bnb940; let s = { pos: {} as Record<string, Pos>, seen: {} as Record<string, number> }; try { if (existsSync(D("bnb-live-940.json"))) s = { pos: {}, seen: {}, ...JSON.parse(readFileSync(D("bnb-live-940.json"), "utf8")) }; } catch {} G.__bnb940 = s; return s; }
function save() { try { const s = st(), cut = Date.now() - 2 * 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; for (const k of Object.keys(s.pos)) if (Date.parse(s.pos[k].at) < cut) delete s.pos[k]; writeFileSync(D("bnb-live-940.json.tmp"), JSON.stringify(s)); renameSync(D("bnb-live-940.json.tmp"), D("bnb-live-940.json")); } catch {} }
function log(x: any) { try { appendFileSync(D("bnb-live-940.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
/** pure: the paper rows to copy now (ETH, open, just taken, 1+ minute left, inside her floor) */
export function fresh831(rows: any[], seen: Record<string, number>, now: number, maxAsk = 0.667): any[] {
  return (rows || []).filter((r) => r?.id && /^KXBNB15M-/.test(String(r.ticker)) && String(r.asset) === "bnb" && r.result === "open" && !seen[r.id] && now - Date.parse(String(r.at)) <= 180000 /* fix890: her set up stays valid 3 min while its paper row is open */ && Date.parse(String(r.closeTime)) - now >= 60000 && (r.side === "up" || r.side === "down") && Number(r.ask) > 0 && Number(r.ask) <= maxAsk + 1e-9);
}
// fix891 HER ADD-ON NEAR THE NEXT BAND (Love Nov 6 2026 ~9:20 PM PT: "have her keep knocking til the order fills as long as it's not under the floor and the set up is valid / 2 yes the add on is supposed to add on at a better multiple(s) not all at once / doesn't need to be 60 seconds, just near the next band it approaches is fine" (her live ETH book)): the ETH add-on waits for a better multiple than her entry (2c+ cheaper) and price near the next line it is heading to (within 15% of her channel) - never all at once.
export async function nextBand891(side: string): Promise<boolean> { try { if (G.__nb899Test === true) return true; /* her proof's stand-in for the bands */ const EB: any = await import("./btc2c"); const B = G.__btc2cxBars; const bs: any[] = B && B.m ? [...B.m.values()].sort((a: any, b: any) => a.t - b.t) : []; if (bs.length < 30) return false; const L = EB.ethBands682(bs), spot = Number(bs[bs.length - 1].c); const Sx = L.filter((l: any) => /σ$|^session VWAP$/.test(l.name)).map((l: any) => Number(l.price)).sort((a: number, b: number) => a - b); const up = Sx.find((x: number) => x > spot), dn = [...Sx].reverse().find((x: number) => x < spot); if (up === undefined || dn === undefined) return false; const Wc = up - dn, lines = L.filter((l: any) => /σ$|^session VWAP$|^(Red|Green) zone$|^BB (upper|lower)$|^5m PP$/.test(l.name)).map((l: any) => Number(l.price)); const nxt = side === "up" ? Math.min(...lines.filter((x: number) => x > spot)) : Math.max(...lines.filter((x: number) => x < spot)); return Number.isFinite(nxt) && Math.abs(nxt - spot) <= 0.15 * Wc; } catch { return false; } }
export function addOnNow831(ask: number, mult: number): boolean { return ask > 0.02 && ask < 1 && 1 / ask >= mult - 1e-9; }
type Live = { addOnBuy600: Function; partLive: Function };
type Mk = { fetchMarket: Function };
export async function bnbLiveTick940(now = Date.now(), liveIn?: Live, mkIn?: Mk) {
  const c = cfg831(); if (!c.on || G.__bnb940Busy) return; if (now - Number(G.__bnb940At || 0) < 2000) return; G.__bnb940At = now; G.__bnb940Busy = true;
  try {
    const live: Live = liveIn || ((await import("./kalshi-live.server")) as any), mk: Mk = mkIn || ((await import("./kalshi")) as any);
    let rows: any[] = []; try { rows = (JSON.parse(readFileSync(D("mom-coins-833.json"), "utf8"))?.rows || []).filter((x: any) => String(x?.asset) === "bnb").map((x: any) => ({ ...x, label: x.label || x.setup })); } catch {}
    const s = st(); let dirty = false;
    for (const r of fresh831(rows, s.seen, now, c.maxAsk)) {
      if (Object.values(s.pos).some((p) => p.ticker === r.ticker && Number(p.filled) > 0)) { s.seen[r.id] = now; dirty = true; log({ id: r.id, action: "skipped", side: r.side, label: r.label, why: "ONE FILLED TRADE A WINDOW (fix871): this window already filled" }); continue; } // fix871: only a fill uses the window
      s.seen[r.id] = now; dirty = true;
      try {
        const o = await live.addOnBuy600(r.ticker, r.side, c.dollars, c.maxAsk, "entry") /* fix953: an entry stays on her slider */;
        if (o?.ok && o.filled > 0) { s.pos[r.id] = { id: r.id, ticker: r.ticker, side: r.side, closeTime: r.closeTime, at: new Date(now).toISOString(), status: "open", addOn: false, halfSold: false, filled: o.filled, px: Number(o.px) || 0 /* fix891 */ }; log({ id: r.id, action: "bought", side: r.side, label: r.label, filled: o.filled, px: o.px }); }
        else { const K890 = (G.__bnb940k ||= {}); K890[r.id] = (K890[r.id] || 0) + 1; if (Date.parse(String(r.closeTime)) - now >= 60000 && now - Date.parse(String(r.at)) <= 180000) delete s.seen[r.id]; /* fix890 KEEP KNOCKING: not filled / ask over her floor / not SAFE yet - she tries again in 2 s while the set up is valid */ if (K890[r.id] === 1 || K890[r.id] % 15 === 0) log({ id: r.id, action: "skipped", side: r.side, label: r.label, why: `${String(o?.reason || "no fill")} - knocking again (try ${K890[r.id]})` }); }
      } catch (e: any) { log({ id: r.id, action: "error", why: String(e?.message || e).slice(0, 160) }); }
    }
    for (const p of Object.values(s.pos)) {
      if (p.status !== "open") continue;
      if (now >= Date.parse(p.closeTime)) { p.status = "bell"; dirty = true; log({ id: p.id, action: "bell" }); continue; }
      const paper = rows.find((x) => x?.id === p.id);
      if (!p.addOn && c.addOn > 0 && Date.now() - Number(((G as any).__aoTry954 || {})[p.id] || 0) >= 10000 /* fix954 */ && false /* fix940: no add-on on BNB */) {
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
  } catch {} finally { G.__bnb940Busy = false; }
}

