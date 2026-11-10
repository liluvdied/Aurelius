// fix709 HALF-BAND KEEP BOOK - PAPER (Love Nov 5 2026 ~4:20 AM PT: "the original model used half bands ... can we create another book that still uses those and then from there
// refine the set ups on THAT that worked best?"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getHalfBand709 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function HalfBand709() {
  const q = useQuery({ queryKey: ["halfband-709"], queryFn: () => getHalfBand709(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(140,220,255,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">HALF-BAND KEEP BOOK · THE ORIGINAL MODEL, BEST SET UPS · PAPER 24/7 🧱</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">PAPER 24/7's half-band calls (±0.5 / ±1.5 / ±2.5σ with the whole bands) - only the set ups her SET UP SCORES rate KEEP or LADDER right now · $20 paper at the real ask</p>
      {Object.entries(d?.levels ?? {}).map(([id, v]: [string, any]) => <p key={id} className="font-mono text-[9px] text-white/70">{id.toUpperCase()} half bands: {(v.half ?? []).map((h: any) => `${h.name} ${h.price}`).join(" · ")}</p>)}
      <p className="mb-1 mt-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no trades yet"}</p>
      <p className="font-mono text-[9px] text-white/60">following now: {(d?.following ?? []).map((f: any) => `${f.setup} (${f.badge})`).join(" · ") || "-"}</p>
      {(d?.by ?? []).map((b: any, i: number) => <p key={"b" + i} className="font-mono text-[9px] text-white/70">{b.setup}: {b.w}W {b.l}L · held {money(b.hold)} · TP {money(b.tp)}</p>)}
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {r.setup} ({r.badge}) · {Math.round(r.ask * 100)}c · {String(r.result).toUpperCase()}{r.pnlHold != null ? ` ${money(r.pnlHold)}` : ""}</p>)}
    </div>
  );
}
