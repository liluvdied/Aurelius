#!/usr/bin/env node
// fix1056 WHY A POLYMARKET BUY DID NOT GO THROUGH (Love Nov 9 2026 ~10:28 PM PT: "she is still skipping everything") - read-only source proof, no network, no order.
"use strict";
const fs = require("fs"), path = require("path"); const root = process.env.AUR_ROOT || path.join(__dirname, "..");
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("POLY BUY WHY 1056 TEST: FAIL - " + m); } };
const s = fs.readFileSync(path.join(root, "src/lib/desk/poly-live.server.ts"), "utf8"); const a = s.indexOf("export async function buySlug("), b = s.indexOf("\n}\n", a); const body = s.slice(a, b);
t(a > 0 && /poly-buy-why-1056\.jsonl/.test(body), "buySlug does not log why a buy did not go through");
t(!/(\n\s*return null;|\) return null;)/.test(body), "a silent 'return null' is still in buySlug");
t((body.match(/return why1056\(/g) || []).length === 8 && /why1056\("uncertain"/.test(body), "ordinary refusals, the last-minute cutoff and uncertain submissions must all be logged");
t(/const b1056 = await res\.text\(\)/.test(body) && /reply: JSON\.stringify\(data\)\.slice\(0, 800\)/.test(body), "Polymarket's own answer must be kept");
t(/quoted > maxAsk/.test(body) && /Math\.min\(0\.9, Math\.floor\(maxAsk \* 100/.test(body) && /TIME_IN_FORCE_IMMEDIATE_OR_CANCEL/.test(body), "the buy itself must stay exactly as it was (her cap, the price, immediate-or-cancel)");
console.log(ok ? "POLY BUY WHY 1056 TEST ✓ - every Polymarket buy that does not go through logs why (data/poly-buy-why-1056.jsonl) with Polymarket's own answer; the buy itself is unchanged" : "POLY BUY WHY 1056 TEST: FAIL");
process.exit(ok ? 0 : 1);
