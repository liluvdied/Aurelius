// fix697 EVERY SKIP, IN PLAIN WORDS + A FLAG (Love Nov 5 2026 ~2:17 AM PT: "the intention behind it was to get an answer on every skip so i wouldn't have to ask grok every time ...
// just have it log every skip and the reason for it so i can look without bugging you. and let's add a flag button so i can flag the flawed ones and we can address it that way
// instead of typing it out frantically"). DISPLAY / LOG ONLY: built on request (the SITREP tab, cached 60 s) from what the desk already writes - live-book-done.json (every live copy's
// outcome), refusal-ledger.jsonl (every wall that said no, with its numbers), idea-ledger-679.jsonl (what she read and the runner-up) and grok-og.json (who called what).
// Never in her trade loop; never places, sizes or holds an order. The FLAG button only appends a line to data/sitrep-flags.jsonl.
import { appendFileSync, existsSync, openSync, readSync, closeSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const D = (f: string) => join(process.cwd(), "data", f);
const G = globalThis as any;
const LIVE = ["recon-tog", "recon-rej", "recon-rjnp", "recon-dly"];
const NAME: Record<string, string> = { "recon-tog": "MAIN", "recon-rej": "REJECTION", "recon-rjnp": "REJ ONLY NO PINK", "recon-dly": "DELAYED" };
function tail(f: string, bytes: number): string[] { try { const p = D(f); if (!existsSync(p)) return []; const sz = statSync(p).size, n = Math.min(sz, bytes), b = Buffer.alloc(n), fd = openSync(p, "r"); readSync(fd, b, 0, n, sz - n); closeSync(fd); const s = b.toString("utf8"); return (n < sz ? s.slice(s.indexOf("\n") + 1) : s).split("\n").filter(Boolean); /* a partial first line only when we started mid-file */ } catch { return []; } }
const pt = (iso: string) => { try { return new Date(iso).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit", second: "2-digit" }); } catch { return iso; } };
const side = (s: string) => (s === "up" ? "LONG" : s === "down" ? "SHORT" : "-");
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** a ticker's window start (UTC ms), DST-aware (her tickers carry Eastern close times) */
export function windowStart697(tk: string): number {
  const m = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(tk); if (!m) return 0;
  const y = 2000 + Number(m[1]), mo = MON.indexOf(m[2]), d = Number(m[3]), hh = Number(m[4]), mm = Number(m[5]);
  const naive = Date.UTC(y, mo, d, hh, mm); const off = naive >= Date.UTC(2026, 10, 1, 6) && naive < Date.UTC(2027, 2, 14, 7) ? 5 : 4; // EST from Nov 1 2026
  return naive + off * 3600000 - 900000;
}
export type SkipLine = { id: string; ticker: string; asset: string; window: string; book: string; took: boolean; text: string; first: string; runnerUp: string; flagged: boolean };
export function skipLog697(hours = 12): SkipLine[] {
  if (G.__skip697 && Date.now() - G.__skip697.at < 60000 && G.__skip697.h === hours) return G.__skip697.v;
  const since = Date.now() - hours * 3600000;
  let done: Record<string, any> = {}; try { done = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); } catch {}
  const refs = tail("refusal-ledger.jsonl", 4_000_000).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((j: any) => j && Date.parse(j.at) >= since);
  const ideas = tail("idea-ledger-679.jsonl", 3_000_000).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((j: any) => j && Date.parse(j.at) >= since);
  let calls: any[] = []; try { calls = (JSON.parse(readFileSync(D("grok-og.json"), "utf8")) as any[]).filter((r) => LIVE.includes(String(r?.lane)) && Date.parse(r.at) >= since); } catch {}
  const slides = tail("slide-pink.jsonl", 2_000_000).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((j: any) => j && Date.parse(j.at) >= since);
  const flags = new Set(tail("sitrep-flags.jsonl", 400_000).map((l) => { try { return String(JSON.parse(l).id); } catch { return ""; } }));
  const tickers = new Set<string>(); for (const r of refs) if (r.ticker) tickers.add(String(r.ticker)); for (const r of calls) tickers.add(String(r.ticker)); for (const k of Object.keys(done)) { const tk = String(done[k]?.ticker || ""); if (tk && windowStart697(tk) >= since) tickers.add(tk); }
  const out: SkipLine[] = [];
  for (const tk of tickers) {
    const ws = windowStart697(tk); if (!(ws >= since) || ws > Date.now()) continue;
    const asset = /^KXBTC/.test(tk) ? "btc" : /^KXGOLD/.test(tk) ? "gold" : ""; if (!asset) continue;
    const win = `${pt(new Date(ws).toISOString()).replace(/:00 /, " ")} window`;
    const D0 = Object.entries(done).filter(([, v]) => String(v?.ticker) === tk).map(([k, v]) => ({ book: /:recon-rjnp$/.test(String(k)) ? "recon-rjnp" /* her delayed-hour book rides under main's id (fix626/674) */ : String(k).split(":")[1], ...v }));
    const owner = D0.find((x) => !/takes this hour live|this hour is|sits this hour|off this hour/i.test(String(x.reason || "")));
    const off = D0.filter((x) => x !== owner && x.book !== owner?.book && /takes this hour live|this hour|off/i.test(String(x.reason || ""))).map((x) => NAME[x.book] || x.book);
    const myIdeas = ideas.filter((j) => j.ticker === tk);
    const runner = (() => { const j = myIdeas.find((x) => Array.isArray(x.ideas) && x.ideas.length > 1); if (!j) return ""; const r2 = j.ideas[1]; return `${pt(j.at)} runner-up: ${side(r2.side)} ${r2.label} (${String(r2.door || "").slice(0, 90)})`; })();
    const bookRefs = refs.filter((r) => r.ticker === tk);
    let text = "", first = "", took = false, bk = "";
    if (owner) {
      bk = NAME[owner.book] || owner.book;
      if (owner.status === "filled" || owner.paid) { took = true; text = `${bk} TOOK IT: ${side(owner.side)} at ${pt(owner.at)}${owner.paid ? `, paid ${Math.round(Number(owner.paid) * 100)}c` : ""}`; }
      else { text = `${bk} SKIPPED its ${side(owner.side)} (${owner.status || "not sent"})`; first = String(owner.firstReason || owner.reason || "no reason written"); if (owner.reason && owner.reason !== owner.firstReason) first += ` | last: ${String(owner.reason).slice(0, 160)}`; }
    } else {
      const myCalls = calls.filter((r) => r.ticker === tk).sort((a, b) => String(a.at).localeCompare(String(b.at)));
      const r0 = bookRefs.filter((r) => LIVE.includes(String(r.book))).sort((a, b) => String(a.at).localeCompare(String(b.at)))[0];
      if (myCalls.length) { const c = myCalls[0]; bk = [...new Set(myCalls.filter((x) => Math.abs(Date.parse(x.at) - Date.parse(c.at)) < 5000 && x.side === c.side).map((x) => NAME[x.lane] || x.lane))].join(" + ");
        const sp = slides.filter((x) => String(x.id).startsWith(tk + ":")).sort((a, b) => String(a.at).localeCompare(String(b.at)))[0]; // the copier's pink / climb / slide holds write here (fix464 / fix560 / fix658)
        if (sp) { text = `${bk} called ${side(c.side)} at ${pt(c.at)} (${String(c.label || "").slice(0, 70)}) - HELD AT THE WIRE, never sent`; first = `${pt(sp.at)} ${String(sp.why || "").slice(0, 230)}`; }
        else { text = `${bk} called ${side(c.side)} at ${pt(c.at)} (${String(c.label || "").slice(0, 70)}) but THE COPIER NEVER TRIED IT - no live record. Flag this one.`; first = r0 ? `${pt(r0.at)} ${NAME[r0.book] || r0.book}: ${String(r0.rule || "").slice(0, 200)}` : "no wall recorded"; } }
      else if (r0) { bk = NAME[r0.book] || r0.book; text = `NO CALL - her walls said no from the first read`; first = `${pt(r0.at)} ${bk} ${side(r0.side)}: ${String(r0.rule || "").slice(0, 220)}${r0.ask ? ` (ask ${Math.round(Number(r0.ask) * 100)}c)` : ""}`; }
      else continue;
    }
    if (off.length) text += ` · off this hour: ${[...new Set(off)].join(", ")}`;
    const id = `${tk}:${bk}`;
    out.push({ id, ticker: tk, asset, window: win, book: bk, took, text, first, runnerUp: runner, flagged: flags.has(id) });
  }
  out.sort((a, b) => windowStart697(b.ticker) - windowStart697(a.ticker) || a.asset.localeCompare(b.asset));
  G.__skip697 = { at: Date.now(), h: hours, v: out };
  return out;
}
export function flagSkip697(id: string, note: string, line: string): boolean {
  try { appendFileSync(D("sitrep-flags.jsonl"), JSON.stringify({ at: new Date().toISOString(), id: String(id).slice(0, 120), note: String(note || "").slice(0, 500), line: String(line || "").slice(0, 600) }) + "\n"); if (G.__skip697) G.__skip697.at = 0; return true; } catch { return false; }
}
