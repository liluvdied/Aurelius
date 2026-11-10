// POSITIONS (Claude, Oct 9 ~9 AM PT, Love: "kalshi doesn't have an autosell feature for the combos... i want to set up an
// autosell terminal in here, let's make a POSITIONS tab where we can do everything there... for all positions held on
// kalshi... it doesn't notify you or anything when it's green so you literally have to watch it 24/7").
// Every open Kalshi position (any market), its live value and P&L, and HER autosell rules:
//   sell when the held side's bid reaches a % gain on cost, or a price (e.g. 50c). Checked every ~20 s by the desk;
//   when it hits, the desk sells the whole position (the same close the SELL button uses) and posts an alert.
//   It also posts a one-time alert the first time a position turns green.
// Rules live in data/autosell-rules.json. Nothing sells unless she set a rule (or pressed SELL).
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "https://external-api.kalshi.com/trade-api/v2";
const RULES = () => join(process.cwd(), "data", "autosell-rules.json");
export type Rule = { mode: "pct" | "price"; value: number; at: string; done?: { at: string; why: string } | null };
export type PosRow = { updated?: string | null; ticker: string; title: string; side: "yes" | "no"; qty: number; cost: number; entry: number; bid: number; ask: number; value: number; pnl: number; pct: number; closes: string; status: string; rule: Rule | null };
const g = globalThis as unknown as { __posAt?: number; __posBusy?: boolean; __posCache?: { at: number; rows: PosRow[] }; __posGreen?: Record<string, boolean>; __posMk?: Record<string, { at: number; m: any }> };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function readRules(): Record<string, Rule> {
  try {
    return existsSync(RULES()) ? JSON.parse(readFileSync(RULES(), "utf8")) : {};
  } catch {
    return {};
  }
}
function writeRules(r: Record<string, Rule>) {
  writeFileSync(RULES(), JSON.stringify(r, null, 1));
}
export function ruleDone(ticker: string, why: string) {
  const r = readRules();
  if (r[ticker] && !r[ticker].done) { r[ticker].done = { at: new Date().toISOString(), why }; writeRules(r); }
}
function alarm(text: string) {
  try {
    const af = join(process.cwd(), "data", "alarm.json");
    let rows: unknown[] = [];
    try {
      const prev = JSON.parse(readFileSync(af, "utf8"));
      if (Array.isArray(prev)) rows = prev;
    } catch {
    }
    rows.unshift({ at: new Date().toISOString(), text });
    writeFileSync(af, JSON.stringify(rows.slice(0, 20)));
    appendFileSync(join(process.cwd(), "data", "positions-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), text }) + "\n");
  } catch {
  }
}
async function market(ticker: string): Promise<any> {
  const c = (g.__posMk ||= {});
  if (c[ticker] && Date.now() - c[ticker].at < 18000) return c[ticker].m;
  const res = await fetch(`${ROOT}/markets/${encodeURIComponent(ticker)}`, { signal: AbortSignal.timeout(8000) });
  const m = res.ok ? (await res.json())?.market : null;
  c[ticker] = { at: Date.now(), m };
  return m;
}
const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

export async function listPositions(fresh = false): Promise<PosRow[]> {
  if (!fresh && g.__posCache && Date.now() - g.__posCache.at < 8000) return g.__posCache.rows;
  const live = await import("./kalshi-live.server");
  const held: { ticker: string; pos: number; cost: number; updated?: string | null }[] = await (live as any).allPositions();
  const rules = readRules();
  const rows: PosRow[] = [];
  for (const h of held) {
    let m: any = null;
    try {
      m = await market(h.ticker);
    } catch {
      m = null;
    }
    const side: "yes" | "no" = h.pos > 0 ? "yes" : "no";
    const qty = Math.abs(h.pos);
    const bid = side === "yes" ? num(m?.yes_bid_dollars) : num(m?.no_bid_dollars);
    const ask = side === "yes" ? num(m?.yes_ask_dollars) : num(m?.no_ask_dollars);
    const entry = qty > 0 ? h.cost / qty : 0;
    const value = r2(qty * bid);
    const title = [m?.title, m?.yes_sub_title || m?.subtitle].filter(Boolean).join(" · ") || h.ticker;
    rows.push({ ticker: h.ticker, title, side, qty: r2(qty), cost: r2(h.cost), entry: r2(entry), bid, ask, value, pnl: r2(value - h.cost), pct: h.cost > 0 ? Math.round((value / h.cost - 1) * 100) : 0, closes: String(m?.close_time || ""), updated: h.updated || null, status: String(m?.status || ""), rule: rules[h.ticker] && !rules[h.ticker].done ? rules[h.ticker] : null });
  }
  // Oct 10 (Love: "have it be sorted by most recent positions... i'm trying to find stuff in here"): newest first, by the
  // last time a fill touched that market (data/kalshi-audit.json); markets with no recent fill go last, by close time.
  const last: Record<string, string> = {};
  try {
    const au = JSON.parse(readFileSync(join(process.cwd(), "data", "kalshi-audit.json"), "utf8"));
    const fills: any[] = Array.isArray(au) ? au : (Object.values(au).find((v) => Array.isArray(v)) as any[]) || [];
    for (const f of fills) if (f?.ticker && f?.t && (!last[f.ticker] || f.t > last[f.ticker])) last[f.ticker] = f.t;
  } catch {
  }
  for (const r of rows) (r as any).lastFill = last[r.ticker] || null;
  // Kalshi's own "last updated" per position comes first (it covers combos too); the last fill is the fallback.
  for (const r of rows) if (r.updated && (!last[r.ticker] || r.updated > last[r.ticker])) last[r.ticker] = r.updated;
  rows.sort((a, b) => {
    const la = last[a.ticker] || "", lb = last[b.ticker] || "";
    if (la || lb) return la === lb ? 0 : la > lb ? -1 : 1;
    return a.closes < b.closes ? -1 : 1;
  });
  g.__posCache = { at: Date.now(), rows };
  // snapshot for checks ("why did my balance drop?"): every refresh, atomically
  try {
    writeFileSync(join(process.cwd(), "data", "positions-now.json.tmp"), JSON.stringify({ at: new Date().toISOString(), rows }, null, 1));
    (await import("node:fs")).renameSync(join(process.cwd(), "data", "positions-now.json.tmp"), join(process.cwd(), "data", "positions-now.json"));
  } catch {
  }
  return rows;
}

export function setRule(ticker: string, rule: { mode: "pct" | "price"; value: number } | null) {
  const rules = readRules();
  if (!rule) delete rules[ticker];
  else rules[ticker] = { mode: rule.mode, value: rule.value, at: new Date().toISOString(), done: null };
  writeRules(rules);
  g.__posCache = undefined;
  return rules;
}

export async function sellNow(ticker: string, why: string) {
  const live = await import("./kalshi-live.server");
  // combos (KXMVE) have no order book: only her own tap cashes one out, through the RFQ quote (Oct 12, Love)
  if (/^KXMVE/.test(ticker)) {
    if (why !== "sold from the POSITIONS tab") return null;
    let est = 0, entry = 0;
    try { const cg = JSON.parse(readFileSync(join(process.cwd(), "data", "combo-guard.json"), "utf8")); const r = (cg.rows ?? []).find((x: any) => x.ticker === ticker); est = Number(r?.est) || 0; entry = Number(r?.entry) || 0; } catch {}
    const minPx = Math.max(entry, est * 0.9, 0.01);
    const res: any = await (live as any).rfqCashOut(ticker, minPx);
    alarm(`POSITIONS: combo cash out ${ticker}: ${res?.result ?? "no result"}.`);
    g.__posCache = undefined;
    return res?.quote && res?.after < res?.before ? Math.round((res.before - res.after) * res.quote.yb * 100) / 100 : null;
  }
  const cash = await (live as any).flattenTicker(ticker, true);
  alarm(`POSITIONS: sold ${ticker} (${why})${cash ? `, about $${Number(cash).toFixed(2)} back` : ""}.`);
  g.__posCache = undefined;
  return cash ?? null;
}

/** Every ~20 s from the desk loop: run her autosell rules and the "it's green" alert. */
export async function positionsTick() {
  if (g.__posBusy || (g.__posAt && Date.now() - g.__posAt < 20000)) return;
  const rules = readRules();
  const active = Object.entries(rules).filter(([, r]) => !r.done);
  g.__posAt = Date.now();
  g.__posBusy = true;
  try {
    const rows = await listPositions(true);
    const green = (g.__posGreen ||= {});
    for (const p of rows) {
      if (p.pnl > 0.01 && p.bid > 0 && !green[p.ticker]) {
        green[p.ticker] = true;
        alarm(`POSITIONS: ${p.title} (${p.side.toUpperCase()}) is GREEN: worth $${p.value.toFixed(2)} on $${p.cost.toFixed(2)} (${p.pct >= 0 ? "+" : ""}${p.pct}%).`);
      }
    }
    // FOLLOW PAPER OUT (Love, Oct 11 ~6:50 AM PT: "paper 24/7 is the original original... let's put her on that and winning
    // set ups only for the day"). PAPER's edge is her own exit (the hard take profit she banks early), so a live copy from
    // PAP247 / PAPWIN sells the moment its parent PAPER trade exits early. Key: ticker:book:parentId:paper-lane.
    try {
      const done = JSON.parse(readFileSync(join(process.cwd(), "data", "live-book-done.json"), "utf8"));
      const mine = Object.entries(done).filter(([k, v]: any) => /:(pap247|papwin|pap20):/.test(k) && v && ["filled", "partial"].includes(v.status));
      if (mine.length) {
        const pb = JSON.parse(readFileSync(join(process.cwd(), "data", "live-paper-book.json"), "utf8"))?.trades ?? [];
        const byId = new Map(pb.map((t: any) => [t.id, t]));
        const sold = ((g as any).__papFollow ||= {});
        for (const [k, v] of mine as any[]) {
          const parts = k.split(":");
          const parent: any = byId.get(parts[2]);
          const pos = rows.find((r) => r.ticker === v.ticker);
          if (!parent || !pos || sold[k] || parent.result === "open") continue;
          if (parent.result !== "exited" || Date.now() - Date.parse(parent.closedAt || 0) > 15 * 60 * 1000) continue;
          sold[k] = Date.now();
          await sellNow(v.ticker, `followed PAPER out: ${parent.notes || parent.result}`);
        }
      }
    } catch {
    }
    // REVERSAL GUARD for PAPER's live books (Love, Oct 11 ~8:35 AM PT: "keep the safeguard... for actual reversals, but take
    // the lock the win off"). LOCK THE WIN (+30% then back to +20%) is off for them (engine noLocksBooks); these two catch
    // the real reversals instead. Half at 75% and the trail from 90% still do the take-profits.
    //  1. WIDE LOCK: once the trade has been up +60%, it may not fall back under +30%. (A dip from +42% isn't a reversal.)
    //  2. LAST-MINUTE LOCK: 3:00 or less left, green but still under 90c (the market hasn't called it) = take the green.
    //     90c+ is decided and rides to the bell.
    // Lab, 41 BTC trades Oct 9-11 run through half-75 / trail-90: +$165 vs no guard (both halves of the sample positive);
    // the old LOCK THE WIN on the same trades: -$43. live-switch "reversalGuard" { on, arm, floor, lastSec, decided }.
    try {
      const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
      const rg = { on: true, arm: 60, floor: 30, lastSec: 180, decided: 0.9, ...(sw?.reversalGuard || {}) };
      const books: string[] = Array.isArray(sw?.noLocksBooks) ? sw.noLocksBooks : [];
      if (rg.on !== false && books.length) {
        const done = JSON.parse(readFileSync(join(process.cwd(), "data", "live-book-done.json"), "utf8"));
        const owned = new Set(Object.entries(done).filter(([k, v]: any) => v && ["filled", "partial"].includes(v.status) && books.includes(k.split(":")[1])).map(([, v]: any) => v.ticker));
        const pk = ((g as any).__rgPeak ||= {});
        const hit = ((g as any).__rgSold ||= {});
        for (const p of rows) {
          if (!owned.has(p.ticker) || hit[p.ticker] || !(p.bid > 0) || !(p.entry > 0) || !(p.qty > 0)) continue;
          const gain = (p.bid / p.entry - 1) * 100;
          pk[p.ticker] = Math.max(pk[p.ticker] ?? -100, gain);
          const left = (Date.parse(p.closes) - Date.now()) / 1000;
          let why = "";
          if (pk[p.ticker] >= rg.arm && gain <= rg.floor) why = `reversal guard: was up +${Math.round(pk[p.ticker])}%, back to +${Math.round(gain)}%`;
          else if (left > 8 && left <= rg.lastSec && p.bid > p.entry && p.bid < rg.decided) why = `last-minute lock: ${Math.round(left)}s left, green at ${Math.round(p.bid * 100)}c but not decided`;
          if (!why) continue;
          hit[p.ticker] = Date.now();
          await sellNow(p.ticker, why);
        }
      }
    } catch {
    }
    // TRAIL ON EVERYTHING (Love, Oct 10 ~1:40 AM PT: "can you place those on the climate ones and the hourly btc's and
    // everything?!"). The same take-profit the books use, on every position she holds by hand (any market: weather,
    // hourly BTC, mentions...). Book copies are skipped (they already follow their book's exits). Once the held side's
    // bid reaches 90% of the max (entry + 90% of the way to $1) it ARMS; from there it rides and sells the whole position
    // when the gain slips 1 point under its best, or the bid reaches 97c. data/trail-all.json { on } switches it.
    try {
      const cfg = existsSync(join(process.cwd(), "data", "trail-all.json")) ? JSON.parse(readFileSync(join(process.cwd(), "data", "trail-all.json"), "utf8")) : { on: true };
      if (cfg?.on !== false) {
        const done = JSON.parse(readFileSync(join(process.cwd(), "data", "live-book-done.json"), "utf8"));
        const copied = new Set(Object.entries(done).filter(([, v]: any) => v && ["filled", "partial", "resting"].includes(v.status)).map(([k]) => k.split(":")[0]));
        const st = (g as any).__trail ||= {};
        for (const p of rows) {
          if (copied.has(p.ticker) || !(p.bid > 0) || !(p.entry > 0) || p.entry >= 0.97) continue;
          // 15M ONLY (fix215, Oct 25 ~3:24 PM PT, Love: "my positions sold for less than they were supposed to on the hourly markets ... please turn those off and let me
          // set them here on my end"): the trail and the gate now guard only her 15-minute positions; every other market is hers, by her own autosell rules.
          if (!/15M/.test(p.ticker)) continue;
          const key = `${p.ticker}:${p.side}`;
          const arm = p.entry + 0.9 * (1 - p.entry);
          const pct = (p.bid / p.entry - 1) * 100;
          const t = (st[key] ||= { armed: false, peak: 0 });
          // GATE (Love, Oct 10 ~4:15 PM PT: "if it passes 40% of its max can you set a gate there that will catch it if it
          // does crash"; ~4:25 PM: "if we set the gate at the same number it may trigger immediately... 33%?... the best
          // configuration to not give up a win hoping for more... for everything at every multiple"). ARMS when the bid has
          // climbed 40% of the way from her entry to $1; the FLOOR is then 33% of that way, and it RATCHETS: it never sits
          // below 70% of the best gain seen. Bid back at the floor = the whole position sells. Always above what she paid.
          // From 90% of the max the 1-point trail below takes over. Every hand position, every market, every multiple.
          const armOf = Number(cfg?.gateArm ?? 0.4), floorOf = Number(cfg?.gateFloor ?? 0.33), keep = Number(cfg?.keepOfPeak ?? 0.7);
          const room = 1 - p.entry;
          // Oct 10 ~4:30 PM (Love: "not the actual 15m positions... just those kind of contracts"): the gate skips the
          // 15-minute BTC/gold markets; climate, combos, hourly and everything else get it. (The 90% trail stays on all.)
          const no15 = /15M/.test(p.ticker);
          if (armOf > 0 && !no15 && !t.gate && p.bid >= p.entry + armOf * room) {
            t.gate = true;
            alarm(`POSITIONS: ${p.title} (${p.side.toUpperCase()}) passed 40% of its max at ${Math.round(p.bid * 100)}c: the gate is guarding the win (floor ${Math.round((p.entry + floorOf * room) * 100)}c and rising with it).`);
          }
          if (t.gate) t.peakBid = Math.max(t.peakBid || 0, p.bid);
          if (t.gate && !t.armed) {
            const floor = p.entry + Math.max(floorOf * room, keep * ((t.peakBid || p.bid) - p.entry));
            if (p.bid <= floor) {
              const why = `gate: armed at 40% of the max, best ${Math.round((t.peakBid || 0) * 100)}c, sold at ${Math.round(p.bid * 100)}c (floor ${Math.round(floor * 100)}c, paid ${Math.round(p.entry * 100)}c)`;
              delete st[key];
              await sellNow(p.ticker, why);
              continue;
            }
          }
          if (!t.armed && p.bid >= arm) {
            t.armed = true;
            alarm(`POSITIONS: ${p.title} (${p.side.toUpperCase()}) reached 90% of its max at ${Math.round(p.bid * 100)}c: the trail is riding it now.`);
          }
          if (!t.armed) continue;
          t.peak = Math.max(t.peak, pct);
          const floor = Math.max((arm / p.entry - 1) * 100, Math.floor(t.peak) - 1);
          if (p.bid >= 0.97 || pct < floor) {
            const why = `trail: armed at ${Math.round(arm * 100)}c (90% of the max), peaked +${Math.round(t.peak)}%, sold at ${Math.round(p.bid * 100)}c`;
            delete st[key];
            await sellNow(p.ticker, why);
          }
        }
      }
    } catch {
    }
    // GOLD CUT-OUT (Love, Oct 10 ~9:40 PM PT: "let's do $2.50"). Lab on 255 real Kalshi gold windows, Oct 5-9 (actual
    // -$285): cashing out whatever is left once gold is $2.50 past the target on the WRONG side came to +$329 vs what
    // happened (green every day; $3 +$275, $1.50 +$459 but cuts far more trades). Every gold 15-minute position, book
    // copies and hand trades alike: gold spot $2.50+ beyond the strike against the position, and a bid of 1c or more left
    // = sell the whole position at the bid. BTC is untouched. data/gold-cut.json { on, dollars } switches/tunes it.
    try {
      const gf = join(process.cwd(), "data", "gold-cut.json");
      const gc = existsSync(gf) ? JSON.parse(readFileSync(gf, "utf8")) : { on: true, dollars: 2.5 };
      const X = Number(gc?.dollars) || 2.5;
      const bn = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"));
      const spot = Number(bn?.gold?.spot);
      const fresh = Date.now() - Date.parse(bn?.at || 0) < 60000;
      if (gc?.on !== false && spot > 0 && fresh) {
        const ks = ((g as any).__goldK ||= {}) as Record<string, number>;
        for (const p of rows) {
          if (!/^KXGOLD15M-/.test(p.ticker) || !(p.qty > 0.01) || !(p.bid >= 0.01)) continue;
          if (!(ks[p.ticker] > 0)) {
            const m = await market(p.ticker).catch(() => null);
            const k = num(m?.floor_strike);
            if (!(k > 0)) continue;
            ks[p.ticker] = k;
          }
          const K = ks[p.ticker];
          const against = p.side === "yes" ? K - spot : spot - K;
          if (against >= X) {
            const why = `gold cut-out: gold ${spot.toFixed(2)} is $${against.toFixed(2)} past the target ${K.toFixed(2)} against the ${p.side === "yes" ? "long" : "short"}; cashed out at ${Math.round(p.bid * 100)}c (paid ${Math.round(p.entry * 100)}c)`;
            alarm(`POSITIONS: ${why}`);
            await sellNow(p.ticker, why);
          }
        }
      }
    } catch {
    }
    if (!active.length) return;
    let changed = false;
    for (const [ticker, r] of active) {
      const p = rows.find((x) => x.ticker === ticker);
      if (!p) {
        r.done = { at: new Date().toISOString(), why: "position closed or settled" };
        changed = true;
        continue;
      }
      if (!(p.bid > 0)) continue;
      const hit = r.mode === "pct" ? p.cost > 0 && (p.value / p.cost - 1) * 100 >= r.value : p.bid >= r.value;
      if (!hit) continue;
      const why = r.mode === "pct" ? `autosell at +${r.value}%: bid ${Math.round(p.bid * 100)}c = ${p.pct >= 0 ? "+" : ""}${p.pct}%` : `autosell at ${Math.round(r.value * 100)}c: bid ${Math.round(p.bid * 100)}c`;
      r.done = { at: new Date().toISOString(), why };
      changed = true;
      writeRules(rules);
      await sellNow(ticker, why);
    }
    if (changed) writeRules(rules);
  } catch {
  } finally {
    g.__posBusy = false;
  }
}
