"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const compilerOptions = { module: 1, target: 99 };
const src = (name) => fs.readFileSync(path.join(root, "src/lib/desk", name + ".ts"), "utf8");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "xrp15-wire-"));
const cwd = process.cwd(), realNow = Date.now, realFetch = globalThis.fetch;
const code = src("xrp15k-live");
const output = ts.transpileModule(code, { compilerOptions }).outputText;
let now = 1794297600000 + 60000;
const end = (Math.floor(now / 900000) + 1) * 900000;
const ticker = "KXXRP15M-TEST", label = "Rejected up off -1σ";
let read = { side: "up", label }, fresh = true;
const market = { ticker, status: "active", closeTime: new Date(end).toISOString(), result: "", yesAsk: 0.55, noAsk: 0.47, yesBid: 0.51, noBid: 0.43, target: 1 };
const km = { fifteenTicker: () => ticker, fetchMarket: async () => ({ ...market }) };
const modules = {
  "./p5m1045": { bars1045: async () => [{ t: Math.floor(now / 60000) * 60, c: 1 }] },
  "./xrp5m961": { xrpRead961: (_bs, _lines, _spot, _time, _push, open) => { assert.equal(open, undefined); return read; } },
  "./ethbook": { ethBands682: () => [] },
  "./kalshi": km,
};
const lane = {};
new Function("require", "exports", output)((id) => modules[id] || require(id), lane);
const ledger = () => JSON.parse(fs.readFileSync("data/xrp15k-live-book.json", "utf8")).rows;
let attempts = 0, exits = [], refuse = true;
const wire = {
  enterXrp15: async (marketTicker, side, setup) => {
    attempts++;
    assert.deepEqual([marketTicker, side, setup], [ticker, "up", label]);
    return refuse ? null : { orderId: "simulated", filled: 1.8, paid: 0.55 };
  },
  exitXrp15: async (_ticker, side, owned, qty, bid) => {
    exits.push([side, owned, qty, bid]);
    return { filled: qty, paid: bid };
  },
};
const tick = async () => { now += 5001; await lane.xrp15Tick(now, km, wire); };
const config = (on) => fs.writeFileSync("data/xrp15k-live.json", JSON.stringify({ on }));
(async () => {
  process.chdir(temp);
  fs.mkdirSync("data");
  Date.now = () => now;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ price: "1.00", time: new Date(now - (fresh ? 10 : 2001)).toISOString() }) });
  await tick();
  assert.equal(attempts, 0);
  config(true);
  assert.equal(await lane.judgeXrp15(ticker, "up", label), "");
  assert.match(await lane.judgeXrp15(ticker, "down", label), /changed/);
  fresh = false;
  assert.match(await lane.judgeXrp15(ticker, "up", label), /2 seconds/);
  fresh = true;
  assert.equal(lane.xrp15MarketOK(market, ticker, end - 119999), false);
  market.yesAsk = 0.67;
  await tick();
  assert.equal(attempts, 0);
  market.yesAsk = 0.55;
  await tick();
  assert.equal(attempts, 1);
  assert.deepEqual(ledger(), []);
  refuse = false;
  await tick();
  await tick();
  assert.equal(attempts, 2);
  assert.equal(ledger()[0].remaining, 1.8);
  config(false);
  market.yesBid = 0.9;
  await tick();
  assert.deepEqual(exits[0], ["up", 1.8, 0.9, 0.9]);
  market.yesBid = 0.96;
  await tick();
  assert.deepEqual(exits[1], ["up", 0.9, 0.9, 0.96]);
  assert.equal(ledger()[0].result, "closed");
  const kalshi = src("kalshi-live.server");
  const file = ts.createSourceFile("kalshi.ts", kalshi, ts.ScriptTarget.Latest, true);
  const names = ["enterXrp15", "contractsFor", "exitXrp15"];
  const functions = file.statements.filter((node) => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)).map((node) => node.getText(file)).join("\n");
  let live = true, pos = 0, ask = 0.66;
  const orders = [];
  const mocks = {
    liveOn: () => live, kalshiArmed: () => true, hold: () => true, release: () => {},
    liveAsks: async () => ({ yesAsk: 0.5, noAsk: ask }),
    kalshi: async () => ({ ok: true, json: async () => ({ market_positions: [{ ticker, position_fp: String(pos) }] }) }),
    kalshiCash: async () => 100, maxDollars: () => 10, markDone: () => {}, writeSeal: () => {},
    signedPosition: async () => pos,
    place: async (...args) => { orders.push(args); return { filled: 1, orderId: "mock", yesPrice: args[2] }; },
  };
  const api = {};
  new Function("exports", ...Object.keys(mocks), ts.transpileModule(functions, { compilerOptions }).outputText)(api, ...Object.values(mocks));
  live = false;
  assert.equal(await api.enterXrp15(ticker, "down", label, 1), null);
  live = true;
  pos = 1;
  assert.equal(await api.enterXrp15(ticker, "down", label, 1), null);
  pos = 0;
  ask = 0.67;
  assert.equal(await api.enterXrp15(ticker, "down", label, 1), null);
  ask = 0.66;
  assert.equal((await api.enterXrp15(ticker, "down", label, 1)).filled, 1);
  assert.equal(orders[0][1], "ask");
  assert.ok(Math.abs(orders[0][2] - 0.34) < 1e-9);
  assert.ok(Number(orders[0][3]) * 0.66 <= 1);
  pos = -2;
  assert.equal(await api.exitXrp15(ticker, "down", 1.5, 1, 0.9), null);
  pos = -1.5;
  assert.ok(await api.exitXrp15(ticker, "down", 1.5, 1, 0.9));
  assert.equal(orders[1][4], true);
  console.log("XRP 15m Kalshi passed: off, fresh same setup, cutoff, 66c/$1, no duplicate, held-position guard, no-fill retry, and reduce-only half/full exits.");
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  Date.now = realNow; globalThis.fetch = realFetch; process.chdir(cwd);
});
