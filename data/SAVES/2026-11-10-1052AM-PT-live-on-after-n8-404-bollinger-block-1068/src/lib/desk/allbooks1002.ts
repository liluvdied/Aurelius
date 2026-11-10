// fix1002 ALL BOOKS IN THE TABLES (Love Nov 7 2026 8:37 PM PT: "can you put all of these books and ledgers into the running iOi table && running tables for me bb?"): display only.
// One row per current book / ledger - LIVE / PAPER / OFF, KALSHI / POLY - with today's (Pacific day) trades, wins, losses and $ read from that book's OWN log / state file.
// A book whose ledger file is not on the desk yet (not installed) has no row; its row appears by itself the first time its file exists. Reads files only: never sends,
// cancels or changes an order, never writes a file, never touches a switch, a wall or a live book.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export type Row1002 = { key: string; name: string; status: "LIVE" | "PAPER" | "OFF"; venue: "KALSHI" | "POLY"; file: string; n: number; w: number; l: number; open: number; pnl: number; real?: { n: number; w: number; l: number; pnl: number } | null; note: string; last: string };
type Book1002 = { key: string; name: string; venue: "KALSHI" | "POLY"; file: string; kind: "recon" | "kledger" | "pmom" | "p5m" | "paper" | "five" | "shadow"; lane?: string; split?: string; status: (sw: any) => Row1002["status"]; note?: string };

