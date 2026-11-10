// 1H COMBOS (Claude, Oct 13 ~12:45 AM PT, Love: "we can have her make her own combos on the 1H contracts too... start a new
// paper book on those, that should be more steady and controllable than the 15m windows. we can catch 1.2x on those and stack
// a few, still be safe and still get 1.8-2.0x"). PAPER ONLY, $20 each, nothing is bought.
//  - Markets: Kalshi's hourly crypto ladders that Kalshi lets into combos (KXBTCD, KXETHD, KXSOLD, KXXRPD, KXDOGED: "above $X
//    at the top of the hour"). Only events on Kalshi's combo-eligible list are used.
//  - Each leg is picked at about 1.2x: the strike whose favorite costs closest to 83c (72c to 90c, ladders are coarse). Two kinds of leg per coin:
//    FLOOR = YES on a strike under price ("stays above"), CEILING = NO on a strike over price ("stays under").
//  - Legs are stacked (2 to 4) to the combo nearest 1.9x inside 1.7x-2.2x.
//  - Lanes = when x how: built with 25-35 min left or 12-20 min left; all FLOOR legs, all CEILING legs, or MIXED (each coin
//    takes whichever kind is nearer 83c). Crypto moves together, so FLOOR / CEILING are one-direction bets and MIXED spreads it.
//  - Every combo also asks Kalshi's makers for the REAL price once (shadow RFQ, cancelled), so the book is scored at paper's
//    price AND at the real price. Held to the bell. Marked every minute from the legs' bids.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";

const STAKE = 20;
const SERIES = ["KXBTCD", "KXETHD", "KXSOLD", "KXXRPD", "KXDOGED"];
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => { const n = Number.parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : NaN; };
type Leg = { ticker: string; event: string; series: string; side: "yes" | "no"; strike: number; ask: number; bid?: number; result?: string };
type HC = { id: string; lane: string; at: string; window: string; minsLeft: number; legs: Leg[]; cost: number; multiple: number; value?: number; best?: number; worst?: number; result: "open" | "win" | "loss"; pnl: number | null; real?: { at: string; ask: number | null; n: number; dropped: string[] } | null; realPnl?: number | null; missed?: string[] };
export const HOUR_LANES = [
  { id: "h1-30-mixed", title: "1H · 30 MIN LEFT · MIXED", lo: 25, hi: 35, style: "mixed" },
  { id: "h1-30-floor", title: "1H · 30 MIN LEFT · ALL FLOOR (stays above)", lo: 25, hi: 35, style: "floor" },
  { id: "h1-30-ceiling", title: "1H · 30 MIN LEFT · ALL CEILING (stays under)", lo: 25, hi: 35, style: "ceiling" },
  { id: "h1-15-mixed", title: "1H · 15 MIN LEFT · MIXED", lo: 12, hi: 20, style: "mixed" },
  { id: "h1-15-floor", title: "1H · 15 MIN LEFT · ALL FLOOR", lo: 12, hi: 20, style: "floor" },
  { id: "h1-15-ceiling", title: "1H · 15 MIN LEFT · ALL CEILING", lo: 12, hi: 20, style: "ceiling" },
] as const;
const g = globalThis as unknown as { __hcBusy?: boolean; __hcAt?: number; __hcMarkAt?: number; __hcMk?: { at: number; ms: any[] } };
const read = (): HC[] => { try { return existsSync(D("hour-combos.json")) ? JSON.parse(readFileSync(D("hour-combos.json"), "utf8")) : []; } catch { return []; } };
const write = (rows: HC[]) => { writeFileSync(D("hour-combos.json.tmp"), JSON.stringify(rows.slice(0, 3000))); renameSync(D("hour-combos.json.tmp"), D("hour-combos.json")); };

