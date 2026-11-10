// fix1044 LIVE WIRE + WTF BOOK (Love Nov 9 2026 ~11:09 AM PT: "i need you to make a whole new tab for me to see the trades going out on each book luvv / LIVE WIRE / just every trade thats going out on every book WHEN they're going out , and on which book / but it needs to update with price ... make the numbers move with price for me pls" + "WTF BOOK / EVERY TRADE THAT WAS A WTF !!! GOING FORWARD GETS LOGGED AND TRACKED DATE & TIME" + her card pick "Tap + auto-log").
// DISPLAY + LOG ONLY. Reads every book's own trade rows (night-book.json, grok-og.json - the lanes incl. main / rej / delayed - and the paper books' files through paperrows.ts).
// It never places, sizes, cancels, blocks or changes an order, a wall or a switch. The WTF book is its own file: data/wtf-book.jsonl.
import { createServerFn } from "@tanstack/react-start";

const G = globalThis as any;
async function fsx() { const fs = await import("node:fs"); const { join } = await import("node:path"); return { fs, D: (...p: string[]) => join(process.cwd(), "data", ...p) }; }
export type Wire1044 = { id: string; book: string; at: string; asset: string; ticker: string; side: string; setup: string; ask: number; stake: number; result: string; pnl: number | null; exit: string; spot: number; lastBid?: number };
// the books that are meant to follow HER rules - only these are judged for the auto WTF (the inverse / momentum / other books break them on purpose); her tap works on every book
export const AUTO_BOOKS1044 = new Set(["recon-tog", "recon-rej", "recon-dly", "recon-dlyk", "recon-togp", "recon-togr", "recon-np", "recon-rjnp", "recon-rnp"]);
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
function norm(r: any, src: string): Wire1044 | null {
  if (!r || typeof r !== "object" || !r.ticker || !r.at) return null;
  const ask = num(r.ask) > 0 ? num(r.ask) : num(r.multiple) > 1 ? 1 / num(r.multiple) : 0;
  const pnl = r.pnl != null ? num(r.pnl) : r.profit != null ? num(r.profit) : null;
  return { id: String(r.id || `${r.ticker}:${r.book || r.lane}:${r.at}`), book: String(r.book || r.lane || src), at: String(r.at), asset: String(r.asset || ""), ticker: String(r.ticker), side: String(r.side || ""), setup: String(r.setup || r.label || r.pattern || ""), ask, stake: num(r.stake) > 0 ? num(r.stake) : 20, result: String(r.result || (pnl == null ? "open" : "closed")), pnl, exit: String(r.exit || ""), spot: num(r.spotAt) || num(r.spot), lastBid: num(r.lastBid) };
}
async function readJ(file: string): Promise<any> {
  const { fs, D } = await fsx(); const p = D(file); const C = (G.__lw1044c ||= {});
  try { const m = fs.statSync(p).mtimeMs; if (C[file] && C[file].m === m) return C[file].v; const v = JSON.parse(fs.readFileSync(p, "utf8")); C[file] = { m, v }; return v; } catch { return C[file]?.v ?? null; }
}
/** every book's trades of the last `hours`, newest first */
export async function wireRows1044(hours = 24, cap = 600): Promise<Wire1044[]> {
  const cut = Date.now() - hours * 3600000, out: Wire1044[] = [];
  const push = (rows: any, src: string) => { if (!Array.isArray(rows)) return; for (let i = rows.length - 1; i >= 0; i--) { const w = norm(rows[i], src); if (w && w.book !== "xrp5m961" && (Number((w as any)?.ask) > 0.66)) continue; /* fix1053 her record: no paper ticket over her 66c floor (her real XRP lane is never hidden) */ if (w && Date.parse(w.at) >= cut) out.push(w); } };
  push(await readJ("night-book.json"), "night");
  const og = await readJ("grok-og.json"); push(Array.isArray(og) ? og : og?.rows, "lane");
  try { const pr = await import("./paperrows"); push(pr.paperBookRows721().filter((r: any) => !String(r.book).startsWith("p5m-")), "paper"); } catch {}
  // fix1045: the 5m paper books straight from their files, with the live bid they track (so LIVE WIRE moves on them too)
  for (const c of ["btc", "eth", "xrp", "xrp15k"]) { const b = await readJ(`p5m-1045-${c}.json`); if (Array.isArray(b?.rows)) push(b.rows.map((r: any) => ({ ...r, book: `p5m-${c}` })), "p5m"); }
  // her XRP 5m Polymarket lane + PERPLEXITIES (paper twin): their own files; only windows that actually bought (or paper-bought), not the skipped looks
  for (const [file, book, stake] of [["xrp5m-961-book.json", "xrp5m961", 0], ["perplexities-book.json", "PERPLEXITIES", 20]] as [string, string, number][]) {
    const b = await readJ(file); const rs = Array.isArray(b?.rows) ? b.rows : [];
    push(rs.filter((r: any) => /bought/i.test(String(r.live || ""))).map((r: any) => { const f = /bought ([\d.]+) @ ([\d.]+)/.exec(String(r.live || "")); const st = stake || (f ? Number(f[1]) * Number(f[2]) : 1);
      const done = r.result === "win" || r.result === "loss"; return { id: `${book}:${r.id}`, book, at: r.at, asset: "xrp", ticker: r.slug || r.id, side: r.side, setup: r.label, ask: Number(r.ask) || (f ? Number(f[2]) : 0), stake: st,
        result: done ? r.result : Date.parse(String(r.closesAt || "")) > Date.now() ? "open" : "settling", pnl: done ? (r.perDollar != null ? Number(r.perDollar) * st : r.result === "win" ? st * (1 / (Number(r.ask) || 0.5) - 1) : -st) : null, exit: done ? "settled at the 5m close" : "", spot: Number(r.spot) || 0 }; }), book);
  }
  const seen = new Set<string>(); const uniq = out.filter((w) => (seen.has(w.id) ? false : (seen.add(w.id), true)));
  return uniq.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, cap);
}
function snapshot1044(asset: string) {
  const L = (G.__lawBands?.[asset]?.L || []) as any[], bars = ((G.__pivBars?.[asset]?.bars || []) as any[]).slice(-10);
  let spot = 0; try { spot = num(G.__q?.[asset]?.c) || num(G.__lastTick?.[asset]); } catch {}
  return { lines: L.map((l: any) => ({ name: l.name, price: Math.round(num(l.price) * 100) / 100 })), bars, spot };
}
async function appendWtf(row: any) { const { fs, D } = await fsx(); fs.appendFileSync(D("wtf-book.jsonl"), JSON.stringify(row) + "\n"); }
async function wtfAll(): Promise<any[]> { const { fs, D } = await fsx(); try { return fs.readFileSync(D("wtf-book.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; } }
/** auto WTF: every 5 s from the engine - a fresh trade (under 30 s old) on one of HER books that her door or her side / colour rule refuses right now is logged with the rule it broke */
export async function wtfTick1044(): Promise<number> {
  try {
    const rows = (await wireRows1044(1)).filter((w) => AUTO_BOOKS1044.has(w.book) && Date.now() - Date.parse(w.at) <= 30000);
    if (!rows.length) return 0;
    const S: Set<string> = (G.__wtf1044Seen ||= new Set((await wtfAll()).filter((x) => x.kind === "auto").map((x) => x.id)));
    const bl = await import("./bandlock"); let n = 0;
    for (const w of rows) {
      if (S.has(w.id)) continue; S.add(w.id);
      const snap = snapshot1044(w.asset); let rule = "";
      try { const d: any = bl.bandLockCheck(w.book, w.asset, w.side, w.ticker, w.setup); if (d && d.ok === false) rule = String(d.reason || "her door refused it"); } catch {}
      if (!rule) { try { const h = (bl as any).herEntry951?.(w.asset, w.side, snap.spot || w.spot, w.setup, G.__lawBands?.[w.asset]?.L || []); if (h) rule = String(h); } catch {} }
      if (!rule || /can't verify/i.test(rule)) continue; // only a real rule, never a missing feed
      await appendWtf({ at: new Date().toISOString(), kind: "auto", id: w.id, book: w.book, asset: w.asset, ticker: w.ticker, side: w.side, setup: w.setup, ask: w.ask, entryAt: w.at, rule: rule.slice(0, 400), ...snap }); n++;
    }
    return n;
  } catch { return 0; }
}
export const getLiveWire1044 = createServerFn({ method: "GET" }).handler(async (): Promise<{ at: string; rows: Wire1044[] }> => ({ at: new Date().toISOString(), rows: await wireRows1044(24) }));
export const addWtf1044 = createServerFn({ method: "POST" })
  .validator((input: { id: string; note?: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const w = (await wireRows1044(48)).find((x) => x.id === data.id); if (!w) return { ok: false };
    await appendWtf({ at: new Date().toISOString(), kind: "tap", id: w.id, book: w.book, asset: w.asset, ticker: w.ticker, side: w.side, setup: w.setup, ask: w.ask, entryAt: w.at, note: String(data.note || "").slice(0, 500), ...snapshot1044(w.asset) });
    return { ok: true };
  });
export const getWtf1044 = createServerFn({ method: "GET" }).handler(async (): Promise<any[]> => {
  const all = await wtfAll(), rows = await wireRows1044(24 * 14), by = new Map(rows.map((r) => [r.id, r]));
  return all.slice(-500).reverse().map((x) => { const r = by.get(x.id); return { ...x, bars: undefined, lines: undefined, result: r?.result ?? "?", pnl: r?.pnl ?? null, exit: r?.exit ?? "" }; });
});

