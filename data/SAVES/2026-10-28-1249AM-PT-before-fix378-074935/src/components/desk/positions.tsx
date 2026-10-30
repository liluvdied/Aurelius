import { useEffect, useState } from "react";
import { useLiveCountdown, useRollingNumber } from "@/components/desk/rolling-price";
import { countdown, money, multiple, pct, usd } from "@/lib/desk/format";
import { exitTargetPct, markTrade, sized } from "@/lib/desk/paper";
import type { AssetSnapshot, Trade } from "@/lib/desk/types";
import { ASSET_META } from "@/lib/desk/types";

function RollingProfit({ value, className }: { value: number; className: string }) {
  const shown = useRollingNumber(value);
  return <p className={className}>{money(shown)}</p>;
}

function PositionControls({
  trade,
  suggested,
  sizeValue,
  pinnedCash,
  maxPayout,
  now,
  onSellAt,
}: {
  trade: Trade;
  suggested: number;
  sizeValue: number;
  pinnedCash: number | null;
  maxPayout: number;
  now: number;
  onSellAt: (id: string, cash: number | null) => void;
}) {
  const ceiling = Math.max(maxPayout, suggested, sizeValue);
  const floor = Math.min(sizeValue, now);
  const start = pinnedCash != null ? pinnedCash : suggested;
  const [sell, setSell] = useState(start);

  useEffect(() => {
    setSell(pinnedCash != null ? pinnedCash : suggested);
  }, [pinnedCash, suggested, trade.id]);

  const shown = Math.min(ceiling, Math.max(floor, sell));
  const profitPct = sizeValue > 0 ? ((shown - sizeValue) / sizeValue) * 100 : 0;
  const profitLabel = `${profitPct >= 0 ? "+" : ""}${Math.round(profitPct)}%`;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] tabular-nums text-muted">MAX ${usd(ceiling, 0)}</p>
        <span className="font-mono text-[10px] tabular-nums text-subtle">now ${usd(now, 2)}</span>
      </div>
      <label className="mt-2 block">
        <p className="mb-2 text-center text-[22px] leading-none text-fg">{profitLabel}</p>
        <input
          type="range"
          min={floor}
          max={ceiling}
          step={0.25}
          value={shown}
          onChange={(e) => setSell(Number(e.target.value))}
          onPointerUp={(e) => onSellAt(trade.id, Math.round(Number(e.currentTarget.value) * 100) / 100)}
          onKeyUp={(e) => onSellAt(trade.id, Math.round(Number(e.currentTarget.value) * 100) / 100)}
          className="glass-range w-full cursor-pointer"
          aria-label="Cash out"
        />
        <span className="mt-2 flex items-end justify-between gap-3">
          <span className="font-mono text-[10px] tabular-nums text-subtle">now ${usd(now, 2)}</span>
          <span className="font-mono text-xl font-medium tabular-nums leading-none text-fg">${usd(sell, 2)}</span>
        </span>
      </label>
    </div>
  );
}

function OpenClock({
  closeTime,
  fallback,
}: {
  closeTime?: string;
  fallback: number;
}) {
  const left = useLiveCountdown(closeTime, fallback);
  return (
    <span className="text-sm tabular-nums text-fg">{countdown(left)}</span>
  );
}

