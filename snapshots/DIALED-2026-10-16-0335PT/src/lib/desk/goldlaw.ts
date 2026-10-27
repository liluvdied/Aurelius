// HER GOLD LAWS (Oct 15, Love), gold on her live 5M twin decides ONLY by these. Pure functions, no I/O, tested on their own.
//
//  "a break of any band is a trade in that direction / red candle broke through a band & falling away = trade down / green
//   candle broke through a band & shooting up = trade up / a rejection off of the green pivot zone is a long / a rejection off
//   the red pivot zone is a short / nothing else no exceptions"  +  "any band"  +
//  "if price breaks UP through a band if it starts falling BACK down in the same candle, it doesn't really count / whichever
//   direction the candle initially broke takes precedence / if it breaks and falls thru on a fresh candle, that is the
//   direction"  +  "don't have her trade the last direction of a break anywhere... she could long directly into an unbroken
//   band above"
//
// Candles are 5m. BREAK vs TAP is her own body law (Oct 13, Love: "a candle that CLOSES through a band (any amount) = the
// break... a tap / wick through a band whose body stays on its side = the rejection"). No distances, no numbers. In order:
//  1) THIS 5m candle: a REJECTION (wick reached an unbroken band, body - open and price now - on its side -> away from the
//     band; green zone 5m S1/S2 or any band below = LONG, red zone 5m R1/R2 or any band above = SHORT; pink PP both ways)
//     and/or a BREAK (first 1m candle that closed through a band -> that direction; a fall-back later in the same 5m candle
//     doesn't count). If both, THE CLOSEST BAND TO PRICE DECIDES (Love, Oct 15: "trade off of the closest band").
//  2) Else the 5m candle that JUST closed, the same way (one candle back only - never an older break).
//  Anything else = no gold trade.

export type GLine = { name: string; price: number };
export type GBar = { o: number; h: number; l: number; c: number };
export type GoldCall = {
  side: "up" | "down";
  kind: "green-reject" | "red-reject" | "break-up" | "break-down";
  label: string;
  band: GLine;
  floor?: number;
  ceil?: number;
  from: "this candle" | "rejection" | "last candle";
};

/** The first band a 5m candle broke - a 1m candle CLOSING through it from the side the 5m candle opened on - and the direction. */
export function firstBreak(L: GLine[], open: number, closes: number[]): { side: "up" | "down"; band: GLine } | null {
  if (!(open > 0)) return null;
  for (const p of closes) {
    let hit: { side: "up" | "down"; band: GLine } | null = null;
    for (const l of L) {
      if (open < l.price && p > l.price && (!hit || Math.abs(l.price - open) < Math.abs(hit.band.price - open))) hit = { side: "up", band: l };
      if (open > l.price && p < l.price && (!hit || Math.abs(l.price - open) < Math.abs(hit.band.price - open))) hit = { side: "down", band: l };
    }
    if (hit) return hit;
  }
  return null;
}

type Candle = { open: number; low: number; high: number; close: number };
function candleOf(open: number, bars: GBar[], tick?: number): Candle | null {
  if (!(open > 0)) return null;
  const xs = bars.flatMap((x) => [x.l, x.h]);
  if (tick && tick > 0) xs.push(tick);
  if (!xs.length) return null;
  const close = tick && tick > 0 ? tick : bars[bars.length - 1].c;
  return { open, low: Math.min(open, ...xs), high: Math.max(open, ...xs), close };
}
// ZONE REJECTION = MOVING AWAY FROM THE ZONE (Oct 16 ~4:45 PM PT, Love: "*rejection* off of green zone = long / *rejection* off
// of red zone = short ... fix her please"). At 4:30 PM BTC a red 5m candle falling through the green zone ($51 under S1, through
// -2σ) read as "Rejected up off the green 5m zone" = LONG. A green-zone rejection now needs a RISING 5m candle (close over its
// open) and a red-zone rejection a FALLING one; a candle moving through the zone the other way is not a rejection - the break rules
// decide. Last candle's zone rejection also stands only while THIS 5m candle isn't moving back against it.
// A band a 1m candle CLOSED through inside this 5m candle was broken there, so it can't also be a rejection (her body law).
function rejection(L: GLine[], k: Candle, tick: number, from: GoldCall["from"], closes: number[] = []): GoldCall | null {
  const broke = (px: number) => closes.some((c) => (k.open < px ? c > px : c < px));
  const s1 = L.find((l) => l.name === "5m S1");
  const s2 = L.find((l) => l.name === "5m S2");
  const r1 = L.find((l) => l.name === "5m R1");
  const r2 = L.find((l) => l.name === "5m R2");
  const zone = new Set(["5m S1", "5m S2", "5m R1", "5m R2"]);
  const cands: { c: GoldCall; px: number }[] = [];
  if (s1) {
    const floor = s2 ? s2.price : s1.price;
    if (k.low <= s1.price && k.open > floor && k.close > floor && tick > floor && k.close > k.open && (k.open > s1.price || k.low < k.open) && !closes.some((c) => c < floor)) cands.push({ c: { side: "up", kind: "green-reject", label: "Rejected up off the green 5m zone", band: s1, floor, from }, px: s1.price });
  }
  if (r1) {
    const ceil = r2 ? r2.price : r1.price;
    if (k.high >= r1.price && k.open < ceil && k.close < ceil && tick < ceil && k.close < k.open && (k.open < r1.price || k.high > k.open) && !closes.some((c) => c > ceil)) cands.push({ c: { side: "down", kind: "red-reject", label: "Rejected down off the red 5m zone", band: r1, ceil, from }, px: r1.price });
  }
  for (const l of L) {
    if (zone.has(l.name) || broke(l.price)) continue;
    if (k.low <= l.price && k.open > l.price && k.close > l.price && tick > l.price) cands.push({ c: { side: "up", kind: "green-reject", label: `Rejected up off ${l.name}`, band: l, floor: l.price, from }, px: l.price });
    if (k.high >= l.price && k.open < l.price && k.close < l.price && tick < l.price) cands.push({ c: { side: "down", kind: "red-reject", label: `Rejected down off ${l.name}`, band: l, ceil: l.price, from }, px: l.price });
  }
  return cands.length ? cands.sort((a, b) => Math.abs(tick - a.px) - Math.abs(tick - b.px))[0].c : null;
}

