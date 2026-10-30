import { chartRaw } from "../src/lib/desk/tv";
import { computeVwap } from "../src/lib/desk/vwap";
const checks: [string, number, string][] = [["2026-10-11T15:30:43Z", 83035.85, "-0.5"], ["2026-10-11T13:17:00Z", 83007.10, "-1.5"], ["2026-10-11T09:53:00Z", 82944.98, "-0.5"], ["2026-10-11T08:22:00Z", 82969.14, "+0.5"], ["2026-10-11T07:02:00Z", 83057.17, "+1"], ["2026-10-11T06:22:00Z", 82957.44, "-1"]];
(async () => {
  const bars = await chartRaw("PEPPERSTONE:BTCUSD", "5", 400);
  for (const [at, lvl, m] of checks) {
    const t = Date.parse(at) / 1000;
    const upto = bars.filter((b: any) => b.t <= t);
    const f = computeVwap(upto.slice(-12));
    if (!f) { console.log(at, "no frame"); continue; }
    const k = Number(m);
    console.log(at, "note", lvl, "rolling-1h", (f.vwap + k * f.stdev).toFixed(2), "vwap", f.vwap.toFixed(1), "sd", f.stdev.toFixed(1));
  }
})();
