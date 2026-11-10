import { create, type StateCreator } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { commitLedger, readLedger, unionIds, unionTrades, onePerSetup } from "./ledger";
import { goldHaltFill } from "./hours";
import { flipped, newId, sized, bugExit } from "./paper";
import {
  DEFAULT_SETTINGS,
  type DeskSettings,
  type GrokCall,
  type Setup,
  type Trade,
  type TradeSource,
} from "./types";

type DeskState = {
  settings: DeskSettings;
  trades: Trade[];
  grokBySetup: Record<string, GrokCall>;
  acted: string[];
  setSettings: (patch: Partial<DeskSettings>) => void;
  rememberGrok: (call: GrokCall) => void;
  openPaper: (
    setup: Setup,
    extra?: {
      grok?: GrokCall;
      source?: TradeSource;
      target?: number | null;
      lastSpot?: number | null;
      autoFilled?: boolean;
      stake?: number;
      probe?: boolean;
    },
  ) => Trade | null;
  patchTrade: (id: string, patch: Partial<Trade>) => void;
  closeTrade: (id: string, patch: Partial<Trade>) => void;
  adoptBook: (incoming: Trade[]) => void;
};

type PersistedDesk = Pick<DeskState, "settings" | "trades" | "grokBySetup" | "acted">;

let persistArmed = false;

