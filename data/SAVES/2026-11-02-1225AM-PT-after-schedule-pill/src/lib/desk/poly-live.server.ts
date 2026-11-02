import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createPrivateKey, sign, type KeyObject } from "node:crypto";
import type { KalshiMarket, Side } from "./types";
import { liveOn, maxDollars, noteBlock } from "./live-guard";

const ROOT = "https://api.polymarket.us";
const HEDGE_DOLLARS = 10;
const PRIMARY_DOLLARS = 25;
export const HEDGE_MULTIPLE = 8;

type BookLevel = { px?: { value?: string } };
type PolyMarket = {
  slug?: string;
  assetPriceTerms?: {
    horizon?: string;
    windowEnd?: string;
    priceToBeat?: { value?: string };
    asset?: { symbol?: string };
  };
};

let cachedKey: KeyObject | null = null;

function keyId(): string {
  return readFileSync(join(process.cwd(), ".secrets", "polymarket.id"), "utf8").trim();
}

function privateKey(): KeyObject {
  if (cachedKey) return cachedKey;
  const seed = Buffer.from(readFileSync(join(process.cwd(), ".secrets", "polymarket.secret"), "utf8").trim(), "base64").subarray(0, 32);
  const pkcs8 = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]);
  cachedKey = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  return cachedKey;
}

export function polymarketArmed(): boolean {
  try {
    return keyId().length > 0 && Boolean(privateKey());
  } catch {
    return false;
  }
}

