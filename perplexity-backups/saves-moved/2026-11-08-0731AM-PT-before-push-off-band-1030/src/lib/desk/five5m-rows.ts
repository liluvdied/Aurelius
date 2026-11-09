// THE WALLED-OFF 5M - HER ROWS + HER SWITCH (R169, Love Oct 29 2026 10:27 AM PT: "please create a SEPARATE BOOK FOR THAT MODEL. ITS SUPPOSED TO STAND ALONE FROM THE OTHERS. I CANNOT HAVE IT
// KEEP CHANGING EVRRYTIME WE REFINE THE OTHERS ... ONE ALTERATION TO ONE - DOES NOTTTTTTTTTTTTTTTT. DOES. NOT. TOUCH. THE 5M BOOK. WALLED OFF. PLEASE." + R173 10:58 AM: "october 27th please. she was
// at 79%. that's where she was when she was working"). A frozen copy of her Oct 27 4:57 AM PT save (data/SNAPSHOT-TODAY-2026-10-27-0457am), byte for byte except the wiring marked FIVE5M:
// its own memory (five5m-mem.ts), its own data folder (data/five5m/), its own frozen helpers. No other book's code imports this file; editing recon.ts / bandlock.ts / engine.ts never changes it.
// RECONSTRUCTION v2 — HER BONES (Love, Oct 19 2026 ~6:47 PM PT: "if a candle rejected the bottom band, and is rising from the bottom 33% of the
// channel i want her to long / if it rejected the top band and is falling from the top 33% of the channel, i want her to short / if it breaks the
// top band, i want her to long / if it breaks a lower band, i want her to short / same rules apply to pink / tap and rejection + candle
// falling/rising away from the pink band = trade away from the band in the direction of the rejection / a break of the pink band = trade in the
// direction of the break / those are the bones of it / that's a stable structure / can you build it?").
//
// Lines: her session bands (VWAP, +/-1,2,3 sigma, desk VWAP) + the pink 5m PP. No red/green (5m R/S) — not in her bones; say the word to add them.
// Entries (recon-ogp5):
//   BREAK     = the last closed 1m candle closed through a line, or live price has pushed through it from the candle's open side by her break
//               distance (BTC $6 / gold 33c) -> trade the direction of the break.
//   REJECTION = this 5m candle tapped a line (within BTC $3 / gold 30c) WITHOUT breaking it, and price is moving away from the tap by at least
//               the tap distance -> trade away from the band, in the rejection's direction.
// No wall-to-strike rule, no centre rule (the Oct 12 extras are out — her bones replace them). The door adds her 33% channel rule (no trade INTO
// an unbroken band in its third) and band-breaks-up-=-trade-up (bandlock channelOnly + candleDirOnly), feed health and a fresh price. Nothing else.
// recon-paper stays the Oct 12 PAPER 24/7 read (its tap-rejects are the same shape). TOGETHER = whichever speaks first in the window (live book).
//
// v1 (the byte-faithful Oct 12 decide) retired by Love after its 6:30 PM shorts into unbroken bands both lost: "her shorts into an unbroken band
// win maybe 1/5 times... that's a stable structure, can you build it?" — this build IS her re-signing of the spine lock.
// THIS FILE IS THE SPINE. data/spine-lock.json holds its sha256[:16]. Drift without Love re-signing = the three books stop booking.// FIVE5M: her own paper rows (data/five5m/grok-og.json, the same shape her Oct 27 read wrote) and her on/off switch (data/five5m/live-switch.json five5m.on).
// The desk's feed loop (pivotbooks.ts) hands her the same BTC market, bars and session read it hands the Kalshi books - read-only; she books only into her own rows.
import { readFileSync, writeFileSync } from "node:fs";
import { M5, D5 } from "./five5m-mem";
import { reconTick5m } from "./recon5m";
let onC = { at: 0, on: false };
export function fiveOn(): boolean {
  if (Date.now() - onC.at < 2000) return onC.on;
  let on = false; try { on = JSON.parse(readFileSync(D5("live-switch.json"), "utf8"))?.five5m?.on === true; } catch { on = false; }
  onC = { at: Date.now(), on }; return on;
}
function rows5(): any[] {
  if (!Array.isArray(M5.__five5mRows)) { try { const r = JSON.parse(readFileSync(D5("grok-og.json"), "utf8")); M5.__five5mRows = Array.isArray(r) ? r : []; } catch { M5.__five5mRows = []; } }
  return M5.__five5mRows;
}
export function fiveReadTick(id: string, a: any, m: any, left: number, b: any[], last1m: any): void {
  if (id !== "btc" || !fiveOn()) return; // her 5M is BTC only
  const rs = rows5(); let ch = false;
  try { ch = reconTick5m(id, a, m, left, b as any, last1m, rs); } catch { ch = false; }
  const now = Date.now();
  if (ch || now - Number(M5.__five5mSaved || 0) > 10000) {
    for (let i = rs.length - 1; i >= 0; i--) if (!(now - Date.parse(String(rs[i]?.at)) <= 3 * 3600000)) rs.splice(i, 1);
    try { writeFileSync(D5("grok-og.json"), JSON.stringify(rs.slice(0, 400))); } catch {}
    M5.__five5mSaved = now;
  }
}
const HOUR5 = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" });
// her rows in the shape her Oct 27 5m lane read them (grokog asNightRows on Oct 27: lane -> book, id ticker:book:rowId)
export function fiveNightRows5m(): any[] {
  const out: any[] = [];
  for (const r of rows5()) {
    const book = r?.lane === "recon-rej5" ? "recon-rej5" : r?.lane === "recon-tog" ? "recon-tog" : "";
    if (!book) continue;
    const ask = Number(r.ask) || 0;
    out.push({ id: `${r.ticker}:${book}:${r.id}`, book, at: r.at, asset: r.asset, ticker: r.ticker, side: r.side, setup: r.label, ask, multiple: Number(r.multiple) || (ask > 0 ? 1 / ask : 0), stake: Number(r.stake) || 20, tpPct: 0, peakPct: ask > 0 && r.peak ? Math.round(((Number(r.peak) / ask) - 1) * 1000) / 10 : 0, exit: r.exit, soldAt: r.soldAt, sellBid: null, result: r.result, pnl: r.pnl, bands: null, spot: null, event: null, hourPT: Number(HOUR5.format(new Date(r.at))) });
  }
  return out;
}
