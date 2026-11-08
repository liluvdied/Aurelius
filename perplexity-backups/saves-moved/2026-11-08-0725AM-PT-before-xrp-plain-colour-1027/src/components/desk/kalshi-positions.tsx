// (file: kalshi-positions.tsx; positions.tsx is the desk's original open-trade list) POSITIONS tab (Claude, Oct 9, Love: "let's make a POSITIONS tab where we can do everything there, not just for trading,
// for all positions held on kalshi"). Oct 10 (Love: "sorted by most recent... and by profit, a toggle would be sick...
// change the purple writing to green... you don't need to have the slide to set, we can tighten it up"): RECENT / PROFIT toggle, green
// instead of purple, and (her correction: "i meant just the words... i still want the slider") the slider stays, its
// status wording is gone. Every hand position is still protected by the trail (positions.ts) and SELL NOW stays.
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getPositions, sellPosition, setAutosell } from "@/lib/desk/fns";

const UP = "#3ddc84";
const DOWN = "#ff5c5c";
const usd = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)}`;
const when = (iso: string) => (iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "");

function Row({ p, onSet, onSell }: { p: any; onSet: (mode: "pct" | "price", v: number | null) => void; onSell: () => void }) {
  // SLIDER (Love, Oct 9: "make it a slider style... with the max payout and max percentage available... i'd just be
  // guessing here"). The slider is the sell price for her side, 1c to 99c; it shows what she'd get back and the gain.
  const lo = Math.max(1, Math.min(98, Math.round(Math.max(p.bid, p.entry) * 100) + 1));
  const start = p.rule ? (p.rule.mode === "price" ? Math.round(p.rule.value * 100) : Math.min(99, Math.round(p.entry * (1 + p.rule.value / 100) * 100))) : Math.min(99, Math.max(lo, Math.round(p.entry * 200)));
  const [c, setC] = useState<number>(Math.max(lo, start));
  const [confirm, setConfirm] = useState(false);
  // SLIDE = SAVE (Love, Oct 9 ~6:45 PM PT: "i just slid every one of them for the 3rd time and it keeps resetting them...
  // can you make it just the slide? no click to set afterwards"). Letting go of the slider saves the rule (and 1.2 s after
  // the last arrow-key nudge). The slider starts at the saved rule, so after any refresh it shows what the desk has.
  // It can't go at or below the bid right now (that would sell on the next check).
  const saved = p.rule && p.rule.mode === "price" ? Math.round(p.rule.value * 100) : null;
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commit = (v: number) => {
    if (timer.current) clearTimeout(timer.current);
    if (saved === v) return;
    setSaving(true);
    onSet("price", v);
  };
  useEffect(() => {
    if (saving && saved === c) setSaving(false);
  }, [saved, c, saving]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const back = p.qty * (c / 100);
  const gain = back - p.cost;
  const gainPct = p.cost > 0 ? Math.round((back / p.cost - 1) * 100) : 0;
  const maxBack = p.qty * 1;
  const maxPct = p.cost > 0 ? Math.round((maxBack / p.cost - 1) * 100) : 0;
  const col = p.pnl >= 0 ? UP : DOWN;
  return (
    <div className="rounded-[12px] border px-3 py-1.5" style={{ borderColor: p.rule ? "rgba(61,220,132,0.5)" : "rgba(255,255,255,0.15)" }}>
      <p className="font-mono text-[10px] leading-snug text-white/90">{p.title}</p>
      <p className="font-mono text-[9px] text-white/50">
        {p.side.toUpperCase()} · {p.qty} @ {Math.round(p.entry * 100)}c · cost ${p.cost.toFixed(2)} · bid now {Math.round(p.bid * 100)}c · closes {when(p.closes)}
        {p.updated || p.lastFill ? ` · last trade ${when(p.updated || p.lastFill)}` : ""}
      </p>
      <p className="mt-0.5 font-mono text-[13px] tabular-nums" style={{ color: col }}>
        ${p.value.toFixed(2)} <span className="text-[10px]">{usd(p.pnl)} ({p.pct >= 0 ? "+" : ""}{p.pct}%)</span>
        <span className="ml-2 text-[9px] text-white/45">MAX IF IT WINS ${maxBack.toFixed(2)} (+{maxPct}%)</span>
      </p>
      <div className="mt-1">
        <div className="flex items-baseline justify-between font-mono text-[10px]">
          <span className="text-[8px] tracking-[0.2em] text-white/50">AUTOSELL AT</span>
          <span style={{ color: UP }}>
            {c}c → ${back.toFixed(2)} back · {gain >= 0 ? "+" : "−"}${Math.abs(gain).toFixed(2)} ({gainPct >= 0 ? "+" : ""}{gainPct}%)
          </span>
        </div>
        <input
          type="range"
          min={lo}
          max={99}
          step={1}
          value={c}
          onChange={(e) => {
            const v = Number(e.target.value);
            setC(v);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => commit(v), 1200);
          }}
          onPointerUp={(e) => commit(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => commit(Number((e.target as HTMLInputElement).value))}
          onKeyUp={(e) => { const v = Number((e.target as HTMLInputElement).value); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => commit(v), 1200); }}
          className="glass-range mt-1 w-full cursor-pointer"
          style={{ touchAction: "none" }}
          aria-label="Autosell price"
        />
        <div className="flex justify-between font-mono text-[8px] text-white/35">
          <span>{lo}c (just over the bid)</span>
          <span>paid {Math.round(p.entry * 100)}c</span>
          <span>99c · ${(p.qty * 0.99).toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        {p.rule ? (
          <button type="button" onClick={() => { setSaving(false); onSet("price", null); }} className="rounded-full border px-2 py-0.5 font-mono text-[9px] text-white/60" style={{ borderColor: "rgba(255,255,255,0.3)" }}>
            CLEAR
          </button>
        ) : null}
        <span className="flex-1" />
        {confirm ? (
          <>
            <button type="button" onClick={() => { setConfirm(false); onSell(); }} className="rounded-full border px-2 py-0.5 font-mono text-[9px]" style={{ borderColor: DOWN, color: DOWN }}>
              {/^KXMVE/.test(p.ticker) ? "CONFIRM CASH OUT · best Kalshi quote" : `CONFIRM SELL · ~$${p.value.toFixed(2)}`}
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="font-mono text-[9px] text-white/50">cancel</button>
          </>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="rounded-full border px-2 py-0.5 font-mono text-[9px] text-white/80" style={{ borderColor: "rgba(255,255,255,0.4)" }}>
            SELL NOW
          </button>
        )}
      </div>
      {p.rule ? (
        <p className="mt-1 font-mono text-[9px]" style={{ color: UP }}>
          ● sells automatically when {p.rule.mode === "pct" ? `it's up ${p.rule.value}%` : `the bid reaches ${Math.round(p.rule.value * 100)}c (~$${(p.qty * p.rule.value).toFixed(2)} back)`}
        </p>
      ) : null}
    </div>
  );
}

