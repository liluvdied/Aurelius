#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(path.join(root, "src/lib/desk/poly-live.server.ts"), "utf8");
const file = ts.createSourceFile("poly.ts", src, ts.ScriptTarget.Latest, true);
const code = file.statements
  .filter((node) => ts.isFunctionDeclaration(node) && ["takeSide", "buySlug", "wirePx", "sidePx"].includes(node.name?.text))
  .map((node) => node.getText(file)).join("\n");
const mod = { exports: {} };
let ask = 0.66, cashError = false, quoteError = false, status = 200;
const submitted = [];
const noOp = () => {};
const mocks = {
  PRIMARY_DOLLARS: 1, polymarketCash: async () => { if (cashError) throw new Error("timeout"); return 100; },
  liveWindow: async () => ({ slug: "mock-btc", target: 80000 }),
  polymarketHoldings: async () => [], whyNull: () => null,
  claimWindow: () => true, releaseWindow: noOp, rememberHour: noOp,
  resolve5m994: async (slug) => slug, hourSlugs: () => [], askFor: async () => { if (quoteError) throw new Error("timeout"); return ask; },
  poly: async (method, route, _query, order) => {
    assert.equal(method, "POST");
    assert.equal(route, "/v1/orders");
    submitted.push(order);
    if (status !== 200) return { ok: false, status, text: async () => "{}" };
    return { ok: true, json: async () => ({ order: { id: "mock", cumQuantity: 1, avgPx: order.price } }) };
  },
};
new Function("exports", ...Object.keys(mocks), ts.transpileModule(code, { compilerOptions: { module: 1, target: 99 } }).outputText)(mod.exports, ...Object.values(mocks));
const { buySlug, takeSide } = mod.exports;

(async () => {
  const entries = [
    (side, cap) => buySlug(side, "mock-xrp", 1, cap, 2.3),
    (side, cap) => takeSide(side, "2026-11-10T05:15:00Z", 1, cap, 0.08, 0.03),
  ];
  for (const buy of entries) {
    ask = 0.66;
    assert.equal((await buy("up", 0.8)).price, 0.66);
    assert.equal(submitted.at(-1).price.value, "0.66");
    assert.equal((await buy("down", 0.6667)).price, 0.66);
    assert.equal(submitted.at(-1).price.value, "0.34");
    ask = 0.35;
    assert.equal((await buy("up", 0.357)).price, 0.35);
    ask = 0.67;
    const before = submitted.length;
    assert.equal(await buy("up", 0.8), null);
    assert.equal(submitted.length, before);
  }
  ask = 0.23;
  const refusals = [], sends = submitted.length;
  const attempt = (deadline) => buySlug("up", "mock-xrp", 1, 0.66, null, "", (code) => refusals.push(code), deadline);
  cashError = true;
  assert.equal(await attempt(Date.now() + 1000), null);
  cashError = false;
  quoteError = true;
  assert.equal(await attempt(Date.now() + 1000), null);
  quoteError = false;
  assert.equal(await attempt(Date.now() - 1), null);
  assert.deepEqual(refusals, ["cash", "quote", "late"]);
  assert.equal(submitted.length, sends);
  status = 503;
  await assert.rejects(attempt(Date.now() + 1000), /outcome is unknown/);
  status = 200;
  assert.equal((await attempt(Date.now() + 1000)).filled, 1);
  console.log("FLOOR AT THE FILL 1039 TEST ✓ - both actual buy functions submit at or below 66c, preserve tighter caps and reject 67c asks before submitting, including NO-side wire pricing.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
