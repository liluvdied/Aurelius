// CLIMATE LADDER (Claude, Oct 10 ~3 PM PT, Love: "yesss absolutely hun!! do it at $100"). PAPER ONLY.
// The Mazda15 idea, made disciplined: on each city's "highest temperature today" market, buy a LADDER of adjacent buckets
// sized so every bucket pays the same (the most likely bucket gets the biggest stake, the outer ones less), but ONLY when
// the ladder is cheap versus our own odds.
//   Our odds: final high H = max(what the station has already read today, X), X ~ Normal(NWS hourly forecast max for the
//   rest of the climate day, sigma). sigma shrinks through the day (2.5F in the morning -> 0.6F after the peak).
//   Ladder: the best 1-4 adjacent buckets around the most likely one. Book it when (our odds of the ladder) minus (its
//   cost per $1 of payout) minus fees is 8+ points, and it pays 1.2x+ (cost <= 83c per $1 of payout).
//   $100 per ladder, one ladder per city per day, booked 9 AM - 3 PM local. Settled from Kalshi's own results.
// Every booked ladder also stores our forecast, so misses become lessons (forecast error per city) for calibration.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { climateDayStart, eventDate, kget, localDate, nget, stationObs, stationOf } from "./scanner";

const STAKE = 100;
const EDGE = 0.08;
const FILE = () => join(process.cwd(), "data", "ladder-paper.json");
const STATUS = () => join(process.cwd(), "data", "ladder-status.json");
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (s: unknown) => { const n = Number.parseFloat(String(s ?? "")); return Number.isFinite(n) ? n : NaN; };
const g = globalThis as unknown as { __ladAt?: number; __ladBusy?: boolean; __ladPts?: Record<string, { at: number; url: string }>; __ladFc?: Record<string, { at: number; v: { t: number; f: number }[] }> };
type Leg = { ticker: string; label: string; ask: number; p: number; contracts: number; cost: number; fee: number; result?: "yes" | "no" | null };
export type Ladder = { id: string; at: string; series: string; city: string; station: string; event: string; mu: number; sigma: number; maxSoFar: number; pLadder: number; costPer1: number; edge: number; payout: number; stake: number; fee: number; legs: Leg[]; result: "open" | "win" | "loss" | "void"; pnl: number | null; finalHigh?: number | null; settledAt?: string };

