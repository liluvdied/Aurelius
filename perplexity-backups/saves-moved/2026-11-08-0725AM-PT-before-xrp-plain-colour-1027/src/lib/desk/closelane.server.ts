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
// THE CLOSE ENGINE (fix230, Oct 25 ~7:33 PM PT, Love card "Build the close engine" - her clicks waited 1.4-2.9 s 1 time in 10 because the
// desk's main thread stalls 1-4 s while it reads/writes its big book files): CLOSE / 25% / 50% get their own thread on port 8092. It holds
// her positions (fed by the desk's 4 s poll), signs and sends the market sell itself (one reduce-only IOC, like the CLOSE button), and only
// then tells the desk (exit stamp, take-profit cancels, close note, logs). Answers 503 when it sent nothing, so the page falls back to 8091.
const CLOSE_ENGINE_V = 1;
const CLOSE_ENGINE_JS: string = "// CLOSE ENGINE (fix230) - runs on its own thread so her CLOSE / 25% / 50% never wait behind the desk's main thread.\nconst { parentPort, workerData } = require(\"node:worker_threads\");\nconst http = require(\"node:http\");\nconst fs = require(\"node:fs\");\nconst path = require(\"node:path\");\nconst crypto = require(\"node:crypto\");\nconst CWD = workerData.cwd, PORT = workerData.port, DRY = !!workerData.dry;\nconst ROOT = \"https://external-api.kalshi.com\";\nconst D = (f) => path.join(CWD, \"data\", f);\nlet keyIdC = \"\", keyC = null;\nfunction creds() {\n  if (!keyC) { keyIdC = fs.readFileSync(path.join(CWD, \".secrets\", \"kalshi.id\"), \"utf8\").trim(); keyC = crypto.createPrivateKey(fs.readFileSync(path.join(CWD, \".secrets\", \"kalshi.pem\"), \"utf8\")); }\n  return { id: keyIdC, key: keyC };\n}\nfunction kalshi(method, p, query, body) {\n  const c = creds(), ts = Date.now().toString();\n  const sig = crypto.sign(\"sha256\", Buffer.from(ts + method + p), { key: c.key, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST }).toString(\"base64\");\n  return fetch(ROOT + p + (query || \"\"), { method, headers: { Accept: \"application/json\", \"Content-Type\": \"application/json\", \"KALSHI-ACCESS-KEY\": c.id, \"KALSHI-ACCESS-TIMESTAMP\": ts, \"KALSHI-ACCESS-SIGNATURE\": sig }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(method === \"GET\" ? 2500 : 8000) });\n}\nconst pos = {}; // ticker -> { at, pos, cost } fed by the desk's 4 s poll\nparentPort.on(\"message\", (m) => { try { if (m && m.type === \"pos\") for (const [t, v] of Object.entries(m.pos || {})) { if (!pos[t] || Number(v.at) > Number(pos[t].at)) pos[t] = { at: Number(v.at), pos: Number(v.pos), cost: Number(v.cost) || 0 }; } } catch {} });\nasync function readPos(ticker) {\n  const h = pos[ticker];\n  if (h && Date.now() - h.at < 15000 && Math.abs(h.pos) >= 0.01) return { ...h, src: \"dock\" };\n  const r = await kalshi(\"GET\", \"/trade-api/v2/portfolio/positions\", \"?limit=100&count_filter=position\");\n  if (!r.ok) return null;\n  const b = await r.json(); const pr = (b.market_positions || []).find((x) => x.ticker === ticker);\n  return { at: Date.now(), pos: Number.parseFloat(pr && pr.position_fp || \"0\"), cost: Number.parseFloat(pr && pr.market_exposure_dollars || \"0\"), src: \"read\" };\n}\nconst busy = new Set();\nasync function sell(ticker, pct, kind) {\n  const t0 = Date.now();\n  let p = null;\n  try { p = await readPos(ticker); } catch { p = null; }\n  if (!p || !(Math.abs(p.pos) >= 0.01)) return { sent: false, filled: 0, p };\n  const qty = Math.abs(p.pos), want = pct >= 100 ? qty : Math.floor(qty * pct) / 100;\n  if (!(want >= 0.01)) return { sent: false, filled: 0, p };\n  parentPort.postMessage({ type: \"pre\", ticker, kind });\n  const body = { ticker, client_order_id: crypto.randomUUID(), side: p.pos > 0 ? \"ask\" : \"bid\", count: want.toFixed(2), price: (p.pos > 0 ? 0.01 : 0.99).toFixed(4), time_in_force: \"immediate_or_cancel\", self_trade_prevention_type: \"taker_at_cross\", post_only: false, reduce_only: true, cancel_order_on_pause: true, exchange_index: 2 };\n  let filled = 0, avg = null, status = 0, oid;\n  if (DRY) return { sent: false, dry: body, p, ms: Date.now() - t0 };\n  try {\n    const r = await kalshi(\"POST\", \"/trade-api/v2/portfolio/events/orders\", \"\", body); status = r.status;\n    if (r.ok) { const d = await r.json(); oid = (d.order && d.order.order_id) || d.order_id; filled = Number.parseFloat(d.fill_count || \"0\"); if (filled >= 0.01) avg = Number.parseFloat(d.average_fill_price || \"\") || null; }\n  } catch (e) { status = String(e && e.name || \"error\"); }\n  try { fs.appendFileSync(D(\"order-trail.jsonl\"), JSON.stringify({ at: new Date().toISOString(), method: \"POST\", path: \"/portfolio/events/orders\", ticker, side: body.side, price: body.price, count: body.count, tif: body.time_in_force, reduceOnly: true, client: body.client_order_id, by: `closeEngine ${kind} (own thread, fix230)`, result: status, orderId: oid }) + \"\\n\"); } catch {}\n  if (filled >= 0.01) { const h = pos[ticker]; if (h) { h.pos = p.pos > 0 ? p.pos - filled : p.pos + filled; h.at = Date.now(); } }\n  return { sent: true, filled, avg, p, want, ms: Date.now() - t0 };\n}\nconst nameOf = (t) => /BTC/.test(t) ? \"BTC\" : /GOLD/.test(t) ? \"GOLD\" : /ETH/.test(t) ? \"ETH\" : /SOL/.test(t) ? \"SOL\" : \"SILVER\";\nconst head = { \"Access-Control-Allow-Origin\": \"*\", \"Access-Control-Allow-Methods\": \"POST, GET, OPTIONS\", \"Access-Control-Allow-Headers\": \"Content-Type\", \"Content-Type\": \"application/json\" };\nconst srv = http.createServer((req, res) => {\n  const url = String(req.url || \"\");\n  if (req.method === \"OPTIONS\") { res.writeHead(204, head); res.end(); return; }\n  if (req.method === \"GET\" && url.startsWith(\"/ping\")) { res.writeHead(200, head); res.end(JSON.stringify({ ok: true, dry: DRY, held: Object.keys(pos).length })); return; }\n  if (req.method !== \"POST\" || !(url.startsWith(\"/close\") || url.startsWith(\"/part\"))) { res.writeHead(404, head); res.end(\"{}\"); return; }\n  const recvAt = Date.now(); let b = \"\";\n  req.on(\"data\", (c) => { b += c; if (b.length > 4096) req.destroy(); });\n  req.on(\"end\", async () => {\n    let d = {}; try { d = JSON.parse(b || \"{}\"); } catch {}\n    const t = String(d.ticker || \"\"), isPart = url.startsWith(\"/part\"), pct = isPart ? Number(d.pct) : 100;\n    // 503 = nothing was sent: the page falls back to the old lane. Anything after the order went out answers 200.\n    if (!/^KX[A-Z0-9]+15M-[0-9A-Z-]+$/.test(t) || !(pct > 0 && pct <= 100) || busy.has(t)) { res.writeHead(busy.has(t) ? 200 : 503, head); res.end(JSON.stringify({ ok: false, line: busy.has(t) ? \"Already selling - one moment.\" : \"fallback\" })); return; }\n    busy.add(t);\n    const kind = isPart ? `part${Math.round(pct)}` : \"close\";\n    try {\n      const o = await sell(t, pct, kind);\n      if (!o.sent) { res.writeHead(o.dry ? 200 : 503, head); res.end(JSON.stringify({ ok: false, line: o.dry ? \"dry run\" : \"fallback\", dry: o.dry, src: o.p && o.p.src })); return; }\n      const recvMs = Number(d.clickAt) > 0 ? recvAt - Number(d.clickAt) : null;\n      parentPort.postMessage({ type: \"done\", ticker: t, kind, pct, pos: o.p.pos, cost: o.p.cost, src: o.p.src, filled: o.filled, avg: o.avg, ms: o.ms, recvMs });\n      const nm = nameOf(t);\n      if (!(o.filled >= 0.01)) { res.writeHead(200, head); res.end(JSON.stringify({ ok: false, line: isPart ? `Couldn't sell ${Math.round(pct)}% right now. Press it again.` : `${nm} didn't sell. Press close again.` })); return; }\n      const qty = Math.abs(o.p.pos), yes = Number(o.avg) || (o.p.pos > 0 ? 0.01 : 0.99);\n      const pay = o.p.pos > 0 ? o.filled * yes : o.filled * (1 - yes);\n      const basis = qty > 0 && o.p.cost > 0 ? o.p.cost / qty * o.filled : 0;\n      const left = Math.round((qty - o.filled) * 100) / 100;\n      let line;\n      if (isPart) line = `Sold ${Math.round(pct)}%: ${o.filled} contracts for $${pay.toFixed(2)}. ${left} left.`;\n      else { const pr = pay - basis; line = basis > 0 ? `${nm} closed ${pr > 0.005 ? \"+\" : pr < -0.005 ? \"\u2212\" : \"\"}$${Math.abs(pr).toFixed(2)}.` : `${nm} closed. $${pay.toFixed(2)} back.`; }\n      res.writeHead(200, head); res.end(JSON.stringify({ ok: true, line, engine: true }));\n    } catch { res.writeHead(200, head); res.end(JSON.stringify({ ok: false, line: \"Didn't send. Press it again.\" })); }\n    finally { busy.delete(t); }\n  });\n});\nlet tries = 0;\nsrv.on(\"error\", (e) => { try { fs.appendFileSync(D(\"close-lane.log\"), `${new Date().toISOString()} closeEngine error ${String(e && e.code || e)} try ${tries}\\n`); } catch {} if (tries++ < 20) setTimeout(() => srv.listen(PORT, \"0.0.0.0\"), 500); });\n// one signed read at start so close-lane.log says whether her keys work from this thread (nothing about the keys is written)\nsetTimeout(() => { kalshi(\"GET\", \"/trade-api/v2/portfolio/balance\", \"\").then((r) => { try { fs.appendFileSync(D(\"close-lane.log\"), `${new Date().toISOString()} closeEngine auth ${r.ok ? \"ok\" : \"failed \" + r.status}\\n`); } catch {} }).catch((e) => { try { fs.appendFileSync(D(\"close-lane.log\"), `${new Date().toISOString()} closeEngine auth error ${String(e && e.name || e)}\\n`); } catch {} }); }, 1500);\nsrv.listen(PORT, \"0.0.0.0\", () => { try { fs.appendFileSync(D(\"close-lane.log\"), `${new Date().toISOString()} closeEngine listening ${PORT} (own thread)${DRY ? \" DRY\" : \"\"}\\n`); } catch {} parentPort.postMessage({ type: \"up\" }); });\n";
function startCloseEngine() {
  const G = globalThis as any;
  if (G.__closeEngineV === CLOSE_ENGINE_V && G.__closeEngine) return;
  try { G.__closeEngine?.terminate?.(); } catch {}
  try { clearInterval(G.__closeEngineFeed); } catch {}
  G.__closeEngine = null;
  G.__closeEngineV = CLOSE_ENGINE_V;
  setTimeout(async () => {
    try {
      const { Worker } = await import("node:worker_threads");
      const w = new Worker(CLOSE_ENGINE_JS, { eval: true, workerData: { cwd: process.cwd(), port: 8092, dry: false } });
      G.__closeEngine = w;
      w.on("message", (m: any) => { void import("./kalshi-live.server").then((l: any) => l.laneDone(m)).catch(() => {}); });
      const down = (why: string) => { try { appendFileSync(join(process.cwd(), "data", "close-lane.log"), `${new Date().toISOString()} closeEngine down ${why}\n`); } catch {} if (G.__closeEngine === w) { G.__closeEngine = null; G.__closeEngineV = 0; try { clearInterval(G.__closeEngineFeed); } catch {} } };
      w.on("error", (e: any) => down(String(e?.message || e).slice(0, 120)));
      w.on("exit", (c: any) => down(`exit ${c}`));
      let last = "";
      G.__closeEngineFeed = setInterval(() => { try { const p = G.__hotClose?.pos || {}; const sp = JSON.stringify(p); if (sp !== last) { last = sp; w.postMessage({ type: "pos", pos: p }); } } catch {} }, 500);
    } catch (e: any) { G.__closeEngineV = 0; try { appendFileSync(join(process.cwd(), "data", "close-lane.log"), `${new Date().toISOString()} closeEngine start failed ${String(e?.message || e).slice(0, 120)}\n`); } catch {} }
  }, 600);
}
export async function startCloseLane() {
  const G = globalThis as any;
  try { startCloseEngine(); } catch {}
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
