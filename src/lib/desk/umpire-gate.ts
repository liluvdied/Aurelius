// THE UMPIRE AT THE WIRE (fix461, R185/R186/R187 - Love Oct 29 2026 11:46 AM PT: "can you make sure the umpire not only checks if the code is there, but THAT ITS ENFORCED.??? meaning,
// if the umpire doesnt call it safe against every cornerstone/rule , trade doesnt go out ?" + 11:50 AM: "just main and rejection for rn hun ... can we do this without making the orders lag
// with the umpire check? ... so they can go out seamlessly?" + 11:51 AM: "yes if the 46 other line items apply to other books yes wwe'll make it a report for rn"):
// every OPENING order of main (recon-tog) and rejection (recon-rej) needs the umpire's SAFE stamp (data/UMPIRE-VERDICT.json, written by tools/umpire-stamp.py) AND her running code
// must be exactly the code the umpire judged. ZERO LAG: the umpire runs in the background - at desk start and ~3 s after any change to src/lib/desk/*.ts - and her file fingerprints
// are kept warm on a 2 s clock; the order only reads two small objects in memory. Exits, take-profits and closes never come here (place() reduceOnly skips this whole block).
import { readFileSync, readdirSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
const G: any = globalThis as any;
export const UMP_BOOKS461 = ["recon-tog", "recon-rej"]; // Love 11:50 AM: "just main and rejection for rn"
const DIR = () => join(process.cwd(), "src", "lib", "desk"), VF = () => join(process.cwd(), "data", "UMPIRE-VERDICT.json");
const S: any = (G.__ump461 ||= { cur: {}, mt: {}, v: null, vAt: 0, running: false, dirtyAt: 0, lastRun: 0, timers: [], lastWhy: "" });
// the verdict, in memory only: the stamp must say SAFE and every file fingerprint must match her running code
export function umpireVerdict461(v: any, cur: Record<string, string>): string {
  if (!v || typeof v !== "object") return "THE UMPIRE has not checked her yet - no opening order until it says SAFE (fix461)";
  if (v.ok !== true) return `THE UMPIRE says NOT SAFE (${String(v.why || "unknown").slice(0, 160)}) - no opening order until it says SAFE (fix461)`;
  const h = v.hashes || {};
  if (!Object.keys(cur).length) return "THE UMPIRE GATE has not read her code yet - no opening order (fix461)";
  for (const k of new Set([...Object.keys(h), ...Object.keys(cur)])) if (h[k] !== cur[k]) return `CODE CHANGED SINCE THE UMPIRE SAID SAFE (${k}) - no opening order until the umpire re-checks her (fix461)`;
  return "";
}
export function umpireGate461(book: string): string {
  if (!String(book || "")) return ""; // fix558 (Love Oct 31 2026 12:09 AM PT: "The send path already refuses when the verdict is not SAFE. That refusal must now fire when rules are absent."): EVERY book's opening order needs SAFE (main, rejection, delayed, any book) - only her own hand trades (no book) pass
  const why = umpireVerdict461(S.v, S.cur);
  if (why && why !== S.lastWhy) { S.lastWhy = why; try { appendFileSync(join(process.cwd(), "data", "umpire-blocks.jsonl"), JSON.stringify({ at: new Date().toISOString(), book, why }) + "\n"); } catch {} }
  if (!why) S.lastWhy = "";
  return why;
}
function restamp() {
  S.running = true; S.lastRun = Date.now();
  try { execFile("python3", ["tools/umpire-stamp.py"], { cwd: process.cwd(), timeout: 240000 }, () => { S.running = false; S.vAt = 0; scanVerdict(); }); } catch { S.running = false; }
}
function scanVerdict() { try { const m = statSync(VF()).mtimeMs; if (m !== S.vAt) { S.vAt = m; S.v = JSON.parse(readFileSync(VF(), "utf8")); } } catch {} }
function scan() {
  try {
    const fs = readdirSync(DIR()).filter((f) => f.endsWith(".ts")), seen = new Set(fs);
    for (const f of fs) { const p = join(DIR(), f), m = statSync(p).mtimeMs; if (S.mt[f] !== m) { S.mt[f] = m; S.cur[f] = createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16); S.dirtyAt = Date.now(); } }
    for (const f of Object.keys(S.cur)) if (!seen.has(f)) { delete S.cur[f]; delete S.mt[f]; S.dirtyAt = Date.now(); }
  } catch {}
  scanVerdict();
  if (S.running) return;
  const why = umpireVerdict461(S.v, S.cur);
  // re-check her: code changed (3 s after the last change settles), no stamp yet, or NOT SAFE (retry every 5 min)
  if ((why.startsWith("CODE CHANGED") && Date.now() - S.dirtyAt >= 3000) || (!S.v && Date.now() - S.lastRun > 60000) || (S.v && S.v.ok !== true && Date.now() - S.lastRun > 300000)) restamp();
}
// fix477 (Love Oct 29 2026 4:47 PM PT: "please make sure the umpire doesn't just do that and actually makes sure each thing stays in place"): the umpire also
// re-checks her ~3 s after her SETTINGS change (data/live-switch.json), not only her code. Her own hands that the wire seal already lets through - LIVE, the size
// slider and the notes/stamps they write (live, maxDollars, note, at, liveBook dollars/note/at/since) - do not trigger it; every other setting does.
function settingsPrint477(): string {
  try {
    const sw: any = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
    for (const k of ["live", "maxDollars", "note", "at"]) delete sw[k];
    if (sw.liveBook && typeof sw.liveBook === "object") for (const x of ["dollars", "note", "at", "since"]) delete sw.liveBook[x];
    return createHash("sha256").update(JSON.stringify(sw)).digest("hex").slice(0, 16);
  } catch { return ""; }
}
// fix478 (Love Oct 29 2026 4:51 PM PT: "i don't want to have to do this every time i change the schedule pls"): data/schedule-approved.json says pending while the pill takes her fresh save (at most 2 min)
function pillSaving478(): boolean { try { const a = JSON.parse(readFileSync(join(process.cwd(), "data", "schedule-approved.json"), "utf8")); return a?.pending === true && Date.now() - Date.parse(String(a.at)) < 120000; } catch { return false; } }
function scanSettings477() {
  try {
    const m = statSync(join(process.cwd(), "data", "live-switch.json")).mtimeMs;
    if (m !== S.swMt477) { S.swMt477 = m; const p = settingsPrint477(); if (p && S.swPrint477 === undefined) S.swPrint477 = p; else if (p && p !== S.swPrint477) { S.swPrint477 = p; S.swDirty477 = Date.now(); } }
    if (S.swDirty477 && pillSaving478()) return; // fix478: the schedule pill is still taking her fresh save - re-check right after it
    if (S.swDirty477 && Date.now() - S.swDirty477 >= 3000 && !S.running) { S.swDirty477 = 0; restamp(); }
  } catch {}
}
for (const t of S.timers || []) clearInterval(t);
S.timers = [setInterval(scan, 2000)];
S.timers.push(setInterval(scanSettings477, 2000));
scan();
G.__umpGate461 = umpireGate461;
