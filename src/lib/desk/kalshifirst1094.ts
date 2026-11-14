// fix1094 KALSHI FIRST, AND THEN PAPER (Love Nov 13 2026 8:21 PM PT: "can you just set up a live wire to go to KALSHI first - and THEN paper ??? for the books we have running, when they are running?").
// For a book that is running live (data/live-switch.json: live on, liveBook.books), her call still goes to Kalshi the way it always has, and paper's record is then
// written from KALSHI'S ANSWER (data/live-book-done.json), never from the call alone:
//   Kalshi took it      -> once paper has closed it, the row's dollars are counted from what Kalshi really charged (the call's price stays on the row as paperAsk)
//   Kalshi did not take -> once paper has closed it, the row is "missed": no trade, no dollars, with the written reason (what paper alone would have scored stays on the row as paper1094)
//   that book was not the one running live that hour, or LIVE is off -> paper is left exactly as it is
// Additions only: nothing in her read, her walls, her order or her exits is touched. Only calls made after this went in are settled this way (data/kalshi-first-1094.json).
import { appendFileSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
export const NOT_RUNNING_1094 = /takes this hour live|live only in Love's rejection hours|own hours: NEW takes|live run has ended/;
function since1094(nowMs: number): number {
  const G = globalThis as any;
  if (G.__kf1094Since > 0) return G.__kf1094Since;
  let s = 0;
  try { s = Date.parse(String(JSON.parse(readFileSync(D("kalshi-first-1094.json"), "utf8")).since)); } catch {}
  if (!(s > 0)) { s = nowMs; try { writeFileSync(D("kalshi-first-1094.json"), JSON.stringify({ since: new Date(nowMs).toISOString(), note: "KALSHI FIRST, AND THEN PAPER (fix1094): calls made from this moment are settled on paper from Kalshi's answer" }, null, 1)); } catch { return 0; } }
  G.__kf1094Since = s;
  return s;
}
function running1094(): string[] {
  const G = globalThis as any;
  try {
    const p = D("live-switch.json"), st = statSync(p), c = G.__kf1094Sw;
    if (c && c.m === st.mtimeMs && c.s === st.size) return c.b;
    const sw = JSON.parse(readFileSync(p, "utf8"));
    const b = sw && sw.live === true && sw.liveBook && Array.isArray(sw.liveBook.books) && Number(sw.liveBook.dollars) > 0 ? sw.liveBook.books.map(String) : [];
    G.__kf1094Sw = { m: st.mtimeMs, s: st.size, b };
    return b;
  } catch { return []; }
}
function done1094(): any {
  const G = globalThis as any;
  try {
    const p = D("live-book-done.json"), st = statSync(p), c = G.__doneDoc;
    if (c && c.m === st.mtimeMs && c.s === st.size) return c.v;
    const c2 = G.__kf1094Done;
    if (c2 && c2.m === st.mtimeMs && c2.s === st.size) return c2.v;
    const v = JSON.parse(readFileSync(p, "utf8"));
    G.__kf1094Done = { m: st.mtimeMs, s: st.size, v };
    return v;
  } catch { return null; }
}
const say1094 = (o: any) => { try { appendFileSync(D("kalshi-first-1094.jsonl"), JSON.stringify(o) + "\n"); } catch {} };
// Kalshi took it and paper has closed it: the row's dollars are counted from what Kalshi charged. Same contracts-for-$20 sum paper uses, at Kalshi's price:
// (paper's dollars + stake) x call price / Kalshi's price - stake. The exit is still paper's own exit. A "paid" more than 5c under the call is Kalshi's blended
// cost of a position it already held (her own Oct 8 rule in nightbook.setPaperFill), and no price on record means no re-count: the call's price stands and the row says so.
function price1094(r: any, nowMs: number) {
  const paid = Number(r.kalshiPaid1094), ask = Number(r.ask), stake = Number(r.stake) || 20;
  r.k1094 = "took";
  if (paid > 0.02 && paid < 0.99 && ask > 0 && !(paid < ask - 0.05) && r.pnl != null && r.paperAsk == null) {
    r.paper1094 = { result: r.result, pnl: r.pnl, ask };
    r.paperAsk = ask; r.ask = r2(paid); r.multiple = r2(1 / paid);
    r.pnl = r2((Number(r.paper1094.pnl) + stake) * (ask / paid) - stake);
    if (r.result === "win" || r.result === "loss") r.result = r.pnl > 0.05 ? "win" : "loss";
  } else r.note1094 = !(paid > 0.02 && paid < 0.99) ? "Kalshi took it; her order record holds no price for it, so the call's price stands" : paid < ask - 0.05 ? "Kalshi took it; the price on record is more than 5c under the call (a blended position cost), so the call's price stands" : "Kalshi took it; the call's price stands";
  say1094({ at: new Date(nowMs).toISOString(), id: r.id, lane: r.lane, ticker: r.ticker, side: r.side, kalshi: "took - counted", paid: paid > 0 ? paid : null, call: r.paperAsk ?? ask, pnl: r.pnl, paperAlone: r.paper1094 ?? null, note: r.note1094 || "" });
}
/** Settles paper's rows from Kalshi's answer. Returns true when a row changed (so the book is saved). */
export function kalshiFirst1094(rows: any[], nowMs: number = Date.now()): boolean {
  const books = running1094();
  if (!books.length || !Array.isArray(rows)) return false; // LIVE off / no book running: paper is left exactly as it is
  const since = since1094(nowMs);
  if (!(since > 0)) return false;
  const done = done1094();
  if (!done || typeof done !== "object") return false; // Kalshi's record cannot be read this second: nothing is settled, next look
  let changed = false;
  for (const r of rows) {
    if (!r || r.k1094 === "took" || r.k1094 === "no" || r.k1094 === "not-running" || !books.includes(String(r.lane))) continue;
    if (!(Date.parse(String(r.at)) >= since)) continue;
    if (r.k1094 === "took-open") { // Kalshi took it; her exits run on the open call untouched; the dollars are counted from Kalshi's price once paper has closed it
      if (r.result === "open" || r.pnl == null) continue;
      price1094(r, nowMs); changed = true; continue;
    }
    const d = done[`${r.id}:${r.id}`];
    if (!d || String(d.ticker) !== String(r.ticker)) continue; // Kalshi has not answered yet: the call waits
    const st = String(d.status || ""), why = String(d.reason || "");
    if (st === "filled" || st === "partial") {
      r.kalshiPaid1094 = Number(d.paid) > 0 ? Number(d.paid) : null; r.kalshiAt1094 = String(d.at || "");
      if (r.result === "open" || r.pnl == null) { r.k1094 = "took-open"; say1094({ at: new Date(nowMs).toISOString(), id: r.id, lane: r.lane, ticker: r.ticker, side: r.side, kalshi: "took", paid: r.kalshiPaid1094, call: r.ask }); }
      else price1094(r, nowMs);
      changed = true;
    } else if (d.final === true || st === "missed") {
      if (NOT_RUNNING_1094.test(why)) { r.k1094 = "not-running"; changed = true; continue; } // that book does not trade live this hour: paper as it is
      if (r.result === "open") continue; // her call is still open on paper: nothing about her window changes here; it is settled the moment paper closes it
      r.paper1094 = { result: r.result, pnl: r.pnl ?? null, exit: r.exit ?? null };
      r.k1094 = "no"; r.kalshiAt1094 = String(d.at || "");
      r.result = "missed"; r.pnl = null;
      r.exit = `KALSHI FIRST (fix1094): Kalshi did not take it - ${why.slice(0, 220) || st}`;
      say1094({ at: new Date(nowMs).toISOString(), id: r.id, lane: r.lane, ticker: r.ticker, side: r.side, kalshi: "did not take it", status: st, why: why.slice(0, 300), first: String(d.firstReason || "").slice(0, 200), tries: d.tries ?? null, paperAlone: r.paper1094 });
      changed = true;
    }
  }
  return changed;
}
