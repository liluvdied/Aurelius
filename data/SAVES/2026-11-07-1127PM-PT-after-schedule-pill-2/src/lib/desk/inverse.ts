// fix688 INVERSE BOOK - PAPER (Love Nov 5 2026 ~1:05 AM PT: "can you create the inverse set ups book i asked you about earlier too? all of our least successful set ups"
// + "in a week we'll know for sure which set ups lose the most. then we create the inverse"). PAPER ONLY: this file never places, sizes, cancels or reads a live order and never
// touches a live book, wall, umpire or switch.
// When her main or rejection book (recon-tog / recon-rej paper rows) opens one of the setups listed in data/inverse-setups.json, this book takes the OTHER side of the same
// window at that moment, $20 paper at the OTHER side's real live ask (logged on every row - the true $ the study could only estimate). One per source trade.
// The list is a plain data file - add or remove a setup there (asset, side she took, label pattern, books) with no code change. Started with tonight's five
// (data/reports/confluence-and-inverse-nov6.md): gold pink shorts, gold "red candle falling from the top third" shorts, BTC "launched from the bottom third" longs,
// BTC "rejected down off +1σ" shorts, BTC "failed break above -1σ" shorts. Never the BTC pink longs.
// + BAND TRAVEL (Love Nov 5 2026 ~1:15 AM PT: "can you do the inverse of the biggest losers on here so far? 1 Band traveled the previous window"): a set up can name
// travel ("1 down") + how ("follow"/"fade") - counted the STATS table's way (rung-stats-680.py), from the price at the previous window's open (seen live here).
// Scored both ways: held to the bell, and her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid). Rows also say whether the inverse
// ticket would have passed her 1.38x floor, so the week can be read either way.
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "inverse-book-688.json";
type Setup = { name: string; asset: string; side: "up" | "down"; label: string; books?: string[]; on?: boolean; travel?: string; how?: "follow" | "fade" };
type Row688 = { id: string; src: string; setup: string; travel?: string; asset: string; ticker: string; closeTime: string; at: string; herSide: "up" | "down"; side: "up" | "down"; herLabel: string; herAsk: number; ask: number; floorOk: boolean; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
function st(): { rows: Row688[]; seen: Record<string, number> } { if (G.__inv688) return G.__inv688; let s = { rows: [] as Row688[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__inv688 = s; return s; }
function save(force = false) { if (!force && G.__inv688SaveAt && Date.now() - G.__inv688SaveAt < 10000) return; G.__inv688SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
export function setups688(): Setup[] { try { const j = JSON.parse(readFileSync(D("inverse-setups.json"), "utf8")); return (Array.isArray(j?.setups) ? j.setups : []).filter((x: Setup) => x && x.on !== false && (x.side === "up" || x.side === "down") && x.asset && x.label); } catch { return []; } }
/** BAND TRAVEL, the STATS table's own count (tools/rung-stats-680.py): session bands (VWAP, ±1/2/3σ) between the price at the previous window's open and price now,
 *  "0" or "1 up" / "2 down" / "3+ up"...; "follow" = her trade goes the way price travelled, "fade" = against it. */
export function travel688(prevOpen: number, spot: number, vwap: number, sd: number): string {
  if (!(prevOpen > 0) || !(spot > 0) || !(vwap > 0) || !(sd > 0)) return "";
  const lo = Math.min(prevOpen, spot), hi = Math.max(prevOpen, spot);
  const n = Math.min(3, [-3, -2, -1, 0, 1, 2, 3].map((k) => vwap + k * sd).filter((v) => lo < v && v < hi).length);
  return n === 0 ? "0" : `${n}${n === 3 ? "+" : ""} ${spot > prevOpen ? "up" : "down"}`;
}
/** which listed setup (if any) a source row of hers is (tr = the band travel at her entry, "" when unknown) */
export function match688(row: any, list: Setup[], tr = ""): Setup | null {
  const book = String(row?.lane ?? row?.book ?? ""), lb = String(row?.label ?? row?.setup ?? "");
  for (const s of list) {
    if (!(s.books?.length ? s.books : ["recon-tog", "recon-rej"]).includes(book) || row.asset !== s.asset || row.side !== s.side) continue;
    if (s.travel) { if (!tr || tr !== s.travel) continue; const how = tr === "0" ? "-" : (tr.endsWith("up") === (row.side === "up") ? "follow" : "fade"); if (s.how && s.how !== how) continue; }
    try { if (new RegExp(s.label).test(lb)) return s; } catch {}
  }
  return null;
}
function hers(): any[] { // her main + rejection paper rows (grok-og.json): the desk's own shared parse when it is current (grokog.ts readShared), else one parse per file change
  try {
    const p = D("grok-og.json"), f = statSync(p), key = `${f.mtimeMs}:${f.size}`;
    if (G.__inv688Src?.key === key) return G.__inv688Src.rows;
    const all = G.__ogShared?.key === key && Array.isArray(G.__ogShared.rows) ? G.__ogShared.rows : JSON.parse(readFileSync(p, "utf8"));
    G.__inv688Src = { key, rows: Array.isArray(all) ? all.filter((r: any) => /^recon-/.test(String(r?.lane || "")) && Date.now() - Date.parse(String(r?.at)) < 90000) : [] };
    return G.__inv688Src.rows;
  } catch { return G.__inv688Src?.rows || []; }
}
export async function inverseTick688(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__inv688Busy) return;
  G.__inv688Busy = true;
  try {
    const s = st(); let dirty = false; const list = setups688(), now = Date.now();
    const WO = (G.__inv688Wo ||= {}) as Record<string, Record<number, number>>, w0 = Math.floor(now / 900000) * 900; // each window's opening price (first price seen in it)
    for (const id of ["btc", "gold"]) { const px = Number(assets[id]?.spot) || 0; const m = (WO[id] ||= {}); if (px > 0 && m[w0] == null) { m[w0] = px; for (const k of Object.keys(m)) if (Number(k) < w0 - 3600) delete m[Number(k)]; } }
    if (list.length) for (const r of hers()) {
      if (!r?.id || s.seen[r.id] || !(now - Date.parse(String(r.at)) < 90000)) continue; // fresh calls only, priced at that moment
      const m = assets[r.asset]?.market, left = Number(assets[r.asset]?.secondsLeft) || 0;
      if (!m?.ticker || m.ticker !== r.ticker) continue;
      s.seen[r.id] = now;
      const a0 = assets[r.asset], tr = travel688(Number(WO[r.asset]?.[w0 - 900]) || 0, Number(a0?.spot) || 0, Number(a0?.vwap1m?.vwap) || 0, Number(a0?.vwap1m?.stdev) || 0);
      const set = match688(r, list, tr); if (!set) continue;
      const side: "up" | "down" = r.side === "up" ? "down" : "up", ask = Number(side === "up" ? m.yesAsk : m.noAsk);
      if (!(ask > 0.01 && ask < 0.99)) continue;
      s.rows.push({ id: `${r.id}:inv`, src: String(r.id), setup: set.name, asset: r.asset, ticker: r.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), herSide: r.side, side, herLabel: String(r.label || "").slice(0, 120), travel: tr, herAsk: Number(r.ask) || 0, ask, floorOk: ask <= 0.72, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
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
      const k = (G.__inv688Res ||= {}) as Record<string, number>; if (Date.now() - (k[r.ticker] || 0) < 15000) continue; k[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__inv688Busy = false; }
}
export function inverseSummary688() {
  const rows = st().rows, by: Record<string, { n: number; w: number; l: number; hold: number; tp: number; floorN: number; floorHold: number }> = {};
  const tot = { n: rows.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 };
  for (const r of rows) {
    const b = (by[r.setup] ||= { n: 0, w: 0, l: 0, hold: 0, tp: 0, floorN: 0, floorHold: 0 }); b.n++;
    if (r.result === "open") tot.open++; if (r.result === "win") { tot.w++; b.w++; } if (r.result === "loss") { tot.l++; b.l++; }
    tot.hold += r.pnlHold || 0; tot.tp += r.pnlTp || 0; b.hold += r.pnlHold || 0; b.tp += r.pnlTp || 0; if (r.floorOk) { b.floorN++; b.floorHold += r.pnlHold || 0; }
  }
  const rd = (x: number) => Math.round(x * 100) / 100;
  return { ...tot, hold: rd(tot.hold), tp: rd(tot.tp), setups: setups688().map((x) => x.name), by: Object.entries(by).map(([k, v]) => ({ setup: k, ...v, hold: rd(v.hold), tp: rd(v.tp), floorHold: rd(v.floorHold) })),
    recent: rows.slice(-25).reverse().map((r) => ({ at: r.at, asset: r.asset, setup: r.setup, side: r.side, herAsk: r.herAsk, ask: r.ask, result: r.result, pnlHold: r.pnlHold, pnlTp: r.pnlTp })) };
}
