import { createPrivateKey, sign, constants } from "node:crypto";
import { readFileSync } from "node:fs";

const ROOT = "https://external-api.kalshi.com";
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();
const ticker = "KXGOLD15M-26SEP250030-30";

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

const pos = JSON.parse(await kalshi("GET", "/trade-api/v2/portfolio/positions", "?limit=200"));
const row = (pos.market_positions ?? []).find((item) => item.ticker === ticker);
console.log("pos", row ? JSON.stringify({ pos: row.position_fp, exp: row.market_exposure_dollars, pnl: row.realized_pnl_dollars, updated: row.last_updated_ts }) : "gone");
const settlements = JSON.parse(await kalshi("GET", "/trade-api/v2/portfolio/settlements", "?limit=5"));
for (const row of settlements.settlements ?? []) {
  if (!String(row.ticker ?? row.market_ticker ?? "").includes("GOLD15M")) continue;
  console.log("settle", JSON.stringify(row));
}
const market = await (await fetch(`${ROOT}/trade-api/v2/markets/${ticker}`)).json();
const m = market.market ?? {};
console.log("market", m.status, m.result, m.expiration_value, m.last_price_dollars, m.floor_strike);
