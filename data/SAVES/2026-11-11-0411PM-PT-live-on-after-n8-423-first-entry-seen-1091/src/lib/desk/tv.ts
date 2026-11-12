import crypto from "node:crypto";
import tls from "node:tls";
import type { Candle } from "./types";

const CHARTS = {
  // Love's chart (checked 2026-10-02 against her screen to the dollar): OANDA, session resets 17:00 ET.
  // Love, 8:03 PM PT Oct 2: "we're using the BTC chart on my screen, the all-time index" = INDEX:BTCUSD,
  // a 24/7 index, its VWAP Session resetting at 00:00 UTC (5 PM PT). Proven on her screen: INDEX:ETHUSD
  // from 00:00 UTC = 2,676.94, her chart 2,676.94. TradingView sometimes serves the index empty to the
  // desk; then Coinbase fills in (its 00:00 UTC VWAP sat 50 cents from hers).
  // Love, 8:28 PM PT Oct 2: "get off the all-time index, it stalls; I'm on this one" = VANTAGE:BTCUSD
  // (her screen's symbol panel). Proven: VANTAGE 5m from 17:00 ET = 84,552.20, her chart 84,552.18.
  // It prints through the weekend; Coinbase still fills in if it ever goes quiet.
  // Love, Oct 2 night: "put her on kraken". Proof: VWAP from 00:00 UTC = 84,591.9 = her Kraken chart label to the penny.
  // Closest feed to Kalshi settlement: 99.1% same call, ~$4.89 typical gap (Vantage was +$21, 89%).
  // Love, Oct 2 ~10:20 PM PT: "pepperstone then !!!!" -- her lines held best there: 59% of touches bounced $30
  // (next best 49%), only 35% broke through; 5 PM ET anchor beat midnight UTC (59% vs 49%). Kalshi same call 98.2%.
// BTC ON OANDA (Oct 16 ~3:20 PM PT, Love: "let's put her on oanda the pepperstone chart is freezing"). Pepperstone is now the second feed.
  btc: { symbol: "PEPPERSTONE:BTCUSD" /* fix1018 her primary - btcSymbol1018() reads VANTAGE:BTCUSD only while Pepperstone is frozen 10 s+ (fix911 Vantage pin superseded) */, resolution: "5", count: 400, session: "ny" }, // Love, Oct 18 ~5:48 PM PT: "pepperstone" (Coinbase paused 5 s+ about 60x/hour; Pepperstone the fewest) (session 5 PM ET, as Pepperstone always ran) // was: // Love, Oct 18 ~4:58 PM PT: "omg price is way closer to kalshi's on coinbases too. i want to try the next few windows on here" (session 00:00 UTC, her Coinbase chart) // was: // Love, Oct 18 ~4:36 PM PT: "THE INDEX CHART... ON INDEX IT TAPPED AND REJECTED. INDEX PLS" (session from 00:00 UTC = 5 PM PT, as her INDEX chart ran Oct 16) // was: // Love, Oct 18 ~4:31 PM PT: "we need to switch it back to pepperstones hun... vantages chart DEFINITELY flips more than pepperstones... pepperstone pls" // // Love, Oct 17 ~5:49 PM PT: back on Vantage (weekend) // Love, Oct 17 ~4:54 PM PT: back on Pepperstone // Love, Oct 17 ~12:03 AM PT: "let's do vantage hun its the right choice" (5 PM ET session, proven vs her chart Oct 2) // Love, Oct 16 ~11:58 PM PT: INDEX (her symbol info: session 00:00-24:00 UTC, so her VWAP resets 00:00 UTC = 5 PM PT) // Love, Oct 16 ~10:25 PM PT: "i want her on pepperstone if we can" // Love ~3:25 PM PT: "oanda is freezing too. let's trade vantage"
  // Love, Oct 6 ~7:30 AM PT: "CHANGE GOLD TO TVC". Feed lab: TVC:GOLD bands respected 61.9% of touches vs OANDA 52.3%;
  // the paper twin BRICK·TVC GOLD ran 14/17 +$148 vs BRICK gold 12/16 +$80 the same morning. OANDA is the backup.
  gold: { symbol: "TVC:GOLD", resolution: "15", count: 300, session: "ny" },
  // Gold bands come from 5-minute bars like her chart; gold setups still read the 15-minute bars.
  gold5: { symbol: "TVC:GOLD", resolution: "5", count: 300, session: "ny" },
  silver: { symbol: "OANDA:XAGUSD", resolution: "5", count: 400, session: "ny" },
  // GOLDEN WINDOW (Claude, 2026-10-02): the exact feeds the desk ran on Oct 1, 12:45–3:30 PM PT
  // (frozen spine/THIS-ONE). Paper ledger only; the live desk never reads these.
  // Proven against the desk's own Oct 1 log (data/golden-proof.json): OANDA 5m, session from 00:00 UTC.
  btcGolden: { symbol: "OANDA:BTCUSD", resolution: "5", count: 400, session: "utc" },
  // Gold that afternoon: 15m bars for setups AND bands (matched the logged 4167.24 / σ 9.732 to the cent).
  goldGolden: { symbol: "OANDA:XAUUSD", resolution: "15", count: 300, session: "ny" },
} as const;

