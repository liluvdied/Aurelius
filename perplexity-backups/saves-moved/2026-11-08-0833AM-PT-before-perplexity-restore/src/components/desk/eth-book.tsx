// fix682 ETH · REJECTIONS ONLY · NO PINK - PAPER (Love Nov 4 2026 11:38 PM PT: "yess, let us do so please ❤️‍🔥 (eth book)"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getEthBook682 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function EthBook682() {
  const q = useQuery({ queryKey: ["eth-book-682"], queryFn: () => getEthBook682(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(98,126,234,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">ETH · REJECTIONS ONLY · NO PINK · PAPER 🤍</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">Kalshi ETH 15M · $20 paper at the live ask · her rejections-only rules + walls (thirds, 45%, past red/green, pink cushion, 1.5x)</p>
      <p className="mb-1 font-mono text-[10px] text-white/85">{d ? `${d.n} trades (${d.open} open) · ${d.w}W ${d.l}L${d.w + d.l ? ` · ${Math.round((100 * d.w) / (d.w + d.l))}%` : ""} · held ${money(d.hold)} · her TP ${money(d.tp)}` : q.isLoading ? "loading…" : "no ETH trades yet"}</p>
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {r.side === "up" ? "LONG" : "SHORT"} · {r.label} · {Math.round(r.ask * 100)}c · {String(r.result).toUpperCase()}{r.pnlTp != null ? ` ${money(r.pnlTp)}` : ""}</p>)}
    </div>
  );
}
