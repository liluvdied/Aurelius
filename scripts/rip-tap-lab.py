#!/usr/bin/env python3
"""RIP-TAP LAB (Claude, Oct 5 ~5 PM PT, Love: "after btc has gone in one direction violently, rips thru one band and taps the
next band on pepperstone... those are like 4-8x... with some time left on the clock they've been hitting pretty often").
Event (BTC, the desk's Pepperstone feed, data/nav-tape.json, 1-minute): within the last W minutes price was beyond one of her
session bands (VWAP +/- 0.5 sigma steps to 3 sigma) and now touches the NEXT band in the direction of the move (within $tol).
Ticket: the bounce side (move down -> Up), bought at that minute's Kalshi ask (data/stop-lab-candles.json), only between
minAsk and maxAsk with 4+ minutes left, one per window, held to the bell. $5 a ticket.
Fair test: a ticket at price p must win more than p of the time to make money."""
import json, os, re, calendar, sys
D = os.path.join(os.getcwd(), "data")
tape = sorted([r for r in json.load(open(os.path.join(D, "nav-tape.json"))) if r.get("a") == "btc"], key=lambda r: r["t"])
cand = json.load(open(os.path.join(D, "stop-lab-candles.json")))["candles"]
bell = {}
for line in open(os.path.join(D, "exit-ledger.jsonl")):
    try:
        e = json.loads(line)
    except Exception:
        continue
    if e.get("bell") in ("yes", "no"): bell[e["id"].split(":")[0]] = e["bell"]
for r in json.load(open(os.path.join(D, "night-book.json"))):
    if r.get("bell") in ("yes", "no"): bell[r["ticker"]] = r["bell"]
def close_of(t):
    m = re.search(r"-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)", t)
    mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"].index(m.group(2))
    return calendar.timegm((2000 + int(m.group(1)), mon + 1, int(m.group(3)), int(m.group(4)) + (4 if 2 <= mon <= 9 else 5), int(m.group(5)), 0))
def result(tk):
    if tk in bell: return bell[tk]
    cs = cand.get(tk)
    if cs and cs[-1][3] is not None and close_of(tk) - cs[-1][0] <= 60:
        if cs[-1][3] >= 0.95: return "yes"
        if cs[-1][6] is not None and cs[-1][6] <= 0.05: return "no"
    return None
def ask_at(tk, side, t):
    for (end, bl, bh, bc, al, ah, ac) in cand.get(tk, []):
        if end >= t + 60:
            if side == "up": return ac
            return None if bc is None else round(1 - bc, 4)
    return None
def run(W=5, tol=15, minAsk=0.05, maxAsk=0.25, minLeft=4, verbose=False):
    by_t = {r["t"]: r for r in tape}
    taken = set(); out = []
    for r in tape:
        if not r.get("vw") or not r.get("sd") or not r.get("tk") or r.get("left") is None: continue
        if r["left"] < minLeft * 60: continue
        tk = r["tk"]
        if tk in taken: continue
        vw, sd, px = r["vw"], r["sd"], r["spot"]
        bands = [vw + k * 0.5 * sd for k in range(-6, 7)]
        prev = [by_t.get(r["t"] - 60 * i) for i in range(1, W + 1)]
        prev = [p for p in prev if p and p.get("tk") == tk]
        if not prev: continue
        hi = max(p["spot"] for p in prev); lo = min(p["spot"] for p in prev)
        side = None
        for j in range(len(bands) - 1):
            Lnext, Lrip = bands[j], bands[j + 1]          # down move: was above Lrip, now taps Lnext below it
            if hi >= Lrip and abs(px - Lnext) <= tol and px < Lrip: side = "up"; band = (j - 6) / 2; break
        if not side:
            for j in range(1, len(bands)):
                Lnext, Lrip = bands[j], bands[j - 1]      # up move: was below Lrip, now taps Lnext above it
                if lo <= Lrip and abs(px - Lnext) <= tol and px > Lrip: side = "down"; band = (j - 6) / 2; break
        if not side: continue
        ask = ask_at(tk, side, r["t"])
        if ask is None or not (minAsk <= ask <= maxAsk): continue
        res = result(tk)
        if res is None: continue
        taken.add(tk)
        won = (res == "yes") == (side == "up")
        pnl = 5 / ask - 5 if won else -5
        out.append((r["t"], tk, side, band, ask, r["left"] // 60, won, round(pnl, 2)))
    return out
if __name__ == "__main__":
    from datetime import datetime, timezone, timedelta
    print("tape", datetime.fromtimestamp(tape[0]["t"], timezone.utc).isoformat()[:16], "->", datetime.fromtimestamp(tape[-1]["t"], timezone.utc).isoformat()[:16], "| windows with prices:", len(cand))
    for W in (3, 5, 8):
        for (mn, mx) in ((0.05, 0.25), (0.11, 0.25), (0.05, 0.125)):
            o = run(W=W, minAsk=mn, maxAsk=mx)
            if not o: print(f"W={W} {mn}-{mx}: none"); continue
            n = len(o); w = sum(x[6] for x in o); pnl = sum(x[7] for x in o); avg = sum(x[4] for x in o) / n
            print(f"  move inside {W}m · price {int(mn*100)}-{int(mx*100)}c: {n:3d} tickets  won {w:2d} ({100*w/n:4.1f}%  vs {100*avg:4.1f}% needed)  ${pnl:+8.2f} on $5 each")
    o = run()
    print("\n  the tickets (W=5, 5-25c):")
    for x in o:
        t = (datetime.fromtimestamp(x[0], timezone.utc) - timedelta(hours=7)).strftime("%a %H:%M")
        print(f"   {t} PT  {x[2]:4s} off the {x[3]:+.1f}σ  at {int(x[4]*100)}c  {x[5]}m left  {'WON' if x[6] else 'lost'}  {x[7]:+.2f}")
