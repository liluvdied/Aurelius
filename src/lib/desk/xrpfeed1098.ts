// fix1098 XRP ON HER BINANCE CHART (Love Nov 13 2026 9:55 PM PT: "yes, we need to put her on the binance.us chart coinbase freezes very often" + 10:00 PM PT, on the picture labelled "XRPUSDT • BINANCE":
// "sorry yes, the chart i sent you, i was reading tetherUS and mistaking it for binance.us"). ONE place hands out her XRP candles and her live XRP price, from the TradingView chart BINANCE:XRPUSDT:
//   candles: 1m bars of that chart through her own chart reader (chartRaw in tv.ts), refreshed every 5 s at most (the pace her Coinbase read had), 2 days kept, the forming minute included.
//   live price: its own TradingView quote line (the same kind of line her BTC and gold prices come on, a separate connection so theirs is not touched) - every tick pushed, no polling.
// Each lane's own candle memory keeps filling (other parts of her read it there). If that chart gives her no usable candles (fewer than 600, or the newest older than 150 s) each XRP lane reads Coinbase exactly as it did before, candles and price together (never one chart's candles
// with the other's price), and every change of chart is written to data/xrp-feed-1098.jsonl. Not changed: her read, her push size, her walls, her orders.
import * as tls from "node:tls";
import * as crypto from "node:crypto";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { chartRaw } from "./tv";

