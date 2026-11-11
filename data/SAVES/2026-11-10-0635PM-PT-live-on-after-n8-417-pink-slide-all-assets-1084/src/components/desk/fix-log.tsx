// fix1081 FIX LOG TAB (Love Nov 10 2026 3:30 PM PT: "please create a FIX LOG tab in the app, that gives a brief description of each change, and what we fixed,
// and how to fix it again if we EVER run into this again"). Display only: it shows data/FIX-LOG.json and her whole save points. Nothing here changes her.
import { useQuery } from "@tanstack/react-query";
import { getFixLog1081 } from "@/lib/fixlog1081";
export function FixLog1081() {
  const q = useQuery({ queryKey: ["fix-log-1081"], queryFn: () => getFixLog1081(), refetchInterval: 120000, staleTime: 60000 });
  const d: any = q.data ?? {}; const entries: any[] = Array.isArray(d.entries) ? d.entries : []; const back: any[] = Array.isArray(d.back) ? d.back : []; const saves: string[] = Array.isArray(d.saves) ? d.saves : [];
  return (
    <div className="mb-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(255,212,121,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">FIX LOG · WHAT CHANGED · HOW TO GET BACK</p>
      {q.isLoading ? <p className="font-mono text-[10px] text-white/60">reading…</p> : null}
      {d.err ? <p className="font-mono text-[10px]" style={{ color: "#ff6b6b" }}>{String(d.err)}</p> : null}
      {back.length ? (
        <div className="mb-2 rounded-xl px-2 py-1.5" style={{ border: "1px solid rgba(61,220,132,0.6)" }}>
          <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.18em]" style={{ color: "#3ddc84" }}>IF SHE IS EVER LOST · HOW TO GET HER BACK</p>
          {back.map((b, i) => (<p key={i} className="font-mono text-[10px] leading-snug text-white/90">{i + 1}. {String(b)}</p>))}
          {saves.length ? <p className="mt-1 font-mono text-[9.5px] text-white/60">her whole save points, newest first:</p> : null}
          {saves.map((s) => (<p key={s} className="font-mono text-[10px] text-white">{s}</p>))}
        </div>
      ) : null}
      <div className="max-h-[32rem] overflow-y-auto">
        {entries.map((e, i) => (
          <div key={String(e?.id ?? i)} className="border-t border-white/10 py-1.5 font-mono text-[10px] leading-snug">
            <p className="font-bold text-white">{String(e?.id ?? "")} · {String(e?.title ?? "")}</p>
            <p className="text-white/50">{String(e?.when ?? "")} · {String(e?.state ?? "")}</p>
            {e?.problem ? <p className="text-white/85"><span className="text-white/50">what was wrong: </span>{String(e.problem)}</p> : null}
            {e?.change ? <p className="text-white/85"><span className="text-white/50">what changed: </span>{String(e.change)}</p> : null}
            {e?.notCovered ? <p className="text-white/70"><span className="text-white/50">not covered: </span>{String(e.notCovered)}</p> : null}
            {e?.again ? <p style={{ color: "#ffd479" }}><span className="text-white/50">to do it again: </span>{String(e.again)}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
