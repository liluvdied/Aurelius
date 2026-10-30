import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bandInWay, bandOnPath, centerWrong, primeLabel } from "./auto";
import { bugExit, smallExit } from "./paper";
import { readFillLog } from "./fill-log";
import type { Trade } from "./types";

export const PRIME_FROM = "2026-09-28T08:00:00.000Z";

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

type HitFile = { counts: Record<string, { yes: number; no: number }>; seen: string[] };
export type PrimePaper = {
  id: string;
  at: string;
  asset: string;
  side: string;
  pattern: string;
  result: "open" | "yes" | "no";
  ticker?: string;
  hits?: number;
  bookYes?: number;
  bookNo?: number;
  multiple?: number;
  profit?: number | null;
  live?: string;
  gate?: boolean;
  peak?: number | null;
};

const HITS = join(process.cwd(), "data", "hit-book.json");
const PRIME_PAPER = join(process.cwd(), "data", "prime-paper.json");
const OWN_PAPER = join(process.cwd(), "data", "own-paper.json");
const HALF_PAPER = join(process.cwd(), "data", "half-paper.json");
const DECIDED_PAPER = join(process.cwd(), "data", "decided-paper.json");

function normHit(label: string): string {
  return String(label || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
}

function hitKey(pattern: string, side: string, asset: string): string {
  return `${normHit(pattern)}|${side}|${String(asset || "").toLowerCase()}`;
}

function readHits(): HitFile {
  try {
    const parsed = JSON.parse(readFileSync(HITS, "utf8")) as HitFile;
    return { counts: parsed.counts || {}, seen: Array.isArray(parsed.seen) ? parsed.seen : [] };
  } catch {
    return { counts: {}, seen: [] };
  }
}

function readPrimePaper(): PrimePaper[] {
  try {
    const rows = JSON.parse(readFileSync(PRIME_PAPER, "utf8")) as PrimePaper[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function setupRecord(label: string, side: string): { yes: number; no: number } {
  const head = `${normHit(label)}|${side}|`;
  let yes = 0;
  let no = 0;
  for (const [key, count] of Object.entries(readHits().counts)) {
    if (!key.startsWith(head) || !count) continue;
    yes += count.yes || 0;
    no += count.no || 0;
  }
  return { yes, no };
}

function allTimePrime(): { yes: number; no: number } {
  let yes = 0;
  let no = 0;
  for (const row of readPrimePaper()) {
    if (row.result === "yes") yes += 1;
    else if (row.result === "no") no += 1;
  }
  return { yes, no };
}

export function readPrimeWatch(): { at: string; note: Record<string, string> } {
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), "data", "prime-why.json"), "utf8")) as {
      at?: string;
      note?: Record<string, string>;
    };
    return { at: parsed.at || "", note: parsed.note || {} };
  } catch {
    return { at: "", note: {} };
  }
}
function readPeaks(): Record<string, number> {
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), "data", "gate-high.json"), "utf8")) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function listPrimePaper(): PrimePaper[] {
  const rows = readPrimePaper();
  const peaks = readPeaks();
  return rows.map((row) => {
    const record = paperRecord(row.pattern, row.side, row.asset);
    const peak = row.ticker ? peaks[row.ticker] : undefined;
    return { ...row, bookYes: record.yes, bookNo: record.no, peak: peak && peak > 0 ? peak : row.peak ?? null };
  });
}

export function listOwnPaper(): PrimePaper[] {
  return readPaperFile(OWN_PAPER);
}

export function markOwnLive(id: string, live: string) {
  const rows = readPaperFile(OWN_PAPER);
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0 || rows[index].live === live) return;
  rows[index] = { ...rows[index], live };
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(OWN_PAPER, JSON.stringify(rows, null, 2));
}

export function paperNeedsLink() {
  const rows = readPaperFile(OWN_PAPER).filter((row) => row.asset === "btc" || row.asset === "gold");
  const young = (row: PrimePaper) => {
    const at = Date.parse(row.at || "");
    return Number.isFinite(at) && Date.now() - at < 3 * 60 * 60 * 1000;
  };
  const missed = rows.filter((row) => young(row) && (row.live === "missed" || ((row.result === "yes" || row.result === "no") && row.live !== "filled")));
  const open = rows.filter((row) => young(row) && row.result === "open" && row.live !== "filled" && row.live !== "missed" && row.ticker);
  return { missed: missed.slice(0, 8), open };
}

