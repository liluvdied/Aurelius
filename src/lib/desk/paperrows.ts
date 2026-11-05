// fix721 REGULAR CARDS FOR TONIGHT'S PAPER BOOKS (Love Nov 5 2026 ~6:48 AM PT: "can you make cards for these ones?? like regular ones?"). Display only: reads each paper book's
// own file (they never send an order) and hands its trades to the SHIFT page in the same shape as every other book's rows, so each gets a regular card - $, W/L, hit %,
// 4H / 12H / 24H / ALL, tap for its trades, the sort buttons and the BEST / WORST tiers. Their own panels stay. Nothing here is read by the copier or any wall.
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
// file -> card book id (and, for the high multiple book, one card per way)
export const PAPER_BOOKS721: { file: string; book: string; title: string; split?: (r: any) => string | null }[] = [
  { file: "momentum-book-704.json", book: "mom704", title: "MOMENTUM BOOK · GO WITH IT (paper)" },
  { file: "high-multiple-707.json", book: "hm707-rev", title: "HIGH MULTIPLE · REVERSAL AT THE FARTHEST BAND (paper)", split: (r) => (String(r.way).startsWith("REVERSAL") ? "hm707-rev" : null) },
  { file: "high-multiple-707.json", book: "hm707-rip", title: "HIGH MULTIPLE · WITH THE RIP (paper)", split: (r) => (String(r.way).startsWith("WITH") ? "hm707-rip" : null) },
  { file: "inverse-book-688.json", book: "inv688", title: "INVERSE BOOK · HER LOSING SET UPS, FLIPPED (paper)" },
  { file: "club-book-690.json", book: "club690", title: "70% CLUB · HER BEST SET UPS (paper)" },
  { file: "half-band-709.json", book: "hb709", title: "HALF-BAND KEEP BOOK (paper)" },
  { file: "cup-book-713.json", book: "cup713", title: "CUP BOOK · 😊 ☹️ CUPS, HANDLES, DOUBLES (paper)" },
  { file: "main-vwap-694.json", book: "mv694", title: "MAIN · VWAP SIDE ONLY (paper)" },
  { file: "rej-parked-695.json", book: "rp695", title: "REJECTION · PARKED SIDE (paper)" },
];
export function paperBookRows721(): any[] {
  const out: any[] = [];
  const C = (G.__paper721 ||= {}) as Record<string, { key: string; rows: any[] }>;
  for (const pb of PAPER_BOOKS721) {
    try {
      const p = D(pb.file); if (!existsSync(p)) continue;
      const st = statSync(p), key = `${st.mtimeMs}:${st.size}`, ck = pb.book;
      if (C[ck]?.key === key) { out.push(...C[ck].rows); continue; }
      const raw = JSON.parse(readFileSync(p, "utf8")); const rows = Array.isArray(raw?.rows) ? raw.rows : [];
      const mine: any[] = [];
      for (const r of rows) {
        if (!r || !r.id || !r.at || !r.ticker || (r.side !== "up" && r.side !== "down")) continue;
        if (pb.split && pb.split(r) !== pb.book) continue;
        const pnl = r.result === "open" ? null : Number(r.pnlTp ?? r.pnlHold ?? r.pnl ?? NaN);
        const ask = Number(r.ask) || 0;
        mine.push({ id: `${r.id}:${pb.book}`, book: pb.book, at: r.at, asset: r.asset, ticker: r.ticker, side: r.side, setup: String(r.setup || r.way || r.label || r.key || r.list || pb.title).slice(0, 120), ask, multiple: ask > 0 ? Math.round((1 / ask) * 100) / 100 : null, stake: 20, result: r.result === "open" ? "open" : r.result === "win" ? "win" : "loss", exit: r.result === "open" ? "open" : r.soldBid != null ? `sold at ${Math.round(Number(r.soldBid) * 100)}c` : "held to the bell", pnl: Number.isFinite(pnl as number) ? pnl : null, paper721: true });
      }
      C[ck] = { key, rows: mine }; out.push(...mine);
    } catch {}
  }
  return out;
}
