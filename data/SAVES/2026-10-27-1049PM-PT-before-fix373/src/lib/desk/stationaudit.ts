// STATION AUDIT (Claude, Oct 10 ~5:20 PM PT, Love: "can you check each one is tuned to the right... station"). Read only,
// runs once: for every daily high/low and hourly-temp series, the settlement source Kalshi names vs the station the desk
// reads (stationOf), plus that station's NWS name/location. data/station-audit.json.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget, nget, stationOf } from "./scanner";
const g = globalThis as unknown as { __staDone?: boolean };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export async function stationAuditOnce() {
  if (g.__staDone) return;
  g.__staDone = true;
  const out: any[] = [];
  try {
    const j = await kget(`/trade-api/v2/series?category=${encodeURIComponent("Climate and Weather")}`);
    await sleep(1500);
    const ser = (j?.series ?? []).filter((x: any) => /^KX(HIGH|LOW|TEMP)/.test(String(x.ticker)));
    for (const s of ser) {
      try {
        const mj = await kget(`/trade-api/v2/markets?series_ticker=${s.ticker}&status=open&limit=1`);
        await sleep(1500);
        const m = mj?.markets?.[0];
        if (!m) continue;
        const st = stationOf(m, s.ticker);
        let name = "", lat = null, lon = null;
        if (st) { try { const meta = await nget(`/stations/${st}`); name = meta?.properties?.name || ""; [lon, lat] = meta?.geometry?.coordinates || []; } catch {} }
        out.push({ series: s.ticker, title: s.title, settlement: s.settlement_sources ?? s.settlement_source ?? null, rules: String(m.rules_primary || "").slice(0, 400), deskStation: st, stationName: name, lat, lon });
      } catch (e) { out.push({ series: s.ticker, error: String(e).slice(0, 120) }); }
    }
  } catch (e) { out.push({ error: String(e) }); }
  writeFileSync(join(process.cwd(), "data", "station-audit.json"), JSON.stringify({ at: new Date().toISOString(), rows: out }, null, 1));
}
