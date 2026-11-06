// Offline tests: no network, no Kalshi, no TradingView. node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { sessionStartMs } from "../src/clock.js";
import { resample, sessionVwap, pivots, channel, drawLines } from "../src/lines.js";
import { decide } from "../src/decide.js";
import { closeThrough, break5m } from "../src/setups.js";
import { maxAsk, channelWall, intoBand, thirdsShare } from "../src/walls.js";

const TOL = {
  rollingVwap: { minutes: 60 },
  bands: { steps: [0.5, 1, 1.5, 2, 2.5, 3] }, pivots: { timeframeMin: 5, emaLength: 7, rangeBars: 7 },
  bollinger: { timeframeMin: 5, length: 20, mult: 2 }, maxAskCents: 66, breakPush: { btc: 5, gold: 0.1 },
  intoBandWall: { btc: 25, gold: null },
  thirds: { scale: { gold: [[10, 33], [25, 20], [null, 15]], btc: [[500, 33], [null, 20]] }, marginPct: 3, bandPassed: { btc: 2, gold: 0.33 } }, tapReach: { btc: null, gold: null },
  minSecondsLeft: null, maxPriceAgeSec: null, books: { main: { on: true, setups: ["tap", "closeThrough", "break5m"] } },
};

test("session start is 5 PM New York in both EDT and EST", () => {
  // Oct 20 2026 (EDT): 5 PM NY = 21:00 UTC. Nov 10 2026 (EST): 22:00 UTC.
  assert.equal(new Date(sessionStartMs(17, "America/New_York", Date.parse("2026-10-21T03:00:00Z"))).toISOString(), "2026-10-20T21:00:00.000Z");
  assert.equal(new Date(sessionStartMs(17, "America/New_York", Date.parse("2026-11-10T23:30:00Z"))).toISOString(), "2026-11-10T22:00:00.000Z");
  // before 5 PM: yesterday's session
  assert.equal(new Date(sessionStartMs(17, "America/New_York", Date.parse("2026-11-10T15:00:00Z"))).toISOString(), "2026-11-09T22:00:00.000Z");
});

test("resample builds 5m bars on UTC 5-minute marks", () => {
  const t0 = Date.parse("2026-11-06T00:00:00Z");
  const b = [0, 1, 2, 3, 4, 5].map((i) => ({ t: t0 + i * 60000, o: 10 + i, h: 11 + i, l: 9 + i, c: 10.5 + i, v: 1 }));
  const r = resample(b, 5);
  assert.equal(r.length, 2);
  assert.deepEqual([r[0].o, r[0].h, r[0].l, r[0].c, r[0].v], [10, 15, 9, 14.5, 5]);
});

test("session VWAP: flat price gives VWAP = price, sigma 0; no-volume feed falls back to equal weights", () => {
  const t0 = 1e12;
  const flat = Array.from({ length: 10 }, (_, i) => ({ t: t0 + i * 60000, o: 100, h: 100, l: 100, c: 100, v: 0 }));
  const s = sessionVwap(flat, t0, [1]);
  assert.equal(s.vwap, 100); assert.equal(s.sd, 0); assert.equal(s.weighted, false);
});

test("pivots only use closed 5m bars", () => {
  const t0 = Date.parse("2026-11-06T00:00:00Z");
  const bars = Array.from({ length: 60 }, (_, i) => ({ t: t0 + i * 60000, o: 100, h: 101, l: 99, c: 100, v: 1 }));
  const p = pivots(bars, TOL.pivots, t0 + 60 * 60000 - 1); // 11 closed 5m bars, the 12th still open
  assert.ok(Math.abs(p.pink - 100) < 1e-9);
  assert.ok(Math.abs(p.range - 2) < 1e-9);
  assert.equal(p.asOf, t0 + 50 * 60000);
});

test("channel position", () => {
  const ch = channel(105, [{ name: "a", price: 100 }, { name: "b", price: 110 }]);
  assert.equal(ch.pos, 0.5);
});

test("walls: 66c, channel 33%, into-band $25", () => {
  assert.match(maxAsk({ askCents: 67, tol: TOL }), /over the 66c/);
  assert.equal(maxAsk({ askCents: 66, tol: TOL }), null);
  assert.equal(maxAsk({ askCents: 2, tol: TOL }), null, "minAskCents null = off");
  assert.match(maxAsk({ askCents: 2, tol: { ...TOL, minAskCents: 20 } }), /under the 20c minimum/);
  const lines = { sess: { bands: [{ name: "VWAP", price: 100 }, { name: "+0.5σ", price: 200 }] } };
  // BTC $100 channel -> 33% share + 3% margin: long walled from 64% up, short up to 36%
  assert.match(channelWall({ look: { side: "up" }, price: 180, lines, asset: "btc", tol: TOL }), /top 33%/);
  assert.match(channelWall({ look: { side: "up" }, price: 165, lines, asset: "btc", tol: TOL }), /top 33%/, "3% margin");
  assert.equal(channelWall({ look: { side: "up" }, price: 163, lines, asset: "btc", tol: TOL }), null);
  assert.match(channelWall({ look: { side: "down" }, price: 135, lines, asset: "btc", tol: TOL }), /bottom 33%/);
  assert.equal(channelWall({ look: { side: "down" }, price: 137, lines, asset: "btc", tol: TOL }), null);
  assert.match(intoBand({ look: { side: "up", linePrice: 100 }, price: 180, lines, asset: "btc", tol: TOL }), /\+0.5σ is 20.00 ahead/);
  assert.equal(intoBand({ look: { side: "up", linePrice: 100 }, price: 170, lines, asset: "btc", tol: TOL }), null);
  assert.equal(intoBand({ look: { side: "up", linePrice: 100 }, price: 199, lines, asset: "gold", tol: TOL }), null, "null tolerance = wall off");
});

