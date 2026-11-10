// fix695 REJECTION · PARKED SIDE - PAPER (Love Nov 5 2026 ~2:00 AM PT: "yes to all of the paper books, a, b & c" - (b): Claude's parked study, Oct 20 - Nov 5: when the last hour of
// 5m closes sat on one side of pink, rejection's trades on that side won 58% (+$653) vs across pink 49% (+$74)). PAPER ONLY: never places, sizes or reads a live order.
// When her REJECTION book (recon-rej paper rows) makes a call: if price is PARKED (the last 12 closed 5m candles all closed on one side of her pink - the 5m CM pivot PP drawn
// from her chart's own 1m candles) it takes only calls on the parked side (above pink = longs, below = shorts); when not parked it takes the call as rejection made it.
// Scored held to the bell and under her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid). Real asks logged on every row.
import { existsSync, readFileSync, renameSync, statSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "rej-parked-695.json";
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Row = { id: string; src: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; herSide: "up" | "down"; label: string; why: string; ask: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
const K = "__rejparked695";
function st(): { rows: Row[]; seen: Record<string, number>; dly?: Record<string, { side: "up" | "down"; label: string; at: number; px?: number }> } { if (G[K]) return G[K]; let s: any = { rows: [], seen: {}, dly: {} }; try { if (existsSync(D(FILE))) s = { seen: {}, dly: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G[K] = s; return s; }
function save(force = false) { if (!force && G[K + "At"] && Date.now() - G[K + "At"] < 10000) return; G[K + "At"] = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; for (const k of Object.keys(s.dly || {})) if ((s.dly as any)[k].at < cut) delete (s.dly as any)[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
function skip(r: any, why: string) { try { const k = (G[K + "Sk"] ||= {}) as Record<string, number>; if (k[r.id]) return; k[r.id] = Date.now(); appendFileSync(D("rej-parked-695-skips.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: r.id, asset: r.asset, side: r.side, label: String(r.label || "").slice(0, 100), why }) + "\n"); } catch {} }
function hers(): any[] { // her paper rows (grok-og.json): the desk's shared parse when current, else one parse per file change
  try {
    const p = D("grok-og.json"), f = statSync(p), k = `${f.mtimeMs}:${f.size}`;
    if (G[K + "Src"]?.key === k) return G[K + "Src"].rows;
    const all = G.__ogShared?.key === k && Array.isArray(G.__ogShared.rows) ? G.__ogShared.rows : JSON.parse(readFileSync(p, "utf8"));
    G[K + "Src"] = { key: k, rows: Array.isArray(all) ? all.filter((r: any) => (r?.lane === "recon-rej") && Date.now() - Date.parse(String(r?.at)) < 90000) : [] };
    return G[K + "Src"].rows;
  } catch { return G[K + "Src"]?.rows || []; }
}
/** PARKED: the last 12 closed 5m candles (her chart's 1m candles grouped) all closed on one side of the pink drawn before each - "up" above, "down" below, "" not parked */
export function parked695(asset: string, barsIn?: Bar[]): "up" | "down" | "" {
  try {
    const src: Bar[] = barsIn || (G.__pivBars?.[asset]?.bars || []); const now = Date.now() / 1000;
    const f: Bar[] = []; for (const b of src) { const k = Math.floor(Number(b.t) / 300) * 300, x = f[f.length - 1]; if (x && x.t === k) { x.h = Math.max(x.h, b.h); x.l = Math.min(x.l, b.l); x.c = b.c; } else f.push({ t: k, o: b.o, h: b.h, l: b.l, c: b.c }); }
    const closed = f.filter((x) => x.t + 300 <= now + 1); if (closed.length < 30) return "";
    let ema = 0; const pp: number[] = []; closed.forEach((x, i) => { const v = (x.h + x.l + x.c) / 3; ema = i === 0 ? v : v * 0.25 + ema * 0.75; pp.push(ema); });
    let side = 0; for (let i = closed.length - 12; i < closed.length; i++) { const sd = closed[i].c > pp[i - 1] ? 1 : closed[i].c < pp[i - 1] ? -1 : 0; if (sd === 0) continue; if (side === 0) side = sd; else if (sd !== side) return ""; }
    return side > 0 ? "up" : side < 0 ? "down" : "";
  } catch { return ""; }
}
export async function rejParked695Tick(assets: Record<string, any> | null | undefined) {
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
      const pk = parked695(r.asset);
      if (pk && r.side !== pk) { skip(r, `parked ${pk === "up" ? "above" : "below"} pink for the last hour - only ${pk === "up" ? "longs" : "shorts"}`); continue; }
      const side = r.side, why = pk ? `parked ${pk === "up" ? "above" : "below"} pink - on its side` : "not parked - as rejection called it", cap = 0.667;
      const ask = Number(side === "up" ? m.yesAsk : m.noAsk);
      if (!(ask > 0.02 && ask <= cap)) { skip(r, `ask ${Math.round(ask * 100)}c over ${Math.round(cap * 100)}c`); continue; }
      s.rows.push({ id: `${r.id}:__rejparked695`, src: String(r.id), asset: r.asset, ticker: r.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), side, herSide: r.side, label: String(r.label || "").slice(0, 120), why, ask, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
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
export function rejParked695Summary() {
  const rows = st().rows, c = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) { if (r.result === "open") c.open++; if (r.result === "win") c.w++; if (r.result === "loss") c.l++; c.hold += r.pnlHold || 0; c.tp += r.pnlTp || 0; }
  return { ...c, hold: Math.round(c.hold * 100) / 100, tp: Math.round(c.tp * 100) / 100, recent: rows.slice(-25).reverse().map((r) => ({ at: r.at, asset: r.asset, side: r.side, label: r.label, why: r.why, ask: r.ask, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })) };
}
