// fix672 RSI BOOKS (Love Nov 4 2026 9:56 PM PT: "we can make a new subsection here for the RSI books"): paper only - every cell asset x market x RSI timeframe x level, read from the server summary (light: no raw rows).
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRsiBooks672 } from "@/lib/desk/fns";

type Cell = { asset: string; market: string; tf: number; level: number; side: string; n: number; open: number; w: number; l: number; hold: number; tp: number; medHrs: number | null };
const tfName = (t: number) => (t >= 60 ? `${t / 60}H` : `${t}M`);
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
function Chips<T extends string | number>({ v, set, opts, label }: { v: T | "all"; set: (x: T | "all") => void; opts: T[]; label: (x: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(["all", ...opts] as (T | "all")[]).map((o) => (
        <button key={String(o)} onClick={() => set(o)} className="rounded-md px-2 py-0.5 font-mono text-[9px] tracking-[0.14em]" style={{ border: `1px solid ${v === o ? "#5dff9c" : "rgba(255,255,255,0.25)"}`, color: v === o ? "#5dff9c" : "rgba(255,255,255,0.75)" }}>
          {o === "all" ? "ALL" : label(o as T)}
        </button>
      ))}
    </div>
  );
}
export function RsiBooks672() {
  const q = useQuery({ queryKey: ["rsi-books-672"], queryFn: () => getRsiBooks672(), refetchInterval: 30000, staleTime: 20000 });
  const [asset, setAsset] = useState<string | "all">("all");
  const [market, setMarket] = useState<string | "all">("all");
  const [tf, setTf] = useState<number | "all">("all");
  const [lv, setLv] = useState<number | "all">("all");
  const cells = useMemo(() => ((q.data?.cells ?? []) as Cell[])
    .filter((c) => (asset === "all" || c.asset === asset) && (market === "all" || c.market === market) && (tf === "all" || c.tf === tf) && (lv === "all" || c.level === lv || c.level === 100 - (lv as number)))
    .sort((a, b) => a.asset.localeCompare(b.asset) || a.market.localeCompare(b.market) || a.tf - b.tf || b.level - a.level), [q.data, asset, market, tf, lv]);
  const tot = cells.reduce((s, c) => ({ w: s.w + c.w, l: s.l + c.l, hold: s.hold + c.hold, tp: s.tp + c.tp, n: s.n + c.n }), { w: 0, l: 0, hold: 0, tp: 0, n: 0 });
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(186,104,255,0.55)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">RSI BOOKS · PAPER ONLY 📈</p>
      <p className="mb-2 font-mono text-[9px] text-white/60">RSI(14) 5M/15M/30M/1H/4H · short at 70/80/85/90, long at 30/20/15/10 · each signal on the 15M window + the 1H market · $20 paper</p>
      <div className="mb-2 flex flex-col gap-1">
        <Chips v={asset} set={setAsset} opts={["btc", "gold"]} label={(x) => x.toUpperCase()} />
        <Chips v={market} set={setMarket} opts={["15M", "1H"]} label={(x) => x} />
        <Chips v={tf} set={setTf} opts={[5, 15, 30, 60, 240]} label={(x) => `RSI ${tfName(x)}`} />
        <Chips v={lv} set={setLv} opts={[70, 80, 85, 90]} label={(x) => `${x} / ${100 - x}`} />
      </div>
      <p className="mb-1 font-mono text-[10px] text-white/80">{tot.n} trades · {tot.w}W {tot.l}L{tot.w + tot.l ? ` · ${Math.round((100 * tot.w) / (tot.w + tot.l))}%` : ""} · held {money(tot.hold)} · her TP {money(tot.tp)}</p>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full font-mono text-[9px] text-white/85">
          <thead><tr className="text-white/50"><th className="text-left">BOOK</th><th>N</th><th>W/L</th><th>WIN</th><th>HELD</th><th>HER TP</th><th>HRS TO +0.25%</th></tr></thead>
          <tbody>
            {cells.map((c) => (
              <tr key={`${c.asset}${c.market}${c.tf}${c.level}${c.side}`} className="border-t border-white/10">
                <td className="py-0.5 text-left">{c.asset.toUpperCase()} · {c.market} · RSI {tfName(c.tf)} {c.level} {c.side === "down" ? "SHORT" : "LONG"}</td>
                <td className="text-center">{c.n}{c.open ? ` (${c.open} open)` : ""}</td>
                <td className="text-center">{c.w}/{c.l}</td>
                <td className="text-center">{c.w + c.l ? `${Math.round((100 * c.w) / (c.w + c.l))}%` : "–"}</td>
                <td className="text-center" style={{ color: c.hold >= 0 ? "#3ddc84" : "#ff6b6b" }}>{money(c.hold)}</td>
                <td className="text-center" style={{ color: c.tp >= 0 ? "#3ddc84" : "#ff6b6b" }}>{money(c.tp)}</td>
                <td className="text-center">{c.medHrs == null ? "–" : c.medHrs.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!cells.length ? <p className="font-mono text-[10px] text-white/50">{q.isLoading ? "loading…" : "no RSI signals yet - they appear the first time a level is hit"}</p> : null}
      </div>
    </div>
  );
}
