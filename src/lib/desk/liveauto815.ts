// fix815 LIVE COMES BACK BEFORE THE WINDOW (Love Nov 6 2026 ~8:46 AM PT: "can you have it post a toast after 3 minutes if it's off ? and a flashing orange light  and have it set to turn itself back on before the window starts if i turned it off to do commands pls lol  if i'm not doing commands i never turned it off on purpose lol").
// About 15 s before each 15-minute window opens, if LIVE is off it is turned back on through the desk's own LIVE-on path (live-guard writeSwitch + liveBook.since, exactly what her LIVE
// button does - no rail, seal or size touched) - ONLY when ALL hold: no CHANGE / RUN-ALL install is running (process check), the umpire's verdict is SAFE, entries are not halted, and she
// has not set OFF FOR THE DAY (data/live-off-hold-815.json). Otherwise it stays off and the reason is logged. Every try goes to data/live-auto-on-815.jsonl. live-switch autoLive815 false = off.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export const LEAD815 = 15; // seconds before the window opens
export type Check815 = { live: boolean; installing: boolean; umpireSafe: boolean; halted: boolean; holdUntil: number; switchOn: boolean };
/** pure: what to do this second. "" = nothing; "on" = turn LIVE on; otherwise the reason it stays off */
export function decide815(c: Check815, nowMs: number): string {
  if (c.live) return "";
  const toNext = 900 - Math.floor(nowMs / 1000) % 900; // seconds to the next :00 / :15 / :30 / :45
  if (toNext > LEAD815) return "";
  if (!c.switchOn) return "auto LIVE-on is switched off (live-switch autoLive815 false)";
  if (c.holdUntil > nowMs) return "OFF FOR THE DAY is set";
  if (c.installing) return "a CHANGE / RUN-ALL install is running";
  if (!c.umpireSafe) return "the umpire is not SAFE";
  if (c.halted) return "entries are halted by her safety guard";
  return "on";
}
function readJ(f: string): any { try { return JSON.parse(readFileSync(D(f), "utf8")); } catch { return null; } }
export function installing815(): boolean {
  try { const out = execSync("pgrep -f 'STAGED-CHANGE-[^ ]*/apply[0-9a-z]*\\.sh|BATCH-RUNNER/run-all\\.sh' || true", { encoding: "utf8", timeout: 1500 }); return out.trim().length > 0; } catch { return true; } // can't tell = treat as installing (never fights a command)
}
export async function liveAutoTick815(nowMs = Date.now()) {
  try {
    const toNext = 900 - Math.floor(nowMs / 1000) % 900; if (toNext > LEAD815) return;
    const win = Math.floor(nowMs / 900000) + 1; if (G.__live815Win === win) return;
    const sw = readJ("live-switch.json") || {}; if (sw.live === true) { G.__live815Win = win; return; }
    G.__live815Win = win;
    const hold = readJ("live-off-hold-815.json"), umpire = readJ("UMPIRE-VERDICT.json"), halt = readJ("halt.json");
    const why = decide815({ live: sw.live === true, installing: installing815(), umpireSafe: umpire?.ok === true, halted: halt?.off === true, holdUntil: Date.parse(String(hold?.until || "")) || 0, switchOn: sw.autoLive815 !== false }, nowMs);
    if (!why) return;
    let done = false;
    if (why === "on") {
      const lg = await import("./live-guard");
      lg.writeSwitch({ live: true, note: "Turned on automatically 15 s before the window (fix815)" } as any);
      try { const raw = JSON.parse(readFileSync(D("live-switch.json"), "utf8")); if (raw.liveBook) { raw.liveBook.since = new Date().toISOString(); const { writeFileSync, renameSync } = await import("node:fs"); writeFileSync(D("live-switch.json.tmp815"), JSON.stringify(raw, null, 2)); renameSync(D("live-switch.json.tmp815"), D("live-switch.json")); } } catch {}
      done = readJ("live-switch.json")?.live === true;
    }
    try { appendFileSync(D("live-auto-on-815.jsonl"), JSON.stringify({ at: new Date(nowMs).toISOString(), window: new Date(win * 900000).toISOString(), action: why === "on" ? (done ? "LIVE turned on" : "tried - LIVE still off") : "stayed off", why: why === "on" ? "" : why }) + "\n"); } catch {}
  } catch {}
}
/** for the page: how long LIVE has been off, the hold, and the last auto-on line */
export function liveAutoStatus815() {
  const sw = readJ("live-switch.json") || {}, hold = readJ("live-off-hold-815.json");
  let last: any = null; try { const t = readFileSync(D("live-auto-on-815.jsonl"), "utf8").trim().split("\n"); last = JSON.parse(t[t.length - 1]); } catch {}
  return { live: sw.live === true, offSince: sw.live === true ? null : String(sw.at || ""), holdUntil: hold?.until || null, last };
}
if (!G.__live815) G.__live815 = setInterval(() => { void liveAutoTick815(); }, 1000);
