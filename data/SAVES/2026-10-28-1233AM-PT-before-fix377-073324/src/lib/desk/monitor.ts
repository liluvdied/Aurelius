// MONITOR (Claude, 2026-10-01). Watches. Never trades, never edits the model.
//
// 1. Model sentinel: fingerprints the files that decide her trades. If any of them changes
//    without being approved, it raises a flag. No more silent swaps onto a different model.
// 2. Trade review: after every live win and loss, it writes what happened and what the data
//    says could be better: right side of the band, entry timing, how far it ran before it
//    turned, whether the take-profit was reached, and the setup's own record.
//    Lessons are suggestions for Love. Nothing here changes how she trades.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { bandInWay } from "./auto";
import { trailScale } from "./paper";

// + the band-lock files (Oct 16 ~1:42 PM PT, Love: "yes" to the tripwire): any change to them pauses live entries until she approves.
const MODEL_FILES = ["engine.ts", "prime-book.ts", "kalshi-live.server.ts", "paper.ts", "auto.ts", "setup.ts", "vwap.ts", "scan.ts", "kalshi.ts", "goldlaw.ts", "pivotbooks.ts", "bandlock.ts", "quotes.ts"];
const dataPath = (name: string) => join(process.cwd(), "data", name);
const g = globalThis as unknown as { __monitorAt?: number; __stateLast?: string; __bootLogged?: number };

// STATE RECORDER: logs every switch that can make her look "off", and every server boot.
function stateNow() {
  const sw = readJson<{ live?: boolean; route?: string; lockWin?: { on?: boolean }; channelRule?: boolean }>("live-switch.json", {});
  return {
    live: sw.live === true,
    entries: readJson<{ off?: boolean }>("halt.json", {}).off !== true,
    scale75: readJson<{ on?: boolean }>("scale75.json", {}).on !== false,
    paperLive: readJson<{ on?: boolean }>("paper-live.json", {}).on === true,
    bookMode: readJson<{ mode?: string }>("book-mode.json", {}).mode ?? "",
    lockWin: sw.lockWin?.on === true,
    channelRule: sw.channelRule !== false,
  };
}
function logState(event: string, detail: Record<string, unknown>) {
  const rows = readJson<any[]>("state-log.json", []);
  rows.unshift({ at: new Date().toISOString(), event, ...detail });
  writeJson("state-log.json", rows.slice(0, 300));
}
if (g.__bootLogged !== process.pid) {
  g.__bootLogged = process.pid;
  try {
    logState("server start", { pid: process.pid });
  } catch {
    // never stop the desk
  }
}

function readJson<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(dataPath(name), "utf8")) as T;
  } catch {
    return fallback;
  }
}
function writeJson(name: string, value: unknown) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(dataPath(name), JSON.stringify(value, null, 1));
  } catch {
    // monitoring must never stop the desk
  }
}

export function modelFingerprint(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of MODEL_FILES) {
    try {
      out[f] = createHash("sha256").update(readFileSync(join(process.cwd(), "src", "lib", "desk", f))).digest("hex").slice(0, 16);
    } catch {
      out[f] = "missing";
    }
  }
  return out;
}

/** Record the current files as the approved model. Claude runs this after every reviewed change. */
export function approveModel(note: string) {
  writeJson("approved-model.json", { at: new Date().toISOString(), note, files: modelFingerprint() });
}

export type Review = {
  ticker: string;
  at: string;
  asset: string;
  side: string;
  setup: string;
  multiple: number;
  profit: number;
  result: "win" | "loss";
  entry: { spot: number | null; band: string | null; distSigma: number | null; rightSide: boolean | null; bandAhead: boolean | null; throughTarget: boolean | null; minuteIn: number | null } | null;
  peakPct: number | null;
  maxPct: number;
  takeProfitPct: number;
  exit: string;
  record: string;
  flags: string[];
  lessons: string[];
};

function nearestBand(spot: number, vwap: number, stdev: number) {
  let best = { name: "VWAP", price: vwap };
  for (const s of [0.5, 1, 1.5, 2, 2.5, 3]) {
    for (const [name, price] of [[`+${s}σ`, vwap + s * stdev], [`-${s}σ`, vwap - s * stdev]] as [string, number][]) {
      if (Math.abs(price - spot) < Math.abs(best.price - spot)) best = { name, price };
    }
  }
  return best;
}

