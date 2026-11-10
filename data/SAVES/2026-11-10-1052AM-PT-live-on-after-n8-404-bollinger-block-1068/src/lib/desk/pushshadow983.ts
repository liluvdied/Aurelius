// fix983 PUSH SHADOW TEST - PAPER (Love Nov 7 2026 6:29 PM PT: "let's keep the numbers we set in place for now , can you test all of these numbers over night (scaled for the weekends) and the first day or two
// of the week? we should know rather quickly which one is the YEUP"). Her live push numbers stay exactly as they are; this file only WATCHES and scores every candidate push side by side on real moments and real Kalshi asks.
// PAPER ONLY: it never places, sizes, cancels or reads a live order, never touches a book, wall, umpire or switch. Its only network reads are Kalshi's PUBLIC market data (GET).
//   TURN: price comes to one of her lines (5m low for a long / 5m high for a short within 15% of her session channel W above / below it, not broken by more than 7.5% of W), price is back on her side of
//         the line and her 2m or 5m candle is her colour. Lines: session VWAP and its σ bands, red / green zone, Bollinger upper / middle / lower, pink (5m PP). Turn price = the 5m low (long) / high (short).
//   PUSH: for every candidate variant, the first moment price has pushed her way by that variant's amount off the turn (no candle-open requirement), with >= 2 min left in the Kalshi 15m window
//         and her ask <= 66.7c (her 1.5x floor) - one paper ticket per variant per window per asset, at the live Kalshi ask for her side.
//   SCORE: at settlement (Kalshi's public result): win / loss, $ per $1 at the ask (Kalshi fee ~7% of (1 - ask) taken off, as the study), multiple (1 / ask), and "fake blip" = price came back through
//         the turn within 3 min after the push. Fri 2 PM - Sun 3 PM PT uses each variant's weekend numbers and rows are tagged weekend.
// Variants (data/reports/push-sliding-scale-nov7.md + push-study-nov7.md): now = her live rule, slide = the sliding scale, pct = plain % of W, fx1/fx2/fx3 = the fixed-$ ladder rows.
// WICK (coordinator add-on, her wick rejection sizes): a flat $ pull-back from the wick extreme (the 5m low for a long / high for a short) at one of her lines, price back on her side of the line, COLOUR-EXEMPT
//   (no 2m / 5m colour needed), >= 2 min left - ETH $0.33 / $0.50 (her live pick) / $0.75 / $1.50, BTC $10 / $20 / $30, gold $1 / $2 / $3, BNB 5c / 10c / 20c, XRP $0.0003 / $0.0005 / $0.0008. Same scoring, own section.
// Files: data/push-shadow-983.json (rolling, atomic), data/push-shadow-983.jsonl (one line per resolved ticket), data/reports/push-shadow-summary.md (every 15 min at most).
import { readFileSync, writeFileSync, existsSync, appendFileSync, renameSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket, mapMarket } from "./kalshi";
import { ethBands682 } from "./ethbook";
import type { KalshiMarket } from "./types";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const BASE = "https://external-api.kalshi.com/trade-api/v2";
type Bar = { t: number; o: number; h: number; l: number; c: number; v?: number };
type Line = { name: string; price: number };
export type Asset983 = "btc" | "gold" | "eth" | "bnb" | "xrp" | "sol";
export type Variant983 = "now" | "slide" | "pct" | "fx1" | "fx2" | "fx3" | `wick${string}`;
export const ASSETS983: Asset983[] = ["btc", "gold", "eth", "bnb", "xrp", "sol"];
export const VARIANTS983: Variant983[] = ["now", "slide", "pct", "fx1", "fx2", "fx3"];
export const SERIES983: Record<Asset983, string> = { btc: "KXBTC15M", gold: "KXGOLD15M", eth: "KXETH15M", bnb: "KXBNB15M", xrp: "KXXRP15M", sol: "KXSOL15M" };
export type Turn983 = { id: string; asset: Asset983; line: string; kind: "band" | "pink"; side: "up" | "down"; turn: number; W: number; at: string; weekend: boolean; wick?: boolean };
/** her wick rejection sizes (flat $ pull-back from the wick extreme, colour-exempt) */
export const WICK983: Partial<Record<Asset983, number[]>> = { eth: [0.33, 0.5, 0.75, 1.5], btc: [10, 20, 30], gold: [1, 2, 3], bnb: [0.05, 0.1, 0.2], xrp: [0.0003, 0.0005, 0.0008] };
export const wickVariants983 = (a: Asset983): Variant983[] => (WICK983[a] || []).map((x) => `wick${x}` as Variant983);
export type Ticket983 = { id: string; asset: Asset983; variant: Variant983; wick?: boolean; ticker: string; closeTime: string; at: string; weekend: boolean; side: "up" | "down"; line: string; kind: "band" | "pink"; turn: number; W: number; need: number; push: number; spot: number; ask: number; mult: number; fake: boolean | null; result: "open" | "win" | "loss"; perDollar: number | null };
type State983 = { turns: Turn983[]; tickets: Ticket983[]; skips: Record<string, number> }; // fix983 skips = her 66.7c floor log only (paper)

