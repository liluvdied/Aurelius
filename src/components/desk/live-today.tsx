// fix722 LIVE TODAY ON TOP (Love Nov 5 2026 ~6:54 AM PT: "can you put her in the running table? super hard to find her"). Display only: when ONE BOOK LIVE TODAY is on
// (data/live-today.json), a pinned row at the top of the SHIFT books shows which book is live, until when, its daily stop, and its live trades today (W/L, $).
import { useQuery } from "@tanstack/react-query";
import { getLiveToday722 } from "@/lib/desk/fns";
const money = (v: number) => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toFixed(2)}`;
export function LiveToday722() {
  const q = useQuery({ queryKey: ["live-today-722"], queryFn: () => getLiveToday722(), refetchInterval: 20000, staleTime: 15000 });
  const d: any = q.data;
  if (!d || !d.on) return null;
  return (
    <div className="mb-3 rounded-2xl px-3 py-2" style={{ border: "1.5px solid #5dff9c", boxShadow: "0 0 12px rgba(93,255,156,0.35)" }}>
      <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-white">● LIVE TODAY · {d.name} <span className="text-white/60">({d.book})</span></p>
      <p className="mt-0.5 font-mono text-[10px] text-white/85">{d.n} live trades today · {d.w}W {d.l}L · {money(d.pnl)} · daily stop {d.stopAt != null ? `$${d.stopAt}` : "none"}{d.stopped ? " · STOPPED for today" : ""}</p>
      <p className="font-mono text-[9px] text-white/60">{String(d.book).includes(",") ? "AKIMBO - both books live, pivot gets the sticks · paper card: AKIMBO 🤹 chip · " : ""}only live book until {new Date(d.until).toLocaleTimeString()} · its own gates · CHANGE-63 puts your normal lineup back</p>
      {d.gateUnlocked ? <p className="mt-1 rounded px-1 font-mono text-[10px] font-bold text-white" style={{ background: "#d0263e" }}>🔓 GATE UNLOCKED - the no-removal gate warns but does not stop. Run RELOCK-GATE when you&apos;re done.</p> : null} {/* fix738 */}
      {(d.silent ?? []).map((s: any, i: number) => <p key={"s" + i} className="mt-1 rounded px-1 font-mono text-[9px] font-bold text-white" style={{ background: "#d0263e" }}>⚠ {String(s.text || "")}</p>)} {/* fix734 silent alarm */}
      {(d.recent ?? []).map((r: any, i: number) => <p key={i} className="border-t border-white/10 py-0.5 font-mono text-[9px] text-white/75">{new Date(r.first).toLocaleTimeString()} · {r.ticker} · {money(r.pnl)}</p>)}
    </div>
  );
}
