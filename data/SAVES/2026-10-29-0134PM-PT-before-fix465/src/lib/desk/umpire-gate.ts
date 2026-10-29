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
  if (!UMP_BOOKS461.includes(String(book))) return "";
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
for (const t of S.timers || []) clearInterval(t);
S.timers = [setInterval(scan, 2000)];
scan();
G.__umpGate461 = umpireGate461;
