import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { onPrimeBook } from "./prime-book";
import { fetchSeriesMarket } from "./kalshi";
import { computeVwap } from "./vwap";
import type { Candle } from "./types";

const FILE = join(process.cwd(), "data", "mirror-sheet.json");
const SEED = join(process.cwd(), "data", "mirror-seed.json");

export type MirrorRow = {
  id: string;
  at: string;
  asset: string;
  side: "up" | "down";
  pattern: string;
  kind: "prime" | "other-way" | "mirror" | "band";
  result: "open" | "yes" | "no";
  ticker: string;
};

type DeskAsset = {
  spot?: number;
  target?: number | null;
  secondsLeft?: number;
  market?: { ticker?: string } | null;
  vwap1m?: { vwap?: number; stdev?: number } | null;
  vwap5m?: { vwap?: number; stdev?: number } | null;
  primeLooks?: { label?: string; side?: string }[];
};

function readRows(): MirrorRow[] {
  try {
    const rows = JSON.parse(readFileSync(FILE, "utf8")) as MirrorRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeRows(rows: MirrorRow[]) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const sorted = [...rows].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 800);
  writeFileSync(FILE, JSON.stringify(sorted, null, 2));
}

export function listMirror(): MirrorRow[] {
  return readRows();
}

function norm(label: string): string {
  return String(label || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
}

function flipSide(side: "up" | "down"): "up" | "down" {
  return side === "up" ? "down" : "up";
}

function flipLabel(label: string): string {
  const clean = norm(label);
  return clean.replace(/\+/g, "§").replace(/-/g, "+").replace(/§/g, "-");
}

function won(side: "up" | "down", spot: number, target: number): boolean {
  return side === "up" ? spot >= target : spot < target;
}

function seedFromPrime() {
  try {
    if (readFileSync(SEED, "utf8").includes("done")) return;
  } catch {
    // first time
  }
  let paper: Array<{ id?: string; at?: string; asset?: string; side?: string; pattern?: string; result?: string; ticker?: string }> = [];
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), "data", "prime-paper.json"), "utf8"));
    if (Array.isArray(parsed)) paper = parsed;
  } catch {
    paper = [];
  }
  const rows = readRows();
  const have = new Set(rows.map((row) => row.id));
  for (const row of paper) {
    if ((row.result !== "yes" && row.result !== "no") || (row.side !== "up" && row.side !== "down") || !row.pattern || !row.asset) continue;
    const id = `past:${row.id || `${row.asset}:${row.at}`}`;
    if (!have.has(id)) {
      rows.push({
        id,
        at: row.at || new Date().toISOString(),
        asset: row.asset,
        side: row.side,
        pattern: row.pattern,
        kind: "prime",
        result: row.result,
        ticker: row.ticker || "",
      });
      have.add(id);
    }
    const other = `${id}:other`;
    if (!have.has(other)) {
      rows.push({
        id: other,
        at: row.at || new Date().toISOString(),
        asset: row.asset,
        side: flipSide(row.side),
        pattern: row.pattern,
        kind: "other-way",
        result: row.result === "yes" ? "no" : "yes",
        ticker: row.ticker || "",
      });
      have.add(other);
    }
  }
  writeRows(rows);
  writeFileSync(SEED, JSON.stringify({ done: true, at: new Date().toISOString() }));
}

