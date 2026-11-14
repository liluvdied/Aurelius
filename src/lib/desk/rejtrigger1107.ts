// fix1107 MAIN'S REJECTION TRIGGERS, ONE SHARED CHECK FOR HER OTHER REJECTION BOOKS (Love Nov 13 2026 8:40 PM PT: "we need to get the inner mechanics to match the rejections that main takes" +
// 11:30 PM PT: "the push / flip / born candle / wick rejection mechanics onto the rej. books so it takes all of the same entries, that aren't breaks ... all of the same triggers need to apply to those
// before they go live" + Nov 14 2026 12:04 AM PT: "you can just work on establishing the mechanics we talked about for all of the other rej books").
// Her ETH, ETH.2, BTC.2, SOL and DOGE books each carried their own trigger: the push measured from the 5m candle's low / high, the 2m candle against its open, and a 20% no-flip rejection.
// Main's triggers (bandlock.ts), as they stand, with no feed and no clock in them:
//   1 HER SIDE OF THE BAND - price is on the trade's side of the line it enters off (fix951). Always.
//   2 PUSH OFF THE BAND - price is her push past the BAND itself, or past this 5m candle's own low / high when the candle stopped short of the band, whichever is nearer price
//     (pushLabel653, fix1030: "its not the candles open she needs to push past. its the band itself"), with her candle her colour: the 2m or the 5m candle her push off its own
//     low (long) / high (short) - a flip or a candle born her colour, never measured from the open (herColour949 / twoMinHer653, fix1032).
//   3 WICK REJECTION - this 5m candle's low / high came within 10% of the channel of the band and price has pulled back from that extreme by her wick amount (rejBand668, fix1036 / fix1071).
//     It needs no colour: "wick rejection is the ONLY instance she may enter without the candle our color". The wick amount is handed in: main's own $25 for BTC, 10% of the channel elsewhere
//     ("candle wick rejection of 10% = ENTER").
// Pure: the book hands in its own candle numbers, its own band, its own push amount. Each book's lines, walls and picks are untouched; this only answers "is the trigger met".
export type Trig1107 = { side: "up" | "down"; spot: number; band: number; lo2: number; hi2: number; lo5: number; hi5: number; push: number; W: number; wick: number };
/** "" = main's trigger is met (how tells which); else the reason it is not */
export function mainRejWhy1107(x: Trig1107): { ok: boolean; how: "push" | "wick" | ""; why: string } {
  try {
    const s = x.side === "up" ? 1 : -1, d = (a: number, b: number) => s * (a - b);
    if (!(x.spot > 0 && x.band > 0 && x.W > 0 && x.push > 0 && x.wick > 0)) return { ok: false, how: "", why: "no numbers" };
    const ext5 = s > 0 ? x.lo5 : x.hi5, ext2 = s > 0 ? x.lo2 : x.hi2;
    if (!(ext5 > 0) || !(ext2 > 0)) return { ok: false, how: "", why: "no live candle" };
    if (!(d(x.spot, x.band) > 0)) return { ok: false, how: "", why: "price is not on her side of the band" };
    const ref = s > 0 ? Math.max(x.band, ext5) : Math.min(x.band, ext5);
    const pushed = d(x.spot, ref) >= x.push - 1e-9;
    const colour = d(x.spot, ext2) >= x.push - 1e-9 || d(x.spot, ext5) >= x.push - 1e-9;
    if (pushed && colour) return { ok: true, how: "push", why: "" };
    if (Math.abs(ext5 - x.band) <= 0.10 * x.W + 1e-9 && d(x.spot, ext5) >= x.wick - 1e-9) return { ok: true, how: "wick", why: "" };
    return { ok: false, how: "", why: !pushed ? "her push off the band is not met" : "her candle is not her colour" };
  } catch { return { ok: false, how: "", why: "error" }; }
}
export function mainRej1107(x: Trig1107): boolean { return mainRejWhy1107(x).ok; }
