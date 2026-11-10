"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const ts = require("typescript");

const desk = path.join(__dirname, "../src/lib/desk");
function load(file, imports) {
  const source = fs.readFileSync(path.join(desk, file), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const api = {};
  new Function("exports", "require", code)(api, (name) => imports[name] ?? require(name));
  return api;
}

const start = 1794303300;
const now = start + 125;
const band = (name, price) => ({ name, price });
const lines = [band("-3σ", 2094.5), band("-2σ", 2097.4), band("-1σ", 2100.3), band("session VWAP", 2103.2)];
const bar = (t, o, h, l, c) => ({ t, o, h, l, c, v: 1 });
const breakdown = [
  bar(start, 2098.8, 2099.0, 2098.1, 2098.3),
  bar(start + 60, 2098.3, 2098.4, 2096.9, 2096.99),
  bar(start + 120, 2096.99, 2097.02, 2096.9, 2096.99),
];
const rejection = [
  bar(start, 2100.12, 2100.29, 2099.5, 2099.55),
  bar(start + 120, 2099.62, 2099.65, 2099.5, 2099.55),
];
const bounce = [
  bar(start, 2095, 2095.32, 2094.51, 2095.3),
  bar(start + 120, 2095.2, 2095.31, 2095.16, 2095.3),
];
const push = { band: 0.25, pink: 0.25, wick: 0.5 };
const rules = { blockShortBelowMinus2: true };
const ethBands = { ethBands682: () => lines };
const shared = load("xrp5m961.ts", { "./ethbook": ethBands });
const { ethTick1055 } = load("eth5m1055.ts", { "./ethbook": ethBands, "./xrp5m961": shared });

(async () => {
  const read = (bars, options) => shared.xrpRead961(bars, lines, bars.at(-1).c, now, push, bars[0].o, options);
  assert.equal(read(breakdown).label, "Break below -2σ");
  assert.match(read(breakdown, rules).why, /ETH MAIN BOTTOM RUNG/);
  assert.equal(read(rejection, rules).label, "Rejected down off -1σ");
  assert.equal(read(bounce, rules).label, "Rejected up off -3σ");

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "eth-main-rung-"));
  const here = process.cwd();
  const originalNow = Date.now;
  let attempts = 0;
  try {
    process.chdir(temp);
    fs.mkdirSync("data");
    Date.now = () => now * 1000;
    const pm = {
      bookTop: async () => ({ ask: 0.48, bid: 0.50 }),
      buySlug: async () => { attempts++; return { filled: 2, price: 0.50 }; },
    };
    const seed = (bars) => {
      globalThis.__eth1055At = 0;
      globalThis.__eth1055Bars = { at: Date.now(), m: new Map(bars.map((b) => [b.t, b])) };
    };
    seed(breakdown);
    await ethTick1055(Date.now(), pm);
    assert.equal(attempts, 0);
    assert.match(fs.readFileSync("data/eth5m-1055.jsonl", "utf8"), /ETH MAIN BOTTOM RUNG/);
    seed(rejection);
    await ethTick1055(Date.now(), pm);
    assert.equal(attempts, 1);
  } finally {
    Date.now = originalNow;
    process.chdir(here);
    fs.rmSync(temp, { recursive: true, force: true });
  }
  console.log("PASS ETH MAIN lower rung: 1:36-shaped breakdown blocked before send, eligible rejection can still send, and bounce long retained.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
