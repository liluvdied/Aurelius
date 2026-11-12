// fix1080 PAPER IS LIVE (Love Nov 10 2026 1:35 PM PT: "EVERYTHING THAT SHE TOOK ON PAPER , IS WHAT. SHE NEEDS. TO TAKE. LIVE." + 2:42 PM PT, of her 1:48 PM gold short paper took and live did not:
// "matches the rules i said = GOOD"): a MAIN or REJECTION trade her read booked on paper, in the hour that book is live, goes to Kalshi as paper booked it - no hold, door or last-line wall judges
// the setup a second time. Kept: LIVE switch, her umpire (the enforcer), her hour map, hand trades, one trade per window, a fresh price tick, her 1.5x floor (66c) and her sizes. First entries only.
// IT PROVES ITSELF FIRST (Love 2:42 PM PT: "do NOT. SEND ME SOMETHING. THAT DOES NOT WORK."): installed, it is in WATCH mode - she trades exactly as before and every place that would have let a paper
// trade through writes one line to data/paper-live-shadow-1080.jsonl. It only acts once data/paper-is-live-1080.json says {"mode": "on"}. No file / any other mode = watch. Her golden baseline is not touched.
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
const BOOKS1080 = ["recon-tog", "recon-rej"];
let c1080 = { at: 0, on: false };
export function on1080(now: number = Date.now()): boolean {
  if (now - c1080.at >= 0 && now - c1080.at < 1000) return c1080.on;
  let on = false;
  try { on = JSON.parse(readFileSync(join(process.cwd(), "data", "paper-is-live-1080.json"), "utf8"))?.mode === "on"; } catch { on = false; }
  c1080 = { at: now, on };
  return on;
}
function note1080(where: string, key: string, on: boolean): void {
  try { const G = globalThis as any, L = (G.__pl1080Log ||= {}), k = where + "|" + key, t = Date.now(); if (L[k] && t - L[k] < 30000) return; L[k] = t;
    appendFileSync(join(process.cwd(), "data", "paper-live-shadow-1080.jsonl"), JSON.stringify({ at: new Date(t).toISOString(), where, order: key, mode: on ? "on" : "watch" }) + "\n"); } catch {}
}
/** pure: is this copy row a paper booking of her main / rejection read (id ends ":<ticker>:<book>")? */
export function paperRow1080(row: any): boolean {
  try { const b = String(row?.book || ""), t = String(row?.ticker || ""); return BOOKS1080.includes(b) && !!t && (row?.side === "up" || row?.side === "down") && String(row?.id || "").endsWith(`:${t}:${b}`) && !/^FLIP of | - seen as a (short|long) /.test(String(row?.setup || row?.label || "")); } catch { return false; }
}
const key1080 = (book: string, ticker: string, side: string) => `${ticker}|${side}|${book}`;
/** her copy step asks: is this a paper booking that goes as booked? (watch mode: writes the line, answers no) */
export function paperLive1080(row: any): boolean { if (!paperRow1080(row)) return false; const on = on1080(); note1080("copy-step", key1080(String(row.book), String(row.ticker), String(row.side)), on); return on; }
/** the copy step arms the pass for this one order just before it is sent; it lasts 20 s (armed in watch mode too, so the wire can show it would have matched) */
export function arm1080(row: any, now: number = Date.now()): void { if (!paperRow1080(row)) return; const G = globalThis as any; (G.__pl1080 ||= {})[key1080(String(row.book), String(row.ticker), String(row.side))] = now; }
export function disarm1080(row: any): void { try { delete ((globalThis as any).__pl1080 || {})[key1080(String(row.book), String(row.ticker), String(row.side))]; } catch {} }
/** the door / last line ask: did paper book exactly this order (book, ticker, side) within the last 20 s? (watch mode: writes the line, answers no) */
export function pass1080(book: string, ticker: string, side: string, now: number = Date.now()): boolean {
  try { if (!BOOKS1080.includes(String(book))) return false; const k = key1080(String(book), String(ticker), String(side)), t = Number(((globalThis as any).__pl1080 || {})[k]) || 0; if (!(t > 0 && now - t >= 0 && now - t < 20000)) return false; const on = on1080(now); note1080("wire", k, on); return on; } catch { return false; }
}
