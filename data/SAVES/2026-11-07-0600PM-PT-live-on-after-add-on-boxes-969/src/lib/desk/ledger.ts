import type { Trade } from "./types";

export const LEDGER_KEY = "aurelius-ledger-v1";

export function unionTrades(a: Trade[] = [], b: Trade[] = []): Trade[] {
  const map = new Map<string, Trade>();
  for (const t of [...a, ...b]) {
    if (!t?.id) continue;
    const prev = map.get(t.id);
    if (!prev) {
      map.set(t.id, t);
      continue;
    }
    if (prev.result === "open" && t.result !== "open") map.set(t.id, { ...prev, ...t });
    else if (t.result === "open" && prev.result !== "open") map.set(t.id, { ...t, ...prev });
    else {
      const prevAt = prev.closedAt ?? prev.openedAt ?? "";
      const nextAt = t.closedAt ?? t.openedAt ?? "";
      map.set(t.id, nextAt >= prevAt ? { ...prev, ...t } : { ...t, ...prev });
    }
  }
  return [...map.values()].sort((x, y) => (y.openedAt ?? "").localeCompare(x.openedAt ?? ""));
}

export function onePerSetup(trades: Trade[]): Trade[] {
  const closed = trades.filter((t) => t.result !== "open");
  const open = new Map<string, Trade>();
  for (const t of trades) {
    if (t.result !== "open") continue;
    const key = `${t.source}:${t.venue ?? "paper"}:${t.ticker}:${t.side}`;
    const prev = open.get(key);
    if (!prev || (t.openedAt ?? "") >= (prev.openedAt ?? "")) open.set(key, t);
  }
  return unionTrades(closed, [...open.values()]);
}

export function unionIds(a: string[] = [], b: string[] = []): string[] {
  return [...new Set([...a, ...b].filter(Boolean))];
}

export function readLedger(): Trade[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Trade[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t && typeof t.id === "string");
  } catch {
    return [];
  }
}

export function commitLedger(trades: Trade[]): Trade[] {
  const merged = unionTrades(readLedger(), trades);
  if (typeof window === "undefined") return merged;
  try {
    localStorage.setItem(LEDGER_KEY, JSON.stringify(merged));
  } catch {
    // keep the in-memory union if the browser refuses the write
  }
  return merged;
}
