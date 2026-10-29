// NEW SCHEDULE · LIVE ONLY (fix385, Claude, Love Oct 28 2026 12:04 PM PT: "can you create a new card for our the books running on our new schedule only? so the
// trades that show on there are actually what she took across the different books she's trading / and pls have it label which book it came from like our others").
// Only real Kalshi positions since the new schedule began, each labelled with the book that took it. Read-only.
import { useQuery } from "@tanstack/react-query";
import { getScheduleLive } from "@/lib/desk/fns";

const NAME: Record<string, string> = {
  "recon-tog": "MAIN 💞",
  "recon-rej": "REJECTION 🔁",
  "recon-togp": "NO-PINK COPY 🩷",
  "recon-np": "PURE NO-PINK 🤍",
  "recon-sov": "SOVEREIGN TWIN 👑",
  "recon-dly": "DELAYED TWIN ⏳",
};
const UP = "#3ddc84";
const DOWN = "#ff5c5c";
const sign = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;
const clock = (at: string) =>
  new Date(at).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ScheduleLiveCard() {
  const q = useQuery({ queryKey: ["schedule-live"], queryFn: () => getScheduleLive(), refetchInterval: 30000 });
  const trades = q.data?.trades ?? [];
  const done = trades.filter((t) => t.pnl != null);
  const total = done.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const wins = done.filter((t) => (t.pnl ?? 0) > 0.05).length;
  const losses = done.filter((t) => (t.pnl ?? 0) < -0.05).length;
  const byBook = new Map<string, { n: number; pnl: number }>();
  for (const t of done) {
    const b = byBook.get(t.book) || { n: 0, pnl: 0 };
    b.n += 1;
    b.pnl += t.pnl ?? 0;
    byBook.set(t.book, b);
  }
  const c = total >= 0 ? UP : DOWN;
  return (
    <div className="mb-4 rounded-2xl border px-4 py-3" style={{ borderColor: "#3ddc84", boxShadow: "0 0 12px rgba(61,220,132,0.3)" }}>
      <p className="text-[10px] tracking-[0.26em] text-white">NEW SCHEDULE 🗓️ · LIVE ONLY · KALSHI</p>
      <p className="text-[9px] leading-snug text-white/55">
        Only the trades she actually took on Kalshi since the new schedule began (10:30 AM PT Oct 28), labelled by the book that took each one. Real dollars, fills and fees included.
      </p>
      <p className="mt-1 font-mono text-2xl tabular-nums" style={{ color: c, textShadow: `0 0 10px ${c}` }}>{sign(total)}</p>
      <p className="font-mono text-[11px] tabular-nums text-white/80">
        {wins}W · {losses}L{wins + losses ? ` · ${Math.round((wins / (wins + losses)) * 100)}% wins` : ""}
        {trades.length - done.length ? ` · ${trades.length - done.length} open` : ""}
      </p>
      {byBook.size ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[...byBook.entries()].sort((a, b) => b[1].pnl - a[1].pnl).map(([b, s]) => (
            <span key={b} className="rounded-full border px-2 py-0.5 font-mono text-[9px] tracking-[0.1em]" style={{ borderColor: "rgba(255,255,255,0.22)", color: s.pnl >= 0 ? UP : DOWN }}>
              {NAME[b] ?? b} {sign(s.pnl)} · {s.n}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 max-h-80 overflow-y-auto">
        {trades.length === 0 ? (
          <p className="text-[11px] text-white/55">No live trades yet on the new schedule.</p>
        ) : (
          trades.map((t) => (
            <div key={t.ticker} className="flex items-baseline justify-between gap-2 border-t border-white/10 py-1.5">
              <div className="min-w-0">
                <p className="text-[10px] tracking-[0.14em] text-white">
                  {NAME[t.book] ?? t.book} · {t.asset.toUpperCase()} {t.side === "up" ? "LONG" : t.side === "down" ? "SHORT" : t.side}
                </p>
                <p className="font-mono text-[9px] text-white/50">
                  {clock(t.at)} · ${t.cost.toFixed(2)} in{t.buys > 1 ? ` · ${t.buys - 1} add-on${t.buys > 2 ? "s" : ""}` : ""}
                </p>
              </div>
              <p className="shrink-0 font-mono text-[12px] tabular-nums" style={{ color: t.pnl == null ? "#ffd479" : t.pnl >= 0 ? UP : DOWN }}>
                {t.pnl == null ? "OPEN" : sign(t.pnl)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
