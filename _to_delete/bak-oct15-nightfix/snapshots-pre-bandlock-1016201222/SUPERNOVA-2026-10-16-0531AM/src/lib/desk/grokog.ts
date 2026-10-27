// GROK OG (Claude, Oct 11 ~2:20 AM PT, Love: "the original model i came to you with with grok... is there any way we can try
// to run THAT on paper? she used to enter at the very beginning of windows if price was under a band and her hit rate was
// crazy... i want to see if we can reanimate her"). PAPER ONLY, never sends an order.
// Entries = Grok's own setup builder, byte-identical to ~/Downloads/desk-project 2 (setup.ts buildSetup + lateWindow,
// auto.ts winningSetup), run on the Oct 1 feed GOLDEN rebuilt (OANDA BTC 5m with the session from 5 PM PT, gold on 15m).
// Unlike GOLDEN there is NO DNA / channel / band-in-front filter on top: whatever Grok's builder takes, she takes, one
// ticket per window per asset. Exits = Grok's paper route exactly (paper.ts trailExit -> gateSell/catchPct at 45): arms
// once the gain has been 50%+, locks the highest 5% step under the best gain, sells when it slips back to that step;
// (Oct 11 ~5 AM PT, Love: every lane now uses OUR exits instead: half at 75% of the max, rest trails from 90%.)
// otherwise held to the bell. Kalshi fee in and out. $20 a ticket. data/grok-og.json.
import { archiveRows } from "./archcache";
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";
import { bandOnPath, centerWrong } from "./auto";

const STAKE = 20;
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const fee = (n: number, p: number) => Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;
type Row = { id: string; lane?: string; at: string; asset: string; ticker: string; side: "up" | "down"; label: string; ask: number; multiple: number; secondsLeft: number; intoWindow: number; stake: number; fee: number; peak: number; lastBid: number; result: "open" | "sold" | "win" | "loss"; exit: string | null; pnl: number | null };
const read = (): Row[] => { try { return existsSync(D("grok-og.json")) ? JSON.parse(readFileSync(D("grok-og.json"), "utf8")) : []; } catch { return []; } };
// (Oct 13 ~7:45 PM PT, Love: "i can't see anything from before today at 5am"): this writer shares grok-og.json with the pivot
// books and was still cutting it to 5000 rows with no archive, which undid the 8000 + archive rule. Same rule here now:
// keep the newest 8000, and every row past that goes to grok-og-archive.jsonl first.
const write = (rows: Row[]) => {
  if (rows.length > 8000) { try { appendFileSync(D("grok-og-archive.jsonl"), rows.slice(8000).map((r) => JSON.stringify(r)).join("\n") + "\n"); } catch {} }
  writeFileSync(D("grok-og.json.tmp"), JSON.stringify(rows.slice(0, 8000))); renameSync(D("grok-og.json.tmp"), D("grok-og.json"));
};

// Grok's paper.ts catchPct, verbatim.
function catchPct(seenPct: number, live: number, trigger = 28, pinPct = 0): number | null {
  if (!(live > 0) || !(seenPct > 0)) return null;
  const arm = trigger > 0 ? trigger : 28;
  const front = Math.ceil((arm + 0.01) / 5) * 5;
  if (!(seenPct + 1e-9 >= front)) return null;
  if (!(live + 0.5 < seenPct)) return null;
  const marks: number[] = [];
  for (let step = Math.ceil(arm / 5) * 5; step <= 200; step += 5) marks.push(step);
  if (pinPct >= 5 && pinPct < 150) marks.push(pinPct);
  let lock = arm;
  for (const mark of marks) if (mark <= seenPct - 0.01) lock = Math.max(lock, mark);
  if (live > lock + 0.5) return null;
  const lines = marks.filter((mark) => mark <= lock + 1e-9 && mark + 1e-9 >= arm).sort((a, b) => b - a);
  if (!lines.includes(arm)) lines.push(arm);
  for (const line of lines) if (live + 1e-9 >= line) return Math.round(line * 10) / 10;
  return null;
}

