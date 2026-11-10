// fix703 proof: REJECTIONS · THIRDS AS READ is paper only, judges thirds once (as the read did), and her live books' thirds lines are unchanged unless the twin's own flag is up.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("THIRDS AS READ 703 TEST: FAIL - " + m); } };
const R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8"), B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
const i = R.indexOf("fix703 REJECTIONS · THIRDS AS READ"), blk = R.slice(i, R.indexOf("try { if (lookRM && thirdsRead463(", i));
t(i > 0, "no twin block");
t(/book\("recon-rjt3", t703\)/.test(blk) && !/book\("recon-rej", /.test(blk), "the twin books under another name");
t(/G703\.__thirds703 = true;[\s\S]*finally \{ G703\.__blQuiet464 = false; G703\.__thirds703 = false; \}/.test(blk), "the flag is not cleared in finally");
t((B.match(/!\(globalThis as any\)\.__thirds703 \/\* fix703: paper twin only \*\//g) || []).length === 6, "the door's thirds lines are not all gated (6)");
t(R.includes('try { if (lookRM && thirdsRead463(sessionLines(ax, id), spot, lookRM.side, id)) lookRM = null; }'), "REJECTION's own thirds wall changed");
t(R.includes('RECON.add("recon-rjt3")'), "not a recon paper lane");
// never live: not in any live list or copier path
for (const f of ["src/lib/desk/engine.ts", "src/lib/desk/kalshi-live.server.ts", "src/lib/desk/poly-live.server.ts"]) { try { t(!fs.readFileSync(path.join(root, f), "utf8").includes("recon-rjt3"), f + " names the twin (it must stay paper)"); } catch {} }
try { const ls = JSON.parse(fs.readFileSync(path.join(root, "data/live-switch.json"), "utf8")); t(!JSON.stringify(ls.liveBook || {}).includes("recon-rjt3"), "the twin is on her live list"); } catch {}
// behaviour: with the flag down a top-third long is refused exactly as before; with it up only the thirds percent line stands down
const G = globalThis; G.__thirds703 = false;
const src = B.slice(B.indexOf("  if (!(globalThis as any).__thirds703 /* fix703: paper twin only */ && side === \"up\" && pos >= 1 - TH)"), B.indexOf("  if (!(globalThis as any).__thirds703 /* fix703: paper twin only */ && side === \"down\" && pos <= TH)"));
const f = new Function("side", "pos", "TH", "below", "above", "thTxt", src.replace(/ as any/g, "") + " return '';");
t(/THE IMPOSSIBILITY/.test(f("up", 0.9, 0.2, 1, 2, 20)), "flag down: a long at 90% is no longer refused");
G.__thirds703 = true; t(f("up", 0.9, 0.2, 1, 2, 20) === "", "flag up: the twin is still refused by the percent line"); G.__thirds703 = false;
console.log(ok ? "THIRDS AS READ 703 TEST ✓ - paper twin of REJECTION judges her thirds once, as the read did; her live books' thirds unchanged (flag only around the twin's own door check)." : "THIRDS AS READ 703 TEST: FAIL");
process.exit(ok ? 0 : 1);
