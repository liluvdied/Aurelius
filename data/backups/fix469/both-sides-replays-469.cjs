// fix469 replays (tests only - no trading file changes). Coordinator brief Oct 29 2026 1:51 PM PT, for Love's R210 (1:26 PM PT: "check every single line of code that it
// FUNCTIONS. BOTH. WAYS. FOR ALL. BOOKS. NO MORE LOOPHOLES.") + R213 (1:40 PM PT: "ASSUME EVERY FUCKING BAND TOLERANCEWORKS BOTH WAYS"):
// full both-sides trade replays, run on the code itself, for
//   flip   - her 2-5m candle flip (main / rejection / copy flips, gold + BTC; no 1m) and the 5M's door (1m-5m, R174)
//   3pm    - the 3 PM rule: only pink / Bollinger / green-red zone calls on main + rejection, gold + BTC
//   zones  - the BTC 55% green->pink / pink->red zones on main, rejection and the copies (not the delayed book)
//   zones5 - the same 55% zones in the 5M's own files (after INSTALL-5M-MIRRORS)
// usage: node tools/both-sides-replays-469.cjs <flip|flip5|3pm|zones|zones5> [desk dir]   -> prints one line per replay, exit 0 all ✓ / 1 any ✗
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const ts = require(path.join(root, "node_modules/typescript"));
const WHAT = process.argv[2] || "flip", DIR = process.argv[3] || path.join(root, "src/lib/desk");
const rd = (f) => (fs.existsSync(path.join(DIR, f)) ? fs.readFileSync(path.join(DIR, f), "utf8") : "");
const js = (src) => ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
const block = (S, head) => { const i = S.indexOf(head); if (i < 0) return null; let d = 0; for (let k = S.indexOf("{", i); k < S.length; k++) { if (S[k] === "{") d++; else if (S[k] === "}") { d--; if (d === 0) return S.slice(i, k + 1); } } return null; };
const fnSrc = (S, name) => { const i = S.indexOf(`export function ${name}(`); if (i < 0) return null; const b = S.indexOf(": boolean {", i); return b < 0 ? null : block(S, S.slice(i, b + 11)); };
const out = []; const t = (ok, long, short, what) => out.push({ ok, long, short, what });
const C = 4000, mir = (x) => 2 * C - x;

if (WHAT === "flip") {
  const B = rd("bandlock.ts"); const T0 = Date.UTC(2026, 9, 29, 19, 1, 30); // 12:01:30 PM PT: the 1m opens 12:01, the 2/3/4/5m open 12:00
  const s = T0 / 1000, m0 = Math.floor(s / 300) * 300, m1 = Math.floor(s / 60) * 60;
  const scenes = { // long scenes (gold scale); the short scene is the exact mirror around 4000
    green25: [{ t: m0, o: 4049.0, h: 4050.6, l: 4048.9, c: 4049.6 }, { t: m1, o: 4049.6, h: 4050.2, l: 4049.5, c: 4050 }], // price over the 2-5m open: flipped her way
    only1m: [{ t: m0, o: 4050.5, h: 4050.6, l: 4049.4, c: 4049.6 }, { t: m1, o: 4049.6, h: 4050.2, l: 4049.5, c: 4050 }], // green on the 1m only, still under the 2-5m open
    none: [{ t: m0, o: 4050.5, h: 4050.6, l: 4049.4, c: 4049.6 }, { t: m1, o: 4049.9, h: 4050.0, l: 4049.5, c: 4049.6 }] };
  const mirB = (bars) => bars.map((x) => ({ t: x.t, o: mir(x.o), h: mir(x.l), l: mir(x.h), c: mir(x.c) }));
  for (const [name, who] of [["anyFlipNow", "main / rejection / copy zone reads"], ["anyFlip406Now", "main + rejection (fix424)"], ["anyFlipMinNow", "no-pink copy (10c gold / $5 BTC)"], ["anyFlip2Now", "pure no-pink"]]) {
    const src = fnSrc(B, name); if (!src) { t(false, false, false, `${name} missing`); continue; }
    for (const asset of ["gold", "btc"]) {
      const k = asset === "btc" ? 20 : 1, sc = (bars) => bars.map((x) => ({ t: x.t, o: (x.o - C) * k + C, h: (x.h - C) * k + C, l: (x.l - C) * k + C, c: (x.c - C) * k + C }));
      const run = (bars, side, tick) => new Function("G", "trailNow", "Date", js(src.replace("export ", "")) + `; return ${name};`)({ __pivBars: { [asset]: { bars } } }, () => [], { now: () => T0 })(asset, side, tick);
      const L = (n) => sc(scenes[n]), tk = (n) => sc([{ o: 0, h: 0, l: 0, c: scenes[n][1].c }])[0].c;
      const a = run(L("green25"), "up", tk("green25")), b = run(mirB(L("green25")), "down", mir(tk("green25")));
      const c = !run(L("only1m"), "up", tk("only1m")), d = !run(mirB(L("only1m")), "down", mir(tk("only1m")));
      const e = !run(L("none"), "up", tk("none")), f = !run(mirB(L("none")), "down", mir(tk("none")));
      if (name === "anyFlip2Now") { t(c && e, c && e, d && f, `${who}: ${asset} flip - no 1m-only flip, no flip = held (green->red / red->green both sides)`); continue; }
      t(a && b && c && d && e && f, a && c && e, b && d && f, `${who}: ${asset} 2-5m flip her way counts, a 1m-only flip never does, no flip = held`);
    }
  }
  const R = rd("recon.ts"), i = R.indexOf("const rej446 ="), j = R.indexOf("\n", R.indexOf('return seenL.filter((c) => !((c.side === "up"', i));
  if (i < 0) t(false, false, false, "fix446 band-rejection flip missing");
  else { const F = new Function(js("function F(asset, spot, seenL, f, k, fix33, falling, rising, topS, botS, bandFlip, realFlipNow) { const m1 = (c) => false;\n" + R.slice(i, j) + "\n}") + "; return F;")();
    for (const asset of ["gold", "btc"]) { const run = (label, side, falling, rising, flip) => F(asset, 4041, [{ side, label }], 0.4, 0.33, false, falling, rising, Infinity, -Infinity, true, () => flip).length === 1;
      const lo = run("Rejected up off -1σ", "up", true, false, true) && !run("Rejected up off -1σ", "up", true, false, false) && !run("Break above 5m PP", "up", true, false, true);
      const sh = run("Rejected down off +1σ", "down", false, true, true) && !run("Rejected down off +1σ", "down", false, true, false) && !run("Break below 5m PP", "down", false, true, true);
      t(lo && sh, lo, sh, `main + rejection: ${asset} band rejection on a 5m against her = entry only on a real 2-5m flip; a break never rides someone else's flip`); } }
}

