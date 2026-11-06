// fix767 check: STATS scores THIS WEEK (Monday 12 AM Pacific) on the server, past weeks in a view-only archive. Display only.
const fs = require("fs");
const j = fs.readFileSync("src/components/desk/journal.tsx", "utf8");
const w = fs.readFileSync("src/lib/desk/stats-week.ts", "utf8");
const need = [[j, ">THIS WEEK<"], [j, ">LAST 4 DAYS<"], [j, "getStatsWeek767"], [j, "getStatsArchive767"], [j, "enabled: !!openWeek767"],
  [w, "export const getStatsWeek767"], [w, "export const getStatsArchive767"], [w, "stats-weeks"], [w, "America/Los_Angeles"]];
const miss = need.filter(([s, x]) => !s.includes(x)).map(([, x]) => x);
if (j.includes(">ALL TIME<")) miss.push("old ALL TIME label still there");
if (/placeOrder|sendKalshi|sendLive|live-switch/.test(w)) miss.push("stats-week.ts must not touch orders or LIVE");
// the week math, copied from stats-week.ts
const off = (t) => { const d = new Date(t); const la = new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" })); return Math.round((d.getTime() - la.getTime()) / 60000) * 60000; };
const ws = (ms) => { const la = new Date(ms - off(ms)); la.setHours(0, 0, 0, 0); la.setDate(la.getDate() - ((la.getDay() + 6) % 7)); return la.getTime() + off(la.getTime() + off(ms)); };
const cases = [["2026-11-02T07:59:00Z", "2026-10-26T07:00:00.000Z"], ["2026-11-02T08:00:30Z", "2026-11-02T08:00:00.000Z"], ["2026-11-06T01:55:00Z", "2026-11-02T08:00:00.000Z"]];
for (const [at, want] of cases) { const got = new Date(ws(Date.parse(at))).toISOString(); if (got !== want) miss.push(`week of ${at} = ${got}, want ${want}`); }
console.log(miss.length ? `stats-week-767 FAIL ${miss.join(" | ")}` : "stats-week-767 PASS (weeks start Monday 12:00 AM Pacific, DST-safe; archive read only when opened)");
process.exit(miss.length ? 1 : 0);
