// fix680 STATS: setup x rung + band travel for her real books (Love Nov 4 2026 11:20 PM PT: "stats tables too bb sorry !!"). Display only - reads data/rung-stats.json (rebuilt every 2 h).
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRungStats680 } from "@/lib/desk/fns";

type Cell = { period: string; book: string; asset: string; n: number; w: number; pnl: number; setup?: string; rung?: string; bands?: string; how?: string; fam?: string };
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
  const q = useQuery({ queryKey: ["rung-stats-680"], queryFn: () => getRungStats680(), refetchInterval: 600000, staleTime: 540000 }); // fix692 lighter page: every 10 min (was every minute, ~419 KB; the table is rebuilt every 2 h)
  const [period, setPeriod] = useState("7d"); const [book, setBook] = useState("MAIN"); /* fix814 (Love Nov 6 2026 ~8:37 AM PT: "the stats changed to only V.111  i still want our main & rej set ups being tracked at each band and each zone"): main first, REJECTION one tap away */ const [asset, setAsset] = useState("btc"); const [fam, setFam] = useState("session"); // fix689
  const books = useMemo(() => { const bs = [...new Set(((q.data?.setups ?? []) as Cell[]).map((c) => c.book).filter((b) => b !== "all"))]; const first = ["MAIN", "REJECTION"].filter((b) => bs.includes(b)); return [...first, ...bs.filter((b) => !first.includes(b)), "all"]; }, [q.data]); /* fix814: MAIN and REJECTION lead */
  const pick = (xs: Cell[]) => xs.filter((c) => c.period === period && c.book === book && c.asset === asset);
  const [sort814, setSort814] = useState("TRADES"); /* fix814 (Love Nov 6 2026 ~8:42 AM PT: "i want the regular session bands and other zones to be formatted the way the other tallies are if we can pls it looks amazing the way you have the others" + "can you add a sorter here too bb ?? by hit rate and $$") */
  const setups = pick((q.data?.setups ?? []) as Cell[]).filter((c) => c.n >= 3).sort((a, b) => sort814 === "HIT RATE" ? (b.w / Math.max(1, b.n) - a.w / Math.max(1, a.n)) || b.n - a.n : sort814 === "$$" ? b.pnl - a.pnl : b.n - a.n);
  const travel = pick((q.data?.travel ?? []) as Cell[]).filter((c) => (c.fam ?? "session") === fam).sort((a, b) => String(a.bands).localeCompare(String(b.bands)) || String(a.how).localeCompare(String(b.how)));
  return (
    <div className="mt-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(93,255,156,0.45)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">HER BOOKS · SETUP × RUNG + BAND TRAVEL</p>
      <p className="mb-2 font-mono text-[9px] text-white/55">{q.data?.at ? `${q.data.trades} trades · rebuilt ${new Date(q.data.at).toLocaleString()}` : "building… (rebuilt every 2 h)"} · $20 paper, her take-profit</p>
      <div className="mb-2 flex flex-col gap-1"><Chips v={period} set={setPeriod} opts={["today", "7d", "all"]} /><Chips v={asset} set={setAsset} opts={["btc", "gold"]} /><Chips v={book} set={setBook} opts={books} /></div>
      <p className="mb-1 font-mono text-[9px] tracking-[0.18em] text-white/70">SETUP × RUNG (3+ trades)</p>
      <div className="mb-1"><Chips v={sort814} set={setSort814} opts={["TRADES", "HIT RATE", "$$"]} /></div>
      {setups.length === 0 ? <p className="font-mono text-[9px] text-white/50">No set ups with 3+ trades here yet.</p> : (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto" /* fix814: her band / zone set ups as tally cards, like SET UP SCORES */>
          {setups.map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-md border border-white/40 bg-black px-3 py-2 text-white shadow-[0_0_10px_rgba(255,255,255,0.14)]">
              <span className="min-w-0 truncate text-sm">{String(c.asset).toUpperCase()} · {String(c.setup)}{c.rung && c.rung !== "-" ? ` · ${String(c.rung)}` : ""}</span>
              <span className="shrink-0 font-mono text-sm tabular-nums">{c.w}/{c.n}<span className="ml-2 text-xs">{Math.round((100 * c.w) / Math.max(1, c.n))}%</span><span className="ml-2 text-xs" style={{ color: c.pnl >= 0 ? "#7CFFB2" : "#FF8A8A" }}>{money(c.pnl)}</span></span>
            </li>))}
        </ul>)}
      <p className="mb-1 mt-2 font-mono text-[9px] tracking-[0.18em] text-white/70">BAND TRAVEL (lines crossed since the window before opened)</p>
      <div className="mb-1"><Chips v={fam} set={setFam} opts={["session", "pivots", "bollinger"]} /></div> {/* fix689: session bands / her pivots (pink, red, green) / Bollinger 20-2 */}
      <Table rows={travel} cols={[["BANDS", (c) => String(c.bands)], ["HER TRADE", (c) => String(c.how)]]} />
    </div>
  );
}
