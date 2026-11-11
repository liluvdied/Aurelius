// fix688 INVERSE BOOK - PAPER (Love Nov 5 2026 ~1:05 AM PT: "can you create the inverse set ups book i asked you about earlier too?"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getInverse688 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function Inverse688() {
  const q = useQuery({ queryKey: ["inverse-688"], queryFn: () => getInverse688(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(200,160,255,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">INVERSE BOOK · HER LOSING SET UPS, FLIPPED · PAPER 🤍</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">the other side of main / rejection when a listed set up appears · $20 paper at the other side's real ask · list: data/inverse-setups.json</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no trades yet"}</p>
      {(d?.by ?? []).map((b: any, i: number) => <p key={"b" + i} className="font-mono text-[9px] text-white/70">{b.setup}: {b.w}W {b.l}L · held {money(b.hold)} · TP {money(b.tp)} · at 1.38x+ {b.floorN} ({money(b.floorHold)})</p>)}
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.setup} · her {Math.round(r.herAsk * 100)}c / ours {Math.round(r.ask * 100)}c · {String(r.result).toUpperCase()}{r.pnlHold != null ? ` ${money(r.pnlHold)}` : ""}</p>)}
    </div>
  );
}
