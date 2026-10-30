// KALSHI TRUTH (Claude, 2026-10-02). The desk's own ledger mis-books trades it sells early
// (a scratch could show as a full loss, a small early win as a full win). This rebuilds every
// window straight from Kalshi's fills + settlements (data/kalshi-audit.json, refreshed every
// 2 minutes), fees included. Read only: it never places or changes anything.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type AuditFill = { t: string; ticker: string; action: string; side: string; count: string | number; yes: string | number; fee?: string | number | null };
// fix231 (Love Oct 25 ~8:17 PM PT: the 1 week chart stops at Oct 23, and the balance at each trade): Kalshi's fill side is the
// contract it adds (side "yes" = more YES, side "no" = more NO, whatever the action word says; checked to the cent against
// the kalshi-cash trail). The old action-only read booked every "buy no" fill as a YES buy.
const upOf = (f: AuditFill) => (f.side === "yes" || f.side === "no" ? f.side === "yes" : f.action === "buy");
type AuditOrder = { t: string; ticker: string; type?: string; client?: string | null; count?: string | number };
type AuditSettle = { ticker: string; result?: string; t?: string; fee?: string | number | null };
export type TruthRow = {
  ticker: string;
  at: string;
  closedAt: string | null;
  asset: string;
  side: "up" | "down";
  setup: string;
  stake: number;
  multiple: number;
  pnl: number;
  fees: number;
  exit: "sold" | "bell";
  manual: number; // outside orders (no desk tag) on this window
  bal: number | null; // fix231: Kalshi cash right after this window closed (live cash walked back through every fill + settlement)
};

const num = (v: unknown) => {
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};
function read<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", name), "utf8")) as T;
  } catch {
    return fallback;
  }
}
function assetOf(ticker: string) {
  const t = ticker.toUpperCase();
  for (const a of ["BTC", "GOLD", "SILVER", "ETH", "SOL"]) if (t.includes(a)) return a.toLowerCase();
  return t;
}

