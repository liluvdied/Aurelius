// RIP-TAP (Claude, Oct 5, Love: "after btc has gone in one direction violently, rips thru one band and taps the next band on
// pepperstone... have her do it every time, whether we're in a trade the other side or not").
// v2 (Love, Oct 5 ~4:55 PM PT: "it doesn't need to be within 5 minutes... just rips thru one band and taps the next... any
// multiple over 3x... have her cash out in profit... 90% of the max that's there, same as our books on kalshi"):
//   ENTRY: inside the current 15-minute window, BTC (desk's Pepperstone feed, her session bands = VWAP +/- 0.5 sigma steps
//          to 3 sigma, data/bands-now.json) has been beyond a band and now has ripped through it and touches the NEXT band
//          (within $15), 4+ minutes on the clock -> $5 on the bounce side of Polymarket's BTC 15m market at 3x or better
//          (2c-33c). One per window. Independent of any Kalshi trade.
//   EXIT:  the moment the bid reaches 90% of the max it can pay (cost + 90% of what is left to $1), cash out. Else the bell.
//   Never buys against a position on the other side of that Polymarket window (Polymarket nets the two).
// live-switch "ripTap": { on, dollars, minAsk, maxAsk, minLeftSec, tol, bankOfMax }. Log data/riptap-log.jsonl,
// open tickets data/riptap.json.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Ticket = { slug: string; ticker: string; side: "up" | "down"; contracts: number; cost: number; closesAt: string; at: string; status: "open" | "sold" | "bell"; profit?: number; lastTry?: number };
const g = globalThis as unknown as { __ripTapBusy?: number; __ripTapSeen?: Record<string, number>; __ripTapRing?: { tk: string; pts: number[] } };
const FILE = () => join(process.cwd(), "data", "riptap.json");
const r2 = (n: number) => Math.round(n * 100) / 100;

function log(x: Record<string, unknown>) {
  try {
    appendFileSync(join(process.cwd(), "data", "riptap-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n");
  } catch {
  }
}
function readReg(): Record<string, Ticket> {
  try {
    return JSON.parse(readFileSync(FILE(), "utf8")) || {};
  } catch {
    return {};
  }
}
function writeReg(m: Record<string, Ticket>) {
  try {
    const keep = Object.values(m).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 200);
    writeFileSync(FILE(), JSON.stringify(Object.fromEntries(keep.map((t) => [t.slug, t])), null, 1));
  } catch {
  }
}

