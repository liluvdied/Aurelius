#!/usr/bin/env python3
"""WHAT HAPPENED (Love, Oct 16 ~7:15 PM PT: "so you never - not have an answer for me when i ask what just happened").
Usage:  python3 tools/what-happened.py [TICKER | last | btc | gold]
One 15-minute Kalshi window, start to finish, in 12-hour Pacific time: what her book called, what the gate refused and why,
every order the desk sent (and which code sent it), every order she placed by hand, every fill Kalshi reports, every desk
close and the reason, and how the window settled. Reads only; changes nothing."""
import json, os, re, sys, datetime as dt
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
PT = dt.timezone(dt.timedelta(hours=-7))  # PDT; good through Nov 1
def p(f):
    return os.path.join(D, f)
def jl(f):
    out = []
    try:
        with open(p(f)) as fh:
            for l in fh:
                try: out.append(json.loads(l))
                except Exception: pass
    except FileNotFoundError: pass
    return out
def jf(f, d=None):
    try: return json.load(open(p(f)))
    except Exception: return d
def ts(s):
    s = str(s or "").replace("Z", "+00:00")
    m = re.match(r"^(.*T\d\d:\d\d:\d\d)(\.\d+)?(.*)$", s)
    if m: s = m.group(1) + ((m.group(2) + "000000")[:7] if m.group(2) else "") + (m.group(3) or "+00:00")
    try: return dt.datetime.fromisoformat(s)
    except Exception: return None
def t12(x):
    return x.astimezone(PT).strftime("%I:%M:%S %p").lstrip("0")
MON = {m: i for i, m in enumerate(["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"], 1)}
def window(t):
    m = re.search(r"-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)-", t)
    if not m: return None, None
    yy, mon, dd, hh, mi = m.groups()
    close = dt.datetime(2000 + int(yy), MON[mon], int(dd), int(hh), int(mi), tzinfo=dt.timezone(dt.timedelta(hours=-4)))  # ET
    return close - dt.timedelta(minutes=15), close
def asset_of(t):
    return "btc" if t.startswith("KXBTC") else "gold" if t.startswith("KXGOLD") else None
arg = (sys.argv[1] if len(sys.argv) > 1 else "last").strip()
done = jf("live-book-done.json", {}) or {}
audit = jf("kalshi-audit.json", {}) or {}
if arg in ("last", "btc", "gold"):
    pre = {"btc": "KXBTC15M", "gold": "KXGOLD15M"}.get(arg, "KX")
    cands = [(v.get("at", ""), v.get("ticker", "")) for v in done.values() if str(v.get("ticker", "")).startswith(pre)]
    cands += [(f.get("t", ""), f.get("ticker", "")) for f in audit.get("fills", []) if str(f.get("ticker", "")).startswith(pre) and "15M" in str(f.get("ticker", ""))]
    T = max(cands)[1] if cands else ""
else:
    T = arg
a0, a1 = window(T)
if not a0: sys.exit(f"can't read a 15-minute window from '{T}'")
A = asset_of(T)
lo, hi = a0 - dt.timedelta(minutes=2), a1 + dt.timedelta(minutes=3)
ev = []
def add(at, kind, text):
    x = ts(at)
    if x and lo <= x <= hi: ev.append((x, kind, text))
# her book's calls (first call and every change of side)
last = None
for j in jl("gold-law.jsonl"):
    if j.get("ticker") == T and j.get("lane") == "ogp5-fast":
        k = (j.get("side"), j.get("kind"), j.get("band"))
        if k != last:
            last = k
            add(j["at"], "CALL", f"main book called {'LONG' if j['side']=='up' else 'SHORT'}: {j.get('kind')} at {j.get('band')} ({j.get('bandPx')}), price {j.get('tick')}, 5m open {j.get('fiveOpen')}")
# book decisions
for v in done.values():
    if v.get("ticker") == T:
        add(v.get("at"), "BOOK", f"{v.get('side')} -> {v.get('status')}" + (f" at {v.get('paid')}" if v.get('paid') else "") + (f" ({v.get('reason')})" if v.get("reason") else ""))
# gate refusals (live) and feed holds for this asset in the window - collapsed by reason
seen = {}
for j in jl("band-lock.jsonl"):
    if j.get("paper") or j.get("asset") != A: continue
    x = ts(j.get("at"))
    if not x or not (a0 <= x <= a1): continue
    r = re.sub(r"[\d.]+", "#", str(j.get("reason", "")))
    if r not in seen: seen[r] = [x, 0, j]
    seen[r][1] += 1
