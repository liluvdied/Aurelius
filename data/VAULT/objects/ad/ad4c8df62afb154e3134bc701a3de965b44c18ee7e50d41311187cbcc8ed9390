#!/usr/bin/env python3
# 5m CANDLE PAPER BOOKS (read-only; Love Oct 25 ~1:56 PM PT: "i'd like to try running a couple paper 5M books with 2 & 3 minute candles ... same framework,
# just 2 & 3 minute candles - they'll be stronger than the 1M, and quicker than the 5M"). For every main / rejection BTC call (data/five/calls.jsonl, written
# by tools/five-paper.py) since Sun Oct 25 2:00 PM PT: wait for the first 2m (lane 2m) or 3m (lane 3m) candle after the call that closes her way (candles
# built from the desk's 1m bars, aligned to the clock), enter the Polymarket BTC 5m window open at that close if 3+ minutes are left and her side's ask
# (data/poly5-quotes.jsonl) is 30-70c - the live 5m lane's own guards. $5 paper at the ask, one per lane per window, settled on the 5m window
# (BTC close vs open). Writes only data/five-candle/.
import json, os, datetime, bisect
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = lambda *p: os.path.join(ROOT, 'data', *p)
ts = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
SINCE = ts('2026-10-25T21:00:00Z'); STAKE = 5.0
bars = {}
for l in open(D('latency-shadow.jsonl')):
    if '"kind":"close"' not in l or '"asset":"btc"' not in l: continue
    try: r = json.loads(l); b = r.get('tv') or r.get('tick'); bars[int(ts(r['minute']))] = {k: float(b[k]) for k in 'ohlc'}
    except Exception: pass
Q = {}
for l in open(D('poly5-quotes.jsonl')):
    try: q = json.loads(l)
    except Exception: continue
    t0 = q.get('t'); t0 = t0 / 1000 if t0 > 1e11 else t0
    Q.setdefault(q.get('closes'), []).append((t0, q.get('bid'), q.get('ask')))
for k in Q: Q[k].sort()
def ask_at(side, te, s5):
    L = Q.get(datetime.datetime.fromtimestamp(s5 + 300, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'))
    if not L: return None
    i = bisect.bisect_left(L, (te,)); c = [x for x in L[max(0, i - 1):i + 3] if abs(x[0] - te) <= 8 and x[1] is not None and x[2] is not None]
    if not c: return None
    _, b, a = min(c, key=lambda x: abs(x[0] - te)); return a if side == 'up' else round(1 - b, 3)
def candle(s0, n):
    bs = [bars.get(s0 + 60 * j) for j in range(n)]
    return None if any(b is None for b in bs) else (bs[0]['o'], bs[-1]['c'])
now = datetime.datetime.now(datetime.timezone.utc).timestamp()
calls = []
try: calls = [json.loads(l) for l in open(D('five', 'calls.jsonl'))]
except Exception: pass
rows = []; taken = set()
for x in sorted(calls, key=lambda x: x['at']):
    t = ts(x['at']); bk = x.get('book'); sd = x.get('side')
    if t < SINCE or bk not in ('recon-tog', 'recon-rej') or sd not in ('up', 'down'): continue
    for N in (2, 3):
        st = int(t // (60 * N)) * (60 * N); te = None
        for k in range(8):
            s0 = st + 60 * N * k
            if s0 + 60 * N <= t: continue
            if s0 + 60 * N > t + 360: break
            c = candle(s0, N)
            if not c: break
            if (c[1] > c[0]) == (sd == 'up') and c[1] != c[0]: te = s0 + 60 * N; break
        if not te: continue
        s5 = int(te // 300) * 300; left = s5 + 300 - te
        if left < 180 or (N, s5) in taken: continue
        a = ask_at(sd, te, s5)
        if not a or not (0.30 <= a <= 0.70): continue
        taken.add((N, s5))
        o = bars.get(s5); cl = bars.get(s5 + 240)
        if o and cl and s5 + 300 <= now: won = (cl['c'] >= o['o']) == (sd == 'up'); res = 'win' if won else 'loss'; pnl = round(STAKE * (1 / a - 1), 2) if won else -STAKE
        else: res, pnl = 'open', 0.0
        rows.append({'lane': f'{N}m', 'at': datetime.datetime.fromtimestamp(te, datetime.timezone.utc).isoformat(), 'book': bk, 'side': sd, 'ask': a, 'left': int(left), 'result': res, 'pnl': pnl})
os.makedirs(D('five-candle'), exist_ok=True)
json.dump(rows, open(D('five-candle', 'rows.json'), 'w'), indent=1)
pt = lambda iso: datetime.datetime.fromisoformat(iso).astimezone(datetime.timezone(datetime.timedelta(hours=-7))).strftime('%a %I:%M %p')
out = ['# 5m candle paper books 🎴', '', f"2m and 3m candle flips on the Polymarket BTC 5m board (main + rejection calls), 3+ minutes left, her side 30-70c, $5 paper. Since Sun 02:00 PM PT. Updated {datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-7))).strftime('%a %I:%M %p')} PT.", '',
       '| Lane | Trades | Won | Lost | Open | Win rate | P&L |', '|---|---|---|---|---|---|---|']
for ln in ('2m', '3m'):
    r = [x for x in rows if x['lane'] == ln]; w = sum(x['result'] == 'win' for x in r); lo = sum(x['result'] == 'loss' for x in r); op = sum(x['result'] == 'open' for x in r)
    out.append(f"| {ln} candles | {len(r)} | {w} | {lo} | {op} | {(f'{100*w/(w+lo):.0f}%' if w + lo else '-')} | ${sum(x['pnl'] for x in r):+.2f} |")
out += ['', 'Replay before launch (Oct 25 4:50 AM - 1:15 PM PT, quotes on file, main + rejection): 2m flip with 3+ min left 22/25 = 88% (+63%/trade); 3m flip with 3+ min left 9/11 = 82% (+47%/trade); 1m flip with 4+ min left 29/42 = 69% (+27%/trade). Small samples.', '',
        '| When (PT) | Lane | Book | Side | Ask | Left | Result | P&L |', '|---|---|---|---|---|---|---|---|']
names = {'recon-tog': 'MAIN 💞', 'recon-rej': 'REJECTION 🎯'}
for x in rows: out.append(f"| {pt(x['at'])} | {x['lane']} | {names[x['book']]} | {x['side']} | {x['ask']} | {x['left']}s | {x['result']} | ${x['pnl']:+.2f} |")
open(D('five-candle', 'REPORT.md'), 'w').write('\n'.join(out) + '\n')
print('five-candle-paper:', len(rows), 'rows')
