"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const source = fs.readFileSync(path.join(root, "src/lib/desk/kalshi.ts"), "utf8");
const mod = { exports: {} };
let now = Date.parse("2026-11-10T05:35:17.589Z");
const current = { ticker: "KXGOLD15M-26NOV100045-45", close_time: "2026-11-10T05:45:00Z", status: "active", yes_ask_dollars: "0.65" };
const future = { ticker: "KXGOLD15M-26NOV102215-15", close_time: "2026-11-11T03:15:00Z", status: "open", yes_ask_dollars: "0.50" };
let markets = [future, current];
let urls = [];
class Clock extends Date { static now() { return now; } }
const mockFetch = async (url) => {
  urls.push(url);
  return url.includes("/markets?")
    ? { ok: true, json: async () => ({ markets }) }
    : { ok: false, status: 429 };
};
new Function("exports", "fetch", "Date", ts.transpileModule(source, { compilerOptions: { module: 1, target: 99 } }).outputText)(mod.exports, mockFetch, Clock);

(async () => {
  const get = () => mod.exports.fetchSeriesMarket("KXGOLD15M");
  assert.equal((await get()).ticker, current.ticker, "list fallback must keep the current 15m gold ticker");
  assert.ok(urls[0].endsWith(current.ticker));
  now += 2000; markets = [future]; urls = [];
  assert.equal((await get()).ticker, current.ticker, "keep the last good quote for this same window");
  now = Date.parse(current.close_time);
  assert.equal(await get(), null, "never use either an expired cache or a future open listing");
  assert.ok(urls.some((url) => url.endsWith("KXGOLD15M-26NOV100100-00")), "at the boundary request the new window");
  console.log("KALSHI CURRENT WINDOW ✓ - reproduced the gold mismatch, retained the same-window cache, rejected the future window and checked the rollover.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
