import { useMemo, useState } from "react";
import { cents, money, multiple as formatMultiple, usd } from "@/lib/desk/format";
import { SCALE_STAKES, scaleTrade, type ScaleMode } from "@/lib/desk/fees";
import { cn } from "@/lib/cn";

const EXITS = [0.45, 0.5, 0.95];
const DAY_STAKES = [15, 20, 33, 50, 100];
const WINDOWS = 96;

export function ScaleBook() {
  const [mult, setMult] = useState(2);
  const [exitPct, setExitPct] = useState(0.5);
  const [mode, setMode] = useState<ScaleMode>("cash");

  const rows = useMemo(
    () => SCALE_STAKES.map((stake) => scaleTrade(stake, mult, exitPct, mode)),
    [mult, exitPct, mode],
  );
  const day = useMemo(
    () =>
      DAY_STAKES.map((stake) => {
        const win = scaleTrade(stake, mult, 0.4, "cash");
        const loss = scaleTrade(stake, mult, 0.4, "loss");
        return {
          stake,
          win: win.net,
          loss: loss.net,
          at75: WINDOWS * (0.75 * win.net + 0.25 * loss.net),
          at50: WINDOWS * (0.5 * win.net + 0.5 * loss.net),
        };
      }),
    [mult],
  );
  const five = rows[0];
  const hundred = rows.find((r) => r.stake === 100) ?? rows[0];
  const feePct = five.stake > 0 ? (five.feeIn / five.stake) * 100 : 0;

  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-muted">AFTER FEES</p>
          <p className={cn("mt-1 font-mono text-3xl tabular-nums leading-none", five.net >= 0 ? "text-up" : "text-down")}>
            {money(five.net)}
          </p>
          <p className="mt-2 text-xs text-subtle">$7.50 in. Same trade at $100 is {money(hundred.net)}.</p>
        </div>
        <p className="text-right font-mono text-xs tabular-nums text-muted">
          {formatMultiple(mult)}
          <span className="mt-1 block text-subtle">{cents(five.price)}</span>
        </p>
      </div>

      <label className="mt-5 block">
        <span className="text-[10px] tracking-[0.18em] text-muted">ENTRY MULTIPLE</span>
        <input
          type="range"
          min={134}
          max={800}
          value={Math.round(mult * 100)}
          onChange={(e) => setMult(Number(e.target.value) / 100)}
          className="mt-2 w-full accent-white"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["cash", "CASH OUT"],
            ["win", "SETTLES WIN"],
            ["loss", "SETTLES LOSE"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              "rounded-sm px-2 py-1 text-[10px] tracking-[0.16em]",
              mode === id ? "text-fg hairline-soft" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
        {mode === "cash"
          ? EXITS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setExitPct(pct)}
                className={cn(
                  "rounded-sm px-2 py-1 font-mono text-[11px] tabular-nums",
                  exitPct === pct ? "text-fg hairline-soft" : "text-muted",
                )}
              >
                {Math.round(pct * 100)}%
              </button>
            ))
          : null}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left font-mono text-[11px] tabular-nums">
          <thead className="text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 font-normal">STAKE</th>
              <th className="py-2 font-normal">IN</th>
              <th className="py-2 font-normal">FEE</th>
              <th className="py-2 font-normal">OUT</th>
              <th className="py-2 font-normal">FEE</th>
              <th className="py-2 text-right font-normal">GROSS</th>
              <th className="py-2 text-right font-normal">NET</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const mark = row.stake === 5 || row.stake === 100;
              return (
                <tr key={row.stake} className={cn("border-t border-line", mark ? "text-fg" : "text-muted")}>
                  <td className="py-2">${usd(row.stake, 0)}</td>
                  <td className="py-2">{cents(row.price)}</td>
                  <td className="py-2">{money(row.feeIn)}</td>
                  <td className="py-2">
                    {row.exit > 0 ? cents(row.exit) : "—"}
                    {row.capped ? " cap" : ""}
                  </td>
                  <td className="py-2">{row.feeOut ? money(row.feeOut) : "—"}</td>
                  <td className="py-2 text-right">{money(row.gross)}</td>
                  <td className={cn("py-2 text-right", row.net >= 0 ? "text-up" : "text-down")}>{money(row.net)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-subtle">
        Fee is 0.07 × contracts × price × (1 − price), rounded up to the next cent. At this price that is{" "}
        {feePct.toFixed(1)}% of the stake on the way in. Settlement charges nothing. The desk book is before the
        fee. Kalshi’s number is after it.
      </p>

      <div className="mt-8 overflow-x-auto">
        <p className="text-[10px] tracking-[0.22em] text-muted">ONE DAY</p>
        <p className="mt-2 text-xs leading-relaxed text-subtle">
          Banks 40% and stops. A loss is the whole stake. 96 windows, one every 15 minutes. The multiple above is the entry.
        </p>
        <table className="mt-3 w-full min-w-[36rem] text-left font-mono text-[11px] tabular-nums">
          <thead className="text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 font-normal">STAKE</th>
              <th className="py-2 text-right font-normal">WIN</th>
              <th className="py-2 text-right font-normal">LOSS</th>
              <th className="py-2 text-right font-normal">75% DAY</th>
              <th className="py-2 text-right font-normal">50% DAY</th>
            </tr>
          </thead>
          <tbody>
            {day.map((row) => (
              <tr key={row.stake} className={cn("border-t border-line", row.stake === 15 ? "text-fg" : "text-muted")}>
                <td className="py-2">${usd(row.stake, 0)}</td>
                <td className="py-2 text-right text-up">{money(row.win)}</td>
                <td className="py-2 text-right text-down">{money(row.loss)}</td>
                <td className={cn("py-2 text-right", row.at75 >= 0 ? "text-up" : "text-down")}>{money(row.at75)}</td>
                <td className={cn("py-2 text-right", row.at50 >= 0 ? "text-up" : "text-down")}>{money(row.at50)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
