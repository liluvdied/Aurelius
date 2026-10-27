// NIGHT BOOK (Love, 2026-10-02): LIVE is off for the night and she trades two paper ledgers side
// by side on the SAME setups, with real Kalshi bids for exits and Kalshi's own result at the bell.
//   ORIGINAL = how she was right after the bug fixes: her setups, band-in-the-way, 1.38x minimum,
//              one trade per window, her original take-profit table (33 / 44 / 50 / 60 / max-15).
//              No nav skip, no worst hours, no nav-close entries, no LOCK THE WIN, no channel rule.
//   NEW      = everything tonight: every live rule (nav skip on 1m/5m/10m/15m purple with the 1m
//              close, worst hours, blocked setups, 1.38x), nav-close entries, take profit +50% (under
//              1.65x) / 75% of the max, LOCK THE WIN (+20 arm / +10 floor), $5 on anything paying 3x+.
// $10 a trade (NEW: $5 at 3x+). Paper only. Never sends an order.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type NightRow = {
  id: string;
  book: "original" | "new";
  at: string;
  asset: string;
  ticker: string;
  side: "up" | "down";
  setup: string;
  ask: number;
  multiple: number;
  stake: number;
  tpPct: number;
  peakPct: number;
  exit: string | null;
  sellBid: number | null;
  result: "open" | "win" | "loss" | "sold";
  pnl: number | null;
  /** Every band at the moment of entry: her session VWAP bands + nav lines on 1m/5m/10m/15m. */
  bands?: unknown;
  spot?: number | null;
  /** Kalshi's result at the bell (also for trades she sold early). */
  bell?: "yes" | "no" | null;
  /** A scheduled market event in progress at entry (data/events.json), e.g. the jobs report. */
  event?: string | null;
  /** Pacific hour of the entry, for "which hours respect the bands" stats. */
  hourPT?: number;
  /** Claude's review once the trade is done: what worked, what to do better, what to keep. */
  notes?: { worked: string[]; better: string[]; keep: string[] } | null;
};

const FILE = () => join(process.cwd(), "data", "night-book.json");
const g = globalThis as unknown as { __nightSettling?: boolean; __nightLock?: Record<string, number> };

function read(): NightRow[] {
  try {
    const rows = JSON.parse(readFileSync(FILE(), "utf8"));
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
function write(rows: NightRow[]) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(FILE(), JSON.stringify(rows.slice(0, 600), null, 1));
  } catch {
    // paper only
  }
}
export function listNight(): NightRow[] {
  return read();
}
const r2 = (n: number) => Math.round(n * 100) / 100;

// Her original table, exactly as it was before tonight.
function originalTp(mult: number) {
  const maxPct = (mult - 1) * 100;
  if (!(maxPct > 0)) return 0;
  let arm = mult <= 1.4 ? 33 : mult <= 1.5 ? 44 : mult <= 1.6 ? 50 : mult <= 1.7 ? 60 : maxPct - 15;
  if (arm > maxPct || arm < 1) arm = maxPct;
  return r2(arm);
}
function newTp(mult: number) {
  const maxPct = (mult - 1) * 100;
  if (!(maxPct > 0)) return 0;
  return mult < 1.65 ? Math.min(50, r2(maxPct)) : r2(maxPct * 0.75);
}

type Candidate = { ticker: string; side: "up" | "down"; ask: number; label: string; navCross?: boolean };

/** Called for every setup the engine is about to consider (before any live rule). */
export function nightConsider(c: Candidate | null, originalOk: boolean, newRefusal: string | null) {
  if (!c || !(c.ask > 0.02 && c.ask < 0.98)) return;
  const mult = 1 / c.ask;
  if (mult < 1.38) return;
  const asset = /GOLD/.test(c.ticker) ? "gold" : /BTC/.test(c.ticker) ? "btc" : "other";
  if (asset === "other") return;
  const rows = read();
  let changed = false;
  let bands: Record<string, unknown> | null = null;
  try {
    const now = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"));
    bands = now?.[asset] ?? null;
  } catch {
    bands = null;
  }
  let event: string | null = null;
  try {
    const evs = JSON.parse(readFileSync(join(process.cwd(), "data", "events.json"), "utf8"));
    const now = Date.now();
    const hit = Array.isArray(evs) ? evs.find((e: { from: string; to: string }) => now >= Date.parse(e.from) && now <= Date.parse(e.to)) : null;
    event = hit ? String(hit.name) : null;
  } catch {
    event = null;
  }
  const hourPT = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  const extra = { bands, spot: typeof bands?.spot === "number" ? (bands.spot as number) : null, event, hourPT };
  const open = (book: "original" | "new") => rows.some((r) => r.book === book && r.ticker === c.ticker);
  if (originalOk && !c.navCross && !open("original")) {
    rows.unshift({ id: `${c.ticker}:original`, book: "original", at: new Date().toISOString(), asset, ticker: c.ticker, side: c.side, setup: c.label, ask: c.ask, multiple: r2(mult), stake: 10, tpPct: originalTp(mult), peakPct: 0, exit: null, sellBid: null, result: "open", pnl: null, ...extra });
    changed = true;
  }
  if (!newRefusal && !open("new")) {
    rows.unshift({ id: `${c.ticker}:new`, book: "new", at: new Date().toISOString(), asset, ticker: c.ticker, side: c.side, setup: c.label, ask: c.ask, multiple: r2(mult), stake: mult >= 3 ? 5 : 10, tpPct: newTp(mult), peakPct: 0, exit: null, sellBid: null, result: "open", pnl: null, ...extra });
    changed = true;
  }
  if (changed) write(rows);
}

