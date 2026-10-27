#!/usr/bin/env python3
# FREE TO TRADE - LIVE BEHAVIOUR TEST (Oct 27 2026 ~1:59 PM PT, Love: "please make sure that stops happening permanently. that is the 4th time in the past
# 24 hours i have said that same exact sentence to you and the 4th time you confirmed."). Her rule (Love Oct 27 1:10 PM PT: "she is to take any set up that
# comes that fits her rules if she is not actively in a position on kalshi" + 1:13 PM: "YES. ONE EXECUTED TRADE PER WINDOW. EXECUTED. EXECUTED. EXECUTED.
# EXECUTED. NO TRADE EXECUTED - FREEEE TO TRADE." + ~1:58 PM: "STOP LIMITING HER TO ONE CALL OF A TRADE SHE DID NOT EVEN FUCKING TAKE").
# This does not just look for words: it lifts the real gate out of src/lib/desk/recon.ts and RUNS it on made-up windows - she called, nothing filled on
# Kalshi, a new setup shows up - on main AND the rejection model. If she is held by a call she never took, or let in while a real fill is open, this fails.
# Usage: python3 tools/free-to-trade-test.py [path/to/recon.ts]
import os, re, sys, json, subprocess, tempfile
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
path = sys.argv[1] if len(sys.argv) > 1 else "src/lib/desk/recon.ts"
R = open(path, encoding="utf8").read()
bad = []
def need(ok, what):
    print(("  ✓ " if ok else "  ✗ ") + what)
    if not ok: bad.append(what)
print("FREE TO TRADE (her words: NO TRADE EXECUTED - FREEEE TO TRADE)")
a = R.find('let freeId = "";'); b = R.find("if (prior && !freeId)", a)
need(a >= 0 and b > a, "the free-to-trade gate is in her code")
need("id: freeId || `${m.ticker}:${lane}`" in R, "a free call books as its own fresh row")
if a >= 0 and b > a:
    gate = re.sub(r"\bas any\b", "", R[a:b])
    js = r"""
const S = JSON.parse(process.argv[2]); const out = [];
for (const s of S) {
  const files = { "live-book-done.json": JSON.stringify(s.done) };
  const readFileSync = (p) => { if (!(p in files)) throw new Error("nofile"); return files[p]; };
  const D = (f) => f; const m = { ticker: "KXT" }; const lane = s.lane; const rows = s.rows; const prior = rows.find((r) => r.ticker === m.ticker && r.lane === lane);
  globalThis.__oneDoor = new Set(s.door ? ["KXT"] : []);
  const run = () => { GATE ; return freeId; };
  let r; try { r = run(); } catch (e) { r = "ERR " + e.message; }
  out.push(r === false ? "held" : (r ? "free" : "held"));
}
console.log(JSON.stringify(out));
""".replace("GATE", gate)
    def row(lane, res, n=""): return {"ticker": "KXT", "lane": lane, "id": "KXT:" + lane + n, "result": res}
    def dk(lane, st, fin, n=""): return {f"KXT:{lane}:KXT:{lane}{n}": {"status": st, "final": fin}}
    S, want = [], []
    for lane, nm in (("recon-tog", "main"), ("recon-rej", "rejection model")):
        S += [{"lane": lane, "rows": [row(lane, "loss")], "done": dk(lane, "skipped", True)}];            want.append(("free", f"{nm}: called, paper closed, Kalshi never filled -> new setup TAKEN"))
        S += [{"lane": lane, "rows": [row(lane, "open")], "done": dk(lane, "skipped", True)}];            want.append(("free", f"{nm}: called, paper still open, Kalshi gave up unfilled -> new setup TAKEN"))
        S += [{"lane": lane, "rows": [row(lane, "open")], "done": dk(lane, "missed", True)}];             want.append(("free", f"{nm}: called, Kalshi missed the price -> new setup TAKEN"))
        S += [{"lane": lane, "rows": [row(lane, "win", ":n2"), row(lane, "loss")], "done": {**dk(lane, "skipped", True), **dk(lane, "skipped", True, ":n2")}}]; want.append(("free", f"{nm}: two calls, neither taken -> third setup TAKEN"))
        S += [{"lane": lane, "rows": [row(lane, "win")], "done": dk(lane, "filled", False)}];             want.append(("held", f"{nm}: a real Kalshi FILL -> window locked (one executed trade)"))
        S += [{"lane": lane, "rows": [row(lane, "loss")], "done": dk(lane, "partial", True)}];            want.append(("held", f"{nm}: a partial fill -> window locked"))
        S += [{"lane": lane, "rows": [row(lane, "loss")], "done": dk(lane, "resting", False)}];           want.append(("held", f"{nm}: an order resting on Kalshi -> window locked"))
        S += [{"lane": lane, "rows": [row(lane, "loss")], "done": dk(lane, "skipped", True), "door": True}]; want.append(("held", f"{nm}: a fill already through the one door -> window locked"))
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f: f.write(js); jp = f.name
    p = subprocess.run(["node", jp, json.dumps(S)], capture_output=True, text=True); os.unlink(jp)
    try: got = json.loads(p.stdout.strip().split("\n")[-1])
    except Exception: got = []; need(False, "her gate ran (" + (p.stderr.strip().split("\n") or [""])[-1][:120] + ")")
    for i, (w, what) in enumerate(want):
        g = got[i] if i < len(got) else "?"
        need(g == w, what + ("" if g == w else f"  (she was {g.upper()})"))
if bad: print("FREE TO TRADE BROKEN - tell Love before anything else:", "; ".join(bad)); sys.exit(1)
print("FREE TO TRADE ✓ - a call she never took never holds her; a real fill always does.")
