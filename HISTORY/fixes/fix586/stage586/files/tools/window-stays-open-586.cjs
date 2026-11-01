// fix586 EVERY WINDOW STAYS OPEN test (Love Nov 1 2026 11:37 UTC: "She does not skip the rest of the window because the first read was late or blocked.
// Every window stays open for the next valid setup that appears under her rules."). Runs her REAL sendOrder (kalshi-live.server.ts) with the exchange stubbed:
//   1) the last line (finalGate524) refuses       -> the one-door lock is OPEN again (window stays open)
//   2) the send throws before reaching Kalshi      -> OPEN again
//   3) Kalshi answers but nothing fills            -> OPEN again (unchanged)
//   4) Kalshi FILLS the order                      -> the door STAYS SHUT (one EXECUTED trade per window - unchanged)
//   5) a second order in the same window after a fill -> "duplicate door shut" (unchanged)
// Fails on the pre-586 file (case 1 and 2 leave the door shut), passes after.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(path.join(root, "src/lib/desk/kalshi-live.server.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("WINDOW OPEN 586 TEST: FAIL - " + m); } };
const i = src.indexOf("async function sendOrder("); if (i < 0) { console.log("WINDOW OPEN 586 TEST: FAIL - no sendOrder"); process.exit(1); }
let d = 0, j = src.indexOf("{", src.indexOf(")", src.indexOf("forceExit = false", i))); let k = j;
for (; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) break; } }
const fn = src.slice(i, k + 1);
const js = ts.transpileModule(fn, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText.replace(/^"use strict";/, "");
const run = async (mode) => {
  const notes = [];
  const scope = new Proxy({
    sent: { __oneDoor: new Set() }, heldSymbol: new Map(), readFileSync: () => { throw new Error("no file"); }, join: (...a) => a.join("/"), process,
    symbolOf: () => "btc", firedSet: () => new Set(), doneSet: () => new Set(), sealBlocks: () => false,
    noteGate: (tk, st, okk, why) => notes.push(why), noteBlock: () => {}, terminalGate: async () => null, primeOwns: () => false, signedPosition: async () => 0,
    windowClose: () => Date.now() + 600000, finalGate524: async () => (mode === "g524" ? "the last line (fix524): test refusal" : ""),
    randomUUID: () => "id", money: (x) => String(x), cappedCount: (c) => c, Number, String, Math, Date, JSON, Error, Promise, Object, Array, Set, Map, console,
    kalshi: async () => { if (mode === "throw") throw new Error("network"); if (mode === "unfilled") return { ok: true, json: async () => ({ order_id: "o1", fill_count: "0" }) }; return { ok: true, json: async () => ({ order_id: "o1", fill_count: "2", average_fill_price: "0.40" }) }; },
    fireOnce: () => {}, recordFire: () => {}, lockSide: () => {}, writeSeal: () => {}, markDone: () => {},
  }, { has: () => true, get: (o, p) => (p in o ? o[p] : (p === Symbol.unscopables ? undefined : (globalThis[p] !== undefined ? globalThis[p] : () => {}))) });
  const f = new Function("scope", "with (scope) { return (" + js.replace(/^async function sendOrder/, "async function") + "); }")(scope);
  let threw = false;
  try { await f("KXBTC15M-26NOV010645-45", "ask", 0.6, "2.00", false, { bookCopy: "recon-rej", label: "Rejected down off +1σ" }); } catch { threw = true; }
  return { door: scope.sent.__oneDoor.has("KXBTC15M-26NOV010645-45"), threw, notes, scope, f };
};
(async () => {
  const a = await run("g524"); t(!a.door, "the last line refused the order and her window stayed SHUT (duplicate door) - a blocked first read must not close the window");
  const b = await run("throw"); t(b.threw && !b.door, "a send that never reached Kalshi left her window SHUT");
  const c = await run("unfilled"); t(!c.door, "an unfilled order left her window shut");
  const e = await run("fill"); t(e.door, "a FILLED order must keep the door shut - one executed trade per window");
  let again = null; try { again = await e.f("KXBTC15M-26NOV010645-45", "ask", 0.6, "2.00", false, { bookCopy: "recon-rej" }); } catch {}
  t(again === null && e.notes.includes("duplicate door shut"), "a second order after a fill in the same window was not refused");
  console.log(ok ? "WINDOW OPEN 586 TEST ✓ - a refused or failed send keeps her window open for the next valid setup; only a fill (or an order on the wire) shuts it - one executed trade per window." : "WINDOW OPEN 586 TEST: FAIL");
  process.exit(ok ? 0 : 1);
})();
