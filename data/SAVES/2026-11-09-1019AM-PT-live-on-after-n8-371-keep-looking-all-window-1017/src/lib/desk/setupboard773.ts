// fix773 SETUP SCOREBOARD (Love Nov 5 2026 ~8:04 PM PT: "we'll let her get some scores overnight , lets score our own trades by these as well , and create a flip at red -
// break thru pink - etc scoring system for ours alongside it 💘 we can take things up a notch, we have the mechanics stable, now lets choose what she takes").
// DISPLAY ONLY - read by the STATS box and nothing else. The scoring runs in its own low-priority process (tools/setup-board-773.mjs, nice 19), started from here at
// most once a minute; this file only hands the page one book's rows. It also keeps a copy of the desk's closed 1m bars (the ones V.111 - 2 reads, __pivBars) in
// data/setup-bars-773/<asset>.json so her band read can be worked out for our trades. It never places, sizes, cancels, blocks or reads an order, wall or switch.
import { createServerFn } from "@tanstack/react-start";

const G = globalThis as any;
type Cell = { asset: string; side: string; setup: string; wk: number[]; d24: number[]; vwk: string; v24: string };

async function fsx() { const fs = await import("node:fs"); const { join } = await import("node:path"); return { fs, D: (...p: string[]) => join(process.cwd(), "data", ...p) }; }

/** the desk's closed 1m bars -> data/setup-bars-773/<asset>.json (8 days kept). The newest bar of a read can still be forming, so it is left for the next copy. */
async function keepBars773() {
  const c = (G.__sb773Bars ||= { at: 0, mem: {} as Record<string, Record<string, number[]>> });
  if (Date.now() - c.at < 60000) return;
  c.at = Date.now();
  const { fs, D } = await fsx();
  fs.mkdirSync(D("setup-bars-773"), { recursive: true });
  for (const id of ["btc", "gold"]) {
    try {
      const raw: any[] = G.__pivBars?.[id]?.bars ?? [];
      if (raw.length < 2) continue;
      const p = D("setup-bars-773", `${id}.json`);
      if (!c.mem[id]) { try { c.mem[id] = JSON.parse(fs.readFileSync(p, "utf8")).bars || {}; } catch { c.mem[id] = {}; } }
      const m = c.mem[id];
      const last = Math.max(...raw.map((b) => Number(b.t) || 0)), min = Math.floor(Date.now() / 60000) * 60;
      let changed = 0;
      for (const b of raw) {
        const t = Number(b.t);
        if (!(t > 0) || t >= last || t >= min || t % 60 !== 0) continue;
        const v = [Number(b.o), Number(b.h), Number(b.l), Number(b.c), Number(b.v) || 0];
        if (!v.slice(0, 4).every((x) => Number.isFinite(x) && x > 0)) continue;
        const o = m[String(t)];
        if (!o || o.some((x: number, i: number) => x !== v[i])) { m[String(t)] = v; changed += 1; }
      }
      if (!changed) continue;
      const keep = min - 8 * 86400;
      for (const k of Object.keys(m)) if (Number(k) < keep) delete m[k];
      fs.writeFileSync(p + ".tmp", JSON.stringify({ at: new Date().toISOString(), bars: m }));
      fs.renameSync(p + ".tmp", p);
    } catch {}
  }
}

/** start the scorer (own process, nice 19) when its file is over a minute old. One at a time (the tool holds a lock). */
async function kick773() {
  const c = (G.__sb773Kick ||= { at: 0 });
  if (Date.now() - c.at < 60000) return;
  const { fs, D } = await fsx();
  try { if (Date.now() - fs.statSync(D("setup-board-773.json")).mtimeMs < 60000) return; } catch {}
  c.at = Date.now();
  try { const { spawn } = await import("node:child_process"); spawn("nice", ["-n", "19", process.execPath, "--max-old-space-size=256", "--max-semi-space-size=2", "tools/setup-board-773.mjs"], { cwd: process.cwd(), detached: true, stdio: "ignore" }).unref(); } catch {}
}

