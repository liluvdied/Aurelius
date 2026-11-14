// fix1096 BUG BOX TAB (Love Nov 13 2026 9:03 PM PT: "every known bug, logged with either a check or hollow mark" + "let's make a new tab for it").
// Display only: it shows data/BUG-BOX.json. A check = the change is in her and was seen on her desk. A hollow mark = still open. Nothing here changes her.
import { useQuery } from "@tanstack/react-query";
import { getBugBox1096 } from "@/lib/bugbox1096";
export function BugBox1096() {
  const q = useQuery({ queryKey: ["bug-box-1096"], queryFn: () => getBugBox1096(), refetchInterval: 60000, staleTime: 30000 });
  const d: any = q.data ?? {}; const bugs: any[] = Array.isArray(d.bugs) ? d.bugs : [];
  const done = bugs.filter((b) => b?.done === true), open = bugs.filter((b) => b?.done !== true);
  const row = (b: any, i: number) => (
    <div key={String(b?.id ?? i)} className="border-t border-white/10 py-1.5 font-mono text-[10px] leading-snug">
      <p className="font-bold text-white"><span style={{ color: b?.done === true ? "#3ddc84" : "#ffd479" }}>{b?.done === true ? "✓" : "○"}</span> {String(b?.id ?? "")} · {String(b?.title ?? "")}</p>
      {b?.found ? <p className="text-white/50">{String(b.found)}</p> : null}
      {b?.seen ? <p className="text-white/85"><span className="text-white/50">what her records show: </span>{String(b.seen)}</p> : null}
      {b?.words ? <p className="text-white/85"><span className="text-white/50">your words: </span>{String(b.words)}</p> : null}
      {b?.state ? <p style={{ color: b?.done === true ? "#3ddc84" : "#ffd479" }}><span className="text-white/50">where it stands: </span>{String(b.state)}</p> : null}
    </div>
  );
  return (
    <div className="mb-3 rounded-2xl px-2 py-2" style={{ border: "1px solid rgba(255,212,121,0.6)" }}>
      <p className="mb-1 font-mono text-[10px] font-bold tracking-[0.2em] text-white">BUG BOX · {open.length} OPEN ○ · {done.length} DONE ✓</p>
      {q.isLoading ? <p className="font-mono text-[10px] text-white/60">reading…</p> : null}
      {d.err ? <p className="font-mono text-[10px]" style={{ color: "#ff6b6b" }}>{String(d.err)}</p> : null}
      {d.note ? <p className="mb-1 font-mono text-[9.5px] text-white/60">{String(d.note)}{d.at ? " · last written " + String(d.at) : ""}</p> : null}
      <div className="max-h-[36rem] overflow-y-auto">
        {open.map(row)}
        {done.map(row)}
      </div>
    </div>
  );
}
