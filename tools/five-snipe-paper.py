#!/usr/bin/env python3
"""5M SNIPE PAPER BOOK (Oct 25 ~4:55 AM PT, Love: "the 3-5x's on polymarket on the 5M ones are repeatable i just did it twice in a row on two windows /
do another paper book that does the same thing, 15% -1% chance / enters at a band, candle flip = get in / 3x 5x, 7.5x & 10x pls").
Paper only, read-only on the desk: writes data/five-snipe/ only. Signals = main + rejection BTC calls (at a band) -> first finished 1m candle her way
within 5 min (the flip) -> if her side of the Polymarket BTC 5m market asks 1-15c right then (quotes from data/poly5-quotes.jsonl, fix203), a $10 paper buy
at ask + 1c, one per 5m window. Lanes: cash at 3x, 5x, 7.5x, 10x on her side's bid, else it rides to the bell."""
import json, os, datetime, collections, bisect
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = lambda *p: os.path.join(ROOT, 'data', *p)
START = '2026-10-25T11:55:00Z'; LO, HI = 0.01, 0.15; STAKE = 10.0; LANES = (3, 5, 7.5, 10)
ts = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
pt = lambda t: (datetime.datetime.fromtimestamp(t, datetime.timezone.utc) - datetime.timedelta(hours=7)).strftime('%a %I:%M %p')
now = datetime.datetime.now().timestamp(); t0 = ts(START)
Q = collections.defaultdict(list)
try:
    for l in open(D('poly5-quotes.jsonl')):
        try: q = json.loads(l)
        except Exception: continue
        if q['t'] >= t0 - 60: Q[q['closes']].append(q)
except Exception: pass
bars = {}
for l in open(D('latency-shadow.jsonl')):
    if '"kind":"close"' not in l or '"asset":"btc"' not in l: continue
    try:
        r = json.loads(l); m = ts(r['minute'])
        if m < t0 - 900: continue
        b = r.get('tv') or r.get('tick'); bars[int(m)] = {k: float(b[k]) for k in 'ohlc'}
    except Exception: pass
calls = []
def add(r):
    if r.get('asset') != 'btc' or (r.get('book') or r.get('lane')) not in ('recon-tog', 'recon-rej') or r.get('side') not in ('up', 'down'): return
    if str(r.get('at', '')) >= START: calls.append((ts(r['at']), r.get('book') or r.get('lane'), r['side'], r.get('setup') or r.get('label')))
try:
    for l in open(D('swing5.jsonl')):
        try: add(json.loads(l))
        except Exception: pass
except Exception: pass
try:
    for r in json.load(open(D('grok-og.json'))):
        if '15M-' in str(r.get('ticker', '')): add(r)
except Exception: pass
calls.sort()
sideAsk = lambda q, s: q['ask'] if s == 'up' else round(1 - q['bid'], 3)
sideBid = lambda q, s: q['bid'] if s == 'up' else round(1 - q['ask'], 3)
taken = {}; L = []
for (tc, bk, sd, setup) in calls:
    m0 = int(tc // 60) * 60; te = None
    for k in range(0, 6):
        b = bars.get(m0 + 60 * k)
        if not b or m0 + 60 * k + 60 <= tc: continue
        if (b['c'] > b['o']) == (sd == 'up') and b['c'] != b['o']: te = m0 + 60 * k + 60; break
    if not te: continue
    closes = datetime.datetime.fromtimestamp((int(te // 300) + 1) * 300, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
    if closes in taken: continue
    qs = sorted(Q.get(closes, []), key=lambda q: q['t']); qe = [q for q in qs if te <= q['t'] <= te + 15]
    if not qe: continue
    a = sideAsk(qe[0], sd)
    if not (LO <= a <= HI): continue
    px = round(a + 0.01, 3); taken[closes] = 1
    after = [q for q in qs if q['t'] > qe[0]['t']]; peak = max([sideBid(q, sd) for q in after] or [0])
    w0 = (int(te // 300)) * 300; ob, cb = bars.get(w0), bars.get(w0 + 240); done = now > w0 + 360 and ob and cb
    won = bool(done) and ((cb['c'] >= ob['o']) == (sd == 'up'))
    rec = {'at': te, 'closes': closes, 'book': bk, 'side': sd, 'setup': setup, 'ask': a, 'peakBid': peak, 'settled': ('won' if won else 'lost') if done else 'open', 'lanes': {}}
    for X in LANES:
        if peak >= X * px: res, pnl = f'cashed {X}x', STAKE * X - STAKE
        elif not done: res, pnl = 'open', 0.0
        else: res, pnl = ('bell win' if won else 'lost'), (STAKE / px - STAKE if won else -STAKE)
        rec['lanes'][str(X)] = {'result': res, 'pnl': round(pnl, 2)}
    L.append(rec)
os.makedirs(D('five-snipe'), exist_ok=True)
with open(D('five-snipe', 'ledger.jsonl'), 'w') as fo:
    for x in L: fo.write(json.dumps(x) + '\n')
tot = {X: [0, 0, 0.0] for X in LANES}
for x in L:
    for X in LANES:
        v = x['lanes'][str(X)]
        if v['result'] != 'open': tot[X][0] += v['pnl'] > 0; tot[X][1] += 1; tot[X][2] += v['pnl']
out = ['# 5m snipe paper book 🎯', '', f'Polymarket BTC 5m: main/rejection call at a band + 1m candle flip her way, her side at 1-15c, $10 paper, one per window. Since Sun 04:55 AM PT. Updated {pt(now)} PT.', '',
       '| Lane | Trades | Won | Win rate | P&L |', '|---|---|---|---|---|']
for X in LANES:
    w, n, pl = tot[X]; out.append(f'| cash at {X}x | {n} | {w} | {"-" if not n else f"{100*w/n:.0f}%"} | ${pl:+.2f} |')
out += ['', '| When (PT) | Book | Side | Paid | Peak bid | 3x | 5x | 7.5x | 10x |', '|---|---|---|---|---|---|---|---|---|']
for x in L[-80:]:
    out.append(f"| {pt(x['at'])} | {x['book']} | {x['side']} | {x['ask']} | {x['peakBid']} | " + ' | '.join(f"{x['lanes'][str(X)]['result']} {x['lanes'][str(X)]['pnl']:+.2f}" for X in LANES) + ' |')
open(D('five-snipe', 'REPORT.md'), 'w').write('\n'.join(out) + '\n')
print('ok', len(L))
