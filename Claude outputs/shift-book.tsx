import { useMemo, useState } from "react";
import type { FillEvent } from "@/lib/desk/fill-log";
import type { HeldOrder } from "@/lib/desk/fns";

// SHIFT — the book that starts when Claude took over the desk.
// Kalshi live only. One row per 15-minute window. Pure black; light comes only from lines and numbers.

const UP = "#3ddc84";
const DOWN = "#ff5c5c";

type Row = { ticker: string; at: string; asset: string; side: string; setup: string; stake: number; multiple: number; pnl: number };

function clock(at: string) {
  return new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function day(at: string) {
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}
function money(n: number) {
  const s = `$${Math.abs(n).toFixed(2)}`;
  return n > 0.004 ? `+${s}` : n < -0.004 ? `−${s}` : s;
}
const glow = (color: string, px = 10) => ({ textShadow: `0 0 ${px}px ${color}` });

function Chip({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  const color = tone === "up" ? UP : tone === "down" ? DOWN : "#ffffff";
  return (
    <div className="flex min-w-[96px] flex-1 flex-col items-center gap-1 rounded-full border border-white/25 px-4 py-2 shadow-[0_0_14px_rgba(255,255,255,0.08)]">
      <span className="text-[9px] tracking-[0.24em] text-white/70">{label}</span>
      <span className="font-mono text-sm tabular-nums" style={{ color, ...glow(color, 8) }}>
        {value}
      </span>
    </div>
  );
}

function Curve({ rows }: { rows: Row[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 200;
  const P = 18;
  const pts = useMemo(() => {
    let run = 0;
    const out: { x: number; y: number; row: Row | null }[] = [{ x: 0, y: 0, row: null }];
    rows.forEach((row, i) => {
      run += row.pnl;
      out.push({ x: i + 1, y: Math.round(run * 100) / 100, row });
    });
    return out;
  }, [rows]);
  const ys = pts.map((p) => p.y);
  const lo = Math.min(0, ...ys);
  const hi = Math.max(0, ...ys);
  const span = hi - lo || 1;
  const sx = (x: number) => P + (x / Math.max(1, pts.length - 1)) * (W - 2 * P);
  const sy = (y: number) => H - P - ((y - lo) / span) * (H - 2 * P);
  const last = pts[pts.length - 1].y;
  const color = last >= 0 ? UP : DOWN;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const h = hover != null ? pts[hover] : null;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <defs>
          <filter id="shift-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1={P} x2={W - P} y1={sy(0)} y2={sy(0)} stroke="rgba(255,255,255,0.28)" strokeDasharray="3 6" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" filter="url(#shift-glow)" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {pts.map((p, i) =>
          i === 0 ? null : (
            <g key={i} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <rect x={sx(p.x) - 14} y={0} width={28} height={H} fill="transparent" />
              <circle
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={hover === i ? 5 : 3.2}
                fill="#000"
                stroke={(p.row?.pnl ?? 0) >= 0 ? UP : DOWN}
                strokeWidth="1.6"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ),
        )}
      </svg>
      {h?.row ? (
        <div className="pointer-events-none absolute right-2 top-2 rounded-xl border border-white/30 bg-black px-3 py-2 text-right shadow-[0_0_16px_rgba(255,255,255,0.12)]">
          <p className="text-[9px] tracking-[0.22em] text-white/70">
            {clock(h.row.at)} · {h.row.asset.toUpperCase()} {h.row.side === "up" ? "LONG" : "SHORT"}
          </p>
          <p className="font-mono text-sm tabular-nums" style={{ color: h.row.pnl >= 0 ? UP : DOWN }}>
            {money(h.row.pnl)}
          </p>
          <p className="font-mono text-[11px] tabular-nums text-white/80">RUN {money(h.y)}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ShiftBook({ fills, start, held }: { fills: FillEvent[]; start?: string | null; held: HeldOrder[] }) {
  const from = start || "2026-10-02T01:58:00.000Z";
  const rows = useMemo<Row[]>(() => {
    const byTicker = new Map<string, Row>();
    for (const e of fills) {
      if (e.venue !== "kalshi" || e.kind !== "banked" || e.profit == null || e.at < from) continue;
      const cur = byTicker.get(e.ticker);
      if (cur) {
        cur.pnl += e.profit;
        continue;
      }
      byTicker.set(e.ticker, {
        ticker: e.ticker,
        at: e.at,
        asset: String(e.asset),
        side: String(e.side),
        setup: e.pattern || "",
        stake: Number(e.stake) || 0,
        multiple: Number(e.multiple) || 0,
        pnl: e.profit,
      });
    }
    return [...byTicker.values()].sort((a, b) => a.at.localeCompare(b.at));
  }, [fills, from]);
  const s = useMemo(() => {
    const wins = rows.filter((r) => r.pnl > 0.05);
    const losses = rows.filter((r) => r.pnl < -0.05);
    const pnl = rows.reduce((t, r) => t + r.pnl, 0);
    const avg = (xs: Row[]) => (xs.length ? xs.reduce((t, r) => t + r.pnl, 0) / xs.length : 0);
    const best = rows.reduce((b, r) => (r.pnl > b ? r.pnl : b), 0);
    const decided = wins.length + losses.length;
    return { pnl, wins: wins.length, losses: losses.length, hit: decided ? (wins.length / decided) * 100 : 0, decided, avgWin: avg(wins), avgLoss: avg(losses), best };
  }, [rows]);
  const pnlColor = s.pnl >= 0 ? UP : DOWN;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-[22px] border border-white/30 px-5 pb-5 pt-4 shadow-[0_0_24px_rgba(255,255,255,0.07)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] tracking-[0.36em] text-white" style={glow("rgba(255,255,255,0.75)", 8)}>
              SHIFT
            </p>
            <p className="mt-1 text-[9px] tracking-[0.22em] text-white/60">
              SINCE {clock(from)} · {day(from)} · KALSHI LIVE
            </p>
          </div>
          <p className="font-mono text-[34px] leading-none tabular-nums" style={{ color: pnlColor, ...glow(pnlColor, 14) }}>
            {money(s.pnl)}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip label="WINS" value={String(s.wins)} tone="up" />
          <Chip label="LOSSES" value={String(s.losses)} tone="down" />
          <Chip label="HIT RATE" value={s.decided ? `${s.hit.toFixed(0)}%` : "—"} />
          <Chip label="AVG WIN" value={s.wins ? money(s.avgWin) : "—"} tone="up" />
          <Chip label="AVG LOSS" value={s.losses ? money(s.avgLoss) : "—"} tone="down" />
          <Chip label="BEST" value={s.best > 0 ? money(s.best) : "—"} tone="up" />
        </div>
        <div className="mt-4">
          {rows.length ? (
            <Curve rows={rows} />
          ) : (
            <p className="py-10 text-center text-[10px] tracking-[0.24em] text-white/60">THE FIRST CLOSE DRAWS THE LINE</p>
          )}
        </div>
      </section>

      {held.length ? (
        <section className="rounded-[22px] border border-[#6b1524] px-5 py-4 shadow-[0_0_20px_rgba(107,21,36,0.35)]">
          <p className="text-[10px] tracking-[0.28em] text-white/80">OPEN NOW</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {held.map((h) => {
              const c = h.profit >= 0 ? UP : DOWN;
              return (
                <div key={h.ticker} className="flex items-center gap-3 rounded-full border border-white/25 px-4 py-2">
                  <span className="text-[10px] tracking-[0.2em] text-white">
                    {h.name} {h.side === "up" ? "LONG" : "SHORT"}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-white/70">${h.cost.toFixed(2)}</span>
                  <span className="font-mono text-xs tabular-nums" style={{ color: c, ...glow(c, 6) }}>
                    {money(h.profit)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <p className="px-1 text-[10px] tracking-[0.28em] text-white/80">CLOSES · {rows.length}</p>
        {[...rows].reverse().map((r) => {
          const c = r.pnl >= 0 ? UP : DOWN;
          const sideColor = r.side === "up" ? UP : DOWN;
          return (
            <div
              key={r.ticker}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 px-4 py-3 transition-shadow hover:shadow-[0_0_16px_rgba(255,255,255,0.12)]"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border px-2 py-0.5 text-[9px] tracking-[0.2em]" style={{ borderColor: sideColor, color: sideColor }}>
                    {r.asset.toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"}
                  </span>
                  <span className="text-[10px] tracking-[0.16em] text-white/60">{clock(r.at)}</span>
                </div>
                <span className="truncate text-[11px] tracking-[0.08em] text-white/90">{r.setup.toUpperCase()}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="font-mono text-base tabular-nums" style={{ color: c, ...glow(c, 8) }}>
                  {money(r.pnl)}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-white/55">
                  {r.multiple ? `${r.multiple.toFixed(2)}x · ` : ""}${r.stake.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