export async function ripTapTick(assets: any) {
  // a stuck network call never freezes it: "busy" older than 45s is ignored
  if (g.__ripTapBusy && Date.now() - g.__ripTapBusy < 45000) return;
  g.__ripTapBusy = Date.now();
  try {
    let cfg: any = null;
    try {
      cfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).ripTap;
    } catch {
      cfg = null;
    }
    const reg = readReg();
    const openT = Object.values(reg).filter((t) => t.status === "open");
    if (!cfg?.on && !openT.length) return;
    const pm = await import("./poly-live.server");
    if (!pm.polymarketArmed()) return;
    let changed = false;

    // EXITS: cash out at 90% of the max, else ride to the bell.
    const ofMax = (Number(cfg?.bankOfMax) > 0 ? Number(cfg.bankOfMax) : 90) / 100;
    for (const t of openT) {
      if (Date.now() >= Date.parse(t.closesAt) - 3000) {
        t.status = "bell";
        changed = true;
        log({ status: "to the bell", slug: t.slug, side: t.side, contracts: t.contracts, cost: t.cost });
        continue;
      }
      if (t.lastTry && Date.now() - t.lastTry < 2500) continue;
      const top = await pm.bookTop(t.slug).catch(() => null);
      if (!top) continue;
      const bid = t.side === "up" ? top.bid : r2(1 - top.ask);
      const line = Math.floor((t.cost + ofMax * (1 - t.cost)) * 100) / 100;
      if (!(bid >= line || bid >= 0.97)) continue;
      t.lastTry = Date.now();
      changed = true;
      const sold = await pm.sellSide(t.side, t.slug, t.contracts).catch(() => null);
      if (sold && sold.filled > 0) {
        t.profit = r2((t.profit || 0) + sold.filled * (sold.price - t.cost));
        t.contracts = r2(t.contracts - sold.filled);
        if (!(t.contracts >= 0.01)) t.status = "sold";
        log({ status: "cashed out", slug: t.slug, side: t.side, filled: sold.filled, price: sold.price, cost: t.cost, profit: t.profit, why: `${Math.round(ofMax * 100)}% of the max (line ${line})` });
      }
    }

    // ENTRY
    if (cfg?.on) {
      const a = assets?.btc;
      const m = a?.market;
      let b: any = null;
      try {
        b = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.btc ?? null;
      } catch {
        b = null;
      }
      const px = Number(b?.spot) || Number(a?.spot) || 0;
      const vw = Number(b?.vwap) || 0;
      const sd = Number(b?.sd) || 0;
      if (px > 0 && m?.ticker && m.closeTime && vw > 0 && sd > 0) {
        // every price seen inside THIS window
        const ring = g.__ripTapRing && g.__ripTapRing.tk === m.ticker ? g.__ripTapRing : (g.__ripTapRing = { tk: m.ticker, pts: [] as number[] });
        ring.pts.push(px);
        const now = Date.now();
        const left = Number(a?.secondsLeft) || (Date.parse(m.closeTime) - now) / 1000;
        const seen = (g.__ripTapSeen ||= {});
        const done = seen[m.ticker] && (seen[m.ticker] < 0 || now - seen[m.ticker] < 60000);
        if (!done && ring.pts.length >= 3 && left >= (Number(cfg.minLeftSec) > 0 ? Number(cfg.minLeftSec) : 240) && !Object.values(reg).some((t) => t.ticker === m.ticker)) {
          const tol = Number(cfg.tol) > 0 ? Number(cfg.tol) : 15;
          const hi = Math.max(...ring.pts);
          const lo = Math.min(...ring.pts);
          const bands = Array.from({ length: 13 }, (_, i) => vw + ((i - 6) / 2) * sd);
          const name = (i: number) => (i === 6 ? "VWAP" : `${i > 6 ? "+" : ""}${(i - 6) / 2}σ`);
          let side: "up" | "down" | null = null;
          let why = "";
          for (let j = 0; j < 12 && !side; j++) {
            if (hi >= bands[j + 1] && px < bands[j + 1] && Math.abs(px - bands[j]) <= tol) {
              side = "up";
              why = `ripped down through the ${name(j + 1)} and tapped the ${name(j)}`;
            }
          }
          for (let j = 1; j < 13 && !side; j++) {
            if (lo <= bands[j - 1] && px > bands[j - 1] && Math.abs(px - bands[j]) <= tol) {
              side = "down";
              why = `ripped up through the ${name(j - 1)} and tapped the ${name(j)}`;
            }
          }
          if (side) {
            seen[m.ticker] = now;
            const dollars = Number(cfg.dollars) > 0 ? Number(cfg.dollars) : 5;
            const minAsk = Number(cfg.minAsk) > 0 ? Number(cfg.minAsk) : 0.02;
            const maxAsk = Number(cfg.maxAsk) > 0 ? Number(cfg.maxAsk) : 0.33;
            const win = await pm.polyWindowFor(m.closeTime).catch(() => null);
            const mine = await pm.polymarketHoldings().catch(() => []);
            const other = win?.slug ? mine.find((h: any) => h.slug === win.slug && Math.abs(h.net) > 0.01 && Math.sign(h.net) !== (side === "up" ? 1 : -1)) : undefined;
            if (other) {
              seen[m.ticker] = -1;
              log({ status: "skipped", ticker: m.ticker, slug: win?.slug, side, why, spot: px, reason: "this window already holds the other side on Polymarket (yours or a hedge); a ticket would net against it" });
            } else {
              const fill = await pm.takeSide(side, m.closeTime, dollars, maxAsk, minAsk, 0.02, ":riptap").catch((err: any) => {
                log({ status: "error", ticker: m.ticker, side, why, error: String(err?.message || err).slice(0, 160) });
                return null;
              });
              if (fill) {
                seen[m.ticker] = -1;
                reg[fill.slug] = { slug: fill.slug, ticker: m.ticker, side, contracts: fill.filled, cost: fill.price, closesAt: m.closeTime, at: new Date().toISOString(), status: "open" };
                changed = true;
                log({ status: "filled", ticker: m.ticker, slug: fill.slug, side, why, spot: px, contracts: fill.filled, price: fill.price, multiple: r2(1 / fill.price), minutesLeft: Math.round(left / 60) });
              } else {
                log({ status: "missed", ticker: m.ticker, side, why, spot: px, minutesLeft: Math.round(left / 60), reason: pm.takeSideWhy?.() });
              }
            }
          }
        }
      }
    }
    if (changed) writeReg(reg);
  } catch {
  } finally {
    g.__ripTapBusy = 0;
  }
}
