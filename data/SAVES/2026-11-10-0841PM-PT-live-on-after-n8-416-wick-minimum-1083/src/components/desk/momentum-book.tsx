// fix704 MOMENTUM BOOK - PAPER (Love Nov 5 2026 3:31 AM PT: "all of em bb !!"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getMomentum704 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function Momentum704() {
  const q = useQuery({ queryKey: ["momentum-704"], queryFn: () => getMomentum704(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(200,160,255,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">MOMENTUM BOOK · GO WITH IT · PAPER 🏃‍♀️</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">gold with the first 2 min · BTC with a fresh pink break up · BTC short under -2σ falling · gold 1σ chase (thin) · $20 paper at the real ask, once per setup per window</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no trades yet"}</p>
      {(d?.by ?? []).map((b: any, i: number) => <p key={"b" + i} className="font-mono text-[9px] text-white/70">{b.setup}: {b.w}W {b.l}L · held {money(b.hold)} · TP {money(b.tp)} · at 1.5x+ {b.floorN} ({money(b.floorHold)})</p>)}
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.setup} · {Math.round(r.ask * 100)}c · {String(r.result).toUpperCase()}{r.pnlHold != null ? ` ${money(r.pnlHold)}` : ""}</p>)}
    </div>
  );
}