// fix1002: every book / ledger she has today, in her order. Books whose files are not on the desk yet are listed too - they stay hidden until their file exists.
const cfgOf = (f: string): any => { try { return JSON.parse(readFileSync(D(f), "utf8")) || {}; } catch { return {}; } };
const onLive = (c: any): Row1002["status"] => (c?.on === true ? (c?.live === false ? "PAPER" : "LIVE") : "OFF");
const inLine = (book: string) => (sw: any): Row1002["status"] => ((Array.isArray(sw?.liveBook?.books) ? sw.liveBook.books : []).includes(book) ? "LIVE" : "PAPER");
export const BOOKS1002: Book1002[] = [
  { key: "recon-tog", name: "MAIN 💞", venue: "KALSHI", file: "grok-og.json", kind: "recon", lane: "recon-tog", status: inLine("recon-tog") },
  { key: "recon-rej", name: "REJ", venue: "KALSHI", file: "grok-og.json", kind: "recon", lane: "recon-rej", status: inLine("recon-rej") },
  { key: "recon-dly", name: "DELAYED ⏳", venue: "KALSHI", file: "grok-og.json", kind: "recon", lane: "recon-dly", status: inLine("recon-dly") },
  { key: "recon-rjnp", name: "REJ · NO PINK", venue: "KALSHI", file: "grok-og.json", kind: "recon", lane: "recon-rjnp", status: inLine("recon-rjnp") },
  { key: "recon-togp", name: "MAIN · NO PINK", venue: "KALSHI", file: "grok-og.json", kind: "recon", lane: "recon-togp", status: inLine("recon-togp") },
  { key: "recon-rnp", name: "PURE NO PINK", venue: "KALSHI", file: "grok-og.json", kind: "recon", lane: "recon-rnp", status: inLine("recon-rnp") },
  { key: "xrpk972", name: "XRP · MAIN (KALSHI)", venue: "KALSHI", file: "xrpk-972.jsonl", kind: "kledger", status: () => onLive(cfgOf("xrpk-972-cfg.json")) },
  { key: "xrprej976", name: "XRP · REJ", venue: "KALSHI", file: "xrprej-976.json", kind: "paper", status: () => "PAPER" },
  { key: "eth2872", name: "ETH.2", venue: "KALSHI", file: "eth2-live-872.jsonl", kind: "kledger", status: (sw) => (sw?.ethLive872?.on === true ? "LIVE" : "OFF") },
  { key: "eth831", name: "ETH.1 · REJ NO PINK", venue: "KALSHI", file: "eth-live-831.jsonl", kind: "kledger", status: (sw) => (sw?.ethLive831?.on === true ? "LIVE" : "OFF") },
  { key: "btc2c899", name: "BTC.2 · PINK + THIRDS", venue: "KALSHI", file: "btc2c-live-899.jsonl", kind: "kledger", status: (sw) => (sw?.btcLive899?.on === true ? "LIVE" : "OFF") },
  { key: "bnb940", name: "BNB · MOMENTUM", venue: "KALSHI", file: "bnb-live-940.jsonl", kind: "kledger", status: (sw) => (sw?.bnbLive940?.on === true ? "LIVE" : "OFF") },
  { key: "mombnb833", name: "BNB · MOMENTUM", venue: "KALSHI", file: "mom-coins-833.json", kind: "paper", split: "mombnb833", status: () => "PAPER" },
  { key: "polymom830", name: "BTC · MOMENTUM", venue: "POLY", file: "poly-mom-830.jsonl", kind: "pmom", status: (sw) => (sw?.polyMom830?.on === true ? "LIVE" : "OFF"), note: "bell read off Kalshi's same window" },
  { key: "xrp5m961", name: "XRP · 5M", venue: "POLY", file: "xrp5m-961.jsonl", kind: "p5m", status: () => onLive(cfgOf("xrp5m-961-cfg.json")) },
  { key: "btc5m1055", name: "BTC · 5M LIVE", venue: "POLY", file: "btc5m-1055.jsonl", kind: "p5m", status: () => onLive({ on: cfgOf("btc5m-1055-cfg.json").on !== false }) }, // fix1055
  { key: "eth5m1055", name: "ETH · 5M LIVE", venue: "POLY", file: "eth5m-1055.jsonl", kind: "p5m", status: () => onLive({ on: cfgOf("eth5m-1055-cfg.json").on !== false }) }, // fix1055
  { key: "btc5m974", name: "BTC · 5M", venue: "POLY", file: "btc5m-974.jsonl", kind: "p5m", status: () => onLive(cfgOf("btc5m-974-cfg.json")) },
  { key: "eth5m975", name: "ETH · 5M", venue: "POLY", file: "eth5m-975.jsonl", kind: "p5m", status: () => onLive(cfgOf("eth5m-975-cfg.json")) },
  { key: "old5m", name: "OLD 5M LANE", venue: "POLY", file: "five-book.json", kind: "five", status: (sw) => (sw?.polyTwin?.on === true && sw?.polyTwin?.rej5m?.on === true ? "LIVE" : "OFF") },
  { key: "p5m-btc", name: "BTC 5M · NEW BRAIN", venue: "POLY", file: "p5m-1045-btc.json", kind: "paper", status: () => "PAPER", note: "fix1045 - paper, never an order" },
  { key: "p5m-eth", name: "ETH 5M · NEW BRAIN", venue: "POLY", file: "p5m-1045-eth.json", kind: "paper", status: () => "PAPER", note: "fix1045 - paper, never an order" },
  { key: "p5m-xrp", name: "XRP 5M · NEW BRAIN", venue: "POLY", file: "p5m-1045-xrp.json", kind: "paper", status: () => "PAPER", note: "fix1045 - paper, never an order" },
  { key: "p5m-xrp15k", name: "XRP 15M · NEW BRAIN", venue: "KALSHI", file: "p5m-1045-xrp15k.json", kind: "paper", status: () => "PAPER", note: "fix1045 - her XRP brain on Kalshi 15m, paper, never an order" },
  { key: "perplexities1037", name: "PERPLEXITIES", venue: "POLY", file: "perplexities.jsonl", kind: "p5m", status: () => "PAPER", note: "Perplexity's XRP 5m twin (fix961 without rule C) - paper, never an order (fix1037)" },
  { key: "push983", name: "PUSH / WICK SHADOW", venue: "KALSHI", file: "push-shadow-983.jsonl", kind: "shadow", status: () => "PAPER", note: "a shadow test - resolved tickets, no money" },
];

