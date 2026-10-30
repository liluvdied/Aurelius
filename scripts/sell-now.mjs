import { createPrivateKey, randomUUID, sign, constants } from "node:crypto";
import { readFileSync } from "node:fs";

const ROOT = "https://external-api.kalshi.com";
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();

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

const pos = JSON.parse((await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=200")).text);
const open = (pos.market_positions ?? []).filter((row) => Math.abs(Number(row.position_fp ?? 0)) >= 0.01);
console.log("count", open.length);
for (const row of open) {
  const n = Number(row.position_fp);
  if (!String(row.ticker).match(/GOLD|BTC/)) continue;
  console.log(row.ticker, n, row.market_exposure_dollars);
}
for (const row of open) {
  if (!String(row.ticker).includes("15M")) continue;
  const n = Number(row.position_fp);
  const qty = Math.floor(Math.abs(n) * 100) / 100;
  const cost = Number(row.market_exposure_dollars ?? 0);
  const market = await (await fetch(`${ROOT}/trade-api/v2/markets/${row.ticker}`)).json();
  const m = market.market ?? {};
  const yesBid = Number(m.yes_bid_dollars ?? 0);
  const noBid = Number(m.no_bid_dollars ?? 0);
  const bid = n > 0 ? yesBid : noBid;
  const value = qty * bid;
  const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
  console.log(JSON.stringify({ ticker: row.ticker, pos: n, cost, bid, value: Math.round(value * 100) / 100, pct: Math.round(pct * 10) / 10, status: m.status }));
  if (!(bid > 0) || !(value > cost)) {
    console.log("RED_SKIP");
    continue;
  }
  const price = n > 0 ? Math.max(0.01, Math.round((yesBid - 0.01) * 100) / 100) : Math.min(0.99, Math.round((1 - noBid + 0.02) * 100) / 100);
  const placed = await kalshi("POST", "/trade-api/v2/portfolio/events/orders", "", {
    ticker: row.ticker,
    client_order_id: randomUUID(),
    side: n > 0 ? "ask" : "bid",
    count: qty.toFixed(2),
    price: price.toFixed(4),
    time_in_force: "immediate_or_cancel",
    self_trade_prevention_type: "taker_at_cross",
    post_only: false,
    reduce_only: true,
    cancel_order_on_pause: true,
    exchange_index: 2,
  });
  console.log("SOLD", placed.status, placed.text.slice(0, 500));
}
