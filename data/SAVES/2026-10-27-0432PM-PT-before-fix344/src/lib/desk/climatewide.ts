// CLIMATE WIDE (Claude, Oct 10 ~5 PM PT, Love: "i would like her trading on every window, not just the last hours too,
// for everything under a 2x that makes sense, as low as 1.2... everything for every contract, i want to build a knowledge
// base on the ones that succeeded and the ones that didn't and refine from there. climate is a real option"). PAPER ONLY.
// Every open Climate & Weather market on Kalshi (daily highs/lows, hourly temps, rain, everything): whichever side costs
// 50-83c (pays 1.2x-2x) is paper-bought at $100 at the ask (taker fee in). A market can be bought again in a later
// 3-hour block of its life, so we learn WHEN in a market's life the favorite is worth buying. Every row stores the facts
// at entry (kind, city, hours to close, local hour, price, spread, volume, strike) so the knowledge base can be sliced
// later; settled from Kalshi's own results. data/climate-wide.json + data/climate-wide-summary.json.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";

const STAKE = 100;
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (s: unknown) => { const n = Number.parseFloat(String(s ?? "")); return Number.isFinite(n) ? n : NaN; };
const fee = (ask: number, stake: number) => Math.ceil(0.07 * (stake / ask) * ask * (1 - ask) * 100) / 100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const g = globalThis as unknown as { __cw2At?: number; __cw2Busy?: boolean; __cw2Series?: { at: number; v: string[] } };
type Row = { id: string; at: string; ticker: string; series: string; kind: string; city: string; title: string; side: "yes" | "no"; ask: number; bid: number; spread: number; volume: number; strikeType: string; floor: number | null; cap: number | null; closes: string; hoursToClose: number; ptHour: number; block: number; stake: number; fee: number; result: "open" | "win" | "loss" | "void"; pnl: number | null };
const read = (): Row[] => { try { return existsSync(D("climate-wide.json")) ? JSON.parse(readFileSync(D("climate-wide.json"), "utf8")) : []; } catch { return []; } };
const write = (rows: Row[]) => { writeFileSync(D("climate-wide.json.tmp"), JSON.stringify(rows.slice(0, 20000))); renameSync(D("climate-wide.json.tmp"), D("climate-wide.json")); };
async function slow(path: string) {
  for (let i = 0; i < 3; i++) {
    try { const j = await kget(path); await sleep(1500); return j; } catch (e) { if (!/429/.test(String(e)) || i === 2) throw e; await sleep(5000 * (i + 1)); }
  }
}
const kindOf = (s: string) => (/^KXHIGHT|^KXTEMP/.test(s) ? "hourly temp" : /^KXHIGH/.test(s) ? "daily high" : /^KXLOW/.test(s) ? "daily low" : /RAIN|PRECIP/.test(s) ? "rain" : /SNOW/.test(s) ? "snow" : /HURR|STORM|TORN/.test(s) ? "storms" : "other climate");

