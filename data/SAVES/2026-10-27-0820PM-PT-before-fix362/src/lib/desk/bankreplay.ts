// BANK REPLAY (Claude, 2026-10-02, Love: "a toggle so I can see what those settings would have done on
// every trade"). Read only. Re-runs every paper trade on the night ledger with BANK's exits, on the
// real Kalshi bid path (data/bid-paths.json, every ~10 s) and her lines minute by minute
// (data/nav-tape.json):
//   • take profit +50% under 1.65x / 75% of the max, riding with a 1% trail;
//   • trailing gate: armed at +30%, sells when the bid falls 5% below the highest bid;
//   • band tap: a minute that touches one of her lines in the trade's direction and closes back =
//     rejection, banked if in profit; closes through = holds;
//   • otherwise Kalshi's own result at the bell. Never sells at a loss.
// Trades without a recorded bid path keep their real result (marked "no path").
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NightRow } from "./nightbook";

type Path = [number, number, number, number][]; // [t, yesBid, noBid, spot]
type Tape = { t: number; a: string; c1?: number; vw?: number; sd?: number; m5?: number[] | null; m10?: number[] | null; m15?: number[] | null };
let cache: { at: number; out: Record<string, { pnl: number | null; exit: string }> } | null = null;

function read<T>(name: string, fb: T): T {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", name), "utf8")) as T;
  } catch {
    return fb;
  }
}
function linesOf(asset: string, tp: Tape | undefined): number[] {
  if (!tp) return [];
  const out: number[] = [];
  const vw = Number(tp.vw) || 0;
  const sd = Number(tp.sd) || 0;
  if (vw > 0) out.push(vw);
  if (vw > 0 && sd > 0) for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) out.push(vw + k * sd, vw - k * sd);
  for (const f of [tp.m5, tp.m10, tp.m15]) {
    if (!f || !(f[0] > 0)) continue;
    out.push(f[0]);
    if (asset === "btc" && f.length >= 3) out.push(f[1], f[2]);
  }
  return out;
}
const newTp = (m: number) => {
  const mx = (m - 1) * 100;
  return mx > 0 ? (m < 1.65 ? Math.min(50, mx) : mx * 0.75) : 0;
};

export function bankReplay(rows: NightRow[]): Record<string, { pnl: number | null; exit: string }> {
  if (cache && Date.now() - cache.at < 30000) return cache.out;
  const paths = read<Record<string, Path>>("bid-paths.json", {});
  const tape = read<Tape[]>("nav-tape.json", []);
  const tapeBy: Record<string, Tape[]> = { btc: [], gold: [] };
  for (const x of tape) (tapeBy[x.a] ||= []).push(x);
  for (const k of Object.keys(tapeBy)) tapeBy[k].sort((a, b) => a.t - b.t);
  const tapeAt = (a: string, t: number) => {
    const xs = tapeBy[a] || [];
    let lo = 0;
    let hi = xs.length - 1;
    let best: Tape | undefined;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (xs[mid].t <= t) {
        best = xs[mid];
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return best && t - best.t < 180 ? best : undefined;
  };
  const out: Record<string, { pnl: number | null; exit: string }> = {};
  for (const r of rows) {
    const ask = Number(r.ask);
    if (!(ask > 0 && ask < 1)) continue;
    const t0 = Date.parse(r.at) / 1000;
    const p = (paths[r.ticker] || []).filter((x) => x[0] >= t0 - 2);
    const up = r.side === "up";
    const money = (bid: number) => Math.round(((r.stake / ask) * bid - r.stake) * 100) / 100;
    if (!p.length) {
      out[r.id] = { pnl: r.pnl, exit: "no path: real result kept" };
      continue;
    }
    const tp = newTp(r.multiple);
    const tol = r.asset === "btc" ? 15 : 0.3;
    let peakBid = 0;
    let peakPct = -100;
    let tpPeak: number | null = null;
    let touch: { L: number; minute: number } | null = null;
    let minute = Math.floor(p[0][0] / 60) * 60;
    let mHi = -Infinity;
    let mLo = Infinity;
    let mClose = 0;
    let prevClose = Number(tapeAt(r.asset, p[0][0])?.c1) || p[0][3];
    let done: { pnl: number | null; exit: string } | null = null;
    for (const [t, yb, nb, spot] of p) {
      const bid = up ? yb : nb;
      // minute roll: resolve a band tap on the candle that just closed
      const m = Math.floor(t / 60) * 60;
      if (m !== minute) {
        if (touch && mClose > 0) {
          const broke = up ? mClose > touch.L : mClose < touch.L;
          const lastBid = bid > 0 ? bid : 0;
          const pct0 = lastBid > 0 ? (lastBid / ask - 1) * 100 : -100;
          if (!broke && pct0 > 0) {
            done = { pnl: money(lastBid), exit: `band rejection: banked +${Math.round(pct0)}%` };
            break;
          }
          touch = null;
        }
        if (!touch && mClose > 0) {
          const ls = linesOf(r.asset, tapeAt(r.asset, minute));
          const hit = ls.filter((L) => (up ? L > prevClose && mHi >= L - tol : L < prevClose && mLo <= L + tol)).sort((a, b) => (up ? a - b : b - a))[0];
          if (hit != null) touch = { L: hit, minute };
        }
        if (mClose > 0) prevClose = mClose;
        minute = m;
        mHi = -Infinity;
        mLo = Infinity;
      }
      if (spot > 0) {
        mHi = Math.max(mHi, spot);
        mLo = Math.min(mLo, spot);
        mClose = spot;
      }
      if (!(bid > 0)) continue;
      const pct = (bid / ask - 1) * 100;
      peakBid = Math.max(peakBid, bid);
      peakPct = Math.max(peakPct, pct);
      // take profit with a 1% trail
      if (tp > 0 && (pct >= tp || tpPeak != null)) {
        tpPeak = Math.max(tpPeak ?? pct, pct);
        if (bid >= 0.97 || pct < Math.max(tp, Math.floor(tpPeak) - 1)) {
          done = { pnl: money(bid), exit: `take profit: peaked +${Math.round(tpPeak)}%` };
          break;
        }
      }
      // trailing gate
      if (peakPct >= 30 && pct > 0 && bid <= peakBid * 0.95) {
        done = { pnl: money(bid), exit: `trailing gate: peaked +${Math.round((peakBid / ask - 1) * 100)}%, banked +${Math.round(pct)}%` };
        break;
      }
    }
    if (!done) {
      const bell = r.bell ?? (r.result === "win" ? (up ? "yes" : "no") : r.result === "loss" ? (up ? "no" : "yes") : null);
      if (bell) {
        const won = up ? bell === "yes" : bell === "no";
        done = { pnl: won ? Math.round((r.stake / ask - r.stake) * 100) / 100 : -r.stake, exit: "held to the bell" };
      } else done = { pnl: null, exit: "open" };
    }
    out[r.id] = done;
  }
  cache = { at: Date.now(), out };
  return out;
}
