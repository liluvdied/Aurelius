// fix582 SESSION BAND $5 = HER ENTRY (Love Nov 1 2026: "she just waited until she was halfway down the channel to short ... The entry is $5 past the pink or session band on a valid flip. Nothing else."):
// replays the 1:48 AM PT BTC short "Rejected down off +2σ" (+2σ 78,036, +1σ 77,851, unbroken pink 77,952, price 77,973 = $21 over the pink, inside the 20% pink tolerance).
// Before fix582 the read (pinkRead464), the pink reach (reachWall429) and the pink tolerance wall (pinkShortWall464) held it until the pink broke at 77,947 - halfway down.
// Proves: the session-band read $5+ past its band arms the waiver, and with the waiver every pink-distance wall lets the short go; without it they still hold (the pink
// still guards everything that is NOT a session-band $5 entry); $4 past the band does not arm it; a pink-based read does not arm it. Run by requests.py check.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8"), B = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("SESSION $5 582 TEST: FAIL - " + m); } };
function grab(src, head) { const i = src.indexOf(head); if (i < 0) { console.log("SESSION $5 582 TEST: FAIL - missing " + head); process.exit(1); } let j; if (/function/.test(head)) { const m = /\)\s*:\s*[\w<>| ]+\s*\{/.exec(src.slice(i)); j = i + m.index + m[0].length - 1; } else j = src.indexOf("{", src.indexOf("=", i)); let d = 0; for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) return /function/.test(head) ? src.slice(i, k + 1) : src.slice(i, src.indexOf(";", k) + 1); } } }
const one = (src, h) => src.slice(src.indexOf(h), src.indexOf("\n", src.indexOf(h)));
// recon: the waiver arm
const rjs = ts.transpileModule(["type Line = { name: string; price: number; unit?: number };", grab(R, "const BREAK:"), grab(R, "function sessFree582R(")].join("\n"), { compilerOptions: { target: 99 } }).outputText;
const arm = new Function(rjs + "; return sessFree582R;")();
const L = [{ name: "+2σ", price: 78036 }, { name: "+1σ", price: 77851 }, { name: "session VWAP", price: 77666 }, { name: "5m PP", price: 77952 }, { name: "5m R1", price: 78150 }, { name: "5m S1", price: 77800 }];
globalThis.__sessFree582 = {};
t(!arm("btc", "down", "Rejected down off +2σ", 78032, L, "recon-tog") && !globalThis.__sessFree582["btc:down:recon-tog"], "a +2σ rejection only $4 past the band armed the waiver (her break is $5)");
t(!arm("btc", "down", "Rejected down off 5m PP", 77940, L), "a PINK read armed the session-band waiver (pink keeps its own $5 break)");
t(!arm("btc", "up", "Rejected down off +2σ", 77973, L), "a long armed off a short's label");
// bandlock walls, with and without the waiver
const parts = ["type Line = { name: string; price: number; unit?: number };", "type Zones = { pp: number; r1: number; r2: number; s1: number; s2: number };",
  one(B, "const isSessBand = "), grab(B, "export const BREAK_DIST"), grab(B, "export const ZONE_REACH_PCT"), grab(B, "export const REACH429"), one(B, "export const PINK_PCT429"),
  B.slice(B.indexOf("export const PINK_PCT459"), B.indexOf(";", B.indexOf("export const PINK_PCT459")) + 1), one(B, "export const __PINKFLAT25"), one(B, "export function pinkSlide580("),
  one(B, "export function sessFree582("), grab(B, "export function zoneReachSlide("), grab(B, "export function reachWall429("), grab(B, "export function pinkShortWall464("),
  "const PINK_BREAK432 = { btc: 5, gold: 0.25 }; const __PINKSLIDE_OFF581 = true; function anyGreen521() { return false; } function turnFlip530() { return false; } function pinkSpent515c() { return false; } function fiveOpenNow(a) { return 0; } function zonesNow(a) { return null; }",
].map((x) => x.replace(/^export /, ""));
const W = new Function(ts.transpileModule(parts.join("\n"), { compilerOptions: { target: 99 } }).outputText + "; return { reachWall429, pinkShortWall464 };")();
const Z = { pp: 77952, r1: 78150, r2: 78250, s1: 77700, s2: 77600 };
globalThis.__sessFree582 = {};
const r0 = W.reachWall429("btc", L, 77973, "down", Z, 77955), s0 = W.pinkShortWall464("btc", L, 77973, "down");
t(/5m PP/.test(r0), "control: without the waiver the pink reach did not hold the short $21 over the pink (board broken): " + r0);
t(/UNBROKEN PINK/.test(s0), "control: without the waiver the pink tolerance did not hold the short (board broken): " + s0);
t(arm("btc", "down", "Rejected down off +2σ", 77973, L, "recon-tog") && globalThis.__sessFree582["btc:down:recon-tog"], "the 1:48 AM +2σ rejection ($63 past +2σ) did NOT arm her session-band waiver");
const r1 = W.reachWall429("btc", L, 77973, "down", Z, 77955), s1 = W.pinkShortWall464("btc", L, 77973, "down");
t(!/5m PP/.test(r1), "with the waiver the pink reach STILL held the session-band $5 short: " + r1);
t(s1 === "", "with the waiver the pink tolerance STILL held the session-band $5 short: " + s1);
globalThis.__curBook465 = "recon-rej"; t(/UNBROKEN PINK/.test(W.pinkShortWall464("btc", L, 77973, "down")), "a waiver main armed freed the REJECTION book's short (must be per book)");
globalThis.__curBook465 = "recon-tog"; t(W.pinkShortWall464("btc", L, 77973, "down") === "", "main's own waiver did not free main's short at its door");
globalThis.__curBook465 = "recon-rej5"; t(/UNBROKEN PINK/.test(W.pinkShortWall464("btc", L, 77973, "down")), "the walled-off 5M rode main's waiver");
globalThis.__sessFree582 = {}; t(arm("btc", "down", "Rejected down off +2σ", 77973, L, "recon-rej5") && !globalThis.__sessFree582["btc:down:recon-rej5"], "the 5M lane armed a waiver");
t(arm("btc", "down", "Rejected down off +2σ", 77973, L, "recon-tog", false) && !globalThis.__sessFree582["btc:down:recon-tog"], "the read logger (arm=false) armed a waiver");
globalThis.__curBook465 = "";
globalThis.__sessFree582 = { "btc:down:recon-tog": Date.now() - 11000 };
t(/UNBROKEN PINK/.test(W.pinkShortWall464("btc", L, 77973, "down")), "a waiver older than 10 s still freed the short");
t(/fix582/.test(R) && (R.match(/sessFree582R\(id, /g) || []).length >= 4, "the read sites (main, rejection, every book) do not call sessFree582R");
t(/!\(typeof sessFree582 === "function" && sessFree582\(asset, side\)\) \/\* fix582: a session-band \$5 entry skips the pink cushion/.test(B), "the pink cushion (fix514) does not honour the waiver");
console.log(ok ? "SESSION $5 582 TEST ✓ - a session-band read $5 past its band is her entry: the read, the pink reach, the pink tolerance and the pink cushion no longer hold it; $4 waits; a pink read keeps its own $5 break; without the waiver the pink still guards." : "SESSION $5 582 TEST: FAIL");
process.exit(ok ? 0 : 1);
