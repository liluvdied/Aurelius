// fix848 proof: NEVER TRADE AGAINST A HELD POSITION (Love Nov 6 2026 ~5:58 PM PT: "she just flipped sides on eth, it was long and now it's short").
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("HELD OTHER WAY 848 TEST: FAIL - " + m); } };
const K = fs.readFileSync(path.join(root, "src/lib/desk/kalshi-live.server.ts"), "utf8");
const ts = require(path.join(root, "node_modules/typescript"));
const i = K.indexOf("export function oppSide848("), body = K.slice(i, K.indexOf("\n}\n", i) + 3);
const opp = new Function(ts.transpileModule(body, { compilerOptions: { target: 99 } }).outputText.replace("export function", "function") + "; return oppSide848;")();
// 5:45 PM: her 10.93 YES long on ETH; 5:47 PM the ETH book's down call (an ask) must place NOTHING
t(/HELD THE OTHER WAY/.test(opp(10.93, "ask")), "a held YES and a short (ask) must place nothing");
t(/HELD THE OTHER WAY/.test(opp(-3.03, "bid")), "a held NO and a long (bid) must place nothing");
t(opp(10.93, "bid") === "" && opp(-3.03, "ask") === "" && opp(0, "ask") === "" && opp(0, "bid") === "", "same side or nothing held must still trade");
const fn = (name) => { const s = K.indexOf(name), e = K.indexOf("\nasync function ", s + 10); return K.slice(s, e > 0 ? e : s + 6000); };
const before = (blk, guard) => { const g = blk.indexOf(guard), p = blk.indexOf('kalshi("POST", "/trade-api/v2/portfolio/events/orders"'); return g > 0 && p > 0 && g < p; };
const send = fn("async function sendOrder(ticker, bookSide");
const entryGuard = /const o848 = await oppHeld848\(ticker, bookSide\);[^]*?if \(o848\) \{[^}]*?sent\.__aureliusBlock = o848;[^}]*?return null;\s*\}/.exec(send);
t(!!entryGuard && before(send, entryGuard[0]), "every book's entry (sendOrder, where every order goes out) does not check the held side before it sends");
t(before(fn("async function addOnBuy600("), "await oppHeld848(ticker, side === \"up\" ? \"bid\" : \"ask\"); if (o848) return no(o848);"), "the ETH book / add-on route (addOnBuy600) does not check the held side");
t(before(fn("async function addOnBuy("), "await oppHeld848(ticker, side === \"up\" ? \"bid\" : \"ask\"); if (o848) return { ok: false, reason: o848 };"), "the add-ons (addOnBuy) do not check the held side");
t(before(fn("async function topUpFlat609("), "const o848 = await oppHeld848(ticker, bookSide);"), "the top-up does not check the held side");
t(!/oppHeld848/.test(fn("async function partLive(")) && !/oppHeld848/.test(fn("async function flattenTicker(")) && !/oppHeld848/.test(fn("async function restTakeProfit(")), "exits / take profits must never be blocked by it");
console.log(ok ? "HELD OTHER WAY 848 TEST ✓ - a held YES + a short call (or a held NO + a long call) places nothing on every opening path (book entries, the ETH / add-on route, add-ons, top-up); same side still trades; exits and take profits untouched." : "HELD OTHER WAY 848 TEST: FAIL");
process.exit(ok ? 0 : 1);