async function board773(): Promise<any | null> {
  const { fs, D } = await fsx();
  const c = (G.__sb773 ||= { key: "", v: null as any });
  try { const st = fs.statSync(D("setup-board-773.json")); const key = `${st.mtimeMs}:${st.size}`; if (c.key !== key) { c.v = JSON.parse(fs.readFileSync(D("setup-board-773.json"), "utf8")); c.key = key; } } catch {}
  return c.v;
}

const ok = (s: unknown, re: RegExp) => typeof s === "string" && re.test(s);

/** this week + last 24 h for one book and one lens ("ours" = our setup family, "hers" = her band read). Small: one row per asset | side | set up. */
export const getSetupBoard773 = createServerFn({ method: "GET" })
  .validator((input: { book?: string; lens?: string } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    try { await keepBars773(); } catch {}
    try { await kick773(); } catch {}
    const b = await board773();
    if (!b) return { at: null, books: [], rows: [], past: [], rules: null, week: null, book: "" };
    const book = ok(data?.book, /^[A-Za-z0-9 ._-]{1,40}$/) && b.score?.[data!.book!] ? data!.book! : b.books?.[0]?.id ?? "";
    const lens = data?.lens === "hers" ? "hers" : "ours";
    return { at: b.at, rules: b.rules, week: b.week, past: b.past ?? [], books: b.books ?? [], book, lens, rows: (b.score?.[book]?.[lens] ?? []) as Cell[] };
  });

/** one past week from the archive (data/setup-board-weeks/<monday>.json), scored only when it is opened. */
export const getSetupBoardWeek773 = createServerFn({ method: "GET" })
  .validator((input: { week: string; book: string; lens?: string }) => input)
  .handler(async ({ data }) => {
    if (!ok(data?.week, /^\d{4}-\d{2}-\d{2}$/) || !ok(data?.book, /^[A-Za-z0-9 ._-]{1,40}$/)) return null;
    const { fs, D } = await fsx();
    const lens = data.lens === "hers" ? 9 : 3;
    const c = (G.__sb773Week ||= {}) as Record<string, { key: string; rows: any[] }>;
    try {
      const p = D("setup-board-weeks", `${data.week}.json`), st = fs.statSync(p), key = `${st.mtimeMs}:${st.size}`;
      if (c[data.week]?.key !== key) { c[data.week] = { key, rows: Object.values(JSON.parse(fs.readFileSync(p, "utf8"))) }; for (const k of Object.keys(c)) if (k !== data.week) delete c[k]; }
      let R = { minTrades: 10, minHitPct: 60 };
      try { const j = JSON.parse(fs.readFileSync(D("setup-verdict-rules.json"), "utf8")); R = { minTrades: Number.isFinite(Number(j.minTrades)) ? Number(j.minTrades) : 10, minHitPct: Number.isFinite(Number(j.minHitPct)) ? Number(j.minHitPct) : 60 }; } catch {}
      const m = new Map<string, Cell>();
      for (const r of c[data.week].rows) {
        if (r[0] !== data.book) continue;
        const k = `${r[1]}|${r[2]}|${r[lens]}`;
        const x = m.get(k) ?? { asset: r[1], side: r[2], setup: r[lens], wk: [0, 0, 0, 0], d24: [0, 0, 0, 0], vwk: "WATCH", v24: "WATCH" };
        x.wk[0] += 1; x.wk[1] += r[6]; x.wk[2] = Math.round((x.wk[2] + r[7]) * 100) / 100; x.wk[3] += r[8];
        m.set(k, x);
      }
      const rows = [...m.values()].map((x) => { const n = x.wk[0], hit = n ? (100 * x.wk[1]) / n : 0; x.vwk = x.setup === "no bars" ? "NO BARS" : n < R.minTrades ? "WATCH" : hit < R.minHitPct || x.wk[2] < 0 ? "CUT" : x.wk[2] > 0 ? "KEEP" : "WATCH"; return x; });
      return { week: data.week, book: data.book, lens: lens === 9 ? "hers" : "ours", rows };
    } catch { return null; }
  });
