import { readFileSync } from "node:fs";
const nb = JSON.parse(readFileSync("data/night-book.json", "utf8"));
const { asNightRows } = await import(process.cwd() + "/src/lib/desk/grokog.ts");
const { lineupTwinRows } = await import(process.cwd() + "/src/lib/desk/scannerbooks.ts");
const rows = [...nb, ...asNightRows(), ...lineupTwinRows()];
const by: any = {};
for (const r of rows) { const b = (by[r.book] ||= { n: 0, pnl: 0, last: "" }); b.n++; if (r.pnl != null && r.result !== "open") b.pnl += (r.pnl * 20) / (r.stake || 20); if (r.at > b.last) b.last = r.at; }
console.log("rows", rows.length, "books", Object.keys(by).length, "payload KB", Math.round(JSON.stringify(rows).length / 1024));
const now = Date.now();
for (const [k, v] of Object.entries(by).sort((a: any, b: any) => a[1].pnl - b[1].pnl) as any) console.log(k.padEnd(10), String(v.n).padStart(5), v.pnl.toFixed(0).padStart(7), ((now - Date.parse(v.last)) / 3600000).toFixed(0) + "h ago");
