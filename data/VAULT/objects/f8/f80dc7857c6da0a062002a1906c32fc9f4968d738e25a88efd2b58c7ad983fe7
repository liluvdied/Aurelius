#!/usr/bin/env python3
"""HIGH-MULTIPLE PAPER BOOK (Oct 25 ~4:30 AM PT, Love: "run a paper one !! high multiple book that trades off of bands the same way
our main does, price falling price rising 33 etc / a $10 book :)) and let's try doing 3 & 5x as well pls").
Paper only, read-only on the desk: writes data/highmult/ only. Every main-book (recon-tog) call whose Kalshi ask is 10c or less (10x+),
one per window, $10 each, three lanes: cash at 3x, 5x, 10x (else rides to the bell). Prices from data/snipes/paths (snipe-tracker)."""
import json, os, datetime, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = lambda *p: os.path.join(ROOT, 'data', *p)
START = '2026-10-25T11:30:00Z'; MAXASK = 0.10; STAKE = 10.0; LANES = (3, 5, 10)
ts = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
pt = lambda t: (datetime.datetime.fromtimestamp(t, datetime.timezone.utc) - datetime.timedelta(hours=7)).strftime('%a %I:%M %p')
rows = {}
def take(r):
    if (r.get('lane') or r.get('book')) != 'recon-tog' or r.get('ask') is None: return
    if str(r.get('at', '')) < START or not (0 < float(r['ask']) <= MAXASK): return
    k = r.get('ticker')
    if k not in rows or str(r['at']) < str(rows[k]['at']): rows[k] = r
for f in ('grok-og-archive.jsonl',):
    try:
        for l in open(D(f)):
            try: take(json.loads(l))
            except Exception: pass
    except Exception: pass
try:
    for r in json.load(open(D('grok-og.json'))): take(r)
except Exception: pass
os.makedirs(D('highmult'), exist_ok=True)
L = []; tot = collections.defaultdict(lambda: [0, 0, 0.0])
for tk, r in sorted(rows.items(), key=lambda x: x[1]['at']):
    t0 = ts(r['at']); px = float(r['ask']) + 0.01; si = 1 if r['side'] == 'up' else 2
    f = D('snipes', 'paths', f'{tk}.json'); P = json.load(open(f)) if os.path.exists(f) else []
    after = [q for q in P if q[0] > t0]; done = bool(P) and P[0][0] + 900 < datetime.datetime.now().timestamp() - 60
    peak = max([(q[si] or 0) - 0.01 for q in after] or [0]); won = done and (P[-1][si] or 0) >= 0.9
    rec = {'at': r['at'], 'ticker': tk, 'asset': r.get('asset'), 'side': r['side'], 'label': r.get('label'), 'ask': r['ask'], 'peakBid': round(peak, 3), 'settled': ('won' if won else 'lost') if done else 'open', 'lanes': {}}
    for X in LANES:
        if peak >= X * px: res, pnl = f'cashed {X}x', STAKE * X - STAKE
        elif not done: res, pnl = 'open', 0.0
        else: res, pnl = ('bell win' if won else 'lost'), (STAKE / px - STAKE if won else -STAKE)
        rec['lanes'][f'{X}x'] = {'result': res, 'pnl': round(pnl, 2)}
        if res != 'open': tot[X][0] += pnl > 0; tot[X][1] += 1; tot[X][2] += pnl
    L.append(rec)
with open(D('highmult', 'ledger.jsonl'), 'w') as fo:
    for x in L: fo.write(json.dumps(x) + '\n')
now = datetime.datetime.now().timestamp()
out = ['# High-multiple paper book 💎', '', f'Main-book calls at 10x+ (Kalshi ask 10c or less), one per window, $10 each, since Sun 04:30 AM PT. Paper only. Updated {pt(now)} PT.', '',
       '| Lane | Trades | Won | Win rate | P&L |', '|---|---|---|---|---|']
for X in LANES:
    w, n, pl = tot[X]; out.append(f'| cash at {X}x | {n} | {w} | {"-" if not n else f"{100*w/n:.0f}%"} | ${pl:+.2f} |')
out += ['', '| When (PT) | Asset | Side | Ask | Setup | Peak bid | 3x | 5x | 10x |', '|---|---|---|---|---|---|---|---|---|']
for x in L[-60:]:
    out.append(f"| {pt(ts(x['at']))} | {x['asset']} | {x['side']} | {x['ask']} | {str(x['label'])[:50]} | {x['peakBid']} | " + ' | '.join(f"{x['lanes'][f'{X}x']['result']} {x['lanes'][f'{X}x']['pnl']:+.2f}" for X in LANES) + ' |')
out += ['', 'Replay before launch (Oct 19-25, main calls at 10x+, n=16): cash 3x won 1/16 (-$8.12/trade), 5x 1/16 (-$6.88), 10x 0/16 (-$10).']
open(D('highmult', 'REPORT.md'), 'w').write('\n'.join(out) + '\n')
print('ok', len(L))
