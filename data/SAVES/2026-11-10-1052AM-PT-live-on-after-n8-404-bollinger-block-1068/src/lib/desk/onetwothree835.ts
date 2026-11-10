// fix835 1-2-3 · SEALED · PAPER + fix836 1-2-3 · NEW · PAPER (Love Nov 6 2026: her Oct 25-26 Polymarket BTC 5-minute "1-2-3 BOOK", sealed as it stood in
// PRE295-BUILD - the desk on Oct 26 ~9:30 PM PT - plus a NEW twin with her late door, 1.5x floor, Bollinger cushion and no trading into a line near the target).
// PAPER ONLY. This file and its three sealed modules never send, sign or place an order and never call an authenticated API: entries are priced off the
// Polymarket BTC 5m quotes the desk already records (data/poly5-quotes.jsonl, read-only), $5 a trade, and written to their own stores
// (data/onetwothree-835.json, data/onetwothree-836.json). No other book reads them.
// SEALED like og1012 (fix686): every block between "===== FROZEN" markers - here and in onetwothree835-recon.ts / -walls.ts / -lines.ts - is copied byte for byte
// from data/vault-123-pre295 (copies of PRE295-BUILD recon.ts, bandlock.ts, pivotbooks.ts, engine.ts). seal835() checks each vault file's sha256, that every
// block listed in BLOCKS835 is still present and identical, and their joint fingerprint; any difference = both books stop and the store says why.
// Her frozen code reads "globalThis" - in these files that is the sealed SANDBOX (onetwothree835-sandbox.ts), filled each tick with her 1m chart bars, live
// tick, feed health and tick trail; it never reads or writes the live desk's globals and never imports the live bandlock.ts / recon.ts.
// What is NEW code (plumbing, not frozen): picking her call each 5m slot (one per slot, re-aimed while unfilled), the paper fill at the recorded ask, her exits
// (half at 75% of the max, rest at 90%, else the bell), the -$45 day stop and the 1-hour pause after 4 losses, the settle, and the 836 rules.
import { createHash } from "node:crypto";
import { appendFileSync, closeSync, existsSync, fstatSync, openSync, readFileSync, readSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SANDBOX, liveGlobals } from "./onetwothree835-sandbox";
import { bonesDecide, btcBB, pivot, resample, sessionLines } from "./onetwothree835-recon";
import * as blm from "./onetwothree835-walls";
import * as LN from "./onetwothree835-lines";
const globalThis = SANDBOX; // her frozen blocks below read globalThis - the sealed sandbox, never the live desk

