// SQUEEZE TWIN (Claude, Oct 4 ~12:15 PM PT, Love: "it was being squeezed between the session bands... is there any way you can
// only have her trade those when one of the lines breaks? if it's being squeezed into a corner like that just have her trade
// whichever side breaks"). Paper only. Copies the live books trade for trade (first live-book row per BTC window), EXCEPT a
// bounce entry made inside a squeeze: then it waits, and trades the side whose line a 1-minute candle closes through.
//   squeeze = the pocket between the line behind and the line in front is under 0.6 of a 5m candle's range (ATR),
//             or 2+ of her lines sit within 0.6 ATR in front.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listNight, squeezeConsider } from "./nightbook";

const LIVE = ["brick", "brickc", "cotc", "trend", "claude", "original"];
type Pend = { ticker: string; front: number; back: number; side: "up" | "down"; label: string };
const g = globalThis as unknown as { __squeezePend?: Record<string, Pend | null> };

function lines(b: any): number[] {
  const out: number[] = [];
  const vw = Number(b?.vwap) || 0;
  const sd = Number(b?.sd) || 0;
  if (vw > 0 && sd > 0) for (const z of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2, -2, 2.5, -2.5, 3, -3]) out.push(vw + z * sd);
  for (const k of ["m5", "m10", "m15"]) {
    const f = b?.nav?.[k];
    if (f) out.push(f.c, f.up, f.dn);
  }
  return out.filter((x) => x > 0);
}
const isBreak = (s: string) => /close (above|below)|left the|break|through/i.test(s);

export function squeezeTick(assets: any) {
  try {
    const a = assets?.btc;
    const m = a?.market;
    if (!m?.ticker || !(a.secondsLeft > 30)) return;
    const pend = g.__squeezePend || (g.__squeezePend = {});
    const rows = listNight();
    const src = rows
      .filter((r) => LIVE.includes(r.book) && !r.dnaMode && r.ticker === m.ticker)
      .sort((x, y) => (x.at < y.at ? -1 : 1))[0];
    if (!src) return;
    if (rows.some((r) => r.book === "squeeze" && r.ticker === m.ticker && !r.dnaMode)) return;
    const b: any = src.bands || {};
    const spot0 = Number(b.spot) || Number(src.spot) || 0;
    const atr = Number(b?.nav?.atr5m) || 50;
    const L = lines(b);
    if (!(pend[m.ticker] === undefined)) {
      // Waiting on a break: a closed 1m candle beyond the front or back line.
      const p = pend[m.ticker];
      if (!p) return;
      let now: any = null;
      try {
        now = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.btc;
      } catch {
        return;
      }
      const c1 = Number(now?.nav?.close1m) || 0;
      if (!(c1 > 0)) return;
      const hi = Math.max(p.front, p.back);
      const lo = Math.min(p.front, p.back);
      const dir: "up" | "down" | null = c1 > hi ? "up" : c1 < lo ? "down" : null;
      if (!dir) return;
      const ask = dir === "up" ? Number(m.yesAsk) : Number(m.noAsk);
      squeezeConsider({ ticker: m.ticker, side: dir, ask, label: `SQUEEZE broke ${dir === "up" ? "up through" : "down through"} ${(dir === "up" ? hi : lo).toFixed(2)} (live books had ${p.side === "up" ? "a long" : "a short"}: ${p.label})` }, "btc", now);
      pend[m.ticker] = null;
      return;
    }
    const up = src.side === "up";
    const front = L.filter((x) => (up ? x > spot0 : x < spot0)).map((x) => Math.abs(x - spot0));
    const back = L.filter((x) => (up ? x <= spot0 : x >= spot0)).map((x) => Math.abs(x - spot0));
    const width = front.length && back.length ? Math.min(...front) + Math.min(...back) : Infinity;
    const roof = front.filter((d) => d <= atr * 0.6).length;
    const squeezed = spot0 > 0 && (width < atr * 0.6 || roof >= 2);
    if (!squeezed || isBreak(src.setup)) {
      squeezeConsider({ ticker: m.ticker, side: src.side, ask: src.ask, label: `${String(src.book).toUpperCase()} · ${src.setup}${squeezed ? " (squeezed, but a break)" : ""}` }, "btc", b);
      pend[m.ticker] = null;
      return;
    }
    const frontLine = up ? spot0 + Math.min(...front) : spot0 - Math.min(...front);
    const backLine = up ? spot0 - Math.min(...back) : spot0 + Math.min(...back);
    pend[m.ticker] = { ticker: m.ticker, front: frontLine, back: backLine, side: src.side, label: `${String(src.book).toUpperCase()} · ${src.setup}` };
  } catch {
  }
}
