// fix668 proof: 15% from a band, then 20% of the channel back off it in this 5m candle = she enters, flipped or not (short off a still-green 5m; mirror long off a still-red 5m).
const path = require("path"), fs = require("fs"); const ROOT = process.env.AUR_ROOT || path.join(__dirname, ".."); const ts = require(path.join(ROOT, "node_modules/typescript"));
const out = fs.mkdtempSync("/tmp/r668-"); fs.writeFileSync(path.join(out, "bandlock.js"), ts.transpileModule(fs.readFileSync(path.join(ROOT, "src/lib/desk/bandlock.ts"), "utf8"), { compilerOptions: { module: 1, target: 99 } }).outputText);
fs.writeFileSync(path.join(out, "quotes.js"), "exports.quoteTick=()=>null;exports.feedHealth=()=>({ok:true});"); fs.writeFileSync(path.join(out, "recon.js"), "exports.RECON={};");
const G = globalThis; const B = require(path.join(out, "bandlock.js")); let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("REJECTION NO FLIP 668 TEST: FAIL - " + m); } };
// channel VWAP 80000 .. +1σ 80200 (W 200: near = $30, rejection = $40)
const L = [{ name: "-1σ", price: 79800 }, { name: "session VWAP", price: 80000 }, { name: "+1σ", price: 80200 }, { name: "5m PP", price: 80100 }];
G.__curBook465 = "recon-tog";
// short: green 5m (open 80120), high 80190 ($10 under +1σ), now 80145 = $45 off the high (> $40), still over the open (green)
t(B.rej668("btc", "down", 80145, L, { o: 80120, h: 80190, l: 80115 }), "green 5m, $10 from +1σ, $45 back down: the short was not hers");
t(!B.rej668("btc", "down", 80175, L, { o: 80120, h: 80190, l: 80115 }), "only $15 back down (needs $20, fix937 10%) counted"); t(B.rej668("btc", "down", 80158, L, { o: 80120, h: 80190, l: 80115 }), "$32 back down (10% = $20, fix937) was not hers");
t(!B.rej668("btc", "down", 80125, L, { o: 80120, h: 80160, l: 80115 }), "the high never came within 15% ($30) of a band and counted");
t(B.rej668("btc", "down", 80150, L, { o: 80210, h: 80215, l: 80140 }), "the opening side must not veto a wick inside 10% with the full 15% pullback");
// long mirror: red 5m (open 80040), low 80005 ($5 over VWAP), now 80047 = $42 up, still...
t(B.rej668("btc", "up", 80047, L, { o: 80060, h: 80065, l: 80005 }), "mirror: red 5m, $5 from the VWAP, $42 back up: the long was not hers");
t(!B.rej668("btc", "up", 80020, L, { o: 80060, h: 80065, l: 80005 }), "mirror: only $15 up counted (needs $20, fix937)");
// gold: channel 4100..4120 (W 20: near 3.00, rejection 4.00)
const LG = [{ name: "session VWAP", price: 4100 }, { name: "+1σ", price: 4120 }, { name: "-1σ", price: 4080 }];
t(B.rej668("gold", "down", 4115.5, LG, { o: 4114, h: 4119.8, l: 4113.9 }), "gold: green 5m off +1σ, $4.30 back down was not hers");
t(!B.rej668("gold", "down", 4118.9, LG, { o: 4114, h: 4119.8, l: 4113.9 }), "gold: $0.90 back down (needs $2, fix937) counted"); t(B.rej668("gold", "down", 4116.7, LG, { o: 4114, h: 4119.8, l: 4113.9 }), "fix1036: gold $3.10 back down (15% of her $20 channel) was not hers"); t(!B.rej668("gold", "down", 4117.7, LG, { o: 4114, h: 4119.8, l: 4113.9 }), "fix1036: gold $2.10 back (10%) is not her 15% yet");
// delayed keeps her flips
G.__curBook465 = "recon-dly"; t(!B.rej668("btc", "down", 80145, L, { o: 80120, h: 80190, l: 80115 }), "the delayed book got the waiver"); G.__curBook465 = "";
const BL = fs.readFileSync(path.join(ROOT, "src/lib/desk/bandlock.ts"), "utf8"), RC = fs.readFileSync(path.join(ROOT, "src/lib/desk/recon.ts"), "utf8"), KL = fs.readFileSync(path.join(ROOT, "src/lib/desk/kalshi-live.server.ts"), "utf8");
t((BL.match(/rej668\(asset, side, tick, L\)\)/g) || []).length >= 5, "a door flip check (HER FLIP x2, HER CANDLE, price rising/falling x2) does not read fix668");
t(KL.includes("B.rej668(sym, side, Number(q.c)"), "HER FLIP AT THE SEND does not read fix668");
t(RC.includes("label: `Rejected ${sd668} off ${r668.name}`") && (RC.match(/rejBand668\(asset, "down", spot, L, cur\)\) \/\* fix668 \*\//g) || []).length >= 1, "the read does not cast her 20% rejection"); /* fix1034: the two other sites were exceptions to the read's 5m-open gate, which is gone - nothing left for them to waive */
console.log(ok ? "REJECTION NO FLIP 668 TEST ✓ - 15% from a band then 20% of the channel back off it this candle = her entry with the 5m still the other colour (short + long, BTC + gold); short of 20% waits; a wick qualifies regardless of the open; delayed keeps her flips; door, send and read all read it." : "REJECTION NO FLIP 668 TEST: FAIL"); process.exit(ok ? 0 : 1);
