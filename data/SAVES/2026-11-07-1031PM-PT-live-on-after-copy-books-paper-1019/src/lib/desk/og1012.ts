// OG ORIGINAL · 10.12 (fix686, Love Nov 5 2026 ~1:00 AM PT: "for 10.12 put her on her own paper card never to be touched pls").
// PAPER ONLY - this file never sends an order. Her Oct 12 OG + PIVOT 5M lane (ogp5), the code that went 27-2 on Oct 12 6:31-10:15 PM PT,
// running side by side on today's prices. SEALED: every block between the FROZEN markers is copied byte for byte from the vault
// (data/vault-og-oct12, git branch 10.12) and checked on every tick - the vault files against their sha256, and this file's frozen
// blocks against the vault text. Any difference = the card stops trading and says why. Store: data/og-1012.json (its own; no other book reads it).
// The only parts written new are the plumbing around the frozen blocks: today's snapshot in, her chart's 1m bars (read every 55 s like
// Oct 12's bars1m, never an extra TradingView read), Kalshi's public market read for the settle, and the card's summary.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchMarket } from "./kalshi";

const STAKE = 20;
const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const fee = (n: number, p: number) => Math.ceil(0.07 * n * p * (1 - p) * 100) / 100;
const VAULT_ENTRY = "data/vault-og-oct12/top-level-oct11-13/pivotbooks.ts.pre-flush", VAULT_ENTRY_SHA = "071c4c64373635878b5ccc3c9f5444d2b338e26b30699ff6d297380686beed4f";
const VAULT_EXIT = "data/vault-og-oct12/bak-oct12-combofix/grokog.ts.bak-0242", VAULT_EXIT_SHA = "c1b45fdcbc5c0ab99e84ff39e37a5b61eaa4610a77c40750ebb70e0924d9b735";
const FILE = () => D("og-1012.json");
const read = (): any[] => { try { return existsSync(FILE()) ? JSON.parse(readFileSync(FILE(), "utf8")) : []; } catch { return []; } };
const write = (rows: any[]) => { if (rows.length > 8000) { try { appendFileSync(D("og-1012-archive.jsonl"), rows.slice(8000).map((r) => JSON.stringify(r)).join("\n") + "\n"); } catch {} } writeFileSync(FILE() + ".tmp", JSON.stringify(rows.slice(0, 8000))); renameSync(FILE() + ".tmp", FILE()); };
const g = {} as { __grokSettleAt?: number }; // this card's own settle clock (never the live books' globals)
const kget = async (p: string) => { const mk = await fetchMarket(String(p).split("/").pop() || ""); return { market: { result: mk?.result } }; }; // Kalshi's public market read, shaped like Oct 12's kget
type Row = any; // Oct 12 grokog.ts rows (the frozen settle block names this type)
const S = globalThis as unknown as { __og1012?: { busy?: boolean; bars?: Record<string, { at: number; bars: Bar[] }>; seal?: { at: number; ok: boolean; why: string } }; __pivBars?: Record<string, { at: number; bars: Bar[] }> };