type Bar = { t: number; o: number; h: number; l: number; c: number };
export type Look = { side: "up" | "down"; label: string } | null;
export type Quote835 = { t: number; slug: string; closes: string; target: number | null; bid: number; ask: number };
export type IO835 = { now: number; bars: Bar[]; spot: number; spotAt: number; feed: { ok: boolean; why: string }; a: any; trail: { t: number; c: number }[]; quote: (closes: string) => Quote835 | null; root?: string; noLog?: boolean; read?: Look };
export type Book835 = { book: string; file: string; title: string; nu: boolean };
export const BOOK835: Book835 = { book: "onetwothree835", file: "onetwothree-835.json", title: "1-2-3 · SEALED · PAPER", nu: false };
export const BOOK836: Book835 = { book: "onetwothree836", file: "onetwothree-836.json", title: "1-2-3 · NEW · PAPER", nu: true };
const STAKE = 20; /* fix1048 her flat $20 paper ticket (Love Nov 9 2026: "make all books $20 on paper") */
const r2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- THE SEAL ----------------------------------------------------------------
const VAULT = "data/vault-123-pre295";
const VAULT_SHA: Record<string, string> = { "recon.ts": "26e1d0fd43b214ad76a359838ec3b4c5c0c070e1537f7998b76213e1e043b6e4", "bandlock.ts": "37b66e85726e00282fd94648eb2f3d511c2d64a20d2170bec1f8240a036b81b4", "pivotbooks.ts": "54e7a1757e77d5514cc862a8f233e8f5e20c1f84365eb65f075ab6405e38de84", "engine.ts": "cc6cfc9170574820c6793d42918c3e5de631cef65d54aed525197bd814c0ce03" };
// [the file holding the block, vault file, first line, last line] - every frozen block, in file order
export const BLOCKS835: [string, string, number, number][] = [
  ["onetwothree835-recon.ts","recon.ts",29,29],
  ["onetwothree835-recon.ts","recon.ts",33,34],
  ["onetwothree835-recon.ts","recon.ts",42,46],
  ["onetwothree835-recon.ts","recon.ts",48,58],
  ["onetwothree835-recon.ts","recon.ts",60,70],
  ["onetwothree835-recon.ts","recon.ts",78,80],
  ["onetwothree835-recon.ts","recon.ts",88,99],
  ["onetwothree835-recon.ts","recon.ts",104,109],
  ["onetwothree835-recon.ts","recon.ts",134,341],
  ["onetwothree835-walls.ts","bandlock.ts",14,17],
  ["onetwothree835-walls.ts","bandlock.ts",20,26],
  ["onetwothree835-walls.ts","bandlock.ts",31,36],
  ["onetwothree835-walls.ts","bandlock.ts",40,45],
  ["onetwothree835-walls.ts","bandlock.ts",49,49],
  ["onetwothree835-walls.ts","bandlock.ts",73,75],
  ["onetwothree835-walls.ts","bandlock.ts",78,78],
  ["onetwothree835-walls.ts","bandlock.ts",80,85],
  ["onetwothree835-walls.ts","bandlock.ts",95,95],
  ["onetwothree835-walls.ts","bandlock.ts",98,98],
  ["onetwothree835-walls.ts","bandlock.ts",115,120],
  ["onetwothree835-walls.ts","bandlock.ts",123,128],
  ["onetwothree835-walls.ts","bandlock.ts",170,238],
  ["onetwothree835-walls.ts","bandlock.ts",245,253],
  ["onetwothree835-walls.ts","bandlock.ts",260,278],
  ["onetwothree835-walls.ts","bandlock.ts",283,457],
  ["onetwothree835-walls.ts","bandlock.ts",463,482],
  ["onetwothree835-walls.ts","bandlock.ts",487,488],
  ["onetwothree835-walls.ts","bandlock.ts",492,503],
  ["onetwothree835-walls.ts","bandlock.ts",507,507],
  ["onetwothree835-walls.ts","bandlock.ts",516,522],
  ["onetwothree835-walls.ts","bandlock.ts",525,541],
  ["onetwothree835-walls.ts","bandlock.ts",550,578],
  ["onetwothree835-walls.ts","bandlock.ts",587,781],
  ["onetwothree835-walls.ts","bandlock.ts",1152,1184],
  ["onetwothree835-walls.ts","bandlock.ts",1186,1186],
  ["onetwothree835-walls.ts","bandlock.ts",1199,1238],
  ["onetwothree835-walls.ts","bandlock.ts",1242,1268],
  ["onetwothree835-walls.ts","bandlock.ts",1275,1298],
  ["onetwothree835-walls.ts","bandlock.ts",1372,1443],
  ["onetwothree835-walls.ts","bandlock.ts",1448,1448],
  ["onetwothree835-walls.ts","bandlock.ts",1452,1455],
  ["onetwothree835-walls.ts","bandlock.ts",1459,1473],
  ["onetwothree835-walls.ts","bandlock.ts",1481,1511],
  ["onetwothree835-walls.ts","bandlock.ts",1517,1523],
  ["onetwothree835-walls.ts","bandlock.ts",1529,1563],
  ["onetwothree835-walls.ts","bandlock.ts",1582,1582],
  ["onetwothree835-walls.ts","bandlock.ts",1584,1601],
  ["onetwothree835-walls.ts","bandlock.ts",1612,1635],
  ["onetwothree835-walls.ts","bandlock.ts",1640,1648],
  ["onetwothree835-walls.ts","bandlock.ts",1672,1672],
  ["onetwothree835-walls.ts","bandlock.ts",1742,1756],
  ["onetwothree835-walls.ts","bandlock.ts",1764,1773],
  ["onetwothree835-walls.ts","bandlock.ts",1778,1786],
  ["onetwothree835-walls.ts","bandlock.ts",1792,1803],
  ["onetwothree835-walls.ts","bandlock.ts",1820,1822],
  ["onetwothree835-walls.ts","bandlock.ts",1828,1828],
  ["onetwothree835-walls.ts","bandlock.ts",1842,1852],
  ["onetwothree835-walls.ts","bandlock.ts",1879,1882],
  ["onetwothree835-walls.ts","bandlock.ts",1889,1907],
  ["onetwothree835-walls.ts","bandlock.ts",1914,1914],
  ["onetwothree835-walls.ts","bandlock.ts",1919,1943],
  ["onetwothree835-walls.ts","bandlock.ts",1968,2001],
  ["onetwothree835-walls.ts","bandlock.ts",2006,2014],
  ["onetwothree835-walls.ts","bandlock.ts",2092,2097],
  ["onetwothree835-walls.ts","bandlock.ts",2102,2112],
  ["onetwothree835-walls.ts","bandlock.ts",2169,2174],
  ["onetwothree835-walls.ts","bandlock.ts",2178,2188],
  ["onetwothree835-walls.ts","bandlock.ts",2196,2208],
  ["onetwothree835-walls.ts","bandlock.ts",2214,2236],
  ["onetwothree835-walls.ts","bandlock.ts",2258,2610],
  ["onetwothree835-lines.ts","pivotbooks.ts",23,24],
  ["onetwothree835-lines.ts","pivotbooks.ts",53,53],
  ["onetwothree835-lines.ts","pivotbooks.ts",59,59],
  ["onetwothree835-lines.ts","pivotbooks.ts",67,77],
  ["onetwothree835-lines.ts","pivotbooks.ts",140,183],
  ["onetwothree835-lines.ts","pivotbooks.ts",250,254],
  ["onetwothree835-lines.ts","pivotbooks.ts",259,296],
  ["onetwothree835.ts","recon.ts",520,531],
  ["onetwothree835.ts","recon.ts",742,745],
  ["onetwothree835.ts","engine.ts",3140,3140],
  ["onetwothree835.ts","engine.ts",3248,3314],
  ["onetwothree835.ts","engine.ts",3326,3326],
];
export const FINGERPRINT835 = "f8f3c5fd947393fd1b84dc228ced9541a5095f5063920e7cbd38583f691b8a6e";
const SEAL = { at: 0, ok: false, why: "", root: "" };
export function seal835(root = process.cwd(), force = false): { ok: boolean; why: string } {
  if (!force && SEAL.root === root && Date.now() - SEAL.at < 60000) return { ok: SEAL.ok, why: SEAL.why };
  let ok = false, why = "";
  try {
    const vault: Record<string, string[]> = {};
    for (const [f, want] of Object.entries(VAULT_SHA)) {
      const buf = readFileSync(join(root, VAULT, f));
      if (createHash("sha256").update(buf).digest("hex") !== want) throw new Error(`the vault's PRE295 ${f} changed (sha256)`);
      vault[f] = buf.toString("utf8").split("\n");
    }
    const texts: string[] = [];
    const mods = [...new Set(BLOCKS835.map((b) => b[0]))];
    for (const m of mods) {
      const src = readFileSync(join(root, "src/lib/desk", m), "utf8");
      const found: { vf: string; a: number; b: number; text: string }[] = [];
      const re = /^\/\/ ===== FROZEN 1-2-3 - data\/vault-123-pre295\/(\S+) lines (\d+)-(\d+) =====\n([\s\S]*?)\n\/\/ ===== END FROZEN =====$/gm;
      for (let x = re.exec(src); x; x = re.exec(src)) found.push({ vf: x[1], a: Number(x[2]), b: Number(x[3]), text: x[4] });
      const want = BLOCKS835.filter((b) => b[0] === m);
      if (found.length !== want.length) throw new Error(`${m} has ${found.length} frozen blocks, the seal lists ${want.length}`);
      want.forEach(([, vf, a, b], i) => {
        const f = found[i], v = vault[vf].slice(a - 1, b).join("\n");
        if (!f || f.vf !== vf || f.a !== a || f.b !== b) throw new Error(`${m} frozen block ${i + 1} is not ${vf} lines ${a}-${b}`);
        if (f.text !== v) throw new Error(`${m} frozen block ${i + 1} (${vf} lines ${a}-${b}) no longer matches the vault`);
        texts.push(v);
      });
    }
    if (createHash("sha256").update(texts.join("\n\u0000\n")).digest("hex") !== FINGERPRINT835) throw new Error("the frozen blocks' fingerprint changed");
    ok = true;
  } catch (e: any) { why = String(e?.message || e).slice(0, 200); }
  Object.assign(SEAL, { at: Date.now(), ok, why, root });
  return { ok, why };
}