export function Positions({
  trades,
  assets,
  stake,
  onExit,
  onSellAt,
  onSize,
  onHalf,
  asLive = false,
}: {
  trades: Trade[];
  assets: Partial<Record<"btc" | "gold" | "silver", AssetSnapshot>>;
  stake: number;
  onExit: (id: string) => void;
  onSellAt: (id: string, cash: number | null) => void;
  onSize: (id: string, dollars: number) => void;
  onHalf?: (id: string) => void;
  asLive?: boolean;
}) {
  const open: Trade[] = [];
  const seen = new Set<string>();
  for (const t of trades
    .filter((t) => t.result === "open")
    .sort((a, b) => (a.openedAt ?? "").localeCompare(b.openedAt ?? ""))) {
    if (t.venue === "polymarket") {
      const match = t.ticker.match(/(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})z$/);
      const end = match ? Date.parse(`${match[1]}T${match[2]}:${match[3]}:00Z`) + 15 * 60 * 1000 : NaN;
      if (Number.isFinite(end) && Date.now() >= end) continue;
      open.push(t);
      continue;
    }
    if (t.source === "live") {
      const current = assets[t.asset]?.market?.ticker;
      if (current && t.ticker !== current) continue;
      const key = `${t.ticker}:${t.side}`;
      if (seen.has(key)) continue;
      seen.add(key);
      open.push(t);
      continue;
    }
    const key = `${t.ticker}:${t.side}`;
    if (seen.has(key)) continue;
    seen.add(key);
    open.push(t);
  }
  open.sort((a, b) => (b.openedAt ?? "").localeCompare(a.openedAt ?? ""));

  return (
    <section className="rounded-md bg-surface px-3 py-2 hairline">
      <p className="text-[10px] font-medium tracking-[0.22em] text-muted">OPEN</p>
      <ul className="mt-1.5 space-y-2">
        {open.length ? null : <li className="text-sm text-subtle">Nothing open.</li>}
        {open.map((t) => {
          const snap = assets[t.asset];
          const mtm = markTrade(t, snap);
          const sellAt = exitTargetPct(t, snap, 45);
          const shownStake = stake > 0 ? stake : t.stake;
          const scale = t.stake > 0 ? shownStake / t.stake : 1;
          const autoCash = Math.round(t.stake * (1 + (sellAt ?? 45) / 100) * scale * 100) / 100;
          const shownCash = t.exitCash != null && t.exitCash > 0 ? t.exitCash * scale : autoCash;
          const suggested = Math.round(shownCash * 100) / 100;
          const profit = sized(mtm.profit, t.stake, shownStake);
          const rawMax = t.contracts > 0 ? t.contracts : t.ask > 0 ? t.stake / t.ask : shownStake;
          const maxPayout = Math.round(rawMax * scale * 100) / 100;
          const now = Math.round(Math.max(0, shownStake + profit) * 100) / 100;
          const tone = profit >= 0 ? "text-up" : "text-down";
          const strike = t.target != null && t.target > 0 ? t.target : (snap?.target ?? null);
          return (
            <li key={t.id} className="border-b border-line pb-2 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm leading-tight text-fg">
                    {ASSET_META[t.asset]?.label ?? t.asset} •{" "}
                    <OpenClock closeTime={snap?.market?.closeTime} fallback={snap?.secondsLeft ?? 0} />
                    <span className="ml-2 text-[10px] text-muted">
                      {(t.side ?? "").toUpperCase()} · {t.venue === "polymarket" ? "POLY" : asLive || t.source === "live" ? "LIVE" : "PAPER"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm tabular-nums leading-none text-fg">
                    {strike != null && strike > 0 ? `$${usd(strike, ASSET_META[t.asset]?.decimals ?? 2)}` : ""}
                  </p>
                  <p className="mt-1 font-mono text-sm tabular-nums text-fg">{multiple(t.multiple)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <RollingProfit value={profit} className={`font-mono text-sm tabular-nums leading-none ${tone}`} />
                  <p className="font-mono text-[10px] tabular-nums text-muted">{pct(mtm.pct * 100, 0)}</p>
                </div>
              </div>
              {t.venue === "polymarket" ? null : (
                <div className="mt-2 flex items-center gap-1.5">
                  {asLive || t.source === "live" ? (
                    <button type="button" className="desk-pill" onClick={() => onHalf?.(t.id)}>
                      HALF
                    </button>
                  ) : (
                    <span className="desk-pill opacity-40">HALF</span>
                  )}
                  <button type="button" className="desk-pill" onClick={() => onExit(t.id)}>
                    CLOSE
                  </button>
                  <label className="desk-pill">
                    SIZE
                    <input
                      inputMode="decimal"
                      defaultValue={String(Math.max(1, Math.round(shownStake)))}
                      onBlur={(e) => {
                        const n = Math.max(1, Math.min(100, Math.round(Number(e.target.value) || shownStake)));
                        e.target.value = String(n);
                        if (Math.abs(n - shownStake) >= 1) onSize(t.id, n);
                      }}
                      className="w-8 bg-transparent text-center font-mono text-[10px] text-white outline-none"
                    />
                  </label>
                </div>
              )}
              {t.venue === "polymarket" ? null : (
                <PositionControls
                  trade={t}
                  suggested={suggested}
                  sizeValue={stake > 0 ? stake : t.stake}
                  pinnedCash={t.exitCash != null && t.exitCash > 0 ? Math.round(t.exitCash * scale * 100) / 100 : null}
                  maxPayout={maxPayout}
                  now={now}
                  onSellAt={(id, cash) =>
                    onSellAt(id, cash == null || !(scale > 0) ? cash : Math.round((cash / scale) * 100) / 100)
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}