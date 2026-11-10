"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "band-law-selftest-"));
const previousCwd = process.cwd();
const realNow = Date.now;
try {
  for (const name of ["bandlock", "goldlaw"]) {
    const src = fs.readFileSync(path.join(root, "src/lib/desk", name + ".ts"), "utf8");
    const js = ts.transpileModule(src, { compilerOptions: { module: 1, target: 99 } }).outputText;
    fs.writeFileSync(path.join(scratch, name + ".js"), js);
  }
  fs.writeFileSync(path.join(scratch, "quotes.js"), "exports.quoteTick=()=>null;exports.feedHealth=()=>({ok:true});");
  fs.writeFileSync(path.join(scratch, "recon.js"), "exports.RECON=new Set();");
  fs.mkdirSync(path.join(scratch, "data"));
  process.chdir(scratch);

  // Real test and real gate, with the live globals that contaminated the 9:55 PM replay.
  const { bandSelfTest, bandLockCheck } = require(path.join(scratch, "bandlock.js"));
  const { goldLaw } = require(path.join(scratch, "goldlaw.js"));
  Date.now = () => Date.parse("2026-11-10T05:55:21.020Z");
  const t = Math.floor(Date.now() / 300000) * 300;
  const live = {
    __curBook465: "recon-rej",
    __curLabel611: "Rejected down off Red zone",
    __wireLabel619: "Rejected down off Red zone",
    __label801: "Rejected up off session VWAP",
    __inBLC465: true,
    __pivBars: { gold: { bars: [{ t, o: 4120, h: 4127, l: 4115, c: 4125 }] } },
    __sessCarry: { gold: { cur: { v: 4120, sd: 4 }, prev: { v: 4118, sd: 8 } } },
  };
  assert.equal(bandSelfTest(goldLaw), 0, "clean 2,000-case self-test");
  Object.assign(globalThis, live);
  assert.equal(bandSelfTest(goldLaw), 0, "live setup context must not change a synthetic verdict");
  assert.equal(globalThis.__bandLawBroken, false);
  for (const [key, value] of Object.entries(live)) assert.strictEqual(globalThis[key], value, key + " must be restored");

  assert.equal(bandSelfTest(() => { throw new Error("simulated rule failure"); }, 1), 1);
  assert.equal(globalThis.__bandLawBroken, true, "a genuine failure must still set the order block");
  const result = bandLockCheck("ogp5-fast", "gold", "up", "TEST");
  assert.match(result.reason, /band law failed its self-test/);
  assert.equal(bandSelfTest(goldLaw), 0);
  assert.equal(globalThis.__bandLawBroken, false, "passing rerun releases the self-test block");
  console.log("BAND LAW SELF-TEST ✓ — clean and live-context replays pass, globals restore, and a genuine failure still blocks orders.");
} finally {
  Date.now = realNow;
  clearInterval(globalThis.__kGapTimer);
  clearInterval(globalThis.__sealWarm);
  process.chdir(previousCwd);
  fs.rmSync(scratch, { recursive: true });
}