export function listTruth(from = ""): { at: string | null; rows: TruthRow[]; open: string[]; cash: number | null } {
  const audit = read<{ at?: string; fills?: AuditFill[]; orders?: AuditOrder[]; settlements?: AuditSettle[] }>("kalshi-audit.json", {});
  const log = read<{ ticker: string; kind: string; pattern?: string; at: string }[]>("fill-log.json", []);
  // fix231: the audit only holds Kalshi's last 1000 fills (~2 days), so the 1W chart stopped there. The paged history
  // (data/kalshi-history.json, 8000 fills) is merged under it and re-pulled (read only) when it is over 6 hours old.
  const hist = read<{ at?: string; fills?: AuditFill[]; settlements?: AuditSettle[] }>("kalshi-history.json", {});
  try {
    const flag = join(process.cwd(), "data", "pull-history.flag");
    if (!(Date.now() - Date.parse(hist.at ?? "") < 6 * 3600e3) && !existsSync(flag)) writeFileSync(flag, "fix231");
  } catch {}
  const seen = new Set<string>();
  const all: AuditFill[] = [];
  for (const f of [...(audit.fills ?? []), ...(hist.fills ?? [])]) {
    if (!f || !f.ticker) continue;
    const k = `${f.t}|${f.ticker}|${f.action}|${f.side}|${num(f.count)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    all.push(f);
  }
  all.sort((a, b) => a.t.localeCompare(b.t));
  const fills = all.filter((f) => f.t >= from);
  const settle = new Map([...(hist.settlements ?? []), ...(audit.settlements ?? [])].map((s) => [s.ticker, s]));
  const by = new Map<string, AuditFill[]>();
  for (const f of fills) (by.get(f.ticker) ?? by.set(f.ticker, []).get(f.ticker)!).push(f);
  const rows: TruthRow[] = [];
  const open: string[] = [];
  for (const [ticker, list] of by) {
    let cash = 0;
    let pos = 0;
    let fees = 0;
    let stake = 0;
    let opened = 0;
    const first = list[0];
    const side: "up" | "down" = upOf(first) ? "up" : "down";
    const entryYes = num(first.yes);
    for (const f of list) {
      const c = num(f.count);
      const p = num(f.yes);
      fees += num(f.fee);
      if (upOf(f)) {
        cash -= c * p;
        pos += c;
        if (side === "up") {
          stake += c * p;
          opened += c;
        }
      } else {
        cash += c * p;
        pos -= c;
        if (side === "down") {
          stake += c * (1 - p);
          opened += c;
        }
      }
    }
    let pnl = cash;
    let exit: "sold" | "bell" = "sold";
    let closedAt: string | null = list[list.length - 1].t;
    if (Math.abs(pos) > 1e-6) {
      const s = settle.get(ticker);
      if (!s || (s.result !== "yes" && s.result !== "no")) {
        open.push(ticker);
        continue;
      }
      pnl += pos * (s.result === "yes" ? 1 : 0);
      // (the settlement's fee_cost repeats the fill fees, so it is not added again)
      exit = "bell";
      closedAt = s.t ?? closedAt;
    }
    pnl -= fees;
    const tag = log.find((r) => r.ticker === ticker && r.kind === "taken");
    const manual = (audit.orders ?? []).filter((o) => o.ticker === ticker && !o.client && num(o.count) > 0).length;
    rows.push({
      ticker,
      at: first.t,
      closedAt,
      asset: assetOf(ticker),
      side,
      setup: tag?.pattern || "",
      stake: Math.round((stake + 1e-9) * 100) / 100,
      multiple: Math.round((side === "up" ? (entryYes > 0 ? 1 / entryYes : 0) : entryYes < 1 ? 1 / (1 - entryYes) : 0) * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      exit,
      manual,
      bal: null,
    });
    void opened;
  }
  rows.sort((a, b) => a.at.localeCompare(b.at));
  // fix231 BALANCE AT EACH TRADE: every fill + settlement in time order moves Kalshi cash by (YES cash - fees - NO collateral
  // held), a settlement pays the YES still held (NO collateral comes back either way). Walking the live cash back by
  // everything that happened after a window closed gives the balance right after it. Deposits/withdrawals between then
  // and now would shift the older ones.
  const cashNow = read<{ cash?: number | null }>("kalshi-cash.json", {}).cash;
  const cash = typeof cashNow === "number" && Number.isFinite(cashNow) ? cashNow : null;
  if (cash != null && rows.length) {
    const ev: { t: string; f?: AuditFill; s?: AuditSettle }[] = all.map((f) => ({ t: f.t, f }));
    for (const s of settle.values()) if (s.t) ev.push({ t: s.t, s });
    ev.sort((a, b) => a.t.localeCompare(b.t) || (a.f ? 0 : 1) - (b.f ? 0 : 1));
    const bk = new Map<string, { y: number; p: number; fee: number; fin: number | null }>();
    const val = (b: { y: number; p: number; fee: number; fin: number | null }) => b.y - b.fee + (b.fin ?? -Math.max(0, -b.p));
    let run = 0;
    const ts: string[] = [];
    const rs: number[] = [];
    for (const e of ev) {
      const tk = (e.f ?? e.s)!.ticker;
      const b = bk.get(tk) ?? bk.set(tk, { y: 0, p: 0, fee: 0, fin: null }).get(tk)!;
      const was = val(b);
      if (e.f) {
        const c = num(e.f.count);
        const p = num(e.f.yes);
        b.fee += num(e.f.fee);
        if (upOf(e.f)) {
          b.y -= c * p;
          b.p += c;
        } else {
          b.y += c * p;
          b.p -= c;
        }
      } else if (b.fin == null && (e.s!.result === "yes" || e.s!.result === "no")) b.fin = e.s!.result === "yes" ? b.p : 0;
      run += val(b) - was;
      ts.push(e.t);
      rs.push(run);
    }
    const at = (t: string) => {
      let lo = 0;
      let hi = ts.length - 1;
      let k = -1;
      while (lo <= hi) {
        const m = (lo + hi) >> 1;
        if (ts[m] <= t) {
          k = m;
          lo = m + 1;
        } else hi = m - 1;
      }
      return k < 0 ? 0 : rs[k];
    };
    for (const row of rows) row.bal = Math.round((cash - (run - at(row.closedAt ?? row.at))) * 100) / 100;
  }
  return { at: audit.at ?? null, rows, open, cash };
}
