import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { primeLabel } from "./auto";
import { bugExit, smallExit } from "./paper";
import { readFillLog } from "./fill-log";
import type { Trade } from "./types";

export const PRIME_FROM = "2026-09-27T23:14:00.000Z";

export type PrimeRow = {
  id: string;
  at: string;
  asset: string;
  side: string;
  venue: string;
  pattern: string;
  stake: number;
  multiple: number;
  profit: number | null;
  result: "open" | "closed";
};

const FILE = join(process.cwd(), "data", "prime-book.json");

function readRows(): PrimeRow[] {
  try {
    const rows = JSON.parse(readFileSync(FILE, "utf8")) as PrimeRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function save(rows: PrimeRow[]) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(rows.slice(0, 400)));
}

function fromLog(): PrimeRow[] {
  const taken = new Map<string, PrimeRow>();
  for (const event of readFillLog()) {
    if (event.at < PRIME_FROM || !primeLabel(event.pattern || "")) continue;
    const prev = taken.get(event.tradeId);
    if (event.kind === "taken" && !prev) {
      taken.set(event.tradeId, {
        id: event.tradeId,
        at: event.at,
        asset: event.asset,
        side: event.side,
        venue: event.venue,
        pattern: event.pattern,
        stake: event.stake,
        multiple: event.multiple,
        profit: null,
        result: "open",
      });
    }
    if (event.kind === "banked") {
      if (smallExit(event.profit, event.stake)) continue;
      const row = prev ?? {
        id: event.tradeId,
        at: event.at,
        asset: event.asset,
        side: event.side,
        venue: event.venue,
        pattern: event.pattern,
        stake: event.stake,
        multiple: event.multiple,
        profit: null,
        result: "open" as const,
      };
      taken.set(event.tradeId, {
        ...row,
        pattern: event.pattern || row.pattern,
        profit: event.profit,
        result: "closed",
      });
    }
  }
  return [...taken.values()];
}

export function syncPrime(trades: Trade[]) {
  const rows = new Map(readRows().map((row) => [row.id, row]));
  if (rows.size === 0) {
    for (const row of fromLog()) rows.set(row.id, row);
  }
  for (const trade of trades) {
    if (!trade?.id || trade.openedAt < PRIME_FROM || !primeLabel(trade.patternLabel || "")) continue;
    if (trade.result !== "open" && bugExit(trade)) {
      rows.delete(trade.id);
      continue;
    }
    const prev = rows.get(trade.id);
    rows.set(trade.id, {
      id: trade.id,
      at: trade.openedAt,
      asset: trade.asset,
      side: trade.side,
      venue: trade.venue ?? (trade.source === "live" ? "kalshi" : "paper"),
      pattern: trade.patternLabel,
      stake: trade.stake,
      multiple: trade.multiple,
      profit: trade.result === "open" ? (prev?.profit ?? null) : (trade.profit ?? prev?.profit ?? null),
      result: trade.result === "open" ? "open" : "closed",
    });
  }
  save([...rows.values()].sort((a, b) => b.at.localeCompare(a.at)));
}

export function readPrimeBook(): PrimeRow[] {
  const rows = readRows().filter((row) => row.result !== "closed" || !smallExit(row.profit, row.stake));
  if (rows.length) return rows.sort((a, b) => b.at.localeCompare(a.at));
  const seeded = fromLog().sort((a, b) => b.at.localeCompare(a.at));
  if (seeded.length) save(seeded);
  return seeded;
}
