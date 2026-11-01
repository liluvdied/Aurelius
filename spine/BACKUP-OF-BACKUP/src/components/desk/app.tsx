import { Component, memo, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { useFlipBook, useLiveCountdown, useRollingNumber } from "@/components/desk/rolling-price";
import { AssetCard, AltCard } from "@/components/desk/asset-card";
import { CashBook, type CashVenue } from "@/components/desk/cash";
import { Audit } from "@/components/desk/audit";
import { FillLog } from "@/components/desk/fill-log";
import { Journal, Analytics, DayBook, Notes } from "@/components/desk/journal";
import { pointsFromFills, pointsFromPrime, TapeBook } from "@/components/desk/kalshi-tape";
import { HedgeBook } from "@/components/desk/hedge-book";
import { LookPanel } from "@/components/desk/look-panel";
import { Positions } from "@/components/desk/positions";
import { ScaleBook } from "@/components/desk/scale";
import { SitRep, explainExit, explainTake, whyTrade } from "@/components/desk/sitrep";
import { SettingsDrawer } from "@/components/desk/settings-drawer";
import { autoDecision } from "@/lib/desk/auto";
import { lateWindow } from "@/lib/desk/setup";
import { askDeskGrok, askDeskTalk, transcribeDesk, armLiveNow, askHelp, closeNow, exitLiveOrder, getAltBoards, getAudit, getDeskSnapshot, getExitLog, getFillLog, getHeldOrders, getKalshiCash, getLiveSize, getLiveSpots, getOutside, getPolyLedger, getPrimeBook, getTrail, getWatch, halfLiveOrder, halfNow, pullBook, pushBook, resizeLiveOrder, setEntries, setLiveSize, setPinSale, setTrailFloor, trimNow, type HeldOrder } from "@/lib/desk/fns";
import { exitForMultiple, firedBackwards, heldSide, markTrade, outcomeProfit, settleSide, shouldExit, sized, bugExit, smallExit, smallTicket, windowStillOpen } from "@/lib/desk/paper";
import { countdown, money, multiple, pct, usd } from "@/lib/desk/format";
import { goldHaltFill, goldHalted } from "@/lib/desk/hours";
import { farBandProbe } from "@/lib/desk/probe";
import { sessionStats, useDesk } from "@/lib/desk/store";
import { LOOK_DEFAULT, loadLook, saveLook, type Look } from "@/lib/desk/look";
import { overlayDesk } from "@/lib/desk/ticker";
import type { AssetId, AssetSnapshot, DeskSnapshot, Setup } from "@/lib/desk/types";
import { cn } from "@/lib/cn";

function ping() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 764;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // ignore
  }
}

function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

function useForeground() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const sync = () => setOn(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return on;
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // iOS may deny unless the desk is installed / foregrounded
      }
    };

    void request();
    const onVis = () => {
      if (!cancelled && document.visibilityState === "visible") void request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release();
    };
  }, [active]);
}

function PnlFigure({ value, ready }: { value: number; ready: boolean }) {
  const shown = useRollingNumber(value);
  return (
    <p className={`mt-1 font-mono text-3xl tabular-nums leading-none ${shown >= 0 ? "text-up" : "text-down"}`}>
      {ready ? money(shown) : "—"}
    </p>
  );
}

const StillJournal = memo(Journal);

const salePins = new Map<string, number>();
const SALE_PCTS = [39, 45, 55, 65];

function savedSale(ticker: string): number | null {
  const held = salePins.get(ticker);
  if (held != null) return held;
  try {
    const n = Number(localStorage.getItem(`aurelius-sale-pct:${ticker}`));
    if (!Number.isFinite(n) || n < 5) return null;
    salePins.set(ticker, n);
    return n;
  } catch {
    return null;
  }
}

function keepSale(ticker: string, n: number) {
  salePins.set(ticker, n);
  try {
    localStorage.setItem(`aurelius-sale-pct:${ticker}`, String(n));
  } catch {
    // the map still holds it for this session
  }
}

function patternBackwards(side: string, pattern: string): boolean {
  const above = /\+[0-9]/.test(pattern);
  if (side === "up" && (pattern.startsWith("Open -") || pattern.startsWith("Open −") || pattern.includes("through −") || pattern.includes("through -"))) return true;
  if (side === "down" && (above || pattern === "At VWAP")) return true;
  return false;
}

function LiveOrder({
  row,
  spot,
  mark,
  closeTime,
  secondsLeft,
  why,
  onRefresh,
}: {
  row: HeldOrder;
  spot: number;
  mark: number;
  closeTime?: string;
  secondsLeft: number;
  why: string;
  onRefresh: () => void;
}) {
  const step = row.name === "BTC" ? 1 : 0.01;
  const price = useFlipBook(spot, step);
  const strike = useFlipBook(row.target ?? 0, step);
  const left = useLiveCountdown(closeTime, secondsLeft);
  const max = row.contracts;
  const mult = row.cost > 0 ? max / row.cost : 0;
  const cash = mark > 0 ? mark : row.value > 0 ? row.value : 0;
  const halfCash = cash > 0 ? cash / 2 : 0;
  const cashRoll = useFlipBook(cash, cash >= 20 ? 1 : 0.1);
  const halfRoll = useFlipBook(halfCash, halfCash >= 20 ? 1 : 0.1);
  const livePct = row.cost > 0 ? ((cash - row.cost) / row.cost) * 100 : 0;
  const tone = livePct > 0.5 ? "text-up" : livePct < -0.5 ? "text-down" : "text-white";
  const ceiling = Math.max(max, cash, 1);
  const thumb = Math.min(ceiling, Math.max(0, cash));
  const remembered = savedSale(row.ticker);
  const [pin, setPin] = useState<number | null>(remembered);
  const [showWhy, setShowWhy] = useState(false);
  const arm = (pct: number) => {
    setPin(pct);
    keepSale(row.ticker, pct);
    const ask = Math.round(row.cost * (1 + pct / 100) * 100) / 100;
    void setPinSale({ data: { ticker: row.ticker, ask, pct } });
  };
  const pill =
    "inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-white bg-black px-2 font-sans text-[10px] leading-none tracking-[0.06em] text-white";
  const pctPill =
    "inline-flex h-5 min-w-11 shrink-0 items-center justify-center rounded-md border border-white bg-black px-2.5 font-sans text-[10px] leading-none tracking-[0.04em] text-white";
  return (
    <li className="mt-2 border-t-[0.5px] border-white pt-1 first:mt-0 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 font-sans text-[15px] tracking-wide text-white">
          {row.name}
          <span className="px-1.5 text-white/40">•</span>
          {row.side.toUpperCase()}
          <span className="px-1.5 text-white/40">•</span>
          <span className="tabular-nums">{countdown(left)}</span>
        </p>
        <p className="shrink-0 text-right font-sans text-[12px] tabular-nums leading-none text-white">
          MAX ${usd(max, 0)}
          <span className="px-2 text-white/40">•</span>
          {mult > 0 ? `${mult.toFixed(2)}x` : "—"}
        </p>
      </div>
      <p className="mt-1.5 text-right font-sans text-[22px] font-medium leading-none tabular-nums">
        <span className="text-white">{livePct > 0.5 ? "+" : livePct < -0.5 ? "−" : ""}</span>
        <span className={tone}>{Math.abs(Math.round(livePct))}%</span>
        <span className="mx-4 text-white/30">•</span>
        <span className="text-white">$</span>
        <span className={tone}>{cashRoll.toFixed(2)}</span>
      </p>
      <p className="mt-1 font-sans text-[22px] font-medium tabular-nums leading-none text-white">
        {price > 0 ? `$${usd(price, 2)}` : "—"}
      </p>
      <p className="mt-1 font-sans text-[11px] tabular-nums text-white/80">
        Target {row.target != null && strike > 0 ? `$${usd(strike, 2)}` : "—"}
      </p>
      <input
        type="range"
        min={0}
        max={ceiling}
        step={0.01}
        value={thumb}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden
        className="glass-range pointer-events-none mt-1.5 w-full"
      />
      <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center justify-start gap-2">
          <button
            type="button"
            className={pill}
            onClick={() => {
              void halfNow({ data: { ticker: row.ticker } }).then((res) => {
                toast(res ? `Half banked $${res.payout.toFixed(2)}.` : "Half didn't fill.");
                onRefresh();
              });
            }}
          >
            HALF{halfRoll > 0 ? ` $${halfRoll >= 20 ? halfRoll.toFixed(0) : halfRoll.toFixed(1)}` : ""}
          </button>
          <button
            type="button"
            className={pill}
            onClick={() => {
              void closeNow({ data: { ticker: row.ticker } }).then((res) => {
                toast(res.line);
                onRefresh();
              });
            }}
          >
            CLOSE{cashRoll > 0 ? ` $${cashRoll >= 20 ? cashRoll.toFixed(0) : cashRoll.toFixed(1)}` : ""}
          </button>
          <label className={pill}>
            SIZE
            <input
              inputMode="decimal"
              defaultValue={String(Math.max(1, Math.round(row.cost)))}
              onBlur={(e) => {
                const n = Math.max(1, Math.min(100, Math.round(Number(e.target.value) || row.cost)));
                e.target.value = String(n);
                if (n >= row.cost - 0.5) return;
                void trimNow({ data: { ticker: row.ticker, dollars: n } }).then((res) => {
                  toast(res ? `Size left at $${res.left.toFixed(0)}.` : "Size didn't change.");
                  onRefresh();
                });
              }}
              className="w-5 bg-transparent text-center font-sans text-[10px] text-white outline-none"
            />
          </label>
        </div>
        <span className="px-2 text-white/80">•</span>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => setShowWhy((on) => !on)} className={cn(pctPill, showWhy ? "bg-white/10" : "")}>
            WHY
          </button>
          {SALE_PCTS.map((pct) => (
            <button key={pct} type="button" onClick={() => arm(pct)} className={cn(pctPill, pin === pct ? "bg-white/10" : "")}>
              {pct}%
            </button>
          ))}
        </div>
      </div>
      {showWhy ? <p className="mt-1.5 text-[12px] leading-snug text-white/80">{why}</p> : null}
    </li>
  );
}

