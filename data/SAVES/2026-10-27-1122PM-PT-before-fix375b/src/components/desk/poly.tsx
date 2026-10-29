import { cents, money } from "@/lib/desk/format";
import type { PolyLedger } from "@/lib/desk/poly-ledger";

function when(at: string): string {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  });
}

function windowOf(slug: string): string {
  const match = slug.match(/(\d{2})(\d{2})z$/);
  if (!match) return slug.slice(-12);
  const end = (Number(match[1]) * 60 + Number(match[2]) + 15 - 7 * 60 + 24 * 60) % (24 * 60);
  const hour = Math.floor(end / 60);
  const h = hour % 12 || 12;
  return `${h}:${String(end % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

export function PolyBook({ book }: { book: PolyLedger }) {
  const off = book.rows.filter((row) => row.status === "off").length;
  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium tracking-[0.22em] text-muted">POLYMARKET</p>
        <p className="font-mono text-xs tabular-nums text-subtle">
          {book.checkedAt ? `checked ${when(book.checkedAt)}` : "waiting"}
          {book.cash != null ? ` · ${money(book.cash, 2).replace("+", "")}` : ""}
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-subtle">
        Every order stays here after it leaves their screen. If the cash move does not match the contract, the row stays off.
      </p>
      <ul className="mt-3 divide-y divide-line">
        {book.rows.length ? null : <li className="py-3 text-sm text-muted">No Polymarket orders yet.</li>}
        {book.rows.map((row) => {
          const tone =
            row.status === "off" || row.status === "missing"
              ? "text-down"
              : row.status === "paid" || row.status === "open"
                ? row.status === "paid"
                  ? "text-up"
                  : "text-fg"
                : "text-subtle";
          const moved =
            row.cashBefore != null && row.cashAfter != null ? row.cashAfter - row.cashBefore : null;
          return (
            <li key={row.slug} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.14em] text-fg">BTC {row.side.toUpperCase()}</p>
                  <p className="mt-0.5 font-mono text-[10px] tabular-nums text-subtle">
                    {windowOf(row.slug)} · {when(row.at)}
                    {row.orderId ? ` · ${row.orderId}` : ""}
                  </p>
                </div>
                <p className={`font-mono text-sm tabular-nums ${tone}`}>
                  {row.status === "open" ? "OPEN" : row.status === "paid" ? "PAID" : row.status === "missing" ? "MISSING" : row.status === "settled" ? "SETTLED" : "OFF"}
                </p>
              </div>
              <p className="mt-2 font-mono text-[11px] tabular-nums text-subtle">
                Desk ${row.deskStake.toFixed(2)} · {row.deskContracts.toFixed(2)} @ {cents(row.accountAvg || row.deskAsk)}
                {row.accountCost != null ? ` · cost $${row.accountCost.toFixed(2)}` : ""}
              </p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-subtle">
                {row.expected != null ? `Contract ${money(row.expected)}` : "Contract —"}
                {moved != null ? ` · cash ${money(moved)}` : ""}
                {row.beat != null && row.settlement != null
                  ? ` · ${row.settlement.toFixed(2)} vs ${row.beat.toFixed(2)}`
                  : ""}
              </p>
              <p className="mt-1 text-xs text-muted">{row.note}</p>
            </li>
          );
        })}
      </ul>
      {off ? null : book.rows.length ? <p className="mt-2 text-[10px] tracking-[0.16em] text-subtle">IN LINE</p> : null}
    </section>
  );
}
