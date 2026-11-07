// fix830 MOMENTUM ON POLYMARKET - BTC (Love Nov 6 2026 ~2:56 PM PT: "and can you put the momentum book live on polymarket at $2.50 with a $$3 add on at 2.8x for me bb 💘💘").
// The MOMENTUM BOOK (fix704, paper on Kalshi) is mirrored LIVE onto Polymarket's BTC 15-minute up/down market only:
//   ENTRY: the second MOMENTUM books a BTC paper trade in the running window, buy the same side on Polymarket for $2.50 - only inside her 1.5x floor (ask 66.7c or less), once per window.
//   ADD-ON: once that side gets cheap enough to pay 2.8x (ask 35.7c or less) while the position is open, buy $3 more - once per window.
//   EXIT: mirror the paper: when paper banks half (75% of the way to $1) sell half here; when paper sells the rest (its trail) sell the rest here; otherwise ride to the bell.
// Money rails stay: every order goes through the Polymarket guard (the umpire must be SAFE, the LIVE switch, her max-dollar cap) and needs Polymarket cash. Gold is never mirrored.
// live-switch polyMom830 { on, dollars, addOn, addOnMult, maxAsk } - on:false = off. Log: data/poly-mom-830.jsonl, state: data/poly-mom-830.json.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export type Cfg830 = { on: boolean; dollars: number; addOn: number; addOnMult: number; maxAsk: number };
export function cfg830(): Cfg830 {
  let c: any = {};
  try { c = JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.polyMom830 || {}; } catch {}
  return { on: c.on === true, dollars: Number(c.dollars) > 0 ? Number(c.dollars) : 2.5, addOn: Number(c.addOn) > 0 ? Number(c.addOn) : 3, addOnMult: Number(c.addOnMult) > 1 ? Number(c.addOnMult) : 2.8, maxAsk: Number(c.maxAsk) > 0 ? Number(c.maxAsk) : 1 / 1.5 };
}
type Pos = { id: string; slug: string; side: "up" | "down"; closesAt: string; contracts: number; cost: number; at: string; status: "open" | "sold" | "bell"; addOn: boolean; halfSold: boolean; sold: number; why?: string };
function st(): { pos: Record<string, Pos>; seen: Record<string, number> } { if (G.__pm830) return G.__pm830; let s = { pos: {} as Record<string, Pos>, seen: {} as Record<string, number> }; try { if (existsSync(D("poly-mom-830.json"))) s = { pos: {}, seen: {}, ...JSON.parse(readFileSync(D("poly-mom-830.json"), "utf8")) }; } catch {} G.__pm830 = s; return s; }
function save() { try { const s = st(), cut = Date.now() - 2 * 86400000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; for (const k of Object.keys(s.pos)) if (Date.parse(s.pos[k].at) < cut) delete s.pos[k]; writeFileSync(D("poly-mom-830.json.tmp"), JSON.stringify(s)); renameSync(D("poly-mom-830.json.tmp"), D("poly-mom-830.json")); } catch {} }
function log(x: any) { try { appendFileSync(D("poly-mom-830.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
export function closeOf830(closeTime: string): string { const t = Date.parse(closeTime); return new Date(Math.round(t / 900000) * 900000).toISOString(); }
/** pure: which paper rows are new BTC entries to mirror now */
export function fresh830(rows: any[], seen: Record<string, number>, now: number): any[] {
  return (rows || []).filter((r) => r?.asset === "btc" && r?.result === "open" && r?.id && !seen[r.id] && now - Date.parse(String(r.at)) <= 60000 && Date.parse(String(r.closeTime)) - now >= 60000 && (r.side === "up" || r.side === "down"));
}
/** pure: the add-on fires once the side pays her multiple */
export function addOnNow830(ask: number, mult: number): boolean { return ask > 0.02 && ask < 1 && 1 / ask >= mult - 1e-9; }
type PM = { takeSide: Function; sellSide: Function; bookTop: Function };
export async function polyMomTick830(now = Date.now(), pmIn?: PM) {
  const c = cfg830(); if (!c.on || G.__pm830Busy) return; if (now - Number(G.__pm830At || 0) < 2000) return; G.__pm830At = now; G.__pm830Busy = true;
  try {
    const pm: PM = pmIn || ((await import("./poly-live.server")) as any);
    let rows: any[] = []; try { rows = JSON.parse(readFileSync(D("momentum-book-704.json"), "utf8"))?.rows || []; } catch {}
    const s = st(); let dirty = false;
    for (const r of fresh830(rows, s.seen, now)) {
      s.seen[r.id] = now; dirty = true;
      const closesAt = closeOf830(r.closeTime);
      try {
        const f = await pm.takeSide(r.side, closesAt, c.dollars, c.maxAsk, 0.08, 0.02, ":mom830", "btc");
        if (f && f.filled > 0) { s.pos[r.id] = { id: r.id, slug: f.slug, side: r.side, closesAt, contracts: f.filled, cost: f.filled * f.price, at: new Date(now).toISOString(), status: "open", addOn: false, halfSold: false, sold: 0 }; log({ id: r.id, action: "bought", setup: r.setup, side: r.side, slug: f.slug, contracts: f.filled, price: f.price }); }
        else log({ id: r.id, action: "skipped", setup: r.setup, side: r.side, why: String(G.__polyWhy || "no fill / outside her 1.5x floor") });
      } catch (e: any) { log({ id: r.id, action: "error", why: String(e?.message || e).slice(0, 160) }); }
    }
    for (const p of Object.values(s.pos)) {
      if (p.status !== "open") continue;
      if (now >= Date.parse(p.closesAt)) { p.status = "bell"; dirty = true; log({ id: p.id, action: "bell" }); continue; }
      const paper = rows.find((x) => x?.id === p.id);
      // add-on at her multiple
      if (!p.addOn && c.addOn > 0) {
        const top = await pm.bookTop(p.slug).catch(() => null);
        const ask = top ? (p.side === "up" ? Number(top.ask) : Math.round((1 - Number(top.bid)) * 100) / 100) : 0;
        if (addOnNow830(ask, c.addOnMult)) {
          p.addOn = true; dirty = true;
          try { const f = await pm.takeSide(p.side, p.closesAt, c.addOn, 1 / c.addOnMult, 0.03, 0.01, ":mom830add", "btc"); if (f && f.filled > 0) { p.contracts += f.filled; p.cost += f.filled * f.price; log({ id: p.id, action: "add-on", contracts: f.filled, price: f.price }); } else log({ id: p.id, action: "add-on missed", ask }); } catch (e: any) { log({ id: p.id, action: "add-on error", why: String(e?.message || e).slice(0, 160) }); }
        }
      }
      // mirror the paper exits
      if (paper && paper.half && !p.halfSold) {
        p.halfSold = true; dirty = true; const q = Math.floor((p.contracts / 2) * 100) / 100;
        try { const x = await pm.sellSide(p.side, p.slug, q); if (x?.filled) { p.sold += x.filled; log({ id: p.id, action: "sold half", contracts: x.filled, price: x.price }); } } catch (e: any) { log({ id: p.id, action: "sell error", why: String(e?.message || e).slice(0, 160) }); }
      }
      if (paper && paper.soldBid != null && p.status === "open") {
        const q = Math.floor((p.contracts - p.sold) * 100) / 100; p.status = "sold"; dirty = true;
        if (q >= 0.01) { try { const x = await pm.sellSide(p.side, p.slug, q); log({ id: p.id, action: "sold the rest", contracts: x?.filled ?? 0, price: x?.price ?? null }); } catch (e: any) { log({ id: p.id, action: "sell error", why: String(e?.message || e).slice(0, 160) }); } }
      }
    }
    if (dirty) save();
  } catch {} finally { G.__pm830Busy = false; }
}
