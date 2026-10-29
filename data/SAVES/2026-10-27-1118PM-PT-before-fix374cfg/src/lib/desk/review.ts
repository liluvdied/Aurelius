import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Trade } from "./types";
import { trailScale } from "./paper";

const FRAMES = join(process.cwd(), "data", "entry-frames.json");
const REVIEWS = join(process.cwd(), "data", "trade-review.json");
const TABS = join(process.cwd(), "data", "element-tabs.json");
const HOURS = join(process.cwd(), "data", "hour-tabs.json");
const SETUP_HOURS = join(process.cwd(), "data", "setup-hours.json");
const REWARDS = join(process.cwd(), "data", "rewards.json");
const LESSON = join(process.cwd(), "data", "next-lesson.json");
const LEARN = join(process.cwd(), "data", "learn-notes.json");
const LEARN_MODE = join(process.cwd(), "data", "learn-mode.json");
const PAIR = join(process.cwd(), "data", "symbol-pair.json");

type Frame = {
  id: string;
  at: string;
  asset: string;
  side: string;
  pattern: string;
  multiple: number;
  ask: number;
  stake: number;
  spot: number | null;
  vwap: number | null;
  stdev: number | null;
  target: number | null;
  windowOpen: number | null;
  secondsLeft: number | null;
  hour: string;
  bands: { name: string; price: number }[];
};

type Review = {
  id: string;
  at: string;
  result: "win" | "loss";
  profit: number;
  asset: string;
  side: string;
  pattern: string;
  multiple: number;
  hour: string;
  minutesLeft: number | null;
  windowOpen: number | null;
  entrySpot: number | null;
  target: number | null;
  vwap: number | null;
  nearestBand: string;
  bandBetween: boolean;
  peakPct: number | null;
  exitPct: number | null;
  giveback: number | null;
  trail: string;
  points: number;
  better: string;
  elements: string[];
  note: string;
};

type Tab = { win: number; loss: number };
type HourCell = { win: number; loss: number; net: number };
type Lesson = {
  id: string;
  at: string;
  asset: string;
  side: string;
  pattern: string;
  rule: "late" | "vwap" | "band" | "none";
  better: string;
  spent: boolean;
};

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
}

function pacificHour(at: string): string {
  const when = new Date(at);
  if (!Number.isFinite(when.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(when);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "");
  if (!Number.isFinite(hour)) return "";
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return `${shown}${hour < 12 ? "am" : "pm"}`;
}

function bandLadder(vwap: number | null, stdev: number | null): { name: string; price: number }[] {
  if (!(vwap && vwap > 0) || !(stdev && stdev > 0)) return [];
  const rows: { name: string; price: number }[] = [{ name: "VWAP", price: Math.round(vwap * 100) / 100 }];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    rows.push({ name: `+${step}σ`, price: Math.round((vwap + step * stdev) * 100) / 100 });
    rows.push({ name: `−${step}σ`, price: Math.round((vwap - step * stdev) * 100) / 100 });
  }
  return rows;
}

function windowOpenOf(asset: { lastPrints?: { t?: number; o?: number; c?: number }[]; secondsLeft?: number; market?: { closeTime?: string } | null }): number | null {
  const prints = asset?.lastPrints || [];
  const left = asset?.secondsLeft ?? 0;
  const closeMs = asset?.market?.closeTime ? Date.parse(asset.market.closeTime) : Date.now() + left * 1000;
  if (!Number.isFinite(closeMs)) return null;
  const start = closeMs - 15 * 60 * 1000;
  const inWindow = prints.filter((print) => {
    const t = Number(print?.t);
    if (!Number.isFinite(t)) return false;
    const ms = t < 1e12 ? t * 1000 : t;
    return ms >= start - 60_000 && ms <= closeMs;
  });
  const first = inWindow[0];
  const open = Number(first?.o || first?.c);
  return open > 0 ? open : null;
}

