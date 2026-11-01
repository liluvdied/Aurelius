import { createPrivateKey, sign, constants } from "node:crypto";
import { readFileSync } from "node:fs";

const ROOT = "https://external-api.kalshi.com";
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();

async function kalshi(method, path, query = "") {
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
      "KALSHI-ACCESS-KEY": keyId,
      "KALSHI-ACCESS-TIMESTAMP": timestamp,
      "KALSHI-ACCESS-SIGNATURE": signature,
    },
  });
  return res.text();
}

const fills = JSON.parse(await kalshi("GET", "/trade-api/v2/portfolio/fills", "?limit=8"));
for (const row of fills.fills ?? []) {
  console.log(row.created_time, row.ticker, row.action, row.side, "qty", row.count_fp, "yes", row.yes_price_dollars);
}
const pos = JSON.parse(await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=200"));
const live = (pos.market_positions ?? []).filter((row) => String(row.ticker).includes("15M") && Math.abs(Number(row.position_fp ?? 0)) >= 0.01);
console.log("15m", live.length ? JSON.stringify(live) : "flat");
