// OG SEP 24 REPLAY - read only. Rebuilt OG (her Sep 24 reads) vs her real fires, Sep 24 - Oct 1 2026.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
export const STEPS = [0.5, 1, 1.5, 2, 2.5, 3];
const norm = (s) => String(s || "").replace(/−/g, "-").replace(/\s+/g, " ").trim();
export function frame(candles) {
  const rows = [...candles].sort((a, b) => a.t - b.t).filter((c) => Number.isFinite(c.c));
  if (rows.length < 8) return null;
  let pv = 0, vol = 0, tw = 0;
  for (const c of rows) { const tp = (c.h + c.l + c.c) / 3; pv += tp * c.v; vol += c.v; tw += tp; }
  const twap = tw / rows.length, useV = vol > 0 && pv > 0, vwap = useV ? pv / vol : twap;
  let acc = 0, w = 0;
  for (const c of rows) { const tp = (c.h + c.l + c.c) / 3, wt = useV ? c.v : 1; acc += wt * (tp - vwap) ** 2; w += wt; }
  const sd = w > 0 ? Math.sqrt(acc / w) : 0;
  const stdev = Math.max(sd, vwap * 0.00015);
  const bands = [];
  for (const m of STEPS) bands.push({ multiplier: -m, price: vwap - m * stdev }, { multiplier: m, price: vwap + m * stdev });
  bands.sort((a, b) => a.price - b.price);
  return { vwap, stdev, bands };
}
const asc = (rows) => [...rows].sort((a, b) => a.t - b.t);

/** Her detectPattern. `allow(label, side, band)` replaces her canTake (the stats cut decides). */
export function detect(candles, fr, allow = () => true) {
  const none = { kind: "none", side: null, band: null, label: "No band interaction" };
  if (!fr) return none;
  const rows = asc(candles);
  if (rows.length < 8) return none;
  const recent = rows.slice(-12), last = recent[recent.length - 1], look = recent.slice(-8);
  const { vwap, stdev } = fr;
  const touch = Math.max(stdev * 0.15, vwap * 0.00005), prox = touch;
  const levels = [1.5, 2, 2.5, 1, 3, 0.5];
  const can = (label, side, band) => allow(label, side, band) || (band ? allow(`Open ${band > 0 ? "+" : ""}${band}σ`, side, band) : false);

  for (const m of levels) {
    for (const level of [vwap + m * stdev, vwap - m * stdev]) {
      const name = `${level >= vwap ? "+" : "−"}${m}σ`;
      const band = level >= vwap ? m : -m;
      const earlier = look.slice(-4, -1);
      let approach = null;
      for (let i = earlier.length - 1; i >= 0; i -= 1) {
        if (earlier[i].c > level) { approach = "above"; break; }
        if (earlier[i].c < level) { approach = "below"; break; }
      }
      const tagged = look.slice(-3).some((c) => c.l <= level + touch && c.h >= level - touch) && Math.abs(last.c - level) <= Math.max(touch * 1.6, stdev * 0.22);
      if (!tagged || !approach) continue;
      const label = `Tap-reject at ${name}`;
      if (approach === "above" && last.c >= level - touch * 0.45) { if (can(label, "up", band)) return { kind: "tap_reject", side: "up", band, label, level }; continue; }
      if (approach === "below" && last.c < level) { if (can(label, "down", band)) return { kind: "tap_reject", side: "down", band, label, level }; continue; }
    }
  }
  for (const m of levels) {
    const upper = vwap + m * stdev, lower = vwap - m * stdev;
    const brokeUp = look.slice(0, -2).some((c) => c.c > upper + stdev * 0.2);
    const retestUp = look.slice(-4).some((c) => c.l <= upper + prox && c.l >= upper - stdev * 0.55 && c.c > upper - prox);
    const contUp = last.c >= upper && last.c <= upper + stdev * 0.1 && last.c >= last.o;
    const up = `Break-retest continuation through +${m}σ`;
    if (brokeUp && retestUp && contUp && can(up, "up", m)) return { kind: "break_retest", side: "up", band: m, label: up, level: upper };
    const brokeDown = look.slice(0, -2).some((c) => c.c < lower - stdev * 0.2);
    const retestDown = look.slice(-4).some((c) => c.h >= lower - prox && c.h <= lower + stdev * 0.55 && c.c < lower + prox);
    const contDown = last.c <= lower && last.c >= lower - stdev * 0.1 && last.c <= last.o;
    const dn = `Break-retest continuation through −${m}σ`;
    if (brokeDown && retestDown && contDown && can(dn, "down", -m)) return { kind: "break_retest", side: "down", band: -m, label: dn, level: lower };
  }
  return none; // her "Watching ±σ" (near_band) is a watch, never a take
}

