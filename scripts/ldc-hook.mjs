// LDC WEBHOOK (Claude, Oct 8 ~8:30 PM PT, Love: "remember our LDC? it has 1M - 5M - 15M. i want to try linking those via
// webhooks. fires on the 1M signal, we'll try the 5M and 15M on their own books").
// A tiny listener of its own, on 127.0.0.1:8090, separate from the desk on purpose: only this port is ever put behind a
// tunnel, so nothing else on the desk (the LIVE switch, the RUN books) can be reached from outside.
// It accepts ONE thing: POST /ldc with the right secret (.secrets/ldc-hook.secret). Each good signal is written to
// data/ldc-signals.jsonl; the desk's paper books read that file. It never trades and never touches Kalshi.
import http from "node:http";
import { readFileSync, appendFileSync } from "node:fs";
import { timingSafeEqual } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SECRET = readFileSync(join(ROOT, ".secrets", "ldc-hook.secret"), "utf8").trim();
const OUT = join(ROOT, "data", "ldc-signals.jsonl");
const PORT = Number(process.env.LDC_PORT || 8090);
const hits = [];

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};
const assetOf = (s) => {
  const t = String(s || "").toUpperCase();
  if (t.includes("BTC") || t.includes("XBT")) return "btc";
  if (t.includes("XAU") || t.includes("GOLD") || /^GC\d?!?$/.test(t) || t.startsWith("MGC")) return "gold";
  if (t.includes("XAG") || t.includes("SILVER") || /^SI\d?!?$/.test(t)) return "silver";
  return null;
};
const TFS = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60];
const tfOf = (s) => {
  const n = Number.parseInt(String(s || "").toUpperCase().replace(/\s+/g, "").replace(/(M|MIN)$/, ""), 10);
  return TFS.includes(n) ? n : null;
};
// Oct 8 ~9:50 PM PT (Love): her Nav Band script's own VWAP Long/Short signals come in too, marked "src":"vwap".
const srcOf = (s) => (String(s || "ldc").toLowerCase().startsWith("vwap") ? "vwap" : "ldc");
const sideOf = (s) => {
  const t = String(s || "").toLowerCase();
  if (/(buy|long|bull|up)/.test(t) && !/stop/.test(t)) return "up";
  if (/(sell|short|bear|down)/.test(t) && !/stop/.test(t)) return "down";
  return null;
};

http
  .createServer((req, res) => {
    const done = (code, msg) => {
      res.writeHead(code, { "content-type": "text/plain" });
      res.end(msg);
    };
    if (req.method !== "POST" || req.url !== "/ldc") return done(404, "no");
    const now = Date.now();
    while (hits.length && now - hits[0] > 60000) hits.shift();
    if (hits.length > 120) return done(429, "slow down");
    hits.push(now);
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 2048) req.destroy();
    });
    req.on("end", () => {
      let j;
      try {
        j = JSON.parse(body);
      } catch {
        return done(400, "json");
      }
      if (!j || !same(j.secret, SECRET)) return done(403, "no");
      const asset = assetOf(j.sym);
      const tf = tfOf(j.tf);
      const side = sideOf(j.signal);
      if (!asset || !tf || !side) {
        appendFileSync(join(ROOT, "data", "ldc-rejects.jsonl"), JSON.stringify({ at: new Date().toISOString(), sym: j.sym, tf: j.tf, signal: j.signal }) + "\n");
        return done(422, "unknown sym/tf/signal");
      }
      const src = srcOf(j.src);
      const row = { at: new Date().toISOString(), src, asset, tf, side, sym: String(j.sym).slice(0, 40), price: Number(j.price) || null, tvTime: String(j.t || "").slice(0, 40) };
      appendFileSync(OUT, JSON.stringify(row) + "\n");
      console.log(`${row.at}  ${src.toUpperCase()} ${tf}M ${asset.toUpperCase()} ${side === "up" ? "BUY" : "SELL"} @ ${row.price}`);
      done(200, "ok");
    });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`LDC webhook listening on 127.0.0.1:${PORT}/ldc`));
