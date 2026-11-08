// fix783 BESTIE · WALLS · PAPER (Love Nov 6 2026 ~2:12 AM PT: "can you include all of the same band / zone tolerances for this book too hun ? she traded into a red zone for btc
// and a pink and the bollinger for gold we need to fix that real quick and she'll be good 💓 keep an unadulterated version of this one. , we will do one that has the pivot
// tolerances" + her card pick: live BESTIE stays pure, the walled version runs as a paper twin).
// PAPER ONLY: never places, sizes, cancels or reads a live order, never touches a live book, wall, umpire, switch or BESTIE live. Fill-log venue "paper-bestie-walls".
// THE BOOK: exactly BESTIE's takes (every V.111 - 2 take decided on her BEST list - the same answer BESTIE live gets; same asset, window and side, V.111 - 2's real ask; $5)
// EXCEPT each one is first judged by MAIN's door exactly as the sub-auditor judges main (TOGETHER, recon-tog) on the live board that second: bandlock.ts impossibleGeo with
// main's flags (AUDIT_FLAGS523["recon-tog"] - her channel 33%, unbroken band ahead, pink cushion, pink-to-red/green 55%, Bollinger, zones, her candle / flip), her zone
// tolerance (zoneTolerance497) and her reach wall (reachWall429). Refused = skipped, kept in its own file with main's reason first and scored as if taken (own card).
// No board to judge (no lines / no tick) = skipped ("no board"), like the sub-auditor. Scored like V.111 - 2: held to the bell + her take-profit, settled from Kalshi.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const BOOK783 = "BESTIE · WALLS";
export const VENUE783 = "paper-bestie-walls";
const FILE = "bestie-walls-783.json", SKIPS = "bestie-walls-skips-783.json", STAKE = 5;
type Row783 = { id: string; book: string; setup: string; tf: string; kind: string; asset: string; ticker: string; closeTime: string; at: string; readAt: string; of: string; side: "up" | "down"; ask: number; multiple: number; contracts: number; stake: number; spot: number; vwap: number; stdev: number; level: number | null; tick: number; walls: string[]; skip: string | null; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null; logged?: boolean };
function load(f: string, k: string): { rows: Row783[] } {
  if (G[k]) return G[k];
  let s = { rows: [] as Row783[] };
  try { if (existsSync(D(f))) s = { ...JSON.parse(readFileSync(D(f), "utf8")) }; if (!Array.isArray(s.rows)) s.rows = []; } catch {}
  G[k] = s; return s;
}
const st = () => load(FILE, "__bestieWalls783"), sk = () => load(SKIPS, "__bestieWallsSkip783");
function save(f: string, s: { rows: Row783[] }) { try { s.rows = s.rows.slice(-4000); writeFileSync(D(f + ".tmp"), JSON.stringify(s)); renameSync(D(f + ".tmp"), D(f)); } catch {} }
/** MAIN's door on the live board this second, the way the sub-auditor judges main (tools/sub-auditor.cjs judge): every reason it gives ([] = clear). null = no board. */
export async function mainDoor783(asset: string, side: string): Promise<{ tick: number; why: string[] } | null> {
  try {
    const B: any = G.__test783B || (await import("./bandlock")), q: any = typeof G.__test783Q === "function" ? G.__test783Q(asset) : (await import("./quotes")).quoteTick(asset); // test hooks: the proof hands in her real door, compiled
    const L = (G.__lawBands?.[asset]?.L || []) as any[], tick = q && Number(q.c) > 0 && Date.now() - Number(q.at) < 5000 ? Number(q.c) : 0;
    const fl = B.AUDIT_FLAGS523?.["recon-tog"];
    if (!(tick > 0) || !L.length || !Array.isArray(fl)) return null;
    const why: string[] = [];
    const prev = G.__curBook465; G.__curBook465 = "recon-tog";
    try { const g = B.impossibleGeo(asset, L, tick, side, ...fl); if (g && g.why) why.push(String(g.why)); } catch (e: any) { why.push("main's door threw - " + String(e?.message || e)); }
    try { const z = B.zoneTolerance497(asset, L, tick, side); if (z) why.push(String(z)); } catch {}
    try { const now = Date.now(), o5 = ((G.__pivBars?.[asset]?.bars || []) as any[]).filter((x) => Number(x.t) >= Math.floor(now / 300000) * 300).sort((a, b) => a.t - b.t)[0]; const r = B.reachWall429(asset, L, tick, side, B.zonesNow(asset), o5 ? Number(o5.o) : 0); if (r) why.push(String(r)); } catch {}
    G.__curBook465 = prev;
    return { tick, why };
  } catch { return null; }
}
/** BESTIE's take (V.111 - 2's row `her`, decided on her BEST list by `d`): taken here at her ask if main's door is clear, else skipped with main's reason. */
export async function wallsTake783(her: any, d: any): Promise<Row783 | null> {
  try {
    if (!her || !d || d.ok !== true || (her.side !== "up" && her.side !== "down") || !her.ticker || !(Number(her.ask) > 0.01 && Number(her.ask) < 0.99)) return null;
    const id = `${her.ticker}:bestiewalls`;
    if (st().rows.some((r) => r.id === id) || sk().rows.some((r) => r.id === id)) return null; // one per window, like her
    const door = await mainDoor783(String(her.asset), String(her.side));
    if (st().rows.some((r) => r.id === id) || sk().rows.some((r) => r.id === id)) return null;
    const skip = !door ? "no board to judge (main's door needs the lines and a live tick)" : door.why.length ? door.why[0] : null;
    const ask = Number(her.ask);
    const r: Row783 = { id, book: BOOK783, setup: String(her.setup || ""), tf: String(her.tf || ""), kind: String(her.kind || ""), asset: her.asset, ticker: her.ticker, closeTime: her.closeTime, at: her.at, readAt: her.readAt, of: String(her.id || ""),
      side: her.side, ask, multiple: Math.round((1 / ask) * 100) / 100, contracts: STAKE / ask, stake: STAKE, spot: Number(her.spot) || 0, vwap: Number(her.vwap) || 0, stdev: Number(her.stdev) || 0, level: her.level ?? null,
      tick: door?.tick || 0, walls: door?.why || [], skip, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null };
    if (skip) { r.setup = `${skip.slice(0, 90)} · ${r.setup}`; sk().rows.push(r); save(SKIPS, sk()); } else { st().rows.push(r); save(FILE, st()); }
    return r;
  } catch { return null; }
}
function logFill783(r: Row783) {
  try {
    let rows: any[] = [];
    try { const j = JSON.parse(readFileSync(D("fill-log.json"), "utf8")); if (Array.isArray(j)) rows = j; else return; } catch { return; } // never write over a log it could not read
    const id = `${r.id}:banked`;
    if (rows.some((e) => e && e.id === id)) return;
    rows.push({ id, at: new Date().toISOString(), kind: "banked", tradeId: r.id, asset: r.asset, ticker: r.ticker, side: r.side, venue: VENUE783, stake: r.stake, ask: r.ask, multiple: r.multiple,
      profit: r.pnlTp, pattern: `${BOOK783} · ${r.setup}`, opposite: false, target: null, spot: r.spot, vwap: r.vwap, peak: r.bestBid || null, book: BOOK783, setup: r.setup, tf: r.tf, held: r.pnlHold });
    const trimmed = rows.filter((e) => e && typeof e.id === "string").sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8000);
    writeFileSync(D("fill-log.json"), JSON.stringify(trimmed));
  } catch {}
}
/** bids, take-profit and settlement for the taken rows AND the skipped ones (what the skip would have done) - the same steps as V.111 - 2's rows. Only taken rows go to the fill log. */
export async function wallsSettle783(assets: Record<string, any> | null | undefined) {
  try {
    if (!assets) return;
    for (const [s, f, isSkip] of [[st(), FILE, false], [sk(), SKIPS, true]] as [{ rows: Row783[] }, string, boolean][]) {
      let dirty = false;
      for (const r of s.rows) {
        if (r.result !== "open") { if (!isSkip && !r.logged) { logFill783(r); r.logged = true; dirty = true; } continue; }
        const m = assets[r.asset]?.market;
        if (m?.ticker === r.ticker && r.soldBid == null) {
          const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
          if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; } }
        }
        if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
        const kk = (G.__bestieWallsRes ||= {}) as Record<string, number>, key = r.ticker + (isSkip ? ":skip" : ""); if (Date.now() - (kk[key] || 0) < 15000) continue; kk[key] = Date.now();
        const fm = typeof G.__v1112FetchMarket === "function" ? G.__v1112FetchMarket : (await import("./kalshi")).fetchMarket; // read only: the market's settled result
        const mk = await fm(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
        if (!res) continue;
        const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
        r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - STAKE) * 100) / 100;
        r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - STAKE) * 100) / 100;
        if (!isSkip) { logFill783(r); r.logged = true; }
        dirty = true;
      }
      if (dirty) save(f, s);
    }
  } catch {}
}
