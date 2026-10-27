import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "data");
const file = join(dir, "tv-bands.json");
mkdirSync(dir, { recursive: true });

function readBook() {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : { bands: {}, hits: [] };
  } catch {
    return { bands: {}, hits: [] };
  }
}

let writing = Promise.resolve();

function save(raw) {
  const job = writing.then(() => {
    let body = {};
    try {
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
    const book = readBook();
    const symbol = String(body?.s || body?.symbol || body?.ticker || "unknown");
    const band = String(body?.b || body?.band || "plot");
    const rawPrice = Number(body?.p ?? body?.price);
    const close = Number(body?.c ?? body?.close);
    const price = Number.isFinite(rawPrice) ? rawPrice : close;
    const key = `${symbol}:${band}`;
    const at = new Date().toISOString();
    book.bands[key] = { symbol, band, price: Number.isFinite(price) ? price : null, raw, at };
    book.hits = [{ at, key, raw }, ...(book.hits || [])].slice(0, 80);
    writeFileSync(file, JSON.stringify(book, null, 2));
  });
  writing = job.catch(() => {});
  return job;
}

createServer((req, res) => {
  if (req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, load: "queued" }));
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(404);
    res.end();
    return;
  }
  const chunks = [];
  req.on("data", (chunk) => {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 8000) req.destroy();
  });
  req.on("end", () => {
    const raw = Buffer.concat(chunks).toString("utf8").slice(0, 4000);
    save(raw)
      .then(() => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end("{\"ok\":true}");
      })
      .catch(() => {
        res.writeHead(500);
        res.end();
      });
  });
}).listen(8787, "127.0.0.1");
