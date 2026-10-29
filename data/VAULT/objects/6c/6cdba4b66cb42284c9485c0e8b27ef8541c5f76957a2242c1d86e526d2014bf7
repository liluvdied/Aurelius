import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readySpine, spineOwns } from "./spine-ready";
import { autoDecision, bandBetween, bandInWay, brokeUnder, closeByBand, closedThrough, offList, primeLabel, shortBandOnTarget, shortTap, survivalBlock, underBand, winningSetup } from "./auto";
import { readBook, writeBook } from "./book";
import { readFillLog } from "./fill-log";
import { goldHaltFill, goldHalted } from "./hours";
import { bandBank, bandBreak, bandInTheWay, bandNear, catchPct, clampTrail, closeEnough, exitTargetPct, flipped, gateStep, keepGreen, legalSide, markTrade, midBand, newId, noteFour, proveGate, quoteSale, saleCall, screenBid, settleSide, smallTicket, targetKiss, tenVwapWall, tpGates, trailCatch, trailScale, vwapSitsBetween, windowStillOpen } from "./paper";
import { farBandProbe } from "./probe";
import { scanDesk } from "./scan";
import { lateWindow, vwapAgrees } from "./setup";
import { noteBlock as noteGuard } from "./live-guard";
import { shadowSettle, shadowTick } from "./shadow";
import { lottoSettle, lottoTick } from "./lotto";
import { bandRejectNow } from "./tap";
import { navCrossSetup } from "./navcross";
import { navTapeTick } from "./navtape";
import { nightConsider, nightSettle, nightTick, setLiveHook } from "./nightbook";
import { dnaLog, dnaNow, dnaNowFrame, dnaZone, dnaFrameCheck } from "./dna";
import { monitorTick } from "./monitor";
import { hourCheck, listOwnPaper, listPrimePaper, markOwnLive, onPrimeBook, paperNeedsLink, primeCandidate, primeOwns, stampPrime, syncDecided, syncFuelPaper, syncHalfLooks, syncHitPaper, syncOwnPaper, syncPrimeLooks, syncSilverLearn, syncSymbolLab } from "./prime-book";
import { lessonHold, noteForming, noteOpen } from "./review";
import { scoreMirror } from "./mirror";
import { flagBetween } from "./watchdog";
import { quoteTick } from "./quotes";
import { turnNow } from "./bandlock";

var g = globalThis;
// A Kalshi position one of her books copied (live-book-done.json says filled on that ticker), vs a trade Love opened herself.
/** The live-book-done row that owns this ticker's live position ("TICKER:book"), or null. */
// ONE PARSE PER CHANGE (Oct 20 ~2:52 PM PT, Love: "reduce any friction ... make sure she's free to sprint"): live-book-done.json is ~2 MB and
// bookOwnerOf parsed it ~28 times every 10 s (data/slow-ops.jsonl, ~130 ms of a stalled loop). Re-read only when its time stamp or size moves.
// Read-only callers only - nothing may edit the returned object.
function doneDocCached() {
  const p = join(process.cwd(), "data", "live-book-done.json");
  const st = statSync(p);
  const G0 = globalThis as any;
  const c = G0.__doneDoc;
  if (c && c.m === st.mtimeMs && c.s === st.size) return c.v;
  const v = JSON.parse(readFileSync(p, "utf8"));
  G0.__doneDoc = { m: st.mtimeMs, s: st.size, v };
  return v;
}
function bookOwnerOf(ticker) {
  try {
    const done = doneDocCached();
    let best = null;
    for (const [k, v] of Object.entries(done)) {
      if ((v?.status === "filled" || v?.status === "partial") && (v.ticker || k.split(":")[0]) === ticker && (!best || String(v.at) < String(best.v.at))) best = { id: k, v };
    }
    return best;
  } catch {
    return null;
  }
}
// YOUR HAND TRADE IS YOURS (Oct 18 ~12:45 PM PT, Love: "i entered long on btc for $2. she closed it, can you make that stop happening"). 12:39 PM:
// TOGETHER's short on KXBTC15M-...181545 had sold half; she bought YES by hand on the same market; when the paper short sold, the mirror
// flattened the whole ticker - her long. A ticker a book traded is the book's position only while the live position is still on the book's
// side. On the other side it is her hand trade: no mirror, no book exits, no add-on.
// HER OFF HOURS ON THE MAIN BOOK AT $5 (fix142, Oct 23 ~1:20 PM PT, Love: "keep her on $5 for her off hours and route all the delayed entry model orders to
// polymarket ... just $5, structured the same way $2 initially, and we will do at 2.8x + for the $3 add on during her off hours. next band she comes into
// interaction with, no rejection needed / same way, if it's coming closer let her get the best multiple she can, if it flips red or green near the band she can
// do the add on of $3 anywhere over 2.8x +"): in TOGETHER's off hours (live-switch bookSkipHours["recon-tog"]) with offHourMain.on, the main book trades Kalshi
// at offHourMain.dollars flat, and her add-on is offHourMain.addOn { dollars, maxAsk }. The twin is off Kalshi (liveBook.books) and trades Polymarket (polyTwin).
// HOURS BY ASSET (fix243, Oct 25 ~10:30 PM PT, Love: "yes every hour you just said hun 🎯 let them take the best performing hours per model per book"): live-switch
// offHourMain.rejHoursByAsset { gold: [..], btc: [..] } = the rejection model's hours per asset; an asset without a list falls back to offHourMain.rejHours.
const skipHrsA = (sw: any, book: string, asset: any): any => { const m = sw?.bookSkipHoursByAsset?.[String(asset || "").toLowerCase()]?.[book]; return Array.isArray(m) ? m : sw?.bookSkipHours?.[book]; }; // HOURS PER ASSET (fix278, Oct 26 ~12:25 PM PT, Love: "could you add in the ability to shift the individual assets to individual books on the schedule? ... i tried to only change gold, and it changed both books"): live-switch bookSkipHoursByAsset { btc|gold: { book: [PT hours] } } - an asset with its own list follows it, else bookSkipHours.
function rjA(om: any, a: any): number[] { const m = om?.rejHoursByAsset?.[String(a || "").toLowerCase()]; return Array.isArray(m) ? m.map(Number) : Array.isArray(om?.rejHours) ? om.rejHours.map(Number) : []; }
function offHourMain(asset?: string): { dollars: number; aoDollars: number; aoMax: number } | null {
  try {
    const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
    const om = sw?.offHourMain; if (!om || om.on !== true) return null;
    const hrs = skipHrsA(sw, "recon-tog", asset); const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24; // fix278: per asset
    if (!((Array.isArray(hrs) && hrs.map(Number).includes(h)) || rjA(om, asset).includes(h))) return null; // fix145: her rejection hours too (fix243: per asset)
    const d = Number(om.dollarsByHour?.[String(h)] ?? om.dollars), ad = Number(om.addOn?.dollarsByHour?.[String(h)] ?? om.addOn?.dollars), am = Number(om.addOn?.maxAsk); // fix289 (Oct 26 ~2:50 PM PT, Love: "we can put it on $2 and $3 for the add on for 2pm pls hun 2pm is the worst"): per-hour entry + add-on
    return d >= 1 && d <= 100 ? { dollars: d, aoDollars: ad > 0 ? ad : 3, aoMax: am > 0 && am < 1 ? am : 0.357 } : null;
  } catch { return null; }
}
function botOwnsPosition(row: any): boolean {
  if (!bookOwnedTicker(row.ticker)) return false;
  const o: any = bookOwnerOf(row.ticker);
  const s = String(o?.v?.side || "");
  if (s !== "up" && s !== "down") return true;
  return (s === "up") === (Number(row.pos) > 0);
}
function bookOwnedTicker(ticker) {
  try {
    const c = g.__aureliusBookOwned;
    if (c && Date.now() - c.at < 5000) return c.set.has(ticker);
    const done = JSON.parse(readFileSync(join(process.cwd(), "data", "live-book-done.json"), "utf8"));
    const set = new Set();
    for (const [k, v] of Object.entries(done)) if (v?.status === "filled" || v?.status === "partial") set.add(v.ticker || k.split(":")[0]);
    g.__aureliusBookOwned = { at: Date.now(), set };
    return set.has(ticker);
  } catch {
    return false;
  }
}
var ENGINE_GEN = 417;
let raiseAt = 0;
let holdAt = 0;
function pacificHour(now = Date.now()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(now));
  const bit = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return { key: `${bit("year")}-${bit("month")}-${bit("day")}T${bit("hour")}`, minute: Number(bit("minute")) };
}
function properReady() {
  try {
    const book = JSON.parse(readFileSync(join(process.cwd(), "data", "proper-fires.json"), "utf8"));
    return Array.isArray(book.fires) && book.fires.length >= 10 && book.sealed === true;
  } catch {
    return false;
  }
}
function sealModel() {
  try {
    const lock = JSON.parse(readFileSync(join(process.cwd(), "data", "checkpoint.json"), "utf8"));
    if (lock.locked === true) return;
  } catch {
  }
  const path = join(process.cwd(), "data", "proper-fires.json");
  let book;
  try {
    book = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return;
  }
  if (!Array.isArray(book.fires) || book.fires.length < 10 || book.sealed === true) return;
  const root = process.cwd();
  const backup = join(root, "spine-backup");
  const files = [
    ["src/lib/desk/engine.ts", "engine.ts"],
    ["src/lib/desk/kalshi-live.server.ts", "kalshi-live.server.ts"],
    ["src/lib/desk/prime-book.ts", "prime-book.ts"],
    ["src/lib/desk/auto.ts", "auto.ts"],
    ["src/components/desk/app.tsx", "app.tsx"],
    ["data/live-size.json", "live-size.json"],
    ["data/model-mode.json", "model-mode.json"],
    ["data/book-mode.json", "book-mode.json"]
  ];
  mkdirSync(backup, { recursive: true });
  for (const [src, name] of files) copyFileSync(join(root, src), join(backup, name));
  book.sealed = true;
  book.sealedAt = new Date().toISOString();
  writeFileSync(path, JSON.stringify(book, null, 2));
}
function keepBothBooks() {
  try {
    const paperFile = join(process.cwd(), "data", "paper-live.json");
    let arm = { on: true, dollars: 15, assets: ["btc", "gold"] };
    try {
      arm = { ...arm, ...JSON.parse(readFileSync(paperFile, "utf8")) };
    } catch {
    }
    if (arm.on !== true) {
      arm.on = true;
      writeFileSync(paperFile, JSON.stringify(arm));
    }
    const modeFile = join(process.cwd(), "data", "book-mode.json");
    let mode = { mode: "spine", size: 15, books: ["prime", "paper"] };
    try {
      mode = { ...mode, ...JSON.parse(readFileSync(modeFile, "utf8")) };
    } catch {
    }
    const books = Array.isArray(mode.books) ? mode.books : [];
    if (!books.includes("prime") || !books.includes("paper") || mode.mode !== "spine" || mode.version !== "1.11") {
      mode.mode = "spine";
      mode.version = "1.11";
      mode.books = ["prime", "paper"];
      delete mode.only;
      writeFileSync(modeFile, JSON.stringify(mode, null, 2));
    }
    return;
  } catch {
  }
}
function holdModel() {
  if (Date.now() - holdAt < 2e4) return;
  holdAt = Date.now();
  keepBothBooks();
  const file = join(process.cwd(), "data", "model-hour.json");
  const hour = pacificHour();
  let seen = "";
  try {
    seen = JSON.parse(readFileSync(file, "utf8")).hour || "";
  } catch {
    seen = "";
  }
  if (!seen) {
    try {
      writeFileSync(file, JSON.stringify({ hour: hour.key, at: new Date().toISOString(), loaded: true }));
    } catch {
    }
    return;
  }
  if (seen === hour.key || hour.minute > 2) return;
  try {
    writeFileSync(file, JSON.stringify({ hour: hour.key, at: new Date().toISOString(), loaded: true, restored: false, locked: "1.11" }));
  } catch {
  }
}
function pacificDay(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(now));
}
async function maybeRaise() {
  return;
}
var GUARD_FROM = (/* @__PURE__ */ new Date()).toISOString();
var HALT_FILE = join(process.cwd(), "data", "halt.json");
var PACE_FILE = join(process.cwd(), "data", "pace.json");
function primeLiveAt() {
  try {
    const t = Date.parse(JSON.parse(readFileSync(join(process.cwd(), "data", "prime-live.json"), "utf8")).at);
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}
function entriesOff() {
  try {
    const halt = JSON.parse(readFileSync(HALT_FILE, "utf8"));
    return halt.off === true;
  } catch {
    return false;
  }
}
function killDesk(reason) {
  try {
    const prev = JSON.parse(readFileSync(HALT_FILE, "utf8"));
    writeFileSync(HALT_FILE, JSON.stringify({ ...prev, off: true, at: (/* @__PURE__ */ new Date()).toISOString(), reason }));
  } catch {
    writeFileSync(HALT_FILE, JSON.stringify({ off: true, at: (/* @__PURE__ */ new Date()).toISOString(), reason, losses: [] }));
  }
  flagOffList("desk", reason);
}
function recentTaken() {
  try {
    const raw = readFileSync(join(process.cwd(), "data", "fill-log.json"), "utf8").slice(0, 60000);
    const rows = [];
    let depth = 0;
    let buf = "";
    for (let i = 0; i < raw.length && rows.length < 6; i += 1) {
      const c = raw[i];
      if (c === "{") depth += 1;
      if (depth > 0) buf += c;
      if (c === "}" && depth > 0) {
        depth -= 1;
        if (depth === 0) {
          try {
            rows.push(JSON.parse(buf));
          } catch {
          }
          buf = "";
        }
      }
    }
    return rows;
  } catch {
    return [];
  }
}
async function guardFills() {
  const file = join(process.cwd(), "data", "strikes.json");
  let book = { n: 0, events: [] };
  try {
    book = { n: 0, events: [], ...JSON.parse(readFileSync(file, "utf8")) };
  } catch {
  }
  book.events = (book.events || []).filter((row) => row.pattern !== "Live");
  const seen = new Set((book.events || []).map((row) => row.at));
  for (const row of recentTaken()) {
    if (row.kind !== "taken" || row.venue !== "kalshi" || !row.at || row.at < GUARD_FROM || seen.has(row.at)) continue;
    if (row.pattern === "Live" || String(row.tradeId || "").startsWith("held-")) continue;
    const spot = Number(row.spot);
    const vwap = Number(row.vwap);
    const target = Number(row.target);
    const width = Number(row.stdev);
    const breach = !shortTap(row.pattern, row.side) || (width > 0 && bandBetween(spot, vwap, width, target, 1, row.side));
    if (!breach) continue;
    book.events.unshift({ at: row.at, asset: row.asset, side: row.side, pattern: row.pattern, ticker: row.ticker });
    book.n = book.events.length;
    seen.add(row.at);
    if (shortTap(row.pattern, row.side)) continue;
  }
  book.n = (book.events || []).length;
  writeFileSync(file, JSON.stringify(book));
  if (book.n >= 3) pauseEntries("The model died. Three breaches. A tap the wrong way, a band between price and the target, or anything that is not a tap.");
}
function ensureLossHalt() {
  return;
}
function paceBook() {
  try {
    const row = JSON.parse(readFileSync(PACE_FILE, "utf8"));
    if (row?.from) return row;
  } catch {
  }
  return { from: (/* @__PURE__ */ new Date()).toISOString(), paused: false };
}
function liveEquity() {
  try {
    const cash = JSON.parse(readFileSync(join(process.cwd(), "data", "kalshi-cash.json"), "utf8"));
    const red = JSON.parse(readFileSync(join(process.cwd(), "data", "red-alert.json"), "utf8"));
    if (typeof cash.cash !== "number") return null;
    const seen2 = Date.parse(red.at ?? "");
    if (!Number.isFinite(seen2) || Date.now() - seen2 > 3 * 60 * 1e3) return null;
    const tied = (red.open ?? []).reduce((sum, row) => sum + (Number(row.cost) || 0), 0);
    return Math.round((cash.cash + tied) * 100) / 100;
  } catch {
    return null;
  }
}
function hourState() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "hour-mo.json"), "utf8"));
  } catch {
    return null;
  }
}
function hourBlock(label, side) {
  const row = hourState();
  const key = (/* @__PURE__ */ new Date()).toISOString().slice(0, 13);
  if (!row || row.hour !== key) return "";
  if (row.hold) return "This hour is already red. No more orders until the next hour.";
  const text = String(label || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
  const hit = (row.bench || []).some((item) => {
    const [pat, booked] = String(item).split("|");
    return booked === side && String(pat).replace(/−/g, "-") === text;
  });
  return hit ? "That setup lost this hour. It is benched until the hour is green." : "";
}
function bootClock() {
  if (g.__bootSmoke && Date.now() - g.__bootSmoke < 10 * 60 * 1000) return false;
  g.__bootSmoke = Date.now();
  reignite();
  return true;
}
function hourExits(hourKey) {
  let rows = [];
  try {
    rows = JSON.parse(readFileSync(EXIT_LOG, "utf8"));
  } catch {
    rows = [];
  }
  if (!Array.isArray(rows)) return [];
  return rows.filter((row) => {
    const at = Date.parse(row?.at || "");
    return row && row.profit != null && Number.isFinite(at) && pacificHour(at).key === hourKey;
  });
}
function bootGuard(assets) {
  const at = new Date().toISOString();
  const stamp = pacificHour();
  const bucket = Math.floor(stamp.minute / 15) * 15;
  const windowKey = `${stamp.key}:${String(bucket).padStart(2, "0")}`;
  const rebooted = bootClock();
  const link = paperNeedsLink();
  let fills = [];
  try {
    fills = readFillLog();
  } catch {
    fills = [];
  }
  const matched = (row) => fills.some((item) => item.kind === "taken" && item.venue === "kalshi" && item.ticker === row.ticker && item.side === row.side);
  const gaps = [];
  for (const row of [...link.open, ...link.missed]) {
    if (!row?.ticker || row.asset !== "btc" && row.asset !== "gold" || matched(row)) continue;
    const asset = assets?.[row.asset];
    const left = asset?.secondsLeft ?? 0;
    const same = Boolean(asset?.market?.ticker && asset.market.ticker === row.ticker);
    gaps.push({
      asset: row.asset,
      side: row.side,
      ticker: row.ticker,
      pattern: row.pattern || "",
      left: same ? left : 0,
      same,
      stillOpen: same && left > 45
    });
  }
  const openNow = gaps.filter((row) => row.stillOpen);
  writeFileSync(join(process.cwd(), "data", "window-guard.json"), JSON.stringify({
    at,
    gen: ENGINE_GEN,
    window: windowKey,
    ok: openNow.length === 0,
    openNow,
    closedMisses: gaps.length - openNow.length,
    rebooted,
    note: openNow.length
      ? "A paper trade is open and Kalshi does not have it. It is sent on this window only."
      : gaps.length
        ? "Older paper trades settled without Kalshi. They are not reopened. This window matches."
        : "Paper book and Kalshi match."
  }, null, 2));
  const hourFile = join(process.cwd(), "data", "hour-guard.json");
  let prior = {};
  try {
    prior = JSON.parse(readFileSync(hourFile, "utf8"));
  } catch {
    prior = {};
  }
  const currentRows = hourExits(stamp.key);
  const net = Math.round(currentRows.reduce((sum, row) => sum + Number(row.profit || 0), 0) * 100) / 100;
  const previousKey = pacificHour(Date.now() - 60 * 60 * 1000).key;
  let closed = prior.closed || null;
  if (stamp.minute <= 2 && prior.diagnosed !== previousKey) {
    const rows = hourExits(previousKey);
    const previousNet = Math.round(rows.reduce((sum, row) => sum + Number(row.profit || 0), 0) * 100) / 100;
    const red = rows.length > 0 && !(previousNet > 0);
    let cause = red ? "The hour lost on the market. The model was left as it is." : "Hour was green.";
    let fix = "none";
    if (red && openNow.length) {
      cause = "A paper trade did not reach Kalshi.";
      fix = "The next open window is relinked. The model was not changed.";
    } else if (red && entriesOff()) {
      cause = "Entries were off.";
      fix = "A stuck pause is cleared at the hour. The model was not changed.";
    } else if (red && rebooted) {
      cause = "The desk clock had stopped.";
      fix = "The clock was rebooted from the live loop.";
    }
    closed = { hour: previousKey, net: previousNet, n: rows.length, red, cause, fix, at };
    if (red) {
      try {
        const file = join(process.cwd(), "data", "alarm.json");
        const alarm = JSON.parse(readFileSync(file, "utf8"));
        const text = `RED HOUR ${previousKey}: $${previousNet.toFixed(2)}. ${cause} ${fix}`;
        const list = Array.isArray(alarm) ? alarm : [];
        if (!list.some((row) => row.text === text)) list.unshift({ at, text });
        writeFileSync(file, JSON.stringify(list.slice(0, 20)));
      } catch {
      }
    }
    prior.diagnosed = previousKey;
  }
  writeFileSync(hourFile, JSON.stringify({
    at,
    gen: ENGINE_GEN,
    hour: stamp.key,
    net,
    n: currentRows.length,
    red: currentRows.length > 0 && !(net > 0),
    diagnosed: prior.diagnosed || "",
    closed,
    note: "Checked from the live loop. A red hour is diagnosed when the hour closes. The model is not changed."
  }, null, 2));
}
function hourMo() {
  const key = (/* @__PURE__ */ new Date()).toISOString().slice(0, 13);
  const prev = hourState() || {};
  let bench = Array.isArray(prev.bench) ? prev.bench.slice() : [];
  if (prev.hour && prev.hour !== key) bench = (prev.net ?? 0) > 0 ? [] : bench;
  let rows = [];
  try {
    rows = readFillLog().filter(
      (row) => row.kind === "banked" && row.venue === "kalshi" && !row.opposite && String(row.at || "").startsWith(key) && row.profit != null
    );
  } catch {
    rows = [];
  }
  for (const row of rows) {
    if ((row.profit ?? 0) >= 0 || row.exitMiss || !row.pattern || !row.side) continue; // exitMiss: the call was right, the exit lost it (Love, Oct 4)
    const id = `${String(row.pattern).replace(/−/g, "-").replace(/\s+/g, " ").trim()}|${row.side}`;
    if (!bench.includes(id)) bench.push(id);
  }
  const net = Math.round(rows.reduce((sum, row) => sum + (row.profit ?? 0), 0) * 100) / 100;
  const wins = rows.filter((row) => (row.profit ?? 0) > 0).length;
  const hold = net <= -40;
  const note = hold
    ? `Hour is $${net.toFixed(2)}. No more orders until the next hour.`
    : bench.length
      ? `Hour is $${net.toFixed(2)}. ${bench.length} losing setup${bench.length === 1 ? "" : "s"} benched. The rest of the book can still fire.`
      : rows.length
        ? `Hour is $${net.toFixed(2)}. Book stays on.`
        : "Hour is open. Taking the book.";
  writeFileSync(join(process.cwd(), "data", "hour-mo.json"), JSON.stringify({
    hour: key,
    net,
    n: rows.length,
    wins,
    bench,
    hold,
    note,
    at: (/* @__PURE__ */ new Date()).toISOString()
  }));
  if (prev.note === note || note === "Hour is open. Taking the book." || note.endsWith("Book stays on.")) return;
  try {
    const file = join(process.cwd(), "data", "alarm.json");
    const alarm = JSON.parse(readFileSync(file, "utf8"));
    const text = `CHECK: ${note}`;
    const list = Array.isArray(alarm) ? alarm : [];
    if (!list.some((row) => row.text === text)) list.unshift({ at: (/* @__PURE__ */ new Date()).toISOString(), text });
    writeFileSync(file, JSON.stringify(list.slice(0, 20)));
  } catch {
  }
}
function pauseEntries(reason) {
  // Claude: the automatic pauses (three "breaches", hit-rate pause) used to switch entries off,
  // and the quiet check switched them back on 20 minutes later. That was the on/off loop.
  // Now they only raise the alarm. Turning her off is the LIVE button's job, and yours.
  const text = `RED: ${reason}`;
  try {
    const file = join(process.cwd(), "data", "alarm.json");
    const prev = JSON.parse(readFileSync(file, "utf8"));
    const rows = Array.isArray(prev) ? prev : [];
    if (!rows.some((row) => row.text === text)) rows.unshift({ at: (/* @__PURE__ */ new Date()).toISOString(), text });
    writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
  } catch {
  }
}
function hourAudit(recentNet) {
  const proof = proveGate();
  let model = {};
  try {
    model = JSON.parse(readFileSync(join(process.cwd(), "data", "model-hour.json"), "utf8"));
  } catch {
    model = {};
  }
  const since = Date.now() - 60 * 60 * 1e3;
  let taken = [];
  try {
    taken = readFillLog().filter((row) => row.kind === "taken" && row.venue === "kalshi" && Date.parse(row.at) >= since);
  } catch {
    taken = [];
  }
  let why = "";
  let reset = "";
  if (!taken.length) {
    let copier = "";
    try {
      const rows = JSON.parse(readFileSync(join(process.cwd(), "data", "copier.json"), "utf8"));
      copier = Array.isArray(rows) && rows[0] ? String(rows[0].reason || rows[0].status || "") : "";
    } catch {
      copier = "";
    }
    const pace = paceBook();
    if (pace.paused) {
      try {
        writeFileSync(PACE_FILE, JSON.stringify({ ...pace, paused: false, at: new Date().toISOString() }));
      } catch {
      }
      reset = "The hit-rate pause was on. Cleared it.";
    }
    if (entriesOff()) {
      let reason = "";
      try {
        reason = String(JSON.parse(readFileSync(HALT_FILE, "utf8")).reason || "");
      } catch {
        reason = "";
      }
      if (/paused|hit rate/i.test(reason)) {
        try {
          const prev = JSON.parse(readFileSync(HALT_FILE, "utf8"));
          writeFileSync(HALT_FILE, JSON.stringify({ ...prev, off: false, at: new Date().toISOString(), reason: "Hourly check cleared a stuck pause." }));
        } catch {
        }
        reset = reset || "Entries were paused. Turned them back on.";
      } else why = reason ? `Entries are off: ${reason}` : "Entries are off.";
    }
    if (!why && !reset) why = copier ? `No fill. Last note: ${copier}` : "No fill. No prime setup this hour. Left the model alone.";
  }
  const hourKey = new Date().toISOString().slice(0, 13);
  try {
    writeFileSync(join(process.cwd(), "data", "hour-gate.json"), JSON.stringify({
      at: new Date().toISOString(),
      hour: hourKey,
      gate: proof.ok,
      gateNote: proof.note,
      modelHour: model.hour || "",
      modelRestored: model.restored === true,
      net: recentNet,
      took: taken.length,
      why,
      reset
    }, null, 2));
  } catch {
  }
  try {
    const file = join(process.cwd(), "data", "alarm.json");
    const prev = JSON.parse(readFileSync(file, "utf8"));
    const rows = Array.isArray(prev) ? prev : [];
    const text = proof.ok ? `GATE ${hourKey}: ${proof.note}` : `RED: Gate check failed. ${proof.note}`;
    if (!rows.some((row) => row.text === text)) rows.unshift({ at: new Date().toISOString(), text });
    const extra = reset ? `CHECK ${hourKey}: Quiet hour. ${reset}` : !taken.length ? `CHECK ${hourKey}: Quiet hour. ${why}` : "";
    if (extra && !rows.some((row) => row.text === extra)) rows.unshift({ at: new Date().toISOString(), text: extra });
    writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
  } catch {
  }
}
let quietAt = 0;
function quietWatch() {
  if (Date.now() - quietAt < 20 * 60 * 1000) return;
  quietAt = Date.now();
  const since = Date.now() - 20 * 60 * 1000;
  let taken = [];
  try {
    taken = readFillLog().filter((row) => row.kind === "taken" && row.venue === "kalshi" && Date.parse(row.at) >= since);
  } catch {
    taken = [];
  }
  if (taken.length) return;
  let copier = "";
  try {
    const rows = JSON.parse(readFileSync(join(process.cwd(), "data", "copier.json"), "utf8"));
    copier = Array.isArray(rows) && rows[0] ? String(rows[0].reason || rows[0].status || "") : "";
  } catch {
    copier = "";
  }
  let reset = "";
  const pace = paceBook();
  if (pace.paused) {
    try {
      writeFileSync(PACE_FILE, JSON.stringify({ ...pace, paused: false, at: new Date().toISOString() }));
    } catch {
    }
    reset = "The hit-rate pause was on. Cleared it.";
  }
  if (entriesOff()) {
    let reason = "";
    try {
      reason = String(JSON.parse(readFileSync(HALT_FILE, "utf8")).reason || "");
    } catch {
      reason = "";
    }
    // NEVER THE BREAKER (Oct 20 ~1:39 AM PT, Love: "nothing can alter her character, her entry logic, her execution, anything about
    // her without express implementation from my side of the desk"): the quiet check used to clear ANY halt whose reason said
    // "paused" - and the breaker's own message ends "New entries paused", so a tripped breaker (a model-mismatch trip included)
    // was un-halted after 20 quiet minutes without Love. Now it may only clear the hit-rate pause; a breaker halt stays until
    // Love herself clears it by name.
    let haltPrev = null;
    try { haltPrev = JSON.parse(readFileSync(HALT_FILE, "utf8")); } catch { haltPrev = null; }
    if (/paused|hit rate/i.test(reason) && !/^BREAKER:/i.test(reason) && !(haltPrev && haltPrev.breaker === true)) {
      try {
        writeFileSync(HALT_FILE, JSON.stringify({ ...(haltPrev || {}), off: false, at: new Date().toISOString(), reason: "Quiet check cleared a stuck pause." }));
      } catch {
      }
      reset = reset || "Entries were paused. Turned them back on.";
    }
  }
  const why = reset || (copier ? `No fill in 20 minutes. ${copier}` : "No fill in 20 minutes. No prime setup. Left the model alone.");
  try {
    writeFileSync(join(process.cwd(), "data", "quiet-check.json"), JSON.stringify({ at: new Date().toISOString(), why, reset }, null, 2));
  } catch {
  }
  if (!reset && /no open prime|no prime/i.test(why)) return;
  try {
    const file = join(process.cwd(), "data", "alarm.json");
    const prev = JSON.parse(readFileSync(file, "utf8"));
    const rows = Array.isArray(prev) ? prev : [];
    const text = `CHECK: ${why}`;
    if (!rows.some((row) => row.text === text)) rows.unshift({ at: new Date().toISOString(), text });
    writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
  } catch {
  }
}
function paceGuard() {
  const pace = paceBook();
  let closed = [];
  try {
    closed = readFillLog().filter(
      (row) => row.kind === "banked" && row.venue === "kalshi" && !row.opposite && row.at >= pace.from && row.profit != null
    );
  } catch {
    closed = [];
  }
  const wins = closed.filter((row) => (row.profit ?? 0) > 0).length;
  const net = Math.round(closed.reduce((sum, row) => sum + (row.profit ?? 0), 0) * 100) / 100;
  const equity = liveEquity();
  const peak = equity == null ? pace.peak : Math.max(pace.peak ?? equity, equity);
  const recent = closed.filter((row) => {
    const at = Date.parse(row.at ?? "");
    return Number.isFinite(at) && at >= primeLiveAt() && Date.now() - at <= 60 * 60 * 1e3;
  });
  const recentWins = recent.filter((row) => (row.profit ?? 0) > 0).length;
  let streak = 0;
  for (const row of closed) {
    if ((row.profit ?? 0) < 0) streak += 1;
    else break;
  }
  let reason = "";
  if (!pace.paused && recent.length >= 5 && recentWins / recent.length < 0.2) {
    reason = `Paused. Hit rate ${recentWins}/${recent.length} this hour, under 1 in 5. New entries are off until it is checked. Open trades can still cash.`;
  }
  const recentNet = Math.round(recent.reduce((sum, row) => sum + (row.profit ?? 0), 0) * 100) / 100;
  try {
    const tenFile = join(process.cwd(), "data", "next-ten.json");
    let ten = { from: (/* @__PURE__ */ new Date()).toISOString(), alarmed: false, wins: null };
    try {
      ten = { ...ten, ...JSON.parse(readFileSync(tenFile, "utf8")) };
    } catch {
      writeFileSync(tenFile, JSON.stringify(ten));
    }
    const first = closed.filter((row) => (row.at ?? "") >= ten.from).slice().reverse().slice(0, 10);
    if (first.length >= 10 && !ten.alarmed) {
      const wins = first.filter((row) => (row.profit ?? 0) > 0).length;
      ten.alarmed = true;
      ten.wins = wins;
      writeFileSync(tenFile, JSON.stringify(ten));
      if (wins < 7) {
        const text = `RED: The next ten are ${wins}/10. It should be 7/10 when it is running properly.`;
        const file = join(process.cwd(), "data", "alarm.json");
        const prev = JSON.parse(readFileSync(file, "utf8"));
        const rows = Array.isArray(prev) ? prev : [];
        if (!rows.some((row) => row.text === text)) rows.unshift({ at: (/* @__PURE__ */ new Date()).toISOString(), text });
        writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
      }
    }
  } catch {
  }
  const hourKey = (/* @__PURE__ */ new Date()).toISOString().slice(0, 13);
  try {
    const hourFile = join(process.cwd(), "data", "hour-green.json");
    let marked = {};
    try {
      marked = JSON.parse(readFileSync(hourFile, "utf8"));
    } catch {
      marked = {};
    }
    if (marked.key !== hourKey && Date.now() - Date.parse(pace.from) >= 60 * 60 * 1e3) {
      if (!(recentNet > 0)) {
        const text = `RED: The last 60 minutes are not green. Net $${recentNet.toFixed(2)}.`;
        const file = join(process.cwd(), "data", "alarm.json");
        const prev = JSON.parse(readFileSync(file, "utf8"));
        const rows = Array.isArray(prev) ? prev : [];
        if (!rows.some((row) => row.text === text)) rows.unshift({ at: (/* @__PURE__ */ new Date()).toISOString(), text });
        writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
      }
      writeFileSync(hourFile, JSON.stringify({ key: hourKey, net: recentNet, at: new Date().toISOString() }));
      hourAudit(recentNet);
    }
  } catch {
  }
  if (streak >= 3) {
    try {
      const file = join(process.cwd(), "data", "alarm.json");
      const prev = JSON.parse(readFileSync(file, "utf8"));
      const text = `CHECK: ${streak} Kalshi losses in a row. Entries stay on. Look at the side, not the count.`;
      const rows = Array.isArray(prev) ? prev : [];
      if (!rows.some((row) => row.text === text)) rows.unshift({ at: (/* @__PURE__ */ new Date()).toISOString(), text });
      writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
    } catch {
    }
  }
  if (reason) pauseEntries(reason);
  try {
    writeFileSync(
      PACE_FILE,
      JSON.stringify({
        from: pace.from,
        at: (/* @__PURE__ */ new Date()).toISOString(),
        paused: pace.paused || Boolean(reason),
        reason: reason || void 0,
        wins,
        n: closed.length,
        net,
        equity,
        peak
      })
    );
  } catch {
  }
}
var EXIT_LOG = join(process.cwd(), "data", "exit-log.json");
var HEDGE_ONCE = join(process.cwd(), "data", "hedge-once.json");
function spikeStake(setup) {
  const label = `${setup.pattern.kind} ${setup.pattern.label}`;
  const atBand = setup.pattern.kind === "tap_reject" || /band|σ/i.test(label);
  if (!atBand || setup.multiple < 6) return null;
  return 3;
}
function sizedStake(dollars2, multiple) {
  let scale = 1;
  if (multiple >= 8) scale = 0.5;
  else if (multiple >= 5) scale = 0.75;
  return Math.max(1, Math.round(dollars2 * scale * 100) / 100);
}
function noteHalf(trade, snap, pct) {
  if (!(pct >= 0.5)) return;
  const file = join(process.cwd(), "data", "half-profit.json");
  let rows = [];
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }
  if (rows.some((row) => row.id === trade.id)) return;
  const strike = trade.target ?? snap.target ?? null;
  const spot = snap.spot;
  const room = spot > 0 && strike != null ? trade.side === "up" ? spot - strike : strike - spot : null;
  rows.unshift({
    id: trade.id,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    ticker: trade.ticker,
    asset: trade.asset,
    side: trade.side,
    pct: Math.round(pct * 100),
    stake: trade.stake,
    secondsLeft: snap.secondsLeft,
    spot,
    strike,
    room
  });
  try {
    writeFileSync(file, JSON.stringify(rows.slice(0, 40)));
  } catch {
  }
}
function readPin(ticker) {
  try {
    const map = JSON.parse(readFileSync(join(process.cwd(), "data", "pin-sale.json"), "utf8"));
    const row = map[ticker];
    if (!row) return null;
    const age2 = Date.now() - Date.parse(row.at ?? "");
    if (!Number.isFinite(age2) || age2 < 0 || age2 > 20 * 60 * 1e3) return null;
    const ask = Number(row.ask);
    const pct = Number(row.pct);
    if (!(ask > 0) && !(pct > 0)) return null;
    return { ask, pct, at: Date.parse(row.at ?? "") };
  } catch {
    return null;
  }
}
function scaleOn() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "scale75.json"), "utf8")).on !== false;
  } catch {
    return true;
  }
}
function askedClose(trade) {
  try {
    const row = JSON.parse(readFileSync(join(process.cwd(), "data", "close-now.json"), "utf8"));
    if (row.ticker !== trade.ticker || row.side !== trade.side) return false;
    const age2 = Date.now() - Date.parse(row.at ?? "");
    return Number.isFinite(age2) && age2 >= 0 && age2 < 3 * 60 * 1e3;
  } catch {
    return false;
  }
}
function alarmBetween(asset, side, ticker) {
  if (!vwapSitsBetween(asset, side) && !tenVwapWall(asset, side)) return;
  const name = asset.asset === "gold" ? "Gold" : "Bitcoin";
  const way = side === "up" ? "long" : "short";
  flagBetween(ticker, `RED: ${name} ${way} entered with the VWAP between price and a $10 level.`);
}
var FIVE_FILE = join(process.cwd(), "data", "next-five.json");
function noteFive(trade) {
  try {
    const prev = JSON.parse(readFileSync(FIVE_FILE, "utf8"));
    const rows = Array.isArray(prev.rows) ? prev.rows : [];
    if (rows.length >= 5 || rows.some((row) => row.id === trade.id)) return;
    rows.push({
      id: trade.id,
      at: trade.openedAt,
      asset: trade.asset,
      side: trade.side,
      pattern: trade.patternLabel,
      onList: true
    });
    writeFileSync(FIVE_FILE, JSON.stringify({ rows }));
  } catch {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(
      FIVE_FILE,
      JSON.stringify({
        rows: [{ id: trade.id, at: trade.openedAt, asset: trade.asset, side: trade.side, pattern: trade.patternLabel, onList: true }]
      })
    );
  }
}
async function sealOffList(trades) {
  return trades;
}
function manualKalshi() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "live-manual.json"), "utf8")).off === true;
  } catch {
    return false;
  }
}
function armPct(multiple) {
  return multiple > 0 && multiple <= 1.28 ? 25 : 28;
}
function notePaper(row) {
  try {
    const file = join(process.cwd(), "data", "paper-log.json");
    let rows = [];
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
    }
    rows.unshift(row);
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(file, JSON.stringify(rows.slice(0, 200), null, 2));
  } catch {
  }
}
function trailPaper(trades, assets) {
  return trades.map((trade) => {
    if (trade.result !== "open" || trade.source === "live" || trade.venue === "polymarket" || trade.probe) return trade;
    const asset = assets?.[trade.asset];
    const mtm = markTrade(trade, asset);
    const paid = trade.contracts > 0 && trade.stake > 0 ? trade.stake / trade.contracts : 0;
    const entry = Math.max(trade.ask || 0, paid || 0);
    const bid = mtm.bid || 0;
    const peak = Math.max(trade.highBid || 0, bid);
    const spot = Number(asset?.spot);
    const strike = Number(asset?.target ?? trade.target);
    const through = spot > 0 && strike > 0 && (trade.side === "up" ? spot >= strike : spot <= strike);
    const gate = trailCatch(entry, bid, peak, through);
    if (gate.action !== "sell") {
      if (gate.high > (trade.highBid || 0) + 1e-9) return { ...trade, highBid: gate.high };
      return trade;
    }
    const profit = Math.round((mtm.profit || 0) * 100) / 100;
    const pct = Math.round((mtm.pct || 0) * 100);
    notePaper({
      at: (/* @__PURE__ */ new Date()).toISOString(),
      asset: trade.asset,
      side: trade.side,
      pattern: trade.patternLabel,
      stake: trade.stake,
      multiple: trade.multiple,
      profit,
      pct,
      result: "closed",
      why: gate.why,
    });
    return {
      ...trade,
      highBid: gate.high,
      result: "exited",
      payout: Math.round((mtm.value || 0) * 100) / 100,
      profit,
      closedAt: (/* @__PURE__ */ new Date()).toISOString(),
      notes: gate.why,
    };
  });
}
function studySetup(setup) {
  const label = setup.pattern?.label || "";
  if (!setup.side || setup.pattern?.kind === "none") return false;
  if (label.startsWith("Watching") || label.startsWith("No band")) return false;
  return setup.pattern.kind === "tap_reject" || setup.pattern.kind === "break_retest" || label.startsWith("Open ") || label.startsWith("Gold clock");
}
function researchFill(setup, asset, stake, dnaMode = "fixed") {
  if (!studySetup(setup)) return null;
  // HER DNA (dna.ts) on the desk's own paper book too ("fixed" = her fix; the ATR twin asks for "atr").
  if (dnaNow(String(setup.asset || "").toLowerCase(), setup.side, asset?.spot || 0, asset?.target ?? 0, dnaMode)) return null;
  const vwap = asset?.vwap1m?.vwap || asset?.vwap5m?.vwap || 0;
  const stdev = asset?.vwap1m?.stdev || asset?.vwap5m?.stdev || 0;
  if (dnaMode !== "atr" && dnaMode !== "chan" && bandInWay(setup.side, asset?.spot || 0, vwap, stdev, setup.asset)) return null;
  const ask = setup.ask > 0 ? setup.ask : 0.5;
  const prime = winningSetup(setup.pattern.label, setup.side);
  return {
    id: newId(),
    openedAt: (/* @__PURE__ */ new Date()).toISOString(),
    closedAt: null,
    asset: setup.asset,
    ticker: setup.ticker,
    side: setup.side,
    source: "paper",
    setupId: setup.id,
    autoFilled: true,
    probe: false,
    patternLabel: setup.pattern.label,
    stake,
    ask,
    multiple: setup.multiple,
    contracts: stake / ask,
    result: "open",
    payout: null,
    profit: null,
    exitPct: setup.exitPct,
    holdToExpiry: setup.holdToExpiry,
    conviction: setup.localConviction,
    notes: prime ? setup.reasons?.[0] ?? "" : `Paper only. ${setup.pattern.label} is not on the Kalshi list.`,
    grokThesis: "",
    target: asset.target,
    lastSpot: asset.spot,
    entryVwap: asset.vwap1m?.vwap || asset.vwap5m?.vwap || null
  };
}
function bandOnTarget(assetName, vwap, stdev, target) {
  const name = String(assetName || "").toLowerCase();
  const width = Math.max(stdev || 0, 0);
  if (!(vwap > 0) || !(target > 0) || !(width > 0)) return false;
  const pad = name === "btc" ? 15 : name === "gold" ? Math.max(0.6, width * 0.2) : name === "eth" ? Math.max(1.2, width * 0.2) : Math.max(0.08, width * 0.2);
  const levels = [vwap];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * width, vwap - step * width);
  return levels.some((level) => Math.abs(level - target) <= pad);
}
function vwapUnderTarget(setup, asset) {
  const line = asset?.vwap1m?.vwap || asset?.vwap5m?.vwap || 0;
  const target = asset?.target;
  if (!(line > 0) || !(target > 0)) return false;
  const name = String(setup?.asset || asset?.asset || "").toLowerCase();
  const pad = name === "btc" ? 15 : name === "gold" ? 0.6 : name === "eth" ? 1.2 : name === "sol" ? 0.08 : 0.08;
  return Math.abs(line - target) <= pad;
}
function withRightSide(setup, _asset) {
  return setup;
}
function prime75() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "book-mode.json"), "utf8")).mode === "prime75";
  } catch {
    return false;
  }
}
function sureLate(side, label, spot, target, _secondsLeft) {
  if (!shortTap(label, side)) return false;
  if (!(spot > 0) || !(target > 0)) return false;
  return side === "up" ? spot > target : spot < target;
}
function kalshiOk(setup, asset) {
  if (!winningSetup(setup?.pattern?.label || "", setup?.side, setup?.asset || asset?.asset)) return false;
  const spot = asset?.spot;
  const vwap = asset?.vwap1m?.vwap || asset?.vwap5m?.vwap || 0;
  if (!(spot > 0) || !(vwap > 0)) return false;
  if (setup.side === "up" && spot < vwap && !shortTap(setup.pattern?.label, setup.side)) return false;
  if (setup.side === "down" && spot > vwap && !shortTap(setup.pattern?.label, setup.side)) return false;
  if (spineOwns(setup?.asset || asset?.asset)) return true;
  return !bandInTheWay(asset, setup.side);
}
function fill(setup, asset, stake) {
  if (offList(setup.pattern.label, setup.side, setup.asset)) {
    flagOffList(setup.ticker, `Blocked. ${setup.pattern.label} ${setup.side.toUpperCase()} is not on the list.`);
    return null;
  }
  if (bandInTheWay(asset, setup.side)) {
    flagOffList(setup.ticker, `Blocked. ${setup.pattern.label} ${setup.side.toUpperCase()} has a VWAP band between price and the target.`);
    return null;
  }
  const ask = setup.ask > 0 ? setup.ask : 0.5;
  const opened = {
    id: newId(),
    openedAt: (/* @__PURE__ */ new Date()).toISOString(),
    closedAt: null,
    asset: setup.asset,
    ticker: setup.ticker,
    side: setup.side,
    source: "paper",
    setupId: setup.id,
    autoFilled: true,
    probe: false,
    patternLabel: setup.pattern.label,
    stake,
    ask,
    multiple: setup.multiple,
    contracts: stake / ask,
    result: "open",
    payout: null,
    profit: null,
    exitPct: setup.exitPct,
    holdToExpiry: setup.holdToExpiry,
    conviction: setup.localConviction,
    notes: setup.reasons[0] ?? "",
    grokThesis: "",
    target: asset.target,
    lastSpot: asset.spot,
    entryVwap: asset.vwap1m?.vwap || asset.vwap5m?.vwap || null
  };
  try {
    noteOpen(opened, asset);
  } catch {
  }
  return opened;
}
function readExitLog() {
  try {
    const parsed = JSON.parse(readFileSync(EXIT_LOG, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function noteKiss(trade, asset) {
  try {
    const file = join(process.cwd(), "data", "band-kiss.json");
    let rows = [];
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
      rows = [];
    }
    const hit = rows.find((row) => row.ticker === trade.ticker && row.side === trade.side);
    if (hit) {
      if (trade.profit != null) {
        hit.profit = trade.profit;
        hit.result = trade.profit > 0 ? "win" : "loss";
        hit.closedAt = (/* @__PURE__ */ new Date()).toISOString();
        writeFileSync(file, JSON.stringify(rows.slice(0, 200), null, 2));
      }
      return;
    }
    const kiss = targetKiss(asset);
    if (!kiss) return;
    rows.unshift({
      at: (/* @__PURE__ */ new Date()).toISOString(),
      ticker: trade.ticker,
      asset: trade.asset,
      side: trade.side,
      pattern: trade.patternLabel,
      spot: asset.spot,
      target: asset.target,
      band: Math.round(kiss.band * 100) / 100,
      gap: Math.round(kiss.gap * 100) / 100,
      vwap: Math.round(kiss.vwap * 100) / 100,
      profit: null,
      result: "open"
    });
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(file, JSON.stringify(rows.slice(0, 200), null, 2));
  } catch {
  }
}
function noteExit(row) {
  try {
    const prior = JSON.parse(readFileSync(EXIT_LOG, "utf8"));
    const rows = Array.isArray(prior) ? prior : [];
    rows.unshift(row);
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(EXIT_LOG, JSON.stringify(rows.slice(0, 80), null, 2));
    noteKiss(row, { spot: row.spot, target: row.target, asset: row.asset, vwap1m: null, vwap5m: null });
  } catch {
  }
  queueLoss(row);
}
function queueLoss(row) {
  try {
    if (!(typeof row?.profit === "number") || !(row.profit < 0)) return;
    if (row.reason === "salvage-missed") return;
    const file = join(process.cwd(), "data", "loss-queue.json");
    let rows = [];
    try {
      const prior = JSON.parse(readFileSync(file, "utf8"));
      rows = Array.isArray(prior) ? prior : [];
    } catch {
      rows = [];
    }
    const id = `${row.ticker}|${row.at}`;
    if (rows.some((item) => item.id === id)) return;
    rows.unshift({
      id,
      at: row.at,
      ticker: row.ticker,
      asset: row.asset,
      side: row.side,
      pattern: row.pattern || "",
      spot: row.spot ?? null,
      vwap: row.vwap ?? null,
      stdev: row.stdev ?? null,
      strike: row.strike ?? null,
      profit: row.profit,
      reason: row.reason || "",
      evaluated: false,
    });
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(file, JSON.stringify(rows.slice(0, 40), null, 2));
  } catch {
  }
}
function hedgeSpent(ticker) {
  try {
    const row = JSON.parse(readFileSync(HEDGE_ONCE, "utf8"));
    if (Array.isArray(row.tickers)) return row.tickers.includes(ticker);
    return row.kalshi === ticker;
  } catch {
    return false;
  }
}
function samePolyWindow(ticker, closeTime) {
  const end = Date.parse(closeTime);
  if (!Number.isFinite(end)) return false;
  const start = new Date(end - 15 * 60 * 1e3);
  const hh = String(start.getUTCHours()).padStart(2, "0");
  const mm = String(start.getUTCMinutes()).padStart(2, "0");
  return ticker.includes(`${hh}${mm}`);
}
function settleOne(trade, asset) {
  if (trade.result !== "open") return trade;
  if (goldHaltFill(trade)) {
    return {
      ...trade,
      result: "exited",
      payout: trade.stake,
      profit: 0,
      closedAt: (/* @__PURE__ */ new Date()).toISOString(),
      notes: "Gold book closed. Scratched."
    };
  }
  if (!asset?.market) return trade;
  if (asset.market.ticker === trade.ticker && asset.secondsLeft > 0) return trade;
  if (trade.source === "live") return trade;
  if (windowStillOpen(trade.ticker)) return trade;
  const spot = asset.spot || trade.lastSpot;
  const target = trade.target ?? asset.target;
  if (target == null || !(spot > 0)) return trade;
  if (asset.market.ticker === trade.ticker) return trade;
  const win = settleSide(trade.side, spot, target);
  const payout = win ? trade.contracts : 0;
  return {
    ...trade,
    result: win ? "win" : "loss",
    payout,
    profit: Math.round((payout - trade.stake) * 100) / 100,
    lastSpot: spot,
    closedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function sendKalshi(setup, asset, trades, dollars2) {
  // REMOVED (Claude, Oct 3 ~2:55 PM PT, Love: "get rid of the stuff grok left behind... change the locks"): a Grok-era
  // route that opened Kalshi positions on its own. It no longer runs. Only a named live book (BRICK / COTC) opens trades.
  return null;
  return null;
  const market = asset.market;
  const line = asset.vwap1m?.vwap || asset.vwap5m?.vwap || 0;
  const width = asset.vwap1m?.stdev || asset.vwap5m?.stdev || 0;
  let aimed = withRightSide(setup, asset);
  if (!aimed || !market || market.ticker !== aimed.ticker || goldHalted(aimed.asset)) return null;
  const pick = primeCandidate({ ...asset, asset: aimed.asset });
  if (!pick || !onPrimeBook(pick.label, pick.side, aimed.asset)) {
    flagOffList(aimed.ticker, "Blocked. Not on the prime book.");
    return null;
  }
  aimed = {
    ...aimed,
    side: pick.side,
    pattern: { ...aimed.pattern, label: pick.label, side: pick.side },
  };
  if (!onPrimeBook(aimed.pattern?.label || "", aimed.side, aimed.asset)) {
    flagOffList(aimed.ticker, `Blocked. ${aimed.pattern?.label || "That setup"} is not on the prime book.`);
    return null;
  }
  const mo = hourBlock(aimed.pattern?.label || "", aimed.side);
  if (mo) {
    flagOffList(aimed.ticker, mo);
    return null;
  }
  if (!spineOwns(aimed.asset) && bandInTheWay(asset, aimed.side)) {
    flagOffList(aimed.ticker, `Blocked. ${aimed.pattern.label} ${aimed.side.toUpperCase()} has a VWAP band between price and the target.`);
    return null;
  }
  const spot = asset.spot;
  const strike = asset.target;
  if (spot > 0 && strike != null && line > 0) {
    const above = spot > line && strike > line;
    const below = spot < line && strike < line;
    if (aimed.side === "down" && spot > strike && above && !shortTap(aimed.pattern?.label, aimed.side)) {
      flagOffList(aimed.ticker, `Blocked. ${aimed.pattern.label} SHORT is above the VWAP with the target.`);
      return null;
    }
    if (aimed.side === "up" && spot < strike && below && !shortTap(aimed.pattern?.label, aimed.side)) {
      flagOffList(aimed.ticker, `Blocked. ${aimed.pattern.label} LONG is below the VWAP with the target.`);
      return null;
    }
    const shortCross = aimed.side === "down" && spot > line && strike < line;
    if (shortCross) {
      flagOffList(aimed.ticker, `Blocked. ${aimed.pattern.label} SHORT has to cross the VWAP.`);
      return null;
    }
    const longCross = aimed.side === "up" && spot < line && strike > line;
    if (longCross) {
      flagOffList(aimed.ticker, `Blocked. ${aimed.pattern.label} LONG has to cross the main VWAP.`);
      return null;
    }
    const shortMayCross = aimed.side === "down" && spot > line && strike < line;
    if (aimed.side === "up" && spot < line && !shortTap(aimed.pattern?.label, aimed.side) || aimed.side === "down" && spot > line && !shortMayCross && !shortTap(aimed.pattern?.label, aimed.side)) {
      flagOffList(aimed.ticker, `Blocked. ${aimed.pattern.label} ${aimed.side.toUpperCase()} is on the wrong side of the VWAP.`);
      return null;
    }
    const onTarget = spineOwns(aimed.asset) ? "" : shortBandOnTarget(aimed.asset, aimed.side, strike ?? 0, line, width, spot);
    if (onTarget) {
      flagOffList(aimed.ticker, onTarget);
      return null;
    }
    const alive = survivalBlock(spot, line, width, aimed.side, aimed.pattern?.label, strike ?? 0, aimed.asset);
    if (alive) {
      flagOffList(aimed.ticker, alive);
      return null;
    }
  }
  if (flipped(trades, aimed.ticker, aimed.side, aimed.asset)) return null;
  const liveOpen = trades.some(
    (t) => t.source === "live" && t.venue !== "polymarket" && t.result === "open" && t.asset === setup.asset && t.ticker === market.ticker
  );
  if (liveOpen) return null;
  let live;
  try {
    live = await import("./kalshi-live.server");
    if (!live.kalshiArmed()) return null;
  } catch {
    return null;
  }
  const stake = dollars2 ?? live.liveDollars();
  const placed = await live.enterLive(aimed.side, aimed.ticker, market.yesAsk, market.noAsk, stake, {
    line: { spot: asset.spot, vwap: line, target: asset.target ?? 0, stdev: width, label: aimed.pattern.label },
    secondsLeft: asset.secondsLeft
  });
  if (placed.status !== "filled") return null;
  const held = await live.heldFifteens();
  const row = held.find((item) => item.ticker === aimed.ticker);
  const got = row && row.pos > 0 ? "up" : row && row.pos < 0 ? "down" : null;
  if (got && got !== aimed.side) {
    await live.flattenTicker(aimed.ticker);
    return null;
  }
  const paid = placed.paid > 0 ? placed.paid : aimed.side === "up" ? placed.yesPrice : 1 - placed.yesPrice;
  const cost = Math.round(placed.filled * paid * 100) / 100;
  const openedBase = fill(aimed, asset, cost);
  if (!openedBase) {
    await live.flattenTicker(aimed.ticker);
    return null;
  }
  const opened = {
    ...openedBase,
    source: "live",
    venue: "kalshi",
    setupId: `${aimed.id}:live`,
    stake: cost,
    ask: paid,
    multiple: paid > 0 ? 1 / paid : aimed.multiple,
    contracts: placed.filled,
    orderId: placed.orderId,
    notes: spike ? `Kalshi ${aimed.side.toUpperCase()} $${cost.toFixed(2)}. $3 band test at ${aimed.multiple.toFixed(1)}\xD7.` : `Kalshi ${aimed.side.toUpperCase()} $${cost.toFixed(2)}. One side only.`
  };
  try {
    await live.restAutoSell(opened, exitTargetPct(opened, asset, 75));
  } catch {
  }
  alarmBetween(asset, opened.side, opened.ticker);
  return opened;
}
async function copyWith(trades, asset, paper) {
  const market = asset.market;
  if (!market) return trades;
  const pick = primeCandidate({ ...asset, asset: paper.asset });
  if (!pick || !onPrimeBook(pick.label, pick.side, paper.asset)) return trades;
  const ask = pick.side === "up" ? market.yesAsk : market.noAsk;
  if (!(ask > 0.02 && ask < 0.92)) return trades;
  const copyFloor = shortTap(pick.label, pick.side) ? 1.2 : sureLate(pick.side, pick.label, asset.spot, asset.target ?? 0, asset.secondsLeft) ? 1.2 : 1.34;
  if (1 / ask < copyFloor) return trades;
  if (shortTap(pick.label, pick.side) && 1 / ask > 1.65) return trades;
  try {
    const made = await sendKalshi(
      {
        id: paper.setupId || `${paper.ticker}:${pick.side}:copy`,
        asset: paper.asset,
        ticker: paper.ticker,
        side: pick.side,
        pattern: {
          kind: "tap_reject",
          side: pick.side,
          band: null,
          quality: 0.8,
          label: pick.label,
          reasons: ["Prime book."]
        },
        ask,
        multiple: 1 / ask,
        localConviction: paper.conviction || 80,
        exitPct: paper.exitPct ?? 75,
        holdToExpiry: false,
        reasons: [],
        watchOnly: false,
        premium: false,
        throughTarget: false
      },
      asset,
      trades
    );
    return made ? [made, ...trades] : trades;
  } catch {
    return trades;
  }
}
async function sendLive(_setup, _asset, _trades) {
  return null;
}
function adoptScouts(trades, assets) {
  let events = [];
  try {
    events = readFillLog();
  } catch {
    return trades;
  }
  const banked = new Set(events.filter((event) => event.kind === "banked").map((event) => event.tradeId));
  let next = trades;
  for (const id of ["btc", "gold"]) {
    const asset = assets[id];
    const ticker = asset?.market?.ticker;
    if (!asset || !ticker) continue;
    const taken = events.find(
      (event) => event.kind === "taken" && event.venue === "paper" && event.ticker === ticker && !banked.has(event.tradeId)
    );
    if (!taken) continue;
    if (next.some((t) => t.id === taken.tradeId || (t.ticker === ticker && t.source !== "live" && !t.probe))) {
      continue;
    }
    next = [
      {
        id: taken.tradeId,
        openedAt: taken.at,
        closedAt: null,
        asset: taken.asset,
        ticker: taken.ticker,
        side: taken.side,
        source: "paper",
        setupId: `${taken.tradeId}:scout`,
        autoFilled: true,
        probe: false,
        patternLabel: taken.pattern || "Paper scout",
        stake: taken.stake,
        ask: taken.ask,
        multiple: taken.multiple,
        contracts: taken.ask > 0 ? taken.stake / taken.ask : 0,
        result: "open",
        payout: null,
        profit: null,
        exitPct: 75,
        holdToExpiry: false,
        conviction: 70,
        notes: "Paper scout. Kalshi waits for a cheaper price. Polymarket hedges if it turns against us.",
        grokThesis: "",
        target: asset.target,
        lastSpot: asset.spot,
        entryVwap: asset.vwap1m?.vwap || asset.vwap5m?.vwap || null
      },
      ...next
    ];
  }
  return next;
}
async function armHedge(trades, _assets) {
  return trades;
}
var ARM_PATH = join(process.cwd(), "data", "profit-arm.json");
var probeAt = /* @__PURE__ */ new Map();
var probeRetry = /* @__PURE__ */ new Map();
var silverTendAt = 0;
var cashHeldAt = 0;
var hourAt = 0;
var polyTendAt = 0;
function hourEndMs(slug) {
  const m = String(slug || "").match(/(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})z$/);
  if (!m) return null;
  const start = Date.parse(`${m[1]}T${m[2]}:${m[3]}:00Z`);
  return Number.isFinite(start) ? start + 60 * 60 * 1000 : null;
}
async function yahooTape(symbol) {
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) return null;
  const data = await res.json();
  const tape = data.chart?.result?.[0];
  const quote = tape?.indicators?.quote?.[0];
  const times = tape?.timestamp ?? [];
  const candles = [];
  for (let i = 0; i < times.length; i += 1) {
    const c = quote?.close?.[i];
    if (!(typeof c === "number" && c > 0)) continue;
    candles.push({
      t: (times[i] ?? 0) * 1e3,
      o: quote?.open?.[i] || c,
      h: quote?.high?.[i] || c,
      l: quote?.low?.[i] || c,
      c,
      v: 1
    });
  }
  const { computeVwap: computeVwap2 } = await import("./vwap");
  const frame = computeVwap2(candles.slice(-60));
  const spot = candles[candles.length - 1]?.c ?? 0;
  if (!frame || !(spot > 0)) return null;
  return { spot, vwap: frame.vwap, stdev: frame.stdev, candles, frame };
}
async function okxTape(instId) {
  const res = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(instId)}&bar=1m&limit=120`, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) return null;
  const data = await res.json();
  const candles = [];
  for (const row of data.data ?? []) {
    const c = Number(row[4]);
    if (!(c > 0)) continue;
    candles.push({
      t: Number(row[0]),
      o: Number(row[1]) || c,
      h: Number(row[2]) || c,
      l: Number(row[3]) || c,
      c,
      v: Number(row[5]) || 1
    });
  }
  candles.sort((a, b) => a.t - b.t);
  const { computeVwap: computeVwap2 } = await import("./vwap");
  const silver = /XAG/i.test(instId);
  if (silver) {
    let basis = 0;
    try {
      const text = await fetch("https://proxy.kitco.com/getPM?symbol=AG", { headers: { Accept: "text/plain", "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) }).then((r) => r.text());
      const parts = text.trim().split(",");
      const bid = Number(parts[4]);
      const ask = Number(parts[5]);
      const spot = ask > 20 ? ask : bid > 20 ? bid : 0;
      const last = candles[candles.length - 1]?.c ?? 0;
      if (spot > 20 && last > 20) basis = last - spot;
    } catch {
      basis = 0;
    }
    if (basis) {
      for (const candle of candles) {
        candle.o -= basis;
        candle.h -= basis;
        candle.l -= basis;
        candle.c -= basis;
      }
    }
    const five = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${encodeURIComponent(instId)}&bar=5m&limit=120`, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000)
    }).then((r) => r.ok ? r.json() : null).catch(() => null);
    const session = [];
    const open = nySessionOpen();
    for (const row of five?.data ?? []) {
      const t = Number(row[0]);
      const c = Number(row[4]);
      if (!(t >= open) || !(c > 0)) continue;
      session.push({
        t,
        o: (Number(row[1]) || c) - basis,
        h: (Number(row[2]) || c) - basis,
        l: (Number(row[3]) || c) - basis,
        c: c - basis,
        v: Number(row[5]) || 1
      });
    }
    session.sort((a, b) => a.t - b.t);
    const frame = computeVwap2(session.length >= 8 ? session : candles.slice(-60));
    const spot = candles[candles.length - 1]?.c ?? 0;
    if (!frame || !(spot > 0)) return null;
    return { spot, vwap: frame.vwap, stdev: frame.stdev, candles, frame };
  }
  const frame = computeVwap2(candles.slice(-60));
  const spot = candles[candles.length - 1]?.c ?? 0;
  if (!frame || !(spot > 0)) return null;
  return { spot, vwap: frame.vwap, stdev: frame.stdev, candles, frame };
}
function nySessionOpen(now = Date.now()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit"
  });
  const parts = fmt.formatToParts(new Date(now));
  const num = (type) => Number(parts.find((part) => part.type === type)?.value);
  let y = num("year");
  let m = num("month");
  let d = num("day");
  if (num("hour") < 18) {
    const prev = fmt.formatToParts(new Date(now - 86400000));
    const pick = (type) => Number(prev.find((part) => part.type === type)?.value);
    y = pick("year");
    m = pick("month");
    d = pick("day");
  }
  let guess = Date.UTC(y, m - 1, d, 22, 0, 0);
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", hour: "2-digit" });
  for (let i = 0; i < 6; i += 1) {
    const seen = Number(hour.format(new Date(guess)));
    if (seen === 18) break;
    guess += (18 - seen) * 3600000;
  }
  return guess;
}
function noteProbe(name, reason, extra = {}) {
  try {
    const path = join(process.cwd(), "data", "probe-skip.json");
    let prev = {};
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      if (parsed && typeof parsed === "object") prev = parsed;
    } catch {
      prev = {};
    }
    prev[name] = { at: (/* @__PURE__ */ new Date()).toISOString(), reason, ...extra };
    writeFileSync(path, JSON.stringify(prev));
  } catch {
  }
}
async function tryFive(halted, series, yahoo, tag) {
  return;
  const now = Date.now();
  const wait = probeRetry.get(series) ? 3000 : 2e4;
  if (halted || now - (probeAt.get(series) ?? 0) < wait) return;
  probeAt.set(series, now);
  try {
    const live = await import("./kalshi-live.server");
    if (!live.kalshiArmed()) {
      noteProbe(tag, "kalshi not armed");
      return;
    }
    const held = await live.heldFifteens();
    if (held.some((row) => String(row.ticker).includes(tag))) return;
    const { fifteenTicker: fifteenTicker2, fetchMarket: fetchMarket2 } = await import("./kalshi");
    const ticker = fifteenTicker2(series);
    const market = await fetchMarket2(ticker);
    if (!market?.ticker || market.status !== "active" || market.target == null) {
      if (market?.status === "active") probeRetry.set(series, true);
      noteProbe(tag, "window not open", { ticker, status: market?.status ?? "missing", target: market?.target ?? null });
      return;
    }
    if (!(market.yesAsk > 0.02 && market.yesAsk < 0.98)) {
      noteProbe(tag, "no quote", { ticker });
      return;
    }
    const left = market.closeTime ? (Date.parse(market.closeTime) - Date.now()) / 1000 : 999;
    if (!(left > 120)) {
      noteProbe(tag, "too late", { ticker, left: Math.round(left) });
      return;
    }
    const tape = tag === "SILVER" ? await okxTape("XAG-USDT-SWAP") : await yahooTape(yahoo);
    if (!tape) {
      noteProbe(tag, "no price", { yahoo });
      return;
    }
    const { spot, vwap, stdev } = tape;
    if (!(spot > 0) || !(vwap > 0)) {
      noteProbe(tag, "no vwap", { ticker, spot, vwap });
      return;
    }
    const target = market.target;
    const spine = readySpine(tag, tape.candles, vwap, stdev, spot, target);
    const broke = brokeUnder(tape.candles, vwap, stdev, spot, tag);
    const crossed = closedThrough(tape.candles, vwap, stdev, spot, tag);
    const opened = closeByBand(tag, spot, vwap, stdev);
    const long = crossed?.side === "up" ? crossed : opened?.side === "up" ? opened : null;
    const longMustCross = Boolean(long) && spot < vwap && target > vwap;
    let pattern = spine || null;
    if (left > 840 && !shortTap(pattern?.label, pattern?.side)) {
      noteProbe(tag, "waiting for the rejection", { ticker, left: Math.round(left) });
      return;
    }
    if (!spine && !/btc|gold|silver/i.test(tag)) {
      pattern = long && !longMustCross ? long : broke?.side ? broke : crossed?.side ? crossed : opened?.side ? opened : null;
    }
    if (!pattern?.side) {
      if (/btc|gold|silver/i.test(tag)) {
        noteProbe(tag, "no band side", { ticker, spot, vwap, target, label: "", side: "" });
        return;
      }
      const { detectPattern } = await import("./vwap");
      pattern = detectPattern(tape.candles, tape.frame);
    }
    if (/wti|natgas|oil/i.test(tag)) {
      const under = underBand(tag, spot, vwap, stdev);
      if (under && pattern?.side !== "down") pattern = under;
    }
    if (pattern?.side && bandInWay(pattern.side, spot, vwap, stdev, tag)) {
      noteProbe(tag, "band in the way", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side });
      return;
    }
    const longCross = pattern.side === "up" && spot < vwap && target > vwap;
    if (!spine && longCross) {
      const short = broke?.side === "down" ? broke : opened?.side === "down" ? opened : null;
      if (!short) {
        noteProbe(tag, "vwap between price and target", { ticker, spot, vwap, target, label: pattern?.label ?? "", side: pattern?.side ?? "" });
        return;
      }
      pattern = short;
    }
    if (!pattern?.side || !winningSetup(pattern.label, pattern.side, tag)) {
      noteProbe(tag, "not a winner", { ticker, spot, vwap, target, label: pattern?.label ?? "", side: pattern?.side ?? "" });
      return;
    }
    const mo = hourBlock(pattern.label, pattern.side);
    if (mo) {
      noteProbe(tag, "hour", { ticker, label: pattern.label, side: pattern.side, mo });
      return;
    }
    const bandBreak = /close below|tap-reject|broke/i.test(pattern.label || "");
    if (pattern.side === "down" && spot > vwap && target < vwap && !bandBreak) {
      noteProbe(tag, "short crosses vwap", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side });
      return;
    }
    if (pattern.side === "up" && spot < target && spot < vwap && target < vwap) {
      noteProbe(tag, "below the vwap", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side });
      return;
    }
    if (pattern.side === "up" && spot < vwap && !shortTap(pattern.label, pattern.side) || pattern.side === "down" && spot > vwap && !(target < vwap) && !shortTap(pattern.label, pattern.side)) {
      noteProbe(tag, "wrong side of vwap", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side });
      return;
    }
    const onTarget = spineOwns(tag) ? "" : shortBandOnTarget(tag, pattern.side, target, vwap, stdev, spot);
    if (onTarget) {
      noteProbe(tag, "band on target", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side });
      return;
    }
    const alive = survivalBlock(spot, vwap, stdev, pattern.side, pattern.label, target, tag);
    if (alive) {
      noteProbe(tag, "staying alive", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side, alive });
      return;
    }
    const ask = pattern.side === "up" ? market.yesAsk : market.noAsk ?? 0;
    const multiple = ask > 0.02 ? 1 / ask : 1;
    if (manualKalshi()) {
      const copyFloor = shortTap(pattern.label, pattern.side) ? 1.2 : 1.34;
      if (!(multiple >= copyFloor) || multiple > 1.65) return null;
      if (bandInWay(pattern.side, spot, vwap, stdev, tag)) return null;
      return {
        id: newId(),
        openedAt: (/* @__PURE__ */ new Date()).toISOString(),
        closedAt: null,
        asset: "silver",
        ticker,
        side: pattern.side,
        source: "paper",
        setupId: `${ticker}:${pattern.side}`,
        autoFilled: true,
        probe: false,
        patternLabel: pattern.label,
        stake: 5,
        ask,
        multiple,
        contracts: 5 / Math.max(ask, 0.02),
        result: "open",
        payout: null,
        profit: null,
        exitPct: armPct(multiple),
        holdToExpiry: false,
        conviction: 0,
        notes: "Paper only.",
        grokThesis: "",
        target,
        lastSpot: spot,
        entryVwap: vwap,
      };
    }
    const copyFloor = shortTap(pattern.label, pattern.side) ? 1.2 : sureLate(pattern.side, pattern.label, spot, target, left) ? 1.2 : 1.34;
    if (!(multiple >= copyFloor) || (shortTap(pattern.label, pattern.side) && multiple > 1.65)) {
      noteProbe(tag, "multiple", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side, multiple: Math.round(multiple * 100) / 100 });
      return;
    }
    noteProbe(tag, "prime book only", { ticker, label: pattern.label, side: pattern.side });
    return;
  } catch (err) {
    noteProbe(tag, "error", { error: err instanceof Error ? err.message : String(err) });
  }
}
function altStake(tag) {
  try {
    const row = JSON.parse(readFileSync(join(process.cwd(), "data", "live-size.json"), "utf8"));
    const n = Number(tag === "ETH" ? row.eth : tag === "SOL" ? row.sol : tag === "SILVER" ? row.silver || 10 : tag === "WTI" || tag === "NATGAS" ? 10 : row.dollars);
    if (n >= 1 && n <= 100) return n;
  } catch {
  }
  return 22;
}
function silverSide(spot, vwap, stdev) {
  const width = Math.max(stdev, 0);
  if (!(spot > 0) || !(vwap > 0) || !(width > 0)) return null;
  let dist = Math.abs(spot - vwap);
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    dist = Math.min(dist, Math.abs(spot - (vwap + step * width)), Math.abs(spot - (vwap - step * width)));
  }
  if (dist > width * 0.1) return null;
  if (spot < vwap) return "down";
  if (spot > vwap) return "up";
  return null;
}
function primeBandLabel(spot, vwap, stdev) {
  const width = Math.max(stdev, 0);
  if (!(width > 0)) return null;
  let level = vwap;
  let dist = Math.abs(spot - vwap);
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    for (const price of [vwap + step * width, vwap - step * width]) {
      const gap = Math.abs(spot - price);
      if (gap < dist) {
        level = price;
        dist = gap;
      }
    }
  }
  const z = (level - vwap) / width;
  const mag = Math.abs(z);
  const bucket = mag < 0.75 ? "0.5" : mag < 1.25 ? "1" : mag < 1.75 ? "1.5" : mag < 2.25 ? "2" : "2.5";
  const sign = z >= 0 ? "+" : "−";
  return `Open ${sign}${bucket}σ`;
}
function bandInFront(spot, vwap, stdev, side) {
  const width = Math.max(stdev, 0);
  if (!(spot > 0) || !(width > 0)) return false;
  const levels = [vwap];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * width, vwap - step * width);
  const room = width * 0.6;
  return levels.some((level) => {
    const gap = side === "down" ? spot - level : level - spot;
    return gap > width * 0.03 && gap <= room;
  });
}
var TOUCH_FILE = join(process.cwd(), "data", "touch-short.json");
function readArms() {
  try {
    return JSON.parse(readFileSync(TOUCH_FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeArms(row) {
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(TOUCH_FILE, JSON.stringify(row));
  } catch {
  }
}
function nextBandUp(spot, vwap, stdev) {
  const width = Math.max(stdev, 0);
  const levels = [];
  if (width > 0) {
    for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * width, vwap - step * width);
  }
  return levels.filter((level) => level > spot).sort((a, b) => a - b)[0] ?? null;
}
function armShort(tag, ticker, spot, vwap, stdev) {
  const book = readArms();
  const band = nextBandUp(spot, vwap, stdev);
  const width = Math.max(stdev, 0);
  const room = width * 0.06;
  if (!(room > 0)) return { send: false, why: "waiting for the band" };
  if (book[tag] && book[tag].ticker !== ticker) delete book[tag];
  const held = book[tag];
  if (held) {
    if (spot > held.band + room * 0.35) {
      delete book[tag];
      writeArms(book);
      return { send: false, band: held.band, why: "ran through the band" };
    }
    if (spot >= held.band - room) {
      if (!held.tagged) {
        book[tag] = { ...held, tagged: true };
        writeArms(book);
      }
      return { send: true, dollars: 10, band: held.band, why: "tagged the band" };
    }
    return { send: false, band: held.band, why: "waiting for the band" };
  }
  if (band && band - spot > room) {
    book[tag] = { ticker, band, at: (/* @__PURE__ */ new Date()).toISOString() };
    writeArms(book);
    return { send: false, band, why: "waiting for the band" };
  }
  return { send: true, band, why: "on the band" };
}
function noteCash(row) {
  try {
    const file = join(process.cwd(), "data", "cash-trace.json");
    let prev = [];
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      if (Array.isArray(parsed)) prev = parsed;
    } catch {
      prev = [];
    }
    writeFileSync(file, JSON.stringify([row, ...prev].slice(0, 40)));
  } catch {
  }
}
function fallBand(asset?: { spot?: number; close?: number; vwap1m?: { vwap?: number; stdev?: number } | null }) {
  const spot = Number(asset?.spot);
  const close = Number(asset?.close);
  const vwap = Number(asset?.vwap1m?.vwap);
  const stdev = Number(asset?.vwap1m?.stdev);
  const falling = spot > 0 && close > 0 && spot < close;
  let intoBand = false;
  if (falling && vwap > 0 && stdev > 0) {
    const channel = stdev * 0.5;
    for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
      const level = vwap - step * stdev;
      if (level < spot && spot - level <= channel) intoBand = true;
    }
  }
  return { falling, intoBand };
}
async function cashHeld(assets?: Record<string, { spot?: number; target?: number | null; vwap1m?: { vwap?: number; stdev?: number } | null }>) {
  if (Date.now() - cashHeldAt < 1e3) return;
  cashHeldAt = Date.now();
  const peakFile = join(process.cwd(), "data", "trail-peak.json");
  let peaks = {};
  try {
    const parsed = JSON.parse(readFileSync(peakFile, "utf8"));
    if (parsed && typeof parsed === "object") peaks = parsed;
  } catch {
    peaks = {};
  }
  try {
    const live = await import("./kalshi-live.server");
    const held = await live.heldFifteens();
    let changed = false;
    const open = new Set(held.map((row) => row.ticker));
    // A resting take-profit order must never outlive its position (it would open the other side): cancel leftovers.
    try {
      const tpRest = g.__aureliusTpRest || {};
      for (const t of Object.keys(tpRest)) if (!open.has(t) && !tpRest[t]?.busy) {
        try { appendFileSync(join(process.cwd(), "data", "tp-rest.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: t, cancel: "position not in held list", heldCount: held.length }) + "\n"); } catch {}
        void live.cancelTpRest(t);
      }
    } catch {
    }
    const miss = g.__aureliusPeakMiss || (g.__aureliusPeakMiss = {});
    for (const ticker of Object.keys(peaks)) {
      if (open.has(ticker)) {
        miss[ticker] = 0;
        continue;
      }
      miss[ticker] = (miss[ticker] || 0) + 1;
      if (miss[ticker] < 5) continue;
      delete peaks[ticker];
      delete miss[ticker];
      changed = true;
    }
    for (const row of held) {
      if (!(row.cost > 0) || !(Math.abs(row.pos) >= 0.01)) continue;
      // Oct 15 ~7:10 PM PT (Love: "no the take profits are fine hun it's that she entered a position in the other
      // direction. that's not allowed. no second positions for now"): the brief hands-off-hand-trades skip that lived
      // here was HER CALL to remove - take-profit management runs on every position as before. What stays dead is the
      // SECOND POSITION: the hand-window block in kalshi-live (no book entry on a hand-traded ticker, held or exited),
      // one-door, and the same-side resting-order pull.
      const res = await fetch(`https://external-api.kalshi.com/trade-api/v2/markets/${row.ticker}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const yesBid = Number.parseFloat(data.market?.yes_bid_dollars ?? "0");
      const noBid = Number.parseFloat(data.market?.no_bid_dollars ?? "0");
      const yesAsk = Number.parseFloat(data.market?.yes_ask_dollars ?? "0");
      const noAsk = Number.parseFloat(data.market?.no_ask_dollars ?? "0");
      const bid = screenBid(row.pos, yesBid, yesAsk, noBid, noAsk);
      if (!(bid > 0.02)) continue;
      const qty = Math.abs(row.pos);
      const multiple = row.cost > 0 ? qty / row.cost : 0;
      const floor = multiple > 0 && multiple <= 1.28 ? 25 : 28;
      const id = /BTC/i.test(row.ticker) ? "btc" : /GOLD/i.test(row.ticker) ? "gold" : /SILVER/i.test(row.ticker) ? "silver" : "";
      const snap = id ? assets?.[id] : undefined;
      const target = Number.parseFloat(data.market?.floor_strike ?? "") || snap?.target || 0;
      const meta = g.__aureliusPeakMeta || (g.__aureliusPeakMeta = {});
      const sign = row.pos > 0 ? 1 : -1;
      const stamp = meta[row.ticker];
      if (!stamp || stamp.sign !== sign || Math.abs(Number(stamp.cost) - row.cost) > 0.05) {
        peaks[row.ticker] = 0;
        meta[row.ticker] = { sign, cost: row.cost };
        changed = true;
      }
      // SLIDER STAYS ON ITS SIDE (Oct 18 ~9:35 AM PT, Love: "what just happened to my short????? it closed for $3 i had a payout of $25"): her
      // 9:22 AM slider (+77.6%) was set on her LONG; she flipped to a NO short at 9:25/9:28 and the slider - kept per window for 20 min - sold the
      // short at 26c (14.6c x 1.776) a minute before it paid $24.42. A slider now only counts for the side it was set on: when the position flips
      // side, a slider set before the flip is ignored.
      const PSd: Record<string, { sign: number; since: number }> = (g as any).__aureliusPinSide || ((g as any).__aureliusPinSide = {});
      const sgnNow = row.pos > 0 ? 1 : -1;
      if (!PSd[row.ticker]) PSd[row.ticker] = { sign: sgnNow, since: 0 };
      else if (PSd[row.ticker].sign !== sgnNow) PSd[row.ticker] = { sign: sgnNow, since: Date.now() };
      const pinSide = (() => { const p0 = readPin(row.ticker); return p0 && !(Number(p0.at) < PSd[row.ticker].since) ? p0 : null; })();
      // fix165 (Oct 24 ~4:10 PM PT, Love card 'Slider keeps its spot on the scale'): her slider remembers its share of the way to $1 from the
      // average it was set on; after an add-on changes the average, the % is re-scaled so the sell line keeps that share (3:58 PM: +150% on 38c = 95c,
      // then a 7c add made it 49c on a 20c average and sold the whole stack before a YES settle).
      if (pinSide && Number(pinSide.pct) > 0) {
        try {
          const q0 = Math.abs(Number(row.pos) || 0), e1 = q0 > 0 ? Number(row.cost) / q0 : 0;
          const PB = (g.__pinBase ||= {}) as Record<string, { at: string; e: number }>;
          const pAt = String((pinSide as any).at ?? "");
          if (e1 > 0.02 && e1 < 1 && (!PB[row.ticker] || PB[row.ticker].at !== pAt)) PB[row.ticker] = { at: pAt, e: e1 };
          const e0 = PB[row.ticker]?.e || 0;
          if (e0 > 0.02 && e0 < 1 && e1 > 0.02 && e1 < 1 && Math.abs(e1 - e0) >= 0.005) {
            const share = Math.min(1, (e0 * (1 + Number(pinSide.pct) / 100) - e0) / (1 - e0));
            (pinSide as any).pct = Math.round(((e1 + share * (1 - e1)) / e1 - 1) * 10000) / 100;
          }
        } catch {}
      }
      const decision = quoteSale(row.cost, bid, row.pos, floor, peaks[row.ticker] ?? 0, pinSide, {
        asset: id,
        side: row.pos > 0 ? "up" : "down",
        spot: snap?.spot,
        target,
        vwap: snap?.vwap1m?.vwap,
        stdev: snap?.vwap1m?.stdev,
      });
      const entryPx = qty > 0 ? row.cost / qty : 0;
      noteCash({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        ticker: row.ticker,
        bid,
        cost: row.cost,
        pct: Math.round((Math.abs(row.pos) * bid - row.cost) / row.cost * 100),
        why: decision.why,
        action: decision.action
      });
      if (decision.peak !== (peaks[row.ticker] ?? 0)) {
        peaks[row.ticker] = decision.peak;
        changed = true;
      }
      const pin = pinSide;
      // Claude: one take-profit, and it always fires.
      // Your slider wins whenever you set it, above OR below the table. Otherwise the per-multiple
      // table decides (33 / 44 / 50 / 60 / max-15). Once a trade touches its line it is armed: if the
      // first sale misses because the bid moved, she keeps selling on the next ticks while the trade
      // is still green, instead of letting a winner ride to the bell.
      const laterPin = false;
      // Model profile (Love): "original" = her first take-profit table, selling at the touch.
      let tpMode = "new";
      try {
        tpMode = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).tpMode === "original" ? "original" : "new";
      } catch {
      }
      const origArm = (() => {
        const mult = entryPx > 0.02 && entryPx < 1 ? 1 / entryPx : 0;
        const maxP = (mult - 1) * 100;
        if (!(maxP > 0)) return 0;
        let a = mult <= 1.4 ? 33 : mult <= 1.5 ? 44 : mult <= 1.6 ? 50 : mult <= 1.7 ? 60 : maxP - 15;
        if (a > maxP - 5) a = maxP - 5; // 5% under the max when the line can't be reached (Love, Oct 3)
        if (a < 1) a = maxP * 0.5;
        return Math.round(a * 10) / 10;
      })();
      // 88% OF THE MAX (Love, Oct 3 ~5:25 PM PT: "lets make it 88% out of respect"): live-switch "tpOfMax" sets every live
      // take profit to that share of what the trade can pay. Her slider still wins when she sets it.
      let liveCfg: { tpOfMax?: number; netBelow?: number[]; autoExits?: boolean; insurance?: { on?: boolean; arm?: number; lo?: number; hi?: number; dollars?: number } } = {};
      try {
        liveCfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
      } catch {
      }
      const maxPctLive = entryPx > 0.02 && entryPx < 1 ? (1 / entryPx - 1) * 100 : 0;
      const tpOfMax = Number(liveCfg.tpOfMax) > 0 && Number(liveCfg.tpOfMax) <= 100 ? Number(liveCfg.tpOfMax) : 0;
      // HARD TP LADDER (Love, Oct 4 ~1:40 AM PT: "if there is 50% or less set it to 44%... if there is 60 set it to 55%... all the
      // way up to 1.8x. anything over 1.8x just set to 10% less than whatever the percentage is on kalshi"). Read off the max
      // the trade can pay (Kalshi's % to win): max 50% or less -> max - 6 points; up to 1.8x (80%) -> max - 5; over 1.8x -> max - 10.
      // live-switch "tpLadder": true turns it on (it beats tpOfMax). Her slider still wins when she sets one.
      const ladderOn = (liveCfg as { tpLadder?: boolean }).tpLadder === true;
      const ladderArm = maxPctLive > 0 ? Math.max(maxPctLive * 0.5, maxPctLive <= 50 ? maxPctLive - 6 : maxPctLive <= 80 ? maxPctLive - 5 : maxPctLive - 10) : 0;
      // BOOK EXITS LIKE PAPER (Love, Oct 5 ~12:45 PM PT: "run her on brick today, alone... however you have her running
      // paper, lets let her do her thing"). live-switch "bookLikePaper": true = a position a book copied uses that book's
      // paper take profit: 90% of the max, then rides with a 1% trail under the best bid (never below the line, 97c+ sells).
      // Love's own trades keep her ladder. Her slider still wins on either.
      // YOURS LIKE HERS (Oct 18 ~9:35 AM PT, Love: "the same thing hun half at 75% the rest at 90% of the scale - same thing"): live-switch
      // "handLikePaper" gives her own trades the books' exits too - the rest sells at 90% of the max (half at 75% is halfAt75Hand). Her slider still wins.
      const likePaper = (liveCfg as { bookLikePaper?: boolean }).bookLikePaper === true && (botOwnsPosition(row) || (liveCfg as { handLikePaper?: boolean }).handLikePaper === true);
      const tableArm0 = likePaper && maxPctLive > 0 ? Math.round(Math.max(1, maxPctLive * 0.9) * 100) / 100 : ladderOn && ladderArm > 0 ? Math.round(ladderArm * 100) / 100 : tpOfMax > 0 && maxPctLive > 0 ? Math.round(maxPctLive * tpOfMax) / 100 : tpMode === "original" ? origArm : trailScale(entryPx).arm;
      // WHOLE-CENT LINE (Love, Oct 4 12:12 AM PT: "it didn't take at 90%... it flashed $33"): Kalshi bids move in whole cents,
      // so a line at 96.2c could only fire at 97c. The line now rounds DOWN to the cent the bid can actually print (96c).
      const tableArm = entryPx > 0.02 && tableArm0 > 0 ? Math.round(((Math.floor(entryPx * (1 + tableArm0 / 100) * 100 + 1e-6) / 100 / entryPx) - 1) * 10000) / 100 : tableArm0;
      const pinPct = pin && Number(pin.pct) >= 1 ? Number(pin.pct) : 0;
      const tpLine = pinPct > 0 ? pinPct : tableArm;
      const tpLive = entryPx > 0 ? (bid / entryPx - 1) * 100 : 0;
      const armedTp = g.__aureliusTpArmed || (g.__aureliusTpArmed = {});
      const tpPeaks = g.__aureliusTpPeak || (g.__aureliusTpPeak = {});
      if (tpLine > 0 && tpLive + 1e-9 >= tpLine) {
        armedTp[row.ticker] = tpLine;
        tpPeaks[row.ticker] = Math.max(tpPeaks[row.ticker] ?? tpLive, tpLive);
      }
      const tpOn = pinPct > 0 || scaleOn();
      // Love (4:10 AM): at the take profit she does NOT sell straight away. She rides the move and
      // trails 1% under the highest quote she has seen (1% sub-gates), so a flash to +100% gets
      // caught near the top. Never below the take-profit line itself. At 97c+ there is nothing left
      // to catch, so she sells. Your slider (pin) still sells the moment it is touched.
      const trailFloor = armedTp[row.ticker] > 0 ? Math.max(tpLine, Math.floor(tpPeaks[row.ticker] ?? tpLine) - 1) : Infinity;
      // HARD TAKE PROFIT (Love, 6:35 PM PT Oct 2: "just make them solid take profits"): with live-switch
      // "tpHard": true she sells the moment the line is touched (under 1.65x a literal +50%, 1.65x and up
      // 75% of the max) instead of riding a trail that can give the top back.
      let tpHard = false;
      try {
        // Oct 3 ~12:30 AM PT (Love: "just set a hard take profit at the levels we set"): hard is the default now.
        tpHard = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).tpHard !== false && !likePaper;
      } catch {
      }
      // SAFETY NET (Love, Oct 3 ~5:25 PM PT: "if we have it set to 90, have the safety net engage at 75%, if it passes 80,
      // doesn't hit 90, sell there"). Measured in % of the max, relative to the take profit in force (her slider or the
      // 88% line): with the line at 90% of max, a trade that got past 75% and falls back sells at 75%; past 80%, at 80%.
      // live-switch "netBelow" holds the steps under the line ([15, 10] = line-15 and line-10). It replaces the old
      // every-10%-from-40 slider ladder.
      const pinPeaks = g.__aureliusPinPeak || (g.__aureliusPinPeak = {});
      let pinStep = false;
      let pinFloor = 0;
      let netPeakOfMax = 0;
      const netBelow = Array.isArray(liveCfg.netBelow) ? liveCfg.netBelow.map(Number).filter((n) => n > 0 && n < 100) : [];
      if (maxPctLive > 0 && tpLine > 0 && netBelow.length) {
        pinPeaks[row.ticker] = Math.max(pinPeaks[row.ticker] ?? tpLive, tpLive);
        netPeakOfMax = (pinPeaks[row.ticker] / maxPctLive) * 100;
        const lineOfMax = Math.min(100, (tpLine / maxPctLive) * 100);
        const steps = netBelow.map((n) => lineOfMax - n).filter((x) => x > 0 && netPeakOfMax >= x + 0.5); // counts once she is 0.5% of max past it
        const stepOfMax = steps.length ? Math.max(...steps) : 0;
        pinFloor = Math.round(((stepOfMax * maxPctLive) / 100) * 10) / 10;
        pinStep = stepOfMax > 0 && tpLive <= pinFloor && tpLive + 1e-9 < tpLine && bid > 0.02;
      } else {
        delete pinPeaks[row.ticker];
      }
      const tpSell = (pinStep) || (tpOn && tpLine > 0 && armedTp[row.ticker] > 0 && (pinPct > 0 || tpMode === "original" || tpHard || bid >= 0.97 || tpLive < trailFloor));
      if (tpSell) decision.why = pinStep && !(tpLive + 1e-9 >= tpLine) ? `safety net: got to ${Math.round(netPeakOfMax)}% of the max, fell back to the +${pinFloor}% step` : pinPct > 0 ? `your slider ${Math.round(pinPct)}%` : tpHard ? `hard take profit: touched +${Math.round(tpLive)}% (line +${Math.round(tpLine)}%, ${entryPx > 0 ? (1 / entryPx).toFixed(2) : "?"}x)` : `take profit: peaked +${Math.round(tpPeaks[row.ticker] ?? tpLive)}%, sold on the 1% trail (line +${Math.round(tpLine)}%, ${entryPx > 0 ? (1 / entryPx).toFixed(2) : "?"}x)`;
      if (tpSell) decision.lock = tpLine;
      // MIRROR PAPER 1:1 (Love, Oct 8 ~3:45 PM PT: "rewire kalshi to fire 1:1 with the paper books. if they are letting
      // winners ride and kalshi is exiting early, let's make them do the same things so her live books can shine too").
      // A position one of her books opened (no slider set) now leaves Kalshi exactly when that book's paper trade leaves,
      // for whatever reason paper left (take profit + trail, gate, lock the win, cut), and rides to the bell when paper
      // does. Kalshi's own copies of those rules and the resting 95c take profit stand down on it (half at 75% stays), so live
      // can't bank early what paper lets run. Day check Oct 8: the same 73 trades made +$166 on paper and -$30 live.
      // HALF AT 75% STAYS (Love, ~3:55 PM PT: "i like that she's taking 75% for the banks, it's catching more"): on the 17
      // live half-sales so far it netted +$30 vs keeping the whole position (11 cost ~50c each selling at ~92c instead of
      // ~95c; 4 saved $4-$20 on reversals). So the half still sells at 75% of the max; the other half mirrors paper.
      // Her slider still wins; HANDS OFF still holds. If the paper row can't be found, the old rules run.
      // live-switch "mirrorPaper" (default on).
      let mirrorRow = null;
      let mirrorOwn = null;
      // MIRROR FOR THE FAST TWIN (Love, Oct 15 ~5:35 PM PT: "make her mirror papers exits" - the 8:15 PM long entered
      // perfectly and was sold at +12% by LOCK THE WIN while paper rode to +138%). live-switch "mirrorPaperBooks" lists
      // books that mirror their paper row's exits even while the global mirrorPaper stays off (her Oct 11 setting for
      // the other live books is untouched). The paper-row lookup now also includes the scanner-lane rows (asNightRows):
      // it only read the night book, so a lane-owned position could never find its paper row and silently fell back to
      // the old exit stack.
      const mpBooks: string[] = Array.isArray((liveCfg as { mirrorPaperBooks?: string[] }).mirrorPaperBooks) ? ((liveCfg as { mirrorPaperBooks?: string[] }).mirrorPaperBooks as string[]) : [];
      if (((liveCfg as { mirrorPaper?: boolean }).mirrorPaper !== false || mpBooks.length > 0) && botOwnsPosition(row) && !(pinPct > 0)) {
        try {
          mirrorOwn = bookOwnerOf(row.ticker);
          if (mirrorOwn && (liveCfg as { mirrorPaper?: boolean }).mirrorPaper === false && !mpBooks.includes(String(mirrorOwn.id).split(":")[1] || "")) mirrorOwn = null;
          if (mirrorOwn) {
            const pc = g.__aureliusPaperById && Date.now() - g.__aureliusPaperById.at < 2000 ? g.__aureliusPaperById : (g.__aureliusPaperById = { at: Date.now(), map: new Map([...(await import("./nightbook")).listNight(), ...((await import("./grokog")).asNightRows() as any[])].map((r) => [r.id, r])) });
            mirrorRow = pc.map.get(mirrorOwn.id) || null;
          }
        } catch {
          mirrorRow = null;
        }
      }
      const mirrorOn = Boolean(mirrorRow);
      if (mirrorOn) {
        try {
          const tpR = g.__aureliusTpRest || {};
          if (tpR[row.ticker]?.id && !tpR[row.ticker]?.busy) void live.cancelTpRest(row.ticker);
        } catch {
        }
      }
      // RESTING TAKE PROFIT (Love, Oct 4 ~12:55 AM PT): keep a sell order sitting at the take-profit price (her slider's
      // price when she set one), sized to the whole position, re-placed if the price or size changes. The bid-watching
      // sale below stays on as a backup. Off with live-switch "tpRest": false.
      try {
        const tpRest = g.__aureliusTpRest || (g.__aureliusTpRest = {});
        const restOn = (liveCfg as { tpRest?: boolean }).tpRest !== false && liveCfg.autoExits !== false;
        const closeIso = String(data.market?.close_time || "");
        if (restOn && !mirrorOn && tpOn && tpLine > 0 && entryPx > 0.02 && qty >= 0.01 && closeIso && !tpSell) {
          const px = Math.min(0.99, Math.floor(entryPx * (1 + tpLine / 100) * 100 + 1e-6) / 100);
          const cur = tpRest[row.ticker];
          const stale = !cur || Math.abs((cur.px ?? 0) - px) >= 0.005 || Math.abs((cur.qty ?? 0) - Math.floor(qty * 100) / 100) > 0.01;
          const cool = cur?.failedAt && Date.now() - cur.failedAt < 30000;
          if (stale && !cur?.busy && !cool && px > bid) {
            tpRest[row.ticker] = { ...(cur || {}), busy: true };
            try {
              appendFileSync(join(process.cwd(), "data", "tp-rest.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: row.ticker, px, qty: Math.floor(qty * 100) / 100, bid, had: cur ? { id: cur.id ?? null, px: cur.px ?? null, qty: cur.qty ?? null, failed: Boolean(cur.failedAt) } : null }) + "\n");
            } catch {
            }
            void (async () => {
              try {
                if (cur?.id) await live.cancelTpRest(row.ticker);
                const r = await live.restTakeProfit(row.ticker, row.pos, px, closeIso);
                const reg = g.__aureliusTpRest || (g.__aureliusTpRest = {});
                reg[row.ticker] = r?.orderId ? { id: r.orderId, px, qty: r.qty } : { id: null, px, qty: Math.floor(qty * 100) / 100, failedAt: Date.now() };
              } catch {
                const reg = g.__aureliusTpRest || (g.__aureliusTpRest = {});
                reg[row.ticker] = { id: null, px, qty: 0, failedAt: Date.now() };
              }
            })();
          }
        }
      } catch {
      }
      // ADD-ON $5 (Love, Oct 4 ~2:45 AM PT: "just add in the $5 positions at a rejection of a band if price rejects, that way
      // price going down is happy thing"). A live BTC position that has dipped so its side costs <= maxAsk (55c = 1.8x+), with
      // 5+ min left, and price has just rejected one of her lines back OUR way: one $5 buy on the same side, once per window.
      // Replay (Oct 2-4, 19 adds): 9 won, +$13.90. live-switch "addOn": { on, dollars, maxAsk, minLeft }.
      try {
        const ao = (liveCfg as { addOn?: { on?: boolean; dollars?: number; maxAsk?: number; minLeft?: number } }).addOn;
        // ONE, EVEN ACROSS A RESTART (Oct 20 ~11:38 PM PT, Love: "please make sure only ONE goes out" - an earlier version fired 25 $2 adds and lost $55): the
        // once-per-position latch is rebuilt from data/addon-log.jsonl whenever the desk starts fresh, so a restart can never reopen a window that already added.
        if (!g.__aureliusAddOn) {
          const seed = {};
          try { for (const ln of readFileSync(join(process.cwd(), "data", "addon-log.jsonl"), "utf8").split("\n").slice(-400)) { try { const x = JSON.parse(ln); if (x && x.ok && x.ticker) seed[x.ticker] = Date.parse(x.at) || Date.now(); } catch {} } } catch {}
          g.__aureliusAddOn = seed;
        }
        const addReg = g.__aureliusAddOn;
        // MAIN BOOK ONLY (Love, same message: "ONE $2 dollar add on to our main books positions"): the delayed twin's positions never add.
        let aoTwin = false;
        try { aoTwin = String(bookOwnerOf(row.ticker)?.id || "").split(":")[1] === "recon-dly"; } catch { aoTwin = false; }
        // $2 AT A BAND, 2.8x+ (Oct 17 ~1:15 PM PT, Love: "implement the $2 add on for me at a band, as long as it's over 2.8x actually / so it's
        // effectively 1/5th of the normal position size" + her picks: band rejection her way, once per window, 5+ min left, BTC and gold, her trades
        // only). addOn { on, dollars 2, maxAsk 0.35 }. A refused/unfilled try retries after 5 s; only a fill uses up the window's add-on.
        const addTry = g.__aureliusAddTry || (g.__aureliusAddTry = {});
        const aoClose = String(data.market?.close_time || "");
        const mySide: "up" | "down" = row.pos > 0 ? "up" : "down";
        // TWIN ADD-ON $3 AT 4.5x+ (Oct 22 ~10:20 AM PT, Love: "a $3 add on if they go further away, get a 4.5x + on those / we're chillinnn on the delayed hours"):
        // the DELAYED twin's live positions now add too - live-switch addOn.twin { on, dollars 3, maxAsk 0.222 } - same rejection-her-way trigger, once per position.
        const aoTw = (ao as any)?.twin;
        const aoOff = aoTwin ? null : offHourMain(id); // fix142: her off hours add $3 at 2.8x+
        const aoMax = aoTwin ? (Number(aoTw?.maxAsk) > 0 ? Number(aoTw.maxAsk) : 0.222) : aoOff ? aoOff.aoMax : Number(ao?.maxAsk) > 0 ? Number(ao!.maxAsk) : 0.55;
        const aoLeft = (Date.parse(aoClose) - Date.now()) / 60000;
        if (ao?.on && (!aoTwin || aoTw?.on === true) && (id === "btc" || id === "gold") && botOwnsPosition(row) && !tpSell && (ao.noLimit ? true : !addReg[row.ticker]) && !(Date.now() - (addTry[row.ticker] || 0) < 5000) && bid > 0.02 && bid <= Math.max(aoMax, 0.294) && aoLeft >= (Number(ao.minLeft) || 5)) {
          // $3 TAP REJECTION (Oct 17 ~10:57 PM PT, Love: "let's make it a $3 tap rejection"): bandlock.addOnTapNow replaces the old snap here.
          let why: string | null = null;
          try { const blm = await import("./bandlock"); why = blm.addOnTouchNow(id) || null; /* fix109 (Oct 22 ~7:48 PM PT, Love: "pls have her do them at band taps / no rejection necessary pls"): main-book add-on on a band touch too (walls still judge it); was aoTwin ? touch : addOnTapNow */ void mySide; } catch { why = null; }
          // ARMED BY THE FIRST BAND (fix131, Oct 22 ~11:55 PM PT, Love: "btc didn't do the add on near red when it hit 3.8x ... gold and btc should still do the add on ...
          // at the first band price encounters ... pls make sure those go through ... fix the root of the issue so they always do"): the 11:50 PM BTC red-zone touch was
          // refused (LIVE off for an install) and by the time the ask was back under the cap price had left the band, so nothing re-fired until the pink. Now the first
          // band touch ARMS the add-on for that position: whenever the multiple is there afterwards (this gate), it goes - no second touch needed. Both books.
          { const arm = (g.__aureliusAddArm || (g.__aureliusAddArm = {})); if (why) arm[row.ticker] = String(why); else if (arm[row.ticker] && !aoTwin /* fix309 */) why = `${arm[row.ticker]} (armed earlier; the multiple is here now)`; }
          // HER ADD-ON AT THE NEXT BAND (fix309, Oct 27 2026 ~1:49 AM PT, Love: "she's supposed to do her add on at the next band. not as soon as it's available"): the DELAYED
          // twin is never armed - her add-on goes only while price is at a band, and never the band her entry touched (recon records it).
          const bandOf = (w: string | null) => { const m = /^(?:touched |came within \$[\d.]+ of )(.+?) \(/.exec(String(w || "")); return m ? m[1] : ""; };
          const twEB: Record<string, string> = {}; { const tb = String(g.__twinTouchBand?.[row.ticker] || ""); twEB[row.ticker] = ({ "5m PP": "the pink", "BB upper": "Bollinger upper", "BB lower": "Bollinger lower", "5m S1": "Green zone", "5m R1": "Red zone" } as Record<string, string>)[tb] || tb; } // the band her entry touched (recon fix309)
          // THE BEST MULTIPLE, 3.4x IF IT FLIPS FIRST (fix132, Oct 22 ~11:59 PM PT, Love: "if price is approaching one and rejecting near it before 3.8x, she can get a 3.4x
          // if it's absolutely necessary for the add on / let's attempt to have her get the highest one she can though / if price is clearly coming at the band hard she can
          // wait for it to get close ... if it flips before it comes close enough have her do the add on then, minimum 3.4x"): a touch (or an armed touch) waits for her
          // 3.8x cap as before; a rejection her way near a band (tap-and-push off session bands, pink, Bollinger, zones) before the touch buys at 3.4x+ (29.4c).
          let aoCap = aoMax;
          try { if (bid > aoMax || !why) { const blm2 = await import("./bandlock"); const rj = blm2.addOnTapNow(id, mySide); if (rj) { why = `${rj} - flipped near the band, ${aoOff ? "2.8x+ (off hours)" : "3.4x+"}`; aoCap = Math.max(aoMax, 0.294); } } } catch {}
          if (why && aoTwin && twEB[row.ticker] && bandOf(why) === twEB[row.ticker]) why = null; // fix309: not her entry band
          if (why && bid > aoCap) why = null;
          // NO LIMIT - ONE PER DISTINCT REJECTION (Oct 19 ~9:56 PM PT, Love: "if a position reverses on us i want her to do a $2 add on at either a
          // rejection of a red or green zone, or any band at a multiple of 3.8x or more - no limit on that"): with addOn.noLimit the once-per-window
          // latch is off; each DISTINCT rejection (band + 5m candle) may add once, so one lingering rejection can't machine-gun $2s every 5 s.
          const aoEvt = (g.__aureliusAddEvt || (g.__aureliusAddEvt = new Set()));
          const aoEk = why ? `${row.ticker}|${String(why).slice(0, 48)}|${Math.floor(Date.now() / 300000)}` : "";
          if (why && ao.noLimit && aoEvt.has(aoEk)) why = null;
          if (why) {
            addTry[row.ticker] = Date.now();
            void (async () => {
              let r: { ok?: boolean; reason?: string; filled?: number; px?: number; ask?: number } | null = null;
              try {
                r = await live.addOnBuy(row.ticker, mySide, aoTwin ? (Number(aoTw?.dollars) || 3) : aoOff ? aoOff.aoDollars : Number(ao.dollars) || 5, aoCap, true); // FREE ADD-ON BOTH BOOKS (fix110, Oct 22 ~7:53 PM PT, Love: "just the next band it comes near, not a valid rejection or candle color necessary bb, just first interaction - 3.8x + ... just a flat $2 on those"): walls skip add-ons like the twin's (was free only for the twin)
              } catch (err) {
                r = { ok: false, reason: err instanceof Error ? err.message.slice(0, 120) : "add-on failed" };
              }
              if (r?.ok) { addReg[row.ticker] = Date.now(); if (aoEk) aoEvt.add(aoEk); }
              try {
                appendFileSync(join(process.cwd(), "data", "addon-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: row.ticker, side: mySide, why, bid, ...(r || {}) }) + "\n");
              } catch {
              }
            })();
          }
        }
      } catch {
      }
      // INSURANCE ON POLYMARKET (Love, Oct 3 ~11 PM PT: "you're not literally selling 25% of the position on kalshi? just
      // placing the $5 on polymarket right?" ... ~11:35 PM: "do one $5 at 4x, another $2 at 8x"). The Kalshi position is
      // never touched. Once a BTC position has proven itself (+40%), separate tickets go on the OTHER side of Polymarket's
      // BTC 15-minute market for the same window, held to the bell: $5 when that side pays 4x (25c or less), and $2 more
      // when it pays 8x (12.5c or less). Each tier once per window. live-switch "insurance": { on, arm, tiers }.
      try {
        const ic = liveCfg.insurance as { on?: boolean; arm?: number; tiers?: { at: number; lo?: number; dollars: number; minLeft?: number }[] } | undefined;
        const insured = g.__aureliusInsured || (g.__aureliusInsured = {});
        const mineSlugs: Set<string> = g.__aureliusInsSlugs || (g.__aureliusInsSlugs = new Set());
        const closesAt = String(data.market?.close_time || "");
        const byBand = (ic as { byBand?: boolean } | undefined)?.byBand === true; // HEDGE AT THE NEXT BAND (Oct 21, Love) - one $5 ticket, no price tiers
        const tiers = byBand ? [{ at: 0.333, lo: 0.02, dollars: Number((ic as { bandDollars?: number }).bandDollars) || 5 }] : Array.isArray(ic?.tiers) && ic!.tiers.length ? ic!.tiers : [{ at: 0.25, dollars: 5 }, { at: 0.125, dollars: 2 }];
        const arm = Number(ic?.arm) || 40;
        const other = Math.min(0.99, 1 - bid + 0.01);
        // ARM (Oct 4): +arm% can't be reached from a high entry (72c tops out at +38.9%), so those arm at 55% of their max.
        const maxArmPct = entryPx > 0.02 && entryPx < 1 ? (1 / entryPx - 1) * 100 : 0;
        const armAt = maxArmPct > 0 && maxArmPct < arm / 0.9 ? maxArmPct * 0.55 : arm;
        // ARM BY PRICE (Love, Oct 5 ~4:40 PM PT: "bitcoin is at a 7x atm and it was not hedged... eradicate it"). Nothing was
        // stalling: the +30% arm and the 12.5c floor kept it from trying. Her BTC trade was +27% with the other side at 7x, and
        // a 1.37x entry only reaches its arm when the other side is already under 12.5c. With insurance.armBy "price", the
        // ticket fires as soon as the trade is green and the other side sits inside a tier's band (now down to 8c).
        const armed = byBand ? (id === "btc" && qty > 0 && !tpSell ? hedgeBandHit(row.ticker, tpLive > 0, row.pos > 0 ? "down" : "up") : false) : ic && (ic as { armBy?: string }).armBy === "price" ? tpLive > 0 : tpLive >= armAt;
        if (ic?.on && id === "btc" && closesAt && !tpSell && bid > 0.02 && qty > 0 && armed) {
          for (const tier of tiers) {
            const key = `${row.ticker}:${tier.at}`;
            // Each tier is a price BAND (lo..at): a ticket only buys inside it. Cheaper than that, the comeback odds fall faster
            // than the payout grows (real Kalshi paths, Oct 3). minLeft = minutes that must still be on the clock.
            const minsLeft = (Date.parse(closesAt) - Date.now()) / 60000;
            if (insured[key] || !(other <= tier.at) || other < (Number(tier.lo) || 0.03) || (tier.minLeft && !(minsLeft >= tier.minLeft))) continue;
            insured[key] = Date.now();
            const otherSide = row.pos > 0 ? "down" : "up";
            const atPct = Math.round(tpLive);
            const log = (x: Record<string, unknown>) => {
              try {
                appendFileSync(join(process.cwd(), "data", "insurance-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), venue: "polymarket", kalshi: row.ticker, tier: tier.at, dollars: tier.dollars, profitPct: atPct, kalshiBid: bid, side: otherSide, ...x }) + "\n");
              } catch {
              }
            };
            // Polymarket keeps ONE net position per market (Up and Down cancel), so a ticket never lands in a window where
            // Love holds her own Polymarket BTC position (it would close part of hers). The desk's own tickets don't count.
            void import("./poly-live.server").then(async (pm) => {
              // Only THIS window counts (Oct 4 ~1:35 AM PT: old windows' leftover positions were blocking every ticket).
              const win = await pm.polyWindowFor(closesAt).catch(() => null);
              const mine = await pm.polymarketHoldings().catch(() => []);
              // TOP-UP (Love, Oct 4 ~10:20 AM PT: "you can have poly hedge if i put one in too... sometimes im not lookin and it
              // could use another top up"): her own position on the SAME side as the hedge is fine, the ticket adds to it. Only her
              // position on the OTHER side blocks it, because Polymarket nets the two and the ticket would erase hers.
              // Polymarket net: positive = Up (long), negative = Down (short).
              const hedgeSign = otherSide === "up" ? 1 : -1;
              const hers = win?.slug ? mine.find((h) => h.slug === win.slug && Math.abs(h.net) > 0.01 && !mineSlugs.has(h.slug)) : undefined;
              if (hers && Math.sign(hers.net) !== hedgeSign) {
                log({ status: "skipped", reason: "you hold the OTHER side of this window on Polymarket; a ticket would net against yours" });
                return null;
              }
              if (hers) log({ status: "topping up", reason: `you already hold ${Math.abs(hers.net)} on this side; adding the desk's ticket` });
              // Cheap tickets (16x) get 1c of room, not 3c: 3c on a 6c ticket would turn 16x into 11x.
              const cheap = tier.at <= 0.08;
              const fill = byBand
                ? await pm.takeSide(otherSide, closesAt, Number(tier.dollars) || 5, 0.32, 0.02, 0.01, ":insband") // 3x+ only: paid 33c at most (Oct 21, Love)
                : cheap
                ? await pm.takeSide(otherSide, closesAt, Number(tier.dollars) || 2, tier.at, 0.02, 0.01, `:ins${tier.at}`)
                : await pm.takeSide(otherSide, closesAt, Number(tier.dollars) || 5, tier.at + 0.03, 0.05, 0.02, `:ins${tier.at}`); // Polymarket runs a few cents richer than Kalshi: up to 28c (3.6x+)
              if (fill) mineSlugs.add(fill.slug);
              // HEDGE REGISTER (Love, Oct 4: "we definitely need to bank the hedges while they're down too"): hedgeBank() sells it.
              if (fill) {
                try {
                  const hf = join(process.cwd(), "data", "hedges.json");
                  let hs: Record<string, unknown>[] = [];
                  try {
                    hs = JSON.parse(readFileSync(hf, "utf8"));
                  } catch {
                    hs = [];
                  }
                  hs.unshift({ at: new Date().toISOString(), slug: fill.slug, side: otherSide, contracts: fill.filled, cost: fill.price, stake: Math.round(fill.filled * fill.price * 100) / 100, kalshi: row.ticker, closesAt, tier: tier.at, status: "open" });
                  writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1));
                } catch {
                }
              }
              log({ status: fill ? "filled" : "no fill", why: fill ? undefined : pm.takeSideWhy?.(), slug: fill?.slug ?? null, price: fill?.price ?? null, filled: fill?.filled ?? 0, polyTarget: fill?.target ?? null, kalshiTarget: target || null });
              if (!fill) {
                const tries = (g.__aureliusInsTries ||= {});
                tries[key] = (tries[key] || 0) + 1;
                if (tries[key] < 5) delete insured[key];
              }
              return fill;
            }).catch((err) => log({ status: "error", error: String(err?.message || err).slice(0, 160) }));
          }
        }
      } catch {
      }
      // LOCK THE WIN (Love): once a trade has been up +arm%, it is not allowed to fall back
      // under +floor%. If it does, she sells. Winners that keep running are never capped.
      let lockCfg = { on: false, arm: 30, floor: 20, clear: { gold: 1.5, btc: 100 } };
      try {
        const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
        if (sw.lockWin && typeof sw.lockWin === "object") lockCfg = { ...lockCfg, ...sw.lockWin };
      } catch {
      }
      const lockPeaks = g.__aureliusLockPeak || (g.__aureliusLockPeak = {});
      lockPeaks[row.ticker] = Math.max(lockPeaks[row.ticker] ?? -100, tpLive);
      // Love's take-profit gates: missed the take profit but reached a gate → never give that back.
      // DISMANTLED (Love, Oct 3 ~12:30 AM PT: "the gate is costing us the whole thing... it takes away from the
      // winners. dismantle it please"): no take-profit gate, whatever the switch file says.
      // PAPER LOCKS ON LIVE (Love, Oct 5 ~12:30 AM PT: "the paper books have safeguards mine dont? pls put them on for mine
      // too"). live-switch "paperLocks": true brings back exactly what her paper books (CLAUDE / TREND / BRICK / COTC) run:
      // the take-profit gates (under 1.65x keep +40% once reached; 1.65x+ keep 55% / 60% of the max) and LOCK THE WIN
      // (up +30% then back to +20% = sell). Same as paper: only with a reason (BTC within $100 / gold $1.50 of the target)
      // and never under breakeven. Her TP ladder and her slider are untouched.
      // HERS vs YOURS (Love, Oct 5 ~12:30 PM PT: "it just exited my trade early... let me take MINE... and just do that for
      // hers"). The paper locks only touch a position one of her books copied to Kalshi (live-book-done.json says filled on
      // this ticker). A trade Love opened herself keeps only her take profit ladder and her slider.
      const bookOwned = botOwnsPosition(row);
      // HER SLIDER = HANDS OFF (Love, Oct 5 ~1 PM PT: "if i set the slider here it wont exit early... ill only set it to the
      // CLEAR winners, so they can run if im supervising, if theyre iffy at all, ill leave the bank on"). Once she sets a
      // slider on a position, the gates and lock the win stand down on it: only her slider (or the bell) sells it.
      // NO LOCKS FOR PAPER'S BOOKS (Love, Oct 11 ~8:30 AM PT: "that's too sensitive hun they'll never run... let her take
      // profits half at 75 the rest at 90%"). Books in live-switch "noLocksBooks" skip LOCK THE WIN and the take-profit gates;
      // half at 75% and the trail from 90% still run. Two LOCK THE WIN sales that morning: +$1.71 on a trade that paid +$22.76.
      const noLocks = (() => { try { const nl = (liveCfg as { noLocksBooks?: string[] }).noLocksBooks; const own = Array.isArray(nl) && nl.length && botOwnsPosition(row) ? bookOwnerOf(row.ticker) : null; return Boolean(own && nl!.includes(String(own.id).split(":")[1])); } catch { return false; } })();
      const paperLocks = (liveCfg as { paperLocks?: boolean }).paperLocks === true && bookOwned && !(pinPct > 0) && !noLocks;
      const gatesOn = paperLocks;
      const gateFloor = gatesOn ? tpGates(entryPx).filter((gp) => lockPeaks[row.ticker] + 1e-9 >= gp).pop() : undefined;
      // Love (4:10 AM): no reason, no sale. Gates and LOCK THE WIN only sell a winner when there is a
      // reason: price is within the clear distance of the target (gold $1.50, BTC $100) or already
      // on the wrong side of it, or the last 5m candle just rejected off a band in front of the trade.
      // Free and clear beyond the target → she holds.
      const clearBy = Number((lockCfg.clear || {})[id]) || 0;
      const spotNow = Number(snap?.spot) || 0;
      const cushion = spotNow > 0 && target > 0 ? (row.pos > 0 ? spotNow - target : target - spotNow) : null;
      let rejected = false;
      try {
        const bar = snap?.nav?.bar5m;
        const nv = snap?.nav || {};
        const lvls = [];
        for (const k of ["m5", "m10", "m15"]) if (nv[k]) lvls.push(nv[k].c, nv[k].up, nv[k].dn);
        const fr = snap?.vwap1m;
        if (fr?.vwap > 0 && fr?.stdev > 0) for (const m of [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3]) lvls.push(fr.vwap + m * fr.stdev);
        if (bar) rejected = lvls.some((L) => L > 0 && (row.pos > 0 ? bar.o < L && bar.h >= L && bar.c < L : bar.o > L && bar.l <= L && bar.c > L));
      } catch {
      }
      const hasReason = !(clearBy > 0) || cushion == null || cushion <= clearBy || rejected;
      // Paper's own reason test (target distance only) and its breakeven rule, for the paper locks.
      const paperReason = !(clearBy > 0) || cushion == null || cushion <= clearBy;
      const gateSell = !tpSell && gateFloor != null && tpLive < gateFloor && tpLive > 0 && (paperLocks ? paperReason : hasReason);
      if (gateSell) {
        decision.why = `take-profit gate: reached +${Math.round(lockPeaks[row.ticker])}%, fell under the +${gateFloor}% gate`;
        decision.lock = gateFloor;
      }
      // LOCK THE WIN dismantled with the gate (same day, same ask): only the hard take profit and her slider sell.
      const lockSell = paperLocks && !tpSell && !gateSell && lockPeaks[row.ticker] >= Number(lockCfg.arm) && tpLive <= Number(lockCfg.floor) && tpLive > 0 && paperReason;
      if (lockSell) {
        decision.why = `locked the win: was up +${Math.round(lockPeaks[row.ticker])}%, fell back to +${Math.round(tpLive)}%${rejected ? " (rejected off a band)" : cushion != null ? ` (only ${cushion.toFixed(2)} past the target)` : ""}`;
        decision.lock = Number(lockCfg.floor);
      }
      // FOLLOW PAPER'S EXIT (Love, Oct 8 ~3:20 AM PT: "YES have her do that pls"). Live pays more than paper on entry, so its
      // gain can stay under the +30% that arms the lock while paper's is over it: at 2:48 AM paper 1ST BREAK locked +19% on the
      // bounce and live held to the bell for -$28.39. Lab: 13 times paper locked / gated a winner while live held to the bell,
      // live lost 10 of them (-$220); selling with paper came to about +$94. Now when the book that owns a live position
      // sells its paper trade on LOCK THE WIN or a TAKE-PROFIT GATE, live sells that position right then, at the bid, even
      // at a small loss. Her slider still wins (paperLocks is off once she sets one). live-switch "followPaperExit" (default on).
      let paperSell = false;
      if (mirrorOn) {
        const soldAt = Date.parse(mirrorRow?.soldAt || 0);
        if (mirrorRow?.result === "sold" && soldAt >= Date.parse(mirrorOwn?.v?.at || 0) - 5000) {
          paperSell = true;
          decision.why = `mirrored ${String(mirrorRow.book).toUpperCase()} paper out: ${mirrorRow.exit}`;
        } else {
          decision.why = `riding with ${String(mirrorRow?.book || "").toUpperCase()} paper: out when paper is out`;
        }
      } else if (paperLocks && !tpSell && !gateSell && !lockSell && (liveCfg as { followPaperExit?: boolean }).followPaperExit !== false) {
        try {
          const own = botOwnsPosition(row) ? bookOwnerOf(row.ticker) : null;
          if (own) {
            const pc = g.__aureliusPaperById && Date.now() - g.__aureliusPaperById.at < 2000 ? g.__aureliusPaperById : (g.__aureliusPaperById = { at: Date.now(), map: new Map((await import("./nightbook")).listNight().map((r) => [r.id, r])) });
            const pr = pc.map.get(own.id);
            const soldAt = Date.parse(pr?.soldAt || 0);
            if (pr && pr.result === "sold" && /lock|gate/i.test(String(pr.exit || "")) && soldAt >= Date.parse(own.v.at || 0) - 5000 && Date.now() - soldAt < 15 * 60 * 1000) {
              paperSell = true;
              decision.why = `followed ${String(pr.book).toUpperCase()} paper out: ${pr.exit}`;
            }
          }
        } catch {
        }
      }
      // HANDS OFF (Love, 6:27 PM PT Oct 2: "she exited my btc trade early again, turn her off until we
      // figure her out"): live-switch "autoExits": false = the desk never sells a Kalshi position on its
      // own (no take profit, no gate, no lock). Only YOUR slider still sells, because that one is you.
      let handsOff = false;
      try {
        handsOff = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).autoExits === false;
      } catch {
      }
      // HALF AT 75% (Love, Oct 7 ~6 PM PT: "lets go ahead and do the half at 75% on kalshi for the books we have running now,
      // it will catch more on the gates if they're triggered"). A position one of her live books opened (not hers, no slider
      // set): the first time its bid reaches 75% of what the trade can pay, half is sold right there; the other half keeps
      // every rule (90% take profit + trail, gates, lock the win, the bell). Once per position. live-switch "halfAt75".
      // Lab (scripts/half-lab.py): +$155 gold / +$324 BTC on trades that end on a gate or lock; -$400 / -$45 over all trades.
      // YOURS TOO (Oct 17 ~10:16 AM PT, Love: "you can leave those on for mine too bb"): live-switch halfAt75Hand = her own trades get half at 75% as well. Her slider still wins.
      if ((liveCfg as { halfAt75?: boolean }).halfAt75 === true && !handsOff && (bookOwned || (liveCfg as { halfAt75Hand?: boolean }).halfAt75Hand === true) && !(pinPct > 0) && !paperSell && (mirrorOn || (!tpSell && !gateSell && !lockSell)) && entryPx > 0.02 && entryPx < 0.95 && Math.abs(row.pos) >= 0.04 && bid >= entryPx + 0.75 * (1 - entryPx)) { // ANY SIZE (Oct 17 ~6:55 PM PT, Love: "Yes, any size"): was 2+ contracts; at $1 she holds ~1.4 and the half never fired
        const hFile = join(process.cwd(), "data", "half75.json");
        let halved: Record<string, string> = {};
        try {
          halved = JSON.parse(readFileSync(hFile, "utf8"));
        } catch {
          halved = {};
        }
        if (!halved[row.ticker]) {
          halved[row.ticker] = new Date().toISOString();
          try {
            writeFileSync(hFile, JSON.stringify(Object.fromEntries(Object.entries(halved).slice(-300))));
          } catch {
          }
          // A QUARTER AT 75% (fix121, Oct 22 ~11:06 PM PT, Love picked "Quarter at 75%, rest at 90%" - replay of 691 trades: 93% of those reaching 75% went on
          // to 90%, only 12 reversed and lost): the first touch of 75% of the max now sells a quarter (her 25% button), the rest keeps the 90% take profit + trail.
          const got = await live.partLive(row.ticker, 25).catch(() => null);
          try {
            appendFileSync(join(process.cwd(), "data", "half75-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: row.ticker, entry: Math.round(entryPx * 1000) / 1000, bid, pos: row.pos, got }) + "\n");
          } catch {
          }
          if (got) {
            changed = true;
            continue;
          }
        }
      }
      if (handsOff && !(tpSell && pinPct > 0)) {
        if (tpSell || gateSell || lockSell || paperSell) decision.why = `HANDS OFF: would have sold (${decision.why || "exit"}), holding for you`;
      } else if ((mirrorOn ? paperSell : tpSell || gateSell || lockSell || paperSell) && bid > 0.02 && entryPx > 0) {
        // Tighter fill: a gate, the lock or a follow-paper exit sells no more than 1c under the bid (was 3c).
        const floor = Math.max(0.02, Math.round((bid - (gateSell || lockSell || paperSell || mirrorOn ? 0.01 : 0.03)) * 100) / 100);
        const payout = await live.flattenTicker(row.ticker, true, 0, false, floor);
          if (payout != null) {
            delete peaks[row.ticker];
            delete armedTp[row.ticker];
            delete tpPeaks[row.ticker];
            delete lockPeaks[row.ticker];
            try {
              const pinFile = join(process.cwd(), "data", "pin-sale.json");
              const pins = JSON.parse(readFileSync(pinFile, "utf8"));
              if (pins[row.ticker]) {
                delete pins[row.ticker];
                writeFileSync(pinFile, JSON.stringify(pins));
              }
            } catch {
            }
            changed = true;
            noteExit({
              at: new Date().toISOString(),
              ticker: row.ticker,
              asset: id || "btc",
              side: row.pos > 0 ? "up" : "down",
              stake: row.cost,
              multiple: entryPx > 0 ? Math.round((1 / entryPx) * 100) / 100 : 0,
              bidPct: Math.round((bid / entryPx - 1) * 100),
              targetPct: decision.lock,
              payout,
              profit: Math.round((payout - row.cost) * 100) / 100,
              reason: decision.why,
              short: row.pos < 0,
              yesBid,
              yesAsk,
              secondsLeft: null,
              spot: snap?.spot ?? null,
              strike: target || null
            });
            continue;
          }
      }
      const gateFile = join(process.cwd(), "data", "gate-high.json");
      let gates = {};
      try {
        const parsed = JSON.parse(readFileSync(gateFile, "utf8"));
        if (parsed && typeof parsed === "object") gates = parsed;
      } catch {
        gates = {};
      }
      const step = gateStep(Number(gates[row.ticker]) || 0, entryPx, bid);
      if (step.high > (Number(gates[row.ticker]) || 0)) {
        gates[row.ticker] = step.high;
        writeFileSync(gateFile, JSON.stringify(gates));
      }
      // A 5% or 10% button sells only when the bid is that close to the $1 max, and only in profit.
      try {
        const nearFile = join(process.cwd(), "data", "near-top.json");
        const armed = JSON.parse(readFileSync(nearFile, "utf8"));
        const room = Number(armed?.[row.ticker]?.room);
        const liveCash = qty * bid;
        const gap = qty > 0 ? (qty - liveCash) / qty : 1;
        if ((room === 5 || room === 10) && gap <= room / 100 && liveCash > row.cost + 0.05) {
          const payout = await live.flattenTicker(row.ticker, true);
          if (payout != null) {
            delete armed[row.ticker];
            writeFileSync(nearFile, JSON.stringify(armed));
            delete peaks[row.ticker];
            changed = true;
            const livePct = entryPx > 0 ? (bid / entryPx - 1) * 100 : 0;
            noteExit({
              at: new Date().toISOString(),
              ticker: row.ticker,
              asset: id || "btc",
              side: row.pos > 0 ? "up" : "down",
              stake: row.cost,
              multiple: entryPx > 0 ? Math.round((1 / entryPx) * 100) / 100 : 0,
              bidPct: Math.round(livePct),
              targetPct: room,
              payout,
              profit: Math.round((payout - row.cost) * 100) / 100,
              reason: `within ${room}% of the max`,
              short: row.pos < 0,
              yesBid,
              yesAsk,
              secondsLeft: null,
              spot: snap?.spot ?? null,
              strike: target || null
            });
          }
        }
      } catch {
      }
      // A slider set past the exit can wait. A slider set under it cannot sell early.
      if (laterPin && pin && Number(pin.ask) > 0 && qty > 0) {
        const liveCash = qty * bid;
        const pinPx = Math.round((Number(pin.ask) / qty) * 100) / 100;
        if (liveCash + 0.01 >= Number(pin.ask) && bid + 0.001 >= pinPx && liveCash > row.cost + 0.05) {
          const payout = await live.flattenTicker(row.ticker, true, 0, false, pinPx);
          if (payout != null) {
            try {
              const pinFile = join(process.cwd(), "data", "pin-sale.json");
              const pins = JSON.parse(readFileSync(pinFile, "utf8"));
              delete pins[row.ticker];
              writeFileSync(pinFile, JSON.stringify(pins));
            } catch {
            }
            noteExit({
              at: new Date().toISOString(),
              ticker: row.ticker,
              asset: id || "btc",
              side: row.pos > 0 ? "up" : "down",
              stake: row.cost,
              multiple: entryPx > 0 ? Math.round((1 / entryPx) * 100) / 100 : 0,
              bidPct: Math.round(entryPx > 0 ? (bid / entryPx - 1) * 100 : 0),
              targetPct: Number(pin.pct) || 0,
              payout,
              profit: Math.round((payout - row.cost) * 100) / 100,
              reason: "slider",
              short: row.pos < 0,
              yesBid,
              yesAsk,
              secondsLeft: null,
              spot: snap?.spot ?? null,
              strike: target || null
            });
          }
        }
      }
      continue;
    }
    if (changed) {
      mkdirSync(join(process.cwd(), "data"), { recursive: true });
      writeFileSync(peakFile, JSON.stringify(peaks));
    }
  } catch {
  }
}
async function tendSilver() {
  return;
}
var fuelAt = 0;
async function paperFuel() {
  if (Date.now() - fuelAt < 2e4) return;
  fuelAt = Date.now();
  const names = [
    { id: "oil", series: "KXWTI15M", yahoo: "CL=F" },
    { id: "gas", series: "KXNATGAS15M", yahoo: "NG=F" },
    { id: "copper", series: "KXCOPPER15M", yahoo: "HG=F" },
    { id: "eth", series: "KXETH15M", yahoo: "ETH-USD" },
    { id: "sol", series: "KXSOL15M", yahoo: "SOL-USD" }
  ];
  const assets = {};
  try {
    const { fifteenTicker: fifteenTicker2, fetchMarket: fetchMarket2 } = await import("./kalshi");
    const { detectPattern: detectPattern2, computeVwap: computeVwap2 } = await import("./vwap");
    for (const name of names) {
      try {
        const ticker = fifteenTicker2(name.series);
        const [market, tape] = await Promise.all([fetchMarket2(ticker), yahooTape(name.yahoo)]);
        if (!market?.ticker || !tape?.spot) continue;
        const candles = tape.candles || [];
        const looks = [];
        const remember = (row) => {
          if ((row?.side === "up" || row?.side === "down") && row.label) looks.push({ label: row.label, side: row.side });
        };
        remember(detectPattern2(candles, tape.frame));
        const buckets = new Map();
        for (const candle of candles) {
          const stamp = Math.floor((candle.t || 0) / 3e5) * 3e5;
          const prev = buckets.get(stamp);
          if (!prev) buckets.set(stamp, { ...candle, t: stamp });
          else buckets.set(stamp, { t: stamp, o: prev.o, h: Math.max(prev.h, candle.h), l: Math.min(prev.l, candle.l), c: candle.c, v: (prev.v || 0) + (candle.v || 0) });
        }
        const five = [...buckets.values()].sort((a, b) => a.t - b.t);
        const frame5 = five.length ? computeVwap2(five.slice(-12)) : null;
        if (frame5) remember(detectPattern2(five, frame5));
        if (tape.vwap > 0 && tape.stdev > 0) {
          remember(brokeUnder(candles, tape.vwap, tape.stdev, tape.spot, name.id));
          remember(closedThrough(candles, tape.vwap, tape.stdev, tape.spot, name.id));
          remember(closeByBand(name.id, tape.spot, tape.vwap, tape.stdev));
        }
        const closeMs = market.closeTime ? Date.parse(market.closeTime) : NaN;
        assets[name.id] = {
          spot: tape.spot,
          target: market.target ?? 0,
          secondsLeft: Number.isFinite(closeMs) ? Math.max(0, Math.floor((closeMs - Date.now()) / 1000)) : 0,
          market: {
            ticker: market.ticker,
            yesAsk: market.yesAsk,
            noAsk: market.noAsk,
            yesBid: market.yesBid,
            noBid: market.noBid
          },
          vwap1m: { vwap: tape.vwap, stdev: tape.stdev },
          vwap5m: frame5 ? { vwap: frame5.vwap, stdev: frame5.stdev } : null,
          primeLooks: looks,
          lastPrints: candles.slice(-8).map((c) => ({ o: c.o, c: c.c }))
        };
      } catch {
      }
    }
  } catch {
  }
}
async function tryNextHour(trades, btc, halted) {
  if (manualKalshi() || halted || !btc || Date.now() - hourAt < 2e4) return trades;
  hourAt = Date.now();
  const spot = btc.spot ?? 0;
  const vwap = btc.vwap1m?.vwap || btc.vwap5m?.vwap || 0;
  if (!(spot > 0) || !(vwap > 0)) return trades;
  const stdev = btc.vwap1m?.stdev || btc.vwap5m?.stdev || 0;
  const side = bandBreak(spot, vwap, stdev);
  if (!side) return trades;
  try {
    const poly2 = await import("./poly-live.server");
    if (!poly2.polymarketArmed()) return trades;
    const hour = await poly2.upcomingHour();
    if (!hour) return trades;
    if (trades.some((t) => t.venue === "polymarket" && t.ticker === hour.slug)) return trades;
    if (hour.target != null) {
      const lo = Math.min(spot, hour.target);
      const hi = Math.max(spot, hour.target);
      if (vwap > lo && vwap < hi) return trades;
    }
    const filled = await poly2.buySlug(side, hour.slug, 10, 0.62, hour.target);
    if (!filled) return trades;
    const stake = Math.round(filled.filled * filled.price * 100) / 100;
    return [
      {
        id: newId(),
        openedAt: (/* @__PURE__ */ new Date()).toISOString(),
        closedAt: null,
        asset: "btc",
        ticker: filled.slug,
        side,
        source: "live",
        venue: "polymarket",
        setupId: `${hour.slug}:1h`,
        autoFilled: true,
        probe: false,
        patternLabel: "1H Bitcoin",
        stake,
        ask: filled.price,
        multiple: Math.round(1 / filled.price * 100) / 100,
        contracts: filled.filled,
        result: "open",
        payout: null,
        profit: null,
        exitPct: null,
        holdToExpiry: true,
        conviction: 0,
        notes: `Next hour. $${stake.toFixed(2)} ${side.toUpperCase()} on Polymarket. Price broke ${side === "down" ? "under" : "above"} the band. The trail is on.`,
        grokThesis: "",
        target: filled.target ?? hour.target ?? btc.target,
        lastSpot: spot,
        orderId: filled.orderId
      },
      ...trades
    ];
  } catch {
    return trades;
  }
}
async function tendPolyHour(trades) {
  if (Date.now() - polyTendAt < 4e3) return trades;
  polyTendAt = Date.now();
  let poly2;
  try {
    poly2 = await import("./poly-live.server");
  } catch {
    return trades;
  }
  if (!poly2.polymarketArmed()) return trades;
  const peakFile = join(process.cwd(), "data", "poly-trail.json");
  let peaks = {};
  try {
    const parsed = JSON.parse(readFileSync(peakFile, "utf8"));
    if (parsed && typeof parsed === "object") peaks = parsed;
  } catch {
    peaks = {};
  }
  const floor = readTrail();
  let next = trades;
  try {
    const held = await poly2.polymarketHoldings();
    for (const row of held) {
      if (!String(row.slug || "").includes("-1h-")) continue;
      const end = hourEndMs(row.slug);
      if (end == null || Date.now() > end - 15e3) continue;
      if (!(Math.abs(row.net) >= 0.01)) continue;
      if (next.some((t) => t.ticker === row.slug && t.result === "open")) continue;
      const side = row.net < 0 ? "down" : "up";
      const contracts = Math.abs(row.net);
      const stake = row.cost > 0 ? row.cost : contracts * (row.avg || 0);
      const ask = row.avg > 0 ? row.avg : contracts > 0 ? stake / contracts : 0;
      next = [
        {
          id: `hour-${row.slug}`,
          openedAt: (/* @__PURE__ */ new Date()).toISOString(),
          closedAt: null,
          asset: "btc",
          ticker: row.slug,
          side,
          source: "live",
          venue: "polymarket",
          setupId: `${row.slug}:1h`,
          autoFilled: true,
          probe: false,
          patternLabel: "1H Bitcoin",
          stake: Math.round(stake * 100) / 100,
          ask,
          multiple: ask > 0 ? Math.round(1 / ask * 100) / 100 : 0,
          contracts,
          result: "open",
          payout: null,
          profit: null,
          exitPct: null,
          holdToExpiry: true,
          conviction: 0,
          notes: "On the account. The trail is on.",
          grokThesis: "",
          target: null,
          lastSpot: null,
          orderId: ""
        },
        ...next
      ];
    }
  } catch {
  }
  let settled = 0;
  let changed = false;
  for (const trade of [...next]) {
    if (trade.venue !== "polymarket" || trade.result !== "open") continue;
    if (!String(trade.ticker || "").includes("-1h-")) continue;
    const end = hourEndMs(trade.ticker);
    if (end != null && Date.now() > end + 20e3) {
      if (settled >= 2) continue;
      settled += 1;
      const window = await poly2.polymarketWindow(trade.ticker);
      if (!window?.closed || window.downWon == null) continue;
      const won = trade.side === "down" ? window.downWon : !window.downWon;
      const profit = Math.round((won ? trade.contracts - trade.stake : -trade.stake) * 100) / 100;
      next = next.map((t) => t.id === trade.id ? {
        ...t,
        result: won ? "win" : "loss",
        payout: Math.round((t.stake + profit) * 100) / 100,
        profit,
        closedAt: new Date(end).toISOString(),
        notes: won ? "Settled at the bell. It won." : "Settled at the bell. It lost."
      } : t);
      delete peaks[trade.id];
      changed = true;
      continue;
    }
    const mark = await poly2.markSide(trade.ticker, trade.side, trade.contracts, trade.stake);
    if (!mark) continue;
    const decision = quoteSale(trade.stake, mark.bid, trade.contracts, floor, peaks[trade.id] ?? 0, null);
    if (decision.peak !== (peaks[trade.id] ?? 0)) {
      peaks[trade.id] = decision.peak;
      changed = true;
    }
    if (true /* fix215 (Oct 25 ~3:24 PM PT, Love: "turn those off and let me set them here on my end"): no desk trail/lock sells on Polymarket 1-hour positions; they ride to the bell unless she sells */ || decision.action !== "sell") continue;
    const sold = await poly2.sellSide(trade.side, trade.ticker, trade.contracts);
    if (!sold || !(sold.filled > 0)) continue;
    const payout = Math.round(sold.filled * sold.price * 100) / 100;
    const portion = trade.contracts > 0 ? Math.min(1, sold.filled / trade.contracts) : 1;
    const soldStake = Math.round(trade.stake * portion * 100) / 100;
    const profit = Math.round((payout - soldStake) * 100) / 100;
    const bidPct = soldStake > 0 ? Math.round(profit / soldStake * 100) : 0;
    const full = sold.filled + 0.05 >= trade.contracts;
    next = next.map((t) => {
      if (t.id !== trade.id) return t;
      if (!full) {
        return {
          ...t,
          contracts: Math.round((t.contracts - sold.filled) * 100) / 100,
          stake: Math.round((t.stake - soldStake) * 100) / 100,
          highBid: mark.bid,
          notes: `Sold part of the hour at ${bidPct}%. The rest is still open.`
        };
      }
      return {
        ...t,
        result: "exited",
        payout,
        profit,
        exitPct: bidPct,
        highBid: mark.bid,
        closedAt: (/* @__PURE__ */ new Date()).toISOString(),
        notes: `Banked the hour at ${bidPct}% on the bid. Did not wait for the bell.`
      };
    });
    if (full) delete peaks[trade.id];
    changed = true;
  }
  if (changed) {
    try {
      mkdirSync(join(process.cwd(), "data"), { recursive: true });
      writeFileSync(peakFile, JSON.stringify(peaks));
    } catch {
    }
  }
  return next;
}
async function alignBooks(trades, _assets) {
  return trades;
}
async function adoptHeld(trades) {
  const live = await import("./kalshi-live.server");
  const held = await live.heldFifteens();
  let next = trades;
  const book = listPrimePaper();
  const labelFor = (ticker, side) => {
    const named = book.find((item) => item.ticker === ticker && item.side === side && item.pattern && item.pattern !== "Live");
    return named?.pattern || "";
  };
  for (const row of held) {
    if (next.some((t) => t.source === "live" && t.result === "open" && t.ticker === row.ticker)) continue;
    const contracts = Math.abs(row.pos);
    const stake = Math.round(row.cost * 100) / 100;
    const ask = contracts > 0 ? Math.round(stake / contracts * 100) / 100 : 0;
    if (!(ask > 0) || !(stake > 0)) continue;
    const side = row.pos > 0 ? "up" : "down";
    if (!row.ticker.includes("BTC") && !row.ticker.includes("GOLD")) continue;
    const asset = row.ticker.includes("GOLD") ? "gold" : "btc";
    next = [
      {
        id: `held-${row.ticker}`,
        openedAt: (/* @__PURE__ */ new Date()).toISOString(),
        closedAt: null,
        asset,
        ticker: row.ticker,
        side,
        source: "live",
        setupId: `${row.ticker}:${side}:held`,
        autoFilled: false,
        patternLabel: labelFor(row.ticker, side) || "Live",
        stake,
        ask,
        multiple: Math.round(1 / ask * 100) / 100,
        contracts,
        result: "open",
        payout: null,
        profit: null,
        exitPct: null,
        holdToExpiry: false,
        conviction: 0,
        notes: "On the trail.",
        grokThesis: "",
        target: null,
        lastSpot: null,
        venue: "kalshi"
      },
      ...next
    ];
  }
  next = next.map((t) => {
    if (t.source !== "live" || t.result !== "open" || (t.patternLabel && t.patternLabel !== "Live")) return t;
    const label = labelFor(t.ticker, t.side);
    return label ? { ...t, patternLabel: label } : t;
  });
  return next;
}
function readTrail() {
  try {
    const n = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "trail-floor.json"), "utf8")).pct);
    return clampTrail(n);
  } catch {
    return 45;
  }
}
async function bankLive(trades, _assets) {
  return trades;
}
async function settleRolled(trades, assets) {
  const live = await import("./kalshi-live.server");
  const next = [];
  let nets = null;
  for (const trade of trades) {
    if (trade.source !== "live" || trade.venue === "polymarket" || trade.result !== "open") {
      next.push(trade);
      continue;
    }
    const asset = assets[trade.asset];
    const current = asset?.market?.ticker;
    if (current === trade.ticker && (asset?.secondsLeft ?? 0) > 0) {
      next.push(trade);
      continue;
    }
    const result = await live.marketResult(trade.ticker);
    if (result == null) {
      next.push(trade);
      continue;
    }
    if (!nets) nets = await live.settlementProfits().catch(() => new Map());
    const net = nets.get(trade.ticker);
    if (typeof net !== "number") {
      next.push(trade);
      continue;
    }
    next.push({
      ...trade,
      result: net > 0 ? "win" : net < 0 ? "loss" : "exited",
      payout: Math.round((trade.stake + net) * 100) / 100,
      profit: net,
      closedAt: (/* @__PURE__ */ new Date()).toISOString(),
      notes: net > 0 ? "Settled on Kalshi." : net < 0 ? "Settled off." : "Already flat on Kalshi. No cash moved."
    });
    if (net < 0) {
      queueLoss({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        ticker: trade.ticker,
        asset: trade.asset,
        side: trade.side,
        pattern: trade.patternLabel || "",
        spot: asset?.spot ?? trade.lastSpot ?? null,
        vwap: asset?.vwap1m?.vwap ?? null,
        stdev: asset?.vwap1m?.stdev ?? null,
        strike: trade.target ?? asset?.target ?? null,
        profit: net,
        reason: "settled",
      });
    }
  }
  return next;
}
// $3 SNIPE (Love, Oct 4 ~12:10 PM PT: "even if we're not in a trade and btc is within $10 from the target... and the odds are
// 20x+ do $3 every time... also for within $20 and 3 minutes"). Replay on Kalshi paths (Oct 2-4): with 1-3 min left and
// price within $20 of the strike, a 20x+ cheap side came back 3 of 47 times (+$90 on $3 tickets); in the LAST minute 1 of
// 46 (-$82: Kalshi settles on the final minute's average), so the last minute is skipped. Bought on POLYMARKET (a Kalshi
// ticket would net against the desk's own position); never against Love's own other-side Polymarket position.
// live-switch "snipe": { on, dollars, maxDist, minLeft, maxLeft, maxAsk }.
async function lottoSnipe(assets) {
  try {
    const cfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).snipe;
    if (!cfg?.on) return;
    const a = assets?.btc;
    const m = a?.market;
    const spot = Number(a?.spot) || 0;
    const target = Number(a?.target) || 0;
    const left = Number(a?.secondsLeft) || 0;
    if (!m?.ticker || !(spot > 0) || !(target > 0) || !m.closeTime) return;
    const minLeft = Number(cfg.minLeft) || 60;
    const maxLeft = Number(cfg.maxLeft) || 180;
    const maxDist = Number(cfg.maxDist) || 20;
    const maxAsk = Number(cfg.maxAsk) || 0.05;
    if (left < minLeft || left > maxLeft || Math.abs(spot - target) > maxDist) return;
    const reg = g.__aureliusSnipe || (g.__aureliusSnipe = {});
    if (reg[m.ticker]) return;
    // The cheap side is the one currently losing.
    const side = spot >= target ? "down" : "up";
    const kAsk = side === "up" ? Number(m.yesAsk) : Number(m.noAsk);
    if (!(kAsk > 0.005 && kAsk <= maxAsk + 0.02)) return;
    reg[m.ticker] = Date.now();
    const log = (x) => {
      try {
        appendFileSync(join(process.cwd(), "data", "snipe-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), kalshi: m.ticker, side, spot, target, dist: Math.round((spot - target) * 100) / 100, left, kalshiAsk: kAsk, ...x }) + "\n");
      } catch {
      }
    };
    const pm = await import("./poly-live.server");
    const win = await pm.polyWindowFor(m.closeTime).catch(() => null);
    const mine = await pm.polymarketHoldings().catch(() => []);
    const hers = win?.slug ? mine.find((h) => h.slug === win.slug && Math.abs(h.net) > 0.01) : undefined;
    if (hers && Math.sign(hers.net) !== (side === "up" ? 1 : -1)) {
      log({ status: "skipped", why: "you hold the other side of this window on Polymarket" });
      return;
    }
    const fill = await pm.takeSide(side, m.closeTime, Number(cfg.dollars) || 3, maxAsk, 0.005, 0.01, ":snipe").catch((err) => {
      log({ status: "error", why: String(err?.message || err).slice(0, 160) });
      return null;
    });
    log(fill ? { status: "filled", slug: fill.slug, price: fill.price, contracts: fill.filled } : { status: "no fill", why: pm.takeSideWhy() });
  } catch {
  }
}
// HEDGE BANK (Love, Oct 4 ~3:25 AM PT: "we definitely need to bank the hedges while they're down too, bc of that exact
// scenario... that's twice in one night we banked on both sides"). Every open Polymarket hedge is marked each tick; when its
// own bid reaches +bankAt% (default 200%, replay: about even with holding, the early banks did worse) it is sold. What is
// left at the bell rides. live-switch insurance.bankAt / insurance.bank: false.
// HEDGE AT THE NEXT BAND (Oct 21 ~2:20 PM PT, Love: "for our polymarket hedges, let's structure it the same way we do our delayed entry model / once our
// trade is in profit, once price reaches the next band it encounters enter there" + picked "Always the other side"): once a BTC position has been green,
// the FIRST band price reaches after that buys the OTHER side on Polymarket, once per window. A band price was already sitting on when the trade went green
// is skipped until price leaves it; a band jumped over between ticks counts as reached. Bands = her live channel list (__lawBands).
// THE TURN COUNTS TOO (Oct 21 ~2:27 PM PT, Love: "just enters in at the next band price encounters ... rejects without actually tapping the band, same rules
// apply ... same way we structured the main book ... at a 3x+ on the other side of our main books position as our insurance"): a 5m candle turning against
// our trade by her thirds (falling from the top third = the short side, rising from the bottom third = the long side) is a band interaction even without a tap.
// CLEAR AFTER THE FIRST (Oct 21 ~2:33 PM PT, Love: "she's clear to enter at any point in the other direction after the first band interaction" + picked "The hedge,
// any time after 1st band"): once that first interaction happens, the hedge may go in at any point left in the window, whenever the other side is 3x+.
function hedgeBandHit(ticker: string, green: boolean, hedgeSide: "up" | "down"): boolean {
  const G0 = globalThis as any;
  const st = (G0.__hedgeBand ||= {}) as Record<string, { skip: string[]; last: number; open?: string }>;
  const s = st[ticker];
  if (s?.open) return true;
  const lb = G0.__lawBands?.btc;
  const q = quoteTick("btc");
  if (!lb || !Array.isArray(lb.L) || Date.now() - Number(lb.at) > 15000 || !q || !(q.c > 0) || Date.now() - q.at > 3000) return false;
  const tap = 3;
  const L = lb.L.filter((l: any) => Number(l?.price) > 0);
  const near = L.filter((l: any) => Math.abs(q.c - Number(l.price)) <= tap).map((l: any) => String(l.name));
  if (!s) { if (green) st[ticker] = { skip: near, last: q.c }; return false; }
  s.skip = s.skip.filter((n) => near.includes(n));
  const lo = Math.min(s.last, q.c), hi = Math.max(s.last, q.c);
  const crossed = L.filter((l: any) => Number(l.price) > lo && Number(l.price) < hi).map((l: any) => String(l.name));
  s.last = q.c;
  const hit = [...near, ...crossed].find((n) => !s.skip.includes(n));
  if (hit) { s.open = hit; return true; }
  if (turnNow("btc", L, q.c) === hedgeSide) { s.open = "turn"; return true; }
  return false;
}
// THE TWIN ON POLYMARKET 24/7 (fix112, Oct 22 ~8:42 PM PT, Love: "in celebration i would like the delayed entry model to stay on at $2 / that way, it will
// cover our hedges / and catch a lot of reversals / same take profit structure as ours / half at 75% rest at 90 / both btc and gold" + "polymarket 24/7 bb"):
// every DELAYED twin call (recon-dly paper), BTC and gold, every hour, is copied to Polymarket at live-switch polyTwin.dollars, once per window. It meets her
// wall first (bandLockCheck as recon-dly, same as the Kalshi door) and her 1.38x floor; a position of the other side on that Polymarket market (hers or a hedge)
// skips it, since Polymarket would net them. Fills join data/hedges.json (kind "twin") so hedgeBank sells half at 75% of the max and the rest at 90%.
async function polyTwin() {
  if (g.__polyTwinBusy) return;
  let cfg: any = null;
  try { cfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).polyTwin || null; } catch { cfg = null; }
  if (!cfg || cfg.on !== true || !(Number(cfg.dollars) > 0) || entriesOff()) return;
  g.__polyTwinBusy = true;
  try {
    const now = Date.now();
    // 5M QUOTE RECORDER (fix203, Oct 25 ~4:55 AM PT, Love: "the 3-5x's on polymarket on the 5M ones are repeatable ... do another paper book that does the same thing,
    // 15% -1% chance, enters at a band, candle flip = get in, 3x 5x, 7.5x & 10x pls"): read-only - about every 5 s the BTC 5m market's best bid/ask go to
    // data/poly5-quotes.jsonl so tools/five-snipe-paper.py can paper-trade it. No orders.
    if (!(now - Number(g.__p5qAt || 0) < 5000)) { g.__p5qAt = now; void (async () => { try { const pmq = await import("./poly-live.server"); const ca = new Date(Math.ceil(now / 300000) * 300000).toISOString();
      if (g.__p5qWin?.closes !== ca || !g.__p5qWin?.slug) { const w = await pmq.polyWindow5("btc", ca).catch(() => null); g.__p5qWin = { closes: ca, slug: w?.slug || "", target: w?.target ?? null }; }
      const sl = g.__p5qWin?.slug; if (!sl) return; const tp = await pmq.bookTop(sl).catch(() => null); if (!tp) return;
      appendFileSync(join(process.cwd(), "data", "poly5-quotes.jsonl"), JSON.stringify({ t: Math.round(now / 1000), slug: sl, closes: ca, target: g.__p5qWin.target, bid: tp.bid, ask: tp.ask }) + "\n"); } catch {} })(); }
    const books: string[] = Array.isArray(cfg.books) && cfg.books.length ? cfg.books : ["recon-dly"];
    // THE TWIN'S HOURS ON POLYMARKET (fix155, Oct 23 ~5:30 PM PT, Love: "yes let's give the twin those hours on kalshi too"): when polyTwin.books lists both, the
    // DELAYED twin (recon-dly) trades Poly in its hours (not in bookSkipHours["recon-dly"]) and the rejection model every other hour.
    let twinHr = false;
    try { const tsw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")); const hT = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24;
      const dS = tsw?.bookSkipHours?.["recon-dly"]; twinHr = Array.isArray(dS) && !dS.map(Number).includes(hT); } catch { twinHr = false; }
    const both = books.includes("recon-dly") && books.includes("recon-rej");
    // MAIN BOOK ON THE 5M OVERNIGHT, HER REJECTION HOURS ASIDE (fix185, Oct 25 ~12:18 AM PT, Love: "i'd like her to run the main book on poly for the 5M market
    // throughout the night, only rejections best hours aside"): while rej5m.mainUntil holds, the main book's BTC calls take the Poly 5m - except in her rejection
    // hours (offHourMain.rejHours), where the rejection model keeps the 5m as before.
    const rejH5 = (() => { try { const sw5 = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")); const h5 = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24; if (Date.parse(String(sw5?.polyTwin?.rej5m?.mainAllUntil || "")) > Date.now()) return false; /* Love 12:19 AM: "we can put the main book on for the hour right now though" - mainAllUntil = main book on the 5m even in a rejection hour */ const xr5 = sw5?.polyTwin?.rej5m?.extraRej; if (xr5 && Array.isArray(xr5.hours) && xr5.hours.map(Number).includes(h5) && Date.parse(String(xr5.until || "")) > Date.now()) return true; /* fix192 (Oct 25 ~2:21 AM PT, Love: "ya let's do it hun i wanna see how she moves" - the 2 AM 5m board to the rejection model tonight; rej5m.extraRej {hours, until}) */ return rjA(sw5?.offHourMain, "btc").includes(h5); /* fix243: BTC hours */ } catch { return false; } })();
    const m5On = !!cfg.rej5m && cfg.rej5m.on === true && Date.parse(String(cfg.rej5m.mainUntil || "")) > now && !rejH5; // fix171, fix185
    // THE REJECTION MODEL WAITS FOR HER CANDLE ON THE 5M (fix188, Oct 25 ~2:00 AM PT, Love: "id like the rejection model on the 5M markets to wait for a candle in our
    // favor like the main book does, she can have a perfect entry and it will still lose on there because there wasn't enough time for price to move in our favor"):
    // while the rejection model holds the 5m board, her BTC call stays alive up to 5 minutes and buys only once a finished 1m candle since the call closed her way
    // (green for a long, red for a short). The 5m window is chosen at the flip. Her 15m copies and every other book unchanged.
    // FLIP + 4 MINUTES ON THE 5M (fix189, Oct 25 ~2:05 AM PT, Love: "no need to run it on paper hun / let's run it like that pls" after the replay - flip with 4+ minutes
    // left won 73% on the 5m vs 57-59% as traded): the books listed here buy on the 5m board only right after a finished 1m candle closed her way, with about 4 minutes
    // (225 s+) left in that 5m window; their calls stay alive up to 5 minutes.
    const FLIP5_BOOKS: string[] = ["recon-rej", "recon-tog"]; // Love card 2:04 AM "Main and rejection"
    const rejHolds5 = !!cfg.rej5m && cfg.rej5m.on === true && Number(cfg.rej5m.dollars) > 0 && !(Date.parse(String(cfg.rej5m.until || "")) < now) && !(Date.parse(String(cfg.rej5m.mainUntil || "")) > now && !rejH5);
    // fix261 (fix261, Oct 26 ~2:47 AM PT, Love: "pls put her back on the framework that was winning all day up until 10pm" + "for the 5M 123 book - that's what i meant by put it back - not the kalshi books"): on the Poly 5m lane the rejection model's BTC calls come from recon-rej5 (her pre-fix246 streak read); Kalshi keeps recon-rej.
    const allNight5 = ((await import("./grokog")).asNightRows() as any[]).filter((x: any) => !(x && x.book === "recon-rej" && x.asset === "btc")).map((x: any) => (x && x.book === "recon-rej5" ? { ...x, book: "recon-rej" } : x));
    const rows = allNight5.filter((r) => (books.includes(r.book) || (m5On && r.book === "recon-tog" && r.asset === "btc")) && (!both || (r.book === "recon-dly" ? twinHr : r.book === "recon-rej" ? !twinHr || (rejHolds5 && r.asset === "btc") : true)) && (r.asset === "btc" || r.asset === "gold") && r.result === "open" && /15M-/.test(String(r.ticker)) && (r.side === "up" || r.side === "down") && now - Date.parse(String(r.at)) < (r.asset === "btc" && FLIP5_BOOKS.includes(String(r.book)) && (r.book === "recon-tog" ? m5On : rejHolds5) ? 300000 : 90000));
    // THE LATE DOOR FOR EITHER BOOK (fix198, Oct 25 ~3:41 AM PT, Love: "the last minute 5M book can run on either book, whichever one sees the opportunity there is
    // clear to take it"): the BTC calls of the book NOT holding the 5m board ride the 5m lane too, but only through the late door (fix195) - never the flip door.
    const hold5 = m5On ? "recon-tog" : rejHolds5 ? "recon-rej" : "", oth5 = hold5 === "recon-tog" ? "recon-rej" : hold5 === "recon-rej" ? "recon-tog" : "";
    if (oth5) for (const x of allNight5) if (x && x.book === oth5 && x.asset === "btc" && x.result === "open" && /15M-/.test(String(x.ticker)) && (x.side === "up" || x.side === "down") && now - Date.parse(String(x.at)) < 300000) rows.push({ ...x, lateOnly: true });
    const touchOn = cfg.touch !== false;
    // FRESH 5M SWINGS (fix186, Oct 25 ~1:45 AM PT, Love: card "Fresh 5m swings, keep the hours"): her later-slot calls in a 15m window (data/swing5.json, written by
    // recon) ride the 5m lane only, for whichever book holds the 5m this hour (main in its hours, the rejection model in hers).
    try {
      const sw5 = JSON.parse(readFileSync(join(process.cwd(), "data", "swing5.json"), "utf8"));
      const mainNow5 = !!cfg.rej5m && Date.parse(String(cfg.rej5m.mainUntil || "")) > now && !rejH5;
      for (const s of Object.values(sw5) as any[]) {
        if (!s || !(now - Date.parse(String(s.at)) < (FLIP5_BOOKS.includes(String(s.book)) ? 300000 : 90000)) || s.asset !== "btc" || !(s.side === "up" || s.side === "down")) continue;
        const okB = s.book === "recon-tog" ? m5On : s.book === "recon-rej" && !mainNow5 && books.includes("recon-rej") && (!both || !twinHr || rejHolds5);
        if (okB) rows.push({ ...s, result: "open", swing5: true });
        else if (oth5 && s.book === oth5) rows.push({ ...s, result: "open", swing5: true, lateOnly: true }); // fix198
      }
    } catch {}
    if (!rows.length && !touchOn && !(Number((globalThis as any).__add5Until) > now)) return; // fix196: a held 5m trade keeps the lane awake for her add-on
    const regF = join(process.cwd(), "data", "poly-twin.json");
    let reg: Record<string, any> = {};
    try { reg = JSON.parse(readFileSync(regF, "utf8")); } catch { reg = {}; }
    const log = (o: any) => { try { appendFileSync(join(process.cwd(), "data", "poly-twin-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...o }) + "\n"); } catch {} };
    const pm = await import("./poly-live.server");
    const blm = await import("./bandlock");
    const blm5 = await import("./bandlock5m"); // fix339: the 5M book's own frozen walls (6:29 AM Oct 27)
    let changed = false;
    const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    // THE HEDGE IN THE TWIN'S KALSHI HOURS (fix118, Oct 22 ~9:00 PM PT, Love: "in the event the delayed entry model is on kalshi, have polymarket take the opposite
    // side / so we have a hedge"): while recon-dly trades live on Kalshi this hour, Polymarket takes the other side of every twin entry. Like her other Poly hedges,
    // the hedge side doesn't meet the twin's wall; floors, netting and exits are unchanged.
    let dlyOnKalshi = false;
    try { const lsw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")); const hPT = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date()));
      const sk = lsw?.bookSkipHours?.["recon-dly"]; const lb = lsw?.liveBook?.books; dlyOnKalshi = Array.isArray(lb) && lb.includes("recon-dly") && Array.isArray(sk) && !sk.includes(hPT); } catch { dlyOnKalshi = false; }
    // THE 5M ADD-ON (fix196, Oct 25 ~3:29 AM PT, Love: "we definitely have time for an add on they move QUICK on the 5M markets off of a minor flick of price ... if price
    // hits 45-30% on the multiple in any of her windows she's clear to do a $2 add on bb" + card "Only when she's already in"): once she holds a 5m trade, a dip on
    // her side to 30-45c buys ONE $2 add-on in that window (limit never past 45c), any time before the last 10 s. No walls, like her other add-ons.
    // BACK TO THE 72% RULE (fix205, Oct 25 ~1:05 PM PT, Love card "Back to the 72% rule" after the live 5m post-mortem: entries with ~4 min left went 14-6,
    // late entries 2-8, 5m add-ons 0-5, buys under 30c 1-4): the 5m add-on, the late door and partial top-ups are off; the flip needs 4+ minutes left; 30c floor.
    const G205_OFF = true;
    // FIVEY'S GUARDS (fix207, Oct 25 ~1:20 PM PT, Love card "All three guards" + "let's make it 4 straight instead pls" - Oct 24-25 the 5m lane kept buying until
    // Polymarket held $0.39): each finished 5m trade is settled from the desk's 1m bars (sold early = its banked profit; no bars 10 min after the bell = counted
    // a loss) into data/five-guard.json. The 5m lane stops for the PT day at -$45 net (fix208, was -$15), pauses 1 hour after 4 losses in a row, and never buys if Polymarket
    // cash would drop under $15. 15m twin and insurance are untouched.
    const G207F = join(process.cwd(), "data", "five-guard.json"); let G207: any = {}; try { G207 = JSON.parse(readFileSync(G207F, "utf8")); } catch { G207 = {}; }
    const G207day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date()); let G207ch = false;
    if (G207.day !== G207day) { G207 = { day: G207day, net: 0, streak: 0, pauseUntil: Number(G207.pauseUntil) || 0, done: {} }; G207ch = true; }
    try { let hs207: any[] | null = null;
      for (const [k7, d7] of Object.entries(reg) as [string, any][]) {
        if (!k7.endsWith(":5m") || d7?.status !== "filled" || !d7.closesAt || !d7.slug || G207.done?.[k7] !== undefined || !(Number(d7.spent) > 0)) continue;
        const ce7 = Date.parse(String(d7.closesAt)); if (!(ce7 <= now - 65000) || ce7 < Date.parse(G207day + "T00:00:00-08:00") - 3600000 || ce7 < Date.parse("2026-10-25T20:25:00Z")) continue; // fix207 counts from install on
        if (!hs207) { try { hs207 = JSON.parse(readFileSync(join(process.cwd(), "data", "hedges.json"), "utf8")); } catch { hs207 = []; } }
        const hh7 = (hs207 || []).filter((x: any) => x && x.slug === d7.slug && x.kind === "rej5m" && !x.addOn);
        let p7: number | null = null, how7 = "";
        if (hh7.length && hh7.every((x: any) => x.status === "banked")) { p7 = hh7.reduce((a: number, x: any) => a + (Number(x.banked) || 0), 0); how7 = "sold"; }
        else {
          // POLYMARKET'S OWN RESULT (fix269, Love Oct 26 10:33 AM PT "yes" to grading the 5m guard from Polymarket's real result - the 10:05 AM short was
          // booked "won" because the chart's 5m candle closed $13 red while Polymarket's feed closed up and the short lost): a held-to-the-bell 5m trade is
          // graded by the market's resolution (polymarketWindow downWon), polled at most every 15 s per market. Only if Polymarket hasn't resolved it 30 min
          // after the bell does the old chart-candle grade apply.
          let pw7: any = null; const PQ7 = ((globalThis as any).__g207poly ||= {}) as Record<string, number>;
          if (now - (PQ7[d7.slug] || 0) >= 15000) { PQ7[d7.slug] = now; try { pw7 = await pm.polymarketWindow(String(d7.slug)); } catch { pw7 = null; } }
          if (pw7 && typeof pw7.downWon === "boolean") { const won7 = (d7.side === "down") === pw7.downWon; p7 = won7 ? Number(d7.contracts) - Number(d7.spent) : -Number(d7.spent); how7 = won7 ? "won (polymarket)" : "lost (polymarket)"; }
          else if (now - ce7 > 1800000) { const bs7 = ((globalThis as any).__pivBars?.btc?.bars ?? []) as any[], e7 = ce7 / 1000;
          const o7 = bs7.find((x: any) => Number(x.t) === e7 - 300), c7 = bs7.find((x: any) => Number(x.t) === e7 - 60);
          if (o7 && c7) { const up7 = Number(c7.c) >= Number(o7.o); const won7 = (d7.side === "up") === up7; p7 = won7 ? Number(d7.contracts) - Number(d7.spent) : -Number(d7.spent); how7 = won7 ? "won (chart, polymarket unresolved)" : "lost (chart, polymarket unresolved)"; }
          else { p7 = -Number(d7.spent); how7 = "no bars - counted lost"; } } }
        if (p7 === null) continue;
        G207.done = G207.done || {}; G207.done[k7] = Math.round(p7 * 100) / 100; G207.net = Math.round(((Number(G207.net) || 0) + p7) * 100) / 100;
        G207.streak = p7 < 0 ? (Number(G207.streak) || 0) + 1 : 0;
        if (G207.streak >= 4) { G207.pauseUntil = now + 3600000; G207.streak = 0; }
        G207ch = true; log({ id: k7, status: "settled", how: how7, pnl: G207.done[k7], dayNet: G207.net, streak: G207.streak, pauseUntil: G207.pauseUntil ? new Date(G207.pauseUntil).toISOString() : null });
      }
    } catch {}
    if (G207ch) { try { writeFileSync(G207F, JSON.stringify(G207, null, 1)); } catch {} }
    for (const [k5, d] of Object.entries(reg) as [string, any][]) {
      if (G205_OFF || !k5.endsWith(":5m") || !(d?.status === "filled" || d?.status === "partial") || d.addOn || !d.closesAt || !(d.side === "up" || d.side === "down")) continue;
      const lft5 = Date.parse(String(d.closesAt)) - now; if (!(lft5 > 10000 && lft5 <= 300000)) continue;
      if (now - Number(d.addTry || 0) < 3000) continue;
      d.addTry = now; changed = true;
      let fa: any = null; try { fa = await pm.takeSide(d.side, String(d.closesAt), 2, 0.43, 0.30, 0.02, ":rej5madd", String(d.asset || "btc")); } catch { fa = null; }
      if (fa) {
        d.addOn = { at: new Date().toISOString(), contracts: fa.filled, cost: fa.price, orderId: fa.orderId };
        log({ id: k5, status: "add-on", side: d.side, contracts: fa.filled, cost: fa.price, slug: fa.slug });
        try { const hf = join(process.cwd(), "data", "hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
          hs.unshift({ at: new Date().toISOString(), kind: "rej5m", addOn: true, book: d.book, slug: fa.slug, side: d.side, contracts: fa.filled, cost: fa.price, stake: Math.round(fa.filled * fa.price * 100) / 100, kalshi: d.ticker, closesAt: d.closesAt, status: "open" });
          writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
      }
    }
    const flipS = (s: string) => (s === "up" ? "down" : "up");
    for (const r0 of rows) {
      const r = dlyOnKalshi && cfg.hedgeTwin !== false && r0.book === "recon-dly" ? { ...r0, side: flipS(r0.side), hedge: true } : r0; // fix155: polyTwin.hedgeTwin false = Poly rides WITH the twin
      // THE REJECTION MODEL ON POLYMARKET'S 5-MINUTE BTC MARKETS (fix170, Oct 24 ~7:00 PM PT, Love: "i want to try running the rejection model on polymarket @ $2 for
      // the 5 Minute markets, it gives price less time to reverse and go against us / we'll do it for the next hour"): while polyTwin.rej5m is on and before its
      // "until", each BTC rejection-model call buys its side on the 5m market open now (the next one if under a minute is left) instead of the 15m one, at
      // rej5m.dollars, under her wall and floor like the 15m copy. No add-on (kind "rej5m"); hedgeBank sells half at 75%, rest at 90%, or it rides to the bell.
      const r5 = cfg.rej5m;
      // THE MAIN BOOK'S HOUR ON THE 5M (fix171, Oct 24 ~7:34 PM PT, Love: "i'd like the main book on for the 5M market for the hour, i want to see how she does"):
      // while rej5m.mainUntil is ahead, the 5m lane copies the main book's (recon-tog) BTC calls instead of the rejection model's; the rejection model's BTC calls
      // go back to the 15m copy for that time. Main-book rows never take the 15m path.
      const main5 = !!r5 && Date.parse(String(r5.mainUntil || "")) > now && !rejH5; // fix185: her rejection hours keep the 5m for the rejection model
      // NO 5M IN HER OFF HOURS (fix247, Oct 26 ~12:26 AM PT, Love: "11pm is off from now on on there ok"): polyTwin.rej5m.skipHours (PT) - no Poly 5m buys from main or
      // the rejection model in those hours. Kalshi is untouched.
      if (r5 && Array.isArray(r5.skipHours) && FLIP5_BOOKS.includes(String(r.book)) && r5.skipHours.map(Number).includes(Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24)) continue;
      if (r5 && r5.on === true && (r.book === (main5 ? "recon-tog" : "recon-rej") || ((r as any).lateOnly && FLIP5_BOOKS.includes(String(r.book)))) && (Array.isArray(r5.assets) ? r5.assets : ["btc"]).includes(r.asset) && !(Date.parse(String(r5.until || "")) < now) && Number(r5.dollars) > 0) {
        const id5 = `${r.id}:5m`, d5 = reg[id5];
        if (d5 && (d5.status === "filled" || d5.final)) continue;
        if (d5 && now - Number(d5.lastTry || 0) < 4000) continue;
        const base5 = { book: r.book === "recon-tog" ? "recon-tog-5m" : "recon-rej-5m", asset: r.asset, side: r.side, ticker: r.ticker, setup: r.setup, lastTry: now, tries: (Number(d5?.tries) || 0) + 1 };
        let end5 = Math.ceil(now / 300000) * 300000; if (end5 - now < 60000) end5 += 300000;
        const closes5 = new Date(end5).toISOString();
        // ITS OWN WINDOW ONLY (fix224, Oct 25 ~6:05 PM PT, Love: "it says the 5M book is in a short right now ?? why?" - at 6:00:02 PM the 5:55 slot's short call bought the
        // 6:00 window off the 5:58-6:00 2m candle, while the fresh 6:00 read was a long): every call (fresh 5m swing or 15m) trades only inside its own 5m slot
        // (Love 6:05 PM: "only let a call only trade inside its own 5 minute slot") - once that slot is over the call is spent, never carried into the next window.
        { const sm5 = /:s(\d+)$/.exec(String(r.id)); const capE5 = sm5 ? (Number(sm5[1]) + 1) * 300000 : (Math.floor(Date.parse(String(r.at)) / 300000) + 1) * 300000;
          if (Number.isFinite(capE5) && end5 > capE5) { if (d5?.status !== "expired") log({ id: id5, status: "expired", reason: "its own window is over - a call never trades the next window" }); reg[id5] = { ...base5, status: "expired", final: true, reason: "its own window is over - a call never trades the next window" }; changed = true; continue; } }
        let late5 = false; // fix195
        // TOP UP A PARTIAL FILL (fix202, Oct 25 ~4:45 AM PT, Love: "yes pls" to "keep knocking for the rest of her size" - the 4:35 short filled 1.1 contracts ($0.58) of $5
        // as the book moved): a partly filled 5m trade keeps knocking for the rest of her size in the same window (same entry: no new flip, walls already passed it) until 2:30 is left.
        const part5 = false && d5?.status === "partial"; // fix205: no top-ups
        if (part5 && (d5.closesAt !== closes5 || (end5 - now) / 1000 < 150)) { reg[id5] = { ...d5, status: "filled", final: true }; log({ id: id5, status: "filled", note: "top-up window closed", spent: d5.spent }); changed = true; continue; }
        // WALLS JUDGE THE CALL (fix204, Oct 25 ~5:07 AM PT, Love card "Judge walls at the call" - since 2 AM Kalshi filled 9 of her calls and the 5m only 1: by the time
        // her flip came, price had moved and the walls re-judged her thirds at the new price): the first time the 5m lane sees a call, her walls judge it right then
        // (5m cushions). If it passes, the flip only confirms it - no second wall check at the flip. If it fails, the walls keep judging it at the flip as before.
        if (d5?.wallOk === undefined && !part5) { let w0: any = null; (globalThis as any).__pinkCap5 = 25; const bbH0 = (globalThis as any).__bbsr; if ((globalThis as any).__bbsrChart) (globalThis as any).__bbsr = (globalThis as any).__bbsrChart; try { w0 = blm5.bandLockCheck(String(r.book), r.asset, r.side, String(r.ticker)); /* fix339 */ } finally { (globalThis as any).__pinkCap5 = 0; (globalThis as any).__bbsr = bbH0; } (base5 as any).wallOk = !!w0?.ok; } else (base5 as any).wallOk = !!d5?.wallOk;
        if (FLIP5_BOOKS.includes(String(r.book)) && !part5) { // fix188 + fix189: a finished 1m candle since her call closed her way, just now, with ~4 minutes left
          const callS = Date.parse(String(r.at)) / 1000, nowS = now / 1000;
          const fin = (((globalThis as any).__pivBars?.btc?.bars ?? []) as any[]).filter((x: any) => Number(x.t) + 60 <= nowS + 1 && Number(x.t) + 60 > callS).sort((x: any, y: any) => Number(x.t) - Number(y.t));
          const herWay = (x: any) => (r.side === "up" ? Number(x.c) > Number(x.o) : Number(x.c) < Number(x.o));
          const left5 = (end5 - now) / 1000;
          // KNOCK UNTIL 3:30 (fix191, Oct 25 ~2:17 AM PT - the 2:15 main long's flip landed at 2:16:00 with 4 minutes left, one try at 41c missed as the book moved, and
          // the 4-minute cutoff closed the door 13 s later): the flip must land with 4+ minutes left in this 5m window (the bar closing at its open or after its first
          // minute); once it has, she keeps knocking until 3:30 is left.
          let flipOk = fin.some((x: any) => { const lf = end5 / 1000 - (Number(x.t) + 60); return herWay(x) && lf >= 240 && lf <= 301; }); // fix205: 4+ minutes again // fix199 (Love 3:49 AM "if she missed that short bc there wasn't 4 minute left i want to make it 3 minutes pls"): flip with 3+ minutes left, knock until 2:30
          // THE 5M FLIP IS A DOOR TOO (fix200, Oct 25 ~3:57 AM PT, Love: "i want her to enter on a 5M candle flip as well - not the 1M alone pls" + card "Either flip is a
          // door"): a finished 5m candle that closed her way after her call opens the door for the window right after it, same 2:30 knock limit.
          if (false /* fix211 (Oct 25 ~2:11 PM PT, Love card "Drop the 5m door" - replay: 5m candle door alone 25/49 = 51%) */ && !flipOk) { try { const all5 = ((globalThis as any).__pivBars?.btc?.bars ?? []) as any[], w05 = end5 / 1000 - 300;
            const o5 = all5.find((x: any) => Number(x.t) === w05 - 300), c5 = all5.find((x: any) => Number(x.t) === w05 - 60);
            if (o5 && c5 && w05 > callS && w05 <= nowS && (r.side === "up" ? Number(c5.c) > Number(o5.o) : Number(c5.c) < Number(o5.o))) flipOk = true; } catch {} }
          // 2M AND 3M FLIPS ARE DOORS TOO (fix210, Oct 25 ~2:03 PM PT, Love: "lets throw the 2M's and 3M's up on poly if they're hitting at 80%, and giving her
          // more valid set ups" - replay: 2m flip with 3+ min left 35 windows 83%, 3m 20 windows 80%, 1m-or-2m 70 windows vs 54): a 2m or 3m candle (from her 1m
          // bars, on the clock) that closed her way after her call, landing with 3+ minutes left in this 5m window, opens the door; she knocks until 2:30 is left.
          let flipKnock = 180;
          if (!flipOk) { try { const all1 = ((globalThis as any).__pivBars?.btc?.bars ?? []) as any[];
            for (const N of [2, 3]) { const te = Math.floor(nowS / (60 * N)) * (60 * N), s0 = te - 60 * N, lfN = end5 / 1000 - te;
              if (!(te > callS && lfN >= 180 && lfN <= 301)) continue;
              const bo = all1.find((x: any) => Number(x.t) === s0), bc = all1.find((x: any) => Number(x.t) === te - 60);
              if (bo && bc && (r.side === "up" ? Number(bc.c) > Number(bo.o) : Number(bc.c) < Number(bo.o))) { flipOk = true; flipKnock = 150; (base5 as any).door = `${N}m flip`; break; } } } catch {} }
          // THE LATE DOOR (fix195, Oct 25 ~3:25 AM PT, Love: "btc's 5M window had 2:30 left on it and price was clearly pushing up off of the pink band and already had
          // rejected and had a good distance away (green $25-50 away) ... open the door to those as well" + "yeup runnit bb" after the replay showed 1.5x and under wins,
          // 1.6-1.8x breaks even, 2x loses): with 2:00-3:00 left, if this window touched the pink (5m PP, within $10) and price is now $25-60 away from it on her side,
          // with the last finished 1m candle closed her way, she may buy - but never past 1.5x (limit 66c).
          const lateOnly5 = !!(r as any).lateOnly; // fix198: the other book may only use the late door
          if ((!(flipOk && left5 >= flipKnock) || lateOnly5) && left5 >= 150 && left5 <= 180) { try { // fix206 (Oct 25 ~1:15 PM PT, Love: "give her the second minute to fill ... and include the last minute book that tested near that 70%"): knock through the
            // window's second minute (to 3:00 left); the late door is back from 3:00 to 2:30 left, only at 60-70c (1.43x-1.67x - the replay's 3:00-left 1.5x bucket won 70%, 1.3-1.5x 79%)
            const bb5 = (((globalThis as any).__pivBars?.btc?.bars ?? []) as any[]).filter((x: any) => Number(x.t) >= end5 / 1000 - 300).sort((x: any, y: any) => Number(x.t) - Number(y.t));
            const pk5 = Number((((globalThis as any).__lawBands?.btc?.L ?? []) as any[]).find((l: any) => String(l.name) === "5m PP")?.price) || 0;
            const lf5 = fin.length ? fin[fin.length - 1] : null, px5 = bb5.length ? Number(bb5[bb5.length - 1].c) : 0;
            if (pk5 > 0 && px5 > 0 && lf5 && herWay(lf5) && Number(lf5.t) + 60 >= nowS - 65) {
              const lo5 = Math.min(...bb5.map((x: any) => Number(x.l))), hi5 = Math.max(...bb5.map((x: any) => Number(x.h)));
              late5 = r.side === "up" ? lo5 <= pk5 + 10 && px5 - pk5 >= 15 && px5 - pk5 <= 60 : hi5 >= pk5 - 10 && pk5 - px5 >= 15 && pk5 - px5 <= 60; // fix197 (Love 3:31 AM "we can make that $15-$60 + hun"): $15 floor (was $25)
            } } catch { late5 = false; } }
          if (late5 && Object.entries(reg).some(([k, v]: [string, any]) => k.endsWith(":5m") && k !== id5 && v?.status === "filled" && v?.closesAt === closes5)) late5 = false; // fix198: one late buy per window across both books
          if ((!(flipOk && left5 >= flipKnock) || lateOnly5) && !late5) {
            if (lateOnly5) { reg[id5] = { ...base5, status: "waiting", reason: "late door only (the other book holds the 5m)" }; changed = true; continue; }
            const wf = !fin.some(herWay) ? `waiting for a 1m candle to close ${r.side === "up" ? "green" : "red"} (her 5m flip)` : `waiting for her flip with 4+ minutes left in the 5m window`;
            if (d5?.reason !== wf) log({ id: id5, status: "waiting", reason: wf });
            reg[id5] = { ...base5, status: "waiting", reason: wf }; changed = true; continue;
          }
        }
        let bl5: any; (globalThis as any).__pinkCap5 = 25; const bbH5 = (globalThis as any).__bbsr; if ((globalThis as any).__bbsrChart) (globalThis as any).__bbsr = (globalThis as any).__bbsrChart; try { bl5 = part5 || (base5 as any).wallOk ? { ok: true } : blm5.bandLockCheck( /* fix339 */String(r.book), r.asset, r.side, String(r.ticker)); } finally { (globalThis as any).__pinkCap5 = 0; (globalThis as any).__bbsr = bbH5; } // fix199: $25 pink cushion on the 5m board // fix266 (Love Oct 26 9:09 AM PT: "please go back over our last messages yesterday and rebuild a twin EXACTLY. from that configuration, nothing different whatsoever"): the 5m board's walls read the chart's Bollinger as on Sunday, not her own (fix259 stays for Kalshi)
        if (!bl5.ok) { if (d5?.reason !== bl5.reason) log({ id: id5, status: "blocked", reason: bl5.reason }); reg[id5] = { ...base5, status: "blocked", reason: bl5.reason }; changed = true; continue; }
        const win5 = await pm.polyWindow5(r.asset, closes5).catch(() => null);
        if (!win5 && part5) { reg[id5] = { ...d5, lastTry: now }; changed = true; continue; }
        if (!win5) { if (d5?.status !== "no window") log({ id: id5, status: "no window", closesAt: closes5 }); reg[id5] = { ...base5, status: "no window", reason: `no Polymarket BTC 5m market closing ${closes5}` }; changed = true; continue; }
        const held5 = await pm.polymarketHoldings().catch(() => []);
        const sg5 = r.side === "up" ? 1 : -1;
        if (held5.find((h) => h.slug === win5.slug && Math.abs(h.net) > 0.01 && Math.sign(h.net) !== sg5)) { reg[id5] = { ...base5, status: "skipped", final: true, slug: win5.slug, reason: `the other side is already held on ${win5.slug}` }; log({ id: id5, ...reg[id5] }); changed = true; continue; }
        { let why7 = ""; // fix207: her guards
          if ((Number(G207.net) || 0) <= -45 /* fix208 (Love 1:30 PM "let's make it -$45 hun") */ && !G207.stopOff /* fix270 (Love Oct 26 10:49 AM PT card "Correct it, keep her trading"): stopOff lifts the day stop for that PT day only; the midnight reset drops it */) why7 = `5M DAY STOP: the 5m book is ${G207.net} today - done until midnight PT`;
          else if (now < (Number(G207.pauseUntil) || 0)) why7 = `5M COOL-OFF: 4 losses in a row - back at ${new Date(Number(G207.pauseUntil)).toISOString().slice(11, 16)}Z`;
          else { const c7 = await pm.polymarketCash().catch(() => null); if (c7 == null || c7 - Number(r5.dollars) < 0) why7 = `5M CASH FLOOR: Polymarket cash ${c7 ?? "unreadable"} - not enough for the stake`; } /* fix267 (Love Oct 26 9:27 AM PT: "let's get rid of that $15 floor for polymarket ... let her flip it pls"): no $15 reserve, she only needs the stake itself */
          if (why7) { if (d5?.reason !== why7) log({ id: id5, status: "blocked", reason: why7 }); reg[id5] = { ...base5, status: "blocked", reason: why7 }; changed = true; continue; } }
        const max5 = Math.floor(100 / (blm.floorFor(r.asset, r.side, String(r.book)) || 1.38)) / 100;
        let f5: any = null; let e5 = "";
        /* SNIPE LIKE THE MAIN BOOK (fix193, Oct 25 ~2:30 AM PT, Love: "can you see why she wasn't in on the 5M btc one this window? ... let's make sure her execution is on par
        with our main books snipes" - the 2:25 short's flip came at 2:26:00 and her 50c limit (ask + 1c) missed as the book moved): the 5m limit reaches 4c over the ask
        (her Kalshi snipes reach +3c or more), never past her 1.38x floor. */ try { f5 = await pm.takeSide(r.side, closes5, part5 ? Math.round((Number(r5.dollars) - Number(d5.spent || 0)) * 100) / 100 : Number(r5.dollars), Math.round((late5 || d5?.late ? Math.min(0.70, max5) : max5 - 0.04) * 100) / 100, late5 || d5?.late ? 0.60 : 0.30 /* fix205: no long shots under 30c; fix206: late door 60-70c only */, 0.04, part5 ? `:rej5mtop${Number(d5.tops || 0) + 1}` : ":rej5m", r.asset); } catch (x: any) { e5 = String(x?.message || x).slice(0, 160); }
        if (f5) {
          const spent5 = Math.round(((part5 ? Number(d5.spent || 0) : 0) + f5.filled * f5.price) * 100) / 100, n5 = (part5 ? Number(d5.contracts || 0) : 0) + f5.filled;
          const more5 = false && Number(r5.dollars) - spent5 >= 1 && (end5 - now) / 1000 >= 150; // fix205: no top-ups // fix202: $1+ of her size still unfilled -> keep knocking
          reg[id5] = { ...base5, status: more5 ? "partial" : "filled", final: !more5, late: late5 || !!d5?.late, slug: f5.slug, contracts: Math.round(n5 * 100) / 100, cost: Math.round((spent5 / n5) * 1000) / 1000, spent: spent5, tops: (part5 ? Number(d5.tops || 0) + 1 : 0), addOn: d5?.addOn, addTry: d5?.addTry, orderId: f5.orderId, closesAt: closes5 }; (globalThis as any).__add5Until = Math.max(Number((globalThis as any).__add5Until) || 0, end5);
          try { const hf = join(process.cwd(), "data", "hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
            hs.unshift({ at: new Date().toISOString(), kind: "rej5m", book: r.book === "recon-tog" ? "recon-tog-5m" : "recon-rej-5m", slug: f5.slug, side: r.side, contracts: f5.filled, cost: f5.price, stake: Math.round(f5.filled * f5.price * 100) / 100, kalshi: r.ticker, closesAt: closes5, status: "open" });
            writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
          log({ id: id5, ...reg[id5] });
        } else { const why5 = e5 || pm.takeSideWhy(); if (d5?.reason !== why5) log({ id: id5, status: part5 ? "top-up no fill" : "no fill", reason: why5 }); reg[id5] = part5 ? { ...d5, lastTry: now, reason: why5 } : { ...base5, status: "no fill", reason: why5 }; }
        changed = true; continue;
      }
      if (r.book === "recon-tog") continue; // fix171: main-book rows only ever ride the 5m lane
      if ((r as any).lateOnly) continue; // fix198: late-door-only rows never take the 15m path
      if ((r as any).swing5) continue; // fix186: a fresh 5m swing never takes the 15m path
      // NO POLYMARKET 15M (fix236, Oct 25 ~9:16 PM PT, Love card "Stop 15m, 5m to $10": since Oct 23 Poly 15m gold 5-24 -$40.63, BTC 45-62 +$10.82, vs
      // the 5m rejection lane 13-2 +$55.25 since the 72% rule): with polyTwin.no15m on, no call opens a Polymarket 15m position; the 5m lane above is untouched.
      if (cfg.no15m === true) continue;
      const d = reg[r.id];
      if (d && (d.status === "filled" || d.final)) continue;
      if (d && now - Number(d.lastTry || 0) < 4000) continue;
      const base = { book: r.book, asset: r.asset, side: r.side, ticker: r.ticker, setup: r.setup, lastTry: now, tries: (Number(d?.tries) || 0) + 1 };
      const mm = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(String(r.ticker));
      const endMs = mm ? Date.UTC(2000 + Number(mm[1]), MON.indexOf(mm[2]), Number(mm[3]), Number(mm[4]) + 4, Number(mm[5])) : 0;
      if (!endMs || now > endMs - 60000) { reg[r.id] = { ...base, status: "skipped", final: true, reason: "under a minute left" }; changed = true; continue; }
      const closesAt = new Date(endMs).toISOString();
      const bl: any = (r as any).hedge ? { ok: true } : blm.bandLockCheck(String(r.book), r.asset, r.side, String(r.ticker));
      if (!bl.ok) { if (d?.reason !== bl.reason) log({ id: r.id, status: "blocked", reason: bl.reason }); reg[r.id] = { ...base, status: "blocked", reason: bl.reason }; changed = true; continue; }
      const win = await pm.polyWindowAsset(r.asset, closesAt).catch(() => null);
      if (!win) { if (d?.status !== "no window") log({ id: r.id, status: "no window", closesAt }); reg[r.id] = { ...base, status: "no window", reason: `no Polymarket ${r.asset} 15m window closing ${closesAt}` }; changed = true; continue; }
      const held = await pm.polymarketHoldings().catch(() => []);
      const sg = r.side === "up" ? 1 : -1;
      const other = held.find((h) => h.slug === win.slug && Math.abs(h.net) > 0.01 && Math.sign(h.net) !== sg);
      if (other) { reg[r.id] = { ...base, status: "skipped", final: true, slug: win.slug, reason: `the other side is already held on ${win.slug} (${other.net}) - Polymarket would net them` }; log(reg[r.id]); changed = true; continue; }
      // THE TWIN WAITS FOR 2.8x ON POLYMARKET TOO (fix150, Oct 23 ~2:48 PM PT, Love: "the delayed model still fired the entry at the beginning of the window ... didn't
      // wait for the next band interaction, she just entered the opposite direction as our main book again" - 2:46 PM BTC "Turned up after the initial move" bought at 69c):
      // like her Kalshi twin (fix128), a copied twin call buys only at 2.8x+ (34c ask + 1c); otherwise the band-touch entry below is her way in.
      const maxAsk = (r as any).hedge || String(r.book) !== "recon-dly" ? Math.floor(100 / (blm.floorFor(r.asset, r.side, String(r.book)) || 1.38)) / 100 : 0.44; // fix189 2.4x -> fix190 (Oct 25 ~2:09 AM PT, Love: "she can do her initial entry at a 2.2x + on the delayed entry model if she will miss the entry without it"): 2.2x+ (was 2.8x, 0.34)
      let fill: any = null; let err = "";
      try { fill = await pm.takeSide(r.side, closesAt, Number(cfg.dollars), maxAsk, 0.02, 0.01, ":twin", r.asset); } catch (x: any) { err = String(x?.message || x).slice(0, 160); }
      if (fill) {
        reg[r.id] = { ...base, status: "filled", final: true, slug: fill.slug, contracts: fill.filled, cost: fill.price, orderId: fill.orderId };
        try { const hf = join(process.cwd(), "data", "hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
          hs.unshift({ at: new Date().toISOString(), kind: (r as any).hedge ? "twin-hedge" : "twin", book: r.book, slug: fill.slug, side: r.side, contracts: fill.filled, cost: fill.price, stake: Math.round(fill.filled * fill.price * 100) / 100, kalshi: r.ticker, closesAt, status: "open" });
          writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
        log({ id: r.id, ...reg[r.id] });
      } else {
        const why = err || pm.takeSideWhy();
        if (d?.reason !== why) log({ id: r.id, status: "no fill", reason: why });
        reg[r.id] = { ...base, status: "no fill", reason: why };
      }
      changed = true;
    }
    // AT THE FIRST BAND AFTER THE INITIAL MOVE (fix113, Oct 22 ~8:47 PM PT, Love: "lets make it so she enters at a band as well, no rejection necessary / don't
    // want her to miss any / any bollinger, session, pink or red/green zone / 2.8x +" + card "Fade the band, once per window" + "first band after the initial
    // move takes place, the delayed entry model"): once the main book (TOGETHER) has made its first call in the window (booked or floor-missed), the first
    // line price comes near that it wasn't already near at that call -> the other side of the main call, $2, 2.8x+ (cfg.touchMaxAsk), no candle or rejection,
    // her twin wall still judges. One Polymarket twin entry per window (shares the ":twin" claim with the copied twin calls).
    if (touchOn) {
      const TS = (g.__polyTouch ||= {}) as Record<string, any>;
      const tg = ((await import("./grokog")).asNightRows() as any[]).filter((r) => r.book === "recon-tog" && (r.asset === "btc" || r.asset === "gold") && /15M-/.test(String(r.ticker)) && now - Date.parse(String(r.at)) < 15 * 60 * 1000);
      const firsts: Record<string, any> = {};
      for (const r of tg) { const k = String(r.ticker); if (!firsts[k] || Date.parse(String(r.at)) < Date.parse(String(firsts[k].at))) firsts[k] = r; }
      try { const GM = (g as any).__togMiss || {}; for (const [tk, mv] of Object.entries(GM) as [string, any][]) { if (!/15M-/.test(tk) || !(now - Number(mv?.at) < 15 * 60 * 1000)) continue; if (!firsts[tk] || Number(mv.at) < Date.parse(String(firsts[tk].at))) firsts[tk] = { ticker: tk, side: mv.side, at: new Date(Number(mv.at)).toISOString(), asset: /GOLD/.test(tk) ? "gold" : "btc" }; } } catch {}
      for (const [tk, f] of Object.entries(firsts)) {
        const mm = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(tk);
        const endMs = mm ? Date.UTC(2000 + Number(mm[1]), MON.indexOf(mm[2]), Number(mm[3]), Number(mm[4]) + 4, Number(mm[5])) : 0;
        if (!endMs || now > endMs - 60000 || now < endMs - 15 * 60 * 1000) continue;
        const asset = String(f.asset) === "gold" ? "gold" : "btc";
        const nearNow = blm.bandsNearNow(asset); if (!nearNow) continue;
        let st = TS[tk];
        if (!st) { st = TS[tk] = { init: f.side, seen: [...nearNow.names], done: false, at: now }; continue; } // lines already near at the main call don't count
        if (st.done) continue;
        st.seen = st.seen.filter((n: string) => nearNow.names.includes(n)); // a line price left can count again
        const fresh = nearNow.names.find((n) => !st.seen.includes(n));
        if (!fresh) continue;
        const side = dlyOnKalshi ? String(st.init) : st.init === "up" ? "down" : "up"; // fix118: in the twin's Kalshi hours Poly hedges it (main's side)
        const wall = dlyOnKalshi ? "" : blm.polyTwinWall(asset, side);
        const id = `${tk}:polytwin-touch`;
        if (wall) { if (reg[id]?.reason !== wall) log({ id, status: "blocked", band: fresh, side, reason: wall }); reg[id] = { status: "blocked", band: fresh, side, reason: wall, lastTry: now }; st.seen.push(fresh); changed = true; continue; }
        if (now - Number(st.lastTry || 0) < 4000) continue;
        st.lastTry = now;
        const closesAt = new Date(endMs).toISOString();
        const win = await pm.polyWindowAsset(asset, closesAt).catch(() => null);
        if (!win) { reg[id] = { status: "no window", band: fresh, side, lastTry: now }; changed = true; continue; }
        const held = await pm.polymarketHoldings().catch(() => []);
        const sg = side === "up" ? 1 : -1;
        if (held.find((h) => h.slug === win.slug && Math.abs(h.net) > 0.01 && Math.sign(h.net) !== sg)) { st.done = true; reg[id] = { status: "skipped", final: true, band: fresh, side, reason: `the other side is already held on ${win.slug} - Polymarket would net them` }; log({ id, ...reg[id] }); changed = true; continue; }
        const maxAskT = Number(cfg.touchMaxAsk) > 0 ? Number(cfg.touchMaxAsk) : 0.35;
        let fill: any = null; let err = "";
        try { fill = await pm.takeSide(side, closesAt, Number(cfg.dollars), maxAskT, 0.02, 0.01, ":twin", asset); } catch (x: any) { err = String(x?.message || x).slice(0, 160); }
        if (fill) {
          st.done = true;
          reg[id] = { status: "filled", final: true, band: fresh, side, init: st.init, slug: fill.slug, contracts: fill.filled, cost: fill.price, orderId: fill.orderId };
          try { const hf = join(process.cwd(), "data", "hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
            hs.unshift({ at: new Date().toISOString(), kind: "twin", book: "polytwin-touch", slug: fill.slug, side, contracts: fill.filled, cost: fill.price, stake: Math.round(fill.filled * fill.price * 100) / 100, kalshi: tk, closesAt, status: "open" });
            writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
          log({ id, ...reg[id] });
        } else {
          const why = err || pm.takeSideWhy();
          if (/already has an order in flight/.test(why)) st.done = true; // the copied twin call took this window
          if (reg[id]?.reason !== why) log({ id, status: "no fill", band: fresh, side, reason: why });
          reg[id] = { status: "no fill", band: fresh, side, reason: why, lastTry: now };
        }
        changed = true;
      }
      for (const k of Object.keys(TS)) if (now - Number(TS[k].at) > 20 * 60 * 1000) delete TS[k];
    }
    // THE TWIN'S $3 ADD-ON ON POLYMARKET (fix143, Oct 23 ~1:34 PM PT, Love picked "Yes, $3 at 4.5x+ like Kalshi" on "Give the twin her $3 add-on on Polymarket
    // too?" after fix142 moved the twin off Kalshi): each open twin position on Polymarket (hedges.json kind "twin") adds polyTwin.addOn.dollars on the same side
    // once, at the first band touch (bandlock addOnTouchNow: session bands, pink, Bollinger, green/red zone) while the ask pays 4.5x+ (addOn.maxAsk incl. 1c slip),
    // minLeft+ minutes before the bell. Free like her Kalshi twin add-on (fix81): no wall. Joins hedges.json (kind "twin-add") so hedgeBank sells half at 75%, rest at 90%.
    const ad = cfg.addOn;
    if (ad && ad.on === true && Number(ad.dollars) > 0) {
      let hs0: any[] = []; try { hs0 = JSON.parse(readFileSync(join(process.cwd(), "data", "hedges.json"), "utf8")); } catch { hs0 = []; }
      for (const h of (Array.isArray(hs0) ? hs0 : []).filter((x) => x && x.status === "open" && x.kind === "twin" && x.closesAt && x.slug && (x.side === "up" || x.side === "down"))) {
        const id = `${h.slug}:polytwin-add`;
        if (reg[id]?.final) continue;
        if (!(Date.parse(String(h.closesAt)) - now > (Number(ad.minLeft) || 2) * 60000)) continue;
        if (now - Number(reg[id]?.lastTry || 0) < 4000) continue;
        const asset = /GOLD/.test(String(h.kalshi)) ? "gold" : "btc";
        const touch = blm.addOnTouchNow(asset);
        if (!touch) continue;
        const mx = Number(ad.maxAsk) > 0 && Number(ad.maxAsk) < 1 ? Number(ad.maxAsk) : 0.222;
        let fill: any = null; let err = "";
        try { fill = await pm.takeSide(h.side, String(h.closesAt), Number(ad.dollars), Math.round((mx - 0.01) * 100) / 100, 0.02, 0.01, ":twinadd", asset); } catch (x: any) { err = String(x?.message || x).slice(0, 160); }
        if (fill) {
          reg[id] = { status: "filled", final: true, side: h.side, touch, slug: fill.slug, contracts: fill.filled, cost: fill.price, orderId: fill.orderId, lastTry: now };
          try { const hf = join(process.cwd(), "data", "hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
            hs.unshift({ at: new Date().toISOString(), kind: "twin-add", book: "polytwin-add", slug: fill.slug, side: h.side, contracts: fill.filled, cost: fill.price, stake: Math.round(fill.filled * fill.price * 100) / 100, kalshi: h.kalshi, closesAt: h.closesAt, status: "open" });
            writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
          log({ id, ...reg[id] });
        } else {
          const why = err || pm.takeSideWhy();
          if (reg[id]?.reason !== why) log({ id, status: "no fill", side: h.side, touch, reason: why });
          reg[id] = { status: "no fill", side: h.side, reason: why, lastTry: now };
        }
        changed = true;
      }
    }
    if (changed) { const ks = Object.keys(reg); if (ks.length > 400) for (const k of ks.slice(0, ks.length - 400)) delete reg[k]; writeFileSync(regF, JSON.stringify(reg, null, 1)); }
  } catch {
  } finally {
    g.__polyTwinBusy = false;
  }
}
async function hedgeBank() {
  if (g.__aureliusHedgeBankBusy) return;
  g.__aureliusHedgeBankBusy = true;
  try {
    const hf = join(process.cwd(), "data", "hedges.json");
    let hs: any[] = [];
    try {
      hs = JSON.parse(readFileSync(hf, "utf8"));
    } catch {
      return;
    }
    if (!Array.isArray(hs) || !hs.some((h) => h.status === "open")) return;
    let ic: any = {};
    try {
      ic = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).insurance || {};
    } catch {
    }
    if (ic.bank === false) return;
    const bankAt = Number(ic.bankAt) > 0 ? Number(ic.bankAt) : 200;
    const pm = await import("./poly-live.server");
    let changed = false;
    for (const h of hs) {
      if (h.status !== "open") continue;
      const end = Date.parse(String(h.closesAt || ""));
      if (Number.isFinite(end) && Date.now() > end - 4000) {
        h.status = "to the bell";
        changed = true;
        continue;
      }
      const mark = await pm.markSide(h.slug, h.side, Number(h.contracts), Number(h.stake) || 1).catch(() => null);
      if (!mark) continue;
      if (!(Number(h.peakBid) >= mark.bid)) {
        h.peakBid = mark.bid;
        changed = true;
      }
      // HARD CASH-OUT AT 90% OF THE MAX (Love, Oct 4 AM: "hard-cash out at 90% of the max available... don't let em run to the
      // bell"): a hedge bought at c can grow to $1, so its line is c + 90% of (1 - c), floored to the cent (20c -> 92c).
      // insurance.bankOfMax sets the share; without it, the older +bankAt% line.
      const ofMax = Number(ic.bankOfMax) > 0 && Number(ic.bankOfMax) <= 100 ? Number(ic.bankOfMax) : 0;
      const cost = Number(h.cost);
      // HALF AT 75% (Oct 21 ~2:20 PM PT, Love: "let's have the same take profits in place as we do for our main book / half at 75% of the scale, rest at
      // 90%"): the first time a hedge's bid reaches cost + 75% of (1 - cost), half its contracts are sold; the rest waits for the 90% line below.
      const half = Number(ic.halfOfMax) > 0 && Number(ic.halfOfMax) < 100 ? Number(ic.halfOfMax) : 0;
      if (half > 0 && !h.halfDone && Number(h.contracts) >= 0.02) {
        const line75 = Math.floor((cost + (half / 100) * (1 - cost)) * 100 + 1e-6) / 100;
        if (mark.bid + 1e-9 >= line75) {
          const n2 = Math.floor((Number(h.contracts) / 2) * 100) / 100;
          const soldH = await pm.sellSide(h.side, h.slug, n2).catch(() => null);
          if (soldH && soldH.filled > 0) {
            const gotH = Math.round(soldH.filled * soldH.price * 100) / 100;
            const paidH = Math.round(soldH.filled * cost * 100) / 100;
            h.banked = Math.round(((Number(h.banked) || 0) + gotH - paidH) * 100) / 100;
            h.contracts = Math.round((Number(h.contracts) - soldH.filled) * 100) / 100;
            h.halfDone = true; h.halfAt = new Date().toISOString(); h.halfPx = soldH.price;
            if (!(h.contracts >= 0.01)) h.status = "banked";
            changed = true;
            try { appendFileSync(join(process.cwd(), "data", "insurance-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), venue: "polymarket", kalshi: h.kalshi, slug: h.slug, side: h.side, status: "half banked at 75%", sold: soldH.filled, price: soldH.price, cost: h.cost, profit: Math.round((gotH - paidH) * 100) / 100 }) + "\n"); } catch {}
            if (h.status === "banked") continue;
          }
        }
      }
      const line = ofMax > 0 ? Math.floor((cost + (ofMax / 100) * (1 - cost)) * 100 + 1e-6) / 100 : cost * (1 + bankAt / 100);
      if (mark.bid + 1e-9 >= line) {
        const sold = await pm.sellSide(h.side, h.slug, Number(h.contracts)).catch(() => null);
        if (sold && sold.filled > 0) {
          const got = Math.round(sold.filled * sold.price * 100) / 100;
          const paid = Math.round(sold.filled * Number(h.cost) * 100) / 100;
          h.banked = Math.round(((Number(h.banked) || 0) + got - paid) * 100) / 100;
          h.contracts = Math.round((Number(h.contracts) - sold.filled) * 100) / 100;
          h.soldAt = new Date().toISOString();
          h.soldPx = sold.price;
          if (!(h.contracts >= 0.01)) h.status = "banked";
          changed = true;
          try {
            appendFileSync(join(process.cwd(), "data", "insurance-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), venue: "polymarket", kalshi: h.kalshi, slug: h.slug, side: h.side, status: "banked", sold: sold.filled, price: sold.price, cost: h.cost, profit: Math.round((got - paid) * 100) / 100, bankAt }) + "\n");
          } catch {
          }
        }
      }
    }
    if (changed) writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1));
  } catch {
  } finally {
    g.__aureliusHedgeBankBusy = false;
  }
}
// PIVOT CHECK IN HER BRAIN, PAPER 24/7 (Oct 14 ~9:00 AM PT, Love: "yes pls"). Before PAPER books a gold trade she runs the gold
// pivot check (5m red/pink/green walls + no chasing past the pink). Blocked = not booked this pass, so her window stays open
// and she keeps looking: a rejection can still give her the other side, a break the same side once the wall is behind.
// live-switch pivotZoneTerminal.gold. Logged (once per setup) in data/pivot-hold.jsonl.
async function pivotHold(asset, setup) {
  try {
    if (!setup || String(setup.asset || asset?.asset || "").toLowerCase() !== "gold") return false;
    const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
    if (sw?.pivotZoneTerminal?.gold !== true) return false;
    const pz = await import("./pivotbooks");
    const ck = pz.pivotZoneCheck("gold", setup.side, Number(asset?.spot) || 0, sw?.pivotZone?.gold);
    if (ck && !ck.block) return false;
    const seen = (g.__pivHoldSeen ||= {});
    const key = `${setup.ticker}:${setup.side}:${setup.pattern?.label || setup.label || ""}`;
    if (!seen[key]) {
      seen[key] = Date.now();
      try {
        appendFileSync(join(process.cwd(), "data", "pivot-hold.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: setup.ticker, side: setup.side, label: setup.pattern?.label || setup.label || "", why: ck ? ck.why : "no fresh pivot read" }) + "\n");
      } catch {
      }
    }
    return true;
  } catch {
    return String(setup?.asset || asset?.asset || "").toLowerCase() === "gold"; // a failed check holds gold, never a free pass
  }
}
function fastLand(trades, settings, assets) {
  try {
    writeBook(trades, settings);
  } catch {
  }
  void (async () => {
    try {
      const fn = globalThis.__pivFn;
      if (typeof fn === "function") await fn(assets);
    } catch {
    }
    try {
      await copyLiveBookSafe(assets);
    } catch {
    }
  })();
}
var MODULE_TOKEN = Math.random().toString(36).slice(2, 8);
async function tick() {
  try { writeFileSync(join(process.cwd(), "data", `engine-alive-${MODULE_TOKEN}.json`), JSON.stringify({ at: new Date().toISOString() })); } catch {}
  if (g.__aureliusBusy) return;
  void hedgeBank();
  void polyTwin(); // fix112 - the twin on Polymarket 24/7
  // READ-ONLY POLYMARKET AUDIT on request (Oct 21, Love): touch data/poly-audit.req -> data/poly-audit.json
  try { const rq = join(process.cwd(), "data", "poly-audit.req"); if (existsSync(rq) && !g.__polyAuditBusy) { g.__polyAuditBusy = true; renameSync(rq, rq + ".done"); void import("./poly-live.server").then((pm) => pm.polyAudit()).catch(() => {}).finally(() => { g.__polyAuditBusy = false; }); } } catch {}
  g.__aureliusBusy = true;
  try {
    writeFileSync(join(process.cwd(), "data", "heartbeat.json"), JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), gen: ENGINE_GEN, phase: "start" }));
  } catch {
  }
  ensureLossHalt();
  sealModel();
  holdModel();
  quietWatch();
  try {
    await maybeRaise();
    await guardFills();
  } catch {
  }
  paceGuard();
  hourMo();
  const halted = entriesOff();
  if (halted) {
    try {
      writeFileSync(join(process.cwd(), "data", "halt-seen.json"), JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), gen: ENGINE_GEN }));
    } catch {
    }
  }
  try {
    const book = readBook();
    g.__lastSettings = book.settings;
    const snap = await scanDesk(book.settings);
    // Monitor: model sentinel + post-trade reviews. Watches only.
    try {
      monitorTick();
    } catch {
    }
    // Shadow book (rejection model): watches only, never trades.
    try {
      shadowTick(snap.assets);
    } catch {
    }
    // Lotto lab (Love): out-of-band $5 tickets, paper only, never trades.
    // Polymarket books first, each on its own: a throw in the lotto lab must never stop them.
    try {
      import("./polyhour").then((m) => m.polyHourTick(snap.assets)).catch((err) => {
        try {
          writeFileSync(join(process.cwd(), "data", "poly-hour-status.json"), JSON.stringify({ at: new Date().toISOString(), error: "load: " + String(err?.message || err).slice(0, 200) }));
        } catch {
        }
      });
      import("./polymirror").then((m) => m.polyMirrorTick(snap.assets)).catch(() => {});
    } catch {
    }
    try {
      void lottoSnipe(snap.assets);
    } catch {
    }
    try {
      lottoTick(snap.assets);
    } catch (err) {
      try {
        writeFileSync(join(process.cwd(), "data", "lotto-error.json"), JSON.stringify({ at: new Date().toISOString(), error: String(err?.message || err).slice(0, 300) }));
      } catch {
      }
    }
    // Nav tape (Claude, read only): every nav line on every timeframe, once a minute.
    try {
      navTapeTick(snap.assets);
    } catch {
    }
    // Night book (Love): ORIGINAL vs NEW paper ledgers on real bids.
    try {
      nightTick(snap.assets);
    } catch {
    }
    // BTC HOURLY (Love): Kalshi KXBTCD off her 1-hour nav band. Paper only (hourly.ts).
    import("./hourly").then((m) => m.hourTick(snap.assets)).catch(() => {});
    // TAP + RESCUE (Love): band-touch lotto tickets and rescue adds. Paper only (tap.ts).
    import("./tap").then((m) => m.tapTick(snap.assets)).catch(() => {});
    import("./squeeze").then((m) => m.squeezeTick(snap.assets)).catch(() => {});
    // CONFIRM (Love, Oct 3): a band break on Pepperstone or Vantage, entered only when the other feed follows (paper).
    import("./confirm").then((m) => m.confirmTick(snap.assets)).catch(() => {});
    // LEAD-LAG (Love): BTC as the early signal for ETH / SOL. Recorder only (leadlag.ts).
    import("./leadlag").then((m) => m.leadLagTick(snap.assets?.btc?.spot || 0, snap.assets?.btc?.market ?? null)).catch(() => {});
    // BRICK (Love): entry logic rewritten from scratch by Claude. Paper only (brick.ts).
    // FAST COPY (Love, Oct 3 ~3:45 PM PT: "it missed again"): a live-book trade goes to Kalshi the moment the book takes
    // it, not at the end of the main loop. Runs right after BRICK looks, every tick, and every 2 seconds on its own.
    gLiveCopy.__lastAssets = snap.assets;
    // STALE COPIER FIX (Claude, Oct 8 ~4 PM PT, Love: "she just longed into a band on btc again"). This 2-second timer was
    // made once, when the server first started, and never replaced on a hot reload: it kept calling the copier from THAT
    // first version of the code, so every gate added since (headroom, touched-not-broken, the $2 gold longs...) only held
    // when the newer copier happened to get to a trade first. 1ST BREAK fires first in a window, so it slipped most.
    // Now the timer always calls the newest copier (through a pointer each version updates) and is rebuilt once per
    // version of the code, so no old copy of the rules can place a trade again.
    gLiveCopy.__copyFn = copyLiveBookSafe;
    if (!gLiveCopy.__liveCopyTimer || gLiveCopy.__liveCopyTimerEval !== EVAL_TOKEN) {
      if (gLiveCopy.__liveCopyTimer) clearInterval(gLiveCopy.__liveCopyTimer);
      gLiveCopy.__liveCopyTimer = setInterval(() => {
        const fn = gLiveCopy.__copyFn;
        if (gLiveCopy.__lastAssets && typeof fn === "function") void fn(gLiveCopy.__lastAssets);
      }, 1000); // MAGLEV (Oct 14): was 2000
      gLiveCopy.__liveCopyTimerEval = EVAL_TOKEN;
    }
    void copyLiveBookSafe(snap.assets);
    import("./brick").then((m) => m.brickTick(snap.assets)).then(() => copyLiveBookSafe(snap.assets)).catch(() => {});
    // GOLDEN (Love): the Oct 1 12:45–3:30 PM PT model on its own feeds. Paper only (golden.ts).
    import("./golden").then((m) => m.goldenTick(snap.assets)).catch(() => {});
    // Band check (Claude, diagnostic only): compares anchors to Love's chart once.
    import("./band-check").then((m) => { m.bandCheckOnce(); m.vbandsTick(); }).catch(() => {});
    import("./research").then((m) => m.researchOnce()).catch(() => {});
    // Kalshi audit (Claude, read only): every 2 minutes, the exchange's own fills + orders.
    if (!g.__kalshiAuditAt || Date.now() - g.__kalshiAuditAt > 120000) {
      g.__kalshiAuditAt = Date.now();
      import("./kalshi-live.server").then((live) => live.auditKalshi()).catch(() => {});
    }
    if (!g.__shadowSettleAt || Date.now() - g.__shadowSettleAt > 60000) {
      g.__shadowSettleAt = Date.now();
      import("./kalshi-live.server").then((live) => shadowSettle(live.marketResult)).catch(() => {});
      import("./kalshi-live.server").then((live) => lottoSettle(live.marketResult)).catch(() => {});
      import("./kalshi-live.server").then((live) => nightSettle(live.marketResult)).catch(() => {});
    }
    let trades = book.trades.map((t) => settleOne(t, snap.assets[t.asset]));
    trades = trades.map((t) => {
      if (t.result !== "open" || t.venue === "polymarket") return t;
      const bid = markTrade(t, snap.assets[t.asset]).bid;
      if (!(bid >= 0.08)) return t;
      noteFour(t, bid);
      const floor = t.lowBid == null ? t.ask : t.lowBid;
      if (!(bid < floor)) return t;
      return { ...t, lowBid: bid };
    });
    trades = await settleRolled(trades, snap.assets);
    const locks2 = await import("./kalshi-live.server").then((live) => live.allLocks()).catch(() => ({}));
    const has = (setupId) => trades.some((t) => t.setupId === setupId);
    for (const id of ["btc", "gold"]) {
      const asset = snap.assets[id];
      if (goldHalted(id) || halted) continue;
      try {
        await lastMinuteLook(asset, id);
      } catch {
      }
      const lateRaw = lateWindow(asset);
      const late = withRightSide(lateRaw, asset);
      if (late && studySetup(late)) await nightLook(late, asset);
      if (late && studySetup(late) && !has(late.id) && !flipped(trades, late.ticker, late.side, late.asset, locks2) && !(await pivotHold(asset, late))) {
        const paper = await kalshiFirst(researchFill(late, asset, book.settings.stake), asset);
        if (paper) {
          noteFive(paper);
          noteKiss(paper, asset);
          alarmBetween(asset, paper.side, paper.ticker);
          await mirrorPaper(asset, paper);
          trades = [paper, ...trades];
          // MAGLEV LANDING (Oct 14 ~7:20 AM PT): her new trade is written to her book right away (not at the end of this
          // pass, after the copier and prime book run) and the pivot books + live copier are told at once.
          fastLand(trades, book.settings, snap.assets);
        }
      }
      const raw = asset.setup;
      const setup = withRightSide(raw, asset);
      if (asset.secondsLeft > 0 && asset.secondsLeft < 120) continue;
      if (!setup || setup.watchOnly || flipped(trades, setup.ticker, setup.side, setup.asset, locks2)) continue;
      const probe = farBandProbe(setup);
      const probeTicket = probe && winningSetup(probe.pattern.label, probe.side) && !has(probe.id) ? fill(probe, asset, 1) : null;
      if (probeTicket) trades = [{ ...probeTicket, probe: true, stake: 1, contracts: 1 / Math.max(probeTicket.ask, 0.01) }, ...trades];
      if (studySetup(setup)) await nightLook(setup, asset);
      if (studySetup(setup) && !has(setup.id) && !(await pivotHold(asset, setup))) {
        const paper = await kalshiFirst(researchFill(setup, asset, book.settings.stake), asset);
        if (paper) {
          noteFive(paper);
          noteKiss(paper, asset);
          alarmBetween(asset, paper.side, paper.ticker);
          await mirrorPaper(asset, paper);
          trades = [paper, ...trades];
          // MAGLEV LANDING (Oct 14 ~7:20 AM PT): her new trade is written to her book right away (not at the end of this
          // pass, after the copier and prime book run) and the pivot books + live copier are told at once.
          fastLand(trades, book.settings, snap.assets);
        }
      }
    }
    // Love's nav close entries: a 1m close across a 5m/10m/15m nav line (navcross.ts).
    for (const id of ["btc", "gold"]) {
      const asset = snap.assets[id];
      if (goldHalted(id) || halted || !asset) continue;
      const cross = navCrossSetup({ ...asset, asset: id });
      if (cross) await nightLook(cross, asset, true);
      if (!cross || has(cross.id) || flipped(trades, cross.ticker, cross.side, cross.asset, locks2)) continue;
      if (trades.some((t) => t.ticker === cross.ticker && t.result === "open")) continue;
      if (await pivotHold(asset, cross)) continue;
      const paper = await kalshiFirst(researchFill(cross, asset, book.settings.stake), asset);
      if (paper) {
        noteFive(paper);
        noteKiss(paper, asset);
        alarmBetween(asset, paper.side, paper.ticker);
        await mirrorPaper(asset, paper);
        trades = [paper, ...trades];
        fastLand(trades, book.settings, snap.assets);
      }
    }
    const silver = await tryFive(halted, "KXSILVER15M", "SI=F", "SILVER");
    if (silver && !trades.some((t) => t.result === "open" && t.ticker === silver.ticker && t.side === silver.side)) {
      trades = [silver, ...trades];
    }
    await tendSilver();
    await cashHeld(snap.assets);
    trades = await tryNextHour(trades, snap.assets.btc, halted);
    try {
      trades = await tendPolyHour(trades);
    } catch {
    }
    trades = await adoptHeld(trades);
    trades = await alignBooks(trades, snap.assets);
    trades = await bankLive(trades, snap.assets);
    trades = adoptScouts(trades, snap.assets);
    for (const id of ["btc", "gold"]) {
      const asset = snap.assets[id];
      const market = asset.market;
      if (!market || goldHalted(id) || halted) continue;
      const paper = trades.find(
        (t) => t.result === "open" && t.source !== "live" && t.venue !== "polymarket" && !t.probe && t.asset === id && t.ticker === market.ticker
      );
      if (!paper) continue;
      const corrected = withRightSide({ ...paper, pattern: { label: paper.patternLabel } }, asset);
      const paperSide = corrected?.side || paper.side;
      if (paperSide !== paper.side) {
        trades = trades.map((t) => t.id === paper.id ? { ...t, side: paperSide } : t);
        paper.side = paperSide;
      }
      const side = paper.side;
      const label = paper.patternLabel || "";
      if (!winningSetup(label, side, paper.asset) || (!spineOwns(paper.asset) && bandInTheWay(asset, side))) continue;
      const vwapNow = asset.vwap1m?.vwap || asset.vwap5m?.vwap || 0;
      if (!(asset.spot > 0) || !(vwapNow > 0)) continue;
      const strikeNow = asset.target ?? 0;
      if (side === "up" && asset.spot < vwapNow && !shortTap(label, side) || side === "down" && asset.spot > vwapNow && !(strikeNow < vwapNow) && !shortTap(label, side)) continue;
      const ask = side === "up" ? market.yesAsk : market.noAsk;
      if (!(ask > 0.02 && ask < 0.92)) continue;
      const copyFloor = shortTap(label, side) ? 1.2 : sureLate(side, label, asset.spot, strikeNow, asset.secondsLeft) ? 1.2 : 1.34;
      if (1 / ask < copyFloor || (shortTap(label, side) && 1 / ask > 1.65)) continue;
      if (manualKalshi()) continue;
      continue;
      try {
        const made = await sendKalshi(
          {
            id: paper.setupId || `${paper.ticker}:${paper.side}:copy`,
            asset: paper.asset,
            ticker: paper.ticker,
            side,
            pattern: {
              kind: "tap_reject",
              side,
              band: null,
              quality: 0.8,
              label,
              reasons: ["Paper filled. One Kalshi copy."]
            },
            ask,
            multiple: 1 / ask,
            localConviction: paper.conviction || 80,
            exitPct: paper.exitPct ?? 75,
            holdToExpiry: false,
            reasons: [],
            watchOnly: false,
            premium: false,
            throughTarget: false
          },
          asset,
          trades
        );
        if (made) trades = [made, ...trades];
      } catch {
      }
    }
    trades = await armHedge(trades, snap.assets);
    try {
      const live = await import("./kalshi-live.server");
      for (const trade of trades) {
        if (trade.source !== "live" || trade.venue === "polymarket" || trade.result !== "open") continue;
        const asset = snap.assets[trade.asset];
        if (!asset?.market || asset.market.ticker !== trade.ticker) continue;
        await live.restAutoSell(trade, exitTargetPct(trade, asset, 75));
      }
    } catch {
    }
    let wrong = false;
    for (const trade of trades) {
      if (trade.source !== "live" || trade.venue === "polymarket" || trade.result !== "open") continue;
      const asset = snap.assets[trade.asset];
      if (!asset?.market || asset.market.ticker !== trade.ticker) continue;
      const spot = asset.spot ?? 0;
      const vwap = asset.vwap1m?.vwap || asset.vwap5m?.vwap || 0;
      const target = asset.target ?? null;
      const stdev = asset.vwap1m?.stdev || asset.vwap5m?.stdev || 0;
      if (!(spot > 0) || !(vwap > 0) || target == null) continue;
      if (shortTap(trade.patternLabel, trade.side)) continue;
      const only = legalSide(spot, vwap, target, stdev);
      const illegal = only === "up" && trade.side === "down" || only === "down" && trade.side === "up";
      if (!illegal) continue;
      wrong = true;
      writeFileSync(
        join(process.cwd(), "data", "page.json"),
        JSON.stringify({
          at: (/* @__PURE__ */ new Date()).toISOString(),
          fix: true,
          ticker: trade.ticker,
          text: `RED: ${trade.asset} ${trade.side} is open on the wrong side of the VWAP.`
        })
      );
    }
    if (!wrong) {
      writeFileSync(join(process.cwd(), "data", "page.json"), JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), fix: false }));
    }
    trades = await sealOffList(trades);
    trades = trailPaper(trades, snap.assets);
    try {
      syncPrimeLooks(snap.assets);
      syncOwnPaper(snap.assets);
      try {
        syncSilverLearn(snap.assets);
      } catch {
      }
      try {
        void syncSymbolLab(snap.assets);
      } catch {
      }
      try {
        noteForming(snap.assets);
      } catch {
      }
      try {
        void scoreMirror(snap.assets);
      } catch {
      }
      await hourCheck();
      await forkPaper(snap.assets);
      await copyPrimeBook(snap.assets);
      await copyLiveBookSafe(snap.assets);
      const lined = await import("./kalshi-live.server");
      await lined.alignPrime();
    } catch {
    }
    writeBook(trades, book.settings);
    paceGuard();
    try {
      bootGuard(snap.assets);
    } catch {
    }
    writeFileSync(join(process.cwd(), "data", "heartbeat.json"), JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), gen: ENGINE_GEN, pace: true }));
  } catch (err) {
    try {
      writeFileSync(
        join(process.cwd(), "data", "tick-error.json"),
        JSON.stringify({
          at: (/* @__PURE__ */ new Date()).toISOString(),
          gen: ENGINE_GEN,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : ""
        })
      );
    } catch {
    }
  } finally {
    try {
      const last = Number(g.__aureliusWatchAt) || 0;
      if (Date.now() - last > 3e4) {
        g.__aureliusWatchAt = Date.now();
        const live = await import("./kalshi-live.server");
        await Promise.race([
          live.watchAccount(readBook().trades),
          new Promise((resolve) => setTimeout(resolve, 4000)),
        ]);
      }
    } catch {
    }
    g.__aureliusBusy = false;
  }
}
// ONE BOOK (Love): Kalshi decides first. The paper book only takes a trade the Kalshi side would
// take under every live rule (1.38x, blocked setups, 25% channel, bands). Then Kalshi fires and
// paper records it. A trade Kalshi would refuse is logged as skipped, not taken on paper.
// Night book: every setup is shown to both paper ledgers before any live rule runs.
// LAST MINUTE BOOK (Love, Oct 3 ~6:10 PM PT): the last 5 minutes of a window, price on the right side of the strike,
// that side still paying 1.32x-1.5x. Taken only when her lines agree: right side of the session VWAP, not in the 25% of
// the channel closest to the line in front (session bands AND the 5m nav), and far enough past the strike that a normal
// move in the time left can't cross it (distance >= the 5m ATR scaled to the minutes left). Paper only.
async function lastMinuteLook(asset, id) {
  if (!asset || goldHalted(id)) return;
  const left = Number(asset.secondsLeft) || 0;
  if (!(left > 30 && left <= 300)) return;
  const m = asset.market;
  const target = asset.target ?? m?.target;
  const spot = Number(asset.spot) || 0;
  if (!m || target == null || !(spot > 0)) return;
  const side = spot >= target ? "up" : "down";
  const ask = Number(side === "up" ? m.yesAsk : m.noAsk) || 0;
  if (!(ask > 0)) return;
  const mult = 1 / ask;
  const dist = Math.abs(spot - target);
  const nb = await import("./nightbook");
  const mins = Math.max(1, Math.round(left / 60));
  const distTxt = id === "gold" ? `$${dist.toFixed(2)}` : `$${dist.toFixed(0)}`;
  // LOVE + GRANT'S RULE (Love, Oct 3 ~6:20 PM PT: "if bitcoin was over $110 from the target with three minutes or less...
  // gold was three dollars as long as a band wasn't nearby"). Same 1.32x floor. Gold: no line of hers (session bands or
  // nav) between the strike and price, or within $1.50 of price.
  try {
    if (left <= 180 && left > 20 && mult >= 1.32 && mult <= 2.5) {
      let ok = false;
      if (id === "btc") ok = dist >= 110;
      else if (id === "gold" && dist >= 3) {
        let lines = [];
        try {
          const g = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.gold || {};
          for (const k of ["vwap", "up1", "up2", "up3", "dn1", "dn2", "dn3"]) if (Number(g[k]) > 0) lines.push(Number(g[k]));
          for (const fr of ["m5", "m10", "m15", "m60"]) {
            const f = g?.nav?.[fr];
            if (f) for (const k of ["c", "up", "dn"]) if (Number(f[k]) > 0) lines.push(Number(f[k]));
          }
        } catch {
          lines = [];
        }
        const lo = Math.min(spot, target), hi = Math.max(spot, target);
        ok = lines.length > 0 && !lines.some((L) => (L > lo && L < hi) || Math.abs(L - spot) < 1.5);
      }
      if (ok) nb.lastConsider({ ticker: m.ticker, side, ask, label: `You + Grant · ${mins}m left · ${distTxt} past the strike` }, id, "lastgrant");
    }
  } catch {
  }
  if (mult < 1.32 || mult > 1.5) return;
  let atr = 0;
  try {
    atr = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.[id]?.nav?.atr5m) || 0;
  } catch {
  }
  if (!(atr > 0)) {
    const sp = asset.spark || [];
    const jumps = [];
    for (let i = 1; i < sp.length; i += 1) jumps.push(Math.abs(sp[i] - sp[i - 1]));
    atr = jumps.length ? jumps.slice(-14).reduce((a, b) => a + b, 0) / Math.min(14, jumps.length) : 0;
  }
  if (!(atr > 0) || dist < atr * Math.sqrt(left / 300)) return;
  if (!vwapAgrees(asset, side)) return;
  if (dnaNow(id, side, spot, target, "chan")) return;
  if (dnaNowFrame(id, side, spot, target, "m5")) return;
  nb.lastConsider({ ticker: m.ticker, side, ask, label: `Last minute · ${mins}m left · ${distTxt} past the strike` }, id, "lastmin");
}
async function nightLook(setup, asset, cross = false) {
  try {
    if (!setup || !setup.side || !setup.ticker) return;
    // HER DNA (dna.ts): no paper book is even shown a trade with a line right in front of it or a
    // line between price and the strike. ORIGINAL included.
    // TWO DNAs (Love, Oct 2 ~midnight): every book runs on her fix ("fixed", exactly as all day) AND as a
    // DNA x ATR twin ("atr", rows tagged, own toggle). A setup is booked once per DNA that clears it.
    const dnaSym = String(setup.asset || asset?.asset || "").toLowerCase();
    const dnaWhy = dnaNow(dnaSym, setup.side, asset?.spot || 0, asset?.target ?? 0, "fixed");
    const dnaAtr = dnaNow(dnaSym, setup.side, asset?.spot || 0, asset?.target ?? 0, "atr");
    // FEED TWIN (paper study, Love: "run them both side by side"): same setup, Vantage's lines too.
    if (dnaSym === "btc") void import("./twin").then((m) => m.twinLook({ ticker: setup.ticker, side: setup.side, ask: Number(setup.ask) || 0, label: setup.pattern?.label || "" }, asset?.spot || 0, asset?.target ?? 0, dnaWhy)).catch(() => {});
    if (dnaWhy) dnaLog(dnaSym, setup.side, setup.pattern?.label || "", setup.ticker, dnaWhy, "paper ledgers");
    // Oct 3 ~1:15 AM PT (Love: "I want it before the fix at 11:55 AM"): main books = exactly as before 11:55 (no DNA,
    // Grok's old band guard and every book rule as they were). Her 11:55 fix and DNA x ATR run as tagged twins.
    const live = await import("./kalshi-live.server");
    const guard = await import("./live-guard").catch(() => null);
    const nb = await import("./nightbook");
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    const sym = String(setup.asset || asset?.asset || "");
    const prep = (mode) => {
      const fill = researchFill(setup, asset, 10, mode);
      const ask = Number(fill?.ask || setup.ask) || 0;
      const refusal = !fill ? "band in the way" : live.wouldRefuse(setup.ticker, setup.side, {
        spot: asset?.spot || 0,
        vwap: frame?.vwap || 0,
        stdev: frame?.stdev || 0,
        target: asset?.target ?? 0,
        label: setup.pattern?.label || "",
        dnaMode: mode
      }, ask);
      // NEW · 24/7 (Love, Oct 8 ~6 PM PT): NEW's exact rules with her off-hours lifted.
      let refusal24 = "n/a";
      try {
        refusal24 = !fill ? "band in the way" : live.wouldRefuse(setup.ticker, setup.side, { spot: asset?.spot || 0, vwap: frame?.vwap || 0, stdev: frame?.stdev || 0, target: asset?.target ?? 0, label: setup.pattern?.label || "", dnaMode: mode, noHours: true }, ask);
      } catch {
        refusal24 = "n/a";
      }
      // CLAUDE ledger: her nav + path guards on Love's bands (no hour list; Claude's own hours apply).
      let claudeGuard = null;
      try {
        claudeGuard = !fill ? "band in the way" : guard ? (mode === "chan" ? null : guard.navSkip(sym, setup.side, asset?.spot || 0)) || guard.pathSkip(sym, setup.side, asset?.spot || 0, asset?.target ?? 0) : null;
      } catch {
        claudeGuard = null;
      }
      return { fill, refusal, refusal24, claudeGuard, c: { ticker: setup.ticker, side: setup.side, ask, label: setup.pattern?.label || "", navCross: cross, target: asset?.target ?? null } };
    };
    // Synchronous from here: set the mode, book, put it back. Nothing else can run in between.
    // 5M / 10M / 15M SOLE (Love, Oct 3): her channel rule on the session bands + one nav frame only.
    try {
      const sAsk = Number(setup.ask) || 0;
      for (const [fr, bk] of [["m5", "sole5"], ["m10", "sole10"], ["m15", "sole15"], ["m5", "sole5p"], ["m5", "sole5z"]]) {
        // 5M SOLE ZONE (Love, Oct 3 ~7 PM PT): SOLE5 plus her lined-up-lines rule (dna.ts dnaZone).
        if (bk === "sole5z" && dnaZone(dnaSym, setup.side, asset?.spot || 0, "m5")) continue;
        // (sole5v is judged below on Vantage's lines)
        if (!dnaNowFrame(dnaSym, setup.side, asset?.spot || 0, asset?.target ?? 0, fr)) nb.soleConsider({ ticker: setup.ticker, side: setup.side, ask: sAsk, label: setup.pattern?.label || "" }, dnaSym, bk);
      }
    } catch {
    }
    // 5M SOLE · VANTAGE (Love, Oct 3 ~7 PM PT: "have her operating on the vantage book for the next hour for kalshi,
    // pepperstone is having her get into things she wouldn't otherwise"): SOLE5's exact law (session bands + 5m nav, 25%
    // channel, no band between price and strike) judged on VANTAGE's lines and price. Gold has no Vantage twin, so gold
    // uses the desk's own lines.
    try {
      const sAsk = Number(setup.ask) || 0;
      let vWhy = null;
      if (dnaSym === "btc") {
        const tw = await import("./twin");
        const vb = await tw.twinBands();
        vWhy = vb ? dnaFrameCheck("btc", setup.side, Number(vb.spot) || asset?.spot || 0, asset?.target ?? 0, vb, "m5") : "VANTAGE: no fresh lines";
      } else {
        vWhy = dnaNowFrame(dnaSym, setup.side, asset?.spot || 0, asset?.target ?? 0, "m5");
      }
      if (!vWhy) nb.soleConsider({ ticker: setup.ticker, side: setup.side, ask: sAsk, label: (setup.pattern?.label || "") + " (Vantage lines)" }, dnaSym, "sole5v");
    } catch {
    }
    // Main = HER with Love's 25%-of-the-channel rule (Oct 3 ~1:30 AM PT) in place of $100 and the old $40 guard.
    if (!dnaNow(dnaSym, setup.side, asset?.spot || 0, asset?.target ?? 0, "chan")) {
      const p = prep("chan");
      nightConsider(p.c, Boolean(p.fill), p.refusal, p.claudeGuard, p.refusal24);
    }
    if (!dnaWhy) {
      const p = prep("fixed");
      nb.setBookTag("fix");
      try {
        nightConsider(p.c, Boolean(p.fill), p.refusal, p.claudeGuard, p.refusal24);
      } finally {
        nb.setBookTag("");
      }
    }
    if (!dnaAtr) {
      const p = prep("atr");
      nb.setDnaMode("atr");
      try {
        nightConsider(p.c, Boolean(p.fill), p.refusal, p.claudeGuard, p.refusal24);
      } finally {
        nb.setDnaMode("fixed");
      }
    }
  } catch {
  }
}
const kalshiFirstSeen = new Set();
async function kalshiFirst(paper, asset) {
  if (!paper) return paper;
  // FRESH PRICE + OPENING FLOOR for PAPER 24/7 (Oct 15 ~2:50 AM PT, Love: "include the price fix for paper as well so her
  // entries have the same poise"). Same rules as the pivot books (pivotbooks.ts, Oct 14 ~6:30 PM PT): no booking before
  // live-switch openFloorSec (30) s into a 15M window; the live-candle read (nav liveTick) must be younger than
  // spotMaxAgeSec (8) s and taken at least spotAfterOpenSec (5) s after the open; and the setup's own price must match
  // that read (BTC $15 / gold $0.50), or the setup was found on an old price. Holds -> data/paper-fresh-hold.jsonl.
  if (paper.asset === "btc" || paper.asset === "gold") {
    try {
      let floor = 30, maxAge = 8, afterOpen = 5;
      try { const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")); if (Number.isFinite(Number(sw?.openFloorSec))) floor = Number(sw.openFloorSec); if (Number.isFinite(Number(sw?.spotMaxAgeSec))) maxAge = Number(sw.spotMaxAgeSec); if (Number.isFinite(Number(sw?.spotAfterOpenSec))) afterOpen = Number(sw.spotAfterOpenSec); } catch {}
      const left = Number(asset?.secondsLeft) || 0;
      const in15 = left > 0 && left <= 900;
      const into = 900 - left;
      const { liveTick } = await import("./nav");
      const lt = liveTick(paper.asset);
      const age = lt ? (Date.now() - lt.at) / 1000 : Infinity;
      const openMs = Date.now() + left * 1000 - 900000;
      const tol = paper.asset === "btc" ? 15 : 0.5;
      const sp = Number(asset?.spot) || 0;
      let hold = null;
      // FAST RAILS FOR TOGETHER (Oct 18 ~9:50 AM PT, Love: "same together book, just the same speed"): live-switch togetherFast = PAPER 24/7 skips
      // the opening floor and the 8 s read rule when the fast books' rails hold: the live quote is under 1 s old, the feed is healthy, it came after
      // the window opened, and the setup's own price matches it (BTC $15 / gold $0.50). Same setups, same decisions.
      let fastOk = false;
      try {
        const swF = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
        if (swF?.togetherFast === true) {
          const { quoteTick, feedHealth } = await import("./quotes");
          const qf = quoteTick(paper.asset);
          const fhF = feedHealth(paper.asset);
          const freshMs = 3000; // GOLD MATCHES BTC (Oct 19 ~9:56 PM PT, Love: "her execution is still a tad slow on her gold entries... try to match the speed with btc" - gold's 1 s rule kept failing on TVC's slower ticks and she waited; was btc 3000 / gold 1000, Oct 18)
          fastOk = !!(qf && Date.now() - qf.at <= freshMs && fhF.ok && (!in15 || qf.at >= openMs + 1000) && !(sp > 0 && Math.abs(sp - qf.c) > tol));
          if (!fastOk) (globalThis as any).__fastWhy = !qf ? "no live quote" : Date.now() - qf.at > freshMs ? `quote ${((Date.now() - qf.at) / 1000).toFixed(1)} s old` : !fhF.ok ? `feed: ${fhF.why}` : in15 && qf.at < openMs + 1000 ? "quote from before the open" : `setup priced at ${sp}, live ${qf.c} (off ${Math.abs(sp - qf.c).toFixed(2)})`;
        }
      } catch {
      }
      if (fastOk) hold = null;
      else if (in15 && into < floor) hold = `opening floor: ${Math.round(into)}s into the window (waits until ${floor}s)${(globalThis as any).__fastWhy ? ` - fast rails not met: ${(globalThis as any).__fastWhy}` : ""}`;
      else if (!lt || age > maxAge) hold = `price read is ${Number.isFinite(age) ? age.toFixed(1) : "?"} s old (limit ${maxAge} s)`;
      else if (in15 && lt.at < openMs + afterOpen * 1000) hold = `price read taken ${((lt.at - openMs) / 1000).toFixed(1)} s after the open (needs ${afterOpen} s)`;
      else if (sp > 0 && Math.abs(sp - lt.c) > tol) hold = `setup priced at ${sp} but live is ${lt.c} (off by ${Math.abs(sp - lt.c).toFixed(2)})`;
      if (hold) {
        try {
          const G = globalThis;
          if (!(G.__freshHoldSeen instanceof Set)) G.__freshHoldSeen = new Set();
          const key = `${paper.ticker}:${paper.side}:${paper.patternLabel}:${hold.slice(0, 14)}`;
          if (!G.__freshHoldSeen.has(key)) { G.__freshHoldSeen.add(key); appendFileSync(join(process.cwd(), "data", "paper-fresh-hold.jsonl"), JSON.stringify({ at: new Date().toISOString(), asset: paper.asset, side: paper.side, ticker: paper.ticker, label: paper.patternLabel, hold }) + "\n"); }
        } catch {}
        return null;
      }
    } catch {}
  }
  // Oct 14 ~9:30 AM PT: the pivot check also sits here, so no path (late window, main, nav cross) can book a held gold trade.
  if (paper.asset === "gold" && (await pivotHold(asset, { asset: "gold", side: paper.side, ticker: paper.ticker, label: paper.patternLabel }))) return null;
  // Love's blocked symbols (live-switch "blockedAssets") never reach the paper book either.
  let offAsset = false;
  try {
    const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
    offAsset = Array.isArray(sw.blockedAssets) && sw.blockedAssets.includes(String(paper.asset));
  } catch {}
  if (!offAsset && paper.asset !== "btc" && paper.asset !== "gold") return paper;
  try {
    const live = await import("./kalshi-live.server");
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    const why = live.wouldRefuse(paper.ticker, paper.side, {
      spot: asset?.spot || 0,
      vwap: frame?.vwap || 0,
      stdev: frame?.stdev || 0,
      target: asset?.target ?? 0,
      label: paper.patternLabel || paper.pattern || "",
    }, Number(paper.ask) || 0);
    if (!why) return paper;
    const key = `${paper.ticker}:${paper.side}:${paper.patternLabel}`;
    if (!kalshiFirstSeen.has(key)) {
      kalshiFirstSeen.add(key);
      try { noteGuard({ venue: "paper", ticker: paper.ticker, side: paper.side, setup: paper.patternLabel || "", reason: `Paper skipped. Kalshi would refuse: ${why}.` }); } catch {}
    }
    return null;
  } catch {
    return paper;
  }
}
async function mirrorPaper(asset, paper) {
  // REMOVED (Claude, Oct 3 ~2:55 PM PT, Love: "get rid of the stuff grok left behind... change the locks"): a Grok-era
  // route that opened Kalshi positions on its own. It no longer runs. Only a named live book (BRICK / COTC) opens trades.
  return null;
  if (!paper || (paper.asset !== "btc" && paper.asset !== "gold")) return null;
  const market = asset?.market;
  if (!market || market.ticker !== paper.ticker) return null;
  if (!((asset.secondsLeft ?? 0) > 15)) return null;
  // Claude: never chase a paper trade late at different odds. Same trade, same moment, or no copy.
  const openedMs = Date.parse(paper.openedAt || paper.at || "");
  const skip = (reason) => {
    const g2 = globalThis;
    if (!(g2.__mirrorSkip instanceof Map)) g2.__mirrorSkip = new Map();
    const key = `${paper.ticker}:${paper.side}:${reason.slice(0, 24)}`;
    if (!g2.__mirrorSkip.has(key)) {
      g2.__mirrorSkip.set(key, Date.now());
      try { noteGuard({ venue: "kalshi", ticker: paper.ticker, side: paper.side, setup: paper.patternLabel || "", reason: `Copy skipped. ${reason}` }); } catch {}
    }
    return { status: "blocked", reason };
  };
  if (!Number.isFinite(openedMs) || Date.now() - openedMs > 90 * 1000) return skip("Paper entry is over 90 seconds old.");
  const paperAsk = Number(paper.ask);
  const liveAsk = paper.side === "up" ? Number(market.yesAsk) : Number(market.noAsk);
  if (paperAsk > 0 && liveAsk > 0) {
    const drift = (1 / liveAsk) / (1 / paperAsk);
    if (drift > 1.25 || drift < 0.8) return skip(`Price moved since the paper entry (${(1 / paperAsk).toFixed(2)}x to ${(1 / liveAsk).toFixed(2)}x).`);
  }
  let live;
  try {
    live = await import("./kalshi-live.server");
  } catch {
    return null;
  }
  const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
  let placed = null;
  try {
    placed = await live.enterLive(paper.side, paper.ticker, market.yesAsk ?? 0, market.noAsk ?? 0, 0, {
      paperBook: true,
      line: {
        spot: asset.spot || 0,
        vwap: frame?.vwap || 0,
        target: asset.target ?? 0,
        stdev: frame?.stdev || 0,
        label: paper.patternLabel || paper.pattern || "paper",
        paperBook: true,
        taken: true,
      },
      secondsLeft: asset.secondsLeft,
    });
  } catch (err) {
    placed = { status: "blocked", reason: err instanceof Error ? err.message.slice(0, 140) : "paper book failed" };
  }
  if (placed?.status !== "filled" && placed?.reason !== "already") {
    try {
      const file = join(process.cwd(), "data", "alarm.json");
      const prev = JSON.parse(readFileSync(file, "utf8"));
      const rows = Array.isArray(prev) ? prev : [];
      const text = `RED: Paper book ${paper.asset} ${paper.side} is not on Kalshi. ${placed?.reason || "Sending it again."}`;
      if (!rows.some((row) => row.text === text && Date.now() - Date.parse(row.at) < 60 * 1000)) {
        rows.unshift({ at: new Date().toISOString(), text });
        writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
      }
    } catch {
    }
  }
  return placed;
}
async function forkPaper(assets) {
  // REMOVED (Claude, Oct 3 ~2:55 PM PT, Love: "get rid of the stuff grok left behind... change the locks"): a Grok-era
  // route that opened Kalshi positions on its own. It no longer runs. Only a named live book (BRICK / COTC) opens trades.
  return null;
  const shout = (text) => {
    try {
      const file = join(process.cwd(), "data", "alarm.json");
      const prev = JSON.parse(readFileSync(file, "utf8"));
      const rows = Array.isArray(prev) ? prev : [];
      if (rows.some((row) => row.text === text && Date.now() - Date.parse(row.at) < 10 * 60 * 1000)) return;
      rows.unshift({ at: new Date().toISOString(), text });
      writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
    } catch {
    }
  };
  let live;
  try {
    live = await import("./kalshi-live.server");
    if (!live.kalshiArmed()) {
      shout("RED: The paper book cannot reach Kalshi.");
      return;
    }
  } catch {
    return;
  }
  const link = paperNeedsLink();
  let fills = [];
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), "data", "fill-log.json"), "utf8"));
    if (Array.isArray(parsed)) fills = parsed;
  } catch {
    fills = [];
  }
  const had = (row) => fills.some((item) => item.kind === "taken" && item.venue === "kalshi" && item.ticker === row.ticker && item.side === row.side);
  for (const row of [...link.missed, ...link.open]) {
    if (row?.id && had(row)) markOwnLive(row.id, "filled");
  }
  const missed = link.missed.filter((row) => row?.id && !had(row));
  const pending = link.open.filter((row) => row?.id && !had(row));
  const held = await live.heldFifteens().catch(() => []);
  const relinked = g.__paperRelink instanceof Set ? g.__paperRelink : new Set();
  g.__paperRelink = relinked;
  for (const row of missed) {
    if (!row?.id || relinked.has(row.id)) continue;
    relinked.add(row.id);
    const name = row.asset === "btc" ? "BTC" : "GOLD";
    if (held.some((item) => String(item.ticker).includes(name))) continue;
    if (row.ticker) live.releaseTicker(row.ticker);
    shout(`RED: Paper book ${row.asset} ${row.side} settled without Kalshi. The next one is relinked.`);
  }
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date());
  if (g.__paperHour !== hour) {
    g.__paperHour = hour;
    const ok = missed.length === 0;
    try {
      writeFileSync(join(process.cwd(), "data", "paper-link.json"), JSON.stringify({
        at: new Date().toISOString(),
        hour,
        ok,
        missed: missed.length,
        sending: pending.length,
      }, null, 2));
    } catch {
    }
    if (!ok) shout(`RED: The hour check found ${missed.length} paper book trade${missed.length === 1 ? "" : "s"} that never reached Kalshi.`);
  }
  for (const row of pending) {
    const asset = assets?.[row.asset];
    const market = asset?.market;
    const left = asset?.secondsLeft ?? 0;
    if (!market || market.ticker !== row.ticker || !(left > 15)) continue;
    if (held.some((item) => item.ticker === row.ticker)) {
      markOwnLive(row.id, "filled");
      continue;
    }
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    let placed = null;
    try {
      placed = await live.enterLive(row.side, row.ticker, market.yesAsk ?? 0, market.noAsk ?? 0, 0, {
        paperBook: true,
        line: {
          spot: asset.spot || 0,
          vwap: frame?.vwap || 0,
          target: asset.target ?? 0,
          stdev: frame?.stdev || 0,
          label: row.pattern,
          paperBook: true,
        },
        secondsLeft: left,
      });
    } catch (err) {
      placed = { status: "blocked", reason: err instanceof Error ? err.message.slice(0, 140) : "paper book failed" };
    }
    if (placed?.status === "filled" || placed?.reason === "already") {
      markOwnLive(row.id, "filled");
      continue;
    }
    shout(`RED: Paper book ${row.asset} ${row.side} is not on Kalshi. ${placed?.reason || "Sending it again."}`);
  }
  let events = [];
  try {
    events = readFillLog();
  } catch {
    events = [];
  }
  const banked = new Set(events.filter((event) => event.kind === "banked").map((event) => event.tradeId));
  for (const id of ["btc", "gold"]) {
    const asset = assets?.[id];
    const ticker = asset?.market?.ticker;
    if (!ticker || !((asset.secondsLeft ?? 0) > 15)) continue;
    const taken = events.find((event) => event.kind === "taken" && event.venue === "paper" && event.ticker === ticker && event.asset === id && !banked.has(event.tradeId));
    if (!taken) continue;
    if (held.some((item) => item.ticker === ticker)) continue;
    await mirrorPaper(asset, { asset: id, ticker, side: taken.side, patternLabel: taken.pattern, at: taken.at, ask: taken.ask });
  }
}
async function copyPaperBook(assets) {
  // REMOVED (Claude, Oct 3 ~2:55 PM PT, Love: "get rid of the stuff grok left behind... change the locks"): a Grok-era
  // route that opened Kalshi positions on its own. It no longer runs. Only a named live book (BRICK / COTC) opens trades.
  return null;
  return;
  const note = (row) => {
    try {
      const file = join(process.cwd(), "data", "copier.json");
      let prev = [];
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8"));
        if (Array.isArray(parsed)) prev = parsed;
      } catch {
        prev = [];
      }
      prev.unshift({ at: new Date().toISOString(), route: "paper", ...row });
      writeFileSync(file, JSON.stringify(prev.slice(0, 40), null, 2));
    } catch {
    }
  };
  const file = join(process.cwd(), "data", "paper-live.json");
  let arm = { on: false, dollars: 15, assets: ["btc", "gold"] };
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (parsed && typeof parsed === "object") arm = { ...arm, ...parsed };
  } catch {
    arm = { on: false, dollars: 15, assets: ["btc", "gold"] };
  }
  if (arm.on !== true) return;
  if (entriesOff()) {
    note({ status: "idle", reason: "entries off" });
    return;
  }
  let live;
  try {
    live = await import("./kalshi-live.server");
    if (!live.kalshiArmed()) return;
  } catch {
    return;
  }
  let held = [];
  try {
    held = await live.heldFifteens();
  } catch {
    note({ status: "idle", reason: "could not read positions" });
    return;
  }
  if (arm.ticker && held.some((row) => row.ticker === arm.ticker)) {
    note({ status: "hold", reason: "one order already out", ticker: arm.ticker, side: arm.side });
  } else if (arm.ticker) {
    arm = { ...arm, ticker: "", side: "" };
    try {
      writeFileSync(file, JSON.stringify(arm));
    } catch {
    }
  }
  const shape = (label) => {
    const text = String(label || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
    return /^tap-reject at /i.test(text) || /^close above /i.test(text) || /^close below /i.test(text) || /^open /i.test(text);
  };
  const trades = readBook().trades;
  const paper = trades.filter((t) => t && t.source !== "live" && t.venue !== "polymarket" && !t.probe && (t.asset === "btc" || t.asset === "gold"));
  const open = paper.filter((t) => t.result === "open" && shape(t.patternLabel));
  const ready = [];
  for (const row of open) {
    const sides = new Set(paper.filter((t) => t.ticker === row.ticker).map((t) => t.side));
    if (sides.size !== 1) continue;
    const asset = assets?.[row.asset];
    const market = asset?.market;
    if (!market || market.ticker !== row.ticker || !((asset.secondsLeft ?? 0) > 45)) continue;
    if (held.some((item) => item.ticker === row.ticker || (row.asset === "btc" && item.ticker.includes("BTC")) || (row.asset === "gold" && item.ticker.includes("GOLD")))) continue;
    ready.push(row);
  }
  ready.sort((a, b) => String(b.openedAt || "").localeCompare(String(a.openedAt || "")));
  const own = listOwnPaper().find((item) => {
    if (item.result !== "open" || !item.ticker || (item.asset !== "btc" && item.asset !== "gold")) return false;
    const asset = assets?.[item.asset];
    return asset?.market?.ticker === item.ticker && (asset.secondsLeft ?? 0) > 45;
  });
  const row = own
    ? { asset: own.asset, side: own.side, ticker: own.ticker, patternLabel: own.pattern, ownBook: true }
    : ready[0];
  if (!row) return;
  const asset = assets?.[row.asset];
  const market = asset?.market;
  const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
  let placed = null;
  try {
    placed = await live.enterLive(row.side, row.ticker, market?.yesAsk ?? 0, market?.noAsk ?? 0, 15, {
      paperCopy: true,
      line: {
        spot: asset?.spot || 0,
        vwap: frame?.vwap || 0,
        target: asset?.target ?? 0,
        stdev: frame?.stdev || 0,
        label: row.patternLabel,
        paperCopy: true,
        ownBook: Boolean(row.ownBook),
      },
      secondsLeft: asset?.secondsLeft,
    });
  } catch (err) {
    placed = { status: "blocked", reason: err instanceof Error ? err.message.slice(0, 140) : "paper copy failed" };
  }
  const status = placed?.status || "blocked";
  note({ status, asset: row.asset, side: row.side, pattern: row.patternLabel, ticker: row.ticker, reason: placed?.reason || "", dollars: 15 });
  if (status !== "filled") {
    if (placed?.reason === "already") {
      const next = { ...arm, on: true, dollars: 15, assets: ["btc", "gold"], ticker: row.ticker, side: row.side, at: new Date().toISOString(), pattern: row.patternLabel };
      try {
        writeFileSync(file, JSON.stringify(next));
      } catch {
      }
    }
    return;
  }
  const next = { ...arm, on: true, dollars: 15, assets: ["btc", "gold"], ticker: row.ticker, side: row.side, at: new Date().toISOString(), pattern: row.patternLabel };
  try {
    writeFileSync(file, JSON.stringify(next));
  } catch {
  }
  noteCombo({
    id: `${row.ticker}:${row.side}:paper`,
    at: row.openedAt || new Date().toISOString(),
    asset: row.asset,
    side: row.side,
    pattern: row.patternLabel,
    ticker: row.ticker,
    route: "paper",
    dollars: 15,
  });
}
function noteCombo(row) {
  try {
    const file = join(process.cwd(), "data", "combo-ledger.json");
    let prev = [];
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      if (Array.isArray(parsed)) prev = parsed;
    } catch {
      prev = [];
    }
    if (prev.some((item) => item.id === row.id)) return;
    prev.unshift(row);
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(file, JSON.stringify(prev.slice(0, 80), null, 2));
  } catch {
  }
}
const gLiveCopy = globalThis;
async function copyLiveBookSafe(assets) {
  // ONE LANE PER ASSET (Oct 20 ~6:51 PM PT, Love: "proper but still a tad delayed... diagnose and clean up whatever you can"): the copier ran
  // BTC and gold through one queue, and an entry's IOC knocks (up to ~15 s) held the other asset's brand-new call in line - 6:45 PM gold knocked
  // 10-22 s while BTC's call waited until :25. Each asset now has its own lane; same rows, same gates, same prices, only no waiting on the other.
  await Promise.all(["btc", "gold", "other"].map((ln) => copyLaneSafe(assets, ln)));
}
async function copyLaneSafe(assets, ln) {
  // STUCK-LANE BREAKER (Oct 20 ~7:17 PM PT): a run caught in a hot reload hung with its lane marked busy and the copier went silent for 13 minutes.
  // busy holds when the run started; a lane busy for over 90 s is treated as free.
  const busy = gLiveCopy.__laneBusyAt || (gLiveCopy.__laneBusyAt = {});
  const again = gLiveCopy.__laneAgain || (gLiveCopy.__laneAgain = {});
  // STUCK LANE ON THE RECORD (Oct 21 ~3:27 PM PT, Love okayed the gold-lane logging): when a lane is freed after 90 s busy, write where it was stuck.
  if (busy[ln] && Date.now() - busy[ln] >= 90000) { try { appendFileSync(join(process.cwd(), "data", "copy-errors.jsonl"), JSON.stringify({ at: new Date().toISOString(), lane: ln, stuckFor: Date.now() - busy[ln], stage: (gLiveCopy.__stage || {})[ln] || null }) + "\n"); } catch {} }
  if (busy[ln] && Date.now() - busy[ln] < 90000) {
    again[ln] = true; // a trade landed mid-run: go again the moment this run ends
    return;
  }
  const mine = Date.now();
  busy[ln] = mine;
  try {
    await copyLiveBook(assets, ln);
  } catch (err) {
    // A LANE THAT THROWS SAYS WHY (Oct 21 ~3:20 PM PT, Love okayed the log): 3:15 PM gold's short never reached Kalshi and nothing was written down.
    try { appendFileSync(join(process.cwd(), "data", "copy-errors.jsonl"), JSON.stringify({ at: new Date().toISOString(), lane: ln, err: String((err as any)?.stack || err).slice(0, 900) }) + "\n"); } catch {}
  } finally {
    if (busy[ln] === mine) busy[ln] = 0;
  }
  if (again[ln]) {
    again[ln] = false;
    void copyLaneSafe(gLiveCopy.__lastAssets || assets, ln);
  }
}
function copyLaneOf(t) { return /^KXBTC/.test(String(t)) ? "btc" : /^KXGOLD/.test(String(t)) ? "gold" : "other"; }
// DIRECT WIRE: BRICK / COTC fire to Kalshi in the same instant the paper book books them (nightbook.ts live hook).
setLiveHook(() => {
  if (gLiveCopy.__lastAssets) void copyLiveBookSafe(gLiveCopy.__lastAssets);
});
// LIVE BOOK (Claude, Oct 3 ~1:45 PM PT, Love: "let's run BRICK on kalshi for the time being... @ $22 position sizes").
// Every new open row of the book named in live-switch "liveBook" (her main paper book, not a twin) is sent to Kalshi
// once, in its own window, at liveBook.dollars. The wire guard still needs the live switch ON and caps size.
async function copyLiveBook(assets, lane = "") {
  const runStart = Date.now();
  // SLIDE UNDER PINK - sampler (fix371/403 gold, fix423 BTC, Love Oct 28 2026 7:18 PM PT card "Put the downslope pink wall back, and on which books?" -> "Main + rejection, gold AND BTC"; Love 7:17 PM: "you see price on a downslope ?????  you see prices rejecting off of pink a hundred times ????? this was in the checkpoint."): every 5 s keep price + the 5m pink (data/pivot-now.json) for the last 30 min, per asset.
  try { for (const [sa, key] of [["gold", "__slide371"], ["btc", "__slide423b"]] as [string, string][]) { const GS = ((globalThis as any)[key] ||= { s: [] as { t: number; p: number; pp: number }[], at: 0 }); if (Date.now() - GS.at >= 5000) { GS.at = Date.now(); const pv = JSON.parse(readFileSync(join(process.cwd(), "data", "pivot-now.json"), "utf8")); const pp = Number(pv?.[sa]?.["5m"]?.pp) || 0, p = Number(quoteTick(sa)?.c) || 0; if (pp > 0 && p > 0) GS.s.push({ t: Date.now(), p, pp }); GS.s = GS.s.filter((x: any) => Date.now() - x.t <= 1800000); } } } catch {}
  let cfg = null;
  try {
    cfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).liveBook || null;
  } catch {
    cfg = null;
  }
  const books = cfg ? (Array.isArray(cfg.books) ? cfg.books : cfg.book ? [cfg.book] : []) : [];
  if (!books.length || !(Number(cfg.dollars) > 0) || entriesOff()) return;
  let live;
  try {
    live = await import("./kalshi-live.server");
    if (!live.kalshiArmed()) return;
  } catch {
    return;
  }
  const doneFile = join(process.cwd(), "data", "live-book-done.json");
  let done = {};
  try {
    // ONE PARSE PER CHANGE (Oct 20 ~11:40 PM PT, Love: "need you to fix her execution speed again ... ensure that the execution speed is on par under all
    // scenarios"): this 2.2 MB file was parsed on every copier run (~45 times every 10 s per the slow-ops log), holding the event loop her entries run on.
    // Now it is parsed only when it changes on disk; each run works on its own shallow copy (records are only ever replaced whole, never edited in place).
    done = { ...doneDocCached() };
  } catch {
    // HALF-WRITTEN FILE (Oct 9 ~10:08 PM PT): the copier caught this file mid-write, read it as empty and wrote back a
    // 21-line file over 3,145 records (Claude restored it). An unreadable file now skips the tick instead of starting
    // from nothing; it only starts empty when the file truly does not exist.
    if (existsSync(doneFile)) return;
    done = {};
  }
  const doneAtStart = { ...done };
  let rows = [];
  try {
    const nb = await import("./nightbook");
    // FAILSAFE (Love, Oct 3 ~2:08 PM PT: "set up a failsafe so the orders go thru 1:1 and they can't get skipped"):
    // a row is finished only when it FILLED (or we already hold it). Anything else is retried every tick while the
    // window is open; only "you hold the other side" stops it, and a miss is written down loudly.
    const finished = (d) => d && (d.status === "filled" || d.reason === "already" || d.final === true);
    // Settled rows stay in view until they are filled or written down as a miss (a window that closed before the copy
    // filled settles the paper row, and the miss used to vanish with it).
    // Only 15-minute windows go to Kalshi here (Oct 5: the BTC HOURLY card's RUN would otherwise raise false REDs; its
    // signals ride the Polymarket 1H book instead, polyhour.ts followRun).
    // OG / PIVOT lanes can go live too (Love, Oct 11 ~5:15 AM PT: "drop her on kalshi for the rest of the hour... just that one",
    // PIVOT 5M). Their paper rows (grok-og.json, shaped like night rows) join the list; only books on RUN are copied.
    let extraRows: typeof rows = [];
    try {
      extraRows = (await import("./grokog")).asNightRows() as typeof rows;
    } catch {
      extraRows = [];
    }
    // (Oct 19 ~2:01 PM PT, Love: "when she takes one let kalshi take one"): every session + pink trade goes to Kalshi now - the pink-only filter is gone.
    rows = [...nb.listNight(), ...extraRows].filter((r) => books.includes(r.book) && /15M-/.test(String(r.ticker)) && !r.dnaMode && !r.stale && (!lane || copyLaneOf(r.ticker) === lane) && !finished(done[r.id]) && Date.parse(r.at) >= Math.max(Date.parse(cfg.since || 0), Date.now() - 3 * 3600 * 1000));
    // FRESH SIGNALS FIRST (Oct 15 ~6:35 PM PT, Love: "work on the fast rails for the pivot break books so they're ready
    // for the next window pls"). The pass works rows in list order with awaited gate checks, so a BRAND-NEW signal used
    // to stand in line behind every retrying straggler: brk10's 9:30 entry fired on paper at 01:15:37 and reached
    // Kalshi at 01:16:43 (66 s in the queue) while OGP5's copy the same hour left in 295 ms on a short queue. Rows that
    // have never been attempted (no live-book-done entry yet) now go to the FRONT of every pass, newest first; the
    // retrying stragglers grind on behind them. Ordering only - every gate and rule runs unchanged.
    rows.sort((a, b) => ((done[a.id] ? 1 : 0) - (done[b.id] ? 1 : 0)) || (String(a.at) < String(b.at) ? 1 : -1));
  } catch {
    rows = [];
  }
  // PARKED ORDERS (Love, Oct 6 ~7:30 AM PT, "yess to both"): a resting live-book buy at paper's price used to sit until
  // 20 s before the bell even after paper took profit, so a snap-back could fill it on a trade turning against her.
  //  - paper closed the trade -> the parked order comes off (whatever filled before that stays, and is the book's);
  //  - the parked order filled -> written down as filled, so the book's exits own it.
  try {
    const parked = Object.entries(done).filter(([, d]) => d && d.status === "resting" && d.orderId && !d.parkedDone && (!lane || copyLaneOf(d.ticker) === lane));
    if (parked.length) {
      const nb = await import("./nightbook");
      // Grok / pivot / PAPER-twin rows live in grok-og.json, not the night book: without them every parked copy read as
      // "paper closed it" two seconds after it parked (Oct 11, 7:15 AM PT window: PAP247's 70c short pulled while paper held).
      let extraParked: any[] = [];
      try { extraParked = (await import("./grokog")).asNightRows(); } catch { extraParked = []; }
      const byId = new Map([...nb.listNight(), ...extraParked].map((r: any) => [r.id, r]));
      const held = await live.heldFifteens().catch(() => []);
      for (const [id, d] of parked) {
        const r = byId.get(id);
        const h = held.find((x) => x.ticker === d.ticker);
        const mine = h && (d.side === "up" ? h.pos > 0 : h.pos < 0);
        const closed = !r || r.result !== "open";
        const windowOver = ![assets?.btc?.market?.ticker, assets?.gold?.market?.ticker, assets?.silver?.market?.ticker].includes(d.ticker);
        if (closed && !windowOver) {
          await live.cancelLiveOrder(d.orderId, d.ticker).catch(() => {});
          done[id] = { ...d, at: new Date().toISOString(), parkedDone: true, status: mine ? "filled" : "skipped", reason: mine ? `parked order filled ${Math.abs(h.pos)}; rest cancelled when paper closed it (${r?.exit || r?.result || "closed"})` : `paper closed it (${r?.exit || r?.result || "closed"}); the parked ${Math.round((Number(d.paid) || 0) * 100)}c order came off` };
        } else if (mine && d.status === "resting") {
          done[id] = { ...d, at: new Date().toISOString(), status: "filled", reason: `parked order filled ${Math.abs(h.pos)}` };
        } else if (!windowOver && !mine && /^KX(GOLD|BTC)/.test(String((d as any).ticker))) {
          const dd: any = d;
          // RESTING ORDERS FACE THE GATE TOO (Oct 18 ~2:31 PM PT, Love: "make sure there are no other holes"): a parked entry was judged only when it
          // was placed and could fill minutes later after price moved. Every pass it is judged again; if her band rule now refuses it, the unfilled
          // order comes off. A "can't verify" blip never pulls it - only a real rule refusal.
          try {
            const bk = String(id).split(":")[1] || "";
            const bl = (await import("./bandlock")).bandLockCheck(bk, String(dd.ticker).includes("GOLD") ? "gold" : "btc", dd.side, String(dd.ticker));
            if (!bl.ok && !/can't verify|not healthy|self-test|no band feed/.test(bl.reason)) {
              await live.cancelLiveOrder(dd.orderId, dd.ticker).catch(() => {});
              (done as any)[id] = { ...dd, at: new Date().toISOString(), parkedDone: true, status: "skipped", final: true, reason: `resting order pulled before it filled: ${bl.reason}` };
            }
          } catch {}
        } else if (windowOver) {
          done[id] = { ...d, parkedDone: true };
        }
      }
    }
  } catch {
  }
  const seenQ = new Set(rows.map((r) => r.id));
  for (let qi = 0; qi < rows.length; qi += 1) {
    // MID-PASS PICKUP (Oct 15 ~8:20 PM PT, Love: "i'm definitely still seeing the copier lag... you have my green to
    // fix it - so long as kalshi fires from the fast twin book as quickly as she has been doing on gold"). A pass can
    // run long while orders are in flight, and a signal born DURING it used to wait out the whole pass (the 22-26 s
    // copies this hour). Now every step of the pass pulls any brand-new, never-attempted row to the front of what's
    // left - the same gates and the same order path run for it, just without the wait. Scheduling only; selection,
    // pricing, sizing and exits untouched.
    try {
      const nbQ = await import("./nightbook");
      const ogQ = await import("./grokog");
      const freshQ = [...nbQ.listNight(), ...(ogQ.asNightRows() as typeof rows)].filter((r) => books.includes(r.book) && /15M-/.test(String(r.ticker)) && !r.dnaMode && !r.stale && (!lane || copyLaneOf(r.ticker) === lane) && !seenQ.has(r.id) && !done[r.id] && Date.parse(r.at) >= Date.now() - 10 * 60 * 1000);
      for (const fr of freshQ) { seenQ.add(fr.id); rows.splice(qi, 0, fr); }
    } catch {
    }
    const row = rows[qi];
    try { (gLiveCopy.__stage ||= {})[lane || "all"] = { id: row.id, step: "start", at: new Date().toISOString() }; } catch {}
    const asset = assets?.[row.asset];
    const market = asset?.market;
    const left = asset?.secondsLeft ?? 0;
    // Paper already sold it inside the window and the copy never filled: nothing left to copy. Write it down, no alarm.
    if (row.result !== "open" && market?.ticker === row.ticker && left > 30) {
      done[row.id] = { ...(done[row.id] || {}), at: new Date().toISOString(), status: "skipped", final: true, reason: `paper closed it (${row.exit || row.result}) before the copy filled` };
      continue;
    }
    if (!market || market.ticker !== row.ticker || !(left > 30)) {
      const prev = done[row.id];
      // WINDOW-END FIX (Love, Oct 12 ~3:20 PM PT: her 3:15 gold long was written off 31 s in with 14 min left, right after
      // gold's 2-3 PM break). A read that is blank or still on the previous window is not the bell: while the row's own
      // window has more than 30 s left by its ticker's clock, keep trying on the next run instead of giving up.
      {
        const mm = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(String(row.ticker));
        const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const endMs = mm ? Date.UTC(2000 + Number(mm[1]), MON.indexOf(mm[2]), Number(mm[3]), Number(mm[4]) + 4, Number(mm[5])) : 0;
        if (endMs && Date.now() < endMs - 30000 && !(market && market.ticker === row.ticker)) {
          // WHY IT WAITED (Oct 21 ~3:25 PM PT, Love okayed the gold-lane logging): 3:15 PM gold's short sat here unsent with no record - the desk's market
          // read for the asset was blank or on another window. Written once per row per minute to data/copy-waits.jsonl.
          try { const cw = (gLiveCopy.__cwSeen ||= {}); const kk = row.id + ":" + Math.floor(Date.now() / 60000); if (!cw[kk]) { cw[kk] = 1; appendFileSync(join(process.cwd(), "data", "copy-waits.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: row.id, asset: row.asset, market: market ? market.ticker : null, left, haveAsset: Boolean(asset) }) + "\n"); } } catch {}
          continue;
        }
      }
      // WAITED ON A BAND (Oct 8): the trade sat behind a band that never broke before the window closed. That is the rule
      // doing its job: written down quietly, no RED.
      if (prev?.bandWait && prev?.status === "skipped") {
        // FEED BLIP IS NOT THE BELL (Love, Oct 9 ~10:08 PM PT: BRICK's 10:00 short "multiple was high enough i was watching").
        // At 10:07:31 the BTC feed flickered, the market read came back empty for a tick, and this ended her band wait with
        // 7.5 minutes still on the clock. Now only a real window change (a newer ticker live, or under 30 s left on hers)
        // ends the wait; a missing read just skips this tick and the wait carries on.
        if (!market || (market.ticker === row.ticker && (asset?.secondsLeft == null || left > 30))) continue;
        done[row.id] = { ...prev, at: new Date().toISOString(), final: true, reason: `band never broke before the window closed (last: ${prev.reason})` };
        continue;
      }
            // FILL FIX: a partial that never topped up still IS on Kalshi (smaller): written down, no RED.
      if (prev?.status === "partial") {
        done[row.id] = { ...prev, at: new Date().toISOString(), final: true, reason: `${prev.reason || "partial"} (window ended)` };
        continue;
      }
      done[row.id] = { ...(prev || {}), at: new Date().toISOString(), status: "missed", final: true, reason: `window ended before it filled${prev?.reason ? ` (last: ${prev.reason})` : ""}` };
      try {
        appendFileSync(join(process.cwd(), "data", "live-book-misses.jsonl"), JSON.stringify({ id: row.id, ...done[row.id] }) + "\n");
      } catch {
      }
      // END-OF-WINDOW CHECK (Love, Oct 3: "have the check be at the end of every 15 minute window"): a miss raises a RED
      // alarm on her desk the moment the window closes, with the first reason, so it can be fixed before the next one.
      try {
        const file = join(process.cwd(), "data", "alarm.json");
        let rows = [];
        try {
          const prevA = JSON.parse(readFileSync(file, "utf8"));
          if (Array.isArray(prevA)) rows = prevA;
        } catch {
        }
        const when = new Date(row.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
        // Covered = another live book already holds this window (prev = the last try, before this miss overwrote it). Oct 4 fix:
        // this used to read the overwritten reason, so every covered window raised a false RED.
        const covered = prev?.reason === "this window already traded" || prev?.firstReason === "this window already traded" || /by hand|your hand trade/.test(String(prev?.reason || ""));
        if (!covered) {
          rows.unshift({ at: new Date().toISOString(), text: `RED: ${String(row.book).toUpperCase()} ${row.side === "up" ? "long" : "short"} at ${when} never reached Kalshi. First reason: ${prev?.firstReason || prev?.reason || "no try was made"}.` });
          writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
        }
      } catch {
      }
      continue;
    }
    // PAPER FIRES (Oct 15, Love: "i don't want to hear another thing about it / if she enters in on the fast twin that
    // is running on paper, she enters / she is treating broken bands as a wall they're not working"): books in live-switch
    // paperFires skip the door's entry-quality gates - band-at-target / nav front / session gap (goldGateExempt), the nav
    // WALL below, and the backwards refusal (her direction laws live in the paper brain now: side-flip, falling-away, body
    // rule). Her hand-window law, one-position-per-window after a FILL, sizing and the risk guards all still stand.
    const pf = (() => { try { const v = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.paperFires; return Array.isArray(v) && v.includes(row.book); } catch { return false; } })();
    // RISK GUARD (Love, Oct 6 ~12:20 PM PT: "time to get serious"): daily stop at -$200 on the live books' Kalshi P&L for the
    // day, and a per-book breaker (3 live losses in a row = 2 hours out). riskguard.ts. A partial already on keeps what filled.
    try {
      const rg = await import("./riskguard");
      let why = rg.riskBlock(row.book);
      // DAILY-STOP PASS (Love, Oct 8 ~6:15 PM PT: "if she's benched for the day we can remove it for the hour. i want to see
      // how the new entries are first"): a book listed in live-switch riskExempt.books may keep trading through the DAILY
      // STOP (never the breaker) until riskExempt.until. Set for NEW · 24/7's first live hour only.
      try {
        const rx = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.riskExempt;
        if (why && /^daily stop/.test(why) && Array.isArray(rx?.books) && rx.books.includes(row.book) && Date.now() < Date.parse(rx?.until || 0)) why = null;
      } catch {
      }
      if (why) {
        done[row.id] = done[row.id]?.status === "partial" ? { ...done[row.id], at: new Date().toISOString(), final: true, reason: `${why} (kept what filled)` } : { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: why };
        continue;
      }
    } catch {
    }
    // SHIFTS (Love, Oct 9 ~4:45 PM PT: "can you give refined precedence when it's on her hours? i want refined to trade when
    // she's on her hours, just refined. after midnight brick can take over"). live-switch "shifts":
    //   day   { from, to, lead, leadOff: { btc: [h...], gold: [h...] } }: in the lead's own hours ONLY the lead goes live;
    //         in its off hours the other books on RUN may trade.
    //   night { from, to, lead }: ONLY the night lead goes live.
    //   nightOnly: books that never trade live outside the night window.
    // Pacific hours. Paper keeps booking everything.
    try {
      const sh = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.shifts;
      if (sh?.on && done[row.id]?.status !== "partial") {
        const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
        const inWin = (w) => w && h >= Number(w.from) && h < Number(w.to);
        const a = String(row.asset).toLowerCase();
        let why = null;
        // HOUR MAP per asset (Love, Oct 9 ~5:30 PM PT, gold: "i do want brick on her strong hours during the day too"):
        // shifts.hourLead.gold = { "<PT hour>": book | null }. A mapped hour = only that book trades that asset live;
        // null = nobody. It replaces the day/night rules for that asset (hours not in the map fall back to them).
        const hmap = sh.hourLead?.[a];
        const hk = String(h);
        if (hmap && Object.prototype.hasOwnProperty.call(hmap, hk)) {
          const hl = hmap[hk];
          if (!hl) why = `${a.toUpperCase()} hour map: nobody trades ${a} live at ${((h) => `${(Number(h) % 12) || 12} ${Number(h) < 12 ? "AM" : "PM"}`)(h)} PT (every book loses this hour)`;
          else if (row.book !== hl) why = `${a.toUpperCase()} hour map: ${String(hl).toUpperCase()}'s hour (${((h) => `${(Number(h) % 12) || 12} ${Number(h) < 12 ? "AM" : "PM"}`)(h)} PT)`;
        } else if (inWin(sh.night)) {
          // Oct 9 ~5:20 PM PT (Love): the night lead can be per asset, { btc: "bank5px", gold: "brick" }.
          const nl = typeof sh.night.lead === "string" ? sh.night.lead : sh.night.lead?.[a];
          if (row.book !== nl) why = `night shift: only ${String(nl || "nobody").toUpperCase()} trades ${a.toUpperCase()} live ${sh.night.from}-${sh.night.to} PT`;
        } else {
          if (Array.isArray(sh.nightOnly) && sh.nightOnly.includes(row.book)) why = `${String(row.book).toUpperCase()} only trades the night shift`;
          else if (inWin(sh.day)) {
            const off = Array.isArray(sh.day.leadOff?.[a]) ? sh.day.leadOff[a].map(Number) : [];
            const leadOn = !off.includes(h);
            if (leadOn && row.book !== sh.day.lead) why = `${String(sh.day.lead).toUpperCase()}'s hour: only ${String(sh.day.lead).toUpperCase()} trades live`;
          }
        }
        // BOOK ASSETS (Love, Oct 9 ~8:50 PM PT: DIAMOND on gold, "keep both models on hand so we can switch"). DIAMOND is green on
        // gold in both halves of the week and red on BTC in both, so shifts.bookAssets { diamond: ["gold"] } keeps a book off
        // the assets it loses on, even in hours the day/night rules would open to the rest of RUN.
        // ANY HOUR, BANDS STILL APPLY (Love, Oct 9 ~9:40 PM PT, "both yes"): COTC's BTC trades that were clear of the bands
        // went 9/9 (+$83 at live pricing, Oct 5-9) and 6 of the 9 fell in hours the shifts gave to someone else. Books in
        // shifts.anyHour[asset] skip the shift rules for that asset; the band check further down still holds them.
        // BACKUP BOOK (Love, Oct 10 ~10:45 PM PT: "if brick isn't in a position and squeeze tries at the same time she can
        // get it thru on squeeze... if it's one of her good hours we shouldn't bench her"). shifts.backup[asset]["<hour>"] =
        // [books]: in that mapped hour a backup book may go live too. The one-trade-per-window lock still holds, so whichever
        // of them reaches Kalshi first owns the window and the other is told "this window already traded". Only hours where
        // the backup was green in both halves of the week are listed.
        const bkp = sh.backup?.[a]?.[hk];
        if (why && hmap && Object.prototype.hasOwnProperty.call(hmap, hk) && hmap[hk] && (Array.isArray(bkp) ? bkp.includes(row.book) : bkp === row.book)) why = null;
        const anyH = sh.anyHour?.[a];
        if (why && Array.isArray(anyH) && anyH.includes(row.book)) why = null;
        const bas = sh.bookAssets?.[row.book];
        // GOLD SHORTS COME BACK (Oct 15, Love: "i saw that she shorted gold at the band for a 3x tho ✨ i definitely want
        // her to take shorts like that on kalshi"): shifts.bookAssetSides[book][asset] = ["down"] lets one side through an
        // asset the book is otherwise off of - gold shorts live, gold longs stay hers by hand. Hand-window law unchanged.
        const basSide = sh.bookAssetSides?.[row.book]?.[a];
        if (!why && Array.isArray(bas) && !bas.map((x) => String(x).toLowerCase()).includes(a) && !(Array.isArray(basSide) && basSide.includes(row.side))) why = `${String(row.book).toUpperCase()} trades ${bas.join(" / ").toUpperCase()} only (live)`;
        if (why) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: why };
          continue;
        }
      }
    } catch {
    }
    // NEW · 24/7 FILLS NEW'S OFF-HOURS (Love, Oct 8 ~6:10 PM PT: "can we leave that book running for today when NEW's off
    // hours hit? i want to watch the entries"). On RUN, new24 only goes to Kalshi in the hours NEW sits out (her skipHours
    // for that asset) and only until live-switch new24Live.until; in NEW's own hours NEW takes those trades itself.
    if (row.book === "new24" && done[row.id]?.status !== "partial") {
      try {
        const lg = await import("./live-guard");
        const sw24 = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.new24Live;
        // Oct 9 ~1:50 AM PT (Love: "i have new 24/7 on and its not in on the gold short... can we stop this from happening?"):
        // NEW 24/7 now copies around the clock while she is on RUN. NEW was benched by the breaker, so deferring to NEW in NEW's
        // hours meant neither went in. The one-trade-per-window guard still stops both taking the same window.
        void lg;
        const off = true;
        const inTime = Date.now() < Date.parse(sw24?.until || 0);
        if (!off || !inTime) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: !inTime ? "NEW · 24/7's live run has ended (paper keeps going)" : "NEW's own hours: NEW takes these on Kalshi" };
          continue;
        }
      } catch {
        continue;
      }
    }
    // THE TWIN'S 30 SECONDS ON KALSHI (fix355, Oct 27 2026 6:31 PM PT, Love: "she just entered into the window in the first 30 seconds on btc again , can you make sure she gets the 30 seconds on the delayed entry model?"):
    // no live Kalshi order for the DELAYED twin before the window is 30 s old - her call waits (no record written) and is tried again after, meeting every wall then. Paper rows and Polymarket unchanged.
    if (String(row.book) === "recon-dly" && Date.now() % 900000 < 30000 && done[row.id]?.status !== "partial") continue;
    if (String(row.book) === "recon-dly" && done[row.id]?.status !== "partial") { const t2 = (globalThis as any).__twinTouch2?.[String(row.ticker)]; if (!t2 || t2.side !== row.side) continue; } // fix356 (Oct 27 2026 6:47 PM PT, Love: "its supposed to be the second band price touches after the initial move still hun , not just 30 seconds ... the first band price originated at in the window is null - the second band price comes into contact with is the trade she takes"): the twin goes live on Kalshi only at the second band touched after the initial move, on that touch's side; her call waits until then
    // SLIDE UNDER PINK (fix371/fix403 gold, back after the checkpoint restore + BTC added as fix423, Love Oct 28 2026 7:18 PM PT card "Put the downslope pink wall back, and on which books?" -> "Main + rejection, gold AND BTC"; Love 7:17 PM: "you see price on a downslope ?????  you see prices rejecting off of pink a hundred times ????? this was in the checkpoint."):
    // MAIN and REJECTION MODEL only, LONGS, Kalshi only - while price slides under an unbroken pink (gold more than $2 / BTC more than $40 lower than 30 min ago),
    // no long until price breaks up through pink (gold 25c, BTC $8). Shorts, the copy, the twin, the 5M and Polymarket untouched. Needs 20 min of samples after a restart.
    if (row.side === "up" && (row.asset === "gold" || row.asset === "btc") && ["recon-rej", "recon-tog"].includes(String(row.book)) && done[row.id]?.status !== "partial") { let hold423 = ""; try { hold423 = row.asset === "gold" ? slideHold403(((globalThis as any).__slide371?.s || []) as { t: number; p: number; pp: number }[], ((globalThis as any).__slide403 ||= { on: false }), Date.now()) : slideHoldBtc423(((globalThis as any).__slide423b?.s || []) as { t: number; p: number; pp: number }[], ((globalThis as any).__slide423bS ||= { on: false }), Date.now()); } catch {}
      if (hold423) { try { const GL = ((globalThis as any).__slide371Log ||= {}); if (!GL[row.id] || Date.now() - GL[row.id] > 60000) { GL[row.id] = Date.now(); appendFileSync(join(process.cwd(), "data", "slide-pink.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: row.id, book: row.book, asset: row.asset, why: hold423 }) + "\n"); } } catch {} continue; } }
    // LIVE SIT-OUT HOURS (Love, Oct 8 ~12:45 AM PT: "yess let's pause her on gold for those hours for sure"). Gold's 6 PM PT
    // hour (the session open, bands bunched) lost on paper (-$5,092, 41%) and live (31% of 13). live-switch
    // "liveSkipHours": { gold: [18] } (Pacific hours). Live copies only; paper keeps booking so we keep measuring.
    try {
      const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
      // PER-BOOK WORST HOURS (Love, Oct 11 ~6:20 AM PT: "instead of just their best hours, let's just take them off their
      // WORST hours"). live-switch "bookSkipHours": { book: [PT hours] } = that book sits those hours out live.
      const bh = skipHrsA(sw, String(row.book), row.asset); // fix278: per asset
      // HOURS BY KALSHI'S LABEL (Oct 22 ~4:30 PM PT, Love picked "Follow Kalshi labels"): an hour owns the windows Kalshi labels :00, :15, :30 and :45 by their
      // close time, so the hour is read off the running window's CLOSE (the 3:45-4:00 PM window, labelled 4:00, belongs to the 4 PM book). Four full windows each.
      const hNow = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
      // THE REJECTION MODEL'S HOURS (fix145, Oct 23 ~2:04 PM PT, Love: "let's run the rejection model for those hours tonight with the same add on structure ...
      // we will just do that instead of running ours / 11pm midnight and 2 am for sure"): in live-switch offHourMain.rejHours the REJECTION book (recon-rej) trades
      // Kalshi on her off-hour structure ($2 + $3 add-on at 2.8x+) and TOGETHER sits out live; every other hour recon-rej stays paper.
      // THE TWIN'S HOURS (fix155, Oct 23 ~5:30 PM PT, Love: "yes let's give the twin those hours on kalshi too bb , i could tell those were the right hours"): in the
      // DELAYED twin's live hours (recon-dly in liveBook.books, hour not in bookSkipHours["recon-dly"]: 1, 2, 5 AM, 12, 2 PM) the twin trades Kalshi and both the
      // main book and the rejection model sit out live.
      { const dS = skipHrsA(sw, "recon-dly", row.asset); const lbB = sw?.liveBook?.books; // fix278: per asset
        const twH = Array.isArray(lbB) && lbB.includes("recon-dly") && Array.isArray(dS) && !dS.map(Number).includes(hNow);
        if (twH && (row.book === "recon-tog" || row.book === "recon-rej" || row.book === "recon-togp") && done[row.id]?.status !== "partial") { // fix281: the no-pink copy sits the twin hours out too
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: "the DELAYED twin takes this hour live (Love, Oct 23)" };
          continue;
        } }
      { const omR = sw?.offHourMain; const rjH = omR?.on === true && rjA(omR, row.asset).includes(hNow); // fix243: per asset
        // fix281 (fix281, Oct 26 ~1:10 PM PT, Love: "copy paste the main book onto a fresh paper twin that excludes pink trades only ... same entry logic, speed and execution ... we will put that book on for the rejection models hours"): with recon-togp on liveBook.books, the no-pink copy of the main book takes her rejection hours live and recon-rej stays paper.
        const tpOn = Array.isArray(sw?.liveBook?.books) && sw.liveBook.books.includes("recon-togp");
        if (((row.book === "recon-rej" && (!rjH || tpOn)) || (row.book === "recon-togp" && !rjH) || (row.book === "recon-tog" && rjH)) && done[row.id]?.status !== "partial") {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: row.book === "recon-togp" ? "THE NO-PINK COPY trades live only in Love's rejection hours" : row.book === "recon-rej" && rjH ? "the NO-PINK copy of the main book takes the rejection hours live (Love, Oct 26)" : rjH ? (tpOn ? "the NO-PINK copy takes this hour live (Love, Oct 26)" : "the REJECTION model takes this hour live (Love, Oct 23)") : "REJECTION trades live only in Love's rejection hours" };
          continue;
        } }
      if (Array.isArray(bh) && bh.includes(hNow) && !(row.book === "recon-tog" && offHourMain(String(row.asset))) && done[row.id]?.status !== "partial") { // fix142: off hours trade at $5
        done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: `${String(row.book).toUpperCase()} sits out her worst hour (${hNow % 12 === 0 ? 12 : hNow % 12} ${hNow < 12 ? "AM" : "PM"} PT) live` };
        continue;
      }
      const hrs = sw?.liveSkipHours?.[String(row.asset).toLowerCase()];
      const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
      // PROVISIONAL EXEMPTION (Love, Oct 11 ~6:05 PM PT: "yess provisionally, we'll see if these books do bad at this hour
      // too"): live-switch "liveSkipExempt": { asset: [books] } trade through that asset's blanket skip hours.
      const ex = sw?.liveSkipExempt?.[String(row.asset).toLowerCase()];
      if (Array.isArray(hrs) && hrs.includes(h) && !(Array.isArray(ex) && ex.includes(row.book)) && done[row.id]?.status !== "partial") {
        const lbl = `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
        done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: `${String(row.asset).toUpperCase()} sits out the ${lbl} PT hour live (Love's call, Oct 8)` };
        continue;
      }
    } catch {
    }
    // ABNORMAL SWING GUARD (Love, Oct 14 ~5:55 AM PT: "if there's a price swing of $30 on gold and 1k on btc... she cannot short
    // that"). Gold fell $61 and BTC $1,155 in the 15 min before OGP5 shorted both at 5:45 AM PT (only $2 / $43 in the last 2 min:
    // the dump was already done, so the look-back is 15 min). No short after price fell $30 gold / $1,000 BTC inside the last
    // 15 min, no long after it rose that much. Never happened before in her books since Oct 9 (replay), so it costs nothing.
    // live-switch swingGuard { on, minutes, gold, btc }. Every live book. No chart read (older than 3 min) = no trade.
    try {
      const sg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.swingGuard;
      const sa = String(row.asset).toLowerCase();
      const sth = Number(sg?.[sa]) || 0;
      if (sg?.on && sth > 0 && !done[row.id]?.orderId && !["partial", "resting", "filled", "sent"].includes(String(done[row.id]?.status || ""))) {
        const sc = (globalThis as any).__pivBars?.[sa];
        const mins = Number(sg.minutes) || 15;
        const sbars = (sc?.bars || []).filter((x: any) => x.t * 1000 >= Date.now() - mins * 60000);
        const ssp = Number(asset?.spot) || 0;
        if (!sc || Date.now() - Number(sc.at || 0) > 180000 || !sbars.length || !(ssp > 0)) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: false, bandWait: true, reason: "swing guard: no fresh chart read, waiting" };
          continue;
        }
        const ran = row.side === "down" ? Math.max(...sbars.map((x: any) => x.h)) - ssp : ssp - Math.min(...sbars.map((x: any) => x.l));
        if (ran >= sth) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: `abnormal swing: price already ${row.side === "down" ? "fell" : "rose"} $${ran.toFixed(sa === "btc" ? 0 : 2)} in ${mins} min (limit $${sth}), no ${row.side === "down" ? "short" : "long"} into that` };
          continue;
        }
      }
    } catch {
    }
    // GOLD 5M PIVOT GATE (Love, Oct 14 ~4:40 AM PT: "gold fasho fasho... get her at 74% in both halves right quick"; "i definitely
    // don't want her to do that on gold anymore on live"). PAPER 24/7's gold copies skip a long with a red R1/R2 or the pink PP
    // of the 5m CM pivots above price inside the zone, and a short with a green S1/S2 or the PP below. Zone = 0.3 x ATR(14, 5m)
    // x clamp(ADX/25, 0.5, 1.5), about $0.60-1.70 (pivotbooks pivotZoneCheck). Replay of her 139 gold trades Oct 9-14: blocks 34
    // (50% wins, -$137), keeps 105 at 74%, +$303 vs +$166, 75%/74% in each half. live-switch pivotZoneLive { gold: [books] }.
    // No pivot read (chart older than 2 min) = no trade, never a free pass.
    try {
      const pzl = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.pivotZoneLive?.[String(row.asset).toLowerCase()];
      // Only before an order exists: a resting / partial / filled copy is never touched by this gate.
      if (Array.isArray(pzl) && pzl.includes(row.book) && !done[row.id]?.orderId && !["partial", "resting", "filled", "sent"].includes(String(done[row.id]?.status || ""))) {
        const pzMod: any = await import("./pivotbooks");
        const pzCfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.pivotZone?.[String(row.asset).toLowerCase()];
        const pzAt = Number((globalThis as any).__pivBars?.[String(row.asset).toLowerCase()]?.at) || 0;
        const pzSp = Number(asset?.spot) || 0;
        const ck = Date.now() - pzAt < 120000 ? pzMod.pivotZoneCheck(String(row.asset).toLowerCase(), row.side, pzSp, pzCfg) : null;
        // NOT THE WHOLE WINDOW (Oct 14 ~6:15 AM PT, Love: "that doesn't mean she has to skip the entire window... just not the
        // absolute WORST possible entry... anywhere else but AT the band"). A blocked copy waits (bandWait) and is re-checked every
        // run: once price breaks through the line or backs off out of the zone, it goes in. Window ends first = written down quietly.
        if (!ck || ck.block) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: false, bandWait: true, reason: ck ? `waiting, 5m pivot in her way: ${ck.why}` : "5m pivot gate: no fresh pivot read, waiting" };
          continue;
        }
      }
    } catch {
    }
    // BAND AT THE TARGET (Love, Oct 6 ~3:05 AM PT: "we really shouldn't be entering into trades that have a band at the
    // target, within a dollar of gold... it just bounces in and out... unless its broken thru it"). Replay Sep 20-Oct 5:
    // BRICK gold trades with one of her lines within $1 of the strike went 48/84 and lost $311 at $50; tonight 0/4.
    // Live copy only (paper keeps recording them so we can keep measuring): gold, BRICK / BRICK CLEAN, a line within
    // $1 of the strike that price has NOT already broken through in the trade's direction = no Kalshi trade.
    try {
      // Oct 6 ~6:10 AM PT (Love: COTC did it too, "can you ensure thats on for the night"): every live book's gold trades.
      // Never on a copy already holding a partial fill (Oct 6: a re-check 16 s later wiped a live BRICK·TVC fill to "skipped").
      if (row.asset === "gold" && done[row.id]?.status !== "partial") {
        const bnAll = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"));
        const bn = bnAll?.gold;
        // Oct 7: no lines (or stale ones) = no trade this tick, never a free pass.
        if (!(Number(bn?.vwap) > 0) || !(Date.now() - Date.parse(bnAll?.at || 0) < 45000)) continue;
        const tgt = Number(asset?.target) || 0;
        const sp = Number(asset?.spot) || Number(bn?.spot) || 0;
        const vw = Number(bn?.vwap) || 0;
        const sdv = Number(bn?.sd) || 0;
        const ls = [];
        if (vw > 0) ls.push(["session VWAP", vw]);
        if (vw > 0 && sdv > 0) for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) ls.push([`+${k}σ`, vw + k * sdv], [`-${k}σ`, vw - k * sdv]);
        for (const k of ["m5", "m10", "m15"]) if (Number(bn?.nav?.[k]?.c) > 0) ls.push([`${k.slice(1)}m purple`, Number(bn.nav[k].c)]);
        // LONGS GET $2 (Love, Oct 8 ~4:10 AM PT: "no longs into a trade with a target $2 within a band. she can trade away
        // from that, but not trade into that. absolutely implement that"). A long whose strike has an unbroken line within
        // $2 of it (live-switch goldAtTarget.up) is skipped; shorts stay at $1 (goldAtTarget.down). Live check: the extra
        // longs this blocks went 8/11 (+$17), the extra shorts a $2 rule would block went 14/19 (+$97), so shorts stay at $1.
        let atW = { up: 2, down: 1 };
        try {
          const cfgAt = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.goldAtTarget;
          if (cfgAt) atW = { up: Number(cfgAt.up ?? 2), down: Number(cfgAt.down ?? 1) };
        } catch {
        }
        const wAt = row.side === "up" ? atW.up : atW.down;
        // GOLD FIRES WITH THE BOOK (Love, Oct 11 ~6:40 PM PT: "let's make it fire when the books do on gold, just skip the ones
        // with the band in between price and the target"). Books in live-switch "goldGateExempt" skip the band-at-target wait,
        // the nav band in front and the session-band-ahead gap; a nav band BETWEEN price and the strike still blocks them.
        const gx = (() => { try { const v = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.goldGateExempt; return Array.isArray(v) && v.includes(row.book); } catch { return false; } })();
        const atT = !gx && tgt > 0 && sp > 0 ? ls.find(([, L]) => Math.abs(L - tgt) <= wAt && (row.side === "up" ? !(sp > L) : !(sp < L))) : null;
        if (atT) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: false, bandWait: true, reason: `band at the target: the ${atT[0]} (${Number(atT[1]).toFixed(2)}) sits within $${wAt} of the strike ${tgt.toFixed(2)} and price hasn't broken through it` };
          continue;
        }
        // GOLD NAV BANDS AS OBSTACLES (Love, Oct 7 ~8:20 PM PT: "it broke the session band, but it didn't clear the bollingers
        // on our nav bands... we shouldn't ignore those on gold as an obstacle"). Gold's 5m/10m/15m nav upper/lower now count:
        //  - one standing BETWEEN price and the strike (the trade has to cross it to win): no trade. Replay: 9 trades, 33%, -$212.
        //  - one unbroken within $0.50 in FRONT of the trade: no trade. Replay: 66 trades, 58%, -$185 (wider hurt: $1 = -$443).
        {
          const navB = [];
          for (const k of ["m5", "m10", "m15"]) {
            const f = bn?.nav?.[k];
            if (Number(f?.up) > 0) navB.push([`${k.slice(1)} upper`, Number(f.up)]);
            if (Number(f?.dn) > 0) navB.push([`${k.slice(1)} lower`, Number(f.dn)]);
          }
          if (tgt > 0 && sp > 0 && navB.length) {
            const must = row.side === "up" ? tgt > sp : tgt < sp;
            const wallB = must ? navB.find(([, L]) => L > Math.min(sp, tgt) && L < Math.max(sp, tgt)) : null;
            // Oct 8: touched is not broken here either. Price has to be clearly past a band (live-switch brokenBy, gold $0.20)
            // before it counts as broken; no candle close needed.
            let gBy = 0.2;
            try {
              gBy = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.brokenBy?.gold ?? 0.2);
            } catch {
            }
            // GOLD SWEET SPOT (Love, Oct 9 ~2 PM PT: "lose the 25 cents thru a band, that's way too much... we should only be
            // ignoring trades INTO a band, not away from them... find the sweet spot on gold"). Replay of 348 BRICK / CLEAN / TVC
            // gold trades on TVC's nav bands (Oct 8-9, ~/lab/navfront3.py): blocking any nav band within $0.50 in front + $0.25
            // past cost money (the 70 blocked went 64%, +$214; a band right in front tends to PULL price to it). Best was no
            // front block at all (+$384 taken vs +$140 now). The band BETWEEN price and the strike (wallB, the one she has to
            // cross to win) still blocks. live-switch goldNavFront (default 0.5) and brokenBy.gold (default 0.2) set it.
            let gFront = 0.5;
            try {
              const v = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.goldNavFront;
              if (v != null && Number.isFinite(Number(v))) gFront = Number(v);
            } catch {
            }
            const frontB = gFront > 0 || gBy > 0 ? navB.map(([nm, L]) => [nm, row.side === "up" ? L - sp : sp - L, L]).filter(([, d]) => d > -gBy && d <= gFront && !(d === 0 && gFront === 0 && gBy === 0)).sort((x, y) => x[1] - y[1])[0] : undefined;
            // SESSION BAND $1.50-$2.00 AHEAD (Love, Oct 8 ~5:25 PM PT: "she still longed into a band on gold and it
            // reversed. we can't have her take those anymore"). The 5:20 PM BRICK·TVC long had the session +2σ $1.53 above
            // it. Nearest session line (VWAP / σ) in front of a gold trade, by distance: $1.50-$2.00 lost in BOTH records
            // (live 5 trades 0 won -$147; replay Sep 26-Oct 6 34 trades 56% -$116), while $0.50-$1.50 out won (live
            // 10 of 11, replay 71-73%): price tends to get pulled TO a nearby band, but one $1.50-$2 out stalls it.
            // live-switch goldSessionGap: [1.5, 2] (null turns it off).
            let gapB = null;
            try {
              const gcfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.goldSessionGap;
              const lo = Array.isArray(gcfg) ? Number(gcfg[0]) : 1.5;
              const hi = Array.isArray(gcfg) ? Number(gcfg[1]) : 2;
              if (gcfg !== null && hi > lo) {
                gapB = ls.filter(([nm]) => /VWAP|σ/.test(String(nm))).map(([nm, L]) => [nm, row.side === "up" ? L - sp : sp - L, L]).filter(([, d]) => d >= lo && d <= hi).sort((x, y) => x[1] - y[1])[0] || null;
              }
            } catch {
              gapB = null;
            }
            if (gapB && !wallB && !frontB && !gx) {
              done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: false, bandWait: true, reason: `session band ahead: the ${gapB[0]} (${Number(gapB[2]).toFixed(2)}) sits $${Number(gapB[1]).toFixed(2)} in front of the ${row.side === "up" ? "long" : "short"} (the $1.50-$2 stall zone)` };
              continue;
            }
            if ((wallB && !pf) || (frontB && !gx)) {
              done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: false, bandWait: true, reason: wallB ? `nav band in the way: the ${wallB[0]} (${Number(wallB[1]).toFixed(2)}) sits between price and the strike ${tgt.toFixed(2)}` : Number(frontB[1]) > 0 ? `nav band in front: the ${frontB[0]} sits $${Number(frontB[1]).toFixed(2)} in front of the ${row.side === "up" ? "long" : "short"}, unbroken` : `nav band in front: price is only $${Math.abs(Number(frontB[1])).toFixed(2)} past the ${frontB[0]}, not clearly through it yet` };
              continue;
            }
          }
        }
      }
    } catch {
      // FAIL CLOSED (Oct 7): if her lines can't be read this instant, don't trade this tick; the copier tries again in ~1 s.
      continue;
    }
    // HEADROOM ON BTC (Love, Oct 6 ~10:20 AM PT: "runnit bb"). Replay of 404 BRICK BTC trades (scripts/headroom-lab.py):
    // an unbroken line of hers within $30 in FRONT of the trade (above a long, below a short) = 143 trades, saving +$609
    // when skipped, green in both halves of the history (+$532 / +$77). $50 turned red in the recent half; gold is
    // untouched (a line ahead does not hurt gold). Runs alongside the 25% channel rule. Live copy only: paper keeps booking.
    try {
      const room = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.btcHeadroom ?? 30);
      // REFINED LONGS RIDE TO THE BAND (Love, Oct 9 ~9:40 PM PT, "both yes"). Replay on the desk's own minute lines (Oct 5-9):
      // REFINED's BTC longs with a band in front won 86% (42, +$134 at live pricing, green both halves): she bounces off one
      // line and banks at the next, so the line "in front" is her target. Her clear trades lost (-$107). live-switch
      // bandExempt.btc { book: [sides] } skips this headroom check for those sides; shorts keep waiting.
      const bxFree = (() => { try { const bx = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.bandExempt?.btc?.[row.book]; return Array.isArray(bx) && bx.includes(row.side); } catch { return false; } })();
      // PAPER FIRES SKIP THIS TOO (Oct 16 ~2:10 AM PT, Love: "i thought the main book we were running currently didn't have any
      // band checks hun?" - her Oct 15 pick "Open all except my hand-window law"; the 04:44Z paperFires pass missed this one).
      if (row.asset === "btc" && room > 0 && !bxFree && !pf && done[row.id]?.status !== "partial") {
        const bnAll = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"));
        const bn = bnAll?.btc;
        // Oct 7 (Love's 3:16 PM short into the 5m purple): missing or stale lines used to mean "nothing in front" = a free
        // pass. Now no lines (vwap, sigma and the 5m purple) or lines older than 45 s (they refresh every ~10-15 s) = no trade this tick; it retries.
        if (!(Number(bn?.vwap) > 0) || !(Number(bn?.sd) > 0) || !(Number(bn?.nav?.m5?.c) > 0) || !(Date.now() - Date.parse(bnAll?.at || 0) < 45000)) continue;
        const sp = Number(asset?.spot) || Number(bn?.spot) || 0;
        const vw = Number(bn?.vwap) || 0;
        const sdv = Number(bn?.sd) || 0;
        const ls = [];
        if (vw > 0) ls.push(["session VWAP", vw]);
        if (vw > 0 && sdv > 0) for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) ls.push([`+${k}σ`, vw + k * sdv], [`-${k}σ`, vw - k * sdv]);
        for (const k of ["m5", "m10", "m15"]) {
          const f = bn?.nav?.[k];
          if (Number(f?.c) > 0) ls.push([`${k.slice(1)} purple`, Number(f.c)]);
          if (Number(f?.up) > 0) ls.push([`${k.slice(1)} upper`, Number(f.up)]);
          if (Number(f?.dn) > 0) ls.push([`${k.slice(1)} lower`, Number(f.dn)]);
        }
        // TOUCHED IS NOT BROKEN (Love, Oct 8 ~2:31 AM PT: "she just shorted btc into the purple band when it hadn't broken
        // thru yet"; ~3:05 AM: "she doesn't need to wait for a close into one... just need her to read them as broken or
        // unbroken properly"). At 2:30 the live tick sat 50 cents under our 5m purple (82,944.19) while her chart had that line
        // at 82,942.50, price still ABOVE it: unbroken. Our line and her chart's can differ by a dollar or two and a single
        // tick can poke through, so price has to be past a line by live-switch brokenBy before it counts as broken.
        // ~3:20 AM PT, Love: "$10 is too far... if price does break thru, $3 is fine". BTC $3: on recent paper it blocks 2
        // losers and no winners (-$60 saved; $10 also blocked a winner). No candle close needed.
        const brokenBy = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.brokenBy?.btc ?? 3);
        // SESSION LINES GET $75 (Love, Oct 8 ~3:55 AM PT: "longed into a band again... going down... can you take another look
        // at the numbers"). The 3:45 long had the -1σ $35 above it. With the nearest line $30-75 in front: LIVE BTC desk trades
        // with a session VWAP / σ line there won 50% for -$147 (18); with only nav lines there 74% for +$98 (19). Replay
        // (Sep 26-Oct 6, BRICK): session line there +$18 (67), nav line there +$326 (82). So the session VWAP and σ lines
        // block out to live-switch btcHeadroomSession ($75); her nav lines stay at btcHeadroom ($30).
        const roomSess = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.btcHeadroomSession ?? 75);
        const isSess = (nm) => /VWAP|σ/.test(String(nm));
        // WAIT FOR THE BREAK (Love, Oct 8 ~5:50 PM PT: "she could have still entered when it broke thru the band"). A band
        // skip (here, gold's band rules too) is no longer final: the copy is re-checked every couple of seconds for the rest
        // of the window and goes to Kalshi the moment price is clearly through the band (BTC $3, gold 25c), as long as paper
        // still holds the trade and it still pays 1.37x+. If the band never breaks, it is written down quietly at the bell.
        // BELT AND BRACES (Love, Oct 8 ~3:30 PM PT: "she shorted btc directly into a band again... what was the greenlight").
        // The 3:31 PM 1ST BREAK short went in at 81,717 with the session +0.5σ (81,703) $14 under it, and every spot on
        // that tape had a line inside the zone, so the file lines this tick must not have matched the live ones. Now the
        // lines come from BOTH the bands file and the live engine's own frame (session VWAP / σ and her nav bands), and
        // the check runs at every spot we have (live, file, last 1m tick): any one of them seeing a line in the zone = no trade.
        try {
          const fr = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
          if (Number(fr?.vwap) > 0) {
            ls.push(["session VWAP", Number(fr.vwap)]);
            if (Number(fr?.stdev) > 0) for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) ls.push([`+${k}σ`, Number(fr.vwap) + k * Number(fr.stdev)], [`-${k}σ`, Number(fr.vwap) - k * Number(fr.stdev)]);
          }
          const an = asset?.nav;
          for (const k of ["m5", "m10", "m15"]) {
            const f = an?.[k];
            if (Number(f?.c) > 0) ls.push([`${k.slice(1)} purple`, Number(f.c)]);
            if (Number(f?.up) > 0) ls.push([`${k.slice(1)} upper`, Number(f.up)]);
            if (Number(f?.dn) > 0) ls.push([`${k.slice(1)} lower`, Number(f.dn)]);
          }
        } catch {
        }
        // ONE PRICE, NOT THREE (Love, Oct 9 ~10:30 PM PT: "bands more than $30 apart and her not entering on a break is
        // notttttt normal... has to be a bug somewhere"). The check also ran at the file's spot and the last 1m bar's close,
        // and those can be a stale or backup-feed price: tonight they sat a median $7 and 1 in 10 checks $51+ away from
        // the live price, so a line $30 from a STALE price blocked trades with nothing in front of the real one (Thu-Fri:
        // 542 of 675 checks blocked; 325 with the live price alone). Extra spots now only count within $10 of the live price.
        const spotsAll = [sp, Number(bn?.spot) || 0, Number(bn?.nav?.live1m?.c) || 0].filter((x) => x > 0);
        const spots = spotsAll.filter((x) => Math.abs(x - spotsAll[0]) <= 10);
        const zoneOf = (nm) => (isSess(nm) ? Math.max(room, roomSess) : room);
        let ahead = null;
        for (const s0 of spots) {
          const hit = ls.map(([nm, L]) => [nm, row.side === "up" ? L - s0 : s0 - L, L]).filter(([nm, d]) => d > -brokenBy && d < zoneOf(nm)).sort((x, y) => x[1] - y[1])[0];
          if (hit && (!ahead || hit[1] < ahead[1])) ahead = hit;
        }
        // Every BTC go / no-go is written down (data/gate-log.jsonl) so any trade can be traced to the exact numbers.
        const glast = (gLiveCopy.__gateLogLast ||= {});
        const gkey = ahead ? String(ahead[0]) : "clear";
        if (glast[row.id] !== gkey) try {
          glast[row.id] = gkey;
          const near = spots.length ? ls.map(([nm, L]) => [nm, Math.round((row.side === "up" ? L - spots[0] : spots[0] - L) * 100) / 100]).filter(([, d]) => d > -40 && d < 80).sort((x, y) => x[1] - y[1]).slice(0, 6) : [];
          appendFileSync(join(process.cwd(), "data", "gate-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: row.id, side: row.side, spots, fileAt: bnAll?.at, vwap: bn?.vwap, sd: bn?.sd, liveVwap: asset?.vwap1m?.vwap ?? asset?.vwap5m?.vwap ?? null, liveSd: asset?.vwap1m?.stdev ?? asset?.vwap5m?.stdev ?? null, near, block: ahead ? ahead[0] : null }) + "\n");
        } catch {
        }
        if (ahead) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: false, bandWait: true, reason: Number(ahead[1]) > 0 ? `headroom: the ${ahead[0]} sits $${Number(ahead[1]).toFixed(0)} in front of the ${row.side === "up" ? "long" : "short"}, unbroken (under $${isSess(ahead[0]) ? Math.max(room, roomSess) : room})` : `headroom: price is only $${Math.abs(Number(ahead[1])).toFixed(0)} past the ${ahead[0]}, not clearly through it yet (needs $${brokenBy})` };
          continue;
        }
      }
    } catch {
      // FAIL CLOSED (Oct 7): if her lines can't be read this instant, don't trade this tick; the copier tries again in ~1 s.
      continue;
    }
    // TIME-OF-DAY CYCLE (Love, Oct 4 ~10 AM PT: "cycle all books thru their most successful points during the day by win
    // rate"). Each book's own paper record in this 4-hour block (PT) decides: once a block has minN+ settled trades and the
    // book wins less than minWin there, that book sits that block out on Kalshi (paper keeps recording). Too little data =
    // she trades. live-switch "timeGate": { on, minN, minWin, hours }.
    try {
      const tg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).timeGate;
      // EXEMPT (Love, Oct 6 ~2:55 AM PT: "keep her on... her strongest has been at night"): books in timeGate.exempt always trade.
      if (tg?.on && done[row.id]?.status !== "partial" && !(Array.isArray(tg.exempt) && tg.exempt.includes(row.book))) {
        const span = Number(tg.hours) > 0 ? Number(tg.hours) : 4;
        const hourNow = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
        const blk = Math.floor(hourNow / span);
        const cache = gLiveCopy.__timeGate && Date.now() - gLiveCopy.__timeGate.at < 300000 ? gLiveCopy.__timeGate : (gLiveCopy.__timeGate = { at: Date.now(), map: {} });
        if (!cache.map[row.book + ":" + blk]) {
          const nb = await import("./nightbook");
          const cell = nb.listNight().filter((r) => r.book === row.book && !r.dnaMode && !r.stale && r.result !== "open" && r.pnl != null && Math.floor(Number(r.hourPT) / span) === blk);
          cache.map[row.book + ":" + blk] = { n: cell.length, w: cell.filter((r) => (r.pnl ?? 0) > 0).length };
        }
        const c = cache.map[row.book + ":" + blk];
        const minN = Number(tg.minN) > 0 ? Number(tg.minN) : 15;
        const minWin = Number(tg.minWin) > 0 ? Number(tg.minWin) : 0.62;
        if (c.n >= minN && c.w / c.n < minWin) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: `${String(row.book).toUpperCase()} sits out ${((h) => `${(Number(h) % 12) || 12} ${Number(h) < 12 ? "AM" : "PM"}`)(blk * span)}-${((h) => `${(Number(h) % 12) || 12} ${Number(h) < 12 ? "AM" : "PM"}`)((blk * span + span) % 24)} PT (${c.w}/${c.n} here, under ${Math.round(minWin * 100)}%)` };
          continue;
        }
      }
    } catch {
    }
    // NEVER BACKWARDS (Love, Oct 11 ~8 PM PT: "make sure nothing like that could ever even be possible"). Before any book
    // copy goes out: (1) the side must agree with the setup's own words ("close above" = long, "close below" = short) and
    // must be up/down; (2) for "On <line>" setups, when the line can be found on her session bands, a long must sit at or
    // above it and a short at or below it (to the dollar of gold / $5 of BTC). Anything that disagrees is refused and
    // logged, never sent. After a fill, the held side is checked against the intended side (below).
    {
      const lbl = String(row.setup || "");
      let bad = "";
      if (row.side !== "up" && row.side !== "down") bad = `side "${row.side}" is not up/down`;
      else if (/^close above/i.test(lbl) && row.side !== "up") bad = `"${lbl}" is a long setup but the copy says ${row.side}`;
      else if (/^close below/i.test(lbl) && row.side !== "down") bad = `"${lbl}" is a short setup but the copy says ${row.side}`;
      else {
        const m = /^On (session VWAP|([+-−])(\d+(?:\.\d+)?)σ)$/i.exec(lbl.replace(/\s+/g, " ").trim());
        const fr = asset?.vwap1m?.vwap ? asset.vwap1m : null;
        const sp = Number(asset?.spot) || 0;
        if (m && fr && sp > 0) {
          const k = m[1].toLowerCase() === "session vwap" ? 0 : (m[2] === "+" ? 1 : -1) * Number(m[3]);
          const L = Number(fr.vwap) + k * Number(fr.stdev);
          const tol = row.asset === "gold" ? 1 : 5;
          if (row.side === "up" && sp < L - tol) bad = `long "${lbl}" but price ${sp.toFixed(2)} is under the line ${L.toFixed(2)}`;
          if (row.side === "down" && sp > L + tol) bad = `short "${lbl}" but price ${sp.toFixed(2)} is over the line ${L.toFixed(2)}`;
        }
      }
      if (bad) {
        try { appendFileSync(join(process.cwd(), "data", "backwards-guard.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: row.id, book: row.book, side: row.side, setup: lbl, why: bad }) + "\n"); } catch {}
        if (!pf) {
          done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: `REFUSED, would be backwards: ${bad}` };
          continue;
        }
      }
    }
    // RECHECK AT THE KALSHI DOOR (Oct 15, Love: "both. immediately both pls" - after the 06:00:43 gold short that paper
    // booked on a 70c dip and Kalshi filled 9 s later into the rise). Her band laws ran only when paper booked; now they run
    // AGAIN on the live tick the instant the order goes out: tick over the band = long, under = short (on the line = the
    // read stands); a long while the live 5m is red and the tick at/under the band = short; a short while the live 5m is
    // green and the tick at/over the band = long. If the market turned, she takes the OTHER side - never a skip - and the
    // paper row flips with her so the card and Kalshi always match. paperFires books only. Log: data/door-recheck.jsonl.
    if (pf && (row.side === "up" || row.side === "down")) {
      try {
        const prefix = `${row.ticker}:${row.book}:`;
        const rawId = String(row.id).startsWith(prefix) ? String(row.id).slice(prefix.length) : "";
        const ogAll = rawId ? JSON.parse(readFileSync(join(process.cwd(), "data", "grok-og.json"), "utf8")) : [];
        const raw = Array.isArray(ogAll) ? ogAll.find((x: any) => x && x.id === rawId) : null;
        const bnd = raw?.band;
        const q = (await import("./quotes")).quoteTick(String(row.asset));
        if (bnd && Number(bnd.price) > 0 && q && Date.now() - q.at <= 3000) {
          const tick = Number(q.c);
          const bp = Number(bnd.price);
          const tol = row.asset === "btc" ? 2 : 0.15;
          const nowS = Date.now() / 1000;
          const bars = ((globalThis as any).__pivBars?.[String(row.asset)]?.bars ?? []).filter((x: any) => x.t + 60 <= nowS);
          const f0 = Math.floor(nowS / 300) * 300;
          const inF = bars.filter((x: any) => x.t >= f0);
          const fiveOpen = inF.length ? Number(inF[0].o) : bars.length ? Number(bars[bars.length - 1].c) : 0;
          let want: "up" | "down" = row.side;
          if (raw?.goldLaw) {
            // HER FOUR GOLD LAWS at the door (goldlaw.ts goldDoor) - nothing else for gold.
            want = (await import("./goldlaw")).goldDoor({ kind: String(raw.goldLaw.kind), bandPx: bp, floor: Number(raw.goldLaw.floor) || 0, ceil: Number(raw.goldLaw.ceil) || 0, frame: Number(raw.goldLaw.frame) || 0 }, row.side, tick, fiveOpen, f0);
            // (Oct 16 ~2:20 PM PT, Love: "Remove the flip completely"): no closest-band flip at the door. The last gate refuses instead.
          } else {
          if (tick >= bp + tol) want = "up";
          else if (tick <= bp - tol) want = "down";
          if (want === "up" && tick <= bp + tol && fiveOpen > 0 && tick < fiveOpen) want = "down";
          if (want === "down" && tick >= bp - tol && fiveOpen > 0 && tick > fiveOpen) want = "up";
          }
          if (want !== row.side) {
            const was = { side: row.side, setup: row.setup };
            const newLabel = `${want === "up" ? "Over" : "Under"} ${bnd.name} at the Kalshi door (was: ${row.setup})`;
            const nAsk = Number(want === "up" ? market?.yesAsk : market?.noAsk) || 0;
            row.side = want;
            row.setup = newLabel;
            if (nAsk > 0.02 && nAsk < 0.98) row.ask = nAsk;
            const stake = Number(raw.stake) || 20;
            const patch: any = { side: want, label: newLabel };
            if (nAsk > 0.02 && nAsk < 0.98) Object.assign(patch, { ask: Math.round(nAsk * 100) / 100, multiple: Math.round((1 / nAsk) * 100) / 100, peak: nAsk, lastBid: 0, fee: Math.ceil(0.07 * (stake / nAsk) * nAsk * (1 - nAsk) * 100) / 100 });
            const df = ((globalThis as any).__doorFlip ||= {});
            df[rawId] = { at: Date.now(), side: want, patch };
            // INVERSE BOOK follows: the opposite of what she now takes.
            const invId = rawId.replace(":ogp5-fast", ":ogp5-inv");
            const invSide: "up" | "down" = want === "up" ? "down" : "up";
            const invAsk = Number(invSide === "up" ? market?.yesAsk : market?.noAsk) || 0;
            const invPatch: any = { side: invSide, label: `Inverse of: ${newLabel}` };
            if (invAsk > 0.02 && invAsk < 0.98) Object.assign(invPatch, { ask: Math.round(invAsk * 100) / 100, multiple: Math.round((1 / invAsk) * 100) / 100, peak: invAsk, lastBid: 0, fee: Math.ceil(0.07 * (stake / invAsk) * invAsk * (1 - invAsk) * 100) / 100 });
            if (invId !== rawId) df[invId] = { at: Date.now(), side: invSide, patch: invPatch };
            try {
              const fresh = JSON.parse(readFileSync(join(process.cwd(), "data", "grok-og.json"), "utf8"));
              const fr = Array.isArray(fresh) ? fresh.find((x: any) => x && x.id === rawId) : null;
              const fi = invId !== rawId && Array.isArray(fresh) ? fresh.find((x: any) => x && x.id === invId && x.result === "open") : null;
              if (fr) Object.assign(fr, patch);
              if (fi) Object.assign(fi, invPatch);
              if (fr || fi) { writeFileSync(join(process.cwd(), "data", "grok-og.json.tmp"), JSON.stringify(fresh)); renameSync(join(process.cwd(), "data", "grok-og.json.tmp"), join(process.cwd(), "data", "grok-og.json")); }
            } catch {}
            try { appendFileSync(join(process.cwd(), "data", "door-recheck.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: row.id, asset: row.asset, band: bnd.name, bandPx: bp, tick, fiveOpen, was, now: { side: want, setup: newLabel }, ask: nAsk, bookedAt: row.at }) + "\n"); } catch {}
          }
        }
      } catch {}
    }
    // TOGETHER SKIPPED THE OPENING = ONE REJECTION AT 1/4 (Oct 18 ~4:13 PM PT, Love: "on our normal book - if for any reason she skipped the window initially,
    // i want her to take those - upon a rejection - at any rejection at any band, @ 1/4 position sizes" + "No trade yet this window" / "One per window").
    // Opening = the window's first minute. A TOGETHER row booked after it, with no TOGETHER fill in the window yet: a rejection goes at 1/4 size; anything
    // else is skipped. One per window: the usual one-position-per-window lock stops anything after a fill.
    let togMul = 1;
    if (row.book === "ogp5" || row.book === "pap247") {
      const mmT = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(String(row.ticker));
      const MONT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const endT = mmT ? Date.UTC(2000 + Number(mmT[1]), MONT.indexOf(mmT[2]), Number(mmT[3]), Number(mmT[4]) + 4, Number(mmT[5])) : 0;
      if (endT && Date.parse(row.at) - (endT - 900000) > 60000) {
        const tradedT = Object.entries(done).some(([k, v]: [string, any]) => k.startsWith(`${row.ticker}:`) && /^(ogp5|pap247)$/.test(k.split(":")[1] || "") && v && (v.status === "filled" || v.status === "partial"));
        if (!tradedT) {
          // BREAKS AT FULL SIZE (Oct 18 ~7:05 PM PT, Love: "i don't want her to skip the breaks ?? i want her to take it when it happens at full size"):
          // only a late REJECTION goes at 1/4; anything else after the first minute trades normally.
          if (/reject|bounce/i.test(String(row.setup))) togMul = 0.25;
        }
      }
    }
    // STALE CALL GUARD (fix375, Oct 27 2026 11:21 PM PT, Love: "yesss pls" to "add a guard so a call that's over a minute old can never fire right after a seat opens" - 11:20 PM the rejection
    // model's 11:15:11 gold long filled at 64c up at the red the moment her 11 PM seat was switched on): a call that reaches the wire with NO earlier try on Kalshi (no record yet) and is more
    // than 90 s old is written down skipped, never sent. The delayed twin (waits for its touch on purpose) and gold-slide holds (fix371) are exempt. Back as fix425 (Love Oct 28 2026 7:36 PM PT: "stale call guard NEEDS to be in there.").
    if (!done[row.id] && String(row.book) !== "recon-dly" && !((globalThis as any).__slide371Log || {})[row.id] && Date.parse(String(row.at)) > 0 && Date.now() - Date.parse(String(row.at)) > 90000) { done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "skipped", final: true, reason: `STALE CALL: booked ${Math.round((Date.now() - Date.parse(String(row.at))) / 1000)} s ago and never tried on Kalshi - a seat that just opened never fires an old call (fix375)` }; continue; }
    // fix431 (stale even while retrying) TAKEN OUT as fix444 - Love Oct 28 2026 9:52 PM PT: "too strict , telling you lol" (to: a call a wall holds for over 90 s gets dropped). Held calls stay alive and every order is re-checked at the wire (fix435); the original fix375 stale guard above stays.
    // THE THIRDS FLIP IS OFF FOR MAIN + REJECTION (fix442, Love Oct 28 2026 9:23 PM PT: "yeah no i got rid of the flip." + Oct 27 8:38 PM: "yes the flip is already supposed to be off hun, pls remove that
    // and keep it off" - fix364 only took it off the copy): a call her thirds read turned to the other side ("Top third - seen as a short ... (was: ...)" / "Bottom third ... seen as a long") never goes
    // live for main or rejection - 9:20 PM the refused gold long came back as a short right after the pink broke up. Held, not final: a real call of hers later in the window still goes.
    if (["recon-tog", "recon-rej"].includes(String(row.book)) && / - seen as a (short|long) /.test(String(row.setup || row.label || "")) && !done[row.id]?.orderId && !["partial", "resting", "filled", "sent"].includes(String(done[row.id]?.status || ""))) { done[row.id] = { ...(done[row.id] || {}), at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "blocked", final: false, reason: `THIRDS FLIP OFF (fix442): "${String(row.setup || row.label).slice(0, 90)}" is a refused call turned to the other side - never live for main or rejection` }; continue; }
    // 3 PM = BOLLINGERS AND ZONES ONLY (fix452, Love Oct 29 2026 9:42 AM PT: "3pm ✅ (bollingers, green/red zones only) (for btc and gold pls)"): in the 3 PM PT hour the rejection model
    // takes only calls off a Bollinger band or the green/red zone, gold and BTC; pink, session-band and other calls are held (not final - a zone/Bollinger call later in the window still goes). Walls still judge.
    if (String(row.book) === "recon-rej" && Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24 === 15 && !/Bollinger|Green zone|Red zone/i.test(String(row.setup || row.label || "")) && !done[row.id]?.orderId && !["partial", "resting", "filled", "sent"].includes(String(done[row.id]?.status || ""))) { done[row.id] = { ...(done[row.id] || {}), at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: "blocked", final: false, reason: `3 PM = BOLLINGERS AND ZONES ONLY (fix452): "${String(row.setup || row.label).slice(0, 80)}" is not a Bollinger or green/red zone call` }; continue; }
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    let placed = null;
    const tOrder = Date.now();
    try {
      try { (gLiveCopy.__stage ||= {})[lane || "all"] = { id: row.id, step: "enterLive", at: new Date().toISOString() }; } catch {}
      placed = await live.enterLive(row.side, row.ticker, market?.yesAsk ?? 0, market?.noAsk ?? 0, Number(cfg.dollars), {
        bookCopy: row.book,
        sizeMul: togMul,
        // CHANGE HER MIND (Oct 15, Love): a ":m2"/":m3" pivot row = she changed her mind this window; kalshi-live flips the position.
        flip: /:m\d$/.test(String(row.id)),
        paperAsk: Number(row.ask) || 0,
        line: { spot: asset?.spot || 0, vwap: frame?.vwap || 0, target: asset?.target ?? 0, stdev: frame?.stdev || 0, label: row.setup, bookCopy: row.book },
        secondsLeft: asset?.secondsLeft
      });
    } catch (err) {
      placed = { status: "blocked", reason: err instanceof Error ? err.message.slice(0, 140) : "live book failed" };
    }
    const reason = placed?.reason || "";
    // SPEED WATCH (Claude, Oct 8 ~4:20 PM PT, Love: "can you have kalshi get the orders FIRST"): where the time goes between
    // paper booking a trade and the order reaching Kalshi: waiting for the copier run, the gates, and the order itself.
    try {
      appendFileSync(join(process.cwd(), "data", "copy-timing.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: row.id, booked: row.at, waitMs: runStart - Date.parse(row.at), gatesMs: tOrder - runStart, orderMs: Date.now() - tOrder, status: placed?.status || null, paperAsk: Number(row.ask) || null, paid: placed?.paid ?? null }) + "\n");
    } catch {
    }
    // HONEST PAPER (Love: "match the paper books to the amount we're doing on kalshi so i'm not fooling myself"): once a
    // live copy fills, that book's paper trade is re-priced at what Kalshi really charged, so its card, the DAY tab and
    // the ALERTS tab score the entry she actually got (the paper price stays on the row as paperAsk).
    if ((placed?.status === "filled" || placed?.status === "partial") && Number(placed?.paid) > 0.02 && Number(placed?.paid) < 0.99) {
      try {
        const nb2 = await import("./nightbook");
        nb2.setPaperFill(row.id, Number(placed.paid));
      } catch {
      }
    }
    // NEVER BACKWARDS, after the fill: Kalshi's held side must match the copy's side. If it doesn't, sell it at once and alarm.
    if (placed?.status === "filled" || placed?.status === "partial") {
      try {
        const heldNow = await live.heldFifteens();
        const h = heldNow.find((x) => x.ticker === row.ticker);
        const gotSide = h ? (h.pos > 0 ? "up" : h.pos < 0 ? "down" : null) : null;
        if (gotSide && gotSide !== row.side) {
          // Only the bot's own backwards fill is sold (held size = what this order filled). If the held size is different, a
          // hand trade of hers is mixed in: alarm only, never touch her position.
          const mine = Math.abs(Math.abs(h.pos) - Number(placed?.filled || 0)) < 1;
          if (mine) await live.flattenTicker(row.ticker, true).catch(() => {});
          try { appendFileSync(join(process.cwd(), "data", "backwards-guard.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: row.id, book: row.book, side: row.side, held: gotSide, sold: mine, why: "held side did not match" }) + "\n"); } catch {}
          try {
            const af = join(process.cwd(), "data", "alarm.json");
            const al = JSON.parse(readFileSync(af, "utf8"));
            const rows = Array.isArray(al) ? al : [];
            rows.unshift({ at: new Date().toISOString(), text: `RED: ${String(row.book).toUpperCase()} meant ${row.side.toUpperCase()} on ${row.ticker} but Kalshi holds ${gotSide.toUpperCase()}. ${mine ? "Sold it at once." : "Your hand trade is mixed in, so nothing was sold: check it."}` });
            writeFileSync(af, JSON.stringify(rows.slice(0, 200)));
          } catch {
          }
        }
      } catch {
      }
    }
    if (reason === "working") continue;
    const tries = (done[row.id]?.tries || 0) + 1;
    const final = reason === "you already hold the other side" || placed?.status === "resting";
    done[row.id] = { at: new Date().toISOString(), ticker: row.ticker, side: row.side, status: placed?.status || "blocked", reason, firstReason: done[row.id]?.firstReason ?? reason, firstTryAt: done[row.id]?.firstTryAt ?? new Date().toISOString(), bookedAt: row.at, tries, final, paid: placed?.paid ?? null, orderId: placed?.orderId ?? null };
  }
  try {
    // atomic: write a temp file then rename, so no reader ever sees half a file. A lane writes back only the records it changed, over the
    // file as it stands now, so the other lane's records are never overwritten (no await between the read and the rename).
    let out = done;
    if (lane) {
      const changedK = Object.keys(done).filter((k) => done[k] !== doneAtStart[k]);
      if (!changedK.length) return;
      try {
        const now = JSON.parse(readFileSync(doneFile, "utf8"));
        for (const k of changedK) now[k] = done[k];
        out = now;
      } catch {
        out = done;
      }
    }
    writeFileSync(doneFile + "." + (lane || "all") + ".tmp", JSON.stringify(out, null, 1));
    renameSync(doneFile + "." + (lane || "all") + ".tmp", doneFile);
  } catch {
  }
}
async function copyPrimeBook(assets) {
  // REMOVED (Claude, Oct 3 ~2:55 PM PT, Love: "get rid of the stuff grok left behind... change the locks"): a Grok-era
  // route that opened Kalshi positions on its own. It no longer runs. Only a named live book (BRICK / COTC) opens trades.
  return null;
  const note = (row) => {
    try {
      const file = join(process.cwd(), "data", "copier.json");
      let prev = [];
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8"));
        if (Array.isArray(parsed)) prev = parsed;
      } catch {
        prev = [];
      }
      prev.unshift({ at: new Date().toISOString(), ...row });
      writeFileSync(file, JSON.stringify(prev.slice(0, 40), null, 2));
    } catch {
    }
  };
  if (entriesOff()) {
    note({ status: "idle", reason: "entries off" });
    return;
  }
  let live;
  try {
    live = await import("./kalshi-live.server");
    if (!live.kalshiArmed()) {
      note({ status: "idle", reason: "kalshi not armed" });
      return;
    }
  } catch (err) {
    note({ status: "idle", reason: err instanceof Error ? err.message.slice(0, 120) : "live import failed" });
    return;
  }
  const rows = listPrimePaper().filter((row) => row.result === "open" && row.live !== "filled" && row.ticker);
  if (!rows.length) note({ status: "idle", reason: "no open prime row" });
  for (const row of rows) {
    const dollars = 5;
    const asset = assets?.[row.asset];
    const market = asset?.market;
    const left = asset?.secondsLeft ?? 0;
    if (!market || market.ticker !== row.ticker || !(left > 30)) {
      note({ status: "wait", asset: row.asset, side: row.side, pattern: row.pattern, ticker: row.ticker, reason: "not this window", dollars });
      continue;
    }
    const quote = row.side === "up" ? Number(market?.yesAsk) : Number(market?.noAsk);
    if (!(quote > 0.02) || 1 / quote < 1.36) {
      note({ status: "blocked", asset: row.asset, side: row.side, pattern: row.pattern, ticker: row.ticker, reason: "under 1.36x", dollars });
      continue;
    }
    const frame = asset?.vwap1m?.vwap ? asset.vwap1m : asset?.vwap5m;
    try {
      const held = lessonHold(row, asset);
      if (held) {
        note({ status: "blocked", asset: row.asset, side: row.side, pattern: row.pattern, ticker: row.ticker, reason: held, dollars });
        continue;
      }
    } catch {
    }
    let placed = null;
    try {
      placed = await live.enterLive(row.side, row.ticker, market?.yesAsk ?? 0, market?.noAsk ?? 0, dollars, {
        primeCopy: true,
        line: {
          spot: asset?.spot || 0,
          vwap: frame?.vwap || 0,
          target: asset?.target ?? 0,
          stdev: frame?.stdev || 0,
          label: row.pattern,
          primeCopy: true
        },
        secondsLeft: asset?.secondsLeft
      });
    } catch (err) {
      placed = { status: "blocked", reason: err instanceof Error ? err.message.slice(0, 140) : "copy failed" };
    }
    const status = placed?.status || "blocked";
    const reason = placed?.reason || "";
    try {
      const file = join(process.cwd(), "data", "copier.json");
      let prev = [];
      try {
        const parsed = JSON.parse(readFileSync(file, "utf8"));
        if (Array.isArray(parsed)) prev = parsed;
      } catch {
        prev = [];
      }
      prev.unshift({ at: new Date().toISOString(), asset: row.asset, side: row.side, pattern: row.pattern, ticker: row.ticker, status, reason, dollars });
      writeFileSync(file, JSON.stringify(prev.slice(0, 40), null, 2));
    } catch {
    }
    if (status === "filled" || reason === "already") stampPrime(row.id, "filled");
    if (status === "filled") {
      noteCombo({
        id: `${row.ticker}:${row.side}:prime`,
        at: row.at || new Date().toISOString(),
        asset: row.asset,
        side: row.side,
        pattern: row.pattern,
        ticker: row.ticker,
        route: "prime",
        dollars: typeof live.liveDollars === "function" ? live.liveDollars() : 10,
      });
    }
  }
}
function beatAge() {
  try {
    const row = JSON.parse(readFileSync(join(process.cwd(), "data", "heartbeat.json"), "utf8"));
    const t = Date.parse(row.at ?? "");
    return Number.isFinite(t) ? Date.now() - t : Infinity;
  } catch {
    return Infinity;
  }
}
var EVAL_TOKEN = {};
function arm() {
  if (beatAge() > 90e3) g.__aureliusBusy = false;
  if (g.__aureliusEngine) clearInterval(g.__aureliusEngine);
  g.__aureliusGen = ENGINE_GEN;
  // MAGLEV (Oct 14 ~7:20 AM PT, Love: "a maglev train"): the main loop looks every 1 s (was 3 s; a slow pass still never
  // overlaps, the busy flag holds the next one), and a warmer re-reads the market + charts in the background every second,
  // so the loop never waits on a fresh scan. Before: PAPER saw data 6-25 s old (15 s chart cache + 5 s scan cache + 3-12 s loop).
  g.__aureliusEngine = setInterval(() => {
    void tick();
  }, 1e3);
  if (g.__scanWarm) clearInterval(g.__scanWarm);
  g.__scanWarm = setInterval(() => {
    if (g.__lastSettings) void scanDesk(g.__lastSettings).catch(() => {});
  }, 1e3);
  if (!g.__aureliusBusy) void tick();
}
function reignite() {
  if (beatAge() > 2e4) g.__aureliusBusy = false;
  arm();
  const flags = [];
  if (beatAge() > 25e3) flags.push("heartbeat dark");
  if (entriesOff()) flags.push("entries off");
  try {
    if (JSON.parse(readFileSync(join(process.cwd(), "data", "scale75.json"), "utf8")).on === false) flags.push("take profit off");
  } catch {
  }
  let looked = 0;
  try {
    looked = Date.parse(JSON.parse(readFileSync(join(process.cwd(), "data", "prime-why.json"), "utf8")).at || "");
  } catch {
    looked = 0;
  }
  if (!looked || Date.now() - looked > 3 * 60 * 1000) flags.push("the book stopped looking");
  const row = { at: new Date().toISOString(), ok: flags.length === 0, flags };
  try {
    writeFileSync(join(process.cwd(), "data", "smoke.json"), JSON.stringify(row, null, 2));
    writeFileSync(join(process.cwd(), "data", "reignite.json"), JSON.stringify({
      at: row.at,
      gen: ENGINE_GEN,
      by: "clock",
      smoke: flags,
    }));
    if (flags.length) {
      const file = join(process.cwd(), "data", "alarm.json");
      const prev = JSON.parse(readFileSync(file, "utf8"));
      const rows = Array.isArray(prev) ? prev : [];
      const text = `SMOKE: ${flags.join(". ")}`;
      if (!rows.some((item) => item.text === text && Date.now() - Date.parse(item.at) < 10 * 60 * 1000)) {
        rows.unshift({ at: row.at, text });
        writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
      }
    }
  } catch {
  }
}
function ensureEngine() {
  // A hot reload leaves the old timer pointing at a dead module. Rebind once
  // per evaluation so those leftover ticks cannot pile up and stall the page.
  if (g.__aureliusEval === EVAL_TOKEN && g.__aureliusEngine && g.__aureliusReignite && beatAge() < 2e4) return;
  if (g.__aureliusRelay) clearInterval(g.__aureliusRelay);
  g.__aureliusRelay = setInterval(() => {
    if (beatAge() > 90e3) g.__aureliusBusy = false;
    if (beatAge() > 2e4) arm();
  }, 15e3);
  if (g.__aureliusReignite) clearInterval(g.__aureliusReignite);
  g.__aureliusReignite = setInterval(reignite, 10 * 60 * 1000);
  g.__aureliusEval = EVAL_TOKEN;
  arm();
}
ensureEngine();
export {
  ensureEngine,
  readExitLog,
  sendKalshi,
  sendLive
};

// fix403: no touch needed - back as fix433 (Love Oct 28 2026 8:23 PM PT: "2- stay"): the gold slide hold under pink needs no pink touch and stays on until a 25c break (slideHold403 below, unchanged since before the 6:45 PM restore).
/** fix403 (Oct 28 2026 4:03 PM PT, Love card "How should the gold downslope-under-pink hold work now?" -> "No longs till pink breaks"; fix371 words (Oct 27 10:12 PM PT): "maybe in the event of this we should wait for a break").
 *  Restored as fix423 after the checkpoint restore (Love Oct 28 2026 7:18 PM PT card "Put the downslope pink wall back, and on which books?" -> "Main + rejection, gold AND BTC"; Love 7:17 PM: "you see price on a downslope ?????  you see prices rejecting off of pink a hundred times ????? this was in the checkpoint.").
 *  sm = 5 s samples of gold price + 5m pink for the last 30 min. Sliding = more than $2 lower than 30 min ago while under pink (pink + 25c).
 *  No pink touch needed. Once on, the hold stays on until price breaks up through pink by 25c. Tested by tools/slide-test.cjs (umpire). */
export function slideHold403(sm: { t: number; p: number; pp: number }[], S: { on: boolean }, now: number): string {
  const last = sm[sm.length - 1];
  if (!last || now - last.t >= 30000) return "";
  if (last.p > last.pp + 0.25) { S.on = false; return ""; }
  let broke = false;
  for (const x of sm) { if (x.p > x.pp + 0.25) broke = true; else if (x.p >= x.pp - 0.30) broke = false; }
  if (broke) { S.on = false; return ""; }
  if (sm.length > 10 && now - sm[0].t >= 1200000 && last.p < sm[0].p - 2) { S.on = true; return `GOLD SLIDE UNDER PINK: gold ${last.p.toFixed(2)} is $${(sm[0].p - last.p).toFixed(2)} lower than 30 min ago under the unbroken pink (${last.pp.toFixed(2)}) - no long until price breaks up through pink by 25c (fix371/fix403).`; }
  if (S.on) return `GOLD SLIDE UNDER PINK: gold ${last.p.toFixed(2)} is still under the unbroken pink (${last.pp.toFixed(2)}) since the slide - no long until price breaks up through pink by 25c (fix403).`;
  return "";
}

/** fix423 BTC (same rule as fix403, BTC sizes): sliding = more than $40 lower than 30 min ago while under pink (pink + $8); free on an $8 break up through pink
 *  ($8 = the checkpoint's BTC pink break, PINK WAIT BACK ON BTC Oct 18). Tested by tools/slide-test-btc.cjs (umpire). */
export function slideHoldBtc423(sm: { t: number; p: number; pp: number }[], S: { on: boolean }, now: number): string {
  const last = sm[sm.length - 1];
  if (!last || now - last.t >= 30000) return "";
  if (last.p > last.pp + 8) { S.on = false; return ""; }
  let broke = false;
  for (const x of sm) { if (x.p > x.pp + 8) broke = true; else if (x.p >= x.pp - 10) broke = false; }
  if (broke) { S.on = false; return ""; }
  if (sm.length > 10 && now - sm[0].t >= 1200000 && last.p < sm[0].p - 40) { S.on = true; return `BTC SLIDE UNDER PINK: btc ${last.p.toFixed(2)} is $${(sm[0].p - last.p).toFixed(2)} lower than 30 min ago under the unbroken pink (${last.pp.toFixed(2)}) - no long until price breaks up through pink by $8 (fix423).`; }
  if (S.on) return `BTC SLIDE UNDER PINK: btc ${last.p.toFixed(2)} is still under the unbroken pink (${last.pp.toFixed(2)}) since the slide - no long until price breaks up through pink by $8 (fix423).`;
  return "";
}
