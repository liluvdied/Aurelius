// KALSHI TRUTH (Claude, 2026-10-02). The desk's own ledger mis-books trades it sells early
// (a scratch could show as a full loss, a small early win as a full win). This rebuilds every
// window straight from Kalshi's fills + settlements (data/kalshi-audit.json, refreshed every
// 2 minutes), fees included. Read only: it never places or changes anything.
import { readFileSync } from "node:fs";
import { join } from "node:path";

type AuditFill = { t: string; ticker: string; action: string; side: string; count: string | number; yes: string | number; fee?: string | number | null };
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

export function listTruth(from = ""): { at: string | null; rows: TruthRow[]; open: string[] } {
  const audit = read<{ at?: string; fills?: AuditFill[]; orders?: AuditOrder[]; settlements?: AuditSettle[] }>("kalshi-audit.json", {});
  const log = read<{ ticker: string; kind: string; pattern?: string; at: string }[]>("fill-log.json", []);
  const fills = [...(audit.fills ?? [])].filter((f) => f && f.ticker && f.t >= from).sort((a, b) => a.t.localeCompare(b.t));
  const settle = new Map((audit.settlements ?? []).map((s) => [s.ticker, s]));
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
    const side: "up" | "down" = first.action === "buy" ? "up" : "down";
    const entryYes = num(first.yes);
    for (const f of list) {
      const c = num(f.count);
      const p = num(f.yes);
      fees += num(f.fee);
      if (f.action === "buy") {
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
    });
    void opened;
  }
  rows.sort((a, b) => a.at.localeCompare(b.at));
  return { at: audit.at ?? null, rows, open };
}
