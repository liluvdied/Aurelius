// CHECK HER RULES (R199/R200/R204, Love Oct 29 2026 1:08 PM PT: "check every rule for both sides. twice. then do it again" + 1:15 PM: "double check that every rule and cornerstone works on
// both sides, for main and rejection"). READ-ONLY. Lifts her REAL wall / read / hold functions out of the code she is running (or a folder you name) and plays today's real misses plus
// every rule LONG and its mirror SHORT (prices reflected, zones swapped). Prints a table; any ✗ goes to the top in red. Usage: node tools/check-her-rules.cjs [desk folder]
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ARGS = process.argv.slice(2).filter((a) => !a.startsWith("--")), ONLY5 = process.argv.includes("--only5m"), NO5 = process.argv.includes("--no5m");
const DIR = ARGS[0] || path.join(root, "src/lib/desk");
const ts = require(path.join(root, "node_modules/typescript"));
const BL = fs.readFileSync(path.join(DIR, "bandlock.ts"), "utf8"), EN = fs.readFileSync(path.join(DIR, "engine.ts"), "utf8"), RC = fs.readFileSync(path.join(DIR, "recon.ts"), "utf8");
const has = (src, h) => src.includes(h);
function grab(src, head) { const i = src.indexOf(head); if (i < 0) return null; let j;
  if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>|" {};:,\[\]]+?\s*\{\n/.exec(src.slice(i)); j = i + m.index + m[0].length - 2; } else j = src.indexOf("{", src.indexOf("=", i));
  let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } return null; }
