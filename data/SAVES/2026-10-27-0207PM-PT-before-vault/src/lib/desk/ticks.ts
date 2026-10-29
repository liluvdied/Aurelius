// LIVE TICKS for the tape (Claude, Oct 4 ~1:10 AM PT, Love: "the ball barely moves at all, id like it to go up and down
// like kalshi's... no flat lines on it ever"). The desk's own BTC quote is a cached chart candle (refreshed every ~15 s),
// so the tape had nothing to move on between refreshes. This opens Coinbase's public ticker stream IN THE BROWSER
// (BTC-USD, and PAXG-USD as gold's motion) and hands the tape every trade print. The tape keeps her feed's LEVEL
// (Pepperstone / OANDA) and only borrows the MOTION: shown = desk price + (latest tick - tick when that desk price came in).
type Listener = (px: number) => void;
const PRODUCTS: Record<string, string> = { btc: "BTC-USD", gold: "PAXG-USD" };
const last: Record<string, number> = {};
const listeners: Record<string, Set<Listener>> = {};
let ws: WebSocket | null = null;
let opening = false;
let retry = 0;
let poll: ReturnType<typeof setInterval> | null = null;

function emit(asset: string, px: number) {
  if (!(px > 0)) return;
  last[asset] = px;
  listeners[asset]?.forEach((fn) => fn(px));
}

function startPoll() {
  if (poll || typeof window === "undefined") return;
  poll = setInterval(() => {
    for (const [asset, product] of Object.entries(PRODUCTS)) {
      if (!listeners[asset]?.size) continue;
      fetch(`https://api.exchange.coinbase.com/products/${product}/ticker`)
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => b && emit(asset, Number(b.price)))
        .catch(() => {});
    }
  }, 1000);
}

function open() {
  if (typeof window === "undefined" || ws || opening) return;
  opening = true;
  try {
    const sock = new WebSocket("wss://ws-feed.exchange.coinbase.com");
    ws = sock;
    sock.onopen = () => {
      opening = false;
      retry = 0;
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
      sock.send(JSON.stringify({ type: "subscribe", product_ids: Object.values(PRODUCTS), channels: ["ticker"] }));
    };
    sock.onmessage = (ev) => {
      try {
        const m = JSON.parse(String(ev.data)) as { type?: string; product_id?: string; price?: string };
        if (m.type !== "ticker" || !m.product_id) return;
        const asset = Object.keys(PRODUCTS).find((k) => PRODUCTS[k] === m.product_id);
        if (asset) emit(asset, Number(m.price));
      } catch {
        // ignore a bad frame
      }
    };
    const down = () => {
      opening = false;
      ws = null;
      startPoll();
      retry = Math.min(30000, (retry || 1000) * 2);
      setTimeout(() => {
        if (Object.values(listeners).some((s) => s.size)) open();
      }, retry);
    };
    sock.onclose = down;
    sock.onerror = () => sock.close();
  } catch {
    opening = false;
    ws = null;
    startPoll();
  }
}

/** Subscribe to live prints for an asset (btc / gold). Returns an unsubscribe. */
export function onTick(asset: string, fn: Listener): () => void {
  if (!PRODUCTS[asset]) return () => {};
  (listeners[asset] ??= new Set()).add(fn);
  open();
  if (last[asset]) fn(last[asset]);
  return () => {
    listeners[asset]?.delete(fn);
  };
}