function roomWord(asset: string, spot: number, target: number): string {
  const gap = Math.abs(spot - target);
  const tight = asset === "btc" ? 50 : asset === "gold" ? 1 : 0.05;
  const far = asset === "btc" ? 120 : asset === "gold" ? 5 : 0.2;
  if (gap <= tight) return "tight to the strike";
  if (gap >= far) return "far from the strike";
  return "";
}

function multipleWord(multiple: number): string {
  if (!(multiple > 1)) return "";
  if (multiple > 2.2) return "over 2.2x";
  if (multiple >= 1.4) return "1.4x to 2.2x";
  return "under 1.4x";
}

function reachWord(ask: number, peak: number): { tag: string; saw: number; max: number } {
  const scale = trailScale(ask);
  if (!(ask > 0.02) || !(peak > 0.02) || !(scale.maxPct > 0)) return { tag: "", saw: 0, max: 0 };
  const saw = Math.round((peak / ask - 1) * 1000) / 10;
  if (saw + 0.05 >= scale.arm) return { tag: "cleared the arm", saw, max: scale.maxPct };
  if (saw + 0.05 >= scale.watch) return { tag: "reached the watch, short of the arm", saw, max: scale.maxPct };
  if (saw > 0) return { tag: "went green, short of the watch", saw, max: scale.maxPct };
  return { tag: "never went green", saw, max: scale.maxPct };
}

function trailVerdict(reach: { tag: string; saw: number }, exitPct: number | null, early: boolean): string {
  if (reach.tag === "cleared the arm") {
    const close = exitPct != null ? `${exitPct}%` : "the close";
    const gave = exitPct != null ? reach.saw - exitPct : null;
    if (early && (gave == null || gave <= 12)) return `Trail took it. High ${reach.saw}%, out at ${close}.`;
    if (early) return `Trail saw ${reach.saw}%. Closed at ${close} before the fade.`;
    return `Trail saw ${reach.saw}% and did not take it.`;
  }
  if (reach.tag === "reached the watch, short of the arm") return "Trail was watching. It never reached the arm.";
  if (reach.tag === "went green, short of the watch") return "Trail never reached the watch.";
  return "Trail never armed.";
}

function peakBid(trade: Trade): number {
  if ((trade.highBid ?? 0) > 0.02) return trade.highBid as number;
  try {
    const gates = JSON.parse(readFileSync(join(process.cwd(), "data", "gate-high.json"), "utf8")) as Record<string, number>;
    const bid = Number(gates[trade.ticker]);
    if (bid > 0.02) return bid;
  } catch {
    // no peak stored
  }
  return 0;
}

function closedEarly(trade: Trade): boolean {
  if (trade.result === "exited") return true;
  if (/trail|gate|sold|banked|slider/i.test(trade.notes || "")) return true;
  try {
    const rows = JSON.parse(readFileSync(join(process.cwd(), "data", "exit-log.json"), "utf8")) as Array<{ ticker?: string; at?: string }>;
    const opened = Date.parse(trade.openedAt);
    return rows.some((row) => row.ticker === trade.ticker && Date.parse(row.at || "") >= opened);
  } catch {
    return false;
  }
}

function betterOf(input: {
  result: "win" | "loss";
  bandBetween: boolean;
  wrongSide: boolean;
  minutesLeft: number | null;
  night: boolean;
  giveback: number | null;
  kept: boolean;
  cleanEntry: boolean;
}): { rule: Lesson["rule"]; better: string; points: number } {
  if (input.result === "loss") {
    if (input.bandBetween) {
      return { rule: "band", points: 0, better: "A band was still between price and the strike. The next time this setup shows up that way, let it go." };
    }
    if (input.wrongSide) {
      return { rule: "vwap", points: 0, better: "Price was on the wrong side of the VWAP. The next time this setup is on the wrong side, let it go." };
    }
    if (input.minutesLeft != null && input.minutesLeft < 3) {
      return { rule: "late", points: 0, better: "It was under 3 minutes. The next time this setup is that late, let it go." };
    }
    if (input.night) {
      return { rule: "none", points: 0, better: "This hour has been the violent one. Size is already $10 after midnight. Same entry." };
    }
    return { rule: "none", points: 0, better: "The entry was the book. Nothing in the entry to change. Leave the setup on." };
  }
  let points = 1;
  if (input.cleanEntry) points += 1;
  if (input.kept) points += 1;
  if (input.giveback != null && input.giveback > 25) {
    return { rule: "none", points, better: `It hit, and she gave back ${input.giveback} points after it was green. The gate stays. Don't sell it any earlier than that.` };
  }
  return { rule: "none", points, better: "Nothing to change. Same entry next time." };
}

