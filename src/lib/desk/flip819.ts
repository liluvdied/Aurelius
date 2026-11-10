// fix819 CUT + FLIP (Love Nov 6 2026 ~9:52 AM PT: "as for any of the set ups we currently have her taking that have a hit rate under 30% and don't pay over 2.2x can get cut & flipped right now, but only do the flip if it's still above her 1.5 floor bb").
// A main / REJECTION set up (SET UP SCORES' own grouping) with 30+ trades of its own in 7 days, under 30% hit and paying 2.2x or less on average (avg ask 45.5c+) is CUT: her live order on it
// is refused at the last line. In its place she takes the OPPOSITE side at that second - only while that side still pays her 1.5x floor (ask 66.7c or less); otherwise it is skipped.
// The flip is labelled "FLIP of <set up>", recorded at $5 in data/flip-819.json (scored in SET UP SCORES as FLIPS) and handed to the copier for the same book; its order skips her band
// walls (her words: bypass band rules if necessary) but keeps the umpire, freshness, one ticket per window and every money rail. Delayed and every other book untouched.
// The list refreshes from data/setup-scores-708.json (rebuilt every 10 min). Every cut and flip is logged to data/cut-flip-819.jsonl. live-switch cutFlip819 false = off. Idle until a set up qualifies.
import { appendFileSync, existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";
const G = globalThis as any;
const SET819 = /^(Rejected (up|down) off|Failed break (above|below)|Break (above|below)|Close (above|below)|Tap-reject at|OG tap-reject (up|down) off|\dm rejection off|\dm flip - rejected (up|down) off|Fake-out turn (over|under)|Candle (rising|falling)|Launched from the (top|bottom) third|Launched|Red candle falling|Green candle rising|Top third|Bottom third)/;
const BAND819 = /(5m PP|[-+]\d(?:\.5)?σ|session VWAP|fresh VWAP|Green zone|Red zone|Bollinger (upper|lower)|BB (upper|lower)|5m [RS]\d)/;
/** SET UP SCORES' own grouping (tools/setup-scores-708.py norm) */
export function norm819(label: string): string {
  let s = String(label || "").replace(/\u2212/g, "-").replace(/^Re-aimed[^:]*:\s*/, "");
  const m = SET819.exec(s);
  if (m) { const g = BAND819.exec(s); return (m[1].replace(/^\dm /, "N-m ") + (g ? " " + g[1] : "")).trim(); }
  s = s.replace(/\s*\(.*?\)/g, ""); s = s.split(" - ")[0]; s = s.replace(/\d{3,}(\.\d+)?/g, "#");
  return s.trim().slice(0, 60) || "?";
}
const D = (f: string) => join(process.cwd(), "data", f);
export const MIN_N819 = 30, MAX_HIT819 = 0.30, MAX_MULT819 = 2.2, FLOOR819 = 1.5, STAKE819 = 20; /* fix1048 her flat $20 paper ticket (Love Nov 9 2026: "make all books $20 on paper") */
const BOOK819: Record<string, string> = { "recon-tog": "MAIN", "recon-rej": "REJECTION" };
export const FLIP_LABEL819 = "FLIP of ";
function on819(): boolean { try { return JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.cutFlip819 !== false; } catch { return true; } }
/** pure: does this scored set up qualify? */
export function qualifies819(r: any): boolean { const n = Number(r?.n7) || 0, w = Number(r?.w7) || 0, a = Number(r?.ask7) || 0; return n >= MIN_N819 && w / n < MAX_HIT819 && a > 0 && 1 / a <= MAX_MULT819 + 1e-9; }
export function list819(): Record<string, Set<string>> {
  try { const p = D("setup-scores-708.json"), m = statSync(p).mtimeMs; if (G.__l819?.m === m) return G.__l819.v; const d = JSON.parse(readFileSync(p, "utf8")); const v: Record<string, Set<string>> = {};
    for (const [ln, b] of Object.entries(BOOK819)) v[ln] = new Set(((d?.books?.[b] || []) as any[]).filter(qualifies819).map((r) => String(r.setup)));
    G.__l819 = { m, v }; return v; } catch { return {}; }
}
export function key819(asset: string, side: string, label: string): string { return `${String(asset).toUpperCase()} ${side === "up" ? "LONG" : "SHORT"} · ${norm819(label)}`; }
/** the last line: "" = go; otherwise why the original order is refused */
export function cutWhy819(book: string, asset: string, side: string, label: string): string {
  if (!BOOK819[book] || String(label).startsWith(FLIP_LABEL819) || !on819()) return "";
  const k = key819(asset, side, label); return list819()[book]?.has(k) ? `CUT + FLIP (fix819): ${k} is under 30% over 30+ trades at 2.2x or less - no order on her side (the opposite side goes only inside her 1.5x floor).` : "";
}
/** a flip row's order: true = it is one of today's flips (its walls are waived at the last line) */
export function isFlip819(book: string, label: string): boolean { if (!BOOK819[book] || !String(label).startsWith(FLIP_LABEL819) || !on819()) return false; const k = String(label).slice(FLIP_LABEL819.length).split(" (")[0]; return !!list819()[book]?.has(k); } // the label names the set up she would have taken (the cut one)
function st(): { rows: any[]; seen: Record<string, number> } { if (G.__f819) return G.__f819; let s = { rows: [] as any[], seen: {} as Record<string, number> }; try { if (existsSync(D("flip-819.json"))) s = { seen: {}, ...JSON.parse(readFileSync(D("flip-819.json"), "utf8")) }; } catch {} G.__f819 = s; return s; }
function save() { try { const s = st(); s.rows = s.rows.slice(-3000); writeFileSync(D("flip-819.json.tmp"), JSON.stringify(s)); renameSync(D("flip-819.json.tmp"), D("flip-819.json")); } catch {} }
function log(x: any) { try { appendFileSync(D("cut-flip-819.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n"); } catch {} }
/** every second with the desk: her fresh main / REJ calls on a qualifying set up -> the flip (or a logged skip) */
export async function flipTick819(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__f819Busy || !on819()) return; G.__f819Busy = true;
  try {
    const L = list819(); if (!Object.values(L).some((s) => s.size)) { await settle(assets); return; }
    const s = st(), now = Date.now(); let dirty = false;
    const og: any[] = (G.__ogShared?.rows as any[]) || [];
    for (const r of og) {
      const ln = String(r?.lane || ""); if (!BOOK819[ln] || r?.result !== "open" || !r?.ticker || now - Date.parse(String(r.at)) > 60000) continue;
      const k = key819(r.asset, r.side, String(r.label || "")); if (!L[ln]?.has(k)) continue;
      const id = `${r.ticker}:${ln}`; if (s.seen[id]) continue; s.seen[id] = now;
      const m = assets[r.asset]?.market; if (!m || m.ticker !== r.ticker) { log({ book: ln, ticker: r.ticker, cut: k, action: "skipped", why: "no live quote for the window" }); continue; }
      const side = r.side === "up" ? "down" : "up", ask = Number(side === "up" ? m.yesAsk : m.noAsk) || 0;
      if (!(ask > 0.01 && 1 / ask >= FLOOR819 - 1e-9)) { log({ book: ln, ticker: r.ticker, cut: k, action: "skipped", why: `the other side costs ${Math.round(ask * 100)}c - under her 1.5x floor` }); continue; }
      const left = Number(assets[r.asset]?.secondsLeft) || 0;
      s.rows.push({ id: `${id}:flip819`, book: ln, asset: r.asset, ticker: r.ticker, side, setup: FLIP_LABEL819 + k, at: new Date(now).toISOString(), closeTime: new Date(now + left * 1000).toISOString(), ask, contracts: STAKE819 / ask, half: false, halfBid: null, restBid: null, result: "open", pnlTp: null });
      log({ book: ln, ticker: r.ticker, cut: k, action: "flipped", side, ask }); dirty = true;
    }
    if (dirty) save();
    await settle(assets);
  } catch {} finally { G.__f819Busy = false; }
}
async function settle(assets: Record<string, any>) {
  const s = st(), now = Date.now(); let dirty = false;
  for (const r of s.rows) {
    if (r.result !== "open") continue;
    const m = assets[r.asset]?.market;
    if (m?.ticker === r.ticker && r.restBid == null) { const bid = Number(r.side === "up" ? m.yesBid : m.noBid) || 0; if (bid > 0) { if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (r.half && bid >= r.ask + 0.95 * (1 - r.ask)) { r.restBid = bid; dirty = true; } } }
    if (now < Date.parse(r.closeTime) + 20000) continue;
    const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : ""; if (!res) continue;
    const won = res === r.side, c = r.contracts, h = r.half ? c / 2 : 0; r.result = won ? "win" : "loss"; r.pnlTp = Math.round(((r.half ? h * r.halfBid : 0) + (c - h) * (r.restBid != null ? r.restBid : won ? 1 : 0) - (r.contracts * r.ask)) * 100) / 100; dirty = true;
  }
  if (dirty) save();
}
/** her flips as main / REJ rows for the copier */
export function liveRows819(): any[] {
  if (!on819()) return [];
  return st().rows.filter((r) => r?.ticker && /15M-/.test(String(r.ticker))).map((r) => ({ id: r.id, book: r.book, at: r.at, asset: r.asset, ticker: r.ticker, side: r.side, setup: r.setup, ask: r.ask, multiple: r.ask > 0 ? 1 / r.ask : 0, stake: STAKE819, tpPct: 0, peakPct: 0, exit: r.result === "open" ? undefined : r.restBid != null ? "sold" : "held to the bell", soldAt: undefined, sellBid: null, result: r.result, pnl: r.pnlTp, bands: null, spot: null, event: null, hourPT: 0 }));
}
