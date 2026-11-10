// HAND GUARD (Claude, Oct 9 ~10:50 PM PT, Love: "yesss that will make me think twice, just a little banner toast thing is
// cool"). Read only, never blocks anything. Wed noon - Fri night her own hand trades went 30 of 81 (37%), -$439, mostly in
// the hours the desk sits out. This tells the page (a) when BTC's session bands are tight (sigma under $60: a line every
// <$30, the chop the desk sits out) and (b) the last hand order Kalshi shows (outside-orders.json, no client id = not the
// desk), plus her hand-trade record for the last 7 days, so the page can show a toast.
import { readFileSync } from "node:fs";
import { join } from "node:path";
const D = (f: string) => join(process.cwd(), "data", f);
const rd = (f: string, d: any) => {
  try {
    return JSON.parse(readFileSync(D(f), "utf8"));
  } catch {
    return d;
  }
};
const g = globalThis as unknown as { __handWeek?: { at: number; v: { n: number; w: number; p: number } } };
function handWeek() {
  if (g.__handWeek && Date.now() - g.__handWeek.at < 10 * 60000) return g.__handWeek.v;
  const v = { n: 0, w: 0, p: 0 };
  try {
    const done = rd("live-book-done.json", {});
    const books = new Set(Object.entries(done).filter(([, x]: any) => x && ["filled", "partial", "resting"].includes(x.status)).map(([k]) => k.split(":")[0]));
    const fl = rd("fill-log.json", []);
    const rows: any[] = Array.isArray(fl) ? fl : (Object.values(fl).find((x) => Array.isArray(x)) as any[]) || [];
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    for (const x of rows) {
      if (x?.kind !== "banked" || typeof x.profit !== "number" || !String(x.tradeId || "").startsWith("held-") || String(x.at) < since || books.has(x.ticker)) continue;
      v.n += 1;
      v.w += x.profit > 0 ? 1 : 0;
      v.p = Math.round((v.p + x.profit) * 100) / 100;
    }
  } catch {
  }
  g.__handWeek = { at: Date.now(), v };
  return v;
}
export function handGuard() {
  const bn = rd("bands-now.json", {});
  const sd = Number(bn?.btc?.sd) || 0;
  const fresh = Date.now() - Date.parse(bn?.at || 0) < 120000;
  const out: any[] = rd("outside-orders.json", []);
  const last = (Array.isArray(out) ? out : []).filter((o) => o?.action === "buy" && o?.status === "executed").sort((a, b) => (a.at < b.at ? 1 : -1))[0] || null;
  return {
    at: new Date().toISOString(),
    btcTight: fresh && sd > 0 && sd < 60,
    sigma: sd ? Math.round(sd) : null,
    lastHand: last ? { at: last.at, ticker: last.ticker, side: last.side, asset: /GOLD/.test(last.ticker) ? "gold" : /BTC/.test(last.ticker) ? "btc" : "other" } : null,
    week: handWeek(),
  };
}
