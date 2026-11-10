"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const file = path.join(__dirname, "../src/lib/desk/poly-live.server.ts");
const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
const declarations = source.statements.filter((node) => ts.isFunctionDeclaration(node) &&
  ["guardPolyOrder", "poly"].includes(node.name?.text));
const code = ts.transpileModule(declarations.map((node) => node.getText(source)).join("\n"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
let halted = false, venueCalls = 0, verdict = { ok: true };
const desk = { __umpGate461: () => "" };
const stubs = {
  globalThis: desk,
  readFileSync: (file) => JSON.stringify(file.endsWith("halt.json") ? { off: halted } : verdict),
  join: path.join, noteBlock: () => {}, liveOn: () => true, polyLiveOn: () => false, maxDollars: () => 1,
  sign: () => Buffer.alloc(0), privateKey: () => null, keyId: () => "mock", ROOT: "https://example.invalid",
  fetch: async () => { venueCalls++; return new Response(null, { status: 200 }); },
};
const send = new Function(...Object.keys(stubs), code + "\nreturn poly;")(...Object.values(stubs));
const buy = { intent: "ORDER_INTENT_BUY_LONG", price: { value: "0.5" }, quantity: 2, marketSlug: "eth-updown-5m" };
const sell = { ...buy, intent: "ORDER_INTENT_SELL_LONG" };

(async () => {
  const order = (body) => send("POST", "/v1/orders", "", body);
  desk.__umpGate461 = () => "CODE CHANGED SINCE THE UMPIRE SAID SAFE";
  assert.match((await (await order(buy)).json()).error, /CODE CHANGED/);
  assert.equal(venueCalls, 0);

  delete desk.__umpGate461;
  assert.match((await (await order(buy)).json()).error, /GATE is not running/);
  assert.equal(venueCalls, 0);

  halted = true;
  assert.match((await (await order(buy)).json()).error, /ENTRIES ARE OFF/);
  assert.equal(venueCalls, 0);
  assert.equal((await order(sell)).status, 200);
  assert.equal(venueCalls, 1);

  halted = false;
  desk.__umpGate461 = () => "";
  verdict = { ok: false, why: "rule failed" };
  assert.match((await (await order(buy)).json()).error, /rule failed/);
  assert.equal(venueCalls, 1);
  verdict = { ok: true };
  assert.equal((await order(buy)).status, 200);
  assert.equal(venueCalls, 2);
  console.log("PASS Polymarket shared preflight: stale SAFE and global halt block buys, exits still pass, and a matching SAFE permits a buy.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
