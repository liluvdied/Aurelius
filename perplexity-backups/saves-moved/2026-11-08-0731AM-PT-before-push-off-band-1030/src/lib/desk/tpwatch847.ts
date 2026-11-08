// fix847 TP WATCHDOG (Love Nov 6 2026 ~5:50 PM PT: "pls do set something to notify us or the umpire of something like that next time if we can").
// Every 5 s, on its own (outside her take-profit loop, so a crash there can't silence it): for each live position one of her four live books opened (main, REJECTION,
// SESSION + PINK, BESTIE - the 75 / 95 books) with no slider of hers, if the bid has sat at or over its 75% (half) or 95% (rest) line for 20 s and that sale has not gone out
// (data/tp780.json), it RE-ARMS and SELLS IT ITSELF - the same sale her loop makes (half at 75%, the rest at 95%, through the same Kalshi calls, never more than she holds), unless
// HANDS OFF is on (then it only tells). A sale that came back with no fill is re-armed. Everything is written to data/alarm-tp-watchdog.jsonl and shown on her ALERTS tab.
// Love ~5:53 PM PT: "have her not lock the whole desk if that happens , just set up a trigger that resets the take profits if ump catches that it didn't execute on a window" -
// it never turns LIVE off, never pauses or blocks an entry, never touches the umpire's SAFE.
import { readFileSync, appendFileSync, statSync } from "node:fs";
import { join } from "node:path";
const D = (f: string) => join(process.cwd(), "data", f);
const G = globalThis as any;
export const BOOKS847 = ["recon-tog", "recon-rej", "brk-sesspk", "bestie"];
export const HOLD847 = 20000;
const rj = (f: string): any => { try { return JSON.parse(readFileSync(D(f), "utf8")); } catch { return null; } };
export function lines847(e: number) { return { l75: e + 0.75 * (1 - e), l95: e + 0.95 * (1 - e) }; }
/** pure: which of her two sales is overdue on this position right now ("" = none) - over its line for HOLD847 ms and not sold. */
export function judge847(now: number, p: { ticker: string; entry: number; bid: number; done75: boolean; done95: boolean }, since: Record<string, number>): "" | "75" | "95" {
  if (!(p.entry > 0.02 && p.entry < 1) || !(p.bid > 0)) { delete since[p.ticker]; return ""; }
  const { l75, l95 } = lines847(p.entry);
  const step = !p.done95 && p.bid + 1e-9 >= l95 ? "95" : !p.done75 && p.bid + 1e-9 >= l75 ? "75" : "";
  if (!step) { delete since[p.ticker]; return ""; }
  if (!(p.ticker in since)) since[p.ticker] = now;
  return now - since[p.ticker] >= HOLD847 ? step : "";
}
export function alarm847(kind: string, text: string, extra: Record<string, unknown> = {}) {
  try { appendFileSync(D("alarm-tp-watchdog.jsonl"), JSON.stringify({ at: new Date().toISOString(), kind, text, ...extra }) + "\n"); } catch {}
}
function owner847(ticker: string): string {
  const done = rj("live-book-done.json") || {}; let best: any = null;
  for (const [k, v] of Object.entries<any>(done)) if ((v?.status === "filled" || v?.status === "partial") && (v.ticker || k.split(":")[0]) === ticker && (!best || String(v.at) < String(best.v.at))) best = { k, v };
  const b = best ? String(best.k).split(":")[1] || "" : ""; return BOOKS847.includes(b) ? b : "";
}
/** 75 / 95 sale state for a ticker: marked in tp780.json and NOT logged in tp780.jsonl with no fill (a sale that came back empty is re-armed). */
function done847(t: string, step: "75" | "95", d780: any, log: any[]): boolean {
  if (!d780[t + ":" + step]) return false;
  const last = [...log].reverse().find((x) => x && x.ticker === t && String(x.step || "").startsWith(step === "75" ? "half" : "rest"));
  if (last && !last.got && Date.now() - Date.parse(last.at) >= 5000) return false; // fix847: it came back with no fill - re-armed
  return true;
}
export async function tpWatchTick847(): Promise<void> {
  if (G.__tpw847Busy || (G.__tpw847At && Date.now() - G.__tpw847At < 5000)) return;
  G.__tpw847Busy = true; G.__tpw847At = Date.now();
  const told: Record<string, number> = (G.__tpw847Told ||= {}), since: Record<string, number> = (G.__tpw847Since ||= {});
  try {
    // errors her money path wrote down (fix846 take-profit loop, the engine tick) - told, never blocking
    try { const lines = readFileSync(D("cash-held-errors.jsonl"), "utf8").trim().split("\n").slice(-5); for (const ln of lines) { const x = JSON.parse(ln); const k = "err:" + x.at; if (!told[k] && Date.now() - Date.parse(x.at) < 600000) { told[k] = Date.now(); alarm847("take-profit loop error", `TP WATCHDOG: her exit loop hit an error (${String(x.error).slice(0, 160)}) - the watchdog is covering her 75 / 95.`); } } } catch {}
    try { const te = rj("tick-error.json"); if (te?.at && Date.now() - Date.parse(te.at) < 600000 && !told["tick:" + te.at]) { told["tick:" + te.at] = Date.now(); alarm847("engine tick error", `TP WATCHDOG: her engine tick hit an error (${String(te.error).slice(0, 160)}) - the watchdog is covering her 75 / 95.`); } } catch {}
    let log780: any[] = []; try { log780 = readFileSync(D("tp780.jsonl"), "utf8").trim().split("\n").slice(-60).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch {}
    const live: any = await import("./kalshi-live.server");
    const held: any[] = await live.heldFifteens();
    let sw: any = {}; try { sw = JSON.parse(readFileSync(D("live-switch.json"), "utf8")); } catch {}
    const handsOff = sw?.autoExits === false || sw?.tp780 === false;
    const f780 = D("tp780.json"); let d780: any = rj("tp780.json") || {};
    const pins = rj("pin-sale.json") || {};
    for (const row of held || []) {
      const t = String(row?.ticker || ""), qty = Math.abs(Number(row?.pos) || 0);
      if (!t || !(qty >= 0.01) || !(Number(row.cost) > 0)) continue;
      const book = owner847(t); if (!book) continue;
      const pin = pins[t]; if (pin && Date.now() - Date.parse(pin.at ?? "") < 20 * 60000) continue; // her slider is on it - her slider decides
      const res = await fetch(`https://external-api.kalshi.com/trade-api/v2/markets/${t}`, { signal: AbortSignal.timeout(6000) }); if (!res || !res.ok) continue;
      const m = (await res.json())?.market || {};
      const bid = Number(row.pos) > 0 ? Number.parseFloat(m.yes_bid_dollars ?? "0") : Number.parseFloat(m.no_bid_dollars ?? "0");
      const entry = Number(d780[t + ":e"]) > 0 ? Number(d780[t + ":e"]) : Number(row.cost) / qty;
      const step = judge847(Date.now(), { ticker: t, entry, bid, done75: done847(t, "75", d780, log780), done95: done847(t, "95", d780, log780) }, since);
      if (!step) continue;
      const { l75, l95 } = lines847(entry), line = Math.round((step === "75" ? l75 : l95) * 1000) / 10;
      if (handsOff) { if (!told[t + ":ho:" + step]) { told[t + ":ho:" + step] = Date.now(); alarm847("take profit overdue - hands off", `TP WATCHDOG: ${t} (${book}) is over her ${step}% line (${line}c, bid ${Math.round(bid * 100)}c) - HANDS OFF is on, so nothing was sold.`, { ticker: t, book, step, bid }); } continue; }
      // RESCUE (Love ~5:53 PM PT: "just set up a trigger that resets the take profits if ump catches that it didn't execute on a window"): re-arm and sell it here, the same sale her loop makes
      delete since[t];
      const now847 = new Date().toISOString();
      d780 = rj("tp780.json") || {}; d780[t + ":" + step] = now847; if (step === "95") d780[t + ":75"] ||= now847; if (!(Number(d780[t + ":e"]) > 0)) d780[t + ":e"] = entry;
      try { (await import("node:fs")).writeFileSync(f780, JSON.stringify(Object.fromEntries(Object.entries(d780).slice(-900)))); } catch {}
      let got: any = null;
      try { got = step === "75" ? await live.partLive(t, 50) : await live.flattenTicker(t, true, 0, false, Math.max(0.02, Math.round((bid - 0.01) * 100) / 100)); } catch { got = null; }
      try { appendFileSync(D("tp780.jsonl"), JSON.stringify({ at: now847, ticker: t, step: step === "75" ? "half at 75% of the way" : "rest at 95% of the way", line: Math.round((step === "75" ? l75 : l95) * 1000) / 1000, entry: Math.round(entry * 1000) / 1000, bid, pos: row.pos, owner: book, got, by: "watchdog847" }) + "\n"); } catch {}
      alarm847(got ? "take profit rescued" : "take profit rescue failed", got ? `TP RESCUED: ${t} (${book}) sat over her ${step}% line (${line}c) for 20 s without selling - the watchdog sold ${step === "75" ? "half" : "the rest"} at ~${Math.round(bid * 100)}c.` : `TP WATCHDOG: ${t} (${book}) - the rescue sale at her ${step}% line came back with no fill; it re-arms and tries again in 20 s. Close it by hand if you're there.`, { ticker: t, book, step, bid, entry, got: got ? true : false });
    }
  } catch (e) {
    alarm847("watchdog error", `TP WATCHDOG: the watchdog itself hit an error (${String((e as any)?.message || e).slice(0, 160)}).`);
  } finally { G.__tpw847Busy = false; }
}
/** for her ALERTS tab: every watchdog alarm from the last hour, newest first */
export function recent847(now = Date.now()): { at: string; text: string }[] {
  try { return readFileSync(D("alarm-tp-watchdog.jsonl"), "utf8").trim().split("\n").slice(-50).map((l) => JSON.parse(l)).filter((x) => now - Date.parse(x.at) < 3600000).reverse(); } catch { return []; }
}
