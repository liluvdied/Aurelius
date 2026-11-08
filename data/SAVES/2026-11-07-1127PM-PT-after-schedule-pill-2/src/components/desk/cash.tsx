import { useRollingNumber } from "@/components/desk/rolling-price";
import { money, usd } from "@/lib/desk/format";

export type CashVenue = "paper" | "kalshi" | "poly";

export type CashRow = {
  id: string;
  at: string;
  label: string;
  profit: number | null;
  flag?: string;
};

function when(at: string): string {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CashBook({
  venue,
  onVenue,
  cash,
  anchor,
  trail,
  rows,
  flags,
}: {
  venue: CashVenue;
  onVenue: (venue: CashVenue) => void;
  cash: number | null;
  anchor: number | null;
  trail: { t: string; cash: number }[];
  rows: CashRow[];
  flags: string[];
}) {
  const pnl = cash != null && anchor != null ? cash - anchor : 0;
  const shownCash = useRollingNumber(cash ?? 0);
  const shownPnl = useRollingNumber(pnl);
  const pts = trail.filter((p) => Number.isFinite(p.cash)).slice(-160);
  let d = "";
  let area = "";
  if (pts.length >= 2) {
    const lo = Math.min(...pts.map((p) => p.cash));
    const hi = Math.max(...pts.map((p) => p.cash));
    const pad = Math.max(0.4, (hi - lo) * 0.35);
    const top = hi + pad;
    const bot = lo - pad;
    const y = (v: number) => 8 + (1 - (v - bot) / (top - bot || 1)) * 70;
    const x = (i: number) => (i / (pts.length - 1)) * 100;
    d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(p.cash).toFixed(2)}`).join(" ");
    const last = pts.length - 1;
    area = `${d} L${x(last).toFixed(2)},86 L0,86 Z`;
  }
  const up = pnl >= 0;
  const title = venue === "paper" ? "PAPER" : venue === "kalshi" ? "KALSHI" : "POLY";

  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <div className="flex gap-4 text-[10px] tracking-[0.22em]">
        {(["paper", "kalshi", "poly"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onVenue(id)}
            className={venue === id ? "text-fg" : "text-muted"}
          >
            {id === "paper" ? "PAPER" : id === "kalshi" ? "KALSHI" : "POLY"}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-muted">{title} CASH</p>
          <p className="mt-1 font-mono text-3xl tabular-nums leading-none text-fg">
            {cash == null ? "—" : `$${usd(shownCash, 2)}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-[0.22em] text-muted">SINCE START</p>
          <p className={`mt-1 font-mono text-xl tabular-nums ${up ? "text-up" : "text-down"}`}>
            {cash == null ? "—" : money(shownPnl)}
          </p>
        </div>
      </div>
      {pts.length < 2 ? (
        <p className="mt-6 text-sm text-subtle">The line starts on the next mark.</p>
      ) : (
        <svg viewBox="0 0 100 88" className="mt-4 h-44 w-full" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="cash-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={up ? "#5dbe86" : "#d46a6a"} stopOpacity="0.45" />
              <stop offset="100%" stopColor={up ? "#5dbe86" : "#d46a6a"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#cash-fill)" />
          <path d={d} fill="none" stroke="#ffffff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <p className="mt-2 font-mono text-[10px] tabular-nums text-subtle">
        {anchor != null ? `Started $${usd(anchor, 2)}` : ""}
        {pts.length ? ` · ${pts.length} marks` : ""}
      </p>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-[10px] tracking-[0.22em] text-muted">BOOK VS LOG</p>
        {flags.length === 0 ? (
          <p className="mt-2 text-sm text-subtle">Book and log match.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {flags.map((flag) => (
              <li key={flag} className="text-sm text-down">
                {flag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-[10px] tracking-[0.22em] text-muted">LEDGER</p>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-subtle">Nothing closed on this book yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/10">
            {rows.slice(0, 40).map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-fg">{row.label}</p>
                  <p className="font-mono text-[10px] text-subtle">
                    {when(row.at)}
                    {row.flag ? ` · ${row.flag}` : ""}
                  </p>
                </div>
                <p className={`shrink-0 font-mono text-sm tabular-nums ${row.profit != null && row.profit < 0 ? "text-down" : "text-up"}`}>
                  {row.profit == null ? "—" : money(row.profit)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