// ---- her weekend (fix837's hours: Fri 2 PM - Sun 3 PM PT) ----
export function weekend983(now = Number(G.__now983) || Date.now()): boolean {
  try {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date(now));
    const wd = p.find((x) => x.type === "weekday")?.value, h = Number(p.find((x) => x.type === "hour")?.value) % 24;
    return (wd === "Fri" && h >= 14) || wd === "Sat" || (wd === "Sun" && h < 15);
  } catch { return false; }
}

// ---- the numbers ----
type Clamp = [number, number, number]; // [% of W, floor $, cap $]
const SLIDE: Record<string, { band: Clamp; pink: Clamp }> = {
  btc: { band: [0.15, 12, 30], pink: [0.15, 50, 75] }, "btc-we": { band: [0.06, 5, 20], pink: [0.08, 20, 30] },
  gold: { band: [0.3, 3, 4], pink: [0.06, 1.25, 2.5] },
  eth: { band: [0.1, 0.4, 1], pink: [0.15, 0.75, 2] },
  xrp: { band: [0.06, 0.0004, 0.0013], pink: [0.15, 0.0004, 0.001] },
  sol: { band: [0.06, 0.02, 0.1], pink: [0.15, 0.05, 0.1] },
  bnb: { band: [0.06, 0.1, 0.3], pink: [0.2, 0.3, 0.4] },
};
const PCT: Record<string, { band: number; pink: number }> = { btc: { band: 0.2, pink: 0.08 }, "btc-we": { band: 0.08, pink: 0.08 }, gold: { band: 0.15, pink: 0.08 }, coin: { band: 0.15, pink: 0.15 } };
const FIX: Record<string, number[]> = { btc: [15, 20, 35], gold: [0.2, 0.75, 1.3] };
export const WEEKEND_FIX983 = 0.5; // her weekend channel is about half the weekday one (study: 8% of W = ~$20 weekday vs ~$8-15 weekend), so the fixed $ rows are halved Fri 2 PM - Sun 3 PM (crypto only; gold is shut)
const kOf = (spot: number) => spot / 80000; // the desk's coin scaling (her BTC numbers by price, as ethbook / btc2c / xrp5m961)
const clamp = (c: Clamp, W: number) => Math.min(c[2], Math.max(c[1], c[0] * W));
/** the push one variant asks for, in $ of the asset */
export function need983(asset: Asset983, v: Variant983, kind: "band" | "pink", W: number, spot: number, weekend: boolean): number {
  if (String(v).startsWith("wick")) return Number(String(v).slice(4)); // her flat wick size, every day
  const coin = asset !== "btc" && asset !== "gold", we = weekend && asset !== "gold", k = kOf(spot);
  if (v === "now") {
    if (asset === "btc") return 5; // bundle Nov 8: her live BTC push is $5 at every hour, band and pink (fix1030) - was fix669 pink $6 / fix807 band $50 / fix837 weekend $5
    if (asset === "gold") return kind === "pink" ? 0.1 : W > 10 ? 0.2 : 0.15; // fix827
    if (asset === "xrp") return 0.00025; /* Love Nov 8 2026 5:28 PM PT: "same push distances bb" - pink and band 0.00025 */ // bundle Nov 8: her XRP lane push $0.00025 band (fix1031) / $0.0010 pink (fix1004) - was 0
    if (asset === "eth") return 0.25; // bundle Nov 8: her ETH push 25c (fix1030, her 7:17 AM words)
    return 6 * k; // ETH / BNB / SOL books: her BTC $6 push, by price
  }
  if (v === "slide") return clamp(SLIDE[asset === "btc" && we ? "btc-we" : asset][kind], W);
  if (v === "pct") return PCT[asset === "btc" ? (we ? "btc-we" : "btc") : asset === "gold" ? "gold" : "coin"][kind] * W;
  const i = v === "fx1" ? 0 : v === "fx2" ? 1 : 2;
  const base = asset === "gold" ? FIX.gold[i] : coin ? FIX.btc[i] * k : FIX.btc[i];
  return we ? base * WEEKEND_FIX983 : base;
}
/** words for the card / report */
export function variantWords983(asset: Asset983, v: Variant983): string {
  if (String(v).startsWith("wick")) { const x = Number(String(v).slice(4)); return `wick pull-back ${x >= 1 ? "$" + x : x >= 0.01 ? Math.round(x * 100) + "c" : "$" + x}, colour-exempt${asset === "eth" && x === 0.5 ? " (her live pick)" : ""}`; }
  const $ = (x: number) => (x >= 1 ? `$${+x.toFixed(2)}` : x >= 0.01 ? `${Math.round(x * 100)}c` : `$${+x.toPrecision(2)}`), pc = (x: number) => `${Math.round(x * 100)}%W`;
  const cl = (c: Clamp) => `${pc(c[0])} [${$(c[1])}-${$(c[2])}]`;
  if (v === "now") return asset === "btc" ? "band $50 wkday / $5 wkend · pink $6 (LIVE)" : asset === "gold" ? "band 15c (W<=$10) / 20c · pink 10c (LIVE)" : asset === "xrp" ? "any 2m/5m flip, no $ push (LIVE)" : "BTC $6 by price (LIVE)";
  if (v === "slide") { const s = SLIDE[asset]; return asset === "btc" ? `band ${cl(s.band)} · pink ${cl(s.pink)}; wkend band ${cl(SLIDE["btc-we"].band)} · pink ${cl(SLIDE["btc-we"].pink)}` : `band ${cl(s.band)} · pink ${cl(s.pink)}`; }
  if (v === "pct") return asset === "btc" ? "band 20%W · pink 8%W; wkend 8%W" : asset === "gold" ? "band 15%W · pink 8%W" : "15%W";
  const i = v === "fx1" ? 0 : v === "fx2" ? 1 : 2;
  return asset === "gold" ? `flat ${$(FIX.gold[i])}` : asset === "btc" ? `flat $${FIX.btc[i]} (wkend $${FIX.btc[i] * WEEKEND_FIX983})` : `BTC $${FIX.btc[i]} by price (wkend half)`;
}

