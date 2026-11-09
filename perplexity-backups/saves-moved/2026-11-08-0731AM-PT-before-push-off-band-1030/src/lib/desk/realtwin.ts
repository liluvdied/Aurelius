// BRICK 1:1 · REAL (Claude, Oct 9 ~2:10 PM PT, Love: "can we run a paper book that would emulate the real fees and slippage
// and everything if we were to do that, so i can see without bleeding anymore money"). Paper only. Every BRICK trade is
// copied the moment it books (no band waits: the "fire together" idea), but priced like Kalshi really would:
//  - ENTRY: walks Kalshi's live order book for that side up to the live copy's limit (ask + 20%, at least 3c, never past
//    72c = her 1.37x floor) for $22. If nobody is selling at or under that, it is a NO FILL (logged, no trade).
//  - EXIT: when BRICK sells, this sells into the real bids (walking the book) and pays the taker fee; held to the bell
//    pays $1 / $0 with no exit fee (Kalshi charges nothing at settlement).
//  - FEES: Kalshi's taker fee, 7% x contracts x p x (1-p), rounded up to the cent, on the way in and on the way out.
// Rows live in the night book as book "b11"; data/real-twin-log.jsonl keeps every fill / no fill / exit with the book walk.
import { appendFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const BASE = "https://external-api.kalshi.com/trade-api/v2";
const STAKE = 22;
const g = globalThis as unknown as { __rtProbe?: boolean; __rtBusy?: boolean; __rtAt?: number; __rtSeen?: Set<string>; __rtSelling?: Set<string> };
type Lvl = [number, number]; // price (dollars), contracts
const log = (row: Record<string, unknown>) => {
  try { appendFileSync(join(process.cwd(), "data", "real-twin-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...row }) + "\n"); } catch {}
};
const fee = (c: number, p: number) => Math.ceil(0.07 * c * p * (1 - p) * 100 - 1e-9) / 100;
const r2 = (x: number) => Math.round(x * 100) / 100;
async function book(ticker: string): Promise<{ yes: Lvl[]; no: Lvl[] } | null> {
  try {
    const res = await fetch(`${BASE}/markets/${encodeURIComponent(ticker)}/orderbook?depth=30`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const j = (await res.json()) as Record<string, any>;
    const fp = j.orderbook_fp || {};
    const ob = j.orderbook || {};
    const pick = (dollars: unknown, cents: unknown): Lvl[] => {
      if (Array.isArray(dollars)) return dollars.map((x: any) => [Number(x[0]), Number(x[1])] as Lvl).filter((x) => x[0] > 0 && x[1] > 0);
      if (Array.isArray(cents)) return cents.map((x: any) => [Number(x[0]) / 100, Number(x[1])] as Lvl).filter((x) => x[0] > 0 && x[1] > 0);
      return [];
    };
    const yes = pick(fp.yes_dollars ?? ob.yes_dollars, ob.yes);
    const no = pick(fp.no_dollars ?? ob.no_dollars, ob.no);
    return { yes: yes.sort((a, b) => b[0] - a[0]), no: no.sort((a, b) => b[0] - a[0]) };
  } catch {
    return null;
  }
}
// Buy `side` up to `limit` with `count` contracts: asks for YES are 1 - NO bids (and vice versa).
function walkBuy(b: { yes: Lvl[]; no: Lvl[] }, side: "up" | "down", limit: number, count: number) {
  const opp = side === "up" ? b.no : b.yes;
  let got = 0, cost = 0, f = 0;
  for (const [bid, qty] of opp) {
    const px = Math.round((1 - bid) * 1000) / 1000;
    if (px > limit + 1e-9 || got >= count - 1e-9) break;
    const take = Math.min(qty, count - got);
    got += take; cost += take * px; f += 0.07 * take * px * (1 - px);
  }
  return { got: Math.floor(got * 100) / 100, cost: r2(cost), fee: Math.ceil(f * 100 - 1e-9) / 100 };
}
function walkSell(b: { yes: Lvl[]; no: Lvl[] }, side: "up" | "down", count: number) {
  const own = side === "up" ? b.yes : b.no;
  let left = count, got = 0, f = 0;
  for (const [bid, qty] of own) {
    if (left <= 1e-9) break;
    const take = Math.min(qty, left);
    left -= take; got += take * bid; f += 0.07 * take * bid * (1 - bid);
  }
  return { sold: count - left, proceeds: r2(got), fee: Math.ceil(f * 100 - 1e-9) / 100, unsold: left };
}
export async function realTwinTick() {
  if (g.__rtBusy || Date.now() - (g.__rtAt || 0) < 700) return;
  g.__rtBusy = true;
  g.__rtAt = Date.now();
  try {
    const nb = await import("./nightbook");
    const rows = nb.listNight();
    const seen = (g.__rtSeen ||= new Set());
    const selling = (g.__rtSelling ||= new Set());
    const have = new Set(rows.filter((r) => r.book === "b11").map((r) => r.ticker));
    // One-time self-check: read a live book and save what was parsed (data/real-twin-probe.json).
    if (!g.__rtProbe) {
      g.__rtProbe = true;
      const tk = rows.find((r) => /KXBTC15M-/.test(String(r.ticker)) && r.result === "open")?.ticker || rows.find((r) => /15M-/.test(String(r.ticker)))?.ticker;
      if (tk) {
        const b = await book(tk);
        try { writeFileSync(join(process.cwd(), "data", "real-twin-probe.json"), JSON.stringify({ at: new Date().toISOString(), ticker: tk, yesBids: b?.yes.slice(0, 5), noBids: b?.no.slice(0, 5), buyUp22: b ? walkBuy(b, "up", 0.72, 30) : null, buyDown22: b ? walkBuy(b, "down", 0.72, 30) : null })); } catch {}
      }
    }
    // 1. New BRICK trades (booked in the last 20 s): copy now at real prices.
    for (const p of rows) {
      if (p.book !== "brick" || p.result !== "open" || !/15M-/.test(String(p.ticker)) || (p as any).dnaMode || (p as any).stale) continue;
      if (seen.has(p.id) || have.has(p.ticker) || Date.now() - Date.parse(p.at) > 20000) continue;
      seen.add(p.id);
      const ask = Number((p as any).paperAsk ?? p.ask);
      const limit = Math.min(0.72, r2(Math.max(ask + 0.03, ask * 1.2)));
      const count = Math.floor((STAKE / Math.max(ask, limit)) * 100) / 100;
      const b = await book(p.ticker);
      if (!b) { log({ id: p.id, kind: "nobook" }); continue; }
      const w = walkBuy(b, p.side as "up" | "down", limit, count);
      if (!(w.got >= 1)) {
        log({ id: p.id, kind: "nofill", paperAsk: ask, limit, best: (p.side === "up" ? b.no : b.yes)[0] ? r2(1 - (p.side === "up" ? b.no : b.yes)[0][0]) : null });
        continue;
      }
      const avg = r2(w.cost / w.got);
      nb.extAddRow({ ...p, id: `${p.ticker}:b11`, book: "b11", at: new Date().toISOString(), ask: avg, multiple: r2(1 / avg), stake: w.cost, entryFee: w.fee, peakPct: 0, exit: null, sellBid: null, result: "open", pnl: null, setup: `BRICK 1:1 · REAL: ${w.got} @ ${Math.round(avg * 100)}c (paper ${Math.round(ask * 100)}c, limit ${Math.round(limit * 100)}c) · fee $${w.fee.toFixed(2)} · ${p.setup}`, notes: null } as any);
      log({ id: p.id, kind: "fill", paperAsk: ask, limit, got: w.got, avg, cost: w.cost, fee: w.fee });
    }
    // repair: rows closed with nothing sold (pre-fix) go back to the bell
    for (const t of rows) if (t.book === "b11" && t.result !== "open" && /: 0\.00 for \$0\.00/.test(String(t.exit || ""))) nb.extReopen(t.id);
    // 2. BRICK sold early: sell the twin into the real bids, taker fee on the way out.
    for (const t of rows) {
      if (t.book !== "b11" || t.result !== "open" || selling.has(t.id)) continue;
      const p = rows.find((x) => x.id === `${t.ticker}:brick`);
      if (!p || p.result === "open" || !(p as any).soldAt) continue;
      selling.add(t.id);
      const b = await book(t.ticker);
      if (!b) { selling.delete(t.id); continue; }
      const n = Math.floor((t.stake / t.ask) * 100) / 100;
      const s = walkSell(b, t.side as "up" | "down", n);
      // No buyers (the window already shut, or an empty book): leave it open so the bell settles it ($1 / $0, no exit fee).
      if (s.sold < n * 0.5) { log({ id: t.id, kind: "exit-deferred", parentExit: p.exit, sold: s.sold }); continue; }
      const pnl = r2(s.proceeds - t.stake - (Number((t as any).entryFee) || 0) - s.fee);
      nb.extUpdate(t.id, { result: pnl > 0 ? "sold" : "sold", exit: `sold with BRICK (${p.exit}) into the real bids: ${s.sold.toFixed(2)} for $${s.proceeds.toFixed(2)}${s.unsold > 0.01 ? `, ${s.unsold.toFixed(2)} found no buyer (held)` : ""} · fees in $${Number((t as any).entryFee || 0).toFixed(2)} out $${s.fee.toFixed(2)}`, pnl, soldAt: new Date().toISOString() } as any);
      log({ id: t.id, kind: "exit", parentExit: p.exit, sold: s.sold, proceeds: s.proceeds, fee: s.fee, pnl });
    }
    try {
      writeFileSync(join(process.cwd(), "data", "real-twin-status.json"), JSON.stringify({ at: new Date().toISOString(), open: rows.filter((r) => r.book === "b11" && r.result === "open").length }));
    } catch {}
  } catch {
  } finally {
    g.__rtBusy = false;
  }
}
