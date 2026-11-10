// fix1073 test: her hourly order-log clear moves unfinished rows older than a day into the archive; nothing is lost; the last 24 h stays untouched.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "../src/lib/desk/selfcheck.ts"), "utf8");
const a = src.indexOf("const cut = Date.now() - 3.5 * 3600000;"), b = src.indexOf("else keep[k] = v;", a);
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("ORDER LOG CLEAR 1073 TEST: FAIL - " + m); } };
t(a > 0 && b > a, "her hourly clear loop was not found");
const body = src.slice(a, b) + "else keep[k] = v;\n }\n return { keep, lines, moved };";
const run = new Function("d0", body.replace(/const keep: Record<string, any> = \{\}/, "const keep = {}").replace(/as \[string, any\]\[\]/, ""));
const H = 3600000, now = Date.now(), at = (h) => new Date(now - h * H).toISOString();
const d = {
  oldBlocked: { at: at(300), status: "blocked", final: false }, oldHeld: { at: at(30), status: "held" }, oldSkipped: { at: at(25), status: "skipped", final: false }, oldPartial: { at: at(50), status: "partial", final: false },
  oldFilled: { at: at(30), status: "filled", final: false },
  newBlocked: { at: at(5), status: "blocked", final: false }, newHeld: { at: at(23), status: "held" }, newFilled: { at: at(2), status: "filled", final: false }, newPartial: { at: at(3), status: "partial", final: true },
  finalSkip4h: { at: at(4), status: "skipped", final: true }, finalSkip1h: { at: at(1), status: "skipped", final: true }, noTime: { status: "blocked" },
};
const r = run(d); const arch = r.lines.trim().split("\n").map((l) => JSON.parse(l)); const by = Object.fromEntries(arch.map((x) => [x.key, x.archivedBy]));
for (const k of ["oldBlocked", "oldHeld", "oldSkipped", "oldPartial"]) t(by[k] === "fix1073 old unfinished orders", k + ": an unfinished row older than a day stayed in her order log");
t(by.oldFilled === "fix495 old filled orders", "her old filled rows no longer leave the way fix495 moves them");
t(by.finalSkip4h === "fix343 auto-clear", "her finished rows older than 3.5 h no longer leave (fix343)");
for (const k of ["newBlocked", "newHeld", "newFilled", "newPartial", "finalSkip1h", "noTime"]) t(r.keep[k] && !by[k], k + ": a row from the last 24 h (or with no time) was moved - it must stay");
t(arch.length + Object.keys(r.keep).length === Object.keys(d).length && r.moved === arch.length, "a row was lost or counted twice");
for (const x of arch) t(x.at && x.status && x.archivedAt, "an archived row lost its fields");
console.log(ok ? "ORDER LOG CLEAR 1073 TEST: PASS ✓ unfinished rows older than a day leave her order log into the archive; nothing is lost; the last 24 h and her fills stay exactly as before" : "");
process.exit(ok ? 0 : 1);
