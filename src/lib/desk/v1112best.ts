// fix775 V.111 - 2 LIVE ON KALSHI AT $5, BEST SET UPS ONLY (Love Nov 5 2026 ~9:25 PM PT: "actually you know what let's place V111 - 2 - best from the set ups only table on at $5 pls
// we will see if it's her i want to know" + her card pick: Kalshi).
// THE LIST = the BEST tables of the three STATS boxes (journal.tsx Analytics), re-read at every take of hers:
//   THIS WEEK    - fix767 stats-week: the week's archive + this week's banked fill-log rows (first copy of each trade), labels with "−" read as "-"
//   LAST 4 DAYS  - the fill log the page loads (getFillLog: readFillLog, last 4 days), banked rows, first copy of each trade, label as written
//   PRIME BOOK   - readPrimeBook(): closed rows with a profit, by pattern
//   BEST = that box's $ for the label is 0 or more (journal.tsx: row.pnl >= 0). On her list = in BEST in ANY box, with 3+ trades and MORE than 50% wins in that same box
//   (her earlier picks: "anything that's won more than half" + 3 trades minimum).
// Her take is matched by its label ("−" and "-" read the same). The decision is made once, the second she takes it, and written on her row (best775); only those rows are
// handed to the live copier (grokog.asNightRows -> engine copyLiveBook) as book "bestie", where every Kalshi rail of a live-today book applies. Her paper trade is unchanged.
// Switch: data/v111-2-live.json {"enabled": true/false} - false = nothing new is handed to Kalshi (her paper and the list keep running).
import { readFileSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const LIVE_BOOK775 = "bestie";
export const MIN_TRADES775 = 3, MIN_HIT775 = 50;
// fix786 HER BAR (Love Nov 6 2026 ~2:35 AM PT: "yes bb over 10 trades over 65%"): the list's bar comes from her switch file data/v111-2-live.json - "minTrades" (at least that many
// trades in the box) and "minHitPct" (MORE than that % won in the box); fix786 sets 11 and 65 (more than 10 trades, over 65%). Missing / unreadable = the fix775 bar (3+, more than 50%).
export function bar786(): { n: number; h: number } {
  const c = G.__bar786; if (c && Date.now() - c.at < 5000) return c.v;
  let v = { n: MIN_TRADES775, h: MIN_HIT775 };
  try { const j = JSON.parse(readFileSync(D("v111-2-live.json"), "utf8")); const n = Number(j?.minTrades), h = Number(j?.minHitPct); v = { n: Number.isFinite(n) && n >= 1 ? Math.floor(n) : MIN_TRADES775, h: Number.isFinite(h) && h >= 0 && h < 100 ? h : MIN_HIT775 }; } catch {}
  G.__bar786 = { at: Date.now(), v }; return v;
}
// fix787 WORST ANYWHERE = OFF (Love Nov 6 2026 ~2:56 AM PT, her card: "Skip it if WORST anywhere"): a set up whose label is in ANY box's WORST table (THIS WEEK, LAST 4 DAYS,
// PRIME BOOK - $ under 0 there, the page's own split) is off her list, even when another box has it BEST and over her bar. Same label match as BEST ("−" and "-" the same).
// Her switch file data/v111-2-live.json "skipIfWorstAnywhere": true (fix787 sets it); missing / false = the fix775 rule (BEST in any one box is enough).
export function worst787(): boolean {
  const c = G.__worst787; if (c && Date.now() - c.at < 5000) return c.v;
  let v = false; try { v = JSON.parse(readFileSync(D("v111-2-live.json"), "utf8"))?.skipIfWorstAnywhere === true; } catch {}
  G.__worst787 = { at: Date.now(), v }; return v;
}
const norm = (s: unknown) => String(s ?? "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
export type Cell775 = { label: string; n: number; w: number; pnl: number };
export type Box775 = { name: "THIS WEEK" | "LAST 4 DAYS" | "PRIME BOOK" | "V.111 - 2 OWN"; rows: Cell775[] };
export type Decision775 = { ok: boolean; at: string; label: string; why: string; boxes: string[] };

/** journal.tsx's own count for one box: label -> n, wins (profit > 0), $ */
function count(items: { label: string; profit: number }[]): Cell775[] {
  const m = new Map<string, Cell775>();
  for (const it of items) { const c = m.get(it.label) ?? { label: it.label, n: 0, w: 0, pnl: 0 }; c.n += 1; c.pnl += it.profit; if (it.profit > 0) c.w += 1; m.set(it.label, c); }
  return [...m.values()];
}
export function weekStart775(ms: number): number { // = stats-week.ts weekStart767 (proven equal by tools/v111-2-live-775.cjs)
  const off = (t: number) => { const d = new Date(t); const la = new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })); return Math.round((d.getTime() - la.getTime()) / 60000) * 60000; };
  const la = new Date(ms - off(ms));
  la.setHours(0, 0, 0, 0);
  la.setDate(la.getDate() - ((la.getDay() + 6) % 7));
  const guess = la.getTime() + off(ms);
  return la.getTime() + off(guess);
}
/** the three boxes from their sources (pure - the tests hand these in) */
export function boxes775(src: { fill: any[]; prime: any[]; weekKept: Record<string, { at: string; pattern: string; profit: number }>; now: number }): Box775[] {
  const from = weekStart775(src.now), cut4 = src.now - 4 * 86400000;
  // THIS WEEK (stats-week refresh(): archive first, then the fill log's banked rows of this week not already kept)
  const wk: Record<string, { pattern: string; profit: number }> = { ...src.weekKept };
  for (const e of src.fill) { if (!e || e.kind !== "banked" || e.profit == null) continue; const ms = Date.parse(e.at); if (!Number.isFinite(ms) || weekStart775(ms) !== from) continue; if (!wk[e.tradeId]) wk[e.tradeId] = { pattern: e.pattern || "Unlabeled", profit: e.profit }; }
  const week = count(Object.values(wk).map((t) => ({ label: String(t.pattern || "Unlabeled").replace(/−/g, "-"), profit: Number(t.profit) })));
  // LAST 4 DAYS (journal.tsx: getFillLog's last 4 days, banked, first copy of each trade)
  const seen = new Set<string>(), d4: { label: string; profit: number }[] = [];
  for (const e of src.fill) { if (!e || Date.parse(String(e.at || "")) < cut4 || e.kind !== "banked" || e.profit == null || seen.has(e.tradeId)) continue; seen.add(e.tradeId); d4.push({ label: e.pattern || "Unlabeled", profit: Number(e.profit) }); }
  // PRIME BOOK (journal.tsx: closed rows with a profit, by pattern)
  const pr = src.prime.filter((r) => r && r.result === "closed" && r.profit != null).map((r) => ({ label: String(r.pattern), profit: Number(r.profit) }));
  return [{ name: "THIS WEEK", rows: week }, { name: "LAST 4 DAYS", rows: count(d4) }, { name: "PRIME BOOK", rows: count(pr) }];
}
const onList = (c: Cell775) => { const b = bar786(); /* fix786 */ return c.pnl >= 0 && c.n >= b.n && (100 * c.w) / c.n > b.h; };
/** the live list right now: every label on it, with the box(es) that put it there */
export function list775(bx: Box775[]): { label: string; boxes: string[] }[] {
  const m = new Map<string, string[]>();
  for (const b of bx) for (const c of b.rows) if (onList(c)) { const k = norm(c.label); m.set(k, [...(m.get(k) ?? []), `${b.name} ${c.w}/${c.n} +$${c.pnl.toFixed(2)}`]); }
  const bad787 = worst787() ? new Set(bx.flatMap((b) => b.rows.filter((c) => c.pnl < 0).map((c) => norm(c.label)))) : new Set<string>(); // fix787
  return [...m.entries()].filter(([label]) => !bad787.has(label)).map(([label, boxes]) => ({ label, boxes }));
}
export function decide775(label: string, bx: Box775[], now = Date.now()): Decision775 {
  const k = norm(label), hits: string[] = [], near: string[] = [];
  for (const b of bx) for (const c of b.rows) { if (norm(c.label) !== k) continue; const s = `${b.name} ${c.w}/${c.n} ${c.pnl >= 0 ? "+" : "-"}$${Math.abs(c.pnl).toFixed(2)}${c.pnl >= 0 ? " BEST" : " WORST"}`; (onList(c) ? hits : near).push(s); }
  const worst787s = worst787() ? near.filter((s) => / WORST$/.test(s)) : []; // fix787: WORST in any box = off
  if (worst787s.length) return { ok: false, at: new Date(now).toISOString(), label: k, boxes: [], why: `WORST in ${worst787s.join(" · ")} - off her list (fix787: skip it if WORST anywhere)${hits.length ? " (BEST in " + hits.join(" · ") + ")" : ""}` };
  return { ok: hits.length > 0, at: new Date(now).toISOString(), label: k, boxes: hits, why: hits.length ? `on the BEST list: ${hits.join(" · ")}` : `not on the BEST list${near.length ? ": " + near.join(" · ") : " (not scored in any box)"} - needs BEST, ${bar786().n}+ trades and MORE than ${bar786().h}% in one box` }; /* fix786 */
}
export function liveOn775(): boolean { try { return JSON.parse(readFileSync(D("v111-2-live.json"), "utf8"))?.enabled === true; } catch { return false; } }
// fix797 HER OWN BEST SET UPS (Love Nov 6 2026 ~5:21 AM PT: "and yes obviously bb, bestie needs to take her own best set ups. that's what i asked for i didn't realize you didn't ,
// can we try that now pls?"): with her switch file data/v111-2-live.json "ownRows797": true, BESTIE's list is built ONLY from V.111 - 2's OWN settled trades (her own rows, scored
// under her take-profit - the same rows as the "V.111 - 2 · ..." STATS rows), one box "V.111 - 2 OWN", by set up label; the same bar (fix786: minTrades+ trades and MORE than
// minHitPct% won) and the same skip-if-WORST (fix787: $ under 0 = off). The STATS boxes of the other books (main's tap-rejects on session bands) are no longer read.
export function own797(): boolean { try { return JSON.parse(readFileSync(D("v111-2-live.json"), "utf8"))?.ownRows797 === true; } catch { return false; } }
export function ownBox797(rows?: any[]): Box775 {
  const src = rows ?? [...((G.__v1112?.rows as any[] | undefined) ?? []), ...((G.__v1112zone798?.rows as any[] | undefined) ?? [])]; // fix798: + her zone wick rejections
  return { name: "V.111 - 2 OWN", rows: count(src.filter((r) => r && (r.result === "win" || r.result === "loss") && Number.isFinite(Number(r.pnlTp))).map((r) => ({ label: norm(r.setup), profit: Number(r.pnlTp) }))) };
}
/** the desk's own sources, read the way the STATS page reads them (live process only) */
export async function loadBoxes775(now = Date.now()): Promise<Box775[]> {
  if (own797()) return [ownBox797()]; // fix797: her OWN scored rows only
  const fl = await import("./fill-log"), pb = await import("./prime-book");
  const name = new Date(weekStart775(now)).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  let weekKept = {}; try { weekKept = JSON.parse(readFileSync(D(`stats-weeks/${name}.json`), "utf8")); } catch {}
  return boxes775({ fill: fl.readFillLog() as any[], prime: pb.readPrimeBook() as any[], weekKept, now });
}
/** her take, the second she takes it: on the list or not (written on her row as best775 - BESTIE reads it too, so it is decided whatever the switch says). Any error = not on. */
export async function bestTake775(row: any, deps: { boxes?: () => Promise<Box775[]>; now?: number } = {}): Promise<Decision775> {
  const now = deps.now ?? Date.now();
  try {
    const bx = await (deps.boxes ?? (() => loadBoxes775(now)))();
    return decide775(String(row?.setup || ""), bx, now);
  } catch (e: any) { return { ok: false, at: new Date(now).toISOString(), label: norm(row?.setup), boxes: [], why: `the list could not be read (${String(e?.message || e).slice(0, 80)}) - not sent` }; }
}
/** her BEST takes as live-book rows for the copier (read from her book in this process). Only rows decided ok, BTC / gold Kalshi 15m, and only while the switch
 *  (data/v111-2-live.json enabled) is on - off = nothing is handed to Kalshi. */