function readPaperFile(file: string): PrimePaper[] {
  try {
    const rows = JSON.parse(readFileSync(file, "utf8")) as PrimePaper[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writePaperFile(file: string, byId: Map<string, PrimePaper>) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(file, JSON.stringify(rows, null, 2));
}

function settleRows(byId: Map<string, PrimePaper>, id: string, ticker: string, left: number, spot: number, target: number): boolean {
  let changed = false;
  for (const open of byId.values()) {
    if (open.result !== "open" || open.asset !== id || open.ticker !== ticker) continue;
    if (!(left > 0 && left <= 25 && spot > 0 && target > 0)) continue;
    const yes = open.side === "up" ? spot >= target : spot < target;
    const result = yes ? "yes" : "no";
    byId.set(open.id, { ...open, result, profit: scaledProfit(open.multiple, result) });
    changed = true;
  }
  return changed;
}

function openSeat(byId: Map<string, PrimePaper>, row: PrimePaper): boolean {
  if (byId.has(row.id)) return false;
  const busy = [...byId.values()].some((item) => item.result === "open" && item.asset === row.asset && item.ticker === row.ticker);
  if (busy) return false;
  byId.set(row.id, row);
  return true;
}

export function listHalfPaper(): PrimePaper[] {
  return readPaperFile(HALF_PAPER);
}

export function listDecidedPaper(): PrimePaper[] {
  return readPaperFile(DECIDED_PAPER);
}

export function primeOwns(ticker: string): boolean {
  if (!ticker) return false;
  return readPrimePaper().some((row) => row.ticker === ticker && (row.result === "open" || row.live === "filled"));
}

export function stampPrime(id: string, live: string) {
  const rows = readPrimePaper();
  const next = rows.map((row) => (row.id === id ? { ...row, live } : row));
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(PRIME_PAPER, JSON.stringify(next, null, 2));
}

export function primeScore(): { yes: number; no: number; open: number; allYes: number; allNo: number } {
  const rows = readPrimePaper();
  const all = allTimePrime();
  return {
    yes: rows.filter((row) => row.result === "yes").length,
    no: rows.filter((row) => row.result === "no").length,
    open: rows.filter((row) => row.result === "open").length,
    allYes: all.yes,
    allNo: all.no,
  };
}

export function syncHitPaper(trades: Trade[]) {
  const hits = readHits();
  const seen = new Set(hits.seen);
  const paper = readPrimePaper();
  const byId = new Map(paper.map((row) => [row.id, row]));
  let changed = false;
  for (const trade of trades) {
    if (!trade?.id || trade.source === "live" || trade.venue === "polymarket" || trade.probe) continue;
    const pattern = trade.patternLabel || "";
    if (!pattern || /^watching /i.test(pattern) || /^no band/i.test(pattern)) continue;
    const key = hitKey(pattern, trade.side, trade.asset);
    const count = hits.counts[key] || { yes: 0, no: 0 };
    if (trade.result === "open") continue;
    if (seen.has(trade.id)) continue;
    const yes = (trade.profit ?? 0) > 0;
    hits.counts[key] = { yes: count.yes + (yes ? 1 : 0), no: count.no + (yes ? 0 : 1) };
    seen.add(trade.id);
    hits.seen = [...seen].slice(-2000);
    const row = byId.get(trade.id);
    if (row && row.result === "open") {
      byId.set(trade.id, { ...row, result: yes ? "yes" : "no" });
      changed = true;
    }
    changed = true;
  }
  if (!changed) return;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(HITS, JSON.stringify({ counts: hits.counts, seen: hits.seen }));
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(PRIME_PAPER, JSON.stringify(rows, null, 2));
}

type Look = { label: string; side: string };
type PrimeAsset = {
  asset?: string;
  spot?: number;
  target?: number | null;
  secondsLeft?: number;
  market?: { ticker?: string; yesAsk?: number; noAsk?: number; yesBid?: number; noBid?: number } | null;
  vwap1m?: { vwap?: number; stdev?: number } | null;
  vwap5m?: { vwap?: number; stdev?: number } | null;
  primeLooks?: Look[];
  lastPrints?: { o?: number; c?: number }[];
};

const PAPER_STAKE = 25;

export function scaledProfit(multiple: number | undefined, result: string): number | null {
  if (result === "no") return -PAPER_STAKE;
  if (result !== "yes" || !(multiple && multiple > 1)) return null;
  return Math.round(PAPER_STAKE * (multiple - 1) * 100) / 100;
}

function quoteMultiple(asset: PrimeAsset, side: string): number {
  const ask = side === "up" ? Number(asset.market?.yesAsk) : Number(asset.market?.noAsk);
  const bid = side === "up" ? Number(asset.market?.yesBid) : Number(asset.market?.noBid);
  const px = ask > 0.02 && ask < 0.99 ? ask : bid > 0.02 && bid < 0.99 ? bid : 0;
  if (!(px > 0.02)) return 0;
  return Math.round((1 / px) * 100) / 100;
}

export function onPrimeBook(label: string, side: string, asset: string): boolean {
  return primeProven(label, side, asset);
}

function tally(label: string, side: string, asset: string): { yes: number; no: number } {
  const counts = readHits().counts;
  return counts[hitKey(label, side, asset)] || { yes: 0, no: 0 };
}

function clearedForty(row: PrimePaper, peaks: Record<string, number>): boolean {
  const multiple = Number(row.multiple);
  const entry = multiple > 1 ? 1 / multiple : 0;
  const peak = row.ticker ? Number(peaks[row.ticker]) : Number(row.peak);
  if (!(entry > 0.02) || !(peak > 0)) return false;
  return (peak / entry - 1) * 100 > 40;
}

// Love's "40% rule": a loser that was up 40%+ before turning counts as a hit. It is a toggle
// (data/live-switch.json "primeFortyRule"), off by default, so the main book is scored on what
// actually happened. The 40% book is still shown beside it as its own record.
function fortyRuleOn(): boolean {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).primeFortyRule === true;
  } catch {
    return false;
  }
}

export function paperRecord(label: string, side: string, asset: string, forty = fortyRuleOn()): { yes: number; no: number } {
  const head = normHit(label);
  const id = String(asset || "").toLowerCase();
  const peaks = readPeaks();
  let yes = 0;
  let no = 0;
  for (const row of readPrimePaper()) {
    if (String(row.asset || "").toLowerCase() !== id || row.side !== side) continue;
    if (normHit(row.pattern) !== head) continue;
    const hit = row.result === "yes" || row.gate === true || (forty && row.result === "no" && clearedForty(row, peaks));
    if (hit) yes += 1;
    else if (row.result === "no") no += 1;
  }
  return { yes, no };
}

function primeDenied(label: string, side: string, asset: string): boolean {
  const id = String(asset || "").toLowerCase();
  const head = normHit(label);
  if (id !== "silver" || side !== "down") return false;
  return head === "Close below VWAP" || head === "Tap-reject at -0.5σ";
}

function primeAllowed(label: string, side: string, asset: string): boolean {
  if (primeDenied(label, side, asset)) return false;
  return false;
}

// A setup is proven when its record says so: the recent research rows OR the full hit book
// (every trade the desk has scored, not just the last 200 rows). Before, only the rolling
// 200 rows counted, so winners fell off the list and read "neither book".
function provenRecord(label: string, side: string, asset: string): boolean {
  const own = paperRecord(label, side, asset);
  if (own.yes >= 2 && own.yes > own.no) return true;
  const all = tally(label, side, asset);
  return all.yes >= 2 && all.yes > all.no;
}

export function primeProven(label: string, side: string, asset: string): boolean {
  if (primeDenied(label, side, asset)) return false;
  if (primeAllowed(label, side, asset)) return true;
  return provenRecord(label, side, asset);
}

function tallyAny(label: string, side: string): { yes: number; no: number } {
  let best = { yes: 0, no: 0 };
  for (const asset of ["btc", "gold", "silver"]) {
    const count = tally(label, side, asset);
    if (count.yes > best.yes || (count.yes === best.yes && count.no < best.no)) best = count;
  }
  return best;
}

function onAnyPrime(label: string, side: string): boolean {
  const count = tallyAny(label, side);
  return count.yes >= 2 && count.yes > count.no;
}

function bandEither(asset: PrimeAsset | undefined, side: "up" | "down", spot: number, id: string): boolean {
  const frames = [asset?.vwap1m, asset?.vwap5m];
  return frames.some((frame) => frame?.vwap && frame?.stdev && bandInWay(side, spot, frame.vwap, frame.stdev, id));
}

// Spine rule: a band blocks only the side that still has to cross it to reach the strike.
function pathBlocked(side: "up" | "down", spot: number, target: number, asset: PrimeAsset | undefined): boolean {
  if (!(spot > 0) || !(target > 0)) return false;
  if (side === "down" ? spot < target : spot > target) return false;
  const frames = [asset?.vwap1m, asset?.vwap5m];
  return frames.some((frame) => {
    if (!frame?.vwap || !frame?.stdev) return false;
    const touch = frame.stdev * 0.2;
    const levels = [frame.vwap];
    for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(frame.vwap + step * frame.stdev, frame.vwap - step * frame.stdev);
    return levels.some((level) => {
      if (Math.abs(spot - level) <= touch) return false;
      return side === "down" ? spot > level && level > target : spot < level && level < target;
    });
  });
}