export function PositionsTab() {
  const qc = useQueryClient();
  const [sortBy, setSortBy] = useState<"recent" | "profit">("recent");
  const q = useQuery({ queryKey: ["positions"], queryFn: () => getPositions(), refetchInterval: 15000 });
  const raw = q.data?.rows ?? [];
  const stamp = (p: any) => String(p.updated || p.lastFill || "");
  const rows = [...raw].sort((a: any, b: any) => (sortBy === "profit" ? b.pnl - a.pnl : stamp(a) === stamp(b) ? 0 : stamp(a) > stamp(b) ? -1 : 1));
  const total = raw.reduce((s: number, p: any) => s + p.value, 0);
  const cost = raw.reduce((s: number, p: any) => s + p.cost, 0);
  const refresh = (r: { rows: any[] }) => qc.setQueryData(["positions"], (old: any) => ({ ...(old || {}), rows: r.rows }));
  const pill = (k: "recent" | "profit", label: string) => (
    <button type="button" onClick={() => setSortBy(k)} className="rounded-full border px-2.5 py-0.5 font-mono text-[9px] tracking-[0.15em]" style={{ borderColor: sortBy === k ? UP : "rgba(255,255,255,0.3)", color: sortBy === k ? UP : "rgba(255,255,255,0.7)", boxShadow: sortBy === k ? "0 0 10px rgba(61,220,132,0.3)" : "none" }}>
      {label}
    </button>
  );
  return (
    <section className="mx-3 mt-3 rounded-[14px] px-3 py-3" style={{ border: "1px solid rgba(255,255,255,0.18)", background: "#000" }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] tracking-[0.28em] text-white/90">POSITIONS · EVERYTHING ON KALSHI</p>
        <p className="font-mono text-[10px]" style={{ color: total - cost >= 0 ? UP : DOWN }}>
          ${total.toFixed(2)} <span className="text-white/50">on ${cost.toFixed(2)}</span>
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        {pill("recent", "MOST RECENT")}
        {pill("profit", "MOST PROFIT")}
        <span className="ml-auto font-mono text-[8px] text-white/40">gate (not 15-min): arms at 40% of max, floor 33% → 70% of the best · trail from 90%</span>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {!q.data ? (
          <p className="font-mono text-[10px] text-white/50">loading your positions…</p>
        ) : rows.length ? (
          rows.map((p: any) => (
            <Row
              key={`${p.ticker}:${p.rule?.at ?? ""}`}
              p={p}
              onSet={(mode, v) => void setAutosell({ data: v == null ? { ticker: p.ticker, clear: true } : { ticker: p.ticker, mode, value: v } }).then(refresh)}
              onSell={() => void sellPosition({ data: { ticker: p.ticker } }).then(refresh)}
            />
          ))
        ) : (
          <p className="font-mono text-[10px] text-white/50">No open positions.</p>
        )}
      </div>
    </section>
  );
}
