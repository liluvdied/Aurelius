// SCHEDULE PILL (Claude, Oct 10 ~1:15 AM PT, Love: "a lil schedule pill like the one that says INSURANCE... just under that
// one with the lineup & schedule for each one"). Tap to open: every book on RUN with its live hours (Pacific) on BTC and gold.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookHours, getSchedule, setBookHour } from "@/lib/desk/fns";

export function SchedulePill() {
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["schedule-pill"], queryFn: () => getSchedule(), refetchInterval: 60000 });
  const d: any = q.data;
  return (
    <div className="mt-2 w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-2xl border px-4 py-2 text-left text-[10px] tracking-[0.2em]"
        style={{ borderColor: open ? "#3ddc84" : "rgba(255,255,255,0.3)", color: open ? "#3ddc84" : "#ffffff", boxShadow: open ? "0 0 14px rgba(61,220,132,0.35)" : "none" }}
      >
        SCHEDULE · {d ? `${d.rows.length} BOOKS ON RUN · PACIFIC HOURS` : "loading"} · TAP
      </button>
      <HourTicks />
      {open && d ? (
        <div className="mt-2 rounded-2xl border px-4 py-3 font-mono text-[10px] leading-relaxed" style={{ borderColor: "rgba(61,220,132,0.45)" }}>
          {d.rows.map((r: any) => (
            <div key={r.book} className="py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="tracking-[0.18em] text-white/90">{r.name}</p>
              <p className="text-white/70">
                BTC <span className="text-white">{r.btc}</span> · GOLD <span className="text-white">{r.gold}</span>
              </p>
              {r.notes.length ? <p className="text-[9px] text-[#3ddc84]">{r.notes.join(" · ")}</p> : null}
            </div>
          ))}
          <p className="pt-2 text-[9px] text-white/50">
            Nobody live · BTC {d.dark.btc} · GOLD {d.dark.gold}
            {d.goldMap ? ` · gold map: ${String(d.goldMap).toUpperCase()}` : ""}. Gold is shut weekends and 2-3 PM daily.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// HOURS BY HAND (Oct 22 ~12:41 PM PT, Love: "a running schedule pill ... with tick boxes that can allow me to add or drop hours on there myself"):
// every Pacific hour, ticked MAIN 💞, DELAYED ⏳ or REJECTION 🎯 (fix184). A tap hands that hour to the book live; the hour now glows.
function HourTicks() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["book-hours"], queryFn: () => getBookHours(), refetchInterval: 30000 });
  const [busy, setBusy] = useState<number | null>(null);
  const d: any = q.data;
  if (!d) return null;
  const lbl = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "AM" : "PM"}`; // Love Oct 24 ~11:55 PM PT: "a clean 5:00 PM format for the times instead of 5a"
  const tap = (h: number, to: "main" | "twin" | "rej") => {
    setBusy(h);
    void setBookHour({ data: { hour: h, to } }).then(() => qc.invalidateQueries({ queryKey: ["book-hours"] })).finally(() => setBusy(null));
  };
  const nowRow = d.hours[d.now];
  return (
    <div className="mt-2 rounded-2xl border px-3 py-2" style={{ borderColor: "rgba(255,126,182,0.45)" }}>
      <p className="mb-1.5 text-[9px] tracking-[0.22em] text-white/80">
        HOURS · PACIFIC · NOW {lbl(d.now).toUpperCase()} = {nowRow.rej ? "REJECTION 🎯" : nowRow.main ? "MAIN 💞" : nowRow.twin ? "DELAYED ⏳" : "NOBODY"} · TAP A BOX TO HAND THE HOUR OVER
      </p>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-6">
        {d.hours.map((r: any) => (
          <div key={r.h} className="flex items-center justify-between rounded-lg px-1.5 py-1 font-mono text-[10px]" style={{ border: r.h === d.now ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.12)", opacity: busy === r.h ? 0.5 : 1 }}>
            <span className="text-white/85">{lbl(r.h)}</span>
            <span className="flex gap-1">
              <button type="button" aria-label={`${lbl(r.h)} main book`} disabled={busy !== null} onClick={() => !r.main && tap(r.h, "main")} className="h-4 w-5 rounded text-[9px] leading-4" style={{ border: "1px solid #ff7eb6", background: r.main ? "rgba(255,126,182,0.35)" : "transparent" }}>{r.main ? "💞" : ""}</button>
              <button type="button" aria-label={`${lbl(r.h)} delayed twin`} disabled={busy !== null} onClick={() => !r.twin && tap(r.h, "twin")} className="h-4 w-5 rounded text-[9px] leading-4" style={{ border: "1px solid #8ab4ff", background: r.twin ? "rgba(138,180,255,0.35)" : "transparent" }}>{r.twin ? "⏳" : ""}</button>
              <button type="button" aria-label={`${lbl(r.h)} rejection model`} disabled={busy !== null} onClick={() => !r.rej && tap(r.h, "rej")} className="h-4 w-5 rounded text-[9px] leading-4" style={{ border: "1px solid #ffb347", background: r.rej ? "rgba(255,179,71,0.35)" : "transparent" }}>{r.rej ? "🎯" : ""}</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
