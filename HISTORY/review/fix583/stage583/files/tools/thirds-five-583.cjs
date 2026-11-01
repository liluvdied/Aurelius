// fix583 THIRDS FREE AT $5 (Love Nov 1 2026: "Find the line that is still waiting past $5 and make $5 the cast. Nothing else."):
// the falling-from-the-top-third / rising-from-the-bottom-third wall frees on her $5 BTC break off the high/low (was $8). Gold 33c and the arming distance untouched.
// FAILS on the pre-583 bandlock (a $6 drop off the high still holds the short), PASSES after.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("THIRDS $5 583 TEST: FAIL - " + m); } };
function grab(src, head) { const i = src.indexOf(head); if (i < 0) return null; const m = /\)\s*:\s*string\s*\{/.exec(src.slice(i)); let j = i + m.index + m[0].length - 1, d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1).replace(/^export /, ""); } } return null; }
const f = grab(B, "export function reconThirdAgainst(");
if (!f) { console.log("THIRDS $5 583 TEST: FAIL - reconThirdAgainst missing"); process.exit(1); }
const stubs = "type Line = { name: string; price: number }; const G: any = globalThis; let __open = 0; function fiveOpenNow(a) { return __open; } function wallFor(x) { return x; } function wallLines(a, L) { return L; } function isSessBand(l) { return /σ$|^session VWAP$/.test(String(l.name)); }\n";
const R = new Function(ts.transpileModule(stubs + f + "; return { reconThirdAgainst, setOpen: (o) => { __open = o; } };", { compilerOptions: { target: 99 } }).outputText)();
const now = Date.now(), f0 = Math.floor(now / 300000) * 300000;
const L = [{ name: "+1σ", price: 77300 }, { name: "-1σ", price: 77000 }, { name: "session VWAP", price: 76800 }];
const run = (asset, Lx, open, trail, tick, side) => { R.setOpen(open); globalThis.__qtrail_1 = { [asset]: trail.map((c, i) => ({ t: f0 + 1000 * (i + 1), c })) }; return R.reconThirdAgainst(asset, Lx, tick, side, new Map()); };
// BTC short: rose from the bottom third (low 77040), high after 77100
t(/rising from the bottom third/.test(run("btc", L, 77050, [77040, 77070, 77100], 77096, "down")), "a $4 drop off the high freed the short (must still wait for $5)");
t(run("btc", L, 77050, [77040, 77070, 77100], 77095, "down") === "", "a $5 drop off the high did NOT free the short (her $5 break is the cast)");
t(run("btc", L, 77050, [77040, 77070, 77100], 77094, "down") === "", "a $6 drop off the high still held the short (was the $8 wait)");
// BTC long mirror: fell from the top third (high 77260), low after 77200
t(/falling from the top third/.test(run("btc", L, 77250, [77260, 77230, 77200], 77204, "up")), "a $4 bounce off the low freed the long");
t(run("btc", L, 77250, [77260, 77230, 77200], 77205, "up") === "", "a $5 bounce off the low did NOT free the long");
// arming distance untouched: a $3 rise off the low (under the old $4 arm) never walls
t(run("btc", L, 77050, [77040, 77043], 77043, "down") === "", "the arming distance changed (a $3 rise armed the wall)");
// gold untouched: 33c
const Lg = [{ name: "+1σ", price: 4030 }, { name: "-1σ", price: 4000 }];
t(/rising from the bottom third/.test(run("gold", Lg, 4002, [4001, 4005, 4006], 4005.75, "down")), "gold changed (a 25c drop off the high freed the short; gold stays 33c)");
t(run("gold", Lg, 4002, [4001, 4005, 4006], 4005.6, "down") === "", "gold 40c drop did not free the short");
t(/fix583/.test(B) && (B.match(/< rel583\)/g) || []).length === 4, "both thirds walls (awayVerdict + reconThirdAgainst) do not free at rel583");
console.log(ok ? "THIRDS $5 583 TEST ✓ - the thirds wall frees on her $5 BTC break (long + short), $4 still waits, arming + gold 33c untouched." : "THIRDS $5 583 TEST: FAIL");
process.exit(ok ? 0 : 1);
