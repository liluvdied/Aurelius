// fix708 SETUP SCORES - EVERY BOOK, HER FRAMEWORK (Love Nov 5 2026 ~4:20 AM PT: "were you able to to get the stats system scoring under that framework again? we will be able
// to refine from there within 24 hours"). Display only - the old RETESTS look: each book's set ups ranked, n / hit / $ with a KEEP / LADDER / WATCH / CUT badge, 24 h or 7 days.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSetupScores708 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(0)}`;
const COL: Record<string, string> = { KEEP: "#7CFFB2", LADDER: "#FFE08A", WATCH: "rgba(255,255,255,0.55)", CUT: "#FF8A8A" };
export function SetupScores708() {
  const q = useQuery({ queryKey: ["setup-scores-708"], queryFn: () => getSetupScores708(), refetchInterval: 120000, staleTime: 100000 });
  const d: any = q.data, books = Object.keys(d?.books ?? {});
  const [book, setBook] = useState<string>(""), [span, setSpan] = useState<"7d" | "24h">("7d"), [all, setAll] = useState(false);
  const b = book && books.includes(book) ? book : books[0] ?? "";
  const rows = ((d?.books?.[b] ?? []) as any[]).filter((r) => (span === "7d" ? r.n7 : r.n24) > 0);
  const [sort814, setSort814] = useState<"LIST" | "HIT RATE" | "$$" | "$ / TRADE" | "EDGE">("LIST"); // fix818 (Love Nov 6 2026 ~9:33 AM PT: "maybe we should be sorting it by ones that are highest paying after all lol a 30% hit rate on one that pays 20x is worth it lol we need to be calculating in how we approach it") // fix814 (Love Nov 6 2026 ~8:42 AM PT: "i want the regular session bands and other zones to be formatted the way the other tallies are if we can pls it looks amazing the way you have the others" + "can you add a sorter here too bb ?? by hit rate and $$")
  const nn = (r: any) => (span === "7d" ? r.n7 : r.n24) || 0, ww = (r: any) => (span === "7d" ? r.w7 : r.w24) || 0, pp = (r: any) => (span === "7d" ? r.p7 : r.p24) || 0;
  const shown0 = all ? rows : rows.filter((r) => r.badge !== "WATCH" || (span === "7d" ? r.n7 : r.n24) >= 5);
  const ak = (r: any) => (span === "7d" ? r.ask7 : r.ask24), pt = (r: any) => pp(r) / Math.max(1, nn(r)), ed = (r: any) => (ak(r) ? ww(r) / Math.max(1, nn(r)) - ak(r) : -9); // fix818
  const shown = sort814 === "$ / TRADE" ? [...shown0].sort((x, y) => pt(y) - pt(x)) : sort814 === "EDGE" ? [...shown0].sort((x, y) => ed(y) - ed(x)) : sort814 === "HIT RATE" ? [...shown0].sort((x, y) => ww(y) / Math.max(1, nn(y)) - ww(x) / Math.max(1, nn(x)) || nn(y) - nn(x)) : sort814 === "$$" ? [...shown0].sort((x, y) => pp(y) - pp(x)) : shown0;
  return (
    <section className="mt-3 rounded-xl bg-black p-4">
      <p className="text-[10px] font-medium tracking-[0.22em] text-white/60">SET UP SCORES · EVERY BOOK · HER FRAMEWORK</p>
      <p className="mt-1 font-mono text-[9px] text-white/50">{d?.rule ?? "loading…"}{d?.at ? ` · scored ${new Date(d.at).toLocaleTimeString()}` : ""}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {books.map((x) => <button key={x} onClick={() => setBook(x)} className={`rounded-md border px-2 py-0.5 font-mono text-[9px] ${x === b ? "border-white text-white" : "border-white/30 text-white/60"}`}>{x}</button>)}
      </div>
      <div className="mt-1 flex gap-1">
        {(["7d", "24h"] as const).map((x) => <button key={x} onClick={() => setSpan(x)} className={`rounded-md border px-2 py-0.5 font-mono text-[9px] ${x === span ? "border-white text-white" : "border-white/30 text-white/60"}`}>{x === "7d" ? "7 DAYS" : "24 HOURS"}</button>)}
        <button onClick={() => setAll(!all)} className="rounded-md border border-white/30 px-2 py-0.5 font-mono text-[9px] text-white/60">{all ? "HIDE THIN" : "SHOW ALL"}</button>
        {(["LIST", "HIT RATE", "$$", "$ / TRADE", "EDGE"] as const).map((x) => <button key={x} onClick={() => setSort814(x)} className={`rounded-md border px-2 py-0.5 font-mono text-[9px] ${x === sort814 ? "border-white text-white" : "border-white/30 text-white/60"}`}>{x}</button>)} {/* fix814 sorter */}
      </div>
      {shown.length === 0 ? <p className="mt-3 text-sm text-white/50">No closed trades in this span yet.</p> : (
        <ul className="mt-3 flex flex-col gap-2">
          {shown.map((r: any) => { const n = span === "7d" ? r.n7 : r.n24, w = span === "7d" ? r.w7 : r.w24, p = span === "7d" ? r.p7 : r.p24; return (
            <li key={r.setup} className="flex items-center justify-between gap-3 rounded-md border border-white/40 bg-black px-3 py-2 text-white shadow-[0_0_10px_rgba(255,255,255,0.14)]">
              <span className="min-w-0 truncate text-sm">{r.setup}</span>
              <span className="shrink-0 font-mono text-sm tabular-nums">{w}/{n}<span className="ml-2 text-xs">{n ? Math.round((100 * w) / n) : 0}%</span><span className="ml-2 text-xs">{money(p)}</span><span className="ml-2 text-[10px] text-white/70">{n ? `${p / n >= 0 ? "+" : "-"}$${Math.abs(p / n).toFixed(2)}/t` : ""}</span><span className="ml-2 text-[10px] text-white/70">{(span === "7d" ? r.ask7 : r.ask24) ? `edge ${Math.round(100 * (w / Math.max(1, n) - (span === "7d" ? r.ask7 : r.ask24))) >= 0 ? "+" : ""}${Math.round(100 * (w / Math.max(1, n) - (span === "7d" ? r.ask7 : r.ask24)))}` : ""}</span><span className="ml-2 text-[10px] font-bold" style={{ color: COL[r.badge] }}>{r.badge}</span></span>
            </li>); })}
        </ul>)}
    </section>
  );
}
