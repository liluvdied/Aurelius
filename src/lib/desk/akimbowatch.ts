// fix734 AKIMBO SILENT ALARM (Love Nov 5 2026 10:13 AM PT: "pls set up 2 minute monitor for her , that pings if she's silent on a window ; after entering on paper or some kind of signaling
// something stopped her so we can remediate the cause before the next window"). ALERT ONLY - it never places, holds or changes an order. Every ~15 s: each paper entry of a live-today
// (akimbo) book that has no live fill for its window - the moment the copier writes down a hold / refusal / drop, or 2 minutes after the paper entry with nothing filled - raises ONE alert:
// a Mac notification with a sound, a row on the desk's alarm bar (ALERTS), data/akimbo-silent.jsonl, and the red line on the LIVE TODAY row. Windows Love traded by hand are noted quietly
// (no sound); a second call in a window the other akimbo book already holds on the same side is fine (one ticket per window) and is not an alert.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
const OK734 = new Set(["filled", "partial"]);
function lt734(): string[] { try { const j = JSON.parse(readFileSync(D("live-today.json"), "utf8")); return j?.on === true && Date.now() < Date.parse(String(j.until)) && !(Array.isArray(j?.skipHoursPT) && j.skipHoursPT.map(Number).includes(Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24)) /* fix755: AKIMBO steps aside in live-today skipHoursPT (Love: 2-3 PM PT = main) */ && typeof j.book === "string" ? j.book.split(",").filter(Boolean) : []; } catch { return []; } }
export function silentWhy734(row: any, done: Record<string, any>, books: string[], nowMs: number): { kind: "" | "alert" | "quiet"; why: string; status: string } {
  const key = Object.keys(done).find((k) => k.startsWith(`${row.ticker}:${row.book}`));
  const d: any = key ? done[key] : null, st = String(d?.status || "");
  if (OK734.has(st) || (d?.orderId && ["resting", "sent"].includes(st))) return { kind: "", why: "", status: st };
  const other = Object.entries(done).find(([k, v]: [string, any]) => k.startsWith(`${row.ticker}:`) && books.includes(k.split(":")[1] || "") && (k.split(":")[1] || "") !== String(row.book) && OK734.has(String(v?.status || "")));
  if (other && (other[1] as any).side === row.side) return { kind: "", why: "", status: "covered" };
  const why = String(d?.firstReason || d?.reason || "");
  if (/hand traded|your hand trade|by hand/.test(why)) return { kind: "quiet", why, status: st };
  if (/pivot keeps the sticks/.test(why)) return { kind: "", why, status: st };
  const age = nowMs - Date.parse(String(row.at));
  if (d && ["held", "blocked", "skipped", "missed"].includes(st) && why && (d.final === true || age >= 45000)) return { kind: "alert", why, status: st }; // a final refusal at once; a hold that is still retrying after 45 s
  if (!d && age >= 20000) return { kind: "alert", why: "the copier never picked it up - no Kalshi attempt 20 s after paper (fix750)", status: "none" }; // fix750: no attempt at all is flagged at 20 s
  if (age >= 120000) return { kind: "alert", why: why || (d ? `no fill 2 min after paper (${st || "trying"})` : "the copier never picked it up"), status: st || "none" };
  return { kind: "", why: "", status: st };
}
export function akimboWatch734(): void {
  try {
    if (G.__ak734Busy || Date.now() - Number(G.__ak734At || 0) < 15000) return;
    G.__ak734Busy = true; G.__ak734At = Date.now();
    const books = lt734(); if (!books.length) return;
    const seen: Record<string, number> = (G.__ak734Seen ||= {});
    let rows: any[] = []; try { const g = JSON.parse(readFileSync(D("grok-og.json"), "utf8")); rows = Array.isArray(g) ? g : []; } catch {}
    let done: Record<string, any> = {}; try { done = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); } catch { return; }
    const since = Date.now() - 20 * 60000;
    for (const r of rows) {
      const book = String(r?.lane || ""); if (!books.includes(book) || !r.ticker || !/15M-/.test(String(r.ticker)) || Date.parse(String(r.at)) < since) continue;
      const id = String(r.id || `${r.ticker}:${book}`); if (seen[id]) continue;
      const v = silentWhy734({ ...r, book }, done, books, Date.now()); if (!v.kind) continue;
      seen[id] = Date.now();
      const when = new Date(String(r.at)).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
      let text = `AKIMBO ${v.kind === "quiet" ? "(yours)" : "SILENT"}: ${when} ${String(r.asset).toUpperCase()} ${r.side === "up" ? "long" : "short"} · ${book === "brk15" ? "+15M PIVOTS" : book === "brk-sesspk" ? "SESSION + PINK" : book} · paper ${Math.round(Number(r.ask) * 100)}c · live: ${v.status || "none"} - ${v.why.slice(0, 220)}`;
      let dg750: any = null; try { dg750 = diagnose750({ ...r, book }, done); appendFileSync(D("paper-not-kalshi.jsonl"), JSON.stringify({ at: new Date().toISOString(), id, book, asset: r.asset, side: r.side, paperAt: r.at, paperAsk: r.ask, label: r.label, kind: v.kind, status: v.status, why: v.why, ...dg750 }) + "\n"); } catch {} // fix750: the evaluation of why, every flag
      if (dg750?.short) text = `${text} | WHY: ${dg750.short}`.slice(0, 600);
      try { appendFileSync(D("akimbo-silent.jsonl"), JSON.stringify({ at: new Date().toISOString(), id, book, asset: r.asset, side: r.side, ask: r.ask, paperAt: r.at, kind: v.kind, status: v.status, why: v.why, text }) + "\n"); } catch {}
      if (v.kind !== "alert") continue;
      try { let a: any[] = []; try { const p = JSON.parse(readFileSync(D("alarm.json"), "utf8")); if (Array.isArray(p)) a = p; } catch {} a.unshift({ at: new Date().toISOString(), text }); writeFileSync(D("alarm.json"), JSON.stringify(a.slice(0, 20))); } catch {}
      try { const msg = text.replace(/["\\]/g, "'").slice(0, 230); execFile("osascript", ["-e", `display notification "${msg}" with title "AKIMBO went silent" sound name "Basso"`], () => {}); } catch {}
    }
    for (const k of Object.keys(seen)) if (Date.now() - seen[k] > 3600000) delete seen[k];
  } catch {} finally { G.__ak734Busy = false; }
}
export function recentSilent734(): any[] { try { if (!existsSync(D("akimbo-silent.jsonl"))) return []; const L = readFileSync(D("akimbo-silent.jsonl"), "utf8").trim().split("\n").slice(-20).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); return L.filter((x: any) => x.kind === "alert" && Date.now() - Date.parse(String(x.at)) < 30 * 60000).slice(-3).reverse(); } catch { return []; } }

// fix750 PAPER-NOT-ON-KALSHI EVALUATION (Love Nov 5 2026 1:34 PM PT: "can you set up a flag for any orders that were sent out on paper and didn't make it to kalshi , when one does have it trigger
// an evaluation of why until we see what's halting them and fix that"). READ / LOG ONLY - it never places, holds or changes an order and changes no rule. For each flagged paper entry it gathers:
// the copier's own record (status, every reason it wrote), seconds from paper to the copier's first attempt, the copy timing (wait / gates / order ms, live ask vs paper ask), the 66c floor,
// seconds left in the window, the umpire's verdict, entries on/off, whether Love's hand traded the window, and the last wall lines for that book + window - then names the most likely cause.
function tailLines750(f: string, n: number): string[] { try { const s = readFileSync(D(f), "utf8"); return s.slice(-200000).trim().split("\n").slice(-n); } catch { return []; } }
export function diagnose750(row: any, done: Record<string, any>): any {
  const out: any = {}; const tk = String(row.ticker), book = String(row.book), paperMs = Date.parse(String(row.at));
  const key = Object.keys(done).find((k) => k.startsWith(`${tk}:${book}`)); const d: any = key ? done[key] : null;
  out.copier = d ? { status: d.status, reason: d.reason, firstReason: d.firstReason, at: d.at, final: d.final } : null;
  out.secsToAttempt = d?.at ? Math.round((Date.parse(String(d.at)) - paperMs) / 100) / 10 : null;
  try { const ct = tailLines750("copy-timing.jsonl", 400).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x: any) => x && String(x.id).startsWith(`${tk}:${book}`)).pop(); if (ct) out.timing = { waitMs: ct.waitMs, gatesMs: ct.gatesMs, orderMs: ct.orderMs, status: ct.status, paperAsk: ct.paperAsk, liveAsk: ct.liveAsk, paid: ct.paid }; } catch {}
  const m = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(tk); out.paperAsk = Number(row.ask) || null; out.overFloor = Number(row.ask) > 0.667;
  try { const u = JSON.parse(readFileSync(D("UMPIRE-VERDICT.json"), "utf8")); out.umpire = { ok: u?.ok === true, at: u?.at, why: String(u?.why || "").slice(0, 160) }; } catch { out.umpire = null; }
  try { const h = JSON.parse(readFileSync(D("halt.json"), "utf8")); out.entriesOff = h?.off === true ? String(h.reason || "off") : false; } catch {}
  try { out.live = JSON.parse(readFileSync(D("live-switch.json"), "utf8"))?.live === true; } catch {}
  const why = String(d?.firstReason || d?.reason || "");
  out.handWindow = /hand traded|by hand/.test(why);
  out.walls = [...tailLines750("other-side.jsonl", 600), ...tailLines750("band-lock.jsonl", 600)].map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((x: any) => x && (x.ticker === tk || String(x.id || "").startsWith(tk)) && (x.lane === book || x.book === book) && Math.abs(Date.parse(String(x.at)) - paperMs) < 180000).slice(-4).map((x: any) => `${String(x.at).slice(11, 19)} ${x.why || x.reason}`.slice(0, 200));
  void m;
  out.short = !d ? (out.live === false ? "LIVE is off" : out.entriesOff ? `entries off (${out.entriesOff})` : out.umpire && !out.umpire.ok ? `umpire NOT SAFE (${out.umpire.why})` : out.overFloor ? `paper ask ${Math.round(out.paperAsk * 100)}c is over the 66c floor` : "the copier never attempted it - copier / bell not picking it up")
    : out.handWindow ? "your hand traded this window (it stays yours)"
    : /already traded/.test(why) ? "another AKIMBO book already traded this window (one ticket per window)"
    : /UMPIRE|umpire|CODE CHANGED/.test(why) ? `umpire gate: ${why.slice(0, 120)}`
    : /floor|over .*c|price ran|ran first|unfilled|window ended|paper closed it/.test(why) ? `price / fill: ${why.slice(0, 140)}`
    : why ? `copier refused: ${why.slice(0, 160)}` : `copier status ${d.status} with no reason`;
  return out;
}
