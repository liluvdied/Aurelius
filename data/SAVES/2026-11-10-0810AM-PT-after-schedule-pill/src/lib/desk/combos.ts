// COMBO TRACKER (Claude, Oct 11 ~5:35 AM PT, Love: "can stack combos on 1.2x multiples that are already decided for the 15M
// markets" -> "yes [track them] and have her do the same gate: triggers 60%, catches at 40% with the floors raised every
// 5%"). PAPER ONLY. Every 15-minute crypto window on Kalshi (BTC, ETH, SOL, XRP, DOGE, HYPE... whatever Kalshi lists), in the
// last 5 minutes down to 1 minute left: every market whose favorite already costs 88c+ (1.14x or less) becomes a leg; 4+ legs
// = one $100 combo at the product of the asks. Marked every tick at the product of the legs' bids (Kalshi's real combo
// cash-out comes from its own quote, so this is close, not exact; no combo fee modeled).
// Exit = her gate: arms once the combo has been +60%, floor +40%, every further 5% of best gain lifts the floor 5%; back at the
// floor = cashed out. Otherwise it settles: every leg right = paid in full, one leg wrong = -$100. HOLD is scored too.
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";

const STAKE = 100;
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => { const n = Number.parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : NaN; };
type Leg = { ticker: string; series: string; side: "yes" | "no"; ask: number; bid?: number; result?: string; kind?: "crypto" | "comm" | "sports"; wp?: number; note?: string; hedge?: { at: string; a: number; legBid: number; cover: number } };
type Hedge = { n: number; flips: number; pnl5: number; pnlCover: number; cost5: number; costCover: number };
type Combo = { hedge?: Hedge; id: string; lane?: string; at: string; window: string; legs: Leg[]; cost: number; multiple: number; secondsLeft: number; best: number; lastPct: number; result: "open" | "sold" | "win" | "loss"; exit: string | null; pnl: number | null; holdPnl: number | null; ctx?: Record<string, any>; tp?: Record<string, number | null> };
const read = (): Combo[] => { try { return existsSync(D("combos.json")) ? JSON.parse(readFileSync(D("combos.json"), "utf8")) : []; } catch { return []; } };
const write = (rows: Combo[]) => { writeFileSync(D("combos.json.tmp"), JSON.stringify(rows.slice(0, 3000))); renameSync(D("combos.json.tmp"), D("combos.json")); };
const g = globalThis as unknown as { __cbQ?: { lane?: string; id: string; legs: any[]; est: number; tries?: number; nb?: number }[]; __cbQBusy?: boolean; __cbQN?: number; __cbAt?: number; __cbBusy?: boolean; __cbSeries?: { at: number; v: string[] }; __cbComm?: { at: number; v: string[] }; __cbSettleAt?: number };
// COMBO LANES (Love, Oct 11 ~6:50 PM PT: "we need to wait until the multiple is over 5-7 on the other side... crypto tends to
// reverse more than the commodities do, so let's have her focus on the commodities too... doesn't need to be in the last 5
// minutes, provided she gets in while the multiple is high on the other side"). PAPER, $100 each, same 60/40 gate:
//  - crypto-late: the original (crypto only, last 5:00-1:00, every favorite at 88c+, 4+ legs).
//  - mix-5x / mix-7x: crypto + commodity 15-minute markets, any time with 1:00+ left, legs whose OTHER side pays 5x+ (favorite
//    80c+) / 7x+ (favorite 86c+), 4+ legs, taken the first moment a window qualifies.
//  - comm-5x: commodities only (gold, silver... whatever Kalshi lists at 15 minutes), other side 5x+, 2+ legs.
// Whether Kalshi lets commodity legs sit in one combo with crypto is not verified: these are paper until we check.
export const COMBO_LANES: { id: string; title: string; crypto: boolean; comm: boolean; minFav: number; minLegs: number; late: boolean }[] = [
  { id: "crypto-late", title: "CRYPTO · LAST 5 MIN · 88c+", crypto: true, comm: false, minFav: 0.88, minLegs: 4, late: true },
  // Oct 12 ~3:35 PM PT (Love: "let's try having her run the same fills with 10 minutes left... kalshi does have an issue with
  // filling combos close to expiry"): the same 88c+ crypto legs, built with 10:00-5:01 left instead of the last 5 minutes.
  { id: "crypto-10m", title: "CRYPTO · 10 MIN LEFT · 88c+", crypto: true, comm: false, minFav: 0.88, minLegs: 4, late: true, maxLeft: 600, minLeft: 301 } as any,
  { id: "mix-5x", title: "CRYPTO + COMMODITIES · OTHER SIDE 5x+", crypto: true, comm: true, minFav: 0.8, minLegs: 4, late: false },
  { id: "mix-7x", title: "CRYPTO + COMMODITIES · OTHER SIDE 7x+", crypto: true, comm: true, minFav: 0.857, minLegs: 4, late: false },
  { id: "comm-5x", title: "COMMODITIES ONLY · OTHER SIDE 5x+", crypto: false, comm: true, minFav: 0.8, minLegs: 2, late: false },
];
// CLAUDE'S PICKS (Love, Oct 11 ~7:20 PM PT: "another model that runs on YOUR rules for the highest chance of success... for all of
// the combos, not just crypto/commodities, sports, everything"). My rules, built from today's misses (one crypto spike flipped
// several legs at once, so legs that move together are the risk, not any single leg):
//  - each leg must be close to decided: favorite 90-97c (other side 10x+), and for the 15-minute markets only with 2:00-6:00
//    left (late enough to be settled, early enough to still price under 97c);
//  - at most 2 crypto legs (they move as one), at most 2 commodity legs, sports legs only when ESPN's live win model says 95%+
//    and Kalshi's price is at least 2 points under it (data says it's cheaper than it should be);
//  - 3 to 5 legs from at least 2 different groups; one combo per 15-minute window; paper $100, same gate, every exit scored.
const CLAUDE = { id: "claude", title: "CLAUDE'S PICKS ✦ · HIGHEST ODDS, SPREAD ACROSS GROUPS" };
const PT_HOUR = (d = new Date()) => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(d));
function ctxOf(lane: string, legs: Leg[], secondsLeft: number, cost: number) {
  const asks = legs.map((l) => l.ask);
  return { lane, hourPT: PT_HOUR(), weekday: new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }), secondsLeft, legs: legs.length,
    crypto: legs.filter((l) => l.kind === "crypto").length, comm: legs.filter((l) => l.kind === "comm").length, sports: legs.filter((l) => l.kind === "sports").length,
    minLeg: Math.min(...asks), avgLeg: r2(asks.reduce((a, b) => a + b, 0) / asks.length), multiple: r2(1 / cost) };
}
const laneOf = (c: { lane?: string }) => c.lane || "crypto-late";

