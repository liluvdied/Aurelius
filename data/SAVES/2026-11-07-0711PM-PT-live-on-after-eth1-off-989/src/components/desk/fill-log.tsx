import { money, multiple, usd } from "@/lib/desk/format";
import type { FillEvent } from "@/lib/desk/fill-log";
import { ASSET_META } from "@/lib/desk/types";
import { cn } from "@/lib/cn";

function when(at: string): string {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FillLog({ events }: { events: FillEvent[] }) {
  const liveEvents = events.filter((e) => e.venue === "kalshi" || e.venue === "polymarket");
  const taken = liveEvents.filter((e) => e.kind === "taken").length;
  const banked = liveEvents.filter((e) => e.kind === "banked").length;
  const highs = liveEvents
    .filter((e) => e.kind === "banked" && e.multiple >= 5)
    .sort((a, b) => b.multiple - a.multiple);

  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium tracking-[0.22em] text-muted">FILL LOG</p>
        <p className="text-right font-mono text-[11px] tabular-nums text-subtle">
          {taken} taken · {banked} banked
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-subtle">
        Stays after Kalshi nets a side off the book. Taken when it fills. Banked when it sells.
      </p>
      <div className="mt-4">
        <p className="text-[10px] tracking-[0.18em] text-muted">HIGH MULTIPLES</p>
        {highs.length === 0 ? (
          <p className="mt-2 text-sm text-subtle">Nothing at 5× or more has settled.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {highs.map((e) => {
              const profit = e.profit ?? 0;
              const hit = profit > 0.5;
              return (
                <li key={`hi-${e.id}`} className="flex items-start justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm text-fg">
                      {multiple(e.multiple)}
                      <span className={`ml-2 text-[10px] tracking-[0.16em] ${hit ? "text-up" : "text-down"}`}>
                        {hit ? "HIT" : "MISSED"}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {ASSET_META[e.asset].label} {e.side.toUpperCase()}
                      {e.pattern ? ` · ${e.pattern}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-mono text-sm tabular-nums", profit >= 0 ? "text-up" : "text-down")}>
                      {money(profit)}
                    </p>
                    <p className="font-mono text-[10px] text-subtle">{when(e.at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {liveEvents.length === 0 ? (
        <p className="mt-4 text-sm text-subtle">Nothing filled yet this session.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {liveEvents.map((e) => {
            const contract = e.side === "up" ? "YES" : "NO";
            const profit = e.profit ?? 0;
            const name = e.asset === "gold" ? "Gold" : "BTC";
            const tag = e.venue === "polymarket" ? "POLY" : "KALSHI";
            return (
              <li key={e.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-fg">
                    {name} {contract}
                    <span className="ml-2 text-[10px] tracking-[0.16em] text-subtle">
                      {tag} {e.kind === "taken" ? "FILL" : "BANKED"}
                      {e.opposite ? " · OPPOSITE" : ""}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {e.side.toUpperCase()}
                    {e.pattern ? ` · ${e.pattern}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      e.kind === "taken" ? "text-fg" : profit >= 0 ? "text-up" : "text-down",
                    )}
                  >
                    {e.kind === "banked" ? money(profit) : `$${usd(e.stake, 2)}`}
                  </p>
                  <p className="font-mono text-[11px] text-subtle">{multiple(e.multiple)}</p>
                  <p className="font-mono text-[10px] text-subtle">{when(e.at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