export function grokConsider(s: { ticker: string; side: "up" | "down"; ask: number; multiple: number; pattern: { label: string } }, asset: string, secondsLeft: number) {
  if (!s?.ticker || !(s.ask > 0.02 && s.ask < 0.98)) return;
  const rows = read();
  if (rows.some((r) => r.ticker === s.ticker && (r.lane || "grok") === "grok")) return;
  const n = STAKE / s.ask;
  rows.unshift({ id: `${s.ticker}:grokog`, lane: "grok", at: new Date().toISOString(), asset, ticker: s.ticker, side: s.side, label: s.pattern?.label || "", ask: r2(s.ask), multiple: r2(1 / s.ask), secondsLeft: Math.round(secondsLeft), intoWindow: Math.round(900 - secondsLeft), stake: STAKE, fee: fee(n, s.ask), peak: s.ask, lastBid: 0, result: "open", exit: null, pnl: null });
  write(rows);
}

const g = globalThis as unknown as { __grokSettleAt?: number };
// OG BANK twins (Love, Oct 11 ~5:05 AM PT: "let's run one more with a bank. almost all of her trades go in profit, the losses
// are mainly reversals after they've been in profit for a sec. arm after 35% - catch at 25%, raise the floor every 5%").
// Every OG-family entry (OG Oct 1 feed, OG your bands, OG + PIVOT 2/5/10/15) gets a twin at the same price with a BANK exit:
// once the gain has reached +35% the floor sits at +25%, and every further 5% of best gain lifts the floor 5% (best +40 ->
// floor +30, +45 -> +35...). Gain back at the floor = the whole ticket sells. Otherwise the bell.
const BANKED = /^(og-golden|og-hers|ogp2|ogp5|ogp10|ogp15)$/;
export async function grokExitTick(assets: Record<string, any> | null | undefined) {
  const rows = read();
  let changed = false;
  for (const r of [...rows]) {
    const lane = (r as any).lane || "grok";
    if (!BANKED.test(lane)) continue;
    const id = `${r.id}:bank`;
    if (rows.some((x) => x.id === id)) continue;
    if (Date.now() - Date.parse(r.at) > 20 * 60000) continue;
    rows.unshift({ ...r, id, lane: `${lane}-bank`, peak: r.ask, lastBid: 0, result: "open", exit: null, pnl: null } as Row);
    changed = true;
  }
  for (const r of rows) {
    if (r.result !== "open" || (/nowall|paper-/.test(r.lane || "") && ((r as any).parent || (r.lane || "") !== "paper-20"))) continue; // PAPER · 20% ROAD's own extras (no parent) run our exits
    const m = assets?.[r.asset]?.market;
    if (m?.ticker !== r.ticker) continue;
    const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
    if (!(bid > 0)) continue;
    r.lastBid = bid;
    if (bid > r.peak) r.peak = bid;
    if (/-bank$/.test(r.lane || "")) {
      const nB = r.stake / r.ask;
      const pctB = (bid / r.ask - 1) * 100;
      const xb = r as any;
      xb.best = Math.max(Number(xb.best) || -100, pctB);
      if (xb.best >= 35) {
        const floor = 25 + 5 * Math.floor((xb.best - 35) / 5);
        if (pctB <= floor) {
          r.result = "sold";
          r.exit = `bank: best +${Math.round(xb.best)}%, floor +${floor}%, sold at ${Math.round(bid * 100)}c (+${Math.round(pctB)}%)`;
          r.pnl = r2(nB * bid - fee(nB, bid) - r.stake - r.fee);
          changed = true;
        }
      }
      continue;
    }
    // OUR EXITS (Love, Oct 11 ~5 AM PT: "make sure shes using our exits? half at 75 - full at 90 with the trail"), same as the
    // books: half sells the first time the bid reaches 75% of what the trade can pay; the rest arms at 90% of the max and
    // rides with a 1-point trail under its best gain (or sells at 97c); otherwise the rest goes to the bell. Fee in and out.
    const n = r.stake / r.ask;
    const room = 1 - r.ask;
    const pct = (bid / r.ask - 1) * 100;
    const x = r as any;
    if (!x.half && bid >= r.ask + 0.75 * room) {
      x.half = true;
      x.halfBid = bid;
      x.halfCash = r2((n / 2) * bid - fee(n / 2, bid));
      changed = true;
    }
    // PIVOT 5M also gets her 60/40 gate (Love, Oct 11 ~6 AM PT: "we can do both for right now"): once the gain has been +60%
    // the floor is +40%, lifted 5% for every further 5% of best gain; back at the floor = the rest sells.
    if (r.lane === "piv5") {
      x.gBest = Math.max(Number(x.gBest) || -100, pct);
      if (x.gBest >= 60) {
        const gFloor = 40 + 5 * Math.floor((x.gBest - 60) / 5);
        if (pct <= gFloor) {
          const rest = x.half ? n / 2 : n;
          r.result = "sold";
          r.exit = `${x.half ? `half at 75% (${Math.round(x.halfBid * 100)}c) + ` : ""}gate: best +${Math.round(x.gBest)}%, floor +${gFloor}%, sold at ${Math.round(bid * 100)}c`;
          r.pnl = r2((x.half ? x.halfCash : 0) + rest * bid - fee(rest, bid) - r.stake - r.fee);
          changed = true;
          continue;
        }
      }
    }
    const armAt = r.ask + 0.9 * room;
    if (!x.armed && bid >= armAt) { x.armed = true; x.best = pct; changed = true; }
    if (x.armed) {
      x.best = Math.max(Number(x.best) || pct, pct);
      const floorPct = Math.max((armAt / r.ask - 1) * 100, Math.floor(x.best) - 1);
      if (bid >= 0.97 || pct < floorPct) {
        const rest = x.half ? n / 2 : n;
        r.result = "sold";
        r.exit = `${x.half ? `half at 75% (${Math.round(x.halfBid * 100)}c) + ` : ""}trail from 90%: best +${Math.round(x.best)}%, sold at ${Math.round(bid * 100)}c`;
        r.pnl = r2((x.half ? x.halfCash : 0) + rest * bid - fee(rest, bid) - r.stake - r.fee);
        changed = true;
      }
    }
  }
  // settle finished windows from Kalshi's own result. Every 15 s now (Love, Oct 11 ~8:05 PM PT: "it lagged from the last window,
  // can you tighten that up so i don't think it's in one on paper when it's not"): it used to be once a minute plus Kalshi's own
  // delay, so a finished window could still read OPEN 3-4 minutes into the next one. If Kalshi hasn't posted the result yet but
  // the window is over and its last bid was decided (90c+ or 10c-), it settles on that right away (marked provisional) and is
  // re-checked against Kalshi's result on the next passes.
  if (!g.__grokSettleAt || Date.now() - g.__grokSettleAt > 15000) {
    g.__grokSettleAt = Date.now();
    // Oct 15 ~3:50 PM PT (Love: "it says 7 open. it's showing windows that already closed as still open"): with ~20 lanes
    // sharing each window, the settle pass was fetching the SAME ticker once per row - dozens of Kalshi reads per pass,
    // rate-limited into failures, and rows stayed OPEN long past the bell. One read per ticker per pass now.
    const resCache = new Map<string, string | undefined>();
    const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const endOf = (tk: string) => { const m = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(tk); return m ? Date.UTC(2000 + Number(m[1]), MON.indexOf(m[2]), Number(m[3]), Number(m[4]) + 4, Number(m[5])) : 0; };
    const book = (r: Row, won: boolean, how: string) => {
      const x = r as any;
      const n = r.stake / r.ask;
      const rest = x.half ? n / 2 : n;
      r.pnl = r2((x.half ? x.halfCash : 0) + (won ? rest : 0) - r.stake - r.fee);
      r.result = r.pnl > 0.05 ? "win" : "loss";
      r.exit = `${x.half ? `half at 75% (${Math.round(x.halfBid * 100)}c), rest ` : ""}held to the bell${how}`;
    };
    for (const r of rows) {
      const x = r as any;
      const prov = x.prov === true;
      if ((r.result !== "open" && !prov) || (/nowall|paper-/.test(r.lane || "") && ((r as any).parent || (r.lane || "") !== "paper-20"))) continue; // PAPER · 20% ROAD's own extras (no parent) run our exits
      if (assets?.[r.asset]?.market?.ticker === r.ticker) continue;
      let res: string | undefined;
      if (resCache.has(r.ticker)) res = resCache.get(r.ticker);
      else {
        try {
          const j = await kget(`/trade-api/v2/markets/${r.ticker}`);
          res = j?.market?.result;
        } catch {
        }
        resCache.set(r.ticker, res);
      }
      if (res === "yes" || res === "no") {
        book(r, (res === "yes") === (r.side === "up"), "");
        x.prov = false;
        changed = true;
        continue;
      }
      const end = endOf(r.ticker);
      const lb = Number(r.lastBid) || 0;
      if (!prov && r.result === "open" && end && Date.now() > end + 20000 && (lb >= 0.9 || (lb > 0 && lb <= 0.1))) {
        book(r, lb >= 0.9, " (final price; Kalshi's result pending)");
        x.prov = true;
        changed = true;
      }
    }
  }
  if (changed) write(rows);
}

