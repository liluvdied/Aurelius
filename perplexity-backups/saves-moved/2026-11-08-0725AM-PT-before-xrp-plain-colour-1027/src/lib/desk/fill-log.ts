import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bugExit } from "./paper";
import { rememberEntry, reviewClose } from "./review";
import type { Trade } from "./types";

const FILE = join(process.cwd(), "data", "fill-log.json");

export type FillEvent = {
  id: string;
  at: string;
  kind: "taken" | "banked";
  tradeId: string;
  asset: Trade["asset"];
  ticker: string;
  side: Trade["side"];
  venue: "kalshi" | "polymarket" | "paper";
  stake: number;
  ask: number;
  multiple: number;
  profit: number | null;
  pattern: string;
  opposite: boolean;
  target?: number | null;
  spot?: number | null;
  vwap?: number | null;
  peak?: number | null;
};

function venueOf(t: Trade): FillEvent["venue"] {
  if (t.venue === "polymarket") return "polymarket";
  if (t.source === "live") return "kalshi";
  return "paper";
}

function primeName(ticker: string, side: string): string {
  if (!ticker) return "";
  try {
    const rows = JSON.parse(readFileSync(join(process.cwd(), "data", "prime-paper.json"), "utf8")) as { ticker?: string; side?: string; pattern?: string }[];
    const row = Array.isArray(rows) ? rows.find((item) => item.ticker === ticker && item.side === side && item.pattern && item.pattern !== "Live") : null;
    return row?.pattern || "";
  } catch {
    return "";
  }
}

function rememberedPeak(t: Trade): number | null {
  const own = Number(t.highBid);
  if (own > 0.02) return own;
  for (const file of ["gate-high.json", "trail-peak.json"]) {
    try {
      const book = JSON.parse(readFileSync(join(process.cwd(), "data", file), "utf8")) as Record<string, number>;
      const bid = Number(book[t.ticker]);
      if (bid > 0.02) return bid;
    } catch {
      // no peak stored yet
    }
  }
  return null;
}

function toEvent(t: Trade, kind: FillEvent["kind"]): FillEvent {
  const named = t.patternLabel && t.patternLabel !== "Live" ? t.patternLabel : primeName(t.ticker, t.side);
  return {
    id: `${t.id}:${kind}`,
    at: kind === "banked" ? (t.closedAt ?? new Date().toISOString()) : t.openedAt,
    kind,
    tradeId: t.id,
    asset: t.asset,
    ticker: t.ticker,
    side: t.side,
    venue: venueOf(t),
    stake: t.stake,
    ask: t.ask,
    multiple: t.multiple,
    profit: kind === "banked" ? (t.profit ?? null) : null,
    pattern: named || t.patternLabel || "",
    opposite: false,
    target: t.target ?? null,
    spot: t.lastSpot ?? null,
    vwap: t.entryVwap ?? null,
    peak: kind === "banked" ? rememberedPeak(t) : null,
  };
}

function readRaw(): FillEvent[] {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as FillEvent[];
    return Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.id === "string") : [];
  } catch {
    return [];
  }
}

function save(events: FillEvent[]) {
  shownCache = null;
  const trimmed = [...events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8000);
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(trimmed));
}

const TARGETS = join(process.cwd(), "data", "targets.json");

function logTarget(t: Trade, kind: FillEvent["kind"]) {
  try {
    let rows: Array<Record<string, unknown>> = [];
    try {
      const parsed = JSON.parse(readFileSync(TARGETS, "utf8")) as unknown;
      if (Array.isArray(parsed)) rows = parsed as Array<Record<string, unknown>>;
    } catch {
      rows = [];
    }
    const hit = rows.find((row) => row.id === t.id);
    if (kind === "banked" && hit) {
      hit.profit = t.profit ?? null;
      hit.result = (t.profit ?? 0) > 0 ? "win" : "loss";
      hit.closedAt = t.closedAt ?? new Date().toISOString();
    } else if (!hit && kind === "taken") {
      rows.unshift({
        id: t.id,
        at: t.openedAt,
        asset: t.asset,
        ticker: t.ticker,
        side: t.side,
        pattern: t.patternLabel || "",
        venue: venueOf(t),
        spot: t.lastSpot ?? null,
        target: t.target ?? null,
        vwap: t.entryVwap ?? null,
        multiple: t.multiple,
        profit: null,
        result: "open",
      });
    } else {
      return;
    }
    writeFileSync(TARGETS, JSON.stringify(rows.slice(0, 500), null, 2));
  } catch {
    // the price log must not block the fill
  }
}

export function recordTrades(prev: Trade[], next: Trade[]) {
  const had = new Map(prev.filter((t) => t?.id).map((t) => [t.id, t]));
  const fresh: FillEvent[] = [];
  for (const t of next) {
    if (!t?.id) continue;
    const old = had.get(t.id);
    if (!old) {
      rememberEntry(t);
      fresh.push(toEvent(t, "taken"));
      logTarget(t, "taken");
      if (t.result !== "open" && !bugExit(t)) {
        fresh.push(toEvent(t, "banked"));
        reviewClose(t);
      }
    } else if (old.result === "open" && t.result !== "open") {
      if (!bugExit(t)) {
        fresh.push(toEvent(t, "banked"));
        logTarget(t, "banked");
        reviewClose(t);
      }
    }
  }
  if (!fresh.length) return;
  const existing = readRaw();
  const ids = new Set(existing.map((e) => e.id));
  const add = fresh.filter((e) => !ids.has(e.id));
  if (!add.length) return;
  save([...add, ...existing]);
}

let shownCache: { at: number; rows: FillEvent[] } | null = null;

export function readFillLog(): FillEvent[] {
  const now = Date.now();
  if (shownCache && now - shownCache.at < 8000) return shownCache.rows;
  const events = readRaw().sort((a, b) => a.at.localeCompare(b.at));
  const sides = new Map<string, Set<string>>();
  const flagged = new Set<string>();
  for (const e of events) {
    if (e.kind !== "taken") continue;
    const key = `${e.venue}:${e.ticker}`;
    const set = sides.get(key) ?? new Set<string>();
    if (set.size > 0 && !set.has(e.side)) flagged.add(e.tradeId);
    set.add(e.side);
    sides.set(key, set);
  }
  const rows = events
    .map((e) => ({ ...e, opposite: flagged.has(e.tradeId) }))
    .sort((a, b) => b.at.localeCompare(a.at));
  shownCache = { at: now, rows };
  return rows;
}