export type ChartId = keyof typeof CHARTS;

const memory = new Map<ChartId, { at: number; candles: Candle[]; product?: string }>();

function sessionStart(kind: "ny" | "utc"): number {
  if (kind === "utc") {
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000;
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const bit = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const offH = 12 - Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", hourCycle: "h23" }).format(new Date(Date.UTC(bit("year"), bit("month") - 1, bit("day"), 12)))); const day = new Date(Date.UTC(bit("year"), bit("month") - 1, bit("day"), 17 + offH, 0, 0)); // Love Nov 3 2026 6:35 PM PT (DST fix): 5 PM New York every day - 22:00 UTC in winter (EST), 21:00 UTC in summer (EDT). Was a fixed 21:00 UTC, an hour early since Nov 1.
  if (bit("hour") < 17) day.setUTCDate(day.getUTCDate() - 1);
  return day.getTime() / 1000;
}

function frame(payload: string): Buffer {
  const data = Buffer.from(payload);
  const mask = crypto.randomBytes(4);
  const head = Buffer.alloc(data.length < 126 ? 2 : 4);
  head[0] = 0x81;
  if (data.length < 126) {
    head[1] = 0x80 | data.length;
  } else {
    head[1] = 0x80 | 126;
    head.writeUInt16BE(data.length, 2);
  }
  const masked = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 1) masked[i] = data[i] ^ mask[i % 4];
  return Buffer.concat([head, mask, masked]);
}

function packet(method: string, params: unknown[]): string {
  const body = JSON.stringify({ m: method, p: params });
  return `~m~${body.length}~m~${body}`;
}

