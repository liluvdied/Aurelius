import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { unionTrades, onePerSetup } from "./ledger";
import { recordTrades } from "./fill-log";
import { syncPrime } from "./prime-book";
import { DEFAULT_SETTINGS, type DeskSettings, type Trade } from "./types";

// The ledger lives with the rest of the records in data/, not the OS temp folder,
// so a reboot or a move to another machine cannot leave it behind.
const DIR = join(process.cwd(), "data");
const FILE = join(DIR, "live-paper-book.json");
const OLD_FILE = join(tmpdir(), "aurelius-paper-book.json");
// PAPER BOOK ARCHIVE (fix305, Oct 27 2026, Love: "you're clear to have them archived as long as they can load from the file if i want to
// click one and see them"): trades opened before 2026-10-24T07:00Z (closed) moved to live-paper-book-archive.jsonl, one per line, so the
// desk stops parsing 4.4 MB every tick. Nothing is deleted: tools/restore-live-book.py merges them back, readBookArchive() reads them.
// The page's own saved ledger still holds them and pushes them with every save, so writeBook drops archived ids instead of re-adding them.
const ARCHIVE = join(DIR, "live-paper-book-archive.jsonl");
const G = globalThis as any;
function archivedIds(): Set<string> {
  let size = -1;
  try { size = statSync(ARCHIVE).size; } catch { return new Set(); }
  if (G.__pbArch?.size === size) return G.__pbArch.ids;
  const ids = new Set<string>();
  try {
    for (const l of readFileSync(ARCHIVE, "utf8").split("\n")) { if (!l) continue; try { const t = JSON.parse(l); if (t?.id) ids.add(String(t.id)); } catch {} }
  } catch {}
  G.__pbArch = { size, ids };
  return ids;
}
export function readBookArchive(): Trade[] {
  try {
    return readFileSync(ARCHIVE, "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((t) => t?.id);
  } catch {
    return [];
  }
}
try {
  if (!existsSync(FILE) && existsSync(OLD_FILE)) {
    mkdirSync(DIR, { recursive: true });
    copyFileSync(OLD_FILE, FILE);
  }
} catch {
  // first run with nothing to carry over
}
type BookFile = {
  trades: Trade[];
  settings: DeskSettings;
};

function empty(): BookFile {
  return { trades: [], settings: DEFAULT_SETTINGS };
}

// fix616 (Love Nov 1 2026 4:27 PM PT: "build the numbered branch that re-reads live-paper-book.json only when the file changes"): the file is read from disk only when its time or size changes.
// readBook still hands every caller its own rows, because callers change them. readBookShared is for callers that only look: it parses once per change. Never change its rows.
let file616: { m: number; s: number; raw: string; book: BookFile | null } | null = null;
function raw616(): string {
  const st = statSync(FILE);
  if (!file616 || file616.m !== st.mtimeMs || file616.s !== st.size) file616 = { m: st.mtimeMs, s: st.size, raw: readFileSync(FILE, "utf8"), book: null };
  return file616.raw;
}
function parse616(raw: string): BookFile {
  const parsed = JSON.parse(raw) as Partial<BookFile>;
  const trades = Array.isArray(parsed.trades) ? parsed.trades.filter((t) => t?.id) : [];
  return {
    trades: onePerSetup(trades),
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
  };
}
export function readBook(): BookFile {
  try {
    return parse616(raw616());
  } catch {
    return empty();
  }
}
export function readBookShared(): BookFile {
  try {
    const raw = raw616();
    return file616!.book ?? (file616!.book = parse616(raw));
  } catch {
    return empty();
  }
}

export function writeBook(trades: Trade[], settings?: DeskSettings): BookFile {
  const prev = readBookShared(); // fix616: only looked at here
  const arch = archivedIds();
  if (arch.size) trades = trades.filter((t) => !t?.id || !arch.has(String(t.id)) || t.result === "open");
  const merged = unionTrades(prev.trades, trades);
  recordTrades(prev.trades, merged);
  try {
    syncPrime(merged);
  } catch {
    // the prime book must not block the real book
  }
  const next: BookFile = {
    trades: onePerSetup(merged),
    settings: { ...DEFAULT_SETTINGS, ...prev.settings, ...(settings ?? {}) },
  };
  const body = JSON.stringify(next);
  try {
    if (raw616() === body) return next; // fix616
  } catch {
    // first write
  }
  // Write then rename, so a crash mid-write cannot leave a half ledger.
  mkdirSync(DIR, { recursive: true });
  writeFileSync(`${FILE}.tmp`, body);
  renameSync(`${FILE}.tmp`, FILE);
  return next;
}
