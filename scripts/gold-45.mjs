import { createPrivateKey, randomUUID, sign, constants } from "node:crypto";
import { readFileSync } from "node:fs";

const ROOT = "https://external-api.kalshi.com";
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();
const ticker = "KXGOLD15M-26SEP250045-45";

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

const deadline = Date.now() + 4 * 60 * 1000;
while (Date.now() < deadline) {
  const pos = JSON.parse((await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=200")).text);
  const row = (pos.market_positions ?? []).find((item) => item.ticker === ticker);
  const n = Number(row?.position_fp ?? 0);
  const qty = Math.floor(Math.abs(n) * 100) / 100;
  const cost = Number(row?.market_exposure_dollars ?? 0);
  if (!(n > 0) || qty < 0.01) {
    console.log("FLAT");
    process.exit(0);
  }
  const market = await (await fetch(`${ROOT}/trade-api/v2/markets/${ticker}`)).json();
  const yesBid = Number(market.market?.yes_bid_dollars ?? 0);
  const value = qty * yesBid;
  const pct = cost > 0 ? ((value - cost) / cost) * 100 : 0;
  console.log(new Date().toISOString(), "pct", Math.round(pct * 10) / 10, "bid", yesBid, "value", value.toFixed(2));
  if (pct + 0.2 >= 45 && yesBid > 0) {
    const px = Math.round(yesBid * 100) / 100;
    const placed = await kalshi("POST", "/trade-api/v2/portfolio/events/orders", "", {
      ticker,
      client_order_id: randomUUID(),
      side: "ask",
      count: qty.toFixed(2),
      price: px.toFixed(4),
      time_in_force: "immediate_or_cancel",
      self_trade_prevention_type: "taker_at_cross",
      post_only: false,
      reduce_only: true,
      cancel_order_on_pause: true,
      exchange_index: 2,
    });
    console.log("SOLD", placed.status, placed.text.slice(0, 500));
    process.exit(0);
  }
  await new Promise((r) => setTimeout(r, 2000));
}
console.log("NOT_AT_45");
