import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(process.cwd(), "data", "watch-watch.json");
const RED = join(process.cwd(), "data", "red-alert.json");
const GATE = join(process.cwd(), "data", "firewall-check.json");
const CASH = join(process.cwd(), "data", "kalshi-cash.json");
const NOTICES = join(process.cwd(), "data", "notices.json");
const HELP = join(process.cwd(), "data", "help.json");

const DARK_MS = 90_000;
const HOLE_MS = 45_000;
const RECENT_MS = 10 * 60_000;

export type Notice = {
  id: string;
  at: string;
  kind: "problem" | "fixed";
  text: string;
};

export type WatchStatus = {
  at: string;
  ok: boolean;
  dark: boolean;
  entries: boolean;
  line: string;
  flags: string[];
  monitorAt: string | null;
  notices: Notice[];
};

type GateRow = { at?: string; ticker?: string; stage?: string; reason?: string };
type RedFile = {
  at?: string;
  alerts?: string[];
  open?: { ticker?: string }[];
};
type CashFile = { trail?: { t?: string }[] };

function readJson<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function age(iso: string | null | undefined): number {
  if (!iso) return Infinity;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Date.now() - t : Infinity;
}

function minutes(ms: number): string {
  const m = Math.max(1, Math.round(ms / 60000));
  return `${m}m`;
}

function clean(flag: string): string {
  return flag.replace(/^RED:\s*/, "");
}

function whenOf(text: string, fallback: string): string {
  const clock = text.match(/at (\d{2}:\d{2}:\d{2})/);
  if (!clock) return fallback;
  const iso = `${fallback.slice(0, 10)}T${clock[1]}Z`;
  return Number.isFinite(Date.parse(iso)) ? iso : fallback;
}

function readNotices(): Notice[] {
  const rows = readJson<Notice[]>(NOTICES);
  return Array.isArray(rows) ? rows : [];
}

function recordNotices(flags: string[], at: string): Notice[] {
  const notices = readNotices();
  const next = [...notices];
  const before = new Set((readJson<WatchStatus>(FILE)?.flags ?? []).map(clean));
  const now = new Set(flags.map(clean));
  const add = (kind: Notice["kind"], text: string, stamp: string) => {
    const last = next.find((row) => row.text === text);
    if (last?.kind === kind) return;
    next.unshift({ id: `${stamp}:${kind}:${text}`, at: stamp, kind, text });
  };
  if (notices.length === 0) {
    for (const flag of flags) add("problem", clean(flag), whenOf(flag, at));
  } else {
    for (const flag of now) {
      if (!before.has(flag)) add("problem", flag, at);
    }
    for (const flag of before) {
      if (!now.has(flag)) add("fixed", flag, at);
    }
  }
  const saved = next.slice(0, 80);
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(NOTICES, JSON.stringify(saved));
  } catch {
    // the tab keeps the last list
  }
  return saved;
}

function userMustAct(flag: string): boolean {
  return /not enough cash|add cash|insufficient|log in|sign in|verification/i.test(flag);
}

function symbolOf(ticker: string): string {
  if (ticker.includes("BTC")) return "btc";
  if (ticker.includes("GOLD")) return "gold";
  return ticker;
}

function gateHole(rows: GateRow[]): string | null {
  const recent = rows.filter((row) => row.ticker && age(row.at) < RECENT_MS);
  const latest = new Map<string, GateRow>();
  for (const row of recent) {
    const prev = latest.get(row.ticker!);
    if (!prev || (row.at ?? "") > (prev.at ?? "")) latest.set(row.ticker!, row);
  }
  for (const row of latest.values()) {
    if (row.stage === "before" && row.reason === "clear" && age(row.at) > HOLE_MS) {
      const answered = rows.some(
        (other) => other.ticker === row.ticker && other.stage === "after" && (other.at ?? "") >= (row.at ?? ""),
      );
      if (!answered) return `${row.ticker} cleared the gate and never reported back.`;
    }
  }
  return null;
}

const BETWEEN = join(process.cwd(), "data", "vwap-between.json");
const OFF_LIST = join(process.cwd(), "data", "off-list.json");

export function flagOffList(ticker: string, text: string): void {
  const rows = readJson<{ at: string; ticker: string; text: string }[]>(OFF_LIST) ?? [];
  if (rows.some((row) => row.text === text)) return;
  rows.unshift({ at: new Date().toISOString(), ticker, text });
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(OFF_LIST, JSON.stringify(rows.slice(0, 40)));
  } catch {
    // a missed flag must not open the trade
  }
}

export function offListFlags(): string[] {
  const rows = readJson<{ at?: string; text?: string }[]>(OFF_LIST) ?? [];
  return rows
    .filter((row) => row.text && age(row.at) < 6 * 60 * 60_000)
    .map((row) => row.text as string);
}

