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
  const text = await res.text();
  return { status: res.status, text };
}

const pos = await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=200");
const data = JSON.parse(pos.text);
const keys = Object.keys(data);
console.log("keys", keys);
const blobs = JSON.stringify(data);
console.log("has GOLD", blobs.includes("GOLD"), "has 15M", blobs.includes("15M"));
for (const row of data.market_positions ?? []) {
  const ticker = row.ticker ?? "";
  if (ticker.includes("GOLD") || ticker.includes("15M") || ticker.includes("BTC15")) {
    console.log(JSON.stringify(row));
  }
}
const orders = await kalshi("GET", "/trade-api/v2/portfolio/orders", "?limit=50&status=resting");
console.log("resting status", orders.status, orders.text.includes("15M"), orders.text.slice(0, 200));
