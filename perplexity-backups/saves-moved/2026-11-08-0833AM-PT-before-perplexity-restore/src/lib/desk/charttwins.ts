// CHART TWINS (paper only - Oct 18 ~10:25 PM PT, Love: "i want you to make a paper twin / that only longs when price is at the bottom band / only shorts
// when price is at the top band / longs when price is above the pink band / shorts when price is below it / on vantages chart / and on pepperstones" +
// "top/bottom 25%" + "BTC and gold" + "exactly how i said it"). Four twins: BTC + gold, each on VANTAGE and PEPPERSTONE.
// Her bands on that chart: session VWAP +/-1,2,3 sigma from 5 PM ET (5m bars, hlc3, volume-weighted - same math as the desk) and the pink (5m PP, the
// desk's pivot() on that chart). Channel = nearest session band below to nearest above. LONG only when price is in the bottom 25% of the channel AND above
// the pink; SHORT only when price is in the top 25% AND below the pink. One paper ticket per twin per 15-minute window, at Kalshi's live ask, $20 paper
// stake; settled on Kalshi's result. Paper only - never sends an order. data/chart-twins.json + data/chart-twins.jsonl.
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";
import { computeVwap } from "./vwap";
import { pivot, resample } from "./pivotbooks";
import { fetchMarket } from "./kalshi";
const D = (f: string) => join(process.cwd(), "data", f);
const G = globalThis as any;
const TWINS: { id: string; asset: "btc" | "gold"; chart: string; sym: string }[] = [
  { id: "btc-vantage", asset: "btc", chart: "VANTAGE", sym: "VANTAGE:BTCUSD" },
  { id: "btc-pepperstone", asset: "btc", chart: "PEPPERSTONE", sym: "PEPPERSTONE:BTCUSD" },
  { id: "gold-vantage", asset: "gold", chart: "VANTAGE", sym: "VANTAGE:XAUUSD" },
  { id: "gold-pepperstone", asset: "gold", chart: "PEPPERSTONE", sym: "PEPPERSTONE:XAUUSD" },
];
const ZONE = 0.25, STAKE = 20;
// REJECTION TWINS (paper, fix209, Oct 25 ~1:54 PM PT, Love: "can we try running a new paper book for the rejection model, on Vantage's chart? ... if we're only
// trading rejection and not trading fake breaks, the rejection model could be even better on there since our trades reversed more often on there"): the same
// rejection read on VANTAGE and on PEPPERSTONE side by side, BTC. Lines = that chart's session VWAP +/-1,2,3 sigma and its pink (5m PP). A rejection = the
// last finished 1m candle tapped a line (within $3 or through it) and closed $10+ back away from it, green for a long / red for a short; never a long in the
// top 33% of the channel or a short in the bottom 33%. One $5 paper ticket per twin per 15m window at Kalshi's live ask, settled on Kalshi's result. Paper only.
const REJ: { id: string; asset: "btc"; chart: string; sym: string }[] = [
  { id: "rej-vantage", asset: "btc", chart: "VANTAGE", sym: "VANTAGE:BTCUSD" },
  { id: "rej-pepperstone", asset: "btc", chart: "PEPPERSTONE", sym: "PEPPERSTONE:BTCUSD" },
];
const RSTAKE = 5;
function sess5pmET(now = Date.now()): number {
  const p: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(now))) p[x.type] = x.value;
  const secs = ((Number(p.hour) - 17 + 24) % 24) * 3600 + Number(p.minute) * 60 + Number(p.second);
  return Math.floor((now - secs * 1000) / 60000) * 60000;
}
function load(): { rows: any[] } { try { const j = JSON.parse(readFileSync(D("chart-twins.json"), "utf8")); return Array.isArray(j?.rows) ? j : { rows: [] }; } catch { return { rows: [] }; } }
function save(st: { rows: any[] }) {
  const sum: Record<string, any> = {};
  for (const t of [...TWINS, ...REJ]) {
    const rs = st.rows.filter((r) => r.twin === t.id && (r.result === "win" || r.result === "loss"));
    sum[t.id] = { trades: rs.length, wins: rs.filter((r) => r.result === "win").length, pnl: Math.round(rs.reduce((s, r) => s + Number(r.pnl || 0), 0) * 100) / 100 };
  }
  try { writeFileSync(D("chart-twins.json"), JSON.stringify({ at: new Date().toISOString(), summary: sum, now: G.__ctDiag || {}, rows: st.rows.slice(-400) }, null, 1)); } catch {}
}
async function readChart(sym: string) {
  const b5 = (await chartRaw(sym, "5", 400)) as any[];
  const b1 = (await chartRaw(sym, "1", 5)) as any[];
  if (!b5?.length || !b1?.length) return null;
  const ss = sess5pmET() / 1000;
  const sessBars = b5.filter((x) => Number(x.t) >= ss);
  const vw = computeVwap(sessBars as any);
  if (!vw || !(vw.vwap > 0) || !(vw.stdev > 0)) return null;
  const bands = [{ name: "session VWAP", price: vw.vwap }];
  for (const k of [1, 2, 3]) bands.push({ name: `+${k}σ`, price: vw.vwap + k * vw.stdev }, { name: `-${k}σ`, price: vw.vwap - k * vw.stdev });
  const pv = pivot(resample(b5.map((x) => ({ t: Number(x.t), o: x.o, h: x.h, l: x.l, c: x.c })), 5), 5);
  const last = b1.slice().sort((a, c) => a.t - c.t)[b1.length - 1];
  const px = Number(last?.c) || 0, age = Date.now() / 1000 - Number(last?.t || 0);
  if (!(px > 0) || !pv || age > 180) return null;
  return { px, pink: pv.pp, bands, b1: b1.slice().sort((a, c) => a.t - c.t) };
}
export async function chartTwinsTick(assets: Record<string, any> | null | undefined) {
  if (G.__ctBusy || (G.__ctAt && Date.now() - G.__ctAt < 5000)) return;
  G.__ctBusy = true; G.__ctAt = Date.now();
  try {
    const st = load();
    // settle finished windows
    for (const r of st.rows.filter((x) => x.result === "open" && Date.parse(x.closes) < Date.now() - 20000)) {
      const m = await fetchMarket(r.ticker).catch(() => null);
      const res = String((m as any)?.result || "");
      if (res === "yes" || res === "no") { const won = (r.side === "up") === (res === "yes"); r.result = won ? "win" : "loss"; r.pnl = Math.round((won ? (Number(r.stake) || STAKE) * (1 / r.ask - 1) : -(Number(r.stake) || STAKE)) * 100) / 100; r.settled = res; try { appendFileSync(D("chart-twins.jsonl"), JSON.stringify({ at: new Date().toISOString(), settle: r.id, result: r.result, pnl: r.pnl }) + "\n"); } catch {} }
    }
    for (const t of TWINS) {
      const mk = assets?.[t.asset]?.market;
      if (!mk?.ticker || !mk.closeTime || Date.parse(mk.closeTime) - Date.now() < 15000) continue;
      const id = `${mk.ticker}:${t.id}`;
      if (st.rows.some((r) => r.id === id)) continue;
      const c = await readChart(t.sym).catch(() => null);
      const DG = (G.__ctDiag ||= {});
      if (!c) { DG[t.id] = { at: new Date().toISOString(), read: "no chart data" }; continue; }
      const above = c.bands.filter((b) => b.price > c.px).sort((a, b) => a.price - b.price)[0], below = c.bands.filter((b) => b.price < c.px).sort((a, b) => b.price - a.price)[0];
      if (!above || !below) { DG[t.id] = { at: new Date().toISOString(), px: c.px, read: "outside the session bands" }; continue; }
      const frac = (c.px - below.price) / (above.price - below.price);
      DG[t.id] = { at: new Date().toISOString(), px: Math.round(c.px * 100) / 100, pink: Math.round(c.pink * 100) / 100, channel: `${below.name} ${below.price.toFixed(2)} - ${above.name} ${above.price.toFixed(2)}`, pct: Math.round(frac * 100) };
      let side: "up" | "down" | null = null, why = "";
      if (frac <= ZONE && c.px > c.pink) { side = "up"; why = `bottom ${Math.round(frac * 100)}% of the channel (${below.name} ${below.price.toFixed(2)} - ${above.name} ${above.price.toFixed(2)}), above the pink ${c.pink.toFixed(2)}`; }
      else if (frac >= 1 - ZONE && c.px < c.pink) { side = "down"; why = `top ${Math.round(frac * 100)}% of the channel (${below.name} ${below.price.toFixed(2)} - ${above.name} ${above.price.toFixed(2)}), below the pink ${c.pink.toFixed(2)}`; }
      if (!side) continue;
      const ask = Number(side === "up" ? mk.yesAsk : mk.noAsk);
      if (!(ask > 0.02 && ask < 0.98)) continue;
      const row = { id, twin: t.id, chart: t.chart, asset: t.asset, ticker: mk.ticker, closes: mk.closeTime, at: new Date().toISOString(), side, price: Math.round(c.px * 100) / 100, pink: Math.round(c.pink * 100) / 100, frac: Math.round(frac * 100) / 100, why, ask, multiple: Math.round((1 / ask) * 100) / 100, stake: STAKE, result: "open", pnl: null };
      st.rows.push(row);
      try { appendFileSync(D("chart-twins.jsonl"), JSON.stringify(row) + "\n"); } catch {}
    }
    for (const t of REJ) { try {
      const mk = assets?.[t.asset]?.market;
      if (!mk?.ticker || !mk.closeTime || Date.parse(mk.closeTime) - Date.now() < 15000) continue;
      const id = `${mk.ticker}:${t.id}`;
      if (st.rows.some((r) => r.id === id)) continue;
      const c = await readChart(t.sym).catch(() => null);
      if (!c) continue;
      const nowS = Date.now() / 1000, fin = (c.b1 as any[]).filter((x) => Number(x.t) + 60 <= nowS + 1), lb = fin[fin.length - 1];
      if (!lb || nowS - (Number(lb.t) + 60) > 50) continue;
      const lo = Number(lb.l), hi = Number(lb.h), op = Number(lb.o), cl = Number(lb.c);
      let side: "up" | "down" | null = null, why = "";
      for (const L of [...c.bands, { name: "pink", price: c.pink }]) {
        const p = Number(L.price); if (!(p > 0)) continue;
        if (lo <= p + 3 && cl >= p + 10 && cl > op) { side = "up"; why = `1m rejected up off ${L.name} ${p.toFixed(2)} (low ${lo.toFixed(2)}, close ${cl.toFixed(2)})`; break; }
        if (hi >= p - 3 && cl <= p - 10 && cl < op) { side = "down"; why = `1m rejected down off ${L.name} ${p.toFixed(2)} (high ${hi.toFixed(2)}, close ${cl.toFixed(2)})`; break; }
      }
      if (!side) continue;
      const above = c.bands.filter((b) => b.price > c.px).sort((a, b) => a.price - b.price)[0], below = c.bands.filter((b) => b.price < c.px).sort((a, b) => b.price - a.price)[0];
      if (above && below) { const frac = (c.px - below.price) / (above.price - below.price); if ((side === "up" && frac >= 0.67) || (side === "down" && frac <= 0.33)) continue; }
      const ask = Number(side === "up" ? mk.yesAsk : mk.noAsk);
      if (!(ask > 0.02 && ask < 0.98)) continue;
      const row = { id, twin: t.id, chart: t.chart, asset: t.asset, ticker: mk.ticker, closes: mk.closeTime, at: new Date().toISOString(), side, price: Math.round(c.px * 100) / 100, pink: Math.round(c.pink * 100) / 100, why, ask, multiple: Math.round((1 / ask) * 100) / 100, stake: RSTAKE, result: "open", pnl: null };
      st.rows.push(row);
      try { appendFileSync(D("chart-twins.jsonl"), JSON.stringify(row) + "\n"); } catch {}
    } catch {} }
    save(st);
  } catch {} finally { G.__ctBusy = false; }
}
