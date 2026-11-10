// SCOPE (Oct 16 ~3:05 AM PT, Love: "a SCOPE section, that lets me pick a book, and see all of its trades at specific hours.
// i can choose 3 am in a box, and choose (through to) another time, in another box, that shows THAT window across the past few
// days. i want 3 Day, 7 Day, and 1 Month and all - options pls. shows the winrate and p&L for the time window i select... for
// any of our books. so i don't have to scroll thru a bunch of trades to get to 3 am").
// Read-only. Every settled trade of every book: night books (exit-ledger.jsonl + the live night book) and lane books
// (grok-og.json + grok-og-archive.jsonl). Times are Pacific. The ledger is read once, then only its new bytes.
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { join } from "node:path";
import { listNight } from "./nightbook";
import { asNightRows, LANE_BOOK } from "./grokog";
import { archiveRows } from "./archcache";
import { NAMES } from "./dayboard";

export type ScopeTrade = { id: string; book: string; at: number; pnl: number; asset: string; side: string; setup: string; exit: string };

const g = globalThis as unknown as { __scopeLed?: { size: number; rem: string; rows: Map<string, ScopeTrade> } };
const PT_HM = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const PT_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" });

function assetOf(t: string): string {
  const s = String(t || "").toUpperCase();
  return s.includes("GOLD") ? "gold" : s.includes("BTC") ? "btc" : s.includes("SILVER") ? "silver" : s.includes("ETH") ? "eth" : s.includes("SOL") ? "sol" : "";
}
function toTrade(r: any): ScopeTrade | null {
  if (!r || r.stale || r.dnaMode || typeof r.pnl !== "number" || r.result === "open" || !r.book || !r.at) return null;
  const at = Date.parse(r.at);
  if (!Number.isFinite(at)) return null;
  const ticker = r.ticker || String(r.id).split(":")[0];
  return { id: String(r.id), book: String(r.book), at, pnl: Number(r.pnl), asset: r.asset || assetOf(ticker), side: String(r.side || ""), setup: String(r.setup || r.label || ""), exit: String(r.exit || r.result || "") };
}

function ledgerTrades(): Map<string, ScopeTrade> {
  const file = join(process.cwd(), "data", "exit-ledger.jsonl");
  let c = g.__scopeLed;
  try {
    const st = statSync(file);
    if (!c || st.size < c.size) c = g.__scopeLed = { size: 0, rem: "", rows: new Map() };
    if (st.size > c.size) {
      const fd = openSync(file, "r");
      const buf = Buffer.alloc(st.size - c.size);
      readSync(fd, buf, 0, buf.length, c.size);
      closeSync(fd);
      const parts = (c.rem + buf.toString("utf8")).split("\n");
      c.rem = parts.pop() ?? "";
      for (const line of parts) {
        if (!line.trim()) continue;
        try { const t = toTrade(JSON.parse(line)); if (t) c.rows.set(t.id, t); } catch {}
      }
      c.size = st.size;
    }
  } catch {}
  return c ? c.rows : new Map();
}

function allTrades(): Map<string, ScopeTrade> {
  const out = new Map(ledgerTrades());
  try { for (const r of listNight()) { const t = toTrade(r); if (t) out.set(t.id, t); } } catch {}
  try {
    for (const r of archiveRows() as any[]) {
      const book = r && LANE_BOOK[r.lane || "grok"];
      if (!book) continue;
      const t = toTrade({ ...r, book, id: `${r.ticker}:${book}:${r.id}`, setup: r.label });
      if (t) out.set(t.id, t);
    }
  } catch {}
  try { for (const r of asNightRows()) { const t = toTrade(r); if (t) out.set(t.id, t); } } catch {}
  return out;
}

const nameOf = (b: string) => NAMES[b] ?? b.toUpperCase();

export function scopeBooks(): { id: string; name: string; n: number }[] {
  const n = new Map<string, number>();
  for (const t of allTrades().values()) n.set(t.book, (n.get(t.book) ?? 0) + 1);
  return [...n.entries()].map(([id, k]) => ({ id, name: nameOf(id), n: k })).sort((a, b) => b.n - a.n);
}

/** from / to are Pacific minutes of the day (0-1439). to <= from wraps past midnight. days 0 = all. */
export function scope(book: string, from: number, to: number, days: number) {
  const since = days > 0 ? Date.now() - days * 86400000 : 0;
  const inWin = (m: number) => (from < to ? m >= from && m < to : m >= from || m < to);
  const rows: (ScopeTrade & { day: string; time: string })[] = [];
  for (const t of allTrades().values()) {
    if (t.book !== book || t.at < since) continue;
    const hm = PT_HM.format(new Date(t.at));
    const [h, m] = hm.split(":").map(Number);
    if (!inWin((h % 24) * 60 + m)) continue;
    rows.push({ ...t, day: PT_DAY.format(new Date(t.at)), time: hm });
  }
  rows.sort((a, b) => b.at - a.at);
  const sum = (xs: typeof rows) => { const w = xs.filter((x) => x.pnl > 0.05).length; const l = xs.filter((x) => x.pnl < -0.05).length; return { n: xs.length, w, l, p: Math.round(xs.reduce((s, x) => s + x.pnl, 0) * 100) / 100 }; };
  const byDay = new Map<string, typeof rows>();
  for (const r of rows) byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]);
  return {
    book, name: nameOf(book), from, to, days,
    total: sum(rows),
    perDay: [...byDay.entries()].map(([day, xs]) => ({ day, ...sum(xs) })),
    trades: rows.slice(0, 400).map((r) => ({ id: r.id, day: r.day, time: r.time, asset: r.asset, side: r.side, setup: r.setup, exit: r.exit, pnl: Math.round(r.pnl * 100) / 100 })),
  };
}
