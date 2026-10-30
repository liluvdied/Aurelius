// SCOPE TAB (Oct 16 ~3:05 AM PT, Love): pick a book, a from-time and a to-time (Pacific), and 3D / 7D / 1M / ALL - the win
// rate and P&L of just that time window across those days, day by day, with the trades underneath.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getScope, getScopeBooks } from "@/lib/desk/fns";

const usd = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mins = (hm: string) => { const [h, m] = hm.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const RANGES: [string, number][] = [["3D", 3], ["7D", 7], ["1M", 30], ["ALL", 0]];
// 12-HOUR TIME (Oct 16, Love: "please always frame time in 12 hour sets, not 24")
const fmt12 = (hm: string) => { const [h, m] = hm.split(":").map(Number); return `${(h % 12) || 12}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
function TimePick({ value, onChange, cls }: { value: string; onChange: (v: string) => void; cls: string }) {
  const [h, m] = value.split(":").map(Number);
  const h12 = (h % 12) || 12, ap = h < 12 ? "AM" : "PM";
  const set = (nh12: number, nm: number, nap: string) => onChange(`${String((nh12 % 12) + (nap === "PM" ? 12 : 0)).padStart(2, "0")}:${String(nm).padStart(2, "0")}`);
  const st = { colorScheme: "dark" as const };
  return (
    <span className="inline-flex gap-1">
      <select value={h12} onChange={(e) => set(Number(e.target.value), m, ap)} className={cls} style={st}>{Array.from({ length: 12 }, (_, i) => i + 1).map((x) => <option key={x} value={x} style={{ background: "#111" }}>{x}</option>)}</select>
      <select value={m} onChange={(e) => set(h12, Number(e.target.value), ap)} className={cls} style={st}>{Array.from({ length: 60 }, (_, i) => i).map((x) => <option key={x} value={x} style={{ background: "#111" }}>{String(x).padStart(2, "0")}</option>)}</select>
      <select value={ap} onChange={(e) => set(h12, m, e.target.value)} className={cls} style={st}><option value="AM" style={{ background: "#111" }}>AM</option><option value="PM" style={{ background: "#111" }}>PM</option></select>
    </span>
  );
}
const tone = (p: number) => (p > 0.05 ? "#7dffb0" : p < -0.05 ? "#ff8fa3" : "rgba(255,255,255,0.7)");

export function ScopeTab() {
  const booksQ = useQuery({ queryKey: ["scope-books"], queryFn: () => getScopeBooks(), refetchInterval: 300000 });
  const [book, setBook] = useState("ogp5-fast");
  const [from, setFrom] = useState("03:00");
  const [to, setTo] = useState("04:00");
  const [days, setDays] = useState(7);
  const q = useQuery({
    queryKey: ["scope", book, from, to, days],
    queryFn: () => getScope({ data: { book, from: mins(from), to: mins(to), days } }),
    enabled: !!book && !!from && !!to,
    refetchInterval: 120000,
  });
  const r = q.data;
  const rate = r && r.total.n ? Math.round((r.total.w / r.total.n) * 100) : 0;
  const box = "rounded-[6px] border border-white/30 bg-transparent px-2 py-1 font-mono text-[11px] text-white";
  return (
    <section className="rounded-[22px] border border-white/25 px-4 py-4 shadow-[0_0_18px_rgba(255,255,255,0.06)]">
      <p className="text-[10px] tracking-[0.28em] text-white/90">SCOPE · ONE BOOK · ONE TIME WINDOW (PACIFIC)</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={book} onChange={(e) => setBook(e.target.value)} className={box} style={{ colorScheme: "dark" }}>
          {(booksQ.data ?? [{ id: "ogp5-fast", name: "OGP5-FAST", n: 0 }]).map((b) => (
            <option key={b.id} value={b.id} style={{ background: "#111" }}>{b.name} ({b.n})</option>
          ))}
        </select>
        <TimePick value={from} onChange={setFrom} cls={box} />
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/60">THROUGH</span>
        <TimePick value={to} onChange={setTo} cls={box} />
        <div className="flex gap-1">
          {RANGES.map(([label, d]) => (
            <button key={label} type="button" onClick={() => setDays(d)} className="rounded-[5px] px-2 py-1 font-mono text-[10px] tracking-[0.18em]"
              style={{ border: `1px solid ${days === d ? "#fff" : "rgba(255,255,255,0.3)"}`, color: days === d ? "#fff" : "rgba(255,255,255,0.65)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {!r ? (
        <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-white/60">{q.isFetching ? "READING EVERY TRADE…" : "PICK A BOOK AND A WINDOW"}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="font-mono text-[22px]" style={{ color: tone(r.total.p) }}>{usd(r.total.p)}</span>
            <span className="font-mono text-[13px] text-white">{rate}% WIN</span>
            <span className="font-mono text-[11px] text-white/70">{r.total.w}W / {r.total.l}L · {r.total.n} trades</span>
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/50">{r.name} · {fmt12(from)} – {fmt12(to)} PT · {RANGES.find((x) => x[1] === days)?.[0]}</span>
          </div>
          {r.perDay.length ? (
            <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-4">
              {r.perDay.map((d) => (
                <div key={d.day} className="rounded-[8px] border border-white/15 px-2 py-1 font-mono text-[10px]">
                  <div className="text-white/60">{d.day}</div>
                  <div style={{ color: tone(d.p) }}>{usd(d.p)}</div>
                  <div className="text-white/60">{d.w}W {d.l}L · {d.n ? Math.round((d.w / d.n) * 100) : 0}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-white/60">NO TRADES IN THIS WINDOW</p>
          )}
          {r.trades.length ? (
            <ul className="mt-3 flex max-h-[420px] flex-col gap-[2px] overflow-y-auto">
              {r.trades.map((t) => (
                <li key={t.id} className="flex items-baseline justify-between gap-2 border-b border-white/10 py-[3px] font-mono text-[10px]">
                  <span className="text-white/60">{t.day.slice(5)} {fmt12(t.time)}</span>
                  <span className="w-[42px] text-white/80">{t.asset.toUpperCase()}</span>
                  <span className="w-[44px]" style={{ color: t.side === "up" ? "#7dffb0" : "#ff8fa3" }}>{t.side === "up" ? "LONG" : "SHORT"}</span>
                  <span className="flex-1 truncate text-white/55" title={`${t.setup} · ${t.exit}`}>{t.setup}</span>
                  <span style={{ color: tone(t.pnl) }}>{usd(t.pnl)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </section>
  );
}
