// NAV TAPE (Claude, read only). Once a minute, for BTC and gold: price, the last closed 1m and 5m
// candles, every nav line on 1m / 5m / 10m / 15m (purple + both Bollinger bands), and her session
// VWAP bands. Kept for 4 days in data/nav-tape.json so we can study how price behaves around every
// line on every timeframe, including what happened 5 / 10 / 15 minutes later. Never trades.
import { existsSync, unlinkSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = () => join(process.cwd(), "data", "nav-tape.json");
const g = globalThis as unknown as { __navTapeMinute?: number };
const KEEP = 4 * 24 * 60 * 2;

type AssetLike = {
  spot: number;
  target: number | null;
  secondsLeft: number;
  market: { ticker: string; yesBid: number; noBid: number } | null;
  vwap1m: { vwap: number; stdev: number } | null;
  nav?: Record<string, unknown> | null;
};

const r = (n: unknown, d = 3) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);

export function navTapeTick(assets: Record<string, AssetLike> | null | undefined) {
  // STOP LAB price paths (read only): pulls Kalshi's 1-minute candles for windows her paper books traded.
  void import("./stoplab").then((m) => m.stopLabTick()).catch(() => {});
  // AUTO ROLL: the best paper book of the last 24h rides on Kalshi next to Love's own picks (one AUTO slot).
  void import("./autoroll").then((m) => m.autoRollTick()).catch(() => {});
  // ONE-SHOT HISTORY PULL (Claude, Oct 7): data/pull-history.flag present -> page Kalshi's full fills + settlements into
  // data/kalshi-history.json once (read only, never sends an order), then the flag is removed.
  try {
    const flag = join(process.cwd(), "data", "pull-history.flag");
    const gh = globalThis as unknown as { __histPulling?: boolean };
    if (!gh.__histPulling && existsSync(flag)) {
      gh.__histPulling = true;
      unlinkSync(flag);
      void import("./kalshi-live.server").then((m) => m.kalshiHistory()).catch(() => null).finally(() => {
        gh.__histPulling = false;
      });
    }
  } catch {
  }
  // ONE-SHOT ANCHOR CHECK (Claude, Oct 8): data/anchor-check.flag -> which BTC feed + session start matches Love's chart.
  try {
    const flag2 = join(process.cwd(), "data", "anchor-check.flag");
    if (existsSync(flag2)) {
      unlinkSync(flag2);
      void import("./band-check").then((m) => m.anchorCheck()).catch(() => null);
    }
  } catch {
  }
  // BOOK WATCH (Oct 8): per-book live vs paper status + alerts, refreshed about once a minute even with the tab closed.
  void import("./bookwatch").then((m) => m.bookWatch()).catch(() => {});
  // Oct 9 ~8:50 PM PT: both gold hour maps + BTC tight/wide bands, scored every 5 min (combowatch.ts).
  void import("./combowatch").then((m) => m.comboWatchTick()).catch(() => {});
  // Oct 9 ~10:40 PM PT: one read-only pull of PEPPERSTONE vs VANTAGE BTC 5m history for the session-break lab.
  void import("./labpull").then((m) => m.labPullTick()).catch(() => {});
  // Oct 9 ~11:15 PM PT: self-check guards (record file, feed, settings drift, copier heartbeat).
  void import("./selfcheck").then((m) => m.selfCheckTick()).catch(() => {});
  // Oct 10 ~3 PM PT: CLIMATE LADDER paper book ($100 ladders on daily-high markets).
  void import("./ladder").then((m) => m.ladderTick()).catch(() => {});
  // Oct 10 ~4:45 PM PT: take-profit lab on weather paper trades (+10/25/50/100% vs hold).
  void import("./tplab").then((m) => m.tpLabTick()).catch(() => {});
  // Oct 10 ~5 PM PT: CLIMATE WIDE paper knowledge base (every climate market, favorite side 50-83c, $100).
  void import("./climatewide").then((m) => m.climateWideTick()).catch(() => {});
  void import("./stationaudit").then((m) => m.stationAuditOnce()).catch(() => {});
  void import("./goldstrikes").then((m) => m.goldStrikesOnce()).catch(() => {});
  void import("./pivotpull").then((m) => m.pivotPullTick()).catch(() => {});
  // Oct 10 ~7:20 PM PT: CLOSER, late-game favorites (ESPN live win probability vs Kalshi winner price), $100 paper.
  void import("./closer").then((m) => m.closerTick()).catch(() => {});
  // SCANNER (Oct 8, Love): Kalshi weather markets cross-checked with NWS readings, every 2 minutes, paper only.
  void import("./scanner").then((m) => m.scannerTick()).catch(() => {});
  // POSITIONS (Love, Oct 9): her autosell rules on any Kalshi position + the first-time-green alert.
  void import("./positions").then((m) => m.positionsTick()).catch(() => {});
  // Silver feed lab pull (Oct 9, read only, at most every 6h).
  void import("./silverfeed").then((m) => m.silverFeedOnce()).catch(() => {});
  // SNAPBACK · TVC LINES reads (Oct 9): TVC gold + silver 5m lines for the snpt paper book.
  void import("./snaplines").then((m) => m.snapLinesTick()).catch(() => {});
  // BRICK 1:1 · REAL paper twin (Oct 9): real order-book fills and fees.
  void import("./realtwin").then((m) => m.realTwinTick()).catch(() => {});
  // Mentions lab (Oct 9, read only): Kalshi's settled "what will X say" history for base rates.
  void import("./mentionlab").then((m) => m.mentionLabOnce()).catch(() => {});
  // MENTIONS · BASE RATES paper book (Oct 9): every 10 min, pre-event only.
  void import("./mentions").then((m) => m.mentionsTick()).catch(() => {});
  // ORACLE (Oct 9): candidate list for the scheduled forecaster, paper trades and the report card.
  void import("./oracle").then((m) => m.oracleTick()).catch(() => {});
  // LOVE'S CALLS (Oct 9): settle her logged hand trades from Kalshi's result.
  void import("./lovecalls").then((m) => m.loveCallsTick()).catch(() => {});
  if (!assets) return;
  // RIP-TAP (Love): BTC rips through a band and taps the next one -> $5 on the bounce side on Polymarket, 4+ min left.
  void import("./riptap").then((m) => m.ripTapTick(assets)).catch(() => {});
  // SILVER HEDGE (Love): a red gold trade that closes through a band -> $11 on silver's other side at 1.6x+.
  void import("./silverhedge").then((m) => m.silverHedgeTick(assets)).catch(() => {});
  // HOURLY LONGSHOTS (Love, Oct 9): KXBTCD 3-8c tickets, signal vs control, four exits side by side. Paper only.
  void import("./hourlotto").then((m) => m.hourLottoTick(assets)).catch(() => {});
  // BRICK · TVC GOLD paper twin (Love, Oct 6): BRICK's gold logic on TVC:GOLD's lines.
  void import("./bricktvc").then((m) => m.brickTvcTick(assets)).catch(() => {});
  const minute = Math.floor(Date.now() / 60000);
  if (g.__navTapeMinute === minute) return;
  g.__navTapeMinute = minute;
  let rows: unknown[] = [];
  try {
    const prev = JSON.parse(readFileSync(FILE(), "utf8"));
    rows = Array.isArray(prev) ? prev : [];
  } catch {
    rows = [];
  }
  for (const id of ["btc", "gold"]) {
    const a = assets[id];
    if (!a || !(a.spot > 0)) continue;
    const n = (a.nav ?? {}) as Record<string, { c: number; up: number; dn: number } | number | null>;
    const line = (k: string) => {
      const f = n[k] as { c: number; up: number; dn: number } | null | undefined;
      return f && typeof f === "object" ? [r(f.c), r(f.up), r(f.dn)] : null;
    };
    rows.push({
      t: minute * 60,
      a: id,
      spot: r(a.spot),
      c1: r(n.close1m as number),
      c5: r(n.close5m as number),
      m1: line("m1"),
      m5: line("m5"),
      m10: line("m10"),
      m15: line("m15"),
      vw: r(a.vwap1m?.vwap),
      sd: r(a.vwap1m?.stdev),
      tk: a.market?.ticker ?? null,
      tgt: r(a.target),
      yb: a.market?.yesBid ?? null,
      left: Math.round(a.secondsLeft || 0),
    });
  }
  try {
    writeFileSync(FILE(), JSON.stringify(rows.slice(-KEEP)));
  } catch {
    // research only
  }
}
