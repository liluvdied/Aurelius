// CONFIRM + FIRST BREAK (Claude, Oct 3 ~1:15 PM PT, Love: "start a book that enters on a band break upon vantage or
// pepperstone, if the other follows afterwards... could help us secure more entries and not take trades that reverse
// on us immediately"). PAPER ONLY, never trades.
// Every 5 seconds: the latest BTC price on PEPPERSTONE and on VANTAGE, each against ITS OWN session lines (VWAP and
// every ±0.5σ band, 5 PM ET anchor). A BREAK = price closes the gap past a line by $3+ (so a tick on the line isn't one).
//   FIRST BREAK (brk1): enters the moment either feed breaks a line, no confirmation. The control book.
//   CONFIRM (confirm):  enters only when the OTHER feed breaks the same line, same direction, within 60 seconds.
// Both carry her 25% channel rule and the 1.38x minimum; one trade per window each. Every break (confirmed or not)
// is written to data/confirm-log.jsonl so we can see which ones reversed straight away.
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";
import { confirmConsider } from "./nightbook";
import { dnaNow } from "./dna";

const FEED: Record<"pep" | "van", string> = { pep: "PEPPERSTONE:BTCUSD", van: "VANTAGE:BTCUSD" };
const NAME: Record<"pep" | "van", string> = { pep: "Pepperstone", van: "Vantage" };
const WAIT_MS = 60_000;
const MARGIN = 3;
type Feed = "pep" | "van";
type Pend = { feed: Feed; k: number; dir: "up" | "down"; at: number; px: number; ticker: string };
type St = { at: number; busy: boolean; side: Record<string, number>; lines: Partial<Record<Feed, number[]>>; pend: Pend[] };
const g = globalThis as unknown as { __confirm?: St };
const lineName = (k: number) => (k === 0 ? "VWAP" : `${k > 0 ? "+" : ""}${k / 2}σ`);
const sigma = (vw: number, sd: number) => Array.from({ length: 13 }, (_, i) => vw + ((i - 6) / 2) * sd);
const log = (row: Record<string, unknown>) => {
  try {
    appendFileSync(join(process.cwd(), "data", "confirm-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...row }) + "\n");
  } catch {
    // study only
  }
};
async function lastPx(sym: string): Promise<number> {
  const b = (await chartRaw(sym, "1", 3)) as { t: number; c: number }[];
  b.sort((x, y) => x.t - y.t);
  return Number(b[b.length - 1]?.c) || 0;
}

type Mkt = { ticker: string; yesAsk: number; noAsk: number } | null | undefined;
export async function confirmTick(assets: Record<string, { spot?: number; target?: number | null; secondsLeft?: number; market?: Mkt }> | null | undefined) {
  const st = (g.__confirm ??= { at: 0, busy: false, side: {}, lines: {}, pend: [] });
  if (st.busy || Date.now() - st.at < 5000) return;
  st.busy = true;
  st.at = Date.now();
  try {
    const a = assets?.btc;
    const m = a?.market;
    try {
      const pb = JSON.parse(readFileSync(join(process.cwd(), "data", "bands-now.json"), "utf8"))?.btc;
      if (pb?.vwap > 0 && pb?.sd > 0) st.lines.pep = sigma(pb.vwap, pb.sd);
    } catch {
      // keep the last lines
    }
    const vb = await import("./twin").then((t) => t.twinBands()).catch(() => null);
    if (vb && Number(vb.vwap) > 0 && Number(vb.sd) > 0) st.lines.van = sigma(Number(vb.vwap), Number(vb.sd));
    if (!st.lines.pep || !st.lines.van) {
      try {
        const { writeFileSync } = await import("node:fs");
        writeFileSync(join(process.cwd(), "data", "confirm-now.json"), JSON.stringify({ at: new Date().toISOString(), waitingOn: !st.lines.pep ? "Pepperstone lines" : "Vantage lines" }));
      } catch {
        // status only
      }
      return;
    }
    const [pep, van] = await Promise.all([lastPx(FEED.pep).catch(() => 0), lastPx(FEED.van).catch(() => 0)]);
    const px: Record<Feed, number> = { pep, van };
    try {
      const { writeFileSync } = await import("node:fs");
      writeFileSync(join(process.cwd(), "data", "confirm-now.json"), JSON.stringify({ at: new Date().toISOString(), pep, van, pepVwap: st.lines.pep?.[6], vanVwap: st.lines.van?.[6], waiting: st.pend.map((x) => `${NAME[x.feed]} ${lineName(x.k)} ${x.dir}`) }));
    } catch {
      // status only
    }
    const now = Date.now();
    // Breaks that were never followed inside 60 s: written down, then dropped.
    for (const p of st.pend.filter((x) => now - x.at > WAIT_MS)) log({ kind: "unconfirmed", feed: p.feed, line: lineName(p.k), dir: p.dir, px: p.px, ticker: p.ticker });
    st.pend = st.pend.filter((x) => now - x.at <= WAIT_MS);
    for (const f of ["pep", "van"] as const) {
      const p = px[f];
      const L = st.lines[f]!;
      if (!(p > 0)) continue;
      for (let i = 0; i < L.length; i += 1) {
        const key = `${f}:${i}`;
        const was = st.side[key];
        const nowSide = p >= L[i] + MARGIN ? 1 : p <= L[i] - MARGIN ? -1 : was;
        st.side[key] = nowSide ?? 0;
        if (!was || !nowSide || was === nowSide) continue;
        const dir: "up" | "down" = nowSide > 0 ? "up" : "down";
        const k = i - 6;
        const ticker = m?.ticker ?? "";
        const other: Feed = f === "pep" ? "van" : "pep";
        const lead = st.pend.find((x) => x.feed === other && x.k === k && x.dir === dir);
        const canTrade = Boolean(m?.ticker) && Number(a?.secondsLeft) > 120;
        const ask = dir === "up" ? Number(m?.yesAsk) : Number(m?.noAsk);
        const okAsk = ask > 0.02 && ask <= 0.725; // her 1.38x minimum
        const dna = dnaNow("btc", dir, Number(a?.spot) || p, a?.target ?? 0, "chan");
        const bands = { spot: p, line: lineName(k), feed: NAME[f] } as Record<string, unknown>;
        if (lead) {
          st.pend = st.pend.filter((x) => x !== lead);
          const secs = Math.round((now - lead.at) / 1000);
          log({ kind: "confirmed", first: lead.feed, then: f, line: lineName(k), dir, secs, px: p, ticker, ask, dna });
          if (canTrade && okAsk && !dna) confirmConsider({ ticker: m!.ticker, side: dir, ask, label: `CONFIRM: ${NAME[lead.feed]} broke the ${lineName(k)} ${dir}, ${NAME[f]} followed ${secs}s later` }, "confirm", bands, p);
        } else {
          st.pend.push({ feed: f, k, dir, at: now, px: p, ticker });
          log({ kind: "first", feed: f, line: lineName(k), dir, px: p, ticker, ask, dna });
          if (canTrade && okAsk && !dna) confirmConsider({ ticker: m!.ticker, side: dir, ask, label: `FIRST BREAK: ${NAME[f]} broke the ${lineName(k)} ${dir}` }, "brk1", bands, p);
        }
      }
    }
  } finally {
    st.busy = false;
  }
}
