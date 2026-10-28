// LIVE GUARD — the one place that decides whether real money can move.
//
// Every opening order on Kalshi and Polymarket passes through here at the
// HTTP layer (kalshi() / poly()), so no book, copier, script path or restore
// can route around it. Exits (reduce-only / sells) are never blocked.
//
// Settings live in data/live-switch.json:
//   live              true = real orders allowed, false = nothing opens (default false)
//   maxDollars        hard cap on what one opening order can cost (default 10)
//   cooldownAfterLoss true = after a live loss on a symbol, skip that symbol's next window
//   route             which book may send: "paper" (the clean model, default), "prime", or "both"
//
// Edit this file only on Love's express instruction.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dnaNow } from "./dna";

const DATA = () => join(process.cwd(), "data");
const SWITCH = () => join(DATA(), "live-switch.json");
const FIRES = () => join(DATA(), "live-fires.json");
const BLOCKS = () => join(DATA(), "live-blocks.json");

export type LiveSwitch = { live: boolean; maxDollars: number; cooldownAfterLoss: boolean; route: "paper" | "prime" | "both"; shiftStart?: string; primeFortyRule?: boolean; at?: string; note?: string };

const DEFAULTS: LiveSwitch = { live: false, maxDollars: 10, cooldownAfterLoss: true, route: "paper" };
const ABSOLUTE_MAX = 100;

export function readSwitch(): LiveSwitch {
  try {
    const row = JSON.parse(readFileSync(SWITCH(), "utf8"));
    const max = Number(row?.maxDollars);
    return {
      live: row?.live === true,
      maxDollars: max >= 1 && max <= ABSOLUTE_MAX ? max : DEFAULTS.maxDollars,
      cooldownAfterLoss: row?.cooldownAfterLoss !== false,
      route: row?.route === "prime" || row?.route === "both" ? row.route : "paper",
      shiftStart: typeof row?.shiftStart === "string" ? row.shiftStart : undefined,
      at: row?.at,
      note: row?.note,
    };
  } catch {
    // A missing or broken switch file means OFF. Never guess "on".
    return { ...DEFAULTS };
  }
}

export function writeSwitch(next: Partial<LiveSwitch>): LiveSwitch {
  // Keep every field in the file (setups list, excused losses, ...), not just the typed ones.
  const merged = { ...(readJson(SWITCH(), {}) as object), ...readSwitch(), ...next, at: new Date().toISOString() };
  mkdirSync(DATA(), { recursive: true });
  writeFileSync(SWITCH(), JSON.stringify(merged, null, 2));
  return readSwitch();
}

export function liveOn(): boolean {
  return readSwitch().live === true;
}

export function maxDollars(): number {
  return readSwitch().maxDollars;
}

/** Clamp a dollar size to the switch cap. */
export function capDollars(dollars: number): number {
  const n = Number(dollars);
  const cap = maxDollars();
  if (!(n > 0)) return cap;
  return Math.min(n, cap);
}

function readJson(path: string, fallback: unknown) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

export function noteBlock(row: Record<string, unknown>) {
  try {
    mkdirSync(DATA(), { recursive: true });
    const prev = readJson(BLOCKS(), []);
    const rows = Array.isArray(prev) ? prev : [];
    writeFileSync(BLOCKS(), JSON.stringify([{ at: new Date().toISOString(), ...row }, ...rows].slice(0, 300)));
  } catch {
    // logging must never stop the desk
  }
}

/** Everything the desk saw at the moment it fired. One row per filled opening order. */
export function recordFire(row: Record<string, unknown>) {
  try {
    mkdirSync(DATA(), { recursive: true });
    const prev = readJson(FIRES(), []);
    const rows = Array.isArray(prev) ? prev : [];
    // Love's nav bands + her session bands at the moment of the fire (reference only).
    const now = readJson(join(DATA(), "bands-now.json"), {}) as Record<string, unknown>;
    const sym = symbolKey(String(row.ticker || ""));
    const ref = (now as Record<string, { nav?: unknown }>)[sym];
    const extra = ref ? { nav: ref.nav ?? null, sessionNow: ref } : {};
    writeFileSync(FIRES(), JSON.stringify([{ at: new Date().toISOString(), ...row, ...extra }, ...rows].slice(0, 1000), null, 1));
  } catch {
    // logging must never stop the desk
  }
}

