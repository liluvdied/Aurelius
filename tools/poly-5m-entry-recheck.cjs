"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const desk = path.join(__dirname, "../src/lib/desk");

function extract(file, name, env) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(desk, file), "utf8"), ts.ScriptTarget.Latest, true);
  const fn = source.statements.find((n) => ts.isFunctionDeclaration(n) && n.name?.text === name);
  const code = ts.transpileModule(fn.getText(source), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return new Function("exports", ...Object.keys(env), code + "\nreturn " + name)( {}, ...Object.values(env));
}

(async () => {
  let time = Date.now(), age = 2500, side = "up", label = "Break above 5m PP", lag = 0;
  const clock = { now: () => time };
  const judge = extract("xrp5m961.ts", "judgeCoinEntry", {
    Date: class extends Date { static now() { return clock.now(); } },
    globalThis: { get __lagLast654() { return lag; } },
    fetch: async (url) => {
      assert.equal(url, "https://api.exchange.coinbase.com/products/ETH-USD/ticker");
      return { ok: true, json: async () => ({ price: "2100", time: new Date(time - age).toISOString() }) };
    },
  });
  const original = label;
  const recheck = () => judge("ETH-USD", "up", original, () => ({ side, label }));
  const claims = new Set(), reasons = [];
  let sends = 0;
  const buy = extract("poly-live.server.ts", "buySlug", {
    Date: class extends Date { static now() { return clock.now(); } },
    join: path.join, appendFileSync: () => {}, resolve5m994: async (slug) => slug,
    polymarketCash: async () => 10, hourSlugs: () => [],
    claimWindow: (key) => claims.has(key) ? false : (claims.add(key), true),
    releaseWindow: (key) => claims.delete(key), askFor: async () => 0.45,
    wirePx: (_side, px) => px,
    poly: async () => { sends++; return { ok: true, json: async () => ({ order: { id: "ioc", cumQuantity: 0 } }) }; },
  });
  const enter = (deadline = time + 1000, check = recheck) =>
    buy("up", "eth-updown-5m-test", 1, 0.66, null, "", (code, why) => reasons.push({ code, why }), deadline, check);
  await enter();
  assert.match(reasons.at(-1).why, /within 2 seconds/);
  age = 200;
  side = "down";
  await enter();
  assert.equal(reasons.at(-1).why, "setup changed before the order");
  side = "up";
  label = "Rejected up off session VWAP";
  await enter();
  assert.equal(reasons.at(-1).code, "setup");
  label = original;
  lag = time - 2500;
  await enter();
  assert.match(reasons.at(-1).why, /engine delay/);
  lag = 0;
  await enter(time + 1000, async () => { time += 1500; return ""; });
  assert.equal(reasons.at(-1).code, "late");
  assert.equal(sends, 0);
  assert.equal(claims.size, 0);
  await enter();
  assert.equal(sends, 1);
  assert.equal(reasons.at(-1).code, "unfilled");
  assert.equal(claims.size, 0);

  for (const [file, product] of [
    ["btc5m1055.ts", "BTC-USD"], ["eth5m1055.ts", "ETH-USD"], ["xrp5m961.ts", "XRP-USD"],
  ]) {
    const source = fs.readFileSync(path.join(desk, file), "utf8");
    assert.ok(source.includes(`judgeCoinEntry("${product}", r.side, r.label`), `${file} entry recheck`);
    assert.ok(source.includes(`judgeCoinEntry("${product}", e.side, rd.label`), `${file} trigger recheck`);
  }
  console.log("PASS 5m entry checks: stale tick, changed side or setup, engine lag and late sends blocked; fresh unchanged setup can send and a refusal releases its claim.");
})().catch((e) => { console.error(e); process.exitCode = 1; });
