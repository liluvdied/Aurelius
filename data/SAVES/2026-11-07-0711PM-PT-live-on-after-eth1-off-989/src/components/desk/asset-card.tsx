import { BandMeter, Sparkline } from "@/components/desk/sparkline";
import { useFlipBook, useLiveCountdown } from "@/components/desk/rolling-price";
import { Button } from "@/components/ui/button";
import { bps, cents, countdown, multiple, signed, usd } from "@/lib/desk/format";
import { goldHalted } from "@/lib/desk/hours";
import type { Look } from "@/lib/desk/look";
import type { AltBoard } from "@/lib/desk/candles";
import { ASSET_META, type AssetSnapshot, type GrokCall } from "@/lib/desk/types";
import { cn } from "@/lib/cn";

export function AssetCard({
  snap,
  grok,
  grokBusy,
  grokError,
  already,
  stake,
  autoPaper,
  autoNote,
  look,
  onAsk,
  onPaper,
}: {
  snap: AssetSnapshot;
  grok?: GrokCall;
  grokBusy: boolean;
  grokError?: string;
  already: boolean;
  stake: number;
  autoPaper: boolean;
  autoNote?: string;
  look: Look;
  onAsk: () => void;
  onPaper: () => void;
}) {
  const halted = goldHalted(snap.asset);
  const meta = ASSET_META[snap.asset];
  const m = snap.market;
  const setup = snap.setup;
  const shown = useFlipBook(snap.spot, snap.asset === "gold" ? 0.05 : 1);
  const left = useLiveCountdown(m?.closeTime, snap.secondsLeft);
  const delta = snap.target != null && shown > 0 ? shown - snap.target : snap.delta;
  const deltaBps = delta != null && snap.target ? (delta / snap.target) * 10000 : snap.deltaBps;
  const deltaTone = delta == null ? "text-muted" : delta >= 0 ? "text-up" : "text-down";
  const upAsk = m && m.yesAsk > 0 ? m.yesAsk : null;
  const downAsk = m && m.noAsk > 0 ? m.noAsk : null;

  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-sm font-medium uppercase leading-none tracking-[0.12em] text-fg">{meta.label}</p>
          <p className="mt-1 text-[11px] tracking-[0.14em] text-subtle">{snap.product}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg tabular-nums text-fg">{countdown(left)}</p>
          <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] tracking-[0.16em] text-muted">
            {snap.live && !halted ? <span className="live-dot inline-block size-1.5 rounded-full" /> : null}
            {halted ? "CLOSED" : snap.live ? "LIVE" : snap.market ? "NEXT" : "NO BOOK"}
          </p>
        </div>
      </header>

      <div className="mt-5">
        <p className="font-sans text-[1.65rem] leading-none tabular-nums">
          {shown ? usd(shown, snap.asset === "gold" ? 2 : 2) : "—"}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm tabular-nums text-fg">
            target {snap.target != null ? `$${usd(snap.target, 2)}` : "—"}
          </span>
          <span className={cn("font-mono text-xs tabular-nums", deltaTone)}>{signed(delta ?? 0)}</span>
          <span className="font-mono text-xs tabular-nums text-subtle">{bps(deltaBps)}</span>
        </div>
      </div>

      <div className="mt-4 text-fg">
        <Sparkline
          spark={snap.spark}
          target={snap.target}
          live={shown || snap.spot}
          asset={snap.asset}
          look={look}
        />
        <BandMeter price={shown || snap.spot} frame={snap.vwap1m} />
      </div>

      <p className="mt-3 text-[11px] text-subtle">
        1m {snap.pattern1m.label} · 5m {snap.pattern5m.label}
      </p>

      {m ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] tracking-[0.16em] text-muted">UP</p>
            <p className="font-mono text-sm tabular-nums text-fg">{upAsk ? multiple(1 / upAsk) : "—"}</p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-subtle">{upAsk ? cents(upAsk) : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.16em] text-muted">DOWN</p>
            <p className="font-mono text-sm tabular-nums text-fg">{downAsk ? multiple(1 / downAsk) : "—"}</p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-subtle">{downAsk ? cents(downAsk) : "—"}</p>
          </div>
        </div>
      ) : null}

      {setup ? (
        <div className="mt-4 border-t border-line pt-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="font-sans text-xl uppercase leading-none tracking-[0.08em] text-fg">
                {setup.side}
                <span className="ml-3 font-mono text-xl tracking-normal">{multiple(setup.multiple)}</span>
              </p>
              <p className="mt-2 text-xs text-subtle">{setup.reasons[0]}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] tracking-[0.16em] text-muted">QUOTE</p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">{cents(setup.ask)}</p>
            </div>
          </div>
          {grok ? (
            <p className="mt-2 text-xs text-subtle">
              {grok.side === "pass"
                ? "Pass"
                : `${grok.side.toUpperCase()} · exit ${grok.exitProfitPct}%${grok.holdToExpiry ? " · hold to expiry" : ""}`}
              {grok.thesis ? ` — ${grok.thesis}` : ""}
            </p>
          ) : null}
          {grokError ? <p className="mt-2 text-xs text-warn">{grokError}</p> : null}
          {autoNote ? <p className="mt-2 text-xs text-subtle">{autoNote}</p> : null}
          <div className="mt-3 flex gap-2">
            <Button variant="ghost" size="sm" onClick={onAsk} disabled={grokBusy || !setup}>
              {grokBusy ? "Asking" : "Ask Grok"}
            </Button>
            {autoPaper ? null : (
              <Button size="sm" onClick={onPaper} disabled={already || setup.watchOnly}>
                {already ? "In" : `Paper $${stake.toFixed(0)}`}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-subtle">{halted ? "Gold book is closed." : "No setup on this window."}</p>
      )}
    </section>
  );
}

