// fix1046 BOOK GRID (Love Nov 9 2026 ~11:40 AM PT, her screenshots of the SCHEDULE grid + NEW SCHEDULE panel: a little table of cards, each a bit bigger than the schedule hour-blocks and smaller than
// the regular book cards, directly under NEW SCHEDULE · LIVE ONLY · KALSHI; tapping one pulls up that book's trades like the other cards; "the main + rej books / the eth.2's / xrp 5m / btc 5m" +
// the XRP 15m on Kalshi). Display only - reads the same rows as LIVE WIRE (every book's own trade rows, last 24 h). Nothing here sends, sizes or blocks an order.
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBookGrid1046 } from "@/lib/desk/bookgrid1046";
import { useDesk } from "@/lib/desk/store"; // fix1048 her Paper size box

export const GRID_BOOKS1046: { key: string; name: string }[] = [
  { key: "recon-tog", name: "MAIN 💞" },
  { key: "recon-rej", name: "REJ 🔁" },
  { key: "eth2872", name: "ETH.2" },
  { key: "eth682", name: "ETH · REJ" },
  { key: "xrp5m961", name: "XRP 5M · LANE" },
  { key: "p5m-xrp", name: "XRP 5M · NEW" },
  { key: "p5m-btc", name: "BTC 5M · NEW" },
  { key: "p5m-eth", name: "ETH 5M · NEW" },
  { key: "p5m-xrp15k", name: "XRP 15M · KALSHI" },
];
const UP = "#3ddc84", DOWN = "#ff5c5c";
const sign = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;
const clock = (at: string) => { try { return new Date(at).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }); } catch { return at; } };

export function BookGrid1046({ only, heart }: { only?: string[]; heart?: (book: string) => ReactNode } = {}) {
  const [open, setOpen] = useState("");
  const size = useDesk((s) => s.settings.stake) || 20; // fix1048 her Paper size box moves the cards (her XRP lane is real dollars - never re-figured)
  const real = (k: string) => k === "xrp5m961";
  // fix1046c a tap on a trade in NEW SCHEDULE opens that book's record here (Love Nov 9 2026 12:42 PM PT: "if i tap one of the trades it pulls up the record for the rest of that book")
  useEffect(() => { const f = (e: Event) => { const k = String((e as CustomEvent).detail || ""); if (GRID_BOOKS1046.some((b) => b.key === k)) setOpen(k); }; window.addEventListener("open-book-1046", f); return () => window.removeEventListener("open-book-1046", f); }, []);
  const q = useQuery({ queryKey: ["book-grid-1046"], queryFn: () => getBookGrid1046({ data: { books: GRID_BOOKS1046.map((b) => b.key) } }), refetchInterval: 10000, staleTime: 5000, placeholderData: (p) => p });
  const cards = only ? GRID_BOOKS1046.filter((book) => only.includes(book.key)) : GRID_BOOKS1046;
  const d = (q.data ?? {}) as Record<string, any>;
  const stats = (k: string) => { const s0 = d[k] || { n: 0, open: 0, nores: 0, w: 0, l: 0, pnl: 0, pnl20: 0, trades: [] }; const s = real(k) ? s0 : { ...s0, pnl: (Number(s0.pnl20 ?? s0.pnl) * size) / 20 }; return { ...s, mine: (s.trades as any[]).map((t: any) => (real(k) || !(Number(t.stake) > 0) || t.pnl == null ? t : { ...t, pnl: (Number(t.pnl) * size) / Number(t.stake) })) }; };
  const sel = cards.some((book) => book.key === open) ? stats(open) : null;
  return (
    <div className="mb-4" data-grid1046="1">
      <p className="mb-1.5 text-[9px] tracking-[0.22em] text-white/60">YOUR BOOKS · LAST 24 H · PAPER AT ${size} A TRADE · TAP ONE FOR ITS TRADES</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))" }}>
        {cards.map((b) => { const s = stats(b.key), c = s.pnl >= 0 ? UP : DOWN, hit = s.w + s.l ? Math.round((s.w / (s.w + s.l)) * 100) : null;
          return (
            <div key={b.key} className="relative">
            <button type="button" onClick={() => setOpen(open === b.key ? "" : b.key)} className="w-full rounded-lg border px-2 py-1.5 pr-7 text-left" style={{ borderColor: open === b.key ? "#ffffff" : "rgba(255,255,255,0.25)", minHeight: 64 }}>
              <p className="truncate text-[9px] tracking-[0.12em] text-white">{b.name}</p>
              <p className="font-mono text-[13px] tabular-nums" style={{ color: s.w + s.l ? c : "rgba(255,255,255,0.5)" }}>{s.w + s.l ? sign(s.pnl) : "—"}</p>
              <p className="font-mono text-[9px] tabular-nums text-white/60">{s.w}W · {s.l}L{hit != null ? ` · ${hit}%` : ""}{s.open ? ` · ${s.open} open` : ""}{s.nores ? ` · ${s.nores} no result` : ""}</p>
            </button>
            {heart && <div className="absolute right-1 top-1">{heart(b.key)}</div>}
            </div>); })}
      </div>
      {sel ? (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-white/20 px-3 py-1">
          {sel.mine.length === 0 ? <p className="py-2 text-[11px] text-white/55">No trades in the last 24 h.</p> : sel.mine.map((t: any) => (
            <div key={t.id} className="flex items-baseline justify-between gap-2 border-t border-white/10 py-1.5 first:border-t-0">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.12em] text-white">{String(t.asset).toUpperCase()} {t.side === "up" ? "LONG" : t.side === "down" ? "SHORT" : t.side} · {t.ask > 0 ? `${Math.round(t.ask * 100)}c` : ""}</p>
                <p className="truncate font-mono text-[9px] text-white/50">{clock(t.at)} · {t.setup}</p>
              </div>
              <p className="shrink-0 font-mono text-[12px] tabular-nums" style={{ color: t.result === "open" ? "#ffd479" : Number(t.pnl) >= 0 ? UP : DOWN }}>{t.result === "open" ? "OPEN" : t.pnl == null ? "—" : sign(Number(t.pnl))}</p>
            </div>))}
        </div>
      ) : null}
    </div>
  );
}
