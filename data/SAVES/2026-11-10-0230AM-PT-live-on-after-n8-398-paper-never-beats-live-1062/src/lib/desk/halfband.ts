// fix709 HALF-BAND KEEP BOOK - PAPER (Love Nov 5 2026 ~4:20 AM PT: "the original model used half bands, i don't even have the option for them on my chart. can we create another book
// that still uses those and then from there refine the set ups on THAT that worked best? by next friday we will have her propped up on concrete"). PAPER ONLY: never places, sizes,
// cancels or reads a live order; never touches a live book, wall, umpire or switch. 24/7.
// The original model (PAPER 24/7, auto.ts: session VWAP with ±0.5σ, ±1σ, ±1.5σ, ±2σ, ±2.5σ, ±3σ - the half bands) still runs on paper. When it opens a call whose set up is scored
// KEEP or LADDER on her SET UP SCORES panel (data/setup-scores-708.json, HALF BANDS · ORIGINAL PAPER 24/7 - her framework: KEEP = 7 days 15+ trades 65%+ and made money,
// LADDER = 24 h more than half or 7 days 60%+), this book takes the SAME side at the real live ask, $20 paper, once per call; held to the bell and under her take-profit.
// The list refines itself as the scores move - set ups that start losing drop off on their own. The card also shows the half bands' live prices (her chart has no half bands).
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";
import { key690 } from "./club";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "half-band-709.json", SRC = "HALF BANDS · ORIGINAL PAPER 24/7";
type Row709 = { id: string; src: string; setup: string; badge: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; label: string; herAsk: number; ask: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
/** the panel's set up name for one of PAPER 24/7's calls (same grouping as tools/setup-scores-708.py) */
export function setupName709(asset: string, side: string, label: string): string {
  const lb = String(label || "").replace(/−/g, "-").replace(/^Re-aimed[^:]*:\s*/, ""), k = key690(asset, side, lb).split("|");
  const name = k[2] === "other" ? lb.replace(/\s*\(.*?\)/g, "").split(" - ")[0].replace(/\d{3,}(\.\d+)?/g, "#").trim().slice(0, 60) : `${k[2]}${k[3] && k[3] !== "-" ? " " + k[3] : ""}`.trim();
  return `${String(asset).toUpperCase()} ${side === "up" ? "LONG" : "SHORT"} · ${name}`;
}
function list709(): Map<string, string> { // set up -> badge, KEEP / LADDER only (re-read once a minute)
  const c = (G.__hb709L ||= { at: 0, m: new Map<string, string>() });
  if (Date.now() - c.at > 60000) { c.at = Date.now(); try { const j = JSON.parse(readFileSync(D("setup-scores-708.json"), "utf8")); const m = new Map<string, string>(); for (const r of j?.books?.[SRC] ?? []) if (r.badge === "KEEP" || r.badge === "LADDER") m.set(String(r.setup), String(r.badge)); c.m = m; } catch {} }
  return c.m;
}
function st(): { rows: Row709[]; seen: Record<string, number> } { if (G.__hb709) return G.__hb709; let s = { rows: [] as Row709[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__hb709 = s; return s; }
function save(force = false) { if (!force && G.__hb709SaveAt && Date.now() - G.__hb709SaveAt < 10000) return; G.__hb709SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
function calls(): any[] { // PAPER 24/7's fresh calls (grok-og.json), one parse per file change
  try {
    const p = D("grok-og.json"), f = statSync(p), key = `${f.mtimeMs}:${f.size}`;
    if (G.__hb709Src?.key === key) return G.__hb709Src.rows;
    const all = G.__ogShared?.key === key && Array.isArray(G.__ogShared.rows) ? G.__ogShared.rows : JSON.parse(readFileSync(p, "utf8"));
    G.__hb709Src = { key, rows: Array.isArray(all) ? all.filter((r: any) => r?.lane === "paper-247" && Date.now() - Date.parse(String(r?.at)) < 90000) : [] };
    return G.__hb709Src.rows;
  } catch { return G.__hb709Src?.rows || []; }
}
export async function halfBandTick709(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__hb709Busy) return;
  G.__hb709Busy = true;
  try {
    const s = st(); let dirty = false; const now = Date.now(), L = list709();
    const lv = (G.__hb709Lv ||= {}) as Record<string, any>;
    for (const id of Object.keys(assets)) { const a = assets[id], vw = Number(a?.vwap1m?.vwap) || 0, sd = Number(a?.vwap1m?.stdev) || 0; if (vw > 0 && sd > 0) lv[id] = { at: now, vwap: vw, half: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((k) => ({ name: `${k > 0 ? "+" : ""}${k}σ`, price: Math.round((vw + k * sd) * 100) / 100 })) }; }
    for (const r of calls()) {
      if (!r?.id || s.seen[r.id] || (r.side !== "up" && r.side !== "down")) continue;
      const a = assets[r.asset], m = a?.market, left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || m.ticker !== r.ticker || !(left >= 120)) continue;
      s.seen[r.id] = now;
      const name = setupName709(r.asset, r.side, String(r.label || "")), badge = L.get(name); if (!badge) continue;
      const ask = Number(r.side === "up" ? m.yesAsk : m.noAsk); if (!(ask > 0.01 && ask < 0.99)) continue;
      s.rows.push({ id: `${r.id}:hb`, src: String(r.id), setup: name, badge, asset: r.asset, ticker: r.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), side: r.side, label: String(r.label || "").slice(0, 80), herAsk: Number(r.ask) || 0, ask, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
      dirty = true;
    }
    for (const r of s.rows) {
      if (r.result !== "open") continue;
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) {
        const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
        if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; } }
      }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__hb709Res ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__hb709Busy = false; }
}
export function halfBandSummary709() {
  const rows = st().rows, by: Record<string, { n: number; w: number; l: number; hold: number; tp: number }> = {}, tot = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) { const b = (by[r.setup] ||= { n: 0, w: 0, l: 0, hold: 0, tp: 0 }); b.n++; if (r.result === "open") tot.open++; if (r.result === "win") { tot.w++; b.w++; } if (r.result === "loss") { tot.l++; b.l++; } tot.hold += r.pnlHold || 0; tot.tp += r.pnlTp || 0; b.hold += r.pnlHold || 0; b.tp += r.pnlTp || 0; }
  const rd = (x: number) => Math.round(x * 100) / 100;
  return { ...tot, hold: rd(tot.hold), tp: rd(tot.tp), following: [...list709().entries()].map(([k, v]) => ({ setup: k, badge: v })), levels: G.__hb709Lv || {},
    by: Object.entries(by).map(([k, v]) => ({ setup: k, ...v, hold: rd(v.hold), tp: rd(v.tp) })), recent: rows.slice(-20).reverse().map((r) => ({ at: r.at, asset: r.asset, setup: r.setup, badge: r.badge, side: r.side, ask: r.ask, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })) };
}
