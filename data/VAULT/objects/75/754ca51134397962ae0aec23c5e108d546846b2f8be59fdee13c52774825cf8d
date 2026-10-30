#!/usr/bin/env python3
"""STRATEGY LAB PAPER BOOKS (Oct 28 2026). Love Oct 27 11:58 PM PT: "let's test out my 8 & 33 crossover on paper ... anything else aside from
these you can think of that we can get going on paper this week bb?" Love's card Oct 28 12:18 AM PT: "Yes, all of them on paper".
PAPER ONLY, READ-ONLY on the desk: reads data/pivot-gold5.json, data/pivot-btc5.json and data/snipes/ (Kalshi prices), writes only data/lab/.
Never touches recon.ts, bandlock.ts, engine.ts, live-switch.json, liveBook.books, or any book (main, rejection, copies, twins, Poly 5M).
Books ($5 paper each, every hour, decided at the window open from finished candles):
  lab-gsnap     Gold Snapback: RSI(2) of 5m closes under 15 = up / over 85 = down, next gold 15M window
  lab-gboll15   Gold Bollinger fade: 5m close outside 20-bar 2 sigma, fade it, next gold 15M window
  lab-gboll1h   Gold Bollinger fade on 1h candles, next 1H window
  lab-bboll5    BTC Bollinger fade on 5m candles, next 5M window (paper only, not the Poly 5M)
  lab-vw833b4h  Love's VWMA 8/33 cross on 4h candles, first 4 BTC 4H windows after a cross
  lab-vw833g1h  Love's VWMA 8/33 cross on 1h candles, next gold 1H window after a cross
  lab-vw821g1h  VWMA 8/21 cross on 1h candles, next gold 1H window after a cross
  lab-reelg15 / lab-reelb15  The reel (Love Oct 28 12:18 AM PT transcript, "no need for the stop loss on this one either"): EMA 9 crosses the
                daily anchored VWAP (day starts 6 PM ET) on 5m candles, take the cross direction in the next 15M window, no stop, held to settlement
15M windows with Kalshi price paths use the REAL ask ~10 s after the open and the real winner; others use 50c and candle close vs open."""
import json, os, math, bisect, datetime, collections
from zoneinfo import ZoneInfo
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = lambda *p: os.path.join(ROOT, 'data', *p)
PT = ZoneInfo('America/Los_Angeles'); OUT = D('lab'); os.makedirs(OUT, exist_ok=True)
STAKE = 5.0; START = 1793170800  # 2026-10-28 00:00 PT: paper week starts here

def bars(f):
    d = json.load(open(D(f)))
    b = d if isinstance(d, list) else d.get('bars') or next(v for v in d.values() if isinstance(v, list))
    return sorted({x['t']: x for x in b}.values(), key=lambda x: x['t'])
def resample(b, sec):
    out = []; cur = None
    for x in b:
        k = x['t'] - x['t'] % sec
        if cur is None or cur['t'] != k:
            if cur: out.append(cur)
            cur = dict(t=k, o=x['o'], h=x['h'], l=x['l'], c=x['c'], v=x['v'], n=1)
        else:
            cur['h'] = max(cur['h'], x['h']); cur['l'] = min(cur['l'], x['l']); cur['c'] = x['c']; cur['v'] += x['v']; cur['n'] += 1
    if cur: out.append(cur)
    return out
def vwma(b, n):
    o = [None] * len(b); pv = v = 0
    for i, x in enumerate(b):
        pv += x['c'] * x['v']; v += x['v']
        if i >= n: pv -= b[i-n]['c'] * b[i-n]['v']; v -= b[i-n]['v']
        if i >= n - 1 and v > 0: o[i] = pv / v
    return o
def rsi2(b):
    o = [None] * len(b); ag = al = None
    for i in range(1, len(b)):
        d = b[i]['c'] - b[i-1]['c']; g, l = max(d, 0), max(-d, 0)
        if ag is None: ag, al = g, l
        else: ag = (ag + g) / 2; al = (al + l) / 2
        if i >= 2: o[i] = 100 if al == 0 else 100 - 100 / (1 + ag / al)
    return o
def ema9(b):
    o = [None] * len(b); e = None; k = 0.2
    for i, x in enumerate(b):
        e = x['c'] if e is None else x['c'] * k + e * (1 - k); o[i] = e if i >= 8 else None
    return o
