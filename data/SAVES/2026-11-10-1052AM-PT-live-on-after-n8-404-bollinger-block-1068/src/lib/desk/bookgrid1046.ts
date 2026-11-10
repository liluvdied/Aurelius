// fix1046 HER BOOK GRID (Love Nov 9 2026 ~11:40 AM PT: her books as a little table of cards under NEW SCHEDULE, tap one for its trades): each listed book's full last 24 h, its stats and its
// trades (newest 200), computed on the server so the page stays light. Display only - reads the same rows as LIVE WIRE; never touches an order.
import { createServerFn } from "@tanstack/react-start";
import { wireRows1044, type Wire1044 } from "./livewire1044";
export const getBookGrid1046 = createServerFn({ method: "POST" })
  .validator((input: { books: string[] }) => input)
  .handler(async ({ data }): Promise<Record<string, { n: number; open: number; nores: number; w: number; l: number; pnl: number; pnl20: number; trades: Wire1044[] }>> => {
    const all = await wireRows1044(24, 1000000), out: Record<string, any> = {};
    for (const k of (data.books || []).slice(0, 30)) { const mine = all.filter((r) => r.book === k), done = mine.filter((r) => r.result !== "open" && r.pnl != null);
      out[k] = { pnl20: done.reduce((t, r) => t + (Number(r.stake) > 0 ? (Number(r.pnl) * 20) / Number(r.stake) : Number(r.pnl)), 0) /* fix1048 at $20 a ticket */, n: mine.length, open: mine.filter((r) => r.result === "open").length, nores: mine.filter((r) => r.result !== "open" && r.pnl == null).length, w: done.filter((r) => Number(r.pnl) > 0).length, l: done.filter((r) => Number(r.pnl) <= 0).length, pnl: Math.round(done.reduce((s, r) => s + Number(r.pnl), 0) * 100) / 100, trades: mine.slice(0, 200) }; }
    return out;
  });
