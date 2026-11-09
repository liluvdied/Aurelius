// fix695 REJECTION · PARKED SIDE - PAPER (Love Nov 5 2026 ~2:00 AM PT: "yes to all of the paper books, a, b & c"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getRejParked695 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function RejParked695() {
  const q = useQuery({ queryKey: ["rejparked-695"], queryFn: () => getRejParked695(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(255,255,255,0.45)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">REJECTION · PARKED SIDE · PAPER 🤍</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">rejection's calls; when parked (the last hour of 5m closes all on one side of pink) only the parked side · $20 paper · her 1.5x floor</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no trades yet"}</p>
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.label} · {Math.round(r.ask * 100)}c · {r.why} · {String(r.result).toUpperCase()}{r.pnlTp != null ? ` ${money(r.pnlTp)}` : ""}</p>)}
    </div>
  );
}