export function AltCard({ board, look }: { board: AltBoard; look: Look }) {
  const digits = board.name === "SOL" ? 2 : 2;
  const shown = useFlipBook(board.spot, board.name === "SOL" ? 0.01 : 0.1);
  const left = useLiveCountdown(undefined, board.secondsLeft);
  const delta = board.target != null && shown > 0 ? shown - board.target : null;
  const tone = delta == null ? "text-muted" : delta >= 0 ? "text-up" : "text-down";
  return (
    <section className="rounded-xl bg-surface p-4 hairline">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-sans text-sm font-medium uppercase leading-none tracking-[0.12em] text-fg">{board.name}</p>
          <p className="mt-1 text-[11px] tracking-[0.14em] text-subtle">{board.product}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg tabular-nums text-fg">{countdown(left)}</p>
          <p className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] tracking-[0.16em] text-muted">
            <span className="live-dot inline-block size-1.5 rounded-full" />
            LIVE
          </p>
        </div>
      </header>
      <div className="mt-5">
        <p className="font-sans text-[1.65rem] leading-none tabular-nums">{shown ? usd(shown, digits) : "—"}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-sm tabular-nums text-fg">target {board.target != null ? `$${usd(board.target, digits)}` : "—"}</span>
          <span className={cn("font-mono text-xs tabular-nums", tone)}>{delta == null ? "" : signed(delta)}</span>
        </div>
      </div>
      <div className="mt-4 text-fg">
        <Sparkline
          spark={board.spark}
          target={board.target}
          live={shown || board.spot}
          asset="gold"
          look={look}
          tapeId={board.name}
        />
        <BandMeter price={shown || board.spot} frame={board.frame} />
      </div>
      <p className="mt-3 text-[11px] text-subtle">{board.pattern}</p>
      {board.side ? (
        <div className="mt-4 border-t border-line pt-3">
          <p className="font-sans text-xl uppercase leading-none tracking-[0.08em] text-fg">{board.side}</p>
          <p className="mt-2 text-xs text-subtle">
            {board.note || "Watching. Nothing is in the way of this one."}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-subtle">No setup on this window.</p>
      )}
    </section>
  );
}