/** Her window-open read: nearest line (VWAP or a band) within 0.35 sigma; long above it, short below it. */
export function openLook(spot, vwap, stdev) {
  if (!(spot > 0) || !(vwap > 0) || !(stdev > 0)) return null;
  let best = null;
  for (const step of [0, 0.5, 1, 1.5, 2, 2.5, 3]) for (const sign of step === 0 ? [0] : [1, -1]) {
    const gap = Math.abs(spot - (vwap + sign * step * stdev));
    if (gap > stdev * 0.35 || (best && gap >= best.gap)) continue;
    best = { gap, step, sign: sign < 0 ? "-" : "+" };
  }
  if (!best) return null;
  const level = vwap + (best.sign === "-" ? -1 : 1) * best.step * stdev;
  return { kind: "open", label: `Open ${best.step === 0 ? "VWAP" : best.sign + best.step + "σ"}`, side: spot >= level ? "up" : "down", level };
}

/** 1m bars -> 5m bars on 5-minute marks. */
export function to5m(bars) {
  const m = new Map();
  for (const c of asc(bars)) {
    const t = Math.floor(c.t / 300000) * 300000, p = m.get(t);
    m.set(t, p ? { t, o: p.o, h: Math.max(p.h, c.h), l: Math.min(p.l, c.l), c: c.c, v: p.v + c.v } : { ...c, t });
  }
  return [...m.values()].sort((a, b) => a.t - b.t);
}

/** THE STATS CUT. A setup (asset + side + label) is cut once it has `minTrades` settled and wins under `minHitPct`,
 *  or (cutIfLosing) has lost more than it won. `minTrades` null = Love hasn't set it: nothing is cut yet. */
export function statsAllow(stats, asset, side, label, cut) {
  if (!cut || cut.minTrades == null) return true;
  const s = stats?.[`${asset}|${side}|${norm(label)}`];
  if (!s || s.n < cut.minTrades) return true;
  if (cut.minHitPct != null && (100 * s.w) / s.n < cut.minHitPct) return false;
  if (cut.cutIfLosing && s.w < s.n - s.w) return false;
  return true;
}

export function statsAdd(stats, asset, side, label, won) {
  const k = `${asset}|${side}|${norm(label)}`;
  const s = stats[k] ?? { n: 0, w: 0 };
  s.n += 1; if (won) s.w += 1;
  stats[k] = s;
  return stats;
}

/** One read for one asset: her 1m read (bands from `band` bars), then her 5m read (last 12 5m bars), then the window-open read.
 *  `bands`: "all" = every bar given (her chart path) or a number = only the last N 1m bars (her 60-minute path). */
export function sep24Read({ asset, bars, secondsLeft, stats, cut, bands = "all" }) {
  const rows = asc(bars);
  if (rows.length < 8) return { take: null, why: "not enough bars" };
  const spot = rows[rows.length - 1].c;
  const f1 = frame(bands === "all" ? rows : rows.slice(-Number(bands)));
  const c5 = to5m(rows);
  const f5 = c5.length ? frame(c5.slice(-12)) : null;
  const allow = (label, side) => statsAllow(stats, asset, side, label, cut);
  const looks = [];
  const p1 = detect(rows, f1, allow); if (p1.side) looks.push({ ...p1, tf: "1m" });
  const p5 = detect(c5, f5, allow); if (p5.side) looks.push({ ...p5, tf: "5m" });
  const op = f1 ? openLook(spot, f1.vwap, f1.stdev) : null;
  if (op && secondsLeft >= 120 && allow(op.label, op.side)) looks.push({ ...op, tf: "1m" });
  return { take: looks[0] ?? null, looks, spot, vwap: f1?.vwap, stdev: f1?.stdev, why: looks.length ? "" : "no band read" };
}