// ---- state (fix983, paper) ----
function st(): State983 { if (G.__ps983) return G.__ps983; let s: State983 = { turns: [], tickets: [], skips: {} }; try { if (existsSync(D("push-shadow-983.json"))) s = { turns: [], tickets: [], skips: {}, ...JSON.parse(readFileSync(D("push-shadow-983.json"), "utf8")) }; } catch {} G.__ps983 = s; return s; }
function save(force = false) {
  if (!force && G.__ps983SaveAt && Date.now() - G.__ps983SaveAt < 10000) return; G.__ps983SaveAt = Date.now();
  try { const s = st(); s.turns = s.turns.slice(-4000); s.tickets = s.tickets.slice(-8000); const cut = Date.now() - 86400000; for (const k of Object.keys(s.skips)) if (s.skips[k] < cut) delete s.skips[k];
    writeFileSync(D("push-shadow-983.json.tmp"), JSON.stringify(s)); renameSync(D("push-shadow-983.json.tmp"), D("push-shadow-983.json")); } catch {}
}

// ---- the read ----
const SESS = (n: string) => /σ$|^session VWAP$/.test(n);
/** her session channel around price */
export function channel983(L: Line[], spot: number): number { const S = L.filter((l) => SESS(l.name)).map((l) => l.price).sort((a, b) => a - b); const up = S.find((x) => x > spot), dn = [...S].reverse().find((x) => x < spot); return up !== undefined && dn !== undefined ? up - dn : 0; }
/** pure: the turns live right now (one per side at most - the line nearest the turn), the study's rule */
export function turns983(bs: Bar[], L: Line[], spot: number, nowMs: number, colour = true): { side: "up" | "down"; line: string; P: number; kind: "band" | "pink"; tip: number; W: number; t5: number }[] {
  const out: { side: "up" | "down"; line: string; P: number; kind: "band" | "pink"; tip: number; W: number; t5: number }[] = [];
  const W = channel983(L, spot); if (!(W > 0)) return out;
  const now = nowMs / 1000, f5 = Math.floor(now / 300) * 300, f2 = Math.floor(now / 120) * 120;
  const in5 = bs.filter((b) => b.t >= f5 && b.t <= now), in2 = bs.filter((b) => b.t >= f2 && b.t <= now); if (!in5.length || !in2.length) return out;
  const o5 = in5[0].o, o2 = in2[0].o, h5 = Math.max(...in5.map((b) => b.h), spot), l5 = Math.min(...in5.map((b) => b.l), spot);
  for (const side of ["up", "down"] as const) {
    const tip = side === "up" ? l5 : h5, col = !colour || (side === "up" ? spot > o2 || spot > o5 : spot < o2 || spot < o5); if (!col) continue;
    let best: Line | null = null, bd = Infinity;
    for (const l of L) {
      if (!(l.price > 0)) continue; const P = l.price;
      const ok = side === "up" ? tip <= P + 0.15 * W && tip >= P - 0.075 * W && spot > P : tip >= P - 0.15 * W && tip <= P + 0.075 * W && spot < P;
      if (ok && Math.abs(tip - P) < bd) { bd = Math.abs(tip - P); best = l; }
    }
    if (best) out.push({ side, line: best.name, P: best.price, kind: best.name === "5m PP" ? "pink" : "band", tip, W, t5: f5 });
  }
  return out;
}
/** her lines from the desk's own pipeline (BTC / gold) */
function deskLines(asset: "btc" | "gold"): Line[] {
  const L0 = ((G.__lawBands?.[asset]?.L || []) as any[]).map((l) => ({ name: String(l?.name), price: Number(l?.price) })).filter((l) => l.price > 0);
  const out: Line[] = [];
  for (const l of L0) {
    if (SESS(l.name) || l.name === "5m PP") out.push(l);
    else if (l.name === "5m R1" || l.name === "Red zone") out.push({ name: "Red zone", price: l.price });
    else if (l.name === "5m S1" || l.name === "Green zone") out.push({ name: "Green zone", price: l.price });
  }
  const bz = G.__bbsr?.[asset]; const u = Number(bz?.bbU) || 0, d = Number(bz?.bbL) || 0;
  if (u > 0 && d > 0) out.push({ name: "BB upper", price: u }, { name: "BB middle", price: (u + d) / 2 }, { name: "BB lower", price: d });
  return out;
}
const mapBars = (B: any): Bar[] => (B?.m instanceof Map ? ([...B.m.values()] as Bar[]).sort((a, b) => a.t - b.t) : []);
/** the bars + lines for each asset, from the caches the desk already fills (no feed of its own) */
export function feed983(asset: Asset983): { bs: Bar[]; L: Line[] } | null {
  let bs: Bar[] = [];
  if (asset === "btc" || asset === "gold") bs = ((G.__pivBars?.[asset]?.bars || []) as Bar[]).slice();
  else if (asset === "eth") bs = mapBars(G.__eth682Bars);
  else if (asset === "bnb") bs = mapBars(G.__mc833Bars?.["BNB-USD"]);
  else if (asset === "xrp") bs = mapBars(G.__xrp961Bars);
  else if (asset === "sol") { bs = mapBars(G.__mc833Bars?.["SOL-USD"]); if (!bs.length) bs = mapBars(G.__sol832Bars); }
  if (bs.length < 40) return null;
  let L: Line[];
  if (asset === "btc" || asset === "gold") L = deskLines(asset);
  else { L = ethBands682(bs as any).filter((l) => SESS(l.name) || /^(5m PP|Red zone|Green zone|BB upper|BB lower)$/.test(l.name)); const u = L.find((l) => l.name === "BB upper")?.price, d = L.find((l) => l.name === "BB lower")?.price; if (u && d) L.push({ name: "BB middle", price: (u + d) / 2 }); }
  return L.length ? { bs, L } : null;
}

