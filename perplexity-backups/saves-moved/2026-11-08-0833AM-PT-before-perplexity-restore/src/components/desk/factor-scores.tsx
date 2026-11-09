// fix825 STATS · EVERY FACTOR (Love Nov 6 2026 ~10:43 AM PT: "can you take it a bit further and have her score red/green zone trades at the different band levels too? ... every independent
// factor ... we simply cut the ones that don't pay"). Display only: main / REJ trades scored by each factor on its own (where price sat in the bands, set up x that spot, the line traded,
// the zone just past the band, the target by a line, her side of the pink, the hour), as tally cards with the same sorters as SET UP SCORES.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getFactorScores825 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(0)}`;
export function FactorScores825() {
  const q = useQuery({ queryKey: ["factor-scores-825"], queryFn: () => getFactorScores825(), refetchInterval: 120000, staleTime: 100000 });
  const d: any = q.data, books = Object.keys(d?.books ?? {}), facs: string[] = d?.factors ?? [];
  const [book, setBook] = useState(""), [fac, setFac] = useState(""), [span, setSpan] = useState<"7d" | "24h">("7d"), [all, setAll] = useState(false);
  const [sort, setSort] = useState<"LIST" | "HIT RATE" | "$$" | "$ / TRADE" | "EDGE">("$ / TRADE");
  const b = book && books.includes(book) ? book : books[0] ?? "", f = fac && facs.includes(fac) ? fac : facs[0] ?? "";
  const nn = (r: any) => (span === "7d" ? r.n7 : r.n24) || 0, ww = (r: any) => (span === "7d" ? r.w7 : r.w24) || 0, pp = (r: any) => (span === "7d" ? r.p7 : r.p24) || 0, ak = (r: any) => (span === "7d" ? r.ask7 : r.ask24);
  const pt = (r: any) => pp(r) / Math.max(1, nn(r)), ed = (r: any) => (ak(r) ? ww(r) / Math.max(1, nn(r)) - ak(r) : -9);
  const rows0 = ((d?.books?.[b]?.[f] ?? []) as any[]).filter((r) => nn(r) > 0 && (all || nn(r) >= 5));
  const rows = sort === "$ / TRADE" ? [...rows0].sort((x, y) => pt(y) - pt(x)) : sort === "EDGE" ? [...rows0].sort((x, y) => ed(y) - ed(x)) : sort === "HIT RATE" ? [...rows0].sort((x, y) => ww(y) / Math.max(1, nn(y)) - ww(x) / Math.max(1, nn(x)) || nn(y) - nn(x)) : sort === "$$" ? [...rows0].sort((x, y) => pp(y) - pp(x)) : rows0;
  const pill = (on: boolean) => `rounded-md border px-2 py-0.5 font-mono text-[9px] ${on ? "border-white text-white" : "border-white/30 text-white/60"}`;
  return (
    <section className="mt-3 rounded-xl bg-black p-4">
      <p className="text-[10px] font-medium tracking-[0.22em] text-white/60">STATS · EVERY FACTOR · MAIN + REJ</p>
      <p className="mt-1 font-mono text-[9px] text-white/50">each factor on its own, from the board she saw at the call{d?.matched != null ? ` · ${d.matched} trades matched` : ""}{d?.at ? ` · scored ${new Date(d.at).toLocaleTimeString()}` : " · loading…"}</p>
      <div className="mt-2 flex flex-wrap gap-1">{books.map((x) => <button key={x} onClick={() => setBook(x)} className={pill(x === b)}>{x}</button>)}</div>
      <div className="mt-1 flex flex-wrap gap-1">{facs.map((x) => <button key={x} onClick={() => setFac(x)} className={pill(x === f)}>{x}</button>)}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {(["7d", "24h"] as const).map((x) => <button key={x} onClick={() => setSpan(x)} className={pill(x === span)}>{x === "7d" ? "7 DAYS" : "24 HOURS"}</button>)}
        <button onClick={() => setAll(!all)} className={pill(false)}>{all ? "HIDE THIN" : "SHOW ALL"}</button>
        {(["LIST", "HIT RATE", "$$", "$ / TRADE", "EDGE"] as const).map((x) => <button key={x} onClick={() => setSort(x)} className={pill(x === sort)}>{x}</button>)}
      </div>
      {rows.length === 0 ? <p className="mt-3 text-sm text-white/50">No closed trades for this factor in this span yet.</p> : (
        <ul className="mt-3 flex flex-col gap-2">
          {rows.map((r: any) => { const n = nn(r), w = ww(r), p = pp(r), a = ak(r); return (
            <li key={r.setup} className="flex items-center justify-between gap-3 rounded-md border border-white/40 bg-black px-3 py-2 text-white shadow-[0_0_10px_rgba(255,255,255,0.14)]">
              <span className="min-w-0 truncate text-sm">{r.setup}</span>
              <span className="shrink-0 font-mono text-sm tabular-nums">{w}/{n}<span className="ml-2 text-xs">{n ? Math.round((100 * w) / n) : 0}%</span><span className="ml-2 text-xs">{money(p)}</span><span className="ml-2 text-[10px] text-white/70">{n ? `${p / n >= 0 ? "+" : "-"}$${Math.abs(p / n).toFixed(2)}/t` : ""}</span><span className="ml-2 text-[10px] text-white/70">{a ? `edge ${Math.round(100 * (w / Math.max(1, n) - a)) >= 0 ? "+" : ""}${Math.round(100 * (w / Math.max(1, n) - a))}` : ""}</span></span>
            </li>); })}
        </ul>)}
    </section>
  );
}
