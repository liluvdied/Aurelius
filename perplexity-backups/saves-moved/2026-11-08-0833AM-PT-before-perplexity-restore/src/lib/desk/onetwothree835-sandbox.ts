// fix835 1-2-3 · SEALED · PAPER - THE SANDBOX (not frozen; plumbing only). PAPER ONLY - nothing here sends, signs or places an order.
// Her PRE295 rules (onetwothree835-recon / -walls / -lines and the frozen blocks in onetwothree835.ts) run byte for byte, but every name they reach outside
// themselves resolves HERE instead of on the live desk:
//   - "globalThis" in those files is this SANDBOX object - never the live desk's globals, so her frozen walls can't read (or write) a later fix's state;
//   - quoteTick / feedHealth read the price and feed health the 1-2-3 tick copied in (SANDBOX.__q835 / __fh835);
//   - readFileSync serves live-switch.json as it stood around PRE295 (LIVE_SWITCH_PRE295, from data/live-switch.json.pre-fix313.bak) and refuses every
//     other desk file except sess-carry.json (her session-band carry, read once); appendFileSync / writeFileSync / readdirSync do nothing.
import { readFileSync as fsRead } from "node:fs";

export const SANDBOX: any = { __symBtc: "PEPPERSTONE:BTCUSD" /* PRE295 pivotbooks SYM.btc: her session starts 5 PM ET */ };
// the four wall settings her PRE295 walls read from live-switch.json (bandReach / zoneReach / channelPct / channelPctTop), frozen at their Oct 26 values
export const LIVE_SWITCH_PRE295 = '{"bandReach":{"gold":1.5},"zoneReach":{"gold":1.11},"channelPct":{"gold":0.33,"btc":0.33},"channelPctTop":{"gold":0.33,"btc":0.33}}';
export function quoteTick(asset: string): { c: number; at: number } | null {
  const q = SANDBOX.__q835?.[asset];
  return q && Number(q.c) > 0 ? q : null;
}
export function feedHealth(asset: string): { ok: boolean; why: string } {
  return SANDBOX.__fh835?.[asset] || { ok: false, why: "no ticks yet" };
}
export function readFileSync(p: any, enc?: any): any {
  const f = String(p);
  if (/(^|\/)live-switch\.json$/.test(f)) return LIVE_SWITCH_PRE295;
  if (/(^|\/)sess-carry\.json$/.test(f)) return SANDBOX.__sessCarryFile835 ?? fsRead(p, enc);
  throw new Error(`sealed 1-2-3: ${f} is not read by this book`);
}
export const appendFileSync = (..._a: any[]): void => {};
export const writeFileSync = (..._a: any[]): void => {};
export const readdirSync = (..._a: any[]): string[] => [];
/** the live desk's real globals (only the 1-2-3 tick reads them, to copy her bars / tick trail into the sandbox) */
export function liveGlobals(): any {
  return globalThis as any;
}