function thinLead(side: "up" | "down", spot: number, target: number, asset: PrimeAsset | undefined): boolean {
  if (!(spot > 0) || !(target > 0)) return false;
  const lead = side === "up" ? spot - target : target - spot;
  if (!(lead > 0)) return false;
  const frame = asset?.vwap1m?.stdev ? asset.vwap1m : asset?.vwap5m;
  const stdev = frame?.stdev || 0;
  if (!(stdev > 0)) return false;
  return lead < stdev * 0.5;
}

function closedAgainst(prints: { o?: number; c?: number }[] | undefined, vwap: number, stdev: number): "up" | "down" | "" {
  const last = prints?.[prints.length - 1];
  if (!last || !(last.o > 0) || !(last.c > 0) || !(vwap > 0) || !(stdev > 0)) return "";
  const levels = [vwap];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * stdev, vwap - step * stdev);
  if (levels.some((level) => last.o > level && last.c < level)) return "down";
  if (levels.some((level) => last.o < level && last.c > level)) return "up";
  return "";
}

function openLook(spot: number, vwap: number, stdev: number): Look | null {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  let best: { gap: number; step: number; sign: string } | null = null;
  const bands = [0, 0.5, 1, 1.5, 2, 2.5, 3];
  for (const step of bands) {
    for (const sign of step === 0 ? [0] : [1, -1]) {
      const price = vwap + sign * step * stdev;
      const gap = Math.abs(spot - price);
      if (gap > stdev * 0.35) continue;
      if (best && gap >= best.gap) continue;
      best = { gap, step, sign: sign < 0 ? "-" : "+" };
    }
  }
  if (!best) return null;
  const level = vwap + (best.sign === "-" ? -1 : 1) * best.step * stdev;
  const name = best.step === 0 ? "VWAP" : `${best.sign}${best.step}σ`;
  return { label: `Open ${name}`, side: spot >= level ? "up" : "down" };
}

function bestClear(looks: Look[], id: string, spot: number, vwap: number, stdev: number, source: "paper" | "old" | "own" = "old") {
  let picked: { look: Look; hits: number } | null = null;
  let blocked: { look: Look; hits: number } | null = null;
  let other = "";
  const seen = new Set<string>();
  const record = (label: string, side: string) => {
    if (source === "paper" && primeAllowed(label, side, id)) return { yes: 3, no: 0 };
    return source === "paper" || source === "own" ? paperRecord(label, side, id) : tallyAny(label, side);
  };
  const consider = (look: Look) => {
    if (!look?.label || (look.side !== "up" && look.side !== "down")) return;
    const key = hitKey(look.label, look.side, id);
    if (seen.has(key)) return;
    seen.add(key);
    const count = record(look.label, look.side);
    const broke = (source === "paper" || source === "own") && /^(close below |close above |broke )/.test(normHit(look.label));
    if (source === "own") {
      const onPrime = primeProven(look.label, look.side, id);
      const onPaper = count.yes >= 1 && count.yes > count.no;
      if (!onPrime && !onPaper) return;
      const row = { look, hits: count.yes };
      if (vwap > 0 && stdev > 0 && bandInWay(look.side, spot, vwap, stdev, id)) {
        if (!blocked || row.hits > blocked.hits) blocked = row;
        return;
      }
      if (!picked || row.hits > picked.hits) picked = row;
      return;
    } else if (broke) {
      if (count.no > count.yes) return;
    } else if (!(count.yes >= 2 && count.yes > count.no)) return;
    const row = { look, hits: count.yes };
    if (source === "old" && vwap > 0 && stdev > 0 && bandInWay(look.side, spot, vwap, stdev, id)) {
      if (!blocked || row.hits > blocked.hits) blocked = row;
      if (source === "paper") return;
      const flip = look.side === "up" ? "down" : "up";
      const flipped = { label: look.label, side: flip as "up" | "down" };
      const flipKey = hitKey(flipped.label, flipped.side, id);
      if (seen.has(flipKey)) return;
      seen.add(flipKey);
      const flipCount = tallyAny(flipped.label, flipped.side);
      if (!(flipCount.yes >= 2 && flipCount.yes > flipCount.no)) {
        other = `${flip} still allowed, not on the prime book`;
        return;
      }
      if (bandInWay(flipped.side, spot, vwap, stdev, id)) {
        other = `${flip} blocked by the band`;
        return;
      }
      const flipRow = { look: flipped, hits: flipCount.yes };
      if (!picked || flipRow.hits > picked.hits) picked = flipRow;
      return;
    }
    if (!picked || row.hits > picked.hits) picked = row;
  };
  for (const look of looks) consider(look);
  return { picked, blocked, other };
}

function bestLogged(looks: Look[], asset: string): { look: Look; hits: number } | null {
  return bestClear(looks, asset, 0, 0, 0, "paper").picked;
}

