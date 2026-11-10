import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);

// fix727 AKIMBO CARD (Love Nov 5 2026 7:42 AM PT: "pls create a new combined card Akimbo so she has a clean slate"). Display only: the akimbo pair's PAPER book exactly as CHANGE-71
// trades it - one ticket per asset-window, the first of SESSION + PINK (brk-sesspk) and +15M PIVOTS (brk15) to call it; when pivot later calls the other side of a SESSION + PINK ticket,
// that ticket is sold at the bid (1 - pivot's ask - 1c) and pivot's ticket is taken; a SESSION + PINK call against a pivot ticket is ignored. $10 a ticket. Clean slate: only windows
// from the first time the desk built this card (data/akimbo-book-727.json "since"). Kept in that file so the card survives the lane rows moving to the archive. Never read by the copier.
const AKF727 = "akimbo-book-727.json";
export function akimboRows727(): any[] {
  try {
    const C = (G.__ak727 ||= { key: "", rows: [] as any[] });
    const p = D("grok-og.json"); if (!existsSync(p)) return C.rows;
    const st = statSync(p), key = `${st.mtimeMs}:${st.size}`;
    if (C.key === key) return C.rows;
    let S: { since: string; rows: Record<string, any> } = { since: new Date().toISOString(), rows: {} };
    let fresh = true; try { if (existsSync(D(AKF727))) { const j = JSON.parse(readFileSync(D(AKF727), "utf8")); if (j && typeof j.since === "string" && j.rows && typeof j.rows === "object") { S = j; fresh = false; } } } catch {}
    const raw = JSON.parse(readFileSync(p, "utf8")); const all = Array.isArray(raw) ? raw : [];
    const first: Record<string, { a?: any; b?: any }> = {};
    for (const r of all) {
      if (!r || (r.lane !== "brk-sesspk" && r.lane !== "brk15") || !r.ticker || !/15M-/.test(String(r.ticker)) || String(r.at) < S.since || (r.side !== "up" && r.side !== "down")) continue;
      const w = (first[`${r.asset}|${r.ticker}`] ||= {}), k = r.lane === "brk15" ? "b" : "a";
      if (!w[k] || String(r.at) < String(w[k].at)) w[k] = r;
    }
    const ten = (r: any) => (r.result === "open" || r.pnl == null ? null : 10 * Number(r.pnl) / (Number(r.stake) || 20));
    let changed = fresh;
    for (const [wk, w] of Object.entries(first)) {
      const a = w.a, b = w.b; let row: any;
      const x = a && b ? (String(a.at) <= String(b.at) ? a : b) : a || b;
      if (a && b && a.side !== b.side && x === a) {
        const bid = Math.max(0.01, 1 - (Number(b.ask) || 0.99) - 0.01), sold = Number(a.ask) > 0 ? 10 * (bid / Number(a.ask) - 1) : 0, pv = ten(b);
        row = { at: a.at, asset: b.asset, ticker: b.ticker, side: b.side, ask: Number(b.ask) || 0, setup: `PIVOT GETS THE STICKS: SESSION + PINK ${a.side === "up" ? "long" : "short"} sold at ${Math.round(bid * 100)}c (${sold >= 0 ? "+" : "-"}$${Math.abs(sold).toFixed(2)}) -> +15M PIVOTS ${b.side === "up" ? "long" : "short"}: ${String(b.label || "")}`.slice(0, 160), result: pv == null ? "open" : pv + sold > 0 ? "win" : "loss", pnl: pv == null ? null : Math.round((pv + sold) * 100) / 100, exit: b.result === "open" ? "open" : String(b.exit || "held to the bell") };
      } else {
        const v = ten(x);
        row = { at: x.at, asset: x.asset, ticker: x.ticker, side: x.side, ask: Number(x.ask) || 0, setup: `${x.lane === "brk15" ? "+15M PIVOTS" : "SESSION + PINK"}: ${String(x.label || "")}`.slice(0, 160), result: v == null ? "open" : v > 0 ? "win" : "loss", pnl: v == null ? null : Math.round(v * 100) / 100, exit: x.result === "open" ? "open" : String(x.exit || "held to the bell") };
      }
      const id = `${x.ticker}:akimbo727`;
      const out = { id, book: "akimbo727", at: row.at, asset: row.asset, ticker: row.ticker, side: row.side, setup: row.setup, ask: row.ask, multiple: row.ask > 0 ? Math.round((1 / row.ask) * 100) / 100 : null, stake: 10, result: row.result, exit: row.exit, pnl: row.pnl, paper721: true };
      if (JSON.stringify(S.rows[wk]) !== JSON.stringify(out)) { S.rows[wk] = out; changed = true; }
    }
    if (changed) { try { writeFileSync(D(AKF727 + ".tmp"), JSON.stringify(S)); renameSync(D(AKF727 + ".tmp"), D(AKF727)); } catch {} }
    C.key = key; C.rows = Object.values(S.rows); return C.rows;
  } catch { return (G.__ak727?.rows as any[]) || []; }
}

