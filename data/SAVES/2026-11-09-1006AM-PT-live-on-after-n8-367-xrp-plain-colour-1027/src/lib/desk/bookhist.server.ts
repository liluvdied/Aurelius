// WHOLE RECORD ON TAP (Oct 19 ~1:00 PM PT, Love: "it won't let me pull anything older up since the fix that freed up the speed on the page... can you fix
// that hun? for all the books?"). Server-only (imported inside the server functions, never by the page): the card's history used to read only the newest
// 6 MB of the exit ledger (about a day), and the scanner-lane books (break books, pivot books...) keep their older rows in grok-og-archive.jsonl, which it
// never read. The ledger is parsed once and then only its new bytes, so a tap doesn't re-read the file.
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
function ledgerAllRows(): any[] {
  try {
    const file = join(process.cwd(), "data", "exit-ledger.jsonl");
    const st = statSync(file);
    let c = G.__ledAll as { size: number; rem: string; rows: any[] } | undefined;
    if (!c || st.size < c.size) c = G.__ledAll = { size: 0, rem: "", rows: [] };
    if (st.size > c!.size) {
      const fd = openSync(file, "r");
      try {
        const buf = Buffer.alloc(st.size - c!.size);
        readSync(fd, buf, 0, buf.length, c!.size);
        const parts = (c!.rem + buf.toString("utf8")).split("\n");
        c!.rem = parts.pop() ?? "";
        for (const l of parts) { if (!l) continue; try { c!.rows.push(JSON.parse(l)); } catch {} }
        c!.size = st.size;
      } finally { closeSync(fd); }
    }
    return c!.rows;
  } catch { return G.__ledAll?.rows ?? []; }
}
/** A RUN card's whole record: every ledger row for the book + the archived rows of every lane that copies as that book. */
export async function wholeBookHistory(book: string, liveIds: Set<string>): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  for (const e of ledgerAllRows()) {
    if (!e || e.book !== book || !e.id || liveIds.has(e.id) || seen.has(e.id) || e.stale || e.dnaMode || typeof e.pnl !== "number") continue;
    seen.add(e.id);
    out.push({ ...e, ticker: e.ticker || String(e.id).split(":")[0], result: e.result || (e.pnl > 0.05 ? "win" : e.pnl < -0.05 ? "loss" : "flat"), fromLedger: true });
  }
  try {
    const gk = await import("./grokog");
    const { archiveRows } = await import("./archcache");
    const lanes = new Set(Object.entries(gk.LANE_BOOK).filter(([, b]) => b === book).map(([l]) => l));
    if (lanes.size) {
      const cur = new Set([...(gk.asNightRows() as any[]), ...(gk.archiveNightRows() as any[])].map((r) => String(r.id))); // already on the card
      const arch = (archiveRows() as any[]).filter((r) => r && lanes.has(r.lane) && r.pnl != null).reverse(); // newest copy of a row first
      for (const e of gk.asNightRows(arch) as any[]) {
        const id = String(e.id);
        if (cur.has(id) || liveIds.has(id) || seen.has(id) || typeof e.pnl !== "number") continue;
        seen.add(id);
        out.push({ ...e, result: e.result || (e.pnl > 0.05 ? "win" : e.pnl < -0.05 ? "loss" : "flat"), fromLedger: true });
      }
    }
  } catch {}
  out.sort((x, y) => (String(x.at) < String(y.at) ? 1 : -1));
  return out.slice(0, 10000);
}
/** ALL ON THE CARDS (Oct 19 ~1:55 PM PT, Love: "the card only 14W/3L when i hit ALL / i don't know her actual hit rate over all time / can you fix that for
 * all of the cards"): every archived lane row (grok-og-archive.jsonl) as [book, atMs, pnl], newest copy of each row, built once per archive size. Rows the
 * cards already count (exclude) are left out so nothing is counted twice. */
export async function laneArchiveHist(exclude: Set<string>): Promise<[string, number, number][]> {
  const gk = await import("./grokog");
  const { archiveRows } = await import("./archcache");
  const arch = archiveRows() as any[];
  let c = G.__laneHist as { n: number; rows: [string, string, number, number][] } | undefined;
  if (!c || c.n !== arch.length) {
    const byId = new Map<string, [string, string, number, number]>();
    for (const r of arch) {
      if (!r || r.pnl == null || typeof r.pnl !== "number" || r.result === "open" || !r.id || !r.ticker) continue;
      const book = (gk.LANE_BOOK as Record<string, string>)[r.lane || "grok"];
      if (!book) continue;
      const t = Date.parse(r.at);
      if (!Number.isFinite(t)) continue;
      const id = `${r.ticker}:${book}:${r.id}`;
      byId.set(id, [id, book, t, Number(r.pnl)]);
    }
    c = G.__laneHist = { n: arch.length, rows: [...byId.values()] };
  }
  const out: [string, number, number][] = [];
  for (const [id, book, t, p] of c!.rows) if (!exclude.has(id)) out.push([book, t, p]);
  return out;
}
