import type { ReactNode } from "react";
import { Drawer } from "vaul";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeskSettings } from "@/lib/desk/types";

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
            <Row label="Default exit" hint="Same trail as the header. 35 to 65.">
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                {settings.defaultExitPct}%
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={35}
                  max={65}
                  step={1}
                  value={Math.min(65, Math.max(35, settings.defaultExitPct))}
                  onChange={(e) => onChange({ defaultExitPct: Number(e.target.value) })}
                  className="w-24 accent-fg"
                />
              </label>
            </Row>
            <Row label="Position size" hint="Kalshi order. Half on a late gold near the band. A quarter on a 5×.">
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                ${(settings.liveStake ?? 20).toFixed(0)}
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={5}
                  max={100}
                  step={1}
                  value={Math.min(100, Math.max(5, settings.liveStake ?? 50))}
                  onChange={(e) => onChange({ liveStake: Number(e.target.value) })}
                  className="glass-range w-28 cursor-pointer"
                  style={{ touchAction: "none" }}
                  aria-label="Position size"
                />
              </label>
            </Row>
            <Row label="Paper size" hint="Session paper only.">
              <label className="flex items-center gap-2 font-mono text-sm tabular-nums">
                ${settings.stake.toFixed(0)}
                <input
                  type="range"
                  data-vaul-no-drag=""
                  min={1}
                  max={100}
                  step={1}
                  value={Math.min(100, settings.stake)}
                  onChange={(e) => onChange({ stake: Number(e.target.value) })}
                  className="w-24 accent-fg"
                />
              </label>
            </Row>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