function goldLawRaw(
  L: GLine[],
  tick: number,
  cur: { open: number; bars: GBar[] },
  prev: { open: number; bars: GBar[] } | null,
  _last1m?: GBar,
  broken: { name: string; side: "up" | "down" }[] = [],
): GoldCall | null {
  if (!(tick > 0)) return null;
  // NO ONE-MINUTE CLOSE ON A BREAK (Oct 16 ~1:20 AM PT, Love: "no. one. minute. close. on. break. stop. ignoring. me." +
  // "PRICE = FALLING / PRICE = BROKE THROUGH BAND ===== SHORT" + "short. the. moment. price. breaks." + "if a candle is red,
  // AND broke through the band, THE TRADE IS SHORT. THE INVERSE APPLIES."). A break is PRICE through the band, right now -
  // nothing waits for a 1m close. A break is the trade; no rejection or closer band can override it.
  const brkAt = (from: number, last: boolean): GoldCall | null => {
    if (!(from > 0) || tick === from) return null;
    const dn = tick < from;
    const crossed = L.filter((l) => (dn ? from > l.price && tick < l.price : from < l.price && tick > l.price));
    if (!crossed.length) return null;
    const band = crossed.sort((x, y) => Math.abs(tick - x.price) - Math.abs(tick - y.price))[0];
    return { side: dn ? "down" : "up", kind: dn ? "break-down" : "break-up", label: `${dn ? "Falling, broke down through" : "Rising, broke up through"} ${band.name}${last ? " (since last 5m)" : ""}`, band, from: last ? "last candle" : "this candle" };
  };
  // 1) BREAK in this 5m candle: price now through a band the candle opened on the other side of = that direction, now.
  const bNow = brkAt(cur.open, false);
  // BREAK, THEN A TAP OF THE NEXT BAND = TRADE THE REJECTION (Oct 16 ~4:55 PM PT, Love: "i want her to trade the rejection off of a
  // band if it does reject, and i want her to trade the break if it does break" - yes to "break up through one band, then tap the
  // next band from below = short; mirror = long"). 4:45 PM BTC: broke up through S1, tapped -2σ from below, back under it.
  // If this candle broke a band and has since reached the NEXT band beyond it and price is back on this side of that band, the
  // later event - the rejection - is the trade. Still beyond the next band = that's a break of it (the break stands).
  if (bNow) {
    const kB = candleOf(cur.open, cur.bars, tick);
    const up = bNow.side === "up";
    const taps = kB ? L.filter((l) => (up ? l.price > tick && kB.high >= l.price : l.price < tick && kB.low <= l.price)) : [];
    if (taps.length) {
      const T = taps.sort((x, y) => Math.abs(tick - x.price) - Math.abs(tick - y.price))[0];
      return up
        ? { side: "down", kind: "red-reject", label: `Broke up through ${bNow.band.name}, tapped ${T.name} from below and rejected`, band: T, ceil: T.price, from: "rejection" }
        : { side: "up", kind: "green-reject", label: `Broke down through ${bNow.band.name}, tapped ${T.name} from above and rejected`, band: T, floor: T.price, from: "rejection" };
    }
    return bNow;
  }
  // NO LONG ON A FALLING CANDLE (Love: "i told you to NOT have her long on a FALLING CANDLE") EXCEPT A REAL REJECTION (Love:
  // "she can long on a falling candle IF it's at a band and REJECTS"): while THIS 5m candle is falling, a gold long stands
  // only when a closed 1m candle in it wicked to the band and closed back above it.
  const falling = cur.open > 0 && tick < cur.open;
  const rejected = (c: GoldCall) => cur.bars.some((b) => b.l <= c.band.price && b.c > c.band.price);
  // PIVOT BANDS ARE 5M, NOT 1M (Oct 16 ~1:38 AM PT, Love: "i don't want her to base it off the 1 minute if it is not a session
  // band. the 1M pivot bands are not the same as a 5M."): at a 5m pivot band (pink PP, green S1/S2, red R1/R2) the rejection
  // is judged on the 5m candle itself - no 1m wick-and-close. The 1m check stays for session bands (VWAP, σ bands).
  const pivot = (c: GoldCall) => /^5m (PP|S1|S2|R1|R2)$/.test(c.band.name);
  const okNow = (c: GoldCall | null) => (c && falling && c.side === "up" && !(c.kind === "green-reject" && (pivot(c) || rejected(c))) ? null : c);
  const ok = (c: GoldCall | null) => (c && falling && c.side === "up" ? null : c);
  // 2) REJECTION in this 5m candle (wick reached the band, price back on its side) - the band nearest price.
  const kNow = candleOf(cur.open, cur.bars, tick);
  const rNow = okNow(kNow ? rejection(L, kNow, tick, "rejection", []) : null);
  if (rNow) return rNow;
  // 3) Looking back, as before: rejection vs break - THE CLOSEST BAND DECIDES (Oct 15, Love: "trade off of the closest band").
  //    Breaks here: a band price has gone through since the last 5m candle opened, or a BROKEN BAND (Oct 16 ~2:05 AM PT, Love:
  //    "a 5M candle that breaks through a band is considered a broken band" ... "until a new 5M candle forms and closes on the
  //    other side of it" / "a break is only valid if price is currently on the other side of the band" / "PRICE = OUR SIDE OF
  //    THE BAND. EVERY TIME"): a band a closed 5m candle closed through stays broken until a later 5m candle closes back on the
  //    other side; it is a valid break only while price is on the break side right now. (Love chose "Remove it": no extra
  //    "this candle moving the same way" test.)
  const nearer = (x: GoldCall | null, y: GoldCall | null) => (!x ? y : !y ? x : Math.abs(tick - x.band.price) <= Math.abs(tick - y.band.price) ? x : y);
  let bLast: GoldCall | null = prev ? brkAt(prev.open, true) : null;
  for (const bb of broken) {
    const band = L.find((l) => l.name === bb.name);
    if (!band) continue;
    if (bb.side === "down" ? tick < band.price : tick > band.price) {
      bLast = nearer(bLast, { side: bb.side, kind: bb.side === "up" ? "break-up" : "break-down", label: `Broken ${band.name} (price still ${bb.side === "up" ? "above" : "below"})`, band, from: "last candle" });
    }
  }
  const kLast = prev && prev.bars.length ? candleOf(prev.open, prev.bars) : null;
  const rLast0 = kLast ? rejection(L, kLast, tick, "rejection", []) : null;
  const rLast = rLast0 && rLast0.zone && (rLast0.side === "up" ? tick < cur.open : tick > cur.open) ? null : rLast0;
  return nearer(ok(rLast), ok(bLast));
}

