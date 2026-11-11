// fix767 STATS BY THE WEEK (display only). Love Nov 5 2026: "i want it to score for the week if possible bb , and keep
// the older ones in the view only archive so it doesn't slow her down".
// Scores the same fills the STATS box always read (data/fill-log.json, banked rows, one per trade), by week.
// A week starts Monday 12:00 AM Pacific. Every trade is also kept in data/stats-weeks/<monday>.json so a week stays whole
// after the fill log trims its oldest rows. Nothing here places, blocks or changes a trade.
import { createServerFn } from "@tanstack/react-start";

export type WeekScore = { week: string; from: string; pnl: number; w: number; n: number; rows: [string, { w: number; n: number; pnl: number }][] };
type Kept = Record<string, { at: string; pattern: string; profit: number }>;

const DAY = 86400000;

/** Monday 12:00 AM Pacific of the week `ms` falls in, as epoch ms. */
export function weekStart767(ms: number): number {
  const off = (t: number) => {
    const d = new Date(t);
    const la = new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    return Math.round((d.getTime() - la.getTime()) / 60000) * 60000;
  };
  const la = new Date(ms - off(ms));
  la.setHours(0, 0, 0, 0);
  la.setDate(la.getDate() - ((la.getDay() + 6) % 7));
  const guess = la.getTime() + off(ms);
  return la.getTime() + off(guess); // the offset on that Monday (DST-safe)
}

function weekName(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

export function scoreWeek767(week: string, from: number, kept: Kept): WeekScore {
  const by = new Map<string, { w: number; n: number; pnl: number }>();
  let pnl = 0, w = 0, n = 0;
  for (const t of Object.values(kept)) {
    const name = String(t.pattern || "Unlabeled").replace(/\u2212/g, "-"); // "−1σ" and "-1σ" are the same setup
    const b = by.get(name) ?? { w: 0, n: 0, pnl: 0 };
    b.n += 1; b.pnl += t.profit; if (t.profit > 0) b.w += 1;
    by.set(name, b);
    n += 1; pnl += t.profit; if (t.profit > 0) w += 1;
  }
  return { week, from: new Date(from).toISOString(), pnl, w, n, rows: [...by.entries()] };
}

let cache: { at: number; now: WeekScore; past: string[] } | null = null;

async function refresh(): Promise<{ now: WeekScore; past: string[] }> {
  if (cache && Date.now() - cache.at < 60000) return cache;
  const { readFileSync, writeFileSync, mkdirSync, readdirSync, renameSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { readFillLog } = await import("./fill-log");
  const dir = join(process.cwd(), "data", "stats-weeks");
  mkdirSync(dir, { recursive: true });
  const fresh = new Map<string, Kept>();
  for (const e of readFillLog()) {
    if (e.kind !== "banked" || e.profit == null) continue;
    const ms = Date.parse(e.at);
    if (!Number.isFinite(ms)) continue;
    const name = weekName(weekStart767(ms));
    const k = fresh.get(name) ?? {};
    if (!k[e.tradeId]) k[e.tradeId] = { at: e.at, pattern: e.pattern || "Unlabeled", profit: e.profit };
    fresh.set(name, k);
  }
  const read = (name: string): Kept => {
    try { return JSON.parse(readFileSync(join(dir, name + ".json"), "utf8")) as Kept; } catch { return {}; }
  };
  for (const [name, rows] of fresh) {
    const kept = read(name);
    let added = 0;
    for (const [id, r] of Object.entries(rows)) if (!kept[id]) { kept[id] = r; added += 1; }
    if (added) {
      const tmp = join(dir, name + ".json.tmp");
      writeFileSync(tmp, JSON.stringify(kept));
      renameSync(tmp, join(dir, name + ".json"));
    }
  }
  const nowFrom = weekStart767(Date.now());
  const nowName = weekName(nowFrom);
  const past = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)).filter((d) => d < nowName).sort().reverse();
  cache = { at: Date.now(), now: scoreWeek767(nowName, nowFrom, read(nowName)), past };
  return cache;
}

/** This week's score (small: one row per setup). */
export const getStatsWeek767 = createServerFn({ method: "GET" }).handler(async () => {
  const r = await refresh();
  return { now: r.now, past: r.past };
});

/** One past week from the archive, read only when it is opened on the page. */
export const getStatsArchive767 = createServerFn({ method: "GET" })
  .validator((input: { week: string }) => input)
  .handler(async ({ data }): Promise<WeekScore | null> => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data?.week || ""))) return null;
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    try {
      const kept = JSON.parse(readFileSync(join(process.cwd(), "data", "stats-weeks", data.week + ".json"), "utf8")) as Kept;
      const [y, m, d] = data.week.split("-").map(Number);
      return scoreWeek767(data.week, weekStart767(Date.UTC(y, m - 1, d, 20)), kept);
    } catch {
      return null;
    }
  });

export const WEEK_MS_767 = 7 * DAY;
