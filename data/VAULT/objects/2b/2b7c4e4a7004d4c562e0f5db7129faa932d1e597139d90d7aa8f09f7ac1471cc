// fix455 behaviour test (Love Oct 29 2026 10:17 AM PT: "we can double up on 8pm hun , $10 initial entry and $5 initial add on - $5 secondary add on at the next band price encounters and rejects"):
// the Kalshi ceiling is $10 only at BTC 8 PM (kalshiCeilingByHour) and maxDollars() everywhere else; the second add-on block is wired, same side, hour/book gated, walls on.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const K = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/kalshi-live.server.ts"), "utf8");
const E = fs.readFileSync(process.argv[3] || path.join(root, "src/lib/desk/engine.ts"), "utf8");
const i = K.indexOf("function kalshiCeil(ticker) {"); if (i < 0) { console.log("8 PM TEST: FAIL - kalshiCeil missing"); process.exit(1); }
let d = 0, j = K.indexOf("{", i); for (let k = j; k < K.length; k++) { if (K[k] === "{") d++; else if (K[k] === "}") { d--; if (d === 0) { j = k + 1; break; } } }
const js = ts.transpileModule(K.slice(i, j), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const sw = { maxDollars: 5, kalshiCeilingByHour: { btc: { "20": 10 } } };
const mk = (hourPT) => new Function("readFileSync", "join", "maxDollars", "Date", js + "; return kalshiCeil;")(() => JSON.stringify(sw), (...a) => a.join("/"), () => 5, class extends Date { constructor(...a) { if (a.length) super(...a); else super(Date.UTC(2026, 9, 29, (hourPT + 7) % 24, 5)); } });
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("8 PM TEST: FAIL - " + m); } };
t(mk(20)("KXBTC15M-26OCT292015-15") === 10, "BTC 8 PM ceiling is not $10");
t(mk(19)("KXBTC15M-26OCT291915-15") === 5, "BTC 7 PM ceiling changed");
t(mk(20)("KXGOLD15M-26OCT292015-15") === 5, "gold 8 PM ceiling changed");
t(K.includes("let cap = kalshiCeil(body.ticker);") && K.includes("Math.min(offMainD, kalshiCeil(ticker) /* fix455 */)"), "the $10 ceiling is not wired into the wire cap and the entry budget");
t(E.includes("second add-on (fix455)") && E.includes("hrs2.map(Number).includes(hB2) && bk2.includes(own2)") && E.includes("live.addOnBuy(row.ticker, mySide, Number(ao2.dollars) || 5, cap2, false)"), "the second add-on is not wired (same side, hour + book gated, walls on)");
const P = fs.readdirSync(path.join(root, "src/lib/desk")).filter((f) => /poly/i.test(f)).map((f) => fs.readFileSync(path.join(root, "src/lib/desk", f), "utf8")).join("\n");
t(!P.includes("kalshiCeil"), "Polymarket reads the Kalshi ceiling");
console.log(ok ? "8 PM TEST ✓ - BTC 8 PM: $10 Kalshi ceiling (everything else $5, Polymarket untouched); second $5 add-on wired same side, BTC 8 PM rejection only, walls on." : "8 PM TEST: FAIL");
process.exit(ok ? 0 : 1);