export function flagBetween(ticker: string, text: string): void {
  const rows = readJson<{ at: string; ticker: string; text: string }[]>(BETWEEN) ?? [];
  if (rows.some((row) => row.ticker === ticker)) return;
  rows.unshift({ at: new Date().toISOString(), ticker, text });
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(BETWEEN, JSON.stringify(rows.slice(0, 40)));
  } catch {
    // a missed alarm must not block the fill
  }
}

export function betweenFlags(): string[] {
  const rows = readJson<{ at?: string; text?: string }[]>(BETWEEN) ?? [];
  return rows
    .filter((row) => row.text && age(row.at) < 30 * 60_000)
    .map((row) => row.text as string);
}

function kalshiNet(ticker?: string): number | null {
  if (!ticker) return null;
  const map = readJson<Record<string, number>>(join(process.cwd(), "data", "kalshi-nets.json"));
  const net = map?.[ticker];
  return typeof net === "number" ? net : null;
}

export function countedProfit(row: { ticker?: string; profit?: number | null }): number {
  const desk = row.profit ?? 0;
  if (desk > 0) return desk;
  const net = kalshiNet(row.ticker);
  if (net == null) return desk;
  if ((desk > 0) !== (net > 0) && Math.abs(desk - net) > 1) return net;
  return desk;
}

function lossStreak(): number {
  const since = readJson<{ since?: string }>(join(process.cwd(), "data", "halt.json"))?.since ?? "";
  const rows = readJson<{ kind?: string; venue?: string; at?: string; ticker?: string; profit?: number | null }[]>(
    join(process.cwd(), "data", "fill-log.json"),
  );
  if (!Array.isArray(rows)) return 0;
  const settled = rows
    .filter((row) => row.kind === "banked" && row.venue === "kalshi" && row.profit != null && row.at && row.at > since)
    .sort((a, b) => (a.at! < b.at! ? 1 : -1));
  let streak = 0;
  for (const row of settled) {
    if (countedProfit(row) < 0) streak += 1;
    else break;
  }
  return streak;
}

export function writeHelp(line: string, flags: string[]): { at: string; line: string; flags: string[] } {
  const row = { at: new Date().toISOString(), line, flags, open: true };
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(HELP, JSON.stringify(row));
  } catch {
    // the toast still shows the alarm
  }
  return row;
}

function pushNotice(text: string): void {
  const notices = readNotices();
  const at = new Date().toISOString();
  notices.unshift({ id: `${at}:problem:${text}`, at, kind: "problem", text });
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(NOTICES, JSON.stringify(notices.slice(0, 80)));
  } catch {
    // the toast still shows the line
  }
}

function clearStuckGate(ticker: string): void {
  if (!ticker || ticker === "That") return;
  const rows = readJson<GateRow[]>(GATE) ?? [];
  const latest = rows.find((row) => row.ticker === ticker);
  if (latest?.stage === "after") return;
  rows.unshift({ at: new Date().toISOString(), ticker, stage: "after", reason: "help" });
  try {
    writeFileSync(GATE, JSON.stringify(rows.slice(0, 80)));
  } catch {
    // the next pass will report it
  }
}

export function askForHelp(openNames: string[]): { at: string; line: string; flags: string[] } {
  const watch = readWatch();
  const flag = watch.flags[0] ?? "";
  const open = openNames.length
    ? `${openNames.join(" and ")} ${openNames.length > 1 ? "are" : "is"} open. I left ${openNames.length > 1 ? "them" : "it"}.`
    : "Nothing is open.";
  let line: string;
  if (/never reported back/i.test(flag)) {
    clearStuckGate(flag.split(" ")[0] ?? "");
    line = `Help called. That order was sent and never came back. The alarm is cleared. ${open} Close is the other button.`;
  } else if (/filled and Kalshi did not/i.test(flag)) {
    line = `Help called. It filled on the paper book and not on Kalshi. ${open} Close is the other button.`;
  } else if (/VWAP/i.test(flag)) {
    line = `Help called. A trade was on the wrong side of the VWAP. ${open}`;
  } else if (/monitor stopped/i.test(flag)) {
    line = `Help called. The monitor had stopped. It is running again. ${open}`;
  } else if (flag) {
    line = `Help called. ${flag.replace(/^RED:\s*/, "")} ${open} Close is the other button.`;
  } else {
    line = `Help called. The watch is clear. ${open} Close is the other button.`;
  }
  pushNotice(line);
  return writeHelp(line, flag ? [flag] : ["help"]);
}

