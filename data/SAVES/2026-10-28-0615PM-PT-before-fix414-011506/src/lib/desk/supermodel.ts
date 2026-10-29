// SUPERMODEL ✨ (Claude, Oct 13 ~1:20 AM PT, Love: "is there any way she could check the charts on these for the combos to make
// sure they're on the right side of the bands for our trades too? ... loop in our model on this? place the positions she would
// on each leg of the combo as if she were trading each instrument individually ... a toggle on that to all the books ...
// SuperModel, that's her name"). PAPER twins of every combo lane.
// Each leg is read on its own TradingView 1m chart with her pivot bands (2/5/10/15m CM pivots, the same decide() her pivot
// books use). The window's target is taken on that chart itself (its price when the window opened, as the metals lanes do),
// so a feed sitting a little off Kalshi's index can't flip a leg. A leg is VETOED when:
//  - her model would trade the OTHER side right now (a close through a band or "on" a band, wall and centre rules applied), or
//  - price is on the wrong side of both the 5m and the 15m pivot centre (under both for a YES leg, over both for a NO leg).
// No chart for a leg (sports, or a symbol TradingView doesn't carry) = no veto, marked "no read".
// The twin takes the combo exactly as built when every leg passes, and skips it when any leg is vetoed (Love, Oct 13).
// smLegAt (Oct 13 ~1:40 AM PT, Love: "could you see what her opinion was on the two that lost... replicate the scenario"):
// the same read as of any past moment, using only the bars that had closed by then.
import { chartRaw } from "./tv";
import { decide, lines, resample } from "./pivotbooks";

type Bar = { t: number; o: number; h: number; l: number; c: number };
export const SM_TV: Record<string, string> = {
  KXBTC15M: "PEPPERSTONE:BTCUSD", KXETH15M: "COINBASE:ETHUSD", KXSOL15M: "COINBASE:SOLUSD", KXXRP15M: "COINBASE:XRPUSD",
  KXDOGE15M: "COINBASE:DOGEUSD", KXBNB15M: "BINANCE:BNBUSDT", KXHYPE15M: "BYBIT:HYPEUSDT", KXZEC15M: "COINBASE:ZECUSD",
  KXNEAR15M: "COINBASE:NEARUSD", KXGOLD15M: "TVC:GOLD", KXSILVER15M: "TVC:SILVER", KXCOPPER15M: "OANDA:XCUUSD",
  KXWTI15M: "TVC:USOIL", KXNATGAS15M: "OANDA:NATGASUSD",
};
const g = globalThis as unknown as { __smBars?: Record<string, { at: number; bars: Bar[] }> };

async function bars(sym: string, count = 600, maxAgeMs = 45000): Promise<Bar[]> {
  const c = (g.__smBars ||= {});
  const key = `${sym}|${count}`;
  if (c[key] && Date.now() - c[key].at < maxAgeMs) return c[key].bars;
  const b = (await Promise.race([chartRaw(sym, "1", count), new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 20000))])) as unknown as Bar[];
  b.sort((x, y) => x.t - y.t);
  if (b.length) c[key] = { at: Date.now(), bars: b };
  return c[key]?.bars ?? [];
}
// her pivot (same math as pivotbooks.pivot), but "closed" is judged at nowSec instead of the wall clock
function pivotAt(bs: Bar[], mins: number, nowSec: number) {
  const closed = bs.filter((x) => x.t + mins * 60 <= nowSec + 1);
  if (closed.length < 10) return null;
  const k = 2 / 8;
  let ema = 0;
  const rng: number[] = [];
  closed.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * k + ema * (1 - k); rng.push(x.h - x.l); });
  const a = rng.slice(-7).reduce((s, v) => s + v, 0) / 7;
  return { pp: ema, r1: ema + a, s1: ema - a, r2: ema + 2 * a, s2: ema - 2 * a, a };
}

export type SmLeg = { ok: boolean | null; why: string };
function read(all: Bar[], side: string, windowEndIso: string, nowSec: number): SmLeg {
  const b = all.filter((x) => x.t + 60 <= nowSec + 1);
  if (b.length < 60) return { ok: null, why: "no read (too few bars)" };
  const start = Date.parse(windowEndIso) / 1000 - 900;
  const open = b.find((x) => x.t >= start);
  if (!open) return { ok: null, why: "no read (window not on chart)" };
  const spot = b[b.length - 1].c, target = open.o;
  const last1m = b[b.length - 1];
  const L: any[] = [];
  const pp: Record<number, number> = {};
  for (const tf of [2, 5, 10, 15]) {
    const p = pivotAt(resample(b, tf), tf, nowSec);
    if (p) { L.push(...lines(p as any, tf)); pp[tf] = p.pp; }
  }
  if (!L.length) return { ok: null, why: "no read (no pivots)" };
  const want = side === "yes" ? "up" : "down";
  const d = decide(L as any, { spot, target }, last1m as any);
  if (d && d.side !== want) return { ok: false, why: `model says ${d.side} (${d.label})` };
  if (pp[5] && pp[15]) {
    if (want === "up" && pp[5] > spot && pp[15] > spot) return { ok: false, why: "under the 5m + 15m pivots" };
    if (want === "down" && pp[5] < spot && pp[15] < spot) return { ok: false, why: "over the 5m + 15m pivots" };
  }
  return { ok: true, why: d ? `model agrees (${d.label})` : "right side of the pivots" };
}

export async function smLeg(series: string, side: string, windowEndIso: string): Promise<SmLeg> {
  const sym = SM_TV[series];
  if (!sym) return { ok: null, why: "no read (no chart)" };
  let b: Bar[] = [];
  try { b = await bars(sym); } catch { return { ok: null, why: "no read (chart timeout)" }; }
  return read(b, side, windowEndIso, Date.now() / 1000);
}

// as of a past moment (replays): one long pull per symbol, cached 10 minutes
export async function smLegAt(series: string, side: string, windowEndIso: string, asOfMs: number): Promise<SmLeg> {
  const sym = SM_TV[series];
  if (!sym) return { ok: null, why: "no read (no chart)" };
  let b: Bar[] = [];
  try { b = await bars(sym, 3000, 600000); } catch { return { ok: null, why: "no read (chart timeout)" }; }
  if (!b.length || b[0].t > asOfMs / 1000 - 3600) return { ok: null, why: "no read (history too short)" };
  return read(b, side, windowEndIso, asOfMs / 1000);
}
