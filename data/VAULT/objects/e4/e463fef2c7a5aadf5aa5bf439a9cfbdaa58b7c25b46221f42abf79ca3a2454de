// BEHAVIOUR UMPIRE (Love Oct 28 2026 6:22 PM PT) - wrapper: the package is an ES module, the umpire itself is tools/behaviour-umpire.cjs
import { spawnSync } from "node:child_process"; import { fileURLToPath } from "node:url"; import { dirname, join } from "node:path";
const r = spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), "behaviour-umpire.cjs"), ...process.argv.slice(2)], { stdio: "inherit" });
process.exit(r.status ?? 1);