if (WHAT === "flip5") {
  const F5 = rd("five5m.ts"), a = F5.indexOf("const fin = ((M5.__pivBars"), h = F5.indexOf("const herWay = "), d = F5.indexOf("const door1N = (() => {"), e = F5.indexOf("return 0; })();", d);
  if (a < 0 || h < 0 || d < 0 || e < 0) t(false, false, false, "5M: her flip door (R174) missing");
  else {
    const code = [F5.slice(a, F5.indexOf("\n", a)), F5.slice(h, F5.indexOf("\n", h)), F5.slice(d, e + 15)].join("\n");
    const run = new Function("M5", "r", "nowS", "callS", js(code + "\nreturn fin.some((x) => herWay(x)) || door1N > 0;"));
    const W0 = Date.UTC(2026, 9, 29, 19, 0, 0) / 1000, callS = W0 + 90, nowS = W0 + 240; // her call 12:01:30, now 12:04:00
    const bars = (seq) => seq.map(([o, c], n) => ({ t: W0 + 60 * n, o, h: Math.max(o, c), l: Math.min(o, c), c }));
    const mb = (seq) => seq.map(([o, c]) => [mir(o), mir(c)]);
    const go = (seq, side) => run({ __pivBars: { btc: { bars: bars(seq) } } }, { side }, nowS, callS);
    const sc = { m1: [[4000, 3999], [3999, 3998], [3998, 3997], [3997, 3998]], none: [[4000, 3999], [3999, 3998], [3998, 3997], [3997, 3996]] }; // 12:03 closes green / every 1m red
    const lo1 = go(sc.m1, "up"), sh1 = go(mb(sc.m1), "down"), lo0 = !go(sc.none, "up"), sh0 = !go(mb(sc.none), "down");
    t(lo1 && sh1 && lo0 && sh0, lo1 && lo0, sh1 && sh0, "5M: a 1m candle closing her way after her call opens her door (R174); no flip = no door");
    const s2 = [[4000, 3999], [3999, 3998], [3997, 3996.9], [3997.8, 3997.5]]; // both 1m after her call red, but the 12:02-12:04 2m closes 3997.5 over its 3997 open (a gap)
    const lo2 = go(s2, "up"), sh2 = go(mb(s2), "down");
    t(lo2 && sh2, lo2, sh2, "5M: a 2m candle closing her way after her call opens her door even with every 1m against her (R174)");
  }
}

