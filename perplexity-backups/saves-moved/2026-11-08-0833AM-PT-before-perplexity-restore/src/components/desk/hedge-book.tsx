import { useMemo, useState } from "react";
import { money } from "@/lib/desk/format";
import { cn } from "@/lib/cn";

const MAINS = [1.5, 2, 2.5, 3, 4, 5, 8];

function nets(mainStake: number, mainMult: number, hedgeStake: number, hedgeMult: number) {
  const win = mainStake * (mainMult - 1) - hedgeStake;
  const lose = -mainStake + hedgeStake * (hedgeMult - 1);
  return { win, lose };
}

export function HedgeBook() {
  const [mainStake, setMainStake] = useState(50);
  const [hedgeStake, setHedgeStake] = useState(10);
  const [hedgeMult, setHedgeMult] = useState(8);
  const cover = 1 / hedgeMult;
  const rows = useMemo(
    () =>
      MAINS.map((mult) => {
        const bare = nets(mainStake, mult, 0, hedgeMult);
        const hedged = nets(mainStake, mult, hedgeStake, hedgeMult);
        const pair = 1 / mult + 1 / hedgeMult;
        return { mult, bare, hedged, pair };
      }),
    [mainStake, hedgeStake, hedgeMult],
  );

  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <p className="text-[10px] tracking-[0.22em] text-muted">HEDGE</p>
      <p className="mt-2 max-w-xl text-sm text-subtle">
        One side pays. The other goes to zero. A hedge banks the win minus its whole cost. It only
        pads a loss when the other side is expensive. At 8×, a small hedge can do that. At 1:1, both
        near 2×, you give up most of the win and the loss is only smaller.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-muted">POSITION ${mainStake}</span>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={mainStake}
            onChange={(e) => setMainStake(Number(e.target.value))}
            className="mt-2 w-full accent-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-muted">HEDGE ${hedgeStake}</span>
          <input
            type="range"
            min={0}
            max={mainStake}
            step={1}
            value={hedgeStake}
            onChange={(e) => setHedgeStake(Number(e.target.value))}
            className="mt-2 w-full accent-white"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.18em] text-muted">HEDGE {hedgeMult.toFixed(1)}×</span>
          <input
            type="range"
            min={15}
            max={120}
            step={1}
            value={Math.round(hedgeMult * 10)}
            onChange={(e) => setHedgeMult(Number(e.target.value) / 10)}
            className="mt-2 w-full accent-white"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setHedgeStake(mainStake)}
          className="rounded-full border border-white/30 px-3 py-1 text-[10px] tracking-[0.16em] text-fg"
        >
          1:1 DOLLARS
        </button>
        <button
          type="button"
          onClick={() => {
            setHedgeMult(8);
            setHedgeStake(10);
          }}
          className="rounded-full border border-white/30 px-3 py-1 text-[10px] tracking-[0.16em] text-fg"
        >
          8× PAD
        </button>
      </div>

      <p className="mt-4 text-xs text-subtle">
        A {hedgeMult.toFixed(1)}× hedge costs {Math.round(cover * 100)}¢. It pays {money(hedgeStake * (hedgeMult - 1))} if
        the main loses, and costs the full {money(hedgeStake)} if the main wins.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left font-mono text-xs tabular-nums">
          <thead className="text-[10px] tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 pr-3 font-normal">MAIN</th>
              <th className="py-2 pr-3 font-normal">WIN ALONE</th>
              <th className="py-2 pr-3 font-normal">LOSS ALONE</th>
              <th className="py-2 pr-3 font-normal">WIN HEDGED</th>
              <th className="py-2 pr-3 font-normal">LOSS HEDGED</th>
              <th className="py-2 font-normal">BOTH PRICES</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.mult} className="border-t border-white/10">
                <td className="py-2 pr-3">{row.mult.toFixed(1)}×</td>
                <td className={cn("py-2 pr-3", row.bare.win >= 0 ? "text-up" : "text-down")}>{money(row.bare.win)}</td>
                <td className={cn("py-2 pr-3", row.bare.lose >= 0 ? "text-up" : "text-down")}>{money(row.bare.lose)}</td>
                <td className={cn("py-2 pr-3", row.hedged.win >= 0 ? "text-up" : "text-down")}>{money(row.hedged.win)}</td>
                <td className={cn("py-2 pr-3", row.hedged.lose >= 0 ? "text-up" : "text-down")}>{money(row.hedged.lose)}</td>
                <td className="py-2 text-subtle">{Math.round(row.pair * 100)}¢</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-subtle">
        Both prices under 100¢ means the other side is cheap enough that the hedge can finish green either way.
        Over 100¢, you are paying more than a dollar for the pair.
      </p>
    </section>
  );
}
