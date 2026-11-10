// fix690 70% CLUB - PAPER (Love Nov 5 2026 ~1:28 AM PT: "only taking the set ups that won over 70%"). Display only.
import { useQuery } from "@tanstack/react-query";
import { getClub690 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function Club690() {
  const q = useQuery({ queryKey: ["club-690"], queryFn: () => getClub690(), refetchInterval: 30000, staleTime: 20000 });
  const d: any = q.data;
  const line = (n: string, c: any) => c ? <div className="mb-1"><p className="font-mono text-[10px] text-white/85">{n}: {c.n} trades ({c.open} open) · {c.w}W {c.l}L{c.w + c.l ? ` · ${Math.round((100 * c.w) / (c.w + c.l))}%` : ""} · held {money(c.hold)} · her TP {money(c.tp)}</p><p className="font-mono text-[9px] text-white/55">{c.setups.length ? c.setups.join(" | ") : "no set up qualifies yet"}</p></div> : null;
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(255,215,0,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">70% CLUB · HER BEST SET UPS ONLY · PAPER 🤍</p>
      <p className="mb-1 font-mono text-[9px] text-white/60">main + rejection calls whose set up won 70%+ (or 65%+ and made money) over the PAST 14 days, 15+ trades · list rebuilt nightly{d?.listAt ? ` (${new Date(d.listAt).toLocaleString()})` : ""} · never paid above its hit rate - 5c · $20 paper</p>
      {d ? <>{line("CLUB 70", d.club70)}{line("HER RULE 65%+ & green", d.herRule)}{line("HER LADDER 24h 50%+ / week 60%+", d.ladder)}</> : <p className="font-mono text-[10px] text-white/60">{q.isLoading ? "loading…" : "no trades yet"}</p>}
      {(d?.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.at).toLocaleTimeString()} · {r.list === "club70" ? "70" : r.list === "herRule" ? "65" : "LAD"} · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · {r.label} · {Math.round(r.ask * 100)}c (hit {Math.round(r.hit * 100)}%) · {String(r.result).toUpperCase()}{r.pnlTp != null ? ` ${money(r.pnlTp)}` : ""}</p>)}
    </div>
  );
}
