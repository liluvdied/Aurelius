// PATTERN BOOK ⏱ (Claude, Oct 13 ~1:25 AM PT, Love: "yeahh why not... it would be valuable information if we could find a pattern
// across hours / windows"). PAPER ONLY, $20 each. 68 days of Kalshi's own 15M results (data/lab/dir-patterns.json) showed a few
// windows that leaned one way in BOTH halves of the sample. None survived the many-windows correction, so this book is the
// forward test: at each leaning window's open she takes its usual direction at Kalshi's real ask, held to the bell, fee in.
// A slot qualifies when it went one way 62%+ of the time overall AND 55%+ the same way in each half. The list rebuilds whenever
// dir-patterns.json is refreshed.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";

const STAKE = 20;
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const fee = (n: number, p: number) => Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;
const num = (v: unknown) => { const n = Number.parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : NaN; };
const read = (): any[] => { try { return existsSync(D("pattern-book.json")) ? JSON.parse(readFileSync(D("pattern-book.json"), "utf8")) : []; } catch { return []; } };
const write = (rows: any[]) => { writeFileSync(D("pattern-book.json.tmp"), JSON.stringify(rows.slice(0, 5000))); renameSync(D("pattern-book.json.tmp"), D("pattern-book.json")); };
const g = globalThis as unknown as { __pbBusy?: boolean; __pbAt?: number };
const PT = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);

export function patternSlots(): { series: string; slot: string; side: "up" | "down"; rate: number; n: number }[] {
  let p: any = {};
  try { p = JSON.parse(readFileSync(D("lab/dir-patterns.json"), "utf8")); } catch { return []; }
  const out: any[] = [];
  for (const [series, slots] of Object.entries<any>(p)) {
    for (const [slot, v] of Object.entries<any>(slots)) {
      const up = v.up / v.n, u1 = v.up1 / Math.max(1, v.n1), u2 = v.up2 / Math.max(1, v.n2);
      if (v.n >= 30 && up >= 0.62 && u1 >= 0.55 && u2 >= 0.55) out.push({ series, slot, side: "up", rate: Math.round(up * 100), n: v.n });
      if (v.n >= 30 && up <= 0.38 && u1 <= 0.45 && u2 <= 0.45) out.push({ series, slot, side: "down", rate: Math.round((1 - up) * 100), n: v.n });
    }
  }
  return out;
}

export async function patternTick() {
  if (g.__pbBusy || (g.__pbAt && Date.now() - g.__pbAt < 20000)) return;
  g.__pbBusy = true;
  g.__pbAt = Date.now();
  try {
    const rows = read();
    let changed = false;
    const now = new Date();
    const into = (now.getTime() % 900000) / 1000; // seconds into the current 15M window
    // 1. take: within the first 2 minutes of a leaning window
    if (into <= 120) {
      const startMs = now.getTime() - into * 1000;
      const slot = PT(new Date(startMs));
      for (const s of patternSlots().filter((x) => x.slot === slot)) {
        const id = `pb:${s.series}:${new Date(startMs).toISOString()}`;
        if (rows.some((r) => r.id === id)) continue;
        try {
          const j = await kget(`/trade-api/v2/markets?series_ticker=${s.series}&status=open&limit=10`);
          const m = (j?.markets ?? []).find((x: any) => Math.abs(Date.parse(x.open_time) - startMs) < 60000);
          if (!m) continue;
          const ask = num(s.side === "up" ? m.yes_ask_dollars : m.no_ask_dollars);
          if (!(ask > 0.05 && ask < 0.95)) continue;
          const n = STAKE / ask;
          rows.unshift({ id, series: s.series, slot, side: s.side, rate: s.rate, hist: s.n, ticker: m.ticker, at: now.toISOString(), ask: r2(ask), multiple: r2(1 / ask), fee: fee(n, ask), result: "open", pnl: null });
          changed = true;
        } catch {}
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    // 2. settle from Kalshi's result
    for (const r of rows) {
      if (r.result !== "open" || Date.now() - Date.parse(r.at) < 16 * 60000) continue;
      try {
        const j = await kget(`/trade-api/v2/markets/${r.ticker}`);
        const res = j?.market?.result;
        if (res !== "yes" && res !== "no") continue;
        const won = (res === "yes") === (r.side === "up");
        const n = STAKE / r.ask;
        r.result = won ? "win" : "loss";
        r.pnl = r2((won ? n - STAKE : -STAKE) - r.fee);
        changed = true;
      } catch {}
    }
    if (changed) write(rows);
  } catch {
  } finally {
    g.__pbBusy = false;
  }
}
export function patternRows() { return read(); }
