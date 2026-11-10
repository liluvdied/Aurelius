// SILVER HEDGE FOR GOLD (Claude, Oct 5 ~11 PM PT, Love: "if it can soften the losses i dont care about making a profit on it...
// start at $11... if a gold trade closes under a band and is going against us, any silver entry above 1.6x is warranted").
// Backtest (scripts/silver-hedge-lab.py): gold and silver settle the same way 82% of windows; a silver hedge bought once a
// gold trade is down pays on ~83% of the gold trades that go on to lose, at about break-even overall. Insurance, not profit.
// RULE (Oct 11: only once the gold position has been up +armPct): any gold position on Kalshi (the desk's or Love's), the moment a 5-minute candle closes through one of
// her gold lines against it (long: closes below a line it was above; short: closes above a line it was below), with 3+
// minutes left: $11 on the OTHER side of Kalshi's silver 15-minute market for the same window, only at 1.6x or better
// (62c or less). Once per window. Never against Love's own silver position on the other side (Kalshi nets them).
// live-switch "silverHedge": { on, dollars, minMult, minLeftSec }. Log: data/silver-hedge-log.jsonl.
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const g = globalThis as unknown as { __silverHedgeBusy?: number; __silverHedgeDone?: Record<string, number>; __silverHedgeSeen?: Record<string, number> };
function log(x: Record<string, unknown>) {
  try {
    appendFileSync(join(process.cwd(), "data", "silver-hedge-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n");
  } catch {
  }
}

export async function silverHedgeTick(assets: any) {
  if (g.__silverHedgeBusy && Date.now() - g.__silverHedgeBusy < 45000) return;
  g.__silverHedgeBusy = Date.now();
  try {
    let cfg: any = null;
    try {
      cfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
    } catch {
      cfg = null;
    }
    const sh = cfg?.silverHedge;
    if (!sh?.on || cfg?.live !== true) return;
    const m = assets?.gold?.market;
    if (!m?.ticker || !m.closeTime) return;
    const left = Number(assets?.gold?.secondsLeft) || (Date.parse(m.closeTime) - Date.now()) / 1000;
    if (!(left >= (Number(sh.minLeftSec) > 0 ? Number(sh.minLeftSec) : 180))) return;
    const done = (g.__silverHedgeDone ||= {});
    if (done[m.ticker]) return;
    let b: any = null;
    try {
      b = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.gold ?? null;
    } catch {
      b = null;
    }
    const nav = b?.nav;
    const c5 = Number(nav?.close5m) || 0;
    const p5 = Number(nav?.prev5m) || 0;
    const at5 = Number(nav?.close5mAt) || 0;
    if (!(c5 > 0 && p5 > 0 && at5 > 0)) return;
    const live = await import("./kalshi-live.server");
    const held = await live.heldFifteens().catch(() => [] as { ticker: string; pos: number; cost: number }[]);
    const pos = held.find((h) => h.ticker === m.ticker);
    if (!pos) return;
    const side: "up" | "down" = pos.pos > 0 ? "up" : "down";
    const entry = Math.abs(pos.pos) > 0 ? Math.abs(pos.cost) / Math.abs(pos.pos) : 0;
    const bid = side === "up" ? Number(m.yesBid) : Number(m.noBid);
    if (!(entry > 0 && bid > 0)) return;
    // ONLY AFTER GOLD HAS BEEN IN PROFIT (Love, Oct 11 ~5:40 PM PT: "the silver hedge is not firing after gold is in profit.
    // it fires the second it enters gold"). It used to fire on any red gold trade, and a fresh entry reads red at once (the
    // spread), so it bought silver the minute gold went in. Now it ARMS only once the gold position has been up armPct
    // (default +20%) at some point; after that, the 5-minute close back through one of her lines against it fires the hedge,
    // protecting a winner that is turning instead of insuring every entry. live-switch silverHedge.armPct.
    const peaks = ((g as any).__silverHedgePeak ||= {}) as Record<string, number>;
    peaks[m.ticker] = Math.max(peaks[m.ticker] ?? -1, bid / entry - 1);
    const armPct = Number(sh.armPct) > 0 ? Number(sh.armPct) : 20;
    if (!(peaks[m.ticker] * 100 >= armPct)) return;
    // judge each 5-minute close once (after arming)
    const seen = (g.__silverHedgeSeen ||= {});
    if (seen[m.ticker] === at5) return;
    seen[m.ticker] = at5;
    const vw = Number(b?.vwap) || 0;
    const sd = Number(b?.sd) || 0;
    const lines: { name: string; price: number }[] = [];
    if (vw > 0) lines.push({ name: "session VWAP", price: vw });
    if (vw > 0 && sd > 0) for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) lines.push({ name: `+${k}σ`, price: vw + k * sd }, { name: `-${k}σ`, price: vw - k * sd });
    for (const [key, lab] of [["m5", "5m"], ["m10", "10m"], ["m15", "15m"]] as const) if (Number(nav?.[key]?.c) > 0) lines.push({ name: `${lab} purple`, price: Number(nav[key].c) });
    const broke = lines.find((l) => (side === "up" ? p5 >= l.price && c5 < l.price : p5 <= l.price && c5 > l.price));
    if (!broke) return;
    const silver = m.ticker.replace("KXGOLD15M-", "KXSILVER15M-");
    const hside: "up" | "down" = side === "up" ? "down" : "up";
    const theirs = held.find((h) => h.ticker === silver);
    if (theirs && Math.sign(theirs.pos) !== (hside === "up" ? 1 : -1)) {
      done[m.ticker] = Date.now();
      log({ status: "skipped", gold: m.ticker, silver, side: hside, reason: "you hold the other side of silver this window; a hedge would net against it" });
      return;
    }
    const minMult = Number(sh.minMult) > 0 ? Number(sh.minMult) : 1.6;
    const maxAsk = Math.floor((1 / minMult) * 100) / 100;
    const dollars = Number(sh.dollars) > 0 ? Number(sh.dollars) : 11;
    const why = `gold ${side === "up" ? "long" : "short"} was up +${Math.round(peaks[m.ticker] * 100)}%, now ${Math.round((bid / entry - 1) * 100)}%, and a 5m candle closed ${side === "up" ? "under" : "over"} the ${broke.name} (${broke.price.toFixed(2)})`;
    const r = await live.addOnBuy(silver, hside, dollars, maxAsk).catch((err: any) => ({ ok: false, reason: String(err?.message || err).slice(0, 120) }) as any);
    if (r?.ok) {
      done[m.ticker] = Date.now();
      log({ status: "filled", gold: m.ticker, silver, side: hside, why, contracts: r.filled, price: r.px, ask: r.ask, multiple: Math.round((1 / r.ask) * 100) / 100 });
    } else {
      log({ status: "no fill", gold: m.ticker, silver, side: hside, why, reason: r?.reason });
    }
  } catch {
  } finally {
    g.__silverHedgeBusy = 0;
  }
}
