"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));

function loadFunctions(file, names, mocks) {
  const source = fs.readFileSync(path.join(root, "src/lib/desk", file), "utf8");
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const code = parsed.statements.filter((node) => ts.isFunctionDeclaration(node) && names.includes(node.name?.text))
    .map((node) => node.getText(parsed)).join("\n");
  const api = {};
  new Function("exports", ...Object.keys(mocks), ts.transpileModule(code + "\nexports.sendOrder = typeof sendOrder === 'function' ? sendOrder : undefined;", {
    compilerOptions: { module: 1, target: 99 },
  }).outputText)(api, ...Object.values(mocks));
  return api;
}

async function polyAddOn() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "poly-buy-retry-"));
  const HOUR_PATH = path.join(dir, "poly-hour.json");
  const slug = "cpc-btc-updown-5m-test", tag = ":add1029add1";
  fs.writeFileSync(HOUR_PATH, JSON.stringify({ slugs: [slug] }));
  const claims = new Set(), orders = [], reasons = [];
  let ask = 0.36, filled = 0;
  const { buySlug } = loadFunctions("poly-live.server.ts",
    ["buySlug", "readPolyBuys", "hourSlugs", "rememberHour", "wirePx", "sidePx"], {
      HOUR_PATH, ...fs, join: path.join,
      resolve5m994: async () => slug, polymarketCash: async () => 100,
      claimWindow: (key) => { if (claims.has(key)) return false; claims.add(key); return true; },
      releaseWindow: (key) => claims.delete(key),
      askFor: async () => ask,
      poly: async (_method, _route, _query, order) => {
        orders.push(order);
        return { ok: true, json: async () => ({ order: { id: "mock", cumQuantity: filled, avgPx: order.price } }) };
      },
      appendFileSync: () => {},
    });
  const buy = (key) => buySlug("down", slug, 1, 0.35, null, key, (code) => reasons.push(code));
  assert.equal(await buy(""), null);
  assert.equal(reasons.at(-1), "already-bought");
  assert.equal(await buy(tag), null);
  assert.equal(reasons.at(-1), "quote");
  assert.equal(orders.length, 0);
  ask = 0.35;
  assert.equal(await buy(tag), null);
  assert.equal(reasons.at(-1), "unfilled");
  filled = 1;
  assert.equal((await buy(tag)).filled, 1);
  assert.equal(orders.at(-1).price.value, "0.65");
  claims.clear(); // The same add-on remains spent after a process restart.
  assert.equal(await buy(tag), null);
  assert.equal(reasons.at(-1), "already-bought");
  assert.equal(await buy(""), null);
  assert.equal(orders.length, 2);
  const stored = JSON.parse(fs.readFileSync(HOUR_PATH));
  assert.deepEqual(stored.slugs, [slug]);
  assert.deepEqual(stored.addOns, [slug + tag]);
  assert.equal((await buy(":add1043123")).filled, 1);
  console.log("PASS Polymarket: entry lock stays; add-on obeys the cap, retries a no-fill, and cannot fill twice after restart.");
}

async function kalshiRetry() {
  const ticker = "KXBTC15M-TEST", sent = {}, heldSymbol = new Map();
  const orders = [];
  let opposite = true, filled = 0;
  const { sendOrder } = loadFunctions("kalshi-live.server.ts", ["sendOrder"], {
    sent, heldSymbol, symbolOf: () => "btc", firedSet: () => new Set(), doneSet: () => new Set(),
    noteGate: () => {}, noteBlock: () => {}, terminalGate: async () => null, windowClose: () => null,
    require: (id) => id === "./bandlock" ? { floorFor: () => 1.5 } : require(id),
    readFileSync: () => "{}", join: path.join, sealBlocks: () => false,
    oppHeld848: async () => opposite ? "held the other way" : "",
    finalGate524: async () => "", cappedCount: (count) => count, randomUUID: () => "mock",
    money: (value) => value.toFixed(4),
    kalshi: async (_method, _route, _query, order) => {
      orders.push(order);
      return { ok: true, json: async () => ({ order_id: "mock", fill_count: String(filled), average_fill_price: "0.55" }) };
    },
    recordFire: () => {}, bandLevels: () => [], maxDollars: () => 1, fireOnce: () => {},
    symbolOpen: async () => true, fifteenOpen: async () => [{ ticker }],
  });
  const enter = () => sendOrder(ticker, "bid", 0.55, "1.00", false, { bookCopy: "recon-tog" });
  assert.equal(await enter(), null);
  assert.equal(orders.length, 0);
  assert.equal(sent.__oneDoor.has(ticker), false);
  assert.equal(heldSymbol.has("btc"), false);
  opposite = false;
  assert.equal(await enter(), null);
  assert.equal(orders.length, 1);
  filled = 1;
  assert.equal((await enter()).filled, 1);
  assert.equal(await enter(), null);
  assert.equal(orders.length, 2);
  console.log("PASS Kalshi: opposite position prevents the send; clearing it allows a retry, and a real fill still closes the door.");
}

const mode = process.argv[2];
Promise.allSettled([
  ...(!mode || mode === "poly" ? [polyAddOn()] : []),
  ...(!mode || mode === "kalshi" ? [kalshiRetry()] : []),
]).then((results) => {
  for (const result of results) if (result.status === "rejected") {
    console.error(result.reason);
    process.exitCode = 1;
  }
});
