import { useMemo, useRef, useState } from "react";
import { money, usd } from "@/lib/desk/format";
import type { FillEvent } from "@/lib/desk/fill-log";
import type { PrimeRow } from "@/lib/desk/prime-book";
import { whyTrade } from "@/components/desk/sitrep";

type Dot = {
  at: string;
  name: string;
  side: string;
  profit: number;
  stake: number;
  pattern: string;
  spot?: number | null;
  target?: number | null;
};

function nameOf(asset: string, ticker = ""): string {
  const blob = `${asset} ${ticker}`.toUpperCase();
  if (blob.includes("ETH")) return "ETH";
  if (blob.includes("SOL")) return "SOL";
  if (blob.includes("SILVER")) return "SILVER";
  if (blob.includes("GOLD")) return "GOLD";
  return "BTC";
}

function scaleOf(profit: number, stake: number, entry: number): number {
  if (!(stake > 0) || !(entry > 0)) return profit;
  return Math.round(profit * (entry / stake) * 100) / 100;
}

export function pointsFromFills(events: FillEvent[]): Dot[] {
  const named = new Map<string, { pattern: string; spot?: number | null; target?: number | null }>();
  for (const event of events) {
    if (event.kind !== "taken" || !event.pattern || event.pattern === "Live") continue;
    named.set(`${event.ticker}|${event.side}`, { pattern: event.pattern, spot: event.spot, target: event.target });
  }
  const seen = new Set<string>();
  const banked = events
    .filter((e) => e.venue === "kalshi" && e.kind === "banked" && e.profit != null)
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at));
  const rows: Dot[] = [];
  for (const event of banked) {
    if (seen.has(event.tradeId)) continue;
    seen.add(event.tradeId);
    const known = named.get(`${event.ticker}|${event.side}`);
    rows.push({
      at: event.at,
      name: nameOf(event.asset, event.ticker),
      side: event.side,
      profit: event.profit ?? 0,
      stake: event.stake,
      pattern: event.pattern && event.pattern !== "Live" ? event.pattern : (known?.pattern ?? event.pattern),
      spot: event.spot ?? known?.spot,
      target: event.target ?? known?.target,
    });
  }
  return rows;
}

export function pointsFromPrime(rows: PrimeRow[], venue?: string): Dot[] {
  return rows
    .filter((row) => row.result === "closed" && row.profit != null && (!venue || row.venue === venue))
    .slice()
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((row) => ({
      at: row.at,
      name: nameOf(row.asset),
      side: row.side,
      profit: row.profit ?? 0,
      stake: row.stake,
      pattern: row.pattern,
    }));
}