// ---------------------------------------------------------------- HER READ ----------------------------------------------------------------
// recon.ts reconTick: this 5m candle from her 1m bars + live ticks, then the streak read the 5m 1-2-3 lane took its calls from (fix261 recon-rej5).
export function herRead835(b: Bar[], last1m: Bar | undefined, spot: number, ax: any): Look {
  const id = "btc";
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 520-531 =====
  const f0 = Math.floor(Date.now() / 1000 / 300) * 300;
  const inF = b.filter((x) => x.t >= f0);
  const inP = b.filter((x) => x.t >= f0 - 300 && x.t < f0);
  const prev = inP.length ? { h: Math.max(...inP.map((x) => x.h)), l: Math.min(...inP.map((x) => x.l)) } : null;
  let tr: number[] = [];
  try {
    const GT = globalThis as any;
    const tk = Object.keys(GT).filter((k) => /^__qtrail_\d+$/.test(k)).sort((x, y) => Number(y.slice(9)) - Number(x.slice(9)))[0];
    tr = ((tk && GT[tk]?.[id]) || []).filter((x: any) => x && x.c > 0 && x.t >= f0 * 1000).map((x: any) => Number(x.c));
  } catch { tr = []; }
  const prevC = b.length ? Number(b[b.length - 1].c) : spot;
  const cur = { o: inF.length ? Number(inF[0].o) : tr.length ? tr[0] : prevC, h: Math.max(spot, ...inF.map((x) => x.h), ...tr, -Infinity), l: Math.min(spot, ...inF.map((x) => x.l), ...tr, Infinity) };
// ===== END FROZEN =====
  let lookR: Look = null;
  let lookR5: Look = null;
  try {
// ===== FROZEN 1-2-3 - data/vault-123-pre295/recon.ts lines 742-745 =====
    const pR = pivot(resample(b, 5), 5);
    const LR = [...sessionLines(ax, id), ...(pR ? [{ name: "5m PP", price: pR.pp, unit: pR.a }] : []), ...btcBB(id, Number(sessionLines(ax, id)[0]?.unit) || 0)];
    lookR = bonesDecide(id, LR, spot, last1m, cur, prev, b, true);
    lookR5 = lookR; // fix261: her read exactly as it ran before fix246 (the 5m green streak)
// ===== END FROZEN =====
  } catch { lookR = null; }
  void lookR;
  return lookR5;
}

// ---------------------------------------------------------------- THE SANDBOX TICK ----------------------------------------------------------------
type Lines835 = { L: { name: string; price: number; unit: number }[]; bb: { bbU: number; bbL: number } | null };
export function prep835(io: IO835): Lines835 {
  const S = SANDBOX, now = io.now;
  S.__q835 = { btc: { c: io.spot, at: io.spotAt } };
  S.__fh835 = { btc: io.feed };
  S.__pivBars = { btc: { at: now, bars: io.bars } };
  S.__qtrail_835 = { btc: io.trail };
  // pivotbooks.ts (PRE295): her wall's band list = the ogp5-fast lane's lines (session bands + 5m CM pivots incl. the forming candle) + the BTC Bollinger window
  // (closed since Oct 20), refreshed every pass (__lawBands); the chart's 5m Bollinger (bbsrFrame over her 1m chart bars) is both __bbsr and __bbsrChart.
  const sess = LN.sessionLines(io.a, "btc");
  const p = LN.pivot(LN.resample(io.bars, 5), 5);
  const L = [...sess, ...(p ? LN.lines(p, 5) : [])].map((l) => ({ name: String(l.name), price: Number(l.price), unit: Number(l.unit) || 0 }));
  const L2 = [...L, ...LN.btcBBWindow("btc", Number(L[0]?.unit) || 0)].filter((l) => l.price > 0);
  S.__lawBands = { btc: { at: now, L: L2 } };
  const bf = LN.bbsrFrame(io.bars, now / 1000);
  S.__bbsr = { btc: bf ? { ...bf, at: now } : null };
  S.__bbsrChart = { btc: bf ? { ...bf, at: now } : null };
  return { L: L2, bb: bf ? { bbU: bf.bbU, bbL: bf.bbL } : null };
}

// ---------------------------------------------------------------- THE NEW BOOK'S RULES (fix836, new code) ----------------------------------------------------------------
const SESS836 = /σ$|^session VWAP$|^fresh VWAP$/;
function chan836(L: Lines835["L"], spot: number): { lo: number; hi: number; w: number } | null {
  const s = L.filter((l) => SESS836.test(l.name)).map((l) => l.price);
  const hi = Math.min(...s.filter((x) => x > spot)), lo = Math.max(...s.filter((x) => x <= spot));
  return Number.isFinite(hi) && Number.isFinite(lo) && hi > lo ? { lo, hi, w: hi - lo } : null;
}
/** the desk's Bollinger cushion for BTC (bandlock fix173 / fix514): 10% of her session channel with a $50 floor, measured from price - no long with the 5m
 *  Bollinger upper above price inside it, no short with the lower below price inside it. Once price is through the Bollinger it is broken and she's clear. */
export function bbCushion836(side: string, spot: number, bb: Lines835["bb"], L: Lines835["L"]): string {
  if (!bb || !(spot > 0)) return "";
  const ch = chan836(L, spot), cu = Math.max(50, ch ? 0.1 * ch.w : 0);
  if (side === "up" && bb.bbU > spot && bb.bbU - spot <= cu) return `BOLLINGER CUSHION (836): long $${(bb.bbU - spot).toFixed(2)} under the unbroken Bollinger upper (${bb.bbU.toFixed(2)}) - inside the $${cu.toFixed(2)} cushion`;
  if (side === "down" && bb.bbL > 0 && bb.bbL < spot && spot - bb.bbL <= cu) return `BOLLINGER CUSHION (836): short $${(spot - bb.bbL).toFixed(2)} over the unbroken Bollinger lower (${bb.bbL.toFixed(2)}) - inside the $${cu.toFixed(2)} cushion`;
  return "";
}
/** no trading INTO a line within $50 of the target: a long with any of her lines ahead of price (above it) sitting within $50 of the price to beat, or a short
 *  with one below price within $50 of it, is refused - price would have to break that line to clear the target. */
export function intoLine836(side: string, spot: number, target: number, L: Lines835["L"], bb: Lines835["bb"]): string {
  if (!(spot > 0) || !(target > 0)) return "";
  const all = [...L, ...(bb ? [{ name: "Bollinger upper", price: bb.bbU, unit: 0 }, { name: "Bollinger lower", price: bb.bbL, unit: 0 }] : [])];
  const hit = all.filter((l) => l.price > 0 && Math.abs(l.price - target) <= 50 && (side === "up" ? l.price > spot : l.price < spot)).sort((x, y) => Math.abs(x.price - spot) - Math.abs(y.price - spot))[0];
  return hit ? `INTO A LINE (836): ${side === "up" ? "long" : "short"} into ${hit.name} (${hit.price.toFixed(2)}), $${Math.abs(hit.price - target).toFixed(2)} from the target ${target.toFixed(2)} (within $50)` : "";
}
export const FLOOR836 = 0.66; // her 1.5x floor: ask <= 0.667 -> 66c at most
function curMinOpen(io: IO835): number {
  const m0 = Math.floor(io.now / 60000) * 60;
  const b = io.bars.find((x) => x.t === m0);
  if (b) return b.o;
  const t = io.trail.find((x) => x.t >= m0 * 1000);
  return t ? t.c : 0;
}
/** LOVE'S LATE DOOR (fix836): with ~3 minutes left (3:15-2:45) in the 5m window, price pushing off a line - the 5m Bollinger (20/2), a session band (VWAP / σ) or
 *  a red/green zone (5m R1 / S1) - in the push direction, with the live 1m candle her colour. "Pushing off" = this window came within $10 of the line and price is
 *  now $15-$60 past it on the push side (the distances of her PRE295 late door). The nearest such line wins. */
