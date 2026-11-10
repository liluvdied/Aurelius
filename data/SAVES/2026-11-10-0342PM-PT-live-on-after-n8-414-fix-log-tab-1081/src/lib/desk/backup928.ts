// fix928 THE DESK BACKS HERSELF UP EVERY HOUR (Love Nov 7 2026 ~4:16 AM PT: "yeup i am gonna be on git religiously from now on you can believe that" + "super glad that hourly push you definitely set in place for me totally worked"):
// the old hourly backup was a loop started from a Terminal window and died at the Nov 3 ~1 PM restart. Now the desk itself runs her own backup tool
// (tools/github-backup.sh --once: secret scan first, fail-closed, pushes only the desk-backup branch) once when the desk starts and then every hour.
// Never blocks, never touches trading, an order, a book or a setting: a detached, niced child process; its output and any failure go to data/github-backup.log only.
import { appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const HOUR928 = 3600 * 1000;
export function backupTick928(): void {
  try {
    const G = globalThis as any, now = Date.now();
    if (G.__backup928At && now - G.__backup928At < HOUR928) return; // once at start, then hourly
    if (G.__backup928Busy) return;
    G.__backup928At = now; G.__backup928Busy = true;
    const cwd = process.cwd(), log = join(cwd, "data", "github-backup.log"), sh = join(cwd, "tools", "github-backup.sh");
    if (!existsSync(sh)) { G.__backup928Busy = false; try { appendFileSync(log, `${new Date().toISOString()} desk backup (fix928): tools/github-backup.sh is missing - nothing pushed\n`); } catch {} return; }
    void (async () => {
      try {
        const { spawn } = await import("node:child_process");
        const ch = spawn("nice", ["-n", "19", "/bin/bash", sh, "--once"], { cwd, detached: true, stdio: ["ignore", "pipe", "pipe"] });
        const out = (b: any) => { try { appendFileSync(log, String(b)); } catch {} };
        ch.stdout?.on("data", out); ch.stderr?.on("data", out);
        const done = () => { G.__backup928Busy = false; };
        ch.on("error", (e: any) => { done(); out(`${new Date().toISOString()} desk backup (fix928) could not start: ${String(e?.message || e)}\n`); });
        ch.on("exit", done);
        setTimeout(() => { if (G.__backup928Busy) { try { ch.kill(); } catch {} G.__backup928Busy = false; out(`${new Date().toISOString()} desk backup (fix928): stopped after 10 minutes - next try in an hour\n`); } }, 600000).unref?.();
        ch.unref();
      } catch (e: any) { G.__backup928Busy = false; try { appendFileSync(log, `${new Date().toISOString()} desk backup (fix928) failed: ${String(e?.message || e)}\n`); } catch {} }
    })();
  } catch {}
}