const one = (src, h) => (src.includes(h) ? src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h))) : "");
const tp = (parts, names) => { const ok = parts.filter(Boolean); return new Function(ts.transpileModule(ok.map((x) => x.replace(/^export /, "")).join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return {" + names.filter((n) => ok.some((p) => p.includes("function " + n + "("))).join(",") + "};")(); };
const W = tp(["type Line = { name: string; price: number; unit?: number }; type Zones = { pp: number; r1: number; r2: number; s1: number; s2: number };",
  one(BL, "const isSessBand = "), grab(BL, "export const BREAK_DIST"), grab(BL, "export const ZONE_REACH_PCT"), grab(BL, "export const REACH429"), one(BL, "export const PINK_PCT429"), grab(BL, "export const PINK_PCT459"),
  one(BL, "export const PINK_BREAK432"), grab(BL, "export const PINK_TAP"), "const isChanBand = (a, l) => /σ$|^session VWAP$|^fresh VWAP$/.test(String(l.name)); function chanL(a, L) { return L; } function squeezedPinkOf(L) { return () => false; }",
  "function fiveOpenNow(a) { return 0; } function zonesNow(a) { return null; } function fiveHLNow(a) { return null; }",
  grab(BL, "export function zoneReachSlide("), grab(BL, "export function reachWall429("), grab(BL, "export function pinkBeyond459("), grab(BL, "export function pinkLongWall432("), grab(BL, "export function pinkShortWall464("),
  grab(BL, "export function sameSide434("), grab(BL, "export function brokeThisCandle441("), grab(BL, "export function brokeThisCandle457("), grab(BL, "export function thirdsMove464("),
  grab(BL, "export function aheadBeyond460("), grab(BL, "export function sessionAheadWait(")],
  ["reachWall429", "pinkLongWall432", "pinkShortWall464", "sameSide434", "brokeThisCandle441", "brokeThisCandle457", "thirdsMove464", "aheadBeyond460", "sessionAheadWait"]);
const H = tp([grab(EN, "export function slideHold403("), grab(EN, "export function climbHold464(")], ["slideHold403", "climbHold464"]);
const R = tp([grab(RC, "export function thirdsRead463("), grab(RC, "export function pinkRead464(")], ["thirdsRead463", "pinkRead464"]);
const rows = [];
const add = (rule, longOk, shortOk, miss = "") => rows.push({ rule, longOk, shortOk, miss });
const C = 4000, mir = (x) => 2 * C - x, mL = (L) => L.map((l) => ({ ...l, name: String(l.name).replace(/^-(\d)/, "+$1").replace(/^\+(\d)/, (m0, d) => "-" + d).replace(/^5m R1$/, "5m S1x").replace(/^5m S1$/, "5m R1").replace("5m S1x", "5m S1"), price: mir(l.price) }));
const mZ = (z) => z && { pp: mir(z.pp), r1: mir(z.s1), r2: mir(z.s2), s1: mir(z.r1), s2: mir(z.r2) }, mHL = (hl) => hl && { h: mir(hl.l), l: mir(hl.h) };
const fl = (s) => (s === "up" ? "down" : "up");
// each case: f(L, tick, side, extra) must REFUSE (true) or ALLOW (false); its mirror must do the same for the other side
function both(rule, fn, L, tick, side, want, extra = {}, miss = "") {
  if (!fn) { add(rule, false, false, "NOT IN HER CODE"); return; }
  const a = !!fn(L, tick, side, extra), b = !!fn(mL(L), mir(tick), fl(side), { o5: extra.o5 && mir(extra.o5), hl: mHL(extra.hl), Z: mZ(extra.Z) });
  const lo = side === "up" ? a : b, sh = side === "up" ? b : a;
  add(rule, lo === want, sh === want, miss);
}
const Zfar = { pp: 3900, r1: 4300, r2: 4400, s1: 3800, s2: 3700 };
const L1 = [{ name: "-1.5σ", price: 3995.53 }, { name: "-1σ", price: 3999.58 }, { name: "-0.5σ", price: 4003.63 }, { name: "session VWAP", price: 4007.69 }, { name: "5m PP", price: 4003.05 }];
both("Her reach wall: session band / pink / zones within reach (fix429)", W.reachWall429 && ((L, t, s, x) => W.reachWall429("gold", L, t, s, x.Z || Zfar, x.o5)), L1, 3999.76, "up", true, { o5: 3998.0, Z: Zfar }, "Oct 28 7:40 PM gold long into unbroken -1σ");
const G = [{ name: "-1σ", price: 4018.08 }, { name: "session VWAP", price: 4031.35 }];
both("Never trade into an unbroken pink, inside 15% (fix432 + fix464)", (L, t, s) => (s === "up" ? W.pinkLongWall432 : W.pinkShortWall464)?.("gold", L, t, s), [...G, { name: "5m PP", price: 4021.6 }], 4022.77, "down", true);
both("...pink outside 15% lets her go (fix459 + fix464)", (L, t, s) => (s === "up" ? W.pinkLongWall432 : W.pinkShortWall464)?.("gold", L, t, s), [...G, { name: "5m PP", price: 4019.85 }], 4022.77, "down", false, {}, "1:02:06 PM pink at 22%");
both("Her 33% session band to session band (fix434)", W.sameSide434 && ((L, t, s, x) => W.sameSide434("gold", L, t, s, x.o5)), G, 4029.5, "up", true, { o5: 4029.4 });
both("Broke it this candle = only the break's direction (fix457)", W.brokeThisCandle457 && ((L, t, s, x) => W.brokeThisCandle457("gold", L, t, s, x.o5, x.hl)), [{ name: "-2σ", price: 4009.24 }, { name: "-1σ", price: 4021.47 }, { name: "-0.5σ", price: 4033.64 }, { name: "5m PP", price: 4019.97 }], 4021.877, "up", true, { o5: 4022.221, hl: { h: 4022.56, l: 4020.6 } }, "10:22:16 AM gold long");
const TMold = tp(["type Line = { name: string; price: number; unit?: number };", "const G = globalThis;", grab(BL, "export const DLY465") ? one(BL, "export const DLY465") : "", grab(BL, "export const PINK_TAP"),
  "const isChanBand = (a, l) => /σ$|^session VWAP$|^fresh VWAP$/.test(String(l.name)); function chanL(a, L) { return L; } function squeezedPinkOf(L) { return () => false; }", grab(BL, "export function lockPctFor("), grab(BL, "export function thirdsMove(")], ["thirdsMove", "lockPctFor"]);
const launch = W.thirdsMove464 ? (L, t, s, x) => { const r = W.thirdsMove464("gold", L, t, x.o5, x.hl); return r && r !== s; } : TMold.thirdsMove ? (L, t, s, x) => { const r = TMold.thirdsMove("gold", L, t, x.o5, x.hl); return r && r !== s; } : null;
both("Her 33% for the candle's launch (fix464 / fix465)", launch, [...G, { name: "5m PP", price: 4019.85 }], 4022.77, "down", true, { o5: 4022.788, hl: { h: 4024.58, l: 4021.23 } }, "1:02:06 PM gold short");
// ---- PER BOOK: every book but the delayed book (main, rejection, the copies, the 5M) ----
const lp = (book, w) => { globalThis.__curBook465 = book; try { return TMold.lockPctFor ? TMold.lockPctFor("gold", w) : 0; } finally { globalThis.__curBook465 = ""; } };
const B5 = fs.existsSync(path.join(DIR, "bandlock5m27.ts")) ? fs.readFileSync(path.join(DIR, "bandlock5m27.ts"), "utf8") : "", R5 = fs.existsSync(path.join(DIR, "recon5m.ts")) ? fs.readFileSync(path.join(DIR, "recon5m.ts"), "utf8") : "", F5 = fs.existsSync(path.join(DIR, "five5m.ts")) ? fs.readFileSync(path.join(DIR, "five5m.ts"), "utf8") : "";
const doorMR = ["reachWall429(asset, lbR.L", "pinkLongWall432(asset, lbR.L", "pinkShortWall464(asset, lbR.L", "sameSide434(asset, lbR.L"].every((k) => BL.includes('if (book === "recon-tog" || book === "recon-rej") { const ' + (k.startsWith("reach") ? "rw429 = " : k.startsWith("pinkLong") ? "pl432 = " : k.startsWith("pinkShort") ? "ps464 = " : "ss434 = ") + k));
const readMR = RC.includes('if (lane === "recon-tog" || lane === "recon-rej") { try { if (thirdsRead463(') && RC.includes("pinkRead464(id, sessionLines(ax, id), spot, look.side");
const doorOther = BL.includes('if (book !== "recon-tog" && book !== "recon-rej" && !DLY465.has(book))') && /reachWall429\(asset, lbR\.L, qR\.c, side\), pinkLongWall432\(asset, lbR\.L, qR\.c, side\), pinkShortWall464\(asset, lbR\.L, qR\.c, side\), sameSide434/.test(BL);
const readOther = RC.includes('if (lane !== "recon-tog" && lane !== "recon-rej" && lane !== "recon-dly" && lane !== "recon-dlyk") { try { if (thirdsRead463(');
const slopeMR = EN.includes('if (row.side === "down"') && EN.includes("climbHold464(") && EN.includes('["recon-rej", "recon-tog"].includes(String(row.book))');
const door5 = /reachWall466\(asset, lbR\.L, qR\.c, side\), pinkLongWall466\(asset, lbR\.L, qR\.c, side\), pinkShortWall466\(asset, lbR\.L, qR\.c, side\), sameSide466/.test(B5) && B5.includes("thirdsMove466(asset, lbR.L");
const lp5 = /export function lockPctFor\(asset: string, width: number\): number \{\n  return 0\.33; \/\/ fix466/.test(B5);
const read5 = R5.includes("thirdsRead466(sessionLines(ax, id), spot, look.side)") && R5.includes("pinkRead466(id, sessionLines(ax, id), spot, look.side") && R5.includes("lockP466");
const slope5 = F5.includes("slideHold466(S466.s") && F5.includes('climbHold466(S466.s');
for (const [nm, bk] of [["MAIN", "recon-tog"], ["REJECTION", "recon-rej"], ["NO-PINK COPY", "recon-togp"], ["PURE NO-PINK", "recon-np"]]) {
  const mr = bk === "recon-tog" || bk === "recon-rej";
  const ok33 = Math.abs(lp(bk, 20) - 0.33) < 1e-9 && Math.abs(lp(bk, 600) - 0.33) < 1e-9;
  add(`${nm}: hard 33% at every width (door)`, ok33, ok33);
  add(`${nm}: pink 15/20 + never into an unbroken pink + her 33% at the door`, mr ? doorMR : doorOther, mr ? doorMR : doorOther);
  add(`${nm}: her 33% + the pink in the READ`, mr ? readMR : readOther, mr ? readMR : readOther);
  if (mr) add(`${nm}: pink slope holds (downslope long / upslope short) on her live orders`, slopeMR, slopeMR);
}
const dlyKeep = TMold.lockPctFor ? Math.abs(lp("recon-dly", 20) - 0.2) < 1e-9 : false;
add("DELAYED BOOK: untouched - keeps her own shares (20% on a $20 gold channel, as before)", dlyKeep, dlyKeep);
if (B5) { add("5M: hard 33% at every width (her walls)", lp5, lp5); add("5M: pink 15/20 + never into an unbroken pink + 33% at her door", door5, door5); add("5M: her 33% + the pink in her READ", read5, read5); add("5M: pink slope holds (long + short) on her buys", slope5, slope5); }

const LB = [{ name: "session VWAP", price: 80470.81 }, { name: "+1σ", price: 81081.42 }, { name: "5m PP", price: 80754.62 }];
const doorAhead = (L, t, s) => (W.aheadBeyond460 && W.aheadBeyond460(L, t, s) ? "" : W.sessionAheadWait ? W.sessionAheadWait("btc", L, t, s) : "x");
both("Session band ahead only inside her thirds (fix413 + fix460)", (L, t, s) => doorAhead(L.map((l) => ({ ...l, price: (l.price - 80000) / 50 + 3980 })), (t - 80000) / 50 + 3980, s), LB, 80741.5, "down", false, {}, "11:23:32 AM BTC short");
const LB2 = [{ name: "session VWAP", price: 80470.81 }, { name: "+1σ", price: 81081.42 }, { name: "5m PP", price: 80640 }];
both("...inside her bottom/top 33% it still waits (fix413)", (L, t, s) => doorAhead(L.map((l) => ({ ...l, price: (l.price - 80000) / 50 + 3980 })), (t - 80000) / 50 + 3980, s), LB2, 80630, "down", true);
// holds: upslope / downslope pink (time series)
const pts = [[0, 4016.28, 4013.9], [540, 4018.19, 4015.9], [960, 4019.83, 4017.0], [1320, 4021.61, 4018.51], [1740, 4022.77, 4019.85]];
const sm = []; for (let i = 0; i < pts.length - 1; i++) for (let s = pts[i][0]; s < pts[i + 1][0]; s += 15) { const f = (s - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); sm.push({ t: s * 1000, p: pts[i][1] + f * (pts[i + 1][1] - pts[i][1]), pp: pts[i][2] + f * (pts[i + 1][2] - pts[i][2]) }); }
const smM = sm.map((x) => ({ t: x.t, p: mir(x.p), pp: mir(x.pp) }));
const shortHeld = !!(H.climbHold464 && H.climbHold464(sm, { on: false }, 1741000, "gold")), longHeld = !!(H.slideHold403 && H.slideHold403(smM, { on: false }, 1741000));
add("Pink slope: no long under a sliding pink / no short over a climbing pink (fix403 + fix464)", longHeld, shortHeld, "1:02:06 + 1:15:15 PM gold shorts");
// the read
const thR = (L, t, s) => R.thirdsRead463 && R.thirdsRead463(L, t, s);
both("Her thirds IN THE READ (fix463)", thR, [{ name: "-2σ", price: 4004.95 }, { name: "-1σ", price: 4018.29 }], 4016.65, "up", true, {}, "12:31:31 PM gold long");
both("The pink IN THE READ, inside 15% (fix464)", R.pinkRead464 && ((L, t, s) => R.pinkRead464("gold", L.filter((l) => l.name !== "5m PP"), t, s, L.find((l) => l.name === "5m PP").price)), [...G, { name: "5m PP", price: 4021.6 }], 4022.77, "down", true);
// the $10 rule (target-based): lifted as written in her door
const tl = /if \(Math\.abs\(tgt10 - L10\) <= \(flipRule \? 1\.5 : 1\)[^&]*&& Math\.abs\(tick - L10\) >= 0\.3 && \(side === "up"\) !== \(tick > L10\)\)/.test(BL);
const ten = (tgt, tick, side) => { const L10 = Math.round(tgt / 10) * 10; return Math.abs(tgt - L10) <= 1.5 && Math.abs(tick - L10) >= 0.3 && (side === "up") !== (tick > L10); };
add("$10 level: only away from it, never into it (fix440)", tl && ten(4020, 4018, "up") && !ten(4020, 4018, "down"), tl && ten(4020, 4022, "down") && !ten(4020, 4022, "up"), "Love's 4018 -> 4020 example");
// rules with their own full replay tests (run on this code)
const { spawnSync } = require("child_process");
const run = (args) => spawnSync(args[0], args.slice(1), { encoding: "utf8", env: { ...process.env, AUR_ROOT: root } }).status === 0;
const ic = run(["node", path.join(root, "tools/independent-calls-test-463.cjs"), path.join(DIR, "recon.ts")]);
add("Independent calls, no flips, one EXECUTED trade per window (fix463, no side)", ic, ic, "12:31:37 PM gold short");
const ft = run(["python3", path.join(root, "tools/free-to-trade-test.py"), path.join(DIR, "recon.ts")]);
add("Free to trade: a call she never took never holds her (R008, no side)", ft, ft);
// print
const rows2 = rows.filter((r) => (ONLY5 ? /^5M:/.test(r.rule) : NO5 ? !/^5M:/.test(r.rule) : true)); rows.length = 0; rows.push(...rows2);
const bad = rows.filter((r) => !r.longOk || !r.shortOk);
const red = (s) => "\x1b[31m" + s + "\x1b[0m", grn = (s) => "\x1b[32m" + s + "\x1b[0m";
console.log("\nCHECK HER RULES - main + rejection, LONG and SHORT, on " + (ARGS[0] ? ARGS[0] : "the code she is running now") + "\n");
if (bad.length) { console.log(red("✗ " + bad.length + " RULE(S) FAIL:")); for (const r of bad) console.log(red(`  ✗ ${r.rule}  (long ${r.longOk ? "✓" : "✗"} / short ${r.shortOk ? "✓" : "✗"})${r.miss ? " - " + r.miss : ""}`)); console.log(""); }
console.log("RULE".padEnd(84) + " LONG  SHORT  TODAY'S REAL MISS");
for (const r of rows) console.log(r.rule.slice(0, 83).padEnd(84) + " " + (r.longOk ? grn(" ✓ ") : red(" ✗ ")) + "   " + (r.shortOk ? grn(" ✓ ") : red(" ✗ ")) + "   " + (r.miss || ""));
console.log("\nNOT YET TESTED HERE (no both-sides replay yet - next to close): the 55% pink-to-red / green-to-pink walls, the Bollinger cushion, the zone walls (inside red/green), HER FLIP 2-5m, the 3 PM rule.");
console.log(bad.length ? red("\n✗ NOT ALL OF HER RULES HOLD - tell Claude.") : grn("\n✓ EVERY RULE CHECKED HOLDS, LONG AND SHORT."));
process.exit(bad.length ? 1 : 0);