test("thirds sliding scale: gold 33/20/15 by $10/$25, BTC 33/20 by $500", () => {
  assert.equal(thirdsShare("gold", 9.99, TOL), 33); assert.equal(thirdsShare("gold", 10, TOL), 33);
  assert.equal(thirdsShare("gold", 18, TOL), 20); assert.equal(thirdsShare("gold", 40, TOL), 15);
  assert.equal(thirdsShare("btc", 500, TOL), 33); assert.equal(thirdsShare("btc", 963, TOL), 20);
});

test("a band counts as passed only once price is through it by the break distance (gold 33c)", () => {
  const lines = { sess: { bands: [{ name: "-0.5σ", price: 4090 }, { name: "VWAP", price: 4095 }, { name: "+0.5σ", price: 4100 }] } };
  assert.match(channelWall({ look: { side: "up" }, price: 4095.2, lines, asset: "gold", tol: TOL }), /-0.5σ..VWAP/, "20c over VWAP: not passed, long walled");
  assert.equal(channelWall({ look: { side: "up" }, price: 4095.4, lines, asset: "gold", tol: TOL }), null, "40c over VWAP: passed, long clear");
  assert.match(channelWall({ look: { side: "down" }, price: 4094.8, lines, asset: "gold", tol: TOL }), /VWAP..\+0.5σ/, "20c under VWAP: short walled");
});

test("closeThrough reads the last CLOSED 1m candle only", () => {
  const t0 = Date.parse("2026-11-06T00:00:00Z");
  const lines = { sess: { bands: [{ name: "VWAP", price: 100 }] } };
  const bars = [{ t: t0, o: 99, h: 101, l: 98, c: 100.5, v: 1 }, { t: t0 + 60000, o: 100.5, h: 101, l: 99, c: 99.5, v: 1 }];
  const look = closeThrough({ bars, lines, now: t0 + 61000 }); // second bar still forming
  assert.equal(look.side, "up");
});

test("break5m needs the full push past the 5m line", () => {
  const t0 = Date.parse("2026-11-06T00:00:00Z");
  const bars = Array.from({ length: 10 }, (_, i) => ({ t: t0 + i * 60000, o: 100, h: 100, l: 100, c: 100, v: 1 }));
  const lines = { piv: { pink: 101, red: 110, green: 90 } };
  const now = t0 + 10 * 60000 + 1000;
  assert.equal(break5m({ bars, lines, now, asset: "btc", tol: TOL, price: 105.9 }), null);
  assert.equal(break5m({ bars, lines, now, asset: "btc", tol: TOL, price: 106 }).side, "up");
});

test("decide: a setup that hits a wall is reported with the wall's reason", () => {
  const t0 = Date.parse("2026-11-06T00:00:00Z");
  const bars = Array.from({ length: 10 }, (_, i) => ({ t: t0 + i * 60000, o: 100, h: 100, l: 100, c: 100, v: 1 }));
  const lines = { sess: { bands: [{ name: "VWAP", price: 50, step: 0 }, { name: "+0.5σ", price: 200, step: 0.5 }] }, piv: { pink: 101, red: 300, green: 10 } };
  const base = { asset: "btc", bars, lines, price: 106, priceAgeSec: 0.5, now: t0 + 10 * 60000 + 1000, secondsLeft: 600, tol: TOL, book: "main" };
  const d1 = decide({ ...base, market: { yesAsk: 70, noAsk: 32 } });
  assert.equal(d1.take, null);
  assert.match(d1.looks[0].wall, /maxAsk: ask 70c/);
  const d2 = decide({ ...base, market: { yesAsk: 55, noAsk: 47 } });
  assert.equal(d2.take.setup, "break5m"); assert.equal(d2.take.askCents, 55);
});

test("drawLines puts session bands and 5m pivots in one list", () => {
  const t0 = Date.parse("2026-11-06T00:00:00Z");
  const bars = Array.from({ length: 120 }, (_, i) => ({ t: t0 + i * 60000, o: 100 + Math.sin(i), h: 101 + Math.sin(i), l: 99 + Math.sin(i), c: 100 + Math.sin(i + 0.5), v: 1 + (i % 3) }));
  const L = drawLines(bars, TOL, t0, t0 + 120 * 60000);
  assert.equal(L.levels.filter((l) => l.pivot).length, 3);
  assert.equal(L.sess.bands.length, 13);
  assert.ok(L.bb.upper > L.bb.lower);
  assert.equal(L.roll.bars, 60, "rolling VWAP uses only the last 60 minutes");
});
