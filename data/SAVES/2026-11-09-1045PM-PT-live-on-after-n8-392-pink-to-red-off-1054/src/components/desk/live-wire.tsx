// fix1044 LIVE WIRE + WTF BOOK (Love Nov 9 2026 ~11:09 AM PT: "LIVE WIRE / just every trade thats going out on every book WHEN they're going out , and on which book / but it needs to update with price"
// + "WTF BOOK / EVERY TRADE THAT WAS A WTF !!! GOING FORWARD GETS LOGGED AND TRACKED DATE & TIME"). Display + her WTF tap only - nothing here sends, sizes or blocks an order.
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLiveWire1044, addWtf1044, getWtf1044 } from "@/lib/desk/livewire1044";

const money = (v: number) => `${v >= 0 ? "+" : "−"}$${Math.abs(v).toFixed(2)}`;
const pt = (iso: string) => { try { return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }); } catch { return iso; } };
const btn = (on: boolean) => `rounded-md border px-2 py-0.5 font-mono text-[10px] ${on ? "border-white text-white" : "border-white/30 text-white/60"}`;

// snap: the desk snapshot the page already has (spot + the current Kalshi window's bids, refreshed every second while this tab is open)
export function LiveWire1044({ snap }: { snap: any }) {
  const qc = useQueryClient();
  const [view, setView] = useState<"wire" | "wtf">("wire"), [book, setBook] = useState(""), [noteFor, setNoteFor] = useState(""), [note, setNote] = useState(""), [sent, setSent] = useState<Record<string, boolean>>({});
  const q = useQuery({ queryKey: ["live-wire-1044"], queryFn: () => getLiveWire1044(), refetchInterval: 2000, staleTime: 1500, placeholderData: (p) => p });
  const wq = useQuery({ queryKey: ["wtf-1044"], queryFn: () => getWtf1044(), enabled: view === "wtf", refetchInterval: 10000 });
  const rows = (q.data?.rows ?? []) as any[];
  const books = useMemo(() => Array.from(new Set(rows.map((r) => r.book))).sort(), [rows]);
  const shown = rows.filter((r) => !book || r.book === book).slice(0, 200);
  const live = (r: any): number | null => {
    if (r.result !== "open" || !(r.ask > 0)) return null;
    const m = snap?.assets?.[r.asset]?.market;
    if (!m || m.ticker !== r.ticker) return r.lastBid > 0 ? r.stake * (r.lastBid / r.ask - 1) : null; // fix1045: the 5m paper books carry their own live bid
    const bid = Number(r.side === "up" ? m.yesBid : m.noBid);
    return bid > 0 ? r.stake * (bid / r.ask - 1) : null;
  };
  const wtf = async (id: string) => { await addWtf1044({ data: { id, note } }); setSent((s) => ({ ...s, [id]: true })); setNoteFor(""); setNote(""); void qc.invalidateQueries({ queryKey: ["wtf-1044"] }); };
  const openNow = shown.filter((r) => r.result === "open"); const openPnl = openNow.reduce((s, r) => s + (live(r) ?? 0), 0);
  return (
    <section className="mt-3 rounded-xl bg-black p-4 text-white">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-medium tracking-[0.22em] text-white/70">⚡ LIVE WIRE · EVERY TRADE, EVERY BOOK · PAPER</p>
        <div className="flex gap-1"><button className={btn(view === "wire")} onClick={() => setView("wire")}>LIVE WIRE</button><button className={btn(view === "wtf")} onClick={() => setView("wtf")}>🤬 WTF BOOK</button></div>
      </div>
      {view === "wire" ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] text-white/70">
            <select className="rounded border border-white/30 bg-black px-1 py-0.5" value={book} onChange={(e) => setBook(e.target.value)}><option value="">every book</option>{books.map((b) => <option key={b} value={b}>{b}</option>)}</select>
            <span>{openNow.length} open · live P/L <span className={openPnl >= 0 ? "text-up" : "text-down"}>{money(openPnl)}</span></span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {shown.map((r) => { const lp = live(r), pnl = r.result === "open" ? lp : r.pnl; const tone = pnl == null ? "text-white/50" : pnl > 0 ? "text-up" : pnl < 0 ? "text-down" : "text-white";
              return (
                <li key={r.id} className="rounded-md border border-white/20 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs"><span className="font-mono text-white/60">{pt(r.at)}</span> · <span className="text-white">{r.book}</span> · {String(r.asset).toUpperCase()} {r.side === "up" ? "LONG" : r.side === "down" ? "SHORT" : r.side} · {r.ask > 0 ? `${Math.round(r.ask * 100)}c (${(1 / r.ask).toFixed(2)}x)` : ""}</p>
                      <p className="mt-0.5 truncate text-[11px] text-white/70">{r.setup}</p>
                      {r.result !== "open" && r.exit ? <p className="mt-0.5 truncate text-[10px] text-white/50">{r.exit}</p> : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-mono text-sm tabular-nums ${tone}`}>{pnl == null ? (r.result === "open" ? "OPEN" : "—") : money(pnl)}</p>
                      <p className="font-mono text-[9px] text-white/50">{r.result === "open" ? (lp == null ? "open · no live bid" : "open · live") : r.result}</p>
                      {sent[r.id] ? <p className="font-mono text-[9px] text-down">WTF logged</p> : noteFor === r.id ? (
                        <div className="mt-1 flex gap-1"><input className="w-28 rounded border border-white/30 bg-black px-1 text-[10px]" placeholder="note (optional)" value={note} onChange={(e) => setNote(e.target.value)} /><button className={btn(true)} onClick={() => void wtf(r.id)}>LOG</button></div>
                      ) : <button className="mt-1 rounded-md border border-down/60 px-2 py-0.5 font-mono text-[10px] text-down" onClick={() => setNoteFor(r.id)}>WTF</button>}
                    </div>
                  </div>
                </li>);
            })}
          </ul>
        </>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {((wq.data ?? []) as any[]).length === 0 ? <p className="mt-2 text-xs text-white/60">No WTF trades logged yet.</p> : ((wq.data ?? []) as any[]).map((x, i) => (
            <li key={x.id + i} className="rounded-md border border-white/20 px-3 py-2">
              <p className="text-xs"><span className="font-mono text-white/60">{new Date(x.at).toLocaleString()}</span> · {x.kind === "auto" ? "AUTO" : "TAP"} · <span className="text-white">{x.book}</span> · {String(x.asset).toUpperCase()} {x.side === "up" ? "LONG" : "SHORT"} · {x.ask > 0 ? `${Math.round(x.ask * 100)}c` : ""}</p>
              <p className="mt-0.5 text-[11px] text-white/70">{x.setup}</p>
              {x.rule ? <p className="mt-0.5 text-[10px] text-down">broke: {x.rule}</p> : null}
              {x.note ? <p className="mt-0.5 text-[10px] text-white/80">your note: {x.note}</p> : null}
              <p className="mt-0.5 font-mono text-[10px] text-white/60">entered {pt(x.entryAt || x.at)} · result {x.result}{x.pnl != null ? ` · ${money(x.pnl)}` : ""}</p>
            </li>))}
        </ul>
      )}
    </section>
  );
}
