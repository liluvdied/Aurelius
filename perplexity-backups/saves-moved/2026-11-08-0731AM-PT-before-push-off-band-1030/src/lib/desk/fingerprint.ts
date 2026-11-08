// PAPER FINGERPRINT (Claude, Oct 11 ~9:50 AM PT, Love: "yes, let's do that" -> a paper-only log of exactly which band frame
// and which rule fired on every PAPER entry, so she can be rebuilt 1:1). Read only: it never trades or changes PAPER.
// Every new PAPER trade (live-paper-book.json, source "paper") gets one line in data/paper-fingerprint.jsonl with both band
// frames she can read at that moment:
//   ROLL 1H = VWAP of the last 12 five-minute Pepperstone bars, forming bar included (asset.vwap5m), sigma floor 0.015%;
//   SESSION = the session VWAP your chart shows (asset.vwap1m, from 5 PM ET),
// where price sat in each (z and the nearest band), the two pattern reads (5m bars on ROLL 1H, the session "spine"),
// the setup the desk built, and which one her label matches.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const D = (f: string) => join(process.cwd(), "data", f);
const r2 = (n: number) => Math.round(n * 100) / 100;
const g = globalThis as unknown as { __fpSeen?: Set<string> };
const norm = (s: unknown) => String(s ?? "").replace(/−/g, "-").replace(/\s+/g, " ").trim();

function where(price: number, vwap: number, sd: number) {
  if (!(vwap > 0) || !(sd > 0) || !(price > 0)) return null;
  const z = (price - vwap) / sd;
  let best = { name: "VWAP", level: vwap };
  for (const k of [0.5, 1, 1.5, 2, 2.5, 3]) for (const s of [1, -1]) {
    const L = vwap + s * k * sd;
    if (Math.abs(L - price) < Math.abs(best.level - price)) best = { name: `${s > 0 ? "+" : "-"}${k}σ`, level: L };
  }
  return { vwap: r2(vwap), sd: r2(sd), z: r2(z), nearest: best.name, nearestAt: r2(best.level), off: r2(price - best.level) };
}

export function fingerprintTick(assets: Record<string, any> | null | undefined) {
  if (!assets) return;
  try {
    const seen = (g.__fpSeen ||= new Set<string>(existsSync(D("paper-fingerprint.jsonl")) ? readFileSync(D("paper-fingerprint.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l).id; } catch { return ""; } }) : []));
    const trades = JSON.parse(readFileSync(D("live-paper-book.json"), "utf8"))?.trades ?? [];
    for (const t of trades.slice(0, 30)) {
      if (t?.source !== "paper" || seen.has(t.id)) continue;
      const lag = (Date.now() - Date.parse(t.openedAt)) / 1000;
      if (!(lag >= 0 && lag < 90)) { seen.add(t.id); continue; }
      const a = assets[t.asset];
      if (!a) continue;
      const spot = Number(a.spot) || 0;
      const label = norm(t.patternLabel);
      const p1 = a.pattern1m || {}, p5 = a.pattern5m || {}, su = a.setup || null;
      const match = (p: any) => p?.side === t.side && norm(p?.label) === label;
      const source = /nav/i.test(label) ? "nav close (5m/10m/15m nav line)" : /^last minute|^gold clock/i.test(label) ? "last-minute clock" : match(p5) ? "ROLL 1H tap (5m bars)" : match(p1) ? "SESSION spine (closed 5m bar)" : su && norm(su.pattern?.label) === label ? "desk setup" : "unmatched";
      const row = {
        id: t.id, at: t.openedAt, loggedAt: new Date().toISOString(), lagSec: Math.round(lag), asset: t.asset, ticker: t.ticker, side: t.side, label,
        notes: String(t.notes || "").slice(0, 140), ask: t.ask, multiple: r2(Number(t.multiple) || 0), spot, target: a.target ?? null,
        vsTarget: a.target ? r2(spot - a.target) : null, secondsLeft: a.secondsLeft ?? null, source,
        roll1h: where(spot, Number(a.vwap5m?.vwap) || 0, Number(a.vwap5m?.stdev) || 0),
        session: where(spot, Number(a.vwap1m?.vwap) || 0, Number(a.vwap1m?.stdev) || 0),
        pattern5m: { kind: p5.kind, side: p5.side, label: p5.label }, spine: { kind: p1.kind, side: p1.side, label: p1.label },
        setup: su ? { label: su.pattern?.label, side: su.side, watchOnly: su.watchOnly, multiple: r2(Number(su.multiple) || 0) } : null,
      };
      appendFileSync(D("paper-fingerprint.jsonl"), JSON.stringify(row) + "\n");
      seen.add(t.id);
    }
  } catch {
  }
}