export function liveRows775(rows?: any[]): any[] {
  if (!liveOn775()) return [];
  const src = rows ?? [...((G.__v1112?.rows as any[] | undefined) ?? []), ...((G.__v1112zone798?.rows as any[] | undefined) ?? []) /* fix798: + her zone wick rejections */, ...((G.__v1112fb789?.rows as any[] | undefined) ?? [])]; // fix789: + her next-band takes
  const out: any[] = [];
  for (const r of src) {
    if (!r?.best775?.ok || !r.ticker || !/15M-/.test(String(r.ticker)) || (r.side !== "up" && r.side !== "down")) continue;
    const ask = Number(r.ask) || 0;
    out.push({ id: `${r.ticker}:${LIVE_BOOK775}:${r.id}`, book: LIVE_BOOK775, at: r.at, asset: r.asset, ticker: r.ticker, side: r.side, setup: String(r.setup || ""), ask, multiple: Number(r.multiple) || (ask > 0 ? 1 / ask : 0), stake: 5, tpPct: 0, peakPct: 0,
      exit: r.result === "open" ? undefined : r.soldBid != null ? "sold" : "held to the bell", soldAt: undefined, sellBid: null, result: r.result === "open" ? "open" : r.result, pnl: r.pnlTp == null ? null : Math.round(Number(r.pnlTp) * 25) / 100, bands: null, spot: null, event: null, hourPT: Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date(r.at))) % 24 });
  }
  return out;
}
