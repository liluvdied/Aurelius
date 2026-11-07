// fix820 THE INVERSE-WORST BOOKS (Love Nov 6 2026 ~10:43 AM PT: "as for the WORST stats over all time , consistent under 40% , 20-30% even better and then create an inverse book on THOSE set ups only for v.111 , and for main rej and no pink pls all individual inverse books and let's create a new subgroup for all of our inverses oki"). PAPER ONLY - never sends an order.
// Four books - V.111 INVERSE-WORST, MAIN INVERSE-WORST, REJ INVERSE-WORST, NO-PINK INVERSE-WORST - each watching its family's fresh calls. When the call's set up (SET UP SCORES' grouping) is on that
// family's WORST list (data/inverse-worst-820.json, rebuilt with SET UP SCORES: 30+ trades in 7 days, under 40% hit and losing money), the book takes the OPPOSITE side that second at the real
// ask - only inside her 1.5x floor. $5, her exit (half at 75% / rest at 95% of the way), settled from Kalshi. Families: MAIN = recon-tog; REJ = recon-rej; NO PINK = recon-rnp, recon-rjnp,
// recon-togp; V.111 = V.111 - 2's own takes. A set up that drops off the list stops being inverted; one that qualifies joins.
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";
import { norm819 } from "./flip819";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const STAKE820 = 5, FLOOR820 = 1.5;
export const FAMILY820: Record<string, { fam: string; book: string }> = { "recon-tog": { fam: "MAIN", book: "invw-main" }, "recon-rej": { fam: "REJ", book: "invw-rej" }, "recon-rnp": { fam: "NO PINK", book: "invw-np" }, "recon-rjnp": { fam: "NO PINK", book: "invw-np" }, "recon-togp": { fam: "NO PINK", book: "invw-np" }, v1112: { fam: "V.111", book: "invw-v1112" } };
function lists(): Record<string, Set<string>> { try { const p = D("inverse-worst-820.json"), m = statSync(p).mtimeMs; if (G.__iw820L?.m === m) return G.__iw820L.v; const j = JSON.parse(readFileSync(p, "utf8")); const v: Record<string, Set<string>> = {}; for (const f of ["MAIN", "REJ", "NO PINK", "V.111"]) v[f] = new Set(((j?.[f] || []) as any[]).map(String)); G.__iw820L = { m, v }; return v; } catch { return {}; } }
export function key820(asset: string, side: string, label: string, raw = false): string { return `${String(asset).toUpperCase()} ${side === "up" ? "LONG" : "SHORT"} · ${raw ? String(label) : norm819(label)}`; }
function st(): { rows: any[]; seen: Record<string, number> } { if (G.__iw820) return G.__iw820; let s = { rows: [] as any[], seen: {} as Record<string, number> }; try { if (existsSync(D("inverse-worst-820-book.json"))) s = { seen: {}, ...JSON.parse(readFileSync(D("inverse-worst-820-book.json"), "utf8")) }; } catch {} G.__iw820 = s; return s; }
function save() { try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D("inverse-worst-820-book.json.tmp"), JSON.stringify(s)); renameSync(D("inverse-worst-820-book.json.tmp"), D("inverse-worst-820-book.json")); } catch {} }
/** pure: one fresh call -> the inverse take or null (and why) */
export function decide820(src: { lane: string; asset: string; side: string; label: string; raw?: boolean }, m: any, L: Record<string, Set<string>>): { side: "up" | "down"; ask: number; book: string; key: string } | null {
  const f = FAMILY820[src.lane]; if (!f || !m) return null;
  const k = key820(src.asset, src.side, src.label, src.raw); if (!L[f.fam]?.has(k)) return null;
  const side = src.side === "up" ? "down" : "up", ask = Number(side === "up" ? m.yesAsk : m.noAsk) || 0;
  if (!(ask > 0.01 && 1 / ask >= FLOOR820 - 1e-9)) return null;
  return { side, ask, book: f.book, key: k };
}
export async function invWorstTick820(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__iw820Busy) return; G.__iw820Busy = true;
  try {
    const L = lists(), s = st(), now = Date.now(); let dirty = false;
    const srcs: any[] = [];
    if (Object.values(L).some((x) => x.size)) {
      for (const r of ((G.__ogShared?.rows as any[]) || [])) if (FAMILY820[String(r?.lane)] && r?.result === "open" && now - Date.parse(String(r.at)) <= 60000) srcs.push({ lane: r.lane, asset: r.asset, side: r.side, label: String(r.label || ""), ticker: r.ticker });
      for (const r of ((G.__v1112?.rows as any[]) || [])) if (r?.result === "open" && now - Date.parse(String(r.at)) <= 60000) srcs.push({ lane: "v1112", asset: r.asset, side: r.side, label: String(r.setup || ""), raw: true, ticker: r.ticker });
    }
    for (const x of srcs) {
      const a = assets[x.asset], m = a?.market; if (!m || m.ticker !== x.ticker) continue;
      const d = decide820(x, m, L); if (!d) continue;
      const id = `${x.ticker}:${d.book}`; if (s.seen[id]) continue; s.seen[id] = now;
      const left = Number(a?.secondsLeft) || 0;
      s.rows.push({ id: `${id}:820`, book: d.book, asset: x.asset, ticker: x.ticker, side: d.side, setup: "INVERSE of " + d.key, at: new Date(now).toISOString(), closeTime: new Date(now + left * 1000).toISOString(), ask: d.ask, contracts: STAKE820 / d.ask, half: false, halfBid: null, restBid: null, result: "open", pnlTp: null });
      dirty = true;
    }
    for (const r of s.rows) {
      if (r.result !== "open") continue;
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.restBid == null) { const bid = Number(r.side === "up" ? m.yesBid : m.noBid) || 0; if (bid > 0) { if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (r.half && bid >= r.ask + 0.95 * (1 - r.ask)) { r.restBid = bid; dirty = true; } } }
      if (now < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__iw820Res ||= {}) as Record<string, number>; if (now - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = now;
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : ""; if (!res) continue;
      const won = res === r.side, c = r.contracts, h = r.half ? c / 2 : 0; r.result = won ? "win" : "loss"; r.pnlTp = Math.round(((r.half ? h * r.halfBid : 0) + (c - h) * (r.restBid != null ? r.restBid : won ? 1 : 0) - STAKE820) * 100) / 100; dirty = true;
    }
    if (dirty) save();
  } catch {} finally { G.__iw820Busy = false; }
}
