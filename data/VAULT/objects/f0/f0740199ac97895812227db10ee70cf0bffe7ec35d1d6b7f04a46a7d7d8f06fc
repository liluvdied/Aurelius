#!/usr/bin/env python3
"""TIGHT-BANDS 10x PAPER BOOK (Oct 25 ~6:36 PM PT, Love: "yes , btc too bb i caught a lil 20x ... like 4-5 in the past few hours that cant be a
coincidence / now we have something to look forward to when bands are tight"). Paper only, read-only on the desk: writes data/tight-bands/ only.
Every Kalshi 15m window (gold + BTC): the first time a side reaches 10x+ (ask 10c or less) while price sits at a band (snipe-tracker "atBand"),
$10 paper on it. Split by band spacing at that moment: TIGHT = 1 sigma under $3 gold / under $100 BTC (fresh bands while carried), else NORMAL
(the control). Lanes: cash at 3x, 5x, 10x, else rides to the bell. Prices from data/snipes/paths (snipe-tracker). Since Oct 18 (all history)."""
import json, os, bisect, datetime, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = lambda *p: os.path.join(ROOT, 'data', *p)
STAKE = 10.0; LANES = (3, 5, 10); TIGHT = {'gold': 3.0, 'btc': 100.0}
pt = lambda t: (datetime.datetime.fromtimestamp(t, datetime.timezone.utc) - datetime.timedelta(hours=7)).strftime('%a %b %d %I:%M %p')
sd = {'gold': ([], []), 'btc': ([], [])}
for l in open(D('band-log.jsonl')):
    try: d = json.loads(l)
    except Exception: continue
    a = d.get('asset')
    if a not in sd: continue
    L = dict((n, p) for n, p in d.get('L', []))
    if 'fresh VWAP' in L and 'fresh +1σ' in L: s = L['fresh +1σ'] - L['fresh VWAP']
    elif 'session VWAP' in L and '+1σ' in L: s = L['+1σ'] - L['session VWAP']
    else: continue
    sd[a][0].append(datetime.datetime.fromisoformat(d['at'].replace('Z', '+00:00')).timestamp()); sd[a][1].append(s)
def sdat(a, t):
    ts, v = sd[a]; i = bisect.bisect_right(ts, t) - 1
    return v[i] if i >= 0 and t - ts[i] < 300 else None
now = datetime.datetime.now().timestamp(); L = []; tot = collections.defaultdict(lambda: [0, 0, 0.0])
for l in open(D('snipes', 'windows.jsonl')):
    w = json.loads(l); a = w.get('asset')
    if a not in TIGHT: continue
    closeT = datetime.datetime.fromisoformat(w['close']).timestamp(); day = w['close'][:10]
    f = D('snipes', 'paths', w['ticker'] + '.json')
    if not os.path.exists(f): continue
    P = json.load(open(f))
    for side, si in (('up', 1), ('down', 2)):
        fs = (w['sides'].get(side) or {}).get('first') or {}
        hits = [v for k, v in fs.items() if float(v.get('mult') or 0) >= 10 and v.get('atBand')]
        if not hits: continue
        h = min(hits, key=lambda v: v['at'])
        hh, mm, ss = map(int, h['at'].split(':'))
        t0 = datetime.datetime.fromisoformat(f"{day}T{hh:02d}:{mm:02d}:{ss:02d}-07:00").timestamp()
        if t0 > closeT + 60: t0 -= 86400
        s = sdat(a, t0)
        if s is None: continue
        grp = 'TIGHT' if s < TIGHT[a] else 'NORMAL'
        px = 1.0 / float(h['mult']) + 0.01
        after = [q for q in P if q[0] > t0]; peak = max([(q[si] or 0) - 0.01 for q in after] or [0])
        done = closeT < now - 60; won = done and w.get('won') == side
        rec = {'at': pt(t0), 'ticker': w['ticker'], 'asset': a, 'side': side, 'group': grp, 'sd': round(s, 2), 'mult': h['mult'], 'band': (h.get('near') or {}).get('band'), 'peakBid': round(peak, 3), 'lanes': {}}
        for X in LANES:
            if peak >= X * px: res, pnl = f'cashed {X}x', STAKE * X - STAKE
            elif not done: res, pnl = 'open', 0.0
            else: res, pnl = ('bell win' if won else 'lost'), (STAKE / px - STAKE if won else -STAKE)
            rec['lanes'][f'{X}x'] = {'result': res, 'pnl': round(pnl, 2)}
            if res != 'open': k = (grp, a, X); tot[k][0] += pnl > 0; tot[k][1] += 1; tot[k][2] += pnl
        L.append((t0, rec))
L.sort(key=lambda x: x[0])
os.makedirs(D('tight-bands'), exist_ok=True)
with open(D('tight-bands', 'ledger.jsonl'), 'w') as fo:
    for _, x in L: fo.write(json.dumps(x) + '\n')
out = ['# Tight-bands 10x paper book 💎', '', f'First 10x+ touch at a band in every Kalshi 15m window, $10 paper. TIGHT = 1σ under $3 gold / $100 BTC; NORMAL is the control. Updated {pt(now)} PT.', '',
       '| Group | Asset | Lane | Trades | Won | Win rate | P&L |', '|---|---|---|---|---|---|---|']
for grp in ('TIGHT', 'NORMAL'):
    for a in ('gold', 'btc'):
        for X in LANES:
            w_, n, pl = tot[(grp, a, X)]
            out.append(f'| {grp} | {a} | cash at {X}x | {n} | {w_} | {"-" if not n else f"{100*w_/n:.0f}%"} | ${pl:+.2f} |')
out += ['', '## Tight-band trades', '', '| When (PT) | Asset | Side | 1σ | Mult | Band | Peak bid | 3x | 5x | 10x |', '|---|---|---|---|---|---|---|---|---|---|']
for _, x in L:
    if x['group'] == 'TIGHT':
        out.append(f"| {x['at']} | {x['asset']} | {x['side']} | {x['sd']} | {x['mult']} | {x['band']} | {x['peakBid']} | " + ' | '.join(f"{x['lanes'][f'{X}x']['result']} {x['lanes'][f'{X}x']['pnl']:+.2f}" for X in LANES) + ' |')
open(D('tight-bands', 'REPORT.md'), 'w').write('\n'.join(out) + '\n')
print('ok', len(L))
