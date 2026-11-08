// fix705 AT THE PINK TAP - LOG ONLY (Love Nov 5 2026 ~3:54 AM PT: "and gold never longing a pink rejection, can you update her loggings to say why she didn't enter AT the
// rejection of pink? not that it was too high up? that is the reason we need logged."). The moment price taps her pink (within 5% of its session channel) and turns back the
// way it came (7.5% of the channel off pink, no break), this writes - for every book but delayed - why she did NOT enter at that second: her read not formed yet (no 2/5m
// candle flipped, wick back off pink under her 15%), or the first wall that held the read (pink cushion, 55%, thirds, floor, $10 level...), with the ask at the tap. It goes into
// her refusal ledger (where "pink-tap") so SITREP shows the at-the-tap reason, and into data/pink-tap-705.jsonl. LOG ONLY: no order, book, wall, size or switch is touched.
import { appendFileSync, closeSync, existsSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { join } from "node:path";

const G = globalThis as any;
const D = (f: string) => join(process.cwd(), "data", f);
export type Tap705 = { zone: boolean; from: number; last: number; touchAt: number };
/** the tap state machine, pure: returns "up" (came down to pink from above and turned back up = her long), "down" (the mirror), or "" */
export function tapStep705(s: Tap705, spot: number, pink: number, W: number, now: number): "up" | "down" | "" {
  if (!(spot > 0) || !(pink > 0) || !(W > 0)) return "";
  const d = spot - pink, inZ = Math.abs(d) <= 0.05 * W;
  let ev: "up" | "down" | "" = "";
  if (inZ && !s.zone) { s.zone = true; s.from = Math.sign(s.last - pink) || Math.sign(d); s.touchAt = now; }
  else if (s.zone && Math.abs(d) >= 0.075 * W) { if (Math.sign(d) === s.from) ev = s.from > 0 ? "up" : "down"; s.zone = false; } // back the way it came = a rejection; through = a break (not logged)
  if (!inZ && !s.zone) s.last = spot; else if (!s.zone) s.last = spot;
  return ev;
}
function tail(f: string, n = 600000): string { try { const st = statSync(f), fd = openSync(f, "r"), len = Math.min(n, st.size), b = Buffer.alloc(len); readSync(fd, b, 0, len, st.size - len); closeSync(fd); const s = b.toString("utf8"); return st.size > len ? s.slice(s.indexOf("\n") + 1) : s; } catch { return ""; } }
const BOOKS = ["recon-tog", "recon-rej", "recon-rjnp", "recon-rjt3"];
function pinkNow(asset: string): number { const c = (G.__tap705Pv ||= { at: 0, j: null as any }); try { if (Date.now() - c.at > 3000) { c.at = Date.now(); const p = D("pivot-now.json"); c.j = existsSync(p) && Date.now() - statSync(p).mtimeMs < 60000 ? JSON.parse(readFileSync(p, "utf8")) : null; } } catch { c.j = null; } return Number(c.j?.[asset]?.["5m"]?.pp) || 0; }
export async function pinkTapTick705(assets: Record<string, any> | null | undefined) {
  if (!assets) return;
  try {
    const now = Date.now(), S = (G.__tap705 ||= {}) as Record<string, Tap705>, Q = (G.__tap705Q ||= []) as any[], once = (G.__tap705Once ||= {}) as Record<string, number>;
    for (const id of ["btc", "gold"]) {
      const a = assets[id], spot = Number(a?.spot) || 0, vw = Number(a?.vwap1m?.vwap) || 0, sd = Number(a?.vwap1m?.stdev) || 0, pink = pinkNow(id), m = a?.market;
      if (!(spot > 0) || !(vw > 0) || !(sd > 0) || !(pink > 0) || !m?.ticker) continue;
      const lines = [-3, -2, -1, 0, 1, 2, 3].map((k) => vw + k * sd), top = lines.find((x) => x > pink), bot = [...lines].reverse().find((x) => x < pink);
      if (top === undefined || bot === undefined) continue;
      const side = tapStep705((S[id] ||= { zone: false, from: 0, last: spot, touchAt: 0 }), spot, pink, top - bot, now);
      if (!side || once[`${m.ticker}:${side}`]) continue;
      once[`${m.ticker}:${side}`] = now; for (const k of Object.keys(once)) if (now - once[k] > 3 * 3600000) delete once[k];
      let flipped: boolean | null = null, wick: boolean | null = null;
      try { const bl = await import("./bandlock"); const L = [...[-3, -2, -1, 1, 2, 3].map((k) => ({ name: `${k > 0 ? "+" : ""}${k}σ`, price: vw + k * sd, unit: 0 })), { name: "session VWAP", price: vw, unit: 0 }, { name: "5m PP", price: pink, unit: 0 }]; flipped = bl.turnFlip530(id, side, spot); wick = bl.rej668(id, side, spot, L as any); } catch {}
      Q.push({ at: now, asset: id, ticker: String(m.ticker), side, pink, spot, ask: Number(side === "up" ? m.yesAsk : m.noAsk) || 0, flipped, wick, W: top - bot });
    }
    // 20 s after each tap: what each book said at that second (its read and walls write their own lines; this collects them, closest to the tap)
    while (Q.length && now - Q[0].at >= 20000) {
      const e = Q.shift(); const out: Record<string, string> = {};
      const led = tail(D("refusal-ledger.jsonl")).split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((j) => j && j.ticker === e.ticker && j.where !== "pink-tap" && Math.abs(Date.parse(j.at) - e.at) <= 30000);
      let done: Record<string, any> = {}; try { done = JSON.parse(readFileSync(D("live-book-done.json"), "utf8")); } catch {}
      for (const bk of BOOKS) {
        if (bk === "recon-rjt3" && !led.some((j) => j.book === bk || j.lane === bk)) continue; // only once CHANGE-50 is in
        let why = "";
        const took = Object.entries(done).find(([k, v]: [string, any]) => k.startsWith(e.ticker + ":" + bk + ":") && v?.side === e.side && ["filled", "partial"].includes(String(v?.status)) && Math.abs(Date.parse(String(v?.at)) - e.at) <= 60000);
        if (took) why = "ENTERED at the tap";
        else if (bk === "recon-rjnp") why = "REJ ONLY · NO PINK never trades pink (by design, fix643)";
        else {
          const mine = led.filter((j) => (j.book === bk || j.lane === bk) && j.side === e.side).sort((x, y) => Math.abs(Date.parse(x.at) - e.at) - Math.abs(Date.parse(y.at) - e.at))[0];
          if (mine) why = `her read "${String(mine.setup || mine.label || "").slice(0, 80)}" held by: ${String(mine.rule || "").slice(0, 220)}`;
          else why = `NO READ AT THE TAP - ${e.flipped === false ? "no 2/5m candle had flipped her way yet" : e.flipped ? "her candle had flipped" : "candle unknown"}; ${e.wick === false ? "the wick back off pink was under her 15% of the channel" : e.wick ? "the 15% wick back off pink was there" : "wick unknown"}${e.flipped && e.wick ? " - her read named no setup at this second" : ""}`;
        }
        out[bk] = why;
        try { const rl = await import("./refusal-ledger"); rl.refusal661({ where: "pink-tap", lane: bk, asset: e.asset, ticker: e.ticker, side: e.side, label: `AT THE PINK TAP (pink ${e.pink.toFixed(2)})`, rule: `AT THE PINK TAP (fix705): ${why}`, ask: e.ask, spot: e.spot }); } catch {}
      }
      try { appendFileSync(D("pink-tap-705.jsonl"), JSON.stringify({ at: new Date(e.at).toISOString(), asset: e.asset, ticker: e.ticker, side: e.side, pink: e.pink, spot: e.spot, ask: e.ask, channel: Math.round(e.W * 100) / 100, flipped: e.flipped, wick15: e.wick, books: out }) + "\n"); } catch {}
    }
  } catch {}
}