// ---------------- replay harness ----------------
const D = process.argv[2] || "data/replay/sep24";
const FILL = process.argv[3];
const J = (p) => JSON.parse(readFileSync(p, "utf8"));
const unwrap = (x) => Array.isArray(x) ? x : (x.bars || x.candles || x.markets || x.data || x.rows || Object.values(x).find(Array.isArray) || []);
const ms = (v) => typeof v === "string" ? Date.parse(v) : (v < 1e12 ? v * 1000 : v);
function bars(p) {
  const out = unwrap(J(p)).map((b) => Array.isArray(b)
    ? { t: ms(b[0]), o: +b[1], h: +b[2], l: +b[3], c: +b[4], v: +(b[5] ?? 0) }
    : { t: ms(b.t ?? b.time ?? b.ts ?? b.start), o: +(b.o ?? b.open), h: +(b.h ?? b.high), l: +(b.l ?? b.low), c: +(b.c ?? b.close), v: +(b.v ?? b.volume ?? 0) });
  out.sort((a, b) => a.t - b.t);
  // forward-fill missing minutes (flat bar at last close, zero volume)
  const f = [];
  for (const b of out) {
    const p = f[f.length - 1];
    if (p) for (let t = p.t + 60000; t < b.t; t += 60000) f.push({ t, o: p.c, h: p.c, l: p.c, c: p.c, v: 0 });
    if (!p || b.t > p.t) f.push(b);
  }
  return f;
}
function markets(p) {
  return unwrap(J(p)).map((m) => {
    const close = ms(m.close_time ?? m.expiration_time ?? m.closeTime);
    const res = String(m.result ?? "").toLowerCase();
    return { ticker: m.ticker, close, open: close - 900000, strike: +(m.floor_strike ?? m.strike), up: res === "yes" ? true : res === "no" ? false : null };
  }).filter((m) => Number.isFinite(m.close) && m.up !== null).sort((a, b) => a.close - b.close);
}
// session start for "all" bands: BTC = UTC midnight, gold = 5 PM New York
function sessionStart(asset, t) {
  if (asset === "btc") return Math.floor(t / 86400000) * 86400000;
  const ny = new Date(new Date(t).toLocaleString("en-US", { timeZone: "America/New_York" }));
  const off = new Date(new Date(t).toLocaleString("en-US", { timeZone: "UTC" })) - ny;
  const s = new Date(ny); s.setHours(17, 0, 0, 0); if (ny < s) s.setDate(s.getDate() - 1);
  return s.getTime() + off;
}
const idx = (rows, t) => { let lo = 0, hi = rows.length; while (lo < hi) { const m = (lo + hi) >> 1; if (rows[m].t < t) lo = m + 1; else hi = m; } return lo; };

// first take inside each window, read once a minute on closed 1m bars (like her once-a-minute scan)
function replay(asset, rows, mk, bandMode, cut) {
  const stats = {}, trades = [];
  for (const m of mk) {
    let took = null;
    for (let t = m.open + 60000; t <= m.close - 60000; t += 60000) {
      const from = bandMode === "all" ? sessionStart(asset, t) : t - 6 * 3600000; // 60-bar mode only needs recent bars
      const slice = rows.slice(idx(rows, from), idx(rows, t)); // bars closed before t
      if (slice.length < 8) continue;
      const r = sep24Read({ asset, bars: slice, secondsLeft: (m.close - t) / 1000, stats, cut, bands: bandMode });
      if (r.take) { took = { t, side: r.take.side, label: r.take.label, tf: r.take.tf }; break; }
    }
    if (!took) continue;
    const won = (took.side === "up") === m.up;
    statsAdd(stats, asset, took.side, took.label, won);
    trades.push({ asset, window: new Date(m.open).toISOString(), ticker: m.ticker, ...took, at: new Date(took.t).toISOString(), won });
  }
  return trades;
}
const pct = (a) => a.length ? Math.round((100 * a.filter((x) => x.won).length) / a.length) : 0;
const pt = (t) => new Date(t).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const day = (t) => new Date(t).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

const assets = { btc: [bars(`${D}/btc-1m.json`), markets(`${D}/kalshi-btc.json`)], gold: [bars(`${D}/paxg-1m.json`), markets(`${D}/kalshi-gold.json`)] };
const CUTS = { none: { minTrades: null }, "cut60_n5": { minTrades: 5, minHitPct: 60, cutIfLosing: true }, "cut60_n10": { minTrades: 10, minHitPct: 60, cutIfLosing: true } };
const L = []; const say = (s = "") => { L.push(s); console.log(s); };
say("# Rebuilt OG (Sep 24 reads) - replay Sep 24 to Oct 1 2026\n");
say("Score = did the side she'd pick win the Kalshi 15m market (yes = up). Prices/asks not modelled.\n");
const all = {};
for (const bandMode of ["all", 60]) for (const [cn, cut] of Object.entries(CUTS)) {
  const tr = []; for (const [a, [rows, mk]] of Object.entries(assets)) tr.push(...replay(a, rows, mk, bandMode, cut));
  all[`${bandMode}|${cn}`] = tr;
  say(`## bands=${bandMode} cut=${cn}: ${tr.length} trades, ${pct(tr)}%  (btc ${pct(tr.filter((x) => x.asset === "btc"))}% / gold ${pct(tr.filter((x) => x.asset === "gold"))}%)`);
  const days = [...new Set(tr.map((x) => day(Date.parse(x.at))))].sort();
  for (const d of days) { const s = tr.filter((x) => day(Date.parse(x.at)) === d); say(`   ${d}: ${s.length} trades, ${pct(s)}%`); }
}

