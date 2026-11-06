// One line per decision, never silent. data/decisions-YYYY-MM-DD.jsonl (UTC date).
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { DATA } from "./config.js";

mkdirSync(DATA, { recursive: true });
export function log(kind, row) {
  const at = new Date();
  const line = JSON.stringify({ at: at.toISOString(), kind, ...row }) + "\n";
  try { appendFileSync(join(DATA, `${kind}-${at.toISOString().slice(0, 10)}.jsonl`), line); }
  catch (e) { console.error("LOG WRITE FAILED", kind, e?.message); }
}
