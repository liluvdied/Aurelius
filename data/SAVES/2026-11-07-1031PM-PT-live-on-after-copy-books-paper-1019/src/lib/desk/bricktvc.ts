// BRICK · TVC GOLD (Claude, Oct 6 ~12:05 AM PT, Love: "yooou knowww i do... lets see how that does overnight").
// The feed lab (Oct 5): TVC:GOLD's bands get respected 61.9% of touches vs OANDA's 52.3% (the desk's gold feed), and the
// bounce runs $1.50+ 92% vs 85%. This is BRICK's gold logic exactly, with every line (session VWAP + sigma bands, 5m/10m/15m
// purple) and the 5-minute candles read from TVC:GOLD instead of OANDA. Same Kalshi market, strike and asks. Paper only,
// its own book "brickt" (card: BRICK · TVC GOLD), never sent to Kalshi. Side-by-side with BRICK's gold for a few days.
import { chartRaw } from "./tv";
import { computeNav } from "./nav";
import { dnaCheck } from "./dna";
import { twinConsider } from "./nightbook";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
const g = globalThis as unknown as { __tvcAt?: number; __tvcBars?: Bar[]; __tvc1?: Bar[]; __tvcBusy?: boolean };
const SYM = "TVC:GOLD";

function agg(bars: Bar[], secs: number): Bar[] {
  const out = new Map<number, Bar>();
  for (const b of bars) {
    const k = Math.floor(b.t / secs) * secs;
    const cur = out.get(k);
    if (!cur) out.set(k, { ...b, t: k });
    else out.set(k, { t: k, o: cur.o, h: Math.max(cur.h, b.h), l: Math.min(cur.l, b.l), c: b.c, v: (cur.v || 0) + (b.v || 0) });
  }
  return [...out.values()].sort((a, b) => a.t - b.t);
}
function sessStart(tSec: number) {
  const d = new Date(tSec * 1000);
  const s = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 21, 0, 0) / 1000; // 17:00 ET (EDT)
  return tSec >= s ? s : s - 86400;
}

export async function brickTvcTick(assets: any) {
  const a = assets?.gold;
  const m = a?.market;
  if (!a || !m?.ticker || g.__tvcBusy) return;
  g.__tvcBusy = true;
  try {
    if (!g.__tvcAt || Date.now() - g.__tvcAt > 15000) {
      g.__tvcAt = Date.now();
      const b5 = ((await chartRaw(SYM, "5", 320).catch(() => [])) as Bar[]).sort((x, y) => x.t - y.t);
      const b1 = ((await chartRaw(SYM, "1", 5).catch(() => [])) as Bar[]).sort((x, y) => x.t - y.t);
      if (b5.length > 40) g.__tvcBars = b5;
      if (b1.length >= 3) g.__tvc1 = b1;
    }
    const bars = g.__tvcBars;
    const one = g.__tvc1;
    if (!bars || bars.length < 40 || !one) return;
    // the last 5m bar is still forming: closed = all but the last
    const closed = bars.slice(0, -1);
    const bar = closed[closed.length - 1];
    const prev = closed[closed.length - 2]?.c;
    const c1 = one[one.length - 2]?.c;
    if (!bar || !(bar.c > 0) || !(c1 > 0)) return;
    if (Date.now() / 1000 - (bar.t + 300) > 600) return; // gold market closed / stale feed
    const s0 = sessStart(bar.t);
    let pv = 0, vv = 0, sq = 0;
    for (const b of bars) {
      if (b.t < s0) continue;
      const tp = (b.h + b.l + b.c) / 3;
      const v = b.v || 0;
      pv += tp * v; vv += v; sq += v * tp * tp;
    }
    if (!(vv > 0)) return;
    const vw = pv / vv;
    const sd = Math.sqrt(Math.max(sq / vv - vw * vw, 0));
    const m5 = computeNav(bars.slice(-40));
    const m10 = computeNav(agg(bars, 600).slice(-40));
    const m15 = computeNav(agg(bars, 900).slice(-40));
    if (!m5 || !m10 || !m15 || !(sd > 0)) return;
    try {
      writeFileSync(join(process.cwd(), "data", "bricktvc-now.json"), JSON.stringify({ at: new Date().toISOString(), bar, c1, vw, sd, m5, m10, m15 }));
    } catch {
    }
    const lines: { name: string; kind: string; price: number; rank: number }[] = [];
    for (let k = -6; k <= 6; k += 1) lines.push({ name: k === 0 ? "session VWAP" : `${k > 0 ? "+" : ""}${k / 2}σ`, kind: "session", price: vw + (k / 2) * sd, rank: k === 0 ? 3 : 1 });
    for (const [f, lab, rank] of [[m5, "5m", 4], [m10, "10m", 5], [m15, "15m", 6]] as const) lines.push({ name: `${lab} purple`, kind: "purple", price: f.c, rank });
    const sig: { side: "up" | "down"; label: string; kind: string; rank: number }[] = [];
    for (const l of lines) {
      const L = l.price;
      if (bar.l < L && bar.c > L && bar.o >= L) sig.push({ side: "up", label: `BRICK·TVC rejection up off the ${l.name}`, kind: l.kind, rank: l.rank });
      else if (bar.h > L && bar.c < L && bar.o <= L) sig.push({ side: "down", label: `BRICK·TVC rejection down off the ${l.name}`, kind: l.kind, rank: l.rank });
      else if (prev != null && prev < L && bar.c > L && c1 > L) sig.push({ side: "up", label: `BRICK·TVC 5m close above the ${l.name}`, kind: l.kind, rank: l.rank });
      else if (prev != null && prev > L && bar.c < L && c1 < L) sig.push({ side: "down", label: `BRICK·TVC 5m close below the ${l.name}`, kind: l.kind, rank: l.rank });
    }
    if (!sig.length) return;
    sig.sort((x, y) => y.rank - x.rank);
    let s = sig[0];
    if (new Set(sig.map((x) => x.side)).size > 1) {
      const rest = sig.filter((x) => x.kind !== "purple");
      const brk = rest.filter((x) => /close (above|below)/.test(x.label));
      if (new Set(rest.map((x) => x.side)).size === 1 && brk.length) s = { ...brk[0], label: `${brk[0].label} (left the purple chop)` };
      else return;
    }
    if (!(Number(a.secondsLeft) > 120)) return;
    const target = Number(a.target) || 0;
    if (!(target > 0)) return;
    const spot = c1;
    const mustCross = s.side === "up" ? target > spot : target < spot;
    if (mustCross && lines.some((l) => l.price > Math.min(spot, target) && l.price < Math.max(spot, target))) return;
    const bands = { vwap: vw, sd, spot, nav: { m5, m10, m15, close1m: c1, live1m: null } };
    if (dnaCheck("gold", s.side, spot, target, bands as any, "chan")) return;
    const ask = s.side === "up" ? Number(m.yesAsk) : Number(m.noAsk);
    if (!(ask > 0.02 && ask < 0.98)) return;
    const mult = 1 / ask;
    if (mult < 1.38 || mult > 2.5) return;
    twinConsider("brickt", { ticker: m.ticker, side: s.side, ask, label: s.label }, "gold", { ...bands, feed: SYM });
  } catch {
  } finally {
    g.__tvcBusy = false;
  }
}
