import { ChartFeed } from "../src/tradingview.js";
import { currentWindow } from "../src/kalshi.js";
const f = { btc: new ChartFeed("PEPPERSTONE:BTCUSD"), gold: new ChartFeed("TVC:GOLD") };
for (const s of ["KXBTC15M","KXGOLD15M"]) { try { console.log(s, JSON.stringify(await currentWindow(s))); } catch (e) { console.log(s, "ERR", e.message); } }
setTimeout(() => { for (const [k,v] of Object.entries(f)) { const b=v.list(); console.log(k, v.status, b.length, JSON.stringify(b.at(-1)), JSON.stringify(v.price())); } process.exit(0); }, 12000);
