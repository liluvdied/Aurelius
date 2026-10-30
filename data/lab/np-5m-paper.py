# READ-ONLY paper test (Love Oct 28 2026 10:40 AM PT: "let's paper test pure no pink on the 5M market today and we will put it on later if it out performs ours").
# Maps every pure no-pink (recon-np) BTC call onto the Polymarket 5M market open at that moment:
# entry = first quote at/after her call (up: ask, down: 1 - bid), win = last up bid before close >= 0.5 for up (< 0.5 for down).
# Compared with the real 5M (hedges.json kind rej5m) over the same stretch. Writes data/lab/np-5m-paper.json only.
import json, datetime as dt, collections, sys
D = "data/"
STAKE = 7.5; SKIP_PT = {3, 4, 5, 13, 21, 23}
def ts(s): return dt.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
q = collections.defaultdict(list)
for l in open(D + "poly5-quotes.jsonl"):
    try: x = json.loads(l)
    except: continue
    if x.get("bid") is not None and x.get("ask") is not None: q[x["slug"]].append((x["t"], x["bid"], x["ask"]))
q0 = min(v[0][0] for v in q.values())
calls = {}
def take(x):
    if x.get("lane") == "recon-np" and x.get("asset") == "btc" and x.get("side") in ("up", "down") and x.get("at"): calls[x.get("id") or x["at"]] = x
for l in open(D + "grok-og-archive.jsonl"):
    if '"recon-np"' in l and '"btc"' in l:
        try: take(json.loads(l))
        except: pass
g = json.load(open(D + "grok-og.json")); g = g if isinstance(g, list) else g.get("rows", g.get("trades", []))
for x in g: take(x)
def slug_at(t):
    s = int(t // 300 * 300); return "cpc-btc-updown-5m-" + dt.datetime.fromtimestamp(s, dt.timezone.utc).strftime("%Y-%m-%d-%H%Mz"), s + 300
out = []
for x in sorted(calls.values(), key=lambda r: r["at"]):
    t = ts(x["at"])
    if t < q0: continue
    slug, close = slug_at(t)
    if close - t < 60: slug, close = slug_at(t + 60)  # under a minute left: the next 5M market
    qs = q.get(slug)
    if not qs: continue
    after = [r for r in qs if r[0] >= t]
    last = [r for r in qs if r[0] <= close]
    if not after or not last or close - last[-1][0] > 30: continue
    e = after[0]; px = e[2] if x["side"] == "up" else 1 - e[1]
    if not (0.03 <= px <= 0.97): continue
    upWon = last[-1][1] >= 0.5; won = upWon if x["side"] == "up" else not upWon
    pnl = STAKE / px - STAKE if won else -STAKE
    hpt = (dt.datetime.fromtimestamp(t, dt.timezone.utc) - dt.timedelta(hours=7)).hour
    out.append({"at": x["at"], "slug": slug, "side": x["side"], "label": x.get("label"), "entry": round(px, 3), "won": won, "pnl": round(pnl, 2), "hourPT": hpt, "in5mHours": hpt not in SKIP_PT})
start = out[0]["at"] if out else None
h = json.load(open(D + "hedges.json")); h = h if isinstance(h, list) else list(h.values())
real = [r for r in h if isinstance(r, dict) and r.get("kind") == "rej5m" and start and str(r.get("at", "")) >= start]
def summ(rows):
    n = len(rows); w = sum(r["won"] for r in rows); return {"trades": n, "wins": w, "winRate": round(w / n, 3) if n else None, "pnl": round(sum(r["pnl"] for r in rows), 2)}
def realPnl(r):  # banked = net already; "to the bell" settles off the last up bid before close
    if r.get("banked") is not None: return r["banked"]
    qs = [x for x in q.get(r["slug"], []) if x[0] <= ts(r["closesAt"])]
    if not qs or ts(r["closesAt"]) - qs[-1][0] > 30 or time_now() < ts(r["closesAt"]): return None
    upWon = qs[-1][1] >= 0.5; won = upWon if r["side"] == "up" else not upWon
    return (r.get("contracts") or 0) * (1 if won else 0) - (r.get("stake") or 0)
def time_now(): return dt.datetime.now(dt.timezone.utc).timestamp()
rp = [(r, realPnl(r)) for r in real]; rs = [v for _, v in rp if v is not None]
realSum = {"trades": len(real), "settled": len(rs), "wins": sum(1 for v in rs if v > 0), "winRate": round(sum(1 for v in rs if v > 0) / len(rs), 3) if rs else None, "pnl": round(sum(rs), 2)}
byH = collections.defaultdict(list)
for r in out: byH[r["hourPT"]].append(r)
res = {"made": dt.datetime.now(dt.timezone.utc).isoformat(), "from": start, "stake": STAKE, "note": "fees not counted; settlement read from last quote before close",
       "pureNoPinkOn5M": summ(out), "pureNoPinkOn5M_in5mHours": summ([r for r in out if r["in5mHours"]]), "real5M": realSum,
       "byHourPT": {k: summ(v) for k, v in sorted(byH.items())}, "trades": out}
json.dump(res, open(D + "lab/np-5m-paper.json", "w"), indent=1)
print(json.dumps({k: res[k] for k in ("from", "pureNoPinkOn5M", "pureNoPinkOn5M_in5mHours", "real5M", "byHourPT")}, indent=0))
