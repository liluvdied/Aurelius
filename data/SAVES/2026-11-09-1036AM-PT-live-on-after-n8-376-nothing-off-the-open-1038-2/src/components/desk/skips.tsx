// fix697 EVERY SKIP, IN PLAIN WORDS + A FLAG (Love Nov 5 2026 ~2:17 AM PT: "just have it log every skip and the reason for it so i can look without bugging you. and let's add a flag
// button so i can flag the flawed ones"). Display only; the FLAG button writes one line to data/sitrep-flags.jsonl.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSkips697, flagSkip697 } from "@/lib/desk/fns";
export function Skips697() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["skips-697"], queryFn: () => getSkips697(), refetchInterval: 60000, staleTime: 50000 });
  const [open, setOpen] = useState<string>(""); const [note, setNote] = useState("");
  const rows: any[] = (q.data as any[]) ?? [];
  const send = async (r: any) => { await flagSkip697({ data: { id: r.id, note, line: `${r.window} ${r.asset} | ${r.text} | ${r.first}` } }); setOpen(""); setNote(""); qc.invalidateQueries({ queryKey: ["skips-697"] }); };
  return (
    <div className="mb-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(255,212,121,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">EVERY WINDOW · TOOK IT OR WHY NOT · LAST 12 H</p>
      <p className="mb-2 font-mono text-[9px] text-white/55">her live book per window and asset · the first wall that held it, with its numbers · the runner-up idea · FLAG the wrong ones (Claude reads data/sitrep-flags.jsonl)</p>
      {q.isLoading ? <p className="font-mono text-[10px] text-white/60">reading…</p> : null}
      <div className="max-h-96 overflow-y-auto">
        {rows.map((r) => (
          <div key={r.id} className="border-t border-white/10 py-1 font-mono text-[9.5px]">
            <div className="flex items-start justify-between gap-2">
              <p style={{ color: r.took ? "#3ddc84" : "rgba(255,255,255,0.9)" }}>{r.window} · {String(r.asset).toUpperCase()} · {r.text}</p>
              <button type="button" onClick={() => setOpen(open === r.id ? "" : r.id)} className="shrink-0 rounded-[4px] px-1.5 py-0.5 text-[9px]" style={{ border: `1px solid ${r.flagged ? "#ff6b6b" : "rgba(255,255,255,0.35)"}`, color: r.flagged ? "#ff6b6b" : "rgba(255,255,255,0.7)" }}>{r.flagged ? "FLAGGED" : "FLAG"}</button>
            </div>
            {r.first ? <p className="text-white/60">held by: {r.first}</p> : null}
            {r.runnerUp ? <p className="text-white/45">{r.runnerUp}</p> : null}
            {open === r.id ? <div className="mt-1 flex gap-1"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what's wrong (optional)" className="flex-1 rounded border border-white/30 bg-black px-1 text-[10px] text-white" /><button type="button" onClick={() => send(r)} className="rounded border border-white/60 px-2 text-[9px] text-white">SEND</button></div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