function watchNote(
  looks: Look[],
  id: string,
  spot: number,
  vwap: number,
  stdev: number,
  taking: string,
): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const look of looks) {
    if (!look?.label || (look.side !== "up" && look.side !== "down")) continue;
    const key = `${normHit(look.label)}|${look.side}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const onPrime = primeProven(look.label, look.side, id);
    const own = paperRecord(look.label, look.side, id);
    const all = tally(look.label, look.side, id);
    const onPaper = (own.yes >= 1 && own.yes > own.no) || (all.yes >= 2 && all.yes > all.no);
    const blocked = vwap > 0 && stdev > 0 && bandInWay(look.side, spot, vwap, stdev, id);
    const bits = [`${look.side} ${look.label}`];
    if (onPrime) bits.push("prime book");
    if (onPaper) bits.push("paper book");
    if (!onPrime && !onPaper) bits.push("neither book");
    if (blocked) bits.push("blocked by the band");
    if (taking === key) bits.push("taking");
    lines.push(bits.join(", "));
  }
  return lines.length ? lines.join("\n") : "no setup";
}

export function primeCandidate(asset: PrimeAsset & { asset?: string }): { label: string; side: "up" | "down"; hits: number } | null {
  const id = String(asset.asset || "").toLowerCase();
  if (!id) return null;
  const looks = [...(asset.primeLooks || [])];
  const frame = asset.vwap1m?.vwap ? asset.vwap1m : asset.vwap5m;
  const opened = openLook(asset.spot || 0, frame?.vwap || 0, frame?.stdev || 0);
  const left = asset.secondsLeft ?? 0;
  if (opened && left >= 120) looks.push(opened);
  const picked = bestLogged(looks, id);
  if (!picked || (picked.look.side !== "up" && picked.look.side !== "down")) return null;
  return { label: picked.look.label, side: picked.look.side, hits: picked.hits };
}

function paperChoice(id: string, asset: PrimeAsset | undefined, book: "prime" | "own" = "prime") {
  const spot = asset?.spot || 0;
  const target = asset?.target ?? 0;
  const left = asset?.secondsLeft ?? 0;
  const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
  const vwap = frame?.vwap || 0;
  const stdev = frame?.stdev || 0;
  const looks = [...(asset?.primeLooks || [])];
  const opened = openLook(spot, vwap, stdev);
  if (opened && left >= 120) looks.push(opened);
  const against = closedAgainst(asset?.lastPrints, vwap, stdev);
  const liveLooks = against ? looks.filter((look) => look.side !== (against === "down" ? "up" : "down")) : looks;
  const picked = bestClear(liveLooks, id, spot, vwap, stdev, book === "own" ? "own" : "paper").picked;
  const blank = {
    looks,
    vwap,
    stdev,
    low: "",
    take: null as null | { side: "up" | "down"; label: string; hits: number; multiple: number; thin: boolean },
  };
  if (!picked || (picked.look.side !== "up" && picked.look.side !== "down")) return blank;
  if (normHit(picked.look.label).startsWith("Watching")) return blank;
  if (pathBlocked(picked.look.side, spot, target, asset)) {
    return { ...blank, low: `${picked.look.side} ${picked.look.label}, a band sits between price and the target` };
  }
  // Spine rule: wrong side of VWAP blocks only until price reaches the target.
  const through = picked.look.side === "down" ? spot > 0 && target > 0 && spot < target : spot > 0 && target > 0 && spot > target;
  const wrong = !through && [asset?.vwap1m, asset?.vwap5m].some((frame) => centerWrong(picked.look.side, spot, target, frame?.vwap || 0));
  if (wrong) {
    const where = picked.look.side === "up" ? "above" : "below";
    return { ...blank, low: `${picked.look.side} ${picked.look.label}, VWAP is ${where} the price and the target` };
  }
  if (!primeProven(picked.look.label, picked.look.side, id)) {
    const own = paperRecord(picked.look.label, picked.look.side, id);
    const broke = /^(close below |close above |broke )/.test(normHit(picked.look.label));
    if (own.no > own.yes) {
      return { ...blank, low: `${picked.look.side} ${picked.look.label}, the paper book has this losing ${own.yes}-${own.no}` };
    }
    if (book === "own") {
      if (!(own.yes >= 1 && own.yes > own.no)) return blank;
    } else if (!broke) return blank;
  }
  const multiple = quoteMultiple(asset || {}, picked.look.side);
  if (!(multiple >= 1.18)) {
    return { ...blank, low: `${picked.look.side} ${picked.look.label}, ${multiple > 1 ? multiple.toFixed(2) : "no"}x under 1.18` };
  }
  return {
    ...blank,
    take: {
      side: picked.look.side,
      label: picked.look.label,
      hits: picked.hits,
      multiple,
      thin: thinLead(picked.look.side, spot, target, asset),
    },
  };
}

const PROPER_PATH = join(process.cwd(), "data", "proper-fires.json");

function noteProperFire(row: { id?: string; at?: string; asset?: string; side?: string; pattern?: string; result?: string; ticker?: string; live?: string }) {
  if (row.live !== "filled") return;
  if (row.result !== "yes" && row.result !== "no") return;
  if (!row.pattern || /^watching/i.test(row.pattern)) return;
  let book: { need: number; sealed: boolean; fires: { id: string }[] } = { need: 10, sealed: false, fires: [] };
  try {
    const parsed = JSON.parse(readFileSync(PROPER_PATH, "utf8"));
    if (parsed && Array.isArray(parsed.fires)) book = { need: 10, sealed: Boolean(parsed.sealed), fires: parsed.fires };
  } catch {
    book = { need: 10, sealed: false, fires: [] };
  }
  const id = row.id || `${row.ticker}:${row.side}:${row.pattern}`;
  if (book.fires.some((fire) => fire.id === id)) return;
  book.fires.push({
    id,
    at: row.at || new Date().toISOString(),
    asset: row.asset,
    side: row.side,
    pattern: row.pattern,
    result: row.result,
    ticker: row.ticker,
  } as { id: string });
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(PROPER_PATH, JSON.stringify({ need: 10, sealed: book.sealed, fires: book.fires }, null, 2));
}

export function syncPrimeLooks(assets: Record<string, PrimeAsset> | null | undefined) {
  if (!assets) return;
  const byId = new Map(readPrimePaper().map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  const note: Record<string, string> = {};
  for (const id of ["btc", "gold", "silver"]) {
    const asset = assets[id];
    const ticker = asset?.market?.ticker || "";
    const spot = asset?.spot || 0;
    const target = asset?.target ?? 0;
    const left = asset?.secondsLeft ?? 0;
    if (!ticker) {
      note[id] = "not on this book";
      continue;
    }
    for (const open of byId.values()) {
      if (open.result !== "open" || open.asset !== id || open.ticker !== ticker) continue;
      let row = open;
      if (!(row.multiple && row.multiple > 1)) {
        const multiple = quoteMultiple(asset, row.side);
        if (multiple > 1) {
          row = { ...row, multiple };
          byId.set(row.id, row);
          changed = true;
        }
      }
      if (!(left > 0 && left <= 25 && spot > 0 && target > 0)) continue;
      const yes = row.side === "up" ? spot >= target : spot < target;
      const result = yes ? "yes" : "no";
      byId.set(row.id, { ...row, result, profit: scaledProfit(row.multiple, result) });
      noteProperFire({ ...row, result });
      changed = true;
    }
    if (!(left > 45)) {
      note[id] = "window closing";
      continue;
    }
    const choice = paperChoice(id, asset);
    let taking = "";
    const low = choice.low;
    if (choice.take) {
      taking = `${normHit(choice.take.label)}|${choice.take.side}`;
      const key = `${ticker}:${choice.take.side}:${normHit(choice.take.label)}`;
      if (!byId.has(key)) {
        const busy = [...byId.values()].some((row) => row.result === "open" && row.asset === id && row.ticker === ticker);
        if (!busy) {
          byId.set(key, {
            id: key,
            at: now,
            asset: id,
            side: choice.take.side,
            pattern: choice.take.label,
            result: "open",
            ticker,
            hits: choice.take.hits,
            multiple: choice.take.multiple > 1 ? choice.take.multiple : undefined,
          });
          changed = true;
        }
      }
    }
    const text = watchNote(choice.looks, id, spot, choice.vwap, choice.stdev, taking);
    note[id] = low ? `${text}\n${low}` : text;
  }
  try {
    writeFileSync(join(process.cwd(), "data", "prime-why.json"), JSON.stringify({ at: now, note }, null, 2));
  } catch {
    // the reason file is optional
  }
  if (!changed) return;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(PRIME_PAPER, JSON.stringify(rows, null, 2));
}

export function syncOwnPaper(assets: Record<string, PrimeAsset> | null | undefined) {
  if (!assets) return;
  const byId = new Map(readPaperFile(OWN_PAPER).map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  for (const id of ["btc", "gold", "silver"]) {
    const asset = assets[id];
    const ticker = asset?.market?.ticker || "";
    const spot = asset?.spot || 0;
    const target = asset?.target ?? 0;
    const left = asset?.secondsLeft ?? 0;
    if (!ticker) continue;
    for (const open of byId.values()) {
      if (open.result !== "open" || open.asset !== id || !open.ticker || open.ticker === ticker || open.live === "filled" || open.live === "missed") continue;
      byId.set(open.id, { ...open, live: "missed" });
      changed = true;
    }
    for (const open of byId.values()) {
      if (open.result !== "open" || open.asset !== id || open.ticker !== ticker) continue;
      if (!(left > 0 && left <= 25 && spot > 0 && target > 0)) continue;
      const yes = open.side === "up" ? spot >= target : spot < target;
      const live = open.live === "filled" ? "filled" : "missed";
      byId.set(open.id, { ...open, result: yes ? "yes" : "no", profit: scaledProfit(open.multiple, yes ? "yes" : "no"), live });
      changed = true;
    }
    if (!(left > 45)) continue;
    const choice = paperChoice(id, asset, "own");
    if (!choice.take) continue;
    const key = `${ticker}:${choice.take.side}:${normHit(choice.take.label)}:own`;
    if (byId.has(key)) continue;
    const busy = [...byId.values()].some((row) => row.result === "open" && row.asset === id && row.ticker === ticker);
    if (busy) continue;
    byId.set(key, {
      id: key,
      at: now,
      asset: id,
      side: choice.take.side,
      pattern: choice.take.label,
      result: "open",
      ticker,
      hits: choice.take.hits,
      multiple: choice.take.multiple > 1 ? choice.take.multiple : undefined,
    });
    changed = true;
  }
  if (!changed) return;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(OWN_PAPER, JSON.stringify(rows, null, 2));
}

export function syncHalfLooks(assets: Record<string, PrimeAsset> | null | undefined) {
  if (!assets) return;
  const byId = new Map(readPaperFile(HALF_PAPER).map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  for (const id of ["btc", "gold", "silver"]) {
    const asset = assets[id];
    const ticker = asset?.market?.ticker || "";
    const spot = asset?.spot || 0;
    const target = asset?.target ?? 0;
    const left = asset?.secondsLeft ?? 0;
    if (!ticker) continue;
    if (settleRows(byId, id, ticker, left, spot, target)) changed = true;
    if (!(left > 45)) continue;
    const choice = paperChoice(id, asset);
    if (!choice.take || choice.take.thin) continue;
    const key = `${ticker}:${choice.take.side}:${normHit(choice.take.label)}`;
    if (
      openSeat(byId, {
        id: key,
        at: now,
        asset: id,
        side: choice.take.side,
        pattern: choice.take.label,
        result: "open",
        ticker,
        hits: choice.take.hits,
        multiple: choice.take.multiple > 1 ? choice.take.multiple : undefined,
      })
    ) {
      changed = true;
    }
  }
  if (changed) writePaperFile(HALF_PAPER, byId);
}

export function syncDecided(assets: Record<string, PrimeAsset> | null | undefined) {
  const asset = assets?.btc;
  const ticker = asset?.market?.ticker || "";
  if (!ticker) return;
  const byId = new Map(readPaperFile(DECIDED_PAPER).map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  const spot = asset?.spot || 0;
  const target = asset?.target ?? 0;
  const left = asset?.secondsLeft ?? 0;
  if (settleRows(byId, "btc", ticker, left, spot, target)) changed = true;
  if (left > 45 && spot > 0 && target > 0) {
    const gap = spot - target;
    const side = gap >= 150 ? "up" : gap <= -150 ? "down" : "";
    if (side) {
      const multiple = quoteMultiple(asset, side);
      if (multiple > 1) {
        const key = `${ticker}:${side}:150`;
        if (
          openSeat(byId, {
            id: key,
            at: now,
            asset: "btc",
            side,
            pattern: side === "up" ? "$150 over the strike" : "$150 under the strike",
            result: "open",
            ticker,
            multiple,
          })
        ) {
          changed = true;
        }
      }
    }
  }
  if (changed) writePaperFile(DECIDED_PAPER, byId);
}

export type LeanPaper = PrimePaper & { multiple: number };

const LEAN = join(process.cwd(), "data", "lean-paper.json");

function leanShape(label: string): boolean {
  const text = normHit(label);
  return /^tap-reject at /i.test(text) || /^close above /i.test(text) || /^close below /i.test(text) || /^break/i.test(text) || /^broke through /i.test(text);
}

function priceFavors(side: string, spot: number | null, target: number | null): boolean {
  if (!(spot != null && spot > 0) || !(target != null && target > 0)) return false;
  if (side === "up") return spot > target;
  if (side === "down") return spot < target;
  return false;
}

function readLean(): LeanPaper[] {
  try {
    const rows = JSON.parse(readFileSync(LEAN, "utf8")) as LeanPaper[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function listLeanPaper(): LeanPaper[] {
  return readSilverLearn().map((row) => ({ ...row, multiple: row.multiple || 0 }));
}

const SILVER_LEARN = join(process.cwd(), "data", "silver-learn.json");

function readSilverLearn(): PrimePaper[] {
  try {
    const rows = JSON.parse(readFileSync(SILVER_LEARN, "utf8")) as PrimePaper[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function rememberSilver(row: PrimePaper) {
  if (row.result !== "yes" && row.result !== "no") return;
  const hits = readHits();
  const id = `silver-learn:${row.id}`;
  if (hits.seen.includes(id)) return;
  const key = hitKey(row.pattern, row.side, "silver");
  const count = hits.counts[key] || { yes: 0, no: 0 };
  hits.counts[key] = {
    yes: count.yes + (row.result === "yes" ? 1 : 0),
    no: count.no + (row.result === "no" ? 1 : 0),
  };
  hits.seen = [...hits.seen, id].slice(-2000);
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(HITS, JSON.stringify({ counts: hits.counts, seen: hits.seen }));
}

export function syncSilverLearn(assets: Record<string, PrimeAsset> | null | undefined) {
  const asset = assets?.silver;
  const ticker = asset?.market?.ticker || "";
  const spot = asset?.spot || 0;
  const target = asset?.target ?? 0;
  const left = asset?.secondsLeft ?? 0;
  if (!ticker) return;
  const byId = new Map(readSilverLearn().map((row) => [row.id, row]));
  for (const row of byId.values()) rememberSilver(row);
  let changed = false;
  const now = new Date().toISOString();
  for (const open of byId.values()) {
    if (open.result !== "open" || open.ticker !== ticker) continue;
    if (!(left > 0 && left <= 25 && spot > 0 && target > 0)) continue;
    const yes = open.side === "up" ? spot >= target : spot < target;
    const result = yes ? "yes" : "no";
    byId.set(open.id, { ...open, result, profit: scaledProfit(open.multiple, result) });
    rememberSilver({ ...open, result });
    changed = true;
  }
  if (left > 45) {
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    const vwap = frame?.vwap || 0;
    const stdev = frame?.stdev || 0;
    const looks = [...(asset?.primeLooks || [])];
    const opened = openLook(spot, vwap, stdev);
    if (opened && left >= 120) looks.push(opened);
    const against = closedAgainst(asset?.lastPrints, vwap, stdev);
    const liveLooks = against ? looks.filter((look) => look.side !== (against === "down" ? "up" : "down")) : looks;
    let picked: { look: Look; hits: number } | null = null;
    const seen = new Set<string>();
    for (const look of liveLooks) {
      if (!look?.label || (look.side !== "up" && look.side !== "down")) continue;
      const key = `${normHit(look.label)}|${look.side}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (onPrimeBook(look.label, look.side, "silver")) continue;
      const onBtc = onPrimeBook(look.label, look.side, "btc");
      const onGold = onPrimeBook(look.label, look.side, "gold");
      if (!onBtc && !onGold) continue;
      if (vwap > 0 && stdev > 0 && bandInWay(look.side, spot, vwap, stdev, "silver")) continue;
      if (pathBlocked(look.side, spot, target, asset)) continue;
      const hits = Math.max(onBtc ? tally(look.label, look.side, "btc").yes : 0, onGold ? tally(look.label, look.side, "gold").yes : 0);
      if (!picked || hits > picked.hits) picked = { look, hits };
    }
    if (picked) {
      const multiple = quoteMultiple(asset, picked.look.side);
      if (multiple >= 1.18) {
        const id = `${ticker}:${picked.look.side}:${normHit(picked.look.label)}`;
        const busy = [...byId.values()].some((row) => row.result === "open" && row.ticker === ticker);
        if (!byId.has(id) && !busy) {
          byId.set(id, {
            id,
            at: now,
            asset: "silver",
            side: picked.look.side,
            pattern: picked.look.label,
            result: "open",
            ticker,
            hits: picked.hits,
            multiple,
          });
          changed = true;
        }
      }
    }
  }
  if (!changed) return;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(SILVER_LEARN, JSON.stringify(rows, null, 2));
}

