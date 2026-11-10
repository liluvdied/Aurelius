// fix713 CUP BOOK - PAPER (Love Nov 5 2026 ~5:38 AM PT: "is there a way we can have her gauge candle formations?"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getCups713 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function Cups713() {
  const q = useQuery({ queryKey: ["cups-713"], queryFn: () => getCups713(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(200,160,255,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">CUP BOOK · 😊 ☹️ CUPS, HANDLES, DOUBLE BOTTOMS / TOPS · PAPER</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">her shapes on 1m (15 / 20 candles) and 2m (15) - traded at the rim / neckline break, $20 paper at the real ask, once per shape per window</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no trades yet"}</p>
      {(d?.by ?? []).map((b: any, i: number) => <p key={"b" + i} className="font-mono text-[9px] text-white/70">{b.setup}: {b.w}W {b.l}L · held {money(b.hold)} · TP {money(b.tp)} · at 1.5x+ {b.floorN} ({money(b.floorHold)})</p>)}
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.setup} · {Math.round(r.ask * 100)}c · {String(r.result).toUpperCase()}{r.pnlHold != null ? ` ${money(r.pnlHold)}` : ""}</p>)}
    </div>
  );
}
