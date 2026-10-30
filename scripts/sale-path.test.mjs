import test from "node:test";
import assert from "node:assert/strict";
import { cleanPin, crossBids, pinFromSlider, quoteSale } from "../src/lib/desk/paper.ts";

test("a slider set to 65 stays 65 and does not jump to the contract count", () => {
  const pin = pinFromSlider(27, 65, 59);
  assert.ok(pin);
  assert.equal(pin.pct, 65);
  assert.ok(Math.abs(pin.ask - 44.55) < 0.02);
});

test("dragging to the end cannot store a 143 percent pin past the max payout", () => {
  const pin = pinFromSlider(4.998, 100, 9.8);
  assert.ok(pin);
  assert.ok(pin.pct <= 97);
  assert.ok(pin.ask <= 9.8);
});

test("an old impossible pin is ignored", () => {
  assert.equal(cleanPin({ ask: 82.25, pct: 4394 }, 1.83, 10), null);
});

test("71 percent with a 65 pin holds until it gives the gate back", () => {
  const cost = 2.49;
  const contracts = 5.58;
  const bid = 0.765;
  const hit = quoteSale(cost, bid, contracts, 28, 0, { ask: 4.11, pct: 65 });
  assert.equal(hit.action, "hold");
  const entry = cost / contracts;
  const faded = quoteSale(cost, Math.round(entry * 1.7 * 1000) / 1000, contracts, 28, hit.peak, { ask: 4.11, pct: 65 });
  assert.equal(faded.action, "sell");
  assert.equal(faded.lock, 70);
});

test("a 50 pin does not sell at 50, it sells at the 45 gate", () => {
  const cost = 10;
  const contracts = 20;
  const up = quoteSale(cost, 0.75, contracts, 28, 0, { ask: 15, pct: 50 });
  assert.equal(up.action, "hold");
  const back = quoteSale(cost, 0.725, contracts, 28, up.peak, { ask: 15, pct: 50 });
  assert.equal(back.action, "sell");
  assert.equal(back.lock, 45);
});

test("33 percent gives back to the 30 gate", () => {
  const cost = 10;
  const contracts = 20;
  const up = quoteSale(cost, 0.665, contracts, 28, 0, null);
  assert.equal(up.action, "hold");
  const back = quoteSale(cost, 0.65, contracts, 28, up.peak, null);
  assert.equal(back.action, "sell");
  assert.equal(back.lock, 30);
});

test("under the floor it holds", () => {
  const row = quoteSale(5, 0.55, 9.8, 45, 0, null);
  assert.equal(row.action, "hold");
});

test("a sell walks through the bid instead of one canceled price", () => {
  const steps = crossBids(0.66);
  assert.equal(steps[0], 0.66);
  assert.ok(steps.includes(0.59));
  assert.ok(!steps.includes(0.01));
});
