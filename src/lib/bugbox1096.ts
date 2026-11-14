// fix1096 BUG BOX (Love Nov 13 2026 9:03 PM PT: "i think it may be easier to keep track of everything if we create a bug box" + "every known bug, logged with
// either a check or hollow mark" + "let's make a new tab for it"). Read only. It reads one plain file, data/BUG-BOX.json. It is outside her engine
// (not in src/lib/desk) and changes nothing in her.
import { createServerFn } from "@tanstack/react-start";
export const getBugBox1096 = createServerFn({ method: "GET" }).handler(async () => {
  let bugs: any[] = [], note = "", at = "", err = "";
  try {
    const { readFileSync } = await import("node:fs"); const { join } = await import("node:path");
    const d = JSON.parse(readFileSync(join(process.cwd(), "data", "BUG-BOX.json"), "utf8"));
    bugs = Array.isArray(d?.bugs) ? d.bugs : []; note = String(d?.note ?? ""); at = String(d?.at ?? "");
  } catch (e) { err = "data/BUG-BOX.json could not be read (" + String(e).slice(0, 80) + ")"; }
  return { bugs, note, at, err };
});
