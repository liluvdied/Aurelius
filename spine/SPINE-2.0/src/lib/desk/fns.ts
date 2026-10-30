import { createServerFn } from "@tanstack/react-start";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readBook, writeBook } from "./book";
import { ensureEngine, sendKalshi, sendLive } from "./engine";
import { readAudit, type AuditRow } from "./audit";
import { readPolyLedger, type PolyLedger } from "./poly-ledger";
import { reasonSetup, type GrokBriefing } from "./grok";
import { scanDesk } from "./scan";
import { fetchLiveSpots, type LiveSpots } from "./ticker";
import { altBoards, type AltBoard } from "./candles";
import { readFillLog, type FillEvent } from "./fill-log";
import { readOutside, liveDollars, writeLiveDollars, type OutsideOrder } from "./kalshi-live.server";
import { listDecidedPaper, listFuelPaper, listHalfPaper, listLeanPaper, listPrimePaper, listSymbolLab, readHourCheck, readPrimeBook, readPrimeWatch, primeScore, type HourCheck, type LabRow, type LeanPaper, type PrimePaper, type PrimeRow } from "./prime-book";
import { listMirror, type MirrorRow } from "./mirror";
import { askForHelp, readWatch, writeHelp, type WatchStatus } from "./watchdog";
import { newId, clampTrail, screenBid, smallTicket } from "./paper";
import { DEFAULT_SETTINGS, type AssetSnapshot, type DeskSettings, type DeskSnapshot, type GrokCall, type Setup, type Trade } from "./types";

export const getDeskSnapshot = createServerFn({ method: "POST" })
  .validator((input: { settings?: DeskSettings } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<DeskSnapshot> => {
    ensureEngine();
    const snap = await scanDesk(data.settings ?? readBook().settings ?? DEFAULT_SETTINGS);
    try {
      const live = await import("./kalshi-live.server");
      const poly = await import("./poly-live.server");
      return {
        ...snap,
        sideLocks: live.allLocks(),
        ...(live.kalshiArmed() ? { kalshi: { armed: true, cash: await live.kalshiCash() } } : {}),
        ...(poly.polymarketArmed() ? { polymarket: { armed: true, cash: await poly.polymarketCash() } } : {}),
      };
    } catch {
      // paper keeps scanning if a key is unreadable
    }
    return snap;
  });

export const getLiveSpots = createServerFn({ method: "GET" }).handler(
  async (): Promise<LiveSpots> => {
    ensureEngine();
    return fetchLiveSpots();
  },
);

export const getAltBoards = createServerFn({ method: "GET" }).handler(async (): Promise<AltBoard[]> => {
  ensureEngine();
  return altBoards();
});

export const pullBook = createServerFn({ method: "GET" }).handler(async (): Promise<Trade[]> => {
  ensureEngine();
  return readBook().trades;
});

export const getAudit = createServerFn({ method: "GET" }).handler(async (): Promise<AuditRow[]> => {
  ensureEngine();
  return readAudit();
});

export const getKalshiCash = createServerFn({ method: "GET" }).handler(async () => {
  ensureEngine();
  const live = await import("./kalshi-live.server");
  return live.refreshKalshiCash();
});

export const getPolyLedger = createServerFn({ method: "GET" }).handler(async (): Promise<PolyLedger> => {
  ensureEngine();
  return readPolyLedger();
});

export const getPrimeBook = createServerFn({ method: "GET" }).handler(async (): Promise<PrimeRow[]> => {
  ensureEngine();
  return readPrimeBook();
});

export const getPrimeScore = createServerFn({ method: "GET" }).handler(async (): Promise<{ yes: number; no: number; open: number; allYes: number; allNo: number }> => {
  ensureEngine();
  return primeScore();
});

export const getPrimeRows = createServerFn({ method: "GET" }).handler(async (): Promise<PrimePaper[]> => {
  ensureEngine();
  return listPrimePaper();
});

export const getComboRows = createServerFn({ method: "GET" }).handler(async (): Promise<{ id: string; at: string; asset: string; side: string; pattern: string; ticker: string; route: string; dollars: number; result: string }[]> => {
  ensureEngine();
  let rows: { id: string; at: string; asset: string; side: string; pattern: string; ticker: string; route: string; dollars: number; result?: string }[] = [];
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), "data", "combo-ledger.json"), "utf8"));
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }
  const paper = readBook().trades;
  const prime = listPrimePaper();
  return rows.slice(0, 40).map((row) => {
    if (row.result === "yes" || row.result === "no") return { ...row, result: row.result };
    const hit = row.route === "prime"
      ? prime.find((item) => item.ticker === row.ticker && item.side === row.side && item.result !== "open")
      : paper.find((item) => item.ticker === row.ticker && item.side === row.side && item.source !== "live" && item.result !== "open");
    const result = hit?.result === "win" || hit?.result === "yes" ? "yes" : hit?.result === "loss" || hit?.result === "no" ? "no" : "open";
    return { ...row, result };
  });
});