async function currentMarkets(series: string[]) {
  const out: any[] = [];
  for (const s of series) {
    try {
      const j = await kget(`/trade-api/v2/markets?series_ticker=${s}&status=open&limit=5`);
      const ms = (j?.markets ?? []).filter((m: any) => Date.parse(m.close_time) > Date.now()).sort((a: any, b: any) => Date.parse(a.close_time) - Date.parse(b.close_time));
      if (ms[0]) out.push({ ...ms[0], series: s });
    } catch {
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return out;
}
export async function comboTick() {
  if (g.__cbBusy || (g.__cbAt && Date.now() - g.__cbAt < 15000)) return;
  g.__cbAt = Date.now();
  g.__cbBusy = true;
  try {
    if (!g.__cbSeries || Date.now() - g.__cbSeries.at > 6 * 3600 * 1000) {
      const j = await kget(`/trade-api/v2/series?category=Crypto`);
      const v = (j?.series ?? []).map((x: any) => String(x.ticker || "")).filter((t: string) => /15M$/.test(t) && !/CRYPTOLEAD|CRYPTOCOMP/.test(t));
      g.__cbSeries = { at: Date.now(), v };
    }
    if (!g.__cbComm || Date.now() - g.__cbComm.at > 6 * 3600 * 1000) {
      try {
        const j2 = await kget(`/trade-api/v2/series?category=Commodities`);
        g.__cbComm = { at: Date.now(), v: (j2?.series ?? []).map((x: any) => String(x.ticker || "")).filter((t: string) => /15M$/.test(t)) };
      } catch { g.__cbComm = { at: Date.now(), v: ["KXGOLD15M", "KXSILVER15M"] }; }
    }
    // Kalshi refuses these inside combos ("This market type isn't supported in combos: KXPALLADIUM15M", Oct 12 8:12 PM),
    // so no lane builds with them (paper included, so the record stays buildable).
    const NO_COMBO = /^KX(PALLADIUM|PLATINUM)15M$/;
    const comm = g.__cbComm.v.filter((t) => !NO_COMBO.test(t));
    const series = [...g.__cbSeries.v.filter((t) => !/CRYPTOLEAD|CRYPTOCOMP/.test(t)), ...comm.filter((t) => !g.__cbSeries!.v.includes(t))];
    if (!series.length) { try { writeFileSync(D("combos-status.json"), JSON.stringify({ at: new Date().toISOString(), error: "no crypto 15M series found" })); } catch {} g.__cbSeries = undefined; return; }
    const rows = read();
    let changed = false;
    const open = rows.filter((c) => c.result === "open");
    // markets only when something is open or we're in the last 5 minutes of a window
    const nowMs = Date.now();
    const toClose = 900 - Math.floor(nowMs / 1000) % 900;
    // the any-time lanes need a look every tick (with 1:00+ left); the original lane only in its last 5 minutes
    if (!open.length && !(toClose >= 60)) return;
    const mk = await currentMarkets(series);
    const byT = new Map(mk.map((m) => [m.ticker, m]));
    try { writeFileSync(D("combos-status.json"), JSON.stringify({ at: new Date().toISOString(), series, comm, toClose, markets: mk.map((m) => ({ t: m.ticker, close: m.close_time, ya: m.yes_ask_dollars, na: m.no_ask_dollars })) }, null, 1)); } catch {}
    // mark + gate
    for (const c of open) {
      let prod = 1, ok = true;
      for (const l of c.legs) {
        const m = byT.get(l.ticker);
        const b = num(l.side === "yes" ? m?.yes_bid_dollars : m?.no_bid_dollars);
        if (!(b > 0)) { ok = false; break; }
        l.bid = b;
        // HEDGE LAB (Love, Oct 12 AM: "if one looks like it could flip... $5 hedges at that multiple, will it cover the loss?").
        // Paper only. A leg that came in at 85c+ and has slipped 8c+ to 85c or less gets a hedge on its OTHER side at that
        // side's ask, once: a FIFTH of the stake ($20 on $100; Love: "1/5th for the paper testing"), and a "cover" size that pays back the combo's whole $100 if that leg flips.
        if (!l.hedge && b <= 0.85 && l.ask - b >= 0.08) {
          const oa = num(l.side === "yes" ? m?.no_ask_dollars : m?.yes_ask_dollars);
          if (oa > 0.01 && oa < 0.5) l.hedge = { at: new Date().toISOString(), a: oa, legBid: b, cover: r2((STAKE * oa) / (1 - oa)) };
        }
        prod *= b;
      }
      if (!ok) continue;
      const pct = (prod / c.cost - 1) * 100;
      const prevPct = c.lastPct;
      c.lastPct = r2(pct);
      // spike filter (Oct 12): a best counts once it held two readings in a row
      const heldPct = Number.isFinite(prevPct) && (c as any).scale ? Math.min(pct, prevPct) : pct;
      if (!(c as any).scale) { (c as any).scale = true; c.best = heldPct; }
      c.best = Math.max(c.best, heldPct);
      // EXIT LAB (Oct 11, Love: "she's cashing it before letting them ride to the bell"): what cashing out at 50% / 75% / 90% of
      // the combo's max gain would have paid, recorded the first time each line is reached (else it rides to the bell).
      const maxGain = 1 / c.cost - 1;
      for (const k of [50, 75, 90]) {
        c.tp ||= {};
        if (c.tp[`at${k}`] == null && maxGain > 0 && prod / c.cost - 1 >= (k / 100) * maxGain) c.tp[`at${k}`] = r2(STAKE * (prod / c.cost) - STAKE);
      }
      // SCALE GATE (Love, Oct 12 ~4 PM PT): arm at 50% of the way to the max, floor 30% of the way, +5 per 5 of best.
      const mg = maxGain * 100, armAt = 0.5 * mg;
      if (mg > 0 && c.best >= armAt) {
        const floor = Math.round((0.3 * mg + 5 * Math.floor((c.best - armAt) / 5)) * 100) / 100;
        if (pct <= floor) {
          c.result = "sold";
          c.pnl = r2(STAKE * (prod / c.cost) - STAKE);
          c.exit = `gate: best +${Math.round(c.best)}%, floor +${floor}%, cashed out at +${Math.round(pct)}%`;
        }
      }
      changed = true;
    }
    // build this window's combos, one per lane
    const win = mk[0]?.close_time ? String(mk.map((m) => m.close_time).sort()[0]) : "";
    if (win && toClose >= 60) {
      for (const L of COMBO_LANES) {
        if (L.late && !(toClose <= ((L as any).maxLeft ?? 300) && toClose >= ((L as any).minLeft ?? 0))) continue;
        if (rows.some((c) => c.window === win && laneOf(c) === L.id)) continue;
        const legs: Leg[] = [];
        for (const m of mk) {
          if (String(m.close_time) !== win) continue;
          const isComm = comm.includes(m.series);
          if (isComm ? !L.comm : !L.crypto) continue;
          const ya = num(m.yes_ask_dollars), na = num(m.no_ask_dollars);
          const kind = isComm ? "comm" : "crypto";
          if (ya >= L.minFav && ya < 0.995) legs.push({ ticker: m.ticker, series: m.series, side: "yes", ask: ya, kind });
          else if (na >= L.minFav && na < 0.995) legs.push({ ticker: m.ticker, series: m.series, side: "no", ask: na, kind });
        }
        if (legs.length >= L.minLegs) {
          const cost = legs.reduce((p, l) => p * l.ask, 1);
          (g.__cbQ ||= []).push({ lane: L.id, id: `combo:${L.id}:${win}`, legs: legs.map((l) => ({ market_ticker: l.ticker, event_ticker: l.ticker.replace(/-[^-]+$/, ""), side: l.side, ask: l.ask })), est: cost });
          rows.unshift({ id: `combo:${L.id}:${win}`, lane: L.id, at: new Date().toISOString(), window: win, legs, cost: r2(cost * 10000) / 10000, multiple: r2(1 / cost), secondsLeft: toClose, best: 0, lastPct: 0, result: "open", exit: null, pnl: null, holdPnl: null, ctx: ctxOf(L.id, legs, toClose, cost), tp: {} });
          changed = true;
        }
      }
      // CLAUDE'S PICKS
      if (toClose >= 120 && toClose <= 360 && !rows.some((c) => c.window === win && laneOf(c) === CLAUDE.id)) {
        const pool: Leg[] = [];
        for (const m of mk) {
          if (String(m.close_time) !== win) continue;
          const kind: "comm" | "crypto" = comm.includes(m.series) ? "comm" : "crypto";
          const ya = num(m.yes_ask_dollars), na = num(m.no_ask_dollars);
          if (ya >= 0.9 && ya <= 0.97) pool.push({ ticker: m.ticker, series: m.series, side: "yes", ask: ya, kind });
          else if (na >= 0.9 && na <= 0.97) pool.push({ ticker: m.ticker, series: m.series, side: "no", ask: na, kind });
        }
        // sports from CLOSER's live watch (ESPN win model vs Kalshi), fresh within 2 minutes
        try {
          const cs = JSON.parse(readFileSync(D("closer-status.json"), "utf8"));
          if (Date.now() - Date.parse(cs?.at || 0) < 120000) for (const w of cs?.watching ?? []) {
            const wp = Number(w.wp), ask = Number(w.ask);
            if (!w.ticker || !(wp >= 0.95) || !(ask >= 0.85 && ask <= 0.97) || !(ask <= wp - 0.02)) continue;
            const no = /\(NO\)$/.test(String(w.ticker));
            pool.push({ ticker: String(w.ticker).replace(/\s*\(NO\)$/, ""), series: `${w.league}`, side: no ? "no" : "yes", ask, kind: "sports", wp, note: `${w.fav} · ${w.game} · ${w.clock} P${w.period}` });
          }
        } catch {}
        // most-likely first: sports by edge, others by price
        pool.sort((a, b) => (b.kind === "sports" ? (b.wp ?? 0) - b.ask + 1 : b.ask) - (a.kind === "sports" ? (a.wp ?? 0) - a.ask + 1 : a.ask));
        const pickL: Leg[] = [];
        const cap: Record<string, number> = { crypto: 2, comm: 2, sports: 2 };
        const used: Record<string, number> = {};
        for (const l of pool) {
          if (pickL.length >= 5) break;
          if ((used[l.kind!] ?? 0) >= cap[l.kind!]) continue;
          used[l.kind!] = (used[l.kind!] ?? 0) + 1;
          pickL.push(l);
        }
        const groups = new Set(pickL.map((l) => l.kind)).size;
        if (pickL.length >= 3 && groups >= 2) {
          const cost = pickL.reduce((p, l) => p * l.ask, 1);
          // Oct 12 ~7:55 PM PT (Love: "we can turn on claude's picks for combos too... welcome to take on kalshi while she rests"):
          // real-price check every time, and a live buy (same guards) while her lineup sits out the hour.
          (g.__cbQ ||= []).push({ lane: CLAUDE.id, id: `combo:${CLAUDE.id}:${win}`, legs: pickL.map((l) => ({ market_ticker: l.ticker, event_ticker: l.ticker.replace(/-[^-]+$/, ""), side: l.side, ask: l.ask })), est: cost });
          rows.unshift({ id: `combo:${CLAUDE.id}:${win}`, lane: CLAUDE.id, at: new Date().toISOString(), window: win, legs: pickL, cost: r2(cost * 10000) / 10000, multiple: r2(1 / cost), secondsLeft: toClose, best: 0, lastPct: 0, result: "open", exit: null, pnl: null, holdPnl: null, ctx: ctxOf(CLAUDE.id, pickL, toClose, cost), tp: {} });
          changed = true;
        }
      }
    }
    // settle (once a minute)
    if (!g.__cbSettleAt || Date.now() - g.__cbSettleAt > 60000) {
      g.__cbSettleAt = Date.now();
      for (const c of rows) {
        if (c.holdPnl != null || Date.parse(c.window) > Date.now() - 30000) continue;
        let all = true, done = true;
        for (const l of c.legs) {
          if (!l.result) {
            try { const j = await kget(`/trade-api/v2/markets/${l.ticker}`); const r = j?.market?.result; if (r === "yes" || r === "no") l.result = r; } catch {}
          }
          if (!l.result) { done = false; break; }
          if (l.result !== l.side) all = false;
        }
        if (!done) continue;
        c.holdPnl = all ? r2(STAKE / c.cost - STAKE) : -STAKE;
        const lv: any = (c as any).live;
        // LIVE LEGS + FEE (Oct 13 ~12:40 AM PT): a live combo can hold fewer legs than paper (Kalshi wasn't offering one), so it
        // settles on ITS legs: 12:30 AM mix-7x paper missed ETH, her real NATGAS/GOLD/COPPER combo (no ETH) won. Kalshi's fee
        // (7% x contracts x price x (1 - price), rounded up to the cent) comes off.
        if (lv?.bought && lv.pnl == null && lv.n > 0 && lv.px > 0) {
          let lAll = all;
          if (Array.isArray(lv.legs) && lv.legs.length) lAll = lv.legs.every((t: string) => { const [tk, sd] = String(t).split(":"); const l = c.legs.find((x) => x.ticker === tk); return l ? l.result === (sd || l.side) : true; });
          const fee = Math.ceil(0.07 * lv.n * lv.px * (1 - lv.px) * 100) / 100;
          lv.fee = fee; lv.won = lAll;
          lv.pnl = r2((lAll ? lv.n * (1 - lv.px) : -lv.n * lv.px) - fee);
        }
        const hs = c.legs.filter((l) => l.hedge);
        if (hs.length) {
          const h: Hedge = { n: hs.length, flips: 0, pnl5: 0, pnlCover: 0, cost5: 0, costCover: 0 };
          for (const l of hs) {
            const flip = l.result !== l.side, x = l.hedge!;
            if (flip) h.flips++;
            h.cost5 = r2(h.cost5 + STAKE / 5); h.costCover = r2(h.costCover + x.cover);
            h.pnl5 = r2(h.pnl5 + (flip ? STAKE / 5 / x.a - STAKE / 5 : -STAKE / 5));
            h.pnlCover = r2(h.pnlCover + (flip ? x.cover / x.a - x.cover : -x.cover));
          }
          c.hedge = h;
        }
        c.tp ||= {};
        for (const k of [50, 75, 90]) if (c.tp[`at${k}`] == null) c.tp[`at${k}`] = c.holdPnl;
        if (c.result === "open") { c.result = all ? "win" : "loss"; c.pnl = c.holdPnl; c.exit = all ? "every leg right" : `missed: ${c.legs.filter((l) => l.result !== l.side).map((l) => l.series.replace(/^KX|15M$/g, "")).join(", ")}`; }
        changed = true;
      }
    }
    if (changed) write(rows);
    // REAL-PRICE SHADOW (Oct 12, Love: "have her do those on kalshi now"): each new CRYPTO · LAST 5 MIN combo asks Kalshi's
    // market makers what it would really cost to buy (nothing is bought) and keeps the answer on the combo as c.quote.
    // up to 3 at once (Oct 12 ~9:20 PM PT: every lane but MIX 5x live at $10, so several can land in one window)
    // RE-ASK (Oct 12 ~11 PM PT, Love: "yess absolutely"): a live try that finds no quote at her price is queued again 45 s
    // later (job.nb = not before), up to 3 tries, only while the window has 2+ minutes left. Makers' prices swing a lot
    // minute to minute (10:23 PM: 93.4c, two minutes later 64.1c on the same combo).
    while ((g.__cbQN ?? 0) < 3) {
      const qi = (g.__cbQ ?? []).findIndex((j: any) => !(Number(j.nb) > Date.now()));
      if (qi < 0 || !g.__cbQ) break;
      const job = g.__cbQ.splice(qi, 1)[0]!;
      g.__cbQN = (g.__cbQN ?? 0) + 1;
      void (async () => {
        try {
          const live: any = await import("./kalshi-live.server");
          // LIVE (Love, Oct 12 ~1 PM PT, $20 provisionally): live-switch comboLive {on, dollars, dailyStop}. Today's settled
          // live combos down dailyStop or more = no new buys today. Otherwise shadow quote only.
          let cfg: any = {};
          try { cfg = JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.comboLive ?? {}; } catch {}
          const todayPT = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
          const today = read().filter((x: any) => x.live?.bought && new Date(x.at).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }) === todayPT && x.live?.pnl != null);
          const dayPnl = today.reduce((a: number, x: any) => a + Number(x.live.pnl), 0);
          const stop = Number(cfg.dailyStop) || 60;
          let q: any;
          // CLAUDE'S PICKS go live only in the hours her lineup rests (live-switch comboLive.restOnly), so they never stack on her.
          const sw: any = (() => { try { return JSON.parse(readFileSync(D("live-switch.json"), "utf8")); } catch { return {}; } })();
          const hPT = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
          const rest = (sw?.bookSkipHours?.sp5 ?? []).includes(hPT);
          const restOk = !(Array.isArray(cfg.restOnly) && cfg.restOnly.includes(job.lane)) || rest;
          // HOUR GATE (Oct 13 ~7:30 PM PT, Love: "7 and 8 o'clock was great yesterday you can leave her on"): comboLive.onlyHours
          // (PT hours) = live buys only in those hours; outside them, shadow quote only. Missing/empty = every hour.
          const hourOk = !(Array.isArray(cfg.onlyHours) && cfg.onlyHours.length) || cfg.onlyHours.includes(hPT);
          if (cfg.on === true && dayPnl > -stop && restOk && hourOk && (Array.isArray(cfg.lanes) ? cfg.lanes : ["crypto-late"]).includes(job.lane || "crypto-late")) {
            // BUFFER (Oct 12 ~11 PM PT, Love: "a 5c-10c buffer in case she can't get in at paper's price"): comboLive.buffer
            // {lane: dollars}, added to paper's price ceiling. Set per lane from the buffer test (data/lab/combo-buffer.json).
            const buf = Math.max(0, Math.min(0.15, Number(cfg.buffer?.[job.lane || "crypto-late"]) || 0));
            // 1.3x FLOOR (Oct 13 ~12:40 AM PT, Love: "have her take ones that stack up to a 1.3x minimum across all legs"):
            // the ceiling never goes above 1 / minMult (77c at 1.3x), even after a leg Kalshi isn't offering is dropped
            // (that drop is what made the 1.14x and 1.2x fills). Paper already over it = no live try, shadow quote only.
            const ceil = Math.min(0.9, Number(cfg.minMult) > 1 ? 1 / Number(cfg.minMult) : 0.9);
            // SUPERMODEL LIVE (Oct 13 ~2:05 AM PT, Love: "we can keep her on the ones it works for, and keep the ones that are
            // working with the multiples in our favor as is"): lanes in comboLive.superModel read every leg on its own chart
            // first; any leg on the wrong side of her bands = skip this combo (replay: those legs missed 21% vs 5%).
            let smVeto = "";
            if (Array.isArray(cfg.superModel) && cfg.superModel.includes(job.lane)) {
              try {
                const { smLeg } = await import("./supermodel");
                const wEnd = (/(\d{4}-\d\d-\d\dT[\d:.]+Z)$/.exec(String(job.id)) ?? [])[1] ?? "";
                for (const l of job.legs) {
                  const r = await smLeg(String(l.market_ticker).split("-")[0], l.side, wEnd);
                  if (r.ok === false) { smVeto = `${String(l.market_ticker).split("-")[0].replace(/^KX|15M$/g, "")} ${String(l.side).toUpperCase()}: ${r.why}`; break; }
                }
              } catch {}
            }
            if (smVeto) {
              q = { at: new Date().toISOString(), result: `SuperModel skipped it (${smVeto})`, quotes: [], skipped: "supermodel" };
            } else if (job.est + 0.005 > ceil) {
              q = await live.comboBuyQuote(job.legs, 20, job.est);
              q.skipped = `under ${cfg.minMult}x (paper ${(1 / job.est).toFixed(2)}x)`;
            } else {
            // SIZE BY HOUR (Love, Oct 13 ~2:25 PM PT: "we can have those on @ $10... if they're not stepping on her actual trades
            // we'll keep it at $20"): while her lineup trades, combos buy comboLive.liveHoursDollars; in her rest hours, dollars.
            const dol = rest ? Number(cfg.dollars) || 20 : Number(cfg.liveHoursDollars ?? cfg.dollars) || 20;
            // REAL PRICE (Oct 14 ~1:40 PM PT, Love: "run it boo... consistent and safe 1.4x's - 1.8x's"): lanes in
            // comboLive.realPrice buy at Kalshi's real quote up to the 1/minMult ceiling, not just at paper's leg-product price
            // (Kalshi's combo ask runs well over paper's, so paper's price almost never fills). Replay at real asks, 1.4x+:
            // comm-5x 51 trades 73% +$129, mix-5x 95 trades 64% +$166 at $20.
            const realPx = Array.isArray(cfg.realPrice) && cfg.realPrice.includes(job.lane);
            q = await live.comboBuy(job.legs, dol, realPx ? ceil : Math.min(ceil, job.est + 0.005 + buf), { cap: ceil });
            q.dollars = dol;
            q.buffer = buf; q.try = job.tries ?? 1;
            const winEnd = Date.parse((/(\d{4}-\d\d-\d\dT[\d:.]+Z)$/.exec(String(job.id)) ?? [])[1] ?? "");
            if (/^no quote at or under/.test(String(q.result || "")) && (job.tries ?? 1) < 3 && winEnd - Date.now() - 45000 > 120000) {
              (g.__cbQ ||= []).push({ ...job, tries: (job.tries ?? 1) + 1, nb: Date.now() + 45000 });
              q.requeued = true;
            }
            }
            // AUTO PROOF (Oct 12 ~10:15 PM PT, Love: "is she able to get them thru on her own though? let's get that
            // established while she's on her break"): her $1 tap filled; this proves the same thing with no tap. When the $10
            // try finds no quote at paper's price, she buys the SAME combo for $1 at the real maker price (up to 95c), until
            // comboLive.proof.left is used up. Kept apart from the $10 record (c.proof), so it never touches the daily stop.
            const pf: any = cfg.proof;
            if (pf && Number(pf.left) > 0 && /^no quote at or under/.test(String(q.result || ""))) {
              try {
                const pr: any = await live.comboBuy(job.legs, Number(pf.dollars) || 1, Number(pf.cap) || 0.95, { cap: Number(pf.cap) || 0.95, tag: "auto-proof" });
                q.proof = { result: pr.result, px: pr.quote?.px ?? null, ticker: pr.ticker ?? null, confirm: pr.confirm ?? null };
                if (/^bought/.test(String(pr.result || ""))) {
                  const sw2 = JSON.parse(readFileSync(D("live-switch.json"), "utf8"));
                  sw2.comboLive.proof.left = Math.max(0, Number(sw2.comboLive.proof.left) - 1);
                  (sw2.comboLive.proof.fills ||= []).push({ at: new Date().toISOString(), lane: job.lane, ticker: pr.ticker, px: pr.quote?.px, n: pr.after - pr.before });
                  writeFileSync(D("live-switch.json"), JSON.stringify(sw2, null, 2));
                }
              } catch (e) { q.proof = { error: String(e).slice(0, 160) }; }
            }
          } else {
            q = await live.comboBuyQuote(job.legs, 20, job.est);
            if (cfg.on === true) q.skipped = !(dayPnl > -stop) ? `daily stop: live combos ${dayPnl.toFixed(2)} today` : !restOk ? "her lineup is on this hour (Claude's picks go live only while she rests)" : "lane not live (paper + price check only)";
          }
          const rs = read();
          const c: any = rs.find((x) => x.id === job.id);
          if (c) {
            const nb = Math.max(0, ...((q.quotes ?? []) as any[]).map((x: any) => x.no_bid || 0));
            c.quote = { at: q.at, ask: q.bestYesAsk ?? (nb > 0 ? Math.round((1 - nb) * 10000) / 10000 : null), n: q.quotes?.length ?? 0, ticker: q.ticker || null };
            if (q.proof) c.proof = q.proof;
            if (q.result) c.live = { result: q.result, bought: /^bought/.test(q.result), px: q.quote?.px ?? null, n: q.after != null && q.before != null ? Math.round((q.after - q.before) * 100) / 100 : null, ticker: q.ticker || null, legs: q.legTickers ?? null, pnl: null };
            write(rs);
          }
          try { appendFileSync(D("combo-quotes.jsonl"), JSON.stringify({ id: job.id, ...q }) + "\n"); } catch {}
        } catch {
        } finally {
          g.__cbQN = Math.max(0, (g.__cbQN ?? 1) - 1);
        }
      })();
    }
    // SUPERMODEL ✨ twins (Oct 13 ~1:20 AM PT, Love): read off the tick so live buys are never held up by chart reads.
    void smPass().catch(() => {});
  } catch (e) {
    try { writeFileSync(D("combos-status.json"), JSON.stringify({ at: new Date().toISOString(), error: String(e).slice(0, 200) })); } catch {}
  } finally {
    g.__cbBusy = false;
  }
}
// SUPERMODEL ✨ PASS: every new combo (built in the last 4 min, not yet read) gets each leg checked on its own chart with her
// pivot model (supermodel.ts). The original keeps c.sm (which legs passed and why); a "<lane>-sm" twin is booked with only the
// legs that passed. Too few left (under max(2, lane minimum - 1)) = no twin, she sits it out. Paper only.
const gs = globalThis as unknown as { __smBusy?: boolean };
async function smPass() {
  if (gs.__smBusy) return;
  gs.__smBusy = true;
  try {
    const todo = read().filter((c) => !/-sm$/.test(laneOf(c)) && !(c as any).sm && c.result === "open" && Date.now() - Date.parse(c.at) < 240000);
    if (!todo.length) return;
    const { smLeg } = await import("./supermodel");
    const out: Record<string, { kept: Leg[]; reads: any[] }> = {};
    for (const c of todo) {
      const reads: any[] = [];
      const kept: Leg[] = [];
      for (const l of c.legs) {
        const r = l.kind === "sports" ? { ok: null, why: "no read (sports)" } : await smLeg(l.series, l.side, c.window);
        reads.push({ leg: `${String(l.series).replace(/^KX|15M$/g, "")} ${l.side.toUpperCase()}`, ...r });
        if (r.ok !== false) kept.push({ ...l });
      }
      out[c.id] = { kept, reads };
    }
    const rows = read();
    for (const [id, r] of Object.entries(out)) {
      const c: any = rows.find((x) => x.id === id);
      if (!c || c.sm) continue;
      // SKIP MODE (Oct 13 ~1:50 AM PT, Love: "if our model blatantly rejects it for being on the wrong side of a band she can
      // skip"): any vetoed leg = she skips the whole combo; otherwise she takes it exactly as built. Replay since noon Oct 12:
      // vetoed legs missed 21% vs 5% for the rest; skipping lifted wins 82% -> 87% (dollars: mixed by lane).
      const need = c.legs.length;
      c.sm = { reads: r.reads, kept: r.kept.length, of: c.legs.length, twin: r.kept.length >= need };
      if (r.kept.length >= need && !rows.some((x) => x.id === id.replace(/^combo:([^:]+):/, "combo:$1-sm:"))) {
        const cost = r.kept.reduce((p, l) => p * l.ask, 1);
        rows.unshift({ id: id.replace(/^combo:([^:]+):/, "combo:$1-sm:"), lane: `${laneOf(c)}-sm`, at: new Date().toISOString(), window: c.window, legs: r.kept, cost: Math.round(cost * 10000) / 10000, multiple: r2(1 / cost), secondsLeft: c.secondsLeft, best: 0, lastPct: 0, result: "open", exit: null, pnl: null, holdPnl: null, tp: {}, sm: { reads: r.reads, kept: r.kept.length, of: c.legs.length, twin: true } } as any);
      }
    }
    write(rows);
  } finally {
    gs.__smBusy = false;
  }
}
export function comboLanes() {
  const rows = read();
  return [...COMBO_LANES, { id: CLAUDE.id, title: CLAUDE.title }].map((L: any) => {
    const xs = rows.filter((c) => laneOf(c) === L.id);
    const done = xs.filter((c) => c.result !== "open");
    return { id: L.id, title: L.title, n: done.length, w: done.filter((c) => (c.pnl || 0) > 0).length, pnl: r2(done.reduce((a, c) => a + (c.pnl || 0), 0)), open: xs.length - done.length };
  });
}
export function comboRows() { return read(); }
export function combos() {
  const rows = read().filter((c) => !/-sm$/.test(laneOf(c)));
  const done = rows.filter((c) => c.result !== "open");
  const held = rows.filter((c) => c.holdPnl != null);
  return { n: done.length, w: done.filter((c) => (c.pnl || 0) > 0).length, pnl: r2(done.reduce((a, c) => a + (c.pnl || 0), 0)), hold: { n: held.length, w: held.filter((c) => (c.holdPnl || 0) > 0).length, pnl: r2(held.reduce((a, c) => a + (c.holdPnl || 0), 0)) }, open: rows.filter((c) => c.result === "open").length, recent: rows.slice(0, 10) };
}