function bandInFront(side: string, spot: number, target: number, vwap: number, stdev: number): boolean {
  if (!(spot > 0) || !(target > 0) || !(vwap > 0) || !(stdev > 0)) return false;
  const lo = Math.min(spot, target);
  const hi = Math.max(spot, target);
  if (hi - lo < stdev * 0.05) return false;
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    for (const price of [vwap + step * stdev, vwap - step * stdev]) {
      if (price > lo && price < hi) return true;
    }
  }
  return false;
}

export function lessonHold(
  row: { asset?: string; side?: string; pattern?: string },
  asset?: { spot?: number; secondsLeft?: number; target?: number | null; vwap1m?: { vwap?: number; stdev?: number } | null; vwap5m?: { vwap?: number; stdev?: number } | null } | null,
): string {
  const mode = readJson<{ act?: boolean }>(LEARN_MODE, { act: false });
  if (mode.act !== true) return "";
  const lesson = readJson<Lesson | null>(LESSON, null);
  if (!lesson || lesson.spent || lesson.rule === "none") return "";
  if (lesson.asset !== row.asset || lesson.side !== row.side || lesson.pattern !== (row.pattern || "")) return "";
  const spot = asset?.spot || 0;
  const vwap = asset?.vwap1m?.vwap || asset?.vwap5m?.vwap || 0;
  const stdev = asset?.vwap1m?.stdev || asset?.vwap5m?.stdev || 0;
  const left = asset?.secondsLeft ?? 9999;
  const target = asset?.target ?? 0;
  const side = row.side || "";
  let repeats = false;
  if (lesson.rule === "late") repeats = left < 180;
  if (lesson.rule === "vwap" && spot > 0 && vwap > 0) repeats = side === "up" ? spot < vwap : spot > vwap;
  if (lesson.rule === "band") repeats = bandInFront(side, spot, target, vwap, stdev);
  writeJson(LESSON, { ...lesson, spent: true });
  if (!repeats) return "";
  return lesson.better;
}