const FUEL = join(process.cwd(), "data", "fuel-paper.json");

function readFuel(): PrimePaper[] {
  try {
    const rows = JSON.parse(readFileSync(FUEL, "utf8")) as PrimePaper[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function listFuelPaper(): PrimePaper[] {
  return readFuel();
}

export function syncFuelPaper(assets: Record<string, PrimeAsset> | null | undefined) {
  if (!assets) return;
  const byId = new Map(readFuel().map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  for (const id of ["oil", "gas", "copper"]) {
    const asset = assets[id];
    const ticker = asset?.market?.ticker || "";
    const spot = asset?.spot || 0;
    const target = asset?.target ?? 0;
    const left = asset?.secondsLeft ?? 0;
    if (!ticker) continue;
    for (const open of byId.values()) {
      if (open.result !== "open" || open.asset !== id || open.ticker !== ticker) continue;
      if (!(left > 0 && left <= 25 && spot > 0 && target > 0)) continue;
      const yes = open.side === "up" ? spot >= target : spot < target;
      const result = yes ? "yes" : "no";
      byId.set(open.id, { ...open, result, profit: scaledProfit(open.multiple, result) });
      changed = true;
    }
    if (!(left > 45)) continue;
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    const vwap = frame?.vwap || 0;
    const stdev = frame?.stdev || 0;
    const looks = [...(asset?.primeLooks || [])];
    const opened = openLook(spot, vwap, stdev);
    if (opened && left >= 120) looks.push(opened);
    const against = closedAgainst(asset?.lastPrints, vwap, stdev);
    const liveLooks = against ? looks.filter((look) => look.side !== (against === "down" ? "up" : "down")) : looks;
    const picked = bestClear(liveLooks, id, spot, vwap, stdev).picked;
    if (!picked || (picked.look.side !== "up" && picked.look.side !== "down")) continue;
    if (bandEither(asset, picked.look.side, spot, id)) continue;
    if (pathBlocked(picked.look.side, spot, target, asset)) continue;
    if (!onAnyPrime(picked.look.label, picked.look.side)) continue;
    const multiple = quoteMultiple(asset, picked.look.side);
    if (!(multiple >= 1.18)) continue;
    const key = `${ticker}:${picked.look.side}:${normHit(picked.look.label)}`;
    if (byId.has(key)) continue;
    const busy = [...byId.values()].some((row) => row.result === "open" && row.asset === id && row.ticker === ticker);
    if (busy) continue;
    byId.set(key, {
      id: key,
      at: now,
      asset: id,
      side: picked.look.side,
      pattern: picked.look.label,
      result: "open",
      ticker,
      hits: picked.hits,
      multiple,
    });
    changed = true;
  }
  if (!changed) return;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(FUEL, JSON.stringify(rows, null, 2));
}

const LAB = join(process.cwd(), "data", "symbol-lab.json");
const LAB_HALT = join(process.cwd(), "data", "lab-halt.json");
const HOUR_CHECK = join(process.cwd(), "data", "hour-check.json");
const LAB_IDS = ["btc", "gold", "silver", "oil", "gas", "copper", "eth", "sol"];

export type LabRow = PrimePaper & {
  spotAt?: number;
  vwap?: number;
  stdev?: number;
  vwap5?: number;
  stdev5?: number;
  target?: number;
  bad?: string;
  scored?: boolean;
};

export type HourCheck = {
  at: string;
  hour: string;
  ok: boolean;
  halted: boolean;
  reason: string;
  cleanHours: number;
  greenHours: number;
  ready: boolean;
  profit: number;
  open: number;
  yes: number;
  no: number;
};

const BLANK_CHECK: HourCheck = {
  at: "",
  hour: "",
  ok: true,
  halted: false,
  reason: "",
  cleanHours: 0,
  greenHours: 0,
  ready: false,
  profit: 0,
  open: 0,
  yes: 0,
  no: 0,
};

function readLab(): LabRow[] {
  try {
    const rows = JSON.parse(readFileSync(LAB, "utf8")) as LabRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLab(rows: LabRow[]) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(LAB, JSON.stringify(rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 500), null, 2));
}

function labHalt(): { off: boolean; reason: string } {
  try {
    const row = JSON.parse(readFileSync(LAB_HALT, "utf8")) as { off?: boolean; reason?: string };
    return { off: row.off === true, reason: String(row.reason || "") };
  } catch {
    return { off: false, reason: "" };
  }
}

function stopLab(reason: string) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(LAB_HALT, JSON.stringify({ off: true, at: new Date().toISOString(), reason }));
}

function keepPaper() {
  const file = join(process.cwd(), "data", "live-manual.json");
  try {
    if (JSON.parse(readFileSync(file, "utf8")).off === true) return;
  } catch {
    // missing means it is not locked
  }
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(
    file,
    JSON.stringify(
      {
        off: true,
        at: new Date().toISOString(),
        reason: "Paper test. The hourly check put Kalshi back on paper. No new orders.",
      },
      null,
      2,
    ),
  );
}

function pacificHourKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const bit = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${bit("year")}-${bit("month")}-${bit("day")}T${bit("hour")}`;
}

function namedLevel(label: string, vwap: number, stdev: number): number | null {
  const text = normHit(label);
  if (!(vwap > 0)) return null;
  if (/vwap/i.test(text) && !/[+-]?\d/.test(text)) return vwap;
  const match = text.match(/([+-]?\d+(?:\.\d+)?)\s*σ/);
  if (!match || !(stdev > 0)) return null;
  return vwap + Number(match[1]) * stdev;
}

function ownBandWrong(label: string, side: "up" | "down", spot: number, vwap: number, stdev: number): boolean {
  const level = namedLevel(label, vwap, stdev);
  if (level == null || !(spot > 0)) return false;
  if (side === "up") return level > spot;
  return level < spot;
}

function policeLab(rows: LabRow[]): string {
  const sides = new Map<string, Set<string>>();
  let why = "";
  for (const row of rows) {
    const side = row.side === "up" || row.side === "down" ? row.side : "";
    const open = row.result === "open";
    if (side && row.spotAt && row.vwap && row.stdev && bandInWay(side, row.spotAt, row.vwap, row.stdev, row.asset)) {
      row.bad = side === "up" ? "long with a band above" : "short with a band below";
      if (open) why = why || `${row.asset} ${row.pattern}: ${row.bad}`;
    } else if (side && row.spotAt && row.vwap5 && row.stdev5 && bandInWay(side, row.spotAt, row.vwap5, row.stdev5, row.asset)) {
      row.bad = side === "up" ? "long with a 5m band above" : "short with a 5m band below";
      if (open) why = why || `${row.asset} ${row.pattern}: ${row.bad}`;
    }
    if (side && row.spotAt && row.vwap && row.stdev && ownBandWrong(row.pattern, side, row.spotAt, row.vwap, row.stdev)) {
      row.bad = side === "up" ? "long under its band" : "short above its band";
      if (open) why = why || `${row.asset} ${row.pattern}: ${row.bad}`;
    }
    if (!side) continue;
    const key = `${row.asset}|${row.ticker || ""}`;
    const set = sides.get(key) || new Set<string>();
    set.add(side);
    sides.set(key, set);
  }
  for (const [key, set] of sides) {
    if (set.has("up") && set.has("down")) why = why || `${key} took both sides`;
  }
  return why;
}

function applySymbolLab(assets: Record<string, PrimeAsset> | null | undefined) {
  if (!assets) return;
  const byId = new Map(readLab().map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  const halted = labHalt().off;
  for (const id of LAB_IDS) {
    const asset = assets[id];
    if (!asset) continue;
    const ticker = asset.market?.ticker || "";
    const spot = asset.spot || 0;
    const target = asset.target ?? 0;
    const left = asset.secondsLeft ?? 0;
    if (!ticker) continue;
    for (const open of byId.values()) {
      if (open.result !== "open" || open.asset !== id || open.ticker !== ticker) continue;
      if (!(left > 0 && left <= 25 && spot > 0 && target > 0)) continue;
      const yes = open.side === "up" ? spot >= target : spot < target;
      const result = yes ? "yes" : "no";
      byId.set(open.id, { ...open, result, profit: scaledProfit(open.multiple, result) });
      changed = true;
    }
    if (halted || !(left > 45)) continue;
    const frame = asset.vwap1m?.vwap ? asset.vwap1m : asset.vwap5m;
    const vwap = frame?.vwap || 0;
    const stdev = frame?.stdev || 0;
    const looks = [...(asset.primeLooks || [])];
    const opened = openLook(spot, vwap, stdev);
    if (opened && left >= 120) looks.push(opened);
    const against = closedAgainst(asset.lastPrints, vwap, stdev);
    const liveLooks = against ? looks.filter((look) => look.side !== (against === "down" ? "up" : "down")) : looks;
    const seen = new Set<string>();
    let clear: { look: Look; hits: number; multiple: number }[] = [];
    for (const look of liveLooks) {
      if (!look?.label || (look.side !== "up" && look.side !== "down")) continue;
      const key = `${normHit(look.label)}|${look.side}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!onAnyPrime(look.label, look.side)) continue;
      if (bandEither(asset, look.side, spot, id)) continue;
      if (pathBlocked(look.side, spot, target, asset)) continue;
      if (vwap > 0 && stdev > 0 && ownBandWrong(look.label, look.side, spot, vwap, stdev)) continue;
      const multiple = quoteMultiple(asset, look.side);
      if (!(multiple >= 1.18)) continue;
      clear.push({ look, hits: tallyAny(look.label, look.side).yes, multiple });
    }
    const upHits = clear.filter((row) => row.look.side === "up").reduce((max, row) => Math.max(max, row.hits), 0);
    const downHits = clear.filter((row) => row.look.side === "down").reduce((max, row) => Math.max(max, row.hits), 0);
    if (upHits && downHits) {
      if (upHits === downHits) continue;
      const keep = upHits > downHits ? "up" : "down";
      clear = clear.filter((row) => row.look.side === keep);
    }
    const heldSide = [...byId.values()].find((row) => row.result === "open" && row.ticker === ticker && (row.side === "up" || row.side === "down"))?.side;
    if (heldSide) clear = clear.filter((row) => row.look.side === heldSide);
    for (const row of clear) {
      const key = `${ticker}:${row.look.side}:${normHit(row.look.label)}`;
      if (byId.has(key)) continue;
      byId.set(key, {
        id: key,
        at: now,
        asset: id,
        side: row.look.side,
        pattern: row.look.label,
        result: "open",
        ticker,
        hits: row.hits,
        multiple: row.multiple,
        spotAt: spot,
        vwap,
        stdev,
        vwap5: asset.vwap5m?.vwap || 0,
        stdev5: asset.vwap5m?.stdev || 0,
        target,
      });
      changed = true;
    }
  }
  const rows = [...byId.values()];
  const why = policeLab(rows);
  if (why && !halted) {
    stopLab(why);
    writeLab(rows);
    return;
  }
  if (changed) writeLab(rows);
}

