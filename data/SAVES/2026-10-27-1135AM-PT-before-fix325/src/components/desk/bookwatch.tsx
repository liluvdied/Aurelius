// ALERTS · BOOK WATCH (Claude, Oct 8 ~4 PM PT, Love: "a status report on each running book's performance over the last
// 4 - 12 - 24 - and all... i don't want one book to be making the losses and not know about it"). Live is her real Kalshi
// P&L per book; paper is the same book's paper trades at $30 each, so the two compare like for like.
import { useQuery } from "@tanstack/react-query";
import { getBookWatch } from "@/lib/desk/fns";

type Cell = { n: number; w: number; p: number };
const usd = (n: number) => `${n >= 0 ? "+" : "-"}$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const tone = (n: number) => (n > 0.5 ? "#3ddc84" : n < -0.5 ? "#ff5c5c" : "rgba(255,255,255,0.7)");

function Cells({ label, cells, windows }: { label: string; cells: Record<string, Cell>; windows: string[] }) {
  return (
    <div className="grid grid-cols-[64px_repeat(4,minmax(0,1fr))] items-baseline gap-1">
      <span className="text-[9px] tracking-[0.18em] text-white/60">{label}</span>
      {windows.map((w) => {
        const c = cells[w];
        return (
          <span key={w} className="font-mono text-[11px] tabular-nums" style={{ color: c && c.n ? tone(c.p) : "rgba(255,255,255,0.35)" }}>
            {c && c.n ? `${usd(c.p)}` : "—"}
            <span className="text-[9px] text-white/45">{c && c.n ? ` ${c.w}/${c.n}` : ""}</span>
          </span>
        );
      })}
    </div>
  );
}

export function useBookWatch() {
  return useQuery({ queryKey: ["book-watch"], queryFn: () => getBookWatch(), refetchInterval: 60000 });
}

export function BookWatchTab() {
  const q = useBookWatch();
  const d = q.data;
  if (!d) return <p className="px-3 py-4 font-mono text-[10px] text-white/50">loading the book watch…</p>;
  return (
    <section className="mx-3 mt-3 rounded-[14px] px-3 py-3" style={{ border: "1px solid rgba(255,255,255,0.18)", background: "#000" }}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] tracking-[0.28em] text-white/90">ALERTS · BOOK WATCH</p>
        <p className="font-mono text-[9px] text-white/55">
          KALSHI TODAY <span style={{ color: tone(d.today.live) }}>{usd(d.today.live)}</span>
        </p>
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {d.alerts.length ? (
          d.alerts.map((a) => (
            <p key={a.key} className="rounded-[8px] px-2 py-1.5 font-mono text-[10px] leading-snug" style={{ border: `1px solid ${a.level === "red" ? "rgba(255,92,92,0.7)" : "rgba(255,196,77,0.6)"}`, color: a.level === "red" ? "#ff8a8a" : "#ffd27a" }}>
              {a.level === "red" ? "● " : "○ "}
              {a.text}
            </p>
          ))
        ) : (
          <p className="rounded-[8px] px-2 py-1.5 font-mono text-[10px]" style={{ border: "1px solid rgba(61,220,132,0.5)", color: "#3ddc84" }}>
            ● All quiet: no book is carrying the losses right now.
          </p>
        )}
      </div>
      {d.combos ? <Combos c={d.combos} /> : null}
      <div className="mt-3 grid grid-cols-[64px_repeat(4,minmax(0,1fr))] gap-1 text-[9px] tracking-[0.18em] text-white/45">
        <span />
        {d.windows.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1 flex flex-col">
        {d.books.map((b) => (
          <div key={b.book} className="py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <p className="mb-1 flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-white/85">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: b.running ? "#3ddc84" : "rgba(255,255,255,0.3)", boxShadow: b.running ? "0 0 6px #3ddc84" : "none" }} />
              {b.name}
              <span className="text-white/40">{b.running ? "RUNNING" : "OFF KALSHI"}</span>
              <span className="ml-auto font-mono text-[10px] tracking-normal">
                {b.last.map((x, i) => (
                  <span key={i} style={{ color: x.pnl > 0.05 ? "#3ddc84" : "#ff5c5c" }}>
                    {x.pnl > 0.05 ? "▲" : "▼"}
                  </span>
                ))}
              </span>
            </p>
            {b.now ? (
              <p className="mb-1 font-mono text-[9px]" style={{ color: /^ON/.test(b.now) ? "#3ddc84" : /^OFF/.test(b.now) ? "#ff8a8a" : "#ffd27a" }}>
                NOW · {b.now}
              </p>
            ) : null}
            <Cells label="LIVE" cells={b.live} windows={d.windows} />
            <Cells label="PAPER $30" cells={b.paper} windows={d.windows} />
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <p className="mb-1 text-[9px] tracking-[0.28em] text-white/70">WHY THESE DIDN'T GO TO KALSHI · LAST 12H</p>
        {(d.skips ?? []).length ? (
          (d.skips ?? []).map((x, i) => (
            <p key={i} className="font-mono text-[10px] leading-snug text-white/70">
              <span className="text-white/45">{new Date(x.at).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })}</span> · {x.book} · {x.asset.toUpperCase()} {x.side === "up" ? "long" : x.side === "down" ? "short" : ""} · <span className="text-white/90">{x.reason}</span>
            </p>
          ))
        ) : (
          <p className="font-mono text-[10px] text-white/50">Nothing held back.</p>
        )}
      </div>
      <p className="mt-2 font-mono text-[9px] text-white/40">Red alerts also show on the desk's alarm bar. Live = real Kalshi fills (fees in). Paper = the same book at $30 a trade, before fees. ▲▼ = its last live trades.</p>
    </section>
  );
}

// Oct 9 ~8:50 PM PT (Love: "keep tabs on both combinations"): both gold hour maps side by side + BTC tight vs wide bands.
function Combos({ c }: { c: any }) {
  const days: string[] = (c.days || []).slice(-5);
  const lab = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const row = (label: string, x: any, hi?: boolean) => (
    <div key={label} className="grid grid-cols-[86px_repeat(6,minmax(0,1fr))] items-baseline gap-1">
      <span className="text-[9px] tracking-[0.14em]" style={{ color: hi ? "#3ddc84" : "rgba(255,255,255,0.65)" }}>{label}</span>
      {days.map((d) => {
        const v = x?.days?.[d];
        return (
          <span key={d} className="font-mono text-[10px] tabular-nums" style={{ color: v && v.n ? tone(v.p) : "rgba(255,255,255,0.3)" }}>
            {v && v.n ? usd(v.p) : "—"}
          </span>
        );
      })}
      <span className="font-mono text-[10px] tabular-nums" style={{ color: x?.week?.n ? tone(x.week.p) : "rgba(255,255,255,0.3)" }}>
        {x?.week?.n ? `${usd(x.week.p)} ${x.week.w}/${x.week.n}` : "—"}
      </span>
    </div>
  );
  return (
    <div className="mt-3 rounded-[10px] px-2 py-2" style={{ border: "1px solid rgba(255,255,255,0.14)" }}>
      <p className="text-[9px] tracking-[0.24em] text-white/80">COMBO WATCH · LIVE PRICING ($22, FEES IN)</p>
      <div className="mt-1 grid grid-cols-[86px_repeat(6,minmax(0,1fr))] gap-1 text-[8px] tracking-[0.14em] text-white/40">
        <span />
        {days.map((d) => (
          <span key={d}>{lab(d)}</span>
        ))}
        <span>7 DAYS</span>
      </div>
      {Object.entries(c.gold || {}).map(([name, x]) => row(`GOLD · ${name.toUpperCase()}${c.activeGold === name ? " ●" : ""}`, x, c.activeGold === name))}
      {c.probe ? row("REFINED · BTC LONGS", c.probe.refinedLongs) : null}
      {c.probe ? row("COTC · BTC", c.probe.cotcBtc) : null}
      {row("BTC · TIGHT σ", c.btc?.tight)}
      {row("BTC · WIDE σ", c.btc?.wide)}
      <p className="mt-1 font-mono text-[9px] leading-snug text-white/45">
        ● = the gold map live now. REFINED BTC LONGS + COTC BTC = on probation since Oct 9 (all their paper trades, so the trend shows). BTC rows = every RUN-book BTC paper trade, split by band width at entry (tight = session σ under $100, where the copier sits out).{c.sigmaNow ? ` σ now $${Math.round(c.sigmaNow)}.` : ""}
      </p>
    </div>
  );
}