export function loveLate836(io: IO835, lines: Lines835, end5: number): { side: "up" | "down"; label: string } | null {
  const left = (end5 - io.now) / 1000, spot = io.spot;
  if (!(left >= 165 && left <= 195) || !(spot > 0)) return null;
  const w0 = end5 / 1000 - 300;
  const inW = io.bars.filter((x) => x.t >= w0), tr = io.trail.filter((x) => x.t >= w0 * 1000).map((x) => x.c);
  const lo = Math.min(spot, ...inW.map((x) => x.l), ...tr), hi = Math.max(spot, ...inW.map((x) => x.h), ...tr);
  const o1 = curMinOpen(io); if (!(o1 > 0)) return null;
  const C = [...lines.L.filter((l) => SESS836.test(l.name) || l.name === "5m R1" || l.name === "5m S1").map((l) => ({ name: l.name === "5m R1" ? "Red zone" : l.name === "5m S1" ? "Green zone" : l.name, price: l.price })),
    ...(lines.bb ? [{ name: "Bollinger upper", price: lines.bb.bbU }, { name: "Bollinger lower", price: lines.bb.bbL }] : [])];
  let best: { side: "up" | "down"; label: string; d: number } | null = null;
  for (const l of C) {
    const p = l.price; if (!(p > 0)) continue;
    if (spot > o1 && lo <= p + 10 && spot - p >= 15 && spot - p <= 60 && (!best || spot - p < best.d)) best = { side: "up", label: `Love's late door - pushing up off ${l.name}`, d: spot - p };
    if (spot < o1 && hi >= p - 10 && p - spot >= 15 && p - spot <= 60 && (!best || p - spot < best.d)) best = { side: "down", label: `Love's late door - pushing down off ${l.name}`, d: p - spot };
  }
  return best ? { side: best.side, label: best.label } : null;
}

// ---------------------------------------------------------------- STORE, GUARDS, FILL, EXITS (new code) ----------------------------------------------------------------
type Store = { v: 1; book: string; title: string; sealed: boolean; why: string; reg: Record<string, any>; calls: Record<string, any>; rows: any[]; guard: any; q: Record<string, any>; at?: string };
const MEM: Record<string, Store> = {};
function load(B: Book835, root: string): Store {
  const p = join(root, "data", B.file);
  if (!MEM[p]) { let s: any = null; try { s = existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null; } catch { s = null; } MEM[p] = s && s.v === 1 ? s : { v: 1, book: B.book, title: B.title, sealed: true, why: "", reg: {}, calls: {}, rows: [], guard: {}, q: {} }; }
  return MEM[p];
}
function save(B: Book835, root: string, st: Store) {
  const p = join(root, "data", B.file);
  const ks = Object.keys(st.reg); if (ks.length > 400) for (const k of ks.slice(0, ks.length - 400)) delete st.reg[k];
  const qk = Object.keys(st.q).sort(); if (qk.length > 60) for (const k of qk.slice(0, qk.length - 60)) delete st.q[k];
  if (st.rows.length > 4000) st.rows = st.rows.slice(0, 4000);
  st.at = new Date().toISOString();
  writeFileSync(p + ".tmp", JSON.stringify(st)); renameSync(p + ".tmp", p);
}
const ptDay = (ms: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date(ms));
/** her 5m guards (PRE295 fix207/208): -$45 net for the PT day = done until midnight PT; 4 losses in a row = 1 hour off. Counted on this book's own paper P&L. */
function guardWhy(st: Store, now: number): string {
  const g = st.guard; const day = ptDay(now);
  if (g.day === day && (Number(g.net) || 0) <= -45) return `5M DAY STOP: the 5m book is ${g.net} today - done until midnight PT`;
  if (now < (Number(g.pauseUntil) || 0)) return `5M COOL-OFF: 4 losses in a row - back at ${new Date(Number(g.pauseUntil)).toISOString().slice(11, 16)}Z`;
  return "";
}
function guardBook(st: Store, now: number, pnl: number) {
  const g = st.guard; const day = ptDay(now);
  if (g.day !== day) { g.day = day; g.net = 0; g.streak = 0; }
  g.net = r2((Number(g.net) || 0) + pnl);
  g.streak = pnl < 0 ? (Number(g.streak) || 0) + 1 : 0;
  if (g.streak >= 4) { g.pauseUntil = now + 3600000; g.streak = 0; }
}
function sideAsk(q: Quote835, side: string) { return side === "up" ? r2(q.ask) : r2(1 - q.bid); }
function sideBid(q: Quote835, side: string) { return side === "up" ? r2(q.bid) : r2(1 - q.ask); }
/** a paper buy at the recorded ask: her takeSide's window (ask between minAsk and maxAsk), sized off the ask like fix273 ($5 / ask, floored to 0.01). */
function paperBuy(B: Book835, st: Store, io: IO835, x: { id: string; side: "up" | "down"; closes5: string; maxAsk: number; minAsk: number; setup: string; door: string; late: boolean }): { row?: any; why?: string } {
  const q = io.quote(x.closes5);
  if (!q || !(io.now / 1000 - q.t <= 12)) return { why: `no fresh Polymarket 5m quote for the window closing ${x.closes5} (data/poly5-quotes.jsonl)` };
  const ask = sideAsk(q, x.side);
  if (!(ask > 0 && ask < 1) || ask < x.minAsk || ask > x.maxAsk) return { why: `Polymarket ${x.side} at ${ask} is outside ${x.minAsk}-${x.maxAsk}` };
  const contracts = Math.floor((STAKE / ask) * 100) / 100, spent = r2(contracts * ask);
  const row = { id: `${x.id}:${B.book}`, book: B.book, at: new Date(io.now).toISOString(), asset: "btc", ticker: q.slug, slug: q.slug, closesAt: x.closes5, side: x.side, setup: x.setup, label: x.setup, door: x.door, late: x.late,
    ask, multiple: r2(1 / ask), contracts, left: contracts, stake: spent, target: q.target ?? null, result: "open", pnlTp: null, pnlHold: null, pnl: null, banked: 0, half: false, exit: null, paper: true };
  st.rows.unshift(row);
  return { row };
}
/** her exits (PRE295 hedgeBank): half sells the first time the bid reaches cost + 75% of (1 - cost), the rest at cost + 90%; otherwise it rides to the bell. */
function manage(B: Book835, st: Store, io: IO835): boolean {
  let ch = false;
  for (const r of st.rows) {
    if (r.pnlHold != null) continue;
    const end = Date.parse(String(r.closesAt));
    const q = io.quote(String(r.closesAt));
    if (q && (!st.q[r.closesAt] || q.t > st.q[r.closesAt].t)) { st.q[r.closesAt] = { t: q.t, bid: q.bid, ask: q.ask, target: q.target }; ch = true; }
    if (r.result === "open" && io.now < end - 4000 && q && io.now / 1000 - q.t <= 12 && r.left > 0) {
      const bid = sideBid(q, r.side), cost = Number(r.ask);
      const l75 = Math.floor((cost + 0.75 * (1 - cost)) * 100 + 1e-6) / 100, l90 = Math.floor((cost + 0.9 * (1 - cost)) * 100 + 1e-6) / 100;
      if (!r.half && bid + 1e-9 >= l75 && r.contracts >= 0.02) { const n2 = Math.floor((r.contracts / 2) * 100) / 100; r.half = true; r.halfPx = bid; r.banked = r2(r.banked + n2 * (bid - cost)); r.left = r2(r.left - n2); ch = true; }
      if (r.left > 0 && bid + 1e-9 >= l90) {
        r.banked = r2(r.banked + r.left * (bid - cost)); r.soldPx = bid; r.left = 0;
        r.pnlTp = r.banked; r.pnl = r.pnlTp; r.result = r.pnlTp > 0.005 ? "win" : "loss";
        r.exit = `${r.half ? `half at 75% (${Math.round(r.halfPx * 100)}c), ` : ""}rest at 90% (${Math.round(bid * 100)}c)`;
        guardBook(st, io.now, r.pnlTp); ch = true;
      }
    }
    if (!(io.now >= end + 20000)) continue;
    // the bell: Polymarket's own last recorded quote when it's decided (90c+ / 10c-), else her chart's 5m candle against the price to beat
    let up: boolean | null = null, how = "";
    const lq = st.q[r.closesAt];
    if (lq && lq.t >= end / 1000 - 20 && (lq.bid >= 0.9 || lq.ask <= 0.1)) { up = lq.bid >= 0.9; how = "polymarket's last quote"; }
    else if (io.now >= end + 60000) {
      const e = end / 1000, o = io.bars.find((x) => x.t === e - 300), c = io.bars.find((x) => x.t === e - 60), tg = Number(r.target) > 0 ? Number(r.target) : o ? o.o : 0;
      if (c && tg > 0) { up = c.c >= tg; how = "chart 5m candle vs the price to beat"; }
      else if (io.now >= end + 600000) { up = r.side === "down"; how = "no data 10 min after the bell - counted lost"; }
    }
    if (up === null) continue;
    const won = (r.side === "up") === up;
    r.pnlHold = r2(won ? r.contracts - r.stake : -r.stake); r.bell = won ? "won" : "lost"; r.settledBy = how;
    if (r.result === "open") {
      r.pnlTp = r2(r.banked + r.left * ((won ? 1 : 0) - Number(r.ask))); r.pnl = r.pnlTp; r.result = r.pnlTp > 0.005 ? "win" : "loss";
      r.exit = `${r.half ? `half at 75% (${Math.round(r.halfPx * 100)}c), rest ` : ""}held to the bell - ${won ? "won" : "lost"} (${how})`;
      guardBook(st, io.now, r.pnlTp);
    }
    ch = true;
  }
  return ch;
}

