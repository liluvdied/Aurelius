// ARCHIVE CACHE (Oct 15, Love: "the close buttons started to lag like last time again"). grok-og-archive.jsonl is 20 MB and
// growing; the SHIFT cards and the night book re-read and re-parsed ALL of it on every refresh, stalling the server's event
// loop 0.4-0.85 s at a time (data/loop-lag.jsonl) - and her close clicks waited behind it. Now the file is parsed once and
// only the newly appended bytes are read after that. Same rows, same order.
// fix719 FULL HISTORY ON CARDS (Love Nov 5 2026 6:36 AM PT: "is there any way we can recover the records for these hun ??? ... it's hard to get a read on things with 15 trades"):
// the archive passed 536 MB, the most one JavaScript string can hold, so the first read after every desk start threw and every lane card fell back to its recent rows only.
// Now it is read in 64 MB pieces, and only its newest 480 MB are kept (about the size it held fine before - since about Oct 15 today), so the cards show their whole record
// again without the desk holding more than it used to. Same rows, same order. Display only: no book, wall, size or order reads this differently.
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
export const ARCH_CAP719 = 480 * 1024 * 1024, ARCH_CHUNK719 = 64 * 1024 * 1024;
export function archiveRows(): any[] {
  const file = join(process.cwd(), "data", "grok-og-archive.jsonl");
  const c = (G.__archCache ||= { size: 0, rest: "", rows: [] as any[] });
  let size = 0;
  try { size = statSync(file).size; } catch { return c.rows; }
  if (size < c.size) { c.size = 0; c.rest = ""; c.rows = []; }
  if (size === c.size) return c.rows;
  const fd = openSync(file, "r");
  try {
    let pos = c.size, skipFirst = false;
    if (pos === 0 && size > ARCH_CAP719) { pos = size - ARCH_CAP719; skipFirst = true; } // fix719: keep the newest 480 MB; the first partial line is dropped
    while (pos < size) {
      const len = Math.min(ARCH_CHUNK719, size - pos);
      const buf = Buffer.alloc(len);
      readSync(fd, buf, 0, len, pos);
      const text = c.rest + buf.toString("utf8");
      const parts = text.split("\n");
      c.rest = parts.pop() ?? "";
      if (skipFirst) { parts.shift(); skipFirst = false; }
      for (const l of parts) {
        if (!l) continue;
        try { c.rows.push(JSON.parse(l)); } catch {}
      }
      pos += len;
    }
    c.size = size;
  } finally {
    closeSync(fd);
  }
  return c.rows;
}