type AssetLike = { spot?: number; target?: number | null; market: { ticker: string; yesBid: number; noBid: number } | null };

/** Every tick: real bids → take profit (both books), LOCK THE WIN (new book only). */
export function nightTick(assets: Record<string, AssetLike> | null | undefined) {
  if (!assets) return;
  const rows = read();
  if (!rows.some((r) => r.result === "open")) return;
  const lock = g.__nightLock || (g.__nightLock = {});
  let changed = false;
  for (const id of ["btc", "gold"]) {
    const m = assets[id]?.market;
    if (!m?.ticker) continue;
    for (const r of rows) {
      if (r.result !== "open" || r.ticker !== m.ticker) continue;
      const bid = r.side === "up" ? m.yesBid : m.noBid;
      if (!(bid > 0)) continue;
      const pct = (bid / r.ask - 1) * 100;
      if (pct > r.peakPct) {
        r.peakPct = r2(pct);
        changed = true;
      }
      let why: string | null = null;
      const tpPeak = g as unknown as { __nightTpPeak?: Record<string, number> };
      const tpp = tpPeak.__nightTpPeak || (tpPeak.__nightTpPeak = {});
      if (r.book === "original") {
        if (r.tpPct > 0 && pct + 1e-9 >= r.tpPct) why = `take profit +${r.tpPct}%`;
      } else if (r.tpPct > 0 && (pct + 1e-9 >= r.tpPct || tpp[r.id] != null)) {
        // NEW: ride past the take profit, trail 1% under the best quote, never below the line.
        tpp[r.id] = Math.max(tpp[r.id] ?? pct, pct);
        const trail = Math.max(r.tpPct, Math.floor(tpp[r.id]) - 1);
        if (bid >= 0.97 || pct < trail) why = `take profit: peaked +${Math.round(tpp[r.id])}%, 1% trail`;
      }
      // NEW only sells a winner early with a reason: within $1.50 (gold) / $100 (BTC) of the target.
      const a = assets[id];
      const clear = id === "gold" ? 1.5 : id === "btc" ? 100 : 0;
      const cushion = a?.spot && a?.target ? (r.side === "up" ? a.spot - a.target : a.target - a.spot) : null;
      const reason = !(clear > 0) || cushion == null || cushion <= clear;
      if (!why && r.book === "new" && reason) {
        // Love's gates: under 1.65x keep a literal +40% once reached; 1.65x+ keep 55% / 60% of the max.
        const maxPct = (r.multiple - 1) * 100;
        const gates = r.multiple < 1.65 ? (40 < maxPct ? [40] : []) : [0.55, 0.6].map((x) => r2(maxPct * x));
        const floor = gates.filter((gp) => r.peakPct + 1e-9 >= gp).pop();
        if (floor != null && pct < floor) why = `take-profit gate +${floor}% (peaked +${r.peakPct}%)`;
      }
      if (r.book === "new") lock[r.id] = Math.max(lock[r.id] ?? -100, pct);
      if (!why && r.book === "new" && reason) {
        if (lock[r.id] >= 30 && pct <= 20) why = `locked the win (was +${Math.round(lock[r.id])}%, back to +${Math.round(pct)}%)`;
      }
      if (why) {
        r.result = "sold";
        r.exit = why;
        r.sellBid = bid;
        r.pnl = r2((r.stake / r.ask) * bid - r.stake);
        changed = true;
      }
    }
  }
  if (changed) write(rows);
}