// ===== FROZEN 10.12 - data/vault-og-oct12/top-level-oct11-13/pivotbooks.ts.pre-flush lines 25-26 =====
type Bar = { t: number; o: number; h: number; l: number; c: number };
type Piv = { pp: number; r1: number; s1: number; r2: number; s2: number; a: number };
// ===== FROZEN 10.12 - data/vault-og-oct12/top-level-oct11-13/pivotbooks.ts.pre-flush lines 30-85 =====
export function resample(b: Bar[], mins: number): Bar[] {
  const out: Bar[] = [];
  const span = mins * 60;
  for (const x of b) {
    const k = Math.floor(x.t / span) * span;
    const last = out[out.length - 1];
    if (last && last.t === k) { last.h = Math.max(last.h, x.h); last.l = Math.min(last.l, x.l); last.c = x.c; }
    else out.push({ t: k, o: x.o, h: x.h, l: x.l, c: x.c });
  }
  return out;
}
export function pivot(bars: Bar[], mins: number): Piv | null {
  const now = Date.now() / 1000;
  const closed = bars.filter((x) => x.t + mins * 60 <= now + 1);
  if (closed.length < 10) return null;
  const k = 2 / 8;
  let ema = 0;
  const rng: number[] = [];
  closed.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * k + ema * (1 - k); rng.push(x.h - x.l); });
  const a = rng.slice(-7).reduce((s, v) => s + v, 0) / 7;
  return { pp: ema, r1: ema + a, s1: ema - a, r2: ema + 2 * a, s2: ema - 2 * a, a };
}
type Line = { name: string; price: number; unit: number; center?: boolean };
export function lines(p: Piv, tf: number): Line[] {
  const u = p.a;
  return [{ name: `${tf}m PP`, price: p.pp, unit: u, center: true }, { name: `${tf}m R1`, price: p.r1, unit: u }, { name: `${tf}m S1`, price: p.s1, unit: u }, { name: `${tf}m R2`, price: p.r2, unit: u }, { name: `${tf}m S2`, price: p.s2, unit: u }];
}
export function sessionLines(a: any): Line[] {
  const f = a?.vwap1m?.vwap ? a.vwap1m : a?.vwap5m;
  const v = Number(f?.vwap) || 0, sd = Number(f?.stdev) || 0;
  if (!(v > 0 && sd > 0)) return [];
  const out: Line[] = [{ name: "session VWAP", price: v, unit: sd, center: true }];
  for (const s of [0.5, 1, 1.5, 2, 2.5, 3]) out.push({ name: `+${s}σ`, price: v + s * sd, unit: sd }, { name: `-${s}σ`, price: v - s * sd, unit: sd });
  return out;
}
export function decide(L: Line[], a: any, last1m: Bar | undefined): { side: "up" | "down"; label: string } | null {
  const spot = Number(a?.spot) || 0, target = Number(a?.target) || 0;
  if (!(spot > 0 && target > 0) || !L.length) return null;
  const looks: { side: "up" | "down"; label: string }[] = [];
  if (last1m) for (const l of L) {
    if (last1m.o > l.price && last1m.c < l.price) { looks.push({ side: "down", label: `Close below ${l.name}` }); break; }
    if (last1m.o < l.price && last1m.c > l.price) { looks.push({ side: "up", label: `Close above ${l.name}` }); break; }
  }
  let best: Line | null = null, gap = Infinity;
  for (const l of L) { const d = Math.abs(spot - l.price); if (d <= 0.35 * l.unit && d < gap) { best = l; gap = d; } }
  if (best) looks.push({ side: spot >= best.price ? "up" : "down", label: `On ${best.name}` });
  for (const look of looks) {
    const lo = Math.min(spot, target), hi = Math.max(spot, target);
    const wall = L.some((l) => Math.abs(spot - l.price) > 0.2 * l.unit && l.price > lo && l.price < hi);
    if (wall) continue;
    const wrong = L.filter((l) => l.center).some((c) => (look.side === "up" ? c.price > spot && c.price > target : c.price < spot && c.price < target));
    if (wrong) continue;
    return look;
  }
  return null;
}
// ===== END FROZEN =====

