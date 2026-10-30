// Server only. OWN CLOSE LANE (Oct 16 ~3:55 AM PT, Love: "the close buttons... it's closing at the old speed again, pls get her to close at
// market when i click again, no latency pls"). Her click took 2.3 s to REACH the server (recvMs) while the sell itself took
// 0.4 s: the page keeps ~70 polling requests going, and the browser lets only 6 run per server at once, so a close waited in
// line behind them. The close button now goes to its own little door (port 8091, its own line in the browser), straight to
// this same market close. If that door can't be reached, the old path is used.
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { ensureEngine } from "./engine";

const closeLocks: Map<string, Promise<any>> = ((globalThis as any).__closeLocks ||= new Map());
async function withCloseLock<T>(ticker: string, run: () => Promise<T>): Promise<T> {
  const inFlight = closeLocks.get(ticker);
  if (inFlight) return inFlight as Promise<T>;
  const p = run().finally(() => closeLocks.delete(ticker));
  closeLocks.set(ticker, p);
  return p;
}

export async function closeTicker(ticker: string, clickAt?: number, tapAt?: number): Promise<{ line: string }> {
  const recvMs = Number(clickAt) > 0 ? Date.now() - Number(clickAt) : null;
  // tapMs = her finger to the button's code running (the page's own delay); recvMs = that code to the server
  const tapMs = Number(tapAt) > 0 && Number(clickAt) > 0 ? Number(clickAt) - Number(tapAt) : null;
  ensureEngine();
  const live = await import("./kalshi-live.server");
  const data = { ticker };
  return withCloseLock(ticker, async () => {
      // FAST CLOSE (Oct 14): one ticker = sell it now (no full position list first). Timing kept in data/close-timing.jsonl.
      const tC = Date.now();
      const payout = await live.flattenTicker(data.ticker, true);
      try { appendFileSync(join(process.cwd(), "data", "close-timing.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker: data.ticker, ms: Date.now() - tC, recvMs, tapMs, payout }) + "\n"); } catch {}
      const note = live.closeResult(data.ticker);
      const name = data.ticker.includes("BTC") ? "BTC" : data.ticker.includes("GOLD") ? "GOLD" : data.ticker.includes("ETH") ? "ETH" : data.ticker.includes("SOL") ? "SOL" : "SILVER";
      if (!(payout != null && payout > 0)) {
        // Oct 15 (Love): extra clicks after a successful close used to answer "didn't sell" and read as a failed close.
        try { const still = (await live.heldFifteens()).some((r) => r.ticker === data.ticker); if (!still) return { line: `${name} is closed - nothing left to sell.` }; } catch {}
        return { line: `${name} didn't sell. Press close again.` };
      }
      const profit = note && typeof note.profit === "number" ? note.profit : null;
      if (profit == null) return { line: `${name} closed. $${payout.toFixed(2)} back.` };
      const sign = profit > 0.005 ? "+" : profit < -0.005 ? "−" : "";
      return { line: `${name} closed ${sign}$${Math.abs(profit).toFixed(2)}.` };
  });
}
// 25% / 50% ON THE EXPRESS LANE + THE CLOSE PAD (Oct 17 ~3:00 PM PT, Love: "the close buttons keep lagging for 10 seconds and don't even
// register a click i just closed 3/4 of my position trying to close 25%"). Her 25% taps went through the page's slow line (and three taps = three
// sells); the desk page itself also froze 2-10 s at times before a tap even ran (close-timing tapMs). Now: /part on this lane, and /pad = a tiny
// page of just her open positions and CLOSE / 25% / 50%, which never freezes with the desk.
export async function partTicker(ticker: string, pct: number, clickAt?: number): Promise<{ ok: boolean; line: string }> {
  const recvMs = Number(clickAt) > 0 ? Date.now() - Number(clickAt) : null;
  ensureEngine();
  const live = await import("./kalshi-live.server");
  return withCloseLock(ticker, async () => {
    const tC = Date.now();
    const out = await live.partLive(ticker, pct);
    try { appendFileSync(join(process.cwd(), "data", "close-timing.jsonl"), JSON.stringify({ at: new Date().toISOString(), ticker, kind: `part${Math.round(pct)}`, ms: Date.now() - tC, recvMs, filled: out?.filled ?? null }) + "\n"); } catch {}
    return out ? { ok: true, line: `Sold ${Math.round(pct)}%: ${out.filled} contracts for $${out.payout.toFixed(2)}. ${out.left} left.` } : { ok: false, line: `Couldn't sell ${Math.round(pct)}% right now. Press it again.` };
  });
}
async function padHeld(): Promise<any[]> {
  const live = await import("./kalshi-live.server");
  const { fetchMarket } = await import("./kalshi");
  const rows = await live.heldFifteens();
  return Promise.all(rows.map(async (r: any) => {
    let bid = 0;
    try { const m: any = await fetchMarket(r.ticker); bid = r.pos > 0 ? Number(m?.yesBid) || 0 : Number(m?.noBid) || 0; } catch {}
    const qty = Math.abs(Number(r.pos)), value = Math.round(qty * bid * 100) / 100;
    return { ticker: r.ticker, name: /BTC/.test(r.ticker) ? "BTC" : /GOLD/.test(r.ticker) ? "GOLD" : r.ticker.split("15M")[0].replace("KX", ""), side: r.pos > 0 ? "UP" : "DOWN", qty: Math.round(qty * 100) / 100, cost: Math.round(Number(r.cost) * 100) / 100, bid, value, pnl: Math.round((value - Number(r.cost)) * 100) / 100 };
  }));
}
const PAD_HTML = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Close Pad</title>
<style>body{margin:0;background:#000;color:#fff;font:14px -apple-system,system-ui,sans-serif;padding:16px}h1{font-size:12px;letter-spacing:.3em;color:#ffffffb0;margin:0 0 12px}
.row{border:1px solid #ffffff40;border-radius:12px;padding:12px;margin-bottom:12px}.top{display:flex;justify-content:space-between;margin-bottom:10px;font-variant-numeric:tabular-nums}
.b{display:flex;gap:8px}button{flex:1;padding:16px 0;border-radius:10px;border:1px solid #fff6;background:#111;color:#fff;font-size:15px;font-weight:600;touch-action:manipulation}
button.c{border-color:#ff5c5c;color:#ff5c5c}button:disabled{opacity:.35}#msg{min-height:20px;color:#3ddc84;margin-bottom:12px;font-size:13px}.up{color:#3ddc84}.dn{color:#ff5c5c}.mute{color:#ffffff80}</style></head>
<body><h1>CLOSE PAD</h1><div id="msg"></div><div id="list" class="mute">loading…</div><script>
let busy={};const L=document.getElementById('list'),M=document.getElementById('msg');
function say(t){M.textContent=t;}
function draw(rows){if(!rows.length){L.innerHTML='<div class="mute">No open positions.</div>';return;}
L.innerHTML=rows.map(r=>'<div class="row"><div class="top"><b>'+r.name+' '+r.side+'</b><span>'+r.qty+' @ '+(r.bid*100).toFixed(0)+'c · $'+r.value.toFixed(2)+' <span class="'+(r.pnl>=0?'up':'dn')+'">'+(r.pnl>=0?'+':'−')+'$'+Math.abs(r.pnl).toFixed(2)+'</span></span></div><div class="b">'+
['25','50'].map(p=>'<button '+(busy[r.ticker]?'disabled':'')+' data-t="'+r.ticker+'" data-p="'+p+'">'+(busy[r.ticker]===p?'SELLING…':p+'%')+'</button>').join('')+
'<button class="c" '+(busy[r.ticker]?'disabled':'')+' data-t="'+r.ticker+'" data-p="close">'+(busy[r.ticker]==='close'?'CLOSING…':'CLOSE')+'</button></div></div>').join('');}
let last=[];async function load(){try{const r=await fetch('/held');last=await r.json();draw(last);}catch(e){}}
L.addEventListener('pointerdown',async e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const t=b.dataset.t,p=b.dataset.p;if(busy[t])return;busy[t]=p;draw(last);say(p==='close'?'Closing…':'Selling '+p+'%…');
try{const r=await fetch(p==='close'?'/close':'/part',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({ticker:t,pct:Number(p)||0,clickAt:Date.now()})});const j=await r.json();say(j.line||'Done.');}catch(e){say('Did not send - press it again.');}
delete busy[t];load();});
load();setInterval(load,2000);</script></body></html>`;
function laneHandler(req: any, res: any) {
  const G = globalThis as any;
      const head = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };
      if (req.method === "OPTIONS") { res.writeHead(204, head); res.end(); return; }
      const url = String(req.url || "");
      if (req.method === "GET" && (url === "/" || url.startsWith("/pad"))) { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); res.end(PAD_HTML); return; }
      if (req.method === "GET" && url.startsWith("/held")) { void padHeld().then((rows) => { res.writeHead(200, head); res.end(JSON.stringify(rows)); }).catch(() => { res.writeHead(200, head); res.end("[]"); }); return; }
      if (req.method === "POST" && url.startsWith("/part")) {
        let pb = "";
        req.on("data", (c: any) => { pb += c; if (pb.length > 4096) req.destroy(); });
        req.on("end", async () => {
          try {
            const d = JSON.parse(pb || "{}"); const t = String(d.ticker || ""), pct = Number(d.pct);
            if (!/^KX[A-Z0-9]+15M-[0-9A-Z-]+$/.test(t) || !(pct > 0 && pct < 100)) { res.writeHead(400, head); res.end(JSON.stringify({ ok: false, line: "Didn't send. Press it again." })); return; }
            const out = await G.__partFn(t, pct, Number(d.clickAt) || 0);
            res.writeHead(200, head); res.end(JSON.stringify(out));
          } catch { res.writeHead(500, head); res.end(JSON.stringify({ ok: false, line: "Didn't send. Press it again." })); }
        });
        return;
      }
      if (req.method !== "POST" || !url.startsWith("/close")) { res.writeHead(404, head); res.end("{}"); return; }
      let b = "";
      req.on("data", (c: any) => { b += c; if (b.length > 4096) req.destroy(); });
      req.on("end", async () => {
        try {
          const d = JSON.parse(b || "{}");
          const t = String(d.ticker || "");
          if (!/^KX[A-Z0-9]+15M-[0-9A-Z-]+$/.test(t)) { res.writeHead(400, head); res.end(JSON.stringify({ line: "Close didn't send. Press it again." })); return; }
          const out = await G.__closeFn(t, Number(d.clickAt) || 0, Number(d.tapAt) || 0);
          res.writeHead(200, head); res.end(JSON.stringify(out));
        } catch { res.writeHead(500, head); res.end(JSON.stringify({ line: "Close didn't send. Press it again." })); }
      });
}
export async function startCloseLane() {
  const G = globalThis as any;
  G.__closeFn = closeTicker;
  G.__partFn = partTicker;
  G.__laneHandler = laneHandler; // hot-swappable: the server always calls the newest handler
  if (G.__closeLaneV === 2) return;
  G.__closeLaneV = 2;
  try {
    const http = await import("node:http");
    // The v1 server (Oct 16) kept its own handler; close it so v2 (with /part and /pad) can take port 8091.
    try { for (const h of (process as any)._getActiveHandles?.() ?? []) if (h instanceof http.Server && (h.address?.() as any)?.port === 8091) h.close(); } catch {}
    const listen = (n: number) => {
      const srv = http.createServer((req: any, res: any) => G.__laneHandler(req, res));
      srv.on("error", (e: any) => { try { appendFileSync(join(process.cwd(), "data", "close-lane.log"), `${new Date().toISOString()} v2 error ${String(e?.code || e)} try ${n}\n`); } catch {} if (n < 20) setTimeout(() => listen(n + 1), 500); else G.__closeLaneV = 0; });
      srv.listen(8091, "0.0.0.0", () => { try { appendFileSync(join(process.cwd(), "data", "close-lane.log"), `${new Date().toISOString()} v2 listening 8091 (close + part + pad)\n`); } catch {} });
    };
    setTimeout(() => listen(0), 300);
  } catch { G.__closeLaneV = 0; }
}
