// LAB JOB (Claude, Oct 12 ~12:30 PM PT, Love: "could you test them against our lines / our model right now"). READ ONLY:
// fetches public data only (Kalshi settled 15M commodity markets, futures 1m candles, Kalshi combo collections) into
// data/lab/ so the analysis can run offline. Never places, changes or cancels anything. Triggered once by
// data/lab-req.json {kind}; status in data/lab/status.json.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";

const D = (f: string) => join(process.cwd(), "data", f);
const g = globalThis as unknown as { __labBusy?: boolean };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const SERIES: Record<string, string> = { gold: "KXGOLD15M", silver: "KXSILVER15M", platinum: "KXPLATINUM15M", palladium: "KXPALLADIUM15M", copper: "KXCOPPER15M", wti: "KXWTI15M", natgas: "KXNATGAS15M" };
const YAHOO: Record<string, string> = { gold: "GC=F", silver: "SI=F", platinum: "PL=F", palladium: "PA=F", copper: "HG=F", wti: "CL=F", natgas: "NG=F" };

function status(s: any) { try { writeFileSync(D("lab/status.json"), JSON.stringify({ at: new Date().toISOString(), ...s }, null, 1)); } catch {} }

async function commodities() {
  const out: any = {};
  const since = Math.floor(Date.now() / 1000) - 7 * 86400;
  for (const [a, s] of Object.entries(SERIES)) {
    const ms: any[] = [];
    let cursor = "";
    try {
      for (let p = 0; p < 10; p++) {
        const j = await kget(`/trade-api/v2/markets?series_ticker=${s}&status=settled&limit=1000&min_close_ts=${since}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
        for (const m of j?.markets ?? []) ms.push({ t: m.ticker, open: m.open_time, close: m.close_time, strike: m.floor_strike, settle: m.expiration_value, result: m.result, vol: m.volume_fp ?? m.volume, last: m.last_price_dollars ?? m.last_price });
        cursor = j?.cursor || "";
        if (!cursor) break;
        await sleep(400);
      }
    } catch (e) { out[`${a}_err`] = String(e).slice(0, 160); }
    out[a] = ms.length;
    writeFileSync(D(`lab/kalshi-${a}.json`), JSON.stringify(ms));
    status({ step: `kalshi ${a}`, n: ms.length });
    await sleep(500);
  }
  for (const [a, sym] of Object.entries(YAHOO)) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1m&range=7d`, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
      const j: any = await res.json();
      const r = j?.chart?.result?.[0];
      const ts: number[] = r?.timestamp ?? [];
      const q = r?.indicators?.quote?.[0] ?? {};
      const bars = ts.map((t, i) => [t, q.open?.[i], q.high?.[i], q.low?.[i], q.close?.[i], q.volume?.[i]]).filter((b) => b.slice(1, 5).every((x) => Number.isFinite(Number(x))));
      writeFileSync(D(`lab/bars-${a}.json`), JSON.stringify(bars));
      out[`${a}_bars`] = bars.length;
      if (!bars.length) out[`${a}_barsErr`] = `status ${res.status}`;
    } catch (e) { out[`${a}_barsErr`] = String(e).slice(0, 160); }
    status({ step: `bars ${a}`, out });
    await sleep(600);
  }
  return out;
}

async function combos() {
  const out: any = {};
  try {
    const j = await kget(`/trade-api/v2/multivariate_event_collections?status=open&limit=200`);
    const cs = j?.multivariate_contracts ?? j?.multivariate_event_collections ?? [];
    writeFileSync(D("lab/mve-collections.json"), JSON.stringify(cs, null, 1));
    out.collections = cs.length;
  } catch (e) { out.err = String(e).slice(0, 200); }
  return out;
}

export async function labTick() {
  const rq = D("lab-req.json");
  if (g.__labBusy || !existsSync(rq)) return;
  let req: any = {};
  try { req = JSON.parse(readFileSync(rq, "utf8")); } catch { return; }
  if (!req?.kind || req.done) return;
  g.__labBusy = true;
  writeFileSync(rq, JSON.stringify({ ...req, done: new Date().toISOString() }));
  try { mkdirSync(D("lab"), { recursive: true }); } catch {}
  try {
    const res: any = {};
    if (req.kind === "commodities" || req.kind === "all") res.commodities = await commodities();
    if (req.kind === "combos" || req.kind === "all") res.combos = await combos();
    if (req.kind === "combotry") {
      // one shadow quote on a combo built from the current 15M crypto favorites (nothing bought)
      const cs = JSON.parse(readFileSync(D("combos-status.json"), "utf8"));
      const legs: any[] = [];
      let est = 1;
      for (const m of cs?.markets ?? []) {
        if (!/^KX(BTC|ETH|SOL|XRP|DOGE|HYPE|ZEC|BNB)15M/.test(m.t)) continue;
        const ya = Number(m.ya), na = Number(m.na);
        const side = ya >= na ? "yes" : "no", ask = Math.max(ya, na);
        if (!(ask >= 0.5 && ask < 0.99)) continue;
        legs.push({ market_ticker: m.t, event_ticker: String(m.t).replace(/-[^-]+$/, ""), side }); est *= ask;
        if (legs.length >= 3) break;
      }
      const live: any = await import("./kalshi-live.server");
      res.combotry = legs.length >= 2 ? await live.comboBuyQuote(legs, 5, est) : { err: "no legs", n: (cs?.markets ?? []).length };
      res.combotry.legsIn = legs;
    }
    if (req.kind === "hourbt") {
      // 15 days of Kalshi BTC / gold 15M results + 1m bars (Yahoo, 7-day chunks) for the hours backtest (Oct 12, Love)
      const since = Math.floor(Date.now() / 1000) - 15 * 86400;
      res.hourbt = {};
      for (const [a, s] of [["btc", "KXBTC15M"], ["gold", "KXGOLD15M"]] as const) {
        const ms: any[] = [];
        let cursor = "";
        for (let p = 0; p < 20; p++) {
          try {
            const j = await kget(`/trade-api/v2/markets?series_ticker=${s}&status=settled&limit=1000&min_close_ts=${since}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
            for (const m of j?.markets ?? []) ms.push({ t: m.ticker, open: m.open_time, close: m.close_time, strike: m.floor_strike, result: m.result });
            cursor = j?.cursor || "";
            if (!cursor) break;
          } catch { await sleep(3000); }
          await sleep(1200);
        }
        writeFileSync(D(`lab/hb-kalshi-${a}.json`), JSON.stringify(ms));
        const sym = a === "btc" ? "BTC-USD" : "GC=F";
        const bars: any[] = [];
        const now = Math.floor(Date.now() / 1000);
        for (let k = 3; k >= 0; k--) {
          const p2 = now - k * 6 * 86400, p1 = p2 - 6 * 86400;
          try {
            const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1m&period1=${p1}&period2=${p2}`, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(20000) });
            const j: any = await r.json();
            const x = j?.chart?.result?.[0];
            const q = x?.indicators?.quote?.[0] ?? {};
            (x?.timestamp ?? []).forEach((t: number, i: number) => { if ([q.open?.[i], q.high?.[i], q.low?.[i], q.close?.[i]].every((v) => v != null)) bars.push([t, q.open[i], q.high[i], q.low[i], q.close[i], q.volume?.[i] ?? 0]); });
          } catch {}
          await sleep(800);
        }
        writeFileSync(D(`lab/hb-bars-${a}.json`), JSON.stringify(bars));
        res.hourbt[a] = { markets: ms.length, bars: bars.length };
        status({ step: `hourbt ${a}`, res });
      }
    }
    if (req.kind === "tvbars") {
      const { chartRaw } = await import("./tv");
      for (const sym of (req.symbols ?? []) as string[]) { try { writeFileSync(D(`lab/tv-${sym.replace(/[^A-Z0-9]/gi, "_")}.json`), JSON.stringify(await chartRaw(sym, "1", Number(req.count) || 400))); } catch {} }
      res.tvbars = true;
    }
    if (req.kind === "tvcheck") {
      const { chartRaw } = await import("./tv");
      res.tv = {};
      for (const sym of (req.symbols ?? []) as string[]) {
        try { const b: any[] = (await chartRaw(sym, "1", 120)) as any[]; const last = b.length ? Math.max(...b.map((x: any) => x.t)) : 0; res.tv[sym] = { n: b.length, lastAgoSec: last ? Math.round(Date.now() / 1000 - last) : null, lastC: b.length ? b.sort((x: any, y: any) => x.t - y.t)[b.length - 1].c : null }; } catch (e) { res.tv[sym] = { err: String(e).slice(0, 120) }; }
      }
    }
    status({ done: true, res });
  } catch (e) {
    status({ error: String(e).slice(0, 300) });
  } finally {
    g.__labBusy = false;
  }
}