function normLabel(label: string): string {
  return String(label || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
}

function primeCount(asset: string, side: string, label: string): { yes: number; no: number } {
  const head = normLabel(label);
  const id = String(asset || "").toLowerCase();
  let yes = 0;
  let no = 0;
  try {
    const rows = JSON.parse(readFileSync(join(process.cwd(), "data", "prime-paper.json"), "utf8")) as Array<{ asset?: string; side?: string; pattern?: string; result?: string }>;
    for (const row of rows) {
      if (String(row.asset || "").toLowerCase() !== id || row.side !== side) continue;
      if (normLabel(row.pattern || "") !== head) continue;
      if (row.result === "yes") yes += 1;
      else if (row.result === "no") no += 1;
    }
  } catch {
    // no paper record yet
  }
  return { yes, no };
}

type FormingAsset = {
  spot?: number;
  target?: number | null;
  secondsLeft?: number;
  market?: { ticker?: string } | null;
  vwap1m?: { vwap?: number; stdev?: number } | null;
  vwap5m?: { vwap?: number; stdev?: number } | null;
  primeLooks?: { label?: string; side?: string }[];
};

export function noteForming(assets: Record<string, FormingAsset> | null | undefined) {
  if (!assets) return;
  const book = readJson<Record<string, Record<string, { win: number; loss: number }>>>(SETUP_HOURS, {});
  const notes = readJson<Array<{ key?: string; at?: string; kind?: string; text?: string }>>(LEARN, []);
  const now = new Date().toISOString();
  let wrote = false;
  for (const [id, asset] of Object.entries(assets)) {
    const name = id === "btc" ? "Bitcoin" : id === "gold" ? "Gold" : id === "silver" ? "Silver" : "";
    const ticker = asset?.market?.ticker || "";
    if (!name || !ticker) continue;
    for (const look of asset.primeLooks || []) {
      if (!look?.label || (look.side !== "up" && look.side !== "down")) continue;
      const count = primeCount(id, look.side, look.label);
      if (!(count.yes + count.no >= 1)) continue;
      const key = `${ticker}|${look.side}|${normLabel(look.label)}`;
      if (notes.some((row) => row.key === key)) continue;
      const way = look.side === "up" ? "long" : "short";
      const setup = `${name} ${way} ${look.label}`;
      const prime = count.yes >= 2 && count.yes > count.no;
      const hour = pacificHour(now);
      const cell = book[setup]?.[hour];
      const atHour = cell ? ` At ${hour} that one is ${cell.win}-${cell.loss}.` : "";
      const left = asset.secondsLeft != null ? Math.max(0, Math.round(asset.secondsLeft / 60)) : null;
      const spot = asset.spot || 0;
      const vwap = asset.vwap1m?.vwap || asset.vwap5m?.vwap || 0;
      const stdev = asset.vwap1m?.stdev || asset.vwap5m?.stdev || 0;
      const target = asset.target ?? 0;
      const band = bandInFront(look.side, spot, target, vwap, stdev);
      const wrong = spot > 0 && vwap > 0 && (look.side === "up" ? spot < vwap : spot > vwap);
      const bits = [band ? "a band is still in front" : "", wrong ? "price is on the wrong side of the VWAP" : "", left != null && left < 3 ? "under 3 minutes" : ""].filter(Boolean);
      const shape = bits.length ? bits.join(", ") : "clean so far";
      notes.unshift({
        key,
        at: now,
        kind: "forming",
        text: `${setup} is forming${left != null ? `, ${left}m left` : ""}. ${prime ? "This is a prime setup" : "Not prime yet"}, ${count.yes}-${count.no}.${atHour} ${shape}. Note only.`,
      });
      wrote = true;
    }
  }
  if (wrote) writeJson(LEARN, notes.slice(0, 80));
}

export function noteOpen(trade: Trade, asset?: { spot?: number; target?: number | null; secondsLeft?: number; vwap1m?: { vwap?: number; stdev?: number } | null; vwap5m?: { vwap?: number; stdev?: number } | null; lastPrints?: { t?: number; o?: number; c?: number }[]; market?: { closeTime?: string } | null } | null) {
  if (!trade?.id) return;
  const frames = readJson<Record<string, Frame>>(FRAMES, {});
  const vwap = asset?.vwap1m?.vwap || asset?.vwap5m?.vwap || trade.entryVwap || null;
  const stdev = asset?.vwap1m?.stdev || asset?.vwap5m?.stdev || null;
  frames[trade.id] = {
    id: trade.id,
    at: trade.openedAt,
    asset: trade.asset,
    side: trade.side,
    pattern: trade.patternLabel || "",
    multiple: trade.multiple,
    ask: trade.ask,
    stake: trade.stake,
    spot: asset?.spot || trade.lastSpot || null,
    vwap: vwap && vwap > 0 ? vwap : null,
    stdev: stdev && stdev > 0 ? stdev : null,
    target: asset?.target ?? trade.target ?? null,
    windowOpen: asset ? windowOpenOf(asset) : null,
    secondsLeft: asset?.secondsLeft ?? null,
    hour: pacificHour(trade.openedAt),
    bands: bandLadder(vwap && vwap > 0 ? vwap : null, stdev && stdev > 0 ? stdev : null),
  };
  writeJson(FRAMES, frames);
}

export function rememberEntry(trade: Trade) {
  if (!trade?.id) return;
  const frames = readJson<Record<string, Frame>>(FRAMES, {});
  if (frames[trade.id]) return;
  const vwap = trade.entryVwap ?? null;
  frames[trade.id] = {
    id: trade.id,
    at: trade.openedAt,
    asset: trade.asset,
    side: trade.side,
    pattern: trade.patternLabel || "",
    multiple: trade.multiple,
    ask: trade.ask,
    stake: trade.stake,
    spot: trade.lastSpot ?? null,
    vwap,
    stdev: null,
    target: trade.target ?? null,
    windowOpen: null,
    secondsLeft: null,
    hour: pacificHour(trade.openedAt),
    bands: [],
  };
  const ids = Object.keys(frames);
  if (ids.length > 500) {
    for (const id of ids.slice(0, ids.length - 500)) delete frames[id];
  }
  writeJson(FRAMES, frames);
}

export function reviewClose(trade: Trade) {
  if (!trade?.id || trade.result === "open") return;
  const profit = trade.profit ?? 0;
  const result: "win" | "loss" = profit > 0 ? "win" : "loss";
  const frames = readJson<Record<string, Frame>>(FRAMES, {});
  const frame = frames[trade.id];
  const asset = trade.asset;
  const side = trade.side;
  const pattern = trade.patternLabel || frame?.pattern || "";
  const multiple = trade.multiple || frame?.multiple || 0;
  const spot = frame?.spot ?? null;
  const vwap = frame?.vwap ?? trade.entryVwap ?? null;
  const target = frame?.target ?? trade.target ?? null;
  const ask = trade.ask || frame?.ask || 0;
  const elements: string[] = [];
  const name = asset === "btc" ? "Bitcoin" : asset === "gold" ? "Gold" : "Silver";
  const way = side === "up" ? "long" : "short";
  elements.push(`${name} ${way}`);
  if (pattern) elements.push(pattern);
  const mult = multipleWord(multiple);
  if (mult) elements.push(mult);
  let wrongSide = false;
  if (spot && vwap) {
    if (side === "up") {
      wrongSide = spot < vwap;
      elements.push(wrongSide ? "long under the VWAP" : "long above the VWAP");
    } else {
      wrongSide = spot > vwap;
      elements.push(wrongSide ? "short above the VWAP" : "short below the VWAP");
    }
  }
  if (spot && target) {
    const through = side === "up" ? spot >= target : spot <= target;
    elements.push(through ? "already through the strike" : "still coming into the strike");
    const gap = roomWord(asset, spot, target);
    if (gap) elements.push(gap);
  }
  const reach = reachWord(ask, peakBid(trade));
  if (reach.tag) elements.push(reach.tag);
  const exitBid = trade.contracts > 0 ? (trade.stake + profit) / trade.contracts : 0;
  const exitPct = ask > 0.02 && exitBid > 0.02 ? Math.round((exitBid / ask - 1) * 1000) / 10 : null;
  const peakPct = reach.max > 0 ? reach.saw : null;
  const giveback = peakPct != null && exitPct != null ? Math.round((peakPct - exitPct) * 10) / 10 : null;
  const hour = frame?.hour || pacificHour(trade.openedAt || trade.closedAt || "");
  const minutesLeft = frame?.secondsLeft != null ? Math.max(0, Math.round(frame.secondsLeft / 60)) : null;
  if (hour) elements.push(hour);
  if (minutesLeft != null) {
    if (minutesLeft < 3) elements.push("under 3 minutes");
    else if (minutesLeft <= 8) elements.push("3 to 8 minutes");
    else elements.push("over 8 minutes");
  }
  const night = /^(12|1|2|3|4|5)am$/.test(hour);
  if (night) elements.push("after midnight");
  let nearestBand = "";
  let bandBetween = false;
  if (spot && target && frame?.bands?.length) {
    let best = frame.bands[0];
    for (const row of frame.bands) {
      if (Math.abs(row.price - spot) < Math.abs(best.price - spot)) best = row;
    }
    nearestBand = best.name;
    const lo = Math.min(spot, target);
    const hi = Math.max(spot, target);
    bandBetween = frame.bands.some((row) => row.name !== "VWAP" && row.price > lo && row.price < hi);
    if (bandBetween) elements.push("band between price and the strike");
    else elements.push("no band between price and the strike");
  }
  elements.push(closedEarly(trade) ? "closed before the bell" : "held to the bell");
  const trail = trailVerdict(reach, exitPct, closedEarly(trade));
  elements.push(trail);
  if (trade.lastSpot && target && trade.lastSpot !== spot) {
    const right = side === "up" ? trade.lastSpot >= target : trade.lastSpot < target;
    elements.push(right ? "finished on the right side of the strike" : "finished on the wrong side of the strike");
  }
  const kept = reach.tag === "cleared the arm" || (giveback != null && giveback <= 15 && (peakPct ?? 0) > 0);
  const cleanEntry = !bandBetween && !wrongSide && (minutesLeft == null || minutesLeft >= 3) && !(multiple > 2.2);
  const lesson = betterOf({ result, bandBetween, wrongSide, minutesLeft, night, giveback, kept, cleanEntry });
  const money = `${profit < 0 ? "−" : "+"}$${Math.abs(profit).toFixed(2)}`;
  const clock = [hour, minutesLeft != null ? `${minutesLeft}m left` : ""].filter(Boolean).join(", ");
  const reachLine = reach.max > 0 ? ` Max ${reach.max}%, saw ${reach.saw}%${exitPct != null ? `, closed at ${exitPct}%` : ""}${giveback != null && giveback > 0 ? `, gave back ${giveback}` : ""}.` : "";
  const note = `${name} ${way}${pattern ? ` ${pattern}` : ""} ${result === "win" ? "won" : "lost"} ${money}${clock ? ` (${clock})` : ""}. ${elements.filter((item) => item !== hour).slice(2).join(". ")}.${reachLine} ${trail} ${lesson.better}`;
  const review: Review = {
    id: trade.id,
    at: trade.closedAt || new Date().toISOString(),
    result,
    profit: Math.round(profit * 100) / 100,
    asset,
    side,
    pattern,
    multiple: Math.round(multiple * 100) / 100,
    hour,
    minutesLeft,
    windowOpen: frame?.windowOpen ?? null,
    entrySpot: spot,
    target,
    vwap,
    nearestBand,
    bandBetween,
    peakPct,
    exitPct,
    giveback,
    trail,
    points: lesson.points,
    better: lesson.better,
    elements,
    note,
  };
  const reviews = readJson<Review[]>(REVIEWS, []);
  if (reviews.some((row) => row.id === review.id)) return;
  writeJson(REVIEWS, [review, ...reviews].slice(0, 400));
  const tabs = readJson<Record<string, Tab>>(TABS, {});
  const keys = [pattern ? `${name} ${way} ${pattern}` : `${name} ${way}`, ...elements.slice(2)];
  for (const key of keys) {
    const tab = tabs[key] || { win: 0, loss: 0 };
    tab[result] += 1;
    tabs[key] = tab;
  }
  writeJson(TABS, tabs);
  if (hour && pattern) {
    const book = readJson<Record<string, Record<string, HourCell>>>(SETUP_HOURS, {});
    const setup = `${name} ${way} ${pattern}`;
    const cells = book[setup] || {};
    const cell = cells[hour] || { win: 0, loss: 0, net: 0 };
    cell[result] += 1;
    cell.net = Math.round((cell.net + profit) * 100) / 100;
    cells[hour] = cell;
    book[setup] = cells;
    writeJson(SETUP_HOURS, book);
  }
  if (hour) {
    const hours = readJson<Record<string, HourCell>>(HOURS, {});
    const row = hours[hour] || { win: 0, loss: 0, net: 0 };
    row[result] += 1;
    row.net = Math.round((row.net + profit) * 100) / 100;
    hours[hour] = row;
    writeJson(HOURS, hours);
  }
  writeJson(LESSON, {
    id: trade.id,
    at: review.at,
    asset,
    side,
    pattern,
    rule: lesson.rule,
    better: lesson.better,
    spent: lesson.rule === "none",
  } satisfies Lesson);
  const rewards = readJson<{ points: number; hits: number; log: { id: string; at: string; points: number; better: string }[] }>(REWARDS, { points: 0, hits: 0, log: [] });
  if (!rewards.log.some((row) => row.id === trade.id)) {
    rewards.points += lesson.points;
    if (result === "win") rewards.hits += 1;
    rewards.log.unshift({ id: trade.id, at: review.at, points: lesson.points, better: lesson.better });
    rewards.log = rewards.log.slice(0, 200);
    writeJson(REWARDS, rewards);
  }
  const learned = readJson<Array<{ key?: string; at?: string; kind?: string; text?: string }>>(LEARN, []);
  learned.unshift({
    key: `close|${trade.id}`,
    at: review.at,
    kind: "closed",
    text: `${name} ${way}${pattern ? ` ${pattern}` : ""} ${result === "win" ? "hit" : "lost"}. ${lesson.better} Not applied.`,
  });
  writeJson(LEARN, learned.slice(0, 80));
  if (result === "loss") {
    const file = join(process.cwd(), "data", "loss-notes.json");
    const notes = readJson<Array<{ at: string; text: string }>>(file, []);
    if (!notes.some((row) => row.text === review.note)) {
      const summary = notes[0]?.text?.startsWith("Since the first") ? notes[0] : null;
      const rest = summary ? notes.slice(1) : notes;
      rest.unshift({ at: review.at, text: review.note });
      const next = summary ? [summary, ...rest] : rest;
      writeJson(file, next.slice(0, 200));
    }
  }
  pairWatch(asset);
}

function tickerOf(id: string): string {
  return id.startsWith("held-") ? id.slice(5) : "";
}

function primeRow(id: string): { pattern: string; result: string } | null {
  const ticker = tickerOf(id);
  if (!ticker) return null;
  try {
    const rows = JSON.parse(readFileSync(join(process.cwd(), "data", "prime-paper.json"), "utf8")) as { ticker?: string; pattern?: string; result?: string }[];
    const row = Array.isArray(rows) ? rows.find((item) => item.ticker === ticker) : null;
    if (!row) return null;
    return { pattern: row.pattern || "", result: row.result || "" };
  } catch {
    return null;
  }
}

function pairCause(row: Review): { ours: boolean; line: string } {
  const prime = primeRow(row.id);
  const name = prime?.pattern || row.pattern || "the setup";
  if (row.bandBetween) {
    return { ours: true, line: `${name} had a band in front. That path is already blocked. The setup stays.` };
  }
  if (prime?.result === "yes" && row.profit < 0) {
    return { ours: false, line: `${name} finished right on the book and the cash lost at the bell. Not an entry error. It stays.` };
  }
  if (row.entrySpot == null && !row.nearestBand) {
    return { ours: false, line: `${name} lost, and the cash ticket had no chart, so it is not scored as a clean market loss. The setup stays. A band in front is already blocked.` };
  }
  if (prime?.result === "no") {
    return { ours: false, line: `${name} was on the book and the market finished the other way. It stays.` };
  }
  return { ours: false, line: `${name} lost. Nothing on the entry to change. It stays.` };
}

export function pairWatch(asset: string) {
  const reviews = readJson<Review[]>(REVIEWS, []);
  const mine = reviews.filter((row) => row.asset === asset);
  const last = mine.slice(0, 2);
  if (last.length < 2 || last.some((row) => row.result !== "loss")) return;
  const key = last.map((row) => row.id).join("|");
  const book = readJson<Record<string, { key: string; at: string; cause: string; note: string }>>(PAIR, {});
  if (book[asset]?.key === key) return;
  const parts = last.map(pairCause);
  const ours = parts.some((part) => part.ours);
  const note = parts.map((part) => part.line).join(" ");
  book[asset] = { key, at: new Date().toISOString(), cause: ours ? "ours" : "market", note };
  writeJson(PAIR, book);
  const learned = readJson<Array<{ key?: string; at?: string; kind?: string; text?: string }>>(LEARN, []);
  learned.unshift({
    key: `pair|${asset}|${key}`,
    at: new Date().toISOString(),
    kind: "pair",
    text: `${asset} lost two in a row. ${ours ? "One was on us." : "Not an entry error."} ${note} Not applied as a ban.`,
  });
  writeJson(LEARN, learned.slice(0, 80));
}
