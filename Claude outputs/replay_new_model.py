# READ-ONLY (Claude, Oct 16 ~11:10 PM PT, Love: "run all of the trades that fired backwards against the new model and see if those
# trades were blocked"). For every live bot fill we have chart bars for, rebuild what the NEW gate sees at that minute from her
# chart's own 1m bars (BTC = PEPPERSTONE, gold = TVC): session VWAP/sigma (5 PM ET, 5m, hlc3), 5m pink + red/green zones (forming
# candle in), the live 5m candle, volume pace. Then: blocked or allowed, and what the flipped side would have done.
import json, math, sys, os
from datetime import datetime, timezone, timedelta
D = sys.argv[1]; PT = timezone(timedelta(hours=-7))
def load(p, key=None):
    x = json.load(open(p)); return x[key] if key else x
bars = {'btc': sorted(load(f'{D}/lab/tv-PEPPERSTONE_BTCUSD.json') + load(f'{D}/pep-1m.json', 'bars'), key=lambda b: b['t']),
        'gold': sorted(load(f'{D}/lab/tv-TVC_GOLD.json'), key=lambda b: b['t'])}
idx = {a: {b['t']: i for i, b in enumerate(B)} for a, B in bars.items()}
setl = {}
for s in load(f'{D}/kalshi-history.json')['settlements'] + load(f'{D}/kalshi-audit.json')['settlements']: setl[s['ticker']] = s.get('result')
def sess_start(ts):
    d = datetime.fromtimestamp(ts, timezone(timedelta(hours=-4)))  # ET (EDT)
    s = d.replace(hour=17, minute=0, second=0, microsecond=0)
    if d.hour < 17: s -= timedelta(days=1)
    return s.timestamp()