if (WHAT === "3pm") {
  const E = rd("engine.ts"), li = E.split("\n").find((x) => x.includes("3 PM = BOLLINGERS AND ZONES ONLY (fix452)") && x.includes("if ("));
  if (!li) t(false, false, false, "3 PM rule (fix452) missing");
  else {
    const j3 = js(li);
    const run = (hour, book, setup, side, ticker) => { const RD = Date; const D = class extends RD { constructor(...a) { if (a.length) super(...a); else super(Date.UTC(2026, 9, 29, (hour + 7) % 24, 10)); } }; return new Function("done", "row", "Date", "for (const _ of [0]) { " + j3 + " return 'went'; } return 'held';")({}, { id: "x", book, setup, ticker, side }, D); };
    for (const [nm, book] of [["MAIN", "recon-tog"], ["REJECTION", "recon-rej"]]) for (const [asset, tk] of [["gold", "KXGOLDD-26OCT29H1500"], ["btc", "KXBTCD-26OCT29H1500"]]) {
      const L = [["Rejected up off Green zone", "went"], ["Rejected up off Bollinger lower", "went"], ["Rejected up off 5m PP", "went"], ["Break above 5m PP", "went"], ["Rejected up off -1σ", "held"], ["Rejected up off session VWAP", "held"]];
      const S = [["Rejected down off Red zone", "went"], ["Rejected down off Bollinger upper", "went"], ["Rejected down off 5m PP", "went"], ["Break below 5m PP", "went"], ["Rejected down off +1σ", "held"], ["Rejected down off session VWAP", "held"]];
      const lo = L.every(([s, w]) => run(15, book, s, "up", tk) === w) && L.every(([s]) => run(14, book, s, "up", tk) === "went");
      const sh = S.every(([s, w]) => run(15, book, s, "down", tk) === w) && S.every(([s]) => run(14, book, s, "down", tk) === "went");
      t(lo && sh, lo, sh, `${nm}: ${asset} at 3 PM only pink / Bollinger / green-red zone calls go, session-band calls are held; 2 PM unchanged`);
    }
  }
}

const zoneRun = (S, forced, head, book) => { // runs her own zone lines from impossibleGeo exactly as written
  const fz = forced ? S.split("\n").find((x) => x.includes(forced)) || "" : "", zb = block(S, head);
  if (!zb) return null;
  const dl = (S.split("\n").find((x) => x.startsWith("export const DLY465")) || "const DLY465 = new Set([]);").replace("export ", "");
  const f = new Function("G", "asset", "L", "tick", "side", "twinFade", "zoneGuard", js("const G2 = G; " + dl + "\n" + fz + "\n" + zb + "\nreturn null;").replace(/\bG\./g, "G."));
  return (asset, L, tick, side, zg) => { const r = f({ __curBook465: book }, asset, L, tick, side, false, zg); return !!(r && r.why); };
};
if (WHAT === "zones" || WHAT === "zones5") {
  const five = WHAT === "zones5", S = five ? rd("bandlock5m27.ts") : rd("bandlock.ts");
  const L = [{ name: "5m S1", price: 79600 }, { name: "5m PP", price: 80000 }, { name: "5m R1", price: 80400 }];
  const books = five ? [["5M", "five5m"]] : [["MAIN", "recon-tog"], ["REJECTION", "recon-rej"], ["NO-PINK COPY", "recon-togp"], ["PURE NO-PINK", "recon-np"], ["DELAYED BOOK", "recon-dly"]];
  for (const [nm, book] of books) {
    const z = five ? zoneRun(S, "", 'if (asset === "btc") { const zP8 = ', book) : zoneRun(S, "zoneGuard !== 0.55) zoneGuard = 0.55;", 'if (zoneGuard > 0 && asset === "btc") {', book);
    if (!z) { t(false, false, false, `${nm}: the 55% zone lines are missing`); continue; }
    if (book === "recon-dly") { const un = !z("btc", L, 80300, "up", 0) && !z("btc", L, 79700, "down", 0); t(un, un, un, "DELAYED BOOK: the 55% zones are not forced on it (untouched)"); continue; }
    // long: 75% / 50% of pink->red blocked (top 55%), 30% goes; short: 25% / 50% of green->pink blocked (bottom 55%), 70% goes; gold never (BTC rule)
    const lo = z("btc", L, 80300, "up", 0) && z("btc", L, 80200, "up", 0) && !z("btc", L, 80120, "up", 0) && !z("gold", L, 80300, "up", 0);
    const sh = z("btc", L, 79700, "down", 0) && z("btc", L, 79800, "down", 0) && !z("btc", L, 79880, "down", 0) && !z("gold", L, 79700, "down", 0);
    t(lo && sh, lo, sh, `${nm}: BTC no long in the top 55% of pink->red / no short in the bottom 55% of green->pink (replayed through her own lines)`);
  }
}

for (const r of out) console.log(`${r.ok ? "✓" : "✗"}  long ${r.long ? "✓" : "✗"}  short ${r.short ? "✓" : "✗"}  ${r.what}`);
if (!out.length) { console.log("nothing replayed - unknown: " + WHAT); process.exit(1); }
process.exit(out.every((r) => r.ok) ? 0 : 1);