/** fix983 pure-ish: one pass for one asset at one moment - records turns, opens tickets, marks fakes. mk = the running Kalshi 15m market (or null). */
export function step983(asset: Asset983, bs: Bar[], L: Line[], mk: KalshiMarket | null, nowMs: number): { turns: number; opened: Ticket983[] } {
  const s = st(), spot = bs[bs.length - 1]?.c; const opened: Ticket983[] = [];
  if (!(spot > 0) || nowMs / 1000 - bs[bs.length - 1].t > 180) return { turns: 0, opened };
  const we = weekend983(nowMs);
  // fake blips: back through the turn within 3 min of the push
  for (const k of s.tickets) {
    if (k.asset !== asset || k.fake !== null) continue; const t0 = Date.parse(k.at), m0 = Math.floor(t0 / 60000) * 60;
    const back = (x: number) => (k.side === "up" ? x <= k.turn : x >= k.turn);
    if (nowMs - t0 <= 180000 && back(spot)) { k.fake = true; continue; }
    if (bs.some((b) => b.t >= m0 + 60 && b.t * 1000 < t0 + 180000 && b.t * 1000 <= nowMs && back(k.side === "up" ? b.l : b.h))) { k.fake = true; continue; }
    if (nowMs - t0 > 180000) k.fake = false;
  }
  const T = turns983(bs, L, spot, nowMs), WV = wickVariants983(asset), TW = WV.length ? turns983(bs, L, spot, nowMs, false) : [];
  for (const [x, wick] of [...T.map((x) => [x, false] as const), ...TW.map((x) => [x, true] as const)]) {
    const id = `${wick ? "wick:" : ""}${asset}:${x.t5}:${x.side}:${x.line}`, old = s.turns.find((r) => r.id === id);
    if (old) old.turn = x.side === "up" ? Math.min(old.turn, x.tip) : Math.max(old.turn, x.tip);
    else s.turns.push({ id, asset, line: x.line, kind: x.kind, side: x.side, turn: x.tip, W: x.W, at: new Date(nowMs).toISOString(), weekend: we, ...(wick ? { wick: true } : {}) });
    if (!mk || !mk.ticker || Date.parse(mk.closeTime) - nowMs < 120000) continue; // >= 2 min left in her window
    const push = x.side === "up" ? spot - x.tip : x.tip - spot;
    const ask = x.side === "up" ? Number(mk.yesAsk) : Number(mk.noAsk);
    for (const v of wick ? WV : VARIANTS983) {
      const tid = `${mk.ticker}:${asset}:${v}`; if (s.tickets.some((k) => k.id === tid)) continue; // one ticket per variant per window per asset
      const need = need983(asset, v, x.kind, x.W, spot, we); if (!(push >= need - 1e-12)) continue;
      if (!(ask > 0.01 && ask <= 0.667)) { const sk = `${tid}:${x.side}`; if (!s.skips[sk]) { s.skips[sk] = nowMs; try { appendFileSync(D("push-shadow-983-skips.jsonl"), JSON.stringify({ at: new Date(nowMs).toISOString(), id: tid, side: x.side, line: x.line, push, need, ask, why: "ask over her 66.7c floor / no ask" }) + "\n"); } catch {} } continue; }
      const k: Ticket983 = { id: tid, asset, variant: v, ...(wick ? { wick: true } : {}), ticker: mk.ticker, closeTime: mk.closeTime, at: new Date(nowMs).toISOString(), weekend: we, side: x.side, line: x.line, kind: x.kind, turn: x.tip, W: x.W, need, push, spot, ask, mult: Math.round((1 / ask) * 100) / 100, fake: null, result: "open", perDollar: null };
      s.tickets.push(k); opened.push(k);
    }
  }
  return { turns: T.length, opened };
}
/** settle one window from Kalshi's public result ("yes" = up) */
export function settle983(ticker: string, result: string, nowMs = Date.now()): number {
  const s = st(), res = result === "yes" ? "up" : result === "no" ? "down" : ""; if (!res) return 0; let n = 0;
  for (const k of s.tickets) {
    if (k.ticker !== ticker || k.result !== "open" || nowMs < Date.parse(k.closeTime)) continue;
    const won = k.side === res; k.result = won ? "win" : "loss"; k.perDollar = Math.round(((won ? 1 / k.ask - 1 : -1) - 0.07 * (1 - k.ask)) * 10000) / 10000; if (k.fake === null) k.fake = false; n++;
    try { appendFileSync(D("push-shadow-983.jsonl"), JSON.stringify(k) + "\n"); } catch {}
  }
  if (n) save(true); return n;
}