export const getHalfRows = createServerFn({ method: "GET" }).handler(async (): Promise<PrimePaper[]> => {
  ensureEngine();
  return listHalfPaper();
});

export const getDecidedRows = createServerFn({ method: "GET" }).handler(async (): Promise<PrimePaper[]> => {
  ensureEngine();
  return listDecidedPaper();
});

export const getPrimeWatch = createServerFn({ method: "GET" }).handler(async (): Promise<{ at: string; note: Record<string, string> }> => {
  ensureEngine();
  return readPrimeWatch();
});

export const getLeanRows = createServerFn({ method: "GET" }).handler(async (): Promise<LeanPaper[]> => {
  ensureEngine();
  return listLeanPaper();
});

export const getFuelRows = createServerFn({ method: "GET" }).handler(async (): Promise<PrimePaper[]> => {
  ensureEngine();
  return listFuelPaper();
});

export const getSymbolLab = createServerFn({ method: "GET" }).handler(async (): Promise<{ rows: LabRow[]; check: HourCheck }> => {
  ensureEngine();
  return { rows: listSymbolLab(), check: readHourCheck() };
});

export const getMirrorSheet = createServerFn({ method: "GET" }).handler(async (): Promise<MirrorRow[]> => {
  ensureEngine();
  return listMirror();
});

export const getOutside = createServerFn({ method: "GET" }).handler(async (): Promise<OutsideOrder[]> => {
  ensureEngine();
  return readOutside();
});

// entries on, page armed
export const getWatch = createServerFn({ method: "GET" }).handler(async (): Promise<WatchStatus> => {
  ensureEngine();
  return readWatch();
});

export const setEntries = createServerFn({ method: "POST" })
  .validator((input: { on: boolean }) => input)
  .handler(async ({ data }): Promise<{ on: boolean }> => {
    ensureEngine();
    const at = new Date().toISOString();
    if (data.on) {
      writeFileSync(
        join(process.cwd(), "data", "halt.json"),
        JSON.stringify({ off: false, at, since: at, reason: "", losses: [] }),
      );
      let equity: number | null = null;
      try {
        equity = JSON.parse(readFileSync(join(process.cwd(), "data", "kalshi-cash.json"), "utf8")).cash ?? null;
      } catch {
        equity = null;
      }
      writeFileSync(
        join(process.cwd(), "data", "pace.json"),
        JSON.stringify({ from: at, at, paused: false, wins: 0, n: 0, net: 0, equity, peak: equity }),
      );
    } else {
      writeFileSync(
        join(process.cwd(), "data", "halt.json"),
        JSON.stringify({ off: true, at, since: at, reason: "You turned entries off. Open trades can still cash.", losses: [] }),
      );
      try {
        const pace = JSON.parse(readFileSync(join(process.cwd(), "data", "pace.json"), "utf8"));
        writeFileSync(join(process.cwd(), "data", "pace.json"), JSON.stringify({ ...pace, paused: true, at }));
      } catch {
        // the halt file is enough
      }
    }
    return { on: data.on };
  });

