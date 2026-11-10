#!/usr/bin/env node
// fix1055 BTC + ETH 5M LIVE ON POLYMARKET (Love Nov 9 2026 9:46 PM PT: "Put all of them at the configuration that brings them to those numbers, and let's get them live, please") - temp folder, no network, no real order (the Polymarket buy is a test double).
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"); const root = process.env.AUR_ROOT || path.join(__dirname, ".."); const DK = path.join(root, "src/lib/desk");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("COIN 5M LIVE 1055 TEST: FAIL - " + m); } };
const ts = require(path.join(root, "node_modules/typescript")); const X = fs.readFileSync(path.join(DK, "xrp5m961.ts"), "utf8"), E = fs.readFileSync(path.join(DK, "engine.ts"), "utf8");
t(/import\("\.\/btc5m1055"\)\.then\(\(m\) => m\.btcTick1055\(\)\)/.test(E) && /import\("\.\/eth5m1055"\)\.then\(\(m\) => m\.ethTick1055\(\)\)/.test(E), "the engine does not run the BTC / ETH 5m live lanes");
(async () => { for (const [c, C, push] of [["btc", "BTC", 5], ["eth", "ETH", 0.25]]) {
  const S = fs.readFileSync(path.join(DK, c + "5m1055.ts"), "utf8");
  t(S.includes(`const PUSH1055 = { band: ${push}, pink: ${push}, wick: ${push * 2} }`) && /PUSH1055, win5Open1051\(bs, readAt\)/.test(S) && /, PUSH1055\)/.test(S), C + ": the read must use the 5m books' push (her 5m table configuration), entry and trigger add-on");
  t(/from "\.\/xrp5m961"; \/\/ fix1055 her one brain/.test(S) && !/export function xrpRead961/.test(S), C + ": must use her ONE brain from xrp5m961.ts, not a copy");
  t(S.includes(`products/${C}-USD/candles`) && S.includes("`" + c + "-updown-5m-") && !/xrp-updown|XRP-USD/.test(S.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n")), C + ": its own coin's feed and Polymarket windows");
  t(/Math\.min\(0\.66,/.test(S) && /Math\.min\(5,/.test(S), C + ": her 66c floor and the $5 most a ticket must stay");
  // behaviour: a test double for Polymarket; her read stands in as a long; window open 100, price 100.5
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "c1055-"));
  fs.writeFileSync(path.join(out, "x.js"), ts.transpileModule(S, { compilerOptions: { module: 1, target: 99 } }).outputText);
  fs.writeFileSync(path.join(out, "ethbook.js"), "exports.ethBands682=()=>[];");
  fs.writeFileSync(path.join(out, "xrp5m961.js"), "exports.xrpRead961=(bs,L,spot,now,p,open)=>{globalThis.__p1055=p;globalThis.__open1055=open;const r=globalThis.__r1055;if(!r)return {why:'no setup'};return open===undefined || (open>0 && (r.side==='up'?spot>open:spot<open)) ? r : {why:'wrong side'};};exports.win5Open1051=(bs,now)=>{const f=Math.floor(now/300)*300;const b=bs.find(x=>x.t>=f&&x.t<f+300);return b?b.o:NaN};exports.openSide1051=(s,spot,o)=>o>0&&(s==='up'?spot>o:spot<o);exports.rung1029=()=>({go:false,passed:false,cap:0});exports.trigPx1043=()=>({go:false,cap:0,why:''});exports.boxes1029=()=>[{k:'add1',on:false,dollars:0,mult:2.8},{k:'add2',on:false,dollars:0,mult:3},{k:'add3',on:false,dollars:0,mult:4}];");
  fs.writeFileSync(path.join(out, "poly-live.server.js"), "module.exports={};");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "c1055d-")); fs.mkdirSync(path.join(dir, "data")); const here = process.cwd(); process.chdir(dir);
  const G = globalThis; const M = require(path.join(out, "x.js"));
  const w = Math.floor(Date.now() / 300000) * 300 - 300, now = w + 120; const B = [{ t: w - 60, o: 99, h: 99, l: 99, c: 99, v: 1 }, { t: w, o: 100, h: 100.6, l: 100, c: 100.5, v: 1 }, { t: w + 60, o: 100.5, h: 100.6, l: 100.4, c: 100.5, v: 1 }];
  G["__" + c + "1055Bars"] = { at: now * 1000 + 1e9, m: new Map(B.map((b) => [b.t, b])) }; const realNow = Date.now; Date.now = () => now * 1000;
  let ask = 0.72, buys = []; const pm = { bookTop: async () => ({ ask, bid: Math.round((1 - ask - 0.01) * 100) / 100 }), buySlug: async (side, slug, d, max, _target, _claim, onRefused, deadline) => { buys.push({ side, slug, d, max, deadline }); return { filled: d / max, price: ask }; } };
  const tick = async (sec) => { Date.now = () => sec * 1000; G["__" + c + "1055At"] = 0; await M[c + "Tick1055"](sec * 1000, pm); };
  G.__r1055 = { side: "up", label: "Rejected up off -1σ" };
  // over her floor: no buy, keeps watching
  {
    await tick(now); t(buys.length === 0, C + ": an ask of 72c (over her 66c) must not buy");
    t(G.__p1055 && G.__p1055.band === push && G.__open1055 === 100, C + ": her read did not get the coin's push");
    ask = 0.45; await tick(now + 6); t(buys.length === 1 && buys[0].d === 1 && buys[0].max <= 0.66 && buys[0].deadline === (w + 240) * 1000 && buys[0].side === "up" && buys[0].slug.startsWith(c + "-updown-5m-"), C + ": a 45c ask must buy $1 under her 66c on its own window: " + JSON.stringify(buys));
    await tick(now + 12); t(buys.length === 1, C + ": never a second buy in a window that filled");
    // her 5m-open rule: next window opens at 101, price 100.8 -> a long waits
    const w2 = w + 300; G["__" + c + "1055Bars"].m.set(w2, { t: w2, o: 101, h: 101, l: 100.7, c: 100.8, v: 1 }); await tick(w2 + 90); t(buys.length === 1, C + ": a long under this 5m window's open must wait (fix1051)");
    fs.writeFileSync(path.join(dir, "data", c + "5m-1055-cfg.json"), JSON.stringify({ on: false })); G["__" + c + "1055Bars"].m.set(w2 + 60, { t: w2 + 60, o: 101, h: 101.4, l: 101, c: 101.3, v: 1 }); await tick(w2 + 130); t(buys.length === 1, C + ": on:false in its cfg must turn it off");
    Date.now = realNow; process.chdir(here);
  }
}
console.log(ok ? "COIN 5M LIVE 1055 TEST ✓ - BTC + ETH 5m live on Polymarket: her one brain with the 5m books' push, her 5m-open rule, $1 a ticket under her 66c, one buy a window, on:false turns it off, the same wire guards" : "COIN 5M LIVE 1055 TEST: FAIL");
process.exit(ok ? 0 : 1); })();