export function TapeBook({
  title,
  points,
  cash,
  list = true,
}: {
  title: string;
  points: Dot[];
  cash?: number | null;
  list?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [entry, setEntry] = useState(33);
  const dots = useMemo(() => {
    const recent = points.length > 80 ? points.slice(-80) : points;
    let run = 0;
    return recent.map((dot) => {
      const profit = scaleOf(dot.profit, dot.stake, entry);
      run = Math.round((run + profit) * 100) / 100;
      return { ...dot, profit, run };
    });
  }, [entry, points]);
  const last = dots.length - 1;
  const index = picked == null || picked > last ? last : picked;
  const here = index >= 0 ? dots[index] : null;
  const pnl = here ? here.run : 0;
  let lo = 0;
  let hi = 1;
  for (const dot of dots) {
    if (dot.run < lo) lo = dot.run;
    if (dot.run > hi) hi = dot.run;
  }
  const pad = Math.max((hi - lo) * 0.08, 0.5);
  lo -= pad;
  hi += pad;
  const span = hi - lo || 1;
  const x = (i: number) => (dots.length < 2 ? 50 : (i / (dots.length - 1)) * 100);
  const y = (v: number) => 8 + (1 - (v - lo) / span) * 74;
  const line =
    dots.length >= 2
      ? dots.map((dot, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(dot.run).toFixed(2)}`).join(" ")
      : "";

  function pickAt(clientX: number) {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || last < 1) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = Math.round(ratio * last);
    setPicked((prev) => (prev === next ? prev : next));
  }

  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.22em] text-muted">{title}</p>
          <p className={`mt-1 font-mono text-3xl tabular-nums leading-none ${pnl >= 0 ? "text-up" : "text-down"}`}>
            {money(pnl)}
          </p>
        </div>
        {cash != null ? (
          <div className="text-right">
            <p className="text-[10px] tracking-[0.22em] text-muted">AVAILABLE</p>
            <p className="mt-1 font-mono text-xl tabular-nums text-fg">${usd(cash, 2)}</p>
          </div>
        ) : (
          <p className="text-right font-mono text-xs tabular-nums text-white">
            {dots.filter((d) => d.profit >= 0).length}W / {dots.filter((d) => d.profit < 0).length}L
          </p>
        )}
      </div>
      <label className="mt-3 flex items-center gap-3 text-[10px] tracking-[0.16em] text-muted">
        ENTRY ${entry}
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={entry}
          onChange={(e) => setEntry(Number(e.target.value))}
          className="glass-range min-w-0 flex-1 cursor-pointer"
          aria-label={`${title} entry size`}
        />
      </label>
      <div
        ref={box}
        className="relative mt-3 h-40 touch-none"
        onPointerMove={(e) => pickAt(e.clientX)}
        onPointerDown={(e) => pickAt(e.clientX)}
        onPointerLeave={() => setPicked(null)}
        onPointerCancel={() => setPicked(null)}
      >
        {dots.length < 2 ? (
          <p className="pt-8 text-sm text-subtle">The line starts when the next trade closes.</p>
        ) : (
          <svg viewBox="0 0 100 90" className="h-full w-full" preserveAspectRatio="none">
            <path d={line} fill="none" stroke="#ffffff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
            {here ? (
              <circle cx={x(index)} cy={y(here.run)} r="1.6" fill={here.profit >= 0 ? "#3ddc84" : "#e23b3b"} />
            ) : null}
          </svg>
        )}
      </div>
      {here ? (
        <div className="mt-2">
          {picked != null ? (
            <p className="font-mono text-xs tabular-nums text-muted">
              {here.at.slice(5, 16).replace("T", " ")} · {here.name} {here.side.toUpperCase()} ·{" "}
              <span className={here.profit >= 0 ? "text-up" : "text-down"}>{money(here.profit)}</span>
              {" · "}
              <span className={here.run >= 0 ? "text-up" : "text-down"}>{money(here.run)}</span>
            </p>
          ) : (
            <p className="text-[10px] tracking-[0.18em] text-subtle">{dots.length} CLOSES · HOVER THE LINE</p>
          )}
          <p className="mt-1 text-[12px] leading-snug text-white/80">
            {whyTrade({ name: here.name, side: here.side, pattern: here.pattern, spot: here.spot, target: here.target })}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[10px] tracking-[0.18em] text-subtle">NO CLOSES YET</p>
      )}
      {list ? (
        <ul className="mt-3 max-h-72 overflow-y-auto">
          {dots
            .slice()
            .reverse()
            .map((dot, i) => (
              <li key={`${dot.at}-${i}`} className="flex items-baseline justify-between gap-3 border-b border-white/10 py-1.5">
                <p className="min-w-0 truncate font-mono text-[11px] text-subtle">
                  {dot.at.slice(5, 16).replace("T", " ")} · {dot.name} {dot.side.toUpperCase()}
                  {dot.pattern ? ` · ${dot.pattern}` : ""}
                </p>
                <p className={`shrink-0 font-mono text-[11px] tabular-nums ${dot.profit >= 0 ? "text-up" : "text-down"}`}>
                  {money(dot.profit)}
                </p>
              </li>
            ))}
        </ul>
      ) : null}
    </section>
  );
}
