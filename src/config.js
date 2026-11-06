// Reads the core's own two files, from the core's own folder only. Nothing outside this folder is ever read.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DATA = join(ROOT, "data");

const readJson = (name) => JSON.parse(readFileSync(join(ROOT, name), "utf8"));

let cache = { at: 0, tol: null, rails: null };
/** Tolerances and rails, re-read at most every 2 s so Love's edits apply without a restart. */
export function settings() {
  if (Date.now() - cache.at > 2000) cache = { at: Date.now(), tol: readJson("tolerances.json"), rails: readJson("rails.json") };
  return { tol: cache.tol, rails: cache.rails };
}

/** The LIVE switch: data/live.json {"live": true}. Missing or unreadable = paper. */
export function liveSwitchOn() {
  try { return JSON.parse(readFileSync(join(DATA, "live.json"), "utf8")).live === true; } catch { return false; }
}