function DockOrder({ row, onClose }: { row: HeldOrder; onClose: () => void }) {
  const cash = row.value > 0 ? row.value : row.cost;
  const roll = useFlipBook(cash, cash >= 20 ? 1 : 0.1);
  const livePct = row.cost > 0 ? ((cash - row.cost) / row.cost) * 100 : 0;
  const tone = livePct > 0.5 ? "text-up" : livePct < -0.5 ? "text-down" : "text-white";
  return (
    <div className="flex items-center justify-between gap-3 border-t-[0.5px] border-white py-2 first:border-t-0">
      <div className="min-w-0">
        <p className="truncate text-sm text-white">
          {row.name} • {row.side.toUpperCase()}
        </p>
        <p className={cn("mt-1 font-sans text-[15px] tabular-nums leading-none", tone)}>
          <span className="text-white">{livePct > 0.5 ? "+" : livePct < -0.5 ? "−" : ""}</span>
          {Math.abs(Math.round(livePct))}%
          <span className="mx-2 text-white/40">•</span>
          <span className="text-white">$</span>
          {roll >= 20 ? roll.toFixed(0) : roll.toFixed(2)}
        </p>
      </div>
      <button type="button" className="desk-pill h-11 min-w-24 px-5" onClick={onClose}>
        CLOSE
      </button>
    </div>
  );
}

function DeskTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-[3px] border-[0.5px] border-[#4a1020] px-2.5 py-1 text-center text-[10px] leading-none tracking-[0.12em]",
        active ? "text-fg" : "text-muted",
      )}
    >
      {label}
    </button>
  );
}

class QuietChart extends Component<{ children: ReactNode }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() {
    return { bad: true };
  }
  render() {
    if (this.state.bad) return <p className="text-sm text-subtle">The chart is off so the book can stay open.</p>;
    return this.props.children;
  }
}

type LiveEar = {
  stop: () => void;
};