// ---------------------------------------------------------------- THE BOOK ----------------------------------------------------------------
async function runBook(B: Book835, io: IO835, read: Look, lines: Lines835, root: string): Promise<void> {
  const st = load(B, root);
  const seal = seal835(root);
  if (!seal.ok) { if (st.sealed !== false || st.why !== seal.why) { st.sealed = false; st.why = `SEAL BROKEN - book stopped: ${seal.why}`; save(B, root, st); } return; }
  st.sealed = true; st.why = "";
  const now = io.now;
  const reg = st.reg;
  let changed = manage(B, st, io);
  const log = (o: any) => { if (io.noLog) return; try { appendFileSync(join(root, "data", B.file.replace(/\.json$/, "-log.jsonl")), JSON.stringify({ at: new Date(now).toISOString(), ...o }) + "\n"); } catch {} };
  // HER CALL, ONE PER 5M SLOT (recon.ts book() + fix186 swings + fix224 own window): the first read in each 5m slot is the call; while it hasn't filled, a read the
  // other way re-aims it (a new call id, so her walls judge the new side when it arrives - fix204).
  const slot = Math.floor(now / 300000);
  // recon.ts book(): her FIRST call of a 15m window (and any re-aim of a call) is only booked while the Kalshi 15M ask on that side pays 1.38x+ - read from the
  // desk's snapshot (a.market) when it is there; the paper replay has no Kalshi quotes, so there the gate is skipped. Later 5m slots are her swings (fix186): no gate.
  const w15 = Math.floor(now / 900000);
  const kOk = (side: string) => { const m = io.a?.market; if (!m || !m.ticker) return true; const k = Number(side === "up" ? m.yesAsk : m.noAsk); return k > 0.02 && k < 0.98 && 1 / k >= 1.38; };
  const first15 = !Object.keys(st.calls).some((k) => Math.floor((Number(k) * 300000) / 900000) === w15);
  if (read) {
    const c = st.calls[slot];
    if (!c && first15 && !kOk(read.side)) { /* under her 1.38x floor on Kalshi: no call (skipLog in recon.ts) */ }
    else if (!c) { st.calls[slot] = { n: 1, id: `BTC5M-${slot}:recon-rej5:c1:s${slot}`, side: read.side, label: read.label, at: new Date(now).toISOString() }; changed = true; }
    else if (c.side !== read.side && reg[`${c.id}:5m`]?.status !== "filled" && kOk(read.side)) { c.n += 1; c.prev = `${c.side} - ${c.label} (never filled, re-aimed)`; c.id = `BTC5M-${slot}:recon-rej5:c${c.n}:s${slot}`; c.side = read.side; c.label = read.label; c.at = new Date(now).toISOString(); changed = true; }
  }
  for (const k of Object.keys(st.calls)) if (Number(k) < slot - 3) { delete st.calls[k]; changed = true; }
  const rows = [st.calls[slot - 1], st.calls[slot]].filter(Boolean).map((c: any) => ({ id: c.id, book: "recon-rej", asset: "btc", side: c.side, ticker: `BTC5M-${slot}`, setup: c.label, at: c.at, result: "open" }));
  const filledIn = (closes: string) => st.rows.some((x) => x.closesAt === closes);
// ===== FROZEN 1-2-3 - data/vault-123-pre295/engine.ts lines 3140-3140 =====
    const FLIP5_BOOKS: string[] = ["recon-rej", "recon-tog"]; // Love card 2:04 AM "Main and rejection"
// ===== END FROZEN =====
  for (const r of rows) {
// ===== FROZEN 1-2-3 - data/vault-123-pre295/engine.ts lines 3248-3314 =====
        const id5 = `${r.id}:5m`, d5 = reg[id5];
        if (d5 && (d5.status === "filled" || d5.final)) continue;
        if (d5 && now - Number(d5.lastTry || 0) < 4000) continue;
        const base5 = { book: r.book === "recon-tog" ? "recon-tog-5m" : "recon-rej-5m", asset: r.asset, side: r.side, ticker: r.ticker, setup: r.setup, lastTry: now, tries: (Number(d5?.tries) || 0) + 1 };
        let end5 = Math.ceil(now / 300000) * 300000; if (end5 - now < 60000) end5 += 300000;
        const closes5 = new Date(end5).toISOString();
        // ITS OWN WINDOW ONLY (fix224, Oct 25 ~6:05 PM PT, Love: "it says the 5M book is in a short right now ?? why?" - at 6:00:02 PM the 5:55 slot's short call bought the
        // 6:00 window off the 5:58-6:00 2m candle, while the fresh 6:00 read was a long): every call (fresh 5m swing or 15m) trades only inside its own 5m slot
        // (Love 6:05 PM: "only let a call only trade inside its own 5 minute slot") - once that slot is over the call is spent, never carried into the next window.
        { const sm5 = /:s(\d+)$/.exec(String(r.id)); const capE5 = sm5 ? (Number(sm5[1]) + 1) * 300000 : (Math.floor(Date.parse(String(r.at)) / 300000) + 1) * 300000;
          if (Number.isFinite(capE5) && end5 > capE5) { if (d5?.status !== "expired") log({ id: id5, status: "expired", reason: "its own window is over - a call never trades the next window" }); reg[id5] = { ...base5, status: "expired", final: true, reason: "its own window is over - a call never trades the next window" }; changed = true; continue; } }
        let late5 = false; // fix195
        // TOP UP A PARTIAL FILL (fix202, Oct 25 ~4:45 AM PT, Love: "yes pls" to "keep knocking for the rest of her size" - the 4:35 short filled 1.1 contracts ($0.58) of $5
        // as the book moved): a partly filled 5m trade keeps knocking for the rest of her size in the same window (same entry: no new flip, walls already passed it) until 2:30 is left.
        const part5 = false && d5?.status === "partial"; // fix205: no top-ups
        if (part5 && (d5.closesAt !== closes5 || (end5 - now) / 1000 < 150)) { reg[id5] = { ...d5, status: "filled", final: true }; log({ id: id5, status: "filled", note: "top-up window closed", spent: d5.spent }); changed = true; continue; }
        // WALLS JUDGE THE CALL (fix204, Oct 25 ~5:07 AM PT, Love card "Judge walls at the call" - since 2 AM Kalshi filled 9 of her calls and the 5m only 1: by the time
        // her flip came, price had moved and the walls re-judged her thirds at the new price): the first time the 5m lane sees a call, her walls judge it right then
        // (5m cushions). If it passes, the flip only confirms it - no second wall check at the flip. If it fails, the walls keep judging it at the flip as before.
        if (d5?.wallOk === undefined && !part5) { let w0: any = null; (globalThis as any).__pinkCap5 = 25; const bbH0 = (globalThis as any).__bbsr; if ((globalThis as any).__bbsrChart) (globalThis as any).__bbsr = (globalThis as any).__bbsrChart; try { w0 = blm.bandLockCheck(String(r.book), r.asset, r.side, String(r.ticker)); } finally { (globalThis as any).__pinkCap5 = 0; (globalThis as any).__bbsr = bbH0; } (base5 as any).wallOk = !!w0?.ok; } else (base5 as any).wallOk = !!d5?.wallOk;
        if (FLIP5_BOOKS.includes(String(r.book)) && !part5) { // fix188 + fix189: a finished 1m candle since her call closed her way, just now, with ~4 minutes left
          const callS = Date.parse(String(r.at)) / 1000, nowS = now / 1000;
          const fin = (((globalThis as any).__pivBars?.btc?.bars ?? []) as any[]).filter((x: any) => Number(x.t) + 60 <= nowS + 1 && Number(x.t) + 60 > callS).sort((x: any, y: any) => Number(x.t) - Number(y.t));
          const herWay = (x: any) => (r.side === "up" ? Number(x.c) > Number(x.o) : Number(x.c) < Number(x.o));
          const left5 = (end5 - now) / 1000;
          // KNOCK UNTIL 3:30 (fix191, Oct 25 ~2:17 AM PT - the 2:15 main long's flip landed at 2:16:00 with 4 minutes left, one try at 41c missed as the book moved, and
          // the 4-minute cutoff closed the door 13 s later): the flip must land with 4+ minutes left in this 5m window (the bar closing at its open or after its first
          // minute); once it has, she keeps knocking until 3:30 is left.
          let flipOk = fin.some((x: any) => { const lf = end5 / 1000 - (Number(x.t) + 60); return herWay(x) && lf >= 240 && lf <= 301; }); // fix205: 4+ minutes again // fix199 (Love 3:49 AM "if she missed that short bc there wasn't 4 minute left i want to make it 3 minutes pls"): flip with 3+ minutes left, knock until 2:30
          // THE 5M FLIP IS A DOOR TOO (fix200, Oct 25 ~3:57 AM PT, Love: "i want her to enter on a 5M candle flip as well - not the 1M alone pls" + card "Either flip is a
          // door"): a finished 5m candle that closed her way after her call opens the door for the window right after it, same 2:30 knock limit.
          if (false /* fix211 (Oct 25 ~2:11 PM PT, Love card "Drop the 5m door" - replay: 5m candle door alone 25/49 = 51%) */ && !flipOk) { try { const all5 = ((globalThis as any).__pivBars?.btc?.bars ?? []) as any[], w05 = end5 / 1000 - 300;
            const o5 = all5.find((x: any) => Number(x.t) === w05 - 300), c5 = all5.find((x: any) => Number(x.t) === w05 - 60);
            if (o5 && c5 && w05 > callS && w05 <= nowS && (r.side === "up" ? Number(c5.c) > Number(o5.o) : Number(c5.c) < Number(o5.o))) flipOk = true; } catch {} }
          // 2M AND 3M FLIPS ARE DOORS TOO (fix210, Oct 25 ~2:03 PM PT, Love: "lets throw the 2M's and 3M's up on poly if they're hitting at 80%, and giving her
          // more valid set ups" - replay: 2m flip with 3+ min left 35 windows 83%, 3m 20 windows 80%, 1m-or-2m 70 windows vs 54): a 2m or 3m candle (from her 1m
          // bars, on the clock) that closed her way after her call, landing with 3+ minutes left in this 5m window, opens the door; she knocks until 2:30 is left.
          let flipKnock = 180;
          if (!flipOk) { try { const all1 = ((globalThis as any).__pivBars?.btc?.bars ?? []) as any[];
            for (const N of [2, 3]) { const te = Math.floor(nowS / (60 * N)) * (60 * N), s0 = te - 60 * N, lfN = end5 / 1000 - te;
              if (!(te > callS && lfN >= 180 && lfN <= 301)) continue;
              const bo = all1.find((x: any) => Number(x.t) === s0), bc = all1.find((x: any) => Number(x.t) === te - 60);
              if (bo && bc && (r.side === "up" ? Number(bc.c) > Number(bo.o) : Number(bc.c) < Number(bo.o))) { flipOk = true; flipKnock = 150; (base5 as any).door = `${N}m flip`; break; } } } catch {} }
          // THE LATE DOOR (fix195, Oct 25 ~3:25 AM PT, Love: "btc's 5M window had 2:30 left on it and price was clearly pushing up off of the pink band and already had
          // rejected and had a good distance away (green $25-50 away) ... open the door to those as well" + "yeup runnit bb" after the replay showed 1.5x and under wins,
          // 1.6-1.8x breaks even, 2x loses): with 2:00-3:00 left, if this window touched the pink (5m PP, within $10) and price is now $25-60 away from it on her side,
          // with the last finished 1m candle closed her way, she may buy - but never past 1.5x (limit 66c).
          const lateOnly5 = !!(r as any).lateOnly; // fix198: the other book may only use the late door
          if ((!(flipOk && left5 >= flipKnock) || lateOnly5) && left5 >= 150 && left5 <= 180) { try { // fix206 (Oct 25 ~1:15 PM PT, Love: "give her the second minute to fill ... and include the last minute book that tested near that 70%"): knock through the
            // window's second minute (to 3:00 left); the late door is back from 3:00 to 2:30 left, only at 60-70c (1.43x-1.67x - the replay's 3:00-left 1.5x bucket won 70%, 1.3-1.5x 79%)
            const bb5 = (((globalThis as any).__pivBars?.btc?.bars ?? []) as any[]).filter((x: any) => Number(x.t) >= end5 / 1000 - 300).sort((x: any, y: any) => Number(x.t) - Number(y.t));
            const pk5 = Number((((globalThis as any).__lawBands?.btc?.L ?? []) as any[]).find((l: any) => String(l.name) === "5m PP")?.price) || 0;
            const lf5 = fin.length ? fin[fin.length - 1] : null, px5 = bb5.length ? Number(bb5[bb5.length - 1].c) : 0;
            if (pk5 > 0 && px5 > 0 && lf5 && herWay(lf5) && Number(lf5.t) + 60 >= nowS - 65) {
              const lo5 = Math.min(...bb5.map((x: any) => Number(x.l))), hi5 = Math.max(...bb5.map((x: any) => Number(x.h)));
              late5 = r.side === "up" ? lo5 <= pk5 + 10 && px5 - pk5 >= 15 && px5 - pk5 <= 60 : hi5 >= pk5 - 10 && pk5 - px5 >= 15 && pk5 - px5 <= 60; // fix197 (Love 3:31 AM "we can make that $15-$60 + hun"): $15 floor (was $25)
            } } catch { late5 = false; } }
          if (late5 && Object.entries(reg).some(([k, v]: [string, any]) => k.endsWith(":5m") && k !== id5 && v?.status === "filled" && v?.closesAt === closes5)) late5 = false; // fix198: one late buy per window across both books
          if ((!(flipOk && left5 >= flipKnock) || lateOnly5) && !late5) {
            if (lateOnly5) { reg[id5] = { ...base5, status: "waiting", reason: "late door only (the other book holds the 5m)" }; changed = true; continue; }
            const wf = !fin.some(herWay) ? `waiting for a 1m candle to close ${r.side === "up" ? "green" : "red"} (her 5m flip)` : `waiting for her flip with 4+ minutes left in the 5m window`;
            if (d5?.reason !== wf) log({ id: id5, status: "waiting", reason: wf });
            reg[id5] = { ...base5, status: "waiting", reason: wf }; changed = true; continue;
          }
        }
        let bl5: any; (globalThis as any).__pinkCap5 = 25; const bbH5 = (globalThis as any).__bbsr; if ((globalThis as any).__bbsrChart) (globalThis as any).__bbsr = (globalThis as any).__bbsrChart; try { bl5 = part5 || (base5 as any).wallOk ? { ok: true } : blm.bandLockCheck(String(r.book), r.asset, r.side, String(r.ticker)); } finally { (globalThis as any).__pinkCap5 = 0; (globalThis as any).__bbsr = bbH5; } // fix199: $25 pink cushion on the 5m board // fix266 (Love Oct 26 9:09 AM PT: "please go back over our last messages yesterday and rebuild a twin EXACTLY. from that configuration, nothing different whatsoever"): the 5m board's walls read the chart's Bollinger as on Sunday, not her own (fix259 stays for Kalshi)
        if (!bl5.ok) { if (d5?.reason !== bl5.reason) log({ id: id5, status: "blocked", reason: bl5.reason }); reg[id5] = { ...base5, status: "blocked", reason: bl5.reason }; changed = true; continue; }
// ===== END FROZEN =====
    // ---- plumbing from here (PRE295 went on to Polymarket; this book stays on paper) ----
    if (filledIn(closes5)) { reg[id5] = { ...base5, status: "skipped", final: true, reason: "this book already holds a trade in this 5m window" }; changed = true; continue; }
    if (B.nu) { // fix836: her 1.5x floor is below; the Bollinger cushion and no trading into a line within $50 of the target judge every entry
      const tg = Number(io.quote(closes5)?.target) || Number(io.bars.find((x) => x.t === end5 / 1000 - 300)?.o) || 0;
      const why6 = bbCushion836(r.side, io.spot, lines.bb, lines.L) || intoLine836(r.side, io.spot, tg, lines.L, lines.bb);
      if (why6) { if (d5?.reason !== why6) log({ id: id5, status: "blocked", reason: why6 }); reg[id5] = { ...base5, status: "blocked", reason: why6 }; changed = true; continue; }
    }
    { const why7 = guardWhy(st, now); if (why7) { if (d5?.reason !== why7) log({ id: id5, status: "blocked", reason: why7 }); reg[id5] = { ...base5, status: "blocked", reason: why7 }; changed = true; continue; } }
// ===== FROZEN 1-2-3 - data/vault-123-pre295/engine.ts lines 3326-3326 =====
        const max5 = Math.floor(100 / (blm.floorFor(r.asset, r.side, String(r.book)) || 1.38)) / 100;
// ===== END FROZEN =====
    const late = late5 || !!d5?.late;
    let maxAsk = Math.round((late ? Math.min(0.70, max5) : max5 - 0.04) * 100) / 100; const minAsk = late ? 0.60 : 0.30; // fix193 ask+4c never past her floor; fix205 30c; fix206 late 60-70c
    if (B.nu) maxAsk = Math.min(maxAsk, FLOOR836);
    const door = late ? "late door (pink touch)" : String((base5 as any).door || "1m flip");
    const f = paperBuy(B, st, io, { id: id5, side: r.side, closes5, maxAsk, minAsk, setup: r.setup, door, late });
    if (f.row) { reg[id5] = { ...base5, status: "filled", final: true, late, slug: f.row.slug, contracts: f.row.contracts, cost: f.row.ask, spent: f.row.stake, closesAt: closes5 }; log({ id: id5, ...reg[id5] }); }
    else { if (d5?.reason !== f.why) log({ id: id5, status: "no fill", reason: f.why }); reg[id5] = { ...base5, status: "no fill", reason: f.why }; }
    changed = true; continue;
  }
  // LOVE'S LATE DOOR (fix836 only), once per window, when the book holds nothing in it yet; her walls (frozen, 5m board) still judge it.
  if (B.nu) {
    let end5 = Math.ceil(now / 300000) * 300000; if (end5 - now < 60000) end5 += 300000;
    const closes5 = new Date(end5).toISOString(), id6 = `BTC5M-${end5 / 300000 - 1}:love-late:s${end5 / 300000 - 1}:5m`;
    const d6 = reg[id6];
    if (!filledIn(closes5) && !(d6 && (d6.final || now - Number(d6.lastTry || 0) < 4000))) {
      const lk = loveLate836(io, lines, end5);
      if (lk) {
        const base6 = { book: "love-late-836", asset: "btc", side: lk.side, setup: lk.label, lastTry: now, tries: (Number(d6?.tries) || 0) + 1, door: "Love's late door" };
        let why = "";
        { let w: any; SANDBOX.__pinkCap5 = 25; try { w = blm.bandLockCheck("recon-rej", "btc", lk.side, `BTC5M-${end5 / 300000 - 1}`); } finally { SANDBOX.__pinkCap5 = 0; } if (!w?.ok) why = String(w?.reason || "her walls refused"); }
        if (!why) why = bbCushion836(lk.side, io.spot, lines.bb, lines.L) || intoLine836(lk.side, io.spot, Number(io.quote(closes5)?.target) || Number(io.bars.find((x) => x.t === end5 / 1000 - 300)?.o) || 0, lines.L, lines.bb) || guardWhy(st, now);
        if (why) { if (d6?.reason !== why) log({ id: id6, status: "blocked", side: lk.side, reason: why }); reg[id6] = { ...base6, status: "blocked", reason: why }; }
        else {
          const f = paperBuy(B, st, io, { id: id6, side: lk.side, closes5, maxAsk: FLOOR836, minAsk: 0.30, setup: lk.label, door: "Love's late door", late: true });
          if (f.row) { reg[id6] = { ...base6, status: "filled", final: true, slug: f.row.slug, cost: f.row.ask, closesAt: closes5 }; log({ id: id6, ...reg[id6] }); }
          else { if (d6?.reason !== f.why) log({ id: id6, status: "no fill", reason: f.why }); reg[id6] = { ...base6, status: "no fill", reason: f.why }; }
        }
        changed = true;
      }
    }
  }
  if (changed) save(B, root, st);
}