for r, (x, n, j) in seen.items():
    ev.append((x, "GATE", f"refused {j.get('book')} {j.get('side')} x{n}: {j.get('reason')}"))
seenh = {}
for j in jl("stale-guard.jsonl"):
    if j.get("asset") != A: continue
    x = ts(j.get("at"))
    if not x or not (a0 <= x <= a1): continue
    r = re.sub(r"\d+", "#", str(j.get("why", "")))
    if r not in seenh: seenh[r] = [x, 0, j]
    seenh[r][1] += 1
for r, (x, n, j) in seenh.items():
    ev.append((x, "HOLD", f"feed hold x{n} (first): {j.get('why')}"))
# every order the desk sent (with the code that sent it)
for j in jl("order-trail.jsonl"):
    if j.get("ticker") == T:
        add(j["at"], "DESK", f"{j.get('method')} {j.get('action') or ''} {j.get('side') or ''} {j.get('count') or ''} @ {j.get('price') or ''}{' reduce-only' if j.get('reduceOnly') else ''} -> {j.get('result')}  | by {j.get('by')}")
for j in jl("flatten-calls.jsonl"):
    if j.get("ticker") == T: add(j["at"], "CLOSE", f"desk close requested (manual={j.get('manual')}) by {j.get('from')}")
for j in jl("align-prime.jsonl"):
    if j.get("ticker") == T: add(j["at"], "ALIGN", f"prime alignment {j.get('action')}: {j.get('why')}")
for f in ("change-mind-live.jsonl", "backwards-guard.jsonl"):
    for j in jl(f):
        if str(j.get("ticker", j.get("id", ""))).startswith(T): add(j["at"], "GUARD", f"{f.split('.')[0]}: {json.dumps(j)[:200]}")
for j in jl("tp-rest.jsonl"):
    if j.get("ticker") == T: add(j["at"], "TP", f"take-profit {'cancel: ' + j['cancel'] if j.get('cancel') else 'rest at ' + str(j.get('px')) + ' for ' + str(j.get('qty'))}")
# her hand orders
hseen = set()
for o in (jf("outside-orders.json", []) or []) + jl("hand-trail.jsonl"):
    k = (str(o.get("at"))[:19], o.get("qty"))
    if o.get("ticker") == T and k not in hseen:
        hseen.add(k); add(o.get("at"), "HAND", f"YOUR order: {o.get('action')} {o.get('side')} {o.get('qty')} ({o.get('status')})")
# Kalshi fills (truth) + settlement
# who placed each fill: desk orders carry a client id, her app orders don't (Kalshi's own order list + the hand trail)
who = {}
for o in audit.get("orders", []) or []:
    if o.get("id"): who[str(o["id"])[:13]] = "desk" if o.get("client") else "you (hand)"
handAt = {str(j.get("at"))[:19] for j in jl("hand-trail.jsonl") if j.get("ticker") == T}
for f in audit.get("fills", []):
    if f.get("ticker") == T:
        w = who.get(str(f.get("order", ""))[:13]) or ("you (hand)" if str(f.get("t"))[:19] in handAt else "?")
        add(f.get("t"), "FILL", f"Kalshi fill by {w}: {f.get('action')} {f.get('side')} {f.get('count')} @ yes {f.get('yes')} / no {f.get('no')}, fee {f.get('fee')}")
for s in audit.get("settlements", []) or []:
    if s.get("ticker") == T: ev.append((ts(s.get("t") or s.get("settled_time") or a1.isoformat()) or a1, "SETTLE", json.dumps(s)[:200]))
for r in jf("grok-og.json", []) or []:
    if r.get("ticker") == T and r.get("lane") == "ogp5-fast" and r.get("result") not in (None, "open"):
        ev.append((a1, "RESULT", f"main book's paper call {r.get('side')} -> {r.get('result')}")); break
ev.sort(key=lambda e: e[0])
print(f"{T}  ({A}, window {t12(a0)} - {t12(a1)} PT)")
for x, k, t in ev:
    print(f"{t12(x):>12}  {k:<6} {t}")
if not ev: print("nothing recorded for this window")
