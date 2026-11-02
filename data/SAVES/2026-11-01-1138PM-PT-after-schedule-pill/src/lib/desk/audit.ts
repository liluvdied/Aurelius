import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(process.cwd(), "data", "audit.json");

export type AuditRow = {
  at: string;
  asset: string;
  side: string;
  ticker: string;
  desk: number | null;
  paper: number | null;
  kalshi: number;
};

export function readAudit(): AuditRow[] {
  try {
    const rows = JSON.parse(readFileSync(FILE, "utf8")) as AuditRow[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function noteAudit(row: Omit<AuditRow, "at">) {
  const prior = readAudit();
  const last = prior[0];
  if (last && last.ticker === row.ticker && last.kalshi === row.kalshi && last.desk === row.desk) return;
  const next = [{ ...row, at: new Date().toISOString() }, ...prior].slice(0, 40);
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(FILE, JSON.stringify(next));
}
