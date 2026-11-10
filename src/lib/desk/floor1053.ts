// fix1053 HER 1.5x FLOOR ON EVERY PAPER BOOK (Love Nov 9 2026 9:28 PM PT: "Do not let her take any trades under the floor because it makes the whole record corrupted and it's not true because she wouldn't take those trades so going forward take all of those out and block them on paper too please"):
// a paper ticket over her 66c (under her 1.5x - the same floor as live: fix520, FLOOR1045 0.66) is never booked from the moment this went in - every paper writer drops it
// before it reaches its file (logged once in data/floor-1053.jsonl); her record (cards, tables, LIVE WIRE, book grid, whole-book history) counts no paper ticket over 66c,
// old ones included - those older rows stay in their files untouched (nothing deleted), they are only left out of her record. Real-money trades are never touched.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
export const FLOOR1053 = 0.66; // her 1.5x floor: 66c
const D = (f: string) => join(process.cwd(), "data", f), G = globalThis as any;
export function since1053(): number {
  if (G.__since1053) return G.__since1053; let s = 0;
  try { s = Date.parse(String(JSON.parse(readFileSync(D("floor-1053.json"), "utf8")).since)) || 0; } catch {}
  if (!s) { s = Date.now(); try { writeFileSync(D("floor-1053.json"), JSON.stringify({ since: new Date(s).toISOString(), what: "fix1053: from this moment no paper book books a ticket over her 66c floor" })); } catch {} }
  return (G.__since1053 = s);
}
/** a ticket over her floor (ask above 66c) */
export function over1053(r: any): boolean { const a = Number(r?.ask); return Number.isFinite(a) && a > FLOOR1053 + 1e-9; }
/** her record keeps it: not over her floor */
export function keep1053(r: any): boolean { return !over1053(r); }
/** drops (in place) every paper ticket over her floor booked since fix1053 went in; returns the same array */
export function purge1053<T>(rows: T[], book: string): T[] {
  if (!Array.isArray(rows)) return rows; const since = since1053(), L: Set<string> = (G.__log1053 ||= new Set<string>());
  for (let i = rows.length - 1; i >= 0; i--) { const r: any = rows[i]; if (!r || typeof r !== "object" || !over1053(r)) continue;
    const t = Date.parse(String(r.at ?? r.openedAt ?? "")); if (!(t >= since)) continue;
    rows.splice(i, 1); const k = book + "|" + String(r.id ?? t);
    if (!L.has(k)) { L.add(k); try { appendFileSync(D("floor-1053.jsonl"), JSON.stringify({ at: new Date().toISOString(), book, id: r.id ?? null, side: r.side ?? null, ask: r.ask, why: "UNDER HER 1.5x FLOOR (fix1053): over 66c - not booked on paper" }) + "\n"); } catch {} } }
  return rows;
}
// fix1053: shared through globalThis so no other module imports this file (her self-checks load single modules on their own)
(globalThis as any).__purge1053 = purge1053; (globalThis as any).__over1053 = over1053;
