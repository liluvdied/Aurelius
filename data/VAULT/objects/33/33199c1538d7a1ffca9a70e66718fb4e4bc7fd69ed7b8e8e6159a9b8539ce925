// fix448 behaviour test (Love Oct 28 2026 10:56 PM PT: "yes please fix that and add the log pls"): replays the 10:50 PM gold moment - the rejection model's own read empty,
// her twin reading "Rejected up off Green zone" - the rejection model must book it; a non-zone twin read, or her own read present, must not be overridden.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const R = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/recon.ts"), "utf8");
const li = R.split("\n").find((x) => x.includes("if (id === \"gold\") { if (!lookRM && lookRX && /(Green|Red) zone/"));
if (!li) { console.log("ZONE PICKUP TEST: FAIL - fix448 missing"); process.exit(1); }
const run = (lookRM, lookRX, id = "gold") => { const booked = []; let changed = false; const book = (l, c) => { booked.push([l, c.label]); return true; }; new Function("lookRM", "lookRX", "book", "id", "let changed = false; " + li + " return changed;")(lookRM, lookRX, book, id); return booked; };
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("ZONE PICKUP TEST: FAIL - " + m); } };
t(run(null, { side: "up", label: "Rejected up off Green zone" }).length === 1, "10:50 PM: twin's green-zone rejection was not booked for the rejection model");
t(run(null, { side: "up", label: "Rejected up off -1σ" }).length === 0, "a non-zone twin read was booked");
t(run({ side: "down", label: "Rejected down off 5m PP" }, { side: "up", label: "Rejected up off Green zone" }).length === 0, "her own read was overridden by the twin");
t(run(null, { side: "up", label: "Rejected up off Green zone" }, "btc").length === 0, "BTC was changed (the pickup is gold only)");
t(R.includes('appendFileSync(D("rej-reads-gold.jsonl")'), "the gold read log is missing");
console.log(ok ? "ZONE PICKUP TEST ✓ - the rejection model takes the green/red zone rejection her twin sees when her own read is empty; her own read is never overridden; gold read log on." : "ZONE PICKUP TEST: FAIL");
process.exit(ok ? 0 : 1);
