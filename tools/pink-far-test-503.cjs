// fix503 behaviour test (Love Oct 29 2026 11:38-11:41 PM PT: "band distance is $10. 15% of that is $1.50." + "pink tolerance is $1.50 at this band distance , not $4" + "btc is $800, so that tolerance would be $160 at the moment." + "she is treating pink as a bigger barrier than it needs to be. it is not an obstacle at those distances" + 11:34 PM: "she is still only waiting for pink to break at any distance. change that please" + 11:36 PM: "make session bands count again as well and rejections from red green bollingers"): the pink holds only inside her tolerance - 15% gold / 20% BTC of the session-band channel, either side. Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
function grab(head) { const i = src.indexOf(head); if (i < 0) { console.log("PINK FAR TEST: FAIL - missing " + head); process.exit(1); } let j; if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i)); let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } }
const one = (h) => src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h)));
const js = ts.transpileModule(["type Line = { name: string; price: number; unit?: number };", one("export const PINK_PCT429"), grab("export const PINK_PCT459"), grab("export function pinkFar503(")].map((x) => x.replace(/^export /, "")).join("\n"), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const F = new Function(js + "; return pinkFar503;")();
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("PINK FAR TEST: FAIL - " + m); } };
const G = [{ name: "-1σ", price: 3995 }, { name: "session VWAP", price: 4005 }, { name: "+1σ", price: 4015 }]; // a $10 band distance: her tolerance is $1.50
t(F("gold", G, 4004.0, 4002.3) === true, "gold: pink $1.70 under price on a $10 channel is NOT an obstacle (her $1.50)");
t(F("gold", G, 4003.5, 4002.3) === false, "gold: pink $1.20 under price on a $10 channel still holds");
t(F("gold", G, 4000.0, 4001.6) === true && F("gold", G, 4000.0, 4001.4) === false, "gold: the long side mirrors ($1.60 far, $1.40 near)");
const B = [{ name: "-1σ", price: 79500 }, { name: "session VWAP", price: 80300 }, { name: "+1σ", price: 81100 }]; // an $800 band distance: her tolerance is $160
t(F("btc", B, 80170, 80000) === true, "BTC: pink $170 under price on an $800 channel is NOT an obstacle (her $160)");
t(F("btc", B, 80020, 80000) === false, "BTC: pink $20 under price (inside her temporary $25 cap, fix542/545) still holds");
t(F("gold", [{ name: "5m PP", price: 4002.3 }], 4009.0, 4002.3) === false, "no session bands readable = never blind, the hold stays");
console.log(ok ? "PINK FAR TEST ✓ - the pink holds only inside her 15% gold / 20% BTC of the band distance, either side." : "PINK FAR TEST: FAIL");
process.exit(ok ? 0 : 1);
