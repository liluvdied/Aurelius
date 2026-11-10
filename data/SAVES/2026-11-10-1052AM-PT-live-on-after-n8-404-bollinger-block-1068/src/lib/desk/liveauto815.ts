// fix815 LIVE COMES BACK BEFORE THE WINDOW (Love Nov 6 2026 ~8:46 AM PT: "can you have it post a toast after 3 minutes if it's off ? and a flashing orange light  and have it set to turn itself back on before the window starts if i turned it off to do commands pls lol  if i'm not doing commands i never turned it off on purpose lol").
// About 15 s before each 15-minute window opens, if LIVE is off it is turned back on through the desk's own LIVE-on path (live-guard writeSwitch + liveBook.since, exactly what her LIVE
// button does - no rail, seal or size touched) - ONLY when ALL hold: no CHANGE / RUN-ALL install is running (process check), the umpire's verdict is SAFE, entries are not halted, and she
// has not set OFF FOR THE DAY (data/live-off-hold-815.json). Otherwise it stays off and the reason is logged. Every try goes to data/live-auto-on-815.jsonl. live-switch autoLive815 false = off.
// fix1025 LIVE KICKSTARTS ITSELF (Love Nov 7 2026 11:55 PM PT: "can we actually actually actually implement the kickstart if an install was in progress and i forgot to turn it back on afterwards hun? / 60 seconds before a window / i want it on for every window - indefinitely ok / have it kickstart itself back up , if i want to turn it off i will turn it off off myself"):
// (1) it fires 60 s before EVERY 5-minute window (:x0 / :x5 - every 15m window is one of them too), not just the 15m cycle. (2) An install only keeps LIVE off while it is SWAPPING FILES
// (part 1): every CHANGE / RUN-ALL now writes data/install-phase-1025.json { phase: "part1" | "part2" | "done", at, cmd }. part2 / done never block; a part1 marker older than 20 min is stale
// (ignored + logged). The old process check stays only as the fallback: with no marker at all, and for an old-shape install script that writes no marker. Umpire SAFE, halt, OFF FOR THE DAY
// and autoLive815 are unchanged.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const LEAD815 = 60; // seconds before the window opens - fix852 (Love Nov 6 2026 ~6:48 PM PT: "every time i leave it off bro lmao can you still have it turn itself on 60 seconds before a window starts if i forget bb?"): 60 s, and it keeps trying every second of that minute
export const CYCLE1025 = 300; // fix1025: every 5-minute window (:00 :05 :10 ... :55) - the 15m windows are all among them
export const STALE1025 = 20 * 60 * 1000; // fix1025: a part1 marker older than 20 min is stale (the install died or was closed) - ignored and logged
export type Check815 = { live: boolean; installing: boolean; umpireSafe: boolean; halted: boolean; holdUntil: number; switchOn: boolean };
export type Phase1025 = { phase?: string; at?: string; cmd?: string } | null;
/** fix1025 pure: does an install keep LIVE off? marker = data/install-phase-1025.json; procs = install scripts of HER desk running now (null = can't tell);
 *  oldShape(p) = that running script writes no phase marker (an install from before fix1025). Only part 1 (files being swapped) blocks. */