export function DeskApp() {
  const [bookTab, setBookTab] = useState<"paper" | "markets" | "kalshi" | "poly" | "cash" | "stats" | "scale" | "hedge" | "log" | "audit" | "look" | "outside" | "notes" | "pnl" | "day" | "alerts" | "sitrep" | "mic">("paper");
  const [span, setSpan] = useState<"12" | "24" | "all">("24");
  const [voiceOn, setVoiceOn] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [deskNote, setDeskNote] = useState("");
  const [voiceErr, setVoiceErr] = useState("");
  const [voiceDraft, setVoiceDraft] = useState("");
  const [lines, setLines] = useState<{ who: "you" | "ara"; text: string }[]>([]);
  const [voiceLive, setVoiceLive] = useState(false);
  const ear = useRef<LiveEar | null>(null);
  const voiceEl = useRef<HTMLAudioElement | null>(null);
  const talkBox = useRef<HTMLInputElement | null>(null);
  const callOn = useRef(false);
  const micStream = useRef<MediaStream | null>(null);
  const araTalking = useRef(false);
  const briefRef = useRef("");
  const [cashVenue, setCashVenue] = useState<CashVenue>("kalshi");
  const [look, setLook] = useState<Look>(LOOK_DEFAULT);
  const hydrated = useHydrated();
  useEffect(() => setLook(loadLook()), []);
  useEffect(() => {
    try {
      sessionStorage.removeItem("aurelius-stall-reload");
    } catch {
      // a private browser can skip this
    }
  }, []);
  const foreground = useForeground();
  const settings = useDesk((s) => s.settings);
  const setSettings = useDesk((s) => s.setSettings);
  const trades = useDesk((s) => s.trades);
  const grokBySetup = useDesk((s) => s.grokBySetup);
  const acted = useDesk((s) => s.acted);
  const rememberGrok = useDesk((s) => s.rememberGrok);
  const openPaper = useDesk((s) => s.openPaper);
  const patchTrade = useDesk((s) => s.patchTrade);
  const closeTrade = useDesk((s) => s.closeTrade);
  const adoptBook = useDesk((s) => s.adoptBook);

  useWakeLock(hydrated && settings.autoPaper && foreground);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const q = useQuery({
    queryKey: ["desk"],
    queryFn: () => getDeskSnapshot({ data: { settings: settingsRef.current } }),
    refetchInterval: foreground ? 7000 : 12000,
    refetchOnWindowFocus: false,
    staleTime: 3500,
    placeholderData: (prev) => prev,
  });

  const book = useQuery({
    queryKey: ["book"],
    queryFn: () => pullBook(),
    refetchInterval: 12000,
    refetchOnWindowFocus: false,
    staleTime: 4000,
  });

  useEffect(() => {
    if (!hydrated || !book.data) return;
    adoptBook(book.data);
  }, [book.data, hydrated, adoptBook]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      void pushBook({ data: { trades, settings } });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [trades, settings, hydrated]);

  const sizeTouched = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    void getLiveSize().then((row) => {
      if (sizeTouched.current || !(row.dollars >= 1)) return;
      setSettings({ liveStake: row.dollars });
    });
  }, [hydrated, setSettings]);

  const spots = useQuery({
    queryKey: ["spots"],
    queryFn: () => getLiveSpots(),
    refetchInterval: foreground ? 1500 : 4000,
    refetchOnWindowFocus: true,
    staleTime: 400,
  });
  const alts = useQuery({
    queryKey: ["alt-boards"],
    queryFn: () => getAltBoards(),
    enabled: hydrated && bookTab === "markets",
    refetchInterval: foreground ? 8000 : false,
  });
  const fillLog = useQuery({
    queryKey: ["fill-log"],
    queryFn: () => getFillLog(),
    enabled: hydrated,
    refetchInterval: foreground ? 8000 : false,
    refetchOnWindowFocus: true,
  });
  const exitLog = useQuery({
    queryKey: ["exit-log"],
    queryFn: () => getExitLog(),
    enabled: hydrated,
    refetchInterval: foreground ? 8000 : false,
    refetchOnWindowFocus: true,
  });
  const poly = useQuery({
    queryKey: ["poly-ledger"],
    queryFn: () => getPolyLedger(),
    enabled: hydrated,
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });
  const kalshiCash = useQuery({
    queryKey: ["kalshi-cash"],
    queryFn: () => getKalshiCash(),
    enabled: hydrated,
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });
  const prime = useQuery({
    queryKey: ["prime-book"],
    queryFn: () => getPrimeBook(),
    enabled: hydrated,
    refetchInterval: foreground ? 8000 : false,
    refetchOnWindowFocus: true,
  });
  const audit = useQuery({
    queryKey: ["audit"],
    queryFn: () => getAudit(),
    enabled: hydrated,
    refetchInterval: foreground ? 8000 : false,
    refetchOnWindowFocus: true,
  });
  const outside = useQuery({
    queryKey: ["outside"],
    queryFn: () => getOutside(),
    enabled: hydrated,
    refetchInterval: foreground ? 8000 : false,
    refetchOnWindowFocus: true,
  });
  const watch = useQuery({
    queryKey: ["watch"],
    queryFn: () => getWatch(),
    enabled: hydrated,
    refetchInterval: foreground ? 15000 : false,
    refetchOnWindowFocus: true,
  });
  const trailQ = useQuery({
    queryKey: ["trail"],
    queryFn: () => getTrail(),
    enabled: hydrated,
    refetchInterval: 20000,
    refetchOnWindowFocus: true,
  });
  const [trail, setTrail] = useState(45);
  const trailDrag = useRef(false);
  useEffect(() => {
    if (trailDrag.current) return;
    const n = trailQ.data?.pct;
    if (typeof n === "number" && Number.isFinite(n)) setTrail(n);
  }, [trailQ.data?.pct]);
  useEffect(() => {
    if (!hydrated || trailDrag.current) return;
    void setTrailFloor({ data: { pct: settings.defaultExitPct } });
  }, [settings.defaultExitPct, hydrated]);
  const held = useQuery({
    queryKey: ["held-orders"],
    queryFn: () => getHeldOrders(),
    enabled: hydrated,
    refetchInterval: foreground ? 4000 : false,
    refetchOnWindowFocus: true,
    placeholderData: (prev) => prev,
  });

  const snap: DeskSnapshot | undefined = useMemo(
    () => overlayDesk(q.data, spots.data),
    [q.data, spots.data],
  );
  const cashView = useMemo(() => {
    const events = fillLog.data ?? [];
    const gaps = (venue: "paper" | "kalshi") => {
      const flags: string[] = [];
      const rows = events
        .filter((e) => e.kind === "banked" && e.venue === venue)
        .map((e) => {
          const book = trades.find((t) => t.id === e.tradeId);
          let flag: string | undefined;
          if (book && book.profit != null && e.profit != null && Math.abs(book.profit - e.profit) > 0.5) {
            flag = `book ${money(book.profit)} vs log ${money(e.profit)}`;
          }
          if (flag) flags.push(`${e.asset.toUpperCase()} ${e.side.toUpperCase()} · ${flag}`);
          return {
            id: e.id,
            at: e.at,
            label: `${e.asset.toUpperCase()} ${e.side.toUpperCase()}`,
            profit: e.profit,
            flag,
          };
        })
        .sort((a, b) => b.at.localeCompare(a.at));
      return { rows, flags };
    };
    if (cashVenue === "paper") {
      const { rows, flags } = gaps("paper");
      const ordered = [...rows].sort((a, b) => a.at.localeCompare(b.at));
      let run = 0;
      const trail = ordered.map((row) => {
        run += row.profit ?? 0;
        return { t: row.at, cash: Math.round(run * 100) / 100 };
      });
      return { cash: trail.length ? run : 0, anchor: 0, trail, rows, flags };
    }
    if (cashVenue === "kalshi") {
      const { rows, flags } = gaps("kalshi");
      for (const row of audit.data ?? []) {
        if (row.desk == null || Math.abs(row.desk - row.kalshi) <= 0.5) continue;
        flags.push(`${row.asset.toUpperCase()} ${row.side.toUpperCase()} · desk ${money(row.desk)} vs Kalshi ${money(row.kalshi)}`);
      }
      const book = kalshiCash.data;
      return {
        cash: book?.cash ?? snap?.kalshi?.cash ?? null,
        anchor: book?.anchor ?? null,
        trail: book?.trail ?? [],
        rows,
        flags,
      };
    }
    const book = poly.data;
    const flags: string[] = [];
    const rows = (book?.rows ?? []).map((row) => {
      let flag: string | undefined;
      if (row.status === "off" || row.status === "missing") flag = row.note || row.status;
      else if (row.expected != null && row.accountNet != null && Math.abs(row.expected - row.accountNet) > 0.5) {
        flag = `book ${money(row.expected)} vs account ${money(row.accountNet)}`;
      }
      if (flag) flags.push(`${row.side.toUpperCase()} · ${flag}`);
      return { id: row.orderId || row.slug, at: row.at, label: `${row.side.toUpperCase()} ${row.status}`, profit: row.accountNet, flag };
    });
    return {
      cash: book?.cash ?? null,
      anchor: book?.anchor ?? null,
      trail: book?.trail ?? [],
      rows,
      flags,
    };
  }, [audit.data, cashVenue, fillLog.data, kalshiCash.data, poly.data, snap?.kalshi?.cash, trades]);
  const [grokBusy, setGrokBusy] = useState<Record<string, boolean>>({});
  const [grokError, setGrokError] = useState<Record<string, string>>({});
  const asking = useRef(new Set<string>());
  const heard = useRef(new Set<string>());
  const papered = useRef(new Set<string>());
  const told = useRef(new Set<string>());
  const toldReady = useRef(false);
  const exiting = useRef(new Set<string>());
  const exitWait = useRef(new Map<string, number>());
  const spotMemory = useRef<Record<string, number>>({});
  const lastSpot = useRef<Record<AssetId, number>>({ btc: 0, gold: 0 });

  useEffect(() => {
    if (!hydrated) return;
    if (!toldReady.current) {
      if (!trades.length) return;
      for (const t of trades) told.current.add(`${t.id}:${t.result}`);
      toldReady.current = true;
      return;
    }
    for (const t of trades) {
      if (t.venue !== "kalshi" && t.venue !== "polymarket") continue;
      if (t.source !== "live") continue;
      const key = `${t.id}:${t.result}`;
      if (told.current.has(key)) continue;
      const sawOpen = told.current.has(`${t.id}:open`);
      told.current.add(key);
      const name = t.asset === "gold" ? "Gold" : t.asset === "eth" ? "ETH" : t.asset === "sol" ? "SOL" : t.asset === "silver" ? "Silver" : "BTC";
      const where = t.venue === "polymarket" ? "Polymarket" : "Kalshi";
      if (t.result === "open") {
        toast(`${where} fill`, { description: `${name} ${t.side.toUpperCase()}` });
        continue;
      }
      if (!sawOpen || t.profit == null || t.profit === 0) continue;
      const closedAt = Date.parse(t.closedAt ?? "");
      if (!Number.isFinite(closedAt) || Date.now() - closedAt > 2 * 60 * 1000) continue;
      toast(t.profit > 0 ? `${where} banked` : `${where} loss`, {
        description: `${name} ${t.side.toUpperCase()} ${money(t.profit)}`,
      });
    }
  }, [trades, hydrated]);

  useEffect(() => {
    if (!snap) return;
    for (const id of ["btc", "gold"] as AssetId[]) {
      if (snap.assets[id].spot) lastSpot.current[id] = snap.assets[id].spot;
    }
  }, [snap]);

  useEffect(() => {
    if (!hydrated || !snap) return;
    for (const t of trades) {
      if (t.result !== "open") continue;
      if (goldHaltFill(t)) {
        closeTrade(t.id, {
          result: "exited",
          payout: t.stake,
          profit: 0,
          notes: "Gold book closed",
        });
        continue;
      }
      const asset = snap.assets[t.asset];
      if (asset.spot) spotMemory.current[t.id] = asset.spot;

      if (shouldExit(t, asset, settings.defaultExitPct) && !smallTicket(t)) {
        if (t.venue === "polymarket") continue;
        if (t.source === "live") {
          const wait = exitWait.current.get(t.id) ?? 0;
          if (Date.now() < wait || exiting.current.has(t.id)) continue;
          exitWait.current.set(t.id, Date.now() + 20000);
          exiting.current.add(t.id);
          const market = asset.market;
          void exitLiveOrder({
            data: { id: t.id, yesBid: market?.yesBid ?? 0, yesAsk: market?.yesAsk ?? 0, noBid: market?.noBid ?? 0 },
          })
            .then((closed) => {
              if (!closed) return;
              closeTrade(t.id, {
                result: "exited",
                payout: closed.payout,
                profit: closed.profit,
              });
              toast("Sold on Kalshi", { description: `${t.side.toUpperCase()} ${money(closed.profit ?? 0)}` });
            })
            .finally(() => exiting.current.delete(t.id));
          continue;
        }
        const mtm = markTrade(t, asset);
        closeTrade(t.id, {
          result: "exited",
          payout: mtm.value,
          profit: mtm.profit,
        });
        const won = mtm.profit >= 0;
        toast(won ? "Exited in profit" : "Exited at a loss", { description: `${t.side.toUpperCase()} ${money(mtm.profit)}` });
        continue;
      }

      const liveTicker = asset.market?.ticker;
      if (asset.secondsLeft > 0 || liveTicker !== t.ticker || windowStillOpen(t.ticker)) continue;

      const spot = spotMemory.current[t.id] ?? t.lastSpot ?? asset.spot ?? lastSpot.current[t.asset];
      const target = t.target ?? asset.target;
      if (target == null || !spot) {
        closeTrade(t.id, {
          result: "loss",
          payout: 0,
          profit: -t.stake,
          notes: "No settle print",
        });
        continue;
      }
      const win = settleSide(t.side, spot, target);
      const payout = win ? t.contracts * 1 : 0;
      closeTrade(t.id, {
        result: win ? "win" : "loss",
        payout,
        profit: payout - t.stake,
        lastSpot: spot,
      });
    }
  }, [snap, trades, hydrated, closeTrade, settings.defaultExitPct]);

  useEffect(() => {
    if (!hydrated) return;
    for (const t of trades) {
      if (t.result !== "open" || t.grokThesis || !t.setupId) continue;
      const call = grokBySetup[t.setupId];
      if (!call) continue;
      patchTrade(t.id, {
        grokThesis: call.thesis,
        conviction: call.side === "pass" ? t.conviction : call.conviction,
        exitPct: exitForMultiple(t.multiple, settings.defaultExitPct),
        holdToExpiry: false,
        notes: call.side === "pass" ? "Grok would have passed" : t.notes,
      });
    }
  }, [grokBySetup, trades, hydrated, patchTrade]);

  async function runGrok(setup: Setup, asset: AssetSnapshot) {
    if (asking.current.has(setup.id)) return;
    asking.current.add(setup.id);
    setGrokBusy((s) => ({ ...s, [setup.id]: true }));
    setGrokError((s) => ({ ...s, [setup.id]: "" }));
    try {
      const res = await askDeskGrok({ data: { setup, asset } });
      if (res.ok) {
        rememberGrok(res.call);
      } else {
        setGrokError((s) => ({ ...s, [setup.id]: res.error }));
      }
    } catch (err) {
      setGrokError((s) => ({
        ...s,
        [setup.id]: err instanceof Error ? err.message : "Grok failed",
      }));
    } finally {
      setGrokBusy((s) => ({ ...s, [setup.id]: false }));
      asking.current.delete(setup.id);
    }
  }

  function takePaper(
    setup: Setup,
    asset: AssetSnapshot,
    autoFilled = false,
    probe = false,
  ) {
    if (goldHalted(setup.asset)) return;
    if (papered.current.has(setup.id)) return;
    papered.current.add(setup.id);
    const grok = grokBySetup[setup.id];
    const trade = openPaper(setup, {
      grok,
      target: asset.target,
      lastSpot: asset.spot,
      autoFilled,
      probe,
      stake: setup.clip,
    });
    if (trade) {
      if (!probe && asset.market) {
        void armLiveNow({ data: { setup, asset } })
          .then(async (live) => {
            if (live) {
              adoptBook([live]);
              return;
            }
            const book = await pullBook();
            const hit = book.find(
              (t) =>
                t.source === "live" &&
                (t.setupId === `${setup.id}:live` ||
                  t.setupId === `${setup.id}:poly` ||
                  (t.ticker === setup.ticker && t.side === setup.side && t.venue !== "polymarket")),
            );
            if (hit) adoptBook([hit]);
          })
          .catch(() => {
            // the live book announces the fill
          });
      }
    } else {
      papered.current.delete(setup.id);
    }
  }

  useEffect(() => {
    if (!hydrated || !snap || !foreground) return;
    for (const id of ["btc", "gold"] as AssetId[]) {
      const asset = snap.assets[id];
      const setup = asset.setup;
      if (goldHalted(id)) continue;
      const lockedOut = (side: Setup["side"], ticker: string) => {
        const held = heldSide(useDesk.getState().trades, ticker, snap.sideLocks);
        return Boolean(held && held !== side);
      };
      const late = lateWindow(asset);
      const openWindow = useDesk
        .getState()
        .trades.some((t) => t.result === "open" && t.ticker === late?.ticker && !t.probe);
      if (
        late &&
        !openWindow &&
        !lockedOut(late.side, late.ticker) &&
        !acted.includes(late.id) &&
        !papered.current.has(late.id)
      ) {
        takePaper(late, asset, true);
      }
      if (!setup || lockedOut(setup.side, setup.ticker)) continue;

      if (settings.sound && !setup.watchOnly && !heard.current.has(setup.id)) {
        heard.current.add(setup.id);
        ping();
        toast("Setup", { description: `${setup.side.toUpperCase()} · ${setup.pattern.label}` });
      }

      if (settings.autoGrok && !setup.watchOnly && !grokBySetup[setup.id] && !asking.current.has(setup.id)) {
        void runGrok(setup, asset);
      }

      if (acted.includes(setup.id) || papered.current.has(setup.id)) {
        const probe = farBandProbe(setup);
        if (
          probe &&
          !acted.includes(probe.id) &&
          !papered.current.has(probe.id)
        ) {
          takePaper(probe, asset, true, true);
        }
        continue;
      }
      const verdict = autoDecision(setup, settings, grokBySetup[setup.id]);
      if (verdict.action === "fill") takePaper(setup, asset, true);
      const probe = farBandProbe(setup);
      if (probe && !acted.includes(probe.id) && !papered.current.has(probe.id)) {
        takePaper(probe, asset, true, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, settings.autoGrok, settings.autoPaper, settings.minConviction, settings.sound, grokBySetup, hydrated, acted, foreground]);

  const paperOut = useMemo(() => {
    const ms = span === "12" ? 12 * 3600e3 : span === "24" ? 24 * 3600e3 : 0;
    let pnl = 0;
    let hit = 0;
    let lost = 0;
    for (const trade of trades) {
      if (trade.source === "live" || trade.venue === "polymarket" || firedBackwards(trade) || bugExit(trade)) continue;
      if (ms) {
        const at = Date.parse(trade.closedAt ?? "");
        if (!Number.isFinite(at) || Date.now() - at > ms) continue;
      }
      const n = outcomeProfit(trade);
      if (n == null) continue;
      pnl += n;
      if (n >= 0) hit += 1;
      else lost += 1;
    }
    const closed = hit + lost;
    return { pnl: Math.round(pnl * 100) / 100, hit, lost, closed, rate: closed ? (hit / closed) * 100 : 0 };
  }, [trades, span]);
  const shown = useMemo(() => {
    if (bookTab === "poly") {
      const now = Date.now();
      const rows = (poly.data?.rows ?? []).filter((row) => row.deskStake >= 7);
      if (!rows.length) {
        return trades
          .filter((t) => t.venue === "polymarket" && t.stake >= 7)
          .map((t) => {
            const match = t.ticker.match(/(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})z$/);
            const end = match ? Date.parse(`${match[1]}T${match[2]}:${match[3]}:00Z`) + 15 * 60 * 1000 : NaN;
            if (!Number.isFinite(end) || now < end) return t;
            return { ...t, result: "exited" as const, profit: t.profit ?? 0, notes: t.notes || "Window ended." };
          });
      }
      return rows.map((row) => {
        const trade = trades.find((t) => t.ticker === row.slug && t.venue === "polymarket");
        const match = row.slug.match(/(\d{4}-\d{2}-\d{2})-(\d{2})(\d{2})z$/);
        const end = match ? Date.parse(`${match[1]}T${match[2]}:${match[3]}:00Z`) + 15 * 60 * 1000 : NaN;
        const stillOpen = row.status === "open" && (!Number.isFinite(end) || now < end);
        const won =
          row.downWon == null ? (row.expected ?? 0) > 0 : row.side === "down" ? row.downWon : !row.downWon;
        const waiting = !stillOpen && row.expected == null && row.downWon == null;
        return {
          id: trade?.id ?? row.slug,
          openedAt: trade?.openedAt ?? row.at,
          closedAt: stillOpen ? null : (trade?.closedAt ?? row.at),
          asset: "btc" as const,
          ticker: row.slug,
          side: row.side,
          source: "live" as const,
          setupId: trade?.setupId ?? row.slug,
          autoFilled: true,
          patternLabel: trade?.patternLabel ?? "Polymarket",
          stake: row.accountCost ?? row.deskStake,
          ask: row.deskAsk || trade?.ask || 0,
          multiple: row.deskAsk > 0 ? 1 / row.deskAsk : (trade?.multiple ?? 0),
          contracts: row.deskContracts,
          result: stillOpen ? ("open" as const) : waiting ? ("exited" as const) : won ? ("win" as const) : ("loss" as const),
          payout: null,
          profit: stillOpen ? null : (row.expected ?? 0),
          exitPct: null,
          holdToExpiry: true,
          conviction: trade?.conviction ?? 0,
          notes: waiting ? "Window ended. Waiting on the cash." : row.note,
          grokThesis: "",
          target: row.beat ?? trade?.target ?? null,
          lastSpot: trade?.lastSpot ?? null,
          venue: "polymarket" as const,
        };
      });
    }
    if (bookTab === "kalshi") return trades.filter((t) => t.source === "live" && t.venue !== "polymarket" && !bugExit(t));
    return trades.filter((t) => t.source !== "live" && !bugExit(t));
  }, [trades, bookTab, poly.data]);
  const runScore = useMemo(() => {
    const ms = span === "12" ? 12 * 3600e3 : span === "24" ? 24 * 3600e3 : 0;
    const inSpan = (at: string | undefined) => {
      if (!ms) return true;
      const t = Date.parse(at ?? "");
      return Number.isFinite(t) && Date.now() - t <= ms;
    };
    if (bookTab === "kalshi") {
      const grouped = new Map<string, { pnl: number; stake: number }>();
      for (const row of exitLog.data ?? []) {
        if (!inSpan(row.at)) continue;
        const key = row.ticker || row.at;
        const cur = grouped.get(key) ?? { pnl: 0, stake: 0 };
        cur.pnl += row.profit ?? 0;
        cur.stake += row.stake ?? 0;
        grouped.set(key, cur);
      }
      for (const row of fillLog.data ?? []) {
        if (row.kind !== "banked" || row.venue !== "kalshi" || row.profit == null || !inSpan(row.at)) continue;
        const key = row.ticker || row.id;
        if (grouped.has(key)) continue;
        grouped.set(key, { pnl: row.profit, stake: row.stake ?? 0 });
      }
      let hit = 0;
      let lost = 0;
      for (const row of grouped.values()) {
        if (row.stake > 0 && row.stake < 1) continue;
        if (row.pnl > 0.05) hit += 1;
        else if (row.pnl < -0.05) lost += 1;
      }
      return { hit, lost, closed: hit + lost };
    }
    const venue = bookTab === "poly" ? "polymarket" : "paper";
    const rows = (fillLog.data ?? []).filter((row) => {
      if (row.kind !== "banked" || row.venue !== venue || row.profit == null || smallExit(row.profit, row.stake)) return false;
      if (row.opposite || patternBackwards(row.side, row.pattern || "")) return false;
      return inSpan(row.at);
    });
    const latest = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = row.ticker || row.id;
      const prev = latest.get(key);
      if (!prev || row.at > prev.at) latest.set(key, row);
    }
    let hit = 0;
    let lost = 0;
    for (const row of latest.values()) {
      if ((row.profit ?? 0) > 0) hit += 1;
      else if ((row.profit ?? 0) < 0) lost += 1;
    }
    return { hit, lost, closed: latest.size };
  }, [bookTab, fillLog.data, exitLog.data, span]);
  const stats = useMemo(
    () => sessionStats(shown, bookTab === "kalshi" || bookTab === "poly" ? 0 : settings.stake),
    [shown, bookTab, settings.stake],
  );
  const stakeView = bookTab === "kalshi" || bookTab === "poly" ? 0 : settings.stake;
  const livePnl = useMemo(() => {
    if (bookTab === "poly" || bookTab === "cash") {
      const cash = poly.data?.cash;
      const anchor = poly.data?.anchor;
      if (cash != null && anchor != null) {
        let marks = 0;
        if (bookTab === "poly" && snap) {
          for (const t of shown) {
            if (t.result !== "open") continue;
            marks += markTrade(t, snap.assets[t.asset]).value;
          }
        }
        return Math.round((cash + marks - anchor) * 100) / 100;
      }
    }
    let pnl = stats.pnl;
    if (!snap) return pnl;
    for (const t of shown) {
      if (t.result !== "open" || goldHaltFill(t)) continue;
      const mark = markTrade(t, snap.assets[t.asset]);
      pnl +=
        t.probe || t.source === "live" || !(stakeView > 0)
          ? mark.profit
          : sized(mark.profit, t.stake, stakeView);
    }
    return pnl;
  }, [bookTab, poly.data, shown, snap, stats.pnl, stakeView]);

  function voiceContext() {
    const open = (held.data ?? [])
      .map((row) => `${row.name} ${row.side} is ${row.profit >= 0 ? "up" : "down"} $${Math.abs(row.profit).toFixed(2)}, ${Math.round(row.pct * 100)} percent, worth $${row.value.toFixed(2)}`)
      .join(". ");
    const exits = (exitLog.data ?? []).slice(0, 4).map((row) => explainExit(row)).join("\n");
    return [
      `Live size $${(settings.liveStake ?? 0).toFixed(0)}. Entries ${settings.autoPaper ? "on" : "paused"}.`,
      open || "No live order.",
      exits,
    ]
      .filter(Boolean)
      .join("\n");
  }
  briefRef.current = voiceContext();

  async function actOnVoice(raw: string): Promise<string> {
    const said = raw.toLowerCase();
    if (/\b(why|what happened|did it|don't|do not)\b/.test(said)) return "";
    const open = held.data ?? [];
    const named = /\bgold\b/.test(said) ? open.find((row) => row.name === "GOLD") : /\b(btc|bitcoin)\b/.test(said) ? open.find((row) => row.name === "BTC") : open.length === 1 ? open[0] : undefined;
    const size = said.match(/\b(?:size|stake|position)\s*(?:to|at)?\s*\$?\s*(\d{1,3})\b/);
    if (size) {
      const n = Number(size[1]);
      if (n >= 1 && n <= 200) {
        sizeTouched.current = true;
        setSettings({ liveStake: n });
        void setLiveSize({ data: { dollars: n } });
        return `Position size is $${n}.`;
      }
    }
    if (/\b(pause|stop entries|entries off)\b/.test(said)) {
      setSettings({ autoPaper: false });
      return "Entries are paused.";
    }
    if (/\b(resume|entries on|turn it back on)\b/.test(said)) {
      setSettings({ autoPaper: true });
      return "Entries are back on.";
    }
    const wantsHalf = /\bhalf\b/.test(said);
    const wantsClose = /\b(close|cash out|cash it|sell|flatten|bank)\b/.test(said);
    if ((wantsHalf || wantsClose) && !named) return open.length > 1 ? "Say gold or bitcoin. I will not touch both." : "Nothing is open.";
    if (!named) return "";
    if (wantsHalf) {
      const res = await halfNow({ data: { ticker: named.ticker } });
      void held.refetch();
      return res ? `Half of ${named.name} banked at $${res.payout.toFixed(2)}.` : `Half of ${named.name} did not fill.`;
    }
    if (wantsClose) {
      const res = await closeNow({ data: { ticker: named.ticker } });
      void held.refetch();
      return res.line;
    }
    return "";
  }

  function playAra(audio: string | null) {
    if (!audio) {
      araTalking.current = false;
      if (callOn.current) window.setTimeout(() => hearTurn(), 300);
      return;
    }
    const player = voiceEl.current ?? new Audio();
    voiceEl.current = player;
    player.onended = () => {
      araTalking.current = false;
      if (callOn.current) window.setTimeout(() => hearTurn(), 300);
    };
    player.src = `data:audio/mp3;base64,${audio}`;
    void player.play().catch(() => {
      araTalking.current = false;
      if (callOn.current) hearTurn();
    });
  }

  async function askVoice(question: string, context: string) {
    const said = question.trim();
    if (!said) return;
    setLines((prev) => [...prev, { who: "you", text: said }].slice(-16));
    setVoiceBusy(true);
    setVoiceOn(false);
    setVoiceErr("");
    const acted = await actOnVoice(said);
    if (acted) toast(acted);
    const res = await askDeskTalk({ data: { question: acted ? `${said}\n\nJust did: ${acted}` : said, context } });
    setVoiceBusy(false);
    if (!res.ok) {
      setVoiceErr(res.error);
      araTalking.current = false;
      if (callOn.current) window.setTimeout(() => hearTurn(), 400);
      return;
    }
    setLines((prev) => [...prev, { who: "ara", text: res.text }].slice(-16));
    setVoiceText(res.text);
    araTalking.current = true;
    playAra(res.audio);
  }

  function sendTurn(blob: Blob) {
    araTalking.current = true;
    setVoiceOn(false);
    setVoiceBusy(true);
    setVoiceText("One second.");
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const audio = raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw;
      void transcribeDesk({ data: { audio, mime: blob.type || "audio/webm" } }).then((res) => {
        if (!callOn.current) return;
        if (!res.ok) {
          setVoiceBusy(false);
          araTalking.current = false;
          setVoiceErr(res.error);
          window.setTimeout(() => hearTurn(), 400);
          return;
        }
        void askVoice(res.text, briefRef.current);
      });
    };
    reader.readAsDataURL(blob);
  }

  function hearTurn() {
    const stream = micStream.current;
    if (!callOn.current || !stream || araTalking.current) return;
    if (typeof MediaRecorder === "undefined") {
      setVoiceErr("This browser has no recorder. Type it and she still answers.");
      return;
    }
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    const audioCtx = new AudioContext();
    void audioCtx.resume();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let spoke = false;
    let quiet = 0;
    const started = Date.now();
    const tick = window.setInterval(() => {
      if (!callOn.current) {
        window.clearInterval(tick);
        void audioCtx.close();
        if (rec.state === "recording") rec.stop();
        return;
      }
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) sum += Math.abs(data[i] - 128);
      if (sum / data.length > 3) {
        spoke = true;
        quiet = 0;
      } else if (spoke) quiet += 100;
      if ((spoke && quiet > 700) || Date.now() - started > 14000) {
        window.clearInterval(tick);
        void audioCtx.close();
        if (rec.state === "recording") rec.stop();
      }
    }, 100);
    ear.current = {
      stop: () => {
        window.clearInterval(tick);
        void audioCtx.close();
        if (rec.state === "recording") rec.stop();
      },
    };
    rec.onstop = () => {
      ear.current = null;
      const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
      if (!callOn.current || araTalking.current) return;
      if (!spoke || blob.size < 1200) {
        window.setTimeout(() => hearTurn(), 200);
        return;
      }
      sendTurn(blob);
    };
    setVoiceErr("");
    setVoiceOn(true);
    setVoiceText("Listening.");
    rec.start();
  }

  function hangUp() {
    callOn.current = false;
    araTalking.current = false;
    setVoiceLive(false);
    setVoiceOn(false);
    try {
      ear.current?.stop();
    } catch {
      // already stopped
    }
    ear.current = null;
    micStream.current?.getTracks().forEach((track) => track.stop());
    micStream.current = null;
    if (voiceEl.current) {
      voiceEl.current.onended = null;
      voiceEl.current.pause();
    }
  }

  function tapAra() {
    const player = voiceEl.current ?? new Audio();
    voiceEl.current = player;
    player.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    void player.play().catch(() => undefined);
    setBookTab("mic");
    if (callOn.current) {
      hangUp();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceErr("This browser has no microphone. Type it and she still answers.");
      return;
    }
    callOn.current = true;
    setVoiceLive(true);
    setVoiceErr("");
    setVoiceOn(false);
    setVoiceText("Allow the microphone, then talk.");
    void navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((stream) => {
        if (!callOn.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        micStream.current = stream;
        hearTurn();
      })
      .catch((err: unknown) => {
        callOn.current = false;
        setVoiceLive(false);
        setVoiceOn(false);
        const name = err instanceof DOMException ? err.name : "";
        let framed = false;
        try {
          framed = window.top !== window.self;
        } catch {
          framed = true;
        }
        if (framed && (name === "NotAllowedError" || name === "SecurityError")) {
          const opened = window.open(window.location.href, "_blank", "noopener");
          setVoiceErr(opened ? "Ara is open in a new window. Click ARA there and choose Allow." : "Click ARA again and choose Allow.");
          return;
        }
        setVoiceErr("Click ARA again and choose Allow.");
      });
  }

  const paused = hydrated && settings.autoPaper && !foreground;

  return (
    <div className="h-dvh overflow-x-hidden overflow-y-auto overscroll-y-contain bg-bg text-fg [-webkit-overflow-scrolling:touch]">
      <Toaster
        theme="dark"
        position="top-right"
        closeButton
        expand={false}
        visibleToasts={3}
        gap={14}
        offset={{ top: 12, right: 12 }}
        duration={8000}
        toastOptions={{
          style: {
            background: "#000000",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.28)",
          },
        }}
      />
      <header className="sticky top-0 z-30 border-b border-line bg-bg pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2">
          <p className="shrink-0 font-display text-xs font-medium uppercase leading-none tracking-[0.22em]">Aurelius</p>
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => {
                void askHelp()
                  .then((row) => {
                    toast(row.line || "Help called.", { duration: 12000 });
                  })
                  .catch(() => {
                    toast("Help didn't go through. Tap it again.");
                  });
              }}
              className={cn(
                "flex h-8 items-center rounded-md px-2 text-[10px] tracking-[0.16em] hairline-soft",
                watch.data?.ok === false ? "text-fg" : "text-muted",
              )}
              aria-label="Call for help"
            >
              HELP
            </button>
            <span
              className="flex h-8 items-center rounded-md px-2 hairline-soft"
              title={watch.data?.line ?? "Firewall on"}
              aria-label={watch.data?.ok === false ? "Firewall alarm" : "Firewall on"}
            >
              <span
                className={cn(
                  "inline-block size-2.5 rounded-full",
                  watch.data?.ok === false ? "firewall-bad" : "firewall-on",
                )}
              />
            </span>
            <button
              type="button"
              onClick={() => {
                const next = !(watch.data?.entries === true);
                void setEntries({ data: { on: next } }).then(() => {
                  toast(next ? "Entries on. $25." : "Entries off. Open trades can still cash.");
                  void watch.refetch();
                });
              }}
              className="flex h-8 items-center rounded-md px-2 text-[10px] tracking-[0.16em] hairline-soft"
              aria-pressed={watch.data?.entries === true}
              aria-label="Toggle new entries"
            >
              {watch.data?.entries === false ? "OFF" : "ON"}
            </button>
            {hydrated ? (
              <button
                type="button"
                onClick={() => setSettings({ autoPaper: !settings.autoPaper })}
                className="flex h-8 items-center gap-1.5 rounded-md px-2 hairline-soft"
                aria-pressed={settings.autoPaper}
                aria-label="Toggle auto paper"
              >
                <span
                  className={cn(
                    "inline-block size-1.5 rounded-full",
                    paused ? "bg-warn" : settings.autoPaper ? "bg-fg glow-live" : "bg-subtle",
                  )}
                />
                <span className="text-[10px] tracking-[0.14em] text-muted">
                  {paused ? "PAUSED" : settings.autoPaper ? "AUTO" : "MANUAL"}
                </span>
              </button>
            ) : null}
            {hydrated ? (
              <SettingsDrawer
                settings={settings}
                onChange={(patch) => {
                  setSettings(patch);
                  if (typeof patch.liveStake === "number") {
                    sizeTouched.current = true;
                    void setLiveSize({ data: { dollars: patch.liveStake } });
                  }
                }}
              />
            ) : null}
          </div>
        </div>
        <label className="mx-auto flex max-w-5xl items-center gap-2 px-3 pb-2">
          <span className="text-[10px] tracking-[0.16em] text-muted">TRAIL</span>
          <input
            type="range"
            min={35}
            max={65}
            step={1}
            value={trail}
            aria-label="Trailing autosell trigger"
            className="glass-range min-w-0 flex-1 cursor-pointer"
            onPointerDown={() => {
              trailDrag.current = true;
            }}
            onChange={(e) => setTrail(Number(e.target.value))}
            onPointerUp={(e) => {
              trailDrag.current = false;
              const n = Number((e.target as HTMLInputElement).value);
              setTrail(n);
              setSettings({ defaultExitPct: n });
            }}
          />
          <span className="w-9 text-right text-sm tabular-nums text-fg">{trail}%</span>
        </label>
        <label className="mx-auto flex max-w-5xl items-center gap-2 px-3 pb-2">
          <span className="text-[10px] tracking-[0.16em] text-muted">SIZE</span>
          <input
            type="range"
            min={5}
            max={100}
            step={1}
            value={Math.min(100, Math.max(5, Math.round(settings.liveStake || 50)))}
            aria-label="Position size"
            className="glass-range min-w-0 flex-1 cursor-pointer"
            style={{ touchAction: "pan-x" }}
            onChange={(e) => {
              const n = Number(e.target.value);
              sizeTouched.current = true;
              setSettings({ liveStake: n });
              void setLiveSize({ data: { dollars: n } });
            }}
          />
          <span className="w-10 text-right text-sm tabular-nums text-fg">${Math.round(settings.liveStake || 50)}</span>
        </label>
        <div className="flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden px-3 pb-2 [scrollbar-width:none] [touch-action:pan-x_pan-y] [&::-webkit-scrollbar]:hidden">
          <DeskTab active={bookTab === "mic"} label="ARA" onClick={() => setBookTab("mic")} />
          <DeskTab active={bookTab === "paper"} label="PAPER" onClick={() => setBookTab("paper")} />
          <DeskTab active={bookTab === "markets"} label="MARKETS" onClick={() => setBookTab("markets")} />
          <DeskTab active={bookTab === "kalshi"} label="KALSHI" onClick={() => setBookTab("kalshi")} />
          <DeskTab active={bookTab === "pnl"} label="P&L" onClick={() => setBookTab("pnl")} />
          <DeskTab active={bookTab === "day"} label="DAY" onClick={() => setBookTab("day")} />
          <DeskTab active={bookTab === "poly"} label="POLY" onClick={() => setBookTab("poly")} />
          <DeskTab active={bookTab === "cash"} label="CASH" onClick={() => setBookTab("cash")} />
          <DeskTab active={bookTab === "alerts"} label="ALERTS" onClick={() => setBookTab("alerts")} />
          <DeskTab active={bookTab === "hedge"} label="HEDGE" onClick={() => setBookTab("hedge")} />
          <DeskTab active={bookTab === "scale"} label="SCALE" onClick={() => setBookTab("scale")} />
          <DeskTab active={bookTab === "stats"} label="STATS" onClick={() => setBookTab("stats")} />
          <DeskTab active={bookTab === "log"} label="LOG" onClick={() => setBookTab("log")} />
          <DeskTab active={bookTab === "sitrep"} label="SITREP" onClick={() => setBookTab("sitrep")} />
          <DeskTab active={bookTab === "audit"} label="MATCH" onClick={() => setBookTab("audit")} />
          <DeskTab active={bookTab === "outside"} label="OUTSIDE" onClick={() => setBookTab("outside")} />
          <DeskTab active={bookTab === "look"} label="LOOK" onClick={() => setBookTab("look")} />
          <DeskTab active={bookTab === "notes"} label="NOTES" onClick={() => setBookTab("notes")} />
        </div>
      </header>

      <main className={cn("mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5", (held.data ?? []).length ? "pb-[46dvh]" : "pb-24")}>
        {paused ? (
          <p className="text-sm text-warn">
            This screen is asleep. The desk keeps filling, and the book stays put if the page goes black.
          </p>
        ) : null}

        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <div>
            {bookTab === "audit" ? (
              <>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-subtle">KALSHI VS DESK</p>
                <p className="mt-1 font-mono text-3xl tabular-nums leading-none text-fg">
                  {(audit.data ?? []).length ? (audit.data ?? []).length : "OK"}
                </p>
              </>
            ) : bookTab === "sitrep" ? (
              <>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-subtle">SITUATION REPORT</p>
                <p className="mt-1 font-mono text-3xl tabular-nums leading-none text-fg">{(exitLog.data ?? []).length}</p>
              </>
            ) : bookTab === "log" ? (
              <>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-subtle">OPPOSITE FILLS</p>
                <p className="mt-1 font-mono text-3xl tabular-nums leading-none text-fg">
                  {(fillLog.data ?? []).filter((e) => e.kind === "taken" && e.opposite).length}
                </p>
              </>
            ) : bookTab === "kalshi" ? (
              <>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-white">BALANCE</p>
                <p className="mt-1 font-mono text-3xl tabular-nums leading-none text-white">
                  {(kalshiCash.data?.cash ?? snap?.kalshi?.cash) != null ? `$${usd(Math.max(0, kalshiCash.data?.cash ?? snap?.kalshi?.cash ?? 0), 2)}` : "—"}
                </p>
              </>
            ) : bookTab === "markets" ? (
              <>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-subtle">MARKETS</p>
                <p className="mt-1 font-mono text-3xl tabular-nums leading-none text-fg">TAPE</p>
              </>
            ) : bookTab === "scale" || bookTab === "hedge" || bookTab === "pnl" || bookTab === "day" ? null : (
              <>
                <p className="mt-1 text-[10px] tracking-[0.18em] text-subtle">
                  {bookTab === "kalshi" ? `$${(settings.liveStake ?? 20).toFixed(0)} LIVE` : bookTab === "cash" ? "SINCE START" : bookTab === "poly" ? "LIVE P&L" : hydrated ? "OUTCOMES" : ""}
                </p>
                <PnlFigure value={bookTab === "paper" ? paperOut.pnl : livePnl} ready={hydrated} />
              </>
            )}
          </div>
          {bookTab === "audit" ? (
            <div className="text-right font-mono text-xs tabular-nums text-muted">
              <p>Kalshi wins a tie</p>
            </div>
          ) : bookTab === "log" ? (
            <div className="text-right font-mono text-xs tabular-nums text-muted">
              <p>{(fillLog.data ?? []).filter((e) => e.kind === "taken").length} taken</p>
              <p className="mt-1 text-subtle">
                {(fillLog.data ?? []).filter((e) => e.kind === "banked").length} banked
              </p>
            </div>
          ) : bookTab === "cash" ? (
            <div className="text-right font-mono text-xs tabular-nums text-muted">
              <p>{cashView.cash != null ? `$${usd(cashView.cash, 2)}` : "—"}</p>
              <p className="mt-1 text-subtle">{cashVenue} now</p>
            </div>
          ) : bookTab === "scale" || bookTab === "pnl" || bookTab === "markets" ? null : (
            <div className="text-right font-mono text-xs tabular-nums text-muted">
              {bookTab === "paper" ? (
                <>
                  <p>
                    <span className="text-up">{paperOut.hit} hit</span>
                    <span> / </span>
                    <span className="text-down">{paperOut.lost} lost</span>
                  </p>
                  <p className="mt-1 text-subtle">{paperOut.closed ? `${Math.round(paperOut.rate)}%` : ""}</p>
                </>
              ) : (
                <>
                  <p className="flex items-baseline justify-end gap-3">
                    <span className="text-up">{runScore.hit}W</span>
                    <span>/</span>
                    <span className="text-down">{runScore.lost}L</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white">{hydrated ? `${runScore.closed ? Math.round((runScore.hit / runScore.closed) * 100) : 0}%` : ""}</span>
                  </p>
                </>
              )}
              <div className="mt-2 flex justify-end gap-1">
                {(["12", "24", "all"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSpan(key)}
                    className={cn("desk-pill h-6 px-2", span === key ? "text-fg" : "text-muted")}
                  >
                    {key === "all" ? "ALL" : `${key}H`}
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </section>

        {bookTab === "stats" ? (
          <Analytics
            trades={trades.filter((t) => t.source !== "live")}
            prime={prime.data ?? []}
            events={fillLog.data ?? []}
          />
        ) : null}

        {bookTab === "cash" ? (
          <CashBook
            venue={cashVenue}
            onVenue={setCashVenue}
            cash={cashView.cash}
            anchor={cashView.anchor}
            trail={cashView.trail}
            rows={cashView.rows}
            flags={cashView.flags}
          />
        ) : null}

        {bookTab === "audit" ? <Audit rows={audit.data ?? []} /> : null}

        {bookTab === "outside" ? (
          <section className="flex flex-col gap-2">
            <p className="text-[10px] tracking-[0.18em] text-subtle">NO DESK ID</p>
            {(outside.data ?? []).length === 0 ? (
              <p className="text-sm text-muted">None in the last six hours.</p>
            ) : (
              (outside.data ?? []).map((row) => (
                <div key={`${row.at}-${row.ticker}-${row.action}-${row.yes}`} className="flex items-baseline justify-between gap-3 border-b border-white/10 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-fg">
                      {row.ticker} {row.action} {row.side}
                    </p>
                    <p className="font-mono text-[10px] text-subtle">
                      {row.at.slice(11, 19)} · {row.qty} @ {row.yes} · {row.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </section>
        ) : null}

        {bookTab === "log" ? <FillLog events={fillLog.data ?? []} /> : null}

        {bookTab === "mic" ? (
          <section className="rounded-md border-[0.5px] border-[#4a1020] px-4 py-6">
            <p className="text-center text-[10px] tracking-[0.22em] text-muted">ARA</p>
            <div className="ara-stage">
              <span className={cn("ara-ring", voiceLive && "on")} />
              <button
                type="button"
                onClick={tapAra}
                className={cn("ara-orb", voiceOn && "listen", voiceBusy && "talk")}
                aria-label={voiceLive ? "Hang up Ara" : "Talk to Ara"}
              />
            </div>
            <p className="text-center text-sm">
              {voiceOn ? "Listening." : voiceBusy ? "Talking." : voiceLive ? "On. Click the circle to hang up." : "Click the circle and talk."}
            </p>
            <div className="mx-auto mt-4 max-w-sm text-center text-sm text-subtle">
              {(held.data ?? []).length === 0 ? (
                <p>Nothing open. Size ${settings.liveStake.toFixed(0)}. Entries {settings.autoPaper ? "on" : "paused"}.</p>
              ) : (
                (held.data ?? []).map((row) => (
                  <p key={row.ticker}>
                    {row.name} · {row.side.toUpperCase()} · {row.profit >= 0 ? "+" : ""}${row.profit.toFixed(2)} · {Math.round(row.pct * 100)}%
                  </p>
                ))
              )}
            </div>
            <div className="mx-auto mt-5 flex max-h-48 max-w-md flex-col gap-2 overflow-y-auto">
              {lines.map((line, index) => (
                <p key={`${line.who}-${index}`} className={cn("text-sm", line.who === "ara" ? "text-fg" : "text-subtle")}>
                  {line.who === "ara" ? "Ara" : "You"} · {line.text}
                </p>
              ))}
            </div>
            {voiceErr ? <p className="mt-3 text-center text-sm text-warn">{voiceErr}</p> : null}
            <form
              className="mx-auto mt-4 flex max-w-md gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const said = voiceDraft.trim();
                if (!said || voiceBusy) return;
                setVoiceDraft("");
                void askVoice(said, voiceContext());
              }}
            >
              <input
                ref={talkBox}
                value={voiceDraft}
                onChange={(event) => setVoiceDraft(event.target.value)}
                placeholder="Or type it"
                enterKeyHint="send"
                className="h-11 min-w-0 flex-1 rounded-md bg-bg px-3 text-sm text-fg outline-none hairline-soft"
              />
              <button type="submit" disabled={voiceBusy} className="rounded-full border-[0.5px] border-[#4a1020] px-4 text-[10px] tracking-[0.16em]">
                SEND
              </button>
            </form>
          </section>
        ) : null}
        {bookTab === "sitrep" ? (
          <SitRep
            rows={exitLog.data ?? []}
            takes={(fillLog.data ?? []).filter((row) => row.kind === "taken" && row.venue === "kalshi").slice(-4).reverse()}
            answer={voiceText}
            note={deskNote}
            error={voiceErr}
            busy={voiceBusy}
            onAsk={() => {
              const last = (fillLog.data ?? []).filter((row) => row.kind === "taken" && row.venue === "kalshi").slice(-1)[0];
              const text = last
                ? explainTake(last)
                : (exitLog.data ?? [])[0]
                  ? explainExit((exitLog.data ?? [])[0])
                  : "Nothing to explain yet.";
              setDeskNote(text);
              void askVoice("Why did the desk take that?", text);
            }}
            onDig={(row) => {
              const text = explainExit(row);
              setDeskNote(text);
              void askVoice("What happened?", text);
            }}
            onTake={(row) => {
              const text = explainTake(row);
              setDeskNote(text);
              void askVoice("Why did the desk take that?", text);
            }}
          />
        ) : null}

        {bookTab === "kalshi" ? (
          <div className="flex flex-col gap-3">
          <section className={cn("rounded-md border border-[#6b1524]", (held.data ?? []).length === 0 ? "px-4 py-4" : "px-3 pt-1.5 pb-1.5")}>
            <p className="pb-1 text-[10px] leading-none tracking-[0.18em] text-muted">LIVE ORDERS</p>
            {(held.data ?? []).length === 0 ? (
              <p className="mt-1 text-sm text-subtle">No open 15-minute order.</p>
            ) : (
              <ul className="flex flex-col">
                {(held.data ?? []).map((row) => {
                  const book =
                    row.name === "GOLD"
                      ? snap?.assets.gold
                      : row.name === "BTC"
                        ? snap?.assets.btc
                        : undefined;
                  const market = book?.market;
                  const bid = market && market.ticker === row.ticker ? (row.side === "up" ? market.yesBid : market.noBid) : 0;
                  const mark = bid > 0 ? Math.round(row.contracts * bid * 100) / 100 : row.value;
                  const taken = (fillLog.data ?? []).find(
                    (event) => event.ticker === row.ticker && event.kind === "taken" && event.pattern && event.pattern !== "Live",
                  );
                  return (
                  <LiveOrder
                    key={row.ticker}
                    row={row}
                    why={whyTrade({
                      name: row.name,
                      side: row.side,
                      pattern: taken?.pattern,
                      spot: taken?.spot ?? row.spot,
                      target: taken?.target ?? row.target,
                    })}
                    spot={
                      row.name === "ETH"
                        ? (spots.data?.eth ?? 0)
                        : row.name === "SOL"
                          ? (spots.data?.sol ?? 0)
                          : row.spot && row.spot > 0
                            ? row.spot
                            : (book?.spot ?? 0)
                    }
                    mark={mark}
                    closeTime={book?.market?.closeTime}
                    secondsLeft={book?.secondsLeft ?? 0}
                    onRefresh={() => {
                      void held.refetch();
                    }}
                  />
                  );
                })}
              </ul>
            )}
          </section>
            <QuietChart>
              <TapeBook title="TAKEN" points={pointsFromFills(fillLog.data ?? [])} cash={kalshiCash.data?.cash ?? snap?.kalshi?.cash ?? null} list={false} />
            </QuietChart>
            <QuietChart>
              <TapeBook title="PRIME BOOK" points={pointsFromPrime(prime.data ?? [], "kalshi")} list={false} />
            </QuietChart>
          </div>
        ) : null}

        {bookTab === "notes" || bookTab === "alerts" ? <Notes notices={watch.data?.notices ?? []} /> : null}

        {bookTab === "day" ? <DayBook trades={trades} /> : null}

        {bookTab === "pnl" ? (
          <div className="flex flex-col gap-4">
            <TapeBook
              title="TAKEN"
              points={pointsFromFills(fillLog.data ?? [])}
              cash={kalshiCash.data?.cash ?? snap?.kalshi?.cash ?? null}
            />
            <TapeBook title="PRIME BOOK" points={pointsFromPrime(prime.data ?? [], "kalshi")} />
          </div>
        ) : null}

        {bookTab === "scale" || bookTab === "hedge" || bookTab === "log" || bookTab === "audit" || bookTab === "outside" || bookTab === "cash" || bookTab === "stats" || bookTab === "notes" || bookTab === "pnl" || bookTab === "day" || bookTab === "alerts" || bookTab === "sitrep" || bookTab === "mic" || bookTab === "kalshi" || !hydrated || !snap ? null : (
          <Positions
            trades={shown}
            assets={snap.assets}
            stake={bookTab === "poly" || bookTab === "kalshi" ? 0 : settings.stake}
            asLive={bookTab === "kalshi"}
            onSellAt={(id, cash) => {
              const t = trades.find((x) => x.id === id);
              if (!t) return;
              const next = cash == null ? null : Math.round(cash * 100) / 100;
              for (const row of trades) {
                if (row.result !== "open" || row.ticker !== t.ticker || row.side !== t.side) continue;
                patchTrade(row.id, { exitCash: next });
              }
              toast(next == null ? "Auto sell restored" : `Holds until $${next.toFixed(2)}`);
            }}
            onSize={(id, dollars) => {
              const t = shown.find((x) => x.id === id);
              if (!t || t.venue === "polymarket") return;
              if (t.source !== "live") {
                setSettings({ stake: dollars });
                return;
              }
              const market = snap.assets[t.asset].market;
              void resizeLiveOrder({
                data: { id, dollars, yesBid: market?.yesBid ?? 0, yesAsk: market?.yesAsk ?? 0 },
              }).then((res) => {
                if (!res) {
                  toast("Kalshi didn't resize");
                  return;
                }
                patchTrade(id, { stake: res.trade.stake, contracts: res.trade.contracts });
                if (res.slice) adoptBook([res.slice]);
                toast("Size updated", { description: `$${res.trade.stake.toFixed(2)} on Kalshi` });
              });
            }}
            onHalf={(id) => {
              void halfLiveOrder({ data: { id } }).then((res) => {
                if (!res) {
                  toast("Half didn't fill. The position is still whole.");
                  return;
                }
                toast(`Half banked $${res.payout.toFixed(2)}. The rest is still running.`);
              });
            }}
            onExit={(id) => {
              const t = shown.find((x) => x.id === id);
              if (!t) return;
              if (bookTab === "kalshi" || t.source === "live") {
                void closeNow({ data: { ticker: t.ticker } }).then((row) => toast(row.line));
                return;
              }
              if (!t || t.venue === "polymarket" || !snap) return;
              const mtm = markTrade(t, snap.assets[t.asset]);
              closeTrade(id, {
                result: "exited",
                payout: mtm.value,
                profit: mtm.profit,
              });
            }}
          />
        )}

        {q.error ? (
          <p className="text-sm text-warn">
            Scanner: {q.error instanceof Error ? q.error.message : "scan failed"}
          </p>
        ) : null}
        {snap?.error ? <p className="text-sm text-warn">{snap.error}</p> : null}

        {bookTab === "look" ? (
          <LookPanel
            look={look}
            onChange={(patch) =>
              setLook((prev) => {
                const next = { ...prev, ...patch };
                saveLook(next);
                return next;
              })
            }
            onReset={() => {
              saveLook(LOOK_DEFAULT);
              setLook(LOOK_DEFAULT);
            }}
          />
        ) : null}

        {!q.data && q.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {["BTC", "GOLD"].map((name) => (
              <section key={name} className="min-h-80 rounded-xl bg-surface p-4 hairline">
                <p className="font-display text-3xl leading-none tracking-tight">{name}</p>
                <p className="mt-3 text-[10px] tracking-[0.22em] text-subtle">SCANNING TAPE</p>
              </section>
            ))}
          </div>
        ) : bookTab !== "markets" || !snap ? null : (
          <div className="grid gap-4 md:grid-cols-2">
            {(["btc", "gold"] as AssetId[]).map((id) => {
              const asset = snap.assets[id];
              if (!asset) return null;
              const setup = asset.setup;
              const grok = setup ? grokBySetup[setup.id] : undefined;
              const already = Boolean(setup && acted.includes(setup.id));
              const verdict = setup ? autoDecision(setup, settings, grok) : null;
              const filled = setup
                ? trades.find(
                    (t) =>
                      t.setupId === setup.id ||
                      (t.result === "open" && t.ticker === setup.ticker && t.side === setup.side),
                  )
                : undefined;
              const autoNote = already
                ? filled?.autoFilled
                  ? "Auto filled. Sitting until expiry or the exit hurdle."
                  : "Logged. Sitting until expiry or the exit hurdle."
                : verdict?.action === "skip"
                  ? verdict.reason
                  : verdict?.action === "fill"
                    ? "Armed. Auto fill on this scan."
                    : undefined;
              return (
                <AssetCard
                  key={id}
                  snap={asset}
                  grok={grok}
                  grokBusy={Boolean(setup && grokBusy[setup.id])}
                  grokError={setup ? grokError[setup.id] : undefined}
                  already={already}
                  stake={settings.stake}
                  autoPaper={settings.autoPaper}
                  autoNote={autoNote}
                  look={look}
                  onAsk={() => setup && void runGrok(setup, asset)}
                  onPaper={() => setup && takePaper(setup, asset, false)}
                />
              );
            })}
            {(alts.data ?? []).map((board) => (
              <AltCard key={board.name} board={board} look={look} />
            ))}
          </div>
        )}

        {bookTab === "scale" ? (
          <ScaleBook />
        ) : bookTab === "hedge" ? (
          <HedgeBook />
        ) : bookTab === "log" || bookTab === "audit" || bookTab === "outside" || bookTab === "cash" || bookTab === "stats" || bookTab === "look" || bookTab === "notes" || bookTab === "pnl" || bookTab === "alerts" || bookTab === "sitrep" || bookTab === "mic" || bookTab === "markets" ? null : hydrated ? (
          <StillJournal trades={shown} stake={bookTab === "kalshi" || bookTab === "poly" ? 0 : settings.stake} outcomes={bookTab === "paper"} exits={exitLog.data ?? []} mirrorExits={bookTab === "kalshi"} />
        ) : null}
      </main>
      {(held.data ?? []).length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[42dvh] overflow-y-auto overscroll-contain border-t-[0.5px] border-white bg-black px-3 pt-1 pb-[max(12px,env(safe-area-inset-bottom))]">
          {(held.data ?? []).map((row) => (
            <DockOrder
              key={row.ticker}
              row={row}
              onClose={() => {
                void closeNow({ data: { ticker: row.ticker } }).then((res) => {
                  toast(res.line);
                  void held.refetch();
                });
              }}
            />
          ))}
        </div>
      ) : null}
      <button
        type="button"
        onClick={tapAra}
        className={cn(
          "fixed right-4 z-30 flex size-14 items-center justify-center rounded-full border-[0.5px] bg-bg text-[9px] tracking-[0.12em] text-fg",
          voiceLive ? "border-white" : "border-[#4a1020]",
          (held.data ?? []).length ? "bottom-24" : "bottom-6",
        )}
        aria-label="Talk to Ara"
      >
        {voiceLive ? "ON" : "ARA"}
      </button>
    </div>
  );
}
