// fix831 ETH REJECTIONS LIVE ON KALSHI (Love Nov 6 2026 ~3:04 PM PT: "yes , and i meant the eth rejection book on kalshi bb my bad :))" - to "pls put the rejection book on for eth" at
// $2.50 + a $3 add-on at 2.8x): her ETH · REJECTIONS ONLY · NO PINK paper book (fix682) goes LIVE on Kalshi KXETH15M, all hours (like its paper card):
//   ENTRY: the second the paper book takes a window, buy the same side for $2.50 - only inside her 1.5x floor (66.7c or less); one per window (the paper book takes one per window).
//   ADD-ON: once that side pays 2.8x (35.7c or less) while it is open, $3 more - once per window.
//   EXIT: mirror the paper: its half at 75% = sell half here; its trail sale = sell the rest here; otherwise to the bell.
// Every order goes through her own add-on route (addOnBuy600): the umpire must be SAFE and its gate clear, LIVE on, entries on (halt / breaker), never over $5 an order, the window's
// side lock. Sells are reduce-only (partLive). live-switch ethLive831 { on, dollars, addOn, addOnMult } - on:false = off. Log: data/eth-live-831.jsonl, state: data/eth-live-831.json.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export type Cfg831 = { on: boolean; dollars: number; addOn: number; addOnMult: number; maxAsk: number };
export function cfg831(): Cfg831 {
  let c: any = {}; try { c = JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.ethLive831 || {}; } catch {}
  return { on: c.on === true, dollars: Math.min(5, Number(c.dollars) > 0 ? Number(c.dollars) : 2.5), addOn: Math.min(5, Number(c.addOn) > 0 ? Number(c.addOn) : 3), addOnMult: Number(c.addOnMult) > 1 ? Number(c.addOnMult) : 2.8, maxAsk: 0.667 };
}
type Pos = { id: string; ticker: string; side: "up" | "down"; closeTime: string; at: string; status: "open" | "sold" | "bell"; addOn: boolean; halfSold: boolean; filled: number };
function st(): { pos: Record<string, Pos>; seen: Record<string, number> } { if (G.__el831) return G.__el831; let s = { pos: {} as Record<string, Pos>, seen: {} as Record<string, number> }; try { if (existsSync(D("eth-live-831.json"))) s = { pos: {}, seen: {}, ...JSON.parse(readFileSync(D("eth-live-831.json"), "utf8")) }; } catch {} G.__el831 = s; return s; }
function save() { try { const s = st(), cut = Date.now() - 2 * 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; for (const k of Object.keys(s.pos)) if (Date.parse(s.pos[k].at) < cut) delete s.pos[k]; writeFileSync(D("eth-live-831.json.tmp"), JSON.stringify(s)); renameSync(D("eth-live-831.json.tmp"), D("eth-live-831.json")); } catch {} }
function log(x: any) { try { appendFileSync(D("eth-live-831.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
/** pure: the paper rows to copy now (ETH, open, just taken, 1+ minute left, inside her floor) */
export function fresh831(rows: any[], seen: Record<string, number>, now: number, maxAsk = 0.667): any[] {
  return (rows || []).filter((r) => r?.id && /^KXETH15M-/.test(String(r.ticker)) && r.result === "open" && !seen[r.id] && now - Date.parse(String(r.at)) <= 60000 && Date.parse(String(r.closeTime)) - now >= 60000 && (r.side === "up" || r.side === "down") && Number(r.ask) > 0 && Number(r.ask) <= maxAsk + 1e-9);
}
export function addOnNow831(ask: number, mult: number): boolean { return ask > 0.02 && ask < 1 && 1 / ask >= mult - 1e-9; }
type Live = { addOnBuy600: Function; partLive: Function };
type Mk = { fetchMarket: Function };
export async function ethLiveTick831(now = Date.now(), liveIn?: Live, mkIn?: Mk) {
  const c = cfg831(); if (!c.on || G.__el831Busy) return; if (now - Number(G.__el831At || 0) < 2000) return; G.__el831At = now; G.__el831Busy = true;
  try {
    const live: Live = liveIn || ((await import("./kalshi-live.server")) as any), mk: Mk = mkIn || ((await import("./kalshi")) as any);
    let rows: any[] = []; try { rows = JSON.parse(readFileSync(D("eth-book.json"), "utf8"))?.rows || []; } catch {}
    const s = st(); let dirty = false;
    for (const r of fresh831(rows, s.seen, now, c.maxAsk)) {
      s.seen[r.id] = now; dirty = true;
      try {
        const o = await live.addOnBuy600(r.ticker, r.side, c.dollars, c.maxAsk);
        if (o?.ok && o.filled > 0) { s.pos[r.id] = { id: r.id, ticker: r.ticker, side: r.side, closeTime: r.closeTime, at: new Date(now).toISOString(), status: "open", addOn: false, halfSold: false, filled: o.filled }; log({ id: r.id, action: "bought", side: r.side, label: r.label, filled: o.filled, px: o.px }); }
        else log({ id: r.id, action: "skipped", side: r.side, label: r.label, why: String(o?.reason || "no fill") });
      } catch (e: any) { log({ id: r.id, action: "error", why: String(e?.message || e).slice(0, 160) }); }
    }
    for (const p of Object.values(s.pos)) {
      if (p.status !== "open") continue;
      if (now >= Date.parse(p.closeTime)) { p.status = "bell"; dirty = true; log({ id: p.id, action: "bell" }); continue; }
      const paper = rows.find((x) => x?.id === p.id);
      if (!p.addOn && c.addOn > 0) {
        const m = await mk.fetchMarket(p.ticker).catch(() => null); const ask = m ? Number(p.side === "up" ? m.yesAsk : m.noAsk) : 0;
        if (addOnNow831(ask, c.addOnMult)) {
          p.addOn = true; dirty = true;
          try { const o = await live.addOnBuy600(p.ticker, p.side, c.addOn, 1 / c.addOnMult); log({ id: p.id, action: o?.ok ? "add-on" : "add-on missed", filled: o?.filled ?? 0, px: o?.px ?? null, why: o?.ok ? "" : String(o?.reason || "") }); if (o?.ok) p.filled += Number(o.filled) || 0; } catch (e: any) { log({ id: p.id, action: "add-on error", why: String(e?.message || e).slice(0, 160) }); }
        }
      }
      if (paper && paper.half && !p.halfSold) { p.halfSold = true; dirty = true; try { const x = await live.partLive(p.ticker, 50); log({ id: p.id, action: "sold half", out: x ? { filled: x.filled, payout: x.payout } : null }); } catch (e: any) { log({ id: p.id, action: "sell error", why: String(e?.message || e).slice(0, 160) }); } }
      if (paper && paper.soldBid != null) { p.status = "sold"; dirty = true; try { const x = await live.partLive(p.ticker, 100); log({ id: p.id, action: "sold the rest", out: x ? { filled: x.filled, payout: x.payout } : null }); } catch (e: any) { log({ id: p.id, action: "sell error", why: String(e?.message || e).slice(0, 160) }); } }
    }
    if (dirty) save();
  } catch {} finally { G.__el831Busy = false; }
}
