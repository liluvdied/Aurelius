import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Trade } from "./types";

const FILE = join(process.cwd(), "data", "poly-ledger.json");

export type PolyRow = {
  slug: string;
  at: string;
  side: "up" | "down";
  orderId: string;
  deskStake: number;
  deskContracts: number;
  deskAsk: number;
  accountNet: number | null;
  accountCost: number | null;
  accountAvg: number | null;
  beat: number | null;
  settlement: number | null;
  downWon: boolean | null;
  expected: number | null;
  cashBefore: number | null;
  cashAfter: number | null;
  status: "open" | "paid" | "missing" | "off" | "settled";
  note: string;
};

export type CashPoint = { t: string; cash: number };

export type PolyLedger = {
  checkedAt: string | null;
  cash: number | null;
  anchor: number | null;
  trail: CashPoint[];
  rows: PolyRow[];
};

function empty(): PolyLedger {
  return { checkedAt: null, cash: null, anchor: null, trail: [], rows: [] };
}

export function readPolyLedger(): PolyLedger {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as PolyLedger;
    return {
      checkedAt: parsed.checkedAt ?? null,
      cash: parsed.cash ?? null,
      anchor: parsed.anchor ?? null,
      trail: Array.isArray(parsed.trail) ? parsed.trail.filter((p) => p && Number.isFinite(p.cash)) : [],
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
    };
  } catch {
    return empty();
  }
}

function save(book: PolyLedger) {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(book));
}

function dollars(n: number): string {
  const sign = n < 0 ? "-" : "+";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function rememberCash(book: PolyLedger, cash: number) {
  if (book.trail.length === 0) {
    for (const row of book.rows) {
      if (row.cashBefore != null) book.trail.push({ t: row.at, cash: row.cashBefore });
      if (row.cashAfter != null) book.trail.push({ t: row.at, cash: row.cashAfter });
    }
    book.trail.sort((a, b) => a.t.localeCompare(b.t));
  }
  if (book.anchor == null) book.anchor = book.trail[0]?.cash ?? cash;
  const last = book.trail[book.trail.length - 1];
  const age = last ? Date.now() - Date.parse(last.t) : Infinity;
  if (!last || Math.abs(last.cash - cash) >= 0.01 || age > 20000) {
    book.trail.push({ t: new Date().toISOString(), cash });
  }
  if (book.trail.length > 400) book.trail.splice(0, book.trail.length - 400);
}

export async function watchPolymarket(trades: Trade[]): Promise<void> {
  const poly = await import("./poly-live.server");
  if (!poly.polymarketArmed()) return;
  const book = readPolyLedger();
  const cash = await poly.polymarketCash();
  const held = await poly.polymarketHoldings();
  const bySlug = new Map(held.map((row) => [row.slug, row]));
  book.checkedAt = new Date().toISOString();
  if (cash != null) {
    book.cash = cash;
    rememberCash(book, cash);
  }

  for (const trade of trades) {
    if (trade.venue !== "polymarket" || !trade.ticker) continue;
    let row = book.rows.find((item) => item.slug === trade.ticker);
    if (!row) {
      row = {
        slug: trade.ticker,
        at: trade.openedAt,
        side: trade.side,
        orderId: trade.orderId ?? "",
        deskStake: trade.stake,
        deskContracts: trade.contracts,
        deskAsk: trade.ask,
        accountNet: null,
        accountCost: null,
        accountAvg: null,
        beat: null,
        settlement: null,
        downWon: null,
        expected: null,
        cashBefore: cash,
        cashAfter: null,
        status: "open",
        note: "Sent. Waiting on the account.",
      };
      book.rows.unshift(row);
    }
    if (trade.result !== "open") {
      if (row.status !== "paid" && row.status !== "settled" && row.status !== "off") {
        row.expected = trade.profit;
        if (row.cashAfter == null) row.cashAfter = cash;
        row.status = "paid";
        row.note = trade.result === "exited" ? "Cashed before the window." : trade.notes;
      }
      continue;
    }
    const live = bySlug.get(trade.ticker);
    if (live) {
      row.accountNet = live.net;
      row.accountCost = live.cost;
      row.accountAvg = live.avg;
      if (row.cashBefore == null) row.cashBefore = cash;
      const accountSide = live.net < -0.01 ? "down" : live.net > 0.01 ? "up" : row.side;
      const qty = Math.abs(live.net);
      if (accountSide !== row.side) {
        row.status = "off";
        row.note = "The account side does not match the order the desk sent.";
      } else if (Math.abs(qty - row.deskContracts) > 0.5) {
        row.status = "off";
        row.note = `Desk sent ${row.deskContracts.toFixed(2)} contracts. The account shows ${qty.toFixed(2)}.`;
      } else {
        row.status = "open";
        row.note = "On the account.";
      }
      continue;
    }
    if (row.status === "paid" || row.status === "off" || row.status === "settled") continue;
    if (row.accountNet == null && row.accountCost == null) {
      const window = await poly.polymarketWindow(row.slug);
      if (window?.closed && window.downWon != null) {
        const won = row.side === "down" ? window.downWon : !window.downWon;
        row.downWon = window.downWon;
        row.beat = window.beat;
        row.settlement = window.settlement;
        row.expected = Math.round((won ? row.deskContracts - row.deskStake : -row.deskStake) * 100) / 100;
        row.cashBefore = null;
        row.cashAfter = null;
        row.status = "settled";
        row.note = won
          ? "Window was already closed. It won. There is no cash check on this one."
          : "Window was already closed. It lost. There is no cash check on this one.";
        continue;
      }
      row.status = "missing";
      row.note = "The desk sent it. The account is not showing it.";
      continue;
    }
    const window = await poly.polymarketWindow(row.slug);
    if (!window?.closed || window.downWon == null) {
      row.status = "missing";
      row.note = "The position left the account before the window resolved.";
      continue;
    }
    row.downWon = window.downWon;
    row.beat = window.beat;
    row.settlement = window.settlement;
    const won = row.side === "down" ? window.downWon : !window.downWon;
    const cost = row.accountCost ?? row.deskStake;
    const contracts = Math.abs(row.accountNet ?? row.deskContracts);
    row.expected = Math.round((won ? contracts - cost : -cost) * 100) / 100;
    if (row.cashAfter == null && cash != null) row.cashAfter = cash;
    const delta =
      row.cashBefore != null && row.cashAfter != null
        ? Math.round((row.cashAfter - row.cashBefore) * 100) / 100
        : null;
    const due = won ? contracts : 0;
    if (delta != null && Math.abs(delta - due) > 0.75) {
      row.status = "off";
      row.note = `${won ? "Won" : "Lost"}. Cash should have moved ${dollars(due)} after the cost. It moved ${dollars(delta)}.`;
    } else {
      row.status = "paid";
      row.note = won ? "Won. The cash move matches the contract." : "Lost. The position is gone from the account.";
    }
  }

  for (const live of held) {
    if (book.rows.some((row) => row.slug === live.slug)) continue;
    book.rows.unshift({
      slug: live.slug,
      at: new Date().toISOString(),
      side: live.net < 0 ? "down" : "up",
      orderId: "",
      deskStake: 0,
      deskContracts: 0,
      deskAsk: live.avg,
      accountNet: live.net,
      accountCost: live.cost,
      accountAvg: live.avg,
      beat: null,
      settlement: null,
      downWon: null,
      expected: null,
      cashBefore: cash,
      cashAfter: null,
      status: "off",
      note: "On the account, and the desk has no order for it.",
    });
  }

  save(book);
}