// FEED AUTOPSY (Oct 16 ~10:06 PM PT, Love: "diagnose what's causing the price feed issue and fix it. do an autopsy."): count every
// chart connection opened to TradingView and how many are open at once, to line up against the price-feed gaps at window opens.
function tvCount(delta: number) {
  if (typeof window !== "undefined") return;
  const G = globalThis as any; G.__tvOpen = (G.__tvOpen || 0) + delta;
  if (delta > 0) void import("node:fs").then((fs) => fs.appendFileSync(`${process.cwd()}/data/tv-connects.jsonl`, JSON.stringify({ at: new Date().toISOString(), open: G.__tvOpen }) + "\n")).catch(() => {});
}
// FLOOD FIX (Oct 16 ~10:25 PM PT, Love: "pls dismantle whatever is causing it, rebuild it to support quicker entries"): the desk
// opened ~200 new TradingView chart connections a minute (up to 21 open at once) from her one IP, and TradingView choked
// every chart on it - her live price line included - so she sat in feed holds at the window opens and got in late at the
// 1.38x floor. Now (a) the same chart asked for by several modules at once is read ONCE and shared, and reused for a moment
// (1 s for 1m/5m bars, 3 s for slower bars, 60 s for big 2,000+ bar history pulls); a smaller ask is cut from a bigger fresh
// read of the same chart; (b) at most 4 chart connections at once, live-size reads always first, history/lab pulls one at a
// time behind them. Her price stream (quotes.ts) is its own connection and never waits here.
const TVG = globalThis as any;
type TvSlot = { live: boolean; go: () => void };
const TV_SLOTS = 4;
const TV_LAB_SLOTS = 1;
function tvSlots(): { busy: number; lab: number; q: TvSlot[] } {
  return (TVG.__tvSlots ||= { busy: 0, lab: 0, q: [] as TvSlot[] });
}
function tvPump() {
  const S = tvSlots();
  while (S.busy < TV_SLOTS && S.q.length) {
    let i = S.q.findIndex((x) => x.live);
    if (i < 0) {
      if (S.lab >= TV_LAB_SLOTS) break;
      i = 0;
    }
    const [x] = S.q.splice(i, 1);
    S.busy += 1;
    if (!x.live) S.lab += 1;
    x.go();
  }
}
async function withTvSlot<T>(live: boolean, fn: () => Promise<T>): Promise<T> {
  await new Promise<void>((go) => {
    tvSlots().q.push({ live, go });
    tvPump();
  });
  try {
    return await fn();
  } finally {
    const S = tvSlots();
    S.busy = Math.max(0, S.busy - 1);
    if (!live) S.lab = Math.max(0, S.lab - 1);
    tvPump();
  }
}
type RawHit = { at: number; count: number; bars: Candle[] };
const rawMem = (): Map<string, RawHit> => (TVG.__tvRawMem ||= new Map<string, RawHit>());
const rawFly = (): Map<string, { count: number; p: Promise<Candle[]> }> => (TVG.__tvRawFly ||= new Map());
const rawTtl = (res: string, count: number) => (count >= 2000 ? 60000 : res === "1" || res === "5" ? 1000 : 3000);
const rawCut = (bars: Candle[], count: number) => bars.slice(-count).map((b) => ({ ...b }));
const metalSymbol = (s: string) => /XAU|GOLD|XAG|SILVER/i.test(s);
/** Gold/silver hours (CME, Pacific): closed 2-3 PM daily and Fri 2 PM - Sun 3 PM (same as quotes.ts goldMarketOpen). */
function metalsOpen(ms: number): boolean {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(ms));
  const wd = parts.find((x) => x.type === "weekday")?.value || "";
  const h = Number(parts.find((x) => x.type === "hour")?.value);
  if (h === 14) return false;
  if (wd === "Sat") return false;
  if (wd === "Fri" && h >= 14) return false;
  if (wd === "Sun" && h < 15) return false;
  return true;
}
// who still asks for charts (diagnostic): every chart ask counted per symbol|resolution, written once a minute to data/tv-asks.json
function tvTally(key: string) {
  if (typeof window !== "undefined") return;
  const T = (TVG.__tvAsks ||= { at: Date.now(), n: {} as Record<string, number> });
  T.n[key] = (T.n[key] || 0) + 1;
  if (Date.now() - T.at > 60000) {
    const out = { from: new Date(T.at).toISOString(), to: new Date().toISOString(), asks: Object.entries(T.n).sort((a: any, b: any) => b[1] - a[1]) };
    TVG.__tvAsks = { at: Date.now(), n: {} };
    void import("node:fs").then((fs) => fs.writeFileSync(`${process.cwd()}/data/tv-asks.json`, JSON.stringify(out, null, 1))).catch(() => {});
  }
}

