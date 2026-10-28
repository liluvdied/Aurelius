#!/usr/bin/env python3
"""Pure no-pink rule audit (read-only). Love Oct 28 2026 3:34 PM PT:
"can you track every trade that pure takes and flag it against any rules being broken and come tell me
what it was and we will come to a decision on the fix?"
Reads grok-og (recon-np / recon-npo rows) + band-log line snapshots. Writes data/lab/pure-audit.json + .md only."""
import json, bisect, os, sys, datetime
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
SINCE = sys.argv[1] if len(sys.argv) > 1 else "2026-10-28T07:00"
rows = []
for src in ("data/grok-og-archive.jsonl",):
    try:
        for l in open(src):
            try: r = json.loads(l)
            except Exception: continue
            if r.get("lane") in ("recon-np", "recon-npo"): rows.append(r)
    except FileNotFoundError: pass
rows += [r for r in json.load(open("data/grok-og.json")) if r.get("lane") in ("recon-np", "recon-npo")]
seen, T = set(), []
for r in rows:
    k = (r.get("lane"), r.get("ticker"), r.get("at"))
    if k in seen or str(r.get("at")) < SINCE: continue
    seen.add(k); T.append(r)
T.sort(key=lambda r: r["at"])
snaps = {"btc": [], "gold": []}
for l in open("data/band-log.jsonl"):
    if '"2026-10-2' not in l[:30]: continue
    try: s = json.loads(l)
    except Exception: continue
    if s.get("at", "") >= SINCE[:13] and s.get("asset") in snaps: snaps[s["asset"]].append(s)
keys = {a: [s["at"] for s in v] for a, v in snaps.items()}
CUSH = {"btc": 25, "gold": 1.0}
def pt(iso):
    t = datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")) - datetime.timedelta(hours=7)
    return t.strftime("%-I:%M %p")
out = []
for r in T:
    a, sd, spot = r.get("asset"), r.get("side"), float(r.get("spotAt") or 0)
    i = bisect.bisect_right(keys.get(a, []), r["at"]) - 1
    flags = []
    bar = r.get("bar") or {}
    o = bar.get("o")
    if o is not None and spot:
        if sd == "up" and spot < o: flags.append(f"LONG ON A FALLING RED CANDLE (5m open {o}, price {spot})")
        if sd == "down" and spot > o: flags.append(f"SHORT ON A RISING GREEN CANDLE (5m open {o}, price {spot})")
    if i >= 0 and spot:
        s = snaps[a][i]; L = {n: p for n, p in s["L"]}
        lines = sorted(set(p for p in L.values() if p))
        above = [p for p in lines if p > spot]; below = [p for p in reversed(lines) if p < spot]
        nm = lambda p: [n for n, q in L.items() if q == p][0]
        if sd == "up" and above and above[0] - spot <= CUSH[a]:
            flags.append(f"LONG INTO AN UNBROKEN BAND ({nm(above[0])} {above[0]} only {above[0]-spot:.2f} above)")
        if sd == "down" and below and spot - below[0] <= CUSH[a]:
            flags.append(f"SHORT INTO AN UNBROKEN BAND ({nm(below[0])} {below[0]} only {spot-below[0]:.2f} below)")
        vw = L.get("fresh VWAP") or L.get("session VWAP"); u1 = L.get("fresh +1σ") or L.get("+1σ")
        w = abs(u1 - vw) if vw and u1 else 0
        small = w and w < (150 if a == "btc" else 3)
        if above and below:
            lo, hi = below[0], above[0]; pos = (spot - lo) / (hi - lo)
            tol = 0.2 if small else 0.33
            if sd == "up" and pos > 1 - tol: flags.append(f"LONG IN THE TOP {int(tol*100)}% ({nm(lo)} {lo} to {nm(hi)} {hi}, at {pos:.0%})")
            if sd == "down" and pos < tol: flags.append(f"SHORT IN THE BOTTOM {int(tol*100)}% ({nm(lo)} {lo} to {nm(hi)} {hi}, at {pos:.0%})")
        if small and vw:
            if sd == "up" and spot < vw and vw - spot <= w / 2: flags.append(f"LONG UNDER THE BLUE VWAP {vw} (bands small, {vw-spot:.2f} under)")
            if sd == "down" and spot > vw and spot - vw <= w / 2: flags.append(f"SHORT OVER THE BLUE VWAP {vw} (bands small, {spot-vw:.2f} over)")
        pp, s1, r1 = L.get("5m PP"), L.get("5m S1"), L.get("5m R1")
        if a == "btc" and sd == "down" and pp and s1 and s1 < spot < pp and (pp - spot) / (pp - s1) > 0.5:
            flags.append(f"BTC SHORT NEARER GREEN THAN PINK ({(pp-spot)/(pp-s1):.0%} of the way pink {pp} to S1 {s1})")
        if a == "btc" and sd == "up" and pp and r1 and pp < spot < r1 and (spot - pp) / (r1 - pp) > 0.5:
            flags.append(f"BTC LONG NEARER RED THAN PINK ({(spot-pp)/(r1-pp):.0%} of the way pink {pp} to R1 {r1})")
    twin = next((x for x in out if x["at"][:16] == r["at"][:16] and x["asset"] == a and x["side"] == ("long" if sd == "up" else "short") and x["lane"] != r["lane"]), None)
    if twin: twin["lane"] += "+" + r["lane"]; continue
    out.append({"at": r["at"], "pt": pt(r["at"]), "lane": r["lane"], "asset": a, "side": "long" if sd == "up" else "short",
                "label": r.get("label"), "spot": spot, "result": r.get("result"), "pnl": r.get("pnl"), "flags": flags})
json.dump(out, open("data/lab/pure-audit.json", "w"), indent=1)
md = ["# Pure no-pink rule audit (paper + live rows, since " + SINCE + "Z)", ""]
for x in out:
    if x["flags"]:
        md.append(f"- {x['pt']} PT {x['asset'].upper()} {x['side']} ({x['lane']}, {x['label']}) {x['result']} {x['pnl']}")
        md += [f"  - {f}" for f in x["flags"]]
fl = [x for x in out if x["flags"]]
md += ["", f"{len(out)} trades, {len(fl)} flagged, flagged P&L {sum((x['pnl'] or 0) for x in fl):+.2f}, clean P&L {sum((x['pnl'] or 0) for x in out if not x['flags']):+.2f}"]
open("data/lab/pure-audit.md", "w").write("\n".join(md) + "\n")
print("\n".join(md[-40:]))
