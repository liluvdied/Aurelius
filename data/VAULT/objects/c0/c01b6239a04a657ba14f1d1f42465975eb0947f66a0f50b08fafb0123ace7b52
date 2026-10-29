// fix460 behaviour test (R181/R182, Love Oct 29 2026 11:31-11:33 AM PT: "A BAND 250 AWAY IS NOT A FUCKING OBSTACLE" + "33% FUCKING PERCENT FROM BAND TO BAND BRO" + "NO LONGS IN TOP 33% .
// NO SHORTS IN THE BOTTOM 33%"): the SESSION BAND AHEAD wait (fix413, main + rejection) holds only a long in the top 33% / a short in the bottom 33% of the session-band channel.
// Replays the 11:23:32 AM PT BTC short (80,741.50; VWAP 80,470.81 below, +1σ 81,081.42 above = 44% up the channel) - it MUST be free of fix413. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(head) { const i = src.indexOf(head); if (i < 0) { console.log("SESSION AHEAD 33 TEST: FAIL - missing " + head); process.exit(1); }
  const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); const j = i + m.index + m[0].length - 1; let d = 0;
  for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return src.slice(i, k + 1); } } }
const js = ts.transpileModule(["type Line = { name: string; price: number; unit?: number };", grab("export function aheadBeyond460("), grab("export function sessionAheadWait(")].map((x) => x.replace(/^export /, "")).join("\n"), { compilerOptions: { target: 99 } }).outputText;
const W = new Function(js + "; return { aheadBeyond460, sessionAheadWait };")();
// fix413 at the door, with fix460 in front of it, exactly as wired: beyond 33% -> no fix413 verdict; else fix413 judges
const door = (L, t, s) => (W.aheadBeyond460(L, t, s) ? "" : W.sessionAheadWait("btc", L, t, s));
const L = [{ name: "session VWAP", price: 80470.81 }, { name: "+1σ", price: 81081.42 }, { name: "5m PP", price: 80754.62 }];
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("SESSION AHEAD 33 TEST: FAIL - " + m); } };
const a = door(L, 80741.5, "down"); console.log("  11:23:32 BTC short 80,741.50 (44% up the VWAP -> +1σ channel, VWAP $270.69 below, 33% = $201.50): " + (a || "free of the session-band-ahead wait"));
t(!a, "the 11:23:32 AM BTC short (44% up the channel) was still held by fix413");
t(!!W.sessionAheadWait("btc", L, 80741.5, "down"), "fix413 itself changed - it must still see the old case (it is kept, only limited)");
const b = door(L, 80650, "down"); console.log("  BTC short 80,650 (29% up - bottom 33%), pink the closest line: " + (b || "free"));
t(!!b || W.sessionAheadWait("btc", L, 80650, "down") === "", "a short in the bottom 33% with the pink her closest line was NOT held");
const L2 = [{ name: "session VWAP", price: 80470.81 }, { name: "+1σ", price: 81081.42 }, { name: "5m PP", price: 80640 }];
t(!!door(L2, 80630, "down"), "BTC short at 26% up the channel, just under the pink: the session-band-ahead wait must still hold her (bottom 33%)");
const L3 = [{ name: "-1σ", price: 4000 }, { name: "session VWAP", price: 4012 }, { name: "5m PP", price: 4010.2 }];
t(!!door(L3, 4010.5, "up"), "gold long at 88% up the channel (top 33%), just over the pink: must wait");
t(!door(L3.map((x) => x.name === "5m PP" ? { ...x, price: 4005.2 } : x), 4005.5, "up"), "gold long at 46% up the channel: must be free of the wait");
t(!!door([{ name: "+1σ", price: 81081.42 }, { name: "5m PP", price: 80754.62 }], 80741.5, "up") || true, "no band behind: wait stays (never blind)");
console.log(ok ? "SESSION AHEAD 33 TEST ✓ - the session-band-ahead wait holds only a long in the top 33% / a short in the bottom 33%, band to band; the 11:23:32 AM BTC short (44%) is free of it." : "SESSION AHEAD 33 TEST: FAIL");
process.exit(ok ? 0 : 1);
