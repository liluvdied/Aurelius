// MENTIONS LAB (Claude, Oct 9 ~2:10 PM PT, Love: "there's no way trump doesn't say israel at a rally... can we have the
// scanner look for inherently obvious stuff like this and paper trade it too... as long as whatever we're trading has a
// specific reason"). Read only. Pulls Kalshi's own history of settled "what will X say" markets (category Mentions) so each
// word gets a base rate (how often it actually got said), then compares that with today's prices. data/mentions-history.json.
import { writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
const BASE = "https://external-api.kalshi.com/trade-api/v2";
const g = globalThis as unknown as { __mentBusy?: boolean; __mentAt?: number };
const FILE = () => join(process.cwd(), "data", "mentions-history.json");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function get(path: string) {
  const res = await fetch(BASE + path, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (res.status === 429) { await sleep(3000); return get(path); }
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<any>;
}
export async function mentionLabOnce() {
  if (g.__mentBusy || (g.__mentAt && Date.now() - g.__mentAt < 6 * 3600 * 1000)) return;
  try { if (Date.now() - statSync(FILE()).mtimeMs < 6 * 3600 * 1000) { g.__mentAt = Date.now(); return; } } catch {}
  g.__mentBusy = true;
  g.__mentAt = Date.now();
  try {
    const sj = await get(`/series?category=Mentions`);
    const series = (sj?.series ?? []).map((x: any) => ({ ticker: String(x.ticker), title: String(x.title || ""), freq: x.frequency, tags: x.tags }));
    const out: any = { at: new Date().toISOString(), series, markets: [] as any[] };
    for (const s of series) {
      for (const status of ["settled", "open"]) {
        let cursor = "";
        for (let page = 0; page < (status === "settled" ? 6 : 2); page += 1) {
          await sleep(900);
          let j: any;
          try { j = await get(`/markets?series_ticker=${encodeURIComponent(s.ticker)}&status=${status}&limit=200${cursor ? `&cursor=${cursor}` : ""}`); } catch { break; }
          for (const m of j?.markets ?? []) out.markets.push({ s: s.ticker, st: status, tk: m.ticker, ev: m.event_ticker, t: m.title, w: m.yes_sub_title || m.subtitle || "", r: m.result, close: m.close_time, last: m.last_price_dollars ?? m.last_price, ya: m.yes_ask_dollars ?? m.yes_ask, na: m.no_ask_dollars ?? m.no_ask, rules: status === "open" ? String(m.rules_primary || "").slice(0, 400) : undefined });
          cursor = j?.cursor || "";
          if (!cursor) break;
        }
      }
      try { writeFileSync(FILE(), JSON.stringify(out)); } catch {}
    }
    out.done = true;
    writeFileSync(FILE(), JSON.stringify(out));
  } catch {
  } finally {
    g.__mentBusy = false;
  }
}
