// Kalshi REST, signed with the core's OWN key in aurelius-core/secrets/ (kalshi-key-id.txt + kalshi-private-key.pem).
import { createPrivateKey, sign, constants, randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./config.js";

const BASE = "https://api.elections.kalshi.com";
const SECRETS = join(ROOT, "secrets");
let key = null;
function creds() {
  if (key) return key;
  const idF = join(SECRETS, "kalshi-key-id.txt"), pemF = join(SECRETS, "kalshi-private-key.pem");
  if (!existsSync(idF) || !existsSync(pemF)) return null;
  key = { id: readFileSync(idF, "utf8").trim(), pk: createPrivateKey(readFileSync(pemF, "utf8")) };
  return key;
}

export async function kalshi(method, path, body) {
  const headers = { "content-type": "application/json" };
  const c = creds();
  if (c) {
    const ts = String(Date.now());
    const msg = ts + method + "/trade-api/v2" + path.split("?")[0];
    const sig = sign("sha256", Buffer.from(msg), { key: c.pk, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST });
    Object.assign(headers, { "KALSHI-ACCESS-KEY": c.id, "KALSHI-ACCESS-TIMESTAMP": ts, "KALSHI-ACCESS-SIGNATURE": sig.toString("base64") });
  }
  const res = await fetch(BASE + "/trade-api/v2" + path, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(5000) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Kalshi ${method} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}
export const hasKeys = () => creds() != null;

const cents = (m, k) => (m[k] != null ? Number(m[k]) : m[`${k}_dollars`] != null ? Math.round(Number(m[`${k}_dollars`]) * 100) : null);

/** The open 15m window for a series: ticker, strike, close time, asks/bids in cents. */
export async function currentWindow(series) {
  const j = await kalshi("GET", `/markets?series_ticker=${series}&status=open&limit=10`);
  const now = Date.now();
  const m = (j.markets || [])
    .filter((x) => Date.parse(x.close_time) > now)
    .sort((a, b) => Date.parse(a.close_time) - Date.parse(b.close_time))[0];
  if (!m) return null;
  return {
    ticker: m.ticker, strike: m.floor_strike != null ? Number(m.floor_strike) : null,
    openMs: Date.parse(m.open_time), closeMs: Date.parse(m.close_time),
    yesAsk: cents(m, "yes_ask"), noAsk: cents(m, "no_ask"), yesBid: cents(m, "yes_bid"), noBid: cents(m, "no_bid"),
  };
}

export async function marketResult(ticker) {
  const m = (await kalshi("GET", `/markets/${ticker}`)).market;
  return m?.result === "yes" || m?.result === "no" ? m.result : null;
}

/** Limit order. side: "yes" | "no", action: "buy" | "sell", priceCents for that side. */
export async function placeOrder({ ticker, side, action, count, priceCents }) {
  const body = { ticker, client_order_id: randomUUID(), action, side, count, type: "limit", [side === "yes" ? "yes_price" : "no_price"]: priceCents };
  return (await kalshi("POST", "/portfolio/orders", body)).order;
}

export async function positionOn(ticker) {
  const j = await kalshi("GET", `/portfolio/positions?ticker=${ticker}`);
  const p = (j.market_positions || []).find((x) => x.ticker === ticker);
  return p ? Number(p.position) : 0; // + = YES contracts, - = NO contracts
}

/** Kalshi's fee for a fill, in dollars (0.07 x C x P x (1-P), rounded up to the cent). */
export const fee = (count, priceCents) => Math.ceil(0.07 * count * (priceCents / 100) * (1 - priceCents / 100) * 100) / 100;
