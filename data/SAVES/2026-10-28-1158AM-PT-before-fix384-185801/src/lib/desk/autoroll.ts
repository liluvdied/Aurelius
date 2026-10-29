// AUTO ROLL (Claude, Oct 5 ~4:30 PM PT, Love: "implement something that automatically rolls the highest performing book of
// the day into whatever is already on kalshi, if something is performing better it should be live too").
// Every 15 minutes: rank the paper books on the last 12 hours (Love: "sometimes 24 is too much") of settled trades (exit ledger + night book). The leader goes
// live on Kalshi next to her own picks, IF it has 12+ settled trades, wins 60%+ and is green. One AUTO slot:
//   - the leader is already live (one of her picks) -> the AUTO slot stays empty;
//   - a new leader takes over -> the old AUTO book comes off, the new one goes on;
//   - the AUTO book goes red / under the bar -> it comes off.
// It never touches the books Love turned on herself, never turns Kalshi LIVE on, and skips lotto / tap / hourly books.
// If Love taps an AUTO book off, it stays off for 24 hours. live-switch "autoRoll": { on, minN, minWin, hours, current }.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { listNight } from "./nightbook";

const g = globalThis as unknown as { __autoRollAt?: number };
const SKIP = new Set(["tap3x", "taphold", "rescue", "snap50", "snap100", "snap200", "snap300", "snaphold", "x16_50", "x16_100", "x16_200", "x16_300", "x16hold", "hour", "squeeze"]);
const NAME: Record<string, string> = { brk1: "1ST BREAK", brk: "BREAK", brick: "BRICK", brickc: "BRICK CLEAN", claude: "CLAUDE", trend: "TREND", cotc: "COTC", confirm: "CONFIRM", sole5p: "5M SOLE+", bank5p: "BANK SOLE+", claudex: "CLAUDE 5M-X", trendx: "TREND 5M-X", bank5px: "BANK SOLE+ 5M-X", brickt: "BRICK TVC", brickp: "BRICK PUSH", new: "NEW", brk1: "1ST BREAK" };

