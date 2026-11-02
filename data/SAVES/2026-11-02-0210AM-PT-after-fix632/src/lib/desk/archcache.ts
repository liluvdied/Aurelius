// ARCHIVE CACHE (Oct 15, Love: "the close buttons started to lag like last time again"). grok-og-archive.jsonl is 20 MB and
// growing; the SHIFT cards and the night book re-read and re-parsed ALL of it on every refresh, stalling the server's event
// loop 0.4-0.85 s at a time (data/loop-lag.jsonl) - and her close clicks waited behind it. Now the file is parsed once and
// only the newly appended bytes are read after that. Same rows, same order.
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
export function archiveRows(): any[] {
  const file = join(process.cwd(), "data", "grok-og-archive.jsonl");
  const c = (G.__archCache ||= { size: 0, rest: "", rows: [] as any[] });
  let size = 0;
  try { size = statSync(file).size; } catch { return c.rows; }
  if (size < c.size) { c.size = 0; c.rest = ""; c.rows = []; }
  if (size === c.size) return c.rows;
  const fd = openSync(file, "r");
  try {
    const len = size - c.size;
    const buf = Buffer.alloc(len);
    readSync(fd, buf, 0, len, c.size);
    const text = c.rest + buf.toString("utf8");
    const parts = text.split("\n");
    c.rest = parts.pop() ?? "";
    for (const l of parts) {
      if (!l) continue;
      try { c.rows.push(JSON.parse(l)); } catch {}
    }
    c.size = size;
  } finally {
    closeSync(fd);
  }
  return c.rows;
}
