import type { Look } from "@/lib/desk/look";

const ROWS: { key: keyof Look; label: string }[] = [
  { key: "smooth", label: "Smooth" },
  { key: "movement", label: "Movement" },
  { key: "speed", label: "Speed" },
  { key: "fluctuations", label: "Fluctuations" },
  { key: "sharpness", label: "Sharpness" },
];

export function LookPanel({
  look,
  onChange,
  onReset,
}: {
  look: Look;
  onChange: (patch: Partial<Look>) => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-xl bg-black p-4 hairline">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-xs font-medium uppercase tracking-[0.28em]">Look</p>
        <button
          type="button"
          onClick={onReset}
          className="text-[10px] tracking-[0.18em] text-white/60"
        >
          RESET
        </button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-5">
        {ROWS.map((row) => (
          <label key={row.key} className="block">
            <span className="flex items-baseline justify-between gap-2 text-[10px] uppercase tracking-[0.16em]">
              <span>{row.label}</span>
              <span className="font-mono tabular-nums text-white/70">{look[row.key]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={look[row.key]}
              aria-label={row.label}
              onChange={(e) => onChange({ [row.key]: Number(e.target.value) })}
              className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
            />
          </label>
        ))}
      </div>
      <p className="mt-3 text-[10px] tracking-[0.12em] text-white/40">Stays on this device.</p>
    </section>
  );
}
