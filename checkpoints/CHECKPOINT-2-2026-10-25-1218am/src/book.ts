import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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

export function readBook(): BookFile {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Partial<BookFile>;
    const trades = Array.isArray(parsed.trades) ? parsed.trades.filter((t) => t?.id) : [];
    return {
      trades: onePerSetup(trades),
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return empty();
  }
}

export function writeBook(trades: Trade[], settings?: DeskSettings): BookFile {
  const prev = readBook();
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
    if (readFileSync(FILE, "utf8") === body) return next;
  } catch {
    // first write
  }
  // Write then rename, so a crash mid-write cannot leave a half ledger.
  mkdirSync(DIR, { recursive: true });
  writeFileSync(`${FILE}.tmp`, body);
  renameSync(`${FILE}.tmp`, FILE);
  return next;
}
