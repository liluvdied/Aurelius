// Puts the frozen spine back. The repertoire stays in spine/REPERTOIRE and is not loaded.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = "/workspace";
const FROM = join(ROOT, "spine", "SPINE-2.0");
const files = JSON.parse(readFileSync(join(FROM, "FILES.json"), "utf8"));
let wrote = 0;
for (const rel of files) {
  if (typeof rel !== "string" || rel.includes("..") || rel.startsWith("data/")) continue;
  const fresh = readFileSync(join(FROM, rel));
  for (const onto of [ROOT, join(ROOT, "spine", "THIS-ONE")]) {
    const to = join(onto, rel);
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, fresh);
    wrote += 1;
  }
}
writeFileSync(
  join(ROOT, "data", "profile.json"),
  JSON.stringify({ active: "spine", at: new Date().toISOString(), spine: "spine/SPINE-2.0" }, null, 2),
);
console.log(JSON.stringify({ active: "spine", restored: wrote, at: new Date().toISOString() }));