function applyHourCheck() {
  const hour = pacificHourKey();
  const prev = readHourCheck();
  if (prev.hour === hour && prev.at) return;
  keepPaper();
  const rows = readLab();
  const why = policeLab(rows);
  const halt = labHalt();
  if (why && !halt.off) stopLab(why);
  const stopped = Boolean(why) || labHalt().off;
  let profit = 0;
  let settled = 0;
  let changed = false;
  for (const row of rows) {
    if ((row.result !== "yes" && row.result !== "no") || row.scored) continue;
    row.scored = true;
    changed = true;
    settled += 1;
    profit += row.profit || 0;
  }
  if (changed) writeLab(rows);
  const cleanHours = stopped ? 0 : (prev.cleanHours || 0) + 1;
  const greenHours = stopped || (settled > 0 && profit <= 0) ? 0 : settled > 0 && profit > 0 ? (prev.greenHours || 0) + 1 : prev.greenHours || 0;
  const yes = rows.filter((row) => row.result === "yes").length;
  const no = rows.filter((row) => row.result === "no").length;
  const check: HourCheck = {
    at: new Date().toISOString(),
    hour,
    ok: !stopped,
    halted: stopped,
    reason: why || halt.reason || "",
    cleanHours,
    greenHours,
    ready: !stopped && cleanHours >= 24 && greenHours >= 24,
    profit: Math.round(profit * 100) / 100,
    open: rows.filter((row) => row.result === "open").length,
    yes,
    no,
  };
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(HOUR_CHECK, JSON.stringify(check, null, 2));
}

