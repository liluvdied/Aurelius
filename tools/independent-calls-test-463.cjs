// fix463 behaviour test (R191, Love Oct 29 2026 12:38 PM PT: "no flip. independent calls. she does not get one call per window. only once she has executed a trade." + R008 Oct 27:
// "ONE EXECUTED TRADE PER WINDOW ... NO TRADE EXECUTED - FREEEE TO TRADE."): lifts her REAL call logic out of src/lib/desk/recon.ts and runs it - main + rejection. Replays 12:31 PM gold.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const R = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/recon.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("INDEPENDENT CALLS TEST: FAIL - " + m); } };
function grab(head) { const i = R.indexOf(head); if (i < 0) { console.log("INDEPENDENT CALLS TEST: FAIL - missing " + head); process.exit(1); }
  const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(R.slice(i)); const j = i + m.index + m[0].length - 1; let d = 0;
  for (let k = j; k < R.length; k++) { if (R[k] === "{") d++; else if (R[k] === "}") { d--; if (d === 0) return R.slice(i, k + 1); } } }
const helpers = [grab("export function isFlip463("), grab("export function freshSameSide463("), grab("export function thirdsRead463(")].map((x) => x.replace(/^export /, "")).join("\n");
// her real "prior call" block: from the fix463 line through the re-aim's "return true;"
const a = R.indexOf("      if (freshSameSide463("), b = R.indexOf("      return true;\n    }", a);
t(a > 0 && b > a, "the independent-call step is not in her call logic");
t(R.includes('if ((lane === "recon-tog" || lane === "recon-rej") && isFlip463(look.label)) return false; // fix463'), "the no-flip guard is not at the top of her book step");
const block = R.slice(a, b) + "      return true;";
const js = ts.transpileModule("type L = any;\n" + helpers + `
function step(lane, prior, look, done, door) {
  const m = { ticker: "KXT", yesAsk: 0.5, noAsk: 0.5 }; const askIn = undefined; const STAKE = 20;
  const r2 = (n) => Math.round(n * 100) / 100, fee = () => 0, skipLog = () => {}; const D = (f) => f;
  const readFileSync = (p) => JSON.stringify(done || {}); globalThis.__oneDoor = new Set(door ? ["KXT"] : []); globalThis.__reaim373 = {};
  if ((lane === "recon-tog" || lane === "recon-rej") && isFlip463(look.label)) return false;
  ${block}
}`, { compilerOptions: { target: 99 } }).outputText;
const step = new Function(js + "; return step;")();
const thirds = new Function(js + "; return thirdsRead463;")();
const Lg = [{ name: "-2σ", price: 4004.95 }, { name: "-1σ", price: 4018.29 }, { name: "session VWAP", price: 4031.6 }];
t(thirds(Lg, 4016.65, "up"), "12:31:31 gold: a LONG read at 88% up under -1σ 4018.29 was not stopped at the read");
t(!thirds(Lg, 4016.22, "down"), "12:31:40 gold: the SHORT read at 85% up was stopped - it must be free");
t(thirds(Lg, 4006.5, "down") && !thirds(Lg, 4006.5, "up"), "bottom 33%: short must stop at the read, long must be free");
t(R.includes("thirdsRead463(sessionLines(ax, id), spot, firstTog.side)) firstTog = null") && R.includes("thirdsRead463(sessionLines(ax, id), spot, lookRM.side)) lookRM = null"), "her thirds are not in the read for main AND rejection");
t(!/lookR5 = .*thirdsRead463/.test(R), "the 5M read lane got the thirds change");
const flip = "Top third - seen as a short under 4018.29 (was: 1m rejection off Bollinger upper)";
for (const lane of ["recon-tog", "recon-rej"]) {
  const nm = lane === "recon-tog" ? "main" : "rejection";
  let p = { side: "down", label: flip };
  t(step(lane, { side: "up", label: "1m rejection off Bollinger upper" }, { side: "down", label: flip }, {}, false) === false, nm + ": a flipped read was booked as her call (12:31:31 gold)");
  p = { side: "down", label: flip };
  t(step(lane, p, { side: "down", label: "Rejected down off -1σ" }, {}, false) === true && p.label === "Rejected down off -1σ", nm + ": the 12:31:37 'Rejected down off -1σ' short did NOT replace the stuck call");
  p = { side: "up", label: "1m rejection off Bollinger upper" };
  t(step(lane, p, { side: "down", label: "Rejected down off -1σ" }, {}, false) === true && p.side === "down", nm + ": a refused long was not replaced by the later short");
  p = { side: "down", label: "Rejected down off -1σ" };
  t(step(lane, p, { side: "down", label: "1m rejection off Red zone" }, { "KXT:x:KXT:y": {} , [`KXT:${lane}:KXT:${lane}`]: { status: "filled" } }, false) === false && p.label === "Rejected down off -1σ", nm + ": a FILLED window was changed - one executed trade per window");
  p = { side: "down", label: "Rejected down off -1σ" };
  t(step(lane, p, { side: "up", label: "Rejected up off -2σ" }, {}, true) === false, nm + ": an order on the wire did not lock the window");
  p = { side: "down", label: "Rejected down off -1σ" };
  t(step(lane, p, { side: "down", label: "Rejected down off -1σ" }, {}, false) === false, nm + ": the same read re-booked itself");
}
const pc = { side: "down", label: flip };
t(step("recon-togp", pc, { side: "down", label: "Rejected down off -1σ" }, {}, false) === false, "the copy (recon-togp) changed - fix463 is main + rejection only");
const p5 = { side: "down", label: flip };
t(step("recon-rej5", p5, { side: "down", label: "Rejected down off -1σ" }, {}, false) === false && p5.label === flip, "the 5M read lane (recon-rej5) changed - it must stay as it was");
console.log(ok ? "INDEPENDENT CALLS TEST ✓ - main + rejection: no read in her wrong third (12:31 PM gold long never her call); a flipped read is never her call; every fresh read replaces an unfilled one (12:31 PM gold short goes to the walls); only a fill or an order on the wire closes the window; copy + 5M unchanged." : "INDEPENDENT CALLS TEST: FAIL");
process.exit(ok ? 0 : 1);