const sha = (p: string) => createHash("sha256").update(readFileSync(join(process.cwd(), p))).digest("hex");
export function seal1012(): { ok: boolean; why: string } {
  const c = (S.__og1012 ||= {});
  if (c.seal && Date.now() - c.seal.at < 60000) return c.seal;
  let ok = false, why = "";
  try {
    if (sha(VAULT_ENTRY) !== VAULT_ENTRY_SHA) why = "the vault's Oct 12 pivotbooks.ts changed";
    else if (sha(VAULT_EXIT) !== VAULT_EXIT_SHA) why = "the vault's Oct 12 grokog.ts changed";
    else {
      const me = readFileSync(join(process.cwd(), "src/lib/desk/og1012.ts"), "utf8"), ve = readFileSync(join(process.cwd(), VAULT_ENTRY), "utf8").split("\n"), vx = readFileSync(join(process.cwd(), VAULT_EXIT), "utf8").split("\n");
      const blocks = [ve.slice(24, 26), ve.slice(29, 85), ve.slice(186, 198), vx.slice(72, 78), vx.slice(94, 136), vx.slice(137, 180)].map((x) => x.join("\n"));
      const miss = blocks.findIndex((b) => !me.includes(b));
      if (miss >= 0) why = `frozen block ${miss + 1} no longer matches the vault`; else ok = true;
    }
  } catch (e) { why = "the seal could not be read: " + String(e).slice(0, 80); }
  c.seal = { at: Date.now(), ok, why };
  return c.seal;
}
function bars1012(id: string): Bar[] { // her chart's 1m candles, taken at most every 55 s like Oct 12's bars1m (no extra TradingView read)
  const c = ((S.__og1012 ||= {}).bars ||= {});
  if (c[id] && Date.now() - c[id].at < 55000) return c[id].bars;
  const src = S.__pivBars?.[id]?.bars;
  if (Array.isArray(src) && src.length) c[id] = { at: Date.now(), bars: src.map((x: any) => ({ t: Number(x.t), o: Number(x.o), h: Number(x.h), l: Number(x.l), c: Number(x.c) })).sort((x, y) => x.t - y.t).slice(-900) };
  return c[id]?.bars ?? [];
}
export async function og1012Tick(assets: Record<string, any> | null | undefined) {
  const c = (S.__og1012 ||= {});
  if (!assets || c.busy) return;
  if (!seal1012().ok) return;
  c.busy = true;
  try {
    let rows = read();
    let changed = false;
    for (const id of ["btc", "gold"]) {
      const a = assets[id];
      const m = a?.market;
      const left = Number(a?.secondsLeft) || 0;
      if (!m?.ticker || !(left >= 120)) continue;
      const b = bars1012(id);
      if (b.length < 60) continue;
      const now = Date.now() / 1000;
      const last1m = b.filter((x) => x.t + 60 <= now + 1).pop();
      const sess = sessionLines(a);
      const tf = 5;
      const p = pivot(resample(b, tf), tf);
      if (!p) continue;
      for (const [lane, L] of [[`ogp${tf}`, [...sess, ...lines(p, tf)]]] as [string, Line[]][]) {
// ===== FROZEN 10.12 - data/vault-og-oct12/top-level-oct11-13/pivotbooks.ts.pre-flush lines 187-198 =====
          if (rows.some((r) => r.ticker === m.ticker && r.lane === lane)) continue;
          const look = decide(L, a, last1m);
          if (!look) continue;
          const ask = Number(look.side === "up" ? m.yesAsk : m.noAsk);
          // 1.18x-5x (Oct 11: a 25x short with 2 min left on the strike is a lottery ticket, not her tap-at-4x).
          // OG + PIVOT lanes keep the OG's own rule: 1.18x and up, no cap.
          const og = lane.startsWith("ogp");
          // 1.38x floor on every pivot / OG lane (Love, Oct 11 ~5:30 AM PT: "keep the 1.38x floor, not 1.18").
          if (!((og ? ask > 0.02 : ask >= 0.2) && ask < 0.98) || !(1 / ask >= 1.38)) continue;
          const n = STAKE / ask;
          rows.unshift({ id: `${m.ticker}:${lane}`, lane, at: new Date().toISOString(), asset: id, ticker: m.ticker, side: look.side, label: look.label, ask: r2(ask), multiple: r2(1 / ask), secondsLeft: Math.round(left), intoWindow: Math.round(900 - left), stake: STAKE, fee: fee(n, ask), peak: ask, lastBid: 0, result: "open", exit: null, pnl: null });
          changed = true;
// ===== END FROZEN =====
      }
    }
    for (const r of rows) {
      if (r.result !== "open") continue;
// ===== FROZEN 10.12 - data/vault-og-oct12/bak-oct12-combofix/grokog.ts.bak-0242 lines 73-78 =====
    const m = assets?.[r.asset]?.market;
    if (m?.ticker !== r.ticker) continue;
    const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
    if (!(bid > 0)) continue;
    r.lastBid = bid;
    if (bid > r.peak) r.peak = bid;
// ===== FROZEN 10.12 - data/vault-og-oct12/bak-oct12-combofix/grokog.ts.bak-0242 lines 95-136 =====
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
// ===== END FROZEN =====
    }
// ===== FROZEN 10.12 - data/vault-og-oct12/bak-oct12-combofix/grokog.ts.bak-0242 lines 138-180 =====
  // settle finished windows from Kalshi's own result. Every 15 s now (Love, Oct 11 ~8:05 PM PT: "it lagged from the last window,
  // can you tighten that up so i don't think it's in one on paper when it's not"): it used to be once a minute plus Kalshi's own
  // delay, so a finished window could still read OPEN 3-4 minutes into the next one. If Kalshi hasn't posted the result yet but
  // the window is over and its last bid was decided (90c+ or 10c-), it settles on that right away (marked provisional) and is
  // re-checked against Kalshi's result on the next passes.
  if (!g.__grokSettleAt || Date.now() - g.__grokSettleAt > 15000) {
    g.__grokSettleAt = Date.now();
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
      try {
        const j = await kget(`/trade-api/v2/markets/${r.ticker}`);
        res = j?.market?.result;
      } catch {
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
// ===== END FROZEN =====
    if (changed) write(rows);
  } finally {
    c.busy = false;
  }
}
export function og1012Summary() {
  const rows = read(), seal = seal1012();
  const done = rows.filter((r) => r.result !== "open" && r.pnl != null);
  const w = done.filter((r) => Number(r.pnl) > 0.05).length;
  return { sealed: seal.ok, why: seal.why, n: rows.length, open: rows.filter((r) => r.result === "open").length, w, l: done.length - w, pnl: r2(done.reduce((s, r) => s + Number(r.pnl), 0)),
    recent: rows.slice(0, 25).map((r) => ({ at: r.at, asset: r.asset, side: r.side, label: r.label, ask: r.ask, result: r.result, pnl: r.pnl, exit: r.exit })) };
}