export function autoRollTick() {
  // Re-checks every 15 minutes, and right away whenever her settings for it change.
  let key = String(Math.floor(Date.now() / (15 * 60000)));
  try {
    key += JSON.stringify(JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).autoRoll?.hours ?? "");
  } catch {
  }
  if ((g as unknown as { __autoRollKey?: string }).__autoRollKey === key) return;
  (g as unknown as { __autoRollKey?: string }).__autoRollKey = key;
  try {
    const file = join(process.cwd(), "data", "live-switch.json");
    const sw = JSON.parse(readFileSync(file, "utf8"));
    const cfg = sw.autoRoll;
    if (!cfg?.on || !sw.liveBook) return;
    const hours = Number(cfg.hours) > 0 ? Number(cfg.hours) : 12;
    const minN = Number(cfg.minN) > 0 ? Number(cfg.minN) : 12;
    const minWin = Number(cfg.minWin) > 0 ? Number(cfg.minWin) : 0.6;
    const from = Date.now() - hours * 3600 * 1000;
    // last 24h of settled trades, once per id
    const seen = new Map<string, { book: string; pnl: number }>();
    try {
      for (const line of readFileSync(join(process.cwd(), "data", "exit-ledger.jsonl"), "utf8").split("\n")) {
        if (!line.trim()) continue;
        try {
          const e = JSON.parse(line);
          if (e.stale || e.dnaMode || typeof e.pnl !== "number" || Date.parse(e.at) < from) continue;
          seen.set(e.id, { book: e.book, pnl: e.pnl });
        } catch {
        }
      }
    } catch {
    }
    for (const r of listNight()) {
      if ((r as { stale?: boolean }).stale || r.dnaMode || r.result === "open" || r.pnl == null || Date.parse(r.at) < from) continue;
      seen.set(r.id, { book: r.book, pnl: r.pnl });
    }
    const stat: Record<string, { n: number; w: number; pnl: number }> = {};
    for (const { book, pnl } of seen.values()) {
      if (SKIP.has(book)) continue;
      const s = (stat[book] ||= { n: 0, w: 0, pnl: 0 });
      s.n += 1;
      s.w += pnl > 0.05 ? 1 : 0;
      s.pnl += pnl;
    }
    const snoozed: Record<string, string> = cfg.snoozed || {};
    const ok = (b: string) => stat[b] && stat[b].n >= minN && stat[b].w / stat[b].n >= minWin && stat[b].pnl > 0 && !(snoozed[b] && Date.parse(snoozed[b]) > Date.now());
    const ranked = Object.entries(stat).sort((a, b) => b[1].pnl - a[1].pnl);
    const leader = ranked.find(([b]) => ok(b))?.[0] ?? null;
    const books: string[] = Array.isArray(sw.liveBook.books) ? [...sw.liveBook.books] : [];
    const cur: string | null = cfg.current || null;
    const mine = books.filter((b) => b !== cur); // her own picks
    let next: string | null = leader && !mine.includes(leader) ? leader : null;
    if (cur && cur === next) {
      writeStatus(cfg, ranked, leader, cur, "holding");
      sw.autoRoll = { ...cfg, checkedAt: new Date().toISOString(), board: board(ranked) };
      writeFileSync(file, JSON.stringify(sw, null, 2));
      return;
    }
    if (!cur && !next) {
      writeStatus(cfg, ranked, leader, null, leader ? "the best book is already live (one of yours)" : "no book clears the bar yet");
      sw.autoRoll = { ...cfg, checkedAt: new Date().toISOString(), board: board(ranked) };
      writeFileSync(file, JSON.stringify(sw, null, 2));
      return;
    }
    const nowIso = new Date().toISOString();
    let nextBooks = cur ? books.filter((b) => b !== cur) : books;
    if (next) {
      nextBooks = [...nextBooks, next];
      // Rows this book booked before it went live are written down as skipped, never sent late, never a false RED.
      try {
        const doneFile = join(process.cwd(), "data", "live-book-done.json");
        let done: Record<string, Record<string, unknown>> = {};
        try {
          done = JSON.parse(readFileSync(doneFile, "utf8"));
        } catch {
          done = {};
        }
        for (const r of listNight()) {
          if (r.book !== next || Date.parse(r.at) < Date.now() - 4 * 3600 * 1000) continue;
          const d = done[r.id] as { status?: string; final?: boolean } | undefined;
          if (d && (d.status === "filled" || d.final === true)) continue;
          done[r.id] = { ...(d || {}), at: nowIso, ticker: r.ticker, side: r.side, status: "skipped", final: true, reason: "booked before AUTO rolled it onto Kalshi" };
        }
        writeFileSync(doneFile, JSON.stringify(done));
      } catch {
      }
    }
    sw.liveBook.prevBooks = books;
    sw.liveBook.books = nextBooks;
    sw.autoRoll = { ...cfg, current: next, since: next ? nowIso : null, checkedAt: nowIso, board: board(ranked) };
    writeFileSync(file, JSON.stringify(sw, null, 2));
    const s = next ? stat[next] : null;
    const text = next
      ? `AUTO: ${NAME[next] ?? next.toUpperCase()} rolled onto Kalshi (best book of the last ${hours}h: ${s!.pnl >= 0 ? "+" : ""}$${s!.pnl.toFixed(0)} paper, ${s!.w}/${s!.n} wins)${cur ? `, ${NAME[cur] ?? cur.toUpperCase()} rolled off` : ""}.`
      : `AUTO: ${NAME[cur!] ?? String(cur).toUpperCase()} rolled off Kalshi (no longer the best green book of the last ${hours}h).`;
    appendFileSync(join(process.cwd(), "data", "run-book-log.jsonl"), JSON.stringify({ at: nowIso, auto: true, on: next, off: cur, books: nextBooks, text }) + "\n");
    try {
      const af = join(process.cwd(), "data", "alarm.json");
      let rows: unknown[] = [];
      try {
        const prev = JSON.parse(readFileSync(af, "utf8"));
        if (Array.isArray(prev)) rows = prev;
      } catch {
      }
      rows.unshift({ at: nowIso, text });
      writeFileSync(af, JSON.stringify(rows.slice(0, 20)));
    } catch {
    }
    writeStatus(cfg, ranked, leader, next, text);
  } catch {
  }
}

function board(ranked: [string, { n: number; w: number; pnl: number }][]) {
  return ranked.slice(0, 6).map(([b, s]) => ({ book: b, n: s.n, win: Math.round((s.w / s.n) * 100), pnl: Math.round(s.pnl) }));
}
function writeStatus(cfg: unknown, ranked: [string, { n: number; w: number; pnl: number }][], leader: string | null, current: string | null, note: string) {
  try {
    writeFileSync(join(process.cwd(), "data", "auto-roll-status.json"), JSON.stringify({ at: new Date().toISOString(), leader, current, note, board: board(ranked) }, null, 1));
  } catch {
  }
}
