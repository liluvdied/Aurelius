// fix1084 HER PINK SLIDE RULE ON EVERY ASSET (Love Nov 10 2026 5:21 PM PT: "she correctly shorted gold on the pink slide. she did the opposite on xrp. she longed on a pink slide." + 5:33 PM PT: "yes. pink slide rule goes to all assets."):
// the pink slide / climb rule gold and BTC already trade by (engine.ts slideHoldBtc423 / climbHold464 / slideRun515 and the fix658 + fix677 "only off the pink while it slides" hold), for every book that reads
// its own candles: XRP 15m Kalshi, XRP / ETH / BTC 5m, the 5m paper books (all through xrpRead961), her ETH, ETH.2, BTC.2, SOL and DOGE reads. Both ways: a slide under the pink holds longs, a climb over the pink holds shorts.
// The maths below is the gold / BTC maths with the bands passed in (it never reads or writes main's own bands or samples); tools/pink-slide-all-1084.cjs fails if it ever answers differently from engine.ts on the same samples.
// Her words behind the rule: Love Oct 29 2026 10:03 PM PT "It's sliding when three candles or more have hit it and rejected on a down slope." + Nov 4 6:04 PM "lets lower the pink slide rule to 2 of them instead of 3 while pink is sloped up or down" +
// Oct 31 1:11 AM "she is to SHORT there ONLY until price breaks pink by 10% of the channel width" + Nov 7 2:24 PM "it doesn't need to physically tap pink either, just come down to it and reverse back up more than once" +
// Nov 4 6:09 PM "the pink slide rule dictates it is longs only while pink is on a slide up ... she waits til it gets to pink and rejects, enters on the flip/rejection like she normally would. inverse for shorts" + Oct 29 1:06 PM "it's for both sides".
export type Smp1084 = { t: number; p: number; pp: number };
export type Ln1084 = { name: string; price: number };
type Bar1084 = { t: number; o: number; h: number; l: number; c: number; v: number };
const chan1084 = (L: Ln1084[], p: number): number => { try { const S0 = L.filter((l) => Number(l.price) > 0 && /σ$|^session VWAP$|^fresh VWAP$/.test(String(l.name))); const a0 = S0.filter((l) => l.price > p).sort((x, y) => x.price - y.price)[0], b0 = S0.filter((l) => l.price < p).sort((x, y) => y.price - x.price)[0]; if (a0 && b0 && a0.price > b0.price) return a0.price - b0.price; } catch {} return 0; };
/** engine.ts slideHoldBtc423 (dir "slide": no long) / climbHold464 (dir "climb": no short) with the bands passed in. brk = her old break, used only when the channel cannot be read. */
export function pinkHold1084(sm: Smp1084[], S: { on: boolean }, now: number, L: Ln1084[], dir: "slide" | "climb", brk: number, nm = ""): string {
  const last = sm[sm.length - 1], sl = dir === "slide";
  if (!last || now - last.t >= 30000) return "";
  const W = chan1084(L, last.p), rel = W > 0 ? 0.10 * W : brk; // fix560 her 10% of the channel
  if (sl ? last.p > last.pp + rel : last.p < last.pp - rel) { S.on = false; return ""; } // her break through the pink frees it
  const near = (pp: number) => 0.1 * chan1084(L, pp); // fix945 near the pink counts
  const C: { hit: boolean; p: number; pp: number }[] = []; let b0 = -1;
  for (const x of sm) { const b = Math.floor(x.t / 300000); if (b !== b0) { b0 = b; C.push({ hit: false, p: x.p, pp: x.pp }); } const k = C[C.length - 1]; if (sl ? x.p >= x.pp - near(x.pp) : x.p <= x.pp + near(x.pp)) k.hit = true; k.p = x.p; k.pp = x.pp; }
  let run = 0, rejPp = 0, lastP = 0, sep = true;
  for (const c of C) { const n = near(c.pp); if (c.hit && (sl ? c.p < c.pp : c.p > c.pp)) { if (!(run > 0 && !sep)) { run = run > 0 && (sl ? c.p < lastP : c.p > lastP) ? run + 1 : 1; lastP = c.p; rejPp = c.pp; } sep = false; } if (sl ? c.p < c.pp - n : c.p > c.pp + n) sep = true; }
  const pkS = (() => { let r = 0, lp = 0, fpp = 0; for (const c of C) if (c.hit && (sl ? c.p < c.pp : c.p > c.pp)) { if (r > 0 && (sl ? c.p < lp : c.p > lp)) r++; else { r = 1; fpp = c.pp; } lp = c.p; } return sl ? rejPp < fpp : rejPp > fpp; })();
  const d = (x: number) => x.toFixed(x < 10 ? 5 : 2);
  if (run >= 2 && pkS) { S.on = true; return sl ? `${nm} SLIDE UNDER PINK: ${run} candles hit the pink and rejected on a down slope (last at ${d(rejPp)}) with price ${d(last.p)} under it - no long until price breaks up through pink by 10% of the channel (fix560).` : `${nm} CLIMB OVER PINK: ${run} candles hit the pink and rejected on an up slope (last at ${d(rejPp)}) with price ${d(last.p)} over it - no short until price breaks down through pink by 10% of the channel (fix560).`; }
  if (S.on) return sl ? `${nm} SLIDE UNDER PINK: price ${d(last.p)} is still under the pink (${d(last.pp)}) since her slide - no long until price breaks up through pink by 10% of the channel (fix560).` : `${nm} CLIMB OVER PINK: price ${d(last.p)} is still over the pink (${d(last.pp)}) since her climb - no short until price breaks down through pink by 10% of the channel (fix560).`;
  return "";
}
/** engine.ts slideRun515 with the bands passed in: three-plus rejections on the slope, no break release - a pink call goes one way only. rst0 = her old reset, used only when the channel cannot be read. */
export function pinkRun1084(sm: Smp1084[], now: number, dir: "down" | "up", L: Ln1084[], rst0: number): boolean {
  const last = sm[sm.length - 1];
  if (!last || now - last.t >= 30000) return false;
  const C: { hit: boolean; p: number; pp: number }[] = []; let b = -1;
  for (const x of sm) { const k0 = Math.floor(x.t / 300000); if (k0 !== b) { b = k0; C.push({ hit: false, p: x.p, pp: x.pp }); } const k = C[C.length - 1]; if (dir === "down" ? x.p >= x.pp : x.p <= x.pp) k.hit = true; k.p = x.p; k.pp = x.pp; }
  const W = chan1084(L, last.p), rst = W > 0 ? 0.10 * W : rst0;
  let run = 0, lastP = 0;
  for (const c of C) {
    if (dir === "down" ? c.p >= c.pp + rst : c.p <= c.pp - rst) { run = 0; lastP = 0; continue; }
    if (c.hit && (dir === "down" ? c.p < c.pp : c.p > c.pp)) { run = run > 0 && (dir === "down" ? c.p < lastP : c.p > lastP) ? run + 1 : 1; lastP = c.p; }
  }
  if (last && (dir === "down" ? last.p >= last.pp + rst : last.p <= last.pp - rst)) return false;
  return run >= 3;
}
/** engine.ts fix658 + fix663 + fix677: is this read off the pink, or a rejection (her trend side takes those during a slide)? */
export function offPink1084(side: string, label: string): boolean {
  const pink = /5m PP/.test(label) && (/reject/i.test(label) || (side === "up" ? /^(?:Break|Close) above 5m PP/ : /^(?:Break|Close) below 5m PP/).test(label));
  return pink || /^(Rejected (up|down) off |Failed break (above|below) |\dm flip - rejected (up|down) off |\dm rejection off |Tap-reject at |OG tap-reject (up|down) off |Fake-out turn (over|under) )/.test(label);
}
// the same pink her books already read (ethBands682: the 0.25 EMA of each 5m candle's (high + low + close) / 3 over the last 60 candles) and her session bands, read as they stood at each minute
const group1084 = (bs: Bar1084[], n: number): Bar1084[] => { const out: Bar1084[] = []; for (const b of bs) { const k = Math.floor(b.t / (n * 60)) * n * 60, x = out[out.length - 1]; if (x && x.t === k) { x.h = Math.max(x.h, b.h); x.l = Math.min(x.l, b.l); x.c = b.c; x.v += b.v; } else out.push({ ...b, t: k }); } return out; };
export function linesAt1084(bs: Bar1084[]): Ln1084[] {
  const L: Ln1084[] = []; if (bs.length < 40) return L;
  const last = bs[bs.length - 1], day = (t: number) => Math.floor(t / 86400), g5 = group1084(bs, 5); let sv = 0, sp = 0, sp2 = 0;
  for (const b of g5) { if (day(b.t) !== day(last.t)) continue; const tp = (b.h + b.l + b.c) / 3, w = Math.max(b.v, 1e-9); sv += w; sp += w * tp; sp2 += w * tp * tp; }
  if (sv > 0) { const vw = sp / sv, sd = Math.sqrt(Math.max(sp2 / sv - vw * vw, 0)); if (sd > 0) { L.push({ name: "session VWAP", price: vw }); for (const k of [1, 2, 3]) { L.push({ name: `+${k}σ`, price: vw + k * sd }); L.push({ name: `-${k}σ`, price: vw - k * sd }); } } }
  const b5 = g5.slice(-60);
  if (b5.length >= 10) { let ema = 0; b5.forEach((x, i) => { const pp = (x.h + x.l + x.c) / 3; ema = i === 0 ? pp : pp * 0.25 + ema * 0.75; }); L.push({ name: "5m PP", price: ema }); }
  return L;
}
const WALK1084 = 180, KEEP1084 = 1800; // minutes walked back so a slide that began earlier is still known; her samples cover 30 minutes, as main's do
type St1084 = { sm: Smp1084[]; Ss: { on: boolean }; Sc: { on: boolean }; L: Ln1084[] };
const push1084 = (st: St1084, b: Bar1084, pk: number, upto: number) => { const seq = b.c >= b.o ? [b.o, b.l, b.h, b.c] : [b.o, b.h, b.l, b.c]; seq.forEach((p, i) => { if (b.t + i * 15 <= upto) st.sm.push({ t: (b.t + i * 15) * 1000, p, pp: pk }); }); st.sm = st.sm.filter((x) => x.t >= (b.t - KEEP1084) * 1000); };
/** her slide / climb as it stands at `now` (seconds), walked candle by candle from the book's own minute bars. Pure but for a small cache of the finished minutes. */
export function pinkState1084(bs: Bar1084[], spot: number, now: number): { slide: string; climb: string; run: (dir: "down" | "up") => boolean } {
  const none = { slide: "", climb: "", run: () => false };
  try {
    const m0 = Math.floor(now / 60) * 60, done = bs.filter((b) => b.t < m0 && b.t <= now), cur = bs.filter((b) => b.t >= m0 && b.t <= now).slice(-1)[0];
    if (done.length < 45) return none;
    const k = spot / 80000, key = `${done[done.length - 1].t}|${done[done.length - 1].c}|${done[0].t}|${done.length}`;
    const G = globalThis as any, cache = (G.__pink1084 ||= new Map<string, St1084>()) as Map<string, St1084>;
    let st = cache.get(key);
    if (!st) {
      st = { sm: [], Ss: { on: false }, Sc: { on: false }, L: [] };
      const from = Math.max(0, done.length - WALK1084);
      for (let i = from; i < done.length; i++) { const pre = done.slice(Math.max(0, i + 1 - 1500), i + 1); if (pre.length < 45) continue; const L = linesAt1084(pre), pk = L.find((l) => l.name === "5m PP")?.price || 0; if (!(pk > 0)) continue;
        push1084(st, done[i], pk, done[i].t + 59); const at = (done[i].t + 45) * 1000 + 1000; pinkHold1084(st.sm, st.Ss, at, L, "slide", 8 * k); pinkHold1084(st.sm, st.Sc, at, L, "climb", 2 * k); st.L = L; }
      if (cache.size > 40) cache.clear(); cache.set(key, st);
    }
    const all = cur ? [...done.slice(-1500), cur] : done.slice(-1500), L = linesAt1084(all), pk = L.find((l) => l.name === "5m PP")?.price || 0; if (!(pk > 0)) return none;
    const live: St1084 = { sm: st.sm.slice(), Ss: { ...st.Ss }, Sc: { ...st.Sc }, L };
    if (cur) push1084(live, { ...cur, c: spot, h: Math.max(cur.h, spot), l: Math.min(cur.l, spot) }, pk, Math.floor(now) - 1);
    live.sm.push({ t: Math.floor(now * 1000), p: spot, pp: pk });
    const at = Math.floor(now * 1000) + 1;
    return { slide: pinkHold1084(live.sm, live.Ss, at, L, "slide", 8 * k), climb: pinkHold1084(live.sm, live.Sc, at, L, "climb", 2 * k), run: (dir) => pinkRun1084(live.sm, at, dir, L, 200 * k) };
  } catch { return none; }
}
/** THE ONE CHECK every candle-reading book asks before it returns a call: "" = free; otherwise why this call waits while her pink slides or climbs. */
export function pinkSlideWall1084(bs: Bar1084[], spot: number, now: number, side: "up" | "down", label: string): string {
  try {
    const s = pinkState1084(bs, spot, now), up = side === "up";
    const hold = up ? s.slide : s.climb; // a slide under the pink holds longs; a climb over the pink holds shorts
    if (hold) return `PINK SLIDE (fix1084): ${up ? "no long" : "no short"}: ${hold.trim()}`;
    if (/5m PP|pink/i.test(label) && s.run(up ? "down" : "up")) return up ? "SHORTS ONLY AT A SLID PINK (fix515 / fix1084): the pink slid on three-plus rejections - a pink call is a short only until price breaks pink up by 10% of the channel." : "LONGS ONLY AT A CLIMBED PINK (fix515 / fix1084): the pink climbed on three-plus rejections - a pink call is a long only until price breaks pink down by 10% of the channel.";
    const other = up ? s.climb : s.slide; // her trend side: only off the pink, or a rejection, while it slides (fix658 + fix677)
    if (other && !offPink1084(side, label)) return `PINK SLIDE (fix658 / fix1084): ${up ? "longs" : "shorts"} only off the pink while it ${up ? "climbs" : "slides"} - ${label} waits for the pink rejection.`;
  } catch {}
  return "";
}
