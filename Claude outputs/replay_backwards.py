# READ-ONLY replay (Claude, Oct 16 ~10:35 PM PT, Love: "YES PLEASE START THE REPLAY"): every live bot fill Oct 14-16 PT vs her rules.
import json, os, re, sys, collections
from datetime import datetime, timezone, timedelta
D = sys.argv[1]
PT = timezone(timedelta(hours=-7))
t = lambda s: datetime.fromisoformat(str(s).replace('Z', '+00:00')).astimezone(PT)
fires = [r for r in json.load(open(f'{D}/live-fires.json')) if r['at'] >= '2026-10-14T07:00']
fires.sort(key=lambda r: r['at'])
setl = {}
for s in json.load(open(f'{D}/kalshi-history.json'))['settlements'] + json.load(open(f'{D}/kalshi-audit.json'))['settlements']:
    setl[s['ticker']] = s.get('result')
NAMES = {'vwap': 'session VWAP'}
def nm(k): return NAMES.get(k, f'{k}σ')
out = []
for r in fires:
    spot = float(r['spot']); side = r['side']
    bands = {k: float(v) for k, v in (r.get('bands') or {}).items() if v}
    # pink 5m PP when the setup names it with a price, e.g. "break-up at 5m PP (81593.73)"
    m = re.search(r'5m PP \(([\d.]+)\)', r.get('setup') or '')
    if m: bands['5m PP'] = float(m.group(1))
    if not bands: continue
    k, b = min(bands.items(), key=lambda kv: abs(kv[1] - spot))
    need = 'up' if spot > b else 'down' if spot < b else None
    above = sorted([(v - spot, kk) for kk, v in bands.items() if v > spot])
    below = sorted([(spot - v, kk) for kk, v in bands.items() if v < spot])
    nav = r.get('nav') or {}
    o5 = nav.get('close5m')  # open of the 5m candle forming at the fire = last closed 5m close
    falling_through = rising_through = None
    if o5:
        for kk, v in bands.items():
            if o5 > v > spot: falling_through = kk
            if o5 < v < spot: rising_through = kk
    res = setl.get(r['ticker'])
    right = None if res not in ('yes', 'no') else ((side == 'up') == (res == 'yes'))
    inv = (r.get('setup') or '').startswith('Inverse of')
    out.append(dict(at=r['at'], pt=t(r['at']).strftime('%a %I:%M %p'), asset=r['asset'], side=side, setup=r.get('setup'), inv=inv,
                    spot=spot, closest=nm(k) if k != '5m PP' else k, closestPx=b, gap=round(b - spot, 2), need=need,
                    wrongSide=(need is not None and side != need),
                    upRoom=round(above[0][0], 2) if above else None, upBand=(above[0][1] if above else None),
                    dnRoom=round(below[0][0], 2) if below else None, dnBand=(below[0][1] if below else None),
                    fallLong=(side == 'up' and falling_through is not None), riseShort=(side == 'down' and rising_through is not None),
                    through=falling_through if side == 'up' else rising_through,
                    result=res, right=right, cost=r.get('cost'), multiple=r.get('multiple'), sd=r.get('stdev')))
json.dump(out, open(os.path.join(os.path.dirname(__file__), 'replay-oct14-16.json'), 'w'), indent=1)
def wr(xs):
    xs = [x for x in xs if x['right'] is not None]
    return f"{sum(x['right'] for x in xs)}/{len(xs)} right ({(100*sum(x['right'] for x in xs)/len(xs)) if xs else 0:.0f}%)"
main = [x for x in out if not x['inv']]
print('live bot fills Oct 14-16 PT:', len(out), '| main book', len(main), '| inverse', len(out) - len(main))
for lab, xs in [('ALL main-book fills', main),
                ('main: traded AWAY from the closest band (her rule)', [x for x in main if not x['wrongSide']]),
                ('main: traded INTO the closest band (backwards)', [x for x in main if x['wrongSide']]),
                ('main: long on a falling candle through a band / short on a rising one', [x for x in main if x['fallLong'] or x['riseShort']])]:
    print(f'  {lab}: {len(xs)} -> {wr(xs)}')
print('by day (main book): wrong-side fills')
for day in ['Tue', 'Wed', 'Thu', 'Fri']:
    xs = [x for x in main if x['pt'].startswith(day)]
    ws = [x for x in xs if x['wrongSide']]
    if xs: print(f'  {day}: {len(ws)} of {len(xs)} wrong side; wrong-side {wr(ws)}; right-side {wr([x for x in xs if not x["wrongSide"]])}')
print('by asset (main book):')
for a in ['btc', 'gold']:
    xs = [x for x in main if x['asset'] == a]; ws = [x for x in xs if x['wrongSide']]
    print(f'  {a}: {len(ws)} of {len(xs)} wrong side; wrong-side {wr(ws)}; right-side {wr([x for x in xs if not x["wrongSide"]])}')
print('wrong-side main-book fills, newest 15:')
for x in [x for x in main if x['wrongSide']][-15:]:
    print(f"  {x['pt']} {x['asset']} {x['side']:4} spot {x['spot']} | closest {x['closest']} {x['closestPx']} ({x['gap']:+}) | setup: {x['setup'][:60]} | {x['result']} {'RIGHT' if x['right'] else 'WRONG' if x['right'] is False else '?'}")