export function install1025(marker: Phase1025, nowMs: number, procs: string[] | null, oldShape: (p: string) => boolean): { installing: boolean; stale: boolean; why: string } {
  let stale = false;
  if (marker && marker.phase) {
    if (marker.phase === "part1") {
      const age = nowMs - (Date.parse(String(marker.at || "")) || 0);
      if (age < STALE1025) return { installing: true, stale, why: "an install is swapping files (part 1, LIVE off)" };
      stale = true; // fix1025: older than 20 min - ignored
    }
    const old = (procs || []).filter(oldShape); // fix1025: an old-shape install writes no marker, so only the process check can speak for it
    return old.length ? { installing: true, stale, why: "an old-shape CHANGE / RUN-ALL install is running" } : { installing: false, stale, why: "" };
  }
  if (procs === null) return { installing: true, stale, why: "a CHANGE / RUN-ALL install is running" }; // no marker + can't tell = treat as installing (never fights a command)
  return procs.length ? { installing: true, stale, why: "a CHANGE / RUN-ALL install is running" } : { installing: false, stale, why: "" };
}
/** pure: what to do this second. "" = nothing; "on" = turn LIVE on; otherwise the reason it stays off */
export function decide815(c: Check815, nowMs: number): string {
  if (c.live) return "";
  const toNext = CYCLE1025 - Math.floor(nowMs / 1000) % CYCLE1025; // fix1025: seconds to the next 5-minute window (:x0 / :x5)
  if (toNext > LEAD815) return "";
  if (!c.switchOn) return "auto LIVE-on is switched off (live-switch autoLive815 false)";
  if (c.holdUntil > nowMs) return "OFF FOR THE DAY is set";
  if (c.installing) return "a CHANGE / RUN-ALL install is running";
  if (!c.umpireSafe) return "the umpire is not SAFE";
  if (c.halted) return "entries are halted by her safety guard";
  return "on";
}
function readJ(f: string): any { try { return JSON.parse(readFileSync(D(f), "utf8")); } catch { return null; } }
/** fix1025: the install scripts of HER desk running now, as file paths (null = can't tell) */
export function installProcs1025(): string[] | null {
  // fix852: only HER desk's installs count (a process whose working folder or command line is this desk) - a rehearsal copy elsewhere never keeps her LIVE off
  try { const out = execSync("pgrep -f 'STAGED-CHANGE-[^ ]*/apply[0-9a-z]*\\.sh|BATCH-RUNNER/run-all\\.sh|BATCH-RUNS/[^ ]*-part[12]\\.sh' || true", { encoding: "utf8", timeout: 1500 }); const me = process.cwd(); const found: string[] = [];
    for (const pid of out.split(/\s+/).filter(Boolean)) { let args = "", cwd = ""; try { args = execSync(`ps -o args= -p ${pid}`, { encoding: "utf8", timeout: 1000 }); } catch {} try { cwd = (execSync(`lsof -a -p ${pid} -d cwd -Fn`, { encoding: "utf8", timeout: 1500 }).split("\n").find((l) => l.startsWith("n")) || "").slice(1); } catch {} if (args.includes(me) || cwd === me) { const m = args.match(/STAGED-CHANGE-[^ /]*\/apply[0-9a-z]*\.sh|BATCH-RUNNER\/run-all\.sh|BATCH-RUNS\/[^ ]*-part[12]\.sh/); found.push(m ? join(me, "data", m[0]) : "?"); } }
    return found; } catch { return null; } // can't tell
}
export function installing815(): boolean { return install1025(readJ("install-phase-1025.json"), Date.now(), installProcs1025(), oldShape1025).installing; } // fix1025: the phase marker first; the process check is the fallback
function oldShape1025(p: string): boolean { try { return !readFileSync(p, "utf8").includes("install-phase-1025"); } catch { return true; } } // fix1025: unreadable = treat as old shape (blocks)
export async function liveAutoTick815(nowMs = Date.now()) {
  try {
    const toNext = CYCLE1025 - Math.floor(nowMs / 1000) % CYCLE1025; if (toNext > LEAD815) return; // fix1025: every 5-minute window
    const win = Math.floor(nowMs / (CYCLE1025 * 1000)) + 1; if (G.__live815Win === win) return;
    const sw = readJ("live-switch.json") || {}; if (sw.live === true) { G.__live815Win = win; return; }
    const hold = readJ("live-off-hold-815.json"), umpire = readJ("UMPIRE-VERDICT.json"), halt = readJ("halt.json");
    const mk = readJ("install-phase-1025.json"), inst = install1025(mk, nowMs, mk && mk.phase === "part1" && nowMs - (Date.parse(String(mk.at || "")) || 0) < STALE1025 ? [] : installProcs1025(), oldShape1025); // fix1025: a fresh part1 marker needs no process check
    if (inst.stale && G.__stale1025 !== String(mk?.at)) { G.__stale1025 = String(mk?.at); try { appendFileSync(D("live-auto-on-815.jsonl"), JSON.stringify({ at: new Date(nowMs).toISOString(), window: new Date(win * CYCLE1025 * 1000).toISOString(), action: "stale install marker ignored (fix1025)", why: `part1 marker from ${mk?.cmd || "?"} at ${mk?.at || "?"} is older than 20 min` }) + "\n"); } catch {} }
    const why = decide815({ live: sw.live === true, installing: inst.installing, umpireSafe: umpire?.ok === true, halted: halt?.off === true, holdUntil: Date.parse(String(hold?.until || "")) || 0, switchOn: sw.autoLive815 !== false }, nowMs);
    if (!why) return;
    if (why !== "on") { if (G.__live815Why === win + why) return; G.__live815Why = win + why; } // fix852: keeps trying every second of the last 60 s; each reason logged once
    let done = false;
    if (why === "on") {
      const lg = await import("./live-guard");
      lg.writeSwitch({ live: true, note: "Turned on automatically before the window (fix815 / fix852)" } as any);
      try { const raw = JSON.parse(readFileSync(D("live-switch.json"), "utf8")); if (raw.liveBook) { raw.liveBook.since = new Date().toISOString(); const { writeFileSync, renameSync } = await import("node:fs"); writeFileSync(D("live-switch.json.tmp815"), JSON.stringify(raw, null, 2)); renameSync(D("live-switch.json.tmp815"), D("live-switch.json")); } } catch {}
      done = readJ("live-switch.json")?.live === true;
      if (done) { G.__live815Win = win; try { appendFileSync(D("alarm-tp-watchdog.jsonl"), JSON.stringify({ at: new Date(nowMs).toISOString(), kind: "live auto-on", text: `LIVE AUTO-ON: LIVE was off ${Math.round((win * CYCLE1025 * 1000 - nowMs) / 1000)} s before the ${new Date(win * CYCLE1025 * 1000).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })} window - turned back on (umpire SAFE, entries clear, no install swapping files).` }) + "\n"); } catch {} } // fix852: tells her on ALERTS
    }
    try { appendFileSync(D("live-auto-on-815.jsonl"), JSON.stringify({ at: new Date(nowMs).toISOString(), window: new Date(win * CYCLE1025 * 1000).toISOString(), action: why === "on" ? (done ? "LIVE turned on" : "tried - LIVE still off") : "stayed off", why: why === "on" ? "" : (why.includes("install") && inst.why ? inst.why : why) }) + "\n"); } catch {}
  } catch {}
}
/** for the page: how long LIVE has been off, the hold, and the last auto-on line */
export function liveAutoStatus815() {
  const sw = readJ("live-switch.json") || {}, hold = readJ("live-off-hold-815.json");
  let last: any = null; try { const t = readFileSync(D("live-auto-on-815.jsonl"), "utf8").trim().split("\n"); last = JSON.parse(t[t.length - 1]); } catch {}
  return { live: sw.live === true, offSince: sw.live === true ? null : String(sw.at || ""), holdUntil: hold?.until || null, last };
}
if (G.__live815) clearInterval(G.__live815); // fix1025: a reloaded module (her install swapping this file) takes over the tick - one timer, always the newest code
G.__live815 = setInterval(() => { void liveAutoTick815(); }, 1000);