const ptDay = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date(t));
const fmtT = (t: number) => (t ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }).format(new Date(t)) : "—");
const r2 = (x: number) => Math.round(x * 100) / 100;
function lines(f: string): any[] { const out: any[] = []; try { for (const l of readFileSync(D(f), "utf8").split("\n")) { if (!l.trim()) continue; try { out.push(JSON.parse(l)); } catch {} } } catch {} return out; }
function J(f: string): any { try { return JSON.parse(readFileSync(D(f), "utf8")); } catch { return null; } }
function score(pnls: number[]) { return { w: pnls.filter((p) => p > 0.05).length, l: pnls.filter((p) => p < -0.05).length, pnl: r2(pnls.reduce((s, p) => s + p, 0)) }; }

// fix1002: Kalshi's bell for each window (window-results + Kalshi's own settlements), and Kalshi's real fills - read only.
function bells(): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of ["kalshi-history.json", "kalshi-audit.json"]) { const h = J(f); for (const s of h?.settlements ?? []) if (s?.ticker && (s.result === "yes" || s.result === "no")) m.set(String(s.ticker), s.result); }
  const w = J("window-results.json"); if (w && typeof w === "object") for (const [k, v] of Object.entries(w)) if (!m.has(k) && (v === "yes" || v === "no")) m.set(k, v as string);
  return m;
}
function fills(): any[] {
  const m = new Map<string, any>();
  for (const f of ["kalshi-history.json", "kalshi-audit.json"]) { const h = J(f); for (const x of h?.fills ?? []) if (x?.ticker && x.t) m.set(`${String(x.t).slice(0, 19)}|${x.ticker}|${x.action}|${x.count}|${x.yes}|${String(x.order).slice(0, 13)}`, x); }
  return [...m.values()];
}

// fix1002: one Kalshi ledger (ETH.2, ETH.1, BTC.2, BNB, XRP Kalshi): entries and add-ons from its log; sells from the log's own payout, or - when the log
// has none - from Kalshi's real fills on that ticker in the minute before the log line (marked ≈); what is still held at the bell settles on Kalshi's result. Before fees.
function kLedger(file: string, B: Map<string, string>, F: any[], used: Set<any>, today: string) {
  type P = { id: string; tk: string; side: string; c: number; cost: number; got: number; first: number; approx: boolean; unpriced: boolean; paper: boolean };
  const P = new Map<string, P>();
  for (const r of lines(file)) {
    const id = String(r?.id || ""), a = String(r?.action || ""), t = Date.parse(String(r?.at)) || 0; if (!id || !t) continue;
    let p = P.get(id);
    const buy = (a === "bought" || /^add-on( \d+)?$/.test(a)) && Number(r.filled) > 0 && Number(r.px) > 0;
    const pbuy = (a === "paper" || /^paper add-on/.test(a)) && Number(r.px) > 0 && Number(r.dollars) > 0;
    if (buy || pbuy) {
      if (!p) P.set(id, (p = { id, tk: id.split(":")[0], side: String(r.side || ""), c: 0, cost: 0, got: 0, first: t, approx: false, unpriced: false, paper: pbuy }));
      const c = buy ? Number(r.filled) : Number(r.dollars) / Number(r.px);
      p.c += c; p.cost += c * Number(r.px); if (!p.side && r.side) p.side = String(r.side);
      continue;
    }
    if (!p || p.c <= 0.01) continue;
    if (a === "sold half" || a === "sold the rest") {
      if (r.out && Number(r.out.filled) > 0) { p.c -= Number(r.out.filled); p.got += Number(r.out.payout) || 0; continue; }
      // Kalshi's fills: selling an up ticket shows as a "sell" at the yes price; selling a down ticket shows as a "buy" of yes (no price = 1 - yes).
      const want = p.side === "down" ? "buy" : "sell"; let left = a === "sold half" ? p.c / 2 + 0.02 : p.c; let hit = false;
      for (const f of F) {
        if (left <= 0.01) break;
        const dt = Date.parse(String(f.t)) - t; if (used.has(f) || f.ticker !== p.tk || f.action !== want || dt < -60000 || dt > 10000) continue; // the fill lands up to a minute before the log line
        const c = Math.min(Number(f.count) || 0, left), y = Number(f.yes) || 0; if (c <= 0) continue;
        used.add(f); hit = true; left -= c; p.c -= c; p.got += c * (p.side === "down" ? 1 - y : y);
      }
      if (hit) p.approx = true; else p.unpriced = true;
    }
  }
  const mine = [...P.values()].filter((p) => ptDay(p.first) === today);
  const done: number[] = []; let open = 0, approx = 0, unpriced = 0, last = 0, paper = 0;
  for (const p of mine) {
    last = Math.max(last, p.first); if (p.paper) paper++;
    if (p.unpriced) { unpriced++; continue; }
    if (p.c > 0.01) { const b = B.get(p.tk); if (!b) { open++; continue; } p.got += p.c * ((b === "yes") === (p.side !== "down") ? 1 : 0); }
    if (p.approx) approx++;
    done.push(p.got - p.cost);
  }
  const notes = [approx ? `${approx} sale${approx > 1 ? "s" : ""} ≈ from Kalshi's fills` : "", unpriced ? `${unpriced} sale${unpriced > 1 ? "s" : ""} not priced in the log` : "", paper ? `${paper} paper` : "", "before fees"].filter(Boolean);
  return { n: mine.length, open, ...score(done), note: notes.join(" · "), last };
}