/** Settle what was held to the bell with Kalshi's real result. */
// Love (4:35 AM): a short review on every closed trade.
function review(r: NightRow): NonNullable<NightRow["notes"]> {
  const worked: string[] = [];
  const better: string[] = [];
  const keep: string[] = [];
  const b = (r.bands ?? null) as { vwap?: number; sd?: number; nav?: Record<string, { c: number; up: number; dn: number } | null> } | null;
  const spot = Number(r.spot) || 0;
  const thr = r.asset === "btc" ? 100 : 2.5;
  const wonAtBell = r.bell ? (r.side === "up" ? r.bell === "yes" : r.bell === "no") : null;
  const maxPct = (r.multiple - 1) * 100;
  // Entry against the lines she watches
  if (b && spot > 0) {
    const lines: [string, number][] = [];
    if (b.vwap && b.sd) for (const m of [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]) lines.push([m === 0 ? "session VWAP" : `${m > 0 ? "+" : ""}${m}σ`, b.vwap + m * b.sd]);
    for (const k of ["m5", "m10", "m15"]) if (b.nav?.[k]) lines.push([`${k.slice(1)}m purple`, b.nav[k]!.c]);
    const against = lines.filter(([, L]) => (r.side === "up" ? L >= spot && L - spot <= thr : L <= spot && spot - L <= thr));
    const support = lines.filter(([, L]) => (r.side === "up" ? L < spot && spot - L <= thr : L > spot && L - spot <= thr));
    if (against.length) better.push(`Entered with the ${against.map(([n]) => n).join(" + ")} right ${r.side === "up" ? "above" : "below"} her. The new rules skip this now.`);
    else worked.push(`Clean entry: no band right ${r.side === "up" ? "above the long" : "below the short"}.`);
    if (support.length) worked.push(`Had the ${support.map(([n]) => n).join(" + ")} ${r.side === "up" ? "under her as a floor" : "over her as a ceiling"}.`);
  }
  if (r.multiple >= 3) better.push(`${r.multiple.toFixed(2)}x is a long shot; these need a strong reason.`);
  // Exit
  const pnl = Number(r.pnl) || 0;
  if (r.result === "sold") {
    const gaveBack = r.peakPct - (r.sellBid && r.ask ? (r.sellBid / r.ask - 1) * 100 : 0);
    const tp = /take profit/.test(r.exit ?? "");
    if (wonAtBell === true && tp) worked.push(`Take profit banked ${pnl >= 0 ? "+" : ""}${pnl} of the ${r2(r.stake / r.ask - r.stake)} it paid at the bell.`);
    else if (wonAtBell === true) better.push(`Sold early but it won at the bell: holding paid ${r2(r.stake / r.ask - r.stake)} vs ${pnl >= 0 ? "+" : ""}${pnl}. That exit had no good reason.`);
    else if (wonAtBell === false) worked.push(`Exit saved it: it lost at the bell, she banked ${pnl >= 0 ? "+" : ""}${pnl} instead of -${r.stake}.`);
    if (gaveBack > 15) better.push(`Peaked +${Math.round(r.peakPct)}% but sold ${Math.round(gaveBack)} points lower.`);
    if (/take profit/.test(r.exit ?? "")) keep.push("Take profit + trail did its job.");
  } else if (r.result === "win") {
    worked.push(`Held to the bell and won ${pnl >= 0 ? "+" : ""}${pnl}.`);
    if (r.peakPct >= maxPct * 0.75) keep.push("Riding winners past the line pays.");
  } else if (r.result === "loss") {
    if (r.peakPct >= 20) better.push(`Was up +${Math.round(r.peakPct)}% and still lost: a gate/lock with a reason should bank these.`);
    else better.push("Never went green: the setup didn't follow through.");
  }
  if (r.event) better.push(`Taken during the ${r.event}: news windows whip both ways.`);
  if (!worked.length && !better.length) keep.push("Nothing stood out; keep watching.");
  if (r.book === "new" && !better.length) keep.push("Do more of exactly this.");
  return { worked, better, keep, v: 2 } as NonNullable<NightRow["notes"]>;
}

export async function nightSettle(result: (ticker: string) => Promise<"yes" | "no" | null>) {
  if (g.__nightSettling) return;
  g.__nightSettling = true;
  try {
    const rows = read();
    let changed = false;
    for (const r of rows) {
      if (r.result === "open") {
        const res = await result(r.ticker).catch(() => null);
        if (!res) continue;
        const won = (r.side === "up" && res === "yes") || (r.side === "down" && res === "no");
        r.result = won ? "win" : "loss";
        r.exit = "held to the bell";
        r.pnl = won ? r2(r.stake / r.ask - r.stake) : -r.stake;
        r.bell = res;
        r.notes = review(r);
        changed = true;
        continue;
      }
      // Sold early: still learn what the bell said, then write the review.
      if (!r.notes || r.bell == null || (r.notes as { v?: number }).v !== 2) {
        const res = r.bell ?? (await result(r.ticker).catch(() => null));
        if (!res) continue;
        r.bell = res;
        r.notes = review(r);
        changed = true;
      }
    }
    if (changed) write(rows);
  } finally {
    g.__nightSettling = false;
  }
}