let labTail: Promise<void> = Promise.resolve();

function queueLab(job: () => void): Promise<void> {
  const run = labTail.then(job);
  labTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function listSymbolLab(): LabRow[] {
  return readLab();
}

export function readHourCheck(): HourCheck {
  try {
    const row = JSON.parse(readFileSync(HOUR_CHECK, "utf8")) as HourCheck;
    return { ...BLANK_CHECK, ...row };
  } catch {
    return BLANK_CHECK;
  }
}

export function syncSymbolLab(assets: Record<string, PrimeAsset> | null | undefined): Promise<void> {
  return queueLab(() => applySymbolLab(assets));
}

export function hourCheck(): Promise<void> {
  return queueLab(() => applyHourCheck());
}

export function syncLeanPaper(trades: Trade[]) {
  const byId = new Map(readLean().map((row) => [row.id, row]));
  let changed = false;
  for (const trade of trades) {
    if (!trade?.id || trade.source === "live" || trade.venue === "polymarket" || trade.probe) continue;
    if (trade.result === "open") {
      if (byId.has(trade.id)) continue;
      if (!(trade.multiple > 1 && trade.multiple <= 1.45)) continue;
      if (!leanShape(trade.patternLabel || "")) continue;
      if (!priceFavors(trade.side, trade.lastSpot, trade.target)) continue;
      byId.set(trade.id, {
        id: trade.id,
        at: trade.openedAt,
        asset: trade.asset,
        side: trade.side,
        pattern: trade.patternLabel,
        multiple: Math.round(trade.multiple * 100) / 100,
        result: "open",
      });
      changed = true;
      continue;
    }
    const row = byId.get(trade.id);
    if (!row || row.result !== "open") continue;
    const yes = (trade.profit ?? 0) > 0;
    const result = yes ? "yes" : "no";
    byId.set(trade.id, { ...row, result, profit: scaledProfit(row.multiple, result) });
    changed = true;
  }
  if (!changed) return;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(LEAN, JSON.stringify(rows, null, 2));
}

export function syncLeanLooks(assets: Record<string, PrimeAsset> | null | undefined) {
  if (!assets) return;
  const byId = new Map(readLean().map((row) => [row.id, row]));
  let changed = false;
  const now = new Date().toISOString();
  for (const id of ["btc", "gold", "silver"]) {
    const asset = assets[id];
    const ticker = asset?.market?.ticker || "";
    const spot = asset?.spot || 0;
    const target = asset?.target ?? 0;
    const left = asset?.secondsLeft ?? 0;
    if (!ticker) continue;
    for (const open of byId.values()) {
      if (open.result !== "open" || open.asset !== id || open.ticker !== ticker) continue;
      if (!(left > 0 && left <= 25 && spot > 0 && target > 0)) continue;
      const yes = open.side === "up" ? spot >= target : spot < target;
      const result = yes ? "yes" : "no";
      byId.set(open.id, { ...open, result, profit: scaledProfit(open.multiple, result) });
      changed = true;
    }
    if (!(left > 45) || !(spot > 0) || !(target > 0)) continue;
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    const looks = [...(asset?.primeLooks || [])];
    const opened = openLook(spot, frame?.vwap || 0, frame?.stdev || 0);
    if (opened && left >= 120) looks.push(opened);
    let picked: { look: Look; multiple: number } | null = null;
    for (const look of looks) {
      if (!leanShape(look.label) || !priceFavors(look.side, spot, target)) continue;
      const multiple = quoteMultiple(asset, look.side);
      if (!(multiple > 1 && multiple <= 1.45)) continue;
      picked = { look, multiple };
      break;
    }
    if (!picked) continue;
    const key = `${ticker}:${picked.look.side}:${normHit(picked.look.label)}`;
    if (byId.has(key)) continue;
    const busy = [...byId.values()].some((row) => row.result === "open" && row.asset === id && row.ticker === ticker);
    if (busy) continue;
    byId.set(key, {
      id: key,
      at: now,
      asset: id,
      side: picked.look.side,
      pattern: picked.look.label,
      multiple: picked.multiple,
      result: "open",
      ticker,
      profit: null,
    });
    changed = true;
  }
  if (!changed) return;
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  const rows = [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200);
  writeFileSync(LEAN, JSON.stringify(rows, null, 2));
}


/** Both ways of scoring the prime book, for the PRIME tab: honest, and with the 40% rule. */
export function primeRecords(): { honest: { yes: number; no: number }; forty: { yes: number; no: number }; fortyOn: boolean } {
  const peaks = readPeaks();
  const honest = { yes: 0, no: 0 };
  const forty = { yes: 0, no: 0 };
  for (const row of readPrimePaper()) {
    if (row.result !== "yes" && row.result !== "no") continue;
    const yesHonest = row.result === "yes";
    const yesForty = yesHonest || (row.result === "no" && clearedForty(row, peaks));
    honest[yesHonest ? "yes" : "no"] += 1;
    forty[yesForty ? "yes" : "no"] += 1;
  }
  return { honest, forty, fortyOn: fortyRuleOn() };
}
