import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPrivateKey, randomUUID, sign, constants } from "node:crypto";
import { crossBids, halfCuts, profitPrice, shortClosePrices } from "./paper";
import { bandReach, primeLabel, shortBandOnTarget, shortTap, survivalBlock, winningSetup } from "./auto";
const ROOT = "https://external-api.kalshi.com";
const LIVE_DOLLARS = 25;
let cachedKey = null;
function keyId() {
  return readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();
}
function privateKey() {
  if (!cachedKey) cachedKey = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
  return cachedKey;
}
function kalshiArmed() {
  try {
    return keyId().length > 0 && Boolean(privateKey());
  } catch {
    return false;
  }
}
async function kalshi(method, path, query = "", body) {
  const timestamp = Date.now().toString();
  const signature = sign("sha256", Buffer.from(`${timestamp}${method}${path}`), {
    key: privateKey(),
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST
  }).toString("base64");
  return fetch(ROOT + path + query, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "KALSHI-ACCESS-KEY": keyId(),
      "KALSHI-ACCESS-TIMESTAMP": timestamp,
      "KALSHI-ACCESS-SIGNATURE": signature
    },
    body: body === void 0 ? void 0 : JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
}
async function marketResult(ticker) {
  const res = await fetch(`${ROOT}/trade-api/v2/markets/${ticker}`);
  if (!res.ok) return null;
  const data = await res.json();
  const result = data.market?.result;
  return result === "yes" || result === "no" ? result : null;
}
function settlementProfitOf(row) {
  const yesCount = Number.parseFloat(row.yes_count_fp ?? "");
  const noCount = Number.parseFloat(row.no_count_fp ?? "");
  const yesCost = Number.parseFloat(row.yes_total_cost_dollars ?? "");
  const noCost = Number.parseFloat(row.no_total_cost_dollars ?? "");
  const fee = Number.parseFloat(row.fee_cost ?? "0");
  const value = Number(row.value ?? NaN);
  if (![yesCount, noCount, yesCost, noCost, value].every(Number.isFinite)) return null;
  const yesPay = value / 100 * yesCount;
  const noPay = (1 - value / 100) * noCount;
  return Math.round((yesPay + noPay - yesCost - noCost - (Number.isFinite(fee) ? fee : 0)) * 100) / 100;
}
const settleCache = globalThis;
async function settlementProfits() {
  const hit = settleCache.__aureliusSettle;
  if (hit && Date.now() - hit.at < 2e4) return hit.map;
  const map = /* @__PURE__ */ new Map();
  let cursor = "";
  for (let page = 0; page < 4; page += 1) {
    const res = await kalshi("GET", "/trade-api/v2/portfolio/settlements", `?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
    if (!res.ok) break;
    const data = await res.json();
    for (const row of data.settlements ?? []) {
      if (!row.ticker || map.has(row.ticker)) continue;
      const profit = settlementProfitOf(row);
      if (profit == null) continue;
      map.set(row.ticker, profit);
    }
    if (!data.cursor) break;
    cursor = data.cursor;
  }
  settleCache.__aureliusSettle = { at: Date.now(), map };
  return map;
}
async function kalshiBooks() {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/balance");
  if (!res.ok) return null;
  const data = await res.json();
  const total = Number.parseFloat(data.balance_dollars ?? "");
  const rows = Array.isArray(data.balance_breakdown) ? data.balance_breakdown : [];
  const shard = rows.find((row) => Number(row.exchange_index) === 2);
  const tradable = Number.parseFloat(shard?.balance ?? "");
  return {
    total: Number.isFinite(total) ? total : null,
    tradable: Number.isFinite(tradable) ? tradable : null
  };
}
async function kalshiCash() {
  const books = await kalshiBooks();
  if (!books) return null;
  return books.total;
}
async function signedPosition(ticker) {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=100&count_filter=position");
  if (!res.ok) return 0;
  const data = await res.json();
  const row = data.market_positions?.find((p) => p.ticker === ticker);
  const n = Number.parseFloat(row?.position_fp ?? "0");
  return Number.isFinite(n) ? n : 0;
}
function money(n) {
  return n.toFixed(4);
}
function contractsFor(price, dollars) {
  if (!(price > 0.02 && price < 0.98)) return null;
  const count = Math.floor(dollars / price * 100) / 100;
  if (count < 0.01) return null;
  if (count * price > dollars + 1e-3) return null;
  return count.toFixed(2);
}
async function fifteenOpen() {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=100&count_filter=position");
  if (!res.ok) return [];
  const data = await res.json();
  const rows = [];
  for (const row of data.market_positions ?? []) {
    if (!row.ticker || !row.ticker.includes("15M")) continue;
    const pos = Number.parseFloat(row.position_fp ?? "0");
    const cost = Number.parseFloat(row.market_exposure_dollars ?? "0");
    if (Number.isFinite(pos) && Math.abs(pos) >= 0.01) rows.push({ ticker: row.ticker, pos, cost: Number.isFinite(cost) ? Math.abs(cost) : 0 });
  }
  return rows;
}
let entryGate = Promise.resolve();
function symbolOf(ticker) {
  if (ticker.includes("BTC")) return "btc";
  if (ticker.includes("GOLD")) return "gold";
  if (ticker.includes("ETH")) return "eth";
  if (ticker.includes("SOL")) return "sol";
  if (ticker.includes("WTI")) return "wti";
  if (ticker.includes("NATGAS")) return "natgas";
  if (ticker.includes("SILVER")) return "silver";
  return ticker;
}
async function place(ticker, bookSide, yesPrice, count, reduceOnly, line, adding = false) {
  if (!reduceOnly) {
    let release2 = () => {
    };
    const previous = entryGate;
    entryGate = new Promise((resolve) => {
      release2 = resolve;
    });
    await previous;
    try {
      if (!adding && doneSet().has(ticker)) return null;
      const open = await fifteenOpen();
      if (open.some((row) => symbolOf(row.ticker) === symbolOf(ticker) && row.ticker !== ticker)) return null;
      return await sendOrder(ticker, bookSide, yesPrice, count, false, line, adding);
    } finally {
      release2();
    }
  }
  return sendOrder(ticker, bookSide, yesPrice, count, true);
}
const heldSymbol = /* @__PURE__ */ new Map();
async function symbolOpen(sym) {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=100&count_filter=position");
  if (!res.ok) return null;
  const data = await res.json();
  for (const row of data.market_positions ?? []) {
    if (!row.ticker || !row.ticker.includes("15M") || symbolOf(row.ticker) !== sym) continue;
    const pos = Number.parseFloat(row.position_fp ?? "0");
    if (Number.isFinite(pos) && Math.abs(pos) >= 0.01) return true;
  }
  return false;
}
const FIRE_PATH = join(process.cwd(), "data", "firewall.json");
const SIZE_PATH = join(process.cwd(), "data", "live-size.json");
const FIRED_PATH = join(process.cwd(), "data", "fired.json");
function prime75() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "book-mode.json"), "utf8")).mode === "prime75";
  } catch {
    return false;
  }
}
function liveDollars() {
  try {
    const n = Number(JSON.parse(readFileSync(SIZE_PATH, "utf8")).dollars);
    if (n >= 1 && n <= 100) return n;
  } catch {
  }
  return 50;
}
function writeLiveDollars(dollars) {
  const n = Math.max(1, Math.min(100, Math.round(dollars * 10) / 10));
  let prev = {};
  try {
    prev = JSON.parse(readFileSync(SIZE_PATH, "utf8"));
  } catch {
    prev = {};
  }
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(SIZE_PATH, JSON.stringify({ ...prev, dollars: n }));
  } catch {
  }
}
function noteGate(ticker, stage, ok, reason) {
  const row = { at: (/* @__PURE__ */ new Date()).toISOString(), ticker, stage, ok, reason };
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    const path = join(process.cwd(), "data", "firewall-check.json");
    let prev = [];
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8"));
      if (Array.isArray(parsed)) prev = parsed;
    } catch {
      prev = [];
    }
    writeFileSync(path, JSON.stringify([row, ...prev].slice(0, 80)));
  } catch {
  }
}
function firedSet() {
  try {
    const disk = JSON.parse(readFileSync(FIRED_PATH, "utf8"));
    return new Set(Array.isArray(disk) ? disk : []);
  } catch {
    return /* @__PURE__ */ new Set();
  }
}
function fireOnce(ticker) {
  const set = firedSet();
  set.add(ticker);
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(FIRED_PATH, JSON.stringify([...set]));
  } catch {
  }
}
async function freshLine(ticker) {
  const inst = ticker.includes("GOLD") ? "XAU-USDT-SWAP" : ticker.includes("BTC") ? "BTC-USDT-SWAP" : "";
  if (!inst) return null;
  try {
    const [tape, market] = await Promise.all([
      fetch(`https://www.okx.com/api/v5/market/candles?instId=${inst}&bar=1m&limit=60`).then((res) => res.json()),
      kalshi("GET", `/trade-api/v2/markets/${ticker}`).then((res) => res.json())
    ]);
    const rows = Array.isArray(tape?.data) ? tape.data : [];
    let pv = 0;
    let vol = 0;
    let spot = 0;
    for (const row of rows) {
      const high = Number(row[2]);
      const low = Number(row[3]);
      const close = Number(row[4]);
      const size = Number(row[5]) || 1;
      pv += (high + low + close) / 3 * size;
      vol += size;
      if (!spot) spot = close;
    }
    let dev = 0;
    const vwap = pv / vol;
    for (const row of rows) {
      const typical = (Number(row[2]) + Number(row[3]) + Number(row[4])) / 3;
      const size = Number(row[5]) || 1;
      dev += (typical - vwap) ** 2 * size;
    }
    const target = Number(market?.market?.floor_strike);
    if (!(spot > 0) || !(vol > 0) || !(target > 0)) return null;
    return { spot, vwap, target, stdev: Math.sqrt(dev / vol) };
  } catch {
    return null;
  }
}
function towardBand(spot, vwap, stdev) {
  const width = Math.max(stdev || 0, vwap * 0.00015);
  let best = Math.abs(spot - vwap);
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) {
    best = Math.min(best, Math.abs(spot - (vwap + step * width)), Math.abs(spot - (vwap - step * width)));
  }
  return Math.max(0, Math.min(1, 1 - best / (width * 0.5)));
}
function wireBreaks(line, bookSide, asset) {
  if (!line || !(line.spot > 0) || !(line.vwap > 0) || !(line.target > 0)) {
    return "Blocked. The VWAP could not be read, so the order was not sent.";
  }
  const spot = line.spot;
  const vwap = line.vwap;
  const target = line.target;
  const side = bookSide === "bid" || bookSide === "up" ? "up" : "down";
  const stdev = Number(line.stdev);
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) {
    return "Blocked. The bands could not be read, so the order was not sent.";
  }
  const near = bandReach(String(asset || ""), stdev);
  const levels = [vwap];
  for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * stdev, vwap - step * stdev);
  if (side === "up" && levels.some((level) => level > spot && level - spot <= near)) {
    return "Blocked. A VWAP band is above. The long was not sent.";
  }
  if (side === "down" && levels.some((level) => level < spot && spot - level <= near)) {
    return "Blocked. A VWAP band is below. The short was not sent.";
  }
  if (!line.label || !winningSetup(line.label, side, asset)) return "Blocked. That setup is not a winner.";
  const spineName = /btc|gold|silver/i.test(String(asset));
  const bandBreak = /close below|tap-reject|broke/i.test(String(line.label || ""));
  if (!spineName) {
    const onTarget = shortBandOnTarget(asset, side, target, vwap, line.stdev, spot);
    if (onTarget) return onTarget;
  }
  const above = spot > vwap && target > vwap;
  const below = spot < vwap && target < vwap;
  const longCross = side === "up" && spot < vwap && target > vwap;
  if (side === "down" && spot > vwap && target < vwap && !bandBreak) return "Blocked. A short has to cross the VWAP.";
  if (side === "down" && spot > target && above && !shortTap(line.label, side)) return "Blocked. Price and the target are above the VWAP. A short is not allowed.";
  if (side === "up" && spot < target && below) return "Blocked. Price and the target are below the VWAP. A long is not allowed.";
  if (longCross) return "Blocked. A long has to cross the main VWAP to reach the target.";
  if (spot < vwap && side === "up" && !shortTap(line.label, side)) return "Blocked. Price is under the VWAP. A long is not allowed.";
  if (spot > vwap && side === "down" && !(target < vwap) && !shortTap(line.label, side)) return "Blocked. Price is over the VWAP. A short is not allowed.";
  const alive = survivalBlock(spot, vwap, line.stdev, side, line.label, target, asset);
  if (alive) return alive;
  if (!spineName) {
    const width = Math.max(line.stdev || 0, vwap * 0.00015);
    const pad = vwap > 20000 ? Math.max(25, width * 0.12) : Math.max(vwap * 0.0004, width * 0.2);
    const levels = [vwap];
    for (const step of [0.5, 1, 1.5, 2, 2.5, 3]) levels.push(vwap + step * width, vwap - step * width);
    const blocked = levels.some((level) => {
      if (Math.abs(level - target) <= pad || Math.abs(level - spot) <= pad) return false;
      if (side === "down" && level === vwap) return false;
      return side === "down" ? spot > level && target < level : spot < level && target > level;
    });
    if (blocked) return "Blocked. A VWAP band sits between price and the target.";
  }
  return null;
}
async function sendOrder(ticker, bookSide, yesPrice, count, reduceOnly, sameLine, adding = false) {
  if (!reduceOnly) {
    try {
      const halt = JSON.parse(readFileSync(join(process.cwd(), "data", "halt.json"), "utf8"));
      if (halt.off === true) return null;
    } catch {
    }
  }
  const sym = symbolOf(ticker);
  if (!reduceOnly) {
    if (!adding && (firedSet().has(ticker) || doneSet().has(ticker))) {
      noteGate(ticker, "before", false, "already fired");
      return null;
    }
    if (!adding) {
      const live = await symbolOpen(sym);
      if (live === null || live) {
        noteGate(ticker, "before", false, live ? "symbol already open" : "could not read positions");
        return null;
      }
      const memory = heldSymbol.get(sym);
      if (memory != null && Date.now() - memory < 8000) {
        noteGate(ticker, "before", false, "too soon");
        return null;
      }
    }
    heldSymbol.set(sym, Date.now());
    const line = sameLine && sameLine.vwap > 0 ? sameLine : await freshLine(ticker);
    const broken = line ? wireBreaks(line, bookSide, sym) : "Blocked. The VWAP could not be read, so the order was not sent.";
    if (broken) {
      noteGate(ticker, "before", false, broken);
      heldSymbol.delete(sym);
      try {
        const file = join(process.cwd(), "data", "alarm.json");
        const prev = JSON.parse(readFileSync(file, "utf8"));
        const text = `RED: ${broken}`;
        const rows = Array.isArray(prev) ? prev : [];
        if (!rows.some((row) => row.text === text && Date.now() - Date.parse(row.at) < 10 * 6e4)) {
          rows.unshift({ at: (/* @__PURE__ */ new Date()).toISOString(), text });
          writeFileSync(file, JSON.stringify(rows.slice(0, 20)));
        }
      } catch {
        writeFileSync(join(process.cwd(), "data", "alarm.json"), JSON.stringify([{ at: (/* @__PURE__ */ new Date()).toISOString(), text: `RED: ${broken}` }]));
      }
      return null;
    }
    noteGate(ticker, "before", true, "clear");
  } else {
    const pos = await signedPosition(ticker);
    const qty = Number.parseFloat(count);
    if (bookSide === "ask" && !(pos > 0)) return null;
    if (bookSide === "bid" && !(pos < 0)) return null;
    if (!(qty > 0) || qty > Math.abs(pos) + 1e-3) return null;
  }
  const res = await kalshi("POST", "/trade-api/v2/portfolio/events/orders", "", {
    ticker,
    client_order_id: randomUUID(),
    side: bookSide,
    count,
    price: money(yesPrice),
    time_in_force: "immediate_or_cancel",
    self_trade_prevention_type: "taker_at_cross",
    post_only: false,
    reduce_only: reduceOnly,
    cancel_order_on_pause: true,
    exchange_index: 2
  });
  if (!res.ok) {
    if (!reduceOnly) heldSymbol.delete(sym);
    const text = await res.text();
    noteGate(ticker, "after", false, text.slice(0, 140) || "rejected");
    throw new Error(text.slice(0, 180));
  }
  const data = await res.json();
  const filled = Number.parseFloat(data.fill_count ?? "0");
  if (!data.order_id || !(filled > 0)) {
    if (!reduceOnly) {
      heldSymbol.delete(sym);
      noteGate(ticker, "after", false, "unfilled");
    }
    return null;
  }
  if (!reduceOnly && !adding) fireOnce(ticker);
  const yes = Number.parseFloat(data.average_fill_price ?? "") || yesPrice;
  if (!reduceOnly) {
    const again = await symbolOpen(sym);
    const rows = await fifteenOpen();
    const same = rows.filter((row) => symbolOf(row.ticker) === sym);
    if (!again || same.length > 1) {
      noteGate(ticker, "after", false, "position did not match one open trade");
    } else {
      noteGate(ticker, "after", true, "one position");
    }
  }
  return { orderId: data.order_id, filled, yesPrice: yes };
}
const sided = globalThis;
const LOCK_PATH = "/workspace/.secrets/side-lock.json";
function locks() {
  let disk = {};
  try {
    disk = JSON.parse(readFileSync(LOCK_PATH, "utf8"));
  } catch {
    disk = {};
  }
  if (!sided.__aureliusSide) sided.__aureliusSide = {};
  const next = {};
  for (const [ticker, side] of Object.entries(disk)) next[ticker] = side;
  sided.__aureliusSide = next;
  return sided.__aureliusSide;
}
function lockSide(ticker, side, force = false) {
  const book = locks();
  if (book[ticker] === side) return;
  if (book[ticker] && !force) return;
  book[ticker] = side;
  try {
    writeFileSync(LOCK_PATH, JSON.stringify(book));
  } catch {
  }
}
function unlockSide(ticker) {
  const book = locks();
  if (!book[ticker]) return;
  delete book[ticker];
  try {
    writeFileSync(LOCK_PATH, JSON.stringify(book));
  } catch {
  }
}
function allLocks() {
  return { ...locks() };
}
function sideLock(ticker) {
  return locks()[ticker] ?? null;
}
async function openingSide(ticker) {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/fills", `?limit=80&ticker=${encodeURIComponent(ticker)}`);
  if (!res.ok) return sideLock(ticker);
  const data = await res.json();
  const fills = (data.fills ?? []).filter((f) => f.ticker === ticker).sort((a, b) => Date.parse(a.created_time ?? "") - Date.parse(b.created_time ?? ""));
  const first = fills[0];
  if (!first?.action || !first.side) return sideLock(ticker);
  if (first.action === "buy" && first.side === "yes") return "up";
  if (first.action === "sell" && first.side === "yes") return "down";
  if (first.action === "buy" && first.side === "no") return "down";
  if (first.action === "sell" && first.side === "no") return "down";
  return sideLock(ticker);
}
const sent = globalThis;
const finishedMem = globalThis;
const DONE_PATH = "/workspace/.secrets/side-done.json";
function doneSet() {
  let disk = [];
  try {
    const parsed = JSON.parse(readFileSync(DONE_PATH, "utf8"));
    if (Array.isArray(parsed)) disk = parsed.filter((ticker) => typeof ticker === "string");
  } catch {
    disk = [];
  }
  const set = new Set(disk);
  finishedMem.__aureliusDone = set;
  return set;
}
function releaseTicker(ticker) {
  heldSymbol.delete(symbolOf(ticker));
  const fired = firedSet();
  fired.delete(ticker);
  try {
    writeFileSync(FIRED_PATH, JSON.stringify([...fired]));
  } catch {
  }
  const done = doneSet();
  done.delete(ticker);
  try {
    writeFileSync(DONE_PATH, JSON.stringify([...done]));
  } catch {
  }
  finishedMem.__aureliusDone?.delete(ticker);
  unlockSide(ticker);
  const seals = readSeals();
  delete seals[symbolOf(ticker)];
  try {
    writeFileSync(SEAL_PATH, JSON.stringify(seals));
  } catch {
  }
}
function markDone(ticker) {
  const done = doneSet();
  done.add(ticker);
  try {
    writeFileSync(DONE_PATH, JSON.stringify([...done]));
  } catch {
  }
}
const SEAL_PATH = join(process.cwd(), "data", "order-seal.json");
const SEAL_MS = 30 * 60 * 1e3;
function readSeals() {
  try {
    const parsed = JSON.parse(readFileSync(SEAL_PATH, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function windowClose(ticker) {
  const match = ticker.match(/(\d{2})([A-Z]{3})(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const months = {
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11
  };
  const month = months[match[2]];
  if (month == null) return null;
  const year = 2e3 + Number(match[1]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const guess = Date.UTC(year, month, day, hour + 4, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(guess));
  const gotH = Number(parts.find((part) => part.type === "hour")?.value);
  const gotM = Number(parts.find((part) => part.type === "minute")?.value);
  return guess - (gotH * 60 + gotM - (hour * 60 + minute)) * 6e4;
}
function sealBlocks(ticker) {
  const row = readSeals()[symbolOf(ticker)];
  if (!row?.ticker) return false;
  if (row.ticker === ticker) return true;
  const close = windowClose(row.ticker);
  return close != null && Date.now() < close;
}
function writeSeal(ticker, side) {
  const all = readSeals();
  all[symbolOf(ticker)] = { ticker, side, at: (/* @__PURE__ */ new Date()).toISOString() };
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(SEAL_PATH, JSON.stringify(all));
}
function hold(key) {
  if (!(sent.__aureliusSent instanceof Map)) sent.__aureliusSent = /* @__PURE__ */ new Map();
  const book = sent.__aureliusSent;
  const at = book.get(key);
  if (at != null && Date.now() - at < 12000) return false;
  book.set(key, Date.now());
  return true;
}
function release(key) {
  sent.__aureliusSent?.delete(key);
}
async function liveAsks(ticker) {
  const res = await fetch(`${ROOT}/trade-api/v2/markets/${ticker}`);
  if (!res.ok) return null;
  const data = await res.json();
  const yes = Number.parseFloat(data.market?.yes_ask_dollars ?? "");
  const no = Number.parseFloat(data.market?.no_ask_dollars ?? "");
  if (!(yes > 0) || !(no > 0)) return null;
  return { yesAsk: yes, noAsk: no };
}
async function enterLive(side, ticker, yesAsk, noAsk, dollars = LIVE_DOLLARS, opts) {
  const spot = opts?.line?.spot;
  const vwap = opts?.line?.vwap;
  if (!(spot > 0) || !(vwap > 0)) return { status: "blocked", reason: "vwap unread" };
  const target = Number(opts?.line?.target);
  const band = shortTap(opts?.line?.label, side);
  const under = target > 0 && spot < vwap && target < vwap;
  if (side === "up" && spot < vwap && !(band && under) || side === "down" && spot > vwap && !band) {
    return { status: "blocked", reason: "wrong side of vwap" };
  }
  const alive = survivalBlock(spot, vwap, opts?.line?.stdev || 0, side, opts?.line?.label, opts?.line?.target || 0, symbolOf(ticker));
  if (alive) return { status: "blocked", reason: alive };
  try {
    const cap = Number(JSON.parse(readFileSync(SIZE_PATH, "utf8")).dollars);
    if (cap >= 1 && cap <= 100) dollars = Math.min(Number(dollars) || cap, cap);
  } catch {
  }
  const label = opts?.line?.label;
  if (!label || !winningSetup(label, side, symbolOf(ticker))) {
    return { status: "blocked", reason: "not on the prime book" };
  }
  if (opts?.add || doneSet().has(ticker) || sideLock(ticker) || sealBlocks(ticker)) {
    return { status: "blocked", reason: "opposite" };
  }
  const open = await fifteenOpen();
  const same = open.filter((row) => symbolOf(row.ticker) === symbolOf(ticker));
  if (same.length > 0) {
    const here = same.find((row) => row.ticker === ticker);
    if (here) {
      lockSide(ticker, here.pos > 0 ? "up" : "down");
      markDone(ticker);
    }
    return { status: "blocked", reason: "opposite" };
  }
  const key = `${ticker}:${side}`;
  if (!hold(key)) return { status: "blocked", reason: "opposite" };
  const px = side === "up" ? yesAsk : noAsk;
  const multiple = px > 0.02 ? 1 / px : 1;
  if (shortTap(label, side) && multiple > 2.8) {
    release(key);
    return { status: "blocked", reason: "multiple" };
  }
  if (multiple >= 5) dollars = Math.max(1, Math.round(dollars * 0.25 * 100) / 100);
  else if (multiple >= 3) dollars = Math.max(1, Math.round(dollars * 0.5 * 100) / 100);
  const cheap = multiple < 5;
  const whole = dollars >= 10;
  if (cheap && whole && dollars < 10) {
    release(key);
    return { status: "blocked", reason: "small" };
  }
  try {
    const books = await kalshiBooks();
    const covered = Number(books?.tradable);
    if (Number.isFinite(covered) && covered + 1e-9 < dollars) dollars = Math.floor(covered * 100) / 100;
    if (cheap && whole && dollars < 10) {
      release(key);
      return { status: "blocked", reason: covered >= 10 ? "small" : "cash" };
    }
    const quote = await liveAsks(ticker);
    const yes = quote?.yesAsk ?? yesAsk;
    const no = quote?.noAsk ?? noAsk;
    const target = Number(opts?.line?.target);
    const left = Number(opts?.secondsLeft);
    const through = side === "down" ? spot < target : spot > target;
    const clear = winningSetup(opts?.line?.label, side, symbolOf(ticker));
    const tap = shortTap(opts?.line?.label, side);
    const cap = tap ? 0.833 : left <= 480 && through && clear ? 0.833 : 0.74;
    const floor = Math.round((1 - cap) * 100) / 100;
    if (side === "up") {
      let quoteYes = yes;
      let filled = 0;
      let paid = 0;
      let orderId = "";
      let spent = 0;
      for (let i = 0; i < 16 && dollars - spent >= (cheap && whole ? 10 : 1); i += 1) {
        const px = Math.min(cap, Math.round((quoteYes + 0.02) * 100) / 100);
        if (!(px + 1e-9 >= quoteYes)) break;
        const count = contractsFor(px, dollars - spent);
        if (!count) break;
        let placed = null;
        try {
          placed = await place(ticker, "bid", px, count, false, opts?.line, true);
        } catch {
          break;
        }
        if (!placed) {
          quoteYes = Math.min(cap, Math.round((quoteYes + 0.02) * 100) / 100);
          continue;
        }
        spent += placed.filled * placed.yesPrice;
        filled += placed.filled;
        paid = placed.yesPrice;
        orderId = placed.orderId;
        const next = await liveAsks(ticker);
        quoteYes = next?.yesAsk ?? quoteYes;
      }
      if (!(filled > 0)) {
        release(key);
        return { status: "blocked", reason: "unfilled" };
      }
      if (paid > 0.02 && 1 / paid < 5 && whole && spent + 1e-9 < 10) {
        await flattenTicker(ticker);
        release(key);
        return { status: "blocked", reason: "small" };
      }
      lockSide(ticker, "up");
      markDone(ticker);
      fireOnce(ticker);
      writeSeal(ticker, "up");
      return { status: "filled", orderId, filled, yesPrice: paid, paid };
    }
    let quoteNo = no;
    let filled = 0;
    let paid = 0;
    let orderId = "";
    let spent = 0;
    let yesPrice = 0;
    for (let i = 0; i < 6 && dollars - spent >= (cheap && whole ? 10 : 1); i += 1) {
      const yesBid = Math.min(0.97, Math.max(floor, Math.round((1 - quoteNo - 0.02) * 100) / 100));
      if (yesBid > 1 - quoteNo + 0.001) break;
      const paidNo = Math.round((1 - yesBid) * 1e4) / 1e4;
      const count = contractsFor(paidNo, dollars - spent);
      if (!count) break;
      let placed = null;
      try {
        placed = await place(ticker, "ask", yesBid, count, false, opts?.line, true);
      } catch {
        break;
      }
      if (!placed) {
        quoteNo = Math.min(cap, Math.round((quoteNo + 0.02) * 100) / 100);
        continue;
      }
      const got = Math.round((1 - placed.yesPrice) * 1e4) / 1e4;
      spent += placed.filled * got;
      filled += placed.filled;
      paid = got;
      yesPrice = placed.yesPrice;
      orderId = placed.orderId;
      const next = await liveAsks(ticker);
      quoteNo = Math.max(quoteNo, next?.noAsk ?? quoteNo);
    }
    if (!(filled > 0)) {
      release(key);
      return { status: "blocked", reason: "unfilled" };
    }
    if (paid > 0.02 && 1 / paid < 5 && whole && spent + 1e-9 < 10) {
      await flattenTicker(ticker);
      release(key);
      return { status: "blocked", reason: "small" };
    }
    lockSide(ticker, "down");
    markDone(ticker);
    fireOnce(ticker);
    writeSeal(ticker, "down");
    return { status: "filled", orderId, filled, yesPrice, paid };
  } catch (err) {
    release(key);
    throw err;
  }
}
async function clearResting(ticker) {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/orders", "?limit=40");
  if (!res.ok) return;
  const data = await res.json();
  for (const order of data.orders ?? []) {
    if (order.ticker !== ticker || order.status !== "resting" || !order.order_id) continue;
    if (order.client_order_id) continue;
    await cancelOrder(order.order_id, ticker);
  }
}
async function closeAtBand(trade, yesBid, yesAsk, force = false, protect = false, floorPct) {
  await clearResting(trade.ticker);
  const pos = await signedPosition(trade.ticker);
  const qty = Math.floor(Math.abs(pos) * 100) / 100;
  if (qty < 0.01) return null;
  const raw = Number.isFinite(floorPct) ? Math.round(floorPct) : 45;
  const need = (raw < 35 ? Math.max(19, raw) : Math.min(65, Math.max(35, raw))) / 100;
  const bump = 1 + need;
  const floor = Math.round(profitPrice(trade, need) * 100) / 100;
  if (trade.side === "up") {
    if (pos <= 0) return null;
    const entry = Math.max(trade.ask || 0, trade.contracts > 0 && trade.stake > 0 ? trade.stake / trade.contracts : 0);
    const px2 = Math.max(yesBid, 0);
    if (!(px2 > 0.05)) return null;
    if (!force && (!(entry > 0.08) || px2 + 1e-9 < entry * bump)) return null;
    if (protect && !(px2 > trade.ask)) return null;
    if (px2 * qty + 1e-6 < trade.stake * 0.5) return null;
    const placed2 = await place(trade.ticker, "ask", px2, qty.toFixed(2), true);
    await clearResting(trade.ticker);
    if (!placed2) return null;
    return Math.round(placed2.filled * placed2.yesPrice * 100) / 100;
  }
  if (pos >= 0) return null;
  const bid = Number.isFinite(yesBid) ? yesBid : 0;
  const ask = Number.isFinite(yesAsk) ? yesAsk : bid;
  const wide = ask - bid > 0.15;
  const px = Math.min(0.99, force ? Math.max(bid, ask) : wide ? bid + 0.05 : Math.max(bid, ask));
  if (!(px > 0) || !force && wide && px <= bid) return null;
  const shortEntry = Math.max(trade.ask || 0, trade.contracts > 0 && trade.stake > 0 ? trade.stake / trade.contracts : 0);
  if (!force && (!(shortEntry > 0.08) || 1 - px + 1e-9 < shortEntry * bump)) return null;
  if (protect && !(1 - px > trade.ask)) return null;
  if ((1 - px) * qty + 1e-6 < trade.stake * 0.5) return null;
  const placed = await place(trade.ticker, "bid", px, qty.toFixed(2), true);
  await clearResting(trade.ticker);
  if (!placed) return null;
  return Math.round(placed.filled * (1 - placed.yesPrice) * 100) / 100;
}
const AUTO_PATH = join(process.cwd(), "data", "autosell.json");
async function cancelOrder(orderId, ticker) {
  const path = `/trade-api/v2/portfolio/events/orders/${orderId}`;
  await kalshi("DELETE", path, `?market_ticker=${encodeURIComponent(ticker)}&exchange_index=-1`);
}
async function restAutoSell(trade, floorPct) {
  void trade;
  void floorPct;
}
const OUTSIDE_PATH = join(process.cwd(), "data", "outside-orders.json");
function readOutside() {
  try {
    const parsed = JSON.parse(readFileSync(OUTSIDE_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
async function outsideOrders() {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/orders", "?limit=40");
  if (!res.ok) return [];
  const data = await res.json();
  const rows = [];
  const lines = [];
  for (const order of data.orders ?? []) {
    if (!order.ticker?.includes("15M")) continue;
    if (order.client_order_id) continue;
    const age = Date.now() - Date.parse(order.created_time ?? "");
    if (!Number.isFinite(age) || age > 6 * 60 * 60 * 1e3) continue;
    const qty = order.fill_count_fp && Number(order.fill_count_fp) > 0 ? order.fill_count_fp : order.initial_count_fp ?? "";
    rows.push({
      at: order.created_time ?? "",
      ticker: order.ticker,
      action: order.action ?? "",
      side: order.side ?? "",
      qty,
      yes: order.yes_price_dollars ?? "",
      status: order.status ?? ""
    });
    if (age <= 3 * 60 * 1e3 || order.status === "resting") {
      lines.push(
        `RED: No desk id. ${order.ticker} ${order.action ?? ""} ${order.side ?? ""} ${qty} at ${(order.created_time ?? "").slice(11, 19)} (${order.status ?? "open"}).`
      );
    }
    if (order.status === "executed" && order.action === "sell" && order.ticker) {
      const prev = readSeals()[symbolOf(order.ticker)];
      const soldAt = Date.parse(order.created_time ?? "");
      if (!prev?.at || Date.parse(prev.at) < soldAt) {
        const all = readSeals();
        all[symbolOf(order.ticker)] = {
          ticker: order.ticker,
          side: order.side === "no" ? "down" : "up",
          at: order.created_time ?? (/* @__PURE__ */ new Date()).toISOString()
        };
        try {
          mkdirSync(join(process.cwd(), "data"), { recursive: true });
          writeFileSync(SEAL_PATH, JSON.stringify(all));
        } catch {
        }
      }
    }
  }
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(OUTSIDE_PATH, JSON.stringify(rows));
  } catch {
  }
  return lines;
}
async function kickForbidden() {
  return;
}
async function watchAccount(trades) {
  try {
    await kickForbidden();
  } catch {
  }
  const open = await fifteenOpen();
  const nets = await settlementProfits();
  const alerts = [];
  const mismatches = [];
  try {
    alerts.push(...await outsideOrders());
  } catch {
  }
  const btc = open.filter((row) => symbolOf(row.ticker) === "btc");
  const gold = open.filter((row) => symbolOf(row.ticker) === "gold");
  for (const row of open) {
    try {
      await clearResting(row.ticker);
    } catch {
    }
  }
  if (btc.length > 1) alerts.push(`RED: ${btc.length} Bitcoin positions are open at once.`);
  if (gold.length > 1) alerts.push(`RED: ${gold.length} gold positions are open at once.`);
  for (const row of gold) {
    const line = await freshLine(row.ticker);
    if (!line) {
      alerts.push("RED: Gold is open and the VWAP could not be read.");
      continue;
    }
    const side = row.pos > 0 ? "bid" : "ask";
    const broken = wireBreaks(line, side, "gold");
    if (broken) alerts.push(`RED: ${broken} ${row.ticker} is still open.`);
  }
  for (const row of open) {
    const side = row.pos > 0 ? "up" : "down";
    const locked = sideLock(row.ticker);
    const banked = trades.find(
      (t) => t.source === "live" && t.venue !== "polymarket" && t.ticker === row.ticker && t.result !== "open" && (t.profit ?? 0) > 0
    );
    if (banked && banked.side !== side) {
      alerts.push(
        `RED: ${row.ticker} opened ${side.toUpperCase()} after ${banked.side.toUpperCase()} banked $${banked.profit}.`
      );
    } else if (locked && locked !== side) {
      alerts.push(`RED: ${row.ticker} is ${side.toUpperCase()} after it was sealed ${locked.toUpperCase()}.`);
    }
  }
  for (const trade of trades) {
    if (trade.source !== "live" || trade.venue === "polymarket" || trade.result === "open" || trade.profit == null) continue;
    const net = nets.get(trade.ticker);
    if (net == null || Math.abs(trade.profit - net) <= 0.5) continue;
    mismatches.push(`${trade.ticker} shows $${trade.profit.toFixed(2)} on the desk and $${net.toFixed(2)} on Kalshi.`);
  }
  try {
    const logged = JSON.parse(readFileSync(join(process.cwd(), "data", "exit-log.json"), "utf8"));
    if (Array.isArray(logged)) {
      for (const row of logged) {
        const age = Date.now() - Date.parse(row.at ?? "");
        if (!Number.isFinite(age) || age > 2 * 60 * 60 * 1e3) continue;
        if (row.line) {
          alerts.push(row.line);
        } else if (row.short) {
          alerts.push(
            `RED: ${row.ticker} sold under its target. Bid was ${row.bidPct ?? "?"}% and the target was ${row.targetPct ?? "?"}%.`
          );
        } else if (row.reason === "salvage-missed") {
          alerts.push(`RED: ${row.ticker} was a sure loss and did not cash out.`);
        } else if (typeof row.profit === "number" && row.profit < 0 && row.reason !== "salvage" && age < 30 * 60 * 1e3) {
          alerts.push(`RED: ${row.ticker} was sold while it was negative.`);
        }
      }
    }
  } catch {
  }
  for (const trade of trades) {
    if (trade.result !== "open" || trade.source === "live" || trade.probe || !trade.ticker?.includes("15M")) continue;
    const sym = symbolOf(trade.ticker);
    if (open.some((row) => symbolOf(row.ticker) === sym)) continue;
    const seal = readSeals()[sym];
    const sealed = seal?.at != null && Date.now() - Date.parse(seal.at) < SEAL_MS;
    const paperAge = Date.now() - Date.parse(trade.openedAt);
    if (!sealed && paperAge > 9e4) {
      alerts.push(`RED: Paper ${sym.toUpperCase()} ${trade.side.toUpperCase()} filled and Kalshi did not.`);
    }
  }
  for (const line of betweenFlags()) alerts.push(line);
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(
      join(process.cwd(), "data", "red-alert.json"),
      JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), alerts, mismatches, open })
    );
  } catch {
  }
  try {
    const cash = await kalshiCash();
    if (cash != null) rememberKalshiCash(cash);
  } catch {
  }
}
const CASH_PATH = join(process.cwd(), "data", "kalshi-cash.json");
function readKalshiCash() {
  try {
    const parsed = JSON.parse(readFileSync(CASH_PATH, "utf8"));
    return {
      cash: parsed.cash ?? null,
      anchor: parsed.anchor ?? null,
      trail: Array.isArray(parsed.trail) ? parsed.trail.filter((p) => p && Number.isFinite(p.cash)) : []
    };
  } catch {
    return { cash: null, anchor: null, trail: [] };
  }
}
async function refreshKalshiCash() {
  const cash = await kalshiCash();
  if (cash != null && cash >= 0) rememberKalshiCash(cash);
  return readKalshiCash();
}
function rememberKalshiCash(cash) {
  const book = readKalshiCash();
  if (book.anchor == null) book.anchor = cash;
  book.cash = cash;
  const last = book.trail[book.trail.length - 1];
  const age = last ? Date.now() - Date.parse(last.t) : Infinity;
  if (!last || Math.abs(last.cash - cash) >= 0.01 || age > 2e4) {
    book.trail.push({ t: (/* @__PURE__ */ new Date()).toISOString(), cash });
  }
  book.trail = book.trail.slice(-400);
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(CASH_PATH, JSON.stringify(book));
  } catch {
  }
}
async function flattenLive(trade, yesBid, yesAsk) {
  let pct = 45;
  try {
    const n = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "trail-floor.json"), "utf8")).pct);
    if (Number.isFinite(n)) pct = Math.min(65, Math.max(35, Math.round(n)));
  } catch {
    pct = 45;
  }
  return closeAtBand(trade, yesBid, yesAsk, true, false, pct);
}
let lastHeldRows = [];
async function heldFifteens() {
  const rows = [];
  let cursor = "";
  for (let page = 0; page < 6; page += 1) {
    const query = `?limit=200&count_filter=position${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const res = await kalshi("GET", "/trade-api/v2/portfolio/positions", query);
    if (!res.ok) return lastHeldRows;
    const data = await res.json();
    for (const row of data.market_positions ?? []) {
      if (!row.ticker || !String(row.ticker).includes("15M")) continue;
      const pos = Number.parseFloat(row.position_fp ?? row.position ?? "0");
      const cost = Number.parseFloat(row.market_exposure_dollars ?? "0");
      if (Number.isFinite(pos) && Math.abs(pos) >= 0.01) {
        rows.push({ ticker: row.ticker, pos, cost: Number.isFinite(cost) ? cost : 0 });
      }
    }
    if (!data.cursor) break;
    cursor = data.cursor;
  }
  lastHeldRows = rows;
  return rows;
}
async function restingFifteens() {
  const res = await kalshi("GET", "/trade-api/v2/portfolio/orders", "?status=resting&limit=50");
  if (!res.ok) return [];
  const data = await res.json();
  const rows = [];
  for (const order of data.orders ?? []) {
    if (!order.ticker || !order.ticker.includes("15M") || order.status !== "resting") continue;
    if (order.action === "sell") continue;
    const contracts = Number.parseFloat(order.remaining_count_fp ?? order.initial_count_fp ?? "0");
    const yes = Number.parseFloat(order.yes_price_dollars ?? "0");
    if (!(contracts >= 0.01) || !(yes > 0)) continue;
    const side = order.side === "no" ? "down" : "up";
    const px = side === "up" ? yes : Math.max(0.01, 1 - yes);
    rows.push({
      ticker: order.ticker,
      side,
      contracts,
      cost: Math.round(contracts * px * 100) / 100,
    });
  }
  return rows;
}
async function flattenTicker(ticker) {
  let payout = 0;
  for (let guard = 0; guard < 5; guard += 1) {
    const resPos = await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=100&count_filter=position");
    if (!resPos.ok) return payout > 0 ? Math.round(payout * 100) / 100 : null;
    const book = await resPos.json();
    const row = book.market_positions?.find((p) => p.ticker === ticker);
    const pos = Number.parseFloat(row?.position_fp ?? "0");
    if (!(Math.abs(pos) >= 0.01)) return payout > 0 ? Math.round(payout * 100) / 100 : null;
    const res = await fetch(`${ROOT}/trade-api/v2/markets/${ticker}`);
    if (!res.ok) return payout > 0 ? Math.round(payout * 100) / 100 : null;
    const data = await res.json();
    const yesBid = Number.parseFloat(data.market?.yes_bid_dollars ?? "0");
    const noBid = Number.parseFloat(data.market?.no_bid_dollars ?? "0");
    const qty = Math.abs(pos);
    const prices = pos > 0 ? crossBids(yesBid) : shortClosePrices(noBid);
    const bookSide = pos > 0 ? "ask" : "bid";
    let filledThis = false;
    for (const px of prices) {
      try {
        const placed = await place(ticker, bookSide, px, qty.toFixed(2), true);
        if (!placed || !(placed.filled >= 0.01)) continue;
        payout += pos > 0 ? placed.filled * placed.yesPrice : placed.filled * (1 - placed.yesPrice);
        filledThis = true;
        break;
      } catch {
        // the next price crosses further
      }
    }
    if (!filledThis) return payout > 0 ? Math.round(payout * 100) / 100 : null;
  }
  return payout > 0 ? Math.round(payout * 100) / 100 : null;
}
async function halfLive(ticker) {
  const pos = await signedPosition(ticker);
  const res = await fetch(`${ROOT}/trade-api/v2/markets/${ticker}`);
  if (!res.ok) return null;
  const data = await res.json();
  const yesBid = Number.parseFloat(data.market?.yes_bid_dollars ?? "0");
  const noBid = Number.parseFloat(data.market?.no_bid_dollars ?? "0");
  const yesAsk = Number.parseFloat(data.market?.yes_ask_dollars ?? "0");
  const plan = halfCuts(pos, yesBid, noBid, yesAsk);
  if (!plan) return null;
  await clearResting(ticker);
  for (const px of plan.prices) {
    try {
      const placed = await place(ticker, plan.bookSide, px, plan.count, true);
      if (!placed || !(placed.filled >= 0.01)) continue;
      const payout = pos > 0 ? placed.filled * placed.yesPrice : placed.filled * (1 - placed.yesPrice);
      const left = Math.round((Math.abs(pos) - placed.filled) * 100) / 100;
      return { filled: placed.filled, payout: Math.round(payout * 100) / 100, left };
    } catch {
      // the next price crosses further
    }
  }
  return null;
}
async function trimLive() {
  return null;
}
async function resizeLive(_trade, _dollars, _yesBid, _yesAsk) {
  return null;
}
export {
  allLocks,
  closeAtBand,
  enterLive,
  flattenLive,
  flattenTicker,
  halfLive,
  heldFifteens,
  restingFifteens,
  kalshiArmed,
  kalshiCash,
  refreshKalshiCash,
  liveDollars,
  lockSide,
  marketResult,
  readKalshiCash,
  readOutside,
  resizeLive,
  restAutoSell,
  settlementProfits,
  sideLock,
  trimLive,
  watchAccount,
  wireBreaks,
  writeLiveDollars
};
