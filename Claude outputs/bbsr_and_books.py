# READ-ONLY (Claude, Oct 18 ~9:20 AM PT, Love: "test... the extreme rsi bollinger bands... instead of using the red and green clouds" + "go through
# all of the NEW ones... the PAPER24/7 derivatives and let me know which one is doing best, if any of them are firing backwards").
# Vantage BTC 1m bars -> 5m. Her framework bands: session VWAP +/-1/2/3 sigma (5 PM ET anchor, 5m hlc3, carry-over) + pink (EMA7 hlc3).
# BBSR (her Pine v4): BB(20 close, 2.0) on 5m; StochRSI K=sma(stoch(rsi14),14),3), D=sma(K,3); Bear = close[1]>upper[1] and close<upper and
# K[1],D[1]>90; Bull = close[1]<lower[1] and close>lower and K[1],D[1]<10. P&L = each trade's own paper result.
import json, re, math, sys, collections
from datetime import datetime, timezone, timedelta
D = sys.argv[1]; PT = timezone(timedelta(hours=-7))
bars = {}
for f in (f'{D}/lab/tv-VANTAGE_BTCUSD.json', f'{D}/van-1m.json'):
    try:
        x = json.load(open(f)); x = x['bars'] if isinstance(x, dict) else x
        for b in x: bars[b['t']] = b
    except Exception: pass
T = sorted(bars)
F5 = {}
for t in T:
    b = bars[t]; k = t // 300 * 300; y = F5.get(k)
    if not y: F5[k] = dict(t=k, o=b['o'], h=b['h'], l=b['l'], c=b['c'], v=b.get('v', 0))
    else: y['h'] = max(y['h'], b['h']); y['l'] = min(y['l'], b['l']); y['c'] = b['c']; y['v'] += b.get('v', 0)
K5 = sorted(F5); C5 = [F5[k]['c'] for k in K5]
# --- indicators on CLOSED 5m candles
def sma(a, n, i): return sum(a[i - n + 1:i + 1]) / n if i >= n - 1 else None
def rsi_series(c, n=14):
    out = [None] * len(c); g = l = 0.0
    for i in range(1, len(c)):
        ch = c[i] - c[i - 1]; up = max(ch, 0); dn = max(-ch, 0)
        if i <= n: g += up; l += dn
        if i == n: g /= n; l /= n
        if i > n: g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n
        if i >= n: out[i] = 100 if l == 0 else 100 - 100 / (1 + g / l)
    return out
R = rsi_series(C5)
ST = [None] * len(C5)
for i in range(len(C5)):
    w = [r for r in R[max(0, i - 13):i + 1] if r is not None]
    if len(w) == 14: lo, hi = min(w), max(w); ST[i] = 0 if hi == lo else 100 * (R[i] - lo) / (hi - lo)
Kk = [None] * len(C5); Dd = [None] * len(C5)
for i in range(len(C5)):
    w = ST[max(0, i - 2):i + 1]
    if len(w) == 3 and None not in w: Kk[i] = sum(w) / 3
    w2 = Kk[max(0, i - 2):i + 1]
    if len(w2) == 3 and None not in w2: Dd[i] = sum(w2) / 3
UP = [None] * len(C5); LO = [None] * len(C5)
for i in range(19, len(C5)):
    w = C5[i - 19:i + 1]; m = sum(w) / 20; sd = math.sqrt(sum((x - m) ** 2 for x in w) / 20); UP[i] = m + 2 * sd; LO[i] = m - 2 * sd
SIG = {}
for i in range(20, len(C5)):
    if None in (UP[i - 1], UP[i], Kk[i - 1], Dd[i - 1]): continue
    if C5[i - 1] > UP[i - 1] and C5[i] < UP[i] and Kk[i - 1] > 90 and Dd[i - 1] > 90: SIG[K5[i] + 300] = 'bear'   # known when candle i closes
    if C5[i - 1] < LO[i - 1] and C5[i] > LO[i] and Kk[i - 1] < 10 and Dd[i - 1] < 10: SIG[K5[i] + 300] = 'bull'
