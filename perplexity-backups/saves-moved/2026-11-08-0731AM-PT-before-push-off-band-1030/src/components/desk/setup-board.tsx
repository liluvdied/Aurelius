// fix773 SETUP SCOREBOARD (Love Nov 5 2026 ~8:04 PM PT: "lets score our own trades by these as well , and create a flip at red - break thru pink - etc scoring system for
// ours alongside it 💘 ... now lets choose what she takes"). Display only: every book's settled trades by asset | side | set up, two ways - OUR SETUP (the family of the
// label the book wrote) and HER BAND READ (what V.111 - 2's brain called that minute) - this week and the last 24 h, CUT red / KEEP green. Scored on the server.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSetupBoard773, getSetupBoardWeek773 } from "@/lib/desk/setupboard773";

const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
const COL: Record<string, string> = { KEEP: "#7CFFB2", CUT: "#FF8A8A", WATCH: "rgba(255,255,255,0.55)", "NO BARS": "rgba(255,255,255,0.35)" };
const BG: Record<string, string> = { KEEP: "rgba(124,255,178,0.12)", CUT: "rgba(255,138,138,0.14)" };
const btn = (on: boolean) => `rounded-md border px-2 py-0.5 font-mono text-[9px] ${on ? "border-white text-white" : "border-white/30 text-white/60"}`;

export function SetupBoard773() {
  const [book, setBook] = useState(""), [lens, setLens] = useState<"ours" | "hers">("ours"), [span, setSpan] = useState<string>("wk"), [sort, setSort] = useState<"hit" | "money">("hit");
  const q = useQuery({ queryKey: ["setup-board-773", book, lens], queryFn: () => getSetupBoard773({ data: { book, lens } }), refetchInterval: 60000, staleTime: 55000 });
  const past = span !== "wk" && span !== "d24" ? span : "";
  const d: any = q.data, b = String(d?.book || "");
  const qp = useQuery({ queryKey: ["setup-board-773-week", past, b, lens], queryFn: () => getSetupBoardWeek773({ data: { week: past, book: b, lens } }), enabled: !!past && !!b, staleTime: 600000 });
  const R = d?.rules ?? { minTrades: 10, minHitPct: 60 };
  const src: any[] = past ? ((qp.data as any)?.rows ?? []) : (d?.rows ?? []);
  const key = past ? "wk" : span, vk = past || span === "wk" ? "vwk" : "v24";
  const rows = src.filter((r) => r[key]?.[0] > 0).map((r) => ({ ...r, c: r[key], v: r[vk] })).sort((x, y) => sort === "money" ? y.c[2] - x.c[2] : y.c[1] / y.c[0] - x.c[1] / x.c[0] || y.c[0] - x.c[0]);
  const tot = rows.reduce((s, r) => ({ n: s.n + r.c[0], w: s.w + r.c[1], p: s.p + r.c[2] }), { n: 0, w: 0, p: 0 });
  return (
    <section className="mt-3 rounded-xl bg-black p-4">
      <p className="text-[10px] font-medium tracking-[0.22em] text-white/60">SETUP SCOREBOARD · EVERY BOOK · OUR SETUP / HER BAND READ</p>
      <p className="mt-1 font-mono text-[9px] text-white/50">
        CUT = {R.minTrades}+ trades and hit under {R.minHitPct}% or $ under 0 · KEEP = {R.minTrades}+ trades, {R.minHitPct}%+ and $ over 0 · WATCH = under {R.minTrades} trades (data/setup-verdict-rules.json) · $ = each book's own exits, take-profit where it has one
        {d?.at ? ` · scored ${new Date(d.at).toLocaleTimeString()}` : " · first scoring runs in the background (about a minute)…"}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <select value={b} onChange={(e) => setBook(e.target.value)} className="max-w-full rounded-md border border-white/40 bg-black px-2 py-0.5 font-mono text-[10px] text-white">
          {(d?.books ?? []).map((x: any) => <option key={x.id} value={x.id}>{x.name} · {x.n} this week</option>)}
        </select>
        <button onClick={() => setLens("ours")} className={btn(lens === "ours")}>OUR SETUP</button>
        <button onClick={() => setLens("hers")} className={btn(lens === "hers")}>HER BAND READ</button>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <button onClick={() => setSpan("wk")} className={btn(span === "wk")}>THIS WEEK</button>
        <button onClick={() => setSpan("d24")} className={btn(span === "d24")}>LAST 24H</button>
        {(d?.past ?? []).length ? (
          <select value={past} onChange={(e) => setSpan(e.target.value || "wk")} className="rounded-md border border-white/30 bg-black px-2 py-0.5 font-mono text-[9px] text-white/70">
            <option value="">PAST WEEKS…</option>
            {(d?.past ?? []).map((w: string) => <option key={w} value={w}>week of {w}</option>)}
          </select>
        ) : null}
        <span className="ml-2 font-mono text-[9px] text-white/50">SORT</span>
        <button onClick={() => setSort("hit")} className={btn(sort === "hit")}>HIT %</button>
        <button onClick={() => setSort("money")} className={btn(sort === "money")}>$</button>
      </div>
      {lens === "hers" ? <p className="mt-1 font-mono text-[9px] text-white/45">her band read = what V.111 - 2 would call the minute each trade went in (60-minute rolling VWAP, half bands, 1m then 5m then window open) · "no bars" = the desk had no saved 1m bars for that hour · "no band read" = she would not have traded it</p> : null}
      {rows.length ? <p className="mt-2 font-mono text-[10px] text-white/70">{tot.w}/{tot.n} · {Math.round((100 * tot.w) / tot.n)}% · {money(tot.p)}</p> : null}
      {rows.length === 0 ? <p className="mt-3 text-sm text-white/50">{q.isLoading || qp.isLoading ? "loading…" : "No settled trades for this book in this span yet."}</p> : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {rows.map((r) => (
            <li key={`${r.asset}|${r.side}|${r.setup}`} className="flex items-center justify-between gap-3 rounded-md border border-white/30 px-3 py-1.5 text-white" style={{ background: BG[r.v] ?? "black" }}>
              <span className="min-w-0 truncate text-[13px]"><span className="font-mono text-[10px] text-white/60">{String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : "SHORT"} · </span>{r.setup}</span>
              <span className="shrink-0 font-mono text-[12px] tabular-nums">{r.c[1]}/{r.c[0]}<span className="ml-2 text-[11px]">{Math.round((100 * r.c[1]) / r.c[0])}%</span><span className="ml-2 text-[11px]">{money(r.c[2])}</span><span className="ml-2 text-[10px] text-white/55">ask {Math.round((100 * r.c[3]) / r.c[0])}c</span><span className="ml-2 text-[10px] font-bold" style={{ color: COL[r.v] ?? COL.WATCH }}>{r.v}</span></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
