// Restore the frozen checkpoint over the live model. Says nothing if it already matches.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = "/workspace";
const FROM = join(ROOT, "spine", "THIS-ONE");
const files = JSON.parse(readFileSync(join(FROM, "FILES.json"), "utf8"));
let wrote = 0;
for (const rel of files) {
  if (typeof rel !== "string" || rel.includes("..")) continue;
  const from = join(FROM, rel);
  const to = join(ROOT, rel);
  const fresh = readFileSync(from);
  let current = null;
  try {
    current = readFileSync(to);
  } catch {
    current = null;
  }
  if (current && fresh.equals(current)) continue;
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, fresh);
  wrote += 1;
}
console.log(JSON.stringify({ restored: wrote, files: files.length, at: new Date().toISOString() }));