export function findFire(ticker: string): Record<string, unknown> | null {
  const rows = readJson(FIRES(), []);
  if (!Array.isArray(rows)) return null;
  return rows.find((row) => row && row.ticker === ticker) || null;
}

/** The 5 VWAP band levels on each side plus the center, for the fire snapshot. */
export function bandLevels(vwap: number, stdev: number) {
  if (!(vwap > 0) || !(stdev > 0)) return null;
  const out: Record<string, number> = { vwap: round(vwap) };
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    out[`+${step}`] = round(vwap + step * stdev);
    out[`-${step}`] = round(vwap - step * stdev);
  }
  return out;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Window close time from a 15-minute Kalshi ticker, e.g. KXBTC15M-26OCT012015-15 (ET). */
export function closeOf(ticker: string): number | null {
  const match = String(ticker).match(/-(\d{2})([A-Z]{3})(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const months: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  const [, yy, mon, dd, hh, mm] = match;
  const month = months[mon];
  if (month == null) return null;
  const year = 2000 + Number(yy);
  // Kalshi tickers are US Eastern. Try EDT (UTC-4) then EST (UTC-5) and keep the one that round-trips.
  for (const offset of [4, 5]) {
    const t = Date.UTC(year, month, Number(dd), Number(hh) + offset, Number(mm));
    const et = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(new Date(t));
    if (Number(et) === Number(hh)) return t;
  }
  return Date.UTC(year, month, Number(dd), Number(hh) + 4, Number(mm));
}

function symbolKey(ticker: string) {
  const t = String(ticker).toUpperCase();
  for (const sym of ["BTC", "GOLD", "SILVER", "ETH", "SOL", "WTI", "NATGAS", "COPPER"]) if (t.includes(sym)) return sym.toLowerCase();
  return t;
}

/**
 * Loss cooldown. Looks at the last live Kalshi trade on this symbol.
 * - If it lost, the symbol sits out until that window's close + 15 minutes (the next window).
 * - If its window just closed and the result is not booked yet, wait up to 90 seconds for it.
 * Returns a reason string when blocked, otherwise null.
 */
export function cooldownBlock(ticker: string, now = Date.now()): string | null {
  if (!readSwitch().cooldownAfterLoss) return null;
  const sym = symbolKey(ticker);
  const fills = readJson(join(DATA(), "fill-log.json"), []);
  if (!Array.isArray(fills)) return null;
  const live = fills.filter((r) => r && r.venue === "kalshi" && symbolKey(r.ticker) === sym && r.ticker !== ticker);
  const taken = live
    .filter((r) => r.kind === "taken")
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
  if (!taken) return null;
  const close = closeOf(taken.ticker);
  if (close == null) return null;
  // Losses Love excused (e.g. caused by a bug, not the model) do not trigger a cooldown.
  const raw = readJson(SWITCH(), {}) as { cooldownExcuse?: string[] };
  if (Array.isArray(raw.cooldownExcuse) && raw.cooldownExcuse.includes(taken.ticker)) return null;
  const banked = live.find((r) => r.kind === "banked" && r.ticker === taken.ticker);
  if (banked) {
    if (Number(banked.profit) < 0 && now < close + 15 * 60 * 1000) {
      return `Cooldown. The last ${sym.toUpperCase()} trade lost. Sitting out the next window.`;
    }
    return null;
  }
  if (now >= close && now < close + 90 * 1000) {
    return `Cooldown. Waiting for the last ${sym.toUpperCase()} result before trading again.`;
  }
  return null;
}

// ─── ENTRY RULES (Love, 2026-10-01) ──────────────────────────────────────────
// 1. Right side of the band. A long only when the nearest band (or VWAP) is just BELOW
//    price: it sits on it, tapped it and held, or just broke up through it. A short only
//    when the nearest band is just ABOVE price. A long under a band or a short over one never fires.
// 2. Winners only. A setup trades only if it is on the list in data/live-switch.json
//    ("setups"), picked from the desk's own hit-rate stats (data/hit-book.json).
//    Rule used: 95% lower confidence bound on hit rate >= 50%, or hit rate >= 75% on 8+ trades.
//    Silver and the other symbols are not filtered here because they never go live.
export function setupKey(label: string, side: string, asset: string): string {
  return `${String(label || "").replace(/−/g, "-").replace(/\s+/g, " ").trim()}|${side}|${String(asset || "").toLowerCase()}`;
}

export function wrongSideOfBand(side: "up" | "down", spot: number, vwap: number, stdev: number): string | null {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return "The bands could not be read.";
  const levels = [vwap];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * stdev, vwap - step * stdev);
  let nearest = levels[0];
  for (const level of levels) if (Math.abs(level - spot) < Math.abs(nearest - spot)) nearest = level;
  if (side === "up" && nearest > spot) return "Wrong side of the band. Price is just under a band, so no long.";
  if (side === "down" && nearest < spot) return "Wrong side of the band. Price is just over a band, so no short.";
  return null;
}

export function entryBlock(asset: string, label: string, side: "up" | "down", spot: number, vwap: number, stdev: number): string | null {
  const name = String(asset || "").toLowerCase();
  if (name !== "btc" && name !== "gold") return null;
  const raw = readJson(SWITCH(), {}) as { setups?: string[] };
  if (Array.isArray(raw.setups)) {
    const key = setupKey(label, side, name);
    if (!raw.setups.includes(key)) return `Not on the winners list: ${key}.`;
  }
  return wrongSideOfBand(side, spot, vwap, stdev);
}

// ─── LOVE'S SKIPS (2026-10-02) ───────────────────────────────────────────────
// 1. Worst hours. data/live-switch.json "skipHours": { "btc": [9, 16, ...], "gold": [...] },
//    hours in Pacific time, taken from Kalshi's own record of her trades (Sept 18 → Oct 2).
// 2. Gold nav skip. "navSkip": { "on": true, "assets": ["gold"], "frames": ["m10", "m15"], "within": 0.25 }.
//    No gold short while price is sitting just ABOVE a 10m/15m nav line (it is bouncing up off it),
//    and no gold long while price is sitting just UNDER one. "Just" = within 0.25 of a session σ.
//    Uses data/bands-now.json (refreshed every 10s); if that is older than 45s the rule stands aside.
export function ptHour(now = Date.now()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date(now)));
}
function hourLabel(h: number) {
  const ampm = h < 12 ? "AM" : "PM";
  const x = h % 12 === 0 ? 12 : h % 12;
  return `${x} ${ampm}`;
}
export function hourSkip(sym: string, now = Date.now()): string | null {
  const raw = readJson(SWITCH(), {}) as { skipHours?: Record<string, number[]> };
  const list = raw.skipHours?.[String(sym).toLowerCase()];
  if (!Array.isArray(list)) return null;
  const h = ptHour(now);
  return list.includes(h) ? `${String(sym).toUpperCase()} sits out the ${hourLabel(h)} PT hour (one of its worst hours, Love's call).` : null;
}
export function navSkip(sym: string, side: "up" | "down", spot: number, now = Date.now()): string | null {
  type NavCfg = { on?: boolean; assets?: string[]; frames?: string[]; within?: number; withinDollars?: number; lines?: string[] };
  const raw = readJson(SWITCH(), {}) as { navSkip?: NavCfg & { byAsset?: Record<string, NavCfg> } };
  const name = String(sym).toLowerCase();
  // Per-asset settings (e.g. BTC: 5m/10m/15m within $75) override the shared ones.
  const cfg = raw.navSkip ? { ...raw.navSkip, ...(raw.navSkip.byAsset?.[name] ?? {}) } : undefined;
  if (!cfg || cfg.on === false || !(Array.isArray(cfg.assets) ? cfg.assets : ["gold"]).includes(name)) return null;
  if (!(spot > 0)) return null;
  const bands = readJson(join(DATA(), "bands-now.json"), {}) as Record<string, unknown> & { at?: string };
  if (!bands.at || now - Date.parse(bands.at) > 45000) return null;
  const row = bands[name] as { sd?: number; nav?: Record<string, { c: number; up: number; dn: number } | null> & { close1m?: number | null } } | undefined;
  const sd = Number(row?.sd);
  if (!row?.nav || !(sd > 0)) return null;
  const within = Number(cfg.withinDollars) > 0 ? Number(cfg.withinDollars) : (Number(cfg.within) > 0 ? Number(cfg.within) : 0.25) * sd;
  // Frames are read from the biggest down, and ANY nearby purple line on the wrong side blocks:
  //   a long just under a line (or not yet closed above it on the 1m) → skip;
  //   a short just over a line (or not yet closed below it on the 1m) → skip.
  const size = (f: string) => Number(String(f).replace(/\D/g, "")) || 0;
  const frames = [...(Array.isArray(cfg.frames) ? cfg.frames : ["m10", "m15"])].sort((a, b) => size(b) - size(a));
  const lines = Array.isArray(cfg.lines) ? cfg.lines : ["center"];
  const c1 = Number(row.nav.close1m);
  // Love (4:16 AM): her session VWAP bands count too. No long just under a σ band, no short just over
  // one (same distance: gold $2.50, BTC $100), and a 1m candle has to close through it first.
  const sv = Number((row as { vwap?: number }).vwap);
  if (sv > 0 && sd > 0) {
    const near = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]
      .map((m) => [m === 0 ? "session VWAP" : `${m > 0 ? "+" : ""}${m}σ band`, sv + m * sd] as const)
      .filter(([, L]) => Math.abs(spot - L) <= within)
      .sort((a, b) => Math.abs(spot - a[1]) - Math.abs(spot - b[1]));
    for (const [label, level] of near) {
      if (side === "down" && spot >= level) return `${name.toUpperCase()} is sitting just over the ${label} (${level.toFixed(2)}). No short into it.`;
      if (side === "up" && spot <= level) return `${name.toUpperCase()} is sitting just under the ${label} (${level.toFixed(2)}). No long into it.`;
      if (c1 > 0 && side === "up" && c1 <= level) return `${name.toUpperCase()} poked above the ${label} (${level.toFixed(2)}) but no 1m candle has closed above it yet. No long.`;
      if (c1 > 0 && side === "down" && c1 >= level) return `${name.toUpperCase()} dipped under the ${label} (${level.toFixed(2)}) but no 1m candle has closed below it yet. No short.`;
    }
  }
  for (const frame of frames) {
    const f = row.nav[frame];
    if (!f) continue;
    // Only the purple center line blocks unless "lines" adds the outer (Bollinger) bands back.
    const all = [["center", f.c], ["lower band", f.dn], ["upper band", f.up]] as const;
    // The 1m Bollinger bands hug price, so on 1m only the purple line counts.
    const near = all
      .filter(([l]) => lines.includes(l === "center" ? "center" : l === "lower band" ? "lower" : "upper"))
      .filter(([l]) => frame !== "m1" || l === "center")
      .filter(([, level]) => level > 0 && Math.abs(spot - level) <= within)
      .sort((a, b) => Math.abs(spot - a[1]) - Math.abs(spot - b[1]));
    if (!near.length) continue;
    const tf = frame.replace("m", "") + "m";
    // Every nearby line counts, not just the closest (a floor under a long must not hide a band above it).
    for (const [label, level] of near) {
      if (side === "down" && spot >= level) return `${name.toUpperCase()} is sitting on the ${tf} nav ${label} (${level.toFixed(2)}) and bouncing up off it. No short into it.`;
      if (side === "up" && spot <= level) return `${name.toUpperCase()} is sitting just under the ${tf} nav ${label} (${level.toFixed(2)}). No long into it.`;
      // "A close above": price poking through is not enough; the last closed 1m candle has to be through too.
      if (c1 > 0 && side === "up" && c1 <= level) return `${name.toUpperCase()} poked above the ${tf} nav ${label} (${level.toFixed(2)}) but no 1m candle has closed above it yet. No long.`;
      if (c1 > 0 && side === "down" && c1 >= level) return `${name.toUpperCase()} dipped under the ${tf} nav ${label} (${level.toFixed(2)}) but no 1m candle has closed below it yet. No short.`;
    }
    // On her side and closed through on this frame: keep checking the smaller frames too.
    // (Love, 11:32 PM: a 15m floor must NOT cancel a 5m purple line sitting right above a long.)
  }
  return null;
}
// Love (3:40 AM): "never trade into a band". If the trade has to travel to reach its target, no session
// VWAP band (every half σ) and no 5m / 10m / 15m nav purple line may sit between price and the target.
// (Tonight's 3:34 AM gold short at 4,176.83 needed 4,174.07 and had the VWAP 4,175.50 and the 5m purple
// 4,174.21 in the way.) Trades already through their target are not affected.
export function pathSkip(sym: string, side: "up" | "down", spot: number, target: number, now = Date.now()): string | null {
  const raw = readJson(SWITCH(), {}) as { pathSkip?: { on?: boolean } };
  if (raw.pathSkip?.on === false) return null;
  if (!(spot > 0) || !(target > 0)) return null;
  const travels = side === "up" ? target > spot : target < spot;
  if (!travels) return null;
  const bands = readJson(join(DATA(), "bands-now.json"), {}) as Record<string, unknown> & { at?: string };
  if (!bands.at || now - Date.parse(bands.at) > 45000) return null;
  const row = bands[String(sym).toLowerCase()] as { vwap?: number; sd?: number; nav?: Record<string, { c: number } | null> } | undefined;
  if (!row) return null;
  const lo = Math.min(spot, target);
  const hi = Math.max(spot, target);
  const lines: [string, number][] = [];
  const vw = Number(row.vwap);
  const sd = Number(row.sd);
  if (vw > 0 && sd > 0) for (const m of [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]) lines.push([m === 0 ? "session VWAP" : `${m > 0 ? "+" : ""}${m}σ band`, vw + m * sd]);
  for (const k of ["m5", "m10", "m15"]) {
    const f = row.nav?.[k];
    if (f && f.c > 0) lines.push([`${k.slice(1)}m nav purple`, f.c]);
  }
  const hit = lines.find(([, level]) => level > lo && level < hi);
  if (!hit) return null;
  return `${String(sym).toUpperCase()} would have to cross the ${hit[0]} (${hit[1].toFixed(2)}) to reach its target ${target.toFixed(2)}. Not trading into a band.`;
}
export function loveSkip(sym: string, side: "up" | "down", spot: number, now = Date.now(), target = 0, dnaMode: "fixed" | "atr" | "free" | "chan" = "fixed", hours = true): string | null {
  // HER DNA first (dna.ts): nothing right in front, clear road to the strike. Every live order ("fixed").
  // dnaMode "atr" is only ever asked for by the paper ATR twin (Oct 2 ~midnight, Love's side-by-side).
  const dna = dnaNow(String(sym).toLowerCase(), side, spot, target, dnaMode);
  if (dna) return dna;
  // Oct 3 ~1 AM PT (Love: wake the books): in her channel mode the $100 nav check is replaced by her 25% channel rule
  // (already applied above, with every line incl. the nav lines). Hours and the clear road stay.
  // hours = false: NEW · 24/7 (Love, Oct 8 ~6 PM PT: "can we run a book of NEW that doesn't have off hours?").
  const hs = hours ? hourSkip(sym, now) : null;
  if (dnaMode === "chan") return hs || pathSkip(sym, side, spot, target, now);
  return hs || navSkip(sym, side, spot, now) || pathSkip(sym, side, spot, target, now);
}