IDX = {k: i for i, k in enumerate(K5)}
def bb_at(ts):  # bands of the last CLOSED 5m candle
    k = int(ts // 300 * 300) - 300; i = IDX.get(k)
    return (UP[i], LO[i]) if i is not None and UP[i] else (None, None)
# --- her framework bands at a moment
def sess_start(ts):
    d = datetime.fromtimestamp(ts, timezone(timedelta(hours=-4))); s0 = d.replace(hour=17, minute=0, second=0, microsecond=0)
    if d.hour < 17: s0 -= timedelta(days=1)
    return int(s0.timestamp())
def vwap_sd(s0, s1, upto):
    S = [F5[k] for k in K5 if k >= s0 and k < upto and (s1 is None or k < s1)]; V = sum(x['v'] for x in S)
    if len(S) < 8 or V <= 0: return None
    vw = sum((x['h'] + x['l'] + x['c']) / 3 * x['v'] for x in S) / V
    return vw, math.sqrt(max(0, sum(x['v'] * ((x['h'] + x['l'] + x['c']) / 3) ** 2 for x in S) / V - vw * vw))
def view(ts, tick):
    k0 = int(ts // 300 * 300)
    if k0 - 300 not in F5: return None
    s0 = sess_start(ts); cur = vwap_sd(s0, None, k0 + 300); prev = vwap_sd(sess_start(s0 - 60), s0, s0)
    if prev and (not cur or cur[1] < 0.5 * prev[1]): cur = prev
    if not cur: return None
    vw, sd = cur
    L = [('session VWAP', vw)] + [(f'{k:+d}σ', vw + k * sd) for k in (-3, -2, -1, 1, 2, 3)]
    ema = None
    for k in [k for k in K5 if k <= k0][-60:]:
        x = F5[k]; pp = (x['h'] + x['l'] + x['c']) / 3; ema = pp if ema is None else pp * 0.25 + ema * 0.75
    L.append(('pink', ema))
    c = F5.get(k0) or F5[k0 - 300]
    ws = int(ts // 900 * 900); target = bars[ws]['o'] if ws in bars else None
    return dict(L=L, o=c['o'], h=max(c['h'], tick), l=min(c['l'], tick), target=target)
def judge(v, tick, side, extra=()):
    W = v['L'] + list(extra); o, hi, lo = v['o'], v['h'], v['l']
    for n, p in W:
        if side == 'down' and o < p and (tick > p or hi >= p + 8): return 'break against her this candle'
        if side == 'up' and o > p and (tick < p or lo <= p - 8): return 'break against her this candle'
    for n, p in W:
        if side == 'down' and lo <= p + 3 and lo > p - 8 and tick >= p + 8: return 'rejection this candle'
        if side == 'up' and hi >= p - 3 and hi < p + 8 and tick <= p - 8: return 'rejection this candle'
    above = min([p for _, p in W if p > tick], default=None); below = max([p for _, p in W if p < tick], default=None)
    if above and below:
        if side == 'up' and above - tick < tick - below: return 'closest band'
        if side == 'down' and tick - below < above - tick: return 'closest band'
    t = v['target']
    if t and not (side == 'up' and tick >= t) and not (side == 'down' and tick <= t):
        if any(min(tick, t) < p < max(tick, t) for _, p in W): return 'band before the target'
    n, p = min(W, key=lambda x: abs(x[1] - tick))
    if n not in ('pink',) and not n.startswith('BB') and abs(p - tick) < 8: return 'at a session band ($8 wait)'
    return ''
def st(xs):
    w = sum(1 for x in xs if x['pnl'] > 0.05); l = sum(1 for x in xs if x['pnl'] < -0.05)
    return f"{len(xs):3d}  {w:3d}-{l:<3d} ({100 * w / max(1, w + l):3.0f}%)  ${sum(x['pnl'] for x in xs):+8.2f}"
# --- rows
rows = {}
s = open(f'{D}/grok-og.json').read()
for r in json.loads(s): rows[r['id']] = r
for l in open(f'{D}/grok-og-archive.jsonl'):
    try: r = json.loads(l); rows.setdefault(r['id'], r)
    except Exception: pass
NB = {}
for r in json.load(open(f'{D}/night-book.json')): NB[r['id']] = r
def ts_of(r): return datetime.fromisoformat(r['at'].replace('Z', '+00:00')).timestamp()
def tick_of(r):
    t = ts_of(r); sp = (r.get('band') or {}).get('spot')
    return sp or (bars.get(int(t // 60 * 60)) or {}).get('c')
MODE = sys.argv[2] if len(sys.argv) > 2 else 'all'
if MODE in ('all', 'bb'):
    print('=== TEST 1: BBSR BANDS AS A REFERENCE (week: ogp5-fast + ogp5-sess BTC, Oct 15-18) ===')
    WK = sorted([r for r in rows.values() if r.get('lane') in ('ogp5-fast', 'ogp5-sess') and r.get('asset') == 'btc' and r.get('pnl') is not None and r['at'] >= '2026-10-15'], key=lambda r: r['at'])
    base_k = []; bb_k = []; n0 = 0; flips = collections.Counter()
    for r in WK:
        t = ts_of(r); tick = tick_of(r)
        v = view(t, tick) if tick else None
        if not v: continue
        n0 += 1
        u, lw = bb_at(t); extra = [('BB upper', u), ('BB lower', lw)] if u else []
        a = judge(v, tick, r['side']); b = judge(v, tick, r['side'], extra)
        if not a: base_k.append(r)
        if not b: bb_k.append(r)
        if bool(a) != bool(b): flips['newly blocked by BB' if b else 'newly allowed'] += 1
    print(' judged', n0, '| current framework keeps:', st(base_k))
    print('              + BB bands keeps:', st(bb_k), '|', dict(flips))
    blk = [r for r in base_k if r not in bb_k]; print('   trades the BB bands would have blocked:', st(blk))
    print('\n=== TEST 2: BBSR EXTREME SIGNALS ===')
    hits = collections.Counter()
    for k, sgn in SIG.items():
        ws = (k // 900) * 900 + 900  # window that closes after the signal's window
        e = bars.get(k) or bars.get(k + 60); x = bars.get(k + 900 - 60) or bars.get(k + 840)
        if not e or not x: continue
        moved = x['c'] - e['o']; good = (moved < 0) if sgn == 'bear' else (moved > 0)
        hits[(sgn, good)] += 1
    for sgn in ('bull', 'bear'):
        g, b = hits[(sgn, True)], hits[(sgn, False)]
        print(f'  {sgn.upper()} signals: {g + b}  price went its way over the next 15 min: {g} ({100 * g / max(1, g + b):.0f}%)')
    withS = []; againstS = []
    for r in WK:
        t = ts_of(r); recent = [(k, s2) for k, s2 in SIG.items() if 0 <= t - k <= 900]
        if not recent: continue
        s2 = sorted(recent)[-1][1]
        (withS if (s2 == 'bull') == (r['side'] == 'up') else againstS).append(r)
    print('  her trades within 15 min after a signal, WITH it:   ', st(withS))
    print('  her trades within 15 min after a signal, AGAINST it:', st(againstS))
if MODE in ('all', 'books'):
    print('\n=== TEST 3: EVERY NEW / PAPER 24/7 BOOK SINCE 6:05 PM OCT 17 (BTC, settled) - backwards = into the closest band / against a break or rejection this candle ===')
    since = '2026-10-18T01:05'
    allr = [r for r in rows.values() if r.get('at', '') >= since and r.get('asset') == 'btc' and r.get('pnl') is not None and r.get('result') not in ('open', None)]
    allr += [dict(r, lane=r.get('book')) for r in NB.values() if r.get('at', '') >= since and r.get('asset') == 'btc' and r.get('pnl') is not None and r.get('result') != 'open' and not r.get('dnaMode') and not r.get('stale')]
    NEW = ['ogp5-sess', 'ogp5-c1', 'ogp5-c5', 'ogp5-hrs', 'ogp5-fast', 'ogp5-r15', 'ogp5-r30', 'ogp5-cb', 'ogp5-gw', 'ogp5-boll', 'ogp5-lock', 'ogp5-btco', 'ogp5-pv', 'brk-sess', 'brk5', 'brk10', 'brk15', 'piv2', 'sp2', 'ogp2', 'ogp5', 'sp5', 'piv5', 'ogp15', 'sp15', 'paper-247', 'paper-20', 'paper-best', 'paper-winners', 'paper-piv', 'open-road', 'ogp5-inv']
    by = collections.defaultdict(list)
    for r in allr:
        if r.get('lane') in NEW: by[r['lane']].append(r)
    out = []
    for lane, xs in by.items():
        bw = collections.Counter(); nj = 0
        for r in xs:
            t = ts_of(r); tick = tick_of(r); v = view(t, tick) if tick else None
            if not v: continue
            nj += 1; why = judge(v, tick, r['side'])
            if why in ('closest band', 'break against her this candle', 'rejection this candle'): bw[why] += 1
        w = sum(1 for x in xs if x['pnl'] > 0.05); l = sum(1 for x in xs if x['pnl'] < -0.05)
        out.append((sum(x['pnl'] for x in xs), lane, len(xs), w, l, nj, bw))
    print(f" {'book':14s} trades  W-L    win%    P&L(paper)   backwards (of judged)")
    for p, lane, n, w, l, nj, bw in sorted(out, reverse=True):
        print(f" {lane:14s} {n:5d}  {w:3d}-{l:<3d} {100 * w / max(1, w + l):4.0f}%  {p:+9.2f}    {sum(bw.values())}/{nj}  {dict(bw) if bw else ''}")
