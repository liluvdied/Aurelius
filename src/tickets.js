// Tickets: entering (behind the money rails), exits, settlement. State lives only in aurelius-core/data/tickets.json.
import { readFileSync, writeFileSync, renameSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DATA, liveSwitchOn } from "./config.js";
import { placeOrder, positionOn, marketResult, fee, hasKeys } from "./kalshi.js";
import { log } from "./log.js";

const FILE = join(DATA, "tickets.json");
let tickets = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];
function save() { writeFileSync(FILE + ".tmp", JSON.stringify(tickets, null, 1)); renameSync(FILE + ".tmp", FILE); }
export const allTickets = () => tickets;

const pacificDay = (ms) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const todayNet = () => tickets.filter((t) => t.pnl != null && pacificDay(Date.parse(t.closedAt)) === pacificDay(Date.now())).reduce((s, t) => s + t.pnl, 0);

/** The money rails. Returns the reason she may not trade, or null. Never configurable away. */
export function railCheck({ rails, book, ticker, side, live }) {
  if (rails.oneTicketPerWindowPerBook && tickets.some((t) => t.ticker === ticker && t.book === book)) return "already has a ticket this window";
  if (rails.noFlips && tickets.some((t) => t.ticker === ticker && t.side !== side)) return "no flips: the other side was traded this window";
  if (rails.ticketDollars == null) return "rail ticketDollars is not set";
  if (rails.maxTicketDollars == null || rails.ticketDollars > rails.maxTicketDollars) return "ticket is over maxTicketDollars (or it is not set)";
  if (rails.dailyStopDollars == null) return "rail dailyStopDollars is not set";
  if (todayNet() <= -Math.abs(rails.dailyStopDollars)) return `daily stop hit (${todayNet().toFixed(2)})`;
  if (live && !hasKeys()) return "LIVE is on but the core has no Kalshi key in secrets/";
  return null;
}

const railSaid = new Set();
export async function enter({ asset, book, market, take, rails }) {
  const live = liveSwitchOn();
  const blocked = railCheck({ rails, book, ticker: market.ticker, side: take.side, live });
  if (blocked) {
    const k = `${market.ticker}:${book}:${blocked}`;
    if (!railSaid.has(k)) { railSaid.add(k); log("decisions", { asset, book, ticker: market.ticker, action: "skip", why: `rail: ${blocked}`, look: take }); }
    return null;
  }
  const price = take.askCents, count = Math.floor((rails.ticketDollars * 100) / price);
  if (!(count >= 1)) { log("decisions", { asset, book, ticker: market.ticker, action: "skip", why: `$${rails.ticketDollars} buys no contract at ${price}c` }); return null; }
  const side = take.side === "up" ? "yes" : "no";
  let filled = count, orderId = null;
  if (live) {
    try {
      const o = await placeOrder({ ticker: market.ticker, side, action: "buy", count, priceCents: price });
      orderId = o?.order_id ?? null;
      filled = Math.min(count, Math.abs(await positionOn(market.ticker)));
    } catch (e) { log("decisions", { asset, book, ticker: market.ticker, action: "order-failed", why: e.message, look: take }); return null; }
    if (!filled) log("decisions", { asset, book, ticker: market.ticker, action: "unfilled (resting)", look: take, orderId });
  }
  const t = {
    id: `${market.ticker}:${book}`, asset, book, ticker: market.ticker, closeMs: market.closeMs, side: take.side, kalshiSide: side,
    count: filled, ask: price, cost: (filled * price) / 100, feeIn: fee(filled, price), live, orderId,
    setup: take.setup, line: take.line, why: take.why, openedAt: new Date().toISOString(),
    sold: 0, proceeds: 0, best: 0, armed: false, halfDone: false, result: "open", pnl: null,
  };
  tickets.push(t); save();
  log("decisions", { asset, book, ticker: market.ticker, action: live ? "BUY LIVE" : "buy paper", ticket: t });
  return t;
}

async function sell(t, count, bid, why) {
  if (!(count > 0)) return;
  if (t.live) {
    try { await placeOrder({ ticker: t.ticker, side: t.kalshiSide, action: "sell", count, priceCents: bid }); }
    catch (e) { log("exits", { id: t.id, action: "sell-failed", why: e.message }); return; }
  }
  t.sold += count; t.proceeds += (count * bid) / 100 - fee(count, bid);
  log("exits", { id: t.id, action: `sold ${count} @ ${bid}c`, why }); save();
}

/** Exit plan from tolerances. All null = hold to the bell. */
export async function manageExits(market, exitTol) {
  for (const t of tickets) {
    if (t.result !== "open" || t.ticker !== market.ticker || t.sold >= t.count) continue;
    const bid = t.kalshiSide === "yes" ? market.yesBid : market.noBid;
    if (!(bid > 0)) continue;
    const room = 100 - t.ask;
    t.best = Math.max(t.best, bid);
    if (exitTol.sellAtCents != null && bid >= exitTol.sellAtCents) { await sell(t, t.count - t.sold, bid, `bid ${bid}c reached ${exitTol.sellAtCents}c`); continue; }
    if (exitTol.halfAtPctOfRoom != null && !t.halfDone && bid >= t.ask + (exitTol.halfAtPctOfRoom / 100) * room) {
      t.halfDone = true; await sell(t, Math.floor(t.count / 2), bid, `half at ${exitTol.halfAtPctOfRoom}% of the room`);
    }
    if (exitTol.trailArmPctOfRoom != null && exitTol.trailPoints != null) {
      if (!t.armed && bid >= t.ask + (exitTol.trailArmPctOfRoom / 100) * room) t.armed = true;
      if (t.armed && bid <= t.best - exitTol.trailPoints) await sell(t, t.count - t.sold, bid, `trail: best ${t.best}c, now ${bid}c`);
    }
  }
}

/** Scored ONLY on Kalshi's settlement. */
export async function settle() {
  for (const t of tickets) {
    if (t.result !== "open" || Date.now() < t.closeMs + 5000) continue;
    let r;
    try { r = await marketResult(t.ticker); } catch (e) { log("settle", { id: t.id, why: e.message }); continue; }
    if (!r) continue;
    const won = (r === "yes") === (t.kalshiSide === "yes");
    const held = t.count - t.sold;
    t.pnl = Math.round((t.proceeds + (won ? held : 0) - t.cost - t.feeIn) * 100) / 100;
    t.result = t.pnl > 0 ? "win" : "loss"; t.kalshi = r; t.closedAt = new Date().toISOString();
    save(); log("settle", { id: t.id, kalshi: r, result: t.result, pnl: t.pnl });
  }
}