function connect(): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    tvCount(1);
    const sock = tls.connect(443, "data.tradingview.com", { servername: "data.tradingview.com" }, () => {
      const key = crypto.randomBytes(16).toString("base64");
      sock.write(
        "GET /socket.io/websocket?from=chart%2F&type=chart HTTP/1.1\r\n" +
          "Host: data.tradingview.com\r\n" +
          "Upgrade: websocket\r\n" +
          "Connection: Upgrade\r\n" +
          `Sec-WebSocket-Key: ${key}\r\n` +
          "Sec-WebSocket-Version: 13\r\n" +
          "Origin: https://www.tradingview.com\r\n\r\n",
      );
    });
    sock.once("close", () => tvCount(-1));
    const timer = setTimeout(() => {
      sock.destroy();
      reject(new Error("chart handshake"));
    }, 8000);
    let buf = Buffer.alloc(0);
    const onData = (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk]);
      const split = buf.indexOf("\r\n\r\n");
      if (split < 0) return;
      clearTimeout(timer);
      sock.off("data", onData);
      const rest = buf.subarray(split + 4);
      if (rest.length) sock.unshift(rest);
      resolve(sock);
    };
    sock.on("data", onData);
    sock.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function readText(sock: tls.TLSSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const texts: string[] = [];
    const timer = setTimeout(() => finish(), 8000);
    const finish = () => {
      clearTimeout(timer);
      sock.off("data", onData);
      resolve(texts.join("\n"));
    };
    const onData = (chunk: Buffer) => {
      buf = Buffer.concat([buf, chunk]);
      while (buf.length >= 2) {
        const opcode = buf[0] & 0x0f;
        let length = buf[1] & 0x7f;
        let offset = 2;
        if (length === 126) {
          if (buf.length < 4) return;
          length = buf.readUInt16BE(2);
          offset = 4;
        } else if (length === 127) {
          if (buf.length < 10) return;
          length = Number(buf.readBigUInt64BE(2));
          offset = 10;
        }
        if (buf.length < offset + length) return;
        const data = buf.subarray(offset, offset + length);
        buf = buf.subarray(offset + length);
        if (opcode === 1) {
          const text = data.toString("utf8");
          if (text.includes("~h~")) sock.write(frame("~m~4~m~~h~1"));
          texts.push(text);
          if (text.includes("series_completed")) {
            setTimeout(finish, 250);
          }
        } else if (opcode === 8) {
          finish();
          return;
        }
      }
    };
    sock.on("data", onData);
    sock.once("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function parseBars(blob: string, start: number): Candle[] {
  const rows = new Map<number, Candle>();
  const re = /"v":\[(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(blob))) {
    const t = Number(match[1]);
    if (!(t >= start)) continue;
    rows.set(t, {
      t,
      o: Number(match[2]),
      h: Number(match[3]),
      l: Number(match[4]),
      c: Number(match[5]),
      v: Number(match[6]) || 0,
    });
  }
  return [...rows.values()].sort((a, b) => a.t - b.t);
}

// WEEKEND FEED (Claude, 2026-10-02 5:25 PM PT): OANDA's BTC closes Friday 5 PM ET to Sunday 5 PM ET,
// but Kalshi BTC trades all weekend. When OANDA has no fresh bars, BTC reads Coinbase instead (same
// timeframe, same session anchor), so the desk never runs on a frozen price again.
export const BTC_WEEKEND = "COINBASE:BTCUSD";
const FALLBACK: Record<string, string> = { "OANDA:BTCUSD": BTC_WEEKEND, "KRAKEN:BTCUSD": BTC_WEEKEND }; // fix557 ONE FEED (Love Oct 30 2026 11:39 PM PT): TVC:GOLD never falls back to OANDA:XAUUSD
// Love, Oct 3 ~5:50 PM PT: "set the backup to vantage, coinbase was worst on the list for bands". Pepperstone -> Vantage,
// and only if Vantage is quiet too -> Coinbase.
// NO SILENT SWAP (Oct 16 ~10:25 PM PT, Love: no swap + "i want her on pepperstone"): PEPPERSTONE:BTCUSD (her BTC chart) has no
// backup here. Vantage sits ~$100 over Pepperstone, so a swap moved every band $100 for a moment and she judged the wrong side.
// A missed Pepperstone read keeps Pepperstone's own last bars and her feed-health guard holds entries until it ticks again.
export const feedNow: Record<string, string> = {};
// fix1018 PEPPERSTONE FIRST, VANTAGE ONLY ON A FREEZE (Love Nov 7 2026 9:58 PM PT: "yes pepperstone / vantage is ONLY used in the event pepperstones feed freezes for more than 10 seconds" + 9:55 PM: "she is supposed to deduct the
// difference from her chart and the kalshi price / that is a cornerstone"). Her BTC chart is PEPPERSTONE:BTCUSD - candles, session bands, pink, zones,
// Bollingers and the tick. Only when Pepperstone's own price has not UPDATED for more than 10 s (an update = a new price, or the exchange's own time moving on;
// a reconnect re-sending the same frozen price is NOT an update - Nov 6 10:25 PM it re-sent 75,931.48 every ~48 s for 95 minutes) while Vantage is updating
// does BTC read VANTAGE:BTCUSD, and the first real Pepperstone update puts her straight back. One feed at a time (fix557's intent): a switch means new lines
// from the new feed, never two feeds in one candle. Every switch, both ways, is written to data/feed-switch-1018.jsonl with the time and the stale seconds.
// btcSymbol1018() is the ONE place her BTC feed is picked (tv.ts candles, nav, pivotbooks, the quote stream, and rulebook1007's per-asset feed call it).
export const BTC_PRIMARY1018 = "PEPPERSTONE:BTCUSD";
export const BTC_FREEZE_BACKUP1018 = "VANTAGE:BTCUSD";
export const FREEZE_MS1018 = 10000;
type Side1018 = { at: number; c: number; ex: number; seenAt: number };
type Feed1018 = { live: string; since: number; watchAt: number; pep: Side1018; van: Side1018; gapVP: number; gapAt: number; shift: number; seq: number; last: Record<string, unknown> | null };
function f1018(): Feed1018 {
  return (TVG.__feed1018 ||= { live: BTC_PRIMARY1018, since: 0, watchAt: 0, pep: { at: 0, c: 0, ex: 0, seenAt: 0 }, van: { at: 0, c: 0, ex: 0, seenAt: 0 }, gapVP: 0, gapAt: 0, shift: 0, seq: 0, last: null });
}
/** fix1018: one row to data/feed-switch-1018.jsonl (server only; tv.ts is also bundled for the browser). */
export function feedSwitchLog1018(row: Record<string, unknown>) {
  if (typeof window !== "undefined") return;
  try {
    const line = JSON.stringify(row) + "\n"; const p = `${process.cwd()}/data/feed-switch-1018.jsonl`;
    const fs = (globalThis as any).process?.getBuiltinModule?.("node:fs");
    if (fs) fs.appendFileSync(p, line); else void import("node:fs").then((m) => m.appendFileSync(p, line)).catch(() => {});
  } catch {}
}
function switch1018(s: Feed1018, to: string, now: number, pepStaleMs: number, why: string) {
  const from = s.live;
  const px = (sym: string) => (sym === BTC_PRIMARY1018 ? s.pep.c : s.van.c);
  // the level between the two charts, from the last moment BOTH were updating (Pepperstone's frozen print is up to 10 s old at a freeze)
  const gap = s.gapAt > 0 ? s.gapVP : px(BTC_FREEZE_BACKUP1018) - px(BTC_PRIMARY1018);
  const delta = Math.round((to === BTC_FREEZE_BACKUP1018 ? gap : -gap) * 100) / 100;
  s.live = to; s.since = now; s.seq += 1; s.shift = Math.round((s.shift + delta) * 100) / 100;
  s.last = { at: new Date(now).toISOString(), from, to, staleS: Math.round(pepStaleMs / 100) / 10, fromPrice: px(from), toPrice: px(to), delta, seq: s.seq, why };
  feedNow.btc = to;
  feedSwitchLog1018(s.last);
}
/** fix1018: her BTC feed right now - PEPPERSTONE:BTCUSD unless Pepperstone has not updated for MORE than 10 s while Vantage is updating. */
export function btcSymbol1018(now = Date.now()): string {
  const s = f1018();
  if (!s.watchAt) return s.live; // nothing watched yet (a script, the browser): her primary
  const pepStale = now - Math.max(s.pep.at, s.watchAt);
  if (s.live === BTC_PRIMARY1018) {
    if (pepStale > FREEZE_MS1018 && s.van.at > 0 && now - s.van.at <= FREEZE_MS1018) switch1018(s, BTC_FREEZE_BACKUP1018, now, pepStale, "Pepperstone has not updated for more than 10 s - Vantage stands in");
  } else if (s.pep.at > s.since && now - s.pep.at <= FREEZE_MS1018) {
    switch1018(s, BTC_PRIMARY1018, now, now - s.since, "Pepperstone is updating again - back on her chart");
  }
  return s.live;
}
/** fix1018: a BTC price pushed by the quote stream (quotes.ts) for either chart. Returns the live feed after it. */
export function feedTick1018(sym: string, c: number, exMs = 0, now = Date.now()): string {
  const s = f1018();
  const side = sym === BTC_PRIMARY1018 ? s.pep : sym === BTC_FREEZE_BACKUP1018 ? s.van : null;
  if (!side || !(c > 0)) return btcSymbol1018(now);
  if (!s.watchAt) s.watchAt = now;
  if (c !== side.c || (exMs > 0 && exMs > side.ex)) side.at = now; // an UPDATE: a new price, or the exchange's time moved on
  side.c = c; if (exMs > 0) side.ex = Math.max(side.ex, exMs); side.seenAt = now;
  if (now - s.pep.at <= 2000 && now - s.van.at <= 2000 && s.pep.c > 0 && s.van.c > 0) { s.gapVP = Math.round((s.van.c - s.pep.c) * 100) / 100; s.gapAt = now; }
  return btcSymbol1018(now);
}
/** fix1018: the feed state for the desk (quote-stream.json), the fix519 offset and the proofs. */
export function btcFeed1018(now = Date.now()) {
  const live = btcSymbol1018(now); const s = f1018();
  return { live, since: s.since, seq: s.seq, shift: s.shift, gapVP: s.gapVP, gapAt: s.gapAt, pepStaleS: s.pep.at ? Math.round((now - s.pep.at) / 100) / 10 : null, vanStaleS: s.van.at ? Math.round((now - s.van.at) / 100) / 10 : null, last: s.last };
}
function staleBars(bars: Candle[], resolution: string): boolean {
  const last = bars[bars.length - 1];
  if (!last) return true;
  const step = (Number(resolution) || 5) * 60;
  return Date.now() / 1000 - last.t > Math.max(step * 3, 20 * 60);
}

// YOUNG SESSION (Oct 7, Love: "can we fix it now so everything is all aligned"): gold's session starts 17:00 ET but the
// market only reopens at 18:00 ET, and every chart used to need 8 bars of the new session before it loaded. Until then it
// served the previous session's last candles: the 15m chart (setups, spot) stayed frozen until ~4:45 PM PT and the 5m
// chart (her bands) until ~3:40 PM PT. Gold charts now load from the 2nd bar of the new session.
// BTC too (Oct 16 ~11:59 PM PT): INDEX's session resets at 00:00 UTC; with 8 bars required, the first 40 minutes served the OLD session's bars.
const minBars = (id: ChartId) => (id === "gold" || id === "gold5" || id === "btc" ? 2 : 8);
async function pull(id: ChartId, symbolOverride?: string): Promise<Candle[]> {
  const sym = symbolOverride || CHARTS[id].symbol;
  tvTally(`${sym}|chart:${id}`);
  if (metalSymbol(sym) && !metalsOpen(Date.now())) throw new Error(`${sym} closed - no read`); // chartCandles keeps its last bars
  return withTvSlot(true, () => pullNow(id, symbolOverride));
}
async function pullNow(id: ChartId, symbolOverride?: string): Promise<Candle[]> {
  const chart = CHARTS[id];
  const blob = await poolRequest(symbolOverride || chart.symbol, chart.resolution, chart.count);
  const candles = parseBars(blob, sessionStart(chart.session));
  if (candles.length < minBars(id)) throw new Error(`${chart.symbol} short`);
  return candles;
}

// Diagnostic (Claude): every bar the chart returns, no session filter. Used only by band-check.ts.
export async function chartRaw(symbol: string, resolution: string, count: number): Promise<Candle[]> {
  const key = `${symbol}|${resolution}`;
  const hit = rawMem().get(key);
  tvTally(key);
  // GOLD CLOSED = NO GOLD CHART READS (Oct 17 ~1:33 AM PT, Love: "yes both" - cut the chart traffic that still choked her price line): while
  // gold is closed (2-3 PM PT daily, Fri 2 PM - Sun 3 PM PT) gold/silver charts are served from the last bars read, never a new connection.
  if (metalSymbol(symbol) && !metalsOpen(Date.now())) return hit ? rawCut(hit.bars, count) : [];
  if (hit && hit.count >= count && Date.now() - hit.at < rawTtl(resolution, count)) return rawCut(hit.bars, count);
  const fly = rawFly().get(key);
  if (fly && fly.count >= count) return rawCut(await fly.p, count);
  const p = withTvSlot(count < 2000, () => chartRawNow(symbol, resolution, count));
  rawFly().set(key, { count, p });
  try {
    const bars = await p;
    if (bars.length) rawMem().set(key, { at: Date.now(), count, bars });
    // VWAP MATCH (Oct 16 ~10:40 PM PT, Love: "line them up with pepperstone 1:1"): keep a copy of her BTC chart's 1m bars on disk
    // (every 30 s at most) so the session-band anchor can be checked against her TradingView VWAP. Diagnostic only.
    if (typeof window === "undefined" && symbol === "VANTAGE:BTCUSD" && resolution === "1" && bars.length >= 600 && Date.now() - (TVG.__pepDumpAt || 0) > 30000) {
      TVG.__pepDumpAt = Date.now();
      void import("node:fs").then((fs) => fs.writeFileSync(`${process.cwd()}/data/van-1m.json`, JSON.stringify({ at: new Date().toISOString(), bars }))).catch(() => {});
    }
    return rawCut(bars, count);
  } finally {
    if (rawFly().get(key)?.p === p) rawFly().delete(key);
  }
}
// SOCKET POOL (Oct 19 ~10:56 PM PT, Love: "diagnose what's causing the price feed glitches on occasion and plug the leak"): every chart read used to
// open a FRESH TLS+websocket handshake and burn it (~85/min from one IP, the throttle that starves her live quote line - the Oct 16 handoff's own
// diagnosis). Reads now reuse a small pool of live sockets: a new chart session per request on an open pipe, the session deleted after, the socket
// retired after 40 requests or 90 s idle. Guards: each request's frames are filtered by its own session id (a reused pipe can never hand one symbol's
// bars to another); a reused socket that returns nothing is destroyed, not reused; idle sockets answer TradingView's pings so they stay alive.
type PoolSock = { sock: tls.TLSSocket; uses: number; busy: boolean; lastAt: number; authed: boolean; pinger: (c: Buffer) => void };
function tvPool(): PoolSock[] { return (TVG.__tvPool ||= []); }
const POOL_MAX_USES = 40;
const POOL_IDLE_MS = 90000;
function poolDrop(ps: PoolSock) {
  try { ps.sock.destroy(); } catch {}
  const pool = tvPool(); const i = pool.indexOf(ps); if (i >= 0) pool.splice(i, 1);
}
async function poolAcquire(): Promise<PoolSock> {
  const pool = tvPool();
  for (let i = pool.length - 1; i >= 0; i -= 1) {
    const x = pool[i];
    if (x.sock.destroyed || (!x.busy && Date.now() - x.lastAt > POOL_IDLE_MS)) poolDrop(x);
  }
  const idle = pool.find((x) => !x.busy && !x.sock.destroyed);
  if (idle) { idle.busy = true; idle.sock.off("data", idle.pinger); return idle; }
  const sock = await connect();
  const ps: PoolSock = { sock, uses: 0, busy: true, lastAt: Date.now(), authed: false, pinger: (chunk: Buffer) => { try { if (chunk.toString("utf8").includes("~h~")) sock.write(frame("~m~4~m~~h~1")); } catch {} } };
  pool.push(ps);
  return ps;
}
async function poolRequest(symbol: string, resolution: string, count: number): Promise<string> {
  const ps = await poolAcquire();
  const session = `cs_p_${Math.random().toString(36).slice(2, 9)}`;
  try {
    const spec = JSON.stringify({ symbol, adjustment: "splits", session: "regular" });
    const msgs: string[] = [];
    if (!ps.authed) { msgs.push(packet("set_auth_token", ["unauthorized_user_token"])); ps.authed = true; }
    msgs.push(packet("chart_create_session", [session, ""]), packet("resolve_symbol", [session, "sym_1", `=${spec}`]), packet("create_series", [session, "sds_1", "s1", "sym_1", resolution, count, ""]));
    for (const m of msgs) ps.sock.write(frame(m));
    const blob = await readText(ps.sock);
    try { ps.sock.write(frame(packet("chart_delete_session", [session]))); } catch {}
    ps.uses += 1; ps.lastAt = Date.now();
    const mine = blob.split("\n").filter((t) => t.includes(session) || !t.includes("cs_p_")).join("\n");
    const ok = mine.includes("series_completed") || /"v":\[/.test(mine);
    if (!ok && ps.uses > 1) { poolDrop(ps); return mine; } // a reused pipe that went quiet is never trusted twice
    ps.sock.removeAllListeners("error");
    ps.sock.once("error", () => poolDrop(ps));
    if (ps.uses >= POOL_MAX_USES || ps.sock.destroyed) poolDrop(ps);
    else { ps.busy = false; ps.sock.on("data", ps.pinger); }
    return mine;
  } catch (err) { poolDrop(ps); throw err; }
}
async function chartRawNow(symbol: string, resolution: string, count: number): Promise<Candle[]> {
  const blob = await poolRequest(symbol, resolution, count);
  return parseBars(blob, 0);
}

// Feed-flip log (server only; tv.ts is also bundled for the browser, so no top-level node:fs import).
function flipLog(row: Record<string, unknown>) {
  if (typeof window !== "undefined") return;
  void import("node:fs").then((fs) => fs.appendFileSync(`${process.cwd()}/data/feed-flips.jsonl`, JSON.stringify(row) + "\n")).catch(() => {});
}
export async function chartCandles(id: ChartId): Promise<{ candles: Candle[]; product: string }> {
  const chart = CHARTS[id];
  const hit = memory.get(id);
  // MAGLEV (Oct 14 ~7:20 AM PT, Love: "install the fastest rails you possibly can"): PAPER 24/7 read these candles through a
  // 15 s cache, so her live candle and price could be 15 s old before the scan even looked. BTC / gold now refresh every 3 s
  // (silver keeps 15 s), and two callers asking at once share one read instead of opening two sockets.
  // Oct 14 ~7:45 AM PT: 3 s on all three tripled TradingView's refused reads (and twice swapped BTC to the backup feed),
  // so: BTC bars 4 s, gold's 15m bars 6 s (gold's live price comes from the 1m nav read anyway), band bars stay 15 s.
  const ttl = id === "btc" ? 4000 : id === "gold" ? 6000 : 15000;
  const sym18 = id === "btc" ? btcSymbol1018() : chart.symbol; // fix1018 her BTC feed now (Pepperstone; Vantage only on a 10 s+ freeze)
  const same18 = !!hit && (hit.product || chart.symbol) === sym18; // fix1018: bars from the feed she just left are never served - a switch means new lines
  if (hit && same18 && Date.now() - hit.at < ttl) return { candles: hit.candles, product: hit.product || chart.symbol }; // fix1018 same feed only
  const fl = inflightCharts.get(id + "|" + sym18); // fix1018 one read per feed
  const kick = () => {
    const k18 = id + "|" + sym18; // fix1018 one read per feed
    if (inflightCharts.get(k18)) return inflightCharts.get(k18)!;
    const run = chartCandlesNow(id, memory.get(id), sym18).finally(() => inflightCharts.delete(k18));
    inflightCharts.set(k18, run);
    return run;
  };
  // Bars under 20 s old come back at once while the fresh read runs in the background (BTC / gold only).
  if ((id === "btc" || id === "gold") && hit && same18 && Date.now() - hit.at < 20000) { // fix1018 same feed only
    void kick().catch(() => {});
    return { candles: hit.candles, product: hit.product || chart.symbol };
  }
  if (fl) return fl;
  return kick();
}
const inflightCharts = new Map<string, Promise<{ candles: Candle[]; product: string }>>(); // fix1018 keyed id|feed
async function chartCandlesNow(id: ChartId, hit: { at: number; candles: Candle[]; product?: string } | undefined, sym18: string = CHARTS[id].symbol): Promise<{ candles: Candle[]; product: string }> { // fix1018 the live feed's symbol
  const chart = CHARTS[id];
  try {
    let candles: Candle[] = [];
    let product: string = sym18; // fix1018
    try {
      candles = await pull(id, sym18); // fix1018
    } catch {
      candles = [];
    }
    const alt = FALLBACK[sym18]; // fix1018
    // NO FEED FLICKER (Claude, Oct 9 ~1 PM PT, Love: "every time it doesn't go thru its the one that wins... can we remedy
    // that"): one missed Pepperstone read used to swap BTC to the backup feed (Vantage) for a single refresh, and the backup's
    // session VWAP sits ~$50 higher with a wider sigma (82,456 / 480 vs 82,406 / 425, caught live at 12:56 PM PT). Every
    // band jumped for ~10 s, 26 times today, and the live gates held trades on lines that aren't on her chart. Now a single
    // failed read keeps her own feed's last good bars (up to 90 s old); the backup only takes over if her feed is really out.
    const primaryBad = candles.length < minBars(id) || staleBars(candles, chart.resolution);
    if (alt && primaryBad && hit && (hit.product || chart.symbol) === sym18 && Date.now() - hit.at < 90000) { // fix1018
      flipLog({ at: new Date().toISOString(), id, kept: sym18, ageMs: Date.now() - hit.at }); // fix1018
      return { candles: hit.candles, product: sym18 }; // fix1018
    }
    if (alt && primaryBad) {
      candles = await pull(id, alt).catch(() => [] as Candle[]);
      product = alt;
      const alt2 = FALLBACK[alt];
      if (alt2 && alt2 !== alt && (candles.length < minBars(id) || staleBars(candles, chart.resolution))) {
        candles = await pull(id, alt2);
        product = alt2;
      }
    }
    if (candles.length < minBars(id)) throw new Error(`${chart.symbol} short`);
    feedNow[id] = product;
    if (product !== sym18) { // fix1018 (a fix1018 freeze switch is logged in feed-switch-1018.jsonl)
      flipLog({ at: new Date().toISOString(), id, backup: product });
    }
    memory.set(id, { at: Date.now(), candles, product });
    return { candles, product };
  } catch (err) {
    if (hit) return { candles: hit.candles, product: hit.product || chart.symbol }; // fix1018 her last bars keep their own feed's name
    throw err;
  }
}

export async function chartQuote(symbol: string): Promise<number> {
  const res = await fetch(`https://scanner.tradingview.com/symbol?symbol=${encodeURIComponent(symbol)}&fields=close`, {
    headers: { Accept: "application/json", Origin: "https://www.tradingview.com" },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error("quote");
  const body = (await res.json()) as { close?: number };
  const close = Number(body.close);
  if (!(close > 0)) throw new Error("quote");
  return close;
}