// fix1002: her Polymarket BTC momentum book: buys and sells at their own prices from its log; what rides to the bell settles on Kalshi's same window (≈).
function pmomLedger(file: string, B: Map<string, string>, today: string) {
  const P = new Map<string, { side: string; c: number; cost: number; got: number; first: number; tk: string }>();
  for (const r of lines(file)) {
    const id = String(r?.id || ""), a = String(r?.action || ""), t = Date.parse(String(r?.at)) || 0; if (!id || !t) continue;
    const c = Number(r.contracts) || 0, px = Number(r.price) || 0; let p = P.get(id);
    if ((a === "bought" || /^add-on( \d+)?$/.test(a)) && c > 0 && px > 0) { if (!p) P.set(id, (p = { side: String(r.side || ""), c: 0, cost: 0, got: 0, first: t, tk: id.split(":")[0] })); p.c += c; p.cost += c * px; continue; }
    if (p && (a === "sold half" || a === "sold the rest") && c > 0) { p.c -= c; p.got += c * px; }
  }
  const mine = [...P.values()].filter((p) => ptDay(p.first) === today); const done: number[] = []; let open = 0, last = 0;
  for (const p of mine) { last = Math.max(last, p.first); if (p.c > 0.01) { const b = B.get(p.tk); if (!b) { open++; continue; } p.got += p.c * ((b === "yes") === (p.side !== "down") ? 1 : 0); } done.push(p.got - p.cost); }
  return { n: mine.length, open, ...score(done), note: "bell read off Kalshi's same window (≈) · before fees", last };
}

// fix1002: a Polymarket 5m lane (XRP / BTC / ETH 5M): its filled tickets from its log. Polymarket's 5m result is not on the desk, so W / L wait on its card.
function p5mLedger(file: string, today: string) {
  const ids = new Map<string, { first: number; cost: number }>();
  for (const r of lines(file)) { const t = Date.parse(String(r?.at)) || 0; if (String(r?.action) !== "bought" || !(Number(r.filled) > 0) || !t) continue; const x = ids.get(String(r.id)) || { first: t, cost: 0 }; x.cost += Number(r.filled) * (Number(r.price) || 0); ids.set(String(r.id), x); }
  const mine = [...ids.values()].filter((x) => ptDay(x.first) === today);
  return { n: mine.length, open: mine.length, w: 0, l: 0, pnl: 0, note: mine.length ? `$${r2(mine.reduce((s, x) => s + x.cost, 0)).toFixed(2)} in · Polymarket 5m results are not on the desk - W / L on its card` : "", last: mine.reduce((m, x) => Math.max(m, x.first), 0) };
}