export function readWatch(): WatchStatus {
  const red = readJson<RedFile>(RED);
  const gates = readJson<GateRow[]>(GATE) ?? [];
  const cash = readJson<CashFile>(CASH);
  const monitorAt = red?.at ?? null;
  const cashAt = cash?.trail?.[cash.trail.length - 1]?.t ?? null;
  const pulse = Math.min(age(monitorAt), age(cashAt));
  const flags: string[] = [];
  const dark = pulse > DARK_MS;

  if (dark) {
    flags.push(
      pulse === Infinity
        ? "The monitor has never reported."
        : `The monitor stopped. Last check was ${minutes(pulse)} ago.`,
    );
  }

  const alerts = Array.isArray(red?.alerts) ? red.alerts.filter((line) => line.startsWith("RED:")) : [];
  if (!dark) flags.push(...alerts);

  const open = Array.isArray(red?.open) ? red.open : [];
  const counts = new Map<string, number>();
  for (const row of open) {
    if (!row.ticker) continue;
    const sym = symbolOf(row.ticker);
    counts.set(sym, (counts.get(sym) ?? 0) + 1);
  }
  for (const [sym, n] of counts) {
    if (n > 1) flags.push(`RED: ${n} ${sym} positions are open at once.`);
  }

  const hole = gateHole(Array.isArray(gates) ? gates : []);
  if (hole) flags.push(hole);
  flags.push(...betweenFlags());
  flags.push(...offListFlags());
  try {
    const alarm = readJson<{ at?: string; text?: string }[]>(join(process.cwd(), "data", "alarm.json")) ?? [];
    for (const row of alarm) {
      if (row.text && age(row.at) < 30 * 60_000) flags.push(row.text);
    }
  } catch {
    flags.push("RED: The alarm file could not be read.");
  }
  try {
    const heal = readJson<{ at?: string; text?: string }>(join(process.cwd(), "data", "server-heal.json"));
    if (heal?.text && age(heal.at) < 30 * 60_000) flags.push(heal.text);
  } catch {
    // no server note yet
  }
  try {
    const page = readJson<{ at?: string; text?: string; fix?: boolean }>(join(process.cwd(), "data", "page.json"));
    if (page?.fix && page.text && age(page.at) < 30 * 60_000) flags.push(page.text);
  } catch {
    flags.push("RED: The page file could not be read.");
  }
  const streak = lossStreak();
  if (streak === 2) flags.push("2 Kalshi losses in a row. Entries stay on.");
  if (streak >= 3) flags.push(`CHECK: ${streak} Kalshi losses in a row. Entries stay on. Look at the side, not the count.`);
  try {
    const halt = readJson<{ off?: boolean; reason?: string }>(join(process.cwd(), "data", "halt.json"));
    if (halt?.off) flags.push(`RED: Halted. ${halt.reason ?? "New trades are off."}`);
  } catch {
    // no halt file yet
  }
  try {
    const cashBook = readJson<{ cash?: number; peak?: number; trail?: { cash?: number }[] }>(join(process.cwd(), "data", "kalshi-cash.json"));
    const points = (cashBook?.trail ?? []).map((point) => point.cash).filter((n): n is number => typeof n === "number");
    const peak = cashBook?.peak ?? (points.length ? Math.max(...points) : null);
    if (cashBook?.cash != null && peak != null) {
      const drop = peak - cashBook.cash;
      if (drop >= 100) flags.push(`RED: Kalshi cash is down $${Math.round(drop)} from its high.`);
    }
  } catch {
    // the cash trail will flag on the next pass
  }

  const unique = [...new Set(flags)];
  const loud = unique.filter(userMustAct);
  const ok = loud.length === 0;
  const notices = recordNotices(unique, new Date().toISOString());
  let line = ok ? "Firewall up. The watch is being watched." : loud[0];
  if (ok) {
    try {
      const seals = JSON.parse(readFileSync(join(process.cwd(), "data", "order-seal.json"), "utf8")) as Record<
        string,
        { at?: string }
      >;
      const held = Object.entries(seals)
        .map(([sym, row]) => {
          const left = 30 * 60 * 1000 - (Date.now() - Date.parse(row?.at ?? ""));
          return left > 0 ? `${sym} contract sealed` : "";
        })
        .filter(Boolean);
      if (held.length) line = `Firewall up. ${held.join(". ")}.`;
    } catch {
      // no seal yet
    }
  }
  let entries = true;
  try {
    const halt = readJson<{ off?: boolean }>(join(process.cwd(), "data", "halt.json"));
    entries = halt?.off !== true;
  } catch {
    entries = true;
  }
  const status: WatchStatus = {
    at: new Date().toISOString(),
    ok,
    dark,
    entries,
    line,
    flags: unique,
    monitorAt,
    notices,
  };
  try {
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(FILE, JSON.stringify(status));
  } catch {
    // the desk still gets this read
  }
  return status;
}
