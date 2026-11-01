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

let cursor = "";
let pages = 0;
let wins = 0;
let losses = 0;
let flat = 0;
let pnl = 0;
let rows = 0;
const seen = new Set();
while (pages < 20) {
  const res = await kalshi("/trade-api/v2/portfolio/settlements", `?limit=200${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
  if (!res.ok) {
    console.log("fail", res.status, res.text.slice(0, 200));
    break;
  }
  const data = JSON.parse(res.text);
  const list = data.settlements ?? [];
  for (const row of list) {
    const ticker = String(row.ticker ?? "");
    if (!ticker.includes("15M") || seen.has(ticker)) continue;
    seen.add(ticker);
    const value = Number(row.value ?? NaN);
    const yesCount = Number(row.yes_count_fp ?? row.yes_count ?? 0);
    const noCount = Number(row.no_count_fp ?? row.no_count ?? 0);
    const yesCost = Number(row.yes_total_cost_dollars ?? row.yes_total_cost ?? 0);
    const noCost = Number(row.no_total_cost_dollars ?? row.no_total_cost ?? 0);
    const fee = Number(row.fee_cost ?? 0);
    if (![value, yesCount, noCount, yesCost, noCost].every(Number.isFinite)) continue;
    const profit = (value / 100) * yesCount + (1 - value / 100) * noCount - yesCost - noCost - (Number.isFinite(fee) ? fee : 0);
    rows += 1;
    pnl += profit;
    if (profit > 0.05) wins += 1;
    else if (profit < -0.05) losses += 1;
    else flat += 1;
  }
  pages += 1;
  if (!data.cursor || !list.length) break;
  cursor = data.cursor;
}
console.log(JSON.stringify({ pages, rows, wins, losses, flat, pnl: Math.round(pnl * 100) / 100 }, null, 2));
