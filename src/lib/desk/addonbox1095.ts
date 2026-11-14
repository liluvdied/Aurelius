// fix1095 ONE ADD-ON PER BOX (Love Nov 13 2026 8:34 PM PT: "yes please , when i said no limit i was referring to the multiple itself hun /: not the amount of add ons to take ,
// 1 add on , at the numbers in the boxes would be perfect hun thank you", answering: "Each add-on box fires once a window, at its own dollars and its own multiple, and nothing more.
// With your boxes today that is $2 once at 3.8x and $1 once at 8.8x. Yes?"). Her trigger add-on (fix1043: a genuine same-side set up, strictly better than her entry, through her door)
// stays exactly as it is; this only decides WHICH BOX a trigger may spend: a box that is on, not yet spent in this window, with the ask at that box's multiple or better.
// Box 2 first, then box 3. When no box is left, or the multiple is not there, the trigger adds nothing. One shared function for every place her trigger add-on lives.
import { readFileSync } from "node:fs";
import { join } from "node:path";
export type Box1095 = { k: string; on: boolean; dollars: number; mult: number };
export type Pick1095 = { k: string; dollars: number; mult: number; cap: number };
const HOLD_MS = 20000; // an add-on order in flight holds its box, so a second trigger cannot spend the same box before the first has answered
/** Her boxes 2 and 3 as her settings hold them (data/addon-settings.json through the desk's own reader). */
export function boxesOf1095(s: any): Box1095[] {
  const out: Box1095[] = [];
  for (const n of [2, 3]) { const b = (s && s["addOn" + n]) || {}; out.push({ k: "add" + n, on: b.on === true, dollars: Math.max(0, Math.min(5, Math.round(Number(b.dollars) || 0))), mult: Number(b.mult) > 0 ? Number(b.mult) : 0 }); }
  return out;
}
/** The one box this trigger may spend, or null. `used` is that window's record: used["box1095:add2"] = spent, used["hold1095:add2"] = an order for it is in flight. */
export function boxPick1095(boxes: Box1095[], ask: number, used: Record<string, any> | null | undefined, nowMs: number = Date.now()): Pick1095 | null {
  const a = Number(ask), u = used || {};
  if (!(a > 0.02 && a < 1) || !Array.isArray(boxes)) return null;
  for (const k of ["add2", "add3"]) {
    const b = boxes.find((x) => x && x.k === k);
    if (!b || b.on !== true || !(Number(b.dollars) >= 1) || !(Number(b.mult) >= 1.5)) continue;
    if (u["box1095:" + k]) continue; // this box already added once in this window
    { const h = Number(u["hold1095:" + k] || 0); if (h > 0 && nowMs - h < HOLD_MS) continue; } // its order is still out
    const cap = Math.floor((1 / Number(b.mult)) * 10000) / 10000;
    if (!(a <= cap + 1e-9)) continue; // the multiple in the box is not here
    return { k, dollars: Number(b.dollars), mult: Number(b.mult), cap };
  }
  return null;
}
/** Her Kalshi desk's record per window (ticker), kept in memory and re-read from data/addon-log.jsonl after a restart, so a box spent before a restart stays spent. */
export function used1095(ticker: string): Record<string, any> {
  const G = globalThis as any;
  if (!G.__box1095) {
    const s: Record<string, Record<string, any>> = {};
    try { for (const ln of readFileSync(join(process.cwd(), "data", "addon-log.jsonl"), "utf8").split("\n").slice(-800)) { try { const x = JSON.parse(ln); if (x && x.ok && x.box1095 && x.ticker) (s[x.ticker] ||= {})["box1095:" + String(x.box1095)] = Date.parse(x.at) || Date.now(); } catch {} } } catch {}
    G.__box1095 = s;
  }
  return (G.__box1095[String(ticker)] ||= {});
}
export function hold1095(used: Record<string, any>, k: string, nowMs: number = Date.now()) { try { used["hold1095:" + k] = nowMs; } catch {} }
/** The order answered: a fill spends the box for the window; a miss frees it for her next trigger. */
export function spend1095(used: Record<string, any>, k: string, filled: boolean, nowMs: number = Date.now()) { try { delete used["hold1095:" + k]; if (filled) used["box1095:" + k] = nowMs; } catch {} }