export async function climateWideTick() {
  if (g.__cw2Busy || (g.__cw2At && Date.now() - g.__cw2At < 30 * 60000)) return;
  g.__cw2At = Date.now();
  g.__cw2Busy = true;
  try {
    const rows = read();
    if (!g.__cw2Series || Date.now() - g.__cw2Series.at > 6 * 3600 * 1000) {
      const j = await slow(`/trade-api/v2/series?category=${encodeURIComponent("Climate and Weather")}`);
      g.__cw2Series = { at: Date.now(), v: (j?.series ?? []).map((x: any) => String(x.ticker || "")).filter(Boolean) };
    }
    const series = g.__cw2Series.v;
    const prog = (i: number, note = "") => { try { writeFileSync(D("climate-wide-status.json"), JSON.stringify({ at: new Date().toISOString(), series: series.length, done: i, added, note })); } catch {} };
    let added = 0;
    prog(0, "pass started");
    const openBy = new Map<string, Row[]>();
    for (const r of rows) if (r.result === "open") (openBy.get(r.series) || openBy.set(r.series, []).get(r.series)!).push(r);
    const have = new Set(rows.map((r) => r.id));
    const ptHour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
    let i = 0;
    for (const sr of series) {
      i++;
      if (i % 20 === 0) { write(rows); prog(i); }
      try {
        // settle what's due in this series
        const due = (openBy.get(sr) || []).filter((r) => Date.parse(r.closes) < Date.now());
        if (due.length) {
          const since = Math.floor((Date.now() - 3 * 86400000) / 1000);
          const j = await slow(`/trade-api/v2/markets?series_ticker=${sr}&status=settled&min_close_ts=${since}&limit=1000`);
          const res = new Map<string, string>();
          for (const m of j?.markets ?? []) if (m.result === "yes" || m.result === "no") res.set(m.ticker, m.result);
          for (const r of due) {
            const out = res.get(r.ticker);
            if (!out) continue;
            const won = out === r.side;
            r.result = won ? "win" : "loss";
            r.pnl = r2(won ? (r.stake / r.ask) * (1 - r.ask) - r.fee : -r.stake - r.fee);
          }
        }
        if (added >= 200) continue;
        const j = await slow(`/trade-api/v2/markets?series_ticker=${sr}&status=open&limit=200`);
        for (const m of j?.markets ?? []) {
          const closes = String(m.close_time || "");
          const hrs = (Date.parse(closes) - Date.now()) / 3600000;
          if (!(hrs > 0.05) || hrs > 72) continue;
          const block = Math.floor(Date.now() / (3 * 3600000));
          const id = `${m.ticker}:${block}`;
          if (have.has(id)) continue;
          const ya = num(m.yes_ask_dollars), na = num(m.no_ask_dollars);
          let side: "yes" | "no" | null = null, ask = 0, bid = 0;
          const ok = (a: number) => a >= 0.5 && a <= 0.83;
          if (ok(ya) && (!ok(na) || ya >= na)) { side = "yes"; ask = ya; bid = num(m.yes_bid_dollars); }
          else if (ok(na)) { side = "no"; ask = na; bid = num(m.no_bid_dollars); }
          if (!side) continue;
          const f = fee(ask, STAKE);
          rows.unshift({ id, at: new Date().toISOString(), ticker: m.ticker, series: sr, kind: kindOf(sr), city: sr.replace(/^KX(HIGHT|HIGH|LOWT|LOW|TEMP|RAIN[A-Z]*?)/, "").slice(0, 8), title: `${m.title || ""}${m.yes_sub_title ? ` · ${m.yes_sub_title}` : ""}`.slice(0, 160), side, ask: r2(ask), bid: Number.isFinite(bid) ? r2(bid) : 0, spread: Number.isFinite(bid) ? r2(ask - bid) : 0, volume: num(m.volume_fp ?? m.volume) || 0, strikeType: String(m.strike_type || ""), floor: Number.isFinite(num(m.floor_strike)) ? num(m.floor_strike) : null, cap: Number.isFinite(num(m.cap_strike)) ? num(m.cap_strike) : null, closes, hoursToClose: r2(hrs), ptHour, block, stake: STAKE, fee: f, result: "open", pnl: null });
          have.add(id);
          added++;
        }
      } catch {
      }
    }
    write(rows);
    prog(series.length, "pass done");
    // knowledge base summary: by kind, by hours-to-close, by price band, by city
    const done = rows.filter((r) => r.result === "win" || r.result === "loss");
    const agg = (key: (r: Row) => string) => {
      const o: Record<string, { n: number; w: number; pnl: number; roi: number }> = {};
      for (const r of done) { const k = key(r); const x = (o[k] ||= { n: 0, w: 0, pnl: 0, roi: 0 }); x.n++; x.w += r.result === "win" ? 1 : 0; x.pnl = r2(x.pnl + (r.pnl || 0)); }
      for (const x of Object.values(o)) x.roi = x.n ? r2((x.pnl / (x.n * STAKE)) * 100) : 0;
      return o;
    };
    const hb = (h: number) => (h < 1 ? "<1h" : h < 3 ? "1-3h" : h < 6 ? "3-6h" : h < 12 ? "6-12h" : h < 24 ? "12-24h" : "24h+");
    const pb = (a: number) => (a < 0.6 ? "50-59c (1.7-2x)" : a < 0.7 ? "60-69c (1.45-1.7x)" : a < 0.77 ? "70-76c (1.3-1.45x)" : "77-83c (1.2-1.3x)");
    const summary = { at: new Date().toISOString(), open: rows.filter((r) => r.result === "open").length, settled: done.length, won: done.filter((r) => r.result === "win").length, pnl: r2(done.reduce((a, r) => a + (r.pnl || 0), 0)), byKind: agg((r) => r.kind), byHoursToClose: agg((r) => hb(r.hoursToClose)), byPrice: agg((r) => pb(r.ask)), byCity: agg((r) => r.city), bySide: agg((r) => r.side) };
    writeFileSync(D("climate-wide-summary.json"), JSON.stringify(summary, null, 1));
  } catch (e) {
    try { writeFileSync(D("climate-wide-status.json"), JSON.stringify({ at: new Date().toISOString(), error: String(e).slice(0, 300) })); } catch {}
  } finally {
    g.__cw2Busy = false;
  }
}