export function grokOg() {
  const rows = read();
  const done = rows.filter((r) => r.result !== "open");
  const sum = (x: Row[]) => ({ n: x.length, w: x.filter((r) => (r.pnl || 0) > 0.05).length, pnl: r2(x.reduce((a, r) => a + (r.pnl || 0), 0)) });
  return {
    total: sum(done),
    btc: sum(done.filter((r) => r.asset === "btc")),
    gold: sum(done.filter((r) => r.asset === "gold")),
    early: sum(done.filter((r) => r.intoWindow <= 180)),
    later: sum(done.filter((r) => r.intoWindow > 180)),
    open: rows.filter((r) => r.result === "open").length,
    recent: rows.slice(0, 12),
  };
}

// OG RECONSTRUCTED (Love, Oct 11 ~2:40 AM PT: "she would long at a band if it tapped even if it was a 4x... enter immediately
// if price is under/over a band, enter if one breaks, same band rules in place... the OG model was different"). Her real
// Oct 1 entry brain was Grok's PRIME BOOK (desk-project 2, prime-book.ts paperChoice), not the setup builder:
//  - "Open" look: any time 2+ min are left, price within 0.35σ of a VWAP band (VWAP, ±0.5σ ... ±3σ) -> LONG if price is on
//    or above that band, SHORT if under it. That is the instant entry at the start of a window.
//  - "Break" look: the last 1m candle opened on one side of a band and closed through it -> trade the break.
//  - Her band rules, Grok's own: no band between price and the strike (bandOnPath), VWAP not on the wrong side of both
//    price and strike (centerWrong).
//  - Any multiple from 1.18x up, no cap (that is how she took 3-4x taps). One ticket per window per lane.
//  - (Grok also required the setup to be winning on her old paper record; that record is gone, so every look counts.)
// Two lanes: "og-golden" on the Oct 1 feed GOLDEN rebuilt (OANDA BTC 5m, session from 5 PM PT; gold 15m) and "og-hers"
// on today's bands. Same Grok gate exits as GROK OG.
function openLook(spot: number, vwap: number, stdev: number): { label: string; side: "up" | "down" } | null {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  let best: { gap: number; step: number; sign: string } | null = null;
  for (const step of [0, 0.5, 1, 1.5, 2, 2.5, 3]) {
    for (const sign of step === 0 ? [0] : [1, -1]) {
      const price = vwap + sign * step * stdev;
      const gap = Math.abs(spot - price);
      if (gap > stdev * 0.35) continue;
      if (best && gap >= best.gap) continue;
      best = { gap, step, sign: sign < 0 ? "-" : "+" };
    }
  }
  if (!best) return null;
  const level = vwap + (best.sign === "-" ? -1 : 1) * best.step * stdev;
  return { label: `Open ${best.step === 0 ? "VWAP" : `${best.sign}${best.step}σ`}`, side: spot >= level ? "up" : "down" };
}
function breakLook(prints: { o?: number; c?: number }[] | undefined, vwap: number, stdev: number): { label: string; side: "up" | "down" } | null {
  const last = prints?.[prints.length - 1];
  if (!last || !(Number(last.o) > 0) || !(Number(last.c) > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  for (const step of [0, 0.5, 1, 1.5, 2, 2.5, 3]) for (const sign of step === 0 ? [0] : [1, -1]) {
    const L = vwap + sign * step * stdev;
    const nm = step === 0 ? "VWAP" : `${sign < 0 ? "-" : "+"}${step}σ`;
    if (Number(last.o) > L && Number(last.c) < L) return { label: `Close below ${nm}`, side: "down" };
    if (Number(last.o) < L && Number(last.c) > L) return { label: `Close above ${nm}`, side: "up" };
  }
  return null;
}
export function ogConsider(lane: "og-golden" | "og-hers", id: string, a: any) {
  try {
    const m = a?.market, left = Number(a?.secondsLeft) || 0, spot = Number(a?.spot) || 0, target = Number(a?.target) || 0;
    if (!m?.ticker || !(left >= 120) || !(spot > 0) || !(target > 0)) return;
    const frame = a?.vwap1m?.vwap ? a.vwap1m : a?.vwap5m;
    const vwap = Number(frame?.vwap) || 0, sd = Number(frame?.stdev) || 0;
    if (!(vwap > 0 && sd > 0)) return;
    const rows = read();
    if (rows.some((r) => r.ticker === m.ticker && r.lane === lane)) return;
    for (const look of [breakLook(a?.lastPrints, vwap, sd), openLook(spot, vwap, sd)]) {
      if (!look) continue;
      if ([a?.vwap1m, a?.vwap5m].some((f: any) => f?.vwap && f?.stdev && bandOnPath(look.side, spot, target, f.vwap, f.stdev))) continue;
      if ([a?.vwap1m, a?.vwap5m].some((f: any) => centerWrong(look.side, spot, target, f?.vwap || 0))) continue;
      const ask = Number(look.side === "up" ? m.yesAsk : m.noAsk);
      // 1.38x floor (Love, Oct 11 ~5:30 AM PT: "definitely keep the 1.38x floor, not 1.18, not worth the risk").
      if (!(ask > 0.02 && ask < 0.98) || !(1 / ask >= 1.38)) continue;
      const n = STAKE / ask;
      rows.unshift({ id: `${m.ticker}:${lane}`, lane, at: new Date().toISOString(), asset: id, ticker: m.ticker, side: look.side, label: look.label, ask: r2(ask), multiple: r2(1 / ask), secondsLeft: Math.round(left), intoWindow: Math.round(900 - left), stake: STAKE, fee: fee(n, ask), peak: ask, lastBid: 0, result: "open", exit: null, pnl: null });
      write(rows);
      return;
    }
  } catch {
  }
}
export function grokLanes() {
  const rows = read();
  const out: Record<string, any> = {};
  for (const lane of ["grok", "og-golden", "og-hers", "piv2", "piv5", "piv10", "piv15", "sp2", "sp5", "sp10", "sp15", "brick-nowall", "brick-nowall-skipped", "squeeze-nowall", "squeeze-nowall-skipped", "paper-247", "paper-best", "paper-winners", "paper-20", "open-road", "ogp2", "ogp5", "ogp10", "ogp15", "og-golden-bank", "og-hers-bank", "ogp2-bank", "ogp5-bank", "ogp10-bank", "ogp15-bank"]) {
    const x = rows.filter((r) => (r.lane || "grok") === lane);
    const done = x.filter((r) => r.result !== "open");
    const sum = (y: Row[]) => ({ n: y.length, w: y.filter((r) => (r.pnl || 0) > 0.05).length, pnl: r2(y.reduce((a, r) => a + (r.pnl || 0), 0)) });
    out[lane] = { total: sum(done), btc: sum(done.filter((r) => r.asset === "btc")), gold: sum(done.filter((r) => r.asset === "gold")), early: sum(done.filter((r) => r.intoWindow <= 180)), open: x.length - done.length, recent: x.slice(0, 8) };
  }
  return out;
}

// SHIFT CARDS (Love, Oct 11 ~4:45 AM PT: "can you add them in & give them shift cards so i can tap and see their trades").
// The OG / PIVOT / PAPER-twin lanes, shaped like night-book rows so SHIFT shows them as books (read only, never copied live).
export const LANE_BOOK: Record<string, string> = { "og-golden": "ogg", "og-hers": "ogh", grok: "grokb", piv2: "piv2", piv5: "piv5", piv10: "piv10", piv15: "piv15", sp2: "sp2", sp5: "sp5", sp10: "sp10", sp15: "sp15", "brick-nowall": "brnw", "squeeze-nowall": "sqnw", "paper-247": "pap247", "paper-best": "papbest", "paper-winners": "papwin", "paper-20": "pap20", ogp2: "ogp2", ogp5: "ogp5", ogp10: "ogp10", ogp15: "ogp15", "og-golden-bank": "oggb", "og-hers-bank": "oghb", "ogp2-bank": "ogp2b", "ogp5-bank": "ogp5b", "ogp10-bank": "ogp10b", "ogp15-bank": "ogp15b",
  // NEW 🆕 lanes on SHIFT (Oct 15 ~4:10 PM PT, Love: "fast twins show no records on their trades at all can you fix everything please?").
  // Display mapping only: a book still goes to Kalshi only when SHE puts it on RUN / liveBook.books; auto-roll is off and reads listNight only.
  "ogp5-fast": "ogp5-fast", "ogp5-gw": "ogp5-gw", "ogp5-inv": "ogp5-inv", "ogp5-boll": "ogp5-boll", "ogp5-lock": "ogp5-lock", "ogp5-btco": "ogp5-btco", "ogp5-pv": "ogp5-pv", "gold-rg": "gold-rg", "brk-sess": "brk-sess", brk5: "brk5", brk10: "brk10", brk15: "brk15" };
// ARCHIVE ON THE CARDS (Oct 13 ~8 PM PT, Love: "yesss i do"): the lineup's older rows (grok-og-archive.jsonl, including the
// 623 rebuilt Oct 11-13 rows) for the SHIFT cards only. The copier never reads these (it calls asNightRows() with no list).
export function archiveNightRows(): any[] {
  // + BRICK · NO PIVOT WALL, all the way back to her first trade (Oct 16 ~3:40 AM PT, Love: "her trades only show today on here
  // they don't go back to her beginning, can you put those here bb?").
  const keep = new Set(["sp5", "ogp5", "sp15", "ogp15", "paper-247", "brick-nowall"]);
  const allTime = new Set(["brick-nowall"]);
  const have = new Set(read().map((r) => r.id));
  const seen = new Set<string>();
  const rows: Row[] = [];
  try {
    for (const r of archiveRows() as any[]) {
      if (!r) continue;
      if (!keep.has(r?.lane) || have.has(r.id) || seen.has(r.id) || r.pnl == null) continue;
      if (!allTime.has(r.lane) && Date.now() - Date.parse(r.at) > 4 * 86400000) continue;
      seen.add(r.id);
      rows.push(r);
    }
  } catch {}
  return asNightRows(rows);
}
// READ ONCE PER CHANGE (Oct 15, close-lag hunt: grok-og.json, 3.6-4 MB, was parsed 7-10 times a SECOND - the copier asks for
// these rows on every step of its loop - ~600 ms of every 10 s blocking the server, her close clicks waiting behind it).
// asNightRows only reads the rows (it builds new objects), so it shares one parse until the file actually changes.
function readShared(): Row[] {
  const G = globalThis as any;
  let key = "";
  try { const st = statSync(D("grok-og.json")); key = `${st.mtimeMs}:${st.size}`; } catch { return []; }
  const c = G.__ogShared;
  if (c && c.key === key) return c.rows;
  const rows = read();
  G.__ogShared = { key, rows };
  return rows;
}
// CLOSE-LAG FIX (Oct 16 ~2:20 AM PT, Love: "your CLOSE BUTTONS DO NOT WORK... i clicked 20 times"). A CPU profile showed the
// server frozen 8-20 s about once a minute; the top cost was this function building a new Intl.DateTimeFormat for every one
// of 8,000 rows on every call (the copier calls it many times a second). Same output: one shared formatter, and the
// converted list is cached per grok-og.json version (callers get their own copies of each row, so nothing they change leaks).
const HOUR_PT = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" });
export function asNightRows(src?: Row[]): any[] {
  if (!src) {
    const G = globalThis as any;
    const rs = readShared();
    const key = G.__ogShared?.key;
    if (key && G.__anrCache?.key === key && G.__anrCache.n === rs.length) return G.__anrCache.rows.map((x: any) => ({ ...x }));
    const built = asNightRows(rs);
    if (key) G.__anrCache = { key, n: rs.length, rows: built.map((x: any) => ({ ...x })) };
    return built;
  }
  const out: any[] = [];
  for (const r of src) {
    const book = LANE_BOOK[(r as any).lane || "grok"];
    if (!book) continue;
    const ask = Number(r.ask) || 0;
    const hourPT = Number(HOUR_PT.format(new Date(r.at)));
    out.push({ id: `${r.ticker}:${book}:${r.id}`, book, at: r.at, asset: r.asset, ticker: r.ticker, side: r.side, setup: r.label, ask, multiple: Number(r.multiple) || (ask > 0 ? 1 / ask : 0), stake: Number(r.stake) || 20, tpPct: 0, peakPct: ask > 0 && (r as any).peak ? Math.round(((Number((r as any).peak) / ask) - 1) * 1000) / 10 : 0, exit: r.exit, sellBid: null, result: r.result, pnl: r.pnl, bands: null, spot: null, event: null, hourPT });
  }
  return out;
}
