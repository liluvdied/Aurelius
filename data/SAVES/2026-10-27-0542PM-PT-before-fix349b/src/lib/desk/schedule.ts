// SCHEDULE PILL (Claude, Oct 10 ~1:15 AM PT, Love: "can we have a lil schedule pill like the one that says INSURANCE...
// with the lineup & schedule for each one"). Read only: works out, from live-switch.json with the same rules the live
// copier uses (hour maps, night/day leads, off hours, night-only, any-hour, asset locks), which Pacific hours each book on
// RUN can go live on BTC and on gold.
import { readFileSync } from "node:fs";
import { join } from "node:path";
const NAMES: Record<string, string> = { sp5: "SESSION + PIVOT 5M", ogp15: "OG 👑 + PIVOT 15M", ogp5: "OG + PIVOT 5M", refined: "REFINED", cotc: "COTC", dcd: "DECIDED", diamond: "DIAMOND", brick: "BRICK", squeeze: "SQUEEZE", bank5px: "BANK SOLE+ 5M CLOSE EXIT", claude: "CLAUDE", brickc: "BRICK CLEAN", brk1: "1ST BREAK", snapb: "SNAPBACK" };
const lab = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);
function ranges(hs: number[]) {
  if (hs.length === 24) return "all day";
  if (!hs.length) return "none";
  const out: string[] = [];
  let s = hs[0], p = hs[0];
  for (const h of [...hs.slice(1), 99]) {
    if (h === p + 1) { p = h; continue; }
    out.push(`${lab(s)}–${lab((p + 1) % 24)}`);
    s = p = h;
  }
  return out.join(", ");
}
export function schedule() {
  const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
  const sh = sw?.shifts || {};
  const run: string[] = sw?.liveBook?.books || [];
  const inW = (w: any, h: number) => w && h >= Number(w.from) && h < Number(w.to);
  // Oct 12 (Love: "it says all hours but she's been off for a bit"): the copier's per-book skip hours and the per-asset
  // live skip hours (e.g. gold 6 PM) now count here too, so the schedule matches what actually goes to Kalshi.
  const ok = (b: string, a: string, h: number) => {
    if ((sw?.bookSkipHours?.[b] || []).map(Number).includes(h)) return false;
    if ((sw?.liveSkipHours?.[a] || []).map(Number).includes(h) && !(sw?.liveSkipExempt?.[a] || []).includes(b)) return false;
    return okShift(b, a, h);
  };
  const okShift = (b: string, a: string, h: number) => {
    const lock = sh.bookAssets?.[b];
    if (Array.isArray(lock) && !lock.includes(a)) return false;
    if (!sh.on) return true;
    if ((sh.anyHour?.[a] || []).includes(b)) return true;
    const m = sh.hourLead?.[a];
    if (m && Object.prototype.hasOwnProperty.call(m, String(h))) return m[String(h)] === b;
    if (inW(sh.night, h)) return (typeof sh.night.lead === "string" ? sh.night.lead : sh.night.lead?.[a]) === b;
    if ((sh.nightOnly || []).includes(b)) return false;
    if (inW(sh.day, h)) {
      const off = (sh.day.leadOff?.[a] || []).map(Number);
      return off.includes(h) ? true : b === sh.day.lead;
    }
    return true;
  };
  const rows = run.map((b) => {
    const hrs = (a: string) => Array.from({ length: 24 }, (_, h) => h).filter((h) => ok(b, a, h));
    const notes: string[] = [];
    const ex = sw?.bandExempt?.btc?.[b];
    const exAll = Array.isArray(ex) && ex.length === 2;
    if ((sh.anyHour?.btc || []).includes(b)) notes.push(exAll ? "BTC any hour" : "BTC any hour, bands still apply");
    if (Array.isArray(ex) && ex.length) notes.push(`no band wait on BTC ${exAll ? "longs or shorts" : ex[0] === "up" ? "longs" : "shorts"}`);
    if (b === "squeeze" && sw?.squeezeTrial) notes.push(`trial: stays on through the night while green, sits out ${(sw.squeezeTrial.skipHours || [5, 6]).map(lab).join(" + ")}`);
    const off = (a: string) => Array.from({ length: 24 }, (_, h) => h).filter((h) => !ok(b, a, h));
    return { book: b, name: NAMES[b] || b.toUpperCase(), btc: ranges(hrs("btc")), gold: ranges(hrs("gold")), offBtc: ranges(off("btc")), offGold: ranges(off("gold")), notes };
  });
  const dark = { btc: [] as number[], gold: [] as number[] };
  for (const a of ["btc", "gold"] as const) for (let h = 0; h < 24; h++) if (!run.some((b) => ok(b, a, h))) dark[a].push(h);
  return { at: new Date().toISOString(), rows, dark: { btc: ranges(dark.btc), gold: ranges(dark.gold) }, goldMap: sh.activeGoldMap || null };
}