// ---- the summary ----
type Cell = { n: number; w: number; winPct: number | null; avgMult: number | null; perTrade: number | null; fakePct: number | null };
const cell = (rs: Ticket983[]): Cell => { const n = rs.length, w = rs.filter((r) => r.result === "win").length, r2 = (x: number) => Math.round(x * 1000) / 1000;
  return { n, w, winPct: n ? Math.round((1000 * w) / n) / 10 : null, avgMult: n ? r2(rs.reduce((a, r) => a + r.mult, 0) / n) : null, perTrade: n ? r2(rs.reduce((a, r) => a + (r.perDollar || 0), 0) / n) : null, fakePct: n ? Math.round((1000 * rs.filter((r) => r.fake).length) / n) / 10 : null }; };
export function pushShadowSummary983() {
  const s = st(), done = s.tickets.filter((k) => k.result !== "open");
  const rows = ASSETS983.flatMap((a) => VARIANTS983.map((v) => { const rs = done.filter((k) => k.asset === a && k.variant === v);
    return { asset: a, variant: v, words: variantWords983(a, v), open: s.tickets.filter((k) => k.asset === a && k.variant === v && k.result === "open").length, all: cell(rs), weekday: cell(rs.filter((k) => !k.weekend)), weekend: cell(rs.filter((k) => k.weekend)) }; }));
  const wick = ASSETS983.flatMap((a) => wickVariants983(a).map((v) => { const rs = done.filter((k) => k.asset === a && k.variant === v);
    return { asset: a, variant: v, words: variantWords983(a, v), open: s.tickets.filter((k) => k.asset === a && k.variant === v && k.result === "open").length, all: cell(rs), weekday: cell(rs.filter((k) => !k.weekend)), weekend: cell(rs.filter((k) => k.weekend)) }; }));
  const since = s.tickets[0]?.at || s.turns[0]?.at || null;
  return { at: new Date().toISOString(), since, turns: s.turns.length, tickets: s.tickets.length, resolved: done.length, wick, rule: "PAPER shadow: one ticket per variant per Kalshi 15m window per asset at the live ask (<= 66.7c, >= 2 min left); $ per $1 after ~7% fee; fake = back through the turn within 3 min", rows };
}
function writeReport983(force = false) {
  if (!force && G.__ps983RepAt && Date.now() - G.__ps983RepAt < 900000) return; G.__ps983RepAt = Date.now();
  try {
    const S = pushShadowSummary983(), f = (c: Cell) => (c.n ? `${c.w}/${c.n} ${c.winPct}% · ${c.avgMult}x · ${c.perTrade! >= 0 ? "+" : ""}${c.perTrade} · fake ${c.fakePct}%` : "-");
    let md = `# Push shadow test (fix983, PAPER)\n\nLove Nov 7 2026 6:29 PM PT: "test all of these numbers over night (scaled for the weekends) and the first day or two of the week". Her live numbers are unchanged; this only scores them.\n\nUpdated ${S.at} · since ${S.since ?? "-"} · ${S.turns} turns · ${S.tickets} tickets · ${S.resolved} settled.\n\nEach cell: wins/trades win% · avg multiple · $ per $1 · fake blips.\n`;
    for (const a of ASSETS983) {
      md += `\n## ${a.toUpperCase()}\n| variant | numbers | all | weekday | weekend | open |\n|---|---|---|---|---|---|\n`;
      for (const r of S.rows.filter((x) => x.asset === a)) md += `| ${r.variant} | ${r.words} | ${f(r.all)} | ${f(r.weekday)} | ${f(r.weekend)} | ${r.open} |\n`;
    }
    md += `\n# WICK rejection sizes (flat pull-back from the wick extreme at a line, colour-exempt)\n`;
    for (const a of ASSETS983) { const ws = S.wick.filter((x) => x.asset === a); if (!ws.length) continue;
      md += `\n## ${a.toUpperCase()} · WICK\n| size | all | weekday | weekend | open |\n|---|---|---|---|---|\n`;
      for (const r of ws) md += `| ${r.words} | ${f(r.all)} | ${f(r.weekday)} | ${f(r.weekend)} | ${r.open} |\n`; }
    try { mkdirSync(D("reports"), { recursive: true }); } catch {}
    writeFileSync(D("reports/push-shadow-summary.md.tmp"), md); renameSync(D("reports/push-shadow-summary.md.tmp"), D("reports/push-shadow-summary.md"));
  } catch {}
}