// fix1002: a paper book's own rows (the same $ the paper cards use: take-profit, else held, else pnl).
function paperFile(file: string, split: string | undefined, today: string) {
  const raw = J(file); const rows: any[] = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : raw?.rows && typeof raw.rows === "object" ? Object.values(raw.rows) : [];
  const mine = rows.filter((r) => r && r.at && !(Number((r as any)?.ask) > 0.66) /* fix1053 */ && (!split || r.book === split) && ptDay(Date.parse(String(r.at)) || 0) === today && (r.side === "up" || r.side === "down"));
  const done = mine.filter((r) => r.result !== "open" && Number.isFinite(Number(r.pnlTp ?? r.pnlHold ?? r.pnl))).map((r) => Number(r.pnlTp ?? r.pnlHold ?? r.pnl));
  return { n: mine.length, open: mine.length - done.length, ...score(done), note: "paper", last: mine.reduce((m, r) => Math.max(m, Date.parse(String(r.at)) || 0), 0) };
}

export async function allBooksRows1002(now = Date.now()): Promise<{ at: string; day: string; live: boolean; rows: Row1002[] }> {
  const C = (G.__ab1002 ||= { at: 0, out: null as any });
  if (C.out && now - C.at < 15000 && C.day === ptDay(now)) return C.out;
  const today = ptDay(now), sw = J("live-switch.json") || {}, B = bells(), F = fills(), used = new Set<any>();
  let og: any[] | null = null; let real: any[] = [];
  try { const rg: any = await import("./riskguard"); real = (rg.liveTrades() as any[]) || []; } catch {}
  const rows: Row1002[] = [];
  for (const b of BOOKS1002) {
    if (!existsSync(D(b.file))) continue; // fix1002: not installed yet - its row appears once its file exists
    let s: { n: number; open: number; w: number; l: number; pnl: number; note: string; last: number } | null = null; let rl: Row1002["real"] = null;
    try {
      if (b.kind === "recon") {
        if (!og) { const g = J("grok-og.json"); og = Array.isArray(g) ? g : []; }
        const mine = og.filter((r) => r && r.lane === b.lane && !r.stale && !(Number((r as any)?.ask) > 0.66) /* fix1053 */ && ptDay(Date.parse(String(r.at)) || 0) === today);
        const done = mine.filter((r) => r.result !== "open" && Number.isFinite(Number(r.pnl))).map((r) => Number(r.pnl));
        s = { n: mine.length, open: mine.length - done.length, ...score(done), note: "paper record at $20 a call", last: mine.reduce((m, r) => Math.max(m, Date.parse(String(r.at)) || 0), 0) };
        const rt = real.filter((t) => String(t.book) === b.lane && ptDay(Date.parse(String(t.first)) || 0) === today).map((t) => Number(t.pnl) || 0);
        rl = rt.length ? { n: rt.length, ...score(rt) } : null;
      } else if (b.kind === "kledger") s = kLedger(b.file, B, F, used, today);
      else if (b.kind === "pmom") s = pmomLedger(b.file, B, today);
      else if (b.kind === "p5m") s = p5mLedger(b.file, today);
      else if (b.kind === "paper") s = paperFile(b.file, b.split, today);
      else if (b.kind === "five") { s = paperFile(b.file, undefined, today); s.note = "its own record (five-book)"; }
      else if (b.kind === "shadow") { const mine = lines(b.file).filter((r) => ptDay(Date.parse(String(r?.at)) || 0) === today); s = { n: mine.length, open: 0, w: 0, l: 0, pnl: 0, note: b.note || "", last: mine.reduce((m, r) => Math.max(m, Date.parse(String(r.at)) || 0), 0) }; }
    } catch {}
    if (!s) s = { n: 0, open: 0, w: 0, l: 0, pnl: 0, note: "could not read its file", last: 0 };
    if (!s.last) { try { s.note = [s.note, `file last written ${new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" }).format(statSync(D(b.file)).mtime)}`].filter(Boolean).join(" · "); } catch {} }
    rows.push({ key: b.key, name: b.name, status: b.status(sw), venue: b.venue, file: `data/${b.file}`, n: s.n, w: s.w, l: s.l, open: s.open, pnl: s.pnl, real: rl, note: [b.kind === "pmom" ? "" : b.note, s.note].filter(Boolean).join(" · "), last: fmtT(s.last) });
  }
  const out = { at: new Date(now).toISOString(), day: today, live: sw?.live === true, rows };
  C.at = now; C.day = today; C.out = out; return out;
}
