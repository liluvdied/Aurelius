import { createPrivateKey, sign, constants } from "node:crypto";
import { readFileSync } from "node:fs";

const ROOT = "https://external-api.kalshi.com";
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();
const ticker = "KXBTC15M-26SEP250045-45";

async function kalshi(method, path, query = "") {
  const timestamp = Date.now().toString();
  const signature = sign("sha256", Buffer.from(`${timestamp}${method}${path}`), {
    key,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString("base64");
  const res = await fetch(ROOT + path + query, {
    method,
    headers: { Accept: "application/json", "KALSHI-ACCESS-KEY": keyId, "KALSHI-ACCESS-TIMESTAMP": timestamp, "KALSHI-ACCESS-SIGNATURE": signature },
  });
  return res.text();
}

const pos = JSON.parse(await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=200"));
for (const row of pos.market_positions ?? []) {
  if (!String(row.ticker).includes("15M")) continue;
  if (Math.abs(Number(row.position_fp ?? 0)) < 0.01) continue;
  console.log("open", row.ticker, row.position_fp, row.market_exposure_dollars);
}
const market = await (await fetch(`${ROOT}/trade-api/v2/markets/${ticker}`)).json();
const m = market.market ?? {};
console.log("btc", m.status, "yes", m.yes_bid_dollars, m.yes_ask_dollars, "no", m.no_bid_dollars, m.no_ask_dollars, "strike", m.floor_strike, "close", m.close_time);
