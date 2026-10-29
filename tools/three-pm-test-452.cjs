// fix452 behaviour test (Love Oct 29 2026 9:42 AM PT: "3pm ✅ (bollingers, green/red zones only) (for btc and gold pls)"): at 3 PM PT the rejection model takes only Bollinger / green-red zone calls.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const E = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
const li = E.split("\n").find((x) => x.includes("3 PM = BOLLINGERS AND ZONES ONLY (fix452)") && x.includes("if ("));
if (!li) { console.log("3 PM TEST: FAIL - fix452 missing"); process.exit(1); }
const js = ts.transpileModule(li, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const run = (hour, book, setup) => { const RealDate = Date; const D = class extends RealDate { constructor(...a) { if (a.length) super(...a); else super(Date.UTC(2026, 9, 29, (hour + 7) % 24, 10)); } }; return new Function("done", "row", "Date", "for (const _ of [0]) { " + js + " return 'went'; } return 'held';")({}, { id: "x", book, setup, ticker: "T", side: "up" }, D); };
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("3 PM TEST: FAIL - " + m); } };
t(run(15, "recon-rej", "Rejected up off Green zone") === "went", "3 PM green-zone rejection was held");
t(run(15, "recon-rej", "Rejected down off Bollinger upper") === "went", "3 PM Bollinger rejection was held");
t(run(15, "recon-rej", "Rejected up off 5m PP") === "went", "3 PM pink rejection was held (fix454: pink allowed)");
t(run(15, "recon-tog", "Rejected up off -1σ") === "held", "3 PM main session-band call went through (fix454: main holds BTC 3 PM)");
t(run(15, "recon-tog", "Rejected down off Bollinger upper") === "went", "3 PM main Bollinger call was held");
t(run(15, "recon-rej", "Rejected up off -1σ") === "held", "3 PM session-band rejection went through");
t(run(14, "recon-rej", "Rejected up off 5m PP") === "went", "2 PM pink rejection was held (other hours unchanged)");
t(run(15, "recon-dly", "Rejected up off -1σ") === "went", "another book was changed");
console.log(ok ? "3 PM TEST ✓ - at 3 PM the book holding the seat (BTC main, gold rejection) takes only pink, Bollinger and green/red zone calls; other hours and books unchanged." : "3 PM TEST: FAIL");
process.exit(ok ? 0 : 1);