export const getTrail = createServerFn({ method: "GET" }).handler(async (): Promise<{ pct: number }> => {
  ensureEngine();
  try {
    const n = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "trail-floor.json"), "utf8")).pct);
    return { pct: clampTrail(n) };
  } catch {
    return { pct: 45 };
  }
});

export const setTrailFloor = createServerFn({ method: "POST" })
  .validator((input: { pct: number }) => input)
  .handler(async ({ data }): Promise<{ pct: number }> => {
    ensureEngine();
    const pct = clampTrail(data.pct);
    writeFileSync(join(process.cwd(), "data", "trail-floor.json"), JSON.stringify({ pct }));
    return { pct };
  });

export const getScale75 = createServerFn({ method: "GET" }).handler(async (): Promise<{ on: boolean }> => {
  ensureEngine();
  try {
    const on = JSON.parse(readFileSync(join(process.cwd(), "data", "scale75.json"), "utf8")).on;
    return { on: on !== false };
  } catch {
    return { on: true };
  }
});

export const setScale75 = createServerFn({ method: "POST" })
  .validator((input: { on: boolean }) => input)
  .handler(async ({ data }): Promise<{ on: boolean }> => {
    ensureEngine();
    const on = data.on !== false;
    writeFileSync(join(process.cwd(), "data", "scale75.json"), JSON.stringify({ on }));
    return { on };
  });

export const setPinSale = createServerFn({ method: "POST" })
  .validator((input: { ticker: string; ask: number; pct: number }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    ensureEngine();
    const file = join(process.cwd(), "data", "pin-sale.json");
    let map: Record<string, { ask: number; pct: number; at: string }> = {};
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as typeof map;
      if (parsed && typeof parsed === "object") map = parsed;
    } catch {
      map = {};
    }
    map[data.ticker] = { ask: data.ask, pct: data.pct, at: new Date().toISOString() };
    writeFileSync(file, JSON.stringify(map));
    return { ok: true };
  });

export const armNear = createServerFn({ method: "POST" })
  .validator((input: { ticker: string; room: number }) => input)
  .handler(async ({ data }): Promise<{ ok: true; room: number }> => {
    ensureEngine();
    const file = join(process.cwd(), "data", "near-top.json");
    let map: Record<string, { room: number; at: string }> = {};
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as typeof map;
      if (parsed && typeof parsed === "object") map = parsed;
    } catch {
      map = {};
    }
    const room = data.room === 5 || data.room === 10 ? data.room : 0;
    if (!room) delete map[data.ticker];
    else map[data.ticker] = { room, at: new Date().toISOString() };
    writeFileSync(file, JSON.stringify(map));
    return { ok: true, room };
  });

