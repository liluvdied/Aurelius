import { useState } from "react";
import { money, multiple, pct, usd } from "@/lib/desk/format";
import { goldHaltFill } from "@/lib/desk/hours";
import { firedBackwards, outcomeProfit, sized } from "@/lib/desk/paper";
import type { FillEvent } from "@/lib/desk/fill-log";
import type { ExitNote } from "@/lib/desk/fns";
import type { PrimeRow } from "@/lib/desk/prime-book";
import type { Trade } from "@/lib/desk/types";
import { ASSET_META } from "@/lib/desk/types";
import { explainExit } from "@/components/desk/sitrep";
import { cn } from "@/lib/cn";

function when(at: string): string {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function Notes({
  notices,
}: {
  notices: { id: string; at: string; kind: "problem" | "fixed"; text: string }[];
}) {
  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <p className="text-[10px] font-medium tracking-[0.22em] text-muted">ALERTS</p>
      {notices.length === 0 ? (
        <p className="mt-4 text-sm text-subtle">No alarms.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {notices.map((row) => (
            <li key={row.id} className="flex items-start gap-3 rounded-md border border-white bg-black px-4 py-2.5">
              <span className={`font-mono text-sm ${row.kind === "problem" ? "text-down" : "text-up"}`}>
                {row.kind === "problem" ? "×" : "✓"}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-white">{row.text}</p>
                <p className="mt-0.5 font-mono text-[10px] tabular-nums text-white/60">{when(row.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function exitFor(trade: Trade, exits: ExitNote[]): ExitNote | undefined {
  const rows = exits.filter((row) => row.ticker && row.ticker === trade.ticker);
  if (!rows.length) return undefined;
  const at = Date.parse(trade.closedAt ?? trade.openedAt ?? "");
  if (!Number.isFinite(at)) return rows[0];
  return rows.reduce((best, row) => {
    const gap = Math.abs(Date.parse(row.at ?? "") - at);
    const bestGap = Math.abs(Date.parse(best.at ?? "") - at);
    return gap < bestGap ? row : best;
  });
}

function ledgerLine(trade: Trade, exits: ExitNote[]): string {
  const exit = exitFor(trade, exits);
  if (exit) return explainExit(exit);
  const asset = trade.asset === "gold" ? "Gold" : "Bitcoin";
  const way = trade.side === "down" ? "short" : "long";
  const name = `${asset} ${way}`;
  const note = trade.notes ?? "";
  if (note === "Settled off.") return `${name} ran to the window and settled off. It was not sold while it was still open.`;
  if (note === "Settled on Kalshi." || note.startsWith("Settled up")) {
    return note.startsWith("Settled up") ? note : `${name} ran to the window and settled in the money.`;
  }
  const banked = note.match(/Banked at (\d+)%.*Target was (\d+)%/);
  if (banked && (trade.profit ?? 0) >= 0) return `${name} reached ${banked[1]}% against a ${banked[2]}% target. The trailing take profit caught the highest quote.`;
  if ((trade.profit ?? 0) < 0) return `${name} was sold in the red. That was not a take profit. ${note}`.trim();
  return note || trade.patternLabel;
}

function exitName(row: ExitNote): string {
  const ticker = row.ticker ?? "";
  if (ticker.includes("ETH")) return "ETH";
  if (ticker.includes("SOL")) return "SOL";
  if (ticker.includes("SILVER")) return "SILVER";
  if (ticker.includes("GOLD") || row.asset === "gold") return "GOLD";
  return "BTC";
}

export function Journal({
  trades,
  stake,
  outcomes = false,
  exits = [],
  mirrorExits = false,
}: {
  trades: Trade[];
  stake: number;
  outcomes?: boolean;
  exits?: ExitNote[];
  mirrorExits?: boolean;
}) {
  const closed = trades.filter((t) => t.result !== "open" && !(outcomes && firedBackwards(t)));
  const scored = closed.filter((t) => !goldHaltFill(t));
  let wins = 0;
  let losses = 0;
  for (const t of scored) {
    if (outcomes) {
      const n = outcomeProfit(t);
      if (n == null) continue;
      if (n >= 0) wins += 1;
      else losses += 1;
      continue;
    }
    if (t.result === "win" || (t.result === "exited" && (t.profit ?? 0) >= 0)) wins += 1;
    else losses += 1;
  }
  const loose = mirrorExits
    ? exits.filter((row) => row.ticker && !closed.some((t) => t.ticker === row.ticker)).slice(0, 12)
    : [];
  for (const row of loose) {
    if ((row.profit ?? 0) >= 0) wins += 1;
    else losses += 1;
  }
  const hit = wins + losses ? (wins / (wins + losses)) * 100 : 0;
  const listed = outcomes ? closed : closed.slice(0, 20);

  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-medium tracking-[0.22em] text-muted">LEDGER</p>
        <p className="text-right font-mono text-xs tabular-nums">
          <span className="text-up">{wins} hit</span>
          <span className="text-white"> / </span>
          <span className="text-down">{losses} lost</span>
          <span className="mt-1 block text-[10px] text-white">{wins + losses ? pct(hit, 0) : ""}</span>
        </p>
      </div>
      {listed.length === 0 && loose.length === 0 ? (
        <p className="mt-4 text-sm text-subtle">Nothing closed yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {loose.map((row, i) => {
            const profit = row.profit ?? 0;
            return (
              <li key={`exit-${row.ticker}-${row.at}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-white bg-black px-4 py-2.5 text-white">
                <div className="min-w-0">
                  <p className="text-sm text-white">
                    {exitName(row)} {(row.side ?? "").toUpperCase()}
                    <span className="ml-2 text-xs uppercase tracking-wider text-white">{profit >= 0 ? "exited" : "loss"} · kalshi</span>
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-white">
                    <span>{explainExit(row)}</span>
                    <span className="ml-2 font-mono text-[10px] tabular-nums text-white">{when(row.at ?? "")}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("font-mono text-sm tabular-nums", profit >= 0 ? "text-up" : "text-down")}>{money(profit)}</p>
                </div>
              </li>
            );
          })}
          {listed.map((t) => {
            const halted = goldHaltFill(t);
            const scored = outcomes ? outcomeProfit(t) : null;
            const profit = scored != null ? scored : halted || t.probe || t.source === "live" ? (t.profit ?? 0) : sized(t.profit ?? 0, t.stake, stake);
            const rawMax = t.contracts > 0 ? t.contracts : t.ask > 0 ? t.stake / t.ask : 0;
            const maxPayout = halted || t.probe || t.source === "live" ? rawMax : sized(rawMax, t.stake, stake);
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-md border border-white bg-black px-4 py-2.5 text-white"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white">
                    {(ASSET_META[t.asset]?.label ?? t.asset)} {(t.side ?? "").toUpperCase()}
                    <span className="ml-2 text-xs uppercase tracking-wider text-white">
                      {t.result}
                      {halted ? " · book closed" : ""}
                      {t.autoFilled ? " · auto" : ""}
                      {t.probe ? " · $1 probe" : ""}
                      {t.venue === "polymarket" ? " · polymarket" : t.source === "live" ? " · kalshi" : ""}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-white">
                    <span>{ledgerLine(t, exits)}</span>
                    <span className="ml-2 font-mono text-[10px] tabular-nums text-white">{when(t.openedAt)}</span>
                  </p>
                  {t.grokThesis ? <p className="mt-1 line-clamp-2 text-xs text-white/80">{t.grokThesis}</p> : null}
                  {t.notes && t.venue === "polymarket" ? (
                    <p className="mt-1 text-xs text-subtle">{t.notes}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      halted ? "text-subtle" : profit >= 0 ? "text-up" : "text-down",
                    )}
                  >
                    {halted ? "scratch" : money(profit)}
                  </p>
                  <p className="font-mono text-[11px] text-white">{multiple(t.multiple)}</p>
                  {t.result === "exited" && t.exitPct != null && profit >= 0 ? (
                    <p className="font-mono text-[10px] text-white">exit {pct(t.exitPct, 0)}</p>
                  ) : null}
                  <p className="font-mono text-[10px] text-white">max ${usd(maxPayout, 2)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function DayBook({ trades }: { trades: Trade[] }) {
  const days = new Map<string, { hit: number; lost: number; pnl: number }>();
  for (const trade of trades) {
    if (trade.source === "live" || trade.venue === "polymarket" || trade.result === "open" || firedBackwards(trade)) continue;
    const n = outcomeProfit(trade);
    if (n == null || !trade.openedAt) continue;
    const key = new Date(trade.openedAt).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    const row = days.get(key) ?? { hit: 0, lost: 0, pnl: 0 };
    row.pnl += n;
    if (n >= 0) row.hit += 1;
    else row.lost += 1;
    days.set(key, row);
  }
  const keys = [...days.keys()].sort();
  if (!keys.length) {
    return (
      <section className="rounded-md bg-surface px-4 py-4 hairline">
        <p className="text-[10px] tracking-[0.22em] text-muted">DAY BOOK</p>
        <p className="mt-3 text-sm text-subtle">No settled calls yet.</p>
      </section>
    );
  }
  const first = new Date(`${keys[0]}T12:00:00`);
  const last = new Date(`${keys[keys.length - 1]}T12:00:00`);
  const start = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date(last.getFullYear(), last.getMonth() + 1, 0);
  const cells: { key: string; day: number; inMonth: boolean }[] = [];
  const pad = start.getDay();
  for (let i = 0; i < pad; i += 1) cells.push({ key: `pad-${i}`, day: 0, inMonth: false });
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    cells.push({ key, day: d.getDate(), inMonth: true });
  }
  let hit = 0;
  let lost = 0;
  let pnl = 0;
  for (const row of days.values()) {
    hit += row.hit;
    lost += row.lost;
    pnl += row.pnl;
  }
  return (
    <section className="rounded-md bg-surface px-4 py-4 hairline">
      <div className="flex items-end justify-between gap-3">
        <p className="text-[10px] tracking-[0.22em] text-muted">DAY BOOK</p>
        <p className="text-right font-mono text-xs">
          <span className={pnl >= 0 ? "text-up" : "text-down"}>{money(pnl)}</span>
          <span className="mt-1 block">
            <span className="text-up">{hit} hit</span>
            <span className="text-muted"> / </span>
            <span className="text-down">{lost} lost</span>
            <span className="text-muted"> · {hit + lost ? Math.round((hit / (hit + lost)) * 100) : 0}%</span>
          </span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] tracking-[0.12em] text-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={`${d}${i}`}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const row = cell.inMonth ? days.get(cell.key) : undefined;
          return (
            <div key={cell.key} className="min-h-14 rounded-md border border-white/15 bg-black px-1 py-1">
              {cell.inMonth ? (
                <>
                  <p className="text-[10px] text-white/50">{cell.day}</p>
                  {row ? (
                    <>
                      <p className={`font-mono text-[10px] tabular-nums ${row.pnl >= 0 ? "text-up" : "text-down"}`}>
                        {row.pnl >= 0 ? "+" : ""}
                        {Math.round(row.pnl)}
                      </p>
                      <p className="font-mono text-[9px] text-white/70">
                        <span className="text-up">{row.hit}</span>
                        <span>/{row.hit + row.lost}</span>
                      </p>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function orderRows(
  rows: [string, { w: number; n: number; pnl: number }][],
  mode: "hit" | "dollars",
  worst: boolean,
) {
  return [...rows].sort((a, b) => {
    if (mode === "dollars") return worst ? a[1].pnl - b[1].pnl : b[1].pnl - a[1].pnl;
    const ar = a[1].n ? a[1].w / a[1].n : 0;
    const br = b[1].n ? b[1].w / b[1].n : 0;
    if (br !== ar) return br - ar;
    if (b[1].n !== a[1].n) return b[1].n - a[1].n;
    return b[1].pnl - a[1].pnl;
  });
}

function RankTable({
  title,
  rows,
}: {
  title: string;
  rows: [string, { w: number; n: number; pnl: number }][];
}) {
  return (
    <div className="mt-4 rounded-md border border-white/40 bg-black p-3 shadow-[0_0_14px_rgba(255,255,255,0.16)]">
      <p className="text-[10px] tracking-[0.18em] text-white">{title}</p>
      <table className="mt-2 w-full text-left text-sm">
        <thead>
          <tr className="text-[10px] tracking-[0.16em] text-white/50">
            <th className="pb-2 font-medium">SETUP</th>
            <th className="pb-2 text-right font-medium">HIT</th>
            <th className="pb-2 text-right font-medium">RATE</th>
            <th className="pb-2 text-right font-medium">P&L</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="py-3 text-white/50" colSpan={4}>
                None.
              </td>
            </tr>
          ) : (
            rows.map(([label, row], index) => (
              <tr key={label} className="border-t border-white/15">
                <td className="max-w-[11rem] py-2 pr-3 text-white">
                  <span className="mr-2 font-mono text-[10px] text-white/50">{index + 1}</span>
                  {label}
                </td>
                <td className="py-2 text-right font-mono tabular-nums text-white">
                  {row.w}/{row.n}
                </td>
                <td className="py-2 text-right font-mono tabular-nums text-white">
                  {row.n ? pct((row.w / row.n) * 100, 0) : "—"}
                </td>
                <td className={`py-2 text-right font-mono tabular-nums ${row.pnl < 0 ? "text-down" : "text-up"}`}>
                  {money(row.pnl)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Analytics({
  trades,
  prime,
  events,
}: {
  trades: Trade[];
  prime: PrimeRow[];
  events: FillEvent[];
}) {
  const scored = trades.filter((t) => t.result !== "open" && !goldHaltFill(t));
  const byPattern = new Map<string, { w: number; n: number }>();
  for (const t of scored) {
    const row = byPattern.get(t.patternLabel || "Unlabeled") ?? { w: 0, n: 0 };
    row.n += 1;
    if (t.result === "win" || (t.result === "exited" && (t.profit ?? 0) >= 0)) row.w += 1;
    byPattern.set(t.patternLabel || "Unlabeled", row);
  }
  const rows = [...byPattern.entries()].sort((a, b) => b[1].n - a[1].n);
  const closed = prime.filter((row) => row.result === "closed" && row.profit != null);
  const open = prime.length - closed.length;
  let wins = 0;
  let pnl = 0;
  const ranked = new Map<string, { w: number; n: number; pnl: number }>();
  for (const row of closed) {
    const profit = row.profit ?? 0;
    pnl += profit;
    if (profit > 0) wins += 1;
    const bucket = ranked.get(row.pattern) ?? { w: 0, n: 0, pnl: 0 };
    bucket.n += 1;
    bucket.pnl += profit;
    if (profit > 0) bucket.w += 1;
    ranked.set(row.pattern, bucket);
  }
  const rankedRows = [...ranked.entries()];
  const [rankBy, setRankBy] = useState<"hit" | "dollars">("hit");
  const best = orderRows(rankedRows.filter(([, row]) => row.pnl >= 0), rankBy, false);
  const worst = orderRows(rankedRows.filter(([, row]) => row.pnl < 0), rankBy, true);

  const all = new Map<string, { w: number; n: number; pnl: number }>();
  const seen = new Set<string>();
  let allPnl = 0;
  let allWins = 0;
  let allN = 0;
  for (const event of events) {
    if (event.kind !== "banked" || event.profit == null || seen.has(event.tradeId)) continue;
    seen.add(event.tradeId);
    const profit = event.profit;
    allPnl += profit;
    allN += 1;
    if (profit > 0) allWins += 1;
    const label = event.pattern || "Unlabeled";
    const bucket = all.get(label) ?? { w: 0, n: 0, pnl: 0 };
    bucket.n += 1;
    bucket.pnl += profit;
    if (profit > 0) bucket.w += 1;
    all.set(label, bucket);
  }
  const allRows = [...all.entries()];
  const allBest = orderRows(allRows.filter(([, row]) => row.pnl >= 0), rankBy, false);
  const allWorst = orderRows(allRows.filter(([, row]) => row.pnl < 0), rankBy, true);

  return (
    <div className="flex flex-col gap-4 pb-16">
      <section className="rounded-xl bg-surface p-4 hairline">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-[0.22em] text-muted">PRIME BOOK</p>
            <p className={`mt-1 font-mono text-3xl tabular-nums leading-none ${pnl >= 0 ? "text-up" : "text-down"}`}>
              {money(pnl)}
            </p>
          </div>
          <p className="text-right font-mono text-xs tabular-nums text-white">
            {wins}W / {closed.length - wins}L
            {open ? <span className="mt-1 block text-[10px] text-subtle">{open} open</span> : null}
          </p>
        </div>
        <p className="mt-2 text-xs text-subtle">Since the losing setups were cut. 6:46 PM.</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRankBy("hit")}
            className={`rounded-md border px-3 py-1 text-[10px] tracking-[0.16em] ${rankBy === "hit" ? "border-white text-white" : "border-white/25 text-white/45"}`}
          >
            HIT RATE
          </button>
          <button
            type="button"
            onClick={() => setRankBy("dollars")}
            className={`rounded-md border px-3 py-1 text-[10px] tracking-[0.16em] ${rankBy === "dollars" ? "border-white text-white" : "border-white/25 text-white/45"}`}
          >
            DOLLARS
          </button>
        </div>
        <RankTable title="BEST" rows={best} />
        <RankTable title="WORST" rows={worst} />
      </section>
      <section className="rounded-xl bg-surface p-4 hairline">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-[0.22em] text-muted">ALL TIME</p>
            <p className={`mt-1 font-mono text-3xl tabular-nums leading-none ${allPnl >= 0 ? "text-up" : "text-down"}`}>
              {money(allPnl)}
            </p>
          </div>
          <p className="text-right font-mono text-xs tabular-nums text-white">
            {allWins}W / {allN - allWins}L
            <span className="mt-1 block text-[10px] text-subtle">
              {allN ? pct((allWins / allN) * 100, 0) : "—"} hit
            </span>
          </p>
        </div>
        <p className="mt-2 text-xs text-subtle">Split by result. Each list runs from the highest hit rate down.</p>
        <RankTable title="BEST" rows={allBest} />
        <RankTable title="WORST" rows={allWorst} />
      </section>
      <section className="rounded-xl bg-black p-4">
        <p className="text-[10px] font-medium tracking-[0.22em] text-white/60">RETESTS</p>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">No closed retests yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {rows.map(([label, row]) => (
              <li
                key={label}
                className="flex items-center justify-between gap-3 rounded-md border border-white/40 bg-black px-3 py-2 text-white shadow-[0_0_10px_rgba(255,255,255,0.14)]"
              >
                <span className="min-w-0 truncate text-sm">{label}</span>
                <span className="shrink-0 font-mono text-sm tabular-nums">
                  {row.w}/{row.n}
                  <span className="ml-2 text-xs">{row.n ? pct((row.w / row.n) * 100, 0) : ""}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
