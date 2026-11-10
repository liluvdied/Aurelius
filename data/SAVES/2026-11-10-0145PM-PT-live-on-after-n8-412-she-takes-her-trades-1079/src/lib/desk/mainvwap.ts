// fix694 MAIN · VWAP SIDE ONLY - PAPER (Love Nov 5 2026 ~2:00 AM PT: "yes to all of the paper books, a, b & c" - (a): Claude's trend study, Oct 20 - Nov 5: main's trades WITH the
// session VWAP (above it longs, below it shorts) made about +$120 over 994, its trades AGAINST it lost about $1,040 over ~1,090). PAPER ONLY: never places, sizes or reads a live order.
// When her MAIN book (recon-tog paper rows) makes a call, this twin takes it only if it is on the VWAP side: a long with price above her session VWAP, a short with price below.
// Scored held to the bell and under her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid). Real asks logged on every row.
import { existsSync, readFileSync, renameSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "main-vwap-694.json";
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Row = { id: string; src: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; herSide: "up" | "down"; label: string; why: string; ask: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
const K = "__mainvwap694";
function st(): { rows: Row[]; seen: Record<string, number>; dly?: Record<string, { side: "up" | "down"; label: string; at: number; px?: number }> } { if (G[K]) return G[K]; let s: any = { rows: [], seen: {}, dly: {} }; try { if (existsSync(D(FILE))) s = { seen: {}, dly: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G[K] = s; return s; }
function save(force = false) { if (!force && G[K + "At"] && Date.now() - G[K + "At"] < 10000) return; G[K + "At"] = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; for (const k of Object.keys(s.dly || {})) if ((s.dly as any)[k].at < cut) delete (s.dly as any)[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
function skip(r: any, why: string) { try { const k = (G[K + "Sk"] ||= {}) as Record<string, number>; if (k[r.id]) return; k[r.id] = Date.now(); appendFileSync(D("main-vwap-694-skips.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: r.id, asset: r.asset, side: r.side, label: String(r.label || "").slice(0, 100), why }) + "\n"); } catch {} }
function hers(): any[] { // her paper rows (grok-og.json): the desk's shared parse when current, else one parse per file change
  try {
    const p = D("grok-og.json"), f = statSync(p), k = `${f.mtimeMs}:${f.size}`;
    if (G[K + "Src"]?.key === k) return G[K + "Src"].rows;
    const all = G.__ogShared?.key === k && Array.isArray(G.__ogShared.rows) ? G.__ogShared.rows : JSON.parse(readFileSync(p, "utf8"));
    G[K + "Src"] = { key: k, rows: Array.isArray(all) ? all.filter((r: any) => (r?.lane === "recon-tog") && Date.now() - Date.parse(String(r?.at)) < 90000) : [] };
    return G[K + "Src"].rows;
  } catch { return G[K + "Src"]?.rows || []; }
}

export async function mainVwap694Tick(assets: Record<string, any> | null | undefined) {
  if (!assets || G[K + "Busy"]) return;
  G[K + "Busy"] = true;
  try {
    const s = st(); let dirty = false; const now = Date.now();
    for (const r of hers()) {
      if (!r?.id || s.seen[r.id] || !(now - Date.parse(String(r.at)) < 90000) || !(r.side === "up" || r.side === "down")) continue;
      const a = assets[r.asset], m = a?.market, left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || m.ticker !== r.ticker) continue;
      s.seen[r.id] = now;
      if (s.rows.some((x) => x.ticker === r.ticker && x.asset === r.asset)) continue; // one per window
      const vw = Number(a?.vwap1m?.vwap) || 0, spot = Number(a?.spot) || 0;
      if (!(vw > 0 && spot > 0)) continue;
      if ((r.side === "up") !== (spot > vw)) { skip(r, `${r.side === "up" ? "long below" : "short above"} the session VWAP (${vw.toFixed(2)})`); continue; }
      const side = r.side, why = `VWAP side (price ${spot > vw ? "above" : "below"} ${vw.toFixed(2)})`, cap = 0.667;
      const ask = Number(side === "up" ? m.yesAsk : m.noAsk);
      if (!(ask > 0.02 && ask <= cap)) { skip(r, `ask ${Math.round(ask * 100)}c over ${Math.round(cap * 100)}c`); continue; }
      s.rows.push({ id: `${r.id}:__mainvwap694`, src: String(r.id), asset: r.asset, ticker: r.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), side, herSide: r.side, label: String(r.label || "").slice(0, 120), why, ask, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
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
      const kk = (G[K + "Res"] ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G[K + "Busy"] = false; }
}
export function mainVwap694Summary() {
  const rows = st().rows, c = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) { if (r.result === "open") c.open++; if (r.result === "win") c.w++; if (r.result === "loss") c.l++; c.hold += r.pnlHold || 0; c.tp += r.pnlTp || 0; }
  return { ...c, hold: Math.round(c.hold * 100) / 100, tp: Math.round(c.tp * 100) / 100, recent: rows.slice(-25).reverse().map((r) => ({ at: r.at, asset: r.asset, side: r.side, label: r.label, why: r.why, ask: r.ask, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })) };
}
