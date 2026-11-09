// fix687 OUTWARD BREAK · SESSION BANDS - PAPER (Love Nov 5 2026 ~1:00 AM PT: "a new one too if you have a different idea in mind for it"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getBrkOut687 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function BrkOut687() {
  const q = useQuery({ queryKey: ["brk-out-687"], queryFn: () => getBrkOut687(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(120,200,255,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">OUTWARD BREAK · SESSION BANDS · PAPER 🤍</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">1m close through a session band by her push ($6 BTC / 33c gold), away from the VWAP · $20 paper · 1.38x floor · BTC + gold</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no trades yet"}</p>
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.label} · {Math.round(r.ask * 100)}c · {String(r.result).toUpperCase()}{r.pnlTp != null ? ` ${money(r.pnlTp)}` : ""}</p>)}
    </div>
  );
}
