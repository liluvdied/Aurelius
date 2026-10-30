// One switch. Copies one profile over the live desk and over the hourly copy.
// The other profile is not loaded, so the two cannot run at the same time.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = "/workspace";
// DISABLED by Claude 2026-10-01: copying a profile over the live desk is how it kept
// landing on the bad model. The route lives in data/live-switch.json now.
console.log(JSON.stringify({ disabled: true }));
process.exit(0);
const name = process.argv[2] === "spine" ? "spine" : process.argv[2] === "repertoire" ? "repertoire" : "";
if (!name) {
  console.log(JSON.stringify({ error: "use spine or repertoire" }));
  process.exit(1);
}
const fromRoot = join(ROOT, "spine", name === "spine" ? "SPINE-2.0" : "REPERTOIRE");
const files = JSON.parse(readFileSync(join(fromRoot, "FILES.json"), "utf8"));
let wrote = 0;
for (const rel of files) {
  if (typeof rel !== "string" || rel.includes("..") || rel.startsWith("data/")) continue;
  const fresh = readFileSync(join(fromRoot, rel));
  for (const onto of [ROOT, join(ROOT, "spine", "THIS-ONE")]) {
    const to = join(onto, rel);
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, fresh);
  }
  wrote += 1;
}
writeFileSync(
  join(ROOT, "data", "profile.json"),
  JSON.stringify({ active: name, at: new Date().toISOString(), spine: "spine/SPINE-2.0" }, null, 2),
);
console.log(JSON.stringify({ active: name, files: wrote, at: new Date().toISOString() }));