// her real fires, same windows
if (FILL && existsSync(FILL)) {
  const raw = unwrap(J(FILL));
  say(`\n## Her real fill-log (${raw.length} rows). Sample keys: ${Object.keys(raw[0] || {}).join(", ")}`);
  const hers = new Map();
  for (const e of raw) {
    const t = Date.parse(e.at ?? e.time ?? e.ts); if (!Number.isFinite(t)) continue;
    const asset = /gold|xau|paxg/i.test(String(e.asset ?? e.market ?? e.ticker ?? "")) ? "gold" : /btc/i.test(String(e.asset ?? e.market ?? e.ticker ?? "")) ? "btc" : null;
    if (!asset) continue;
    const side = /^(up|yes|long|buy)/i.test(String(e.side ?? e.direction ?? "")) ? "up" : /^(down|no|short|sell)/i.test(String(e.side ?? e.direction ?? "")) ? "down" : null;
    const w = Math.floor(t / 900000) * 900000, k = `${asset}|${w}`;
    const h = hers.get(k) ?? { asset, w, side, label: e.pattern ?? e.label ?? e.setup ?? "", profit: 0, settled: false };
    if (side && !h.side) h.side = side;
    if ((e.kind == null || e.kind === "banked") && e.profit != null && Number.isFinite(+e.profit)) { h.profit += +e.profit; h.settled = true; }
    hers.set(k, h);
  }
  const H = [...hers.values()].filter((h) => h.settled && h.side);
  for (const key of ["all|none", "60|none", "all|cut60_n5", "60|cut60_n5"]) {
    const og = new Map(all[key].map((x) => [`${x.asset}|${Date.parse(x.window)}`, x]));
    let same = 0, opp = 0, skip = 0, lossToWin = 0, lossSkipped = 0, winToLoss = 0, winSkipped = 0, hl = 0, hw = 0;
    const flips = [];
    for (const h of H) {
      const o = og.get(`${h.asset}|${h.w}`); const lost = h.profit < 0; lost ? hl++ : hw++;
      if (!o) { skip++; lost ? lossSkipped++ : winSkipped++; continue; }
      if (o.side === h.side) same++; else { opp++; if (lost && o.won) { lossToWin++; flips.push(`${pt(h.w)} ${h.asset} she ${h.side} (${h.label}) ${h.profit.toFixed(2)} -> OG ${o.side} ${o.label} WON`); } if (!lost && !o.won) winToLoss++; }
    }
    say(`\n### vs her fires, bands=${key}: ${H.length} of her windows (${hw} won, ${hl} lost)`);
    say(`   OG same side ${same}, opposite ${opp}, no take ${skip}`);
    say(`   her LOSSES: OG flipped to a winner ${lossToWin}, OG sat out ${lossSkipped}`);
    say(`   her WINS:   OG flipped to a loser ${winToLoss}, OG sat out ${winSkipped}`);
    if (key === "all|none") for (const f of flips.slice(0, 60)) say(`      ${f}`);
  }
  // Sep 24 before 4:10 PM PT match
  const cutoff = Date.parse("2026-09-24T23:10:00Z"), start = Date.parse("2026-09-24T07:00:00Z");
  for (const key of ["all|none", "60|none"]) {
    const og = new Map(all[key].map((x) => [`${x.asset}|${Date.parse(x.window)}`, x]));
    const s = H.filter((h) => h.w >= start && h.w < cutoff); const m = s.filter((h) => og.get(`${h.asset}|${h.w}`)?.side === h.side).length;
    say(`\nSep 24 before 4:10 PM PT, bands=${key}: OG picked her same side in ${m} of ${s.length} windows she traded`);
  }
}
writeFileSync(`${D}/og-replay-report.md`, L.join("\n") + "\n");
writeFileSync(`${D}/og-replay-trades.json`, JSON.stringify(all));
console.log(`\nWrote ${D}/og-replay-report.md`);
