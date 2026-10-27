import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createPrivateKey, sign, constants } from "node:crypto";

const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));

async function kalshi(path, query = "") {
  const timestamp = Date.now().toString();
  const signature = sign("sha256", Buffer.from(`${timestamp}GET${path}`), {
    key,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString("base64");
  const res = await fetch("https://external-api.kalshi.com" + path + query, {
    headers: {
      Accept: "application/json",
      "KALSHI-ACCESS-KEY": keyId,
      "KALSHI-ACCESS-TIMESTAMP": timestamp,
      "KALSHI-ACCESS-SIGNATURE": signature,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`kalshi ${res.status}`);
  return data;
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function rebootIfDark() {
  const beat = readJson("/workspace/data/heartbeat.json", {});
  const age = beat.at ? Date.now() - Date.parse(beat.at) : Infinity;
  if (age < 45_000) return { rebooted: false, ageSec: Math.round(age / 1000), gen: beat.gen ?? null };
  let listening = false;
  try {
    const res = await fetch("http://127.0.0.1:8080/", { signal: AbortSignal.timeout(8000) });
    listening = res.ok;
  } catch {
    listening = false;
  }
  if (!listening) {
    const child = spawn("npm", ["run", "dev"], { cwd: "/workspace", detached: true, stdio: "ignore" });
    child.unref();
  }
  await new Promise((resolve) => setTimeout(resolve, 6000));
  const after = readJson("/workspace/data/heartbeat.json", {});
  const next = after.at ? Date.now() - Date.parse(after.at) : Infinity;
  return {
    rebooted: true,
    woke: next < 30_000,
    ageSec: Math.round(next / 1000),
    gen: after.gen ?? null,
  };
}

function paperSides(since) {
  const rows = readJson("/workspace/data/fill-log.json", []);
  const out = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row.venue !== "paper") continue;
    if (row.asset !== "btc" && row.asset !== "gold") continue;
    if (row.kind !== "taken" && row.kind !== "banked") continue;
    const at = Date.parse(row.at || "");
    if (!at || at < since) continue;
    const prev = out.get(row.ticker);
    if (!prev || at >= prev.at) out.set(row.ticker, { at, side: row.side, asset: row.asset, pattern: row.pattern || "" });
  }
  return out;
}

function kalshiSides(fills) {
  const out = new Map();
  for (const fill of fills) {
    const ticker = String(fill.ticker || "");
    if (!/KXBTC15M|KXGOLD15M/.test(ticker)) continue;
    const at = Date.parse(fill.created_time || fill.ts || "");
    const up = fill.action === "buy" && fill.side === "yes";
    const down = fill.action === "sell" && fill.side === "no";
    if (!up && !down) continue;
    const side = up ? "up" : "down";
    const list = out.get(ticker) || [];
    list.push({ at, side, count: Number(fill.count_fp || 0), yes: Number(fill.yes_price_dollars || 0) });
    out.set(ticker, list);
  }
  return out;
}

function closesAt(ticker) {
  const match = String(ticker).match(/(\d{2})([A-Z]{3})(\d{2})(\d{2})(\d{2})/);
  if (!match) return 0;
  const months = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
  const month = months[match[2]];
  if (month == null) return 0;
  return Date.UTC(2000 + Number(match[1]), month, Number(match[3]), Number(match[4]) + 4, Number(match[5]));
}
const stillOpen = (ticker) => closesAt(ticker) - Date.now() > 2 * 60 * 1000;
const hour = process.argv.includes("--hour");
const since = Date.now() - (hour ? 60 : 20) * 60 * 1000;
const boot = await rebootIfDark();
const paper = paperSides(since);
const fills = (await kalshi("/trade-api/v2/portfolio/fills", "?limit=40")).fills || [];
const live = kalshiSides(fills.filter((fill) => Date.parse(fill.created_time || fill.ts || "") >= since - 60_000));
const misses = [];
for (const [ticker, row] of paper) {
  const got = live.get(ticker) || [];
  if (!got.some((fill) => fill.side === row.side)) misses.push({ ticker, ...row });
}
const opposing = [];
function walk(ticker, got) {
  const ordered = [...got].sort((a, b) => a.at - b.at);
  let pos = 0;
  let entries = 0;
  for (const fill of ordered) {
    const delta = fill.side === "up" ? fill.count : -fill.count;
    const next = Math.round((pos + delta) * 100) / 100;
    const openedFresh = Math.abs(pos) < 0.01 && Math.abs(next) >= 0.01;
    const crossed = pos * next < -0.01;
    if (openedFresh || crossed) {
      entries += 1;
      if (entries > 1) opposing.push({ ticker, at: new Date(fill.at).toISOString(), side: fill.side, count: fill.count });
    }
    pos = next;
  }
}
for (const [ticker, got] of live) walk(ticker, got);
const exits = readJson("/workspace/data/exit-log.json", []);
const hourStart = Date.now() - 60 * 60 * 1000;
const closed = (Array.isArray(exits) ? exits : []).filter((row) => Date.parse(row.at || "") >= hourStart);
const realized = Math.round(closed.reduce((sum, row) => sum + Number(row.profit || 0), 0) * 100) / 100;
const openMisses = misses.filter((row) => stillOpen(row.ticker));
const openOpposing = opposing.filter((row) => stillOpen(row.ticker));
const report = {
  at: new Date().toISOString(),
  boot,
  paper: paper.size,
  misses: openMisses,
  opposing: openOpposing,
  settled: { misses: misses.filter((row) => !stillOpen(row.ticker)), opposing: opposing.filter((row) => !stillOpen(row.ticker)) },
  hour: { realized, trades: closed.length, red: realized < 0 },
  clear: openMisses.length === 0 && openOpposing.length === 0 && boot.woke !== false,
};
writeFileSync("/workspace/data/window-check.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
