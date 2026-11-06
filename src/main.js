// Aurelius core: one pass per second per asset. Price -> window -> lines -> decide -> rails -> ticket -> exits -> settle.
// Paper unless aurelius-core/data/live.json says {"live": true}. Reads nothing outside the aurelius-core folder.
import { writeFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { settings, DATA, liveSwitchOn } from "./config.js";
import { sessionStartMs } from "./clock.js";
import { drawLines } from "./lines.js";
import { decide } from "./decide.js";
import { ChartFeed } from "./tradingview.js";
import { currentWindow } from "./kalshi.js";
import { enter, manageExits, settle, allTickets } from "./tickets.js";
import { log } from "./log.js";

const { tol: tol0 } = settings();
const feeds = Object.fromEntries(Object.entries(tol0.assets).map(([id, a]) => [id, new ChartFeed(a.chart)]));
const windows = {}; // asset -> {at, market}
const gaps = {};    // asset -> {ticker, gap, chartAtOpen, strike}
const lastSaid = {}; // asset:book -> last logged outcome (log on change, never silent, never flooding)

async function windowFor(id, series) {
  const w = windows[id];
  if (w && Date.now() - w.at < 2000 && w.market && w.market.closeMs > Date.now()) return w.market;
  const market = await currentWindow(series);
  windows[id] = { at: Date.now(), market };
  return market;
}

/** Gap = chart price minus Kalshi's price. Kalshi's strike IS Kalshi's price at the window's open, so the gap is
 *  measured from the chart bar at that same minute. (A live Kalshi price feed plugs in here once Love names its source.) */
function measureGap(id, market, bars) {
  if (!market?.strike || gaps[id]?.ticker === market.ticker) return gaps[id];
  const bar = bars.find((b) => b.t === Math.floor(market.openMs / 60000) * 60000);
  if (!bar) return gaps[id];
  gaps[id] = { ticker: market.ticker, chartAtOpen: bar.o, strike: market.strike, gap: Math.round((bar.o - market.strike) * 100) / 100 };
  log("gap", { asset: id, ...gaps[id] });
  return gaps[id];
}

async function pass(id) {
  const { tol, rails } = settings();
  const feed = feeds[id], now = Date.now();
  const p = feed.price();
  const status = { asset: id, feed: feed.status, live: liveSwitchOn() };
  if (!p) return { ...status, note: "no bars yet" };
  const bars = feed.list();
  const market = await windowFor(id, tol.assets[id].kalshiSeries);
  if (!market) return { ...status, price: p.price, note: "no open Kalshi window" };
  const gap = measureGap(id, market, bars);
  const lines = drawLines(bars, tol, sessionStartMs(tol.session.startHour, tol.session.timeZone, now), now);
  const secondsLeft = Math.floor((market.closeMs - now) / 1000);
  await manageExits(market, tol.exit);
  const out = { ...status, price: p.price, priceAgeSec: +p.ageSec.toFixed(1), ticker: market.ticker, secondsLeft, strike: market.strike,
    gap: gap?.gap ?? null, strikeOnChart: gap ? market.strike + gap.gap : null, yesAsk: market.yesAsk, noAsk: market.noAsk,
    vwap: lines.sess?.vwap, sd: lines.sess?.sd, pink: lines.piv?.pink, red: lines.piv?.red, green: lines.piv?.green,
    bbUpper: lines.bb?.upper, bbLower: lines.bb?.lower, books: {} };
  for (const book of Object.keys(tol.books)) {
    const d = decide({ asset: id, bars, lines, price: p.price, priceAgeSec: p.ageSec, now, secondsLeft, market, tol, book });
    const said = d.take ? `take ${d.take.setup} ${d.take.side}` : d.looks.map((l) => `${l.setup} ${l.side}: ${l.wall}`).join(" | ") || d.why;
    out.books[book] = said;
    const key = `${id}:${book}`;
    if (lastSaid[key] !== said) { lastSaid[key] = said; log("decisions", { asset: id, book, ticker: market.ticker, secondsLeft, price: p.price, said, looks: d.looks }); }
    if (d.take && !allTickets().some((t) => t.ticker === market.ticker && t.book === book)) await enter({ asset: id, book, market, take: d.take, rails });
  }
  return out;
}

async function loop() {
  const now = {};
  for (const id of Object.keys(feeds)) {
    try { now[id] = await pass(id); } catch (e) { now[id] = { error: e.message }; log("errors", { asset: id, error: e.message }); }
  }
  try { await settle(); } catch (e) { log("errors", { where: "settle", error: e.message }); }
  try { writeFileSync(join(DATA, "now.json.tmp"), JSON.stringify({ at: new Date().toISOString(), ...now }, null, 1)); renameSync(join(DATA, "now.json.tmp"), join(DATA, "now.json")); } catch {}
  setTimeout(loop, 1000);
}

console.log(`Aurelius core starting - ${liveSwitchOn() ? "LIVE" : "PAPER"} - ${Object.keys(feeds).join(", ")}`);
setTimeout(loop, 3000);