export const closeNow = createServerFn({ method: "POST" })
  .validator((input: { ticker?: string } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<{ line: string }> => {
    ensureEngine();
    const live = await import("./kalshi-live.server");
    const held = await live.heldFifteens();
    const rows = data.ticker ? held.filter((row) => row.ticker === data.ticker) : [];
    if (!rows.length) return { line: "Nothing open on that market." };
    const notes: string[] = [];
    for (const row of rows) {
      const payout = await live.flattenTicker(row.ticker, true);
      const note = live.closeResult(row.ticker);
      const name = row.ticker.includes("BTC") ? "BTC" : row.ticker.includes("GOLD") ? "GOLD" : row.ticker.includes("ETH") ? "ETH" : row.ticker.includes("SOL") ? "SOL" : "SILVER";
      if (payout == null) {
        notes.push(`${name} is still open. It was not sold.`);
        continue;
      }
      const profit = note && typeof note.profit === "number" ? note.profit : null;
      if (profit == null) {
        notes.push(`${name} closed. $${payout.toFixed(2)} back.`);
        continue;
      }
      const sign = profit > 0.005 ? "+" : profit < -0.005 ? "−" : "";
      notes.push(`${name} closed ${sign}$${Math.abs(profit).toFixed(2)}.`);
    }
    const line = notes.join(" ");
    writeHelp(line, ["help"]);
    return { line };
  });

export const askHelp = createServerFn({ method: "POST" }).handler(async () => {
  ensureEngine();
  const live = await import("./kalshi-live.server");
  const held = await live.heldFifteens();
  const notes: string[] = [];
  for (const row of held) {
    const res = await fetch(`https://external-api.kalshi.com/trade-api/v2/markets/${row.ticker}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) continue;
    const data = (await res.json()) as { market?: { yes_bid_dollars?: string; no_bid_dollars?: string } };
    const yesBid = Number.parseFloat(data.market?.yes_bid_dollars ?? "0");
    const noBid = Number.parseFloat(data.market?.no_bid_dollars ?? "0");
    const bid = row.pos > 0 ? yesBid : noBid;
    const value = Math.abs(row.pos) * (Number.isFinite(bid) ? bid : 0);
    if (!(value > row.cost + 0.25)) continue;
    const name = row.ticker.includes("BTC") ? "BTC" : row.ticker.includes("GOLD") ? "GOLD" : row.ticker;
    notes.push(`${name} is green. It stays open until you close it.`);
  }
  if (notes.length) {
    const line = notes.join(" ");
    writeHelp(line, ["help"]);
    return { at: new Date().toISOString(), line, flags: ["help"] };
  }
  const names = held.map((row) => (row.ticker.includes("BTC") ? "Bitcoin" : row.ticker.includes("GOLD") ? "Gold" : row.ticker));
  return askForHelp(names);
});

export type HeldOrder = {
  ticker: string;
  name: string;
  side: "up" | "down";
  contracts: number;
  cost: number;
  value: number;
  profit: number;
  pct: number;
  target: number | null;
  spot: number | null;
  near: number;
};

function bookName(ticker: string): string {
  if (ticker.includes("SILVER")) return "SILVER";
  if (ticker.includes("GOLD")) return "GOLD";
  if (ticker.includes("BTC")) return "BTC";
  if (ticker.includes("ETH")) return "ETH";
  if (ticker.includes("SOL")) return "SOL";
  const hit = ticker.match(/^KX([A-Z]+?)15M/);
  return hit?.[1] ?? ticker.slice(0, 10);
}

function marketStrike(market?: { floor_strike?: number | string | null; yes_sub_title?: string }): number | null {
  const strike = market?.floor_strike;
  if (typeof strike === "number" && Number.isFinite(strike) && strike > 0) return strike;
  if (typeof strike === "string") {
    const n = Number.parseFloat(strike.replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  const sub = market?.yes_sub_title ?? "";
  const hit = sub.match(/([\d,]+(?:\.\d+)?)/);
  if (!hit) return null;
  const n = Number.parseFloat(hit[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parkHeld(rows: HeldOrder[]): HeldOrder[] {
  const file = join(process.cwd(), "data", "held-order.json");
  let prev: string[] = [];
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (Array.isArray(parsed)) prev = parsed.filter((ticker) => typeof ticker === "string");
  } catch {
    prev = [];
  }
  const live = new Set(rows.map((row) => row.ticker));
  const next = prev.filter((ticker) => live.has(ticker));
  for (const row of rows) if (!next.includes(row.ticker)) next.push(row.ticker);
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(file, JSON.stringify(next));
  } catch {
    // the list still returns in the same order for this pass
  }
  const by = new Map(rows.map((row) => [row.ticker, row]));
  return next.map((ticker) => by.get(ticker)).filter((row): row is HeldOrder => Boolean(row));
}

const heldView: { rows: HeldOrder[]; at: number; empty: number } = { rows: [], at: 0, empty: 0 };
const quoteMem = new Map<string, { value: number; target: number | null }>();

export const getHeldOrders = createServerFn({ method: "GET" }).handler(async (): Promise<HeldOrder[]> => {
  ensureEngine();
  const live = await import("./kalshi-live.server");
  const held = await live.heldFifteens();
  if (!held.length) {
    heldView.empty += 1;
    if (heldView.empty < 2 && heldView.rows.length) return heldView.rows;
  } else {
    heldView.empty = 0;
  }
  const out: HeldOrder[] = [];
  for (const row of held) {
    const res = await fetch(`https://external-api.kalshi.com/trade-api/v2/markets/${row.ticker}`, { signal: AbortSignal.timeout(8000) });
    const prev = quoteMem.get(row.ticker);
    if (!res.ok) {
      const contracts = Math.abs(row.pos);
      const cost = Math.round(row.cost * 100) / 100;
      const value = prev?.value ?? cost;
      const profit = Math.round((value - cost) * 100) / 100;
      out.push({
        ticker: row.ticker,
        name: bookName(row.ticker),
        side: row.pos > 0 ? "up" : "down",
        contracts,
        cost,
        value,
        profit,
        pct: cost > 0 ? profit / cost : 0,
        target: prev?.target ?? null,
        spot: null,
        near: 0,
      });
      continue;
    }
    const data = (await res.json()) as {
      market?: {
        yes_bid_dollars?: string;
        yes_ask_dollars?: string;
        no_bid_dollars?: string;
        no_ask_dollars?: string;
        floor_strike?: number | string | null;
        yes_sub_title?: string;
      };
    };
    const yesBid = Number.parseFloat(data.market?.yes_bid_dollars ?? "0");
    const yesAsk = Number.parseFloat(data.market?.yes_ask_dollars ?? "0");
    const noBid = Number.parseFloat(data.market?.no_bid_dollars ?? "0");
    const noAsk = Number.parseFloat(data.market?.no_ask_dollars ?? "0");
    const side = row.pos > 0 ? "up" : "down";
    const bid = screenBid(row.pos, yesBid, yesAsk, noBid, noAsk);
    const contracts = Math.abs(row.pos);
    const value = Math.round(contracts * (Number.isFinite(bid) ? bid : 0) * 100) / 100;
    const cost = Math.round(row.cost * 100) / 100;
    const profit = Math.round((value - cost) * 100) / 100;
    const target = marketStrike(data.market);
    quoteMem.set(row.ticker, { value, target });
    out.push({
      ticker: row.ticker,
      name: bookName(row.ticker),
      side,
      contracts,
      cost,
      value,
      profit,
      pct: cost > 0 ? profit / cost : 0,
      target,
      spot: null,
      near: 0,
    });
  }
  const parked = await live.restingFifteens();
  for (const row of parked) {
    if (out.some((heldRow) => heldRow.ticker === row.ticker)) continue;
    out.push({
      ticker: row.ticker,
      name: bookName(row.ticker),
      side: row.side === "down" ? "down" : "up",
      contracts: row.contracts,
      cost: row.cost,
      value: row.cost,
      profit: 0,
      pct: 0,
      target: null,
      spot: null,
      near: 0,
    });
  }
  heldView.rows = parkHeld(out);
  heldView.at = Date.now();
  try {
    const armed = JSON.parse(readFileSync(join(process.cwd(), "data", "near-top.json"), "utf8")) as Record<string, { room?: number }>;
    for (const row of out) {
      const room = armed?.[row.ticker]?.room;
      row.near = room === 5 || room === 10 ? room : 0;
    }
  } catch {
    for (const row of out) row.near = 0;
  }
  return out;
});

export const halfNow = createServerFn({ method: "POST" })
  .validator((input: { ticker: string }) => input)
  .handler(async ({ data }) => {
    ensureEngine();
    const live = await import("./kalshi-live.server");
    return live.halfLive(data.ticker);
  });

export const trimNow = createServerFn({ method: "POST" })
  .validator((input: { ticker: string; dollars: number }) => input)
  .handler(async ({ data }) => {
    ensureEngine();
    const live = await import("./kalshi-live.server");
    return live.trimLive(data.ticker, data.dollars);
  });

export const halfLiveOrder = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }): Promise<{ payout: number; profit: number; left: number } | null> => {
    const book = readBook();
    const trade = book.trades.find((t) => t.id === data.id && t.source === "live" && t.venue !== "polymarket" && t.result === "open");
    if (!trade || !(trade.contracts > 0)) return null;
    const live = await import("./kalshi-live.server");
    const cut = await live.halfLive(trade.ticker);
    if (!cut) return null;
    const part = Math.min(0.95, cut.filled / trade.contracts);
    const stake = Math.round(trade.stake * part * 100) / 100;
    const leftStake = Math.round((trade.stake - stake) * 100) / 100;
    const slice: Trade = {
      ...trade,
      id: newId(),
      setupId: `${trade.setupId}:half:${Date.now()}`,
      closedAt: new Date().toISOString(),
      stake,
      contracts: cut.filled,
      result: "exited",
      payout: cut.payout,
      profit: Math.round((cut.payout - stake) * 100) / 100,
      notes: "Half closed from the desk. The rest is still open.",
    };
    const next: Trade = {
      ...trade,
      stake: leftStake,
      contracts: Math.max(0.01, Math.round((trade.contracts - cut.filled) * 100) / 100),
      runner: true,
      notes: "Half is banked. This half is still running.",
    };
    writeBook([slice, ...book.trades.map((t) => (t.id === trade.id ? next : t))]);
    return { payout: cut.payout, profit: slice.profit ?? 0, left: leftStake };
  });
