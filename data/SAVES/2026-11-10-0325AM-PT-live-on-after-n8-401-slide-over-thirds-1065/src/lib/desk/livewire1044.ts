// fix1044 LIVE WIRE + WTF BOOK (Love Nov 9 2026 ~11:09 AM PT: "i need you to make a whole new tab for me to see the trades going out on each book luvv / LIVE WIRE / just every trade thats going out on every book WHEN they're going out , and on which book / but it needs to update with price ... make the numbers move with price for me pls" + "WTF BOOK / EVERY TRADE THAT WAS A WTF !!! GOING FORWARD GETS LOGGED AND TRACKED DATE & TIME" + her card pick "Tap + auto-log").
// DISPLAY + LOG ONLY. Reads every book's own trade rows (night-book.json, grok-og.json - the lanes incl. main / rej / delayed - and the paper books' files through paperrows.ts).
// It never places, sizes, cancels, blocks or changes an order, a wall or a switch. The WTF book is its own file: data/wtf-book.jsonl.
import { createServerFn } from "@tanstack/react-start";

const G = globalThis as any;
async function fsx() { const fs = await import("node:fs"); const { join } = await import("node:path"); return { fs, D: (...p: string[]) => join(process.cwd(), "data", ...p) }; }
export type Wire1044 = { id: string; book: string; at: string; asset: string; ticker: string; side: string; setup: string; ask: number; stake: number; result: string; pnl: number | null; exit: string; spot: number; lastBid?: number; venue?: "kalshi" | "poly"; real?: boolean; contracts?: number; proceeds?: number };
// the books that are meant to follow HER rules - only these are judged for the auto WTF (the inverse / momentum / other books break them on purpose); her tap works on every book
export const AUTO_BOOKS1044 = new Set(["recon-tog", "recon-rej", "recon-dly", "recon-dlyk", "recon-togp", "recon-togr", "recon-np", "recon-rjnp", "recon-rnp"]);
const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
function norm(r: any, src: string): Wire1044 | null {
  if (!r || typeof r !== "object" || !r.ticker || !r.at) return null;
  const ask = num(r.ask) > 0 ? num(r.ask) : num(r.multiple) > 1 ? 1 / num(r.multiple) : 0;
  const pnl = r.pnl != null ? num(r.pnl) : r.profit != null ? num(r.profit) : null;
  return { id: String(r.id || `${r.ticker}:${r.book || r.lane}:${r.at}`), book: String(r.book || r.lane || src), at: String(r.at), asset: String(r.asset || ""), ticker: String(r.ticker), side: String(r.side || ""), setup: String(r.setup || r.label || r.pattern || ""), ask, stake: num(r.stake) > 0 ? num(r.stake) : 20, result: String(r.result || (pnl == null ? "open" : "closed")), pnl, exit: String(r.exit || ""), spot: num(r.spotAt) || num(r.spot), lastBid: num(r.lastBid), venue: r.venue, real: r.real === true, contracts: r.contracts, proceeds: r.proceeds };
}
async function readJ(file: string): Promise<any> {
  const { fs, D } = await fsx(); const p = D(file); const C = (G.__lw1044c ||= {});
  try { const m = fs.statSync(p).mtimeMs; if (C[file] && C[file].m === m) return C[file].v; const v = JSON.parse(fs.readFileSync(p, "utf8")); C[file] = { m, v }; return v; } catch { return C[file]?.v ?? null; }
}
const COPY_LEDGERS = [
  { book: "eth2872", file: "eth2-live-872.jsonl", asset: "eth", venue: "kalshi" },
  { book: "eth831", file: "eth-live-831.jsonl", asset: "eth", venue: "kalshi" },
  { book: "btc2c899", file: "btc2c-live-899.jsonl", asset: "btc", venue: "kalshi" },
  { book: "bnb940", file: "bnb-live-940.jsonl", asset: "bnb", venue: "kalshi" },
  { book: "polymom830", file: "poly-mom-830.jsonl", asset: "btc", venue: "poly" },
  { book: "poly-mirror", file: "poly-mirror-log.jsonl", asset: "btc", venue: "poly" },
] as const;

