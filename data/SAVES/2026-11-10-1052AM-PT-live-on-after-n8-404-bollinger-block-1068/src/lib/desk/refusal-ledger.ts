// fix661 EVERY REFUSAL WITH ITS PRICE AND PLACE (Love Nov 4 2026 7:02 PM PT: "yes, let's do that for all refused trades going forward. log the multiple for it, and percentage up/down in the channel. it will tell us which rule was holding her and how we should go about handling").
// LOG ONLY - decides nothing. Every refused read (her read), door and send writes one line to data/refusal-ledger.jsonl: the rule (and its fix), the book, the asset, her side's live Kalshi ask
// and its multiple, price's place in the session-band channel (0% = bottom band, 100% = top), its place from the pink toward the red zone (+) or the green zone (-), and the minute into the window.
// The write is asynchronous (never waits on the disk), deduped per rule / book / side / minute. Rotated by the 2-hour archive (fix654).
import { appendFile } from "node:fs";
import { join } from "node:path";
export function refusal661(r: { where: string; lane: string; asset?: string; ticker?: string; side: string; label?: string; rule: string; ask?: number; spot?: number }): void {
  try {
    if (r.side !== "up" && r.side !== "down") return;
    const G = globalThis as any;
    const asset = r.asset || (/GOLD/.test(String(r.ticker)) ? "gold" : /BTC/.test(String(r.ticker)) ? "btc" : "");
    if (asset !== "gold" && asset !== "btc") return;
    const k = `${r.where}|${r.ticker || ""}|${r.lane}|${r.side}|${String(r.rule).slice(0, 60)}|${Math.floor(Date.now() / 60000)}`;
    const seen: Set<string> = (G.__ref661 ||= new Set()); if (seen.has(k)) return; seen.add(k); if (seen.size > 20000) seen.clear();
    const c = (G.__ctx661 || {})[asset] || {};
    const L: any[] = (((G.__lawBands || {})[asset] || {}).L || c.L || []) as any[];
    const spot = Number(r.spot) > 0 ? Number(r.spot) : Number(c.spot) || 0;
    let ask = Number(r.ask);
    if (!(ask > 0.02 && ask < 0.99)) { const m = c.ticker === r.ticker || !r.ticker ? c : {}; ask = Number(r.side === "up" ? m.yes : m.no) || 0; }
    const px = (n: string) => Number(L.find((l: any) => String(l.name) === n)?.price) || 0;
    const S = L.filter((l: any) => /σ$|^session VWAP$/.test(String(l.name)) && Number(l.price) > 0).map((l: any) => Number(l.price));
    const up = Math.min(...S.filter((v: number) => v > spot)), dn = Math.max(...S.filter((v: number) => v < spot));
    const chanPct = spot > 0 && Number.isFinite(up) && Number.isFinite(dn) && up > dn ? Math.round(((spot - dn) / (up - dn)) * 1000) / 10 : null;
    const pk = px("5m PP"), r1 = px("5m R1"), s1 = px("5m S1");
    const pinkToZonePct = spot > 0 && pk > 0 ? (spot >= pk ? (r1 > pk ? Math.round(((spot - pk) / (r1 - pk)) * 1000) / 10 : null) : (s1 > 0 && s1 < pk ? -Math.round(((pk - spot) / (pk - s1)) * 1000) / 10 : null)) : null;
    const okAsk = ask > 0.02 && ask < 0.99;
    const row = { at: new Date().toISOString(), where: r.where, asset, book: r.lane, ticker: r.ticker || null, side: r.side, setup: r.label || null, rule: String(r.rule).slice(0, 300), fix: (/fix\d+[a-z]?/.exec(String(r.rule)) || [null])[0], ask: okAsk ? ask : null, multiple: okAsk ? Math.round(100 / ask) / 100 : null, spot: spot || null, chanPct, pinkToZonePct, pink: pk || null, minuteIn: Math.floor(((Date.now() / 1000) % 900) / 60) };
    appendFile(join(process.cwd(), "data", "refusal-ledger.jsonl"), JSON.stringify(row) + "\n", () => {});
  } catch {}
}
(globalThis as any).__refusal661 = refusal661; // fix661: her read and door call it through the global, so no file of hers needs a new import
