// fix707 HIGH MULTIPLE BOOK + TRACKER - PAPER (Love Nov 5 2026 ~4:10 AM PT: "let's create a high multiple book too pls. only takes 2.8x +"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getHighMult707 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function HighMult707() {
  const q = useQuery({ queryKey: ["highmult-707"], queryFn: () => getHighMult707(), refetchInterval: 60000, staleTime: 50000 });
  const d: any = q.data, tr: any = d?.tracker;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(255,200,120,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">HIGH MULTIPLE BOOK · 2.8x+ ONLY · PAPER 24/7 🎯</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">after a rip through 1+ bands: the reversal at the farthest band, and a with-the-rip twin · ask 35.7c or less · $20 paper · every trade logs hour, σ, bands crossed, 15m range</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no trades yet"}</p>
      {(d?.by ?? []).map((b: any, i: number) => <p key={"b" + i} className="font-mono text-[9px] text-white/70">{b.setup}: {b.w}W {b.l}L · held {money(b.hold)} · TP {money(b.tp)}</p>)}
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.way} · {Math.round(r.ask * 100)}c ({(1 / r.ask).toFixed(1)}x) · {r.hourPT}:00 PT · σ {r.sdBps}bp · {r.crossed} band(s) · 15m {r.range15}σ · {String(r.result).toUpperCase()}{r.pnlHold != null ? ` ${money(r.pnlHold)}` : ""}</p>)}
      <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.15em] text-white">HIGH-MULTIPLE TRACKER · EVERY BOOK · LAST 7 DAYS</p>
      <p className="mb-1 font-mono text-[9px] text-white/70">{tr ? `${tr.wins} wins of ${tr.n} trades at 2.8x+` : "…"}</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">{(tr?.byHour ?? []).map((h: any) => `${h.hour}:00 ${h.w}/${h.n} ${h.pnl >= 0 ? "+" : ""}${h.pnl}`).join(" · ")}</p>
      {(tr?.recent ?? []).map((r: any, i: number) => <p key={"t" + i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleString()} · {r.lane} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.label} · {Math.round(r.ask * 100)}c ({r.mult}x) · {r.hourPT}:00 PT{r.sdBps != null ? ` · σ ${r.sdBps}bp` : ""} · {r.exit} · {money(r.pnl)}</p>)}
    </div>
  );
}
