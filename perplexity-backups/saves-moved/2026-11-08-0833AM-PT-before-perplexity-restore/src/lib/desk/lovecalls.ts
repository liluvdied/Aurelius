// LOVE'S CALLS (Claude, Oct 9 ~7:10 PM PT, Love: "yesss let's do it"). Her own hand trades with the reason she took them,
// scored against the price she paid, so her instinct gets a real record next to ORACLE and the base-rate book.
// Stored in data/love-calls.json. A call settles by itself from Kalshi's result, or when she marks it sold.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
const BASE = "https://external-api.kalshi.com/trade-api/v2";
const FILE = () => join(process.cwd(), "data", "love-calls.json");
const r2 = (x: number) => Math.round(x * 100) / 100;
const g = globalThis as unknown as { __lcAt?: number; __lcBusy?: boolean };
export type Call = { id: string; at: string; ticker: string; title: string; side: "yes" | "no"; entry: number; stake: number; conviction: number | null; reason: string; kind: string; exit: number | null; exitAt: string | null; result: "open" | "win" | "loss" | "sold" | "void"; pnl: number | null };
function read(): Call[] {
  try { return existsSync(FILE()) ? JSON.parse(readFileSync(FILE(), "utf8")) : []; } catch { return []; }
}
function write(rows: Call[]) { writeFileSync(FILE(), JSON.stringify(rows, null, 1)); }
async function market(ticker: string): Promise<any> {
  const res = await fetch(`${BASE}/markets/${encodeURIComponent(ticker)}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json())?.market;
}
const kindOf = (t: string) => (/MENTION|SAY/i.test(t) ? "mentions" : /TEMP|HIGH|LOW|RAIN|SNOW/i.test(t) ? "weather" : /BTC|ETH|GOLD|SILVER|INX|NASDAQ/i.test(t) ? "markets" : "other");
export async function addCall(input: { ticker: string; side: "yes" | "no"; entry: number; stake: number; reason: string; conviction?: number | null; title?: string }) {
  const rows = read();
  let title = input.title || input.ticker;
  try { const m = await market(input.ticker); title = `${m?.title || title}${m?.yes_sub_title ? ` · ${m.yes_sub_title}` : ""}`; } catch {}
  const entry = input.entry > 1 ? input.entry / 100 : input.entry;
  rows.unshift({ id: `${input.ticker}:${Date.now()}`, at: new Date().toISOString(), ticker: input.ticker, title, side: input.side, entry: r2(entry), stake: r2(input.stake), conviction: input.conviction ?? null, reason: String(input.reason || "").slice(0, 400), kind: kindOf(input.ticker), exit: null, exitAt: null, result: "open", pnl: null });
  write(rows);
  return rows;
}
export function sellCall(id: string, price: number) {
  const rows = read();
  const c = rows.find((x) => x.id === id);
  if (!c || c.result !== "open") return rows;
  const px = price > 1 ? price / 100 : price;
  c.exit = r2(px); c.exitAt = new Date().toISOString(); c.result = "sold";
  c.pnl = r2((c.stake / c.entry) * px - c.stake);
  write(rows);
  return rows;
}
export function removeCall(id: string) {
  const rows = read().filter((x) => x.id !== id);
  write(rows);
  return rows;
}
export async function loveCallsTick() {
  if (g.__lcBusy || Date.now() - (g.__lcAt || 0) < 5 * 60000) return;
  g.__lcBusy = true; g.__lcAt = Date.now();
  try {
    const rows = read();
    let changed = false;
    for (const c of rows.filter((x) => x.result === "open").slice(0, 15)) {
      try {
        const m = await market(c.ticker);
        const res = String(m?.result || "");
        if (res !== "yes" && res !== "no") continue;
        const won = res === c.side;
        c.result = won ? "win" : "loss";
        c.pnl = r2(won ? c.stake / c.entry - c.stake : -c.stake);
        changed = true;
      } catch {}
    }
    if (changed) write(rows);
  } finally { g.__lcBusy = false; }
}
export function loveCalls() {
  const rows = read();
  const done = rows.filter((r) => r.result !== "open" && r.result !== "void");
  const by: Record<string, { n: number; w: number; p: number }> = {};
  for (const r of done) { const b = (by[r.kind] ||= { n: 0, w: 0, p: 0 }); b.n++; if ((r.pnl || 0) > 0) b.w++; b.p = r2(b.p + (r.pnl || 0)); }
  const staked = done.reduce((a, r) => a + r.stake, 0);
  return { rows: rows.slice(0, 60), open: rows.filter((r) => r.result === "open").length, total: { n: done.length, w: done.filter((r) => (r.pnl || 0) > 0).length, p: r2(done.reduce((a, r) => a + (r.pnl || 0), 0)), roi: staked > 0 ? Math.round((done.reduce((a, r) => a + (r.pnl || 0), 0) / staked) * 100) : 0 }, by };
}
