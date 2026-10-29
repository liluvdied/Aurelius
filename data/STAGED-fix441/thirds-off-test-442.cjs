// fix442 behaviour test (Love Oct 28 2026 9:23 PM PT: "yeah no i got rid of the flip."): replays the 9:20 PM gold call "Top third - seen as a short under 4040.77 (was: Rejected up off Green zone)"
// through main's copier - it must never go live; a real call of hers goes; a call already holding a fill keeps its record. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const E = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
const li = E.split("\n").find((x) => x.includes("THIRDS FLIP OFF (fix442)") && x.includes("if ("));
if (!li) { console.log("THIRDS TEST: FAIL - fix442 is missing from engine.ts"); process.exit(1); }
const run = new Function("done", "row", "for (const _ of [0]) { " + ts.transpileModule(li, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText + " return 'went'; } return 'held';");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("THIRDS TEST: FAIL - " + m); } };
const r920 = { id: "g", book: "recon-tog", ticker: "KXGOLD15M-26OCT290030-30", side: "down", setup: "Top third - seen as a short under 4040.77 (was: Rejected up off Green zone)" };
const d1 = {}; t(run(d1, r920) === "held" && d1.g.final === false, "the 9:20 PM thirds-flip short went live for main");
t(run({}, { ...r920, book: "recon-rej", setup: "Bottom third, green candle - seen as a long off 4032.24 (was: Rejected down off 5m PP)" }) === "held", "a bottom-third flipped long went live for rejection");
t(run({}, { ...r920, setup: "Rejected down off 5m PP" }) === "went", "a real call of hers was held");
t(run({ g: { status: "filled", orderId: "x" } }, r920) === "went", "a call already holding a fill lost its path");
t(run({}, { ...r920, book: "recon-dly" }) === "went", "another book was touched");
console.log(ok ? "THIRDS TEST ✓ - the thirds flip is off for main + rejection: the 9:20 PM 'seen as a short' never goes live; her real calls do." : "THIRDS TEST: FAIL");
process.exit(ok ? 0 : 1);
