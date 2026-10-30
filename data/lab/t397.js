const ts=require(process.cwd()+"/node_modules/typescript");const src="{ /* fix397b: after the daily reset her chart's blue VWAP is the \"fresh VWAP\" line (fresh \u00b1\u03c3) - read it first, the carried session lines second */ const vw397 = Number(lb.L.find((l: Line) => String(l.name) === \"fresh VWAP\")?.price) || Number(lb.L.find((l: Line) => String(l.name) === \"session VWAP\")?.price) || 0, u397 = Number(lb.L.find((l: Line) => String(l.name) === \"fresh +1\u03c3\")?.price) || Number(lb.L.find((l: Line) => String(l.name) === \"+1\u03c3\")?.price) || 0, w397 = vw397 > 0 && u397 > 0 ? Math.abs(u397 - vw397) : 0;\n    if (vw397 > 0 && w397 > 0 && w397 < (asset === \"btc\" ? 150 : 3)) { const c397 = w397 / 2;\n      if (side === \"up\" && q.c < vw397 && vw397 - q.c <= c397) return deny(`THE BLUE VWAP WALL: long $${(vw397 - q.c).toFixed(2)} under the unbroken session VWAP ${vw397.toFixed(2)} - bands are small (VWAP to 1\u03c3 $${w397.toFixed(2)}), no long within half of that ($${c397.toFixed(2)}). Wait for price over the VWAP.`, { tick: q.c });\n      if (side === \"down\" && q.c > vw397 && q.c - vw397 <= c397) return deny(`THE BLUE VWAP WALL: short $${(q.c - vw397).toFixed(2)} over the unbroken session VWAP ${vw397.toFixed(2)} - bands are small (VWAP to 1\u03c3 $${w397.toFixed(2)}), no short within half of that ($${c397.toFixed(2)}). Wait for price under the VWAP.`, { tick: q.c }); } }";
const code=ts.transpileModule("function wall(asset,lb,q,side){const deny=(r)=>r;"+src+" return '';}",{compilerOptions:{target:99}}).outputText;
eval(code);
const L=(o)=>Object.entries(o).map(([name,price])=>({name,price}));
const cases=[
 ["btc 3:00 short (fresh VWAP 81245, fresh+1 81327, stale session)","btc",{"session VWAP":80868,"+1σ":81300,"fresh VWAP":81245.15,"fresh +1σ":81327.7},81272.58,"down"],
 ["btc 2:45 long 35 under VWAP, width 90","btc",{"fresh VWAP":81237.6,"fresh +1σ":81328},81202,"up"],
 ["btc long 50 under VWAP width 90 (outside half)","btc",{"fresh VWAP":81237.6,"fresh +1σ":81328},81187,"up"],
 ["btc short over VWAP wide bands 200","btc",{"fresh VWAP":81000,"fresh +1σ":81200},81030,"down"],
 ["btc long ABOVE VWAP (broken)","btc",{"fresh VWAP":81000,"fresh +1σ":81090},81010,"up"],
 ["btc short UNDER VWAP (broken)","btc",{"fresh VWAP":81000,"fresh +1σ":81090},80990,"down"],
 ["gold long 0.6 under VWAP width 2","gold",{"session VWAP":4065.67,"+1σ":4067.67},4065.07,"up"],
 ["gold long 1.5 under width 2 (outside half)","gold",{"session VWAP":4065.67,"+1σ":4067.67},4064.17,"up"],
 ["gold just reset: sd 0","gold",{"fresh VWAP":4065.67,"fresh +1σ":4065.67},4065.0,"up"],
];
for(const [n,a,o,c,sd] of cases){const r=wall(a,{L:L(o)},{c},sd);console.log((r?"BLOCK ":"pass  ")+n+(r?"  -> "+r.slice(0,90):""));}