/** one pass of both books on one snapshot (live: oneTwoThreeTick835; replay/tests call it with their own IO). */
export async function tickBooks835(io: IO835, books: Book835[] = [BOOK835, BOOK836]): Promise<void> {
  const root = io.root || process.cwd();
  if (!seal835(root).ok) { for (const B of books) await runBook(B, io, null, { L: [], bb: null }, root); return; }
  const lines = prep835(io);
  // recon.ts reconTick's own conditions: 2+ minutes left in the 15m window (left >= 120), a real tick (3 s) and a healthy feed
  const left15 = 900 - ((io.now / 1000) % 900);
  const nowS = io.now / 1000;
  const last1m = io.bars.filter((x) => x.t + 60 <= nowS + 1).pop();
  const read = io.read !== undefined ? io.read /* proof tests only */ : left15 >= 120 && io.spot > 0 && io.now - io.spotAt <= 3000 && io.feed.ok ? herRead835(io.bars, last1m, io.spot, io.a) : null;
  for (const B of books) await runBook(B, io, read, lines, root);
}

// ---------------------------------------------------------------- LIVE PLUMBING (read-only) ----------------------------------------------------------------
const QF = { pos: 0, map: {} as Record<string, Quote835> };
/** the desk's own recorded Polymarket BTC 5m best bid/ask (engine fix203 recorder -> data/poly5-quotes.jsonl), read from the tail, newest per window. */
function quotesFromFile835(root: string): (closes: string) => Quote835 | null {
  try {
    const p = join(root, "data", "poly5-quotes.jsonl"); const fd = openSync(p, "r");
    try {
      const size = fstatSync(fd).size; if (QF.pos > size || size - QF.pos > 262144) QF.pos = Math.max(0, size - 16384);
      const n = size - QF.pos; const buf = Buffer.alloc(n); if (n > 0) readSync(fd, buf, 0, n, QF.pos);
      const txt = buf.toString("utf8"); const cut = txt.lastIndexOf("\n");
      if (cut >= 0) { for (const ln of txt.slice(0, cut).split("\n")) { try { const j = JSON.parse(ln); if (j && j.closes && j.slug && Number(j.t) > 0) { const o = QF.map[j.closes]; if (!o || Number(j.t) >= o.t) QF.map[j.closes] = { t: Number(j.t), slug: String(j.slug), closes: String(j.closes), target: j.target == null ? null : Number(j.target), bid: Number(j.bid), ask: Number(j.ask) }; } } catch {} } QF.pos += Buffer.byteLength(txt.slice(0, cut + 1)); }
    } finally { closeSync(fd); }
    const ks = Object.keys(QF.map).sort(); if (ks.length > 40) for (const k of ks.slice(0, ks.length - 40)) delete QF.map[k];
  } catch {}
  return (closes: string) => QF.map[closes] || null;
}
const RUN = { busy: false };
/** engine.ts tick (like og1012Tick): both 1-2-3 paper books on the desk's latest snapshot. Never sends an order. */
export async function oneTwoThreeTick835(assets: Record<string, any> | null | undefined): Promise<void> {
  if (RUN.busy || !assets?.btc) return;
  RUN.busy = true;
  try {
    const LG = liveGlobals(), now = Date.now(), root = process.cwd();
    const src = LG.__pivBars?.btc?.bars;
    if (!Array.isArray(src) || src.length < 60) return;
    const bars: Bar[] = src.map((x: any) => ({ t: Number(x.t), o: Number(x.o), h: Number(x.h), l: Number(x.l), c: Number(x.c) })).sort((x: Bar, y: Bar) => x.t - y.t).slice(-900);
    const qm: any = await import("./quotes");
    const q = qm.quoteTick("btc"), fh = qm.feedHealth("btc");
    const tk = Object.keys(LG).filter((k) => /^__qtrail_\d+$/.test(k)).sort((x, y) => Number(y.slice(9)) - Number(x.slice(9)))[0];
    const trail = ((tk && LG[tk]?.btc) || []).filter((x: any) => x && Number(x.c) > 0 && Number(x.t) >= now - 600000).map((x: any) => ({ t: Number(x.t), c: Number(x.c) }));
    await tickBooks835({ now, bars, spot: Number(q?.c) || 0, spotAt: Number(q?.at) || 0, feed: { ok: !!fh?.ok, why: String(fh?.why || "") }, a: assets.btc, trail, quote: quotesFromFile835(root), root });
  } catch {} finally { RUN.busy = false; }
}
export function oneTwoThreeSummary835(B: Book835 = BOOK835) {
  const root = process.cwd(), st = load(B, root), seal = seal835(root);
  const done = st.rows.filter((r) => r.result !== "open" && r.pnlTp != null), w = done.filter((r) => Number(r.pnlTp) > 0.005).length;
  return { title: B.title, sealed: seal.ok, why: seal.why || st.why, n: st.rows.length, open: st.rows.filter((r) => r.result === "open").length, w, l: done.length - w, pnl: r2(done.reduce((s, r) => s + Number(r.pnlTp), 0)), recent: st.rows.slice(0, 25) };
}