// halt reload

export type ExitNote = {
  at?: string;
  ticker?: string;
  asset?: string;
  side?: string;
  reason?: string;
  bidPct?: number;
  targetPct?: number;
  profit?: number | null;
  stake?: number;
  secondsLeft?: number;
  spot?: number;
  strike?: number;
  multiple?: number;
  yesBid?: number;
  highBid?: number;
  entry?: string;
};

export const getExitLog = createServerFn({ method: "GET" }).handler(async (): Promise<ExitNote[]> => {
  const { readExitLog } = await import("./engine");
  return readExitLog();
});

export const getFillLog = createServerFn({ method: "GET" }).handler(async (): Promise<FillEvent[]> => {
  const rows = readFillLog();
  let peaks: Record<string, number> = {};
  try {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const parsed = JSON.parse(readFileSync(join(process.cwd(), "data", "gate-high.json"), "utf8")) as Record<string, number>;
    if (parsed && typeof parsed === "object") peaks = parsed;
  } catch {
    peaks = {};
  }
  return rows.map((row) => ({ ...row, peak: peaks[row.ticker] > 0 ? peaks[row.ticker] : row.peak ?? null }));
});

export const pushBook = createServerFn({ method: "POST" })
  .validator((input: { trades?: Trade[]; settings?: DeskSettings } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<Trade[]> => {
    ensureEngine();
    return writeBook(data.trades ?? [], data.settings).trades;
  });

export const getLiveSize = createServerFn({ method: "GET" }).handler(async (): Promise<{ dollars: number }> => {
  return { dollars: liveDollars() };
});

export const setLiveSize = createServerFn({ method: "POST" })
  .validator((input: { dollars: number }) => input)
  .handler(async ({ data }): Promise<{ dollars: number }> => {
    const n = Math.max(1, Math.min(100, Math.round(data.dollars)));
    writeLiveDollars(n);
    return { dollars: liveDollars() };
  });

export const armLiveNow = createServerFn({ method: "POST" })
  .validator((input: { setup: Setup; asset: AssetSnapshot }) => input)
  .handler(async ({ data }): Promise<Trade | null> => {
    ensureEngine();
    const book = readBook();
    const kalshi = await sendKalshi(data.setup, data.asset, book.trades);
    const poly = await sendLive(data.setup, data.asset, book.trades);
    const made = [kalshi, poly].filter((row): row is Trade => row != null);
    if (!made.length) return null;
    writeBook([...made, ...book.trades]);
    return kalshi ?? poly;
  });

export const exitLiveOrder = createServerFn({ method: "POST" })
  .validator((input: { id: string; yesBid: number; yesAsk: number; noBid?: number }) => input)
  .handler(async ({ data }): Promise<Trade | null> => {
    const book = readBook();
    const trade = book.trades.find((t) => t.id === data.id && t.source === "live" && t.venue !== "polymarket");
    if (!trade || smallTicket(trade)) return null;
    const live = await import("./kalshi-live.server");
    const payout = await live.flattenLive(trade, data.yesBid, data.yesAsk, data.noBid);
    if (payout == null) return null;
    const closed: Trade = {
      ...trade,
      result: "exited",
      payout,
      profit: payout - trade.stake,
      closedAt: new Date().toISOString(),
    };
    writeBook(book.trades.map((t) => (t.id === trade.id ? closed : t)));
    return closed;
  });

export const killKalshi = createServerFn({ method: "POST" })
  .validator((input: { ticker?: string } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<{ ticker: string; payout: number | null }[]> => {
    const live = await import("./kalshi-live.server");
    const book = readBook();
    const shown = new Set(
      book.trades.filter((t) => t.source === "live" && t.venue !== "polymarket" && t.result === "open").map((t) => t.ticker),
    );
    const held = await live.heldFifteens();
    const targets = data.ticker ? held.filter((row) => row.ticker === data.ticker) : held.filter((row) => !shown.has(row.ticker));
    const out: { ticker: string; payout: number | null }[] = [];
    for (const row of targets) {
      const payout = await live.flattenTicker(row.ticker);
      out.push({ ticker: row.ticker, payout });
      if (payout != null) {
        writeBook(
          book.trades.map((t) =>
            t.ticker === row.ticker && t.source === "live" && t.result === "open"
              ? { ...t, result: "exited" as const, payout, profit: Math.round((payout - t.stake) * 100) / 100, closedAt: new Date().toISOString() }
              : t,
          ),
        );
      }
    }
    return out;
  });

export const resizeLiveOrder = createServerFn({ method: "POST" })
  .validator((input: { id: string; dollars: number; yesBid: number; yesAsk: number }) => input)
  .handler(async ({ data }): Promise<{ trade: Trade; slice: Trade | null } | null> => {
    const book = readBook();
    const trade = book.trades.find((t) => t.id === data.id && t.source === "live" && t.venue !== "polymarket" && t.result === "open");
    if (!trade) return null;
    const live = await import("./kalshi-live.server");
    const resized = await live.resizeLive(trade, data.dollars, data.yesBid, data.yesAsk);
    if (!resized) return null;
    const next: Trade = { ...trade, stake: resized.stake, contracts: resized.contracts };
    const slice: Trade | null = resized.slice
      ? {
          ...trade,
          id: newId(),
          setupId: `${trade.setupId}:trim:${Date.now()}`,
          openedAt: trade.openedAt,
          closedAt: new Date().toISOString(),
          stake: resized.slice.stake,
          contracts: Math.max(0.01, trade.contracts - resized.contracts),
          result: "exited",
          payout: resized.slice.payout,
          profit: resized.slice.profit,
          notes: "Trimmed from the desk.",
        }
      : null;
    writeBook(slice ? [slice, ...book.trades.map((t) => (t.id === trade.id ? next : t))] : book.trades.map((t) => (t.id === trade.id ? next : t)));
    return { trade: next, slice };
  });

export const askDeskGrok = createServerFn({ method: "POST" })
  .validator((input: GrokBriefing) => input)
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; call: GrokCall; cached: boolean } | { ok: false; error: string }
    > => {
      return reasonSetup(data);
    },
  );
