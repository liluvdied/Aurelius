import { createPrivateKey, sign, constants } from "node:crypto";
import { readFileSync } from "node:fs";

const ROOT = "https://external-api.kalshi.com";
const key = createPrivateKey(readFileSync("/workspace/.secrets/kalshi.pem", "utf8"));
const keyId = readFileSync("/workspace/.secrets/kalshi.id", "utf8").trim();

async function kalshi(path, query = "") {
  const timestamp = Date.now().toString();
  const signature = sign("sha256", Buffer.from(`${timestamp}GET${path}`), {
    key,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  }).toString("base64");
  const res = await fetch(ROOT + path + query, {
    headers: {
      Accept: "application/json",
      "KALSHI-ACCESS-KEY": keyId,
      "KALSHI-ACCESS-TIMESTAMP": timestamp,
      "KALSHI-ACCESS-SIGNATURE": signature,
    },
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
}

const by = new Map();
let cursor = "";
let pages = 0;
let n = 0;
while (pages < 30) {
  const res = await kalshi("/trade-api/v2/portfolio/fills", `?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
  if (!res.ok) {
    console.log("fail", res.status, res.text.slice(0, 180));
    break;
  }
  const data = JSON.parse(res.text);
  const fills = data.fills ?? [];
  n += fills.length;
  for (const row of fills) {
    const ticker = String(row.ticker ?? "");
    if (!ticker.includes("15M")) continue;
    const qty = Number(row.count_fp ?? 0);
    const yes = Number(row.yes_price_dollars ?? 0);
    const action = String(row.action ?? "");
    const side = String(row.side ?? "");
    const fee = Number(row.fee_cost ?? 0);
    const rec = by.get(ticker) ?? { buy: 0, sell: 0, fee: 0, qtyIn: 0, qtyOut: 0 };
    const cash = qty * (side === "yes" ? yes : 1 - yes);
    if (action === "buy") {
      rec.buy += cash;
      rec.qtyIn += qty;
    } else {
      rec.sell += cash;
      rec.qtyOut += qty;
    }
    rec.fee += Number.isFinite(fee) ? fee : 0;
    by.set(ticker, rec);
  }
  pages += 1;
  if (!data.cursor || !fills.length) break;
  cursor = data.cursor;
}
let wins = 0;
let losses = 0;
let flat = 0;
let open = 0;
let pnl = 0;
for (const rec of by.values()) {
  const closed = rec.qtyOut + 0.05 >= rec.qtyIn && rec.qtyIn > 0;
  const profit = rec.sell - rec.buy - rec.fee;
  if (!closed) {
    open += 1;
    continue;
  }
  pnl += profit;
  if (profit > 0.05) wins += 1;
  else if (profit < -0.05) losses += 1;
  else flat += 1;
}
console.log(JSON.stringify({ pages, fills: n, tickers: by.size, wins, losses, flat, open, pnl: Math.round(pnl * 100) / 100 }, null, 2));