export const XRP_CHART_1098 = "BINANCE:XRPUSDT";
export const XRP_MIN_BARS_1098 = 600, XRP_BAR_MAX_AGE_S_1098 = 150, XRP_TICK_FRESH_MS_1098 = 2000;
type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
type Tick = { c: number; at: number; ex?: number };
type Target = { host: string; port: number; rejectUnauthorized?: boolean };
const G = globalThis as any;
const VER = 1; // bump on any change to the stream: the globalThis guards outlive module reloads
const D = (file: string) => join(process.cwd(), "data", file);
function feedNote(row: Record<string, unknown>) { try { appendFileSync(D("xrp-feed-1098.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...row }) + "\n"); } catch {} }

function frame(text: string): Buffer {
  const data = Buffer.from(text);
  const mask = crypto.randomBytes(4);
  const head = Buffer.alloc(data.length < 126 ? 2 : 4);
  head[0] = 0x81;
  if (data.length < 126) head[1] = 0x80 | data.length;
  else { head[1] = 0x80 | 126; head.writeUInt16BE(data.length, 2); }
  const masked = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 1) masked[i] = data[i] ^ mask[i % 4];
  return Buffer.concat([head, mask, masked]);
}
function packet(method: string, params: unknown[]): string {
  const body = JSON.stringify({ m: method, p: params });
  return `~m~${body.length}~m~${body}`;
}
/** pure: the prices for one chart symbol inside one TradingView quote message (her quotes.ts reading, for one symbol) */
export function quoteParts1098(text: string, sym = XRP_CHART_1098): { c: number; ex?: number }[] {
  const out: { c: number; ex?: number }[] = [];
  for (const part of text.split(/~m~\d+~m~/)) {
    if (!part || !part.includes('"qsd"')) continue;
    try {
      const msg = JSON.parse(part);
      if (msg.m !== "qsd") continue;
      const d = msg.p?.[1];
      if (String(d?.n) !== sym) continue;
      const lp = Number(d?.v?.lp), lpt = Number(d?.v?.lp_time);
      if (Number.isFinite(lp) && lp > 0) out.push({ c: lp, ...(Number.isFinite(lpt) && lpt > 0 ? { ex: lpt * 1000 } : {}) });
    } catch {}
  }
  return out;
}
function connectXrp1098(target: Target) {
  const S = G.__xrpStream1098;
  const sock = tls.connect(target.port, target.host, { servername: target.host, ...(target.rejectUnauthorized === false ? { rejectUnauthorized: false } : {}) }, () => {
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
  let shook = false, dead = false;
  let buf = Buffer.alloc(0);
  const die = (why: string) => {
    if (dead) return; dead = true;
    try { sock.destroy(); } catch {}
    if (S.sock === sock) S.sock = null;
    if (G.__xrpStream1098 !== S) return; // a newer version of this file owns the line now
    S.err = why;
    const wait = Math.min(S.backoff || 2000, 30000);
    S.backoff = wait * 2;
    setTimeout(() => { if (G.__xrpStream1098 === S && !S.sock) connectXrp1098(target); }, wait).unref?.();
  };
  sock.once("error", (e) => die(`socket error: ${String(e).slice(0, 120)}`));
  sock.once("close", () => die("socket closed"));
  sock.setTimeout(40000, () => die("socket timeout"));
  sock.on("data", (chunk: Buffer) => {
    if (!shook) {
      buf = Buffer.concat([buf, chunk]);
      const split = buf.indexOf("\r\n\r\n");
      if (split < 0) return;
      shook = true;
      S.sock = sock; S.backoff = 2000; S.err = ""; S.connectedAt = Date.now();
      const qs = `qs_${crypto.randomBytes(4).toString("hex")}`;
      sock.write(frame(packet("set_auth_token", [String(G.__tvAuth?.tok || "unauthorized_user_token")])));
      sock.write(frame(packet("quote_create_session", [qs])));
      sock.write(frame(packet("quote_set_fields", [qs, "lp", "lp_time"])));
      sock.write(frame(packet("quote_add_symbols", [qs, XRP_CHART_1098])));
      buf = buf.subarray(split + 4);
      chunk = Buffer.alloc(0);
    }
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const opcode = buf[0] & 0x0f;
      let length = buf[1] & 0x7f;
      let offset = 2;
      if (length === 126) { if (buf.length < 4) return; length = buf.readUInt16BE(2); offset = 4; }
      else if (length === 127) { if (buf.length < 10) return; length = Number(buf.readBigUInt64BE(2)); offset = 10; }
      if (buf.length < offset + length) return;
      const data = buf.subarray(offset, offset + length);
      buf = buf.subarray(offset + length);
      if (opcode === 8) { die("server close frame"); return; }
      if (opcode !== 1) continue;
      const text = data.toString("utf8");
      for (const part of text.split(/~m~\d+~m~/)) { if (/^~h~\d+$/.test(part)) { try { sock.write(frame(`~m~${part.length}~m~${part}`)); } catch {} } }
      if (G.__xrpStream1098 !== S) { try { sock.destroy(); } catch {} return; }
      for (const q of quoteParts1098(text)) { const now = Date.now(); S.tick = { c: q.c, at: now, ...(q.ex ? { ex: q.ex } : {}) } as Tick; S.lastTick = now; }
    }
  });
}
/** her XRP quote line: one connection, reconnects itself (2 s, doubling to 30 s), recycled if 45 s pass without a tick */
export function ensureXrpStream1098(target: Target = { host: "data.tradingview.com", port: 443 }) {
  const old = G.__xrpStream1098;
  if (old && old.ver === VER) return;
  if (old) { try { clearInterval(old.timer); } catch {} try { old.sock?.destroy(); } catch {} }
  const S: any = (G.__xrpStream1098 = { ver: VER, sock: null, backoff: 2000, tick: null, lastTick: 0, connectedAt: 0, err: "" });
  connectXrp1098(target);
  S.timer = setInterval(() => {
    if (G.__xrpStream1098 !== S) { try { clearInterval(S.timer); } catch {} return; }
    const since = Date.now() - (S.lastTick || S.connectedAt || Date.now());
    if (S.sock && since > 45000) { S.err = `no XRP tick for ${Math.round(since / 1000)} s: recycling the connection`; try { S.sock.destroy(); } catch {} }
  }, 8000);
  try { S.timer.unref?.(); } catch {}
}
/** newest pushed price on her Binance XRP chart, with when it arrived. Null until the line has ticked. */
export function xrpTick1098(): Tick | null {
  ensureXrpStream1098();
  const t = G.__xrpStream1098?.tick as Tick | null;
  return t && t.c > 0 ? t : null;
}
/** pure: is this bar a whole, sane 1m candle */
export function barOk1098(b: any): b is Bar {
  return !!b && Number.isInteger(b.t) && b.t % 60 === 0 && [b.o, b.h, b.l, b.c, b.v].every(Number.isFinite) && b.l > 0 && b.v >= 0 && b.l <= Math.min(b.o, b.c) && b.h >= Math.max(b.o, b.c);
}
/** pure: are these candles usable as her XRP chart right now */
export function barsUsable1098(bars: Bar[], nowMs: number): boolean {
  const last = bars[bars.length - 1];
  return bars.length >= XRP_MIN_BARS_1098 && !!last && nowMs / 1000 - last.t <= XRP_BAR_MAX_AGE_S_1098;
}
/** Her XRP candles off BINANCE:XRPUSDT, or null when that chart is not usable right now (the lane then reads Coinbase as before). */
export async function xrpChartBars1098(read: (symbol: string, resolution: string, count: number) => Promise<any[]> = chartRaw as any): Promise<Bar[] | null> {
  ensureXrpStream1098();
  const B = (G.__xrpBars1098 ||= { at: 0, m: new Map<number, Bar>(), ok: false, fly: null as Promise<Bar[] | null> | null, src: "" });
  const sorted = () => [...B.m.values()].sort((a: Bar, b: Bar) => a.t - b.t) as Bar[];
  if (Date.now() - B.at < (B.ok ? 5000 : B.wait || 5000)) return B.ok ? sorted() : null; // a chart that answered nothing is asked again after 60 s, a stale one after 15 s (an unanswered read holds one of her 4 chart connections for 8 s)
  if (B.fly) return B.fly;
  B.fly = (async () => {
    try {
      let newest = 0; for (const t of B.m.keys()) if (t > newest) newest = t;
      const whole = B.m.size < XRP_MIN_BARS_1098 || Date.now() / 1000 - newest > 240; // first read, or a gap: read the whole chart again so no minute is missing
      const got = await read(XRP_CHART_1098, "1", whole ? 1500 : 5).catch(() => [] as any[]);
      B.wait = Array.isArray(got) && got.length ? 15000 : 60000;
      for (const b of Array.isArray(got) ? got : []) if (barOk1098(b)) B.m.set(b.t, { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v });
      const now = Date.now();
      for (const t of [...B.m.keys()]) if (t < now / 1000 - 2 * 86400) B.m.delete(t);
      const s = sorted();
      B.ok = barsUsable1098(s, now); B.at = now;
      const src = B.ok ? XRP_CHART_1098 : "COINBASE:XRPUSD";
      if (src !== B.src) { feedNote({ chart: src, was: B.src || null, bars: s.length, newestAgeS: s.length ? Math.round(now / 1000 - s[s.length - 1].t) : null, by: "fix1098" }); B.src = src; }
      return B.ok ? s : null;
    } catch { B.ok = false; B.wait = 60000; B.at = Date.now(); return null; }
    finally { B.fly = null; }
  })();
  return B.fly;
}
/** One XRP lane's candles: off her Binance chart, written into that lane's own memory (B.m / B.at - other parts of her read it there, her push test for one) exactly where its Coinbase candles sat.
 * Null when the chart is not usable: the lane's memory is then emptied ONCE, so its Coinbase read starts whole and the two charts' candles are never mixed. */
export async function xrpLaneBars1098(B: any, read?: (symbol: string, resolution: string, count: number) => Promise<any[]>): Promise<Bar[] | null> {
  const b = await (read ? xrpChartBars1098(read) : xrpChartBars1098());
  if (b) {
    const at = Number(G.__xrpBars1098?.at) || Date.now();
    if (B.chart1098 !== at) { B.m = new Map(b.map((x) => [x.t, { ...x }])); B.chart1098 = at; }
    B.at = Date.now();
    return b;
  }
  if (B.chart1098) { B.m = new Map(); B.at = 0; B.chart1098 = 0; }
  return null;
}
/** Is her XRP on the Binance chart right now (its candles were usable at the last read, within 15 s)? */
export function xrpOnChart1098(nowMs = Date.now()): boolean { const B = G.__xrpBars1098; return !!B && B.ok === true && nowMs - B.at < 15000; }
/** Her live XRP trade price, in the shape her last-line check reads ({ price, time }): the Binance chart's newest pushed tick while she is on that chart, the Coinbase trade (as before) when she is not. */
export async function xrpWireTick1098(timeoutMs = 2000): Promise<{ price: number; time: string; src: string } | null> {
  if (xrpOnChart1098()) { const t = xrpTick1098(); return t ? { price: t.c, time: new Date(t.at).toISOString(), src: XRP_CHART_1098 } : null; }
  const tick = await fetch("https://api.exchange.coinbase.com/products/XRP-USD/ticker", { signal: AbortSignal.timeout(timeoutMs) })
    .then((response) => response.ok ? response.json() : null).catch(() => null);
  return tick ? { price: Number(tick.price), time: String(tick.time ?? ""), src: "COINBASE:XRPUSD" } : null;
}
