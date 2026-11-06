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
  { file: "rsi-books.json", book: "rsi672", title: "RSI BOOKS · 5M / 15M / 30M / 1H / 4H · PAPER" }, // fix765b
  { file: "eth-book.json", book: "eth682", title: "ETH · REJECTIONS ONLY · NO PINK · PAPER" }, // fix765b
  { file: "og-1012.json", book: "og1012", title: "OG ORIGINAL · 10.12 🕯️ · PAPER · SEALED" }, // fix765: a regular card (her sealed rows read as they are)
  { file: "brk-out-687.json", book: "brkout687", title: "OUTWARD BREAK · SESSION BANDS · PAPER 🤍" }, // fix765
  { file: "v111-2-770.json", book: "v1112", title: "V.111 - 2 · HER SEP 24 READS · PAPER" }, // fix770: her own card
  { file: "v111-2-inv-777.json", book: "v1112inv", title: "V.111 - 2 INV · HER TAKES FLIPPED · PAPER" }, // fix777: the inverse paper book's card
  { file: "bestie-walls-783.json", book: "bestiewalls", title: "BESTIE · WALLS · MAIN'S BAND / ZONE DOOR · PAPER $5" }, // fix783
  { file: "bestie-walls-skips-783.json", book: "bestiewalls-skip", title: "BESTIE · WALLS · BLOCKED · WHAT THEY WOULD HAVE DONE" }, // fix783: every take main's door refused + its would-have result
];
export function paperBookRows721(): any[] {
  const out: any[] = [];
  const C = (G.__paper721 ||= {}) as Record<string, { key: string; rows: any[] }>;
  for (const pb of PAPER_BOOKS721) {
    try {
      const p = D(pb.file); if (!existsSync(p)) continue;
      const st = statSync(p), key = `${st.mtimeMs}:${st.size}`, ck = pb.book;
      if (C[ck]?.key === key) { out.push(...C[ck].rows); continue; }
      const raw = JSON.parse(readFileSync(p, "utf8")); const rows = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw /* fix765: og-1012.json is a plain list */ : [];
      const mine: any[] = [];
      for (const r of rows) {
        if (!r || !r.id || !r.at || !r.ticker || (r.side !== "up" && r.side !== "down")) continue;
        if (pb.split && pb.split(r) !== pb.book) continue;
        const pnl = r.result === "open" ? null : Number(r.pnlTp ?? r.pnlHold ?? r.pnl ?? NaN);
        const ask = Number(r.ask) || 0;
        mine.push({ id: `${r.id}:${pb.book}`, book: pb.book, at: r.at, asset: r.asset || (/ETH/.test(String(r.ticker)) ? "eth" : /GOLD/.test(String(r.ticker)) ? "gold" : "btc") /* fix765b */, ticker: r.ticker, side: r.side, setup: String(r.setup || r.way || r.label || r.key || r.list || (pb.book === "rsi672" && r.book ? `${r.book} · ${r.market || ""}` : "") || pb.title).slice(0, 120), ask, multiple: ask > 0 ? Math.round((1 / ask) * 100) / 100 : null, stake: pb.book === "bestiewalls" || pb.book === "bestiewalls-skip" ? 5 /* fix783 */ : 20, result: r.result === "open" ? "open" : r.result === "win" ? "win" : "loss", exit: r.result === "open" ? "open" : r.soldBid != null ? `sold at ${Math.round(Number(r.soldBid) * 100)}c` : "held to the bell", pnl: Number.isFinite(pnl as number) ? pnl : null, paper721: true });
      }
      C[ck] = { key, rows: mine }; out.push(...mine);
    } catch {}
  }
  return out;
}

// fix766 ON KALSHI NOW · AKIMBO LIVE (Love Nov 5 2026 5:06 PM PT: "the new active ledger for what's on kalshi rn doesn't have its own card still bb , can you give her one so we can see the actual record ?"):
// display only. The card's rows are the desk's REAL Kalshi trades (riskguard.liveTrades: Kalshi fills + settlements, add-ons included) for whatever the live lineup is - the live-today
// (AKIMBO) books, plain live-today books and her main lineup (2-3 PM hand-over) - since AKIMBO went live (Nov 5 2026 6:36 AM PT). No paper rows. Windows only her hand traded are not desk trades.
export async function kalshiNowRows766(): Promise<any[]> {
  try {
    const C = (G.__kn766 ||= { at: 0, rows: [] as any[] }); if (Date.now() - C.at < 15000) return C.rows;
    const books = new Set<string>(["brk-sesspk", "brk15", "gmid2", "recon-tog", "recon-rej", "recon-dly", "recon-togp"]);
    try { const j = JSON.parse(readFileSync(D("live-today.json"), "utf8")); for (const b of String(j?.book || "").split(",")) if (b) books.add(b); for (const b of Array.isArray(j?.plain) ? j.plain : []) books.add(String(b)); } catch {}
    const side: Record<string, string> = {}; try { const d = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); for (const v of Object.values(d) as any[]) if (v && v.ticker && (v.status === "filled" || v.status === "partial") && !side[v.ticker]) side[v.ticker] = String(v.side || ""); } catch {}
    // fix768: the book is the 2nd part of the ticket's key (TICKER:book:...) - not the last part (a TOGETHER ":n2" ticket read as a book called "n2" and fell off this card)
    const own768: Record<string, string> = {}; try { const d = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); for (const [k, v] of Object.entries(d) as [string, any][]) if (v && (v.status === "filled" || v.status === "partial")) { const tk = String(v.ticker || k.split(":")[0]); if (!own768[tk]) own768[tk] = String(k.split(":")[1] || ""); } } catch {}
    const rg: any = await import("./riskguard"); const since = "2026-11-05T14:36:00Z";
    const rows = (rg.liveTrades() as any[]).map((t) => ({ ...t, book: own768[t.ticker] || t.book })).filter((t) => books.has(String(t.book)) && String(t.first) >= since).map((t) => {
      const asset = /GOLD/.test(String(t.ticker)) ? "gold" : /SILVER/.test(String(t.ticker)) ? "silver" : "btc", open = !(Number(t.end) > 0) || Date.now() < Number(t.end);
      return { id: `${t.ticker}:kalshinow766`, book: "kalshinow766", at: t.first, asset, ticker: t.ticker, side: side[t.ticker] === "down" ? "down" : "up", setup: `${t.book} · live on Kalshi`, ask: 0, multiple: null, stake: 0,
        result: open ? "open" : Number(t.pnl) > 0 ? "win" : "loss", exit: open ? "open" : "settled on Kalshi", pnl: open ? null : Number(t.pnl), paper721: true, kalshiTrue: true };
    });
    C.at = Date.now(); C.rows = rows; return rows;
  } catch { return []; }
}
