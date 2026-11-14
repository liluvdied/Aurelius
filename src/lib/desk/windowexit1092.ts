// fix1092 ONE POSITION A WINDOW, AND NOTHING AFTER IT IS EXITED (Love Nov 11 2026 4:11 PM PT: "hun it is still entering positions after exiting the first one , can you look into it pls?" +
// asked 4:13 PM PT "Once a position in a window has been exited, she opens nothing more in that window. Every book, every asset. Yes?" - Love 4:15 PM PT: "yes i noticed it yesterday" +
// Love Oct 15 2026 ~6:50 PM PT: "i do not want her to be able to get a second order out again"). Her 4:00 PM Nov 11 XRP window: a short from outside her desk was closed at 4:10:18 PM and her
// XRP book opened a long at 4:10:53 PM, because it only asked "is there a position on this window right now".
// HOW: every full read of her Kalshi positions passes through notePositions1092. A 15-minute or 5-minute window that was seen holding a position and is then seen holding none is marked
// exited (hers, a hand trade or an outside order - whoever opened or closed it). exited1092 is asked at the one door every opening order leaves by (guardKalshiOrder in kalshi-live.server.ts).
// A position that is only partly sold is still held: it is not exited, and her add-ons on it go on as she set them. Exits are never stopped. Nothing here reads or changes a trading rule.
import { appendFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const WIN1092 = /^KX[A-Z0-9]+(?:15M|5M)-/;
type S1092 = { held: Record<string, number>; exited: Record<string, number> };
const file1092 = () => join(process.cwd(), "data", "window-exited-1092.json");
function st1092(): S1092 {
  const G = globalThis as any;
  if (!G.__wx1092) { let s: S1092 = { held: {}, exited: {} }; try { const j = JSON.parse(readFileSync(file1092(), "utf8")); if (j && typeof j === "object") s = { held: { ...(j.held || {}) }, exited: { ...(j.exited || {}) } }; } catch {} G.__wx1092 = s; }
  return G.__wx1092 as S1092;
}
function save1092(s: S1092): void { try { writeFileSync(file1092() + ".tmp", JSON.stringify(s)); renameSync(file1092() + ".tmp", file1092()); } catch {} }
/** every full read of her positions: rows = Kalshi's market_positions; complete = the whole list (no more pages, no ticker filter) */
export function notePositions1092(rows: any, complete: boolean, now: number = Date.now()): void {
  try {
    if (!Array.isArray(rows)) return;
    const s = st1092(); let changed = false; const seen: Record<string, true> = {};
    for (const r of rows) { const t = String(r?.ticker || ""); if (!WIN1092.test(t)) continue; const p = Number.parseFloat(String(r?.position_fp ?? r?.position ?? "0")); if (!Number.isFinite(p) || Math.abs(p) < 0.01) continue; seen[t] = true; if (!s.held[t]) changed = true; s.held[t] = now; }
    if (complete) for (const t of Object.keys(s.held)) { if (seen[t] || s.exited[t]) continue; s.exited[t] = now; changed = true; // fix1092: it was held and now it is not - this window has had its position
      try { appendFileSync(join(process.cwd(), "data", "window-exited-1092.jsonl"), JSON.stringify({ at: new Date(now).toISOString(), ticker: t, lastHeldAt: new Date(s.held[t]).toISOString(), note: "position in this window is gone - nothing more opens in it (fix1092)" }) + "\n"); } catch {} }
    for (const k of Object.keys(s.held)) if (now - s.held[k] > 3 * 3600000) { delete s.held[k]; delete s.exited[k]; changed = true; } // long past its window
    if (changed) save1092(s);
  } catch {}
}
/** the one question at the door: has a position in this window already been exited? "" = no */
export function exited1092(ticker: string): string {
  try { const t = String(ticker || ""); if (!WIN1092.test(t)) return ""; const at = Number(st1092().exited[t]) || 0; if (!(at > 0)) return "";
    return `ONE POSITION A WINDOW (fix1092): a position in this window was already exited (seen gone at ${new Date(at).toISOString().slice(11, 19)}Z) - she opens nothing more in it.`;
  } catch { return ""; }
}
