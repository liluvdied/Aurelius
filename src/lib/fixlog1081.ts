// fix1081 FIX LOG (Love Nov 10 2026 3:30 PM PT: "please create a FIX LOG tab in the app, that gives a brief description of each change, and what we fixed,
// and how to fix it again if we EVER run into this again" + 3:37 PM PT: "with an explanation on what we changed, and how to get back. if she evaporates on me again").
// Read only. It reads one plain file, data/FIX-LOG.json, and her save point tags. It is outside her engine (not in src/lib/desk) and changes nothing in her.
import { createServerFn } from "@tanstack/react-start";
export const getFixLog1081 = createServerFn({ method: "GET" }).handler(async () => {
  let entries: any[] = [], back: any[] = [], saves: string[] = [], err = "";
  try {
    const { readFileSync } = await import("node:fs"); const { join } = await import("node:path");
    const d = JSON.parse(readFileSync(join(process.cwd(), "data", "FIX-LOG.json"), "utf8"));
    entries = Array.isArray(d?.entries) ? d.entries : []; back = Array.isArray(d?.back) ? d.back : [];
  } catch (e) { err = "data/FIX-LOG.json could not be read (" + String(e).slice(0, 80) + ")"; }
  try {
    const { execFileSync } = await import("node:child_process");
    saves = String(execFileSync("git", ["tag", "-l", "whole-save-*", "--sort=-creatordate"], { cwd: process.cwd(), timeout: 4000 })).split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12);
  } catch {}
  return { entries, back, saves, err };
});
