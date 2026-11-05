// fix680 STATS: setup x rung + band travel for her real books (Love Nov 4 2026 11:20 PM PT: "stats tables too bb sorry !!"). Display only - reads data/rung-stats.json (rebuilt every 2 h).
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRungStats680 } from "@/lib/desk/fns";

type Cell = { period: string; book: string; asset: string; n: number; w: number; pnl: number; setup?: string; rung?: string; bands?: string; how?: string };
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(0)}`;
function Chips({ v, set, opts }: { v: string; set: (x: string) => void; opts: string[] }) {
  return <div className="flex flex-wrap gap-1">{opts.map((o) => <button key={o} onClick={() => set(o)} className="rounded-md px-2 py-0.5 font-mono text-[9px] tracking-[0.12em]" style={{ border: `1px solid ${v === o ? "#5dff9c" : "rgba(255,255,255,0.25)"}`, color: v === o ? "#5dff9c" : "rgba(255,255,255,0.75)" }}>{o.toUpperCase()}</button>)}</div>;
}
function Table({ rows, cols }: { rows: Cell[]; cols: [string, (c: Cell) => string][] }) {
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full font-mono text-[9px] text-white/85">
        <thead><tr className="text-white/50">{cols.map(([h]) => <th key={h} className="text-left">{h}</th>)}<th>N</th><th>WON</th><th>P&L</th></tr></thead>
        <tbody>{rows.map((c, i) => <tr key={i} className="border-t border-white/10">{cols.map(([h, f]) => <td key={h} className="py-0.5">{f(c)}</td>)}<td className="text-center">{c.n}</td><td className="text-center">{Math.round((100 * c.w) / Math.max(1, c.n))}%</td><td className="text-center" style={{ color: c.pnl >= 0 ? "#3ddc84" : "#ff6b6b" }}>{money(c.pnl)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
export function RungStats680() {
  const q = useQuery({ queryKey: ["rung-stats-680"], queryFn: () => getRungStats680(), refetchInterval: 60000, staleTime: 50000 });
  const [period, setPeriod] = useState("7d"); const [book, setBook] = useState("all"); const [asset, setAsset] = useState("btc");
  const books = useMemo(() => ["all", ...new Set(((q.data?.setups ?? []) as Cell[]).map((c) => c.book).filter((b) => b !== "all"))], [q.data]);
  const pick = (xs: Cell[]) => xs.filter((c) => c.period === period && c.book === book && c.asset === asset);
  const setups = pick((q.data?.setups ?? []) as Cell[]).filter((c) => c.n >= 3).sort((a, b) => b.n - a.n);
  const travel = pick((q.data?.travel ?? []) as Cell[]).sort((a, b) => String(a.bands).localeCompare(String(b.bands)) || String(a.how).localeCompare(String(b.how)));
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(93,255,156,0.45)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">HER BOOKS · SETUP × RUNG + BAND TRAVEL</p>
      <p className="mb-2 font-mono text-[9px] text-white/55">{q.data?.at ? `${q.data.trades} trades · rebuilt ${new Date(q.data.at).toLocaleString()}` : "building… (rebuilt every 2 h)"} · $20 paper, her take-profit</p>
      <div className="mb-2 flex flex-col gap-1"><Chips v={period} set={setPeriod} opts={["today", "7d", "all"]} /><Chips v={asset} set={setAsset} opts={["btc", "gold"]} /><Chips v={book} set={setBook} opts={books} /></div>
      <p className="mb-1 font-mono text-[9px] tracking-[0.18em] text-white/70">SETUP × RUNG (3+ trades)</p>
      <Table rows={setups} cols={[["SETUP", (c) => String(c.setup)], ["RUNG", (c) => String(c.rung)]]} />
      <p className="mb-1 mt-2 font-mono text-[9px] tracking-[0.18em] text-white/70">BAND TRAVEL (bands crossed since the window before opened)</p>
      <Table rows={travel} cols={[["BANDS", (c) => String(c.bands)], ["HER TRADE", (c) => String(c.how)]]} />
    </div>
  );
}
