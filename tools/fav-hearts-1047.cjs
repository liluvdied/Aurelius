#!/usr/bin/env node
// fix1047 HER FAVORITES test (read-only on her desk; temp folder, no network, no order).
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("FAVORITES 1047 TEST: FAIL - " + m); } };
const A = fs.readFileSync(path.join(root, "src/components/desk/app.tsx"), "utf8"), F = fs.readFileSync(path.join(root, "src/lib/desk/fav1047.ts"), "utf8");
// 1. the hollow heart sits next to RUN on every card (cards with RUN and cards without), it fills in when hearted
t((A.match(/\{Heart1047\(book\)\}/g) || []).length === 2, "the heart is not on every card next to RUN");
t(/on1047 \? "♥" : "♡"/.test(A) && /e\.stopPropagation\(\);\s*(?:void )?flipFav1047\(book\);/.test(A), "the heart is not hollow / filled, or tapping it also opens the card");
// 2. the FAVORITES tab: only her hearted books, the same cards, tap pulls up their trades the same way (Col + Inline)
t(/label="♡ FAVORITES"/.test(A) && /bookTab === "fav" \? <NightCard scale=\{1\} size=\{[^}]+\} favOnly \/> : null/.test(A), "the FAVORITES tab / its render is missing");
t(/if \(favOnly\) \{/.test(A) && /favRows1047\.map\(\(b\) => \[Col\(\{ book: b\.book, title: b\.title, note: b\.note, s: b\.s \}\), Inline\(\{ book: b\.book \}\)\]\)/.test(A), "the FAVORITES tab does not show the same cards that pull up their trades");
// 3. display only - never an order route or her switches
t(!/kalshi-live|poly-live|live-switch|placeOrder|buySlug|addOnBuy/.test(F), "favorites touches an order route or her switch");
// 4. behaviour: heart, unheart, survives a restart (file), junk file -> empty
const ts = require(path.join(root, "node_modules/typescript")), out = fs.mkdtempSync(path.join(os.tmpdir(), "fav1047-"));
const src = F.replace('import { createServerFn } from "@tanstack/react-start";', 'const createServerFn = (_o: any) => ({ handler: (f: any) => f, validator: (_v: any) => ({ handler: (f: any) => f }) });');
fs.writeFileSync(path.join(out, "fav1047.js"), ts.transpileModule(src, { compilerOptions: { module: 1, target: 99 } }).outputText);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fav1047d-")); fs.mkdirSync(path.join(dir, "data")); process.chdir(dir);
const M = require(path.join(out, "fav1047.js"));
(async () => {
  t((await M.getFav1047()).length === 0, "favorites should start empty");
  await M.setFav1047({ data: { book: "recon-tog", on: true } }); await M.setFav1047({ data: { book: "eth2872", on: true } }); await M.setFav1047({ data: { book: "recon-tog", on: true } });
  t(JSON.stringify(await M.getFav1047()) === '["eth2872","recon-tog"]', "heart twice should keep one: " + JSON.stringify(await M.getFav1047()));
  await M.setFav1047({ data: { book: "eth2872", on: false } });
  t(JSON.stringify(JSON.parse(fs.readFileSync("data/fav-books.json", "utf8")).books) === '["recon-tog"]', "unheart did not save to the file");
  await Promise.all(["first", "second"].map((book) => M.setFav1047({ data: { book, on: true } })));
  t(["first", "second"].every((book) => JSON.parse(fs.readFileSync("data/fav-books.json", "utf8")).books.includes(book)), "simultaneous favorites lost a change");
  fs.writeFileSync("data/fav-books.json", "junk"); t((await M.getFav1047()).length === 0, "a broken file must read as no favorites, not crash");
  console.log(ok ? "FAVORITES 1047 TEST ✓ - a hollow heart next to RUN on every card (fills in when hearted), a ♡ FAVORITES tab with only her hearted books (same cards, tap pulls up their trades), saved in data/fav-books.json; never touches an order" : "FAVORITES 1047 TEST: FAIL");
  process.exit(ok ? 0 : 1);
})();
