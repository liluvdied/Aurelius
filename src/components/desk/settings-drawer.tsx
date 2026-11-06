import type { ReactNode } from "react";
import { Drawer } from "vaul"; // fix808 (Love Nov 6 2026 ~7:45 AM PT: "every time i pull up the settings tab with the add on toggles the lil handle tab to pull the page down goes too far up and disappears out of frame so i can't exit the page"): the sheet is capped at her screen height, its handle + a close X stay pinned, the rows scroll inside
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeskSettings } from "@/lib/desk/types";
import { useEffect, useState } from "react"; // fix664
import { getAddonSettings, setAddonSettings } from "@/lib/desk/fns"; // fix664
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
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100dvh-env(safe-area-inset-top)-12px)] flex-col rounded-t-xl bg-surface pt-3 text-fg hairline" /* fix808: never taller than her screen - the handle and close stay in view */>
          <div className="relative shrink-0 px-5" /* fix808: handle + close X, always visible */>
            <Drawer.Handle className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
            <Drawer.Close asChild>
              <button type="button" aria-label="Close settings" className="absolute right-4 -top-1 rounded-full px-2 py-1 text-xl leading-none text-muted">×</button>
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]" data-vaul-no-drag="" /* fix808: the rows scroll inside */>
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
            <AddOnRows664 />
            <AddOn3Row754 />
          </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
// fix664 HER ADD-ON BOXES (Love Nov 4 2026 7:17 PM PT: "a box for Add on 1 & a box for add on 2 with an on/off toggle for them both so i don't need to bug you with them").
// Add-on 1 = her first add-on (2.8x); Add-on 2 = the 3.8x add-on (it only comes after Add-on 1 has filled). $1-$5 each (her $5 add-on cap). Saved on the desk, read live by the engine.
function AddOnRows664() {
  const [s, setS] = useState<{ addOn1: { on: boolean; dollars: number }; addOn2: { on: boolean; dollars: number } } | null>(null);
  useEffect(() => { void getAddonSettings().then((v) => setS(v)).catch(() => {}); }, []);
  if (!s) return null;
  const save = (n: typeof s) => { setS(n); void setAddonSettings({ data: n }).catch(() => {}); };
  const rows: [keyof typeof s, string, string][] = [["addOn1", "Add-on 1", "First add-on (at 2.8x). $1-$5."], ["addOn2", "Add-on 2", "Type the multiple (1.5x-10x) and the $ ($1-$5). After Add-on 1 has filled."]];
  return (
    <>
      {rows.map(([k, label, hint]) => (
        <Row key={k} label={label} hint={hint}>
          <span className="flex items-center gap-2 font-mono text-sm tabular-nums">
            {k === "addOn2" ? ( /* fix803: her Add-on 2 multiple box (was a fixed 3.8x) */
              <>
                <input type="number" inputMode="decimal" min={1.5} max={10} step={0.1} key={`m2-${(s as any).addOn2.mult ?? 3.8}`} defaultValue={(s as any).addOn2.mult ?? 3.8}
                  onBlur={(e) => { const m = Math.max(1.5, Math.min(10, Math.round((Number(e.currentTarget.value) || 0) * 10) / 10)); if (m >= 1.5 && m !== ((s as any).addOn2.mult ?? 3.8)) save({ ...s, addOn2: { ...s.addOn2, mult: m } as any }); }}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
                  className="w-14 rounded-[4px] border border-white/30 bg-black px-1 py-0.5 text-right" aria-label="Add-on 2 multiple" />
                x ·
              </>
            ) : null}
            $
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={5}
              step={1}
              key={`${k}-${s[k].dollars}`}
              defaultValue={Math.round(s[k].dollars)}
              onBlur={(e) => { const n = Math.max(1, Math.min(5, Math.round(Number(e.currentTarget.value) || 0))); if (n >= 1 && n !== s[k].dollars) save({ ...s, [k]: { ...s[k], dollars: n } }); }}
              onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
              className="w-12 rounded-[4px] border border-white/30 bg-black px-1 py-0.5 text-right"
              aria-label={`${label} dollars`}
            />
            <Toggle on={s[k].on} onChange={(v) => save({ ...s, [k]: { ...s[k], on: v } })} />
          </span>
        </Row>
      ))}
    </>
  );
}

// fix754 ADD-ON 3, HER CUSTOM ONE (Love Nov 5 2026 1:48 PM PT: "can you add in a third custom box there? that lets me type the multiple and then put in the dollar amount ?"): she types the
// multiple (1.5x-10x) and the dollars ($1-$5) and turns it on/off. Once per position, when the price reaches her multiple. Saved with her other add-on boxes; read live by the engine.
function AddOn3Row754() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { void getAddonSettings().then((v: any) => setS(v)).catch(() => {}); }, []);
  if (!s) return null;
  const a3 = s.addOn3 || { on: false, dollars: 1, mult: 3 };
  const save = (n: any) => { const all = { ...s, addOn3: { ...a3, ...n } }; setS(all); void setAddonSettings({ data: all }).catch(() => {}); };
  return (
    <Row label="Add-on 3" hint="Your custom add-on: type the multiple (1.5x-10x) and the $ ($1-$5). Once per position, when the price reaches your multiple.">
      <span className="flex items-center gap-2 font-mono text-sm tabular-nums">
        <input type="number" inputMode="decimal" min={1.5} max={10} step={0.1} key={`m-${a3.mult}`} defaultValue={a3.mult}
          onBlur={(e) => { const m = Math.max(1.5, Math.min(10, Math.round((Number(e.currentTarget.value) || 0) * 10) / 10)); if (m >= 1.5 && m !== a3.mult) save({ mult: m }); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
          className="w-14 rounded-[4px] border border-white/30 bg-black px-1 py-0.5 text-right" aria-label="Add-on 3 multiple" />
        x · $
        <input type="number" inputMode="numeric" min={1} max={5} step={1} key={`d-${a3.dollars}`} defaultValue={Math.round(a3.dollars)}
          onBlur={(e) => { const n = Math.max(1, Math.min(5, Math.round(Number(e.currentTarget.value) || 0))); if (n >= 1 && n !== a3.dollars) save({ dollars: n }); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
          className="w-12 rounded-[4px] border border-white/30 bg-black px-1 py-0.5 text-right" aria-label="Add-on 3 dollars" />
        <Toggle on={a3.on === true} onChange={(v) => save({ on: v })} />
      </span>
    </Row>
  );
}
