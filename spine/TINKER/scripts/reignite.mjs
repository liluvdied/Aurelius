// Outside the desk. Every 30 minutes this turns the engine back on if the
// in-process monitor never noticed it had stopped. A live heartbeat is left alone.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import { join } from "node:path";

const ROOT = "/workspace";
const EVERY = 10 * 60 * 1000;
const STALE = 3 * 60 * 1000;
const MODEL = "THIS-ONE. Above 2.2x leaves at three quarters, never full.";
const file = join(ROOT, "data", "reignite.json");

function beatAge() {
  try {
    const row = JSON.parse(readFileSync(join(ROOT, "data", "heartbeat.json"), "utf8"));
    const t = Date.parse(row.at ?? "");
    return Number.isFinite(t) ? Date.now() - t : Infinity;
  } catch {
    return Infinity;
  }
}
function portOpen() {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port: 8080 });
    const done = (up) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(up);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}
function listeners() {
  const port = "1F90";
  const inodes = new Set();
  for (const name of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    let text = "";
    try {
      text = readFileSync(name, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n").slice(1)) {
      const cols = line.trim().split(/\s+/);
      if (cols.length < 10 || cols[3] !== "0A") continue;
      if (cols[1].split(":").pop().toUpperCase() === port) inodes.add(cols[9]);
    }
  }
  const pids = [];
  let ids = [];
  try {
    ids = readFileSync("/proc", "utf8") ? [] : [];
  } catch {
    ids = [];
  }
  // /proc is a directory; walk it from the runtime below.
  return { inodes, pids };
}
async function ownerPids() {
  const { inodes } = listeners();
  const { readdirSync, readlinkSync } = await import("node:fs");
  const pids = [];
  let ids = [];
  try {
    ids = readdirSync("/proc").filter((id) => /^\d+$/.test(id));
  } catch {
    return pids;
  }
  for (const pid of ids) {
    let fds = [];
    try {
      fds = readdirSync(`/proc/${pid}/fd`);
    } catch {
      continue;
    }
    for (const fd of fds) {
      try {
        const target = readlinkSync(`/proc/${pid}/fd/${fd}`);
        if (target.startsWith("socket:[") && inodes.has(target.slice(8, -1))) {
          pids.push(Number(pid));
          break;
        }
      } catch {
        // a fd can vanish while we read it
      }
    }
  }
  return pids;
}
function stamp(row) {
  mkdirSync(join(ROOT, "data"), { recursive: true });
  writeFileSync(file, JSON.stringify(row, null, 2));
}
async function pass() {
  const age = beatAge();
  const up = await portOpen();
  if (up && age < STALE) {
    stamp({ at: new Date().toISOString(), every: "10m", action: "on", ageMs: age, gen: 399, model: MODEL });
    return;
  }
  const pids = await ownerPids();
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // already gone
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const restored = spawnSync("node", ["scripts/put-it-back.mjs"], { cwd: ROOT, encoding: "utf8" });
  const child = spawn("node", ["scripts/with-app-env.mjs", "node_modules/vite/bin/vite.js", "dev", "--host", "0.0.0.0", "--port", "8080"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  stamp({
    at: new Date().toISOString(),
    every: "10m",
    action: "restarted",
    ageMs: age,
    port: up,
    killed: pids,
    pid: child.pid,
    restored: (restored.stdout || "").trim(),
    gen: 399,
    model: MODEL,
  });
}

await pass();
setInterval(() => {
  void pass();
}, EVERY);