async function ladders(): Promise<any[]> {
  if (g.__hcMk && Date.now() - g.__hcMk.at < 50000) return g.__hcMk.ms;
  // Oct 13 ~12:55 AM PT: a plain series list caps at 1000 and ETH/SOL/XRP/DOGE fill it with other days' strikes, so the hourly
  // events come back empty. Read BTC's ladder for the hour events (e.g. KXBTCD-26OCT1304), then fetch each coin BY EVENT.
  const ms: any[] = [];
  let sufs: string[] = [];
  try {
    const j = await kget(`/trade-api/v2/markets?series_ticker=KXBTCD&status=open&limit=1000`);
    const now = Date.now();
    const bt = (j?.markets ?? []).filter((m: any) => Date.parse(m.close_time) > now && Date.parse(m.close_time) - now <= 2 * 3600000);
    for (const m of bt) ms.push({ ...m, series: "KXBTCD" });
    sufs = [...new Set(bt.map((m: any) => String(m.event_ticker).replace(/^KXBTCD-/, "")))] as string[];
  } catch {}
  for (const s of SERIES.slice(1)) {
    for (const suf of sufs) {
      for (let k = 0; k < 3; k++) {
        try {
          const j = await kget(`/trade-api/v2/markets?event_ticker=${s}-${suf}&limit=1000`);
          for (const m of j?.markets ?? []) ms.push({ ...m, series: s });
          break;
        } catch (e) { (g as any).__hcErr = `${s}-${suf}: ${String(e).slice(0, 120)}`; await new Promise((r) => setTimeout(r, 2000)); }
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  g.__hcMk = { at: Date.now(), ms };
  return ms;
}

// One leg per coin of the wanted kind, closest to 83c (80-87c).
function pickLegs(hour: any[], style: string): Leg[] {
  const out: Leg[] = [];
  for (const s of SERIES) {
    const ms = hour.filter((m) => m.series === s && Number.isFinite(num(m.floor_strike)) && (!m.strike_type || /greater/.test(String(m.strike_type))));
    const cands: Leg[] = [];
    for (const m of ms) {
      const ya = num(m.yes_ask_dollars), na = num(m.no_ask_dollars);
      if (ya >= 0.72 && ya <= 0.9) cands.push({ ticker: m.ticker, event: m.event_ticker, series: s, side: "yes", strike: num(m.floor_strike), ask: ya });
      if (na >= 0.72 && na <= 0.9) cands.push({ ticker: m.ticker, event: m.event_ticker, series: s, side: "no", strike: num(m.floor_strike), ask: na });
    }
    const pool = cands.filter((c) => (style === "floor" ? c.side === "yes" : style === "ceiling" ? c.side === "no" : true));
    pool.sort((a, b) => Math.abs(a.ask - 0.833) - Math.abs(b.ask - 0.833));
    if (pool[0]) out.push(pool[0]);
  }
  return out;
}
// 3 or 4 legs (nearest 83c first) paying 1.75x-2.15x.
function stack(legs: Leg[]): Leg[] | null {
  const xs = [...legs].sort((a, b) => Math.abs(a.ask - 0.833) - Math.abs(b.ask - 0.833));
  // Oct 13 ~12:50 AM PT: SOL/XRP/DOGE ladders are coarse (few strikes land at 80-87c), so legs may be 72-90c and 2-4 legs,
  // aiming for the combo nearest 1.9x inside 1.7x-2.2x.
  let best: Leg[] | null = null, bd = 9;
  const comb = (start: number, cur: Leg[]) => {
    if (cur.length >= 2) {
      const p = cur.reduce((a, l) => a * l.ask, 1);
      if (p <= 1 / 1.7 && p >= 1 / 2.2) { const d = Math.abs(1 / p - 1.9) + cur.length * 0.01; if (d < bd) { bd = d; best = [...cur]; } }
    }
    if (cur.length >= 4) return;
    for (let i = start; i < xs.length; i++) comb(i + 1, [...cur, xs[i]]);
  };
  comb(0, []);
  return best;
}

export async function hourComboTick() {
  if (g.__hcBusy || (g.__hcAt && Date.now() - g.__hcAt < 20000)) return;
  g.__hcBusy = true;
  g.__hcAt = Date.now();
  try {
    const rows = read();
    let changed = false;
    // Only touch Kalshi when there's work: a build window (11-36 min before the top of the hour) or an open combo (rate limits).
    const toTop = (3600000 - (Date.now() % 3600000)) / 60000;
    if (!(toTop >= 11 && toTop <= 36) && !rows.some((c) => c.result === "open")) return;
    const all = await ladders();
    const now = Date.now();
    // 1. Build: the event closing at the next top of the hour, on Kalshi's combo list.
    const closes: number[] = [...new Set(all.map((m) => Date.parse(m.close_time)).filter((t) => t > now && t - now <= 61 * 60000))].sort((a, b) => a - b);
    const close = closes[0];
    const st: any = { at: new Date().toISOString(), markets: all.length, perSeries: Object.fromEntries(SERIES.map((x) => [x, all.filter((m) => m.series === x).length])), lastErr: (g as any).__hcErr ?? null, close: close ? new Date(close).toISOString() : null, lanes: {} };
    if (close) {
      const minsLeft = (close - now) / 60000;
      st.minsLeft = Math.round(minsLeft * 10) / 10;
      let ev: Set<string> | null = null;
      for (const L of HOUR_LANES) {
        if (!(minsLeft >= L.lo && minsLeft <= L.hi)) continue;
        const id = `hc:${L.id}:${new Date(close).toISOString()}`;
        if (rows.some((r) => r.id === id)) continue;
        if (!ev) { try { ev = await (await import("./kalshi-live.server") as any).comboEvents(); } catch {} }
        const hour = all.filter((m) => Date.parse(m.close_time) === close && (!ev || ev.has(m.event_ticker)));
        if (!st.series) {
          st.series = {};
          for (const sr of SERIES) {
            const raw = all.filter((m) => m.series === sr && Date.parse(m.close_time) === close);
            const el = raw.filter((m) => !ev || ev.has(m.event_ticker));
            st.series[sr] = { n: raw.length, eligible: el.length, events: [...new Set(raw.map((m) => m.event_ticker))].slice(0, 3), types: [...new Set(raw.map((m) => m.strike_type))], sample: [...el].sort((a: any, b: any) => Math.abs(num(a.yes_ask_dollars) - 0.5) - Math.abs(num(b.yes_ask_dollars) - 0.5)).slice(0, 10).map((m: any) => `${m.floor_strike}:${m.yes_ask_dollars}/${m.no_ask_dollars}:${m.status}`) };
          }
        }
        const picked = pickLegs(hour, L.style);
        const legs = stack(picked);
        st.lanes[L.id] = { hourMarkets: hour.length, eligible: ev ? ev.size : null, picked: picked.map((l) => `${l.series}:${l.side}:${l.ask}`), built: !!legs };
        if (!legs) continue;
        const cost = legs.reduce((a, l) => a * l.ask, 1);
        const c: HC = { id, lane: L.id, at: new Date().toISOString(), window: new Date(close).toISOString(), minsLeft: Math.round(minsLeft), legs, cost: Math.round(cost * 10000) / 10000, multiple: r2(1 / cost), value: cost, best: 0, worst: 0, result: "open", pnl: null, real: null };
        rows.unshift(c);
        changed = true;
        // the real maker price, once (shadow RFQ: nothing bought, cancelled right after)
        try {
          const live: any = await import("./kalshi-live.server");
          const q: any = await live.comboBuyQuote(legs.map((l) => ({ market_ticker: l.ticker, event_ticker: l.event, side: l.side, ask: l.ask })), STAKE, cost);
          c.real = { at: new Date().toISOString(), ask: q.bestYesAsk ?? null, n: q.quotes?.length ?? 0, dropped: q.dropped ?? [] };
        } catch {}
      }
    }
    // 2. Mark open combos every minute from the legs' bids (same ladder fetch).
    if (!g.__hcMarkAt || now - g.__hcMarkAt > 55000) {
      g.__hcMarkAt = now;
      const byT = new Map(all.map((m) => [m.ticker, m]));
      for (const c of rows) {
        if (c.result !== "open") continue;
        let v = 1, ok = true;
        for (const l of c.legs) {
          const m = byT.get(l.ticker);
          const b = m ? num(l.side === "yes" ? m.yes_bid_dollars : m.no_bid_dollars) : NaN;
          if (!(b >= 0)) { ok = false; break; }
          l.bid = b; v *= b;
        }
        if (!ok) continue;
        c.value = Math.round(v * 10000) / 10000;
        const pct = (v / c.cost - 1) * 100;
        c.best = Math.max(c.best ?? 0, Math.round(pct));
        c.worst = Math.min(c.worst ?? 0, Math.round(pct));
        changed = true;
      }
    }
    // 3. Settle from Kalshi's own results.
    for (const c of rows) {
      if (c.result !== "open" || Date.parse(c.window) > now - 60000) continue;
      let done = true;
      for (const l of c.legs) {
        if (!l.result) { try { const j = await kget(`/trade-api/v2/markets/${l.ticker}`); const r = j?.market?.result; if (r === "yes" || r === "no") l.result = r; } catch {} }
        if (!l.result) { done = false; break; }
      }
      if (!done) continue;
      const won = c.legs.every((l) => l.result === l.side);
      c.result = won ? "win" : "loss";
      c.missed = c.legs.filter((l) => l.result !== l.side).map((l) => l.series.replace(/^KX|D$/g, ""));
      c.pnl = won ? r2(STAKE / c.cost - STAKE) : -STAKE;
      const ra = c.real?.ask;
      c.realPnl = ra && ra > 0 && ra < 1 && !(c.real?.dropped?.length) ? (won ? r2(STAKE / ra - STAKE) : -STAKE) : null;
      changed = true;
    }
    if (changed) write(rows);
    try { writeFileSync(D("hour-combos-status.json"), JSON.stringify(st, null, 1)); } catch {}
  } catch (e) {
    try { writeFileSync(D("hour-combos-status.json"), JSON.stringify({ at: new Date().toISOString(), error: String(e).slice(0, 300) })); } catch {}
  } finally {
    g.__hcBusy = false;
  }
}

export function hourCombos() {
  const rows = read();
  const lanes = HOUR_LANES.map((L) => {
    const xs = rows.filter((c) => c.lane === L.id);
    const done = xs.filter((c) => c.result !== "open");
    const rq = done.filter((c) => c.realPnl != null);
    const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 1000) / 1000 : null);
    return {
      id: L.id, title: L.title, n: done.length, w: done.filter((c) => c.result === "win").length, pnl: r2(done.reduce((a, c) => a + (c.pnl || 0), 0)), open: xs.length - done.length,
      realN: rq.length, realPnl: r2(rq.reduce((a, c) => a + (c.realPnl || 0), 0)), avgMult: avg(done.map((c) => c.multiple)),
      avgGap: avg(xs.filter((c) => c.real?.ask).map((c) => (c.real!.ask as number) - c.cost)),
    };
  });
  return { stake: STAKE, lanes, recent: rows.slice(0, 12), all: rows.slice(0, 400) };
}