// fix744 AKIMBO + BTC TWIN CARD (Love Nov 5 2026 12:30 PM PT: "we will test our card with one that has btc added and see how it does today"). Display only, paper: the same AKIMBO rules as live
// (one ticket per asset-window - the first of the books to call it; when +15M PIVOTS later calls the other side, the first ticket is sold at the bid and pivot's side taken; any other
// later call is ignored) over SESSION + PINK, +15M PIVOTS, the gold 2m middle seat AND the BTC 5m middle paper book. $10 a ticket, clean slate from its first build (data/akimbo-btc-744.json).
const AKF744 = "akimbo-btc-744.json", LANES744 = ["brk-sesspk", "brk15", "gmid2", "bmid5"];
export function akimboTwinRows744(): any[] {
  try {
    const C = (G.__ak744 ||= { key: "", rows: [] as any[] });
    const p = D("grok-og.json"); if (!existsSync(p)) return C.rows;
    const st = statSync(p), key = `${st.mtimeMs}:${st.size}`; if (C.key === key) return C.rows;
    let S: { since: string; rows: Record<string, any> } = { since: new Date().toISOString(), rows: {} }; let fresh = true;
    try { if (existsSync(D(AKF744))) { const j = JSON.parse(readFileSync(D(AKF744), "utf8")); if (j && typeof j.since === "string" && j.rows) { S = j; fresh = false; } } } catch {}
    const raw = JSON.parse(readFileSync(p, "utf8")); const all = Array.isArray(raw) ? raw : [];
    const win: Record<string, any[]> = {};
    for (const r of all) { if (!r || !LANES744.includes(String(r.lane)) || !/15M-/.test(String(r.ticker)) || String(r.at) < S.since || (r.side !== "up" && r.side !== "down")) continue; (win[`${r.asset}|${r.ticker}`] ||= []).push(r); }
    const ten = (r: any) => (r.result === "open" || r.pnl == null ? null : 10 * Number(r.pnl) / (Number(r.stake) || 20));
    let changed = fresh;
    for (const [wk, list] of Object.entries(win)) {
      const firstBy: Record<string, any> = {}; for (const r of list) if (!firstBy[r.lane] || String(r.at) < String(firstBy[r.lane].at)) firstBy[r.lane] = r;
      const calls = Object.values(firstBy).sort((x: any, y: any) => (String(x.at) < String(y.at) ? -1 : 1)); const x: any = calls[0]; if (!x) continue;
      const pv: any = firstBy["brk15"]; let row: any;
      if (pv && x.lane !== "brk15" && pv.side !== x.side && String(pv.at) > String(x.at)) {
        const bid = Math.max(0.01, 1 - (Number(pv.ask) || 0.99) - 0.01), sold = Number(x.ask) > 0 ? 10 * (bid / Number(x.ask) - 1) : 0, v = ten(pv);
        row = { at: x.at, asset: pv.asset, ticker: pv.ticker, side: pv.side, ask: Number(pv.ask) || 0, setup: `PIVOT GETS THE STICKS: ${x.lane} sold at ${Math.round(bid * 100)}c -> +15M PIVOTS: ${String(pv.label || "")}`.slice(0, 160), result: v == null ? "open" : v + sold > 0 ? "win" : "loss", pnl: v == null ? null : Math.round((v + sold) * 100) / 100, exit: pv.result === "open" ? "open" : String(pv.exit || "held to the bell") };
      } else { const v = ten(x); row = { at: x.at, asset: x.asset, ticker: x.ticker, side: x.side, ask: Number(x.ask) || 0, setup: `${x.lane}: ${String(x.label || "")}`.slice(0, 160), result: v == null ? "open" : v > 0 ? "win" : "loss", pnl: v == null ? null : Math.round(v * 100) / 100, exit: x.result === "open" ? "open" : String(x.exit || "held to the bell") }; }
      const out = { id: `${row.ticker}:akimbo744`, book: "akimbo744", at: row.at, asset: row.asset, ticker: row.ticker, side: row.side, setup: row.setup, ask: row.ask, multiple: row.ask > 0 ? Math.round((1 / row.ask) * 100) / 100 : null, stake: 10, result: row.result, exit: row.exit, pnl: row.pnl, paper721: true };
      if (JSON.stringify(S.rows[wk]) !== JSON.stringify(out)) { S.rows[wk] = out; changed = true; }
    }
    if (changed) { try { writeFileSync(D(AKF744 + ".tmp"), JSON.stringify(S)); renameSync(D(AKF744 + ".tmp"), D(AKF744)); } catch {} }
    C.key = key; C.rows = Object.values(S.rows); return C.rows;
  } catch { return (G.__ak744?.rows as any[]) || []; }
}
