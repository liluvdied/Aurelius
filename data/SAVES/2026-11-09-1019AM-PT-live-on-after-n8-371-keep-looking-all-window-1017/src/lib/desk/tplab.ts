// TAKE-PROFIT LAB (Claude, Oct 10 ~4:45 PM PT, Love: "we don't need to wait for the actual result to cash out either,
// just get 50% and bounce... maybe test different levels but definitely take the money and run on those"). PAPER ONLY.
// Every open weather paper trade (scanner flags + CLIMATE LADDER ladders) has its held side's bid checked every few
// minutes; the best bid it ever reached is kept. When it settles we know what each exit would have paid:
//   sell at +10% / +25% / +50% / +100% the first time the bid got there, or hold to Kalshi's result.
// data/tp-lab.json; the SCANNER tab shows which level wins.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";
const D = (f: string) => join(process.cwd(), "data", f);
const g = globalThis as unknown as { __tpAt?: number; __tpBusy?: boolean };
const LEVELS = [10, 25, 50, 100];
const rd = (f: string, d: any) => { try { return existsSync(D(f)) ? JSON.parse(readFileSync(D(f), "utf8")) : d; } catch { return d; } };
type Track = { id: string; src: "scan" | "ladder"; at: string; stake: number; legs: { ticker: string; side: "yes" | "no"; contracts: number; cost: number }[]; peakValue: number; hits: Record<string, string | null>; done?: boolean; hold?: number | null };
export async function tpLabTick() {
  if (g.__tpBusy || (g.__tpAt && Date.now() - g.__tpAt < 4 * 60000)) return;
  g.__tpAt = Date.now();
  g.__tpBusy = true;
  try {
    const lab: Record<string, Track> = rd("tp-lab.json", {});
    const scan: any[] = rd("scanner-paper.json", []);
    const lad: any[] = rd("ladder-paper.json", []);
    for (const r of scan) if (r.result === "open" && !lab[r.id]) lab[r.id] = { id: r.id, src: "scan", at: r.at, stake: r.stake, legs: [{ ticker: r.ticker, side: r.side, contracts: r.stake / r.ask, cost: r.stake }], peakValue: 0, hits: {} };
    for (const L of lad) if (L.result === "open" && !lab[L.id]) lab[L.id] = { id: L.id, src: "ladder", at: L.at, stake: L.stake, legs: L.legs.map((x: any) => ({ ticker: x.ticker, side: "yes", contracts: x.contracts, cost: x.cost })), peakValue: 0, hits: {} };
    const open = Object.values(lab).filter((t) => !t.done).slice(0, 25);
    const bid: Record<string, any> = {};
    for (const t of open) {
      let value = 0, settled = true, hold = 0;
      for (const leg of t.legs) {
        let m = bid[leg.ticker];
        if (!m) {
          try { m = (await kget(`/trade-api/v2/markets/${leg.ticker}`))?.market; } catch { m = null; }
          bid[leg.ticker] = m;
          await new Promise((r) => setTimeout(r, 1200));
        }
        const b = Number.parseFloat(String(leg.side === "yes" ? m?.yes_bid_dollars : m?.no_bid_dollars)) || 0;
        value += b * leg.contracts;
        const res = String(m?.result || "");
        if (res === "yes" || res === "no") hold += (res === leg.side ? 1 : 0) * leg.contracts;
        else settled = false;
      }
      t.peakValue = Math.max(t.peakValue, Math.round(value * 100) / 100);
      for (const L of LEVELS) if (!t.hits[L] && value >= t.stake * (1 + L / 100)) t.hits[L] = new Date().toISOString();
      if (settled) { t.done = true; t.hold = Math.round((hold - t.stake) * 100) / 100; }
    }
    writeFileSync(D("tp-lab.json.tmp"), JSON.stringify(lab, null, 1));
    renameSync(D("tp-lab.json.tmp"), D("tp-lab.json"));
  } catch {
  } finally {
    g.__tpBusy = false;
  }
}
/** Results so far: for settled trades, profit if sold at each level the first time it got there, else held. */
export function tpLab() {
  const lab: Record<string, Track> = rd("tp-lab.json", {});
  const done = Object.values(lab).filter((t) => t.done && t.hold != null);
  const out: Record<string, { n: number; pnl: number; hit: number }> = { hold: { n: done.length, pnl: 0, hit: 0 } };
  for (const t of done) out.hold.pnl += t.hold as number;
  for (const L of LEVELS) {
    const k = `+${L}%`;
    out[k] = { n: done.length, pnl: 0, hit: 0 };
    for (const t of done) {
      if (t.hits[L]) { out[k].pnl += (t.stake * L) / 100; out[k].hit++; } else out[k].pnl += t.hold as number;
    }
  }
  for (const v of Object.values(out)) v.pnl = Math.round(v.pnl * 100) / 100;
  return { settled: done.length, open: Object.values(lab).filter((t) => !t.done).length, levels: out };
}
