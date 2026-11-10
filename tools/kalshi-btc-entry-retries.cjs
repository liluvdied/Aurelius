"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const name = "kalshi-live.server.ts";
const source = ts.createSourceFile(name, fs.readFileSync(path.join(root, "src/lib/desk", name), "utf8"), ts.ScriptTarget.Latest, true);
const functions = source.statements.filter((node) => ts.isFunctionDeclaration(node) && ["enterLive", "liveAsks"].includes(node.name?.text));
const code = ts.transpileModule(functions.map((node) => node.getText(source)).join("\n") + "\nexports.enterLive = enterLive;", {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

async function run({ book = "recon-tog", side, asks, finalGate = true }) {
  const orders = [];
  const keys = new Set();
  const sent = {};
  const ticker = "KXBTC15M-TEST";
  const band = { bandLockCheck: () => ({ ok: true }), auditGrade523: () => "", floorFor: () => 1.5 };
  const stubs = {
    sent, ROOT: "https://example.invalid", LIVE_DOLLARS: 1,
    readFileSync: (p) => JSON.stringify(p.endsWith("UMPIRE-VERDICT.json") ? { ok: true } : {
      liveBook: { books: [book] }, paperFires: [book],
    }),
    join: path.join, appendFileSync: () => {}, sizeFor: () => 1, symbolOf: () => "btc",
    doneSet: () => new Set(), firedSet: () => new Set(), sealBlocks: () => false,
    hold: (key) => { keys.add(key); return true; }, release: (key) => keys.delete(key),
    fifteenOpen: async () => [], lockSide: () => {}, markDone: () => {}, fireOnce: () => {}, writeSeal: () => {},
    offMainDollars: () => 1, assetDollarsFor: () => 0, kalshiCeil: () => 1, maxDollars: () => 1,
    setTimeout: (resolve) => resolve(),
    require: (id) => id === "./bandlock" ? band : { quoteTick: () => ({ c: 1 }) },
    fetch: async (url) => {
      assert.equal(url, "https://example.invalid/trade-api/v2/markets/" + ticker);
      const ask = asks.shift();
      return { ok: ask != null, json: async () => ({
        market: side === "up" ? { yes_ask_dollars: ask } : { no_ask_dollars: ask },
      }) };
    },
  };
  const api = {};
  new Function("exports", ...Object.keys(stubs), "place", code)(api, ...Object.values(stubs),
    async (_ticker, bookSide, yes, count, _reduce, line) => {
      orders.push({ bookSide, yes, count, ask: line.askPx, multiple: line.multiple });
      if (!finalGate) {
        sent.__aureliusBlock = "pink break turned back";
        return null;
      }
      return orders.length === 2 || side === "up" ? { orderId: "simulated", filled: Number(count), yesPrice: yes } : null;
    });
  return { result: await api.enterLive(side, ticker, 0.2, 0.2, 1, { bookCopy: book }), orders, keys };
}

(async () => {
  const short = await run({ side: "down", asks: ["0.6600", "0.8700", null, "0.5800"] });
  assert.equal(short.result.status, "filled");
  assert.deepEqual(short.orders, [
    { bookSide: "ask", yes: 0.34, count: "1.51", ask: 0.66, multiple: 1.52 },
    { bookSide: "ask", yes: 0.36, count: "1.51", ask: 0.58, multiple: 1.72 },
  ]);

  const long = await run({ book: "recon-rej", side: "up", asks: ["0.8200", "0.6600"] });
  assert.equal(long.result.status, "filled");
  assert.deepEqual(long.orders, [{ bookSide: "bid", yes: 0.66, count: "1.21", ask: 0.66, multiple: 1.52 }]);

  const missing = await run({ side: "down", asks: [null] });
  assert.equal(missing.result.reason, "Kalshi BTC entry: no current ask");
  assert.equal(missing.orders.length, 0);
  assert.equal(missing.keys.size, 0);

  const refused = await run({ side: "down", asks: Array(11).fill("0.6600"), finalGate: false });
  assert.equal(refused.result.reason, "pink break turned back");
  assert.equal(refused.result.status, "blocked");
  assert.equal(refused.keys.size, 0);
  console.log("PASS Kalshi BTC entry replay: MAIN short, REJ long, missing and over-limit quotes, re-entry within the cap, and final-rule refusal.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