def avwap(b, off=6 * 3600):
    o = []; day = None; pv = v = 0
    for x in b:
        d = (x['t'] + off) // 86400
        if d != day: day = d; pv = v = 0
        pv += (x['h'] + x['l'] + x['c']) / 3 * x['v']; v += x['v']; o.append(pv / v if v else x['c'])
    return o
def reel_sig(tf, t, look=3):
    e = tf.get('ema9', ema9); w = tf.get('avwap', avwap); i = tf.last(t)
    if i < 1 or e[i] is None: return 0
    for j in range(i, max(0, i - look), -1):
        if e[j-1] is None: return 0
        if (e[j] > w[j]) != (e[j-1] > w[j-1]): return 1 if e[i] > w[i] else -1
    return 0
def boll(b, i, n=20, k=2):
    if i < n - 1: return 0
    cl = [x['c'] for x in b[i-n+1:i+1]]; m = sum(cl) / n; sd = (sum((c - m) ** 2 for c in cl) / n) ** .5
    p = b[i]['c']; return -1 if p > m + k * sd else 1 if p < m - k * sd else 0

class TF:
    def __init__(s, base, sec):
        s.sec = sec; s.b = base if sec == 300 else [x for x in resample(base, sec) if x['n'] == sec // 300 or x is None]
        s.t = [x['t'] for x in s.b]; s.cache = {}
    def last(s, t):  # last candle finished by time t
        return bisect.bisect_right(s.t, t - s.sec) - 1
    def get(s, k, fn):
        if k not in s.cache: s.cache[k] = fn(s.b)
        return s.cache[k]
def cross_sig(tf, t, f, sl, look):
    a = tf.get(('vw', f), lambda b: vwma(b, f)); c = tf.get(('vw', sl), lambda b: vwma(b, sl)); i = tf.last(t)
    if i < 1 or a[i] is None or c[i] is None: return 0
    for j in range(i, max(0, i - look), -1):
        if a[j-1] is None or c[j-1] is None: return 0
        if (a[j] > c[j]) != (a[j-1] > c[j-1]): return 1 if a[i] > c[i] else -1
    return 0

# Kalshi 15M real prices
kal = {}
try:
    for l in open(D('snipes', 'windows.jsonl')):
        w = json.loads(l); t0 = int(datetime.datetime.fromisoformat(w['close']).timestamp() + 60 - 900)
        kal[(w['asset'], t0)] = w
except Exception: pass
def kalshi_px(asset, t0, side):
    w = kal.get((asset, t0))
    if not w: return None, None
    try: P = json.load(open(D('snipes', 'paths', w['ticker'] + '.json')))
    except Exception: return None, w.get('won')
    q = [x for x in P if x[0] >= t0 + 10 and x[1] and x[2]]
    if not q or q[0][0] > t0 + 60: return None, w.get('won')
    return min(0.99, (q[0][1] if side == 'up' else q[0][2]) + 0.01), w.get('won') if w.get('won') in ('up', 'down') else None

base = {'gold': bars('pivot-gold5.json'), 'btc': bars('pivot-btc5.json')}
tfs = {(a, s): TF(base[a], s) for a in base for s in (300, 3600, 14400)}
def snap(a, t):
    tf = tfs[(a, 300)]; r = tf.get('rsi2', rsi2); i = tf.last(t)
    return 0 if i < 0 or r[i] is None else 1 if r[i] < 15 else -1 if r[i] > 85 else 0
BOOKS = {
    'lab-gsnap':    ('gold', 900,   lambda t: snap('gold', t)),
    'lab-gboll15':  ('gold', 900,   lambda t: boll(tfs[('gold', 300)].b, tfs[('gold', 300)].last(t))),
    'lab-gboll1h':  ('gold', 3600,  lambda t: boll(tfs[('gold', 3600)].b, tfs[('gold', 3600)].last(t))),
    'lab-bboll5':   ('btc', 300,    lambda t: boll(tfs[('btc', 300)].b, tfs[('btc', 300)].last(t))),
    'lab-vw833b4h': ('btc', 14400,  lambda t: cross_sig(tfs[('btc', 14400)], t, 8, 33, 4)),
    'lab-vw833g1h': ('gold', 3600,  lambda t: cross_sig(tfs[('gold', 3600)], t, 8, 33, 1)),
    'lab-vw821g1h': ('gold', 3600,  lambda t: cross_sig(tfs[('gold', 3600)], t, 8, 21, 1)),
    'lab-reelg15':  ('gold', 900,   lambda t: reel_sig(tfs[('gold', 300)], t)),
    'lab-reelb15':  ('btc', 900,    lambda t: reel_sig(tfs[('btc', 300)], t)),
}
NAME = {'lab-gsnap': 'Gold Snapback (15M)', 'lab-gboll15': 'Gold Bollinger fade (15M)', 'lab-gboll1h': 'Gold Bollinger fade (1H)',
        'lab-bboll5': 'BTC Bollinger fade (5M)', 'lab-vw833b4h': "Love's VWMA 8/33 (BTC 4H)", 'lab-vw833g1h': "Love's VWMA 8/33 (gold 1H)", 'lab-vw821g1h': 'VWMA 8/21 (gold 1H)',
        'lab-reelg15': 'Reel EMA 9 x VWAP (gold 15M)', 'lab-reelb15': 'Reel EMA 9 x VWAP (BTC 15M)'}
rows = []
for book, (a, wsec, fn) in BOOKS.items():
    b5 = base[a]; t5 = {x['t']: x for x in b5}; last = b5[-1]['t'] + 300 if b5 else 0
    t0 = START - START % wsec
    while t0 + wsec <= last + wsec:
        if t0 >= START and t0 in t5:
            d = fn(t0)
            if d:
                side = 'up' if d > 0 else 'down'; ask, won, src = None, None, 'candles'
                if wsec == 900:
                    ask, won = kalshi_px(a, t0, side)
                    if ask: src = 'kalshi'
                if ask is None: ask = 0.5
                end = t0 + wsec
                if won is None and end <= last:
                    o = t5[t0]['o']; cl = [t5[t]['c'] for t in range(end - 300, end - 299) if t in t5]
                    if cl: won = 'up' if cl[0] > o else 'down'
                n = STAKE / ask; fee = math.ceil(0.07 * n * ask * (1 - ask) * 100) / 100
                res = 'open' if won is None else 'win' if won == side else 'loss'
                pnl = 0.0 if res == 'open' else round(n - STAKE - fee, 2) if res == 'win' else round(-STAKE - fee, 2)
                at = datetime.datetime.fromtimestamp(t0, PT)
                rows.append(dict(book=book, asset=a, window=t0, at=at.strftime('%a %b %d %I:%M %p'), hour=at.hour, side=side, ask=round(ask, 2), src=src, result=res, pnl=pnl))
        t0 += wsec
rows.sort(key=lambda r: (r['window'], r['book']))
with open(os.path.join(OUT, 'ledger.jsonl'), 'w') as fo:
    for r in rows: fo.write(json.dumps(r) + '\n')
tot = collections.defaultdict(lambda: [0, 0, 0.0]); hr = collections.defaultdict(lambda: [0, 0, 0.0])
for r in rows:
    if r['result'] == 'open': continue
    for d, k in ((tot, r['book']), (hr, (r['book'], r['hour']))):
        d[k][0] += 1; d[k][1] += r['result'] == 'win'; d[k][2] += r['pnl']
now = datetime.datetime.now(PT).strftime('%a %b %d %I:%M %p')
L = ['# Strategy lab paper books', '', f'Paper only, $5 each, since Wed Oct 28 12:00 AM PT. Updated {now} PT. Break-even is about 52% at 50c.', '',
     '| Book | Trades | Won | Win rate | P&L |', '|---|---|---|---|---|']
for b in BOOKS:
    n, w, p = tot.get(b, [0, 0, 0.0])
    L.append(f"| {NAME[b]} | {n} | {w} | {f'{100*w/n:.0f}%' if n else '-'} | ${p:+.2f} |")
L += ['', '## By hour (PT)', '', '| Book | Hour | Trades | Win rate | P&L |', '|---|---|---|---|---|']
for (b, h), (n, w, p) in sorted(hr.items()):
    L.append(f"| {NAME[b]} | {datetime.time(h).strftime('%I %p').lstrip('0')} | {n} | {100*w/n:.0f}% | ${p:+.2f} |")
open(os.path.join(OUT, 'REPORT.md'), 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[:14]))
