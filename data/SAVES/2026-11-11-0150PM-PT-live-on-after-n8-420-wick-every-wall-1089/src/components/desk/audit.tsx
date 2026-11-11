import { money } from "@/lib/desk/format";
import type { AuditRow } from "@/lib/desk/audit";

function when(at: string): string {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  });
}

function windowOf(ticker: string): string {
  const m = ticker.match(/SEP(\d{2})(\d{2})(\d{2})/);
  if (!m) return ticker.slice(-8);
  const hour = (Number(m[2]) + 24 - 3) % 24;
  const h = hour % 12 || 12;
  return `${h}:${m[3]} ${hour < 12 ? "AM" : "PM"}`;
}

export function Audit({ rows }: { rows: AuditRow[] }) {
  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium tracking-[0.22em] text-muted">MATCH</p>
        <p className="font-mono text-xs tabular-nums text-subtle">{rows.length ? `${rows.length} patched` : "in sync"}</p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-subtle">
        Kalshi is the account. When the desk or the paper book disagrees, the row is set to Kalshi, fees included.
      </p>
      <ul className="mt-3 divide-y divide-line">
        {rows.length ? null : <li className="py-3 text-sm text-muted">Nothing is off.</li>}
        {rows.map((row) => (
          <li key={`${row.at}:${row.ticker}`} className="flex items-start justify-between gap-3 py-3">
            <div>
              <p className="text-xs tracking-[0.14em] text-fg">
                {row.asset.toUpperCase()} {row.side.toUpperCase()}
              </p>
              <p className="mt-0.5 font-mono text-[10px] tabular-nums text-subtle">
                {windowOf(row.ticker)} · {when(row.at)}
              </p>
              <p className="mt-1 text-xs text-muted">
                Desk {row.desk == null ? "open" : money(row.desk)}
                {row.paper == null ? "" : ` · paper ${money(row.paper)}`}
              </p>
            </div>
            <p className={`font-mono text-sm tabular-nums ${row.kalshi >= 0 ? "text-up" : "text-down"}`}>
              {money(row.kalshi)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
