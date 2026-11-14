// fix1093 PAPER ONLY TAKES TRADES LIVE IS ALLOWED TO TAKE (Love Nov 11 2026 5:41 PM PT: "i need paper to ONLY TAKE TRADES THAT LIVE IS ALLOWED TO TAKE. WITH THE FLOOR. WITH THE RULES. WITH everything" +
// Love Nov 10 2026 6:37 PM PT: "get paper to take trades UNDER THE SAME RULES. I CANT TRUST THE PAPER RECORDS IF THEY ARE TAKING TRADES THAT LIVE IS PROHIBITED FROM TAKING.").
// Her 5:00:27 PM Nov 11 gold long: paper booked "Rejected up off +2σ" and 0.2 s later the wall at the wire refused the live order ("PAST THE RED ZONE"), all window long.
// HOW: before paper books a main or rejection trade on gold or BTC, it asks the two judges that stand between a paper booking and the Kalshi order -
//   1) THE WALL AT THE WIRE (bandlock.ts wireWall) - the same function the live order meets, asked as this book's own order, and
//   2) HER LAST JUDGE (kalshi-live.server.ts judgeOrder601, in full: her umpire, a fresh tick, her colour and her side, the Bollinger block, the pink break, her walls, her door).
// Either says no = paper does not book, and the reason is written to her skip log. Nothing here holds a rule of its own: both answers come from the functions live itself runs.
// The wall at the wire and her last judge are not changed. The wall is asked without a log line (band-lock.jsonl and wire-pass.jsonl stay a record of real orders only).
import { wireWall } from "./bandlock";
const G1093 = globalThis as any;
export const WAIT1093 = "asking her last judge (fix1093)";
const covers1093 = (lane: string, asset: string, ticker: string) => (lane === "recon-tog" || lane === "recon-rej") && (asset === "gold" || asset === "btc") && /^KX(GOLD|BTC)15M-/.test(String(ticker).toUpperCase());
/** the wall at the wire, asked as this book's own opening order (the wall tells main / rejection orders apart by her copier's record of the order on its way) */
export function wireAsk1093(lane: string, side: string, ticker: string, label: string): string {
  const t = String(ticker).toUpperCase(), key = `${t}:${lane}:ask1093`, had = G1093.__doneDoc, doc = had?.v, own = doc && typeof doc === "object" && !Array.isArray(doc);
  const prevLabel = G1093.__wireLabel619, prevAsk = G1093.__ask1093;
  try { if (own) doc[key] = { side, status: "asking" }; else G1093.__doneDoc = { v: { [key]: { side, status: "asking" } } }; /* her copier's record is not in memory (it is not running): the wall is still asked as this book's order */ G1093.__ask1093 = true; G1093.__wireLabel619 = String(label || ""); return String(wireWall(t, side === "up" ? "up" : "down") || ""); }
  catch (e) { return `THE WALL AT THE WIRE could not be asked (${String(e).slice(0, 80)})`; }
  finally { if (own) delete doc[key]; else G1093.__doneDoc = had; G1093.__ask1093 = prevAsk; G1093.__wireLabel619 = prevLabel; }
}
/** "" = live is allowed to take this trade right now; WAIT1093 = her last judge is being asked (the answer is there on her next look); anything else = the reason live is not allowed */
export function liveAllows1093(lane: string, asset: string, side: string, ticker: string, label: string, now: number = Date.now()): string {
  if (!covers1093(lane, asset, ticker)) return "";
  try {
    const w = wireAsk1093(lane, side, ticker, label); if (w) return "LIVE IS NOT ALLOWED (fix1093) - the wall at the wire: " + w;
    const C = (G1093.__judge1093 ||= {}) as Record<string, { at: number; why: string; pending: boolean; since?: number }>, key = `${ticker}|${lane}|${side}|${label}`, c = C[key];
    if (c && !c.pending && now - c.at <= 1500) return c.why ? "LIVE IS NOT ALLOWED (fix1093) - her last judge: " + c.why : "";
    if (c && c.pending && now - Number(c.since || 0) > 5000) return "LIVE IS NOT ALLOWED (fix1093) - her last judge has not answered for 5 s"; // never a silent wait: after 5 s it is a written reason
    if (!c || !c.pending) { C[key] = { at: c?.at || 0, why: c?.why || "", pending: true, since: now };
      (async () => { let why = ""; try { why = String((await (await import("./kalshi-live.server")).judgeOnly1093(String(ticker), side, String(label || ""), lane)) || ""); } catch (e) { why = `her last judge could not be asked (${String(e).slice(0, 80)})`; } C[key] = { at: Date.now(), why, pending: false }; for (const k of Object.keys(C)) if (!C[k].pending && Date.now() - C[k].at > 120000) delete C[k]; })();
    }
    return WAIT1093;
  } catch (e) { return `LIVE IS NOT ALLOWED (fix1093) - could not ask (${String(e).slice(0, 80)})`; }
}
