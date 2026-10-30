# READ-ONLY (Claude, Oct 17 ~2:05 AM PT, Love: "if it's not there definitely add it in" + "yesssss maam, precisely"). Every live bot
# BTC fill since Oct 13 evening, judged on her chart (VANTAGE 1m bars): target = Vantage price at the window's open; walls = session
# VWAP + sigma bands (5 PM ET, 5m, hlc3) + the 5m pink (EMA7 hlc3, forming candle in). Blocked if an unbroken wall sits between price and
# the target. Broken (approx): the live 5m candle pushed $8+ through it in the trade's direction and price hasn't come back over it.
import json, math, sys
from datetime import datetime, timezone, timedelta
D = sys.argv[1]; PT = timezone(timedelta(hours=-7))
B = {}
for f in (f'{D}/lab/tv-VANTAGE_BTCUSD.json', f'{D}/van-1m.json'):
    x = json.load(open(f)); x = x['bars'] if isinstance(x, dict) else x
    for b in x: B[b['t']] = b
B = [B[t] for t in sorted(B)]; I = {b['t']: i for i, b in enumerate(B)}
setl = {s['ticker']: s.get('result') for s in json.load(open(f'{D}/kalshi-history.json'))['settlements']}
banked = {}
for x in json.load(open(f'{D}/fill-log.json')):
    if x.get('kind') == 'banked' and x.get('profit') is not None: banked[x['ticker']] = banked.get(x['ticker'], 0) + float(x['profit'])
def sess_start(ts):
    d = datetime.fromtimestamp(ts, timezone(timedelta(hours=-4))); s = d.replace(hour=17, minute=0, second=0, microsecond=0)
    if d.hour < 17: s -= timedelta(days=1)
    return s.timestamp()
def view(ts):
    m = int(ts // 60 * 60); i = I.get(m)
    if i is None or i < 300 or B[i]['t'] - B[i - 300]['t'] > 300 * 60 + 600: return None
    S0 = sess_start(ts); five = {}
    for b in B[max(0, i - 900): i + 1]:
        k = b['t'] // 300 * 300; y = five.get(k)
        if not y: five[k] = dict(t=k, o=b['o'], h=b['h'], l=b['l'], c=b['c'], v=b['v'])
        else: y['h'] = max(y['h'], b['h']); y['l'] = min(y['l'], b['l']); y['c'] = b['c']; y['v'] += b['v']
    F = [five[k] for k in sorted(five)]; S = [x for x in F if x['t'] >= S0]; V = sum(x['v'] for x in S)
    if len(S) < 2 or V <= 0: return None
    vw = sum((x['h'] + x['l'] + x['c']) / 3 * x['v'] for x in S) / V
    sd = math.sqrt(max(0, sum(x['v'] * ((x['h'] + x['l'] + x['c']) / 3) ** 2 for x in S) / V - vw * vw))
    ema = 0
    for j, x in enumerate(F[-60:]):
        pp = (x['h'] + x['l'] + x['c']) / 3; ema = pp if j == 0 else pp * 0.25 + ema * 0.75
    L = [('session VWAP', vw)] + [(f'{k:+g}σ', vw + k * sd) for k in (-3, -2.5, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5, 3)] + [('pink', ema)]
    ws = int(ts // 900 * 900); w = I.get(ws)
    return dict(tick=B[i]['c'], L=L, cur=F[-1], target=B[w]['o'] if w is not None else 0)
def blocks(v, side):
    t, tg, c = v['tick'], v['target'], v['cur']
    if not tg or (t >= tg if side == 'up' else t <= tg): return None
    lo, hi = min(t, tg), max(t, tg)
    for n, p in sorted(v['L'], key=lambda x: abs(x[1] - t)):
        if not (lo < p < hi): continue
        broken = (side == 'up' and c['h'] >= p + 8 and t < p) or (side == 'down' and c['l'] <= p - 8 and t > p)
        if not broken: return f"{n} {p:,.2f} between price {t:,.2f} and target {tg:,.2f}"
    return None
fires = [r for r in json.load(open(f'{D}/live-fires.json')) if r['asset'] == 'btc' and r['at'] >= '2026-10-13T20:00' and 'nverse' not in (r.get('setup') or '') and r.get('book') != 'ogp5-inv']
rows = []
for r in sorted(fires, key=lambda r: r['at']):
    ts = datetime.fromisoformat(r['at'].replace('Z', '+00:00')).timestamp(); v = view(ts); res = setl.get(r['ticker'])
    if not v: continue
    why = blocks(v, r['side']); win = None if res not in ('yes', 'no') else ((r['side'] == 'up') == (res == 'yes'))
    paid = float(r.get('cost') or 0); mult = float(r.get('multiple') or 0)
    pnl = None if win is None else (paid * (mult - 1) if win else -paid)
    if r['ticker'] in banked: pnl = banked[r['ticker']]; win = pnl > 0
    rows.append(dict(pt=datetime.fromtimestamp(ts, PT).strftime('%a %b %d %I:%M %p'), book=r.get('book'), side=r['side'], setup=r.get('setup'), blocked=why, win=win, pnl=pnl, cost=paid))
json.dump(rows, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
def summ(rs):
    k = [x for x in rs if x['win'] is not None]; w = sum(1 for x in k if x['win']); p = sum(x['pnl'] for x in k)
    return f"{len(rs)} fills, {len(k)} settled: {w}-{len(k) - w} ({(100 * w / len(k)) if k else 0:.0f}%), P&L ${p:+,.2f}"
bl = [x for x in rows if x['blocked']]; ok = [x for x in rows if not x['blocked']]
print('ALL     ', summ(rows)); print('BLOCKED ', summ(bl)); print('KEPT    ', summ(ok))
print('--- tonight (since 12:00 AM PT)')
for x in rows:
    if x['pt'].startswith('Sat'): print(x['pt'], x['side'], (x['setup'] or '')[:40], 'WIN' if x['win'] else 'LOSS' if x['win'] is False else 'open', f"${x['pnl']:+.2f}" if x['pnl'] is not None else '', '| BLOCKED:' if x['blocked'] else '| ok', x['blocked'] or '')
