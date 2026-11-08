// COMBO WATCH (Claude, Oct 9 ~8:50 PM PT, Love: "yess let's keep both models on hand, so we can switch if need be... and
// let's keep tabs on both combinations"). Read only. Every 5 minutes:
//  1. GOLD MAPS: each gold hour map in live-switch shifts.hourLeadSets.gold (CURRENT = REFINED/BRICK/BANK, DIAMOND = with
//     DIAMOND in her hours) scored on the paper trades it would have taken, at live pricing: $22, asks <= 72c, Kalshi
//     fees in and out. Per PT day, last 7 days.
//  2. BTC BAND WIDTH: the RUN books' BTC paper trades split by the session sigma at entry (tight < $100 vs wide), same
//     pricing. Tight bands = the session lines sit < $50 apart and the copier blocks nearly everything; this shows
//     whether sitting those out keeps paying. (The exit ledger has no bands, so sigma is remembered here per trade id.)
// Writes data/combo-watch.json for the ALERTS tab.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Cell = { n: number; w: number; p: number };
const D = (f: string) => join(process.cwd(), "data", f);
const g = globalThis as unknown as { __comboAt?: number };
const r2 = (n: number) => Math.round(n * 100) / 100;
const rd = (f: string, d: any) => {
  try {
    return JSON.parse(readFileSync(D(f), "utf8"));
  } catch {
    return d;
  }
};
const ptDay = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const ptHour = (ms: number) => Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date(ms)));
function real(r: any) {
  const ask = Number(r.ask) || 0.58, c = 22 / ask, p = (Number(r.pnl) * 22) / (Number(r.stake) || 30);
  const fee = (q: number) => Math.ceil(0.07 * c * q * (1 - q) * 100) / 100;
  let f = fee(ask);
  if (r.result === "sold") f += fee(Math.min(0.99, Math.max(0.01, ask * (1 + p / 22))));
  return p - f;
}
const add = (c: Cell, p: number) => {
  c.n += 1;
  c.w += p > 0.05 ? 1 : 0;
  c.p = r2(c.p + p);
};
const cell = (): Cell => ({ n: 0, w: 0, p: 0 });

export function comboWatchTick() {
  if (g.__comboAt && Date.now() - g.__comboAt < 5 * 60000) return;
  g.__comboAt = Date.now();
  try {
    const rows = new Map<string, any>();
    const take = (r: any) => {
      if (!r?.id || r.dnaMode || r.stale || typeof r.pnl !== "number" || r.result === "open" || !r.at) return;
      rows.set(r.id, r);
    };
    try {
      for (const line of readFileSync(D("exit-ledger.jsonl"), "utf8").split("\n")) {
        if (!line) continue;
        try {
          take(JSON.parse(line));
        } catch {
        }
      }
    } catch {
    }
    const nb: any[] = rd("night-book.json", []);
    for (const r of Array.isArray(nb) ? nb : []) take(r);
    // remember each BTC row's session sigma at entry (night-book keeps the bands; the ledger does not)
    const sig: Record<string, { sd: number; at: string }> = rd("combo-sigma.json", {});
    for (const r of Array.isArray(nb) ? nb : []) if (r?.asset === "btc" && Number(r?.bands?.sd) > 0 && !sig[r.id]) sig[r.id] = { sd: Number(r.bands.sd), at: r.at };
    const cut = Date.now() - 21 * 864e5;
    for (const k of Object.keys(sig)) if (Date.parse(sig[k].at) < cut) delete sig[k];
    writeFileSync(D("combo-sigma.json"), JSON.stringify(sig));

    const sw = rd("live-switch.json", {});
    const sets: Record<string, Record<string, string | null>> = sw?.shifts?.hourLeadSets?.gold || {};
    const runBooks: string[] = Array.isArray(sw?.liveBook?.books) ? sw.liveBook.books : [];
    const since = Date.now() - 7 * 864e5;
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) days.push(ptDay(Date.now() - i * 864e5));
    const gold: Record<string, { days: Record<string, Cell>; week: Cell }> = {};
    for (const name of Object.keys(sets)) gold[name] = { days: Object.fromEntries(days.map((d) => [d, cell()])), week: cell() };
    // PROBATION (Oct 9 ~9:40 PM PT, Love "both yes"): REFINED's BTC longs (band wait lifted) and COTC on BTC (any hour).
    const mk = () => ({ days: Object.fromEntries(days.map((d) => [d, cell()])), week: cell() });
    const probe = { refinedLongs: mk(), cotcBtc: mk() };
    const btc = { tight: { days: Object.fromEntries(days.map((d) => [d, cell()])), week: cell() }, wide: { days: Object.fromEntries(days.map((d) => [d, cell()])), week: cell() } };
    for (const r of rows.values()) {
      const t = Date.parse(r.at);
      if (!(t >= since) || !((Number(r.ask) || 0) <= 0.72)) continue;
      const d = ptDay(t), h = String(Number.isFinite(Number(r.hourPT)) ? Number(r.hourPT) : ptHour(t)), p = real(r);
      if (r.asset === "btc" && r.book === "refined" && r.side === "up") { add(probe.refinedLongs.week, p); if (probe.refinedLongs.days[d]) add(probe.refinedLongs.days[d], p); }
      if (r.asset === "btc" && r.book === "cotc") { add(probe.cotcBtc.week, p); if (probe.cotcBtc.days[d]) add(probe.cotcBtc.days[d], p); }
      if (r.asset === "gold") {
        for (const [name, m] of Object.entries(sets)) if (m && m[h] && m[h] === r.book) { add(gold[name].week, p); if (gold[name].days[d]) add(gold[name].days[d], p); }
      } else if (r.asset === "btc" && runBooks.includes(r.book) && sig[r.id]) {
        const b = sig[r.id].sd < 100 ? btc.tight : btc.wide;
        add(b.week, p);
        if (b.days[d]) add(b.days[d], p);
      }
    }
    const bn = rd("bands-now.json", {});
    writeFileSync(D("combo-watch.json"), JSON.stringify({ at: new Date().toISOString(), activeGold: sw?.shifts?.activeGoldMap || "current", days, gold, btc, probe, sigmaNow: Number(bn?.btc?.sd) || null, note: "Live pricing: $22, asks <= 72c, Kalshi fees in and out. Gold = trades each hour map would have taken. BTC = RUN books' paper trades by session sigma at entry." }, null, 1));
  } catch {
  }
}
