// fix983 PUSH SHADOW TEST card (Love Nov 7 2026 6:29 PM PT: "can you test all of these numbers over night (scaled for the weekends) and the first day or two of the week? we should know rather quickly which one is the YEUP"). Display only.
// Per asset: every candidate push (+ a WICK section: her wick rejection sizes, flat pull-back from the wick extreme, colour-exempt) (her live rule, the sliding scale, % of W, the fixed-$ ladder) - trades, win %, avg multiple, $ per $1, fake blips; ALL / WEEKDAY / WEEKEND. Paper, real Kalshi asks.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPushShadow983 } from "@/lib/desk/fns";
const NAME: Record<string, string> = { btc: "BTC", gold: "GOLD", eth: "ETH", bnb: "BNB", xrp: "XRP", sol: "SOL" };
const VN: Record<string, string> = { now: "LIVE NOW", slide: "SLIDING", pct: "% OF W", fx1: "FIXED 1", fx2: "FIXED 2", fx3: "FIXED 3" };
export function PushShadow983() {
  const q = useQuery({ queryKey: ["push-shadow-983"], queryFn: () => getPushShadow983(), refetchInterval: 60000, staleTime: 50000 });
  const d: any = q.data;
  const [span, setSpan] = useState<"all" | "weekday" | "weekend">("all");
  const block = (rows: any[], wick: boolean) => [...new Set(rows.map((r) => r.asset))].map((a) => {
        const rs = rows.filter((r) => r.asset === a), best = Math.max(...rs.map((r) => (r[span]?.n >= 5 ? Number(r[span].perTrade) : -9)));
        return (
          <div key={(wick ? "w" : "") + a} className="mt-3 max-w-full overflow-x-auto">
            <p className="font-mono text-[10px] font-bold text-white">{NAME[a] ?? a.toUpperCase()}{wick ? " · WICK" : ""}</p>
            <table className="w-full border-collapse font-mono text-[10px] text-white">
              <thead><tr className="text-[9px] tracking-[0.12em] text-white/60"><th className="px-2 py-1 text-left">PUSH</th><th className="px-2 py-1 text-left">TRADES</th><th className="px-2 py-1 text-left">WIN %</th><th className="px-2 py-1 text-left">MULT</th><th className="px-2 py-1 text-left">$ / $1</th><th className="px-2 py-1 text-left">FAKE</th></tr></thead>
              <tbody>
                {rs.map((r) => { const c = r[span] || {}; const top = c.n >= 5 && Number(c.perTrade) === best && best > -9;
                  return (
                    <tr key={r.variant} className="border-t border-white/15">
                      <td className="px-2 py-1 align-top"><div className="text-[9px] font-bold" style={{ color: top ? "#7CFFB2" : r.variant === "now" ? "#FFE08A" : "white" }}>{VN[r.variant] ?? String(r.variant).replace(/^wick/, "WICK ")}{top ? " 🎯" : ""}</div><div className="max-w-[16rem] text-[8px] text-white/50">{r.words}</div></td>
                      <td className="px-2 py-1 tabular-nums">{c.n ? `${c.w}/${c.n}` : "·"}{r.open ? <span className="ml-1 text-white/40">+{r.open} open</span> : null}</td>
                      <td className="px-2 py-1 tabular-nums">{c.winPct ?? "·"}</td>
                      <td className="px-2 py-1 tabular-nums">{c.avgMult != null ? `${c.avgMult}x` : "·"}</td>
                      <td className="px-2 py-1 tabular-nums" style={{ color: c.perTrade == null ? undefined : c.perTrade >= 0 ? "#7CFFB2" : "#FF8A8A" }}>{c.perTrade != null ? `${c.perTrade >= 0 ? "+" : ""}${c.perTrade}` : "·"}</td>
                      <td className="px-2 py-1 tabular-nums">{c.fakePct != null ? `${c.fakePct}%` : "·"}</td>
                    </tr>
                  ); })}
              </tbody>
            </table>
          </div>
        );
  });
  return (
    <section className="mt-3 rounded-xl bg-black p-4">
      <p className="text-[10px] font-medium tracking-[0.22em] text-white/60">PUSH SHADOW TEST · WHICH PUSH IS THE YEUP · PAPER</p>
      <p className="mt-1 font-mono text-[9px] text-white/50">{d ? `${d.turns} turns · ${d.tickets} tickets · ${d.resolved} settled${d.since ? ` · since ${new Date(d.since).toLocaleString()}` : ""}` : q.isLoading ? "loading…" : "no data yet"}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(["all", "weekday", "weekend"] as const).map((x) => <button key={x} onClick={() => setSpan(x)} className={`rounded-md border px-2 py-0.5 font-mono text-[9px] ${x === span ? "border-white text-white" : "border-white/30 text-white/60"}`}>{x.toUpperCase()}</button>)}
      </div>
      {block((d?.rows ?? []) as any[], false)}
      {(d?.wick ?? []).length ? <p className="mt-4 text-[10px] font-medium tracking-[0.22em] text-white/60">WICK REJECTION SIZES · PULL-BACK FROM THE WICK AT A LINE · NO COLOUR NEEDED</p> : null}
      {block((d?.wick ?? []) as any[], true)}
    </section>
  );
}