// COMBO LESSONS (Love, Oct 11 ~7:20 PM PT: "a learning protocol... log the scenarios in place when she enters, after a week the
// scenarios responsible for the majority of the losses will be apparent, and then we can avoid them"). Every combo since this
// change carries its entry scenario (ctx); every settled one is bucketed by each part of it. A bucket is only called once it
// has 8+ combos. Leg level: which markets and which leg prices miss most.
export function comboLessons() {
  const rows = read().filter((c) => c.ctx && c.holdPnl != null);
  const buckets: Record<string, Record<string, { n: number; w: number; pnl: number }>> = {};
  const put = (dim: string, key: string, c: Combo) => { const b = ((buckets[dim] ||= {})[key] ||= { n: 0, w: 0, pnl: 0 }); b.n++; if ((c.pnl || 0) > 0) b.w++; b.pnl = r2(b.pnl + (c.pnl || 0)); };
  const tb = (s: number) => (s <= 120 ? "≤2 min left" : s <= 300 ? "2-5 min left" : s <= 600 ? "5-10 min left" : "10+ min left");
  const lb = (a: number) => (a < 0.85 ? "weakest leg <85c" : a < 0.9 ? "weakest leg 85-89c" : a < 0.95 ? "weakest leg 90-94c" : "weakest leg 95c+");
  for (const c of rows) {
    const x = c.ctx!;
    put("lane", String(x.lane), c); put("time left", tb(Number(x.secondsLeft)), c); put("weakest leg", lb(Number(x.minLeg)), c);
    put("legs", Number(x.legs) >= 7 ? "7+ legs" : `${x.legs} legs`, c); put("crypto legs", Number(x.crypto) >= 4 ? "4+ crypto legs" : `${x.crypto} crypto legs`, c);
    put("hour PT", `${x.hourPT}:00`, c); put("multiple", Number(x.multiple) < 1.3 ? "<1.3x" : Number(x.multiple) < 1.6 ? "1.3-1.6x" : Number(x.multiple) < 2.5 ? "1.6-2.5x" : "2.5x+", c);
  }
  const legMiss: Record<string, { n: number; miss: number }> = {};
  const legPx: Record<string, { n: number; miss: number }> = {};
  for (const c of read()) for (const l of c.legs) {
    if (!l.result) continue;
    const s1 = (legMiss[String(l.series).replace(/^KX|15M$/g, "")] ||= { n: 0, miss: 0 }); s1.n++; if (l.result !== l.side) s1.miss++;
    const pb = l.ask < 0.85 ? "<85c" : l.ask < 0.9 ? "85-89c" : l.ask < 0.95 ? "90-94c" : "95c+";
    const s2 = (legPx[pb] ||= { n: 0, miss: 0 }); s2.n++; if (l.result !== l.side) s2.miss++;
  }
  const exits: Record<string, number> = { hold: 0, at50: 0, at75: 0, at90: 0 };
  for (const c of rows) { exits.hold = r2(exits.hold + (c.holdPnl || 0)); for (const k of ["at50", "at75", "at90"]) exits[k] = r2(exits[k] + Number(c.tp?.[k] ?? c.holdPnl ?? 0)); }
  const worst: { dim: string; key: string; n: number; w: number; pnl: number }[] = [];
  for (const [dim, m] of Object.entries(buckets)) for (const [key, b] of Object.entries(m)) if (b.n >= 8) worst.push({ dim, key, ...b });
  worst.sort((a, b) => a.pnl - b.pnl);
  // HEDGE LAB summary (every settled combo, logged scenario or not)
  const hc = read().filter((c) => c.hedge);
  const hedge = { n: hc.length, legs: hc.reduce((a, c) => a + c.hedge!.n, 0), flips: hc.reduce((a, c) => a + c.hedge!.flips, 0), combo: r2(hc.reduce((a, c) => a + (c.pnl || 0), 0)), with5: r2(hc.reduce((a, c) => a + (c.pnl || 0) + c.hedge!.pnl5, 0)), withCover: r2(hc.reduce((a, c) => a + (c.pnl || 0) + c.hedge!.pnlCover, 0)), hedge5: r2(hc.reduce((a, c) => a + c.hedge!.pnl5, 0)), hedgeCover: r2(hc.reduce((a, c) => a + c.hedge!.pnlCover, 0)), open: read().filter((c) => c.holdPnl == null && c.legs.some((l) => l.hedge)).length };
  // REAL PRICE: CRYPTO · LAST 5 MIN combos with a Kalshi maker quote, scored at that price held to the bell vs paper's price.
  const qs = read().filter((c: any) => c.quote?.ask > 0 && c.holdPnl != null);
  const realPrice = { n: qs.length, paper: r2(qs.reduce((a, c) => a + (c.holdPnl || 0), 0)), real: r2(qs.reduce((a, c: any) => a + ((c.holdPnl || 0) > 0 ? STAKE / c.quote.ask - STAKE : -STAKE), 0)), avgPaper: qs.length ? r2(qs.reduce((a, c) => a + c.cost, 0) / qs.length) : null, avgReal: qs.length ? r2(qs.reduce((a, c: any) => a + c.quote.ask, 0) / qs.length) : null, wins: qs.filter((c) => (c.holdPnl || 0) > 0).length };
  return { n: rows.length, buckets, worst: worst.slice(0, 6), best: [...worst].reverse().slice(0, 6), legMiss, legPx, exits, hedge, realPrice };
}