async function readJsonLines(file: string): Promise<any[]> {
  const { fs, D } = await fsx();
  const path = D(file), cache = (G.__lw1044Lines ||= {});
  try {
    const stamp = fs.statSync(path);
    const key = `${stamp.mtimeMs}:${stamp.size}`;
    if (cache[file]?.key === key) return cache[file].rows;
    const rows = fs.readFileSync(path, "utf8").split("\n").flatMap((line) => {
      try { return [JSON.parse(line)]; } catch { return []; }
    });
    cache[file] = { key, rows };
    return rows;
  } catch { return []; }
}

async function copyTrades1044(): Promise<Wire1044[]> {
  const bells = await readJ("window-results.json") ?? {};
  const out: Wire1044[] = [];
  for (const ledger of COPY_LEDGERS) {
    const positions = new Map<string, Wire1044>();
    for (const event of await readJsonLines(ledger.file)) {
      if (!event?.id) continue;
      const action = event.action ?? event.status, id = String(event.id);
      const quantity = num(event.filled ?? event.contracts), price = num(event.px ?? event.price);
      let row = positions.get(id);
      if ((action === "bought" || /^add-on(?: |$)/.test(action)) && quantity > 0 && price > 0) {
        if (!row) {
          if (action !== "bought" || !event.at) continue;
          const ticker = ledger.venue === "poly" ? event.slug : id.split(":")[0];
          if (!ticker) continue;
          row = { id: `live:${ledger.book}:${id}`, book: ledger.book, asset: ledger.asset, venue: ledger.venue, real: true, ticker, at: event.at, side: event.side, setup: event.setup ?? event.label ?? "", ask: price, stake: 0, result: "open", pnl: null, exit: "", spot: 0, contracts: 0, proceeds: 0 };
          positions.set(id, row);
        }
        row.stake += quantity * price;
        row.contracts = (row.contracts ?? 0) + quantity;
        continue;
      }
      if (!row) continue;
      if (action === "sold half" || action === "sold the rest" || action === "sold") {
        const sold = num(event.out?.filled ?? quantity);
        row.contracts = Math.max(0, (row.contracts ?? 0) - sold);
        row.proceeds = (row.proceeds ?? 0) + num(event.out?.payout ?? sold * price);
        if (sold > 0 && row.contracts < 0.01) {
          row.pnl = row.proceeds - row.stake;
          row.result = "closed";
          row.exit = "sold";
        }
      } else if (action === "bell" && row.result === "open") {
        row.result = "settling";
        const result = bells[id.split(":")[0]];
        if (result === "yes" || result === "no") {
          const won = (result === "yes") === (row.side === "up");
          row.pnl = (row.proceeds ?? 0) + (won ? row.contracts ?? 0 : 0) - row.stake;
          row.result = won ? "win" : "loss";
          row.exit = "settled at the bell";
        }
      }
    }
    out.push(...positions.values());
  }
  return out;
}
/** every book's trades of the last `hours`, newest first */
export async function wireRows1044(hours = 24, cap = 600): Promise<Wire1044[]> {
  const cut = Date.now() - hours * 3600000, out: Wire1044[] = [];
  const push = (rows: any, src: string) => { if (!Array.isArray(rows)) return; for (let i = rows.length - 1; i >= 0; i--) { const w = norm(rows[i], src); if (w && !/^(xrp5m961|btc5m1055|eth5m1055)$/.test(String(w.book)) /* fix1055 her real 5m lanes */ && (Number((w as any)?.ask) > 0.66)) continue; /* fix1053 her record: no paper ticket over her 66c floor (her real XRP lane is never hidden) */ if (w && Date.parse(w.at) >= cut) out.push(w); } };
  push(await readJ("night-book.json"), "night");
  const og = await readJ("grok-og.json"); push(Array.isArray(og) ? og : og?.rows, "lane");
  try { const pr = await import("./paperrows"); push(pr.paperBookRows721().filter((r: any) => !String(r.book).startsWith("p5m-")), "paper"); } catch {}
  // fix1045: the 5m paper books straight from their files, with the live bid they track (so LIVE WIRE moves on them too)
  for (const c of ["btc", "eth", "xrp", "xrp15k"]) { const b = await readJ(`p5m-1045-${c}.json`); if (Array.isArray(b?.rows)) push(b.rows.map((r: any) => ({ ...r, book: `p5m-${c}`, venue: c === "xrp15k" ? "kalshi" : "poly" })), "p5m"); }
  // her XRP 5m Polymarket lane + PERPLEXITIES (paper twin): their own files; only windows that actually bought (or paper-bought), not the skipped looks
  for (const [file, book, stake] of [["xrp5m-961-book.json", "xrp5m961", 0], ["btc5m-1055-book.json", "btc5m1055", 0] /* fix1055 */, ["eth5m-1055-book.json", "eth5m1055", 0] /* fix1055 */, ["perplexities-book.json", "PERPLEXITIES", 20]] as [string, string, number][]) {
    const b = await readJ(file); const rs = Array.isArray(b?.rows) ? b.rows : [];
    push(rs.filter((r: any) => /bought/i.test(String(r.live || ""))).map((r: any) => { const f = /bought ([\d.]+) @ ([\d.]+)/.exec(String(r.live || "")); const st = stake || (f ? Number(f[1]) * Number(f[2]) : 1);
      const done = r.result === "win" || r.result === "loss"; return { id: `${book}:${r.id}`, book, at: r.at, asset: book.startsWith("btc") ? "btc" : book.startsWith("eth") ? "eth" : "xrp" /* fix1055 */, venue: "poly", real: book !== "PERPLEXITIES", ticker: r.slug || r.id, side: r.side, setup: r.label, ask: f ? Number(f[2]) : Number(r.ask), stake: st,
        result: done ? r.result : Date.parse(String(r.closesAt || "")) > Date.now() ? "open" : "settling", pnl: done ? (r.perDollar != null ? Number(r.perDollar) * st : r.result === "win" ? st * (1 / (Number(r.ask) || 0.5) - 1) : -st) : null, exit: done ? "settled at the 5m close" : "", spot: Number(r.spot) || 0 }; }), book);
  }
  const xrp15 = await readJ("xrp15k-live-book.json"); // fix1057 live fills have their own record
  if (Array.isArray(xrp15?.rows)) push(xrp15.rows.filter((r: any) => r.orderId).map((r: any) => ({
    ...r, id: `xrp15k:${r.ticker}`, book: "xrp15k", asset: "xrp", venue: "kalshi", real: true,
    contracts: r.remaining, proceeds: r.proceeds,
  })), "xrp15k");
  for (const row of await copyTrades1044()) if (Date.parse(row.at) >= cut) out.push(row);
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
/** Shared quotes by market, with one in-flight read per market across viewers. */
export async function markWire1044(rows: Wire1044[], read: (venue: "poly" | "kalshi", ticker: string) => Promise<{ up: number; down: number } | null>) {
  const cache = (G.__lw1044Marks ||= new Map()) as Map<string, { until: number; value: Promise<{ up: number; down: number } | null> }>;
  const now = Date.now();
  for (const [key, value] of cache) if (value.until + 60000 < now) cache.delete(key);
  await Promise.all(rows.map(async (row) => {
    if (row.result !== "open" || !row.venue || row.lastBid) return;
    const key = `${row.venue}:${row.ticker}`;
    let quote = cache.get(key);
    if (!quote || quote.until < now) {
      quote = { until: now + 1800, value: read(row.venue, row.ticker).catch(() => null) };
      cache.set(key, quote);
    }
    const price = await quote.value;
    row.lastBid = price ? (row.side === "down" ? price.down : price.up) : undefined;
  }));
  return rows;
}
export const getLiveWire1044 = createServerFn({ method: "GET" }).handler(async (): Promise<{ at: string; rows: Wire1044[] }> => {
  const rows = await wireRows1044(24);
  await markWire1044(rows, async (venue, ticker) => {
    if (venue === "poly") {
      const top = await (await import("./poly-live.server")).bookTop(ticker);
      return top ? { up: top.bid, down: 1 - top.ask } : null;
    }
    const market = await (await import("./kalshi")).fetchMarket(ticker);
    return market ? { up: Number(market.yesBid), down: Number(market.noBid) } : null;
  });
  return { at: new Date().toISOString(), rows };
});
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

