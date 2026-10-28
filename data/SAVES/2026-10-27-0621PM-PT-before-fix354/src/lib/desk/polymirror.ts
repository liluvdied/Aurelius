// POLYMARKET MIRROR (Claude, Oct 4 ~9 PM PT, Love: "can you put COTC on for btc on polymarket over night? she'll take a few
// goodiez"). Today's lesson: live lost because live did not exit like paper. So this is a true mirror:
//   ENTRY: the moment a mirrored book (COTC) books a BTC paper trade in the open window, buy the same side on Polymarket's
//          BTC 15m market ($10, never above 75c), once per window.
//   EXIT:  the moment that paper trade SELLS (take profit or lock), sell the Polymarket position too. Otherwise it rides
//          to the bell exactly like paper.
// Never buys against Love's own other-side Polymarket position in that window (Polymarket nets the two).
// live-switch "polyMirror": { on, books, dollars, maxAsk, since }. Log: data/poly-mirror-log.jsonl.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listNight } from "./nightbook";

type Mirror = { id: string; book: string; ticker: string; slug: string; side: "up" | "down"; contracts: number; cost: number; at: string; status: "pending" | "open" | "sold" | "bell" | "skipped" | "missed"; soldPx?: number; profit?: number; why?: string; lastTry?: number };
const FILE = () => join(process.cwd(), "data", "poly-mirror.json");
const g = globalThis as unknown as { __polyMirrorBusy?: boolean };
const r2 = (n: number) => Math.round(n * 100) / 100;

function read(): Record<string, Mirror> {
  try {
    const x = JSON.parse(readFileSync(FILE(), "utf8"));
    return x && typeof x === "object" ? x : {};
  } catch {
    return {};
  }
}
function write(m: Record<string, Mirror>) {
  try {
    const keep = Object.values(m).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 300);
    writeFileSync(FILE(), JSON.stringify(Object.fromEntries(keep.map((e) => [e.id, e])), null, 1));
  } catch {
  }
}
function log(x: Record<string, unknown>) {
  try {
    appendFileSync(join(process.cwd(), "data", "poly-mirror-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...x }) + "\n");
  } catch {
  }
}

export async function polyMirrorTick(assets: any) {
  if (g.__polyMirrorBusy) return;
  g.__polyMirrorBusy = true;
  try {
    let cfg: any = null;
    try {
      cfg = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).polyMirror;
    } catch {
      cfg = null;
    }
    const reg = read();
    const anyOpen = Object.values(reg).some((e) => e.status === "open");
    if (!cfg?.on && !anyOpen) return; // switched off: still finish managing anything already open
    const books: string[] = Array.isArray(cfg?.books) && cfg.books.length ? cfg.books : ["cotc"];
    const dollars = Number(cfg?.dollars) > 0 ? Number(cfg.dollars) : 10;
    const maxAsk = Number(cfg?.maxAsk) > 0 ? Number(cfg.maxAsk) : 0.75;
    const since = String(cfg?.since || "");
    const a = assets?.btc;
    const m = a?.market;
    const pm = await import("./poly-live.server");
    const rows = listNight();
    let changed = false;

    // EXITS: follow the paper trade.
    for (const e of Object.values(reg)) {
      if (e.status !== "open") continue;
      const row = rows.find((r) => r.id === e.id);
      if (row && row.result === "sold") {
        if (e.lastTry && Date.now() - e.lastTry < 3000) continue;
        e.lastTry = Date.now();
        changed = true;
        const sold = await pm.sellSide(e.side, e.slug, e.contracts).catch(() => null);
        if (sold && sold.filled > 0) {
          e.profit = r2((e.profit || 0) + sold.filled * (sold.price - e.cost));
          e.contracts = r2(e.contracts - sold.filled);
          e.soldPx = sold.price;
          e.why = `paper ${String(row.book).toUpperCase()} sold: ${row.exit ?? ""}`;
          if (!(e.contracts >= 0.01)) e.status = "sold";
          log({ status: "sold", id: e.id, slug: e.slug, side: e.side, filled: sold.filled, price: sold.price, cost: e.cost, profit: e.profit, why: e.why });
        }
        continue;
      }
      const rolled = !m?.ticker || m.ticker !== e.ticker;
      if (rolled || (row && (row.result === "win" || row.result === "loss"))) {
        e.status = "bell";
        changed = true;
        log({ status: "to the bell", id: e.id, slug: e.slug, side: e.side, contracts: e.contracts, cost: e.cost });
      }
    }

    // ENTRIES: the first mirrored-book paper trade in the open BTC window.
    if (cfg?.on && m?.ticker && m.closeTime && Number(a?.secondsLeft) > 60 && !Object.values(reg).some((e) => e.ticker === m.ticker)) {
      const row = rows
        .filter((r) => books.includes(r.book) && r.asset === "btc" && !r.dnaMode && !(r as any).stale && r.result === "open" && r.ticker === m.ticker && (!since || r.at >= since))
        .sort((x, y) => (x.at < y.at ? -1 : 1))[0];
      if (row) {
        const base: Mirror = { id: row.id, book: row.book, ticker: row.ticker, slug: "", side: row.side as "up" | "down", contracts: 0, cost: 0, at: new Date().toISOString(), status: "pending" };
        reg[row.id] = base;
        changed = true;
        const win = await pm.polyWindowFor(m.closeTime).catch(() => null);
        const mine = await pm.polymarketHoldings().catch(() => []);
        const hers = win?.slug ? mine.find((h: any) => h.slug === win.slug && Math.abs(h.net) > 0.01) : undefined;
        if (hers && Math.sign(hers.net) !== (row.side === "up" ? 1 : -1)) {
          reg[row.id] = { ...base, slug: win?.slug || "", status: "skipped", why: "you hold the other side of this window on Polymarket" };
          log({ status: "skipped", id: row.id, why: reg[row.id].why });
        } else {
          const fill = await pm.takeSide(row.side as "up" | "down", m.closeTime, dollars, maxAsk, 0.05, 0.02, ":mirror").catch((err: any) => {
            log({ status: "error", id: row.id, why: String(err?.message || err).slice(0, 160) });
            return null;
          });
          if (fill) {
            reg[row.id] = { ...base, slug: fill.slug, contracts: fill.filled, cost: fill.price, status: "open" };
            log({ status: "filled", id: row.id, book: row.book, setup: row.setup, side: row.side, slug: fill.slug, contracts: fill.filled, price: fill.price, paperAsk: row.ask });
          } else {
            reg[row.id] = { ...base, status: "missed", why: pm.takeSideWhy() };
            log({ status: "missed", id: row.id, side: row.side, why: reg[row.id].why });
          }
        }
      }
    }
    if (changed) write(reg);
  } catch {
  } finally {
    g.__polyMirrorBusy = false;
  }
}