function reviewOne(b: any, fires: any[], exits: any[], hits: Record<string, { yes: number; no: number }>, shadow: any[]): Review {
  const ask = Number(b.ask) || 0;
  const maxPct = ask > 0 ? Math.round((1 / ask - 1) * 1000) / 10 : 0;
  const tp = ask > 0 ? trailScale(ask).arm : 0;
  const peakPct = ask > 0 && Number(b.peak) > 0 ? Math.round((Number(b.peak) / ask - 1) * 1000) / 10 : null;
  const fire = fires.find((f) => f.ticker === b.ticker);
  const exit = exits.find((e) => e.ticker === b.ticker);
  const setup = String(fire?.setup || (b.pattern !== "Live" ? b.pattern : "") || "unknown");
  const flags: string[] = [];
  const lessons: string[] = [];
  let entry: Review["entry"] = null;
  if (fire && fire.spot > 0 && fire.vwap > 0 && fire.stdev > 0) {
    const nb = nearestBand(fire.spot, fire.vwap, fire.stdev);
    const rightSide = b.side === "up" ? nb.price <= fire.spot : nb.price >= fire.spot;
    const ahead = bandInWay(b.side, fire.spot, fire.vwap, fire.stdev, b.asset);
    const through = fire.target > 0 ? (b.side === "up" ? fire.spot > fire.target : fire.spot < fire.target) : null;
    const minuteIn = fire.secondsLeft != null ? Math.round(((900 - fire.secondsLeft) / 60) * 10) / 10 : null;
    entry = { spot: fire.spot, band: nb.name, distSigma: Math.round((Math.abs(fire.spot - nb.price) / fire.stdev) * 100) / 100, rightSide, bandAhead: ahead, throughTarget: through, minuteIn };
    if (!rightSide) flags.push(`Entered on the wrong side of ${nb.name}: ${b.side === "up" ? "long just under it" : "short just over it"}.`);
    if (ahead) flags.push(`A band was directly in front of the ${b.side === "up" ? "long" : "short"} at entry.`);
    if (minuteIn != null && minuteIn > 10) flags.push(`Late entry: ${minuteIn} minutes into the window.`);
  } else {
    lessons.push("No entry snapshot for this one (it filled before the snapshot logger, or through another path).");
  }
  const profit = Number(b.profit) || 0;
  const result: "win" | "loss" = profit >= 0 ? "win" : "loss";
  if (peakPct != null && tp > 0) {
    if (result === "loss" && peakPct >= tp) flags.push(`Reached the take-profit (+${peakPct}% vs +${tp}%) and still lost. The sale was missed.`);
    else if (result === "loss" && peakPct >= tp * 0.5) {
      const could = Math.round((Number(b.stake) || 0) * (peakPct * 0.8) / 100 * 100) / 100;
      lessons.push(`Ran to +${peakPct}% before turning. Selling around +${Math.round(peakPct * 0.8)}% would have banked about $${could.toFixed(2)} instead of ${profit < 0 ? "−" : ""}$${Math.abs(profit).toFixed(2)}.`);
    } else if (result === "win" && exit && peakPct > Number(exit.bidPct) + 15) {
      lessons.push(`Sold at +${exit.bidPct}%, but it ran to +${peakPct}%. This setup may deserve a higher line.`);
    } else if (result === "loss" && peakPct < 5) {
      lessons.push("Never went green. The entry itself was wrong, not the exit.");
    }
  }
  const key = `${setup.replace(/−/g, "-").replace(/\s+/g, " ").trim()}|${b.side}|${b.asset}`;
  const rec = hits[key];
  const record = rec ? `${rec.yes}-${rec.no} (${Math.round((rec.yes / Math.max(1, rec.yes + rec.no)) * 100)}%)` : "no record yet";
  if (rec && rec.yes + rec.no >= 6 && rec.yes / (rec.yes + rec.no) < 0.5) lessons.push(`This setup is ${record} on her record. It loses more than it wins.`);
  const sh = shadow.find((s) => s.ticker === b.ticker);
  if (sh) lessons.push(sh.side === b.side ? `The rejection shadow agreed (${sh.side === "up" ? "long" : "short"} off ${sh.band}).` : `The rejection shadow went the other way (${sh.side === "up" ? "long" : "short"} off ${sh.band}).`);
  if (!flags.length && result === "win") lessons.unshift(exit ? "Clean: right side of the band, nothing in front, sold on plan." : "Clean: right side of the band, nothing in front, won at the bell.");
  return {
    ticker: b.ticker,
    at: b.at,
    asset: b.asset,
    side: b.side,
    setup,
    multiple: Number(b.multiple) || (ask > 0 ? Math.round((1 / ask) * 100) / 100 : 0),
    profit,
    result,
    entry,
    peakPct,
    maxPct,
    takeProfitPct: tp,
    exit: exit ? String(exit.reason) : "held to the bell",
    record,
    flags,
    lessons,
  };
}

