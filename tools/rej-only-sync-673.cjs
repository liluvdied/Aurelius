// fix673 proof: the rejections-only no-pink book (recon-rjnp) runs main's read (bonesDecide, main's flip settings, main's band list + reach), main's thirds, the pink wall, main's door - rejections only (no breaks, no pink, no candle-from-the-third reads), fake-out turns included, re-aims like main.
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8"); let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("REJ ONLY NO PINK 673 TEST: FAIL - " + m); } };
t(R.includes('rj643 = bonesDecide(id, L643, spot, last1m, cur, prev, b, true, rejReach, false, true, true)'), "not main's read (bonesDecide, zone + band flips) on main's reach");
t(R.includes("rejLB = LB; rejReach = reachT;"), "its band list / reach is not main's");
t(R.includes('if (rj643 && thirdsRead463(sessionLines(ax, id), spot, rj643.side, id)) { skip701(') /* fix701: the same thirds wall, now writing its reason */, "not main's thirds");
t(R.includes('bandLockCheck464("recon-tog", id, rj643.side'), "not main's door");
t(R.includes("rj643 = rejFO; // fix673"), "fake-out turns are not hers");
t(R.includes("rejections only - a candle-from-the-third"), "a non-rejection read can still be her call");
t(R.includes('lane === "recon-rjnp" /* fix673 */'), "she does not re-aim like main");
const re = new RegExp(R.match(/if \(rj643 && !(\/\^\(Rejected.*?\/)\.test/)[1].slice(1, -1));
for (const l of ["Rejected down off +1σ", "Failed break below session VWAP - rejected up", "Fake-out turn over -1σ", "Rejected up off Green zone", "2m rejection off Bollinger lower"]) t(re.test(l), "not a rejection: " + l);
for (const l of ["Break below -1σ", "Candle rising from the bottom third", "Launched from the top third (high 1) - a short until the bottom third", "Top third - seen as a short under 1 (was: Rejected up off -1σ)"]) t(!re.test(l), "counted as a rejection: " + l);
console.log(ok ? "REJ ONLY NO PINK 673 TEST ✓ - main's read, reach, thirds, pink wall and door; rejections only (incl. fake-out turns, no breaks, no pink, no candle-third reads); re-aims like main." : "REJ ONLY NO PINK 673 TEST: FAIL"); process.exit(ok ? 0 : 1);
