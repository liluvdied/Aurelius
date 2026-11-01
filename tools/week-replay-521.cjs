#!/usr/bin/env node
// fix521 week replay (Love Oct 30 2026 12:32 PM PT: "test each of the rules against our trades over the past week, and confirm under the
// current configuration they would not be able to get through"). Every live fill of the last 7 days is re-judged on its own recorded board
// under the two new rules. The replay reads the recorded 5m frame; the live walls also read 2-4m, so live can only block MORE than this.
// The reset state is unknown historically, so it is assumed NOT spent (strictest). Verdicts -> data/week-replay-521.json; the umpire's
// context: the Oct 30 18:51Z and 19:03Z BTC longs are the violation class and MUST come back BLOCKED, or this exits 1.
const fs = require("fs"), path = require("path");
const root = process.cwd(); // run from the repo root (the click and the umpire both do)
const out = { at: new Date().toISOString(), days: 7, fills: [], blocked: 0, passed: 0 };
const cutoff = Date.now() - 7 * 864e5;
// per-minute ticks from band-log.jsonl rebuild the 2/3/4/5-minute frame opens at each fill (the snap only carries the 5m bars)
const MIN = { btc: {}, gold: {} };
for (const line of fs.readFileSync(path.join(root, "data/band-log.jsonl"), "utf8").split("\n")) {
  if (!line.trim()) continue;
  let b; try { b = JSON.parse(line); } catch { continue; }
  if (b.asset && b.tick && Date.parse(b.at) >= cutoff - 30 * 60000) MIN[b.asset] && (MIN[b.asset][Math.floor(Date.parse(b.at) / 60000)] = Number(b.tick));
}
const frameOpen = (asset, n, ms) => { const f0 = Math.floor(ms / (n * 60000)) * n * 60000; for (let k = 0; k < 3; k += 1) { const v = (MIN[asset] || {})[Math.floor(f0 / 60000) - k]; if (v > 0) return v; } return 0; };
const anyRed = (asset, tick, ms) => [2, 3, 4, 5].some((n) => { const o = frameOpen(asset, n, ms); return o > 0 && tick < o; });
const anyGreen = (asset, tick, ms) => [2, 3, 4, 5].some((n) => { const o = frameOpen(asset, n, ms); return o > 0 && tick > o; });
const MUST = ["2026-10-30T18:51:08"]; // her B: the 19:03 long carried a real $5 flip on its 5m candle, so it stays legal under her exception - reported, not forced
let mustBlocked = 0;
for (const line of fs.readFileSync(path.join(root, "data/fill-audit.jsonl"), "utf8").split("\n")) {
  if (!line.trim()) continue;
  let j; try { j = JSON.parse(line); } catch { continue; }
  if (j.paid == null || !j.L || Date.parse(j.at) < cutoff) continue;
  const tick = Number(j.tick) || 0, side = j.side;
  const pk = (j.L.find((x) => x.name === "5m PP") || {}).price, s1 = (j.L.find((x) => x.name === "5m S1") || {}).price, r1 = (j.L.find((x) => x.name === "5m R1") || {}).price;
  const bars = j.bars || [], lastBar = bars[bars.length - 1];
  const o5 = lastBar ? Number(lastBar.o) : 0;
  const ms = Date.parse(j.at);
  const red = anyRed(j.asset, tick, ms) || (o5 > 0 && tick < o5), green = anyGreen(j.asset, tick, ms) || (o5 > 0 && tick > o5); // a running 2-5m frame red/green, as the live wall reads it
  const why = [];
  const min521 = j.asset === "gold" ? 0.1 : 5;
  const flipUp = [2, 3, 4, 5].some((n) => { const o = frameOpen(j.asset, n, ms); return o > 0 && tick >= o + min521; }) || (o5 > 0 && tick >= o5 + min521);
  const flipDn = [2, 3, 4, 5].some((n) => { const o = frameOpen(j.asset, n, ms); return o > 0 && tick <= o - min521; }) || (o5 > 0 && tick <= o5 - min521);
  if (side === "up" && pk > 0 && tick < pk && red) {
    const sess = j.L.filter((x) => /\u03c3$|^session VWAP$|^fresh VWAP$/.test(String(x.name)) && x.price > 0);
    const au = sess.filter((x) => x.price > tick).sort((x, y) => x.price - y.price)[0], bu = sess.filter((x) => x.price < tick).sort((x, y) => y.price - x.price)[0];
    const wide = au && bu && au.price - bu.price > (j.asset === "btc" ? 700 : 30);
    const clear = wide && pk - tick > (j.asset === "btc" ? 200 : 4) && flipUp; // her 1:03 PM clearance
    const botQ = ((s1 > 0 && s1 < pk ? tick <= s1 + 0.25 * (pk - s1) : false) && flipUp) || clear;
    if (!botQ) why.push("UNDER THE PINK = NO LONGS (fix521)");
  }
  if (side === "down" && pk > 0 && tick > pk && green) {
    const topQ = (r1 > 0 && r1 > pk ? tick >= r1 - 0.25 * (r1 - pk) : false) && flipDn; // her B
    if (!topQ) why.push("OVER THE PINK = NO SHORTS (fix521)");
  }
  if (side === "up" && !flipUp) why.push("HER FLIP AT THE SEND (fix521): no 2-5m turn by her minimum");
  if (side === "down" && !flipDn) why.push("HER FLIP AT THE SEND (fix521): no 2-5m turn by her minimum");
  const rec = { at: j.at, ticker: j.ticker, book: j.book, side, paid: j.paid, verdict: why.length ? "BLOCKED by fix521" : "passes", why };
  out.fills.push(rec);
  if (why.length) out.blocked += 1; else out.passed += 1;
  if (MUST.some((m) => String(j.at).startsWith(m)) && why.length) mustBlocked += 1;
}
fs.writeFileSync(path.join(root, "data/week-replay-521.json"), JSON.stringify(out, null, 1));
const ok = mustBlocked >= MUST.length;
console.log(`WEEK REPLAY 521: ${out.fills.length} fills re-judged - ${out.blocked} would now be BLOCKED, ${out.passed} pass. The 18:51 violation long: ${ok ? "BLOCKED ✓" : "NOT BLOCKED ✗"} (the 19:03 long carried a real $5 flip, legal under her B)`);
process.exit(ok ? 0 : 1);
