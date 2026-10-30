#!/usr/bin/env python3
"""FEED TWIN LEDGERS (Claude, Love: "run them both side by side"). Settles data/feed-twin.jsonl (every BTC setup
the desk looked at, with her DNA answered on PEPPERSTONE lines and on VANTAGE lines) against Kalshi results in
data/feedmatch.json. $50 a trade ($25 at 3x+), held to the bell. Paper study only."""
import json, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
p = os.path.join(D, "feed-twin.jsonl")
rows = [json.loads(l) for l in open(p)] if os.path.exists(p) else []
res = {}
for m in json.load(open(os.path.join(D, "feedmatch.json")))["markets"].get("btc", []): res[m["tk"]] = m.get("result")
def pnl(r):
    out = res.get(r["ticker"])
    if out not in ("yes", "no"): return None
    mult = 1 / r["ask"]; stake = 25 if mult >= 3 else 50
    win = (out == "yes") == (r["side"] == "up")
    return round(stake * (mult - 1), 2) if win else -stake
books = {"PEPPERSTONE · 25% rule": lambda r: "pepChan" in r and not r["pepChan"], "VANTAGE · 25% rule": lambda r: "vanChan" in r and not r["vanChan"],
         "PEPPERSTONE · 5M SOLE lines": lambda r: "pep5" in r and not r["pep5"], "VANTAGE · 5M SOLE lines": lambda r: "van5" in r and not r["van5"],
         "PEPPERSTONE lines": lambda r: not r["pepWhy"], "VANTAGE lines": lambda r: not r["vanWhy"],
         "only Pepperstone said yes": lambda r: not r["pepWhy"] and r["vanWhy"], "only Vantage said yes": lambda r: r["pepWhy"] and not r["vanWhy"],
         "both said yes": lambda r: not r["pepWhy"] and not r["vanWhy"]}
print(f"FEED TWIN · {len(rows)} BTC setups seen since {rows[0]['at'][:16] if rows else '-'}Z")
out = {}
for name, f in books.items():
    xs = [(r, pnl(r)) for r in rows if f(r)]
    done = [x for x in xs if x[1] is not None]
    w = sum(1 for _, v in done if v > 0)
    tot = round(sum(v for _, v in done), 2)
    out[name] = {"taken": len(xs), "settled": len(done), "wins": w, "pnl": tot}
    print(f"  {name:28s} took {len(xs):3d}  settled {len(done):3d}  {w}W-{len(done)-w}L  {tot:+9.2f}")
json.dump(out, open(os.path.join(D, "feed-twin.json"), "w"), indent=1)
