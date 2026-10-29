import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PATH = join(process.cwd(), "data", "memory-bank.json");

export type Lesson = {
  id: string;
  at: string;
  assets: string[];
  rule: string;
  why: string;
};

export type MemoryEvent = {
  at: string;
  id: string;
  asset: string;
  ticker: string;
  note: string;
};

type Bank = { lessons: Lesson[]; events: MemoryEvent[] };

const seen = new Set<string>();

function empty(): Bank {
  return { lessons: [], events: [] };
}

export function readBank(): Bank {
  try {
    const bank = JSON.parse(readFileSync(PATH, "utf8")) as Bank;
    return {
      lessons: Array.isArray(bank.lessons) ? bank.lessons : [],
      events: Array.isArray(bank.events) ? bank.events : [],
    };
  } catch {
    return empty();
  }
}

export function noteEvent(event: Omit<MemoryEvent, "at">): void {
  const key = `${event.id}:${event.ticker}`;
  if (seen.has(key)) return;
  seen.add(key);
  try {
    const bank = readBank();
    bank.events.unshift({ ...event, at: new Date().toISOString() });
    bank.events = bank.events.slice(0, 40);
    mkdirSync(join(process.cwd(), "data"), { recursive: true });
    writeFileSync(PATH, JSON.stringify(bank, null, 2));
  } catch {
    // a missed note must not block the book
  }
}