function scoreLive(assets: Record<string, DeskAsset> | null | undefined) {
  if (!assets) return;
  const rows = readRows();
  const byId = new Map(rows.map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  for (const id of ["btc", "gold", "silver"]) {
    const asset = assets[id];
    const ticker = asset?.market?.ticker || "";
    const spot = asset?.spot || 0;
    const target = asset?.target ?? 0;
    const left = asset?.secondsLeft ?? 0;
    if (!ticker || !(spot > 0) || !(target > 0)) continue;
    for (const open of byId.values()) {
      if (open.result !== "open" || open.asset !== id || open.ticker !== ticker) continue;
      if (!(left > 0 && left <= 25)) continue;
      byId.set(open.id, { ...open, result: won(open.side, spot, target) ? "yes" : "no" });
      changed = true;
    }
    if (!(left > 45)) continue;
    for (const look of asset.primeLooks || []) {
      if (!look?.label || (look.side !== "up" && look.side !== "down")) continue;
      const side = look.side;
      const label = norm(look.label);
      const prime = onPrimeBook(label, side, id);
      const mirrored = onPrimeBook(flipLabel(label), flipSide(side), id);
      const plans: Array<{ side: "up" | "down"; pattern: string; kind: MirrorRow["kind"] }> = [];
      if (prime) {
        plans.push({ side, pattern: look.label, kind: "prime" });
        plans.push({ side: flipSide(side), pattern: look.label, kind: "other-way" });
      } else if (mirrored) {
        plans.push({ side, pattern: look.label, kind: "mirror" });
      }
      for (const plan of plans) {
        const key = `${ticker}:${plan.kind}:${plan.side}:${norm(plan.pattern)}`;
        if (byId.has(key)) continue;
        byId.set(key, {
          id: key,
          at: now,
          asset: id,
          side: plan.side,
          pattern: plan.pattern,
          kind: plan.kind,
          result: "open",
          ticker,
        });
        changed = true;
      }
    }
  }
  if (changed) writeRows([...byId.values()]);
}

const METALS = [
  { asset: "platinum", series: "KXPLATINUM15M", inst: "XPT-USDT-SWAP" },
  { asset: "palladium", series: "KXPALLADIUM15M", inst: "XPD-USDT-SWAP" },
] as const;

let metalAt = 0;

async function okxCandles(inst: string): Promise<Candle[]> {
  const res = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${inst}&bar=1m&limit=300`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: string[][] };
  const out: Candle[] = [];
  for (const row of body.data ?? []) {
    const t = Number(row[0]) / 1000;
    const o = Number(row[1]);
    const h = Number(row[2]);
    const l = Number(row[3]);
    const c = Number(row[4]);
    if (![t, o, h, l, c].every((n) => Number.isFinite(n))) continue;
    out.push({ t, o, h, l, c, v: Number(row[5]) || 0 });
  }
  return out.sort((a, b) => a.t - b.t);
}

function bandTouch(candles: Candle[]): { side: "up" | "down"; band: string; target: number; close: number } | null {
  if (candles.length < 40) return null;
  const frame = computeVwap(candles.slice(-60));
  if (!frame || !(frame.vwap > 0) || !(frame.stdev > 0)) return null;
  const last = candles[candles.length - 1];
  const windowStart = Math.floor(last.t / 900) * 900;
  const inWindow = candles.filter((candle) => candle.t >= windowStart);
  const open = inWindow[0]?.o || last.o;
  let best: { side: "up" | "down"; band: string; gap: number } | null = null;
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    for (const [name, price, side] of [
      [`+${step}σ`, frame.vwap + step * frame.stdev, "down" as const],
      [`−${step}σ`, frame.vwap - step * frame.stdev, "up" as const],
    ]) {
      const tagged = inWindow.some((candle) => candle.l <= price && candle.h >= price);
      if (!tagged) continue;
      const gap = Math.abs(last.c - price);
      if (!best || gap < best.gap) best = { side, band: name, gap };
    }
  }
  if (!best) return null;
  return { side: best.side, band: best.band, target: open, close: last.c };
}

async function scoreMetals() {
  if (Date.now() - metalAt < 60_000) return;
  metalAt = Date.now();
  const rows = readRows();
  const byId = new Map(rows.map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  for (const metal of METALS) {
    let candles: Candle[] = [];
    try {
      candles = await okxCandles(metal.inst);
    } catch {
      candles = [];
    }
    const touch = bandTouch(candles);
    let market: { ticker?: string; target?: number | null; closeTime?: string } | null = null;
    try {
      market = await fetchSeriesMarket(metal.series);
    } catch {
      market = null;
    }
    const ticker = market?.ticker || "";
    const target = market?.target ?? touch?.target ?? 0;
    const spot = touch?.close || 0;
    const left = market?.closeTime ? Math.max(0, Math.floor((Date.parse(market.closeTime) - Date.now()) / 1000)) : 0;
    if (ticker && spot > 0 && target > 0) {
      for (const open of byId.values()) {
        if (open.result !== "open" || open.asset !== metal.asset || open.ticker !== ticker) continue;
        if (left > 25) continue;
        byId.set(open.id, { ...open, result: won(open.side, spot, target) ? "yes" : "no" });
        changed = true;
      }
    }
    if (!touch || !ticker || !(left > 45)) continue;
    for (const kind of ["band", "other-way"] as const) {
      const side = kind === "band" ? touch.side : flipSide(touch.side);
      const key = `${ticker}:${kind}:${side}:${touch.band}`;
      if (byId.has(key)) continue;
      byId.set(key, {
        id: key,
        at: now,
        asset: metal.asset,
        side,
        pattern: `Band reject ${touch.band}`,
        kind,
        result: "open",
        ticker,
      });
      changed = true;
    }
  }
  if (changed) writeRows([...byId.values()]);
}

export async function scoreMirror(assets: Record<string, DeskAsset> | null | undefined) {
  try {
    seedFromPrime();
  } catch {
    // the sheet can start empty
  }
  try {
    scoreLive(assets);
  } catch {
    // a bad look does not stop the desk
  }
  try {
    await scoreMetals();
  } catch {
    // metals are a side test
  }
}
