// fix690 70% CLUB - PAPER (Love Nov 5 2026 ~1:28 AM PT: "only taking the set ups that won over 70% ... thaaaats why my win rate was 70%" + ~1:38 AM PT: "we cut the set ups
// that lost more than they won, and had a minimum of 65% hit rate. after that we had it at a steady 70-80% ... we'll be able to do that this week").
// PAPER ONLY: this file never places, sizes, cancels or reads a live order and never touches a live book, wall, umpire or switch.
// When her main or rejection book (recon-tog / recon-rej paper rows) opens a set up that is on the nightly list (data/club-list-690.json, built by tools/club-list-690.py from the
// PAST 14 days only - no hindsight), this book takes the SAME side, $20 paper at the live ask - but only when the ask is at least 5c under that set up's own hit rate
// (a 70% set up is never bought at 72c). Two lists, scored side by side:
//   CLUB 70  = won 70%+ with 15+ trades.        HER RULE = won 65%+ with 15+ trades and made money.
//   HER LADDER (Love Nov 5 2026 ~2:00 AM PT: "set ups that won more than half the time in 24 hours ... and then 60%+ of the time over the week ... some set ups aren't all bad
//   and just have rllly bad days on occasion") = won more than half its last 24 h (3+) or 60%+ over the week (10+); dropped only after two bad PT days in a row.
// One ticket per window per asset per list. Scored held to the bell and under her take-profit (half at 75% of the way to $1, the rest trails from 90%: sold 5c off its best bid).
import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const FILE = "club-book-690.json";
const SET = /^(Rejected (up|down) off|Failed break (above|below)|Break (above|below)|Close (above|below)|Tap-reject at|OG tap-reject (up|down) off|\dm rejection off|\dm flip - rejected (up|down) off|Fake-out turn (over|under)|Candle (rising|falling)|Launched from the (top|bottom) third|Launched|Red candle falling|Green candle rising|Top third|Bottom third)/;
const BAND = /(5m PP|[-+]\d(?:\.5)?σ|session VWAP|fresh VWAP|Green zone|Red zone|Bollinger (upper|lower)|BB (upper|lower)|5m [RS]\d)/;
type Row690 = { id: string; list: "club70" | "herRule" | "ladder"; key: string; hit: number; src: string; asset: string; ticker: string; closeTime: string; at: string; side: "up" | "down"; label: string; ask: number; contracts: number; bestBid: number; half: boolean; halfBid: number | null; trail: boolean; soldBid: number | null; result: "open" | "win" | "loss"; pnlHold: number | null; pnlTp: number | null };
/** the same set up key as the STATS table and the nightly list: asset|side|set up|line */
export function key690(asset: string, side: string, label: string): string {
  const m = SET.exec(label), k = m ? m[1].replace(/^\dm /, "N-m ") : "other", g = BAND.exec(label);
  return `${asset}|${side}|${k}|${g ? g[1] : "-"}`;
}
function st(): { rows: Row690[]; seen: Record<string, number> } { if (G.__club690) return G.__club690; let s = { rows: [] as Row690[], seen: {} as Record<string, number> }; try { if (existsSync(D(FILE))) s = { seen: {}, ...JSON.parse(readFileSync(D(FILE), "utf8")) }; } catch {} G.__club690 = s; return s; }
function save(force = false) { if (!force && G.__club690SaveAt && Date.now() - G.__club690SaveAt < 10000) return; G.__club690SaveAt = Date.now(); try { const s = st(); s.rows = s.rows.slice(-4000); const cut = Date.now() - 6 * 3600000; for (const k of Object.keys(s.seen)) if (s.seen[k] < cut) delete s.seen[k]; writeFileSync(D(FILE + ".tmp"), JSON.stringify(s)); renameSync(D(FILE + ".tmp"), D(FILE)); } catch {} }
export function lists690(): { club70: Map<string, number>; herRule: Map<string, number>; ladder: Map<string, number>; at: string } {
  try { const p = D("club-list-690.json"), m = statSync(p).mtimeMs; if (G.__club690L?.m === m) return G.__club690L.v;
    const j = JSON.parse(readFileSync(p, "utf8")), mk = (xs: any[]) => new Map<string, number>((Array.isArray(xs) ? xs : []).map((x) => [String(x.key), Number(x.hit) || 0]));
    const v = { club70: mk(j.club70), herRule: mk(j.herRule), ladder: mk(j.ladder), at: String(j.at || "") }; G.__club690L = { m, v }; return v;
  } catch { return { club70: new Map(), herRule: new Map(), ladder: new Map(), at: "" }; }
}
function hers(): any[] { // her main + rejection paper rows: the desk's shared parse of grok-og.json when current, else one parse per file change
  try {
    const p = D("grok-og.json"), f = statSync(p), k = `${f.mtimeMs}:${f.size}`;
    if (G.__club690Src?.key === k) return G.__club690Src.rows;
    const all = G.__ogShared?.key === k && Array.isArray(G.__ogShared.rows) ? G.__ogShared.rows : JSON.parse(readFileSync(p, "utf8"));
    G.__club690Src = { key: k, rows: Array.isArray(all) ? all.filter((r: any) => (r?.lane === "recon-tog" || r?.lane === "recon-rej") && Date.now() - Date.parse(String(r?.at)) < 90000) : [] };
    return G.__club690Src.rows;
  } catch { return G.__club690Src?.rows || []; }
}
export async function clubTick690(assets: Record<string, any> | null | undefined) {
  if (!assets || G.__club690Busy) return;
  G.__club690Busy = true;
  try {
    const s = st(); let dirty = false; const L = lists690(), now = Date.now();
    if (L.club70.size || L.herRule.size || L.ladder.size) for (const r of hers()) {
      if (!r?.id || s.seen[r.id] || !(now - Date.parse(String(r.at)) < 90000) || !(r.side === "up" || r.side === "down")) continue;
      const a = assets[r.asset], m = a?.market, left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || m.ticker !== r.ticker) continue;
      s.seen[r.id] = now;
      const k = key690(r.asset, r.side, String(r.label || "")), ask = Number(r.side === "up" ? m.yesAsk : m.noAsk);
      for (const list of ["club70", "herRule", "ladder"] as const) {
        const hit = L[list].get(k); if (hit == null) continue;
        if (s.rows.some((x) => x.list === list && x.ticker === r.ticker && x.asset === r.asset)) continue; // one per window per list
        if (!(ask > 0.02 && ask <= hit - 0.05)) continue; // never pay more than its hit rate minus 5c
        s.rows.push({ id: `${r.id}:${list}`, list, key: k, hit, src: String(r.id), asset: r.asset, ticker: r.ticker, closeTime: new Date(now + left * 1000).toISOString(), at: new Date().toISOString(), side: r.side, label: String(r.label || "").slice(0, 120), ask, contracts: 20 / ask, bestBid: 0, half: false, halfBid: null, trail: false, soldBid: null, result: "open", pnlHold: null, pnlTp: null });
        dirty = true;
      }
    }
    for (const r of s.rows) {
      if (r.result !== "open") continue;
      const m = assets[r.asset]?.market;
      if (m?.ticker === r.ticker && r.soldBid == null) {
        const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
        if (bid > 0) { r.bestBid = Math.max(r.bestBid, bid); if (!r.half && bid >= r.ask + 0.75 * (1 - r.ask)) { r.half = true; r.halfBid = bid; dirty = true; } if (bid >= r.ask + 0.9 * (1 - r.ask)) r.trail = true; if (r.trail && bid <= r.bestBid - 0.05) { r.soldBid = bid; dirty = true; } }
      }
      if (Date.now() < Date.parse(r.closeTime) + 20000) continue;
      const kk = (G.__club690Res ||= {}) as Record<string, number>; if (Date.now() - (kk[r.ticker] || 0) < 15000) continue; kk[r.ticker] = Date.now();
      const mk = await fetchMarket(r.ticker).catch(() => null); const res = mk?.result === "yes" ? "up" : mk?.result === "no" ? "down" : "";
      if (!res) continue;
      const won = res === r.side, pay = won ? 1 : 0, c = r.contracts, h = r.half ? c / 2 : 0, rest = c - h;
      r.result = won ? "win" : "loss"; r.pnlHold = Math.round((c * pay - 20) * 100) / 100; r.pnlTp = Math.round(((r.half ? h * (r.halfBid as number) : 0) + rest * (r.soldBid != null ? r.soldBid : pay) - 20) * 100) / 100; dirty = true;
    }
    if (dirty) save(true); else save();
  } catch {} finally { G.__club690Busy = false; }
}
export function clubSummary690() {
  const rows = st().rows, L = lists690(), rd = (x: number) => Math.round(x * 100) / 100;
  const one = (list: "club70" | "herRule" | "ladder") => { const xs = rows.filter((r) => r.list === list), c = { n: xs.length, open: 0, w: 0, l: 0, hold: 0, tp: 0 }; for (const r of xs) { if (r.result === "open") c.open++; if (r.result === "win") c.w++; if (r.result === "loss") c.l++; c.hold += r.pnlHold || 0; c.tp += r.pnlTp || 0; } return { ...c, hold: rd(c.hold), tp: rd(c.tp), setups: [...L[list].entries()].map(([k, h]) => `${k.replace(/\|/g, " · ")} (${Math.round(h * 100)}%)`) }; };
  return { listAt: L.at, club70: one("club70"), herRule: one("herRule"), ladder: one("ladder"), recent: rows.slice(-25).reverse().map((r) => ({ at: r.at, list: r.list, asset: r.asset, side: r.side, label: r.label, ask: r.ask, hit: r.hit, result: r.result, pnlTp: r.pnlTp })) };
}
