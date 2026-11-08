// CLOSER (Claude, Oct 10 ~7:20 PM PT, Love, LSU 27-24 Kentucky, Q4 4:57, UK's 42-yd FG no good: "can we also get her to
// scan for stuff like this???? allll high probability outcomes"). PAPER ONLY, $100.
// Every live game in its last stretch (football Q4/OT, NBA/WNBA Q4, college hoops last 10 min, NHL 3rd, MLB 8th+): ESPN's
// live win-probability model (score, clock, down/distance, field position, timeouts) vs Kalshi's winner price.
//  - EDGE lane: the favorite (model 75%+) at 1.2x or better (ask <= 83c; 80-83c only if the model says 92%+), and the
//    model 5+ points above Kalshi's price after the fee. Her ORACLE rules, ESPN as the eyes.
//  - FAVORITE lane: the late favorite (model 80%+) at 1.2x-1.67x even with no edge, so we learn whether edge matters.
//  - LOOKS: every late-game price every ~3 min (incl. the 1.05x-1.2x ones we don't buy), settled from the final score:
//    the knowledge base says how often an 85c / 90c / 95c late favorite really wins.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";

const STAKE = 100;
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (s: unknown) => { const n = Number.parseFloat(String(s ?? "")); return Number.isFinite(n) ? n : NaN; };
const feeTot = (ask: number, stake: number) => Math.ceil(0.07 * (stake / ask) * ask * (1 - ask) * 100) / 100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const g = globalThis as unknown as { __clAt?: number; __clBusy?: boolean; __clMk?: Record<string, { at: number; v: any[] }> };
const ESPN = "https://site.api.espn.com/apis/site/v2/sports";
// share of the game still to play (0-1), from period + clock
const LEFT: Record<string, (p: number, c: number) => number> = {
  NFL: (p, c) => (p > 4 ? 0 : ((4 - p) * 900 + c) / 3600),
  NCAAF: (p, c) => (p > 4 ? 0 : ((4 - p) * 900 + c) / 3600),
  NBA: (p, c) => (p > 4 ? 0 : ((4 - p) * 720 + c) / 2880),
  WNBA: (p, c) => (p > 4 ? 0 : ((4 - p) * 600 + c) / 2400),
  NCAAMB: (p, c) => (p > 2 ? 0 : ((2 - p) * 1200 + c) / 2400),
  NHL: (p, c) => (p > 3 ? 0 : ((3 - p) * 1200 + c) / 3600),
  MLB: (p) => Math.max(0, (9.5 - p) / 9),
};
const shotBook = (left: number) => (left > 0.75 ? "3Q+ LEFT" : left > 0.5 ? "2-3Q LEFT" : left > 0.25 ? "1-2Q LEFT" : null);
const sellFee = (bid: number, n: number) => Math.ceil(0.07 * n * bid * (1 - bid) * 100) / 100;
const LEAGUES: { key: string; path: string; q: string; series: string; late: (p: number, clock: number) => boolean }[] = [
  { key: "NFL", path: "football/nfl", q: "", series: "KXNFLGAME", late: (p) => p >= 4 },
  { key: "NCAAF", path: "football/college-football", q: "?groups=80&limit=300", series: "KXNCAAFGAME", late: (p) => p >= 4 },
  { key: "NBA", path: "basketball/nba", q: "", series: "KXNBAGAME", late: (p) => p >= 4 },
  { key: "WNBA", path: "basketball/wnba", q: "", series: "KXWNBAGAME", late: (p) => p >= 4 },
  { key: "NCAAMB", path: "basketball/mens-college-basketball", q: "?groups=50&limit=300", series: "KXNCAAMBGAME", late: (p, c) => p >= 3 || (p === 2 && c <= 600) },
  { key: "NHL", path: "hockey/nhl", q: "", series: "KXNHLGAME", late: (p) => p >= 3 },
  { key: "MLB", path: "baseball/mlb", q: "", series: "KXMLBGAME", late: (p) => p >= 8 },
];
type Trade = { id: string; lane: "edge" | "favorite"; at: string; league: string; gameId: string; game: string; team: string; ticker: string; ask: number; wp: number; period: number; clock: string; margin: number; stake: number; fee: number; result: "open" | "win" | "loss" | "void"; pnl: number | null };
type Look = { at: string; league: string; gameId: string; game: string; team: string; ask: number; wp: number | null; period: number; clock: string; margin: number; result: "open" | "win" | "loss" };
// LONGSHOT (Love, Oct 10 ~7:35 PM PT: Kansas at 31x for $1.50, "they haven't even scored a touchdown and it's up 300%... all
// they need is a good play? can we have another lil side book like that? if the odds are 15x+ and there's more than a quarter
// left... two quarters, and 3 quarters. all sports"). The underdog at 15x+ (6c or less), $100 paper, one ticket per game per
// book. Books split by how much game is left when she buys: 3Q+ LEFT (>75%), 2-3Q LEFT (50-75%), 1-2Q LEFT (25-50%), so
// we learn WHEN a longshot is worth buying. Her Seattle lesson ("we don't need to wait for outcomes"): every ticket is
// watched each minute and scored four ways: sell at +100% (2x), +200% (3x), +300% (4x), or hold to the final.
type Hit = { at: string; bid: number; pnl: number };
type Shot = { id: string; book: string; at: string; league: string; gameId: string; game: string; team: string; ticker: string; side: "yes" | "no"; ask: number; wp: number | null; left: number; period: number; clock: string; margin: number; stake: number; fee: number; peak: number; lastBid: number; tp: Record<string, Hit | null>; result: "open" | "win" | "loss" | "void"; pnl: number | null };
const TP_LEVELS: Record<string, number> = { "+100%": 1, "+200%": 2, "+300%": 3 };
type Store = { trades: Trade[]; looks: Look[]; lookAt: Record<string, number>; shots: Shot[] };
const read = (): Store => { try { const s = existsSync(D("closer.json")) ? JSON.parse(readFileSync(D("closer.json"), "utf8")) : null; return { trades: s?.trades ?? [], looks: s?.looks ?? [], lookAt: s?.lookAt ?? {}, shots: s?.shots ?? [] }; } catch { return { trades: [], looks: [], lookAt: {}, shots: [] }; } };
const write = (s: Store) => { s.looks = s.looks.slice(0, 8000); s.trades = s.trades.slice(0, 5000); s.shots = s.shots.slice(0, 5000); writeFileSync(D("closer.json.tmp"), JSON.stringify(s)); renameSync(D("closer.json.tmp"), D("closer.json")); };
async function eget(path: string) {
  const res = await fetch(`${ESPN}/${path}`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`espn ${res.status}`);
  return res.json();
}
const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/\bst\.?\b/g, "state").replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
const names = (t: any) => [t?.location, t?.shortDisplayName, t?.abbreviation, t?.displayName, t?.name, t?.nickname].map(norm).filter((x) => x.length >= 2);
const hit = (a: string, list: string[]) => list.some((b) => a === b || (a.length >= 4 && b.length >= 4 && (a.startsWith(b) || b.startsWith(a))));
// How well a market's team (yes_sub_title / ticker tail) names this team: 3 = exact, 1 = prefix, 0 = no.
function score(m: any, team: any) {
  const tn = names(team);
  const yes = norm(m.yes_sub_title);
  const tail = norm(String(m.ticker || "").split("-").pop());
  if ((yes && tn.includes(yes)) || (tail && tn.includes(tail))) return 3;
  if (yes && hit(yes, tn)) return 1;
  return 0;
}
// Oct 10 fix: "Louisiana" also prefix-matched "Louisiana Tech" and grabbed the wrong market. A market now belongs to a
// team only if it names that team BETTER than it names the opponent, and the game's event must name the opponent too.
function findMarket(markets: any[], team: any, opp: any) {
  const on = names(opp);
  const cand = markets.filter((m) => {
    const a = score(m, team), b = score(m, opp);
    if (!(a > b)) return false;
    const title = norm(m.title), ev = String(m.event_ticker || "").toLowerCase();
    return on.some((o) => o.length >= 3 && title.includes(o)) || on.some((o) => o.length >= 2 && ev.includes(o));
  });
  cand.sort((a, b) => score(b, team) - score(a, team) || Math.abs(Date.parse(a.expected_expiration_time || a.close_time) - Date.now()) - Math.abs(Date.parse(b.expected_expiration_time || b.close_time) - Date.now()));
  return cand[0] || null;
}
async function markets(series: string) {
  const c = (g.__clMk ||= {});
  if (c[series] && Date.now() - c[series].at < 45000) return c[series].v;
  const j = await kget(`/trade-api/v2/markets?series_ticker=${series}&status=open&limit=1000`);
  await sleep(400);
  c[series] = { at: Date.now(), v: j?.markets ?? [] };
  return c[series].v;
}
async function winProb(lg: (typeof LEAGUES)[number], ev: any, comp: any): Promise<number | null> {
  const p = num(comp?.situation?.lastPlay?.probability?.homeWinPercentage);
  if (Number.isFinite(p)) return p;
  try {
    const s = await eget(`${lg.path}/summary?event=${ev.id}`);
    const arr = s?.winprobability;
    const last = Array.isArray(arr) && arr.length ? arr[arr.length - 1] : null;
    const h = num(last?.homeWinPercentage);
    return Number.isFinite(h) ? h : null;
  } catch {
    return null;
  }
}