def view(asset, ts):
    B = bars[asset]; m = int(ts // 60 * 60); i = idx[asset].get(m)
    if i is None or i < 300: return None
    if B[i]['t'] - B[i - 300]['t'] > 300 * 60 + 600: return None  # gap in data
    tick = B[i]['c']
    S0 = sess_start(ts); five = {}
    for b in B[max(0, i - 900): i + 1]:
        k = b['t'] // 300 * 300; y = five.get(k)
        if not y: five[k] = dict(t=k, o=b['o'], h=b['h'], l=b['l'], c=b['c'], v=b['v'])
        else: y['h'] = max(y['h'], b['h']); y['l'] = min(y['l'], b['l']); y['c'] = b['c']; y['v'] += b['v']
    F = [five[k] for k in sorted(five)]
    S = [x for x in F if x['t'] >= S0]; V = sum(x['v'] for x in S)
    if len(S) < 2 or V <= 0: return None
    vw = sum((x['h'] + x['l'] + x['c']) / 3 * x['v'] for x in S) / V
    sd = math.sqrt(max(0, sum(x['v'] * ((x['h'] + x['l'] + x['c']) / 3) ** 2 for x in S) / V - vw * vw))
    ema = 0
    for j, x in enumerate(F[-60:]):
        pp = (x['h'] + x['l'] + x['c']) / 3; ema = pp if j == 0 else pp * 0.25 + ema * 0.75
    a = sum(x['h'] - x['l'] for x in F[-7:]) / 7
    Z = dict(pp=ema, r1=ema + a, r2=ema + 2 * a, s1=ema - a, s2=ema - 2 * a)
    L = [('session VWAP', vw)] + [(f'{k:+g}σ', vw + k * sd) for k in (-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3)] + [('5m PP', ema)]
    cur = F[-1]; frac = min(1, (m + 60 - cur['t']) / 300); avg = sum(x['v'] for x in F[-21:-1]) / 20
    return dict(tick=tick, L=L, sd=sd, Z=Z, o=cur['o'], h=cur['h'], l=cur['l'], pace=(cur['v'] / max(frac, 0.2)) / avg if avg > 0 else 0)
def gate(v, side):
    t, L, o = v['tick'], v['L'], v['o']
    tapped = lambda dn: any((p > t and v['h'] >= p) if dn else (p < t and v['l'] <= p) for _, p in L)
    if side == 'down' and t > o:
        b = next(((n, p) for n, p in L if o < p < t), None)
        if b and not tapped(True): return f'short a rising candle that broke up through {b[0]}'
    if side == 'up' and t < o:
        b = next(((n, p) for n, p in L if o > p > t), None)
        if b and not tapped(False): return f'long a falling candle that broke down through {b[0]}'
    room = 0.15 * v['sd']
    for n, p in L:
        if side == 'down' and o < p < t: continue
        if side == 'up' and o > p > t: continue
        if side == 'up' and 0 < p - t <= room: return f'long into {n} {p - t:.2f} above'
        if side == 'down' and 0 < t - p <= room: return f'short into {n} {t - p:.2f} below'
    Z = v['Z']; inR = Z['r1'] <= t <= Z['r2']; inG = Z['s2'] <= t <= Z['s1']
    allp = [p for _, p in L] + [Z['r1'], Z['r2'], Z['s1'], Z['s2']]; near = min(allp, key=lambda p: abs(p - t))
    intoR = side == 'up' and (inR or (t < Z['r1'] and near == Z['r1'])); intoG = side == 'down' and (inG or (t > Z['s1'] and near == Z['s1']))
    if intoR or intoG:
        lo, hi = (Z['r1'], Z['r2']) if intoR else (Z['s2'], Z['s1'])
        broke = any(lo <= p <= hi and (o < p < t if side == 'up' else o > p > t) for n, p in L if n != '5m PP')
        if not broke and v['pace'] < 2: return 'long into the red' if intoR else 'short into the green'
    n, p = min(L, key=lambda x: abs(x[1] - t))
    need = 'up' if t > p else 'down' if t < p else None
    if need and need != side: return f"{'long' if side == 'up' else 'short'} into {n} (closest band)"
    return ''
old = {x['at']: x for x in json.load(open(os.path.join(os.path.dirname(__file__), 'replay-oct14-16.json')))}
fires = [r for r in json.load(open(f'{D}/live-fires.json')) if r['at'] >= '2026-10-14T07:00' and not (r.get('setup') or '').startswith('Inverse')]
out = []
for r in sorted(fires, key=lambda r: r['at']):
    ts = datetime.fromisoformat(r['at'].replace('Z', '+00:00')).timestamp()
    v = view(r['asset'], ts); res = setl.get(r['ticker'])
    if not v or res not in ('yes', 'no'): continue
    side = r['side']; opp = 'down' if side == 'up' else 'up'
    why = gate(v, side); why_opp = gate(v, opp) if why else None
    right = (side == 'up') == (res == 'yes')
    o = old.get(r['at'], {})
    out.append(dict(pt=datetime.fromtimestamp(ts, PT).strftime('%a %I:%M %p'), asset=r['asset'], side=side, setup=r.get('setup'), why=why, flip_ok=(why and not why_opp), right=right,
                    cost=r['cost'], mult=r['multiple'], brokeOld=bool(o.get('wrongSide') or o.get('fallLong') or o.get('riseShort'))))
json.dump(out, open(os.path.join(os.path.dirname(__file__), 'replay-new-model.json'), 'w'), indent=1)
pnl = lambda x, won: x['cost'] * (x['mult'] - 1) if won else -x['cost']
def line(lab, xs, flip=False):
    if not xs: print(f'{lab}: none'); return
    w = sum(x['right'] != flip for x in xs); p = sum(pnl(x, x['right'] != flip) for x in xs)
    print(f'{lab}: {len(xs)} trades, {w} right ({100*w/len(xs):.0f}%), held-to-settle est {p:+.2f} $')
print(f'main-book live fills with her chart bars on file: {len(out)} (BTC Oct 14 12-8 AM + Oct 16 7 AM-11 PM PT, gold Oct 14 12-8 AM PT)')
line('ALL of them, as they fired', out)
line('NEW MODEL BLOCKS', [x for x in out if x['why']])
line('NEW MODEL ALLOWS', [x for x in out if not x['why']])
bk = [x for x in out if x['brokeOld']]
print(f'the backwards ones (broke closest-band / falling-candle in the first replay): {len(bk)}, new model blocks {sum(1 for x in bk if x["why"])}')
line('FLIP: blocked trades where the other side passes every rule, taken the other way', [x for x in out if x['flip_ok']], flip=True)
line('   (same trades as they actually fired)', [x for x in out if x['flip_ok']])
print('why blocked:')
import collections, re
for k, n in collections.Counter(re.sub(r'[-\d.+σ]+ ?', '', x['why']).replace('  ', ' ').strip() for x in out if x['why']).most_common(): print(f'   {n:3} {k}')