/** Called from the engine tick. Runs at most every 20 seconds. */
export function monitorTick() {
  if (g.__monitorAt && Date.now() - g.__monitorAt < 20000) return;
  g.__monitorAt = Date.now();
  try {
    const now = stateNow();
    const key = JSON.stringify(now);
    if (g.__stateLast && g.__stateLast !== key) {
      const before = JSON.parse(g.__stateLast);
      const changed: Record<string, unknown> = {};
      for (const k of Object.keys(now)) if ((now as any)[k] !== before[k]) changed[k] = `${before[k]} -> ${(now as any)[k]}`;
      logState("switch changed", changed);
    }
    g.__stateLast = key;
  } catch {
    // never stop the desk
  }
  // 1. Model sentinel
  const approved = readJson<{ at?: string; files?: Record<string, string> }>("approved-model.json", {});
  const now = modelFingerprint();
  const changed = approved.files ? Object.keys(now).filter((f) => approved.files?.[f] !== now[f]) : [];
  const sw = readJson<{ live?: boolean; route?: string; shiftStart?: string }>("live-switch.json", {});
  const halt = readJson<{ off?: boolean; reason?: string }>("halt.json", {});
  const notes: string[] = [];
  if (halt.off) notes.push(`Entries are halted: ${halt.reason || "no reason given"}`);
  writeJson("monitor.json", {
    at: new Date().toISOString(),
    modelOk: !!approved.files && changed.length === 0,
    approvedAt: approved.at || null,
    changed,
    live: sw.live === true,
    notes,
  });
  // 2. Trade reviews
  const from = sw.shiftStart || "2026-10-02T01:58:00.000Z";
  const fills = readJson<any[]>("fill-log.json", []);
  const banked = new Map<string, any>();
  for (const r of fills) {
    if (r?.venue !== "kalshi" || r.kind !== "banked" || r.profit == null || String(r.at) < from) continue;
    const cur = banked.get(r.ticker);
    if (cur) cur.profit = Number(cur.profit) + Number(r.profit);
    else banked.set(r.ticker, { ...r });
  }
  const done = readJson<Record<string, Review>>("claude-review.json", {});
  let fresh = false;
  const fires = readJson<any[]>("live-fires.json", []);
  const exits = readJson<any[]>("exit-log.json", []);
  const hits = readJson<{ counts?: Record<string, { yes: number; no: number }> }>("hit-book.json", {}).counts || {};
  const shadow = readJson<any[]>("shadow-reject.json", []);
  for (const [ticker, b] of banked) {
    if (done[ticker] && Math.abs(done[ticker].profit - Number(b.profit)) < 0.01) continue;
    done[ticker] = reviewOne(b, fires, Array.isArray(exits) ? exits : [], hits, shadow);
    fresh = true;
  }
  if (fresh) writeJson("claude-review.json", done);
}

export function readMonitor() {
  return {
    status: readJson<{ modelOk?: boolean; changed?: string[]; approvedAt?: string | null; notes?: string[]; at?: string }>("monitor.json", {}),
    reviews: readJson<Record<string, Review>>("claude-review.json", {}),
  };
}