function read(): Ladder[] { try { return existsSync(FILE()) ? JSON.parse(readFileSync(FILE(), "utf8")) : []; } catch { return []; } }
function write(rows: Ladder[]) { writeFileSync(FILE(), JSON.stringify(rows.slice(0, 2000), null, 1)); }
// standard normal CDF
function Phi(z: number) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const d = 0.3989423 * Math.exp(-z * z / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
function cdfH(x: number, M: number, mu: number, s: number) { return x < M ? 0 : Phi((x - mu) / s); }
const fee1 = (ask: number, c: number) => Math.ceil(0.07 * c * ask * (1 - ask) * 100) / 100;

async function hourlyForecast(station: string): Promise<{ t: number; f: number }[]> {
  const pts = (g.__ladPts ||= {});
  const fc = (g.__ladFc ||= {});
  if (fc[station] && Date.now() - fc[station].at < 30 * 60000) return fc[station].v;
  if (!pts[station]) {
    const meta = await nget(`/stations/${station}`);
    const [lon, lat] = meta?.geometry?.coordinates || [];
    const p = await nget(`/points/${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`);
    pts[station] = { at: Date.now(), url: String(p?.properties?.forecastHourly || "") };
  }
  const url = pts[station].url;
  if (!url) return [];
  const res = await fetch(url, { headers: { "User-Agent": "Aurelius desk ladder (personal research)", Accept: "application/geo+json" }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) return [];
  const j = await res.json();
  const v = (j?.properties?.periods || []).map((x: any) => ({ t: Date.parse(x.startTime), f: x.temperatureUnit === "C" ? x.temperature * 1.8 + 32 : Number(x.temperature) })).filter((x: any) => Number.isFinite(x.t) && Number.isFinite(x.f));
  fc[station] = { at: Date.now(), v };
  return v;
}

// LESSONS (Oct 10 first run): the official daily high is built from 1-minute data, so it usually lands ABOVE the
// hourly readings the NWS feed gives us (Philly read 75.2F and the market already priced 74-75F at 1c: it knew the high
// was higher). Every settled event now teaches the offset (official high minus our hourly max) per station; until a
// station has 5 lessons we assume +1F and add 0.5F of doubt.
const LESS = () => join(process.cwd(), "data", "ladder-lessons.json");
function lessons(): Record<string, { day: string; metar: number; lo: number; hi: number }[]> { try { return existsSync(LESS()) ? JSON.parse(readFileSync(LESS(), "utf8")) : {}; } catch { return {}; } }
function offsetFor(station: string) {
  const L = (lessons()[station] || []).filter((x) => Number.isFinite(x.metar) && Number.isFinite(x.lo));
  if (L.length < 5) return { off: 1, extra: 0.5, n: L.length };
  const d = L.map((x) => (x.lo + (Number.isFinite(x.hi) ? x.hi : x.lo)) / 2 - x.metar).sort((a, b) => a - b);
  return { off: d[Math.floor(d.length / 2)], extra: 0.2, n: L.length };
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function kgetSlow(path: string) {
  for (let i = 0; i < 3; i++) {
    try { const j = await kget(path); await sleep(1500); return j; } catch (e) { if (!/429/.test(String(e)) || i === 2) throw e; await sleep(4000 * (i + 1)); }
  }
}
export async function ladderTick() {
  if (g.__ladBusy || (g.__ladAt && Date.now() - g.__ladAt < 10 * 60000)) return;
  g.__ladAt = Date.now();
  g.__ladBusy = true;
  const status: any = { at: new Date().toISOString(), cities: [] as any[], errors: [] as string[] };
  try {
    const rows = read();
    // settle
    for (const L of rows.filter((x) => x.result === "open")) {
      try {
        let all = true;
        for (const leg of L.legs) {
          if (leg.result) continue;
          const m = (await kgetSlow(`/trade-api/v2/markets/${leg.ticker}`))?.market;
          const res = String(m?.result || "");
          if (res === "yes" || res === "no") leg.result = res;
          else all = false;
          await new Promise((r) => setTimeout(r, 300));
        }
        if (all) {
          try {
            const ej = await kgetSlow(`/trade-api/v2/markets?event_ticker=${L.event}&limit=60`);
            const win = (ej?.markets ?? []).find((m: any) => m.result === "yes");
            if (win) {
              const data = await stationObs(L.station);
              const day = eventDate(L.event) || "";
              const st0 = data ? climateDayStart(data.tz, day) : 0;
              const obs = data ? data.obs.filter((o) => o.t >= st0 && o.t < st0 + 86400000) : [];
              const all2 = lessons();
              (all2[L.station] ||= []).push({ day, metar: obs.length ? Math.max(...obs.map((o) => o.f)) : NaN, lo: num(win.floor_strike), hi: num(win.cap_strike) });
              all2[L.station] = all2[L.station].slice(-60);
              writeFileSync(LESS(), JSON.stringify(all2, null, 1));
              L.finalHigh = Number.isFinite(num(win.floor_strike)) ? num(win.floor_strike) : num(win.cap_strike);
            }
          } catch {}
          const wins = L.legs.filter((l) => l.result === "yes").length;
          L.pnl = r2(wins * L.payout - L.stake - L.fee);
          L.result = wins ? "win" : "loss";
          L.settledAt = new Date().toISOString();
        }
      } catch (e) {
        status.errors.push(String(e).slice(0, 120));
      }
    }
    // scan: today's daily-high series
    let series: string[] = [];
    try {
      const j = await kgetSlow(`/trade-api/v2/series?category=${encodeURIComponent("Climate and Weather")}`);
      series = (j?.series ?? []).map((x: any) => String(x.ticker || "")).filter((t: string) => /^KXHIGH[A-Z]+$/.test(t) && !/^KXHIGHT/.test(t));
    } catch (e) {
      status.errors.push("series: " + String(e).slice(0, 100));
    }
    for (const sr of series.slice(0, 25)) {
      try {
        const j = await kgetSlow(`/trade-api/v2/markets?series_ticker=${sr}&status=open&limit=100`);
        const ms: any[] = j?.markets ?? [];
        if (!ms.length) continue;
        const station = stationOf(ms[0], sr);
        if (!station) continue;
        const data = await stationObs(station);
        if (!data) continue;
        const today = localDate(data.tz);
        // learn from yesterday's settled high for every city we watch (not just ones we bought), once a day
        try {
          const yd = localDate(data.tz, new Date(Date.now() - 86400000));
          const have = (lessons()[station] || []).some((x) => x.day === yd);
          if (!have) {
            const MONS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
            const [yy, mm, dd] = yd.split("-");
            const evY = `${sr}-${yy.slice(2)}${MONS[Number(mm) - 1]}${dd}`;
            const ej = await kgetSlow(`/trade-api/v2/markets?event_ticker=${evY}&limit=60`);
            const win = (ej?.markets ?? []).find((m: any) => m.result === "yes");
            if (win) {
              const st0 = climateDayStart(data.tz, yd);
              const obs = data.obs.filter((o) => o.t >= st0 && o.t < st0 + 86400000);
              if (obs.length >= 6) {
                const all2 = lessons();
                (all2[station] ||= []).push({ day: yd, metar: Math.max(...obs.map((o) => o.f)), lo: num(win.floor_strike), hi: num(win.cap_strike) });
                all2[station] = all2[station].slice(-60);
                writeFileSync(LESS(), JSON.stringify(all2, null, 1));
              }
            }
          }
        } catch {}
        const mine = ms.filter((m) => eventDate(m.event_ticker) === today);
        if (mine.length < 3) continue;
        const ev = String(mine[0].event_ticker);
        const hourLocal = Number(new Intl.DateTimeFormat("en-US", { timeZone: data.tz, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
        const start = climateDayStart(data.tz, today);
        const sofar = data.obs.filter((o) => o.t >= start);
        const M = sofar.length ? Math.max(...sofar.map((o) => o.f)) : -999;
        const fc = await hourlyForecast(station);
        const end = start + 24 * 3600 * 1000;
        const rest = fc.filter((x) => x.t >= Date.now() - 3600 * 1000 && x.t < end).map((x) => x.f);
        const fcMax = rest.length ? Math.max(...rest) : NaN;
        const ofs = offsetFor(station);
        const Mx = M + ofs.off; // the official high is usually above our hourly max
        const mu = Math.max(Number.isFinite(fcMax) ? fcMax + ofs.off : Mx, Mx);
        const hrsToPeak = Math.max(0, 16 - hourLocal);
        const sigma = Math.max(0.6, Math.min(2.5, 0.6 + 0.3 * hrsToPeak)) + ofs.extra;
        const legs = mine.map((m) => {
          const lo = num(m.floor_strike), hi = num(m.cap_strike), type = String(m.strike_type || "");
          let p = NaN;
          if (type === "between") p = cdfH(hi + 0.5, Mx - 0.5, mu, sigma) - cdfH(lo - 0.5, Mx - 0.5, mu, sigma);
          else if (/greater/.test(type)) p = 1 - cdfH(lo + 0.5, Mx - 0.5, mu, sigma);
          else if (/less/.test(type)) p = cdfH(hi - 0.5, Mx - 0.5, mu, sigma);
          return { ticker: String(m.ticker), label: String(m.yes_sub_title || m.subtitle || m.ticker), ask: num(m.yes_ask_dollars), p, lo: Number.isFinite(lo) ? lo : -999 };
        }).filter((x) => Number.isFinite(x.p) && x.ask > 0 && x.ask < 1).sort((a, b) => a.lo - b.lo);
        // best adjacent window of 1-4 buckets
        let best: any = null;
        for (let i = 0; i < legs.length; i++) for (let k = 1; k <= 4 && i + k <= legs.length; k++) {
          const w = legs.slice(i, i + k);
          const cost = w.reduce((a, x) => a + x.ask, 0);
          const p = w.reduce((a, x) => a + x.p, 0);
          if (cost > 0.83 || w.some((x) => x.ask < 0.01)) continue;
          // the market knows things we don't (1-minute data, the settlement station's own feed): if we disagree with any
          // leg by 40+ points, the model is the likelier one to be wrong, so no ladder.
          if (w.some((x) => Math.abs(x.p - x.ask) > 0.4)) continue;
          const X = STAKE / cost;
          const fee = w.reduce((a, x) => a + fee1(x.ask, X), 0) / X;
          const edge = p - cost - fee;
          if (!best || edge > best.edge) best = { w, cost, p, edge, X, fee };
        }
        const city = sr.replace(/^KXHIGH/, "");
        status.cities.push({ city, station, hourLocal, offset: ofs.off, lessons: ofs.n, maxSoFar: Math.round(M * 10) / 10, mu: Math.round(mu * 10) / 10, sigma, best: best ? { buckets: best.w.map((x: any) => x.label), cost: r2(best.cost), p: r2(best.p), edge: r2(best.edge) } : null });
        const already = rows.some((L) => L.event === ev);
        if (!best || already || best.edge < EDGE || hourLocal < 9 || hourLocal >= 15) continue;
        const X = r2(STAKE / best.cost);
        const L: Ladder = { id: `${ev}:ladder`, at: new Date().toISOString(), series: sr, city, station, event: ev, mu: r2(mu), sigma, maxSoFar: r2(M), pLadder: r2(best.p), costPer1: r2(best.cost), edge: r2(best.edge), payout: X, stake: STAKE, fee: 0, legs: best.w.map((x: any) => ({ ticker: x.ticker, label: x.label, ask: r2(x.ask), p: r2(x.p), contracts: X, cost: r2(X * x.ask), fee: fee1(x.ask, X), result: null })), result: "open", pnl: null };
        L.fee = r2(L.legs.reduce((a, l) => a + l.fee, 0));
        rows.unshift(L);
        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        status.errors.push(`${sr}: ${String(e).slice(0, 100)}`);
      }
    }
    write(rows);
    const done = rows.filter((r) => r.result === "win" || r.result === "loss");
    status.book = { n: done.length, w: done.filter((r) => r.result === "win").length, pnl: r2(done.reduce((a, r) => a + (r.pnl || 0), 0)), open: rows.filter((r) => r.result === "open").length };
    writeFileSync(STATUS(), JSON.stringify(status, null, 1));
  } catch (e) {
    try { writeFileSync(STATUS(), JSON.stringify({ ...status, fatal: String(e) }, null, 1)); } catch {}
  } finally {
    g.__ladBusy = false;
  }
}
export function ladder() {
  const rows = read();
  let status: any = {};
  try { status = JSON.parse(readFileSync(STATUS(), "utf8")); } catch {}
  return { rows: rows.slice(0, 40), status };
}
