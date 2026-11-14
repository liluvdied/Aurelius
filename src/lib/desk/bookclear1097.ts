// fix1097 HER HOURLY CLEAR COVERS HER PAPER BOOK FILE TOO (Love Nov 13 2026 9:11 PM PT: "the late execution is tied to another cache clear - it's several MB worth of
// data attached to something other than the cache" + "it needs to be addressed along with the hourly cache clear and be attached to it" + 9:22 PM PT: "can we include
// that in the hourly clear of that?"). data/live-paper-book.json held every trade since September (3,901 trades, 2.4 MB) and her loop reads and rewrites the whole
// file as it runs. Every hour, with her hourly clear, each CLOSED trade older than 4 days moves into data/live-paper-book-archive.jsonl, one per line - the same
// archive her Oct 27 clear (fix305) made, which her book already knows (writeBook never re-adds an archived trade) and tools/restore-live-book.py puts back.
// 4 days is what her page already asks for (LIGHTER PAGE, Oct 14: "the last 4 days plus anything still open"), so the page gets the same trades as before.
// OPEN trades stay at any age. Nothing is ever deleted. No order, wall, size, switch or setting is touched.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
export const KEEP_DAYS_1097 = 4;
export function bookClear1097(nowMs: number = Date.now(), dir: string = join(process.cwd(), "data")): { moved: number; kept: number } | null {
  const P = join(dir, "live-paper-book.json"), A = join(dir, "live-paper-book-archive.jsonl");
  let book: any; try { book = JSON.parse(readFileSync(P, "utf8")); } catch { return null; }
  if (!book || !Array.isArray(book.trades) || !book.trades.length) return null;
  const cut = nowMs - KEEP_DAYS_1097 * 86400000; const keep: any[] = []; const out: any[] = [];
  for (const t of book.trades) {
    const at = Date.parse(String(t?.closedAt || t?.openedAt || ""));
    if (t && t.id && t.result !== "open" && Number.isFinite(at) && at < cut) out.push(t); else keep.push(t);
  }
  if (!out.length) return { moved: 0, kept: keep.length };
  const have = new Set<string>();
  try { if (existsSync(A)) for (const l of readFileSync(A, "utf8").split("\n")) { if (!l) continue; try { const t = JSON.parse(l); if (t?.id) have.add(String(t.id)); } catch {} } } catch { return null; }
  const at = new Date(nowMs).toISOString(); let lines = "";
  for (const t of out) if (!have.has(String(t.id))) lines += JSON.stringify({ ...t, archivedAt: at, archivedBy: "fix1097 hourly paper book clear" }) + "\n";
  if (lines) appendFileSync(A, lines); // the archive is written FIRST: a trade leaves her book only once it is safely in the archive
  writeFileSync(P + ".trim1097", JSON.stringify({ ...book, trades: keep })); renameSync(P + ".trim1097", P);
  try { appendFileSync(join(dir, "auto-clear.jsonl"), JSON.stringify({ at, file: "live-paper-book.json", moved: out.length, kept: keep.length, by: "fix1097" }) + "\n"); } catch {}
  return { moved: out.length, kept: keep.length };
}
