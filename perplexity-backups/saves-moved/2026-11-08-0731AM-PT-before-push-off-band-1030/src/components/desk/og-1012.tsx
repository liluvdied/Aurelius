// fix686 OG ORIGINAL · 10.12 - PAPER, sealed (Love Nov 5 2026 ~1:00 AM PT: "for 10.12 put her on her own paper card never to be touched pls"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getOg1012 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function Og1012Card() {
  const q = useQuery({ queryKey: ["og-1012"], queryFn: () => getOg1012(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(255,214,140,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">OG ORIGINAL · 10.12 🕯️ · PAPER · SEALED</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">Oct 12 OG + PIVOT 5M, byte for byte from branch 10.12 (27-2 that night) · $20 paper · her Oct 12 exits · never edited</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? (d.sealed ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · ${money(d.pnl)}` : `SEAL BROKEN - not trading: ${d.why}`) : q.isLoading ? "loading…" : "no trades yet"}</p>
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.label} · {Math.round(r.ask * 100)}c · {String(r.result).toUpperCase()}{r.pnl != null ? ` ${money(r.pnl)}` : ""}</p>)}
    </div>
  );
}