export async function closerTick() {
  if (g.__clBusy || (g.__clAt && Date.now() - g.__clAt < 55000)) return;
  g.__clAt = Date.now();
  g.__clBusy = true;
  const status: any = { at: new Date().toISOString(), leagues: {}, watching: [] as any[], errors: [] as string[] };
  try {
    const st = read();
    for (const lg of LEAGUES) {
      let board: any;
      try { board = await eget(`${lg.path}/scoreboard${lg.q}`); } catch (e) { status.errors.push(`${lg.key}: ${String(e).slice(0, 60)}`); continue; }
      const evs: any[] = board?.events ?? [];
      const L = (status.leagues[lg.key] = { live: 0, late: 0, matched: 0 });
      for (const ev of evs) {
        const comp = ev?.competitions?.[0];
        const state = comp?.status?.type?.state ?? ev?.status?.type?.state;
        const cs: any[] = comp?.competitors ?? [];
        const home = cs.find((c) => c.homeAway === "home"), away = cs.find((c) => c.homeAway === "away");
        if (!home || !away) continue;
        const gameId = `${lg.key}:${ev.id}`;
        const game = `${away.team?.shortDisplayName || away.team?.abbreviation} ${away.score} @ ${home.team?.shortDisplayName || home.team?.abbreviation} ${home.score}`;
        // settle
        if (state === "post") {
          const winner = home.winner === true ? home : away.winner === true ? away : null;
          for (const t of st.trades) if (t.gameId === gameId && t.result === "open") {
            if (!winner) { t.result = "void"; t.pnl = 0; continue; }
            const won = norm(winner.team?.shortDisplayName || winner.team?.abbreviation) === norm(t.team);
            t.result = won ? "win" : "loss";
            t.pnl = r2(won ? (t.stake / t.ask) * (1 - t.ask) - t.fee : -t.stake - t.fee);
          }
          for (const t of st.shots) if (t.gameId === gameId && t.result === "open") {
            if (!winner) { t.result = "void"; t.pnl = 0; continue; }
            const won = norm(winner.team?.shortDisplayName || winner.team?.abbreviation) === norm(t.team);
            t.result = won ? "win" : "loss";
            t.pnl = r2(won ? (t.stake / t.ask) * (1 - t.ask) - t.fee : -t.stake - t.fee);
          }
          if (winner) for (const k of st.looks) if (k.gameId === gameId && k.result === "open") k.result = norm(winner.team?.shortDisplayName || winner.team?.abbreviation) === norm(k.team) ? "win" : "loss";
          continue;
        }
        if (state !== "in") continue;
        L.live++;
        const period = Number(comp?.status?.period ?? ev?.status?.period ?? 0);
        const clockS = Number(comp?.status?.clock ?? ev?.status?.clock ?? 0);
        const clock = String(comp?.status?.displayClock ?? ev?.status?.displayClock ?? "");
        // LONGSHOT side books (any stage of the game)
        try {
          const left = LEFT[lg.key]?.(period, clockS) ?? 0;
          const mkAll: any[] = await markets(lg.series);
          // watch open tickets: peak bid + take-profit levels
          for (const t of st.shots) if (t.gameId === gameId && t.result === "open") {
            const m = mkAll.find((x) => x.ticker === t.ticker);
            const bid = num(t.side === "yes" ? m?.yes_bid_dollars : m?.no_bid_dollars);
            if (!Number.isFinite(bid)) continue;
            t.lastBid = bid;
            if (bid > t.peak) t.peak = bid;
            const n = t.stake / t.ask;
            for (const [k, L] of Object.entries(TP_LEVELS)) if (!t.tp[k] && bid >= t.ask * (1 + L)) t.tp[k] = { at: new Date().toISOString(), bid, pnl: r2(n * bid - sellFee(bid, n) - t.stake - t.fee) };
          }
          const bk = shotBook(left);
          if (bk) {
            const hA = findMarket(mkAll, home.team, away.team), aA = findMarket(mkAll, away.team, home.team);
            const wpH0 = num(comp?.situation?.lastPlay?.probability?.homeWinPercentage);
            for (const [c, o, m, om, wp] of [[home, away, hA, aA, Number.isFinite(wpH0) ? wpH0 : null], [away, home, aA, hA, Number.isFinite(wpH0) ? 1 - wpH0 : null]] as any[]) {
              const ways: [number, string, "yes" | "no"][] = [];
              const y = num(m?.yes_ask_dollars), nO = num(om?.no_ask_dollars);
              if (m?.ticker && Number.isFinite(y)) ways.push([y, m.ticker, "yes"]);
              if (om?.ticker && Number.isFinite(nO)) ways.push([nO, om.ticker, "no"]);
              ways.sort((a, b) => a[0] - b[0]);
              const w = ways[0];
              if (!w || !(w[0] >= 0.02) || !(w[0] <= 1 / 15 + 1e-9)) continue;
              const team = String(c.team?.shortDisplayName || c.team?.abbreviation);
              const id = `${gameId}:${bk}:${team}`;
              if (st.shots.some((t) => t.id === id)) continue;
              st.shots.unshift({ id, book: bk, at: new Date().toISOString(), league: lg.key, gameId, game, team, ticker: w[1], side: w[2], ask: w[0], wp: wp != null ? r2(wp) : null, left: r2(left), period, clock, margin: Number(c.score) - Number(o.score), stake: STAKE, fee: feeTot(w[0], STAKE), peak: w[0], lastBid: 0, tp: { "+100%": null, "+200%": null, "+300%": null }, result: "open", pnl: null });
            }
          }
        } catch (e) {
          status.errors.push(`longshot ${lg.key}: ${String(e).slice(0, 60)}`);
        }
        if (!lg.late(period, clockS)) continue;
        L.late++;
        const wpH = await winProb(lg, ev, comp);
        let mk: any[] = [];
        try { mk = await markets(lg.series); } catch (e) { status.errors.push(`${lg.series}: ${String(e).slice(0, 60)}`); }
        const mH = findMarket(mk, home.team, away.team), mA = findMarket(mk, away.team, home.team);
        if (mH || mA) L.matched++;
        const sides = [
          { c: home, o: away, m: mH, om: mA, wp: wpH },
          { c: away, o: home, m: mA, om: mH, wp: wpH == null ? null : 1 - wpH },
        ];
        // the favorite's cheapest way in: YES on its market or NO on the other team's market
        const pick = sides.map((s) => {
          const yes = num(s.m?.yes_ask_dollars), noOther = num(s.om?.no_ask_dollars);
          const opts = [[yes, s.m?.ticker], [noOther, s.om?.ticker ? `${s.om.ticker} (NO)` : null]].filter(([a, t]) => Number.isFinite(a as number) && (a as number) > 0.01 && t) as [number, string][];
          opts.sort((a, b) => a[0] - b[0]);
          return { ...s, ask: opts[0]?.[0] ?? NaN, ticker: opts[0]?.[1] ?? "" };
        });
        const fav = pick.find((s) => Number.isFinite(s.ask) && (s.wp != null ? s.wp > 0.5 || (s.wp === 0.5 && s.ask >= 0.5) : s.ask >= 0.5)) || null;
        const team = fav ? String(fav.c.team?.shortDisplayName || fav.c.team?.abbreviation) : "";
        const margin = fav ? Number(fav.c.score) - Number(fav.o.score) : 0;
        status.watching.push({ league: lg.key, game, period, clock, fav: team || null, wp: fav?.wp != null ? r2(fav.wp) : null, ask: fav && Number.isFinite(fav.ask) ? fav.ask : null, ticker: fav?.ticker || null, matched: !!(mH || mA) });
        if (!fav) continue;
        // LOOK (every ~3 min of a late game)
        if (!st.lookAt[gameId] || Date.now() - st.lookAt[gameId] > 170000) {
          st.lookAt[gameId] = Date.now();
          st.looks.unshift({ at: new Date().toISOString(), league: lg.key, gameId, game, team, ask: fav.ask, wp: fav.wp != null ? r2(fav.wp) : null, period, clock, margin, result: "open" });
        }
        if (fav.wp == null) continue;
        // Sanity: model and market 35+ points apart late in a game is almost always a data mix-up, not an edge. Watch only.
        if (Math.abs(fav.wp - fav.ask) > 0.35) { status.watching[status.watching.length - 1].check = "model and price 35+ pts apart: watching, not trading"; continue; }
        const ask = fav.ask, wp = fav.wp, perC = 0.07 * (1 - ask);
        const book = (lane: "edge" | "favorite") => {
          const id = `${gameId}:${lane}`;
          if (st.trades.some((t) => t.id === id)) return;
          st.trades.unshift({ id, lane, at: new Date().toISOString(), league: lg.key, gameId, game, team, ticker: fav.ticker, ask: r2(ask), wp: r2(wp), period, clock, margin, stake: STAKE, fee: feeTot(ask, STAKE), result: "open", pnl: null });
        };
        if (ask > 0.02 && ask <= 0.83 && (ask <= 0.8 || wp >= 0.92) && wp >= 0.75 && wp - ask - perC * ask >= 0.05) book("edge");
        if (wp >= 0.8 && ask >= 0.6 && ask <= 0.83) book("favorite");
      }
    }
    // drop look timers for games long gone
    for (const k of Object.keys(st.lookAt)) if (Date.now() - st.lookAt[k] > 86400000) delete st.lookAt[k];
    write(st);
    // knowledge base
    const done = st.trades.filter((t) => t.result === "win" || t.result === "loss");
    const lane = (l: string) => { const x = done.filter((t) => t.lane === l); return { n: x.length, w: x.filter((t) => t.result === "win").length, pnl: r2(x.reduce((a, t) => a + (t.pnl || 0), 0)), open: st.trades.filter((t) => t.lane === l && t.result === "open").length }; };
    const band = (a: number) => (a < 0.6 ? "under 60c" : a < 0.7 ? "60-69c" : a < 0.8 ? "70-79c" : a < 0.84 ? "80-83c (1.2x)" : a < 0.9 ? "84-89c (1.12-1.19x)" : a < 0.95 ? "90-94c (1.06-1.11x)" : "95c+ (1.05x or less)");
    const looksDone = st.looks.filter((k) => k.result !== "open");
    const cal: Record<string, { n: number; w: number; avgAsk: number; hit: number }> = {};
    for (const k of looksDone) { const b = band(k.ask); const x = (cal[b] ||= { n: 0, w: 0, avgAsk: 0, hit: 0 }); x.avgAsk = (x.avgAsk * x.n + k.ask) / (x.n + 1); x.n++; if (k.result === "win") x.w++; }
    for (const x of Object.values(cal)) { x.avgAsk = r2(x.avgAsk); x.hit = x.n ? r2(x.w / x.n) : 0; }
    const byLeague: Record<string, { n: number; w: number; pnl: number }> = {};
    for (const t of done) { const x = (byLeague[t.league] ||= { n: 0, w: 0, pnl: 0 }); x.n++; if (t.result === "win") x.w++; x.pnl = r2(x.pnl + (t.pnl || 0)); }
    // LONGSHOT scoring: per book, each exit rule. A take-profit that never hit falls back to holding to the final.
    const shotsDone = st.shots.filter((t) => t.result === "win" || t.result === "loss");
    const longshot: Record<string, any> = {};
    for (const bk of ["3Q+ LEFT", "2-3Q LEFT", "1-2Q LEFT"]) {
      const x = shotsDone.filter((t) => t.book === bk);
      const ways: Record<string, { pnl: number; hits: number }> = { hold: { pnl: r2(x.reduce((a, t) => a + (t.pnl || 0), 0)), hits: x.filter((t) => t.result === "win").length } };
      for (const k of Object.keys(TP_LEVELS)) ways[k] = { pnl: r2(x.reduce((a, t) => a + (t.tp[k] ? t.tp[k]!.pnl : t.pnl || 0), 0)), hits: x.filter((t) => t.tp[k]).length };
      longshot[bk] = { n: x.length, won: x.filter((t) => t.result === "win").length, open: st.shots.filter((t) => t.book === bk && t.result === "open").length, ways };
    }
    writeFileSync(D("closer-summary.json"), JSON.stringify({ at: new Date().toISOString(), edge: lane("edge"), favorite: lane("favorite"), byLeague, calibration: cal, looks: st.looks.length, looksSettled: looksDone.length, longshot }, null, 1));
  } catch (e) {
    status.errors.push(String(e).slice(0, 200));
  } finally {
    try { writeFileSync(D("closer-status.json"), JSON.stringify(status, null, 1)); } catch {}
    g.__clBusy = false;
  }
}
export function closer() {
  const rd = (f: string, d: any) => { try { return existsSync(D(f)) ? JSON.parse(readFileSync(D(f), "utf8")) : d; } catch { return d; } };
  const st = read();
  return { status: rd("closer-status.json", null), summary: rd("closer-summary.json", null), recent: st.trades.slice(0, 15), shots: st.shots.slice(0, 15) };
}