// LIVE GUARD at the wire. A Polymarket buy is refused while the live switch is
// off and is cut to the switch cap. Sells always go through.
function polyLiveOn(): boolean {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8")).polyLive === true;
  } catch {
    return false;
  }
}
function guardPolyOrder(method: string, path: string, body: unknown): { body?: unknown; refused?: string } {
  const order = body as { intent?: string; quantity?: number; marketSlug?: string; price?: { value?: string } } | undefined;
  if (method !== "POST" || !path.startsWith("/v1/orders") || !order || !/BUY/i.test(String(order.intent || ""))) return { body };
  // POLYMARKET SWITCH (Oct 4 ~8:55 PM PT): Polymarket can run while Kalshi's LIVE is off (live-switch "polyLive": true).
  if (!liveOn() && !polyLiveOn()) {
    noteBlock({ venue: "polymarket", ticker: order.marketSlug, reason: "Live switch is OFF" });
    return { refused: "Live switch is OFF. No new Polymarket order was sent." };
  }
  const yesPx = Number(order.price?.value);
  // Prices are YES-side (docs): a SHORT (Down) contract costs 1 - price. The cap used to read the YES price and cut a
  // $3 Down ticket at 5c as if it were $57.
  const px = /SHORT/i.test(String(order.intent || "")) ? 1 - yesPx : yesPx;
  const qty = Number(order.quantity);
  // fix358 (Oct 27 2026 6:55 PM PT, Love: "raise her stake to $10 on the other hours" + card "$7.50 now"): a Polymarket 5M order (5m market slug) may go up to
  // polyTwin.rej5m.dollars; every other order keeps the live cap (maxDollars). Kalshi never reads this.
  let cap = maxDollars();
  try { if (/-5m-/.test(String(order.marketSlug || ""))) { const r5c = Number(JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"))?.polyTwin?.rej5m?.dollars); if (r5c > cap) cap = r5c; } } catch {}
  if (px > 0 && qty > 0 && qty * px > cap + 1e-6) {
    const fixed = Math.floor((cap / px) * 100) / 100;
    noteBlock({ venue: "polymarket", ticker: order.marketSlug, reason: `Size cut from $${(qty * px).toFixed(2)} to the $${cap} cap` });
    if (!(fixed >= 0.01)) return { refused: "Size under the cap rounds to zero." };
    return { body: { ...order, quantity: fixed } };
  }
  return { body };
}

async function poly(method: string, path: string, query = "", rawBody?: unknown): Promise<Response> {
  const guarded = guardPolyOrder(method, path, rawBody);
  if (guarded.refused) return new Response(JSON.stringify({ error: guarded.refused }), { status: 403, headers: { "Content-Type": "application/json" } });
  const body = guarded.body;
  const timestamp = Date.now().toString();
  const signature = sign(null, Buffer.from(`${timestamp}${method}${path}`), privateKey()).toString("base64");
  return fetch(ROOT + path + query, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-PM-Access-Key": keyId(),
      "X-PM-Timestamp": timestamp,
      "X-PM-Signature": signature,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    // fix216 (Oct 25 ~3:35 PM PT, Love: "what's causing her to miss out on the first minute of the window ... fix the leak"): a read that hangs gives up after 6 s
    // so one stuck reply can't hold her market lookups; orders (POST/DELETE) are untouched.
    signal: method === "GET" ? AbortSignal.timeout(6000) : undefined,
  });
}

// READ-ONLY AUDIT (Oct 21 ~2:30 PM PT, Love: "the api key is linked for polymarket on our end hun, you're not able to see the orders on there?"): on request
// (data/poly-audit.req) the desk GETs her balance, positions and order/activity history with its own key and writes the answers to data/poly-audit.json.
// GET only - it can never place, cancel or sell. The history paths are not in our notes, so each is tried and its status kept.
export async function polyAudit(): Promise<void> {
  const out: Record<string, unknown> = { at: new Date().toISOString() };
  const paths: [string, string][] = [["/v1/account/balances", ""], ["/v1/portfolio/positions", ""], ["/v1/orders", "?limit=200"], ["/v1/orders", "?status=filled&limit=200"], ["/v1/portfolio/activities", "?limit=200"], ["/v1/portfolio/activity", "?limit=200"], ["/v1/portfolio/history", "?limit=200"], ["/v1/fills", "?limit=200"], ["/v1/portfolio/fills", "?limit=200"], ["/v1/account/transactions", "?limit=200"]];
  for (const [path, q] of paths) {
    try {
      const res = await poly("GET", path, q);
      const t = await res.text();
      let body: unknown = t.slice(0, 400000);
      try { body = JSON.parse(t); } catch {}
      out[path + q] = { status: res.status, body };
    } catch (e) { out[path + q] = { error: String(e).slice(0, 160) }; }
  }
  try { const r2 = await poly("GET", "/v1/markets", "?search=gold&closed=false&limit=50"); const t2 = await r2.text(); let b2: unknown = t2.slice(0, 200000); try { b2 = JSON.parse(t2); } catch {} out["/v1/markets?search=gold"] = { status: r2.status, body: b2 }; } catch (e) { out["/v1/markets?search=gold"] = { error: String(e).slice(0, 160) }; }
  try { const r3 = await poly("GET", "/v1/markets", "?search=updown&closed=false&limit=200"); const j3 = (await r3.json().catch(() => ({}))) as { markets?: PolyMarket[] }; out.updownSlugs = (j3.markets ?? []).filter((m) => !/btc/i.test(String(m.slug))).map((m) => [m.slug, m.assetPriceTerms?.horizon, m.assetPriceTerms?.asset?.symbol, m.assetPriceTerms?.windowEnd]).slice(0, 80); } catch (e) { out.updownSlugs = String(e).slice(0, 120); } // fix113
  try { const endE = new Date((Math.floor(Date.now() / 900000)) * 900000), evS = `gold-updown-15m-${endE.toISOString().slice(0, 10)}-${String(endE.getUTCHours()).padStart(2, "0")}${String(endE.getUTCMinutes()).padStart(2, "0")}z`; const evOut: Record<string, unknown> = {};
    for (const [path, q] of [[`/v1/events/slug/${evS}`, ""], [`/v1/events/${evS}`, ""], ["/v1/events", `?slug=${evS}`], ["/v1/markets", `?eventSlug=${evS}`]] as [string, string][]) { try { const r = await poly("GET", path, q); evOut[path + q] = { status: r.status, body: (await r.text()).slice(0, 3000) }; } catch (x) { evOut[path + q] = String(x).slice(0, 100); } }
    const probe: Record<string, number> = {}; // fix115: which gold market slug answers
    for (const pre of ["cpc", "fpc", "cmd", "cmdty", "mpc", "gpc", "spc", "ipc", "apc", "xpc", "tpc", "fut", "com", "comm", "mtl"]) for (const sym of ["gold", "xau", "gc", "xauusd", "au"]) { const sl = `${pre}-${sym}-updown-15m-${evS.slice(16)}`; try { const r = await poly("GET", `/v1/markets/${sl}/bbo`); probe[sl] = r.status; } catch { probe[sl] = -1; } }
    try { const r = await poly("GET", "/v1/markets", `?slug=${evS}`); evOut["?slug=" + evS] = { status: r.status, body: (await r.text()).slice(0, 1500) }; } catch {}
    for (const pre of ["cpc", "fpc", "cmd", "mpc"]) for (const sym of ["gld", "paxg", "xaut", "goldusd", "xau-usd", "gold-usd", "mgc", "gcz", "gc1"]) { const sl = `${pre}-${sym}-updown-15m-${evS.slice(16)}`; try { const r = await poly("GET", `/v1/markets/${sl}/bbo`); probe[sl] = r.status; } catch { probe[sl] = -1; } } // fix116
    try { const bS = `cpc-btc-updown-15m-${evS.slice(16)}`; const r = await poly("GET", "/v1/markets", `?slug=${bS}`); evOut.btcMarket = (await r.text()).slice(0, 6000); } catch {}
    for (const [pth, q] of [["/v1/series", "?limit=100"], ["/v1/events", "?limit=100&closed=false"], ["/v1/markets", "?closed=false&limit=200&offset=0&category=commodities"], ["/v1/markets", "?closed=false&limit=200&categories=commodities"]] as [string, string][]) { try { const r = await poly("GET", pth, q); const t = await r.text(); evOut[pth + q] = { status: r.status, gold: (t.match(/"slug":"[^"]*(gold|xau|gc-)[^"]*"/gi) || []).slice(0, 40), len: t.length }; } catch {} }
    out.goldProbe = Object.fromEntries(Object.entries(probe).filter(([, v]) => v !== 404));
    out.goldEvent = evOut; } catch {} // fix114
  try { const endT = new Date((Math.floor(Date.now() / 900000) + 1) * 900000).toISOString(); out.twinWindows = { closesAt: endT, btc: await polyWindowAsset("btc", endT), gold: await polyWindowAsset("gold", endT) }; } catch (e) { out.twinWindows = { error: String(e).slice(0, 160) }; } // fix112
  // EXTRA READ-ONLY PATHS (fix117): data/poly-audit-paths.json ["/v1/...?..."] - GET only, each answer kept (first 4000 chars + any gold-looking slugs).
  try { const ex = JSON.parse(readFileSync(join(process.cwd(), "data", "poly-audit-paths.json"), "utf8")); const exOut: Record<string, unknown> = {};
    for (const full of (Array.isArray(ex) ? ex : []).slice(0, 30)) { const s0 = String(full); if (!s0.startsWith("/v1/")) continue; const qi = s0.indexOf("?"); const pth = qi >= 0 ? s0.slice(0, qi) : s0, q = qi >= 0 ? s0.slice(qi) : "";
      try { const r = await poly("GET", pth, q); const t = await r.text(); exOut[s0] = { status: r.status, len: t.length, gold: Array.from(new Set(t.match(/"(slug|identifier)":"[^"]*(gold|xau|gc|paxg)[^"]*"/gi) || [])).slice(0, 40), syms: Array.from(new Set(t.match(/"symbol":"[^"]*"/g) || [])).slice(0, 40), head: t.slice(0, 4000) }; } catch (x) { exOut[s0] = String(x).slice(0, 120); } }
    out.extra = exOut; } catch {}
  writeFileSync(join(process.cwd(), "data", "poly-audit.json"), JSON.stringify(out, null, 1));
}

export async function polymarketCash(): Promise<number | null> {
  const res = await poly("GET", "/v1/account/balances");
  if (!res.ok) return null;
  const data = (await res.json()) as { balances?: { buyingPower?: number }[] };
  const n = data.balances?.[0]?.buyingPower;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

export type PolyHolding = {
  slug: string;
  net: number;
  cost: number;
  avg: number;
};

export async function polymarketHoldings(): Promise<PolyHolding[]> {
  const res = await poly("GET", "/v1/portfolio/positions");
  if (!res.ok) return [];
  const data = (await res.json()) as {
    positions?: Record<
      string,
      {
        netPositionDecimal?: string;
        cost?: { value?: string };
        avgPx?: { value?: string };
        marketMetadata?: { slug?: string };
      }
    >;
  };
  return Object.entries(data.positions ?? {}).map(([slug, row]) => ({
    slug: row.marketMetadata?.slug || slug,
    net: Number.parseFloat(row.netPositionDecimal ?? "0") || 0,
    cost: Number.parseFloat(row.cost?.value ?? "") || 0,
    avg: Number.parseFloat(row.avgPx?.value ?? "") || 0,
  }));
}

export async function polymarketWindow(slug: string): Promise<{
  closed: boolean;
  downWon: boolean | null;
  beat: number | null;
  settlement: number | null;
} | null> {
  const res = await poly("GET", "/v1/markets", `?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    markets?: {
      closed?: boolean;
      outcomePrices?: string;
      assetPriceTerms?: { priceToBeat?: { value?: string }; settlementPrice?: { value?: string } };
    }[];
  };
  const market = data.markets?.[0];
  if (!market) return null;
  const beat = Number.parseFloat(market.assetPriceTerms?.priceToBeat?.value ?? "");
  const settlement = Number.parseFloat(market.assetPriceTerms?.settlementPrice?.value ?? "");
  let downWon: boolean | null = null;
  if (market.outcomePrices?.includes("[\"0\",\"1\"]") || market.outcomePrices?.includes('["0", "1"]') || market.outcomePrices === "[\"0\",\"1\"]") {
    downWon = true;
  } else if (market.outcomePrices?.includes("[\"1\",\"0\"]") || market.outcomePrices?.includes('["1", "0"]')) {
    downWon = false;
  } else if (market.closed && Number.isFinite(beat) && Number.isFinite(settlement)) {
    downWon = settlement < beat;
  }
  return {
    closed: Boolean(market.closed),
    downWon,
    beat: Number.isFinite(beat) ? beat : null,
    settlement: Number.isFinite(settlement) ? settlement : null,
  };
}

/** The Polymarket BTC 15m market for the window closing at closesAt (slug + its price to beat). */
export async function polyWindowFor(closesAt: string) {
  return liveWindow(closesAt);
}
async function liveWindow(closesAt: string): Promise<{ slug: string; target: number | null } | null> {
  const end = Date.parse(closesAt);
  if (Number.isFinite(end)) {
    const startMs = end - 15 * 60 * 1000;
    const start = Math.floor(startMs / 1000);
    const d = new Date(startMs);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const day = d.toISOString().slice(0, 10);
    for (const slug of [`btc-updown-15m-${start}`, `cpc-btc-updown-15m-${day}-${hh}${mm}z`]) {
      const top = await bookTop(slug);
      if (top) return { slug, target: null };
    }
  }
  const res = await poly("GET", "/v1/markets", "?categories=crypto&search=updown&closed=false&limit=200");
  if (!res.ok) return null;
  const data = (await res.json()) as { markets?: PolyMarket[] };
  const close = Date.parse(closesAt);
  const now = Date.now();
  const hit = (data.markets ?? []).find((m) => {
    const terms = m.assetPriceTerms;
    if (terms?.horizon !== "15m" || terms.asset?.symbol !== "btc" || !m.slug) return false;
    const windowEnd = Date.parse(terms.windowEnd ?? "");
    const start = windowEnd - 15 * 60 * 1000;
    if (!(start <= now && now < windowEnd)) return false;
    return Number.isFinite(close) && Math.abs(windowEnd - close) < 3 * 60 * 1000;
  });
  if (!hit?.slug) return null;
  const beat = Number.parseFloat(hit.assetPriceTerms?.priceToBeat?.value ?? "");
  return { slug: hit.slug, target: Number.isFinite(beat) ? beat : null };
}

// GOLD 15M ON POLYMARKET (fix112, Oct 22 ~8:45 PM PT, Love: "polymarket now has 15M gold markets"): the window closing at closesAt for an asset.
// BTC keeps liveWindow. Gold tries the likely slugs, then searches open markets for a 15m one whose asset is gold and whose window ends with Kalshi's.
// A found window is cached per close time.
const POLY_SYMS: Record<string, string[]> = { btc: ["btc"], gold: ["gold", "xau", "xauusd", "paxg", "xaut", "gc"] };
export async function polyWindowAsset(asset: string, closesAt: string): Promise<{ slug: string; target: number | null } | null> {
  if (asset === "btc") return liveWindow(closesAt);
  const GW = globalThis as any; const cache = (GW.__polyWinCache ||= {}) as Record<string, { slug: string; target: number | null }>;
  const ck = asset + "|" + closesAt; if (cache[ck]) return cache[ck];
  const miss = (GW.__polyWinMiss ||= {}) as Record<string, number>; if (Date.now() - (miss[ck] || 0) < 60000) return null; miss[ck] = Date.now(); // fix115: a miss waits a minute before asking again
  const end = Date.parse(closesAt); if (!Number.isFinite(end)) return null;
  const start = Math.floor((end - 15 * 60 * 1000) / 1000);
  { const ds = new Date(start * 1000), day = ds.toISOString().slice(0, 10), hm = String(ds.getUTCHours()).padStart(2, "0") + String(ds.getUTCMinutes()).padStart(2, "0"); // fix113: BTC's live slug is cpc-btc-updown-15m-<day>-<hhmm>z
    for (const pre of POLY_SYMS[asset] ?? []) for (const slug of [...["cpausp", "cpc"].map((x) => `${x}-${pre}-updown-15m-${day}-${hm}z`) /* fix118: gold is cpausp-gold-updown-15m-<day>-<hhmm>z (category finance) */, `${pre}-updown-15m-${day}-${hm}z`, `${pre}-updown-15m-${start}`]) { if (await bookTop(slug).catch(() => null)) return (cache[ck] = { slug, target: null }); }
    // GOLD BY ITS EVENT (fix114, Oct 22 ~8:53 PM PT, Love's link polymarket.us/event/gold-updown-15m-2026-10-23-0345z): read the event, take its market's slug.
    const ev = `${asset}-updown-15m-${day}-${hm}z`;
    for (const [path, q] of [[`/v1/events/slug/${ev}`, ""], [`/v1/events/${ev}`, ""], ["/v1/events", `?slug=${ev}`], ["/v1/markets", `?eventSlug=${ev}`]] as [string, string][]) {
      try { const res = await poly("GET", path, q); if (!res.ok) continue; const j: any = await res.json().catch(() => null); const evs: any[] = Array.isArray(j?.events) ? j.events : j?.event ? [j.event] : j ? [j] : [];
        const ms: any[] = [...evs.flatMap((x: any) => (Array.isArray(x?.markets) ? x.markets : [])), ...(Array.isArray(j?.markets) ? j.markets : [])];
        const mk = ms.find((m: any) => m?.slug && (!m.closed)); if (mk?.slug && (await bookTop(String(mk.slug)).catch(() => null))) { const beat = Number.parseFloat(mk.assetPriceTerms?.priceToBeat?.value ?? ""); return (cache[ck] = { slug: String(mk.slug), target: Number.isFinite(beat) ? beat : null }); } } catch {}
    } }
  for (const q of [`?search=${encodeURIComponent(asset)}&closed=false&limit=200`, "?search=updown&closed=false&limit=200"]) {
    const res = await poly("GET", "/v1/markets", q).catch(() => null); if (!res || !res.ok) continue;
    const data = (await res.json().catch(() => ({}))) as { markets?: PolyMarket[] };
    const hit = (data.markets ?? []).find((m) => { const t = m.assetPriceTerms; if (t?.horizon !== "15m" || !m.slug) return false;
      if (!(POLY_SYMS[asset] ?? []).includes(String(t.asset?.symbol || "").toLowerCase())) return false;
      const we = Date.parse(t.windowEnd ?? ""); return Number.isFinite(we) && Math.abs(we - end) < 3 * 60 * 1000; });
    if (hit?.slug) { const beat = Number.parseFloat(hit.assetPriceTerms?.priceToBeat?.value ?? ""); return (cache[ck] = { slug: hit.slug, target: Number.isFinite(beat) ? beat : null }); }
  }
  return null;
}

// BTC 5M ON POLYMARKET (fix170, Oct 24 ~7:00 PM PT, Love: "i want to try running the rejection model on polymarket @ $2 for the 5 Minute markets, it gives price
// less time to reverse" + her link polymarket.us/event/btc-updown-5m-2026-10-25-0155z): the 5-minute BTC market closing at closesAt. Tries the likely slugs
// (start time in the name, like the 15m ones), then the event, then a search for a 5m BTC market whose window ends then. Cached per close time.
export async function polyWindow5(asset: string, closesAt: string): Promise<{ slug: string; target: number | null } | null> {
  if (asset !== "btc") return null;
  const GW = globalThis as any; const cache = (GW.__polyWin5 ||= {}) as Record<string, { slug: string; target: number | null }>;
  if (cache[closesAt]) return cache[closesAt];
  const end = Date.parse(closesAt); if (!Number.isFinite(end)) return null;
  // fix216: in the window's first 2:30 (where her doors live) a miss is re-asked every 3 s, not every 20 s - a market Polymarket lists a few seconds late no longer costs her the first minute
  const miss = (GW.__polyWin5Miss ||= {}) as Record<string, number>; if (Date.now() - (miss[closesAt] || 0) < (end - Date.now() > 150000 ? 3000 : 20000)) return null; miss[closesAt] = Date.now();
  const startMs = end - 5 * 60 * 1000, ds = new Date(startMs), day = ds.toISOString().slice(0, 10), hm = String(ds.getUTCHours()).padStart(2, "0") + String(ds.getUTCMinutes()).padStart(2, "0");
  for (const slug of [`cpc-btc-updown-5m-${day}-${hm}z`, `btc-updown-5m-${day}-${hm}z`, `btc-updown-5m-${Math.floor(startMs / 1000)}`]) { if (await bookTop(slug).catch(() => null)) return (cache[closesAt] = { slug, target: null }); }
  const ev = `btc-updown-5m-${day}-${hm}z`;
  for (const [path, q] of [[`/v1/events/slug/${ev}`, ""], [`/v1/events/${ev}`, ""], ["/v1/events", `?slug=${ev}`], ["/v1/markets", `?eventSlug=${ev}`]] as [string, string][]) {
    try { const res = await poly("GET", path, q); if (!res.ok) continue; const j: any = await res.json().catch(() => null); const evs: any[] = Array.isArray(j?.events) ? j.events : j?.event ? [j.event] : j ? [j] : [];
      const ms: any[] = [...evs.flatMap((x: any) => (Array.isArray(x?.markets) ? x.markets : [])), ...(Array.isArray(j?.markets) ? j.markets : [])];
      const mk = ms.find((m: any) => m?.slug && !m.closed); if (mk?.slug && (await bookTop(String(mk.slug)).catch(() => null))) { const beat = Number.parseFloat(mk.assetPriceTerms?.priceToBeat?.value ?? ""); return (cache[closesAt] = { slug: String(mk.slug), target: Number.isFinite(beat) ? beat : null }); } } catch {}
  }
  const res = await poly("GET", "/v1/markets", "?categories=crypto&search=updown&closed=false&limit=200").catch(() => null);
  if (res && res.ok) { const data = (await res.json().catch(() => ({}))) as { markets?: PolyMarket[] };
    const hit = (data.markets ?? []).find((m) => { const t = m.assetPriceTerms; if (t?.horizon !== "5m" || String(t.asset?.symbol || "").toLowerCase() !== "btc" || !m.slug) return false; const we = Date.parse(t.windowEnd ?? ""); return Number.isFinite(we) && Math.abs(we - end) < 60 * 1000; });
    if (hit?.slug) { const beat = Number.parseFloat(hit.assetPriceTerms?.priceToBeat?.value ?? ""); return (cache[closesAt] = { slug: hit.slug, target: Number.isFinite(beat) ? beat : null }); } }
  return null;
}

export async function btcStandIn(): Promise<KalshiMarket | null> {
  const startMs = Math.floor(Date.now() / (15 * 60 * 1000)) * 15 * 60 * 1000;
  const end = new Date(startMs + 15 * 60 * 1000).toISOString();
  const window = await liveWindow(end);
  if (!window) return null;
  const top = await bookTop(window.slug);
  if (!top) return null;
  const yesAsk = top.ask;
  const yesBid = top.bid;
  return {
    ticker: window.slug,
    eventTicker: window.slug,
    title: "BTC Up or Down 15m",
    status: "open",
    target: window.target,
    closeTime: end,
    openTime: new Date(startMs).toISOString(),
    yesBid,
    yesAsk,
    noBid: Math.round((1 - yesAsk) * 100) / 100,
    noAsk: Math.round((1 - yesBid) * 100) / 100,
    last: yesAsk,
    volume: 0,
    result: "",
  };
}

function pxOf(level: unknown): number {
  if (typeof level === "number") return level;
  if (!level || typeof level !== "object") return NaN;
  const row = level as { value?: string; px?: { value?: string } };
  return Number.parseFloat(row.px?.value ?? row.value ?? "");
}

// 5M BLIND SPOT LOG (fix214, Oct 25 ~3:20 PM PT, Love picked "Log the replies first"): read-only - when a 5m or 1h book reads empty, what Polymarket sent back
// goes to data/poly5-diag.jsonl (once per slug per 15 s). Nothing about trading changes.
function diag5(slug: string, status: number, body: string) {
  if (!/-(5m|1h)-/.test(slug)) return;
  const G = globalThis as any; const seen = (G.__diag5 ||= {}) as Record<string, number>; if (Date.now() - (seen[slug] || 0) < 15000) return; seen[slug] = Date.now();
  try { appendFileSync(join(process.cwd(), "data", "poly5-diag.jsonl"), JSON.stringify({ at: new Date().toISOString(), slug, status, body: body.slice(0, 600) }) + "\n"); } catch {}
}
export async function bookTop(slug: string): Promise<{ bid: number; ask: number } | null> {
  const res = await poly("GET", `/v1/markets/${slug}/bbo`);
  if (!res.ok) { diag5(slug, res.status, await res.text().catch(() => "")); return null; }
  const txt5 = await res.text();
  const data = JSON.parse(txt5) as {
    marketData?: { state?: string; currentPx?: { value?: string }; bestBid?: unknown; bestAsk?: unknown };
  };
  const md = data.marketData;
  if (!md || md.state === "MARKET_STATE_EXPIRED" || md.state === "MARKET_STATE_CLOSED") { if (!md) diag5(slug, 200, txt5); return null; }
  let bid = pxOf(md.bestBid);
  let ask = pxOf(md.bestAsk);
  const mid = Number.parseFloat(md.currentPx?.value ?? "");
  if (!(bid > 0 && bid < 1) && mid > 0 && mid < 1) bid = mid;
  if (!(ask > 0 && ask < 1) && mid > 0 && mid < 1) ask = mid;
  if (!(bid > 0 && bid < 1) || !(ask > 0 && ask < 1)) { diag5(slug, 200, txt5); return null; }
  return { bid, ask };
}

// YES-SIDE PRICES (Claude, Oct 4 ~3:30 AM PT): Polymarket US prices every order on the YES (Up) side: "If you want to buy
// NO at $0.40, you're really selling YES at $0.60" (docs.polymarket.us/concepts/orders). Down orders used to send the Down
// price as-is: a Down BUY had no price protection and a Down SELL could never fill. Convert at the wire, read fills back.
function wirePx(side: Side, px: number): number {
  return side === "up" ? px : Math.round((1 - px) * 100) / 100;
}
function sidePx(side: Side, yesAvg: number): number {
  return side === "up" ? yesAvg : Math.round((1 - yesAvg) * 10000) / 10000;
}
export async function markSide(
  slug: string,
  side: Side,
  contracts: number,
  stake: number,
): Promise<{ bid: number; profit: number; pct: number } | null> {
  const top = await bookTop(slug);
  if (!top || !(contracts > 0) || !(stake > 0)) return null;
  const bid = side === "up" ? top.bid : Math.round((1 - top.ask) * 100) / 100;
  if (!(bid > 0 && bid < 1)) return null;
  const profit = contracts * bid - stake;
  return { bid, profit, pct: profit / stake };
}

export async function sellSide(
  side: Side,
  slug: string,
  quantity: number,
): Promise<{ filled: number; price: number } | null> {
  const top = await bookTop(slug);
  if (!top) return null;
  const bid = side === "up" ? top.bid : Math.round((1 - top.ask) * 100) / 100;
  if (!(bid >= 0.02) || !(quantity >= 0.01)) return null;
  const price = Math.max(0.01, Math.round((bid - 0.01) * 100) / 100);
  const qty = Math.floor(quantity * 100) / 100;
  const res = await poly("POST", "/v1/orders", "", {
    marketSlug: slug,
    intent: side === "up" ? "ORDER_INTENT_SELL_LONG" : "ORDER_INTENT_SELL_SHORT",
    type: "ORDER_TYPE_LIMIT",
    price: { value: wirePx(side, price).toFixed(2), currency: "USD" },
    quantity: qty,
    tif: "TIME_IN_FORCE_IMMEDIATE_OR_CANCEL",
    synchronousExecution: true,
    manualOrderIndicator: "MANUAL_ORDER_INDICATOR_AUTOMATED",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    order?: { cumQuantity?: number };
    executions?: { order?: { cumQuantity?: number } }[];
  };
  const orders = (data.executions ?? []).map((entry) => entry.order).filter((order) => order != null);
  const order = orders.reduce<(typeof orders)[number] | undefined>((best, next) => {
    return Number(next?.cumQuantity ?? 0) >= Number(best?.cumQuantity ?? 0) ? next : best;
  }, data.order);
  const filled = Number(order?.cumQuantity ?? 0);
  if (!(filled > 0)) return null;
  return { filled, price };
}

async function askFor(slug: string, side: Side): Promise<number | null> {
  const top = await bookTop(slug);
  if (!top) return null;
  if (side === "up") return top.ask > 0 && top.ask < 1 ? top.ask : null;
  const down = Math.round((1 - top.bid) * 100) / 100;
  return down > 0 && down < 1 ? down : null;
}

export type HedgeFill = {
  orderId: string;
  filled: number;
  price: number;
  slug: string;
  target: number | null;
};

export async function hedgeOpposite(side: Side, closesAt: string): Promise<HedgeFill | null> {
  return takeSide(side, closesAt, HEDGE_DOLLARS, 1 / HEDGE_MULTIPLE);
}

const polyWindows = globalThis as { __aureliusPolyWindows?: Set<string> };

function claimWindow(slug: string): boolean {
  polyWindows.__aureliusPolyWindows ??= new Set();
  if (polyWindows.__aureliusPolyWindows.has(slug)) return false;
  polyWindows.__aureliusPolyWindows.add(slug);
  return true;
}

function releaseWindow(slug: string) {
  polyWindows.__aureliusPolyWindows?.delete(slug);
}

// WHY (Oct 4 ~12:10 PM PT): takeSide used to return null with no reason; the insurance log said "no fill" for refusals that
// never reached Polymarket. The last reason is kept here for the caller to log.
let lastTakeWhy = "";
function whyNull(why: string): null {
  lastTakeWhy = why;
  return null;
}
export function takeSideWhy(): string {
  return lastTakeWhy;
}
export async function takeSide(
  side: Side,
  closesAt: string,
  dollars = PRIMARY_DOLLARS,
  maxAsk = 0.74,
  minAsk = 0.08,
  slip = 0.03,
  claimTag = "",
  asset = "btc",
): Promise<HedgeFill | null> {
  const cash = await polymarketCash();
  if (cash == null || cash < dollars) return whyNull(`Polymarket cash ${cash ?? "unreadable"} < $${dollars}`);
  const window = claimTag.startsWith(":rej5m") ? await polyWindow5(asset, closesAt) /* fix170 */ : asset === "btc" ? await liveWindow(closesAt) : await polyWindowAsset(asset, closesAt); // fix112: gold 15m on Polymarket too
  if (!window) return whyNull("no Polymarket window found for this close time");
  // Each insurance tier claims its own key (Oct 4): one shared claim per window blocked the $2 16x tier forever.
  const claimKey = window.slug + claimTag;
  if (!claimWindow(claimKey)) return whyNull("this tier already has an order in flight for this window");
  try {
    const quoted = await askFor(window.slug, side);
    if (quoted == null || quoted < minAsk || quoted > maxAsk) {
      releaseWindow(claimKey);
      return whyNull(quoted == null ? "no Polymarket quote" : `Polymarket ${side} at ${quoted} is outside ${minAsk}-${maxAsk}`);
    }
    // FLAT $2 / $3 FOR THE TWIN (fix148, Oct 23 ~2:36 PM PT, Love: "the roses are going out at $1 - $1.50 for polymarket still / let's have it be a flat $2 / and a
    // flat $3 for the add on"): the twin's entries and add-ons (claim ":twin" / ":twinadd") size off the quoted ask, not the slipped limit, so a fill at the ask
    // spends the full amount; under 10c the limit is the ask itself (a 1c slip is half the price there). Never more than 8% over if it fills at the limit.
    const twinFlat = claimTag.startsWith(":twin");
    const price = twinFlat && quoted < 0.1 ? Math.round(quoted * 100) / 100 : Math.min(0.9, Math.round((quoted + slip) * 100) / 100);
    // $5 MINIMUM ON THE 5M BOOK (fix273, Oct 26 ~11:15 AM PT, Love: "orders are still going out at $2 on polymarket. please make sure that they go out at the
    // minimum of $5"): a 5m entry (claim ":rej5m") sizes off the quoted ask, not the 4c-slipped limit, so a fill at the ask spends the full amount (was ~$4.60).
    const flat5 = claimTag === ":rej5m";
    const quantity = flat5 ? Math.floor((dollars / quoted) * 100) / 100 : twinFlat ? Math.floor(Math.min(dollars / quoted, (dollars * 1.08) / price) * 100) / 100 : Math.floor((dollars / price) * 100) / 100;
    if (!(quantity >= 0.01) || quantity * price > (flat5 ? (dollars * price) / quoted : dollars * (twinFlat ? 1.08 : 1)) + 0.001) {
      releaseWindow(claimKey);
      return whyNull(`size ${quantity} at ${price}`);
    }
    const res = await poly("POST", "/v1/orders", "", {
      marketSlug: window.slug,
      intent: side === "up" ? "ORDER_INTENT_BUY_LONG" : "ORDER_INTENT_BUY_SHORT",
      type: "ORDER_TYPE_LIMIT",
      price: { value: wirePx(side, price).toFixed(2), currency: "USD" },
      quantity,
      tif: "TIME_IN_FORCE_IMMEDIATE_OR_CANCEL",
      synchronousExecution: true,
      manualOrderIndicator: "MANUAL_ORDER_INDICATOR_AUTOMATED",
    });
    if (!res.ok) {
      releaseWindow(claimKey);
      const text = await res.text();
      throw new Error(text.slice(0, 180));
    }
    const data = (await res.json()) as {
      id?: string;
      order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } };
      executions?: { order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } } }[];
    };
    const orders = (data.executions ?? []).map((entry) => entry.order).filter((order) => order != null);
    const order = orders.reduce<(typeof orders)[number] | undefined>((best, next) => {
      return Number(next?.cumQuantity ?? 0) >= Number(best?.cumQuantity ?? 0) ? next : best;
    }, data.order);
    const filled = Number(order?.cumQuantity ?? 0);
    const orderId = order?.id ?? data.id;
    const avg = Number.parseFloat(order?.avgPx?.value ?? "");
    const paid = avg > 0 && avg < 1 ? sidePx(side, avg) : price;
    if (!orderId || !(filled > 0)) {
      releaseWindow(claimKey);
      return whyNull(`sent at ${price}, nothing filled (book moved)`);
    }
    return { orderId, filled, price: paid, slug: window.slug, target: window.target };
  } catch (err) {
    releaseWindow(claimKey);
    throw err;
  }
}

const HOUR_PATH = join(process.cwd(), "data", "poly-hour.json");

function hourSlugs(): string[] {
  try {
    const row = JSON.parse(readFileSync(HOUR_PATH, "utf8")) as { slugs?: string[] };
    return Array.isArray(row.slugs) ? row.slugs : [];
  } catch {
    return [];
  }
}

function rememberHour(slug: string) {
  const slugs = [...new Set([slug, ...hourSlugs()])].slice(0, 48);
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(HOUR_PATH, JSON.stringify({ slugs }));
}

export async function upcomingHour(): Promise<{ slug: string; target: number | null; closesAt: string } | null> {
  const res = await poly("GET", "/v1/markets", "?categories=crypto&search=updown&closed=false&limit=200");
  if (!res.ok) return null;
  const data = (await res.json()) as { markets?: PolyMarket[] };
  const now = Date.now();
  const taken = new Set(hourSlugs());
  const fresh = (data.markets ?? [])
    .map((market) => {
      const terms = market.assetPriceTerms;
      const end = Date.parse(terms?.windowEnd ?? "");
      const symbol = (terms?.asset?.symbol ?? "").toLowerCase();
      if (terms?.horizon !== "1h" || symbol !== "btc" || !market.slug || !Number.isFinite(end)) return null;
      if (taken.has(market.slug)) return null;
      const start = end - 60 * 60 * 1000;
      const left = end - now;
      const until = start - now;
      if (left < 50 * 60 * 1000) return null;
      if (until > 12 * 60 * 1000) return null;
      const beat = Number.parseFloat(terms?.priceToBeat?.value ?? "");
      return {
        slug: market.slug,
        target: Number.isFinite(beat) && beat > 0 ? beat : null,
        closesAt: new Date(end).toISOString(),
        start,
      };
    })
    .filter((row): row is { slug: string; target: number | null; closesAt: string; start: number } => row != null)
    .sort((a, b) => a.start - b.start);
  const hour = fresh[0];
  if (!hour) return null;
  return { slug: hour.slug, target: hour.target, closesAt: hour.closesAt };
}

// The BTC 1-hour Up/Down market that is open right now (Claude, Oct 5, for BRICK on Polymarket 1H). Cached 60s.
const hourNowCache = globalThis as unknown as { __polyHourNow?: { at: number; v: { slug: string; target: number | null; closesAt: string; startsAt: string } | null } };
export async function currentHour(): Promise<{ slug: string; target: number | null; closesAt: string; startsAt: string } | null> {
  const hit = hourNowCache.__polyHourNow;
  if (hit && Date.now() - hit.at < 60000 && (!hit.v || Date.parse(hit.v.closesAt) > Date.now())) return hit.v;
  const res = await poly("GET", "/v1/markets", "?categories=crypto&search=updown&closed=false&limit=200");
  if (!res.ok) return hit?.v ?? null;
  const data = (await res.json()) as { markets?: PolyMarket[] };
  const now = Date.now();
  let v: { slug: string; target: number | null; closesAt: string; startsAt: string } | null = null;
  for (const market of data.markets ?? []) {
    const terms = market.assetPriceTerms;
    const end = Date.parse(terms?.windowEnd ?? "");
    if (terms?.horizon !== "1h" || (terms?.asset?.symbol ?? "").toLowerCase() !== "btc" || !market.slug || !Number.isFinite(end)) continue;
    const start = end - 60 * 60 * 1000;
    if (!(start <= now && now < end)) continue;
    const beat = Number.parseFloat(terms?.priceToBeat?.value ?? "");
    v = { slug: market.slug, target: Number.isFinite(beat) && beat > 0 ? beat : null, closesAt: new Date(end).toISOString(), startsAt: new Date(start).toISOString() };
    break;
  }
  hourNowCache.__polyHourNow = { at: Date.now(), v };
  return v;
}

export async function buySlug(
  side: Side,
  slug: string,
  dollars: number,
  maxAsk: number,
  target: number | null,
): Promise<HedgeFill | null> {
  if (hourSlugs().includes(slug)) return null;
  const cash = await polymarketCash();
  if (cash == null || cash < dollars) return null;
  if (!claimWindow(slug)) return null;
  try {
    const quoted = await askFor(slug, side);
    if (quoted == null || quoted < 0.08 || quoted > maxAsk) {
      releaseWindow(slug);
      return null;
    }
    const price = Math.min(0.9, Math.round((quoted + 0.02) * 100) / 100);
    const quantity = Math.floor((dollars / price) * 100) / 100;
    if (!(quantity >= 0.01) || quantity * price > dollars + 0.001) {
      releaseWindow(slug);
      return null;
    }
    const res = await poly("POST", "/v1/orders", "", {
      marketSlug: slug,
      intent: side === "up" ? "ORDER_INTENT_BUY_LONG" : "ORDER_INTENT_BUY_SHORT",
      type: "ORDER_TYPE_LIMIT",
      price: { value: wirePx(side, price).toFixed(2), currency: "USD" },
      quantity,
      tif: "TIME_IN_FORCE_IMMEDIATE_OR_CANCEL",
      synchronousExecution: true,
      manualOrderIndicator: "MANUAL_ORDER_INDICATOR_AUTOMATED",
    });
    if (!res.ok) {
      releaseWindow(slug);
      return null;
    }
    const data = (await res.json()) as {
      id?: string;
      order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } };
      executions?: { order?: { id?: string; cumQuantity?: number; avgPx?: { value?: string } } }[];
    };
    const orders = (data.executions ?? []).map((entry) => entry.order).filter((order) => order != null);
    const order = orders.reduce<(typeof orders)[number] | undefined>((best, next) => {
      return Number(next?.cumQuantity ?? 0) >= Number(best?.cumQuantity ?? 0) ? next : best;
    }, data.order);
    const filled = Number(order?.cumQuantity ?? 0);
    const orderId = order?.id ?? data.id;
    const avg = Number.parseFloat(order?.avgPx?.value ?? "");
    const paid = avg > 0 && avg < 1 ? sidePx(side, avg) : price;
    if (!orderId || !(filled > 0)) {
      releaseWindow(slug);
      return null;
    }
    rememberHour(slug);
    return { orderId, filled, price: paid, slug, target };
  } catch (err) {
    releaseWindow(slug);
    throw err;
  }
}
