import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeskSettings } from "@/lib/desk/types";
const PAPER_STOPS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-fg">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative h-7 w-11 rounded-full hairline-soft"
      style={{ background: on ? "var(--color-fg)" : "var(--color-elevated)" }}
    >
      <span
        className="absolute top-0.5 size-6 rounded-full transition-transform duration-150"
        style={{
          left: 2,
          transform: on ? "translateX(16px)" : "translateX(0)",
          background: on ? "var(--color-bg)" : "var(--color-muted)",
        }}
      />
    </button>
  );
}

export function SettingsDrawer({
  settings,
  onChange,
}: {
  settings: DeskSettings;
  onChange: (patch: Partial<DeskSettings>) => void;
}) {
  return (
    <Drawer.Root handleOnly>
      <Drawer.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Desk settings">
          <Settings2 className="size-5" strokeWidth={1.5} />
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-bg/70" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl bg-surface px-5 pb-8 pt-3 text-fg hairline">
          <Drawer.Handle className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
          <Drawer.Title className="font-display text-2xl tracking-tight">Desk</Drawer.Title>
          <p className="mt-1 text-sm text-muted">
            Paper fills only. Live Kalshi orders stay in your hands. Keep this screen open for
            auto paper to scan and settle.
          </p>
          <div className="mt-2 divide-y divide-line">
            <Row
              label="Auto paper"
              hint="Takes the trade when the scanner clears conviction. Logs $1 and scores the window."
            >
              <Toggle
                on={settings.autoPaper}
                onChange={(v) => onChange({ autoPaper: v })}
              />
            </Row>
            <Row label="Auto Grok" hint="One call per setup. Annotates the fill. Local scanner always runs.">
              <Toggle on={settings.autoGrok} onChange={(v) => onChange({ autoGrok: v })} />
            </Row>
            <Row label="Min multiple" hint="Skip richer-than-this odds unless premium">
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                {settings.minMultiple.toFixed(2)}×
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={1.2}
                  max={2}
                  step={0.02}
                  value={settings.minMultiple}
                  onChange={(e) => onChange({ minMultiple: Number(e.target.value) })}
                  className="w-24 accent-fg"
                />
              </label>
            </Row>
            <Row label="Min conviction" hint="Auto-paper threshold">
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                {settings.minConviction}
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={50}
                  max={85}
                  step={1}
                  value={settings.minConviction}
                  onChange={(e) => onChange({ minConviction: Number(e.target.value) })}
                  className="w-24 accent-fg"
                />
              </label>
            </Row>
            <Row label="Default exit" hint="35 to 200. Real exits use up to 65%. Every step past that is a what-if: SHIFT shows what each trade would have closed at, or that it would have ridden to the bell.">
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                {settings.defaultExitPct}%{settings.defaultExitPct > 65 ? " what-if" : ""}
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={35}
                  max={200}
                  step={1}
                  value={Math.min(200, Math.max(35, settings.defaultExitPct))}
                  onChange={(e) => onChange({ defaultExitPct: Number(e.target.value) })}
                  className="w-24 accent-fg"
                />
              </label>
            </Row>
            <Row label="Position size" hint="Kalshi order. Half on a late gold near the band. A quarter on a 5×.">
              {/* Oct 6 (Love: "the position sizing slider isnt functioning... hard to land a number"): a slider that lands on
                  whole $5 steps plus a box to type the exact dollars. What you set here is the live size AND the hard cap, BTC
                  and gold the same. */}
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                $
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  step={1}
                  key={`ls-${settings.liveStake ?? 20}`}
                  defaultValue={Math.round(settings.liveStake ?? 20)}
                  onBlur={(e) => {
                    const n = Math.max(1, Math.min(100, Math.round(Number(e.currentTarget.value) || 0)));
                    if (n >= 1 && n !== settings.liveStake) onChange({ liveStake: n });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                  }}
                  className="w-14 rounded-[4px] border border-white/30 bg-black px-1 py-0.5 text-right"
                  aria-label="Position size dollars"
                />
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={5}
                  max={100}
                  step={5}
                  value={Math.min(100, Math.max(5, Math.round((settings.liveStake ?? 20) / 5) * 5))}
                  onChange={(e) => onChange({ liveStake: Number(e.target.value) })}
                  className="glass-range w-28 cursor-pointer"
                  style={{ touchAction: "none" }}
                  aria-label="Position size"
                />
              </label>
            </Row>
            <Row label="Paper size" hint="Every paper position and every paper ledger on SHIFT is shown at this size. Paper only, never Kalshi.">
              {/* Oct 6 (Love: "the slider is really hard to land a number on for the paper slider"): it ran $5-$1000 in $5 steps
                  (199 stops on a short track). Now it snaps to 18 clean sizes, plus a box to type any amount. */}
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                $
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000}
                  step={1}
                  key={`ps-${settings.stake}`}
                  defaultValue={Math.round(settings.stake)}
                  onBlur={(e) => {
                    const n = Math.max(1, Math.min(1000, Math.round(Number(e.currentTarget.value) || 0)));
                    if (n >= 1 && n !== settings.stake) onChange({ stake: n });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                  }}
                  className="w-16 rounded-[4px] border border-white/30 bg-black px-1 py-0.5 text-right"
                  aria-label="Paper size dollars"
                />
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={0}
                  max={PAPER_STOPS.length - 1}
                  step={1}
                  value={PAPER_STOPS.reduce((bi, v, i) => (Math.abs(v - settings.stake) < Math.abs(PAPER_STOPS[bi] - settings.stake) ? i : bi), 0)}
                  onChange={(e) => onChange({ stake: PAPER_STOPS[Number(e.target.value)] ?? 50 })}
                  className="glass-range w-36 cursor-pointer"
                  style={{ touchAction: "none" }}
                  aria-label="Paper size"
                />
              </label>
            </Row>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
