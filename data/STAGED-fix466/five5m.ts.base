// THE WALLED-OFF 5M - HER 5M LANE + HER EXITS (R169, Love Oct 29 2026 10:27 AM PT: "please create a SEPARATE BOOK FOR THAT MODEL. ITS SUPPOSED TO STAND ALONE FROM THE OTHERS. I CANNOT HAVE IT
// KEEP CHANGING EVRRYTIME WE REFINE THE OTHERS ... ONE ALTERATION TO ONE - DOES NOTTTTTTTTTTTTTTTT. DOES. NOT. TOUCH. THE 5M BOOK. WALLED OFF. PLEASE." + R173 10:58 AM: "october 27th please. she was
// at 79%. that's where she was when she was working"). A frozen copy of her Oct 27 4:57 AM PT save (data/SNAPSHOT-TODAY-2026-10-27-0457am), byte for byte except the wiring marked FIVE5M:
// its own memory (five5m-mem.ts), its own data folder (data/five5m/), its own frozen helpers. No other book's code imports this file; editing recon.ts / bandlock.ts / engine.ts never changes it.
// RECONSTRUCTION v2 — HER BONES (Love, Oct 19 2026 ~6:47 PM PT: "if a candle rejected the bottom band, and is rising from the bottom 33% of the
// channel i want her to long / if it rejected the top band and is falling from the top 33% of the channel, i want her to short / if it breaks the
// top band, i want her to long / if it breaks a lower band, i want her to short / same rules apply to pink / tap and rejection + candle
// falling/rising away from the pink band = trade away from the band in the direction of the rejection / a break of the pink band = trade in the
// direction of the break / those are the bones of it / that's a stable structure / can you build it?").
//
// Lines: her session bands (VWAP, +/-1,2,3 sigma, desk VWAP) + the pink 5m PP. No red/green (5m R/S) — not in her bones; say the word to add them.
// Entries (recon-ogp5):
//   BREAK     = the last closed 1m candle closed through a line, or live price has pushed through it from the candle's open side by her break
//               distance (BTC $6 / gold 33c) -> trade the direction of the break.
//   REJECTION = this 5m candle tapped a line (within BTC $3 / gold 30c) WITHOUT breaking it, and price is moving away from the tap by at least
//               the tap distance -> trade away from the band, in the rejection's direction.
// No wall-to-strike rule, no centre rule (the Oct 12 extras are out — her bones replace them). The door adds her 33% channel rule (no trade INTO
// an unbroken band in its third) and band-breaks-up-=-trade-up (bandlock channelOnly + candleDirOnly), feed health and a fresh price. Nothing else.
// recon-paper stays the Oct 12 PAPER 24/7 read (its tap-rejects are the same shape). TOGETHER = whichever speaks first in the window (live book).
//
// v1 (the byte-faithful Oct 12 decide) retired by Love after its 6:30 PM shorts into unbroken bands both lost: "her shorts into an unbroken band
// win maybe 1/5 times... that's a stable structure, can you build it?" — this build IS her re-signing of the spine lock.
// THIS FILE IS THE SPINE. data/spine-lock.json holds its sha256[:16]. Drift without Love re-signing = the three books stop booking.
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { M5, D5 } from "./five5m-mem";
import { fiveNightRows5m } from "./five5m-rows";
// FIVE5M: shared plumbing she still uses - Polymarket's client (./poly-live.server: windows, quotes, orders, holdings, cash), the desk's price feed and bars
// (read through M5), and the desk's stop switch (data/halt.json) so "stop everything" still stops her.
// FIVE5M: her Oct 27 engine helper, copied as is
function rjA(om: any, a: any): number[] { const m = om?.rejHoursByAsset?.[String(a || "").toLowerCase()]; return Array.isArray(m) ? m.map(Number) : Array.isArray(om?.rejHours) ? om.rejHours.map(Number) : []; }
function entriesOff() { try { return JSON.parse(readFileSync(join(process.cwd(), "data", "halt.json"), "utf8")).off === true; } catch { return false; } }
export async function fiveTick5m() {
  if (M5.__polyTwinBusy) return;
  let cfg: any = null;
  try { cfg = JSON.parse(readFileSync(D5("live-switch.json"), "utf8")).polyTwin || null; } catch { cfg = null; }
  if (!cfg || cfg.on !== true || !(Number(cfg.dollars) > 0) || entriesOff()) return;
  M5.__polyTwinBusy = true;
  try {
    const now = Date.now();
    // 5M QUOTE RECORDER (fix203, Oct 25 ~4:55 AM PT, Love: "the 3-5x's on polymarket on the 5M ones are repeatable ... do another paper book that does the same thing,
    // 15% -1% chance, enters at a band, candle flip = get in, 3x 5x, 7.5x & 10x pls"): read-only - about every 5 s the BTC 5m market's best bid/ask go to
    // data/poly5-quotes.jsonl so tools/five-snipe-paper.py can paper-trade it. No orders.
    if (!(now - Number(M5.__p5qAt || 0) < 5000)) { M5.__p5qAt = now; void (async () => { try { const pmq = await import("./poly-live.server"); const ca = new Date(Math.ceil(now / 300000) * 300000).toISOString();
      if (M5.__p5qWin?.closes !== ca || !M5.__p5qWin?.slug) { const w = await pmq.polyWindow5("btc", ca).catch(() => null); M5.__p5qWin = { closes: ca, slug: w?.slug || "", target: w?.target ?? null }; }
      const sl = M5.__p5qWin?.slug; if (!sl) return; const tp = await pmq.bookTop(sl).catch(() => null); if (!tp) return;
      appendFileSync(D5("poly5-quotes.jsonl"), JSON.stringify({ t: Math.round(now / 1000), slug: sl, closes: ca, target: M5.__p5qWin.target, bid: tp.bid, ask: tp.ask }) + "\n"); } catch {} })(); }
    const books: string[] = Array.isArray(cfg.books) && cfg.books.length ? cfg.books : ["recon-dly"];
    // THE TWIN'S HOURS ON POLYMARKET (fix155, Oct 23 ~5:30 PM PT, Love: "yes let's give the twin those hours on kalshi too"): when polyTwin.books lists both, the
    // DELAYED twin (recon-dly) trades Poly in its hours (not in bookSkipHours["recon-dly"]) and the rejection model every other hour.
    let twinHr = false;
    try { const tsw = JSON.parse(readFileSync(D5("live-switch.json"), "utf8")); const hT = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24;
      const dS = tsw?.bookSkipHours?.["recon-dly"]; twinHr = Array.isArray(dS) && !dS.map(Number).includes(hT); } catch { twinHr = false; }
    const both = books.includes("recon-dly") && books.includes("recon-rej");
    // MAIN BOOK ON THE 5M OVERNIGHT, HER REJECTION HOURS ASIDE (fix185, Oct 25 ~12:18 AM PT, Love: "i'd like her to run the main book on poly for the 5M market
    // throughout the night, only rejections best hours aside"): while rej5m.mainUntil holds, the main book's BTC calls take the Poly 5m - except in her rejection
    // hours (offHourMain.rejHours), where the rejection model keeps the 5m as before.
    const rejH5 = (() => { try { const sw5 = JSON.parse(readFileSync(D5("live-switch.json"), "utf8")); const h5 = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date())) % 24; if (Date.parse(String(sw5?.polyTwin?.rej5m?.mainAllUntil || "")) > Date.now()) return false; /* Love 12:19 AM: "we can put the main book on for the hour right now though" - mainAllUntil = main book on the 5m even in a rejection hour */ const xr5 = sw5?.polyTwin?.rej5m?.extraRej; if (xr5 && Array.isArray(xr5.hours) && xr5.hours.map(Number).includes(h5) && Date.parse(String(xr5.until || "")) > Date.now()) return true; /* fix192 (Oct 25 ~2:21 AM PT, Love: "ya let's do it hun i wanna see how she moves" - the 2 AM 5m board to the rejection model tonight; rej5m.extraRej {hours, until}) */ return rjA(sw5?.offHourMain, "btc").includes(h5); /* fix243: BTC hours */ } catch { return false; } })();
    const m5On = !!cfg.rej5m && cfg.rej5m.on === true && Date.parse(String(cfg.rej5m.mainUntil || "")) > now && !rejH5; // fix171, fix185
    // THE REJECTION MODEL WAITS FOR HER CANDLE ON THE 5M (fix188, Oct 25 ~2:00 AM PT, Love: "id like the rejection model on the 5M markets to wait for a candle in our
    // favor like the main book does, she can have a perfect entry and it will still lose on there because there wasn't enough time for price to move in our favor"):
    // while the rejection model holds the 5m board, her BTC call stays alive up to 5 minutes and buys only once a finished 1m candle since the call closed her way
    // (green for a long, red for a short). The 5m window is chosen at the flip. Her 15m copies and every other book unchanged.
    // FLIP + 4 MINUTES ON THE 5M (fix189, Oct 25 ~2:05 AM PT, Love: "no need to run it on paper hun / let's run it like that pls" after the replay - flip with 4+ minutes
    // left won 73% on the 5m vs 57-59% as traded): the books listed here buy on the 5m board only right after a finished 1m candle closed her way, with about 4 minutes
    // (225 s+) left in that 5m window; their calls stay alive up to 5 minutes.
    const FLIP5_BOOKS: string[] = ["recon-rej", "recon-tog"]; // Love card 2:04 AM "Main and rejection"
    const rejHolds5 = !!cfg.rej5m && cfg.rej5m.on === true && Number(cfg.rej5m.dollars) > 0 && !(Date.parse(String(cfg.rej5m.until || "")) < now) && !(Date.parse(String(cfg.rej5m.mainUntil || "")) > now && !rejH5);
    // fix261 (fix261, Oct 26 ~2:47 AM PT, Love: "pls put her back on the framework that was winning all day up until 10pm" + "for the 5M 123 book - that's what i meant by put it back - not the kalshi books"): on the Poly 5m lane the rejection model's BTC calls come from recon-rej5 (her pre-fix246 streak read); Kalshi keeps recon-rej.
    const allNight5 = (fiveNightRows5m() as any[]).filter((x: any) => !(x && x.book === "recon-rej" && x.asset === "btc")).map((x: any) => (x && x.book === "recon-rej5" ? { ...x, book: "recon-rej" } : x));
    const rows = allNight5.filter((r) => (books.includes(r.book) || (m5On && r.book === "recon-tog" && r.asset === "btc")) && (!both || (r.book === "recon-dly" ? twinHr : r.book === "recon-rej" ? !twinHr || (rejHolds5 && r.asset === "btc") : true)) && (r.asset === "btc" || r.asset === "gold") && r.result === "open" && /15M-/.test(String(r.ticker)) && (r.side === "up" || r.side === "down") && now - Date.parse(String(r.at)) < (r.asset === "btc" && FLIP5_BOOKS.includes(String(r.book)) && (r.book === "recon-tog" ? m5On : rejHolds5) ? 300000 : 90000));
    // THE LATE DOOR FOR EITHER BOOK (fix198, Oct 25 ~3:41 AM PT, Love: "the last minute 5M book can run on either book, whichever one sees the opportunity there is
    // clear to take it"): the BTC calls of the book NOT holding the 5m board ride the 5m lane too, but only through the late door (fix195) - never the flip door.
    const hold5 = m5On ? "recon-tog" : rejHolds5 ? "recon-rej" : "", oth5 = hold5 === "recon-tog" ? "recon-rej" : hold5 === "recon-rej" ? "recon-tog" : "";
    if (oth5) for (const x of allNight5) if (x && x.book === oth5 && x.asset === "btc" && x.result === "open" && /15M-/.test(String(x.ticker)) && (x.side === "up" || x.side === "down") && now - Date.parse(String(x.at)) < 300000) rows.push({ ...x, lateOnly: true });
    const touchOn = cfg.touch !== false;
    // FRESH 5M SWINGS (fix186, Oct 25 ~1:45 AM PT, Love: card "Fresh 5m swings, keep the hours"): her later-slot calls in a 15m window (data/swing5.json, written by
    // recon) ride the 5m lane only, for whichever book holds the 5m this hour (main in its hours, the rejection model in hers).
    try {
      const sw5 = JSON.parse(readFileSync(D5("swing5.json"), "utf8"));
      const mainNow5 = !!cfg.rej5m && Date.parse(String(cfg.rej5m.mainUntil || "")) > now && !rejH5;
      for (const s of Object.values(sw5) as any[]) {
        if (!s || !(now - Date.parse(String(s.at)) < (FLIP5_BOOKS.includes(String(s.book)) ? 300000 : 90000)) || s.asset !== "btc" || !(s.side === "up" || s.side === "down")) continue;
        const okB = s.book === "recon-tog" ? m5On : s.book === "recon-rej" && !mainNow5 && books.includes("recon-rej") && (!both || !twinHr || rejHolds5);
        if (okB) rows.push({ ...s, result: "open", swing5: true });
        else if (oth5 && s.book === oth5) rows.push({ ...s, result: "open", swing5: true, lateOnly: true }); // fix198
      }
    } catch {}
    if (!rows.length && !touchOn && !(Number(M5.__add5Until) > now)) return; // fix196: a held 5m trade keeps the lane awake for her add-on
    const regF = D5("poly-twin.json");
    let reg: Record<string, any> = {};
    try { reg = JSON.parse(readFileSync(regF, "utf8")); } catch { reg = {}; }
    const log = (o: any) => { try { appendFileSync(D5("poly-twin-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...o }) + "\n"); } catch {} };
    const pm = await import("./poly-live.server");
    const blm = await import("./bandlock5m27");
    let changed = false;
    const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    // THE HEDGE IN THE TWIN'S KALSHI HOURS (fix118, Oct 22 ~9:00 PM PT, Love: "in the event the delayed entry model is on kalshi, have polymarket take the opposite
    // side / so we have a hedge"): while recon-dly trades live on Kalshi this hour, Polymarket takes the other side of every twin entry. Like her other Poly hedges,
    // the hedge side doesn't meet the twin's wall; floors, netting and exits are unchanged.
    let dlyOnKalshi = false;
    try { const lsw = JSON.parse(readFileSync(D5("live-switch.json"), "utf8")); const hPT = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date()));
      const sk = lsw?.bookSkipHours?.["recon-dly"]; const lb = lsw?.liveBook?.books; dlyOnKalshi = Array.isArray(lb) && lb.includes("recon-dly") && Array.isArray(sk) && !sk.includes(hPT); } catch { dlyOnKalshi = false; }
    // THE 5M ADD-ON (fix196, Oct 25 ~3:29 AM PT, Love: "we definitely have time for an add on they move QUICK on the 5M markets off of a minor flick of price ... if price
    // hits 45-30% on the multiple in any of her windows she's clear to do a $2 add on bb" + card "Only when she's already in"): once she holds a 5m trade, a dip on
    // her side to 30-45c buys ONE $2 add-on in that window (limit never past 45c), any time before the last 10 s. No walls, like her other add-ons.
    // BACK TO THE 72% RULE (fix205, Oct 25 ~1:05 PM PT, Love card "Back to the 72% rule" after the live 5m post-mortem: entries with ~4 min left went 14-6,
    // late entries 2-8, 5m add-ons 0-5, buys under 30c 1-4): the 5m add-on, the late door and partial top-ups are off; the flip needs 4+ minutes left; 30c floor.
    const G205_OFF = true;
    // FIVEY'S GUARDS (fix207, Oct 25 ~1:20 PM PT, Love card "All three guards" + "let's make it 4 straight instead pls" - Oct 24-25 the 5m lane kept buying until
    // Polymarket held $0.39): each finished 5m trade is settled from the desk's 1m bars (sold early = its banked profit; no bars 10 min after the bell = counted
    // a loss) into data/five-guard.json. The 5m lane stops for the PT day at -$45 net (fix208, was -$15), pauses 1 hour after 4 losses in a row, and never buys if Polymarket
    // cash would drop under $15. 15m twin and insurance are untouched.
    const G207F = D5("five-guard.json"); let G207: any = {}; try { G207 = JSON.parse(readFileSync(G207F, "utf8")); } catch { G207 = {}; }
    const G207day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date()); let G207ch = false;
    if (G207.day !== G207day) { G207 = { day: G207day, net: 0, streak: 0, pauseUntil: Number(G207.pauseUntil) || 0, done: {} }; G207ch = true; }
    try { let hs207: any[] | null = null;
      for (const [k7, d7] of Object.entries(reg) as [string, any][]) {
        if (!k7.endsWith(":5m") || d7?.status !== "filled" || !d7.closesAt || !d7.slug || G207.done?.[k7] !== undefined || !(Number(d7.spent) > 0)) continue;
        const ce7 = Date.parse(String(d7.closesAt)); if (!(ce7 <= now - 65000) || ce7 < Date.parse(G207day + "T00:00:00-08:00") - 3600000 || ce7 < Date.parse("2026-10-25T20:25:00Z")) continue; // fix207 counts from install on
        if (!hs207) { try { hs207 = JSON.parse(readFileSync(D5("hedges.json"), "utf8")); } catch { hs207 = []; } }
        const hh7 = (hs207 || []).filter((x: any) => x && x.slug === d7.slug && x.kind === "rej5m" && !x.addOn);
        let p7: number | null = null, how7 = "";
        if (hh7.length && hh7.every((x: any) => x.status === "banked")) { p7 = hh7.reduce((a: number, x: any) => a + (Number(x.banked) || 0), 0); how7 = "sold"; }
        else {
          // POLYMARKET'S OWN RESULT (fix269, Love Oct 26 10:33 AM PT "yes" to grading the 5m guard from Polymarket's real result - the 10:05 AM short was
          // booked "won" because the chart's 5m candle closed $13 red while Polymarket's feed closed up and the short lost): a held-to-the-bell 5m trade is
          // graded by the market's resolution (polymarketWindow downWon), polled at most every 15 s per market. Only if Polymarket hasn't resolved it 30 min
          // after the bell does the old chart-candle grade apply.
          let pw7: any = null; const PQ7 = (M5.__g207poly ||= {}) as Record<string, number>;
          if (now - (PQ7[d7.slug] || 0) >= 15000) { PQ7[d7.slug] = now; try { pw7 = await pm.polymarketWindow(String(d7.slug)); } catch { pw7 = null; } }
          if (pw7 && typeof pw7.downWon === "boolean") { const won7 = (d7.side === "down") === pw7.downWon; p7 = won7 ? Number(d7.contracts) - Number(d7.spent) : -Number(d7.spent); how7 = won7 ? "won (polymarket)" : "lost (polymarket)"; }
          else if (now - ce7 > 1800000) { const bs7 = (M5.__pivBars?.btc?.bars ?? []) as any[], e7 = ce7 / 1000;
          const o7 = bs7.find((x: any) => Number(x.t) === e7 - 300), c7 = bs7.find((x: any) => Number(x.t) === e7 - 60);
          if (o7 && c7) { const up7 = Number(c7.c) >= Number(o7.o); const won7 = (d7.side === "up") === up7; p7 = won7 ? Number(d7.contracts) - Number(d7.spent) : -Number(d7.spent); how7 = won7 ? "won (chart, polymarket unresolved)" : "lost (chart, polymarket unresolved)"; }
          else { p7 = -Number(d7.spent); how7 = "no bars - counted lost"; } } }
        if (p7 === null) continue;
        G207.done = G207.done || {}; G207.done[k7] = Math.round(p7 * 100) / 100; G207.net = Math.round(((Number(G207.net) || 0) + p7) * 100) / 100;
        G207.streak = p7 < 0 ? (Number(G207.streak) || 0) + 1 : 0;
        if (G207.streak >= 4) { G207.pauseUntil = now + 3600000; G207.streak = 0; }
        G207ch = true; log({ id: k7, status: "settled", how: how7, pnl: G207.done[k7], dayNet: G207.net, streak: G207.streak, pauseUntil: G207.pauseUntil ? new Date(G207.pauseUntil).toISOString() : null });
      }
    } catch {}
    if (G207ch) { try { writeFileSync(G207F, JSON.stringify(G207, null, 1)); } catch {} }
    for (const [k5, d] of Object.entries(reg) as [string, any][]) {
      if (G205_OFF || !k5.endsWith(":5m") || !(d?.status === "filled" || d?.status === "partial") || d.addOn || !d.closesAt || !(d.side === "up" || d.side === "down")) continue;
      const lft5 = Date.parse(String(d.closesAt)) - now; if (!(lft5 > 10000 && lft5 <= 300000)) continue;
      if (now - Number(d.addTry || 0) < 3000) continue;
      d.addTry = now; changed = true;
      let fa: any = null; try { fa = await pm.takeSide(d.side, String(d.closesAt), 2, 0.43, 0.30, 0.02, ":rej5madd", String(d.asset || "btc")); } catch { fa = null; }
      if (fa) {
        d.addOn = { at: new Date().toISOString(), contracts: fa.filled, cost: fa.price, orderId: fa.orderId };
        log({ id: k5, status: "add-on", side: d.side, contracts: fa.filled, cost: fa.price, slug: fa.slug });
        try { const hf = D5("hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
          hs.unshift({ at: new Date().toISOString(), kind: "rej5m", addOn: true, book: d.book, slug: fa.slug, side: d.side, contracts: fa.filled, cost: fa.price, stake: Math.round(fa.filled * fa.price * 100) / 100, kalshi: d.ticker, closesAt: d.closesAt, status: "open" });
          writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
      }
    }
    const flipS = (s: string) => (s === "up" ? "down" : "up");
    for (const r0 of rows) {
      const r = dlyOnKalshi && cfg.hedgeTwin !== false && r0.book === "recon-dly" ? { ...r0, side: flipS(r0.side), hedge: true } : r0; // fix155: polyTwin.hedgeTwin false = Poly rides WITH the twin
      // THE REJECTION MODEL ON POLYMARKET'S 5-MINUTE BTC MARKETS (fix170, Oct 24 ~7:00 PM PT, Love: "i want to try running the rejection model on polymarket @ $2 for
      // the 5 Minute markets, it gives price less time to reverse and go against us / we'll do it for the next hour"): while polyTwin.rej5m is on and before its
      // "until", each BTC rejection-model call buys its side on the 5m market open now (the next one if under a minute is left) instead of the 15m one, at
      // rej5m.dollars, under her wall and floor like the 15m copy. No add-on (kind "rej5m"); hedgeBank sells half at 75%, rest at 90%, or it rides to the bell.
      const r5 = cfg.rej5m;
      // THE MAIN BOOK'S HOUR ON THE 5M (fix171, Oct 24 ~7:34 PM PT, Love: "i'd like the main book on for the 5M market for the hour, i want to see how she does"):
      // while rej5m.mainUntil is ahead, the 5m lane copies the main book's (recon-tog) BTC calls instead of the rejection model's; the rejection model's BTC calls
      // go back to the 15m copy for that time. Main-book rows never take the 15m path.
      const main5 = !!r5 && Date.parse(String(r5.mainUntil || "")) > now && !rejH5; // fix185: her rejection hours keep the 5m for the rejection model
      // NO 5M IN HER OFF HOURS (fix247, Oct 26 ~12:26 AM PT, Love: "11pm is off from now on on there ok"): polyTwin.rej5m.skipHours (PT) - no Poly 5m buys from main or
      // the rejection model in those hours. Kalshi is untouched.
      if (r5 && Array.isArray(r5.skipHours) && FLIP5_BOOKS.includes(String(r.book)) && r5.skipHours.map(Number).includes(Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24)) continue;
      if (r5 && r5.on === true && (r.book === (main5 ? "recon-tog" : "recon-rej") || ((r as any).lateOnly && FLIP5_BOOKS.includes(String(r.book)))) && (Array.isArray(r5.assets) ? r5.assets : ["btc"]).includes(r.asset) && !(Date.parse(String(r5.until || "")) < now) && Number(r5.dollars) > 0) {
        const id5 = `${r.id}:5m`, d5 = reg[id5];
        if (d5 && (d5.status === "filled" || d5.final)) continue;
        if (d5 && now - Number(d5.lastTry || 0) < 4000) continue;
        const base5 = { book: r.book === "recon-tog" ? "recon-tog-5m" : "recon-rej-5m", asset: r.asset, side: r.side, ticker: r.ticker, setup: r.setup, lastTry: now, tries: (Number(d5?.tries) || 0) + 1 };
        let end5 = Math.ceil(now / 300000) * 300000; if (end5 - now < 60000) end5 += 300000;
        const closes5 = new Date(end5).toISOString();
        // ITS OWN WINDOW ONLY (fix224, Oct 25 ~6:05 PM PT, Love: "it says the 5M book is in a short right now ?? why?" - at 6:00:02 PM the 5:55 slot's short call bought the
        // 6:00 window off the 5:58-6:00 2m candle, while the fresh 6:00 read was a long): every call (fresh 5m swing or 15m) trades only inside its own 5m slot
        // (Love 6:05 PM: "only let a call only trade inside its own 5 minute slot") - once that slot is over the call is spent, never carried into the next window.
        { const sm5 = /:s(\d+)$/.exec(String(r.id)); const capE5 = sm5 ? (Number(sm5[1]) + 1) * 300000 : (Math.floor(Date.parse(String(r.at)) / 300000) + 1) * 300000;
          if (Number.isFinite(capE5) && end5 > capE5) { if (d5?.status !== "expired") log({ id: id5, status: "expired", reason: "its own window is over - a call never trades the next window" }); reg[id5] = { ...base5, status: "expired", final: true, reason: "its own window is over - a call never trades the next window" }; changed = true; continue; } }
        let late5 = false; // fix195
        // TOP UP A PARTIAL FILL (fix202, Oct 25 ~4:45 AM PT, Love: "yes pls" to "keep knocking for the rest of her size" - the 4:35 short filled 1.1 contracts ($0.58) of $5
        // as the book moved): a partly filled 5m trade keeps knocking for the rest of her size in the same window (same entry: no new flip, walls already passed it) until 2:30 is left.
        const part5 = false && d5?.status === "partial"; // fix205: no top-ups
        if (part5 && (d5.closesAt !== closes5 || (end5 - now) / 1000 < 150)) { reg[id5] = { ...d5, status: "filled", final: true }; log({ id: id5, status: "filled", note: "top-up window closed", spent: d5.spent }); changed = true; continue; }
        // WALLS JUDGE THE CALL (fix204, Oct 25 ~5:07 AM PT, Love card "Judge walls at the call" - since 2 AM Kalshi filled 9 of her calls and the 5m only 1: by the time
        // her flip came, price had moved and the walls re-judged her thirds at the new price): the first time the 5m lane sees a call, her walls judge it right then
        // (5m cushions). If it passes, the flip only confirms it - no second wall check at the flip. If it fails, the walls keep judging it at the flip as before.
        if (d5?.wallOk === undefined && !part5) { let w0: any = null; M5.__pinkCap5 = 25; const bbH0 = M5.__bbsr; if (M5.__bbsrChart) M5.__bbsr = M5.__bbsrChart; try { w0 = blm.bandLockCheck(String(r.book), r.asset, r.side, String(r.ticker)); } finally { M5.__pinkCap5 = 0; M5.__bbsr = bbH0; } (base5 as any).wallOk = !!w0?.ok; } else (base5 as any).wallOk = !!d5?.wallOk;
        if (FLIP5_BOOKS.includes(String(r.book)) && !part5) { // fix188 + fix189: a finished 1m candle since her call closed her way, just now, with ~4 minutes left
          const callS = Date.parse(String(r.at)) / 1000, nowS = now / 1000;
          const fin = ((M5.__pivBars?.btc?.bars ?? []) as any[]).filter((x: any) => Number(x.t) + 60 <= nowS + 1 && Number(x.t) + 60 > callS).sort((x: any, y: any) => Number(x.t) - Number(y.t));
          const herWay = (x: any) => (r.side === "up" ? Number(x.c) > Number(x.o) : Number(x.c) < Number(x.o));
          const left5 = (end5 - now) / 1000;
          // KNOCK UNTIL 3:30 (fix191, Oct 25 ~2:17 AM PT - the 2:15 main long's flip landed at 2:16:00 with 4 minutes left, one try at 41c missed as the book moved, and
          // the 4-minute cutoff closed the door 13 s later): the flip must land with 4+ minutes left in this 5m window (the bar closing at its open or after its first
          // minute); once it has, she keeps knocking until 3:30 is left.
          // DOOR 1 (R174, Love Oct 29 2026 11:03 AM PT: "1M 2m, 3M , 4m or 5M candle flip in our favor / keeps trying until 3:00 minutes left"): a finished 1m, 2m, 3m, 4m or 5m candle
          // (on the clock, from her 1m bars) that closed her way since her call opens the door - no 4-minutes-left landing rule; she keeps trying until 3:00 is left (flipKnock 180).
          // Was (fix189/fix205, Oct 27): only a 1m candle landing with 4+ minutes left: fin.some((x) => { const lf = end5 / 1000 - (Number(x.t) + 60); return herWay(x) && lf >= 240 && lf <= 301; })
          const door1N = (() => { try { const all1 = ((M5.__pivBars?.btc?.bars ?? []) as any[]); for (const N of [2, 3, 4, 5]) for (let te = Math.floor(nowS / (60 * N)) * (60 * N); te > callS; te -= 60 * N) {
            const bo = all1.find((x: any) => Number(x.t) === te - 60 * N), bc = all1.find((x: any) => Number(x.t) === te - 60);
            if (bo && bc && (r.side === "up" ? Number(bc.c) > Number(bo.o) : Number(bc.c) < Number(bo.o))) return N; } } catch {} return 0; })();
          let flipOk = fin.some((x: any) => herWay(x)) || door1N > 0; if (flipOk && !fin.some((x: any) => herWay(x))) (base5 as any).door = `${door1N}m flip`; // R174 // fix205: 4+ minutes again // fix199 (Love 3:49 AM "if she missed that short bc there wasn't 4 minute left i want to make it 3 minutes pls"): flip with 3+ minutes left, knock until 2:30
          // THE 5M FLIP IS A DOOR TOO (fix200, Oct 25 ~3:57 AM PT, Love: "i want her to enter on a 5M candle flip as well - not the 1M alone pls" + card "Either flip is a
          // door"): a finished 5m candle that closed her way after her call opens the door for the window right after it, same 2:30 knock limit.
          if (false /* fix211 (Oct 25 ~2:11 PM PT, Love card "Drop the 5m door" - replay: 5m candle door alone 25/49 = 51%) */ && !flipOk) { try { const all5 = (M5.__pivBars?.btc?.bars ?? []) as any[], w05 = end5 / 1000 - 300;
            const o5 = all5.find((x: any) => Number(x.t) === w05 - 300), c5 = all5.find((x: any) => Number(x.t) === w05 - 60);
            if (o5 && c5 && w05 > callS && w05 <= nowS && (r.side === "up" ? Number(c5.c) > Number(o5.o) : Number(c5.c) < Number(o5.o))) flipOk = true; } catch {} }
          // 2M AND 3M FLIPS ARE DOORS TOO (fix210, Oct 25 ~2:03 PM PT, Love: "lets throw the 2M's and 3M's up on poly if they're hitting at 80%, and giving her
          // more valid set ups" - replay: 2m flip with 3+ min left 35 windows 83%, 3m 20 windows 80%, 1m-or-2m 70 windows vs 54): a 2m or 3m candle (from her 1m
          // bars, on the clock) that closed her way after her call, landing with 3+ minutes left in this 5m window, opens the door; she knocks until 2:30 is left.
          let flipKnock = 180;
          if (true /* R174: door 2 (fix210 2m/3m, 3+ min, knock to 2:30) is judged every time so its 2:30 knock stays exactly as Oct 27 */) { try { const all1 = (M5.__pivBars?.btc?.bars ?? []) as any[];
            for (const N of [2, 3]) { const te = Math.floor(nowS / (60 * N)) * (60 * N), s0 = te - 60 * N, lfN = end5 / 1000 - te;
              if (!(te > callS && lfN >= 180 && lfN <= 301)) continue;
              const bo = all1.find((x: any) => Number(x.t) === s0), bc = all1.find((x: any) => Number(x.t) === te - 60);
              if (bo && bc && (r.side === "up" ? Number(bc.c) > Number(bo.o) : Number(bc.c) < Number(bo.o))) { flipOk = true; flipKnock = 150; (base5 as any).door = `${N}m flip`; break; } } } catch {} }
          // THE LATE DOOR (fix195, Oct 25 ~3:25 AM PT, Love: "btc's 5M window had 2:30 left on it and price was clearly pushing up off of the pink band and already had
          // rejected and had a good distance away (green $25-50 away) ... open the door to those as well" + "yeup runnit bb" after the replay showed 1.5x and under wins,
          // 1.6-1.8x breaks even, 2x loses): with 2:00-3:00 left, if this window touched the pink (5m PP, within $10) and price is now $25-60 away from it on her side,
          // with the last finished 1m candle closed her way, she may buy - but never past 1.5x (limit 66c).
          const lateOnly5 = !!(r as any).lateOnly; // fix198: the other book may only use the late door
          if ((!(flipOk && left5 >= flipKnock) || lateOnly5) && left5 >= 150 && left5 <= 180) { try { // fix206 (Oct 25 ~1:15 PM PT, Love: "give her the second minute to fill ... and include the last minute book that tested near that 70%"): knock through the
            // window's second minute (to 3:00 left); the late door is back from 3:00 to 2:30 left, only at 60-70c (1.43x-1.67x - the replay's 3:00-left 1.5x bucket won 70%, 1.3-1.5x 79%)
            const bb5 = ((M5.__pivBars?.btc?.bars ?? []) as any[]).filter((x: any) => Number(x.t) >= end5 / 1000 - 300).sort((x: any, y: any) => Number(x.t) - Number(y.t));
            const pk5 = Number(((M5.__lawBands?.btc?.L ?? []) as any[]).find((l: any) => String(l.name) === "5m PP")?.price) || 0;
            const lf5 = fin.length ? fin[fin.length - 1] : null, px5 = bb5.length ? Number(bb5[bb5.length - 1].c) : 0;
            if (pk5 > 0 && px5 > 0 && lf5 && herWay(lf5) && Number(lf5.t) + 60 >= nowS - 65) {
              const lo5 = Math.min(...bb5.map((x: any) => Number(x.l))), hi5 = Math.max(...bb5.map((x: any) => Number(x.h)));
              late5 = r.side === "up" ? lo5 <= pk5 + 10 && px5 - pk5 >= 15 && px5 - pk5 <= 60 : hi5 >= pk5 - 10 && pk5 - px5 >= 15 && pk5 - px5 <= 60; // fix197 (Love 3:31 AM "we can make that $15-$60 + hun"): $15 floor (was $25)
            } } catch { late5 = false; } }
          if (late5 && Object.entries(reg).some(([k, v]: [string, any]) => k.endsWith(":5m") && k !== id5 && v?.status === "filled" && v?.closesAt === closes5)) late5 = false; // fix198: one late buy per window across both books
          if ((!(flipOk && left5 >= flipKnock) || lateOnly5) && !late5) {
            if (lateOnly5) { reg[id5] = { ...base5, status: "waiting", reason: "late door only (the other book holds the 5m)" }; changed = true; continue; }
            const wf = !fin.some(herWay) ? `waiting for a 1m candle to close ${r.side === "up" ? "green" : "red"} (her 5m flip)` : `waiting for her flip - she tries until 3:00 is left in the 5m window (R174)`;
            if (d5?.reason !== wf) log({ id: id5, status: "waiting", reason: wf });
            reg[id5] = { ...base5, status: "waiting", reason: wf }; changed = true; continue;
          }
        }
        let bl5: any; M5.__pinkCap5 = 25; const bbH5 = M5.__bbsr; if (M5.__bbsrChart) M5.__bbsr = M5.__bbsrChart; try { bl5 = part5 || (base5 as any).wallOk ? { ok: true } : blm.bandLockCheck(String(r.book), r.asset, r.side, String(r.ticker)); } finally { M5.__pinkCap5 = 0; M5.__bbsr = bbH5; } // fix199: $25 pink cushion on the 5m board // fix266 (Love Oct 26 9:09 AM PT: "please go back over our last messages yesterday and rebuild a twin EXACTLY. from that configuration, nothing different whatsoever"): the 5m board's walls read the chart's Bollinger as on Sunday, not her own (fix259 stays for Kalshi)
        if (!bl5.ok) { if (d5?.reason !== bl5.reason) log({ id: id5, status: "blocked", reason: bl5.reason }); reg[id5] = { ...base5, status: "blocked", reason: bl5.reason }; changed = true; continue; }
        const win5 = await pm.polyWindow5(r.asset, closes5).catch(() => null);
        if (!win5 && part5) { reg[id5] = { ...d5, lastTry: now }; changed = true; continue; }
        if (!win5) { if (d5?.status !== "no window") log({ id: id5, status: "no window", closesAt: closes5 }); reg[id5] = { ...base5, status: "no window", reason: `no Polymarket BTC 5m market closing ${closes5}` }; changed = true; continue; }
        const held5 = await pm.polymarketHoldings().catch(() => []);
        const sg5 = r.side === "up" ? 1 : -1;
        if (held5.find((h) => h.slug === win5.slug && Math.abs(h.net) > 0.01 && Math.sign(h.net) !== sg5)) { reg[id5] = { ...base5, status: "skipped", final: true, slug: win5.slug, reason: `the other side is already held on ${win5.slug}` }; log({ id: id5, ...reg[id5] }); changed = true; continue; }
        { let why7 = ""; // fix207: her guards
          if ((Number(G207.net) || 0) <= -45 /* fix208 (Love 1:30 PM "let's make it -$45 hun") */ && !G207.stopOff /* fix270 (Love Oct 26 10:49 AM PT card "Correct it, keep her trading"): stopOff lifts the day stop for that PT day only; the midnight reset drops it */) why7 = `5M DAY STOP: the 5m book is ${G207.net} today - done until midnight PT`;
          else if (now < (Number(G207.pauseUntil) || 0)) why7 = `5M COOL-OFF: 4 losses in a row - back at ${new Date(Number(G207.pauseUntil)).toISOString().slice(11, 16)}Z`;
          else { const c7 = await pm.polymarketCash().catch(() => null); if (c7 == null || c7 - Number(r5.dollars) < 0) why7 = `5M CASH FLOOR: Polymarket cash ${c7 ?? "unreadable"} - not enough for the stake`; } /* fix267 (Love Oct 26 9:27 AM PT: "let's get rid of that $15 floor for polymarket ... let her flip it pls"): no $15 reserve, she only needs the stake itself */
          if (why7) { if (d5?.reason !== why7) log({ id: id5, status: "blocked", reason: why7 }); reg[id5] = { ...base5, status: "blocked", reason: why7 }; changed = true; continue; } }
        const max5 = Math.floor(100 / (blm.floorFor(r.asset, r.side, String(r.book)) || 1.38)) / 100;
        let f5: any = null; let e5 = "";
        /* SNIPE LIKE THE MAIN BOOK (fix193, Oct 25 ~2:30 AM PT, Love: "can you see why she wasn't in on the 5M btc one this window? ... let's make sure her execution is on par
        with our main books snipes" - the 2:25 short's flip came at 2:26:00 and her 50c limit (ask + 1c) missed as the book moved): the 5m limit reaches 4c over the ask
        (her Kalshi snipes reach +3c or more), never past her 1.38x floor. */ try { f5 = await pm.takeSide(r.side, closes5, part5 ? Math.round((Number(r5.dollars) - Number(d5.spent || 0)) * 100) / 100 : Number(r5.dollars), Math.round((late5 || d5?.late ? Math.min(0.70, max5) : max5 - 0.04) * 100) / 100, late5 || d5?.late ? 0.60 : 0.30 /* fix205: no long shots under 30c; fix206: late door 60-70c only */, 0.04, part5 ? `:rej5mtop${Number(d5.tops || 0) + 1}` : ":rej5m", r.asset); } catch (x: any) { e5 = String(x?.message || x).slice(0, 160); }
        if (f5) {
          const spent5 = Math.round(((part5 ? Number(d5.spent || 0) : 0) + f5.filled * f5.price) * 100) / 100, n5 = (part5 ? Number(d5.contracts || 0) : 0) + f5.filled;
          const more5 = false && Number(r5.dollars) - spent5 >= 1 && (end5 - now) / 1000 >= 150; // fix205: no top-ups // fix202: $1+ of her size still unfilled -> keep knocking
          reg[id5] = { ...base5, status: more5 ? "partial" : "filled", final: !more5, late: late5 || !!d5?.late, slug: f5.slug, contracts: Math.round(n5 * 100) / 100, cost: Math.round((spent5 / n5) * 1000) / 1000, spent: spent5, tops: (part5 ? Number(d5.tops || 0) + 1 : 0), addOn: d5?.addOn, addTry: d5?.addTry, orderId: f5.orderId, closesAt: closes5 }; M5.__add5Until = Math.max(Number(M5.__add5Until) || 0, end5);
          try { const hf = D5("hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
            hs.unshift({ at: new Date().toISOString(), kind: "rej5m", book: r.book === "recon-tog" ? "recon-tog-5m" : "recon-rej-5m", slug: f5.slug, side: r.side, contracts: f5.filled, cost: f5.price, stake: Math.round(f5.filled * f5.price * 100) / 100, kalshi: r.ticker, closesAt: closes5, status: "open" });
            writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
          log({ id: id5, ...reg[id5] });
        } else { const why5 = e5 || pm.takeSideWhy(); if (d5?.reason !== why5) log({ id: id5, status: part5 ? "top-up no fill" : "no fill", reason: why5 }); reg[id5] = part5 ? { ...d5, lastTry: now, reason: why5 } : { ...base5, status: "no fill", reason: why5 }; }
        changed = true; continue;
      }
      continue; // FIVE5M: her 5M only - the Polymarket 15m twin stays with the desk (polyTwin in engine.ts)
      if (r.book === "recon-tog") continue; // fix171: main-book rows only ever ride the 5m lane
      if ((r as any).lateOnly) continue; // fix198: late-door-only rows never take the 15m path
      if ((r as any).swing5) continue; // fix186: a fresh 5m swing never takes the 15m path
      // NO POLYMARKET 15M (fix236, Oct 25 ~9:16 PM PT, Love card "Stop 15m, 5m to $10": since Oct 23 Poly 15m gold 5-24 -$40.63, BTC 45-62 +$10.82, vs
      // the 5m rejection lane 13-2 +$55.25 since the 72% rule): with polyTwin.no15m on, no call opens a Polymarket 15m position; the 5m lane above is untouched.
      if (cfg.no15m === true) continue;
      const d = reg[r.id];
      if (d && (d.status === "filled" || d.final)) continue;
      if (d && now - Number(d.lastTry || 0) < 4000) continue;
      const base = { book: r.book, asset: r.asset, side: r.side, ticker: r.ticker, setup: r.setup, lastTry: now, tries: (Number(d?.tries) || 0) + 1 };
      const mm = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(String(r.ticker));
      const endMs = mm ? Date.UTC(2000 + Number(mm[1]), MON.indexOf(mm[2]), Number(mm[3]), Number(mm[4]) + 4, Number(mm[5])) : 0;
      if (!endMs || now > endMs - 60000) { reg[r.id] = { ...base, status: "skipped", final: true, reason: "under a minute left" }; changed = true; continue; }
      const closesAt = new Date(endMs).toISOString();
      const bl: any = (r as any).hedge ? { ok: true } : blm.bandLockCheck(String(r.book), r.asset, r.side, String(r.ticker));
      if (!bl.ok) { if (d?.reason !== bl.reason) log({ id: r.id, status: "blocked", reason: bl.reason }); reg[r.id] = { ...base, status: "blocked", reason: bl.reason }; changed = true; continue; }
      const win = await pm.polyWindowAsset(r.asset, closesAt).catch(() => null);
      if (!win) { if (d?.status !== "no window") log({ id: r.id, status: "no window", closesAt }); reg[r.id] = { ...base, status: "no window", reason: `no Polymarket ${r.asset} 15m window closing ${closesAt}` }; changed = true; continue; }
      const held = await pm.polymarketHoldings().catch(() => []);
      const sg = r.side === "up" ? 1 : -1;
      const other = held.find((h) => h.slug === win.slug && Math.abs(h.net) > 0.01 && Math.sign(h.net) !== sg);
      if (other) { reg[r.id] = { ...base, status: "skipped", final: true, slug: win.slug, reason: `the other side is already held on ${win.slug} (${other.net}) - Polymarket would net them` }; log(reg[r.id]); changed = true; continue; }
      // THE TWIN WAITS FOR 2.8x ON POLYMARKET TOO (fix150, Oct 23 ~2:48 PM PT, Love: "the delayed model still fired the entry at the beginning of the window ... didn't
      // wait for the next band interaction, she just entered the opposite direction as our main book again" - 2:46 PM BTC "Turned up after the initial move" bought at 69c):
      // like her Kalshi twin (fix128), a copied twin call buys only at 2.8x+ (34c ask + 1c); otherwise the band-touch entry below is her way in.
      const maxAsk = (r as any).hedge || String(r.book) !== "recon-dly" ? Math.floor(100 / (blm.floorFor(r.asset, r.side, String(r.book)) || 1.38)) / 100 : 0.44; // fix189 2.4x -> fix190 (Oct 25 ~2:09 AM PT, Love: "she can do her initial entry at a 2.2x + on the delayed entry model if she will miss the entry without it"): 2.2x+ (was 2.8x, 0.34)
      let fill: any = null; let err = "";
      try { fill = await pm.takeSide(r.side, closesAt, Number(cfg.dollars), maxAsk, 0.02, 0.01, ":twin", r.asset); } catch (x: any) { err = String(x?.message || x).slice(0, 160); }
      if (fill) {
        reg[r.id] = { ...base, status: "filled", final: true, slug: fill.slug, contracts: fill.filled, cost: fill.price, orderId: fill.orderId };
        try { const hf = D5("hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
          hs.unshift({ at: new Date().toISOString(), kind: (r as any).hedge ? "twin-hedge" : "twin", book: r.book, slug: fill.slug, side: r.side, contracts: fill.filled, cost: fill.price, stake: Math.round(fill.filled * fill.price * 100) / 100, kalshi: r.ticker, closesAt, status: "open" });
          writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
        log({ id: r.id, ...reg[r.id] });
      } else {
        const why = err || pm.takeSideWhy();
        if (d?.reason !== why) log({ id: r.id, status: "no fill", reason: why });
        reg[r.id] = { ...base, status: "no fill", reason: why };
      }
      changed = true;
    }
    // AT THE FIRST BAND AFTER THE INITIAL MOVE (fix113, Oct 22 ~8:47 PM PT, Love: "lets make it so she enters at a band as well, no rejection necessary / don't
    // want her to miss any / any bollinger, session, pink or red/green zone / 2.8x +" + card "Fade the band, once per window" + "first band after the initial
    // move takes place, the delayed entry model"): once the main book (TOGETHER) has made its first call in the window (booked or floor-missed), the first
    // line price comes near that it wasn't already near at that call -> the other side of the main call, $2, 2.8x+ (cfg.touchMaxAsk), no candle or rejection,
    // her twin wall still judges. One Polymarket twin entry per window (shares the ":twin" claim with the copied twin calls).
    if (touchOn) {
      const TS = (M5.__polyTouch ||= {}) as Record<string, any>;
      const tg = (fiveNightRows5m() as any[]).filter((r) => r.book === "recon-tog" && (r.asset === "btc" || r.asset === "gold") && /15M-/.test(String(r.ticker)) && now - Date.parse(String(r.at)) < 15 * 60 * 1000);
      const firsts: Record<string, any> = {};
      for (const r of tg) { const k = String(r.ticker); if (!firsts[k] || Date.parse(String(r.at)) < Date.parse(String(firsts[k].at))) firsts[k] = r; }
      try { const GM = M5.__togMiss || {}; for (const [tk, mv] of Object.entries(GM) as [string, any][]) { if (!/15M-/.test(tk) || !(now - Number(mv?.at) < 15 * 60 * 1000)) continue; if (!firsts[tk] || Number(mv.at) < Date.parse(String(firsts[tk].at))) firsts[tk] = { ticker: tk, side: mv.side, at: new Date(Number(mv.at)).toISOString(), asset: /GOLD/.test(tk) ? "gold" : "btc" }; } } catch {}
      for (const [tk, f] of Object.entries(firsts)) {
        const mm = /-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)/.exec(tk);
        const endMs = mm ? Date.UTC(2000 + Number(mm[1]), MON.indexOf(mm[2]), Number(mm[3]), Number(mm[4]) + 4, Number(mm[5])) : 0;
        if (!endMs || now > endMs - 60000 || now < endMs - 15 * 60 * 1000) continue;
        const asset = String(f.asset) === "gold" ? "gold" : "btc";
        const nearNow = blm.bandsNearNow(asset); if (!nearNow) continue;
        let st = TS[tk];
        if (!st) { st = TS[tk] = { init: f.side, seen: [...nearNow.names], done: false, at: now }; continue; } // lines already near at the main call don't count
        if (st.done) continue;
        st.seen = st.seen.filter((n: string) => nearNow.names.includes(n)); // a line price left can count again
        const fresh = nearNow.names.find((n) => !st.seen.includes(n));
        if (!fresh) continue;
        const side = dlyOnKalshi ? String(st.init) : st.init === "up" ? "down" : "up"; // fix118: in the twin's Kalshi hours Poly hedges it (main's side)
        const wall = dlyOnKalshi ? "" : blm.polyTwinWall(asset, side);
        const id = `${tk}:polytwin-touch`;
        if (wall) { if (reg[id]?.reason !== wall) log({ id, status: "blocked", band: fresh, side, reason: wall }); reg[id] = { status: "blocked", band: fresh, side, reason: wall, lastTry: now }; st.seen.push(fresh); changed = true; continue; }
        if (now - Number(st.lastTry || 0) < 4000) continue;
        st.lastTry = now;
        const closesAt = new Date(endMs).toISOString();
        const win = await pm.polyWindowAsset(asset, closesAt).catch(() => null);
        if (!win) { reg[id] = { status: "no window", band: fresh, side, lastTry: now }; changed = true; continue; }
        const held = await pm.polymarketHoldings().catch(() => []);
        const sg = side === "up" ? 1 : -1;
        if (held.find((h) => h.slug === win.slug && Math.abs(h.net) > 0.01 && Math.sign(h.net) !== sg)) { st.done = true; reg[id] = { status: "skipped", final: true, band: fresh, side, reason: `the other side is already held on ${win.slug} - Polymarket would net them` }; log({ id, ...reg[id] }); changed = true; continue; }
        const maxAskT = Number(cfg.touchMaxAsk) > 0 ? Number(cfg.touchMaxAsk) : 0.35;
        let fill: any = null; let err = "";
        try { fill = await pm.takeSide(side, closesAt, Number(cfg.dollars), maxAskT, 0.02, 0.01, ":twin", asset); } catch (x: any) { err = String(x?.message || x).slice(0, 160); }
        if (fill) {
          st.done = true;
          reg[id] = { status: "filled", final: true, band: fresh, side, init: st.init, slug: fill.slug, contracts: fill.filled, cost: fill.price, orderId: fill.orderId };
          try { const hf = D5("hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
            hs.unshift({ at: new Date().toISOString(), kind: "twin", book: "polytwin-touch", slug: fill.slug, side, contracts: fill.filled, cost: fill.price, stake: Math.round(fill.filled * fill.price * 100) / 100, kalshi: tk, closesAt, status: "open" });
            writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
          log({ id, ...reg[id] });
        } else {
          const why = err || pm.takeSideWhy();
          if (/already has an order in flight/.test(why)) st.done = true; // the copied twin call took this window
          if (reg[id]?.reason !== why) log({ id, status: "no fill", band: fresh, side, reason: why });
          reg[id] = { status: "no fill", band: fresh, side, reason: why, lastTry: now };
        }
        changed = true;
      }
      for (const k of Object.keys(TS)) if (now - Number(TS[k].at) > 20 * 60 * 1000) delete TS[k];
    }
    // THE TWIN'S $3 ADD-ON ON POLYMARKET (fix143, Oct 23 ~1:34 PM PT, Love picked "Yes, $3 at 4.5x+ like Kalshi" on "Give the twin her $3 add-on on Polymarket
    // too?" after fix142 moved the twin off Kalshi): each open twin position on Polymarket (hedges.json kind "twin") adds polyTwin.addOn.dollars on the same side
    // once, at the first band touch (bandlock addOnTouchNow: session bands, pink, Bollinger, green/red zone) while the ask pays 4.5x+ (addOn.maxAsk incl. 1c slip),
    // minLeft+ minutes before the bell. Free like her Kalshi twin add-on (fix81): no wall. Joins hedges.json (kind "twin-add") so hedgeBank sells half at 75%, rest at 90%.
    const ad = cfg.addOn;
    if (ad && ad.on === true && Number(ad.dollars) > 0) {
      let hs0: any[] = []; try { hs0 = JSON.parse(readFileSync(D5("hedges.json"), "utf8")); } catch { hs0 = []; }
      for (const h of (Array.isArray(hs0) ? hs0 : []).filter((x) => x && x.status === "open" && x.kind === "twin" && x.closesAt && x.slug && (x.side === "up" || x.side === "down"))) {
        const id = `${h.slug}:polytwin-add`;
        if (reg[id]?.final) continue;
        if (!(Date.parse(String(h.closesAt)) - now > (Number(ad.minLeft) || 2) * 60000)) continue;
        if (now - Number(reg[id]?.lastTry || 0) < 4000) continue;
        const asset = /GOLD/.test(String(h.kalshi)) ? "gold" : "btc";
        const touch = blm.addOnTouchNow(asset);
        if (!touch) continue;
        const mx = Number(ad.maxAsk) > 0 && Number(ad.maxAsk) < 1 ? Number(ad.maxAsk) : 0.222;
        let fill: any = null; let err = "";
        try { fill = await pm.takeSide(h.side, String(h.closesAt), Number(ad.dollars), Math.round((mx - 0.01) * 100) / 100, 0.02, 0.01, ":twinadd", asset); } catch (x: any) { err = String(x?.message || x).slice(0, 160); }
        if (fill) {
          reg[id] = { status: "filled", final: true, side: h.side, touch, slug: fill.slug, contracts: fill.filled, cost: fill.price, orderId: fill.orderId, lastTry: now };
          try { const hf = D5("hedges.json"); let hs: any[] = []; try { hs = JSON.parse(readFileSync(hf, "utf8")); } catch { hs = []; }
            hs.unshift({ at: new Date().toISOString(), kind: "twin-add", book: "polytwin-add", slug: fill.slug, side: h.side, contracts: fill.filled, cost: fill.price, stake: Math.round(fill.filled * fill.price * 100) / 100, kalshi: h.kalshi, closesAt: h.closesAt, status: "open" });
            writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1)); } catch {}
          log({ id, ...reg[id] });
        } else {
          const why = err || pm.takeSideWhy();
          if (reg[id]?.reason !== why) log({ id, status: "no fill", side: h.side, touch, reason: why });
          reg[id] = { status: "no fill", side: h.side, reason: why, lastTry: now };
        }
        changed = true;
      }
    }
    if (changed) { const ks = Object.keys(reg); if (ks.length > 400) for (const k of ks.slice(0, ks.length - 400)) delete reg[k]; writeFileSync(regF, JSON.stringify(reg, null, 1)); }
  } catch {
  } finally {
    M5.__polyTwinBusy = false;
  }
}
export async function fiveBank5m() {
  if (M5.__aureliusHedgeBankBusy) return;
  M5.__aureliusHedgeBankBusy = true;
  try {
    const hf = D5("hedges.json");
    let hs: any[] = [];
    try {
      hs = JSON.parse(readFileSync(hf, "utf8"));
    } catch {
      return;
    }
    if (!Array.isArray(hs) || !hs.some((h) => h.status === "open")) return;
    let ic: any = {};
    try {
      ic = JSON.parse(readFileSync(D5("live-switch.json"), "utf8")).insurance || {};
    } catch {
    }
    if (ic.bank === false) return;
    const bankAt = Number(ic.bankAt) > 0 ? Number(ic.bankAt) : 200;
    const pm = await import("./poly-live.server");
    let changed = false;
    for (const h of hs) {
      if (h.status !== "open") continue;
      const end = Date.parse(String(h.closesAt || ""));
      if (Number.isFinite(end) && Date.now() > end - 4000) {
        h.status = "to the bell";
        changed = true;
        continue;
      }
      const mark = await pm.markSide(h.slug, h.side, Number(h.contracts), Number(h.stake) || 1).catch(() => null);
      if (!mark) continue;
      if (!(Number(h.peakBid) >= mark.bid)) {
        h.peakBid = mark.bid;
        changed = true;
      }
      // HARD CASH-OUT AT 90% OF THE MAX (Love, Oct 4 AM: "hard-cash out at 90% of the max available... don't let em run to the
      // bell"): a hedge bought at c can grow to $1, so its line is c + 90% of (1 - c), floored to the cent (20c -> 92c).
      // insurance.bankOfMax sets the share; without it, the older +bankAt% line.
      const ofMax = Number(ic.bankOfMax) > 0 && Number(ic.bankOfMax) <= 100 ? Number(ic.bankOfMax) : 0;
      const cost = Number(h.cost);
      // HALF AT 75% (Oct 21 ~2:20 PM PT, Love: "let's have the same take profits in place as we do for our main book / half at 75% of the scale, rest at
      // 90%"): the first time a hedge's bid reaches cost + 75% of (1 - cost), half its contracts are sold; the rest waits for the 90% line below.
      const half = Number(ic.halfOfMax) > 0 && Number(ic.halfOfMax) < 100 ? Number(ic.halfOfMax) : 0;
      if (half > 0 && !h.halfDone && Number(h.contracts) >= 0.02) {
        const line75 = Math.floor((cost + (half / 100) * (1 - cost)) * 100 + 1e-6) / 100;
        if (mark.bid + 1e-9 >= line75) {
          const n2 = Math.floor((Number(h.contracts) / 2) * 100) / 100;
          const soldH = await pm.sellSide(h.side, h.slug, n2).catch(() => null);
          if (soldH && soldH.filled > 0) {
            const gotH = Math.round(soldH.filled * soldH.price * 100) / 100;
            const paidH = Math.round(soldH.filled * cost * 100) / 100;
            h.banked = Math.round(((Number(h.banked) || 0) + gotH - paidH) * 100) / 100;
            h.contracts = Math.round((Number(h.contracts) - soldH.filled) * 100) / 100;
            h.halfDone = true; h.halfAt = new Date().toISOString(); h.halfPx = soldH.price;
            if (!(h.contracts >= 0.01)) h.status = "banked";
            changed = true;
            try { appendFileSync(D5("insurance-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), venue: "polymarket", kalshi: h.kalshi, slug: h.slug, side: h.side, status: "half banked at 75%", sold: soldH.filled, price: soldH.price, cost: h.cost, profit: Math.round((gotH - paidH) * 100) / 100 }) + "\n"); } catch {}
            if (h.status === "banked") continue;
          }
        }
      }
      const line = ofMax > 0 ? Math.floor((cost + (ofMax / 100) * (1 - cost)) * 100 + 1e-6) / 100 : cost * (1 + bankAt / 100);
      if (mark.bid + 1e-9 >= line) {
        const sold = await pm.sellSide(h.side, h.slug, Number(h.contracts)).catch(() => null);
        if (sold && sold.filled > 0) {
          const got = Math.round(sold.filled * sold.price * 100) / 100;
          const paid = Math.round(sold.filled * Number(h.cost) * 100) / 100;
          h.banked = Math.round(((Number(h.banked) || 0) + got - paid) * 100) / 100;
          h.contracts = Math.round((Number(h.contracts) - sold.filled) * 100) / 100;
          h.soldAt = new Date().toISOString();
          h.soldPx = sold.price;
          if (!(h.contracts >= 0.01)) h.status = "banked";
          changed = true;
          try {
            appendFileSync(D5("insurance-log.jsonl"), JSON.stringify({ at: new Date().toISOString(), venue: "polymarket", kalshi: h.kalshi, slug: h.slug, side: h.side, status: "banked", sold: sold.filled, price: sold.price, cost: h.cost, profit: Math.round((got - paid) * 100) / 100, bankAt }) + "\n");
          } catch {
          }
        }
      }
    }
    if (changed) writeFileSync(hf, JSON.stringify(hs.slice(0, 200), null, 1));
  } catch {
  } finally {
    M5.__aureliusHedgeBankBusy = false;
  }
}
