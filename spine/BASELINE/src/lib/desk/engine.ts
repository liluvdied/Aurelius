import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { readySpine, spineOwns } from "./spine-ready";
import { autoDecision, bandBetween, bandInWay, brokeUnder, closeByBand, closedThrough, offList, primeLabel, shortBandOnTarget, shortTap, survivalBlock, underBand, winningSetup } from "./auto";
import { readBook, writeBook } from "./book";
import { readFillLog } from "./fill-log";
import { goldHaltFill, goldHalted } from "./hours";
import { bandBank, bandBreak, bandInTheWay, bandNear, clampTrail, closeEnough, exitTargetPct, flipped, keepGreen, legalSide, markTrade, midBand, newId, noteFour, quoteSale, saleCall, settleSide, smallTicket, targetKiss, tenVwapWall, trailExit, vwapSitsBetween, windowStillOpen } from "./paper";
import { farBandProbe } from "./probe";
import { scanDesk } from "./scan";
import { lateWindow } from "./setup";
import { flagBetween, flagOffList } from "./watchdog";

var g = globalThis;
var ENGINE_GEN = 386;
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
function holdModel() {
  if (Date.now() - holdAt < 2e4) return;
  holdAt = Date.now();
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
    writeFileSync(file, JSON.stringify({ hour: hour.key, at: new Date().toISOString(), reload: true }));
  } catch {
  }
  const child = spawn("/bin/sh", ["/workspace/spine/reload.sh"], { detached: true, stdio: "ignore" });
  child.unref();
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
  if (Date.now() - raiseAt < 6e4) return;
  raiseAt = Date.now();
  const file = join(process.cwd(), "data", "live-size.json");
  let row = { dollars: 25, eth: 25, sol: 25, raise: null };
  try {
    row = { ...row, ...JSON.parse(readFileSync(file, "utf8")) };
  } catch {
  }
  const today = pacificDay();
  const plan = row.raise && typeof row.raise === "object" ? row.raise : { day: today, anchor: null, next: 30 };
  if (plan.day === today && plan.anchor != null) return;
  let cash = null;
  try {
    const live = await import("./kalshi-live.server");
    cash = await live.kalshiCash();
  } catch {
    return;
  }
  if (!(cash > 0)) return;
  if (plan.anchor == null || plan.day === today) {
    row.raise = { day: today, anchor: cash, next: plan.next || 30 };
  } else if (cash > plan.anchor + 0.5) {
    const dollars = Math.min(100, plan.next || 30);
    row.dollars = dollars;
    row.raise = { day: today, anchor: cash, next: dollars + 10 };
  } else {
    row.raise = { day: today, anchor: cash, next: plan.next || 30 };
  }
  try {
    writeFileSync(file, JSON.stringify(row));
  } catch {
  }
}
var GUARD_FROM = (/* @__PURE__ */ new Date()).toISOString();
var HALT_FILE = join(process.cwd(), "data", "halt.json");
var PACE_FILE = join(process.cwd(), "data", "pace.json");
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
    try {
      const live = await import("./kalshi-live.server");
      if (row.ticker) await live.flattenTicker(row.ticker);
    } catch {
    }
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
    if ((row.profit ?? 0) >= 0 || !row.pattern || !row.side) continue;
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
  const text = `RED: ${reason}`;
  try {
    writeFileSync(
      HALT_FILE,
      JSON.stringify({ off: true, at: (/* @__PURE__ */ new Date()).toISOString(), since: (/* @__PURE__ */ new Date()).toISOString(), reason, losses: [] })
    );
  } catch {
  }
  try {
    const file = join(process.cwd(), "data", "alarm.json");
    const prev = JSON.parse(readFileSync(file, "utf8"));
    const rows = Array.isArray(prev) ? prev : [];
    if (!rows.some((row) => row.text === text)) rows.unshift({ at: (/* @__PURE__ */ new Date()).toISOString(), text });
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
    const at = row.at ?? "";
    return at && Date.now() - Date.parse(at) <= 60 * 60 * 1e3;
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
      writeFileSync(hourFile, JSON.stringify({ key: hourKey, net: recentNet, at: (/* @__PURE__ */ new Date()).toISOString() }));
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
    return { ask, pct };
  } catch {
    return null;
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
function studySetup(setup) {
  const label = setup.pattern?.label || "";
  if (!setup.side || setup.pattern?.kind === "none") return false;
  if (label.startsWith("Watching") || label.startsWith("No band")) return false;
  return setup.pattern.kind === "tap_reject" || setup.pattern.kind === "break_retest" || label.startsWith("Open ") || label.startsWith("Gold clock");
}
function researchFill(setup, asset, stake) {
  if (!studySetup(setup)) return null;
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
    notes: setup.reasons[0] ?? "",
    grokThesis: "",
    target: asset.target,
    lastSpot: asset.spot,
    entryVwap: asset.vwap1m?.vwap || asset.vwap5m?.vwap || null
  };
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
  const market = asset.market;
  const line = asset.vwap1m?.vwap || asset.vwap5m?.vwap || 0;
  const width = asset.vwap1m?.stdev || asset.vwap5m?.stdev || 0;
  let aimed = withRightSide(setup, asset);
  if (!aimed || !market || market.ticker !== aimed.ticker || goldHalted(aimed.asset)) return null;
  if (asset.secondsLeft > 840 && !shortTap(aimed.pattern?.label, aimed.side)) return null;
  if (!winningSetup(aimed.pattern?.label || "", aimed.side, aimed.asset)) {
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
  const ask = paper.side === "up" ? market.yesAsk : market.noAsk;
  if (!(ask > 0.02 && ask < 0.92)) return trades;
  const copyFloor = shortTap(paper.patternLabel, paper.side) ? 1.2 : sureLate(paper.side, paper.patternLabel, asset.spot, asset.target ?? 0, asset.secondsLeft) ? 1.2 : 1.34;
  if (1 / ask < copyFloor) return trades;
  if (shortTap(paper.patternLabel, paper.side) && 1 / ask > 2.8) return trades;
  try {
    const made = await sendKalshi(
      {
        id: paper.setupId || `${paper.ticker}:${paper.side}:copy`,
        asset: paper.asset,
        ticker: paper.ticker,
        side: paper.side,
        pattern: {
          kind: "tap_reject",
          side: paper.side,
          band: null,
          quality: 0.8,
          label: paper.patternLabel || "Paper",
          reasons: ["Paper and Kalshi together."]
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
    if (next.some((t) => t.id === taken.tradeId || t.result === "open" && t.source !== "live" && t.ticker === ticker && t.side === taken.side)) {
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
async function armHedge(trades, assets) {
  const asset = assets.btc;
  const market = asset?.market;
  if (!asset || !market) return trades;
  const open = trades.find(
    (t) => t.source === "live" && t.venue !== "polymarket" && t.result === "open" && t.asset === "btc" && t.ticker === market.ticker
  );
  if (!open || hedgeSpent(open.ticker)) return trades;
  if (trades.some((t) => t.venue === "polymarket" && samePolyWindow(t.ticker, market.closeTime))) return trades;
  let poly2;
  try {
    poly2 = await import("./poly-live.server");
  } catch {
    return trades;
  }
  if (!poly2.polymarketArmed() || !bandNear(asset)) return trades;
  const side = open.side === "up" ? "down" : "up";
  try {
    const filled = await poly2.takeSide(side, market.closeTime, 10, 0.22);
    if (!filled) return trades;
    const stake = Math.round(filled.filled * filled.price * 100) / 100;
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(
      HEDGE_ONCE,
      JSON.stringify({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        orderId: filled.orderId,
        slug: filled.slug,
        side,
        price: filled.price,
        filled: filled.filled,
        stake,
        kalshi: open.ticker,
        tickers: [.../* @__PURE__ */ new Set([open.ticker, ...JSON.parse(readFileSync(HEDGE_ONCE, "utf8")).tickers ?? []])].slice(0, 40)
      })
    );
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
        setupId: `${open.setupId}:hedge`,
        autoFilled: true,
        probe: false,
        patternLabel: "Insurance",
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
        notes: `Insurance. $${stake.toFixed(2)} ${side.toUpperCase()} on Polymarket against Kalshi ${open.side.toUpperCase()}. Held to the bell.`,
        grokThesis: "",
        target: filled.target ?? asset.target,
        lastSpot: asset.spot,
        entryVwap: asset.vwap1m?.vwap || asset.vwap5m?.vwap || null,
        orderId: filled.orderId
      },
      ...trades
    ];
  } catch {
    return trades;
  }
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
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" }
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
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" }
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
  const frame = computeVwap2(candles.slice(-60));
  const spot = candles[candles.length - 1]?.c ?? 0;
  if (!frame || !(spot > 0)) return null;
  return { spot, vwap: frame.vwap, stdev: frame.stdev, candles, frame };
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
    const copyFloor = shortTap(pattern.label, pattern.side) ? 1.2 : sureLate(pattern.side, pattern.label, spot, target, left) ? 1.2 : 1.34;
    if (!(multiple >= copyFloor) || (shortTap(pattern.label, pattern.side) && multiple > 2.8)) {
      noteProbe(tag, "multiple", { ticker, spot, vwap, target, label: pattern.label, side: pattern.side, multiple: Math.round(multiple * 100) / 100 });
      return;
    }
    let dollars = altStake(tag);
    const sent = await live.enterLive(pattern.side, ticker, market.yesAsk, market.noAsk ?? 0, dollars, {
      line: { spot, vwap, target, stdev, label: pattern.label },
      secondsLeft: left
    });
    if (sent?.reason === "unfilled") probeRetry.set(series, true);
    else probeRetry.delete(series);
    noteProbe(tag, sent?.status === "filled" ? "sent" : `held ${sent?.reason ?? "not filled"}`, {
      ticker,
      side: pattern.side,
      spot,
      vwap,
      target,
      label: pattern.label,
      dollars,
    });
  } catch (err) {
    noteProbe(tag, "error", { error: err instanceof Error ? err.message : String(err) });
  }
}
function altStake(tag) {
  try {
    const row = JSON.parse(readFileSync(join(process.cwd(), "data", "live-size.json"), "utf8"));
    const n = Number(tag === "ETH" ? row.eth : tag === "SOL" ? row.sol : tag === "SILVER" ? row.silver || 5 : tag === "WTI" || tag === "NATGAS" ? 5 : row.dollars);
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
async function cashHeld(assets?: Record<string, { spot?: number; target?: number | null }>) {
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
    for (const ticker of Object.keys(peaks)) {
      if (!open.has(ticker)) {
        delete peaks[ticker];
        changed = true;
      }
    }
    for (const row of held) {
      if (!(row.cost > 0) || !(Math.abs(row.pos) >= 0.01)) continue;
      const res = await fetch(`https://external-api.kalshi.com/trade-api/v2/markets/${row.ticker}`);
      if (!res.ok) continue;
      const data = await res.json();
      const yesBid = Number.parseFloat(data.market?.yes_bid_dollars ?? "0");
      const noBid = Number.parseFloat(data.market?.no_bid_dollars ?? "0");
      const yesAsk = Number.parseFloat(data.market?.yes_ask_dollars ?? "0");
      const noAsk = Number.parseFloat(data.market?.no_ask_dollars ?? "0");
      const bid = row.pos > 0 ? yesBid > 0 ? yesBid : noAsk > 0 ? Math.max(0.01, 1 - noAsk) : 0 : noBid > 0 ? noBid : yesAsk > 0 ? Math.max(0.01, 1 - yesAsk) : 0;
      if (!(bid > 0.02)) continue;
      const qty = Math.abs(row.pos);
      const multiple = row.cost > 0 ? qty / row.cost : 0;
      const floor = multiple > 0 && multiple <= 1.28 ? 25 : 28;
      const id = /BTC/i.test(row.ticker) ? "btc" : /GOLD/i.test(row.ticker) ? "gold" : /SILVER/i.test(row.ticker) ? "silver" : "";
      const snap = id ? assets?.[id] : undefined;
      const target = Number.parseFloat(data.market?.floor_strike ?? "") || snap?.target || 0;
      const decision = quoteSale(row.cost, bid, row.pos, floor, peaks[row.ticker] ?? 0, readPin(row.ticker), {
        asset: id,
        side: row.pos > 0 ? "up" : "down",
        spot: snap?.spot,
        target,
        vwap: snap?.vwap1m?.vwap,
        stdev: snap?.vwap1m?.stdev,
      });
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
      if (decision.action !== "sell") continue;
      const payout = await live.flattenTicker(row.ticker);
      if (payout == null) {
        noteCash({ at: (/* @__PURE__ */ new Date()).toISOString(), ticker: row.ticker, why: decision.why, action: "miss" });
        continue;
      }
      delete peaks[row.ticker];
      changed = true;
      const profit = Math.round((payout - row.cost) * 100) / 100;
      noteExit({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        ticker: row.ticker,
        asset: /GOLD/i.test(row.ticker) ? "gold" : /ETH/i.test(row.ticker) ? "eth" : /SOL/i.test(row.ticker) ? "sol" : "btc",
        side: row.pos > 0 ? "up" : "down",
        stake: row.cost,
        multiple: Math.round(multiple * 100) / 100,
        bidPct: Math.round((payout - row.cost) / row.cost * 100),
        targetPct: floor,
        payout,
        profit,
        reason: decision.why,
        short: false,
        yesBid,
        yesAsk,
        secondsLeft: null,
        spot: null,
        strike: null
      });
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
async function tryNextHour(trades, btc, halted) {
  if (halted || !btc || Date.now() - hourAt < 2e4) return trades;
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
    const filled = await poly2.buySlug(side, hour.slug, 20, 0.62, hour.target);
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
    if (decision.action !== "sell") continue;
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
        patternLabel: "Live",
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
async function bankLive(trades, assets) {
  const live = await import("./kalshi-live.server");
  let next = trades;
  for (let trade of next) {
    if (trade.source !== "live" || trade.venue === "polymarket" || trade.result !== "open") continue;
    if (smallTicket(trade) && !(trade.multiple >= 7)) continue;
    const asset = assets[trade.asset];
    const market = asset?.market;
    if (!asset || !market || market.ticker !== trade.ticker) continue;
    const mtm = markTrade(trade, asset);
    const cheap = trade.multiple > 0 && trade.multiple <= 1.28;
    const floorPct = cheap ? 25 : 28;
    const need = floorPct / 100;
    const called = askedClose(trade);
    const pin = readPin(trade.ticker);
    const call = saleCall(pin, mtm, floorPct, (trade.highBid ?? 0) > 0.02);
    const pinnedHit = call === "pin";
    const eased = call === "ease";
    const pinHolds = pin != null && pin.pct > floorPct + 1 && pin.pct < 5e3;
    const fallbackPct = floorPct;
    const safe = keepGreen(mtm.pct * 100, {
      asset: trade.asset,
      side: trade.side,
      spot: asset.spot,
      target: trade.target ?? asset.target ?? undefined,
      vwap: asset.vwap1m?.vwap,
      stdev: asset.vwap1m?.stdev,
    });
    const atBand = !safe && !cheap && !pinnedHit && !eased && !pinHolds && bandBank(trade, asset, floorPct);
    const trailed = !safe && !pinnedHit && !pinHolds && trailExit(trade, asset, floorPct);
    if (mtm.pct + 1e-9 >= need && mtm.bid > (trade.highBid ?? 0)) {
      trade = { ...trade, highBid: mtm.bid };
      next = next.map((t) => t.id === trade.id ? trade : t);
    }
    noteHalf(trade, asset, mtm.pct);
    if (safe && !pinnedHit) continue;
    if (!atBand && !trailed && !called && !pinnedHit && !eased) continue;
    const paid = trade.contracts > 0 && trade.stake > 0 ? trade.stake / trade.contracts : trade.ask || 0;
    const peakPct = paid > 0 && (trade.highBid ?? 0) > 0 ? ((trade.highBid ?? 0) / paid - 1) * 100 : mtm.pct * 100;
    const gate = cheap ? (peakPct >= 25 ? 25 : 0) : peakPct >= 28 ? 28 : 0;
    if (gate > 0 && mtm.pct * 100 + 1e-9 < gate) continue;
    const bidPct = Math.round(mtm.pct * 100);
    const targetPct = pinnedHit ? Math.round(pin.pct) : eased ? fallbackPct : floorPct;
    const reason = pinnedHit ? "pin" : eased ? "ease" : atBand ? "band" : trailed ? "target" : "called";
    try {
      let payout = pinnedHit || eased ? await live.flattenTicker(trade.ticker) : null;
      if (payout == null) {
        payout = await live.closeAtBand(
          trade,
          market.yesBid,
          market.yesAsk,
          called || atBand || trailed || pinnedHit || eased,
          false,
          targetPct
        );
      }
      if (payout == null) {
        if (false) {
          missedSalvage.add(trade.id);
          noteExit({
            at: (/* @__PURE__ */ new Date()).toISOString(),
            ticker: trade.ticker,
            asset: trade.asset,
            side: trade.side,
            stake: trade.stake,
            multiple: Math.round(trade.multiple * 100) / 100,
            bidPct,
            targetPct,
            payout: null,
            profit: null,
            reason: "salvage-missed",
            short: false,
            yesBid: market.yesBid,
            yesAsk: market.yesAsk,
            secondsLeft: asset.secondsLeft,
            spot: asset.spot,
            strike: trade.target ?? asset.target
          });
        }
        continue;
      }
      const heldNow = await live.heldFifteens();
      const leftRow = heldNow.find((item) => item.ticker === trade.ticker);
      const leftQty = leftRow ? Math.abs(leftRow.pos) : 0;
      const had = trade.contracts > 0 ? trade.contracts : 0;
      if (had > 1 && leftQty >= 0.5 && had - leftQty >= 0.5) {
        const sold = Math.round((had - leftQty) * 100) / 100;
        const part = sold / had;
        const stake = Math.round(trade.stake * part * 100) / 100;
        const leftStake = Math.round((trade.stake - stake) * 100) / 100;
        const profit2 = Math.round((payout - stake) * 100) / 100;
        const slice = {
          ...trade,
          id: newId(),
          setupId: `${trade.setupId}:part:${Date.now()}`,
          closedAt: (/* @__PURE__ */ new Date()).toISOString(),
          stake,
          contracts: sold,
          result: "exited",
          payout,
          profit: profit2,
          notes: `Part filled $${payout.toFixed(2)}. The rest is still open.`
        };
        noteExit({
          at: (/* @__PURE__ */ new Date()).toISOString(),
          ticker: trade.ticker,
          asset: trade.asset,
          side: trade.side,
          stake,
          multiple: Math.round(trade.multiple * 100) / 100,
          bidPct,
          targetPct,
          payout,
          profit: profit2,
          reason,
          pattern: trade.patternLabel || "",
          vwap: asset.vwap1m?.vwap ?? null,
          stdev: asset.vwap1m?.stdev ?? null,
          short: true,
          yesBid: market.yesBid,
          yesAsk: market.yesAsk,
          highBid: trade.highBid ?? market.yesBid,
          secondsLeft: asset.secondsLeft,
          spot: asset.spot,
          strike: trade.target ?? asset.target
        });
        next = [
          slice,
          ...next.map(
            (t) => t.id === trade.id ? {
              ...t,
              stake: leftStake,
              contracts: Math.round(leftQty * 100) / 100,
              notes: "Part is banked. This part is still open."
            } : t
          )
        ];
        continue;
      }
      const profit = Math.round((payout - trade.stake) * 100) / 100;
      noteExit({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        ticker: trade.ticker,
        asset: trade.asset,
        side: trade.side,
        stake: trade.stake,
        multiple: Math.round(trade.multiple * 100) / 100,
        bidPct,
        targetPct,
        payout,
        profit,
        reason,
        pattern: trade.patternLabel || "",
        vwap: asset.vwap1m?.vwap ?? null,
        stdev: asset.vwap1m?.stdev ?? null,
        short: false,
        yesBid: market.yesBid,
        yesAsk: market.yesAsk,
        highBid: trade.highBid ?? market.yesBid,
        secondsLeft: asset.secondsLeft,
        spot: asset.spot,
        strike: trade.target ?? asset.target
      });
      next = next.map(
        (t) => t.id === trade.id ? {
          ...t,
          result: "exited",
          payout,
          profit,
          closedAt: (/* @__PURE__ */ new Date()).toISOString(),
          notes: pinnedHit ? `Banked the slider at ${bidPct}%.` : eased ? `Slider was ${Math.round(pin.pct)}%. It didn't get there, so it took ${bidPct}% instead.` : atBand ? `Banked at the VWAP band, ${bidPct}%. Failsafe. The rest stay open.` : `Banked at ${bidPct}% on the bid. Target was ${targetPct}%.`
        } : t
      );
    } catch {
    }
  }
  return next;
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
async function tick() {
  try {
    writeFileSync(join(process.cwd(), "data", "heartbeat.json"), JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), gen: ENGINE_GEN, phase: "start" }));
  } catch {
  }
  ensureLossHalt();
  holdModel();
  await maybeRaise();
  await guardFills();
  paceGuard();
  hourMo();
  const halted = entriesOff();
  if (halted) {
    try {
      writeFileSync(join(process.cwd(), "data", "halt-seen.json"), JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), gen: ENGINE_GEN }));
    } catch {
    }
  }
  if (g.__aureliusBusy) return;
  g.__aureliusBusy = true;
  try {
    const book = readBook();
    const snap = await scanDesk(book.settings);
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
      const lateRaw = lateWindow(asset);
      const late = withRightSide(lateRaw, asset);
      if (late && studySetup(late) && !has(late.id) && !flipped(trades, late.ticker, late.side, late.asset, locks2)) {
        const paper = researchFill(late, asset, book.settings.stake);
        if (paper) {
          noteFive(paper);
          noteKiss(paper, asset);
          alarmBetween(asset, paper.side, paper.ticker);
          trades = [paper, ...trades];
          if (kalshiOk(late, asset) && !(late.multiple >= 5) && asset.secondsLeft >= 45) {
            trades = await copyWith(trades, asset, paper);
          }
        }
      }
      const raw = asset.setup;
      const setup = withRightSide(raw, asset);
      if (asset.secondsLeft > 0 && asset.secondsLeft < 120) continue;
      if (!setup || setup.watchOnly || flipped(trades, setup.ticker, setup.side, setup.asset, locks2)) continue;
      const probe = farBandProbe(setup);
      const probeTicket = probe && winningSetup(probe.pattern.label, probe.side) && !has(probe.id) ? fill(probe, asset, 1) : null;
      if (probeTicket) trades = [{ ...probeTicket, probe: true, stake: 1, contracts: 1 / Math.max(probeTicket.ask, 0.01) }, ...trades];
      if (studySetup(setup) && !has(setup.id)) {
        const paper = researchFill(setup, asset, book.settings.stake);
        if (paper) {
          noteFive(paper);
          noteKiss(paper, asset);
          alarmBetween(asset, paper.side, paper.ticker);
          trades = [paper, ...trades];
          if (kalshiOk(setup, asset)) {
            trades = await copyWith(trades, asset, paper);
          }
        }
      }
    }
    await tryFive(halted, "KXSILVER15M", "SI=F", "SILVER");
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
      const fresh = asset.pattern1m?.side && winningSetup(asset.pattern1m.label, asset.pattern1m.side, id) ? asset.pattern1m : null;
      const liveOpen = trades.some(
        (t) => t.source === "live" && t.venue !== "polymarket" && t.result === "open" && t.asset === id && t.ticker === market.ticker
      );
      if (liveOpen) continue;
      const side = fresh?.side || paperSide;
      const label = fresh?.label || paper.patternLabel || "";
      if (side !== paper.side) {
        trades = trades.map((t) => t.id === paper.id ? { ...t, side, patternLabel: label } : t);
        paper.side = side;
        paper.patternLabel = label;
      }
      if (!winningSetup(label, side, paper.asset) || (!spineOwns(paper.asset) && bandInTheWay(asset, side))) continue;
      const vwapNow = asset.vwap1m?.vwap || asset.vwap5m?.vwap || 0;
      if (!(asset.spot > 0) || !(vwapNow > 0)) continue;
      const strikeNow = asset.target ?? 0;
      if (side === "up" && asset.spot < vwapNow && !shortTap(label, side) || side === "down" && asset.spot > vwapNow && !(strikeNow < vwapNow) && !shortTap(label, side)) continue;
      const ask = side === "up" ? market.yesAsk : market.noAsk;
      if (!(ask > 0.02 && ask < 0.92)) continue;
      const copyFloor = shortTap(label, side) ? 1.2 : sureLate(side, label, asset.spot, strikeNow, asset.secondsLeft) ? 1.2 : 1.34;
      if (1 / ask < copyFloor || (shortTap(label, side) && 1 / ask > 2.8)) continue;
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
    writeBook(trades, book.settings);
    paceGuard();
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
      const live = await import("./kalshi-live.server");
      await live.watchAccount(readBook().trades);
    } catch {
    }
    g.__aureliusBusy = false;
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
  if (g.__aureliusEngine) clearInterval(g.__aureliusEngine);
  g.__aureliusGen = ENGINE_GEN;
  g.__aureliusEngine = setInterval(() => {
    void tick();
  }, 3e3);
  if (!g.__aureliusBusy) void tick();
}
function ensureEngine() {
  // A hot reload leaves the old timer pointing at a dead module. Rebind once
  // per evaluation so those leftover ticks cannot pile up and stall the page.
  if (g.__aureliusEval === EVAL_TOKEN && g.__aureliusEngine) return;
  if (g.__aureliusRelay) clearInterval(g.__aureliusRelay);
  g.__aureliusRelay = setInterval(() => {
    if (beatAge() > 2e4 && !g.__aureliusBusy) arm();
  }, 15e3);
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