// ---- Kalshi public market reads (GET only; one read per series per 5 s, cached) ----
async function j(url: string): Promise<any> { const r = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "aurelius-paper/1.0" }, signal: AbortSignal.timeout(8000) }); return r.json(); }
async function market983(series: string): Promise<KalshiMarket | null> {
  const C = ((G.__ps983Mk ||= {})[series] ||= { at: 0, m: null as KalshiMarket | null });
  if (Date.now() - C.at < 5000) return C.m && Date.parse(C.m.closeTime) > Date.now() ? C.m : null;
  C.at = Date.now();
  try { const d = await j(`${BASE}/markets?series_ticker=${series}&status=open&limit=20`); const ms = ((d?.markets ?? []) as any[]).map(mapMarket).filter((m) => Date.parse(m.closeTime) > Date.now()).sort((a, b) => Date.parse(a.closeTime) - Date.parse(b.closeTime)); C.m = ms[0] || null; } catch {}
  return C.m && Date.parse(C.m.closeTime) > Date.now() ? C.m : null;
}
export async function pushShadowTick983() {
  if (G.__ps983Busy || (G.__ps983At && Date.now() - G.__ps983At < 2000)) return; G.__ps983Busy = true; G.__ps983At = Date.now();
  try {
    try { if (JSON.parse(readFileSync(D("push-shadow-983-cfg.json"), "utf8"))?.on === false) return; } catch {}
    for (const a of ASSETS983) {
      try { const f = feed983(a); if (!f) continue; const mk = await market983(SERIES983[a]); step983(a, f.bs, f.L, mk, Date.now()); } catch {}
    }
    const s = st(), due = [...new Set(s.tickets.filter((k) => k.result === "open" && Date.now() > Date.parse(k.closeTime) + 5000).map((k) => k.ticker))].slice(0, 6), SA = (G.__ps983SetAt ||= {});
    for (const t of due) { if (SA[t] && Date.now() - SA[t] < 20000) continue; SA[t] = Date.now(); try { const m = await fetchMarket(t); if (m?.result) settle983(t, m.result); } catch {} }
    save(); writeReport983();
  } catch {} finally { G.__ps983Busy = false; }
}