// The same laws at the Kalshi door. Inside the 5m candle she booked in, nothing flips (a fall-back in the same candle doesn't
// count). On a FRESH 5m candle: price back through the booked band the other way on that candle's color, or
// the booked zone/band broken from the other side, flips her to that side.
export function goldDoor(
  call: { kind: string; bandPx: number; floor?: number; ceil?: number; frame?: number },
  side: "up" | "down",
  tick: number,
  fiveOpen: number,
  nowFrame: number,
): "up" | "down" {
  if (!(tick > 0) || !(fiveOpen > 0)) return side;
  if (Number(call.frame) > 0 && nowFrame === Number(call.frame)) return side;
  if (call.kind === "green-reject" && Number(call.floor) > 0 && tick < Number(call.floor) && tick < fiveOpen) return "down";
  if (call.kind === "red-reject" && Number(call.ceil) > 0 && tick > Number(call.ceil) && tick > fiveOpen) return "up";
  if (call.kind === "break-up" && tick < call.bandPx && tick < fiveOpen) return "down";
  if (call.kind === "break-down" && tick > call.bandPx && tick > fiveOpen) return "up";
  return side;
}

// BAND LOCK (snapshot) (Oct 16 ~1:10 PM PT, Love: "0 OF OUR BOOKS ARE TO NOT HAVE THAT INCLUDED IN THEIR DNA. NEVER AGAIN."):
// every call trades the side of the closest band price is on - added to this saved version so restoring it keeps the hole shut.
export function closestSide(L: GLine[], tick: number): "up" | "down" | null {
  if (!(tick > 0) || !L.length) return null;
  const near = L.reduce((a, b) => (Math.abs(tick - b.price) < Math.abs(tick - a.price) ? b : a));
  return tick < near.price ? "down" : tick > near.price ? "up" : null;
}
export function goldLaw(...args: any[]): GoldCall | null {
  // NO FLIP (Oct 16 ~2:20 PM PT, Love: "Remove the flip completely"): her setup's side stands; the last gate refuses wrong-side orders.
  return (goldLawRaw as any)(...args) as GoldCall | null;
}
