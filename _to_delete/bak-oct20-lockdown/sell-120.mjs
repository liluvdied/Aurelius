import { createPrivateKey, randomUUID, sign, constants } from "node:crypto";
import { readFileSync } from "node:fs";
// LIVE GUARD: this script can open a position, so it obeys data/live-switch.json.
try {
  if (JSON.parse(readFileSync("/workspace/data/live-switch.json", "utf8")).live !== true) {
    console.log("Live switch is OFF. Nothing sent.");
    process.exit(0);
  }
} catch {
  console.log("Live switch file missing. Nothing sent.");
  process.exit(0);
}

const ROOT = "https://external-api.kalshi.com";
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();
const ticker = "KXGOLD15M-26SEP250030-30";

async function kalshi(method, path, query = "", body) {
  const timestamp = Date.now().toString();
  const signature = sign("sha256", Buffer.from(`${timestamp}${method}${path}`), {
    key,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString("base64");
  const res = await fetch(ROOT + path + query, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "KALSHI-ACCESS-KEY": keyId,
      "KALSHI-ACCESS-TIMESTAMP": timestamp,
      "KALSHI-ACCESS-SIGNATURE": signature,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, text: await res.text() };
}

const orders = JSON.parse((await kalshi("GET", "/trade-api/v2/portfolio/orders", "?status=resting&limit=50")).text);
for (const order of orders.orders ?? []) {
  if (order.ticker !== ticker || !order.order_id) continue;
  const killed = await kalshi("DELETE", `/trade-api/v2/portfolio/events/orders/${order.order_id}`, `?market_ticker=${encodeURIComponent(ticker)}&exchange_index=-1`);
  console.log("cancel", order.order_id, killed.status, killed.text.slice(0, 180));
}

const pos = JSON.parse((await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=200")).text);
const row = (pos.market_positions ?? []).find((item) => item.ticker === ticker);
const n = Number(row?.position_fp ?? 0);
const qty = Math.floor(Math.abs(n) * 100) / 100;
if (!(n < 0) || qty < 0.01) {
  console.log("NO_SHORT", n);
  process.exit(0);
}
const yesPrice = 0.3;
const payout = Math.round(qty * (1 - yesPrice) * 100) / 100;
console.log("qty", qty, "yesLimit", yesPrice, "payout", payout);
const placed = await kalshi("POST", "/trade-api/v2/portfolio/events/orders", "", {
  ticker,
  client_order_id: randomUUID(),
  side: "bid",
  count: qty.toFixed(2),
  price: yesPrice.toFixed(4),
  time_in_force: "good_till_canceled",
  self_trade_prevention_type: "taker_at_cross",
  post_only: true,
  reduce_only: false,
  cancel_order_on_pause: true,
  exchange_index: 2,
});
console.log(placed.status, placed.text.slice(0, 500));
