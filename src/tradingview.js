// Live 1m bars from TradingView's public chart socket, one symbol per asset. Fresh client, nothing reused.
// Keeps the last ~1,800 1m bars per symbol (covers a whole session) and the time of the last update (the price's age).
import WebSocket from "ws";

const URL = "wss://data.tradingview.com/socket.io/websocket";
const frame = (obj) => { const s = JSON.stringify(obj); return `~m~${s.length}~m~${s}`; };
const unframe = (raw) => {
  const out = []; let i = 0;
  while (i < raw.length) {
    const m = /^~m~(\d+)~m~/.exec(raw.slice(i)); if (!m) break;
    const start = i + m[0].length, len = Number(m[1]); out.push(raw.slice(start, start + len)); i = start + len;
  }
  return out;
};
const rid = (p) => p + Math.random().toString(36).slice(2, 12);

export class ChartFeed {
  constructor(symbol, { bars = 1800 } = {}) {
    this.symbol = symbol; this.want = bars; this.bars = new Map(); this.updatedAt = 0; this.status = "starting";
    this.connect();
  }
  connect() {
    const ws = new WebSocket(URL, { headers: { Origin: "https://www.tradingview.com" } });
    this.ws = ws;
    const cs = rid("cs_");
    const send = (m, p) => ws.readyState === 1 && ws.send(frame({ m, p }));
    ws.on("open", () => {
      this.status = "open";
      send("set_auth_token", ["unauthorized_user_token"]);
      send("chart_create_session", [cs, ""]);
      send("resolve_symbol", [cs, "sym_1", "=" + JSON.stringify({ symbol: this.symbol, adjustment: "splits" })]);
      send("create_series", [cs, "s1", "s1", "sym_1", "1", this.want, ""]);
    });
    ws.on("message", (buf) => {
      for (const msg of unframe(buf.toString())) {
        if (msg.startsWith("~h~")) { ws.send(`~m~${msg.length}~m~${msg}`); continue; } // heartbeat echo
        let j; try { j = JSON.parse(msg); } catch { continue; }
        if (j.m === "timescale_update" || j.m === "du") {
          const s = j.p?.[1]?.s1?.s;
          if (Array.isArray(s)) {
            for (const r of s) { const [t, o, h, l, c, v] = r.v; this.bars.set(t * 1000, { t: t * 1000, o, h, l, c, v: v || 0 }); }
            this.updatedAt = Date.now();
            if (this.bars.size > this.want + 50) { const keys = [...this.bars.keys()].sort((a, b) => a - b); for (const k of keys.slice(0, this.bars.size - this.want)) this.bars.delete(k); }
          }
        } else if (j.m === "symbol_error" || j.m === "critical_error" || j.m === "series_error") {
          this.status = `error: ${JSON.stringify(j.p).slice(0, 200)}`;
        }
      }
    });
    const retry = (why) => { this.status = `reconnecting (${why})`; setTimeout(() => this.connect(), 3000); };
    ws.on("close", () => retry("closed"));
    ws.on("error", (e) => { this.status = `error: ${e.message}`; try { ws.close(); } catch {} });
  }
  /** Sorted 1m bars, the live (unfinished) one last. */
  list() { return [...this.bars.values()].sort((a, b) => a.t - b.t); }
  /** {price, ageSec} from the newest bar. */
  price() {
    const b = this.list().pop();
    return b ? { price: b.c, ageSec: (Date.now() - this.updatedAt) / 1000 } : null;
  }
}