function clientStorage(): PersistStorage<PersistedDesk> | undefined {
  if (typeof window === "undefined") return undefined;
  return {
    getItem: (name) => {
      try {
        const raw = localStorage.getItem(name);
        return raw ? (JSON.parse(raw) as StorageValue<PersistedDesk>) : null;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      if (!persistArmed) return;
      try {
        const prevRaw = localStorage.getItem(name);
        const prev = prevRaw ? (JSON.parse(prevRaw) as StorageValue<PersistedDesk>) : null;
        const trades = unionTrades(prev?.state?.trades ?? [], value.state?.trades ?? []);
        const next: StorageValue<PersistedDesk> = {
          ...value,
          state: { ...value.state, trades },
        };
        localStorage.setItem(name, JSON.stringify(next));
        commitLedger(trades);
      } catch {
        // ignore quota / private mode
      }
    },
    removeItem: (name) => {
      try {
        localStorage.removeItem(name);
      } catch {
        // ignore
      }
    },
  };
}

function boot(): Pick<PersistedDesk, "trades" | "acted"> {
  const trades = readLedger();
  return {
    trades,
    acted: unionIds(
      [],
      trades.map((t) => t.setupId),
    ),
  };
}

const seeded = boot();

const creator: StateCreator<DeskState> = (set, get) => ({
  settings: DEFAULT_SETTINGS,
  trades: seeded.trades,
  grokBySetup: {},
  acted: seeded.acted,
  setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  rememberGrok: (call) =>
    set((s) => ({ grokBySetup: { ...s.grokBySetup, [call.setupId]: call } })),
  openPaper: (setup, extra) => {
    const { settings, acted, trades } = get();
    if (acted.includes(setup.id) || trades.some((t) => t.setupId === setup.id)) return null;
    if (flipped(trades, setup.ticker, setup.side, setup.asset)) return null;
    if (
      !extra?.probe &&
      trades.some(
        (t) => t.result === "open" && !t.probe && t.ticker === setup.ticker && t.side === setup.side,
      )
    ) {
      return null;
    }
    const grok = extra?.grok;
    const stake = extra?.probe ? 1 : Math.max(1, extra?.stake ?? settings.stake);
    const contracts = stake / setup.ask;
    const trade: Trade = {
      id: newId(),
      openedAt: new Date().toISOString(),
      closedAt: null,
      asset: setup.asset,
      ticker: setup.ticker,
      side: setup.side,
      source: extra?.source ?? "paper",
      setupId: setup.id,
      autoFilled: extra?.autoFilled ?? false,
      probe: extra?.probe ?? false,
      patternLabel: setup.pattern.label,
      stake,
      ask: setup.ask,
      multiple: setup.multiple,
      contracts,
      result: "open",
      payout: null,
      profit: null,
      exitPct: setup.exitPct,
      holdToExpiry: false,
      conviction: grok?.conviction ?? setup.localConviction,
      notes: setup.reasons[0] ?? "",
      grokThesis: grok?.thesis ?? "",
      target: extra?.target ?? null,
      lastSpot: extra?.lastSpot ?? null,
    };
    const next = commitLedger([trade, ...trades]);
    set({
      trades: next,
      acted: unionIds(acted, [setup.id]),
    });
    return trade;
  },
  patchTrade: (id, patch) => {
    const next = commitLedger(get().trades.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    set({ trades: next });
  },
  closeTrade: (id, patch) => {
    const next = commitLedger(
      get().trades.map((t) =>
        t.id === id
          ? { ...t, ...patch, closedAt: patch.closedAt ?? new Date().toISOString() }
          : t,
      ),
    );
    set({ trades: next });
  },
  adoptBook: (incoming) => {
    const current = get().trades;
    const allowed = incoming.filter((t) => {
      if (current.some((c) => c.id === t.id)) return true;
      return !flipped(current, t.ticker, t.side, t.asset);
    });
    const next = onePerSetup(unionTrades(current, allowed));
    const same =
      next.length === current.length &&
      next.every((t, i) => {
        const prev = current[i];
        return prev && prev.id === t.id && prev.result === t.result && prev.profit === t.profit;
      });
    if (same) return;
    const saved = commitLedger(next);
    set({
      trades: saved,
      acted: unionIds(
        get().acted,
        saved.map((t) => t.setupId),
      ),
    });
  },
});

export const useDesk = create<DeskState>()(
  persist(creator, {
    name: "aurelius-desk-v1",
    version: 8,
    storage: clientStorage(),
    partialize: (s): PersistedDesk => ({
      settings: s.settings,
      trades: s.trades,
      grokBySetup: s.grokBySetup,
      acted: s.acted,
    }),
    migrate: (persisted, version): PersistedDesk => {
      const p = (persisted ?? {}) as Partial<PersistedDesk>;
      const saved = Array.isArray(p.trades) ? p.trades : [];
      const trades = unionTrades(
        readLedger(),
        saved.map((t) => ({
          ...t,
          setupId: t.setupId ?? "",
          autoFilled: t.autoFilled ?? false,
        })),
      );
      const settings = { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) };
      if (version < 3) settings.stake = 10;
      if (version < 4) settings.liveStake = 44;
      if (version < 5) {
        settings.liveStake = 50;
        if (settings.stake < 50) settings.stake = 50;
      }
      if (version < 6) settings.liveStake = 75;
      if (version < 7) settings.liveStake = 25;
      if (version < 8) settings.liveStake = 33;
      return {
        settings,
        trades,
        grokBySetup: p.grokBySetup ?? {},
        acted: unionIds(
          p.acted ?? [],
          trades.map((t) => t.setupId),
        ),
      };
    },
    merge: (persisted, current) => {
      const p = (persisted ?? {}) as Partial<PersistedDesk>;
      const incoming = Array.isArray(p.trades) ? p.trades : [];
      const trades = unionTrades(current.trades, incoming);
      return {
        ...current,
        ...p,
        trades,
        acted: unionIds(current.acted, p.acted ?? []),
        settings: { ...DEFAULT_SETTINGS, ...current.settings, ...(p.settings ?? {}) },
      };
    },
    onRehydrateStorage: () => () => {
      persistArmed = true;
      const state = useDesk.getState();
      const trades = commitLedger(state.trades);
      const acted = unionIds(
        state.acted,
        trades.map((t) => t.setupId),
      );
      useDesk.setState({ trades, acted });
    },
  }),
);

export function sessionStats(
  trades: Trade[],
  stake = 0,
): {
  pnl: number;
  wins: number;
  losses: number;
  open: number;
  hit: number;
} {
  let pnl = 0;
  let wins = 0;
  let losses = 0;
  let open = 0;
  for (const t of trades) {
    if (goldHaltFill(t) || bugExit(t)) continue;
    if (t.result === "open") {
      open += 1;
      continue;
    }
    const profit =
      t.probe || t.source === "live" || !(stake > 0)
        ? (t.profit ?? 0)
        : sized(t.profit ?? 0, t.stake, stake);
    pnl += profit;
    if (t.result === "win" || (t.result === "exited" && (t.profit ?? 0) >= 0)) wins += 1;
    else losses += 1;
  }
  const closed = wins + losses;
  return { pnl, wins, losses, open, hit: closed ? (wins / closed) * 100 : 0 };
}
