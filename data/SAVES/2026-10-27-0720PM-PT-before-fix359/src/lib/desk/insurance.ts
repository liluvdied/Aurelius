// INSURANCE (Love, Oct 3 ~10:40 PM PT: "only on trades that have proven themselves... if it just rips down outta
// nowhere we didn't lose anything, maybe made something"). Once a trade is up +40% and the other side costs 12-25c
// (4-8x), a separate $5 ticket goes on the other side (Polymarket) and is held to the bell. The trade itself is untouched. Replayed on the real Kalshi bid path (data/bid-paths.json). Read only.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NightRow } from "./nightbook";

type Path = [number, number, number, number][];
export type Insured = { insPnl: number; insNote: string };

export function insuranceReplay(rows: NightRow[]): Record<string, Insured> {
  let paths: Record<string, Path> = {};
  try {
    paths = JSON.parse(readFileSync(join(process.cwd(), "data", "bid-paths.json"), "utf8"));
  } catch {
    return {};
  }
  const out: Record<string, Insured> = {};
  for (const r of rows) {
    if (r.result === "open" || r.pnl == null || !r.ticker) continue;
    const p = paths[r.ticker];
    const ask = Number(r.ask);
    if (!p?.length || !(ask > 0.02 && ask < 0.99)) continue;
    const up = r.side === "up";
    const won = r.bell === "yes" || r.bell === "no" ? (r.bell === "yes") === up : null;
    const exitPx = r.result === "sold" ? Number(r.sellBid) : won === null ? null : won ? 1 : 0;
    if (exitPx == null || !Number.isFinite(exitPx)) continue;
    const t0 = Date.parse(r.at) / 1000;
    let tEnd = Infinity;
    const soldAt = (r as NightRow & { soldAt?: string }).soldAt;
    if (r.result === "sold") {
      if (soldAt) tEnd = Date.parse(soldAt) / 1000;
      else {
        const hit = p.find((x) => x[0] >= t0 && Math.abs((up ? x[1] : x[2]) - exitPx) <= 0.01);
        if (!hit) continue;
        tEnd = hit[0];
      }
    }
    const contracts = Number(r.stake) / ask;
    for (const x of p) {
      if (x[0] < t0) continue;
      if (x[0] >= tEnd) break;
      const bid = up ? x[1] : x[2];
      if (!(bid > 0)) continue;
      const prof = (bid / ask - 1) * 100;
      const other = Math.min(0.99, 1 - bid + 0.01);
      if (prof < 40 || other < 0.125 || other > 0.25) continue;
      // Love, Oct 3 ~11 PM PT: a SEPARATE $5 ticket on the other side (Polymarket), held to the bell; the trade is untouched.
      if (won === null) break;
      const effect = won ? -5 : 5 * (1 / other - 1);
      const pnl = Math.round(((r.pnl ?? 0) + effect) * 100) / 100;
      out[r.id] = { insPnl: pnl, insNote: `INSURANCE at +${Math.round(prof)}%: $5 on the other side at ${Math.round(other * 100)}c, held to the bell · ${effect >= 0 ? "+" : "−"}$${Math.abs(effect).toFixed(2)}` };
      break;
    }
  }
  return out;
}
