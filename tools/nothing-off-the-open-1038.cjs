#!/usr/bin/env node
// fix1038: no push and no colour keyed to the candle open (every book, delayed included) - her flip helpers read her high / low colour; the read's rising / falling candle too; the XRP lane's push is from the band.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("NOTHING OFF THE OPEN 1038 TEST: FAIL - " + m); } };
const S = fs.readFileSync(path.join(root, "src/lib/desk/bandlock.ts"), "utf8"), R = fs.readFileSync(path.join(root, "src/lib/desk/recon.ts"), "utf8"), X = fs.readFileSync(path.join(root, "src/lib/desk/xrp5m961.ts"), "utf8");
for (const fn of ["anyFlipNow", "anyFlip2Now", "anyFlip406Now", "anyFlipMinNow", "turnFlip530", "realFlipNow"]) { const i = S.indexOf("export function " + fn + "("); t(i > 0 && /return herColour949\(asset, side, tick\); \/\* fix1038/.test(S.slice(i, i + 400)), fn + " still reads the candle open"); }
t(!/spot >= cur\.o \+ mvO|spot <= cur\.o - mvO/.test(R), "the read's rising / falling candle still needs $10 past its open");
t(/const from1038 = x\.wick \? turn : s > 0 \? Math\.max\(turn, x\.line\) : Math\.min\(turn, x\.line\)/.test(X), "the XRP lane's push is not measured from the band");
// behaviour: a candle that opened $100 above, wicked down to the band and is now $8 up off its low is her colour for a long - she does not wait to cross the open
const ts = require(path.join(root, "node_modules/typescript")), out = fs.mkdtempSync(path.join(os.tmpdir(), "o1038-"));
fs.writeFileSync(path.join(out, "bandlock.js"), ts.transpileModule(S, { compilerOptions: { module: 1, target: 99 } }).outputText);
fs.writeFileSync(path.join(out, "quotes.js"), "exports.quoteTick=()=>null;exports.feedHealth=()=>({ok:true});exports.quoteTrail=()=>[];"); fs.writeFileSync(path.join(out, "recon.js"), "exports.RECON={};");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "o1038d-")); fs.mkdirSync(path.join(dir, "data")); process.chdir(dir); fs.writeFileSync("data/live-switch.json", "{}");
const B = require(path.join(out, "bandlock.js")), G = globalThis, f5 = Math.floor(Date.now() / 300000) * 300;
const bars = []; for (let x = f5; x <= Math.floor(Date.now() / 60000) * 60; x += 60) bars.push({ t: x, o: x === f5 ? 80100 : 80050, h: x === f5 ? 80100 : 80050, l: 80000, c: 80006 }); /* her picture: opened $100 above, wicked to 80,000, $8 up off the low and still under every open */ G.__pivBars = { btc: { bars }, gold: { bars: [] } };
G.__curBook465 = "recon-tog";
t(B.turnFlip530("btc", "up", 80008) && B.realFlipNow("btc", "up", 80008) && B.anyFlip406Now("btc", "up", 80008, 5), "a long $8 up off the low with the open $92 above is not her flip (it still waits to cross the open)");
t(!B.turnFlip530("btc", "up", 80003), "$3 up off the low (under her $5 cushion) counted");
G.__curBook465 = "recon-dly"; t(B.turnFlip530("btc", "up", 80008), "the delayed book still reads its flips off the candle open (Love 5:28 PM: delayed included)"); G.__curBook465 = "recon-tog";
// her 5:12 PM picture: a candle BORN red pushing off a band (opened at the band 80,000, never green, high 80,002, now 79,994) is her short trigger - a flip OR a born candle
G.__pivBars = { btc: { bars: bars.map((b) => ({ ...b, o: 80000, h: 80002, l: 79992, c: 79994 })) } };
t(B.turnFlip530("btc", "down", 79994) && B.realFlipNow("btc", "down", 79994), "her 5:12 PM case: a candle born red pushing off a band is not taken as her trigger (born counts like a flip)");
t(!B.turnFlip530("btc", "up", 79994), "a born-red candle read as a long trigger");
console.log(ok ? "NOTHING OFF THE OPEN 1038 TEST ✓ - her flips / colour read the candle's high / low + her push (every book, delayed included), the read's rising / falling candle too, and the XRP lane's push is from the band - nothing waits to cross the open" : "NOTHING OFF THE OPEN 1038 TEST: FAIL");
process.exit(ok ? 0 : 1);
