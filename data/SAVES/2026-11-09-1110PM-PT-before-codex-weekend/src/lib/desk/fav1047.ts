// fix1047 HER FAVORITES (Love Nov 9 2026 ~11:54 AM PT: "can you just give me a tiny lil hollow heart button on each card next to the run button / and then it lets me pick which books i want to look at in a favorites tab too").
// DISPLAY ONLY: the list of books she hearted, kept in data/fav-books.json. It never places, sizes, blocks or changes an order, a book, a wall or a switch.
import { createServerFn } from "@tanstack/react-start";

async function io() { const fs = await import("node:fs"); const { join } = await import("node:path"); return { fs, P: join(process.cwd(), "data", "fav-books.json") }; }
export async function readFav1047(): Promise<string[]> {
  const { fs, P } = await io();
  try { const j = JSON.parse(fs.readFileSync(P, "utf8")); return Array.isArray(j?.books) ? j.books.map(String).filter(Boolean) : []; } catch { return []; }
}
export async function writeFav1047(book: string, on: boolean): Promise<string[]> {
  const { fs, P } = await io(); const b = String(book || "").slice(0, 80); if (!b) return readFav1047();
  const cur = (await readFav1047()).filter((x) => x !== b); const next = on ? [...cur, b] : cur;
  const t = P + ".tmp"; fs.writeFileSync(t, JSON.stringify({ books: next, at: new Date().toISOString() })); fs.renameSync(t, P); return next;
}
export const getFav1047 = createServerFn({ method: "GET" }).handler(async (): Promise<string[]> => readFav1047());
export const setFav1047 = createServerFn({ method: "POST" })
  .validator((input: { book: string; on: boolean }) => input)
  .handler(async ({ data }): Promise<string[]> => writeFav1047(data.book, data.on === true));
