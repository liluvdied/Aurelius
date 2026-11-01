// THE SUB-AUDITOR - "him" (fix501, Love Oct 29 2026 10:54 PM PT: "Create a sub-auditor to audit every set up formed, before she takes it. When she sees one
// for him, so it doesn't cause a lag . Route it from her to him. She needs to have some help here. She can't do everything herself.").
// His own process beside her desk (the engine starts him and restarts him if he stops). The copier hands him every live-book setup the moment it sees it
// (data/setup-audit-in.jsonl: the setup + the exact board - her lines, the tick, the 5m candles, the trail, the Bollinger). He judges it on that board through
// her REAL door (impossibleGeo with the wire's flags, her session-band wait, her reach wall, her $1.50 zones) and stamps it in data/setup-audit-last.json and
// data/setup-audit.jsonl within a few milliseconds. She does not take a setup he has not stamped OK (engine.ts, fix501). When her door changes (a click), he
// reloads it. No rule of his own: every judgment is her code, on the board she saw.
//   node tools/sub-auditor.cjs            run beside her (the engine does this)
//   node tools/sub-auditor.cjs --test     judge two known boards and exit 0/1 (the umpire runs this)
const fs = require("fs"), path = require("path"), os = require("os");
const ROOT = process.env.AUR_ROOT || path.join(__dirname, "..");
const D = (f) => path.join(ROOT, "data", f);
const IN = D("setup-audit-in.jsonl"), OUT = D("setup-audit.jsonl"), LAST = D("setup-audit-last.json"), PID = D("sub-auditor.pid");
const TEST = process.argv.includes("--test");
const ts = require(path.join(ROOT, "node_modules/typescript"));
const BL = path.join(ROOT, "src/lib/desk/bandlock.ts");
const G = globalThis; let NOW = 0; const realNow = Date.now; Date.now = () => NOW || realNow();
let B = null, loadedAt = 0, loadedHash = "";
function load() {
  const src = fs.readFileSync(BL, "utf8"); const h = require("crypto").createHash("sha256").update(src).digest("hex").slice(0, 16);
  if (h === loadedHash && B) return;
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "subaud-"));
  fs.writeFileSync(path.join(out, "bandlock.js"), ts.transpileModule(src, { compilerOptions: { module: 1, target: 99 } }).outputText);
  fs.writeFileSync(path.join(out, "quotes.js"), "exports.quoteTick=()=>null;exports.feedHealth=()=>({ok:true});");
  fs.writeFileSync(path.join(out, "recon.js"), "exports.RECON={};");
  for (const k of Object.keys(require.cache)) if (k.startsWith(out) || /subaud-/.test(k)) delete require.cache[k];
  B = require(path.join(out, "bandlock.js")); loadedAt = realNow(); loadedHash = h;
}
// the wire's flags per live book (bandlock.ts bandLockCheck): main / rejection / the no-pink copy. The delayed book is judged by her own door only (Love: every rule but delayed).
const FLAGS = (() => { // fix523: the ONE table, parsed from bandlock.ts AUDIT_FLAGS523 itself - no second copy to drift
  try {
    const src523 = fs.readFileSync(path.join(__dirname, "..", "src", "lib", "desk", "bandlock.ts"), "utf8");
    const m523 = src523.match(/export const AUDIT_FLAGS523[^=]*= (\{[\s\S]*?\n\};)/);
    return new Function("return " + m523[1].replace(/;\s*$/, ""))();
  } catch (e) { return null; } // null = no table = nothing stamped ok (fails closed below)
})();
function judge(q) {
  const t0 = realNow();
  try {
    load();
    const asset = String(q.asset), side = String(q.side), book = String(q.book), tick = Number(q.tick) || 0, L = Array.isArray(q.L) ? q.L : [];
    if (!FLAGS) return { id: q.id, ok: false, why: "SUB-AUDITOR: the shared flag table (fix523) could not be read - not taken (fails closed)", ms: realNow() - t0 };
    if (!FLAGS[book]) return { id: q.id, ok: true, why: "", note: `${book}: her own door judges`, ms: realNow() - t0 };
    if (!(tick > 0) || !L.length) return { id: q.id, ok: false, why: "SUB-AUDITOR: no board to judge (no lines or no tick) - not taken", ms: realNow() - t0 };
    NOW = Date.parse(q.at) || realNow();
    G.__sdGood = {}; G.__pivBars = { [asset]: { bars: q.bars || [], at: NOW } }; G.__qtrail_1 = { [asset]: q.trail || [] }; G.__bbsr = q.bb ? { [asset]: q.bb } : {}; G.__curBook465 = book; G.__kStrike = q.kStrike ? { [asset]: q.kStrike } : {}; G.__kGap = q.kGap || null; G.__symBtc = q.symBtc || null; // BTC's window target travels with the setup
    const reasons = [];
    try { const g = B.impossibleGeo(asset, L, tick, side, ...FLAGS[book]); if (g && g.why) reasons.push(g.why); } catch (e) { reasons.push("SUB-AUDITOR: her door threw - " + e.message); }
    try { if (typeof B.zoneTolerance497 === "function") { const z = B.zoneTolerance497(asset, L, tick, side); if (z) reasons.push(z); } } catch {}
    try { if (typeof B.reachWall429 === "function") { const o5 = (q.bars || []).filter((x) => Number(x.t) >= Math.floor(NOW / 300000) * 300).sort((a, b) => a.t - b.t)[0]; const r = B.reachWall429(asset, L, tick, side, (typeof B.zonesNow === "function" ? B.zonesNow(asset) : null), o5 ? Number(o5.o) : 0); if (r) reasons.push(r); } } catch {}
    NOW = 0;
    return { id: q.id, ok: reasons.length === 0, why: reasons[0] || "", all: reasons.slice(0, 4), ms: realNow() - t0 };
  } catch (e) { NOW = 0; return { id: q.id, ok: false, why: "SUB-AUDITOR: could not judge - " + e.message, ms: realNow() - t0 }; }
}
function stamp(v) {
  let last = {}; try { last = JSON.parse(fs.readFileSync(LAST, "utf8")); } catch {}
  last[v.id] = { ok: v.ok, why: v.why, at: new Date().toISOString(), ms: v.ms };
  const ks = Object.keys(last); if (ks.length > 400) for (const k of ks.slice(0, ks.length - 400)) delete last[k];
  const tmp = LAST + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(last)); fs.renameSync(tmp, LAST);
  fs.appendFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), ...v }) + "\n");
}
if (TEST) {
  const at = "2026-10-30T05:40:25Z", NOWt = Date.parse(at), f0 = Math.floor(NOWt / 300000) * 300, ws = Math.floor(NOWt / 900000) * 900;
  const bars = (open, tick, target) => { const b = []; for (let t = ws - 3600; t < ws; t += 60) b.push({ t, o: target, h: target + 0.2, l: target - 0.2, c: target }); b.push({ t: ws, o: target, h: Math.max(target, tick), l: Math.min(target, tick), c: tick }); for (let t = ws + 60; t < f0; t += 60) b.push({ t, o: open, h: Math.max(open, tick), l: Math.min(open, tick), c: open }); b.push({ t: f0, o: open, h: Math.max(open, tick), l: Math.min(open, tick), c: tick }); return b; };
  const trail = (open, tick) => [{ t: NOWt - 4000, c: open }, { t: NOWt - 500, c: tick }];
  const GZ = [{ name: "-1σ", price: 3995.8 }, { name: "session VWAP", price: 4004.54 }, { name: "+1σ", price: 4013.25 }, { name: "5m PP", price: 4001.4 }, { name: "5m R1", price: 4005.2 }, { name: "5m R2", price: 4008.97 }, { name: "5m S1", price: 3997.6 }, { name: "5m S2", price: 3993.8 }];
  const GF = [{ name: "-1σ", price: 3986.0 }, { name: "session VWAP", price: 4000.0 }, { name: "+1σ", price: 4014.0 }, { name: "5m PP", price: 3996.0 }, { name: "5m R1", price: 4030.0 }, { name: "5m R2", price: 4040.0 }, { name: "5m S1", price: 3993.0 }, { name: "5m S2", price: 3990.0 }];
  const a = judge({ id: "t1", book: "recon-tog", asset: "gold", side: "up", tick: 4009.10, at, L: GZ, bars: bars(4008.6, 4009.1, 4004.0), trail: trail(4008.6, 4009.1), bb: { bbU: 4016, bbL: 3990, at: NOWt } });
  const b = judge({ id: "t2", book: "recon-tog", asset: "gold", side: "up", tick: 4008.0, at, L: GF, bars: bars(4007.6, 4008.0, 4004.0), trail: [{ t: NOWt - 4000, c: 4007.4 }, { t: NOWt - 2000, c: 4007.6 }, { t: NOWt - 500, c: 4008.0 }] /* fix530: traded red first, then crossed its open - a real turn */, bb: { bbU: 4016, bbL: 3985, at: NOWt } });
  const c = judge({ id: "t3", book: "recon-dly", asset: "gold", side: "up", tick: 4009.10, at, L: GZ, bars: [], trail: [] });
  const ok = !a.ok && /ZONE/.test(a.why) && b.ok && c.ok;
  console.log((a.ok ? "  ✗ " : "  ✓ ") + "the 10:30 PM gold long at 4009.10 (13c over the red zone) is refused: " + (a.why || "(allowed)").slice(0, 90) + ` [${a.ms} ms]`);
  console.log((b.ok ? "  ✓ " : "  ✗ ") + "a clean long mid-channel, zones and Bollinger far, is stamped OK " + (b.ok ? "" : "<- " + b.why.slice(0, 90)) + ` [${b.ms} ms]`);
  console.log((c.ok ? "  ✓ " : "  ✗ ") + "the delayed book is left to her own door");
  console.log(ok ? "SUB-AUDITOR ✓ - he judges on her door, both boards right." : "SUB-AUDITOR ✗ - tell Love.");
  process.exit(ok ? 0 : 1);
}
// one of him at a time
try { const old = Number(fs.readFileSync(PID, "utf8")); if (old && old !== process.pid) { try { process.kill(old, 0); console.log("sub-auditor already running, pid " + old); process.exit(0); } catch {} } } catch {}
fs.writeFileSync(PID, String(process.pid));
load();
let pos = 0; try { pos = fs.statSync(IN).size; } catch { pos = 0; }
let carry = "";
function pump() {
  try {
    const st = fs.existsSync(IN) ? fs.statSync(IN) : null;
    if (!st) return;
    if (st.size < pos) { pos = 0; carry = ""; }
    if (st.size === pos) return;
    const fd = fs.openSync(IN, "r"); const buf = Buffer.alloc(st.size - pos); fs.readSync(fd, buf, 0, buf.length, pos); fs.closeSync(fd); pos = st.size;
    const lines = (carry + buf.toString("utf8")).split("\n"); carry = lines.pop() || "";
    for (const ln of lines) { if (!ln.trim()) continue; let q = null; try { q = JSON.parse(ln); } catch { continue; } if (q && q.id) stamp(judge(q)); }
  } catch {}
}
setInterval(pump, 15);
setInterval(() => { try { load(); } catch {} }, 5000); // her door changed (a click) -> reload it
setInterval(() => { try { fs.writeFileSync(D("sub-auditor-alive.json"), JSON.stringify({ pid: process.pid, at: new Date().toISOString(), door: loadedHash, since: new Date(loadedAt).toISOString() })); } catch {} }, 5000);
process.on("SIGTERM", () => process.exit(0));
