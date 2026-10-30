import { chartRaw } from "./src/lib/desk/tv.ts";
import { writeFileSync } from "node:fs";
for (const sym of ["PEPPERSTONE:BTCUSD", "VANTAGE:BTCUSD"]) {
  try { const c = await chartRaw(sym, "5", 5000); writeFileSync(`${process.env.HOME}/lab/${sym.split(":")[0].toLowerCase()}-btc5.json`, JSON.stringify(c)); console.log(sym, c.length, c[0]?.t, c[c.length-1]?.t); } catch (e) { console.log(sym, "ERR", String(e).slice(0,200)); }
}
